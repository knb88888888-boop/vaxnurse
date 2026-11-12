import { useState } from 'react';
import { webcrypto } from 'node:crypto';
import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChplAuditWorkbenchView } from '../../src/components/vaccines/ChplAuditWorkbenchView';
import { LocalPdfBridgePanel } from '../../src/components/vaccines/LocalPdfBridgePanel';
import { VACCINES_CATALOG } from '../../src/data/vaccinesCatalog';
import { STAGE1_CHPL_AUDIT_BUNDLE } from '../../src/data/chplStage1AuditSheets';
import type { EvidenceLedgerEntry, SourceRegistryEntry } from '../../src/types/evidenceLedger';
import { createBackupPayload, getStoredVaccines } from '../../src/utils/backup';
import {
  EMPTY_QUESTION_EVIDENCE_MESSAGE,
  EVIDENCE_LEDGER_STORAGE_KEY,
  HISTORICAL_DOCUMENT_NOTICE,
  INFORMAL_WORKING_NOTE_DISCLAIMER,
  SOURCE_ARTIFACTS_STORAGE_KEY,
  SOURCE_QUALITY_DISCLAIMER,
  WORKING_NOTES_STORAGE_KEY,
  buildBaseSourceRegistry,
  buildEvidenceLedgerExportPayload,
  clearLocalSourceArtifactsFromStorage,
  createWorkingEvidenceEntry,
  loadSourceRegistryWithLocalArtifacts,
  registerLocalPdfInspectionSession,
  saveLocalSourceArtifactsToStorage,
  validateWorkingEvidenceInput,
  type WorkingEvidenceDraftInput
} from '../../src/utils/chplEvidenceLedger';
import {
  LOCAL_PDF_NO_CLINICAL_APPROVAL_NOTICE,
  LOCAL_PDF_RELOAD_REQUIRED_NOTICE,
  LOCAL_PDF_TEXT_LAYER_DISCLAIMER,
  LOCAL_PDF_UNTRUSTED_HASH_NOTICE,
  createEmptyPdfMetadataSummary
} from '../../src/utils/localPdfBridge';
import type { OpenedLocalPdfSession } from '../../src/utils/localPdfReader';
import {
  buildFakeDisguisedPdfBytes,
  buildSyntheticPdfBytes,
  computeNodeSha256Hex
} from '../helpers/syntheticPdf';

