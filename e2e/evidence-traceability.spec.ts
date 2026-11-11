import fs from 'node:fs/promises';
import { test, expect } from '@playwright/test';
import {
  EMPTY_QUESTION_EVIDENCE_MESSAGE,
  INFORMAL_WORKING_NOTE_DISCLAIMER
} from '../src/utils/chplEvidenceLedger';
import { attachRuntimeMonitor, navigateViaSidebarOrHeader, runAxeAudit } from './helpers';

const VIEWPORTS = [
  { name: 'desktop-fhd', width: 1920, height: 1080 },
  { name: 'desktop-laptop', width: 1366, height: 768 },
  { name: 'tablet-landscape', width: 1024, height: 768 },
  { name: 'tablet-portrait', width: 768, height: 1024 },
  { name: 'mobile-iphone', width: 390, height: 844 },
  { name: 'mobile-compact', width: 360, height: 800 }
] as const;

test.describe('E2E — Etap B2: Rejestr Źródeł, Łańcuch Dowodów QRD/PDF, Notatki Robocze i Import/Eksport JSON', () => {
  test('pełny przepływ Etapu B2 w Chromium: źródła PL/EN, pusty stan dowodów, zapis lokalny z przeładowaniem, walidacja importu JSON i ochrona Infanrix hexa', async ({
    page
  }) => {
    const monitor = attachRuntimeMonitor(page);
    await page.goto('/');

    // 1. Otwarcie Bazy preparatów -> Stanowisko audytu ChPL
    await navigateViaSidebarOrHeader(page, /Baza preparatów/i);
    await page.getByTestId('vaccines-mode-workbench').click();
    await expect(page.getByTestId('b2-source-registry-panel')).toBeVisible();
    await expect(page.getByTestId('b2-evidence-ledger-panel')).toBeVisible();

    // 2. Weryfikacja Rejestru Źródeł: EPAR PL vs EN, RPL CEN HTTP 400, VaxigripTetra historyczny
    const sourcePanel = page.getByTestId('b2-source-registry-panel');
    await expect(
      sourcePanel.getByText(/EMA EPAR Aneks I — ChPL Spikevax XFG \(wersja PL\)/i)
    ).toBeVisible();
    await expect(
      sourcePanel.getByText(/EMA EPAR Annex I — SmPC Spikevax XFG \(wersja EN\)/i)
    ).toBeVisible();
    await expect(sourcePanel.getByText(/Źródło urzędowe niedostępne/i)).toBeVisible();
    await expect(sourcePanel.getByText(/Historyczny 2025\/2026/i).first()).toBeVisible();
    await expect(sourcePanel.getByText(/verified_full/)).toHaveCount(0);

    // 3. Filtrowanie dowodów z poziomu karty źródłowej Spikevax PL
    const spikevaxCard = page.getByTestId('source-card-doc-ema-spikevax-xfg-pl');
    await spikevaxCard
      .getByRole('button', { name: /Filtruj dowody dla tego dokumentu/i })
      .click();
    await expect(
      page.locator('[data-testid="b2-evidence-chain-list"] article').first()
    ).toContainText('doc-ema-spikevax-xfg-pl');

    await page.getByRole('button', { name: /Resetuj filtry dowodów/i }).click();

    // 4. Kliknięcie pytania i kontrola komunikatu braku dowodów roboczych (Sekcja 10.5)
    const selectedBox = page.getByTestId('selected-question-evidence-box');
    await expect(selectedBox.getByText(EMPTY_QUESTION_EVIDENCE_MESSAGE)).toBeVisible();

    // 5. Walidacja ujemnego/wykraczającego numeru strony PDF w formularzu dowodu
    const evForm = page.getByTestId('b2-add-evidence-form');
    await evForm.getByLabel(/Indeks strony PDF/i).fill('999');
    await evForm
      .getByLabel(/Krótki fragment \/ odniesienie źródłowe/i)
      .fill('Pkt 4.2 ChPL BCG 10 — strona testowa poza zakresem');
    await evForm
      .getByLabel(/Obserwacja robocza audytora/i)
      .fill('Powinno zostać zablokowane przez walidator stron PDF.');
    await evForm.getByRole('button', { name: /Zapisz roboczy ślad dowodowy/i }).click();
    await expect(evForm.getByRole('alert')).toContainText(/przekracza liczbę stron dokumentu/i);

    // 6. Poprawny zapis roboczego śladu dowodowego (str. 3 z 7) + notatki roboczej
    await evForm.getByLabel(/Indeks strony PDF/i).fill('3');
    await evForm.getByRole('button', { name: /Zapisz roboczy ślad dowodowy/i }).click();
    await expect(evForm.getByRole('status')).toContainText(/autoResolved: false/i);

    const noteForm = page.getByTestId('b2-working-note-form');
    await expect(noteForm.getByText(INFORMAL_WORKING_NOTE_DISCLAIMER)).toBeVisible();
    await noteForm
      .getByLabel(/Treść roboczej notatki lokalnej/i)
      .fill('Sprawdzić miejsce iniekcji w 4.2 vs 4.8 na posiedzeniu zespołu.');
    await noteForm
      .getByRole('checkbox', { name: /wyłącznie charakter nieformalnej lokalnej notatki/i })
      .check();
    await noteForm.getByRole('button', { name: /Zapisz lokalną notatkę roboczą/i }).click();
    await expect(selectedBox).toContainText(/Nieformalne notatki robocze \(1\)/i);

    // 7. Przeładowanie strony i powrót do Workbencha — trwałość lokalna w localStorage
    await page.reload();
    await navigateViaSidebarOrHeader(page, /Baza preparatów/i);
    await page.getByTestId('vaccines-mode-workbench').click();
    await expect(page.getByTestId('selected-question-evidence-box')).toContainText(
      /Sprawdzić miejsce iniekcji w 4.2 vs 4.8 na posiedzeniu zespołu/i
    );

    // 8. Eksport odrębnego rejestru dowodów JSON
    const ioBox = page.getByTestId('b2-evidence-import-export');
    const downloadPromise = page.waitForEvent('download');
    await ioBox.getByRole('button', { name: /Eksportuj rejestr dowodów JSON/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(
      /^vaxnurse-rejestr-dowodow-chpl-\d{4}-\d{2}-\d{2}\.json$/
    );
    const exportedPath = (await download.path()) as string;
    const exportedJson = JSON.parse(await fs.readFile(exportedPath, 'utf-8')) as {
      vaxnurseEvidenceLedger: boolean;
      clinicalApprovalGranted: boolean;
      containsPatientData: boolean;
      entries: Array<Record<string, unknown>>;
    };
    expect(exportedJson.vaxnurseEvidenceLedger).toBe(true);
    expect(exportedJson.clinicalApprovalGranted).toBe(false);
    expect(exportedJson.containsPatientData).toBe(false);
    expect(exportedJson.entries).toHaveLength(1);

    // 9. Odrzucenie zmanipulowanego pliku (próba verified_full i złego hasha)
    const fileInput = ioBox.getByTestId('b2-evidence-import-input');
    const forgedPayload = {
      ...exportedJson,
      entries: [
        {
          ...exportedJson.entries[0],
          autoResolved: true,
          reviewStatus: 'verified_full',
          sourceDocumentHash: 'f'.repeat(64)
        }
      ]
    };
    await fileInput.setInputFiles({
      name: 'forged-evidence.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(forgedPayload), 'utf-8')
    });
    const previewCard = page.getByTestId('b2-import-preview-card');
    await expect(previewCard).toBeVisible();
    await expect(previewCard).toContainText(/Błędy bezpieczeństwa lub walidacji/i);
    await expect(
      previewCard.getByRole('button', { name: /Zastosuj podglądany import dowodów/i })
    ).toBeDisabled();

    // 10. Poprawny import wyeksportowanego pliku z podglądem i zastosowaniem
    await fileInput.setInputFiles(exportedPath);
    await expect(
      previewCard.getByRole('button', { name: /Zastosuj podglądany import dowodów/i })
    ).toBeEnabled();
    await previewCard.getByRole('button', { name: /Zastosuj podglądany import dowodów/i }).click();
    await expect(ioBox).toContainText(/blokada Infanrix hexa oraz autoResolved: false/i);

    // 11. Kontrola nienaruszalności blokady Infanrix hexa w Katalogu
    await page.getByTestId('vaccines-mode-catalog').click();
    await page.getByRole('button', { name: /Otwórz Kartę ChPL dla Infanrix hexa/i }).click();
    await expect(page.getByText(/disc-phenylalanine-content-01/i).first()).toBeVisible();
    await expect(page.getByText(/Blokada statusu weryfikacji:/i)).toBeVisible();

    monitor.assertClean();
  });

  test('audyt axe-core w Chromium oraz obsługa klawiaturą i 6 viewportów dla paneli Etapu B2', async ({
    page
  }) => {
    const monitor = attachRuntimeMonitor(page);
    const axeErrors: string[] = [];

    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await navigateViaSidebarOrHeader(page, /Baza preparatów/i);
      await page.getByTestId('vaccines-mode-workbench').click();
      await expect(page.getByTestId('b2-source-registry-panel')).toBeVisible();

      const { scrollWidth, innerWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth
      }));
      expect(
        scrollWidth,
        `Overflow poziomy Etapu B2 dla ${vp.name}: ${scrollWidth} > ${innerWidth}`
      ).toBeLessThanOrEqual(innerWidth + 1);
    }

    // Standardowe axe-core na Workbenchu Etapu B2
    await page.setViewportSize({ width: 1366, height: 768 });
    const stdAudit = await runAxeAudit(page, 'Workbench Etap B2 (standard)', axeErrors);
    expect(stdAudit.wcagViolationsCount).toBe(0);
    expect(stdAudit.wcagIncompleteCount).toBe(0);

    // Tryb Zwięzła + Powiększony tekst
    await navigateViaSidebarOrHeader(page, /Ustawienia/i);
    await page.getByRole('button', { name: /Zwięzła \(dla mniejszych ekranów\)/i }).click();
    await page.getByRole('button', { name: /Wyraźny \/ powiększony/i }).click();
    await navigateViaSidebarOrHeader(page, /Baza preparatów/i);
    await page.getByTestId('vaccines-mode-workbench').click();
    await expect(page.getByTestId('b2-evidence-ledger-panel')).toBeVisible();

    const compactAudit = await runAxeAudit(page, 'Workbench Etap B2 (compact + large)', axeErrors);
    expect(compactAudit.wcagViolationsCount).toBe(0);
    expect(axeErrors).toEqual([]);

    monitor.assertClean();
  });
});
