/**
 * Excel Rapor Üretici — exceljs (tam Unicode/Türkçe desteği)
 */
import ExcelJS from 'exceljs';

export interface ExcelStudentData {
  studentId: string;
  studentName: string;
  className?: string;
  testResults: Array<{
    testType: string;
    testName: string;
    completedAt: string | null;
    scores: Record<string, unknown>;
    aiReport?: string | null;
    aiReportGeneratedAt?: string | null;
  }>;
}

const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF0F2847' },
};

const ACCENT_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF10B981' },
};

const ZEBRA_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF8FAFC' },
};

function styleHeader(ws: ExcelJS.Worksheet, row: ExcelJS.Row): void {
  row.eachCell(cell => {
    cell.fill = HEADER_FILL;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Arial' };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    };
  });
  row.height = 32;
}

function styleDataRow(row: ExcelJS.Row, isZebra: boolean): void {
  row.eachCell({ includeEmpty: true }, cell => {
    if (isZebra) cell.fill = ZEBRA_FILL;
    cell.font = { size: 10, name: 'Arial' };
    cell.alignment = { vertical: 'top', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    };
  });
}

// Öğrenci bazlı Excel
export async function generateStudentExcel(data: ExcelStudentData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'EĞİTİM CHECK UP Pro';
  wb.created = new Date();

  // ── SAYFA 1: ÖĞRENCİ PROFİLİ ──
  const ws1 = wb.addWorksheet('Öğrenci Profili');
  ws1.columns = [
    { key: 'label', width: 22 },
    { key: 'value', width: 50 },
  ];

  const profileTitle = ws1.addRow(['EĞİTİM CHECK UP Pro — Öğrenci Dosyası', '']);
  ws1.mergeCells(`A1:B1`);
  profileTitle.getCell(1).font = { bold: true, size: 14, color: { argb: 'FF0F2847' }, name: 'Arial' };
  profileTitle.height = 28;

  ws1.addRow([]);

  const profileData = [
    ['Ad Soyad', data.studentName],
    ['Sınıf', data.className ?? '—'],
    ['Çözülen Test Sayısı', data.testResults.length],
    ['AI Raporu Olan Test', data.testResults.filter(t => t.aiReport).length],
    ['Rapor Tarihi', new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })],
  ];

  profileData.forEach(([label, value], idx) => {
    const row = ws1.addRow({ label, value });
    row.getCell(1).font = { bold: true, size: 11, name: 'Arial' };
    row.getCell(2).font = { size: 11, name: 'Arial' };
    if (idx % 2 === 0) {
      row.getCell(1).fill = ZEBRA_FILL;
      row.getCell(2).fill = ZEBRA_FILL;
    }
    row.height = 22;
  });

  // ── SAYFA 2: TEST SONUÇLARI ──
  const ws2 = wb.addWorksheet('Test Sonuçları');
  ws2.columns = [
    { key: 'no', header: 'No', width: 6 },
    { key: 'testName', header: 'Test Adı', width: 30 },
    { key: 'completedAt', header: 'Tamamlanma Tarihi', width: 22 },
    { key: 'scores', header: 'Puan Detayları', width: 50 },
    { key: 'hasReport', header: 'AI Raporu', width: 12 },
    { key: 'reportDate', header: 'Rapor Tarihi', width: 20 },
  ];

  const headerRow2 = ws2.getRow(1);
  styleHeader(ws2, headerRow2);
  ws2.views = [{ state: 'frozen', ySplit: 1 }];

  data.testResults.forEach((t, idx) => {
    const scoresText = Object.entries(t.scores ?? {})
      .slice(0, 15)
      .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v).slice(0, 50) : v}`)
      .join('\n');

    const row = ws2.addRow({
      no: idx + 1,
      testName: t.testName,
      completedAt: t.completedAt
        ? new Date(t.completedAt).toLocaleDateString('tr-TR')
        : '—',
      scores: scoresText,
      hasReport: t.aiReport ? '✅ Var' : '❌ Yok',
      reportDate: t.aiReportGeneratedAt
        ? new Date(t.aiReportGeneratedAt).toLocaleDateString('tr-TR')
        : '—',
    });
    styleDataRow(row, idx % 2 === 0);
    row.height = Math.max(20, Math.min(120, Object.keys(t.scores ?? {}).length * 14));
  });

  // ── SAYFA 3: AI RAPORLARI ──
  const ws3 = wb.addWorksheet('AI Raporları');
  ws3.columns = [
    { key: 'no', header: 'No', width: 6 },
    { key: 'testName', header: 'Test Adı', width: 30 },
    { key: 'reportDate', header: 'Rapor Tarihi', width: 20 },
    { key: 'report', header: 'AI Rapor İçeriği', width: 100 },
  ];

  const headerRow3 = ws3.getRow(1);
  styleHeader(ws3, headerRow3);
  ws3.views = [{ state: 'frozen', ySplit: 1 }];

  const reportedTests = data.testResults.filter(t => t.aiReport);

  if (reportedTests.length === 0) {
    const emptyRow = ws3.addRow({ no: '', testName: 'Henüz AI raporu oluşturulmamış.', reportDate: '', report: '' });
    styleDataRow(emptyRow, false);
  } else {
    reportedTests.forEach((t, idx) => {
      let reportContent = t.aiReport ?? '';
      if (reportContent.length > 32000) {
        reportContent = reportContent.slice(0, 32000) + '\n... (kesildi)';
      }
      const row = ws3.addRow({
        no: idx + 1,
        testName: t.testName,
        reportDate: t.aiReportGeneratedAt
          ? new Date(t.aiReportGeneratedAt).toLocaleDateString('tr-TR')
          : '—',
        report: reportContent,
      });
      styleDataRow(row, idx % 2 === 0);
      row.height = 80;
    });
  }

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

// Sınıf bazlı toplu Excel
export async function generateClassExcel(
  students: ExcelStudentData[],
  className?: string
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'EĞİTİM CHECK UP Pro';
  wb.created = new Date();

  // ── SAYFA 1: ÖĞRENCİ LİSTESİ ──
  const ws1 = wb.addWorksheet('Öğrenci Listesi');
  ws1.columns = [
    { key: 'no', header: 'No', width: 6 },
    { key: 'name', header: 'Ad Soyad', width: 30 },
    { key: 'class', header: 'Sınıf', width: 15 },
    { key: 'testCount', header: 'Çözülen Test', width: 14 },
    { key: 'reportCount', header: 'AI Rapor', width: 12 },
  ];

  styleHeader(ws1, ws1.getRow(1));
  ws1.views = [{ state: 'frozen', ySplit: 1 }];

  students.forEach((s, idx) => {
    const row = ws1.addRow({
      no: idx + 1,
      name: s.studentName,
      class: s.className ?? className ?? '—',
      testCount: s.testResults.length,
      reportCount: s.testResults.filter(t => t.aiReport).length,
    });
    styleDataRow(row, idx % 2 === 0);
  });

  // ── SAYFA 2: TÜM TEST SONUÇLARI ──
  const ws2 = wb.addWorksheet('Test Sonuçları');
  ws2.columns = [
    { key: 'no', header: 'No', width: 6 },
    { key: 'student', header: 'Öğrenci', width: 28 },
    { key: 'testName', header: 'Test Adı', width: 30 },
    { key: 'completedAt', header: 'Tamamlanma', width: 18 },
    { key: 'scores', header: 'Özet Puan', width: 50 },
    { key: 'hasReport', header: 'Rapor', width: 10 },
  ];

  styleHeader(ws2, ws2.getRow(1));
  ws2.views = [{ state: 'frozen', ySplit: 1 }];

  let rowIdx = 0;
  students.forEach(s => {
    s.testResults.forEach(t => {
      rowIdx++;
      const scoresText = Object.entries(t.scores ?? {})
        .slice(0, 8)
        .map(([k, v]) => `${k}: ${typeof v === 'object' ? '...' : v}`)
        .join(', ');

      const row = ws2.addRow({
        no: rowIdx,
        student: s.studentName,
        testName: t.testName,
        completedAt: t.completedAt
          ? new Date(t.completedAt).toLocaleDateString('tr-TR')
          : '—',
        scores: scoresText,
        hasReport: t.aiReport ? '✅' : '—',
      });
      styleDataRow(row, rowIdx % 2 === 0);
    });
  });

  const buf2 = await wb.xlsx.writeBuffer();
  return Buffer.from(buf2);
}
