'use client';

/**
 * Infografik Blok Render Bileşeni — FAZ 2C
 *
 * parseReport() tarafından çıkartılmış InfographicBlock nesnelerini
 * audience temasına uygun React elemanlarına çevirir.
 */

import React from 'react';
import {
  Brain, Target, Award, TrendingUp, AlertTriangle, CheckCircle2,
  Zap, BookOpen, Heart, Star, Compass, Activity, Lightbulb,
  Shield, Sparkles, Users, Eye, Ear, HandMetal,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import type {
  InfographicBlock,
  StatBlock,
  RingBlock,
  InsightBlock,
  BarsBlock,
  CompareBlock,
  ChainBlock,
  TimelineBlock,
  QuadrantBlock,
  DonutBlock,
  HeatmapBlock,
  RadarBlock,
  GaugeBlock,
  GridBlock,
  InfographicAudience,
  AudiencePalette,
  InsightType,
} from '@/lib/report/infographic-blocks';
import {
  AUDIENCE_PALETTES,
  resolveStatColor,
  resolveInsightColor,
  insightLabel,
} from '@/lib/report/infographic-blocks';

// ─── Icon registry — AI prompt'unda bu ikon adları kullanılabilir ────────────
const ICON_MAP: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  brain: Brain,
  target: Target,
  award: Award,
  trending: TrendingUp,
  warning: AlertTriangle,
  check: CheckCircle2,
  zap: Zap,
  book: BookOpen,
  heart: Heart,
  star: Star,
  compass: Compass,
  activity: Activity,
  lightbulb: Lightbulb,
  shield: Shield,
  sparkles: Sparkles,
  users: Users,
  eye: Eye,          // görsel öğrenme için
  ear: Ear,          // işitsel öğrenme için
  hand: HandMetal,   // kinestetik öğrenme için
};

function pickIcon(name?: string) {
  if (!name) return Sparkles;
  return ICON_MAP[name.toLowerCase()] ?? Sparkles;
}

// ─── Insight ikonu (tipine göre) ─────────────────────────────────────────────
function insightIcon(type: InsightType) {
  switch (type) {
    case 'strength':
      return CheckCircle2;
    case 'risk':
      return AlertTriangle;
    case 'action':
      return Target;
    case 'note':
    default:
      return Lightbulb;
  }
}

