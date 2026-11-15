import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Download,
  FileCheck2,
  Link2,
  MessageSquarePlus,
  PlusCircle,
  RotateCcw,
  Search,
  ShieldAlert,
  Trash2,
  Upload
} from 'lucide-react';
import type { Stage1HumanDecisionItem } from '../../types/childVaccines';
import type {
  EvidenceLedgerEntry,
  EvidenceLedgerImportPreview,
  EvidenceOrigin,
  EvidenceQualificationClass,
  EvidenceRelationship,
  EvidenceReviewStatus,
  EvidenceTraceabilityFilters,
  InformalWorkingNote,
  PageNumberingType,
  QuestionTraceabilitySummary,
  SourceProductScopeKey,
  SourceRegistryEntry
} from '../../types/evidenceLedger';
import { triggerJsonDownload } from '../../utils/backup';
import {
  ALLOWED_EVIDENCE_QUALIFICATION_CLASSES,
  ALLOWED_EVIDENCE_RELATIONSHIPS,
  ALLOWED_EVIDENCE_REVIEW_STATUSES,
  ALLOWED_PAGE_NUMBERING_TYPES,
  EMPTY_QUESTION_EVIDENCE_MESSAGE,
  INFORMAL_WORKING_NOTE_DISCLAIMER,
  QRD_EXTENDED_SECTION_TITLES,
  applyPreviewedEvidenceLedgerImport,
  buildEvidenceLedgerExportPayload,
  createInformalWorkingNote,
  createWorkingEvidenceEntry,
  filterEvidenceLedgerEntries,
  getProductScopeLabel,
  getQualificationClassPresentation,
  getQuestionWorkStatusLabel,
  getRelationshipPresentation,
  getReviewStatusLabel,
  parseAndPreviewEvidenceLedgerImport,
  validateWorkingEvidenceInput,
  validateWorkingNoteInput
} from '../../utils/chplEvidenceLedger';

interface WorkbenchEvidenceLedgerPanelProps {
  sources: SourceRegistryEntry[];
  checklist: Stage1HumanDecisionItem[];
  baselineEntries: EvidenceLedgerEntry[];
  workingEntries: EvidenceLedgerEntry[];
  workingNotes: InformalWorkingNote[];
  questionSummaries: QuestionTraceabilitySummary[];
  filters: EvidenceTraceabilityFilters;
  onFiltersChange: React.Dispatch<React.SetStateAction<EvidenceTraceabilityFilters>>;
  onSaveWorkingEntries: (nextEntries: EvidenceLedgerEntry[]) => { success: boolean; error: string | null };
  onSaveWorkingNotes: (nextNotes: InformalWorkingNote[]) => { success: boolean; error: string | null };
  onSaveEntriesAndNotesAtomically?: (
    nextEntries: EvidenceLedgerEntry[],
    nextNotes: InformalWorkingNote[]
  ) => { success: boolean; error: string | null };
  onNavigateToSourceDocument?: (documentId: string) => void;
  ledgerSectionRef?: React.RefObject<HTMLElement | null>;
}

const DEFAULT_EVIDENCE_FORM = {
  questionId: 'dec-bcg-42-injection-site',
  documentId: 'doc-rpl-bcg10-19535',
  qrdSection: '4.2',
  pdfPageIndex: '3',
  printedPageNumber: '',
  pageNumberingType: 'pdf_page_index' as PageNumberingType,
  relationship: 'does_not_resolve' as EvidenceRelationship,
  qualificationClass: 'source_excerpt_pending_review' as EvidenceQualificationClass,
  confirmedRealPdfContent: false,
  reviewStatus: 'awaiting_human_review' as EvidenceReviewStatus,
  sourceExcerptRef: '',
  clinicalObservation: ''
};

