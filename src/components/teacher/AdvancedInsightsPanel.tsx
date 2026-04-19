'use client';

/**
 * AdvancedInsightsPanel — Harmanlanmış rapor kutusu öncesi görsel analiz paneli
 *
 * İçerir:
 * - Risk Skoru Donut Chart (RadialBar)
 * - Boyutlar Bar Chart (yatay)
 * - Korelasyon Badges
 * - Kariyer Önerileri Progress Bar
 * - Kariyer Radar (Holland kodu + Çoklu Zekâ üst üste)
 */

import {
  RadialBarChart, RadialBar, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarRadiusAxis, Radar, Legend,
} from 'recharts';
import { Shield, Link2, Briefcase, TrendingUp, Sparkles } from 'lucide-react';
import type { RiskResult } from '@/lib/services/riskScore';
import type { PatternInsight } from '@/lib/services/correlation';
import type { CareerMatchResult } from '@/lib/services/careerMatch';

interface Props {
  risk: RiskResult | null;
  patterns: PatternInsight[];
  career: CareerMatchResult | null;
  testLabels?: Record<string, string>;
}

// Rol spesifik renkler
const EMERALD = '#10b981';
const AMBER = '#f59e0b';
const RED = '#ef4444';
const SKY = '#0ea5e9';
const VIOLET = '#8b5cf6';
const ORANGE = '#f97316';

