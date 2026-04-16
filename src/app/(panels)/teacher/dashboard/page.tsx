/**
 * Öğretmen Dashboard — sade, animasyonlu
 * Hoş geldin + 2 stat kartı + Risk Altındaki Öğrenciler
 */
import { getCurrentProfile } from '@/lib/actions/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import RiskDashboardSection from './RiskDashboardSection';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const profile = await getCurrentProfile();
  const firstName = (profile?.full_name || '').split(' ')[0] || 'Öğretmenim';

  let studentCount = 0;
  let resultCount = 0;

  try {
    const admin = createAdminClient();
    const { count: sc } = await admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'student');
    studentCount = sc || 0;

    const { count: rc } = await admin
      .from('test_results')
      .select('id', { count: 'exact', head: true })
      .not('completed_at', 'is', null);
    resultCount = rc || 0;
  } catch (e) {
    console.error('[teacher dashboard count]', e);
  }

  return (
    <DashboardClient firstName={firstName} studentCount={studentCount} resultCount={resultCount}>
      <RiskDashboardSection />
    </DashboardClient>
  );
}
