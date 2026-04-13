/**
 * Veli — Test Sonuçları Sayfası — Faz 6
 * Çocuk seçici + test sonuçları + veli raporu modal
 * searchParams is a Promise in Next.js 16
 */
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/actions/auth';
import ParentResultsClient from './ParentResultsClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ child?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const selectedChildId = resolvedParams.child ?? null;

  const profile = await getCurrentProfile();
  if (!profile) return null;

  const supabase = await createClient();

  // Velinin çocuklarını getir
  const { data: parentStudents } = await supabase
    .from('parent_students')
    .select('student_id, profiles!parent_students_student_id_fkey(id, full_name)')
    .eq('parent_id', profile.id);

  const children = (parentStudents ?? []).map(ps => ({
    id: (ps.profiles as unknown as { id: string; full_name: string }).id,
    full_name: (ps.profiles as unknown as { id: string; full_name: string }).full_name,
  }));

  // Seçilen çocuğun test sonuçları
  const activeChildId = selectedChildId && children.find(c => c.id === selectedChildId)
    ? selectedChildId
    : (children[0]?.id ?? null);

  let testResults: {
    id: string;
    test_type: string;
    scores: Record<string, unknown>;
    completed_at: string;
    ai_report: string | null;
  }[] = [];

  let integratedReport: {
    teacher_report: string | null;
    student_report: string | null;
    parent_report: string | null;
    generated_at: string | null;
  } | null = null;

  if (activeChildId) {
    const { data: results } = await supabase
      .from('test_results')
      .select('id, test_type, scores, completed_at, ai_report')
      .eq('student_id', activeChildId)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false });

    testResults = (results ?? []) as typeof testResults;

    // Entegre raporu kontrol et
    const { data: ir } = await supabase
      .from('integrated_reports')
      .select('teacher_report, student_report, parent_report, generated_at')
      .eq('student_id', activeChildId)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    integratedReport = ir;
  }

  return (
    <ParentResultsClient
      children={children}
      activeChildId={activeChildId}
      testResults={testResults}
      integratedReport={integratedReport}
    />
  );
}
