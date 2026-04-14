'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TrendingUp, Award, Eye } from 'lucide-react';

interface TestResult {
  id: string;
  test_type: string;
  scores: Record<string, unknown>;
  completed_at: string | null;
}

const TEST_META: Record<string, { label: string; icon: string; color: string }> = {
  enneagram: { label: 'Enneagram Kişilik', icon: '🔮', color: '#8b5cf6' },
  vark: { label: 'VARK Öğrenme Stilleri', icon: '📚', color: '#10b981' },
  holland: { label: 'Holland RIASEC', icon: '🧭', color: '#f59e0b' },
  'coklu-zeka': { label: 'Çoklu Zekâ', icon: '🧠', color: '#6366f1' },
  'sinav-kaygisi': { label: 'Sınav Kaygısı', icon: '😰', color: '#ef4444' },
  'calisma-davranisi': { label: 'Çalışma Davranışı', icon: '📖', color: '#0ea5e9' },
  'akademik-analiz': { label: 'Akademik Analiz', icon: '🎓', color: '#059669' },
  'hizli-okuma': { label: 'Hızlı Okuma', icon: '⚡', color: '#f97316' },
  'd2-dikkat': { label: 'D2 Dikkat', icon: '🎯', color: '#dc2626' },
  'sag-sol-beyin': { label: 'Sağ-Sol Beyin', icon: '🧩', color: '#7c3aed' },
};

function getTestMeta(type: string) {
  return TEST_META[type] ?? { label: type, icon: '📊', color: '#6b7280' };
}

// Skor özetini görsel olarak listele. value 0-1 araligindaysa otomatik olarak 100'e olceklenir.
function ScoreBar({ label, value, max = 100, color }: { label: string; value: number; max?: number; color: string }) {
  // MBTI/VARK/BigFive seed verilerinde skorlar 0-1 araliginda geliyor, onlari %'e cevir
  const normalized = value <= 1 ? value * 100 : value;
  const pct = Math.min(100, Math.max(0, (normalized / max) * 100));
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-32 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-semibold text-gray-600 w-10 text-right">{Math.round(normalized)}</span>
    </div>
  );
}

function extractScoreItems(scores: Record<string, unknown>): Array<{ label: string; value: number }> {
  const items: Array<{ label: string; value: number }> = [];

  if (scores.categories && typeof scores.categories === 'object') {
    Object.entries(scores.categories as Record<string, number>).slice(0, 6).forEach(([k, v]) => {
      if (typeof v === 'number') items.push({ label: k, value: v });
    });
  } else if (scores.scores && typeof scores.scores === 'object') {
    Object.entries(scores.scores as Record<string, number | { pct: number }>).slice(0, 6).forEach(([k, v]) => {
      if (typeof v === 'number') items.push({ label: k, value: v });
      else if (typeof v === 'object' && v !== null && 'pct' in v) items.push({ label: k, value: (v as { pct: number }).pct });
    });
  } else {
    Object.entries(scores).slice(0, 6).forEach(([k, v]) => {
      if (typeof v === 'number' && !['id', 'user_id', 'version'].includes(k)) {
        items.push({ label: k, value: v });
      }
    });
  }

  return items;
}

export default function MyResultsPage() {
  const supabase = useMemo(() => createClient(), []);

  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from('test_results')
        .select('id, test_type, scores, completed_at')
        .eq('student_id', user.id)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false });

      setResults((data ?? []).map(r => ({ ...r, scores: r.scores as Record<string, unknown> })));
      setLoading(false);
    }
    load();
  }, [supabase]);

  const thisMonth = results.filter(r => {
    if (!r.completed_at) return false;
    const d = new Date(r.completed_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#0f2847] mb-1">Sonuçlarım</h1>
        <p className="text-gray-500 text-sm">Tamamladığın testlerin sonuçları ve puan detayları.</p>
      </div>

      {/* Özet Kartlar */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[
          { label: 'Tamamlanan', value: results.length, icon: <Award size={18} className="text-emerald-500" />, color: 'text-emerald-600' },
          { label: 'Bu Ay', value: thisMonth, icon: <TrendingUp size={18} className="text-sky-500" />, color: 'text-sky-600' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-4 flex items-center gap-3 shadow-sm">
            {icon}
            <div>
              <p className={`font-extrabold text-xl ${color}`}>{value}</p>
              <p className="text-gray-400 text-xs">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Sonuç Listesi */}
      {results.length === 0 ? (
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-12 text-center">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-gray-400">Henüz tamamlanmış testiniz yok.</p>
          <p className="text-gray-400 text-sm mt-1">Testlerim sayfasından bir test başlat!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map(r => {
            const meta = getTestMeta(r.test_type);
            const scoreItems = extractScoreItems(r.scores);

            return (
              <div
                key={r.id}
                className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm overflow-hidden"
              >
                {/* Kart Başlığı */}
                <div className="flex items-center gap-4 p-5">
                  <div className="w-1 h-14 rounded-full flex-shrink-0" style={{ backgroundColor: meta.color }} />
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ backgroundColor: meta.color + '18' }}
                  >
                    {meta.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#0f2847]">{meta.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {r.completed_at
                        ? new Date(r.completed_at).toLocaleDateString('tr-TR', {
                            year: 'numeric', month: 'long', day: 'numeric',
                          })
                        : '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setSelectedResult(selectedResult?.id === r.id ? null : r)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 text-gray-600 text-xs font-semibold hover:bg-gray-200 transition-all"
                    >
                      <Eye size={13} />
                      Skor Detay
                    </button>
                  </div>
                </div>

                {/* Skor Detayı */}
                {selectedResult?.id === r.id && scoreItems.length > 0 && (
                  <div className="px-5 pb-5 border-t border-gray-50 pt-4">
                    <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">Puan Dağılımı</p>
                    <div className="space-y-2">
                      {scoreItems.map(item => (
                        <ScoreBar key={item.label} label={item.label} value={item.value} color={meta.color} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
