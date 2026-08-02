'use client';

import React from 'react';
import Link from 'next/link';
import { RotateCcw, Home, CheckCircle2 } from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, XAxis, YAxis, Tooltip,
  RadialBarChart, RadialBar,
} from 'recharts';
import type { ChartConfig } from '@/lib/tests/short-result';

export interface TestResultShortProps {
  testName: string;
  testIcon: string;
  mainResult: string;
  advisory: string;
  chart: ChartConfig;
  accentColor?: string;
  onRetake?: () => void;
  /**
   * Sunucuya kayıt durumu. Önceden "kaydedildi" metni KOŞULSUZ basılıyordu;
   * kayıt sürerken ya da başarısız olduğunda bile öğrenci kaydedildiğini
   * sanıyordu. Artık gerçek durum gösteriliyor.
   */
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  saveError?: string | null;
  onRetrySave?: () => void;
}

function ChartRenderer({ chart, accentColor }: { chart: ChartConfig; accentColor: string }) {
  const { type, data } = chart;

  if (type === 'donut') {
    return (
      <div className="w-full" style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              label={(entry: { name: string; value: number }) => `${entry.name}: ${entry.value}`}
              labelLine={false}
            >
              {data.map((entry, idx) => (
                <Cell key={idx} fill={entry.color || accentColor} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, color: 'white' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === 'radar') {
    return (
      <div className="w-full" style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
            <PolarGrid stroke="rgba(255,255,255,0.2)" />
            <PolarAngleAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 600 }} />
            <PolarRadiusAxis tick={{ fill: 'rgba(255,255,255,0.4)' }} />
            <Radar
              name="Puan"
              dataKey="value"
              stroke={accentColor}
              fill={accentColor}
              fillOpacity={0.5}
              strokeWidth={2.5}
            />
            <Tooltip
              contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, color: 'white' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === 'gauge') {
    const val = data[0]?.value ?? 0;
    const max = chart.max ?? 100;
    const min = chart.min ?? 0;
    const pct = Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));
    return (
      <div className="w-full" style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="65%"
            innerRadius="55%"
            outerRadius="100%"
            startAngle={180}
            endAngle={0}
            data={[{ name: 'value', value: pct, fill: data[0]?.color || accentColor }]}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar background={{ fill: 'rgba(255,255,255,0.1)' }} dataKey="value" cornerRadius={20} />
            <text x="50%" y="62%" textAnchor="middle" dominantBaseline="middle" fontSize="32" fontWeight="800" fill="white">
              {Math.round(val)}
            </text>
            <text x="50%" y="78%" textAnchor="middle" dominantBaseline="middle" fontSize="13" fill="rgba(255,255,255,0.6)">
              / {max}
            </text>
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // BAR (horizontal)
  return (
    <div className="w-full" style={{ height: Math.max(180, data.length * 38 + 40) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 4 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 600 }}
            width={110}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, color: 'white' }}
          />
          <Bar dataKey="value" radius={[8, 8, 8, 8]} label={{ position: 'right', fill: 'white', fontWeight: 700, fontSize: 12 }}>
            {data.map((entry, idx) => (
              <Cell key={idx} fill={entry.color || accentColor} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function TestResultShort({
  testName, testIcon, mainResult, advisory, chart, accentColor = '#7c3aed', onRetake,
  saveStatus = 'saved',
  saveError = null,
  onRetrySave,
}: TestResultShortProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-8 sm:py-12">
      <div className="max-w-2xl mx-auto">
        {/* ── Header — başarı tebriği ── */}
        <div className="text-center mb-8 animate-[fade-up_0.5s_ease-out]">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 mb-4">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span className="text-emerald-100 text-xs font-bold tracking-wide uppercase">Test Tamamlandı</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-1 flex items-center gap-2 justify-center">
            <span className="text-3xl">{testIcon}</span>
            <span>{testName}</span>
          </h1>
        </div>

        {/* ── Ana sonuç kartı ── */}
        <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/15 shadow-2xl p-6 sm:p-8 mb-5 animate-[fade-up_0.6s_ease-out_0.1s_both]">
          <div className="text-center mb-6">
            <p className="text-[11px] uppercase tracking-widest text-white/40 font-bold mb-2">Sonucun</p>
            <h2
              className="text-3xl sm:text-4xl font-black bg-clip-text text-transparent leading-tight"
              style={{ backgroundImage: `linear-gradient(135deg, ${accentColor}, white)` }}
            >
              {mainResult}
            </h2>
            {chart.title && (
              <p className="mt-2 text-sm text-white/60 font-medium">{chart.title}</p>
            )}
          </div>

          {/* ── Grafik ── */}
          <div className="bg-white/3 rounded-2xl p-3 sm:p-5 border border-white/8">
            <ChartRenderer chart={chart} accentColor={accentColor} />
          </div>
        </div>

        {/* ── Tavsiye kartı ── */}
        <div className="rounded-3xl bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-rose-500/10 backdrop-blur-xl border border-amber-400/20 p-5 sm:p-6 mb-5 animate-[fade-up_0.7s_ease-out_0.2s_both]">
          <div className="flex items-start gap-3">
            <div className="text-3xl shrink-0">💡</div>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-amber-300/80 font-bold mb-1.5">Senin için tavsiye</p>
              <p className="text-base sm:text-[17px] text-white/90 leading-relaxed font-medium">{advisory}</p>
            </div>
          </div>
        </div>

        {/* ── Kayıt durumu (gerçek durumu yansıtır) ── */}
        {saveStatus === 'error' ? (
          <div className="rounded-2xl bg-red-500/15 border border-red-400/30 p-4 mb-6 text-center animate-[fade-up_0.8s_ease-out_0.3s_both]">
            <p className="text-sm text-white/90 leading-relaxed">
              <span className="font-bold text-red-200">⚠️ Sonucun kaydedilemedi.</span>{' '}
              {saveError || 'Bağlantı sorunu olabilir.'} Sayfadan ayrılmadan tekrar dene.
            </p>
            {onRetrySave && (
              <button
                type="button"
                onClick={onRetrySave}
                className="mt-3 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-bold transition-all"
              >
                Tekrar Kaydet
              </button>
            )}
          </div>
        ) : saveStatus === 'saved' ? (
          <div className="rounded-2xl bg-blue-500/10 border border-blue-400/20 p-4 mb-6 text-center animate-[fade-up_0.8s_ease-out_0.3s_both]">
            <p className="text-sm text-white/75 leading-relaxed">
              <span className="font-bold text-blue-200">📊 Detaylı analiz</span> öğretmenin görmesi için kaydedildi. Daha fazla bilgi için öğretmenine danışabilirsin.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl bg-amber-500/10 border border-amber-400/25 p-4 mb-6 text-center animate-[fade-up_0.8s_ease-out_0.3s_both]">
            <p className="text-sm text-white/80 leading-relaxed">
              <span className="font-bold text-amber-200">⏳ Sonucun kaydediliyor…</span> Lütfen bu sayfadan ayrılma.
            </p>
          </div>
        )}

        {/* ── Butonlar ── */}
        <div className="flex flex-col sm:flex-row gap-3 animate-[fade-up_0.9s_ease-out_0.4s_both]">
          {onRetake && (
            <button
              onClick={onRetake}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white font-bold text-sm hover:bg-white/15 transition-all"
            >
              <RotateCcw className="w-4 h-4" /> Tekrar Çöz
            </button>
          )}
          <Link
            href="/student/dashboard"
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-extrabold text-sm shadow-xl transition-all hover:scale-[1.02] active:scale-[0.97]"
            style={{ backgroundColor: accentColor, color: 'white' }}
          >
            <Home className="w-4 h-4" /> Ana Sayfaya Dön
          </Link>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
