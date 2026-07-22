/**
 * Entegre (çok-testli) DETAYLI RAPOR — deterministik, API'SIZ.
 *
 * Birden fazla test sonucunu tek bir bütünleşik anlatıda sentezler. Üç hedef
 * kitle için üretilir: 'ogretmen' | 'ogrenci' | 'ebeveyn'.
 *
 * Sabit sıralama (prompt ile aynı): VARK → Sağ-Sol Beyin → Çoklu Zekâ →
 * Enneagram → Holland ("Potansiyel Analiz"), ardından akademik/dikkat/okuma/
 * kaygı/çalışma ("Performans ve Gelişim"). Çapraz bağlantılar deterministik
 * kurallarla çıkarılır.
 *
 * Ton: yalın, tavsiye edici, olasılıksal, klinik tanı yok.
 */
import {
  clampPct, statGrid, barsBlock, insight,
  reportFooter, safeName, type StudentInfo, type StatTheme,
} from './report-blocks';

export type IntegratedAudience = 'ogretmen' | 'ogrenci' | 'ebeveyn';

export interface Highlight {
  order: number;
  group: 'potansiyel' | 'performans';
  testType: string;
  name: string;
  icon: string;
  headline: string;
  points: string[];
  metric?: { label: string; value: number; theme: StatTheme };
  tag?: string; // çapraz bağlantı etiketi (ör. 'gorsel', 'analitik', 'sosyal')
}

// ── küçük yardımcılar ────────────────────────────────────
function n(v: unknown, d = 0): number { const x = Number(v); return Number.isFinite(x) ? x : d; }
function s(v: unknown, d = '—'): string { return (v == null || v === '') ? d : String(v); }

