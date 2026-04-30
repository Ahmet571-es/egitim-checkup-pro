'use client';
/**
 * Faz 7: Öğrenci Gelişim Paneli
 *
 * Öğretmen detay sayfasında bu öğrencinin testlerinin zaman içinde nasıl
 * değiştiğini gösterir:
 *   • recharts LineChart — çoklu test trendi (her testin kendi rengi)
 *   • Delta tablo — test, son skor, önceki skor, değişim %, trend yönü
 *   • AI yorum — claude-sonnet-4-6 ile gelişim değerlendirmesi
 *
 * Test kriterleri (yol haritası):
 *   • 2+ sonuç varsa "Gelişim Görüntüle" aktif → grafik + tablo
 *   • Tek sonuç varsa "Karşılaştırma için yetersiz veri"
 *   • Mobil responsive
 *   • AI yorumu Türkçe + akademik + tavsiye tonu
 */
import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Minus, BarChart2, Sparkles, Loader2,
  AlertCircle, RefreshCw,
} from 'lucide-react';
import { secureFetch } from '@/lib/csrf-client';
import { useToast } from '@/components/ui/Toast';
import { getStudentAllTrends } from '@/lib/services/longitudinal';
import type { StudentTrend } from '@/lib/services/longitudinal';

const TEST_LABELS: Record<string, string> = {
  enneagram: 'Enneagram',
  vark: 'VARK',
  holland: 'Meslek Testi',
  coklu_zeka: 'Çoklu Zekâ',
  'coklu-zeka': 'Çoklu Zekâ',
  sinav_kaygisi: 'Sınav Kaygısı',
  'sinav-kaygisi': 'Sınav Kaygısı',
  calisma_davranisi: 'Çalışma Davranışı',
  'calisma-davranisi': 'Çalışma Davranışı',
  akademik_analiz: 'Akademik Analiz',
  'akademik-analiz': 'Akademik Analiz',
  hizli_okuma: 'Hızlı Okuma',
  'hizli-okuma': 'Hızlı Okuma',
  d2_dikkat: 'D2 Dikkat',
  'd2-dikkat': 'D2 Dikkat',
  sag_sol_beyin: 'Sağ-Sol Beyin',
  'sag-sol-beyin': 'Sağ-Sol Beyin',
};

const TEST_COLORS: Record<string, string> = {
  enneagram: '#8b5cf6',
  vark: '#10b981',
  holland: '#f59e0b',
  coklu_zeka: '#6366f1',
  'coklu-zeka': '#6366f1',
  sinav_kaygisi: '#ef4444',
  'sinav-kaygisi': '#ef4444',
  calisma_davranisi: '#0ea5e9',
  'calisma-davranisi': '#0ea5e9',
  akademik_analiz: '#059669',
  'akademik-analiz': '#059669',
  hizli_okuma: '#f97316',
  'hizli-okuma': '#f97316',
  d2_dikkat: '#dc2626',
  'd2-dikkat': '#dc2626',
  sag_sol_beyin: '#7c3aed',
  'sag-sol-beyin': '#7c3aed',
};

const labelFor = (k: string) => TEST_LABELS[k] || k.replace(/[_-]/g, ' ');
const colorFor = (k: string) => TEST_COLORS[k] || '#6b7280';

function TrendArrow({ direction }: { direction: 'improving' | 'declining' | 'stable' }) {
  if (direction === 'improving') return <TrendingUp size={14} className="text-emerald-600" aria-label="iyileşme" />;
  if (direction === 'declining') return <TrendingDown size={14} className="text-rose-600" aria-label="düşüş" />;
  return <Minus size={14} className="text-gray-400" aria-label="sabit" />;
}

interface Props {
  studentId: string;
}

