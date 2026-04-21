import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateAIReport } from '@/lib/ai/claude-client';
import { buildSingleTestPrompt } from '@/lib/ai/prompts/single-test';
import { buildHolisticPrompt } from '@/lib/ai/prompts/holistic';
import { calculateRiskScore, getRiskLevel } from '@/lib/services/riskScore';
import { identifyPatterns } from '@/lib/services/correlation';
import { matchCareers } from '@/lib/services/careerMatch';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { student_id, test_result_id, report_type, selected_test_types, selected_result_ids } = body as {
      student_id?: string;
      test_result_id?: string;
      report_type?: string;
      selected_test_types?: string[];
      selected_result_ids?: string[];
    };

    if (!student_id) {
      return NextResponse.json({ error: 'student_id zorunludur.' }, { status: 400 });
    }

    const supabase = await createClient();
    const admin = createAdminClient();

    // ── AUTH KONTROLÜ ──
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli.' }, { status: 401 });
    }
    // Çağıran kullanıcının rolünü kontrol et (admin client ile RLS bypass)
    const { data: callerProfile } = await admin
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
    // Veli AI rapor üretemez — maliyet ve scope.
    if (callerProfile.role === 'parent') {
      return NextResponse.json(
        { error: 'Bu işlem veliler için kullanılabilir değil. Raporlar öğretmen/yönetici tarafından üretilir.' },
        { status: 403 },
      );
    }

    // ── RATE LIMIT (dakikada max 3 istek) ──
    const rl = checkRateLimit(`generate:${user.id}`, 3, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Çok fazla istek. Lütfen 1 dakika bekleyin.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } }
      );
    }

    // Öğrenci bilgilerini çek (admin client ile RLS bypass)
    const { data: student, error: studentErr } = await admin
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

    // --- BÜTÜNCÜL (HARMANLANMIŞ) RAPOR ---
    if (report_type === 'holistic') {
      // Tüm tamamlanan test sonuçlarını çek
      const { data: results, error: resultsErr } = await admin
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

      // Test type normalize (tire ↔ alt çizgi)
      const normalize = (s: string) => s.replace(/-/g, '_');

      // Seçili testler varsa filtrele, yoksa hepsini kullan (geriye uyum)
      let filteredResults = results;
      let selectedTypes: string[] = [];

      // Öncelik: selected_result_ids (yeni, spesifik kayıt seçimi)
      if (Array.isArray(selected_result_ids) && selected_result_ids.length > 0) {
        const idSet = new Set(selected_result_ids);
        filteredResults = results.filter(r => idSet.has(r.id));

        if (filteredResults.length < 2) {
          return NextResponse.json(
            { error: 'Harmanlanmış rapor için seçilen kayıtlardan en az 2 tanesi öğrencide bulunmalıdır.' },
            { status: 400 }
          );
        }
        selectedTypes = Array.from(new Set(filteredResults.map(r => normalize(r.test_type))));
      } else if (Array.isArray(selected_test_types) && selected_test_types.length > 0) {
        // Geri uyum: test_type bazlı seçim (aynı tipin en son kaydını alır)
        const selectedNormalized = new Set(selected_test_types.map(normalize));
        // Her tip için en son kaydı tut
        const latestByType = new Map<string, typeof results[0]>();
        for (const r of results) {
          const key = normalize(r.test_type);
          if (selectedNormalized.has(key) && !latestByType.has(key)) {
            latestByType.set(key, r);
          }
        }
        filteredResults = Array.from(latestByType.values());

        if (filteredResults.length < 2) {
          return NextResponse.json(
            { error: 'Harmanlanmış rapor için seçilen testlerden en az 2 tanesi öğrencide tamamlanmış olmalıdır.' },
            { status: 400 }
          );
        }
        selectedTypes = Array.from(new Set(filteredResults.map(r => normalize(r.test_type))));
      } else {
        // Geriye uyum: tüm testler kullanılır
        if (results.length < 2) {
          return NextResponse.json(
            { error: 'Harmanlanmış rapor için en az 2 tamamlanmış test gerekir.' },
            { status: 400 }
          );
        }
        selectedTypes = Array.from(new Set(results.map(r => normalize(r.test_type))));
      }

      const testDataList = filteredResults.map(r => ({
        test_name: r.test_type,
        scores: r.scores ?? {},
        date: r.completed_at,
      }));

      // İleri Analiz verilerini hesapla (algoritmik, AI çağrısı yok)
      const advancedInput = filteredResults.map(r => ({
        test_type: r.test_type,
        scores: r.scores ?? {},
      }));
      const riskResult = calculateRiskScore(advancedInput);
      const patterns = identifyPatterns(advancedInput);
      const careerMatch = matchCareers(advancedInput);

      const prompt = buildHolisticPrompt({
        studentName: student.full_name,
        studentAge: '—',
        studentGender: '—',
        testDataList,
        riskResult,
        patterns,
        careerMatch,
      });

      const report = await generateAIReport(prompt, { maxTokens: 32000 });

      // holistic_reports tablosuna YENİ KAYIT olarak ekle (üzerine yazmaz, geçmiş korunur)
      const { data: inserted, error: saveErr } = await admin
        .from('holistic_reports')
        .insert({
          student_id,
          school_id: student.school_id || null,
          report_text: report,
          selected_test_types: selectedTypes,
          test_count: filteredResults.length,
          generated_at: new Date().toISOString(),
        })
        .select('id, generated_at')
        .single();

      if (saveErr) {
        console.error('[holistic save]', saveErr.message);
        return NextResponse.json({
          success: true,
          report,
          warning: 'Rapor üretildi ancak kaydedilemedi: ' + saveErr.message,
        });
      }

      return NextResponse.json({
        success: true,
        report,
        id: inserted?.id,
        generated_at: inserted?.generated_at,
        selected_test_types: selectedTypes,
        test_count: filteredResults.length,
      });
    }

    // --- TEKİL RAPOR ---
    if (!test_result_id) {
      return NextResponse.json({ error: 'test_result_id zorunludur.' }, { status: 400 });
    }

    const { data: testResult, error: trErr } = await admin
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

    const report = await generateAIReport(prompt, { maxTokens: 16000 });

    // Admin client ile raporu kaydet (RLS bypass — outer scope admin)
    const { error: updateErr } = await admin
      .from('test_results')
      .update({
        ai_report: report,
        ai_report_generated_at: new Date().toISOString(),
      })
      .eq('id', test_result_id);

    if (updateErr) {
      console.error('[tekil save]', updateErr.message);
      return NextResponse.json({ error: 'Rapor kaydedilemedi: ' + updateErr.message }, { status: 500 });
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
    const admin = createAdminClient();

    // ── AUTH KONTROLÜ ──
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli.' }, { status: 401 });
    }
    const { data: callerProfile } = await admin
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

    const { data: student } = await admin
      .from('profiles')
      .select('id, full_name')
      .eq('id', student_id)
      .single();

    if (!student) {
      return NextResponse.json({ error: 'Öğrenci bulunamadı.' }, { status: 404 });
    }

    const { data: testResult } = await admin
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

    const report = await generateAIReport(prompt, { maxTokens: 16000 });

    // Admin client ile kaydet (RLS bypass — outer scope admin)
    const { error: saveErr } = await admin
      .from('test_results')
      .update({
        ai_report: report,
        ai_report_generated_at: new Date().toISOString(),
      })
      .eq('id', test_result_id);

    if (saveErr) {
      console.error('[PUT save]', saveErr.message);
    }

    return NextResponse.json({ success: true, report });
  } catch (err) {
    console.error('[reports/generate PUT]', err);
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}