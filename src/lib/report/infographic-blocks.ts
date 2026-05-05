/**
 * Infografik Blok Parser — FAZ 2C
 *
 * Claude tarafından üretilen rapor metninde şu blokları tanır ve parse eder:
 *
 *   [!stat label="..." value="72" unit="%" icon="brain" theme="primary"]
 *   [!ring label="..." value="65" max="100"]
 *   [!insight type="strength|risk|action|note" title="..."]
 *     içerik
 *   [/!insight]
 *   [!bars title="..."]
 *     Label 1: 70
 *     Label 2: 45
 *   [/!bars]
 *   [!grid cols="2"]
 *     [!stat ...]
 *     [!stat ...]
 *   [/!grid]
 *
 * Tüm render yolları (Web/PDF/DOCX) bu parser çıktısını tüketir — böylece
 * üç yüzey arasında görsel tutarlılık garanti altında.
 *
 * Hata toleranslı: Hatalı bloklar atlanır (düz metin olarak render edilir).
 */

export type InfographicAudience = 'ogretmen' | 'ogrenci' | 'ebeveyn';

export type InsightType = 'strength' | 'risk' | 'action' | 'note';

export interface StatBlock {
  kind: 'stat';
  label: string;
  value: string;
  unit?: string;
  icon?: string;
  theme?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

export interface RingBlock {
  kind: 'ring';
  label: string;
  value: number;
  max: number;
  caption?: string;
}

export interface InsightBlock {
  kind: 'insight';
  type: InsightType;
  title: string;
  content: string; // Raw content (markdown-lite inline supported downstream)
}

export interface BarsBlock {
  kind: 'bars';
  title?: string;
  items: { label: string; value: number; max?: number }[];
}

export interface RadarBlock {
  kind: 'radar';
  title?: string;
  /** En az 3 nokta gerekir; daha azsa bars'a düşer (parser kararı) */
  items: { label: string; value: number; max?: number }[];
}

export interface GaugeZone {
  label: string;
  from: number;
  to: number;
  /** İsteğe bağlı zone rengi/teması — varsayılan from konumuna göre */
  theme?: 'success' | 'warning' | 'danger' | 'info';
}

export interface GaugeBlock {
  kind: 'gauge';
  label: string;
  value: number;
  max: number;
  /** Renkli kuşaklar (örn. düşük/orta/yüksek). Verilmezse 3 eşit dilim üretilir. */
  zones?: GaugeZone[];
  caption?: string;
}

export interface GridBlock {
  kind: 'grid';
  cols: 2 | 3 | 4;
  children: StatBlock[]; // Grid yalnızca stat bloklarını içerir (v1)
}

export type InfographicBlock =
  | StatBlock
  | RingBlock
  | InsightBlock
  | BarsBlock
  | RadarBlock
  | GaugeBlock
  | GridBlock;

/** Parse sonucunda metin parçaları (string) ile bloklar sıralı dönüyor. */
export type ReportSegment =
  | { kind: 'text'; text: string }
  | { kind: 'block'; block: InfographicBlock };

// ─── Attribute Parser ────────────────────────────────────────────────────────
/**
 * `label="abc" value="72"` tarzında tek satırlık attribute dizgesinden
 * key/value çıkarır. `=` olmayan veya quote'suz değerler atlanır.
 */
function parseAttrs(attrStr: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  // Desteklenen biçim: key="value" veya key='value'
  const re = /(\w+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(attrStr)) !== null) {
    const key = m[1];
    const val = m[2] ?? m[3] ?? '';
    attrs[key] = val;
  }
  return attrs;
}

// ─── Single-line stat / ring ─────────────────────────────────────────────────
function parseStat(attrStr: string): StatBlock | null {
  const a = parseAttrs(attrStr);
  if (!a.label || !a.value) return null;
  const theme = a.theme as StatBlock['theme'];
  return {
    kind: 'stat',
    label: a.label,
    value: a.value,
    unit: a.unit,
    icon: a.icon,
    theme: ['primary', 'success', 'warning', 'danger', 'info'].includes(theme as string)
      ? theme
      : 'primary',
  };
}

function parseRing(attrStr: string): RingBlock | null {
  const a = parseAttrs(attrStr);
  if (!a.label || !a.value) return null;
  const value = Number(a.value);
  const max = Number(a.max ?? '100');
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return null;
  return {
    kind: 'ring',
    label: a.label,
    value: Math.max(0, Math.min(max, value)),
    max,
    caption: a.caption,
  };
}

// ─── Multi-line blocks: insight / bars / grid ────────────────────────────────
function parseInsight(attrStr: string, body: string): InsightBlock | null {
  const a = parseAttrs(attrStr);
  const type = (a.type ?? 'note') as InsightType;
  if (!['strength', 'risk', 'action', 'note'].includes(type)) return null;
  return {
    kind: 'insight',
    type,
    title: a.title ?? '',
    content: body.trim(),
  };
}

