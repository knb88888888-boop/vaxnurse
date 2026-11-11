import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChplAuditWorkbenchView } from '../../src/components/vaccines/ChplAuditWorkbenchView';
import { VACCINES_CATALOG } from '../../src/data/vaccinesCatalog';
import { STAGE1_CHPL_AUDIT_BUNDLE } from '../../src/data/chplStage1AuditSheets';
import { createBackupPayload, getStoredVaccines } from '../../src/utils/backup';
import {
  EMPTY_QUESTION_EVIDENCE_MESSAGE,
  EVIDENCE_LEDGER_STORAGE_KEY,
  HISTORICAL_DOCUMENT_NOTICE,
  INFORMAL_WORKING_NOTE_DISCLAIMER,
  SOURCE_QUALITY_DISCLAIMER,
  WORKING_NOTES_STORAGE_KEY,
  buildBaseSourceRegistry,
  buildEvidenceLedgerExportPayload,
  createWorkingEvidenceEntry
} from '../../src/utils/chplEvidenceLedger';

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
  });

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
  }, 30000);

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
  }, 35000);

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
  }, 30000);
});
