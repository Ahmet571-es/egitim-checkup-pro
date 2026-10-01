// ============================================================
// Rapor v2 — 3D görünümlü grafikler (SVG)
// ============================================================
// Tüm grafikler saf SVG metni olarak üretilir; aynı metin ekranda (React),
// PDF'te (pdfmake → svg-to-pdfkit) ve Word'de kullanılır.
//
// "3D görünüm" filtre kullanmadan elde edilir (PDF tarafı SVG filtrelerini
// desteklemez): renk geçişleri, ışık vuran üst yüzey, koyu yan yüzey,
// kaydırılmış yarı saydam gölge ve küre gibi parlayan noktalar.
// Değerler hiçbir zaman perspektifle bozulmaz: çubuğun ön yüzünün boyu,
// pastanın açısı ve ibrenin konumu gerçek değeri birebir gösterir.

import type { ChartSpec, ChartPoint } from './types';
import { shade, tint } from '@/lib/tests/colors';

const FONT = "DejaVuSans, 'DejaVu Sans', Arial, sans-serif";
const INK = '#1F2937';
const MUTED = '#6B7280';
const GRID = '#E5E7EB';

let uidCounter = 0;
const nextUid = () => `c${(uidCounter = (uidCounter + 1) % 1_000_000)}`;

function esc(s: string): string {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const r1 = (n: number) => Math.round(n * 10) / 10;
const clampPct = (n: number) => Math.max(0, Math.min(100, Number.isFinite(n) ? n : 0));
const pctText = (n: number) => `%${Math.round(clampPct(n))}`;

function text(x: number, y: number, s: string, o: { size?: number; anchor?: 'start' | 'middle' | 'end'; weight?: 'bold' | 'normal'; color?: string } = {}): string {
  return `<text x="${r1(x)}" y="${r1(y)}" font-family="${FONT}" font-size="${o.size ?? 11}" text-anchor="${o.anchor ?? 'start'}"${o.weight === 'bold' ? ' font-weight="bold"' : ''} fill="${o.color ?? INK}">${esc(s)}</text>`;
}

/** Uzun etiketi iki satıra böler (SVG'de otomatik satır kaydırma yok). */
function wrapLabel(s: string, max = 16): string[] {
  if (s.length <= max) return [s];
  const words = s.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max && cur) {
      lines.push(cur);
      cur = w;
    } else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 2);
}

function svgOpen(w: number, h: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">`;
}

/** Işık vuran küre (nokta işaretleri için). */
function sphere(id: string, cx: number, cy: number, r: number, color: string): string {
  return (
    `<defs><radialGradient id="${id}" cx="0.35" cy="0.35" r="0.65"><stop offset="0" stop-color="${tint(color, 0.75)}"/><stop offset="0.55" stop-color="${color}"/><stop offset="1" stop-color="${shade(color, 0.35)}"/></radialGradient></defs>` +
    `<circle cx="${r1(cx + 1.2)}" cy="${r1(cy + 1.6)}" r="${r1(r)}" fill="#000000" fill-opacity="0.18"/>` +
    `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(r)}" fill="url(#${id})"/>`
  );
}

// ── Dikey 3D sütunlar ───────────────────────────────────────

