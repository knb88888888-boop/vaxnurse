import type { Stage1ChplProductKey } from './childVaccines';

export type SourceAuthorityType =
  | 'regulator_document'
  | 'rpl_registry'
  | 'ema_epar'
  | 'mz_gis_document'
  | 'secondary_reference';

/**
 * Status technicznej weryfikacji pochodzenia i dostępności dokumentu źródłowego.
 * UWAGA: Żaden status NIE oznacza klinicznego zatwierdzenia karty ChPL ani procedury PSO.
 */
export type SourceVerificationStatus =
  | 'not_checked'
  | 'official_source_confirmed'
  | 'official_source_unavailable'
  | 'metadata_mismatch'
  | 'document_version_uncertain'
  | 'requires_manual_review';

export type Sha256VerificationBasis =
  | 'bundle_recorded_pdf_sha256'
  | 'local_workspace_pdf_sha256'
  | 'not_verified_binary';

/**
 * Typ obiektu w Rejestrze Źródeł (Etap B3).
 * Pozwala rozróżnić pozyskany dokument od wpisu rejestrowego, endpointu, próby pobrania i wersji historycznych.
 */
export type SourceObjectType =
  | 'official_document'
  | 'official_registry_record'
  | 'official_endpoint'
  | 'retrieval_attempt'
  | 'historical_document'
  | 'local_reference_document'
  | 'secondary_document';

/**
 * Oś 1 (B3): Pochodzenie źródła (Source Origin).
 */
export type SourceOriginAxisStatus =
  | 'not_checked'
  | 'official_origin_confirmed'
  | 'origin_uncertain'
  | 'origin_mismatch'
  | 'manual_review_required';

/**
 * Oś 2 (B3): Pozyskanie pliku (File Acquisition).
 */
export type SourceAcquisitionAxisStatus =
  | 'not_acquired'
  | 'acquired'
  | 'session_local_file_selected'
  | 'temporarily_unavailable'
  | 'permanently_unavailable_unknown'
  | 'access_failed'
  | 'historical_copy_only';

/**
 * Oś B4: Dostępność rzeczywistego pliku PDF w bieżącej sesji przeglądarki.
 */
export type FileAvailabilityStatus =
  | 'no_file'
  | 'selected_in_session'
  | 'verified_in_session'
  | 'metadata_only_reload_required';

/**
 * Oś B4: Miejsce i trwałość przechowywania artefaktu PDF (nigdy bajtów PDF w localStorage).
 */
export type PdfStorageLocationStatus =
  | 'no_binary_file'
  | 'repository_local_file_metadata'
  | 'session_memory_only'
  | 'metadata_persisted_reload_required';

/**
 * Oś 3 (B3/B4): Integralność pliku / SHA-256 (File Integrity).
 */
export type FileIntegrityAxisStatus =
  | 'not_checked'
  | 'hash_calculated'
  | 'reference_hash_recorded_no_local_file'
  | 'hash_matches_known_reference'
  | 'hash_mismatch'
  | 'hash_reference_unavailable'
  | 'hash_calculation_failed';

/**
 * Oś 4 (B3): Kontrola treści dokumentu (Content Review).
 */
export type ContentReviewAxisStatus =
  | 'not_reviewed'
  | 'excerpt_checked'
  | 'section_reviewed'
  | 'discrepancy_found'
  | 'awaiting_human_review';

export interface SourceStatusAxes {
  originStatus: SourceOriginAxisStatus;
  acquisitionStatus: SourceAcquisitionAxisStatus;
  integrityStatus: FileIntegrityAxisStatus;
  contentReviewStatus: ContentReviewAxisStatus;
  fileAvailability?: FileAvailabilityStatus;
  storageMode?: PdfStorageLocationStatus;
}

export type HashComparisonStatus =
  | 'calculated_from_local_file'
  | 'compared_with_known_reference'
  | 'compared_with_trusted_reference'
  | 'reference_recorded_no_local_file'
  | 'reference_untrusted'
  | 'not_compared'
  | 'hash_from_untrusted_source'
  | 'hash_mismatch'
  | 'calculation_failed';

