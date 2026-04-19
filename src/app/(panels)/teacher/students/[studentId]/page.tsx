'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { secureFetch } from '@/lib/csrf-client';
import ReportRenderer from '@/components/ReportRenderer';
import {
  ArrowLeft, GraduationCap, CheckCircle2, Circle, Bell, AlertCircle,
  FileText, BookOpen, X, Send, Loader2, Sparkles, Eye, Download, RefreshCw,
  Brain, Layers, Shield, Link2, Briefcase, Lock, TrendingUp,
  Trash2, ChevronDown, ChevronUp, AlertTriangle, CheckSquare, Square,
  UserPlus, ArrowRightLeft, Search
} from 'lucide-react';

const TEST_LABELS: Record<string, string> = {
  enneagram: 'Enneagram Kişilik',
  vark: 'VARK Öğrenme Stilleri',
  holland: 'Holland RIASEC',
  coklu_zeka: 'Çoklu Zekâ',
  'coklu-zeka': 'Çoklu Zekâ',
  sinav_kaygisi: 'Sınav Kaygısı',
  'sinav-kaygisi': 'Sınav Kaygısı',
  calisma_davranisi: 'Çalışma Davranışı',
  'calisma-davranisi': 'Çalışma Davranışı',
  akademik_analiz: 'Akademik Analiz',
  'akademik-analiz': 'Akademik Analiz',
  hizli_okuma: 'Hızlı Okuma',
  'hizli-okuma': 'Hızlı Okuma',
  d2_dikkat: 'P2 Dikkat Testi',
  'd2-dikkat': 'P2 Dikkat Testi',
  sag_sol_beyin: 'Sağ-Sol Beyin',
  'sag-sol-beyin': 'Sağ-Sol Beyin',
};
const labelOf = (t: string) => TEST_LABELS[t] || TEST_LABELS[t.replace(/_/g, '-')] || TEST_LABELS[t.replace(/-/g, '_')] || t;

interface CompletedTest {
  id: string;
  test_type: string;
  completed_at: string;
  has_report: boolean;
  ai_report: string | null;
  ai_report_generated_at: string | null;
}

interface StudentInfo {
  id: string;
  full_name: string;
  grade: string | null;
  school_name: string;
}

interface IntegratedReport {
  teacher_report: string | null;
  student_report: string | null;
  parent_report: string | null;
  generated_at: string | null;
}

interface HolisticReport {
  text: string;
  generated_at: string;
}

interface HolisticHistoryItem {
  id: string;
  text: string;
  selected_test_types: string[];
  test_count: number;
  generated_at: string;
}

interface RiskDimension { key: string; name: string; score: number | null; weight: number; available: boolean; }
interface RiskFlag { id: string; message: string; severity: 'kritik' | 'uyarı'; icon: string; }
interface RiskScore {
  overallScore: number; level: string; color: string; bgColor: string; borderColor: string;
  emoji: string; label: string; dimensions: RiskDimension[]; flags: RiskFlag[];
}
interface PatternInsight { id: string; title: string; description: string; severity: 'kritik' | 'uyarı' | 'bilgi'; relatedTests: string[]; icon: string; }
interface CorrelationPair { testA: string; testB: string; coefficient: number; strength: string; direction: string; }
interface CorrelationMatrix { tests: string[]; matrix: number[][]; pairs: CorrelationPair[]; }
interface CareerSuggestion { rank: number; career: string; field: string; matchScore: number; reasons: string[]; icon: string; }
interface CareerMatch { topCareers: CareerSuggestion[]; hollandCode: string | null; dominantZeka: string | null; varkStyle: string | null; compatibilityNote: string; }
interface AdvancedAnalysis {
  unlocked: boolean;
  riskScore?: RiskScore;
  correlation?: CorrelationMatrix;
  patterns?: PatternInsight[];
  career?: CareerMatch;
}