describe('Etap B2 — WorkbenchSourceRegistryPanel & WorkbenchEvidenceLedgerPanel', () => {
  let exportedBlobs: Blob[] = [];
  let exportedNames: string[] = [];

  beforeEach(() => {
    localStorage.clear();
    exportedBlobs = [];
    exportedNames = [];

    Object.defineProperty(URL, 'createObjectURL', {
      value: vi.fn((blob: Blob) => {
        exportedBlobs.push(blob);
        return `blob:b2-mock-${exportedBlobs.length}`;
      }),
      writable: true,
      configurable: true
    });

    Object.defineProperty(URL, 'revokeObjectURL', {
      value: vi.fn(),
      writable: true,
      configurable: true
    });

    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement
    ) {
      exportedNames.push(this.download);
    });
  });

  it('prezentuje Rejestr Źródeł (PL 177 str., EN 158 str., RPL CEN HTTP 400, VaxigripTetra historyczny, Infanrix) i ostrzeżenie o pustych dowodach roboczych', async () => {
    const user = userEvent.setup();
    render(<ChplAuditWorkbenchView vaccines={VACCINES_CATALOG} onOpenVaccineById={vi.fn()} />);

    const sourcePanel = screen.getByTestId('b2-source-registry-panel');
    const srcScope = within(sourcePanel);

    expect(
      srcScope.getByText(/EMA EPAR Aneks I — ChPL Spikevax XFG \(wersja PL\)/i)
    ).toBeInTheDocument();
    expect(
      srcScope.getByText(/EMA EPAR Annex I — SmPC Spikevax XFG \(wersja EN\)/i)
    ).toBeInTheDocument();
    expect(srcScope.getByText(/Źródło urzędowe niedostępne/i)).toBeInTheDocument();
    expect(srcScope.getByText(/Historyczny 2025\/2026 · Odrzucony dla 2026\/2027/i)).toBeInTheDocument();
    expect(
      srcScope.getAllByText(/Pochodzenie dokumentu potwierdzone \(nie stanowi weryfikacji treści klinicznej\)/i)
        .length
    ).toBeGreaterThanOrEqual(4);
    expect(srcScope.queryByText(/verified_full/i)).not.toBeInTheDocument();

    // Komunikat pustych dowodów roboczych dla wybranego pytania
    const selectedBox = screen.getByTestId('selected-question-evidence-box');
    expect(within(selectedBox).getByText(EMPTY_QUESTION_EVIDENCE_MESSAGE)).toBeInTheDocument();

    // Filtrowanie rejestru po dokumencie przekierowuje do łańcucha dowodowego
    const spikevaxCard = screen.getByTestId('source-card-doc-ema-spikevax-xfg-pl');
    await user.click(
      within(spikevaxCard).getByRole('button', { name: /Filtruj dowody dla tego dokumentu/i })
    );

    const chainList = screen.getByTestId('b2-evidence-chain-list');
    const items = within(chainList).getAllByRole('article');
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((el) => /doc-ema-spikevax-xfg-pl/.test(el.textContent ?? ''))).toBe(true);
  }, 15000);

  it('waliduje zakres stron PDF i pozwala dodać/usunąć roboczy ślad dowodowy oraz nieformalną notatkę z zachowaniem autoResolved=false', async () => {
    const user = userEvent.setup();
    render(<ChplAuditWorkbenchView vaccines={VACCINES_CATALOG} onOpenVaccineById={vi.fn()} />);

    const form = screen.getByTestId('b2-add-evidence-form');
    const formScope = within(form);

    // Próba podania strony PDF przekraczającej objętość BCG 10 (7 str.)
    const pageInput = formScope.getByLabelText(/Indeks strony PDF/i);
    fireEvent.change(pageInput, { target: { value: '99' } });
    fireEvent.change(formScope.getByLabelText(/Krótki fragment \/ odniesienie źródłowe/i), {
      target: { value: 'Pkt 4.2 ChPL BCG 10 — podanie śródskórne' }
    });
    fireEvent.change(formScope.getByLabelText(/Obserwacja robocza audytora/i), {
      target: { value: 'Test przekroczenia zakresu stron PDF.' }
    });
    await user.click(formScope.getByRole('button', { name: /Zapisz roboczy ślad dowodowy/i }));

    expect(
      formScope.getByText(/Strona PDF \(99\) przekracza liczbę stron dokumentu/i)
    ).toBeInTheDocument();

    // Poprawna strona PDF (3 z 7)
    fireEvent.change(pageInput, { target: { value: '3' } });
    await user.click(formScope.getByRole('button', { name: /Zapisz roboczy ślad dowodowy/i }));

    expect(
      formScope.getByText(/Status pytania nadal wymaga decyzji człowieka \(autoResolved: false\)/i)
    ).toBeInTheDocument();

    const storedEv = JSON.parse(localStorage.getItem(EVIDENCE_LEDGER_STORAGE_KEY) || '[]') as Array<{
      autoResolved: boolean;
    }>;
    expect(storedEv).toHaveLength(1);
    expect(storedEv[0].autoResolved).toBe(false);

    // Dodanie lokalnej notatki roboczej (z wymaganym potwierdzeniem disclaimera)
    const noteForm = screen.getByTestId('b2-working-note-form');
    const noteScope = within(noteForm);
    expect(noteScope.getByText(INFORMAL_WORKING_NOTE_DISCLAIMER)).toBeInTheDocument();

    fireEvent.change(noteScope.getByLabelText(/Treść roboczej notatki lokalnej/i), {
      target: { value: 'Uwaga robocza: sprawdzić ramię podania w pkt 4.2.' }
    });
    await user.click(
      noteScope.getByRole('checkbox', { name: /wyłącznie charakter nieformalnej lokalnej notatki/i })
    );
    await user.click(noteScope.getByRole('button', { name: /Zapisz lokalną notatkę roboczą/i }));

    const storedNotes = JSON.parse(localStorage.getItem(WORKING_NOTES_STORAGE_KEY) || '[]');
    expect(storedNotes).toHaveLength(1);

    // Usunięcie lokalnej notatki i wpisu dowodowego
    await user.click(
      screen.getByRole('button', { name: /Usuń lokalny wpis dowodowy/i })
    );
    expect(JSON.parse(localStorage.getItem(EVIDENCE_LEDGER_STORAGE_KEY) || '[]')).toHaveLength(0);
  }, 60000);

  it('odrzuca manipulowany JSON oraz plik vaxnurseBackup i obsługuje bezpieczny import z podglądem bez naruszenia Infanrix hexa', async () => {
    const user = userEvent.setup();
    render(<ChplAuditWorkbenchView vaccines={VACCINES_CATALOG} onOpenVaccineById={vi.fn()} />);

    const ioBox = screen.getByTestId('b2-evidence-import-export');
    const fileInput = within(ioBox).getByTestId('b2-evidence-import-input') as HTMLInputElement;

    // 1. Próba wczytania głównego backupu aplikacji zamiast rejestru dowodów
    const appBackupFile = new File(
      [JSON.stringify(createBackupPayload(VACCINES_CATALOG))],
      'app-backup.json',
      { type: 'application/json' }
    );
    fireEvent.change(fileInput, { target: { files: [appBackupFile] } });

    const preview1 = await screen.findByTestId('b2-import-preview-card');
    expect(within(preview1).getByText(/ogólna kopia zapasowa katalogu preparatów/i)).toBeInTheDocument();
    expect(
      within(preview1).getByRole('button', { name: /Zastosuj podglądany import dowodów/i })
    ).toBeDisabled();

    // 2. Próba wstrzyknięcia verified_full / autoResolved: true
    const sources = buildBaseSourceRegistry(STAGE1_CHPL_AUDIT_BUNDLE);
    const validEntry = createWorkingEvidenceEntry(
      {
        questionId: 'dec-bcg-42-injection-site',
        documentId: 'doc-rpl-bcg10-19535',
        qrdSection: '4.2',
        pdfPageIndex: 3,
        printedPageNumber: '',
        pageNumberingType: 'pdf_page_index',
        sourceExcerptRef: 'Punkt 4.2 ChPL BCG 10 (str. 3)',
        clinicalObservation: 'Poprawna obserwacja referencyjna.',
        relationship: 'does_not_resolve',
        reviewStatus: 'awaiting_human_review'
      },
      STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist,
      sources
    );
    const validPayload = buildEvidenceLedgerExportPayload({
      sources,
      workingEntries: [validEntry],
      workingNotes: []
    });
    const forgedPayload = {
      ...validPayload,
      entries: [{ ...validEntry, autoResolved: true, reviewStatus: 'verified_full' }]
    };

    const forgedFile = new File([JSON.stringify(forgedPayload)], 'forged-evidence.json', {
      type: 'application/json'
    });
    fireEvent.change(fileInput, { target: { files: [forgedFile] } });

    const preview2 = await screen.findByTestId('b2-import-preview-card');
    expect(within(preview2).getByText(/Błędy bezpieczeństwa lub walidacji/i)).toBeInTheDocument();
    expect(
      within(preview2).getByRole('button', { name: /Zastosuj podglądany import dowodów/i })
    ).toBeDisabled();

    // 3. Poprawny import z podglądem i zatwierdzeniem
    const validFile = new File([JSON.stringify(validPayload)], 'valid-evidence.json', {
      type: 'application/json'
    });
    fireEvent.change(fileInput, { target: { files: [validFile] } });

    const preview3 = await screen.findByTestId('b2-import-preview-card');
    expect(within(preview3).getByText(/1 nowych, 0 aktualizacji/i)).toBeInTheDocument();
    const applyBtn = within(preview3).getByRole('button', {
      name: /Zastosuj podglądany import dowodów/i
    });
    expect(applyBtn).toBeEnabled();
    await user.click(applyBtn);

    expect(
      within(ioBox).getByText(/blokada Infanrix hexa oraz autoResolved: false pozostały niezmienione/i)
    ).toBeInTheDocument();

    // Weryfikacja, że katalog preparatów i blokada Infanrix hexa pozostają nienaruszone
    const infanrixAfter = getStoredVaccines().find((v) => v.id === 'vac-infanrix-hexa');
    expect(infanrixAfter?.verificationStatus).toBe('requires_source_clarification');
    expect(infanrixAfter?.sourceDiscrepancies?.[0]?.status).toBe('requires_clarification');

    // Eksport rejestru dowodów
    await user.click(within(ioBox).getByRole('button', { name: /Eksportuj rejestr dowodów JSON/i }));
    expect(exportedNames[0]).toMatch(/^vaxnurse-rejestr-dowodow-chpl-\d{4}-\d{2}-\d{2}\.json$/);
    const parsedExport = JSON.parse(await exportedBlobs[0].text());
    expect(parsedExport.vaxnurseEvidenceLedger).toBe(true);
    expect(parsedExport.clinicalApprovalGranted).toBe(false);
  });
});

