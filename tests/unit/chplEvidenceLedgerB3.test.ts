import { describe, it, expect, beforeEach } from 'vitest';
import { STAGE1_CHPL_AUDIT_BUNDLE } from '../../src/data/chplStage1AuditSheets';
import { VACCINES_CATALOG } from '../../src/data/vaccinesCatalog';
import {
  ALLOWED_EVIDENCE_QUALIFICATION_CLASSES,
  EVIDENCE_LEDGER_SCHEMA_VERSION,
  EVIDENCE_LEDGER_STORAGE_KEY,
  HISTORICAL_DOCUMENT_NOTICE,
  SOURCE_QUALITY_DISCLAIMER,
  WORKING_NOTES_STORAGE_KEY,
  applyPreviewedEvidenceLedgerImport,
  buildBaseSourceRegistry,
  buildBaselineEvidenceEntries,
  buildEvidenceLedgerExportPayload,
  computeSourceQualityMetrics,
  createWorkingEvidenceEntry,
  detectArtifactHashChange,
  getQualificationClassPresentation,
  migrateMaster04EvidenceStorage,
  parseAndPreviewEvidenceLedgerImport,
  registerNewDocumentArtifactVersion,
  saveEvidenceAndNotesAtomically,
  validateWorkingEvidenceInput
} from '../../src/utils/chplEvidenceLedger';
import { createBackupPayload, getStoredVaccines } from '../../src/utils/backup';

