import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateAIReport } from '@/lib/ai/claude-client';
import {
  buildIntegratedReportPrompt,
  normalizeTestName,
  type IntegratedReportType,
} from '@/lib/ai/prompts/integrated-report';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { student_id, report_types = ['ogretmen', 'ogrenci', 'ebeveyn'] } = body as {
      student_id: string;
      report_types?: IntegratedReportType[];
    };

    if (!student_id) {
      return NextResponse.json({ error: 'student_id zorunludur.' }, { status: 400 });
    }

    const supabase = await createClient();

    // ── AUTH KONTROLÜ ──
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli.' }, { status: 401 });
    }
    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single();
    if (!callerProfile) {
      return NextResponse.json({ error: 'Profil bulunamadı.' }, { status: 403 });
    }
    if (callerProfile.role === 'student' && user.id !== student_id) {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 });
    }

    // ── RATE LIMIT (dakikada max 3 istek) ──
    const rl = checkRateLimit(`integrated:${user.id}`, 3, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Çok fazla istek. Lütfen 1 dakika bekleyin.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } }
      );
    }

    // Öğrenci bilgilerini çek
    const { data: student, error: studentErr } = await supabase
      .from('profiles')
      .select('id, full_name, school_id')
      .eq('id', student_id)
      .single();

    if (studentErr || !student) {
      return NextResponse.json({ error: 'Öğrenci bulunamadı.' }, { status: 404 });
    }

    // Tüm tamamlanmış test sonuçlarını çek
    const { data: results, error: resultsErr } = await supabase
      .from('test_results')
      .select('id, test_type, scores, completed_at')
      .eq('student_id', student_id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: true });

    if (resultsErr) {
      return NextResponse.json({ error: 'Test sonuçları çekilemedi.' }, { status: 500 });
    }

    if (!results || results.length < 2) {
      return NextResponse.json(
        { error: 'Entegre rapor için en az 2 tamamlanmış test gereklidir.' },
        { status: 400 }
      );
    }

    const testDataList = results.map(r => ({
      test_name: normalizeTestName(r.test_type),
      scores: r.scores ?? {},
      date: r.completed_at,
    }));

    // Mevcut entegre raporu kontrol et
    const { data: existingReport } = await supabase
      .from('integrated_reports')
      .select('id, teacher_report, student_report, parent_report, generated_at')
      .eq('student_id', student_id)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingReport) {
      return NextResponse.json({
        already_generated: true,
        reports: {
          ogretmen: existingReport.teacher_report,
          ogrenci: existingReport.student_report,
          ebeveyn: existingReport.parent_report,
        },
        generated_at: existingReport.generated_at,
        message: '⚠️ Entegre rapor daha önce üretilmiş.',
      });
    }

    // 3 raporu üret (sıralı — rate limit için)
    const baseParams = {
      studentName: student.full_name,
      studentAge: '—',
      studentGender: '—',
      testDataList,
    };

    // 3 raporu paralel uret (Vercel Hobby 60s limiti icin)
    const reports: Record<string, string> = {};
    const genPromises = (report_types as IntegratedReportType[]).map(async (reportType) => {
      const prompt = buildIntegratedReportPrompt({ ...baseParams, reportType });
      const text = await generateAIReport(prompt);
      reports[reportType] = text;
    });
    await Promise.all(genPromises);

    // Entegre raporları kaydet
    const { error: insertErr } = await supabase.from('integrated_reports').insert({
      student_id: student.id,
      school_id: student.school_id,
      teacher_report: reports.ogretmen ?? null,
      student_report: reports.ogrenci ?? null,
      parent_report: reports.ebeveyn ?? null,
      test_count: results.length,
      generated_at: new Date().toISOString(),
    });

    if (insertErr) {
      console.error('[integrated_reports insert]', insertErr.message);
      // Rapor üretildi ama kaydedilemedi — kullanıcıya bildir
      return NextResponse.json({
        success: true,
        warning: 'Raporlar üretildi ancak veritabanına kaydedilemedi: ' + insertErr.message,
        reports,
        saved: false,
      });
    }

    // Veliye rapor hazır bildirimi gönder (arka planda, hata akışı bozmaz)
    if (reports.ebeveyn && student.id) {
      try {
        const { sendReportReadyEmail } = await import('@/lib/email/triggers');
        // Velileri bul
        const { data: parentLinks } = await supabase
          .from('parent_students')
          .select('parent_id, profiles!parent_students_parent_id_fkey(id)')
          .eq('student_id', student.id);
        for (const link of parentLinks ?? []) {
          const parentId = (link.profiles as unknown as { id: string })?.id;
          if (parentId) {
            sendReportReadyEmail(parentId, student.full_name, 'Entegre 3\'lü Veli Raporu').catch(console.warn);
          }
        }
      } catch (e) {
        console.warn('[integrated] Veli e-postası gönderilemedi:', e);
      }
    }

    return NextResponse.json({
      success: true,
      reports,
      test_count: results.length,
    });
  } catch (err) {
    console.error('[reports/integrated]', err);
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}

// Zorla yenileme
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { student_id } = body as { student_id: string };

    if (!student_id) {
      return NextResponse.json({ error: 'student_id zorunludur.' }, { status: 400 });
    }

    const supabase = await createClient();

    // ── AUTH KONTROLÜ ──
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli.' }, { status: 401 });
    }
    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single();
    if (!callerProfile) {
      return NextResponse.json({ error: 'Profil bulunamadı.' }, { status: 403 });
    }
    if (callerProfile.role === 'student' && user.id !== student_id) {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 });
    }

    // ── RATE LIMIT (dakikada max 3 istek) ──
    const rl = checkRateLimit(`integrated:${user.id}`, 3, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Çok fazla istek. Lütfen 1 dakika bekleyin.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } }
      );
    }

    const { data: student } = await supabase
      .from('profiles')
      .select('id, full_name, school_id')
      .eq('id', student_id)
      .single();

    if (!student) {
      return NextResponse.json({ error: 'Öğrenci bulunamadı.' }, { status: 404 });
    }

    const { data: results } = await supabase
      .from('test_results')
      .select('id, test_type, scores, completed_at')
      .eq('student_id', student_id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: true });

    if (!results || results.length < 2) {
      return NextResponse.json({ error: 'Yetersiz test sayısı.' }, { status: 400 });
    }

    const testDataList = results.map(r => ({
      test_name: normalizeTestName(r.test_type),
      scores: r.scores ?? {},
      date: r.completed_at,
    }));

    const baseParams = {
      studentName: student.full_name,
      studentAge: '—',
      studentGender: '—',
      testDataList,
    };

    const reportTypes: IntegratedReportType[] = ['ogretmen', 'ogrenci', 'ebeveyn'];
    const reports: Record<string, string> = {};
    await Promise.all(reportTypes.map(async (reportType) => {
      const prompt = buildIntegratedReportPrompt({ ...baseParams, reportType });
      reports[reportType] = await generateAIReport(prompt);
    }));

    await supabase.from('integrated_reports').insert({
      student_id: student.id,
      school_id: student.school_id,
      teacher_report: reports.ogretmen,
      student_report: reports.ogrenci,
      parent_report: reports.ebeveyn,
      test_count: results.length,
      generated_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, reports });
  } catch (err) {
    console.error('[reports/integrated PUT]', err);
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}