export type HashReferenceType =
  | 'none'
  | 'bundle_recorded_sha256'
  | 'local_workspace_sha256'
  | 'prior_session_snapshot'
  | 'operator_untrusted'
  | 'imported_unverified_claim';

/**
 * Pełna proweniencja sumy SHA-256 (B3/B4).
 * Sam hash potwierdza wyłącznie identyczność bajtową z ewentualnym wzorcem — nigdy autentyczność urzędową ani poprawność kliniczną.
 */
export interface HashProvenanceRecord {
  algorithm: 'SHA-256';
  value: string | null;
  artifactId: string | null;
  calculatedAt: string | null;
  calculationMethod: string;
  fileName: string | null;
  fileSizeBytes: number | null;
  referenceType: HashReferenceType;
  referenceHash: string | null;
  comparisonStatus: HashComparisonStatus;
  mimeType?: string | null;
  pdfPageCount?: number | null;
  verificationSessionId?: string | null;
  referenceOriginNote?: string | null;
}

export type LocalPdfMetadataStatus = 'not_run' | 'extracted' | 'partial_or_empty' | 'failed';
export type LocalPdfTextLayerStatus = 'not_run' | 'text_layer_available' | 'no_text_layer' | 'failed';
export type LocalPdfPreviewStatus =
  | 'not_opened'
  | 'previewed_in_session'
  | 'reselection_required_after_reload'
  | 'failed';
export type LocalPdfPageCountComparisonStatus = 'matches' | 'mismatch' | 'not_available';
export type LocalPdfHashReferenceMode = 'registry_reference' | 'none' | 'operator_untrusted';

export interface LocalPdfMetadataSummary {
  title: string | null;
  author: string | null;
  subject: string | null;
  creator: string | null;
  producer: string | null;
  creationDate: string | null;
  modDate: string | null;
  pdfVersion: string | null;
  untrustedDisclaimer: string;
}

export type ArtifactChangeCategory =
  | 'initial_record'
  | 'updated_same_document'
  | 'new_chpl_revision'
  | 'alternate_language_version'
  | 'historical_version'
  | 'same_filename_modified_bytes'
  | 'unverified_origin_copy';

/**
 * Konkretny artefakt pliku dokumentu (oddzielony od rekordu źródła/urzędu — Etap B3).
 */
export interface DocumentArtifactRecord {
  artifactId: string;
  documentId: string;
  language: 'PL' | 'EN';
  fileName: string | null;
  documentDate: string | null;
  retrievedAt: string | null;
  sourceUrl: string;
  previousArtifactId: string | null;
  versionSequence: number;
  changeCategory: ArtifactChangeCategory;
  isCurrentActiveVersion: boolean;
  isHistoricalVersion: boolean;
  requiresReverification: boolean;
  physicalPageCount: number | null;
  fileSizeBytes: number | null;
  hashProvenance: HashProvenanceRecord;
  localArtifactId?: string | null;
  mimeType?: string | null;
  selectedInSessionAt?: string | null;
  pdfParserVersion?: string | null;
  metadataExtractionStatus?: LocalPdfMetadataStatus;
  textExtractionStatus?: LocalPdfTextLayerStatus;
  localPreviewStatus?: LocalPdfPreviewStatus;
  operatorDeclaredOrigin?: string | null;
  reverificationRequired?: boolean;
  pdfMetadata?: LocalPdfMetadataSummary | null;
}

export type RetrievalAttemptResult =
  | 'success'
  | 'http_error'
  | 'network_error'
  | 'metadata_only'
  | 'not_attempted';

/**
 * Rekord pojedynczej próby dostępu do źródła (Retrieval Attempt — Etap B3).
 */
