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
  clampPct, statGrid, barsBlock, radarBlock, insight,
  compareBlock, chainBlock, timelineBlock, donutBlock, heatmapBlock,
  reportFooter, safeName, type StudentInfo, type StatTheme,
} from './report-blocks';
import { belirtme, tamlayan } from '@/lib/utils/turkish';

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
  /**
   * Çapraz analiz için ham göstergeler. Tekil raporlarda hesaplanan türetilmiş
   * ölçüler (esneklik, netlik, farklılaşma, öz-algı farkı, hata tipi vb.)
   * buraya konur; crossSynthesis bunlar üzerinden örüntü kurar.
   */
  signals?: Record<string, number | string>;
}

// ── küçük yardımcılar ────────────────────────────────────
function n(v: unknown, d = 0): number { const x = Number(v); return Number.isFinite(x) ? x : d; }
function s(v: unknown, d = '—'): string { return (v == null || v === '') ? d : String(v); }

// ── Test bazlı özet çıkarıcı ─────────────────────────────
export function extractHighlight(testType: string, scInput: Record<string, unknown>): Highlight | null {
  const t = testType.toLowerCase();
  // Zengin calculate çıktısı `_full` altında saklanır (display '_' anahtarları yok sayar).
  // Varsa onu kullan; yoksa (eski/düz veri) gelen nesneyi dener.
  const sc = scInput && typeof scInput === 'object' && '_full' in scInput && scInput._full != null
    ? (scInput._full as Record<string, unknown>) : scInput;
  try {
    switch (t) {
    case 'vark': {
      const dom = (sc.dominant as [string, number]) || null;
      const styleMap: Record<string, [string, string]> = { V: ['Görsel', 'gorsel'], A: ['İşitsel', 'isitsel'], R: ['Okuma/Yazma', 'okuma'], K: ['Kinestetik', 'kinestetik'] };
      const key = dom?.[0] || 'V';
      // DİKKAT: `dominant` = [anahtar, HAM CEVAP SAYISI] — yüzde DEĞİL.
      // Yüzde `percentages` içindedir. Ham sayı basılırsa "%5" gibi yanlış değer çıkar.
      const varkPcts = (sc.percentages as Record<string, number>) || {};
      const pct = clampPct(n(varkPcts[key], n(dom?.[1])));
      const [label, tag] = styleMap[key] || ['Görsel', 'gorsel'];
      return {
        order: 1, group: 'potansiyel', testType: t, name: 'Öğrenme Stili (VARK)', icon: '👁️',
        headline: `Baskın öğrenme stili **${label}** (%${pct})${sc.isMultimodal ? ' — çok modlu eğilim' : ''}.`,
        points: [`Bilgiyi en kolay ${label.toLowerCase()} kanaldan alıyor olabilir.`, 'Çalışma yöntemini bu kanala göre düzenlemek verimi artırabilir.'],
        metric: { label: 'Baskın Stil', value: pct, theme: 'primary' }, tag,
        signals: { kanal: key, kanalPct: pct, esneklik: clampPct(100 - (pct - Math.min(...Object.values(varkPcts).map((x) => n(x)))) * 2.5) },
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
        signals: { sol, sag, denge: clampPct(100 - Math.abs(sol - sag) * 2), yon: dom },
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
        signals: { enGuclu: top[0], enGucluPct: top[1], fark: clampPct(top[1] - (sorted[sorted.length - 1]?.[1] ?? 0)), gucluSayisi: sorted.filter((x) => x[1] >= 60).length },
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
        signals: { anaTip: mainType, rezonans: pct },
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
        signals: { kod: code, baskinTip: sorted[0]?.[0] ?? '', farklilasma: clampPct((n(sorted[0]?.[1]) - n(sorted[sorted.length - 1]?.[1])) / 70 * 100) },
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
        signals: { genel: overall, ozAlgiFarki: Math.round(n(sc.selfAssessment) - n(sc.performanceAvg)), ozAlgiTipi: s(sc.gapType, 'tutarli'), enZayifPct: clampPct(n(weakest.pct)) },
      };
    }
    case 'hizli-okuma': {
      const wpm = Math.round(n(sc.wpm)); const comp = clampPct(n(sc.comprehensionPct)); const eff = clampPct(n(sc.effectiveScore));
      return {
        order: 7, group: 'performans', testType: t, name: 'Hızlı Okuma', icon: '📖',
        headline: `Okuma hızı **${wpm} kel/dk**, anlama **%${comp}** (etkin okuma %${eff}).`,
        points: [comp >= 70 ? 'Hız ve anlama dengeli görünüyor.' : 'Anlamaya odaklanmak, hız-anlama dengesini iyileştirebilir.'],
        metric: { label: 'Etkin Okuma', value: eff, theme: 'info' },
        signals: { wpm, anlama: comp, etkin: eff },
      };
    }
    case 'd2-dikkat': {
      const cp = clampPct(n(sc.cpPct));
      return {
        order: 8, group: 'performans', testType: t, name: 'D2 Dikkat', icon: '🎯',
        headline: `Konsantrasyon **%${cp}** (${s(sc.level)}).`,
        points: [s(sc.levelDesc, 'Dikkat performansı değerlendirildi.')],
        metric: { label: 'Konsantrasyon', value: cp, theme: cp >= 70 ? 'success' : 'warning' },
        signals: { konsantrasyon: cp, atlama: n(sc.E1), acele: n(sc.E2) },
      };
    }
    case 'burdon-dikkat': {
      const score = clampPct(n(sc.overallScore)); const acc = clampPct(n(sc.overallAccuracy));
      return {
        order: 9, group: 'performans', testType: t, name: 'Burdon Dikkat', icon: '✏️',
        headline: `Dikkat skoru **%${score}**, doğruluk **%${acc}**.`,
        points: [s(sc.patternFinding, 'Dikkat performansı değerlendirildi.')],
        metric: { label: 'Dikkat Skoru', value: score, theme: score >= 70 ? 'success' : 'warning' },
        signals: { dikkat: score, dogruluk: acc, atlama: n(sc.totalOmission), acele: n(sc.totalCommission) },
      };
    }
    case 'sinav-kaygisi': {
      const pct = clampPct(n(sc.totalPct));
      return {
        order: 10, group: 'performans', testType: t, name: 'Sınav Kaygısı', icon: '🧘',
        headline: `Sınav kaygısı düzeyi **${s(sc.overallLevel)}** (%${pct}).`,
        points: [pct >= 70 ? 'Başa çıkma teknikleri (nefes, planlama, öz-değer çalışması) faydalı olabilir.' : 'Yönetilebilir bir düzey; mevcut denge korunabilir.'],
        metric: { label: 'Kaygı', value: pct, theme: pct >= 70 ? 'danger' : pct >= 40 ? 'warning' : 'success' },
        signals: { kaygi: pct, baskinTur: s(sc.dominantType, '') },
      };
    }
    case 'calisma-davranisi': {
      const pos = clampPct(n(sc.positivePct));
      return {
        order: 11, group: 'performans', testType: t, name: 'Çalışma Davranışı', icon: '📝',
        headline: `Olumlu çalışma davranışı **%${pos}** (${s(sc.level)}).`,
        points: [pos >= 70 ? 'Çalışma alışkanlıkları sağlam görünüyor.' : 'Alışkanlıkları yapılandırmak (plan, düzen, mola) fayda getirebilir.'],
        metric: { label: 'Çalışma Davranışı', value: pos, theme: pos >= 70 ? 'success' : 'warning' },
        signals: { olumlu: pos },
      };
    }
    default:
      return null;
    }
  } catch (e) {
    console.warn(`[extractHighlight] ${t} atlandı (veri şekli):`, (e as Error).message);
    return null;
  }
}

