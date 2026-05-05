'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import ReportRenderer from '@/components/ReportRenderer';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import {
  GraduationCap, Shield, Lock, ArrowRight, ArrowLeft, Users, Trash2,
  Phone, MapPin, BookOpen, FileText, ChevronRight, School,
  AlertCircle, CheckCircle2, FolderOpen, User, BarChart3, X,
  Mail, Calendar, Briefcase, Eye, EyeOff, Home, Search, UserPlus
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
      <Icon className="w-4 h-4 text-gray-400 dark:text-slate-500 mt-0.5 shrink-0" />
      <div>
        <span className="text-[12px] text-gray-400 dark:text-slate-500 font-medium">{label}</span>
        <p className="text-sm text-[#0f2847] dark:text-slate-100 font-medium">{value || '—'}</p>
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
      <button onClick={() => setConfirm(false)} className="px-3 py-1 rounded-lg bg-gray-200 text-gray-600 dark:text-slate-300 text-[12px] font-bold hover:bg-gray-300 transition-colors">İptal</button>
    </div>
  ) : (
    <button onClick={() => setConfirm(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-50 text-[12px] font-semibold transition-colors">
      <Trash2 className="w-3.5 h-3.5" /> {label}
    </button>
  );
}

/* ═══ MAIN PAGE ═══ */
export default function YoneticiPage() {
  const { confirm } = useConfirm();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState('');

  // Views: 'teachers' | 'pending-teachers' | 'pending-students' | 'pending-parents' | 'registered-students' | 'registered-parents' | 'teacher-detail' | 'student-detail' | 'report-view'
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

  // ═══ Yeni: Onay bekleyen ve kayıtlı öğrenci/veli listeleri ═══
  type SimpleUser = {
    id: string; full_name: string; email: string; phone: string; role: string;
    grade: string | null; school_name: string; assigned_teacher_id: string | null;
    branch: string | null; student_code: string | null; child_name: string | null;
    created_at: string; assigned_teacher_name?: string | null;
  };
  type SimpleTeacher = { id: string; full_name: string; email: string; branch: string | null };

  const [pendingStudents, setPendingStudents] = useState<SimpleUser[]>([]);
  const [pendingParents, setPendingParents] = useState<SimpleUser[]>([]);
  const [registeredStudents, setRegisteredStudents] = useState<SimpleUser[]>([]);
  const [registeredParents, setRegisteredParents] = useState<SimpleUser[]>([]);
  const [approvedTeachersSimple, setApprovedTeachersSimple] = useState<SimpleTeacher[]>([]);

  const [searchPS, setSearchPS] = useState('');
  const [searchPP, setSearchPP] = useState('');
  const [searchRS, setSearchRS] = useState('');
  const [searchRP, setSearchRP] = useState('');
  const [searchPT, setSearchPT] = useState('');
  const [searchRT, setSearchRT] = useState('');

  // Öğretmen Ata modal state
  const [assignModalUser, setAssignModalUser] = useState<SimpleUser | null>(null);
  const [assignModalMode, setAssignModalMode] = useState<'approve' | 'reassign'>('approve');
  const [assignModalSelectedTeacher, setAssignModalSelectedTeacher] = useState<string>('');

  // ═══ Yeni: Tüm Testler & Tüm Raporlar ═══
  type AllTestRow = {
    id: string; student_id: string; student_name: string;
    teacher_id: string | null; teacher_name: string | null;
    test_type: string; completed_at: string; has_report: boolean;
  };
  type AllReportRow = {
    id: string; student_id: string; student_name: string;
    teacher_id: string | null; teacher_name: string | null;
    report_kind: 'single' | 'integrated' | 'holistic';
    test_type: string | null; generated_at: string;
  };
  const [allTests, setAllTests] = useState<AllTestRow[]>([]);
  const [allReports, setAllReports] = useState<AllReportRow[]>([]);
  const [searchAT, setSearchAT] = useState('');
  const [searchAR, setSearchAR] = useState('');
  const [filterTeacherAT, setFilterTeacherAT] = useState<string>('all');
  const [filterTeacherAR, setFilterTeacherAR] = useState<string>('all');
  const [filterTestTypeAT, setFilterTestTypeAT] = useState<string>('all');
  const [filterTestTypeAR, setFilterTestTypeAR] = useState<string>('all');

  // ═══ Şifre Sıfırlama state ═══
  type PasswordResetResult = {
    new_password: string;
    user: { id: string; email: string; full_name: string; role: string };
  };
  type PasswordRequest = {
    id: string;
    user_id: string | null;
    email: string;
    role: string;
    status: string;
    created_at: string;
    user_full_name?: string;
    user_role?: string;
    user_email?: string;
    notes?: string | null;
  };
  const [passwordResult, setPasswordResult] = useState<PasswordResetResult | null>(null);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [passwordRequests, setPasswordRequests] = useState<PasswordRequest[]>([]);
  const [searchPR, setSearchPR] = useState('');
  const [filterPRStatus, setFilterPRStatus] = useState<'pending' | 'resolved' | 'cancelled'>('pending');

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
      loadAllPending(pw);
      loadApprovedTeachersSimple(pw);
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
    const ok = await confirm({
      variant: 'danger',
      title: 'Başvuruyu reddet?',
      description: 'Hesap silinecek. Bu işlem geri alınamaz. Öğretmen tekrar kayıt olmalıdır.',
      confirmLabel: 'Evet, Reddet',
    });
    if (!ok) return;
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

  // ═══ Yeni: Öğrenci & Veli loader'ları ═══
  const loadPendingStudents = async (pw: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await apiCall(pw, 'list-pending-students');
      setPendingStudents(data.users || []);
    } catch (e: unknown) {
      setError((e as Error).message);
    }
    setLoading(false);
  };
  const loadPendingParents = async (pw: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await apiCall(pw, 'list-pending-parents');
      setPendingParents(data.users || []);
    } catch (e: unknown) {
      setError((e as Error).message);
    }
    setLoading(false);
  };
  const loadRegisteredStudents = async (pw: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await apiCall(pw, 'list-registered-students');
      setRegisteredStudents(data.users || []);
    } catch (e: unknown) {
      setError((e as Error).message);
    }
    setLoading(false);
  };
  const loadRegisteredParents = async (pw: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await apiCall(pw, 'list-registered-parents');
      setRegisteredParents(data.users || []);
    } catch (e: unknown) {
      setError((e as Error).message);
    }
    setLoading(false);
  };
  const loadApprovedTeachersSimple = async (pw: string) => {
    try {
      const data = await apiCall(pw, 'list-approved-teachers-simple');
      setApprovedTeachersSimple(data.teachers || []);
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  };

  // Onay bekleyenleri toplu yenile (badge için)
  const loadAllPending = async (pw: string) => {
    try {
      const [s, t, p] = await Promise.all([
        apiCall(pw, 'list-pending-students'),
        apiCall(pw, 'list-pending-teachers'),
        apiCall(pw, 'list-pending-parents'),
      ]);
      setPendingStudents(s.users || []);
      setPendingTeachers(t.pending || []);
      setPendingParents(p.users || []);
    } catch { /* ignore */ }
  };

  // Öğrenci onay (atama olmadan)
  const approveStudentOnly = async (userId: string) => {
    setLoading(true);
    setError('');
    try {
      await apiCall(storedPw(), 'approve-student', { userId });
      setSuccessMsg('Öğrenci onaylandı.');
      setTimeout(() => setSuccessMsg(''), 3000);
      loadPendingStudents(storedPw());
      loadRegisteredStudents(storedPw());
    } catch (e: unknown) {
      setError((e as Error).message);
    }
    setLoading(false);
  };

  // Öğrenci onayla + öğretmen ata (modal'dan çağrılır)
  const approveStudentWithTeacher = async (userId: string, teacherId: string) => {
    setLoading(true);
    setError('');
    try {
      await apiCall(storedPw(), 'approve-student', { userId, teacherId });
      const tName = approvedTeachersSimple.find(t => t.id === teacherId)?.full_name || 'öğretmen';
      setSuccessMsg(`Öğrenci onaylandı ve ${tName} öğretmenine atandı.`);
      setTimeout(() => setSuccessMsg(''), 3000);
      setAssignModalUser(null);
      setAssignModalSelectedTeacher('');
      loadPendingStudents(storedPw());
      loadRegisteredStudents(storedPw());
    } catch (e: unknown) {
      setError((e as Error).message);
    }
    setLoading(false);
  };

  // Kayıtlı öğrencinin atandığı öğretmeni değiştir
  const reassignStudentTeacher = async (userId: string, teacherId: string) => {
    setLoading(true);
    setError('');
    try {
      await apiCall(storedPw(), 'reassign-student-teacher', { userId, teacherId });
      const tName = approvedTeachersSimple.find(t => t.id === teacherId)?.full_name || 'öğretmen';
      setSuccessMsg(`Öğretmen ataması güncellendi: ${tName}`);
      setTimeout(() => setSuccessMsg(''), 3000);
      setAssignModalUser(null);
      setAssignModalSelectedTeacher('');
      loadRegisteredStudents(storedPw());
    } catch (e: unknown) {
      setError((e as Error).message);
    }
    setLoading(false);
  };

  const approveParent = async (userId: string) => {
    setLoading(true);
    setError('');
    try {
      await apiCall(storedPw(), 'approve-parent', { userId });
      setSuccessMsg('Veli onaylandı.');
      setTimeout(() => setSuccessMsg(''), 3000);
      loadPendingParents(storedPw());
      loadRegisteredParents(storedPw());
    } catch (e: unknown) {
      setError((e as Error).message);
    }
    setLoading(false);
  };

  const rejectStudent = async (userId: string) => {
    const ok = await confirm({
      variant: 'danger',
      title: 'Öğrenci başvurusunu reddet?',
      description: 'Hesap ve tüm verileri silinecek. Bu işlem geri alınamaz.',
      confirmLabel: 'Evet, Reddet',
    });
    if (!ok) return;
    setLoading(true);
    setError('');
    try {
      await apiCall(storedPw(), 'reject-student', { userId });
      setSuccessMsg('Başvuru reddedildi.');
      setTimeout(() => setSuccessMsg(''), 3000);
      loadPendingStudents(storedPw());
    } catch (e: unknown) {
      setError((e as Error).message);
    }
    setLoading(false);
  };

  const rejectParent = async (userId: string) => {
    const ok = await confirm({
      variant: 'danger',
      title: 'Veli başvurusunu reddet?',
      description: 'Hesap silinecek. Bu işlem geri alınamaz.',
      confirmLabel: 'Evet, Reddet',
    });
    if (!ok) return;
    setLoading(true);
    setError('');
    try {
      await apiCall(storedPw(), 'reject-parent', { userId });
      setSuccessMsg('Başvuru reddedildi.');
      setTimeout(() => setSuccessMsg(''), 3000);
      loadPendingParents(storedPw());
    } catch (e: unknown) {
      setError((e as Error).message);
    }
    setLoading(false);
  };

  // Modal helper'ları
  const openApproveStudentModal = async (u: SimpleUser) => {
    if (approvedTeachersSimple.length === 0) {
      await loadApprovedTeachersSimple(storedPw());
    }
    setAssignModalMode('approve');
    setAssignModalSelectedTeacher('');
    setAssignModalUser(u);
  };
  const openReassignTeacherModal = async (u: SimpleUser) => {
    if (approvedTeachersSimple.length === 0) {
      await loadApprovedTeachersSimple(storedPw());
    }
    setAssignModalMode('reassign');
    setAssignModalSelectedTeacher(u.assigned_teacher_id || '');
    setAssignModalUser(u);
  };

  // ═══ Yeni: Tüm Testler & Raporlar Loader'ları ═══
  const loadAllTests = async (pw: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await apiCall(pw, 'list-all-tests');
      setAllTests(data.tests || []);
    } catch (e: unknown) {
      setError((e as Error).message);
    }
    setLoading(false);
  };

  const loadAllReports = async (pw: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await apiCall(pw, 'list-all-reports');
      setAllReports(data.reports || []);
    } catch (e: unknown) {
      setError((e as Error).message);
    }
    setLoading(false);
  };

  // ═══ Şifre Sıfırlama ═══
  const resetUserPassword = async (userId: string, displayName: string) => {
    const ok = await confirm({
      variant: 'warning',
      title: 'Şifre sıfırlansın mı?',
      description: `${displayName} kullanıcısının şifresi yeni bir geçici şifre ile değiştirilecek. Eski şifre artık çalışmayacak. Yeni şifreyi modal'da görüp kullanıcıya ileteceksiniz. Devam edilsin mi?`,
      confirmLabel: 'Evet, Yeni Şifre Üret',
    });
    if (!ok) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiCall(storedPw(), 'reset-user-password', { userId });
      setPasswordResult({
        new_password: data.new_password,
        user: data.user,
      });
      setPasswordCopied(false);
      // Şifre talepleri listesini de yenile (varsa o kullanıcıdan beklemede olan)
      if (view === 'password-requests') {
        loadPasswordRequests(storedPw(), filterPRStatus);
      }
    } catch (e: unknown) {
      setError((e as Error).message);
    }
    setLoading(false);
  };

  const copyPasswordToClipboard = async () => {
    if (!passwordResult) return;
    try {
      await navigator.clipboard.writeText(passwordResult.new_password);
      setPasswordCopied(true);
      setTimeout(() => setPasswordCopied(false), 2500);
    } catch {
      // fallback: select+copy
      const ta = document.createElement('textarea');
      ta.value = passwordResult.new_password;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setPasswordCopied(true);
      setTimeout(() => setPasswordCopied(false), 2500);
    }
  };

  const loadPasswordRequests = async (pw: string, status: 'pending' | 'resolved' | 'cancelled') => {
    setLoading(true);
    setError('');
    try {
      const data = await apiCall(pw, 'list-password-requests', { status });
      setPasswordRequests(data.requests || []);
    } catch (e: unknown) {
      setError((e as Error).message);
    }
    setLoading(false);
  };

  const cancelPasswordRequest = async (requestId: string) => {
    const ok = await confirm({
      variant: 'danger',
      title: 'Talebi iptal et?',
      description: 'Talep iptal edilmiş olarak işaretlenecek. Kullanıcının şifresi DEĞİŞTİRİLMEZ. Bu işlem yalnızca talebi listeden kaldırır.',
      confirmLabel: 'Evet, İptal Et',
    });
    if (!ok) return;
    setLoading(true);
    setError('');
    try {
      await apiCall(storedPw(), 'cancel-password-request', { requestId });
      setSuccessMsg('Talep iptal edildi.');
      setTimeout(() => setSuccessMsg(''), 3000);
      loadPasswordRequests(storedPw(), filterPRStatus);
    } catch (e: unknown) {
      setError((e as Error).message);
    }
    setLoading(false);
  };

  // Tek tıkla rapor görüntüleme: önce student-reports'tan rapor objesini çek
  const openReportDirect = async (studentId: string, reportId: string, kind: 'single' | 'integrated') => {
    setLoading(true);
    setError('');
    try {
      const data = await apiCall(storedPw(), 'student-reports', { studentId });
      if (kind === 'single') {
        const r = (data.reports || []).find((x: Report) => x.id === reportId);
        if (r) {
          setReports(data.reports || []);
          setIntegratedReports(data.integratedReports || []);
          setSelectedReport(r);
          setReportType('single');
          setView('report-view');
        } else {
          setError('Rapor bulunamadı.');
        }
      } else {
        const ir = (data.integratedReports || []).find((x: IntegratedReport) => x.id === reportId);
        if (ir) {
          setReports(data.reports || []);
          setIntegratedReports(data.integratedReports || []);
          setSelectedReport(ir);
          setReportType('integrated');
          setView('report-view');
        } else {
          setError('Rapor bulunamadı.');
        }
      }
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
      <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-br from-slate-50 via-white to-slate-50 relative overflow-hidden">
        {/* Aurora */}
        <div className="pointer-events-none fixed top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-amber-200/40 to-orange-200/30 blur-3xl yonetici-blob-1" />
        <div className="pointer-events-none fixed bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-rose-200/30 to-red-200/20 blur-3xl yonetici-blob-2" />
        {/* Grid */}
        <div
          className="pointer-events-none fixed inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(15,40,71,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(15,40,71,0.5) 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative w-full max-w-md yonetici-enter">
          <Link href="/" className="flex items-center justify-center gap-3 mb-7 group">
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all">
              <Shield className="w-6 h-6 text-white relative z-10" />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/40 to-transparent" />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 opacity-50 blur-xl -z-10" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-[#0f2847] dark:text-slate-100 tracking-tight">Yönetici Paneli</h1>
              <p className="text-[10.5px] text-gray-500 dark:text-slate-400 font-bold tracking-wider uppercase -mt-0.5">Güvenli Giriş</p>
            </div>
          </Link>

          <div className="relative bg-white/85 backdrop-blur-2xl rounded-3xl border border-white/60 dark:border-slate-700/60 shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />
            <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 opacity-[0.08] blur-3xl pointer-events-none" />

            <div className="relative p-8">
              <div className="inline-flex items-center gap-1.5 mb-4 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white text-[10.5px] font-extrabold tracking-wider shadow-md">
                <Shield className="w-3 h-3" />
                Yetkili Erişim
              </div>

              <h2 className="text-[26px] font-extrabold text-[#0f2847] dark:text-slate-100 mb-1.5 tracking-tight">Yönetici Girişi</h2>
              <p className="text-[13.5px] text-gray-500 dark:text-slate-400 mb-6 leading-relaxed">Yönetici şifresini girerek platformu yönetebilirsiniz</p>

              {authError && (
                <div className="mb-5 p-3.5 rounded-2xl bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 flex items-center gap-2 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="font-medium">{authError}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 dark:text-slate-300 mb-1.5">Yönetici Şifresi</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md pointer-events-none">
                      <Lock className="w-4 h-4 text-white" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                      placeholder="Şifrenizi girin"
                      className="w-full pl-14 pr-12 py-3.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-gray-100 dark:bg-slate-700/60 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:text-slate-300 transition-colors"
                      aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleLogin}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white text-[14px] font-extrabold shadow-lg shadow-amber-500/40 hover:shadow-xl hover:shadow-amber-500/50 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  Giriş Yap <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <Link
                href="/"
                className="mt-6 flex items-center justify-center gap-1.5 text-[13px] text-gray-500 dark:text-slate-400 hover:text-amber-600 font-bold transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Ana Sayfaya Dön
              </Link>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes yonetici-enter {
            from { opacity: 0; transform: translateY(16px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          .yonetici-enter {
            animation: yonetici-enter 500ms cubic-bezier(0.16, 1, 0.3, 1) backwards;
          }
          @keyframes yonetici-blob-drift-1 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(-30px, 30px) scale(1.08); }
          }
          @keyframes yonetici-blob-drift-2 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(30px, -30px) scale(1.1); }
          }
          .yonetici-blob-1 { animation: yonetici-blob-drift-1 20s ease-in-out infinite; }
          .yonetici-blob-2 { animation: yonetici-blob-drift-2 25s ease-in-out infinite 3s; }
        `}</style>
      </div>
    );
  }

  // ═══ ADMIN PANEL ═══
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 relative">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-20%] right-[-15%] w-[700px] h-[700px] rounded-full bg-gradient-to-br from-amber-200/40 to-orange-200/30 blur-3xl" />
        <div className="absolute bottom-[-25%] left-[-15%] w-[650px] h-[650px] rounded-full bg-gradient-to-br from-rose-200/30 to-pink-200/20 blur-3xl" />
        <div className="absolute top-[30%] left-[30%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-yellow-100/30 to-amber-100/20 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.018]"
          style={{
            backgroundImage: 'linear-gradient(rgba(15,40,71,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(15,40,71,0.5) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      {/* Header */}
      <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur-2xl border-b border-gray-200 dark:border-slate-700/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center shadow-lg shadow-amber-400/50">
              <Shield className="w-5 h-5 text-white relative z-10" />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/30 to-transparent" />
            </div>
            <div>
              <span className="text-[14.5px] font-extrabold text-[#0f2847] dark:text-slate-100 tracking-tight block leading-tight">Yönetici Paneli</span>
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Yetkili Erişim</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={goBack}
              disabled={!canGoBack}
              aria-label="Bir adım geri"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-[12px] font-bold text-[#0f2847] dark:text-slate-100 hover:bg-amber-50 hover:border-amber-300 hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Geri</span>
            </button>
            <button
              onClick={goForward}
              disabled={!canGoForward}
              aria-label="Bir adım ileri"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-[12px] font-bold text-[#0f2847] dark:text-slate-100 hover:bg-amber-50 hover:border-amber-300 hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              <span className="hidden sm:inline">İleri</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <div className="w-px h-6 bg-gray-200 mx-1" />

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12.5px] text-gray-600 dark:text-slate-300 hover:text-amber-600 hover:bg-amber-50 font-bold transition-colors"
              aria-label="Ana sayfaya git"
            >
              <Home className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ana Sayfa</span>
            </Link>

            <button
              onClick={() => { setAuthed(false); setPassword(''); setView('teachers'); setSelectedTeacher(null); setSelectedStudent(null); setHistory([]); setHistoryIndex(-1); }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12.5px] text-gray-600 dark:text-slate-300 hover:text-red-500 hover:bg-red-50 font-bold transition-colors"
            >
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

        {/* Tabs — 6 klasör grubu */}
        <div className="mb-6 border-b border-gray-200 dark:border-slate-700 pb-3 space-y-2">
          {/* Onay Bekleyenler */}
          <div>
            <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <AlertCircle className="w-3 h-3" /> Onay Bekleyenler
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => { setView('pending-students'); loadPendingStudents(storedPw()); }}
                className={`text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${view === 'pending-students' ? 'bg-violet-100 text-violet-700 ring-1 ring-violet-300' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-slate-800 dark:text-slate-300'}`}>
                Öğrenciler
                {pendingStudents.length > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-violet-500 text-white text-[10px] font-bold flex items-center justify-center">{pendingStudents.length}</span>
                )}
              </button>
              <button onClick={() => { setView('pending-teachers'); loadPendingTeachers(storedPw()); }}
                className={`text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${view === 'pending-teachers' ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-slate-800 dark:text-slate-300'}`}>
                Öğretmenler
                {pendingTeachers.length > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">{pendingTeachers.length}</span>
                )}
              </button>
              <button onClick={() => { setView('pending-parents'); loadPendingParents(storedPw()); }}
                className={`text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${view === 'pending-parents' ? 'bg-pink-100 text-pink-700 ring-1 ring-pink-300' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-slate-800 dark:text-slate-300'}`}>
                Veliler
                {pendingParents.length > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-pink-500 text-white text-[10px] font-bold flex items-center justify-center">{pendingParents.length}</span>
                )}
              </button>
            </div>
          </div>

          {/* Kayıtlılar */}
          <div>
            <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3" /> Kayıtlılar
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => { setView('registered-students'); loadRegisteredStudents(storedPw()); loadApprovedTeachersSimple(storedPw()); }}
                className={`text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-all ${view === 'registered-students' ? 'bg-violet-100 text-violet-700 ring-1 ring-violet-300' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-slate-800 dark:text-slate-300'}`}>
                Kayıtlı Öğrenciler
              </button>
              <button onClick={() => { setView('teachers'); setSelectedTeacher(null); setSelectedStudent(null); }}
                className={`text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-all ${view === 'teachers' || view === 'teacher-detail' || view === 'student-detail' || view === 'report-view' ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-slate-800 dark:text-slate-300'}`}>
                Kayıtlı Öğretmenler <span className="text-[10px] opacity-60 ml-0.5">({teachers.length})</span>
              </button>
              <button onClick={() => { setView('registered-parents'); loadRegisteredParents(storedPw()); }}
                className={`text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-all ${view === 'registered-parents' ? 'bg-pink-100 text-pink-700 ring-1 ring-pink-300' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-slate-800 dark:text-slate-300'}`}>
                Kayıtlı Veliler
              </button>
            </div>
          </div>

          {/* Test & Raporlar */}
          <div>
            <div className="text-[10px] font-bold text-sky-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <BarChart3 className="w-3 h-3" /> Test & Raporlar
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => { setView('all-tests'); loadAllTests(storedPw()); }}
                className={`text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-all ${view === 'all-tests' ? 'bg-sky-100 text-sky-700 ring-1 ring-sky-300' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-slate-800 dark:text-slate-300'}`}>
                Yapılan Testler
              </button>
              <button onClick={() => { setView('all-reports'); loadAllReports(storedPw()); }}
                className={`text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-all ${view === 'all-reports' ? 'bg-sky-100 text-sky-700 ring-1 ring-sky-300' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-slate-800 dark:text-slate-300'}`}>
                Üretilen Raporlar
              </button>
            </div>
          </div>

          {/* Şifre Yönetimi */}
          <div>
            <div className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3 h-3" /> Şifre Yönetimi
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => { setView('password-requests'); loadPasswordRequests(storedPw(), 'pending'); setFilterPRStatus('pending'); }}
                className={`text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-all ${view === 'password-requests' ? 'bg-orange-100 text-orange-700 ring-1 ring-orange-300' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-slate-800 dark:text-slate-300'}`}>
                Şifre Talepleri
              </button>
            </div>
          </div>
        </div>

        {/* Breadcrumb (detay sayfaları için) */}
        {(view === 'teacher-detail' || view === 'student-detail' || view === 'report-view') && (
        <div className="flex items-center gap-2 mb-6 text-[13px] text-gray-400 dark:text-slate-500">
          <button onClick={() => { setView('teachers'); setSelectedTeacher(null); setSelectedStudent(null); }}
            className="hover:text-[#0f2847] dark:text-slate-100 transition-colors">
            Öğretmenler
          </button>
          {selectedTeacher && (
            <>
              <ChevronRight className="w-3.5 h-3.5" />
              <button onClick={() => { setView('teacher-detail'); setSelectedStudent(null); }}
                className={`hover:text-[#0f2847] dark:text-slate-100 transition-colors ${view === 'teacher-detail' ? 'text-[#0f2847] dark:text-slate-100 font-bold' : ''}`}>
                {selectedTeacher.full_name}
              </button>
            </>
          )}
          {selectedStudent && (
            <>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-[#0f2847] dark:text-slate-100 font-bold">{selectedStudent.full_name}</span>
            </>
          )}
        </div>
        )}

        {/* ═══ VIEW: Pending Teachers ═══ */}
        {view === 'pending-teachers' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-extrabold text-[#0f2847] dark:text-slate-100">Onay Bekleyen Öğretmenler</h2>
              <button onClick={() => loadPendingTeachers(storedPw())} className="text-sm text-emerald-600 font-semibold hover:underline">Yenile</button>
            </div>
            {loading ? (
              <div className="text-center py-20 text-gray-400 dark:text-slate-500">Yükleniyor...</div>
            ) : pendingTeachers.length === 0 ? (
              <div className="text-center py-20">
                <CheckCircle2 className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
                <p className="text-gray-400 dark:text-slate-500">Onay bekleyen başvuru yok.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {pendingTeachers.map(t => (
                  <div key={t.id} className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-amber-200 p-5 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">
                            {t.full_name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-[#0f2847] dark:text-slate-100">{t.full_name}</p>
                            <p className="text-xs text-amber-600 font-semibold">Onay Bekliyor</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                          <div className="bg-gray-50 dark:bg-slate-800/60 rounded-lg p-2">
                            <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase font-bold">Branş</p>
                            <p className="text-xs font-semibold text-[#0f2847] dark:text-slate-100 truncate">{t.branch}</p>
                          </div>
                          <div className="bg-gray-50 dark:bg-slate-800/60 rounded-lg p-2">
                            <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase font-bold">Kurum</p>
                            <p className="text-xs font-semibold text-[#0f2847] dark:text-slate-100 truncate">{t.school_name}</p>
                          </div>
                          <div className="bg-gray-50 dark:bg-slate-800/60 rounded-lg p-2">
                            <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase font-bold">E-posta</p>
                            <p className="text-xs font-semibold text-[#0f2847] dark:text-slate-100 truncate">{t.email}</p>
                          </div>
                          <div className="bg-gray-50 dark:bg-slate-800/60 rounded-lg p-2">
                            <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase font-bold">Telefon</p>
                            <p className="text-xs font-semibold text-[#0f2847] dark:text-slate-100">{t.phone}</p>
                          </div>
                        </div>
                        <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-2">Başvuru: {new Date(t.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
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

        {/* ═══ VIEW: Pending Students ═══ */}
        {view === 'pending-students' && (() => {
          const filtered = pendingStudents.filter(u => {
            if (!searchPS) return true;
            const q = searchPS.toLowerCase();
            return u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
          });
          return (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h2 className="text-xl font-extrabold text-[#0f2847] dark:text-slate-100">Onay Bekleyen Öğrenciler</h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400 dark:text-slate-500 font-medium">{filtered.length} kişi</span>
                  <button onClick={() => loadPendingStudents(storedPw())} className="text-sm text-violet-600 font-semibold hover:underline">Yenile</button>
                </div>
              </div>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text" value={searchPS} onChange={e => setSearchPS(e.target.value)}
                  placeholder="İsim veya e-posta ile ara..."
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/70 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                />
              </div>
              {loading ? (
                <div className="text-center py-20 text-gray-400 dark:text-slate-500">Yükleniyor...</div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-20">
                  <CheckCircle2 className="w-12 h-12 text-violet-300 mx-auto mb-3" />
                  <p className="text-gray-400 dark:text-slate-500">{searchPS ? 'Aramayla eşleşen öğrenci yok.' : 'Onay bekleyen öğrenci başvurusu yok.'}</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {filtered.map(u => (
                    <div key={u.id} className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-violet-200 p-4 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-sm">
                              {u.full_name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-[#0f2847] dark:text-slate-100">{u.full_name}</p>
                              <p className="text-xs text-violet-600 font-semibold">Onay Bekliyor</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                            <div className="bg-gray-50 dark:bg-slate-800/60 rounded-lg p-2">
                              <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase font-bold">Sınıf</p>
                              <p className="text-xs font-semibold text-[#0f2847] dark:text-slate-100">{u.grade || '—'}</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-slate-800/60 rounded-lg p-2">
                              <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase font-bold">Okul</p>
                              <p className="text-xs font-semibold text-[#0f2847] dark:text-slate-100 truncate">{u.school_name}</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-slate-800/60 rounded-lg p-2">
                              <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase font-bold">E-posta</p>
                              <p className="text-xs font-semibold text-[#0f2847] dark:text-slate-100 truncate">{u.email}</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-slate-800/60 rounded-lg p-2">
                              <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase font-bold">Telefon</p>
                              <p className="text-xs font-semibold text-[#0f2847] dark:text-slate-100">{u.phone}</p>
                            </div>
                          </div>
                          <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-2">Başvuru: {new Date(u.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                        </div>
                        <div className="flex sm:flex-col gap-2 shrink-0">
                          <button onClick={() => openApproveStudentModal(u)} disabled={loading}
                            className="flex-1 sm:w-44 py-2.5 px-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-bold hover:from-violet-600 hover:to-purple-700 transition-all flex items-center justify-center gap-1.5 disabled:opacity-60">
                            <UserPlus className="w-4 h-4" /> Onayla & Öğretmen Ata
                          </button>
                          <button onClick={() => approveStudentOnly(u.id)} disabled={loading}
                            className="flex-1 sm:w-44 py-2 px-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 border border-emerald-200 transition-all flex items-center justify-center gap-1.5 disabled:opacity-60">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Sadece Onayla
                          </button>
                          <button onClick={() => rejectStudent(u.id)} disabled={loading}
                            className="flex-1 sm:w-44 py-2 px-3 rounded-xl bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 border border-red-200 transition-all flex items-center justify-center gap-1.5 disabled:opacity-60">
                            <Trash2 className="w-3.5 h-3.5" /> Reddet
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* ═══ VIEW: Pending Parents ═══ */}
        {view === 'pending-parents' && (() => {
          const filtered = pendingParents.filter(u => {
            if (!searchPP) return true;
            const q = searchPP.toLowerCase();
            return u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
          });
          return (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h2 className="text-xl font-extrabold text-[#0f2847] dark:text-slate-100">Onay Bekleyen Veliler</h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400 dark:text-slate-500 font-medium">{filtered.length} kişi</span>
                  <button onClick={() => loadPendingParents(storedPw())} className="text-sm text-pink-600 font-semibold hover:underline">Yenile</button>
                </div>
              </div>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text" value={searchPP} onChange={e => setSearchPP(e.target.value)}
                  placeholder="İsim veya e-posta ile ara..."
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/70 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                />
              </div>
              {loading ? (
                <div className="text-center py-20 text-gray-400 dark:text-slate-500">Yükleniyor...</div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-20">
                  <CheckCircle2 className="w-12 h-12 text-pink-300 mx-auto mb-3" />
                  <p className="text-gray-400 dark:text-slate-500">{searchPP ? 'Aramayla eşleşen veli yok.' : 'Onay bekleyen veli başvurusu yok.'}</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {filtered.map(u => (
                    <div key={u.id} className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-pink-200 p-4 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center text-pink-700 font-bold text-sm">
                              {u.full_name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-[#0f2847] dark:text-slate-100">{u.full_name}</p>
                              <p className="text-xs text-pink-600 font-semibold">Onay Bekliyor</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                            <div className="bg-gray-50 dark:bg-slate-800/60 rounded-lg p-2">
                              <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase font-bold">E-posta</p>
                              <p className="text-xs font-semibold text-[#0f2847] dark:text-slate-100 truncate">{u.email}</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-slate-800/60 rounded-lg p-2">
                              <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase font-bold">Telefon</p>
                              <p className="text-xs font-semibold text-[#0f2847] dark:text-slate-100">{u.phone}</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-slate-800/60 rounded-lg p-2">
                              <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase font-bold">Çocuk</p>
                              <p className="text-xs font-semibold text-[#0f2847] dark:text-slate-100 truncate">{u.child_name || '—'}</p>
                            </div>
                          </div>
                          <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-2">Başvuru: {new Date(u.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                        </div>
                        <div className="flex sm:flex-col gap-2 shrink-0">
                          <button onClick={() => approveParent(u.id)} disabled={loading}
                            className="flex-1 sm:w-28 py-2.5 rounded-xl bg-pink-500 text-white text-sm font-bold hover:bg-pink-600 transition-all flex items-center justify-center gap-1.5 disabled:opacity-60">
                            <CheckCircle2 className="w-4 h-4" /> Onayla
                          </button>
                          <button onClick={() => rejectParent(u.id)} disabled={loading}
                            className="flex-1 sm:w-28 py-2.5 rounded-xl bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-all flex items-center justify-center gap-1.5 border border-red-200 disabled:opacity-60">
                            <Trash2 className="w-4 h-4" /> Reddet
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* ═══ VIEW: Registered Students ═══ */}
        {view === 'registered-students' && (() => {
          const filtered = registeredStudents.filter(u => {
            if (!searchRS) return true;
            const q = searchRS.toLowerCase();
            return u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
          });
          return (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h2 className="text-xl font-extrabold text-[#0f2847] dark:text-slate-100">Kayıtlı Öğrenciler</h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400 dark:text-slate-500 font-medium">{filtered.length} öğrenci</span>
                  <button onClick={() => loadRegisteredStudents(storedPw())} className="text-sm text-violet-600 font-semibold hover:underline">Yenile</button>
                </div>
              </div>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text" value={searchRS} onChange={e => setSearchRS(e.target.value)}
                  placeholder="İsim veya e-posta ile ara..."
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/70 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                />
              </div>
              {loading ? (
                <div className="text-center py-20 text-gray-400 dark:text-slate-500">Yükleniyor...</div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-20">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-400 dark:text-slate-500">{searchRS ? 'Aramayla eşleşen öğrenci yok.' : 'Henüz kayıtlı öğrenci yok.'}</p>
                </div>
              ) : (
                <div className="grid gap-2">
                  {filtered.map(u => (
                    <div key={u.id} className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-xl border border-gray-200 dark:border-slate-700 p-3 shadow-sm hover:border-violet-300 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-xs shrink-0">
                          {u.full_name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-[#0f2847] dark:text-slate-100 truncate">{u.full_name}</p>
                            <p className="text-[11px] text-gray-500 truncate">{u.email}</p>
                          </div>
                          <div className="text-xs">
                            <span className="text-gray-400">Sınıf:</span> <span className="font-semibold text-[#0f2847] dark:text-slate-100">{u.grade || '—'}</span>
                          </div>
                          <div className="text-xs min-w-0">
                            <span className="text-gray-400">Öğretmen:</span>{' '}
                            {u.assigned_teacher_name ? (
                              <span className="font-semibold text-emerald-700">{u.assigned_teacher_name}</span>
                            ) : (
                              <span className="font-semibold text-amber-600">Atanmamış</span>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-400">
                            {u.phone}
                          </div>
                        </div>
                        <button onClick={() => openReassignTeacherModal(u)} disabled={loading}
                          className="shrink-0 py-1.5 px-3 rounded-lg bg-violet-50 text-violet-700 text-xs font-semibold hover:bg-violet-100 border border-violet-200 transition-all flex items-center gap-1 disabled:opacity-60">
                          <UserPlus className="w-3.5 h-3.5" /> {u.assigned_teacher_id ? 'Değiştir' : 'Ata'}
                        </button>
                        <button onClick={() => resetUserPassword(u.id, u.full_name)} disabled={loading}
                          className="shrink-0 py-1.5 px-3 rounded-lg bg-orange-50 text-orange-700 text-xs font-semibold hover:bg-orange-100 border border-orange-200 transition-all flex items-center gap-1 disabled:opacity-60">
                          <Lock className="w-3.5 h-3.5" /> Şifre Sıfırla
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* ═══ VIEW: Registered Parents ═══ */}
        {view === 'registered-parents' && (() => {
          const filtered = registeredParents.filter(u => {
            if (!searchRP) return true;
            const q = searchRP.toLowerCase();
            return u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
          });
          return (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h2 className="text-xl font-extrabold text-[#0f2847] dark:text-slate-100">Kayıtlı Veliler</h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400 dark:text-slate-500 font-medium">{filtered.length} veli</span>
                  <button onClick={() => loadRegisteredParents(storedPw())} className="text-sm text-pink-600 font-semibold hover:underline">Yenile</button>
                </div>
              </div>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text" value={searchRP} onChange={e => setSearchRP(e.target.value)}
                  placeholder="İsim veya e-posta ile ara..."
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/70 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                />
              </div>
              {loading ? (
                <div className="text-center py-20 text-gray-400 dark:text-slate-500">Yükleniyor...</div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-20">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-400 dark:text-slate-500">{searchRP ? 'Aramayla eşleşen veli yok.' : 'Henüz kayıtlı veli yok.'}</p>
                </div>
              ) : (
                <div className="grid gap-2">
                  {filtered.map(u => (
                    <div key={u.id} className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-xl border border-gray-200 dark:border-slate-700 p-3 shadow-sm hover:border-pink-300 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-pink-100 flex items-center justify-center text-pink-700 font-bold text-xs shrink-0">
                          {u.full_name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-[#0f2847] dark:text-slate-100 truncate">{u.full_name}</p>
                            <p className="text-[11px] text-gray-500 truncate">{u.email}</p>
                          </div>
                          <div className="text-xs min-w-0">
                            <span className="text-gray-400">Çocuk:</span>{' '}
                            <span className="font-semibold text-[#0f2847] dark:text-slate-100">{u.child_name || '—'}</span>
                          </div>
                          <div className="text-[11px] text-gray-400">
                            {u.phone}
                          </div>
                        </div>
                        <button onClick={() => resetUserPassword(u.id, u.full_name)} disabled={loading}
                          className="shrink-0 py-1.5 px-3 rounded-lg bg-orange-50 text-orange-700 text-xs font-semibold hover:bg-orange-100 border border-orange-200 transition-all flex items-center gap-1 disabled:opacity-60">
                          <Lock className="w-3.5 h-3.5" /> Şifre Sıfırla
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* ═══ VIEW: All Tests (Yapılan Testler) ═══ */}
        {view === 'all-tests' && (() => {
          // Unique öğretmen ve test türü filtreleri
          const uniqueTeachers = Array.from(
            new Map(allTests.filter(t => t.teacher_id).map(t => [t.teacher_id!, t.teacher_name || '—'])).entries()
          ).sort((a, b) => a[1].localeCompare(b[1]));
          const uniqueTestTypes = Array.from(new Set(allTests.map(t => t.test_type))).sort();

          const filtered = allTests.filter(t => {
            if (filterTeacherAT === 'unassigned' && t.teacher_id) return false;
            if (filterTeacherAT !== 'all' && filterTeacherAT !== 'unassigned' && t.teacher_id !== filterTeacherAT) return false;
            if (filterTestTypeAT !== 'all' && t.test_type !== filterTestTypeAT) return false;
            if (searchAT) {
              const q = searchAT.toLowerCase();
              if (!t.student_name.toLowerCase().includes(q)
                && !(t.teacher_name || '').toLowerCase().includes(q)) return false;
            }
            return true;
          });

          return (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h2 className="text-xl font-extrabold text-[#0f2847] dark:text-slate-100">Yapılan Testler</h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400 dark:text-slate-500 font-medium">{filtered.length} test</span>
                  <button onClick={() => loadAllTests(storedPw())} className="text-sm text-sky-600 font-semibold hover:underline">Yenile</button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" value={searchAT} onChange={e => setSearchAT(e.target.value)}
                    placeholder="Öğrenci veya öğretmen adı..."
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/70 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
                </div>
                <select value={filterTeacherAT} onChange={e => setFilterTeacherAT(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/70 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300">
                  <option value="all">Tüm öğretmenler</option>
                  <option value="unassigned">Atanmamış öğrenciler</option>
                  {uniqueTeachers.map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
                <select value={filterTestTypeAT} onChange={e => setFilterTestTypeAT(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/70 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300">
                  <option value="all">Tüm test türleri</option>
                  {uniqueTestTypes.map(t => (
                    <option key={t} value={t}>{TEST_LABELS[t] || t}</option>
                  ))}
                </select>
              </div>

              {loading ? (
                <div className="text-center py-20 text-gray-400 dark:text-slate-500">Yükleniyor...</div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-20">
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-400 dark:text-slate-500">
                    {searchAT || filterTeacherAT !== 'all' || filterTestTypeAT !== 'all'
                      ? 'Filtreyle eşleşen test yok.'
                      : 'Henüz tamamlanmış test yok.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700">
                  <table className="w-full bg-white dark:bg-slate-800/30 text-sm">
                    <thead className="bg-gray-50 dark:bg-slate-800/60 text-[11px] uppercase font-bold text-gray-500 dark:text-slate-400">
                      <tr>
                        <th className="text-left px-3 py-2">Tarih</th>
                        <th className="text-left px-3 py-2">Öğrenci</th>
                        <th className="text-left px-3 py-2">Atanan Öğretmen</th>
                        <th className="text-left px-3 py-2">Test Türü</th>
                        <th className="text-center px-3 py-2">Rapor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700/60">
                      {filtered.slice(0, 500).map(t => (
                        <tr key={t.id} className="hover:bg-sky-50 dark:hover:bg-slate-800/60 transition-colors">
                          <td className="px-3 py-2 text-[12px] text-gray-500 whitespace-nowrap">
                            {new Date(t.completed_at).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </td>
                          <td className="px-3 py-2 font-semibold text-[#0f2847] dark:text-slate-100">{t.student_name}</td>
                          <td className="px-3 py-2 text-[12px]">
                            {t.teacher_name ? (
                              <span className="text-emerald-700 font-medium">{t.teacher_name}</span>
                            ) : (
                              <span className="text-amber-600 font-medium">Atanmamış</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-[12px] text-[#0f2847] dark:text-slate-100">{TEST_LABELS[t.test_type] || t.test_type}</td>
                          <td className="px-3 py-2 text-center">
                            {t.has_report ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                                <CheckCircle2 className="w-3 h-3" /> Var
                              </span>
                            ) : (
                              <span className="text-[11px] text-gray-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filtered.length > 500 && (
                    <div className="px-3 py-2 bg-gray-50 dark:bg-slate-800/60 text-[11px] text-gray-500 text-center">
                      İlk 500 sonuç gösteriliyor. Daraltmak için filtre kullanın.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* ═══ VIEW: All Reports (Üretilen Raporlar) ═══ */}
        {view === 'all-reports' && (() => {
          const uniqueTeachers = Array.from(
            new Map(allReports.filter(r => r.teacher_id).map(r => [r.teacher_id!, r.teacher_name || '—'])).entries()
          ).sort((a, b) => a[1].localeCompare(b[1]));
          const uniqueTestTypes = Array.from(new Set(allReports.map(r => r.test_type).filter(Boolean) as string[])).sort();

          const filtered = allReports.filter(r => {
            if (filterTeacherAR === 'unassigned' && r.teacher_id) return false;
            if (filterTeacherAR !== 'all' && filterTeacherAR !== 'unassigned' && r.teacher_id !== filterTeacherAR) return false;
            if (filterTestTypeAR !== 'all') {
              if (filterTestTypeAR === 'integrated' && r.report_kind !== 'integrated') return false;
              if (filterTestTypeAR === 'holistic' && r.report_kind !== 'holistic') return false;
              if (filterTestTypeAR !== 'integrated' && filterTestTypeAR !== 'holistic' && r.test_type !== filterTestTypeAR) return false;
            }
            if (searchAR) {
              const q = searchAR.toLowerCase();
              if (!r.student_name.toLowerCase().includes(q)
                && !(r.teacher_name || '').toLowerCase().includes(q)) return false;
            }
            return true;
          });

          return (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h2 className="text-xl font-extrabold text-[#0f2847] dark:text-slate-100">Üretilen Raporlar</h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400 dark:text-slate-500 font-medium">{filtered.length} rapor</span>
                  <button onClick={() => loadAllReports(storedPw())} className="text-sm text-sky-600 font-semibold hover:underline">Yenile</button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" value={searchAR} onChange={e => setSearchAR(e.target.value)}
                    placeholder="Öğrenci veya öğretmen adı..."
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/70 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
                </div>
                <select value={filterTeacherAR} onChange={e => setFilterTeacherAR(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/70 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300">
                  <option value="all">Tüm öğretmenler</option>
                  <option value="unassigned">Atanmamış öğrenciler</option>
                  {uniqueTeachers.map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
                <select value={filterTestTypeAR} onChange={e => setFilterTestTypeAR(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/70 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300">
                  <option value="all">Tüm rapor türleri</option>
                  <option value="integrated">Entegre 3'lü Raporlar</option>
                  <option value="holistic">Bütüncül Raporlar</option>
                  {uniqueTestTypes.map(t => (
                    <option key={t} value={t}>{TEST_LABELS[t] || t} (Tekil)</option>
                  ))}
                </select>
              </div>

              {loading ? (
                <div className="text-center py-20 text-gray-400 dark:text-slate-500">Yükleniyor...</div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-20">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-400 dark:text-slate-500">
                    {searchAR || filterTeacherAR !== 'all' || filterTestTypeAR !== 'all'
                      ? 'Filtreyle eşleşen rapor yok.'
                      : 'Henüz üretilmiş rapor yok.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700">
                  <table className="w-full bg-white dark:bg-slate-800/30 text-sm">
                    <thead className="bg-gray-50 dark:bg-slate-800/60 text-[11px] uppercase font-bold text-gray-500 dark:text-slate-400">
                      <tr>
                        <th className="text-left px-3 py-2">Tarih</th>
                        <th className="text-left px-3 py-2">Öğrenci</th>
                        <th className="text-left px-3 py-2">Atanan Öğretmen</th>
                        <th className="text-left px-3 py-2">Rapor Türü</th>
                        <th className="text-right px-3 py-2">İşlem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700/60">
                      {filtered.slice(0, 500).map(r => (
                        <tr key={`${r.report_kind}-${r.id}`} className="hover:bg-sky-50 dark:hover:bg-slate-800/60 transition-colors">
                          <td className="px-3 py-2 text-[12px] text-gray-500 whitespace-nowrap">
                            {new Date(r.generated_at).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </td>
                          <td className="px-3 py-2 font-semibold text-[#0f2847] dark:text-slate-100">{r.student_name}</td>
                          <td className="px-3 py-2 text-[12px]">
                            {r.teacher_name ? (
                              <span className="text-emerald-700 font-medium">{r.teacher_name}</span>
                            ) : (
                              <span className="text-amber-600 font-medium">Atanmamış</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-[12px]">
                            {r.report_kind === 'integrated' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full font-bold">
                                <FileText className="w-3 h-3" /> Entegre 3'lü
                              </span>
                            ) : r.report_kind === 'holistic' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-bold">
                                <FileText className="w-3 h-3" /> Bütüncül
                              </span>
                            ) : (
                              <span className="text-[#0f2847] dark:text-slate-100">{TEST_LABELS[r.test_type || ''] || r.test_type}</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button
                              onClick={() => openReportDirect(
                                r.student_id,
                                r.id,
                                r.report_kind === 'integrated' ? 'integrated' : 'single'
                              )}
                              disabled={loading || r.report_kind === 'holistic'}
                              className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                              Aç
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filtered.length > 500 && (
                    <div className="px-3 py-2 bg-gray-50 dark:bg-slate-800/60 text-[11px] text-gray-500 text-center">
                      İlk 500 sonuç gösteriliyor. Daraltmak için filtre kullanın.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* ═══ VIEW: Password Requests ═══ */}
        {view === 'password-requests' && (() => {
          const filtered = passwordRequests.filter(r => {
            if (!searchPR) return true;
            const q = searchPR.toLowerCase();
            return (r.user_full_name || '').toLowerCase().includes(q)
              || (r.user_email || r.email || '').toLowerCase().includes(q);
          });
          const roleLabel = (role: string) => ({
            student: 'Öğrenci', teacher: 'Öğretmen', parent: 'Veli', school_admin: 'Okul Yöneticisi',
          } as Record<string, string>)[role] || role;
          const statusLabel = (s: string) => ({
            pending: 'Bekliyor', resolved: 'Çözüldü', cancelled: 'İptal',
          } as Record<string, string>)[s] || s;

          return (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h2 className="text-xl font-extrabold text-[#0f2847] dark:text-slate-100">Şifre Talepleri</h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400 dark:text-slate-500 font-medium">{filtered.length} talep</span>
                  <button onClick={() => loadPasswordRequests(storedPw(), filterPRStatus)} className="text-sm text-orange-600 font-semibold hover:underline">Yenile</button>
                </div>
              </div>

              {/* Bilgi kutusu */}
              <div className="mb-4 p-3 rounded-xl bg-orange-50 border border-orange-200 text-[12px] text-orange-800">
                <strong>Bilgi:</strong> Kullanıcı &quot;Şifremi Unuttum&quot; sayfasından talepte bulunduğunda burada görünür.
                &quot;Şifre Üret&quot; tek tıkla yeni geçici şifre oluşturur — modal&apos;da göreceksin, kopyalayıp kullanıcıya iletirsin.
                İstediğin zaman &quot;Kayıtlı Öğrenci/Öğretmen/Veli&quot; listelerinde de talep beklemeden şifre sıfırlayabilirsin.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" value={searchPR} onChange={e => setSearchPR(e.target.value)}
                    placeholder="İsim veya e-posta ile ara..."
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/70 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                </div>
                <select value={filterPRStatus}
                  onChange={e => {
                    const newStatus = e.target.value as 'pending' | 'resolved' | 'cancelled';
                    setFilterPRStatus(newStatus);
                    loadPasswordRequests(storedPw(), newStatus);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/70 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
                  <option value="pending">Bekleyen Talepler</option>
                  <option value="resolved">Çözülmüş Talepler</option>
                  <option value="cancelled">İptal Edilmiş Talepler</option>
                </select>
              </div>

              {loading ? (
                <div className="text-center py-20 text-gray-400 dark:text-slate-500">Yükleniyor...</div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-20">
                  <Lock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-400 dark:text-slate-500">
                    {filterPRStatus === 'pending' ? 'Bekleyen şifre talebi yok.' :
                     filterPRStatus === 'resolved' ? 'Çözülmüş talep yok.' : 'İptal edilmiş talep yok.'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-2">
                  {filtered.map(r => {
                    const roleColors: Record<string, string> = {
                      student: 'bg-violet-100 text-violet-700',
                      teacher: 'bg-emerald-100 text-emerald-700',
                      parent: 'bg-pink-100 text-pink-700',
                      school_admin: 'bg-amber-100 text-amber-700',
                    };
                    const userRole = r.user_role || r.role;
                    return (
                      <div key={r.id} className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-xl border border-orange-200 p-3 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-bold text-sm text-[#0f2847] dark:text-slate-100">{r.user_full_name || '—'}</p>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleColors[userRole] || 'bg-gray-100 text-gray-700'}`}>
                                {roleLabel(userRole)}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                r.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                                r.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {statusLabel(r.status)}
                              </span>
                            </div>
                            <p className="text-[12px] text-gray-600 dark:text-slate-300 truncate">{r.user_email || r.email}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              Talep: {new Date(r.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {r.notes && r.status !== 'pending' && (
                              <p className="text-[11px] text-gray-500 italic mt-0.5">Not: {r.notes}</p>
                            )}
                          </div>
                          {r.status === 'pending' && r.user_id && (
                            <div className="flex gap-2 shrink-0">
                              <button onClick={() => resetUserPassword(r.user_id!, r.user_full_name || r.user_email || '—')}
                                disabled={loading}
                                className="py-2 px-3 rounded-lg bg-gradient-to-r from-orange-500 to-amber-600 text-white text-xs font-bold hover:from-orange-600 hover:to-amber-700 transition-all flex items-center gap-1.5 disabled:opacity-60">
                                <Lock className="w-3.5 h-3.5" /> Şifre Üret
                              </button>
                              <button onClick={() => cancelPasswordRequest(r.id)}
                                disabled={loading}
                                className="py-2 px-3 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 border border-red-200 transition-all flex items-center gap-1.5 disabled:opacity-60">
                                <X className="w-3.5 h-3.5" /> İptal
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* ═══ VIEW: Teachers List ═══ */}
        {view === 'teachers' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-extrabold text-[#0f2847] dark:text-slate-100">Kayıtlı Öğretmenler</h2>
              <span className="text-sm text-gray-400 dark:text-slate-500 font-medium">{teachers.length} öğretmen</span>
            </div>

            {/* Toplu işlem çubuğu */}
            {teachers.length > 0 && (
              <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-slate-700/60 p-3 shadow-sm mb-4 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-[12px] font-semibold text-[#0f2847] dark:text-slate-100">
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
              <div className="text-center py-20 text-gray-400 dark:text-slate-500">Yükleniyor...</div>
            ) : teachers.length === 0 ? (
              <div className="text-center py-20 text-gray-400 dark:text-slate-500">Henüz kayıtlı öğretmen yok.</div>
            ) : (
              <div className="grid gap-3">
                {teachers.map((t) => (
                  <div key={t.id} className={`bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${selectedTeacherIds.has(t.id) ? 'border-amber-400 ring-2 ring-amber-200' : 'border-white/40 dark:border-slate-700/60'}`}>
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
                          <h3 className="text-[15px] font-bold text-[#0f2847] dark:text-slate-100 truncate">{t.full_name}</h3>
                          <div className="flex items-center gap-3 mt-1 text-[12px] text-gray-400 dark:text-slate-500">
                            <span className="flex items-center gap-1"><School className="w-3 h-3" />{t.schoolName}</span>
                            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{t.studentCount} öğrenci</span>
                            <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{t.reportCount} rapor</span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" />
                      </button>
                      <div className="ml-1 shrink-0 flex items-center gap-1.5">
                        <button onClick={(e) => { e.stopPropagation(); resetUserPassword(t.id, t.full_name); }} disabled={loading}
                          title="Şifre Sıfırla"
                          className="py-1.5 px-2.5 rounded-lg bg-orange-50 text-orange-700 text-xs font-semibold hover:bg-orange-100 border border-orange-200 transition-all flex items-center gap-1 disabled:opacity-60">
                          <Lock className="w-3.5 h-3.5" /> Şifre
                        </button>
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
              className="flex items-center gap-1.5 text-[13px] text-gray-500 dark:text-slate-400 hover:text-[#0f2847] dark:text-slate-100 mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Öğretmenler listesine dön
            </button>

            {/* Teacher Info Card */}
            <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-slate-700/60 p-6 shadow-sm mb-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shrink-0">
                  <User className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-[#0f2847] dark:text-slate-100">{selectedTeacher.full_name}</h2>
                  <p className="text-sm text-gray-400 dark:text-slate-500">Öğretmen</p>
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
              <h3 className="text-lg font-bold text-[#0f2847] dark:text-slate-100 flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-amber-500" /> Kayıtlı Öğrenciler
              </h3>
              <span className="text-sm text-gray-400 dark:text-slate-500">{students.length} öğrenci</span>
            </div>

            {/* Toplu işlem çubuğu */}
            {students.length > 0 && (
              <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-slate-700/60 p-3 shadow-sm mb-4 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-[12px] font-semibold text-[#0f2847] dark:text-slate-100">
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
              <div className="text-center py-12 text-gray-400 dark:text-slate-500">Yükleniyor...</div>
            ) : students.length === 0 ? (
              <div className="text-center py-12 text-gray-400 dark:text-slate-500">Bu öğretmene atanmış öğrenci yok.</div>
            ) : (
              <div className="grid gap-3">
                {/* ═══ AKTİF: Okul → Sınıf → Şube → Öğrenci ═══ */}
                {Object.entries(activeTree).map(([schoolName, gradeMap]) => {
                  const schoolStudentCount = Object.values(gradeMap).reduce(
                    (s, secMap) => s + Object.values(secMap).reduce((s2, arr) => s2 + arr.length, 0), 0
                  );
                  const gradeCount = Object.keys(gradeMap).length;
                  return (
                    <div key={schoolName} className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-slate-700/60 shadow-sm overflow-hidden">
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
                            <h4 className="text-[14px] font-bold text-[#0f2847] dark:text-slate-100">{schoolName}</h4>
                            <p className="text-[12px] text-gray-400 dark:text-slate-500">{gradeCount} sınıf · {schoolStudentCount} öğrenci</p>
                          </div>
                        </div>
                        <ChevronRight className={`w-5 h-5 text-gray-300 transition-transform duration-200 ${openSchool === schoolName ? 'rotate-90' : ''}`} />
                      </button>

                      {/* SINIFLAR */}
                      {openSchool === schoolName && (
                        <div className="border-t border-gray-100 dark:border-slate-700/60 bg-gray-50 dark:bg-slate-800/60/30">
                          {Object.entries(gradeMap).map(([gradeKey, secMap]) => {
                            const gKey = `${schoolName}::${gradeKey}`;
                            const gradeStudentCount = Object.values(secMap).reduce((s, arr) => s + arr.length, 0);
                            const sectionCount = Object.keys(secMap).length;
                            return (
                              <div key={gKey} className="border-b border-gray-100 dark:border-slate-700/60 last:border-b-0">
                                <button
                                  onClick={() => { setOpenClass(openClass === gKey ? null : gKey); setOpenSection(null); }}
                                  className="w-full flex items-center justify-between px-4 py-3 pl-8 hover:bg-sky-50/40 transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center">
                                      <FolderOpen className="w-4 h-4 text-sky-600" />
                                    </div>
                                    <div className="text-left">
                                      <h5 className="text-[13px] font-bold text-[#0f2847] dark:text-slate-100">{gradeKey}</h5>
                                      <p className="text-[11px] text-gray-400 dark:text-slate-500">{sectionCount} şube · {gradeStudentCount} öğrenci</p>
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
                                                <h6 className="text-[12px] font-bold text-[#0f2847] dark:text-slate-100">{secKey}</h6>
                                                <p className="text-[10px] text-gray-400 dark:text-slate-500">{secStudents.length} öğrenci</p>
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
                                                      <p className="text-[13px] font-semibold text-[#0f2847] dark:text-slate-100 truncate">{s.full_name}</p>
                                                      <p className="text-[11px] text-gray-400 dark:text-slate-500">{s.testCount} test · {s.reportCount} rapor</p>
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
                          <h4 className="text-[14px] font-extrabold text-[#0f2847] dark:text-slate-100">🎓 Mezunlar</h4>
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
                                  <h5 className="text-[13px] font-bold text-[#0f2847] dark:text-slate-100">{schoolName}</h5>
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
                                        <p className="text-[13px] font-semibold text-[#0f2847] dark:text-slate-100 truncate">{s.full_name}</p>
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
              className="flex items-center gap-1.5 text-[13px] text-gray-500 dark:text-slate-400 hover:text-[#0f2847] dark:text-slate-100 mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Öğrenciler listesine dön
            </button>

            {/* Student Info */}
            <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-slate-700/60 p-6 shadow-sm mb-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shrink-0">
                  <GraduationCap className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-[#0f2847] dark:text-slate-100">{selectedStudent.full_name}</h2>
                  <p className="text-sm text-gray-400 dark:text-slate-500">Öğrenci{selectedStudent.grade ? ` · ${selectedStudent.grade}. Sınıf` : ''}</p>
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
            <h3 className="text-lg font-bold text-[#0f2847] dark:text-slate-100 mb-3">Yapılan Testler</h3>
            {selectedStudent.tests.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-slate-500 mb-6">Henüz test tamamlanmamış.</p>
            ) : (
              <div className="grid gap-2 mb-6">
                {selectedStudent.tests.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 bg-white/70 dark:bg-slate-800/50 rounded-xl border border-white/40 dark:border-slate-700/60 p-3 shadow-sm">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.has_report ? 'bg-emerald-100' : 'bg-gray-100 dark:bg-slate-700/60'}`}>
                      <BookOpen className={`w-4 h-4 ${t.has_report ? 'text-emerald-600' : 'text-gray-400 dark:text-slate-500'}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[13px] font-semibold text-[#0f2847] dark:text-slate-100">{TEST_LABELS[t.test_type] || t.test_type}</p>
                      <p className="text-[11px] text-gray-400 dark:text-slate-500">{formatDate(t.completed_at)}</p>
                    </div>
                    {t.has_report && <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">Rapor var</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Reports */}
            <h3 className="text-lg font-bold text-[#0f2847] dark:text-slate-100 mb-3">Analiz Raporları</h3>
            {loading ? (
              <div className="text-center py-8 text-gray-400 dark:text-slate-500">Yükleniyor...</div>
            ) : reports.length === 0 && integratedReports.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-slate-500">Henüz rapor oluşturulmamış.</p>
            ) : (
              <div className="grid gap-2">
                {reports.map((r) => (
                  <button key={r.id} onClick={() => { setSelectedReport(r); setReportType('single'); setView('report-view'); }}
                    className="flex items-center gap-3 bg-white/70 dark:bg-slate-800/50 rounded-xl border border-white/40 dark:border-slate-700/60 p-3 shadow-sm hover:shadow-md transition-all text-left">
                    <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-sky-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[13px] font-semibold text-[#0f2847] dark:text-slate-100">{TEST_LABELS[r.test_type] || r.test_type} — Tekil Rapor</p>
                      <p className="text-[11px] text-gray-400 dark:text-slate-500">{formatDate(r.completed_at)}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </button>
                ))}
                {integratedReports.map((ir) => (
                  <button key={ir.id} onClick={() => { setSelectedReport(ir); setReportType('integrated'); setView('report-view'); }}
                    className="flex items-center gap-3 bg-white/70 dark:bg-slate-800/50 rounded-xl border border-white/40 dark:border-slate-700/60 p-3 shadow-sm hover:shadow-md transition-all text-left">
                    <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-violet-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[13px] font-semibold text-[#0f2847] dark:text-slate-100">Entegre 3&apos;lü Rapor</p>
                      <p className="text-[11px] text-gray-400 dark:text-slate-500">{formatDate(ir.generated_at)}</p>
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
              className="flex items-center gap-1.5 text-[13px] text-gray-500 dark:text-slate-400 hover:text-[#0f2847] dark:text-slate-100 mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Öğrenci detayına dön
            </button>

            <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-slate-700/60 p-6 shadow-sm">
              {reportType === 'single' && 'ai_report' in selectedReport ? (
                <>
                  <h2 className="text-lg font-bold text-[#0f2847] dark:text-slate-100 mb-4">
                    {TEST_LABELS[(selectedReport as Report).test_type] || (selectedReport as Report).test_type} — Tekil Rapor
                  </h2>
                  <ReportRenderer text={(selectedReport as Report).ai_report || ''} />
                </>
              ) : reportType === 'integrated' && 'teacher_report' in selectedReport ? (
                <>
                  <h2 className="text-lg font-bold text-[#0f2847] dark:text-slate-100 mb-4">Entegre 3&apos;lü Rapor</h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-[14px] font-bold text-sky-600 mb-2">Öğretmen Raporu</h3>
                      <div className="bg-sky-50/40 rounded-xl p-4 border border-sky-100">
                        <ReportRenderer text={(selectedReport as IntegratedReport).teacher_report || ''} />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-[14px] font-bold text-violet-600 mb-2">Öğrenci Raporu</h3>
                      <div className="bg-violet-50/40 rounded-xl p-4 border border-violet-100">
                        <ReportRenderer text={(selectedReport as IntegratedReport).student_report || ''} />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-[14px] font-bold text-pink-600 mb-2">Veli Raporu</h3>
                      <div className="bg-pink-50/40 rounded-xl p-4 border border-pink-100">
                        <ReportRenderer text={(selectedReport as IntegratedReport).parent_report || ''} />
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
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-modal-in"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${confirmAction.danger ? 'bg-gradient-to-br from-red-500 to-rose-700' : 'bg-gradient-to-br from-amber-500 to-orange-600'}`}>
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-[16px] font-extrabold text-[#0f2847] dark:text-slate-100">{confirmAction.title}</h3>
                <p className="text-[13px] text-gray-600 dark:text-slate-300 mt-1">{confirmAction.message}</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                onClick={() => setConfirmAction(null)}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-700/60 text-gray-700 dark:text-slate-300 text-[13px] font-bold hover:bg-gray-200 disabled:opacity-60 transition-all"
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

      {/* ═══ ÖĞRETMEN ATA MODAL ═══ */}
      {assignModalUser && (
        <div
          onClick={() => { setAssignModalUser(null); setAssignModalSelectedTeacher(''); }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-modal-in max-h-[85vh] flex flex-col"
          >
            <div className="flex items-start gap-3 mb-4 shrink-0">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg bg-gradient-to-br from-violet-500 to-purple-700">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-[16px] font-extrabold text-[#0f2847] dark:text-slate-100">
                  {assignModalMode === 'approve' ? 'Onayla & Öğretmen Ata' : 'Öğretmen Ataması Değiştir'}
                </h3>
                <p className="text-[13px] text-gray-600 dark:text-slate-300 mt-1">
                  <span className="font-semibold">{assignModalUser.full_name}</span> için bir öğretmen seçin.
                  {assignModalMode === 'approve' && ' Atama sonrası öğrenci o öğretmenin "Öğrencilerim" listesine düşecek.'}
                </p>
              </div>
              <button onClick={() => { setAssignModalUser(null); setAssignModalSelectedTeacher(''); }}
                className="text-gray-400 hover:text-gray-600 dark:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto -mx-1 px-1">
              {approvedTeachersSimple.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400 dark:text-slate-500">Kayıtlı öğretmen yok. Önce öğretmen onaylayın.</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {approvedTeachersSimple.map(t => (
                    <label key={t.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        assignModalSelectedTeacher === t.id
                          ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20'
                          : 'border-gray-200 dark:border-slate-700 hover:border-violet-200 hover:bg-gray-50 dark:hover:bg-slate-800/60'
                      }`}>
                      <input
                        type="radio"
                        name="teacher-select"
                        checked={assignModalSelectedTeacher === t.id}
                        onChange={() => setAssignModalSelectedTeacher(t.id)}
                        className="w-4 h-4 text-violet-600"
                      />
                      <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs shrink-0">
                        {t.full_name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#0f2847] dark:text-slate-100 truncate">{t.full_name}</p>
                        <p className="text-[11px] text-gray-500 truncate">
                          {t.branch ? `${t.branch} · ` : ''}{t.email}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-gray-200 dark:border-slate-700 shrink-0">
              <button
                onClick={() => { setAssignModalUser(null); setAssignModalSelectedTeacher(''); }}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-700/60 text-gray-700 dark:text-slate-300 text-[13px] font-bold hover:bg-gray-200 disabled:opacity-60 transition-all"
              >
                Vazgeç
              </button>
              <button
                onClick={() => {
                  if (!assignModalSelectedTeacher || !assignModalUser) return;
                  if (assignModalMode === 'approve') {
                    approveStudentWithTeacher(assignModalUser.id, assignModalSelectedTeacher);
                  } else {
                    reassignStudentTeacher(assignModalUser.id, assignModalSelectedTeacher);
                  }
                }}
                disabled={loading || !assignModalSelectedTeacher}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 text-white text-[13px] font-extrabold shadow-md hover:shadow-lg hover:from-violet-600 hover:to-purple-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                {loading
                  ? 'İşleniyor...'
                  : assignModalMode === 'approve' ? 'Onayla & Ata' : 'Atamayı Güncelle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ ŞİFRE SIFIRLAMA SONUÇ MODAL (TEK SEFERLİK GÖSTERİM) ═══ */}
      {passwordResult && (
        <div
          onClick={() => { setPasswordResult(null); setPasswordCopied(false); }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-modal-in"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg bg-gradient-to-br from-orange-500 to-amber-600">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[16px] font-extrabold text-[#0f2847] dark:text-slate-100">Yeni Şifre Üretildi</h3>
                <p className="text-[12px] text-gray-600 dark:text-slate-300 mt-0.5 truncate">
                  {passwordResult.user.full_name} ({passwordResult.user.email})
                </p>
              </div>
              <button
                onClick={() => { setPasswordResult(null); setPasswordCopied(false); }}
                className="text-gray-400 hover:text-gray-600 dark:text-slate-300 shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Şifre kutusu */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-2 border-orange-300 rounded-2xl p-5 mb-4">
              <p className="text-[10px] font-bold text-orange-700 uppercase tracking-wider mb-2">
                Geçici Şifre — Tek Seferlik Gösterim
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-2xl font-bold font-mono text-[#0f2847] dark:text-slate-100 bg-white dark:bg-slate-900/50 px-4 py-3 rounded-xl border border-orange-200 select-all text-center">
                  {passwordResult.new_password}
                </code>
                <button
                  onClick={copyPasswordToClipboard}
                  className={`shrink-0 p-3 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                    passwordCopied
                      ? 'bg-emerald-500 text-white'
                      : 'bg-orange-500 text-white hover:bg-orange-600'
                  }`}
                  title="Şifreyi kopyala"
                >
                  {passwordCopied ? <CheckCircle2 className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                </button>
              </div>
              {passwordCopied && (
                <p className="text-[11px] text-emerald-600 font-bold mt-2 text-center">✓ Panoya kopyalandı</p>
              )}
              <p className="text-[10.5px] text-orange-700 font-semibold mt-2 text-center">
                BÜYÜK ve küçük harf duyarlı · Boşluk eklemeyin · Tek parça yazın
              </p>
            </div>

            {/* Uyarı kutusu */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-xl p-3 mb-4">
              <p className="text-[12px] text-amber-800 dark:text-amber-200 font-semibold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>DİKKAT:</strong> Bu şifre yalnızca bir kez gösterilir. Modal kapatılırsa
                  bir daha görünmez. <strong>Mavi kopyala butonu</strong> ile kopyalayıp kullanıcıya iletin
                  (WhatsApp/SMS/telefon). Tekrar lazım olursa yeni şifre üretmeniz gerekir.
                </span>
              </p>
            </div>

            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] text-gray-500">
                Kullanıcı bu şifre ile giriş yapacak, dilerse profilden değiştirir.
              </p>
              <button
                onClick={() => { setPasswordResult(null); setPasswordCopied(false); }}
                className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-700/60 text-gray-700 dark:text-slate-300 text-[13px] font-bold hover:bg-gray-200 transition-all shrink-0"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
