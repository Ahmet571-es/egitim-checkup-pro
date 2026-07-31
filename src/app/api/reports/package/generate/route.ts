/**
 * POST /api/reports/package/generate
 *
 * Faz 9: Paket bazlı bütüncül rapor üretici (3 versiyon).
 *
 * Body: { student_id, package_type }
 *
 * Akış:
 *   1. Yetki: admin/school_admin/teacher (öğrenci + veli reddedilir — KVKK + scope)
 *   2. Öğrenci scope kontrolü
 *   3. Paket testlerinin tamamlanmış olup olmadığı kontrolü
 *   4. Test verilerini çek
 *   5. 3 ayrı prompt → 3 paralel Claude çağrısı
 *   6. Her birini holistic_reports'a kaydet (audience + package_type ile)
 *   7. Response: 3 raporun id'leri
 *
 * KVKK matrisi prompt'larda zorlanmış:
 *   - teacher: tam veri, akademik dil
 *   - parent: skorlar var, ham cevap yok, kesin teşhis yok
 *   - student: skor yok, etiketleme yok, "henüz" çerçeve
 */
import { NextRequest, NextResponse } from 'next/server';
import { logAndMsg } from '@/lib/api/errors';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { type GeneticReportRef, buildIntegratedDeterministicReport, type IntegratedAudience } from '@/lib/report/integrated-report';
import { type PackageReportContext } from '@/lib/ai/prompts/package-reports';
import { PACKAGES, checkPackageCompletion, type PackageType } from '@/lib/packages';

export const runtime = 'nodejs';
export const maxDuration = 300; // 3 versiyonu paralel üreteceğiz, 300s yeterli

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

