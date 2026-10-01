/**
 * POST /api/reports/package/generate
 *
 * Paket bazlı "Bütünsel Değerlendirme Raporu" (rapor v2) üretici.
 *
 * Body: { student_id, package_type }
 *
 * Akış:
 *   1. Yetki: admin/school_admin/teacher (öğrenci + veli reddedilir — KVKK + scope)
 *   2. Öğrenci scope kontrolü
 *   3. Paket testlerinin tamamlanmış olup olmadığı kontrolü
 *   4. Test verilerini çek (eski kayıtlar ham cevaplardan yeniden hesaplanır)
 *   5. Tek bir rapor kur: kapak, sonuçlar, bütünsel değerlendirme, öğrenci,
 *      aile ve uzman bölümleri, son söz (yapay zekâ kullanılmaz)
 *   6. holistic_reports'a kaydet (audience='teacher', package_type ile)
 *
 * Genetik (DMIT) bilgisi bu rapora eklenmez.
 */
import { NextRequest, NextResponse } from 'next/server';
import { logAndMsg } from '@/lib/api/errors';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { PACKAGES, checkPackageCompletion, type PackageType } from '@/lib/packages';
import { buildStoredReportV2, type ResultRow } from '@/lib/report-v2/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

const TEST_LABELS: Record<string, string> = {
  enneagram: 'Enneagram Kişilik',
  vark: 'VARK Öğrenme Stilleri',
  holland: 'Meslek Testi',
  coklu_zeka: 'Çoklu Zekâ',
  'coklu-zeka': 'Çoklu Zekâ',
  sinav_kaygisi: 'Sınav Kaygısı',
  'sinav-kaygisi': 'Sınav Kaygısı',
  calisma_davranisi: 'Çalışma Davranışı',
  'calisma-davranisi': 'Çalışma Davranışı',
  akademik_analiz: 'Akademik Analiz',
  'akademik-analiz': 'Akademik Analiz',
  hizli_okuma: 'Hızlı Okuma',
  'hizli-okuma': 'Hızlı Okuma',
  d2_dikkat: 'D2 Dikkat Testi',
  'd2-dikkat': 'D2 Dikkat Testi',
  sag_sol_beyin: 'Sağ-Sol Beyin Dominansı',
  'sag-sol-beyin': 'Sağ-Sol Beyin Dominansı',
};
const labelFor = (k: string) => TEST_LABELS[k] || k.replace(/[_-]/g, ' ');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { student_id: studentId, package_type: packageType } = body;

    if (!studentId || !packageType) {
      return NextResponse.json(
        { error: 'student_id ve package_type zorunlu.' },
        { status: 400 },
      );
    }

    if (!PACKAGES[packageType as PackageType]) {
      return NextResponse.json(
        { error: `Geçersiz paket: ${packageType}` },
        { status: 400 },
      );
    }
    const pkg = PACKAGES[packageType as PackageType];

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: callerProfile } = await admin
      .from('profiles')
      .select('id, role, school_id, full_name')
      .eq('id', user.id)
      .maybeSingle();

    if (!callerProfile) {
      return NextResponse.json({ error: 'Profil bulunamadı.' }, { status: 403 });
    }

    // KVKK: öğrenci ve veli kendi raporlarını ÜRETEMEZ. Sadece görüntüleyebilir.
    if (callerProfile.role === 'student' || callerProfile.role === 'parent') {
      return NextResponse.json(
        { error: `Bu işlem için yetkiniz yok. [DBG package role=${callerProfile.role} uid=${user.id?.slice(-6)} sid=${studentId?.slice(-6)}]` },
        { status: 403 },
      );
    }
    if (!['admin', 'school_admin', 'teacher'].includes(callerProfile.role || '')) {
      return NextResponse.json({
        error: `Yetkisiz rol. [DBG package role=${callerProfile.role} uid=${user.id?.slice(-6)}]`
      }, { status: 403 });
    }

    // ── Öğrenci kontrolü + scope ──
    const { data: student } = await admin
      .from('profiles')
      .select('id, role, full_name, school_id, grade, birth_date')
      .eq('id', studentId)
      .maybeSingle();

    if (!student || student.role !== 'student') {
      return NextResponse.json({ error: 'Öğrenci bulunamadı.' }, { status: 404 });
    }

    if (callerProfile.role === 'school_admin') {
      if (
        !callerProfile.school_id ||
        student.school_id !== callerProfile.school_id
      ) {
        return NextResponse.json(
          { error: 'Bu öğrenciye erişim yetkiniz yok.' },
          { status: 403 },
        );
      }
    } else if (callerProfile.role === 'teacher') {
      const { data: studentAuth } = await admin.auth.admin.getUserById(studentId);
      const assignedTeacherId = studentAuth?.user?.user_metadata?.assigned_teacher_id;
      if (assignedTeacherId !== user.id) {
        return NextResponse.json(
          {
            error: `Bu öğrenci size atanmış değil. [DBG package:teacher uid=${user.id?.slice(-6)} assigned=${assignedTeacherId?.slice(-6) || 'YOK'} sid=${studentId?.slice(-6)}]`
          },
          { status: 403 },
        );
      }
    }

    // ── Tamamlanma kontrolü ──
    const { data: results } = await admin
      .from('test_results')
      .select('test_type, scores, raw_answers, completed_at, created_at')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    const completedTypes = (results || []).map((r) => r.test_type);
    const completion = checkPackageCompletion(packageType as PackageType, completedTypes);

    if (!completion.complete) {
      return NextResponse.json(
        {
          error: `Paket için eksik test(ler) var: ${completion.missing.map(labelFor).join(', ')}`,
          missing: completion.missing,
          covered: completion.covered,
        },
        { status: 400 },
      );
    }

    // ── Test verilerini hazırla (her test için en son sonuç) ──
    const latestByType = new Map<string, ResultRow>();
    for (const r of (results || []) as ResultRow[]) {
      if (!latestByType.has(r.test_type)) latestByType.set(r.test_type, r);
    }
    // Paketin gerçekten kullandığı testler (aynı testin yazım varyantlarından yalnızca biri)
    const usedTypes = completion.covered;
    const rows = usedTypes.map((tt) => latestByType.get(tt)).filter((x): x is ResultRow => !!x);

    const built = await buildStoredReportV2(admin, {
      kind: 'package',
      packageId: packageType as PackageType,
      student,
      results: rows,
    });
    if (!built) {
      return NextResponse.json({ error: 'Test sonuçları okunamadı; rapor üretilemedi.' }, { status: 422 });
    }

    // ── Raporu kaydet (tek rapor: öğrenci, aile ve uzman bölümleri içinde) ──
    const { data: inserted, error: insertErr } = await admin
      .from('holistic_reports')
      .insert({
        student_id: studentId,
        school_id: student.school_id,
        report_text: built.text,
        selected_test_types: usedTypes,
        test_count: usedTypes.length,
        audience: 'teacher',
        package_type: packageType,
      })
      .select('id, audience, generated_at')
      .single();

    if (insertErr || !inserted) {
      console.error('[package/generate] insert error', insertErr);
      return NextResponse.json(
        { error: logAndMsg('reports/package/generate', insertErr, 'Rapor kaydedilemedi.') },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      package: pkg.label,
      reports: { teacher: inserted.id },
      id: inserted.id,
      generated_at: inserted.generated_at,
      text: built.text,
      message: `${pkg.label} paketi için bütünsel değerlendirme raporu üretildi.`,
    });
  } catch (err) {
    console.error('[package/generate]', err);
    return NextResponse.json({ error: 'Sunucu hatası. Lütfen tekrar deneyin.' }, { status: 500 });
  }
}
