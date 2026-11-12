import type { Stage1HumanDecisionItem } from '../types/childVaccines';
import type {
  AuditDossierExportOptions,
  AuditDossierExportScope,
  AuditDossierImportConflict,
  AuditDossierImportPreview,
  AuditDossierPayload,
  AuditDossierReverificationRecord,
  AuditProgressB5Metrics,
  AuditSessionDraftInput,
  AuditSessionRecord,
  AuditSessionReport,
  AuditSessionStatus,
  DocumentArtifactRecord,
  DocumentAuditReadinessStatus,
  DocumentProvenanceLevel,
  EvidenceLedgerEntry,
  EvidenceLedgerImportRejectedItem,
  EvidenceLedgerStorageSaveResult,
  EvidenceQualificationClass,
  FileAvailabilityStatus,
  InformalWorkingNote,
  MetadataFieldComparison,
  MetadataFieldComparisonResult,
  MetadataFieldKey,
  OperatorProvenanceDeclaration,
  PersistedSourceIntakeRecord,
  QuestionB5WorkStatus,
  QuestionEvidenceReviewQueueItem,
  QuestionTechnicalReadinessCheck,
  SourceIntakeChecklistItemKey,
  SourceIntakeChecklistState,
  SourceIntakeRecord,
  SourceRegistryEntry
} from '../types/evidenceLedger';
import {
  hasPrototypePollutionKey,
  isPlainRecord,
  isValidDateString,
  isValidHttpUrl
} from './catalogMerge';
import {
  EVIDENCE_LEDGER_SCHEMA_VERSION,
  LEGACY_B2_EVIDENCE_LEDGER_SCHEMA_VERSION,
  SOURCE_REGISTRY_VERSION,
  getProductScopeLabel,
  isValidQrdSection,
  isValidSha256Hex,
  parseAndPreviewEvidenceLedgerImport,
  validateImportedEvidenceEntryObject,
  validateImportedWorkingNoteObject
} from './chplEvidenceLedger';
import { computeSha256HexFromBytes } from './localPdfBridge';

// ============================================================================
// Stałe i komunikaty bezpieczeństwa Etapu B5
// ============================================================================

export const SOURCE_INTAKE_STORAGE_KEY = 'vaxnurse_chpl_source_intake_v1';
export const SOURCE_INTAKE_SCHEMA_VERSION = '1.0.0';

export const AUDIT_SESSIONS_STORAGE_KEY = 'vaxnurse_chpl_audit_sessions_v1';
export const AUDIT_SESSIONS_SCHEMA_VERSION = '1.0.0';

export const AUDIT_DOSSIER_SCHEMA_VERSION = '1.2.0-b5' as const;
export const SUPPORTED_DOSSIER_SCHEMA_VERSIONS: readonly string[] = [
  LEGACY_B2_EVIDENCE_LEDGER_SCHEMA_VERSION,
  EVIDENCE_LEDGER_SCHEMA_VERSION,
  AUDIT_DOSSIER_SCHEMA_VERSION
] as const;

export const MAX_OPERATOR_NOTE_LENGTH = 1500;
export const MAX_SESSION_SCOPE_LENGTH = 240;
export const MAX_SESSION_NOTES_LENGTH = 2000;

export const B5_PROGRESS_DASHBOARD_DISCLAIMER =
  'Metryki B5 pokazują wyłącznie postęp techniczny dokumentacji audytowej (artefakty PDF, sesje robocze, odniesienia i dowody). Nie stanowią oceny klinicznej ani zatwierdzenia preparatów.';

export const AUDIT_SESSION_REPORT_DISCLAIMER =
  'Raport sesji dokumentuje czynności robocze operatora nad wskazanym dokumentem PDF. Nie stanowi decyzji klinicznej, akceptacji ChPL/PSO ani certyfikatu zgodności.';

export const DOSSIER_HASH_DISTINCTION_NOTICE =
  'Rozróżnienie skrótów SHA-256: (1) artifactSha256 / sourceDocumentHash dotyczy lokalnych bajtów źródłowego PDF; (2) dossierJsonSha256 dotyczy struktury JSON tego dossier; (3) importedClaimSha256 oznacza deklarację z zewnętrznego pliku wymagającą lokalnego potwierdzenia; (4) trustedReferenceSha256 oznacza zaufany punkt odniesienia repozytorium.';

export const DOSSIER_PORTABLE_DISCLAIMER =
  'Przenośne dossier audytowe przenosi wyłącznie metadane techniczne, sesje robocze i dowody bez bajtów PDF oraz bez danych pacjentów. Importowane deklaracje weryfikacji pozostają niepotwierdzone lokalnie.';

const FORBIDDEN_BINARY_PAYLOAD_KEYS = new Set([
  'bytes',
  'data',
  'base64',
  'pdfData',
  'arrayBuffer',
  'rawPdf',
  'rawText'
]);

const FORBIDDEN_CLINICAL_APPROVAL_TOKENS = new Set([
  'verified_chpl',
  'verified_full',
  'clinically_approved'
]);

const DANGEROUS_TEXT_PATTERNS: readonly RegExp[] = [
  /<\s*script\b/i,
  /<\/\s*script\s*>/i,
  /javascript\s*:/i,
  /\bonerror\s*=/i,
  /\bonload\s*=/i,
  /<\s*iframe\b/i
];

function hasLivePhysicalPdfInSession(doc: SourceRegistryEntry | undefined | null): boolean {
  if (!doc || !doc.currentArtifact || !doc.currentArtifact.localArtifactId) {
    return false;
  }
  if (
    doc.currentArtifact.localPreviewStatus === 'reselection_required_after_reload' ||
    doc.statusAxes.fileAvailability === 'metadata_only_reload_required'
  ) {
    return false;
  }
  return true;
}

export interface ExpectedSourceIntakeTarget {
  checklistSlotId: string;
  documentId: string;
  expectedLabel: string;
  requiresStage1ManualAcquisition: boolean;
}

export const EXPECTED_SOURCE_INTAKE_TARGETS: readonly ExpectedSourceIntakeTarget[] = [
  {
    checklistSlotId: 'intake-slot-influvac',
    documentId: 'doc-rpl-influvac-49462',
    expectedLabel: 'ChPL Influvac (RPL 49462, sezon 2026/2027)',
    requiresStage1ManualAcquisition: true
  },
  {
    checklistSlotId: 'intake-slot-vaxigrip',
    documentId: 'doc-rpl-vaxigrip-50032',
    expectedLabel: 'ChPL Vaxigrip (RPL 50032, sezon 2026/2027)',
    requiresStage1ManualAcquisition: true
  },
  {
    checklistSlotId: 'intake-slot-spikevax-pl',
    documentId: 'doc-ema-spikevax-xfg-pl',
    expectedLabel: 'Spikevax XFG — EPAR Product Information PL',
    requiresStage1ManualAcquisition: true
  },
  {
    checklistSlotId: 'intake-slot-spikevax-en',
    documentId: 'doc-ema-spikevax-xfg-en',
    expectedLabel: 'Spikevax XFG — EPAR Product Information EN',
    requiresStage1ManualAcquisition: true
  },
  {
    checklistSlotId: 'intake-slot-bcg10',
    documentId: 'doc-rpl-bcg10-19535',
    expectedLabel: 'ChPL BCG 10 (RPL 19535)',
    requiresStage1ManualAcquisition: true
  },
  {
    checklistSlotId: 'intake-slot-infanrix-hexa',
    documentId: 'doc-gsk-infanrix-hexa-pl',
    expectedLabel: 'ChPL Infanrix hexa PL (weryfikacja rozbieżności pkt 2 vs 4.4)',
    requiresStage1ManualAcquisition: true
  },
  {
    checklistSlotId: 'intake-slot-pso-akt',
    documentId: 'doc-mz-pso-2027-akt',
    expectedLabel: 'PSO 2027 — komunikat MZ / GIS (lokalny plik akt.pdf)',
    requiresStage1ManualAcquisition: false
  }
];

export const STAGE1_ACQUISITION_QUEUE_DOCUMENT_IDS: readonly string[] = [
  'doc-rpl-influvac-49462',
  'doc-rpl-vaxigrip-50032',
  'doc-ema-spikevax-xfg-pl',
  'doc-ema-spikevax-xfg-en',
  'doc-rpl-bcg10-19535',
  'doc-gsk-infanrix-hexa-pl'
] as const;

export interface SourceIntakeChecklistDefinition {
  key: SourceIntakeChecklistItemKey;
  label: string;
  kind: 'technical_fact' | 'operator_action';
}

export const SOURCE_INTAKE_CHECKLIST_DEFINITIONS: readonly SourceIntakeChecklistDefinition[] = [
  {
    key: 'identified_official_source',
    label: '1. Zidentyfikowano oficjalne źródło / URL urzędowe',
    kind: 'technical_fact'
  },
  {
    key: 'downloaded_local_pdf',
    label: '2. Pobrano lokalny plik PDF z rejestru lub źródła urzędowego',
    kind: 'operator_action'
  },
  {
    key: 'selected_pdf_in_app',
    label: '3. Wskazano plik PDF w aplikacji (mostek lokalny File API)',
    kind: 'technical_fact'
  },
  {
    key: 'verified_signature_and_structure',
    label: '4. Sprawdzono sygnaturę binarną %PDF- i strukturę dokumentu',
    kind: 'technical_fact'
  },
  {
    key: 'calculated_sha256',
    label: '5. Wyliczono lokalny skrót SHA-256 w Web Crypto API',
    kind: 'technical_fact'
  },
  {
    key: 'read_page_count',
    label: '6. Odczytano fizyczną liczbę stron PDF',
    kind: 'technical_fact'
  },
  {
    key: 'checked_language',
    label: '7. Sprawdzono język dokumentu (PL / EN)',
    kind: 'operator_action'
  },
  {
    key: 'checked_version_and_date',
    label: '8. Sprawdzono wersję dokumentu i datę zatwierdzenia ChPL / EPAR',
    kind: 'operator_action'
  },
  {
    key: 'compared_available_metadata',
    label: '9. Porównano metadane PDF z wpisem w Rejestrze Źródeł',
    kind: 'operator_action'
  },
  {
    key: 'reviewed_in_preview',
    label: '10. Przejrzano strony dokumentu w podglądzie PDF.js',
    kind: 'operator_action'
  },
  {
    key: 'identified_qrd_sections',
    label: '11. Wskazano właściwe punkty QRD dla audytu',
    kind: 'operator_action'
  },
  {
    key: 'registered_local_evidence',
    label: '12. Powiązano lokalne wpisy dowodowe z dokumentem i stroną PDF',
    kind: 'operator_action'
  },
  {
    key: 'flagged_remaining_human_decisions',
    label: '13. Oznaczono kwestie kliniczne nadal wymagające decyzji człowieka',
    kind: 'operator_action'
  }
];

export const METADATA_FIELD_LABELS: Readonly<Record<MetadataFieldKey, string>> = {
  authorizationNumber: 'Numer pozwolenia na dopuszczenie do obrotu',
  rplId: 'Identyfikator RPL',
  eparId: 'Identyfikator EMA / EPAR',
  title: 'Tytuł dokumentu',
  holder: 'Podmiot / organ wydający',
  language: 'Język dokumentu',
  documentDate: 'Data dokumentu / zatwierdzenia',
  versionLabel: 'Wersja dokumentu / sezon',
  pageCount: 'Liczba stron fizycznych PDF'
};

export const ALLOWED_AUDIT_SESSION_STATUSES: readonly AuditSessionStatus[] = [
  'draft',
  'in_progress',
  'paused',
  'completed_as_working_record',
  'requires_follow_up'
] as const;

export const ALLOWED_PROVENANCE_LEVELS: readonly DocumentProvenanceLevel[] = [
  'official_origin_independently_confirmed',
  'official_origin_operator_declared',
  'origin_unknown',
  'origin_mismatch',
  'manual_review_required'
] as const;

export const ALLOWED_EXPORT_SCOPES: readonly AuditDossierExportScope[] = [
  'full_metadata_and_history',
  'without_notes',
  'selected_sessions',
  'selected_product',
  'selected_question'
] as const;

// ============================================================================
// Pomocnicze walidatory bezpieczeństwa i normalizacji tekstu
// ============================================================================

export function containsDangerousTextPattern(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false;
  }
  return DANGEROUS_TEXT_PATTERNS.some((pattern) => pattern.test(value));
}

function hasAnyDangerousStringsRecursive(value: unknown, seen: Set<unknown> = new Set()): boolean {
  if (typeof value === 'string') {
    return containsDangerousTextPattern(value);
  }
  if (!value || typeof value !== 'object') {
    return false;
  }
  if (seen.has(value)) {
    return false;
  }
  seen.add(value);
  if (Array.isArray(value)) {
    return value.some((item) => hasAnyDangerousStringsRecursive(item, seen));
  }
  for (const v of Object.values(value as Record<string, unknown>)) {
    if (hasAnyDangerousStringsRecursive(v, seen)) {
      return true;
    }
  }
  return false;
}

export function hasForbiddenBinaryOrBase64Payload(
  value: unknown,
  seen: Set<unknown> = new Set()
): boolean {
  if (typeof value === 'string') {
    if (/^data:application\/pdf;base64,/i.test(value.trim())) {
      return true;
    }
    if (value.trim().startsWith('%PDF-') || value.trim().startsWith('JVBERi0')) {
      return true;
    }
    return false;
  }
  if (!value || typeof value !== 'object') {
    return false;
  }
  if (seen.has(value)) {
    return false;
  }
  seen.add(value);
  if (Array.isArray(value)) {
    return value.some((item) => hasForbiddenBinaryOrBase64Payload(item, seen));
  }
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (FORBIDDEN_BINARY_PAYLOAD_KEYS.has(k)) {
      return true;
    }
    if (hasForbiddenBinaryOrBase64Payload(v, seen)) {
      return true;
    }
  }
  return false;
}

