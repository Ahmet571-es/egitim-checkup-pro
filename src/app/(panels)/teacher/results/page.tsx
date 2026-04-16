'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { secureFetch } from '@/lib/csrf-client';
import {
  FileCheck2, Search, Filter, GraduationCap, School, Calendar,
  CheckCircle2, AlertCircle, ChevronRight, Eye
} from 'lucide-react';

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

  // ── Filtre seçenekleri (logs'dan dinamik üret) ──
  const schools = useMemo(() => [...new Set(logs.map(l => l.school_name))].sort(), [logs]);
  const testTypes = useMemo(() => [...new Set(logs.map(l => l.test_type))].sort(), [logs]);

  // ── Filtreleme ──
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
      if (search && !l.student_name.toLowerCase().includes(search.toLowerCase())) return false;
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

  return (
    <div>
      {/* Header */}
      <div className="mb-6 bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-violet-500/20">
        <h1 className="text-2xl sm:text-3xl font-extrabold mb-1 flex items-center gap-3">
          <FileCheck2 className="w-8 h-8" /> Tamamlanan Testler
        </h1>
        <p className="text-violet-50 text-sm">
          Hangi öğrencinin, hangi okulda, hangi sınıfta, hangi testi, ne zaman tamamladığını görün.
        </p>
      </div>

      {/* Toplam */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-4 shadow-sm">
            <p className="text-[11px] text-gray-400 font-medium uppercase">Toplam Test</p>
            <p className="text-xl font-extrabold text-[#0f2847]">{logs.length}</p>
          </div>
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-4 shadow-sm">
            <p className="text-[11px] text-gray-400 font-medium uppercase">Filtreli</p>
            <p className="text-xl font-extrabold text-violet-600">{filtered.length}</p>
          </div>
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-4 shadow-sm">
            <p className="text-[11px] text-gray-400 font-medium uppercase">Raporlu</p>
            <p className="text-xl font-extrabold text-emerald-600">{logs.filter(l => l.has_report).length}</p>
          </div>
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-4 shadow-sm">
            <p className="text-[11px] text-gray-400 font-medium uppercase">Rapor Bekliyor</p>
            <p className="text-xl font-extrabold text-amber-600">{logs.filter(l => !l.has_report).length}</p>
          </div>
        </div>
      )}

      {/* Filtreler */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-4 shadow-sm mb-4">
        <div className="flex items-center gap-2 mb-3 text-[12px] font-bold text-gray-500 uppercase">
          <Filter className="w-3.5 h-3.5" /> Filtreler
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {/* Arama */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Öğrenci ara..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
            />
          </div>

          {/* Okul */}
          <select
            value={schoolFilter}
            onChange={(e) => setSchoolFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
          >
            <option value="all">Tüm okullar</option>
            {schools.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Test türü */}
          <select
            value={testFilter}
            onChange={(e) => setTestFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
          >
            <option value="all">Tüm testler</option>
            {testTypes.map((t) => <option key={t} value={t}>{labelOf(t)}</option>)}
          </select>

          {/* Tarih aralığı */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
          >
            <option value="all">Tüm tarihler</option>
            <option value="7d">Son 7 gün</option>
            <option value="30d">Son 30 gün</option>
            <option value="90d">Son 90 gün</option>
          </select>

          {/* Rapor durumu */}
          <select
            value={reportFilter}
            onChange={(e) => setReportFilter(e.target.value as 'all' | 'with' | 'without')}
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
          >
            <option value="all">Tüm raporlar</option>
            <option value="with">Raporlu</option>
            <option value="without">Raporsuz</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Yükleniyor...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-12 text-center shadow-sm">
          <p className="text-5xl mb-3">📭</p>
          <p className="text-gray-500 font-semibold">
            {logs.length === 0 ? 'Henüz tamamlanmış test yok.' : 'Filtreye uygun test bulunamadı.'}
          </p>
        </div>
      ) : (
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm overflow-hidden">
          {filtered.map((l) => (
            <Link
              key={l.id}
              href={`/teacher/students/${l.student_id}`}
              className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-b-0 hover:bg-violet-50/40 transition-colors"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${l.has_report ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                <CheckCircle2 className={`w-4 h-4 ${l.has_report ? 'text-emerald-600' : 'text-amber-600'}`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[14px] font-bold text-[#0f2847] truncate">{l.student_name}</span>
                  <span className="text-[11px] text-violet-600 font-semibold bg-violet-50 px-2 py-0.5 rounded-full">{labelOf(l.test_type)}</span>
                  {l.has_report && (
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">Rapor var</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-500 flex-wrap">
                  <span className="flex items-center gap-1"><School className="w-3 h-3" /> {l.school_name}</span>
                  <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" /> {l.class_name}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(l.completed_at)}</span>
                </div>
              </div>

              <Eye className="w-4 h-4 text-gray-300 shrink-0" />
              <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