// ── Hedef kitle konfigürasyonu ───────────────────────────
const AUD: Record<IntegratedAudience, { title: string; recTitle: string }> = {
  ogretmen: { title: 'ÖĞRETMEN / KOÇ RAPORU', recTitle: 'Öğretmen ve Koça Öneriler' },
  ogrenci: { title: 'ÖĞRENCİ RAPORU', recTitle: 'Sana Öneriler' },
  ebeveyn: { title: 'EBEVEYN RAPORU', recTitle: 'Ailelere Öneriler' },
};

// ── Çapraz örüntü motoru ─────────────────────────────────
/**
 * Testler ARASI örüntüler. Tekil raporlar tek testi derinleştirir; asıl değer
 * testlerin birbirini doğruladığı (pekiştirme), birbiriyle gerildiği (gerilim)
 * veya birlikte fırsat yarattığı (fırsat) noktalardadır.
 */
export interface CrossPattern {
  kind: 'pekistirme' | 'gerilim' | 'firsat';
  title: string;
  /** [neden, etki, sonuç] — chainBlock ile görselleştirilir. */
  chain: [string, string, string];
  text: string;
}

const SIG = (h: Highlight | undefined, k: string): number => n(h?.signals?.[k]);
const SIGS = (h: Highlight | undefined, k: string): string => s(h?.signals?.[k], '');

