'use client';
/**
 * Faz 5: School admin için Genetik Rapor Yönetim Sayfası
 *
 * Akış:
 *   1. Sayfa açıldığında okulun öğrencileri listelenir
 *   2. School admin arama yapar / öğrenciyi seçer
 *   3. Seçilen öğrencinin GeneticReportsSection'ı altta gösterilir
 *   4. school_admin yükleme + indirme + silme yapabilir (komponent kendi içinde role belirler)
 *
 * KVKK m.6 — Sayfa yetki kontrolü:
 *   • Layout role="school_admin" olduğu için RBAC proxy bu sayfaya yalnızca
 *     school_admin (ve admin override eden) erişimi verir.
 *   • API endpoint'leri ayrıca server-side kontrol yapar (defense-in-depth).
 */
import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Search, User, GraduationCap, Loader2, ChevronRight, Shield, AlertCircle } from 'lucide-react';
import GeneticReportsSection from '@/components/GeneticReportsSection';

interface Student {
  id: string;
  full_name: string;
  email: string | null;
  grade: string | null;
}

export default function SchoolGeneticReportsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // ── Öğrencileri çek (school_admin'in kendi okulundakiler) ──
  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('Yetkisiz erişim.');
          setLoading(false);
          return;
        }

        // School admin'in school_id'sini al
        const { data: viewerProfile } = await supabase
          .from('profiles')
          .select('school_id')
          .eq('id', user.id)
          .maybeSingle();

        if (!viewerProfile?.school_id) {
          setError('Okul bilginiz tanımlı değil. Lütfen sistem yöneticisi ile iletişime geçin.');
          setLoading(false);
          return;
        }

        const { data: kids, error: listErr } = await supabase
          .from('profiles')
          .select('id, full_name, email, grade')
          .eq('role', 'student')
          .eq('school_id', viewerProfile.school_id)
          .order('full_name');

        if (listErr) {
          setError(listErr.message);
        } else {
          setStudents(kids || []);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Arama filtresi ──
  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.full_name.toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q) ||
        (s.grade || '').toLowerCase().includes(q)
    );
  }, [students, search]);

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedId) || null,
    [students, selectedId]
  );

  return (
    <div className="space-y-5">
      {/* Sayfa başlığı */}
      <div className="bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-[-30px] right-[-30px] w-[200px] h-[200px] rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-xl sm:text-2xl font-extrabold">Genetik Rapor Yönetimi</h1>
              <span className="text-[10px] font-bold bg-white/25 px-2 py-0.5 rounded-full uppercase tracking-wider">KVKK m.6</span>
            </div>
            <p className="text-sm text-violet-100 leading-relaxed">
              Genetik rapor PDF&apos;lerini öğrencilere yükleyin. Veliler ve öğrenciler bu raporlara erişemez.
            </p>
          </div>
        </div>
      </div>

      {/* Hata */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <p className="text-sm text-rose-800 dark:text-rose-300">{error}</p>
        </div>
      )}

      {!error && (
        <div className="grid lg:grid-cols-[340px_1fr] gap-5">
          {/* Sol: öğrenci listesi */}
          <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
            <div className="p-4 border-b border-gray-100 dark:border-slate-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Öğrenci ara..."
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-2">
                {loading ? 'Yükleniyor...' : `${filteredStudents.length} öğrenci`}
              </p>
            </div>

            <div className="max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-500 dark:text-slate-400">
                  {search.trim() ? 'Eşleşen öğrenci yok' : 'Okulda öğrenci bulunamadı'}
                </div>
              ) : (
                <ul>
                  {filteredStudents.map((s) => (
                    <li key={s.id}>
                      <button
                        onClick={() => setSelectedId(s.id)}
                        className={`w-full text-left px-4 py-3 flex items-center gap-3 border-b border-gray-50 dark:border-slate-800/50 transition-colors ${
                          selectedId === s.id
                            ? 'bg-violet-50 dark:bg-violet-950/30 border-l-4 border-l-violet-500'
                            : 'hover:bg-gray-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm text-[#0f2847] dark:text-slate-100 truncate">
                            {s.full_name}
                          </div>
                          <div className="text-[11px] text-gray-500 dark:text-slate-400 flex items-center gap-2">
                            {s.grade && (
                              <span className="flex items-center gap-0.5">
                                <GraduationCap className="w-3 h-3" /> {s.grade}. Sınıf
                              </span>
                            )}
                            {s.email && <span className="truncate">{s.email}</span>}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Sağ: seçilen öğrenci için Section */}
          <div>
            {selectedStudent ? (
              <>
                <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-white to-violet-50/50 dark:from-slate-800/60 dark:to-violet-950/20 border border-violet-200 dark:border-violet-900/40">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                      <User className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-[#0f2847] dark:text-slate-100 text-lg truncate">
                        {selectedStudent.full_name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                        {selectedStudent.grade && <span>{selectedStudent.grade}. Sınıf</span>}
                        {selectedStudent.email && <span className="truncate">· {selectedStudent.email}</span>}
                      </div>
                    </div>
                  </div>
                </div>

                <GeneticReportsSection
                  studentId={selectedStudent.id}
                  studentName={selectedStudent.full_name}
                />
              </>
            ) : (
              <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm py-16 text-center">
                <Shield className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="font-bold text-[#0f2847] dark:text-slate-100 mb-1">
                  Bir öğrenci seçin
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 max-w-sm mx-auto">
                  Soldaki listeden bir öğrenci seçin; o öğrencinin genetik raporlarını görüntüleyin, yeni rapor yükleyin veya silin.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