describe('Etap B3 — Autentyczność źródeł, kwalifikacja dowodów, migracja i bezpieczeństwo importu', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('13.1 rozróżnia typy obiektów źródłowych, cztery niezależne osie i realną liczbę stron akt.pdf (48 str.)', () => {
    const sources = buildBaseSourceRegistry(STAGE1_CHPL_AUDIT_BUNDLE);
    expect(sources).toHaveLength(9);

    const pso = sources.find((s) => s.documentId === 'doc-mz-pso-2027-akt');
    expect(pso?.objectType).toBe('local_reference_document');
    expect(pso?.physicalPageCount).toBe(48);
    expect(pso?.fileSizeBytes).toBe(864528);
    expect(pso?.statusAxes.acquisitionStatus).toBe('acquired');
    expect(pso?.statusAxes.contentReviewStatus).toBe('section_reviewed');

    const bcg = sources.find((s) => s.documentId === 'doc-rpl-bcg10-19535');
    expect(bcg?.objectType).toBe('official_registry_record');
    expect(bcg?.physicalPageCount).toBe(7);
    expect(bcg?.fileSizeBytes).toBe(163805);
    expect(bcg?.statusAxes.acquisitionStatus).not.toBe('acquired');

    const endpoint = sources.find((s) => s.documentId === 'doc-rpl-spikevax-cen-endpoints');
    expect(endpoint?.objectType).toBe('official_endpoint');
    expect(endpoint?.statusAxes.acquisitionStatus).toBe('access_failed');
    expect(endpoint?.statusAxes.integrityStatus).toBe('not_checked');
    expect(endpoint?.sha256).toBeNull();
    expect(
      endpoint?.retrievalAttempts.some((a) => a.result === 'http_error' && a.httpStatus === 400)
    ).toBe(true);

    const influvac = sources.find((s) => s.documentId === 'doc-rpl-influvac-49462');
    const vaxigrip = sources.find((s) => s.documentId === 'doc-rpl-vaxigrip-50032');
    expect(influvac?.objectType).toBe('official_registry_record');
    expect(vaxigrip?.objectType).toBe('official_registry_record');
    expect(influvac?.statusAxes.acquisitionStatus).not.toBe('acquired');
    expect(vaxigrip?.statusAxes.acquisitionStatus).not.toBe('acquired');

    const hist = sources.find((s) => s.documentId === 'doc-rpl-vaxigrip-tetra-35346-hist');
    expect(hist?.objectType).toBe('historical_document');
    expect(hist?.isHistoricalRejectedForCurrentSeason).toBe(true);
    expect(hist?.historicalNotice).toBe(HISTORICAL_DOCUMENT_NOTICE);
    expect(hist?.statusAxes.acquisitionStatus).toBe('historical_copy_only');

    const spikePl = sources.find((s) => s.documentId === 'doc-ema-spikevax-xfg-pl');
    const spikeEn = sources.find((s) => s.documentId === 'doc-ema-spikevax-xfg-en');
    expect(spikePl?.language).toBe('PL');
    expect(spikePl?.physicalPageCount).toBe(177);
    expect(spikeEn?.language).toBe('EN');
    expect(spikeEn?.physicalPageCount).toBe(158);
    expect(spikePl?.sha256).not.toBe(spikeEn?.sha256);

    const infanrixCorp = sources.find((s) => s.documentId === 'doc-gsk-infanrix-hexa-pl');
    expect(infanrixCorp?.objectType).toBe('official_document');
    expect(infanrixCorp?.physicalPageCount).toBe(48);
    expect(infanrixCorp?.sha256).toHaveLength(64);
    expect(infanrixCorp?.currentArtifact?.hashProvenance.comparisonStatus).toBe('not_compared');
    expect(infanrixCorp?.statusAxes.integrityStatus).toBe('hash_calculated');
    expect(infanrixCorp?.statusAxes.originStatus).toBe('manual_review_required');
  });

  it('13.1 wykrywa zmianę SHA-256 (ta sama nazwa pliku, nowa rewizja, inny język, niezweryfikowane źródło) i flaguje dowody do re-weryfikacji', () => {
    const sources = buildBaseSourceRegistry(STAGE1_CHPL_AUDIT_BUNDLE);
    const pso = sources.find((s) => s.documentId === 'doc-mz-pso-2027-akt')!;
    const influvac = sources.find((s) => s.documentId === 'doc-rpl-influvac-49462')!;

    const silentReplace = detectArtifactHashChange(pso, {
      sha256: 'a'.repeat(64),
      fileName: pso.currentArtifact?.fileName ?? 'akt.pdf',
      language: 'PL',
      documentDate: pso.currentArtifact?.documentDate ?? null
    });
    expect(silentReplace.changed).toBe(true);
    expect(silentReplace.changeCategory).toBe('same_filename_modified_bytes');

    const newRevision = detectArtifactHashChange(influvac, {
      sha256: 'b'.repeat(64),
      fileName: 'OLI-2026-12-01.pdf',
      language: 'PL',
      documentDate: '2026-12-01'
    });
    expect(newRevision.changeCategory).toBe('new_chpl_revision');

    const altLang = detectArtifactHashChange(pso, {
      sha256: 'c'.repeat(64),
      language: 'EN'
    });
    expect(altLang.changeCategory).toBe('alternate_language_version');

    const untrusted = detectArtifactHashChange(pso, {
      sha256: 'd'.repeat(64),
      unverifiedOrigin: true
    });
    expect(untrusted.changeCategory).toBe('unverified_origin_copy');

    const verifiedEntry = createWorkingEvidenceEntry(
      {
        questionId: 'dec-bcg-42-injection-site',
        documentId: 'doc-mz-pso-2027-akt',
        qrdSection: '4.2',
        pdfPageIndex: 3,
        printedPageNumber: '3',
        pageNumberingType: 'pdf_page_index',
        sourceExcerptRef: 'PSO 2027 akt.pdf — schemat noworodków (str. 3)',
        clinicalObservation: 'Potwierdzono ręcznie z lokalnym akt.pdf przed podmianą wersji.',
        relationship: 'supports',
        reviewStatus: 'awaiting_human_review',
        qualificationClass: 'source_excerpt_reviewed',
        confirmedRealPdfContent: true
      },
      STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist,
      sources
    );
    expect(verifiedEntry.qualificationClass).toBe('source_excerpt_reviewed');

    const versioned = registerNewDocumentArtifactVersion({
      source: pso,
      entries: [verifiedEntry],
      newFile: {
        fileName: 'akt.pdf',
        fileSizeBytes: 865000,
        physicalPageCount: 49,
        documentDate: pso.currentArtifact?.documentDate ?? null,
        retrievedAt: '2026-11-12T00:10:00Z',
        sourceUrl: pso.officialSourceUrl,
        language: 'PL',
        sha256: 'e'.repeat(64),
        acquiredLocally: true
      }
    });

    expect(versioned.detectedChange.changeCategory).toBe('same_filename_modified_bytes');
    expect(versioned.updatedSource.artifactHistory.length).toBeGreaterThanOrEqual(2);
    expect(versioned.updatedSource.artifactHistory[0].isHistoricalVersion).toBe(true);
    expect(versioned.updatedSource.currentArtifact?.requiresReverification).toBe(true);
    expect(versioned.updatedEntries[0].requiresReverification).toBe(true);
    expect(versioned.updatedEntries[0].qualificationClass).toBe('source_excerpt_pending_review');
  });

  it('13.2 rozdziela 6 klas kwalifikacji, nie nadaje source_excerpt_reviewed w baseline i blokuje ręczne awanse bez realnego PDF', () => {
    const sources = buildBaseSourceRegistry(STAGE1_CHPL_AUDIT_BUNDLE);
    const baseline = buildBaselineEvidenceEntries(STAGE1_CHPL_AUDIT_BUNDLE, sources);

    expect(ALLOWED_EVIDENCE_QUALIFICATION_CLASSES).toHaveLength(7);
    for (const qClass of ALLOWED_EVIDENCE_QUALIFICATION_CLASSES) {
      expect(getQualificationClassPresentation(qClass).label.length).toBeGreaterThan(5);
    }

    expect(baseline.some((e) => e.qualificationClass === 'source_excerpt_reviewed')).toBe(false);
    expect(baseline.some((e) => e.qualificationClass === 'unavailable_source_reference')).toBe(true);
    expect(baseline.some((e) => e.qualificationClass === 'secondary_reference')).toBe(true);
    expect(baseline.some((e) => e.qualificationClass === 'conflicting_reference')).toBe(true);
    expect(baseline.some((e) => e.qualificationClass === 'conflicting_source_excerpt')).toBe(false);
    expect(baseline.some((e) => e.qualificationClass === 'traceability_reference')).toBe(true);

    // Próba nadania source_excerpt_reviewed bez checkboxa potwierdzenia treści PDF
    const noConfirm = validateWorkingEvidenceInput(
      {
        questionId: 'dec-bcg-42-injection-site',
        documentId: 'doc-rpl-bcg10-19535',
        qrdSection: '4.2',
        pdfPageIndex: 3,
        printedPageNumber: '',
        pageNumberingType: 'pdf_page_index',
        sourceExcerptRef: 'Pkt 4.2 ChPL BCG 10 (str. 3)',
        clinicalObservation: 'Bez ręcznego potwierdzenia PDF.',
        relationship: 'supports',
        reviewStatus: 'awaiting_human_review',
        qualificationClass: 'source_excerpt_reviewed',
        confirmedRealPdfContent: false
      },
      STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist,
      sources
    );
    expect(noConfirm.valid).toBe(false);
    expect(noConfirm.errors.join(' ')).toMatch(/ręcznie porównany z treścią rzeczywistego pliku PDF/i);

    // Próba awansu na dokumencie historycznym 2025/2026 oraz niedostępnym endpoincie HTTP 400
    const histAttempt = validateWorkingEvidenceInput(
      {
        questionId: 'dec-flu-63-shelf-life',
        documentId: 'doc-rpl-vaxigrip-tetra-35346-hist',
        qrdSection: '6.3',
        pdfPageIndex: null,
        printedPageNumber: 'str. 1',
        pageNumberingType: 'unconfirmed',
        sourceExcerptRef: 'Historyczny VaxigripTetra',
        clinicalObservation: 'Próba awansu historycznego dokumentu.',
        relationship: 'does_not_resolve',
        reviewStatus: 'awaiting_human_review',
        qualificationClass: 'source_excerpt_reviewed',
        confirmedRealPdfContent: true
      },
      STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist,
      sources
    );
    expect(histAttempt.valid).toBe(false);
    expect(histAttempt.errors.join(' ')).toMatch(/historyczny/i);

    const endpointAttempt = validateWorkingEvidenceInput(
      {
        questionId: 'dec-spikevax-42-pediatric-schedule',
        documentId: 'doc-rpl-spikevax-cen-endpoints',
        qrdSection: '4.2',
        pdfPageIndex: null,
        printedPageNumber: 'brak',
        pageNumberingType: 'unconfirmed',
        sourceExcerptRef: 'Próba na endpoincie HTTP 400',
        clinicalObservation: 'Brak PDF dla endpointu HTTP 400.',
        relationship: 'does_not_resolve',
        reviewStatus: 'requires_authority_clarification',
        qualificationClass: 'source_excerpt_reviewed',
        confirmedRealPdfContent: true
      },
      STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist,
      sources
    );
    expect(endpointAttempt.valid).toBe(false);
    expect(endpointAttempt.errors.join(' ')).toMatch(/niedostępnego endpointu|SHA-256/i);

    // Metryki Quality Dashboard dla stanu początkowego
    const metrics = computeSourceQualityMetrics({
      sources,
      allEntries: baseline,
      checklist: STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist
    });
    expect(metrics.totalSourceRecords).toBe(9);
    expect(metrics.acquiredDocumentsCount).toBe(1);
    expect(metrics.registryEntriesWithoutPdfCount).toBe(3);
    expect(metrics.failedRetrievalAttemptsCount).toBe(1);
    expect(metrics.historicalDocumentsCount).toBe(1);
    expect(metrics.documentsWithoutSha256Count).toBe(1);
    expect(metrics.documentsWithCalculatedSha256Count).toBe(8);
    expect(metrics.documentsWithComparedHashCount).toBe(1);
    expect(metrics.verifiedExcerptsCount).toBe(0);
    expect(metrics.conflictingReferencesCount).toBe(14);
    expect(metrics.conflictingExcerptsCount).toBe(0);
    expect(metrics.questionsWithoutConfirmedExcerptsCount).toBe(8);
    expect(metrics.disclaimer).toBe(SOURCE_QUALITY_DISCLAIMER);
  });

  it('13.3 bezpiecznie migruje dane MASTER 04 z localStorage bez utraty danych i bez fałszywej weryfikacji', () => {
    const sources = buildBaseSourceRegistry(STAGE1_CHPL_AUDIT_BUNDLE);
    const b2LegacyEntry = {
      evidenceId: 'ev-work-b2-legacy-1',
      questionId: 'dec-bcg-42-injection-site',
      productKey: 'bcg_10',
      productLabel: 'BCG 10',
      documentId: 'doc-rpl-bcg10-19535',
      documentTitle: 'RPL 19535 BCG 10',
      officialSourceUrl: sources.find((s) => s.documentId === 'doc-rpl-bcg10-19535')!.officialSourceUrl,
      sourceDocumentHash: sources.find((s) => s.documentId === 'doc-rpl-bcg10-19535')!.sha256,
      sha256Basis: 'calculated_local',
      location: {
        qrdSection: '4.2',
        qrdSectionTitle: '4.2 Dawkowanie i sposób podawania',
        pdfPageIndex: 3,
        pdfPageRangeLabel: 'PDF str. 3',
        printedPageNumber: null,
        pageNumberingType: 'pdf_page_index',
        physicalDocumentPageCount: 44
      },
      sourceExcerptRef: 'Stary wpis B2: pkt 4.2 str. 3',
      clinicalObservation: 'Zachowana obserwacja z Etapu B2.',
      relationship: 'supports',
      reviewStatus: 'awaiting_human_review',
      questionWorkStatus: 'awaiting_human_review',
      autoResolved: false,
      origin: 'auditor_working_entry',
      isWorkingNote: true,
      recordedAt: '2026-11-10T10:00:00Z',
      recordedBy: 'Robocza notatka lokalna (przeglądarka)'
    };

    localStorage.setItem(EVIDENCE_LEDGER_STORAGE_KEY, JSON.stringify([b2LegacyEntry]));
    const migrated = migrateMaster04EvidenceStorage(
      localStorage,
      STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist,
      sources,
      { persistIfMigrated: true }
    );

    expect(migrated.report.migratedFromVersion).toBe('b2_master04');
    expect(migrated.report.preservedEntryIds).toEqual(['ev-work-b2-legacy-1']);
    expect(migrated.report.downgradedToReferenceCount).toBe(1);
    expect(migrated.report.flaggedReverificationCount).toBe(1);
    expect(migrated.entries).toHaveLength(1);
    expect(migrated.entries[0].qualificationClass).toBe('source_excerpt_pending_review');
    expect(migrated.entries[0].requiresReverification).toBe(true);
    expect(migrated.entries[0].autoResolved).toBe(false);
    expect(migrated.entries[0].importProvenance?.migrationSourceVersion).toBe('b2_master04');

    // Odporność na uszkodzony JSON i próbę prototype pollution w localStorage
    localStorage.setItem(EVIDENCE_LEDGER_STORAGE_KEY, '{corrupt json');
    const broken = migrateMaster04EvidenceStorage(
      localStorage,
      STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist,
      sources
    );
    expect(broken.entries).toEqual([]);
  });

  it('13.4 blokuje prototype pollution, javascript: URL, backup katalogu, fałszywe twierdzenia oraz bezpiecznie wycofuje zapis przy QuotaExceededError', () => {
    const sources = buildBaseSourceRegistry(STAGE1_CHPL_AUDIT_BUNDLE);
    const baseline = buildBaselineEvidenceEntries(STAGE1_CHPL_AUDIT_BUNDLE, sources);

    // 1. Prototype pollution raw string
    const protoPreview = parseAndPreviewEvidenceLedgerImport(
      '{"vaxnurseEvidenceLedger":true,"schemaVersion":"1.1.0","__proto__":{"polluted":true},"containsPatientData":false,"clinicalApprovalGranted":false,"exportedAt":"2026-11-11T12:00:00Z","entries":[]}',
      {
        sources,
        checklist: STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist,
        existingWorkingEntries: [],
        existingWorkingNotes: []
      }
    );
    expect(protoPreview.canImport).toBe(false);
    expect(protoPreview.errors.join(' ')).toMatch(/__proto__/i);

    // 2. Próba wczytania głównego backupu aplikacji vaxnurseBackup
    const appBackup = createBackupPayload(VACCINES_CATALOG);
    const backupPreview = parseAndPreviewEvidenceLedgerImport(JSON.stringify(appBackup), {
      sources,
      checklist: STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist,
      existingWorkingEntries: [],
      existingWorkingNotes: []
    });
    expect(backupPreview.canImport).toBe(false);
    expect(backupPreview.errors.join(' ')).toMatch(/vaxnurseBackup/i);

    // 3. Próba javascript: URL i nieznanego źródła / niezgodnego SHA-256
    const localVerified = createWorkingEvidenceEntry(
      {
        questionId: 'dec-bcg-42-injection-site',
        documentId: 'doc-rpl-bcg10-19535',
        qrdSection: '4.2',
        pdfPageIndex: 3,
        printedPageNumber: '',
        pageNumberingType: 'pdf_page_index',
        sourceExcerptRef: 'Pkt 4.2 BCG 10 (str. 3)',
        clinicalObservation: 'Poprawna obserwacja lokalna przed eksportem.',
        relationship: 'supports',
        reviewStatus: 'awaiting_human_review',
        qualificationClass: 'source_excerpt_reviewed',
        confirmedRealPdfContent: true
      },
      STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist,
      sources
    );

    const payload = buildEvidenceLedgerExportPayload({
      sources,
      baselineEntries: baseline,
      workingEntries: [localVerified],
      workingNotes: [],
      includeBaselineExtracts: false
    });
    expect(payload.schemaVersion).toBe(EVIDENCE_LEDGER_SCHEMA_VERSION);

    const jsUrlPayload = {
      ...payload,
      entries: [{ ...localVerified, officialSourceUrl: 'javascript:alert(1)' }]
    };
    const jsUrlPreview = parseAndPreviewEvidenceLedgerImport(JSON.stringify(jsUrlPayload), {
      sources,
      checklist: STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist,
      existingWorkingEntries: [],
      existingWorkingNotes: []
    });
    expect(jsUrlPreview.canImport).toBe(false);
    expect(jsUrlPreview.rejectedItems.length).toBeGreaterThan(0);

    // 4. Import twierdzenia source_excerpt_reviewed z poprawnego JSON zostaje zdegradowany lokalnie do unconfirmed_imported_claim!
    const claimedImportPreview = parseAndPreviewEvidenceLedgerImport(JSON.stringify(payload), {
      sources,
      checklist: STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist,
      existingWorkingEntries: [],
      existingWorkingNotes: []
    });
    expect(claimedImportPreview.canImport).toBe(true);
    expect(claimedImportPreview.importedVerificationClaimsCount).toBeGreaterThanOrEqual(1);

    const applied = applyPreviewedEvidenceLedgerImport(claimedImportPreview, [], []);
    expect(applied.mergedEntries).toHaveLength(1);
    expect(applied.mergedEntries[0].qualificationClass).toBe('source_excerpt_pending_review');
    expect(applied.mergedEntries[0].importProvenance?.localConfirmationState).toBe(
      'unconfirmed_imported_claim'
    );
    expect(applied.mergedEntries[0].requiresReverification).toBe(true);
    expect(applied.mergedEntries[0].autoResolved).toBe(false);

    // 5. Konflikt SHA-256 i nieznanego źródła w sekcji sources
    const conflictPayload = {
      ...payload,
      sources: [
        { documentId: 'doc-unknown-xyz', objectType: 'official_document' },
        { documentId: 'doc-rpl-bcg10-19535', sha256: 'f'.repeat(64) }
      ]
    };
    const conflictPreview = parseAndPreviewEvidenceLedgerImport(JSON.stringify(conflictPayload), {
      sources,
      checklist: STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist,
      existingWorkingEntries: [],
      existingWorkingNotes: []
    });
    expect(conflictPreview.canImport).toBe(false);
    expect(conflictPreview.unknownSourceIds).toContain('doc-unknown-xyz');
    expect(conflictPreview.conflictsCount).toBeGreaterThanOrEqual(2);

    // 6. Atomowy zapis + rollback przy QuotaExceededError podczas zapisu WORKING_NOTES_STORAGE_KEY
    const prevMap = new Map<string, string>([
      [EVIDENCE_LEDGER_STORAGE_KEY, '["prev-entry"]'],
      [WORKING_NOTES_STORAGE_KEY, '["prev-note"]']
    ]);
    const failingStorage: Storage = {
      get length() {
        return prevMap.size;
      },
      clear: () => prevMap.clear(),
      key: (idx) => Array.from(prevMap.keys())[idx] ?? null,
      getItem: (k) => prevMap.get(k) ?? null,
      removeItem: (k) => {
        prevMap.delete(k);
      },
      setItem: (k, v) => {
        if (k === WORKING_NOTES_STORAGE_KEY) {
          throw new DOMException('Quota exceeded', 'QuotaExceededError');
        }
        prevMap.set(k, v);
      }
    };
    const atomicRes = saveEvidenceAndNotesAtomically(failingStorage, [localVerified], []);
    expect(atomicRes.success).toBe(false);
    expect(atomicRes.rolledBack).toBe(true);
    expect(prevMap.get(EVIDENCE_LEDGER_STORAGE_KEY)).toBe('["prev-entry"]');
    expect(prevMap.get(WORKING_NOTES_STORAGE_KEY)).toBe('["prev-note"]');

    // 7. Regresja kliniczna Infanrix hexa
    const infanrix = getStoredVaccines().find((v) => v.id === 'vac-infanrix-hexa');
    expect(infanrix?.verificationStatus).toBe('requires_source_clarification');
    expect(infanrix?.sourceDiscrepancies?.[0]?.status).toBe('requires_clarification');
  });
});
