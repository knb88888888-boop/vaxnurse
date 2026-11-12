import { describe, it, expect, beforeEach } from 'vitest';
import { STAGE1_CHPL_AUDIT_BUNDLE } from '../../src/data/chplStage1AuditSheets';
import { VACCINES_CATALOG } from '../../src/data/vaccinesCatalog';
import {
  ALLOWED_EVIDENCE_QUALIFICATION_CLASSES,
  SOURCE_ARTIFACTS_SCHEMA_VERSION,
  SOURCE_ARTIFACTS_STORAGE_KEY,
  applyPreviewedEvidenceLedgerImport,
  buildBaseSourceRegistry,
  buildBaselineEvidenceEntries,
  buildEvidenceLedgerExportPayload,
  clearLocalSourceArtifactsFromStorage,
  computeSourceQualityMetrics,
  createWorkingEvidenceEntry,
  loadSourceRegistryWithLocalArtifacts,
  parseAndPreviewEvidenceLedgerImport,
  registerLocalPdfInspectionSession,
  saveLocalSourceArtifactsToStorage,
  validateWorkingEvidenceInput
} from '../../src/utils/chplEvidenceLedger';
import { createEmptyPdfMetadataSummary } from '../../src/utils/localPdfBridge';

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    }
  };
}

describe('Etap B4 — chplEvidenceLedger: most lokalnych artefaktów PDF, rozdział sporu referencyjnego i trwałość metadanych', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('eliminuje niespójność not_acquired + hash_matches_known_reference i rozdziela osie dostępności oraz przechowywania', () => {
    const sources = buildBaseSourceRegistry(STAGE1_CHPL_AUDIT_BUNDLE);

    const akt = sources.find((s) => s.documentId === 'doc-mz-pso-2027-akt');
    expect(akt?.statusAxes.acquisitionStatus).toBe('acquired');
    expect(akt?.statusAxes.integrityStatus).toBe('hash_matches_known_reference');
    expect(akt?.statusAxes.fileAvailability).toBe('metadata_only_reload_required');
    expect(akt?.statusAxes.storageMode).toBe('repository_local_file_metadata');

    const cen = sources.find((s) => s.documentId === 'doc-rpl-spikevax-cen-endpoints');
    expect(cen?.statusAxes.acquisitionStatus).toBe('access_failed');
    expect(cen?.statusAxes.integrityStatus).toBe('not_checked');
    expect(cen?.statusAxes.fileAvailability).toBe('no_file');
    expect(cen?.statusAxes.storageMode).toBe('no_binary_file');

    const bcg = sources.find((s) => s.documentId === 'doc-rpl-bcg10-19535');
    expect(bcg?.statusAxes.acquisitionStatus).toBe('not_acquired');
    expect(bcg?.statusAxes.integrityStatus).toBe('reference_hash_recorded_no_local_file');
    expect(bcg?.currentArtifact?.hashProvenance.comparisonStatus).toBe(
      'reference_recorded_no_local_file'
    );
    expect(bcg?.statusAxes.fileAvailability).toBe('no_file');
    expect(bcg?.statusAxes.storageMode).toBe('no_binary_file');

    const inconsistent = sources.filter(
      (s) =>
        s.statusAxes.acquisitionStatus === 'not_acquired' &&
        s.statusAxes.integrityStatus === 'hash_matches_known_reference'
    );
    expect(inconsistent).toHaveLength(0);
  });

  it('przekwalifikowuje 14 niejednoznaczności Etapu I na conflicting_reference oraz chroni conflicting_source_excerpt przed fałszywym nadaniem', () => {
    const sources = buildBaseSourceRegistry(STAGE1_CHPL_AUDIT_BUNDLE);
    const baseline = buildBaselineEvidenceEntries(STAGE1_CHPL_AUDIT_BUNDLE, sources);

    expect(ALLOWED_EVIDENCE_QUALIFICATION_CLASSES).toContain('conflicting_reference');
    const conflictingRefCount = baseline.filter(
      (e) => e.qualificationClass === 'conflicting_reference'
    ).length;
    const conflictingExcerptCount = baseline.filter(
      (e) => e.qualificationClass === 'conflicting_source_excerpt'
    ).length;
    const verifiedExcerptCount = baseline.filter(
      (e) => e.qualificationClass === 'source_excerpt_reviewed'
    ).length;

    expect(conflictingRefCount).toBe(14);
    expect(conflictingExcerptCount).toBe(0);
    expect(verifiedExcerptCount).toBe(0);

    const metrics = computeSourceQualityMetrics({
      sources,
      allEntries: baseline,
      checklist: STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist
    });
    expect(metrics.conflictingReferencesCount).toBe(14);
    expect(metrics.conflictingExcerptsCount).toBe(0);
    expect(metrics.referenceHashesWithoutLocalFileCount).toBe(6);
    expect(metrics.sessionVerifiedPdfCount).toBe(0);

    // Zewnętrzny import JSON próbujący wstrzyknąć conflicting_source_excerpt musi zostać zdegradowany
    const seededEntry = createWorkingEvidenceEntry(
      {
        questionId: 'dec-bcg-42-injection-site',
        documentId: 'doc-rpl-bcg10-19535',
        qrdSection: '4.2',
        pdfPageIndex: 2,
        printedPageNumber: '2',
        pageNumberingType: 'pdf_page_index',
        sourceExcerptRef: 'Zaimportowany opis rozbieżności',
        clinicalObservation: 'Próba importu conflicting_source_excerpt',
        relationship: 'contradicts',
        qualificationClass: 'conflicting_source_excerpt',
        reviewStatus: 'conflicting_evidence',
        confirmedRealPdfContent: true
      },
      STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist,
      sources
    );
    const payload = buildEvidenceLedgerExportPayload({
      sources,
      baselineEntries: [],
      workingEntries: [seededEntry],
      workingNotes: [],
      includeBaselineExtracts: false
    });

    const importRes = parseAndPreviewEvidenceLedgerImport(JSON.stringify(payload), {
      sources,
      checklist: STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist,
      existingWorkingEntries: [],
      existingWorkingNotes: []
    });

    expect(importRes.canImport).toBe(true);
    const applied = applyPreviewedEvidenceLedgerImport(importRes, [], []);
    expect(applied.mergedEntries[0]?.qualificationClass).toBe('conflicting_reference');
    expect(applied.mergedEntries[0]?.requiresReverification).toBe(true);
    expect(applied.mergedEntries[0]?.importProvenance?.localConfirmationState).toBe(
      'unconfirmed_imported_claim'
    );
  });

  it('wiąże dowody wyłącznie z aktywnym plikiem PDF z sesji, utrzymuje brak nowej wersji dla identycznego SHA-256 i degraduje przy nowym SHA-256', () => {
    const baseSources = buildBaseSourceRegistry(STAGE1_CHPL_AUDIT_BUNDLE);
    const checklist = STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist;
    const shaV1 = '1'.repeat(64);
    const shaV2 = '2'.repeat(64);

    // Próba nadania conflicting_source_excerpt bez potwierdzenia lub dla niedostępnego źródła jest odrzucana
    const blockedNoConfirm = validateWorkingEvidenceInput(
      {
        questionId: 'dec-bcg-42-injection-site',
        documentId: 'doc-rpl-bcg10-19535',
        qrdSection: '4.2',
        pdfPageIndex: 2,
        printedPageNumber: '2',
        pageNumberingType: 'pdf_page_index',
        sourceExcerptRef: 'Dawkowanie 0,1 ml śródskórnie',
        clinicalObservation: 'Rozbieżność dawkowania bez potwierdzenia PDF',
        relationship: 'contradicts',
        qualificationClass: 'conflicting_source_excerpt',
        reviewStatus: 'conflicting_evidence',
        confirmedRealPdfContent: false
      },
      checklist,
      baseSources
    );
    expect(blockedNoConfirm.valid).toBe(false);

    const blockedEndpoint = validateWorkingEvidenceInput(
      {
        questionId: 'dec-bcg-42-injection-site',
        documentId: 'doc-rpl-spikevax-cen-endpoints',
        qrdSection: '4.2',
        pdfPageIndex: 1,
        printedPageNumber: '1',
        pageNumberingType: 'pdf_page_index',
        sourceExcerptRef: 'Próba wpisu z błędu HTTP 400',
        clinicalObservation: 'Próba wpisu potwierdzonej rozbieżności z endpointu',
        relationship: 'contradicts',
        qualificationClass: 'conflicting_source_excerpt',
        reviewStatus: 'conflicting_evidence',
        confirmedRealPdfContent: true
      },
      checklist,
      baseSources
    );
    expect(blockedEndpoint.valid).toBe(false);

    // Krok 1: Rejestracja PDF v1 w sesji (2 str. vs 7 str. w rejestrze -> mismatch)
    const reg1 = registerLocalPdfInspectionSession({
      sources: baseSources,
      entries: [],
      inspection: {
        documentId: 'doc-rpl-bcg10-19535',
        verificationSessionId: 'sess-1',
        fileName: 'bcg10-local.pdf',
        fileSizeBytes: 2048,
        mimeType: 'application/pdf',
        sha256Hex: shaV1,
        comparisonStatus: 'hash_mismatch',
        integrityStatus: 'hash_mismatch',
        referenceType: 'bundle_recorded_sha256',
        referenceHash: baseSources.find((s) => s.documentId === 'doc-rpl-bcg10-19535')?.sha256 ?? null,
        pageCount: 2,
        pdfParserVersion: '6.5.438',
        metadataStatus: 'extracted',
        textLayerStatus: 'text_layer_available',
        pdfMetadata: createEmptyPdfMetadataSummary({ title: 'BCG 10 Local Test' }),
        operatorDeclaredOrigin: 'Kopia testowa operatora'
      }
    });

    expect(reg1.versionCreated).toBe(true);
    expect(reg1.updatedSource.statusAxes.acquisitionStatus).toBe('session_local_file_selected');
    expect(reg1.updatedSource.statusAxes.fileAvailability).toBe('verified_in_session');
    expect(reg1.updatedSource.statusAxes.storageMode).toBe('session_memory_only');
    expect(reg1.updatedSource.activeSessionPageCount).toBe(2);
    expect(reg1.updatedSource.pageCountComparisonStatus).toBe('mismatch');

    // Wyjście poza 2 strony z sesji jest blokowane
    const outOfPageRange = validateWorkingEvidenceInput(
      {
        questionId: 'dec-bcg-42-injection-site',
        documentId: 'doc-rpl-bcg10-19535',
        qrdSection: '4.2',
        pdfPageIndex: 3,
        printedPageNumber: '3',
        pageNumberingType: 'pdf_page_index',
        sourceExcerptRef: 'Strona spoza zakresu aktywnego PDF',
        clinicalObservation: 'Próba wyjścia poza liczbę stron otwartego pliku',
        relationship: 'contextualizes',
        qualificationClass: 'source_excerpt_reviewed',
        reviewStatus: 'awaiting_human_review',
        confirmedRealPdfContent: true
      },
      checklist,
      reg1.updatedSources
    );
    expect(outOfPageRange.valid).toBe(false);

    // Poprawny zapis w zakresie 2 stron wiąże się z artifactId, SHA-256 i sesją B4
    const reviewedEntry = createWorkingEvidenceEntry(
      {
        questionId: 'dec-bcg-42-injection-site',
        documentId: 'doc-rpl-bcg10-19535',
        qrdSection: '4.2',
        pdfPageIndex: 2,
        printedPageNumber: '2',
        pageNumberingType: 'pdf_page_index',
        sourceExcerptRef: 'Podanie śródskórne 0,1 ml u osób powyżej 12 m.ż.',
        clinicalObservation: 'Zweryfikowano w lokalnym podglądzie PDF',
        relationship: 'contextualizes',
        qualificationClass: 'source_excerpt_reviewed',
        reviewStatus: 'awaiting_human_review',
        confirmedRealPdfContent: true,
        verificationSessionId: 'sess-1',
        reviewedInLocalPdfSession: true
      },
      checklist,
      reg1.updatedSources
    );
    expect(reviewedEntry.reviewedInLocalPdfSession).toBe(true);
    expect(reviewedEntry.sourceDocumentHash).toBe(shaV1);
    expect(reviewedEntry.artifactId).toBe(reg1.updatedSource.currentArtifact?.artifactId);
    expect(reviewedEntry.autoResolved).toBe(false);

    // Krok 2: Ponowne wskazanie IDENTYCZNEGO PDF nie tworzy nowej wersji ani nie degraduje wpisu
    const regSame = registerLocalPdfInspectionSession({
      sources: reg1.updatedSources,
      entries: [reviewedEntry],
      inspection: {
        documentId: 'doc-rpl-bcg10-19535',
        verificationSessionId: 'sess-2',
        fileName: 'bcg10-local.pdf',
        fileSizeBytes: 2048,
        mimeType: 'application/pdf',
        sha256Hex: shaV1,
        comparisonStatus: 'compared_with_trusted_reference',
        integrityStatus: 'hash_matches_known_reference',
        referenceType: 'prior_session_snapshot',
        referenceHash: shaV1,
        pageCount: 2,
        pdfParserVersion: '6.5.438',
        metadataStatus: 'extracted',
        textLayerStatus: 'text_layer_available',
        pdfMetadata: createEmptyPdfMetadataSummary({ title: 'BCG 10 Local Test' }),
        operatorDeclaredOrigin: 'Ponowne wskazanie identycznego pliku'
      }
    });
    expect(regSame.versionCreated).toBe(false);
    expect(regSame.reverificationTriggered).toBe(false);
    expect(regSame.updatedEntries[0].qualificationClass).toBe('source_excerpt_reviewed');
    expect(regSame.updatedEntries[0].requiresReverification).toBe(false);

    // Krok 3: Wskazanie ZMODYFIKOWANEGO PDF (ta sama nazwa, inny SHA-256) -> nowa wersja + kaskadowa degradacja
    const regModified = registerLocalPdfInspectionSession({
      sources: regSame.updatedSources,
      entries: regSame.updatedEntries,
      inspection: {
        documentId: 'doc-rpl-bcg10-19535',
        verificationSessionId: 'sess-3',
        fileName: 'bcg10-local.pdf',
        fileSizeBytes: 2110,
        mimeType: 'application/pdf',
        sha256Hex: shaV2,
        comparisonStatus: 'hash_mismatch',
        integrityStatus: 'hash_mismatch',
        referenceType: 'prior_session_snapshot',
        referenceHash: shaV1,
        pageCount: 2,
        pdfParserVersion: '6.5.438',
        metadataStatus: 'extracted',
        textLayerStatus: 'text_layer_available',
        pdfMetadata: createEmptyPdfMetadataSummary({ title: 'BCG 10 Local Modified' }),
        operatorDeclaredOrigin: 'Zmieniona wersja o tej samej nazwie'
      }
    });

    expect(regModified.versionCreated).toBe(true);
    expect(regModified.reverificationTriggered).toBe(true);
    expect(regModified.updatedSource.currentArtifact?.changeCategory).toBe(
      'unverified_origin_copy'
    );
    expect(regModified.updatedSource.currentArtifact?.previousArtifactId).toBe(
      reg1.updatedSource.currentArtifact?.artifactId
    );
    expect(regModified.updatedEntries[0].qualificationClass).toBe('source_excerpt_pending_review');
    expect(regModified.updatedEntries[0].requiresReverification).toBe(true);
    expect(regModified.updatedEntries[0].autoResolved).toBe(false);
  });

  it('przechowuje wyłącznie metadane i SHA-256 w localStorage (nigdy bajtów PDF ani base64) oraz wymusza re-selekcję po przeładowaniu', () => {
    const storage = createMemoryStorage();
    const baseSources = buildBaseSourceRegistry(STAGE1_CHPL_AUDIT_BUNDLE);
    const shaHex = 'c'.repeat(64);

    const reg = registerLocalPdfInspectionSession({
      sources: baseSources,
      entries: [],
      inspection: {
        documentId: 'doc-rpl-bcg10-19535',
        verificationSessionId: 'sess-storage',
        fileName: 'bcg10-session.pdf',
        fileSizeBytes: 1500,
        mimeType: 'application/pdf',
        sha256Hex: shaHex,
        comparisonStatus: 'not_compared',
        integrityStatus: 'hash_calculated',
        referenceType: 'none',
        referenceHash: null,
        pageCount: 2,
        pdfParserVersion: '6.5.438',
        metadataStatus: 'extracted',
        textLayerStatus: 'text_layer_available',
        pdfMetadata: createEmptyPdfMetadataSummary({ title: 'BCG Metadata Only' }),
        operatorDeclaredOrigin: 'Sesja testowa localStorage'
      }
    });

    const saveRes = saveLocalSourceArtifactsToStorage(storage, reg.updatedSources);
    expect(saveRes.success).toBe(true);

    const rawJson = storage.getItem(SOURCE_ARTIFACTS_STORAGE_KEY);
    expect(rawJson).not.toBeNull();
    const parsed = JSON.parse(rawJson as string) as {
      schemaVersion: string;
      bytesPersistedInLocalStorage: boolean;
      items: Array<{ currentArtifact: Record<string, unknown> }>;
    };
    expect(parsed.schemaVersion).toBe(SOURCE_ARTIFACTS_SCHEMA_VERSION);
    expect(parsed.bytesPersistedInLocalStorage).toBe(false);
    expect(rawJson).not.toMatch(/data:application\/pdf;base64|%PDF-/);
    const serializedArtifactKeys = Object.keys(parsed.items[0].currentArtifact);
    expect(serializedArtifactKeys).not.toContain('bytes');
    expect(serializedArtifactKeys).not.toContain('base64');
    expect(serializedArtifactKeys).not.toContain('rawPdf');

    // Odtworzenie po reloadzie zachowuje SHA-256/historię, ale zeruje dostępność binarną pliku w sesji
    const reloaded = loadSourceRegistryWithLocalArtifacts(STAGE1_CHPL_AUDIT_BUNDLE, storage);
    const reloadedBcg = reloaded.find((s) => s.documentId === 'doc-rpl-bcg10-19535');
    expect(reloadedBcg?.sha256).toBe(shaHex);
    expect(reloadedBcg?.hasPersistedLocalArtifactMetadata).toBe(true);
    expect(reloadedBcg?.activeSessionPageCount).toBeNull();
    expect(reloadedBcg?.statusAxes.fileAvailability).toBe('metadata_only_reload_required');
    expect(reloadedBcg?.statusAxes.storageMode).toBe('metadata_persisted_reload_required');
    expect(reloadedBcg?.currentArtifact?.localPreviewStatus).toBe('reselection_required_after_reload');

    // Czyszczenie metadanych przywraca bazowy stan Stage 1 i nie dotyka Infanrix hexa
    clearLocalSourceArtifactsFromStorage(storage);
    const afterClear = loadSourceRegistryWithLocalArtifacts(STAGE1_CHPL_AUDIT_BUNDLE, storage);
    expect(afterClear.find((s) => s.documentId === 'doc-rpl-bcg10-19535')?.hasPersistedLocalArtifactMetadata).toBeFalsy();

    const infanrix = VACCINES_CATALOG.find((v) => v.id === 'vac-infanrix-hexa');
    expect(infanrix?.verificationStatus).toBe('requires_source_clarification');
    expect(
      infanrix?.sourceDiscrepancies?.some((d) => d.id === 'disc-phenylalanine-content-01')
    ).toBe(true);
  });
});
