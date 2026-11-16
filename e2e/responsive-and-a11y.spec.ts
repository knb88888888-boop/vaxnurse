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
    test.slow();
    const monitor = attachRuntimeMonitor(page);
    const axeErrors: string[] = [];
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/');

    const expectAuditClean = async (label: string) => {
      const prevLen = axeErrors.length;
      const res = await runAxeAudit(page, label, axeErrors);
      const newErrs = axeErrors.slice(prevLen).join('\n');
      expect(res.wcagViolationsCount, `${label}: wykryto naruszenia WCAG\n${newErrs}`).toBe(0);
      expect(
        res.wcagIncompleteCount,
        `${label}: wykryto nierozstrzygnięte reguły axe (incomplete)\n${newErrs}`
      ).toBe(0);
      return res;
    };

    // Tryb standardowy (comfortable + normal)
    await expectAuditClean('Dashboard (standard)');

    // OperationalModuleView (standard): Sytuacje szczególne
    await page.getByRole('button', { name: /Sytuacje szczególne/i }).first().click();
    await expect(
      page.getByRole('heading', { name: /Inwentarz zestawu przeciwwstrząsowego/i })
    ).toBeVisible();
    await expectAuditClean('OperationalModuleView (standard)');

    // ChildVaccinations + Ogólne zasady (Część IV) (standard)
    await page.locator('#app-sidebar-nav').getByRole('button', { name: /Szczepienia dzieci/i }).click();
    await page.getByRole('tab', { name: /Ogólne zasady i wyjątki \(Część IV\)/i }).click();
    await expect(
      page.getByRole('heading', { name: /Ogólne zasady przeprowadzania i organizacji szczepień/i })
    ).toBeVisible();
    await expectAuditClean('ChildVaccinations + Ogólne zasady (standard)');

    // Settings (standard) + Header + Global Search Open (standard) + Staged Backup Preview (standard)
    await page.locator('#app-sidebar-nav').getByRole('button', { name: /Ustawienia/i }).click();
    await expectAuditClean('Settings (standard)');

    const desktopSearch = page.getByRole('textbox', { name: 'Szukaj modułów i sekcji VaxNurse' }).first();
    await desktopSearch.click();
    await desktopSearch.fill('ChPL');
    const searchDropdown = page.getByRole('region', { name: 'Wyniki wyszukiwania modułów i sekcji VaxNurse' });
    await expect(searchDropdown).toBeVisible();
    const { AxeBuilder } = await import('@axe-core/playwright');
    const headerSearchResults = await new AxeBuilder({ page })
      .include('.app-header')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(
      headerSearchResults.violations,
      `Header + Global Search Open (standard) violations: ${JSON.stringify(headerSearchResults.violations)}`
    ).toEqual([]);
    // Filtrujemy wyłącznie heurystyczny stan niejednoznaczności obliczania kontrastu (elmPartiallyObscuring),
    // występujący w silniku axe przy częściowo nakładających się absolutnych panelach potomnych nagłówka na Linuxie
    const relevantIncomplete = headerSearchResults.incomplete.filter(
      (inc) =>
        !inc.nodes.every((n) =>
          n.any.some(
            (a) =>
              a.message?.includes('partially overlaps other elements') ||
              ((a.data as Record<string, unknown> | undefined)?.messageKey ===
                'elmPartiallyObscuring')
          )
        )
    );
    expect(
      relevantIncomplete,
      `Header + Global Search Open (standard) incomplete: ${JSON.stringify(headerSearchResults.incomplete)}`
    ).toEqual([]);
    await page.getByRole('button', { name: 'Wyczyść wyszukiwanie' }).click();
    await page.locator('h1').first().click();
    await expect(searchDropdown).toBeHidden();
    const [backupDownload] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /Pobierz kopię bezpieczeństwa/i }).click(),
    ]);
    const backupFilePath = await backupDownload.path();
    expect(backupFilePath).toBeTruthy();
    await page.locator('.backup-actions-row input[type="file"]').setInputFiles(backupFilePath!);
    const stagedPreview = page.getByRole('region', {
      name: 'Podsumowanie kopii zapasowej przed importem',
    });
    await expect(stagedPreview).toBeVisible();
    await expectAuditClean('Settings + Staged Backup Preview (standard)');
    await page.getByRole('button', { name: 'Anuluj przywracanie', exact: true }).click();
    await expect(stagedPreview).toBeHidden();

    // Powrót na Dashboard przed dalszym przebiegiem
    await page.locator('.breadcrumb-root').click();
    await expect(page.locator('h1').first()).toBeVisible();

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

    for (const [labelRegex, auditName] of [
      [/Kalendarz szczepień/i, 'Kalendarz szczepień PSO 2027 (standard)'],
      [/Kalkulator szczepień/i, 'Kalkulator szczepień (standard)'],
      [/Szczepienia dorosłych/i, 'Szczepienia dorosłych (standard)'],
      [/Procedury i checklisty/i, 'Procedury i checklisty (standard)'],
      [/Łańcuch chłodniczy/i, 'Łańcuch chłodniczy (standard)'],
      [/Sytuacje szczególne/i, 'Sytuacje szczególne (standard)'],
    ] as const) {
      await navigateViaSidebarOrHeader(page, labelRegex);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await runAxeAudit(page, auditName, axeErrors);
    }

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
    await expectAuditClean('ChplWorkbench (compact + large)');

    expect(axeErrors, axeErrors.join('\n\n====================\n\n')).toEqual([]);
    monitor.assertClean();
  });

  test('Manualne kontrole WCAG 2.2: Tab/Escape/Enter/Space, landmarki/H1 oraz zoom 200% na 360px', async ({
    page,
  }) => {
    const monitor = attachRuntimeMonitor(page);
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/');

    // 1. Semantyczne landmarki (<header>, <nav>, <main>) i pojedyncze <h1>
    const assertLandmarksAndSingleH1 = async (viewLabel: string) => {
      const counts = await page.evaluate(() => ({
        headers: document.querySelectorAll('header').length,
        navs: document.querySelectorAll('nav').length,
        mains: document.querySelectorAll('main').length,
        h1s: document.querySelectorAll('h1').length,
      }));
      expect(counts.headers, `${viewLabel}: <header>`).toBeGreaterThanOrEqual(1);
      expect(counts.navs, `${viewLabel}: <nav>`).toBeGreaterThanOrEqual(1);
      expect(counts.mains, `${viewLabel}: <main>`).toBe(1);
      expect(counts.h1s, `${viewLabel}: pojedyncze <h1>`).toBe(1);
    };
    await assertLandmarksAndSingleH1('Dashboard');

    // 2. Escape zamyka otwartą globalną wyszukiwarkę w nagłówku
    const desktopSearch = page
      .getByRole('textbox', { name: 'Szukaj modułów i sekcji VaxNurse' })
      .first();
    await desktopSearch.click();
    await desktopSearch.fill('ChPL');
    const searchDropdown = page.getByRole('region', {
      name: 'Wyniki wyszukiwania modułów i sekcji VaxNurse',
    });
    await expect(searchDropdown).toBeVisible();
    await desktopSearch.press('Escape');
    await expect(searchDropdown).toBeHidden();

    // 3. Klawisz Tab przemieszcza fokus po elementach interaktywnych bez pułapki
    await page.locator('.breadcrumb-root').focus();
    const visitedFocusTargets = new Set<string>();
    for (let i = 0; i < 8; i += 1) {
      await page.keyboard.press('Tab');
      const activeDesc = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return 'BODY';
        const label =
          el.getAttribute('aria-label') || el.textContent?.trim() || el.getAttribute('placeholder') || '';
        return `${el.tagName}:${label.slice(0, 40)}`;
      });
      expect(activeDesc, `Krok Tab #${i + 1} nie powinien gubić fokusu na BODY`).not.toBe('BODY');
      visitedFocusTargets.add(activeDesc);
    }
    expect(visitedFocusTargets.size).toBeGreaterThanOrEqual(5);

    // 4. Enter i Space przełączają akordeony (aria-expanded) w karcie szczepienia dzieci
    await page.locator('#app-sidebar-nav').getByRole('button', { name: /Szczepienia dzieci/i }).click();
    await expect(page.getByRole('heading', { level: 1, name: /Szczepienia dzieci/i })).toBeVisible();
    await assertLandmarksAndSingleH1('ChildVaccinations');
    const firstAccordion = page.locator('.card-expand-toggle-btn').first();
    await expect(firstAccordion).toHaveAttribute('aria-expanded', 'false');
    await firstAccordion.focus();
    await page.keyboard.press('Enter');
    await expect(firstAccordion).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Space');
    await expect(firstAccordion).toHaveAttribute('aria-expanded', 'false');

    // Landmarki + pojedyncze <h1> w pozostałych głównych widokach
    await page.locator('#app-sidebar-nav').getByRole('button', { name: /Baza preparatów/i }).click();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await assertLandmarksAndSingleH1('VaccinesDatabase');
    await page.getByTestId('vaccines-mode-workbench').click();
    await expect(page.getByTestId('chpl-audit-workbench')).toBeVisible();
    await assertLandmarksAndSingleH1('ChplWorkbench');
    await page.locator('#app-sidebar-nav').getByRole('button', { name: /Ustawienia/i }).click();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await assertLandmarksAndSingleH1('Settings');

    // 5. Zoom tekstu 200% (font-size: 200% na <html>) na wąskim viewporcie 360x800 bez przepełnienia poziomego
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/');
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    const zoomViews: Array<{ name: string; navigate?: () => Promise<void> }> = [
      { name: 'Dashboard 200% @ 360px' },
      {
        name: 'ChildVaccinations 200% @ 360px',
        navigate: async () => {
          await page.getByRole('button', { name: 'Otwórz menu nawigacji' }).click();
          await page.locator('#app-sidebar-nav').getByRole('button', { name: /Szczepienia dzieci/i }).click();
        },
      },
      {
        name: 'VaccinesDatabase 200% @ 360px',
        navigate: async () => {
          await page.getByRole('button', { name: 'Otwórz menu nawigacji' }).click();
          await page.locator('#app-sidebar-nav').getByRole('button', { name: /Baza preparatów/i }).click();
        },
      },
      {
        name: 'ChplWorkbench 200% @ 360px',
        navigate: async () => {
          await page.getByTestId('vaccines-mode-workbench').click();
          await expect(page.getByTestId('chpl-audit-workbench')).toBeVisible();
        },
      },
      {
        name: 'Settings 200% @ 360px',
        navigate: async () => {
          await page.getByRole('button', { name: 'Otwórz menu nawigacji' }).click();
          await page.locator('#app-sidebar-nav').getByRole('button', { name: /Ustawienia/i }).click();
        },
      },
      {
        name: 'Kalendarz 200% @ 360px',
        navigate: async () => {
          await page.getByRole('button', { name: 'Otwórz menu nawigacji' }).click();
          await page.locator('#app-sidebar-nav').getByRole('button', { name: /Kalendarz szczepień/i }).click();
        },
      },
      {
        name: 'Kalkulator 200% @ 360px',
        navigate: async () => {
          await page.getByRole('button', { name: 'Otwórz menu nawigacji' }).click();
          await page.locator('#app-sidebar-nav').getByRole('button', { name: /Kalkulator szczepień/i }).click();
        },
      },
      {
        name: 'Szczepienia dorosłych 200% @ 360px',
        navigate: async () => {
          await page.getByRole('button', { name: 'Otwórz menu nawigacji' }).click();
          await page.locator('#app-sidebar-nav').getByRole('button', { name: /Szczepienia dorosłych/i }).click();
        },
      },
      {
        name: 'Procedury 200% @ 360px',
        navigate: async () => {
          await page.getByRole('button', { name: 'Otwórz menu nawigacji' }).click();
          await page.locator('#app-sidebar-nav').getByRole('button', { name: /Procedury i checklisty/i }).click();
        },
      },
      {
        name: 'Łańcuch chłodniczy 200% @ 360px',
        navigate: async () => {
          await page.getByRole('button', { name: 'Otwórz menu nawigacji' }).click();
          await page.locator('#app-sidebar-nav').getByRole('button', { name: /Łańcuch chłodniczy/i }).click();
        },
      },
      {
        name: 'Sytuacje szczególne 200% @ 360px',
        navigate: async () => {
          await page.getByRole('button', { name: 'Otwórz menu nawigacji' }).click();
          await page.locator('#app-sidebar-nav').getByRole('button', { name: /Sytuacje szczególne/i }).click();
        },
      },
    ];

    for (const view of zoomViews) {
      if (view.navigate) {
        await view.navigate();
      }
      await expect
        .poll(
          () =>
            page.evaluate(() => ({
              scrollWidth: document.documentElement.scrollWidth,
              clientWidth: document.documentElement.clientWidth,
            })),
          { message: `${view.name}: brak poziomego przepełnienia przy font-size 200%` }
        )
        .toEqual(
          expect.objectContaining({
            clientWidth: 360,
          })
        );
      const dims = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(
        dims.scrollWidth,
        `${view.name}: scrollWidth (${dims.scrollWidth}) > clientWidth (${dims.clientWidth})`
      ).toBeLessThanOrEqual(dims.clientWidth + 1);
    }

    monitor.assertClean();
  });
});
