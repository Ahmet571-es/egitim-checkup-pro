'use client';

import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import TestPlayer, { type TestSavePayload } from '@/components/test/TestPlayer';

// Öğrenci test sayfası — ortak TestPlayer motorunu kullanır.
// Davranış öncekiyle birebir aynıdır: sonuç test_results tablosuna
// (school_id ile) yazılır ve tamamlanınca gamification (XP/rozet) tetiklenir.
export default function StudentTestPage() {
  const params = useParams();
  const testId = params?.testId as string;

  // Kayıt stratejisi: öğrenci → test_results
  const saver = async ({ takerId, testId, scores, rawAnswers }: TestSavePayload) => {
    const supabase = createClient();

    // Profilden school_id oku (okul-bağlı öğrenciler için)
    let schoolId: string | null = null;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', takerId)
        .maybeSingle();
      schoolId = profile?.school_id ?? null;
    } catch (e) {
      console.warn('[DB save] school_id okunamadı:', e);
    }

    const insertPayload: Record<string, unknown> = {
      student_id: takerId,
      test_type: testId,
      scores,
      raw_answers: rawAnswers,
      completed_at: new Date().toISOString(),
    };
    if (schoolId) insertPayload.school_id = schoolId;

    const res = await supabase.from('test_results').insert(insertPayload);
    return { error: res.error };
  };

  // Kayıt sonrası: gamification (XP + rozet) — öğrenciye özel
  const onSaved = async ({ takerId, testId, mainScore }: { takerId: string; testId: string; mainScore: number }) => {
    const { onTestCompleted } = await import('@/lib/services/testCompletionHook');
    await onTestCompleted(takerId, testId, mainScore);
  };

  return (
    <TestPlayer
      testId={testId}
      saver={saver}
      onSaved={onSaved}
      backHref="/student/my-tests"
    />
  );
}
