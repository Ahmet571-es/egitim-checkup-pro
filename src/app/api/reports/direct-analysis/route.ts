import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Engine'leri lazy import et — sadece ihtiyaç olunca yüklenir
async function generateReportForTest(
  testType: string,
  rawAnswers: Record<string | number, string | number | string[]>,
  scores: Record<string, unknown>
): Promise<string> {
  switch (testType) {
    case 'sag-sol-beyin': {
      const { calculateSagSolBeyin, generateSagSolBeyinReport } = await import('@/lib/tests/sag-sol-beyin/engine');
      const s = calculateSagSolBeyin(rawAnswers as Record<string, string>);
      return generateSagSolBeyinReport(s);
    }
    case 'vark': {
      const { calculateVark, generateVarkReport } = await import('@/lib/tests/vark/engine');
      const s = calculateVark(rawAnswers as Record<string, string>);
      return generateVarkReport(s);
    }
    case 'holland': {
      const { calculateHolland, generateHollandReport } = await import('@/lib/tests/holland/engine');
      const s = calculateHolland(rawAnswers as Record<string, number>);
      return generateHollandReport(s);
    }
    case 'enneagram': {
      const { calculateEnneagram, generateEnneagramReport } = await import('@/lib/tests/enneagram/engine');
      const s = calculateEnneagram(rawAnswers as Record<string, number>);
      return generateEnneagramReport(s);
    }
    case 'coklu-zeka': {
      const { calculateCokluZekaLise, generateCokluZekaReport } = await import('@/lib/tests/coklu-zeka/engine');
      const s = calculateCokluZekaLise(rawAnswers as Record<string, number>);
      return generateCokluZekaReport(s);
    }
    case 'sinav-kaygisi': {
      const { calculateSinavKaygisi, generateSinavKaygisiReport } = await import('@/lib/tests/sinav-kaygisi/engine');
      const s = calculateSinavKaygisi(rawAnswers as Record<string, string>);
      return generateSinavKaygisiReport(s);
    }
    case 'calisma-davranisi': {
      const { calculateCalismaDavranisi, generateCalismaDavranisiReport } = await import('@/lib/tests/calisma-davranisi/engine');
      const s = calculateCalismaDavranisi(rawAnswers as Record<string, string>);
      return generateCalismaDavranisiReport(s);
    }
    case 'akademik-analiz': {
      const { calculateAkademik, generateAkademikReport } = await import('@/lib/tests/akademik-analiz/engine');
      const s = calculateAkademik(rawAnswers as Record<string, string>);
      return generateAkademikReport(s);
    }
    // D2/Burdon/Hızlı-Okuma: skorlar zaten DB'ye özel formatta kaydediliyor; engine'i raw'dan üretmek karmaşık.
    // Bu durumda DB'deki scores objesinden hazır rapor sun.
    default: {
      // Fallback: scores objesini Markdown tabloya dök
      const lines: string[] = [`# Tekil Analiz Raporu`, ``];
      const main = scores._main;
      const desc = scores._desc;
      if (typeof main === 'string') lines.push(`**Sonuç:** ${main}`);
      if (typeof desc === 'string') lines.push(`${desc}`, ``);
      lines.push(`## 📊 Skorlar`, ``);
      lines.push(`| Metrik | Değer |`);
      lines.push(`|---|---|`);
      for (const [k, v] of Object.entries(scores)) {
        if (k.startsWith('_')) continue;
        lines.push(`| ${k} | ${typeof v === 'number' ? v : String(v)} |`);
      }
      lines.push(``, `> Not: Bu rapor, öğrencinin verdiği cevaplar üzerinden anlık olarak template motoruyla üretilmiştir.`);
      return lines.join('\n');
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const testResultId = url.searchParams.get('test_result_id');
    if (!testResultId) {
      return NextResponse.json({ error: 'test_result_id zorunludur.' }, { status: 400 });
    }

    const supabase = await createClient();
    const admin = createAdminClient();

    // Auth kontrolü
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli.' }, { status: 401 });
    }

    // Test sonucunu çek
    const { data: tr, error: trErr } = await admin
      .from('test_results')
      .select('id, student_id, test_type, scores, raw_answers, completed_at, school_id')
      .eq('id', testResultId)
      .single();

    if (trErr || !tr) {
      return NextResponse.json({ error: 'Test sonucu bulunamadı.' }, { status: 404 });
    }

    // ════════════════════════════════════════════════════════════════════
    // YETKİ KONTROLÜ — çok katmanlı
    //
    // Eski kod sadece callerProfile.school_id === tr.school_id kontrol
    // ediyordu. Bu yüzden:
    //   - Öğretmen veya öğrencinin school_id'si boşsa → her zaman 403
    //   - Öğretmen kendi öğrencisini /api/teacher/students ile kabul
    //     edilen 'assigned_teacher_id' bağıyla almışsa ama school_id
    //     yoksa → yine 403
    // Öğretmen "Direkt Analiz" butonuna basınca kendi atadığı
    // öğrencisinin raporu için bile 'yetkin yok' alıyordu.
    //
    // YENİ katmanlı yaklaşım:
    //   1. isSelf: öğrenci kendi raporu
    //   2. isAdmin: admin / school_admin → herkese erişebilir
    //   3. isAssignedTeacher: teacher + öğrenci.user_metadata.assigned_teacher_id
    //      eşleşmesi (sistemin teacher-student bağ pattern'i;
    //      /api/teacher/students ile aynı kontrol)
    //   4. isSameSchool: aynı okul personeli (fallback, eski davranış)
    // ════════════════════════════════════════════════════════════════════

    // Çağıranın profili
    const { data: callerProfile } = await admin
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single();

    if (!callerProfile) {
      return NextResponse.json({ error: 'Profil bulunamadı.' }, { status: 403 });
    }

    // Öğrencinin atanmış öğretmen bilgisi (auth metadata'dan; profiles'ta kolon yok)
    let assignedTeacherId: string | null = null;
    try {
      const { data: studentAuth } = await admin.auth.admin.getUserById(tr.student_id);
      const meta = studentAuth?.user?.user_metadata as Record<string, unknown> | undefined;
      assignedTeacherId = (meta?.assigned_teacher_id as string) ?? null;
    } catch { /* ignore — fallback'lere düşer */ }

    const role = callerProfile.role as string;
    const isSelf = user.id === tr.student_id;
    const isAdmin = ['admin', 'school_admin'].includes(role);
    const isAssignedTeacher = role === 'teacher' && assignedTeacherId === user.id;
    const isSameSchool =
      ['teacher', 'school_admin', 'admin'].includes(role) &&
      !!callerProfile.school_id &&
      !!tr.school_id &&
      callerProfile.school_id === tr.school_id;

    if (!isSelf && !isAdmin && !isAssignedTeacher && !isSameSchool) {
      return NextResponse.json({ error: 'Bu raporu görüntüleme yetkin yok.' }, { status: 403 });
    }

    // Raporu üret
    try {
      const report = await generateReportForTest(
        tr.test_type as string,
        (tr.raw_answers ?? {}) as Record<string | number, string | number | string[]>,
        (tr.scores ?? {}) as Record<string, unknown>
      );
      return NextResponse.json({
        report,
        test_type: tr.test_type,
        completed_at: tr.completed_at,
      });
    } catch (e) {
      console.error('[direct-analysis] engine error:', e);
      return NextResponse.json({
        error: 'Rapor üretilemedi.',
      }, { status: 500 });
    }
  } catch (e) {
    console.error('[direct-analysis] route error:', e);
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}
