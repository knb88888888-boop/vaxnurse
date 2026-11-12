import { test, expect, type Page, type Request } from '@playwright/test';
import {
  EVIDENCE_LEDGER_STORAGE_KEY,
  SOURCE_ARTIFACTS_STORAGE_KEY
} from '../src/utils/chplEvidenceLedger';
import {
  LOCAL_PDF_NO_CLINICAL_APPROVAL_NOTICE,
  LOCAL_PDF_RELOAD_REQUIRED_NOTICE,
  LOCAL_PDF_TEXT_LAYER_DISCLAIMER,
  LOCAL_PDF_UNTRUSTED_HASH_NOTICE
} from '../src/utils/localPdfBridge';
import {
  buildCorruptPdfBytes,
  buildFakeDisguisedPdfBytes,
  buildScanOnlyPdfBytes,
  buildSyntheticPdfBytes,
  computeNodeSha256Hex
} from '../tests/helpers/syntheticPdf';
import { attachRuntimeMonitor, navigateViaSidebarOrHeader, runAxeAudit } from './helpers';

const VIEWPORTS = [
  { name: 'desktop-fhd', width: 1920, height: 1080 },
  { name: 'desktop-laptop', width: 1366, height: 768 },
  { name: 'tablet-landscape', width: 1024, height: 768 },
  { name: 'tablet-portrait', width: 768, height: 1024 },
  { name: 'mobile-iphone', width: 390, height: 844 },
  { name: 'mobile-compact', width: 360, height: 800 }
] as const;

interface NetworkAuditViolation {
  url: string;
  method: string;
  reason: string;
}

function attachLocalOnlyNetworkGuard(page: Page) {
  const violations: NetworkAuditViolation[] = [];
  const allowedOrigin = 'http://127.0.0.1:4174';

  const onRequest = (req: Request) => {
    const url = req.url();
    const method = req.method().toUpperCase();
    const isAllowedLocalOrigin =
      url.startsWith(allowedOrigin) || url.startsWith('blob:') || url.startsWith('data:');

    if (!isAllowedLocalOrigin) {
      violations.push({ url, method, reason: 'external_origin_forbidden' });
    }
    if (method !== 'GET' && method !== 'HEAD') {
      violations.push({ url, method, reason: `non_readonly_method_${method}` });
    }
    if (req.postDataBuffer()) {
      violations.push({ url, method, reason: 'non_empty_request_payload' });
    }
  };

  page.on('request', onRequest);

  return {
    assertZeroExfiltration: () => {
      expect(
        violations,
        `Wykryto niedozwolone wyjście sieciowe lub wysyłkę danych: ${JSON.stringify(violations)}`
      ).toEqual([]);
    }
  };
}

async function openChplWorkbench(page: Page) {
  await navigateViaSidebarOrHeader(page, /Baza preparatów/i);
  await page.getByTestId('vaccines-mode-workbench').click();
  await expect(page.getByTestId('b4-local-pdf-bridge')).toBeVisible();
}