describe('Etap B3 — Quality Dashboard, 4 osie źródeł, kontrola awansu dowodu i UI importu', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('prezentuje 12 metryk Quality Dashboard + disclaimer, banner historyczny i filtr typów obiektów', async () => {
    const user = userEvent.setup();
    render(<ChplAuditWorkbenchView vaccines={VACCINES_CATALOG} onOpenVaccineById={vi.fn()} />);

    const dash = screen.getByTestId('b3-quality-dashboard');
    expect(within(dash).getByTestId('b3-quality-disclaimer')).toHaveTextContent(
      SOURCE_QUALITY_DISCLAIMER
    );
    expect(within(dash).getByTestId('b3-metric-total-sources')).toHaveTextContent('9');
    expect(within(dash).getByTestId('b3-metric-acquired')).toHaveTextContent('1');
    expect(within(dash).getByTestId('b3-metric-registry-only')).toHaveTextContent('3');
    expect(within(dash).getByTestId('b3-metric-failed-attempts')).toHaveTextContent('1');
    expect(within(dash).getByTestId('b3-metric-historical')).toHaveTextContent('1');
    expect(within(dash).getByTestId('b3-metric-no-sha')).toHaveTextContent('1');
    expect(within(dash).getByTestId('b3-metric-calc-sha')).toHaveTextContent('8');
    expect(within(dash).getByTestId('b3-metric-verified-excerpts')).toHaveTextContent('0');
    expect(within(dash).getByTestId('b3-metric-open-questions')).toHaveTextContent('8');

    // Banner historyczny i 4 osie na VaxigripTetra 2025/2026
    const histCard = screen.getByTestId('source-card-doc-rpl-vaxigrip-tetra-35346-hist');
    expect(within(histCard).getAllByText(HISTORICAL_DOCUMENT_NOTICE).length).toBeGreaterThanOrEqual(1);
    expect(histCard).toHaveAttribute('data-object-type', 'historical_document');

    // Filtr typu obiektu źródłowego -> official_endpoint
    const typeSelect = screen.getByLabelText(/Typ obiektu źródłowego/i);
    await user.selectOptions(typeSelect, 'official_endpoint');
    expect(screen.getByTestId('source-card-doc-rpl-spikevax-cen-endpoints')).toBeInTheDocument();
    expect(screen.queryByTestId('source-card-doc-mz-pso-2027-akt')).not.toBeInTheDocument();

    // Przycisk "Pokaż dokument w Rejestrze Źródeł" z Łańcucha dowodowego przywraca lub wybiera dokument
    await user.selectOptions(typeSelect, 'all');
    const navBtns = screen.getAllByRole('button', { name: /Pokaż dokument w Rejestrze Źródeł/i });
    await user.click(navBtns[0]);
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  }, 60000);

  it('blokuje source_excerpt_reviewed bez potwierdzenia PDF, pozwala na świadomy zapis i nie potwierdza importowanego claimu', async () => {
    const user = userEvent.setup();
    document.documentElement.setAttribute('data-density', 'compact');
    document.documentElement.setAttribute('data-font-size', 'large');

    render(<ChplAuditWorkbenchView vaccines={VACCINES_CATALOG} onOpenVaccineById={vi.fn()} />);

    const form = screen.getByTestId('b2-add-evidence-form');
    const formScope = within(form);

    await user.selectOptions(formScope.getByLabelText(/Dokument z Rejestru Źródeł/i), 'doc-rpl-bcg10-19535');
    fireEvent.change(formScope.getByLabelText(/Indeks strony PDF/i), { target: { value: '3' } });
    fireEvent.change(formScope.getByLabelText(/Krótki fragment \/ odniesienie źródłowe/i), {
      target: { value: 'Pkt 4.2 ChPL BCG 10 — strona 3 PDF' }
    });
    fireEvent.change(formScope.getByLabelText(/Obserwacja robocza audytora/i), {
      target: { value: 'Sprawdzenie miejsca podania w rzeczywistym pliku PDF.' }
    });
    await user.selectOptions(
      formScope.getByLabelText(/Klasa kwalifikacji dowodu/i),
      'source_excerpt_reviewed'
    );

    // Próba bez zaznaczenia checkboxa potwierdzenia porównania z PDF -> blokada
    await user.click(formScope.getByRole('button', { name: /Zapisz roboczy ślad dowodowy/i }));
    expect(
      formScope.getByText(/ręcznie porównany z treścią rzeczywistego pliku PDF/i)
    ).toBeInTheDocument();
    expect(screen.getByTestId('b3-metric-verified-excerpts')).toHaveTextContent('0');

    // Po zaznaczeniu checkboxa -> zapis + dynamiczna aktualizacja licznika Quality Dashboard, nadal autoResolved=false
    await user.click(
      formScope.getByRole('checkbox', { name: /Potwierdzam ręczne sprawdzenie przytoczonego fragmentu/i })
    );
    await user.click(formScope.getByRole('button', { name: /Zapisz roboczy ślad dowodowy/i }));
    expect(screen.getByTestId('b3-metric-verified-excerpts')).toHaveTextContent('1');
    expect(screen.getByTestId('b3-metric-open-questions')).toHaveTextContent('7');

    // Eksport i czysty re-import -> deklaracja z JSON zostaje oznaczona jako niepotwierdzona lokalnie!
    const storedNow = JSON.parse(localStorage.getItem(EVIDENCE_LEDGER_STORAGE_KEY) || '[]');
    const sources = buildBaseSourceRegistry(STAGE1_CHPL_AUDIT_BUNDLE);
    const claimExport = buildEvidenceLedgerExportPayload({
      sources,
      workingEntries: storedNow,
      workingNotes: []
    });
    localStorage.clear();

    // Usuń poprzedni wpis z UI
    await user.click(screen.getByRole('button', { name: /Usuń lokalny wpis dowodowy/i }));
    expect(screen.getByTestId('b3-metric-verified-excerpts')).toHaveTextContent('0');

    const ioBox = screen.getByTestId('b2-evidence-import-export');
    const fileInput = within(ioBox).getByTestId('b2-evidence-import-input') as HTMLInputElement;
    const claimFile = new File([JSON.stringify(claimExport)], 'claimed-verified.json', {
      type: 'application/json'
    });
    fireEvent.change(fileInput, { target: { files: [claimFile] } });

    const preview = await screen.findByTestId('b2-import-preview-card');
    expect(preview).toHaveTextContent(/Deklaracje weryfikacji pochodzące z importu JSON:\s*1/i);
    await user.click(within(preview).getByRole('button', { name: /Zastosuj podglądany import dowodów/i }));

    expect(screen.getByTestId('b3-metric-verified-excerpts')).toHaveTextContent('0');
    expect(screen.getAllByText(/Z importu JSON \(niepotwierdzone lokalnie\)/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Wymaga kontroli w oryginalnym PDF/i).length).toBeGreaterThanOrEqual(1);
  }, 60000);
});

