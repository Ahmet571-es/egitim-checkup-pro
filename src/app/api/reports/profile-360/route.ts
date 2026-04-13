import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateAIReport } from '@/lib/ai/claude-client';
import { TEST_LABELS } from '@/lib/services/correlation';
import type { PatternInsight } from '@/lib/services/correlation';
import type { RiskResult } from '@/lib/services/riskScore';
import type { CareerMatchResult } from '@/lib/services/careerMatch';

interface RequestBody {
  results: Array<{ test_type: string; scores: Record<string, unknown> }>;
  patterns: PatternInsight[];
  risk: RiskResult | null;
  careers: CareerMatchResult | null;
}

export async function POST(request: NextRequest) {
  try {
    // Auth kontrolü
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
    }

    const body: RequestBody = await request.json();
    const { patterns, risk, careers } = body;

    // Sunucu tarafında gerçek test sonuçlarını çek — client verisine güvenme
    const { data: dbResults } = await supabase
      .from('test_results')
      .select('test_type, scores, score')
      .eq('student_id', user.id)
      .not('completed_at', 'is', null)
      .order('created_at', { ascending: false });

    if (!dbResults || dbResults.length === 0) {
      return NextResponse.json({ error: 'Tamamlanmış test sonucu bulunamadı.' }, { status: 400 });
    }

    // Her test tipi için en son sonucu al
    const latestResults = new Map<string, { test_type: string; scores: Record<string, unknown> }>();
    for (const r of dbResults) {
      if (!latestResults.has(r.test_type)) {
        latestResults.set(r.test_type, { test_type: r.test_type, scores: r.scores || {} });
      }
    }
    const verifiedResults = Array.from(latestResults.values());

    // Test verilerini formatla (sunucu doğrulamalı veriler)
    const testSummary = verifiedResults
      .map(r => {
        const label = TEST_LABELS[r.test_type] || r.test_type;
        return `### ${label}\n\`\`\`json\n${JSON.stringify(r.scores, null, 2)}\n\`\`\``;
      })
      .join('\n\n');

    // Korelasyon bulgularını formatla
    const patternSummary = patterns.length > 0
      ? patterns.map(p => `- **${p.title}** (${p.severity}): ${p.description}`).join('\n')
      : 'Belirgin korelasyon bulgusu tespit edilmedi.';

    // Risk özeti
    const riskSummary = risk
      ? `Risk Skoru: ${risk.overallScore}/100 (${risk.label})\nBoyutlar: ${risk.dimensions.map(d => `${d.name}: ${d.available ? d.score : 'veri yok'}`).join(', ')}\nUyarılar: ${risk.flags.map(f => f.message).join('; ') || 'Yok'}`
      : 'Risk verisi mevcut değil.';

    // Kariyer özeti
    const careerSummary = careers && careers.topCareers.length > 0
      ? `Holland Kodu: ${careers.hollandCode || 'N/A'}\nBaskın Zekâ: ${careers.dominantZeka || 'N/A'}\nÖğrenme Stili: ${careers.varkStyle || 'N/A'}\nÖnerilen Kariyerler: ${careers.topCareers.map(c => `${c.career} (%${c.matchScore})`).join(', ')}`
      : 'Kariyer verisi mevcut değil.';

    const prompt = `# ROL

Sen, Türkiye'nin önde gelen eğitim psikolojisi merkezlerinde uzmanlaşmış bir Klinik Eğitim Psikoloğusun.
Bu öğrencinin 360° bütüncül profil raporunu hazırla.

# TEST VERİLERİ

${testSummary}

# ÇAPRAZ KORELASYON BULGULARI

${patternSummary}

# RİSK DEĞERLENDİRMESİ

${riskSummary}

# KARİYER EŞLEŞTİRMESİ

${careerSummary}

# RAPOR FORMATI

Lütfen şu bölümleri içeren, yaklaşık 800-1000 kelimelik Türkçe bir rapor yaz:

1. **Genel Profil Özeti**: Tüm test sonuçlarının sentezi
2. **Güçlü Yönler**: Öğrencinin öne çıkan alanları (verilere dayalı)
3. **Gelişim Alanları**: Dikkat gerektiren noktalar
4. **Çapraz Analiz**: Testler arası korelasyonlar ve bağlantılar
5. **Risk Değerlendirmesi**: Risk durumu ve öneriler
6. **Kariyer Yönlendirmesi**: Test sonuçlarına dayalı kariyer önerileri
7. **Eylem Planı**: Somut, uygulanabilir 5 öneri

Her yorumu parantez içinde kaynak test ve puan ile destekle.
Abartısız, dengeli, bilimsel bir dil kullan.
Tıbbi tanı terimi kullanma.`;

    const report = await generateAIReport(prompt);
    return NextResponse.json({ report });
  } catch {
    return NextResponse.json(
      { report: 'Rapor oluşturulurken bir hata oluştu.' },
      { status: 500 }
    );
  }
}