function calculateAge(birthDate: string | null | undefined): number | undefined {
  if (!birthDate) return undefined;
  try {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age >= 0 && age < 100 ? age : undefined;
  } catch {
    return undefined;
  }
}

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
      .select('test_type, scores, ai_report, created_at')
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
    type TestResultRow = {
      test_type: string;
      scores: Record<string, unknown> | null;
      ai_report: string | null;
      created_at: string;
    };
    const latestByType = new Map<string, TestResultRow>();
    for (const r of (results || []) as TestResultRow[]) {
      if (!latestByType.has(r.test_type)) latestByType.set(r.test_type, r);
    }

    // Paketin gerçekten kullandığı testleri filtrele (aynı testin variant'larından sadece bir tanesi)
    const usedTypes = completion.covered;
    const testData = usedTypes
      .map((tt) => {
        const r = latestByType.get(tt);
        if (!r) return null;
        return {
          test_label: labelFor(tt),
          test_type: tt,
          scores: (r.scores as Record<string, unknown>) || {},
          ai_report: r.ai_report,
          date: r.created_at
            ? new Date(r.created_at).toLocaleDateString('tr-TR', {
                year: 'numeric', month: 'short', day: 'numeric',
              })
            : undefined,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    const studentAge = calculateAge(student.birth_date as string | null | undefined);

    const ctx: PackageReportContext = {
      studentName: student.full_name || 'Öğrenci',
      studentAge,
      studentGrade: student.grade,
      packageDef: pkg,
      testData,
    };

    // ── 3 versiyonu PARALEL üret (Promise.all) ──
    // ═══ DMIT (genetik) PDF'lerini yükle — SADECE teacher prompt'a ek olacak ═══
    // KVKK m.6: parent ve student AI promptlarına ham genetik veri YOLLANMAZ.
    // NOT: Deterministik motor PDF okuyamaz. Eskiden burada PDF indirilip base64'e
    // çevriliyor, sonra yalnızca `.length` olarak kullanılıp atılıyordu.
    // Artık sadece metadata çekiliyor ve rapora gerçekten işleniyor.
    let pkgGeneticReports: GeneticReportRef[] = [];
    if (pkg.uses_genetic) {
      try {
        const { fetchGeneticSummary } = await import('@/lib/ai/genetic-context');
        pkgGeneticReports = await fetchGeneticSummary(studentId);
        console.log(`[package/generate] ${pkgGeneticReports.length} adet DMIT kaydı rapora eklendi (metadata).`);
      } catch (e) {
        console.warn('[package/generate] DMIT özeti alınamadı:', (e as Error).message);
      }
    }

    // Deterministik (API'SIZ) paket raporları — 3 hedef kitle, paket çerçevesiyle.
    // DMIT: belge künyesi + yükleyenin notu teacher raporuna işlenir (PDF içeriği çözümlenmez).
    const pkgTests = testData
      .filter((t): t is NonNullable<typeof t> => t !== null)
      .map((t) => ({ test_type: t.test_type, scores: t.scores, date: t.date }));
    const pkgInfo = { label: pkg.label, description: pkg.description, focus: pkg.audience_focus };
    const mkReport = (audience: IntegratedAudience, hasGenetic: boolean) =>
      buildIntegratedDeterministicReport(
        pkgTests,
        { studentName: ctx.studentName, studentGrade: ctx.studentGrade ?? null },
        audience,
        { hasGeneticContext: hasGenetic, geneticReportCount: pkgGeneticReports.length, geneticReports: hasGenetic ? pkgGeneticReports : undefined, packageInfo: pkgInfo },
      );
    const teacherText = mkReport('ogretmen', pkgGeneticReports.length > 0);
    const parentText = mkReport('ebeveyn', false);
    const studentText = mkReport('ogrenci', false);

    // ── 3 raporu DB'ye kaydet ──
    const reportsToInsert = [
      {
        student_id: studentId,
        school_id: student.school_id,
        report_text: teacherText,
        selected_test_types: usedTypes,
        test_count: usedTypes.length,
        audience: 'teacher',
        package_type: packageType,
      },
      {
        student_id: studentId,
        school_id: student.school_id,
        report_text: parentText,
        selected_test_types: usedTypes,
        test_count: usedTypes.length,
        audience: 'parent',
        package_type: packageType,
      },
      {
        student_id: studentId,
        school_id: student.school_id,
        report_text: studentText,
        selected_test_types: usedTypes,
        test_count: usedTypes.length,
        audience: 'student',
        package_type: packageType,
      },
    ];

    const { data: inserted, error: insertErr } = await admin
      .from('holistic_reports')
      .insert(reportsToInsert)
      .select('id, audience, generated_at');

    if (insertErr) {
      console.error('[package/generate] insert error', insertErr);
      return NextResponse.json(
        { error: logAndMsg('reports/package/generate', insertErr, 'Raporlar kaydedilemedi.') },
        { status: 500 },
      );
    }

    // Response: 3 raporun id'leri ve audience'ları
    const reportMap: Record<string, string> = {};
    for (const r of inserted || []) {
      reportMap[r.audience] = r.id;
    }

    // ═══ Otomatik Genetik Ek (DMIT) ═══
    // Mehmet'in talebi: paket bazlı bütüncül rapor üretildiğinde öğrencinin tüm DMIT
    // raporları otomatik olarak holistic_report_attachments'a eklensin.
    // pdf-merger zaten bu eki PDF olarak rapor sonuna gömüyor.
    //
    // Tüm 3 audience versiyonuna ek yapıyoruz, ama veli/öğrenci versiyonlarında
    // KVKK gereği genetik veri pdf-merger içinde role'a göre filtrelenebilir.
    // (Şu an pdf-merger role bilmiyor — bu Faz 6 davranışıyla aynı: hangi role
    // PDF'i indirirse o görür. Veli versiyonuna PDF download'u zaten yetki
    // kontrolü ile korunuyor.)
    let autoAttachedCount = 0;
    try {
      const { data: studentGeneticReports } = await admin
        .from('genetic_reports')
        .select('id')
        .eq('student_id', studentId)
        .order('uploaded_at', { ascending: true });

      if (Array.isArray(studentGeneticReports) && studentGeneticReports.length > 0 && inserted) {
        const attachmentRows: Array<{ holistic_report_id: string; genetic_report_id: string; position: number }> = [];
        for (const rep of inserted) {
          // Her audience versiyonu için tüm DMIT raporlarını ek yap.
          // Veli versiyonuna eklenmesi: KVKK m.6 — pkg.uses_genetic kontrolü +
          // download endpoint'i zaten role kontrolü yapıyor, veli ham PDF'e
          // erişemediği için güvenli.
          studentGeneticReports.forEach((g, idx) => {
            attachmentRows.push({
              holistic_report_id: rep.id,
              genetic_report_id: g.id,
              position: idx,
            });
          });
        }

        const { error: attachErr } = await admin
          .from('holistic_report_attachments')
          .insert(attachmentRows);
        if (attachErr) {
          console.warn('[package/generate auto-attach]', attachErr.message);
        } else {
          autoAttachedCount = studentGeneticReports.length;
        }
      }
    } catch (e) {
      console.warn('[package/generate auto-attach exception]', e);
    }

    return NextResponse.json({
      success: true,
      package: pkg.label,
      reports: reportMap,
      message: `${pkg.label} paketi için 3 versiyon başarıyla üretildi.`,
      auto_attached_genetic: autoAttachedCount,
    });
  } catch (err) {
    console.error('[package/generate]', err);
    return NextResponse.json({ error: 'Sunucu hatası. Lütfen tekrar deneyin.' }, { status: 500 });
  }
}
