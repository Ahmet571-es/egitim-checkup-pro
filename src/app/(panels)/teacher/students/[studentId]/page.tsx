'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { secureFetch } from '@/lib/csrf-client';
import ReportRenderer from '@/components/ReportRenderer';
import TestAnswersViewer from '@/components/teacher/TestAnswersViewer';
import GeneticReportsSection from '@/components/GeneticReportsSection';
import HolisticAttachmentsPanel from '@/components/teacher/HolisticAttachmentsPanel';
import StudentProgressPanel from '@/components/teacher/StudentProgressPanel';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { PACKAGE_LIST, checkPackageCompletion, type PackageType } from '@/lib/packages';
import {
  ArrowLeft, GraduationCap, CheckCircle2, Circle, Bell, AlertCircle,
  FileText, BookOpen, X, Send, Loader2, Sparkles, Eye, Download, RefreshCw,
  Brain, Layers, Shield, Link2, Briefcase, Lock, TrendingUp,
  Trash2, ChevronDown, ChevronUp, AlertTriangle, CheckSquare, Square,
  UserPlus, ArrowRightLeft, Search, Paperclip, Package
} from 'lucide-react';

const TEST_LABELS: Record<string, string> = {
  enneagram: 'Enneagram Kişilik',
  vark: 'VARK Öğrenme Stilleri',
  holland: 'Meslek Testi',
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
  d2_dikkat: 'D2 Dikkat Testi',
  'd2-dikkat': 'D2 Dikkat Testi',
  burdon_dikkat: 'Burdon Dikkat',
  'burdon-dikkat': 'Burdon Dikkat',
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
  id?: string;
  teacher_report: string | null;
  student_report: string | null;
  parent_report: string | null;
  generated_at: string | null;
  source_test_types?: string[] | null;
  test_count?: number | null;
}