function columns3d(c: Extract<ChartSpec, { kind: 'columns3d' }>): string {
  const u = nextUid();
  const pts = c.points.slice(0, 10);
  const W = 520;
  const H = 250;
  const left = 34;
  const right = 18;
  const top = 26;
  const base = 196;
  const depthX = 10;
  const depthY = 7;
  const n = Math.max(1, pts.length);
  const slot = (W - left - right) / n;
  const bw = Math.min(56, slot * 0.55);
  const hmax = base - top;
  let s = svgOpen(W, H);
  s += `<defs><linearGradient id="${u}f" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${tint(c.color, 0.25)}"/><stop offset="0.55" stop-color="${c.color}"/><stop offset="1" stop-color="${shade(c.color, 0.22)}"/></linearGradient></defs>`;
  // Izgara ve zemin
  for (const g of [0, 25, 50, 75, 100]) {
    const y = base - (g / 100) * hmax;
    s += `<line x1="${left}" y1="${r1(y)}" x2="${W - right}" y2="${r1(y)}" stroke="${GRID}" stroke-width="1"/>`;
    s += text(left - 6, y + 3.5, String(g), { size: 9, anchor: 'end', color: MUTED });
  }
  s += `<polygon points="${left},${base} ${W - right},${base} ${W - right + depthX},${base - depthY} ${left + depthX},${base - depthY}" fill="#F3F4F6"/>`;
  const maxVal = Math.max(...pts.map((p) => p.value));
  pts.forEach((p, i) => {
    const v = clampPct(p.value);
    const h = Math.max(2, (v / 100) * hmax);
    const x = left + slot * i + (slot - bw) / 2;
    const y = base - h;
    const hi = c.highlightTop !== undefined ? i < c.highlightTop : v === maxVal;
    const front = hi ? `url(#${u}f)` : `url(#${u}f)`;
    // gölge
    s += `<polygon points="${r1(x + 4)},${base} ${r1(x + bw + 4)},${base} ${r1(x + bw + depthX + 8)},${base - depthY + 2} ${r1(x + depthX + 8)},${base - depthY + 2}" fill="#000000" fill-opacity="0.10"/>`;
    // yan yüz
    s += `<polygon points="${r1(x + bw)},${r1(y)} ${r1(x + bw + depthX)},${r1(y - depthY)} ${r1(x + bw + depthX)},${r1(base - depthY)} ${r1(x + bw)},${base}" fill="${shade(c.color, 0.32)}"/>`;
    // ön yüz
    s += `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(bw)}" height="${r1(h)}" fill="${front}"${hi ? '' : ' fill-opacity="0.78"'}/>`;
    // üst yüz
    s += `<polygon points="${r1(x)},${r1(y)} ${r1(x + depthX)},${r1(y - depthY)} ${r1(x + bw + depthX)},${r1(y - depthY)} ${r1(x + bw)},${r1(y)}" fill="${tint(c.color, 0.45)}"/>`;
    s += text(x + bw / 2 + depthX / 2, y - depthY - 5, pctText(v), { size: 10, anchor: 'middle', weight: 'bold', color: shade(c.color, 0.25) });
    wrapLabel(p.label, 14).forEach((line, li) => {
      s += text(x + bw / 2, base + 16 + li * 12, line, { size: 10, anchor: 'middle', color: INK });
    });
  });
  return s + '</svg>';
}

// ── Yatay 3D çubuklar ───────────────────────────────────────

function hbars3d(c: Extract<ChartSpec, { kind: 'hbars3d' }>): string {
  const u = nextUid();
  const pts = c.points.slice(0, 10);
  const W = 520;
  const rowH = 30;
  const top = 10;
  const labelW = 200;
  const barMaxW = W - labelW - 70;
  const depthX = 7;
  const depthY = 5;
  const H = top + pts.length * rowH + 14;
  let s = svgOpen(W, H);
  s += `<defs><linearGradient id="${u}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${tint(c.color, 0.3)}"/><stop offset="0.5" stop-color="${c.color}"/><stop offset="1" stop-color="${shade(c.color, 0.2)}"/></linearGradient></defs>`;
  pts.forEach((p, i) => {
    const v = clampPct(p.value);
    const y = top + i * rowH + 8;
    const bh = 14;
    const x0 = labelW;
    const w = Math.max(3, (v / 100) * barMaxW);
    wrapLabel(p.label, 30).forEach((line, li, arr) => {
      s += text(labelW - 10, y + bh / 2 + 4 - (arr.length - 1) * 5.5 + li * 11, line, { size: 10, anchor: 'end' });
    });
    // iz (boş kanal)
    s += `<rect x="${x0}" y="${y}" width="${barMaxW}" height="${bh}" rx="2" fill="#F3F4F6"/>`;
    // gölge
    s += `<rect x="${x0 + 3}" y="${y + 4}" width="${r1(w)}" height="${bh}" fill="#000000" fill-opacity="0.10"/>`;
    // üst yüz
    s += `<polygon points="${x0},${y} ${x0 + depthX},${y - depthY} ${r1(x0 + w + depthX)},${y - depthY} ${r1(x0 + w)},${y}" fill="${tint(c.color, 0.5)}"/>`;
    // uç yüz
    s += `<polygon points="${r1(x0 + w)},${y} ${r1(x0 + w + depthX)},${y - depthY} ${r1(x0 + w + depthX)},${y + bh - depthY} ${r1(x0 + w)},${y + bh}" fill="${shade(c.color, 0.3)}"/>`;
    // ön yüz
    s += `<rect x="${x0}" y="${y}" width="${r1(w)}" height="${bh}" fill="url(#${u}f)"/>`;
    s += text(x0 + w + depthX + 6, y + bh / 2 + 4, pctText(v), { size: 10, weight: 'bold', color: shade(c.color, 0.25) });
  });
  return s + '</svg>';
}

