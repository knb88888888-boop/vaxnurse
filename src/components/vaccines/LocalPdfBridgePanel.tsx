import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  FileSearch,
  FileWarning,
  Lock,
  RotateCcw,
  Search,
  ShieldAlert,
  Trash2,
  Upload,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import type { Stage1HumanDecisionItem } from '../../types/childVaccines';
import type {
  EvidenceLedgerEntry,
  EvidenceQualificationClass,
  EvidenceRelationship,
  EvidenceReviewStatus,
  LocalPdfHashReferenceMode,
  LocalPdfMetadataSummary,
  PageNumberingType,
  SourceRegistryEntry
} from '../../types/evidenceLedger';
import {
  LOCAL_PDF_METADATA_DISCLAIMER,
  LOCAL_PDF_NO_CLINICAL_APPROVAL_NOTICE,
  LOCAL_PDF_RELOAD_REQUIRED_NOTICE,
  LOCAL_PDF_TEXT_LAYER_DISCLAIMER,
  MAX_LOCAL_PDF_SIZE_BYTES,
  computeSha256HexFromBytes,
  evaluateHashAgainstReference,
  formatFileSizeHuman,
  sanitizePdfDisplayFileName,
  validateLocalPdfFile,
  type LocalPdfHashEvaluation
} from '../../utils/localPdfBridge';
import {
  openLocalPdfSessionDocument,
  type LocalPdfTextSearchResult,
  type OpenedLocalPdfSession
} from '../../utils/localPdfReader';
import {
  ALLOWED_PAGE_NUMBERING_TYPES,
  QRD_EXTENDED_SECTION_TITLES,
  getFileAvailabilityLabel,
  getHashComparisonStatusLabel,
  getPdfStorageLocationLabel,
  getProductScopeLabel,
  validateWorkingEvidenceInput,
  type RegisterLocalPdfSessionInput,
  type WorkingEvidenceDraftInput
} from '../../utils/chplEvidenceLedger';

interface LocalPdfBridgePanelProps {
  sources: SourceRegistryEntry[];
  checklist: readonly Stage1HumanDecisionItem[];
  workingEntries: readonly EvidenceLedgerEntry[];
  selectedDocumentId: string;
  onSelectDocumentId: (documentId: string) => void;
  sectionRef?: React.RefObject<HTMLElement | null>;
  onRegisterLocalPdfSession: (inspection: RegisterLocalPdfSessionInput) => {
    updatedSource: SourceRegistryEntry;
    versionCreated: boolean;
    reverificationTriggered: boolean;
  };
  onCreatePdfEvidenceEntry: (draft: WorkingEvidenceDraftInput) => {
    success: boolean;
    error?: string;
    entry?: EvidenceLedgerEntry;
  };
  onClearPersistedArtifacts: () => void;
  openPdfDocumentFn?: (bytes: Uint8Array) => Promise<OpenedLocalPdfSession>;
}

interface ActiveSessionInspectState {
  sessionId: string;
  documentId: string;
  fileName: string;
  declaredMimeType: string | null;
  fileSizeBytes: number;
  sha256Hex: string | null;
  hashError: string | null;
  hashEvaluation: LocalPdfHashEvaluation;
  advisoryWarnings: string[];
  pageCount: number;
  parserVersion: string;
  metadataStatus: 'not_run' | 'extracted' | 'partial_or_empty' | 'failed';
  textLayerStatus: 'not_run' | 'text_layer_available' | 'no_text_layer' | 'failed';
  metadata: LocalPdfMetadataSummary;
  operatorDeclaredOrigin: string | null;
  registeredArtifactId: string | null;
  versionCreated: boolean;
  reverificationTriggered: boolean;
}

const QRD_QUICK_SECTIONS = Object.keys(QRD_EXTENDED_SECTION_TITLES);