export default function StudentProgressPanel({ studentId }: Props) {
  const toast = useToast();
  const [trends, setTrends] = useState<StudentTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // AI commentary state
  const [commentary, setCommentary] = useState<string | null>(null);
  const [generatingComment, setGeneratingComment] = useState(false);

  // ── Trendleri yükle ──
  const loadTrends = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStudentAllTrends(studentId);
      setTrends(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gelişim verisi alınamadı.');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadTrends();
  }, [loadTrends]);

  // ── Karşılaştırılabilir trendler (2+ ölçüm olanlar) ──
  const comparableTrends = useMemo(
    () => trends.filter((t) => t.attempts.length >= 2),
    [trends],
  );

  const totalAttempts = useMemo(
    () => trends.reduce((sum, t) => sum + t.attempts.length, 0),
    [trends],
  );

  // ── Grafik data — date-bazlı union ──
  const chartData = useMemo(() => {
    if (comparableTrends.length === 0) return [];
    const dateMap = new Map<string, Record<string, unknown>>();

    for (const trend of comparableTrends) {
      for (const attempt of trend.attempts) {
        const dateKey = new Date(attempt.created_at).toLocaleDateString('tr-TR', {
          day: '2-digit', month: 'short',
        });
        if (!dateMap.has(dateKey)) {
          dateMap.set(dateKey, {
            date: dateKey,
            _ts: new Date(attempt.created_at).getTime(),
          });
        }
        dateMap.get(dateKey)![trend.testType] = attempt.score;
      }
    }

    return Array.from(dateMap.values()).sort(
      (a, b) => (a._ts as number) - (b._ts as number),
    );
  }, [comparableTrends]);

  // ── AI yorum üret ──
  const handleGenerateCommentary = async () => {
    if (comparableTrends.length === 0) {
      toast.error('Yetersiz veri', 'Yorum için en az 2 ölçümü olan bir test gerekli.');
      return;
    }
    setGeneratingComment(true);
    setCommentary(null);
    try {
      const res = await secureFetch(
        `/api/student/${encodeURIComponent(studentId)}/progress/commentary`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error('Yorum üretilemedi', data.error || 'Bilinmeyen hata.');
        return;
      }
      setCommentary(data.commentary);
      toast.success('AI yorumu üretildi');
    } catch {
      toast.error('Bağlantı hatası', 'Lütfen tekrar deneyin.');
    } finally {
      setGeneratingComment(false);
    }
  };

  // ── Loading / error ──
  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-sky-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 flex items-start gap-2">
        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-sm text-rose-800 dark:text-rose-300">Hata</p>
          <p className="text-[13px] text-rose-700 dark:text-rose-400 mt-0.5">{error}</p>
          <button
            onClick={loadTrends}
            className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-rose-700 text-xs font-bold border border-rose-200 hover:bg-rose-50 transition"
          >
            <RefreshCw className="w-3 h-3" /> Tekrar dene
          </button>
        </div>
      </div>
    );
  }

  // ── Hiç veri yok ──
  if (trends.length === 0 || totalAttempts === 0) {
    return (
      <div className="p-8 rounded-2xl bg-gradient-to-br from-gray-50 to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-gray-200 dark:border-slate-700 text-center">
        <BarChart2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="font-bold text-[#0f2847] dark:text-slate-100 mb-1">
          Henüz gelişim verisi yok
        </p>
        <p className="text-[13px] text-gray-500 dark:text-slate-400 max-w-md mx-auto">
          Bu öğrenci henüz hiç test çözmemiş veya geçmiş ölçüm tablosu doldurulmamış.
        </p>
      </div>
    );
  }

  // ── Yetersiz veri (hep tek ölçüm) ──
  if (comparableTrends.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200 dark:border-amber-900/40">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-900 dark:text-amber-300 mb-1">
              Karşılaştırma için yetersiz veri
            </p>
            <p className="text-[13px] text-amber-800 dark:text-amber-400 leading-relaxed">
              Gelişim grafiği için aynı testten en az 2 ölçüm gerekli. Bu öğrencinin{' '}
              <strong>{trends.length}</strong> farklı testten toplam{' '}
              <strong>{totalAttempts}</strong> ölçümü var ama her testte yalnızca 1 sonuç bulunuyor.
              Öğrenci aynı testi tekrar çözdükçe burası dolar.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Grafik + tablo + AI yorum ──
  return (
    <div className="space-y-4">
      {/* Özet bilgi */}
      <div className="flex items-center gap-2 text-[12px] text-gray-600 dark:text-slate-400">
        <BarChart2 className="w-4 h-4 text-sky-600" />
        <span>
          <strong>{comparableTrends.length}</strong> testte karşılaştırılabilir veri
          {' · '}
          toplam <strong>{totalAttempts}</strong> ölçüm
        </span>
      </div>

      {/* Recharts trend grafiği */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-4 shadow-sm">
        <h4 className="text-[13px] font-extrabold text-[#0f2847] dark:text-slate-100 mb-3">
          Zaman İçinde Skor Değişimi
        </h4>
        <div className="w-full" style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 15, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#6b7280' }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {comparableTrends.map((t) => (
                <Line
                  key={t.testType}
                  type="monotone"
                  dataKey={t.testType}
                  name={labelFor(t.testType)}
                  stroke={colorFor(t.testType)}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Delta tablosu */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
          <h4 className="text-[13px] font-extrabold text-[#0f2847] dark:text-slate-100">
            Delta Tablosu — Önceki Ölçüme Göre Değişim
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-gradient-to-r from-sky-50 to-cyan-50 dark:from-sky-950/30 dark:to-cyan-950/20 text-[#0f2847] dark:text-slate-200">
                <th className="px-3 py-2 text-left font-bold">Test</th>
                <th className="px-3 py-2 text-center font-bold">Ölçüm</th>
                <th className="px-3 py-2 text-center font-bold">İlk → Son</th>
                <th className="px-3 py-2 text-center font-bold">Δ Toplam</th>
                <th className="px-3 py-2 text-center font-bold">Ort. Δ</th>
                <th className="px-3 py-2 text-center font-bold">Trend</th>
              </tr>
            </thead>
            <tbody>
              {comparableTrends.map((t) => {
                const totalChange = t.firstScore !== 0
                  ? ((t.latestScore - t.firstScore) / Math.abs(t.firstScore)) * 100
                  : 0;
                const totalChangeStr = totalChange > 0
                  ? `+${totalChange.toFixed(1)}%`
                  : `${totalChange.toFixed(1)}%`;
                const totalColor =
                  totalChange > 2 ? 'text-emerald-600 font-bold' :
                  totalChange < -2 ? 'text-rose-600 font-bold' :
                  'text-gray-500';

                return (
                  <tr key={t.testType} className="border-t border-gray-100 dark:border-slate-700/50">
                    <td className="px-3 py-2 font-semibold flex items-center gap-2">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: colorFor(t.testType) }}
                        aria-hidden
                      />
                      {labelFor(t.testType)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700/50 text-[11px] font-bold">
                        {t.attempts.length}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center text-gray-700 dark:text-slate-300">
                      {t.firstScore} → <strong>{t.latestScore}</strong>
                    </td>
                    <td className={`px-3 py-2 text-center ${totalColor}`}>
                      {totalChangeStr}
                    </td>
                    <td className="px-3 py-2 text-center text-gray-600 dark:text-slate-400">
                      {t.averageChange > 0 ? '+' : ''}{t.averageChange.toFixed(1)}%
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="inline-flex items-center justify-center">
                        <TrendArrow direction={t.direction} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI yorum bölümü */}
      <div className="bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-violet-950/20 dark:via-purple-950/20 dark:to-pink-950/20 rounded-2xl border border-violet-200 dark:border-violet-900/40 p-4 shadow-sm">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <h4 className="text-[13px] font-extrabold text-[#0f2847] dark:text-slate-100">
              AI Gelişim Yorumu
            </h4>
            <p className="text-[11px] text-gray-600 dark:text-slate-400 mt-0.5">
              Claude Sonnet 4.6 — akademik temellendirmeli, advisory tonda
            </p>
          </div>
          {!generatingComment && (
            <button
              onClick={handleGenerateCommentary}
              disabled={generatingComment}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 text-white text-[12px] font-bold shadow-md shadow-violet-500/25 hover:shadow-lg disabled:opacity-50 transition-all"
            >
              {commentary ? (
                <><RefreshCw className="w-3.5 h-3.5" /> Yeniden Üret</>
              ) : (
                <><Sparkles className="w-3.5 h-3.5" /> Yorum Üret</>
              )}
            </button>
          )}
        </div>

        {generatingComment ? (
          <div className="py-8 flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
            <p className="text-[12px] text-gray-600 dark:text-slate-400">
              AI yorumu üretiliyor (yaklaşık 15-30 saniye)...
            </p>
          </div>
        ) : commentary ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-[13px] text-[#0f2847] dark:text-slate-200 leading-relaxed whitespace-pre-line">
              {commentary}
            </p>
          </div>
        ) : (
          <div className="py-3 text-[12px] text-gray-500 dark:text-slate-400 italic">
            Henüz yorum üretilmedi. Yukarıdaki <strong>Yorum Üret</strong> butonuna
            tıklayarak öğrencinin gelişim verilerinden AI yorumu alabilirsin.
          </div>
        )}
      </div>
    </div>
  );
}
