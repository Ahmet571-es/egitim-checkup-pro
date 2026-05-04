'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Baby, BarChart3, ArrowRight, Heart, FileText, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import WelcomeBanner from '@/components/ui/WelcomeBanner';
import TiltStatCard from '@/components/ui/TiltStatCard';
import SectionCard from '@/components/ui/SectionCard';
import EmptyState from '@/components/ui/EmptyState';
import { CardGridSkeleton } from '@/components/ui/Skeleton';
import IntroVideoOverlay from '@/components/ui/IntroVideoOverlay';

interface Child {
  id: string;
  full_name: string;
  email: string;
  student_code: string | null;
  test_count: number;
  last_test_at: string | null;
}

export default function ParentDashboardPage() {
  const [parentName, setParentName] = useState('Veli');
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
    if (profile?.full_name) setParentName(profile.full_name.split(' ')[0]);

    // parent_students ile bağlı çocukları çek
    const { data: links } = await supabase
      .from('parent_students')
      .select('student_id')
      .eq('parent_id', user.id);

    const childIds = (links || []).map((l: { student_id: string }) => l.student_id);
    if (childIds.length === 0) {
      setChildren([]);
      setLoading(false);
      return;
    }

    const { data: kids } = await supabase
      .from('profiles')
      .select('id, full_name, email, student_code')
      .in('id', childIds);

    // Her çocuk için test sayısı ve son test tarihi
    const enriched: Child[] = [];
    for (const k of kids || []) {
      const { data: results } = await supabase
        .from('test_results')
        .select('created_at')
        .eq('student_id', k.id)
        .order('created_at', { ascending: false });
      enriched.push({
        id: k.id,
        full_name: k.full_name,
        email: k.email,
        student_code: k.student_code,
        test_count: (results || []).length,
        last_test_at: results && results[0] ? results[0].created_at : null,
      });
    }

    setChildren(enriched);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const totalTests = children.reduce((sum, c) => sum + c.test_count, 0);
  const activeChildren = children.filter((c) => c.test_count > 0).length;

  return (
    <div>
      <IntroVideoOverlay
        src="/videos/parent-intro.mp4"
        poster="/videos/parent-intro-poster.jpg"
        storageKey="ecup_intro_seen_parent"
      />
      <WelcomeBanner
        role="parent"
        title={`Hoş geldiniz, ${parentName}`}
        subtitle="Çocuğunuzun gelişimini burada takip edebilir, raporlarını görüntüleyebilirsiniz."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 mb-8">
        <TiltStatCard
          icon={Users}
          label="Çocuğunuz"
          value={children.length}
          gradient="from-pink-500 to-rose-500"
          helperText={children.length === 0 ? 'Henüz eklenmedi' : `${activeChildren} aktif`}
        />
        <TiltStatCard
          icon={FileText}
          label="Toplam Test"
          value={totalTests}
          gradient="from-rose-500 to-fuchsia-500"
          helperText="Tamamlanan test sayısı"
        />
        <TiltStatCard
          icon={Heart}
          label="Son Aktivite"
          value={children.find((c) => c.last_test_at) ? '✓' : '—'}
          gradient="from-fuchsia-500 to-pink-600"
          helperText={
            children.find((c) => c.last_test_at)
              ? new Date(children.find((c) => c.last_test_at)!.last_test_at!).toLocaleDateString('tr-TR')
              : 'Henüz test yok'
          }
          disableCountUp
        />
      </div>

      <SectionCard
        icon={Baby}
        title="Çocuklarım"
        gradient="from-pink-500 via-rose-500 to-fuchsia-500"
      >
        {loading ? (
          <CardGridSkeleton count={3} cols={3} />
        ) : children.length === 0 ? (
          <EmptyState
            role="parent"
            icon={Baby}
            title="Henüz çocuk eklenmedi"
            subtitle="Çocuğunuzu eklemek için öğrenci kodunuza ihtiyacınız var. Çocuğunuzun öğretmeninden kodu talep edip 'Çocuklarım' sayfasından ekleyebilirsiniz."
            action={
              <Link
                href="/parent/my-children"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all"
              >
                Çocuk Ekle <ArrowRight className="w-4 h-4" />
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {children.map((c) => (
              <Link
                key={c.id}
                href={`/parent/results?child=${c.id}`}
                className="group relative p-5 rounded-2xl bg-gradient-to-br from-white to-pink-50/40 dark:from-slate-800 dark:to-slate-800/60 border border-pink-200/60 dark:border-slate-700 hover:border-pink-400 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white shadow-md">
                    <Baby className="w-6 h-6" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-pink-400 group-hover:text-pink-600 group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-slate-100 text-base mb-1">{c.full_name}</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">
                  {c.test_count > 0
                    ? `${c.test_count} test tamamlandı`
                    : 'Henüz test tamamlanmadı'}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-gray-400 dark:text-slate-500">
                  <BarChart3 className="w-3 h-3" />
                  <span>
                    {c.last_test_at
                      ? `Son: ${new Date(c.last_test_at).toLocaleDateString('tr-TR')}`
                      : 'Test bekleniyor'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
