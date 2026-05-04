/**
 * Öğretmen Dashboard — sade, animasyonlu
 * Hoş geldin + 2 stat kartı
 *
 * FAZ 2D: Öğrenci sayısı = sadece bu öğretmene atanmış olanlar
 * (user_metadata.assigned_teacher_id = user.id)
 * Test sonuçları da sadece atanmış öğrencilerin testleri sayılır.
 */
import { getCurrentProfile } from '@/lib/actions/auth';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import DashboardClient from './DashboardClient';
import IntroVideoOverlay from '@/components/ui/IntroVideoOverlay';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const profile = await getCurrentProfile();
  const firstName = (profile?.full_name || '').split(' ')[0] || 'Öğretmenim';

  let studentCount = 0;
  let resultCount = 0;
  let teacherId: string | null = null;

  try {
    // Giriş yapan öğretmenin id'si
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    teacherId = user?.id ?? null;

    if (teacherId) {
      const admin = createAdminClient();

      // Atanmış öğrencileri auth.users metadata'dan bul
      const { data: { users: authUsers } } = await admin.auth.admin.listUsers({ perPage: 1000 });
      const myStudentIds = (authUsers || [])
        .filter((u) => {
          const meta = (u.user_metadata || {}) as Record<string, unknown>;
          return (meta.assigned_teacher_id as string | undefined) === teacherId
            && (meta.role as string) === 'student';
        })
        .map((u) => u.id);

      studentCount = myStudentIds.length;

      // Test sonuçları — sadece atanmış öğrencilerin tamamlanmış testleri
      if (myStudentIds.length > 0) {
        const { count: rc } = await admin
          .from('test_results')
          .select('id', { count: 'exact', head: true })
          .in('student_id', myStudentIds)
          .not('completed_at', 'is', null);
        resultCount = rc || 0;
      }
    }
  } catch (e) {
    console.error('[teacher dashboard count]', e);
  }

  return (
    <>
      <IntroVideoOverlay
        src="/videos/teacher-intro.mp4"
        poster="/videos/teacher-intro-poster.jpg"
        storageKey="ecup_intro_seen_teacher"
      />
      <DashboardClient firstName={firstName} studentCount={studentCount} resultCount={resultCount} teacherId={teacherId} />
    </>
  );
}