test.describe('E2E — Etap B4: Lokalny Most PDF (File API, Web Crypto SHA-256, PDF.js, Kaskada Wersji i Dostępność)', () => {
  test('przetwarza lokalny PDF wyłącznie w przeglądarce: odrzuca zafałszowany plik, obsługuje skan i PDF z tekstem, wiąże dowód z SHA-256, zachowuje tylko metadane po reloadzie oraz chroni kaskadą zmian', async ({
    page
  }) => {
    const monitor = attachRuntimeMonitor(page);
    const networkGuard = attachLocalOnlyNetworkGuard(page);

    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/');
    await openChplWorkbench(page);

    // Wybieramy dokument RPL BCG 10 (w Etapie I niepozyskany, bez lokalnego pliku)
    await page.getByTestId('open-pdf-bridge-doc-rpl-bcg10-19535').click();
    await expect(page.getByTestId('b4-bridge-source-select')).toHaveValue('doc-rpl-bcg10-19535');

    const pdfInput = page.getByTestId('b4-local-pdf-input');

    // 1. Odrzucenie pliku HTML zamaskowanego rozszerzeniem .pdf (sygnatura %PDF- wymagana)
    await pdfInput.setInputFiles({
      name: 'fake-rpl-page.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from(buildFakeDisguisedPdfBytes())
    });
    await expect(page.getByTestId('b4-bridge-error')).toContainText(/%PDF-/i);

    // 2. Odrzucenie pustego pliku .pdf
    await pdfInput.setInputFiles({
      name: 'empty.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.alloc(0)
    });
    await expect(page.getByTestId('b4-bridge-error')).toContainText(/pusty/i);

    // 3. Otwarcie pliku PDF ze skanem bez warstwy tekstowej (render Canvas bez OCR)
    await pdfInput.setInputFiles({
      name: 'scan-only-bcg10.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from(buildScanOnlyPdfBytes(2))
    });
    await expect(page.getByTestId('b4-pdf-preview-pane')).toBeVisible();
    await expect(page.getByTestId('b4-pdf-preview-pane')).toContainText(
      /Brak rozpoznanej warstwy tekstowej/i
    );
    await expect
      .poll(async () =>
        page.getByTestId('b4-pdf-canvas').evaluate((el) => {
          const canvas = el as HTMLCanvasElement;
          return { w: canvas.width, h: canvas.height };
        })
      )
      .toEqual(expect.objectContaining({ w: expect.any(Number), h: expect.any(Number) }));
    const scanCanvasDims = await page.getByTestId('b4-pdf-canvas').evaluate((el) => {
      const canvas = el as HTMLCanvasElement;
      return { w: canvas.width, h: canvas.height };
    });
    expect(scanCanvasDims.w).toBeGreaterThan(0);
    expect(scanCanvasDims.h).toBeGreaterThan(0);

    // 4. Przejście do trybu "Brak wzorca" i wgranie wielostronicowego syntetycznego PDF v1 z warstwą tekstową
    const pdfV1Bytes = buildSyntheticPdfBytes({ title: 'ChPL BCG 10 E2E v1' });
    const pdfV1Sha = computeNodeSha256Hex(pdfV1Bytes);

    await page.getByTestId('b4-ref-mode-select').selectOption('none');
    await pdfInput.setInputFiles({
      name: 'chpl-bcg10-lokalny.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from(pdfV1Bytes)
    });

    await expect(page.getByTestId('b4-calculated-sha256')).toHaveText(pdfV1Sha);
    await expect(page.getByTestId('b4-hash-evaluation-notice')).toContainText(
      LOCAL_PDF_UNTRUSTED_HASH_NOTICE
    );
    await expect(page.getByTestId('b4-page-count-comparison')).toContainText(/2.*7/);

    const artifactIdV1 = (await page.getByTestId('b4-active-artifact-id').textContent())?.trim();
    expect(artifactIdV1).toBeTruthy();

    await expect
      .poll(async () =>
        page.getByTestId('b4-pdf-canvas').evaluate((el) => (el as HTMLCanvasElement).width)
      )
      .toBeGreaterThan(0);

    // Nawigacja stron oraz zoom
    await expect(page.getByTestId('b4-page-indicator')).toHaveText('Strona 1 z 2');
    await page.getByTestId('b4-next-page-btn').click();
    await expect(page.getByTestId('b4-page-indicator')).toHaveText('Strona 2 z 2');
    await page.getByTestId('b4-prev-page-btn').click();
    await expect(page.getByTestId('b4-page-indicator')).toHaveText('Strona 1 z 2');

    await page.getByRole('button', { name: 'Powiększ podgląd PDF' }).click();
    await expect(page.getByTestId('b4-zoom-indicator')).toHaveText('125%');

    // Wyszukiwanie w warstwie tekstowej z obowiązkowym zastrzeżeniem
    await expect(page.getByTestId('b4-text-layer-disclaimer')).toHaveText(
      LOCAL_PDF_TEXT_LAYER_DISCLAIMER
    );
    await page.getByTestId('b4-pdf-text-search').fill('sodu chlorek');
    await page.getByRole('button', { name: 'Szukaj w tekście' }).click();
    const searchResults = page.getByTestId('b4-text-search-results');
    await expect(searchResults).toBeVisible();
    await searchResults.getByRole('button', { name: 'Strona 2' }).click();
    await expect(page.getByTestId('b4-page-indicator')).toHaveText('Strona 2 z 2');

    // Kontrolowany wpis dowodowy z bramką potwierdzenia człowieka i autoResolved=false
    const evForm = page.getByTestId('b4-pdf-evidence-form');
    await expect(evForm).toContainText(LOCAL_PDF_NO_CLINICAL_APPROVAL_NOTICE);
    await evForm.locator('#b4-ev-question').selectOption('dec-bcg-42-injection-site');
    await evForm.locator('#b4-ev-printed-page').fill('2');
    await evForm
      .locator('#b4-ev-excerpt')
      .fill('6.1 Wykaz substancji pomocniczych: sodu chlorek, woda do wstrzykiwan.');
    await evForm
      .locator('#b4-ev-observation')
      .fill('Zweryfikowano treść strony 2 w lokalnym podglądzie PDF.js bez wysyłki sieciowej.');

    // Bez zaznaczenia checkboxa potwierdzenia zapis jest zablokowany
    await page.getByTestId('b4-submit-pdf-evidence-btn').click();
    await expect(evForm.getByRole('alert')).toBeVisible();

    await page.getByTestId('b4-ev-human-confirm').check();
    await page.getByTestId('b4-submit-pdf-evidence-btn').click();

    await expect(
      page.getByTestId('b3-metric-verified-excerpts').locator('.wb-b3-metric-num')
    ).toHaveText('1');
    const savedAfterCreate = await page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    }, EVIDENCE_LEDGER_STORAGE_KEY);
    expect(Array.isArray(savedAfterCreate)).toBe(true);
    expect(savedAfterCreate).toHaveLength(1);
    expect(savedAfterCreate[0]).toEqual(
      expect.objectContaining({
        autoResolved: false,
        qualificationClass: 'source_excerpt_reviewed',
        sourceDocumentHash: pdfV1Sha,
        artifactId: artifactIdV1,
        requiresReverification: false
      })
    );

    // 5. Kontrola zawartości localStorage dla artefaktów (zero binarnych bajtów / base64 PDF)
    const artifactsStorageRaw = await page.evaluate(
      (key) => localStorage.getItem(key),
      SOURCE_ARTIFACTS_STORAGE_KEY
    );
    expect(artifactsStorageRaw).toBeTruthy();
    expect(artifactsStorageRaw).not.toContain('data:application/pdf');
    expect(artifactsStorageRaw).not.toContain('%PDF-');
    expect(artifactsStorageRaw!.length).toBeLessThan(15000);

    // 6. Reload przeglądarki -> baner ponownego wskazania pliku (bez zapisanych bajtów PDF)
    await page.reload();
    await openChplWorkbench(page);
    await page.getByTestId('open-pdf-bridge-doc-rpl-bcg10-19535').click();

    await expect(page.getByTestId('b4-reload-reselect-banner')).toContainText(
      LOCAL_PDF_RELOAD_REQUIRED_NOTICE
    );
    await expect(page.getByTestId('b4-source-availability')).toContainText(
      /wymagane ponowne wybranie pliku/i
    );

    // 7. Ponowne wskazanie IDENTYCZNEGO pliku PDF v1 -> brak nowej wersji i brak degradacji dowodu
    await page.getByTestId('b4-local-pdf-input').setInputFiles({
      name: 'chpl-bcg10-lokalny.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from(pdfV1Bytes)
    });
    await expect(page.getByTestId('b4-active-artifact-id')).toHaveText(artifactIdV1!);
    await expect(page.getByTestId('b4-reverification-alert')).toHaveCount(0);

    const savedAfterSameReload = await page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    }, EVIDENCE_LEDGER_STORAGE_KEY);
    expect(savedAfterSameReload[0]?.requiresReverification).toBe(false);
    expect(savedAfterSameReload[0]?.qualificationClass).toBe('source_excerpt_reviewed');

    // 8. Wskazanie ZMIENIONEGO pliku PDF v2 pod tą samą nazwą -> kaskada ponownej weryfikacji
    const pdfV2Bytes = buildSyntheticPdfBytes({
      title: 'ChPL BCG 10 E2E v2 zmodyfikowany',
      pages: [
        { lines: ['CHPL BCG 10 ZMIANA V2 - STRONA 1', 'Zmieniony tekst w pkt 4.2'] },
        { lines: ['CHPL BCG 10 ZMIANA V2 - STRONA 2', 'Inny zapis w pkt 6.1'] }
      ]
    });
    await page.getByTestId('b4-local-pdf-input').setInputFiles({
      name: 'chpl-bcg10-lokalny.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from(pdfV2Bytes)
    });
    await expect(page.getByTestId('b4-reverification-alert')).toBeVisible();
    const artifactIdV2 = (await page.getByTestId('b4-active-artifact-id').textContent())?.trim();
    expect(artifactIdV2).not.toBe(artifactIdV1);
    await expect(
      page.getByTestId('b4-metric-reverification').locator('.wb-b3-metric-num')
    ).toHaveText('2');

    const savedAfterCascade = await page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    }, EVIDENCE_LEDGER_STORAGE_KEY);
    expect(savedAfterCascade[0]?.requiresReverification).toBe(true);
    expect(savedAfterCascade[0]?.qualificationClass).toBe(
      'source_excerpt_pending_review'
    );

    // 9. Blokada kliniczna vac-infanrix-hexa w katalogu pozostaje nienaruszona
    await page.getByTestId('vaccines-mode-catalog').click();
    await page.getByRole('button', { name: /Otwórz Kartę ChPL dla Infanrix hexa/i }).click();
    await expect(page.getByText(/Blokada statusu weryfikacji:/i)).toBeVisible();

    networkGuard.assertZeroExfiltration();
    monitor.assertClean();
  });

  test('jawnie obsługuje uszkodzony plik %PDF- w prawdziwym parserze PDF.js bez zawieszenia aplikacji', async ({
    page
  }) => {
    const networkGuard = attachLocalOnlyNetworkGuard(page);

    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/');
    await openChplWorkbench(page);

    await page.getByTestId('b4-local-pdf-input').setInputFiles({
      name: 'uszkodzony-chpl.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from(buildCorruptPdfBytes())
    });

    await expect(page.getByTestId('b4-bridge-error')).toBeVisible();
    await expect(page.getByTestId('b4-bridge-error')).toContainText(/PDF\.js|uszkodzony|niezgodny/i);
    await expect(page.getByTestId('b4-pdf-preview-pane')).toHaveCount(0);

    networkGuard.assertZeroExfiltration();
  });

  test('audyt WCAG 2.1/2.2 A/AA oraz best-practice heading-order (ModulePlaceholder), klawiatura, 6 viewportów i zoom 200% na 360x800 dla otwartego PDF', async ({
    page
  }) => {
    const monitor = attachRuntimeMonitor(page);
    const axeErrors: string[] = [];

    // 1. Weryfikacja zamknięcia historycznego findingu axe heading-order w ModulePlaceholder
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/');
    await navigateViaSidebarOrHeader(page, /Sytuacje szczególne/i);
    await expect(
      page.getByRole('heading', { level: 1, name: /Sytuacje szczególne/i })
    ).toBeVisible();
    const placeholderAudit = await runAxeAudit(page, 'ModulePlaceholder (B4 heading fix)', axeErrors);
    expect(placeholderAudit.wcagViolationsCount).toBe(0);
    expect(placeholderAudit.wcagIncompleteCount).toBe(0);
    expect(placeholderAudit.bestPracticeIds).not.toContain('heading-order');

    // 2. Otwarcie PDF w Moście B4 + audyt axe standardowy oraz compact+large
    await openChplWorkbench(page);
    const pdfBytes = buildSyntheticPdfBytes({ title: 'BCG A11y Audit E2E' });
    await page.getByTestId('b4-local-pdf-input').setInputFiles({
      name: 'bcg10-a11y.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from(pdfBytes)
    });
    await expect(page.getByTestId('b4-pdf-preview-pane')).toBeVisible();
    await expect
      .poll(async () =>
        page.getByTestId('b4-pdf-canvas').evaluate((el) => (el as HTMLCanvasElement).width)
      )
      .toBeGreaterThan(0);

    const stdBridgeAudit = await runAxeAudit(
      page,
      'LocalPdfBridge + Opened PDF (standard)',
      axeErrors
    );
    expect(stdBridgeAudit.wcagViolationsCount).toBe(0);
    expect(stdBridgeAudit.wcagIncompleteCount).toBe(0);
    expect(stdBridgeAudit.bestPracticeIds).not.toContain('heading-order');

    await page.evaluate(() => {
      document.documentElement.setAttribute('data-density', 'compact');
      document.documentElement.setAttribute('data-font-size', 'large');
    });
    const compactBridgeAudit = await runAxeAudit(
      page,
      'LocalPdfBridge + Opened PDF (compact + large)',
      axeErrors
    );
    expect(compactBridgeAudit.wcagViolationsCount).toBe(0);
    expect(compactBridgeAudit.wcagIncompleteCount).toBe(0);

    await page.evaluate(() => {
      document.documentElement.removeAttribute('data-density');
      document.documentElement.removeAttribute('data-font-size');
    });

    // 3. Nawigacja klawiaturą po elementach Mostu PDF
    await page.getByTestId('b4-bridge-source-select').focus();
    const focusedIds: string[] = [];
    for (let i = 0; i < 6; i += 1) {
      await page.keyboard.press('Tab');
      const id = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        return el?.id || el?.getAttribute('data-testid') || el?.tagName || '';
      });
      if (id) focusedIds.push(id);
    }
    expect(focusedIds.length).toBeGreaterThanOrEqual(4);

    // 4. Weryfikacja 6 viewportów z otwartym PDF (zero overflow poziomego)
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await expect
        .poll(async () =>
          page.evaluate(() => ({
            scrollWidth: document.documentElement.scrollWidth,
            innerWidth: window.innerWidth
          }))
        )
        .toEqual(
          expect.objectContaining({
            innerWidth: vp.width
          })
        );
      const dims = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth
      }));
      expect(
        dims.scrollWidth,
        `Overflow poziomy dla Mostu PDF na ${vp.name}: ${dims.scrollWidth} > ${dims.innerWidth}`
      ).toBeLessThanOrEqual(dims.innerWidth + 1);
    }

    // 5. Zoom 200% (font-size: 200%) na 360x800 przy otwartym panelu PDF
    await page.setViewportSize({ width: 360, height: 800 });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    const zoomDims = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth
    }));
    expect(
      zoomDims.scrollWidth,
      `Overflow poziomy przy zoom 200% @ 360x800: ${zoomDims.scrollWidth} > ${zoomDims.clientWidth}`
    ).toBeLessThanOrEqual(zoomDims.clientWidth + 1);

    expect(axeErrors, axeErrors.join('\n')).toEqual([]);
    monitor.assertClean();
  });
});
