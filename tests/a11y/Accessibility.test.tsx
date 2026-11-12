import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import type { Result as AxeResult } from 'axe-core';
import App from '../../src/App';
import { SettingsView } from '../../src/components/settings/SettingsView';
import { LocalPdfBridgePanel } from '../../src/components/vaccines/LocalPdfBridgePanel';
import { AuditWorkspaceB5Panel } from '../../src/components/vaccines/AuditWorkspaceB5Panel';
import { APP_MODULES } from '../../src/data/navigationData';
import { STAGE1_CHPL_AUDIT_BUNDLE } from '../../src/data/chplStage1AuditSheets';
import { VACCINES_CATALOG } from '../../src/data/vaccinesCatalog';
import { createBackupPayload } from '../../src/utils/backup';
import {
  buildBaseSourceRegistry,
  buildBaselineEvidenceEntries,
  registerLocalPdfInspectionSession
} from '../../src/utils/chplEvidenceLedger';
import {
  buildQuestionReviewQueueB5,
  buildSourceIntakeItems,
  computeAuditProgressB5Metrics
} from '../../src/utils/chplAuditDossier';
import { createEmptyPdfMetadataSummary } from '../../src/utils/localPdfBridge';
import type { ModuleDefinition } from '../../src/types/navigation';
import { buildSyntheticPdfBytes } from '../helpers/syntheticPdf';
import { webcrypto } from 'node:crypto';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const formatAxeViolations = (violations: AxeResult[]): string =>
  violations
    .map((v) => {
      const nodes = v.nodes
        .slice(0, 5)
        .map((n) => `  - ${n.target.join(' > ')} :: ${n.failureSummary ?? ''}`)
        .join('\n');
      return `[${v.impact ?? 'unknown'}] ${v.id}: ${v.help}\n${nodes}`;
    })
    .join('\n\n');

const runWcagAxe = async (container: HTMLElement, contextLabel: string) => {
  const wcagResults = await axe.run(container, {
    runOnly: { type: 'tag', values: WCAG_TAGS },
  });

  const bestPracticeResults = await axe.run(container, {
    runOnly: { type: 'tag', values: ['best-practice'] },
  });

  if (wcagResults.violations.length > 0) {
    throw new Error(
      `Wykryto naruszenia WCAG 2.1/2.2 A/AA w widoku [${contextLabel}]:\n${formatAxeViolations(wcagResults.violations)}`
    );
  }

  return {
    wcagViolations: wcagResults.violations.length,
    wcagPasses: wcagResults.passes.length,
    bestPracticeViolations: bestPracticeResults.violations,
  };
};

const getSettingsModule = (): ModuleDefinition => {
  const found = APP_MODULES.find((m) => m.id === 'settings');
  if (!found) {
    throw new Error('Brak definicji modułu settings');
  }
  return found;
};

