'use client';

import { useMemo } from 'react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

interface ReportRendererProps {
  text: string;
  scores?: Record<string, unknown>;
  testType?: string;
}

// ── Renk paleti ──
const COLORS = {
  primary: '#0f2847',
  emerald: '#10b981',
  violet: '#8b5cf6',
  amber: '#f59e0b',
  rose: '#f43f5e',
  sky: '#0ea5e9',
  indigo: '#6366f1',
  teal: '#14b8a6',
  pink: '#ec4899',
  orange: '#f97316',
};

const BAR_COLORS = ['#10b981', '#6366f1', '#0ea5e9', '#f59e0b', '#ec4899', '#14b8a6', '#f97316', '#8b5cf6', '#f43f5e', '#3b82f6'];

const SECTION_STYLES: Record<string, { bg: string; border: string; icon: string; accent: string }> = {
  'YÖNETİCİ ÖZETİ': { bg: 'bg-gradient-to-br from-[#0f2847] to-[#1a3d6e]', border: 'border-transparent', icon: '📋', accent: 'text-white' },
  'TEST SONUÇ': { bg: 'bg-gradient-to-br from-sky-50 to-indigo-50', border: 'border-sky-200', icon: '📊', accent: 'text-sky-800' },
  'DERİNLEMESİNE': { bg: 'bg-gradient-to-br from-violet-50 to-purple-50', border: 'border-violet-200', icon: '🧠', accent: 'text-violet-800' },
  'GÜÇLÜ YÖN': { bg: 'bg-gradient-to-br from-emerald-50 to-teal-50', border: 'border-emerald-200', icon: '💪', accent: 'text-emerald-800' },
  'GELİŞİM ALAN': { bg: 'bg-gradient-to-br from-amber-50 to-orange-50', border: 'border-amber-200', icon: '🌱', accent: 'text-amber-800' },
  'AKSİYON PLANI': { bg: 'bg-gradient-to-br from-indigo-50 to-blue-50', border: 'border-indigo-200', icon: '🎯', accent: 'text-indigo-800' },
  'AİLE': { bg: 'bg-gradient-to-br from-pink-50 to-rose-50', border: 'border-pink-200', icon: '👨‍👩‍👦', accent: 'text-pink-800' },
  'ÖĞRETMEN': { bg: 'bg-gradient-to-br from-teal-50 to-cyan-50', border: 'border-teal-200', icon: '👩‍🏫', accent: 'text-teal-800' },
  'SONUÇ': { bg: 'bg-gradient-to-br from-gray-50 to-slate-50', border: 'border-gray-200', icon: '📌', accent: 'text-gray-800' },
};

function getSectionStyle(title: string) {
  for (const [key, style] of Object.entries(SECTION_STYLES)) {
    if (title.toUpperCase().includes(key)) return style;
  }
  return { bg: 'bg-white', border: 'border-gray-200', icon: '📄', accent: 'text-gray-800' };
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

// ── Progress barlarını text'ten parse et ──
function parseProgressBars(text: string): { name: string; value: number; comment: string }[] {
  const bars: { name: string; value: number; comment: string }[] = [];
  const regex = /(.+?)\s*:\s*[█░▓▒]+\s*(\d+)%\s*→?\s*(.*)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    bars.push({
      name: match[1].trim(),
      value: parseInt(match[2]),
      comment: match[3].trim(),
    });
  }
  return bars;
}

// ── Markdown tabloları parse et ──
function parseTable(text: string): { headers: string[]; rows: string[][] } | null {
  const lines = text.split('\n').filter(l => l.trim().startsWith('|'));
  if (lines.length < 3) return null;
  
  const parseRow = (line: string) => line.split('|').map(c => c.trim()).filter(Boolean);
  const headers = parseRow(lines[0]);
  const rows = lines.slice(2).map(parseRow).filter(r => r.length >= 2);
  
  if (rows.length === 0) return null;
  return { headers, rows };
}