interface BridgeHarnessProps {
  initialSources?: SourceRegistryEntry[];
  initialEntries?: EvidenceLedgerEntry[];
  initialDocumentId?: string;
  openPdfDocumentFn: (bytes: Uint8Array) => Promise<OpenedLocalPdfSession>;
}

function LocalPdfBridgeHarness({
  initialSources,
  initialEntries = [],
  initialDocumentId = 'doc-rpl-bcg10-19535',
  openPdfDocumentFn
}: BridgeHarnessProps) {
  const [sources, setSources] = useState<SourceRegistryEntry[]>(
    () => initialSources ?? loadSourceRegistryWithLocalArtifacts(STAGE1_CHPL_AUDIT_BUNDLE, localStorage)
  );
  const [entries, setEntries] = useState<EvidenceLedgerEntry[]>(initialEntries);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>(initialDocumentId);

  return (
    <div>
      <LocalPdfBridgePanel
        sources={sources}
        checklist={STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist}
        workingEntries={entries}
        selectedDocumentId={selectedDocumentId}
        onSelectDocumentId={setSelectedDocumentId}
        onRegisterLocalPdfSession={(inspection) => {
          const result = registerLocalPdfInspectionSession({
            sources,
            entries,
            inspection
          });
          setSources(result.updatedSources);
          setEntries(result.updatedEntries);
          saveLocalSourceArtifactsToStorage(localStorage, result.updatedSources);
          return {
            updatedSource: result.updatedSource,
            versionCreated: result.versionCreated,
            reverificationTriggered: result.reverificationTriggered
          };
        }}
        onCreatePdfEvidenceEntry={(draft: WorkingEvidenceDraftInput) => {
          const validation = validateWorkingEvidenceInput(
            draft,
            STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist,
            sources
          );
          if (!validation.valid) {
            return { success: false, error: validation.errors.join(' ') };
          }
          const entry = createWorkingEvidenceEntry(
            draft,
            STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist,
            sources
          );
          setEntries((prev) => [entry, ...prev]);
          return { success: true, entry };
        }}
        onClearPersistedArtifacts={() => {
          clearLocalSourceArtifactsFromStorage(localStorage);
          setSources(loadSourceRegistryWithLocalArtifacts(STAGE1_CHPL_AUDIT_BUNDLE, localStorage));
        }}
        openPdfDocumentFn={openPdfDocumentFn}
      />
      <output data-testid="harness-entries-json">{JSON.stringify(entries)}</output>
    </div>
  );
}

