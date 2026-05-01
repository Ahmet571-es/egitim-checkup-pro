'use client';
/**
 * Faz 8: Öğretmen AI Koç Sayfası
 *
 * Öğretmen, kendisine atanmış öğrenciler arasından birini seçer ve hakkında
 * pedagojik destek alır. KVKK: tam veri görür (öğretmen yetkisi).
 */
import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Sparkles, GraduationCap, Search, AlertCircle, Loader2, User } from 'lucide-react';
import CoachChat from '@/components/CoachChat';

interface Student {
  id: string;
  full_name: string;
  grade: string | null;
}

export default function TeacherCoachPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('Giriş yapmamışsınız.');
          setLoading(false);
          return;
        }

        // Mevcut /api/teacher/students endpoint'i kullan (action: 'list' tipi)
        // CSRF token cookie'den okunur
        const csrfMatch = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
        const csrf = csrfMatch ? decodeURIComponent(csrfMatch[1]) : '';

        const res = await fetch('/api/teacher/students', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(csrf ? { 'x-csrf-token': csrf } : {}),
          },
          body: JSON.stringify({ action: 'list' }),
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Öğrenci listesi alınamadı.');
          setLoading(false);
          return;
        }

        setStudents(data.students || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) =>
      s.full_name.toLowerCase().includes(q) ||
      (s.grade || '').toLowerCase().includes(q),
    );
  }, [students, search]);

  const selectedStudent = students.find((s) => s.id === selectedStudentId) || null;

  return (
    <div className="space-y-5">
      {/* Başlık */}
      <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-[-30px] right-[-30px] w-[200px] h-[200px] rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-extrabold mb-1">Pedagojik Koç</h1>
            <p className="text-sm text-emerald-100 leading-relaxed">
              Bir öğrenci hakkında profesyonel danışmanlık, sınıf içi yaklaşım önerileri ve test verisi yorumu.
            </p>
          </div>
        </div>
      </div>

      {/* Loading / Error / Empty */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <p className="text-sm text-rose-800">{error}</p>
        </div>
      ) : students.length === 0 ? (
        <div className="p-8 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 text-center">
          <GraduationCap className="w-10 h-10 text-emerald-300 mx-auto mb-3" />
          <p className="font-bold text-[#0f2847] dark:text-slate-100 mb-1">
            Atanmış öğrenci yok
          </p>
          <p className="text-[13px] text-gray-600 dark:text-slate-400 max-w-md mx-auto">
            AI Koç ile danışmak için önce öğrencileriniz olmalı.
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[280px_1fr] gap-4">
          {/* Sol: öğrenci listesi */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 shadow-sm overflow-hidden">
            <div className="p-3 border-b border-emerald-100 dark:border-emerald-900/30">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Öğrenci ara..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400"
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5 px-1">
                {filteredStudents.length} öğrenci
              </p>
            </div>
            <div className="max-h-[520px] overflow-y-auto">
              {filteredStudents.length === 0 ? (
                <div className="py-8 text-center text-[12px] text-gray-500">
                  Eşleşen öğrenci yok
                </div>
              ) : (
                <ul>
                  {filteredStudents.map((s) => (
                    <li key={s.id}>
                      <button
                        onClick={() => setSelectedStudentId(s.id)}
                        className={`w-full text-left px-3 py-2.5 flex items-center gap-2 border-b border-gray-50 dark:border-slate-800/50 transition-colors ${
                          selectedStudentId === s.id
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-l-4 border-l-emerald-500'
                            : 'hover:bg-gray-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white shrink-0">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-[12px] text-[#0f2847] dark:text-slate-100 truncate">
                            {s.full_name}
                          </div>
                          {s.grade && (
                            <div className="text-[10px] text-gray-500 dark:text-slate-400">
                              {s.grade}. Sınıf
                            </div>
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Sağ: sohbet alanı */}
          <div>
            {selectedStudent ? (
              <CoachChat
                role="teacher"
                studentId={selectedStudent.id}
                studentName={selectedStudent.full_name}
              />
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm py-12 text-center">
                <GraduationCap className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="font-bold text-[#0f2847] dark:text-slate-100 mb-1">
                  Bir öğrenci seçin
                </p>
                <p className="text-[12px] text-gray-500 max-w-sm mx-auto">
                  Soldaki listeden bir öğrenci seçtikten sonra bu öğrenci hakkında AI ile sohbet edebilirsiniz.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
