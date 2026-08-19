import type { SupabaseClient, User } from '@supabase/supabase-js';

/**
 * Auth kullanıcı listeleme yardımcıları — ÖLÇEK GÜVENLİ.
 *
 * KRİTİK: `admin.auth.admin.listUsers({ perPage: 1000 })` TEK ÇAĞRIDA en fazla
 * ~1000 kullanıcı döndürür ve fazlasını SESSİZCE ATAR. 1000+ kullanıcıda bu:
 *   - eksik dashboard istatistikleri,
 *   - "öğrenci bulunamadı" hataları,
 *   - kırık şifre sıfırlama (kullanıcı bulunamıyor)
 * demektir. Bir okul birkaç yüz öğrenci → 3-4 okulla tavana çarpılır.
 *
 * Bu modül sayfaları TÜKENENE KADAR gezer.
 */

const PER_PAGE = 200;
const MAX_PAGES = 100; // 20.000 kullanıcı güvenlik tavanı (sonsuz döngü koruması)

/** TÜM auth kullanıcılarını sayfalayarak getirir. */
export async function listAllAuthUsers(admin: SupabaseClient): Promise<User[]> {
  const all: User[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PER_PAGE });
    if (error) {
      console.error('[listAllAuthUsers] sayfa %d hatası: %s', page, error.message);
      break;
    }
    const users = data?.users ?? [];
    all.push(...users);
    if (users.length < PER_PAGE) break; // son sayfa
  }
  return all;
}

/**
 * listAllAuthUsers'ın KATI sürümü — hata olursa boş liste dönmek yerine FIRLATIR.
 *
 * NEDEN AYRI FONKSİYON:
 *   Yukarıdaki `listAllAuthUsers` hatayı yutup elindeki kadarını döndürür.
 *   Bu davranış dashboard/panel gibi "kısmi veri hiç yoktan iyidir" durumları
 *   için bilinçli bir tercih ve 20+ çağrı noktası buna güveniyor — dolayısıyla
 *   onu değiştirmiyoruz.
 *
 *   Ama Supabase TAMAMEN erişilemezken de aynı fonksiyon boş liste döndürüyor
 *   ve çağıran taraf bunu "kayıt yok" sanıyor. 18 Ağustos 2026 kesintisinde
 *   tam olarak bu oldu: veritabanı haftalarca kapalıyken /api/public/teachers
 *   "200 + boş liste" dönüp kesintiyi görünmez kıldı.
 *
 *   Kesintiyi kayıt yokluğundan ayırt etmesi gereken yerler (health check,
 *   public endpoint'ler) bu katı sürümü kullanmalı.
 */
export async function listAllAuthUsersStrict(admin: SupabaseClient): Promise<User[]> {
  const all: User[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PER_PAGE });
    if (error) {
      throw new Error(`auth.listUsers sayfa ${page} başarısız: ${error.message}`);
    }
    const users = data?.users ?? [];
    all.push(...users);
    if (users.length < PER_PAGE) break; // son sayfa
  }
  return all;
}

/**
 * Tek kullanıcıyı e-postaya göre bulur.
 *
 * 1) profiles.email fast-path (ölçeklenir) → id → auth'tan tam kaydı çek
 * 2) Fallback: sayfaları tarar ama BULUNCA durur (short-circuit)
 *
 * Tüm kullanıcıları belleğe yükleyip filtrelemekten çok daha verimli.
 */
export async function findAuthUserByEmail(
  admin: SupabaseClient,
  email: string,
): Promise<User | null> {
  const target = email.toLowerCase().trim();
  if (!target) return null;

  // 1) profiles fast-path
  try {
    const { data: profileMatch } = await admin
      .from('profiles')
      .select('id')
      .eq('email', target)
      .maybeSingle();
    if (profileMatch?.id) {
      const { data: authData } = await admin.auth.admin.getUserById(profileMatch.id);
      if (authData?.user?.email?.toLowerCase() === target) {
        return authData.user;
      }
    }
  } catch (e) {
    console.warn('[findAuthUserByEmail] profiles fast-path başarısız:', e);
  }

  // 2) Fallback: paginated scan (profiles senkronsuz / orphan durumları)
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PER_PAGE });
    if (error) {
      console.error('[findAuthUserByEmail] sayfa %d hatası: %s', page, error.message);
      break;
    }
    const users = data?.users ?? [];
    const found = users.find((u) => u.email?.toLowerCase() === target);
    if (found) return found;
    if (users.length < PER_PAGE) break;
  }
  return null;
}