interface IntegratedHistoryItem {
  id: string;
  teacher_report: string | null;
  student_report: string | null;
  parent_report: string | null;
  generated_at: string | null;
  source_test_types?: string[] | null;
  test_count?: number | null;
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
interface RiskDimension { key: string; name: string; score: number | null; weight: number; available: boolean; }
interface RiskFlag { id: string; message: string; severity: 'kritik' | 'uyarı'; icon: string; }
interface RiskScore {
  overallScore: number; level: 'kritik' | 'izlenmeli' | 'saglikli'; color: string; bgColor: string; borderColor: string;
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
  const { confirm } = useConfirm();
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
  // Faz 6: hangi holistic raporlar için "Genetik Ek'leri" panel'i açık
  const [attachExpandedFor, setAttachExpandedFor] = useState<Set<string>>(new Set());
  // Faz 7: Gelişim paneli açık/kapalı
  const [progressExpanded, setProgressExpanded] = useState(false);
  // Faz 9: Paket raporu modal + üretim state'leri
  const [packageModalOpen, setPackageModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PackageType | null>(null);
  const [packageGenerating, setPackageGenerating] = useState(false);
  const [integrated, setIntegrated] = useState<IntegratedReport | null>(null);

  // ═══ Entegre 3'lü Rapor — Test Seçim Modalı + Geçmiş ═══
  const [integratedModalOpen, setIntegratedModalOpen] = useState(false);
  const [integratedSelected, setIntegratedSelected] = useState<Set<string>>(new Set());
  const [integratedHistory, setIntegratedHistory] = useState<IntegratedHistoryItem[]>([]);
  const [integratedHistoryOpen, setIntegratedHistoryOpen] = useState(false);
  const [advanced, setAdvanced] = useState<AdvancedAnalysis>({ unlocked: false });
  const [answersViewer, setAnswersViewer] = useState<{ resultId: string } | null>(null);

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
      setIntegratedHistory(Array.isArray(data.integratedHistory) ? data.integratedHistory : []);
      // Varsayılan: hiçbiri seçili değil — öğretmen sıfırdan seçsin
      setIntegratedSelected(new Set());
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
      const selectedIds = Array.from(holisticSelected);
      const res = await secureFetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          report_type: 'holistic',
          selected_result_ids: selectedIds,
        }),
      });
      const data = await res.json();
      if (data.success && data.report) {
        setSuccess(`✅ ${selectedIds.length} test için harmanlanmış rapor üretildi.`);
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

  // ═══ Faz 9: Paket bazlı 3 versiyonlu rapor üret ═══
  const generatePackageReport = async () => {
    if (!selectedPackage) return;
    setPackageGenerating(true);
    setError('');
    setSuccess('');
    try {
      const res = await secureFetch('/api/reports/package/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          package_type: selectedPackage,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(`✅ ${data.package} paketi için 3 versiyon (öğretmen/veli/öğrenci) üretildi.`);
        setTimeout(() => setSuccess(''), 5000);
        setPackageModalOpen(false);
        setSelectedPackage(null);
        await loadDetail();
      } else {
        setError(data.error || 'Paket raporu üretilemedi.');
      }
    } catch (e: unknown) {
      setError((e as Error).message);
    }
    setPackageGenerating(false);
  };

  // ═══ Tek bir harmanlanmış raporu sil ═══
  const deleteHolistic = async (id: string) => {
    const ok = await confirm({
      variant: 'danger',
      title: 'Harmanlanmış raporu sil?',
      description: 'Bu harmanlanmış raporu silmek üzeresin. İşlem geri alınamaz ve rapor kalıcı olarak kaybolur.',
      confirmLabel: 'Evet, Sil',
    });
    if (!ok) return;
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
  const toggleHolisticTest = (recordId: string) => {
    setHolisticSelected(prev => {
      const next = new Set(prev);
      if (next.has(recordId)) next.delete(recordId);
      else next.add(recordId);
      return next;
    });
  };

  const selectAllHolistic = () => {
    setHolisticSelected(new Set(completed.map(c => c.id)));
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
    const selected = Array.from(integratedSelected);
    if (selected.length < 2) {
      setError('En az 2 test seçmelisiniz.');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setBusyKey('integrated');
    setError('');
    setSuccess('');
    try {
      const res = await secureFetch('/api/reports/integrated', {
        method: force ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          selected_result_ids: selected,
        }),
      });
      const data = await res.json();
      if (data.success || data.already_generated) {
        setSuccess(force ? '✅ 3\'lü rapor yeniden üretildi.' : '✅ 3\'lü entegre rapor üretildi.');
        setTimeout(() => setSuccess(''), 3000);
        setIntegratedModalOpen(false);
        setIntegratedSelected(new Set());
        await loadDetail();
      } else {
        setError(data.error || 'Rapor üretilemedi.');
      }
    } catch (e: unknown) {
      setError((e as Error).message);
    }
    setBusyKey(null);
  };

  // Toggle helpers
  const toggleIntegratedTest = (testType: string) => {
    setIntegratedSelected(prev => {
      const next = new Set(prev);
      if (next.has(testType)) next.delete(testType);
      else next.add(testType);
      return next;
    });
  };
  const selectAllIntegrated = () => {
    setIntegratedSelected(new Set(completed.map(c => c.test_type)));
  };
  const clearAllIntegrated = () => setIntegratedSelected(new Set());

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
        <p className="text-gray-500 dark:text-slate-400 text-sm font-medium">Öğrenci yükleniyor...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="relative bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl border border-white/50 dark:border-slate-700/60 p-12 text-center shadow-sm overflow-hidden my-10">
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-gradient-to-br from-red-200 to-rose-200 opacity-30 blur-3xl" />
        <div className="relative">
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg">
            <X className="w-10 h-10 text-white" />
          </div>
          <p className="text-[17px] text-[#0f2847] dark:text-slate-100 font-extrabold mb-2">Öğrenci bulunamadı</p>
          <p className="text-gray-500 dark:text-slate-400 text-sm mb-5">Bu ID ile eşleşen öğrenci yok ya da erişiminiz yok.</p>
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
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/80 dark:bg-slate-800/60 backdrop-blur-md border border-white/60 dark:border-slate-700/60 text-[12.5px] text-gray-600 dark:text-slate-300 hover:text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 font-bold transition-all mb-4 shadow-sm active:scale-95"
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
              <div className="w-16 h-16 rounded-2xl bg-white/25 backdrop-blur-md border-2 border-white/40 dark:border-slate-700/60 flex items-center justify-center shadow-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent" />
                <GraduationCap className="w-8 h-8 text-white relative drop-shadow-md" />
              </div>
              {/* Online dot */}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-md">
                <div className="relative w-3 h-3 rounded-full bg-emerald-500">
                  <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
                </div>
              </div>
            </div>

            <div className="flex-1 min-w-0 text-white">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-slate-800 animate-pulse" />
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
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 text-[#0f2847] dark:text-slate-100 text-[12.5px] font-extrabold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all shrink-0 active:scale-[0.97]"
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
              <h3 className="text-[15px] font-extrabold text-[#0f2847] dark:text-slate-100">
                Öğrencinin çözmesi gereken {activeAssignments.length === 1 ? 'test' : 'testler'}:
              </h3>
              <p className="text-[12px] text-amber-700 mt-0.5 font-medium">
                Öğrenci tamamladığında bu uyarı otomatik kaybolacak.
              </p>
            </div>
          </div>
          <div className="relative flex flex-wrap gap-2" style={{ paddingLeft: '52px' }}>
            {activeAssignments.map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-800 border-2 border-amber-300 text-amber-900 text-[12px] font-extrabold px-3 py-1.5 rounded-full shadow-sm hover:border-amber-400 hover:shadow-md transition-all">
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

      {/* Faz 5: Genetik Rapor Yönetimi (KVKK m.6 - öğretmen sadece görüntüleme/indirme) */}
      <GeneticReportsSection studentId={student.id} studentName={student.full_name} />

      {/* Sekmeler */}
      <div className="flex gap-2 mb-4 bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-slate-700/60 p-1.5 shadow-sm">
        <button
          onClick={() => setTab('pending')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            tab === 'pending'
              ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md'
              : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:bg-slate-800/60'
          }`}
        >
          <BookOpen className="w-4 h-4" /> Yapılacak Testler ({pending.length})
        </button>
        <button
          onClick={() => setTab('done')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            tab === 'done'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
              : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:bg-slate-800/60'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" /> Yapılan Testler ({completed.length})
        </button>
      </div>

      {/* YAPILACAK TESTLER */}
      {tab === 'pending' && (
        <div>
          {pending.length === 0 ? (
            <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-slate-700/60 p-12 text-center shadow-sm">
              <p className="text-5xl mb-3">🎉</p>
              <p className="text-gray-600 dark:text-slate-300 font-semibold">Tüm testler tamamlandı!</p>
              <p className="text-gray-400 dark:text-slate-500 text-sm mt-2">Öğrenci 11 testin hepsini bitirdi.</p>
            </div>
          ) : (
            <>
              <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-slate-700/60 shadow-sm overflow-hidden mb-4">
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
                        <p className="text-[14px] font-semibold text-[#0f2847] dark:text-slate-100">{labelOf(t)}</p>
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
          {/* Faz 7: Gelişim Görüntüleme — collapsible (her zaman görünür, içeride veri yoksa graceful mesaj) */}
          <div className="bg-gradient-to-br from-sky-50 via-cyan-50 to-blue-50 dark:from-sky-950/20 dark:via-cyan-950/20 dark:to-blue-950/20 rounded-2xl border border-sky-200 dark:border-sky-900/40 shadow-sm overflow-hidden mb-6">
            <button
              onClick={() => setProgressExpanded((v) => !v)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-sky-100/50 dark:hover:bg-sky-950/40 transition-colors"
              aria-expanded={progressExpanded}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center text-white shadow-md">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <h3 className="text-[14px] font-extrabold text-[#0f2847] dark:text-slate-100">
                    Gelişim Görüntüleme
                  </h3>
                  <p className="text-[11px] text-gray-600 dark:text-slate-400 mt-0.5">
                    Zaman içinde test skorlarındaki değişim, delta tablosu ve AI yorumu
                  </p>
                </div>
              </div>
              {progressExpanded ? <ChevronUp className="w-4 h-4 text-sky-600" /> : <ChevronDown className="w-4 h-4 text-sky-600" />}
            </button>
            {progressExpanded && (
              <div className="px-4 pb-4">
                <StudentProgressPanel studentId={student.id} />
              </div>
            )}
          </div>

          {completed.length === 0 ? (
            <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-slate-700/60 p-12 text-center shadow-sm">
              <p className="text-5xl mb-3">📭</p>
              <p className="text-gray-500 dark:text-slate-400 font-semibold">Henüz tamamlanan test yok.</p>
            </div>
          ) : (
            <>

              {/* Test bazlı tekil raporlar */}
              <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-slate-700/60 shadow-sm overflow-hidden mb-6">
                <div className="px-4 py-3 bg-gradient-to-r from-sky-50 to-blue-50 border-b border-sky-100">
                  <h3 className="text-[14px] font-extrabold text-[#0f2847] dark:text-slate-100 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-sky-600" /> Tekil Raporlar
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">Her test için ayrı AI analiz raporu.</p>
                </div>

                {completed.map((c) => {
                  const isBusy = busyKey === `single-${c.id}`;
                  const totalAttempts = attemptInfo.totalFor(c.test_type);
                  const attemptNo = attemptInfo.numberFor(c.id);
                  const isLatest = attemptInfo.isLatest(c.id, c.test_type);
                  const showAttemptBadge = totalAttempts > 1;
                  return (
                    <div key={c.id} className={`px-4 py-3.5 border-b border-gray-50 last:border-b-0 ${showAttemptBadge && !isLatest ? 'bg-gray-50 dark:bg-slate-800/60/50' : ''}`}>
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${c.has_report ? 'bg-emerald-100' : 'bg-gray-100 dark:bg-slate-700/60'}`}>
                          <CheckCircle2 className={`w-4 h-4 ${c.has_report ? 'text-emerald-600' : 'text-gray-400 dark:text-slate-500'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-[14px] font-semibold text-[#0f2847] dark:text-slate-100 truncate">{labelOf(c.test_type)}</p>
                            {showAttemptBadge && (
                              isLatest ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm">
                                  ✓ En Güncel
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-200 text-gray-600 dark:text-slate-300">
                                  {attemptNo}. Deneme
                                </span>
                              )
                            )}
                          </div>
                          <p className="text-[11px] text-gray-400 dark:text-slate-500">
                            Tamamlandı: {formatDate(c.completed_at)}
                            {c.ai_report_generated_at && ` · Rapor: ${formatDate(c.ai_report_generated_at)}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 ml-11">
                        {/* Cevapları Gör — her zaman gözükür */}
                        <button
                          onClick={() => setAnswersViewer({ resultId: c.id })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-[12px] font-bold border border-violet-200 dark:border-violet-700/50 hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-all"
                          title="Öğrencinin verdiği cevapları gör"
                        >
                          <FileText className="w-3.5 h-3.5" /> Cevapları Gör
                        </button>

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
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-700/60 text-gray-600 dark:text-slate-300 text-[12px] font-bold hover:bg-gray-200 disabled:opacity-60 transition-all"
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
                  {/* FAZ 9: PAKET BAZLI BÜTÜNCÜL RAPOR (3 VERSİYON) */}
                  <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-rose-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-5 shadow-sm mb-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md shrink-0">
                        <Package className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-[15px] font-extrabold text-[#0f2847] dark:text-slate-100">Paket Bazlı Bütüncül Rapor</h3>
                        <p className="text-[12px] text-amber-800 dark:text-amber-300 mt-0.5">
                          Excel'deki 5 paketten birini seç → 3 versiyon (öğretmen/veli/öğrenci) otomatik üretilir.
                        </p>
                        <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1 flex items-center gap-1.5">
                          <Lock className="w-3 h-3" />
                          KVKK m.6: Genetik PDF sadece öğretmen versiyonunda gömülür. Veli ve öğrenci versiyonlarında ham veri yer almaz.
                        </p>
                      </div>
                    </div>
                    <div style={{ paddingLeft: '52px' }}>
                      <button
                        onClick={() => setPackageModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[13px] font-bold shadow-md hover:shadow-lg transition-all"
                      >
                        <Package className="w-4 h-4" />
                        Paket Raporu Oluştur
                      </button>
                    </div>
                  </div>

                  {/* HARMANLANMIŞ (BÜTÜNCÜL) RAPOR — ÇOKLU SEÇİM DESTEKLİ */}
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-5 shadow-sm mb-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md shrink-0">
                        <Brain className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-[15px] font-extrabold text-[#0f2847] dark:text-slate-100">Harmanlanmış (Bütüncül) Rapor</h3>
                        <p className="text-[12px] text-purple-700 mt-0.5">Seçtiğiniz testleri birleştiren bütüncül analiz. İstediğiniz test kombinasyonu için ayrı rapor üretebilirsiniz.</p>
                      </div>
                    </div>

                    {/* Accordion Toggle */}
                    <div style={{ paddingLeft: '52px' }}>
                      <button
                        onClick={() => setHolisticExpanded(v => !v)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 text-purple-700 text-[12px] font-bold border border-purple-300 hover:bg-purple-50 transition-all"
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
                      <div className="mt-3 bg-white dark:bg-slate-800 rounded-xl border border-purple-200 p-4" style={{ marginLeft: '52px' }}>
                        <div className="flex items-center justify-between mb-3 pb-3 border-b border-purple-100">
                          <div className="text-[12px] font-bold text-[#0f2847] dark:text-slate-100">
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
                              className="text-[11px] font-semibold text-gray-600 dark:text-slate-300 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-50 dark:bg-slate-800/60 transition"
                            >
                              Temizle
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                          {completed.map(ct => {
                            const isSelected = holisticSelected.has(ct.id);
                            const totalAttempts = attemptInfo.totalFor(ct.test_type);
                            const attemptNo = attemptInfo.numberFor(ct.id);
                            const showAttempt = totalAttempts > 1;
                            const attemptDate = ct.completed_at
                              ? new Date(ct.completed_at).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })
                              : '';
                            return (
                              <button
                                key={ct.id}
                                onClick={() => toggleHolisticTest(ct.id)}
                                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left transition-all ${
                                  isSelected
                                    ? 'bg-purple-50 border-purple-400 text-purple-900 shadow-sm'
                                    : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:border-purple-300 hover:bg-purple-50/50'
                                }`}
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 text-purple-600 shrink-0" />
                                ) : (
                                  <Square className="w-4 h-4 text-gray-400 dark:text-slate-500 shrink-0" />
                                )}
                                <span className="text-[12px] font-semibold flex-1 truncate">
                                  {labelOf(ct.test_type)}
                                  {showAttempt && (
                                    <span className="ml-1.5 text-[10px] font-bold text-purple-600">
                                      #{attemptNo} ({attemptDate})
                                    </span>
                                  )}
                                </span>
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
                    {holisticHistory.length === 0 ? (
                      <div className="mt-3 bg-white/70 dark:bg-slate-800/60 rounded-xl border-2 border-dashed border-purple-200 dark:border-slate-700 p-4 text-center" style={{ marginLeft: '52px' }}>
                        <FileText className="w-7 h-7 text-purple-300 dark:text-slate-500 mx-auto mb-1.5" />
                        <p className="text-[13px] font-extrabold text-purple-700 dark:text-slate-200">
                          Hiç harmanlanmış rapor üretilmedi
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1">
                          Yukarıdan test seçerek ilk harmanlanmış raporu üretebilirsiniz.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-3" style={{ marginLeft: '52px' }}>
                        <button
                          onClick={() => setHolisticHistoryOpen(v => !v)}
                          className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-purple-200 hover:bg-purple-50 transition"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-purple-600" />
                            <span className="text-[12px] font-bold text-[#0f2847] dark:text-slate-100">
                              Üretilmiş Harmanlanmış Raporlar
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
                              <div key={hr.id} className="bg-white dark:bg-slate-800 rounded-xl border border-purple-200 p-3 hover:shadow-sm transition">
                                <div className="flex items-start justify-between gap-3 flex-wrap">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                      <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 text-[10px] font-bold">
                                        #{holisticHistory.length - idx}
                                      </span>
                                      <span className="text-[12px] font-semibold text-[#0f2847] dark:text-slate-100">
                                        {formatDate(hr.generated_at)}
                                      </span>
                                      <span className="text-[11px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded">
                                        {hr.test_count} test harmanlandı
                                      </span>
                                    </div>
                                    <div className="text-[10.5px] text-gray-500 dark:text-slate-400 font-semibold mb-1">
                                      Harmanlanan testler:
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {hr.selected_test_types.map(t => (
                                        <span key={t} className="px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700/40 text-purple-700 dark:text-purple-300 text-[10px] font-semibold">
                                          {labelOf(t)}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    <button
                                      onClick={() => setViewer({
                                        title: `${student.full_name} — Harmanlanmış Rapor (${formatDate(hr.generated_at)})`,
                                        text: hr.text,
                                      })}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-purple-700 text-[11px] font-bold border border-purple-300 hover:bg-purple-50 transition"
                                    >
                                      <Eye className="w-3 h-3" /> Görüntüle
                                    </button>
                                    <a
                                      href={`/api/export/holistic/pdf?id=${encodeURIComponent(hr.id)}`}
                                      target="_blank"
                                      rel="noopener"
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-rose-700 text-[11px] font-bold border border-rose-200 hover:bg-rose-50 transition"
                                      title="PDF olarak indir"
                                    >
                                      <Download className="w-3 h-3" /> PDF
                                    </a>
                                    <a
                                      href={`/api/export/holistic/docx?id=${encodeURIComponent(hr.id)}`}
                                      target="_blank"
                                      rel="noopener"
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-sky-700 text-[11px] font-bold border border-sky-200 hover:bg-sky-50 transition"
                                      title="Word (DOCX) olarak indir"
                                    >
                                      <Download className="w-3 h-3" /> DOCX
                                    </a>
                                    <button
                                      onClick={() => deleteHolistic(hr.id)}
                                      disabled={busyKey === 'holistic-delete-' + hr.id}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-red-600 text-[11px] font-bold border border-red-200 hover:bg-red-50 disabled:opacity-60 transition"
                                    >
                                      {busyKey === 'holistic-delete-' + hr.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                    </button>
                                  </div>
                                </div>

                                {/* Faz 6: Genetik Ek'ler toggle */}
                                <div className="mt-2 pt-2 border-t border-purple-100 dark:border-purple-900/30">
                                  <button
                                    onClick={() => {
                                      setAttachExpandedFor((prev) => {
                                        const next = new Set(prev);
                                        if (next.has(hr.id)) next.delete(hr.id);
                                        else next.add(hr.id);
                                        return next;
                                      });
                                    }}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 text-[11px] font-bold hover:bg-violet-100 transition border border-violet-200"
                                    aria-expanded={attachExpandedFor.has(hr.id)}
                                  >
                                    <Paperclip className="w-3 h-3" />
                                    {attachExpandedFor.has(hr.id) ? 'Genetik Ek\'leri Gizle' : 'Genetik PDF Ek\'le (Sürükle-Bırak)'}
                                    {attachExpandedFor.has(hr.id) ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                  </button>

                                  {attachExpandedFor.has(hr.id) && (
                                    <HolisticAttachmentsPanel
                                      holisticReportId={hr.id}
                                      studentId={student.id}
                                    />
                                  )}
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
                        <h3 className="text-[15px] font-extrabold text-[#0f2847] dark:text-slate-100">Entegre 3&apos;lü Rapor</h3>
                        <p className="text-[12px] text-rose-700 mt-0.5">Seçtiğin testlerden Öğretmen + Öğrenci + Veli için 3 ayrı rapor üretilir. Her üretim geçmişte saklanır.</p>
                      </div>
                    </div>

                    {/* ═══ 3 PERSPEKTİF MİNİ KARTLARI (Her zaman görünür) ═══ */}
                    <div className="mb-3 grid grid-cols-1 sm:grid-cols-3 gap-1.5" style={{ marginLeft: '52px' }}>
                      <div className="bg-sky-50 border border-sky-200 rounded-lg px-2.5 py-1.5">
                        <p className="text-[10px] font-extrabold text-sky-700 uppercase">👨‍🏫 Öğretmen</p>
                        <p className="text-[10.5px] text-sky-900">Sınıfta gözlem + yaklaşım stratejileri</p>
                      </div>
                      <div className="bg-violet-50 border border-violet-200 rounded-lg px-2.5 py-1.5">
                        <p className="text-[10px] font-extrabold text-violet-700 uppercase">🎓 Öğrenci</p>
                        <p className="text-[10.5px] text-violet-900">Kişisel farkındalık + öz-gelişim</p>
                      </div>
                      <div className="bg-pink-50 border border-pink-200 rounded-lg px-2.5 py-1.5">
                        <p className="text-[10px] font-extrabold text-pink-700 uppercase">👨‍👩‍👧 Veli</p>
                        <p className="text-[10.5px] text-pink-900">Ev desteği + iletişim önerileri</p>
                      </div>
                    </div>

                    {/* ═══ YENİ RAPOR ÜRETME BUTONU ═══ */}
                    <div style={{ paddingLeft: '52px' }}>
                      <button
                        onClick={() => setIntegratedModalOpen(true)}
                        disabled={completed.length < 2}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-rose-500 to-pink-600 text-white text-[12px] font-bold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        {integratedHistory.length === 0 ? '3\'lü Rapor Üret' : 'Yeni 3\'lü Rapor Üret'}
                      </button>
                      {completed.length < 2 && (
                        <p className="text-[11px] text-amber-700 mt-1.5 italic">
                          ⚠️ En az 2 test tamamlanmalı.
                        </p>
                      )}
                    </div>

                    {/* ═══ GEÇMİŞ RAPORLAR LİSTESİ ═══ */}
                    {integratedHistory.length === 0 ? (
                      <div className="mt-3 bg-white/70 dark:bg-slate-800/60 rounded-xl border-2 border-dashed border-rose-200 dark:border-slate-700 p-4 text-center" style={{ marginLeft: '52px' }}>
                        <FileText className="w-7 h-7 text-rose-300 dark:text-slate-500 mx-auto mb-1.5" />
                        <p className="text-[13px] font-extrabold text-rose-700 dark:text-slate-200">
                          Hiç entegre rapor üretilmedi
                        </p>
                        <p className="text-[11px] text-rose-500 dark:text-slate-400 mt-0.5">
                          Yukarıdaki butonla ilk raporunu üret.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-3" style={{ marginLeft: '52px' }}>
                        <button
                          onClick={() => setIntegratedHistoryOpen(v => !v)}
                          className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-rose-200 hover:bg-rose-50 transition"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-rose-600" />
                            <span className="text-[12px] font-bold text-[#0f2847] dark:text-slate-100">
                              Üretilmiş Entegre Raporlar
                            </span>
                            <span className="px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
                              {integratedHistory.length}
                            </span>
                          </div>
                          {integratedHistoryOpen ? <ChevronUp className="w-4 h-4 text-rose-600" /> : <ChevronDown className="w-4 h-4 text-rose-600" />}
                        </button>

                        {integratedHistoryOpen && (
                          <div className="mt-2 space-y-2">
                            {integratedHistory.map((ihr, idx) => (
                              <div key={ihr.id} className="bg-white dark:bg-slate-800 rounded-xl border border-rose-200 p-3 hover:shadow-sm transition">
                                <div className="flex items-start justify-between gap-3 flex-wrap">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                      <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 text-[10px] font-bold">
                                        #{integratedHistory.length - idx}
                                      </span>
                                      <span className="text-[12px] font-semibold text-[#0f2847] dark:text-slate-100">
                                        {ihr.generated_at ? formatDate(ihr.generated_at) : '—'}
                                      </span>
                                      {ihr.test_count && (
                                        <span className="text-[11px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-900/30 px-2 py-0.5 rounded">
                                          {ihr.test_count} test
                                        </span>
                                      )}
                                    </div>
                                    {ihr.source_test_types && ihr.source_test_types.length > 0 ? (
                                      <>
                                        <div className="text-[10.5px] text-gray-500 dark:text-slate-400 font-semibold mb-1">
                                          Kullanılan testler:
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                          {ihr.source_test_types.map(t => (
                                            <span key={t} className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700/40 text-rose-700 dark:text-rose-300 text-[10px] font-semibold">
                                              {labelOf(t)}
                                            </span>
                                          ))}
                                        </div>
                                      </>
                                    ) : (
                                      <p className="text-[10.5px] text-amber-700 italic">
                                        Eski kayıt — test bilgileri saklanmamış
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    <button
                                      onClick={() => setViewer({
                                        title: `${student.full_name} — Öğretmen Raporu (${ihr.generated_at ? formatDate(ihr.generated_at) : ''})`,
                                        text: ihr.teacher_report || '',
                                        pdfUrl: `/api/export/integrated?student_id=${studentId}&id=${ihr.id}&format=pdf`,
                                        docxUrl: `/api/export/integrated?student_id=${studentId}&id=${ihr.id}&format=docx`,
                                      })}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-sky-700 text-[11px] font-bold border border-sky-300 hover:bg-sky-50 transition"
                                    >
                                      <Eye className="w-3 h-3" /> Öğretmen
                                    </button>
                                    <button
                                      onClick={() => setViewer({
                                        title: `${student.full_name} — Öğrenci Raporu (${ihr.generated_at ? formatDate(ihr.generated_at) : ''})`,
                                        text: ihr.student_report || '',
                                      })}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-violet-700 text-[11px] font-bold border border-violet-300 hover:bg-violet-50 transition"
                                    >
                                      <Eye className="w-3 h-3" /> Öğrenci
                                    </button>
                                    <button
                                      onClick={() => setViewer({
                                        title: `${student.full_name} — Veli Raporu (${ihr.generated_at ? formatDate(ihr.generated_at) : ''})`,
                                        text: ihr.parent_report || '',
                                      })}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-pink-700 text-[11px] font-bold border border-pink-300 hover:bg-pink-50 transition"
                                    >
                                      <Eye className="w-3 h-3" /> Veli
                                    </button>
                                    <a
                                      href={`/api/export/integrated?student_id=${studentId}&id=${ihr.id}&format=pdf`}
                                      target="_blank"
                                      rel="noopener"
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 text-[11px] font-bold border border-red-200 hover:bg-red-100 transition"
                                    >
                                      <Download className="w-3 h-3" /> PDF
                                    </a>
                                    <a
                                      href={`/api/export/integrated?student_id=${studentId}&id=${ihr.id}&format=docx`}
                                      target="_blank"
                                      rel="noopener"
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-200 hover:bg-blue-100 transition"
                                    >
                                      <Download className="w-3 h-3" /> DOCX
                                    </a>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>



                </>
              )}

              {completed.length === 1 && (
                <div className="bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-2xl p-4 text-center mt-2">
                  <p className="text-[12px] text-gray-500 dark:text-slate-400">
                    💡 Harmanlanmış ve 3&apos;lü Entegre Rapor üretmek için en az <strong>2 tamamlanmış test</strong> gerekir.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* FAZ 9: PAKET SEÇİM MODALI */}
      {packageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal başlık */}
            <div className="px-5 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold">Paket Seç</h3>
                  <p className="text-[11px] text-amber-100">3 versiyon otomatik üretilir (öğretmen/veli/öğrenci)</p>
                </div>
              </div>
              <button
                onClick={() => { setPackageModalOpen(false); setSelectedPackage(null); }}
                className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition"
                disabled={packageGenerating}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Paket listesi */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {PACKAGE_LIST.map((pkg) => {
                const completedTypes = completed.map((c) => c.test_type);
                const completion = checkPackageCompletion(pkg.id, completedTypes);
                const isSelected = selectedPackage === pkg.id;
                const isComplete = completion.complete;

                return (
                  <button
                    key={pkg.id}
                    onClick={() => isComplete && setSelectedPackage(pkg.id)}
                    disabled={!isComplete || packageGenerating}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 shadow-md'
                        : isComplete
                        ? 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-amber-300 hover:bg-amber-50/50'
                        : 'border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/40 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-extrabold text-[#0f2847] dark:text-slate-100">
                          {pkg.label}
                        </span>
                        {pkg.uses_genetic && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                            Genetik
                          </span>
                        )}
                      </div>
                      {isComplete ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-gray-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[12px] text-gray-600 dark:text-slate-400 mb-2">
                      {pkg.description}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-slate-500 mb-2">
                      <strong>Hedef:</strong> {pkg.audience_focus}
                    </p>
                    {isComplete ? (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                        ✓ {completion.covered.length} testin tamamı hazır
                      </p>
                    ) : (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400">
                        ⚠ Eksik: {completion.missing.map((t) => TEST_LABELS[t] || t).join(', ')}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Modal footer */}
            <div className="px-5 py-3 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-200 dark:border-slate-700 flex items-center justify-end gap-2">
              <button
                onClick={() => { setPackageModalOpen(false); setSelectedPackage(null); }}
                disabled={packageGenerating}
                className="px-4 py-2 rounded-lg bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-300 text-[13px] font-bold border border-gray-200 dark:border-slate-600 hover:bg-gray-50 disabled:opacity-50"
              >
                İptal
              </button>
              <button
                onClick={generatePackageReport}
                disabled={!selectedPackage || packageGenerating}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[13px] font-bold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {packageGenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    3 Versiyon Üretiliyor (60-120 sn)...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Üret
                  </>
                )}
              </button>
            </div>
          </div>
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
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full"
          >
            <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-700/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md shrink-0">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-[16px] font-extrabold text-[#0f2847] dark:text-slate-100">Yeni Harmanlanmış Rapor Üretilecek</h3>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              <p className="text-[13px] text-gray-700 dark:text-slate-300 leading-relaxed">
                Seçtiğiniz <strong className="text-purple-700">{holisticSelected.size} test</strong> için yeni bir harmanlanmış rapor üretilecek.
                Daha önce üretilmiş harmanlanmış raporlar <strong>silinmez</strong>, bu yeni bir kayıt olarak eklenir ve geçmiş listede görüntülenir.
              </p>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="text-[11px] font-bold text-purple-700 mb-2">SEÇİLİ TESTLER:</div>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(holisticSelected).map(t => (
                    <span key={t} className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-purple-300 text-purple-800 text-[11px] font-semibold">
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
                <p className="text-[11px] text-gray-500 dark:text-slate-400 italic">
                  Şu an bu öğrenci için <strong>{holisticHistory.length}</strong> harmanlanmış rapor mevcut. Yeni üretim ile {holisticHistory.length + 1}&apos;e çıkacak.
                </p>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-700/60 flex items-center justify-end gap-2">
              <button
                onClick={() => setHolisticConfirmOpen(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-700/60 text-gray-700 dark:text-slate-300 text-[12px] font-bold hover:bg-gray-200 transition-all"
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
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700/60 shrink-0">
              <h3 className="text-[16px] font-extrabold text-[#0f2847] dark:text-slate-100">{viewer.title}</h3>
              <button onClick={() => setViewer(null)} className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:text-slate-300 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 bg-gradient-to-b from-white via-violet-50/20 to-sky-50/20">
              <ReportRenderer text={viewer.text || ''} />
            </div>

            {(viewer.pdfUrl || viewer.docxUrl) && (
              <div className="flex items-center gap-2 px-6 py-3 border-t border-gray-100 dark:border-slate-700/60 shrink-0">
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
                <button onClick={() => setViewer(null)} className="ml-auto px-3 py-2 rounded-lg bg-gray-100 dark:bg-slate-700/60 text-gray-600 dark:text-slate-300 text-[12px] font-bold hover:bg-gray-200 transition-all">
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
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-xl w-full max-h-[85vh] flex flex-col"
          >
            <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-700/60 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center shadow-md shrink-0">
                  <ArrowRightLeft className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-[16px] font-extrabold text-[#0f2847] dark:text-slate-100">Öğrenciyi Aktar</h3>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400">{student.full_name} için hedef öğretmen seçin</p>
                </div>
              </div>
              <button
                onClick={() => !transferring && setTransferModalOpen(false)}
                className="text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:text-slate-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Arama kutusu */}
            <div className="px-6 py-3 border-b border-gray-100 dark:border-slate-700/60 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
                <input
                  type="text"
                  value={transferSearch}
                  onChange={(e) => setTransferSearch(e.target.value)}
                  placeholder="Öğretmen ara (isim, branş, okul)..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 text-[13px] focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all"
                />
              </div>
            </div>

            {/* Liste */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {transferLoading ? (
                <div className="flex items-center justify-center py-12 text-gray-400 dark:text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Öğretmenler yükleniyor...
                </div>
              ) : filteredTransferTeachers.length === 0 ? (
                <div className="text-center py-12 text-gray-400 dark:text-slate-500 text-[13px]">
                  {transferSearch ? 'Aramanıza uygun öğretmen bulunamadı.' : 'Aktarım yapılabilecek başka onaylı öğretmen yok.'}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTransferTeachers.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => confirmTransfer({ id: t.id, full_name: t.full_name })}
                      className="w-full text-left bg-white dark:bg-slate-800 hover:bg-sky-50 border border-gray-200 dark:border-slate-700 hover:border-sky-300 rounded-xl p-3 transition-all flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-100 to-cyan-100 flex items-center justify-center shrink-0">
                        <UserPlus className="w-5 h-5 text-sky-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-[#0f2847] dark:text-slate-100 truncate">{t.full_name}</p>
                        <p className="text-[11px] text-gray-500 dark:text-slate-400 truncate">
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

            <div className="px-6 py-3 border-t border-gray-100 dark:border-slate-700/60 shrink-0">
              <p className="text-[11px] text-gray-500 dark:text-slate-400 text-center">
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
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full"
          >
            <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-700/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md shrink-0">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-[16px] font-extrabold text-[#0f2847] dark:text-slate-100">Aktarımı Onayla</h3>
              </div>
            </div>

            <div className="px-6 py-5 space-y-3">
              <p className="text-[13px] text-gray-700 dark:text-slate-300 leading-relaxed">
                <strong className="text-[#0f2847] dark:text-slate-100">{student.full_name}</strong> adlı öğrenciyi{' '}
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

            <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-700/60 flex items-center justify-end gap-2">
              <button
                onClick={() => !transferring && setTransferConfirmOpen(false)}
                disabled={transferring}
                className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-700/60 text-gray-700 dark:text-slate-300 text-[12px] font-bold hover:bg-gray-200 disabled:opacity-60 transition-all"
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

      {/* ═══ ENTEGRE 3'LÜ RAPOR — TEST SEÇİM MODALI ═══ */}
      {integratedModalOpen && (
        <div
          onClick={() => setIntegratedModalOpen(false)}
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700/60 bg-gradient-to-r from-rose-500 to-pink-600 text-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-[17px] font-extrabold">Yeni Entegre 3&apos;lü Rapor</h3>
                  <p className="text-rose-100 text-[12px] mt-0.5">
                    Hangi testler baz alınarak 3&apos;lü rapor üretilsin? <strong>En az 2 test</strong> seçmelisin.
                  </p>
                </div>
                <button
                  onClick={() => setIntegratedModalOpen(false)}
                  className="w-9 h-9 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition shrink-0"
                  aria-label="Kapat"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-3 flex items-center gap-3 text-[12px]">
                <span className="bg-white/15 px-2.5 py-1 rounded-full font-bold">
                  {integratedSelected.size} / {completed.length} seçili
                </span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setIntegratedSelected(new Set(completed.map(c => c.id)))}
                    className="px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded text-[11px] font-bold transition"
                  >
                    Tümünü Seç
                  </button>
                  <button
                    onClick={() => setIntegratedSelected(new Set())}
                    className="px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded text-[11px] font-bold transition"
                  >
                    Temizle
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Body — Test Liste */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {completed.map(ct => {
                  const isSelected = integratedSelected.has(ct.id);
                  const totalAttempts = attemptInfo.totalFor(ct.test_type);
                  const attemptNo = attemptInfo.numberFor(ct.id);
                  const showAttempt = totalAttempts > 1;
                  const attemptDate = ct.completed_at
                    ? new Date(ct.completed_at).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })
                    : '';
                  return (
                    <button
                      key={ct.id}
                      onClick={() => {
                        const next = new Set(integratedSelected);
                        if (next.has(ct.id)) next.delete(ct.id);
                        else next.add(ct.id);
                        setIntegratedSelected(next);
                      }}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left transition-all ${
                        isSelected
                          ? 'bg-rose-50 border-rose-400 text-rose-900 shadow-sm'
                          : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:border-rose-300 hover:bg-rose-50/50'
                      }`}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-rose-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400 dark:text-slate-500 shrink-0" />
                      )}
                      <span className="text-[12.5px] font-semibold flex-1 truncate">
                        {labelOf(ct.test_type)}
                        {showAttempt && (
                          <span className="ml-1.5 text-[10px] font-bold text-rose-600">
                            #{attemptNo} ({attemptDate})
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>

              {completed.length === 0 && (
                <div className="text-center py-10 text-gray-500 dark:text-slate-400">
                  <FileText className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-[13px]">Hiç tamamlanmış test yok.</p>
                </div>
              )}
            </div>

            {/* Modal Footer — Üret Butonu */}
            <div className="px-5 py-4 border-t border-gray-100 dark:border-slate-700/60 bg-gray-50 dark:bg-slate-800/60">
              {integratedSelected.size < 2 ? (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-amber-800">
                    3&apos;lü rapor için en az <strong>2 test</strong> seçmelisin. Şu anda {integratedSelected.size} seçili.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => setIntegratedModalOpen(false)}
                    disabled={busyKey === 'integrated'}
                    className="px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 text-[13px] font-bold hover:bg-gray-50 transition disabled:opacity-60"
                  >
                    Vazgeç
                  </button>
                  <button
                    onClick={() => generateIntegrated(true)}
                    disabled={busyKey === 'integrated'}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-gradient-to-r from-rose-500 to-pink-600 text-white text-[13px] font-bold shadow-md hover:shadow-lg disabled:opacity-60 transition-all"
                  >
                    {busyKey === 'integrated' ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Üretiliyor (1-3 dakika sürebilir)...</>
                    ) : (
                      <><Sparkles className="w-4 h-4" /> Seçili {integratedSelected.size} Testle 3&apos;lü Rapor Üret</>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ TEST CEVAPLARI GÖRÜNTÜLEYİCİ ═══ */}
      {answersViewer && (
        <TestAnswersViewer
          studentId={studentId}
          resultId={answersViewer.resultId}
          onClose={() => setAnswersViewer(null)}
          onDeleted={() => {
            setAnswersViewer(null);
            loadDetail(); // Test listesini yenile
          }}
        />
      )}
    </div>
  );
}
