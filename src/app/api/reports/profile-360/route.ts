import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildHolisticDeterministicReport } from '@/lib/report/holistic-report';
import type { PatternInsight } from '@/lib/services/correlation';
import type { RiskResult } from '@/lib/services/riskScore';
import type { CareerMatchResult } from '@/lib/services/careerMatch';
import { calculateAge } from '@/lib/utils/age';

export const runtime = 'nodejs';
export const maxDuration = 300;

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

    // Öğrenci adını al (kişiselleştirme için)
    const { data: prof } = await supabase.from('profiles').select('full_name, grade, birth_date').eq('id', user.id).maybeSingle();
    const studentName = prof?.full_name || 'Öğrenci';

    // Deterministik (API'SIZ) 360° holistik profil.
    // risk/örüntü/kariyer client'tan gelir (orijinal davranış), test verileri
    // sunucudan doğrulanır. Güvenli varsayılanlarla korunur.
    const report = buildHolisticDeterministicReport(
      verifiedResults.map(r => ({ test_type: r.test_type, scores: r.scores })),
      { studentName, studentGrade: prof?.grade ?? null, studentAge: calculateAge(prof?.birth_date) },
      risk || { overallScore: 0, label: 'Veri yok', dimensions: [], flags: [] },
      patterns || [],
      careers || { topCareers: [], hollandCode: null, dominantZeka: null, varkStyle: null },
      { hasGeneticReport: false, geneticReportCount: 0 },
    );
    return NextResponse.json({ report });
  } catch {
    return NextResponse.json(
      { report: 'Rapor oluşturulurken bir hata oluştu.' },
      { status: 500 }
    );
  }
}
