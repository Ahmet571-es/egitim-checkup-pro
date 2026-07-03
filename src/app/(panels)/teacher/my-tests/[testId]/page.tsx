'use client';

import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import TestPlayer, { type TestSavePayload } from '@/components/test/TestPlayer';

// Öğretmen test sayfası — ortak TestPlayer motorunu kullanır.
// Öğretmenin çözdüğü sonuç teacher_test_results tablosuna yazılır:
// öğrenci verisine, sınıf istatistiklerine ve gamification'a KARIŞMAZ.
// Sonuç yalnızca testi çözen öğretmene görünür (RLS ile korunur).
export default function TeacherTestPage() {
  const params = useParams();
  const testId = params?.testId as string;

  // Kayıt stratejisi: öğretmen → teacher_test_results
  const saver = async ({ takerId, testId, mainResult, report, scores, rawAnswers }: TestSavePayload) => {
    const supabase = createClient();
    const res = await supabase.from('teacher_test_results').insert({
      teacher_id: takerId,
      test_type: testId,
      main_result: mainResult,
      report,
      scores,
      raw_answers: rawAnswers,
      completed_at: new Date().toISOString(),
    });
    return { error: res.error };
  };

  // onSaved geçilmez → öğretmen için XP/rozet/gamification tetiklenmez.
  return (
    <TestPlayer
      testId={testId}
      saver={saver}
      backHref="/teacher/my-tests"
    />
  );
}
