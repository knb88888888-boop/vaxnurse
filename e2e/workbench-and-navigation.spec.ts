import fs from 'node:fs/promises';
import { test, expect } from '@playwright/test';
import { CHPL_WORKBENCH_SAFETY_NOTICE } from '../src/utils/chplWorkbench';
import { attachRuntimeMonitor, navigateViaSidebarOrHeader } from './helpers';

test.describe('E2E — Stanowisko audytu ChPL (READ-ONLY), nawigacja klawiaturą i skróty globalne', () => {
  test('leniwe ładowanie Stanowiska audytu ChPL, 4 dokumenty (Spikevax PL 177 + EN 158 str.), 8 pytań, filtry i eksport roboczy', async ({
    page,
  }) => {
    const monitor = attachRuntimeMonitor(page);
    await page.goto('/');

    // Nawigacja do Bazy preparatów
    await navigateViaSidebarOrHeader(page, /Baza preparatów/i);
    await expect(page.getByTestId('vaccines-mode-catalog')).toHaveAttribute('aria-pressed', 'true');

    // Przełączenie na zakładkę Stanowisko audytu ChPL
    await page.getByTestId('vaccines-mode-workbench').click();
    await expect(
      page.getByRole('heading', { name: /Stanowisko audytu dokumentacji ChPL/i })
    ).toBeVisible();

    // Komunikat bezpieczeństwa + 4 warstwy
    await expect(page.getByText(CHPL_WORKBENCH_SAFETY_NOTICE)).toBeVisible();
    await expect(page.getByText(/1\. Oficjalny dokument źródłowy/i)).toBeVisible();
    await expect(page.getByText(/4\. Decyzja kompetentnego audytora/i)).toBeVisible();

    // Sekcja A
    await expect(page.getByTestId('metric-pso-procedures')).toHaveText('43');
    await expect(page.getByTestId('metric-open-questions')).toHaveText('8 z 8');
    await expect(page.getByTestId('metric-verified-full')).toContainText(/0 procedur · 0 kart ChPL/);

    // Dokument Spikevax XFG (EMA EPAR PL 177 str. + EN 158 str.)
    await page.getByRole('button', { name: /Spikevax XFG/i }).click();
    const detailsSection = page.getByRole('region', {
      name: /Sekcja D — Szczegóły/i
    });
    await expect(detailsSection).toContainText('177 str.');
    await expect(detailsSection).toContainText('158 str.');
    await expect(detailsSection).toContainText('EU/1/20/1507/041–050');

    // Wszystkie 8 pytań z autoResolved = false widoczne
    await expect(page.locator('.wb-question-card')).toHaveCount(8);

    // Eksport roboczy JSON
    const exportPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Eksportuj roboczy JSON/i }).click();
    const download = await exportPromise;
    expect(download.suggestedFilename()).toMatch(
      /^vaxnurse-raport-roboczy-audytu-chpl-\d{4}-\d{2}-\d{2}\.json$/
    );
    const jsonText = await fs.readFile((await download.path()) as string, 'utf-8');
    const report = JSON.parse(jsonText);
    expect(report.isWorkingDraft).toBe(true);
    expect(report.clinicalApprovalGranted).toBe(false);
    expect(report.containsPatientData).toBe(false);

    // Filtracja po Infanrix i przejście do karty preparatu w katalogu (blokada nadal aktywna)
    await page.getByRole('textbox', { name: /Szukaj w kolejce audytu ChPL/i }).fill('Infanrix');
    const openInfanrixBtn = page.getByRole('button', { name: /Karta ChPL: Infanrix hexa/i }).first();
    await openInfanrixBtn.click();
    await expect(page.getByRole('heading', { name: /Infanrix hexa/i })).toBeVisible();
    await expect(page.getByText(/Blokada statusu weryfikacji:/i)).toBeVisible();

    monitor.assertClean();
  });

  test('pełna obsługa klawiaturą (Tab, Enter, Space, Escape) w globalnym wyszukiwaniu, nawigacji i akordeonach ChPL', async ({
    page,
  }) => {
    const monitor = attachRuntimeMonitor(page);
    await page.goto('/');

    // Focus na wyszukiwarce w nagłówku -> wpisanie frazy -> Escape zamyka dropdown
    const searchInput = page.locator('.header-search-bar .search-input');
    await searchInput.focus();
    await searchInput.fill('ChPL');
    const dropdown = page.getByRole('region', {
      name: /Wyniki wyszukiwania modułów i sekcji VaxNurse/i,
    });
    await expect(dropdown).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dropdown).not.toBeVisible();

    // Tab do przycisku "Sytuacje szczególne (w przygotowaniu)" i Enter otwiera placeholder
    const placeholderBtn = page.getByRole('button', {
      name: /Sytuacje szczególne \(w przygotowaniu\)/i,
    });
    await placeholderBtn.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByText(/Moduł nieaktywny • W przygotowaniu/i)).toBeVisible();

    // Wróć do Bazy preparatów -> otwórz Priorix -> klawiatura na akordeonie ChPL
    await navigateViaSidebarOrHeader(page, /Baza preparatów/i);
    await page.getByRole('button', { name: /Otwórz Kartę ChPL dla Priorix/i }).click();
    const sec1Btn = page.getByRole('button', { name: /1\. Nazwa produktu leczniczego/i });
    const initialExpanded = await sec1Btn.getAttribute('aria-expanded');
    await sec1Btn.focus();
    await page.keyboard.press('Enter');
    await expect(sec1Btn).toHaveAttribute(
      'aria-expanded',
      initialExpanded === 'true' ? 'false' : 'true'
    );
    await page.keyboard.press('Space');
    await expect(sec1Btn).toHaveAttribute('aria-expanded', initialExpanded as string);

    monitor.assertClean();
  });
});
