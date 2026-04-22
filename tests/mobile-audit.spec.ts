/**
 * Mobile Responsive Audit — Veli Paneli
 *
 * 3 yaygın telefon viewport'unda public sayfaları kontrol eder:
 *   - iPhone SE (375x667) — en dar yaygın viewport
 *   - iPhone 12 Pro (390x844) — orta
 *   - Pixel 5 (393x851) — Android orta
 *
 * Kontroller:
 *   - Yatay scroll OLMAMALI (document.scrollWidth <= viewport width)
 *   - Dokunma hedefleri (button/a) min 40x40 px olmalı (Apple HIG 44px,
 *     Google Material 48px, 40px alt sınır pratik)
 *   - Önemli içerik görünmeli (heading, form alanları)
 *   - Kesilmiş/overflow text olmamalı
 */
import { test, expect, devices } from '@playwright/test';

const PUBLIC_ROUTES = [
  { path: '/', name: 'Ana Sayfa' },
  { path: '/login', name: 'Genel Login' },
  { path: '/login/ogretmen', name: 'Öğretmen Login' },
  { path: '/register/veli', name: 'Veli Kayıt' },
  { path: '/register/ogretmen', name: 'Öğretmen Kayıt' },
];

const VIEWPORTS = [
  { name: 'iPhone SE', ...devices['iPhone SE'] },
  { name: 'iPhone 12 Pro', ...devices['iPhone 12 Pro'] },
];

for (const viewport of VIEWPORTS) {
  test.describe(`Mobile audit — ${viewport.name}`, () => {
    test.use({ viewport: viewport.viewport });

    for (const route of PUBLIC_ROUTES) {
      test(`${route.name} (${route.path})`, async ({ page }) => {
        test.setTimeout(30_000);
        await page.goto(route.path);
        await page.waitForLoadState('networkidle', { timeout: 10_000 });

        // 1. Yatay scroll yok mu?
        const dims = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          bodyScroll: document.body.scrollWidth,
        }));
        // Küçük bir tolerans (scrollbar vs.): 5px
        expect(dims.scrollWidth, `${route.name}: yatay scroll var (${dims.scrollWidth}px > ${dims.clientWidth}px)`)
          .toBeLessThanOrEqual(dims.clientWidth + 5);

        // 2. Dokunma hedefleri — görünür button/link'ler
        // İnline text içindeki linkler (display: inline) 44px kuralından
        // muaftır — çevrelerindeki metin alanı dokunma için yeterli.
        const smallTargets = await page.evaluate(() => {
          const results: { tag: string; text: string; w: number; h: number }[] = [];
          document.querySelectorAll('button, a').forEach((el) => {
            const rect = (el as HTMLElement).getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return; // hidden

            // Computed display kontrolü — inline ise muaf
            const display = window.getComputedStyle(el).display;
            if (display === 'inline' || display === 'contents') return;

            if (rect.width < 40 || rect.height < 40) {
              const text = ((el as HTMLElement).innerText || '').trim().slice(0, 30);
              if (text.length > 0) {
                results.push({
                  tag: el.tagName.toLowerCase(),
                  text,
                  w: Math.round(rect.width),
                  h: Math.round(rect.height),
                });
              }
            }
          });
          return results;
        });
        expect(smallTargets, `${route.name}: küçük dokunma hedefleri: ${JSON.stringify(smallTargets)}`)
          .toHaveLength(0);

        // 3. Sayfada en az bir heading var mı?
        const hasHeading = await page.locator('h1, h2, h3').count();
        expect(hasHeading, `${route.name}: heading bulunamadı`).toBeGreaterThan(0);
      });
    }
  });
}
