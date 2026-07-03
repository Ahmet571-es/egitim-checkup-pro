'use client';

import { useState, useEffect, useMemo } from 'react';
import { History, Clock, FileText, ChevronDown, Printer, Inbox, ArrowLeft, ListChecks } from 'lucide-react';
import Link from 'next/link';
import { ALL_TESTS } from '@/lib/tests/index';
import { createClient } from '@/lib/supabase/client';
import PageHeader from '@/components/ui/PageHeader';
import { ListSkeleton } from '@/components/ui/Skeleton';

interface ResultRow {
  id: string;
  test_type: string;
  main_result: string | null;
  report: string | null;
  scores: Record<string, unknown> | null;
  completed_at: string | null;
}

const testMeta = (testType: string) => ALL_TESTS.find(t => t.id === testType);

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString('tr-TR', {
        day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : '—';

// scores JSON'undan görünür alt skorları çıkar (_main / _desc gibi meta alanları hariç)
const breakdownEntries = (scores: Record<string, unknown> | null): [string, string][] => {
  if (!scores) return [];
  return Object.entries(scores)
    .filter(([k]) => !k.startsWith('_'))
    .map(([k, v]) => [k, typeof v === 'number' ? String(v) : String(v ?? '')]);
};

export default function TeacherMyResultsPage() {
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data } = await supabase
          .from('teacher_test_results')
          .select('id, test_type, main_result, report, scores, completed_at')
          .eq('teacher_id', user.id)
          .not('completed_at', 'is', null)
          .order('completed_at', { ascending: false });

        if (data) setRows(data as ResultRow[]);
      } catch (err) {
        console.error('[teacher my-results] fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const usedTypes = useMemo(() => {
    const set = new Set(rows.map(r => r.test_type));
    return ALL_TESTS.filter(t => set.has(t.id));
  }, [rows]);

  const filtered = filterType === 'all' ? rows : rows.filter(r => r.test_type === filterType);

  // Tek bir raporu yeni pencerede yazdır / PDF olarak kaydet
  const printReport = (row: ResultRow) => {
    const meta = testMeta(row.test_type);
    const name = meta?.name ?? row.test_type;
    const desc = (row.scores?._desc as string) ?? '';
    const breakdown = breakdownEntries(row.scores);
    const reportHtml = (row.report ?? '')
      .split('\n')
      .map(line => (line.trim() === '' ? '<br/>' : `<p>${escapeHtml(line)}</p>`))
      .join('');

    const rowsHtml = breakdown
      .map(([k, v]) => `<tr><td>${escapeHtml(k)}</td><td style="text-align:right;font-weight:600">${escapeHtml(v)}</td></tr>`)
      .join('');

    const html = `<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"/>
      <title>${escapeHtml(name)} — Sonuç Raporu</title>
      <style>
        body{font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#0f2847;max-width:720px;margin:32px auto;padding:0 24px;line-height:1.6}
        h1{font-size:22px;margin:0 0 4px}
        .meta{color:#64748b;font-size:13px;margin-bottom:20px}
        .badge{display:inline-block;background:#ecfdf5;color:#047857;border:1px solid #a7f3d0;padding:4px 12px;border-radius:999px;font-size:13px;font-weight:700;margin-bottom:16px}
        table{width:100%;border-collapse:collapse;margin:12px 0 20px}
        td{padding:8px 6px;border-bottom:1px solid #eef2f7;font-size:14px}
        p{margin:0 0 8px;font-size:14.5px}
        h2{font-size:15px;margin:18px 0 8px;color:#0f766e}
        .foot{margin-top:28px;padding-top:12px;border-top:1px solid #e5e7eb;color:#94a3b8;font-size:11px}
      </style></head><body>
      <h1>${escapeHtml(name)}</h1>
      <div class="meta">Çözüm tarihi: ${escapeHtml(fmtDate(row.completed_at))}</div>
      ${row.main_result ? `<div class="badge">${escapeHtml(row.main_result)}</div>` : ''}
      ${desc ? `<p>${escapeHtml(desc)}</p>` : ''}
      ${rowsHtml ? `<h2>Skorlar</h2><table>${rowsHtml}</table>` : ''}
      ${reportHtml ? `<h2>Rapor</h2>${reportHtml}` : ''}
      <div class="foot">Eğitim Check-Up · Öğretmen kişisel test raporu · Bu rapor yapay zekâ kullanılmadan test motorunca üretilmiştir.</div>
      </body></html>`;

    const w = window.open('', '_blank', 'width=800,height=1000');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };

  const renderCard = (row: ResultRow) => {
    const meta = testMeta(row.test_type);
    const color = meta?.color ?? '#0f766e';
    const isOpen = openId === row.id;
    const desc = (row.scores?._desc as string) ?? '';
    const breakdown = breakdownEntries(row.scores);
    const reportParas = (row.report ?? '').split('\n').filter(l => l.trim() !== '');

    return (
      <div key={row.id} className="rounded-2xl bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 shadow-sm overflow-hidden">
        {/* Başlık satırı */}
        <button
          onClick={() => setOpenId(isOpen ? null : row.id)}
          className="w-full flex items-center gap-3 sm:gap-4 p-4 sm:p-5 text-left hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors"
        >
          <div className="w-1 h-14 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm" style={{ backgroundColor: color + '20' }}>
            <span className="text-2xl sm:text-[26px]">{meta?.icon ?? '📄'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-extrabold text-[#0f2847] dark:text-slate-100 truncate text-[14px] sm:text-[15px]">{meta?.name ?? row.test_type}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[11.5px] text-gray-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                <Clock size={11} className="text-gray-400" /> {fmtDate(row.completed_at)}
              </span>
            </div>
            {row.main_result && (
              <span className="inline-block mt-1.5 text-[11.5px] px-2.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: color + '18', color }}>
                {row.main_result}
              </span>
            )}
          </div>
          <ChevronDown size={20} className={`text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Açılan rapor */}
        {isOpen && (
          <div className="border-t border-slate-100 dark:border-slate-700/60 p-4 sm:p-6 bg-slate-50/40 dark:bg-slate-900/20">
            {desc && <p className="text-[14px] text-[#0f2847] dark:text-slate-200 leading-relaxed mb-4">{desc}</p>}

            {breakdown.length > 0 && (
              <div className="mb-5">
                <h4 className="text-[12px] font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-400 mb-2">Skorlar</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {breakdown.map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-white/70 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                      <span className="text-[12.5px] text-gray-600 dark:text-slate-300 truncate">{k}</span>
                      <span className="text-[12.5px] font-extrabold text-[#0f2847] dark:text-slate-100 tabular-nums shrink-0">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {reportParas.length > 0 ? (
              <div className="mb-5">
                <h4 className="text-[12px] font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-400 mb-2">Rapor</h4>
                <div className="space-y-2 text-[14px] text-[#0f2847] dark:text-slate-200 leading-relaxed">
                  {reportParas.map((p, i) => <p key={i}>{p}</p>)}
                </div>
              </div>
            ) : (
              <p className="text-[13px] text-gray-500 dark:text-slate-400 italic mb-5">Bu test için ayrıntılı metin raporu bulunmuyor; skorlar yukarıdadır.</p>
            )}

            <button
              onClick={() => printReport(row)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[13px] font-extrabold shadow-md shadow-emerald-500/30 hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95"
            >
              <Printer size={15} /> Yazdır / PDF olarak kaydet
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <PageHeader
        role="teacher"
        icon={History}
        title="Sonuç Geçmişim"
        subtitle="Çözdüğün testlerin sonuçları ve raporları (yalnızca sana görünür)"
        count={rows.length}
        countLabel="sonuç"
      />

      {/* Testlerim'e dön */}
      <Link
        href="/teacher/my-tests"
        className="inline-flex items-center gap-2 mb-5 px-4 py-2 rounded-xl bg-white/80 dark:bg-slate-800/60 border border-white/60 dark:border-slate-700/60 text-[13px] font-extrabold text-gray-600 dark:text-slate-300 hover:text-emerald-600 hover:border-emerald-300 transition-all"
      >
        <ArrowLeft size={15} /> Testlerim
      </Link>

      {/* Test tipine göre filtre */}
      {usedTypes.length > 1 && (
        <div className="flex gap-2 mb-5 flex-wrap">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-xl text-[13px] font-extrabold transition-all active:scale-95 ${
              filterType === 'all'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30'
                : 'bg-white/80 dark:bg-slate-800/60 text-gray-600 dark:text-slate-300 border border-white/60 dark:border-slate-700/60 hover:border-emerald-300 hover:text-emerald-600'
            }`}
          >
            Tümü
          </button>
          {usedTypes.map(t => (
            <button
              key={t.id}
              onClick={() => setFilterType(t.id)}
              className={`px-4 py-2 rounded-xl text-[13px] font-extrabold transition-all active:scale-95 flex items-center gap-1.5 ${
                filterType === t.id
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-white/80 dark:bg-slate-800/60 text-gray-600 dark:text-slate-300 border border-white/60 dark:border-slate-700/60 hover:border-emerald-300 hover:text-emerald-600'
              }`}
            >
              <span>{t.icon}</span> {t.shortName ?? t.name}
            </button>
          ))}
        </div>
      )}

      {loading && <ListSkeleton count={4} />}

      {!loading && filtered.length > 0 && (
        <div className="space-y-3">{filtered.map(renderCard)}</div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="relative bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl border border-white/50 dark:border-slate-700/60 p-12 text-center shadow-sm overflow-hidden">
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-gradient-to-br from-emerald-200 to-teal-200 opacity-30 blur-3xl" />
          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
              <Inbox className="w-10 h-10 text-white" />
            </div>
            <p className="text-[17px] text-[#0f2847] dark:text-slate-100 font-extrabold mb-2">Henüz çözülmüş test yok</p>
            <p className="text-gray-500 dark:text-slate-400 text-sm mb-5">Bir test çözdüğünde sonucu ve raporu burada birikir.</p>
            <Link
              href="/teacher/my-tests"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[13px] font-extrabold shadow-md hover:-translate-y-0.5 transition-all"
            >
              <ListChecks size={15} /> Testlere Git
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// Basit HTML kaçışı (yazdırma penceresi için)
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
