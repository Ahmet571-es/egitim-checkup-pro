// ============================================================
// Sağ-Sol Beyin Testi — Görsel Sorular (V101-V115)
// 15 görsel soru, klasik nöropsikoloji literatüründen
// SVG'ler inline — external asset yok
// ============================================================

export interface VisualOption {
  key: 'a' | 'b';
  label: string;
  rightBrain: boolean;
}

export interface VisualQuestion {
  id: number; // 101-115 — text ID alanı (1-35) ile çakışmaz
  text: string;
  category: 'optik' | 'tercih' | 'tanima' | 'kompozisyon' | 'algi';
  promptSvg: string; // Inline SVG, viewBox 0 0 400 240
  options: [VisualOption, VisualOption];
}

/** Yardımcı: SVG için ortak stil tanımları (her soruda inline tutuluyor). */
const BG = '#fefce8'; // krem warm

export const VISUAL_QUESTIONS: VisualQuestion[] = [
  // ───────────────────────── V101: Rubin Vazosu ─────────────────────────
  {
    id: 101,
    text: 'Bu resimde ilk neyi gördün?',
    category: 'optik',
    promptSvg: `<svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Rubin vazosu ya da yüz silueti">
  <rect width="400" height="240" fill="${BG}"/>
  <!-- Symmetric path that reads as vase (centre) OR two facing faces -->
  <path d="M 120 30
           C 120 70, 165 80, 165 110
           C 165 140, 120 150, 120 210
           L 280 210
           C 280 150, 235 140, 235 110
           C 235 80, 280 70, 280 30 Z"
        fill="#1e293b"/>
</svg>`,
    options: [
      { key: 'a', label: 'Karşı karşıya bakan iki insan yüzü', rightBrain: true },
      { key: 'b', label: 'Beyaz arka planda siyah bir vazo', rightBrain: false },
    ],
  },

  // ───────────────────────── V102: Navon Hiyerarşik Harfler ─────────────────────────
  {
    id: 102,
    text: 'Bu resme ilk baktığında neyi fark ettin?',
    category: 'kompozisyon',
    promptSvg: `<svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Küçük H harflerinden oluşan büyük A harfi">
  <rect width="400" height="240" fill="${BG}"/>
  <g style="font-family: monospace; font-size: 22px; font-weight: 800; fill: #7c2d12;">
    <!-- Large 'A' shape composed of small 'H' letters -->
    <text x="195" y="50">H</text>
    <text x="180" y="75">H</text><text x="210" y="75">H</text>
    <text x="165" y="100">H</text><text x="225" y="100">H</text>
    <text x="150" y="125">H</text><text x="165" y="125">H</text><text x="180" y="125">H</text><text x="195" y="125">H</text><text x="210" y="125">H</text><text x="225" y="125">H</text><text x="240" y="125">H</text>
    <text x="135" y="150">H</text><text x="255" y="150">H</text>
    <text x="120" y="175">H</text><text x="270" y="175">H</text>
    <text x="105" y="200">H</text><text x="285" y="200">H</text>
  </g>
</svg>`,
    options: [
      { key: 'a', label: 'Büyük bir A harfi (bütüncül)', rightBrain: true },
      { key: 'b', label: 'Küçük H harflerini tek tek (detaycı)', rightBrain: false },
    ],
  },

  // ───────────────────────── V103: Renk Paleti Tercihi ─────────────────────────
  {
    id: 103,
    text: 'Hangi renk paleti sana daha çekici geliyor?',
    category: 'tercih',
    promptSvg: `<svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="İki renk paleti — soğuk ve sıcak tonlar">
  <rect width="400" height="240" fill="${BG}"/>
  <!-- Left palette: cool/neutral -->
  <text x="100" y="40" text-anchor="middle" font-size="14" font-weight="700" fill="#1e293b">B</text>
  <rect x="30"  y="60" width="40" height="120" fill="#1e40af"/>
  <rect x="80"  y="60" width="40" height="120" fill="#0891b2"/>
  <rect x="130" y="60" width="40" height="120" fill="#65a30d"/>
  <!-- Right palette: warm -->
  <text x="300" y="40" text-anchor="middle" font-size="14" font-weight="700" fill="#1e293b">A</text>
  <rect x="230" y="60" width="40" height="120" fill="#dc2626"/>
  <rect x="280" y="60" width="40" height="120" fill="#ea580c"/>
  <rect x="330" y="60" width="40" height="120" fill="#eab308"/>
  <!-- Divider -->
  <line x1="200" y1="40" x2="200" y2="200" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="4 4"/>
</svg>`,
    options: [
      { key: 'a', label: 'Kırmızı-turuncu tonlar (canlı, duygulu)', rightBrain: true },
      { key: 'b', label: 'Mavi-yeşil tonlar (sakin, düzenli)', rightBrain: false },
    ],
  },

  // ───────────────────────── V104: Geometrik vs Organik ─────────────────────────
  {
    id: 104,
    text: 'Hangi desen sana daha hoş geliyor?',
    category: 'tercih',
    promptSvg: `<svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Geometrik desen ve organik dalgalar">
  <rect width="400" height="240" fill="${BG}"/>
  <text x="100" y="35" text-anchor="middle" font-size="14" font-weight="700" fill="#1e293b">A</text>
  <text x="300" y="35" text-anchor="middle" font-size="14" font-weight="700" fill="#1e293b">B</text>
  <!-- Left: geometric grid of triangles -->
  <g stroke="#1e293b" stroke-width="2" fill="none">
    <polygon points="40,180 100,60 160,180" fill="#a5b4fc"/>
    <polygon points="40,180 100,180 70,120" fill="#818cf8"/>
    <polygon points="160,180 100,180 130,120" fill="#818cf8"/>
    <polygon points="100,60 130,120 70,120" fill="#6366f1"/>
  </g>
  <!-- Right: organic flowing curves -->
  <g fill="none" stroke="#c026d3" stroke-width="3">
    <path d="M 240 80 C 270 60, 290 100, 320 80 S 370 100, 360 130"/>
    <path d="M 240 130 C 270 110, 290 150, 320 130 S 370 150, 360 180"/>
  </g>
  <g fill="#f9a8d4">
    <ellipse cx="280" cy="100" rx="20" ry="35" transform="rotate(-20 280 100)"/>
    <ellipse cx="340" cy="150" rx="18" ry="30" transform="rotate(25 340 150)"/>
  </g>
  <line x1="200" y1="30" x2="200" y2="210" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="4 4"/>
</svg>`,
    options: [
      { key: 'a', label: 'Geometrik üçgen deseni (düzen, simetri)', rightBrain: false },
      { key: 'b', label: 'Akıcı, organik eğriler (özgürlük, his)', rightBrain: true },
    ],
  },

  // ───────────────────────── V105: Yön Bulma ─────────────────────────
  {
    id: 105,
    text: 'Bir yere gitmek için hangi tarifi daha kolay anlarsın?',
    category: 'tercih',
    promptSvg: `<svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="İki yön tarifi: sokak adlı vs görsel referans">
  <rect width="400" height="240" fill="${BG}"/>
  <text x="100" y="30" text-anchor="middle" font-size="13" font-weight="700" fill="#1e293b">B: Sokak adları</text>
  <text x="300" y="30" text-anchor="middle" font-size="13" font-weight="700" fill="#1e293b">A: Görsel landmark</text>
  <!-- Left: street grid -->
  <g stroke="#475569" stroke-width="2" fill="none">
    <line x1="30" y1="60"  x2="170" y2="60"/>
    <line x1="30" y1="120" x2="170" y2="120"/>
    <line x1="30" y1="180" x2="170" y2="180"/>
    <line x1="60"  y1="50" x2="60"  y2="190"/>
    <line x1="100" y1="50" x2="100" y2="190"/>
    <line x1="140" y1="50" x2="140" y2="190"/>
  </g>
  <text x="40" y="55" font-size="8" fill="#1e293b">Atatürk Cd.</text>
  <text x="40" y="115" font-size="8" fill="#1e293b">Gül Sk.</text>
  <text x="105" y="55" font-size="8" fill="#1e293b" transform="rotate(-90 105 55)">Park Cd.</text>
  <!-- Route -->
  <path d="M 60 180 L 60 120 L 140 120" stroke="#dc2626" stroke-width="3" fill="none" stroke-dasharray="6 4"/>
  <circle cx="60" cy="180" r="4" fill="#16a34a"/>
  <circle cx="140" cy="120" r="4" fill="#dc2626"/>
  <!-- Right: landmark map -->
  <rect x="230" y="60" width="30" height="40" fill="#7c3aed"/>
  <text x="245" y="115" font-size="8" text-anchor="middle" fill="#1e293b">Cami</text>
  <circle cx="320" cy="80" r="15" fill="#16a34a"/>
  <text x="320" y="115" font-size="8" text-anchor="middle" fill="#1e293b">Büyük Ağaç</text>
  <rect x="350" y="150" width="35" height="30" fill="#f59e0b"/>
  <text x="367" y="195" font-size="8" text-anchor="middle" fill="#1e293b">Pazar</text>
  <path d="M 230 180 Q 270 130, 310 90 T 360 165" stroke="#dc2626" stroke-width="3" fill="none" stroke-dasharray="6 4"/>
  <circle cx="230" cy="180" r="4" fill="#16a34a"/>
  <circle cx="360" cy="165" r="4" fill="#dc2626"/>
  <line x1="200" y1="30" x2="200" y2="210" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="4 4"/>
</svg>`,
    options: [
      { key: 'a', label: '"Camiyi geç, büyük ağacın yanından sapa..."', rightBrain: true },
      { key: 'b', label: '"Atatürk Caddesi\'nde 200m yürü, sağa dön..."', rightBrain: false },
    ],
  },

  // ───────────────────────── V106: Simetri Tercihi ─────────────────────────
  {
    id: 106,
    text: 'Hangi tasarım sana daha güzel geliyor?',
    category: 'tercih',
    promptSvg: `<svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Simetrik mandala ve asimetrik soyut tasarım">
  <rect width="400" height="240" fill="${BG}"/>
  <text x="100" y="35" text-anchor="middle" font-size="14" font-weight="700" fill="#1e293b">A</text>
  <text x="300" y="35" text-anchor="middle" font-size="14" font-weight="700" fill="#1e293b">B</text>
  <!-- Left: symmetric mandala -->
  <g transform="translate(100 130)" fill="none" stroke="#0891b2" stroke-width="2">
    <circle cx="0" cy="0" r="55"/>
    <circle cx="0" cy="0" r="35"/>
    <circle cx="0" cy="0" r="15"/>
    <line x1="-55" y1="0" x2="55" y2="0"/>
    <line x1="0" y1="-55" x2="0" y2="55"/>
    <line x1="-39" y1="-39" x2="39" y2="39"/>
    <line x1="-39" y1="39" x2="39" y2="-39"/>
  </g>
  <!-- Right: asymmetric flowing -->
  <g transform="translate(300 130)">
    <path d="M -50 -30 Q -20 -50, 10 -25 T 60 -10" fill="none" stroke="#db2777" stroke-width="3"/>
    <circle cx="-30" cy="10" r="22" fill="#fbbf24"/>
    <circle cx="20" cy="25" r="14" fill="#f472b6"/>
    <ellipse cx="40" cy="-5" rx="15" ry="25" fill="#a78bfa" transform="rotate(35 40 -5)"/>
  </g>
  <line x1="200" y1="30" x2="200" y2="210" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="4 4"/>
</svg>`,
    options: [
      { key: 'a', label: 'Simetrik, dengeli mandala', rightBrain: false },
      { key: 'b', label: 'Asimetrik, akıcı tasarım', rightBrain: true },
    ],
  },

  // ───────────────────────── V107: Detay vs Bütün ─────────────────────────
  {
    id: 107,
    text: 'Bu küçük şekillere bakınca dikkatini ilk ne çekti?',
    category: 'kompozisyon',
    promptSvg: `<svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Küçük kare ve dairelerden oluşan büyük yıldız">
  <rect width="400" height="240" fill="${BG}"/>
  <!-- Big star shape composed of alternating small squares and circles -->
  <g fill="#7c3aed">
    <circle cx="200" cy="50" r="6"/>
    <rect x="172" y="80" width="10" height="10"/>
    <circle cx="218" cy="83" r="5"/>
    <rect x="145" y="105" width="10" height="10"/>
    <circle cx="195" cy="105" r="5"/>
    <rect x="245" y="105" width="10" height="10"/>
    <rect x="120" y="135" width="10" height="10"/>
    <circle cx="170" cy="135" r="5"/>
    <rect x="200" y="135" width="10" height="10"/>
    <circle cx="230" cy="135" r="5"/>
    <rect x="270" y="135" width="10" height="10"/>
    <!-- Bottom triangle of star -->
    <circle cx="155" cy="165" r="5"/>
    <rect x="185" y="160" width="10" height="10"/>
    <circle cx="215" cy="165" r="5"/>
    <rect x="235" y="160" width="10" height="10"/>
    <!-- Star arms -->
    <rect x="180" y="190" width="10" height="10"/>
    <circle cx="210" cy="195" r="5"/>
  </g>
</svg>`,
    options: [
      { key: 'a', label: 'Hepsinin oluşturduğu büyük yıldız şekli', rightBrain: true },
      { key: 'b', label: 'Tek tek karelerin ve dairelerin detayları', rightBrain: false },
    ],
  },

  // ───────────────────────── V108: Yüz İfadesi ─────────────────────────
  {
    id: 108,
    text: 'Bu yüzü görünce ilk tepkin ne olur?',
    category: 'tanima',
    promptSvg: `<svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Endişeli bir yüz çizimi">
  <rect width="400" height="240" fill="${BG}"/>
  <!-- Face -->
  <circle cx="200" cy="120" r="70" fill="#fde68a" stroke="#92400e" stroke-width="2"/>
  <!-- Eyes (slightly worried, looking down) -->
  <ellipse cx="175" cy="110" rx="6" ry="4" fill="#1e293b"/>
  <ellipse cx="225" cy="110" rx="6" ry="4" fill="#1e293b"/>
  <!-- Worried eyebrows -->
  <path d="M 162 95 Q 175 90, 188 100" fill="none" stroke="#1e293b" stroke-width="3" stroke-linecap="round"/>
  <path d="M 212 100 Q 225 90, 238 95" fill="none" stroke="#1e293b" stroke-width="3" stroke-linecap="round"/>
  <!-- Slight frown mouth -->
  <path d="M 175 150 Q 200 142, 225 150" fill="none" stroke="#1e293b" stroke-width="3" stroke-linecap="round"/>
</svg>`,
    options: [
      { key: 'a', label: 'Yüz hatlarını analiz ederim, ifade ne anlatıyor?', rightBrain: false },
      { key: 'b', label: 'Onun ruh haline hemen empati kurarım', rightBrain: true },
    ],
  },

  // ───────────────────────── V109: Müzik Temsili ─────────────────────────
  {
    id: 109,
    text: '"Müzik" denince ilk aklına gelen hangisi?',
    category: 'tercih',
    promptSvg: `<svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Sol: notalar ve sheet müzik. Sağ: dans eden figür ve ses dalgaları">
  <rect width="400" height="240" fill="${BG}"/>
  <text x="100" y="35" text-anchor="middle" font-size="14" font-weight="700" fill="#1e293b">B</text>
  <text x="300" y="35" text-anchor="middle" font-size="14" font-weight="700" fill="#1e293b">A</text>
  <!-- Left: sheet music staff -->
  <g stroke="#1e293b" stroke-width="1.5" fill="none">
    <line x1="35" y1="80" x2="170" y2="80"/>
    <line x1="35" y1="95" x2="170" y2="95"/>
    <line x1="35" y1="110" x2="170" y2="110"/>
    <line x1="35" y1="125" x2="170" y2="125"/>
    <line x1="35" y1="140" x2="170" y2="140"/>
  </g>
  <!-- Notes -->
  <g fill="#1e293b">
    <ellipse cx="55" cy="125" rx="7" ry="5" transform="rotate(-20 55 125)"/>
    <line x1="62" y1="123" x2="62" y2="90" stroke="#1e293b" stroke-width="2"/>
    <ellipse cx="85" cy="110" rx="7" ry="5" transform="rotate(-20 85 110)"/>
    <line x1="92" y1="108" x2="92" y2="75" stroke="#1e293b" stroke-width="2"/>
    <ellipse cx="115" cy="118" rx="7" ry="5" transform="rotate(-20 115 118)"/>
    <line x1="122" y1="116" x2="122" y2="83" stroke="#1e293b" stroke-width="2"/>
    <ellipse cx="145" cy="125" rx="7" ry="5" transform="rotate(-20 145 125)"/>
    <line x1="152" y1="123" x2="152" y2="90" stroke="#1e293b" stroke-width="2"/>
  </g>
  <text x="100" y="175" text-anchor="middle" font-size="10" fill="#475569">Allegro · 4/4</text>
  <!-- Right: dancing figure with sound waves -->
  <!-- Stick figure dancing -->
  <circle cx="300" cy="80" r="10" fill="#db2777"/>
  <line x1="300" y1="90" x2="300" y2="140" stroke="#db2777" stroke-width="3"/>
  <line x1="300" y1="100" x2="275" y2="115" stroke="#db2777" stroke-width="3"/>
  <line x1="300" y1="100" x2="330" y2="80" stroke="#db2777" stroke-width="3"/>
  <line x1="300" y1="140" x2="280" y2="175" stroke="#db2777" stroke-width="3"/>
  <line x1="300" y1="140" x2="320" y2="170" stroke="#db2777" stroke-width="3"/>
  <!-- Sound waves -->
  <g fill="none" stroke="#a78bfa" stroke-width="2">
    <path d="M 245 130 Q 250 120, 245 110"/>
    <path d="M 235 140 Q 245 120, 235 100"/>
    <path d="M 225 150 Q 240 120, 225 90"/>
    <path d="M 355 130 Q 350 120, 355 110"/>
    <path d="M 365 140 Q 355 120, 365 100"/>
    <path d="M 375 150 Q 360 120, 375 90"/>
  </g>
  <line x1="200" y1="30" x2="200" y2="210" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="4 4"/>
</svg>`,
    options: [
      { key: 'a', label: 'His, dans, kendinden geçme', rightBrain: true },
      { key: 'b', label: 'Notalar, ölçü, ritim, yapı', rightBrain: false },
    ],
  },

  // ───────────────────────── V110: Sayı/Şekil Dizisi ─────────────────────────
  {
    id: 110,
    text: 'Aşağıdaki tür bir bulmaca senin için nasıl?',
    category: 'algi',
    promptSvg: `<svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Sayı dizisi: 2, 4, 8, 16, ?">
  <rect width="400" height="240" fill="${BG}"/>
  <g font-family="monospace" font-size="42" font-weight="800" fill="#1e293b">
    <text x="55"  y="135" text-anchor="middle">2</text>
    <text x="115" y="135" text-anchor="middle">4</text>
    <text x="175" y="135" text-anchor="middle">8</text>
    <text x="235" y="135" text-anchor="middle">16</text>
    <text x="305" y="135" text-anchor="middle" fill="#dc2626">?</text>
  </g>
  <g stroke="#64748b" stroke-width="2" fill="none">
    <line x1="80"  y1="155" x2="100" y2="155"/>
    <line x1="135" y1="155" x2="155" y2="155"/>
    <line x1="200" y1="155" x2="215" y2="155"/>
    <line x1="260" y1="155" x2="285" y2="155"/>
  </g>
  <text x="200" y="200" text-anchor="middle" font-size="14" fill="#475569" font-style="italic">Bir sonraki sayı kaç?</text>
</svg>`,
    options: [
      { key: 'a', label: 'Hemen kuralı görür, hızlıca çözerim (32)', rightBrain: false },
      { key: 'b', label: 'Sayılar zihnimi yorar, görseller daha eğlenceli', rightBrain: true },
    ],
  },

  // ───────────────────────── V111: Soyut Sanat Tercihi ─────────────────────────
  {
    id: 111,
    text: 'Bir müzede hangi tabloyu daha uzun süre izlerdin?',
    category: 'tercih',
    promptSvg: `<svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mondrian tarzı geometrik soyut ve Pollock tarzı serbest soyut">
  <rect width="400" height="240" fill="${BG}"/>
  <text x="100" y="35" text-anchor="middle" font-size="14" font-weight="700" fill="#1e293b">B</text>
  <text x="300" y="35" text-anchor="middle" font-size="14" font-weight="700" fill="#1e293b">A</text>
  <!-- Left: Mondrian-style grid -->
  <g stroke="#1e293b" stroke-width="3">
    <rect x="30" y="60" width="140" height="140" fill="white"/>
    <rect x="30" y="60" width="60" height="80" fill="#dc2626"/>
    <rect x="90" y="60" width="80" height="50" fill="white"/>
    <rect x="90" y="110" width="80" height="50" fill="#facc15"/>
    <rect x="30" y="140" width="60" height="60" fill="#2563eb"/>
    <rect x="90" y="160" width="80" height="40" fill="white"/>
  </g>
  <!-- Right: Pollock-style splatters -->
  <rect x="230" y="60" width="140" height="140" fill="#fef9c3"/>
  <g>
    <ellipse cx="270" cy="100" rx="20" ry="6" transform="rotate(30 270 100)" fill="#1e293b"/>
    <ellipse cx="310" cy="130" rx="25" ry="5" transform="rotate(-15 310 130)" fill="#dc2626"/>
    <ellipse cx="345" cy="155" rx="18" ry="4" transform="rotate(45 345 155)" fill="#1e293b"/>
    <ellipse cx="280" cy="175" rx="22" ry="5" transform="rotate(60 280 175)" fill="#7c3aed"/>
    <circle cx="320" cy="80" r="4" fill="#dc2626"/>
    <circle cx="350" cy="100" r="3" fill="#1e293b"/>
    <circle cx="250" cy="140" r="3" fill="#7c3aed"/>
    <circle cx="340" cy="180" r="4" fill="#dc2626"/>
    <path d="M 245 90 Q 280 110, 270 145 T 355 175" stroke="#1e293b" stroke-width="2" fill="none"/>
  </g>
  <line x1="200" y1="30" x2="200" y2="210" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="4 4"/>
</svg>`,
    options: [
      { key: 'a', label: 'Serbest, fışkıran tablo (Pollock tarzı)', rightBrain: true },
      { key: 'b', label: 'Düzenli geometrik tablo (Mondrian tarzı)', rightBrain: false },
    ],
  },

  // ───────────────────────── V112: Eylem Sırası ─────────────────────────
  {
    id: 112,
    text: 'Bir görevi öğrenirken hangi sunumu tercih edersin?',
    category: 'tercih',
    promptSvg: `<svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Sıralı 4 adım vs dağınık 4 öğe">
  <rect width="400" height="240" fill="${BG}"/>
  <text x="100" y="35" text-anchor="middle" font-size="14" font-weight="700" fill="#1e293b">A: Adım adım</text>
  <text x="300" y="35" text-anchor="middle" font-size="14" font-weight="700" fill="#1e293b">B: Toplu görsel</text>
  <!-- Left: numbered steps -->
  <g>
    <circle cx="50" cy="80" r="14" fill="#2563eb"/>
    <text x="50" y="86" text-anchor="middle" fill="white" font-weight="800" font-size="14">1</text>
    <line x1="65" y1="80" x2="85" y2="80" stroke="#475569" stroke-width="2"/>
    <circle cx="100" cy="80" r="14" fill="#2563eb"/>
    <text x="100" y="86" text-anchor="middle" fill="white" font-weight="800" font-size="14">2</text>
    <line x1="115" y1="80" x2="135" y2="80" stroke="#475569" stroke-width="2"/>
    <circle cx="150" cy="80" r="14" fill="#2563eb"/>
    <text x="150" y="86" text-anchor="middle" fill="white" font-weight="800" font-size="14">3</text>
    <line x1="100" y1="95" x2="100" y2="115" stroke="#475569" stroke-width="2"/>
    <circle cx="100" cy="130" r="14" fill="#2563eb"/>
    <text x="100" y="136" text-anchor="middle" fill="white" font-weight="800" font-size="14">4</text>
    <text x="100" y="180" text-anchor="middle" font-size="11" fill="#475569">Bir-bir-bir sırayla</text>
  </g>
  <!-- Right: cluster of related items -->
  <g>
    <circle cx="250" cy="80"  r="16" fill="#db2777"/>
    <circle cx="310" cy="70"  r="16" fill="#a855f7"/>
    <circle cx="360" cy="100" r="16" fill="#0891b2"/>
    <circle cx="290" cy="130" r="16" fill="#16a34a"/>
    <line x1="250" y1="80"  x2="310" y2="70"  stroke="#94a3b8" stroke-width="2" stroke-dasharray="3 3"/>
    <line x1="310" y1="70"  x2="360" y2="100" stroke="#94a3b8" stroke-width="2" stroke-dasharray="3 3"/>
    <line x1="290" y1="130" x2="250" y2="80"  stroke="#94a3b8" stroke-width="2" stroke-dasharray="3 3"/>
    <line x1="290" y1="130" x2="360" y2="100" stroke="#94a3b8" stroke-width="2" stroke-dasharray="3 3"/>
    <text x="300" y="180" text-anchor="middle" font-size="11" fill="#475569">Birbirine bağlı bütün</text>
  </g>
  <line x1="200" y1="30" x2="200" y2="210" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="4 4"/>
</svg>`,
    options: [
      { key: 'a', label: 'Sıralı, adım-adım gösterim', rightBrain: false },
      { key: 'b', label: 'Hepsini birden gösteren görsel', rightBrain: true },
    ],
  },

  // ───────────────────────── V113: Manzara Bakışı ─────────────────────────
  {
    id: 113,
    text: 'Bu manzaraya ilk baktığında neyi fark ettin?',
    category: 'kompozisyon',
    promptSvg: `<svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Dağ, güneş, ağaç ve evden oluşan basit manzara">
  <!-- Sky gradient -->
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fde68a"/>
      <stop offset="100%" stop-color="#fb923c"/>
    </linearGradient>
  </defs>
  <rect width="400" height="160" fill="url(#sky)"/>
  <rect x="0" y="160" width="400" height="80" fill="#86efac"/>
  <!-- Sun -->
  <circle cx="320" cy="55" r="22" fill="#fbbf24"/>
  <!-- Mountains -->
  <polygon points="0,160 100,80 200,160" fill="#475569"/>
  <polygon points="100,160 200,60 300,160" fill="#334155"/>
  <polygon points="100,80 130,110 70,110" fill="white"/>
  <polygon points="200,60 230,95 170,95" fill="white"/>
  <!-- Tree -->
  <rect x="58" y="165" width="6" height="20" fill="#78350f"/>
  <circle cx="61" cy="160" r="15" fill="#16a34a"/>
  <!-- House -->
  <rect x="280" y="170" width="30" height="25" fill="#dc2626"/>
  <polygon points="280,170 295,155 310,170" fill="#7c2d12"/>
  <rect x="290" y="180" width="8" height="15" fill="#1e293b"/>
  <!-- Bird (subtle detail) -->
  <path d="M 230 80 Q 235 75, 240 80 Q 245 75, 250 80" stroke="#1e293b" stroke-width="2" fill="none"/>
</svg>`,
    options: [
      { key: 'a', label: 'Manzaranın bütününden aldığım huzurlu his', rightBrain: true },
      { key: 'b', label: 'Resimdeki tek tek nesneleri (dağ, ev, güneş, ağaç)', rightBrain: false },
    ],
  },

  // ───────────────────────── V114: Yol Tercihi ─────────────────────────
  {
    id: 114,
    text: 'Bu iki yoldan hangisini tercih ederdin?',
    category: 'tercih',
    promptSvg: `<svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="İki yol: düz işaretli yol ve maceralı kavisli yol">
  <rect width="400" height="240" fill="${BG}"/>
  <text x="100" y="35" text-anchor="middle" font-size="14" font-weight="700" fill="#1e293b">A</text>
  <text x="300" y="35" text-anchor="middle" font-size="14" font-weight="700" fill="#1e293b">B</text>
  <!-- Left: straight predictable path -->
  <line x1="100" y1="60" x2="100" y2="200" stroke="#78716c" stroke-width="14"/>
  <line x1="100" y1="60" x2="100" y2="200" stroke="white" stroke-width="2" stroke-dasharray="10 8"/>
  <!-- Sign -->
  <rect x="115" y="100" width="40" height="20" fill="#16a34a"/>
  <text x="135" y="114" text-anchor="middle" font-size="9" fill="white" font-weight="700">→ Hedef</text>
  <line x1="135" y1="120" x2="135" y2="135" stroke="#475569" stroke-width="2"/>
  <!-- Right: winding adventurous path through mountains -->
  <path d="M 300 200 Q 250 170, 290 140 Q 340 110, 280 80 Q 240 60, 320 50" stroke="#a16207" stroke-width="14" fill="none"/>
  <path d="M 300 200 Q 250 170, 290 140 Q 340 110, 280 80 Q 240 60, 320 50" stroke="white" stroke-width="2" stroke-dasharray="6 5" fill="none"/>
  <!-- Trees & rocks -->
  <circle cx="260" cy="100" r="8" fill="#16a34a"/>
  <circle cx="350" cy="120" r="8" fill="#16a34a"/>
  <circle cx="245" cy="150" r="8" fill="#16a34a"/>
  <polygon points="335,80 340,70 345,80" fill="#78716c"/>
  <polygon points="265,180 270,170 275,180" fill="#78716c"/>
  <line x1="200" y1="30" x2="200" y2="210" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="4 4"/>
</svg>`,
    options: [
      { key: 'a', label: 'Düz, işaretli, garantili yol', rightBrain: false },
      { key: 'b', label: 'Kavisli, maceralı, sürpriz dolu yol', rightBrain: true },
    ],
  },

  // ───────────────────────── V115: Eksik Şekli Tamamlama ─────────────────────────
  {
    id: 115,
    text: 'Bu yarım kalmış desen sana ne hissettiriyor?',
    category: 'algi',
    promptSvg: `<svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Yarım kalmış spiral desen">
  <rect width="400" height="240" fill="${BG}"/>
  <!-- Partial spiral / fractal pattern fading on the right -->
  <g fill="none" stroke="#7c3aed" stroke-width="3">
    <circle cx="170" cy="120" r="70"/>
    <circle cx="170" cy="120" r="55"/>
    <circle cx="170" cy="120" r="40"/>
    <circle cx="170" cy="120" r="25"/>
    <circle cx="170" cy="120" r="10"/>
  </g>
  <!-- Fading dashed circles to suggest "incomplete" -->
  <g fill="none" stroke="#c4b5fd" stroke-width="2" stroke-dasharray="6 6" opacity="0.7">
    <path d="M 270 120 A 100 100 0 0 1 270 120" />
    <path d="M 240 50  Q 320 50, 340 120" />
    <path d="M 240 190 Q 320 190, 340 120" />
  </g>
  <text x="320" y="125" font-size="36" fill="#94a3b8" font-weight="800">?</text>
</svg>`,
    options: [
      { key: 'a', label: 'Mevcut desenin kurallarını çözüp simetrik tamamlamak isterim', rightBrain: false },
      { key: 'b', label: 'Tamamen farklı bir yöne dönerek özgün bitirebilirim', rightBrain: true },
    ],
  },
];

/**
 * Görsel sorular için skor sayım
 * Diğer ID'lerle (1-35) çakışmaz çünkü bu sorular 101-115 ID aralığında.
 */
export function calculateVisualScore(
  answers: Record<string | number, string>
): { sagBeyin: number; solBeyin: number; total: number } {
  let sag = 0;
  let sol = 0;
  for (const q of VISUAL_QUESTIONS) {
    const ans = answers[q.id] ?? answers[String(q.id)];
    if (ans == null) continue;
    const opt = q.options.find((o) => o.key === ans);
    if (!opt) continue;
    if (opt.rightBrain) sag++;
    else sol++;
  }
  return { sagBeyin: sag, solBeyin: sol, total: sag + sol };
}
