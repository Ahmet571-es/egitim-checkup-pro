'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { secureFetch } from '@/lib/csrf-client';
import {
  FolderOpen, ChevronRight, GraduationCap, AlertCircle, Users, Bell, Award, Search, X
} from 'lucide-react';

interface StudentRow {
  id: string;
  full_name: string;
  grade: string | null;
  section: string | null;
  completed_count: number;
  assigned_pending_count: number;
}

// Aktif: Okul → Sınıf → Şube → öğrenciler
type ActiveTree = Record<string, Record<string, Record<string, StudentRow[]>>>;
// Mezunlar: Okul → öğrenciler
type GradTree = Record<string, StudentRow[]>;

export default function StudentsPage() {
  const [active, setActive] = useState<ActiveTree>({});
  const [graduated, setGraduated] = useState<GradTree>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Açık klasör state'leri
  const [openSchool, setOpenSchool] = useState<string | null>(null);
  const [openGrade, setOpenGrade] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<string | null>(null);

  // Mezunlar bölümü ayrı state'ler
  const [openGradSchool, setOpenGradSchool] = useState<string | null>(null);
  const [showGraduatesSection, setShowGraduatesSection] = useState(false);

  // ═══ Arama ve Highlight ═══
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedStudentId, setHighlightedStudentId] = useState<string | null>(null);
  const studentRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());

  // Tüm öğrencileri tek bir düz listede topla (arama için) — her öğrencinin tam yolu ile
  interface FlatStudent {
    student: StudentRow;
    schoolName: string;
    gradeKey: string | null; // "9. Sınıf"
    sectionKey: string | null; // "9/A"
    isGraduated: boolean;
    // Tıklayınca açılması gereken klasör yolu
    pathKeys: {
      school: string;
      grade?: string;
      section?: string;
    };
  }

  const allStudentsFlat = useMemo<FlatStudent[]>(() => {
    const list: FlatStudent[] = [];

    // Aktif öğrenciler
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

    // Mezunlar
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

  // Arama sonuçları (Türkçe karakter duyarsız)
  const searchResults = useMemo<FlatStudent[]>(() => {
    const q = searchQuery.trim();
    if (q.length < 1) return [];
    const qNorm = q.toLocaleLowerCase('tr-TR');
    return allStudentsFlat.filter((fs) =>
      fs.student.full_name.toLocaleLowerCase('tr-TR').includes(qNorm)
    );
  }, [searchQuery, allStudentsFlat]);

  const isSearching = searchQuery.trim().length > 0;

  // Arama sonucundan öğrenciye tıklayınca: klasörleri aç, scroll et, highlight et
  const openStudentPath = (fs: FlatStudent) => {
    setSearchQuery(''); // arama kutusunu temizle → normal hiyerarşi geri gelir

    // Klasörleri aç
    if (fs.isGraduated) {
      setShowGraduatesSection(true);
      setOpenGradSchool(fs.schoolName);
    } else {
      setOpenSchool(fs.schoolName);
      if (fs.pathKeys.grade) setOpenGrade(fs.pathKeys.grade);
      if (fs.pathKeys.section) setOpenSection(fs.pathKeys.section);
    }

    // Highlight state'i ayarla
    setHighlightedStudentId(fs.student.id);

    // Sonraki render'da scroll et
    setTimeout(() => {
      const el = studentRefs.current.get(fs.student.id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);

    // 3 saniye sonra highlight'ı kaldır
    setTimeout(() => {
      setHighlightedStudentId(null);
    }, 3500);
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

  // Sayım
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
      {/* Header */}
      <div className="mb-6 bg-gradient-to-br from-sky-500 to-blue-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-sky-500/20">
        <h1 className="text-2xl sm:text-3xl font-extrabold mb-1 flex items-center gap-3">
          <Users className="w-8 h-8" /> Öğrencilerim
        </h1>
        <p className="text-sky-50 text-sm">
          Öğrenciler okul → sınıf → şube → ad-soyad sırasıyla otomatik gruplanır. Mezunlar ayrı.
        </p>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-4 shadow-sm">
            <p className="text-[12px] text-gray-400 font-medium uppercase">Toplam Okul</p>
            <p className="text-2xl font-extrabold text-[#0f2847]">{totalSchools}</p>
          </div>
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-4 shadow-sm">
            <p className="text-[12px] text-gray-400 font-medium uppercase">Aktif</p>
            <p className="text-2xl font-extrabold text-emerald-600">{activeStudentCount}</p>
          </div>
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-4 shadow-sm">
            <p className="text-[12px] text-gray-400 font-medium uppercase">Mezun</p>
            <p className="text-2xl font-extrabold text-amber-600">{graduatedCount}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {/* ═══ ARAMA KUTUSU ═══ */}
      {!loading && totalStudents > 0 && (
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Öğrenci ara (ad veya soyad)..."
              className="w-full pl-12 pr-11 py-3 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm text-[14px] focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 transition"
                title="Aramayı temizle"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>
          {isSearching && (
            <p className="text-[12px] text-gray-500 mt-2 ml-1">
              {searchResults.length === 0
                ? '🔍 Eşleşen öğrenci bulunamadı.'
                : `🔍 ${searchResults.length} öğrenci bulundu.`}
            </p>
          )}
        </div>
      )}

      {/* ═══ ARAMA SONUÇLARI ═══ */}
      {isSearching && !loading && (
        <div className="space-y-2 mb-6">
          {searchResults.map((fs) => {
            const s = fs.student;
            const breadcrumb = fs.isGraduated
              ? `🎓 Mezunlar → ${fs.schoolName}`
              : `${fs.schoolName} → ${fs.gradeKey} → ${fs.sectionKey}`;
            return (
              <button
                key={s.id}
                onClick={() => openStudentPath(fs)}
                className="w-full text-left bg-white/80 backdrop-blur-xl border border-sky-200 hover:border-sky-400 hover:bg-sky-50/50 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex items-center gap-3"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${fs.isGraduated ? 'bg-amber-100' : 'bg-violet-100'}`}>
                  {fs.isGraduated ? (
                    <Award className="w-5 h-5 text-amber-600" />
                  ) : (
                    <GraduationCap className="w-5 h-5 text-violet-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-[#0f2847] truncate">{s.full_name}</p>
                  <p className="text-[11px] text-gray-500 truncate">{breadcrumb}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {s.completed_count} test tamamlandı
                    {s.assigned_pending_count > 0 && ` · ${s.assigned_pending_count} bekliyor`}
                  </p>
                </div>
                {s.assigned_pending_count > 0 && (
                  <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Bell className="w-3 h-3" /> {s.assigned_pending_count}
                  </span>
                )}
                <ChevronRight className="w-5 h-5 text-sky-400 shrink-0" />
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-gray-400">Yükleniyor...</div>
      ) : totalStudents === 0 ? (
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-12 text-center shadow-sm">
          <p className="text-5xl mb-4">📭</p>
          <p className="text-gray-500 font-semibold">Henüz size atanmış öğrenci yok.</p>
          <p className="text-gray-400 text-sm mt-2">
            Öğrenciler kayıt sırasında sizi seçtiğinde burada görünecek.
          </p>
        </div>
      ) : (
        <div className={`space-y-3 ${isSearching ? 'hidden' : ''}`}>
          {/* ═══ AKTİF ÖĞRENCİLER (Okul → Sınıf → Şube → Öğrenci) ═══ */}
          {Object.entries(active).map(([schoolName, gradeMap]) => {
            const schoolStudentCount = Object.values(gradeMap).reduce(
              (s, secMap) => s + Object.values(secMap).reduce((s2, arr) => s2 + arr.length, 0), 0
            );
            const gradeCount = Object.keys(gradeMap).length;
            const schoolAlerts = Object.values(gradeMap).flatMap(
              (secMap) => Object.values(secMap).flat()
            ).reduce((s, st) => s + st.assigned_pending_count, 0);

            return (
              <div key={schoolName} className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm overflow-hidden">
                {/* OKUL */}
                <button
                  onClick={() => { setOpenSchool(openSchool === schoolName ? null : schoolName); setOpenGrade(null); setOpenSection(null); }}
                  className="w-full flex items-center justify-between p-4 hover:bg-amber-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                      <FolderOpen className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-[14px] font-bold text-[#0f2847]">{schoolName}</h4>
                      <p className="text-[12px] text-gray-400">{gradeCount} sınıf · {schoolStudentCount} öğrenci</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {schoolAlerts > 0 && (
                      <span className="text-[11px] bg-red-50 text-red-600 font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        <Bell className="w-3 h-3" /> {schoolAlerts}
                      </span>
                    )}
                    <ChevronRight className={`w-5 h-5 text-gray-300 transition-transform duration-200 ${openSchool === schoolName ? 'rotate-90' : ''}`} />
                  </div>
                </button>

                {/* SINIFLAR */}
                {openSchool === schoolName && (
                  <div className="border-t border-gray-100 bg-gray-50/30">
                    {Object.entries(gradeMap).map(([gradeKey, secMap]) => {
                      const gKey = `${schoolName}::${gradeKey}`;
                      const gradeStudentCount = Object.values(secMap).reduce((s, arr) => s + arr.length, 0);
                      const sectionCount = Object.keys(secMap).length;
                      return (
                        <div key={gKey} className="border-b border-gray-100 last:border-b-0">
                          <button
                            onClick={() => { setOpenGrade(openGrade === gKey ? null : gKey); setOpenSection(null); }}
                            className="w-full flex items-center justify-between px-4 py-3 pl-8 hover:bg-sky-50/40 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center">
                                <FolderOpen className="w-4 h-4 text-sky-600" />
                              </div>
                              <div className="text-left">
                                <h5 className="text-[13px] font-bold text-[#0f2847]">{gradeKey}</h5>
                                <p className="text-[11px] text-gray-400">{sectionCount} şube · {gradeStudentCount} öğrenci</p>
                              </div>
                            </div>
                            <ChevronRight className={`w-4 h-4 text-gray-300 transition-transform duration-200 ${openGrade === gKey ? 'rotate-90' : ''}`} />
                          </button>

                          {/* ŞUBELER */}
                          {openGrade === gKey && (
                            <div className="bg-white/40">
                              {Object.entries(secMap).map(([secKey, students]) => {
                                const sKey = `${gKey}::${secKey}`;
                                return (
                                  <div key={sKey} className="border-b border-gray-50 last:border-b-0">
                                    <button
                                      onClick={() => setOpenSection(openSection === sKey ? null : sKey)}
                                      className="w-full flex items-center justify-between px-4 py-2.5 pl-12 hover:bg-violet-50/30 transition-colors"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
                                          <FolderOpen className="w-3.5 h-3.5 text-violet-600" />
                                        </div>
                                        <div className="text-left">
                                          <h6 className="text-[12px] font-bold text-[#0f2847]">{secKey}</h6>
                                          <p className="text-[10px] text-gray-400">{students.length} öğrenci</p>
                                        </div>
                                      </div>
                                      <ChevronRight className={`w-4 h-4 text-gray-300 transition-transform duration-200 ${openSection === sKey ? 'rotate-90' : ''}`} />
                                    </button>

                                    {/* ÖĞRENCİLER */}
                                    {openSection === sKey && (
                                      <div className="divide-y divide-gray-50">
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
                                              className={`flex items-center gap-3 px-4 py-3 pl-20 transition-all ${
                                                isHighlighted
                                                  ? 'bg-gradient-to-r from-yellow-100 via-amber-100 to-yellow-100 ring-2 ring-amber-400 animate-pulse'
                                                  : 'hover:bg-violet-50/40'
                                              }`}
                                            >
                                              <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                                                <GraduationCap className="w-3.5 h-3.5 text-violet-600" />
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <p className="text-[13px] font-semibold text-[#0f2847] truncate">{s.full_name}</p>
                                                <p className="text-[11px] text-gray-400">
                                                  {s.completed_count} test tamamlandı
                                                  {s.assigned_pending_count > 0 && ` · ${s.assigned_pending_count} bekliyor`}
                                                </p>
                                              </div>
                                              {s.assigned_pending_count > 0 && (
                                                <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                                  <Bell className="w-3 h-3" /> {s.assigned_pending_count}
                                                </span>
                                              )}
                                              <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
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

          {/* ═══ MEZUNLAR (ayrı ana klasör) ═══ */}
          {graduatedCount > 0 && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl shadow-sm overflow-hidden">
              <button
                onClick={() => setShowGraduatesSection(!showGraduatesSection)}
                className="w-full flex items-center justify-between p-4 hover:bg-amber-100/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-[14px] font-extrabold text-[#0f2847]">🎓 Mezunlar</h4>
                    <p className="text-[12px] text-amber-700">{Object.keys(graduated).length} okul · {graduatedCount} mezun</p>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 text-amber-400 transition-transform duration-200 ${showGraduatesSection ? 'rotate-90' : ''}`} />
              </button>

              {showGraduatesSection && (
                <div className="border-t border-amber-200 bg-white/40">
                  {Object.entries(graduated).map(([schoolName, students]) => {
                    return (
                      <div key={schoolName} className="border-b border-amber-100 last:border-b-0">
                        <button
                          onClick={() => setOpenGradSchool(openGradSchool === schoolName ? null : schoolName)}
                          className="w-full flex items-center justify-between px-4 py-3 pl-8 hover:bg-amber-50/40 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-amber-200 flex items-center justify-center">
                              <FolderOpen className="w-4 h-4 text-amber-700" />
                            </div>
                            <div className="text-left">
                              <h5 className="text-[13px] font-bold text-[#0f2847]">{schoolName}</h5>
                              <p className="text-[11px] text-amber-600">{students.length} mezun</p>
                            </div>
                          </div>
                          <ChevronRight className={`w-4 h-4 text-amber-400 transition-transform duration-200 ${openGradSchool === schoolName ? 'rotate-90' : ''}`} />
                        </button>

                        {openGradSchool === schoolName && (
                          <div className="divide-y divide-amber-100/50">
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
                                  className={`flex items-center gap-3 px-4 py-3 pl-14 transition-all ${
                                    isHighlighted
                                      ? 'bg-gradient-to-r from-yellow-200 via-amber-200 to-yellow-200 ring-2 ring-amber-500 animate-pulse'
                                      : 'hover:bg-amber-50/40'
                                  }`}
                                >
                                  <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                                    <Award className="w-3.5 h-3.5 text-amber-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-semibold text-[#0f2847] truncate">{s.full_name}</p>
                                    <p className="text-[11px] text-amber-600">
                                      Mezun · {s.completed_count} test tamamlandı
                                    </p>
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-amber-300 shrink-0" />
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
