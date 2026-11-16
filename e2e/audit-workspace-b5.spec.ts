import { test, expect, type Page, type Request } from '@playwright/test';
import {
  AUDIT_SESSIONS_STORAGE_KEY,
  SOURCE_INTAKE_STORAGE_KEY
} from '../src/utils/chplAuditDossier';
import {
  buildSyntheticPdfBytes,
  computeNodeSha256Hex
} from '../tests/helpers/syntheticPdf';
import { attachRuntimeMonitor, navigateViaSidebarOrHeader, runAxeAudit } from './helpers';

const VIEWPORTS = [
  { name: 'desktop-fhd', width: 1920, height: 1080 },
  { name: 'desktop-laptop', width: 1440, height: 900 },
  { name: 'tablet-landscape', width: 1024, height: 768 },
  { name: 'tablet-portrait', width: 768, height: 1024 },
  { name: 'mobile-iphone', width: 390, height: 844 },
  { name: 'mobile-compact', width: 360, height: 800 }
] as const;

interface NetworkViolation {
  url: string;
  method: string;
  reason: string;
}

function attachZeroExfiltrationGuard(page: Page) {
  const violations: NetworkViolation[] = [];
  const allowedOrigin = 'http://127.0.0.1:4174';

  page.on('request', (req: Request) => {
    const url = req.url();
    const method = req.method().toUpperCase();
    const allowed =
      url.startsWith(allowedOrigin) || url.startsWith('blob:') || url.startsWith('data:');
    if (!allowed) {
      violations.push({ url, method, reason: 'external_origin_forbidden' });
    }
    if (method !== 'GET' && method !== 'HEAD') {
      violations.push({ url, method, reason: `non_readonly_method_${method}` });
    }
    if (req.postDataBuffer()) {
      violations.push({ url, method, reason: 'non_empty_payload' });
    }
  });

  return {
    assertClean: () => {
      expect(
        violations,
        `Wykryto niedozwolone wyjście sieciowe w Etapie B5: ${JSON.stringify(violations)}`
      ).toEqual([]);
    }
  };
}

async function openChplWorkbench(page: Page) {
  await navigateViaSidebarOrHeader(page, /Baza preparatów/i);
  await page.getByTestId('vaccines-mode-workbench').click();
  await expect(page.locator('#wb-b5-audit-workspace')).toBeVisible();
}