// ── Örümcek ağı (radar) ─────────────────────────────────────

function radarCore(u: string, color: string, labels: string[], values: number[], cx: number, cy: number, R: number, labelSize = 10): string {
  const n = labels.length;
  const ang = (i: number) => -Math.PI / 2 + (2 * Math.PI * i) / n;
  const pt = (i: number, rr: number) => [cx + Math.cos(ang(i)) * rr, cy + Math.sin(ang(i)) * rr];
  let s = `<defs><radialGradient id="${u}g" cx="0.5" cy="0.5" r="0.6"><stop offset="0" stop-color="${tint(color, 0.7)}"/><stop offset="1" stop-color="${color}"/></radialGradient></defs>`;
  // Halkalar
  for (const g of [0.25, 0.5, 0.75, 1]) {
    const poly = Array.from({ length: n }, (_, i) => pt(i, R * g).map(r1).join(',')).join(' ');
    s += `<polygon points="${poly}" fill="${g === 1 ? '#FAFAFA' : 'none'}" stroke="${GRID}" stroke-width="1"/>`;
  }
  for (let i = 0; i < n; i++) {
    const [x, y] = pt(i, R);
    s += `<line x1="${cx}" y1="${cy}" x2="${r1(x)}" y2="${r1(y)}" stroke="${GRID}" stroke-width="1"/>`;
  }
  const poly = values.map((v, i) => pt(i, (R * clampPct(v)) / 100).map(r1).join(',')).join(' ');
  const polyShadow = values.map((v, i) => {
    const [x, y] = pt(i, (R * clampPct(v)) / 100);
    return `${r1(x + 3)},${r1(y + 6)}`;
  }).join(' ');
  // kalınlık (alt katman) + gölge + ana yüzey
  s += `<polygon points="${polyShadow}" fill="#000000" fill-opacity="0.10"/>`;
  s += `<polygon points="${values.map((v, i) => { const [x, y] = pt(i, (R * clampPct(v)) / 100); return `${r1(x)},${r1(y + 4)}`; }).join(' ')}" fill="${shade(color, 0.3)}" fill-opacity="0.85"/>`;
  s += `<polygon points="${poly}" fill="url(#${u}g)" fill-opacity="0.9" stroke="${shade(color, 0.15)}" stroke-width="1.5"/>`;
  values.forEach((v, i) => {
    const [x, y] = pt(i, (R * clampPct(v)) / 100);
    s += sphere(`${u}s${i}`, x, y, 4.2, color);
  });
  // Etiketler
  labels.forEach((l, i) => {
    const [x, y] = pt(i, R + 16);
    const a = Math.cos(ang(i));
    const anchor = Math.abs(a) < 0.2 ? 'middle' : a > 0 ? 'start' : 'end';
    const lines = wrapLabel(l, 15);
    lines.forEach((line, li) => {
      s += text(x, y + 3 + (li - (lines.length - 1) / 2) * 11, line, { size: labelSize, anchor, weight: li === 0 ? 'bold' : 'normal', color: INK });
    });
    const [vx, vy] = pt(i, R + 16);
    s += text(vx, vy + 3 + ((lines.length + 1) / 2) * 11, pctText(values[i]), { size: 9, anchor, color: MUTED });
  });
  return s;
}

function radar(c: Extract<ChartSpec, { kind: 'radar' }>): string {
  const u = nextUid();
  const W = 520;
  const H = 330;
  return svgOpen(W, H) + radarCore(u, c.color, c.points.map((p) => p.label), c.points.map((p) => p.value), W / 2, H / 2 + 4, 112) + '</svg>';
}

