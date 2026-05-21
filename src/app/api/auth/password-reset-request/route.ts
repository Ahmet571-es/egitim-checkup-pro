import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/auth/password-reset-request
 * Body: { email }
 *
 * Manuel şifre sıfırlama talebi oluşturur.
 * Kullanıcı "Şifremi unuttum" butonuna basar → bu endpoint çağrılır →
 * password_reset_requests tablosuna yeni satır düşer →
 * yönetici /admin/password-resets sayfasından görür → şifre değiştirir.
 *
 * Public endpoint (auth gerekmez). User enumeration koruması:
 * email sistemde olmasa bile success döner.
 */

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Görünmez/tehlikeli karakter temizliği (login sayfası ile aynı pattern).
 * Kopyala-yapıştırla gelen zero-width, smart-quote, boşluk, kontrol karakterleri
 * silinir. Olmazsa exact email match kaçıyor → talep sessiz fail oluyordu.
 */
function cleanEmail(raw: string): string {
  return raw
    .replace(/[\u200B-\u200D\uFEFF]/g, '')         // zero-width
    .replace(/[\u201C\u201D\u2018\u2019"']/g, '')  // smart + düz tırnaklar
    .replace(/\s+/g, '')                            // her türlü boşluk
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1F\x7F]/g, '')                // kontrol karakterleri
    .toLowerCase();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { email?: string };
    const email = cleanEmail((body.email ?? '').toString());

    if (!email || !EMAIL_RX.test(email)) {
      return NextResponse.json({ error: 'Geçerli bir e-posta girin.' }, { status: 400 });
    }

    const admin = createAdminClient();

    // ════════════════════════════════════════════════════════════════════
    // Kullanıcı arama — ÜÇ KATMANLI (robust):
    //
    //   1. profiles.email lookup (en hızlı, ölçeklenir)
    //   2. Eşleşme bulunursa auth.users'dan doğrula (ID üzerinden)
    //   3. Bulamazsak listUsers'a düş, sayfalı tarama yap (defensif)
    //
    // Önceki kod sadece listUsers({perPage:1000}) kullanıyordu — platform
    // 1000+ kullanıcıya çıktığında 2.+ sayfadaki kullanıcılar SESSİZCE
    // bulunamıyor, yanlışlıkla orphan olarak işaretleniyordu (veya eski
    // kodda hiç kaydedilmiyordu).
    // ════════════════════════════════════════════════════════════════════

    type AuthUser = { id: string; email?: string | null };
    let matchedUser: AuthUser | null = null;

    // 1) profiles tablosundan email ile ara
    try {
      const { data: profileMatch } = await admin
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (profileMatch?.id) {
        // 2) auth.users'dan doğrula (profiles.email bazen out-of-sync olabilir)
        const { data: authData } = await admin.auth.admin.getUserById(profileMatch.id);
        if (authData?.user?.email?.toLowerCase() === email) {
          matchedUser = { id: authData.user.id, email: authData.user.email };
        }
      }
    } catch (e) {
      console.warn('[password-reset-request] profiles lookup failed:', e);
    }

    // 3) Fallback: profiles bulamadıysa veya senkron değilse paginated listUsers
    if (!matchedUser) {
      const PER_PAGE = 200;
      const MAX_PAGES = 50; // 10,000 user safety cap
      for (let page = 1; page <= MAX_PAGES; page++) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PER_PAGE });
        if (error || !data?.users?.length) break;

        const found = data.users.find((u) => u.email?.toLowerCase() === email);
        if (found) {
          matchedUser = { id: found.id, email: found.email };
          break;
        }
        if (data.users.length < PER_PAGE) break; // son sayfa
      }
    }

    // ÖNEMLİ: Eşleşen kullanıcı olmasa bile talebi yine de kaydet.
    //
    // ESKİ DAVRANIŞ (BUG): Sessizce başarı dönülüyordu, talep TABLOYA HİÇ
    //   yazılmıyordu. Kullanıcı "Talebim alındı" görüp bekliyor, ama admin
    //   panelinde hiçbir kayıt yok. Tipo / görünmez karakter / yanlış e-posta
    //   nedeniyle kaybolan talepler tespit edilemiyordu (örn: İbrahim ES
    //   Hoca'nın talebi yönetim paneline düşmedi).
    //
    // YENİ DAVRANIŞ: Eşleşmeyen e-postalar da user_id=null ile kaydedilir.
    //   Admin "Eşleşen kullanıcı yok" rozeti ile görür → manuel kontrol eder
    //   (öğretmeni isimle bulur, doğru hesabına şifre atar, bu orphan
    //   talebi de iptal eder).
    //
    // GÜVENLİK: User enumeration koruması bozulmuyor — kullanıcıya dönen
    //   response her iki durumda da aynı ("Talebiniz alındı"). Admin'in
    //   gördüğü kayıt sadece backend tarafında, RLS koruması altında.

    if (!matchedUser) {
      console.log(`[password-reset-request] ${email} → ORPHAN talep (eşleşen user yok)`);

      // Aynı orphan e-postanın zaten bekleyen kaydı varsa duplicate yapma
      const { data: existingOrphan } = await admin
        .from('password_reset_requests')
        .select('id')
        .eq('email', email)
        .is('user_id', null)
        .eq('status', 'pending')
        .limit(1)
        .maybeSingle();

      if (!existingOrphan) {
        const { error: orphanInsertErr } = await admin
          .from('password_reset_requests')
          .insert({
            user_id: null,
            email,
            full_name: null,
            role: null,
            status: 'pending',
            notes: 'Sistemde bu e-posta ile kayıtlı kullanıcı yok — manuel kontrol gerekli (tipo, görünmez karakter veya farklı kayıt e-postası olabilir).',
          });

        if (orphanInsertErr) {
          console.error('[password-reset-request] orphan insert error:', orphanInsertErr.message);
          // Hatayı kullanıcıya yansıtma — yine sessiz başarı (enumeration koruması)
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Talebiniz alındı. Yönetici şifrenizi sıfırladıktan sonra size iletecektir.',
      });
    }

    // Profil bilgilerini al
    const { data: profile } = await admin
      .from('profiles')
      .select('full_name, role')
      .eq('id', matchedUser.id)
      .maybeSingle();

    // Aynı kullanıcının zaten bekleyen talebi varsa duplicate yapma
    const { data: existing } = await admin
      .from('password_reset_requests')
      .select('id, created_at')
      .eq('user_id', matchedUser.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      // Zaten bekleyen talep var — yine başarı dön (kullanıcı çok bastı diye duplicate üretme)
      return NextResponse.json({
        success: true,
        message: 'Talebiniz zaten alındı. Yönetici en kısa sürede sizinle iletişime geçecektir.',
      });
    }

    // Yeni talep oluştur
    const { error: insertErr } = await admin
      .from('password_reset_requests')
      .insert({
        user_id: matchedUser.id,
        email,
        full_name: profile?.full_name ?? null,
        role: profile?.role ?? null,
        status: 'pending',
      });

    if (insertErr) {
      console.error('[password-reset-request] insert error:', insertErr.message);
      return NextResponse.json({ error: 'Talep oluşturulamadı.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Talebiniz alındı. Yönetici şifrenizi sıfırladıktan sonra size iletecektir.',
    });
  } catch (err) {
    console.error('[password-reset-request] exception:', err);
    return NextResponse.json({ error: 'Beklenmeyen bir hata oluştu.' }, { status: 500 });
  }
}
