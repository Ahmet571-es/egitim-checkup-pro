/**
 * Holistic (kapsamlı öğretmen) DETAYLI RAPOR — deterministik, API'SIZ.
 *
 * Entegre rapordan farkı: risk analizi + çapraz örüntüler + kariyer eşleşmesi
 * (hepsi zaten deterministik hesaplanan) katmanlarını da içerir. Öğretmen/koç
 * odaklıdır ve holistic_reports tablosuna kaydedilir.
 *
 * riskResult / patterns / careerMatch dışarıdan (deterministik servislerden)
 * gelir; bu motor onları görselleştirip test bulgularıyla harmanlar.
 */
import {
  clampPct, statGrid, gauge, barsBlock, insight,
  reportFooter, safeName, type StudentInfo,
  radarBlock, compareBlock, chainBlock, timelineBlock,
} from './report-blocks';
import { extractHighlight, crossPatterns, type Highlight } from './integrated-report';
import { tamlayan } from '@/lib/utils/turkish';

// Servis tipleriyle uyumlu gevşek arayüzler (bağımlılık gevşek tutulur)
interface RiskDimensionLike { key: string; name: string; score: number | null; weight: number; available: boolean; }
interface RiskFlagLike { id: string; message: string; severity: 'kritik' | 'uyarı'; icon: string; }
interface RiskResultLike { overallScore: number; label: string; emoji?: string; dimensions: RiskDimensionLike[]; flags: RiskFlagLike[]; }
interface PatternLike { id: string; title: string; description: string; severity: 'kritik' | 'uyarı' | 'bilgi'; relatedTests?: string[]; icon?: string; }
interface CareerLike { rank: number; career: string; field: string; matchScore: number; reasons: string[]; icon?: string; }
interface CareerMatchLike { topCareers: CareerLike[]; hollandCode: string | null; dominantZeka: string | null; varkStyle: string | null; compatibilityNote?: string; }

