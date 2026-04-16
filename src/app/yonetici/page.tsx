'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  GraduationCap, Shield, Lock, ArrowRight, ArrowLeft, Users, Trash2,
  Phone, MapPin, BookOpen, FileText, ChevronRight, School,
  AlertCircle, CheckCircle2, FolderOpen, User, BarChart3, X,
  Mail, Calendar, Briefcase, Eye, EyeOff, Home
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
  class_id: string; class_name: string;
  section?: string; is_graduated?: boolean;
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
async function apiCall(password: string, action: string, extra: Record<string, unknown> = {}) {
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
  const [openClass, setOpenClass] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [openGradSchool, setOpenGradSchool] = useState<string | null>(null);
  const [showGraduatesSection, setShowGraduatesSection] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | IntegratedReport | null>(null);
  const [reportType, setReportType] = useState<'single' | 'integrated'>('single');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ═══ Toplu Seçim ═══
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<Set<string>>(new Set());
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  // Tehlikeli işlem onay modalı
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    danger: boolean;
    onConfirm: () => void | Promise<void>;
  } | null>(null);

  // ═══ View History (Geri/İleri için) ═══
  type Snapshot = {
    view: string;
    selectedTeacher: typeof selectedTeacher;
    selectedStudent: typeof selectedStudent;
    selectedReport: typeof selectedReport;
    reportType: 'single' | 'integrated';
    openSchool: string | null;
    openClass: string | null;
  };
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isNavigatingRef = useRef(false);

  // Yeni view'a geçince history'ye ekle
  const pushHistory = useCallback((snap: Snapshot) => {
    if (isNavigatingRef.current) return; // back/forward sırasında ekleme
    setHistory((prev) => {
      const truncated = prev.slice(0, historyIndex + 1);
      return [...truncated, snap];
    });
    setHistoryIndex((i) => i + 1);
  }, [historyIndex]);

  // View değiştiğinde otomatik snapshot al
  useEffect(() => {
    if (!authed) return;
    if (isNavigatingRef.current) {
      isNavigatingRef.current = false;
      return;
    }
    pushHistory({
      view, selectedTeacher, selectedStudent, selectedReport,
      reportType, openSchool, openClass,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, selectedTeacher?.id, selectedStudent?.id, selectedReport, reportType, authed]);

  const goBack = () => {
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    const snap = history[newIndex];
    if (!snap) return;
    isNavigatingRef.current = true;
    setView(snap.view);
    setSelectedTeacher(snap.selectedTeacher);
    setSelectedStudent(snap.selectedStudent);
    setSelectedReport(snap.selectedReport);
    setReportType(snap.reportType);
    setOpenSchool(snap.openSchool);
    setOpenClass(snap.openClass);
    setHistoryIndex(newIndex);
  };

  const goForward = () => {
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    const snap = history[newIndex];
    if (!snap) return;
    isNavigatingRef.current = true;
    setView(snap.view);
    setSelectedTeacher(snap.selectedTeacher);
    setSelectedStudent(snap.selectedStudent);
    setSelectedReport(snap.selectedReport);
    setReportType(snap.reportType);
    setOpenSchool(snap.openSchool);
    setOpenClass(snap.openClass);
    setHistoryIndex(newIndex);
  };

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;

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
    setOpenClass(null);
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

  // ═══ Toplu silme: seçili öğretmenleri sil ═══
  const handleBulkDeleteTeachers = async () => {
    const ids = Array.from(selectedTeacherIds);
    if (ids.length === 0) return;
    setLoading(true);
    setError('');
    try {
      const res = await apiCall(storedPw(), 'bulk-delete', { userIds: ids });
      setSuccessMsg(`${res.deleted} öğretmen silindi.`);
      setTimeout(() => setSuccessMsg(''), 3000);
      setTeachers((prev) => prev.filter((t) => !selectedTeacherIds.has(t.id)));
      setSelectedTeacherIds(new Set());
    } catch (e: unknown) {
      setError((e as Error).message);
    }
    setLoading(false);
    setConfirmAction(null);
  };

  // ═══ Tüm öğretmenleri sil ═══
  const handleDeleteAllTeachers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiCall(storedPw(), 'delete-all', { role: 'teacher' });
      setSuccessMsg(`${res.deleted}/${res.total} öğretmen silindi.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      setTeachers([]);
      setSelectedTeacherIds(new Set());
      setView('teachers');
      setSelectedTeacher(null);
    } catch (e: unknown) {
      setError((e as Error).message);
    }
    setLoading(false);
    setConfirmAction(null);
  };

  // ═══ Toplu silme: seçili öğrencileri sil ═══
  const handleBulkDeleteStudents = async () => {
    const ids = Array.from(selectedStudentIds);
    if (ids.length === 0) return;
    setLoading(true);
    setError('');
    try {
      const res = await apiCall(storedPw(), 'bulk-delete', { userIds: ids });
      setSuccessMsg(`${res.deleted} öğrenci silindi.`);
      setTimeout(() => setSuccessMsg(''), 3000);
      setStudents((prev) => prev.filter((s) => !selectedStudentIds.has(s.id)));
      setSelectedStudentIds(new Set());
    } catch (e: unknown) {
      setError((e as Error).message);
    }
    setLoading(false);
    setConfirmAction(null);
  };

  // ═══ Tüm öğrencileri sil ═══
  const handleDeleteAllStudents = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiCall(storedPw(), 'delete-all', { role: 'student' });
      setSuccessMsg(`${res.deleted}/${res.total} öğrenci silindi.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      setStudents([]);
      setSelectedStudentIds(new Set());
    } catch (e: unknown) {
      setError((e as Error).message);
    }
    setLoading(false);
    setConfirmAction(null);
  };

  const toggleTeacherSelect = (id: string) => {
    setSelectedTeacherIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAllTeachersSelect = () => {
    if (selectedTeacherIds.size === teachers.length) {
      setSelectedTeacherIds(new Set());
    } else {
      setSelectedTeacherIds(new Set(teachers.map((t) => t.id)));
    }
  };

  const toggleStudentSelect = (id: string) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAllStudentsSelect = () => {
    if (selectedStudentIds.size === students.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(students.map((s) => s.id)));
    }
  };

  // ═══ Aktif öğrenciler: Okul → Sınıf → Şube → öğrenciler ═══
  // ═══ Mezunlar: Okul → öğrenciler ═══
  const activeStudents = students.filter((s) => !s.is_graduated);
  const graduatedStudents = students.filter((s) => s.is_graduated);

  // Aktif: 4 katmanlı yapı
  const activeTree = activeStudents.reduce<Record<string, Record<string, Record<string, Student[]>>>>((acc, s) => {
    const schoolKey = s.schoolName || 'Okulsuz';
    const grade = s.grade || '';
    const sect = s.section || '';
    const gradeKey = grade ? `${grade}. Sınıf` : 'Sınıfsız';
    const sectionKey = grade && sect ? `${grade}/${sect}` : 'Şubesiz';
    if (!acc[schoolKey]) acc[schoolKey] = {};
    if (!acc[schoolKey][gradeKey]) acc[schoolKey][gradeKey] = {};
    if (!acc[schoolKey][gradeKey][sectionKey]) acc[schoolKey][gradeKey][sectionKey] = [];
    acc[schoolKey][gradeKey][sectionKey].push(s);
    return acc;
  }, {});

  // Mezunlar: school → öğrenciler
  const graduatedTree = graduatedStudents.reduce<Record<string, Student[]>>((acc, s) => {
    const schoolKey = s.schoolName || 'Okulsuz';
    if (!acc[schoolKey]) acc[schoolKey] = [];
    acc[schoolKey].push(s);
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

            {/* Ana Sayfaya Dön */}
            <Link
              href="/"
              className="mt-5 flex items-center justify-center gap-1.5 text-[13px] text-gray-500 hover:text-amber-600 font-semibold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Ana Sayfaya Dön
            </Link>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-[14px] font-extrabold text-[#0f2847]">Yönetici Paneli</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Geri / İleri */}
            <button
              onClick={goBack}
              disabled={!canGoBack}
              aria-label="Bir adım geri"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-[12px] font-semibold text-[#0f2847] hover:bg-white hover:border-amber-300 hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Geri</span>
            </button>
            <button
              onClick={goForward}
              disabled={!canGoForward}
              aria-label="Bir adım ileri"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-[12px] font-semibold text-[#0f2847] hover:bg-white hover:border-amber-300 hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <span className="hidden sm:inline">İleri</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <div className="w-px h-5 bg-gray-200 mx-1" />

            <Link
              href="/"
              className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-amber-600 font-semibold transition-colors"
              aria-label="Ana sayfaya git"
            >
              <Home className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ana Sayfa</span>
            </Link>

            <button onClick={() => { setAuthed(false); setPassword(''); setView('teachers'); setSelectedTeacher(null); setSelectedStudent(null); setHistory([]); setHistoryIndex(-1); }}
              className="text-[13px] text-gray-500 hover:text-red-500 font-semibold transition-colors">
              Çıkış Yap
            </button>
          </div>
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-extrabold text-[#0f2847]">Kayıtlı Öğretmenler</h2>
              <span className="text-sm text-gray-400 font-medium">{teachers.length} öğretmen</span>
            </div>

            {/* Toplu işlem çubuğu */}
            {teachers.length > 0 && (
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-3 shadow-sm mb-4 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-[12px] font-semibold text-[#0f2847]">
                    <input
                      type="checkbox"
                      checked={selectedTeacherIds.size === teachers.length && teachers.length > 0}
                      onChange={toggleAllTeachersSelect}
                      className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500/30 cursor-pointer"
                    />
                    Tümünü Seç
                  </label>
                  {selectedTeacherIds.size > 0 && (
                    <span className="text-[12px] text-amber-600 font-bold">
                      {selectedTeacherIds.size} seçili
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setConfirmAction({
                      title: 'Seçili Öğretmenleri Sil',
                      message: `${selectedTeacherIds.size} öğretmen kalıcı olarak silinecek. Devam edilsin mi?`,
                      danger: true,
                      onConfirm: handleBulkDeleteTeachers,
                    })}
                    disabled={selectedTeacherIds.size === 0 || loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 text-white text-[12px] font-bold hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Seçilenleri Sil
                  </button>
                  <button
                    onClick={() => setConfirmAction({
                      title: 'TÜM ÖĞRETMENLERİ SİL',
                      message: `Sistemdeki ${teachers.length} öğretmen ve hesapları KALICI olarak silinecek. Bu işlem geri alınamaz! Devam edilsin mi?`,
                      danger: true,
                      onConfirm: handleDeleteAllTeachers,
                    })}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-rose-700 text-white text-[12px] font-extrabold hover:from-red-700 hover:to-rose-800 shadow-md hover:shadow-lg disabled:opacity-40 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Tümünü Sil
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="text-center py-20 text-gray-400">Yükleniyor...</div>
            ) : teachers.length === 0 ? (
              <div className="text-center py-20 text-gray-400">Henüz kayıtlı öğretmen yok.</div>
            ) : (
              <div className="grid gap-3">
                {teachers.map((t) => (
                  <div key={t.id} className={`bg-white/70 backdrop-blur-xl rounded-2xl border p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${selectedTeacherIds.has(t.id) ? 'border-amber-400 ring-2 ring-amber-200' : 'border-white/40'}`}>
                    <div className="flex items-center justify-between gap-3">
                      <input
                        type="checkbox"
                        checked={selectedTeacherIds.has(t.id)}
                        onChange={(e) => { e.stopPropagation(); toggleTeacherSelect(t.id); }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500/30 cursor-pointer shrink-0"
                      />
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
                      <div className="ml-1 shrink-0">
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

            {/* Toplu işlem çubuğu */}
            {students.length > 0 && (
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-3 shadow-sm mb-4 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-[12px] font-semibold text-[#0f2847]">
                    <input
                      type="checkbox"
                      checked={selectedStudentIds.size === students.length && students.length > 0}
                      onChange={toggleAllStudentsSelect}
                      className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500/30 cursor-pointer"
                    />
                    Tümünü Seç
                  </label>
                  {selectedStudentIds.size > 0 && (
                    <span className="text-[12px] text-amber-600 font-bold">
                      {selectedStudentIds.size} seçili
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setConfirmAction({
                      title: 'Seçili Öğrencileri Sil',
                      message: `${selectedStudentIds.size} öğrenci kalıcı olarak silinecek. Devam edilsin mi?`,
                      danger: true,
                      onConfirm: handleBulkDeleteStudents,
                    })}
                    disabled={selectedStudentIds.size === 0 || loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 text-white text-[12px] font-bold hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Seçilenleri Sil
                  </button>
                  <button
                    onClick={() => setConfirmAction({
                      title: 'TÜM ÖĞRENCİLERİ SİL',
                      message: `Sistemdeki ${students.length} öğrenci ve hesapları KALICI olarak silinecek. Bu işlem geri alınamaz! Devam edilsin mi?`,
                      danger: true,
                      onConfirm: handleDeleteAllStudents,
                    })}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-rose-700 text-white text-[12px] font-extrabold hover:from-red-700 hover:to-rose-800 shadow-md hover:shadow-lg disabled:opacity-40 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Tümünü Sil
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="text-center py-12 text-gray-400">Yükleniyor...</div>
            ) : students.length === 0 ? (
              <div className="text-center py-12 text-gray-400">Bu öğretmene atanmış öğrenci yok.</div>
            ) : (
              <div className="grid gap-3">
                {/* ═══ AKTİF: Okul → Sınıf → Şube → Öğrenci ═══ */}
                {Object.entries(activeTree).map(([schoolName, gradeMap]) => {
                  const schoolStudentCount = Object.values(gradeMap).reduce(
                    (s, secMap) => s + Object.values(secMap).reduce((s2, arr) => s2 + arr.length, 0), 0
                  );
                  const gradeCount = Object.keys(gradeMap).length;
                  return (
                    <div key={schoolName} className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm overflow-hidden">
                      {/* OKUL */}
                      <button
                        onClick={() => { setOpenSchool(openSchool === schoolName ? null : schoolName); setOpenClass(null); setOpenSection(null); }}
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
                        <ChevronRight className={`w-5 h-5 text-gray-300 transition-transform duration-200 ${openSchool === schoolName ? 'rotate-90' : ''}`} />
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
                                  onClick={() => { setOpenClass(openClass === gKey ? null : gKey); setOpenSection(null); }}
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
                                  <ChevronRight className={`w-4 h-4 text-gray-300 transition-transform duration-200 ${openClass === gKey ? 'rotate-90' : ''}`} />
                                </button>

                                {/* ŞUBELER */}
                                {openClass === gKey && (
                                  <div className="bg-white/40">
                                    {Object.entries(secMap).map(([secKey, secStudents]) => {
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
                                                <p className="text-[10px] text-gray-400">{secStudents.length} öğrenci</p>
                                              </div>
                                            </div>
                                            <ChevronRight className={`w-4 h-4 text-gray-300 transition-transform duration-200 ${openSection === sKey ? 'rotate-90' : ''}`} />
                                          </button>

                                          {/* ÖĞRENCİLER */}
                                          {openSection === sKey && (
                                            <div className="divide-y divide-gray-50">
                                              {secStudents.map((s) => (
                                                <div key={s.id} className={`flex items-center justify-between px-4 py-3 pl-20 hover:bg-violet-50/40 transition-colors gap-2 ${selectedStudentIds.has(s.id) ? 'bg-amber-50/60' : ''}`}>
                                                  <input
                                                    type="checkbox"
                                                    checked={selectedStudentIds.has(s.id)}
                                                    onChange={() => toggleStudentSelect(s.id)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500/30 cursor-pointer shrink-0"
                                                  />
                                                  <button onClick={() => loadStudentReports(s)} className="flex items-center gap-3 text-left flex-1 min-w-0">
                                                    <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                                                      <GraduationCap className="w-3.5 h-3.5 text-violet-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                      <p className="text-[13px] font-semibold text-[#0f2847] truncate">{s.full_name}</p>
                                                      <p className="text-[11px] text-gray-400">{s.testCount} test · {s.reportCount} rapor</p>
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
                {graduatedStudents.length > 0 && (
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl shadow-sm overflow-hidden">
                    <button
                      onClick={() => setShowGraduatesSection(!showGraduatesSection)}
                      className="w-full flex items-center justify-between p-4 hover:bg-amber-100/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
                          <Briefcase className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-left">
                          <h4 className="text-[14px] font-extrabold text-[#0f2847]">🎓 Mezunlar</h4>
                          <p className="text-[12px] text-amber-700">{Object.keys(graduatedTree).length} okul · {graduatedStudents.length} mezun</p>
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 text-amber-400 transition-transform duration-200 ${showGraduatesSection ? 'rotate-90' : ''}`} />
                    </button>

                    {showGraduatesSection && (
                      <div className="border-t border-amber-200 bg-white/40">
                        {Object.entries(graduatedTree).map(([schoolName, gradStudents]) => (
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
                                  <p className="text-[11px] text-amber-600">{gradStudents.length} mezun</p>
                                </div>
                              </div>
                              <ChevronRight className={`w-4 h-4 text-amber-400 transition-transform duration-200 ${openGradSchool === schoolName ? 'rotate-90' : ''}`} />
                            </button>

                            {openGradSchool === schoolName && (
                              <div className="divide-y divide-amber-100/50">
                                {gradStudents.map((s) => (
                                  <div key={s.id} className={`flex items-center justify-between px-4 py-3 pl-14 hover:bg-amber-50/40 transition-colors gap-2 ${selectedStudentIds.has(s.id) ? 'bg-amber-100/60' : ''}`}>
                                    <input
                                      type="checkbox"
                                      checked={selectedStudentIds.has(s.id)}
                                      onChange={() => toggleStudentSelect(s.id)}
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500/30 cursor-pointer shrink-0"
                                    />
                                    <button onClick={() => loadStudentReports(s)} className="flex items-center gap-3 text-left flex-1 min-w-0">
                                      <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                                        <Briefcase className="w-3.5 h-3.5 text-amber-600" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-semibold text-[#0f2847] truncate">{s.full_name}</p>
                                        <p className="text-[11px] text-amber-600">Mezun · {s.testCount} test · {s.reportCount} rapor</p>
                                      </div>
                                      <ChevronRight className="w-4 h-4 text-amber-300 shrink-0" />
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

      {/* ═══ ONAY MODAL ═══ */}
      {confirmAction && (
        <div
          onClick={() => setConfirmAction(null)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-modal-in"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${confirmAction.danger ? 'bg-gradient-to-br from-red-500 to-rose-700' : 'bg-gradient-to-br from-amber-500 to-orange-600'}`}>
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-[16px] font-extrabold text-[#0f2847]">{confirmAction.title}</h3>
                <p className="text-[13px] text-gray-600 mt-1">{confirmAction.message}</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                onClick={() => setConfirmAction(null)}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-[13px] font-bold hover:bg-gray-200 disabled:opacity-60 transition-all"
              >
                Vazgeç
              </button>
              <button
                onClick={() => confirmAction.onConfirm()}
                disabled={loading}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-[13px] font-extrabold shadow-md hover:shadow-lg disabled:opacity-60 transition-all ${confirmAction.danger ? 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800' : 'bg-gradient-to-r from-amber-500 to-orange-600'}`}
              >
                <Trash2 className="w-4 h-4" /> {loading ? 'Siliniyor...' : 'Evet, Sil'}
              </button>
            </div>
          </div>

          <style jsx>{`
            @keyframes modal-in {
              0% { opacity: 0; transform: scale(0.92) translateY(10px); }
              100% { opacity: 1; transform: scale(1) translateY(0); }
            }
            :global(.animate-modal-in) {
              animation: modal-in 200ms cubic-bezier(0.16, 1, 0.3, 1);
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
