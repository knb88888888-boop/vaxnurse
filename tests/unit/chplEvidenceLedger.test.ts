import { describe, it, expect, beforeEach } from 'vitest';
import { STAGE1_CHPL_AUDIT_BUNDLE } from '../../src/data/chplStage1AuditSheets';
import {
  DEFAULT_EVIDENCE_FILTERS,
  EMPTY_QUESTION_EVIDENCE_MESSAGE,
  EVIDENCE_LEDGER_SCHEMA_VERSION,
  EVIDENCE_LEDGER_STORAGE_KEY,
  INFORMAL_WORKING_NOTE_DISCLAIMER,
  MAX_EXCERPT_LENGTH,
  MAX_OBSERVATION_LENGTH,
  MAX_WORKING_NOTE_LENGTH,
  WORKING_NOTES_STORAGE_KEY,
  applyPreviewedEvidenceLedgerImport,
  buildBaseSourceRegistry,
  buildBaselineEvidenceEntries,
  buildEvidenceLedgerExportPayload,
  buildQuestionTraceabilitySummaries,
  createInformalWorkingNote,
  createWorkingEvidenceEntry,
  filterEvidenceLedgerEntries,
  getProductScopeLabel,
  getQrdSectionTitle,
  getQuestionWorkStatusLabel,
  getRelationshipPresentation,
  getReviewStatusLabel,
  getSourceVerificationStatusLabel,
  isValidQrdSection,
  isValidSha256Hex,
  loadWorkingEvidenceFromStorage,
  loadWorkingNotesFromStorage,
  parseAndPreviewEvidenceLedgerImport,
  parsePdfPageReference,
  parseQrdTokensFromSectionRef,
  saveWorkingEvidenceToStorage,
  saveWorkingNotesToStorage,
  validateWorkingEvidenceInput,
  validateWorkingNoteInput
} from '../../src/utils/chplEvidenceLedger';

