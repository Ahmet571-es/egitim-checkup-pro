import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateAIReport } from '@/lib/ai/claude-client';



export const runtime = "nodejs";
export const maxDuration = 300;
function sanitizeInput(text: string): string {
  return text
    .replace(/`/g, '')
    .replace(/ignore previous instructions/gi, '')
    .replace(/system prompt/gi, '')
    .replace(/you are now/gi, '')
    .slice(0, 500);
}

const DAILY_LIMIT = 10;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

    // Öğretmen mi?
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['teacher', 'admin', 'school_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Bu özellik öğretmenler içindir' }, { status: 403 });
    }

    const { question } = await request.json();
    if (!question) return NextResponse.json({ error: 'Soru gerekli' }, { status: 400 });
    const cleanQuestion = sanitizeInput(question);

    // Günlük limit (basit)
    const today = new Date().toISOString().split('T')[0];
    const { data: usage } = await supabase
      .from('ai_chat_usage')
      .select('id, message_count')
      .eq('student_id', user.id)
      .eq('usage_date', today)
      .maybeSingle();

    if (usage && usage.message_count >= DAILY_LIMIT) {
      return NextResponse.json({ error: `Günlük ${DAILY_LIMIT} sorgu limitine ulaştınız.` }, { status: 429 });
    }

    // Kullanımı artır
    if (usage) {
      await supabase.from('ai_chat_usage').update({ message_count: usage.message_count + 1 }).eq('id', usage.id);
    } else {
      await supabase.from('ai_chat_usage').insert({ student_id: user.id, usage_date: today, message_count: 1 });
    }

    // Öğretmenin öğrenci verilerini getir
    const { data: classes } = await supabase.from('classes').select('id, name').eq('teacher_id', user.id);
    const classIds = (classes || []).map(c => c.id);

    let studentData = '';
    if (classIds.length > 0) {
      const { data: students } = await supabase
        .from('class_students')
        .select('student_id, student:profiles!class_students_student_id_fkey(full_name, grade)')
        .in('class_id', classIds);

      const studentIds = (students || []).map(s => s.student_id);

      const { data: results } = await supabase
        .from('test_results')
        .select('student_id, test_type, score')
        .in('student_id', studentIds);

      // Veriyi özetle
      const studentMap = new Map<string, { name: string; tests: Record<string, number> }>();
      for (const s of (students || [])) {
        const sd = s.student as unknown as { full_name: string } | null;
        studentMap.set(s.student_id, { name: sd?.full_name || '?', tests: {} });
      }
      for (const r of (results || [])) {
        const entry = studentMap.get(r.student_id);
        if (entry) entry.tests[r.test_type] = r.score;
      }

      const lines: string[] = [];
      for (const [, info] of studentMap) {
        const testStr = Object.entries(info.tests).map(([t, s]) => `${t}:${s}`).join(', ');
        lines.push(`- ${info.name}: ${testStr || 'test yok'}`);
      }
      studentData = `Sınıflar: ${(classes || []).map(c => c.name).join(', ')}\nÖğrenciler:\n${lines.join('\n')}`;
    }

    const prompt = `Sen Türkiye'deki bir okulun rehberlik ve veri analiz asistanısın.

ÖĞRETMENİN VERİLERİ:
${studentData || 'Veri bulunamadı'}

ÖĞRETMENİN SORUSU: "${cleanQuestion}"

KURALLAR:
- Türkçe cevap ver
- Somut ve kısa cevap ver
- Varsa isimleri ve skorları belirt
- Önerilerde bulun
- Veri yoksa bunu belirt`;

    const reply = await generateAIReport(prompt);
    return NextResponse.json({ reply, remaining: DAILY_LIMIT - ((usage?.message_count || 0) + 1) });
  } catch (err) {
    console.error('Natural query error:', err);
    return NextResponse.json({ error: 'Bir hata oluştu. Lütfen tekrar deneyin.' }, { status: 500 });
  }
}
