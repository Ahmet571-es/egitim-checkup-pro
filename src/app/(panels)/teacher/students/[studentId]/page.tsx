'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { secureFetch } from '@/lib/csrf-client';
import {
  ArrowLeft, GraduationCap, CheckCircle2, Circle, Bell, AlertCircle,
  FileText, BookOpen, X, Send, Loader2, Sparkles, Eye, Download, RefreshCw,
  Brain, Layers
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

type ViewerMode = null | {
  title: string;
  text: string;
  pdfUrl?: string;
  docxUrl?: string;
};

export default function StudentDetailPage() {
  const params = useParams();
  const studentId = params.studentId as string;

  const [tab, setTab] = useState<'done' | 'pending'>('pending');
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [completed, setCompleted] = useState<CompletedTest[]>([]);
  const [pending, setPending] = useState<string[]>([]);
  const [activeAssignments, setActiveAssignments] = useState<string[]>([]);
  const [holistic, setHolistic] = useState<HolisticReport | null>(null);
  const [integrated, setIntegrated] = useState<IntegratedReport | null>(null);

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
      setIntegrated(data.integratedReport || null);
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

  // ═══ Bütüncül (Harmanlanmış) rapor üret ═══
  const generateHolistic = async () => {
    setBusyKey('holistic');
    setError('');
    setSuccess('');
    try {
      const res = await secureFetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, report_type: 'holistic' }),
      });
      const data = await res.json();
      if (data.success && data.report) {
        setSuccess('✅ Harmanlanmış rapor üretildi.');
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

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

  if (loading) {
    return <div className="text-center py-20 text-gray-400">Yükleniyor...</div>;
  }

  if (!student) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Öğrenci bulunamadı.</p>
        <Link href="/teacher/students" className="text-sky-600 text-sm font-semibold mt-2 inline-block">← Listeye dön</Link>
      </div>
    );
  }

  const integratedExists = !!(integrated?.teacher_report && integrated?.student_report && integrated?.parent_report);

  return (
    <div className="pb-8">
      <Link href="/teacher/students" className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-[#0f2847] mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Öğrencilere dön
      </Link>

      {/* Öğrenci Kartı */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-6 shadow-sm mb-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shrink-0">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-extrabold text-[#0f2847]">{student.full_name}</h2>
            <p className="text-sm text-gray-400">
              {student.school_name}{student.grade && ` · ${student.grade}. Sınıf`}
            </p>
          </div>
        </div>
      </div>

      {/* ATANAN TESTLER UYARISI */}
      {activeAssignments.length > 0 && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-5 mb-4 shadow-sm">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-md shrink-0">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-[15px] font-extrabold text-[#0f2847]">
                Öğrencinin çözmesi gereken {activeAssignments.length === 1 ? 'test' : 'testler'}:
              </h3>
              <p className="text-[12px] text-amber-700 mt-0.5">
                Öğrenci tamamladığında bu uyarı otomatik kaybolacak.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2" style={{ paddingLeft: '52px' }}>
            {activeAssignments.map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5 bg-white border border-amber-300 text-amber-800 text-[12px] font-semibold px-3 py-1.5 rounded-full shadow-sm">
                {labelOf(t)}
                <button onClick={() => handleUnassign(t)} disabled={saving} className="hover:bg-amber-100 rounded-full p-0.5 transition-colors" aria-label="Atamayı kaldır">
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
                  return (
                    <div key={c.id} className="px-4 py-3.5 border-b border-gray-50 last:border-b-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${c.has_report ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                          <CheckCircle2 className={`w-4 h-4 ${c.has_report ? 'text-emerald-600' : 'text-gray-400'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-semibold text-[#0f2847] truncate">{labelOf(c.test_type)}</p>
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
                  {/* HARMANLANMIŞ (BÜTÜNCÜL) RAPOR */}
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-5 shadow-sm mb-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md shrink-0">
                        <Brain className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-[15px] font-extrabold text-[#0f2847]">Harmanlanmış (Bütüncül) Rapor</h3>
                        <p className="text-[12px] text-purple-700 mt-0.5">Tüm testleri birleştiren bütüncül analiz.</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2" style={{ paddingLeft: '52px' }}>
                      {!holistic ? (
                        <button
                          onClick={generateHolistic}
                          disabled={busyKey === 'holistic'}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-[12px] font-bold shadow-md hover:shadow-lg disabled:opacity-60 transition-all"
                        >
                          {busyKey === 'holistic' ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Üretiliyor...</> : <><Sparkles className="w-3.5 h-3.5" /> Harmanlanmış Rapor Üret</>}
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => setViewer({
                              title: `${student.full_name} — Harmanlanmış Rapor`,
                              text: holistic.text,
                            })}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white text-purple-700 text-[12px] font-bold border border-purple-300 hover:bg-purple-50 transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" /> Görüntüle
                          </button>
                          <button
                            onClick={generateHolistic}
                            disabled={busyKey === 'holistic'}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white text-gray-600 text-[12px] font-bold border border-gray-300 hover:bg-gray-50 disabled:opacity-60 transition-all"
                          >
                            {busyKey === 'holistic' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Yenile
                          </button>
                          <span className="text-[11px] text-purple-600 self-center">Üretildi: {formatDate(holistic.generated_at)}</span>
                        </>
                      )}
                    </div>
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

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-700 leading-relaxed">
                {viewer.text || 'Rapor içeriği boş.'}
              </div>
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
    </div>
  );
}
