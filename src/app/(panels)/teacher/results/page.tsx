'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BarChart2, ChevronDown, Download, FileText, Eye, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import ReportRenderer from '@/components/ReportRenderer';

interface TestResult {
  id: string;
  student_id: string;
  test_type: string;
  completed_at: string | null;
  scores: Record<string, unknown>;
  raw_answers: Record<string, unknown> | null;
  ai_report: string | null;
  ai_report_generated_at: string | null;
  student_name?: string;
  class_name?: string;
}

interface ClassInfo {
  id: string;
  name: string;
  grade: number | null;
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

function formatScoreSummary(scores: Record<string, unknown>): string {
  const entries = Object.entries(scores ?? {}).slice(0, 4);
  if (entries.length === 0) return '—';
  return entries
    .map(([k, v]) => {
      const val = typeof v === 'number' ? `${Math.round(v)}` :
                  typeof v === 'object' && v !== null && 'pct' in v ? `${Math.round((v as Record<string, number>).pct)}%` :
                  String(v).slice(0, 20);
      return `${k}: ${val}`;
    })
    .join(' · ');
}

export default function TeacherResultsPage() {
  const supabase = createClient();

  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [myStudentIds, setMyStudentIds] = useState<string[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAnswers, setSelectedAnswers] = useState<TestResult | null>(null);
  const [viewingReport, setViewingReport] = useState<TestResult | null>(null);

  // 1. Giriş yapan öğretmeni bul + sadece kendi sınıflarını ve öğrencilerini al
  useEffect(() => {
    async function initTeacherScope() {
      // Öğretmenin kimliğini al
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;
      setTeacherId(user.id);

      // Sadece bu öğretmene ait sınıflar (teacher_id = auth.uid())
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

  // 2. Sonuçları yükle — sadece öğretmenin kendi öğrencileri
  useEffect(() => {
    async function loadResults() {
      if (!teacherId) return;
      setLoading(true);

      // Hangi öğrenci ID'lerini sorgulayacağız?
      let studentIds = myStudentIds;

      if (selectedClass !== 'all') {
        // Seçili sınıftaki öğrencilere daralt
        const { data: classStudents } = await supabase
          .from('class_students')
          .select('student_id')
          .eq('class_id', selectedClass);
        const classStudentIds = (classStudents ?? []).map(cs => cs.student_id);
        // Hem sınıfa ait hem de öğretmenin öğrencisi olanlar (kesişim)
        studentIds = classStudentIds.filter(id => myStudentIds.includes(id));
      }

      if (studentIds.length === 0) {
        setResults([]);
        setLoading(false);
        return;
      }

      const { data: rawResults } = await supabase
        .from('test_results')
        .select(`
          id, student_id, test_type, completed_at, scores, raw_answers,
          ai_report, ai_report_generated_at,
          profiles!test_results_student_id_fkey(full_name)
        `)
        .in('student_id', studentIds)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(200);

      const mapped = (rawResults ?? []).map(r => ({
        ...r,
        scores: r.scores as Record<string, unknown>,
        raw_answers: r.raw_answers as Record<string, unknown> | null,
        student_name: (r.profiles as unknown as { full_name: string } | null)?.full_name ?? '—',
      }));
      setResults(mapped);
      setLoading(false);
    }
    loadResults();
  }, [selectedClass, teacherId, myStudentIds, supabase]);

  const filtered = results.filter(r =>
    !searchQuery ||
    r.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getTestLabel(r.test_type).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exportClassExcel = () => {
    if (selectedClass !== 'all') {
      window.open(`/api/export/excel?class_id=${selectedClass}`);
    }
  };

  return (
    <div>
      {/* Başlık */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0f2847] mb-1">Test Sonuçları</h1>
          <p className="text-gray-500 text-sm">
            Tamamlanan testler, skorlar ve rapor durumları.
          </p>
        </div>
        {selectedClass !== 'all' && (
          <button
            onClick={exportClassExcel}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-all shadow"
          >
            <Download size={15} />
            Sınıf Excel&apos;i İndir
          </button>
        )}
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Toplam Sonuç', value: results.length, icon: <BarChart2 size={18} className="text-sky-500" />, color: 'text-sky-600' },
          { label: 'Filtrelenmiş', value: filtered.length, icon: <FileText size={18} className="text-violet-500" />, color: 'text-violet-600' },
          { label: 'Raporu Olan', value: results.filter(r => r.ai_report).length, icon: <Eye size={18} className="text-emerald-500" />, color: 'text-emerald-600' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-4 flex items-center gap-3 shadow-sm">
            {icon}
            <div>
              <p className={`font-extrabold text-xl ${color}`}>{value}</p>
              <p className="text-gray-400 text-xs">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtreler */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div className="relative">
          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className="w-full appearance-none bg-white/70 backdrop-blur-xl border border-white/40 rounded-xl px-4 py-2.5 text-sm font-medium text-[#0f2847] focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer shadow-sm"
          >
            <option value="all">Tüm Sınıflar</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} {c.grade ? `(${c.grade}. Sınıf)` : ''}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
        </div>

        <input
          type="search"
          placeholder="Öğrenci adı veya test ara..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-xl px-4 py-2.5 text-sm text-[#0f2847] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-sm"
        />
      </div>

      {/* Tablo */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0f2847] text-white">
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide">Öğrenci</th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide">Test</th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide">Tarih</th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide">Skor Özeti</th>
                <th className="px-4 py-3 text-center font-semibold text-xs uppercase tracking-wide">Rapor</th>
                <th className="px-4 py-3 text-center font-semibold text-xs uppercase tracking-wide">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    Yükleniyor...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    Sonuç bulunamadı.
                  </td>
                </tr>
              ) : (
                filtered.map((r, idx) => (
                  <tr
                    key={r.id}
                    className={`border-b border-gray-50 hover:bg-emerald-50/30 transition-colors ${idx % 2 === 0 ? '' : 'bg-gray-50/50'}`}
                  >
                    <td className="px-4 py-3 font-semibold text-[#0f2847]">{r.student_name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold">
                        {getTestLabel(r.test_type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {r.completed_at
                        ? new Date(r.completed_at).toLocaleDateString('tr-TR')
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-[200px] truncate">
                      {formatScoreSummary(r.scores)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {r.ai_report ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                            <CheckCircle size={12} /> Üretildi
                          </span>
                          {r.ai_report_generated_at && (
                            <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                              <Clock size={9} />
                              {new Date(r.ai_report_generated_at).toLocaleDateString('tr-TR')}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-300 text-xs">Üretilmedi</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {r.ai_report && (
                          <>
                            <button
                              onClick={() => setViewingReport(r)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-semibold hover:bg-emerald-100 transition-all border border-emerald-200"
                            >
                              <Eye size={11} />
                              Rapor
                            </button>
                            <a
                              href={`/api/export/pdf?test_result_id=${r.id}&report_type=${encodeURIComponent(getTestLabel(r.test_type))}`}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 text-red-700 text-[11px] font-semibold hover:bg-red-100 transition-all border border-red-200"
                            >
                              <Download size={11} />
                              PDF
                            </a>
                            <a
                              href={`/api/export/docx?test_result_id=${r.id}&report_type=${encodeURIComponent(getTestLabel(r.test_type))}`}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-semibold hover:bg-blue-100 transition-all border border-blue-200"
                            >
                              <Download size={11} />
                              Word
                            </a>
                          </>
                        )}
                        {r.raw_answers && Object.keys(r.raw_answers).length > 0 && (
                          <button
                            onClick={() => setSelectedAnswers(r)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 text-amber-700 text-[11px] font-semibold hover:bg-amber-100 transition-all border border-amber-200"
                          >
                            <Eye size={11} />
                            Cevaplar
                          </button>
                        )}
                        {!r.ai_report && (
                          <Link
                            href={`/teacher/reports?student_id=${r.student_id}`}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#0f2847] text-white text-[11px] font-semibold hover:bg-[#1a3d6e] transition-all"
                          >
                            <FileText size={11} />
                            Rapor Üret
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && filtered.length > 0 && (
        <p className="text-center text-gray-400 text-xs mt-3">
          {filtered.length} sonuç gösteriliyor (sadece size ait öğrenciler)
        </p>
      )}

      {/* RAPOR GÖRÜNTÜLEME MODAL */}
      {viewingReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setViewingReport(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-[#0f2847] to-[#1a3d6e]">
              <div>
                <h3 className="text-white font-bold text-lg">
                  {viewingReport.student_name} — {getTestLabel(viewingReport.test_type)}
                </h3>
                {viewingReport.ai_report_generated_at && (
                  <p className="text-white/60 text-xs mt-0.5">
                    Rapor üretim tarihi: {new Date(viewingReport.ai_report_generated_at).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>
              <button
                onClick={() => setViewingReport(null)}
                className="text-white/70 hover:text-white text-2xl leading-none px-2"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <ReportRenderer
                text={viewingReport.ai_report!}
                scores={viewingReport.scores}
                testType={getTestLabel(viewingReport.test_type)}
              />
            </div>
            <div className="px-6 py-3 border-t border-gray-100 flex flex-wrap gap-2">
              <a
                href={`/api/export/pdf?test_result_id=${viewingReport.id}&report_type=${encodeURIComponent(getTestLabel(viewingReport.test_type))}`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100 transition-all border border-red-200"
              >
                <Download size={14} />
                PDF İndir
              </a>
              <a
                href={`/api/export/docx?test_result_id=${viewingReport.id}&report_type=${encodeURIComponent(getTestLabel(viewingReport.test_type))}`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 text-sm font-semibold hover:bg-blue-100 transition-all border border-blue-200"
              >
                <Download size={14} />
                Word İndir
              </a>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(viewingReport.ai_report!);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition-all"
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

      {/* İŞARETLEMELER MODAL */}
      {selectedAnswers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-[#0f2847] to-[#1a3d6e]">
              <div>
                <h3 className="text-white font-bold text-lg">📝 Öğrenci İşaretlemeleri</h3>
                <p className="text-white/70 text-sm">
                  {selectedAnswers.student_name} — {getTestLabel(selectedAnswers.test_type)}
                </p>
              </div>
              <button
                onClick={() => setSelectedAnswers(null)}
                className="text-white/70 hover:text-white text-2xl leading-none px-2"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 p-6">
              {selectedAnswers.raw_answers && Object.keys(selectedAnswers.raw_answers).length > 0 ? (
                <div className="space-y-2">
                  <p className="text-gray-500 text-xs mb-4">
                    Toplam {Object.keys(selectedAnswers.raw_answers).length} soru cevaplanmış.
                  </p>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase w-1/3">Soru</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Öğrencinin Cevabı</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(selectedAnswers.raw_answers)
                        .sort(([a], [b]) => {
                          const na = parseInt(a.replace(/\D/g, ''));
                          const nb = parseInt(b.replace(/\D/g, ''));
                          return (isNaN(na) || isNaN(nb)) ? a.localeCompare(b) : na - nb;
                        })
                        .map(([questionId, answer], idx) => (
                        <tr key={questionId} className={idx % 2 === 0 ? '' : 'bg-gray-50/50'}>
                          <td className="px-3 py-2 text-gray-600 font-medium border-b border-gray-50">
                            {questionId}
                          </td>
                          <td className="px-3 py-2 text-[#0f2847] font-semibold border-b border-gray-50">
                            <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs">
                              {String(answer)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">
                  Bu test için işaretleme verisi bulunamadı.
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedAnswers(null)}
                className="px-5 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition-all"
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
