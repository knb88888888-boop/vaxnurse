import { webcrypto } from 'node:crypto';
import { afterEach, beforeEach, describe, it, expect } from 'vitest';
import { STAGE1_CHPL_AUDIT_BUNDLE } from '../../src/data/chplStage1AuditSheets';
import { VACCINES_CATALOG } from '../../src/data/vaccinesCatalog';
import {
  buildBaseSourceRegistry,
  buildBaselineEvidenceEntries,
  buildEvidenceLedgerExportPayload,
  createInformalWorkingNote,
  createWorkingEvidenceEntry,
  registerLocalPdfInspectionSession
} from '../../src/utils/chplEvidenceLedger';
import {
  AUDIT_DOSSIER_SCHEMA_VERSION,
  applyPreviewedAuditDossierImport,
  buildAuditDossierExportPayload,
  buildAuditDossierExportPayloadWithSha256,
  buildQuestionReviewQueueB5,
  createAuditSession,
  createDefaultSourceIntakeChecklist,
  parseAndPreviewAuditDossierImport,
  verifyAuditDossierJsonSha256
} from '../../src/utils/chplAuditDossier';
import type {
  AuditSessionRecord,
  EvidenceLedgerEntry,
  InformalWorkingNote,
  PersistedSourceIntakeRecord,
  SourceRegistryEntry
} from '../../src/types/evidenceLedger';

