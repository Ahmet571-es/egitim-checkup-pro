'use client';

import React, { useState } from 'react';
import { CheckCircle, Users, BookOpen, Send } from 'lucide-react';
import { ALL_TESTS } from '@/lib/tests/index';

interface ClassItem { id: string; name: string; grade: number; studentCount: number }
const DEMO_CLASSES: ClassItem[] = [
  { id: 'c1', name: '7-A', grade: 7, studentCount: 28 },
  { id: 'c2', name: '7-B', grade: 7, studentCount: 30 },
  { id: 'c3', name: '8-A', grade: 8, studentCount: 25 },
];

const CATEGORY_COLORS: Record<string, string> = {
  kisilik: '#8b5cf6', ogrenme: '#10b981', kariyer: '#f59e0b',
  dikkat: '#dc2626', akademik: '#059669', psikolojik: '#ef4444',
};

export default function AssignTestPage() {
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(new Set());
  const [dueDate, setDueDate] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleTest = (id: string) => {
    setSelectedTests(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleClass = (id: string) => {
    setSelectedClasses(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const handleAssign = async () => {
    if (selectedTests.size === 0 || selectedClasses.size === 0) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 800)); // Simüle
    setSuccess(true);
    setLoading(false);
    setTimeout(() => { setSuccess(false); setSelectedTests(new Set()); setSelectedClasses(new Set()); }, 3000);
  };

  const totalStudents = DEMO_CLASSES.filter(c => selectedClasses.has(c.id)).reduce((s, c) => s + c.studentCount, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#0f2847] mb-1">Test Ata</h1>
        <p className="text-gray-500 text-sm">Sınıflara veya öğrencilere test ata.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sol: Test Seçimi */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-5 shadow-sm">
            <h2 className="font-bold text-[#0f2847] mb-4 flex items-center gap-2">
              <BookOpen size={18} className="text-emerald-500" />
              Test Seç ({selectedTests.size} seçili)
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {ALL_TESTS.map(test => {
                const isSelected = selectedTests.has(test.id);
                return (
                  <button
                    key={test.id}
                    onClick={() => toggleTest(test.id)}
                    className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-transparent shadow-md'
                        : 'border-gray-100 hover:border-gray-200 bg-white'
                    }`}
                    style={isSelected ? { backgroundColor: test.color + '12', borderColor: test.color } : {}}
                  >
                    {/* Left accent */}
                    <div className="w-1 h-full rounded-full self-stretch min-h-[48px] flex-shrink-0"
                         style={{ backgroundColor: test.color }} />
                    <div className="text-xl flex-shrink-0">{test.icon}</div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[#0f2847] text-sm leading-tight">{test.shortName}</p>
                      <p className="text-gray-400 text-xs mt-0.5">{test.questionCount} soru · {test.estimatedMinutes} dk</p>
                    </div>
                    {isSelected && (
                      <CheckCircle size={18} className="flex-shrink-0 mt-0.5" style={{ color: test.color }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sağ: Sınıf ve Atama */}
        <div className="space-y-4">
          {/* Sınıf Seçimi */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-5 shadow-sm">
            <h2 className="font-bold text-[#0f2847] mb-4 flex items-center gap-2">
              <Users size={18} className="text-sky-500" />
              Sınıf Seç
            </h2>
            <div className="space-y-2">
              {DEMO_CLASSES.map(cls => {
                const isSelected = selectedClasses.has(cls.id);
                return (
                  <button
                    key={cls.id}
                    onClick={() => toggleClass(cls.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-sky-50 border-sky-300 shadow-sm'
                        : 'bg-white border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-[#0f2847] text-sm">{cls.name}</p>
                      <p className="text-gray-400 text-xs">{cls.studentCount} öğrenci</p>
                    </div>
                    {isSelected && <CheckCircle size={18} className="text-sky-500" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Son Tarih */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-5 shadow-sm">
            <label className="block text-sm font-semibold text-[#0f2847] mb-2">Son Teslim Tarihi (İsteğe bağlı)</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#10b981] text-gray-700"
            />
          </div>

          {/* Özet & Ata */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-5 shadow-sm">
            <h3 className="font-bold text-[#0f2847] text-sm mb-3">Atama Özeti</h3>
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex justify-between">
                <span>Seçili Test</span>
                <span className="font-bold text-[#0f2847]">{selectedTests.size}</span>
              </div>
              <div className="flex justify-between">
                <span>Seçili Sınıf</span>
                <span className="font-bold text-[#0f2847]">{selectedClasses.size}</span>
              </div>
              <div className="flex justify-between">
                <span>Toplam Öğrenci</span>
                <span className="font-bold text-emerald-600">{totalStudents}</span>
              </div>
              <div className="flex justify-between">
                <span>Toplam Atama</span>
                <span className="font-bold text-violet-600">{selectedTests.size * totalStudents}</span>
              </div>
            </div>

            {success ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                <p className="text-emerald-600 font-semibold text-sm">✅ Testler başarıyla atandı!</p>
              </div>
            ) : (
              <button
                onClick={handleAssign}
                disabled={selectedTests.size === 0 || selectedClasses.size === 0 || loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#10b981] text-white font-bold text-sm hover:bg-[#059669] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : <Send size={16} />}
                {loading ? 'Atanıyor...' : 'Testleri Ata'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