// ── Test bazlı özet çıkarıcı ─────────────────────────────
export function extractHighlight(testType: string, sc: Record<string, unknown>): Highlight | null {
  const t = testType.toLowerCase();
  switch (t) {
    case 'vark': {
      const dom = (sc.dominant as [string, number]) || null;
      const pct = clampPct(n(dom?.[1]));
      const styleMap: Record<string, [string, string]> = { V: ['Görsel', 'gorsel'], A: ['İşitsel', 'isitsel'], R: ['Okuma/Yazma', 'okuma'], K: ['Kinestetik', 'kinestetik'] };
      const key = dom?.[0] || 'V';
      const [label, tag] = styleMap[key] || ['Görsel', 'gorsel'];
      return {
        order: 1, group: 'potansiyel', testType: t, name: 'Öğrenme Stili (VARK)', icon: '👁️',
        headline: `Baskın öğrenme stili **${label}** (%${pct})${sc.isMultimodal ? ' — çok modlu eğilim' : ''}.`,
        points: [`Bilgiyi en kolay ${label.toLowerCase()} kanaldan alıyor olabilir.`, 'Çalışma yöntemini bu kanala göre düzenlemek verimi artırabilir.'],
        metric: { label: 'Baskın Stil', value: pct, theme: 'primary' }, tag,
      };
    }
    case 'sag-sol-beyin': {
      const dom = s(sc.dominant, 'dengeli');
      const sol = clampPct(n(sc.solYuzde)); const sag = clampPct(n(sc.sagYuzde));
      const titleMap: Record<string, [string, string]> = { sag: ['Sağ Beyin (yaratıcı/bütüncül)', 'gorsel'], sol: ['Sol Beyin (analitik/sıralı)', 'analitik'], dengeli: ['Dengeli (her iki stil)', 'dengeli'] };
      const [label, tag] = titleMap[dom] || titleMap.dengeli;
      return {
        order: 2, group: 'potansiyel', testType: t, name: 'Beyin Baskınlığı', icon: '🧠',
        headline: `Düşünme stili **${label}** yönünde (Sol %${sol} · Sağ %${sag}).`,
        points: [dom === 'sag' ? 'Yaratıcı, sezgisel ve görsel yaklaşımlar güçlü olabilir.' : dom === 'sol' ? 'Mantıksal, sıralı ve analitik yaklaşımlar güçlü olabilir.' : 'Her iki düşünme stilini esnekçe kullanabiliyor olabilir.'],
        metric: { label: 'Sağ Beyin', value: sag, theme: 'info' }, tag,
      };
    }
    case 'coklu-zeka': case 'coklu_zeka': {
      const scores = (sc.scores as Record<string, { pct?: number }>) || {};
      const sorted = Object.entries(scores).map(([k, v]) => [k, clampPct(n(v?.pct))] as [string, number]).sort((a, b) => b[1] - a[1]);
      const top = sorted[0] || ['', 0];
      const nameMap: Record<string, [string, string]> = {
        mantiksal: ['Mantıksal-Matematiksel', 'analitik'], gorsel: ['Görsel-Uzamsal', 'gorsel'], sozel: ['Sözel-Dilsel', 'sozel'],
        muziksel: ['Müziksel-Ritmik', 'muziksel'], bedensel: ['Bedensel-Kinestetik', 'kinestetik'], sosyal: ['Sosyal', 'sosyal'], icsel: ['İçsel', 'icsel'], dogaci: ['Doğacı', 'dogaci'],
      };
      const [label, tag] = nameMap[top[0]] || [top[0] || 'öne çıkan alan', ''];
      return {
        order: 3, group: 'potansiyel', testType: 'coklu-zeka', name: 'Çoklu Zekâ', icon: '🧩',
        headline: `En güçlü zekâ alanı **${label} (%${top[1]})**.`,
        points: [`Öğrenmeyi ${label.toLowerCase()} kanalından desteklemek doğal bir avantaj sağlayabilir.`, sorted[1] ? `İkinci güçlü alan: ${(nameMap[sorted[1][0]]?.[0]) || sorted[1][0]} (%${sorted[1][1]}).` : ''].filter(Boolean),
        metric: { label: 'En Güçlü Zekâ', value: top[1], theme: 'success' }, tag,
      };
    }
    case 'enneagram': {
      const mainType = n(sc.mainType, 1);
      const titleStr = s(sc.fullTypeStr, `Tip ${mainType}`);
      const pct = clampPct(n(sc.mainScore));
      return {
        order: 4, group: 'potansiyel', testType: t, name: 'Kişilik (Enneagram)', icon: '🔮',
        headline: `Ana kişilik tipi **${titleStr}** (rezonans %${pct}).`,
        points: ['Davranışların ardındaki temel motivasyonu anlamak, iletişimi ve rehberliği kolaylaştırabilir.'],
        metric: { label: 'Ana Tip', value: pct, theme: 'warning' },
      };
    }
    case 'holland': {
      const code = s(sc.hollandCode, '');
      const sorted = (sc.sortedTypes as [string, number][]) || [];
      const shortMap: Record<string, string> = { R: 'Gerçekçi', I: 'Araştırmacı', A: 'Sanatsal', S: 'Sosyal', E: 'Girişimci', C: 'Geleneksel' };
      const topShort = shortMap[sorted[0]?.[0]] || (code[0] ? shortMap[code[0]] : '') || 'öne çıkan alan';
      return {
        order: 5, group: 'potansiyel', testType: t, name: 'Mesleki İlgi (Holland)', icon: '🧭',
        headline: `Mesleki ilgi kodu **${code}**, baskın alan **${topShort}**.`,
        points: ['Kod, meslek ve alan keşfi için bir pusula sunar; ilgi ve yeteneklerle birlikte değerlendirilmesi yerinde olur.'],
        metric: { label: 'Baskın İlgi', value: clampPct(n(sorted[0]?.[1]) / 70 * 100), theme: 'primary' },
      };
    }
    case 'akademik-analiz': {
      const overall = clampPct(n(sc.overall));
      const strongest = (sc.strongest as { name?: string; pct?: number }) || {};
      const weakest = (sc.weakest as { name?: string; pct?: number }) || {};
      return {
        order: 6, group: 'performans', testType: t, name: 'Akademik Analiz', icon: '📚',
        headline: `Genel akademik başarı **%${overall}** (${s(sc.level)}).`,
        points: [`En güçlü beceri: ${s(strongest.name)} (%${clampPct(n(strongest.pct))}).`, `En çok gelişime açık: ${s(weakest.name)} (%${clampPct(n(weakest.pct))}).`],
        metric: { label: 'Akademik Başarı', value: overall, theme: overall >= 70 ? 'success' : 'warning' },
      };
    }
    case 'hizli-okuma': {
      const wpm = Math.round(n(sc.wpm)); const comp = clampPct(n(sc.comprehensionPct)); const eff = clampPct(n(sc.effectiveScore));
      return {
        order: 7, group: 'performans', testType: t, name: 'Hızlı Okuma', icon: '📖',
        headline: `Okuma hızı **${wpm} kel/dk**, anlama **%${comp}** (etkin okuma %${eff}).`,
        points: [comp >= 70 ? 'Hız ve anlama dengeli görünüyor.' : 'Anlamaya odaklanmak, hız-anlama dengesini iyileştirebilir.'],
        metric: { label: 'Etkin Okuma', value: eff, theme: 'info' },
      };
    }
    case 'd2-dikkat': {
      const cp = clampPct(n(sc.cpPct));
      return {
        order: 8, group: 'performans', testType: t, name: 'D2 Dikkat', icon: '🎯',
        headline: `Konsantrasyon **%${cp}** (${s(sc.level)}).`,
        points: [s(sc.levelDesc, 'Dikkat performansı değerlendirildi.')],
        metric: { label: 'Konsantrasyon', value: cp, theme: cp >= 70 ? 'success' : 'warning' },
      };
    }
    case 'burdon-dikkat': {
      const score = clampPct(n(sc.overallScore)); const acc = clampPct(n(sc.overallAccuracy));
      return {
        order: 9, group: 'performans', testType: t, name: 'Burdon Dikkat', icon: '✏️',
        headline: `Dikkat skoru **%${score}**, doğruluk **%${acc}**.`,
        points: [s(sc.patternFinding, 'Dikkat performansı değerlendirildi.')],
        metric: { label: 'Dikkat Skoru', value: score, theme: score >= 70 ? 'success' : 'warning' },
      };
    }
    case 'sinav-kaygisi': {
      const pct = clampPct(n(sc.totalPct));
      return {
        order: 10, group: 'performans', testType: t, name: 'Sınav Kaygısı', icon: '🧘',
        headline: `Sınav kaygısı düzeyi **${s(sc.overallLevel)}** (%${pct}).`,
        points: [pct >= 70 ? 'Başa çıkma teknikleri (nefes, planlama, öz-değer çalışması) faydalı olabilir.' : 'Yönetilebilir bir düzey; mevcut denge korunabilir.'],
        metric: { label: 'Kaygı', value: pct, theme: pct >= 70 ? 'danger' : pct >= 40 ? 'warning' : 'success' },
      };
    }
    case 'calisma-davranisi': {
      const pos = clampPct(n(sc.positivePct));
      return {
        order: 11, group: 'performans', testType: t, name: 'Çalışma Davranışı', icon: '📝',
        headline: `Olumlu çalışma davranışı **%${pos}** (${s(sc.level)}).`,
        points: [pos >= 70 ? 'Çalışma alışkanlıkları sağlam görünüyor.' : 'Alışkanlıkları yapılandırmak (plan, düzen, mola) fayda getirebilir.'],
        metric: { label: 'Çalışma Davranışı', value: pos, theme: pos >= 70 ? 'success' : 'warning' },
      };
    }
    default:
      return null;
  }
}

