'use client';

import React, { useState, useEffect } from 'react';
import { Play, Clock, CheckCircle, BookOpen, AlertCircle } from 'lucide-react';
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

export default function MyTestsPage() {
  const [completedTests, setCompletedTests] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Supabase'den tamamlanan testleri oku
  useEffect(() => {
    async function fetchCompletedTests() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data: results } = await supabase
          .from('test_results')
          .select('test_type')
          .eq('student_id', user.id);

        if (results && results.length > 0) {
          const completed = new Set<string>();
          results.forEach(r => {
            // test_type formatını test id'ye çevir (örn: "vark" veya "coklu_zeka" → "coklu-zeka")
            const testType = r.test_type?.replace(/_/g, '-') || '';
            completed.add(testType);
            // Ayrıca alt çizgili versiyonunu da ekle (eşleşme garantisi)
            completed.add(r.test_type || '');
          });
          setCompletedTests(completed);
        }
      } catch (err) {
        console.error('[my-tests] fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCompletedTests();
  }, []);

  const isTestCompleted = (testId: string) => {
    // Test ID'yi farklı formatlarla kontrol et
    return completedTests.has(testId) ||
      completedTests.has(testId.replace(/-/g, '_')) ||
      completedTests.has(testId.replace(/_/g, '-'));
  };

  const assignments = ALL_TESTS.map(t => ({
    id: `assign-${t.id}`,
    testId: t.id,
    status: isTestCompleted(t.id) ? 'completed' as const : 'pending' as const,
  }));

  const filtered = assignments.filter(a =>
    filter === 'all' ? true : a.status === filter
  );

  const getTest = (testId: string): RegisteredTest | undefined =>
    ALL_TESTS.find(t => t.id === testId);

  const pendingCount = assignments.filter(a => a.status === 'pending').length;
  const completedCount = assignments.filter(a => a.status === 'completed').length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#0f2847] mb-1">Testlerim</h1>
        <p className="text-gray-500 text-sm">Testleri çöz ve sonuçlarını gör.</p>
      </div>

      {/* Özet kartlar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Bekliyor', value: pendingCount, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100', icon: <AlertCircle size={18} className="text-amber-500" /> },
          { label: 'Tamamlanan', value: completedCount, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100', icon: <CheckCircle size={18} className="text-emerald-500" /> },
          { label: 'Toplam', value: assignments.length, color: 'text-violet-600', bg: 'bg-violet-50 border-violet-100', icon: <BookOpen size={18} className="text-violet-500" /> },
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

      {/* Test listesi */}
      {!loading && (
        <div className="space-y-3">
          {filtered.map(assignment => {
            const test = getTest(assignment.testId);
            if (!test) return null;
            const isCompleted = assignment.status === 'completed';

            return (
              <div
                key={assignment.id}
                className={`bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-5 flex items-center gap-4 shadow-sm transition-all hover:shadow-md ${
                  isCompleted ? 'opacity-80' : ''
                }`}
              >
                <div
                  className="w-1 h-14 rounded-full flex-shrink-0"
                  style={{ backgroundColor: isCompleted ? '#10b981' : test.color }}
                />
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ backgroundColor: isCompleted ? '#ecfdf5' : test.color + '15' }}
                >
                  {isCompleted ? <CheckCircle size={24} className="text-emerald-500" /> : test.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#0f2847] truncate">{test.name}</p>
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
                    href="/student/my-results"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-100 text-emerald-700 text-sm font-semibold hover:bg-emerald-200 transition-all flex-shrink-0"
                  >
                    <CheckCircle size={15} />
                    Sonuç
                  </Link>
                ) : (
                  <Link
                    href={`/student/my-tests/${assignment.testId}`}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-all flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: test.color }}
                  >
                    <Play size={15} />
                    Başla
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-10 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-gray-500">Bu kategoride test bulunamadı.</p>
        </div>
      )}
    </div>
  );
}