function parseBars(attrStr: string, body: string): BarsBlock | null {
  const a = parseAttrs(attrStr);
  const items: BarsBlock['items'] = [];
  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    // "Label: 70" veya "Label: 70/100"
    const m = line.match(/^(.+?):\s*(\d+(?:\.\d+)?)\s*(?:\/\s*(\d+(?:\.\d+)?))?$/);
    if (!m) continue;
    const label = m[1].trim();
    const value = Number(m[2]);
    const max = m[3] ? Number(m[3]) : undefined;
    if (!Number.isFinite(value)) continue;
    items.push({ label, value, ...(max !== undefined ? { max } : {}) });
  }
  if (items.length === 0) return null;
  return { kind: 'bars', title: a.title, items };
}

function parseGrid(attrStr: string, body: string): GridBlock | null {
  const a = parseAttrs(attrStr);
  let cols = Number(a.cols ?? '2');
  if (![2, 3, 4].includes(cols)) cols = 2;

  // Grid içindeki stat bloklarını parse et
  const children: StatBlock[] = [];
  const statRe = /\[!stat\s+([^\]]+)\]/g;
  let m: RegExpExecArray | null;
  while ((m = statRe.exec(body)) !== null) {
    const stat = parseStat(m[1]);
    if (stat) children.push(stat);
  }
  if (children.length === 0) return null;
  return { kind: 'grid', cols: cols as 2 | 3 | 4, children };
}

// ─── Radar (multi-line, bars-benzeri) ────────────────────────────────────────
function parseRadar(attrStr: string, body: string): RadarBlock | null {
  const a = parseAttrs(attrStr);
  const items: RadarBlock['items'] = [];
  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const m = line.match(/^(.+?):\s*(\d+(?:\.\d+)?)\s*(?:\/\s*(\d+(?:\.\d+)?))?$/);
    if (!m) continue;
    const label = m[1].trim();
    const value = Number(m[2]);
    const max = m[3] ? Number(m[3]) : undefined;
    if (!Number.isFinite(value)) continue;
    items.push({ label, value, ...(max !== undefined ? { max } : {}) });
  }
  // Radar'ın anlamlı olabilmesi için 3+ noktaya ihtiyaç var
  if (items.length < 3) return null;
  return { kind: 'radar', title: a.title, items };
}

// ─── Gauge (single-line, ring-benzeri) ───────────────────────────────────────
function parseGauge(attrStr: string): GaugeBlock | null {
  const a = parseAttrs(attrStr);
  if (!a.label || !a.value) return null;
  const value = Number(a.value);
  const max = Number(a.max ?? '100');
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return null;

  // zones="düşük:0-40,orta:40-70,yüksek:70-100"
  let zones: GaugeZone[] | undefined;
  if (a.zones) {
    const parts = a.zones.split(',').map((s) => s.trim());
    const parsed: GaugeZone[] = [];
    for (const p of parts) {
      const m = p.match(/^([^:]+):\s*(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)$/);
      if (!m) continue;
      const from = Number(m[2]);
      const to = Number(m[3]);
      if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) continue;
      parsed.push({ label: m[1].trim(), from, to });
    }
    if (parsed.length > 0) zones = parsed;
  }

  return {
    kind: 'gauge',
    label: a.label,
    value: Math.max(0, Math.min(max, value)),
    max,
    zones,
    caption: a.caption,
  };
}

// ─── Main parser: raporu segmentlere ayırır ──────────────────────────────────
/**
 * Rapor metnini metin parçaları ve blok nesnelerine ayırır.
 * Single-line bloklar: [!stat ...], [!ring ...]
 * Multi-line bloklar: [!insight ...]...[/!insight], [!bars ...]...[/!bars], [!grid ...]...[/!grid]
 */
