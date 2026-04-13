/**
 * Admin Dashboard — Faz C: platform stats
 */
import Link from 'next/link';
import { Building2, Users, GraduationCap, FileCheck2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const supabase = await createClient();

  const [schoolsRes, usersRes, teachersRes, resultsRes] = await Promise.all([
    supabase.from('schools').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'teacher')
      .eq('is_active', true),
    supabase.from('test_results').select('id', { count: 'exact', head: true }),
  ]);

  const stats = [
    {
      label: 'Toplam Okul',
      value: schoolsRes.count || 0,
      href: '/admin/schools',
      icon: Building2,
      gradient: 'from-amber-500 to-orange-600',
    },
    {
      label: 'Toplam Kullanıcı',
      value: usersRes.count || 0,
      href: '/admin/users',
      icon: Users,
      gradient: 'from-sky-500 to-blue-600',
    },
    {
      label: 'Toplam Öğretmen',
      value: teachersRes.count || 0,
      href: '/admin/users',
      icon: GraduationCap,
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      label: 'Tamamlanan Test',
      value: resultsRes.count || 0,
      href: '/admin/results',
      icon: FileCheck2,
      gradient: 'from-violet-500 to-purple-600',
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-[#0f2847] mb-1">Platform Yönetimi</h1>
      <p className="text-gray-500 text-sm mb-6">Genel bakış</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.label}
              href={s.href}
              className="group bg-white/80 backdrop-blur-xl rounded-2xl border border-white/40 p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <div
                className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.gradient} text-white flex items-center justify-center shadow-lg mb-3`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                {s.label}
              </p>
              <p className="text-2xl font-extrabold text-[#0f2847] mt-1">{s.value}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