describe('Etap B5 — Portable Audit Dossier: eksport wielozakresowy, SHA-256 JSON, import preview i ochrona niezmienników', () => {
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

  function setupSampleWorkspace(): {
    sources: SourceRegistryEntry[];
    entries: EvidenceLedgerEntry[];
    workingEntries: EvidenceLedgerEntry[];
    notes: InformalWorkingNote[];
    sessions: AuditSessionRecord[];
    intake: Record<string, PersistedSourceIntakeRecord>;
  } {
    const baseSources = buildBaseSourceRegistry(STAGE1_CHPL_AUDIT_BUNDLE);
    const baseline = buildBaselineEvidenceEntries(STAGE1_CHPL_AUDIT_BUNDLE, baseSources);
    const inspected = registerLocalPdfInspectionSession({
      sources: baseSources,
      entries: [],
      inspection: {
        documentId: 'doc-rpl-bcg10-19535',
        verificationSessionId: 'pdf-sess-export',
        fileName: 'bcg-10.pdf',
        mimeType: 'application/pdf',
        fileSizeBytes: 4096,
        pageCount: 6,
        sha256Hex: 'd'.repeat(64),
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

    const session = createAuditSession(
      {
        documentId: 'doc-rpl-bcg10-19535',
        scope: 'Kontrola pkt 4.2 BCG 10',
        reviewedSections: ['4.2'],
        linkedQuestionIds: ['dec-bcg-42-injection-site']
      },
      inspected.updatedSources,
      STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist
    );

    const reviewedEntry = createWorkingEvidenceEntry(
      {
        questionId: 'dec-bcg-42-injection-site',
        documentId: 'doc-rpl-bcg10-19535',
        qrdSection: '4.2',
        pdfPageIndex: 2,
        printedPageNumber: '2',
        pageNumberingType: 'pdf_page_index',
        sourceExcerptRef: 'Podanie wyłącznie śródskórnie 0,1 ml w okolicę naramienną.',
        clinicalObservation: 'Cytat sprawdzony w podglądzie lokalnego PDF.',
        relationship: 'supports',
        reviewStatus: 'awaiting_human_review',
        qualificationClass: 'source_excerpt_reviewed',
        confirmedRealPdfContent: true,
        verificationSessionId: session.sessionId,
        reviewedInLocalPdfSession: true
      },
      STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist,
      inspected.updatedSources
    );

    const note = createInformalWorkingNote(
      {
        questionId: 'dec-bcg-42-injection-site',
        documentId: 'doc-rpl-bcg10-19535',
        qrdSection: '4.2',
        pdfPageIndex: 2,
        noteText: 'Robocza notatka lokalna dotycząca strony 2.',
        disclaimerAcknowledged: true
      },
      STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist,
      inspected.updatedSources
    );

    const intake: Record<string, PersistedSourceIntakeRecord> = {
      'doc-rpl-bcg10-19535': {
        documentId: 'doc-rpl-bcg10-19535',
        checklist: { ...createDefaultSourceIntakeChecklist(), selected_pdf_in_app: true },
        provenanceDeclaration: {
          documentId: 'doc-rpl-bcg10-19535',
          declaredOriginLevel: 'official_origin_operator_declared',
          declaredSourceName: 'RPL',
          declaredSourceUrl: 'https://rejestry.ezdrowie.gov.pl/rpl',
          declaredDocumentIdentifier: '19535',
          declaredAt: '2026-11-12T01:00:00.000Z',
          operatorNote: 'Deklaracja testowa',
          isOperatorDeclaredOnly: true
        },
        metadataOverrides: {},
        operatorNotes: '',
        manualReviewMarkedCompletePendingDecision: false,
        updatedAt: '2026-11-12T01:00:00.000Z'
      }
    };

    return {
      sources: inspected.updatedSources,
      entries: [...baseline, reviewedEntry],
      workingEntries: [reviewedEntry],
      notes: [note],
      sessions: [{ ...session, createdEvidenceIds: [reviewedEntry.evidenceId] }],
      intake
    };
  }

  it('eksportuje 5 zakresów Dossier B5 bez bajtów PDF/Base64/PHI i wylicza rzeczywisty dossierJsonSha256', async () => {
    const ws = setupSampleWorkspace();
    const queue = buildQuestionReviewQueueB5({
      checklist: STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist,
      sources: ws.sources,
      allEntries: ws.entries,
      sessions: ws.sessions
    });

    const full = await buildAuditDossierExportPayloadWithSha256({
      options: { scope: 'full_metadata_and_history', includeNotes: true },
      sources: ws.sources,
      persistedIntake: ws.intake,
      sessions: ws.sessions,
      allEntries: ws.entries,
      workingNotes: ws.notes,
      queue
    });

    expect(full.vaxnurseAuditDossier).toBe(true);
    expect(full.schemaVersion).toBe(AUDIT_DOSSIER_SCHEMA_VERSION);
    expect(full.containsPdfBytes).toBe(false);
    expect(full.containsBase64).toBe(false);
    expect(full.containsPatientData).toBe(false);
    expect(full.clinicalApprovalGranted).toBe(false);
    expect(full.dossierJsonSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(full.workingNotes).toHaveLength(1);
    expect(full.sessions).toHaveLength(1);

    const raw = JSON.stringify(full);
    expect(raw).not.toContain('%PDF-');
    expect(raw).not.toContain('mem-bcg-export'); // bez wskaźnika sesyjnego blob
    const verifiedSha = await verifyAuditDossierJsonSha256(raw);
    expect(verifiedSha.status).toBe('matched');

    // Modyfikacja JSON wykryta przez verifyAuditDossierJsonSha256
    const tampered = raw.replace('Kontrola pkt 4.2 BCG 10', 'Zmieniony zakres');
    const tamperedSha = await verifyAuditDossierJsonSha256(tampered);
    expect(tamperedSha.status).toBe('mismatched');

    // Zakres without_notes wyklucza notatki
    const noNotes = buildAuditDossierExportPayload({
      options: { scope: 'without_notes', includeNotes: true },
      sources: ws.sources,
      persistedIntake: ws.intake,
      sessions: ws.sessions,
      allEntries: ws.entries,
      workingNotes: ws.notes,
      queue
    });
    expect(noNotes.workingNotes).toHaveLength(0);
    expect(noNotes.includesNotes).toBe(false);

    // Zakres selected_question
    const singleQ = buildAuditDossierExportPayload({
      options: {
        scope: 'selected_question',
        includeNotes: true,
        selectedQuestionId: 'dec-bcg-42-injection-site'
      },
      sources: ws.sources,
      persistedIntake: ws.intake,
      sessions: ws.sessions,
      allEntries: ws.entries,
      workingNotes: ws.notes,
      queue
    });
    expect(singleQ.questionChecklistSnapshots).toHaveLength(1);
    expect(singleQ.entries.every((e) => e.questionId === 'dec-bcg-42-injection-site')).toBe(true);

    // Zakres selected_product
    const prodScope = buildAuditDossierExportPayload({
      options: {
        scope: 'selected_product',
        includeNotes: true,
        selectedProductKey: 'bcg_10'
      },
      sources: ws.sources,
      persistedIntake: ws.intake,
      sessions: ws.sessions,
      allEntries: ws.entries,
      workingNotes: ws.notes,
      queue
    });
    expect(prodScope.sources.every((s) => s.productKey === 'bcg_10')).toBe(true);

    // Zakres selected_sessions
    const selSess = buildAuditDossierExportPayload({
      options: {
        scope: 'selected_sessions',
        includeNotes: true,
        selectedSessionIds: [ws.sessions[0].sessionId]
      },
      sources: ws.sources,
      persistedIntake: ws.intake,
      sessions: ws.sessions,
      allEntries: ws.entries,
      workingNotes: ws.notes,
      queue
    });
    expect(selSess.sessions).toHaveLength(1);
  });

  it('odrzuca ataki: zły JSON, zła wersja schematu, __proto__, XSS, Base64/PDF bytes, vaxnurseBackup, autoResolved: true oraz fałszywe statusy kliniczne', () => {
    const ws = setupSampleWorkspace();
    const baseOpts = {
      sources: ws.sources,
      checklist: STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist,
      existingSessions: [],
      existingWorkingEntries: [],
      existingWorkingNotes: [],
      existingIntake: {}
    };

    expect(parseAndPreviewAuditDossierImport('', baseOpts).canImport).toBe(false);
    expect(parseAndPreviewAuditDossierImport('{invalid', baseOpts).canImport).toBe(false);
    expect(
      parseAndPreviewAuditDossierImport(
        '{"__proto__":{"admin":true},"vaxnurseAuditDossier":true}',
        baseOpts
      ).canImport
    ).toBe(false);

    expect(
      parseAndPreviewAuditDossierImport(
        JSON.stringify({ vaxnurseBackup: true, vaccines: [] }),
        baseOpts
      ).canImport
    ).toBe(false);

    expect(
      parseAndPreviewAuditDossierImport(
        JSON.stringify({
          vaxnurseAuditDossier: true,
          schemaVersion: '9.9.9',
          containsPdfBytes: false,
          containsBase64: false,
          containsPatientData: false,
          clinicalApprovalGranted: false,
          exportedAt: '2026-11-12T00:00:00.000Z'
        }),
        baseOpts
      ).canImport
    ).toBe(false);

    const payload = buildAuditDossierExportPayload({
      options: { scope: 'full_metadata_and_history', includeNotes: true },
      sources: ws.sources,
      persistedIntake: ws.intake,
      sessions: ws.sessions,
      allEntries: ws.entries,
      workingNotes: ws.notes,
      queue: []
    });

    // Próba wstrzyknięcia bajtów PDF / base64
    const withBase64 = { ...payload, rawPdf: 'JVBERi0xLjQK' };
    expect(
      parseAndPreviewAuditDossierImport(JSON.stringify(withBase64), baseOpts).canImport
    ).toBe(false);

    // Próba wstrzyknięcia XSS
    const withXss = {
      ...payload,
      sessions: [{ ...ws.sessions[0], scope: '<script>alert(1)</script>' }]
    };
    expect(
      parseAndPreviewAuditDossierImport(JSON.stringify(withXss), baseOpts).canImport
    ).toBe(false);

    // Próba przemycenia verified_chpl lub autoResolved: true
    const withClinicalClaim = {
      ...payload,
      entries: [{ ...ws.workingEntries[0], autoResolved: true }]
    };
    expect(
      parseAndPreviewAuditDossierImport(JSON.stringify(withClinicalClaim), baseOpts).canImport
    ).toBe(false);

    const withVerifiedFull = {
      ...payload,
      statusClaim: 'verified_full'
    };
    expect(
      parseAndPreviewAuditDossierImport(JSON.stringify(withVerifiedFull), baseOpts).canImport
    ).toBe(false);
  });

  it('wykrywa konflikty SHA-256, wersji, sesji, dowodów oraz degraduje zewnętrzne source_excerpt_reviewed i migruje format 1.1.0', () => {
    const ws = setupSampleWorkspace();
    const exported = buildAuditDossierExportPayload({
      options: { scope: 'full_metadata_and_history', includeNotes: true },
      sources: ws.sources,
      persistedIntake: ws.intake,
      sessions: ws.sessions,
      allEntries: ws.entries,
      workingNotes: ws.notes,
      queue: []
    });

    // Symulacja importu na drugim urządzeniu (brak aktywnego pliku PDF w pamięci + inna wersja lokalna)
    const localConflictingSources = ws.sources.map((s) =>
      s.documentId === 'doc-rpl-bcg10-19535'
        ? {
            ...s,
            pdfScopeRange: 'Inna wersja lokalna',
            currentArtifact: s.currentArtifact
              ? { ...s.currentArtifact, localArtifactId: null }
              : null
          }
        : s
    );
    const localConflictingSession = {
      ...ws.sessions[0],
      scope: 'Lokalnie zmodyfikowany zakres sesji'
    };
    const localConflictingEntry = {
      ...ws.workingEntries[0],
      clinicalObservation: 'Inna lokalna obserwacja.'
    };

    const preview = parseAndPreviewAuditDossierImport(JSON.stringify(exported), {
      sources: localConflictingSources,
      checklist: STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist,
      existingSessions: [localConflictingSession],
      existingWorkingEntries: [localConflictingEntry],
      existingWorkingNotes: [],
      existingIntake: {}
    });

    expect(preview.canImport).toBe(true);
    expect(preview.conflicts.some((c) => c.kind === 'session_scope_mismatch')).toBe(true);
    expect(preview.conflicts.some((c) => c.kind === 'evidence_content_mismatch')).toBe(true);
    expect(preview.conflicts.some((c) => c.kind === 'document_version_mismatch')).toBe(true);
    expect(preview.externalVerificationClaimsCount).toBeGreaterThan(0);

    const merged = applyPreviewedAuditDossierImport(preview, {
      sources: localConflictingSources,
      sessions: [localConflictingSession],
      workingEntries: [localConflictingEntry],
      workingNotes: [],
      intakeRecords: {}
    });

    // Zewnętrzny status source_excerpt_reviewed ZAWSZE degradowany do source_excerpt_pending_review!
    expect(merged.mergedEntries[0].qualificationClass).toBe('source_excerpt_pending_review');
    expect(merged.mergedEntries[0].requiresReverification).toBe(true);
    expect(merged.mergedEntries[0].importProvenance?.localConfirmationState).toBe(
      'unconfirmed_imported_claim'
    );
    expect(merged.mergedEntries[0].autoResolved).toBe(false);
    expect(merged.mergedSessions[0].requiresFileReselectionAfterReload).toBe(true);

    // Migracja ze starszego formatu B3 (schemaVersion: 1.1.0)
    const legacyPayload = buildEvidenceLedgerExportPayload({
      sources: ws.sources,
      workingEntries: ws.workingEntries,
      workingNotes: ws.notes,
      includeBaselineExtracts: false
    });
    const legacyPreview = parseAndPreviewAuditDossierImport(JSON.stringify(legacyPayload), {
      sources: ws.sources,
      checklist: STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist,
      existingSessions: [],
      existingWorkingEntries: [],
      existingWorkingNotes: [],
      existingIntake: {}
    });
    expect(legacyPreview.canImport).toBe(true);
    expect(legacyPreview.sourceFormatVersion).toBe('1.1.0');
    expect(legacyPreview.migrationNote).toMatch(/1\.1\.0/);

    // Sprawdzenie nienaruszalności Infanrix hexa
    const infanrix = VACCINES_CATALOG.find((v) => v.id === 'vac-infanrix-hexa')!;
    expect(infanrix.verificationStatus).toBe('requires_source_clarification');
  });

  it('wyklucza wyciągi bazowe origin=bundle_extract przy scalaniu importu dossier oraz rejestruje odrzucone rekordy intake', () => {
    const ws = setupSampleWorkspace();
    const queue = buildQuestionReviewQueueB5({
      checklist: STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist,
      sources: ws.sources,
      allEntries: ws.entries,
      sessions: ws.sessions
    });
    const exported = buildAuditDossierExportPayload({
      options: { scope: 'full_metadata_and_history', includeNotes: true, includeBaselineExtracts: true },
      sources: ws.sources,
      persistedIntake: ws.intake,
      sessions: ws.sessions,
      allEntries: ws.entries,
      workingNotes: ws.notes,
      queue
    });

    const baselineCount = exported.entries.filter((e) => e.origin === 'bundle_extract').length;
    expect(baselineCount).toBeGreaterThan(0);

    const payloadWithBadIntake = {
      ...exported,
      intakeStates: [
        ...exported.intakeStates,
        { documentId: 'doc-nieznany-spoza-rejestru', localNotes: 'test' }
      ]
    };

    const preview = parseAndPreviewAuditDossierImport(JSON.stringify(payloadWithBadIntake), {
      sources: ws.sources,
      checklist: STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist,
      existingSessions: [],
      existingWorkingEntries: [],
      existingWorkingNotes: [],
      existingIntake: {}
    });

    expect(preview.rejectedItems.some((r) => r.id === 'doc-nieznany-spoza-rejestru')).toBe(true);
    expect(preview.validEntries.every((e) => e.origin !== 'bundle_extract')).toBe(true);
  });
});
