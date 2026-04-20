import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateAIReport } from '@/lib/ai/claude-client';
import {
  buildIntegratedReportPrompt,
  normalizeTestName,
  type IntegratedReportType,
} from '@/lib/ai/prompts/integrated-report';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      student_id,
      report_types = ['ogretmen', 'ogrenci', 'ebeveyn'],
      selected_test_types,
      selected_result_ids,
    } = body as {
      student_id: string;
      report_types?: IntegratedReportType[];
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
    const { data: callerProfile } = await admin
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

    // Öğrenci bilgilerini çek (admin — RLS bypass)
    const { data: student, error: studentErr } = await admin
      .from('profiles')
      .select('id, full_name, school_id')
      .eq('id', student_id)
      .single();

    if (studentErr || !student) {
      console.error('[integrated] student fetch error:', studentErr?.message);
      return NextResponse.json({ error: 'Öğrenci bulunamadı.' }, { status: 404 });
    }

    // Cross-school kontrol
    if (callerProfile.role !== 'admin' && callerProfile.school_id && student.school_id !== callerProfile.school_id) {
      return NextResponse.json({ error: 'Bu öğrenci sizin okulunuzda değil.' }, { status: 403 });
    }

    // Tüm tamamlanmış test sonuçlarını çek (admin — RLS bypass)
    const { data: allResults, error: resultsErr } = await admin
      .from('test_results')
      .select('id, test_type, scores, completed_at')
      .eq('student_id', student_id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: true });

    if (resultsErr) {
      console.error('[integrated] results fetch error:', resultsErr.message);
      return NextResponse.json({ error: 'Test sonuçları çekilemedi: ' + resultsErr.message }, { status: 500 });
    }

    if (!allResults || allResults.length < 2) {
      return NextResponse.json(
        { error: `Entegre rapor için en az 2 tamamlanmış test gereklidir. Mevcut: ${allResults?.length || 0}` },
        { status: 400 }
      );
    }

    // Seçili test tipleri belirtildiyse filtrele — her tip için en son kaydı al
    let results = allResults;
    // Öncelik: selected_result_ids (spesifik kayıt)
    if (selected_result_ids && selected_result_ids.length > 0) {
      const idSet = new Set(selected_result_ids);
      results = allResults.filter(r => idSet.has(r.id));

      if (results.length < 2) {
        return NextResponse.json(
          { error: `Seçilen kayıtlardan en az 2'si bulunmalıdır. Uygun: ${results.length}` },
          { status: 400 }
        );
      }
    } else if (selected_test_types && selected_test_types.length > 0) {
      const selectedSet = new Set(selected_test_types);
      // Her test tipinin en son kaydını al (order ASC, sonuncu en güncel)
      const latestByType = new Map<string, typeof allResults[0]>();
      for (const r of allResults) {
        if (selectedSet.has(r.test_type)) {
          latestByType.set(r.test_type, r);
        }
      }
      results = Array.from(latestByType.values());

      if (results.length < 2) {
        return NextResponse.json(
          { error: `Seçilen testlerden en az 2'sinin tamamlanmış olması gerekir. Uygun test: ${results.length}` },
          { status: 400 }
        );
      }
    }

    const testDataList = results.map(r => ({
      test_name: normalizeTestName(r.test_type),
      scores: r.scores ?? {},
      date: r.completed_at,
    }));

    // Mevcut entegre raporu kontrol et (admin — RLS bypass)
    const { data: existingReport } = await admin
      .from('integrated_reports')
      .select('id, teacher_report, student_report, parent_report, generated_at')
      .eq('student_id', student_id)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingReport) {
      return NextResponse.json({
        success: true,
        already_generated: true,
        reports: {
          ogretmen: existingReport.teacher_report,
          ogrenci: existingReport.student_report,
          ebeveyn: existingReport.parent_report,
        },
        generated_at: existingReport.generated_at,
        message: 'Entegre rapor daha önce üretilmiş. Yenilemek için Yenile butonunu kullanın.',
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
      const text = await generateAIReport(prompt, { maxTokens: 16000 });
      reports[reportType] = text;
    });
    await Promise.all(genPromises);

    // Admin client ile entegre raporları kaydet (RLS bypass)
    const sourceTestTypes = results.map(r => r.test_type);
    const insertPayload: Record<string, unknown> = {
      student_id: student.id,
      school_id: student.school_id,
      teacher_report: reports.ogretmen ?? null,
      student_report: reports.ogrenci ?? null,
      parent_report: reports.ebeveyn ?? null,
      test_count: results.length,
      source_test_types: sourceTestTypes,
      generated_at: new Date().toISOString(),
    };

    let { error: insertErr } = await admin.from('integrated_reports').insert(insertPayload);

    // Fallback: eğer source_test_types kolonu henüz migrate edilmediyse, onu çıkarıp tekrar dene
    if (insertErr && /source_test_types|column.*does not exist/i.test(insertErr.message)) {
      console.warn('[integrated] source_test_types kolonu yok, eski şema ile kaydediliyor. Migration çalıştırılmalı!');
      delete insertPayload.source_test_types;
      const retry = await admin.from('integrated_reports').insert(insertPayload);
      insertErr = retry.error;
    }

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
        // Velileri bul (admin — RLS bypass)
        const { data: parentLinks } = await admin
          .from('parent_students')
          .select('parent_id')
          .eq('student_id', student.id);
        for (const link of parentLinks ?? []) {
          if (link.parent_id) {
            sendReportReadyEmail(link.parent_id, student.full_name, 'Entegre 3\'lü Veli Raporu').catch(console.warn);
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
    const msg = err instanceof Error ? err.message : 'Sunucu hatası.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// Zorla yenileme
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { student_id, selected_test_types, selected_result_ids } = body as {
      student_id: string;
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
    const { data: callerProfile } = await admin
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

    // Admin ile çek (RLS bypass)
    const { data: student } = await admin
      .from('profiles')
      .select('id, full_name, school_id')
      .eq('id', student_id)
      .single();

    if (!student) {
      return NextResponse.json({ error: 'Öğrenci bulunamadı.' }, { status: 404 });
    }

    // Cross-school
    if (callerProfile.role !== 'admin' && callerProfile.school_id && student.school_id !== callerProfile.school_id) {
      return NextResponse.json({ error: 'Bu öğrenci sizin okulunuzda değil.' }, { status: 403 });
    }

    const { data: allResultsPut } = await admin
      .from('test_results')
      .select('id, test_type, scores, completed_at')
      .eq('student_id', student_id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: true });

    if (!allResultsPut || allResultsPut.length < 2) {
      return NextResponse.json({ error: `Yetersiz test sayısı. Mevcut: ${allResultsPut?.length || 0}, gereken: 2+` }, { status: 400 });
    }

    // Seçili testler varsa filtrele
    let results = allResultsPut;
    // Öncelik: selected_result_ids
    if (selected_result_ids && selected_result_ids.length > 0) {
      const idSet = new Set(selected_result_ids);
      results = allResultsPut.filter(r => idSet.has(r.id));

      if (results.length < 2) {
        return NextResponse.json(
          { error: `Seçilen kayıtlardan en az 2'si bulunmalıdır. Uygun: ${results.length}` },
          { status: 400 }
        );
      }
    } else if (selected_test_types && selected_test_types.length > 0) {
      const selectedSet = new Set(selected_test_types);
      const latestByType = new Map<string, typeof allResultsPut[0]>();
      for (const r of allResultsPut) {
        if (selectedSet.has(r.test_type)) {
          latestByType.set(r.test_type, r);
        }
      }
      results = Array.from(latestByType.values());

      if (results.length < 2) {
        return NextResponse.json(
          { error: `Seçilen testlerden en az 2'sinin tamamlanmış olması gerekir. Uygun test: ${results.length}` },
          { status: 400 }
        );
      }
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
      reports[reportType] = await generateAIReport(prompt, { maxTokens: 16000 });
    }));

    // Admin client ile kaydet (RLS bypass)
    const sourceTestTypesPut = results.map(r => r.test_type);
    const putPayload: Record<string, unknown> = {
      student_id: student.id,
      school_id: student.school_id,
      teacher_report: reports.ogretmen,
      student_report: reports.ogrenci,
      parent_report: reports.ebeveyn,
      test_count: results.length,
      source_test_types: sourceTestTypesPut,
      generated_at: new Date().toISOString(),
    };

    let { error: insErr } = await admin.from('integrated_reports').insert(putPayload);

    // Fallback: kolon yoksa source_test_types'ı çıkarıp tekrar dene
    if (insErr && /source_test_types|column.*does not exist/i.test(insErr.message)) {
      console.warn('[integrated PUT] source_test_types kolonu yok, eski şema ile kaydediliyor.');
      delete putPayload.source_test_types;
      const retry = await admin.from('integrated_reports').insert(putPayload);
      insErr = retry.error;
    }

    if (insErr) {
      console.error('[integrated PUT insert]', insErr.message);
      return NextResponse.json({
        success: true,
        warning: 'Rapor üretildi ama kaydedilemedi: ' + insErr.message,
        reports,
      });
    }

    return NextResponse.json({ success: true, reports });
  } catch (err) {
    console.error('[reports/integrated PUT]', err);
    const msg = err instanceof Error ? err.message : 'Sunucu hatası.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}