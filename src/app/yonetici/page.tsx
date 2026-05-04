import { redirect } from 'next/navigation';

/**
 * /yonetici → /admin/dashboard yönlendirmesi
 *
 * Eski /yonetici sayfası (1357 satırlık monolitik panel) artık kullanılmıyor.
 * Yeni yönetici paneli (panels)/admin/ altında 6 ayrı klasör sayfası halinde:
 *   - /admin/students/pending      (Onay Bekleyen Öğrenciler)
 *   - /admin/students/registered   (Kayıtlı Öğrenciler)
 *   - /admin/teachers/pending      (Onay Bekleyen Öğretmenler)
 *   - /admin/teachers/registered   (Kayıtlı Öğretmenler)
 *   - /admin/parents/pending       (Onay Bekleyen Veliler)
 *   - /admin/parents/registered    (Kayıtlı Veliler)
 *
 * Eski URL'ye gelen kullanıcılar yeni dashboard'a yönlendirilir.
 * Eski sayfa src/app/yonetici/page.tsx.archived olarak saklanıyor.
 */
export default function YoneticiRedirect() {
  redirect('/admin/dashboard');
}
