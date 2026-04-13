import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateAIReport } from '@/lib/ai/claude-client';
import { buildSingleTestPrompt } from '@/lib/ai/prompts/single-test';
import { buildHolisticPrompt } from '@/lib/ai/prompts/holistic';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { student_id, test_result_id, report_type } = body;

    if (!student_id) {
      return NextResponse.json({ error: 'student_id zorunludur.' }, { status: 400 });
    }

    const supabase = await createClient();

    // ── AUTH KONTROLÜ ──
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli.' }, { status: 401 });
    }
    // Çağıran kullanıcının rolünü kontrol et
    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single();
    if (!callerProfile) {
      return NextResponse.json({ error: 'Profil bulunamadı.' }, { status: 403 });
    }
    // Sadece öğrenci kendi raporunu, öğretmen/yönetici/admin kendi okulundaki öğrenciyi görebilir
    if (callerProfile.role === 'student' && user.id !== student_id) {
      return NextResponse.json({ error: 'Yalnızca kendi raporunuzu üretebilirsiniz.' }, { status: 403 });
    }

    // ── RATE LIMIT (dakikada max 3 istek) ──
    const rl = checkRateLimit(`generate:${user.id}`, 3, 60_000);
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

    // Cross-school kontrol: öğretmen/yönetici sadece kendi okulundaki öğrenciye rapor üretebilir
    if (callerProfile.role !== 'admin' && callerProfile.school_id && student.school_id !== callerProfile.school_id) {
      return NextResponse.json({ error: 'Bu öğrenci sizin okulunuzda değil.' }, { status: 403 });
    }

    // --- BÜTÜNCÜL RAPOR ---
    if (report_type === 'holistic') {
      // Tüm tamamlanan test sonuçlarını çek
      const { data: results, error: resultsErr } = await supabase
        .from('test_results')
        .select('id, test_type, scores, completed_at')
        .eq('student_id', student_id)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false });

      if (resultsErr) {
        return NextResponse.json({ error: 'Test sonuçları çekilemedi.' }, { status: 500 });
      }

      if (!results || results.length === 0) {
        return NextResponse.json({ error: 'Öğrencinin tamamlanmış testi yok.' }, { status: 400 });
      }

      const testDataList = results.map(r => ({
        test_name: r.test_type,
        scores: r.scores ?? {},
        date: r.completed_at,
      }));

      const prompt = buildHolisticPrompt({
        studentName: student.full_name,
        studentAge: '—',
        studentGender: '—',
        testDataList,
      });

      const report = await generateAIReport(prompt);

      // Raporu holistic_report alanına kaydet (ilk test_result'a)
      if (results[0]?.id) {
        await supabase
          .from('test_results')
          .update({
            ai_report: report,
            ai_report_generated_at: new Date().toISOString(),
          })
          .eq('id', results[0].id);
      }

      return NextResponse.json({ success: true, report });
    }

    // --- TEKİL RAPOR ---
    if (!test_result_id) {
      return NextResponse.json({ error: 'test_result_id zorunludur.' }, { status: 400 });
    }

    const { data: testResult, error: trErr } = await supabase
      .from('test_results')
      .select('id, test_type, scores, completed_at, ai_report, ai_report_generated_at')
      .eq('id', test_result_id)
      .single();

    if (trErr || !testResult) {
      return NextResponse.json({ error: 'Test sonucu bulunamadı.' }, { status: 404 });
    }

    // Re-generation koruması
    if (testResult.ai_report_generated_at) {
      return NextResponse.json({
        already_generated: true,
        report: testResult.ai_report,
        generated_at: testResult.ai_report_generated_at,
        message: '⚠️ Bu rapor daha önce üretilmiş. Yeniden üretmek için zorla yenile seçeneğini kullanın.',
      });
    }

    const prompt = buildSingleTestPrompt({
      studentName: student.full_name,
      studentAge: '—',
      studentGender: '—',
      testName: testResult.test_type,
      testData: testResult.scores ?? {},
    });

    const report = await generateAIReport(prompt);

    // Raporu kaydet
    const { error: updateErr } = await supabase
      .from('test_results')
      .update({
        ai_report: report,
        ai_report_generated_at: new Date().toISOString(),
      })
      .eq('id', test_result_id);

    if (updateErr) {
      return NextResponse.json({ error: 'Rapor kaydedilemedi.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, report });
  } catch (err) {
    console.error('[reports/generate]', err);
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}

// Zorla yenileme (override) — PUT
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { student_id, test_result_id, report_type } = body;

    if (!student_id || !test_result_id) {
      return NextResponse.json({ error: 'student_id ve test_result_id zorunludur.' }, { status: 400 });
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
      return NextResponse.json({ error: 'Yalnızca kendi raporunuzu yenileyebilirsiniz.' }, { status: 403 });
    }

    // ── RATE LIMIT (dakikada max 3 istek) ──
    const rl = checkRateLimit(`generate:${user.id}`, 3, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Çok fazla istek. Lütfen 1 dakika bekleyin.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } }
      );
    }

    const { data: student } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', student_id)
      .single();

    if (!student) {
      return NextResponse.json({ error: 'Öğrenci bulunamadı.' }, { status: 404 });
    }

    const { data: testResult } = await supabase
      .from('test_results')
      .select('id, test_type, scores')
      .eq('id', test_result_id)
      .single();

    if (!testResult) {
      return NextResponse.json({ error: 'Test sonucu bulunamadı.' }, { status: 404 });
    }

    const prompt = buildSingleTestPrompt({
      studentName: student.full_name,
      studentAge: '—',
      studentGender: '—',
      testName: testResult.test_type,
      testData: testResult.scores ?? {},
    });

    const report = await generateAIReport(prompt);

    await supabase
      .from('test_results')
      .update({
        ai_report: report,
        ai_report_generated_at: new Date().toISOString(),
      })
      .eq('id', test_result_id);

    return NextResponse.json({ success: true, report });
  } catch (err) {
    console.error('[reports/generate PUT]', err);
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}