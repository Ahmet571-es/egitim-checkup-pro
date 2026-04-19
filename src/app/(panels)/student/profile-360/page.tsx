'use client';

import { useEffect, useState, useCallback } from 'react';
import { secureFetch } from '@/lib/csrf-client';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import { extractNormalizedScore, TEST_LABELS } from '@/lib/services/correlation';
import { identifyPatterns, type PatternInsight } from '@/lib/services/correlation';
import { calculateRiskScore, type RiskResult } from '@/lib/services/riskScore';
import { matchCareers, type CareerMatchResult } from '@/lib/services/careerMatch';
import {
  Shield, Brain, Briefcase, FileText, Loader2, AlertTriangle, TrendingUp, Radar, Target, Sparkles
} from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import EmptyState from '@/components/ui/EmptyState';

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

    const latestMap = new Map<string, TestResultRow>();
    for (const row of data) {
      if (!latestMap.has(row.test_type)) {
        latestMap.set(row.test_type, row as TestResultRow);
      }
    }
    const latest = Array.from(latestMap.values());
    setResults(latest);

    const radar = latest
      .map(r => {
        const score = extractNormalizedScore(r.test_type, r.scores);
        return score !== null
          ? { test: TEST_LABELS[r.test_type] || r.test_type, skor: Math.round(score), fullMark: 100 as const }
          : null;
      })
      .filter(Boolean) as Array<{ test: string; skor: number; fullMark: 100 }>;
    setRadarData(radar);

    setRisk(calculateRiskScore(latest));
    setPatterns(identifyPatterns(latest));
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg animate-pulse">
          <Radar className="w-7 h-7 text-white" />
        </div>
        <p className="text-gray-500 dark:text-slate-400 text-sm font-medium">360° Profil yükleniyor...</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div>
        <PageHeader
          role="student"
          icon={Radar}
          title="360° Profil"
          subtitle="Tüm testlerinin bütüncül analizi ve AI destekli içgörüler"
        />
        <EmptyState
          role="student"
          icon={Brain}
          title="Henüz Test Sonucunuz Yok"
          subtitle="360° profil oluşturmak için en az bir test tamamlamanız gerekiyor."
          action={
            <Link
              href="/student/my-tests"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-[13.5px] font-extrabold shadow-lg shadow-violet-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95"
            >
              <Target className="w-4 h-4" />
              Testlere Git
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        role="student"
        icon={Radar}
        title="360° Profil"
        subtitle="Tüm testlerinin bütüncül analizi — risk, pattern, kariyer önerileri"
        count={results.length}
        countLabel="test analiz"
      />

      <div className="space-y-5">
        {/* Radar Chart */}
        <SectionCard
          icon={TrendingUp}
          title="Test Skorları Radar Grafiği"
          subtitle="Tüm testlerdeki performansın bütüncül görünümü"
          gradient="from-violet-500 via-purple-500 to-fuchsia-600"
        >
          <RadarChartSection data={radarData} />
        </SectionCard>

        {/* Risk */}
        {risk && (
          <div className={`relative rounded-3xl border-2 p-6 shadow-sm overflow-hidden ${risk.bgColor} ${risk.borderColor}`}>
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white dark:bg-slate-800 opacity-40 blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-md shrink-0">
                  <Shield className={`w-5 h-5 ${risk.color}`} />
                </div>
                <div>
                  <h2 className="text-[15px] font-extrabold text-[#0f2847] dark:text-slate-100">Risk Durumu</h2>
                  <p className="text-[12px] text-gray-600 dark:text-slate-300">Genel risk skoru (0-100, düşük = riskli)</p>
                </div>
              </div>

              <div className="flex items-center gap-5 mb-5 p-5 rounded-2xl bg-white/60 dark:bg-slate-800/40 backdrop-blur-sm">
                <div className={`text-5xl font-extrabold ${risk.color} tabular-nums`}>
                  {risk.overallScore}
                </div>
                <div className="flex-1">
                  <span className={`text-xl font-extrabold ${risk.color} flex items-center gap-2`}>
                    <span className="text-2xl">{risk.emoji}</span>
                    {risk.label}
                  </span>
                </div>
              </div>

              {/* Boyutlar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {risk.dimensions.map(dim => (
                  <div key={dim.key} className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-3 text-center border border-white/60 dark:border-slate-700/60 shadow-sm">
                    <p className="text-[10.5px] text-gray-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">{dim.name}</p>
                    <p className="text-2xl font-extrabold text-[#0f2847] dark:text-slate-100 tabular-nums">
                      {dim.available ? dim.score : '—'}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">Ağırlık: %{Math.round(dim.weight * 100)}</p>
                  </div>
                ))}
              </div>

              {/* Flag'ler */}
              {risk.flags.length > 0 && (
                <div className="space-y-2">
                  {risk.flags.map(flag => (
                    <div
                      key={flag.id}
                      className={`flex items-start gap-2.5 p-3 rounded-xl backdrop-blur-sm ${
                        flag.severity === 'kritik' ? 'bg-red-100/80 border border-red-200' : 'bg-amber-100/80 border border-amber-200'
                      }`}
                    >
                      <AlertTriangle size={16} className={flag.severity === 'kritik' ? 'text-red-600 shrink-0 mt-0.5' : 'text-amber-600 shrink-0 mt-0.5'} />
                      <p className="text-[13px] font-semibold text-gray-800 dark:text-slate-200">{flag.icon} {flag.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Korelasyon */}
        {patterns.length > 0 && (
          <SectionCard
            icon={Brain}
            title="Korelasyon Bulguları"
            subtitle="Test sonuçları arasındaki ilişki ve örüntüler"
            gradient="from-indigo-500 to-violet-600"
          >
            <div className="space-y-3">
              {patterns.map(p => (
                <div
                  key={p.id}
                  className={`p-4 rounded-2xl border-l-4 ${
                    p.severity === 'kritik'
                      ? 'bg-red-50 border-l-red-500 border border-red-200'
                      : p.severity === 'uyarı'
                      ? 'bg-amber-50 border-l-amber-500 border border-amber-200'
                      : 'bg-blue-50 border-l-blue-500 border border-blue-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-xl">{p.icon}</span>
                    <h3 className="font-extrabold text-[#0f2847] dark:text-slate-100">{p.title}</h3>
                    <span className={`text-[10.5px] px-2 py-0.5 rounded-full font-bold ${
                      p.severity === 'kritik'
                        ? 'bg-red-200 text-red-800'
                        : p.severity === 'uyarı'
                        ? 'bg-amber-200 text-amber-800'
                        : 'bg-blue-200 text-blue-800'
                    }`}>
                      {p.severity === 'kritik' ? 'Kritik' : p.severity === 'uyarı' ? 'Uyarı' : 'Bilgi'}
                    </span>
                  </div>
                  <p className="text-[13px] text-gray-700 dark:text-slate-300 leading-relaxed">{p.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {p.relatedTests.map(t => (
                      <span key={t} className="text-[11px] bg-gray-200/80 text-gray-700 dark:text-slate-300 px-2 py-0.5 rounded-full font-semibold">
                        {TEST_LABELS[t] || t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Kariyer */}
        {careers && careers.topCareers.length > 0 && (
          <SectionCard
            icon={Briefcase}
            title="Kariyer Önerileri"
            subtitle="Testlerin baz alınarak yapay zeka önerileri"
            gradient="from-emerald-500 to-teal-600"
          >
            {/* Bilgi kartları */}
            <div className="flex flex-wrap gap-2 mb-4">
              {careers.hollandCode && (
                <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-800 text-[11.5px] px-3 py-1.5 rounded-full font-bold border border-amber-200">
                  Holland: {careers.hollandCode}
                </span>
              )}
              {careers.dominantZeka && (
                <span className="inline-flex items-center gap-1 bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-800 text-[11.5px] px-3 py-1.5 rounded-full font-bold border border-indigo-200">
                  Baskın Zekâ: {careers.dominantZeka}
                </span>
              )}
              {careers.varkStyle && (
                <span className="inline-flex items-center gap-1 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-800 text-[11.5px] px-3 py-1.5 rounded-full font-bold border border-emerald-200">
                  Öğrenme: {careers.varkStyle}
                </span>
              )}
            </div>

            {/* Kariyer listesi */}
            <div className="space-y-2.5">
              {careers.topCareers.map(c => (
                <div key={c.rank} className="group flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-50/60 to-teal-50/40 rounded-2xl border border-emerald-100 hover:border-emerald-300 hover:shadow-md transition-all">
                  <div className="text-3xl shrink-0">{c.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-[#0f2847] dark:text-slate-100 text-[14.5px]">{c.career}</span>
                      <span className="text-[11.5px] text-gray-500 dark:text-slate-400">({c.field})</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {c.reasons.map((r, i) => (
                        <span key={i} className="text-[10.5px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold border border-emerald-200">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xl font-extrabold text-emerald-600 tabular-nums">%{c.matchScore}</span>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider">Uyum</p>
                  </div>
                </div>
              ))}
            </div>

            {careers.compatibilityNote && (
              <div className="mt-4 p-3.5 bg-gradient-to-r from-sky-50 to-blue-50 rounded-xl border border-sky-200">
                <p className="text-[13px] text-sky-800 leading-relaxed">{careers.compatibilityNote}</p>
              </div>
            )}
          </SectionCard>
        )}

        {/* AI Rapor */}
        <SectionCard
          icon={Sparkles}
          title="AI Entegre Profil Raporu"
          subtitle="Claude AI ile tüm test sonuçlarının bütüncül analizi"
          gradient="from-fuchsia-500 via-purple-500 to-violet-600"
        >
          {!aiReport ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-fuchsia-500 via-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <Sparkles className="w-8 h-8 text-white animate-pulse" />
              </div>
              <p className="text-gray-600 dark:text-slate-300 text-sm mb-5 max-w-md mx-auto leading-relaxed">
                Claude AI ile tüm test sonuçlarınızın bütüncül analizini oluşturun.<br/>
                <span className="text-[12px] text-gray-400 dark:text-slate-500">Bu işlem ~10-20 saniye sürebilir.</span>
              </p>
              <button
                onClick={generateAIReport}
                disabled={aiLoading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-600 text-white rounded-xl text-[13.5px] font-extrabold shadow-lg shadow-violet-500/40 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:pointer-events-none active:scale-95"
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
            <div className="relative bg-gradient-to-br from-violet-50/50 to-fuchsia-50/30 rounded-2xl p-5 border border-violet-100">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-violet-600" />
                <span className="text-[11.5px] font-extrabold text-violet-700 uppercase tracking-wider">AI Tarafından Oluşturuldu</span>
              </div>
              <div className="whitespace-pre-wrap text-[13.5px] text-gray-700 dark:text-slate-300 leading-relaxed">
                {aiReport}
              </div>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
