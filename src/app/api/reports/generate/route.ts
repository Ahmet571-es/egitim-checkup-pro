import { NextRequest, NextResponse } from 'next/server';
import { serverError, logAndMsg } from '@/lib/api/errors';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateAIReport } from '@/lib/ai/claude-client';
import { buildSingleTestPrompt } from '@/lib/ai/prompts/single-test';
import { buildDeterministicReport } from '@/lib/report/detailed-report-router';
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
    const { student_id, test_result_id, report_type, selected_test_types, selected_result_ids, selected_genetic_report_ids } = body as {
      student_id?: string;
      test_result_id?: string;
      report_type?: string;
      selected_test_types?: string[];
      selected_result_ids?: string[];
      selected_genetic_report_ids?: string[];
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
      return NextResponse.json({
        error: `Yalnızca kendi raporunuzu üretebilirsiniz. [DBG role=${callerProfile.role} uid=${user.id?.slice(-6)} sid=${student_id?.slice(-6)}]`
      }, { status: 403 });
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

      // Öğrencinin DMIT raporu var mı? AI'ya kaç adet "kullanılacak" söyleniyor:
      // - Frontend selected_genetic_report_ids gönderdiyse o sayı
      // - Yoksa (geri uyum) toplam sayı
      let geneticCount = 0;
      try {
        if (Array.isArray(selected_genetic_report_ids)) {
          // Sadece geçerli (öğrencinin) ID'leri say
          if (selected_genetic_report_ids.length > 0) {
            const { data: validReports } = await admin
              .from('genetic_reports')
              .select('id')
              .eq('student_id', student_id)
              .in('id', selected_genetic_report_ids);
            geneticCount = (validReports || []).length;
          }
        } else {
          const { count } = await admin
            .from('genetic_reports')
            .select('id', { count: 'exact', head: true })
            .eq('student_id', student_id);
          geneticCount = count || 0;
        }
      } catch { /* tablo yoksa sessiz geç */ }

      const prompt = buildHolisticPrompt({
        studentName: student.full_name,
        studentAge: '—',
        studentGender: '—',
        testDataList,
        riskResult,
        patterns,
        careerMatch,
        hasGeneticReport: geneticCount > 0,
        geneticReportCount: geneticCount,
      });

      // ═══ DMIT PDF'lerini AI context'ine yükle (sadece holistic = teacher tarafı) ═══
      // Frontend belirli ID'ler seçtiyse onları, yoksa öğrencinin tüm DMIT'ini gönder.
      let geneticAttachments: import('@/lib/ai/claude-client').PdfAttachment[] = [];
      if (geneticCount > 0) {
        try {
          const { fetchGeneticContext } = await import('@/lib/ai/genetic-context');
          const ctx = await fetchGeneticContext(student_id, {
            geneticReportIds: Array.isArray(selected_genetic_report_ids) && selected_genetic_report_ids.length > 0
              ? selected_genetic_report_ids
              : undefined,
          });
          geneticAttachments = ctx.attachments;
          if (ctx.skippedReasons.length > 0) {
            console.warn('[holistic] DMIT context skip:', ctx.skippedReasons.join(' | '));
          }
          console.log(`[holistic] ${ctx.count} adet DMIT PDF AI context'ine yüklendi.`);
        } catch (e) {
          console.warn('[holistic] DMIT context yükleme hatası:', (e as Error).message);
        }
      }

      const report = await generateAIReport(prompt, {
        maxTokens: 32000,
        pdfAttachments: geneticAttachments.length > 0 ? geneticAttachments : undefined,
      });

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
          warning: logAndMsg('reports/generate', saveErr, 'Rapor üretildi ancak kaydedilemedi.'),
        });
      }

      // ═══ Otomatik Genetik Ek (DMIT) ═══
      // Mehmet'in talebi: bütüncül rapor üretildiğinde öğrencinin DMIT raporları
      // otomatik olarak holistic_report_attachments'a eklensin. pdf-merger zaten
      // bu eki rapor sonuna PDF olarak gömüyor.
      //
      // selected_genetic_report_ids verildiyse SADECE seçilenler eklenir.
      // Verilmediyse (geriye uyum) öğrencinin TÜM DMIT raporları eklenir.
      let autoAttachedCount = 0;
      if (inserted?.id) {
        try {
          let geneticIdsToAttach: string[] = [];

          if (Array.isArray(selected_genetic_report_ids)) {
            // Frontend açıkça liste gönderdi (boş olabilir = 'hiçbir DMIT eklenmesin')
            geneticIdsToAttach = selected_genetic_report_ids;
          } else {
            // Liste hiç gelmedi → varsayılan: tüm DMIT raporları
            const { data: studentGeneticReports } = await admin
              .from('genetic_reports')
              .select('id')
              .eq('student_id', student_id)
              .order('uploaded_at', { ascending: true });
            geneticIdsToAttach = (studentGeneticReports || []).map(g => g.id as string);
          }

          if (geneticIdsToAttach.length > 0) {
            // Güvenlik: gönderilen ID'lerin gerçekten bu öğrenciye ait olduğunu doğrula
            const { data: validReports } = await admin
              .from('genetic_reports')
              .select('id')
              .eq('student_id', student_id)
              .in('id', geneticIdsToAttach);
            const validIds = new Set((validReports || []).map(g => g.id as string));

            const attachmentRows = geneticIdsToAttach
              .filter(id => validIds.has(id))
              .map((gid, idx) => ({
                holistic_report_id: inserted.id,
                genetic_report_id: gid,
                position: idx,
              }));

            if (attachmentRows.length > 0) {
              const { error: attachErr } = await admin
                .from('holistic_report_attachments')
                .insert(attachmentRows);
              if (attachErr) {
                console.warn('[holistic auto-attach]', attachErr.message);
              } else {
                autoAttachedCount = attachmentRows.length;
              }
            }
          }
        } catch (e) {
          // Tablo yoksa veya başka hata: sessiz geç, ana rapor zaten kaydedildi
          console.warn('[holistic auto-attach exception]', e);
        }
      }

      return NextResponse.json({
        success: true,
        report,
        id: inserted?.id,
        generated_at: inserted?.generated_at,
        selected_test_types: selectedTypes,
        test_count: filteredResults.length,
        auto_attached_genetic: autoAttachedCount,
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

    // ── Çoklu Zekâ → DETERMİNİSTİK MOTOR (API kullanmaz) ──
    // Öğretmen panelindeki "analiz" butonu artık bu test için kendi sistem
    // analizimizi üretir. Diğer testler şimdilik AI ile devam eder.
    // Deterministik motor (API'SIZ) — motoru olan testler için. Yoksa AI'a düşer.
    const deterministic = buildDeterministicReport(
      testResult.test_type,
      testResult.scores,
      { studentName: student.full_name, studentGrade: null },
    );

    let report: string;
    if (deterministic !== null) {
      report = deterministic;
    } else {
      const prompt = buildSingleTestPrompt({
        studentName: student.full_name,
        studentAge: '—',
        studentGender: '—',
        testName: testResult.test_type,
        testData: testResult.scores ?? {},
      });
      report = await generateAIReport(prompt, { maxTokens: 16000 });
    }

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
      return serverError('reports/generate', updateErr, 500, 'Rapor kaydedilemedi.');
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
      return NextResponse.json({
        error: `Yalnızca kendi raporunuzu yenileyebilirsiniz. [DBG role=${callerProfile.role} uid=${user.id?.slice(-6)} sid=${student_id?.slice(-6)}]`
      }, { status: 403 });
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

    // ── Çoklu Zekâ → DETERMİNİSTİK MOTOR (API kullanmaz) ──
    // Öğretmen panelindeki "analiz" butonu artık bu test için kendi sistem
    // analizimizi üretir. Diğer testler şimdilik AI ile devam eder.
    // Deterministik motor (API'SIZ) — motoru olan testler için. Yoksa AI'a düşer.
    const deterministic = buildDeterministicReport(
      testResult.test_type,
      testResult.scores,
      { studentName: student.full_name, studentGrade: null },
    );

    let report: string;
    if (deterministic !== null) {
      report = deterministic;
    } else {
      const prompt = buildSingleTestPrompt({
        studentName: student.full_name,
        studentAge: '—',
        studentGender: '—',
        testName: testResult.test_type,
        testData: testResult.scores ?? {},
      });
      report = await generateAIReport(prompt, { maxTokens: 16000 });
    }

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