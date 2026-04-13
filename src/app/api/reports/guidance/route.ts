import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { collectGuidanceReportData, generateGuidanceReportHTML } from '@/lib/services/guidanceReport';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('school_id, role')
      .eq('id', user.id)
      .single();

    if (!profile?.school_id) {
      return NextResponse.json({ error: 'Okul bilgisi bulunamadı' }, { status: 400 });
    }

    // Sadece admin, school_admin ve teacher erişebilir
    if (!['admin', 'school_admin', 'teacher'].includes(profile.role)) {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });
    }

    const data = await collectGuidanceReportData(profile.school_id, supabase);
    const html = generateGuidanceReportHTML(data);

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="rehberlik-raporu-${new Date().toISOString().split('T')[0]}.html"`,
      },
    });
  } catch (error) {
    console.error('Guidance report error:', error);
    return NextResponse.json({ error: 'Rapor oluşturulamadı' }, { status: 500 });
  }
}
