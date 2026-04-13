// ============================================================
// FAZ 3 — Dönem Sonu Rehberlik Raporu Servisi
// ============================================================
import { extractNormalizedScore, TEST_LABELS } from './correlation';
import { calculateRiskScore, getRiskLevel } from './riskScore';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

// ── Tipler ──────────────────────────────────────────────────
export interface GuidanceReportData {
  schoolName: string;
  reportDate: string;
  totalStudents: number;
  totalTests: number;
  // Okul geneli istatistikler
  schoolAverages: Record<string, number>;
  // Risk dağılımı
  riskDistribution: { kritik: number; izlenmeli: number; saglikli: number };
  // Sınıf bazlı özet
  classBreakdown: Array<{
    className: string;
    studentCount: number;
    testCount: number;
    avgRiskScore: number;
    riskLevel: string;
    strongestTest: string;
    weakestTest: string;
  }>;
  // Risk listesi
  riskStudents: Array<{
    studentName: string;
    className: string;
    riskScore: number;
    riskLevel: string;
    flags: string[];
  }>;
}

const TEST_KEYS = [
  'enneagram', 'vark', 'holland', 'coklu-zeka', 'sinav-kaygisi',
  'calisma-davranisi', 'akademik-analiz', 'hizli-okuma', 'd2-dikkat', 'sag-sol-beyin',
];

// ── Rehberlik Raporu Verisini Topla ─────────────────────
export async function collectGuidanceReportData(schoolId: string, supabase: SupabaseClient): Promise<GuidanceReportData> {

  // Okul bilgisi
  const { data: school } = await supabase
    .from('schools')
    .select('name')
    .eq('id', schoolId)
    .single();

  // Sınıflar
  const { data: classes } = await supabase
    .from('classes')
    .select('id, name')
    .eq('school_id', schoolId)
    .order('name');

  const reportData: GuidanceReportData = {
    schoolName: school?.name || 'Okul',
    reportDate: new Date().toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    totalStudents: 0,
    totalTests: 0,
    schoolAverages: {},
    riskDistribution: { kritik: 0, izlenmeli: 0, saglikli: 0 },
    classBreakdown: [],
    riskStudents: [],
  };

  if (!classes || classes.length === 0) return reportData;

  const allScores: Record<string, number[]> = {};

  for (const cls of classes) {
    const { data: students } = await supabase
      .from('class_students')
      .select('student_id, student:profiles!class_students_student_id_fkey(id, full_name)')
      .eq('class_id', cls.id);

    if (!students || students.length === 0) continue;

    const classScores: Record<string, number[]> = {};
    let classTestCount = 0;
    let classRiskSum = 0;
    let classRiskCount = 0;

    for (const s of students) {
      const profile = s.student as unknown as { id: string; full_name: string } | null;
      if (!profile) continue;

      reportData.totalStudents++;

      const { data: results } = await supabase
        .from('test_results')
        .select('test_type, scores')
        .eq('student_id', profile.id)
        .order('created_at', { ascending: false });

      if (!results || results.length === 0) continue;

      classTestCount += results.length;
      reportData.totalTests += results.length;

      // Latest per type
      const latestByType = new Map<string, { test_type: string; scores: Record<string, unknown> }>();
      for (const row of results) {
        if (!latestByType.has(row.test_type)) {
          latestByType.set(row.test_type, {
            test_type: row.test_type,
            scores: row.scores as Record<string, unknown>,
          });
        }
      }

      // Normalize scores
      for (const [testType, data] of latestByType) {
        const score = extractNormalizedScore(testType, data.scores);
        if (score !== null) {
          if (!classScores[testType]) classScores[testType] = [];
          classScores[testType].push(score);
          if (!allScores[testType]) allScores[testType] = [];
          allScores[testType].push(score);
        }
      }

      // Risk
      const risk = calculateRiskScore(Array.from(latestByType.values()));
      classRiskSum += risk.overallScore;
      classRiskCount++;

      if (risk.level === 'kritik') reportData.riskDistribution.kritik++;
      else if (risk.level === 'izlenmeli') reportData.riskDistribution.izlenmeli++;
      else reportData.riskDistribution.saglikli++;

      // Kritik ve izlenmeli öğrencileri listeye ekle
      if (risk.level === 'kritik' || risk.level === 'izlenmeli') {
        reportData.riskStudents.push({
          studentName: profile.full_name,
          className: cls.name,
          riskScore: risk.overallScore,
          riskLevel: risk.label,
          flags: risk.flags.map(f => f.message),
        });
      }
    }

    // Sınıf bazlı özet
    if (classRiskCount > 0) {
      const avgRisk = Math.round(classRiskSum / classRiskCount);
      const level = getRiskLevel(avgRisk);

      // En güçlü / en zayıf test
      let strongest = '';
      let strongestScore = -1;
      let weakest = '';
      let weakestScore = 101;

      for (const [testType, scores] of Object.entries(classScores)) {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        if (avg > strongestScore) { strongest = testType; strongestScore = avg; }
        if (avg < weakestScore) { weakest = testType; weakestScore = avg; }
      }

      reportData.classBreakdown.push({
        className: cls.name,
        studentCount: students.length,
        testCount: classTestCount,
        avgRiskScore: avgRisk,
        riskLevel: level.label,
        strongestTest: TEST_LABELS[strongest] || strongest,
        weakestTest: TEST_LABELS[weakest] || weakest,
      });
    }
  }

  // Okul geneli ortalamalar
  for (const [testType, scores] of Object.entries(allScores)) {
    reportData.schoolAverages[testType] = Math.round(
      scores.reduce((a, b) => a + b, 0) / scores.length
    );
  }

  // Risk listesini risk skoruna göre sırala
  reportData.riskStudents.sort((a, b) => a.riskScore - b.riskScore);

  return reportData;
}

