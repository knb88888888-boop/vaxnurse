import { test, expect } from '@playwright/test';
import { attachRuntimeMonitor, navigateViaSidebarOrHeader, runAxeAudit } from './helpers';

const VIEWPORTS = [
  { name: 'desktop-fhd', width: 1920, height: 1080 },
  { name: 'desktop-laptop', width: 1366, height: 768 },
  { name: 'tablet-landscape', width: 1024, height: 768 },
  { name: 'tablet-portrait', width: 768, height: 1024 },
  { name: 'mobile-iphone', width: 390, height: 844 },
  { name: 'mobile-compact', width: 360, height: 800 },
] as const;

async function assertNoHorizontalOverflow(page: import('@playwright/test').Page, label: string) {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(
    scrollWidth,
    `Poziomy overflow w [${label}]: scrollWidth=${scrollWidth} > innerWidth=${innerWidth}`
  ).toBeLessThanOrEqual(innerWidth + 1);
}

test.describe('E2E — Responsywność 6 viewportów i rzeczywisty audyt WCAG / kontrastu w Chromium', () => {
  for (const vp of VIEWPORTS) {
    test(`Viewport ${vp.name} (${vp.width}x${vp.height}): brak overflow i błędów runtime na wszystkich głównych widokach`, async ({
      page,
    }) => {
      const monitor = attachRuntimeMonitor(page);
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');

      await assertNoHorizontalOverflow(page, `${vp.name}: Dashboard`);

      await navigateViaSidebarOrHeader(page, /Szczepienia dzieci/i);
      await expect(page.getByText(/Gruźlica/i).first()).toBeVisible();
      await assertNoHorizontalOverflow(page, `${vp.name}: ChildVaccinations`);

      await navigateViaSidebarOrHeader(page, /Baza preparatów/i);
      await expect(page.getByTestId('vaccines-mode-workbench')).toBeVisible();
      await assertNoHorizontalOverflow(page, `${vp.name}: VaccinesDatabase`);

      await page.getByTestId('vaccines-mode-workbench').click();
      await expect(
        page.getByRole('heading', { name: /Stanowisko audytu dokumentacji ChPL/i })
      ).toBeVisible();
      await assertNoHorizontalOverflow(page, `${vp.name}: ChplWorkbench`);

      await page.getByTestId('vaccines-mode-catalog').click();
      await page.getByRole('button', { name: /Otwórz Kartę ChPL dla Infanrix hexa/i }).click();
      await expect(page.getByRole('heading', { name: /Infanrix hexa/i })).toBeVisible();
      await assertNoHorizontalOverflow(page, `${vp.name}: VaccineDetail`);

      await navigateViaSidebarOrHeader(page, /Baza wiedzy/i);
      await expect(page.getByText(/Biblioteka Źródeł Oficjalnych/i)).toBeVisible();
      await assertNoHorizontalOverflow(page, `${vp.name}: KnowledgeBase`);

      await navigateViaSidebarOrHeader(page, /Ustawienia/i);
      await expect(page.getByRole('button', { name: /^Pobierz kopię bezpieczeństwa$/i })).toBeVisible();
      await assertNoHorizontalOverflow(page, `${vp.name}: Settings`);

      monitor.assertClean();
    });
  }

  test('Rzeczywisty audyt axe-core (Chromium computed CSS + color-contrast) w trybie standardowym oraz Zwięzła + Powiększony tekst', async ({
    page,
  }) => {
    const monitor = attachRuntimeMonitor(page);
    const axeErrors: string[] = [];
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/');

    // Tryb standardowy (comfortable + normal)
    await runAxeAudit(page, 'Dashboard (standard)', axeErrors);

    await navigateViaSidebarOrHeader(page, /Szczepienia dzieci/i);
    await expect(page.getByText(/Gruźlica/i).first()).toBeVisible();
    await runAxeAudit(page, 'ChildVaccinations (standard)', axeErrors);

    await navigateViaSidebarOrHeader(page, /Baza wiedzy/i);
    await expect(page.getByText(/Biblioteka Źródeł Oficjalnych/i)).toBeVisible();
    await runAxeAudit(page, 'KnowledgeBase (standard)', axeErrors);

    await navigateViaSidebarOrHeader(page, /Baza preparatów/i);
    await expect(page.getByTestId('vaccines-mode-workbench')).toBeVisible();
    await runAxeAudit(page, 'VaccinesDatabase (standard)', axeErrors);

    await page.getByTestId('vaccines-mode-workbench').click();
    await expect(
      page.getByRole('heading', { name: /Stanowisko audytu dokumentacji ChPL/i })
    ).toBeVisible();
    await runAxeAudit(page, 'ChplWorkbench (standard)', axeErrors);

    await page.getByTestId('vaccines-mode-catalog').click();
    await page.getByRole('button', { name: /Otwórz Kartę ChPL dla Infanrix hexa/i }).click();
    await expect(page.getByRole('heading', { name: /Infanrix hexa/i })).toBeVisible();
    await runAxeAudit(page, 'VaccineDetail Infanrix (standard)', axeErrors);

    await page.getByRole('button', { name: /Rozwiń wszystkie punkty/i }).click();
    await runAxeAudit(page, 'VaccineDetail Infanrix (expanded, standard)', axeErrors);

    await page.getByRole('button', { name: /Powrót do Bazy preparatów/i }).first().click();
    await expect(page.getByTestId('vaccines-mode-workbench')).toBeVisible();

    // Włączenie trybu Zwięzła + Wyraźny / powiększony w Ustawieniach i re-audyt
    await navigateViaSidebarOrHeader(page, /Ustawienia/i);
    await page.getByRole('button', { name: /Zwięzła \(dla mniejszych ekranów\)/i }).click();
    await page.getByRole('button', { name: /Wyraźny \/ powiększony/i }).click();
    await expect(page.locator('html')).toHaveAttribute('data-density', 'compact');
    await expect(page.locator('html')).toHaveAttribute('data-font-size', 'large');
    await runAxeAudit(page, 'Settings (compact + large)', axeErrors);

    await navigateViaSidebarOrHeader(page, /Baza preparatów/i);
    await runAxeAudit(page, 'VaccinesDatabase (compact + large)', axeErrors);

    await page.getByTestId('vaccines-mode-workbench').click();
    await expect(
      page.getByRole('heading', { name: /Stanowisko audytu dokumentacji ChPL/i })
    ).toBeVisible();
    await runAxeAudit(page, 'ChplWorkbench (compact + large)', axeErrors);

    expect(axeErrors, axeErrors.join('\n\n====================\n\n')).toEqual([]);
    monitor.assertClean();
  });
});