describe('chplEvidenceLedger — Etap B2 Source Registry, Traceability Ledger i bezpieczeństwo importu', () => {
  const sources = buildBaseSourceRegistry(STAGE1_CHPL_AUDIT_BUNDLE);
  const checklist = STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist;
  const baselineEntries = buildBaselineEvidenceEntries(STAGE1_CHPL_AUDIT_BUNDLE, sources);

  beforeEach(() => {
    localStorage.clear();
  });

  it('buduje pełny Rejestr Dokumentów Źródłowych rozdzielający EPAR PL/EN, RPL CEN HTTP 400, VaxigripTetra 2025/2026 oraz Infanrix hexa', () => {
    expect(sources.length).toBe(9);

    const spikevaxPl = sources.find((s) => s.documentId === 'doc-ema-spikevax-xfg-pl');
    const spikevaxEn = sources.find((s) => s.documentId === 'doc-ema-spikevax-xfg-en');
    const spikevaxCen400 = sources.find((s) => s.documentId === 'doc-rpl-spikevax-cen-endpoints');
    const vaxHist = sources.find((s) => s.documentId === 'doc-rpl-vaxigrip-tetra-35346-hist');
    const infanrixDoc = sources.find((s) => s.documentId === 'doc-gsk-infanrix-hexa-pl');

    expect(spikevaxPl?.physicalPageCount).toBe(177);
    expect(spikevaxPl?.revisionDate).toBeNull();
    expect(spikevaxPl?.sha256Basis).toBe('bundle_recorded_pdf_sha256');
    expect(spikevaxPl?.sourceVerificationStatus).toBe('official_source_confirmed');

    expect(spikevaxEn?.physicalPageCount).toBe(158);
    expect(spikevaxEn?.language).toBe('EN');
    expect(spikevaxEn?.sha256).toBe(
      '8932b31f46e652f9ee4be89ad65cd6003f9fa5a63be0f2af64affd645a0d7024'
    );

    expect(spikevaxCen400?.sourceVerificationStatus).toBe('official_source_unavailable');
    expect(spikevaxCen400?.sha256).toBeNull();
    expect(spikevaxCen400?.sha256Basis).toBe('not_verified_binary');

    expect(vaxHist?.isHistoricalRejectedForCurrentSeason).toBe(true);
    expect(vaxHist?.sourceVerificationStatus).toBe('document_version_uncertain');

    expect(infanrixDoc?.sourceVerificationStatus).toBe('requires_manual_review');
    expect(infanrixDoc?.linkedCatalogVaccineIds).toContain('vac-infanrix-hexa');

    // Żaden dokument nie używa etykiety verified_full
    expect(
      sources.some((s) => (s.sourceVerificationStatus as string) === 'verified_full')
    ).toBe(false);
    expect(getSourceVerificationStatusLabel('official_source_confirmed')).toMatch(
      /nie stanowi weryfikacji treści klinicznej/i
    );
    expect(getSourceVerificationStatusLabel('not_checked')).toBe('Nie sprawdzono');
    expect(getSourceVerificationStatusLabel('metadata_mismatch')).toMatch(/Niezgodność metadanych/i);
  });

  it('parsuje sekcje QRD i rozróżnia indeks strony PDF od numeracji drukowanej oraz wpisów poza zakresem', () => {
    expect(parseQrdTokensFromSectionRef('2, 6.3–6.4, 8 i 10')).toEqual([
      '2',
      '6.3',
      '6.4',
      '8',
      '10'
    ]);
    expect(parseQrdTokensFromSectionRef('brak sekcji')).toEqual([]);
    expect(getQrdSectionTitle('4.2')).toMatch(/Dawkowanie/i);
    expect(getQrdSectionTitle('99.9')).toBe('Punkt QRD 99.9');
    expect(isValidQrdSection('4.8')).toBe(true);
    expect(isValidQrdSection('6.4')).toBe(true);
    expect(isValidQrdSection('4.99')).toBe(false);
    expect(isValidSha256Hex('a'.repeat(64))).toBe(true);
    expect(isValidSha256Hex('xyz')).toBe(false);

    const validPage = parsePdfPageReference('EPAR PL str. 67', 177);
    expect(validPage.pdfPageIndex).toBe(67);
    expect(validPage.pageNumberingType).toBe('pdf_page_index');
    expect(validPage.printedPageNumber).toMatch(/Osobna numeracja druku niepotwierdzona/i);

    const rangePage = parsePdfPageReference('str. 67–68 (Aneks I)', 177);
    expect(rangePage.pdfPageIndex).toBe(67);
    expect(rangePage.pageNumberingType).toBe('range_in_bundle');

    const outOfBounds = parsePdfPageReference('str. 99', 7);
    expect(outOfBounds.pdfPageIndex).toBeNull();
    expect(outOfBounds.pageNumberingType).toBe('unconfirmed');
  });

  it('buduje łańcuchy dowodowe Etapu I dla wszystkich 8 pytań z niezmiennym autoResolved=false', () => {
    expect(baselineEntries.length).toBeGreaterThanOrEqual(18);
    expect(baselineEntries.every((e) => e.autoResolved === false)).toBe(true);
    expect(baselineEntries.every((e) => e.origin === 'bundle_extract')).toBe(true);

    const summaries = buildQuestionTraceabilitySummaries(checklist, baselineEntries, []);
    expect(summaries).toHaveLength(8);
    expect(summaries.every((s) => s.autoResolved === false)).toBe(true);
    expect(summaries.every((s) => s.workingEvidenceCount === 0)).toBe(true);
    expect(summaries.every((s) => s.bundleExtractCount >= 1)).toBe(true);

    // Weryfikacja wielodokumentowych powiązań kontekstowych
    expect(
      baselineEntries.some(
        (e) =>
          e.questionId === 'dec-bcg-41-age15-vs-pso' && e.documentId === 'doc-mz-pso-2027-akt'
      )
    ).toBe(true);
    expect(
      baselineEntries.some(
        (e) =>
          e.questionId === 'dec-flu-extrapolation-4valent' &&
          e.documentId === 'doc-rpl-vaxigrip-tetra-35346-hist'
      )
    ).toBe(true);
    expect(
      baselineEntries.some(
        (e) =>
          e.questionId === 'dec-covid-gtin-vs-ema-sec10' &&
          e.documentId === 'doc-rpl-spikevax-cen-endpoints'
      )
    ).toBe(true);

    // Weryfikacja słowników prezentacyjnych
    expect(getProductScopeLabel('bcg_10')).toMatch(/BCG 10/);
    expect(getQuestionWorkStatusLabel('open')).toMatch(/autoResolved: false/);
    expect(getReviewStatusLabel('evidence_logged')).toMatch(/roboczy/);
    expect(getRelationshipPresentation('supports').tone).toBe('info');
    expect(getRelationshipPresentation('contradicts').tone).toBe('danger');
  });

  it('waliduje dodawanie roboczych wpisów dowodowych oraz notatek roboczych i egzekwuje ograniczenia zakresów', () => {
    const badEvidence = validateWorkingEvidenceInput(
      {
        questionId: 'nieznane-pytanie',
        documentId: 'nieznany-doc',
        qrdSection: '99',
        pdfPageIndex: null,
        printedPageNumber: '',
        pageNumberingType: 'pdf_page_index',
        sourceExcerptRef: 'abc',
        clinicalObservation: '123',
        relationship: 'supports',
        reviewStatus: 'evidence_logged'
      },
      checklist,
      sources
    );
    expect(badEvidence.valid).toBe(false);
    expect(badEvidence.errors.length).toBeGreaterThanOrEqual(6);

    const outOfBoundsPage = validateWorkingEvidenceInput(
      {
        questionId: 'dec-bcg-42-injection-site',
        documentId: 'doc-rpl-bcg10-19535',
        qrdSection: '4.2',
        pdfPageIndex: 12, // BCG 10 ma 7 stron
        printedPageNumber: '',
        pageNumberingType: 'pdf_page_index',
        sourceExcerptRef: 'Punkt 4.2 ChPL BCG 10 — dawka noworodkowa 0,1 ml.',
        clinicalObservation: 'Wymaga potwierdzenia miejsca podania śródskórnego w ramię.',
        relationship: 'does_not_resolve',
        reviewStatus: 'awaiting_human_review'
      },
      checklist,
      sources
    );
    expect(outOfBoundsPage.valid).toBe(false);
    expect(outOfBoundsPage.errors.join(' ')).toMatch(/przekracza liczbę stron dokumentu.*7 str\./i);

    const oversized = validateWorkingEvidenceInput(
      {
        questionId: 'dec-bcg-42-injection-site',
        documentId: 'doc-rpl-bcg10-19535',
        qrdSection: '4.2',
        pdfPageIndex: 3,
        printedPageNumber: 'str. drukowana 3',
        pageNumberingType: 'pdf_page_index',
        sourceExcerptRef: 'x'.repeat(MAX_EXCERPT_LENGTH + 1),
        clinicalObservation: 'y'.repeat(MAX_OBSERVATION_LENGTH + 1),
        relationship: 'contextualizes',
        reviewStatus: 'evidence_logged'
      },
      checklist,
      sources
    );
    expect(oversized.valid).toBe(false);
    expect(oversized.errors).toHaveLength(2);

    const validEntry = createWorkingEvidenceEntry(
      {
        questionId: 'dec-bcg-42-injection-site',
        documentId: 'doc-rpl-bcg10-19535',
        qrdSection: '4.2',
        pdfPageIndex: 3,
        printedPageNumber: 'str. 3 druku',
        pageNumberingType: 'pdf_page_index',
        sourceExcerptRef: 'Punkt 4.2 ChPL BCG 10 (str. 3) opisuje technikę śródskórną.',
        clinicalObservation: 'Robocza obserwacja porównawcza do decyzji zespołu.',
        relationship: 'contextualizes',
        reviewStatus: 'evidence_logged'
      },
      checklist,
      sources,
      new Date('2026-11-11T12:00:00.000Z')
    );
    expect(validEntry.autoResolved).toBe(false);
    expect(validEntry.origin).toBe('auditor_working_entry');
    expect(validEntry.sourceDocumentHash).toBe(
      sources.find((s) => s.documentId === 'doc-rpl-bcg10-19535')?.sha256
    );

    const badNote = validateWorkingNoteInput(
      {
        questionId: 'bad-q',
        documentId: 'bad-doc',
        qrdSection: 'invalid',
        pdfPageIndex: 0,
        noteText: 'a'.repeat(MAX_WORKING_NOTE_LENGTH + 2),
        disclaimerAcknowledged: false
      },
      checklist,
      sources
    );
    expect(badNote.valid).toBe(false);
    expect(badNote.errors.length).toBeGreaterThanOrEqual(5);

    const validNote = createInformalWorkingNote(
      {
        questionId: 'dec-bcg-42-injection-site',
        documentId: 'doc-rpl-bcg10-19535',
        qrdSection: '4.2',
        pdfPageIndex: 3,
        noteText: 'Do porównania z rozdziałem 4.8 podczas najbliższej weryfikacji.',
        disclaimerAcknowledged: true
      },
      checklist,
      sources,
      new Date('2026-11-11T12:05:00.000Z')
    );
    expect(validNote.isInformalWorkingNote).toBe(true);
    expect(validNote.disclaimerAcknowledged).toBe(true);
    expect(INFORMAL_WORKING_NOTE_DISCLAIMER).toMatch(/nie stanowi formalnego dziennika audytowego/i);
    expect(EMPTY_QUESTION_EVIDENCE_MESSAGE).toMatch(
      /Brak dowodów nie oznacza potwierdzenia ani zaprzeczenia/i
    );
  });

  it('bezpiecznie utrwala w localStorage oraz obsługuje błędy QuotaExceededError i uszkodzone dane', () => {
    const entry = createWorkingEvidenceEntry(
      {
        questionId: 'dec-flu-42-age17-vs-18',
        documentId: 'doc-rpl-influvac-49462',
        qrdSection: '4.2',
        pdfPageIndex: 2,
        printedPageNumber: '',
        pageNumberingType: 'pdf_page_index',
        sourceExcerptRef: 'Influvac RPL 49462 pkt 4.2 str. 2 — granica dawkowania.',
        clinicalObservation: 'Ślad roboczy do przeglądu granicy 17 vs 18 lat.',
        relationship: 'does_not_resolve',
        reviewStatus: 'awaiting_human_review'
      },
      checklist,
      sources
    );
    const note = createInformalWorkingNote(
      {
        questionId: 'dec-flu-42-age17-vs-18',
        documentId: null,
        qrdSection: null,
        pdfPageIndex: null,
        noteText: 'Notatka robocza bez strony PDF.',
        disclaimerAcknowledged: true
      },
      checklist,
      sources
    );

    expect(saveWorkingEvidenceToStorage(localStorage, [entry]).success).toBe(true);
    expect(saveWorkingNotesToStorage(localStorage, [note]).success).toBe(true);

    expect(loadWorkingEvidenceFromStorage(localStorage, checklist, sources)).toHaveLength(1);
    expect(loadWorkingNotesFromStorage(localStorage, checklist, sources)).toHaveLength(1);

    // Uszkodzony JSON w localStorage nie powoduje awarii
    localStorage.setItem(EVIDENCE_LEDGER_STORAGE_KEY, '{broken json');
    localStorage.setItem(WORKING_NOTES_STORAGE_KEY, '{"__proto__": {"polluted": true}}');
    expect(loadWorkingEvidenceFromStorage(localStorage, checklist, sources)).toEqual([]);
    expect(loadWorkingNotesFromStorage(localStorage, checklist, sources)).toEqual([]);

    // Symulacja błędu QuotaExceededError
    const quotaStorage = {
      setItem: () => {
        const err = new Error('Storage quota exceeded');
        err.name = 'QuotaExceededError';
        throw err;
      },
      getItem: () => null,
      removeItem: () => undefined,
      clear: () => undefined,
      key: () => null,
      length: 0
    } as Storage;

    const quotaEv = saveWorkingEvidenceToStorage(quotaStorage, [entry]);
    const quotaNote = saveWorkingNotesToStorage(quotaStorage, [note]);
    expect(quotaEv.success).toBe(false);
    expect(quotaEv.error).toMatch(/QuotaExceededError/i);
    expect(quotaNote.success).toBe(false);
    expect(quotaNote.error).toMatch(/QuotaExceededError/i);
  });

  it('eksportuje odrębny schemat JSON oraz odrzuca manipulacje statusem, hashem, URL, __proto__ i mieszaniem backupów', () => {
    const entry = createWorkingEvidenceEntry(
      {
        questionId: 'dec-covid-gtin-vs-ema-sec10',
        documentId: 'doc-ema-spikevax-xfg-pl',
        qrdSection: '10',
        pdfPageIndex: 92,
        printedPageNumber: 'str. 92 pliku EPAR PL',
        pageNumberingType: 'pdf_page_index',
        sourceExcerptRef: 'EPAR PL str. 92 — punkt 10 pozostaje bez wpisanej daty rewizji.',
        clinicalObservation: 'Rozbieżność między pustym pkt 10 a datą na stronie głównej EPAR.',
        relationship: 'missing_information',
        reviewStatus: 'requires_authority_clarification'
      },
      checklist,
      sources
    );
    const note = createInformalWorkingNote(
      {
        questionId: 'dec-covid-gtin-vs-ema-sec10',
        documentId: 'doc-ema-spikevax-xfg-en',
        qrdSection: '10',
        pdfPageIndex: 77,
        noteText: 'Wersja angielska str. 77 wykazuje identyczny brak daty w pkt 10.',
        disclaimerAcknowledged: true
      },
      checklist,
      sources
    );

    const payload = buildEvidenceLedgerExportPayload({
      sources,
      workingEntries: [entry],
      workingNotes: [note]
    });
    expect(payload.vaxnurseEvidenceLedger).toBe(true);
    expect(payload.schemaVersion).toBe(EVIDENCE_LEDGER_SCHEMA_VERSION);
    expect(payload.containsPatientData).toBe(false);
    expect(payload.clinicalApprovalGranted).toBe(false);
    expect(payload.isWorkingDraft).toBe(true);

    // Poprawny podgląd i zastosowanie
    const goodPreview = parseAndPreviewEvidenceLedgerImport(JSON.stringify(payload), {
      sources,
      checklist,
      existingWorkingEntries: [],
      existingWorkingNotes: []
    });
    expect(goodPreview.isValid).toBe(true);
    expect(goodPreview.canImport).toBe(true);
    expect(goodPreview.newEntriesCount).toBe(1);
    expect(goodPreview.newNotesCount).toBe(1);

    const applied = applyPreviewedEvidenceLedgerImport(goodPreview, [], []);
    expect(applied.mergedEntries).toHaveLength(1);
    expect(applied.mergedEntries[0].autoResolved).toBe(false);
    expect(applied.mergedNotes).toHaveLength(1);

    // 1. Odrzucenie pliku głównego backupu aplikacji (vaxnurseBackup)
    const mixedAppBackup = parseAndPreviewEvidenceLedgerImport(
      JSON.stringify({ vaxnurseBackup: true, metadata: {}, vaccines: [] }),
      { sources, checklist, existingWorkingEntries: [], existingWorkingNotes: [] }
    );
    expect(mixedAppBackup.canImport).toBe(false);
    expect(mixedAppBackup.errors[0]).toMatch(/vaxnurseBackup/i);

    // 2. Odrzucenie prototype pollution
    const protoRaw = '{"vaxnurseEvidenceLedger":true,"__proto__":{"admin":true}}';
    const protoPreview = parseAndPreviewEvidenceLedgerImport(protoRaw, {
      sources,
      checklist,
      existingWorkingEntries: [],
      existingWorkingNotes: []
    });
    expect(protoPreview.canImport).toBe(false);
    expect(protoPreview.errors[0]).toMatch(/prototypowe/i);

    // 3. Odrzucenie clinicalApprovalGranted: true i containsPatientData: true
    const tamperedRoot = {
      ...payload,
      clinicalApprovalGranted: true,
      containsPatientData: true
    };
    const rootRes = parseAndPreviewEvidenceLedgerImport(JSON.stringify(tamperedRoot), {
      sources,
      checklist,
      existingWorkingEntries: [],
      existingWorkingNotes: []
    });
    expect(rootRes.canImport).toBe(false);
    expect(rootRes.errors.length).toBeGreaterThanOrEqual(2);

    // 4. Odrzucenie manipulacji wpisu: autoResolved=true, verified_full, zły hash, javascript:, strona > max
    const tamperedEntriesPayload = {
      ...payload,
      entries: [
        { ...entry, evidenceId: 'bad-auto', autoResolved: true },
        { ...entry, evidenceId: 'bad-status', reviewStatus: 'verified_full' },
        { ...entry, evidenceId: 'bad-hash', sourceDocumentHash: '0'.repeat(64) },
        { ...entry, evidenceId: 'bad-url', officialSourceUrl: 'javascript:alert(1)' },
        {
          ...entry,
          evidenceId: 'bad-page',
          location: { ...entry.location, pdfPageIndex: 999 }
        },
        { ...entry, evidenceId: 'dup-id' },
        { ...entry, evidenceId: 'dup-id' }
      ],
      workingNotes: [
        { ...note, noteId: 'bad-note', isInformalWorkingNote: false }
      ]
    };

    const tamperedEntriesRes = parseAndPreviewEvidenceLedgerImport(
      JSON.stringify(tamperedEntriesPayload),
      { sources, checklist, existingWorkingEntries: [], existingWorkingNotes: [] }
    );
    expect(tamperedEntriesRes.canImport).toBe(false);
    expect(tamperedEntriesRes.rejectedItems.length).toBe(7);
  });

  it('filtruje łańcuchy dowodowe po wszystkich kryteriach i wyszukiwaniu pełnotekstowym', () => {
    const filteredQ = filterEvidenceLedgerEntries(baselineEntries, {
      ...DEFAULT_EVIDENCE_FILTERS,
      questionId: 'dec-covid-gtin-vs-ema-sec10'
    });
    expect(filteredQ.length).toBeGreaterThanOrEqual(4);
    expect(filteredQ.every((e) => e.questionId === 'dec-covid-gtin-vs-ema-sec10')).toBe(true);

    const filteredSearch = filterEvidenceLedgerEntries(baselineEntries, {
      ...DEFAULT_EVIDENCE_FILTERS,
      searchQuery: 'GTIN'
    });
    expect(filteredSearch.some((e) => e.questionId === 'dec-covid-gtin-vs-ema-sec10')).toBe(true);

    const emptySearch = filterEvidenceLedgerEntries(baselineEntries, {
      ...DEFAULT_EVIDENCE_FILTERS,
      searchQuery: 'nieistniejaca-fraza-xyz-999'
    });
    expect(emptySearch).toEqual([]);
  });
});
