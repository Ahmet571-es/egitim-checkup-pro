'use client';

import React, { useState, useEffect } from 'react';
import { Play, Clock, CheckCircle, BookOpen, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { ALL_TESTS } from '@/lib/tests/index';
import type { RegisteredTest } from '@/lib/tests/types';

interface Assignment {
  id: string;
  testId: string;
  dueDate?: string;
  status: 'pending' | 'in_progress' | 'completed';
  assignedBy?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  kisilik: 'Kişilik',
  ogrenme: 'Öğrenme',
  kariyer: 'Kariyer',
  dikkat: 'Dikkat',
  akademik: 'Akademik',
  psikolojik: 'Psikolojik',
};

// Demo: tüm testleri göster (gerçekte Supabase'den gelecek)
const DEMO_ASSIGNMENTS: Assignment[] = ALL_TESTS.map(t => ({
  id: `assign-${t.id}`,
  testId: t.id,
  status: 'pending',
}));

export default function MyTestsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>(DEMO_ASSIGNMENTS);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const filtered = assignments.filter(a =>
    filter === 'all' ? true : a.status === filter
  );

  const getTest = (testId: string): RegisteredTest | undefined =>
    ALL_TESTS.find(t => t.id === testId);

  const pendingCount = assignments.filter(a => a.status === 'pending').length;
  const completedCount = assignments.filter(a => a.status === 'completed').length;

  return (
    <div>
      {/* Başlık */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#0f2847] mb-1">Testlerim</h1>
        <p className="text-gray-500 text-sm">Sana atanan testleri çöz ve sonuçlarını gör.</p>
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
              <p className={`font-extrabold text-2xl ${color}`}>{value}</p>
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

      {/* Test listesi */}
      <div className="space-y-3">
        {filtered.map(assignment => {
          const test = getTest(assignment.testId);
          if (!test) return null;
          const isCompleted = assignment.status === 'completed';

          return (
            <div
              key={assignment.id}
              className={`bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-5 flex items-center gap-4 shadow-sm transition-all hover:shadow-md ${
                isCompleted ? 'opacity-70' : ''
              }`}
            >
              {/* Sol border accent */}
              <div
                className="w-1 h-14 rounded-full flex-shrink-0"
                style={{ backgroundColor: isCompleted ? '#9ca3af' : test.color }}
              />

              {/* İkon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ backgroundColor: test.color + '15' }}
              >
                {test.icon}
              </div>

              {/* Bilgi */}
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
                </div>
              </div>

              {/* Aksiyon */}
              {isCompleted ? (
                <Link
                  href={`/student/my-results`}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 text-gray-500 text-sm font-semibold hover:bg-gray-200 transition-all flex-shrink-0"
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

      {filtered.length === 0 && (
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-10 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-gray-500">Bu kategoride test bulunamadı.</p>
        </div>
      )}
    </div>
  );
}