// ── Hedef kitle konfigürasyonu ───────────────────────────
const AUD: Record<IntegratedAudience, { title: string; recTitle: string }> = {
  ogretmen: { title: 'ÖĞRETMEN / KOÇ RAPORU', recTitle: 'Öğretmen ve Koça Öneriler' },
  ogrenci: { title: 'ÖĞRENCİ RAPORU', recTitle: 'Sana Öneriler' },
  ebeveyn: { title: 'EBEVEYN RAPORU', recTitle: 'Ailelere Öneriler' },
};

// ── Çapraz bağlantı sentezi ──────────────────────────────
export function crossSynthesis(name: string, hs: Highlight[]): string[] {
  const out: string[] = [];
  const some = (tt: string, tag: string) => hs.some((h) => h.testType === tt && h.tag === tag);

  // Görsel örüntü — birden çok test aynı 'gorsel' yönü işaret ediyorsa (pekiştirme)
  const visual: string[] = [];
  if (some('vark', 'gorsel')) visual.push('görsel öğrenme stili');
  if (some('sag-sol-beyin', 'gorsel')) visual.push('sağ beyin eğilimi');
  if (some('coklu-zeka', 'gorsel')) visual.push('görsel-uzamsal zekâ');
  if (visual.length >= 2) out.push(`**Görsel örüntü:** ${visual.join(', ')} birbirini destekliyor. ${name} için görsel materyaller (şema, harita, renk kodlama, zihin haritası) öğrenmeyi belirgin şekilde kolaylaştırabilir.`);

  // Analitik örüntü
  const analytic: string[] = [];
  if (some('sag-sol-beyin', 'analitik')) analytic.push('sol beyin eğilimi');
  if (some('coklu-zeka', 'analitik')) analytic.push('mantıksal-matematiksel zekâ');
  if (analytic.length >= 2) out.push(`**Analitik örüntü:** ${analytic.join(' ve ')} birlikte öne çıkıyor. ${name} adım adım, mantıksal kurgulu ve sıralı çalışmadan verim alabilir.`);

  const holland = hs.find((h) => h.testType === 'holland');
  const mi = hs.find((h) => h.testType === 'coklu-zeka');
  if (holland && mi) out.push(`**İlgi–yetenek bağlantısı:** Mesleki ilgiler (Holland) ile en güçlü zekâ alanı birlikte değerlendirildiğinde, ${name} için kariyer keşfinde tutarlı bir yön belirebilir.`);

  const kaygi = hs.find((h) => h.testType === 'sinav-kaygisi');
  const calisma = hs.find((h) => h.testType === 'calisma-davranisi');
  if (kaygi && calisma) out.push(`**Kaygı–çalışma bağlantısı:** Sınav kaygısı ile çalışma alışkanlıkları ilişkilidir; düzenli ve planlı çalışma, kontrol duygusunu artırarak kaygıyı azaltabilir.`);

  if (!out.length) out.push(`Testler birlikte değerlendirildiğinde, ${name}'in öğrenme profili güçlü yönleri merkeze alan bir yaklaşıma uygun görünüyor.`);
  return out;
}

