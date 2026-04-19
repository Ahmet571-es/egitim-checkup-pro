'use client';

import { useMemo } from 'react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

// ── Tema tanımları ──
const THEMES = {
  ogretmen: {
    name: 'Öğretmen / Koç Raporu',
    icon: '👩‍🏫',
    gradient: 'from-[#0f2847] to-[#1a5c3a]',
    headerBg: 'bg-gradient-to-r from-[#0f2847] to-[#1a5c3a]',
    accentColor: '#10b981',
    radarStroke: '#10b981',
    radarFill: '#10b981',
    barColors: ['#0f2847', '#1a3d6e', '#10b981', '#14b8a6', '#0ea5e9', '#065f46', '#047857', '#0d9488', '#0891b2', '#0369a1'],
    sectionStyles: {
      'YÖNETİCİ ÖZETİ': { bg: 'bg-gradient-to-br from-[#0f2847] to-[#1a5c3a]', border: 'border-transparent', accent: 'text-white' },
      'TEST SONUÇ': { bg: 'bg-gradient-to-br from-emerald-50 to-teal-50', border: 'border-emerald-200', accent: 'text-emerald-800' },
      'DERİNLEMESİNE': { bg: 'bg-gradient-to-br from-sky-50 to-cyan-50', border: 'border-sky-200', accent: 'text-sky-800' },
      'GÜÇLÜ YÖN': { bg: 'bg-gradient-to-br from-emerald-50 to-green-50', border: 'border-emerald-200', accent: 'text-emerald-800' },
      'GELİŞİM ALAN': { bg: 'bg-gradient-to-br from-teal-50 to-cyan-50', border: 'border-teal-200', accent: 'text-teal-800' },
      'AKSİYON PLANI': { bg: 'bg-gradient-to-br from-blue-50 to-indigo-50', border: 'border-blue-200', accent: 'text-blue-800' },
      'STRATEJİ': { bg: 'bg-gradient-to-br from-[#0f2847]/5 to-[#1a5c3a]/5', border: 'border-[#0f2847]/20', accent: 'text-[#0f2847] dark:text-slate-100' },
      'AİLE': { bg: 'bg-gradient-to-br from-green-50 to-emerald-50', border: 'border-green-200', accent: 'text-green-800' },
      'SONUÇ': { bg: 'bg-gradient-to-br from-gray-50 to-slate-50', border: 'border-gray-200 dark:border-slate-700', accent: 'text-gray-800 dark:text-slate-200' },
    },
    cardBg: 'bg-gradient-to-br from-emerald-50/50 to-teal-50/50',
    chipBg: 'bg-emerald-100',
    chipText: 'text-emerald-700',
  },
  ogrenci: {
    name: 'Öğrenci Raporu',
    icon: '🎓',
    gradient: 'from-violet-600 to-cyan-500',
    headerBg: 'bg-gradient-to-r from-violet-600 to-cyan-500',
    accentColor: '#8b5cf6',
    radarStroke: '#8b5cf6',
    radarFill: '#8b5cf6',
    barColors: ['#8b5cf6', '#a78bfa', '#06b6d4', '#14b8a6', '#6366f1', '#7c3aed', '#0ea5e9', '#22d3ee', '#818cf8', '#c084fc'],
    sectionStyles: {
      'YÖNETİCİ ÖZETİ': { bg: 'bg-gradient-to-br from-violet-600 to-cyan-500', border: 'border-transparent', accent: 'text-white' },
      'TEST SONUÇ': { bg: 'bg-gradient-to-br from-violet-50 to-purple-50', border: 'border-violet-200', accent: 'text-violet-800' },
      'DERİNLEMESİNE': { bg: 'bg-gradient-to-br from-cyan-50 to-sky-50', border: 'border-cyan-200', accent: 'text-cyan-800' },
      'GÜÇLÜ YÖN': { bg: 'bg-gradient-to-br from-indigo-50 to-violet-50', border: 'border-indigo-200', accent: 'text-indigo-800' },
      'GELİŞİM ALAN': { bg: 'bg-gradient-to-br from-cyan-50 to-teal-50', border: 'border-cyan-200', accent: 'text-cyan-800' },
      'AKSİYON PLANI': { bg: 'bg-gradient-to-br from-purple-50 to-fuchsia-50', border: 'border-purple-200', accent: 'text-purple-800' },
      'MOTİVASYON': { bg: 'bg-gradient-to-br from-violet-100 to-purple-100', border: 'border-violet-300', accent: 'text-violet-800' },
      'SONUÇ': { bg: 'bg-gradient-to-br from-slate-50 to-gray-50', border: 'border-gray-200 dark:border-slate-700', accent: 'text-gray-800 dark:text-slate-200' },
    },
    cardBg: 'bg-gradient-to-br from-violet-50/50 to-cyan-50/50',
    chipBg: 'bg-violet-100',
    chipText: 'text-violet-700',
  },
  ebeveyn: {
    name: 'Ebeveyn Raporu',
    icon: '👨‍👩‍👦',
    gradient: 'from-pink-500 to-orange-400',
    headerBg: 'bg-gradient-to-r from-pink-500 to-orange-400',
    accentColor: '#ec4899',
    radarStroke: '#ec4899',
    radarFill: '#ec4899',
    barColors: ['#ec4899', '#f472b6', '#f59e0b', '#fb923c', '#f43f5e', '#e879f9', '#f97316', '#fbbf24', '#f87171', '#fb7185'],
    sectionStyles: {
      'YÖNETİCİ ÖZETİ': { bg: 'bg-gradient-to-br from-pink-500 to-orange-400', border: 'border-transparent', accent: 'text-white' },
      'TEST SONUÇ': { bg: 'bg-gradient-to-br from-pink-50 to-rose-50', border: 'border-pink-200', accent: 'text-pink-800' },
      'DERİNLEMESİNE': { bg: 'bg-gradient-to-br from-orange-50 to-amber-50', border: 'border-orange-200', accent: 'text-orange-800' },
      'GÜÇLÜ YÖN': { bg: 'bg-gradient-to-br from-rose-50 to-pink-50', border: 'border-rose-200', accent: 'text-rose-800' },
      'GELİŞİM ALAN': { bg: 'bg-gradient-to-br from-amber-50 to-yellow-50', border: 'border-amber-200', accent: 'text-amber-800' },
      'AKSİYON PLANI': { bg: 'bg-gradient-to-br from-pink-50 to-fuchsia-50', border: 'border-pink-200', accent: 'text-pink-800' },
      'YAPIN': { bg: 'bg-gradient-to-br from-green-50 to-emerald-50', border: 'border-green-200', accent: 'text-green-800' },
      'YAPMAYIN': { bg: 'bg-gradient-to-br from-red-50 to-rose-50', border: 'border-red-200', accent: 'text-red-800' },
      'AİLE': { bg: 'bg-gradient-to-br from-pink-50 to-rose-50', border: 'border-pink-200', accent: 'text-pink-800' },
      'SONUÇ': { bg: 'bg-gradient-to-br from-gray-50 to-slate-50', border: 'border-gray-200 dark:border-slate-700', accent: 'text-gray-800 dark:text-slate-200' },
    },
    cardBg: 'bg-gradient-to-br from-pink-50/50 to-orange-50/50',
    chipBg: 'bg-pink-100',
    chipText: 'text-pink-700',
  },
} as const;

