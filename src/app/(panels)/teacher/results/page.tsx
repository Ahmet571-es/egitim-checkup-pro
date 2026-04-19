'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { secureFetch } from '@/lib/csrf-client';
import {
  FileCheck2, Filter, GraduationCap, School, Calendar,
  CheckCircle2, AlertCircle, ChevronRight, Eye, FileText, Clock
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import SearchBar from '@/components/ui/SearchBar';
import EmptyState from '@/components/ui/EmptyState';
import { ListSkeleton } from '@/components/ui/Skeleton';

const TEST_LABELS: Record<string, string> = {
  enneagram: 'Enneagram Kişilik',
  vark: 'VARK Öğrenme Stilleri',
  holland: 'Holland RIASEC',
  coklu_zeka: 'Çoklu Zekâ', 'coklu-zeka': 'Çoklu Zekâ',
  sinav_kaygisi: 'Sınav Kaygısı', 'sinav-kaygisi': 'Sınav Kaygısı',
  calisma_davranisi: 'Çalışma Davranışı', 'calisma-davranisi': 'Çalışma Davranışı',
  akademik_analiz: 'Akademik Analiz', 'akademik-analiz': 'Akademik Analiz',
  hizli_okuma: 'Hızlı Okuma', 'hizli-okuma': 'Hızlı Okuma',
  d2_dikkat: 'P2 Dikkat Testi', 'd2-dikkat': 'P2 Dikkat Testi',
  sag_sol_beyin: 'Sağ-Sol Beyin', 'sag-sol-beyin': 'Sağ-Sol Beyin',
};
const labelOf = (t: string) => TEST_LABELS[t] || t;

interface LogRow {
  id: string;
  student_id: string;
  student_name: string;
  school_name: string;
  class_name: string;
  test_type: string;
  completed_at: string;
  has_report: boolean;
}

type DateRange = 'all' | '7d' | '30d' | '90d';

export default function CompletedTestsPage() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [schoolFilter, setSchoolFilter] = useState<string>('all');
  const [testFilter, setTestFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [reportFilter, setReportFilter] = useState<'all' | 'with' | 'without'>('all');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await secureFetch('/api/teacher/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'completed-tests-log' }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Sunucu hatası');
        setLogs(data.logs || []);
      } catch (e: unknown) {
        setError((e as Error).message);
      }
      setLoading(false);
    })();
  }, []);

  const schools = useMemo(() => [...new Set(logs.map(l => l.school_name))].sort(), [logs]);
  const testTypes = useMemo(() => [...new Set(logs.map(l => l.test_type))].sort(), [logs]);

  const filtered = useMemo(() => {
    const now = Date.now();
    const ranges: Record<DateRange, number> = {
      all: Infinity,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
    };
    const rangeMs = ranges[dateRange];

    return logs.filter((l) => {
      if (search && !l.student_name.toLocaleLowerCase('tr-TR').includes(search.toLocaleLowerCase('tr-TR'))) return false;
      if (schoolFilter !== 'all' && l.school_name !== schoolFilter) return false;
      if (testFilter !== 'all' && l.test_type !== testFilter) return false;
      if (reportFilter === 'with' && !l.has_report) return false;
      if (reportFilter === 'without' && l.has_report) return false;
      if (rangeMs !== Infinity) {
        const age = now - new Date(l.completed_at).getTime();
        if (age > rangeMs) return false;
      }
      return true;
    });
  }, [logs, search, schoolFilter, testFilter, dateRange, reportFilter]);

  const formatDate = (d: string) => d
    ? new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

  const stats = [
    { label: 'Toplam', value: logs.length, gradient: 'from-violet-500 to-purple-600', icon: FileCheck2 },
    { label: 'Filtreli', value: filtered.length, gradient: 'from-indigo-500 to-violet-600', icon: Filter },
    { label: 'Raporlu', value: logs.filter(l => l.has_report).length, gradient: 'from-emerald-500 to-teal-600', icon: FileText },
    { label: 'Bekliyor', value: logs.filter(l => !l.has_report).length, gradient: 'from-amber-500 to-orange-600', icon: Clock },
  ];

  return (
    <div>
      <PageHeader
        role="teacher"
        icon={FileCheck2}
        title="Tamamlanan Testler"
        subtitle="Hangi öğrencinin, hangi okulda, hangi sınıfta, hangi testi, ne zaman tamamladığını görün"
        count={logs.length}
        countLabel="test"
      />

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-5 grid-stagger">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="relative bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 p-4 shadow-sm overflow-hidden group hover:shadow-lg transition-all"
              >
                <div className={`absolute -top-8 -right-8 w-28 h-28 rounded-full bg-gradient-to-br ${s.gradient} opacity-10 blur-2xl group-hover:opacity-25 transition-opacity`} />
                <div className="relative flex items-center gap-2.5">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.gradient} text-white flex items-center justify-center shadow-md shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{s.label}</p>
                    <p className="text-xl sm:text-2xl font-extrabold text-[#0f2847] tabular-nums">{s.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 p-4 shadow-sm mb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
            <Filter className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-[12px] font-extrabold text-[#0f2847] uppercase tracking-wider">Filtreler</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          <SearchBar role="teacher" value={search} onChange={setSearch} placeholder="Öğrenci ara..." />

          <select
            value={schoolFilter}
            onChange={(e) => setSchoolFilter(e.target.value)}
            className="px-3.5 py-3 rounded-xl border border-gray-200 bg-white text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
          >
            <option value="all">Tüm okullar</option>
            {schools.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          <select
            value={testFilter}
            onChange={(e) => setTestFilter(e.target.value)}
            className="px-3.5 py-3 rounded-xl border border-gray-200 bg-white text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
          >
            <option value="all">Tüm testler</option>
            {testTypes.map((t) => <option key={t} value={t}>{labelOf(t)}</option>)}
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            className="px-3.5 py-3 rounded-xl border border-gray-200 bg-white text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
          >
            <option value="all">Tüm tarihler</option>
            <option value="7d">Son 7 gün</option>
            <option value="30d">Son 30 gün</option>
            <option value="90d">Son 90 gün</option>
          </select>

          <select
            value={reportFilter}
            onChange={(e) => setReportFilter(e.target.value as 'all' | 'with' | 'without')}
            className="px-3.5 py-3 rounded-xl border border-gray-200 bg-white text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
          >
            <option value="all">Tüm raporlar</option>
            <option value="with">Raporlu</option>
            <option value="without">Raporsuz</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-sm text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {loading ? (
        <ListSkeleton count={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          role="teacher"
          icon={FileCheck2}
          title={logs.length === 0 ? 'Henüz tamamlanmış test yok' : 'Filtreye uygun test bulunamadı'}
          subtitle={logs.length === 0 ? 'Öğrencilerin test çözdükçe burada görüneceksin.' : 'Farklı filtre seçmeyi dene.'}
        />
      ) : (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm overflow-hidden">
          {filtered.map((l, idx) => (
            <Link
              key={l.id}
              href={`/teacher/students/${l.student_id}`}
              className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 last:border-b-0 hover:bg-violet-50/40 transition-colors group row-enter"
              style={{ animationDelay: `${idx * 15}ms` }}
            >
              <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                l.has_report
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                  : 'bg-gradient-to-br from-amber-500 to-orange-600'
              } group-hover:scale-110 group-hover:rotate-6 transition-transform`}>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/30 to-transparent" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[14px] font-extrabold text-[#0f2847] truncate">{l.student_name}</span>
                  <span className="text-[10.5px] text-violet-700 font-bold bg-violet-50 px-2 py-0.5 rounded-full border border-violet-200">{labelOf(l.test_type)}</span>
                  {l.has_report && (
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <FileText className="w-2.5 h-2.5" />
                      Rapor
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2.5 mt-1 text-[11px] text-gray-500 flex-wrap font-medium">
                  <span className="flex items-center gap-1"><School className="w-3 h-3 text-gray-400" /> {l.school_name}</span>
                  <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3 text-gray-400" /> {l.class_name}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-gray-400" /> {formatDate(l.completed_at)}</span>
                </div>
              </div>

              <Eye className="w-4 h-4 text-gray-300 shrink-0 group-hover:text-violet-500 transition" />
              <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 group-hover:translate-x-0.5 group-hover:text-violet-500 transition-all" />
            </Link>
          ))}
        </div>
      )}

      <style>{`
        @keyframes row-enter {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .row-enter {
          animation: row-enter 300ms ease-out backwards;
        }
      `}</style>
    </div>
  );
}