export interface RetrievalAttemptRecord {
  attemptId: string;
  documentId: string;
  attemptedAt: string;
  targetUrl: string;
  accessMethod: 'http_get' | 'http_head' | 'local_filesystem_read' | 'bundle_metadata_carryover';
  result: RetrievalAttemptResult;
  httpStatus: number | null;
  errorDescription: string | null;
  checkScope: string;
  artifactId: string | null;
}

export type SourceProductScopeKey =
  | Stage1ChplProductKey
  | 'vaxigrip_tetra_historical_2025_2026'
  | 'infanrix_hexa'
  | 'pso_2027_general';

/**
 * Pojedynczy wpis w Rejestrze Dokumentów Źródłowych (Etap B2 + rozszerzenie B3).
 */
export interface SourceRegistryEntry {
  documentId: string;
  objectType: SourceObjectType;
  productKey: SourceProductScopeKey;
  productDisplayName: string;
  linkedCatalogVaccineIds: string[];
  linkedProcedureIds: string[];
  documentTitle: string;
  documentType: string;
  authority: string;
  authorityType: SourceAuthorityType;
  officialSourceUrl: string;
  rplIdOrRegistryNumber: string | null;
  marketingAuthorizationNumber: string | null;
  marketingAuthorizationHolder: string | null;
  language: 'PL' | 'EN';
  revisionDate: string | null;
  publicationDate: string | null;
  retrievedAt: string | null;
  physicalPageCount: number | null;
  pdfScopeRange: string;
  fileSizeBytes: number | null;
  sha256: string | null;
  sha256ScopeLabel: string;
  sha256Basis: Sha256VerificationBasis;
  sourceVerificationStatus: SourceVerificationStatus;
  sourceVerificationStatusLabel: string;
  sourceVerificationDate: string | null;
  sourceVerificationNotes: string;
  statusAxes: SourceStatusAxes;
  currentArtifact: DocumentArtifactRecord | null;
  artifactHistory: DocumentArtifactRecord[];
  retrievalAttempts: RetrievalAttemptRecord[];
  registryVsFileDistinctionNote: string;
  historicalNotice?: string;
  isHistoricalRejectedForCurrentSeason?: boolean;
  activeSessionPageCount?: number | null;
  registryReferencePageCount?: number | null;
  pageCountComparisonStatus?: LocalPdfPageCountComparisonStatus | null;
  sessionFileName?: string | null;
  hasPersistedLocalArtifactMetadata?: boolean;
}

export type PageNumberingType =
  | 'pdf_page_index'
  | 'printed_page'
  | 'range_in_bundle'
  | 'unconfirmed';

export type EvidenceRelationship =
  | 'supports'
  | 'contradicts'
  | 'contextualizes'
  | 'does_not_resolve'
  | 'missing_information';

export type EvidenceReviewStatus =
  | 'unreviewed_extract'
  | 'evidence_logged'
  | 'conflicting_evidence'
  | 'awaiting_human_review'
  | 'requires_authority_clarification';

export type QuestionWorkStatus =
  | 'open'
  | 'source_identified'
  | 'evidence_collected'
  | 'conflicting_evidence'
  | 'awaiting_human_review'
  | 'requires_authority_clarification';

export type EvidenceOrigin = 'bundle_extract' | 'auditor_working_entry';

/**
 * Klasa kwalifikacji wpisu dowodowego (Etap B3).
 * Ściśle oddziela odniesienie (reference) od zweryfikowanego fragmentu z rzeczywistego dokumentu (reviewed excerpt).
 */
export type EvidenceQualificationClass =
  | 'traceability_reference'
  | 'source_excerpt_pending_review'
  | 'source_excerpt_reviewed'
  | 'conflicting_reference'
  | 'conflicting_source_excerpt'
  | 'secondary_reference'
  | 'unavailable_source_reference';

export type EvidenceImportClaimStatus =
  | 'local_author_record'
  | 'imported_unverified_claim'
  | 'imported_verified_claim_unconfirmed_locally';

