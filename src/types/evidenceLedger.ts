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

export type SourceProductScopeKey =
  | Stage1ChplProductKey
  | 'vaxigrip_tetra_historical_2025_2026'
  | 'infanrix_hexa'
  | 'pso_2027_general';

/**
 * Pojedynczy wpis w Rejestrze Dokumentów Źródłowych (Etap B2).
 */
export interface SourceRegistryEntry {
  documentId: string;
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
  isHistoricalRejectedForCurrentSeason?: boolean;
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
 * Wpis w Rejestrze Dowodów (Evidence Ledger) Etapu B2.
 * Niezmiennik kliniczny: autoResolved zawsze ma wartość false.
 */
export interface EvidenceLedgerEntry {
  evidenceId: string;
  questionId: string;
  productKey: SourceProductScopeKey;
  productLabel: string;
  documentId: string;
  documentTitle: string;
  officialSourceUrl: string;
  sourceDocumentHash: string | null;
  sha256Basis: Sha256VerificationBasis;
  location: QrdLocationReference;
  sourceExcerptRef: string;
  clinicalObservation: string;
  relationship: EvidenceRelationship;
  reviewStatus: EvidenceReviewStatus;
  questionWorkStatus: QuestionWorkStatus;
  autoResolved: false;
  origin: EvidenceOrigin;
  isWorkingNote: boolean;
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
  reviewStatus: EvidenceReviewStatus | 'all';
  origin: EvidenceOrigin | 'all';
  searchQuery: string;
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
  workingNotesCount: number;
  relationshipsCount: Record<EvidenceRelationship, number>;
  linkedDocumentIds: string[];
}

export interface EvidenceLedgerStorageSaveResult {
  success: boolean;
  error: string | null;
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
  kind: 'entry' | 'workingNote' | 'root';
  id: string;
  reason: string;
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
  rejectedItems: EvidenceLedgerImportRejectedItem[];
  payloadMetadata: {
    schemaVersion: string | null;
    exportedAt: string | null;
    sourceRegistryVersion: string | null;
    sourceCount: number;
  };
}