// ─── StatCard ────────────────────────────────────────────────────────────────
function StatCard({ block, palette }: { block: StatBlock; palette: AudiencePalette }) {
  const color = resolveStatColor(palette, block.theme);
  const Icon = pickIcon(block.icon);

  return (
    <div
      className="relative overflow-hidden rounded-2xl border bg-white shadow-sm hover:shadow-md transition-shadow p-5"
      style={{ borderColor: color + '33' }}
    >
      {/* Dekoratif arka plan */}
      <div
        aria-hidden
        className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10"
        style={{ backgroundColor: color }}
      />
      <div className="relative flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: color + '1a', color }}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
            {block.label}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold tabular-nums" style={{ color }}>
              {block.value}
            </span>
            {block.unit && (
              <span className="text-base font-semibold text-gray-500">{block.unit}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ScoreRing (SVG circular progress) ───────────────────────────────────────
function ScoreRing({ block, palette }: { block: RingBlock; palette: AudiencePalette }) {
  const pct = Math.round((block.value / block.max) * 100);
  const size = 140;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  // Renk: skor yüksek → başarı, orta → primary, düşük → uyarı
  const color =
    pct >= 70 ? palette.success : pct >= 40 ? palette.primary : palette.warning;

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold tabular-nums" style={{ color }}>
            {pct}
          </span>
          <span className="text-xs font-medium text-gray-500">
            {block.value}/{block.max}
          </span>
        </div>
      </div>
      <div className="mt-3 text-center">
        <div className="text-sm font-bold text-gray-800">{block.label}</div>
        {block.caption && (
          <div className="text-[11px] text-gray-500 mt-0.5">{block.caption}</div>
        )}
      </div>
    </div>
  );
}

// ─── InsightCard ─────────────────────────────────────────────────────────────
function InsightCard({
  block,
  palette,
}: {
  block: InsightBlock;
  palette: AudiencePalette;
}) {
  const color = resolveInsightColor(palette, block.type);
  const Icon = insightIcon(block.type);
  const badge = insightLabel(block.type);

  return (
    <div
      className="my-4 rounded-2xl border-l-4 bg-white shadow-sm p-4 pl-5"
      style={{ borderLeftColor: color, backgroundColor: color + '08' }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{ backgroundColor: color + '1a', color }}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
              style={{ backgroundColor: color + '1a', color }}
            >
              {badge}
            </span>
            {block.title && (
              <span className="text-sm font-bold text-gray-800">{block.title}</span>
            )}
          </div>
          <div className="text-[14px] text-gray-700 leading-relaxed whitespace-pre-wrap">
            {block.content}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── BarBlock (Recharts yatay bar) ───────────────────────────────────────────
function BarBlock({ block, palette }: { block: BarsBlock; palette: AudiencePalette }) {
  const maxVal = Math.max(
    ...block.items.map((i) => i.max ?? 100),
    ...block.items.map((i) => i.value)
  );
  const data = block.items.map((i) => ({
    label: i.label,
    value: i.value,
    max: i.max ?? maxVal,
  }));

  // Renk paleti: primary → secondary → accent döngüsü
  const colors = [palette.primary, palette.secondary, palette.accent, palette.info];

  return (
    <div className="my-4 rounded-2xl border border-gray-100 bg-white shadow-sm p-4">
      {block.title && (
        <h4 className="text-sm font-bold text-gray-800 mb-3">{block.title}</h4>
      )}
      <div style={{ width: '100%', height: Math.max(180, data.length * 38) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 48, bottom: 4, left: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, maxVal]}
              tick={{ fontSize: 11, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={120}
              tick={{ fontSize: 12, fill: '#374151', fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                fontSize: 12,
              }}
              cursor={{ fill: '#f9fafb' }}
            />
            <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={22}>
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
              <LabelList
                dataKey="value"
                position="right"
                style={{ fontSize: 12, fontWeight: 700, fill: '#374151' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Grid wrapper ────────────────────────────────────────────────────────────
function GridOfStats({ block, palette }: { block: GridBlock; palette: AudiencePalette }) {
  const colsClass =
    block.cols === 4
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
      : block.cols === 3
      ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
      : 'grid-cols-1 sm:grid-cols-2';

  return (
    <div className={`my-4 grid gap-3 ${colsClass}`}>
      {block.children.map((stat, i) => (
        <StatCard key={i} block={stat} palette={palette} />
      ))}
    </div>
  );
}

// ─── RadarBlock (Recharts radar chart) ───────────────────────────────────────
function RadarChartBlock({ block, palette }: { block: RadarBlock; palette: AudiencePalette }) {
  // Tüm noktalar için ortak max — radar doğru ölçeklensin
  const globalMax = Math.max(
    ...block.items.map((i) => i.max ?? 100),
    ...block.items.map((i) => i.value),
  );

  const data = block.items.map((i) => ({
    label: i.label,
    value: i.value,
    fullMark: globalMax,
  }));

  return (
    <div className="my-4 rounded-2xl border border-gray-100 bg-white shadow-sm p-4">
      {block.title && (
        <h4 className="text-sm font-bold text-gray-800 mb-2 text-center">{block.title}</h4>
      )}
      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="78%">
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#374151', fontWeight: 600 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, globalMax]}
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              axisLine={false}
            />
            <Radar
              name="Skor"
              dataKey="value"
              stroke={palette.primary}
              fill={palette.primary}
              fillOpacity={0.35}
              strokeWidth={2}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                fontSize: 12,
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── GaugeBlock (custom SVG yarım daire) ─────────────────────────────────────
function GaugeChart({ block, palette }: { block: GaugeBlock; palette: AudiencePalette }) {
  const { value, max } = block;
  const ratio = Math.max(0, Math.min(1, value / max));

  // Default zone'ları üret: 3 eşit dilim
  const zones = block.zones && block.zones.length > 0
    ? block.zones
    : [
        { label: 'Düşük', from: 0, to: max * 0.4 },
        { label: 'Orta', from: max * 0.4, to: max * 0.7 },
        { label: 'Yüksek', from: max * 0.7, to: max },
      ];

  // SVG koordinatları — yarım daire
  const W = 280;
  const H = 170;
  const cx = W / 2;
  const cy = H - 20;
  const r = 110;
  const strokeWidth = 22;

  // Zone renkleri (tema uyumlu varsayılan)
  const zoneColors = ['#10b981', '#f59e0b', '#ef4444', '#6366f1'];

  // Yarım daire üzerinde bir oran (0..1) için (x,y) — 0=sol, 1=sağ
  const polarToXY = (t: number) => {
    const angle = Math.PI - t * Math.PI; // π → 0
    return {
      x: cx + r * Math.cos(angle),
      y: cy - r * Math.sin(angle),
    };
  };

  // Arc path — yarım daire üzerinde t1 → t2 arası bir yay
  const arcPath = (t1: number, t2: number) => {
    const p1 = polarToXY(t1);
    const p2 = polarToXY(t2);
    const largeArc = t2 - t1 > 0.5 ? 1 : 0;
    return `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${largeArc} 1 ${p2.x} ${p2.y}`;
  };

  // İğne pozisyonu
  const needleAngle = Math.PI - ratio * Math.PI;
  const needleLen = r - 8;
  const needleEnd = {
    x: cx + needleLen * Math.cos(needleAngle),
    y: cy - needleLen * Math.sin(needleAngle),
  };

  // Zone konum & rengi belirle
  const aktifZone = zones.find((z) => value >= z.from && value <= z.to) ?? zones[zones.length - 1];

  return (
    <div className="my-4 rounded-2xl border border-gray-100 bg-white shadow-sm p-4 flex flex-col items-center">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
        {block.label}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 320 }}>
        {/* Arka zemin yayı (gri) */}
        <path
          d={arcPath(0, 1)}
          fill="none"
          stroke="#f3f4f6"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Renkli zone yayları */}
        {zones.map((z, i) => {
          const t1 = z.from / max;
          const t2 = z.to / max;
          return (
            <path
              key={i}
              d={arcPath(t1, t2)}
              fill="none"
              stroke={zoneColors[i % zoneColors.length]}
              strokeWidth={strokeWidth}
              strokeOpacity={value >= z.from && value <= z.to ? 1 : 0.35}
            />
          );
        })}
        {/* Zone label'ları */}
        {zones.map((z, i) => {
          const tMid = ((z.from + z.to) / 2) / max;
          const labelR = r + 18;
          const labelAngle = Math.PI - tMid * Math.PI;
          const lx = cx + labelR * Math.cos(labelAngle);
          const ly = cy - labelR * Math.sin(labelAngle);
          return (
            <text
              key={i}
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="9"
              fontWeight="600"
              fill="#6b7280"
            >
              {z.label}
            </text>
          );
        })}
        {/* İğne */}
        <line
          x1={cx}
          y1={cy}
          x2={needleEnd.x}
          y2={needleEnd.y}
          stroke={palette.primary}
          strokeWidth={3}
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={6} fill={palette.primary} />
        {/* Değer */}
        <text
          x={cx}
          y={cy - 35}
          textAnchor="middle"
          fontSize="28"
          fontWeight="800"
          fill="#111827"
        >
          {value}
        </text>
        <text
          x={cx}
          y={cy - 18}
          textAnchor="middle"
          fontSize="10"
          fill="#9ca3af"
        >
          / {max}
        </text>
      </svg>
      <div
        className="text-[11px] font-bold uppercase tracking-wide mt-1"
        style={{ color: zoneColors[zones.indexOf(aktifZone) % zoneColors.length] }}
      >
        {aktifZone.label}
      </div>
      {block.caption && (
        <div className="text-[11px] text-gray-500 italic text-center mt-1">{block.caption}</div>
      )}
    </div>
  );
}

// ─── Ana render dispatcher ───────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════
// FAZ 0 — Derinleştirilmiş rapor blokları
// ═══════════════════════════════════════════════════════════════════════════

/** Öğrenci ↔ referans karşılaştırması (gruplu yatay bar). */
function CompareBars({ block, palette }: { block: CompareBlock; palette: AudiencePalette }) {
  const data = block.items.map((i) => ({
    label: i.label,
    [block.selfLabel]: i.self,
    [block.refLabel]: i.ref,
    delta: Math.round((i.self - i.ref) * 10) / 10,
  }));
  return (
    <div className="my-4 rounded-2xl border border-gray-100 bg-white shadow-sm p-4">
      {block.title && <h4 className="text-sm font-bold text-gray-800 mb-1">{block.title}</h4>}
      <p className="text-[11px] text-gray-500 mb-3">
        Koyu çubuk {block.selfLabel.toLocaleLowerCase('tr')}, açık çubuk {block.refLabel.toLocaleLowerCase('tr')}.
      </p>
      <div style={{ width: '100%', height: Math.max(190, data.length * 46) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 28, left: 4, bottom: 4 }} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis type="category" dataKey="label" width={128} tick={{ fontSize: 11, fill: '#334155' }} />
            <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ fontSize: 12, borderRadius: 10 }} />
            <Bar dataKey={block.selfLabel} fill={palette.primary} radius={[0, 5, 5, 0]} barSize={13}>
              <LabelList dataKey={block.selfLabel} position="right" style={{ fontSize: 10, fill: '#334155' }} />
            </Bar>
            <Bar dataKey={block.refLabel} fill="#cbd5e1" radius={[0, 5, 5, 0]} barSize={13} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {data.map((d) => (
          <span
            key={d.label}
            className="text-[11px] px-2 py-0.5 rounded-full font-medium"
            style={{
              background: d.delta >= 0 ? `${palette.primary}14` : '#fee2e2',
              color: d.delta >= 0 ? palette.primary : '#b91c1c',
            }}
          >
            {d.label}: {d.delta >= 0 ? '+' : ''}{d.delta}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Neden → Etki → Sonuç zinciri. */
function ChainFlow({ block, palette }: { block: ChainBlock; palette: AudiencePalette }) {
  const cols: { key: 'cause' | 'effect' | 'result'; head: string; color: string; bg: string }[] = [
    { key: 'cause', head: 'NEDEN', color: '#475569', bg: '#f1f5f9' },
    { key: 'effect', head: 'NİÇİN / ETKİ', color: palette.info, bg: `${palette.info}12` },
    { key: 'result', head: 'SONUÇ', color: palette.primary, bg: `${palette.primary}12` },
  ];
  return (
    <div className="my-4 rounded-2xl border border-gray-100 bg-white shadow-sm p-4">
      {block.title && <h4 className="text-sm font-bold text-gray-800 mb-3">{block.title}</h4>}
      <div className="space-y-3">
        {block.links.map((l, i) => (
          <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr_auto_1fr] gap-2 items-stretch">
            {cols.map((c, ci) => (
              <React.Fragment key={c.key}>
                <div className="rounded-xl px-3 py-2" style={{ background: c.bg }}>
                  <div className="text-[10px] font-bold tracking-wide mb-0.5" style={{ color: c.color }}>{c.head}</div>
                  <div className="text-xs text-gray-700 leading-snug">{l[c.key]}</div>
                </div>
                {ci < 2 && (
                  <div className="hidden sm:flex items-center justify-center text-gray-300 font-bold">→</div>
                )}
              </React.Fragment>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Sıralı yol haritası. */
function TimelineSteps({ block, palette }: { block: TimelineBlock; palette: AudiencePalette }) {
  return (
    <div className="my-4 rounded-2xl border border-gray-100 bg-white shadow-sm p-4">
      {block.title && <h4 className="text-sm font-bold text-gray-800 mb-3">{block.title}</h4>}
      <ol className="relative border-l-2 pl-5 space-y-4" style={{ borderColor: `${palette.primary}33` }}>
        {block.steps.map((s, i) => (
          <li key={i} className="relative">
            <span
              className="absolute -left-[27px] flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
              style={{ background: palette.primary }}
            >
              {i + 1}
            </span>
            <div className="text-sm font-semibold text-gray-800">{s.title}</div>
            {s.detail && <div className="text-xs text-gray-600 mt-0.5 leading-relaxed">{s.detail}</div>}
            {s.tag && (
              <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{ background: `${palette.secondary}18`, color: palette.secondary }}>
                {s.tag}
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

/** İki eksende konumlandırma. */
function QuadrantPlot({ block, palette }: { block: QuadrantBlock; palette: AudiencePalette }) {
  const S = 260, pad = 34;
  const px = pad + (block.x / 100) * (S - 2 * pad);
  const py = S - pad - (block.y / 100) * (S - 2 * pad);
  const labels = [
    { t: block.quadrants[0], x: pad + (S - 2 * pad) * 0.25, y: S - pad - (S - 2 * pad) * 0.25 },
    { t: block.quadrants[1], x: pad + (S - 2 * pad) * 0.75, y: S - pad - (S - 2 * pad) * 0.25 },
    { t: block.quadrants[2], x: pad + (S - 2 * pad) * 0.25, y: S - pad - (S - 2 * pad) * 0.75 },
    { t: block.quadrants[3], x: pad + (S - 2 * pad) * 0.75, y: S - pad - (S - 2 * pad) * 0.75 },
  ];
  return (
    <div className="my-4 rounded-2xl border border-gray-100 bg-white shadow-sm p-4">
      {block.title && <h4 className="text-sm font-bold text-gray-800 mb-2">{block.title}</h4>}
      <svg viewBox={`0 0 ${S} ${S}`} width="100%" style={{ maxWidth: 320 }}>
        <rect x={pad} y={pad} width={S - 2 * pad} height={S - 2 * pad} fill="#f8fafc" rx="10" />
        <line x1={S / 2} y1={pad} x2={S / 2} y2={S - pad} stroke="#e2e8f0" strokeWidth="1.5" />
        <line x1={pad} y1={S / 2} x2={S - pad} y2={S / 2} stroke="#e2e8f0" strokeWidth="1.5" />
        {labels.map((l, i) =>
          l.t ? (
            <text key={i} x={l.x} y={l.y} textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="600">
              {l.t.length > 18 ? l.t.slice(0, 17) + '…' : l.t}
            </text>
          ) : null
        )}
        <circle cx={px} cy={py} r="9" fill={palette.primary} opacity="0.22" />
        <circle cx={px} cy={py} r="5" fill={palette.primary} />
        <text x={S / 2} y={S - 8} textAnchor="middle" fontSize="10" fill="#475569" fontWeight="600">{block.xLabel} →</text>
        <text x={11} y={S / 2} textAnchor="middle" fontSize="10" fill="#475569" fontWeight="600"
          transform={`rotate(-90 11 ${S / 2})`}>{block.yLabel} →</text>
      </svg>
      {block.caption && <p className="text-[11px] text-gray-500 mt-1">{block.caption}</p>}
    </div>
  );
}

/** Parça-bütün halka grafiği. */
function DonutChart({ block, palette }: { block: DonutBlock; palette: AudiencePalette }) {
  const total = block.items.reduce((a, b) => a + b.value, 0) || 1;
  const colors = [palette.primary, palette.secondary, palette.info, palette.warning, palette.accent, '#94a3b8'];
  const S = 190, R = 74, r = 46, cx = S / 2, cy = S / 2;
  let acc = 0;
  const arcs = block.items.map((it, i) => {
    const frac = it.value / total;
    const a0 = acc * 2 * Math.PI - Math.PI / 2;
    acc += frac;
    const a1 = acc * 2 * Math.PI - Math.PI / 2;
    const large = frac > 0.5 ? 1 : 0;
    const d = [
      `M ${cx + R * Math.cos(a0)} ${cy + R * Math.sin(a0)}`,
      `A ${R} ${R} 0 ${large} 1 ${cx + R * Math.cos(a1)} ${cy + R * Math.sin(a1)}`,
      `L ${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)}`,
      `A ${r} ${r} 0 ${large} 0 ${cx + r * Math.cos(a0)} ${cy + r * Math.sin(a0)}`,
      'Z',
    ].join(' ');
    return { d, color: colors[i % colors.length], label: it.label, pct: Math.round(frac * 100) };
  });
  return (
    <div className="my-4 rounded-2xl border border-gray-100 bg-white shadow-sm p-4">
      {block.title && <h4 className="text-sm font-bold text-gray-800 mb-2">{block.title}</h4>}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <svg viewBox={`0 0 ${S} ${S}`} width={S} height={S} style={{ flexShrink: 0 }}>
          {arcs.map((a, i) => <path key={i} d={a.d} fill={a.color} />)}
          {block.centerLabel && (
            <text x={cx} y={cy + 4} textAnchor="middle" fontSize="13" fontWeight="700" fill="#334155">
              {block.centerLabel}
            </text>
          )}
        </svg>
        <ul className="space-y-1.5 w-full">
          {arcs.map((a, i) => (
            <li key={i} className="flex items-center gap-2 text-xs text-gray-700">
              <span className="inline-block w-3 h-3 rounded-sm" style={{ background: a.color }} />
              <span className="flex-1">{a.label}</span>
              <span className="font-semibold text-gray-800">%{a.pct}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Satır × sütun yoğunluk matrisi. */
function HeatmapGrid({ block, palette }: { block: HeatmapBlock; palette: AudiencePalette }) {
  const shade = (v: number) => {
    const t = Math.max(0, Math.min(100, v)) / 100;
    return { background: `${palette.primary}${Math.round(12 + t * 220).toString(16).padStart(2, '0')}`, color: t > 0.55 ? '#fff' : '#334155' };
  };
  return (
    <div className="my-4 rounded-2xl border border-gray-100 bg-white shadow-sm p-4 overflow-x-auto">
      {block.title && <h4 className="text-sm font-bold text-gray-800 mb-3">{block.title}</h4>}
      <table className="w-full border-separate" style={{ borderSpacing: 3 }}>
        <thead>
          <tr>
            <th className="text-left text-[11px] font-semibold text-gray-500 pr-2" />
            {block.cols.map((c) => (
              <th key={c} className="text-[11px] font-semibold text-gray-500 px-1 pb-1 text-center">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((r) => (
            <tr key={r.label}>
              <td className="text-xs text-gray-700 pr-2 whitespace-nowrap font-medium">{r.label}</td>
              {r.values.map((v, i) => (
                <td key={i} className="text-center text-[11px] font-bold rounded-md py-2 px-1 min-w-[42px]" style={shade(v)}>
                  {Math.round(v)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {block.caption && <p className="text-[11px] text-gray-500 mt-2">{block.caption}</p>}
    </div>
  );
}

export default function InfographicBlockRenderer({
  block,
  audience = 'ogretmen',
}: {
  block: InfographicBlock;
  audience?: InfographicAudience;
}) {
  const palette = AUDIENCE_PALETTES[audience] ?? AUDIENCE_PALETTES.ogretmen;

  switch (block.kind) {
    case 'stat':
      return (
        <div className="my-3">
          <StatCard block={block} palette={palette} />
        </div>
      );
    case 'ring':
      return (
        <div className="my-3 flex justify-center sm:justify-start">
          <ScoreRing block={block} palette={palette} />
        </div>
      );
    case 'insight':
      return <InsightCard block={block} palette={palette} />;
    case 'bars':
      return <BarBlock block={block} palette={palette} />;
    case 'radar':
      return <RadarChartBlock block={block} palette={palette} />;
    case 'gauge':
      return (
        <div className="my-3 flex justify-center sm:justify-start">
          <GaugeChart block={block} palette={palette} />
        </div>
      );
    case 'grid':
      return <GridOfStats block={block} palette={palette} />;
    case 'compare':
      return <CompareBars block={block} palette={palette} />;
    case 'chain':
      return <ChainFlow block={block} palette={palette} />;
    case 'timeline':
      return <TimelineSteps block={block} palette={palette} />;
    case 'quadrant':
      return (
        <div className="my-3 flex justify-center sm:justify-start">
          <QuadrantPlot block={block} palette={palette} />
        </div>
      );
    case 'donut':
      return <DonutChart block={block} palette={palette} />;
    case 'heatmap':
      return <HeatmapGrid block={block} palette={palette} />;
    default: {
      const _exhaustive: never = block;
      void _exhaustive;
      return null;
    }
  }
}

export { StatCard, ScoreRing, InsightCard, BarBlock, RadarChartBlock, GaugeChart, GridOfStats,
  CompareBars, ChainFlow, TimelineSteps, QuadrantPlot, DonutChart, HeatmapGrid };
