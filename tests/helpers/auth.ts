/**
 * E2E Test Yardımcıları — Auth & Seed
 * Eğitim Check-Up Pro — Faz 6
 */
import { type Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// ─── Supabase test client (service role) ────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key';

export const supabaseTest = createClient(SUPABASE_URL, SUPABASE_ANON);

// ─── Test kullanıcıları (sabit credentials) ──────────────────────────────────
export const TEST_USERS: Record<string, { email: string; password: string; role: string; path: string }> = {
  admin: {
    email: 'test-admin@egitimcheckup.test',
    password: 'Test1234!',
    role: 'admin',
    path: '/admin/dashboard',
  },
  school_admin: {
    email: 'test-school@egitimcheckup.test',
    password: 'Test1234!',
    role: 'school_admin',
    path: '/school/dashboard',
  },
  teacher: {
    email: 'test-teacher@egitimcheckup.test',
    password: 'Test1234!',
    role: 'teacher',
    path: '/teacher/dashboard',
  },
  student: {
    email: 'test-student@egitimcheckup.test',
    password: 'Test1234!',
    role: 'student',
    path: '/student/dashboard',
  },
  parent: {
    email: 'test-parent@egitimcheckup.test',
    password: 'Test1234!',
    role: 'parent',
    path: '/parent/dashboard',
  },
};

// ─── loginAs — Belirtilen rolle giriş yap ─────────────────────────────────
export async function loginAs(page: Page, role: keyof typeof TEST_USERS): Promise<void> {
  const user = TEST_USERS[role];
  if (!user) throw new Error(`Bilinmeyen rol: ${role}`);

  await page.goto('/login');

  // KVKK cookie consent (varsa) kabul et
  const consent = page.locator('button:has-text("Kabul Et")').first();
  if (await consent.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await consent.click();
    await page.waitForTimeout(300);
  }

  // Login formu autofill-prevention için type="text" kullanıyor
  // Gerçek input'lar: name="ecup_user_login" ve name="ecup_pass_login"
  await page.waitForSelector('input[name="ecup_user_login"]', { timeout: 10_000 });
  await page.fill('input[name="ecup_user_login"]', user.email);
  await page.fill('input[name="ecup_pass_login"]', user.password);
  await page.click('button[type="submit"]:has-text("Giriş")');

  // Dashboard'a yönlenme bekle
  await page.waitForURL(`**${user.path}**`, { timeout: 15_000 });
}

// ─── logout ───────────────────────────────────────────────────────────────
export async function logout(page: Page): Promise<void> {
  // Logout butonu — Sidebar'da
  const logoutBtn = page.locator('button[aria-label="Çıkış"], button:has(svg.lucide-log-out)').first();
  if (await logoutBtn.isVisible()) {
    await logoutBtn.click();
    await page.waitForURL('**/login**', { timeout: 10_000 });
  } else {
    await page.goto('/login');
  }
}

// ─── createTestUser — Supabase'e test kullanıcısı kaydet ─────────────────
export async function createTestUser(role: keyof typeof TEST_USERS): Promise<{ id: string } | null> {
  const user = TEST_USERS[role];

  const { data, error } = await supabaseTest.auth.signUp({
    email: user.email,
    password: user.password,
    options: {
      data: {
        full_name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`,
        role: user.role,
      },
    },
  });

  if (error && !error.message.includes('already registered')) {
    console.error(`[test] createTestUser(${role}) hata:`, error.message);
    return null;
  }

  return data.user ? { id: data.user.id } : null;
}

// ─── seedAllTestUsers — Tüm test rollerini oluştur ────────────────────────
export async function seedAllTestUsers(): Promise<void> {
  for (const role of Object.keys(TEST_USERS) as (keyof typeof TEST_USERS)[]) {
    await createTestUser(role);
  }
}