function generateSessionToken(): string {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
    return `pdfsess-${globalThis.crypto.randomUUID()}`;
  }
  return `pdfsess-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const LocalPdfBridgePanel: React.FC<LocalPdfBridgePanelProps> = React.memo(({
  sources,
  checklist,
  workingEntries,
  selectedDocumentId,
  onSelectDocumentId,
  sectionRef,
  onRegisterLocalPdfSession,
  onCreatePdfEvidenceEntry,
  onClearPersistedArtifacts,
  openPdfDocumentFn = openLocalPdfSessionDocument
}) => {
  const activeSource = useMemo(
    () => sources.find((s) => s.documentId === selectedDocumentId) ?? sources[0] ?? null,
    [sources, selectedDocumentId]
  );

  const [referenceMode, setReferenceMode] = useState<LocalPdfHashReferenceMode>('registry_reference');
  const [operatorRefHash, setOperatorRefHash] = useState<string>('');
  const [operatorDeclaredOrigin, setOperatorDeclaredOrigin] = useState<string>('');

  const [isLoadingFile, setIsLoadingFile] = useState<boolean>(false);
  const [bridgeError, setBridgeError] = useState<string | null>(null);
  const [bridgeStatusMsg, setBridgeStatusMsg] = useState<string | null>(null);

  const [sessionInfo, setSessionInfo] = useState<ActiveSessionInspectState | null>(null);
  const [openedSession, setOpenedSession] = useState<OpenedLocalPdfSession | null>(null);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageJumpInput, setPageJumpInput] = useState<string>('1');
  const [zoomScale, setZoomScale] = useState<number>(1.1);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isRenderingPage, setIsRenderingPage] = useState<boolean>(false);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchingText, setIsSearchingText] = useState<boolean>(false);
  const [searchResult, setSearchResult] = useState<LocalPdfTextSearchResult | null>(null);
  const [currentPagePlainText, setCurrentPagePlainText] = useState<string>('');

  const [evQuestionId, setEvQuestionId] = useState<string>(checklist[0]?.id ?? '');
  const [evQrdSection, setEvQrdSection] = useState<string>('4.2');
  const [evPageIndex, setEvPageIndex] = useState<string>('1');
  const [evPrintedPage, setEvPrintedPage] = useState<string>('');
  const [evNumberingType, setEvNumberingType] = useState<PageNumberingType>('pdf_page_index');
  const [evExcerpt, setEvExcerpt] = useState<string>('');
  const [evObservation, setEvObservation] = useState<string>('');
  const [evRelationship, setEvRelationship] = useState<EvidenceRelationship>('contextualizes');
  const [evQualification, setEvQualification] =
    useState<EvidenceQualificationClass>('source_excerpt_reviewed');
  const [evReviewStatus, setEvReviewStatus] =
    useState<EvidenceReviewStatus>('awaiting_human_review');
  const [evConfirmHumanCheck, setEvConfirmHumanCheck] = useState<boolean>(false);
  const [evFormError, setEvFormError] = useState<string | null>(null);
  const [evFormSuccess, setEvFormSuccess] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const activePdfSessionRef = useRef<OpenedLocalPdfSession | null>(null);
  const renderCancelRef = useRef<(() => void) | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);

  const destroyCurrentPdfSession = async () => {
    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
      searchAbortRef.current = null;
    }
    if (renderCancelRef.current) {
      renderCancelRef.current();
      renderCancelRef.current = null;
    }
    const existing = activePdfSessionRef.current;
    activePdfSessionRef.current = null;
    setOpenedSession(null);
    if (existing) {
      try {
        await existing.destroy();
      } catch {
        // Ignoruj błędy sprzątania po zniszczonym workerze
      }
    }
  };

  useEffect(() => {
    return () => {
      void destroyCurrentPdfSession();
    };
  }, []);

  // Dopasowanie domyślnego pytania po zmianie wybranego dokumentu (bez efektu kaskadowego)
  const [prevSyncedDocId, setPrevSyncedDocId] = useState<string | undefined>(activeSource?.documentId);
  if (activeSource && activeSource.documentId !== prevSyncedDocId) {
    setPrevSyncedDocId(activeSource.documentId);
    const match = checklist.find((q) => q.productKey === activeSource.productKey);
    if (match) {
      setEvQuestionId(match.id);
    }
    if (
      activeSource.statusAxes.acquisitionStatus === 'access_failed' ||
      activeSource.isHistoricalRejectedForCurrentSeason
    ) {
      setEvQualification(
        activeSource.isHistoricalRejectedForCurrentSeason
          ? 'secondary_reference'
          : 'unavailable_source_reference'
      );
    } else {
      setEvQualification('source_excerpt_reviewed');
    }
  }

  // Renderowanie bieżącej strony PDF w PDF.js na <canvas>
  useEffect(() => {
    let alive = true;
    const session = openedSession;
    const canvas = canvasRef.current;
    if (!session || !canvas) {
      return;
    }

    if (renderCancelRef.current) {
      renderCancelRef.current();
      renderCancelRef.current = null;
    }

    setRenderError(null);
    setIsRenderingPage(true);

    const task = session.renderPageToCanvas({
      pageNumber: currentPage,
      canvas,
      scale: zoomScale
    });
    renderCancelRef.current = task.cancel;

    task.done
      .then(() => {
        if (!alive) return;
        setIsRenderingPage(false);
      })
      .catch((err) => {
        if (!alive) return;
        const msg = err instanceof Error ? err.message : String(err ?? '');
        if (/cancel/i.test(msg) || msg === 'RENDER_CANCELLED') {
          return;
        }
        setIsRenderingPage(false);
        setRenderError(`Błąd renderowania strony ${currentPage} PDF w przeglądarce: ${msg}`);
      });

    if (session.textLayerStatus === 'text_layer_available') {
      session
        .getPagePlainText(currentPage)
        .then((text) => {
          if (alive) {
            setCurrentPagePlainText(text);
          }
        })
        .catch(() => {
          if (alive) {
            setCurrentPagePlainText('');
          }
        });
    }

    return () => {
      alive = false;
      task.cancel();
    };
  }, [openedSession, currentPage, zoomScale]);

  const handleCloseSessionOnly = async () => {
    await destroyCurrentPdfSession();
    setSessionInfo(null);
    setSearchResult(null);
    setCurrentPagePlainText('');
    setCurrentPage(1);
    setPageJumpInput('1');
    setBridgeError(null);
    setBridgeStatusMsg('Zamknięto lokalny podgląd sesyjny PDF. Bajty pliku zwolnione z pamięci sesji.');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeSource) {
      return;
    }

    setBridgeError(null);
    setBridgeStatusMsg(null);
    setEvFormError(null);
    setEvFormSuccess(null);
    setSearchResult(null);
    setIsLoadingFile(true);

    await destroyCurrentPdfSession();
    setSessionInfo(null);

    try {
      const validation = await validateLocalPdfFile(file);
      if (!validation.valid || !validation.bytes) {
        setBridgeError(validation.errors.join(' '));
        setIsLoadingFile(false);
        return;
      }

      // 1. Wyliczenie rzeczywistego SHA-256 z pełnych bajtów pliku (zanim cokolwiek trafi do PDF.js)
      const shaRes = await computeSha256HexFromBytes(validation.bytes);
      const calculatedSha = shaRes.ok ? shaRes.sha256Hex : null;
      const hashError = shaRes.ok ? null : shaRes.errorMessage;

      const registryReferenceHash =
        activeSource.currentArtifact?.hashProvenance.referenceHash ??
        activeSource.sha256 ??
        null;
      const registryReferenceType =
        activeSource.currentArtifact?.hashProvenance.referenceType ??
        (activeSource.documentId === 'doc-mz-pso-2027-akt'
          ? 'local_workspace_sha256'
          : 'bundle_recorded_sha256');

      const hashEvaluation = evaluateHashAgainstReference({
        calculatedSha256: calculatedSha,
        referenceMode,
        registryReferenceHash,
        registryReferenceType,
        operatorReferenceHash: operatorRefHash
      });

      // 2. Lazy-loaded otwarcie dokumentu przez PDF.js wyłącznie w pamięci przeglądarki
      const pdfSession = await openPdfDocumentFn(validation.bytes);
      activePdfSessionRef.current = pdfSession;

      const verificationSessionId = generateSessionToken();
      const safeOrigin = operatorDeclaredOrigin.trim() || null;

      // 3. Rejestracja / porównanie artefaktu i kontrola kaskadowa wersji
      const registration = onRegisterLocalPdfSession({
        documentId: activeSource.documentId,
        verificationSessionId,
        fileName: validation.sanitizedFileName,
        mimeType: validation.declaredMimeType,
        fileSizeBytes: validation.fileSizeBytes,
        sha256Hex: calculatedSha,
        comparisonStatus: hashEvaluation.comparisonStatus,
        integrityStatus: hashEvaluation.integrityStatus,
        referenceType: hashEvaluation.referenceType,
        referenceHash: hashEvaluation.referenceHash,
        referenceOriginNote: hashEvaluation.notice,
        pageCount: pdfSession.pageCount,
        pdfParserVersion: pdfSession.parserVersion,
        metadataStatus: pdfSession.metadataStatus,
        textLayerStatus: pdfSession.textLayerStatus,
        pdfMetadata: pdfSession.metadata,
        operatorDeclaredOrigin: safeOrigin
      });

      setOpenedSession(pdfSession);
      setCurrentPage(1);
      setPageJumpInput('1');
      setEvPageIndex('1');
      setSessionInfo({
        sessionId: verificationSessionId,
        documentId: activeSource.documentId,
        fileName: validation.sanitizedFileName,
        declaredMimeType: validation.declaredMimeType,
        fileSizeBytes: validation.fileSizeBytes,
        sha256Hex: calculatedSha,
        hashError,
        hashEvaluation,
        advisoryWarnings: validation.warnings,
        pageCount: pdfSession.pageCount,
        parserVersion: pdfSession.parserVersion,
        metadataStatus: pdfSession.metadataStatus,
        textLayerStatus: pdfSession.textLayerStatus,
        metadata: pdfSession.metadata,
        operatorDeclaredOrigin: safeOrigin,
        registeredArtifactId: registration.updatedSource.currentArtifact?.artifactId ?? null,
        versionCreated: registration.versionCreated,
        reverificationTriggered: registration.reverificationTriggered
      });

      setBridgeStatusMsg(
        `Otwarto lokalny PDF „${validation.sanitizedFileName}” (${pdfSession.pageCount} str.) w pamięci przeglądarki — zero przesyłania danych na serwer.`
      );
    } catch (err) {
      await destroyCurrentPdfSession();
      const message = err instanceof Error ? err.message : 'Nieznany błąd otwierania lokalnego pliku PDF.';
      setBridgeError(message);
    } finally {
      setIsLoadingFile(false);
    }
  };

  const handleGoToPage = (target: number) => {
    if (!openedSession) return;
    const bounded = Math.max(1, Math.min(openedSession.pageCount, Math.trunc(target)));
    setCurrentPage(bounded);
    setPageJumpInput(String(bounded));
  };

  const handleRunTextSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!openedSession) return;
    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
    }
    const controller = new AbortController();
    searchAbortRef.current = controller;
    setIsSearchingText(true);
    try {
      const res = await openedSession.searchPlainText(searchQuery, {
        signal: controller.signal,
        maxMatches: 30
      });
      if (!controller.signal.aborted) {
        setSearchResult(res);
      }
    } catch {
      if (!controller.signal.aborted) {
        setRenderError('Przeszukiwanie warstwy tekstowej PDF nie powiodło się.');
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsSearchingText(false);
      }
    }
  };

  const handleSubmitControlledEvidence = (e: React.FormEvent) => {
    e.preventDefault();
    setEvFormError(null);
    setEvFormSuccess(null);

    if (!activeSource || !sessionInfo || !openedSession) {
      setEvFormError('Najpierw otwórz prawidłowy plik PDF w bieżącej sesji przeglądarki.');
      return;
    }

    if (!sessionInfo.sha256Hex) {
      setEvFormError(
        'Brak obliczonej sumy SHA-256 w bieżącej sesji (np. błąd Web Crypto API) — nie można zarejestrować zweryfikowanego dowodu PDF.'
      );
      return;
    }

    const parsedPage = Number(evPageIndex.trim());
    const normalizedPage =
      evPageIndex.trim() && Number.isInteger(parsedPage) ? parsedPage : null;

    if (normalizedPage === null || normalizedPage < 1 || normalizedPage > openedSession.pageCount) {
      setEvFormError(
        `Podaj poprawny fizyczny indeks strony PDF z zakresu 1–${openedSession.pageCount}.`
      );
      return;
    }

    const draft: WorkingEvidenceDraftInput = {
      questionId: evQuestionId,
      documentId: activeSource.documentId,
      qrdSection: evQrdSection,
      pdfPageIndex: normalizedPage,
      printedPageNumber: evPrintedPage,
      pageNumberingType: evNumberingType,
      sourceExcerptRef: evExcerpt,
      clinicalObservation: evObservation,
      relationship: evRelationship,
      qualificationClass: evQualification,
      confirmedRealPdfContent: evConfirmHumanCheck,
      verificationSessionId: sessionInfo.sessionId,
      reviewedInLocalPdfSession: true,
      reviewStatus: evReviewStatus
    };

    const validation = validateWorkingEvidenceInput(draft, checklist, sources);
    if (!validation.valid) {
      setEvFormError(validation.errors.join(' '));
      return;
    }

    const result = onCreatePdfEvidenceEntry(draft);
    if (!result.success) {
      setEvFormError(result.error ?? 'Nie udało się zapisać wpisu dowodowego.');
      return;
    }

    setEvExcerpt('');
    setEvObservation('');
    setEvConfirmHumanCheck(false);
    setEvFormSuccess(
      `Zapisano lokalny wpis dowodowy (${result.entry?.qualificationClass}) powiązany z artefaktem ${result.entry?.artifactId ?? 'sesyjnym'} (str. ${normalizedPage} PDF, autoResolved: false).`
    );
  };

  const handleClearArtifactsClick = () => {
    void handleCloseSessionOnly();
    onClearPersistedArtifacts();
    setBridgeStatusMsg(
      'Wyczyszczono zapisane lokalnie metadane artefaktów PDF z localStorage (nielokalny katalog kliniczny oraz wpisy robocze pozostały bezpieczne).'
    );
  };

  const sessionWorkingCount = useMemo(() => {
    if (!activeSource) return 0;
    return workingEntries.filter((e) => e.documentId === activeSource.documentId).length;
  }, [workingEntries, activeSource]);

  const reloadRequiredBannerVisible =
    Boolean(activeSource?.hasPersistedLocalArtifactMetadata) &&
    activeSource?.statusAxes.fileAvailability === 'metadata_only_reload_required' &&
    !openedSession;

  return (
    <section
      id="wb-b4-local-pdf-section"
      ref={sectionRef}
      className="wb-b4-pdf-bridge-section"
      data-testid="b4-local-pdf-bridge"
      aria-labelledby="wb-b4-local-pdf-heading"
    >
      <div className="wb-section-heading-row">
        <div>
          <h2 id="wb-b4-local-pdf-heading" className="wb-section-heading">
            <FileSearch size={18} aria-hidden="true" />
            <span>Etap B4 — Most weryfikacji lokalnego pliku PDF (100% w przeglądarce)</span>
          </h2>
          <p className="wb-b2-sublead">
            Wybierz rekord źródłowy i wskaż lokalny plik PDF na dysku. Bajty PDF nigdy nie są wysyłane przez sieć ani zapisywane w localStorage — w przeglądarce trwałe są wyłącznie metadane, historia wersji artefaktu i SHA-256.
          </p>
        </div>
        <div className="wb-b4-bridge-top-badges">
          <span className="wb-b3-pill-badge">
            <Lock size={13} aria-hidden="true" />
            <span>Brak uploadu sieciowego · RAM sesji</span>
          </span>
        </div>
      </div>

      {/* Krok 1: Wybór dokumentu źródłowego, trybu wzorca i File Picker */}
      <div className="wb-b4-setup-grid">
        <div className="wb-b4-card">
          <h3>1. Wybór rekordu źródłowego i trybu porównania SHA-256</h3>

          <div className="wb-b2-form-row">
            <label htmlFor="b4-bridge-source-select">Rekord dokumentu w Rejestrze Źródeł</label>
            <select
              id="b4-bridge-source-select"
              data-testid="b4-bridge-source-select"
              className="wb-select-input"
              value={activeSource?.documentId ?? ''}
              onChange={(e) => {
                void handleCloseSessionOnly();
                onSelectDocumentId(e.target.value);
              }}
            >
              {sources.map((src) => (
                <option key={src.documentId} value={src.documentId}>
                  {src.documentTitle} [{src.language}] — {src.physicalPageCount ?? '?'} str.
                  {src.isHistoricalRejectedForCurrentSeason ? ' [HISTORYCZNY 2025/2026]' : ''}
                </option>
              ))}
            </select>
          </div>

          {activeSource && (
            <div className="wb-b4-source-status-box">
              <div className="wb-b4-status-row">
                <strong>Dostępność pliku:</strong>{' '}
                <span data-testid="b4-source-availability">
                  {getFileAvailabilityLabel(activeSource.statusAxes.fileAvailability)}
                </span>
              </div>
              <div className="wb-b4-status-row">
                <strong>Przechowywanie:</strong>{' '}
                <span>{getPdfStorageLocationLabel(activeSource.statusAxes.storageMode)}</span>
              </div>
              <div className="wb-b4-status-row">
                <strong>Zakres stron w rejestrze:</strong>{' '}
                <span>
                  {activeSource.registryReferencePageCount ?? activeSource.physicalPageCount ?? 'brak danych'} str. ·{' '}
                  <strong>Wzorzec SHA-256 w rejestrze:</strong>{' '}
                  <code>{activeSource.currentArtifact?.hashProvenance.referenceHash ?? activeSource.sha256 ?? 'brak'}</code>
                </span>
              </div>
              <div className="wb-b4-status-row">
                <strong>Wpisy robocze dla źródła:</strong> <span>{sessionWorkingCount}</span> ·{' '}
                <strong>Wersje artefaktów:</strong> <span>{activeSource.artifactHistory.length}</span>
              </div>
            </div>
          )}

          {reloadRequiredBannerVisible && (
            <div
              className="wb-b2-inline-alert wb-b2-alert-warning"
              data-testid="b4-reload-reselect-banner"
              role="note"
            >
              <AlertTriangle size={16} aria-hidden="true" />
              <span>
                {LOCAL_PDF_RELOAD_REQUIRED_NOTICE} Ostatnio badany plik:{' '}
                <code>{activeSource?.sessionFileName ?? activeSource?.currentArtifact?.fileName ?? 'PDF'}</code>{' '}
                (SHA-256: <code>{activeSource?.sha256?.slice(0, 16) ?? 'brak'}...</code>).
              </span>
            </div>
          )}

          {activeSource?.isHistoricalRejectedForCurrentSeason && (
            <div className="wb-b2-inline-alert wb-b2-alert-danger" role="note">
              <AlertTriangle size={16} aria-hidden="true" />
              <span>
                Wybrano dokument historyczny 2025/2026. Możesz obejrzeć plik technicznie, lecz system blokuje awansowanie dowodów z tego źródła do klasy zweryfikowanej dla sezonu 2026/2027.
              </span>
            </div>
          )}
        </div>

        <div className="wb-b4-card">
          <h3>2. Wskazanie pliku PDF i parametry porównania lokalnego</h3>

          <div className="wb-b2-form-row">
            <label htmlFor="b4-ref-mode-select">Tryb wzorca porównawczego SHA-256</label>
            <select
              id="b4-ref-mode-select"
              data-testid="b4-ref-mode-select"
              className="wb-select-input"
              value={referenceMode}
              onChange={(e) => setReferenceMode(e.target.value as LocalPdfHashReferenceMode)}
            >
              <option value="registry_reference">
                Wzorzec referencyjny zapisany w rejestrze Etapu I (jeśli dostępny)
              </option>
              <option value="none">Brak wzorca — wylicz wyłącznie lokalny SHA-256</option>
              <option value="operator_untrusted">
                Wzorzec podany ręcznie przez operatora (NIEZAUFANY — nie potwierdza pochodzenia)
              </option>
            </select>
          </div>

          {referenceMode === 'operator_untrusted' && (
            <div className="wb-b2-form-row">
              <label htmlFor="b4-operator-ref-hash">
                Niezaufany wzorzec SHA-256 podany przez operatora (64 znaki hex)
              </label>
              <input
                id="b4-operator-ref-hash"
                type="text"
                className="wb-text-input"
                maxLength={64}
                placeholder="np. 64-znakowy skrót szesnastkowy..."
                value={operatorRefHash}
                onChange={(e) => setOperatorRefHash(e.target.value)}
              />
            </div>
          )}

          <div className="wb-b2-form-row">
            <label htmlFor="b4-operator-origin-note">
              Deklarowane przez operatora pochodzenie pliku (opcjonalne, niepotwierdzone automatycznie)
            </label>
            <input
              id="b4-operator-origin-note"
              type="text"
              className="wb-text-input"
              maxLength={180}
              placeholder="np. Pobrano ręcznie przez operatora ze strony RPL dnia..."
              value={operatorDeclaredOrigin}
              onChange={(e) => setOperatorDeclaredOrigin(e.target.value)}
            />
          </div>

          <div className="wb-b2-form-row">
            <label htmlFor="b4-local-pdf-input">
              Wybierz lokalny plik PDF do inspekcji (maks. {formatFileSizeHuman(MAX_LOCAL_PDF_SIZE_BYTES)})
            </label>
            <input
              ref={fileInputRef}
              id="b4-local-pdf-input"
              data-testid="b4-local-pdf-input"
              type="file"
              accept=".pdf,application/pdf"
              className="wb-file-input"
              onChange={handleFileSelected}
            />
          </div>

          <div className="wb-b4-action-row">
            <button
              type="button"
              className="wb-action-btn wb-action-btn-secondary"
              onClick={() => void handleCloseSessionOnly()}
              disabled={!openedSession && !sessionInfo}
            >
              <RotateCcw size={14} aria-hidden="true" />
              <span>Zamknij podgląd sesyjny PDF</span>
            </button>
            <button
              type="button"
              className="wb-action-btn wb-action-btn-secondary"
              data-testid="b4-clear-artifacts-btn"
              onClick={handleClearArtifactsClick}
            >
              <Trash2 size={14} aria-hidden="true" />
              <span>Wyczyść metadane artefaktów PDF</span>
            </button>
          </div>
        </div>
      </div>

      {isLoadingFile && (
        <div className="wb-action-feedback" role="status" aria-live="polite">
          <Upload size={15} aria-hidden="true" />
          <span>Trwa walidacja nagłówka %PDF-, wyliczanie SHA-256 oraz otwieranie dokumentu przez PDF.js...</span>
        </div>
      )}

      {bridgeError && (
        <div
          className="wb-b2-inline-alert wb-b2-alert-danger"
          data-testid="b4-bridge-error"
          role="alert"
        >
          <FileWarning size={16} aria-hidden="true" />
          <span>{bridgeError}</span>
        </div>
      )}

      {bridgeStatusMsg && !bridgeError && (
        <div
          className="wb-b2-inline-alert wb-b2-alert-ok"
          data-testid="b4-bridge-status"
          role="status"
          aria-live="polite"
        >
          <CheckCircle2 size={16} aria-hidden="true" />
          <span>{bridgeStatusMsg}</span>
        </div>
      )}

      {/* Krok 2: Metadane, SHA-256, porównanie liczby stron i wersja artefaktu */}
      {sessionInfo && (
        <div className="wb-b4-inspection-panel" data-testid="b4-inspection-summary">
          <h3>3. Wynik walidacji technicznej, SHA-256 i porównania metadanych</h3>

          {sessionInfo.advisoryWarnings.length > 0 && (
            <div className="wb-b2-inline-alert wb-b2-alert-warning" role="note">
              <AlertTriangle size={16} aria-hidden="true" />
              <span>{sessionInfo.advisoryWarnings.join(' ')}</span>
            </div>
          )}

          {sessionInfo.hashError && (
            <div className="wb-b2-inline-alert wb-b2-alert-danger" role="alert">
              <AlertTriangle size={16} aria-hidden="true" />
              <span>{sessionInfo.hashError}</span>
            </div>
          )}

          {sessionInfo.reverificationTriggered && (
            <div
              className="wb-b2-inline-alert wb-b2-alert-warning"
              data-testid="b4-reverification-alert"
              role="note"
            >
              <ShieldAlert size={16} aria-hidden="true" />
              <span>
                Wykryto zmianę skrótu SHA-256 względem wcześniejszej wersji artefaktu — powiązane lokalne wpisy dowodowe zostały oznaczone jako wymagające ponownej weryfikacji (requiresReverification: true), a pytania zachowały autoResolved: false.
              </span>
            </div>
          )}

          <div
            className={`wb-b2-inline-alert ${
              sessionInfo.hashEvaluation.integrityStatus === 'hash_matches_known_reference'
                ? 'wb-b2-alert-ok'
                : 'wb-b2-alert-warning'
            }`}
            data-testid="b4-hash-evaluation-notice"
            role="note"
          >
            <ShieldAlert size={16} aria-hidden="true" />
            <span>{sessionInfo.hashEvaluation.notice}</span>
          </div>

          <dl className="wb-b2-source-meta wb-b4-meta-dl">
            <div>
              <dt>Nazwa pliku (bezpieczna):</dt>
              <dd>{sanitizePdfDisplayFileName(sessionInfo.fileName)}</dd>
            </div>
            <div>
              <dt>Rozmiar i typ MIME (advisory):</dt>
              <dd>
                {formatFileSizeHuman(sessionInfo.fileSizeBytes)} · MIME:{' '}
                {sessionInfo.declaredMimeType ?? 'brak deklaracji MIME'}
              </dd>
            </div>
            <div>
              <dt>SHA-256 wyliczony lokalnie (Web Crypto):</dt>
              <dd>
                <code data-testid="b4-calculated-sha256">
                  {sessionInfo.sha256Hex ?? 'Błąd / brak skrótu'}
                </code>
              </dd>
            </div>
            <div>
              <dt>Status porównania SHA-256:</dt>
              <dd data-testid="b4-comparison-status">
                {getHashComparisonStatusLabel(sessionInfo.hashEvaluation.comparisonStatus)}
              </dd>
            </div>
            <div>
              <dt>Liczba stron PDF (PDF.js v{sessionInfo.parserVersion}):</dt>
              <dd data-testid="b4-page-count-comparison">
                <strong>{sessionInfo.pageCount} str.</strong> w otwartym pliku PDF{' '}
                {activeSource?.registryReferencePageCount !== null &&
                activeSource?.registryReferencePageCount !== undefined ? (
                  sessionInfo.pageCount === activeSource.registryReferencePageCount ? (
                    <span className="wb-b4-inline-ok">
                      (zgodne z rejestrem: {activeSource.registryReferencePageCount} str.)
                    </span>
                  ) : (
                    <span className="wb-b4-inline-warn">
                      (rozbieżność z rejestrem: wpis podaje {activeSource.registryReferencePageCount} str.)
                    </span>
                  )
                ) : (
                  '(brak liczby stron referencyjnych w rejestrze)'
                )}
              </dd>
            </div>
            <div>
              <dt>Aktywny artefakt i sesja:</dt>
              <dd>
                <code data-testid="b4-active-artifact-id">{sessionInfo.registeredArtifactId ?? 'brak'}</code>{' '}
                · Sesja: <code>{sessionInfo.sessionId}</code>{' '}
                {sessionInfo.versionCreated
                  ? '(zarejestrowano nową wersję artefaktu)'
                  : '(zgodność SHA-256 z istniejącą wersją — bez duplikacji)'}
              </dd>
            </div>
            {sessionInfo.operatorDeclaredOrigin && (
              <div>
                <dt>Pochodzenie zadeklarowane przez operatora (niezweryfikowane):</dt>
                <dd>{sessionInfo.operatorDeclaredOrigin}</dd>
              </div>
            )}
          </dl>

          <details className="wb-b3-details">
            <summary className="wb-b3-details-summary">
              Metadane osadzone w PDF (status: {sessionInfo.metadataStatus} — niezaufana deklaracja pliku)
            </summary>
            <div className="wb-b3-details-body">
              <p className="wb-b4-small-disclaimer">{LOCAL_PDF_METADATA_DISCLAIMER}</p>
              <dl className="wb-b2-source-meta">
                <div>
                  <dt>Tytuł PDF:</dt>
                  <dd>{sessionInfo.metadata.title ?? 'brak'}</dd>
                </div>
                <div>
                  <dt>Autor / Narzędzie:</dt>
                  <dd>
                    {sessionInfo.metadata.author ?? 'brak'} · {sessionInfo.metadata.creator ?? 'brak'} /{' '}
                    {sessionInfo.metadata.producer ?? 'brak'}
                  </dd>
                </div>
                <div>
                  <dt>Wersja specyfikacji PDF i daty:</dt>
                  <dd>
                    PDF {sessionInfo.metadata.pdfVersion ?? '?'} · Utw.: {sessionInfo.metadata.creationDate ?? 'brak'} · Mod.:{' '}
                    {sessionInfo.metadata.modDate ?? 'brak'}
                  </dd>
                </div>
              </dl>
            </div>
          </details>
        </div>
      )}

      {/* Krok 3 & 4: Podgląd PDF.js + wyszukiwanie w warstwie tekstowej + kontrolowany wpis dowodowy */}
      {openedSession && sessionInfo && (
        <div className="wb-b4-workspace-grid">
          <div className="wb-b4-preview-pane" data-testid="b4-pdf-preview-pane">
            <h3>4. Podgląd stron PDF.js w przeglądarce i wyszukiwanie w warstwie tekstowej</h3>

            <div className="wb-b4-viewer-toolbar" role="toolbar" aria-label="Sterowanie podglądem PDF">
              <div className="wb-b4-toolbar-group">
                <button
                  type="button"
                  className="wb-action-btn wb-action-btn-secondary"
                  data-testid="b4-prev-page-btn"
                  disabled={currentPage <= 1}
                  onClick={() => handleGoToPage(currentPage - 1)}
                >
                  Poprzednia strona
                </button>
                <span className="wb-b4-page-indicator" data-testid="b4-page-indicator" aria-live="polite">
                  Strona {currentPage} z {openedSession.pageCount}
                </span>
                <button
                  type="button"
                  className="wb-action-btn wb-action-btn-secondary"
                  data-testid="b4-next-page-btn"
                  disabled={currentPage >= openedSession.pageCount}
                  onClick={() => handleGoToPage(currentPage + 1)}
                >
                  Następna strona
                </button>
              </div>

              <div className="wb-b4-toolbar-group">
                <label htmlFor="b4-page-jump-input" className="sr-only">
                  Przejdź do numeru strony PDF
                </label>
                <input
                  id="b4-page-jump-input"
                  type="number"
                  min={1}
                  max={openedSession.pageCount}
                  className="wb-text-input wb-b4-page-input"
                  value={pageJumpInput}
                  onChange={(e) => setPageJumpInput(e.target.value)}
                />
                <button
                  type="button"
                  className="wb-action-btn wb-action-btn-secondary"
                  data-testid="b4-go-page-btn"
                  onClick={() => {
                    const num = Number(pageJumpInput);
                    if (Number.isFinite(num)) {
                      handleGoToPage(num);
                    }
                  }}
                >
                  Przejdź
                </button>
              </div>

              <div className="wb-b4-toolbar-group">
                <button
                  type="button"
                  className="wb-action-btn wb-action-btn-secondary"
                  title="Pomniejsz podgląd PDF"
                  disabled={zoomScale <= 0.65}
                  onClick={() => setZoomScale((z) => Math.max(0.6, Number((z - 0.15).toFixed(2))))}
                >
                  <ZoomOut size={14} aria-hidden="true" />
                  <span>Pomniejsz</span>{' '}
                  <span className="sr-only">podgląd PDF</span>
                </button>
                <span className="wb-b4-zoom-label" data-testid="b4-zoom-indicator">
                  {Math.round(zoomScale * 100)}%
                </span>
                <button
                  type="button"
                  className="wb-action-btn wb-action-btn-secondary"
                  title="Powiększ podgląd PDF"
                  disabled={zoomScale >= 2.2}
                  onClick={() => setZoomScale((z) => Math.min(2.2, Number((z + 0.15).toFixed(2))))}
                >
                  <ZoomIn size={14} aria-hidden="true" />
                  <span>Powiększ</span>{' '}
                  <span className="sr-only">podgląd PDF</span>
                </button>
              </div>
            </div>

            {renderError && (
              <div className="wb-b2-inline-alert wb-b2-alert-danger" role="alert">
                <AlertTriangle size={15} aria-hidden="true" />
                <span>{renderError}</span>
              </div>
            )}

            <div className="wb-b4-canvas-frame">
              {isRenderingPage && (
                <div className="wb-b4-canvas-loading" role="status" aria-live="polite">
                  Renderowanie strony {currentPage}...
                </div>
              )}
              <canvas
                ref={canvasRef}
                data-testid="b4-pdf-canvas"
                className="wb-b4-pdf-canvas"
                aria-label={`Renderowany obraz strony ${currentPage} z ${openedSession.pageCount} lokalnego pliku PDF`}
              />
            </div>

            {/* Opcjonalna warstwa tekstowa PDF (bez OCR) */}
            <div className="wb-b4-text-search-box">
              <p className="wb-b4-small-disclaimer" data-testid="b4-text-layer-disclaimer">
                {LOCAL_PDF_TEXT_LAYER_DISCLAIMER}
              </p>

              {sessionInfo.textLayerStatus === 'no_text_layer' ? (
                <p className="wb-b3-empty-inline">
                  Brak rozpoznanej warstwy tekstowej w pierwszych stronach PDF (np. dokument zeskanowany — bez OCR). Zweryfikuj treść wzrokowo na podglądzie powyżej.
                </p>
              ) : (
                <>
                  <form className="wb-b4-search-form" onSubmit={handleRunTextSearch}>
                    <label htmlFor="b4-pdf-text-search" className="sr-only">
                      Szukaj frazy w warstwie tekstowej PDF
                    </label>
                    <input
                      id="b4-pdf-text-search"
                      data-testid="b4-pdf-text-search"
                      type="text"
                      className="wb-text-input"
                      placeholder="Szukaj frazy w warstwie tekstowej PDF (np. dawkowanie, pkt 4.2)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="wb-action-btn wb-action-btn-secondary"
                      disabled={isSearchingText || !searchQuery.trim()}
                    >
                      <Search size={14} aria-hidden="true" />
                      <span>{isSearchingText ? 'Szukanie...' : 'Szukaj w tekście'}</span>
                    </button>
                  </form>

                  {openedSession.textLayerStatus === 'text_layer_available' && currentPagePlainText && (
                    <details className="wb-b3-details">
                      <summary className="wb-b3-details-summary">
                        Podgląd surowego tekstu warstwy PDF ze strony {currentPage} (wymaga kontroli wzrokowej)
                      </summary>
                      <div className="wb-b3-details-body">
                        <p className="wb-b4-plain-text-excerpt" data-testid="b4-page-plain-text">
                          {currentPagePlainText}
                        </p>
                      </div>
                    </details>
                  )}

                  {searchResult && (
                    <div className="wb-b4-search-results" data-testid="b4-text-search-results">
                      <p className="wb-b2-sublead">
                        Znaleziono dopasowań: <strong>{searchResult.matches.length}</strong> (przeskanowano{' '}
                        {searchResult.pagesScanned} z {searchResult.totalPages} str.).
                      </p>
                      {searchResult.matches.length > 0 && (
                        <ul className="wb-b3-mini-list">
                          {searchResult.matches.map((m, idx) => (
                            <li key={`${m.pageNumber}-${idx}`}>
                              <button
                                type="button"
                                className="wb-b4-match-jump-btn"
                                onClick={() => handleGoToPage(m.pageNumber)}
                              >
                                Strona {m.pageNumber}
                              </button>{' '}
                              <span>{m.snippet}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Kontrolowany formularz rejestracji dowodu powiązanego z otwartym PDF */}
          <form
            className="wb-b4-evidence-form"
            data-testid="b4-pdf-evidence-form"
            onSubmit={handleSubmitControlledEvidence}
            noValidate
          >
            <h3>5. Kontrolowany wpis dowodowy z otwartego PDF</h3>
            <p className="wb-b2-sublead">
              Wpis powiązany bezpośrednio z aktywnym artefaktem (<code>{sessionInfo.registeredArtifactId}</code>), sumą SHA-256 oraz bieżącą sesją przeglądarki.
            </p>

            <div className="wb-b4-bound-summary">
              <span>
                <strong>Dokument:</strong> {activeSource?.documentTitle}
              </span>
              <span>
                <strong>Artefakt:</strong> <code>{sessionInfo.registeredArtifactId}</code>
              </span>
              <span>
                <strong>SHA-256:</strong> <code>{sessionInfo.sha256Hex?.slice(0, 16) ?? 'brak'}...</code>
              </span>
            </div>

            {evFormError && (
              <div className="wb-b2-inline-alert wb-b2-alert-danger" role="alert">
                <AlertTriangle size={15} aria-hidden="true" />
                <span>{evFormError}</span>
              </div>
            )}

            {evFormSuccess && (
              <div className="wb-b2-inline-alert wb-b2-alert-ok" role="status" aria-live="polite">
                <FileCheck2 size={15} aria-hidden="true" />
                <span>{evFormSuccess}</span>
              </div>
            )}

            <div className="wb-b2-form-row">
              <label htmlFor="b4-ev-question">Pytanie audytowe (autoResolved zawsze: false)</label>
              <select
                id="b4-ev-question"
                className="wb-select-input"
                value={evQuestionId}
                onChange={(e) => setEvQuestionId(e.target.value)}
              >
                {checklist.map((q) => (
                  <option key={q.id} value={q.id}>
                    [{getProductScopeLabel(q.productKey)}] Pkt {q.chplSectionOrSubpoint}: {q.clinicalQuestion}
                  </option>
                ))}
              </select>
            </div>

            <div className="wb-b2-form-two-col">
              <div className="wb-b2-form-row">
                <label htmlFor="b4-ev-qrd">Punkt QRD (np. 4.1, 4.2, 10)</label>
                <input
                  id="b4-ev-qrd"
                  list="b4-qrd-suggestions"
                  type="text"
                  className="wb-text-input"
                  value={evQrdSection}
                  onChange={(e) => setEvQrdSection(e.target.value)}
                />
                <datalist id="b4-qrd-suggestions">
                  {QRD_QUICK_SECTIONS.map((sec) => (
                    <option key={sec} value={sec}>
                      {QRD_EXTENDED_SECTION_TITLES[sec]}
                    </option>
                  ))}
                </datalist>
              </div>

              <div className="wb-b2-form-row">
                <label htmlFor="b4-ev-pdf-page">
                  Fizyczny indeks strony PDF (1–{openedSession.pageCount})
                </label>
                <div className="wb-b4-inline-page-sync">
                  <input
                    id="b4-ev-pdf-page"
                    type="number"
                    min={1}
                    max={openedSession.pageCount}
                    className="wb-text-input"
                    value={evPageIndex}
                    onChange={(e) => setEvPageIndex(e.target.value)}
                  />
                  <button
                    type="button"
                    className="wb-action-btn wb-action-btn-secondary"
                    onClick={() => setEvPageIndex(String(currentPage))}
                  >
                    Użyj str. {currentPage}
                  </button>
                </div>
              </div>
            </div>

            <div className="wb-b2-form-two-col">
              <div className="wb-b2-form-row">
                <label htmlFor="b4-ev-printed-page">Numer drukowany w dokumencie (opcjonalnie)</label>
                <input
                  id="b4-ev-printed-page"
                  type="text"
                  className="wb-text-input"
                  placeholder="np. str. 2 druku ChPL (oddzielny od indeksu PDF)"
                  value={evPrintedPage}
                  onChange={(e) => setEvPrintedPage(e.target.value)}
                />
              </div>

              <div className="wb-b2-form-row">
                <label htmlFor="b4-ev-numbering-type">Tryb numeracji strony</label>
                <select
                  id="b4-ev-numbering-type"
                  className="wb-select-input"
                  value={evNumberingType}
                  onChange={(e) => setEvNumberingType(e.target.value as PageNumberingType)}
                >
                  {ALLOWED_PAGE_NUMBERING_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t === 'pdf_page_index'
                        ? 'Indeks strony pliku PDF'
                        : t === 'printed_page'
                          ? 'Numeracja drukowana + indeks PDF'
                          : t === 'range_in_bundle'
                            ? 'Zakres w pakiecie Etapu I'
                            : 'Niepotwierdzona'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="wb-b2-form-row">
              <label htmlFor="b4-ev-excerpt">Sprawdzony cytat / odniesienie do treści (5–500 znaków)</label>
              <textarea
                id="b4-ev-excerpt"
                className="wb-textarea-input"
                rows={2}
                maxLength={500}
                placeholder="Wpisz lub przepisz sprawdzony fragment z podglądu PDF..."
                value={evExcerpt}
                onChange={(e) => setEvExcerpt(e.target.value)}
              />
            </div>

            <div className="wb-b2-form-row">
              <label htmlFor="b4-ev-observation">Obserwacja audytora (5–1500 znaków)</label>
              <textarea
                id="b4-ev-observation"
                className="wb-textarea-input"
                rows={2}
                maxLength={1500}
                placeholder="Opisz wynik porównania z podglądem PDF..."
                value={evObservation}
                onChange={(e) => setEvObservation(e.target.value)}
              />
            </div>

            <div className="wb-b2-form-two-col">
              <div className="wb-b2-form-row">
                <label htmlFor="b4-ev-relationship">Relacja względem pytania</label>
                <select
                  id="b4-ev-relationship"
                  className="wb-select-input"
                  value={evRelationship}
                  onChange={(e) => setEvRelationship(e.target.value as EvidenceRelationship)}
                >
                  <option value="contextualizes">Kontekstualizuje dokument</option>
                  <option value="supports">Potwierdza szczegół techniczny</option>
                  <option value="contradicts">Wskazuje rozbieżność / sprzeczność</option>
                  <option value="does_not_resolve">Nie rozstrzyga pytania</option>
                  <option value="missing_information">Brak informacji w dokumencie</option>
                </select>
              </div>

              <div className="wb-b2-form-row">
                <label htmlFor="b4-ev-qualification">Klasa kwalifikacji dowodu</label>
                <select
                  id="b4-ev-qualification"
                  className="wb-select-input"
                  value={evQualification}
                  onChange={(e) => setEvQualification(e.target.value as EvidenceQualificationClass)}
                >
                  <option value="source_excerpt_reviewed">
                    Fragment zweryfikowany w otwartym PDF (source_excerpt_reviewed)
                  </option>
                  <option value="conflicting_source_excerpt">
                    Rozbieżność potwierdzona w PDF (conflicting_source_excerpt)
                  </option>
                  <option value="source_excerpt_pending_review">
                    Fragment roboczy do dalszej kontroli (source_excerpt_pending_review)
                  </option>
                  <option value="conflicting_reference">
                    Rozbieżność referencyjna (conflicting_reference)
                  </option>
                  <option value="secondary_reference">
                    Źródło wtórne / historyczne (secondary_reference)
                  </option>
                </select>
              </div>
            </div>

            <div className="wb-b2-form-row">
              <label htmlFor="b4-ev-review-status">Status roboczy dowodu</label>
              <select
                id="b4-ev-review-status"
                className="wb-select-input"
                value={evReviewStatus}
                onChange={(e) => setEvReviewStatus(e.target.value as EvidenceReviewStatus)}
              >
                <option value="awaiting_human_review">Oczekuje na decyzję audytora klinicznego</option>
                <option value="evidence_logged">Zapisany ślad dowodowy (roboczy)</option>
                <option value="conflicting_evidence">Niejednoznaczność / rozbieżność</option>
                <option value="requires_authority_clarification">
                  Wymaga wyjaśnienia źródła / podmiotu / organu
                </option>
              </select>
            </div>

            <div className="wb-b2-form-row">
              <label className="wb-b2-checkbox-label">
                <input
                  id="b4-ev-human-confirm"
                  data-testid="b4-ev-human-confirm"
                  type="checkbox"
                  checked={evConfirmHumanCheck}
                  onChange={(e) => setEvConfirmHumanCheck(e.target.checked)}
                />
                <span>
                  Potwierdzam, że porównałem wskazany fragment z dokumentem PDF otwartym w tej sesji.
                </span>
              </label>
            </div>

            <div className="wb-b2-inline-alert wb-b2-alert-warning" role="note">
              <ShieldAlert size={15} aria-hidden="true" />
              <span>{LOCAL_PDF_NO_CLINICAL_APPROVAL_NOTICE}</span>
            </div>

            <button
              type="submit"
              className="wb-action-btn wb-action-btn-primary"
              data-testid="b4-submit-pdf-evidence-btn"
            >
              <FileCheck2 size={15} aria-hidden="true" />
              <span>Zapisz kontrolowany wpis dowodowy z otwartego PDF</span>
            </button>
          </form>
        </div>
      )}
    </section>
  );
});
