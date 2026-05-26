// ============================================================
// Test Sonucu — Kısa Tavsiye & Grafik Konfigürasyon
// ============================================================
// Test bitince öğrenciye gösterilecek 1-2 cümlelik yalın tavsiye
// ve test türüne göre uygun grafik tipini belirler.
// Engine'lerin döndüğü scores objesinden çıkarım yapar.
// ============================================================

export type ChartType = 'donut' | 'radar' | 'bar' | 'gauge';

export interface ChartConfig {
  type: ChartType;
  /** [{ name: string, value: number, color?: string }] */
  data: Array<{ name: string; value: number; color?: string; full?: number }>;
  /** Gauge için min/max değerleri */
  min?: number;
  max?: number;
  /** Genel başlık (chart üst kısmı) */
  title?: string;
}

export interface ShortResult {
  /** Büyük başlık (örn: "Güçlü Sağ Beyin") */
  main: string;
  /** 1-2 cümlelik yalın tavsiye */
  advisory: string;
  /** Grafik konfigürasyonu */
  chart: ChartConfig;
}

// ── Renk paleti (warm-friendly, gradient'le uyumlu) ──
const COLORS = {
  primary: '#7c3aed',
  emerald: '#10b981',
  rose: '#f43f5e',
  amber: '#f59e0b',
  sky: '#0ea5e9',
  violet: '#8b5cf6',
  pink: '#ec4899',
  teal: '#14b8a6',
  indigo: '#6366f1',
};

const PALETTE = Object.values(COLORS);

// ── Skorlardan sayısal değer çek (label match'le) ──
function pickScore(scores: Record<string, unknown>, ...keywords: string[]): number {
  for (const key of Object.keys(scores)) {
    const lower = key.toLowerCase();
    if (keywords.some((kw) => lower.includes(kw.toLowerCase()))) {
      const v = scores[key];
      if (typeof v === 'number') return v;
      if (typeof v === 'string') {
        const n = parseFloat(v.replace(/[^0-9.-]/g, ''));
        if (!isNaN(n)) return n;
      }
    }
  }
  return 0;
}

function dominantKeyFromMain(mainText: string): string {
  return (mainText || '').toLowerCase();
}

// ─────────────────────────────────────────────────────────
// SAĞ-SOL BEYİN — Donut + advisory
// ─────────────────────────────────────────────────────────
function buildSagSolBeyin(scores: Record<string, unknown>, main: string): ShortResult {
  const sag = pickScore(scores, 'sağ beyin', 'sag beyin', 'sagBeyin');
  const sol = pickScore(scores, 'sol beyin', 'solBeyin');
  const total = sag + sol || 1;
  const sagPct = Math.round((sag / total) * 100);

  const dom = dominantKeyFromMain(main);
  let advisory = '';
  if (dom.includes('sağ') || dom.includes('sag')) {
    advisory = 'Yaratıcılığın, sezgilerin ve hayal gücün güçlü tarafın. Bir konuyu öğrenirken renkli notlar, zihin haritaları ve görseller işine yarayabilir.';
  } else if (dom.includes('sol')) {
    advisory = 'Mantığın, analitik düşüncen ve planlama becerin güçlü tarafın. Bilgiyi sıralı listeler, formüller ve adım-adım yöntemlerle düzenlemek seni daha verimli kılar.';
  } else {
    advisory = 'Hem yaratıcı hem analitik tarafını dengeli kullanıyorsun — bu nadir bir kombinasyon. Farklı çalışma stillerini denemeye devam et, hangisi sana keyif veriyorsa onu seç.';
  }

  return {
    main,
    advisory,
    chart: {
      type: 'donut',
      data: [
        { name: '🎨 Sağ Beyin', value: sag, color: COLORS.rose },
        { name: '🔬 Sol Beyin', value: sol, color: COLORS.sky },
      ],
      title: `Sağ %${sagPct} · Sol %${100 - sagPct}`,
    },
  };
}

