'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  GraduationCap, Shield, Lock, ArrowRight, ArrowLeft, Users, Trash2,
  Phone, MapPin, BookOpen, FileText, ChevronRight, School,
  AlertCircle, CheckCircle2, FolderOpen, User, BarChart3, X,
  Mail, Calendar, Briefcase, Eye, EyeOff
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

interface PendingTeacher {
  id: string; full_name: string; email: string; phone: string;
  branch: string; school_name: string; created_at: string;
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
  const [showPassword, setShowPassword] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState('');

  // Views: 'teachers' | 'pending-teachers' | 'teacher-detail' | 'student-detail' | 'report-view'
  const [view, setView] = useState<string>('teachers');

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [pendingTeachers, setPendingTeachers] = useState<PendingTeacher[]>([]);
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

  const storedPw = () => password;

  // ═══ Auth ═══
  const handleLogin = () => {
    const pw = password.trim();
    if (pw === 'ANKA_KUSU2026') {
      setAuthed(true);
      setAuthError('');
      loadTeachers(pw);
      loadPendingTeachers(pw);
    } else {
      setAuthError('Şifre hatalı. Lütfen tekrar deneyin.');
    }
  };

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

  const loadPendingTeachers = async (pw: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await apiCall(pw, 'list-pending-teachers');
      setPendingTeachers(data.pending || []);
    } catch (e: unknown) {
      setError((e as Error).message);
    }
    setLoading(false);
  };

  const approveTeacher = async (userId: string) => {
    setLoading(true);
    setError('');
    try {
      await apiCall(storedPw(), 'approve-teacher', { userId });
      setSuccessMsg('Öğretmen onaylandı!');
      setTimeout(() => setSuccessMsg(''), 3000);
      loadPendingTeachers(storedPw());
      loadTeachers(storedPw());
    } catch (e: unknown) {
      setError((e as Error).message);
    }
    setLoading(false);
  };

  const rejectTeacher = async (userId: string) => {
    if (!confirm('Bu başvuruyu reddetmek istediğinize emin misiniz? Hesap silinecek.')) return;
    setLoading(true);
    setError('');
    try {
      await apiCall(storedPw(), 'reject-teacher', { userId });
      setSuccessMsg('Başvuru reddedildi.');
      setTimeout(() => setSuccessMsg(''), 3000);
      loadPendingTeachers(storedPw());
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
                  type={showPassword ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="Yönetici şifresi"
                  className="w-full pl-11 pr-11 py-3 rounded-xl border border-gray-200 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
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
          <button onClick={() => { setAuthed(false); setPassword(''); setView('teachers'); setSelectedTeacher(null); setSelectedStudent(null); }}
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

        {/* Tabs */}
        <div className="flex items-center gap-4 mb-6 border-b border-gray-200 pb-3">
          <button onClick={() => { setView('teachers'); setSelectedTeacher(null); setSelectedStudent(null); }}
            className={`text-[13px] font-semibold pb-1 transition-colors border-b-2 ${view === 'teachers' || view === 'teacher-detail' || view === 'student-detail' || view === 'report-view' ? 'text-[#0f2847] border-[#0f2847]' : 'text-gray-400 border-transparent hover:text-gray-600'}`}>
            Öğretmenler <span className="text-xs text-gray-400 ml-1">({teachers.length})</span>
          </button>
          <button onClick={() => { setView('pending-teachers'); loadPendingTeachers(storedPw()); }}
            className={`text-[13px] font-semibold pb-1 transition-colors border-b-2 flex items-center gap-1.5 ${view === 'pending-teachers' ? 'text-[#0f2847] border-[#0f2847]' : 'text-gray-400 border-transparent hover:text-gray-600'}`}>
            Onay Bekleyenler
            {pendingTeachers.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{pendingTeachers.length}</span>
            )}
          </button>
        </div>

        {/* Breadcrumb (detay sayfaları için) */}
        {(view === 'teacher-detail' || view === 'student-detail' || view === 'report-view') && (
        <div className="flex items-center gap-2 mb-6 text-[13px] text-gray-400">
          <button onClick={() => { setView('teachers'); setSelectedTeacher(null); setSelectedStudent(null); }}
            className="hover:text-[#0f2847] transition-colors">
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
        )}

        {/* ═══ VIEW: Pending Teachers ═══ */}
        {view === 'pending-teachers' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-extrabold text-[#0f2847]">Onay Bekleyen Öğretmenler</h2>
              <button onClick={() => loadPendingTeachers(storedPw())} className="text-sm text-emerald-600 font-semibold hover:underline">Yenile</button>
            </div>
            {loading ? (
              <div className="text-center py-20 text-gray-400">Yükleniyor...</div>
            ) : pendingTeachers.length === 0 ? (
              <div className="text-center py-20">
                <CheckCircle2 className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
                <p className="text-gray-400">Onay bekleyen başvuru yok.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {pendingTeachers.map(t => (
                  <div key={t.id} className="bg-white/70 backdrop-blur-xl rounded-2xl border border-amber-200 p-5 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">
                            {t.full_name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-[#0f2847]">{t.full_name}</p>
                            <p className="text-xs text-amber-600 font-semibold">Onay Bekliyor</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                          <div className="bg-gray-50 rounded-lg p-2">
                            <p className="text-[10px] text-gray-400 uppercase font-bold">Branş</p>
                            <p className="text-xs font-semibold text-[#0f2847] truncate">{t.branch}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-2">
                            <p className="text-[10px] text-gray-400 uppercase font-bold">Kurum</p>
                            <p className="text-xs font-semibold text-[#0f2847] truncate">{t.school_name}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-2">
                            <p className="text-[10px] text-gray-400 uppercase font-bold">E-posta</p>
                            <p className="text-xs font-semibold text-[#0f2847] truncate">{t.email}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-2">
                            <p className="text-[10px] text-gray-400 uppercase font-bold">Telefon</p>
                            <p className="text-xs font-semibold text-[#0f2847]">{t.phone}</p>
                          </div>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-2">Başvuru: {new Date(t.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <div className="flex sm:flex-col gap-2 shrink-0">
                        <button
                          onClick={() => approveTeacher(t.id)}
                          disabled={loading}
                          className="flex-1 sm:w-28 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Onayla
                        </button>
                        <button
                          onClick={() => rejectTeacher(t.id)}
                          disabled={loading}
                          className="flex-1 sm:w-28 py-2.5 rounded-xl bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-all flex items-center justify-center gap-1.5 border border-red-200 disabled:opacity-60"
                        >
                          <Trash2 className="w-4 h-4" /> Reddet
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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
                <InfoRow icon={Briefcase} label="Branş" value={String(selectedTeacher.full_info?.branch || '—')} />
                <InfoRow icon={School} label="Çalıştığı Kurum" value={String(selectedTeacher.full_info?.school_name || selectedTeacher.schoolName || '—')} />
                <InfoRow icon={Mail} label="E-posta" value={String(selectedTeacher.full_info?.real_email || '—')} />
                <InfoRow icon={Phone} label="Telefon" value={String(selectedTeacher.full_info?.phone || selectedTeacher.phone || '—')} />
                <InfoRow icon={Users} label="Öğrenci Sayısı" value={`${selectedTeacher.studentCount}`} />
                <InfoRow icon={BarChart3} label="Yapılan Analiz Raporu" value={`${selectedTeacher.reportCount}`} />
                <InfoRow icon={Calendar} label="Kayıt Tarihi" value={formatDate(selectedTeacher.created_at)} />
                <InfoRow icon={CheckCircle2} label="Onay Durumu" value={selectedTeacher.full_info?.is_approved === true ? 'Onaylandı' : selectedTeacher.full_info?.is_approved === false ? 'Beklemede' : 'Onaylandı'} />
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