export function parseReport(text: string): ReportSegment[] {
  if (!text) return [];
  const segments: ReportSegment[] = [];

  // Tüm blok eşleşmelerini (pozisyonlarıyla) topla, sonra sırala.
  interface Match {
    start: number;
    end: number;
    block: InfographicBlock | null;
  }
  const matches: Match[] = [];

  // Multi-line: [!insight]...[/!insight], [!bars]...[/!bars], [!grid]...[/!grid], [!radar]...[/!radar]
  const multilineTags = ['insight', 'bars', 'grid', 'radar'] as const;
  for (const tag of multilineTags) {
    const re = new RegExp(
      `\\[!${tag}(\\s+[^\\]]*)?\\]([\\s\\S]*?)\\[\\/!${tag}\\]`,
      'g'
    );
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const attrStr = (m[1] ?? '').trim();
      const body = m[2] ?? '';
      let block: InfographicBlock | null = null;
      if (tag === 'insight') block = parseInsight(attrStr, body);
      else if (tag === 'bars') block = parseBars(attrStr, body);
      else if (tag === 'grid') block = parseGrid(attrStr, body);
      else if (tag === 'radar') block = parseRadar(attrStr, body);
      matches.push({ start: m.index, end: m.index + m[0].length, block });
    }
  }

  // Single-line: [!stat ...], [!ring ...]
  // Grid içinde olanları hariç tut — bunu yapmak için grid başlangıç/bitişlerini
  // ayrıca takip ediyoruz.
  const gridRanges = matches
    .filter((x) => x.block?.kind === 'grid')
    .map((x) => [x.start, x.end] as [number, number]);
  const isInGrid = (pos: number) =>
    gridRanges.some(([s, e]) => pos >= s && pos < e);

  const singleTags = ['stat', 'ring', 'gauge'] as const;
  for (const tag of singleTags) {
    const re = new RegExp(`\\[!${tag}\\s+([^\\]]+)\\]`, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      if (isInGrid(m.index)) continue;
      const attrStr = m[1].trim();
      const block =
        tag === 'stat' ? parseStat(attrStr)
        : tag === 'ring' ? parseRing(attrStr)
        : parseGauge(attrStr);
      matches.push({ start: m.index, end: m.index + m[0].length, block });
    }
  }

  // Pozisyona göre sırala
  matches.sort((a, b) => a.start - b.start);

  // Metin + bloklar olarak segment üret
  let cursor = 0;
  for (const match of matches) {
    if (match.start > cursor) {
      const textPart = text.slice(cursor, match.start);
      if (textPart) segments.push({ kind: 'text', text: textPart });
    }
    if (match.block) {
      segments.push({ kind: 'block', block: match.block });
    } else {
      // Parse edilemeyen blok: ham metin olarak tut
      segments.push({ kind: 'text', text: text.slice(match.start, match.end) });
    }
    cursor = match.end;
  }
  if (cursor < text.length) {
    const rest = text.slice(cursor);
    if (rest) segments.push({ kind: 'text', text: rest });
  }

  // Boş metin segmentlerini ayıkla
  return segments.filter(
    (s) => s.kind === 'block' || (s.kind === 'text' && s.text.length > 0)
  );
}

// ─── Tema paleti — audience'a göre renk seti ─────────────────────────────────
export interface AudiencePalette {
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  insightStrength: string;
  insightRisk: string;
  insightAction: string;
  insightNote: string;
}

export const AUDIENCE_PALETTES: Record<InfographicAudience, AudiencePalette> = {
  ogretmen: {
    primary: '#10b981',       // emerald
    secondary: '#14b8a6',     // teal
    accent: '#0f2847',        // lacivert
    success: '#059669',
    warning: '#f59e0b',
    danger: '#dc2626',
    info: '#0ea5e9',
    insightStrength: '#10b981',
    insightRisk: '#dc2626',
    insightAction: '#2563eb',
    insightNote: '#6b7280',
  },
  ogrenci: {
    primary: '#8b5cf6',       // violet
    secondary: '#06b6d4',     // cyan
    accent: '#6366f1',        // indigo
    success: '#14b8a6',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#0ea5e9',
    insightStrength: '#8b5cf6',
    insightRisk: '#ef4444',
    insightAction: '#06b6d4',
    insightNote: '#6b7280',
  },
  ebeveyn: {
    primary: '#ec4899',       // pink
    secondary: '#fb923c',     // orange
    accent: '#f43f5e',        // rose
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#e11d48',
    info: '#0ea5e9',
    insightStrength: '#10b981',
    insightRisk: '#e11d48',
    insightAction: '#ec4899',
    insightNote: '#6b7280',
  },
};

/**
 * Stat tema kodundan palet rengini çöz.
 */
export function resolveStatColor(
  palette: AudiencePalette,
  theme: StatBlock['theme']
): string {
  switch (theme) {
    case 'success':
      return palette.success;
    case 'warning':
      return palette.warning;
    case 'danger':
      return palette.danger;
    case 'info':
      return palette.info;
    case 'primary':
    default:
      return palette.primary;
  }
}

/**
 * Insight tipinden palet rengi.
 */
export function resolveInsightColor(
  palette: AudiencePalette,
  type: InsightType
): string {
  switch (type) {
    case 'strength':
      return palette.insightStrength;
    case 'risk':
      return palette.insightRisk;
    case 'action':
      return palette.insightAction;
    case 'note':
    default:
      return palette.insightNote;
  }
}

/**
 * Insight tipine göre Türkçe etiket.
 */
export function insightLabel(type: InsightType): string {
  switch (type) {
    case 'strength':
      return 'Güçlü Yön';
    case 'risk':
      return 'Dikkat Edilmesi Gereken';
    case 'action':
      return 'Önerilen Aksiyon';
    case 'note':
    default:
      return 'Not';
  }
}