function createMockOpenedPdfSession(
  pageTexts: string[] = [
    'CHPL BCG 10 strona 1: 4.1 Wskazania do stosowania.',
    'CHPL BCG 10 strona 2: 6.1 Substancje pomocnicze: sodu chlorek, woda do wstrzykiwan.'
  ],
  title = 'ChPL BCG 10 Test'
): OpenedLocalPdfSession {
  return {
    pageCount: pageTexts.length,
    parserVersion: '6.5.438',
    metadataStatus: 'extracted',
    textLayerStatus: pageTexts.some((t) => t.trim().length > 0)
      ? 'text_layer_available'
      : 'no_text_layer',
    metadata: createEmptyPdfMetadataSummary({ title }),
    getPage: vi.fn() as never,
    getPagePlainText: async (pageNumber) => pageTexts[pageNumber - 1] ?? '',
    searchPlainText: async (query) => {
      const needle = query.trim().toLowerCase();
      const matches = pageTexts
        .map((txt, idx) =>
          txt.toLowerCase().includes(needle)
            ? { pageNumber: idx + 1, snippet: txt }
            : null
        )
        .filter((m): m is { pageNumber: number; snippet: string } => m !== null);
      return {
        query,
        pagesScanned: pageTexts.length,
        totalPages: pageTexts.length,
        matches,
        truncated: false,
        disclaimer: LOCAL_PDF_TEXT_LAYER_DISCLAIMER
      };
    },
    renderPageToCanvas: ({ canvas, scale }) => ({
      renderTaskPromise: Promise.resolve({} as never),
      done: (async () => {
        const widthPx = Math.round(400 * scale);
        const heightPx = Math.round(560 * scale);
        canvas.width = widthPx;
        canvas.height = heightPx;
        return { widthPx, heightPx };
      })(),
      cancel: vi.fn()
    }),
    destroy: async () => undefined
  };
}

