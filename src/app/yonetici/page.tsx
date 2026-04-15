'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  GraduationCap, Shield, Lock, ArrowRight, ArrowLeft, Users, Trash2,
  Phone, MapPin, BookOpen, FileText, ChevronRight, School,
  AlertCircle, CheckCircle2, FolderOpen, User, BarChart3, X
} from 'lucide-react';

/* ═══ Types ═══ */
interface Teacher {
  id: string; full_name: string; email: string; phone: string;
  school_id: string | null; schoolName: string; created_at: string;
  reportCount: number; studentCount: number;
}

interface StudentTest {
  id: string; test_type: string; completed_at: string; has_report: boolean;
}

interface Student {
  id: string; full_name: string; email: string; phone: string;
  grade: string | null; school_id: string | null; schoolName: string;
  created_at: string; city?: string; district?: string; address?: string;
  testCount: number; reportCount: number; tests: StudentTest[];
}

interface Report {
  id: string; test_type: string; scores: Record<string, unknown>; ai_report: string;
  completed_at: string; ai_report_generated_at: string;
}

interface IntegratedReport {
  id: string; teacher_report: string; student_report: string; parent_report: string; generated_at: string;
}

const TEST_LABELS: Record<string, string> = {
  enneagram: 'Enneagram Kişilik', vark: 'VARK Öğrenme Stilleri', holland: 'Holland RIASEC',
  coklu_zeka: 'Çoklu Zekâ', sinav_kaygisi: 'Sınav Kaygısı', calisma_davranisi: 'Çalışma Davranışı',
  akademik_analiz: 'Akademik Analiz', hizli_okuma: 'Hızlı Okuma', d2_dikkat: 'D2 Dikkat Testi',
  sag_sol_beyin: 'Sağ-Sol Beyin',
};

/* ═══ API helper ═══ */
async function apiCall(password: string, action: string, extra: Record<string, string> = {}) {
  const res = await fetch('/api/yonetici', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password, action, ...extra }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Sunucu hatası');
  }
  return res.json();
}

/* ═══ Sub-Components ═══ */

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
      <div>
        <span className="text-[12px] text-gray-400 font-medium">{label}</span>
        <p className="text-sm text-[#0f2847] font-medium">{value || '—'}</p>
      </div>
    </div>
  );
}

