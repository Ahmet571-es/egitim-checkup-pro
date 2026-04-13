import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateAIReport } from '@/lib/ai/claude-client';
import { buildCoachingChatPrompt } from '@/lib/ai/prompts/coaching';

const DAILY_LIMIT = 5;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

    const { message } = await request.json();
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Mesaj boş olamaz' }, { status: 400 });
    }

    // Günlük limit kontrolü
    const today = new Date().toISOString().split('T')[0];
    const { data: usage } = await supabase
      .from('ai_chat_usage')
      .select('id, message_count')
      .eq('student_id', user.id)
      .eq('usage_date', today)
      .single();

    const currentCount = usage?.message_count || 0;
    if (currentCount >= DAILY_LIMIT) {
      return NextResponse.json({
        error: `Günlük ${DAILY_LIMIT} mesaj limitine ulaştın. Yarın tekrar dene!`,
        remaining: 0,
      }, { status: 429 });
    }

    // Kullanımı artır
    if (usage) {
      await supabase
        .from('ai_chat_usage')
        .update({ message_count: currentCount + 1 })
        .eq('id', usage.id);
    } else {
      await supabase
        .from('ai_chat_usage')
        .insert({ student_id: user.id, usage_date: today, message_count: 1 });
    }

    // Test sonuçlarını getir
    const { data: results } = await supabase
      .from('test_results')
      .select('test_type, score')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false });

    const testScores: Record<string, number> = {};
    for (const r of (results || [])) {
      if (!testScores[r.test_type]) {
        testScores[r.test_type] = r.score;
      }
    }

    // AI yanıtı oluştur
    const prompt = buildCoachingChatPrompt(testScores, message.trim());
    const reply = await generateAIReport(prompt);

    return NextResponse.json({
      reply,
      remaining: DAILY_LIMIT - (currentCount + 1),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
