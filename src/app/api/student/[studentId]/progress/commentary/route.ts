/**
 * POST /api/student/[studentId]/progress/commentary
 *
 * Faz 7: Bir öğrencinin test geçmişi üzerinden AI gelişim yorumu üretir.
 *
 * Body (opsiyonel): { test_types?: string[] }  — yoksa tüm testler dahil
 * Output: { commentary: string }
 *
 * Yetki:
 *   • student / parent → 403 (gelişim yorumu, KVKK kapsamında değil ama
 *     öğrenci/veli kendi raporunu görmemeli — bu işlem teacher panel için)
 *   • teacher → kendine atanmış öğrenci
 *   • school_admin → kendi okul öğrencisi
 *   • admin → herkes
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateAIReport } from '@/lib/ai/claude-client';
import { buildProgressCommentaryPrompt } from '@/lib/ai/prompts/progress-commentary';

export const runtime = 'nodejs';
export const maxDuration = 120; // 2 dk — AI yorum üretimi

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

const labelFor = (key: string) => TEST_LABELS[key] || key.replace(/[_-]/g, ' ');

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ studentId: string }> },
) {
  try {
    const { studentId } = await context.params;
    if (!studentId) {
      return NextResponse.json({ error: 'studentId zorunlu.' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const filterTestTypes: string[] | undefined = Array.isArray(body.test_types)
      ? body.test_types
      : undefined;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: callerProfile } = await admin
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .maybeSingle();

    if (!callerProfile) {
      return NextResponse.json({ error: 'Profil bulunamadı.' }, { status: 403 });
    }

    if (callerProfile.role === 'student' || callerProfile.role === 'parent') {
      return NextResponse.json(
        { error: 'Bu işlem için yetkiniz yok.' },
        { status: 403 },
      );
    }
    if (!['admin', 'school_admin', 'teacher'].includes(callerProfile.role || '')) {
      return NextResponse.json({ error: 'Yetkisiz rol.' }, { status: 403 });
    }

    // ── Öğrenci kontrolü + scope ──
    const { data: student } = await admin
      .from('profiles')
      .select('id, role, full_name, school_id, grade')
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
          { error: 'Bu öğrenci size atanmış değil.' },
          { status: 403 },
        );
      }
    }

    // ── Trend verisini çek ──
    let query = admin
      .from('student_test_history')
      .select('id, test_type, attempt_number, score, sub_scores, created_at')
      .eq('student_id', studentId)
      .order('test_type')
      .order('attempt_number', { ascending: true });

    if (filterTestTypes && filterTestTypes.length > 0) {
      query = query.in('test_type', filterTestTypes);
    }

    const { data: rows, error: fetchErr } = await query;

    if (fetchErr) {
      // Tablo yoksa graceful fallback
      console.warn('[progress/commentary] tablo sorgu hatası:', fetchErr.message);
      return NextResponse.json(
        { error: 'Test geçmiş tablosu mevcut değil veya erişim hatası.' },
        { status: 500 },
      );
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: 'Bu öğrencinin gelişim verisi bulunamadı.' },
        { status: 404 },
      );
    }

    // Test bazlı grupla, 2+ ölçümü olanları yorum için topla
    const byType: Record<string, Array<{
      attempt_number: number; score: number; created_at: string;
    }>> = {};
    for (const r of rows) {
      const k = r.test_type;
      if (!byType[k]) byType[k] = [];
      byType[k].push({
        attempt_number: r.attempt_number,
        score: Number(r.score),
        created_at: r.created_at,
      });
    }

    const trendsForPrompt = Object.entries(byType)
      .filter(([, attempts]) => attempts.length >= 2) // sadece 2+ ölçümü olanlar
      .map(([testType, attempts]) => {
        const changes: number[] = [];
        for (let i = 1; i < attempts.length; i++) {
          if (attempts[i - 1].score !== 0) {
            changes.push(
              ((attempts[i].score - attempts[i - 1].score) /
                Math.abs(attempts[i - 1].score)) * 100,
            );
          }
        }
        const avg = changes.length > 0
          ? changes.reduce((a, b) => a + b, 0) / changes.length
          : 0;
        const direction: 'improving' | 'declining' | 'stable' =
          avg > 2 ? 'improving' : avg < -2 ? 'declining' : 'stable';

        return {
          testType,
          testLabel: labelFor(testType),
          attempts: attempts.map((a) => ({
            date: new Date(a.created_at).toLocaleDateString('tr-TR', {
              year: 'numeric', month: 'short', day: 'numeric',
            }),
            score: a.score,
            attemptNumber: a.attempt_number,
          })),
          direction,
          averageChange: Math.round(avg * 100) / 100,
          firstScore: attempts[0].score,
          latestScore: attempts[attempts.length - 1].score,
        };
      });

    if (trendsForPrompt.length === 0) {
      return NextResponse.json(
        {
          error: 'Yorum üretmek için yeterli veri yok. En az 2 ölçümü olan bir test gerekli.',
        },
        { status: 400 },
      );
    }

    // ── AI yorum üret ──
    const prompt = buildProgressCommentaryPrompt({
      studentName: student.full_name || 'Öğrenci',
      studentGrade: student.grade,
      trends: trendsForPrompt,
    });

    const commentary = await generateAIReport(prompt, {
      maxTokens: 1500,         // ~280 kelime için fazlasıyla yeterli
      temperature: 0.4,        // tutarlı + biraz çeşitlilik
      enableContinuation: false, // bu kısa metin için continuation gerekmez
    });

    return NextResponse.json({
      commentary,
      analyzed_test_count: trendsForPrompt.length,
      total_attempts: rows.length,
    });
  } catch (err) {
    console.error('[progress/commentary]', err);
    return NextResponse.json({ error: 'Sunucu hatası. Lütfen tekrar deneyin.' }, { status: 500 });
  }
}
