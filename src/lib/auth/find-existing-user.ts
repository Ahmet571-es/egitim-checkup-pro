/**
 * findExistingUserByEmail
 * ────────────────────────────────────────────────────────────────────
 * Verilen e-posta ile sistemde KAYITLI bir kullanıcı var mı? Varsa
 * id + email + role bilgisi döner.
 *
 * Üç katmanlı arama (password-reset-request'teki pattern ile aynı):
 *   1. profiles.email lookup (fast-path, ölçeklenir)
 *   2. Eşleşme bulunursa auth.users'dan doğrula (ID üzerinden)
 *   3. Profiles bulamazsa paginated listUsers fallback (defensif)
 *
 * Kullanım amacı: register endpoint'lerinde duplicate e-posta tespiti.
 * Önceden createUser'ın 'already registered' hatasıyla generic 409
 * dönüyorduk; kullanıcı hangi rolde kayıtlı olduğunu bilmiyordu. Bu
 * fonksiyon role bilgisini de döndürür → role-aware net hata mesajı
 * verebiliyoruz ('Bu e-posta öğretmen olarak kayıtlı...').
 *
 * Role kaynağı: profiles.role öncelikli (otoriter), fallback olarak
 * auth.users.user_metadata.role. profiles tablosu yoksa veya senkron
 * değilse metadata kullanılır.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

export type ExistingUserRole = 'admin' | 'school_admin' | 'teacher' | 'student' | 'parent' | null;

export interface ExistingUser {
  id: string;
  email: string;
  role: ExistingUserRole;
  full_name: string | null;
}

/**
 * E-postayı temizler (zero-width, smart-quote, whitespace, control chars).
 * Login/forgot-password'da kullandığımız ile aynı pattern.
 */
export function normalizeEmail(raw: string): string {
  return raw
    .replace(/[\u200B-\u200D\uFEFF]/g, '')         // zero-width
    .replace(/[\u201C\u201D\u2018\u2019"']/g, '')  // smart + düz tırnaklar
    .replace(/\s+/g, '')                            // her türlü boşluk
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1F\x7F]/g, '')                // kontrol karakterleri
    .toLowerCase();
}

export async function findExistingUserByEmail(
  admin: SupabaseClient,
  rawEmail: string,
): Promise<ExistingUser | null> {
  const email = normalizeEmail(rawEmail);
  if (!email) return null;

  // 1) profiles fast-path
  try {
    const { data: profileMatch } = await admin
      .from('profiles')
      .select('id, role, full_name')
      .eq('email', email)
      .maybeSingle();

    if (profileMatch?.id) {
      // 2) auth.users ile doğrula
      const { data: authData } = await admin.auth.admin.getUserById(profileMatch.id);
      if (authData?.user?.email?.toLowerCase() === email) {
        const metaRole = (authData.user.user_metadata?.role as ExistingUserRole | undefined) ?? null;
        return {
          id: authData.user.id,
          email: authData.user.email,
          role: (profileMatch.role as ExistingUserRole) ?? metaRole ?? null,
          full_name: profileMatch.full_name ?? (authData.user.user_metadata?.full_name as string) ?? null,
        };
      }
      // profiles var ama auth ile uyumsuz — orphan profile. Aşağıdaki fallback'e düş.
    }
  } catch (e) {
    console.warn('[findExistingUserByEmail] profiles lookup failed:', e);
  }

  // 3) Fallback: paginated listUsers (>1000 kullanıcı veya profiles senkronsuzsa)
  const PER_PAGE = 200;
  const MAX_PAGES = 50; // 10K user safety cap
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PER_PAGE });
    if (error || !data?.users?.length) break;

    const found = data.users.find((u) => u.email?.toLowerCase() === email);
    if (found) {
      const metaRole = (found.user_metadata?.role as ExistingUserRole | undefined) ?? null;
      // profiles.role'ü de dene
      let dbRole: ExistingUserRole = null;
      try {
        const { data: p } = await admin.from('profiles').select('role').eq('id', found.id).maybeSingle();
        if (p?.role) dbRole = p.role as ExistingUserRole;
      } catch { /* ignore */ }
      return {
        id: found.id,
        email: found.email || email,
        role: dbRole ?? metaRole ?? null,
        full_name: (found.user_metadata?.full_name as string) ?? null,
      };
    }
    if (data.users.length < PER_PAGE) break;
  }

  return null;
}

const ROLE_LABEL: Record<NonNullable<ExistingUserRole>, string> = {
  admin: 'Sistem Yöneticisi',
  school_admin: 'Okul Yöneticisi',
  teacher: 'Öğretmen',
  student: 'Öğrenci',
  parent: 'Veli',
};

/**
 * Register endpoint'leri için standart "duplicate e-posta" hata mesajı.
 * Kullanıcının mevcut role'üne göre net açıklama döner.
 */
export function buildDuplicateEmailError(existing: ExistingUser, attemptedRole: NonNullable<ExistingUserRole>): string {
  const existingRoleLabel = existing.role ? ROLE_LABEL[existing.role] : 'farklı bir rol';
  const attemptedRoleLabel = ROLE_LABEL[attemptedRole];

  if (existing.role === attemptedRole) {
    return `Bu e-posta adresi zaten ${existingRoleLabel} olarak kayıtlı. Mevcut hesabınızla giriş yapabilir veya şifrenizi unuttuysanız "Şifremi Unuttum" akışını kullanabilirsiniz.`;
  }

  return `Bu e-posta adresi zaten "${existingRoleLabel}" olarak kayıtlı. Aynı e-posta ile farklı bir rolde (${attemptedRoleLabel}) kayıt olamazsınız. Mevcut hesabınızla giriş yapabilir veya yeni hesap için farklı bir e-posta kullanabilirsiniz.`;
}
