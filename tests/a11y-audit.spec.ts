/**
 * A11y Audit — WCAG 2.1 AA kontrolleri (axe-core)
 *
 * Public sayfalar için otomatik accessibility ihlali taraması.
 * İncelenen WCAG seviyesi: 'wcag2a' + 'wcag2aa' (+ 'wcag21aa' kuralları).
 *
 * Kapsam:
 *   - renk kontrastı
 *   - aria-label / alt text
 *   - form input label eşleşmesi
 *   - heading hiyerarşisi (h1 eksikliği)
 *   - odaklanılabilir elementlerin keyboard erişilebilirliği
 *
 * Uzak yardımcı tools/suppressed violations — şu an hiçbiri. Her ihlal
 * visible olsun, ciddi olan ayrıca fail etsin.
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PUBLIC_ROUTES = [
  { path: '/', name: 'Ana Sayfa' },
  { path: '/login', name: 'Öğrenci Login' },
  { path: '/login/ogretmen', name: 'Öğretmen Login' },
  { path: '/register/veli', name: 'Veli Kayıt' },
  { path: '/register/ogretmen', name: 'Öğretmen Kayıt' },
];

for (const route of PUBLIC_ROUTES) {
  test(`A11y (WCAG 2.1 AA) — ${route.name} (${route.path})`, async ({ page }) => {
    test.setTimeout(30_000);
    await page.goto(route.path);
    await page.waitForLoadState('networkidle', { timeout: 10_000 });

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    // Ciddi ihlaller (critical + serious) log'a özet:
    const critical = results.violations.filter((v) => v.impact === 'critical');
    const serious = results.violations.filter((v) => v.impact === 'serious');
    const moderate = results.violations.filter((v) => v.impact === 'moderate');
    const minor = results.violations.filter((v) => v.impact === 'minor');

    console.log(
      `[A11y ${route.name}] critical=${critical.length} ` +
      `serious=${serious.length} moderate=${moderate.length} minor=${minor.length}`,
    );

    for (const v of [...critical, ...serious]) {
      console.log(
        `  [${v.impact}] ${v.id}: ${v.help} → ${v.nodes.length} node` +
        (v.nodes[0]?.target ? ` (ilk: ${JSON.stringify(v.nodes[0].target)})` : ''),
      );
    }

    // Asıl assertion: critical + serious ihlal sayısı 0
    // moderate + minor sadece raporlanır, fail etmez (incremental temizlik)
    expect(critical, `${route.name}: CRITICAL A11y violations`).toHaveLength(0);
    expect(serious, `${route.name}: SERIOUS A11y violations`).toHaveLength(0);
  });
}