export function buildHolisticDeterministicReport(
  tests: Array<{ test_type: string; scores: unknown }>,
  student: StudentInfo,
  riskResult: RiskResultLike,
  patterns: PatternLike[],
  careerMatch: CareerMatchLike,
  opts?: { hasGeneticReport?: boolean; geneticReportCount?: number },
): string {
  const name = safeName(student);

  const highlights = tests
    .map((t) => extractHighlight(t.test_type, (t.scores as Record<string, unknown>) || {}))
    .filter((h): h is Highlight => h !== null)
    .sort((a, b) => a.order - b.order);
  const potansiyel = highlights.filter((h) => h.group === 'potansiyel');
  const performans = highlights.filter((h) => h.group === 'performans');

  const risk = clampPct(riskResult?.overallScore ?? 0);
  // NOT: overallScore yüksek = İYİ (düşük risk). Renk: yüksek=yeşil.
  const availDims = (riskResult?.dimensions || []).filter((d) => d.available && d.score != null);

  const P: string[] = [];

  const grade = student.studentGrade ? `${student.studentGrade}. Sınıf` : 'Belirtilmemiş';
  P.push(`# 🎓 HOLİSTİK DEĞERLENDİRME RAPORU (Öğretmen / Koç)\n`);
  P.push(`| Alan | Bilgi |\n|---|---|\n| İsim | ${name} |\n| Sınıf | ${grade} |\n| Değerlendirme | Holistik Analiz (${highlights.length} test) |\n`);

  P.push(statGrid([
    { label: 'Genel Gelişim Skoru', value: risk, unit: '%', theme: risk >= 70 ? 'success' : risk >= 40 ? 'warning' : 'danger', icon: 'activity' },
    { label: 'Durum', value: riskResult?.label || '—', theme: 'primary', icon: 'award' },
    { label: 'Dikkat Bayrağı', value: (riskResult?.flags || []).length, theme: (riskResult?.flags || []).length ? 'warning' : 'success', icon: 'target' },
  ]));
  P.push('---\n');

  P.push(`## 🔎 Bu Rapor Nedir?\n`);
  P.push(
    `Bu holistik rapor, ${tamlayan(name)} **${highlights.length} test sonucunu** bütünleşik olarak değerlendirir ve üç ek katman sunar: ` +
    `**gelişim/risk analizi**, **çapraz örüntüler** ve **kariyer eşleşmesi**. ` +
    `Öğretmen ve koç perspektifinden, sınıf içi uygulama ve bireysel rehberlik için tasarlanmıştır.\n`,
  );
  P.push('---\n');

  // ── 1. GELİŞİM / RİSK ANALİZİ ──
  P.push(`## 🧭 1. Genel Gelişim ve Risk Analizi\n`);
  P.push(gauge('Genel Gelişim Skoru', risk, { zones: 'Öncelikli:0-40,İzlenmeli:40-70,İyi:70-100', caption: `Yüksek skor daha olumlu tabloyu gösterir — ${riskResult?.label || ''}` }));
  if (availDims.length >= 2) {
    P.push(barsBlock('Gelişim Boyutları (%)', availDims.map((d) => [d.name, clampPct(d.score as number)])));
  }
  const flags = riskResult?.flags || [];
  if (flags.length) {
    P.push(`### ⚠️ Dikkat Edilebilecek Noktalar\n`);
    for (const f of flags.slice(0, 6)) {
      P.push(insight(f.severity === 'kritik' ? 'risk' : 'note', `${f.icon || '•'} ${f.severity === 'kritik' ? 'Kritik' : 'Uyarı'}`, f.message));
    }
  } else {
    P.push(insight('strength', 'Olumlu Tablo', `${name} için belirgin bir risk bayrağı görünmüyor; genel tablo destekleyici.`));
  }
  P.push('---\n');

  // ── BÜTÜNLEŞİK PROFİL HARİTASI ──
  {
    const allMetrics = highlights.filter((h) => h.metric);
    if (allMetrics.length >= 3) {
      P.push(`## 🗺️ Bütünleşik Profil Haritası\n`);
      P.push(`Tüm testlerin ana göstergeleri tek bir görüntüde. Uçlar arasındaki dengesizlik, öncelik belirlemede yol gösterir.\n`);
      P.push(radarBlock('Tüm Göstergeler (%)', allMetrics.map((h) => [h.metric!.label, clampPct(h.metric!.value)] as [string, number])));
      const ort = clampPct(allMetrics.reduce((a, h) => a + h.metric!.value, 0) / allMetrics.length);
      P.push(compareBlock(
        'Göstergeler — Kendi Genel Ortalamasıyla Karşılaştırma',
        allMetrics.map((h) => [h.metric!.label, clampPct(h.metric!.value), ort] as [string, number, number]),
        { selfLabel: name.split(' ')[0] || name, refLabel: 'Kendi ortalaması' },
      ));
      P.push('---\n');
    }
  }

  // ── 2. TEST PROFİLİ (potansiyel + performans) ──
  if (potansiyel.length) {
    P.push(`## 🌟 2. Potansiyel Profili — Öğrenme ve Kişilik\n`);
    for (const h of potansiyel) {
      P.push(`### ${h.icon} ${h.name}\n${h.headline}\n${h.points.length ? '\n' + h.points.map((p) => `- ${p}`).join('\n') + '\n' : ''}`);
    }
    P.push('---\n');
  }
  if (performans.length) {
    P.push(`## 📈 3. Performans ve Gelişim Alanları\n`);
    const perfMetrics = performans.filter((h) => h.metric).map((h) => [h.metric!.label, h.metric!.value] as [string, number]);
    if (perfMetrics.length >= 2) P.push(barsBlock('Performans Alanları (%)', perfMetrics));
    for (const h of performans) {
      P.push(`### ${h.icon} ${h.name}\n${h.headline}\n${h.points.length ? '\n' + h.points.map((p) => `- ${p}`).join('\n') + '\n' : ''}`);
    }
    P.push('---\n');
  }

  // ── TESTLER ARASI ÖRÜNTÜLER (deterministik motor) ──
  {
    const pats = crossPatterns(name, highlights);
    if (pats.length) {
      const pek = pats.filter((p) => p.kind === 'pekistirme');
      const ger = pats.filter((p) => p.kind === 'gerilim');
      const fir = pats.filter((p) => p.kind === 'firsat');
      P.push(`## 🔗 Testler Arası Örüntüler\n`);
      P.push(`Testlerin birbirini doğruladığı, birbiriyle gerildiği ve birlikte fırsat yarattığı noktalar.\n`);
      if (pek.length) {
        P.push(`### ✅ Birbirini Doğrulayan Bulgular\n`);
        P.push(chainBlock('Pekiştiren Örüntüler', pek.map((p) => p.chain)));
        for (const p of pek) P.push(insight('strength', p.title, p.text));
      }
      if (ger.length) {
        P.push(`### ⚠️ Dikkat Gerektiren Kombinasyonlar\n`);
        P.push(`Bu kombinasyonlar, doğru önerinin yanlış soruna uygulanmasını önler. Sıralama önemlidir.\n`);
        P.push(chainBlock('Gerilim Örüntüleri', ger.map((p) => p.chain)));
        for (const p of ger) P.push(insight('risk', p.title, p.text));
      }
      if (fir.length) {
        P.push(`### 🚀 Birlikte Yarattığı Fırsatlar\n`);
        P.push(chainBlock('Fırsat Örüntüleri', fir.map((p) => p.chain)));
        for (const p of fir) P.push(insight('action', p.title, p.text));
      }
      P.push('---\n');

      // Öncelik sıralı plan
      const steps: [string, string?, string?][] = [['Sonucu öğrenciyle paylaşın', 'Hangi bulguya şaşırdığını sorun; farkındalık ilk adımdır.', '1. hafta']];
      for (const g of ger.slice(0, 3)) steps.push([g.title, g.chain[2], `${steps.length + 1}. hafta`]);
      steps.push(['Ara değerlendirme', 'Ne değişti, hangi yaklaşım işe yaradı — birlikte konuşun.', `${steps.length + 1}. hafta`]);
      steps.push(['Yeniden ölç', 'Testleri tekrar alıp profildeki değişimi karşılaştırın.', '8–10. hafta']);
      P.push(`## 📅 Öncelik Sıralı Plan\n`);
      P.push(`Sıra, tek tek test sonuçlarından değil testlerin birlikte söylediğinden çıkarıldı.\n`);
      P.push(timelineBlock(`${tamlayan(name)} Yol Haritası`, steps));
      P.push('---\n');
    }
  }

  // ── 4. ÇAPRAZ ÖRÜNTÜLER (correlation servisi) ──
  if (patterns && patterns.length) {
    P.push(`## 🧩 4. Çapraz Test Örüntüleri\n`);
    P.push(`*Farklı testlerin birlikte işaret ettiği örüntüler (otomatik korelasyon analizi).*\n`);
    for (const p of patterns.slice(0, 6)) {
      const type = p.severity === 'kritik' ? 'risk' : p.severity === 'uyarı' ? 'action' : 'note';
      P.push(insight(type, `${p.icon || '🔗'} ${p.title}`, p.description));
    }
    P.push('---\n');
  }

  // ── 5. KARİYER EŞLEŞMESİ (careerMatch servisi) ──
  if (careerMatch && (careerMatch.topCareers?.length || careerMatch.hollandCode || careerMatch.dominantZeka)) {
    P.push(`## 🎯 5. Kariyer Yönelim Analizi\n`);
    const bits: string[] = [];
    if (careerMatch.dominantZeka) bits.push(`baskın zekâ **${careerMatch.dominantZeka}**`);
    if (careerMatch.hollandCode) bits.push(`Holland kodu **${careerMatch.hollandCode}**`);
    if (careerMatch.varkStyle) bits.push(`öğrenme stili **${careerMatch.varkStyle}**`);
    if (bits.length) P.push(`${tamlayan(name)} profili (${bits.join(', ')}) temel alınarak aşağıdaki alanlar öne çıkıyor. Bunlar bir öneri havuzudur; ilgi, yetenek ve olanaklarla birlikte değerlendirilmesi yerinde olur.\n`);
    if (careerMatch.topCareers?.length) {
      P.push(`| # | Meslek / Alan | Uyum |\n|---|---|---|`);
      P.push(careerMatch.topCareers.slice(0, 5).map((c) => `| ${c.rank} | ${c.icon || ''} ${c.career} (${c.field}) | %${clampPct(c.matchScore)} |`).join('\n') + '\n');
      const top = careerMatch.topCareers[0];
      if (top?.reasons?.length) P.push(insight('note', `Neden ${top.career}?`, top.reasons.map((r) => `• ${r}`).join('\n')));
    }
    if (careerMatch.compatibilityNote) P.push(insight('note', 'Not', careerMatch.compatibilityNote));
    P.push('---\n');
  }

  // ── 6. DMIT NOTU ──
  if (opts?.hasGeneticReport) {
    P.push(`## 🧬 6. Genetik Analiz (DMIT) Notu\n`);
    P.push(insight('note', 'DMIT Raporu Mevcut', `${name} için ${opts.geneticReportCount ?? 1} adet DMIT/parmak izi raporu sistemde kayıtlı. Bu belgeler ayrıca incelenebilir; yukarıdaki bulgularla birlikte değerlendirilmesi bütüncül bir bakış sağlayabilir.`));
    P.push('---\n');
  }

  // ── 7. ÖĞRETMEN ÖNERİLERİ ──
  P.push(`## 📌 ${patterns && patterns.length ? '7' : '6'}. Öğretmen ve Koça Öneriler\n`);
  if (potansiyel[0]) P.push(insight('strength', 'Güçlü Yönü Merkeze Al', `${potansiyel[0].headline.replace(/\*\*/g, '')}`));
  const criticalFlag = flags.find((f) => f.severity === 'kritik');
  if (criticalFlag) P.push(insight('action', 'Öncelikli İzleme', criticalFlag.message));
  const focusPerf = performans.find((h) => h.metric && h.metric.value < 60);
  if (focusPerf) P.push(insight('action', 'Gelişim Alanı', `${focusPerf.name}: ${focusPerf.points[0] || 'hedefli, düzenli çalışma önerilebilir.'}`));
  P.push(`- ${tamlayan(name)} güçlü öğrenme kanalını görev ve materyal seçiminde işe koşmak, katılımı ve motivasyonu artırabilir.\n- Somut, yönteme dönük geri bildirim, genel övgüden daha etkili olabilir.\n- Gelişim alanlarını güçlü yönler üzerinden desteklemek (köprü kurmak) verimli olabilir.\n`);
  P.push('---\n');

  P.push(`## 🌱 Kapanış\n`);
  P.push(`${tamlayan(name)} holistik profili, güçlü yönleri belirgin, yönlendirilebilir bir tabloyu işaret ediyor. Güçlü yönleri merkeze alan, gelişim ve risk alanlarını yargılamadan izleyen bütüncül bir yaklaşım en verimli sonucu getirebilir. Bu profil zamanla gelişebilir.\n`);
  P.push(reportFooter());
  return P.join('\n');
}
