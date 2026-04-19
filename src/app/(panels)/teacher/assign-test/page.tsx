'use client';

import { useState } from 'react';
import { CheckCircle, Users, BookOpen, Send, ClipboardList, Calendar, Target, Sparkles } from 'lucide-react';
import { ALL_TESTS } from '@/lib/tests/index';
import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';

interface ClassItem { id: string; name: string; grade: number; studentCount: number }
const DEMO_CLASSES: ClassItem[] = [
  { id: 'c1', name: '7-A', grade: 7, studentCount: 28 },
  { id: 'c2', name: '7-B', grade: 7, studentCount: 30 },
  { id: 'c3', name: '8-A', grade: 8, studentCount: 25 },
];

export default function AssignTestPage() {
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(new Set());
  const [dueDate, setDueDate] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleTest = (id: string) => {
    setSelectedTests(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const toggleClass = (id: string) => {
    setSelectedClasses(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const handleAssign = async () => {
    if (selectedTests.size === 0 || selectedClasses.size === 0) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setSuccess(true);
    setLoading(false);
    setTimeout(() => { setSuccess(false); setSelectedTests(new Set()); setSelectedClasses(new Set()); }, 3000);
  };

  const totalStudents = DEMO_CLASSES.filter(c => selectedClasses.has(c.id)).reduce((s, c) => s + c.studentCount, 0);

  return (
    <div>
      <PageHeader
        role="teacher"
        icon={ClipboardList}
        title="Test Ata"
        subtitle="Sınıflara veya öğrencilere test atayın, süre belirleyin"
      />

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Sol: Test Seçimi */}
        <div className="lg:col-span-2">
          <SectionCard
            icon={BookOpen}
            title="Test Seç"
            subtitle={`${selectedTests.size} test seçildi`}
            gradient="from-emerald-500 via-teal-500 to-cyan-600"
          >
            <div className="grid sm:grid-cols-2 gap-3">
              {ALL_TESTS.map(test => {
                const isSelected = selectedTests.has(test.id);
                return (
                  <button
                    key={test.id}
                    onClick={() => toggleTest(test.id)}
                    className={`relative flex items-start gap-3 p-4 rounded-2xl text-left transition-all overflow-hidden group ${
                      isSelected
                        ? 'shadow-lg scale-[1.02]'
                        : 'border border-gray-100 hover:border-gray-200 bg-white hover:shadow-md'
                    }`}
                    style={isSelected ? {
                      backgroundColor: test.color + '15',
                      borderColor: test.color,
                      borderWidth: '2px',
                      boxShadow: `0 8px 20px ${test.color}30`,
                    } : {}}
                  >
                    {isSelected && (
                      <div
                        className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-20 pointer-events-none"
                        style={{ backgroundColor: test.color }}
                      />
                    )}
                    <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: test.color, minHeight: '48px' }} />
                    <div className="text-2xl shrink-0 group-hover:scale-110 transition-transform">{test.icon}</div>
                    <div className="min-w-0 flex-1 relative">
                      <p className="font-extrabold text-[#0f2847] text-[13px] leading-tight">{test.shortName}</p>
                      <p className="text-gray-500 text-[11px] mt-0.5">{test.questionCount} soru · {test.estimatedMinutes} dk</p>
                    </div>
                    {isSelected && (
                      <CheckCircle size={20} className="shrink-0 mt-0.5" style={{ color: test.color }} />
                    )}
                  </button>
                );
              })}
            </div>
          </SectionCard>
        </div>

        {/* Sağ: Sınıf + Özet */}
        <div className="space-y-4">
          {/* Sınıf Seçimi */}
          <SectionCard
            icon={Users}
            title="Sınıf Seç"
            subtitle={`${selectedClasses.size} sınıf seçildi`}
            gradient="from-sky-500 to-blue-600"
            delay={80}
          >
            <div className="space-y-2">
              {DEMO_CLASSES.map(cls => {
                const isSelected = selectedClasses.has(cls.id);
                return (
                  <button
                    key={cls.id}
                    onClick={() => toggleClass(cls.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all active:scale-[0.98] ${
                      isSelected
                        ? 'bg-gradient-to-r from-sky-50 to-blue-50 border-2 border-sky-400 shadow-sm'
                        : 'bg-white border border-gray-100 hover:border-sky-200 hover:bg-sky-50/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? 'bg-gradient-to-br from-sky-500 to-blue-600 shadow-md'
                          : 'bg-sky-100'
                      }`}>
                        <Users className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-sky-600'}`} />
                      </div>
                      <div>
                        <p className="font-extrabold text-[#0f2847] text-[13.5px]">{cls.name}</p>
                        <p className="text-gray-500 text-[11px]">{cls.studentCount} öğrenci</p>
                      </div>
                    </div>
                    {isSelected && <CheckCircle size={20} className="text-sky-600" />}
                  </button>
                );
              })}
            </div>
          </SectionCard>

          {/* Tarih */}
          <SectionCard
            icon={Calendar}
            title="Son Teslim Tarihi"
            subtitle="İsteğe bağlı"
            gradient="from-amber-500 to-orange-600"
            delay={160}
          >
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 text-gray-700 transition-all"
            />
          </SectionCard>

          {/* Özet + Butonu */}
          <div className="relative bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 rounded-3xl p-5 text-white shadow-xl shadow-emerald-500/30 overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-cyan-200/20 blur-3xl" />

            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5" />
                <h3 className="font-extrabold text-[14px]">Atama Özeti</h3>
              </div>
              <div className="space-y-2 text-[13px] mb-5">
                <div className="flex justify-between items-center">
                  <span className="text-white/85">Seçili Test</span>
                  <span className="font-extrabold tabular-nums text-lg">{selectedTests.size}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/85">Seçili Sınıf</span>
                  <span className="font-extrabold tabular-nums text-lg">{selectedClasses.size}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/85">Toplam Öğrenci</span>
                  <span className="font-extrabold tabular-nums text-lg">{totalStudents}</span>
                </div>
                <div className="pt-2 mt-2 border-t border-white/20 flex justify-between items-center">
                  <span className="text-white font-semibold">Toplam Atama</span>
                  <span className="font-extrabold tabular-nums text-2xl drop-shadow-md">{selectedTests.size * totalStudents}</span>
                </div>
              </div>

              {success ? (
                <div className="bg-white text-emerald-700 rounded-xl p-3 text-center flex items-center justify-center gap-2 shadow-lg">
                  <Sparkles className="w-4 h-4" />
                  <p className="font-extrabold text-[13px]">Testler başarıyla atandı!</p>
                </div>
              ) : (
                <button
                  onClick={handleAssign}
                  disabled={selectedTests.size === 0 || selectedClasses.size === 0 || loading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-emerald-700 font-extrabold text-[13.5px] hover:bg-emerald-50 transition-all disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97] shadow-lg"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      Atanıyor...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Testleri Ata
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