// ── Bölümlere ayır ──
function parseSections(text: string): { title: string; content: string }[] {
  const sections: { title: string; content: string }[] = [];
  const parts = text.split(/^##\s+/m);
  
  for (const part of parts) {
    if (!part.trim()) continue;
    const lines = part.split('\n');
    const title = lines[0].replace(/^[#\s📋📊🧠💪🌱🎯👨‍👩‍👦👩‍🏫📌]+/, '').trim();
    const content = lines.slice(1).join('\n').trim();
    if (title) sections.push({ title, content });
  }
  
  return sections;
}

// ── Progress bar bileşeni ──
function ProgressBar({ name, value, color, index }: { name: string; value: number; color: string; index: number }) {
  const getBarColor = (v: number) => {
    if (v >= 80) return 'from-emerald-400 to-emerald-600';
    if (v >= 60) return 'from-sky-400 to-indigo-500';
    if (v >= 40) return 'from-amber-400 to-orange-500';
    return 'from-rose-400 to-red-500';
  };

  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-semibold text-gray-700">{name}</span>
        <span className="text-sm font-bold" style={{ color }}>{value}%</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${getBarColor(value)} transition-all duration-1000`}
          style={{ width: `${value}%`, animationDelay: `${index * 100}ms` }}
        />
      </div>
    </div>
  );
}

// ── Bölüm içerik renderer ──
function SectionContent({ content }: { content: string }) {
  const table = parseTable(content);
  const bars = parseProgressBars(content);
  
  // Tabloyu içerikten temizle
  let cleanContent = content;
  if (table) {
    const tableLines = content.split('\n').filter(l => l.trim().startsWith('|'));
    tableLines.forEach(l => { cleanContent = cleanContent.replace(l, ''); });
  }
  
  // Code bloklarını temizle
  cleanContent = cleanContent.replace(/```[\s\S]*?```/g, '');

  return (
    <div>
      {/* Progress barlar varsa göster */}
      {bars.length > 0 && (
        <div className="mb-4 p-4 bg-white/60 rounded-xl">
          {bars.map((bar, i) => (
            <ProgressBar key={i} name={bar.name} value={bar.value} color={BAR_COLORS[i % BAR_COLORS.length]} index={i} />
          ))}
        </div>
      )}

      {/* Tablo varsa stilize göster */}
      {table && (
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {table.headers.map((h, i) => (
                  <th key={i} className="px-3 py-2.5 bg-[#0f2847] text-white text-left text-xs font-semibold uppercase tracking-wide first:rounded-tl-xl last:rounded-tr-xl">
                    {h.replace(/\*\*/g, '')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, ri) => (
                <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/80'}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-3 py-2.5 text-gray-700 border-b border-gray-100">
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

      {/* Metin içerik */}
      <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
        {cleanContent.split('\n').map((line, i) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={i} className="h-2" />;
          
          // Alt başlık
          if (trimmed.startsWith('### ')) {
            const text = trimmed.replace(/^###\s+/, '').replace(/\*\*/g, '');
            return <h4 key={i} className="text-base font-bold text-[#0f2847] mt-4 mb-2 flex items-center gap-2">{text}</h4>;
          }
          
          // Strateji başlığı
          if (trimmed.startsWith('**📌')) {
            const text = trimmed.replace(/\*\*/g, '');
            return <div key={i} className="mt-4 mb-2 px-4 py-2.5 bg-indigo-100 rounded-xl text-indigo-800 font-bold text-sm">{text}</div>;
          }
          
          // Madde işareti
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const text = trimmed.slice(2);
            const hasCheck = text.startsWith('✅') || text.startsWith('✓');
            const hasWarn = text.startsWith('⚠️') || text.startsWith('❌');
            return (
              <div key={i} className={`flex items-start gap-2 py-1 pl-2 ${hasCheck ? 'text-emerald-700' : hasWarn ? 'text-amber-700' : 'text-gray-700'}`}>
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: hasCheck ? '#10b981' : hasWarn ? '#f59e0b' : '#94a3b8' }} />
                <span className="text-sm" dangerouslySetInnerHTML={{ __html: text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} />
              </div>
            );
          }
          
          // Bold satır
          if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
            return <p key={i} className="font-bold text-[#0f2847] mt-3 mb-1 text-sm">{trimmed.replace(/\*\*/g, '')}</p>;
          }
          
          // İtalik blok
          if (trimmed.startsWith('*') && trimmed.endsWith('*') && !trimmed.startsWith('**')) {
            return <p key={i} className="text-gray-500 italic text-xs mt-1 mb-2">{trimmed.replace(/\*/g, '')}</p>;
          }
          
          // Normal paragraf
          return <p key={i} className="text-sm mb-1" dangerouslySetInnerHTML={{ __html: trimmed.replace(/\*\*(.+?)\*\*/g, '<strong class="text-[#0f2847]">$1</strong>') }} />;
        })}
      </div>
    </div>
  );
}

// ── ANA BİLEŞEN ──
export default function ReportRenderer({ text, scores, testType }: ReportRendererProps) {
  const sections = useMemo(() => parseSections(text), [text]);
  const chartData = useMemo(() => scores ? parseScoresForChart(scores) : [], [scores]);

  // Rapor düz hata mesajıysa özel göster
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
      {/* Skor Grafikleri — Eğer scores varsa */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-gradient-to-r from-[#0f2847] to-[#1a3d6e]">
            <h3 className="text-white font-bold text-lg">📊 Skor Profili</h3>
            <p className="text-white/60 text-xs mt-1">{testType || 'Test'} — Boyut Analizi</p>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Radar Chart */}
              {chartData.length >= 3 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Radar Profili</p>
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart data={chartData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Radar
                        name="Skor"
                        dataKey="value"
                        stroke="#6366f1"
                        fill="#6366f1"
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}
              
              {/* Bar Chart */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Boyut Karşılaştırma</p>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value: number) => [`${value}%`, 'Skor']}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                    />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Mini skor kartları */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mt-4">
              {chartData.slice(0, 5).map((item, i) => (
                <div key={i} className="rounded-xl p-3 text-center" style={{ backgroundColor: `${BAR_COLORS[i]}15` }}>
                  <p className="text-2xl font-black" style={{ color: BAR_COLORS[i] }}>{item.value}%</p>
                  <p className="text-[10px] font-semibold text-gray-600 mt-0.5 leading-tight">{item.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bölümler */}
      {sections.map((section, i) => {
        const style = getSectionStyle(section.title);
        const isExecutiveSummary = section.title.toUpperCase().includes('YÖNETİCİ');

        return (
          <div
            key={i}
            className={`rounded-2xl border ${style.border} shadow-sm overflow-hidden ${style.bg}`}
          >
            {/* Bölüm başlığı */}
            <div className={`px-5 py-3.5 ${isExecutiveSummary ? '' : 'border-b border-black/5'}`}>
              <h3 className={`font-extrabold text-base ${style.accent} flex items-center gap-2`}>
                {section.title}
              </h3>
            </div>
            
            {/* Bölüm içeriği */}
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
                <SectionContent content={section.content} />
              )}
            </div>
          </div>
        );
      })}

      {/* Footer */}
      <div className="text-center text-xs text-gray-400 py-4 border-t border-gray-100">
        Bu rapor Eğitim Check-Up Pro AI analiz sistemi tarafından üretilmiştir. Klinik tanı içermez.
      </div>
    </div>
  );
}
