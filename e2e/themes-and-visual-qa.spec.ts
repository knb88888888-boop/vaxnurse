import { expect, test } from '@playwright/test';
import {
  attachRuntimeMonitor,
  navigateViaSidebarOrHeader,
  runAxeAudit
} from './helpers';

const ALL_THEMES = [
  { id: 'surgical-daylight', label: 'Surgical Daylight', colorScheme: 'light' },
  { id: 'nordic-alabaster', label: 'Nordic Alabaster', colorScheme: 'light' },
  { id: 'aether-obsidian', label: 'Aether Obsidian', colorScheme: 'dark' },
  { id: 'quantum-indigo', label: 'Quantum Indigo', colorScheme: 'dark' }
] as const;

test.describe('VaxNurse Multi-Theme UI, Contrast & Visual Integrity QA', () => {
  test('Przełączanie 4 motywów z nagłówka "Wygląd" i studia w Ustawieniach wraz z persystencją', async ({
    page
  }) => {
    const monitor = attachRuntimeMonitor(page);
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/');

    // Sprawdź czy ilustracja Canva hero shield załadowała się prawidłowo (naturalWidth > 0)
    const heroImg = page.locator('.hero-shield-artwork');
    await expect(heroImg).toBeVisible();
    const imgLoaded = await heroImg.evaluate(el => {
      const img = el as HTMLImageElement;
      return img.complete && img.naturalWidth > 100;
    });
    expect(imgLoaded).toBe(true);

    // Otwórz popover Wygląd w nagłówku i przełącz na Aether Obsidian
    const wygladBtn = page.getByRole('button', { name: /Wygląd aplikacji/i });
    await wygladBtn.click();
    const dialog = page.getByRole('dialog', { name: /Wybór szaty graficznej/i });
    await expect(dialog).toBeVisible();

    await dialog.getByRole('button', { name: /^Aether Obsidian/i }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'aether-obsidian');
    await expect(page.locator('html')).toHaveAttribute('data-color-scheme', 'dark');

    // Escape zamyka popover i zwraca fokus do przycisku Wygląd
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();

    // Przeładuj stronę i zweryfikuj zachowanie motywu
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'aether-obsidian');

    // 1. Sprawdź dynamiczny tytuł strony, skip-link i skrót Ctrl+K
    await expect(page).toHaveTitle('VaxNurse — Asystent Punktu Szczepień');
    const skipLink = page.locator('.skip-to-main-link');
    await expect(skipLink).toHaveAttribute('href', '#main-content');

    await page.locator('body').click({ position: { x: 10, y: 10 } });
    await page.keyboard.press('Control+k');
    const desktopInput = page.locator('.header-center .search-input');
    await expect(desktopInput).toBeFocused();
    await page.keyboard.press('Escape');

    // Przejdź do Ustawień i przetestuj Studio Szaty Graficznej + Quantum Indigo + tytuł dokumentu
    await navigateViaSidebarOrHeader(page, /Ustawienia/i);
    await expect(page).toHaveTitle('Ustawienia — VaxNurse');

    const headerGeometry = await page.evaluate(() => {
      const breadcrumb = document.querySelector('.breadcrumb-root')?.getBoundingClientRect();
      const searchBar = document.querySelector('.header-search-bar')?.getBoundingClientRect();
      const searchInput = document.querySelector('.header-center .search-input')?.getBoundingClientRect();
      const headerRight = document.querySelector('.header-right')?.getBoundingClientRect();
      return {
        breadcrumbWidth: breadcrumb?.width ?? 0,
        searchBarWidth: searchBar?.width ?? 0,
        searchWidth: searchInput?.width ?? 0,
        headerRightRight: headerRight?.right ?? 99999,
        innerWidth: window.innerWidth
      };
    });
    expect(headerGeometry.breadcrumbWidth).toBeGreaterThan(40);
    expect(headerGeometry.searchBarWidth).toBeGreaterThan(150);
    expect(headerGeometry.searchWidth).toBeGreaterThan(100);
    expect(headerGeometry.headerRightRight).toBeLessThanOrEqual(headerGeometry.innerWidth + 1);
    await page
      .getByRole('group', { name: /Wybór motywu kolorystycznego aplikacji/i })
      .getByRole('button', { name: /Quantum Indigo/i })
      .click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'quantum-indigo');
    await expect(page.getByRole('status')).toContainText(/Quantum Indigo/i);

    // Przywróć domyślne preferencje wraca również do Surgical Daylight
    await page.getByRole('button', { name: /Przywróć domyślne preferencje/i }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'surgical-daylight');

    monitor.assertClean();
  });

  for (const theme of ALL_THEMES) {
    test(`WCAG 2.2 AA & kontrast bez naruszeń w motywie ${theme.label} na kluczowych widokach`, async ({
      page
    }) => {
      const monitor = attachRuntimeMonitor(page);
      await page.setViewportSize({ width: 1366, height: 768 });
      await page.addInitScript(themeId => {
        localStorage.setItem('vaxnurse_theme_v1', themeId);
      }, theme.id);

      await page.goto('/');
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme.id);
      await expect(page.locator('html')).toHaveAttribute('data-color-scheme', theme.colorScheme);

      // 1. Dashboard
      let audit = await runAxeAudit(page, `Dashboard (${theme.id})`);
      expect(audit.wcagViolationsCount, `Axe violations on Dashboard (${theme.id})`).toBe(0);
      expect(audit.wcagIncompleteCount, `Axe incomplete on Dashboard (${theme.id})`).toBe(0);

      // 2. Ustawienia (Theme Studio + kopia)
      await navigateViaSidebarOrHeader(page, /Ustawienia/i);
      await expect(page.getByRole('heading', { level: 2, name: /Szata graficzna/i })).toBeVisible();
      audit = await runAxeAudit(page, `Settings (${theme.id})`);
      expect(audit.wcagViolationsCount, `Axe violations on Settings (${theme.id})`).toBe(0);
      expect(audit.wcagIncompleteCount, `Axe incomplete on Settings (${theme.id})`).toBe(0);

      // 3. Szczepienia dzieci + Eksplorator PSO 2027
      await navigateViaSidebarOrHeader(page, /Szczepienia dzieci/i);
      await expect(page.getByText(/PSO 2027/i).first()).toBeVisible();
      audit = await runAxeAudit(page, `ChildVaccinations (${theme.id})`);
      expect(audit.wcagViolationsCount, `Axe violations on ChildVaccinations (${theme.id})`).toBe(0);
      expect(audit.wcagIncompleteCount, `Axe incomplete on ChildVaccinations (${theme.id})`).toBe(0);

      // 4. Baza preparatów + Karta ChPL
      await navigateViaSidebarOrHeader(page, /Baza preparatów/i);
      await expect(page.getByRole('heading', { level: 1, name: /Baza preparatów/i })).toBeVisible();
      audit = await runAxeAudit(page, `Vaccines (${theme.id})`);
      expect(audit.wcagViolationsCount, `Axe violations on Vaccines (${theme.id})`).toBe(0);
      expect(audit.wcagIncompleteCount, `Axe incomplete on Vaccines (${theme.id})`).toBe(0);

      // 5. O projekcie i autorach (Canva hero image)
      await navigateViaSidebarOrHeader(page, /O projekcie/i);
      await expect(page.locator('.about-hero-shield-img')).toBeVisible();
      audit = await runAxeAudit(page, `About (${theme.id})`);
      expect(audit.wcagViolationsCount, `Axe violations on About (${theme.id})`).toBe(0);
      expect(audit.wcagIncompleteCount, `Axe incomplete on About (${theme.id})`).toBe(0);

      monitor.assertClean();
    });
  }

  test('Mobile 360x800 przy powiększeniu tekstu w trybie ciemnym Obsidian bez overflow', async ({
    page
  }) => {
    const monitor = attachRuntimeMonitor(page);
    await page.setViewportSize({ width: 360, height: 800 });
    await page.addInitScript(() => {
      localStorage.setItem('vaxnurse_theme_v1', 'aether-obsidian');
      localStorage.setItem(
        'vaxnurse_preferences_v1',
        JSON.stringify({ density: 'compact', fontSize: 'large' })
      );
    });

    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'aether-obsidian');
    const overflowDashboard = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const hero = document.querySelector('.dashboard-hero')?.getBoundingClientRect();
      const header = document.querySelector('.app-header')?.getBoundingClientRect();
      const headerRight = document.querySelector('.header-right')?.getBoundingClientRect();
      const sisterLink = document.querySelector('.header-sister-link')?.getBoundingClientRect();
      return {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: vw,
        heroRight: hero ? Math.round(hero.right) : 0,
        headerRightEdge: header ? Math.round(header.right) : 0,
        headerButtonsRight: headerRight ? Math.round(headerRight.right) : 0,
        sisterLinkRight: sisterLink ? Math.round(sisterLink.right) : 0
      };
    });
    expect(overflowDashboard.scrollWidth).toBeLessThanOrEqual(overflowDashboard.clientWidth);
    expect(overflowDashboard.heroRight).toBeLessThanOrEqual(overflowDashboard.clientWidth + 1);
    expect(overflowDashboard.headerRightEdge).toBeLessThanOrEqual(overflowDashboard.clientWidth + 1);
    expect(overflowDashboard.headerButtonsRight).toBeLessThanOrEqual(overflowDashboard.clientWidth + 1);
    expect(overflowDashboard.sisterLinkRight).toBeLessThanOrEqual(overflowDashboard.clientWidth + 1);

    // Otwórz popover Wygląd na wąskim ekranie 360px
    await page.getByRole('button', { name: /Wygląd aplikacji/i }).click();
    await expect(page.getByRole('dialog', { name: /Wybór szaty graficznej/i })).toBeVisible();
    const overflowPopover = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth
    }));
    expect(overflowPopover.scrollWidth).toBeLessThanOrEqual(overflowPopover.clientWidth);

    monitor.assertClean();
  });

  test('Procedury i checklisty spełniają WCAG 2.2 AA i best-practice bez heading-order', async ({
    page
  }) => {
    const monitor = attachRuntimeMonitor(page);
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/');

    await navigateViaSidebarOrHeader(page, /Procedury i checklisty/i);
    await expect(page.getByRole('heading', { level: 1, name: /Procedury i checklisty/i })).toBeVisible();
    await expect(page).toHaveTitle('Procedury i checklisty — VaxNurse');

    const audit = await runAxeAudit(page, 'Procedury i checklisty (clean heading-order)');
    expect(audit.wcagViolationsCount).toBe(0);
    expect(audit.wcagIncompleteCount).toBe(0);
    expect(audit.bestPracticeIds).not.toContain('heading-order');

    monitor.assertClean();
  });
});
