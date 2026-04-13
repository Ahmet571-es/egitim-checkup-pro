/**
 * Faz 5: Admin lisans yönetim sayfası (Server Component)
 */
import { createClient } from '@/lib/supabase/server';
import { Key, Search } from 'lucide-react';
import type { School, LicenseStatus } from '@/types';

export const dynamic = 'force-dynamic';

function statusBadge(status: LicenseStatus, daysLeft: number) {
  if (status === 'expired' || daysLeft <= 0) {
    return {
      label: 'Sona Erdi',
      cls: 'bg-red-50 text-red-700 border-red-200',
    };
  }
  if (status === 'trial') {
    return {
      label: 'Deneme',
      cls: 'bg-sky-50 text-sky-700 border-sky-200',
    };
  }
  return {
    label: 'Aktif',
    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
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

  return (
    <div data-test="admin-licenses-page">
      <h1 className="text-2xl font-extrabold text-[#0f2847] mb-2 flex items-center gap-2">
        <Key className="w-6 h-6 text-amber-500" /> Lisanslar
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        Tüm okulların lisans ve kapasite durumunu takip edin.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/40 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Toplam Okul
          </p>
          <p className="text-2xl font-extrabold text-[#0f2847] mt-1">{total}</p>
        </div>
        <div className="bg-sky-50/70 backdrop-blur-xl rounded-2xl border border-sky-200 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-sky-600">
            Deneme
          </p>
          <p className="text-2xl font-extrabold text-sky-700 mt-1">{trialCount}</p>
        </div>
        <div className="bg-emerald-50/70 backdrop-blur-xl rounded-2xl border border-emerald-200 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
            Aktif
          </p>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1">{activeCount}</p>
        </div>
        <div className="bg-red-50/70 backdrop-blur-xl rounded-2xl border border-red-200 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-red-600">
            Sona Erdi
          </p>
          <p className="text-2xl font-extrabold text-red-700 mt-1">{expiredCount}</p>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2 text-sm text-gray-500">
          <Search className="w-4 h-4" />
          <span>{total} okul listeleniyor</span>
        </div>

        {error && (
          <div className="p-5 text-sm text-red-600">
            Hata: {error.message}
          </div>
        )}

        {total === 0 && !error && (
          <div className="p-10 text-center text-sm text-gray-400">
            Henüz kayıtlı okul yok.
          </div>
        )}

        {total > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/70">
                <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  <th className="px-5 py-3">Okul</th>
                  <th className="px-3 py-3">Kod</th>
                  <th className="px-3 py-3">Durum</th>
                  <th className="px-3 py-3">Bitiş</th>
                  <th className="px-3 py-3">Kalan</th>
                  <th className="px-3 py-3">Kapasite</th>
                  <th className="px-5 py-3">E-posta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {schools.map((s) => {
                  const d = diffDays(s.license_end_date);
                  const badge = statusBadge(s.license_status, d);
                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-sky-50/30 transition-colors"
                      data-test={`license-row-${s.code}`}
                    >
                      <td className="px-5 py-3 font-semibold text-[#0f2847]">
                        {s.name}
                      </td>
                      <td className="px-3 py-3 text-gray-500 font-mono text-[12px]">
                        {s.code}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-gray-600 text-[12px]">
                        {s.license_end_date
                          ? new Date(s.license_end_date).toLocaleDateString('tr-TR')
                          : '—'}
                      </td>
                      <td className="px-3 py-3 text-gray-600 text-[12px]">
                        {d > 0 ? `${d} gün` : '—'}
                      </td>
                      <td className="px-3 py-3 text-gray-600 text-[12px]">
                        {s.student_count ?? 0}/{s.max_students}
                      </td>
                      <td className="px-5 py-3 text-gray-500 text-[12px]">
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
    </div>
  );
}
