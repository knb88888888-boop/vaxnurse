import React, { useCallback, useId, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileCheck2,
  FileSearch,
  FolderOpen,
  History,
  Lock,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  ShieldAlert,
  Upload
} from 'lucide-react';
import type { Stage1HumanDecisionItem } from '../../types/childVaccines';
import type {
  AuditDossierExportOptions,
  AuditDossierExportScope,
  AuditDossierImportPreview,
  AuditDossierPayload,
  AuditProgressB5Metrics,
  AuditSessionDraftInput,
  AuditSessionRecord,
  AuditSessionReport,
  AuditSessionStatus,
  DocumentProvenanceLevel,
  EvidenceLedgerEntry,
  InformalWorkingNote,
  MetadataFieldKey,
  OperatorProvenanceDeclaration,
  PersistedSourceIntakeRecord,
  QuestionEvidenceReviewQueueItem,
  SourceIntakeChecklistItemKey,
  SourceIntakeRecord,
  SourceProductScopeKey,
  SourceRegistryEntry
} from '../../types/evidenceLedger';
import {
  AUDIT_SESSION_REPORT_DISCLAIMER,
  B5_PROGRESS_DASHBOARD_DISCLAIMER,
  DOSSIER_HASH_DISTINCTION_NOTICE,
  DOSSIER_PORTABLE_DISCLAIMER,
  METADATA_FIELD_LABELS,
  SOURCE_INTAKE_CHECKLIST_DEFINITIONS,
  STAGE1_ACQUISITION_QUEUE_DOCUMENT_IDS,
  buildAuditDossierExportPayloadWithSha256,
  buildAuditSessionReport,
  getAuditSessionStatusLabel,
  getDocumentProvenanceLabel,
  getDocumentReadinessLabel,
  getQuestionB5WorkStatusLabel,
  parseAndPreviewAuditDossierImport,
  renderAuditSessionReportHtml,
  verifyAuditDossierJsonSha256
} from '../../utils/chplAuditDossier';
import {
  getProductScopeLabel,
  isValidQrdSection
} from '../../utils/chplEvidenceLedger';

export interface AuditWorkspaceB5PanelProps {
  sources: readonly SourceRegistryEntry[];
  checklist: readonly Stage1HumanDecisionItem[];
  allEntries: readonly EvidenceLedgerEntry[];
  workingEntries: readonly EvidenceLedgerEntry[];
  workingNotes: readonly InformalWorkingNote[];
  persistedIntake: Readonly<Record<string, PersistedSourceIntakeRecord>>;
  intakeItems: readonly SourceIntakeRecord[];
  sessions: readonly AuditSessionRecord[];
  activeSessionId: string | null;
  questionQueue: readonly QuestionEvidenceReviewQueueItem[];
  progressMetrics: AuditProgressB5Metrics;
  onSelectActiveSession: (sessionId: string | null) => void;
  onOpenDocumentInPdfBridge: (documentId: string) => void;
  onUpdateIntakeRecord: (record: PersistedSourceIntakeRecord) => {
    success: boolean;
    error: string | null;
  };
  onCreateSession: (draft: AuditSessionDraftInput) => {
    success: boolean;
    session?: AuditSessionRecord;
    error?: string;
  };
  onTransitionSession: (
    sessionId: string,
    patch: {
      sessionStatus?: AuditSessionStatus;
      reviewedSections?: string[];
      linkedQuestionIds?: string[];
      pendingItems?: string[];
      sessionNotes?: string;
    }
  ) => { success: boolean; error?: string };
  onApplyDossierImport: (preview: AuditDossierImportPreview) => {
    success: boolean;
    error?: string;
  };
}

type B5TabKey = 'intake' | 'sessions' | 'questions' | 'dossier';

const B5_TABS: ReadonlyArray<{ key: B5TabKey; label: string }> = [
  { key: 'intake', label: '1. Source Intake & Proweniencja' },
  { key: 'sessions', label: '2. Sesje Audytu & Raport' },
  { key: 'questions', label: '3. Kolejka 8 Pytań ChPL' },
  { key: 'dossier', label: '4. Portable Audit Dossier' }
];