export const WorkbenchEvidenceLedgerPanel: React.FC<WorkbenchEvidenceLedgerPanelProps> = React.memo(({
  sources,
  checklist,
  baselineEntries,
  workingEntries,
  workingNotes,
  questionSummaries,
  filters,
  onFiltersChange,
  onSaveWorkingEntries,
  onSaveWorkingNotes,
  onSaveEntriesAndNotesAtomically,
  onNavigateToSourceDocument,
  ledgerSectionRef
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [evidenceForm, setEvidenceForm] = useState({
    ...DEFAULT_EVIDENCE_FORM,
    questionId: checklist[0]?.id ?? DEFAULT_EVIDENCE_FORM.questionId
  });
  const [evidenceFormErrors, setEvidenceFormErrors] = useState<string[]>([]);
  const [evidenceFeedback, setEvidenceFeedback] = useState<string | null>(null);

  const [noteQuestionId, setNoteQuestionId] = useState<string>(checklist[0]?.id ?? '');
  const [noteDocumentId, setNoteDocumentId] = useState<string>('');
  const [noteQrdSection, setNoteQrdSection] = useState<string>('');
  const [notePdfPage, setNotePdfPage] = useState<string>('');
  const [noteText, setNoteText] = useState<string>('');
  const [noteDisclaimerAck, setNoteDisclaimerAck] = useState<boolean>(false);
  const [noteFormErrors, setNoteFormErrors] = useState<string[]>([]);

  const [importPreview, setImportPreview] = useState<EvidenceLedgerImportPreview | null>(null);
  const [importBanner, setImportBanner] = useState<{ tone: 'info' | 'danger'; text: string } | null>(null);
  const [showAllChainEntries, setShowAllChainEntries] = useState<boolean>(false);

  const allEntries = useMemo(
    () => [...workingEntries, ...baselineEntries],
    [baselineEntries, workingEntries]
  );

  const filteredEntries = useMemo(
    () => filterEvidenceLedgerEntries(allEntries, filters),
    [allEntries, filters]
  );

  const hasActiveFilter =
    filters.questionId !== 'all' ||
    filters.documentId !== 'all' ||
    filters.productKey !== 'all' ||
    filters.qrdSection !== 'all' ||
    filters.relationship !== 'all' ||
    filters.qualificationClass !== 'all' ||
    filters.reviewStatus !== 'all' ||
    filters.origin !== 'all' ||
    filters.searchQuery.trim() !== '';

  const CHAIN_PREVIEW_LIMIT = 6;
  const visibleChainEntries =
    showAllChainEntries || hasActiveFilter
      ? filteredEntries
      : filteredEntries.slice(0, CHAIN_PREVIEW_LIMIT);

  const selectedQuestionSummary = useMemo(() => {
    if (filters.questionId !== 'all') {
      return questionSummaries.find((s) => s.questionId === filters.questionId) ?? null;
    }
    return questionSummaries[0] ?? null;
  }, [questionSummaries, filters.questionId]);

  const workingEntriesForSelectedQuestion = useMemo(() => {
    if (!selectedQuestionSummary) {
      return [];
    }
    return workingEntries.filter((e) => e.questionId === selectedQuestionSummary.questionId);
  }, [workingEntries, selectedQuestionSummary]);

  const workingNotesForSelectedQuestion = useMemo(() => {
    if (!selectedQuestionSummary) {
      return [];
    }
    return workingNotes.filter((n) => n.questionId === selectedQuestionSummary.questionId);
  }, [workingNotes, selectedQuestionSummary]);

  const availableQrdOptions = useMemo(() => {
    const keys = Array.from(new Set(allEntries.map((e) => e.location.qrdSection)));
    return keys.sort((a, b) => a.localeCompare(b, 'pl', { numeric: true }));
  }, [allEntries]);

  const availableProductKeys = useMemo(() => {
    return Array.from(new Set(sources.map((s) => s.productKey)));
  }, [sources]);

  const handleSelectQuestion = (questionId: string) => {
    onFiltersChange((prev) => ({
      ...prev,
      questionId: prev.questionId === questionId ? 'all' : questionId
    }));
    setEvidenceForm((prev) => ({ ...prev, questionId }));
    setNoteQuestionId(questionId);
  };

  const handleResetFilters = () => {
    onFiltersChange({
      questionId: 'all',
      documentId: 'all',
      productKey: 'all',
      qrdSection: 'all',
      relationship: 'all',
      qualificationClass: 'all',
      reviewStatus: 'all',
      origin: 'all',
      searchQuery: ''
    });
  };

  const handleAddWorkingEvidence = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPage =
      evidenceForm.pdfPageIndex.trim() === '' ? null : Number(evidenceForm.pdfPageIndex.trim());

    const draft = {
      questionId: evidenceForm.questionId,
      documentId: evidenceForm.documentId,
      qrdSection: evidenceForm.qrdSection,
      pdfPageIndex: parsedPage !== null && !Number.isNaN(parsedPage) ? parsedPage : parsedPage === null ? null : -1,
      printedPageNumber: evidenceForm.printedPageNumber,
      pageNumberingType: evidenceForm.pageNumberingType,
      sourceExcerptRef: evidenceForm.sourceExcerptRef,
      clinicalObservation: evidenceForm.clinicalObservation,
      relationship: evidenceForm.relationship,
      qualificationClass: evidenceForm.qualificationClass,
      confirmedRealPdfContent: evidenceForm.confirmedRealPdfContent,
      reviewStatus: evidenceForm.reviewStatus
    };

    const validation = validateWorkingEvidenceInput(draft, checklist, sources);
    if (!validation.valid) {
      setEvidenceFormErrors(validation.errors);
      setEvidenceFeedback(null);
      return;
    }

    const newEntry = createWorkingEvidenceEntry(draft, checklist, sources);
    const next = [newEntry, ...workingEntries];
    const saveResult = onSaveWorkingEntries(next);
    if (!saveResult.success) {
      setEvidenceFormErrors([saveResult.error ?? 'Błąd zapisu lokalnego śladu dowodowego.']);
      return;
    }

    setEvidenceFormErrors([]);
    setEvidenceForm((prev) => ({
      ...prev,
      confirmedRealPdfContent: false,
      sourceExcerptRef: '',
      clinicalObservation: ''
    }));
    setEvidenceFeedback(
      `Dodano lokalny roboczy ślad dowodowy (${newEntry.evidenceId}) w klasie ${newEntry.qualificationClass}. Status pytania nadal wymaga decyzji człowieka (autoResolved: false).`
    );
  };

  const handleDeleteWorkingEvidence = (evidenceId: string) => {
    const next = workingEntries.filter((e) => e.evidenceId !== evidenceId);
    const saveResult = onSaveWorkingEntries(next);
    if (!saveResult.success) {
      setEvidenceFormErrors([saveResult.error ?? 'Błąd podczas usuwania lokalnego wpisu.']);
    }
  };

  const handleAddWorkingNote = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPage = notePdfPage.trim() === '' ? null : Number(notePdfPage.trim());
    const draft = {
      questionId: noteQuestionId,
      documentId: noteDocumentId || null,
      qrdSection: noteQrdSection.trim() || null,
      pdfPageIndex: parsedPage !== null && !Number.isNaN(parsedPage) ? parsedPage : parsedPage === null ? null : -1,
      noteText,
      disclaimerAcknowledged: noteDisclaimerAck
    };

    const validation = validateWorkingNoteInput(draft, checklist, sources);
    if (!validation.valid) {
      setNoteFormErrors(validation.errors);
      return;
    }

    const note = createInformalWorkingNote(draft, checklist, sources);
    const saveResult = onSaveWorkingNotes([note, ...workingNotes]);
    if (!saveResult.success) {
      setNoteFormErrors([saveResult.error ?? 'Błąd zapisu lokalnej notatki roboczej.']);
      return;
    }

    setNoteFormErrors([]);
    setNoteText('');
    setNoteDisclaimerAck(false);
  };

  const handleDeleteWorkingNote = (noteId: string) => {
    const next = workingNotes.filter((n) => n.noteId !== noteId);
    onSaveWorkingNotes(next);
  };

  const handleExportEvidenceLedger = () => {
    const payload = buildEvidenceLedgerExportPayload({
      sources,
      baselineEntries,
      workingEntries,
      workingNotes,
      includeBaselineExtracts: false
    });
    const dateStamp = new Date().toISOString().slice(0, 10);
    triggerJsonDownload(payload, `vaxnurse-rejestr-dowodow-chpl-${dateStamp}.json`);
    setImportBanner({
      tone: 'info',
      text: `Wyeksportowano odrębny rejestr dowodów roboczych Etapu B2 (${workingEntries.length} wpisów dowodowych, ${workingNotes.length} notatek roboczych). Katalog preparatów pozostał nienaruszony.`
    });
  };

  const handleImportFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    try {
      const text = await file.text();
      const preview = parseAndPreviewEvidenceLedgerImport(text, {
        sources,
        checklist,
        existingWorkingEntries: workingEntries,
        existingWorkingNotes: workingNotes
      });
      setImportPreview(preview);
      setImportBanner(null);
    } catch {
      setImportBanner({
        tone: 'danger',
        text: 'Nie udało się odczytać wybranego pliku JSON rejestru dowodów.'
      });
    } finally {
      e.target.value = '';
    }
  };

  const handleConfirmImport = () => {
    if (!importPreview || !importPreview.canImport) {
      return;
    }
    const { mergedEntries, mergedNotes } = applyPreviewedEvidenceLedgerImport(
      importPreview,
      workingEntries,
      workingNotes
    );
    const saveRes = onSaveEntriesAndNotesAtomically
      ? onSaveEntriesAndNotesAtomically(mergedEntries, mergedNotes)
      : (() => {
          const entrySave = onSaveWorkingEntries(mergedEntries);
          if (!entrySave.success) {
            return entrySave;
          }
          return onSaveWorkingNotes(mergedNotes);
        })();
    if (!saveRes.success) {
      setImportBanner({
        tone: 'danger',
        text: saveRes.error ?? 'Błąd zapisu zaimportowanych dowodów w localStorage.'
      });
      return;
    }

    setImportPreview(null);
    const claimsNote =
      importPreview.importedVerificationClaimsCount > 0
        ? ` Deklaracje weryfikacji z JSON (${importPreview.importedVerificationClaimsCount}) oznaczono jako niepotwierdzone lokalnie.`
        : '';
    setImportBanner({
      tone: 'info',
      text: `Zaimportowano rejestr dowodów (nowe/zaktualizowane wpisy: ${importPreview.newEntriesCount + importPreview.updatedEntriesCount}, notatki: ${importPreview.newNotesCount + importPreview.updatedNotesCount}).${claimsNote} Katalog preparatów, blokada Infanrix hexa oraz autoResolved: false pozostały niezmienione.`
    });
  };

  return (
    <section
      ref={ledgerSectionRef as React.RefObject<HTMLElement>}
      className="wb-details-section wb-b2-panel"
      aria-labelledby="wb-evidence-ledger-heading"
      data-testid="b2-evidence-ledger-panel"
    >
      <div className="wb-section-heading-row">
        <div>
          <h2 id="wb-evidence-ledger-heading" className="wb-section-heading">
            Sekcja F — Łańcuch identyfikowalności dowodów (Pytanie → Dokument → QRD → Strona PDF → Dowód)
          </h2>
          <p className="wb-section-subheading">
            Każde z 8 otwartych pytań audytowych zachowuje <code>autoResolved: false</code>. Żaden wyciąg ani
            lokalna notatka robocza nie zamyka pytania klinicznego ani nie awansuje statusu produktu.
          </p>
        </div>
        <div className="wb-b2-counters">
          <span className="wb-b2-stat-chip wb-b2-chip-neutral">
            <span>Ślady bazowe Etapu I: {baselineEntries.length}</span>
          </span>
          <span className="wb-b2-stat-chip wb-b2-chip-info">
            <span>Robocze wpisy audytora: {workingEntries.length}</span>
          </span>
          <span className="wb-b2-stat-chip wb-b2-chip-warning">
            <span>Notatki robocze: {workingNotes.length}</span>
          </span>
        </div>
      </div>

      {/* Pasek 8 pytań z podsumowaniem śladów dowodowych */}
      <div className="wb-b2-question-strip" role="region" aria-label="Postęp zbierania dowodów dla 8 pytań audytowych">
        {questionSummaries.map((q) => {
          const isSelected = filters.questionId === q.questionId;
          return (
            <button
              key={q.questionId}
              type="button"
              className={`wb-b2-question-pill ${isSelected ? 'active' : ''}`}
              aria-pressed={isSelected}
              onClick={() => handleSelectQuestion(q.questionId)}
            >
              <div className="wb-b2-qpill-top">
                <code className="wb-b2-qpill-id">{q.questionId}</code>
                <span className="wb-b2-qpill-qrd">QRD {q.chplSectionOrSubpoint}</span>
              </div>
              <span className="wb-b2-qpill-status">{getQuestionWorkStatusLabel(q.workStatus)}</span>
              <span className="wb-b2-qpill-counts">
                Wyciągi Etapu I: {q.bundleExtractCount} · Robocze dowody: {q.workingEvidenceCount} · Notatki:{' '}
                {q.workingNotesCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* Szczegóły wybranego pytania i jasny komunikat pustych dowodów roboczych (Sekcja 10.5) */}
      {selectedQuestionSummary && (
        <div
          className="wb-b2-selected-question-box"
          data-testid="selected-question-evidence-box"
        >
          <div className="wb-b2-sq-header">
            <div>
              <span className="wb-b2-sq-label">Wybrane pytanie audytowe</span>
              <h3 className="wb-b2-sq-title">
                <code>{selectedQuestionSummary.questionId}</code> — {selectedQuestionSummary.clinicalQuestion}
              </h3>
            </div>
            <span className="wb-badge wb-badge-readonly">
              autoResolved: <code>false</code>
            </span>
          </div>
          <p className="wb-b2-sq-ambiguity">{selectedQuestionSummary.ambiguitySummary}</p>

          <div className="wb-b2-auditor-evidence-slot">
            <strong>
              Przypisane dowody robocze audytora dla tego pytania ({workingEntriesForSelectedQuestion.length}):
            </strong>
            {workingEntriesForSelectedQuestion.length === 0 ? (
              <p className="wb-b2-empty-evidence-notice" role="status">
                <AlertTriangle size={16} aria-hidden="true" />
                <span>{EMPTY_QUESTION_EVIDENCE_MESSAGE}</span>
              </p>
            ) : (
              <ul className="wb-b2-sq-working-list">
                {workingEntriesForSelectedQuestion.map((item) => (
                  <li key={item.evidenceId}>
                    <code>{item.documentId}</code> · {item.location.qrdSectionTitle} (
                    {item.location.pdfPageRangeLabel}) — {item.sourceExcerptRef}
                  </li>
                ))}
              </ul>
            )}

            {workingNotesForSelectedQuestion.length > 0 && (
              <div className="wb-b2-sq-notes-list">
                <strong>Nieformalne notatki robocze ({workingNotesForSelectedQuestion.length}):</strong>
                <ul>
                  {workingNotesForSelectedQuestion.map((note) => (
                    <li key={note.noteId} className="wb-b2-note-item">
                      <div>
                        <span className="wb-b2-note-badge">Notatka lokalna (robocza)</span>{' '}
                        {note.documentId ? <code>{note.documentId}</code> : null}{' '}
                        {note.qrdSection ? <span>QRD {note.qrdSection}</span> : null}{' '}
                        {note.pdfPageIndex ? <span>PDF str. {note.pdfPageIndex}</span> : null}
                        <p>{note.noteText}</p>
                        <small>{INFORMAL_WORKING_NOTE_DISCLAIMER}</small>
                      </div>
                      <button
                        type="button"
                        className="wb-action-btn wb-action-btn-secondary"
                        aria-label={`Usuń notatkę roboczą ${note.noteId}`}
                        onClick={() => handleDeleteWorkingNote(note.noteId)}
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Wielokryterialne filtry łańcucha dowodów */}
      <div className="wb-b2-ledger-filters" role="region" aria-label="Filtry rejestru dowodów">
        <div className="wb-b2-filter-grid">
          <div className="wb-filter-group">
            <label htmlFor="b2-ev-search" className="wb-filter-label">
              Szukaj (pytanie, QRD, cytat, strona PDF, uwaga)
            </label>
            <div className="wb-search-input-wrap">
              <Search size={15} className="wb-search-icon" aria-hidden="true" />
              <input
                id="b2-ev-search"
                type="text"
                className="wb-search-input"
                value={filters.searchQuery}
                onChange={(e) =>
                  onFiltersChange((prev) => ({ ...prev, searchQuery: e.target.value }))
                }
                placeholder="Np. 4.2, GTIN, Strona 67, fenyloalanina..."
              />
            </div>
          </div>

          <div className="wb-filter-group">
            <label htmlFor="b2-ev-question" className="wb-filter-label">
              Pytanie audytowe
            </label>
            <select
              id="b2-ev-question"
              className="wb-select-input"
              value={filters.questionId}
              onChange={(e) =>
                onFiltersChange((prev) => ({ ...prev, questionId: e.target.value }))
              }
            >
              <option value="all">Wszystkie 8 pytań ({checklist.length})</option>
              {checklist.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.id} (pkt {q.chplSectionOrSubpoint})
                </option>
              ))}
            </select>
          </div>

          <div className="wb-filter-group">
            <label htmlFor="b2-ev-doc" className="wb-filter-label">
              Dokument źródłowy
            </label>
            <select
              id="b2-ev-doc"
              className="wb-select-input"
              value={filters.documentId}
              onChange={(e) =>
                onFiltersChange((prev) => ({ ...prev, documentId: e.target.value }))
              }
            >
              <option value="all">Wszystkie dokumenty ({sources.length})</option>
              {sources.map((s) => (
                <option key={s.documentId} value={s.documentId}>
                  {s.documentTitle}
                </option>
              ))}
            </select>
          </div>

          <div className="wb-filter-group">
            <label htmlFor="b2-ev-product" className="wb-filter-label">
              Preparat / zakres
            </label>
            <select
              id="b2-ev-product"
              className="wb-select-input"
              value={filters.productKey}
              onChange={(e) =>
                onFiltersChange((prev) => ({
                  ...prev,
                  productKey: e.target.value as SourceProductScopeKey | 'all'
                }))
              }
            >
              <option value="all">Wszystkie preparaty</option>
              {availableProductKeys.map((pk) => (
                <option key={pk} value={pk}>
                  {getProductScopeLabel(pk)}
                </option>
              ))}
            </select>
          </div>

          <div className="wb-filter-group">
            <label htmlFor="b2-ev-qrd" className="wb-filter-label">
              Punkt QRD
            </label>
            <select
              id="b2-ev-qrd"
              className="wb-select-input"
              value={filters.qrdSection}
              onChange={(e) =>
                onFiltersChange((prev) => ({ ...prev, qrdSection: e.target.value }))
              }
            >
              <option value="all">Wszystkie punkty QRD</option>
              {availableQrdOptions.map((sec) => (
                <option key={sec} value={sec}>
                  {QRD_EXTENDED_SECTION_TITLES[sec] ?? `QRD ${sec}`}
                </option>
              ))}
            </select>
          </div>

          <div className="wb-filter-group">
            <label htmlFor="b2-ev-rel" className="wb-filter-label">
              Relacja dowodu do pytania
            </label>
            <select
              id="b2-ev-rel"
              className="wb-select-input"
              value={filters.relationship}
              onChange={(e) =>
                onFiltersChange((prev) => ({
                  ...prev,
                  relationship: e.target.value as EvidenceRelationship | 'all'
                }))
              }
            >
              <option value="all">Wszystkie relacje</option>
              {ALLOWED_EVIDENCE_RELATIONSHIPS.map((r) => (
                <option key={r} value={r}>
                  {getRelationshipPresentation(r).label}
                </option>
              ))}
            </select>
          </div>

          <div className="wb-filter-group">
            <label htmlFor="b3-ev-qual" className="wb-filter-label">
              Klasa kwalifikacji (Etap B3)
            </label>
            <select
              id="b3-ev-qual"
              className="wb-select-input"
              value={filters.qualificationClass ?? 'all'}
              onChange={(e) =>
                onFiltersChange((prev) => ({
                  ...prev,
                  qualificationClass: e.target.value as EvidenceQualificationClass | 'all'
                }))
              }
            >
              <option value="all">Wszystkie klasy kwalifikacji</option>
              {ALLOWED_EVIDENCE_QUALIFICATION_CLASSES.map((qc) => (
                <option key={qc} value={qc}>
                  {getQualificationClassPresentation(qc).badgeText}
                </option>
              ))}
            </select>
          </div>

          <div className="wb-filter-group">
            <label htmlFor="b2-ev-status" className="wb-filter-label">
              Status przeglądu dowodu
            </label>
            <select
              id="b2-ev-status"
              className="wb-select-input"
              value={filters.reviewStatus}
              onChange={(e) =>
                onFiltersChange((prev) => ({
                  ...prev,
                  reviewStatus: e.target.value as EvidenceReviewStatus | 'all'
                }))
              }
            >
              <option value="all">Wszystkie statusy przeglądu</option>
              {ALLOWED_EVIDENCE_REVIEW_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {getReviewStatusLabel(st)}
                </option>
              ))}
            </select>
          </div>

          <div className="wb-filter-group">
            <label htmlFor="b2-ev-origin" className="wb-filter-label">
              Pochodzenie wpisu
            </label>
            <select
              id="b2-ev-origin"
              className="wb-select-input"
              value={filters.origin}
              onChange={(e) =>
                onFiltersChange((prev) => ({
                  ...prev,
                  origin: e.target.value as EvidenceOrigin | 'all'
                }))
              }
            >
              <option value="all">Wszystkie ({allEntries.length})</option>
              <option value="bundle_extract">Ekstrakcja Etapu I ({baselineEntries.length})</option>
              <option value="auditor_working_entry">Wpisy robocze audytora ({workingEntries.length})</option>
            </select>
          </div>
        </div>

        <div className="wb-b2-filter-footer">
          <span className="wb-b2-match-count">
            Widoczne ogniwa łańcucha dowodowego: <strong>{filteredEntries.length}</strong> z {allEntries.length}
          </span>
          <button
            type="button"
            className="wb-action-btn wb-action-btn-secondary"
            onClick={handleResetFilters}
          >
            <RotateCcw size={14} aria-hidden="true" />
            <span>Resetuj filtry dowodów</span>
          </button>
        </div>
      </div>

      {/* Lista ogniw łańcucha dowodowego */}
      {filteredEntries.length === 0 ? (
        <div className="wb-empty-state" data-testid="b2-empty-evidence-state">
          <ShieldAlert size={22} aria-hidden="true" />
          <p className="wb-muted-text">{EMPTY_QUESTION_EVIDENCE_MESSAGE}</p>
          <p className="wb-muted-text">
            Dla bieżącego zestawu filtrów brak zapisanych wpisów spełniających wybrane kryteria.
          </p>
          <button type="button" className="wb-action-btn" onClick={handleResetFilters}>
            Pokaż wszystkie ślady dowodowe
          </button>
        </div>
      ) : (
        <div className="wb-b2-chain-list" data-testid="b2-evidence-chain-list">
          {visibleChainEntries.map((entry) => {
            const relInfo = getRelationshipPresentation(entry.relationship);
            const qualInfo = getQualificationClassPresentation(entry.qualificationClass);
            const isImportedUnconfirmed =
              entry.importProvenance?.isImported &&
              entry.importProvenance.localConfirmationState === 'unconfirmed_imported_claim';
            return (
              <article
                key={entry.evidenceId}
                className={`wb-b2-chain-card ${entry.origin === 'auditor_working_entry' ? 'is-working' : ''}`}
                data-testid={`evidence-chain-${entry.evidenceId}`}
                data-qualification-class={entry.qualificationClass}
              >
                <div className="wb-b2-chain-breadcrumb" role="group" aria-label="Ścieżka identyfikowalności dowodu">
                  <span className="wb-b2-chain-node">
                    <strong>Pytanie:</strong> <code>{entry.questionId}</code>
                  </span>
                  <span className="wb-b2-chain-sep" aria-hidden="true">
                    <ArrowRight size={14} aria-hidden="true" />
                  </span>
                  <span className="wb-b2-chain-node">
                    <strong>Dokument:</strong> <code>{entry.documentId}</code>
                  </span>
                  <span className="wb-b2-chain-sep" aria-hidden="true">
                    <ArrowRight size={14} aria-hidden="true" />
                  </span>
                  <span className="wb-b2-chain-node">
                    <strong>QRD:</strong> {entry.location.qrdSectionTitle}
                  </span>
                  <span className="wb-b2-chain-sep" aria-hidden="true">
                    <ArrowRight size={14} aria-hidden="true" />
                  </span>
                  <span className="wb-b2-chain-node">
                    <strong>Strona PDF:</strong> {entry.location.pdfPageRangeLabel}
                  </span>
                </div>

                <div className="wb-b2-chain-badges">
                  <span
                    className={`wb-b3-qual-pill qual-${qualInfo.tone}`}
                    title={qualInfo.label}
                  >
                    {entry.qualificationClass === 'source_excerpt_reviewed' ? (
                      <CheckCircle2 size={13} aria-hidden="true" />
                    ) : entry.qualificationClass === 'conflicting_source_excerpt' ||
                      entry.qualificationClass === 'conflicting_reference' ||
                      entry.qualificationClass === 'unavailable_source_reference' ? (
                      <AlertTriangle size={13} aria-hidden="true" />
                    ) : (
                      <ShieldAlert size={13} aria-hidden="true" />
                    )}
                    <span>Kwalifikacja: {qualInfo.badgeText}</span>
                  </span>
                  <span className={`wb-b2-status-pill tone-${relInfo.tone}`}>{relInfo.label}</span>
                  <span className="wb-b2-review-pill">{getReviewStatusLabel(entry.reviewStatus)}</span>
                  <span className="wb-badge wb-badge-readonly">autoResolved: false</span>
                  <span className="wb-b2-origin-pill">
                    {entry.origin === 'bundle_extract'
                      ? 'Odniesienie bazowe Etapu I (read-only)'
                      : 'Roboczy wpis lokalny audytora'}
                  </span>
                  {entry.reviewedInLocalPdfSession && (
                    <span className="wb-b4-session-evidence-pill">
                      Sprawdzono w sesji PDF (B4){entry.artifactId ? ` · ${entry.artifactId}` : ''}
                    </span>
                  )}
                  {entry.requiresReverification && (
                    <span className="wb-b3-reverify-pill">Wymaga kontroli w oryginalnym PDF</span>
                  )}
                  {isImportedUnconfirmed && (
                    <span className="wb-b3-imported-claim-pill">
                      Z importu JSON (niepotwierdzone lokalnie)
                    </span>
                  )}
                </div>

                <div className="wb-b2-chain-body">
                  <p className="wb-b2-excerpt">
                    <strong>Odniesienie źródłowe / fragment:</strong> {entry.sourceExcerptRef}
                  </p>
                  <p className="wb-b2-observation">
                    <strong>Obserwacja techniczna / kontekst:</strong> {entry.clinicalObservation}
                  </p>
                </div>

                <div className="wb-b2-chain-meta">
                  <span>
                    <strong>Numeracja stron:</strong>{' '}
                    {entry.location.pdfPageIndex !== null
                      ? `Indeks PDF: str. ${entry.location.pdfPageIndex}${
                          entry.location.physicalDocumentPageCount
                            ? ` z ${entry.location.physicalDocumentPageCount}`
                            : ''
                        }`
                      : 'Brak potwierdzonego indeksu PDF'}{' '}
                    | {entry.location.printedPageNumber ?? 'Numer drukowany niepotwierdzony'}
                  </span>
                  <span>
                    <strong>Skrót SHA-256 dokumentu:</strong>{' '}
                    {entry.sourceDocumentHash ? (
                      <code>{entry.sourceDocumentHash.slice(0, 16)}…</code>
                    ) : (
                      'Brak zapisanego skrótu (niezweryfikowano binarnie)'
                    )}{' '}
                    (<code>{entry.sha256Basis}</code>)
                  </span>
                  <span>
                    <strong>Zapis:</strong> {entry.recordedAt} · {entry.recordedBy}
                  </span>
                </div>

                {(entry.origin === 'auditor_working_entry' || onNavigateToSourceDocument) && (
                  <div className="wb-b2-chain-actions">
                    {onNavigateToSourceDocument && (
                      <button
                        type="button"
                        className="wb-action-btn wb-action-btn-secondary"
                        onClick={() => onNavigateToSourceDocument(entry.documentId)}
                      >
                        <Search size={14} aria-hidden="true" />
                        <span>Pokaż dokument w Rejestrze Źródeł</span>
                      </button>
                    )}
                    {entry.origin === 'auditor_working_entry' && (
                      <button
                        type="button"
                        className="wb-action-btn wb-action-btn-secondary"
                        onClick={() => handleDeleteWorkingEvidence(entry.evidenceId)}
                      >
                        <Trash2 size={14} aria-hidden="true" />
                        <span>Usuń lokalny wpis dowodowy</span>
                      </button>
                    )}
                  </div>
                )}
              </article>
            );
          })}
          {!hasActiveFilter && filteredEntries.length > CHAIN_PREVIEW_LIMIT && (
            <div className="wb-b2-show-more-wrap">
              <button
                type="button"
                className="wb-action-btn wb-action-btn-secondary"
                onClick={() => setShowAllChainEntries((prev) => !prev)}
              >
                {showAllChainEntries
                  ? `Zwiń listę do pierwszych ${CHAIN_PREVIEW_LIMIT} ogniw`
                  : `Pokaż wszystkie ogniwa dowodowe (${filteredEntries.length})`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Formularze lokalne + Dedykowany Eksport/Import JSON Etapu B2 */}
      <div className="wb-b2-workforms-grid">
        {/* Formularz 1: Roboczy ślad dowodowy */}
        <form
          className="wb-b2-work-card"
          onSubmit={handleAddWorkingEvidence}
          data-testid="b2-add-evidence-form"
        >
          <h3 className="wb-b2-card-title">
            <PlusCircle size={16} aria-hidden="true" />
            <span>Dodaj roboczy ślad dowodowy (lokalnie)</span>
          </h3>
          <p className="wb-b2-card-hint">
            Wpisy zapisywane są wyłącznie lokalnie w Twojej przeglądarce i nigdy nie zmieniają statusu{' '}
            <code>VACCINES_CATALOG</code> ani blokady <code>vac-infanrix-hexa</code>.
          </p>

          <div className="wb-b2-form-row">
            <label htmlFor="ev-form-question">Pytanie audytowe</label>
            <select
              id="ev-form-question"
              className="wb-select-input"
              value={evidenceForm.questionId}
              onChange={(e) => setEvidenceForm((p) => ({ ...p, questionId: e.target.value }))}
            >
              {checklist.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.id} (pkt {q.chplSectionOrSubpoint})
                </option>
              ))}
            </select>
          </div>

          <div className="wb-b2-form-row">
            <label htmlFor="ev-form-document">Dokument z Rejestru Źródeł</label>
            <select
              id="ev-form-document"
              className="wb-select-input"
              value={evidenceForm.documentId}
              onChange={(e) => setEvidenceForm((p) => ({ ...p, documentId: e.target.value }))}
            >
              {sources.map((s) => (
                <option key={s.documentId} value={s.documentId}>
                  {s.documentTitle}
                </option>
              ))}
            </select>
          </div>

          <div className="wb-b2-form-two-col">
            <div className="wb-b2-form-row">
              <label htmlFor="ev-form-qrd">Punkt QRD (np. 4.2, 6.4, 10)</label>
              <input
                id="ev-form-qrd"
                type="text"
                className="wb-search-input"
                value={evidenceForm.qrdSection}
                onChange={(e) => setEvidenceForm((p) => ({ ...p, qrdSection: e.target.value }))}
              />
            </div>
            <div className="wb-b2-form-row">
              <label htmlFor="ev-form-page">Indeks strony PDF (liczba)</label>
              <input
                id="ev-form-page"
                type="number"
                min={1}
                className="wb-search-input"
                value={evidenceForm.pdfPageIndex}
                onChange={(e) => setEvidenceForm((p) => ({ ...p, pdfPageIndex: e.target.value }))}
              />
            </div>
          </div>

          <div className="wb-b2-form-two-col">
            <div className="wb-b2-form-row">
              <label htmlFor="ev-form-page-type">Typ numeracji strony</label>
              <select
                id="ev-form-page-type"
                className="wb-select-input"
                value={evidenceForm.pageNumberingType}
                onChange={(e) =>
                  setEvidenceForm((p) => ({
                    ...p,
                    pageNumberingType: e.target.value as PageNumberingType
                  }))
                }
              >
                {ALLOWED_PAGE_NUMBERING_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="wb-b2-form-row">
              <label htmlFor="ev-form-printed-page">Numer strony drukowanej (opcjonalnie)</label>
              <input
                id="ev-form-printed-page"
                type="text"
                className="wb-search-input"
                value={evidenceForm.printedPageNumber}
                onChange={(e) =>
                  setEvidenceForm((p) => ({ ...p, printedPageNumber: e.target.value }))
                }
                placeholder="Np. str. drukowana 4 (Aneks I)"
              />
            </div>
          </div>

          <div className="wb-b2-form-two-col">
            <div className="wb-b2-form-row">
              <label htmlFor="ev-form-rel">Relacja względem pytania</label>
              <select
                id="ev-form-rel"
                className="wb-select-input"
                value={evidenceForm.relationship}
                onChange={(e) =>
                  setEvidenceForm((p) => ({
                    ...p,
                    relationship: e.target.value as EvidenceRelationship
                  }))
                }
              >
                {ALLOWED_EVIDENCE_RELATIONSHIPS.map((r) => (
                  <option key={r} value={r}>
                    {getRelationshipPresentation(r).label}
                  </option>
                ))}
              </select>
            </div>
            <div className="wb-b2-form-row">
              <label htmlFor="ev-form-status">Status roboczy dowodu</label>
              <select
                id="ev-form-status"
                className="wb-select-input"
                value={evidenceForm.reviewStatus}
                onChange={(e) =>
                  setEvidenceForm((p) => ({
                    ...p,
                    reviewStatus: e.target.value as EvidenceReviewStatus
                  }))
                }
              >
                {ALLOWED_EVIDENCE_REVIEW_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {getReviewStatusLabel(st)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="wb-b2-form-row">
            <label htmlFor="ev-form-qualification">Klasa kwalifikacji dowodu (Etap B3)</label>
            <select
              id="ev-form-qualification"
              className="wb-select-input"
              value={evidenceForm.qualificationClass}
              onChange={(e) =>
                setEvidenceForm((p) => ({
                  ...p,
                  qualificationClass: e.target.value as EvidenceQualificationClass
                }))
              }
            >
              {ALLOWED_EVIDENCE_QUALIFICATION_CLASSES.map((qc) => (
                <option key={qc} value={qc}>
                  {getQualificationClassPresentation(qc).badgeText} ({qc})
                </option>
              ))}
            </select>
          </div>

          {(evidenceForm.qualificationClass === 'source_excerpt_reviewed' ||
            evidenceForm.qualificationClass === 'conflicting_source_excerpt') && (
            <div className="wb-b2-form-row">
              <label className="wb-b2-checkbox-label">
                <input
                  id="ev-form-confirm-pdf"
                  type="checkbox"
                  checked={evidenceForm.confirmedRealPdfContent}
                  onChange={(e) =>
                    setEvidenceForm((p) => ({
                      ...p,
                      confirmedRealPdfContent: e.target.checked
                    }))
                  }
                />
                <span>
                  Potwierdzam ręczne sprawdzenie przytoczonego fragmentu w rzeczywistym dokumencie PDF (nie zamyka pytania klinicznego ani karty ChPL).
                </span>
              </label>
            </div>
          )}

          <div className="wb-b2-form-row">
            <label htmlFor="ev-form-excerpt">
              Krótki fragment / odniesienie źródłowe (5–500 znaków)
            </label>
            <textarea
              id="ev-form-excerpt"
              rows={2}
              className="wb-textarea-input"
              value={evidenceForm.sourceExcerptRef}
              onChange={(e) =>
                setEvidenceForm((p) => ({ ...p, sourceExcerptRef: e.target.value }))
              }
              placeholder="Wpisz krótki weryfikowalny cytat lub numer akapitu w dokumencie ChPL..."
            />
          </div>

          <div className="wb-b2-form-row">
            <label htmlFor="ev-form-observation">Obserwacja robocza audytora (5–1500 znaków)</label>
            <textarea
              id="ev-form-observation"
              rows={2}
              className="wb-textarea-input"
              value={evidenceForm.clinicalObservation}
              onChange={(e) =>
                setEvidenceForm((p) => ({ ...p, clinicalObservation: e.target.value }))
              }
              placeholder="Opisz, jak odniesienie wyjaśnia lub pozostawia otwarte dane pytanie..."
            />
          </div>

          {evidenceFormErrors.length > 0 && (
            <div className="wb-b2-alert wb-b2-alert-danger" role="alert">
              {evidenceFormErrors.map((err) => (
                <p key={err}>{err}</p>
              ))}
            </div>
          )}

          {evidenceFeedback && (
            <div className="wb-b2-alert wb-b2-alert-info" role="status">
              <CheckCircle2 size={15} aria-hidden="true" />
              <span>{evidenceFeedback}</span>
            </div>
          )}

          <button type="submit" className="wb-action-btn">
            <Link2 size={14} aria-hidden="true" />
            <span>Zapisz roboczy ślad dowodowy</span>
          </button>
        </form>

        {/* Formularz 2: Nieformalna lokalna notatka robocza + Eksport/Import JSON */}
        <div className="wb-b2-right-stack">
          <form
            className="wb-b2-work-card"
            onSubmit={handleAddWorkingNote}
            data-testid="b2-working-note-form"
          >
            <h3 className="wb-b2-card-title">
              <MessageSquarePlus size={16} aria-hidden="true" />
              <span>Dodaj lokalną notatkę roboczą</span>
            </h3>
            <p className="wb-b2-disclaimer-banner" role="note">
              <ShieldAlert size={15} aria-hidden="true" />
              <span>{INFORMAL_WORKING_NOTE_DISCLAIMER}</span>
            </p>

            <div className="wb-b2-form-row">
              <label htmlFor="note-form-question">Powiązane pytanie audytowe</label>
              <select
                id="note-form-question"
                className="wb-select-input"
                value={noteQuestionId}
                onChange={(e) => setNoteQuestionId(e.target.value)}
              >
                {checklist.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.id} (pkt {q.chplSectionOrSubpoint})
                  </option>
                ))}
              </select>
            </div>

            <div className="wb-b2-form-three-col">
              <div className="wb-b2-form-row">
                <label htmlFor="note-form-doc">Dokument (opcjonalnie)</label>
                <select
                  id="note-form-doc"
                  className="wb-select-input"
                  value={noteDocumentId}
                  onChange={(e) => setNoteDocumentId(e.target.value)}
                >
                  <option value="">Bez przypisanego dokumentu</option>
                  {sources.map((s) => (
                    <option key={s.documentId} value={s.documentId}>
                      {s.documentId}
                    </option>
                  ))}
                </select>
              </div>
              <div className="wb-b2-form-row">
                <label htmlFor="note-form-qrd">QRD (opcjonalnie)</label>
                <input
                  id="note-form-qrd"
                  type="text"
                  className="wb-search-input"
                  value={noteQrdSection}
                  onChange={(e) => setNoteQrdSection(e.target.value)}
                  placeholder="np. 4.2"
                />
              </div>
              <div className="wb-b2-form-row">
                <label htmlFor="note-form-page">Strona PDF (opcjonalnie)</label>
                <input
                  id="note-form-page"
                  type="number"
                  min={1}
                  className="wb-search-input"
                  value={notePdfPage}
                  onChange={(e) => setNotePdfPage(e.target.value)}
                />
              </div>
            </div>

            <div className="wb-b2-form-row">
              <label htmlFor="note-form-text">Treść roboczej notatki lokalnej</label>
              <textarea
                id="note-form-text"
                rows={2}
                className="wb-textarea-input"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Wpisz roboczą obserwację do dalszej weryfikacji przez zespół..."
              />
            </div>

            <label className="wb-b2-checkbox-label">
              <input
                type="checkbox"
                checked={noteDisclaimerAck}
                onChange={(e) => setNoteDisclaimerAck(e.target.checked)}
              />
              <span>
                Potwierdzam, że wpis ma wyłącznie charakter nieformalnej lokalnej notatki roboczej.
              </span>
            </label>

            {noteFormErrors.length > 0 && (
              <div className="wb-b2-alert wb-b2-alert-danger" role="alert">
                {noteFormErrors.map((err) => (
                  <p key={err}>{err}</p>
                ))}
              </div>
            )}

            <button type="submit" className="wb-action-btn">
              <MessageSquarePlus size={14} aria-hidden="true" />
              <span>Zapisz lokalną notatkę roboczą</span>
            </button>
          </form>

          {/* Dedykowany moduł Eksportu / Importu JSON Rejestru Dowodów Etapu B2 */}
          <div className="wb-b2-work-card" data-testid="b2-evidence-import-export">
            <h3 className="wb-b2-card-title">
              <FileCheck2 size={16} aria-hidden="true" />
              <span>Eksport / Import Rejestru Dowodów JSON (odrębny schemat Etapu B2)</span>
            </h3>
            <p className="wb-b2-card-hint">
              Ten eksport i import obsługuje wyłącznie rejestr dowodów (<code>vaxnurseEvidenceLedger</code>) oraz
              notatki robocze — jest odizolowany od kopii bezpieczeństwa katalogu preparatów (
              <code>vaxnurseBackup</code>).
            </p>

            <div className="wb-b2-io-buttons">
              <button
                type="button"
                className="wb-action-btn"
                onClick={handleExportEvidenceLedger}
              >
                <Download size={14} aria-hidden="true" />
                <span>Eksportuj rejestr dowodów JSON</span>
              </button>

              <button
                type="button"
                className="wb-action-btn wb-action-btn-secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={14} aria-hidden="true" />
                <span>Wczytaj plik rejestru dowodów JSON</span>
              </button>
              <input
                ref={fileInputRef}
                id="b2-evidence-import-input"
                data-testid="b2-evidence-import-input"
                type="file"
                accept=".json,application/json"
                aria-label="Wczytaj plik rejestru dowodów JSON"
                style={{ display: 'none' }}
                onChange={handleImportFileSelected}
              />
            </div>

            {importBanner && (
              <div
                className={`wb-b2-alert ${
                  importBanner.tone === 'danger' ? 'wb-b2-alert-danger' : 'wb-b2-alert-info'
                }`}
                role="status"
              >
                <span>{importBanner.text}</span>
              </div>
            )}

            {importPreview && (
              <div className="wb-b2-import-preview" data-testid="b2-import-preview-card">
                <h4>Podgląd importu rejestru dowodów przed zastosowaniem</h4>
                <ul>
                  <li>
                    Schemat: <code>{importPreview.payloadMetadata.schemaVersion ?? 'brak'}</code> · Eksport:{' '}
                    <code>{importPreview.payloadMetadata.exportedAt ?? 'brak'}</code>
                  </li>
                  <li>
                    Nowe / zaktualizowane dowody robocze:{' '}
                    <strong>
                      {importPreview.newEntriesCount} nowych, {importPreview.updatedEntriesCount}{' '}
                      aktualizacji
                    </strong>{' '}
                    (duplikaty pominięte: {importPreview.skippedDuplicatesCount})
                  </li>
                  <li>
                    Notatki robocze:{' '}
                    <strong>
                      {importPreview.newNotesCount} nowych, {importPreview.updatedNotesCount} aktualizacji
                    </strong>
                  </li>
                  <li>
                    Wymagające ręcznej weryfikacji lokalnej:{' '}
                    <strong>{importPreview.requiresManualReviewCount}</strong> · Deklaracje weryfikacji pochodzące z importu JSON:{' '}
                    <strong>{importPreview.importedVerificationClaimsCount}</strong>
                  </li>
                  <li>
                    Konflikty i niezgodności: <strong>{importPreview.conflictsCount}</strong> · Brakujące pliki PDF w repo:{' '}
                    <strong>{importPreview.missingDocumentsCount}</strong> · Nieznane ID źródeł:{' '}
                    <strong>{importPreview.unknownSourceIds.length}</strong>
                    {importPreview.unknownSourceIds.length > 0 && (
                      <span> (<code>{importPreview.unknownSourceIds.join(', ')}</code>)</span>
                    )}
                  </li>
                </ul>

                {importPreview.conflicts.length > 0 && (
                  <div className="wb-b2-alert wb-b2-alert-warning" role="status">
                    <strong>Wykryte konflikty importu ({importPreview.conflicts.length}):</strong>
                    <ul>
                      {importPreview.conflicts.map((conf) => (
                        <li key={`${conf.kind}-${conf.id}`}>
                          <code>{conf.id}</code> [{conf.kind}]: {conf.details}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {importPreview.errors.length > 0 && (
                  <div className="wb-b2-alert wb-b2-alert-danger" role="alert">
                    <strong>Błędy bezpieczeństwa lub walidacji ({importPreview.errors.length}):</strong>
                    {importPreview.errors.map((err) => (
                      <p key={err}>{err}</p>
                    ))}
                    {importPreview.rejectedItems.length > 0 && (
                      <ul>
                        {importPreview.rejectedItems.map((rej) => (
                          <li key={`${rej.kind}-${rej.id}`}>
                            <code>{rej.id}</code>: {rej.reason}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {importPreview.warnings.length > 0 && (
                  <div className="wb-b2-alert wb-b2-alert-info">
                    {importPreview.warnings.map((w) => (
                      <p key={w}>{w}</p>
                    ))}
                  </div>
                )}

                <div className="wb-b2-io-buttons">
                  <button
                    type="button"
                    className="wb-action-btn"
                    disabled={!importPreview.canImport}
                    onClick={handleConfirmImport}
                  >
                    <CheckCircle2 size={14} aria-hidden="true" />
                    <span>Zastosuj podglądany import dowodów</span>
                  </button>
                  <button
                    type="button"
                    className="wb-action-btn wb-action-btn-secondary"
                    onClick={() => setImportPreview(null)}
                  >
                    <span>Anuluj podgląd</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
});
