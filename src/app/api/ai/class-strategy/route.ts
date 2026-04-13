import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateAIReport } from '@/lib/ai/claude-client';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

    const { classId } = await request.json();
    if (!classId || typeof classId !== 'string' || classId.length > 50) return NextResponse.json({ error: 'Geçersiz classId' }, { status: 400 });

    // Sınıf bilgisi
    const { data: classData } = await supabase
      .from('classes')
      .select('name, grade')
      .eq('id', classId)
      .eq('teacher_id', user.id)
      .single();

    if (!classData) return NextResponse.json({ error: 'Sınıf bulunamadı' }, { status: 404 });

    // Öğrenci test sonuçları
    const { data: students } = await supabase
      .from('class_students')
      .select('student_id')
      .eq('class_id', classId);

    const studentIds = (students || []).map(s => s.student_id);

    const { data: results } = await supabase
      .from('test_results')
      .select('test_type, score')
      .in('student_id', studentIds);

    // Test ortalamalarını hesapla
    const testAverages: Record<string, { total: number; count: number }> = {};
    for (const r of (results || [])) {
      if (!testAverages[r.test_type]) testAverages[r.test_type] = { total: 0, count: 0 };
      testAverages[r.test_type].total += r.score;
      testAverages[r.test_type].count += 1;
    }

    const averageSummary = Object.entries(testAverages)
      .filter(([, data]) => data.count > 0)
      .map(([test, data]) => `- ${test}: ortalama ${Math.round(data.total / data.count)}/100 (${data.count} öğrenci)`)
      .join('\n');

    const prompt = `Sen deneyimli bir eğitim danışmanısın. Türkiye'deki bir okulun ${classData.name} sınıfı için öğretim stratejisi önerisi hazırlıyorsun.

SINIF: ${classData.name} (${classData.grade || '?'}. sınıf, ${studentIds.length} öğrenci)

TEST ORTALAMALARI:
${averageSummary || 'Henüz test verisi yok'}

GÖREV:
1. Sınıfın güçlü ve zayıf yönlerini 2-3 cümleyle özetle
2. Sınıf profiline göre 5 somut öğretim stratejisi öner
3. Her strateji için uygulama adımını belirt
4. Öncelikli müdahale gerektiren alanı vurgula

KURALLAR:
- Türkçe, sade dil
- Somut ve uygulanabilir öneriler
- MEB müfredatıyla uyumlu
- Öğretmenin hemen uygulayabileceği pratik adımlar`;

    const reply = await generateAIReport(prompt);
    return NextResponse.json({ strategy: reply, className: classData.name });
  } catch (err) {
    console.error('Class strategy error:', err);
    return NextResponse.json({ error: 'Strateji oluşturulurken bir hata oluştu.' }, { status: 500 });
  }
}
