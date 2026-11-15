import { test, expect } from '@playwright/test';
import { attachRuntimeMonitor, navigateViaSidebarOrHeader, runAxeAudit } from './helpers';

test.describe('E2E — MASTER 15: Kompletność 7 części PSO 2027, dostępność WCAG 2.2 AA i brak overflow 360px / zoom 200%', () => {
  test('Przejście przez wszystkie 7 części PSO 2027 w Szczepieniach dzieci oraz dorosłych (Część II.B–II.I, VII.C) z audytem axe-core = 0 naruszeń', async ({
    page,
  }) => {
    test.slow();
    const monitor = attachRuntimeMonitor(page);
    const axeErrors: string[] = [];

    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/');

    await navigateViaSidebarOrHeader(page, /Szczepienia dzieci/i);
    await expect(page.getByRole('heading', { level: 1, name: /Szczepienia dzieci/i })).toBeVisible();

    const psoTabs = [
      { name: /Część I pełna/i, heading: /I\.D — Wytyczne dotyczące swoistego zapobiegania wściekliźnie/i },
      { name: /^Część II \(/i, heading: /II\.H — Inne formy immunoprofilaktyki: uodpornienie bierne przeciw RSV/i },
      { name: /Część III \(Uzupełniające/i, heading: /III\.A\. Szczepienia dzieci urodzonych przedwcześnie/i },
      { name: /Uprawnienia personelu \(Część VI\)/i, heading: /Dosłowne przypisy pod tabelą Części VI PSO 2027/i },
      { name: /Ogólne zasady i wyjątki \(Część IV\)/i, heading: /Przepisy z ustaw i rozporządzeń odrębnych/i },
      { name: /Skrócone kalendarze \(Część VII\)/i, heading: /VII\.C — SKRÓCONY KALENDARZ SZCZEPIEŃ ZALECANYCH DLA DOROSŁYCH/i },
      { name: /Kompletność i wyszukiwarka PSO/i, heading: /Rejestr kompletności podsekcji PSO 2027/i },
    ];

    for (const item of psoTabs) {
      await page.getByRole('tab', { name: item.name }).click();
      await expect(page.getByRole('heading', { name: item.heading })).toBeVisible();
      const res = await runAxeAudit(page, `ChildVaccinations Tab ${item.name}`, axeErrors);
      expect(res.wcagViolationsCount, axeErrors.join('\n')).toBe(0);
      expect(res.wcagIncompleteCount, axeErrors.join('\n')).toBe(0);
    }

    // Nawigacja klawiaturowa w pasku zakładek PSO (Home -> Procedury, End -> Kompletność)
    const tablistFirst = page.getByRole('tab', { name: /Procedury i etapy wiekowe/i });
    const tablistLast = page.getByRole('tab', { name: /Kompletność i wyszukiwarka PSO/i });
    await tablistLast.focus();
    await page.keyboard.press('Home');
    await expect(tablistFirst).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('End');
    await expect(tablistLast).toHaveAttribute('aria-selected', 'true');

    // Moduł Szczepienia dorosłych — weryfikacja sekcji II.B–II.I oraz VII.C (str. 48) + axe-core
    await navigateViaSidebarOrHeader(page, /Szczepienia dorosłych/i);
    await expect(page.getByRole('heading', { name: /Część II\.B PSO 2027/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Część VII\.C PSO 2027/i })).toBeVisible();
    const adultRes = await runAxeAudit(page, 'AdultVaccinations Complete PSO', axeErrors);
    expect(adultRes.wcagViolationsCount, axeErrors.join('\n')).toBe(0);
    expect(adultRes.wcagIncompleteCount, axeErrors.join('\n')).toBe(0);

    monitor.assertClean();
  });

  test('Mobile 360px i zoom tekstu 200% w tabelach PSO VII.A–VII.C, VI oraz I.D/II.G bez poziomego overflow dokumentu', async ({
    page,
  }) => {
    const monitor = attachRuntimeMonitor(page);
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/');
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });

    await page.getByRole('button', { name: 'Otwórz menu nawigacji' }).click();
    await page.locator('#app-sidebar-nav').getByRole('button', { name: /Szczepienia dzieci/i }).click();

    for (const tabRegex of [
      /Część I pełna/i,
      /^Część II \(/i,
      /Uprawnienia personelu \(Część VI\)/i,
      /Skrócone kalendarze \(Część VII\)/i,
      /Kompletność i wyszukiwarka PSO/i,
    ]) {
      await page.getByRole('tab', { name: tabRegex }).click();
      const { scrollWidth, innerWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      expect(
        scrollWidth,
        `Poziomy overflow 360px/200% w zakładce ${tabRegex}: scrollWidth=${scrollWidth} > innerWidth=${innerWidth}`,
      ).toBeLessThanOrEqual(innerWidth + 1);
    }

    monitor.assertClean();
  });
});