// ── Holland altıgeni ────────────────────────────────────────

function hexagon(c: Extract<ChartSpec, { kind: 'hexagon' }>): string {
  const u = nextUid();
  const W = 520;
  const H = 320;
  const order = ['R', 'I', 'A', 'S', 'E', 'C'];
  const vals = order.map((k) => c.values.find((v) => v.key === k) ?? { key: k, label: k, value: 0 });
  let s = svgOpen(W, H);
  s += radarCore(u, c.color, vals.map((v) => `${v.key} · ${v.label}`), vals.map((v) => v.value), W / 2, H / 2 + 2, 108);
  return s + '</svg>';
}

// ── Halka (donut) ───────────────────────────────────────────

function arcPath(cx: number, cy: number, rOut: number, rIn: number, a0: number, a1: number): string {
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const p = (r: number, a: number) => `${r1(cx + Math.cos(a) * r)},${r1(cy + Math.sin(a) * r)}`;
  return `M${p(rOut, a0)} A${rOut},${rOut} 0 ${large} 1 ${p(rOut, a1)} L${p(rIn, a1)} A${rIn},${rIn} 0 ${large} 0 ${p(rIn, a0)} Z`;
}

function ring(c: Extract<ChartSpec, { kind: 'ring' }>): string {
  const u = nextUid();
  const W = 520;
  const H = 250;
  const cx = 150;
  const cy = 122;
  const R = 92;
  const rin = 52;
  const total = c.points.reduce((a, p) => a + Math.max(0, p.value), 0) || 1;
  const palette = [shade(c.color, 0.25), c.color, tint(c.color, 0.3), tint(c.color, 0.55), tint(c.color, 0.72)];
  let s = svgOpen(W, H);
  // kalınlık ve gölge
  s += `<ellipse cx="${cx + 4}" cy="${cy + R + 8}" rx="${R * 0.9}" ry="10" fill="#000000" fill-opacity="0.10"/>`;
  s += `<circle cx="${cx}" cy="${cy + 7}" r="${R}" fill="${shade(c.color, 0.4)}"/>`;
  s += `<circle cx="${cx}" cy="${cy + 7}" r="${rin}" fill="#FFFFFF"/>`;
  let a = -Math.PI / 2;
  const order = c.points.map((p, i) => ({ ...p, i }));
  order.forEach((p) => {
    const span = (Math.max(0, p.value) / total) * Math.PI * 2;
    if (span <= 0.001) return;
    const a1 = a + Math.min(span, Math.PI * 2 - 0.0001);
    s += `<defs><radialGradient id="${u}r${p.i}" cx="0.5" cy="0.4" r="0.7"><stop offset="0" stop-color="${tint(palette[p.i % palette.length], 0.35)}"/><stop offset="1" stop-color="${palette[p.i % palette.length]}"/></radialGradient></defs>`;
    s += `<path d="${arcPath(cx, cy, R, rin, a, a1)}" fill="url(#${u}r${p.i})" stroke="#FFFFFF" stroke-width="1.5"/>`;
    a = a1;
  });
  if (c.centerValue) {
    s += text(cx, cy - 2, c.centerLabel ?? '', { size: 10, anchor: 'middle', color: MUTED });
    s += text(cx, cy + 14, c.centerValue, { size: 12, anchor: 'middle', weight: 'bold' });
  }
  // açıklama
  c.points.forEach((p, i) => {
    const y = 58 + i * 34;
    const col = palette[i % palette.length];
    s += `<rect x="290" y="${y - 11}" width="16" height="16" rx="3" fill="${col}"/>`;
    s += `<rect x="290" y="${y - 11}" width="16" height="6" rx="3" fill="#FFFFFF" fill-opacity="0.3"/>`;
    s += text(316, y + 2, p.label, { size: 12, weight: 'bold' });
    s += text(470, y + 2, pctText((Math.max(0, p.value) / total) * 100), { size: 12, anchor: 'end', color: shade(c.color, 0.25), weight: 'bold' });
  });
  return s + '</svg>';
}

// ── Gösterge (ibre) ─────────────────────────────────────────