describe('Etap B4 — LocalPdfBridgePanel: lokalna weryfikacja PDF, podgląd, wyszukiwanie i rejestracja dowodów', () => {
  const originalCryptoDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');

  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(globalThis, 'crypto', {
      value: {
        randomUUID: () => webcrypto.randomUUID(),
        subtle: {
          digest: async (algorithm: AlgorithmIdentifier, data: BufferSource) => {
            const view =
              data instanceof ArrayBuffer
                ? new Uint8Array(data)
                : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
            return webcrypto.subtle.digest(algorithm, Buffer.from(view));
          }
        }
      },
      configurable: true
    });
  });

  afterEach(() => {
    if (originalCryptoDescriptor) {
      Object.defineProperty(globalThis, 'crypto', originalCryptoDescriptor);
    }
  });

  it('odrzuca zamaskowany plik HTML .pdf oraz pusty plik bez wywołania parsera PDF.js', async () => {
    const user = userEvent.setup();
    const openSpy = vi.fn(async () => createMockOpenedPdfSession());
    render(<LocalPdfBridgeHarness openPdfDocumentFn={openSpy} />);

    const fileInput = screen.getByTestId('b4-local-pdf-input') as HTMLInputElement;

    const disguisedFile = new File([buildFakeDisguisedPdfBytes()], 'falszywy-chpl.pdf', {
      type: 'application/pdf'
    });
    await user.upload(fileInput, disguisedFile);
    const errDisguised = await screen.findByTestId('b4-bridge-error');
    expect(errDisguised.textContent).toMatch(/%PDF-/i);
    expect(openSpy).not.toHaveBeenCalled();

    const emptyFile = new File([], 'pusty-chpl.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [emptyFile] } });
    const errEmpty = await screen.findByTestId('b4-bridge-error');
    expect(errEmpty.textContent).toMatch(/pusty/i);
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('wylicza SHA-256, obsługuje nawigację stron, zoom, szukanie w warstwie tekstowej oraz kontrolowaną rejestrację dowodu z bramką człowieka', async () => {
    const user = userEvent.setup();
    const pdfBytes = buildSyntheticPdfBytes();
    const expectedSha = computeNodeSha256Hex(pdfBytes);

    render(
      <LocalPdfBridgeHarness
        openPdfDocumentFn={async () => createMockOpenedPdfSession()}
      />
    );

    await user.selectOptions(screen.getByTestId('b4-ref-mode-select'), 'none');
    const fileInput = screen.getByTestId('b4-local-pdf-input') as HTMLInputElement;
    await user.upload(
      fileInput,
      new File([pdfBytes], 'bcg10-synth.pdf', { type: 'application/pdf' })
    );

    const shaNode = await screen.findByTestId('b4-calculated-sha256');
    expect(shaNode.textContent?.trim()).toBe(expectedSha);
    expect(screen.getByTestId('b4-hash-evaluation-notice').textContent).toContain(
      LOCAL_PDF_UNTRUSTED_HASH_NOTICE
    );
    expect(screen.getByTestId('b4-page-count-comparison').textContent).toMatch(/2.*7/);

    expect(screen.getByTestId('b4-page-indicator').textContent).toBe('Strona 1 z 2');
    await user.click(screen.getByTestId('b4-next-page-btn'));
    expect(screen.getByTestId('b4-page-indicator').textContent).toBe('Strona 2 z 2');
    await user.click(screen.getByTestId('b4-prev-page-btn'));
    expect(screen.getByTestId('b4-page-indicator').textContent).toBe('Strona 1 z 2');

    const jumpInput = screen.getByLabelText('Przejdź do numeru strony PDF');
    await user.clear(jumpInput);
    await user.type(jumpInput, '2');
    await user.click(screen.getByTestId('b4-go-page-btn'));
    expect(screen.getByTestId('b4-page-indicator').textContent).toBe('Strona 2 z 2');

    await user.click(screen.getByRole('button', { name: 'Powiększ podgląd PDF' }));
    expect(screen.getByTestId('b4-zoom-indicator').textContent).toBe('125%');
    await user.click(screen.getByRole('button', { name: 'Pomniejsz podgląd PDF' }));
    expect(screen.getByTestId('b4-zoom-indicator').textContent).toBe('110%');

    expect(screen.getByTestId('b4-text-layer-disclaimer').textContent).toBe(
      LOCAL_PDF_TEXT_LAYER_DISCLAIMER
    );
    await user.click(screen.getByTestId('b4-prev-page-btn'));
    await user.type(screen.getByTestId('b4-pdf-text-search'), 'sodu chlorek');
    await user.click(screen.getByRole('button', { name: 'Szukaj w tekście' }));

    const resultsBox = await screen.findByTestId('b4-text-search-results');
    const jumpMatchBtn = within(resultsBox).getByRole('button', { name: 'Strona 2' });
    await user.click(jumpMatchBtn);
    expect(screen.getByTestId('b4-page-indicator').textContent).toBe('Strona 2 z 2');

    // Próba zapisu bez zaznaczenia bramki człowieka musi zostać odrzucona
    const form = screen.getByTestId('b4-pdf-evidence-form');
    await user.selectOptions(within(form).getByLabelText(/Pytanie audytowe/i), 'dec-bcg-42-injection-site');
    await user.type(within(form).getByLabelText(/Numer drukowany/i), '2');
    await user.type(
      within(form).getByLabelText(/Sprawdzony cytat/i),
      'Sodu chlorek i woda do wstrzykiwan na str. 2.'
    );
    await user.type(
      within(form).getByLabelText(/Obserwacja audytora/i),
      'Sprawdzono fragment w lokalnym podglądzie PDF.'
    );
    await user.click(screen.getByTestId('b4-submit-pdf-evidence-btn'));

    expect(within(form).getByRole('alert').textContent).toMatch(/potwierdzenia|PDF/i);
    expect(JSON.parse(screen.getByTestId('harness-entries-json').textContent || '[]')).toHaveLength(
      0
    );
    expect(within(form).getByText(LOCAL_PDF_NO_CLINICAL_APPROVAL_NOTICE)).toBeInTheDocument();

    // Poprawne potwierdzenie tworzy source_excerpt_reviewed z autoResolved: false
    await user.click(screen.getByTestId('b4-ev-human-confirm'));
    await user.click(screen.getByTestId('b4-submit-pdf-evidence-btn'));

    let savedEntries = JSON.parse(
      screen.getByTestId('harness-entries-json').textContent || '[]'
    ) as EvidenceLedgerEntry[];
    expect(savedEntries).toHaveLength(1);
    expect(savedEntries[0]?.qualificationClass).toBe('source_excerpt_reviewed');
    expect(savedEntries[0]?.autoResolved).toBe(false);
    expect(savedEntries[0]?.sourceDocumentHash).toBe(expectedSha);
    expect(savedEntries[0]?.artifactId).toBeTruthy();

    // Rejestracja potwierdzonej rozbieżności conflicting_source_excerpt również utrzymuje autoResolved: false
    await user.selectOptions(within(form).getByLabelText(/Relacja względem pytania/i), 'contradicts');
    await user.selectOptions(
      within(form).getByLabelText(/Klasa kwalifikacji dowodu/i),
      'conflicting_source_excerpt'
    );
    await user.selectOptions(within(form).getByLabelText(/Status roboczy dowodu/i), 'conflicting_evidence');
    await user.type(
      within(form).getByLabelText(/Sprawdzony cytat/i),
      'Rozbieżny zapis w otwartym dokumencie PDF str. 2.'
    );
    await user.type(
      within(form).getByLabelText(/Obserwacja audytora/i),
      'Wykazano niezgodność pomiędzy dwoma fragmentami.'
    );
    await user.click(screen.getByTestId('b4-ev-human-confirm'));
    await user.click(screen.getByTestId('b4-submit-pdf-evidence-btn'));

    savedEntries = JSON.parse(
      screen.getByTestId('harness-entries-json').textContent || '[]'
    ) as EvidenceLedgerEntry[];
    expect(savedEntries).toHaveLength(2);
    expect(savedEntries[0]?.qualificationClass).toBe('conflicting_source_excerpt');
    expect(savedEntries[0]?.autoResolved).toBe(false);
  }, 20000);

  it('nie degraduje dowodu przy identycznym SHA-256 i uruchamia kaskadę ponownej weryfikacji po zmianie bajtów PDF', async () => {
    const user = userEvent.setup();
    const pdfV1 = buildSyntheticPdfBytes({ title: 'BCG v1' });
    const pdfV2 = buildSyntheticPdfBytes({
      title: 'BCG v2 zmodyfikowany',
      pages: [
        { lines: ['Zmieniona treść strony 1'] },
        { lines: ['Zmieniona treść strony 2'] }
      ]
    });

    render(
      <LocalPdfBridgeHarness
        openPdfDocumentFn={async () => createMockOpenedPdfSession()}
      />
    );

    const fileInput = screen.getByTestId('b4-local-pdf-input') as HTMLInputElement;
    await user.upload(fileInput, new File([pdfV1], 'bcg10.pdf', { type: 'application/pdf' }));
    const firstArtifactId = (await screen.findByTestId('b4-active-artifact-id')).textContent?.trim();

    const form = screen.getByTestId('b4-pdf-evidence-form');
    await user.selectOptions(within(form).getByLabelText(/Pytanie audytowe/i), 'dec-bcg-42-injection-site');
    await user.type(within(form).getByLabelText(/Sprawdzony cytat/i), 'Fragment z wersji v1.');
    await user.type(within(form).getByLabelText(/Obserwacja audytora/i), 'Sprawdzono wersję v1.');
    await user.click(screen.getByTestId('b4-ev-human-confirm'));
    await user.click(screen.getByTestId('b4-submit-pdf-evidence-btn'));

    // Ponowne wgranie identycznych bajtów
    await user.upload(fileInput, new File([pdfV1], 'bcg10.pdf', { type: 'application/pdf' }));
    const secondArtifactId = (await screen.findByTestId('b4-active-artifact-id')).textContent?.trim();
    expect(secondArtifactId).toBe(firstArtifactId);
    expect(screen.queryByTestId('b4-reverification-alert')).not.toBeInTheDocument();

    let entries = JSON.parse(
      screen.getByTestId('harness-entries-json').textContent || '[]'
    ) as EvidenceLedgerEntry[];
    expect(entries[0]?.requiresReverification).toBe(false);
    expect(entries[0]?.qualificationClass).toBe('source_excerpt_reviewed');

    // Wgranie zmienionych bajtów pod tą samą nazwą uruchamia kaskadę
    await user.upload(fileInput, new File([pdfV2], 'bcg10.pdf', { type: 'application/pdf' }));
    expect(await screen.findByTestId('b4-reverification-alert')).toBeInTheDocument();
    const thirdArtifactId = screen.getByTestId('b4-active-artifact-id').textContent?.trim();
    expect(thirdArtifactId).not.toBe(firstArtifactId);

    entries = JSON.parse(
      screen.getByTestId('harness-entries-json').textContent || '[]'
    ) as EvidenceLedgerEntry[];
    expect(entries[0]?.requiresReverification).toBe(true);
    expect(entries[0]?.qualificationClass).toBe('source_excerpt_pending_review');
  }, 20000);

  it('po przeładowaniu wyświetla baner ponownego wskazania pliku i pozwala bezpiecznie wyczyścić metadane artefaktów', async () => {
    const user = userEvent.setup();
    const baseSources = buildBaseSourceRegistry(STAGE1_CHPL_AUDIT_BUNDLE);
    const reg = registerLocalPdfInspectionSession({
      sources: baseSources,
      entries: [],
      inspection: {
        documentId: 'doc-rpl-bcg10-19535',
        verificationSessionId: 'sess-reload-test',
        fileName: 'bcg10-local.pdf',
        fileSizeBytes: 1024,
        mimeType: 'application/pdf',
        sha256Hex: 'a'.repeat(64),
        comparisonStatus: 'calculated_from_local_file',
        integrityStatus: 'hash_calculated',
        referenceType: 'none',
        referenceHash: null,
        pageCount: 2,
        pdfParserVersion: '6.5.438',
        metadataStatus: 'extracted',
        textLayerStatus: 'text_layer_available',
        pdfMetadata: createEmptyPdfMetadataSummary({ title: 'Reload Test' }),
        operatorDeclaredOrigin: null
      }
    });
    saveLocalSourceArtifactsToStorage(localStorage, reg.updatedSources);

    const { unmount } = render(
      <LocalPdfBridgeHarness openPdfDocumentFn={async () => createMockOpenedPdfSession()} />
    );

    expect(screen.getByTestId('b4-reload-reselect-banner').textContent).toContain(
      LOCAL_PDF_RELOAD_REQUIRED_NOTICE
    );
    expect(screen.getByTestId('b4-source-availability').textContent).toMatch(
      /wymagane ponowne wybranie pliku/i
    );

    await user.click(screen.getByTestId('b4-clear-artifacts-btn'));
    expect(localStorage.getItem(SOURCE_ARTIFACTS_STORAGE_KEY)).toBeNull();
    expect(screen.queryByTestId('b4-reload-reselect-banner')).not.toBeInTheDocument();

    unmount();
  });
});
