import { describe, it, expect, beforeEach } from 'vitest';
import { CHILD_VACCINES_CATALOG } from '../../src/data/childVaccinesData';
import { STAGE1_CHPL_AUDIT_BUNDLE } from '../../src/data/chplStage1AuditSheets';
import { VACCINES_CATALOG } from '../../src/data/vaccinesCatalog';
import {
  buildBaseSourceRegistry,
  buildBaselineEvidenceEntries,
  registerLocalPdfInspectionSession
} from '../../src/utils/chplEvidenceLedger';
import {
  AUDIT_SESSIONS_STORAGE_KEY,
  EXPECTED_SOURCE_INTAKE_TARGETS,
  SOURCE_INTAKE_STORAGE_KEY,
  STAGE1_ACQUISITION_QUEUE_DOCUMENT_IDS,
  applyPdfInspectionToPersistedIntake,
  buildAuditSessionReport,
  buildQuestionReviewQueueB5,
  buildSourceIntakeItems,
  computeAuditProgressB5Metrics,
  computeDocumentAuditReadiness,
  computeDocumentProvenanceLevel,
  createAuditSession,
  createDefaultSourceIntakeChecklist,
  evaluateMetadataComparison,
  loadAuditSessionsFromStorage,
  loadSourceIntakeRecordsFromStorage,
  reconcileSessionsAfterReload,
  reconcileSessionsOnArtifactChange,
  renderAuditSessionReportHtml,
  saveAuditSessionsToStorage,
  saveSourceIntakeRecordsToStorage,
  transitionAuditSession
} from '../../src/utils/chplAuditDossier';
import type {
  EvidenceLedgerEntry,
  PersistedSourceIntakeRecord,
  SourceRegistryEntry
} from '../../src/types/evidenceLedger';

function createMemoryStorage(simulateQuotaExceeded = false): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k: string) => map.get(k) ?? null,
    key: (i: number) => Array.from(map.keys())[i] ?? null,
    removeItem: (k: string) => {
      map.delete(k);
    },
    setItem: (k: string, v: string) => {
      if (simulateQuotaExceeded) {
        const err = new Error('QuotaExceededError');
        err.name = 'QuotaExceededError';
        throw err;
      }
      map.set(k, v);
    }
  };
}

