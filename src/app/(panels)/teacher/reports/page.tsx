'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { secureFetch } from '@/lib/csrf-client';
import ReportRenderer from '@/components/ReportRenderer';
import IntegratedReportRenderer from '@/components/IntegratedReportRenderer';
import {
  Users, FileText, Brain, BarChart2,
  Download, RefreshCw, ChevronDown, CheckCircle,
  AlertCircle, Clock, Eye, BookOpen, Layers
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

interface Student {
  id: string;
  full_name: string;
}

interface ClassInfo {
  id: string;
  name: string;
  grade: number | null;
}

interface TestResult {
  id: string;
  test_type: string;
  scores: Record<string, unknown>;
  completed_at: string | null;
  ai_report: string | null;
  ai_report_generated_at: string | null;
}

interface IntegratedReport {
  teacher_report: string | null;
  student_report: string | null;
  parent_report: string | null;
  generated_at: string | null;
}

const TEST_LABELS: Record<string, string> = {
  enneagram: 'Enneagram Kişilik',
  vark: 'VARK Öğrenme Stilleri',
  holland: 'Holland RIASEC',
  'coklu-zeka': 'Çoklu Zekâ',
  'sinav-kaygisi': 'Sınav Kaygısı',
  'calisma-davranisi': 'Çalışma Davranışı',
  'akademik-analiz': 'Akademik Analiz',
  'hizli-okuma': 'Hızlı Okuma',
  'd2-dikkat': 'D2 Dikkat',
  'sag-sol-beyin': 'Sağ-Sol Beyin',
};

function getTestLabel(type: string): string {
  return TEST_LABELS[type] ?? type;
}

export default function TeacherReportsPage() {
  const supabase = useMemo(() => createClient(), []);

  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [myStudentIds, setMyStudentIds] = useState<string[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [integratedReport, setIntegratedReport] = useState<IntegratedReport | null>(null);
  const [holisticReport, setHolisticReport] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tekil' | 'butuncel' | 'entegre'>('tekil');
  const [activeIntegratedTab, setActiveIntegratedTab] = useState<'ogretmen' | 'ogrenci' | 'ebeveyn'>('ogretmen');
  const [viewingReport, setViewingReport] = useState<{ text: string; title: string; scores?: Record<string, unknown>; testType?: string; integratedType?: 'ogretmen' | 'ogrenci' | 'ebeveyn' } | null>(null);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Öğretmenin kimliğini al + sadece kendi sınıflarını ve öğrencilerini yükle
  useEffect(() => {
    async function initTeacherScope() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setTeacherId(user.id);

      // Sadece bu öğretmene ait sınıflar
      const { data: myClasses } = await supabase
        .from('classes')
        .select('id, name, grade')
        .eq('teacher_id', user.id)
        .order('name');
      setClasses(myClasses ?? []);

      // Bu sınıflardaki öğrenci ID'leri
      const classIds = (myClasses ?? []).map(c => c.id);
      if (classIds.length === 0) {
        setMyStudentIds([]);
        return;
      }

      const { data: csRows } = await supabase
        .from('class_students')
        .select('student_id')
        .in('class_id', classIds);
      const ids = [...new Set((csRows ?? []).map(r => r.student_id))];
      setMyStudentIds(ids);
    }
    initTeacherScope();
  }, [supabase]);

  // Öğrencileri yükle — sadece öğretmenin kendi öğrencileri
  useEffect(() => {
    async function loadStudents() {
      if (!teacherId) return;
      setLoading(true);
      setSelectedStudent(null);
      setTestResults([]);
      setIntegratedReport(null);

      if (selectedClass === 'all') {
        // Öğretmenin tüm sınıflarındaki öğrenciler
        if (myStudentIds.length === 0) {
          setStudents([]);
          setLoading(false);
          return;
        }
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', myStudentIds)
          .order('full_name');
        setStudents(data ?? []);
      } else {
        // Seçili sınıftaki öğrenciler
        const { data } = await supabase
          .from('class_students')
          .select('student_id, profiles!class_students_student_id_fkey(id, full_name)')
          .eq('class_id', selectedClass);

        const mapped = (data ?? [])
          .map(d => d.profiles as unknown as Student)
          .filter(Boolean);
        setStudents(mapped);
      }
      setLoading(false);
    }
    loadStudents();
  }, [selectedClass, teacherId, myStudentIds, supabase]);

  // Öğrenci seçildiğinde test sonuçlarını yükle
  const loadStudentData = useCallback(async (student: Student) => {
    setSelectedStudent(student);
    setTestResults([]);
    setIntegratedReport(null);
    setHolisticReport(null);
    setLoading(true);

    const { data: results } = await supabase
      .from('test_results')
      .select('id, test_type, scores, completed_at, ai_report, ai_report_generated_at')
      .eq('student_id', student.id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false });

    setTestResults(results ?? []);

    // Bütüncül rapor: holistic_reports tablosundan kontrol (tablo yoksa hata yutulur)
    try {
      const { data: hr } = await supabase
        .from('holistic_reports')
        .select('report_text, generated_at')
        .eq('student_id', student.id)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (hr?.report_text) {
        setHolisticReport(hr.report_text);
      }
    } catch {
      // Tablo yoksa sessizce geç
    }

    // Entegre raporu kontrol et
    const { data: ir } = await supabase
      .from('integrated_reports')
      .select('teacher_report, student_report, parent_report, generated_at')
      .eq('student_id', student.id)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    setIntegratedReport(ir);
    setLoading(false);
  }, [supabase]);

  // Tekil rapor üret
  async function generateReport(testResult: TestResult, force = false) {
    if (!selectedStudent) return;

    const key = testResult.id;
    setLoadingStates(prev => ({ ...prev, [key]: true }));
    setMessage(null);

    try {
      const method = force ? 'PUT' : 'POST';
      const res = await secureFetch('/api/reports/generate', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: selectedStudent.id,
          test_result_id: testResult.id,
        }),
      });
      const data = await res.json();

      if (data.already_generated && !force) {
        setMessage({ type: 'warning', text: data.message });
        // Raporu güncelle
        setTestResults(prev =>
          prev.map(t => t.id === testResult.id ? { ...t, ai_report: data.report } : t)
        );
      } else if (data.success) {
        setMessage({ type: 'success', text: '✅ Rapor başarıyla üretildi!' });
        setTestResults(prev =>
          prev.map(t =>
            t.id === testResult.id
              ? { ...t, ai_report: data.report, ai_report_generated_at: new Date().toISOString() }
              : t
          )
        );
      } else {
        setMessage({ type: 'error', text: data.error ?? 'Rapor üretilemedi.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Sunucu hatası.' });
    } finally {
      setLoadingStates(prev => ({ ...prev, [key]: false }));
    }
  }

  // Bütüncül rapor üret
  async function generateHolisticReport() {
    if (!selectedStudent) return;
    setLoadingStates(prev => ({ ...prev, holistic: true }));
    setMessage(null);

    try {
      const res = await secureFetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: selectedStudent.id,
          report_type: 'holistic',
        }),
      });
      const data = await res.json();
      if (data.success && data.report) {
        setHolisticReport(data.report);
        setMessage({ type: 'success', text: '✅ Bütüncül rapor üretildi!' });

        // Test sonuçlarını yenile (rapor sayacı güncellenir)
        const { data: freshResults } = await supabase
          .from('test_results')
          .select('id, test_type, scores, completed_at, ai_report, ai_report_generated_at')
          .eq('student_id', selectedStudent.id)
          .not('completed_at', 'is', null)
          .order('completed_at', { ascending: false });
        setTestResults(freshResults ?? []);
      } else {
        setMessage({ type: 'error', text: data.error ?? 'Rapor üretilemedi.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Sunucu hatası.' });
    } finally {
      setLoadingStates(prev => ({ ...prev, holistic: false }));
    }
  }

  // Entegre 3'lü rapor üret
  async function generateIntegratedReport(force = false) {
    if (!selectedStudent) return;
    setLoadingStates(prev => ({ ...prev, integrated: true }));
    setMessage(null);

    try {
      const method = force ? 'PUT' : 'POST';
      const res = await secureFetch('/api/reports/integrated', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: selectedStudent.id }),
      });
      const data = await res.json();

      if (data.already_generated && !force) {
        setMessage({ type: 'warning', text: data.message });
        setIntegratedReport({
          teacher_report: data.reports.ogretmen,
          student_report: data.reports.ogrenci,
          parent_report: data.reports.ebeveyn,
          generated_at: data.generated_at,
        });
      } else if (data.success) {
        setMessage({ type: 'success', text: '✅ 3\'lü entegre rapor üretildi!' });
        setIntegratedReport({
          teacher_report: data.reports.ogretmen,
          student_report: data.reports.ogrenci,
          parent_report: data.reports.ebeveyn,
          generated_at: new Date().toISOString(),
        });
      } else {
        setMessage({ type: 'error', text: data.error ?? 'Hata.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Sunucu hatası.' });
    } finally {
      setLoadingStates(prev => ({ ...prev, integrated: false }));
    }
  }

  // Export butonları
  function exportUrl(format: string, params: Record<string, string>) {
    const p = new URLSearchParams(params);
    return `/api/export/${format}?${p.toString()}`;
  }

  const tabs = [
    { key: 'tekil' as const, label: 'Tekil Raporlar', icon: <FileText size={16} /> },
    { key: 'butuncel' as const, label: 'Bütüncül Rapor', icon: <Brain size={16} /> },
    { key: 'entegre' as const, label: '📊 Entegre Rapor (3\'lü)', icon: <Layers size={16} /> },
  ];

  return (
    <div className="min-h-screen pb-10">
      <PageHeader
        role="teacher"
        icon={Brain}
        title="AI Analiz Raporları"
        subtitle="Öğrenci seçin, AI destekli psikometrik raporlar üretin ve dışa aktarın — PDF/Word"
      />

      {/* Filtreler */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Sınıf Filtresi */}
        <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 p-5 shadow-sm overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-600" />
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
              <Users className="w-3.5 h-3.5 text-white" />
            </div>
            <label className="text-[12px] font-extrabold text-[#0f2847] uppercase tracking-wider">
              Sınıf Filtresi
            </label>
          </div>
          <div className="relative">
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-[#0f2847] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 cursor-pointer transition-all"
            >
              <option value="all">Tüm Öğrenciler</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.grade ? `(${c.grade}. Sınıf)` : ''}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Öğrenci Seçimi */}
        <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 p-5 shadow-sm overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-sky-600" />
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-sky-600 flex items-center justify-center shadow-sm">
              <BookOpen className="w-3.5 h-3.5 text-white" />
            </div>
            <label className="text-[12px] font-extrabold text-[#0f2847] uppercase tracking-wider">
              Öğrenci Seçimi
            </label>
          </div>
          <div className="relative">
            <select
              value={selectedStudent?.id ?? ''}
              onChange={e => {
                const s = students.find(st => st.id === e.target.value);
                if (s) loadStudentData(s);
              }}
              className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-[#0f2847] focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 cursor-pointer transition-all disabled:opacity-60"
              disabled={loading}
            >
              <option value="">— Öğrenci Seçin —</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.full_name}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Mesaj */}
      {message && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
          message.type === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
          'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle size={16} /> :
           message.type === 'warning' ? <AlertCircle size={16} /> :
           <AlertCircle size={16} />}
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-auto text-xs opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Öğrenci Seçilmemişse */}
      {!selectedStudent && students.length === 0 && !loading && (
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-12 text-center shadow-sm">
          <p className="text-5xl mb-4">📭</p>
          <p className="text-gray-500 font-semibold">Henüz size atanmış öğrenci yok.</p>
          <p className="text-gray-400 text-sm mt-2 max-w-md mx-auto">
            Raporları görebilmek için önce sınıf oluşturulmalı ve öğrenciler sınıfınıza atanmalıdır.
            Okul yöneticinizle iletişime geçin.
          </p>
        </div>
      )}
      {!selectedStudent && students.length > 0 && (
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-12 text-center shadow-sm">
          <p className="text-5xl mb-4">👆</p>
          <p className="text-gray-500 font-semibold">Lütfen bir öğrenci seçin.</p>
          <p className="text-gray-400 text-sm mt-1">Öğrenci seçildikten sonra test sonuçları ve rapor üretim seçenekleri görünecek.</p>
        </div>
      )}

      {/* Öğrenci Seçildiğinde */}
      {selectedStudent && (
        <>
          {/* Öğrenci Bilgi Kartı */}
          <div className="relative bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 rounded-3xl p-6 mb-6 text-white shadow-xl shadow-emerald-500/30 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 rep-aurora-1" />
            <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-cyan-200/20 rounded-full blur-3xl rep-aurora-2" />
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
                backgroundSize: '32px 32px',
              }}
            />
            <div className="relative flex items-center justify-between flex-wrap gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <p className="text-white/80 text-[10.5px] font-extrabold uppercase tracking-wider">Seçili Öğrenci</p>
                </div>
                <h2 className="text-[26px] font-extrabold drop-shadow-sm tracking-tight">{selectedStudent.full_name}</h2>
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 text-[12.5px] font-bold bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                    <BookOpen size={13} />
                    {testResults.length} test tamamlandı
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[12.5px] font-bold bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                    <FileText size={13} className="text-emerald-100" />
                    {testResults.filter(t => t.ai_report).length} tekil rapor
                  </span>
                  {holisticReport && (
                    <span className="inline-flex items-center gap-1.5 text-[12.5px] font-bold bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                      <Brain size={13} className="text-violet-200" />
                      Bütüncül rapor
                    </span>
                  )}
                  {integratedReport && (
                    <span className="inline-flex items-center gap-1.5 text-[12.5px] font-bold bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                      <Layers size={13} className="text-pink-200" />
                      Entegre 3&apos;lü rapor
                    </span>
                  )}
                </div>
                {/* Üretilen rapor isimleri */}
                {testResults.filter(t => t.ai_report).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {testResults.filter(t => t.ai_report).map(t => (
                      <span key={t.id} className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 text-[10px] font-semibold">
                        ✅ {getTestLabel(t.test_type)}
                      </span>
                    ))}
                    {holisticReport && (
                      <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-200 text-[10px] font-semibold">
                        ✅ Bütüncül Rapor
                      </span>
                    )}
                    {integratedReport && (
                      <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-200 text-[10px] font-semibold">
                        ✅ Entegre 3&apos;lü
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <a
                  href={exportUrl('excel', { student_id: selectedStudent.id })}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-emerald-700 text-[12.5px] font-extrabold hover:bg-emerald-50 transition-all shadow-md active:scale-[0.97]"
                >
                  <Download size={14} />
                  Excel
                </a>
              </div>
            </div>
            <style jsx>{`
              .rep-aurora-1 { animation: rep-aurora-1 9s ease-in-out infinite; }
              .rep-aurora-2 { animation: rep-aurora-2 11s ease-in-out infinite 1s; }
              @keyframes rep-aurora-1 {
                0%, 100% { transform: translate(0, 0) scale(1); }
                50% { transform: translate(-15px, 15px) scale(1.08); }
              }
              @keyframes rep-aurora-2 {
                0%, 100% { transform: translate(0, 0) scale(1); }
                50% { transform: translate(15px, -10px) scale(1.05); }
              }
            `}</style>
          </div>

          {/* Sekmeler */}
          <div className="flex gap-1 mb-4 bg-white/70 backdrop-blur-xl rounded-2xl border border-white/60 p-1.5 shadow-sm overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 min-w-fit flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-extrabold transition-all active:scale-[0.97] ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 text-white shadow-lg shadow-emerald-500/30'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-white'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* TEKİL RAPORLAR */}
          {activeTab === 'tekil' && (
            <div className="space-y-3">
              {testResults.length === 0 && (
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-8 text-center">
                  <p className="text-gray-400">Bu öğrencinin henüz tamamlanmış testi yok.</p>
                </div>
              )}
              {testResults.map(tr => (
                <div key={tr.id} className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm overflow-hidden">
                  <div className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-10 rounded-full ${tr.ai_report ? 'bg-emerald-400' : 'bg-gray-200'}`} />
                      <div>
                        <p className="font-bold text-[#0f2847] text-sm">{getTestLabel(tr.test_type)}</p>
                        <p className="text-xs text-gray-400">
                          Test tarihi: {tr.completed_at
                            ? new Date(tr.completed_at).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
                            : '—'}
                        </p>
                        {tr.ai_report && tr.ai_report_generated_at && (
                          <p className="text-xs text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                            <CheckCircle size={11} />
                            Rapor üretildi: {new Date(tr.ai_report_generated_at).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {tr.ai_report ? (
                        <>
                          <button
                            onClick={() => setViewingReport({ text: tr.ai_report!, title: getTestLabel(tr.test_type), scores: tr.scores, testType: getTestLabel(tr.test_type) })}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-all"
                          >
                            <Eye size={13} />
                            Görüntüle
                          </button>
                          <a
                            href={exportUrl('pdf', { test_result_id: tr.id, report_type: getTestLabel(tr.test_type) })}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100 transition-all"
                          >
                            <Download size={13} />
                            PDF
                          </a>
                          <a
                            href={exportUrl('docx', { test_result_id: tr.id, report_type: getTestLabel(tr.test_type) })}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition-all"
                          >
                            <Download size={13} />
                            Word
                          </a>
                          <button
                            onClick={() => generateReport(tr, true)}
                            disabled={loadingStates[tr.id]}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 text-gray-600 text-xs font-semibold hover:bg-gray-200 disabled:opacity-50 transition-all"
                          >
                            <RefreshCw size={13} className={loadingStates[tr.id] ? 'animate-spin' : ''} />
                            Yenile
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => generateReport(tr)}
                          disabled={loadingStates[tr.id]}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0f2847] text-white text-xs font-semibold hover:bg-[#1a3d6e] disabled:opacity-50 transition-all"
                        >
                          {loadingStates[tr.id] ? (
                            <>
                              <RefreshCw size={13} className="animate-spin" />
                              Üretiliyor...
                            </>
                          ) : (
                            <>
                              <Brain size={13} />
                              Rapor Üret
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* BÜTÜNCÜL RAPOR */}
          {activeTab === 'butuncel' && (
            <div className="space-y-4">
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-6 shadow-sm">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <Brain size={22} className="text-violet-600" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-[#0f2847] text-lg">Bütüncül Analiz Raporu</h3>
                    <p className="text-gray-500 text-sm mt-1">
                      Öğrencinin tüm test sonuçlarını entegre eden, çapraz korelasyon analizi içeren kapsamlı bütüncül rapor.
                      Minimum 3.000 kelime, 8 bölüm.
                    </p>
                  </div>
                </div>

                {testResults.length < 3 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 text-sm text-amber-700 flex items-center gap-2">
                    <AlertCircle size={16} />
                    Bütüncül rapor için en az 3 tamamlanmış test önerilir. (Şu an: {testResults.length})
                  </div>
                )}

                <button
                  onClick={generateHolisticReport}
                  disabled={loadingStates.holistic || testResults.length === 0}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg"
                >
                  {loadingStates.holistic ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      Bütüncül rapor üretiliyor... (2-3 dk sürebilir)
                    </>
                  ) : holisticReport ? (
                    <>
                      <RefreshCw size={18} />
                      Yeniden Üret ({testResults.length} test)
                    </>
                  ) : (
                    <>
                      <Brain size={18} />
                      Bütüncül Rapor Üret ({testResults.length} test)
                    </>
                  )}
                </button>
              </div>

              {/* Rapor Görüntüleme */}
              {holisticReport && (
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-emerald-500" />
                      <h4 className="font-bold text-[#0f2847] text-sm">Bütüncül Rapor Hazır</h4>
                    </div>
                  </div>
                  <div className="max-h-[600px] overflow-y-auto p-5">
                    <ReportRenderer text={holisticReport} />
                  </div>
                  <div className="px-5 py-3.5 border-t border-gray-100 flex flex-wrap gap-2">
                    <button
                      onClick={() => setViewingReport({
                        text: holisticReport,
                        title: `${selectedStudent.full_name} — Bütüncül Analiz Raporu`,
                      })}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0f2847] text-white text-sm font-semibold hover:bg-[#1a3d6e] transition-all"
                    >
                      <Eye size={15} />
                      Tam Ekran Görüntüle
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(holisticReport);
                        setMessage({ type: 'success', text: 'Rapor panoya kopyalandı!' });
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition-all"
                    >
                      📋 Kopyala
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ENTEGRE 3'LÜ RAPOR */}
          {activeTab === 'entegre' && (
            <div className="space-y-4">
              {/* Açıklama Kartı */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Layers size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-indigo-900">Entegre 3&apos;lü Rapor Sistemi</h3>
                    <p className="text-indigo-700 text-sm mt-1">
                      Platformun en güçlü özelliği. 3 farklı perspektiften tek seferde üretilen profesyonel raporlar.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: 'Öğretmen / Koç Raporu', desc: 'Teknik, detaylı, stratejik', color: 'bg-emerald-100 text-emerald-700' },
                    { label: 'Öğrenci Raporu', desc: 'Motive edici, anlaşılır', color: 'bg-violet-100 text-violet-700' },
                    { label: 'Ebeveyn Raporu', desc: 'Sade, yapın/yapmayın', color: 'bg-pink-100 text-pink-700' },
                  ].map(r => (
                    <div key={r.label} className={`rounded-xl p-3 ${r.color}`}>
                      <p className="font-bold text-xs">{r.label}</p>
                      <p className="text-xs opacity-75 mt-0.5">{r.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  {integratedReport ? (
                    <button
                      onClick={() => generateIntegratedReport(true)}
                      disabled={loadingStates.integrated}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all"
                    >
                      {loadingStates.integrated ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" />
                          Yeniden üretiliyor...
                        </>
                      ) : (
                        <>
                          <RefreshCw size={16} />
                          Yeniden Üret (3 rapor)
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => generateIntegratedReport()}
                      disabled={loadingStates.integrated || testResults.length < 2}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg"
                    >
                      {loadingStates.integrated ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" />
                          Üretiliyor... (5-8 dk sürebilir)
                        </>
                      ) : (
                        <>
                          <Layers size={16} />
                          Entegre 3&apos;lü Rapor Üret
                        </>
                      )}
                    </button>
                  )}
                </div>

                {testResults.length < 2 && (
                  <p className="text-center text-indigo-600 text-xs mt-2">
                    En az 2 tamamlanmış test gereklidir. (Şu an: {testResults.length})
                  </p>
                )}
              </div>

              {/* Üretilmiş Raporları Göster */}
              {integratedReport && (
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm overflow-hidden">
                  {/* Alt sekme seçici */}
                  <div className="flex border-b border-gray-100">
                    {[
                      { key: 'ogretmen' as const, label: '👩‍🏫 Öğretmen / Koç', color: 'text-emerald-600' },
                      { key: 'ogrenci' as const, label: '🎓 Öğrenci', color: 'text-violet-600' },
                      { key: 'ebeveyn' as const, label: '👨‍👩‍👦 Ebeveyn', color: 'text-pink-600' },
                    ].map(tab => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveIntegratedTab(tab.key)}
                        className={`flex-1 py-3 text-sm font-semibold transition-all border-b-2 ${
                          activeIntegratedTab === tab.key
                            ? `border-current ${tab.color} bg-gray-50`
                            : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Rapor içeriği + export */}
                  {(() => {
                    const reportMap: Record<string, string | null> = {
                      ogretmen: integratedReport.teacher_report,
                      ogrenci: integratedReport.student_report,
                      ebeveyn: integratedReport.parent_report,
                    };
                    const currentReport = reportMap[activeIntegratedTab];

                    return (
                      <div className="p-5">
                        {integratedReport.generated_at && (
                          <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                            <Clock size={12} />
                            Oluşturulma: {new Date(integratedReport.generated_at).toLocaleString('tr-TR')}
                          </div>
                        )}

                        {currentReport ? (
                          <>
                            <div className="max-h-[600px] overflow-y-auto mb-4">
                              <IntegratedReportRenderer text={currentReport} reportType={activeIntegratedTab} />
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => setViewingReport({ text: currentReport, title: `${selectedStudent.full_name} — ${activeIntegratedTab === 'ogretmen' ? 'Öğretmen' : activeIntegratedTab === 'ogrenci' ? 'Öğrenci' : 'Ebeveyn'} Raporu`, integratedType: activeIntegratedTab })}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0f2847] text-white text-sm font-semibold hover:bg-[#1a3d6e] transition-all"
                              >
                                <Eye size={15} />
                                Tam Ekran Görüntüle
                              </button>
                              <a
                                href={`/api/export/integrated?student_id=${selectedStudent.id}&format=pdf`}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100 transition-all border border-red-200"
                              >
                                <Download size={15} />
                                PDF İndir (3 Rapor)
                              </a>
                              <a
                                href={`/api/export/integrated?student_id=${selectedStudent.id}&format=docx`}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 text-sm font-semibold hover:bg-blue-100 transition-all border border-blue-200"
                              >
                                <Download size={15} />
                                Word İndir (3 Rapor)
                              </a>
                            </div>
                          </>
                        ) : (
                          <p className="text-gray-400 text-sm text-center py-8">
                            Bu rapor henüz üretilmemiş.
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Rapor Görüntüleme Modal */}
      {viewingReport && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setViewingReport(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-extrabold text-[#0f2847] text-lg">{viewingReport.title}</h3>
              <button
                onClick={() => setViewingReport(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-all"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {viewingReport.integratedType ? (
                <IntegratedReportRenderer 
                  text={viewingReport.text} 
                  reportType={viewingReport.integratedType}
                />
              ) : (
                <ReportRenderer 
                  text={viewingReport.text} 
                  scores={viewingReport.scores} 
                  testType={viewingReport.testType}
                />
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(viewingReport.text);
                  setMessage({ type: 'success', text: 'Rapor panoya kopyalandı!' });
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition-all"
              >
                📋 Kopyala
              </button>
              <button
                onClick={() => setViewingReport(null)}
                className="ml-auto px-4 py-2 rounded-xl bg-[#0f2847] text-white text-sm font-semibold hover:bg-[#1a3d6e] transition-all"
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
