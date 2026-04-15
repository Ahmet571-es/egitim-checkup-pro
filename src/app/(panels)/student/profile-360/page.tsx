'use client';

import { useEffect, useState, useCallback } from 'react';
import { secureFetch } from '@/lib/csrf-client';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import { extractNormalizedScore, TEST_LABELS } from '@/lib/services/correlation';
import { identifyPatterns, type PatternInsight } from '@/lib/services/correlation';
import { calculateRiskScore, type RiskResult } from '@/lib/services/riskScore';
import { matchCareers, type CareerMatchResult } from '@/lib/services/careerMatch';
import { Shield, Brain, Briefcase, FileText, Loader2, AlertTriangle, TrendingUp, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Recharts — SSR devre dışı
const RadarChartSection = dynamic(() => import('./RadarChartSection'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

interface TestResultRow {
  test_type: string;
  scores: Record<string, unknown>;
  created_at: string;
}

export default function Profile360Page() {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<TestResultRow[]>([]);
  const [radarData, setRadarData] = useState<Array<{ test: string; skor: number; fullMark: 100 }>>([]);
  const [risk, setRisk] = useState<RiskResult | null>(null);
  const [patterns, setPatterns] = useState<PatternInsight[]>([]);
  const [careers, setCareers] = useState<CareerMatchResult | null>(null);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('test_results')
      .select('test_type, scores, created_at')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false });

    if (!data || data.length === 0) {
      setLoading(false);
      return;
    }

    // Her test tipinden en son
    const latestMap = new Map<string, TestResultRow>();
    for (const row of data) {
      if (!latestMap.has(row.test_type)) {
        latestMap.set(row.test_type, row as TestResultRow);
      }
    }
    const latest = Array.from(latestMap.values());
    setResults(latest);

    // Radar data
    const radar = latest
      .map(r => {
        const score = extractNormalizedScore(r.test_type, r.scores);
        return score !== null
          ? { test: TEST_LABELS[r.test_type] || r.test_type, skor: Math.round(score), fullMark: 100 as const }
          : null;
      })
      .filter(Boolean) as Array<{ test: string; skor: number; fullMark: 100 }>;
    setRadarData(radar);

    // Risk
    setRisk(calculateRiskScore(latest));

    // Korelasyon
    setPatterns(identifyPatterns(latest));

    // Kariyer
    setCareers(matchCareers(latest));

    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const generateAIReport = async () => {
    setAiLoading(true);
    try {
      const res = await secureFetch('/api/reports/profile-360', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results, patterns, risk, careers }),
      });
      const data = await res.json();
      setAiReport(data.report || 'Rapor oluşturulamadı.');
    } catch {
      setAiReport('Rapor oluşturulurken bir hata oluştu.');
    }
    setAiLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-20">
        <Brain className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-700 mb-2">Henüz Test Sonucunuz Yok</h2>
        <p className="text-gray-500 mb-4">360° profil oluşturmak için en az bir test tamamlamanız gerekiyor.</p>
        <Link href="/student/my-tests" className="text-violet-600 hover:underline font-medium">
          Testlere Git →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-center gap-3">
        <Link href="/student/dashboard" className="p-2 hover:bg-gray-100 rounded-xl transition">
          <ArrowLeft size={20} className="text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-[#0f2847]">360° Profil</h1>
          <p className="text-gray-500 text-sm">Tüm testlerinin bütüncül analizi</p>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#0f2847] mb-4 flex items-center gap-2">
          <TrendingUp size={20} className="text-violet-500" />
          Test Skorları Radar Grafiği
        </h2>
        <RadarChartSection data={radarData} />
      </div>

      {/* Risk Durumu */}
      {risk && (
        <div className={`rounded-2xl border-2 p-6 shadow-sm ${risk.bgColor} ${risk.borderColor}`}>
          <h2 className="text-lg font-bold text-[#0f2847] mb-3 flex items-center gap-2">
            <Shield size={20} />
            Risk Durumu
          </h2>
          <div className="flex items-center gap-4 mb-4">
            <div className={`text-4xl font-extrabold ${risk.color}`}>
              {risk.overallScore}
            </div>
            <div>
              <span className={`text-lg font-bold ${risk.color}`}>
                {risk.emoji} {risk.label}
              </span>
              <p className="text-sm text-gray-600 mt-1">
                Genel risk skoru (0-100, düşük = riskli)
              </p>
            </div>
          </div>

          {/* Boyutlar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {risk.dimensions.map(dim => (
              <div key={dim.key} className="bg-white/60 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">{dim.name}</p>
                <p className="text-xl font-bold text-[#0f2847]">
                  {dim.available ? dim.score : '—'}
                </p>
                <p className="text-xs text-gray-400">Ağırlık: %{Math.round(dim.weight * 100)}</p>
              </div>
            ))}
          </div>

          {/* Uyarı flagleri */}
          {risk.flags.length > 0 && (
            <div className="space-y-2">
              {risk.flags.map(flag => (
                <div
                  key={flag.id}
                  className={`flex items-start gap-2 p-3 rounded-xl ${
                    flag.severity === 'kritik' ? 'bg-red-100/80' : 'bg-amber-100/80'
                  }`}
                >
                  <AlertTriangle size={16} className={flag.severity === 'kritik' ? 'text-red-600' : 'text-amber-600'} />
                  <p className="text-sm font-medium text-gray-800">{flag.icon} {flag.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Korelasyon Bulguları */}
      {patterns.length > 0 && (
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#0f2847] mb-4 flex items-center gap-2">
            <Brain size={20} className="text-indigo-500" />
            Korelasyon Bulguları
          </h2>
          <div className="space-y-3">
            {patterns.map(p => (
              <div
                key={p.id}
                className={`p-4 rounded-xl border-l-4 ${
                  p.severity === 'kritik'
                    ? 'bg-red-50 border-l-red-500'
                    : p.severity === 'uyarı'
                    ? 'bg-amber-50 border-l-amber-500'
                    : 'bg-blue-50 border-l-blue-500'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span>{p.icon}</span>
                  <h3 className="font-bold text-[#0f2847]">{p.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    p.severity === 'kritik'
                      ? 'bg-red-200 text-red-800'
                      : p.severity === 'uyarı'
                      ? 'bg-amber-200 text-amber-800'
                      : 'bg-blue-200 text-blue-800'
                  }`}>
                    {p.severity === 'kritik' ? 'Kritik' : p.severity === 'uyarı' ? 'Uyarı' : 'Bilgi'}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{p.description}</p>
                <div className="flex gap-2 mt-2">
                  {p.relatedTests.map(t => (
                    <span key={t} className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                      {TEST_LABELS[t] || t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kariyer Önerileri */}
      {careers && careers.topCareers.length > 0 && (
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#0f2847] mb-4 flex items-center gap-2">
            <Briefcase size={20} className="text-emerald-500" />
            Kariyer Önerileri
          </h2>

          {/* Bilgi kartları */}
          <div className="flex flex-wrap gap-3 mb-4">
            {careers.hollandCode && (
              <span className="bg-amber-50 text-amber-800 text-xs px-3 py-1.5 rounded-full font-medium">
                Holland: {careers.hollandCode}
              </span>
            )}
            {careers.dominantZeka && (
              <span className="bg-indigo-50 text-indigo-800 text-xs px-3 py-1.5 rounded-full font-medium">
                Baskın Zekâ: {careers.dominantZeka}
              </span>
            )}
            {careers.varkStyle && (
              <span className="bg-emerald-50 text-emerald-800 text-xs px-3 py-1.5 rounded-full font-medium">
                Öğrenme: {careers.varkStyle}
              </span>
            )}
          </div>

          {/* Kariyer listesi */}
          <div className="space-y-3">
            {careers.topCareers.map(c => (
              <div key={c.rank} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="text-2xl">{c.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#0f2847]">{c.career}</span>
                    <span className="text-xs text-gray-500">({c.field})</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {c.reasons.map((r, i) => (
                      <span key={i} className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-emerald-600">%{c.matchScore}</span>
                  <p className="text-xs text-gray-400">Uyum</p>
                </div>
              </div>
            ))}
          </div>

          {/* VARK + Çalışma uyumluluk notu */}
          {careers.compatibilityNote && (
            <div className="mt-4 p-3 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-800">{careers.compatibilityNote}</p>
            </div>
          )}
        </div>
      )}

      {/* AI Rapor */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#0f2847] mb-4 flex items-center gap-2">
          <FileText size={20} className="text-purple-500" />
          AI Entegre Profil Raporu
        </h2>

        {!aiReport ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm mb-4">
              Claude AI ile tüm test sonuçlarınızın bütüncül analizini oluşturun
            </p>
            <button
              onClick={generateAIReport}
              disabled={aiLoading}
              className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2 mx-auto"
            >
              {aiLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Analiz Oluşturuluyor...
                </>
              ) : (
                <>
                  <Brain size={16} />
                  360° Rapor Oluştur
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-gray-700 text-sm leading-relaxed">
              {aiReport}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