function gauge(c: Extract<ChartSpec, { kind: 'gauge' }>): string {
  const u = nextUid();
  const W = 520;
  const H = 230;
  const cx = W / 2;
  const cy = 170;
  const R = 130;
  const rin = 92;
  const v = clampPct(c.value);
  const angOf = (p: number) => Math.PI + (p / 100) * Math.PI;
  let s = svgOpen(W, H);
  s += `<defs><linearGradient id="${u}a" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${tint(c.color, 0.55)}"/><stop offset="1" stop-color="${shade(c.color, 0.15)}"/></linearGradient></defs>`;
  // kalınlık
  s += `<path d="${arcPath(cx, cy + 6, R, rin, Math.PI, Math.PI * 2)}" fill="#D1D5DB"/>`;
  s += `<path d="${arcPath(cx, cy, R, rin, Math.PI, Math.PI * 2)}" fill="#F3F4F6"/>`;
  // bölgeler
  for (const z of c.zones ?? []) {
    const zc = z.to <= 35 ? tint(c.color, 0.78) : z.to <= 55 ? tint(c.color, 0.55) : z.to <= 75 ? tint(c.color, 0.28) : c.color;
    s += `<path d="${arcPath(cx, cy, R + 8, R + 2, angOf(z.from), angOf(z.to))}" fill="${zc}"/>`;
    const mid = angOf((z.from + z.to) / 2);
    const ca = Math.cos(mid);
    const anchor = Math.abs(ca) < 0.3 ? 'middle' : ca > 0 ? 'start' : 'end';
    s += text(cx + ca * (R + 16), cy + Math.sin(mid) * (R + 16) - 2, z.label, { size: 10, anchor, color: MUTED });
  }
  // değer yayı
  if (v > 0.5) {
    s += `<path d="${arcPath(cx, cy + 5, R, rin, Math.PI, angOf(v))}" fill="${shade(c.color, 0.35)}"/>`;
    s += `<path d="${arcPath(cx, cy, R, rin, Math.PI, angOf(v))}" fill="url(#${u}a)"/>`;
  }
  // ibre
  const a = angOf(v);
  const tipX = cx + Math.cos(a) * (R - 6);
  const tipY = cy + Math.sin(a) * (R - 6);
  const nx = Math.cos(a + Math.PI / 2) * 6;
  const ny = Math.sin(a + Math.PI / 2) * 6;
  s += `<polygon points="${r1(cx + nx + 2)},${r1(cy + ny + 4)} ${r1(tipX + 2)},${r1(tipY + 4)} ${r1(cx - nx + 2)},${r1(cy - ny + 4)}" fill="#000000" fill-opacity="0.18"/>`;
  s += `<polygon points="${r1(cx + nx)},${r1(cy + ny)} ${r1(tipX)},${r1(tipY)} ${r1(cx - nx)},${r1(cy - ny)}" fill="${INK}"/>`;
  s += sphere(`${u}h`, cx, cy, 11, INK);
  s += text(cx, cy + 40, c.label, { size: 15, anchor: 'middle', weight: 'bold', color: shade(c.color, 0.2) });
  return s + '</svg>';
}

// ── Enneagram çemberi ───────────────────────────────────────