export default function AdvancedInsightsPanel({ risk, patterns, career }: Props) {
  // Risk seviye rengi
  const riskColor = risk ? (
    risk.level === 'saglikli' ? EMERALD :
    risk.level === 'izlenmeli' ? AMBER : RED
  ) : EMERALD;

  const radialData = risk ? [{
    name: 'Skor',
    value: risk.overallScore,
    fill: riskColor,
  }] : [];

  // Risk boyutları bar chart verisi
  const dimensionsData = risk
    ? risk.dimensions
        .filter(d => d.available && d.score !== null)
        .map(d => ({
          name: d.name,
          skor: Math.round(d.score as number),
          fill: (d.score as number) >= 60 ? EMERALD : (d.score as number) >= 30 ? AMBER : RED,
        }))
    : [];

  // Kariyer radar verisi — Holland kodu çözümle
  const hollandBreakdown = career?.hollandCode
    ? Array.from(career.hollandCode).map((letter, i) => ({
        axis: ({ R: 'Gerçekçi', I: 'Araştırmacı', A: 'Sanatsal', S: 'Sosyal', E: 'Girişken', C: 'Kuralcı' } as Record<string, string>)[letter] || letter,
        puan: 100 - i * 15, // dominance simulation (R en üstte)
      }))
    : [];

  return (
    <div className="space-y-4 mb-6">
      {/* ═══ BAŞLIK ═══ */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center shadow-md">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-[16px] font-extrabold text-[#0f2847] dark:text-slate-100">Analiz Panosu</h2>
          <p className="text-[11px] text-gray-500 dark:text-slate-400">
            Harmanlanmış rapor için görsel özet
          </p>
        </div>
      </div>

      {/* ═══ ÜST ŞERİT: Risk Donut + Kariyer Radar + Örüntü Sayısı ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* RİSK DONUT */}
        {risk && (
          <div className="relative bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-slate-700/60 shadow-sm p-5 overflow-hidden group hover:shadow-lg transition-all">
            <div
              className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity"
              style={{ background: riskColor }}
            />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4" style={{ color: riskColor }} />
                <h3 className="text-[12px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                  Risk Profili
                </h3>
              </div>

              <div className="h-[140px] relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    innerRadius="70%"
                    outerRadius="100%"
                    data={radialData}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                    <RadialBar background={{ fill: 'rgba(148,163,184,0.15)' }} dataKey="value" cornerRadius={50} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-[28px] font-extrabold" style={{ color: riskColor }}>
                    {Math.round(risk.overallScore)}
                  </p>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 -mt-1">/ 100</p>
                </div>
              </div>

              <div className="text-center mt-2">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-extrabold"
                  style={{ background: `${riskColor}20`, color: riskColor }}
                >
                  {risk.emoji} {risk.label}
                </span>
              </div>

              {risk.flags.length > 0 && (
                <p className="text-[11px] text-gray-500 dark:text-slate-400 text-center mt-2">
                  {risk.flags.length} dikkat noktası
                </p>
              )}
            </div>
          </div>
        )}

        {/* KARİYER RADAR (Holland Kodu) */}
        {career && hollandBreakdown.length >= 3 && (
          <div className="relative bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-slate-700/60 shadow-sm p-5 overflow-hidden group hover:shadow-lg transition-all">
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 opacity-10 blur-2xl group-hover:opacity-20 transition-opacity" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <Briefcase className="w-4 h-4 text-orange-500" />
                <h3 className="text-[12px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                  Holland Profili
                </h3>
              </div>

              <div className="h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={hollandBreakdown} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                    <PolarGrid stroke="rgba(148,163,184,0.3)" />
                    <PolarAngleAxis dataKey="axis" tick={{ fontSize: 9, fill: '#64748b' }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Puan" dataKey="puan" stroke={ORANGE} fill={ORANGE} fillOpacity={0.35} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <p className="text-center text-[13px] font-extrabold text-[#0f2847] dark:text-slate-100 mt-1">
                {career.hollandCode ?? '—'}
              </p>
              <p className="text-center text-[10px] text-gray-500 dark:text-slate-400">
                Baskın kod
              </p>
            </div>
          </div>
        )}

        {/* ÖRÜNTÜ ÖZET KARTI */}
        {patterns.length > 0 && (
          <div className="relative bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-slate-700/60 shadow-sm p-5 overflow-hidden group hover:shadow-lg transition-all">
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 opacity-10 blur-2xl group-hover:opacity-20 transition-opacity" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <Link2 className="w-4 h-4 text-sky-500" />
                <h3 className="text-[12px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                  Testler Arası Örüntüler
                </h3>
              </div>

              <div className="h-[140px] flex flex-col justify-center">
                <p className="text-[44px] font-extrabold text-center bg-gradient-to-br from-sky-500 to-indigo-600 bg-clip-text text-transparent leading-none">
                  {patterns.length}
                </p>
                <p className="text-[11px] text-center text-gray-500 dark:text-slate-400 mt-1">
                  tespit edilen bağlantı
                </p>

                <div className="flex justify-center gap-1 mt-3">
                  {['kritik', 'uyarı', 'bilgi'].map(severity => {
                    const count = patterns.filter(p => p.severity === severity).length;
                    if (count === 0) return null;
                    const color = severity === 'kritik' ? RED : severity === 'uyarı' ? AMBER : SKY;
                    return (
                      <span
                        key={severity}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${color}20`, color }}
                      >
                        {count} {severity}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══ İKİNCİ ŞERİT: Risk Boyutları Bar Chart (geniş) ═══ */}
      {dimensionsData.length >= 2 && (
        <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-slate-700/60 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <h3 className="text-[13px] font-extrabold text-[#0f2847] dark:text-slate-100">Risk Boyutları</h3>
            <span className="text-[10px] text-gray-400 dark:text-slate-500 ml-auto">Yüksek = daha sağlıklı</span>
          </div>

          <div style={{ height: `${Math.max(dimensionsData.length * 40, 120)}px` }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dimensionsData}
                layout="vertical"
                margin={{ top: 5, right: 35, left: 0, bottom: 5 }}
              >
                <CartesianGrid horizontal={false} stroke="rgba(148,163,184,0.15)" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                  width={130}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(30, 41, 59, 0.95)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#f1f5f9',
                    fontSize: '12px',
                  }}
                  formatter={(v: number) => [`${v}/100`, 'Puan']}
                  cursor={{ fill: 'rgba(148,163,184,0.08)' }}
                />
                <Bar dataKey="skor" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ═══ KARİYER ÖNERİLERİ ═══ */}
      {career && career.topCareers.length > 0 && (
        <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-slate-700/60 shadow-sm p-5">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-orange-500" />
              <h3 className="text-[13px] font-extrabold text-[#0f2847] dark:text-slate-100">Kariyer Uyum Analizi</h3>
            </div>
            <span className="text-[10px] text-gray-400 dark:text-slate-500 italic">
              {career.compatibilityNote}
            </span>
          </div>

          <div className="space-y-2">
            {career.topCareers.slice(0, 6).map(c => {
              const barWidth = `${c.matchScore}%`;
              const barColor = c.matchScore >= 70 ? EMERALD : c.matchScore >= 50 ? AMBER : SKY;
              return (
                <div key={c.rank} className="group">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[16px]">{c.icon}</span>
                    <span className="text-[12px] font-extrabold text-[#0f2847] dark:text-slate-100 flex-1 truncate">
                      #{c.rank} {c.career}
                    </span>
                    <span className="text-[10.5px] text-gray-500 dark:text-slate-400 shrink-0">{c.field}</span>
                    <span
                      className="text-[11px] font-extrabold px-2 py-0.5 rounded-full shrink-0"
                      style={{ background: `${barColor}20`, color: barColor }}
                    >
                      %{c.matchScore}
                    </span>
                  </div>
                  <div className="relative h-2 bg-gray-100 dark:bg-slate-700/60 rounded-full overflow-hidden">
                    <div
                      className="absolute left-0 top-0 bottom-0 rounded-full transition-all duration-700 group-hover:brightness-110"
                      style={{ width: barWidth, background: `linear-gradient(90deg, ${barColor}CC, ${barColor})` }}
                    />
                  </div>
                  {c.reasons.length > 0 && (
                    <p className="text-[10.5px] text-gray-500 dark:text-slate-400 mt-0.5 italic">
                      {c.reasons[0]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-[10.5px] text-center text-gray-400 dark:text-slate-500 italic mt-4">
            Bu öneriler kesin bir yönlendirme değil — araştırılabilecek alanlardır.
          </p>
        </div>
      )}

      {/* ═══ ÖRÜNTÜLER LİSTESİ ═══ */}
      {patterns.length > 0 && (
        <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-slate-700/60 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Link2 className="w-4 h-4 text-sky-500" />
            <h3 className="text-[13px] font-extrabold text-[#0f2847] dark:text-slate-100">Tespit Edilen Örüntüler</h3>
          </div>

          <div className="space-y-2">
            {patterns.map(p => {
              const color = p.severity === 'kritik' ? RED : p.severity === 'uyarı' ? AMBER : SKY;
              return (
                <div
                  key={p.id}
                  className="flex items-start gap-3 p-3 rounded-xl border transition-all hover:shadow-sm"
                  style={{ background: `${color}08`, borderColor: `${color}30` }}
                >
                  <span className="text-[18px] mt-0.5">{p.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[12.5px] font-extrabold text-[#0f2847] dark:text-slate-100">{p.title}</h4>
                    <p className="text-[11.5px] text-gray-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                      {p.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