export interface EvidenceImportProvenance {
  isImported: boolean;
  importedAt: string | null;
  importClaimStatus: EvidenceImportClaimStatus;
  claimedQualificationClass: EvidenceQualificationClass | null;
  claimedReviewStatus: EvidenceReviewStatus | null;
  claimedSourceDocumentHash: string | null;
  claimedOriginConfirmedByImport: boolean;
  localConfirmationState: 'local_session_author' | 'unconfirmed_imported_claim';
  migrationSourceVersion?: 'b2_master04' | 'b3_master05' | null;
}

/**
 * Precyzyjne wskazanie lokalizacji QRD oraz odrębnej numeracji stron PDF i druku.
 */
export interface QrdLocationReference {
  qrdSection: string;
  qrdSectionTitle: string;
  pdfPageIndex: number | null;
  pdfPageRangeLabel: string;
  printedPageNumber: string | null;
  pageNumberingType: PageNumberingType;
  physicalDocumentPageCount: number | null;
}

/**
 * Wpis w Rejestrze Dowodów (Evidence Ledger) Etapu B2/B3.
 * Niezmiennik kliniczny: autoResolved zawsze ma wartość false.
 */
export interface EvidenceLedgerEntry {
  evidenceId: string;
  questionId: string;
  productKey: SourceProductScopeKey;
  productLabel: string;
  documentId: string;
  artifactId: string | null;
  documentTitle: string;
  officialSourceUrl: string;
  sourceDocumentHash: string | null;
  sha256Basis: Sha256VerificationBasis;
  location: QrdLocationReference;
  sourceExcerptRef: string;
  clinicalObservation: string;
  relationship: EvidenceRelationship;
  qualificationClass: EvidenceQualificationClass;
  reviewStatus: EvidenceReviewStatus;
  questionWorkStatus: QuestionWorkStatus;
  autoResolved: false;
  origin: EvidenceOrigin;
  isWorkingNote: boolean;
  requiresReverification: boolean;
  importProvenance?: EvidenceImportProvenance;
  verificationSessionId?: string | null;
  sourceAxisSummaryAtReview?: string | null;
  reviewedInLocalPdfSession?: boolean;
  recordedAt: string;
  recordedBy: string;
}

/**
 * Nieformalna lokalna notatka robocza audytora w przeglądarce.
 * Nie stanowi formalnego podpisu, dziennika audytowego ani zatwierdzenia klinicznego.
 */
export interface InformalWorkingNote {
  noteId: string;
  questionId: string;
  documentId: string | null;
  qrdSection: string | null;
  pdfPageIndex: number | null;
  noteText: string;
  createdAt: string;
  updatedAt: string;
  authorLabel: string;
  isInformalWorkingNote: true;
  disclaimerAcknowledged: true;
}

export interface EvidenceTraceabilityFilters {
  questionId: string;
  documentId: string;
  productKey: SourceProductScopeKey | 'all';
  qrdSection: string;
  relationship: EvidenceRelationship | 'all';
  qualificationClass?: EvidenceQualificationClass | 'all';
  reviewStatus: EvidenceReviewStatus | 'all';
  origin: EvidenceOrigin | 'all';
  searchQuery: string;
}

/**
 * Dynamiczny raport jakości danych źródłowych i dowodowych (Etap B3 Quality Dashboard).
 */
export interface SourceQualityMetrics {
  totalSourceRecords: number;
  acquiredDocumentsCount: number;
  registryEntriesWithoutPdfCount: number;
  failedRetrievalAttemptsCount: number;
  historicalDocumentsCount: number;
  documentsWithoutSha256Count: number;
  documentsWithCalculatedSha256Count: number;
  documentsWithComparedHashCount: number;
  referenceHashesWithoutLocalFileCount: number;
  sessionVerifiedPdfCount: number;
  reloadRequiredPdfCount: number;
  referencesRequiringReviewCount: number;
  verifiedExcerptsCount: number;
  conflictingReferencesCount: number;
  conflictingExcerptsCount: number;
  reverificationRequiredCount: number;
  questionsWithoutConfirmedExcerptsCount: number;
  importedUnconfirmedClaimsCount: number;
  disclaimer: string;
}

