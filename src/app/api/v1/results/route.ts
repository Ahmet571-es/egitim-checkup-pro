import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Rate limit: basit in-memory (production'da Redis kullanılmalı)
const rateLimits = new Map<string, { count: number; reset: number }>();

function checkRateLimit(key: string, limit = 100): boolean {
  const now = Date.now();
  const hourMs = 3600000;
  const entry = rateLimits.get(key);

  if (!entry || now > entry.reset) {
    rateLimits.set(key, { count: 1, reset: now + hourMs });
    return true;
  }

  if (entry.count >= limit) return false;
  entry.count += 1;
  return true;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const apiKey = request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!apiKey) {
      return NextResponse.json({
        error: 'API key gerekli. Header: Authorization: Bearer <api_key>'
      }, { status: 401 });
    }

    // Rate limit
    if (!checkRateLimit(apiKey)) {
      return NextResponse.json({
        error: 'Rate limit aşıldı. Saatte 100 istek yapabilirsiniz.'
      }, { status: 429 });
    }

    const supabase = await createClient();

    // API key doğrula
    const crypto = await import('crypto');
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    const { data: keyData } = await supabase
      .from('api_keys')
      .select('school_id, is_active')
      .eq('key_hash', keyHash)
      .single();

    if (!keyData || !keyData.is_active) {
      return NextResponse.json({ error: 'Geçersiz veya devre dışı API key' }, { status: 401 });
    }

    // Parametreler
    const studentId = searchParams.get('student_id');
    const testType = searchParams.get('test_type');
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '50') || 50), 100);

    let query = supabase
      .from('test_results')
      .select('id, student_id, test_type, score, sub_scores, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (studentId) query = query.eq('student_id', studentId);
    if (testType) query = query.eq('test_type', testType);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // API key kullanımını güncelle
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString(), requests_today: ((keyData as unknown as { requests_today?: number }).requests_today || 0) + 1 })
      .eq('key_hash', keyHash);

    return NextResponse.json({
      data,
      meta: {
        count: data?.length || 0,
        limit,
        filters: { student_id: studentId, test_type: testType },
      },
    });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Bir hata oluştu.' }, { status: 500 });
  }
}
