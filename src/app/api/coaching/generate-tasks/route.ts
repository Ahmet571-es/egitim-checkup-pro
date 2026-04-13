import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateAIReport } from '@/lib/ai/claude-client';
import { buildCoachingTaskPrompt } from '@/lib/ai/prompts/coaching';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

    // Öğrencinin test sonuçlarını getir
    const { data: results } = await supabase
      .from('test_results')
      .select('test_type, score')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false });

    if (!results || results.length === 0) {
      return NextResponse.json({ error: 'Henüz test sonucunuz yok' }, { status: 400 });
    }

    // Her test için en son skoru al
    const testScores: Record<string, number> = {};
    for (const r of results) {
      if (!testScores[r.test_type]) {
        testScores[r.test_type] = r.score;
      }
    }

    // AI ile görev oluştur
    const prompt = buildCoachingTaskPrompt(testScores);
    const response = await generateAIReport(prompt);

    // JSON parse
    let tasks;
    try {
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      tasks = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: 'AI yanıtı parse edilemedi', raw: response }, { status: 500 });
    }

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json({ error: 'Görev oluşturulamadı' }, { status: 500 });
    }

    // Hafta numarası
    const now = new Date();
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNumber = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);

    // Mevcut hafta görevlerini sil
    await supabase
      .from('coaching_tasks')
      .delete()
      .eq('student_id', user.id)
      .eq('week_number', weekNumber);

    // Yeni görevleri kaydet
    const dueDate = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    const validCategories = ['nefes_gevşeme', 'çalışma_tekniği', 'dikkat_egzersizi', 'motivasyon', 'sosyal_beceri'];

    const rows = tasks.slice(0, 5).map((t: { task_text: string; category: string; source_test?: string; difficulty?: number }) => ({
      student_id: user.id,
      task_text: t.task_text,
      category: validCategories.includes(t.category) ? t.category : 'motivasyon',
      source_test: t.source_test || null,
      difficulty: Math.min(3, Math.max(1, t.difficulty || 1)),
      due_date: dueDate,
      week_number: weekNumber,
    }));

    const { data: inserted, error } = await supabase
      .from('coaching_tasks')
      .insert(rows)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ tasks: inserted });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