// ─────────────────────────────────────────────────────────
// VARK — Radar (4 boyut)
// ─────────────────────────────────────────────────────────
function buildVark(scores: Record<string, unknown>, main: string): ShortResult {
  const v = pickScore(scores, 'görsel', 'visual', 'V (');
  const a = pickScore(scores, 'işitsel', 'auditory', 'A (');
  const r = pickScore(scores, 'okuma', 'read', 'R (');
  const k = pickScore(scores, 'kinestetik', 'kinesthetic', 'K (');

  const styles = [
    { key: 'Görsel', val: v, tip: 'Resim, grafik, şema ve renkli notlarla öğren — gözünle gördüğünü hatırlarsın.' },
    { key: 'İşitsel', val: a, tip: 'Konuyu sesli okuyarak, anlatarak veya birinden dinleyerek öğren — kulağına çalan daha iyi yerleşir.' },
    { key: 'Okuma-Yazma', val: r, tip: 'Detaylı notlar al, özet çıkar, kendi cümlelerinle yaz — yazdığın kalır.' },
    { key: 'Kinestetik', val: k, tip: 'Hareket ederek, dokunarak, deneyimleyerek öğren — yaparak hatırlarsın.' },
  ];
  styles.sort((x, y) => y.val - x.val);
  const advisory = `Senin baskın öğrenme stilin: ${styles[0].key}. ${styles[0].tip}`;

  return {
    main,
    advisory,
    chart: {
      type: 'radar',
      data: [
        { name: 'Görsel', value: v, full: 16 },
        { name: 'İşitsel', value: a, full: 16 },
        { name: 'Okuma-Yazma', value: r, full: 16 },
        { name: 'Kinestetik', value: k, full: 16 },
      ],
    },
  };
}

// ─────────────────────────────────────────────────────────
// ÇOKLU ZEKA — Radar (8 boyut)
// ─────────────────────────────────────────────────────────
function buildCokluZeka(scores: Record<string, unknown>, main: string): ShortResult {
  const zekalar = [
    { key: 'Sözel', kws: ['sözel', 'sozel', 'linguistic'] },
    { key: 'Mantıksal', kws: ['mantık', 'mantik', 'logical'] },
    { key: 'Görsel', kws: ['görsel', 'gorsel', 'spatial'] },
    { key: 'Müziksel', kws: ['müzik', 'muzik', 'musical'] },
    { key: 'Bedensel', kws: ['bedensel', 'kinesthetic'] },
    { key: 'Sosyal', kws: ['sosyal', 'interpersonal'] },
    { key: 'İçsel', kws: ['içsel', 'icsel', 'intrapersonal'] },
    { key: 'Doğacı', kws: ['doğacı', 'dogaci', 'naturalist'] },
  ];
  const data = zekalar.map((z) => ({ name: z.key, value: pickScore(scores, ...z.kws), full: 100 }));
  const top = [...data].sort((a, b) => b.value - a.value)[0];
  const advisory = `Senin en güçlü zekan: ${top.name} (%${Math.round(top.value)}). Bu yönünü destekleyen etkinliklere zaman ayır, diğerlerini de geliştirmek için farklı alanlar dene.`;

  return { main, advisory, chart: { type: 'radar', data } };
}

// ─────────────────────────────────────────────────────────
// HOLLAND (RIASEC) — Radar (6 boyut)
// ─────────────────────────────────────────────────────────
function buildHolland(scores: Record<string, unknown>, main: string): ShortResult {
  const riasec = [
    { key: 'Gerçekçi', kws: ['gerçekçi', 'realistic', ' R '] },
    { key: 'Araştırıcı', kws: ['araştırıcı', 'investigative', ' I '] },
    { key: 'Sanatsal', kws: ['sanatsal', 'artistic', ' A '] },
    { key: 'Sosyal', kws: ['sosyal', 'social', ' S '] },
    { key: 'Girişimci', kws: ['girişimci', 'enterprising', ' E '] },
    { key: 'Geleneksel', kws: ['geleneksel', 'conventional', ' C '] },
  ];
  const data = riasec.map((r) => ({ name: r.key, value: pickScore(scores, ...r.kws), full: 50 }));
  const top = [...data].sort((a, b) => b.value - a.value)[0];
  const advisory = `Mesleki ilgi yönelimin: ${top.name}. Bu alandaki meslekleri ve etkinlikleri araştırmak senin için motive edici olabilir.`;

  return { main, advisory, chart: { type: 'radar', data } };
}

