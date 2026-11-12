import { webcrypto } from 'node:crypto';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuditWorkspaceB5Panel } from '../../src/components/vaccines/AuditWorkspaceB5Panel';
import { STAGE1_CHPL_AUDIT_BUNDLE } from '../../src/data/chplStage1AuditSheets';
import {
  buildBaseSourceRegistry,
  buildBaselineEvidenceEntries,
  registerLocalPdfInspectionSession
} from '../../src/utils/chplEvidenceLedger';
import {
  applyPreviewedAuditDossierImport,
  buildQuestionReviewQueueB5,
  buildSourceIntakeItems,
  computeAuditProgressB5Metrics,
  createAuditSession,
  transitionAuditSession
} from '../../src/utils/chplAuditDossier';
import type {
  AuditSessionRecord,
  EvidenceLedgerEntry,
  PersistedSourceIntakeRecord,
  SourceRegistryEntry
} from '../../src/types/evidenceLedger';
import React, { useState } from 'react';

function TestB5Harness() {
  const [sources] = useState<SourceRegistryEntry[]>(() => {
    const base = buildBaseSourceRegistry(STAGE1_CHPL_AUDIT_BUNDLE);
    return registerLocalPdfInspectionSession({
      sources: base,
      entries: [],
      inspection: {
        documentId: 'doc-rpl-bcg10-19535',
        verificationSessionId: 'pdf-sess-harness',
        fileName: 'bcg10-lokalny.pdf',
        mimeType: 'application/pdf',
        fileSizeBytes: 8192,
        pageCount: 6,
        sha256Hex: 'e'.repeat(64),
        comparisonStatus: 'calculated_from_local_file',
        integrityStatus: 'hash_calculated',
        referenceType: 'none',
        referenceHash: null,
        pdfParserVersion: '6.5.438',
        metadataStatus: 'extracted',
        textLayerStatus: 'text_layer_available',
        pdfMetadata: null,
        operatorDeclaredOrigin: null
      }
    }).updatedSources;
  });

  const baseline = React.useMemo(
    () => buildBaselineEvidenceEntries(STAGE1_CHPL_AUDIT_BUNDLE, sources),
    [sources]
  );
  const [workingEntries, setWorkingEntries] = useState<EvidenceLedgerEntry[]>([]);
  const [persistedIntake, setPersistedIntake] = useState<
    Record<string, PersistedSourceIntakeRecord>
  >({});
  const [sessions, setSessions] = useState<AuditSessionRecord[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const allEntries = React.useMemo(
    () => [...baseline, ...workingEntries],
    [baseline, workingEntries]
  );

  const intakeItems = React.useMemo(
    () =>
      buildSourceIntakeItems({
        sources,
        persistedRecords: persistedIntake,
        allEntries
      }),
    [sources, persistedIntake, allEntries]
  );

  const queue = React.useMemo(
    () =>
      buildQuestionReviewQueueB5({
        checklist: STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist,
        sources,
        allEntries,
        sessions
      }),
    [sources, allEntries, sessions]
  );

  const metrics = React.useMemo(
    () =>
      computeAuditProgressB5Metrics({
        sources,
        intakeItems,
        sessions,
        allEntries,
        queue
      }),
    [sources, intakeItems, sessions, allEntries, queue]
  );

  return (
    <AuditWorkspaceB5Panel
      sources={sources}
      checklist={STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist}
      allEntries={allEntries}
      workingEntries={workingEntries}
      workingNotes={[]}
      persistedIntake={persistedIntake}
      intakeItems={intakeItems}
      sessions={sessions}
      activeSessionId={activeSessionId}
      questionQueue={queue}
      progressMetrics={metrics}
      onSelectActiveSession={setActiveSessionId}
      onOpenDocumentInPdfBridge={vi.fn()}
      onUpdateIntakeRecord={(rec) => {
        setPersistedIntake((prev) => ({ ...prev, [rec.documentId]: rec }));
        return { success: true, error: null };
      }}
      onCreateSession={(draft) => {
        const s = createAuditSession(draft, sources, STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist);
        setSessions((prev) => [s, ...prev]);
        return { success: true, session: s };
      }}
      onTransitionSession={(sessionId, patch) => {
        const target = sessions.find((s) => s.sessionId === sessionId);
        if (!target) {
          return { success: false, error: 'Brak sesji' };
        }
        const doc = sources.find((s) => s.documentId === target.documentId) ?? null;
        const res = transitionAuditSession(
          target,
          patch,
          doc,
          STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist
        );
        if (!res.updated) {
          return { success: false, error: res.errors.join(' ') };
        }
        setSessions((prev) => prev.map((s) => (s.sessionId === sessionId ? res.updated! : s)));
        return { success: true };
      }}
      onApplyDossierImport={(preview) => {
        const merged = applyPreviewedAuditDossierImport(preview, {
          sources,
          sessions,
          workingEntries,
          workingNotes: [],
          intakeRecords: persistedIntake
        });
        setSessions(merged.mergedSessions);
        setWorkingEntries(merged.mergedEntries);
        setPersistedIntake(merged.mergedIntakeRecords);
        return { success: true };
      }}
    />
  );
}

describe('Etap B5 — Komponent AuditWorkspaceB5Panel (Intake · Sesje · 8 Pytań · Dossier · Dashboard)', () => {
  const originalCryptoDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');

  beforeEach(() => {
    const bridgedCrypto = {
      subtle: {
        digest: async (algorithm: AlgorithmIdentifier, data: BufferSource) => {
          const view =
            data instanceof ArrayBuffer
              ? new Uint8Array(data)
              : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
          return webcrypto.subtle.digest(algorithm, Buffer.from(view));
        }
      }
    };
    Object.defineProperty(globalThis, 'crypto', {
      value: bridgedCrypto,
      configurable: true
    });
  });

  afterEach(() => {
    if (originalCryptoDescriptor) {
      Object.defineProperty(globalThis, 'crypto', originalCryptoDescriptor);
    }
  });

  it('wyświetla 14-metrykowy Dashboard B5, kolejkę 6 dokumentów Etapu I i 7 kart Source Intake + formularz proweniencji', async () => {
    const user = userEvent.setup();
    render(<TestB5Harness />);

    expect(screen.getByTestId('b5-progress-metrics-grid').children).toHaveLength(14);
    expect(screen.getByTestId('b5-intake-document-list').children).toHaveLength(7);

    // Rozwinięcie szczegółów BCG 10 i zapisanie deklaracji proweniencji operatora
    const detailBtns = screen.getAllByRole('button', { name: /Szczegóły i metadane/i });
    await user.click(detailBtns[4]);
    await user.click(screen.getByRole('button', { name: /Zapisz deklarację pochodzenia operatora/i }));
    expect(await screen.findByRole('status')).toHaveTextContent(/isOperatorDeclaredOnly: true/i);
  });

  it('obsługuje pełny cykl Sesji Audytu, Kolejkę 8 pytań ChPL oraz eksport/import Portable Audit Dossier z wyliczonym SHA-256 JSON', async () => {
    const user = userEvent.setup();
    render(<TestB5Harness />);

    // Zakładka 2: Sesje audytu
    await user.click(screen.getByRole('tab', { name: /2\. Sesje Audytu/i }));
    await user.click(screen.getByRole('button', { name: /Rozpocznij roboczą sesję audytu/i }));

    const sessList = await screen.findByTestId('b5-sessions-list');
    expect(sessList).toHaveTextContent(/in_progress/i);

    // Wstrzymaj -> Wznów -> Zakończ jako zapis roboczy -> Raport sesji
    await user.click(screen.getByRole('button', { name: /Wstrzymaj sesję/i }));
    expect(sessList).toHaveTextContent(/Wstrzymana/i);
    await user.click(screen.getByRole('button', { name: /Wznów sesję/i }));
    await user.click(screen.getByRole('button', { name: /Zakończ jako zapis roboczy/i }));
    expect(sessList).toHaveTextContent(/Zakończona jako zapis roboczy/i);

    await user.click(screen.getByRole('button', { name: /Raport sesji \(JSON \/ HTML\)/i }));
    const reportPreview = await screen.findByTestId('b5-session-report-preview');
    expect(reportPreview).toHaveTextContent(/clinicalApprovalGranted: false/i);

    // Zakładka 3: Kolejka 8 pytań
    await user.click(screen.getByRole('tab', { name: /3\. Kolejka 8 Pytań ChPL/i }));
    const qList = await screen.findByTestId('b5-questions-queue-list');
    expect(qList.children).toHaveLength(8);
    expect(qList).toHaveTextContent(/autoResolved: false/i);

    // Zakładka 4: Portable Audit Dossier
    await user.click(screen.getByRole('tab', { name: /4\. Portable Audit Dossier/i }));
    await user.click(screen.getByRole('button', { name: /Wygeneruj i pobierz Portable Dossier/i }));
    const exportSummary = await screen.findByTestId('b5-last-export-summary');
    expect(exportSummary).toHaveTextContent(/containsPdfBytes: false/i);
    expect(exportSummary).toHaveTextContent(/[a-f0-9]{64}/);

    // Podgląd i scalenie importu wyeksportowanego JSON
    await user.click(screen.getByRole('button', { name: /Analizuj podgląd importu Dossier/i }));
    const impPreview = await screen.findByTestId('b5-dossier-import-preview');
    expect(impPreview).toHaveTextContent(/GOTOWY DO SCALENIA/i);
    await waitFor(() => {
      expect(impPreview).toHaveTextContent(/matched/i);
    });

    await user.click(screen.getByRole('button', { name: /Zastosuj kontrolowane scalenie Dossier/i }));
    expect(await screen.findByRole('status')).toHaveTextContent(/niepotwierdzone lokalnie/i);
  });
});