type ReportType = keyof typeof THEMES;

interface IntegratedReportRendererProps {
  text: string;
  reportType: ReportType;
  scores?: Record<string, unknown>;
}

// ── Score parser ──
function parseScoresForChart(scores: Record<string, unknown>): { name: string; value: number }[] {
  const items: { name: string; value: number }[] = [];
  for (const [key, val] of Object.entries(scores)) {
    let num = 0;
    if (typeof val === 'number') num = val;
    else if (typeof val === 'object' && val !== null && 'pct' in val) num = (val as Record<string, number>).pct;
    else if (typeof val === 'string') num = parseFloat(val) || 0;
    if (num > 0) {
      const label = key.replace(/_/g, ' ').replace(/tip/i, 'Tip').replace(/type/i, 'Tip');
      items.push({ name: label, value: Math.round(num) });
    }
  }
  return items.sort((a, b) => b.value - a.value).slice(0, 12);
}

// ── Parse progress bars from text ──
function parseProgressBars(text: string): { name: string; value: number; comment: string }[] {
  const bars: { name: string; value: number; comment: string }[] = [];
  const regex = /(.+?)\s*:\s*[█░▓▒]+\s*(\d+)%\s*→?\s*(.*)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    bars.push({ name: match[1].trim(), value: parseInt(match[2]), comment: match[3].trim() });
  }
  return bars;
}