function containsForbiddenClinicalApprovalClaim(
  value: unknown,
  seen: Set<unknown> = new Set()
): boolean {
  if (typeof value === 'string') {
    return FORBIDDEN_CLINICAL_APPROVAL_TOKENS.has(value.trim());
  }
  if (!value || typeof value !== 'object') {
    return false;
  }
  if (seen.has(value)) {
    return false;
  }
  seen.add(value);
  if (Array.isArray(value)) {
    return value.some((item) => containsForbiddenClinicalApprovalClaim(item, seen));
  }
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (k === 'clinicalApprovalGranted' && v === true) {
      return true;
    }
    if (k === 'autoResolved' && v === true) {
      return true;
    }
    if (containsForbiddenClinicalApprovalClaim(v, seen)) {
      return true;
    }
  }
  return false;
}

function normalizeComparableText(value: string | null | undefined): string {
  return (value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
}

export function escapeHtmlForReport(raw: string | null | undefined): string {
  if (!raw) {
    return '';
  }
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeTextInput(raw: string | null | undefined, maxLength: number): string {
  if (!raw) {
    return '';
  }
  const trimmed = raw.trim();
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

// ============================================================================
// Etap B5 — Część 1: Source Intake, Proweniencja i Porównanie Metadanych
// ============================================================================

export function createDefaultSourceIntakeChecklist(): SourceIntakeChecklistState {
  return {
    identified_official_source: false,
    downloaded_local_pdf: false,
    selected_pdf_in_app: false,
    verified_signature_and_structure: false,
    calculated_sha256: false,
    read_page_count: false,
    checked_language: false,
    checked_version_and_date: false,
    compared_available_metadata: false,
    reviewed_in_preview: false,
    identified_qrd_sections: false,
    registered_local_evidence: false,
    flagged_remaining_human_decisions: false
  };
}

export function reconcileIntakeChecklistWithSource(
  persistedChecklist: Partial<SourceIntakeChecklistState> | null | undefined,
  source: SourceRegistryEntry | null,
  hasAssignedEvidence: boolean
): SourceIntakeChecklistState {
  const base = createDefaultSourceIntakeChecklist();
  if (persistedChecklist) {
    for (const def of SOURCE_INTAKE_CHECKLIST_DEFINITIONS) {
      base[def.key] = Boolean(persistedChecklist[def.key]);
    }
  }

  if (!source) {
    // Brak wpisu w Rejestrze Źródeł — nigdy nie udawaj dostępności ani weryfikacji pliku
    return {
      ...base,
      identified_official_source: false,
      selected_pdf_in_app: false,
      verified_signature_and_structure: false,
      calculated_sha256: false,
      read_page_count: false
    };
  }

  const isFailedEndpoint =
    source.objectType === 'official_endpoint' ||
    source.statusAxes.acquisitionStatus === 'access_failed';

  const hasCurrentArtifact = Boolean(source.currentArtifact);
  const hasRealPdf =
    !isFailedEndpoint &&
    (source.statusAxes.acquisitionStatus === 'acquired' ||
      source.statusAxes.fileAvailability === 'verified_in_session' ||
      source.statusAxes.fileAvailability === 'selected_in_session' ||
      hasCurrentArtifact);

  const hasVerifiedStructure =
    hasRealPdf &&
    (Boolean(source.currentArtifact?.pdfMetadata) ||
      source.physicalPageCount !== null);

  const hasCalculatedSha256 =
    !isFailedEndpoint &&
    Boolean(source.currentArtifact?.hashProvenance.value || source.sha256) &&
    hasRealPdf;

  const hasPhysicalPages =
    !isFailedEndpoint &&
    source.physicalPageCount !== null &&
    source.physicalPageCount > 0;

  return {
    ...base,
    identified_official_source:
      Boolean(source.officialSourceUrl) && !source.isHistoricalRejectedForCurrentSeason,
    selected_pdf_in_app: hasCurrentArtifact || Boolean(source.hasPersistedLocalArtifactMetadata) || base.selected_pdf_in_app,
    verified_signature_and_structure: hasVerifiedStructure,
    calculated_sha256: hasCalculatedSha256,
    read_page_count: hasPhysicalPages,
    reviewed_in_preview:
      source.currentArtifact?.localPreviewStatus === 'previewed_in_session'
        ? true
        : base.reviewed_in_preview,
    registered_local_evidence: hasAssignedEvidence || base.registered_local_evidence
  };
}

/**
 * Aktualizuje wyłącznie techniczne pola intake po załadowaniu lokalnego pliku PDF w mostku File API.
 * Nigdy nie oznacza kroków oceny ludzkiej (sprawdzenie języka, wersji, porównania metadanych, QRD) jako zakończonych.
 */
export function applyPdfInspectionToPersistedIntake(
  existing: PersistedSourceIntakeRecord | undefined,
  doc: SourceRegistryEntry,
  now: Date = new Date()
): PersistedSourceIntakeRecord {
  const baseChecklist = existing?.checklist
    ? { ...createDefaultSourceIntakeChecklist(), ...existing.checklist }
    : createDefaultSourceIntakeChecklist();

  const updatedChecklist: SourceIntakeChecklistState = {
    ...baseChecklist,
    identified_official_source: Boolean(doc.officialSourceUrl),
    downloaded_local_pdf: true,
    selected_pdf_in_app: true,
    verified_signature_and_structure: true,
    calculated_sha256: Boolean(doc.sha256),
    read_page_count: doc.physicalPageCount !== null
  };

  return {
    documentId: doc.documentId,
    checklist: updatedChecklist,
    provenanceDeclaration: existing?.provenanceDeclaration ?? null,
    metadataOverrides: existing?.metadataOverrides ?? {},
    operatorNotes: existing?.operatorNotes ?? '',
    manualReviewMarkedCompletePendingDecision:
      existing?.manualReviewMarkedCompletePendingDecision ?? false,
    updatedAt: now.toISOString()
  };
}

export function computeDocumentProvenanceLevel(
  source: SourceRegistryEntry | null,
  persisted: PersistedSourceIntakeRecord | null
): DocumentProvenanceLevel {
  if (!source) {
    return 'origin_unknown';
  }
  if (
    source.statusAxes.originStatus === 'origin_mismatch' ||
    source.statusAxes.integrityStatus === 'hash_mismatch' ||
    source.isHistoricalRejectedForCurrentSeason ||
    persisted?.provenanceDeclaration?.declaredOriginLevel === 'origin_mismatch'
  ) {
    return 'origin_mismatch';
  }

  // Niezależne potwierdzenie techniczne wymaga ZARÓWNO statusu źródłowego jak i zaufanego SHA-256 repozytorium
  if (
    source.statusAxes.originStatus === 'official_origin_confirmed' &&
    source.currentArtifact?.hashProvenance.comparisonStatus === 'compared_with_trusted_reference'
  ) {
    return 'official_origin_independently_confirmed';
  }

  if (persisted?.provenanceDeclaration) {
    const declared = persisted.provenanceDeclaration.declaredOriginLevel;
    // Deklaracja operatora bez potwierdzenia technicznego nigdy nie staje się niezależnym potwierdzeniem
    if (
      declared === 'official_origin_independently_confirmed' ||
      declared === 'official_origin_operator_declared'
    ) {
      return 'official_origin_operator_declared';
    }
    if (declared === 'manual_review_required') {
      return 'manual_review_required';
    }
  }

  if (
    source.sourceVerificationStatus === 'requires_manual_review' ||
    source.statusAxes.originStatus === 'manual_review_required'
  ) {
    return 'manual_review_required';
  }

  return 'origin_unknown';
}

function extractIdentifiersFromSource(source: SourceRegistryEntry | null): {
  authorizationNumber: string | null;
  rplId: string | null;
  eparId: string | null;
} {
  if (!source) {
    return { authorizationNumber: null, rplId: null, eparId: null };
  }
  const idStr = source.rplIdOrRegistryNumber ?? '';
  const urlStr = source.officialSourceUrl ?? '';

  let rplId: string | null = idStr || null;
  if (!rplId) {
    const rplMatch = `${source.documentId}`.match(/rpl-[a-z0-9-]+-(\d{4,6})/i);
    if (rplMatch) {
      rplId = rplMatch[1];
    } else {
      const urlRpl = urlStr.match(/\/medicinal-products\/(\d{4,6})/i);
      if (urlRpl) {
        rplId = urlRpl[1];
      }
    }
  }

  let eparId: string | null = null;
  if (source.authorityType === 'ema_epar' || /ema\.europa\.eu/i.test(urlStr)) {
    const emaMatch = idStr.match(/(EMEA\/H\/C\/\d+|EMA[^\s,;]+)/i);
    eparId = emaMatch ? emaMatch[1] : idStr || null;
  }

  return {
    authorizationNumber: source.marketingAuthorizationNumber ?? null,
    rplId,
    eparId
  };
}

export function evaluateMetadataComparison(
  source: SourceRegistryEntry | null,
  persisted: PersistedSourceIntakeRecord | null
): MetadataFieldComparison[] {
  const overrides = persisted?.metadataOverrides ?? {};
  const ids = extractIdentifiersFromSource(source);
  const pdfMeta = source?.currentArtifact?.pdfMetadata ?? null;

  const buildField = (
    field: MetadataFieldKey,
    registryValue: string | null,
    observedValue: string | null,
    explicitStatus?: MetadataFieldComparisonResult
  ): MetadataFieldComparison => {
    const cleanReg = registryValue?.trim() || null;
    const cleanObs = observedValue?.trim() || null;

    let status: MetadataFieldComparisonResult = explicitStatus ?? 'not_checked';
    if (!explicitStatus) {
      if (cleanReg && cleanObs) {
        status =
          normalizeComparableText(cleanReg) === normalizeComparableText(cleanObs) ||
          normalizeComparableText(cleanObs).includes(normalizeComparableText(cleanReg)) ||
          normalizeComparableText(cleanReg).includes(normalizeComparableText(cleanObs))
            ? 'matches'
            : 'conflict_requires_review';
      } else if (cleanReg || cleanObs) {
        status = 'missing_in_pdf_or_registry';
      } else {
        status = 'not_checked';
      }
    }

    return {
      field,
      label: METADATA_FIELD_LABELS[field],
      registryValue: cleanReg,
      observedValue: cleanObs,
      status
    };
  };

  const pageObserved =
    overrides.pageCount ??
    (source?.physicalPageCount !== null && source?.physicalPageCount !== undefined
      ? String(source.physicalPageCount)
      : null);

  const regPages =
    source?.registryReferencePageCount !== null && source?.registryReferencePageCount !== undefined
      ? String(source.registryReferencePageCount)
      : null;

  let pageStatus: MetadataFieldComparisonResult | undefined;
  if (regPages && pageObserved) {
    if (overrides.pageCount) {
      pageStatus = regPages === pageObserved ? 'matches' : 'conflict_requires_review';
    } else if (source?.pageCountComparisonStatus === 'matches') {
      pageStatus = 'matches';
    } else if (source?.pageCountComparisonStatus === 'mismatch') {
      pageStatus = 'conflict_requires_review';
    }
  }

  return [
    buildField('authorizationNumber', ids.authorizationNumber, overrides.authorizationNumber ?? null),
    buildField('rplId', ids.rplId, overrides.rplId ?? null),
    buildField('eparId', ids.eparId, overrides.eparId ?? null),
    buildField(
      'title',
      source?.documentTitle ?? null,
      overrides.title ?? pdfMeta?.title ?? source?.currentArtifact?.fileName ?? null
    ),
    buildField(
      'holder',
      source?.marketingAuthorizationHolder ?? source?.authority ?? null,
      overrides.holder ?? pdfMeta?.author ?? null
    ),
    buildField(
      'language',
      source?.language ?? null,
      overrides.language ?? null
    ),
    buildField(
      'documentDate',
      source?.revisionDate ?? source?.publicationDate ?? null,
      overrides.documentDate ?? pdfMeta?.modDate ?? pdfMeta?.creationDate ?? null
    ),
    buildField('versionLabel', source?.pdfScopeRange ?? null, overrides.versionLabel ?? null),
    buildField('pageCount', regPages, pageObserved, pageStatus)
  ];
}

export function computeDocumentAuditReadiness(params: {
  source: SourceRegistryEntry | null;
  checklist: SourceIntakeChecklistState;
  hasMetadataConflict: boolean;
  reverificationEvidenceCount: number;
  assignedEvidenceCount: number;
  persisted: PersistedSourceIntakeRecord | null;
}): DocumentAuditReadinessStatus {
  const {
    source,
    checklist,
    hasMetadataConflict,
    reverificationEvidenceCount,
    assignedEvidenceCount,
    persisted
  } = params;

  if (!source) {
    return 'not_started';
  }

  if (
    reverificationEvidenceCount > 0 ||
    source.statusAxes.integrityStatus === 'hash_mismatch' ||
    source.currentArtifact?.reverificationRequired ||
    hasMetadataConflict
  ) {
    return 'review_requires_rework';
  }

  if (
    persisted?.manualReviewMarkedCompletePendingDecision &&
    checklist.calculated_sha256 &&
    checklist.compared_available_metadata &&
    checklist.reviewed_in_preview &&
    assignedEvidenceCount > 0
  ) {
    return 'review_complete_pending_human_decision';
  }

  if (
    assignedEvidenceCount > 0 ||
    checklist.reviewed_in_preview ||
    checklist.identified_qrd_sections ||
    checklist.registered_local_evidence
  ) {
    return 'manual_review_in_progress';
  }

  const hasTechnicalInspection =
    checklist.verified_signature_and_structure &&
    checklist.calculated_sha256 &&
    checklist.read_page_count;

  if (hasTechnicalInspection && !checklist.compared_available_metadata) {
    return 'metadata_comparison_pending';
  }

  if (hasTechnicalInspection && checklist.compared_available_metadata) {
    return 'ready_for_manual_review';
  }

  if (checklist.selected_pdf_in_app && !hasTechnicalInspection) {
    return 'file_selected';
  }

  if (
    source.currentArtifact ||
    source.hasPersistedLocalArtifactMetadata ||
    checklist.downloaded_local_pdf
  ) {
    return 'file_selected';
  }

  return 'not_started';
}

export function buildSourceIntakeItems(params: {
  sources: readonly SourceRegistryEntry[];
  persistedRecords: Readonly<Record<string, PersistedSourceIntakeRecord>>;
  allEntries: readonly EvidenceLedgerEntry[];
}): SourceIntakeRecord[] {
  const { sources, persistedRecords, allEntries } = params;
  const sourceMap = new Map(sources.map((s) => [s.documentId, s]));
  const items: SourceIntakeRecord[] = [];
  const handledDocIds = new Set<string>();

  const buildItemFor = (
    checklistSlotId: string,
    documentId: string,
    expectedLabel: string,
    isExpectedChecklistTarget: boolean,
    requiresStage1ManualAcquisition: boolean
  ): SourceIntakeRecord => {
    const source = sourceMap.get(documentId) ?? null;
    const persisted = persistedRecords[documentId] ?? null;
    const assignedEntries = allEntries.filter((e) => e.documentId === documentId);
    const assignedEvidenceCount = assignedEntries.length;
    const reverificationEvidenceCount = assignedEntries.filter((e) => e.requiresReverification).length;
    const checklist = reconcileIntakeChecklistWithSource(
      persisted?.checklist,
      source,
      assignedEvidenceCount > 0
    );
    const checklistCompletedCount = SOURCE_INTAKE_CHECKLIST_DEFINITIONS.filter(
      (d) => checklist[d.key]
    ).length;

    const provenanceLevel = computeDocumentProvenanceLevel(source, persisted);
    const metadataComparisons = evaluateMetadataComparison(source, persisted);
    const hasMetadataConflict = metadataComparisons.some(
      (m) => m.status === 'conflict_requires_review'
    );

    const readinessStatus = computeDocumentAuditReadiness({
      source,
      checklist,
      hasMetadataConflict,
      reverificationEvidenceCount,
      assignedEvidenceCount,
      persisted
    });

    const isFailedEndpointRecord =
      Boolean(source) &&
      (source!.objectType === 'official_endpoint' ||
        source!.statusAxes.acquisitionStatus === 'access_failed');

    const physicalPdfAvailableInSession = hasLivePhysicalPdfInSession(source);

    const wasPreviouslySelectedLocally = Boolean(
      source?.hasPersistedLocalArtifactMetadata || source?.currentArtifact
    );

    return {
      checklistSlotId,
      expectedLabel,
      isExpectedChecklistTarget,
      isMissingRegistryRecord: source === null,
      isHistoricalRejectedForCurrentSeason: Boolean(source?.isHistoricalRejectedForCurrentSeason),
      isFailedEndpointRecord,
      requiresStage1ManualAcquisition:
        requiresStage1ManualAcquisition &&
        !isFailedEndpointRecord &&
        !source?.isHistoricalRejectedForCurrentSeason,
      source,
      readinessStatus,
      provenanceLevel,
      checklist,
      checklistCompletedCount,
      checklistTotalCount: SOURCE_INTAKE_CHECKLIST_DEFINITIONS.length,
      provenanceDeclaration: persisted?.provenanceDeclaration ?? null,
      metadataComparisons,
      hasMetadataConflict,
      historicalVersionsCount: source?.artifactHistory.length ?? 0,
      assignedEvidenceCount,
      reverificationEvidenceCount,
      physicalPdfAvailableInSession,
      wasPreviouslySelectedLocally,
      operatorNotes: persisted?.operatorNotes ?? '',
      manualReviewMarkedCompletePendingDecision:
        persisted?.manualReviewMarkedCompletePendingDecision ?? false,
      updatedAt: persisted?.updatedAt ?? null
    };
  };

  for (const target of EXPECTED_SOURCE_INTAKE_TARGETS) {
    handledDocIds.add(target.documentId);
    items.push(
      buildItemFor(
        target.checklistSlotId,
        target.documentId,
        target.expectedLabel,
        true,
        target.requiresStage1ManualAcquisition
      )
    );
  }

  for (const s of sources) {
    if (handledDocIds.has(s.documentId)) {
      continue;
    }
    items.push(
      buildItemFor(
        `intake-extra-${s.documentId}`,
        s.documentId,
        s.documentTitle,
        false,
        false
      )
    );
  }

  return items;
}

export function sanitizePersistedSourceIntakeRecord(
  raw: unknown,
  knownDocumentIds: ReadonlySet<string>
): PersistedSourceIntakeRecord | null {
  if (!isPlainRecord(raw) || hasPrototypePollutionKey(raw) || hasAnyDangerousStringsRecursive(raw)) {
    return null;
  }
  if (typeof raw.documentId !== 'string' || !knownDocumentIds.has(raw.documentId)) {
    return null;
  }
  const documentId = raw.documentId;
  const checklist = createDefaultSourceIntakeChecklist();
  if (isPlainRecord(raw.checklist)) {
    for (const def of SOURCE_INTAKE_CHECKLIST_DEFINITIONS) {
      checklist[def.key] = Boolean(raw.checklist[def.key]);
    }
  }

  let provenanceDeclaration: OperatorProvenanceDeclaration | null = null;
  if (isPlainRecord(raw.provenanceDeclaration)) {
    const p = raw.provenanceDeclaration;
    if (
      typeof p.declaredSourceName === 'string' &&
      typeof p.declaredSourceUrl === 'string' &&
      (p.declaredSourceUrl === '' || isValidHttpUrl(p.declaredSourceUrl)) &&
      typeof p.declaredAt === 'string' &&
      isValidDateString(p.declaredAt)
    ) {
      const declaredAtStr = p.declaredAt.trim();
      const rawLevel =
        typeof p.declaredOriginLevel === 'string' &&
        ALLOWED_PROVENANCE_LEVELS.includes(p.declaredOriginLevel as DocumentProvenanceLevel)
          ? (p.declaredOriginLevel as DocumentProvenanceLevel)
          : 'official_origin_operator_declared';
      provenanceDeclaration = {
        documentId,
        declaredOriginLevel:
          rawLevel === 'official_origin_independently_confirmed'
            ? 'official_origin_operator_declared'
            : rawLevel,
        declaredSourceUrl: normalizeTextInput(p.declaredSourceUrl, 400),
        declaredSourceName: normalizeTextInput(p.declaredSourceName, 200),
        declaredDocumentIdentifier:
          typeof p.declaredDocumentIdentifier === 'string'
            ? normalizeTextInput(p.declaredDocumentIdentifier, 160)
            : '',
        declaredAt: declaredAtStr,
        operatorNote:
          typeof p.operatorNote === 'string' ? normalizeTextInput(p.operatorNote, 600) : '',
        isOperatorDeclaredOnly: true
      };
    }
  }

  const metadataOverrides: Partial<Record<MetadataFieldKey, string>> = {};
  if (isPlainRecord(raw.metadataOverrides)) {
    for (const key of Object.keys(METADATA_FIELD_LABELS) as MetadataFieldKey[]) {
      const val = raw.metadataOverrides[key];
      if (typeof val === 'string' && val.trim()) {
        metadataOverrides[key] = normalizeTextInput(val, 240);
      }
    }
  }

  return {
    documentId,
    checklist,
    provenanceDeclaration,
    metadataOverrides,
    operatorNotes:
      typeof raw.operatorNotes === 'string'
        ? normalizeTextInput(raw.operatorNotes, MAX_OPERATOR_NOTE_LENGTH)
        : '',
    manualReviewMarkedCompletePendingDecision:
      Boolean(raw.manualReviewMarkedCompletePendingDecision),
    updatedAt: isValidDateString(raw.updatedAt)
      ? String(raw.updatedAt).trim()
      : new Date(0).toISOString()
  };
}

export function loadSourceIntakeRecordsFromStorage(
  storage: Storage | null,
  sources: readonly SourceRegistryEntry[]
): Record<string, PersistedSourceIntakeRecord> {
  if (!storage) {
    return {};
  }
  try {
    const raw = storage.getItem(SOURCE_INTAKE_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed: unknown = JSON.parse(raw);
    if (
      !isPlainRecord(parsed) ||
      hasPrototypePollutionKey(parsed) ||
      hasForbiddenBinaryOrBase64Payload(parsed) ||
      !isPlainRecord(parsed.records)
    ) {
      return {};
    }
    const knownDocIds = new Set(sources.map((s) => s.documentId));
    const result: Record<string, PersistedSourceIntakeRecord> = {};
    for (const val of Object.values(parsed.records)) {
      const clean = sanitizePersistedSourceIntakeRecord(val, knownDocIds);
      if (clean) {
        result[clean.documentId] = clean;
      }
    }
    return result;
  } catch {
    return {};
  }
}

export function saveSourceIntakeRecordsToStorage(
  storage: Storage | null,
  records: Readonly<Record<string, PersistedSourceIntakeRecord>>,
  now: Date = new Date()
): EvidenceLedgerStorageSaveResult {
  if (!storage) {
    return { success: false, error: 'Brak dostępu do localStorage.' };
  }
  try {
    const payload = {
      schemaVersion: SOURCE_INTAKE_SCHEMA_VERSION,
      savedAt: now.toISOString(),
      bytesPersistedInLocalStorage: false,
      records
    };
    storage.setItem(SOURCE_INTAKE_STORAGE_KEY, JSON.stringify(payload));
    return { success: true, error: null };
  } catch (err) {
    const msg =
      err instanceof Error && (err.name === 'QuotaExceededError' || /quota/i.test(err.message))
        ? 'Przekroczono limit localStorage (QuotaExceededError) podczas zapisu checklisty źródeł.'
        : 'Nie udało się zapisać checklisty pozyskiwania źródeł w localStorage.';
    return { success: false, error: msg };
  }
}

// ============================================================================
// Etap B5 — Część 2: Sesje audytu (Audit Sessions) i Raport sesji
// ============================================================================

export function validateAuditSessionDraftInput(
  input: AuditSessionDraftInput,
  sources: readonly SourceRegistryEntry[],
  checklist: readonly Stage1HumanDecisionItem[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const doc = sources.find((s) => s.documentId === input.documentId);
  if (!doc) {
    errors.push(`Nieznany documentId dla sesji audytu: „${input.documentId}”.`);
  }

  const scope = (input.scope ?? '').trim();
  if (scope.length < 3) {
    errors.push('Zakres sesji audytu musi mieć co najmniej 3 znaki.');
  } else if (scope.length > MAX_SESSION_SCOPE_LENGTH) {
    errors.push(`Zakres sesji nie może przekraczać ${MAX_SESSION_SCOPE_LENGTH} znaków.`);
  }

  if (
    containsDangerousTextPattern(scope) ||
    containsDangerousTextPattern(input.sessionNotes) ||
    containsDangerousTextPattern(input.operatorLabel)
  ) {
    errors.push('Wykryto niedozwolone znaczniki skryptu lub HTML w polach tekstowych sesji.');
  }

  for (const sec of input.reviewedSections) {
    if (!isValidQrdSection(sec)) {
      errors.push(`Nieprawidłowy punkt QRD w zakresie sesji: „${sec}”.`);
    }
  }

  const qIds = new Set(checklist.map((q) => q.id));
  for (const qId of input.linkedQuestionIds) {
    if (!qIds.has(qId)) {
      errors.push(`Nieznane pytanie audytowe powiązane z sesją: „${qId}”.`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function createAuditSession(
  input: AuditSessionDraftInput,
  sources: readonly SourceRegistryEntry[],
  checklist: readonly Stage1HumanDecisionItem[],
  now: Date = new Date()
): AuditSessionRecord {
  const validation = validateAuditSessionDraftInput(input, sources, checklist);
  if (!validation.valid) {
    throw new Error(validation.errors.join(' '));
  }

  const doc = sources.find((s) => s.documentId === input.documentId)!;
  const iso = now.toISOString();
  const suffix = Math.random().toString(36).slice(2, 8);
  const initialStatus: AuditSessionStatus =
    doc.objectType === 'official_endpoint' || doc.statusAxes.acquisitionStatus === 'access_failed'
      ? 'requires_follow_up'
      : 'in_progress';

  return {
    sessionId: `sess-${now.getTime()}-${suffix}`,
    documentId: doc.documentId,
    artifactId: doc.currentArtifact?.artifactId ?? input.artifactId ?? null,
    artifactSha256:
      doc.currentArtifact?.hashProvenance.value ??
      doc.sha256 ??
      input.artifactSha256 ??
      null,
    sourceRegistryId: doc.documentId,
    startedAt: iso,
    endedAt: null,
    updatedAt: iso,
    operatorLabel: input.operatorLabel?.trim()
      ? normalizeTextInput(input.operatorLabel, 100)
      : null,
    scope: normalizeTextInput(input.scope, MAX_SESSION_SCOPE_LENGTH),
    reviewedSections: Array.from(new Set(input.reviewedSections.map((s) => s.trim()))),
    linkedQuestionIds: Array.from(new Set(input.linkedQuestionIds)),
    createdEvidenceIds: [],
    pendingItems: (input.pendingItems ?? [])
      .map((item) => normalizeTextInput(item, 240))
      .filter((item) => item.length > 0 && !containsDangerousTextPattern(item)),
    sessionStatus: initialStatus,
    sessionNotes: normalizeTextInput(input.sessionNotes ?? '', MAX_SESSION_NOTES_LENGTH),
    requiresFileReselectionAfterReload: false,
    invalidatedByArtifactChange: false,
    disclaimer: AUDIT_SESSION_REPORT_DISCLAIMER
  };
}

export function transitionAuditSession(
  session: AuditSessionRecord,
  patch: {
    sessionStatus?: AuditSessionStatus;
    reviewedSections?: string[];
    linkedQuestionIds?: string[];
    addEvidenceId?: string;
    pendingItems?: string[];
    sessionNotes?: string;
  },
  doc: SourceRegistryEntry | null,
  checklist: readonly Stage1HumanDecisionItem[],
  now: Date = new Date()
): { updated: AuditSessionRecord | null; errors: string[] } {
  const errors: string[] = [];

  if (patch.sessionStatus && !ALLOWED_AUDIT_SESSION_STATUSES.includes(patch.sessionStatus)) {
    errors.push(`Nieprawidłowy status sesji: ${String(patch.sessionStatus)}.`);
  }

  if (patch.sessionNotes !== undefined && containsDangerousTextPattern(patch.sessionNotes)) {
    errors.push('Notatka sesji zawiera niedozwolone znaczniki HTML/skryptowe.');
  }

  if (patch.sessionStatus === 'completed_as_working_record') {
    if (session.invalidatedByArtifactChange) {
      errors.push(
        'Nie można zamknąć sesji z unieważnionym artefaktem po zmianie SHA-256 — rozpocznij nową sesję dla aktualnego PDF.'
      );
    }
    if (doc?.isHistoricalRejectedForCurrentSeason) {
      errors.push(
        'Sesja dla dokumentu historycznego (2025/2026) nie może zostać zamknięta jako bieżący zapis roboczy audytu 2026/2027.'
      );
    }
    if (doc && (doc.objectType === 'official_endpoint' || doc.statusAxes.acquisitionStatus === 'access_failed')) {
      errors.push(
        'Sesja dla niedostępnego endpointu HTTP 400 nie może zostać oznaczona jako zakończona roboczo.'
      );
    }
  }

  const validQIds = new Set(checklist.map((q) => q.id));
  const nextQuestions = patch.linkedQuestionIds
    ? Array.from(new Set(patch.linkedQuestionIds.filter((qId) => validQIds.has(qId))))
    : session.linkedQuestionIds;

  const nextSections = patch.reviewedSections
    ? Array.from(new Set(patch.reviewedSections.filter((s) => isValidQrdSection(s)).map((s) => s.trim())))
    : session.reviewedSections;

  if (errors.length > 0) {
    return { updated: null, errors };
  }

  const iso = now.toISOString();
  const nextStatus = patch.sessionStatus ?? session.sessionStatus;
  const nextEvidenceIds = patch.addEvidenceId
    ? Array.from(new Set([...session.createdEvidenceIds, patch.addEvidenceId]))
    : session.createdEvidenceIds;

  const nextPending = patch.pendingItems
    ? patch.pendingItems
        .map((p) => normalizeTextInput(p, 240))
        .filter((p) => p.length > 0 && !containsDangerousTextPattern(p))
    : session.pendingItems;

  return {
    errors: [],
    updated: {
      ...session,
      reviewedSections: nextSections,
      linkedQuestionIds: nextQuestions,
      createdEvidenceIds: nextEvidenceIds,
      pendingItems: nextPending,
      sessionNotes:
        patch.sessionNotes !== undefined
          ? normalizeTextInput(patch.sessionNotes, MAX_SESSION_NOTES_LENGTH)
          : session.sessionNotes,
      sessionStatus: nextStatus,
      endedAt:
        nextStatus === 'completed_as_working_record'
          ? session.endedAt ?? iso
          : nextStatus === 'in_progress'
            ? null
            : session.endedAt,
      updatedAt: iso
    }
  };
}

export function reconcileSessionsAfterReload(
  sessions: readonly AuditSessionRecord[],
  sources: readonly SourceRegistryEntry[]
): AuditSessionRecord[] {
  const sourceMap = new Map(sources.map((s) => [s.documentId, s]));
  return sessions.map((session) => {
    const doc = sourceMap.get(session.documentId);
    const hasLivePdfInMemory = hasLivePhysicalPdfInSession(doc);
    const needsReselection =
      !hasLivePdfInMemory &&
      Boolean(session.artifactId || session.artifactSha256 || doc?.hasPersistedLocalArtifactMetadata);

    return {
      ...session,
      requiresFileReselectionAfterReload: needsReselection
    };
  });
}

export function reconcileSessionsOnArtifactChange(
  sessions: readonly AuditSessionRecord[],
  documentId: string,
  newArtifactId: string | null,
  newSha256: string | null,
  now: Date = new Date()
): AuditSessionRecord[] {
  const normNewSha = newSha256?.toLowerCase() ?? null;
  const iso = now.toISOString();

  return sessions.map((session) => {
    if (session.documentId !== documentId) {
      return session;
    }
    const normOldSha = session.artifactSha256?.toLowerCase() ?? null;
    const shaChanged = Boolean(normOldSha && normNewSha && normOldSha !== normNewSha);
    const artifactReplaced = Boolean(
      session.artifactId && newArtifactId && session.artifactId !== newArtifactId && shaChanged
    );

    if (shaChanged || artifactReplaced) {
      const warningItem =
        'Zmiana skrótu SHA-256 lokalnego pliku PDF — wymagana powtórna weryfikacja dowodów z tej sesji.';
      const pendingItems = session.pendingItems.includes(warningItem)
        ? session.pendingItems
        : [...session.pendingItems, warningItem];
      return {
        ...session,
        invalidatedByArtifactChange: true,
        requiresFileReselectionAfterReload: false,
        sessionStatus: 'requires_follow_up',
        pendingItems,
        updatedAt: iso
      };
    }

    // Ten sam SHA-256 po ponownym wskazaniu pliku po reload — wyczyszczenie flagi ponownego wyboru
    if (normOldSha && normNewSha && normOldSha === normNewSha) {
      return {
        ...session,
        requiresFileReselectionAfterReload: false,
        updatedAt: iso
      };
    }

    return session;
  });
}

export function sanitizeAuditSessionRecord(
  raw: unknown,
  knownDocumentIds: ReadonlySet<string>,
  knownQuestionIds: ReadonlySet<string>
): AuditSessionRecord | null {
  if (
    !isPlainRecord(raw) ||
    hasPrototypePollutionKey(raw) ||
    hasForbiddenBinaryOrBase64Payload(raw) ||
    hasAnyDangerousStringsRecursive(raw) ||
    containsForbiddenClinicalApprovalClaim(raw)
  ) {
    return null;
  }

  if (typeof raw.sessionId !== 'string' || !raw.sessionId.trim()) {
    return null;
  }
  if (typeof raw.documentId !== 'string' || !knownDocumentIds.has(raw.documentId)) {
    return null;
  }
  if (!isValidDateString(raw.startedAt) || !isValidDateString(raw.updatedAt)) {
    return null;
  }
  if (raw.endedAt !== null && raw.endedAt !== undefined && !isValidDateString(raw.endedAt)) {
    return null;
  }

  const rawStatus =
    typeof raw.sessionStatus === 'string' &&
    ALLOWED_AUDIT_SESSION_STATUSES.includes(raw.sessionStatus as AuditSessionStatus)
      ? (raw.sessionStatus as AuditSessionStatus)
      : 'requires_follow_up';

  const artifactSha256 =
    raw.artifactSha256 === null || raw.artifactSha256 === undefined
      ? null
      : isValidSha256Hex(raw.artifactSha256)
        ? raw.artifactSha256.toLowerCase()
        : null;

  const reviewedSections = Array.isArray(raw.reviewedSections)
    ? Array.from(new Set(raw.reviewedSections.filter((s) => isValidQrdSection(s)).map((s) => String(s).trim())))
    : [];

  const linkedQuestionIds = Array.isArray(raw.linkedQuestionIds)
    ? Array.from(
        new Set(
          raw.linkedQuestionIds.filter(
            (id): id is string => typeof id === 'string' && knownQuestionIds.has(id)
          )
        )
      )
    : [];

  const createdEvidenceIds = Array.isArray(raw.createdEvidenceIds)
    ? Array.from(
        new Set(
          raw.createdEvidenceIds.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
        )
      )
    : [];

  const pendingItems = Array.isArray(raw.pendingItems)
    ? raw.pendingItems
        .filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
        .map((p) => normalizeTextInput(p, 240))
    : [];

  return {
    sessionId: raw.sessionId.trim(),
    documentId: raw.documentId,
    artifactId: typeof raw.artifactId === 'string' && raw.artifactId.trim() ? raw.artifactId.trim() : null,
    artifactSha256,
    sourceRegistryId:
      typeof raw.sourceRegistryId === 'string' && raw.sourceRegistryId.trim()
        ? raw.sourceRegistryId.trim()
        : raw.documentId,
    startedAt: String(raw.startedAt).trim(),
    endedAt: typeof raw.endedAt === 'string' ? raw.endedAt.trim() : null,
    updatedAt: String(raw.updatedAt).trim(),
    operatorLabel:
      typeof raw.operatorLabel === 'string' && raw.operatorLabel.trim()
        ? normalizeTextInput(raw.operatorLabel, 100)
        : null,
    scope:
      typeof raw.scope === 'string' && raw.scope.trim()
        ? normalizeTextInput(raw.scope, MAX_SESSION_SCOPE_LENGTH)
        : 'Robocza sesja audytowa',
    reviewedSections,
    linkedQuestionIds,
    createdEvidenceIds,
    pendingItems,
    sessionStatus: rawStatus,
    sessionNotes:
      typeof raw.sessionNotes === 'string'
        ? normalizeTextInput(raw.sessionNotes, MAX_SESSION_NOTES_LENGTH)
        : '',
    requiresFileReselectionAfterReload: Boolean(raw.requiresFileReselectionAfterReload),
    invalidatedByArtifactChange: Boolean(raw.invalidatedByArtifactChange),
    disclaimer: AUDIT_SESSION_REPORT_DISCLAIMER
  };
}

export function loadAuditSessionsFromStorage(
  storage: Storage | null,
  sources: readonly SourceRegistryEntry[],
  checklist: readonly Stage1HumanDecisionItem[]
): AuditSessionRecord[] {
  if (!storage) {
    return [];
  }
  try {
    const raw = storage.getItem(AUDIT_SESSIONS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (
      !isPlainRecord(parsed) ||
      hasPrototypePollutionKey(parsed) ||
      hasForbiddenBinaryOrBase64Payload(parsed) ||
      !Array.isArray(parsed.sessions)
    ) {
      return [];
    }
    const docIds = new Set(sources.map((s) => s.documentId));
    const qIds = new Set(checklist.map((q) => q.id));
    const result: AuditSessionRecord[] = [];
    const seen = new Set<string>();
    for (const rawItem of parsed.sessions) {
      const clean = sanitizeAuditSessionRecord(rawItem, docIds, qIds);
      if (clean && !seen.has(clean.sessionId)) {
        seen.add(clean.sessionId);
        result.push(clean);
      }
    }
    return reconcileSessionsAfterReload(result, sources);
  } catch {
    return [];
  }
}

export function saveAuditSessionsToStorage(
  storage: Storage | null,
  sessions: readonly AuditSessionRecord[],
  now: Date = new Date()
): EvidenceLedgerStorageSaveResult {
  if (!storage) {
    return { success: false, error: 'Brak dostępu do localStorage.' };
  }
  try {
    const payload = {
      schemaVersion: AUDIT_SESSIONS_SCHEMA_VERSION,
      savedAt: now.toISOString(),
      bytesPersistedInLocalStorage: false,
      sessions
    };
    storage.setItem(AUDIT_SESSIONS_STORAGE_KEY, JSON.stringify(payload));
    return { success: true, error: null };
  } catch (err) {
    const msg =
      err instanceof Error && (err.name === 'QuotaExceededError' || /quota/i.test(err.message))
        ? 'Przekroczono limit localStorage (QuotaExceededError) podczas zapisu sesji audytowych.'
        : 'Nie udało się zapisać sesji audytowych w localStorage.';
    return { success: false, error: msg };
  }
}

export function buildAuditSessionReport(params: {
  session: AuditSessionRecord;
  sources: readonly SourceRegistryEntry[];
  checklist: readonly Stage1HumanDecisionItem[];
  allEntries: readonly EvidenceLedgerEntry[];
  workingNotes: readonly InformalWorkingNote[];
  now?: Date;
}): AuditSessionReport {
  const { session, sources, checklist, allEntries, workingNotes, now = new Date() } = params;
  const doc = sources.find((s) => s.documentId === session.documentId) ?? null;

  const linkedQuestions = checklist
    .filter((q) => session.linkedQuestionIds.includes(q.id))
    .map((q) => ({
      questionId: q.id,
      chplSectionOrSubpoint: q.chplSectionOrSubpoint,
      clinicalQuestion: q.clinicalQuestion,
      autoResolved: false as const
    }));

  const linkedEvidenceEntries = allEntries.filter(
    (e) =>
      session.createdEvidenceIds.includes(e.evidenceId) ||
      e.verificationSessionId === session.sessionId
  );

  const linkedNotes = workingNotes.filter(
    (n) =>
      n.documentId === session.documentId &&
      (session.linkedQuestionIds.length === 0 || session.linkedQuestionIds.includes(n.questionId))
  );

  const conflictsAndOpenIssues: string[] = [...session.pendingItems];
  if (session.invalidatedByArtifactChange) {
    conflictsAndOpenIssues.push(
      'Zmiana SHA-256 artefaktu PDF unieważniła pierwotną zgodność sesji — konieczne powtórne sprawdzenie.'
    );
  }
  for (const e of linkedEvidenceEntries) {
    if (e.requiresReverification) {
      conflictsAndOpenIssues.push(`Dowód ${e.evidenceId} wymaga powtórnej weryfikacji.`);
    }
    if (e.relationship === 'contradicts') {
      conflictsAndOpenIssues.push(`Wykryto rozbieżność w dowodzie ${e.evidenceId}: ${e.sourceExcerptRef}`);
    }
  }

  const limitations: string[] = [
    AUDIT_SESSION_REPORT_DISCLAIMER,
    'Plik PDF nie jest osadzany w raporcie (brak bajtów PDF ani Base64).',
    'Wszystkie powiązane pytania zachowują autoResolved: false do czasu ostatecznej decyzji klinicznej człowieka.'
  ];
  if (session.requiresFileReselectionAfterReload) {
    limitations.push(
      'Po przeładowaniu przeglądarki bajty pliku PDF wymagają ponownego wskazania z dysku lokalnego.'
    );
  }

  return {
    vaxnurseSessionReport: true,
    generatedAt: now.toISOString(),
    clinicalApprovalGranted: false,
    containsPdfBytes: false,
    containsPatientData: false,
    disclaimer: AUDIT_SESSION_REPORT_DISCLAIMER,
    session,
    documentTitle: doc?.documentTitle ?? session.documentId,
    sourceAuthority: doc?.authority ?? 'Nieznany organ wydający',
    officialSourceUrl: doc?.officialSourceUrl ?? '',
    language: doc?.language ?? 'unknown',
    fileSizeBytes: doc?.fileSizeBytes ?? null,
    pageCount: doc?.physicalPageCount ?? null,
    linkedQuestions,
    linkedEvidenceEntries,
    linkedNotes,
    conflictsAndOpenIssues: Array.from(new Set(conflictsAndOpenIssues)),
    limitations
  };
}

export function renderAuditSessionReportHtml(report: AuditSessionReport): string {
  const esc = escapeHtmlForReport;
  const rowsQuestions =
    report.linkedQuestions.length > 0
      ? report.linkedQuestions
          .map(
            (q) =>
              `<tr><td>${esc(q.questionId)}</td><td>${esc(q.chplSectionOrSubpoint)}</td><td>${esc(q.clinicalQuestion)}</td><td>autoResolved: false</td></tr>`
          )
          .join('')
      : '<tr><td colspan="4">Brak powiązanych pytań w tej sesji.</td></tr>';

  const rowsEvidence =
    report.linkedEvidenceEntries.length > 0
      ? report.linkedEvidenceEntries
          .map(
            (e) =>
              `<tr><td>${esc(e.evidenceId)}</td><td>Pkt ${esc(e.location.qrdSection)} / PDF str. ${esc(e.location.pdfPageIndex === null ? '—' : String(e.location.pdfPageIndex))}</td><td>${esc(e.qualificationClass)}</td><td>${esc(e.sourceExcerptRef)}</td><td>${esc(e.clinicalObservation)}</td></tr>`
          )
          .join('')
      : '<tr><td colspan="5">Brak dowodów zarejestrowanych w tej sesji.</td></tr>';

  const issuesHtml =
    report.conflictsAndOpenIssues.length > 0
      ? `<ul>${report.conflictsAndOpenIssues.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`
      : '<p>Brak zgłoszonych kwestii otwartych w sesji.</p>';

  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <title>Raport sesji audytu VaxNurse — ${esc(report.session.sessionId)}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; margin: 24px; line-height: 1.5; }
    .disclaimer { border: 2px solid #991b1b; background: #fef2f2; padding: 12px 16px; border-radius: 6px; margin-bottom: 16px; }
    h1, h2 { color: #0f172a; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #f1f5f9; }
    code { background: #f1f5f9; padding: 2px 4px; border-radius: 4px; word-break: break-all; }
  </style>
</head>
<body>
  <div class="disclaimer">
    <strong>Zastrzeżenie regulacyjne i kliniczne:</strong> ${esc(report.disclaimer)}
  </div>
  <h1>Raport roboczej sesji audytu — ${esc(report.session.sessionId)}</h1>
  <p>Wygenerowano: ${esc(report.generatedAt)} | Zakres: ${esc(report.session.scope)} | Status sesji: <strong>${esc(report.session.sessionStatus)}</strong></p>

  <h2>1. Metadane dokumentu i kontrola integralności</h2>
  <table>
    <tbody>
      <tr><th>Dokument (ID)</th><td>${esc(report.documentTitle)} (<code>${esc(report.session.documentId)}</code>)</td></tr>
      <tr><th>Organ wydający i źródło</th><td>${esc(report.sourceAuthority)} — ${esc(report.officialSourceUrl)}</td></tr>
      <tr><th>ID artefaktu / SHA-256 (PDF)</th><td><code>${esc(report.session.artifactId ?? 'brak')}</code> / <code>${esc(report.session.artifactSha256 ?? 'brak')}</code></td></tr>
      <tr><th>Język / Rozmiar / Strony</th><td>${esc(report.language)} / ${esc(report.fileSizeBytes === null ? '—' : `${report.fileSizeBytes} B`)} / ${esc(report.pageCount === null ? '—' : `${report.pageCount} str.`)}</td></tr>
      <tr><th>Czas rozpoczęcia / zakończenia</th><td>${esc(report.session.startedAt)} / ${esc(report.session.endedAt ?? 'w toku / nie zakończono')}</td></tr>
    </tbody>
  </table>

  <h2>2. Powiązane pytania audytowe ChPL</h2>
  <table>
    <thead><tr><th>ID pytania</th><th>Punkt ChPL</th><th>Pytanie</th><th>Decyzja</th></tr></thead>
    <tbody>${rowsQuestions}</tbody>
  </table>

  <h2>3. Wpisy dowodowe utworzone lub powiązane</h2>
  <table>
    <thead><tr><th>ID dowodu</th><th>Lokalizacja</th><th>Kwalifikacja</th><th>Fragment / cytat</th><th>Obserwacja robocza</th></tr></thead>
    <tbody>${rowsEvidence}</tbody>
  </table>

  <h2>4. Kwestie otwarte i ograniczenia</h2>
  ${issuesHtml}
  <ul>${report.limitations.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>
</body>
</html>`;
}

// ============================================================================
// Etap B5 — Część 3: Kolejka 8 Pytań ChPL i 14-metrykowy Dashboard B5
// ============================================================================

const QUESTION_DOCUMENT_MAPPING: Readonly<Record<string, readonly string[]>> = {
  'dec-bcg-42-injection-site': ['doc-rpl-bcg10-19535'],
  'dec-bcg-43-44-antitnf': ['doc-rpl-bcg10-19535'],
  'dec-bcg-41-age15-vs-pso': ['doc-rpl-bcg10-19535', 'doc-mz-pso-2027-akt'],
  'dec-flu-42-age17-vs-18': ['doc-rpl-influvac-49462', 'doc-mz-pso-2027-akt'],
  'dec-flu-extrapolation-4valent': [
    'doc-rpl-vaxigrip-50032',
    'doc-rpl-vaxigrip-tetra-35346-hist'
  ],
  'dec-flu-allergens-and-passive-pregnancy': ['doc-rpl-vaxigrip-50032'],
  'dec-covid-42-site-and-extrapolation': ['doc-ema-spikevax-xfg-pl', 'doc-ema-spikevax-xfg-en'],
  'dec-covid-gtin-vs-ema-sec10': [
    'doc-ema-spikevax-xfg-pl',
    'doc-ema-spikevax-xfg-en',
    'doc-rpl-spikevax-cen-endpoints'
  ]
};

export function buildQuestionReviewQueueB5(params: {
  checklist: readonly Stage1HumanDecisionItem[];
  sources: readonly SourceRegistryEntry[];
  allEntries: readonly EvidenceLedgerEntry[];
  sessions: readonly AuditSessionRecord[];
}): QuestionEvidenceReviewQueueItem[] {
  const { checklist, sources, allEntries, sessions } = params;
  const sourceMap = new Map(sources.map((s) => [s.documentId, s]));

  return checklist.map((question) => {
    const mappedIds = QUESTION_DOCUMENT_MAPPING[question.id] ?? [];
    const entriesForQuestion = allEntries.filter((e) => e.questionId === question.id);
    const allDocIds = Array.from(
      new Set([
        ...mappedIds,
        ...entriesForQuestion.map((e) => e.documentId)
      ])
    );

    const requiredDocuments = allDocIds
      .map((id) => sourceMap.get(id))
      .filter((doc): doc is SourceRegistryEntry => Boolean(doc))
      .map((doc) => {
        const hasLivePdf = hasLivePhysicalPdfInSession(doc);
        const availability: FileAvailabilityStatus =
          doc.statusAxes.fileAvailability ??
          (hasLivePdf
            ? 'verified_in_session'
            : doc.hasPersistedLocalArtifactMetadata
              ? 'metadata_only_reload_required'
              : 'no_file');
        return {
          documentId: doc.documentId,
          documentTitle: doc.documentTitle,
          objectType: doc.objectType,
          fileAvailability: availability,
          acquisitionStatus: doc.statusAxes.acquisitionStatus,
          hasPhysicalPdfInSession: hasLivePdf
        };
      });

    const eligibleAcquiredDocs = requiredDocuments.filter(
      (d) =>
        d.objectType !== 'official_endpoint' &&
        d.objectType !== 'historical_document' &&
        d.acquisitionStatus === 'acquired'
    );

    const hasUnavailableOnly =
      requiredDocuments.length > 0 &&
      requiredDocuments.every(
        (d) => d.objectType === 'official_endpoint' || d.acquisitionStatus === 'access_failed'
      );

    const bundleReferenceCount = entriesForQuestion.filter(
      (e) => e.origin === 'bundle_extract'
    ).length;

    const workingEntries = entriesForQuestion.filter((e) => e.origin !== 'bundle_extract');

    const confirmedExcerptCount = workingEntries.filter(
      (e) =>
        (e.qualificationClass === 'source_excerpt_reviewed' ||
          e.qualificationClass === 'conflicting_source_excerpt') &&
        !e.requiresReverification
    ).length;

    const pendingReviewCount = entriesForQuestion.filter(
      (e) => e.qualificationClass === 'source_excerpt_pending_review' || e.requiresReverification
    ).length;

    const conflictsCount = entriesForQuestion.filter(
      (e) =>
        e.relationship === 'contradicts' ||
        e.qualificationClass === 'conflicting_reference' ||
        e.qualificationClass === 'conflicting_source_excerpt'
    ).length;

    const linkedSessions = sessions.filter((s) => s.linkedQuestionIds.includes(question.id));

    const hasAppropriateDocument = eligibleAcquiredDocs.length > 0;
    const hasIdentifiedFragment = workingEntries.some(
      (e) => e.sourceExcerptRef.trim().length >= 10
    );
    const hasProperQrdSection = workingEntries.some((e) => isValidQrdSection(e.location.qrdSection));
    const hasPhysicalPdfPageIndex = workingEntries.some(
      (e) => e.location.pdfPageIndex !== null && e.location.pdfPageIndex >= 1
    );
    const hasSavedArtifactSha256 = workingEntries.some((e) => isValidSha256Hex(e.sourceDocumentHash));
    const hasOperatorManualAssessment = confirmedExcerptCount > 0;

    const missingRequirements: string[] = [];
    if (!hasAppropriateDocument) {
      missingRequirements.push('Pozyskaj i wskaż właściwy lokalny dokument PDF ChPL/EPAR.');
    }
    if (!hasIdentifiedFragment) {
      missingRequirements.push('Zarejestruj krótki cytat / odniesienie robocze z treści dokumentu.');
    }
    if (!hasProperQrdSection) {
      missingRequirements.push('Przypisz konkretny punkt struktury QRD.');
    }
    if (!hasPhysicalPdfPageIndex) {
      missingRequirements.push('Wskaż fizyczny indeks strony w pliku PDF.');
    }
    if (!hasSavedArtifactSha256) {
      missingRequirements.push('Powiąż wpis ze skrótem SHA-256 lokalnego artefaktu PDF.');
    }
    if (!hasOperatorManualAssessment) {
      missingRequirements.push(
        'Przeprowadź ręczne porównanie cytatu z otwartym PDF (klasa source_excerpt_reviewed).'
      );
    }

    const metCount = 6 - missingRequirements.length;
    const technicalCompletenessPercent = Math.round((metCount / 6) * 100);

    const readiness: QuestionTechnicalReadinessCheck = {
      hasAppropriateDocument,
      hasIdentifiedFragment,
      hasProperQrdSection,
      hasPhysicalPdfPageIndex,
      hasSavedArtifactSha256,
      hasOperatorManualAssessment,
      missingRequirements,
      technicalCompletenessPercent,
      completenessMetricDisclaimer:
        'Kompletność techniczna ścieżki dowodowej (nie oznacza rozstrzygnięcia klinicznego ani zamknięcia pytania).'
    };

    const requiresClarification = entriesForQuestion.some(
      (e) => e.reviewStatus === 'requires_authority_clarification'
    );

    let workStatus: QuestionB5WorkStatus = 'not_started';
    if (requiresClarification) {
      workStatus = 'awaiting_authority_clarification';
    } else if (conflictsCount > 0 && confirmedExcerptCount === 0 && pendingReviewCount > 0) {
      workStatus = 'conflicting_evidence';
    } else if (metCount === 6 && !hasUnavailableOnly) {
      workStatus = 'work_record_complete';
    } else if (confirmedExcerptCount > 0) {
      workStatus = 'awaiting_human_decision';
    } else if (workingEntries.length > 0 || linkedSessions.length > 0) {
      workStatus = 'evidence_review_in_progress';
    } else if (hasAppropriateDocument) {
      workStatus = 'document_available';
    } else {
      workStatus = 'sources_pending';
    }

    let nextRequiredStep =
      missingRequirements[0] ??
      'Materiał technicznie skompletowany (work_record_complete) — pytanie nadal wymaga decyzji klinicznej człowieka.';
    if (workStatus === 'awaiting_authority_clarification') {
      nextRequiredStep =
        'Wymaga wyjaśnienia właściwego organu / podmiotu odpowiedzialnego przed zamknięciem pytania.';
    }

    return {
      questionId: question.id,
      productKey: question.productKey,
      productDisplayName: getProductScopeLabel(question.productKey),
      chplSectionOrSubpoint: question.chplSectionOrSubpoint,
      clinicalQuestion: question.clinicalQuestion,
      ambiguitySummary: question.ambiguitySummary,
      autoResolved: false,
      workStatus,
      requiredDocumentIds: allDocIds,
      requiredDocuments,
      bundleReferenceCount,
      confirmedExcerptCount,
      pendingReviewCount,
      conflictsCount,
      linkedSessionsCount: linkedSessions.length,
      linkedSessionIds: linkedSessions.map((s) => s.sessionId),
      readiness,
      nextRequiredStep
    };
  });
}

export function computeAuditProgressB5Metrics(params: {
  sources: readonly SourceRegistryEntry[];
  intakeItems: readonly SourceIntakeRecord[];
  sessions: readonly AuditSessionRecord[];
  allEntries: readonly EvidenceLedgerEntry[];
  queue: readonly QuestionEvidenceReviewQueueItem[];
}): AuditProgressB5Metrics {
  const { sources, intakeItems, sessions, allEntries, queue } = params;

  return {
    totalSourceRecords: sources.length,
    physicallyAcquiredInHistoryCount: sources.filter(
      (s) =>
        s.objectType !== 'official_endpoint' &&
        (s.statusAxes.acquisitionStatus === 'acquired' ||
          Boolean(s.currentArtifact) ||
          Boolean(s.hasPersistedLocalArtifactMetadata))
    ).length,
    reloadReselectionRequiredCount: sources.filter(
      (s) => s.currentArtifact?.localPreviewStatus === 'reselection_required_after_reload'
    ).length,
    unconfirmedOriginCount: intakeItems.filter(
      (item) => item.source && item.provenanceLevel !== 'official_origin_independently_confirmed'
    ).length,
    artifactsWithSha256Count: sources.filter((s) => Boolean(s.sha256)).length,
    artifactsComparedWithTrustedReferenceCount: sources.filter(
      (s) =>
        s.currentArtifact?.hashProvenance.comparisonStatus === 'compared_with_trusted_reference'
    ).length,
    totalSessionsCount: sessions.length,
    pausedOrInterruptedSessionsCount: sessions.filter(
      (s) =>
        s.sessionStatus === 'paused' ||
        s.sessionStatus === 'requires_follow_up' ||
        s.invalidatedByArtifactChange
    ).length,
    completedWorkingSessionsCount: sessions.filter(
      (s) => s.sessionStatus === 'completed_as_working_record' && !s.invalidatedByArtifactChange
    ).length,
    evidencePendingReviewCount: allEntries.filter(
      (e) => e.qualificationClass === 'source_excerpt_pending_review'
    ).length,
    operatorConfirmedExcerptsCount: allEntries.filter(
      (e) => e.qualificationClass === 'source_excerpt_reviewed' && !e.requiresReverification
    ).length,
    evidenceRequiringReverificationCount: allEntries.filter(
      (e) => e.requiresReverification
    ).length,
    questionsWithoutConfirmedExcerptsCount: queue.filter(
      (q) => q.confirmedExcerptCount === 0
    ).length,
    questionsAwaitingHumanDecisionCount: queue.filter((q) => !q.autoResolved).length,
    disclaimer: B5_PROGRESS_DASHBOARD_DISCLAIMER
  };
}

// ============================================================================
// Etap B5 — Część 4: Portable Audit Dossier (Eksport, SHA-256 i Import Preview)
// ============================================================================

export function buildAuditDossierExportPayload(params: {
  options: AuditDossierExportOptions;
  sources: readonly SourceRegistryEntry[];
  persistedIntake: Readonly<Record<string, PersistedSourceIntakeRecord>>;
  sessions: readonly AuditSessionRecord[];
  allEntries: readonly EvidenceLedgerEntry[];
  workingNotes: readonly InformalWorkingNote[];
  queue: readonly QuestionEvidenceReviewQueueItem[];
  now?: Date;
}): AuditDossierPayload {
  const {
    options,
    sources,
    persistedIntake,
    sessions,
    allEntries,
    workingNotes,
    queue,
    now = new Date()
  } = params;

  const includeNotes =
    options.scope === 'without_notes' ? false : Boolean(options.includeNotes);

  let filteredSessions = [...sessions];
  let filteredEntries = options.includeBaselineExtracts
    ? [...allEntries]
    : allEntries.filter((e) => e.origin !== 'bundle_extract');
  let filteredNotes = includeNotes ? [...workingNotes] : [];

  if (options.scope === 'selected_sessions') {
    const sel = new Set(options.selectedSessionIds ?? []);
    filteredSessions = filteredSessions.filter((s) => sel.has(s.sessionId));
    const docIds = new Set(filteredSessions.map((s) => s.documentId));
    const qIds = new Set(filteredSessions.flatMap((s) => s.linkedQuestionIds));
    const evIds = new Set(filteredSessions.flatMap((s) => s.createdEvidenceIds));
    filteredEntries = filteredEntries.filter(
      (e) =>
        evIds.has(e.evidenceId) ||
        (typeof e.verificationSessionId === 'string' && sel.has(e.verificationSessionId)) ||
        (docIds.has(e.documentId) && qIds.has(e.questionId))
    );
    filteredNotes = filteredNotes.filter(
      (n) => (n.documentId ? docIds.has(n.documentId) : false) || qIds.has(n.questionId)
    );
  } else if (options.scope === 'selected_product' && options.selectedProductKey) {
    const pKey = options.selectedProductKey;
    const productDocIds = new Set(sources.filter((s) => s.productKey === pKey).map((s) => s.documentId));
    const productQIds = new Set(
      queue.filter((q) => (q.productKey as string) === (pKey as string)).map((q) => q.questionId)
    );
    filteredSessions = filteredSessions.filter((s) => productDocIds.has(s.documentId));
    filteredEntries = filteredEntries.filter(
      (e) => e.productKey === pKey || productDocIds.has(e.documentId)
    );
    filteredNotes = filteredNotes.filter(
      (n) => productQIds.has(n.questionId) || (n.documentId ? productDocIds.has(n.documentId) : false)
    );
  } else if (options.scope === 'selected_question' && options.selectedQuestionId) {
    const qId = options.selectedQuestionId;
    const qQueue = queue.find((q) => q.questionId === qId);
    const qDocIds = new Set(qQueue?.requiredDocumentIds ?? []);
    filteredSessions = filteredSessions.filter(
      (s) => s.linkedQuestionIds.includes(qId) || qDocIds.has(s.documentId)
    );
    filteredEntries = filteredEntries.filter((e) => e.questionId === qId);
    filteredNotes = filteredNotes.filter((n) => n.questionId === qId);
  }

  const relevantDocIds = new Set<string>([
    ...sources.map((s) => s.documentId),
    ...filteredSessions.map((s) => s.documentId),
    ...filteredEntries.map((e) => e.documentId)
  ]);

  const filteredSources =
    options.scope === 'full_metadata_and_history' || options.scope === 'without_notes'
      ? [...sources]
      : sources.filter(
          (s) =>
            filteredSessions.some((sess) => sess.documentId === s.documentId) ||
            filteredEntries.some((e) => e.documentId === s.documentId) ||
            (options.scope === 'selected_product' && s.productKey === options.selectedProductKey) ||
            (options.scope === 'selected_question' && relevantDocIds.has(s.documentId))
        );

  const activeDocIdSet = new Set(filteredSources.map((s) => s.documentId));
  const intakeStates = Object.values(persistedIntake).filter((rec) =>
    activeDocIdSet.has(rec.documentId)
  );
  const provenanceDeclarations = intakeStates
    .map((r) => r.provenanceDeclaration)
    .filter((d): d is OperatorProvenanceDeclaration => Boolean(d));

  const artifactHistoryByDocument: Record<string, DocumentArtifactRecord[]> = {};
  const reverificationHistory: AuditDossierReverificationRecord[] = [];
  for (const s of filteredSources) {
    const cleanHistory = s.artifactHistory.map((a) => ({
      ...a,
      localArtifactId: null,
      localPreviewStatus:
        a.localArtifactId || a.localPreviewStatus === 'previewed_in_session'
          ? ('reselection_required_after_reload' as const)
          : a.localPreviewStatus
    }));
    artifactHistoryByDocument[s.documentId] = cleanHistory;
    for (const a of cleanHistory) {
      if (a.reverificationRequired || a.requiresReverification) {
        reverificationHistory.push({
          documentId: s.documentId,
          artifactId: a.artifactId,
          previousArtifactId: a.previousArtifactId,
          sha256: a.hashProvenance.value,
          changeCategory: a.changeCategory,
          detectedAt: a.selectedInSessionAt ?? a.retrievedAt ?? null,
          reason: a.operatorDeclaredOrigin ?? `Zmiana artefaktu (${a.changeCategory})`
        });
      }
    }
  }

  const sanitizedSources = filteredSources.map((s) => ({
    ...s,
    currentArtifact: s.currentArtifact
      ? {
          ...s.currentArtifact,
          localArtifactId: null,
          localPreviewStatus:
            s.currentArtifact.localArtifactId ||
            s.currentArtifact.localPreviewStatus === 'previewed_in_session'
              ? ('reselection_required_after_reload' as const)
              : s.currentArtifact.localPreviewStatus
        }
      : null,
    artifactHistory: artifactHistoryByDocument[s.documentId] ?? []
  }));

  const missingFilesSummary = sanitizedSources
    .filter((s) => s.statusAxes.acquisitionStatus !== 'acquired')
    .map((s) => {
      const avail: FileAvailabilityStatus =
        s.statusAxes.fileAvailability ??
        (s.hasPersistedLocalArtifactMetadata ? 'metadata_only_reload_required' : 'no_file');
      return {
        documentId: s.documentId,
        documentTitle: s.documentTitle,
        acquisitionStatus: s.statusAxes.acquisitionStatus,
        fileAvailability: avail
      };
    });

  const filteredQueue =
    options.scope === 'selected_question' && options.selectedQuestionId
      ? queue.filter((q) => q.questionId === options.selectedQuestionId)
      : options.scope === 'selected_product' && options.selectedProductKey
        ? queue.filter((q) => (q.productKey as string) === (options.selectedProductKey as string))
        : queue;

  return {
    vaxnurseAuditDossier: true,
    schemaVersion: AUDIT_DOSSIER_SCHEMA_VERSION,
    dossierId: `dossier-${now.getTime()}`,
    exportedAt: now.toISOString(),
    sourceRegistryVersion: SOURCE_REGISTRY_VERSION,
    exportScope: options.scope,
    includesNotes: includeNotes,
    containsPdfBytes: false,
    containsBase64: false,
    containsPatientData: false,
    clinicalApprovalGranted: false,
    isWorkingDraft: true,
    dossierJsonSha256: null,
    hashDistinctionNotice: DOSSIER_HASH_DISTINCTION_NOTICE,
    disclaimer: DOSSIER_PORTABLE_DISCLAIMER,
    missingFilesSummary,
    sources: sanitizedSources,
    artifactHistoryByDocument,
    intakeStates,
    provenanceDeclarations,
    sessions: filteredSessions,
    questionChecklistSnapshots: filteredQueue.map((q) => ({
      questionId: q.questionId,
      productKey: q.productKey,
      chplSectionOrSubpoint: q.chplSectionOrSubpoint,
      workStatus: q.workStatus,
      autoResolved: false as const
    })),
    entries: filteredEntries.map((e) => ({ ...e, autoResolved: false })),
    workingNotes: filteredNotes,
    reverificationHistory
  };
}

export async function buildAuditDossierExportPayloadWithSha256(params: {
  options: AuditDossierExportOptions;
  sources: readonly SourceRegistryEntry[];
  persistedIntake: Readonly<Record<string, PersistedSourceIntakeRecord>>;
  sessions: readonly AuditSessionRecord[];
  allEntries: readonly EvidenceLedgerEntry[];
  workingNotes: readonly InformalWorkingNote[];
  queue: readonly QuestionEvidenceReviewQueueItem[];
  now?: Date;
}): Promise<AuditDossierPayload> {
  const payload = buildAuditDossierExportPayload(params);
  const canonicalJson = JSON.stringify({ ...payload, dossierJsonSha256: null });
  const encoded = new TextEncoder().encode(canonicalJson);
  const bytes = new Uint8Array(new ArrayBuffer(encoded.byteLength));
  bytes.set(encoded);
  const shaRes = await computeSha256HexFromBytes(bytes);
  return {
    ...payload,
    dossierJsonSha256: shaRes.ok ? shaRes.sha256Hex : null
  };
}

export function parseAndPreviewAuditDossierImport(
  rawJsonText: string,
  options: {
    sources: readonly SourceRegistryEntry[];
    checklist: readonly Stage1HumanDecisionItem[];
    existingSessions: readonly AuditSessionRecord[];
    existingWorkingEntries: readonly EvidenceLedgerEntry[];
    existingWorkingNotes: readonly InformalWorkingNote[];
    existingIntake: Readonly<Record<string, PersistedSourceIntakeRecord>>;
  }
): AuditDossierImportPreview {
  const buildEmptyPreview = (
    errors: string[],
    sourceFormatVersion: AuditDossierImportPreview['sourceFormatVersion'] = 'unknown'
  ): AuditDossierImportPreview => ({
    isValid: false,
    canImport: false,
    sourceFormatVersion,
    migrationNote: null,
    errors,
    warnings: [],
    validSessions: [],
    validIntakeRecords: [],
    validEntries: [],
    validNotes: [],
    incomingSourcesCount: 0,
    incomingArtifactsCount: 0,
    incomingSessionsCount: 0,
    incomingEntriesCount: 0,
    incomingNotesCount: 0,
    incomingQuestionsCount: 0,
    conflictsCount: 0,
    conflicts: [],
    unknownSourceIds: [],
    missingSourcesCount: 0,
    reverificationRequiredCount: 0,
    externalVerificationClaimsCount: 0,
    rejectedItems: [],
    payloadMetadata: {
      schemaVersion: null,
      dossierId: null,
      exportedAt: null,
      exportScope: null,
      dossierJsonSha256: null,
      sourceRegistryVersion: null
    }
  });

  if (!rawJsonText || !rawJsonText.trim()) {
    return buildEmptyPreview(['Plik JSON dossier jest pusty.']);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJsonText);
  } catch {
    return buildEmptyPreview(['Nieprawidłowa składnia JSON w pliku dossier audytowego.']);
  }

  if (hasPrototypePollutionKey(parsed)) {
    return buildEmptyPreview([
      'Wykryto niedozwolone klucze prototypowe (__proto__, constructor, prototype). Import odrzucony.'
    ]);
  }

  if (!isPlainRecord(parsed)) {
    return buildEmptyPreview(['Główna struktura pliku musi być poprawnym obiektem JSON.']);
  }

  if (parsed.vaxnurseBackup === true) {
    return buildEmptyPreview([
      'Odrzucono: plik jest kopią zapasową katalogu preparatów (vaxnurseBackup), a nie dossier audytowym B5 ani rejestrem dowodów.'
    ]);
  }

  if (hasForbiddenBinaryOrBase64Payload(parsed)) {
    return buildEmptyPreview([
      'Odrzucono ze względów bezpieczeństwa: plik zawiera zabronione bajty PDF lub zakodowane dane Base64.'
    ]);
  }

  if (hasAnyDangerousStringsRecursive(parsed)) {
    return buildEmptyPreview([
      'Odrzucono ze względów bezpieczeństwa: wykryto potencjalnie niebezpieczne ciągi HTML/JavaScript.'
    ]);
  }

  if (containsForbiddenClinicalApprovalClaim(parsed)) {
    return buildEmptyPreview([
      'Naruszenie niezmiennika klinicznego: importowany plik próbuje nadać status verified_chpl / verified_full / clinically_approved lub autoResolved: true.'
    ]);
  }

  // Obsługa migracji starszych plików B2/B3/B4 Evidence Ledger (schema 1.0.0 / 1.1.0)
  if (
    parsed.vaxnurseEvidenceLedger === true &&
    !parsed.vaxnurseAuditDossier &&
    (parsed.schemaVersion === LEGACY_B2_EVIDENCE_LEDGER_SCHEMA_VERSION ||
      parsed.schemaVersion === EVIDENCE_LEDGER_SCHEMA_VERSION)
  ) {
    const legacyPreview = parseAndPreviewEvidenceLedgerImport(rawJsonText, {
      sources: options.sources,
      checklist: options.checklist,
      existingWorkingEntries: options.existingWorkingEntries,
      existingWorkingNotes: options.existingWorkingNotes
    });
    const mappedConflicts: AuditDossierImportConflict[] = legacyPreview.conflicts.map((c) => ({
      kind:
        c.kind === 'id_collision_different_content'
          ? 'evidence_content_mismatch'
          : c.kind === 'unknown_source_id'
            ? 'unknown_source_id'
            : c.kind === 'hash_mismatch_with_local_registry'
              ? 'hash_mismatch_with_local_registry'
              : 'document_version_mismatch',
      id: c.id,
      details: c.details
    }));

    return {
      isValid: legacyPreview.isValid,
      canImport: legacyPreview.canImport,
      sourceFormatVersion: legacyPreview.payloadMetadata.schemaVersion === '1.0.0' ? '1.0.0' : '1.1.0',
      migrationNote: `Wykryto starszy format rejestru dowodów (${String(legacyPreview.payloadMetadata.schemaVersion)}) — bezpiecznie zmigrowano do podglądu Dossier B5 (${AUDIT_DOSSIER_SCHEMA_VERSION}).`,
      errors: legacyPreview.errors,
      warnings: legacyPreview.warnings,
      validSessions: [],
      validIntakeRecords: [],
      validEntries: legacyPreview.validEntries,
      validNotes: legacyPreview.validNotes,
      incomingSourcesCount: legacyPreview.payloadMetadata.sourceCount,
      incomingArtifactsCount: 0,
      incomingSessionsCount: 0,
      incomingEntriesCount: legacyPreview.validEntries.length,
      incomingNotesCount: legacyPreview.validNotes.length,
      incomingQuestionsCount: options.checklist.length,
      conflictsCount: mappedConflicts.length,
      conflicts: mappedConflicts,
      unknownSourceIds: legacyPreview.unknownSourceIds,
      missingSourcesCount: legacyPreview.missingDocumentsCount,
      reverificationRequiredCount: legacyPreview.requiresManualReviewCount,
      externalVerificationClaimsCount: legacyPreview.importedVerificationClaimsCount,
      rejectedItems: legacyPreview.rejectedItems,
      payloadMetadata: {
        schemaVersion: legacyPreview.payloadMetadata.schemaVersion,
        dossierId: null,
        exportedAt: legacyPreview.payloadMetadata.exportedAt,
        exportScope: 'legacy_evidence_ledger',
        dossierJsonSha256: null,
        sourceRegistryVersion: legacyPreview.payloadMetadata.sourceRegistryVersion
      }
    };
  }

  const errors: string[] = [];
  const warnings: string[] = [];
  const conflicts: AuditDossierImportConflict[] = [];
  const rejectedItems: EvidenceLedgerImportRejectedItem[] = [];
  const unknownSourceIds = new Set<string>();

  if (parsed.vaxnurseAuditDossier !== true) {
    errors.push('Brak znacznika formatu vaxnurseAuditDossier: true.');
  }

  if (parsed.schemaVersion !== AUDIT_DOSSIER_SCHEMA_VERSION) {
    errors.push(
      `Nieobsługiwana wersja schematu dossier (${String(parsed.schemaVersion)}; oczekiwano ${AUDIT_DOSSIER_SCHEMA_VERSION} lub 1.1.0 / 1.0.0).`
    );
  }

  if (parsed.containsPatientData !== false) {
    errors.push('Odrzucono: pole containsPatientData musi mieć wartość false.');
  }
  if (parsed.containsPdfBytes !== false || parsed.containsBase64 !== false) {
    errors.push('Odrzucono: pola containsPdfBytes i containsBase64 muszą mieć wartość false.');
  }
  if (!isValidDateString(parsed.exportedAt)) {
    errors.push('Brak lub nieprawidłowa data eksportu exportedAt.');
  }
  if (
    parsed.dossierJsonSha256 !== null &&
    parsed.dossierJsonSha256 !== undefined &&
    !isValidSha256Hex(parsed.dossierJsonSha256)
  ) {
    errors.push('Pole dossierJsonSha256 ma nieprawidłowy format SHA-256.');
  }

  if (errors.length > 0) {
    return buildEmptyPreview(errors, parsed.schemaVersion === '1.2.0-b5' ? '1.2.0-b5' : 'unknown');
  }

  const sourceMap = new Map(options.sources.map((s) => [s.documentId, s]));
  const docIdsSet = new Set(options.sources.map((s) => s.documentId));
  const questionIds = new Set(options.checklist.map((q) => q.id));

  let externalVerificationClaimsCount = 0;
  let missingSourcesCount = 0;
  let incomingArtifactsCount = 0;

  // Inspekcja deklaracji źródeł i artefaktów z pliku zewnętrznego
  const incomingSources = Array.isArray(parsed.sources) ? parsed.sources : [];
  for (const rawSource of incomingSources) {
    if (!isPlainRecord(rawSource) || typeof rawSource.documentId !== 'string') {
      continue;
    }
    const docId = rawSource.documentId.trim();
    const localSource = sourceMap.get(docId);
    if (!localSource) {
      unknownSourceIds.add(docId);
      conflicts.push({
        kind: 'unknown_source_id',
        id: docId,
        details: `Importowane dossier wskazuje nieznany dokument „${docId}”, którego nie ma w lokalnym Rejestrze Źródeł.`
      });
      continue;
    }

    if (typeof rawSource.sha256 === 'string' && rawSource.sha256.trim()) {
      if (!isValidSha256Hex(rawSource.sha256)) {
        rejectedItems.push({
          kind: 'sourceClaim',
          id: docId,
          reason: `Nieprawidłowy format SHA-256 w źródle ${docId}.`
        });
      } else if (
        localSource.sha256 &&
        rawSource.sha256.trim().toLowerCase() !== localSource.sha256.toLowerCase()
      ) {
        conflicts.push({
          kind: 'hash_mismatch_with_local_registry',
          id: docId,
          details: `Konflikt SHA-256 dla ${docId}: skrót z importowanego dossier różni się od lokalnego artefaktu.`
        });
        rejectedItems.push({
          kind: 'sourceClaim',
          id: docId,
          reason: `Niezgodny skrót SHA-256 z lokalnym artefaktem dla ${docId}.`
        });
      }
    }

    if (
      typeof rawSource.pdfScopeRange === 'string' &&
      localSource.pdfScopeRange &&
      normalizeComparableText(rawSource.pdfScopeRange) !== normalizeComparableText(localSource.pdfScopeRange)
    ) {
      conflicts.push({
        kind: 'document_version_mismatch',
        id: docId,
        details: `Konflikt zakresu/wersji dokumentu ${docId}: import „${rawSource.pdfScopeRange}” vs lokalnie „${localSource.pdfScopeRange}”.`
      });
    } else if (
      typeof rawSource.revisionDate === 'string' &&
      localSource.revisionDate &&
      normalizeComparableText(rawSource.revisionDate) !== normalizeComparableText(localSource.revisionDate)
    ) {
      conflicts.push({
        kind: 'document_version_mismatch',
        id: docId,
        details: `Konflikt daty rewizji dokumentu ${docId}: import „${rawSource.revisionDate}” vs lokalnie „${localSource.revisionDate}”.`
      });
    }

    const axes = isPlainRecord(rawSource.statusAxes) ? rawSource.statusAxes : null;
    if (
      (rawSource.sourceVerificationStatus === 'official_source_confirmed' ||
        axes?.originStatus === 'official_origin_confirmed') &&
      localSource.statusAxes.originStatus !== 'official_origin_confirmed'
    ) {
      externalVerificationClaimsCount += 1;
      conflicts.push({
        kind: 'provenance_declaration_conflict',
        id: docId,
        details: `Zewnętrzne dossier deklaruje potwierdzone pochodzenie dla ${docId}, ale lokalny rejestr nie ma potwierdzenia — deklaracja nie przejmuje lokalnego statusu.`
      });
    }

    if (localSource.statusAxes.acquisitionStatus !== 'acquired') {
      missingSourcesCount += 1;
    }
  }

  // Inspekcja historii artefaktów pod kątem kolizji artifactId / hash
  if (isPlainRecord(parsed.artifactHistoryByDocument)) {
    const localArtifactsById = new Map<string, DocumentArtifactRecord>();
    for (const s of options.sources) {
      if (s.currentArtifact) {
        localArtifactsById.set(s.currentArtifact.artifactId, s.currentArtifact);
      }
      for (const h of s.artifactHistory) {
        localArtifactsById.set(h.artifactId, h);
      }
    }

    for (const [docId, arr] of Object.entries(parsed.artifactHistoryByDocument)) {
      if (!Array.isArray(arr)) {
        continue;
      }
      incomingArtifactsCount += arr.length;
      if (!docIdsSet.has(docId)) {
        unknownSourceIds.add(docId);
        continue;
      }
      for (const rawArt of arr) {
        if (!isPlainRecord(rawArt) || typeof rawArt.artifactId !== 'string') {
          continue;
        }
        const prevArt = localArtifactsById.get(rawArt.artifactId);
        const incomingArtSha =
          isPlainRecord(rawArt.hashProvenance) && typeof rawArt.hashProvenance.value === 'string'
            ? rawArt.hashProvenance.value
            : null;
        const prevArtSha = prevArt?.hashProvenance.value ?? null;
        if (
          prevArt &&
          incomingArtSha &&
          prevArtSha &&
          incomingArtSha.toLowerCase() !== prevArtSha.toLowerCase()
        ) {
          conflicts.push({
            kind: 'artifact_hash_mismatch',
            id: rawArt.artifactId,
            details: `Konflikt artefaktu ${rawArt.artifactId}: importowany skrót SHA-256 różni się od lokalnego rekordu.`
          });
        }
      }
    }
  }

  // Walidacja rekordów intake i deklaracji proweniencji
  const validIntakeRecords: PersistedSourceIntakeRecord[] = [];
  if (Array.isArray(parsed.intakeStates)) {
    for (const rawIntake of parsed.intakeStates) {
      const clean = sanitizePersistedSourceIntakeRecord(rawIntake, docIdsSet);
      if (clean) {
        const localIntake = options.existingIntake[clean.documentId];
        if (
          clean.provenanceDeclaration &&
          localIntake?.provenanceDeclaration &&
          clean.provenanceDeclaration.declaredOriginLevel !==
            localIntake.provenanceDeclaration.declaredOriginLevel
        ) {
          conflicts.push({
            kind: 'provenance_declaration_conflict',
            id: clean.documentId,
            details: `Rozbieżna deklaracja proweniencji operatora dla ${clean.documentId}.`
          });
        }
        if (clean.provenanceDeclaration) {
          externalVerificationClaimsCount += 1;
        }
        validIntakeRecords.push(clean);
      }
    }
  }

  // Walidacja sesji audytu
  const validSessions: AuditSessionRecord[] = [];
  const rawSessions = Array.isArray(parsed.sessions) ? parsed.sessions : [];
  const existingSessionMap = new Map(options.existingSessions.map((s) => [s.sessionId, s]));
  const seenSessionIds = new Set<string>();

  for (let i = 0; i < rawSessions.length; i += 1) {
    const rawSess = rawSessions[i];
    const cleanSess = sanitizeAuditSessionRecord(rawSess, docIdsSet, questionIds);
    if (!cleanSess) {
      const id =
        isPlainRecord(rawSess) && typeof rawSess.sessionId === 'string'
          ? rawSess.sessionId
          : `session[${i}]`;
      rejectedItems.push({
        kind: 'entry',
        id,
        reason: 'Nieprawidłowy rekord sesji audytowej lub nieznany documentId.'
      });
      continue;
    }
    if (seenSessionIds.has(cleanSess.sessionId)) {
      rejectedItems.push({
        kind: 'entry',
        id: cleanSess.sessionId,
        reason: `Zduplikowany identyfikator sesji: ${cleanSess.sessionId}.`
      });
      continue;
    }
    seenSessionIds.add(cleanSess.sessionId);

    const existingSess = existingSessionMap.get(cleanSess.sessionId);
    if (
      existingSess &&
      (existingSess.documentId !== cleanSess.documentId ||
        existingSess.scope !== cleanSess.scope ||
        existingSess.artifactSha256 !== cleanSess.artifactSha256)
    ) {
      conflicts.push({
        kind: 'session_scope_mismatch',
        id: cleanSess.sessionId,
        details: `Konflikt zakresu lub skrótu SHA-256 w sesji ${cleanSess.sessionId}.`
      });
    }
    validSessions.push(cleanSess);
  }

  // Walidacja wpisów dowodowych (współdzielona funkcja walidacji B3)
  const rawEntries = Array.isArray(parsed.entries) ? parsed.entries : [];
  const validEntries: EvidenceLedgerEntry[] = [];
  const seenEntryIds = new Set<string>();
  const existingEntryMap = new Map(options.existingWorkingEntries.map((e) => [e.evidenceId, e]));

  for (let i = 0; i < rawEntries.length; i += 1) {
    const res = validateImportedEvidenceEntryObject(
      rawEntries[i],
      i,
      sourceMap,
      questionIds,
      seenEntryIds,
      { isLocalStorageMigration: false }
    );
    if (res.rejection) {
      rejectedItems.push(res.rejection);
      if (
        res.rejection.reason.includes('Nieznany documentId') &&
        isPlainRecord(rawEntries[i]) &&
        typeof (rawEntries[i] as Record<string, unknown>).documentId === 'string'
      ) {
        unknownSourceIds.add(String((rawEntries[i] as Record<string, unknown>).documentId));
      }
      continue;
    }
    if (!res.entry) {
      continue;
    }
    if (res.importedVerificationClaim) {
      externalVerificationClaimsCount += 1;
    }
    if (res.versionMismatchConflict) {
      conflicts.push({
        kind: 'document_version_mismatch',
        id: res.versionMismatchConflict.id,
        details: res.versionMismatchConflict.details
      });
    }
    const prev = existingEntryMap.get(res.entry.evidenceId);
    if (
      prev &&
      (prev.clinicalObservation !== res.entry.clinicalObservation ||
        prev.sourceExcerptRef !== res.entry.sourceExcerptRef ||
        prev.relationship !== res.entry.relationship)
    ) {
      conflicts.push({
        kind: 'evidence_content_mismatch',
        id: res.entry.evidenceId,
        details: `Kolizja treści dowodu ${res.entry.evidenceId} względem lokalnego wpisu.`
      });
    }
    validEntries.push(res.entry);
  }

  // Walidacja notatek roboczych
  const rawNotes = Array.isArray(parsed.workingNotes) ? parsed.workingNotes : [];
  const validNotes: InformalWorkingNote[] = [];
  const seenNoteIds = new Set<string>();
  for (let i = 0; i < rawNotes.length; i += 1) {
    const noteRes = validateImportedWorkingNoteObject(
      rawNotes[i],
      i,
      sourceMap,
      questionIds,
      seenNoteIds
    );
    if (noteRes.rejection) {
      rejectedItems.push(noteRes.rejection);
    } else if (noteRes.note) {
      validNotes.push(noteRes.note);
    }
  }

  if (rejectedItems.length > 0) {
    errors.push(
      `Odrzucono ${rejectedItems.length} niezgodnych lub niepoprawnych elementów dossier — zastosowanie zablokowane.`
    );
  }

  const reverificationRequiredCount = validEntries.filter(
    (e) =>
      e.requiresReverification ||
      e.qualificationClass === 'source_excerpt_reviewed' ||
      e.qualificationClass === 'source_excerpt_pending_review' ||
      e.qualificationClass === 'traceability_reference'
  ).length;

  warnings.push(
    'Wszystkie zewnętrzne deklaracje pochodzenia i statusy source_excerpt_reviewed zostają obniżone do niepotwierdzonych zgłoszeń do ręcznego sprawdzenia na lokalnych plikach PDF.'
  );

  return {
    isValid: errors.length === 0,
    canImport: errors.length === 0,
    sourceFormatVersion: AUDIT_DOSSIER_SCHEMA_VERSION,
    migrationNote: null,
    errors,
    warnings,
    validSessions,
    validIntakeRecords,
    validEntries,
    validNotes,
    incomingSourcesCount: incomingSources.length,
    incomingArtifactsCount,
    incomingSessionsCount: rawSessions.length,
    incomingEntriesCount: rawEntries.length,
    incomingNotesCount: rawNotes.length,
    incomingQuestionsCount: Array.isArray(parsed.questionChecklistSnapshots)
      ? parsed.questionChecklistSnapshots.length
      : 0,
    conflictsCount: conflicts.length,
    conflicts,
    unknownSourceIds: Array.from(unknownSourceIds),
    missingSourcesCount,
    reverificationRequiredCount,
    externalVerificationClaimsCount,
    rejectedItems,
    payloadMetadata: {
      schemaVersion: AUDIT_DOSSIER_SCHEMA_VERSION,
      dossierId: typeof parsed.dossierId === 'string' ? parsed.dossierId : null,
      exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : null,
      exportScope: typeof parsed.exportScope === 'string' ? parsed.exportScope : null,
      dossierJsonSha256:
        typeof parsed.dossierJsonSha256 === 'string' ? parsed.dossierJsonSha256 : null,
      sourceRegistryVersion:
        typeof parsed.sourceRegistryVersion === 'string' ? parsed.sourceRegistryVersion : null
    }
  };
}

export function applyPreviewedAuditDossierImport(
  preview: AuditDossierImportPreview,
  currentState: {
    sources: readonly SourceRegistryEntry[];
    sessions: readonly AuditSessionRecord[];
    workingEntries: readonly EvidenceLedgerEntry[];
    workingNotes: readonly InformalWorkingNote[];
    intakeRecords: Readonly<Record<string, PersistedSourceIntakeRecord>>;
  },
  now: Date = new Date()
): {
  mergedSessions: AuditSessionRecord[];
  mergedEntries: EvidenceLedgerEntry[];
  mergedNotes: InformalWorkingNote[];
  mergedIntakeRecords: Record<string, PersistedSourceIntakeRecord>;
} {
  if (!preview.canImport) {
    throw new Error('Nie można zastosować importu dossier zawierającego błędy walidacji.');
  }

  const importedAt = now.toISOString();
  const sourceMap = new Map(currentState.sources.map((s) => [s.documentId, s]));

  // Scalanie wpisów dowodowych — ZAWSZE obniżamy zewnętrzne source_excerpt_reviewed
  const entryMap = new Map(currentState.workingEntries.map((e) => [e.evidenceId, e]));
  for (const entry of preview.validEntries) {
    let downgradedClass: EvidenceQualificationClass = entry.qualificationClass;
    if (entry.qualificationClass === 'source_excerpt_reviewed') {
      downgradedClass = 'source_excerpt_pending_review';
    } else if (entry.qualificationClass === 'conflicting_source_excerpt') {
      downgradedClass = 'conflicting_reference';
    }
    entryMap.set(entry.evidenceId, {
      ...entry,
      qualificationClass: downgradedClass,
      requiresReverification: true,
      autoResolved: false,
      importProvenance: {
        isImported: true,
        importedAt,
        importClaimStatus:
          entry.importProvenance?.importClaimStatus ?? 'imported_unverified_claim',
        claimedQualificationClass:
          entry.importProvenance?.claimedQualificationClass ?? entry.qualificationClass,
        claimedReviewStatus:
          entry.importProvenance?.claimedReviewStatus ?? entry.reviewStatus,
        claimedSourceDocumentHash:
          entry.importProvenance?.claimedSourceDocumentHash ?? entry.sourceDocumentHash,
        claimedOriginConfirmedByImport:
          entry.importProvenance?.claimedOriginConfirmedByImport ?? false,
        localConfirmationState: 'unconfirmed_imported_claim',
        migrationSourceVersion:
          preview.sourceFormatVersion === '1.0.0' ? 'b2_master04' : 'b3_master05'
      }
    });
  }

  // Scalanie notatek roboczych
  const noteMap = new Map(currentState.workingNotes.map((n) => [n.noteId, n]));
  for (const note of preview.validNotes) {
    noteMap.set(note.noteId, {
      ...note,
      isInformalWorkingNote: true,
      disclaimerAcknowledged: true
    });
  }

  // Scalanie sesji — jeśli brak żywego PDF w pamięci, wymagaj ponownego wskazania pliku
  const sessionMap = new Map(currentState.sessions.map((s) => [s.sessionId, s]));
  for (const sess of preview.validSessions) {
    const localDoc = sourceMap.get(sess.documentId);
    const hasLivePdf = hasLivePhysicalPdfInSession(localDoc);
    const hasSameHashInMemory =
      hasLivePdf &&
      (!sess.artifactSha256 ||
        !localDoc?.sha256 ||
        sess.artifactSha256.toLowerCase() === localDoc.sha256.toLowerCase());
    sessionMap.set(sess.sessionId, {
      ...sess,
      requiresFileReselectionAfterReload:
        !hasSameHashInMemory && Boolean(sess.artifactId || sess.artifactSha256),
      disclaimer: AUDIT_SESSION_REPORT_DISCLAIMER
    });
  }

  // Scalanie rekordów intake z wymuszeniem statusu deklaracji operatora
  const mergedIntake: Record<string, PersistedSourceIntakeRecord> = {
    ...currentState.intakeRecords
  };
  for (const rec of preview.validIntakeRecords) {
    mergedIntake[rec.documentId] = {
      ...rec,
      provenanceDeclaration: rec.provenanceDeclaration
        ? {
            ...rec.provenanceDeclaration,
            declaredOriginLevel:
              rec.provenanceDeclaration.declaredOriginLevel ===
              'official_origin_independently_confirmed'
                ? 'official_origin_operator_declared'
                : rec.provenanceDeclaration.declaredOriginLevel,
            isOperatorDeclaredOnly: true
          }
        : mergedIntake[rec.documentId]?.provenanceDeclaration ?? null
    };
  }

  return {
    mergedSessions: Array.from(sessionMap.values()),
    mergedEntries: Array.from(entryMap.values()),
    mergedNotes: Array.from(noteMap.values()),
    mergedIntakeRecords: mergedIntake
  };
}

export async function verifyAuditDossierJsonSha256(
  rawJsonText: string
): Promise<{
  status: 'matched' | 'mismatched' | 'not_present' | 'invalid';
  claimedSha256: string | null;
  computedSha256: string | null;
}> {
  try {
    const parsed: unknown = JSON.parse(rawJsonText);
    if (!isPlainRecord(parsed) || hasPrototypePollutionKey(parsed)) {
      return { status: 'invalid', claimedSha256: null, computedSha256: null };
    }
    const claimed = typeof parsed.dossierJsonSha256 === 'string' ? parsed.dossierJsonSha256.trim().toLowerCase() : null;
    if (!claimed) {
      return { status: 'not_present', claimedSha256: null, computedSha256: null };
    }
    if (!isValidSha256Hex(claimed)) {
      return { status: 'invalid', claimedSha256: claimed, computedSha256: null };
    }
    const canonicalJson = JSON.stringify({ ...parsed, dossierJsonSha256: null });
    const encoded = new TextEncoder().encode(canonicalJson);
    const bytes = new Uint8Array(new ArrayBuffer(encoded.byteLength));
    bytes.set(encoded);
    const shaRes = await computeSha256HexFromBytes(bytes);
    if (!shaRes.ok) {
      return { status: 'invalid', claimedSha256: claimed, computedSha256: null };
    }
    const computed = shaRes.sha256Hex.toLowerCase();
    return {
      status: computed === claimed ? 'matched' : 'mismatched',
      claimedSha256: claimed,
      computedSha256: computed
    };
  } catch {
    return { status: 'invalid', claimedSha256: null, computedSha256: null };
  }
}

export function getDocumentReadinessLabel(status: DocumentAuditReadinessStatus): string {
  switch (status) {
    case 'not_started':
      return 'Nie rozpoczęto (not_started)';
    case 'file_selected':
      return 'Wskazano plik lokalny (file_selected)';
    case 'technical_inspection_complete':
      return 'Inspekcja techniczna PDF zakończona';
    case 'metadata_comparison_pending':
      return 'Oczekuje na porównanie metadanych';
    case 'ready_for_manual_review':
      return 'Gotowy do przeglądu ręcznego';
    case 'manual_review_in_progress':
      return 'Przegląd ręczny w toku';
    case 'review_requires_rework':
      return 'Wymaga ponownego opracowania / rozbieżność';
    case 'review_complete_pending_human_decision':
      return 'Materiał skompletowany — czeka na decyzję człowieka';
  }
}

export function getDocumentProvenanceLabel(level: DocumentProvenanceLevel): string {
  switch (level) {
    case 'official_origin_independently_confirmed':
      return 'Pochodzenie potwierdzone niezależnie (zaufany SHA-256 repozytorium)';
    case 'official_origin_operator_declared':
      return 'Deklaracja operatora (brak niezależnego potwierdzenia kryptograficznego)';
    case 'origin_unknown':
      return 'Pochodzenie nieznane / niesprawdzone';
    case 'origin_mismatch':
      return 'Niezgodność pochodzenia / dokument historyczny';
    case 'manual_review_required':
      return 'Wymaga ręcznego ustalenia pochodzenia';
  }
}

export function getAuditSessionStatusLabel(status: AuditSessionStatus): string {
  switch (status) {
    case 'draft':
      return 'Szkic sesji (draft)';
    case 'in_progress':
      return 'Sesja w toku (in_progress)';
    case 'paused':
      return 'Wstrzymana (paused)';
    case 'completed_as_working_record':
      return 'Zakończona jako zapis roboczy (NIE zatwierdzenie kliniczne)';
    case 'requires_follow_up':
      return 'Wymaga dalszych czynności (requires_follow_up)';
  }
}

export function getQuestionB5WorkStatusLabel(status: QuestionB5WorkStatus): string {
  switch (status) {
    case 'not_started':
      return 'Nie rozpoczęto';
    case 'sources_pending':
      return 'Brak lokalnego PDF ChPL';
    case 'document_available':
      return 'Dokument PDF dostępny';
    case 'evidence_review_in_progress':
      return 'Analiza dowodów w toku';
    case 'conflicting_evidence':
      return 'Wykryto rozbieżności dowodowe';
    case 'awaiting_human_decision':
      return 'Gotowe do decyzji klinicznej człowieka';
    case 'awaiting_authority_clarification':
      return 'Wymaga wyjaśnienia organu / RPL';
    case 'work_record_complete':
      return 'Zapis techniczny kompletny (autoResolved: false)';
  }
}