test.describe('E2E — Etap B5: Source Intake, Sesje Audytu, Kolejka 8 Pytań i Portable Audit Dossier', () => {
  test('przechodzi pełną ścieżkę roboczą B5 w Chromium: PDF -> SHA-256 -> Sesja -> Dowód -> Dossier -> Reload -> WCAG -> Infanrix hexa', async ({
    page
  }) => {
    test.slow();
    const monitor = attachRuntimeMonitor(page);
    const netGuard = attachZeroExfiltrationGuard(page);

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await openChplWorkbench(page);

    const b5Root = page.locator('#wb-b5-audit-workspace');
    await expect(b5Root.getByTestId('b5-progress-metrics-grid').locator('.wb-b5-metric-card')).toHaveCount(14);
    await expect(b5Root.locator('[data-intake-doc-id]')).toHaveCount(7);

    // 1. Source Intake: wybór BCG 10 i zapis deklaracji pochodzenia operatora
    const bcgCard = b5Root.locator('[data-intake-doc-id="doc-rpl-bcg10-19535"]');
    await bcgCard.getByRole('button', { name: /Szczegóły i metadane/i }).click();
    await b5Root.getByRole('button', { name: /Zapisz deklarację pochodzenia operatora/i }).click();
    await expect(b5Root.locator('.wb-b5-status-banner')).toContainText(/isOperatorDeclaredOnly: true/i);

    // 2. Wczytanie syntetycznego PDF w Moście PDF i kontrola rzeczywistego Web Crypto SHA-256
    await bcgCard.getByRole('button', { name: /Otwórz w Moście PDF/i }).click();
    const pdfBytes = buildSyntheticPdfBytes({ title: 'ChPL BCG 10 E2E B5' });
    const expectedSha = computeNodeSha256Hex(pdfBytes);

    await page.getByTestId('b4-ref-mode-select').selectOption('none');
    await page.getByTestId('b4-local-pdf-input').setInputFiles({
      name: 'bcg10-etap-b5.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from(pdfBytes)
    });
    await expect(page.getByTestId('b4-calculated-sha256')).toHaveText(expectedSha);
    await expect(page.getByTestId('b4-pdf-preview-pane')).toBeVisible();
    await page.getByTestId('b4-next-page-btn').click();
    await expect(page.getByTestId('b4-page-indicator')).toHaveText('Strona 2 z 2');

    // 3. Utworzenie sesji audytu i powiązanie dowodu z Mostu PDF
    await bcgCard.getByRole('button', { name: /Rozpocznij sesję/i }).click();
    await expect(b5Root.getByRole('tab', { name: /2\. Sesje Audytu/i })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await b5Root.getByRole('button', { name: /Rozpocznij roboczą sesję audytu/i }).click();

    const sessCards = b5Root.locator('[data-session-id]');
    await expect(sessCards).toHaveCount(1);
    await expect(sessCards.first()).toContainText(/in_progress/i);

    // Rejestracja wpisu dowodowego przypiętego do aktywnej sesji
    const evForm = page.getByTestId('b4-pdf-evidence-form');
    await evForm.locator('#b4-ev-question').selectOption('dec-bcg-42-injection-site');
    await evForm.locator('#b4-ev-printed-page').fill('2');
    await evForm
      .locator('#b4-ev-excerpt')
      .fill('6.1 Wykaz substancji pomocniczych: sodu chlorek i woda do wstrzykiwan.');
    await evForm
      .locator('#b4-ev-observation')
      .fill('Sprawdzono stronę 2 lokalnego PDF w trakcie aktywnej sesji B5.');
    await page.getByTestId('b4-ev-human-confirm').check();
    await page.getByTestId('b4-submit-pdf-evidence-btn').click();

    await expect(sessCards.first()).toContainText(/Dowody sesji:\s*1/i);

    // Zakończenie sesji jako zapis roboczy (NIE zatwierdzenie kliniczne) i raport sesji
    await sessCards.first().getByRole('button', { name: /Zakończ jako zapis roboczy/i }).click();
    await expect(sessCards.first()).toContainText(/Zakończona jako zapis roboczy/i);
    await sessCards.first().getByRole('button', { name: /Raport sesji \(JSON \/ HTML\)/i }).click();
    await expect(b5Root.getByTestId('b5-session-report-preview')).toContainText(
      /clinicalApprovalGranted: false/i
    );

    // 4. Eksport i kontrolowany Import Preview Portable Audit Dossier
    await b5Root.getByRole('tab', { name: /4\. Portable Audit Dossier/i }).click();
    await b5Root.getByRole('button', { name: /Wygeneruj i pobierz Portable Dossier/i }).click();
    const expSummary = b5Root.getByTestId('b5-last-export-summary');
    await expect(expSummary).toContainText(/containsPdfBytes: false/i);
    await expect(expSummary).toContainText(/containsPatientData: false/i);
    await expect(expSummary).toContainText(/[a-f0-9]{64}/);

    await b5Root.getByRole('button', { name: /Analizuj podgląd importu Dossier/i }).click();
    const impPreview = b5Root.getByTestId('b5-dossier-import-preview');
    await expect(impPreview).toContainText(/GOTOWY DO SCALENIA/i);
    await expect(impPreview).toContainText(/matched/i);

    await b5Root.getByRole('button', { name: /Zastosuj kontrolowane scalenie Dossier/i }).click();
    await expect(b5Root.locator('.wb-b5-status-banner')).toContainText(/niepotwierdzone lokalnie/i);

    // 5. Reload i weryfikacja recovery: metadane/sesje przetrwały, brak bajtów PDF, wymóg ponownego wskazania PDF
    const persistedCheck = await page.evaluate(
      ({ intakeKey, sessKey }) => ({
        intakeRaw: localStorage.getItem(intakeKey),
        sessRaw: localStorage.getItem(sessKey)
      }),
      { intakeKey: SOURCE_INTAKE_STORAGE_KEY, sessKey: AUDIT_SESSIONS_STORAGE_KEY }
    );
    expect(persistedCheck.intakeRaw).toBeTruthy();
    expect(persistedCheck.sessRaw).toBeTruthy();
    expect(persistedCheck.sessRaw).not.toContain('%PDF-');

    await page.reload();
    await openChplWorkbench(page);

    await b5Root.getByRole('tab', { name: /2\. Sesje Audytu/i }).click();
    await expect(b5Root.locator('[data-session-id]').first()).toContainText(
      /wymagane jest ponowne wskazanie pliku PDF/i
    );

    // 6. Kolejka 8 pytań ChPL + nawigacja klawiaturą po zakładkach ARIA + audyt WCAG axe
    const questionsTab = b5Root.getByRole('tab', { name: /3\. Kolejka 8 Pytań ChPL/i });
    await b5Root.getByRole('tab', { name: /2\. Sesje Audytu/i }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(questionsTab).toHaveAttribute('aria-selected', 'true');
    const queueCards = b5Root.locator('[data-queue-question-id]');
    await expect(queueCards).toHaveCount(8);
    for (let i = 0; i < 8; i += 1) {
      await expect(queueCards.nth(i)).toContainText(/autoResolved: false/i);
    }

    // Audyt axe na aktywnych zakładkach B5
    const tabs: RegExp[] = [
      /1\. Source Intake/i,
      /2\. Sesje Audytu/i,
      /3\. Kolejka 8 Pytań/i,
      /4\. Portable Audit Dossier/i
    ];
    for (const tabPattern of tabs) {
      await b5Root.getByRole('tab', { name: tabPattern }).click();
      await runAxeAudit(page, `B5 Tab ${tabPattern.source}`);
    }

    // 7. Niezmiennik Infanrix hexa
    await navigateViaSidebarOrHeader(page, /Baza preparatów/i);
    await page.getByTestId('vaccines-mode-catalog').click({ force: true });
    await page.getByRole('button', { name: /Otwórz Kartę ChPL dla Infanrix hexa/i }).click();
    await expect(page.getByText(/disc-phenylalanine-content-01/i).first()).toBeVisible();
    await expect(page.getByText(/Blokada statusu weryfikacji:/i)).toBeVisible();
    await expect(page.locator('main')).toContainText(/0,0289/i);
    await expect(page.locator('main')).toContainText(/0,0298/i);

    monitor.assertClean();
    netGuard.assertClean();
  });

  test('brak poziomego przepełnienia na 6 rozdzielczościach i przy 200% powiększeniu (360x800) dla modułu B5', async ({
    page
  }) => {
    const monitor = attachRuntimeMonitor(page);
    await page.goto('/');
    await openChplWorkbench(page);

    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const overflow = await page.evaluate(() => ({
        scrollW: document.documentElement.scrollWidth,
        innerW: window.innerWidth
      }));
      expect(
        overflow.scrollW,
        `Viewport ${vp.name} (${vp.width}x${vp.height}) ma poziome przepełnienie`
      ).toBeLessThanOrEqual(overflow.innerW + 1);
    }

    // Zoom tekstu 200% (font-size: 200%) przy 360x800
    await page.setViewportSize({ width: 360, height: 800 });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    const zoomOverflow = await page.evaluate(() => ({
      scrollW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth
    }));
    expect(
      zoomOverflow.scrollW,
      'Zoom 200% @ 360x800 powoduje poziome przepełnienie'
    ).toBeLessThanOrEqual(zoomOverflow.clientW + 1);

    await page.evaluate(() => {
      document.documentElement.style.fontSize = '';
    });
    monitor.assertClean();
  });
});
