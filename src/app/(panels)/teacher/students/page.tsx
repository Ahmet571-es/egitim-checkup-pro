'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { secureFetch } from '@/lib/csrf-client';
import { FolderOpen, ChevronRight, GraduationCap, AlertCircle, Users, Bell } from 'lucide-react';

interface StudentRow {
  id: string;
  full_name: string;
  grade: string | null;
  completed_count: number;
  assigned_pending_count: number;
}

type Grouped = Record<string, Record<string, StudentRow[]>>;

export default function StudentsPage() {
  const [grouped, setGrouped] = useState<Grouped>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openSchool, setOpenSchool] = useState<string | null>(null);
  const [openClass, setOpenClass] = useState<string | null>(null);

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
        setGrouped(data.grouped || {});
      } catch (e: unknown) {
        setError((e as Error).message);
      }
      setLoading(false);
    })();
  }, []);

  const totalStudents = Object.values(grouped).reduce(
    (sum, classMap) => sum + Object.values(classMap).reduce((s, arr) => s + arr.length, 0),
    0
  );
  const totalSchools = Object.keys(grouped).length;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 bg-gradient-to-br from-sky-500 to-blue-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-sky-500/20">
        <h1 className="text-2xl sm:text-3xl font-extrabold mb-1 flex items-center gap-3">
          <Users className="w-8 h-8" /> Öğrencilerim
        </h1>
        <p className="text-sky-50 text-sm">
          Öğrenciler okul → sınıf → ad-soyad sırasıyla otomatik gruplanır.
        </p>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-4 shadow-sm">
            <p className="text-[12px] text-gray-400 font-medium uppercase">Toplam Okul</p>
            <p className="text-2xl font-extrabold text-[#0f2847]">{totalSchools}</p>
          </div>
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-4 shadow-sm">
            <p className="text-[12px] text-gray-400 font-medium uppercase">Toplam Öğrenci</p>
            <p className="text-2xl font-extrabold text-[#0f2847]">{totalStudents}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-gray-400">Yükleniyor...</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-12 text-center shadow-sm">
          <p className="text-5xl mb-4">📭</p>
          <p className="text-gray-500 font-semibold">Henüz kayıtlı öğrenci yok.</p>
          <p className="text-gray-400 text-sm mt-2">
            Öğrenciler kayıt olduğunda otomatik olarak burada görünecek.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {Object.entries(grouped).map(([schoolName, classMap]) => {
            const schoolStudentCount = Object.values(classMap).reduce((s, arr) => s + arr.length, 0);
            const classCount = Object.keys(classMap).length;
            const schoolAlerts = Object.values(classMap)
              .flat()
              .reduce((s, st) => s + st.assigned_pending_count, 0);
            return (
              <div key={schoolName} className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm overflow-hidden">
                {/* OKUL */}
                <button
                  onClick={() => { setOpenSchool(openSchool === schoolName ? null : schoolName); setOpenClass(null); }}
                  className="w-full flex items-center justify-between p-4 hover:bg-amber-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                      <FolderOpen className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-[14px] font-bold text-[#0f2847]">{schoolName}</h4>
                      <p className="text-[12px] text-gray-400">{classCount} sınıf · {schoolStudentCount} öğrenci</p>
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
                    {Object.entries(classMap).map(([className, classStudents]) => {
                      const classKey = `${schoolName}::${className}`;
                      const classAlerts = classStudents.reduce((s, st) => s + st.assigned_pending_count, 0);
                      return (
                        <div key={classKey} className="border-b border-gray-100 last:border-b-0">
                          <button
                            onClick={() => setOpenClass(openClass === classKey ? null : classKey)}
                            className="w-full flex items-center justify-between px-4 py-3 pl-8 hover:bg-sky-50/40 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center">
                                <FolderOpen className="w-4 h-4 text-sky-600" />
                              </div>
                              <div className="text-left">
                                <h5 className="text-[13px] font-bold text-[#0f2847]">{className}</h5>
                                <p className="text-[11px] text-gray-400">{classStudents.length} öğrenci</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {classAlerts > 0 && (
                                <span className="text-[10px] bg-red-50 text-red-600 font-bold px-2 py-0.5 rounded-full">
                                  {classAlerts} uyarı
                                </span>
                              )}
                              <ChevronRight className={`w-4 h-4 text-gray-300 transition-transform duration-200 ${openClass === classKey ? 'rotate-90' : ''}`} />
                            </div>
                          </button>

                          {/* ÖĞRENCİLER */}
                          {openClass === classKey && (
                            <div className="bg-white/40 divide-y divide-gray-50">
                              {classStudents.map((s) => (
                                <Link
                                  key={s.id}
                                  href={`/teacher/students/${s.id}`}
                                  className="flex items-center gap-3 px-4 py-3 pl-14 hover:bg-violet-50/40 transition-colors"
                                >
                                  <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                                    <GraduationCap className="w-4 h-4 text-violet-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-semibold text-[#0f2847] truncate">{s.full_name}</p>
                                    <p className="text-[11px] text-gray-400">
                                      {s.completed_count} test tamamlandı
                                      {s.assigned_pending_count > 0 && ` · ${s.assigned_pending_count} test bekliyor`}
                                    </p>
                                  </div>
                                  {s.assigned_pending_count > 0 && (
                                    <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                      <Bell className="w-3 h-3" /> {s.assigned_pending_count}
                                    </span>
                                  )}
                                  <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                                </Link>
                              ))}
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
}