function enneagram(c: Extract<ChartSpec, { kind: 'enneagram' }>): string {
  const u = nextUid();
  const W = 520;
  const H = 330;
  const cx = W / 2;
  const cy = H / 2 + 4;
  const R = 112;
  // Enneagram yerleşimi: 9 tepede, saat yönünde 1…8
  const pos = (t: number, rr: number) => {
    const idx = t % 9; // 9 → 0
    const a = -Math.PI / 2 + (2 * Math.PI * idx) / 9;
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
  };
  let s = svgOpen(W, H);
  s += `<defs><radialGradient id="${u}g" cx="0.5" cy="0.5" r="0.6"><stop offset="0" stop-color="${tint(c.color, 0.7)}"/><stop offset="1" stop-color="${c.color}"/></radialGradient></defs>`;
  s += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="#FAFAFA" stroke="${GRID}" stroke-width="1.2"/>`;
  for (const g of [0.25, 0.5, 0.75]) s += `<circle cx="${cx}" cy="${cy}" r="${r1(R * g)}" fill="none" stroke="${GRID}" stroke-width="1"/>`;
  // klasik enneagram çizgileri (silik)
  const path = (ts: number[]) => ts.map((t) => pos(t, R).map(r1).join(',')).join(' ');
  s += `<polygon points="${path([1, 4, 2, 8, 5, 7])}" fill="none" stroke="${tint(c.color, 0.7)}" stroke-width="1"/>`;
  s += `<polygon points="${path([3, 6, 9])}" fill="none" stroke="${tint(c.color, 0.7)}" stroke-width="1"/>`;
  // değer çokgeni (Likert %20-100 → 0-1)
  const norm = (v: number) => Math.max(0.04, Math.min(1, (clampPct(v) - 20) / 80));
  const poly = Array.from({ length: 9 }, (_, i) => pos(i + 1, R * norm(c.values[i] ?? 0)));
  s += `<polygon points="${poly.map(([x, y]) => `${r1(x + 3)},${r1(y + 6)}`).join(' ')}" fill="#000000" fill-opacity="0.10"/>`;
  s += `<polygon points="${poly.map(([x, y]) => `${r1(x)},${r1(y + 4)}`).join(' ')}" fill="${shade(c.color, 0.3)}" fill-opacity="0.85"/>`;
  s += `<polygon points="${poly.map(([x, y]) => `${r1(x)},${r1(y)}`).join(' ')}" fill="url(#${u}g)" fill-opacity="0.88" stroke="${shade(c.color, 0.15)}" stroke-width="1.5"/>`;
  for (let t = 1; t <= 9; t++) {
    const [px, py] = poly[t - 1];
    s += sphere(`${u}p${t}`, px, py, t === c.main ? 6 : 3.6, t === c.main ? shade(c.color, 0.1) : c.color);
    const [lx, ly] = pos(t, R + 20);
    const isMain = t === c.main;
    const isWing = t === c.wing;
    if (isMain || isWing) {
      s += `<circle cx="${r1(lx)}" cy="${r1(ly - 4)}" r="${isMain ? 13 : 11}" fill="${isMain ? c.color : tint(c.color, 0.6)}"/>`;
    }
    s += text(lx, ly + 1, String(t), { size: isMain ? 13 : 11, anchor: 'middle', weight: 'bold', color: isMain ? '#FFFFFF' : INK });
  }
  s += text(18, H - 14, `● Baskın tip: ${c.main}`, { size: 10, color: shade(c.color, 0.2), weight: 'bold' });
  if (c.wing) s += text(150, H - 14, `● Kanat: ${c.wing}`, { size: 10, color: MUTED });
  return s + '</svg>';
}

// ── Çizgi (satır satır performans) ──────────────────────────

function line(c: Extract<ChartSpec, { kind: 'line' }>): string {
  const u = nextUid();
  const pts = c.points.slice(0, 40);
  const W = 520;
  const H = 230;
  const left = 34;
  const right = 16;
  const top = 18;
  const base = 186;
  const n = Math.max(2, pts.length);
  const x = (i: number) => left + ((W - left - right) * i) / (n - 1);
  const y = (v: number) => base - (clampPct(v) / 100) * (base - top);
  let s = svgOpen(W, H);
  s += `<defs><linearGradient id="${u}a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.color}" stop-opacity="0.55"/><stop offset="1" stop-color="${c.color}" stop-opacity="0.05"/></linearGradient></defs>`;
  for (const g of [0, 25, 50, 75, 100]) {
    s += `<line x1="${left}" y1="${r1(y(g))}" x2="${W - right}" y2="${r1(y(g))}" stroke="${GRID}" stroke-width="1"/>`;
    s += text(left - 6, y(g) + 3.5, String(g), { size: 9, anchor: 'end', color: MUTED });
  }
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${r1(x(i))},${r1(y(p.value))}`).join(' ');
  s += `<path d="${d} L${r1(x(pts.length - 1))},${base} L${r1(x(0))},${base} Z" fill="url(#${u}a)"/>`;
  // şerit kalınlığı
  s += `<path d="${pts.map((p, i) => `${i ? 'L' : 'M'}${r1(x(i) + 2)},${r1(y(p.value) + 5)}`).join(' ')}" fill="none" stroke="#000000" stroke-opacity="0.12" stroke-width="4"/>`;
  s += `<path d="${pts.map((p, i) => `${i ? 'L' : 'M'}${r1(x(i))},${r1(y(p.value) + 3)}`).join(' ')}" fill="none" stroke="${shade(c.color, 0.35)}" stroke-width="3"/>`;
  s += `<path d="${d}" fill="none" stroke="${c.color}" stroke-width="3"/>`;
  pts.forEach((p, i) => {
    s += sphere(`${u}d${i}`, x(i), y(p.value), 3.6, c.color);
    if (n <= 16 || i % 2 === 0) s += text(x(i), base + 14, p.label, { size: 9, anchor: 'middle', color: MUTED });
  });
  if (c.yLabel) s += text(W / 2, base + 32, c.yLabel, { size: 10, anchor: 'middle', color: MUTED });
  return s + '</svg>';
}

