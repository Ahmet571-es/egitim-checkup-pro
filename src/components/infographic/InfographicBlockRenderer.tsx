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
    default: {
      const _exhaustive: never = block;
      void _exhaustive;
      return null;
    }
  }
}

export { StatCard, ScoreRing, InsightCard, BarBlock, RadarChartBlock, GaugeChart, GridOfStats };
