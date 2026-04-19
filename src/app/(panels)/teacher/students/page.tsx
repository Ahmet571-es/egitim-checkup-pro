'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { secureFetch } from '@/lib/csrf-client';
import {
  FolderOpen, ChevronRight, GraduationCap, AlertCircle, Users, Bell, Award, Search, X,
  School, Layers, Inbox
} from 'lucide-react';
import WelcomeBanner from '@/components/ui/WelcomeBanner';
import { CardGridSkeleton, StatCardsGrid } from '@/components/ui/Skeleton';

interface StudentRow {
  id: string;
  full_name: string;
  grade: string | null;
  section: string | null;
  completed_count: number;
  assigned_pending_count: number;
}

type ActiveTree = Record<string, Record<string, Record<string, StudentRow[]>>>;
type GradTree = Record<string, StudentRow[]>;

export default function StudentsPage() {
  const [active, setActive] = useState<ActiveTree>({});
  const [graduated, setGraduated] = useState<GradTree>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [openSchool, setOpenSchool] = useState<string | null>(null);
  const [openGrade, setOpenGrade] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<string | null>(null);

  const [openGradSchool, setOpenGradSchool] = useState<string | null>(null);
  const [showGraduatesSection, setShowGraduatesSection] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedStudentId, setHighlightedStudentId] = useState<string | null>(null);
  const studentRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());

  interface FlatStudent {
    student: StudentRow;
    schoolName: string;
    gradeKey: string | null;
    sectionKey: string | null;
    isGraduated: boolean;
    pathKeys: {
      school: string;
      grade?: string;
      section?: string;
    };
  }

  const allStudentsFlat = useMemo<FlatStudent[]>(() => {
    const list: FlatStudent[] = [];

    for (const [schoolName, gradeMap] of Object.entries(active)) {
      for (const [gradeKey, secMap] of Object.entries(gradeMap)) {
        for (const [secKey, students] of Object.entries(secMap)) {
          for (const s of students) {
            list.push({
              student: s,
              schoolName,
              gradeKey,
              sectionKey: secKey,
              isGraduated: false,
              pathKeys: {
                school: schoolName,
                grade: `${schoolName}::${gradeKey}`,
                section: `${schoolName}::${gradeKey}::${secKey}`,
              },
            });
          }
        }
      }
    }

    for (const [schoolName, students] of Object.entries(graduated)) {
      for (const s of students) {
        list.push({
          student: s,
          schoolName,
          gradeKey: null,
          sectionKey: null,
          isGraduated: true,
          pathKeys: { school: schoolName },
        });
      }
    }

    return list;
  }, [active, graduated]);

  const searchResults = useMemo<FlatStudent[]>(() => {
    const q = searchQuery.trim();
    if (q.length < 1) return [];
    const qNorm = q.toLocaleLowerCase('tr-TR');
    return allStudentsFlat.filter((fs) =>
      fs.student.full_name.toLocaleLowerCase('tr-TR').includes(qNorm)
    );
  }, [searchQuery, allStudentsFlat]);

  const isSearching = searchQuery.trim().length > 0;

  const openStudentPath = (fs: FlatStudent) => {
    setSearchQuery('');

    if (fs.isGraduated) {
      setShowGraduatesSection(true);
      setOpenGradSchool(fs.schoolName);
    } else {
      setOpenSchool(fs.schoolName);
      if (fs.pathKeys.grade) setOpenGrade(fs.pathKeys.grade);
      if (fs.pathKeys.section) setOpenSection(fs.pathKeys.section);
    }

    setHighlightedStudentId(fs.student.id);

    setTimeout(() => {
      const el = studentRefs.current.get(fs.student.id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);

    setTimeout(() => setHighlightedStudentId(null), 3500);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await secureFetch('/api/teacher/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'list' }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Sunucu hatası');
        setActive(data.active || {});
        setGraduated(data.graduated || {});
      } catch (e: unknown) {
        setError((e as Error).message);
      }
      setLoading(false);
    })();
  }, []);

  const activeStudentCount = Object.values(active).reduce(
    (sum, gradeMap) => sum + Object.values(gradeMap).reduce(
      (s2, secMap) => s2 + Object.values(secMap).reduce((s3, arr) => s3 + arr.length, 0), 0
    ), 0
  );
  const graduatedCount = Object.values(graduated).reduce((s, arr) => s + arr.length, 0);
  const totalStudents = activeStudentCount + graduatedCount;
  const totalSchools = new Set([...Object.keys(active), ...Object.keys(graduated)]).size;

  return (
    <div>
      <WelcomeBanner
        role="teacher"
        title="Öğrencilerim"
        subtitle="Öğrenciler okul → sınıf → şube → ad-soyad sırasıyla otomatik gruplanır. Mezunlar ayrı bir klasörde listelenir."
        badge="Öğrenci Yönetimi"
        emoji="👥"
      />

      {/* Premium Stats */}
      {!loading && (
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6 grid-stagger">
          <div className="relative bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-700/60 p-4 sm:p-5 shadow-sm overflow-hidden group hover:shadow-lg transition-all">
            <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 opacity-10 blur-2xl group-hover:opacity-25 transition-opacity" />
            <div className="relative flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shrink-0">
                <School className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-[11px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider">Okul</p>
                <p className="text-xl sm:text-2xl font-extrabold text-[#0f2847] dark:text-slate-100 tabular-nums">{totalSchools}</p>
              </div>
            </div>
          </div>
          <div className="relative bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-700/60 p-4 sm:p-5 shadow-sm overflow-hidden group hover:shadow-lg transition-all">
            <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 opacity-10 blur-2xl group-hover:opacity-25 transition-opacity" />
            <div className="relative flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-[11px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider">Aktif</p>
                <p className="text-xl sm:text-2xl font-extrabold text-sky-600 tabular-nums">{activeStudentCount}</p>
              </div>
            </div>
          </div>
          <div className="relative bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-700/60 p-4 sm:p-5 shadow-sm overflow-hidden group hover:shadow-lg transition-all">
            <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 opacity-10 blur-2xl group-hover:opacity-25 transition-opacity" />
            <div className="relative flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-[11px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider">Mezun</p>
                <p className="text-xl sm:text-2xl font-extrabold text-amber-600 tabular-nums">{graduatedCount}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-sm text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Premium Search */}
      {!loading && totalStudents > 0 && (
        <div className="mb-5 animate-fade-in-up">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/0 via-emerald-400/40 to-emerald-400/0 rounded-2xl blur-lg opacity-0 group-focus-within:opacity-60 transition-opacity" />
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md pointer-events-none">
                <Search className="w-4 h-4 text-white" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Öğrenci ara (ad veya soyad)..."
                className="w-full pl-16 pr-12 py-4 rounded-2xl bg-white/90 dark:bg-slate-800/80 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 shadow-sm text-[14px] font-medium text-[#0f2847] dark:text-slate-100 placeholder:text-gray-400 dark:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 focus:bg-white dark:bg-slate-800 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-gray-100 dark:bg-slate-700/60 transition"
                  title="Aramayı temizle"
                >
                  <X className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                </button>
              )}
            </div>
          </div>
          {isSearching && (
            <p className="text-[12px] text-gray-500 dark:text-slate-400 mt-2.5 ml-1 font-medium">
              {searchResults.length === 0
                ? '🔍 Eşleşen öğrenci bulunamadı.'
                : `🔍 ${searchResults.length} öğrenci bulundu.`}
            </p>
          )}
        </div>
      )}

      {/* Search Results */}
      {isSearching && !loading && (
        <div className="space-y-2 mb-6 grid-stagger">
          {searchResults.map((fs) => {
            const s = fs.student;
            const breadcrumb = fs.isGraduated
              ? `🎓 Mezunlar → ${fs.schoolName}`
              : `${fs.schoolName} → ${fs.gradeKey} → ${fs.sectionKey}`;
            return (
              <button
                key={s.id}
                onClick={() => openStudentPath(fs)}
                className="w-full text-left bg-white/90 dark:bg-slate-800/80 backdrop-blur-xl border border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/60 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex items-center gap-3 group"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-md ${fs.isGraduated ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-emerald-500 to-teal-600'}`}>
                  {fs.isGraduated ? (
                    <Award className="w-5 h-5 text-white" />
                  ) : (
                    <GraduationCap className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-[#0f2847] dark:text-slate-100 truncate">{s.full_name}</p>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400 truncate">{breadcrumb}</p>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">
                    {s.completed_count} test tamamlandı
                    {s.assigned_pending_count > 0 && ` · ${s.assigned_pending_count} bekliyor`}
                  </p>
                </div>
                {s.assigned_pending_count > 0 && (
                  <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-200">
                    <Bell className="w-3 h-3" /> {s.assigned_pending_count}
                  </span>
                )}
                <ChevronRight className="w-5 h-5 text-emerald-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <CardGridSkeleton count={6} cols={3} />
      ) : totalStudents === 0 ? (
        <div className="relative bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl border border-white/50 dark:border-slate-700/60 p-12 text-center shadow-sm overflow-hidden">
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-gradient-to-br from-emerald-200 to-teal-200 opacity-20 blur-3xl" />
          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg animate-bounce" style={{ animationDuration: '2.5s' }}>
              <Inbox className="w-10 h-10 text-white" />
            </div>
            <p className="text-[17px] text-[#0f2847] dark:text-slate-100 font-extrabold mb-2">Henüz size atanmış öğrenci yok</p>
            <p className="text-gray-500 dark:text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
              Öğrenciler kayıt sırasında sizi seçtiğinde burada görünecek. Kayıt linkinizi öğrencilerinizle paylaşabilirsiniz.
            </p>
          </div>
        </div>
      ) : (
        <div className={`space-y-3 ${isSearching ? 'hidden' : ''}`}>
          {/* ═══ AKTİF ÖĞRENCİLER ═══ */}
          {Object.entries(active).map(([schoolName, gradeMap]) => {
            const schoolStudentCount = Object.values(gradeMap).reduce(
              (s, secMap) => s + Object.values(secMap).reduce((s2, arr) => s2 + arr.length, 0), 0
            );
            const gradeCount = Object.keys(gradeMap).length;
            const schoolAlerts = Object.values(gradeMap).flatMap(
              (secMap) => Object.values(secMap).flat()
            ).reduce((s, st) => s + st.assigned_pending_count, 0);
            const isSchoolOpen = openSchool === schoolName;

            return (
              <div key={schoolName} className={`bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border shadow-sm overflow-hidden transition-all ${isSchoolOpen ? 'border-emerald-300 shadow-md' : 'border-white/60 dark:border-slate-700/60 hover:border-emerald-200'}`}>
                {/* OKUL */}
                <button
                  onClick={() => { setOpenSchool(isSchoolOpen ? null : schoolName); setOpenGrade(null); setOpenSection(null); }}
                  className={`w-full flex items-center justify-between p-4 transition-colors ${isSchoolOpen ? 'bg-gradient-to-r from-emerald-50 to-teal-50' : 'hover:bg-emerald-50/40'}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-md transition-all ${isSchoolOpen ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-amber-500 to-orange-600'}`}>
                      {isSchoolOpen ? (
                        <School className="w-5 h-5 text-white" />
                      ) : (
                        <FolderOpen className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div className="text-left min-w-0">
                      <h4 className="text-[14.5px] font-extrabold text-[#0f2847] dark:text-slate-100 truncate">{schoolName}</h4>
                      <p className="text-[12px] text-gray-500 dark:text-slate-400">
                        <span className="font-semibold">{gradeCount}</span> sınıf · <span className="font-semibold">{schoolStudentCount}</span> öğrenci
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {schoolAlerts > 0 && (
                      <span className="text-[11px] bg-red-50 text-red-600 font-bold px-2 py-1 rounded-full flex items-center gap-1 border border-red-200">
                        <Bell className="w-3 h-3" /> {schoolAlerts}
                      </span>
                    )}
                    <ChevronRight className={`w-5 h-5 text-gray-400 dark:text-slate-500 transition-transform duration-200 ${isSchoolOpen ? 'rotate-90 text-emerald-600' : ''}`} />
                  </div>
                </button>

                {/* SINIFLAR */}
                {isSchoolOpen && (
                  <div className="border-t border-emerald-100 bg-gradient-to-b from-emerald-50/40 to-white/20">
                    {Object.entries(gradeMap).map(([gradeKey, secMap]) => {
                      const gKey = `${schoolName}::${gradeKey}`;
                      const gradeStudentCount = Object.values(secMap).reduce((s, arr) => s + arr.length, 0);
                      const sectionCount = Object.keys(secMap).length;
                      const isGradeOpen = openGrade === gKey;
                      return (
                        <div key={gKey} className="border-b border-emerald-100/60 last:border-b-0">
                          <button
                            onClick={() => { setOpenGrade(isGradeOpen ? null : gKey); setOpenSection(null); }}
                            className={`w-full flex items-center justify-between px-4 py-3 pl-8 transition-colors ${isGradeOpen ? 'bg-sky-50/60' : 'hover:bg-sky-50/40'}`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-sm transition-all ${isGradeOpen ? 'bg-gradient-to-br from-sky-500 to-blue-600' : 'bg-sky-100'}`}>
                                <Layers className={`w-4 h-4 ${isGradeOpen ? 'text-white' : 'text-sky-600'}`} />
                              </div>
                              <div className="text-left min-w-0">
                                <h5 className="text-[13.5px] font-bold text-[#0f2847] dark:text-slate-100">{gradeKey}</h5>
                                <p className="text-[11px] text-gray-500 dark:text-slate-400">
                                  <span className="font-semibold">{sectionCount}</span> şube · <span className="font-semibold">{gradeStudentCount}</span> öğrenci
                                </p>
                              </div>
                            </div>
                            <ChevronRight className={`w-4 h-4 text-gray-400 dark:text-slate-500 transition-transform duration-200 ${isGradeOpen ? 'rotate-90 text-sky-600' : ''}`} />
                          </button>

                          {/* ŞUBELER */}
                          {isGradeOpen && (
                            <div className="bg-white/50 dark:bg-slate-800/30">
                              {Object.entries(secMap).map(([secKey, students]) => {
                                const sKey = `${gKey}::${secKey}`;
                                const isSectionOpen = openSection === sKey;
                                return (
                                  <div key={sKey} className="border-b border-sky-100/40 last:border-b-0">
                                    <button
                                      onClick={() => setOpenSection(isSectionOpen ? null : sKey)}
                                      className={`w-full flex items-center justify-between px-4 py-2.5 pl-12 transition-colors ${isSectionOpen ? 'bg-violet-50/60' : 'hover:bg-violet-50/40'}`}
                                    >
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${isSectionOpen ? 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-sm' : 'bg-violet-100'}`}>
                                          <FolderOpen className={`w-3.5 h-3.5 ${isSectionOpen ? 'text-white' : 'text-violet-600'}`} />
                                        </div>
                                        <div className="text-left min-w-0">
                                          <h6 className="text-[12.5px] font-bold text-[#0f2847] dark:text-slate-100">{secKey}</h6>
                                          <p className="text-[10.5px] text-gray-500 dark:text-slate-400">{students.length} öğrenci</p>
                                        </div>
                                      </div>
                                      <ChevronRight className={`w-4 h-4 text-gray-400 dark:text-slate-500 transition-transform duration-200 ${isSectionOpen ? 'rotate-90 text-violet-600' : ''}`} />
                                    </button>

                                    {/* ÖĞRENCİLER */}
                                    {isSectionOpen && (
                                      <div className="divide-y divide-violet-100/40 bg-white/70 dark:bg-slate-800/50">
                                        {students.map((s) => {
                                          const isHighlighted = highlightedStudentId === s.id;
                                          return (
                                            <Link
                                              key={s.id}
                                              href={`/teacher/students/${s.id}`}
                                              ref={(el) => {
                                                if (el) studentRefs.current.set(s.id, el);
                                                else studentRefs.current.delete(s.id);
                                              }}
                                              className={`flex items-center gap-3 px-4 py-3 pl-20 transition-all group ${
                                                isHighlighted
                                                  ? 'bg-gradient-to-r from-yellow-100 via-amber-100 to-yellow-100 ring-2 ring-amber-400 animate-pulse'
                                                  : 'hover:bg-violet-50/50'
                                              }`}
                                            >
                                              <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform">
                                                <GraduationCap className="w-4 h-4 text-white" />
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <p className="text-[13px] font-bold text-[#0f2847] dark:text-slate-100 truncate">{s.full_name}</p>
                                                <p className="text-[11px] text-gray-500 dark:text-slate-400">
                                                  {s.completed_count} test tamamlandı
                                                  {s.assigned_pending_count > 0 && ` · ${s.assigned_pending_count} bekliyor`}
                                                </p>
                                              </div>
                                              {s.assigned_pending_count > 0 && (
                                                <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-200">
                                                  <Bell className="w-3 h-3" /> {s.assigned_pending_count}
                                                </span>
                                              )}
                                              <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 group-hover:translate-x-0.5 group-hover:text-violet-400 transition-all" />
                                            </Link>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* ═══ MEZUNLAR ═══ */}
          {graduatedCount > 0 && (
            <div className={`relative bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 border-2 rounded-2xl shadow-sm overflow-hidden transition-all ${showGraduatesSection ? 'border-amber-400 shadow-md' : 'border-amber-300'}`}>
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 opacity-10 blur-3xl pointer-events-none" />
              <button
                onClick={() => setShowGraduatesSection(!showGraduatesSection)}
                className="relative w-full flex items-center justify-between p-4 hover:bg-amber-100/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center shadow-lg shadow-amber-400/40">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-[14.5px] font-extrabold text-[#0f2847] dark:text-slate-100">🎓 Mezunlar</h4>
                    <p className="text-[12px] text-amber-700">
                      <span className="font-semibold">{Object.keys(graduated).length}</span> okul · <span className="font-semibold">{graduatedCount}</span> mezun
                    </p>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 text-amber-500 transition-transform duration-200 ${showGraduatesSection ? 'rotate-90' : ''}`} />
              </button>

              {showGraduatesSection && (
                <div className="relative border-t border-amber-200 bg-white/40">
                  {Object.entries(graduated).map(([schoolName, students]) => {
                    const isOpen = openGradSchool === schoolName;
                    return (
                      <div key={schoolName} className="border-b border-amber-100 last:border-b-0">
                        <button
                          onClick={() => setOpenGradSchool(isOpen ? null : schoolName)}
                          className={`w-full flex items-center justify-between px-4 py-3 pl-8 transition-colors ${isOpen ? 'bg-amber-100/50' : 'hover:bg-amber-50/40'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-sm transition-all ${isOpen ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-amber-200'}`}>
                              <FolderOpen className={`w-4 h-4 ${isOpen ? 'text-white' : 'text-amber-700'}`} />
                            </div>
                            <div className="text-left">
                              <h5 className="text-[13.5px] font-bold text-[#0f2847] dark:text-slate-100">{schoolName}</h5>
                              <p className="text-[11px] text-amber-700"><span className="font-semibold">{students.length}</span> mezun</p>
                            </div>
                          </div>
                          <ChevronRight className={`w-4 h-4 text-amber-500 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
                        </button>

                        {isOpen && (
                          <div className="divide-y divide-amber-100/50 bg-white/50 dark:bg-slate-800/30">
                            {students.map((s) => {
                              const isHighlighted = highlightedStudentId === s.id;
                              return (
                                <Link
                                  key={s.id}
                                  href={`/teacher/students/${s.id}`}
                                  ref={(el) => {
                                    if (el) studentRefs.current.set(s.id, el);
                                    else studentRefs.current.delete(s.id);
                                  }}
                                  className={`flex items-center gap-3 px-4 py-3 pl-14 transition-all group ${
                                    isHighlighted
                                      ? 'bg-gradient-to-r from-yellow-200 via-amber-200 to-yellow-200 ring-2 ring-amber-500 animate-pulse'
                                      : 'hover:bg-amber-50/60'
                                  }`}
                                >
                                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform">
                                    <Award className="w-4 h-4 text-white" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-bold text-[#0f2847] dark:text-slate-100 truncate">{s.full_name}</p>
                                    <p className="text-[11px] text-amber-700">
                                      Mezun · {s.completed_count} test tamamlandı
                                    </p>
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-amber-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