describe('Automatyczny audyt dostępności WCAG 2.1/2.2 A/AA (axe-core w Vitest/jsdom)', () => {
  it('Pulpit (Dashboard) + globalna wyszukiwarka + pasek boczny spełniają WCAG 2.1/2.2 A/AA', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    await screen.findByText(/Narzędzie referencyjne pielęgniarki • Tryb lokalny/i);
    const dashboardAudit = await runWcagAxe(container, 'Dashboard');
    expect(dashboardAudit.wcagViolations).toBe(0);

    // Otwórz globalne wyszukiwanie w nagłówku i sprawdź dropdown wyników
    const searchInput = screen.getAllByRole('textbox', {
      name: /Szukaj modułów i sekcji VaxNurse/i,
    })[0];
    await user.click(searchInput);
    await user.type(searchInput, 'ChPL');
    await screen.findByRole('region', {
      name: /Wyniki wyszukiwania modułów i sekcji VaxNurse/i,
    });

    const searchAudit = await runWcagAxe(container, 'Header + Global Search Open');
    expect(searchAudit.wcagViolations).toBe(0);
  }, 15000);

  it('Moduły kliniczne (Szczepienia dzieci PSO, Baza preparatów, Stanowisko audytu ChPL, Karta ChPL) spełniają WCAG 2.1/2.2 A/AA', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    // 1. Szczepienia dzieci (PSO 2027)
    await user.click(screen.getAllByRole('button', { name: /Szczepienia dzieci/i })[0]);
    await screen.findByText(/Gruźlica/i, {}, { timeout: 10000 });
    expect((await runWcagAxe(container, 'ChildVaccinationsView')).wcagViolations).toBe(0);

    // 2. Baza preparatów (Katalog)
    await user.click(screen.getAllByRole('button', { name: /Baza preparatów/i })[0]);
    await screen.findByTestId('vaccines-mode-workbench', {}, { timeout: 10000 });
    expect((await runWcagAxe(container, 'VaccinesDatabaseView')).wcagViolations).toBe(0);

    // 3. Stanowisko audytu ChPL (Workbench READ-ONLY + Etap B2/B3 Quality Dashboard, Source Registry & Evidence Ledger)
    await user.click(screen.getByTestId('vaccines-mode-workbench'));
    await screen.findByRole(
      'heading',
      {
        name: /Stanowisko audytu dokumentacji ChPL/i,
      },
      { timeout: 10000 }
    );
    await screen.findByTestId('b3-quality-dashboard', {}, { timeout: 10000 });
    await screen.findByTestId('b2-source-registry-panel', {}, { timeout: 10000 });
    await screen.findByTestId('b4-local-pdf-bridge', {}, { timeout: 10000 });
    await screen.findByTestId('b2-evidence-ledger-panel', {}, { timeout: 10000 });
    expect((await runWcagAxe(container, 'ChplAuditWorkbenchView + B3/B4')).wcagViolations).toBe(0);

    // 3b. Stanowisko audytu ChPL w trybie compact + large
    document.documentElement.setAttribute('data-density', 'compact');
    document.documentElement.setAttribute('data-font-size', 'large');
    expect((await runWcagAxe(container, 'ChplAuditWorkbenchView + B3 (compact + large)')).wcagViolations).toBe(0);
    document.documentElement.removeAttribute('data-density');
    document.documentElement.removeAttribute('data-font-size');

    // 4. Karta ChPL Infanrix hexa (zwinięte + rozwinięte akordeony)
    const infanrixBtns = await screen.findAllByRole(
      'button',
      {
        name: /Karta ChPL: Infanrix hexa/i,
      },
      { timeout: 10000 }
    );
    await user.click(infanrixBtns[0]);
    await screen.findByRole('heading', { name: /Infanrix hexa/i }, { timeout: 10000 });
    expect((await runWcagAxe(container, 'VaccineDetailView (Infanrix)')).wcagViolations).toBe(0);

    await user.click(screen.getByRole('button', { name: /Rozwiń wszystkie punkty/i }));
    await waitFor(
      () => {
        expect(
          screen.getByRole('button', { name: /1\. Nazwa produktu leczniczego/i })
        ).toHaveAttribute('aria-expanded', 'true');
      },
      { timeout: 10000 }
    );
    expect((await runWcagAxe(container, 'VaccineDetailView (Expanded)')).wcagViolations).toBe(0);
  }, 60000);

  it('Baza wiedzy, moduł w przygotowaniu oraz Ustawienia + podgląd importu kopii JSON spełniają WCAG 2.1/2.2 A/AA', async () => {
    const user = userEvent.setup();
    const { container, unmount } = render(<App />);

    // 1. Baza wiedzy
    await user.click(screen.getAllByRole('button', { name: /Baza wiedzy/i })[0]);
    await screen.findByText(/Biblioteka Źródeł Oficjalnych/i, {}, { timeout: 10000 });
    expect((await runWcagAxe(container, 'KnowledgeBaseView')).wcagViolations).toBe(0);

    // 2. Aktywny moduł operacyjny (Sytuacje szczególne)
    await user.click(screen.getAllByRole('button', { name: /Sytuacje szczególne/i })[0]);
    await screen.findByText(/Inwentarz zestawu przeciwwstrząsowego/i, {}, { timeout: 10000 });
    const placeholderAudit = await runWcagAxe(container, 'OperationalModuleView (special-situations)');
    expect(placeholderAudit.wcagViolations).toBe(0);
    expect(placeholderAudit.bestPracticeViolations.map((v) => v.id)).not.toContain('heading-order');

    unmount();

    // 3. Ustawienia ze stanem staged backup preview + ostrzeżenia
    const { container: settingsContainer } = render(
      <main>
        <SettingsView module={getSettingsModule()} onBackToDashboard={vi.fn()} />
      </main>
    );
    expect((await runWcagAxe(settingsContainer, 'SettingsView')).wcagViolations).toBe(0);

    const fileInput = settingsContainer.querySelector('input[type="file"]') as HTMLInputElement;
    const forgedPayload = createBackupPayload(
      VACCINES_CATALOG.map((v) => ({
        ...v,
        verificationStatus: 'verified_chpl',
        verifiedBy: 'External Audit',
        verifiedDate: '2026-11-11',
      }))
    );
    const file = new File([JSON.stringify(forgedPayload)], 'forged-preview.json', {
      type: 'application/json',
    });
    await user.upload(fileInput, file);
    await screen.findByText(/Podsumowanie pliku kopii przed przywróceniem/i, {}, { timeout: 10000 });
    expect(
      (await runWcagAxe(settingsContainer, 'SettingsView + Staged Backup Preview')).wcagViolations
    ).toBe(0);
  }, 25000);

  it('LocalPdfBridgePanel po załadowaniu lokalnego PDF (inspekcja, podgląd, formularz kontrolowany) spełnia WCAG 2.1/2.2 A/AA', async () => {
    const user = userEvent.setup();
    const originalCryptoDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
    Object.defineProperty(globalThis, 'crypto', {
      value: {
        randomUUID: () => '11111111-1111-1111-1111-111111111111',
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

    try {
      const initialSources = buildBaseSourceRegistry(STAGE1_CHPL_AUDIT_BUNDLE);
      const { container } = render(
        <main>
          <LocalPdfBridgePanel
            sources={initialSources}
            checklist={STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist}
            workingEntries={[]}
            selectedDocumentId="doc-rpl-bcg10-19535"
            onSelectDocumentId={vi.fn()}
            onRegisterLocalPdfSession={(inspection) => {
              const res = registerLocalPdfInspectionSession({
                sources: initialSources,
                entries: [],
                inspection
              });
              return {
                updatedSource: res.updatedSource,
                versionCreated: res.versionCreated,
                reverificationTriggered: res.reverificationTriggered
              };
            }}
            onCreatePdfEvidenceEntry={() => ({ success: true })}
            onClearPersistedArtifacts={vi.fn()}
            openPdfDocumentFn={async () => ({
              pageCount: 2,
              parserVersion: '6.5.438',
              metadataStatus: 'extracted',
              textLayerStatus: 'text_layer_available',
              metadata: createEmptyPdfMetadataSummary({ title: 'BCG Test A11y' }),
              getPage: vi.fn() as never,
              getPagePlainText: async (p) => `Treść warstwy tekstowej strony ${p}`,
              searchPlainText: async (q) => ({
                query: q,
                pagesScanned: 2,
                totalPages: 2,
                matches: [{ pageNumber: 2, snippet: 'Podanie śródskórne 0,1 ml' }],
                truncated: false,
                disclaimer: 'Test disclaimer'
              }),
              renderPageToCanvas: () => ({
                renderTaskPromise: Promise.resolve({} as never),
                done: Promise.resolve({ widthPx: 400, heightPx: 560 }),
                cancel: vi.fn()
              }),
              destroy: async () => undefined
            })}
          />
        </main>
      );

      expect((await runWcagAxe(container, 'LocalPdfBridgePanel Initial')).wcagViolations).toBe(0);

      const fileInput = screen.getByTestId('b4-local-pdf-input') as HTMLInputElement;
      const pdfFile = new File([buildSyntheticPdfBytes()], 'bcg10-a11y.pdf', {
        type: 'application/pdf'
      });
      await user.upload(fileInput, pdfFile);
      await screen.findByTestId('b4-inspection-summary');
      await screen.findByTestId('b4-pdf-preview-pane');

      const openedAudit = await runWcagAxe(container, 'LocalPdfBridgePanel Opened PDF');
      expect(openedAudit.wcagViolations).toBe(0);
    } finally {
      if (originalCryptoDescriptor) {
        Object.defineProperty(globalThis, 'crypto', originalCryptoDescriptor);
      }
    }
  }, 15000);

  it('AuditWorkspaceB5Panel spełnia WCAG 2.1/2.2 A/AA na wszystkich 4 zakładkach Etapu B5', async () => {
    const user = userEvent.setup();
    const sources = buildBaseSourceRegistry(STAGE1_CHPL_AUDIT_BUNDLE);
    const baseline = buildBaselineEvidenceEntries(STAGE1_CHPL_AUDIT_BUNDLE, sources);
    const intakeItems = buildSourceIntakeItems({
      sources,
      persistedRecords: {},
      allEntries: baseline
    });
    const queue = buildQuestionReviewQueueB5({
      checklist: STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist,
      sources,
      allEntries: baseline,
      sessions: []
    });
    const metrics = computeAuditProgressB5Metrics({
      sources,
      intakeItems,
      sessions: [],
      allEntries: baseline,
      queue
    });

    const { container } = render(
      <main>
        <h1>Stanowisko audytu</h1>
        <AuditWorkspaceB5Panel
          sources={sources}
          checklist={STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist}
          allEntries={baseline}
          workingEntries={[]}
          workingNotes={[]}
          persistedIntake={{}}
          intakeItems={intakeItems}
          sessions={[]}
          activeSessionId={null}
          questionQueue={queue}
          progressMetrics={metrics}
          onSelectActiveSession={vi.fn()}
          onOpenDocumentInPdfBridge={vi.fn()}
          onUpdateIntakeRecord={() => ({ success: true, error: null })}
          onCreateSession={() => ({ success: true })}
          onTransitionSession={() => ({ success: true })}
          onApplyDossierImport={() => ({ success: true })}
        />
      </main>
    );

    expect((await runWcagAxe(container, 'AuditWorkspaceB5Panel Tab 1 Intake')).wcagViolations).toBe(0);

    await user.click(screen.getByRole('tab', { name: /2\. Sesje Audytu/i }));
    expect((await runWcagAxe(container, 'AuditWorkspaceB5Panel Tab 2 Sessions')).wcagViolations).toBe(0);

    await user.click(screen.getByRole('tab', { name: /3\. Kolejka 8 Pytań ChPL/i }));
    expect((await runWcagAxe(container, 'AuditWorkspaceB5Panel Tab 3 Questions')).wcagViolations).toBe(0);

    await user.click(screen.getByRole('tab', { name: /4\. Portable Audit Dossier/i }));
    expect((await runWcagAxe(container, 'AuditWorkspaceB5Panel Tab 4 Dossier')).wcagViolations).toBe(0);
  }, 20000);
});
