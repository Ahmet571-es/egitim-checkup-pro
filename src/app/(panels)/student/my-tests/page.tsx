'use client';

import { useState, useEffect, useMemo } from 'react';
import { Play, Clock, CheckCircle, BookOpen, AlertCircle, Target, Sparkles, Bell, ListChecks, Inbox } from 'lucide-react';
import Link from 'next/link';
import { ALL_TESTS } from '@/lib/tests/index';
import type { RegisteredTest } from '@/lib/tests/types';
import { createClient } from '@/lib/supabase/client';
import PageHeader from '@/components/ui/PageHeader';

const CATEGORY_LABELS: Record<string, string> = {
  kisilik: 'Kişilik',
  ogrenme: 'Öğrenme',
  kariyer: 'Kariyer',
  dikkat: 'Dikkat',
  akademik: 'Akademik',
  psikolojik: 'Psikolojik',
};

const norm = (s: string) => (s || '').replace(/-/g, '_').toLowerCase();

export default function MyTestsPage() {
  const [completedTests, setCompletedTests] = useState<Set<string>>(new Set());
  const [assignedTests, setAssignedTests] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const meta = user.user_metadata || {};
        const assigned = (meta.assigned_tests as string[]) || [];
        setAssignedTests(new Set(assigned.map(norm)));

        const { data: results } = await supabase
          .from('test_results')
          .select('test_type')
          .eq('student_id', user.id)
          .not('completed_at', 'is', null);

        if (results && results.length > 0) {
          const completed = new Set<string>();
          results.forEach(r => completed.add(norm(r.test_type || '')));
          setCompletedTests(completed);
        }
      } catch (err) {
        console.error('[my-tests] fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const isTestCompleted = (testId: string) => completedTests.has(norm(testId));
  const isTestAssigned = (testId: string) => assignedTests.has(norm(testId));

  const allAssignments = useMemo(() =>
    ALL_TESTS.map(t => ({
      id: `assign-${t.id}`,
      testId: t.id,
      isCompleted: isTestCompleted(t.id),
      isAssigned: isTestAssigned(t.id),
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [completedTests, assignedTests]
  );

  const homework = allAssignments.filter(a => a.isAssigned && !a.isCompleted);
  const others = allAssignments.filter(a => !(a.isAssigned && !a.isCompleted));

  const applyFilter = (list: typeof allAssignments) =>
    list.filter(a =>
      filter === 'all' ? true :
      filter === 'pending' ? !a.isCompleted :
      a.isCompleted
    );

  const filteredHomework = applyFilter(homework);
  const filteredOthers = applyFilter(others);

  const getTest = (testId: string): RegisteredTest | undefined => ALL_TESTS.find(t => t.id === testId);

  const pendingCount = allAssignments.filter(a => !a.isCompleted).length;
  const completedCount = allAssignments.filter(a => a.isCompleted).length;
  const homeworkCount = homework.length;

  const renderTestCard = (
    assignment: { id: string; testId: string; isCompleted: boolean; isAssigned: boolean },
    variant: 'homework' | 'normal'
  ) => {
    const test = getTest(assignment.testId);
    if (!test) return null;
    const { isCompleted, isAssigned } = assignment;
    const isHomeworkCard = variant === 'homework';

    return (
      <div
        key={assignment.id}
        className={`group relative overflow-hidden rounded-2xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 transition-all hover:-translate-y-0.5 ${
          isHomeworkCard
            ? 'bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-300 shadow-md hover:shadow-xl'
            : 'bg-white/80 backdrop-blur-xl border border-white/60 shadow-sm hover:shadow-lg'
        } ${isCompleted ? 'opacity-85' : ''}`}
      >
        {/* Corner glow */}
        {isHomeworkCard && (
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-amber-400 opacity-20 blur-2xl pointer-events-none" />
        )}

        {/* Color accent bar */}
        <div
          className="w-1 h-16 rounded-full shrink-0 relative"
          style={{ backgroundColor: isCompleted ? '#10b981' : (isHomeworkCard ? '#f59e0b' : test.color) }}
        >
          {!isCompleted && !isHomeworkCard && (
            <div className="absolute inset-0 rounded-full animate-pulse" style={{ backgroundColor: test.color, opacity: 0.5 }} />
          )}
        </div>

        {/* Icon */}
        <div
          className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 group-hover:rotate-6 transition-all"
          style={{
            backgroundColor: isCompleted ? '#ecfdf5' : (isHomeworkCard ? '#fef3c7' : test.color + '20'),
          }}
        >
          {isCompleted ? (
            <CheckCircle size={26} className="text-emerald-500" />
          ) : (
            <span className="text-2xl sm:text-[26px]">{test.icon}</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-extrabold text-[#0f2847] truncate text-[14px] sm:text-[15px]">{test.name}</p>
            {isAssigned && !isCompleted && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm animate-pulse">
                <Target size={10} />
                ÖDEV
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-[11.5px] text-gray-500 flex items-center gap-1 font-medium">
              <Clock size={11} className="text-gray-400" /> {test.estimatedMinutes} dk
            </span>
            <span className="text-[11.5px] text-gray-400">·</span>
            <span className="text-[11.5px] text-gray-500 font-medium">{test.questionCount} soru</span>
            <span
              className="text-[10.5px] px-2 py-0.5 rounded-full font-bold"
              style={{ backgroundColor: test.color + '20', color: test.color }}
            >
              {CATEGORY_LABELS[test.category] ?? test.category}
            </span>
            {isCompleted && (
              <span className="text-[10.5px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <CheckCircle size={10} />
                Tamamlandı
              </span>
            )}
          </div>
        </div>

        {/* Action */}
        {isCompleted ? (
          <Link
            href={`/student/my-tests/${assignment.testId}`}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-emerald-100 text-emerald-700 text-[12px] sm:text-[13px] font-bold hover:bg-emerald-200 transition-all shrink-0 active:scale-95 border border-emerald-200"
          >
            <Play size={13} />
            <span className="hidden sm:inline">Tekrar Çöz</span>
            <span className="sm:hidden">Tekrar</span>
          </Link>
        ) : (
          <Link
            href={`/student/my-tests/${assignment.testId}`}
            className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-white text-[12px] sm:text-[13px] font-extrabold hover:opacity-90 transition-all shrink-0 shadow-md active:scale-95 ${
              isHomeworkCard ? 'bg-gradient-to-r from-amber-500 to-orange-600 shadow-amber-500/40' : ''
            }`}
            style={isHomeworkCard ? undefined : { backgroundColor: test.color, boxShadow: `0 4px 14px ${test.color}40` }}
          >
            <Play size={13} />
            {isHomeworkCard ? 'Hemen' : 'Başla'}
          </Link>
        )}
      </div>
    );
  };

  return (
    <div>
      <PageHeader
        role="student"
        icon={ListChecks}
        title="Testlerim"
        subtitle="Testleri çöz, kendini keşfet, gelişimini takip et"
        count={allAssignments.length}
        countLabel="test"
      />

      {/* ÖDEV BANNER'I */}
      {!loading && homeworkCount > 0 && (
        <Link
          href="#homework"
          className="group block relative overflow-hidden bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-2xl p-5 mb-6 shadow-lg shadow-amber-500/30 hover:shadow-2xl hover:shadow-amber-500/40 transition-all"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10" />
          <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent hw-shimmer pointer-events-none" />

          <div className="relative flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/25 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/20 shadow-md">
              <Bell size={28} className="text-white animate-pulse" />
            </div>
            <div className="flex-1 text-white min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h2 className="text-[18px] font-extrabold drop-shadow-sm">Öğretmeninden Ödev Var!</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-white text-orange-600 text-[12px] font-extrabold shadow-sm">
                  {homeworkCount} test
                </span>
              </div>
              <p className="text-white/90 text-[13px] leading-relaxed">
                Öğretmenin sana <strong>{homeworkCount} test</strong> atadı. Önce bunları çözmen tavsiye edilir. Aşağıda turuncu kartlarda listeledim.
              </p>
            </div>
          </div>

          <style jsx>{`
            .hw-shimmer {
              animation: hw-shimmer 5s ease-in-out infinite;
            }
            @keyframes hw-shimmer {
              0% { transform: translateX(-200%) skewX(-12deg); }
              100% { transform: translateX(300%) skewX(-12deg); }
            }
          `}</style>
        </Link>
      )}

      {/* Özet kartlar */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6 grid-stagger">
        {[
          { label: 'Bekliyor', value: pendingCount, gradient: 'from-amber-500 to-orange-600', icon: AlertCircle, valueColor: 'text-amber-600' },
          { label: 'Tamamlanan', value: completedCount, gradient: 'from-emerald-500 to-teal-600', icon: CheckCircle, valueColor: 'text-emerald-600' },
          { label: 'Toplam', value: allAssignments.length, gradient: 'from-violet-500 to-purple-600', icon: BookOpen, valueColor: 'text-violet-600' },
        ].map(({ label, value, gradient, icon: Icon, valueColor }) => (
          <div key={label} className="relative bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 p-4 sm:p-5 shadow-sm overflow-hidden group hover:shadow-lg transition-all">
            <div className={`absolute -top-8 -right-8 w-28 h-28 rounded-full bg-gradient-to-br ${gradient} opacity-10 blur-2xl group-hover:opacity-25 transition-opacity`} />
            <div className="relative flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center shadow-md shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-[11px] text-gray-400 font-bold uppercase tracking-wider">{label}</p>
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
          { k: 'pending', label: 'Bekliyor' },
          { k: 'completed', label: 'Tamamlanan' },
        ] as const).map(f => (
          <button
            key={f.k}
            onClick={() => setFilter(f.k)}
            className={`px-4 py-2 rounded-xl text-[13px] font-extrabold transition-all active:scale-95 ${
              filter === f.k
                ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30'
                : 'bg-white/80 text-gray-600 hover:bg-white border border-white/60 hover:border-violet-300 hover:text-violet-600'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center animate-pulse shadow-lg">
            <ListChecks className="w-6 h-6 text-white" />
          </div>
          <p className="text-gray-500 text-sm font-medium">Yükleniyor...</p>
        </div>
      )}

      {/* ÖDEV LİSTESİ */}
      {!loading && filteredHomework.length > 0 && (
        <div className="mb-6" id="homework">
          <div className="flex items-center gap-2 mb-4 px-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
                <Sparkles size={15} className="text-white" />
              </div>
              <h3 className="text-[15px] font-extrabold text-[#0f2847]">Öğretmenimin Ödevleri</h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-extrabold border border-amber-200">
              {filteredHomework.length}
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-amber-300 to-transparent ml-2" />
          </div>
          <div className="space-y-3 grid-stagger">
            {filteredHomework.map(a => renderTestCard(a, 'homework'))}
          </div>
        </div>
      )}

      {/* DİĞER TESTLER */}
      {!loading && filteredOthers.length > 0 && (
        <div>
          {filteredHomework.length > 0 && (
            <div className="flex items-center gap-2 mb-4 px-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
                  <BookOpen size={15} className="text-white" />
                </div>
                <h3 className="text-[15px] font-extrabold text-[#0f2847]">Diğer Testler</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-[11px] font-extrabold border border-violet-200">
                {filteredOthers.length}
              </span>
              <div className="flex-1 h-px bg-gradient-to-r from-violet-300 to-transparent ml-2" />
            </div>
          )}
          <div className="space-y-3 grid-stagger">
            {filteredOthers.map(a => renderTestCard(a, 'normal'))}
          </div>
        </div>
      )}

      {!loading && filteredHomework.length === 0 && filteredOthers.length === 0 && (
        <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl border border-white/50 p-12 text-center shadow-sm overflow-hidden">
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-gradient-to-br from-violet-200 to-purple-200 opacity-30 blur-3xl" />
          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg animate-bounce" style={{ animationDuration: '2.5s' }}>
              <Inbox className="w-10 h-10 text-white" />
            </div>
            <p className="text-[17px] text-[#0f2847] font-extrabold mb-2">Bu kategoride test bulunamadı</p>
            <p className="text-gray-500 text-sm">Farklı bir filtre seç veya Tümü filtresini kullan.</p>
          </div>
        </div>
      )}
    </div>
  );
}