export function crossPatterns(name: string, hs: Highlight[]): CrossPattern[] {
  const out: CrossPattern[] = [];
  const get = (tt: string) => hs.find((h) => h.testType === tt);
  const some = (tt: string, tag: string) => hs.some((h) => h.testType === tt && h.tag === tag);

  const vark = get('vark');
  const beyin = get('sag-sol-beyin');
  const mi = get('coklu-zeka');
  const holland = get('holland');
  const kaygi = get('sinav-kaygisi');
  const calisma = get('calisma-davranisi');
  const akademik = get('akademik-analiz');
  const d2 = get('d2-dikkat');
  const burdon = get('burdon-dikkat');
  const okuma = get('hizli-okuma');
  const dikkat = d2 || burdon;

  // ═══ A. PEKİŞTİRME — birden çok test aynı yönü işaret ediyor ═══
  const visual: string[] = [];
  if (some('vark', 'gorsel')) visual.push('görsel öğrenme stili');
  if (some('sag-sol-beyin', 'gorsel')) visual.push('sağ beyin eğilimi');
  if (some('coklu-zeka', 'gorsel')) visual.push('görsel-uzamsal zekâ');
  if (visual.length >= 2) {
    out.push({
      kind: 'pekistirme', title: 'Görsel Örüntü',
      chain: [`${visual.join(' + ')} aynı yönü gösteriyor`, 'Bilgi görsel kanaldan daha kolay işleniyor olabilir', 'Şema, harita, renk kodlama ve zihin haritası belirgin fark yaratabilir'],
      text: `**Görsel örüntü:** ${visual.join(', ')} birbirini destekliyor. ${name} için görsel materyaller öğrenmeyi belirgin şekilde kolaylaştırabilir.`,
    });
  }

  const analytic: string[] = [];
  if (some('sag-sol-beyin', 'analitik')) analytic.push('sol beyin eğilimi');
  if (some('coklu-zeka', 'analitik')) analytic.push('mantıksal-matematiksel zekâ');
  if (analytic.length >= 2) {
    out.push({
      kind: 'pekistirme', title: 'Analitik Örüntü',
      chain: [`${analytic.join(' + ')} birlikte öne çıkıyor`, 'Sıralı ve kurallı düşünme güçlü olabilir', 'Adım adım, mantıksal kurgulu çalışmadan verim alınabilir'],
      text: `**Analitik örüntü:** ${analytic.join(' ve ')} birlikte öne çıkıyor. ${name} adım adım, mantıksal kurgulu ve sıralı çalışmadan verim alabilir.`,
    });
  }

  const sozel: string[] = [];
  if (some('vark', 'okuma')) sozel.push('okuma/yazma tercihi');
  if (some('coklu-zeka', 'sozel')) sozel.push('sözel-dilsel zekâ');
  if (sozel.length >= 2) {
    out.push({
      kind: 'pekistirme', title: 'Sözel Örüntü',
      chain: [`${sozel.join(' + ')} birlikte güçlü`, 'Yazılı kaynakla ve yazarak öğrenme verimli olabilir', 'Not çıkarma, özetleme ve yazarak tekrar öncelikli yöntem olabilir'],
      text: `**Sözel örüntü:** ${sozel.join(' ve ')} birbirini destekliyor. Yazarak tekrar ve özet çıkarma ${name} için en verimli yol olabilir.`,
    });
  }

  const sosyal: string[] = [];
  if (some('coklu-zeka', 'sosyal')) sosyal.push('sosyal zekâ');
  if (holland && SIGS(holland, 'baskinTip') === 'S') sosyal.push('sosyal mesleki ilgi');
  if (sosyal.length >= 2) {
    out.push({
      kind: 'pekistirme', title: 'Sosyal Örüntü',
      chain: [`${sosyal.join(' + ')} birlikte öne çıkıyor`, 'Başkalarıyla birlikte öğrenmek ve anlatmak güçlü yön olabilir', 'Grup çalışması, akran mentörlüğü ve anlatarak öğrenme denenebilir'],
      text: `**Sosyal örüntü:** ${sosyal.join(' ve ')} birbirini destekliyor. Anlatarak ve birlikte çalışarak öğrenmek ${name} için doğal bir yol olabilir.`,
    });
  }

  // ═══ B. GERİLİM — dikkat gerektiren kombinasyonlar ═══
  if (kaygi && calisma) {
    const k = SIG(kaygi, 'kaygi'), cd = SIG(calisma, 'olumlu');
    if (k >= 55 && cd < 55) {
      out.push({
        kind: 'gerilim', title: 'Kaygı–Çalışma Kısır Döngüsü',
        chain: [`Kaygı yüksek (%${k}) ve çalışma düzeni zayıf (%${cd})`, 'Düzensiz çalışma hazırlık eksikliği yaratır, bu da kaygıyı büyütür', 'Döngüyü kırmak için önce ÇALIŞMA DÜZENİ kurulmalı; kaygı çoğu zaman kendiliğinden düşer'],
        text: `**Kaygı–çalışma döngüsü:** Kaygı yüksek (%${k}), çalışma düzeni ise zayıf (%${cd}). Bu ikisi birbirini besler. Küçük ve düzenli bir çalışma programı, kontrol duygusunu artırarak kaygıyı azaltabilir.`,
      });
    } else if (k >= 55 && cd >= 65) {
      out.push({
        kind: 'gerilim', title: 'Hazırlıklı Ama Kaygılı',
        chain: [`Çalışma düzeni sağlam (%${cd}) ama kaygı yüksek (%${k})`, 'Kaygının kaynağı hazırlık eksikliği DEĞİL', 'Çalışma önerisi işe yaramaz; kaygı yönetimi tekniklerine odaklanmak gerekir'],
        text: `**Önemli ayrım:** ${name} düzenli çalışıyor (%${cd}) ama kaygısı yüksek (%${k}). Kaygının kaynağı hazırlıksızlık değil. "Daha çok çalış" önerisi bu tabloda işe yaramaz; kaygı yönetimi tekniklerine yönelmek gerekir.`,
      });
    }
  }

  if (akademik) {
    const fark = SIG(akademik, 'ozAlgiFarki');
    const genel = SIG(akademik, 'genel');
    if (fark <= -15 && genel >= 55) {
      out.push({
        kind: 'gerilim', title: 'Potansiyelin Altında Öz-Algı',
        chain: [`Akademik düzey iyi (%${genel}) ama kendini ${Math.abs(fark)} puan düşük değerlendiriyor`, 'Yapabileceği görevlerden kaçınabilir, başarısını şansa bağlayabilir', 'Somut başarı kanıtlarını adıyla görünür kılmak özgüveni besler'],
        text: `**Öz-algı boşluğu:** ${name} akademik olarak iyi durumda (%${genel}) ama kendini ${Math.abs(fark)} puan düşük görüyor. Bu, potansiyelinin altında kalmasına yol açabilir. Doğru yaptığı işleri somut olarak göstermek gerekir.`,
      });
    } else if (fark >= 20) {
      out.push({
        kind: 'gerilim', title: 'Yüksek Öz-Algı Riski',
        chain: [`Kendini ${fark} puan yüksek değerlendiriyor`, 'Hazırlık süresini olduğundan kısa tahmin edebilir', 'Sınav sonucu beklentisinin altında kalıp motivasyonu ani düşebilir'],
        text: `**Kalibrasyon farkı:** ${name} kendini ${fark} puan yüksek değerlendiriyor. Deneme sonuçlarını birlikte incelemek, farkı yargılamadan görünür kılabilir.`,
      });
    }
  }

  if (dikkat && okuma) {
    const dk = SIG(dikkat, 'konsantrasyon') || SIG(dikkat, 'dikkat');
    const anlama = SIG(okuma, 'anlama');
    if (dk >= 60 && anlama < 55) {
      out.push({
        kind: 'gerilim', title: 'Dikkat Değil, Okuma Stratejisi',
        chain: [`Dikkat performansı iyi (%${dk}) ama okuduğunu anlama düşük (%${anlama})`, 'Sorun odaklanmada değil, metni işleme biçiminde olabilir', 'Dikkat egzersizi yerine ANLAMA stratejileri (özetleme, paragraf sonu duraklama) çalışılmalı'],
        text: `**Kritik ayrım:** Dikkat performansı iyi (%${dk}) ama anlama düşük (%${anlama}). Sorun odaklanma değil, okuma stratejisi olabilir. Bu tabloda dikkat egzersizi zaman kaybı olur.`,
      });
    } else if (dk < 50 && anlama >= 60) {
      out.push({
        kind: 'gerilim', title: 'Anlıyor Ama Odakta Zorlanıyor',
        chain: [`Anlama iyi (%${anlama}) ama dikkat sürekliliği düşük (%${dk})`, 'Kısa metinlerde başarılı, uzun sınavlarda performans düşebilir', 'Mola stratejisi ve kısa çalışma blokları öncelikli olabilir'],
        text: `**Odak sorunu:** ${name} okuduğunu anlıyor (%${anlama}) ama dikkatini uzun süre koruyamıyor (%${dk}). Uzun sınavlarda destek gerekebilir.`,
      });
    }
  }

  if (dikkat && kaygi) {
    const dk = SIG(dikkat, 'konsantrasyon') || SIG(dikkat, 'dikkat');
    const k = SIG(kaygi, 'kaygi');
    if (dk < 50 && k >= 60) {
      out.push({
        kind: 'gerilim', title: 'Kaygı Dikkati Bölüyor Olabilir',
        chain: [`Dikkat düşük (%${dk}) ve kaygı yüksek (%${k})`, 'Kaygı zihinsel kaynağı meşgul ederek odaklanmayı zorlaştırabilir', 'Önce kaygı çalışılırsa dikkat kendiliğinden toparlanabilir'],
        text: `**Sıralama önemli:** Dikkat düşük (%${dk}) ve kaygı yüksek (%${k}). Kaygı zihni meşgul ederek dikkati bölebilir. Bu tabloda önce kaygıya eğilmek daha verimli olabilir.`,
      });
    }
  }

  if (calisma && akademik) {
    const cd = SIG(calisma, 'olumlu'), genel = SIG(akademik, 'genel');
    if (cd >= 65 && genel < 50) {
      out.push({
        kind: 'gerilim', title: 'Çalışıyor Ama Verim Alamıyor',
        chain: [`Çalışma düzeni sağlam (%${cd}) ama akademik sonuç düşük (%${genel})`, 'Çaba var, ancak kullanılan yöntem profiline uymuyor olabilir', 'Süreyi artırmak değil, YÖNTEMİ değiştirmek gerekir'],
        text: `**Yöntem sorunu:** ${name} düzenli çalışıyor (%${cd}) ama sonuç düşük (%${genel}). Bu tabloda "daha çok çalış" demek haksızlık olur; öğrenme kanalına uygun yöntem denenmelidir.`,
      });
    }
  }

  // ═══ C. FIRSAT ═══
  if (holland && mi) {
    const fk = SIG(holland, 'farklilasma');
    out.push({
      kind: 'firsat', title: 'İlgi–Yetenek Bağlantısı',
      chain: [
        `Mesleki ilgi kodu ${SIGS(holland, 'kod')} ve en güçlü zekâ alanı birlikte`,
        fk >= 25 ? 'İlgi profili net; yetenekle birlikte okunduğunda yön belirginleşir' : 'İlgi profili henüz netleşmemiş; deneyim yönü açacaktır',
        fk >= 25 ? 'Kariyer keşfinde bu iki bulgu birlikte kullanılabilir' : 'Erken alan daraltması yerine geniş deneyim önerilebilir',
      ],
      text: `**İlgi–yetenek bağlantısı:** Mesleki ilgiler (Holland ${SIGS(holland, 'kod')}) ile en güçlü zekâ alanı birlikte değerlendirildiğinde, ${name} için kariyer keşfinde ${fk >= 25 ? 'tutarlı bir yön belirebilir' : 'henüz deneyim gerektiren bir tablo görünüyor'}.`,
    });
  }

  if (vark && mi) {
    out.push({
      kind: 'firsat', title: 'Materyal Seçimi İçin Net Yön',
      chain: [
        `Öğrenme kanalı ve en güçlü zekâ alanı birlikte biliniyor`,
        'Materyal seçimi tahmin yerine veriye dayanabilir',
        'Aynı konu bu iki kanaldan sunulduğunda kavrama hızlanabilir',
      ],
      text: `**Materyal seçimi:** ${tamlayan(name)} öğrenme kanalı ile en güçlü zekâ alanı birlikte kullanıldığında, ders materyali seçimi tahmine değil veriye dayanır.`,
    });
  }

  if (dikkat && calisma) {
    const dk = SIG(dikkat, 'konsantrasyon') || SIG(dikkat, 'dikkat');
    const cd = SIG(calisma, 'olumlu');
    if (dk >= 65 && cd >= 65) {
      out.push({
        kind: 'firsat', title: 'Uzun Görev Kapasitesi',
        chain: [`Dikkat (%${dk}) ve çalışma düzeni (%${cd}) birlikte güçlü`, 'Uzun soluklu görevleri sürdürebilecek kapasite var', 'Proje tabanlı çalışmalar ve uzun sınavlar avantaja dönüşebilir'],
        text: `**Güçlü kombinasyon:** Dikkat (%${dk}) ve çalışma düzeni (%${cd}) birlikte sağlam. ${name} uzun soluklu projeleri sürdürebilecek kapasitede görünüyor.`,
      });
    }
  }

  if (beyin && vark) {
    const denge = SIG(beyin, 'denge'), esneklik = SIG(vark, 'esneklik');
    if (denge >= 60 && esneklik >= 60) {
      out.push({
        kind: 'firsat', title: 'Yöntem Esnekliği',
        chain: [`Düşünme stili dengeli (%${denge}) ve öğrenme kanalları esnek (%${esneklik})`, 'Farklı öğretim biçimlerine uyum sağlayabiliyor olabilir', 'Ders türü değiştiğinde performans dalgalanması az olabilir'],
        text: `**Esneklik avantajı:** Hem düşünme stili dengeli (%${denge}) hem öğrenme kanalları esnek (%${esneklik}). ${name} farklı yöntemler arasında rahat geçiş yapabiliyor olabilir.`,
      });
    }
  }

  return out;
}