export interface QuestionTraceabilitySummary {
  questionId: string;
  productKey: Stage1ChplProductKey;
  chplSectionOrSubpoint: string;
  clinicalQuestion: string;
  ambiguitySummary: string;
  autoResolved: false;
  workStatus: QuestionWorkStatus;
  bundleExtractCount: number;
  workingEvidenceCount: number;
  totalEvidenceCount: number;
  verifiedExcerptsCount: number;
  pendingReviewCount: number;
  conflictingReferencesCount: number;
  conflictingExcerptsCount: number;
  workingNotesCount: number;
  relationshipsCount: Record<EvidenceRelationship, number>;
  linkedDocumentIds: string[];
}

export interface PersistedLocalSourceArtifactEntry {
  documentId: string;
  currentArtifact: DocumentArtifactRecord | null;
  artifactHistory: DocumentArtifactRecord[];
  sha256: string | null;
  sha256Basis: Sha256VerificationBasis;
  sha256ScopeLabel: string;
  physicalPageCount: number | null;
  registryReferencePageCount: number | null;
  pageCountComparisonStatus: LocalPdfPageCountComparisonStatus | null;
  fileSizeBytes: number | null;
  sessionFileName: string | null;
  pageCountNote?: string;
  statusAxes: Pick<
    SourceStatusAxes,
    'originStatus' | 'acquisitionStatus' | 'integrityStatus' | 'contentReviewStatus'
  >;
  updatedAt: string;
}

export interface SourceArtifactsStoragePayload {
  schemaVersion: string;
  savedAt: string;
  bytesPersistedInLocalStorage: false;
  items: PersistedLocalSourceArtifactEntry[];
}

export interface EvidenceLedgerStorageSaveResult {
  success: boolean;
  error: string | null;
  rolledBack?: boolean;
}

export interface EvidenceLedgerMigrationReport {
  migratedFromVersion: 'b2_master04' | 'b3_master05' | 'empty';
  preservedEntryIds: string[];
  preservedNoteIds: string[];
  downgradedToReferenceCount: number;
  flaggedReverificationCount: number;
}

export interface EvidenceLedgerExportPayload {
  vaxnurseEvidenceLedger: true;
  schemaVersion: string;
  exportedAt: string;
  sourceRegistryVersion: string;
  containsPatientData: false;
  clinicalApprovalGranted: false;
  isWorkingDraft: true;
  disclaimer: string;
  sourceCount: number;
  sources: SourceRegistryEntry[];
  entries: EvidenceLedgerEntry[];
  workingNotes: InformalWorkingNote[];
}

export interface EvidenceLedgerImportRejectedItem {
  kind: 'entry' | 'workingNote' | 'sourceClaim' | 'root';
  id: string;
  reason: string;
}

export interface EvidenceLedgerImportConflict {
  kind: 'id_collision_different_content' | 'artifact_version_mismatch' | 'hash_mismatch_with_local_registry' | 'unknown_source_id' | 'missing_document_binary';
  id: string;
  details: string;
}

export interface EvidenceLedgerImportPreview {
  isValid: boolean;
  canImport: boolean;
  errors: string[];
  warnings: string[];
  validEntries: EvidenceLedgerEntry[];
  validNotes: InformalWorkingNote[];
  newEntriesCount: number;
  updatedEntriesCount: number;
  skippedDuplicatesCount: number;
  newNotesCount: number;
  updatedNotesCount: number;
  conflictsCount: number;
  conflicts: EvidenceLedgerImportConflict[];
  requiresManualReviewCount: number;
  importedVerificationClaimsCount: number;
  missingDocumentsCount: number;
  unknownSourceIds: string[];
  rejectedItems: EvidenceLedgerImportRejectedItem[];
  payloadMetadata: {
    schemaVersion: string | null;
    exportedAt: string | null;
    sourceRegistryVersion: string | null;
    sourceCount: number;
  };
}
