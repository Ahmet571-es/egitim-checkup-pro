import { redirect } from 'next/navigation';

/**
 * /yonetici → /login/yonetici basit yönlendirme
 *
 * Eski 1357 satırlık /yonetici sayfası src/app/yonetici/page.tsx.archived
 * olarak saklı.
 *
 * Server-side auth check yapmıyoruz — sayfanın kendisi giriş formu olduğu
 * için login değilse zaten oraya gitmeli. Login olmuş kullanıcılar
 * /login/yonetici'de role'lerine göre uygun panele yönlendirilir.
 */
export default function YoneticiRedirect() {
  redirect('/login/yonetici');
}