// ── Ana Fonksiyon ────────────────────────────────────────
export function buildIntegratedDeterministicReport(
  tests: Array<{ test_type: string; scores: unknown; date?: string }>,
  student: StudentInfo,
  reportType: IntegratedAudience,
  opts?: { hasGeneticContext?: boolean; geneticReportCount?: number },
): string {
  const name = safeName(student);
  const aud = AUD[reportType];
  const isStudent = reportType === 'ogrenci';

  const highlights = tests
    .map((t) => extractHighlight(t.test_type, (t.scores as Record<string, unknown>) || {}))
    .filter((h): h is Highlight => h !== null)
    .sort((a, b) => a.order - b.order);

  const potansiyel = highlights.filter((h) => h.group === 'potansiyel');
  const performans = highlights.filter((h) => h.group === 'performans');

  const P: string[] = [];

  // Başlık + dosya
  const grade = student.studentGrade ? `${student.studentGrade}. Sınıf` : 'Belirtilmemiş';
  P.push(`# 🎓 ENTEGRE DEĞERLENDİRME — ${aud.title}\n`);
  P.push(`| Alan | Bilgi |\n|---|---|\n| İsim | ${name} |\n| Sınıf | ${grade} |\n| Değerlendirme | Entegre Analiz (${highlights.length} test) |\n`);

  // Genel bakış grid'i (ilk 3 metrik)
  const metrics = highlights.filter((h) => h.metric).slice(0, 3).map((h) => ({ label: h.metric!.label, value: h.metric!.value, unit: '%', theme: h.metric!.theme, icon: 'star' }));
  if (metrics.length >= 2) P.push(statGrid(metrics.slice(0, 3)));
  P.push('---\n');

  // Giriş (hedef kitleye göre)
  P.push(`## 🔎 Bu Rapor Nedir?\n`);
  if (isStudent) {
    P.push(`Merhaba ${name}! Bu rapor, çözdüğün **${highlights.length} testi birlikte** değerlendirip seni daha iyi tanımana yardımcı olmak için hazırlandı. Amaç bir not vermek değil; nasıl daha kolay öğrendiğini, güçlü yönlerini ve gelişebileceğin alanları birlikte görmek. 🌱\n`);
  } else if (reportType === 'ebeveyn') {
    P.push(`Bu rapor, ${name}'in çözdüğü **${highlights.length} testin sonuçlarını birlikte** değerlendirerek bütüncül bir profil sunar. Bilimsel terimler sade bir dille açıklanmıştır. Amaç, ${name}'i evde nasıl daha iyi destekleyebileceğinize dair somut bir çerçeve sunmaktır.\n`);
  } else {
    P.push(`Bu rapor, ${name}'in **${highlights.length} test sonucunu bütünleşik** olarak değerlendirir. Tekil test raporlarından farklı olarak, bulgular arasındaki **örüntüler ve bağlantılar** öne çıkarılır; sınıf içi uygulama ve rehberlik perspektifinden öneriler sunulur.\n`);
  }
  P.push('---\n');

  // ── POTANSİYEL ANALİZ ──
  if (potansiyel.length) {
    P.push(`## 🌟 1. Potansiyel Analiz — Öğrenme ve Kişilik Profili\n`);
    P.push(`*${name}'in nasıl öğrendiğini, düşündüğünü ve neye yatkın olduğunu gösteren testler.*\n`);
    for (const h of potansiyel) {
      P.push(`### ${h.icon} ${h.name}\n${h.headline}\n${h.points.length ? '\n' + h.points.map((p) => `- ${p}`).join('\n') + '\n' : ''}`);
    }
    // Potansiyel analiz özeti + çapraz bağlantılar
    if (potansiyel.length >= 2) {
      P.push(`### 🔗 Potansiyel Analiz Özeti\n`);
      for (const line of crossSynthesis(name, potansiyel)) P.push(insight('strength', 'Örüntü', line));
    }
    P.push('---\n');
  }

  // ── PERFORMANS VE GELİŞİM ──
  if (performans.length) {
    P.push(`## 📈 2. Performans ve Gelişim — Akademik, Dikkat ve Alışkanlıklar\n`);
    P.push(`*${name}'in mevcut performansını ve gelişim alanlarını gösteren testler.*\n`);
    // Performans metrikleri bars
    const perfMetrics = performans.filter((h) => h.metric).map((h) => [h.metric!.label, h.metric!.value] as [string, number]);
    if (perfMetrics.length >= 2) P.push(barsBlock('Performans Alanları (%)', perfMetrics));
    for (const h of performans) {
      P.push(`### ${h.icon} ${h.name}\n${h.headline}\n${h.points.length ? '\n' + h.points.map((p) => `- ${p}`).join('\n') + '\n' : ''}`);
    }
    if (performans.length >= 2) {
      for (const line of crossSynthesis(name, performans).filter((l) => l.includes('Kaygı') || l.includes('çalışma'))) P.push(insight('note', 'Bağlantı', line));
    }
    P.push('---\n');
  }

  // ── DMIT / genetik not (deterministik PDF okuyamaz) ──
  if (opts?.hasGeneticContext && reportType === 'ogretmen') {
    P.push(`## 🧬 3. Genetik Analiz (DMIT) Notu\n`);
    P.push(insight('note', 'DMIT Raporu Mevcut', `${name} için ${opts.geneticReportCount ?? 1} adet DMIT/parmak izi raporu sistemde kayıtlı. Bu raporlar ayrı belgeler olarak incelenebilir; yukarıdaki test bulgularıyla birlikte değerlendirilmesi bütüncül bir bakış sağlayabilir.`));
    P.push('---\n');
  }

  // ── ÖNERİLER (hedef kitleye göre) ──
  P.push(`## 🎯 ${aud.recTitle}\n`);
  const topPot = potansiyel[0];
  const topStrengthName = highlights.find((h) => h.testType === 'coklu-zeka')?.headline.replace(/.*\*\*(.*?) \(.*/, '$1') || (topPot ? topPot.name : 'güçlü yönler');
  if (isStudent) {
    P.push(`- Güçlü yönlerini çalışmanın merkezine al — en kolay öğrendiğin kanalı bilerek kullan.\n- Zorlandığın alanlarda küçük adımlarla ilerle; her adım bir ilerlemedir.\n- Kendine gerçekçi hedefler koy ve küçük başarılarını kutla.\n`);
  } else if (reportType === 'ebeveyn') {
    P.push(`- ${name}'in güçlü öğrenme kanalını gözeten bir çalışma ortamı, evde öğrenmeyi kolaylaştırabilir.\n- Sonuçtan çok çabayı ve süreci takdir etmek, motivasyonu ve özgüveni besleyebilir.\n- Gelişim alanlarında küçük, düzenli desteklerle ilerlemek fark yaratabilir.\n`);
  } else {
    P.push(`- ${name}'in güçlü zekâ/öğrenme kanalını görev ve materyal seçiminde işe koşmak, derse katılımı artırabilir.\n- Güçlü yönler üzerinden gelişim alanlarını desteklemek (köprü kurmak) verimli olabilir.\n- Somut, yönteme dönük geri bildirim, genel övgüden daha etkili olabilir.\n`);
  }
  // Özet aksiyon içgörüleri
  if (topPot) P.push(insight('strength', 'Merkeze Al', `${topPot.headline.replace(/\*\*/g, '')}`));
  const focusPerf = performans.find((h) => h.metric && h.metric.value < 60);
  if (focusPerf) P.push(insight('action', 'Öncelikli Gelişim', `${focusPerf.name}: ${focusPerf.points[0] || 'hedefli, düzenli çalışma denenebilir.'}`));
  P.push('---\n');

  // Kapanış
  P.push(`## 🌱 Kapanış\n`);
  if (isStudent) {
    P.push(`${name}, bu profil senin bir fotoğrafın — bir kader değil. Güçlü yönlerini kullanarak ve gelişim alanlarında sabırla çalışarak istediğin yere ulaşabilirsin. Kendine güven! 💪\n`);
  } else {
    P.push(`${name}'in entegre profili, öğrenmeye açık ve yönlendirilebilir bir tabloyu işaret ediyor. Güçlü yönleri merkeze alan, gelişim alanlarını yargılamadan destekleyen bütüncül bir yaklaşım en verimli sonucu getirebilir. Bu profil zamanla gelişebilir.\n`);
  }
  P.push(reportFooter());
  return P.join('\n');
}