/** Geriye dönük uyumluluk: düz metin satırları. */
export function crossSynthesis(name: string, hs: Highlight[]): string[] {
  const pats = crossPatterns(name, hs);
  if (!pats.length) return [`Testler birlikte değerlendirildiğinde, ${tamlayan(name)} öğrenme profili güçlü yönleri merkeze alan bir yaklaşıma uygun görünüyor.`];
  return pats.map((p) => p.text);
}

// ── Ana Fonksiyon ────────────────────────────────────────
export function buildIntegratedDeterministicReport(
  tests: Array<{ test_type: string; scores: unknown; date?: string }>,
  student: StudentInfo,
  reportType: IntegratedAudience,
  opts?: { hasGeneticContext?: boolean; geneticReportCount?: number; packageInfo?: { label: string; description: string; focus?: string } },
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
  const pkg = opts?.packageInfo;
  const mainTitle = pkg ? `${pkg.label.toLocaleUpperCase('tr-TR')} — ${aud.title}` : `ENTEGRE DEĞERLENDİRME — ${aud.title}`;
  const evalLabel = pkg ? `${pkg.label} (${highlights.length} test)` : `Entegre Analiz (${highlights.length} test)`;
  P.push(`# 🎓 ${mainTitle}\n`);
  P.push(`| Alan | Bilgi |\n|---|---|\n| İsim | ${name} |\n| Sınıf | ${grade} |\n| Değerlendirme | ${evalLabel} |\n`);

  // Genel bakış grid'i (ilk 3 metrik)
  const allMetrics = highlights.filter((h) => h.metric);
  const metrics = allMetrics.slice(0, 4).map((h) => ({ label: h.metric!.label, value: h.metric!.value, unit: '%', theme: h.metric!.theme, icon: 'star' }));
  if (metrics.length >= 2) P.push(statGrid(metrics, metrics.length >= 4 ? 4 : 3));
  P.push('---\n');

  // ── BÜTÜNLEŞİK PROFİL HARİTASI ──
  if (allMetrics.length >= 3) {
    P.push(`## 🗺️ Bütünleşik Profil Haritası\n`);
    P.push(
      isStudent
        ? `Aşağıdaki harita, çözdüğün tüm testlerin ana göstergelerini tek bir resimde birleştiriyor.\n`
        : `Aşağıdaki harita, tüm testlerin ana göstergelerini tek bir görüntüde toplar. Uçlar arasındaki dengesizlik, öncelik belirlemede yol gösterir.\n`,
    );
    P.push(radarBlock('Tüm Göstergeler (%)', allMetrics.map((h) => [h.metric!.label, clampPct(h.metric!.value)] as [string, number])));
    const ort = clampPct(allMetrics.reduce((a, h) => a + h.metric!.value, 0) / allMetrics.length);
    P.push(compareBlock(
      'Göstergeler — Kendi Genel Ortalamasıyla Karşılaştırma',
      allMetrics.map((h) => [h.metric!.label, clampPct(h.metric!.value), ort] as [string, number, number]),
      { selfLabel: name.split(' ')[0] || name, refLabel: 'Kendi ortalaması' },
    ));
    const en = [...allMetrics].sort((a, b) => b.metric!.value - a.metric!.value);
    P.push(
      `En güçlü gösterge **${en[0].metric!.label} (%${clampPct(en[0].metric!.value)})**, ` +
      `en çok desteğe açık gösterge **${en[en.length - 1].metric!.label} (%${clampPct(en[en.length - 1].metric!.value)})**. ` +
      `Genel ortalama %${ort}.\n`,
    );
    P.push('---\n');
  }

  // Giriş (hedef kitleye göre)
  P.push(`## 🔎 Bu Rapor Nedir?\n`);
  if (isStudent) {
    P.push(`Merhaba ${name}! Bu rapor, çözdüğün **${highlights.length} testi birlikte** değerlendirip seni daha iyi tanımana yardımcı olmak için hazırlandı. Amaç bir not vermek değil; nasıl daha kolay öğrendiğini, güçlü yönlerini ve gelişebileceğin alanları birlikte görmek. 🌱\n`);
  } else if (reportType === 'ebeveyn') {
    P.push(`Bu rapor, ${tamlayan(name)} çözdüğü **${highlights.length} testin sonuçlarını birlikte** değerlendirerek bütüncül bir profil sunar. Bilimsel terimler sade bir dille açıklanmıştır. Amaç, ${belirtme(name)} evde nasıl daha iyi destekleyebileceğinize dair somut bir çerçeve sunmaktır.\n`);
  } else {
    P.push(`Bu rapor, ${tamlayan(name)} **${highlights.length} test sonucunu bütünleşik** olarak değerlendirir. Tekil test raporlarından farklı olarak, bulgular arasındaki **örüntüler ve bağlantılar** öne çıkarılır; sınıf içi uygulama ve rehberlik perspektifinden öneriler sunulur.\n`);
  }
  if (pkg) P.push(`\n**Paket kapsamı:** ${pkg.description}${pkg.focus ? ` Bu değerlendirme özellikle ${pkg.focus.toLocaleLowerCase('tr-TR')} açısından ele alınmıştır.` : ''}\n`);
  P.push('---\n');

  // ── POTANSİYEL ANALİZ ──
  if (potansiyel.length) {
    P.push(`## 🌟 1. Potansiyel Analiz — Öğrenme ve Kişilik Profili\n`);
    P.push(`*${tamlayan(name)} nasıl öğrendiğini, düşündüğünü ve neye yatkın olduğunu gösteren testler.*\n`);
    for (const h of potansiyel) {
      P.push(`### ${h.icon} ${h.name}\n${h.headline}\n${h.points.length ? '\n' + h.points.map((p) => `- ${p}`).join('\n') + '\n' : ''}`);
    }
    // Potansiyel analiz özeti + çapraz bağlantılar
    P.push('---\n');
  }

  // ── PERFORMANS VE GELİŞİM ──
  if (performans.length) {
    P.push(`## 📈 2. Performans ve Gelişim — Akademik, Dikkat ve Alışkanlıklar\n`);
    P.push(`*${tamlayan(name)} mevcut performansını ve gelişim alanlarını gösteren testler.*\n`);
    // Performans metrikleri bars
    const perfMetrics = performans.filter((h) => h.metric).map((h) => [h.metric!.label, h.metric!.value] as [string, number]);
    if (perfMetrics.length >= 2) P.push(barsBlock('Performans Alanları (%)', perfMetrics));
    for (const h of performans) {
      P.push(`### ${h.icon} ${h.name}\n${h.headline}\n${h.points.length ? '\n' + h.points.map((p) => `- ${p}`).join('\n') + '\n' : ''}`);
    }
    P.push('---\n');
  }

  // ── ÇAPRAZ ÖRÜNTÜLER — bu raporun asıl katma değeri ──
  const patterns = crossPatterns(name, highlights);
  if (patterns.length) {
    const pek = patterns.filter((p) => p.kind === 'pekistirme');
    const ger = patterns.filter((p) => p.kind === 'gerilim');
    const fir = patterns.filter((p) => p.kind === 'firsat');

    P.push(`## 🔗 Testler Arası Örüntüler\n`);
    P.push(
      isStudent
        ? `Tek tek testler bir şey söyler; birlikte bakınca daha fazlası görünür. İşte testlerinin **birbirine ne anlattığı**:\n`
        : `Bu bölüm, tekil raporlarda görünmeyen bilgiyi taşır: testlerin **birbirini doğruladığı**, **birbiriyle gerildiği** ve **birlikte fırsat yarattığı** noktalar.\n`,
    );

    if (pek.length) {
      P.push(`### ✅ Birbirini Doğrulayan Bulgular\n`);
      P.push(`Birden fazla test aynı yönü işaret ediyor. Bu, bulgunun güvenilirliğini artırır.\n`);
      P.push(chainBlock('Pekiştiren Örüntüler', pek.map((p) => p.chain)));
      for (const p of pek) P.push(insight('strength', p.title, p.text));
    }

    if (ger.length) {
      P.push(`### ⚠️ Dikkat Gerektiren Kombinasyonlar\n`);
      P.push(
        isStudent
          ? `Bunlar sorun değil — sadece **hangi sıraya göre ilerlemen gerektiğini** gösteren ipuçları.\n`
          : `Bu kombinasyonlar, **doğru önerinin yanlış soruna uygulanmasını** önler. Sıralama önemlidir.\n`,
      );
      P.push(chainBlock('Gerilim Örüntüleri', ger.map((p) => p.chain)));
      for (const p of ger) P.push(insight('risk', p.title, p.text));
    }

    if (fir.length) {
      P.push(`### 🚀 Birlikte Yarattığı Fırsatlar\n`);
      P.push(chainBlock('Fırsat Örüntüleri', fir.map((p) => p.chain)));
      for (const p of fir) P.push(insight('action', p.title, p.text));
    }
    P.push('---\n');
  } else if (highlights.length >= 2) {
    P.push(`## 🔗 Testler Arası Örüntüler\n`);
    P.push(insight('note', 'Belirgin Örüntü Yok',
      `Testler arasında dikkat çeken bir pekiştirme veya gerilim örüntüsü belirmedi. ` +
      `Bu, profilin dengeli olduğu anlamına gelebilir. Daha fazla test eklendikçe örüntüler netleşir.`));
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
    P.push(`- ${tamlayan(name)} güçlü öğrenme kanalını gözeten bir çalışma ortamı, evde öğrenmeyi kolaylaştırabilir.\n- Sonuçtan çok çabayı ve süreci takdir etmek, motivasyonu ve özgüveni besleyebilir.\n- Gelişim alanlarında küçük, düzenli desteklerle ilerlemek fark yaratabilir.\n`);
  } else {
    P.push(`- ${tamlayan(name)} güçlü zekâ/öğrenme kanalını görev ve materyal seçiminde işe koşmak, derse katılımı artırabilir.\n- Güçlü yönler üzerinden gelişim alanlarını desteklemek (köprü kurmak) verimli olabilir.\n- Somut, yönteme dönük geri bildirim, genel övgüden daha etkili olabilir.\n`);
  }
  // Özet aksiyon içgörüleri
  if (topPot) P.push(insight('strength', 'Merkeze Al', `${topPot.headline.replace(/\*\*/g, '')}`));
  const focusPerf = performans.find((h) => h.metric && h.metric.value < 60);
  if (focusPerf) P.push(insight('action', 'Öncelikli Gelişim', `${focusPerf.name}: ${focusPerf.points[0] || 'hedefli, düzenli çalışma denenebilir.'}`));

  // ── ÖNCELİK SIRALI EYLEM PLANI ──
  // Sıra, gerilim örüntülerinden türetilir: hangi soruna ÖNCE eğilmek gerektiği
  // tek tek test sonuçlarından değil, testlerin BİRLİKTE söylediğinden çıkar.
  {
    const ger = patterns.filter((p) => p.kind === 'gerilim');
    const steps: [string, string?, string?][] = [];
    steps.push([
      isStudent ? 'Sonucu birlikte oku' : 'Sonucu öğrenciyle paylaşın',
      isStudent ? 'Hangi bulguya şaşırdığını not et — farkındalık ilk adımdır.' : `${belirtme(name)} rapordaki hangi bulguya şaşırdığını sorun.`,
      '1. hafta',
    ]);
    for (const g of ger.slice(0, 3)) steps.push([g.title, g.chain[2], `${steps.length + 1}–${steps.length + 2}. hafta`]);
    if (topPot) steps.push(['Güçlü yönü merkeze al', topPot.points[0] || 'En güçlü kanalı çalışma yönteminin merkezine alın.', `${steps.length + 1}. hafta`]);
    if (focusPerf) steps.push([`Gelişim alanı: ${focusPerf.name}`, focusPerf.points[0] || 'Küçük ve düzenli adımlarla ilerleyin.', `${steps.length + 1}. hafta`]);
    steps.push(['Ara değerlendirme', 'Ne değişti, hangi yaklaşım işe yaradı — birlikte konuşun.', `${steps.length + 1}. hafta`]);
    steps.push(['Yeniden ölç', 'Testleri tekrar alıp profildeki değişimi karşılaştırın.', '8–10. hafta']);

    P.push(`### 📅 Öncelik Sıralı Plan\n`);
    P.push(
      ger.length
        ? `Aşağıdaki sıra, tek tek test sonuçlarından değil **testlerin birlikte söylediğinden** çıkarıldı. Sıra önemlidir.\n`
        : `Aşağıdaki plan, profilin genel yönüne göre hazırlandı.\n`,
    );
    P.push(timelineBlock(isStudent ? 'Senin İçin Yol Haritası' : `${tamlayan(name)} Yol Haritası`, steps));
  }
  P.push('---\n');

  // Kapanış
  P.push(`## 🌱 Kapanış\n`);
  if (isStudent) {
    P.push(`${name}, bu profil senin bir fotoğrafın — bir kader değil. Güçlü yönlerini kullanarak ve gelişim alanlarında sabırla çalışarak istediğin yere ulaşabilirsin. Kendine güven! 💪\n`);
  } else {
    P.push(`${tamlayan(name)} entegre profili, öğrenmeye açık ve yönlendirilebilir bir tabloyu işaret ediyor. Güçlü yönleri merkeze alan, gelişim alanlarını yargılamadan destekleyen bütüncül bir yaklaşım en verimli sonucu getirebilir. Bu profil zamanla gelişebilir.\n`);
  }
  P.push(reportFooter());
  return P.join('\n');
}