function DeleteButton({ onDelete, label }: { onDelete: () => void; label: string }) {
  const [confirm, setConfirm] = useState(false);
  return confirm ? (
    <div className="flex items-center gap-2">
      <span className="text-[12px] text-red-500 font-medium">Silmek istediğinize emin misiniz?</span>
      <button onClick={onDelete} className="px-3 py-1 rounded-lg bg-red-500 text-white text-[12px] font-bold hover:bg-red-600 transition-colors">Evet, Sil</button>
      <button onClick={() => setConfirm(false)} className="px-3 py-1 rounded-lg bg-gray-200 text-gray-600 text-[12px] font-bold hover:bg-gray-300 transition-colors">İptal</button>
    </div>
  ) : (
    <button onClick={() => setConfirm(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-50 text-[12px] font-semibold transition-colors">
      <Trash2 className="w-3.5 h-3.5" /> {label}
    </button>
  );
}

/* ═══ MAIN PAGE ═══ */
export default function YoneticiPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState('');

  // Views: 'teachers' | 'teacher-detail' | 'student-detail' | 'report-view'
  const [view, setView] = useState<string>('teachers');

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<(Teacher & { full_info?: Record<string, unknown> }) | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [integratedReports, setIntegratedReports] = useState<IntegratedReport[]>([]);
  const [openSchool, setOpenSchool] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | IntegratedReport | null>(null);
  const [reportType, setReportType] = useState<'single' | 'integrated'>('single');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const storedPw = () => password || sessionStorage.getItem('ynPw') || '';

  // ═══ Auth ═══
  const handleLogin = () => {
    if (password === 'ANKA2026') {
      sessionStorage.setItem('ynPw', password);
      setAuthed(true);
      setAuthError('');
      loadTeachers(password);
    } else {
      setAuthError('Şifre hatalı.');
    }
  };

  useEffect(() => {
    const saved = sessionStorage.getItem('ynPw');
    if (saved === 'ANKA2026') {
      setPassword(saved);
      setAuthed(true);
      loadTeachers(saved);
    }
  }, []);

  // ═══ Loaders ═══
  const loadTeachers = async (pw: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await apiCall(pw, 'list-teachers');
      setTeachers(data.teachers || []);
    } catch (e: unknown) {
      setError((e as Error).message);
    }
    setLoading(false);
  };

  const loadTeacherDetail = async (teacher: Teacher) => {
    setLoading(true);
    setError('');
    setSelectedTeacher(teacher);
    setView('teacher-detail');
    setOpenSchool(null);
    try {
      const data = await apiCall(storedPw(), 'teacher-detail', { teacherId: teacher.id });
      setSelectedTeacher({ ...teacher, full_info: data.teacher });
      setStudents(data.students || []);
    } catch (e: unknown) {
      setError((e as Error).message);
    }
    setLoading(false);
  };

  const loadStudentReports = async (student: Student) => {
    setSelectedStudent(student);
    setView('student-detail');
    setLoading(true);
    try {
      const data = await apiCall(storedPw(), 'student-reports', { studentId: student.id });
      setReports(data.reports || []);
      setIntegratedReports(data.integratedReports || []);
    } catch (e: unknown) {
      setError((e as Error).message);
    }
    setLoading(false);
  };

  const handleDeleteUser = async (userId: string, type: 'teacher' | 'student') => {
    try {
      await apiCall(storedPw(), 'delete-user', { userId });
      setSuccessMsg(`${type === 'teacher' ? 'Öğretmen' : 'Öğrenci'} silindi.`);
      setTimeout(() => setSuccessMsg(''), 3000);
      if (type === 'teacher') {
        setTeachers((prev) => prev.filter((t) => t.id !== userId));
        if (selectedTeacher?.id === userId) { setView('teachers'); setSelectedTeacher(null); }
      } else {
        setStudents((prev) => prev.filter((s) => s.id !== userId));
        if (selectedStudent?.id === userId) { setView('teacher-detail'); setSelectedStudent(null); }
      }
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  };

  // ═══ School grouping ═══
  const studentsBySchool = students.reduce<Record<string, Student[]>>((acc, s) => {
    const key = s.schoolName || 'Okulsuz';
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

  // ═══ PASSWORD GATE ═══
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#f0f5ff] via-[#f8fafc] to-[#f0fdf8] px-4">
        <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-amber-200/20 to-orange-200/10 blur-3xl" />
        <div className="fixed bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-blue-200/20 to-indigo-200/10 blur-3xl" />
        <div className="relative w-full max-w-sm">
          <Link href="/" className="flex items-center justify-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-extrabold text-[#0f2847]">Yönetici Paneli</h1>
          </Link>
          <div className="bg-white/72 backdrop-blur-[20px] rounded-3xl border border-white/40 shadow-xl p-8">
            <h2 className="text-2xl font-extrabold text-[#0f2847] text-center mb-1">Yönetici Girişi</h2>
            <p className="text-sm text-gray-500 text-center mb-8">Yönetici şifresini girin</p>
            {authError && (
              <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="w-4 h-4 shrink-0" />{authError}
              </div>
            )}
            <div className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="Yönetici şifresi"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all"
                />
              </div>
              <button onClick={handleLogin} className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-bold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all flex items-center justify-center gap-2">
                Giriş Yap <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══ ADMIN PANEL ═══
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0f5ff] via-[#f8fafc] to-[#f0fdf8]">
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-white/92 backdrop-blur-2xl border-b border-gray-200/50 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-[14px] font-extrabold text-[#0f2847]">Yönetici Paneli</span>
          </div>
          <button onClick={() => { sessionStorage.removeItem('ynPw'); setAuthed(false); setPassword(''); }}
            className="text-[13px] text-gray-500 hover:text-red-500 font-semibold transition-colors">
            Çıkış Yap
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Notifications */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
            <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-sm text-emerald-600">
            <CheckCircle2 className="w-4 h-4 shrink-0" />{successMsg}
          </div>
        )}

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-[13px] text-gray-400">
          <button onClick={() => { setView('teachers'); setSelectedTeacher(null); setSelectedStudent(null); }}
            className={`hover:text-[#0f2847] transition-colors ${view === 'teachers' ? 'text-[#0f2847] font-bold' : ''}`}>
            Öğretmenler
          </button>
          {selectedTeacher && (
            <>
              <ChevronRight className="w-3.5 h-3.5" />
              <button onClick={() => { setView('teacher-detail'); setSelectedStudent(null); }}
                className={`hover:text-[#0f2847] transition-colors ${view === 'teacher-detail' ? 'text-[#0f2847] font-bold' : ''}`}>
                {selectedTeacher.full_name}
              </button>
            </>
          )}
          {selectedStudent && (
            <>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-[#0f2847] font-bold">{selectedStudent.full_name}</span>
            </>
          )}
        </div>

        {/* ═══ VIEW: Teachers List ═══ */}
        {view === 'teachers' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-extrabold text-[#0f2847]">Kayıtlı Öğretmenler</h2>
              <span className="text-sm text-gray-400 font-medium">{teachers.length} öğretmen</span>
            </div>
            {loading ? (
              <div className="text-center py-20 text-gray-400">Yükleniyor...</div>
            ) : teachers.length === 0 ? (
              <div className="text-center py-20 text-gray-400">Henüz kayıtlı öğretmen yok.</div>
            ) : (
              <div className="grid gap-3">
                {teachers.map((t) => (
                  <div key={t.id} className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <button onClick={() => loadTeacherDetail(t)} className="flex items-center gap-4 text-left flex-1 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shrink-0">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[15px] font-bold text-[#0f2847] truncate">{t.full_name}</h3>
                          <div className="flex items-center gap-3 mt-1 text-[12px] text-gray-400">
                            <span className="flex items-center gap-1"><School className="w-3 h-3" />{t.schoolName}</span>
                            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{t.studentCount} öğrenci</span>
                            <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{t.reportCount} rapor</span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" />
                      </button>
                      <div className="ml-3 shrink-0">
                        <DeleteButton onDelete={() => handleDeleteUser(t.id, 'teacher')} label="Sil" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ VIEW: Teacher Detail ═══ */}
        {view === 'teacher-detail' && selectedTeacher && (
          <div>
            <button onClick={() => { setView('teachers'); setSelectedTeacher(null); }}
              className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-[#0f2847] mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Öğretmenler listesine dön
            </button>

            {/* Teacher Info Card */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-6 shadow-sm mb-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shrink-0">
                  <User className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-[#0f2847]">{selectedTeacher.full_name}</h2>
                  <p className="text-sm text-gray-400">Öğretmen</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-x-8">
                <InfoRow icon={Phone} label="Telefon" value={selectedTeacher.phone || selectedTeacher.email} />
                <InfoRow icon={School} label="Okul" value={selectedTeacher.schoolName} />
                <InfoRow icon={Users} label="Öğrenci Sayısı" value={`${selectedTeacher.studentCount}`} />
                <InfoRow icon={BarChart3} label="Yapılan Analiz Raporu" value={`${selectedTeacher.reportCount}`} />
              </div>
            </div>

            {/* Students by School */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#0f2847] flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-amber-500" /> Kayıtlı Öğrenciler
              </h3>
              <span className="text-sm text-gray-400">{students.length} öğrenci</span>
            </div>

            {loading ? (
              <div className="text-center py-12 text-gray-400">Yükleniyor...</div>
            ) : Object.keys(studentsBySchool).length === 0 ? (
              <div className="text-center py-12 text-gray-400">Kayıtlı öğrenci bulunmuyor.</div>
            ) : (
              <div className="grid gap-3">
                {Object.entries(studentsBySchool).map(([schoolName, schoolStudents]) => (
                  <div key={schoolName} className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm overflow-hidden">
                    <button
                      onClick={() => setOpenSchool(openSchool === schoolName ? null : schoolName)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                          <FolderOpen className="w-5 h-5 text-amber-600" />
                        </div>
                        <div className="text-left">
                          <h4 className="text-[14px] font-bold text-[#0f2847]">{schoolName}</h4>
                          <p className="text-[12px] text-gray-400">{schoolStudents.length} öğrenci</p>
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 text-gray-300 transition-transform duration-200 ${openSchool === schoolName ? 'rotate-90' : ''}`} />
                    </button>

                    {openSchool === schoolName && (
                      <div className="border-t border-gray-100 divide-y divide-gray-50">
                        {schoolStudents.map((s) => (
                          <div key={s.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50/50 transition-colors">
                            <button onClick={() => loadStudentReports(s)} className="flex items-center gap-3 text-left flex-1 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                                <GraduationCap className="w-4 h-4 text-violet-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-semibold text-[#0f2847] truncate">{s.full_name}</p>
                                <p className="text-[11px] text-gray-400">{s.grade ? `${s.grade}. Sınıf` : ''} · {s.testCount} test · {s.reportCount} rapor</p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                            </button>
                            <div className="ml-2 shrink-0">
                              <DeleteButton onDelete={() => handleDeleteUser(s.id, 'student')} label="Sil" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ VIEW: Student Detail ═══ */}
        {view === 'student-detail' && selectedStudent && (
          <div>
            <button onClick={() => { setView('teacher-detail'); setSelectedStudent(null); }}
              className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-[#0f2847] mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Öğrenciler listesine dön
            </button>

            {/* Student Info */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-6 shadow-sm mb-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shrink-0">
                  <GraduationCap className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-[#0f2847]">{selectedStudent.full_name}</h2>
                  <p className="text-sm text-gray-400">Öğrenci{selectedStudent.grade ? ` · ${selectedStudent.grade}. Sınıf` : ''}</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-x-8">
                <InfoRow icon={School} label="Okul" value={selectedStudent.schoolName} />
                <InfoRow icon={Phone} label="Telefon" value={selectedStudent.phone || '—'} />
                <InfoRow icon={MapPin} label="İl / İlçe" value={[selectedStudent.city, selectedStudent.district].filter(Boolean).join(' / ') || '—'} />
                <InfoRow icon={MapPin} label="Açık Adres" value={selectedStudent.address || '—'} />
                <InfoRow icon={BookOpen} label="Tamamlanan Test" value={`${selectedStudent.testCount}`} />
                <InfoRow icon={FileText} label="Analiz Raporu" value={`${selectedStudent.reportCount}`} />
              </div>
            </div>

            {/* Completed Tests */}
            <h3 className="text-lg font-bold text-[#0f2847] mb-3">Yapılan Testler</h3>
            {selectedStudent.tests.length === 0 ? (
              <p className="text-sm text-gray-400 mb-6">Henüz test tamamlanmamış.</p>
            ) : (
              <div className="grid gap-2 mb-6">
                {selectedStudent.tests.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 bg-white/70 rounded-xl border border-white/40 p-3 shadow-sm">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.has_report ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                      <BookOpen className={`w-4 h-4 ${t.has_report ? 'text-emerald-600' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[13px] font-semibold text-[#0f2847]">{TEST_LABELS[t.test_type] || t.test_type}</p>
                      <p className="text-[11px] text-gray-400">{formatDate(t.completed_at)}</p>
                    </div>
                    {t.has_report && <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">Rapor var</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Reports */}
            <h3 className="text-lg font-bold text-[#0f2847] mb-3">Analiz Raporları</h3>
            {loading ? (
              <div className="text-center py-8 text-gray-400">Yükleniyor...</div>
            ) : reports.length === 0 && integratedReports.length === 0 ? (
              <p className="text-sm text-gray-400">Henüz rapor oluşturulmamış.</p>
            ) : (
              <div className="grid gap-2">
                {reports.map((r) => (
                  <button key={r.id} onClick={() => { setSelectedReport(r); setReportType('single'); setView('report-view'); }}
                    className="flex items-center gap-3 bg-white/70 rounded-xl border border-white/40 p-3 shadow-sm hover:shadow-md transition-all text-left">
                    <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-sky-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[13px] font-semibold text-[#0f2847]">{TEST_LABELS[r.test_type] || r.test_type} — Tekil Rapor</p>
                      <p className="text-[11px] text-gray-400">{formatDate(r.completed_at)}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </button>
                ))}
                {integratedReports.map((ir) => (
                  <button key={ir.id} onClick={() => { setSelectedReport(ir); setReportType('integrated'); setView('report-view'); }}
                    className="flex items-center gap-3 bg-white/70 rounded-xl border border-white/40 p-3 shadow-sm hover:shadow-md transition-all text-left">
                    <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-violet-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[13px] font-semibold text-[#0f2847]">Entegre 3&apos;lü Rapor</p>
                      <p className="text-[11px] text-gray-400">{formatDate(ir.generated_at)}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ VIEW: Report Detail ═══ */}
        {view === 'report-view' && selectedReport && (
          <div>
            <button onClick={() => setView('student-detail')}
              className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-[#0f2847] mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Öğrenci detayına dön
            </button>

            <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-6 shadow-sm">
              {reportType === 'single' && 'ai_report' in selectedReport ? (
                <>
                  <h2 className="text-lg font-bold text-[#0f2847] mb-4">
                    {TEST_LABELS[(selectedReport as Report).test_type] || (selectedReport as Report).test_type} — Tekil Rapor
                  </h2>
                  <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {(selectedReport as Report).ai_report}
                  </div>
                </>
              ) : reportType === 'integrated' && 'teacher_report' in selectedReport ? (
                <>
                  <h2 className="text-lg font-bold text-[#0f2847] mb-4">Entegre 3&apos;lü Rapor</h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-[14px] font-bold text-sky-600 mb-2">Öğretmen Raporu</h3>
                      <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed bg-sky-50/50 rounded-xl p-4 border border-sky-100">
                        {(selectedReport as IntegratedReport).teacher_report}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-[14px] font-bold text-violet-600 mb-2">Öğrenci Raporu</h3>
                      <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed bg-violet-50/50 rounded-xl p-4 border border-violet-100">
                        {(selectedReport as IntegratedReport).student_report}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-[14px] font-bold text-pink-600 mb-2">Veli Raporu</h3>
                      <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed bg-pink-50/50 rounded-xl p-4 border border-pink-100">
                        {(selectedReport as IntegratedReport).parent_report}
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
