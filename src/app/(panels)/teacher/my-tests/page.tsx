'use client';

import { useState, useEffect, useMemo } from 'react';
import { Play, Clock, CheckCircle, BookOpen, ListChecks, Inbox, RotateCcw, Lock, History } from 'lucide-react';
import Link from 'next/link';
import { ALL_TESTS } from '@/lib/tests/index';
import type { RegisteredTest } from '@/lib/tests/types';
import { createClient } from '@/lib/supabase/client';
import PageHeader from '@/components/ui/PageHeader';
import { ListSkeleton } from '@/components/ui/Skeleton';

const CATEGORY_LABELS: Record<string, string> = {
  kisilik: 'Kişilik',
  ogrenme: 'Öğrenme',
  kariyer: 'Kariyer',
  dikkat: 'Dikkat',
  akademik: 'Akademik',
  psikolojik: 'Psikolojik',
};

const norm = (s: string) => (s || '').replace(/-/g, '_').toLowerCase();

export default function TeacherMyTestsPage() {
  const [completedTests, setCompletedTests] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data: results } = await supabase
          .from('teacher_test_results')
          .select('test_type')
          .eq('teacher_id', user.id)
          .not('completed_at', 'is', null);

        if (results && results.length > 0) {
          const completed = new Set<string>();
          results.forEach(r => completed.add(norm(r.test_type || '')));
          setCompletedTests(completed);
        }
      } catch (err) {
        console.error('[teacher my-tests] fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const isTestCompleted = (testId: string) => completedTests.has(norm(testId));

  const items = useMemo(() =>
    ALL_TESTS.map(t => ({ testId: t.id, isCompleted: isTestCompleted(t.id) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [completedTests]
  );

  const filtered = items.filter(a =>
    filter === 'all' ? true :
    filter === 'pending' ? !a.isCompleted :
    a.isCompleted
  );

  const getTest = (testId: string): RegisteredTest | undefined => ALL_TESTS.find(t => t.id === testId);

  const pendingCount = items.filter(a => !a.isCompleted).length;
  const completedCount = items.filter(a => a.isCompleted).length;

  const renderCard = (item: { testId: string; isCompleted: boolean }) => {
    const test = getTest(item.testId);
    if (!test) return null;
    const { isCompleted } = item;

    return (
      <div
        key={item.testId}
        className={`group relative overflow-hidden rounded-2xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 transition-all hover:-translate-y-0.5 bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 shadow-sm hover:shadow-lg ${isCompleted ? 'opacity-90' : ''}`}
      >
        {/* Color accent bar */}
        <div
          className="w-1 h-16 rounded-full shrink-0"
          style={{ backgroundColor: isCompleted ? '#10b981' : test.color }}
        />

        {/* Icon */}
        <div
          className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 group-hover:rotate-6 transition-all"
          style={{ backgroundColor: isCompleted ? '#ecfdf5' : test.color + '20' }}
        >
          {isCompleted ? (
            <CheckCircle size={26} className="text-emerald-500" />
          ) : (
            <span className="text-2xl sm:text-[26px]">{test.icon}</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-extrabold text-[#0f2847] dark:text-slate-100 truncate text-[14px] sm:text-[15px]">{test.name}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-[11.5px] text-gray-500 dark:text-slate-400 flex items-center gap-1 font-medium">
              <Clock size={11} className="text-gray-400 dark:text-slate-500" /> {test.estimatedMinutes} dk
            </span>
            <span className="text-[11.5px] text-gray-400 dark:text-slate-500">·</span>
            <span className="text-[11.5px] text-gray-500 dark:text-slate-400 font-medium">{test.questionCount} soru</span>
            <span
              className="text-[10.5px] px-2 py-0.5 rounded-full font-bold"
              style={{ backgroundColor: test.color + '20', color: test.color }}
            >
              {CATEGORY_LABELS[test.category] ?? test.category}
            </span>
            {isCompleted && (
              <span className="text-[10.5px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <CheckCircle size={10} />
                Çözüldü
              </span>
            )}
          </div>
        </div>

        {/* Action */}
        <Link
          href={`/teacher/my-tests/${item.testId}`}
          className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-white text-[12px] sm:text-[13px] font-extrabold hover:opacity-90 transition-all shrink-0 shadow-md active:scale-95"
          style={{ backgroundColor: isCompleted ? '#0f766e' : test.color, boxShadow: `0 4px 14px ${test.color}40` }}
        >
          {isCompleted ? (<><RotateCcw size={13} /> Tekrar</>) : (<><Play size={13} /> Başla</>)}
        </Link>
      </div>
    );
  };

  return (
    <div>
      <PageHeader
        role="teacher"
        icon={ListChecks}
        title="Testlerim"
        subtitle="Öğrencilerinin çözdüğü testleri kendin de deneyimle"
        count={items.length}
        countLabel="test"
      />

      {/* Sonuç geçmişine kısayol */}
      <Link
        href="/teacher/my-results"
        className="group flex items-center gap-3 mb-4 p-4 rounded-2xl bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white flex items-center justify-center shadow-md shrink-0">
          <History size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-extrabold text-[#0f2847] dark:text-slate-100 text-[14px]">Sonuç Geçmişim</p>
          <p className="text-[12px] text-gray-500 dark:text-slate-400">Çözdüğün testlerin sonuçlarını ve raporlarını gör</p>
        </div>
        <span className="text-teal-600 dark:text-teal-400 text-[13px] font-extrabold shrink-0 group-hover:translate-x-0.5 transition-transform">Aç →</span>
      </Link>

      {/* Gizlilik notu */}
      <div className="flex items-start gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl p-4 mb-6">
        <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
          <Lock size={16} />
        </div>
        <p className="text-[13px] text-emerald-900 dark:text-emerald-200 leading-relaxed">
          Testleri istediğin zaman çözebilirsin. <strong>Sonuçların yalnızca sana görünür</strong> — yöneticiye, veliye veya öğrencilere yansımaz.
        </p>
      </div>

      {/* Özet kartlar */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6 grid-stagger">
        {[
          { label: 'Çözülmedi', value: pendingCount, gradient: 'from-amber-500 to-orange-600', icon: BookOpen, valueColor: 'text-amber-600' },
          { label: 'Çözülen', value: completedCount, gradient: 'from-emerald-500 to-teal-600', icon: CheckCircle, valueColor: 'text-emerald-600' },
          { label: 'Toplam', value: items.length, gradient: 'from-sky-500 to-blue-600', icon: ListChecks, valueColor: 'text-sky-600' },
        ].map(({ label, value, gradient, icon: Icon, valueColor }) => (
          <div key={label} className="relative bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-slate-700/60 p-4 sm:p-5 shadow-sm overflow-hidden group hover:shadow-lg transition-all">
            <div className={`absolute -top-8 -right-8 w-28 h-28 rounded-full bg-gradient-to-br ${gradient} opacity-10 blur-2xl group-hover:opacity-25 transition-opacity`} />
            <div className="relative flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center shadow-md shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-[11px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider">{label}</p>
                <p className={`text-xl sm:text-2xl font-extrabold tabular-nums ${valueColor}`}>{loading ? '—' : value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filtreler */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {([
          { k: 'all', label: 'Tümü' },
          { k: 'pending', label: 'Çözülmedi' },
          { k: 'completed', label: 'Çözülen' },
        ] as const).map(f => (
          <button
            key={f.k}
            onClick={() => setFilter(f.k)}
            className={`px-4 py-2 rounded-xl text-[13px] font-extrabold transition-all active:scale-95 ${
              filter === f.k
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30'
                : 'bg-white/80 dark:bg-slate-800/60 text-gray-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 border border-white/60 dark:border-slate-700/60 hover:border-emerald-300 hover:text-emerald-600'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && <ListSkeleton count={5} />}

      {!loading && filtered.length > 0 && (
        <div className="space-y-3 grid-stagger">
          {filtered.map(renderCard)}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="relative bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl border border-white/50 dark:border-slate-700/60 p-12 text-center shadow-sm overflow-hidden">
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-gradient-to-br from-emerald-200 to-teal-200 opacity-30 blur-3xl" />
          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
              <Inbox className="w-10 h-10 text-white" />
            </div>
            <p className="text-[17px] text-[#0f2847] dark:text-slate-100 font-extrabold mb-2">Bu kategoride test bulunamadı</p>
            <p className="text-gray-500 dark:text-slate-400 text-sm">Farklı bir filtre seç veya Tümü filtresini kullan.</p>
          </div>
        </div>
      )}
    </div>
  );
}