// ─────────────────────────────────────────────────────────
// SINAV KAYGISI — Gauge (0-100)
// ─────────────────────────────────────────────────────────
function buildSinavKaygisi(scores: Record<string, unknown>, main: string): ShortResult {
  // Toplam kaygı yüzdesi — page.tsx tarafından 'Toplam Kaygı' label'ı ile injekte ediliyor.
  // Eski davranışla uyumluluk için 'kaygı'/'total'/'genel' anahtarlarına da bakıyoruz.
  const puan = pickScore(scores, 'toplam', 'kaygı', 'kaygi', 'total', 'genel');

  // Advisory'yi PUAN üzerinden belirle — main string parsing'i emoji/whitespace
  // varyasyonlarına duyarlıydı ve gauge ile çelişki üretebiliyordu. Tek kaynak (totalPct).
  // Eşikler engine ile aynı: <15 çok düşük, 15-35 düşük, 35-55 orta, 55-75 yüksek, 75+ çok yüksek
  let advisory = '';
  if (puan >= 55) {
    advisory = 'Sınav kaygın yüksek seviyede — bu seninle ilgili bir kusur değil. Nefes egzersizleri, derin uyku ve sevdiğin biriyle konuşmak çok yardımcı olur. Rehber öğretmenle paylaşmaktan çekinme.';
  } else if (puan >= 35) {
    advisory = 'Sınav kaygın orta seviyede — herkesin bir miktar kaygısı vardır, bu normal. Sınavdan önce kısa nefes egzersizleri ve planlı çalışma seni rahatlatır.';
  } else if (puan >= 15) {
    advisory = 'Sınav kaygın hafif seviyede — sınavlara karşı sağlıklı bir tutum içindesin. Düzenli uyku ve düzenli çalışma bu sağlıklı dengeni korur.';
  } else {
    advisory = 'Sınav kaygın çok düşük seviyede — sınavlara karşı son derece rahat bir tutumun var. Şu anki halini koruyabilmek için düzenli uyku ve sağlıklı beslenmen yeterli.';
  }

  // Gözden geçirme: main string'i overallLevel ile geliyorsa rapor uyumlu olmalı
  // (debug için: m parsing artık kullanılmıyor)
  void main;

  return {
    main,
    advisory,
    chart: {
      type: 'gauge',
      data: [{ name: 'Kaygı Puanı', value: puan, color: COLORS.amber }],
      min: 0,
      max: 100,
      title: `Puan: ${Math.round(puan)} / 100`,
    },
  };
}

// ─────────────────────────────────────────────────────────
// ÇALIŞMA DAVRANIŞI — Yatay bar
// ─────────────────────────────────────────────────────────
function buildCalismaDavranisi(scores: Record<string, unknown>, main: string): ShortResult {
  const kategoriler = ['Plan', 'Disiplin', 'Motivasyon', 'Verimlilik', 'Konsantrasyon'];
  const data = kategoriler.map((k, i) => ({
    name: k,
    value: pickScore(scores, k.toLowerCase()),
    color: PALETTE[i % PALETTE.length],
    full: 100,
  })).filter((d) => d.value > 0);

  // En düşük alanı bul ve oraya tavsiye yap
  const lowest = [...data].sort((a, b) => a.value - b.value)[0];
  const advisory = lowest
    ? `Çalışma alışkanlıklarında en çok gelişim alanın "${lowest.name}". Bu alanda küçük günlük hedefler koyarak başlayabilirsin.`
    : 'Çalışma alışkanlıkların hakkında detaylı bilgi için öğretmenine danışabilirsin.';

  return { main, advisory, chart: { type: 'bar', data } };
}

// ─────────────────────────────────────────────────────────
// D2 / BURDON DİKKAT — Gauge (toplam puan)
// ─────────────────────────────────────────────────────────
function buildDikkat(scores: Record<string, unknown>, main: string): ShortResult {
  const puan = pickScore(scores, 'genel puan', 'tn-e', 'CP', 'konsantrasyon');
  const m = main.toLowerCase();
  let advisory = '';
  if (m.includes('iyi') || m.includes('yüksek')) {
    advisory = 'Dikkat ve konsantrasyon seviyen iyi. Sınav öncesi kısa molalar ve düzenli uyku bu yetini güçlü tutar.';
  } else if (m.includes('zayıf') || m.includes('düşük')) {
    advisory = 'Dikkat süren kısa kalmış olabilir — bu normal. Çalışmadan önce 5 dakikalık konsantrasyon egzersizleri (örn. ters sayma, hızlı satranç) faydalı olabilir.';
  } else {
    advisory = 'Dikkatin orta seviyede. Çalışırken telefon vb. dikkat dağıtıcılardan uzak ortam ve 25 dakika çalış / 5 dakika dinlen (Pomodoro) tekniği işine yarar.';
  }
  return {
    main,
    advisory,
    chart: {
      type: 'gauge',
      data: [{ name: 'Konsantrasyon', value: puan, color: COLORS.indigo }],
      min: 0,
      max: 100,
      title: `Puan: ${Math.round(puan)}`,
    },
  };
}