// ── Parse markdown tables ──
function parseTable(text: string): { headers: string[]; rows: string[][] } | null {
  const lines = text.split('\n').filter(l => l.trim().startsWith('|'));
  if (lines.length < 3) return null;
  const parseRow = (line: string) => line.split('|').map(c => c.trim()).filter(Boolean);
  const headers = parseRow(lines[0]);
  const rows = lines.slice(2).map(parseRow).filter(r => r.length >= 2);
  if (rows.length === 0) return null;
  return { headers, rows };
}

// ── Parse sections ──
function parseSections(text: string): { title: string; content: string }[] {
  const sections: { title: string; content: string }[] = [];
  const parts = text.split(/^##\s+/m);
  for (const part of parts) {
    if (!part.trim()) continue;
    const lines = part.split('\n');
    const title = lines[0].replace(/^[#\s📋📊🧠💪🌱🎯👨‍👩‍👦👩‍🏫📌🎓💡⚡🌟✨🏠]+/, '').trim();
    const content = lines.slice(1).join('\n').trim();
    if (title) sections.push({ title, content });
  }
  return sections;
}

function getSectionStyle(title: string, theme: typeof THEMES[ReportType]) {
  for (const [key, style] of Object.entries(theme.sectionStyles)) {
    if (title.toUpperCase().includes(key)) return style;
  }
  return { bg: 'bg-white dark:bg-slate-800', border: 'border-gray-200 dark:border-slate-700', accent: 'text-gray-800 dark:text-slate-200' };
}

// ── Themed Progress Bar ──
function ThemedProgressBar({ name, value, color, theme }: { name: string; value: number; color: string; theme: typeof THEMES[ReportType] }) {
  const getGradient = (v: number) => {
    if (v >= 80) return 'from-emerald-400 to-emerald-600';
    if (v >= 60) return `from-[${theme.accentColor}] to-[${theme.accentColor}]`;
    if (v >= 40) return 'from-amber-400 to-orange-500';
    return 'from-rose-400 to-red-500';
  };

  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">{name}</span>
        <span className="text-sm font-bold" style={{ color }}>{value}%</span>
      </div>
      <div className="h-3.5 bg-gray-100 dark:bg-slate-700/60 rounded-full overflow-hidden shadow-inner">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${getGradient(value)} transition-all duration-1000 shadow-sm`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

// ── Themed Section Content ──
function ThemedSectionContent({ content, theme }: { content: string; theme: typeof THEMES[ReportType] }) {
  const table = parseTable(content);
  const bars = parseProgressBars(content);

  let cleanContent = content;
  if (table) {
    const tableLines = content.split('\n').filter(l => l.trim().startsWith('|'));
    tableLines.forEach(l => { cleanContent = cleanContent.replace(l, ''); });
  }
  cleanContent = cleanContent.replace(/```[\s\S]*?```/g, '');

  return (
    <div>
      {bars.length > 0 && (
        <div className="mb-4 p-4 bg-white/70 dark:bg-slate-800/50 rounded-xl backdrop-blur-sm">
          {bars.map((bar, i) => (
            <ThemedProgressBar key={i} name={bar.name} value={bar.value} color={theme.barColors[i % theme.barColors.length]} theme={theme} />
          ))}
        </div>
      )}

      {table && (
        <div className="overflow-x-auto mb-4 rounded-xl shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {table.headers.map((h, i) => (
                  <th key={i} className={`px-4 py-3 text-white text-left text-xs font-semibold uppercase tracking-wide first:rounded-tl-xl last:rounded-tr-xl`}
                    style={{ backgroundColor: theme.barColors[0] }}>
                    {h.replace(/\*\*/g, '')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, ri) => (
                <tr key={ri} className={ri % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-gray-50 dark:bg-slate-800/60/80'}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-4 py-3 text-gray-700 dark:text-slate-300 border-b border-gray-100 dark:border-slate-700/60">
                      {cell.includes('🔴') ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold">{cell}</span> :
                       cell.includes('🟡') ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">{cell}</span> :
                       cell.includes('🟢') ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">{cell}</span> :
                       <span dangerouslySetInnerHTML={{ __html: cell.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="prose prose-sm max-w-none text-gray-700 dark:text-slate-300 leading-relaxed">
        {cleanContent.split('\n').map((line, i) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={i} className="h-2" />;

          if (trimmed.startsWith('### ')) {
            const text = trimmed.replace(/^###\s+/, '').replace(/\*\*/g, '');
            return <h4 key={i} className="text-base font-bold mt-4 mb-2 flex items-center gap-2" style={{ color: theme.barColors[0] }}>{text}</h4>;
          }

          if (trimmed.startsWith('**📌') || trimmed.startsWith('**💡') || trimmed.startsWith('**⚡') || trimmed.startsWith('**🌟')) {
            const text = trimmed.replace(/\*\*/g, '');
            return <div key={i} className={`mt-4 mb-2 px-4 py-2.5 rounded-xl font-bold text-sm ${theme.chipBg} ${theme.chipText}`}>{text}</div>;
          }

          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const text = trimmed.slice(2);
            const hasCheck = text.startsWith('✅') || text.startsWith('✓');
            const hasWarn = text.startsWith('⚠️') || text.startsWith('❌');
            return (
              <div key={i} className={`flex items-start gap-2 py-1 pl-2 ${hasCheck ? 'text-emerald-700' : hasWarn ? 'text-amber-700' : 'text-gray-700 dark:text-slate-300'}`}>
                <span className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: hasCheck ? '#10b981' : hasWarn ? '#f59e0b' : theme.accentColor }} />
                <span className="text-sm" dangerouslySetInnerHTML={{ __html: text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} />
              </div>
            );
          }

          if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
            return <p key={i} className="font-bold mt-3 mb-1 text-sm" style={{ color: theme.barColors[0] }}>{trimmed.replace(/\*\*/g, '')}</p>;
          }

          if (trimmed.startsWith('*') && trimmed.endsWith('*') && !trimmed.startsWith('**')) {
            return <p key={i} className="text-gray-500 dark:text-slate-400 italic text-xs mt-1 mb-2">{trimmed.replace(/\*/g, '')}</p>;
          }

          return <p key={i} className="text-sm mb-1" dangerouslySetInnerHTML={{ __html: trimmed.replace(/\*\*(.+?)\*\*/g, `<strong style="color:${theme.barColors[0]}">$1</strong>`) }} />;
        })}
      </div>
    </div>
  );
}

// ── ANA BİLEŞEN ──
export default function IntegratedReportRenderer({ text, reportType, scores }: IntegratedReportRendererProps) {
  const theme = THEMES[reportType];
  const sections = useMemo(() => parseSections(text), [text]);
  const chartData = useMemo(() => scores ? parseScoresForChart(scores) : [], [scores]);

  // Extract implicit scores from progress bars in text
  const implicitScores = useMemo(() => {
    if (chartData.length > 0) return chartData;
    const bars = parseProgressBars(text);
    if (bars.length > 0) return bars.map(b => ({ name: b.name, value: b.value }));
    return [];
  }, [chartData, text]);

  if (text.startsWith('⚠️')) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-amber-800">
        <p className="font-semibold text-lg mb-2">⚠️ Rapor Üretilemedi</p>
        <p className="text-sm">{text}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Rapor Başlığı */}
      <div className={`rounded-2xl overflow-hidden shadow-lg ${theme.headerBg} p-6`}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{theme.icon}</span>
          <div>
            <h2 className="text-xl font-extrabold text-white">{theme.name}</h2>
            <p className="text-white/60 text-sm mt-0.5">Eğitim Check-Up Pro — Entegre Analiz</p>
          </div>
        </div>
      </div>

      {/* Skor Grafikleri */}
      {implicitScores.length >= 3 && (
        <div className={`rounded-2xl border shadow-sm overflow-hidden ${theme.cardBg} border-white/40 dark:border-slate-700/60`}>
          <div className={`px-5 py-4 ${theme.headerBg}`}>
            <h3 className="text-white font-bold text-lg">📊 Skor Profili</h3>
          </div>
          <div className="p-5 bg-white/80 dark:bg-slate-800/60">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-3 uppercase tracking-wide">Radar Profili</p>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={implicitScores}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar name="Skor" dataKey="value" stroke={theme.radarStroke} fill={theme.radarFill} fillOpacity={0.2} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-3 uppercase tracking-wide">Boyut Karşılaştırma</p>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={implicitScores} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value: number) => [`${value}%`, 'Skor']} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
                      {implicitScores.map((_, i) => (
                        <Cell key={i} fill={theme.barColors[i % theme.barColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Mini skor kartları */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mt-4">
              {implicitScores.slice(0, 5).map((item, i) => (
                <div key={i} className="rounded-xl p-3 text-center shadow-sm" style={{ backgroundColor: `${theme.barColors[i % theme.barColors.length]}15` }}>
                  <p className="text-2xl font-black" style={{ color: theme.barColors[i % theme.barColors.length] }}>{item.value}%</p>
                  <p className="text-[10px] font-semibold text-gray-600 dark:text-slate-300 mt-0.5 leading-tight">{item.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bölümler */}
      {sections.map((section, i) => {
        const style = getSectionStyle(section.title, theme);
        const isExecutiveSummary = section.title.toUpperCase().includes('YÖNETİCİ') || section.title.toUpperCase().includes('GENEL BAKIŞ');

        return (
          <div key={i} className={`rounded-2xl border ${style.border} shadow-sm overflow-hidden ${style.bg}`}>
            <div className={`px-5 py-3.5 ${isExecutiveSummary ? '' : 'border-b border-black/5'}`}>
              <h3 className={`font-extrabold text-base ${style.accent} flex items-center gap-2`}>
                {section.title}
              </h3>
            </div>
            <div className={`px-5 py-4 ${isExecutiveSummary ? 'text-white/90' : ''}`}>
              {isExecutiveSummary ? (
                <p className="text-sm leading-relaxed"
                   dangerouslySetInnerHTML={{
                     __html: section.content
                       .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>')
                       .replace(/\n/g, '<br/>')
                   }}
                />
              ) : (
                <ThemedSectionContent content={section.content} theme={theme} />
              )}
            </div>
          </div>
        );
      })}

      {/* Footer */}
      <div className="text-center text-xs text-gray-400 dark:text-slate-500 py-4 border-t border-gray-100 dark:border-slate-700/60">
        Bu rapor Eğitim Check-Up Pro AI analiz sistemi tarafından üretilmiştir. Klinik tanı içermez.
      </div>
    </div>
  );
}