type ViewerMode = null | {
  title: string;
  text: string;
  pdfUrl?: string;
  docxUrl?: string;
};

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.studentId as string;

  const [tab, setTab] = useState<'done' | 'pending'>('pending');
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [completed, setCompleted] = useState<CompletedTest[]>([]);
  const [pending, setPending] = useState<string[]>([]);
  const [activeAssignments, setActiveAssignments] = useState<string[]>([]);
  const [holistic, setHolistic] = useState<HolisticReport | null>(null);
  const [holisticHistory, setHolisticHistory] = useState<HolisticHistoryItem[]>([]);
  const [holisticExpanded, setHolisticExpanded] = useState(false);
  const [holisticSelected, setHolisticSelected] = useState<Set<string>>(new Set());
  const [holisticConfirmOpen, setHolisticConfirmOpen] = useState(false);
  const [holisticHistoryOpen, setHolisticHistoryOpen] = useState(false);
  const [integrated, setIntegrated] = useState<IntegratedReport | null>(null);
  const [advanced, setAdvanced] = useState<AdvancedAnalysis>({ unlocked: false });

  // ═══ Öğrenci Aktarma State'leri ═══
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferTeachers, setTransferTeachers] = useState<Array<{ id: string; full_name: string; branch: string; school_name: string }>>([]);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferSearch, setTransferSearch] = useState('');
  const [transferSelected, setTransferSelected] = useState<{ id: string; full_name: string } | null>(null);
  const [transferConfirmOpen, setTransferConfirmOpen] = useState(false);
  const [transferring, setTransferring] = useState(false);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const [viewer, setViewer] = useState<ViewerMode>(null);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await secureFetch('/api/teacher/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'detail', studentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sunucu hatası');
      setStudent(data.student);
      setCompleted(data.completedTests || []);
      setPending(data.pendingTypes || []);
      setActiveAssignments(data.activeAssignments || []);
      setHolistic(data.holisticReport || null);
      setHolisticHistory(Array.isArray(data.holisticReports) ? data.holisticReports : []);
      setIntegrated(data.integratedReport || null);
      setAdvanced(data.advanced || { unlocked: false });
      setSelected(new Set());
    } catch (e: unknown) {
      setError((e as Error).message);
    }
    setLoading(false);
  }, [studentId]);

  useEffect(() => { loadDetail(); }, [loadDetail]);

  const toggleSelect = (testType: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(testType)) next.delete(testType);
      else next.add(testType);
      return next;
    });
  };

  const handleAssign = async () => {
    if (selected.size === 0) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await secureFetch('/api/teacher/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assign',
          studentId,
          testTypes: Array.from(selected),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sunucu hatası');
      setSuccess(`${selected.size} test başarıyla atandı.`);
      setTimeout(() => setSuccess(''), 3000);
      await loadDetail();
    } catch (e: unknown) {
      setError((e as Error).message);
    }
    setSaving(false);
  };

  const handleUnassign = async (testType: string) => {
    setSaving(true);
    setError('');
    try {
      const res = await secureFetch('/api/teacher/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unassign', studentId, testType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sunucu hatası');
      await loadDetail();
    } catch (e: unknown) {
      setError((e as Error).message);
    }
    setSaving(false);
  };

  // ═══ Tekil rapor üret ═══
  const generateSingle = async (testResult: CompletedTest, force = false) => {
    setBusyKey(`single-${testResult.id}`);
    setError('');
    setSuccess('');
    try {
      const res = await secureFetch('/api/reports/generate', {
        method: force ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, test_result_id: testResult.id }),
      });
      const data = await res.json();
      if (data.success || data.already_generated) {
        setSuccess(force ? '✅ Rapor yeniden üretildi.' : '✅ Tekil rapor üretildi.');
        setTimeout(() => setSuccess(''), 3000);
        await loadDetail();
      } else {
        setError(data.error || 'Rapor üretilemedi.');
      }
    } catch (e: unknown) {
      setError((e as Error).message);
    }
    setBusyKey(null);
  };

  // ═══ Bütüncül (Harmanlanmış) rapor üret — SEÇİLİ TESTLERLE ═══
  const generateHolistic = async () => {
    setBusyKey('holistic');
    setError('');
    setSuccess('');
    setHolisticConfirmOpen(false);
    try {
      const selectedTypes = Array.from(holisticSelected);
      const res = await secureFetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          report_type: 'holistic',
          selected_test_types: selectedTypes,
        }),
      });
      const data = await res.json();
      if (data.success && data.report) {
        setSuccess(`✅ ${selectedTypes.length} test için harmanlanmış rapor üretildi.`);
        setTimeout(() => setSuccess(''), 3500);
        setHolisticSelected(new Set());
        setHolisticExpanded(false);
        await loadDetail();
      } else {
        setError(data.error || 'Rapor üretilemedi.');
      }
    } catch (e: unknown) {
      setError((e as Error).message);
    }
    setBusyKey(null);
  };

  // ═══ Tek bir harmanlanmış raporu sil ═══
  const deleteHolistic = async (id: string) => {
    if (!confirm('Bu harmanlanmış raporu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) return;
    setBusyKey('holistic-delete-' + id);
    setError('');
    setSuccess('');
    try {
      const res = await secureFetch(`/api/reports/holistic/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('✅ Rapor silindi.');
        setTimeout(() => setSuccess(''), 3000);
        await loadDetail();
      } else {
        setError(data.error || 'Rapor silinemedi.');
      }
    } catch (e: unknown) {
      setError((e as Error).message);
    }
    setBusyKey(null);
  };

  // ═══ Checkbox toggle ═══
  const toggleHolisticTest = (testType: string) => {
    setHolisticSelected(prev => {
      const next = new Set(prev);
      if (next.has(testType)) next.delete(testType);
      else next.add(testType);
      return next;
    });
  };

  const selectAllHolistic = () => {
    setHolisticSelected(new Set(completed.map(c => c.test_type)));
  };

  const clearAllHolistic = () => {
    setHolisticSelected(new Set());
  };

  // ═══ ÖĞRENCİ AKTARMA FONKSİYONLARI ═══
  const openTransferModal = async () => {
    setTransferModalOpen(true);
    setTransferLoading(true);
    setTransferSearch('');
    setTransferSelected(null);
    setError('');
    try {
      const res = await secureFetch('/api/teacher/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approved-teachers' }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.teachers)) {
        setTransferTeachers(data.teachers);
      } else {
        setError(data.error || 'Öğretmen listesi alınamadı.');
        setTransferTeachers([]);
      }
    } catch (e: unknown) {
      setError((e as Error).message);
      setTransferTeachers([]);
    }
    setTransferLoading(false);
  };

  const confirmTransfer = (teacher: { id: string; full_name: string }) => {
    setTransferSelected(teacher);
    setTransferConfirmOpen(true);
  };

  const executeTransfer = async () => {
    if (!transferSelected) return;
    setTransferring(true);
    setError('');
    try {
      const res = await secureFetch('/api/teacher/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'transfer',
          studentId,
          targetTeacherId: transferSelected.id,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Başarılı — öğrenci listesine geri dön
        setTransferConfirmOpen(false);
        setTransferModalOpen(false);
        setTransferring(false);
        // Öğrencilerim listesine yönlendir
        router.push('/teacher/students');
        return;
      } else {
        setError(data.error || 'Aktarım başarısız.');
      }
    } catch (e: unknown) {
      setError((e as Error).message);
    }
    setTransferring(false);
  };

  const filteredTransferTeachers = transferTeachers.filter(t => {
    if (!transferSearch.trim()) return true;
    const q = transferSearch.trim().toLocaleLowerCase('tr-TR');
    return (
      t.full_name.toLocaleLowerCase('tr-TR').includes(q) ||
      (t.branch || '').toLocaleLowerCase('tr-TR').includes(q) ||
      (t.school_name || '').toLocaleLowerCase('tr-TR').includes(q)
    );
  });

  // ═══ Entegre 3'lü rapor üret ═══
  const generateIntegrated = async (force = false) => {
    setBusyKey('integrated');
    setError('');
    setSuccess('');
    try {
      const res = await secureFetch('/api/reports/integrated', {
        method: force ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId }),
      });
      const data = await res.json();
      if (data.success || data.already_generated) {
        setSuccess(force ? '✅ 3\'lü rapor yeniden üretildi.' : '✅ 3\'lü entegre rapor üretildi.');
        setTimeout(() => setSuccess(''), 3000);
        await loadDetail();
      } else {
        setError(data.error || 'Rapor üretilemedi.');
      }
    } catch (e: unknown) {
      setError((e as Error).message);
    }
    setBusyKey(null);
  };

  // ═══ Aynı testten çoklu deneme etiketleri ═══
  // completed dizisi zaten completed_at DESC (yeni üstte) sıralı
  // HOOK KURALLARI: erken return'lerden ÖNCE tanımlanmalı
  const attemptInfo = useMemo(() => {
    const norm = (s: string) => (s || '').replace(/-/g, '_').toLowerCase();

    const totalByType = new Map<string, number>();
    for (const c of completed) {
      const key = norm(c.test_type);
      totalByType.set(key, (totalByType.get(key) || 0) + 1);
    }

    const numberByRecordId = new Map<string, number>();
    const counterByType = new Map<string, number>();
    const asc = [...completed].reverse();
    for (const c of asc) {
      const key = norm(c.test_type);
      const n = (counterByType.get(key) || 0) + 1;
      counterByType.set(key, n);
      numberByRecordId.set(c.id, n);
    }

    return {
      numberFor: (recordId: string) => numberByRecordId.get(recordId) || 1,
      totalFor: (testType: string) => totalByType.get(norm(testType)) || 1,
      isLatest: (recordId: string, testType: string) => {
        const total = totalByType.get(norm(testType)) || 1;
        return numberByRecordId.get(recordId) === total;
      },
    };
  }, [completed]);

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-emerald-500/40 animate-pulse">
          <GraduationCap className="w-7 h-7 text-white" />
        </div>
        <p className="text-gray-500 text-sm font-medium">Öğrenci yükleniyor...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl border border-white/50 p-12 text-center shadow-sm overflow-hidden my-10">
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-gradient-to-br from-red-200 to-rose-200 opacity-30 blur-3xl" />
        <div className="relative">
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg">
            <X className="w-10 h-10 text-white" />
          </div>
          <p className="text-[17px] text-[#0f2847] font-extrabold mb-2">Öğrenci bulunamadı</p>
          <p className="text-gray-500 text-sm mb-5">Bu ID ile eşleşen öğrenci yok ya da erişiminiz yok.</p>
          <Link
            href="/teacher/students"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 text-white text-[13.5px] font-extrabold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-[0.97]"
          >
            <ArrowLeft className="w-4 h-4" /> Listeye dön
          </Link>
        </div>
      </div>
    );
  }

  const integratedExists = !!(integrated?.teacher_report && integrated?.student_report && integrated?.parent_report);

  return (
    <div className="pb-8">
      <Link
        href="/teacher/students"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/80 backdrop-blur-md border border-white/60 text-[12.5px] text-gray-600 hover:text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 font-bold transition-all mb-4 shadow-sm active:scale-95"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Öğrencilere dön
      </Link>

      {/* Premium Öğrenci Kartı */}
      <div className="relative mb-5 rounded-3xl overflow-hidden shadow-xl shadow-emerald-500/20 stud-enter">
        <div className="relative bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-6 sm:p-7">
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl stud-aurora-1" />
          <div className="absolute bottom-0 left-1/3 w-56 h-56 bg-cyan-200/20 rounded-full blur-3xl stud-aurora-2" />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
              backgroundSize: '32px 32px',
            }}
          />

          <div className="relative flex items-start gap-4 flex-wrap">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-white/25 backdrop-blur-md border-2 border-white/40 flex items-center justify-center shadow-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent" />
                <GraduationCap className="w-8 h-8 text-white relative drop-shadow-md" />
              </div>
              {/* Online dot */}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-md">
                <div className="relative w-3 h-3 rounded-full bg-emerald-500">
                  <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
                </div>
              </div>
            </div>

            <div className="flex-1 min-w-0 text-white">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <p className="text-white/80 text-[10.5px] font-extrabold uppercase tracking-wider">Öğrenci Profili</p>
              </div>
              <h2 className="text-2xl sm:text-[26px] font-extrabold drop-shadow-sm tracking-tight truncate">{student.full_name}</h2>
              <p className="text-[13px] text-white/85 mt-0.5">
                {student.school_name}{student.grade && ` · ${student.grade}. Sınıf`}
              </p>
            </div>

            {/* Transfer button */}
            <button
              onClick={openTransferModal}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-[#0f2847] text-[12.5px] font-extrabold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all shrink-0 active:scale-[0.97]"
              title="Bu öğrenciyi başka bir öğretmene aktar"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Öğrenciyi Aktar</span>
              <span className="sm:hidden">Aktar</span>
            </button>
          </div>
        </div>

        <style jsx>{`
          @keyframes stud-enter {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .stud-enter { animation: stud-enter 400ms cubic-bezier(0.16, 1, 0.3, 1) backwards; }
          @keyframes stud-aurora-1 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(-15px, 15px) scale(1.08); }
          }
          @keyframes stud-aurora-2 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(15px, -10px) scale(1.05); }
          }
          .stud-aurora-1 { animation: stud-aurora-1 9s ease-in-out infinite; }
          .stud-aurora-2 { animation: stud-aurora-2 11s ease-in-out infinite 1s; }
        `}</style>
      </div>

      {/* ATANAN TESTLER UYARISI */}
      {activeAssignments.length > 0 && (
        <div className="relative bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-300 rounded-2xl p-5 mb-4 shadow-md overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-amber-400 opacity-20 blur-2xl pointer-events-none" />
          <div className="relative flex items-start gap-3 mb-3">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md shrink-0">
              <Bell className="w-5 h-5 text-white" />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/30 to-transparent" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-extrabold text-[#0f2847]">
                Öğrencinin çözmesi gereken {activeAssignments.length === 1 ? 'test' : 'testler'}:
              </h3>
              <p className="text-[12px] text-amber-700 mt-0.5 font-medium">
                Öğrenci tamamladığında bu uyarı otomatik kaybolacak.
              </p>
            </div>
          </div>
          <div className="relative flex flex-wrap gap-2" style={{ paddingLeft: '52px' }}>
            {activeAssignments.map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5 bg-white border-2 border-amber-300 text-amber-900 text-[12px] font-extrabold px-3 py-1.5 rounded-full shadow-sm hover:border-amber-400 hover:shadow-md transition-all">
                {labelOf(t)}
                <button
                  onClick={() => handleUnassign(t)}
                  disabled={saving}
                  className="hover:bg-amber-100 rounded-full p-0.5 transition-colors"
                  aria-label="Atamayı kaldır"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Bildirimler */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
          <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-sm text-emerald-700">
          <CheckCircle2 className="w-4 h-4 shrink-0" />{success}
        </div>
      )}

      {/* Sekmeler */}
      <div className="flex gap-2 mb-4 bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-1.5 shadow-sm">
        <button
          onClick={() => setTab('pending')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            tab === 'pending'
              ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <BookOpen className="w-4 h-4" /> Yapılacak Testler ({pending.length})
        </button>
        <button
          onClick={() => setTab('done')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            tab === 'done'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" /> Yapılan Testler ({completed.length})
        </button>
      </div>

      {/* YAPILACAK TESTLER */}
      {tab === 'pending' && (
        <div>
          {pending.length === 0 ? (
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-12 text-center shadow-sm">
              <p className="text-5xl mb-3">🎉</p>
              <p className="text-gray-600 font-semibold">Tüm testler tamamlandı!</p>
              <p className="text-gray-400 text-sm mt-2">Öğrenci 10 testin hepsini bitirdi.</p>
            </div>
          ) : (
            <>
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm overflow-hidden mb-4">
                {pending.map((t) => {
                  const isSelected = selected.has(t);
                  const isAlreadyAssigned = activeAssignments.includes(t);
                  return (
                    <button
                      key={t}
                      onClick={() => toggleSelect(t)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 last:border-b-0 hover:bg-sky-50/40 transition-colors text-left ${
                        isSelected ? 'bg-sky-50/60' : ''
                      }`}
                    >
                      {isSelected ? <CheckCircle2 className="w-5 h-5 text-sky-600 shrink-0" /> : <Circle className="w-5 h-5 text-gray-300 shrink-0" />}
                      <div className="flex-1">
                        <p className="text-[14px] font-semibold text-[#0f2847]">{labelOf(t)}</p>
                        {isAlreadyAssigned && (
                          <p className="text-[11px] text-amber-600 font-medium mt-0.5">⚡ Daha önce atandı, henüz çözülmedi</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="sticky bottom-4 z-10">
                <button
                  onClick={handleAssign}
                  disabled={selected.size === 0 || saving}
                  className={`w-full py-4 rounded-2xl text-white text-sm font-bold shadow-xl transition-all flex items-center justify-center gap-2 ${
                    selected.size === 0
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-gradient-to-r from-amber-500 to-orange-600 shadow-amber-500/30 hover:shadow-amber-500/50 hover:-translate-y-0.5'
                  }`}
                >
                  {saving ? (<><Loader2 className="w-4 h-4 animate-spin" /> Atanıyor...</>)
                    : selected.size === 0 ? (<>Test seçin</>)
                    : (<><Send className="w-4 h-4" /> {selected.size === 1 ? 'Seçili Testi Ata' : `Seçili ${selected.size} Testi Ata`}</>)}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* YAPILAN TESTLER + RAPORLAR */}
      {tab === 'done' && (
        <div>
          {completed.length === 0 ? (
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-12 text-center shadow-sm">
              <p className="text-5xl mb-3">📭</p>
              <p className="text-gray-500 font-semibold">Henüz tamamlanan test yok.</p>
            </div>
          ) : (
            <>
              {/* Test bazlı tekil raporlar */}
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm overflow-hidden mb-6">
                <div className="px-4 py-3 bg-gradient-to-r from-sky-50 to-blue-50 border-b border-sky-100">
                  <h3 className="text-[14px] font-extrabold text-[#0f2847] flex items-center gap-2">
                    <FileText className="w-4 h-4 text-sky-600" /> Tekil Raporlar
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">Her test için ayrı AI analiz raporu.</p>
                </div>

                {completed.map((c) => {
                  const isBusy = busyKey === `single-${c.id}`;
                  const totalAttempts = attemptInfo.totalFor(c.test_type);
                  const attemptNo = attemptInfo.numberFor(c.id);
                  const isLatest = attemptInfo.isLatest(c.id, c.test_type);
                  const showAttemptBadge = totalAttempts > 1;
                  return (
                    <div key={c.id} className={`px-4 py-3.5 border-b border-gray-50 last:border-b-0 ${showAttemptBadge && !isLatest ? 'bg-gray-50/50' : ''}`}>
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${c.has_report ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                          <CheckCircle2 className={`w-4 h-4 ${c.has_report ? 'text-emerald-600' : 'text-gray-400'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-[14px] font-semibold text-[#0f2847] truncate">{labelOf(c.test_type)}</p>
                            {showAttemptBadge && (
                              isLatest ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm">
                                  ✓ En Güncel
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-200 text-gray-600">
                                  {attemptNo}. Deneme
                                </span>
                              )
                            )}
                          </div>
                          <p className="text-[11px] text-gray-400">
                            Tamamlandı: {formatDate(c.completed_at)}
                            {c.ai_report_generated_at && ` · Rapor: ${formatDate(c.ai_report_generated_at)}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 ml-11">
                        {!c.has_report ? (
                          <button
                            onClick={() => generateSingle(c)}
                            disabled={isBusy}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 text-white text-[12px] font-bold shadow-md hover:shadow-lg disabled:opacity-60 transition-all"
                          >
                            {isBusy ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Üretiliyor...</> : <><Sparkles className="w-3.5 h-3.5" /> Rapor Üret</>}
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => setViewer({
                                title: `${labelOf(c.test_type)} — Tekil Rapor`,
                                text: c.ai_report || '',
                                pdfUrl: `/api/export/pdf?test_result_id=${c.id}&report_type=${encodeURIComponent(labelOf(c.test_type))}`,
                                docxUrl: `/api/export/docx?test_result_id=${c.id}&report_type=${encodeURIComponent(labelOf(c.test_type))}`,
                              })}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-[12px] font-bold border border-emerald-200 hover:bg-emerald-100 transition-all"
                            >
                              <Eye className="w-3.5 h-3.5" /> Görüntüle
                            </button>
                            <a
                              href={`/api/export/pdf?test_result_id=${c.id}&report_type=${encodeURIComponent(labelOf(c.test_type))}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-[12px] font-bold border border-red-200 hover:bg-red-100 transition-all"
                            >
                              <Download className="w-3.5 h-3.5" /> PDF
                            </a>
                            <a
                              href={`/api/export/docx?test_result_id=${c.id}&report_type=${encodeURIComponent(labelOf(c.test_type))}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-[12px] font-bold border border-blue-200 hover:bg-blue-100 transition-all"
                            >
                              <Download className="w-3.5 h-3.5" /> DOCX
                            </a>
                            <button
                              onClick={() => generateSingle(c, true)}
                              disabled={isBusy}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-[12px] font-bold hover:bg-gray-200 disabled:opacity-60 transition-all"
                            >
                              {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Yenile
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Çoklu Test Raporları (2+ test gerekli) */}
              {completed.length >= 2 && (
                <>
                  {/* HARMANLANMIŞ (BÜTÜNCÜL) RAPOR — ÇOKLU SEÇİM DESTEKLİ */}
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-5 shadow-sm mb-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md shrink-0">
                        <Brain className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-[15px] font-extrabold text-[#0f2847]">Harmanlanmış (Bütüncül) Rapor</h3>
                        <p className="text-[12px] text-purple-700 mt-0.5">Seçtiğiniz testleri birleştiren bütüncül analiz. İstediğiniz test kombinasyonu için ayrı rapor üretebilirsiniz.</p>
                      </div>
                    </div>

                    {/* Accordion Toggle */}
                    <div style={{ paddingLeft: '52px' }}>
                      <button
                        onClick={() => setHolisticExpanded(v => !v)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white text-purple-700 text-[12px] font-bold border border-purple-300 hover:bg-purple-50 transition-all"
                      >
                        {holisticExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        {holisticExpanded ? 'Test Seçimini Gizle' : 'Test Seç ve Harmanla'}
                        {holisticSelected.size > 0 && !holisticExpanded && (
                          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-purple-600 text-white text-[10px]">
                            {holisticSelected.size} seçili
                          </span>
                        )}
                      </button>
                    </div>

                    {/* Test Seçim Listesi */}
                    {holisticExpanded && (
                      <div className="mt-3 bg-white rounded-xl border border-purple-200 p-4" style={{ marginLeft: '52px' }}>
                        <div className="flex items-center justify-between mb-3 pb-3 border-b border-purple-100">
                          <div className="text-[12px] font-bold text-[#0f2847]">
                            Harmanlanacak testleri seçin
                            <span className="ml-2 text-[11px] font-normal text-purple-600">
                              ({holisticSelected.size} / {completed.length} seçili)
                            </span>
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              onClick={selectAllHolistic}
                              className="text-[11px] font-semibold text-purple-700 hover:text-purple-900 px-2 py-1 rounded hover:bg-purple-50 transition"
                            >
                              Tümünü Seç
                            </button>
                            <button
                              onClick={clearAllHolistic}
                              className="text-[11px] font-semibold text-gray-600 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-50 transition"
                            >
                              Temizle
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                          {completed.map(ct => {
                            const isSelected = holisticSelected.has(ct.test_type);
                            return (
                              <button
                                key={ct.id}
                                onClick={() => toggleHolisticTest(ct.test_type)}
                                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left transition-all ${
                                  isSelected
                                    ? 'bg-purple-50 border-purple-400 text-purple-900 shadow-sm'
                                    : 'bg-white border-gray-200 text-gray-700 hover:border-purple-300 hover:bg-purple-50/50'
                                }`}
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 text-purple-600 shrink-0" />
                                ) : (
                                  <Square className="w-4 h-4 text-gray-400 shrink-0" />
                                )}
                                <span className="text-[12px] font-semibold flex-1 truncate">{labelOf(ct.test_type)}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Bilgi + Üret Butonu */}
                        {holisticSelected.size < 2 ? (
                          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-[12px] text-amber-800">
                              Harmanlama için en az <strong>2 test</strong> seçmelisiniz.
                            </p>
                          </div>
                        ) : (
                          <button
                            onClick={() => setHolisticConfirmOpen(true)}
                            disabled={busyKey === 'holistic'}
                            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-[13px] font-bold shadow-md hover:shadow-lg disabled:opacity-60 transition-all"
                          >
                            {busyKey === 'holistic' ? (
                              <><Loader2 className="w-4 h-4 animate-spin" /> Üretiliyor...</>
                            ) : (
                              <><Sparkles className="w-4 h-4" /> Seçili {holisticSelected.size} Testi Harmanla</>
                            )}
                          </button>
                        )}
                      </div>
                    )}

                    {/* GEÇMİŞ RAPORLAR LİSTESİ */}
                    {holisticHistory.length > 0 && (
                      <div className="mt-3" style={{ marginLeft: '52px' }}>
                        <button
                          onClick={() => setHolisticHistoryOpen(v => !v)}
                          className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-white border border-purple-200 hover:bg-purple-50 transition"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-purple-600" />
                            <span className="text-[12px] font-bold text-[#0f2847]">
                              Geçmiş Harmanlanmış Raporlar
                            </span>
                            <span className="px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold">
                              {holisticHistory.length}
                            </span>
                          </div>
                          {holisticHistoryOpen ? <ChevronUp className="w-4 h-4 text-purple-600" /> : <ChevronDown className="w-4 h-4 text-purple-600" />}
                        </button>

                        {holisticHistoryOpen && (
                          <div className="mt-2 space-y-2">
                            {holisticHistory.map((hr, idx) => (
                              <div key={hr.id} className="bg-white rounded-xl border border-purple-200 p-3 hover:shadow-sm transition">
                                <div className="flex items-start justify-between gap-3 flex-wrap">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1.5">
                                      <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 text-[10px] font-bold">
                                        #{holisticHistory.length - idx}
                                      </span>
                                      <span className="text-[12px] font-semibold text-[#0f2847]">
                                        {formatDate(hr.generated_at)}
                                      </span>
                                      <span className="text-[11px] text-purple-600">
                                        {hr.test_count} test
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {hr.selected_test_types.slice(0, 6).map(t => (
                                        <span key={t} className="px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-[10px] font-semibold">
                                          {labelOf(t)}
                                        </span>
                                      ))}
                                      {hr.selected_test_types.length > 6 && (
                                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-semibold">
                                          +{hr.selected_test_types.length - 6}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    <button
                                      onClick={() => setViewer({
                                        title: `${student.full_name} — Harmanlanmış Rapor (${formatDate(hr.generated_at)})`,
                                        text: hr.text,
                                      })}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white text-purple-700 text-[11px] font-bold border border-purple-300 hover:bg-purple-50 transition"
                                    >
                                      <Eye className="w-3 h-3" /> Görüntüle
                                    </button>
                                    <a
                                      href={`/api/export/holistic/pdf?id=${encodeURIComponent(hr.id)}`}
                                      target="_blank"
                                      rel="noopener"
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white text-rose-700 text-[11px] font-bold border border-rose-200 hover:bg-rose-50 transition"
                                      title="PDF olarak indir"
                                    >
                                      <Download className="w-3 h-3" /> PDF
                                    </a>
                                    <a
                                      href={`/api/export/holistic/docx?id=${encodeURIComponent(hr.id)}`}
                                      target="_blank"
                                      rel="noopener"
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white text-sky-700 text-[11px] font-bold border border-sky-200 hover:bg-sky-50 transition"
                                      title="Word (DOCX) olarak indir"
                                    >
                                      <Download className="w-3 h-3" /> DOCX
                                    </a>
                                    <button
                                      onClick={() => deleteHolistic(hr.id)}
                                      disabled={busyKey === 'holistic-delete-' + hr.id}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white text-red-600 text-[11px] font-bold border border-red-200 hover:bg-red-50 disabled:opacity-60 transition"
                                    >
                                      {busyKey === 'holistic-delete-' + hr.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ENTEGRE 3'LÜ RAPOR */}
                  <div className="bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-md shrink-0">
                        <Layers className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-[15px] font-extrabold text-[#0f2847]">Entegre 3&apos;lü Rapor</h3>
                        <p className="text-[12px] text-rose-700 mt-0.5">Öğretmen + Öğrenci + Veli için özelleştirilmiş 3 ayrı rapor.</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2" style={{ paddingLeft: '52px' }}>
                      {!integratedExists ? (
                        <button
                          onClick={() => generateIntegrated()}
                          disabled={busyKey === 'integrated'}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-rose-500 to-pink-600 text-white text-[12px] font-bold shadow-md hover:shadow-lg disabled:opacity-60 transition-all"
                        >
                          {busyKey === 'integrated' ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Üretiliyor...</> : <><Sparkles className="w-3.5 h-3.5" /> 3&apos;lü Rapor Üret</>}
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => setViewer({
                              title: `${student.full_name} — Öğretmen Raporu`,
                              text: integrated?.teacher_report || '',
                              pdfUrl: `/api/export/integrated?student_id=${studentId}&format=pdf`,
                              docxUrl: `/api/export/integrated?student_id=${studentId}&format=docx`,
                            })}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white text-sky-700 text-[12px] font-bold border border-sky-300 hover:bg-sky-50 transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" /> Öğretmen
                          </button>
                          <button
                            onClick={() => setViewer({
                              title: `${student.full_name} — Öğrenci Raporu`,
                              text: integrated?.student_report || '',
                              pdfUrl: `/api/export/integrated?student_id=${studentId}&format=pdf`,
                              docxUrl: `/api/export/integrated?student_id=${studentId}&format=docx`,
                            })}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white text-violet-700 text-[12px] font-bold border border-violet-300 hover:bg-violet-50 transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" /> Öğrenci
                          </button>
                          <button
                            onClick={() => setViewer({
                              title: `${student.full_name} — Veli Raporu`,
                              text: integrated?.parent_report || '',
                              pdfUrl: `/api/export/integrated?student_id=${studentId}&format=pdf`,
                              docxUrl: `/api/export/integrated?student_id=${studentId}&format=docx`,
                            })}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white text-pink-700 text-[12px] font-bold border border-pink-300 hover:bg-pink-50 transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" /> Veli
                          </button>
                          <a
                            href={`/api/export/integrated?student_id=${studentId}&format=pdf`}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-[12px] font-bold border border-red-200 hover:bg-red-100 transition-all"
                          >
                            <Download className="w-3.5 h-3.5" /> PDF
                          </a>
                          <a
                            href={`/api/export/integrated?student_id=${studentId}&format=docx`}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-[12px] font-bold border border-blue-200 hover:bg-blue-100 transition-all"
                          >
                            <Download className="w-3.5 h-3.5" /> DOCX
                          </a>
                          <button
                            onClick={() => generateIntegrated(true)}
                            disabled={busyKey === 'integrated'}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white text-gray-600 text-[12px] font-bold border border-gray-300 hover:bg-gray-50 disabled:opacity-60 transition-all"
                          >
                            {busyKey === 'integrated' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Yenile
                          </button>
                        </>
                      )}
                    </div>
                    {integrated?.generated_at && (
                      <p className="text-[11px] text-rose-600 mt-2" style={{ paddingLeft: '52px' }}>
                        Üretildi: {formatDate(integrated.generated_at)}
                      </p>
                    )}
                  </div>

                  {/* ═══════════════════════════════════════════════ */}
                  {/* ═══ İLERİ ANALİZ — TÜM RAPORLAR ÜRETİLDİYSE ═══ */}
                  {/* ═══════════════════════════════════════════════ */}
                  {(() => {
                    const allReportsReady = completed.length >= 2 && completed.every((c) => c.has_report);
                    if (!allReportsReady) {
                      // Kilitli durum
                      const missingReports = completed.filter((c) => !c.has_report).length;
                      return (
                        <div className="mt-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-5 text-center">
                          <Lock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <h3 className="text-[14px] font-extrabold text-gray-600 mb-1">İleri Analiz Kilitli</h3>
                          <p className="text-[12px] text-gray-500">
                            {completed.length < 2
                              ? 'En az 2 test tamamlanmalı.'
                              : `İleri analizi açmak için ${missingReports} testin daha raporu üretilmeli.`}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-2">
                            🔓 Risk Skoru, Korelasyon, Kariyer Önerileri ve 360° Profil burada görünecek.
                          </p>
                        </div>
                      );
                    }

                    // Açık durum — advanced verisi gelmiş olmalı
                    if (!advanced.unlocked) return null;

                    return (
                      <div className="mt-6 space-y-4">
                        {/* İleri Analiz Banner */}
                        <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/20">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                              <TrendingUp className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="text-[16px] font-extrabold">İleri Analiz</h3>
                              <p className="text-[12px] text-emerald-50">Tüm raporlar baz alınarak üretildi.</p>
                            </div>
                          </div>
                        </div>

                        {/* RİSK SKORU */}
                        {advanced.riskScore && (
                          <div className={`rounded-2xl border-2 p-5 shadow-sm ${advanced.riskScore.bgColor} ${advanced.riskScore.borderColor}`}>
                            <div className="flex items-start gap-3 mb-3">
                              <div className="w-10 h-10 rounded-xl bg-white shadow-md flex items-center justify-center shrink-0">
                                <Shield className={`w-5 h-5 ${advanced.riskScore.color}`} />
                              </div>
                              <div className="flex-1">
                                <h3 className={`text-[15px] font-extrabold ${advanced.riskScore.color} flex items-center gap-2`}>
                                  Risk Skoru: {advanced.riskScore.label} {advanced.riskScore.emoji}
                                </h3>
                                <p className="text-[12px] text-gray-600 mt-0.5">
                                  Genel Skor: <strong>{Math.round(advanced.riskScore.overallScore)}/100</strong>
                                </p>
                              </div>
                            </div>

                            {/* Boyutlar */}
                            <div className="grid grid-cols-2 gap-2 mb-3" style={{ marginLeft: '52px' }}>
                              {advanced.riskScore.dimensions.map((d) => (
                                <div key={d.key} className="bg-white/70 rounded-lg p-2 border border-white/50">
                                  <p className="text-[10px] uppercase font-bold text-gray-400">{d.name}</p>
                                  <p className={`text-sm font-extrabold ${d.available ? 'text-[#0f2847]' : 'text-gray-300'}`}>
                                    {d.available && d.score !== null ? `${Math.round(d.score)}/100` : '—'}
                                  </p>
                                </div>
                              ))}
                            </div>

                            {/* Flagler */}
                            {advanced.riskScore.flags.length > 0 && (
                              <div className="space-y-1.5" style={{ marginLeft: '52px' }}>
                                {advanced.riskScore.flags.map((f) => (
                                  <div key={f.id} className={`flex items-start gap-2 text-[12px] px-3 py-2 rounded-lg ${f.severity === 'kritik' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                    <span>{f.icon}</span>
                                    <span className="font-medium">{f.message}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* KORELASYON BULGULARI */}
                        {advanced.patterns && advanced.patterns.length > 0 && (
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 shadow-sm">
                            <div className="flex items-start gap-3 mb-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shrink-0">
                                <Link2 className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <h3 className="text-[15px] font-extrabold text-[#0f2847]">Korelasyon Bulguları</h3>
                                <p className="text-[12px] text-blue-700 mt-0.5">
                                  Testler arası anlamlı bağlantılar ({advanced.patterns.length})
                                </p>
                              </div>
                            </div>
                            <div className="space-y-2" style={{ marginLeft: '52px' }}>
                              {advanced.patterns.map((p) => (
                                <div key={p.id} className={`rounded-xl p-3 border ${
                                  p.severity === 'kritik' ? 'bg-red-50 border-red-200' :
                                  p.severity === 'uyarı' ? 'bg-amber-50 border-amber-200' :
                                  'bg-white border-blue-100'
                                }`}>
                                  <div className="flex items-start gap-2">
                                    <span className="text-lg">{p.icon}</span>
                                    <div className="flex-1">
                                      <h4 className="text-[13px] font-bold text-[#0f2847]">{p.title}</h4>
                                      <p className="text-[12px] text-gray-600 mt-0.5">{p.description}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* GÜÇLÜ KORELASYON ÇİFTLERİ */}
                        {advanced.correlation && advanced.correlation.pairs.filter(p => p.strength === 'güçlü').length > 0 && (
                          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-5 shadow-sm">
                            <h4 className="text-[14px] font-extrabold text-[#0f2847] mb-3 flex items-center gap-2">
                              <Link2 className="w-4 h-4 text-indigo-500" /> Güçlü Test Bağlantıları
                            </h4>
                            <div className="space-y-1.5">
                              {advanced.correlation.pairs.filter(p => p.strength === 'güçlü').map((p, i) => (
                                <div key={i} className="flex items-center justify-between text-[12px] px-3 py-2 bg-gray-50 rounded-lg">
                                  <span className="font-semibold text-[#0f2847]">
                                    {labelOf(p.testA)} ↔ {labelOf(p.testB)}
                                  </span>
                                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                    p.direction === 'pozitif' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                  }`}>
                                    {p.direction === 'pozitif' ? '+' : ''}{p.coefficient.toFixed(2)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* KARİYER ÖNERİLERİ */}
                        {advanced.career && advanced.career.topCareers.length > 0 && (
                          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-5 shadow-sm">
                            <div className="flex items-start gap-3 mb-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md shrink-0">
                                <Briefcase className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <h3 className="text-[15px] font-extrabold text-[#0f2847]">Kariyer Önerileri</h3>
                                <p className="text-[12px] text-amber-700 mt-0.5">
                                  Çoklu Zekâ + Holland RIASEC + VARK eşleşmesi
                                </p>
                              </div>
                            </div>
                            <p className="text-[12px] text-gray-600 mb-3 italic" style={{ marginLeft: '52px' }}>
                              {advanced.career.compatibilityNote}
                            </p>
                            <div className="space-y-2" style={{ marginLeft: '52px' }}>
                              {advanced.career.topCareers.map((c) => (
                                <div key={c.rank} className="bg-white rounded-xl p-3 border border-amber-100 shadow-sm">
                                  <div className="flex items-start gap-3">
                                    <span className="text-2xl">{c.icon}</span>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between gap-2 mb-1">
                                        <h4 className="text-[13px] font-extrabold text-[#0f2847] truncate">
                                          #{c.rank} {c.career}
                                        </h4>
                                        <span className="text-[11px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full shrink-0">
                                          %{c.matchScore}
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-gray-500 mb-1">{c.field}</p>
                                      {c.reasons.length > 0 && (
                                        <ul className="text-[11px] text-gray-600 space-y-0.5">
                                          {c.reasons.slice(0, 2).map((r, i) => (
                                            <li key={i}>• {r}</li>
                                          ))}
                                        </ul>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 360° PROFİL LİNKİ */}
                        <Link
                          href="/student/profile-360"
                          className="block bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 hover:-translate-y-0.5 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                              <Brain className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-[15px] font-extrabold">360° Profil Sayfası</h3>
                              <p className="text-[12px] text-violet-100">Radar chart + tüm analizlerin görsel özeti</p>
                            </div>
                            <ArrowLeft className="w-5 h-5 rotate-180 opacity-60" />
                          </div>
                        </Link>
                      </div>
                    );
                  })()}
                </>
              )}

              {completed.length === 1 && (
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center mt-2">
                  <p className="text-[12px] text-gray-500">
                    💡 Harmanlanmış ve 3&apos;lü Entegre Rapor üretmek için en az <strong>2 tamamlanmış test</strong> gerekir.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* HARMANLANMIŞ RAPOR ONAY MODAL */}
      {holisticConfirmOpen && (
        <div
          onClick={() => setHolisticConfirmOpen(false)}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full"
          >
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md shrink-0">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-[16px] font-extrabold text-[#0f2847]">Yeni Harmanlanmış Rapor Üretilecek</h3>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              <p className="text-[13px] text-gray-700 leading-relaxed">
                Seçtiğiniz <strong className="text-purple-700">{holisticSelected.size} test</strong> için yeni bir harmanlanmış rapor üretilecek.
                Daha önce üretilmiş harmanlanmış raporlar <strong>silinmez</strong>, bu yeni bir kayıt olarak eklenir ve geçmiş listede görüntülenir.
              </p>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="text-[11px] font-bold text-purple-700 mb-2">SEÇİLİ TESTLER:</div>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(holisticSelected).map(t => (
                    <span key={t} className="px-2 py-0.5 rounded-full bg-white border border-purple-300 text-purple-800 text-[11px] font-semibold">
                      {labelOf(t)}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[12px] text-amber-800">
                  Her harman üretimi AI API harcaması yapar. Gereksiz tekrarlardan kaçının.
                </p>
              </div>

              {holisticHistory.length > 0 && (
                <p className="text-[11px] text-gray-500 italic">
                  Şu an bu öğrenci için <strong>{holisticHistory.length}</strong> harmanlanmış rapor mevcut. Yeni üretim ile {holisticHistory.length + 1}&apos;e çıkacak.
                </p>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setHolisticConfirmOpen(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-[12px] font-bold hover:bg-gray-200 transition-all"
              >
                İptal
              </button>
              <button
                onClick={generateHolistic}
                disabled={busyKey === 'holistic'}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-[12px] font-bold shadow-md hover:shadow-lg disabled:opacity-60 transition-all"
              >
                {busyKey === 'holistic' ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Üretiliyor...</>
                ) : (
                  <><Sparkles className="w-3.5 h-3.5" /> Devam Et ve Üret</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RAPOR GÖRÜNTÜLEME MODAL */}
      {viewer && (
        <div
          onClick={() => setViewer(null)}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <h3 className="text-[16px] font-extrabold text-[#0f2847]">{viewer.title}</h3>
              <button onClick={() => setViewer(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 bg-gradient-to-b from-white via-violet-50/20 to-sky-50/20">
              <ReportRenderer text={viewer.text || ''} />
            </div>

            {(viewer.pdfUrl || viewer.docxUrl) && (
              <div className="flex items-center gap-2 px-6 py-3 border-t border-gray-100 shrink-0">
                {viewer.pdfUrl && (
                  <a href={viewer.pdfUrl} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-[12px] font-bold border border-red-200 hover:bg-red-100 transition-all">
                    <Download className="w-3.5 h-3.5" /> PDF İndir
                  </a>
                )}
                {viewer.docxUrl && (
                  <a href={viewer.docxUrl} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-[12px] font-bold border border-blue-200 hover:bg-blue-100 transition-all">
                    <Download className="w-3.5 h-3.5" /> DOCX İndir
                  </a>
                )}
                <button onClick={() => setViewer(null)} className="ml-auto px-3 py-2 rounded-lg bg-gray-100 text-gray-600 text-[12px] font-bold hover:bg-gray-200 transition-all">
                  Kapat
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ÖĞRENCİ AKTARMA — ÖĞRETMEN SEÇİM MODAL'I */}
      {transferModalOpen && (
        <div
          onClick={() => !transferring && setTransferModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[85vh] flex flex-col"
          >
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center shadow-md shrink-0">
                  <ArrowRightLeft className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-[16px] font-extrabold text-[#0f2847]">Öğrenciyi Aktar</h3>
                  <p className="text-[11px] text-gray-500">{student.full_name} için hedef öğretmen seçin</p>
                </div>
              </div>
              <button
                onClick={() => !transferring && setTransferModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Arama kutusu */}
            <div className="px-6 py-3 border-b border-gray-100 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={transferSearch}
                  onChange={(e) => setTransferSearch(e.target.value)}
                  placeholder="Öğretmen ara (isim, branş, okul)..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all"
                />
              </div>
            </div>

            {/* Liste */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {transferLoading ? (
                <div className="flex items-center justify-center py-12 text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Öğretmenler yükleniyor...
                </div>
              ) : filteredTransferTeachers.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-[13px]">
                  {transferSearch ? 'Aramanıza uygun öğretmen bulunamadı.' : 'Aktarım yapılabilecek başka onaylı öğretmen yok.'}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTransferTeachers.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => confirmTransfer({ id: t.id, full_name: t.full_name })}
                      className="w-full text-left bg-white hover:bg-sky-50 border border-gray-200 hover:border-sky-300 rounded-xl p-3 transition-all flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-100 to-cyan-100 flex items-center justify-center shrink-0">
                        <UserPlus className="w-5 h-5 text-sky-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-[#0f2847] truncate">{t.full_name}</p>
                        <p className="text-[11px] text-gray-500 truncate">
                          {t.branch && <span>{t.branch}</span>}
                          {t.branch && t.school_name && <span> · </span>}
                          {t.school_name && <span>{t.school_name}</span>}
                          {!t.branch && !t.school_name && <span>Bilgi yok</span>}
                        </p>
                      </div>
                      <ArrowRightLeft className="w-4 h-4 text-sky-500 shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-gray-100 shrink-0">
              <p className="text-[11px] text-gray-500 text-center">
                Aktarım sonrası öğrencinin tüm verileri (testler, raporlar) korunur.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ÖĞRENCİ AKTARMA — ONAY MODAL'I */}
      {transferConfirmOpen && transferSelected && (
        <div
          onClick={() => !transferring && setTransferConfirmOpen(false)}
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
          >
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md shrink-0">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-[16px] font-extrabold text-[#0f2847]">Aktarımı Onayla</h3>
              </div>
            </div>

            <div className="px-6 py-5 space-y-3">
              <p className="text-[13px] text-gray-700 leading-relaxed">
                <strong className="text-[#0f2847]">{student.full_name}</strong> adlı öğrenciyi{' '}
                <strong className="text-sky-700">{transferSelected.full_name}</strong> adlı öğretmene aktarmak üzeresiniz.
              </p>

              <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 text-[12px] text-sky-900">
                <p className="font-bold mb-1">✓ Aktarım sonrası:</p>
                <ul className="space-y-1 text-[11px] list-disc list-inside ml-1">
                  <li>Öğrencinin tüm test sonuçları korunur</li>
                  <li>AI raporları (tekil, harman, entegre) korunur</li>
                  <li>Okul, sınıf, şube, ad-soyad bilgileri aynı kalır</li>
                  <li>Öğrenci yeni öğretmenin listesinde görünür</li>
                  <li>Sizin listenizden kaybolur</li>
                </ul>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800">
                  Bu işlem <strong>geri alınamaz</strong>. Geri almak için yeni öğretmenin aynı süreci tersine uygulaması gerekir.
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                onClick={() => !transferring && setTransferConfirmOpen(false)}
                disabled={transferring}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-[12px] font-bold hover:bg-gray-200 disabled:opacity-60 transition-all"
              >
                İptal
              </button>
              <button
                onClick={executeTransfer}
                disabled={transferring}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-cyan-500 text-white text-[12px] font-bold shadow-md hover:shadow-lg disabled:opacity-60 transition-all"
              >
                {transferring ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Aktarılıyor...</>
                ) : (
                  <><ArrowRightLeft className="w-3.5 h-3.5" /> Evet, Aktar</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
