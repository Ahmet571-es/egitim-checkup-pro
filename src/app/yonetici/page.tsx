import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * /yonetici → akıllı yönlendirme:
 *   - Giriş yapmamış kullanıcı → /login/yonetici (yönetici giriş formu)
 *   - Giriş yapmış admin → /admin/dashboard
 *   - Giriş yapmış school_admin → /school/dashboard
 *   - Diğer roller → /login/yonetici (önce çıkış yapıp yönetici hesabıyla giriş)
 *
 * Eski 1357 satırlık monolitik /yonetici sayfası
 * src/app/yonetici/page.tsx.archived olarak saklı.
 */
export default async function YoneticiRedirect() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login/yonetici');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role === 'admin') {
    redirect('/admin/dashboard');
  }
  if (profile?.role === 'school_admin') {
    redirect('/school/dashboard');
  }

  // Yönetici değilse: çıkış yap, yönetici girişine yönlendir
  await supabase.auth.signOut();
  redirect('/login/yonetici');
}
