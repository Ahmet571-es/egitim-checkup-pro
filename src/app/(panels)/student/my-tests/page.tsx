'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Play, Clock, CheckCircle, BookOpen, AlertCircle, Target, Sparkles, Bell } from 'lucide-react';
import Link from 'next/link';
import { ALL_TESTS } from '@/lib/tests/index';
import type { RegisteredTest } from '@/lib/tests/types';
import { createClient } from '@/lib/supabase/client';

const CATEGORY_LABELS: Record<string, string> = {
  kisilik: 'Kişilik',
  ogrenme: 'Öğrenme',
  kariyer: 'Kariyer',
  dikkat: 'Dikkat',
  akademik: 'Akademik',
  psikolojik: 'Psikolojik',
};

// test_type normalize: tire ↔ alt çizgi
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

        // Öğretmen atamalarını user_metadata'dan oku
        const meta = user.user_metadata || {};
        const assigned = (meta.assigned_tests as string[]) || [];
        setAssignedTests(new Set(assigned.map(norm)));

        // Tamamlanan testleri DB'den oku
        const { data: results } = await supabase
          .from('test_results')
          .select('test_type')
          .eq('student_id', user.id)
          .not('completed_at', 'is', null);

        if (results && results.length > 0) {
          const completed = new Set<string>();
          results.forEach(r => {
            completed.add(norm(r.test_type || ''));
          });
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

  // Ödevler: atanmış VE tamamlanmamış
  const homework = allAssignments.filter(a => a.isAssigned && !a.isCompleted);
  // Diğerleri: geri kalan her şey
  const others = allAssignments.filter(a => !(a.isAssigned && !a.isCompleted));

  // Filtre uygula
  const applyFilter = (list: typeof allAssignments) =>
    list.filter(a =>
      filter === 'all' ? true :
      filter === 'pending' ? !a.isCompleted :
      a.isCompleted
    );

  const filteredHomework = applyFilter(homework);
  const filteredOthers = applyFilter(others);

  const getTest = (testId: string): RegisteredTest | undefined =>
    ALL_TESTS.find(t => t.id === testId);

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
        className={`
          ${isHomeworkCard
            ? 'bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-300 shadow-md hover:shadow-lg'
            : 'bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm hover:shadow-md'}
          rounded-2xl p-5 flex items-center gap-4 transition-all
          ${isCompleted ? 'opacity-80' : ''}
        `}
      >
        <div
          className="w-1 h-14 rounded-full flex-shrink-0"
          style={{ backgroundColor: isCompleted ? '#10b981' : (isHomeworkCard ? '#f59e0b' : test.color) }}
        />
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ backgroundColor: isCompleted ? '#ecfdf5' : (isHomeworkCard ? '#fef3c7' : test.color + '15') }}
        >
          {isCompleted ? <CheckCircle size={24} className="text-emerald-500" /> : test.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-[#0f2847] truncate">{test.name}</p>
            {isAssigned && !isCompleted && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm animate-pulse">
                <Target size={10} />
                ÖDEV
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock size={11} /> {test.estimatedMinutes} dk
            </span>
            <span className="text-xs text-gray-400">{test.questionCount} soru</span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: test.color + '15', color: test.color }}
            >
              {CATEGORY_LABELS[test.category] ?? test.category}
            </span>
            {isCompleted && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700">
                ✓ Tamamlandı
              </span>
            )}
          </div>
        </div>
        {isCompleted ? (
          <Link
            href={`/student/my-tests/${assignment.testId}`}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-100 text-emerald-700 text-sm font-semibold hover:bg-emerald-200 transition-all flex-shrink-0"
          >
            <Play size={15} />
            Tekrar Çöz
          </Link>
        ) : (
          <Link
            href={`/student/my-tests/${assignment.testId}`}
            className={`
              flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-all flex-shrink-0 shadow-sm
              ${isHomeworkCard ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-200' : ''}
            `}
            style={isHomeworkCard ? undefined : { backgroundColor: test.color }}
          >
            <Play size={15} />
            {isHomeworkCard ? 'Hemen Çöz' : 'Başla'}
          </Link>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#0f2847] mb-1">Testlerim</h1>
        <p className="text-gray-500 text-sm">Testleri çöz ve sonuçlarını gör.</p>
      </div>

      {/* ÖDEV BANNER'I */}
      {!loading && homeworkCount > 0 && (
        <div className="relative overflow-hidden bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 rounded-2xl p-5 mb-6 shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10" />
          <div className="absolute bottom-0 left-1/3 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
          <div className="relative flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 animate-pulse">
              <Bell size={24} className="text-white" />
            </div>
            <div className="flex-1 text-white">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h2 className="text-[17px] font-extrabold">Öğretmeninden Ödev Var!</h2>
                <span className="px-2 py-0.5 rounded-full bg-white/25 text-white text-[11px] font-bold">
                  {homeworkCount} test
                </span>
              </div>
              <p className="text-white/90 text-[13px]">
                Öğretmenin sana <strong>{homeworkCount} test</strong> atadı. Önce bunları çözmen tavsiye edilir. Aşağıda turuncu kartlarda listeledim.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Özet kartlar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Bekliyor', value: pendingCount, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100', icon: <AlertCircle size={18} className="text-amber-500" /> },
          { label: 'Tamamlanan', value: completedCount, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100', icon: <CheckCircle size={18} className="text-emerald-500" /> },
          { label: 'Toplam', value: allAssignments.length, color: 'text-violet-600', bg: 'bg-violet-50 border-violet-100', icon: <BookOpen size={18} className="text-violet-500" /> },
        ].map(({ label, value, color, bg, icon }) => (
          <div key={label} className={`${bg} border rounded-2xl p-4 flex items-center gap-3`}>
            {icon}
            <div>
              <p className={`font-extrabold text-2xl ${color}`}>{loading ? '—' : value}</p>
              <p className="text-gray-500 text-xs">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtreler */}
      <div className="flex gap-2 mb-5">
        {(['all', 'pending', 'completed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              filter === f
                ? 'bg-[#0f2847] text-white shadow-sm'
                : 'bg-white/70 text-gray-500 hover:bg-white border border-white/40'
            }`}
          >
            {f === 'all' ? 'Tümü' : f === 'pending' ? 'Bekliyor' : 'Tamamlanan'}
          </button>
        ))}
      </div>

      {/* Yükleniyor */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* ÖDEV LİSTESİ */}
      {!loading && filteredHomework.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="flex items-center gap-1.5">
              <Sparkles size={16} className="text-amber-500" />
              <h3 className="text-[14px] font-extrabold text-[#0f2847]">
                Öğretmenimin Ödevleri
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-bold">
              {filteredHomework.length}
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-amber-200 to-transparent ml-2" />
          </div>
          <div className="space-y-3">
            {filteredHomework.map(a => renderTestCard(a, 'homework'))}
          </div>
        </div>
      )}

      {/* DİĞER TESTLER */}
      {!loading && filteredOthers.length > 0 && (
        <div>
          {filteredHomework.length > 0 && (
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="flex items-center gap-1.5">
                <BookOpen size={16} className="text-violet-500" />
                <h3 className="text-[14px] font-extrabold text-[#0f2847]">
                  Diğer Testler
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-[11px] font-bold">
                {filteredOthers.length}
              </span>
              <div className="flex-1 h-px bg-gradient-to-r from-violet-200 to-transparent ml-2" />
            </div>
          )}
          <div className="space-y-3">
            {filteredOthers.map(a => renderTestCard(a, 'normal'))}
          </div>
        </div>
      )}

      {/* Hiç test yok */}
      {!loading && filteredHomework.length === 0 && filteredOthers.length === 0 && (
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-10 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-gray-500">Bu kategoride test bulunamadı.</p>
        </div>
      )}
    </div>
  );
}
