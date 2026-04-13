'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BarChart2, ChevronDown, Download, FileText, Eye } from 'lucide-react';
import Link from 'next/link';

interface TestResult {
  id: string;
  student_id: string;
  test_type: string;
  completed_at: string | null;
  scores: Record<string, unknown>;
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

  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadClasses() {
      const { data } = await supabase
        .from('classes')
        .select('id, name, grade')
        .order('name');
      setClasses(data ?? []);
    }
    loadClasses();
  }, [supabase]);

  useEffect(() => {
    async function loadResults() {
      setLoading(true);

      if (selectedClass === 'all') {
        // Tüm tamamlanmış testler
        const { data: rawResults } = await supabase
          .from('test_results')
          .select(`
            id, student_id, test_type, completed_at, scores,
            ai_report, ai_report_generated_at,
            profiles!test_results_student_id_fkey(full_name)
          `)
          .not('completed_at', 'is', null)
          .order('completed_at', { ascending: false })
          .limit(200);

        const mapped = (rawResults ?? []).map(r => ({
          ...r,
          scores: r.scores as Record<string, unknown>,
          student_name: (r.profiles as unknown as { full_name: string } | null)?.full_name ?? '—',
        }));
        setResults(mapped);
      } else {
        // Sınıf bazlı
        const { data: classStudents } = await supabase
          .from('class_students')
          .select('student_id')
          .eq('class_id', selectedClass);

        const studentIds = (classStudents ?? []).map(cs => cs.student_id);

        if (studentIds.length === 0) {
          setResults([]);
          setLoading(false);
          return;
        }

        const { data: rawResults } = await supabase
          .from('test_results')
          .select(`
            id, student_id, test_type, completed_at, scores,
            ai_report, ai_report_generated_at,
            profiles!test_results_student_id_fkey(full_name)
          `)
          .in('student_id', studentIds)
          .not('completed_at', 'is', null)
          .order('completed_at', { ascending: false });

        const mapped = (rawResults ?? []).map(r => ({
          ...r,
          scores: r.scores as Record<string, unknown>,
          student_name: (r.profiles as unknown as { full_name: string } | null)?.full_name ?? '—',
        }));
        setResults(mapped);
      }

      setLoading(false);
    }
    loadResults();
  }, [selectedClass, supabase]);

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
                        <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                          ✅ Var
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Link
                        href={`/teacher/reports?student_id=${r.student_id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0f2847] text-white text-xs font-semibold hover:bg-[#1a3d6e] transition-all"
                      >
                        <FileText size={12} />
                        Raporlar
                      </Link>
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
          {filtered.length} sonuç gösteriliyor
        </p>
      )}
    </div>
  );
}
