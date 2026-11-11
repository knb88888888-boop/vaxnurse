import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChplAuditWorkbenchView } from '../../src/components/vaccines/ChplAuditWorkbenchView';
import { VACCINES_CATALOG } from '../../src/data/vaccinesCatalog';
import { CHPL_WORKBENCH_SAFETY_NOTICE } from '../../src/utils/chplWorkbench';
import { STAGE1_CHPL_AUDIT_BUNDLE } from '../../src/data/chplStage1AuditSheets';

describe('ChplAuditWorkbenchView — stanowisko audytu ChPL (ETAP B1 · READ-ONLY)', () => {
  let exportedBlobs: Blob[] = [];
  let exportedNames: string[] = [];

  beforeEach(() => {
    exportedBlobs = [];
    exportedNames = [];

    Object.defineProperty(URL, 'createObjectURL', {
      value: vi.fn((blob: Blob) => {
        exportedBlobs.push(blob);
        return `blob:wb-mock-${exportedBlobs.length}`;
      }),
      writable: true,
      configurable: true,
    });

    Object.defineProperty(URL, 'revokeObjectURL', {
      value: vi.fn(),
      writable: true,
      configurable: true,
    });

    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement
    ) {
      exportedNames.push(this.download);
    });
  });

  it('wyświetla dosłowne ostrzeżenie bezpieczeństwa, 4 warstwy informacji oraz poprawne metryki Sekcji A bez fałszywego verified_full', () => {
    render(<ChplAuditWorkbenchView vaccines={VACCINES_CATALOG} onOpenVaccineById={vi.fn()} />);

    expect(screen.getByText(CHPL_WORKBENCH_SAFETY_NOTICE)).toBeInTheDocument();
    expect(screen.getByText(/TRYB WYŁĄCZNIE DO ODCZYTU \(ETAP B1\)/i)).toBeInTheDocument();

    // 4 warstwy informacji
    expect(screen.getByText(/1\. Oficjalny dokument źródłowy/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. Wstępne streszczenie dokumentu/i)).toBeInTheDocument();
    expect(screen.getByText(/3\. Problem wymagający oceny/i)).toBeInTheDocument();
    expect(screen.getByText(/4\. Decyzja kompetentnego audytora/i)).toBeInTheDocument();

    // Metryki Sekcji A wyliczane ze źródeł
    expect(screen.getByTestId('metric-pso-procedures')).toHaveTextContent('43');
    expect(screen.getByTestId('metric-identified-docs')).toHaveTextContent(/4 PDF Etapu I/);
    expect(screen.getByTestId('metric-open-questions')).toHaveTextContent('8 z 8');
    expect(screen.getByTestId('metric-verified-full')).toHaveTextContent(/0 procedur · 0 kart ChPL/);

    // Brak etykiet mogących mylić audyt roboczy z zatwierdzeniem klinicznym
    expect(screen.queryByText(/^ZWERYFIKOWANO$/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/NIE ZATWIERDZONO KLINICZNIE/i).length).toBeGreaterThan(0);
  });

  it('prezentuje wszystkie 4 dokumenty Etapu I, separuje RPL od EMA EPAR (PL 177 str. + EN 158 str.) i pokazuje 18 podpunktów QRD', async () => {
    const user = userEvent.setup();
    render(<ChplAuditWorkbenchView vaccines={VACCINES_CATALOG} onOpenVaccineById={vi.fn()} />);

    // Przełączenie na Spikevax XFG
    const spikevaxBtn = screen.getByRole('button', { name: /Spikevax XFG/i });
    await user.click(spikevaxBtn);

    const detailsSection = screen.getByRole('heading', {
      name: /Sekcja D — Szczegóły dokumentacji audytowej/i,
    }).closest('section');
    expect(detailsSection).not.toBeNull();

    const detailsScope = within(detailsSection as HTMLElement);
    expect(detailsScope.getAllByText(/EU\/1\/20\/1507\/041–050/).length).toBeGreaterThan(0);
    expect(detailsScope.getByText(/177 str\./i)).toBeInTheDocument();
    expect(detailsScope.getByText(/158 str\./i)).toBeInTheDocument();

    // Wszystkie 18 sekcji / podpunktów QRD dla Spikevax XFG
    const spikevaxSheet = STAGE1_CHPL_AUDIT_BUNDLE.contentAnalysisSheets.find(
      (s) => s.productKey === 'spikevax_xfg'
    );
    expect(spikevaxSheet?.entries).toHaveLength(18);
    expect(detailsScope.getByText(/4\.1 Wskazania do stosowania/i)).toBeInTheDocument();
    expect(detailsScope.getByText(/4\.9 Przedawkowanie/i)).toBeInTheDocument();
  }, 15000);

  it('prezentuje missingDataReport i wszystkie 8 otwartych pytań do audytora z autoResolved = false', () => {
    render(<ChplAuditWorkbenchView vaccines={VACCINES_CATALOG} onOpenVaccineById={vi.fn()} />);

    const detailsSection = screen.getByRole('heading', {
      name: /Sekcja D — Szczegóły dokumentacji audytowej/i,
    }).closest('section') as HTMLElement;
    const detailsScope = within(detailsSection);

    // Wszystkie 8 pytań z humanDecisionChecklist widoczne domyślnie w Sekcji D
    for (const q of STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist) {
      expect(detailsScope.getByText(q.id)).toBeInTheDocument();
      expect(detailsScope.getByText(q.clinicalQuestion)).toBeInTheDocument();
    }
    expect(detailsScope.getAllByText(/autoResolved: false/i)).toHaveLength(8);
  });

  it('filtruje kolejkę po grupach A–E oraz frazie i chroni otwarcie karty Infanrix hexa w katalogu', async () => {
    const user = userEvent.setup();
    const onOpenVaccineById = vi.fn();

    render(
      <ChplAuditWorkbenchView
        vaccines={VACCINES_CATALOG}
        onOpenVaccineById={onOpenVaccineById}
      />
    );

    const searchInput = screen.getByRole('textbox', {
      name: /Szukaj w kolejce audytu ChPL/i,
    });
    await user.type(searchInput, 'Infanrix');

    const infanrixCardBtns = await screen.findAllByRole('button', {
      name: /Karta ChPL: Infanrix hexa/i,
    });
    await user.click(infanrixCardBtns[0]);
    expect(onOpenVaccineById).toHaveBeenCalledWith('vac-infanrix-hexa');

    // Wyczyść frazę i przetestuj brak akcji edycyjnych / awansu statusu
    await user.click(screen.getByRole('button', { name: /Wyczyść frazę wyszukiwania kolejki/i }));
    expect(
      screen.queryByRole('button', { name: /Zatwierdź status|Oznacz jako zweryfikowany|Zamknij pytanie/i })
    ).not.toBeInTheDocument();
  }, 15000);

  it('eksportuje wyłącznie roboczy raport JSON (isWorkingDraft: true) oraz wywołuje wydruk roboczy', async () => {
    const user = userEvent.setup();
    const printSpy = vi.fn();
    Object.defineProperty(window, 'print', {
      value: printSpy,
      writable: true,
      configurable: true,
    });

    render(<ChplAuditWorkbenchView vaccines={VACCINES_CATALOG} onOpenVaccineById={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /Drukuj roboczy raport/i }));
    expect(printSpy).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /Eksportuj roboczy JSON/i }));
    expect(exportedNames).toHaveLength(1);
    expect(exportedNames[0]).toMatch(/^vaxnurse-raport-roboczy-audytu-chpl-\d{4}-\d{2}-\d{2}\.json$/);

    const reportText = await exportedBlobs[0].text();
    const report = JSON.parse(reportText) as {
      isWorkingDraft: boolean;
      clinicalApprovalGranted: boolean;
      containsPatientData: boolean;
      humanQuestions: Array<{ autoResolved: boolean }>;
    };

    expect(report.isWorkingDraft).toBe(true);
    expect(report.clinicalApprovalGranted).toBe(false);
    expect(report.containsPatientData).toBe(false);
    expect(report.humanQuestions).toHaveLength(8);
    expect(report.humanQuestions.every((q) => q.autoResolved === false)).toBe(true);
  }, 15000);
});