describe('Etap B5 — Source Intake, Proweniencja, Sesje Audytu i Kolejka 8 Pytań ChPL', () => {
  let baseSources: SourceRegistryEntry[];
  let baselineEntries: EvidenceLedgerEntry[];

  beforeEach(() => {
    baseSources = buildBaseSourceRegistry(STAGE1_CHPL_AUDIT_BUNDLE);
    baselineEntries = buildBaselineEvidenceEntries(STAGE1_CHPL_AUDIT_BUNDLE, baseSources);
  });

  it('buduje listę 7 oczekiwanych dokumentów oraz 6-elementową kolejkę Etapu I z wykluczeniem HTTP 400 i VaxigripTetra', () => {
    expect(EXPECTED_SOURCE_INTAKE_TARGETS).toHaveLength(7);
    expect(STAGE1_ACQUISITION_QUEUE_DOCUMENT_IDS).toHaveLength(6);
    expect(STAGE1_ACQUISITION_QUEUE_DOCUMENT_IDS).not.toContain('doc-rpl-spikevax-cen-endpoints');
    expect(STAGE1_ACQUISITION_QUEUE_DOCUMENT_IDS).not.toContain('doc-rpl-vaxigrip-tetra-35346-hist');

    const items = buildSourceIntakeItems({
      sources: baseSources,
      persistedRecords: {},
      allEntries: baselineEntries
    });
    expect(items.filter((i) => i.isExpectedChecklistTarget)).toHaveLength(7);
    const histItem = items.find((i) => i.source?.documentId === 'doc-rpl-vaxigrip-tetra-35346-hist');
    const failedItem = items.find((i) => i.source?.documentId === 'doc-rpl-spikevax-cen-endpoints');
    expect(histItem?.isHistoricalRejectedForCurrentSeason).toBe(true);
    expect(failedItem?.isFailedEndpointRecord).toBe(true);
    expect(histItem?.requiresStage1ManualAcquisition).toBe(false);
    expect(failedItem?.requiresStage1ManualAcquisition).toBe(false);
  });

  it('wykazuje brak wpisu w rejestrze (isMissingRegistryRecord) zamiast udawania pozyskania pliku', () => {
    const partialSources = baseSources.filter((s) => s.documentId !== 'doc-rpl-bcg10-19535');
    const items = buildSourceIntakeItems({
      sources: partialSources,
      persistedRecords: {},
      allEntries: baselineEntries
    });
    const bcgSlot = items.find((i) => i.checklistSlotId === 'intake-slot-bcg10');
    expect(bcgSlot?.isMissingRegistryRecord).toBe(true);
    expect(bcgSlot?.source).toBeNull();
    expect(bcgSlot?.readinessStatus).toBe('not_started');
    expect(bcgSlot?.provenanceLevel).toBe('origin_unknown');
    expect(bcgSlot?.checklist.selected_pdf_in_app).toBe(false);
  });

  it('odróżnia deklarację operatora od niezależnego potwierdzenia technicznego oraz wykrywa konflikty 9 pól metadanych bez nadpisywania rejestru', () => {
    const bcg = baseSources.find((s) => s.documentId === 'doc-rpl-bcg10-19535')!;
    // Nawet jeśli operator spróbuje zadeklarować official_origin_independently_confirmed bez wzorca zaufanego SHA-256,
    // silnik degraduje do official_origin_operator_declared
    const declaredIntake: PersistedSourceIntakeRecord = {
      documentId: bcg.documentId,
      checklist: createDefaultSourceIntakeChecklist(),
      provenanceDeclaration: {
        documentId: bcg.documentId,
        declaredOriginLevel: 'official_origin_independently_confirmed',
        declaredSourceName: 'RPL',
        declaredSourceUrl: 'https://rejestry.ezdrowie.gov.pl/rpl',
        declaredDocumentIdentifier: '19535',
        declaredAt: '2026-11-12T00:00:00.000Z',
        operatorNote: 'Pobrano ręcznie',
        isOperatorDeclaredOnly: true
      },
      metadataOverrides: {
        language: 'EN'
      },
      operatorNotes: '',
      manualReviewMarkedCompletePendingDecision: false,
      updatedAt: '2026-11-12T00:00:00.000Z'
    };

    const provLevel = computeDocumentProvenanceLevel(bcg, declaredIntake);
    expect(provLevel).toBe('official_origin_operator_declared');

    const comparisons = evaluateMetadataComparison(bcg, declaredIntake);
    expect(comparisons).toHaveLength(9);
    const langComp = comparisons.find((c) => c.field === 'language');
    expect(langComp?.registryValue).toBe('PL');
    expect(langComp?.observedValue).toBe('EN');
    expect(langComp?.status).toBe('conflict_requires_review');
    // Rejestr źródłowy nienaruszony
    expect(bcg.language).toBe('PL');
  });

  it('przechodzi przez stany DocumentAuditReadinessStatus, a wczytanie PDF ustawia wyłącznie fakty techniczne bez oznaczania oceny człowieka', () => {
    const vaxigrip = baseSources.find((s) => s.documentId === 'doc-rpl-vaxigrip-50032')!;
    const regRes = registerLocalPdfInspectionSession({
      sources: baseSources,
      entries: [],
      inspection: {
        documentId: vaxigrip.documentId,
        verificationSessionId: 'pdf-sess-1',
        fileName: 'vaxigrip.pdf',
        mimeType: 'application/pdf',
        fileSizeBytes: 20480,
        pageCount: vaxigrip.physicalPageCount ?? 6,
        sha256Hex: vaxigrip.sha256,
        comparisonStatus: 'compared_with_known_reference',
        integrityStatus: 'hash_matches_known_reference',
        referenceType: 'bundle_recorded_sha256',
        referenceHash: vaxigrip.sha256,
        pdfParserVersion: '6.5.438',
        metadataStatus: 'extracted',
        textLayerStatus: 'text_layer_available',
        pdfMetadata: null,
        operatorDeclaredOrigin: null
      }
    });

    const persisted = applyPdfInspectionToPersistedIntake(undefined, regRes.updatedSource);
    expect(persisted.checklist.selected_pdf_in_app).toBe(true);
    expect(persisted.checklist.verified_signature_and_structure).toBe(true);
    expect(persisted.checklist.calculated_sha256).toBe(true);
    expect(persisted.checklist.read_page_count).toBe(true);
    // Krytyczne: ocena człowieka NIE jest oznaczana automatycznie!
    expect(persisted.checklist.compared_available_metadata).toBe(false);
    expect(persisted.checklist.checked_version_and_date).toBe(false);
    expect(persisted.checklist.flagged_remaining_human_decisions).toBe(false);

    expect(
      computeDocumentAuditReadiness({
        source: regRes.updatedSource,
        checklist: persisted.checklist,
        hasMetadataConflict: false,
        reverificationEvidenceCount: 0,
        assignedEvidenceCount: 0,
        persisted
      })
    ).toBe('metadata_comparison_pending');

    const readyChecklist = { ...persisted.checklist, compared_available_metadata: true };
    expect(
      computeDocumentAuditReadiness({
        source: regRes.updatedSource,
        checklist: readyChecklist,
        hasMetadataConflict: false,
        reverificationEvidenceCount: 0,
        assignedEvidenceCount: 0,
        persisted
      })
    ).toBe('ready_for_manual_review');

    expect(
      computeDocumentAuditReadiness({
        source: regRes.updatedSource,
        checklist: { ...readyChecklist, reviewed_in_preview: true },
        hasMetadataConflict: false,
        reverificationEvidenceCount: 0,
        assignedEvidenceCount: 1,
        persisted: { ...persisted, manualReviewMarkedCompletePendingDecision: true }
      })
    ).toBe('review_complete_pending_human_decision');

    expect(
      computeDocumentAuditReadiness({
        source: regRes.updatedSource,
        checklist: readyChecklist,
        hasMetadataConflict: true,
        reverificationEvidenceCount: 1,
        assignedEvidenceCount: 1,
        persisted
      })
    ).toBe('review_requires_rework');
  });

  it('zarządza pełnym cyklem życia AuditSessionRecord (utworzenie, wstrzymanie, wznowienie, reload, zmiana SHA-256, raport JSON/HTML)', () => {
    const bcg = baseSources.find((s) => s.documentId === 'doc-rpl-bcg10-19535')!;
    const reg = registerLocalPdfInspectionSession({
      sources: baseSources,
      entries: [],
      inspection: {
        documentId: bcg.documentId,
        verificationSessionId: 'pdf-sess-2',
        fileName: 'bcg10.pdf',
        mimeType: 'application/pdf',
        fileSizeBytes: 10240,
        pageCount: 4,
        sha256Hex: 'b'.repeat(64),
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
    });

    // Upewnij się że XSS w createAuditSession jest odrzucany
    expect(() =>
      createAuditSession(
        {
          documentId: bcg.documentId,
          scope: 'Test <script>alert(1)</script>',
          reviewedSections: ['4.2'],
          linkedQuestionIds: ['dec-bcg-42-injection-site']
        },
        reg.updatedSources,
        STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist
      )
    ).toThrow(/niedozwolone znaczniki/i);

    const validSession = createAuditSession(
      {
        documentId: bcg.documentId,
        scope: 'Weryfikacja pkt 4.2 oraz 4.3 ChPL BCG 10',
        reviewedSections: ['4.2', '4.3'],
        linkedQuestionIds: ['dec-bcg-42-injection-site'],
        sessionNotes: 'Uwagi robocze <tag>'
      },
      reg.updatedSources,
      STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist
    );
    expect(validSession.sessionStatus).toBe('in_progress');
    expect(validSession.artifactSha256).toBe('b'.repeat(64));

    const paused = transitionAuditSession(
      validSession,
      { sessionStatus: 'paused' },
      reg.updatedSource,
      STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist
    );
    expect(paused.updated?.sessionStatus).toBe('paused');

    const completed = transitionAuditSession(
      paused.updated!,
      { sessionStatus: 'completed_as_working_record' },
      reg.updatedSource,
      STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist
    );
    expect(completed.updated?.sessionStatus).toBe('completed_as_working_record');
    expect(completed.updated?.endedAt).not.toBeNull();

    // Po reload (brak localArtifactId w pamięci) -> zachowuje sesję, ale wymusza ponowne wskazanie PDF
    const sourcesWithoutLiveMem = reg.updatedSources.map((s) =>
      s.documentId === bcg.documentId && s.currentArtifact
        ? {
            ...s,
            currentArtifact: {
              ...s.currentArtifact,
              localArtifactId: null,
              localPreviewStatus: 'reselection_required_after_reload' as const
            }
          }
        : s
    );
    const reloaded = reconcileSessionsAfterReload([completed.updated!], sourcesWithoutLiveMem);
    expect(reloaded[0].requiresFileReselectionAfterReload).toBe(true);
    expect(reloaded[0].sessionNotes).toContain('Uwagi robocze');

    // Zmiana SHA-256 na inny artefakt -> unieważnienie sesji i blokada ponownego zamknięcia
    const changed = reconcileSessionsOnArtifactChange(
      reloaded,
      bcg.documentId,
      'art-2',
      'c'.repeat(64)
    );
    expect(changed[0].invalidatedByArtifactChange).toBe(true);
    expect(changed[0].sessionStatus).toBe('requires_follow_up');

    const blockedComplete = transitionAuditSession(
      changed[0],
      { sessionStatus: 'completed_as_working_record' },
      reg.updatedSource,
      STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist
    );
    expect(blockedComplete.updated).toBeNull();
    expect(blockedComplete.errors.length).toBeGreaterThan(0);

    // Raport HTML musi escapować nawiasy kątowe i zawierać disclaimer
    const report = buildAuditSessionReport({
      session: changed[0],
      sources: reg.updatedSources,
      checklist: STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist,
      allEntries: baselineEntries,
      workingNotes: []
    });
    expect(report.clinicalApprovalGranted).toBe(false);
    expect(report.containsPdfBytes).toBe(false);
    expect(report.containsPatientData).toBe(false);
    const html = renderAuditSessionReportHtml(report);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).not.toContain('<script');
    expect(html).toContain(changed[0].sessionId);
  });

  it('blokuje ukończenie sesji dla historycznego VaxigripTetra oraz endpointu HTTP 400 i obsługuje persistence + QuotaExceededError', () => {
    const histDoc = baseSources.find((s) => s.documentId === 'doc-rpl-vaxigrip-tetra-35346-hist')!;
    const histSession = createAuditSession(
      {
        documentId: histDoc.documentId,
        scope: 'Przegląd historycznej karty 2025/2026',
        reviewedSections: ['4.1'],
        linkedQuestionIds: ['dec-flu-extrapolation-4valent']
      },
      baseSources,
      STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist
    );
    const attemptCompleteHist = transitionAuditSession(
      histSession,
      { sessionStatus: 'completed_as_working_record' },
      histDoc,
      STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist
    );
    expect(attemptCompleteHist.updated).toBeNull();

    const storage = createMemoryStorage(false);
    const saveRes = saveAuditSessionsToStorage(storage, [histSession]);
    expect(saveRes.success).toBe(true);
    expect(storage.getItem(AUDIT_SESSIONS_STORAGE_KEY)).toBeTruthy();

    const loaded = loadAuditSessionsFromStorage(
      storage,
      baseSources,
      STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist
    );
    expect(loaded).toHaveLength(1);

    const quotaStorage = createMemoryStorage(true);
    const quotaSessRes = saveAuditSessionsToStorage(quotaStorage, [histSession]);
    expect(quotaSessRes.success).toBe(false);
    expect(quotaSessRes.error).toMatch(/QuotaExceededError/);

    const quotaIntakeRes = saveSourceIntakeRecordsToStorage(quotaStorage, {
      'doc-rpl-bcg10-19535': applyPdfInspectionToPersistedIntake(undefined, baseSources[0])
    });
    expect(quotaIntakeRes.success).toBe(false);
    expect(quotaIntakeRes.error).toMatch(/QuotaExceededError/);

    // Odrzucenie uszkodzonego JSON w storage
    const corruptedStorage = createMemoryStorage(false);
    corruptedStorage.setItem(SOURCE_INTAKE_STORAGE_KEY, '{"__proto__": {"polluted": true}}');
    expect(loadSourceIntakeRecordsFromStorage(corruptedStorage, baseSources)).toEqual({});
  });

  it('utrzymuje wszystkie 8 pytań ChPL z autoResolved: false, wylicza 14 metryk B5 i nie narusza Infanrix hexa ani katalogu', () => {
    const queue = buildQuestionReviewQueueB5({
      checklist: STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist,
      sources: baseSources,
      allEntries: baselineEntries,
      sessions: []
    });
    expect(queue).toHaveLength(8);
    for (const q of queue) {
      expect(q.autoResolved).toBe(false);
      expect(q.readiness.technicalCompletenessPercent).toBeGreaterThanOrEqual(0);
      expect(q.readiness.technicalCompletenessPercent).toBeLessThanOrEqual(100);
    }

    const intakeItems = buildSourceIntakeItems({
      sources: baseSources,
      persistedRecords: {},
      allEntries: baselineEntries
    });
    const metrics = computeAuditProgressB5Metrics({
      sources: baseSources,
      intakeItems,
      sessions: [],
      allEntries: baselineEntries,
      queue
    });
    expect(metrics.totalSourceRecords).toBe(baseSources.length);
    expect(metrics.questionsAwaitingHumanDecisionCount).toBe(8);
    expect(metrics.operatorConfirmedExcerptsCount).toBe(0);

    // Niezmiennik Infanrix hexa i brak mutacji danych klinicznych
    const infanrix = VACCINES_CATALOG.find((v) => v.id === 'vac-infanrix-hexa')!;
    expect(infanrix.verificationStatus).toBe('requires_source_clarification');
    expect(infanrix.sourceDiscrepancies?.[0]?.status).toBe('requires_clarification');
    expect(CHILD_VACCINES_CATALOG.length).toBeGreaterThan(0);
  });
});