// ─────────────────────────────────────────────────────────
// HIZLI OKUMA — Gauge
// ─────────────────────────────────────────────────────────
function buildHizliOkuma(scores: Record<string, unknown>, main: string): ShortResult {
  const wpm = pickScore(scores, 'kelime', 'dakika', 'wpm', 'hız', 'okuma');
  const advisory = wpm > 200
    ? `Hızın iyi! Bu hızda anlama oranını yüksek tutmak için sesli okumadan içeride okumaya geçtiğinden emin ol.`
    : `${Math.round(wpm)} kelime/dakika — günlük 10-15 dakikalık göz hareketleri egzersizi (örn. satır takip, S-zigzag) hızını arttırır.`;

  return {
    main,
    advisory,
    chart: {
      type: 'gauge',
      data: [{ name: 'Okuma Hızı', value: wpm, color: COLORS.teal }],
      min: 0,
      max: 400,
      title: `${Math.round(wpm)} Kelime/Dakika`,
    },
  };
}

// ─────────────────────────────────────────────────────────
// ENNEAGRAM — Yatay bar (9 tip)
// ─────────────────────────────────────────────────────────
function buildEnneagram(scores: Record<string, unknown>, main: string): ShortResult {
  const tipler = ['Tip 1', 'Tip 2', 'Tip 3', 'Tip 4', 'Tip 5', 'Tip 6', 'Tip 7', 'Tip 8', 'Tip 9'];
  const data = tipler.map((t, i) => ({
    name: t,
    value: pickScore(scores, t.toLowerCase(), t),
    color: PALETTE[i % PALETTE.length],
    full: 50,
  }));
  const advisory = 'Enneagram tipin kişisel gelişim yolculuğunda bir başlangıç noktası. Tipinin güçlü ve gölge yönlerini araştırmak öz-farkındalığını arttırır.';

  return { main, advisory, chart: { type: 'bar', data } };
}

// ─────────────────────────────────────────────────────────
// AKADEMİK ANALİZ — Yatay bar (kategori)
// ─────────────────────────────────────────────────────────
function buildAkademikAnaliz(scores: Record<string, unknown>, main: string): ShortResult {
  const data = Object.entries(scores)
    .filter(([k]) => !k.startsWith('_'))
    .slice(0, 8)
    .map(([name, v], i) => ({
      name: name.length > 18 ? name.slice(0, 16) + '…' : name,
      value: typeof v === 'number' ? v : parseFloat(String(v).replace(/[^0-9.-]/g, '')) || 0,
      color: PALETTE[i % PALETTE.length],
      full: 100,
    }));
  const advisory = 'Akademik analizin farklı derslerdeki güçlü ve gelişim alanlarını gösterir. En düşük puanlı alana haftada 2-3 ek tekrar ekleyebilirsin.';

  return { main, advisory, chart: { type: 'bar', data } };
}

// ─────────────────────────────────────────────────────────
// FALLBACK — Generic bar
// ─────────────────────────────────────────────────────────
function buildGeneric(scores: Record<string, unknown>, main: string): ShortResult {
  const data = Object.entries(scores)
    .filter(([k]) => !k.startsWith('_'))
    .slice(0, 6)
    .map(([name, v], i) => ({
      name: name.length > 18 ? name.slice(0, 16) + '…' : name,
      value: typeof v === 'number' ? v : parseFloat(String(v).replace(/[^0-9.-]/g, '')) || 0,
      color: PALETTE[i % PALETTE.length],
      full: 100,
    }));
  return {
    main,
    advisory: 'Testin tamamlandı. Detaylı yorumu öğretmenin "Direkt Analiz" bölümünden inceleyebilir.',
    chart: { type: 'bar', data },
  };
}

// ═════════════════════════════════════════════════════════
// ANA FONKSİYON — test türüne göre yönlendir
// ═════════════════════════════════════════════════════════
export function buildShortResult(
  testId: string,
  scores: Record<string, unknown>,
  main: string
): ShortResult {
  switch (testId) {
    case 'sag-sol-beyin': return buildSagSolBeyin(scores, main);
    case 'vark':          return buildVark(scores, main);
    case 'coklu-zeka':    return buildCokluZeka(scores, main);
    case 'holland':       return buildHolland(scores, main);
    case 'sinav-kaygisi': return buildSinavKaygisi(scores, main);
    case 'calisma-davranisi': return buildCalismaDavranisi(scores, main);
    case 'd2-dikkat':
    case 'burdon-dikkat': return buildDikkat(scores, main);
    case 'hizli-okuma':   return buildHizliOkuma(scores, main);
    case 'enneagram':     return buildEnneagram(scores, main);
    case 'akademik-analiz': return buildAkademikAnaliz(scores, main);
    default:              return buildGeneric(scores, main);
  }
}
