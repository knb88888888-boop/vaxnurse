import { test, expect } from '@playwright/test';
import { attachRuntimeMonitor, navigateViaSidebarOrHeader, runAxeAudit } from './helpers';

test.describe('E2E — Moduł "O projekcie i autorach" (nawigacja, responsywność, WCAG 2.2 AA)', () => {
  test('nawiguje z menu bocznego oraz ze stopki, utrzymuje brak overflow i 0 naruszeń axe-core', async ({
    page,
  }) => {
    const monitor = attachRuntimeMonitor(page);
    const axeErrors: string[] = [];

    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/');

    // Nawigacja ze stopki aplikacji
    const footer = page.locator('footer.app-footer');
    await expect(footer).toBeVisible();
    await footer.getByRole('button', { name: /O projekcie i autorach/i }).click();

    await expect(
      page.getByRole('heading', { level: 1, name: /O projekcie i autorach/i })
    ).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: /Zawsze bezpłatnie\. Bez reklam\./i })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: /^P\.M\.$/ })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: /^M\.M\.$/ })).toBeVisible();

    // Sprawdzenie pojedynczego H1 i głównych landmarków
    const counts = await page.evaluate(() => ({
      h1s: document.querySelectorAll('h1').length,
      mains: document.querySelectorAll('main').length,
      footers: document.querySelectorAll('footer').length,
    }));
    expect(counts).toEqual({ h1s: 1, mains: 1, footers: 1 });

    // Audyt axe-core w trybie standardowym
    const stdAudit = await runAxeAudit(page, 'AboutProject (standard 1366x768)', axeErrors);
    expect(stdAudit.wcagViolationsCount, axeErrors.join('\n')).toBe(0);
    expect(stdAudit.wcagIncompleteCount, axeErrors.join('\n')).toBe(0);

    // Kliknięcie modułu z mapy "Jak działa?" przenosi do docelowego widoku
    await page.getByTestId('about-project-view').getByRole('button', { name: /Łańcuch chłodniczy/i }).click();
    await expect(page.getByRole('heading', { level: 1, name: /Łańcuch chłodniczy/i })).toBeVisible();

    // Powrót przez Sidebar ("O projekcie")
    await navigateViaSidebarOrHeader(page, /O projekcie/i);
    await expect(
      page.getByRole('heading', { level: 1, name: /O projekcie i autorach/i })
    ).toBeVisible();

    // Test responsywności 360x800 + zoom 200%
    await page.setViewportSize({ width: 360, height: 800 });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    const mobileOverflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(
      mobileOverflow.scrollWidth,
      `Poziomy overflow na 360px @ 200%: ${mobileOverflow.scrollWidth} > ${mobileOverflow.innerWidth}`
    ).toBeLessThanOrEqual(mobileOverflow.innerWidth + 1);

    // Audyt axe-core w trybie mobilnym
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '';
    });
    const mobileAudit = await runAxeAudit(page, 'AboutProject (mobile 360x800)', axeErrors);
    expect(mobileAudit.wcagViolationsCount, axeErrors.join('\n')).toBe(0);
    expect(mobileAudit.wcagIncompleteCount, axeErrors.join('\n')).toBe(0);

    monitor.assertClean();
  });
});
