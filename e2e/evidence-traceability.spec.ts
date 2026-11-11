import fs from 'node:fs/promises';
import { test, expect } from '@playwright/test';
import {
  EMPTY_QUESTION_EVIDENCE_MESSAGE,
  EVIDENCE_LEDGER_STORAGE_KEY,
  HISTORICAL_DOCUMENT_NOTICE,
  INFORMAL_WORKING_NOTE_DISCLAIMER,
  SOURCE_QUALITY_DISCLAIMER
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
    expect(compactAudit.wcagIncompleteCount).toBe(0);
    expect(axeErrors).toEqual([]);

    monitor.assertClean();
  });

  test('Etap B3 w Chromium: Quality Dashboard (12 metryk), 4 osie źródeł, kontrola kwalifikacji, degradacja importu i migracja MASTER 04', async ({
    page
  }) => {
    const monitor = attachRuntimeMonitor(page);
    const axeErrors: string[] = [];

    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/');
    await navigateViaSidebarOrHeader(page, /Baza preparatów/i);
    await page.getByTestId('vaccines-mode-workbench').click();

    // 1. Quality Dashboard + disclaimer + początkowe 12 metryk
    const dash = page.getByTestId('b3-quality-dashboard');
    await expect(dash).toBeVisible();
    await expect(dash.getByTestId('b3-quality-disclaimer')).toContainText(SOURCE_QUALITY_DISCLAIMER);
    await expect(dash.getByTestId('b3-metric-total-sources')).toContainText('9');
    await expect(dash.getByTestId('b3-metric-acquired')).toContainText('1');
    await expect(dash.getByTestId('b3-metric-registry-only')).toContainText('3');
    await expect(dash.getByTestId('b3-metric-failed-attempts')).toContainText('1');
    await expect(dash.getByTestId('b3-metric-historical')).toContainText('1');
    await expect(dash.getByTestId('b3-metric-no-sha')).toContainText('1');
    await expect(dash.getByTestId('b3-metric-calc-sha')).toContainText('8');
    await expect(dash.getByTestId('b3-metric-verified-excerpts')).toContainText('0');
    await expect(dash.getByTestId('b3-metric-open-questions')).toContainText('8');

    // 2. Dokument historyczny + rozbudowa <details> historii artefaktów i prób pobrania
    const histCard = page.getByTestId('source-card-doc-rpl-vaxigrip-tetra-35346-hist');
    await expect(histCard).toContainText(HISTORICAL_DOCUMENT_NOTICE);
    const psoCard = page.getByTestId('source-card-doc-mz-pso-2027-akt');
    await expect(psoCard).toContainText(/48 str\./i);
    await psoCard.locator('summary.wb-b3-details-summary').click();
    await expect(psoCard.locator('.wb-b3-details-body')).toBeVisible();

    const endpointCard = page.getByTestId('source-card-doc-rpl-spikevax-cen-endpoints');
    await endpointCard.locator('summary.wb-b3-details-summary').click();
    await expect(endpointCard).toContainText(/HTTP 400/i);

    // 3. Filtr typu obiektu źródłowego + powrót z Łańcucha dowodowego do Rejestru Źródeł
    const typeSelect = page.locator('#b3-src-object-type');
    await typeSelect.selectOption('local_reference_document');
    await expect(psoCard).toBeVisible();
    await expect(endpointCard).toHaveCount(0);
    await typeSelect.selectOption('all');

    await page.getByRole('button', { name: /Pokaż dokument w Rejestrze Źródeł/i }).first().click();

    // 4. Próba ręcznego awansu do source_excerpt_reviewed bez checkboxa -> blokada -> potem świadomy zapis
    const evForm = page.getByTestId('b2-add-evidence-form');
    await evForm.locator('#ev-form-document').selectOption('doc-rpl-bcg10-19535');
    await evForm.getByLabel(/Indeks strony PDF/i).fill('3');
    await evForm
      .getByLabel(/Krótki fragment \/ odniesienie źródłowe/i)
      .fill('Pkt 4.2 ChPL BCG 10 (str. 3 PDF)');
    await evForm
      .getByLabel(/Obserwacja robocza audytora/i)
      .fill('Sprawdzono ręcznie z dokumentem ChPL w trybie B3.');
    await evForm.locator('#ev-form-qualification').selectOption('source_excerpt_reviewed');
    await evForm.getByRole('button', { name: /Zapisz roboczy ślad dowodowy/i }).click();
    await expect(evForm.getByRole('alert')).toContainText(/rzeczywistego pliku PDF/i);

    // Audyt axe stanu błędu walidacji i otwartych <details>
    const errStateAudit = await runAxeAudit(page, 'Workbench Etap B3 (details + form error)', axeErrors);
    expect(errStateAudit.wcagViolationsCount).toBe(0);
    expect(errStateAudit.wcagIncompleteCount).toBe(0);

    await evForm.locator('#ev-form-confirm-pdf').check();
    await evForm.getByRole('button', { name: /Zapisz roboczy ślad dowodowy/i }).click();
    await expect(dash.getByTestId('b3-metric-verified-excerpts')).toContainText('1');
    await expect(dash.getByTestId('b3-metric-open-questions')).toContainText('7');

    // Filtr kwalifikacji w Łańcuchu dowodów -> source_excerpt_reviewed
    await page.locator('#b3-ev-qual').selectOption('source_excerpt_reviewed');
    await expect(page.locator('[data-testid="b2-evidence-chain-list"] article')).toHaveCount(1);
    await page.getByRole('button', { name: /Resetuj filtry dowodów/i }).click();

    // 5. Eksport JSON z twierdzeniem source_excerpt_reviewed, usunięcie lokalne i re-import -> degradacja!
    const ioBox = page.getByTestId('b2-evidence-import-export');
    const dlPromise = page.waitForEvent('download');
    await ioBox.getByRole('button', { name: /Eksportuj rejestr dowodów JSON/i }).click();
    const dl = await dlPromise;
    const dlPath = (await dl.path()) as string;

    await page.getByRole('button', { name: /Usuń lokalny wpis dowodowy/i }).first().click();
    await expect(dash.getByTestId('b3-metric-verified-excerpts')).toContainText('0');

    const fileInput = ioBox.getByTestId('b2-evidence-import-input');
    await fileInput.setInputFiles(dlPath);
    const preview = page.getByTestId('b2-import-preview-card');
    await expect(preview).toContainText(/Deklaracje weryfikacji pochodzące z importu JSON:\s*1/i);

    const previewAudit = await runAxeAudit(page, 'Workbench Etap B3 (import preview)', axeErrors);
    expect(previewAudit.wcagViolationsCount).toBe(0);
    expect(previewAudit.wcagIncompleteCount).toBe(0);

    await preview.getByRole('button', { name: /Zastosuj podglądany import dowodów/i }).click();
    await expect(dash.getByTestId('b3-metric-verified-excerpts')).toContainText('0');
    await expect(page.getByTestId('b2-evidence-ledger-panel')).toContainText(
      /Z importu JSON \(niepotwierdzone lokalnie\)/i
    );

    // 6. Symulacja migracji starego wpisu MASTER 04 w localStorage po przeładowaniu
    const fs = await import('fs');
    const parsedExport = JSON.parse(fs.readFileSync(dlPath, 'utf8')) as {
      sources: Array<{ documentId: string; sha256: string | null; officialSourceUrl: string }>;
    };
    const bcgSourceMeta = parsedExport.sources.find((s) => s.documentId === 'doc-rpl-bcg10-19535');
    expect(bcgSourceMeta?.sha256).toBeTruthy();

    await page.evaluate(
      ({ storageKey, bcgHash, bcgUrl }) => {
        const legacy = [
          {
            evidenceId: 'ev-work-e2e-legacy-m04',
            questionId: 'dec-bcg-42-injection-site',
            productKey: 'bcg_10',
            productLabel: 'BCG 10',
            documentId: 'doc-rpl-bcg10-19535',
            documentTitle: 'RPL 19535 BCG 10',
            officialSourceUrl: bcgUrl,
            sourceDocumentHash: bcgHash,
            sha256Basis: 'calculated_local',
            location: {
              qrdSection: '4.2',
              qrdSectionTitle: '4.2 Dawkowanie i sposób podawania',
              pdfPageIndex: 3,
              pdfPageRangeLabel: 'PDF str. 3',
              printedPageNumber: null,
              pageNumberingType: 'pdf_page_index',
              physicalDocumentPageCount: 7
            },
            sourceExcerptRef: 'Legacy B2 wpis E2E: Pkt 4.2 (str. 3)',
            clinicalObservation: 'Dane robocze przeniesione z MASTER 04.',
            relationship: 'supports',
            reviewStatus: 'awaiting_human_review',
            questionWorkStatus: 'awaiting_human_review',
            autoResolved: false,
            origin: 'auditor_working_entry',
            isWorkingNote: true,
            recordedAt: '2026-11-10T10:00:00Z',
            recordedBy: 'Robocza notatka lokalna (przeglądarka)'
          }
        ];
        localStorage.setItem(storageKey, JSON.stringify(legacy));
      },
      {
        storageKey: EVIDENCE_LEDGER_STORAGE_KEY,
        bcgHash: bcgSourceMeta!.sha256!,
        bcgUrl: bcgSourceMeta!.officialSourceUrl,
      }
    );

    await page.reload();
    await navigateViaSidebarOrHeader(page, /Baza preparatów/i);
    await page.getByTestId('vaccines-mode-workbench').click();

    await expect(page.getByTestId('b2-evidence-chain-list')).toBeVisible();
    const showAllBtn = page.getByRole('button', { name: /Pokaż wszystkie ogniwa dowodowe/i });
    if ((await showAllBtn.count()) > 0) {
      await showAllBtn.click();
    }

    await expect(page.getByTestId('b2-evidence-chain-list')).toContainText(
      /Legacy B2 wpis E2E: Pkt 4\.2 \(str\. 3\)/i
    );
    await expect(page.getByTestId('b2-evidence-chain-list')).toContainText(
      /Wymaga kontroli w oryginalnym PDF/i
    );
    await expect(page.getByTestId('b3-quality-dashboard').getByTestId('b3-metric-verified-excerpts')).toContainText('0');

    expect(axeErrors).toEqual([]);
    monitor.assertClean();
  });
});
