import { Building2, Users, GraduationCap, FileCheck2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import TiltStatCard from '@/components/ui/TiltStatCard';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const supabase = await createClient();
  const { count } = await supabase.from('schools').select('id', { count: 'exact', head: true });

  const stats = [
    { label: 'Test', value: count || 0, icon: Building2, gradient: 'from-amber-500 to-orange-600', helperText: 'Test' },
  ];

  return (
    <div>
      <h1>Test Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        {stats.map((s, idx) => (
          <TiltStatCard
            key={s.label}
            label={s.label}
            value={s.value}
            gradient={s.gradient}
            icon={s.icon}
            delay={100 + idx * 80}
            helperText={s.helperText}
          />
        ))}
      </div>
    </div>
  );
}
