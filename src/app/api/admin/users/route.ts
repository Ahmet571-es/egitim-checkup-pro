/**
 * /api/admin/users
 *
 * Admin panelindeki kullanıcı yönetimi için merkezi endpoint.
 *
 * Actions:
 *  - list            → tüm kullanıcıları listele (filtre + arama ile)
 *  - toggle_approval → öğretmen is_approved toggle (auth.users metadata + profiles)
 *  - delete_user     → kullanıcıyı tamamen sil (cascade ile profiles+test_results otomatik)
 *
 * Auth:
 *  - Çağıran MUTLAKA admin rolünde olmalı
 *  - CSRF korumalı (proxy middleware halleder)
 *
 * Admin client kullanıyoruz çünkü:
 *  - auth.users.user_metadata güncelleme service role gerektirir
 *  - auth.users DELETE service role gerektirir
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { listAllAuthUsers } from '@/lib/auth/admin-users';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Role = 'admin' | 'school_admin' | 'teacher' | 'student' | 'parent';

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  branch: string | null;
  phone: string;
  grade: string | null;
  is_graduated: boolean;
  is_approved: boolean;
  is_active: boolean;
  assigned_teacher_id: string | null;
  created_at: string;
}

export async function POST(req: NextRequest) {
  try {
    // ── 1) Çağıranın admin olduğunu doğrula ──
    const userClient = await createClient();
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 });
    }

    // Role profiles tablosundan (metadata güvenilmez — admin sonradan rol değiştirilebilir)
    const { data: callerProfile } = await userClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (!callerProfile || callerProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Sadece yöneticiler erişebilir.' }, { status: 403 });
    }

    // ── 2) Body ve action ──
    const body = await req.json().catch(() => ({}));
    const { action } = body;

    const admin = createAdminClient();

    // ─────────────────────────────────────────────────────────
    // LIST: Tüm kullanıcıları getir
    // ─────────────────────────────────────────────────────────
    if (action === 'list') {
      const { role: filterRole, search, approval_status } = body as {
        role?: Role | 'all';
        search?: string;
        approval_status?: 'all' | 'approved' | 'pending';
      };

      // Profiles tablosundan temel veri
      let profilesQuery = admin
        .from('profiles')
        .select('id, full_name, email, role, branch, phone, grade, is_graduated, is_approved, is_active, created_at')
        .order('created_at', { ascending: false });

      if (filterRole && filterRole !== 'all') {
        profilesQuery = profilesQuery.eq('role', filterRole);
      }

      const { data: profiles, error: profilesErr } = await profilesQuery;
      if (profilesErr) {
        return NextResponse.json({ error: profilesErr.message }, { status: 500 });
      }

      // Auth metadata'dan assigned_teacher_id (öğrenciler için)
      const authUsers = await listAllAuthUsers(admin);
      const metaMap = new Map<string, Record<string, unknown>>();
      (authUsers || []).forEach((u) => metaMap.set(u.id, u.user_metadata || {}));

      // Birleştir
      let rows: UserRow[] = (profiles || []).map((p) => {
        const meta = metaMap.get(p.id) || {};
        return {
          id: p.id,
          full_name: p.full_name || '',
          email: p.email || '',
          role: p.role as Role,
          branch: p.branch || null,
          phone: p.phone || '',
          grade: p.grade || null,
          is_graduated: !!p.is_graduated,
          is_approved: p.is_approved ?? true,
          is_active: p.is_active ?? true,
          assigned_teacher_id: (meta.assigned_teacher_id as string) || null,
          created_at: p.created_at,
        };
      });

      // Arama (ad-soyad veya email)
      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        rows = rows.filter(
          (r) =>
            r.full_name.toLowerCase().includes(q) ||
            r.email.toLowerCase().includes(q)
        );
      }

      // Onay filtresi (sadece öğretmenler için anlamlı)
      if (approval_status === 'approved') {
        rows = rows.filter((r) => r.is_approved);
      } else if (approval_status === 'pending') {
        rows = rows.filter((r) => !r.is_approved);
      }

      // İstatistikler (filtresiz — toplam sayılar için)
      const stats = {
        total: (profiles || []).length,
        students: (profiles || []).filter((p) => p.role === 'student').length,
        teachers: (profiles || []).filter((p) => p.role === 'teacher').length,
        school_admins: (profiles || []).filter((p) => p.role === 'school_admin').length,
        pending_teachers: (profiles || []).filter(
          (p) => p.role === 'teacher' && p.is_approved === false
        ).length,
      };

      return NextResponse.json({ users: rows, stats });
    }

    // ─────────────────────────────────────────────────────────
    // TOGGLE_APPROVAL: Öğretmen onay durumunu değiştir
    // ─────────────────────────────────────────────────────────
    if (action === 'toggle_approval') {
      const { user_id, approved } = body as { user_id: string; approved: boolean };

      if (!user_id || typeof approved !== 'boolean') {
        return NextResponse.json(
          { error: 'user_id ve approved zorunlu.' },
          { status: 400 }
        );
      }

      // Hedef kullanıcıyı doğrula
      const { data: target } = await admin
        .from('profiles')
        .select('id, role')
        .eq('id', user_id)
        .maybeSingle();

      if (!target) {
        return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });
      }

      if (target.role !== 'teacher') {
        return NextResponse.json(
          { error: 'Onay sistemi yalnızca öğretmenler için geçerli.' },
          { status: 400 }
        );
      }

      // auth.users user_metadata güncelle (giriş sırasında okunuyor)
      const { data: authUser } = await admin.auth.admin.getUserById(user_id);
      const currentMeta = authUser?.user?.user_metadata || {};
      const { error: authErr } = await admin.auth.admin.updateUserById(user_id, {
        user_metadata: { ...currentMeta, is_approved: approved },
      });

      if (authErr) {
        return NextResponse.json({ error: authErr.message }, { status: 500 });
      }

      // profiles tablosunda is_approved güncelle (admin panelinde okunuyor)
      const { error: profileErr } = await admin
        .from('profiles')
        .update({ is_approved: approved })
        .eq('id', user_id);

      if (profileErr) {
        return NextResponse.json({ error: profileErr.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, user_id, approved });
    }

    // ─────────────────────────────────────────────────────────
    // DELETE_USER: Kullanıcıyı tamamen sil
    // ─────────────────────────────────────────────────────────
    if (action === 'delete_user') {
      const { user_id } = body as { user_id: string };

      if (!user_id) {
        return NextResponse.json({ error: 'user_id zorunlu.' }, { status: 400 });
      }

      // Kendini silmeyi engelle
      if (user_id === user.id) {
        return NextResponse.json(
          { error: 'Kendi hesabınızı buradan silemezsiniz.' },
          { status: 400 }
        );
      }

      // Hedef kullanıcıyı doğrula (başka admin silinemez — sadece loglanır değil, engellenir)
      const { data: target } = await admin
        .from('profiles')
        .select('id, role, full_name')
        .eq('id', user_id)
        .maybeSingle();

      if (!target) {
        return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });
      }

      if (target.role === 'admin') {
        return NextResponse.json(
          { error: 'Yönetici hesaplarını bu panelden silemezsiniz.' },
          { status: 403 }
        );
      }

      // auth.users sil → profiles CASCADE ile otomatik silinir
      // (profiles.id → auth.users.id ON DELETE CASCADE var)
      const { error: delErr } = await admin.auth.admin.deleteUser(user_id);

      if (delErr) {
        return NextResponse.json({ error: delErr.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        deleted_user_id: user_id,
        deleted_name: target.full_name,
      });
    }

    // ─────────────────────────────────────────────────────────
    // APPROVED_TEACHERS: Atama dropdown'u için onaylı öğretmen listesi
    // ─────────────────────────────────────────────────────────
    if (action === 'approved_teachers') {
      const { data: teachers, error: tErr } = await admin
        .from('profiles')
        .select('id, full_name, branch, email')
        .eq('role', 'teacher')
        .eq('is_approved', true)
        .order('full_name');

      if (tErr) {
        return NextResponse.json({ error: tErr.message }, { status: 500 });
      }

      return NextResponse.json({ teachers: teachers || [] });
    }

    // ─────────────────────────────────────────────────────────
    // BULK_ASSIGN: Toplu öğretmen atama (admin)
    // Body: { student_ids: string[], teacher_id: string | null }
    // teacher_id === null → atamayı kaldır
    // ─────────────────────────────────────────────────────────
    if (action === 'bulk_assign') {
      const { student_ids, teacher_id } = body as {
        student_ids: string[];
        teacher_id: string | null;
      };

      if (!Array.isArray(student_ids) || student_ids.length === 0) {
        return NextResponse.json(
          { error: 'En az bir öğrenci seçmeniz gerekir.' },
          { status: 400 }
        );
      }

      // teacher_id null ise atamayı kaldır; değilse geçerli bir öğretmen olmalı
      if (teacher_id !== null) {
        const { data: teacher } = await admin
          .from('profiles')
          .select('id, role, is_approved')
          .eq('id', teacher_id)
          .maybeSingle();

        if (!teacher || teacher.role !== 'teacher') {
          return NextResponse.json(
            { error: 'Geçerli bir öğretmen seçin.' },
            { status: 400 }
          );
        }

        if (!teacher.is_approved) {
          return NextResponse.json(
            { error: 'Onaylanmamış öğretmene öğrenci atanamaz.' },
            { status: 400 }
          );
        }
      }

      // Öğrencilerin geçerli olduğunu doğrula (her biri student olmalı)
      const { data: targetStudents } = await admin
        .from('profiles')
        .select('id, role, full_name')
        .in('id', student_ids);

      const validStudentIds = (targetStudents || [])
        .filter((s) => s.role === 'student')
        .map((s) => s.id);

      // Batch metadata update — her öğrenci için mevcut metadata'yı oku, spread et
      const updated: string[] = [];
      const failed: { id: string; reason: string }[] = [];

      for (const sid of validStudentIds) {
        try {
          const { data: authData } = await admin.auth.admin.getUserById(sid);
          const currentMeta = authData?.user?.user_metadata || {};

          const { error: updErr } = await admin.auth.admin.updateUserById(sid, {
            user_metadata: {
              ...currentMeta,
              assigned_teacher_id: teacher_id, // null veya string
            },
          });

          if (updErr) {
            failed.push({ id: sid, reason: updErr.message });
          } else {
            updated.push(sid);
          }
        } catch (err) {
          failed.push({
            id: sid,
            reason: err instanceof Error ? err.message : 'unknown',
          });
        }
      }

      return NextResponse.json({
        success: true,
        updated_count: updated.length,
        failed_count: failed.length,
        failed,
        action: teacher_id ? 'assigned' : 'unassigned',
      });
    }

    return NextResponse.json({ error: 'Geçersiz action.' }, { status: 400 });
  } catch (err) {
    console.error('[admin/users] unexpected error:', err);
    return NextResponse.json({ error: 'Beklenmeyen bir sunucu hatası oluştu.' }, { status: 500 });
  }
}