// ── HTML Rapor Oluştur (PDF olarak yazdırılabilir) ──────
export function generateGuidanceReportHTML(data: GuidanceReportData): string {
  const schoolAvgRows = Object.entries(data.schoolAverages)
    .map(([key, val]) => `<tr><td style="padding:6px 12px;border:1px solid #ddd;">${TEST_LABELS[key] || key}</td><td style="padding:6px 12px;border:1px solid #ddd;text-align:center;font-weight:bold;">${val}</td></tr>`)
    .join('');

  const classRows = data.classBreakdown
    .map(c => `<tr>
      <td style="padding:6px 12px;border:1px solid #ddd;">${c.className}</td>
      <td style="padding:6px 12px;border:1px solid #ddd;text-align:center;">${c.studentCount}</td>
      <td style="padding:6px 12px;border:1px solid #ddd;text-align:center;">${c.testCount}</td>
      <td style="padding:6px 12px;border:1px solid #ddd;text-align:center;font-weight:bold;color:${c.avgRiskScore < 30 ? '#dc2626' : c.avgRiskScore <= 60 ? '#d97706' : '#059669'}">${c.avgRiskScore}</td>
      <td style="padding:6px 12px;border:1px solid #ddd;">${c.riskLevel}</td>
      <td style="padding:6px 12px;border:1px solid #ddd;color:#059669;">${c.strongestTest}</td>
      <td style="padding:6px 12px;border:1px solid #ddd;color:#dc2626;">${c.weakestTest}</td>
    </tr>`)
    .join('');

  const riskRows = data.riskStudents.slice(0, 30)
    .map(r => `<tr>
      <td style="padding:6px 12px;border:1px solid #ddd;">${r.studentName}</td>
      <td style="padding:6px 12px;border:1px solid #ddd;">${r.className}</td>
      <td style="padding:6px 12px;border:1px solid #ddd;text-align:center;font-weight:bold;color:${r.riskScore < 30 ? '#dc2626' : '#d97706'}">${r.riskScore}</td>
      <td style="padding:6px 12px;border:1px solid #ddd;">${r.riskLevel}</td>
      <td style="padding:6px 12px;border:1px solid #ddd;font-size:11px;">${r.flags.join('; ') || '—'}</td>
    </tr>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8">
<title>Rehberlik Raporu — ${data.schoolName}</title>
<style>
  body { font-family: 'Segoe UI', Tahoma, sans-serif; color: #1a1a1a; margin: 40px; line-height: 1.6; }
  h1 { color: #0f2847; border-bottom: 3px solid #7c3aed; padding-bottom: 8px; }
  h2 { color: #0f2847; margin-top: 30px; border-left: 4px solid #7c3aed; padding-left: 12px; }
  table { border-collapse: collapse; width: 100%; margin: 12px 0 24px; font-size: 13px; }
  th { background: #f3f4f6; padding: 8px 12px; border: 1px solid #ddd; text-align: left; font-size: 12px; }
  .header-info { display: flex; justify-content: space-between; margin-bottom: 20px; color: #666; font-size: 13px; }
  .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 16px 0; }
  .summary-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; text-align: center; }
  .summary-card .number { font-size: 28px; font-weight: 800; color: #0f2847; }
  .summary-card .label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; }
  .risk-badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
  .risk-kritik { background: #fef2f2; color: #dc2626; }
  .risk-izlenmeli { background: #fffbeb; color: #d97706; }
  .risk-saglikli { background: #f0fdf4; color: #059669; }
  @media print { body { margin: 20px; } h1 { font-size: 20px; } }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center; }
</style>
</head>
<body>
<h1>REHBERLIK SERVISi DONEM SONU RAPORU</h1>
<div class="header-info">
  <span><strong>${data.schoolName}</strong></span>
  <span>Rapor Tarihi: ${data.reportDate}</span>
</div>

<h2>1. Genel Ozet</h2>
<div class="summary-grid">
  <div class="summary-card">
    <div class="number">${data.totalStudents}</div>
    <div class="label">Toplam Ogrenci</div>
  </div>
  <div class="summary-card">
    <div class="number">${data.totalTests}</div>
    <div class="label">Tamamlanan Test</div>
  </div>
  <div class="summary-card">
    <div class="number" style="color:#dc2626">${data.riskDistribution.kritik}</div>
    <div class="label">Kritik Ogrenci</div>
  </div>
  <div class="summary-card">
    <div class="number" style="color:#d97706">${data.riskDistribution.izlenmeli}</div>
    <div class="label">Izlenmeli Ogrenci</div>
  </div>
</div>

<h2>2. Okul Geneli Test Ortalamalari</h2>
<table>
<thead><tr><th>Test</th><th style="text-align:center;">Ortalama (0-100)</th></tr></thead>
<tbody>${schoolAvgRows || '<tr><td colspan="2" style="text-align:center;color:#999;">Veri yok</td></tr>'}</tbody>
</table>

<h2>3. Sinif Bazli Ozet</h2>
<table>
<thead><tr><th>Sinif</th><th style="text-align:center;">Ogrenci</th><th style="text-align:center;">Test</th><th style="text-align:center;">Risk Skoru</th><th>Seviye</th><th>En Guclu</th><th>En Zayif</th></tr></thead>
<tbody>${classRows || '<tr><td colspan="7" style="text-align:center;color:#999;">Veri yok</td></tr>'}</tbody>
</table>

<h2>4. Risk Altindaki Ogrenciler</h2>
<table>
<thead><tr><th>Ogrenci</th><th>Sinif</th><th style="text-align:center;">Risk Skoru</th><th>Seviye</th><th>Uyarilar</th></tr></thead>
<tbody>${riskRows || '<tr><td colspan="5" style="text-align:center;color:#999;">Risk altinda ogrenci yok</td></tr>'}</tbody>
</table>

<div class="footer">
  Bu rapor Egitim Check-Up platformu tarafindan otomatik olusturulmustur. &copy; ${new Date().getFullYear()}
</div>
</body>
</html>`;
}
