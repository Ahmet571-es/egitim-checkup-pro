/**
 * Admin Lisans Yönetimi — Premium
 */
import { createClient } from '@/lib/supabase/server';
import { Key, Building, Clock, CheckCircle2, AlertCircle, TrendingUp, Hash, Calendar, Users } from 'lucide-react';
import type { School, LicenseStatus } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';

export const dynamic = 'force-dynamic';

function statusConfig(status: LicenseStatus, daysLeft: number) {
  if (status === 'expired' || daysLeft <= 0) {
    return {
      label: 'Sona Erdi',
      cls: 'bg-red-50 text-red-700 border-red-200',
      icon: AlertCircle,
    };
  }
  if (status === 'trial') {
    return {
      label: 'Deneme',
      cls: 'bg-sky-50 text-sky-700 border-sky-200',
      icon: Clock,
    };
  }
  return {
    label: 'Aktif',
    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle2,
  };
}

function diffDays(endIso: string | null): number {
  if (!endIso) return 0;
  return Math.ceil((new Date(endIso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

interface SchoolWithCount extends School {
  student_count?: number;
}

export default async function Page() {
  const supabase = await createClient();

  const { data: schoolsRaw, error } = await supabase
    .from('schools')
    .select('*')
    .order('created_at', { ascending: false });

  const schools: SchoolWithCount[] = (schoolsRaw as School[] | null) || [];

  if (schools.length > 0) {
    await Promise.all(
      schools.map(async (s) => {
        const { count } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('school_id', s.id)
          .eq('role', 'student')
          .eq('is_active', true);
        s.student_count = count || 0;
      }),
    );
  }

  const total = schools.length;
  const trialCount = schools.filter((s) => s.license_status === 'trial').length;
  const activeCount = schools.filter((s) => s.license_status === 'active').length;
  const expiredCount = schools.filter(
    (s) => s.license_status === 'expired' || diffDays(s.license_end_date) <= 0,
  ).length;

  const statCards = [
    { label: 'Toplam Okul', value: total, icon: Building, gradient: 'from-amber-500 to-orange-600', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    { label: 'Deneme', value: trialCount, icon: Clock, gradient: 'from-sky-500 to-blue-600', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
    { label: 'Aktif', value: activeCount, icon: CheckCircle2, gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    { label: 'Sona Erdi', value: expiredCount, icon: AlertCircle, gradient: 'from-red-500 to-rose-600', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  ];

  return (
    <div data-test="admin-licenses-page">
      <PageHeader
        role="admin"
        icon={Key}
        title="Lisans Yönetimi"
        subtitle="Tüm okulların lisans ve kapasite durumunu takip edin"
        count={total}
        countLabel="okul"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 grid-stagger">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="relative bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-slate-700/60 p-4 sm:p-5 shadow-sm overflow-hidden group hover:shadow-lg transition-all"
            >
              <div className={`absolute -top-8 -right-8 w-28 h-28 rounded-full bg-gradient-to-br ${s.gradient} opacity-10 blur-2xl group-hover:opacity-25 transition-opacity`} />
              <div className="relative flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.gradient} text-white flex items-center justify-center shadow-md shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-[11px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider">{s.label}</p>
                  <p className="text-xl sm:text-2xl font-extrabold text-[#0f2847] dark:text-slate-100 tabular-nums">{s.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-slate-700/60 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700/60 flex items-center gap-2 text-sm bg-gradient-to-r from-amber-50/50 to-orange-50/30">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-sm">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-[#0f2847] dark:text-slate-100">{total} okul listeleniyor</span>
        </div>

        {error && (
          <div className="p-5 text-sm text-red-600">Hata: {error.message}</div>
        )}

        {total === 0 && !error && (
          <div className="p-8">
            <EmptyState
              role="admin"
              icon={Building}
              title="Henüz okul yok"
              subtitle="Okul Yönetimi sayfasından ilk okulunuzu ekleyin."
            />
          </div>
        )}

        {total > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 border-b border-amber-100">
                <tr className="text-left text-[11px] font-extrabold uppercase tracking-wider text-[#0f2847] dark:text-slate-100">
                  <th className="px-5 py-3.5">Okul</th>
                  <th className="px-3 py-3.5">Kod</th>
                  <th className="px-3 py-3.5">Durum</th>
                  <th className="px-3 py-3.5">Bitiş</th>
                  <th className="px-3 py-3.5">Kalan</th>
                  <th className="px-3 py-3.5">Kapasite</th>
                  <th className="px-5 py-3.5">E-posta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {schools.map((s, idx) => {
                  const d = diffDays(s.license_end_date);
                  const cfg = statusConfig(s.license_status, d);
                  const StatusIcon = cfg.icon;
                  const capPct = s.max_students > 0 ? Math.min(100, ((s.student_count ?? 0) / s.max_students) * 100) : 0;
                  const capColor = capPct >= 90 ? 'bg-red-500' : capPct >= 70 ? 'bg-amber-500' : 'bg-emerald-500';
                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-amber-50/30 transition-colors row-enter"
                      data-test={`license-row-${s.code}`}
                      style={{ animationDelay: `${idx * 20}ms` }}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shrink-0">
                            <Building className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-[#0f2847] dark:text-slate-100">{s.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-gray-500 dark:text-slate-400 font-mono text-[12px]">
                        <div className="flex items-center gap-1">
                          <Hash className="w-3 h-3 text-gray-400 dark:text-slate-500" />
                          {s.code}
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10.5px] font-bold ${cfg.cls}`}>
                          <StatusIcon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-gray-600 dark:text-slate-300 text-[12.5px]">
                        {s.license_end_date ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-400 dark:text-slate-500" />
                            {new Date(s.license_end_date).toLocaleDateString('tr-TR')}
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-3 py-4 text-[12.5px]">
                        {d > 0 ? (
                          <span className={`font-bold ${d <= 7 ? 'text-red-600' : d <= 30 ? 'text-amber-600' : 'text-gray-700 dark:text-slate-300'}`}>
                            {d} gün
                          </span>
                        ) : (
                          <span className="text-red-500 font-bold">Bitti</span>
                        )}
                      </td>
                      <td className="px-3 py-4 text-[12.5px]">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-gray-600 dark:text-slate-300">
                            <Users className="w-3 h-3 text-gray-400 dark:text-slate-500" />
                            <span className="font-semibold">{s.student_count ?? 0}/{s.max_students}</span>
                          </div>
                          <div className="h-1 w-20 bg-gray-100 dark:bg-slate-700/60 rounded-full overflow-hidden">
                            <div className={`h-full ${capColor} rounded-full transition-all`} style={{ width: `${capPct}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-500 dark:text-slate-400 text-[12px]">
                        {s.email || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