// ── Denge (sağ-sol) ─────────────────────────────────────────

function balance(c: Extract<ChartSpec, { kind: 'balance' }>): string {
  const u = nextUid();
  const W = 520;
  const H = 220;
  const cx = W / 2;
  const pivotY = 150;
  const lv = clampPct(c.left.value);
  const rv = clampPct(c.right.value);
  const diff = rv - lv; // pozitif → sağ taraf ağır
  const angle = Math.max(-14, Math.min(14, diff * 0.45)) * (Math.PI / 180);
  const half = 170;
  const ex = Math.cos(angle) * half;
  const ey = Math.sin(angle) * half;
  const lx = cx - ex;
  const ly = pivotY - 26 - ey;
  const rx = cx + ex;
  const ry = pivotY - 26 + ey;
  let s = svgOpen(W, H);
  s += `<defs><linearGradient id="${u}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${tint(c.color, 0.35)}"/><stop offset="1" stop-color="${shade(c.color, 0.2)}"/></linearGradient></defs>`;
  // zemin gölgesi ve dayanak
  s += `<ellipse cx="${cx}" cy="${pivotY + 22}" rx="120" ry="7" fill="#000000" fill-opacity="0.10"/>`;
  s += `<polygon points="${cx},${pivotY - 26} ${cx - 34},${pivotY + 20} ${cx + 34},${pivotY + 20}" fill="${shade(c.color, 0.3)}"/>`;
  s += `<polygon points="${cx},${pivotY - 26} ${cx - 34},${pivotY + 20} ${cx},${pivotY + 20}" fill="${shade(c.color, 0.15)}"/>`;
  // kiriş (kalınlık + yüzey)
  const beam = (dy: number, fill: string) => {
    const nx = -Math.sin(angle) * 6;
    const ny = Math.cos(angle) * 6;
    return `<polygon points="${r1(lx - nx)},${r1(ly - ny + dy)} ${r1(rx - nx)},${r1(ry - ny + dy)} ${r1(rx + nx)},${r1(ry + ny + dy)} ${r1(lx + nx)},${r1(ly + ny + dy)}" fill="${fill}"/>`;
  };
  s += beam(5, shade(c.color, 0.4));
  s += beam(0, `url(#${u}b)`);
  // ağırlık küreleri
  const rad = (v: number) => 12 + (v / 100) * 26;
  s += sphere(`${u}l`, lx, ly - rad(lv) - 4, rad(lv), tint(c.color, 0.15));
  s += sphere(`${u}r`, rx, ry - rad(rv) - 4, rad(rv), shade(c.color, 0.05));
  s += text(lx, ly - 2 * rad(lv) - 14, pctText(lv), { size: 13, anchor: 'middle', weight: 'bold', color: shade(c.color, 0.2) });
  s += text(rx, ry - 2 * rad(rv) - 14, pctText(rv), { size: 13, anchor: 'middle', weight: 'bold', color: shade(c.color, 0.2) });
  s += text(lx, pivotY + 44, c.left.label, { size: 12, anchor: 'middle', weight: 'bold' });
  s += text(rx, pivotY + 44, c.right.label, { size: 12, anchor: 'middle', weight: 'bold' });
  return s + '</svg>';
}

// ── Hız göstergesi (okuma) ──────────────────────────────────