function triggerTextFileDownload(
  content: string,
  fileName: string,
  mimeType: string
): void {
  if (typeof document === 'undefined' || typeof URL === 'undefined' || !URL.createObjectURL) {
    return;
  }
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = 'noopener noreferrer';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const getReadinessBadgeTone = (
  status: SourceIntakeRecord['readinessStatus']
): 'ok' | 'warn' | 'danger' | 'neutral' => {
  switch (status) {
    case 'review_complete_pending_human_decision':
    case 'ready_for_manual_review':
      return 'ok';
    case 'review_requires_rework':
      return 'danger';
    case 'not_started':
      return 'neutral';
    default:
      return 'warn';
  }
};

export const AuditWorkspaceB5Panel: React.FC<AuditWorkspaceB5PanelProps> = React.memo(
  ({
    sources,
    checklist,
    allEntries,
    workingEntries,
    workingNotes,
    persistedIntake,
    intakeItems,
    sessions,
    activeSessionId,
    questionQueue,
    progressMetrics,
    onSelectActiveSession,
    onOpenDocumentInPdfBridge,
    onUpdateIntakeRecord,
    onCreateSession,
    onTransitionSession,
    onApplyDossierImport
  }) => {
    const uid = useId();
    const [activeTab, setActiveTab] = useState<B5TabKey>('intake');
    const [selectedIntakeDocId, setSelectedIntakeDocId] = useState<string | null>(null);
    const [showExtraRegistryRecords, setShowExtraRegistryRecords] = useState(false);

    // Formularz deklaracji proweniencji (dla aktywnego dokumentu w Intake)
    const [provLevel, setProvLevel] = useState<DocumentProvenanceLevel>(
      'official_origin_operator_declared'
    );
    const [provSourceName, setProvSourceName] = useState('RPL / URPLWMiPB');
    const [provSourceUrl, setProvSourceUrl] = useState('https://rejestry.ezdrowie.gov.pl/rpl');
    const [provDocIdent, setProvDocIdent] = useState('');
    const [provNote, setProvNote] = useState('');
    const [intakeFeedback, setIntakeFeedback] = useState<string | null>(null);

    // Stan formularza nowej sesji audytu
    const [sessionDocId, setSessionDocId] = useState<string>('doc-rpl-bcg10-19535');
    const [sessionScope, setSessionScope] = useState<string>(
      'Przegląd punktów QRD ChPL i weryfikacja strony PDF'
    );
    const [sessionOperator, setSessionOperator] = useState<string>('Operator audytu lokalnego');
    const [sessionQrdInput, setSessionQrdInput] = useState<string>('4.2, 4.3, 4.4');
    const [sessionLinkedQIds, setSessionLinkedQIds] = useState<string[]>([
      'dec-bcg-42-injection-site'
    ]);
    const [sessionNotesInput, setSessionNotesInput] = useState<string>('');
    const [sessionPendingInput, setSessionPendingInput] = useState<string>('');
    const [sessionFeedback, setSessionFeedback] = useState<string | null>(null);
    const [reportPreview, setReportPreview] = useState<{
      report: AuditSessionReport;
      html: string;
    } | null>(null);

    // Stan Eksportu / Importu Dossier
    const [exportScope, setExportScope] = useState<AuditDossierExportScope>(
      'full_metadata_and_history'
    );
    const [includeNotes, setIncludeNotes] = useState<boolean>(true);
    const [includeBaselineExtracts, setIncludeBaselineExtracts] = useState<boolean>(false);
    const [exportProductKey, setExportProductKey] = useState<SourceProductScopeKey>('bcg_10');
    const [exportQuestionId, setExportQuestionId] = useState<string>(
      checklist[0]?.id ?? 'dec-bcg-42-injection-site'
    );
    const [exportSelectedSessionIds, setExportSelectedSessionIds] = useState<string[]>([]);
    const [lastExportedDossier, setLastExportedDossier] = useState<AuditDossierPayload | null>(
      null
    );
    const [dossierRawJsonInput, setDossierRawJsonInput] = useState<string>('');
    const [dossierImportPreview, setDossierImportPreview] =
      useState<AuditDossierImportPreview | null>(null);
    const [dossierShaCheckStatus, setDossierShaCheckStatus] = useState<{
      status: 'matched' | 'mismatched' | 'not_present' | 'invalid';
      claimedSha256: string | null;
      computedSha256: string | null;
    } | null>(null);
    const [dossierFeedback, setDossierFeedback] = useState<string | null>(null);

    const displayedIntakeItems = useMemo(() => {
      if (showExtraRegistryRecords) {
        return intakeItems;
      }
      return intakeItems.filter((item) => item.isExpectedChecklistTarget);
    }, [intakeItems, showExtraRegistryRecords]);

    const activeIntakeItem = useMemo(
      () =>
        selectedIntakeDocId
          ? intakeItems.find((i) => i.source?.documentId === selectedIntakeDocId) ?? null
          : null,
      [intakeItems, selectedIntakeDocId]
    );

    const stage1AcquisitionQueue = useMemo(() => {
      const map = new Map(
        intakeItems
          .filter((i) => i.source !== null)
          .map((i) => [i.source!.documentId, i])
      );
      return STAGE1_ACQUISITION_QUEUE_DOCUMENT_IDS.map((docId) => map.get(docId)).filter(
        (x): x is SourceIntakeRecord => Boolean(x)
      );
    }, [intakeItems]);

    const getOrInitPersistedIntake = useCallback(
      (item: SourceIntakeRecord): PersistedSourceIntakeRecord => {
        const docId = item.source?.documentId ?? '';
        const prev = persistedIntake[docId];
        return {
          documentId: docId,
          checklist: { ...item.checklist },
          provenanceDeclaration: prev?.provenanceDeclaration ?? item.provenanceDeclaration,
          metadataOverrides: prev?.metadataOverrides ?? {},
          operatorNotes: prev?.operatorNotes ?? item.operatorNotes,
          manualReviewMarkedCompletePendingDecision:
            prev?.manualReviewMarkedCompletePendingDecision ??
            item.manualReviewMarkedCompletePendingDecision,
          updatedAt: new Date().toISOString()
        };
      },
      [persistedIntake]
    );

    const handleToggleIntakeStep = useCallback(
      (item: SourceIntakeRecord, key: SourceIntakeChecklistItemKey, checked: boolean) => {
        if (!item.source) {
          return;
        }
        const draft = getOrInitPersistedIntake(item);
        draft.checklist = { ...draft.checklist, [key]: checked };
        const res = onUpdateIntakeRecord(draft);
        setIntakeFeedback(
          res.success
            ? 'Zaktualizowano krok checklisty pozyskania i zapisano w localStorage.'
            : res.error
        );
      },
      [getOrInitPersistedIntake, onUpdateIntakeRecord]
    );

    const handleToggleManualCompletePending = useCallback(
      (item: SourceIntakeRecord, checked: boolean) => {
        if (!item.source) {
          return;
        }
        const draft = getOrInitPersistedIntake(item);
        draft.manualReviewMarkedCompletePendingDecision = checked;
        const res = onUpdateIntakeRecord(draft);
        setIntakeFeedback(
          res.success
            ? checked
              ? 'Oznaczono materiał roboczy jako skompletowany (nadal wymaga decyzji klinicznej człowieka).'
              : 'Cofnięto oznaczenie kompletności materiału roboczego.'
            : res.error
        );
      },
      [getOrInitPersistedIntake, onUpdateIntakeRecord]
    );

    const handleSaveProvenanceDeclaration = useCallback(
      (e: React.FormEvent, item: SourceIntakeRecord) => {
        e.preventDefault();
        if (!item.source) {
          return;
        }
        const decl: OperatorProvenanceDeclaration = {
          documentId: item.source.documentId,
          declaredOriginLevel:
            provLevel === 'official_origin_independently_confirmed'
              ? 'official_origin_operator_declared'
              : provLevel,
          declaredSourceName: provSourceName.trim() || item.source.authority,
          declaredSourceUrl: provSourceUrl.trim() || item.source.officialSourceUrl,
          declaredDocumentIdentifier:
            provDocIdent.trim() || item.source.rplIdOrRegistryNumber || '',
          declaredAt: new Date().toISOString(),
          operatorNote: provNote.trim(),
          isOperatorDeclaredOnly: true
        };
        const draft = getOrInitPersistedIntake(item);
        draft.provenanceDeclaration = decl;
        const res = onUpdateIntakeRecord(draft);
        setIntakeFeedback(
          res.success
            ? 'Zapisano deklarację pochodzenia operatora (isOperatorDeclaredOnly: true — nie stanowi niezależnego potwierdzenia kryptograficznego).'
            : res.error
        );
      },
      [
        getOrInitPersistedIntake,
        onUpdateIntakeRecord,
        provDocIdent,
        provLevel,
        provNote,
        provSourceName,
        provSourceUrl
      ]
    );

    const handleMetadataOverrideChange = useCallback(
      (item: SourceIntakeRecord, field: MetadataFieldKey, value: string) => {
        if (!item.source) {
          return;
        }
        const draft = getOrInitPersistedIntake(item);
        const nextOverrides = { ...draft.metadataOverrides };
        if (value.trim()) {
          nextOverrides[field] = value;
        } else {
          delete nextOverrides[field];
        }
        draft.metadataOverrides = nextOverrides;
        onUpdateIntakeRecord(draft);
      },
      [getOrInitPersistedIntake, onUpdateIntakeRecord]
    );

    const handleStartSessionForDoc = useCallback((docId: string) => {
      setSessionDocId(docId);
      setActiveTab('sessions');
    }, []);

    const handleSubmitNewSession = useCallback(
      (e: React.FormEvent) => {
        e.preventDefault();
        const reviewedSections = sessionQrdInput
          .split(',')
          .map((s) => s.trim())
          .filter((s) => isValidQrdSection(s));
        const pendingItems = sessionPendingInput
          .split(';')
          .map((s) => s.trim())
          .filter(Boolean);

        const res = onCreateSession({
          documentId: sessionDocId,
          operatorLabel: sessionOperator,
          scope: sessionScope,
          reviewedSections,
          linkedQuestionIds: sessionLinkedQIds,
          pendingItems,
          sessionNotes: sessionNotesInput
        });
        if (res.success && res.session) {
          onSelectActiveSession(res.session.sessionId);
          setSessionFeedback(
            `Rozpoczęto roboczą sesję ${res.session.sessionId} dla ${res.session.documentId}.`
          );
          setSessionNotesInput('');
          setSessionPendingInput('');
        } else {
          setSessionFeedback(res.error ?? 'Nie udało się utworzyć sesji audytu.');
        }
      },
      [
        onCreateSession,
        onSelectActiveSession,
        sessionDocId,
        sessionLinkedQIds,
        sessionNotesInput,
        sessionOperator,
        sessionPendingInput,
        sessionQrdInput,
        sessionScope
      ]
    );

    const handleGenerateReportPreview = useCallback(
      (session: AuditSessionRecord) => {
        const report = buildAuditSessionReport({
          session,
          sources,
          checklist,
          allEntries,
          workingNotes
        });
        const html = renderAuditSessionReportHtml(report);
        setReportPreview({ report, html });
      },
      [allEntries, checklist, sources, workingNotes]
    );

    const handleExportDossier = useCallback(async () => {
      const opts: AuditDossierExportOptions = {
        scope: exportScope,
        includeNotes: exportScope === 'without_notes' ? false : includeNotes,
        includeBaselineExtracts,
        selectedProductKey: exportScope === 'selected_product' ? exportProductKey : null,
        selectedQuestionId: exportScope === 'selected_question' ? exportQuestionId : null,
        selectedSessionIds:
          exportScope === 'selected_sessions' ? exportSelectedSessionIds : undefined
      };
      const payload = await buildAuditDossierExportPayloadWithSha256({
        options: opts,
        sources,
        persistedIntake,
        sessions,
        allEntries,
        workingNotes,
        queue: questionQueue
      });
      setLastExportedDossier(payload);
      const serialized = JSON.stringify(payload, null, 2);
      setDossierRawJsonInput(serialized);
      triggerTextFileDownload(
        serialized,
        `vaxnurse-audit-dossier-${payload.dossierId}.json`,
        'application/json;charset=utf-8'
      );
      setDossierFeedback(
        `Wygenerowano Portable Audit Dossier (${payload.schemaVersion}, bez bajtów PDF i danych pacjentów).`
      );
    }, [
      allEntries,
      exportProductKey,
      exportQuestionId,
      exportScope,
      exportSelectedSessionIds,
      includeBaselineExtracts,
      includeNotes,
      persistedIntake,
      questionQueue,
      sessions,
      sources,
      workingNotes
    ]);

    const handlePreviewDossierText = useCallback(
      async (rawText: string) => {
        const preview = parseAndPreviewAuditDossierImport(rawText, {
          sources,
          checklist,
          existingSessions: sessions,
          existingWorkingEntries: workingEntries,
          existingWorkingNotes: workingNotes,
          existingIntake: persistedIntake
        });
        setDossierImportPreview(preview);
        const shaRes = await verifyAuditDossierJsonSha256(rawText);
        setDossierShaCheckStatus(shaRes);
      },
      [checklist, persistedIntake, sessions, sources, workingEntries, workingNotes]
    );

    const handleDossierFileUpload = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          const text = typeof reader.result === 'string' ? reader.result : '';
          setDossierRawJsonInput(text);
          void handlePreviewDossierText(text);
        };
        reader.readAsText(file, 'utf-8');
      },
      [handlePreviewDossierText]
    );

    const handleTabKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
        let nextIndex: number | null = null;
        if (e.key === 'ArrowRight') {
          nextIndex = (currentIndex + 1) % B5_TABS.length;
        } else if (e.key === 'ArrowLeft') {
          nextIndex = (currentIndex - 1 + B5_TABS.length) % B5_TABS.length;
        } else if (e.key === 'Home') {
          nextIndex = 0;
        } else if (e.key === 'End') {
          nextIndex = B5_TABS.length - 1;
        }
        if (nextIndex !== null) {
          e.preventDefault();
          const targetTab = B5_TABS[nextIndex];
          setActiveTab(targetTab.key);
          const el = document.getElementById(`${uid}-tab-${targetTab.key}`);
          el?.focus();
        }
      },
      [uid]
    );

    const handleApplyImport = useCallback(() => {
      if (!dossierImportPreview || !dossierImportPreview.canImport) {
        return;
      }
      const res = onApplyDossierImport(dossierImportPreview);
      setDossierFeedback(
        res.success
          ? 'Zastosowano kontrolowane scalenie Dossier. Wszystkie importowane deklaracje weryfikacji pozostają oznaczone jako niepotwierdzone lokalnie.'
          : (res.error ?? 'Nie udało się zapisać danych z dossier.')
      );
    }, [dossierImportPreview, onApplyDossierImport]);

    return (
      <section
        id="wb-b5-audit-workspace"
        className="wb-b5-workspace-section"
        aria-labelledby={`${uid}-b5-heading`}
      >
        <div className="wb-b5-header-bar">
          <div>
            <h2 id={`${uid}-b5-heading`} className="wb-b5-main-title">
              Przestrzeń robocza audytu ChPL — Etap B5 (Source Intake · Sesje · 8 Pytań · Dossier)
            </h2>
            <nav aria-label="Ścieżka pracy audytora ChPL" className="wb-b5-breadcrumb">
              <span className="wb-b5-step-chip">1. Dokumenty (Source Intake)</span>
              <span className="wb-b5-step-sep" aria-hidden="true">
                <svg viewBox="0 0 12 12" width="12" height="12" focusable="false">
                  <path
                    d="M2 6h8M7 3l3 3-3 3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="wb-b5-step-chip">2. Sesje audytu</span>
              <span className="wb-b5-step-sep" aria-hidden="true">
                <svg viewBox="0 0 12 12" width="12" height="12" focusable="false">
                  <path
                    d="M2 6h8M7 3l3 3-3 3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="wb-b5-step-chip">3. Kolejka 8 pytań</span>
              <span className="wb-b5-step-sep" aria-hidden="true">
                <svg viewBox="0 0 12 12" width="12" height="12" focusable="false">
                  <path
                    d="M2 6h8M7 3l3 3-3 3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="wb-b5-step-chip">4. Dowody robocze</span>
              <span className="wb-b5-step-sep" aria-hidden="true">
                <svg viewBox="0 0 12 12" width="12" height="12" focusable="false">
                  <path
                    d="M2 6h8M7 3l3 3-3 3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="wb-b5-step-chip">5. Portable Dossier</span>
            </nav>
          </div>
          <span className="wb-pill-readonly-flag">
            <Lock size={14} aria-hidden="true" /> Tryb kontroli technicznej (brak automatycznych decyzji klinicznych)
          </span>
        </div>

        {/* 14-metrykowy Dashboard Postępu B5 */}
        <section
          className="wb-b5-dashboard-panel"
          aria-labelledby={`${uid}-b5-dashboard-heading`}
        >
          <h3 id={`${uid}-b5-dashboard-heading`} className="wb-b5-sub-title">
            Panel postępu technicznego audytu (14 metryk B5)
          </h3>
          <div className="wb-b5-disclaimer-box" role="note">
            <AlertTriangle size={16} aria-hidden="true" />
            <span>{B5_PROGRESS_DASHBOARD_DISCLAIMER}</span>
          </div>
          <div className="wb-b5-metrics-grid" data-testid="b5-progress-metrics-grid">
            <div className="wb-b5-metric-card">
              <span className="wb-b5-metric-val">{progressMetrics.totalSourceRecords}</span>
              <span className="wb-b5-metric-lbl">1. Wpisy źródłowe w rejestrze</span>
            </div>
            <div className="wb-b5-metric-card">
              <span className="wb-b5-metric-val">
                {progressMetrics.physicallyAcquiredInHistoryCount}
              </span>
              <span className="wb-b5-metric-lbl">2. Pozyskane / z historią PDF</span>
            </div>
            <div className="wb-b5-metric-card">
              <span className="wb-b5-metric-val">
                {progressMetrics.reloadReselectionRequiredCount}
              </span>
              <span className="wb-b5-metric-lbl">3. Wymagają ponownego wskazania po reloadzie</span>
            </div>
            <div className="wb-b5-metric-card">
              <span className="wb-b5-metric-val">{progressMetrics.unconfirmedOriginCount}</span>
              <span className="wb-b5-metric-lbl">4. Niepotwierdzone pochodzenie niezależnie</span>
            </div>
            <div className="wb-b5-metric-card">
              <span className="wb-b5-metric-val">{progressMetrics.artifactsWithSha256Count}</span>
              <span className="wb-b5-metric-lbl">5. Artefakty z obliczonym SHA-256</span>
            </div>
            <div className="wb-b5-metric-card">
              <span className="wb-b5-metric-val">
                {progressMetrics.artifactsComparedWithTrustedReferenceCount}
              </span>
              <span className="wb-b5-metric-lbl">6. Zgodne z zaufanym wzorcem SHA-256</span>
            </div>
            <div className="wb-b5-metric-card">
              <span className="wb-b5-metric-val">{progressMetrics.totalSessionsCount}</span>
              <span className="wb-b5-metric-lbl">7. Utworzone sesje audytu</span>
            </div>
            <div className="wb-b5-metric-card">
              <span className="wb-b5-metric-val">
                {progressMetrics.pausedOrInterruptedSessionsCount}
              </span>
              <span className="wb-b5-metric-lbl">8. Sesje wstrzymane / przerwane</span>
            </div>
            <div className="wb-b5-metric-card">
              <span className="wb-b5-metric-val">
                {progressMetrics.completedWorkingSessionsCount}
              </span>
              <span className="wb-b5-metric-lbl">9. Sesje zakończone roboczo</span>
            </div>
            <div className="wb-b5-metric-card">
              <span className="wb-b5-metric-val">
                {progressMetrics.evidencePendingReviewCount}
              </span>
              <span className="wb-b5-metric-lbl">10. Dowody oczekujące przeglądu PDF</span>
            </div>
            <div className="wb-b5-metric-card">
              <span className="wb-b5-metric-val">
                {progressMetrics.operatorConfirmedExcerptsCount}
              </span>
              <span className="wb-b5-metric-lbl">11. Fragmenty potwierdzone przez operatora</span>
            </div>
            <div className="wb-b5-metric-card">
              <span className="wb-b5-metric-val">
                {progressMetrics.evidenceRequiringReverificationCount}
              </span>
              <span className="wb-b5-metric-lbl">12. Dowody wymagające re-weryfikacji</span>
            </div>
            <div className="wb-b5-metric-card">
              <span className="wb-b5-metric-val">
                {progressMetrics.questionsWithoutConfirmedExcerptsCount}
              </span>
              <span className="wb-b5-metric-lbl">13. Pytania bez potwierdzonych cytatów PDF</span>
            </div>
            <div className="wb-b5-metric-card">
              <span className="wb-b5-metric-val">
                {progressMetrics.questionsAwaitingHumanDecisionCount}
              </span>
              <span className="wb-b5-metric-lbl">14. Pytania oczekujące decyzji człowieka</span>
            </div>
          </div>
        </section>

        {/* Pasek zakładek ARIA */}
        <div role="tablist" aria-label="Moduły przestrzeni roboczej B5" className="wb-b5-tablist">
          {B5_TABS.map((tab, tabIdx) => {
            const isSelected = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                id={`${uid}-tab-${tab.key}`}
                aria-selected={isSelected}
                aria-controls={`${uid}-panel-${tab.key}`}
                tabIndex={isSelected ? 0 : -1}
                className={`wb-b5-tab-btn${isSelected ? ' is-active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
                onKeyDown={(e) => handleTabKeyDown(e, tabIdx)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ZAKŁADKA 1: Source Intake, Proweniencja i Porównanie Metadanych */}
        {activeTab === 'intake' && (
          <div
            role="tabpanel"
            id={`${uid}-panel-intake`}
            aria-labelledby={`${uid}-tab-intake`}
            className="wb-b5-tabpanel"
          >
            <div className="wb-b5-tabpanel-head">
              <div>
                <h3 className="wb-b5-sub-title">
                  Kolejka pozyskania Etapu I (6 dokumentów ChPL/EPAR) i checklista 7 źródeł
                </h3>
                <p className="wb-b5-muted">
                  Endpoint HTTP 400 (<code>doc-rpl-spikevax-cen-endpoints</code>) oraz historyczny{' '}
                  <code>VaxigripTetra 2025/2026</code> nigdy nie stanowią aktualnych PDF.
                </p>
              </div>
              <label className="wb-b5-checkbox-inline">
                <input
                  type="checkbox"
                  checked={showExtraRegistryRecords}
                  onChange={(e) => setShowExtraRegistryRecords(e.target.checked)}
                />
                <span>Pokaż także endpoint HTTP 400 i dokument historyczny (łącznie {intakeItems.length})</span>
              </label>
            </div>

            {intakeFeedback && (
              <div className="wb-b5-status-banner" role="status">
                {intakeFeedback}
              </div>
            )}

            <section className="wb-b5-queue-strip" aria-label="Kolejka pozyskania Etapu I">
              <strong className="wb-b5-queue-label">Kolejka pozyskania 6 ChPL/EPAR:</strong>
              {stage1AcquisitionQueue.map((qItem) => (
                <button
                  key={qItem.checklistSlotId}
                  type="button"
                  className={`wb-b5-queue-pill${
                    selectedIntakeDocId === qItem.source?.documentId ? ' is-selected' : ''
                  }`}
                  onClick={() => {
                    if (qItem.source) {
                      setSelectedIntakeDocId(qItem.source.documentId);
                    }
                  }}
                >
                  {qItem.source?.documentId}:{' '}
                  {qItem.physicalPdfAvailableInSession
                    ? 'PDF w sesji'
                    : qItem.wasPreviouslySelectedLocally
                      ? 'Wymaga wskazania PDF'
                      : 'Brak PDF'}
                </button>
              ))}
            </section>

            <div
              className={`wb-b5-intake-grid${activeIntakeItem?.source ? '' : ' is-single'}`}
            >
              {/* Lista dokumentów Source Intake */}
              <div className="wb-b5-doc-list" data-testid="b5-intake-document-list">
                {displayedIntakeItems.map((item) => {
                  const docId = item.source?.documentId ?? item.checklistSlotId;
                  const isSelected = item.source?.documentId === selectedIntakeDocId;
                  const tone = getReadinessBadgeTone(item.readinessStatus);
                  return (
                    <article
                      key={item.checklistSlotId}
                      className={`wb-b5-doc-card${isSelected ? ' is-selected' : ''}`}
                      data-intake-doc-id={docId}
                    >
                      <div className="wb-b5-doc-card-top">
                        <div>
                          <code className="wb-code-id">{docId}</code>
                          <h4 className="wb-b5-doc-title">{item.expectedLabel}</h4>
                        </div>
                        <span className={`wb-b5-badge wb-b5-badge--${tone}`}>
                          {getDocumentReadinessLabel(item.readinessStatus)}
                        </span>
                      </div>

                      <div className="wb-b5-doc-meta-row">
                        <span>
                          Checklista: <strong>{item.checklistCompletedCount} / {item.checklistTotalCount}</strong>
                        </span>
                        <span>
                          Proweniencja: <strong>{getDocumentProvenanceLabel(item.provenanceLevel)}</strong>
                        </span>
                        {item.isMissingRegistryRecord && (
                          <span className="wb-b5-badge wb-b5-badge--danger">
                            Brak rekordu w Rejestrze Źródeł
                          </span>
                        )}
                        {item.isHistoricalRejectedForCurrentSeason && (
                          <span className="wb-b5-badge wb-b5-badge--danger">
                            Dokument historyczny (ODRZUCONY dla 2026/2027)
                          </span>
                        )}
                        {item.isFailedEndpointRecord && (
                          <span className="wb-b5-badge wb-b5-badge--danger">
                            Endpoint HTTP 400 (brak PDF)
                          </span>
                        )}
                      </div>

                      <div className="wb-b5-action-row">
                        {item.source && (
                          <>
                            <button
                              type="button"
                              className="wb-b5-btn-secondary"
                              onClick={() => setSelectedIntakeDocId(item.source!.documentId)}
                            >
                              <FileSearch size={14} aria-hidden="true" /> Szczegóły i metadane
                            </button>
                            <button
                              type="button"
                              className="wb-b5-btn-primary"
                              onClick={() => onOpenDocumentInPdfBridge(item.source!.documentId)}
                            >
                              <FolderOpen size={14} aria-hidden="true" /> Otwórz w Moście PDF
                            </button>
                            <button
                              type="button"
                              className="wb-b5-btn-secondary"
                              onClick={() => handleStartSessionForDoc(item.source!.documentId)}
                            >
                              <PlayCircle size={14} aria-hidden="true" /> Rozpocznij sesję
                            </button>
                          </>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Szczegóły aktywnie wybranego dokumentu */}
              {activeIntakeItem && activeIntakeItem.source && (
                <div
                  className="wb-b5-detail-pane"
                  data-testid="b5-intake-detail-pane"
                  aria-labelledby={`${uid}-detail-heading`}
                >
                  <h4 id={`${uid}-detail-heading`} className="wb-b5-detail-title">
                    Szczegóły dokumentu: <code>{activeIntakeItem.source.documentId}</code>
                  </h4>
                  <p className="wb-b5-muted">
                    Wersje historyczne artefaktów: <strong>{activeIntakeItem.historicalVersionsCount}</strong> |{' '}
                    Dowody powiązane: <strong>{activeIntakeItem.assignedEvidenceCount}</strong> |{' '}
                    Wymaga re-weryfikacji: <strong>{activeIntakeItem.reverificationEvidenceCount}</strong>
                  </p>

                  {/* 13-punktowa checklista */}
                  <fieldset className="wb-b5-fieldset">
                    <legend className="wb-b5-legend">13-krokowa checklista pozyskania i przeglądu</legend>
                    <div className="wb-b5-checklist-grid">
                      {SOURCE_INTAKE_CHECKLIST_DEFINITIONS.map((def) => (
                        <label key={def.key} className="wb-b5-check-item">
                          <input
                            type="checkbox"
                            checked={activeIntakeItem.checklist[def.key]}
                            disabled={def.kind === 'technical_fact'}
                            onChange={(e) =>
                              handleToggleIntakeStep(activeIntakeItem, def.key, e.target.checked)
                            }
                          />
                          <span>{def.label}</span>
                        </label>
                      ))}
                    </div>
                    <label className="wb-b5-check-item wb-b5-complete-toggle">
                      <input
                        type="checkbox"
                        checked={activeIntakeItem.manualReviewMarkedCompletePendingDecision}
                        onChange={(e) =>
                          handleToggleManualCompletePending(activeIntakeItem, e.target.checked)
                        }
                      />
                      <span>
                        Oznacz materiał roboczy jako skompletowany (nadal wymaga wiążącej decyzji klinicznej człowieka)
                      </span>
                    </label>
                  </fieldset>

                  {/* Porównanie 9 pól metadanych */}
                  <div className="wb-b5-meta-compare-wrap">
                    <h5 className="wb-b5-section-mini-title">
                      Porównanie 9 pól metadanych (Rejestr vs PDF / Obserwacja operatora)
                    </h5>
                    <div className="wb-b5-table-scroll">
                      <table className="wb-b5-table">
                        <thead>
                          <tr>
                            <th>Pole</th>
                            <th>Wartość w rejestrze</th>
                            <th>Wartość PDF / Korekta ręczna</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeIntakeItem.metadataComparisons.map((row) => (
                            <tr key={row.field}>
                              <td>{row.label}</td>
                              <td>{row.registryValue ?? '—'}</td>
                              <td>
                                <input
                                  type="text"
                                  className="wb-b5-inline-input"
                                  aria-label={`Zaobserwowana wartość pola ${METADATA_FIELD_LABELS[row.field]}`}
                                  value={
                                    persistedIntake[activeIntakeItem.source!.documentId]
                                      ?.metadataOverrides[row.field] ??
                                    row.observedValue ??
                                    ''
                                  }
                                  placeholder="Brak wartości w PDF"
                                  onChange={(e) =>
                                    handleMetadataOverrideChange(
                                      activeIntakeItem,
                                      row.field,
                                      e.target.value
                                    )
                                  }
                                />
                              </td>
                              <td>
                                <span
                                  className={`wb-b5-badge wb-b5-badge--${
                                    row.status === 'matches'
                                      ? 'ok'
                                      : row.status === 'conflict_requires_review'
                                        ? 'danger'
                                        : 'neutral'
                                  }`}
                                >
                                  {row.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Deklaracja proweniencji operatora */}
                  <form
                    className="wb-b5-subform"
                    onSubmit={(e) => handleSaveProvenanceDeclaration(e, activeIntakeItem)}
                  >
                    <h5 className="wb-b5-section-mini-title">
                      Deklaracja pochodzenia operatora (oddzielna od potwierdzenia niezależnego)
                    </h5>
                    <div className="wb-b5-form-grid">
                      <div>
                        <label htmlFor={`${uid}-prov-level`} className="wb-b5-field-lbl">
                          Deklarowany poziom pochodzenia
                        </label>
                        <select
                          id={`${uid}-prov-level`}
                          className="wb-select-input"
                          value={provLevel}
                          onChange={(e) =>
                            setProvLevel(e.target.value as DocumentProvenanceLevel)
                          }
                        >
                          <option value="official_origin_operator_declared">
                            official_origin_operator_declared (Deklaracja operatora)
                          </option>
                          <option value="origin_unknown">origin_unknown</option>
                          <option value="origin_mismatch">origin_mismatch</option>
                          <option value="manual_review_required">manual_review_required</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor={`${uid}-prov-name`} className="wb-b5-field-lbl">
                          Deklarowany organ / źródło
                        </label>
                        <input
                          id={`${uid}-prov-name`}
                          type="text"
                          className="wb-text-input"
                          value={provSourceName}
                          onChange={(e) => setProvSourceName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label htmlFor={`${uid}-prov-url`} className="wb-b5-field-lbl">
                          Deklarowany adres URL źródła (https://)
                        </label>
                        <input
                          id={`${uid}-prov-url`}
                          type="url"
                          className="wb-text-input"
                          value={provSourceUrl}
                          onChange={(e) => setProvSourceUrl(e.target.value)}
                        />
                      </div>
                      <div>
                        <label htmlFor={`${uid}-prov-id`} className="wb-b5-field-lbl">
                          Numer identyfikacyjny / RPL / EPAR
                        </label>
                        <input
                          id={`${uid}-prov-id`}
                          type="text"
                          className="wb-text-input"
                          value={provDocIdent}
                          onChange={(e) => setProvDocIdent(e.target.value)}
                          placeholder="np. 19535 lub EU/1/20/1507"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor={`${uid}-prov-note`} className="wb-b5-field-lbl">
                        Notatka operatora o pochodzeniu pliku
                      </label>
                      <input
                        id={`${uid}-prov-note`}
                        type="text"
                        className="wb-text-input"
                        value={provNote}
                        onChange={(e) => setProvNote(e.target.value)}
                        placeholder="np. Pobrano z RPL po weryfikacji numeru pozwolenia"
                      />
                    </div>
                    <button type="submit" className="wb-b5-btn-primary">
                      Zapisz deklarację pochodzenia operatora
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ZAKŁADKA 2: Sesje audytu i Raport sesji */}
        {activeTab === 'sessions' && (
          <div
            role="tabpanel"
            id={`${uid}-panel-sessions`}
            aria-labelledby={`${uid}-tab-sessions`}
            className="wb-b5-tabpanel"
          >
            <h3 className="wb-b5-sub-title">Zarządzanie sesjami audytu i Raport sesji</h3>
            <div className="wb-b5-disclaimer-box" role="note">
              <ShieldAlert size={16} aria-hidden="true" />
              <span>{AUDIT_SESSION_REPORT_DISCLAIMER}</span>
            </div>

            {sessionFeedback && (
              <div className="wb-b5-status-banner" role="status">
                {sessionFeedback}
              </div>
            )}

            <form className="wb-b5-subform" onSubmit={handleSubmitNewSession}>
              <h4 className="wb-b5-section-mini-title">Nowa sesja robocza audytu ChPL</h4>
              <div className="wb-b5-form-grid">
                <div>
                  <label htmlFor={`${uid}-sess-doc`} className="wb-b5-field-lbl">
                    Dokument źródłowy sesji
                  </label>
                  <select
                    id={`${uid}-sess-doc`}
                    className="wb-select-input"
                    value={sessionDocId}
                    onChange={(e) => setSessionDocId(e.target.value)}
                  >
                    {sources.map((s) => (
                      <option key={s.documentId} value={s.documentId}>
                        {s.documentId} — {s.documentTitle}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor={`${uid}-sess-scope`} className="wb-b5-field-lbl">
                    Zakres sesji audytu
                  </label>
                  <input
                    id={`${uid}-sess-scope`}
                    type="text"
                    className="wb-text-input"
                    value={sessionScope}
                    onChange={(e) => setSessionScope(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor={`${uid}-sess-qrd`} className="wb-b5-field-lbl">
                    Przeglądane punkty QRD (oddzielone przecinkami)
                  </label>
                  <input
                    id={`${uid}-sess-qrd`}
                    type="text"
                    className="wb-text-input"
                    value={sessionQrdInput}
                    onChange={(e) => setSessionQrdInput(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor={`${uid}-sess-operator`} className="wb-b5-field-lbl">
                    Etykieta operatora (robocza)
                  </label>
                  <input
                    id={`${uid}-sess-operator`}
                    type="text"
                    className="wb-text-input"
                    value={sessionOperator}
                    onChange={(e) => setSessionOperator(e.target.value)}
                  />
                </div>
              </div>

              <fieldset className="wb-b5-fieldset">
                <legend className="wb-b5-legend">Powiązane pytania audytowe ChPL</legend>
                <div className="wb-b5-checklist-grid">
                  {checklist.map((q) => (
                    <label key={q.id} className="wb-b5-check-item">
                      <input
                        type="checkbox"
                        checked={sessionLinkedQIds.includes(q.id)}
                        onChange={(e) => {
                          setSessionLinkedQIds((prev) =>
                            e.target.checked
                              ? [...prev, q.id]
                              : prev.filter((item) => item !== q.id)
                          );
                        }}
                      />
                      <span>
                        <code>{q.id}</code> ({q.chplSectionOrSubpoint})
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="wb-b5-form-grid">
                <div>
                  <label htmlFor={`${uid}-sess-pending`} className="wb-b5-field-lbl">
                    Kwestie otwarte (oddzielone średnikiem)
                  </label>
                  <input
                    id={`${uid}-sess-pending`}
                    type="text"
                    className="wb-text-input"
                    value={sessionPendingInput}
                    onChange={(e) => setSessionPendingInput(e.target.value)}
                    placeholder="np. Potwierdzić pkt 4.2 z RPL"
                  />
                </div>
                <div>
                  <label htmlFor={`${uid}-sess-notes`} className="wb-b5-field-lbl">
                    Notatki sesji roboczej
                  </label>
                  <input
                    id={`${uid}-sess-notes`}
                    type="text"
                    className="wb-text-input"
                    value={sessionNotesInput}
                    onChange={(e) => setSessionNotesInput(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="wb-b5-btn-primary">
                <PlayCircle size={14} aria-hidden="true" /> Rozpocznij roboczą sesję audytu
              </button>
            </form>

            {/* Lista sesji audytu */}
            <div className="wb-b5-session-list" data-testid="b5-sessions-list">
              {sessions.length === 0 ? (
                <p className="wb-b5-muted">Nie utworzono jeszcze żadnej roboczej sesji audytu.</p>
              ) : (
                sessions.map((sess) => {
                  const isActive = sess.sessionId === activeSessionId;
                  return (
                    <article
                      key={sess.sessionId}
                      className={`wb-b5-doc-card${isActive ? ' is-selected' : ''}`}
                      data-session-id={sess.sessionId}
                    >
                      <div className="wb-b5-doc-card-top">
                        <div>
                          <code className="wb-code-id">{sess.sessionId}</code>
                          <h4 className="wb-b5-doc-title">{sess.scope}</h4>
                        </div>
                        <span
                          className={`wb-b5-badge wb-b5-badge--${
                            sess.invalidatedByArtifactChange ||
                            sess.sessionStatus === 'requires_follow_up'
                              ? 'danger'
                              : sess.sessionStatus === 'completed_as_working_record'
                                ? 'ok'
                                : 'warn'
                          }`}
                        >
                          {getAuditSessionStatusLabel(sess.sessionStatus)}
                        </span>
                      </div>

                      <p className="wb-b5-muted">
                        Dokument: <code>{sess.documentId}</code> | Artefakt:{' '}
                        <code>{sess.artifactId ?? 'brak'}</code> | SHA-256:{' '}
                        <code>{sess.artifactSha256 ? `${sess.artifactSha256.slice(0, 16)}…` : 'brak'}</code>
                      </p>
                      <p className="wb-b5-muted">
                        Powiązane pytania: <strong>{sess.linkedQuestionIds.length}</strong> | Dowody sesji:{' '}
                        <strong>{sess.createdEvidenceIds.length}</strong>
                      </p>

                      {sess.requiresFileReselectionAfterReload && (
                        <div className="wb-b5-inline-alert wb-b5-inline-alert--warn" role="status">
                          <RefreshCw size={14} aria-hidden="true" />
                          <span>
                            Po przeładowaniu przeglądarki wymagane jest ponowne wskazanie pliku PDF z dysku. Zapisano metadane sesji i dowody.
                          </span>
                        </div>
                      )}

                      {sess.invalidatedByArtifactChange && (
                        <div className="wb-b5-inline-alert wb-b5-inline-alert--danger" role="alert">
                          <AlertTriangle size={14} aria-hidden="true" />
                          <span>
                            Zmiana skrótu SHA-256 pliku PDF unieważniła pierwotną spójność sesji. Sprawdź ponownie dowody.
                          </span>
                        </div>
                      )}

                      <div className="wb-b5-action-row">
                        <button
                          type="button"
                          className="wb-b5-btn-secondary"
                          onClick={() => onSelectActiveSession(sess.sessionId)}
                        >
                          <ClipboardCheck size={14} aria-hidden="true" /> Ustaw jako aktywną
                        </button>
                        <button
                          type="button"
                          className="wb-b5-btn-secondary"
                          onClick={() => onOpenDocumentInPdfBridge(sess.documentId)}
                        >
                          <FolderOpen size={14} aria-hidden="true" /> Wskaż PDF / Dodaj dowód
                        </button>
                        {sess.sessionStatus === 'in_progress' && (
                          <button
                            type="button"
                            className="wb-b5-btn-secondary"
                            onClick={() =>
                              onTransitionSession(sess.sessionId, { sessionStatus: 'paused' })
                            }
                          >
                            <PauseCircle size={14} aria-hidden="true" /> Wstrzymaj sesję
                          </button>
                        )}
                        {sess.sessionStatus === 'paused' && (
                          <button
                            type="button"
                            className="wb-b5-btn-secondary"
                            onClick={() =>
                              onTransitionSession(sess.sessionId, { sessionStatus: 'in_progress' })
                            }
                          >
                            <PlayCircle size={14} aria-hidden="true" /> Wznów sesję
                          </button>
                        )}
                        {sess.sessionStatus !== 'completed_as_working_record' && (
                          <button
                            type="button"
                            className="wb-b5-btn-primary"
                            onClick={() => {
                              const res = onTransitionSession(sess.sessionId, {
                                sessionStatus: 'completed_as_working_record'
                              });
                              if (!res.success && res.error) {
                                setSessionFeedback(res.error);
                              }
                            }}
                          >
                            <CheckCircle2 size={14} aria-hidden="true" /> Zakończ jako zapis roboczy
                          </button>
                        )}
                        <button
                          type="button"
                          className="wb-b5-btn-secondary"
                          onClick={() => handleGenerateReportPreview(sess)}
                        >
                          <FileCheck2 size={14} aria-hidden="true" /> Raport sesji (JSON / HTML)
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
            </div>

            {reportPreview && (
              <div className="wb-b5-report-preview" data-testid="b5-session-report-preview">
                <h4 className="wb-b5-section-mini-title">
                  Podgląd Raportu Sesji: <code>{reportPreview.report.session.sessionId}</code>
                </h4>
                <p className="wb-b5-muted">
                  <code>clinicalApprovalGranted: false</code> |{' '}
                  <code>containsPdfBytes: false</code> |{' '}
                  Pytania powiązane: {reportPreview.report.linkedQuestions.length} |{' '}
                  Dowody: {reportPreview.report.linkedEvidenceEntries.length}
                </p>
                <div className="wb-b5-action-row">
                  <button
                    type="button"
                    className="wb-b5-btn-primary"
                    onClick={() =>
                      triggerTextFileDownload(
                        JSON.stringify(reportPreview.report, null, 2),
                        `raport-sesji-${reportPreview.report.session.sessionId}.json`,
                        'application/json;charset=utf-8'
                      )
                    }
                  >
                    <Download size={14} aria-hidden="true" /> Pobierz Raport JSON
                  </button>
                  <button
                    type="button"
                    className="wb-b5-btn-secondary"
                    onClick={() =>
                      triggerTextFileDownload(
                        reportPreview.html,
                        `raport-sesji-${reportPreview.report.session.sessionId}.html`,
                        'text/html;charset=utf-8'
                      )
                    }
                  >
                    <Download size={14} aria-hidden="true" /> Pobierz Raport do druku (HTML)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ZAKŁADKA 3: Kolejka 8 pytań ChPL */}
        {activeTab === 'questions' && (
          <div
            role="tabpanel"
            id={`${uid}-panel-questions`}
            aria-labelledby={`${uid}-tab-questions`}
            className="wb-b5-tabpanel"
          >
            <h3 className="wb-b5-sub-title">
              Kolejka przeglądu dowodów — wszystkie 8 pytań Etapu I (autoResolved: false)
            </h3>
            <p className="wb-b5-muted">
              Kompletność procentowa poniżej oznacza wyłącznie kompletność techniczną ścieżki dowodowej, nigdy decyzję kliniczną.
            </p>
            <div className="wb-b5-questions-list" data-testid="b5-questions-queue-list">
              {questionQueue.map((q) => (
                <article
                  key={q.questionId}
                  className="wb-b5-doc-card"
                  data-queue-question-id={q.questionId}
                >
                  <div className="wb-b5-doc-card-top">
                    <div>
                      <code className="wb-code-id">{q.questionId}</code>
                      <h4 className="wb-b5-doc-title">
                        {q.productDisplayName} — {q.chplSectionOrSubpoint}
                      </h4>
                    </div>
                    <div className="wb-b5-badge-group">
                      <span className="wb-b5-badge wb-b5-badge--neutral">
                        {getQuestionB5WorkStatusLabel(q.workStatus)}
                      </span>
                      <span className="wb-pill-readonly-flag">
                        autoResolved: {String(q.autoResolved)}
                      </span>
                    </div>
                  </div>

                  <p className="wb-question-text">{q.clinicalQuestion}</p>
                  <p className="wb-b5-muted">
                    <strong>Kompletność techniczna ścieżki: {q.readiness.technicalCompletenessPercent}%</strong>{' '}
                    | Cytaty z B1: {q.bundleReferenceCount} | Potwierdzone PDF:{' '}
                    <strong>{q.confirmedExcerptCount}</strong> | Oczekujące: {q.pendingReviewCount} |{' '}
                    Konflikty: {q.conflictsCount} | Sesje: {q.linkedSessionsCount}
                  </p>
                  <p className="wb-b5-muted">
                    <strong>Następny krok techniczny:</strong> {q.nextRequiredStep}
                  </p>

                  <div className="wb-b5-action-row">
                    {q.requiredDocuments.map((doc) => (
                      <button
                        key={doc.documentId}
                        type="button"
                        className="wb-b5-btn-secondary"
                        onClick={() => onOpenDocumentInPdfBridge(doc.documentId)}
                      >
                        <History size={14} aria-hidden="true" />{' '}
                        {doc.documentId} ({doc.acquisitionStatus})
                      </button>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* ZAKŁADKA 4: Portable Audit Dossier (Eksport i Import Preview) */}
        {activeTab === 'dossier' && (
          <div
            role="tabpanel"
            id={`${uid}-panel-dossier`}
            aria-labelledby={`${uid}-tab-dossier`}
            className="wb-b5-tabpanel"
          >
            <h3 className="wb-b5-sub-title">
              Przenośne Audit Dossier (schemat 1.2.0-b5, migracja z 1.0.0 i 1.1.0)
            </h3>
            <div className="wb-b5-disclaimer-box" role="note">
              <Lock size={16} aria-hidden="true" />
              <span>{DOSSIER_PORTABLE_DISCLAIMER}</span>
            </div>
            <p className="wb-b5-muted">{DOSSIER_HASH_DISTINCTION_NOTICE}</p>

            {dossierFeedback && (
              <div className="wb-b5-status-banner" role="status">
                {dossierFeedback}
              </div>
            )}

            <div className="wb-b5-dossier-grid">
              {/* Panel eksportu */}
              <div className="wb-b5-subform">
                <h4 className="wb-b5-section-mini-title">Eksport Portable Audit Dossier</h4>
                <div>
                  <label htmlFor={`${uid}-exp-scope`} className="wb-b5-field-lbl">
                    Zakres eksportu Dossier
                  </label>
                  <select
                    id={`${uid}-exp-scope`}
                    className="wb-select-input"
                    value={exportScope}
                    onChange={(e) =>
                      setExportScope(e.target.value as AuditDossierExportScope)
                    }
                  >
                    <option value="full_metadata_and_history">
                      Pełne dossier metadanych i historii (bez bajtów PDF)
                    </option>
                    <option value="without_notes">
                      Bez nieformalnych notatek roboczych (without_notes)
                    </option>
                    <option value="selected_sessions">
                      Tylko wybrane sesje audytu
                    </option>
                    <option value="selected_product">
                      Wybrany preparat / zakres produktu
                    </option>
                    <option value="selected_question">
                      Pojedyncze pytanie z kolejki 8 pytań
                    </option>
                  </select>
                </div>

                {exportScope === 'selected_product' && (
                  <div>
                    <label htmlFor={`${uid}-exp-prod`} className="wb-b5-field-lbl">
                      Preparat / zakres do eksportu
                    </label>
                    <select
                      id={`${uid}-exp-prod`}
                      className="wb-select-input"
                      value={exportProductKey}
                      onChange={(e) =>
                        setExportProductKey(e.target.value as SourceProductScopeKey)
                      }
                    >
                      <option value="bcg_10">{getProductScopeLabel('bcg_10')}</option>
                      <option value="influvac_2026_2027">
                        {getProductScopeLabel('influvac_2026_2027')}
                      </option>
                      <option value="vaxigrip_2026_2027">
                        {getProductScopeLabel('vaxigrip_2026_2027')}
                      </option>
                      <option value="spikevax_xfg">{getProductScopeLabel('spikevax_xfg')}</option>
                      <option value="pso_2027_general">
                        {getProductScopeLabel('pso_2027_general')}
                      </option>
                      <option value="infanrix_hexa">
                        {getProductScopeLabel('infanrix_hexa')}
                      </option>
                    </select>
                  </div>
                )}

                {exportScope === 'selected_question' && (
                  <div>
                    <label htmlFor={`${uid}-exp-q`} className="wb-b5-field-lbl">
                      Pytanie audytowe do eksportu
                    </label>
                    <select
                      id={`${uid}-exp-q`}
                      className="wb-select-input"
                      value={exportQuestionId}
                      onChange={(e) => setExportQuestionId(e.target.value)}
                    >
                      {checklist.map((q) => (
                        <option key={q.id} value={q.id}>
                          {q.id} — {q.chplSectionOrSubpoint}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {exportScope === 'selected_sessions' && (
                  <fieldset className="wb-b5-fieldset">
                    <legend className="wb-b5-legend">Wybierz sesje do eksportu</legend>
                    {sessions.length === 0 ? (
                      <p className="wb-b5-muted">Brak utworzonych sesji audytu do eksportu.</p>
                    ) : (
                      sessions.map((s) => (
                        <label key={s.sessionId} className="wb-b5-check-item">
                          <input
                            type="checkbox"
                            checked={exportSelectedSessionIds.includes(s.sessionId)}
                            onChange={(e) =>
                              setExportSelectedSessionIds((prev) =>
                                e.target.checked
                                  ? [...prev, s.sessionId]
                                  : prev.filter((id) => id !== s.sessionId)
                              )
                            }
                          />
                          <span>
                            <code>{s.sessionId}</code> — {s.scope}
                          </span>
                        </label>
                      ))
                    )}
                  </fieldset>
                )}

                {exportScope !== 'without_notes' && (
                  <label className="wb-b5-check-item">
                    <input
                      type="checkbox"
                      checked={includeNotes}
                      onChange={(e) => setIncludeNotes(e.target.checked)}
                    />
                    <span>Dołącz nieformalne notatki robocze (bez podpisu prawnego)</span>
                  </label>
                )}

                <label className="wb-b5-check-item">
                  <input
                    type="checkbox"
                    checked={includeBaselineExtracts}
                    onChange={(e) => setIncludeBaselineExtracts(e.target.checked)}
                  />
                  <span>Dołącz wpisy bazowe z Etapu I (bundle_extract)</span>
                </label>

                <button
                  type="button"
                  className="wb-b5-btn-primary"
                  onClick={() => void handleExportDossier()}
                >
                  <Download size={14} aria-hidden="true" /> Wygeneruj i pobierz Portable Dossier (.json)
                </button>

                {lastExportedDossier && (
                  <div className="wb-b5-bound-box" data-testid="b5-last-export-summary">
                    <div>
                      <strong>Ostatni eksport:</strong> <code>{lastExportedDossier.dossierId}</code>
                    </div>
                    <div>
                      <strong>SHA-256 JSON Dossier:</strong>{' '}
                      <code>{lastExportedDossier.dossierJsonSha256 ?? 'brak'}</code>
                    </div>
                    <div>
                      <code>containsPdfBytes: false</code> | <code>containsBase64: false</code> |{' '}
                      <code>containsPatientData: false</code>
                    </div>
                  </div>
                )}
              </div>

              {/* Panel importu i podglądu */}
              <div className="wb-b5-subform">
                <h4 className="wb-b5-section-mini-title">
                  Import Preview i kontrolowane scalenie Dossier
                </h4>
                <div>
                  <label htmlFor={`${uid}-imp-file`} className="wb-b5-field-lbl">
                    Wybierz plik Portable Dossier (.json) lub wklej poniżej
                  </label>
                  <input
                    id={`${uid}-imp-file`}
                    type="file"
                    accept=".json,application/json"
                    className="wb-text-input"
                    onChange={handleDossierFileUpload}
                  />
                </div>

                <div>
                  <label htmlFor={`${uid}-imp-text`} className="wb-b5-field-lbl">
                    Treść JSON Dossier do analizy przed importem
                  </label>
                  <textarea
                    id={`${uid}-imp-text`}
                    className="wb-text-input wb-b5-textarea"
                    rows={5}
                    value={dossierRawJsonInput}
                    onChange={(e) => setDossierRawJsonInput(e.target.value)}
                    placeholder='Wklej JSON Dossier B5 (schemaVersion: "1.2.0-b5") lub starszy rejestr dowodów (1.0.0 / 1.1.0)'
                  />
                </div>

                <div className="wb-b5-action-row">
                  <button
                    type="button"
                    className="wb-b5-btn-secondary"
                    onClick={() => void handlePreviewDossierText(dossierRawJsonInput)}
                  >
                    <Upload size={14} aria-hidden="true" /> Analizuj podgląd importu Dossier
                  </button>
                  {dossierImportPreview && dossierImportPreview.canImport && (
                    <button
                      type="button"
                      className="wb-b5-btn-primary"
                      onClick={handleApplyImport}
                    >
                      <CheckCircle2 size={14} aria-hidden="true" /> Zastosuj kontrolowane scalenie Dossier
                    </button>
                  )}
                </div>

                {dossierImportPreview && (
                  <div className="wb-b5-preview-box" data-testid="b5-dossier-import-preview">
                    <div>
                      <strong>Status walidacji:</strong>{' '}
                      {dossierImportPreview.canImport ? 'GOTOWY DO SCALENIA' : 'ODRZUCONO'} (format:{' '}
                      <code>{dossierImportPreview.sourceFormatVersion}</code>)
                    </div>
                    {dossierShaCheckStatus && dossierShaCheckStatus.claimedSha256 && (
                      <div>
                        <strong>Sprawdzenie SHA-256 pliku JSON:</strong>{' '}
                        <code>{dossierShaCheckStatus.status}</code>
                      </div>
                    )}
                    {dossierImportPreview.migrationNote && (
                      <p className="wb-b5-muted">{dossierImportPreview.migrationNote}</p>
                    )}
                    <div>
                      Sesje: <strong>{dossierImportPreview.validSessions.length}</strong> | Dowody:{' '}
                      <strong>{dossierImportPreview.validEntries.length}</strong> | Notatki:{' '}
                      <strong>{dossierImportPreview.validNotes.length}</strong> | Konflikty:{' '}
                      <strong>{dossierImportPreview.conflictsCount}</strong> | Deklaracje zewnętrzne do re-weryfikacji:{' '}
                      <strong>{dossierImportPreview.externalVerificationClaimsCount}</strong>
                    </div>

                    {dossierImportPreview.errors.length > 0 && (
                      <ul className="wb-b5-error-list">
                        {dossierImportPreview.errors.map((err) => (
                          <li key={err}>{err}</li>
                        ))}
                      </ul>
                    )}

                    {dossierImportPreview.conflicts.length > 0 && (
                      <ul className="wb-b5-conflict-list">
                        {dossierImportPreview.conflicts.map((c, idx) => (
                          <li key={`${c.kind}-${c.id}-${idx}`}>
                            <code>{c.kind}</code> ({c.id}): {c.details}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    );
  }
);