function speedo(c: Extract<ChartSpec, { kind: 'speedo' }>): string {
  const u = nextUid();
  const W = 520;
  const H = 220;
  const cx = 170;
  const cy = 160;
  const R = 118;
  const rin = 84;
  const v = Math.max(0, Math.min(c.max, c.value));
  const angOf = (x: number) => Math.PI + (x / c.max) * Math.PI;
  let s = svgOpen(W, H);
  s += `<defs><linearGradient id="${u}a" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${tint(c.color, 0.6)}"/><stop offset="1" stop-color="${shade(c.color, 0.1)}"/></linearGradient></defs>`;
  s += `<path d="${arcPath(cx, cy + 6, R, rin, Math.PI, Math.PI * 2)}" fill="#D1D5DB"/>`;
  s += `<path d="${arcPath(cx, cy, R, rin, Math.PI, Math.PI * 2)}" fill="#F3F4F6"/>`;
  if (v > 0) {
    s += `<path d="${arcPath(cx, cy + 5, R, rin, Math.PI, angOf(v))}" fill="${shade(c.color, 0.35)}"/>`;
    s += `<path d="${arcPath(cx, cy, R, rin, Math.PI, angOf(v))}" fill="url(#${u}a)"/>`;
  }
  for (let k = 0; k <= 4; k++) {
    const val = (c.max * k) / 4;
    const a = angOf(val);
    s += text(cx + Math.cos(a) * (R + 14), cy + Math.sin(a) * (R + 14) + 3, String(Math.round(val)), { size: 9, anchor: 'middle', color: MUTED });
  }
  s += text(cx, cy - 18, String(Math.round(c.value)), { size: 26, anchor: 'middle', weight: 'bold', color: shade(c.color, 0.2) });
  s += text(cx, cy + 2, c.unit, { size: 11, anchor: 'middle', color: MUTED });
  if (c.secondary) {
    // ikinci gösterge: anlama halkası
    const cx2 = 410;
    const cy2 = 112;
    const R2 = 62;
    const r2 = 44;
    const p = clampPct(c.secondary.value);
    s += `<path d="${arcPath(cx2, cy2 + 5, R2, r2, -Math.PI / 2, Math.PI * 1.5 - 0.0001)}" fill="#D1D5DB"/>`;
    s += `<path d="${arcPath(cx2, cy2, R2, r2, -Math.PI / 2, Math.PI * 1.5 - 0.0001)}" fill="#F3F4F6"/>`;
    if (p > 0.5) {
      s += `<path d="${arcPath(cx2, cy2 + 4, R2, r2, -Math.PI / 2, -Math.PI / 2 + (p / 100) * Math.PI * 2 - 0.0001)}" fill="${shade(c.color, 0.35)}"/>`;
      s += `<path d="${arcPath(cx2, cy2, R2, r2, -Math.PI / 2, -Math.PI / 2 + (p / 100) * Math.PI * 2 - 0.0001)}" fill="url(#${u}a)"/>`;
    }
    s += text(cx2, cy2 + 2, pctText(p), { size: 18, anchor: 'middle', weight: 'bold', color: shade(c.color, 0.2) });
    s += text(cx2, cy2 + R2 + 26, c.secondary.label, { size: 12, anchor: 'middle', weight: 'bold' });
  }
  return s + '</svg>';
}

/** Grafik tanımını SVG metnine çevirir. */
export function renderChartSvg(chart: ChartSpec): string {
  switch (chart.kind) {
    case 'columns3d':
      return columns3d(chart);
    case 'hbars3d':
      return hbars3d(chart);
    case 'radar':
      return radar(chart);
    case 'hexagon':
      return hexagon(chart);
    case 'ring':
      return ring(chart);
    case 'gauge':
      return gauge(chart);
    case 'enneagram':
      return enneagram(chart);
    case 'line':
      return line(chart);
    case 'balance':
      return balance(chart);
    case 'speedo':
      return speedo(chart);
    default:
      return '';
  }
}

/** SVG'nin viewBox ölçüsü (PDF'te en-boy oranını korumak için). */
export function svgSize(svg: string): { w: number; h: number } {
  const m = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  return m ? { w: Number(m[1]), h: Number(m[2]) } : { w: 520, h: 260 };
}

export type { ChartPoint };
