import type {
  Stage1ChplAuditBundle,
  Stage1ChplCheckOutcome,
  Stage1ChplProductKey,
  Stage1ChplSubpointAudit,
  Stage1HumanDecisionItem
} from '../types/childVaccines';
import type {
  ArtifactChangeCategory,
  ContentReviewAxisStatus,
  DocumentArtifactRecord,
  EvidenceLedgerEntry,
  EvidenceLedgerExportPayload,
  EvidenceLedgerImportConflict,
  EvidenceLedgerImportPreview,
  EvidenceLedgerImportRejectedItem,
  EvidenceLedgerMigrationReport,
  EvidenceLedgerStorageSaveResult,
  EvidenceOrigin,
  EvidenceQualificationClass,
  EvidenceRelationship,
  EvidenceReviewStatus,
  EvidenceTraceabilityFilters,
  FileAvailabilityStatus,
  FileIntegrityAxisStatus,
  HashComparisonStatus,
  HashProvenanceRecord,
  InformalWorkingNote,
  LocalPdfMetadataSummary,
  LocalPdfPageCountComparisonStatus,
  LocalPdfTextLayerStatus,
  LocalPdfMetadataStatus,
  PageNumberingType,
  PdfStorageLocationStatus,
  PersistedLocalSourceArtifactEntry,
  QrdLocationReference,
  QuestionTraceabilitySummary,
  QuestionWorkStatus,
  RetrievalAttemptRecord,
  SourceAcquisitionAxisStatus,
  SourceArtifactsStoragePayload,
  SourceAuthorityType,
  SourceObjectType,
  SourceOriginAxisStatus,
  SourceProductScopeKey,
  SourceQualityMetrics,
  SourceRegistryEntry,
  SourceStatusAxes,
  SourceVerificationStatus
} from '../types/evidenceLedger';
import {
  hasPrototypePollutionKey,
  isPlainRecord,
  isValidDateString,
  isValidHttpUrl
} from './catalogMerge';

export const EVIDENCE_LEDGER_SCHEMA_VERSION = '1.1.0';
export const LEGACY_B2_EVIDENCE_LEDGER_SCHEMA_VERSION = '1.0.0';
export const SUPPORTED_EVIDENCE_LEDGER_SCHEMA_VERSIONS: readonly string[] = [
  LEGACY_B2_EVIDENCE_LEDGER_SCHEMA_VERSION,
  EVIDENCE_LEDGER_SCHEMA_VERSION
] as const;
export const SOURCE_REGISTRY_VERSION = '2026.11.12-etap-b4-sources-2.1';
export const EVIDENCE_LEDGER_STORAGE_KEY = 'vaxnurse_chpl_evidence_ledger_v1';
export const WORKING_NOTES_STORAGE_KEY = 'vaxnurse_chpl_working_notes_v1';
export const SOURCE_ARTIFACTS_STORAGE_KEY = 'vaxnurse_chpl_source_artifacts_v1';
export const SOURCE_ARTIFACTS_SCHEMA_VERSION = '1.0.0';

export const SOURCE_QUALITY_DISCLAIMER =
  'Metryki pokazują stan dokumentacji i kontroli źródeł. Nie stanowią oceny klinicznej ani potwierdzenia poprawności wszystkich informacji o preparatach.';

export const HISTORICAL_DOCUMENT_NOTICE =
  'Dokument historyczny — nie stosować jako automatycznej podstawy bieżącego audytu';

export const EMPTY_QUESTION_EVIDENCE_MESSAGE =
  'Nie dodano jeszcze dowodów do tego pytania. Brak dowodów nie oznacza potwierdzenia ani zaprzeczenia informacji.';

export const INFORMAL_WORKING_NOTE_DISCLAIMER =
  'Wpis jest lokalną notatką roboczą. Nie stanowi formalnego dziennika audytowego, podpisu elektronicznego ani niezaprzeczalnego potwierdzenia wykonania czynności.';

export const LOCAL_WORKING_NOTE_AUTHOR = 'Robocza notatka lokalna (przeglądarka)';

export const MAX_EXCERPT_LENGTH = 500;
export const MAX_OBSERVATION_LENGTH = 1500;
export const MAX_WORKING_NOTE_LENGTH = 1500;

export const ALLOWED_AUTHORITY_TYPES: readonly SourceAuthorityType[] = [
  'regulator_document',
  'rpl_registry',
  'ema_epar',
  'mz_gis_document',
  'secondary_reference'
] as const;

export const ALLOWED_SOURCE_OBJECT_TYPES: readonly SourceObjectType[] = [
  'official_document',
  'official_registry_record',
  'official_endpoint',
  'retrieval_attempt',
  'historical_document',
  'local_reference_document',
  'secondary_document'
] as const;

export const ALLOWED_EVIDENCE_QUALIFICATION_CLASSES: readonly EvidenceQualificationClass[] = [
  'traceability_reference',
  'source_excerpt_pending_review',
  'source_excerpt_reviewed',
  'conflicting_reference',
  'conflicting_source_excerpt',
  'secondary_reference',
  'unavailable_source_reference'
] as const;

export const ALLOWED_SOURCE_VERIFICATION_STATUSES: readonly SourceVerificationStatus[] = [
  'not_checked',
  'official_source_confirmed',
  'official_source_unavailable',
  'metadata_mismatch',
  'document_version_uncertain',
  'requires_manual_review'
] as const;

export const ALLOWED_PAGE_NUMBERING_TYPES: readonly PageNumberingType[] = [
  'pdf_page_index',
  'printed_page',
  'range_in_bundle',
  'unconfirmed'
] as const;

export const ALLOWED_EVIDENCE_RELATIONSHIPS: readonly EvidenceRelationship[] = [
  'supports',
  'contradicts',
  'contextualizes',
  'does_not_resolve',
  'missing_information'
] as const;

export const ALLOWED_EVIDENCE_REVIEW_STATUSES: readonly EvidenceReviewStatus[] = [
  'unreviewed_extract',
  'evidence_logged',
  'conflicting_evidence',
  'awaiting_human_review',
  'requires_authority_clarification'
] as const;

export const ALLOWED_QUESTION_WORK_STATUSES: readonly QuestionWorkStatus[] = [
  'open',
  'source_identified',
  'evidence_collected',
  'conflicting_evidence',
  'awaiting_human_review',
  'requires_authority_clarification'
] as const;

export const DEFAULT_EVIDENCE_FILTERS: EvidenceTraceabilityFilters = {
  questionId: 'all',
  documentId: 'all',
  productKey: 'all',
  qrdSection: 'all',
  relationship: 'all',
  qualificationClass: 'all',
  reviewStatus: 'all',
  origin: 'all',
  searchQuery: ''
};

export const QRD_EXTENDED_SECTION_TITLES: Readonly<Record<string, string>> = {
  '1': '1. Nazwa produktu leczniczego',
  '2': '2. Skład jakościowy i ilościowy',
  '3': '3. Postać farmaceutyczna',
  '4.1': '4.1 Wskazania do stosowania',
  '4.2': '4.2 Dawkowanie i sposób podawania',
  '4.3': '4.3 Przeciwwskazania',
  '4.4': '4.4 Specjalne ostrzeżenia i środki ostrożności dotyczące stosowania',
  '4.5': '4.5 Interakcje z innymi produktami leczniczymi',
  '4.6': '4.6 Wpływ na płodność, ciążę i laktację',
  '4.7': '4.7 Wpływ na zdolność prowadzenia pojazdów',
  '4.8': '4.8 Działania niepożądane',
  '4.9': '4.9 Przedawkowanie',
  '5': '5. Właściwości farmakologiczne (5.1–5.3)',
  '5.1': '5.1 Właściwości farmakodynamiczne',
  '5.2': '5.2 Właściwości farmakokinetyczne',
  '5.3': '5.3 Przedkliniczne dane o bezpieczeństwie',
  '6': '6. Dane farmaceutyczne (6.1–6.6)',
  '6.1': '6.1 Wykaz substancji pomocniczych',
  '6.2': '6.2 Niezgodności farmaceutyczne',
  '6.3': '6.3 Okres ważności',
  '6.4': '6.4 Specjalne środki ostrożności podczas przechowywania',
  '6.5': '6.5 Rodzaj i zawartość opakowania',
  '6.6': '6.6 Specjalne środki ostrożności dotyczące usuwania i przygotowania',
  '7': '7. Podmiot odpowiedzialny posiadający pozwolenie na dopuszczenie do obrotu',
  '8': '8. Numery pozwoleń na dopuszczenie do obrotu',
  '9': '9. Data wydania pierwszego pozwolenia i data przedłużenia pozwolenia',
  '10': '10. Data zatwierdzenia lub częściowej zmiany tekstu ChPL'
};

const VALID_QRD_SECTION_PATTERN = /^(?:[1-3]|4\.[1-9]|5(?:\.[1-3])?|6(?:\.[1-6])?|[7-9]|10)$/;
const VALID_SHA256_PATTERN = /^[a-f0-9]{64}$/i;

const PRODUCT_LABELS_MAP: Readonly<Record<SourceProductScopeKey, string>> = {
  influvac_2026_2027: 'Influvac (sezon 2026/2027, trójwalentna)',
  vaxigrip_2026_2027: 'Vaxigrip (sezon 2026/2027, trójwalentna)',
  spikevax_xfg: 'Spikevax XFG (sezon 2026/2027)',
  bcg_10: 'Szczepionka przeciwgruźlicza BCG 10',
  vaxigrip_tetra_historical_2025_2026: 'VaxigripTetra (historyczny 2025/2026 — ODRZUCONY dla 2026/2027)',
  infanrix_hexa: 'Infanrix hexa (karta katalogowa)',
  pso_2027_general: 'Program Szczepień Ochronnych (PSO) na rok 2027'
};

export function getProductScopeLabel(productKey: SourceProductScopeKey): string {
  return PRODUCT_LABELS_MAP[productKey] ?? productKey;
}

export function getQrdSectionTitle(qrdSection: string): string {
  const trimmed = qrdSection.trim();
  return QRD_EXTENDED_SECTION_TITLES[trimmed] ?? `Punkt QRD ${trimmed}`;
}

export function isValidQrdSection(value: unknown): value is string {
  return typeof value === 'string' && VALID_QRD_SECTION_PATTERN.test(value.trim());
}

export function isValidSha256Hex(value: unknown): value is string {
  return typeof value === 'string' && VALID_SHA256_PATTERN.test(value.trim());
}

export function getSourceVerificationStatusLabel(status: SourceVerificationStatus): string {
  switch (status) {
    case 'official_source_confirmed':
      return 'Pochodzenie dokumentu potwierdzone (nie stanowi weryfikacji treści klinicznej)';
    case 'official_source_unavailable':
      return 'Źródło urzędowe niedostępne';
    case 'metadata_mismatch':
      return 'Niezgodność metadanych źródła';
    case 'document_version_uncertain':
      return 'Wersja dokumentu niepewna / historyczna';
    case 'requires_manual_review':
      return 'Wymaga ręcznej weryfikacji źródłowej';
    case 'not_checked':
      return 'Nie sprawdzono';
  }
}

export function getRelationshipPresentation(rel: EvidenceRelationship): {
  label: string;
  tone: 'info' | 'warning' | 'danger' | 'neutral';
} {
  switch (rel) {
    case 'supports':
      return { label: 'Potwierdza szczegół techniczny', tone: 'info' };
    case 'contradicts':
      return { label: 'Niezgodność / sprzeczność', tone: 'danger' };
    case 'contextualizes':
      return { label: 'Kontekst dokumentu (nie zamyka pytania)', tone: 'info' };
    case 'does_not_resolve':
      return { label: 'Nie rozstrzyga pytania', tone: 'warning' };
    case 'missing_information':
      return { label: 'Brak danych w źródle', tone: 'warning' };
  }
}

export function getReviewStatusLabel(status: EvidenceReviewStatus): string {
  switch (status) {
    case 'unreviewed_extract':
      return 'Ekstrakcja wstępna — do oceny';
    case 'evidence_logged':
      return 'Zapisany ślad dowodowy (roboczy)';
    case 'conflicting_evidence':
      return 'Niejednoznaczność / rozbieżność';
    case 'awaiting_human_review':
      return 'Oczekuje na decyzję audytora klinicznego';
    case 'requires_authority_clarification':
      return 'Wymaga wyjaśnienia źródła / podmiotu / organu';
  }
}

export function getQuestionWorkStatusLabel(status: QuestionWorkStatus): string {
  switch (status) {
    case 'open':
      return 'Otwarte (autoResolved: false)';
    case 'source_identified':
      return 'Źródło zidentyfikowane — wymaga oceny';
    case 'evidence_collected':
      return 'Zebrano odniesienia — wymaga decyzji człowieka';
    case 'conflicting_evidence':
      return 'Rozbieżne informacje w źródłach';
    case 'awaiting_human_review':
      return 'Oczekuje na decyzję kompetentnego audytora';
    case 'requires_authority_clarification':
      return 'Wymaga wyjaśnienia w dokumentacji urzędowej';
  }
}

export function getSourceObjectTypePresentation(objectType: SourceObjectType): {
  label: string;
  badgeText: string;
  tone: 'info' | 'warning' | 'danger' | 'neutral' | 'historical';
} {
  switch (objectType) {
    case 'official_document':
      return {
        label: 'Oficjalny dokument zdalny (bez lokalnego pliku PDF w repo)',
        badgeText: 'Dokument zdalny (brak kopii lokalnej)',
        tone: 'info'
      };
    case 'official_registry_record':
      return {
        label: 'Źródło rejestrowe (wpis RPL — bez lokalnego pliku PDF)',
        badgeText: 'Źródło rejestrowe (brak lokalnego PDF)',
        tone: 'warning'
      };
    case 'official_endpoint':
      return {
        label: 'Oficjalny endpoint API (brak pobranego dokumentu)',
        badgeText: 'Źródło niedostępne / endpoint API',
        tone: 'danger'
      };
    case 'retrieval_attempt':
      return {
        label: 'Rekord próby pobrania dokumentu',
        badgeText: 'Próba pobrania',
        tone: 'neutral'
      };
    case 'historical_document':
      return {
        label: HISTORICAL_DOCUMENT_NOTICE,
        badgeText: 'Dokument historyczny (odrzucony dla 2026/2027)',
        tone: 'historical'
      };
    case 'local_reference_document':
      return {
        label: 'Dokument pozyskany lokalnie (plik obecny w repozytorium)',
        badgeText: 'Dokument pozyskany lokalnie',
        tone: 'info'
      };
    case 'secondary_document':
      return {
        label: 'Materiał wtórny / komunikat pomocniczy (nie jest ChPL)',
        badgeText: 'Dokument wtórny',
        tone: 'warning'
      };
  }
}

export function getOriginAxisStatusLabel(status: SourceOriginAxisStatus): string {
  switch (status) {
    case 'not_checked':
      return 'Pochodzenie niesprawdzone';
    case 'official_origin_confirmed':
      return 'Oficjalne pochodzenie potwierdzone (adres/rejestr urzędowy)';
    case 'origin_uncertain':
      return 'Pochodzenie niepewne';
    case 'origin_mismatch':
      return 'Niezgodność pochodzenia źródła';
    case 'manual_review_required':
      return 'Pochodzenie wymaga ręcznego przeglądu';
  }
}

export function getAcquisitionAxisStatusLabel(status: SourceAcquisitionAxisStatus): string {
  switch (status) {
    case 'acquired':
      return 'Dokument pozyskany (kopia obecna lokalnie w repozytorium)';
    case 'session_local_file_selected':
      return 'Plik PDF wybrany lokalnie przez operatora w bieżącej sesji przeglądarki (wyłącznie w RAM sesji)';
    case 'not_acquired':
      return 'Nie pozyskano lokalnej kopii PDF (wyłącznie metadane / weryfikacja HTTP)';
    case 'temporarily_unavailable':
      return 'Źródło tymczasowo niedostępne';
    case 'permanently_unavailable_unknown':
      return 'Status trwałej dostępności nieustalony';
    case 'access_failed':
      return 'Nieudana próba pobrania (błąd endpointu / dostępu HTTP)';
    case 'historical_copy_only':
      return 'Wyłącznie historyczna kopia z poprzedniego sezonu';
  }
}

export function getFileAvailabilityLabel(status: FileAvailabilityStatus | undefined): string {
  switch (status) {
    case 'verified_in_session':
      return 'Otwarty i zweryfikowany technicznie w bieżącej sesji (PDF.js + SHA-256)';
    case 'selected_in_session':
      return 'Wybrany w bieżącej sesji (oczekuje na zakończenie walidacji / podglądu)';
    case 'metadata_only_reload_required':
      return 'Tylko metadane / po odświeżeniu wymagane ponowne wybranie pliku do podglądu';
    case 'no_file':
    default:
      return 'Brak pliku PDF w sesji przeglądarki';
  }
}

export function getPdfStorageLocationLabel(status: PdfStorageLocationStatus | undefined): string {
  switch (status) {
    case 'session_memory_only':
      return 'Wyłącznie pamięć sesji przeglądarki (RAM) — bajty PDF nigdy nie są zapisywane w localStorage ani wysyłane na serwer';
    case 'metadata_persisted_reload_required':
      return 'Zapisano lokalnie wyłącznie metadane i SHA-256 — zawartość PDF nie jest trwała między przeładowaniami';
    case 'repository_local_file_metadata':
      return 'Lokalny plik referencyjny w repozytorium (akt.pdf) — do podglądu PDF.js wskaż plik z dysku';
    case 'no_binary_file':
    default:
      return 'Brak lokalnego pliku binarnego PDF (wyłącznie rekord rejestrowy / metadane)';
  }
}

export function getIntegrityAxisStatusLabel(status: FileIntegrityAxisStatus): string {
  switch (status) {
    case 'not_checked':
      return 'Integralność niesprawdzona (brak pliku PDF)';
    case 'hash_calculated':
      return 'Wyłącznie obliczony SHA-256 bez wiarygodnego wzorca — nie potwierdza pochodzenia ani autentyczności';
    case 'reference_hash_recorded_no_local_file':
      return 'Zapisano wyłącznie skrót referencyjny z Etapu I — brak lokalnego pliku PDF do sprawdzenia w sesji';
    case 'hash_matches_known_reference':
      return 'SHA-256 lokalnego pliku zgodny z zapisanym wzorcem (identyczność bajtowa, nie certyfikat urzędowy)';
    case 'hash_mismatch':
      return 'Rozbieżność SHA-256 względem znanego wzorca lub poprzedniej wersji artefaktu';
    case 'hash_reference_unavailable':
      return 'Brak wzorca SHA-256 do porównania';
    case 'hash_calculation_failed':
      return 'Błąd wyliczania SHA-256 w przeglądarce — nie utworzono skrótu';
  }
}

export function getContentReviewAxisStatusLabel(status: ContentReviewAxisStatus): string {
  switch (status) {
    case 'not_reviewed':
      return 'Treść niekontrolowana';
    case 'excerpt_checked':
      return 'Pojedynczy fragment porównany (nie zamyka karty)';
    case 'section_reviewed':
      return 'Sekcja porównana kontekstowo (bez zamknięcia klinicznego)';
    case 'discrepancy_found':
      return 'Wykryto rozbieżność lub lukę wymagającą decyzji człowieka';
    case 'awaiting_human_review':
      return 'Oczekuje na przegląd treści przez człowieka';
  }
}

export function getHashComparisonStatusLabel(status: HashComparisonStatus): string {
  switch (status) {
    case 'calculated_from_local_file':
      return 'Hash wyliczony lokalnie z wybranego pliku PDF';
    case 'compared_with_trusted_reference':
      return 'Hash lokalnego pliku porównany i zgodny z referencyjnym wzorcem rejestrowym';
    case 'compared_with_known_reference':
      return 'Hash porównany z wcześniej zapisanym wzorcem';
    case 'reference_recorded_no_local_file':
      return 'Skrót referencyjny zapisany w Etapie I — brak lokalnego pliku PDF w sesji';
    case 'reference_untrusted':
      return 'Porównano wyłącznie z wzorcem podanym przez operatora / źródło zewnętrzne (NIEZAUFANY)';
    case 'not_compared':
      return 'Hash nieporównany z żadnym wiarygodnym wzorcem';
    case 'hash_from_untrusted_source':
      return 'Hash z nieznanego / importowanego źródła (niezweryfikowany lokalnie)';
    case 'hash_mismatch':
      return 'Hash rozbieżny ze wzorcem';
    case 'calculation_failed':
      return 'Nie udało się obliczyć SHA-256 pliku';
  }
}

export function formatSourceAxisSummary(doc: SourceRegistryEntry): string {
  const parts = [
    `origin=${doc.statusAxes.originStatus}`,
    `acq=${doc.statusAxes.acquisitionStatus}`,
    `avail=${doc.statusAxes.fileAvailability ?? 'no_file'}`,
    `storage=${doc.statusAxes.storageMode ?? 'no_binary_file'}`,
    `integrity=${doc.statusAxes.integrityStatus}`
  ];
  return parts.join(' | ');
}

export function getQualificationClassPresentation(qClass: EvidenceQualificationClass): {
  label: string;
  badgeText: string;
  tone: 'neutral' | 'warning' | 'danger' | 'verified' | 'secondary';
} {
  switch (qClass) {
    case 'traceability_reference':
      return {
        label: 'Odniesienie identyfikowalne — nie jest potwierdzonym dowodem z treści PDF',
        badgeText: 'Odniesienie do weryfikacji',
        tone: 'neutral'
      };
    case 'source_excerpt_pending_review':
      return {
        label: 'Fragment przypisany do dokumentu — oczekuje na kontrolę w oryginalnym PDF',
        badgeText: 'Fragment roboczy (niezweryfikowany)',
        tone: 'warning'
      };
    case 'source_excerpt_reviewed':
      return {
        label: 'Fragment sprawdzony ręcznie względem wskazanego PDF (nie zamyka pytania klinicznego)',
        badgeText: 'Fragment zweryfikowany (lokalnie)',
        tone: 'verified'
      };
    case 'conflicting_reference':
      return {
        label: 'Rozbieżność referencyjna z danych Etapu I lub wpisu roboczego (bez potwierdzonego lokalnego fragmentu PDF)',
        badgeText: 'Rozbieżność referencyjna (bez PDF)',
        tone: 'warning'
      };
    case 'conflicting_source_excerpt':
      return {
        label: 'Rozbieżność potwierdzona przez operatora na podstawie sprawdzonego pliku PDF',
        badgeText: 'Rozbieżność potwierdzona w PDF',
        tone: 'danger'
      };
    case 'secondary_reference':
      return {
        label: 'Informacja oparta na materiale wtórnym lub kontekstowym (nie jest oryginalną ChPL)',
        badgeText: 'Źródło wtórne / kontekst',
        tone: 'secondary'
      };
    case 'unavailable_source_reference':
      return {
        label: 'Źródło lub plik dokumentu jest niedostępny pod wskazanym odnośnikiem',
        badgeText: 'Źródło niedostępne',
        tone: 'danger'
      };
  }
}

interface BuildArtifactParams {
  artifactId: string;
  documentId: string;
  language: 'PL' | 'EN';
  fileName: string | null;
  documentDate: string | null;
  retrievedAt: string | null;
  sourceUrl: string;
  physicalPageCount: number | null;
  fileSizeBytes: number | null;
  sha256: string | null;
  calculationMethod: string;
  referenceType: HashProvenanceRecord['referenceType'];
  referenceHash: string | null;
  comparisonStatus: HashComparisonStatus;
  isHistoricalVersion?: boolean;
  changeCategory?: ArtifactChangeCategory;
}

function buildInitialDocumentArtifact(params: BuildArtifactParams): DocumentArtifactRecord {
  const isHistorical = Boolean(params.isHistoricalVersion);
  return {
    artifactId: params.artifactId,
    documentId: params.documentId,
    language: params.language,
    fileName: params.fileName,
    documentDate: params.documentDate,
    retrievedAt: params.retrievedAt,
    sourceUrl: params.sourceUrl,
    previousArtifactId: null,
    versionSequence: 1,
    changeCategory: params.changeCategory ?? (isHistorical ? 'historical_version' : 'initial_record'),
    isCurrentActiveVersion: !isHistorical,
    isHistoricalVersion: isHistorical,
    requiresReverification: isHistorical,
    physicalPageCount: params.physicalPageCount,
    fileSizeBytes: params.fileSizeBytes,
    hashProvenance: {
      algorithm: 'SHA-256',
      value: params.sha256,
      artifactId: params.artifactId,
      calculatedAt: params.retrievedAt,
      calculationMethod: params.calculationMethod,
      fileName: params.fileName,
      fileSizeBytes: params.fileSizeBytes,
      referenceType: params.referenceType,
      referenceHash: params.referenceHash,
      comparisonStatus: params.comparisonStatus
    }
  };
}

/**
 * Tworzy kanoniczny Rejestr Źródeł i Artefaktów Etapu B3 z niemodyfikowalnych źródeł projektu Etapu I i katalogu.
 * Rozdziela obiekt źródła (rejestr / endpoint / dokument lokalny / historyczny), artefakt pliku i próby pobrania.
 * Nigdy nie fabrykuje skrótów SHA-256 ani zmyślonych adresów URL.
 */
export function buildBaseSourceRegistry(bundle: Stage1ChplAuditBundle): SourceRegistryEntry[] {
  const byKey = new Map(bundle.sourceAndVersionReport.map((item) => [item.productKey, item]));

  const influvac = byKey.get('influvac_2026_2027');
  const vaxigrip = byKey.get('vaxigrip_2026_2027');
  const spikevax = byKey.get('spikevax_xfg');
  const bcg = byKey.get('bcg_10');

  const registry: SourceRegistryEntry[] = [];

  if (influvac) {
    const artifact = buildInitialDocumentArtifact({
      artifactId: 'art-rpl-influvac-49462-v1',
      documentId: 'doc-rpl-influvac-49462',
      language: 'PL',
      fileName: 'OLI-2026-08-18.pdf',
      documentDate: influvac.documentDateInSection10,
      retrievedAt: '2026-11-11T03:06:01+01:00',
      sourceUrl: influvac.officialSourceUrl,
      physicalPageCount: influvac.pageCount,
      fileSizeBytes: influvac.fileSizeBytes,
      sha256: influvac.fileSha256,
      calculationMethod: 'SHA-256 odpowiedzi HTTP RPL (bez zapisu lokalnego pliku PDF w repozytorium)',
      referenceType: 'bundle_recorded_sha256',
      referenceHash: influvac.fileSha256,
      comparisonStatus: 'reference_recorded_no_local_file'
    });
    const attempt: RetrievalAttemptRecord = {
      attemptId: 'att-rpl-influvac-49462-20261111',
      documentId: 'doc-rpl-influvac-49462',
      attemptedAt: '2026-11-11T23:30:00+01:00',
      targetUrl: influvac.officialSourceUrl,
      accessMethod: 'http_get',
      result: 'success',
      httpStatus: 200,
      errorDescription: null,
      checkScope: 'Weryfikacja statusu HTTP 200 oraz sumy SHA-256 w pamięci (bez zapisu PDF na dysk)',
      artifactId: artifact.artifactId
    };
    registry.push({
      documentId: 'doc-rpl-influvac-49462',
      objectType: 'official_registry_record',
      productKey: 'influvac_2026_2027',
      productDisplayName: influvac.productName,
      linkedCatalogVaccineIds: [],
      linkedProcedureIds: [...influvac.relatedProcedureIds],
      documentTitle: 'ChPL Influvac (RPL ID 49462, poz. 28478, sezon 2026/2027)',
      documentType: 'Wpis rejestrowy RPL eZdrowie + referencyjny PDF online (brak pliku w repo)',
      authority: 'URPLWMiPB / Rejestr Produktów Leczniczych (eZdrowie)',
      authorityType: 'rpl_registry',
      officialSourceUrl: influvac.officialSourceUrl,
      rplIdOrRegistryNumber: influvac.rplOrEmaId,
      marketingAuthorizationNumber: influvac.authorizationNumber,
      marketingAuthorizationHolder: influvac.marketingAuthorizationHolder,
      language: 'PL',
      revisionDate: influvac.documentDateInSection10,
      publicationDate: '2026-08-18',
      retrievedAt: '2026-11-11T03:06:01+01:00',
      physicalPageCount: influvac.pageCount,
      pdfScopeRange: `PDF str. 1–${influvac.pageCount}`,
      fileSizeBytes: influvac.fileSizeBytes,
      sha256: influvac.fileSha256,
      sha256ScopeLabel: 'SHA-256 odpowiedzi HTTP RPL zgodny ze skrótem Etapu I (plik PDF nie jest przechowywany lokalnie w repozytorium)',
      sha256Basis: 'bundle_recorded_pdf_sha256',
      sourceVerificationStatus: 'official_source_confirmed',
      sourceVerificationStatusLabel: getSourceVerificationStatusLabel('official_source_confirmed'),
      sourceVerificationDate: '2026-11-11',
      sourceVerificationNotes: influvac.technicalNotes,
      statusAxes: {
        originStatus: 'official_origin_confirmed',
        acquisitionStatus: 'not_acquired',
        integrityStatus: 'reference_hash_recorded_no_local_file',
        contentReviewStatus: 'awaiting_human_review',
        fileAvailability: 'no_file',
        storageMode: 'no_binary_file'
      },
      registryReferencePageCount: influvac.pageCount,
      currentArtifact: artifact,
      artifactHistory: [artifact],
      retrievalAttempts: [attempt],
      registryVsFileDistinctionNote:
        'Wpis rejestrowy RPL ID 49462 potwierdza metadane i sumę SHA-256 zdalnego PDF (HTTP 200), ale sam plik binarny ChPL nie jest przechowywany lokalnie w projekcie.'
    });
  }

  if (vaxigrip) {
    const artifact = buildInitialDocumentArtifact({
      artifactId: 'art-rpl-vaxigrip-50032-v1',
      documentId: 'doc-rpl-vaxigrip-50032',
      language: 'PL',
      fileName: 'OLI-2026-08-12.pdf',
      documentDate: vaxigrip.documentDateInSection10,
      retrievedAt: '2026-11-11T03:06:01+01:00',
      sourceUrl: vaxigrip.officialSourceUrl,
      physicalPageCount: vaxigrip.pageCount,
      fileSizeBytes: vaxigrip.fileSizeBytes,
      sha256: vaxigrip.fileSha256,
      calculationMethod: 'SHA-256 odpowiedzi HTTP RPL (bez zapisu lokalnego pliku PDF w repozytorium)',
      referenceType: 'bundle_recorded_sha256',
      referenceHash: vaxigrip.fileSha256,
      comparisonStatus: 'reference_recorded_no_local_file'
    });
    const attempt: RetrievalAttemptRecord = {
      attemptId: 'att-rpl-vaxigrip-50032-20261111',
      documentId: 'doc-rpl-vaxigrip-50032',
      attemptedAt: '2026-11-11T23:30:00+01:00',
      targetUrl: vaxigrip.officialSourceUrl,
      accessMethod: 'http_get',
      result: 'success',
      httpStatus: 200,
      errorDescription: null,
      checkScope: 'Weryfikacja statusu HTTP 200 oraz sumy SHA-256 w pamięci (bez zapisu PDF na dysk)',
      artifactId: artifact.artifactId
    };
    registry.push({
      documentId: 'doc-rpl-vaxigrip-50032',
      objectType: 'official_registry_record',
      productKey: 'vaxigrip_2026_2027',
      productDisplayName: vaxigrip.productName,
      linkedCatalogVaccineIds: [],
      linkedProcedureIds: [...vaxigrip.relatedProcedureIds],
      documentTitle: 'ChPL Vaxigrip (RPL ID 50032, poz. 28778, sezon 2026/2027)',
      documentType: 'Wpis rejestrowy RPL eZdrowie + referencyjny PDF online (brak pliku w repo)',
      authority: 'URPLWMiPB / Rejestr Produktów Leczniczych (eZdrowie)',
      authorityType: 'rpl_registry',
      officialSourceUrl: vaxigrip.officialSourceUrl,
      rplIdOrRegistryNumber: vaxigrip.rplOrEmaId,
      marketingAuthorizationNumber: vaxigrip.authorizationNumber,
      marketingAuthorizationHolder: vaxigrip.marketingAuthorizationHolder,
      language: 'PL',
      revisionDate: vaxigrip.documentDateInSection10,
      publicationDate: '2026-08-12',
      retrievedAt: '2026-11-11T03:06:01+01:00',
      physicalPageCount: vaxigrip.pageCount,
      pdfScopeRange: `PDF str. 1–${vaxigrip.pageCount}`,
      fileSizeBytes: vaxigrip.fileSizeBytes,
      sha256: vaxigrip.fileSha256,
      sha256ScopeLabel: 'SHA-256 odpowiedzi HTTP RPL zgodny ze skrótem Etapu I (oddzielony od historycznego VaxigripTetra 35346)',
      sha256Basis: 'bundle_recorded_pdf_sha256',
      sourceVerificationStatus: 'official_source_confirmed',
      sourceVerificationStatusLabel: getSourceVerificationStatusLabel('official_source_confirmed'),
      sourceVerificationDate: '2026-11-11',
      sourceVerificationNotes: vaxigrip.technicalNotes,
      statusAxes: {
        originStatus: 'official_origin_confirmed',
        acquisitionStatus: 'not_acquired',
        integrityStatus: 'reference_hash_recorded_no_local_file',
        contentReviewStatus: 'awaiting_human_review',
        fileAvailability: 'no_file',
        storageMode: 'no_binary_file'
      },
      registryReferencePageCount: vaxigrip.pageCount,
      currentArtifact: artifact,
      artifactHistory: [artifact],
      retrievalAttempts: [attempt],
      registryVsFileDistinctionNote:
        'Bieżący rekord 3-walentnego preparatu Vaxigrip (RPL 50032, sezon 2026/2027) rozdzielony od historycznego VaxigripTetra (RPL 35346). Brak lokalnego PDF w repozytorium.'
    });
  }

  if (spikevax) {
    const spikevaxPlArtifact = buildInitialDocumentArtifact({
      artifactId: 'art-ema-spikevax-xfg-pl-v1',
      documentId: 'doc-ema-spikevax-xfg-pl',
      language: 'PL',
      fileName: 'spikevax-epar-product-information_pl.pdf',
      documentDate: spikevax.documentDateInSection10,
      retrievedAt: '2026-11-11T03:07:05+01:00',
      sourceUrl: spikevax.officialSourceUrl,
      physicalPageCount: spikevax.pageCount,
      fileSizeBytes: spikevax.fileSizeBytes,
      sha256: spikevax.fileSha256,
      calculationMethod: 'SHA-256 pełnego strumienia PDF EMA EPAR PL (177 str.) porównany ze skrótem Etapu I',
      referenceType: 'bundle_recorded_sha256',
      referenceHash: spikevax.fileSha256,
      comparisonStatus: 'reference_recorded_no_local_file'
    });
    const spikevaxPlAttempt: RetrievalAttemptRecord = {
      attemptId: 'att-ema-spikevax-pl-20261111',
      documentId: 'doc-ema-spikevax-xfg-pl',
      attemptedAt: '2026-11-11T23:31:00+01:00',
      targetUrl: spikevax.officialSourceUrl,
      accessMethod: 'http_get',
      result: 'success',
      httpStatus: 200,
      errorDescription: null,
      checkScope: 'Potwierdzono HTTP 200 (Last-Modified 2026-10-29) oraz identyczność SHA-256 177 str. pliku EPAR PL',
      artifactId: spikevaxPlArtifact.artifactId
    };
    registry.push({
      documentId: 'doc-ema-spikevax-xfg-pl',
      objectType: 'official_document',
      productKey: 'spikevax_xfg',
      productDisplayName: spikevax.productName,
      linkedCatalogVaccineIds: [],
      linkedProcedureIds: [...spikevax.relatedProcedureIds],
      documentTitle: 'EMA EPAR Aneks I — ChPL Spikevax XFG (wersja PL)',
      documentType: 'Oficjalny dokument EMA EPAR (Aneks I ChPL, PL — referencyjny URL online)',
      authority: 'European Medicines Agency (EMA)',
      authorityType: 'ema_epar',
      officialSourceUrl: spikevax.officialSourceUrl,
      rplIdOrRegistryNumber: 'EMA/EPAR (PL) · powiązany z brakującymi endpointami RPL CEN 54306/54308/54456',
      marketingAuthorizationNumber: spikevax.authorizationNumber,
      marketingAuthorizationHolder: spikevax.marketingAuthorizationHolder,
      language: 'PL',
      revisionDate: spikevax.documentDateInSection10,
      publicationDate: '2026-10-30',
      retrievedAt: '2026-11-11T03:07:05+01:00',
      physicalPageCount: spikevax.pageCount,
      pdfScopeRange: `Aneks I na str. 64–92 z ${spikevax.pageCount} str. PDF EPAR PL (zmienna w kolejnych aktualizacjach)`,
      fileSizeBytes: spikevax.fileSizeBytes,
      sha256: spikevax.fileSha256,
      sha256ScopeLabel: 'SHA-256 pełnego pliku EPAR PL (177 str.) zgodny ze wzorcem Etapu I (wersja PL oddzielona od EN)',
      sha256Basis: 'bundle_recorded_pdf_sha256',
      sourceVerificationStatus: 'official_source_confirmed',
      sourceVerificationStatusLabel: getSourceVerificationStatusLabel('official_source_confirmed'),
      sourceVerificationDate: '2026-11-11',
      sourceVerificationNotes: spikevax.technicalNotes,
      statusAxes: {
        originStatus: 'official_origin_confirmed',
        acquisitionStatus: 'not_acquired',
        integrityStatus: 'reference_hash_recorded_no_local_file',
        contentReviewStatus: 'discrepancy_found',
        fileAvailability: 'no_file',
        storageMode: 'no_binary_file'
      },
      registryReferencePageCount: spikevax.pageCount,
      currentArtifact: spikevaxPlArtifact,
      artifactHistory: [spikevaxPlArtifact],
      retrievalAttempts: [spikevaxPlAttempt],
      registryVsFileDistinctionNote:
        'Oficjalny plik EPAR EMA w wersji PL (177 str.) jest odrębnym artefaktem językowym od wersji EN (158 str.) i od rekordu RPL CEN. Liczba stron stanowi właściwość konkretnej rewizji.'
    });

    const spikevaxEnArtifact = buildInitialDocumentArtifact({
      artifactId: 'art-ema-spikevax-xfg-en-v1',
      documentId: 'doc-ema-spikevax-xfg-en',
      language: 'EN',
      fileName: 'spikevax-epar-product-information_en.pdf',
      documentDate: null,
      retrievedAt: '2026-11-11T03:07:05+01:00',
      sourceUrl:
        'https://www.ema.europa.eu/en/documents/product-information/spikevax-epar-product-information_en.pdf',
      physicalPageCount: 158,
      fileSizeBytes: 1387433,
      sha256: '8932b31f46e652f9ee4be89ad65cd6003f9fa5a63be0f2af64affd645a0d7024',
      calculationMethod: 'SHA-256 pełnego strumienia PDF EMA EPAR EN (158 str.) porównany ze skrótem MASTER 04',
      referenceType: 'bundle_recorded_sha256',
      referenceHash: '8932b31f46e652f9ee4be89ad65cd6003f9fa5a63be0f2af64affd645a0d7024',
      comparisonStatus: 'reference_recorded_no_local_file'
    });
    const spikevaxEnAttempt: RetrievalAttemptRecord = {
      attemptId: 'att-ema-spikevax-en-20261111',
      documentId: 'doc-ema-spikevax-xfg-en',
      attemptedAt: '2026-11-11T23:31:00+01:00',
      targetUrl:
        'https://www.ema.europa.eu/en/documents/product-information/spikevax-epar-product-information_en.pdf',
      accessMethod: 'http_get',
      result: 'success',
      httpStatus: 200,
      errorDescription: null,
      checkScope: 'Potwierdzono HTTP 200 (Last-Modified 2026-10-29) oraz identyczność SHA-256 158 str. pliku EPAR EN',
      artifactId: spikevaxEnArtifact.artifactId
    };
    registry.push({
      documentId: 'doc-ema-spikevax-xfg-en',
      objectType: 'official_document',
      productKey: 'spikevax_xfg',
      productDisplayName: `${spikevax.productName} (wersja angielska SmPC)`,
      linkedCatalogVaccineIds: [],
      linkedProcedureIds: [...spikevax.relatedProcedureIds],
      documentTitle: 'EMA EPAR Annex I — SmPC Spikevax XFG (wersja EN)',
      documentType: 'Oficjalny dokument EMA EPAR (Annex I SmPC, EN — oddzielny artefakt językowy)',
      authority: 'European Medicines Agency (EMA)',
      authorityType: 'ema_epar',
      officialSourceUrl:
        'https://www.ema.europa.eu/en/documents/product-information/spikevax-epar-product-information_en.pdf',
      rplIdOrRegistryNumber: 'EMA/EPAR (EN)',
      marketingAuthorizationNumber: spikevax.authorizationNumber,
      marketingAuthorizationHolder: spikevax.marketingAuthorizationHolder,
      language: 'EN',
      revisionDate: null,
      publicationDate: '2026-10-30',
      retrievedAt: '2026-11-11T03:07:05+01:00',
      physicalPageCount: 158,
      pdfScopeRange: 'Annex I SmPC na str. 53–77 z 158 str. PDF EPAR EN (oddzielna numeracja niż PL)',
      fileSizeBytes: 1387433,
      sha256: '8932b31f46e652f9ee4be89ad65cd6003f9fa5a63be0f2af64affd645a0d7024',
      sha256ScopeLabel: 'SHA-256 pełnego pliku EPAR EN (158 str.) zgodny ze wzorcem B2 (odrębny artefakt względem PL)',
      sha256Basis: 'bundle_recorded_pdf_sha256',
      sourceVerificationStatus: 'official_source_confirmed',
      sourceVerificationStatusLabel: getSourceVerificationStatusLabel('official_source_confirmed'),
      sourceVerificationDate: '2026-11-11',
      sourceVerificationNotes:
        'Odrębny angielskojęzyczny dokument EPAR EMA (158 str.). Pkt 10 na str. 77 również pozostaje bez wpisanej daty w tekście.',
      statusAxes: {
        originStatus: 'official_origin_confirmed',
        acquisitionStatus: 'not_acquired',
        integrityStatus: 'reference_hash_recorded_no_local_file',
        contentReviewStatus: 'awaiting_human_review',
        fileAvailability: 'no_file',
        storageMode: 'no_binary_file'
      },
      registryReferencePageCount: 158,
      currentArtifact: spikevaxEnArtifact,
      artifactHistory: [spikevaxEnArtifact],
      retrievalAttempts: [spikevaxEnAttempt],
      registryVsFileDistinctionNote:
        'Wersja angielska EPAR EN (158 str.) stanowi całkowicie odrębny artefakt od wersji polskiej EPAR PL (177 str.) — posiada własny URL, sumę SHA-256 i numerację stron.'
    });

    const spikevaxCenAttempt: RetrievalAttemptRecord = {
      attemptId: 'att-rpl-cen-54306-20261111',
      documentId: 'doc-rpl-spikevax-cen-endpoints',
      attemptedAt: '2026-11-11T23:31:05+01:00',
      targetUrl: 'https://rejestrymedyczne.ezdrowie.gov.pl/api/rpl/medicinal-products/54306/characteristic',
      accessMethod: 'http_get',
      result: 'http_error',
      httpStatus: 400,
      errorDescription:
        'STORAGE_FILE_NOT_FOUND (pl.gov.csioz.rpl.infrastructure.exceptions.ApiError): „Nazwa pliku nie została podana.” — brak pliku po stronie endpointu RPL, co nie dowodzi braku dokumentu w EMA.',
      checkScope: 'Pojedyncze zapytanie HTTP GET o załącznik charakterystyki produktu w endpointcie API RPL ID 54306 (CEN)',
      artifactId: null
    };
    registry.push({
      documentId: 'doc-rpl-spikevax-cen-endpoints',
      objectType: 'official_endpoint',
      productKey: 'spikevax_xfg',
      productDisplayName: 'Spikevax XFG — endpoint API RPL procedury centralnej (CEN)',
      linkedCatalogVaccineIds: [],
      linkedProcedureIds: [...spikevax.relatedProcedureIds],
      documentTitle: 'Endpoint API RPL CEN Spikevax XFG (ID 54306 / 54308 / 54456) — nieudana próba pobrania',
      documentType: 'Oficjalny endpoint API RPL eZdrowie (brak pliku binarnego PDF)',
      authority: 'URPLWMiPB / Rejestr Produktów Leczniczych (eZdrowie)',
      authorityType: 'rpl_registry',
      officialSourceUrl:
        'https://rejestrymedyczne.ezdrowie.gov.pl/api/rpl/medicinal-products/54306/characteristic',
      rplIdOrRegistryNumber: 'RPL ID 54306 / 54308 / 54456',
      marketingAuthorizationNumber: spikevax.authorizationNumber,
      marketingAuthorizationHolder: spikevax.marketingAuthorizationHolder,
      language: 'PL',
      revisionDate: null,
      publicationDate: null,
      retrievedAt: '2026-11-11T23:31:05+01:00',
      physicalPageCount: null,
      pdfScopeRange: 'Brak pliku PDF pod endpointem API RPL (HTTP 400 STORAGE_FILE_NOT_FOUND)',
      fileSizeBytes: null,
      sha256: null,
      sha256ScopeLabel: 'Brak sumy SHA-256 — endpoint RPL CEN zwraca HTTP 400 (dokument właściwy publikuje odrębny rekord EMA EPAR)',
      sha256Basis: 'not_verified_binary',
      sourceVerificationStatus: 'official_source_unavailable',
      sourceVerificationStatusLabel: getSourceVerificationStatusLabel('official_source_unavailable'),
      sourceVerificationDate: '2026-11-11',
      sourceVerificationNotes:
        'Endpoint RPL CEN zwraca JSON HTTP 400 STORAGE_FILE_NOT_FOUND („Nazwa pliku nie została podana.”). Jest to techniczny błąd endpointu dla produktu centralnego — nie potwierdza nieistnienia produktu w bazie EMA EPAR.',
      statusAxes: {
        originStatus: 'official_origin_confirmed',
        acquisitionStatus: 'access_failed',
        integrityStatus: 'not_checked',
        contentReviewStatus: 'not_reviewed',
        fileAvailability: 'no_file',
        storageMode: 'no_binary_file'
      },
      registryReferencePageCount: null,
      currentArtifact: null,
      artifactHistory: [],
      retrievalAttempts: [spikevaxCenAttempt],
      registryVsFileDistinctionNote:
        'Rekord reprezentuje endpoint API RPL oraz nieudaną próbę dostępu (HTTP 400). Nie jest pozyskanym dokumentem PDF ani dowodem braku dokumentacji w EMA.'
    });
  }

  if (bcg) {
    const bcgArtifact = buildInitialDocumentArtifact({
      artifactId: 'art-rpl-bcg10-19535-v1',
      documentId: 'doc-rpl-bcg10-19535',
      language: 'PL',
      fileName: 'OLI-2023-12-08.pdf',
      documentDate: bcg.documentDateInSection10,
      retrievedAt: '2026-11-11T03:30:00+01:00',
      sourceUrl: bcg.officialSourceUrl,
      physicalPageCount: bcg.pageCount,
      fileSizeBytes: bcg.fileSizeBytes,
      sha256: bcg.fileSha256,
      calculationMethod: 'SHA-256 odpowiedzi HTTP RPL (bez zapisu lokalnego pliku PDF w repozytorium)',
      referenceType: 'bundle_recorded_sha256',
      referenceHash: bcg.fileSha256,
      comparisonStatus: 'reference_recorded_no_local_file'
    });
    const bcgAttempt: RetrievalAttemptRecord = {
      attemptId: 'att-rpl-bcg10-19535-20261111',
      documentId: 'doc-rpl-bcg10-19535',
      attemptedAt: '2026-11-11T23:31:10+01:00',
      targetUrl: bcg.officialSourceUrl,
      accessMethod: 'http_get',
      result: 'success',
      httpStatus: 200,
      errorDescription: null,
      checkScope: 'Weryfikacja HTTP 200 oraz sumy SHA-256 7-stronicowego pliku ChPL BCG 10 (bez zapisu lokalnego)',
      artifactId: bcgArtifact.artifactId
    };
    registry.push({
      documentId: 'doc-rpl-bcg10-19535',
      objectType: 'official_registry_record',
      productKey: 'bcg_10',
      productDisplayName: bcg.productName,
      linkedCatalogVaccineIds: [],
      linkedProcedureIds: [...bcg.relatedProcedureIds],
      documentTitle: 'ChPL Szczepionka przeciwgruźlicza BCG 10 (RPL ID 19535, poz. R/0210)',
      documentType: 'Wpis rejestrowy RPL eZdrowie + referencyjny PDF online (brak pliku w repo)',
      authority: 'URPLWMiPB / Rejestr Produktów Leczniczych (eZdrowie)',
      authorityType: 'rpl_registry',
      officialSourceUrl: bcg.officialSourceUrl,
      rplIdOrRegistryNumber: bcg.rplOrEmaId,
      marketingAuthorizationNumber: bcg.authorizationNumber,
      marketingAuthorizationHolder: bcg.marketingAuthorizationHolder,
      language: 'PL',
      revisionDate: bcg.documentDateInSection10,
      publicationDate: null,
      retrievedAt: '2026-11-11T03:30:00+01:00',
      physicalPageCount: bcg.pageCount,
      pdfScopeRange: `PDF str. 1–${bcg.pageCount}`,
      fileSizeBytes: bcg.fileSizeBytes,
      sha256: bcg.fileSha256,
      sha256ScopeLabel: 'SHA-256 odpowiedzi HTTP RPL zgodny ze skrótem Etapu I (pkt 10 bez daty rewizji w tekście; brak kopii lokalnej)',
      sha256Basis: 'bundle_recorded_pdf_sha256',
      sourceVerificationStatus: 'official_source_confirmed',
      sourceVerificationStatusLabel: getSourceVerificationStatusLabel('official_source_confirmed'),
      sourceVerificationDate: '2026-11-11',
      sourceVerificationNotes: bcg.technicalNotes,
      statusAxes: {
        originStatus: 'official_origin_confirmed',
        acquisitionStatus: 'not_acquired',
        integrityStatus: 'reference_hash_recorded_no_local_file',
        contentReviewStatus: 'discrepancy_found',
        fileAvailability: 'no_file',
        storageMode: 'no_binary_file'
      },
      registryReferencePageCount: bcg.pageCount,
      currentArtifact: bcgArtifact,
      artifactHistory: [bcgArtifact],
      retrievalAttempts: [bcgAttempt],
      registryVsFileDistinctionNote:
        'Wpis rejestrowy RPL 19535 nie rozstrzyga samodzielnie otwartych pytań o granicę wieku (<15 lat vs PSO), podanie podskórne w ulotce ani brak daty w punkcie 10 ChPL.'
    });
  }

  // Dokument historyczny 2025/2026 — zachowany wyłącznie do ostrzeżenia o nieaktualności (odrzucony dla 2026/2027)
  const histArtifact = buildInitialDocumentArtifact({
    artifactId: 'art-rpl-vaxigrip-tetra-35346-hist-v1',
    documentId: 'doc-rpl-vaxigrip-tetra-35346-hist',
    language: 'PL',
    fileName: 'OLI-2025-06-26.pdf',
    documentDate: '05/2025',
    retrievedAt: '2026-11-11T03:06:01+01:00',
    sourceUrl: 'https://rejestrymedyczne.ezdrowie.gov.pl/api/rpl/medicinal-products/35346/characteristic',
    physicalPageCount: null,
    fileSizeBytes: 542801,
    sha256: '3d07b0b85de404187616b0acb158d4b0526a2e3e513f1cd98eda52adcaaaf044',
    calculationMethod: 'SHA-256 odpowiedzi HTTP historycznego rekordu RPL 35346 (sezon 2025/2026)',
    referenceType: 'bundle_recorded_sha256',
    referenceHash: '3d07b0b85de404187616b0acb158d4b0526a2e3e513f1cd98eda52adcaaaf044',
    comparisonStatus: 'reference_recorded_no_local_file',
    isHistoricalVersion: true
  });
  const histAttempt: RetrievalAttemptRecord = {
    attemptId: 'att-rpl-vaxigrip-tetra-35346-20261111',
    documentId: 'doc-rpl-vaxigrip-tetra-35346-hist',
    attemptedAt: '2026-11-11T23:31:15+01:00',
    targetUrl: 'https://rejestrymedyczne.ezdrowie.gov.pl/api/rpl/medicinal-products/35346/characteristic',
    accessMethod: 'http_get',
    result: 'success',
    httpStatus: 200,
    errorDescription: null,
    checkScope: 'Potwierdzono historyczny plik 4-walentny z sezonu 2025/2026 — zablokowany jako podstawa bieżącego audytu 2026/2027',
    artifactId: histArtifact.artifactId
  };
  registry.push({
    documentId: 'doc-rpl-vaxigrip-tetra-35346-hist',
    objectType: 'historical_document',
    productKey: 'vaxigrip_tetra_historical_2025_2026',
    productDisplayName: 'VaxigripTetra (RPL ID 35346, sezon historyczny 2025/2026)',
    linkedCatalogVaccineIds: ['vac-vaxigrip-tetra'],
    linkedProcedureIds: [],
    documentTitle: 'ChPL historyczna VaxigripTetra (RPL ID 35346, poz. 23540 — sezon 2025/2026)',
    documentType: 'Historyczny druk ChPL (4-walentny, NIEAKTUALNY dla 2026/2027)',
    authority: 'URPLWMiPB / Rejestr Produktów Leczniczych (eZdrowie)',
    authorityType: 'rpl_registry',
    officialSourceUrl:
      'https://rejestrymedyczne.ezdrowie.gov.pl/api/rpl/medicinal-products/35346/characteristic',
    rplIdOrRegistryNumber: 'RPL ID 35346',
    marketingAuthorizationNumber: 'Pozwolenie nr 23540',
    marketingAuthorizationHolder: 'Sanofi Winthrop Industrie',
    language: 'PL',
    revisionDate: '05/2025',
    publicationDate: '2025-05-01',
    retrievedAt: '2026-11-11T03:06:01+01:00',
    physicalPageCount: null,
    pdfScopeRange: 'Historyczny plik PDF z sezonu 2025/2026 (twardo odrzucany dla 2026/2027)',
    fileSizeBytes: 542801,
    sha256: '3d07b0b85de404187616b0acb158d4b0526a2e3e513f1cd98eda52adcaaaf044',
    sha256ScopeLabel: 'Skrót PDF historycznej ChPL 2025/2026 zapisany wyłącznie jako kontrola odrzucenia wersji',
    sha256Basis: 'bundle_recorded_pdf_sha256',
    sourceVerificationStatus: 'document_version_uncertain',
    sourceVerificationStatusLabel: getSourceVerificationStatusLabel('document_version_uncertain'),
    sourceVerificationDate: '2026-11-11',
    sourceVerificationNotes:
      'NIE używać jako podstawy klinicznej dla sezonu 2026/2027 (w 2026/2027 obowiązują preparaty 3-walentne: Vaxigrip RPL 50032 i Influvac RPL 49462).',
    statusAxes: {
      originStatus: 'official_origin_confirmed',
      acquisitionStatus: 'historical_copy_only',
      integrityStatus: 'reference_hash_recorded_no_local_file',
      contentReviewStatus: 'awaiting_human_review',
      fileAvailability: 'no_file',
      storageMode: 'no_binary_file'
    },
    registryReferencePageCount: null,
    currentArtifact: histArtifact,
    artifactHistory: [histArtifact],
    retrievalAttempts: [histAttempt],
    historicalNotice: HISTORICAL_DOCUMENT_NOTICE,
    registryVsFileDistinctionNote: HISTORICAL_DOCUMENT_NOTICE,
    isHistoricalRejectedForCurrentSeason: true
  });

  // Dokument Infanrix hexa (otwarta blokada fenyloalaniny disc-phenylalanine-content-01)
  const infanrixArtifact = buildInitialDocumentArtifact({
    artifactId: 'art-gsk-infanrix-hexa-pl-v1',
    documentId: 'doc-gsk-infanrix-hexa-pl',
    language: 'PL',
    fileName: 'infanrix-hexa-druki-pl-h-0296-ia-vr-323859-12_02_2026.pdf',
    documentDate: '2026-02-12',
    retrievedAt: '2026-11-11T23:32:00+01:00',
    sourceUrl: 'https://pl.gsk.com/media/b2ip1snt/infanrix-hexa-druki-pl-h-0296-ia-vr-323859-12_02_2026.pdf',
    physicalPageCount: 48,
    fileSizeBytes: 677179,
    sha256: '9e15fce32c7c0e0d38c7803a262c24b50278819902578a641d91aeca090bfb80',
    calculationMethod: 'SHA-256 strumienia PDF GSK (48 str., bez zapisu lokalnego w repozytorium i bez wcześniejszego wzorca)',
    referenceType: 'none',
    referenceHash: null,
    comparisonStatus: 'not_compared'
  });
  const infanrixAttempt: RetrievalAttemptRecord = {
    attemptId: 'att-gsk-infanrix-hexa-pl-20261111',
    documentId: 'doc-gsk-infanrix-hexa-pl',
    attemptedAt: '2026-11-11T23:32:00+01:00',
    targetUrl: 'https://pl.gsk.com/media/b2ip1snt/infanrix-hexa-druki-pl-h-0296-ia-vr-323859-12_02_2026.pdf',
    accessMethod: 'http_get',
    result: 'success',
    httpStatus: 200,
    errorDescription: null,
    checkScope: 'Potwierdzono HTTP 200 (48 str.): pkt 2 str. 2 (0,0289 µg), pkt 4.4 str. 6 (0,0298 µg), pkt 10 str. 19 (12.02.2026). Blokada katalogowa utrzymana.',
    artifactId: infanrixArtifact.artifactId
  };
  registry.push({
    documentId: 'doc-gsk-infanrix-hexa-pl',
    objectType: 'official_document',
    productKey: 'infanrix_hexa',
    productDisplayName: 'Infanrix hexa (DTaP-HBV-IPV-Hib)',
    linkedCatalogVaccineIds: ['vac-infanrix-hexa'],
    linkedProcedureIds: ['pso-2m-dtap', 'pso-6m-dtap'],
    documentTitle: 'ChPL Infanrix hexa (GSK — druk h-0296-ia-vr-323859-12_02_2026)',
    documentType: 'Oficjalny druk ChPL podmiotu odpowiedzialnego online (PDF 48 str., nieprzechowywany lokalnie)',
    authority: 'GSK / European Medicines Agency (EMA)',
    authorityType: 'regulator_document',
    officialSourceUrl:
      'https://pl.gsk.com/media/b2ip1snt/infanrix-hexa-druki-pl-h-0296-ia-vr-323859-12_02_2026.pdf',
    rplIdOrRegistryNumber: 'Procedura centralna UE (brak statycznego ID w wyszukiwarce RPL)',
    marketingAuthorizationNumber: 'EU/1/00/152/001, 002, 005, 006, 021',
    marketingAuthorizationHolder: 'GlaxoSmithKline Biologicals S.A.',
    language: 'PL',
    revisionDate: '2026-02-12',
    publicationDate: '2026-02-12',
    retrievedAt: '2026-11-11T23:32:00+01:00',
    physicalPageCount: 48,
    pdfScopeRange: 'ChPL na str. 1–19 z 48 str. PDF GSK (pkt 2 na str. 2: 0,0289 µg; pkt 4.4 na str. 6: 0,0298 µg; pkt 10 na str. 19)',
    fileSizeBytes: 677179,
    sha256: '9e15fce32c7c0e0d38c7803a262c24b50278819902578a641d91aeca090bfb80',
    sha256ScopeLabel: 'Obliczony SHA-256 strumienia HTTP PDF GSK (nieporównany ze wzorcem urzędowym; plik nie jest przechowywany lokalnie)',
    sha256Basis: 'bundle_recorded_pdf_sha256',
    sourceVerificationStatus: 'requires_manual_review',
    sourceVerificationStatusLabel: getSourceVerificationStatusLabel('requires_manual_review'),
    sourceVerificationDate: '2026-11-11',
    sourceVerificationNotes:
      'Aktywna blokada disc-phenylalanine-content-01 potwierdzona w 48-stronicowym druku GSK (12.02.2026): pkt 2 (str. 2) podaje 0,0289 µg/dawkę, pkt 4.4 (str. 6) podaje 0,0298 µg/dawkę. Status karty pozostaje requires_source_clarification.',
    statusAxes: {
      originStatus: 'manual_review_required',
      acquisitionStatus: 'not_acquired',
      integrityStatus: 'hash_calculated',
      contentReviewStatus: 'discrepancy_found',
      fileAvailability: 'no_file',
      storageMode: 'no_binary_file'
    },
    registryReferencePageCount: 48,
    currentArtifact: infanrixArtifact,
    artifactHistory: [infanrixArtifact],
    retrievalAttempts: [infanrixAttempt],
    registryVsFileDistinctionNote:
      'Plik ChPL GSK (48 str.) zawiera jawną rozbieżność ilości fenyloalaniny (pkt 2 str. 2 vs pkt 4.4 str. 6). Rekord pozostaje otwarty do wyjaśnienia podmiotu/organu.'
  });

  // Dokument PSO 2027 obecny lokalnie jako akt.pdf (zweryfikowano 48 stron fizycznych!)
  const psoArtifact = buildInitialDocumentArtifact({
    artifactId: 'art-mz-pso-2027-akt-v1',
    documentId: 'doc-mz-pso-2027-akt',
    language: 'PL',
    fileName: 'akt.pdf',
    documentDate: '2026-10-28',
    retrievedAt: '2026-10-30',
    sourceUrl: 'https://dziennikmz.mz.gov.pl/DUM_MZ/2026/77/akt.pdf',
    physicalPageCount: 48,
    fileSizeBytes: 864528,
    sha256: '4c6fa9212f292b130fd8958baaeeac2444f86fbaa260b873d586b905108fc6da',
    calculationMethod: 'Bezpośredni odczyt SHA-256 lokalnego pliku akt.pdf w katalogu głównym projektu (48 stron fizycznych)',
    referenceType: 'local_workspace_sha256',
    referenceHash: '4c6fa9212f292b130fd8958baaeeac2444f86fbaa260b873d586b905108fc6da',
    comparisonStatus: 'compared_with_known_reference'
  });
  const psoAttempt: RetrievalAttemptRecord = {
    attemptId: 'att-mz-pso-2027-akt-local',
    documentId: 'doc-mz-pso-2027-akt',
    attemptedAt: '2026-11-11T23:32:10+01:00',
    targetUrl: 'https://dziennikmz.mz.gov.pl/DUM_MZ/2026/77/akt.pdf',
    accessMethod: 'local_filesystem_read',
    result: 'success',
    httpStatus: null,
    errorDescription: null,
    checkScope: 'Lokalna weryfikacja pliku akt.pdf (864528 B, 48 str. PDF, zgodny SHA-256 z Dz. Urz. MZ 2026 poz. 77)',
    artifactId: psoArtifact.artifactId
  };
  registry.push({
    documentId: 'doc-mz-pso-2027-akt',
    objectType: 'local_reference_document',
    productKey: 'pso_2027_general',
    productDisplayName: 'Program Szczepień Ochronnych (PSO) na 2027 rok',
    linkedCatalogVaccineIds: [],
    linkedProcedureIds: ['pso-bcg-0'],
    documentTitle: 'Komunikat GIS z 28.10.2026 r. — PSO 2027 (Dz. Urz. MZ 2026 poz. 77)',
    documentType: 'Lokalny referencyjny akt prawny (akt.pdf, 48 str. PDF)',
    authority: 'Główny Inspektorat Sanitarny / Ministerstwo Zdrowia',
    authorityType: 'mz_gis_document',
    officialSourceUrl: 'https://dziennikmz.mz.gov.pl/DUM_MZ/2026/77/akt.pdf',
    rplIdOrRegistryNumber: 'Dz. Urz. MZ 2026 poz. 77',
    marketingAuthorizationNumber: null,
    marketingAuthorizationHolder: 'Główny Inspektorat Sanitarny (RP)',
    language: 'PL',
    revisionDate: '2026-10-28',
    publicationDate: '2026-10-30',
    retrievedAt: '2026-10-30',
    physicalPageCount: 48,
    pdfScopeRange: 'Załącznik do Komunikatu GIS (akt.pdf — 48 str. fizycznych, Część I–IV PSO 2027)',
    fileSizeBytes: 864528,
    sha256: '4c6fa9212f292b130fd8958baaeeac2444f86fbaa260b873d586b905108fc6da',
    sha256ScopeLabel: 'Skrót SHA-256 porównany bezpośrednio na lokalnym pliku akt.pdf (nie dotyczy plików TypeScript aplikacji)',
    sha256Basis: 'local_workspace_pdf_sha256',
    sourceVerificationStatus: 'official_source_confirmed',
    sourceVerificationStatusLabel: getSourceVerificationStatusLabel('official_source_confirmed'),
    sourceVerificationDate: '2026-11-11',
    sourceVerificationNotes:
      'Jedyny dokument źródłowy przechowywany bezpośrednio lokalnie jako plik akt.pdf (48 str.). Stanowi akt PSO 2027 porównywany z ChPL bez automatycznej zmiany statusu klinicznego preparatów.',
    statusAxes: {
      originStatus: 'official_origin_confirmed',
      acquisitionStatus: 'acquired',
      integrityStatus: 'hash_matches_known_reference',
      contentReviewStatus: 'section_reviewed',
      fileAvailability: 'metadata_only_reload_required',
      storageMode: 'repository_local_file_metadata'
    },
    registryReferencePageCount: 48,
    currentArtifact: psoArtifact,
    artifactHistory: [psoArtifact],
    retrievalAttempts: [psoAttempt],
    registryVsFileDistinctionNote:
      'Jedyny lokalnie pozyskany dokument binarny w repozytorium (akt.pdf, 48 stron fizycznych). Nie zastępuje indywidualnych ChPL preparatów.'
  });

  return registry;
}

/**
 * Rozbija zapis podpunktów pytania (np. "4.1, 4.3 i 6.4" lub "2, 6.3–6.4, 8 i 10") na pojedyncze tokeny QRD.
 */
export function parseQrdTokensFromSectionRef(ref: string): string[] {
  const tokens: string[] = [];
  const normalized = ref.replace(/\s+/g, ' ').trim();

  // Obsługa jawnych zakresów np. "6.3–6.4" lub "6.3-6.4"
  const rangeExpanded = normalized.replace(/(\d)\.(\d)\s*[–-]\s*(\d)\.(\d)/g, (_m, a1, b1, a2, b2) => {
    const start = Number(b1);
    const end = Number(b2);
    if (a1 === a2 && Number.isInteger(start) && Number.isInteger(end) && end >= start && end - start <= 5) {
      const list: string[] = [];
      for (let i = start; i <= end; i += 1) {
        list.push(`${a1}.${i}`);
      }
      return list.join(', ');
    }
    return `${a1}.${b1}, ${a2}.${b2}`;
  });

  const matches = rangeExpanded.match(/\b(?:4\.[1-9]|5\.[1-3]|6\.[1-6]|10|[1-9])\b/g);
  if (!matches) {
    return [];
  }

  for (const m of matches) {
    if (!tokens.includes(m)) {
      tokens.push(m);
    }
  }
  return tokens;
}

/**
 * Rozróżnia indeks strony PDF od numeru drukowanego oraz niepotwierdzonej numeracji.
 */
export function parsePdfPageReference(
  pageRef: string,
  physicalDocumentPageCount: number | null
): Omit<QrdLocationReference, 'qrdSection' | 'qrdSectionTitle'> {
  const trimmed = pageRef.trim();
  const numberMatch = trimmed.match(/\b(\d{1,3})\b/);
  const parsedInt = numberMatch ? Number(numberMatch[1]) : null;
  const inBounds =
    parsedInt !== null &&
    Number.isInteger(parsedInt) &&
    parsedInt >= 1 &&
    (physicalDocumentPageCount === null || parsedInt <= physicalDocumentPageCount);

  const isRange = /[–-]/.test(trimmed);
  let pageNumberingType: PageNumberingType = 'unconfirmed';
  if (inBounds) {
    pageNumberingType = isRange ? 'range_in_bundle' : 'pdf_page_index';
  }

  return {
    pdfPageIndex: inBounds ? parsedInt : null,
    pdfPageRangeLabel: trimmed || 'Nie wskazano zakresu strony w Etapie I',
    printedPageNumber: inBounds
      ? 'Osobna numeracja druku niepotwierdzona — podano indeks strony pliku PDF'
      : 'Numeracja strony druku i PDF wymaga ręcznego odczytu z dokumentu',
    pageNumberingType,
    physicalDocumentPageCount
  };
}

function findSheetRowForQrdToken(
  entries: Stage1ChplSubpointAudit[],
  qrdToken: string
): Stage1ChplSubpointAudit | undefined {
  const exact = entries.find((e) => e.subpointNumber === qrdToken);
  if (exact) {
    return exact;
  }
  const major = qrdToken.split('.')[0];
  return entries.find((e) => e.subpointNumber === major);
}

function mapCheckOutcomeToEvidenceStatus(outcome: Stage1ChplCheckOutcome): {
  relationship: EvidenceRelationship;
  reviewStatus: EvidenceReviewStatus;
  questionWorkStatus: QuestionWorkStatus;
} {
  switch (outcome) {
    case 'ambiguity_flagged':
      return {
        relationship: 'contradicts',
        reviewStatus: 'conflicting_evidence',
        questionWorkStatus: 'conflicting_evidence'
      };
    case 'missing_in_document':
      return {
        relationship: 'missing_information',
        reviewStatus: 'requires_authority_clarification',
        questionWorkStatus: 'requires_authority_clarification'
      };
    case 'extrapolation_note':
      return {
        relationship: 'does_not_resolve',
        reviewStatus: 'awaiting_human_review',
        questionWorkStatus: 'awaiting_human_review'
      };
    case 'ok':
      return {
        relationship: 'contextualizes',
        reviewStatus: 'awaiting_human_review',
        questionWorkStatus: 'awaiting_human_review'
      };
  }
}

function getPrimaryDocumentForProduct(
  productKey: Stage1ChplProductKey,
  sources: SourceRegistryEntry[]
): SourceRegistryEntry | undefined {
  return sources.find(
    (s) => s.productKey === productKey && s.language === 'PL' && !s.isHistoricalRejectedForCurrentSeason
  );
}

function qualifyBaselineEntry(params: {
  doc: SourceRegistryEntry;
  outcome: Stage1ChplCheckOutcome;
  hasPdfPage: boolean;
  hasExcerptRef: boolean;
}): EvidenceQualificationClass {
  if (params.doc.statusAxes.acquisitionStatus === 'access_failed') {
    return 'unavailable_source_reference';
  }
  if (params.doc.isHistoricalRejectedForCurrentSeason || params.doc.objectType === 'secondary_document') {
    return 'secondary_reference';
  }
  if (params.outcome === 'ambiguity_flagged') {
    return 'conflicting_reference';
  }
  if (params.hasPdfPage && params.hasExcerptRef) {
    return 'source_excerpt_pending_review';
  }
  return 'traceability_reference';
}

/**
 * Buduje deterministyczne wpisy bazowego łańcucha identyfikowalności na podstawie
 * nieedytowalnego pakietu STAGE1_CHPL_AUDIT_BUNDLE.
 * Etap B3: żaden automatyczny wpis bazowy nie otrzymuje klasy source_excerpt_reviewed.
 */
export function buildBaselineEvidenceEntries(
  bundle: Stage1ChplAuditBundle,
  sources: SourceRegistryEntry[]
): EvidenceLedgerEntry[] {
  const entries: EvidenceLedgerEntry[] = [];
  const sheetByProduct = new Map(bundle.contentAnalysisSheets.map((s) => [s.productKey, s]));
  const docById = new Map(sources.map((s) => [s.documentId, s]));

  for (const question of bundle.humanDecisionChecklist) {
    const primaryDoc = getPrimaryDocumentForProduct(question.productKey, sources);
    const sheet = sheetByProduct.get(question.productKey);
    if (!primaryDoc || !sheet) {
      continue;
    }

    const qrdTokens = parseQrdTokensFromSectionRef(question.chplSectionOrSubpoint);
    for (const token of qrdTokens) {
      const sheetRow = findSheetRowForQrdToken(sheet.entries, token);
      const outcome: Stage1ChplCheckOutcome = sheetRow?.checkOutcome ?? 'extrapolation_note';
      const mapped = mapCheckOutcomeToEvidenceStatus(outcome);
      const rawPageRef = sheetRow?.pageRef ?? question.pageRef;
      const locMeta = parsePdfPageReference(rawPageRef, primaryDoc.physicalPageCount);

      const observationParts = [
        sheetRow?.conciseSummary,
        sheetRow?.discrepancyOrAmbiguity
          ? `Wykryta niejednoznaczność: ${sheetRow.discrepancyOrAmbiguity}`
          : undefined
      ].filter(Boolean);

      const qualificationClass = qualifyBaselineEntry({
        doc: primaryDoc,
        outcome,
        hasPdfPage: locMeta.pdfPageIndex !== null,
        hasExcerptRef: Boolean(sheetRow?.sourceExcerptRef)
      });

      entries.push({
        evidenceId: `ev-stage1-${question.id}-${token.replace('.', '_')}`,
        questionId: question.id,
        productKey: question.productKey,
        productLabel: getProductScopeLabel(question.productKey),
        documentId: primaryDoc.documentId,
        artifactId: primaryDoc.currentArtifact?.artifactId ?? null,
        documentTitle: primaryDoc.documentTitle,
        officialSourceUrl: primaryDoc.officialSourceUrl,
        sourceDocumentHash: primaryDoc.sha256,
        sha256Basis: primaryDoc.sha256Basis,
        location: {
          qrdSection: token,
          qrdSectionTitle: getQrdSectionTitle(token),
          ...locMeta
        },
        sourceExcerptRef:
          sheetRow?.sourceExcerptRef ??
          `${primaryDoc.documentTitle} · ${getQrdSectionTitle(token)} (${rawPageRef})`,
        clinicalObservation:
          observationParts.join(' · ') ||
          question.ambiguitySummary,
        relationship: mapped.relationship,
        qualificationClass,
        reviewStatus: mapped.reviewStatus,
        questionWorkStatus: mapped.questionWorkStatus,
        autoResolved: false,
        origin: 'bundle_extract',
        isWorkingNote: false,
        requiresReverification: true,
        recordedAt: bundle.generatedAt,
        recordedBy: 'Ekstrakcja Etapu I (read-only)'
      });
    }

    // Dodatkowe powiązania kontekstowe dla specyficznych pytań wielodokumentowych
    if (question.id === 'dec-bcg-41-age15-vs-pso') {
      const psoDoc = docById.get('doc-mz-pso-2027-akt');
      if (psoDoc) {
        entries.push({
          evidenceId: `ev-stage1-${question.id}-pso-context`,
          questionId: question.id,
          productKey: 'pso_2027_general',
          productLabel: getProductScopeLabel('pso_2027_general'),
          documentId: psoDoc.documentId,
          artifactId: psoDoc.currentArtifact?.artifactId ?? null,
          documentTitle: psoDoc.documentTitle,
          officialSourceUrl: psoDoc.officialSourceUrl,
          sourceDocumentHash: psoDoc.sha256,
          sha256Basis: psoDoc.sha256Basis,
          location: {
            qrdSection: '4.1',
            qrdSectionTitle: getQrdSectionTitle('4.1'),
            pdfPageIndex: null,
            pdfPageRangeLabel: 'Część I.A PSO 2027 vs pkt 4.1 ChPL BCG 10',
            printedPageNumber: 'Numeracja PSO 2027 — wymaga porównania z ChPL przez audytora',
            pageNumberingType: 'unconfirmed',
            physicalDocumentPageCount: psoDoc.physicalPageCount
          },
          sourceExcerptRef: 'Dz. Urz. MZ 2026 poz. 77 · harmonogram szczepień obowiązkowych BCG w PSO 2027',
          clinicalObservation:
            'Dokument prawny PSO 2027 stanowi kontekst operacyjny dla pytania o granicę wieku <15 lat w ChPL BCG 10; nie rozstrzyga samodzielnie wskazań ChPL.',
          relationship: 'contextualizes',
          qualificationClass: 'traceability_reference',
          reviewStatus: 'awaiting_human_review',
          questionWorkStatus: 'awaiting_human_review',
          autoResolved: false,
          origin: 'bundle_extract',
          isWorkingNote: false,
          requiresReverification: true,
          recordedAt: bundle.generatedAt,
          recordedBy: 'Ekstrakcja Etapu I (read-only)'
        });
      }
    }

    if (question.id === 'dec-flu-extrapolation-4valent') {
      const histDoc = docById.get('doc-rpl-vaxigrip-tetra-35346-hist');
      if (histDoc) {
        entries.push({
          evidenceId: `ev-stage1-${question.id}-hist-guard`,
          questionId: question.id,
          productKey: 'vaxigrip_tetra_historical_2025_2026',
          productLabel: getProductScopeLabel('vaxigrip_tetra_historical_2025_2026'),
          documentId: histDoc.documentId,
          artifactId: histDoc.currentArtifact?.artifactId ?? null,
          documentTitle: histDoc.documentTitle,
          officialSourceUrl: histDoc.officialSourceUrl,
          sourceDocumentHash: histDoc.sha256,
          sha256Basis: histDoc.sha256Basis,
          location: {
            qrdSection: '5.1',
            qrdSectionTitle: getQrdSectionTitle('5.1'),
            pdfPageIndex: null,
            pdfPageRangeLabel: 'Historyczna ChPL 2025/2026 (RPL 35346)',
            printedPageNumber: 'Dokument historyczny — nie stanowi ChPL sezonu 2026/2027',
            pageNumberingType: 'unconfirmed',
            physicalDocumentPageCount: null
          },
          sourceExcerptRef: 'RPL ID 35346 (VaxigripTetra 05/2025) — odrzucony jako dowód kliniczny dla sezonu 2026/2027',
          clinicalObservation:
            'Wskazuje, dlaczego automatyczna ekstrapolacja z dawnych druków 4-walentnych na 3-walentny Vaxigrip (RPL 50032) jest zablokowana i wymaga oceny audytora.',
          relationship: 'does_not_resolve',
          qualificationClass: 'secondary_reference',
          reviewStatus: 'awaiting_human_review',
          questionWorkStatus: 'awaiting_human_review',
          autoResolved: false,
          origin: 'bundle_extract',
          isWorkingNote: false,
          requiresReverification: true,
          recordedAt: bundle.generatedAt,
          recordedBy: 'Ekstrakcja Etapu I (read-only)'
        });
      }
    }

    if (question.id === 'dec-covid-gtin-vs-ema-sec10') {
      const enDoc = docById.get('doc-ema-spikevax-xfg-en');
      const rplCenDoc = docById.get('doc-rpl-spikevax-cen-endpoints');
      if (enDoc) {
        entries.push({
          evidenceId: `ev-stage1-${question.id}-ema-en-sec10`,
          questionId: question.id,
          productKey: 'spikevax_xfg',
          productLabel: getProductScopeLabel('spikevax_xfg'),
          documentId: enDoc.documentId,
          artifactId: enDoc.currentArtifact?.artifactId ?? null,
          documentTitle: enDoc.documentTitle,
          officialSourceUrl: enDoc.officialSourceUrl,
          sourceDocumentHash: enDoc.sha256,
          sha256Basis: enDoc.sha256Basis,
          location: {
            qrdSection: '10',
            qrdSectionTitle: getQrdSectionTitle('10'),
            pdfPageIndex: 77,
            pdfPageRangeLabel: 'EPAR EN str. 77',
            printedPageNumber: 'Osobna numeracja druku niepotwierdzona — podano indeks strony pliku EPAR EN (str. 77 z 158)',
            pageNumberingType: 'pdf_page_index',
            physicalDocumentPageCount: enDoc.physicalPageCount
          },
          sourceExcerptRef: 'EMA EPAR EN (str. 77): sekcja 10 SmPC nie zawiera wpisanej daty rewizji tekstu',
          clinicalObservation:
            'Wskazuje brak daty w sekcji 10 równolegle w wersji PL (str. 92) oraz EN (str. 77); strona główna EPAR podaje Last updated 30/10/2026.',
          relationship: 'missing_information',
          qualificationClass: 'source_excerpt_pending_review',
          reviewStatus: 'requires_authority_clarification',
          questionWorkStatus: 'requires_authority_clarification',
          autoResolved: false,
          origin: 'bundle_extract',
          isWorkingNote: false,
          requiresReverification: true,
          recordedAt: bundle.generatedAt,
          recordedBy: 'Ekstrakcja Etapu I (read-only)'
        });
      }
      if (rplCenDoc) {
        entries.push({
          evidenceId: `ev-stage1-${question.id}-rpl-cen-unavailable`,
          questionId: question.id,
          productKey: 'spikevax_xfg',
          productLabel: getProductScopeLabel('spikevax_xfg'),
          documentId: rplCenDoc.documentId,
          artifactId: null,
          documentTitle: rplCenDoc.documentTitle,
          officialSourceUrl: rplCenDoc.officialSourceUrl,
          sourceDocumentHash: null,
          sha256Basis: 'not_verified_binary',
          location: {
            qrdSection: '8',
            qrdSectionTitle: getQrdSectionTitle('8'),
            pdfPageIndex: null,
            pdfPageRangeLabel: 'Endpoint API RPL CEN 54306 / 54308 / 54456 (HTTP 400)',
            printedPageNumber: 'Brak pliku PDF po stronie API RPL',
            pageNumberingType: 'unconfirmed',
            physicalDocumentPageCount: null
          },
          sourceExcerptRef: 'RPL CEN ID 54306/54308/54456 — brak plików do pobrania w polskim API RPL (HTTP 400)',
          clinicalObservation:
            'Kody GTIN 00380777714110 oraz 00380777712024 pochodzą z komunikatów MZ/RARS (materiał wtórny) i nie zostały pozyskane przez endpoint API RPL.',
          relationship: 'does_not_resolve',
          qualificationClass: 'unavailable_source_reference',
          reviewStatus: 'requires_authority_clarification',
          questionWorkStatus: 'requires_authority_clarification',
          autoResolved: false,
          origin: 'bundle_extract',
          isWorkingNote: false,
          requiresReverification: true,
          recordedAt: bundle.generatedAt,
          recordedBy: 'Ekstrakcja Etapu I (read-only)'
        });
      }
    }
  }

  return entries;
}

export interface WorkingEvidenceDraftInput {
  questionId: string;
  documentId: string;
  qrdSection: string;
  pdfPageIndex: number | null;
  printedPageNumber: string;
  pageNumberingType: PageNumberingType;
  sourceExcerptRef: string;
  clinicalObservation: string;
  relationship: EvidenceRelationship;
  qualificationClass?: EvidenceQualificationClass;
  confirmedRealPdfContent?: boolean;
  verificationSessionId?: string | null;
  reviewedInLocalPdfSession?: boolean;
  reviewStatus: EvidenceReviewStatus;
}

function canQualifyConfirmedPdfExcerpt(doc: SourceRegistryEntry | undefined): boolean {
  return Boolean(
    doc &&
      doc.statusAxes.acquisitionStatus !== 'access_failed' &&
      doc.objectType !== 'official_endpoint' &&
      !doc.isHistoricalRejectedForCurrentSeason &&
      Boolean(doc.sha256)
  );
}

function inferDefaultQualificationClassForDraft(
  doc: SourceRegistryEntry | undefined,
  input: WorkingEvidenceDraftInput
): EvidenceQualificationClass {
  if (input.qualificationClass && ALLOWED_EVIDENCE_QUALIFICATION_CLASSES.includes(input.qualificationClass)) {
    return input.qualificationClass;
  }
  if (doc?.statusAxes.acquisitionStatus === 'access_failed' || doc?.objectType === 'official_endpoint') {
    return 'unavailable_source_reference';
  }
  if (doc?.isHistoricalRejectedForCurrentSeason || doc?.objectType === 'secondary_document') {
    return 'secondary_reference';
  }
  if (input.relationship === 'contradicts') {
    return input.confirmedRealPdfContent === true &&
      input.pdfPageIndex !== null &&
      canQualifyConfirmedPdfExcerpt(doc)
      ? 'conflicting_source_excerpt'
      : 'conflicting_reference';
  }
  if (input.pdfPageIndex !== null) {
    return 'source_excerpt_pending_review';
  }
  return 'traceability_reference';
}

export function validateWorkingEvidenceInput(
  input: WorkingEvidenceDraftInput,
  checklist: readonly Stage1HumanDecisionItem[],
  sources: readonly SourceRegistryEntry[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const question = checklist.find((q) => q.id === input.questionId);
  if (!question) {
    errors.push(`Nieznany identyfikator pytania audytowego: „${input.questionId}”.`);
  }

  const doc = sources.find((s) => s.documentId === input.documentId);
  if (!doc) {
    errors.push(`Nieznany identyfikator dokumentu źródłowego: „${input.documentId}”.`);
  }

  if (!isValidQrdSection(input.qrdSection)) {
    errors.push('Podaj poprawny punkt QRD (np. 1, 2, 4.1–4.9, 5.1, 6.3, 8, 10).');
  }

  if (!ALLOWED_PAGE_NUMBERING_TYPES.includes(input.pageNumberingType)) {
    errors.push('Nieprawidłowy tryb numeracji strony.');
  }

  if (input.pdfPageIndex !== null) {
    if (!Number.isInteger(input.pdfPageIndex) || input.pdfPageIndex < 1) {
      errors.push('Indeks strony PDF musi być dodatnią liczbą całkowitą.');
    } else if (doc?.physicalPageCount !== null && doc?.physicalPageCount !== undefined && input.pdfPageIndex > doc.physicalPageCount) {
      errors.push(
        `Strona PDF (${input.pdfPageIndex}) przekracza liczbę stron dokumentu „${doc.documentTitle}” (${doc.physicalPageCount} str.).`
      );
    }
  } else if (input.pageNumberingType === 'pdf_page_index') {
    errors.push('Wybrano tryb „Indeks strony PDF” — podaj numer strony PDF (>= 1).');
  }

  const excerpt = input.sourceExcerptRef.trim();
  if (excerpt.length < 5) {
    errors.push('Krótki cytat / odniesienie źródłowe musi mieć co najmniej 5 znaków.');
  } else if (excerpt.length > MAX_EXCERPT_LENGTH) {
    errors.push(
      `Odniesienie źródłowe przekracza limit ${MAX_EXCERPT_LENGTH} znaków (nie kopiuj całej treści ChPL).`
    );
  }

  const observation = input.clinicalObservation.trim();
  if (observation.length < 5) {
    errors.push('Obserwacja robocza musi mieć co najmniej 5 znaków.');
  } else if (observation.length > MAX_OBSERVATION_LENGTH) {
    errors.push(`Obserwacja robocza przekracza limit ${MAX_OBSERVATION_LENGTH} znaków.`);
  }

  if (!ALLOWED_EVIDENCE_RELATIONSHIPS.includes(input.relationship)) {
    errors.push('Nieprawidłowy typ relacji dowodu względem pytania.');
  }

  if (!ALLOWED_EVIDENCE_REVIEW_STATUSES.includes(input.reviewStatus)) {
    errors.push('Nieprawidłowy status roboczy dowodu.');
  }

  if (
    input.qualificationClass !== undefined &&
    !ALLOWED_EVIDENCE_QUALIFICATION_CLASSES.includes(input.qualificationClass)
  ) {
    errors.push(`Nieprawidłowa klasa kwalifikacji dowodu: ${String(input.qualificationClass)}.`);
  }

  if (
    input.qualificationClass === 'source_excerpt_reviewed' ||
    input.qualificationClass === 'conflicting_source_excerpt'
  ) {
    const classLabel =
      input.qualificationClass === 'conflicting_source_excerpt'
        ? 'potwierdzonej rozbieżności w PDF (conflicting_source_excerpt)'
        : 'zweryfikowanego fragmentu PDF (source_excerpt_reviewed)';
    if (!doc || doc.statusAxes.acquisitionStatus === 'access_failed' || doc.objectType === 'official_endpoint') {
      errors.push(`Nie można przypisać klasy ${classLabel} dla niedostępnego endpointu lub błędu pobrania.`);
    } else if (doc.isHistoricalRejectedForCurrentSeason) {
      errors.push(`Dokument historyczny (2025/2026) nie może zostać zakwalifikowany jako ${classLabel} dla bieżącego audytu.`);
    } else if (!doc.sha256) {
      errors.push(`Brak zidentyfikowanego pliku / sumy SHA-256 — nie można zadeklarować ${classLabel}.`);
    }
    if (input.pdfPageIndex === null) {
      errors.push(`Klasa ${classLabel} wymaga wskazania konkretnej strony PDF (>= 1).`);
    }
    if (input.confirmedRealPdfContent !== true) {
      errors.push('Wymagane jest jawne potwierdzenie, że cytowany fragment został ręcznie porównany z treścią rzeczywistego pliku PDF.');
    }
  }

  return { valid: errors.length === 0, errors };
}

function mapReviewStatusToQuestionWorkStatus(status: EvidenceReviewStatus): QuestionWorkStatus {
  switch (status) {
    case 'unreviewed_extract':
      return 'source_identified';
    case 'evidence_logged':
      return 'evidence_collected';
    case 'conflicting_evidence':
      return 'conflicting_evidence';
    case 'awaiting_human_review':
      return 'awaiting_human_review';
    case 'requires_authority_clarification':
      return 'requires_authority_clarification';
  }
}

export function createWorkingEvidenceEntry(
  input: WorkingEvidenceDraftInput,
  checklist: readonly Stage1HumanDecisionItem[],
  sources: readonly SourceRegistryEntry[],
  now: Date = new Date()
): EvidenceLedgerEntry {
  const validation = validateWorkingEvidenceInput(input, checklist, sources);
  if (!validation.valid) {
    throw new Error(validation.errors.join(' '));
  }

  const doc = sources.find((s) => s.documentId === input.documentId)!;
  const iso = now.toISOString();
  const suffix = Math.random().toString(36).slice(2, 8);
  const qrdNormalized = input.qrdSection.trim();
  const qualificationClass = inferDefaultQualificationClassForDraft(doc, input);
  const pageLabel =
    input.pdfPageIndex !== null
      ? `PDF str. ${input.pdfPageIndex}${doc.physicalPageCount ? ` z ${doc.physicalPageCount}` : ''}`
      : 'Numer strony niepotwierdzony';

  return {
    evidenceId: `ev-work-${now.getTime()}-${suffix}`,
    questionId: input.questionId,
    productKey: doc.productKey,
    productLabel: getProductScopeLabel(doc.productKey),
    documentId: doc.documentId,
    artifactId: doc.currentArtifact?.artifactId ?? null,
    documentTitle: doc.documentTitle,
    officialSourceUrl: doc.officialSourceUrl,
    sourceDocumentHash: doc.sha256,
    sha256Basis: doc.sha256Basis,
    location: {
      qrdSection: qrdNormalized,
      qrdSectionTitle: getQrdSectionTitle(qrdNormalized),
      pdfPageIndex: input.pdfPageIndex,
      pdfPageRangeLabel: pageLabel,
      printedPageNumber: input.printedPageNumber.trim() || null,
      pageNumberingType: input.pageNumberingType,
      physicalDocumentPageCount: doc.physicalPageCount
    },
    sourceExcerptRef: input.sourceExcerptRef.trim(),
    clinicalObservation: input.clinicalObservation.trim(),
    relationship: input.relationship,
    qualificationClass,
    reviewStatus: input.reviewStatus,
    questionWorkStatus: mapReviewStatusToQuestionWorkStatus(input.reviewStatus),
    autoResolved: false,
    origin: 'auditor_working_entry',
    isWorkingNote: true,
    requiresReverification:
      qualificationClass !== 'source_excerpt_reviewed' &&
      qualificationClass !== 'conflicting_source_excerpt',
    importProvenance: {
      isImported: false,
      importedAt: null,
      importClaimStatus: 'local_author_record',
      claimedQualificationClass: null,
      claimedReviewStatus: null,
      claimedSourceDocumentHash: null,
      claimedOriginConfirmedByImport: false,
      localConfirmationState: 'local_session_author',
      migrationSourceVersion: null
    },
    verificationSessionId: input.verificationSessionId ?? null,
    reviewedInLocalPdfSession: Boolean(input.reviewedInLocalPdfSession ?? input.verificationSessionId),
    sourceAxisSummaryAtReview: formatSourceAxisSummary(doc),
    recordedAt: iso,
    recordedBy: LOCAL_WORKING_NOTE_AUTHOR
  };
}

export interface WorkingNoteDraftInput {
  questionId: string;
  documentId: string | null;
  qrdSection: string | null;
  pdfPageIndex: number | null;
  noteText: string;
  disclaimerAcknowledged: boolean;
}

export function validateWorkingNoteInput(
  input: WorkingNoteDraftInput,
  checklist: readonly Stage1HumanDecisionItem[],
  sources: readonly SourceRegistryEntry[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!checklist.some((q) => q.id === input.questionId)) {
    errors.push(`Nieznane pytanie audytowe: „${input.questionId}”.`);
  }

  let doc: SourceRegistryEntry | undefined;
  if (input.documentId) {
    doc = sources.find((s) => s.documentId === input.documentId);
    if (!doc) {
      errors.push(`Nieznany dokument źródłowy w notatce: „${input.documentId}”.`);
    }
  }

  if (input.qrdSection && input.qrdSection.trim() !== '' && !isValidQrdSection(input.qrdSection)) {
    errors.push('Opcjonalny punkt QRD w notatce ma nieprawidłowy format.');
  }

  if (input.pdfPageIndex !== null) {
    if (!Number.isInteger(input.pdfPageIndex) || input.pdfPageIndex < 1) {
      errors.push('Numer strony PDF w notatce musi być liczbą całkowitą >= 1.');
    } else if (
      doc?.physicalPageCount !== null &&
      doc?.physicalPageCount !== undefined &&
      input.pdfPageIndex > doc.physicalPageCount
    ) {
      errors.push(
        `Strona PDF (${input.pdfPageIndex}) w notatce przekracza zakres dokumentu (${doc.physicalPageCount} str.).`
      );
    }
  }

  const trimmedNote = input.noteText.trim();
  if (trimmedNote.length < 3) {
    errors.push('Treść notatki roboczej musi mieć co najmniej 3 znaki.');
  } else if (trimmedNote.length > MAX_WORKING_NOTE_LENGTH) {
    errors.push(`Notatka robocza przekracza limit ${MAX_WORKING_NOTE_LENGTH} znaków.`);
  }

  if (!input.disclaimerAcknowledged) {
    errors.push('Wymagane jest potwierdzenie roboczego charakteru lokalnej notatki.');
  }

  return { valid: errors.length === 0, errors };
}

export function createInformalWorkingNote(
  input: WorkingNoteDraftInput,
  checklist: readonly Stage1HumanDecisionItem[],
  sources: readonly SourceRegistryEntry[],
  now: Date = new Date()
): InformalWorkingNote {
  const validation = validateWorkingNoteInput(input, checklist, sources);
  if (!validation.valid) {
    throw new Error(validation.errors.join(' '));
  }
  const iso = now.toISOString();
  const suffix = Math.random().toString(36).slice(2, 8);
  return {
    noteId: `note-work-${now.getTime()}-${suffix}`,
    questionId: input.questionId,
    documentId: input.documentId || null,
    qrdSection: input.qrdSection?.trim() || null,
    pdfPageIndex: input.pdfPageIndex,
    noteText: input.noteText.trim(),
    createdAt: iso,
    updatedAt: iso,
    authorLabel: LOCAL_WORKING_NOTE_AUTHOR,
    isInformalWorkingNote: true,
    disclaimerAcknowledged: true
  };
}

function inferLegacyQualificationClass(
  doc: SourceRegistryEntry,
  relationship: EvidenceRelationship,
  pdfPageIndex: number | null,
  excerptLength: number
): EvidenceQualificationClass {
  if (doc.statusAxes.acquisitionStatus === 'access_failed' || doc.objectType === 'official_endpoint') {
    return 'unavailable_source_reference';
  }
  if (doc.isHistoricalRejectedForCurrentSeason || doc.objectType === 'secondary_document') {
    return 'secondary_reference';
  }
  if (relationship === 'contradicts') {
    return 'conflicting_reference';
  }
  if (pdfPageIndex !== null && excerptLength >= 10) {
    return 'source_excerpt_pending_review';
  }
  return 'traceability_reference';
}

function validateImportedEvidenceEntryObject(
  raw: unknown,
  index: number,
  sourceMap: ReadonlyMap<string, SourceRegistryEntry>,
  questionIds: ReadonlySet<string>,
  seenIds: Set<string>,
  options: { isLocalStorageMigration?: boolean; importedAt?: string } = {}
): {
  entry?: EvidenceLedgerEntry;
  rejection?: EvidenceLedgerImportRejectedItem;
  importedVerificationClaim?: boolean;
  versionMismatchConflict?: EvidenceLedgerImportConflict;
} {
  const fallbackId = isPlainRecord(raw) && typeof raw.evidenceId === 'string' ? raw.evidenceId : `entry[${index}]`;
  if (!isPlainRecord(raw)) {
    return { rejection: { kind: 'entry', id: fallbackId, reason: 'Wpis dowodowy nie jest obiektem JSON.' } };
  }
  if (hasPrototypePollutionKey(raw)) {
    return { rejection: { kind: 'entry', id: fallbackId, reason: 'Wykryto niedozwolone klucze prototypowe.' } };
  }
  if (typeof raw.evidenceId !== 'string' || !raw.evidenceId.trim()) {
    return { rejection: { kind: 'entry', id: fallbackId, reason: 'Brak wymaganego evidenceId.' } };
  }
  const id = raw.evidenceId.trim();
  if (seenIds.has(id)) {
    return { rejection: { kind: 'entry', id, reason: `Zduplikowany identyfikator dowodu: ${id}.` } };
  }
  seenIds.add(id);

  if (raw.autoResolved !== false) {
    return {
      rejection: {
        kind: 'entry',
        id,
        reason: 'Niedozwolona wartość autoResolved — import nie może automatycznie zamykać pytań klinicznych.'
      }
    };
  }

  if (typeof raw.questionId !== 'string' || !questionIds.has(raw.questionId)) {
    return {
      rejection: {
        kind: 'entry',
        id,
        reason: `Brak lub nieznany identyfikator pytania audytowego: ${String(raw.questionId)}.`
      }
    };
  }

  if (typeof raw.documentId !== 'string' || !sourceMap.has(raw.documentId)) {
    return {
      rejection: {
        kind: 'entry',
        id,
        reason: `Nieznany documentId w Rejestrze Źródeł: ${String(raw.documentId)}.`
      }
    };
  }
  const canonicalDoc = sourceMap.get(raw.documentId)!;

  if (!isValidHttpUrl(raw.officialSourceUrl)) {
    return {
      rejection: {
        kind: 'entry',
        id,
        reason: `Nieprawidłowy lub niebezpieczny adres URL źródła: ${String(raw.officialSourceUrl)}.`
      }
    };
  }

  // Ochrona spójności SHA-256 ze znanym dokumentem
  const incomingHash = raw.sourceDocumentHash;
  let localStorageHistoricalOrResetHashMismatch = false;
  if (incomingHash !== null && incomingHash !== undefined) {
    if (!isValidSha256Hex(incomingHash)) {
      return { rejection: { kind: 'entry', id, reason: 'Nieprawidłowy format skrótu SHA-256.' } };
    }
    if (canonicalDoc.sha256 && incomingHash.toLowerCase() !== canonicalDoc.sha256.toLowerCase()) {
      if (options.isLocalStorageMigration) {
        localStorageHistoricalOrResetHashMismatch = true;
      } else {
        return {
          rejection: {
            kind: 'entry',
            id,
            reason: `Niezgodność skrótu SHA-256 dla dokumentu ${canonicalDoc.documentId} (możliwa modyfikacja pliku).`
          }
        };
      }
    }
  } else if (canonicalDoc.sha256) {
    if (options.isLocalStorageMigration) {
      localStorageHistoricalOrResetHashMismatch = true;
    } else {
      return {
        rejection: {
          kind: 'entry',
          id,
          reason: `Brak wymaganego skrótu SHA-256 dla dokumentu posiadającego zapisany hash (${canonicalDoc.documentId}).`
        }
      };
    }
  }

  if (
    typeof raw.relationship !== 'string' ||
    !(ALLOWED_EVIDENCE_RELATIONSHIPS as readonly string[]).includes(raw.relationship)
  ) {
    return {
      rejection: {
        kind: 'entry',
        id,
        reason: `Niedozwolony typ relacji dowodu: ${String(raw.relationship)}.`
      }
    };
  }

  if (
    typeof raw.reviewStatus !== 'string' ||
    !(ALLOWED_EVIDENCE_REVIEW_STATUSES as readonly string[]).includes(raw.reviewStatus)
  ) {
    return {
      rejection: {
        kind: 'entry',
        id,
        reason: `Niedozwolony status dowodu (np. próba wstrzyknięcia verified_full / verified_chpl): ${String(raw.reviewStatus)}.`
      }
    };
  }

  const workStatus: QuestionWorkStatus =
    typeof raw.questionWorkStatus === 'string' &&
    (ALLOWED_QUESTION_WORK_STATUSES as readonly string[]).includes(raw.questionWorkStatus)
      ? (raw.questionWorkStatus as QuestionWorkStatus)
      : mapReviewStatusToQuestionWorkStatus(raw.reviewStatus as EvidenceReviewStatus);

  if (!isPlainRecord(raw.location)) {
    return { rejection: { kind: 'entry', id, reason: 'Brak obiektu location (punkt QRD i strona PDF).' } };
  }

  const loc = raw.location;
  if (!isValidQrdSection(loc.qrdSection)) {
    return {
      rejection: {
        kind: 'entry',
        id,
        reason: `Nieprawidłowy punkt QRD w lokalizacji: ${String(loc.qrdSection)}.`
      }
    };
  }

  const numberingType: PageNumberingType =
    typeof loc.pageNumberingType === 'string' &&
    (ALLOWED_PAGE_NUMBERING_TYPES as readonly string[]).includes(loc.pageNumberingType)
      ? (loc.pageNumberingType as PageNumberingType)
      : 'unconfirmed';

  const pageIdx = loc.pdfPageIndex;
  if (pageIdx !== null && pageIdx !== undefined) {
    if (typeof pageIdx !== 'number' || !Number.isInteger(pageIdx) || pageIdx < 1) {
      return {
        rejection: { kind: 'entry', id, reason: `Nieprawidłowy numer strony PDF: ${String(pageIdx)}.` }
      };
    }
    if (canonicalDoc.physicalPageCount !== null && pageIdx > canonicalDoc.physicalPageCount) {
      return {
        rejection: {
          kind: 'entry',
          id,
          reason: `Numer strony PDF (${pageIdx}) wykracza poza objętość dokumentu (${canonicalDoc.physicalPageCount} str.).`
        }
      };
    }
  }

  if (typeof raw.sourceExcerptRef !== 'string' || raw.sourceExcerptRef.trim().length < 5) {
    return { rejection: { kind: 'entry', id, reason: 'Puste lub zbyt krótkie odniesienie źródłowe (sourceExcerptRef).' } };
  }
  if (raw.sourceExcerptRef.trim().length > MAX_EXCERPT_LENGTH) {
    return {
      rejection: {
        kind: 'entry',
        id,
        reason: `Odniesienie źródłowe przekracza limit ${MAX_EXCERPT_LENGTH} znaków.`
      }
    };
  }

  if (typeof raw.clinicalObservation !== 'string' || raw.clinicalObservation.trim().length < 5) {
    return { rejection: { kind: 'entry', id, reason: 'Pusta lub zbyt krótka obserwacja robocza.' } };
  }
  if (raw.clinicalObservation.trim().length > MAX_OBSERVATION_LENGTH) {
    return {
      rejection: {
        kind: 'entry',
        id,
        reason: `Obserwacja robocza przekracza limit ${MAX_OBSERVATION_LENGTH} znaków.`
      }
    };
  }

  if (!isValidDateString(raw.recordedAt)) {
    return { rejection: { kind: 'entry', id, reason: `Nieprawidłowa data recordedAt: ${String(raw.recordedAt)}.` } };
  }

  const origin: EvidenceOrigin =
    raw.origin === 'bundle_extract' ? 'bundle_extract' : 'auditor_working_entry';
  const normalizedQrd = loc.qrdSection.trim();
  const normalizedPageIdx = typeof pageIdx === 'number' ? pageIdx : null;

  // Walidacja i kwalifikacja klasy B3
  let rawQualificationClass: EvidenceQualificationClass | null = null;
  if (raw.qualificationClass !== undefined && raw.qualificationClass !== null) {
    if (
      typeof raw.qualificationClass !== 'string' ||
      !(ALLOWED_EVIDENCE_QUALIFICATION_CLASSES as readonly string[]).includes(raw.qualificationClass)
    ) {
      return {
        rejection: {
          kind: 'entry',
          id,
          reason: `Niedozwolona klasa kwalifikacji dowodu: ${String(raw.qualificationClass)}.`
        }
      };
    }
    rawQualificationClass = raw.qualificationClass as EvidenceQualificationClass;
  }

  const inferredClass = inferLegacyQualificationClass(
    canonicalDoc,
    raw.relationship as EvidenceRelationship,
    normalizedPageIdx,
    raw.sourceExcerptRef.trim().length
  );

  const isLegacyB2Entry = raw.qualificationClass === undefined || raw.qualificationClass === null;
  let effectiveQualificationClass: EvidenceQualificationClass = rawQualificationClass ?? inferredClass;
  let importedVerificationClaim = false;
  let requiresReverification =
    Boolean(raw.requiresReverification) ||
    (options.isLocalStorageMigration === true && isLegacyB2Entry);

  const incomingClaimedVerified =
    rawQualificationClass === 'source_excerpt_reviewed' ||
    rawQualificationClass === 'conflicting_source_excerpt' ||
    (isPlainRecord(raw.importProvenance) &&
      (raw.importProvenance.claimedQualificationClass === 'source_excerpt_reviewed' ||
        raw.importProvenance.claimedQualificationClass === 'conflicting_source_excerpt' ||
        raw.importProvenance.claimedOriginConfirmedByImport === true));

  // Przy zewnętrznym imporcie JSON nigdy nie uznajemy cudzego statusu zweryfikowanego z PDF za lokalnie potwierdzony
  if (!options.isLocalStorageMigration && origin === 'auditor_working_entry' && incomingClaimedVerified) {
    importedVerificationClaim = true;
    effectiveQualificationClass =
      effectiveQualificationClass === 'conflicting_source_excerpt'
        ? 'conflicting_reference'
        : 'source_excerpt_pending_review';
    requiresReverification = true;
  } else if (
    options.isLocalStorageMigration &&
    origin === 'bundle_extract' &&
    (effectiveQualificationClass === 'source_excerpt_reviewed' ||
      effectiveQualificationClass === 'conflicting_source_excerpt')
  ) {
    effectiveQualificationClass = inferredClass;
    requiresReverification = true;
  }

  // Konflikt wersji artefaktu lub zmiana hasha po przeładowaniu / resecie
  const incomingArtifactId =
    typeof raw.artifactId === 'string' && raw.artifactId.trim() ? raw.artifactId.trim() : null;
  const currentArtifactId = canonicalDoc.currentArtifact?.artifactId ?? null;
  let versionMismatchConflict: EvidenceLedgerImportConflict | undefined;
  if (
    (incomingArtifactId && currentArtifactId && incomingArtifactId !== currentArtifactId) ||
    localStorageHistoricalOrResetHashMismatch
  ) {
    if (incomingArtifactId && currentArtifactId && incomingArtifactId !== currentArtifactId) {
      versionMismatchConflict = {
        kind: 'artifact_version_mismatch',
        id,
        details: `Wpis ${id} odwołuje się do artefaktu ${incomingArtifactId}, podczas gdy bieżąca wersja dokumentu to ${currentArtifactId}. Wymaga ponownego sprawdzenia.`
      };
    }
    requiresReverification = true;
    if (effectiveQualificationClass === 'source_excerpt_reviewed') {
      effectiveQualificationClass = 'source_excerpt_pending_review';
    } else if (effectiveQualificationClass === 'conflicting_source_excerpt') {
      effectiveQualificationClass = 'conflicting_reference';
    }
  }

  const incomingOriginClaimed =
    isPlainRecord(raw.importProvenance) && raw.importProvenance.claimedOriginConfirmedByImport === true;

  const entry: EvidenceLedgerEntry = {
    evidenceId: id,
    questionId: raw.questionId,
    productKey: canonicalDoc.productKey,
    productLabel: getProductScopeLabel(canonicalDoc.productKey),
    documentId: canonicalDoc.documentId,
    artifactId: options.isLocalStorageMigration ? (incomingArtifactId ?? currentArtifactId) : currentArtifactId,
    documentTitle: canonicalDoc.documentTitle,
    officialSourceUrl: canonicalDoc.officialSourceUrl,
    sourceDocumentHash:
      options.isLocalStorageMigration && typeof incomingHash === 'string'
        ? incomingHash
        : canonicalDoc.sha256,
    sha256Basis: canonicalDoc.sha256Basis,
    location: {
      qrdSection: normalizedQrd,
      qrdSectionTitle: getQrdSectionTitle(normalizedQrd),
      pdfPageIndex: normalizedPageIdx,
      pdfPageRangeLabel:
        typeof loc.pdfPageRangeLabel === 'string' && loc.pdfPageRangeLabel.trim()
          ? loc.pdfPageRangeLabel.trim()
          : normalizedPageIdx !== null
            ? `PDF str. ${normalizedPageIdx}`
            : 'Brak numeru strony PDF',
      printedPageNumber:
        typeof loc.printedPageNumber === 'string' && loc.printedPageNumber.trim()
          ? loc.printedPageNumber.trim()
          : null,
      pageNumberingType: numberingType,
      physicalDocumentPageCount: canonicalDoc.physicalPageCount
    },
    sourceExcerptRef: raw.sourceExcerptRef.trim(),
    clinicalObservation: raw.clinicalObservation.trim(),
    relationship: raw.relationship as EvidenceRelationship,
    qualificationClass: effectiveQualificationClass,
    reviewStatus: raw.reviewStatus as EvidenceReviewStatus,
    questionWorkStatus: workStatus,
    autoResolved: false,
    origin,
    isWorkingNote: origin === 'auditor_working_entry' ? true : Boolean(raw.isWorkingNote),
    requiresReverification,
    importProvenance: options.isLocalStorageMigration
      ? {
          isImported: isPlainRecord(raw.importProvenance) ? Boolean(raw.importProvenance.isImported) : false,
          importedAt:
            isPlainRecord(raw.importProvenance) && typeof raw.importProvenance.importedAt === 'string'
              ? raw.importProvenance.importedAt
              : null,
          importClaimStatus:
            isPlainRecord(raw.importProvenance) &&
            raw.importProvenance.importClaimStatus === 'imported_verified_claim_unconfirmed_locally'
              ? 'imported_verified_claim_unconfirmed_locally'
              : isPlainRecord(raw.importProvenance) && Boolean(raw.importProvenance.isImported)
                ? 'imported_unverified_claim'
                : 'local_author_record',
          claimedQualificationClass: rawQualificationClass,
          claimedReviewStatus: raw.reviewStatus as EvidenceReviewStatus,
          claimedSourceDocumentHash: typeof incomingHash === 'string' ? incomingHash : null,
          claimedOriginConfirmedByImport: incomingOriginClaimed,
          localConfirmationState:
            isPlainRecord(raw.importProvenance) && Boolean(raw.importProvenance.isImported)
              ? 'unconfirmed_imported_claim'
              : 'local_session_author',
          migrationSourceVersion: rawQualificationClass === null ? 'b2_master04' : 'b3_master05'
        }
      : {
          isImported: true,
          importedAt: options.importedAt ?? null,
          importClaimStatus: importedVerificationClaim
            ? 'imported_verified_claim_unconfirmed_locally'
            : 'imported_unverified_claim',
          claimedQualificationClass: rawQualificationClass ?? effectiveQualificationClass,
          claimedReviewStatus: raw.reviewStatus as EvidenceReviewStatus,
          claimedSourceDocumentHash: typeof incomingHash === 'string' ? incomingHash : null,
          claimedOriginConfirmedByImport: incomingOriginClaimed || incomingClaimedVerified,
          localConfirmationState: 'unconfirmed_imported_claim',
          migrationSourceVersion: null
        },
    verificationSessionId:
      options.isLocalStorageMigration && typeof raw.verificationSessionId === 'string'
        ? raw.verificationSessionId
        : null,
    reviewedInLocalPdfSession:
      options.isLocalStorageMigration && raw.reviewedInLocalPdfSession === true,
    sourceAxisSummaryAtReview:
      typeof raw.sourceAxisSummaryAtReview === 'string' ? raw.sourceAxisSummaryAtReview : null,
    recordedAt: String(raw.recordedAt).trim(),
    recordedBy:
      origin === 'bundle_extract'
        ? 'Ekstrakcja Etapu I (read-only)'
        : typeof raw.recordedBy === 'string' && raw.recordedBy.trim()
          ? raw.recordedBy.trim()
          : LOCAL_WORKING_NOTE_AUTHOR
  };

  return { entry, importedVerificationClaim, versionMismatchConflict };
}

function validateImportedWorkingNoteObject(
  raw: unknown,
  index: number,
  sourceMap: ReadonlyMap<string, SourceRegistryEntry>,
  questionIds: ReadonlySet<string>,
  seenIds: Set<string>
): { note?: InformalWorkingNote; rejection?: EvidenceLedgerImportRejectedItem } {
  const fallbackId = isPlainRecord(raw) && typeof raw.noteId === 'string' ? raw.noteId : `note[${index}]`;
  if (!isPlainRecord(raw)) {
    return { rejection: { kind: 'workingNote', id: fallbackId, reason: 'Notatka robocza nie jest obiektem JSON.' } };
  }
  if (hasPrototypePollutionKey(raw)) {
    return { rejection: { kind: 'workingNote', id: fallbackId, reason: 'Wykryto niedozwolone klucze prototypowe.' } };
  }
  if (typeof raw.noteId !== 'string' || !raw.noteId.trim()) {
    return { rejection: { kind: 'workingNote', id: fallbackId, reason: 'Brak wymaganego noteId.' } };
  }
  const id = raw.noteId.trim();
  if (seenIds.has(id)) {
    return { rejection: { kind: 'workingNote', id, reason: `Zduplikowane noteId: ${id}.` } };
  }
  seenIds.add(id);

  if (typeof raw.questionId !== 'string' || !questionIds.has(raw.questionId)) {
    return {
      rejection: { kind: 'workingNote', id, reason: `Nieznany questionId w notatce: ${String(raw.questionId)}.` }
    };
  }

  let doc: SourceRegistryEntry | undefined;
  if (raw.documentId !== null && raw.documentId !== undefined && raw.documentId !== '') {
    if (typeof raw.documentId !== 'string' || !sourceMap.has(raw.documentId)) {
      return {
        rejection: { kind: 'workingNote', id, reason: `Nieznany documentId w notatce: ${String(raw.documentId)}.` }
      };
    }
    doc = sourceMap.get(raw.documentId);
  }

  let normalizedQrd: string | null = null;
  if (raw.qrdSection !== null && raw.qrdSection !== undefined && raw.qrdSection !== '') {
    if (!isValidQrdSection(raw.qrdSection)) {
      return {
        rejection: { kind: 'workingNote', id, reason: `Nieprawidłowy punkt QRD w notatce: ${String(raw.qrdSection)}.` }
      };
    }
    normalizedQrd = raw.qrdSection.trim();
  }

  let normalizedPage: number | null = null;
  if (raw.pdfPageIndex !== null && raw.pdfPageIndex !== undefined) {
    if (typeof raw.pdfPageIndex !== 'number' || !Number.isInteger(raw.pdfPageIndex) || raw.pdfPageIndex < 1) {
      return {
        rejection: { kind: 'workingNote', id, reason: `Nieprawidłowy numer strony PDF w notatce: ${String(raw.pdfPageIndex)}.` }
      };
    }
    if (doc?.physicalPageCount !== null && doc?.physicalPageCount !== undefined && raw.pdfPageIndex > doc.physicalPageCount) {
      return {
        rejection: {
          kind: 'workingNote',
          id,
          reason: `Strona PDF (${raw.pdfPageIndex}) w notatce przekracza dokument (${doc.physicalPageCount} str.).`
        }
      };
    }
    normalizedPage = raw.pdfPageIndex;
  }

  if (typeof raw.noteText !== 'string' || raw.noteText.trim().length < 3) {
    return { rejection: { kind: 'workingNote', id, reason: 'Pusta lub zbyt krótka treść notatki roboczej.' } };
  }
  if (raw.noteText.trim().length > MAX_WORKING_NOTE_LENGTH) {
    return {
      rejection: { kind: 'workingNote', id, reason: `Notatka robocza przekracza limit ${MAX_WORKING_NOTE_LENGTH} znaków.` }
    };
  }

  if (!isValidDateString(raw.createdAt) || !isValidDateString(raw.updatedAt)) {
    return { rejection: { kind: 'workingNote', id, reason: 'Nieprawidłowa data utworzenia lub aktualizacji notatki.' } };
  }

  if (raw.isInformalWorkingNote !== true) {
    return {
      rejection: {
        kind: 'workingNote',
        id,
        reason: 'Zaimportowana notatka musi zachować flagę isInformalWorkingNote: true.'
      }
    };
  }

  return {
    note: {
      noteId: id,
      questionId: raw.questionId,
      documentId: doc ? doc.documentId : null,
      qrdSection: normalizedQrd,
      pdfPageIndex: normalizedPage,
      noteText: raw.noteText.trim(),
      createdAt: String(raw.createdAt).trim(),
      updatedAt: String(raw.updatedAt).trim(),
      authorLabel: LOCAL_WORKING_NOTE_AUTHOR,
      isInformalWorkingNote: true,
      disclaimerAcknowledged: true
    }
  };
}

/**
 * Bezpiecznie migruje dane MASTER 04 (lub B3) z localStorage bez utraty identyfikatorów,
 * pytań, notatek oraz wpisów roboczych, konwertując niesprawdzone wpisy do właściwych klas B3.
 */
export function migrateMaster04EvidenceStorage(
  storage: Storage | null,
  checklist: readonly Stage1HumanDecisionItem[],
  sources: readonly SourceRegistryEntry[],
  options: { persistIfMigrated?: boolean } = {}
): {
  entries: EvidenceLedgerEntry[];
  notes: InformalWorkingNote[];
  report: EvidenceLedgerMigrationReport;
  saveError: string | null;
} {
  const emptyReport: EvidenceLedgerMigrationReport = {
    migratedFromVersion: 'empty',
    preservedEntryIds: [],
    preservedNoteIds: [],
    downgradedToReferenceCount: 0,
    flaggedReverificationCount: 0
  };
  if (!storage) {
    return { entries: [], notes: [], report: emptyReport, saveError: null };
  }

  const rawEntriesText = storage.getItem(EVIDENCE_LEDGER_STORAGE_KEY);
  const rawNotesText = storage.getItem(WORKING_NOTES_STORAGE_KEY);
  const sourceMap = new Map(sources.map((s) => [s.documentId, s]));
  const questionIds = new Set(checklist.map((q) => q.id));

  let migratedFromVersion: EvidenceLedgerMigrationReport['migratedFromVersion'] = 'empty';
  const validEntries: EvidenceLedgerEntry[] = [];
  let downgradedCount = 0;
  let flaggedReverificationCount = 0;

  if (rawEntriesText) {
    try {
      const parsed: unknown = JSON.parse(rawEntriesText);
      if (Array.isArray(parsed) && !hasPrototypePollutionKey(parsed)) {
        const seenIds = new Set<string>();
        let hadB2Entry = false;
        let hadB3Entry = false;
        for (let i = 0; i < parsed.length; i += 1) {
          const rawItem = parsed[i];
          if (isPlainRecord(rawItem) && rawItem.qualificationClass === undefined) {
            hadB2Entry = true;
          } else if (isPlainRecord(rawItem)) {
            hadB3Entry = true;
          }
          const res = validateImportedEvidenceEntryObject(
            rawItem,
            i,
            sourceMap,
            questionIds,
            seenIds,
            { isLocalStorageMigration: true }
          );
          if (res.entry && res.entry.origin === 'auditor_working_entry') {
            if (isPlainRecord(rawItem) && rawItem.qualificationClass === undefined) {
              downgradedCount += 1;
            }
            if (res.entry.requiresReverification) {
              flaggedReverificationCount += 1;
            }
            validEntries.push(res.entry);
          }
        }
        migratedFromVersion = hadB2Entry ? 'b2_master04' : hadB3Entry ? 'b3_master05' : 'empty';
      }
    } catch {
      // Uszkodzony JSON w pamięci lokalnej zwraca pustą kolekcję bez awarii
    }
  }

  const validNotes: InformalWorkingNote[] = [];
  if (rawNotesText) {
    try {
      const parsed: unknown = JSON.parse(rawNotesText);
      if (Array.isArray(parsed) && !hasPrototypePollutionKey(parsed)) {
        const seenIds = new Set<string>();
        for (let i = 0; i < parsed.length; i += 1) {
          const res = validateImportedWorkingNoteObject(parsed[i], i, sourceMap, questionIds, seenIds);
          if (res.note) {
            validNotes.push(res.note);
          }
        }
      }
    } catch {
      // Ignoruj uszkodzony JSON notatek
    }
  }

  let saveError: string | null = null;
  if (options.persistIfMigrated && migratedFromVersion === 'b2_master04' && validEntries.length > 0) {
    const res = saveEvidenceAndNotesAtomically(storage, validEntries, validNotes);
    if (!res.success) {
      saveError = res.error;
    }
  }

  return {
    entries: validEntries,
    notes: validNotes,
    report: {
      migratedFromVersion,
      preservedEntryIds: validEntries.map((e) => e.evidenceId),
      preservedNoteIds: validNotes.map((n) => n.noteId),
      downgradedToReferenceCount: downgradedCount,
      flaggedReverificationCount
    },
    saveError
  };
}

export function loadWorkingEvidenceFromStorage(
  storage: Storage | null,
  checklist: readonly Stage1HumanDecisionItem[],
  sources: readonly SourceRegistryEntry[]
): EvidenceLedgerEntry[] {
  return migrateMaster04EvidenceStorage(storage, checklist, sources).entries;
}

export function saveWorkingEvidenceToStorage(
  storage: Storage | null,
  workingEntries: readonly EvidenceLedgerEntry[]
): EvidenceLedgerStorageSaveResult {
  if (!storage) {
    return { success: false, error: 'Brak dostępu do lokalnej pamięci przeglądarki (localStorage).' };
  }
  try {
    const workingOnly = workingEntries.filter((e) => e.origin === 'auditor_working_entry');
    storage.setItem(EVIDENCE_LEDGER_STORAGE_KEY, JSON.stringify(workingOnly));
    return { success: true, error: null };
  } catch (err) {
    const msg =
      err instanceof Error && (err.name === 'QuotaExceededError' || /quota/i.test(err.message))
        ? 'Przekroczono limit lokalnej pamięci przeglądarki (QuotaExceededError). Zrób eksport JSON i usuń starsze wpisy robocze.'
        : 'Nie udało się zapisać lokalnych dowodów roboczych w localStorage.';
    return { success: false, error: msg };
  }
}

export function loadWorkingNotesFromStorage(
  storage: Storage | null,
  checklist: readonly Stage1HumanDecisionItem[],
  sources: readonly SourceRegistryEntry[]
): InformalWorkingNote[] {
  if (!storage) {
    return [];
  }
  try {
    const rawText = storage.getItem(WORKING_NOTES_STORAGE_KEY);
    if (!rawText) {
      return [];
    }
    const parsed: unknown = JSON.parse(rawText);
    if (!Array.isArray(parsed) || hasPrototypePollutionKey(parsed)) {
      return [];
    }
    const sourceMap = new Map(sources.map((s) => [s.documentId, s]));
    const questionIds = new Set(checklist.map((q) => q.id));
    const seenIds = new Set<string>();
    const valid: InformalWorkingNote[] = [];
    for (let i = 0; i < parsed.length; i += 1) {
      const res = validateImportedWorkingNoteObject(parsed[i], i, sourceMap, questionIds, seenIds);
      if (res.note) {
        valid.push(res.note);
      }
    }
    return valid;
  } catch {
    return [];
  }
}

export function saveWorkingNotesToStorage(
  storage: Storage | null,
  notes: readonly InformalWorkingNote[]
): EvidenceLedgerStorageSaveResult {
  if (!storage) {
    return { success: false, error: 'Brak dostępu do lokalnej pamięci przeglądarki (localStorage).' };
  }
  try {
    storage.setItem(WORKING_NOTES_STORAGE_KEY, JSON.stringify(notes));
    return { success: true, error: null };
  } catch (err) {
    const msg =
      err instanceof Error && (err.name === 'QuotaExceededError' || /quota/i.test(err.message))
        ? 'Przekroczono limit lokalnej pamięci przeglądarki podczas zapisu notatki (QuotaExceededError).'
        : 'Nie udało się zapisać lokalnych notatek roboczych w localStorage.';
    return { success: false, error: msg };
  }
}

/**
 * Atomowy zapis wpisów dowodowych oraz notatek w localStorage z przywróceniem poprzedniego
 * stanu w razie błędu (np. QuotaExceededError podczas drugiego zapisu).
 */
export function saveEvidenceAndNotesAtomically(
  storage: Storage | null,
  workingEntries: readonly EvidenceLedgerEntry[],
  workingNotes: readonly InformalWorkingNote[]
): EvidenceLedgerStorageSaveResult {
  if (!storage) {
    return { success: false, error: 'Brak dostępu do lokalnej pamięci przeglądarki (localStorage).' };
  }
  const previousEntriesRaw = storage.getItem(EVIDENCE_LEDGER_STORAGE_KEY);
  const previousNotesRaw = storage.getItem(WORKING_NOTES_STORAGE_KEY);

  const entriesRes = saveWorkingEvidenceToStorage(storage, workingEntries);
  if (!entriesRes.success) {
    return { ...entriesRes, rolledBack: false };
  }

  const notesRes = saveWorkingNotesToStorage(storage, workingNotes);
  if (!notesRes.success) {
    try {
      if (previousEntriesRaw === null) {
        storage.removeItem(EVIDENCE_LEDGER_STORAGE_KEY);
      } else {
        storage.setItem(EVIDENCE_LEDGER_STORAGE_KEY, previousEntriesRaw);
      }
      if (previousNotesRaw === null) {
        storage.removeItem(WORKING_NOTES_STORAGE_KEY);
      } else {
        storage.setItem(WORKING_NOTES_STORAGE_KEY, previousNotesRaw);
      }
    } catch {
      // Jeśli wycofanie również napotka błąd storage, zwracamy informację o nieudanym zapisie
    }
    return {
      success: false,
      error: `${notesRes.error} Poprzedni stan wpisów w localStorage został bezpiecznie przywrócony.`,
      rolledBack: true
    };
  }

  return { success: true, error: null, rolledBack: false };
}

/**
 * Wykrywa zmianę artefaktu i klasyfikuje rodzaj zmiany zgodnie z zasadami wersjonowania Etapu B3.
 */
export function detectArtifactHashChange(
  source: SourceRegistryEntry,
  incoming: {
    sha256: string | null;
    fileName?: string | null;
    language?: 'PL' | 'EN';
    documentDate?: string | null;
    sourceUrl?: string;
    isHistoricalRejected?: boolean;
    unverifiedOrigin?: boolean;
  }
): {
  changed: boolean;
  changeCategory: ArtifactChangeCategory | 'no_change';
  reason: string;
} {
  if (incoming.unverifiedOrigin) {
    return {
      changed: true,
      changeCategory: 'unverified_origin_copy',
      reason: 'Kopia pochodzi z niezweryfikowanego źródła lub adresu.'
    };
  }
  if (incoming.isHistoricalRejected) {
    return {
      changed: true,
      changeCategory: 'historical_version',
      reason: 'Dokument oznaczono jako historyczną wersję z wcześniejszego sezonu.'
    };
  }
  if (incoming.language && incoming.language !== source.language) {
    return {
      changed: true,
      changeCategory: 'alternate_language_version',
      reason: `Odmienna wersja językowa (${incoming.language} vs ${source.language}) wymaga oddzielnego artefaktu.`
    };
  }
  const currentHash = source.currentArtifact?.hashProvenance.value?.toLowerCase() ?? source.sha256?.toLowerCase() ?? null;
  const incomingHash = incoming.sha256?.toLowerCase() ?? null;
  if (currentHash && incomingHash && currentHash !== incomingHash) {
    if (
      incoming.documentDate &&
      source.currentArtifact?.documentDate &&
      incoming.documentDate !== source.currentArtifact.documentDate
    ) {
      return {
        changed: true,
        changeCategory: 'new_chpl_revision',
        reason: `Wykryto nową rewizję ChPL (${incoming.documentDate} vs ${source.currentArtifact.documentDate}) oraz zmianę SHA-256.`
      };
    }
    if (
      incoming.fileName &&
      source.currentArtifact?.fileName &&
      incoming.fileName === source.currentArtifact.fileName
    ) {
      return {
        changed: true,
        changeCategory: 'same_filename_modified_bytes',
        reason: `Ta sama nazwa pliku („${incoming.fileName}”), ale inny skrót SHA-256 — zawartość bajtowa uległa zmianie.`
      };
    }
    return {
      changed: true,
      changeCategory: 'updated_same_document',
      reason: 'Zmiana sumy SHA-256 wskazuje na aktualizację pliku źródłowego.'
    };
  }
  return {
    changed: false,
    changeCategory: 'no_change',
    reason: 'Brak zmiany zawartości bajtowej względem bieżącego artefaktu.'
  };
}

/**
 * Rejestruje nową wersję artefaktu bez nadpisywania historii i automatycznie oznacza
 * powiązane wpisy dowodowe jako wymagające ponownej weryfikacji (bez przenoszenia statusu zweryfikowanego).
 */
export function registerNewDocumentArtifactVersion(params: {
  source: SourceRegistryEntry;
  entries: readonly EvidenceLedgerEntry[];
  newFile: {
    fileName: string | null;
    fileSizeBytes: number | null;
    physicalPageCount: number | null;
    documentDate: string | null;
    retrievedAt: string;
    sourceUrl: string;
    language: 'PL' | 'EN';
    sha256: string | null;
    acquiredLocally: boolean;
    unverifiedOrigin?: boolean;
  };
}): {
  updatedSource: SourceRegistryEntry;
  updatedEntries: EvidenceLedgerEntry[];
  detectedChange: ReturnType<typeof detectArtifactHashChange>;
} {
  const { source, entries, newFile } = params;
  const detectedChange = detectArtifactHashChange(source, {
    sha256: newFile.sha256,
    fileName: newFile.fileName,
    language: newFile.language,
    documentDate: newFile.documentDate,
    sourceUrl: newFile.sourceUrl,
    unverifiedOrigin: newFile.unverifiedOrigin
  });

  if (!detectedChange.changed && source.currentArtifact) {
    return {
      updatedSource: source,
      updatedEntries: [...entries],
      detectedChange
    };
  }

  const archivedHistory: DocumentArtifactRecord[] = source.artifactHistory.map((item) => ({
    ...item,
    isCurrentActiveVersion: false,
    isHistoricalVersion: true
  }));

  const nextSeq = archivedHistory.length + 1;
  const previousArtifactId = source.currentArtifact?.artifactId ?? null;
  const previousHash = source.currentArtifact?.hashProvenance.value ?? source.sha256;
  const newArtifactId = `art-${source.documentId}-v${nextSeq}`;

  const comparisonStatus: HashComparisonStatus = newFile.unverifiedOrigin
    ? 'hash_from_untrusted_source'
    : !newFile.sha256
      ? 'not_compared'
      : previousHash && newFile.sha256.toLowerCase() !== previousHash.toLowerCase()
        ? 'hash_mismatch'
        : previousHash
          ? 'compared_with_known_reference'
          : newFile.acquiredLocally
            ? 'calculated_from_local_file'
            : 'not_compared';

  const newArtifact: DocumentArtifactRecord = {
    artifactId: newArtifactId,
    documentId: source.documentId,
    language: newFile.language,
    fileName: newFile.fileName,
    documentDate: newFile.documentDate,
    retrievedAt: newFile.retrievedAt,
    sourceUrl: newFile.sourceUrl,
    previousArtifactId,
    versionSequence: nextSeq,
    changeCategory: detectedChange.changeCategory === 'no_change' ? 'updated_same_document' : detectedChange.changeCategory,
    isCurrentActiveVersion: true,
    isHistoricalVersion: false,
    requiresReverification: true,
    physicalPageCount: newFile.physicalPageCount,
    fileSizeBytes: newFile.fileSizeBytes,
    hashProvenance: {
      algorithm: 'SHA-256',
      value: newFile.sha256,
      artifactId: newArtifactId,
      calculatedAt: newFile.retrievedAt,
      calculationMethod: newFile.acquiredLocally
        ? 'Obliczono SHA-256 na podstawie lokalnego pliku dokumentu'
        : 'Obliczono SHA-256 dla nowej wersji źródła (bez lokalnego zapisu binarnego)',
      fileName: newFile.fileName,
      fileSizeBytes: newFile.fileSizeBytes,
      referenceType: previousHash ? 'prior_session_snapshot' : 'none',
      referenceHash: previousHash,
      comparisonStatus
    }
  };

  const nextStatusAxes: SourceStatusAxes = {
    originStatus: newFile.unverifiedOrigin ? 'origin_uncertain' : source.statusAxes.originStatus,
    acquisitionStatus: newFile.acquiredLocally ? 'acquired' : 'not_acquired',
    integrityStatus:
      comparisonStatus === 'hash_mismatch'
        ? 'hash_mismatch'
        : newFile.sha256
          ? 'hash_calculated'
          : 'not_checked',
    contentReviewStatus: 'awaiting_human_review',
    fileAvailability: newFile.acquiredLocally ? 'verified_in_session' : 'no_file',
    storageMode: newFile.acquiredLocally ? 'session_memory_only' : 'no_binary_file'
  };

  const updatedSource: SourceRegistryEntry = {
    ...source,
    retrievedAt: newFile.retrievedAt,
    revisionDate: newFile.documentDate ?? source.revisionDate,
    physicalPageCount: newFile.physicalPageCount,
    fileSizeBytes: newFile.fileSizeBytes,
    sha256: newFile.sha256,
    sha256Basis: newFile.acquiredLocally ? 'local_workspace_pdf_sha256' : source.sha256Basis,
    statusAxes: nextStatusAxes,
    currentArtifact: newArtifact,
    artifactHistory: [...archivedHistory, newArtifact],
    retrievalAttempts: [
      ...source.retrievalAttempts,
      {
        attemptId: `att-${source.documentId}-v${nextSeq}`,
        documentId: source.documentId,
        attemptedAt: newFile.retrievedAt,
        targetUrl: newFile.sourceUrl,
        accessMethod: newFile.acquiredLocally ? 'local_filesystem_read' : 'http_get',
        result: 'success',
        httpStatus: newFile.acquiredLocally ? null : 200,
        errorDescription: null,
        checkScope: `Zarejestrowano artefakt ${newArtifactId} (${detectedChange.reason})`,
        artifactId: newArtifactId
      }
    ]
  };

  // Kaskadowe oznaczenie powiązanych dowodów do ponownego sprawdzenia BEZ przenoszenia statusu zweryfikowanego i BEZ zamykania pytań
  const updatedEntries = entries.map((entry) => {
    if (entry.documentId !== source.documentId) {
      return entry;
    }
    let downgradedClass: EvidenceQualificationClass = entry.qualificationClass;
    if (entry.qualificationClass === 'source_excerpt_reviewed') {
      downgradedClass = 'source_excerpt_pending_review';
    } else if (entry.qualificationClass === 'conflicting_source_excerpt') {
      downgradedClass = 'conflicting_reference';
    }
    return {
      ...entry,
      qualificationClass: downgradedClass,
      requiresReverification: true,
      autoResolved: false as const
    };
  });

  return { updatedSource, updatedEntries, detectedChange };
}

export function buildEvidenceLedgerExportPayload(
  params: {
    sources: SourceRegistryEntry[];
    workingEntries: EvidenceLedgerEntry[];
    workingNotes: InformalWorkingNote[];
    baselineEntries?: EvidenceLedgerEntry[];
    includeBaselineExtracts?: boolean;
  },
  now: Date = new Date()
): EvidenceLedgerExportPayload {
  const entries = params.includeBaselineExtracts
    ? [...(params.baselineEntries ?? []), ...params.workingEntries]
    : [...params.workingEntries];

  return {
    vaxnurseEvidenceLedger: true,
    schemaVersion: EVIDENCE_LEDGER_SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    sourceRegistryVersion: SOURCE_REGISTRY_VERSION,
    containsPatientData: false,
    clinicalApprovalGranted: false,
    isWorkingDraft: true,
    disclaimer:
      'Odrębny eksport rejestru dowodów roboczych Etapu B3 (VaxNurse). Nie zastępuje kopii katalogu preparatów (vaxnurseBackup), nie zawiera danych pacjentów ani nie stanowi lokalnego potwierdzenia klinicznego dla importera.',
    sourceCount: params.sources.length,
    sources: [...params.sources],
    entries,
    workingNotes: [...params.workingNotes]
  };
}

export function parseAndPreviewEvidenceLedgerImport(
  rawJsonText: string,
  options: {
    sources: readonly SourceRegistryEntry[];
    checklist: readonly Stage1HumanDecisionItem[];
    existingWorkingEntries: readonly EvidenceLedgerEntry[];
    existingWorkingNotes: readonly InformalWorkingNote[];
  }
): EvidenceLedgerImportPreview {
  const emptyPreview = (
    errors: string[],
    rejectedItems: EvidenceLedgerImportRejectedItem[] = []
  ): EvidenceLedgerImportPreview => ({
    isValid: false,
    canImport: false,
    errors,
    warnings: [],
    validEntries: [],
    validNotes: [],
    newEntriesCount: 0,
    updatedEntriesCount: 0,
    skippedDuplicatesCount: 0,
    newNotesCount: 0,
    updatedNotesCount: 0,
    conflictsCount: 0,
    conflicts: [],
    requiresManualReviewCount: 0,
    importedVerificationClaimsCount: 0,
    missingDocumentsCount: 0,
    unknownSourceIds: [],
    rejectedItems,
    payloadMetadata: {
      schemaVersion: null,
      exportedAt: null,
      sourceRegistryVersion: null,
      sourceCount: 0
    }
  });

  if (!rawJsonText || !rawJsonText.trim()) {
    return emptyPreview(['Plik JSON jest pusty.']);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJsonText);
  } catch {
    return emptyPreview(['Nieprawidłowa składnia JSON w importowanym pliku dowodów.']);
  }

  if (hasPrototypePollutionKey(parsed)) {
    return emptyPreview([
      'Wykryto niedozwolone klucze prototypowe (__proto__, constructor, prototype). Import odrzucony.'
    ]);
  }

  if (!isPlainRecord(parsed)) {
    return emptyPreview(['Główna struktura JSON musi być obiektem rejestru dowodów VaxNurse.']);
  }

  if (parsed.vaxnurseBackup === true) {
    return emptyPreview([
      'Wybrany plik to ogólna kopia zapasowa katalogu preparatów (vaxnurseBackup). Użyj modułu Ustawienia do przywrócenia backupu aplikacji — ten importer obsługuje wyłącznie rejestr dowodów.'
    ]);
  }

  const errors: string[] = [];
  const warnings: string[] = [];
  const rejectedItems: EvidenceLedgerImportRejectedItem[] = [];
  const conflicts: EvidenceLedgerImportConflict[] = [];
  const unknownSourceIds = new Set<string>();
  let importedVerificationClaimsCount = 0;
  let missingDocumentsCount = 0;

  if (parsed.vaxnurseEvidenceLedger !== true) {
    errors.push('Brak znacznika schematu vaxnurseEvidenceLedger: true.');
  }

  if (
    typeof parsed.schemaVersion !== 'string' ||
    !SUPPORTED_EVIDENCE_LEDGER_SCHEMA_VERSIONS.includes(parsed.schemaVersion)
  ) {
    errors.push(
      `Nieobsługiwana lub brakująca wersja schematu dowodów (${String(parsed.schemaVersion)}; oczekiwano ${SUPPORTED_EVIDENCE_LEDGER_SCHEMA_VERSIONS.join(' lub ')}).`
    );
  }

  if (parsed.containsPatientData !== false) {
    errors.push('Odrzucono import: pole containsPatientData musi mieć wartość false.');
  }

  if (parsed.clinicalApprovalGranted !== false) {
    errors.push(
      'Naruszenie niezmiennika klinicznego: pole clinicalApprovalGranted musi mieć wartość false.'
    );
  }

  if (!isValidDateString(parsed.exportedAt)) {
    errors.push('Brak lub nieprawidłowy znacznik czasu exportedAt.');
  }

  if (!Array.isArray(parsed.entries)) {
    errors.push('Brak tablicy entries w pliku rejestru dowodów.');
  }

  if (parsed.workingNotes !== undefined && !Array.isArray(parsed.workingNotes)) {
    errors.push('Pole workingNotes musi być tablicą (lub nie występować).');
  }

  if (errors.length > 0) {
    return emptyPreview(errors);
  }

  const sourceMap = new Map(options.sources.map((s) => [s.documentId, s]));
  const questionIds = new Set(options.checklist.map((q) => q.id));

  // Inspekcja opcjonalnej deklaracji źródeł z zewnętrznego pliku JSON (bez nadpisywania lokalnego rejestru!)
  if (Array.isArray(parsed.sources)) {
    for (const rawSource of parsed.sources as unknown[]) {
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
          details: `Importowany plik wymienia nieznane źródło ${docId}, którego nie ma w lokalnym Rejestrze Źródeł.`
        });
        continue;
      }

      if (typeof rawSource.sha256 === 'string' && localSource.sha256) {
        if (rawSource.sha256.trim().toLowerCase() !== localSource.sha256.toLowerCase()) {
          conflicts.push({
            kind: 'hash_mismatch_with_local_registry',
            id: docId,
            details: `Niezgodność SHA-256 w sekcji sources dla ${docId} między plikiem importu a lokalnym rejestrem.`
          });
          rejectedItems.push({
            kind: 'sourceClaim',
            id: docId,
            reason: `Fałszywy lub rozbieżny SHA-256 dla źródła ${docId} w importowanym JSON.`
          });
        }
      }

      const incomingStatusAxes = isPlainRecord(rawSource.statusAxes) ? rawSource.statusAxes : null;
      const claimsMoreConfirmedStatus =
        rawSource.sourceVerificationStatus === 'official_source_confirmed' &&
        localSource.sourceVerificationStatus !== 'official_source_confirmed';
      const claimsMoreConfirmedOriginAxis =
        incomingStatusAxes?.originStatus === 'official_origin_confirmed' &&
        localSource.statusAxes.originStatus !== 'official_origin_confirmed';

      if (claimsMoreConfirmedStatus || claimsMoreConfirmedOriginAxis) {
        importedVerificationClaimsCount += 1;
        warnings.push(
          `Importowana deklaracja potwierdzonego pochodzenia dla „${docId}” pochodzi wyłącznie z zewnętrznego JSON i NIE zastępuje lokalnej kontroli.`
        );
      }

      if (localSource.statusAxes.acquisitionStatus !== 'acquired') {
        missingDocumentsCount += 1;
      }
    }
  }

  const seenEntryIds = new Set<string>();
  const seenNoteIds = new Set<string>();
  const rawEntries = parsed.entries as unknown[];
  const validEntries: EvidenceLedgerEntry[] = [];
  let skippedBaselineCount = 0;

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
      if (res.rejection.reason.includes('Nieznany documentId')) {
        const rawRec = rawEntries[i];
        if (isPlainRecord(rawRec) && typeof rawRec.documentId === 'string') {
          unknownSourceIds.add(rawRec.documentId);
        }
      }
    } else if (res.entry) {
      if (res.versionMismatchConflict) {
        conflicts.push(res.versionMismatchConflict);
      }
      if (res.entry.origin === 'bundle_extract') {
        skippedBaselineCount += 1;
      } else {
        if (res.importedVerificationClaim) {
          importedVerificationClaimsCount += 1;
        }
        const localSource = sourceMap.get(res.entry.documentId);
        if (localSource && localSource.statusAxes.acquisitionStatus !== 'acquired' && !Array.isArray(parsed.sources)) {
          missingDocumentsCount += 1;
        }
        validEntries.push(res.entry);
      }
    }
  }

  const rawNotes = Array.isArray(parsed.workingNotes) ? (parsed.workingNotes as unknown[]) : [];
  const validNotes: InformalWorkingNote[] = [];
  for (let i = 0; i < rawNotes.length; i += 1) {
    const res = validateImportedWorkingNoteObject(
      rawNotes[i],
      i,
      sourceMap,
      questionIds,
      seenNoteIds
    );
    if (res.rejection) {
      rejectedItems.push(res.rejection);
    } else if (res.note) {
      validNotes.push(res.note);
    }
  }

  if (skippedBaselineCount > 0) {
    warnings.push(
      `Pominięto ${skippedBaselineCount} niemodyfikowalnych wpisów bazowych Etapu I (pochodzą z kodu aplikacji).`
    );
  }

  if (importedVerificationClaimsCount > 0) {
    warnings.push(
      `Wykryto ${importedVerificationClaimsCount} deklaracji weryfikacji pochodzących z importu JSON (np. source_excerpt_reviewed / official_origin_confirmed). Zostały one automatycznie oznaczone jako niezweryfikowane lokalnie (source_excerpt_pending_review) i wymagają ręcznego potwierdzenia w tej sesji.`
    );
  }

  if (rejectedItems.length > 0) {
    errors.push(
      `Wykryto ${rejectedItems.length} nieprawidłowych lub zmodyfikowanych wpisów w imporcie. Zastosowanie pliku jest zablokowane.`
    );
  }

  const existingEntryMap = new Map(options.existingWorkingEntries.map((e) => [e.evidenceId, e]));
  let newEntriesCount = 0;
  let updatedEntriesCount = 0;
  let skippedDuplicatesCount = 0;

  for (const e of validEntries) {
    const prev = existingEntryMap.get(e.evidenceId);
    if (!prev) {
      newEntriesCount += 1;
    } else if (
      prev.clinicalObservation === e.clinicalObservation &&
      prev.sourceExcerptRef === e.sourceExcerptRef &&
      prev.relationship === e.relationship &&
      prev.reviewStatus === e.reviewStatus &&
      prev.qualificationClass === e.qualificationClass
    ) {
      skippedDuplicatesCount += 1;
    } else {
      updatedEntriesCount += 1;
      conflicts.push({
        kind: 'id_collision_different_content',
        id: e.evidenceId,
        details: `Kolizja evidenceId „${e.evidenceId}”: treść lub status w pliku importu różni się od lokalnego wpisu.`
      });
    }
  }

  const existingNoteMap = new Map(options.existingWorkingNotes.map((n) => [n.noteId, n]));
  let newNotesCount = 0;
  let updatedNotesCount = 0;
  for (const n of validNotes) {
    if (!existingNoteMap.has(n.noteId)) {
      newNotesCount += 1;
    } else {
      updatedNotesCount += 1;
    }
  }

  const requiresManualReviewCount = validEntries.filter(
    (e) =>
      e.requiresReverification ||
      e.qualificationClass === 'source_excerpt_pending_review' ||
      e.qualificationClass === 'traceability_reference' ||
      e.importProvenance?.localConfirmationState === 'unconfirmed_imported_claim'
  ).length;

  warnings.push(
    'Import dotyczy wyłącznie lokalnego rejestru dowodów i notatek roboczych. Katalog VACCINES_CATALOG, blokada Infanrix hexa oraz autoResolved: false pozostają nienaruszone.'
  );

  return {
    isValid: errors.length === 0,
    canImport: errors.length === 0,
    errors,
    warnings,
    validEntries,
    validNotes,
    newEntriesCount,
    updatedEntriesCount,
    skippedDuplicatesCount,
    newNotesCount,
    updatedNotesCount,
    conflictsCount: conflicts.length,
    conflicts,
    requiresManualReviewCount,
    importedVerificationClaimsCount,
    missingDocumentsCount,
    unknownSourceIds: Array.from(unknownSourceIds),
    rejectedItems,
    payloadMetadata: {
      schemaVersion: typeof parsed.schemaVersion === 'string' ? parsed.schemaVersion : null,
      exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : null,
      sourceRegistryVersion:
        typeof parsed.sourceRegistryVersion === 'string' ? parsed.sourceRegistryVersion : null,
      sourceCount: typeof parsed.sourceCount === 'number' ? parsed.sourceCount : 0
    }
  };
}

export function applyPreviewedEvidenceLedgerImport(
  preview: EvidenceLedgerImportPreview,
  existingWorkingEntries: readonly EvidenceLedgerEntry[],
  existingWorkingNotes: readonly InformalWorkingNote[],
  now: Date = new Date()
): {
  mergedEntries: EvidenceLedgerEntry[];
  mergedNotes: InformalWorkingNote[];
} {
  if (!preview.canImport) {
    throw new Error('Nie można zastosować importu zawierającego błędy walidacji.');
  }

  const importedAt = now.toISOString();
  const entryMap = new Map(existingWorkingEntries.map((e) => [e.evidenceId, e]));
  for (const entry of preview.validEntries) {
    let safeQualification: EvidenceQualificationClass = entry.qualificationClass;
    if (entry.qualificationClass === 'source_excerpt_reviewed') {
      safeQualification = 'source_excerpt_pending_review';
    } else if (entry.qualificationClass === 'conflicting_source_excerpt') {
      safeQualification = 'conflicting_reference';
    }
    entryMap.set(entry.evidenceId, {
      ...entry,
      qualificationClass: safeQualification,
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
        migrationSourceVersion: null
      }
    });
  }

  const noteMap = new Map(existingWorkingNotes.map((n) => [n.noteId, n]));
  for (const note of preview.validNotes) {
    noteMap.set(note.noteId, { ...note, isInformalWorkingNote: true, disclaimerAcknowledged: true });
  }

  return {
    mergedEntries: Array.from(entryMap.values()),
    mergedNotes: Array.from(noteMap.values())
  };
}

/**
 * Dynamicznie wylicza 12 metryk raportu jakości źródeł i dowodów (Quality Dashboard — Etap B3).
 * Nigdy nie traktuje wpisu rejestrowego ani błędu endpointu jako pozyskanego PDF,
 * ani odniesienia lub niepotwierdzonego importu jako zweryfikowanego fragmentu.
 */
export function computeSourceQualityMetrics(params: {
  sources: readonly SourceRegistryEntry[];
  allEntries: readonly EvidenceLedgerEntry[];
  checklist: readonly Stage1HumanDecisionItem[];
}): SourceQualityMetrics {
  const { sources, allEntries, checklist } = params;

  const acquiredDocumentsCount = sources.filter(
    (s) => s.statusAxes.acquisitionStatus === 'acquired'
  ).length;

  const registryEntriesWithoutPdfCount = sources.filter(
    (s) =>
      s.objectType === 'official_registry_record' &&
      s.statusAxes.acquisitionStatus !== 'acquired'
  ).length;

  const failedRetrievalAttemptsCount = sources.reduce(
    (acc, s) =>
      acc +
      s.retrievalAttempts.filter(
        (attempt) => attempt.result === 'http_error' || attempt.result === 'network_error'
      ).length,
    0
  );

  const historicalDocumentsCount = sources.filter(
    (s) => s.objectType === 'historical_document' || Boolean(s.isHistoricalRejectedForCurrentSeason)
  ).length;

  const documentsWithoutSha256Count = sources.filter((s) => !s.sha256).length;
  const documentsWithCalculatedSha256Count = sources.filter((s) => Boolean(s.sha256)).length;
  const documentsWithComparedHashCount = sources.filter(
    (s) => s.statusAxes.integrityStatus === 'hash_matches_known_reference'
  ).length;
  const referenceHashesWithoutLocalFileCount = sources.filter(
    (s) => s.statusAxes.integrityStatus === 'reference_hash_recorded_no_local_file'
  ).length;
  const sessionVerifiedPdfCount = sources.filter(
    (s) => s.statusAxes.fileAvailability === 'verified_in_session'
  ).length;
  const reloadRequiredPdfCount = sources.filter(
    (s) =>
      Boolean(s.hasPersistedLocalArtifactMetadata) &&
      s.statusAxes.fileAvailability === 'metadata_only_reload_required'
  ).length;

  const isLocallyVerifiedExcerpt = (entry: EvidenceLedgerEntry): boolean =>
    entry.qualificationClass === 'source_excerpt_reviewed' &&
    entry.origin === 'auditor_working_entry' &&
    entry.importProvenance?.localConfirmationState !== 'unconfirmed_imported_claim';

  const referencesRequiringReviewCount = allEntries.filter(
    (e) =>
      e.qualificationClass === 'traceability_reference' ||
      e.qualificationClass === 'source_excerpt_pending_review' ||
      e.requiresReverification
  ).length;

  const verifiedExcerptsCount = allEntries.filter(isLocallyVerifiedExcerpt).length;

  const conflictingReferencesCount = allEntries.filter(
    (e) => e.qualificationClass === 'conflicting_reference'
  ).length;

  const conflictingExcerptsCount = allEntries.filter(
    (e) => e.qualificationClass === 'conflicting_source_excerpt'
  ).length;

  const reverificationRequiredCount =
    allEntries.filter(
      (e) => e.origin === 'auditor_working_entry' && Boolean(e.requiresReverification)
    ).length +
    sources.filter(
      (s) =>
        !s.isHistoricalRejectedForCurrentSeason &&
        Boolean(s.currentArtifact?.reverificationRequired)
    ).length;

  const questionsWithoutConfirmedExcerptsCount = checklist.filter(
    (q) => !allEntries.some((e) => e.questionId === q.id && isLocallyVerifiedExcerpt(e))
  ).length;

  const importedUnconfirmedClaimsCount = allEntries.filter(
    (e) =>
      Boolean(e.importProvenance?.isImported) &&
      e.importProvenance?.localConfirmationState === 'unconfirmed_imported_claim'
  ).length;

  return {
    totalSourceRecords: sources.length,
    acquiredDocumentsCount,
    registryEntriesWithoutPdfCount,
    failedRetrievalAttemptsCount,
    historicalDocumentsCount,
    documentsWithoutSha256Count,
    documentsWithCalculatedSha256Count,
    documentsWithComparedHashCount,
    referenceHashesWithoutLocalFileCount,
    sessionVerifiedPdfCount,
    reloadRequiredPdfCount,
    referencesRequiringReviewCount,
    verifiedExcerptsCount,
    conflictingReferencesCount,
    conflictingExcerptsCount,
    reverificationRequiredCount,
    questionsWithoutConfirmedExcerptsCount,
    importedUnconfirmedClaimsCount,
    disclaimer: SOURCE_QUALITY_DISCLAIMER
  };
}

export function filterEvidenceLedgerEntries(
  entries: readonly EvidenceLedgerEntry[],
  filters: EvidenceTraceabilityFilters
): EvidenceLedgerEntry[] {
  const q = filters.searchQuery.trim().toLowerCase();
  return entries.filter((entry) => {
    if (filters.questionId !== 'all' && entry.questionId !== filters.questionId) {
      return false;
    }
    if (filters.documentId !== 'all' && entry.documentId !== filters.documentId) {
      return false;
    }
    if (filters.productKey !== 'all' && entry.productKey !== filters.productKey) {
      return false;
    }
    if (filters.qrdSection !== 'all' && entry.location.qrdSection !== filters.qrdSection) {
      return false;
    }
    if (filters.relationship !== 'all' && entry.relationship !== filters.relationship) {
      return false;
    }
    if (
      filters.qualificationClass &&
      filters.qualificationClass !== 'all' &&
      entry.qualificationClass !== filters.qualificationClass
    ) {
      return false;
    }
    if (filters.reviewStatus !== 'all' && entry.reviewStatus !== filters.reviewStatus) {
      return false;
    }
    if (filters.origin !== 'all' && entry.origin !== filters.origin) {
      return false;
    }
    if (q) {
      const haystack = [
        entry.questionId,
        entry.documentId,
        entry.documentTitle,
        entry.productLabel,
        entry.location.qrdSection,
        entry.location.qrdSectionTitle,
        entry.location.pdfPageRangeLabel,
        entry.sourceExcerptRef,
        entry.clinicalObservation
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) {
        return false;
      }
    }
    return true;
  });
}

export function buildQuestionTraceabilitySummaries(
  checklist: readonly Stage1HumanDecisionItem[],
  allEntries: readonly EvidenceLedgerEntry[],
  workingNotes: readonly InformalWorkingNote[]
): QuestionTraceabilitySummary[] {
  return checklist.map((q) => {
    const entriesForQ = allEntries.filter((e) => e.questionId === q.id);
    const notesForQ = workingNotes.filter((n) => n.questionId === q.id);
    const workingEvidenceCount = entriesForQ.filter((e) => e.origin === 'auditor_working_entry').length;
    const bundleExtractCount = entriesForQ.filter((e) => e.origin === 'bundle_extract').length;
    const verifiedExcerptsCount = entriesForQ.filter(
      (e) =>
        e.qualificationClass === 'source_excerpt_reviewed' &&
        e.origin === 'auditor_working_entry' &&
        e.importProvenance?.localConfirmationState !== 'unconfirmed_imported_claim'
    ).length;
    const pendingReviewCount = entriesForQ.filter(
      (e) =>
        e.qualificationClass === 'traceability_reference' ||
        e.qualificationClass === 'source_excerpt_pending_review' ||
        e.requiresReverification
    ).length;
    const conflictingReferencesCount = entriesForQ.filter(
      (e) => e.qualificationClass === 'conflicting_reference'
    ).length;
    const conflictingExcerptsCount = entriesForQ.filter(
      (e) => e.qualificationClass === 'conflicting_source_excerpt'
    ).length;

    const relationshipsCount: Record<EvidenceRelationship, number> = {
      supports: 0,
      contradicts: 0,
      contextualizes: 0,
      does_not_resolve: 0,
      missing_information: 0
    };
    const docIds = new Set<string>();

    for (const e of entriesForQ) {
      relationshipsCount[e.relationship] += 1;
      docIds.add(e.documentId);
    }

    let workStatus: QuestionWorkStatus = 'open';
    if (
      relationshipsCount.contradicts > 0 ||
      conflictingExcerptsCount > 0 ||
      conflictingReferencesCount > 0
    ) {
      workStatus = 'conflicting_evidence';
    } else if (relationshipsCount.missing_information > 0) {
      workStatus = 'requires_authority_clarification';
    } else if (workingEvidenceCount > 0) {
      workStatus = 'evidence_collected';
    } else if (bundleExtractCount > 0) {
      workStatus = 'awaiting_human_review';
    } else if (docIds.size > 0) {
      workStatus = 'source_identified';
    }

    return {
      questionId: q.id,
      productKey: q.productKey,
      chplSectionOrSubpoint: q.chplSectionOrSubpoint,
      clinicalQuestion: q.clinicalQuestion,
      ambiguitySummary: q.ambiguitySummary,
      autoResolved: false,
      workStatus,
      bundleExtractCount,
      workingEvidenceCount,
      totalEvidenceCount: entriesForQ.length,
      verifiedExcerptsCount,
      pendingReviewCount,
      conflictingReferencesCount,
      conflictingExcerptsCount,
      workingNotesCount: notesForQ.length,
      relationshipsCount,
      linkedDocumentIds: Array.from(docIds)
    };
  });
}

// ============================================================================
// Etap B4: Sesja lokalnego PDF, rejestracja wersji artefaktów i bezpieczne przechowywanie wyłącznie metadanych
// ============================================================================

export interface RegisterLocalPdfSessionInput {
  documentId: string;
  verificationSessionId: string;
  fileName: string;
  mimeType: string | null;
  fileSizeBytes: number;
  sha256Hex: string | null;
  comparisonStatus: HashComparisonStatus;
  integrityStatus: FileIntegrityAxisStatus;
  referenceType: HashProvenanceRecord['referenceType'];
  referenceHash: string | null;
  referenceOriginNote?: string | null;
  pageCount: number | null;
  pdfParserVersion: string;
  metadataStatus: LocalPdfMetadataStatus;
  textLayerStatus: LocalPdfTextLayerStatus;
  pdfMetadata: LocalPdfMetadataSummary | null;
  operatorDeclaredOrigin: string | null;
  now?: Date;
}

export function registerLocalPdfInspectionSession(params: {
  sources: readonly SourceRegistryEntry[];
  entries: readonly EvidenceLedgerEntry[];
  inspection: RegisterLocalPdfSessionInput;
}): {
  updatedSources: SourceRegistryEntry[];
  updatedEntries: EvidenceLedgerEntry[];
  updatedSource: SourceRegistryEntry;
  versionCreated: boolean;
  reverificationTriggered: boolean;
  pageCountComparisonStatus: LocalPdfPageCountComparisonStatus;
} {
  const { sources, entries, inspection } = params;
  const source = sources.find((s) => s.documentId === inspection.documentId);
  if (!source) {
    throw new Error(`Nieznany dokument źródłowy w rejestrze: ${inspection.documentId}`);
  }

  const now = inspection.now ?? new Date();
  const iso = now.toISOString();
  const existingArtifact = source.currentArtifact;
  const previousHash = existingArtifact?.hashProvenance.value ?? source.sha256 ?? null;
  const normalizedIncoming = inspection.sha256Hex?.toLowerCase() ?? null;
  const normalizedPrevious = previousHash?.toLowerCase() ?? null;

  const registryExpectedPages =
    source.registryReferencePageCount !== undefined
      ? source.registryReferencePageCount
      : source.physicalPageCount;

  const pageCountComparisonStatus: LocalPdfPageCountComparisonStatus =
    registryExpectedPages !== null && inspection.pageCount !== null
      ? registryExpectedPages === inspection.pageCount
        ? 'matches'
        : 'mismatch'
      : 'not_available';

  // Jeśli istnieje już lokalny artefakt o identycznym SHA-256 -> nie twórz duplikatu wersji ani nie degraduj dowodów!
  // Również jeśli Stage 1 wzorzec pasuje bajtowo 1:1 do otwartego PDF -> zachowaj v1 wzbogaconą o lokalną sesję.
  const sameHashAsActive =
    Boolean(normalizedIncoming) &&
    Boolean(normalizedPrevious) &&
    normalizedIncoming === normalizedPrevious &&
    existingArtifact !== null;

  const effectiveComparisonStatus: HashComparisonStatus =
    normalizedIncoming && normalizedPrevious && !sameHashAsActive
      ? 'hash_mismatch'
      : inspection.comparisonStatus;

  const effectiveIntegrityStatus: FileIntegrityAxisStatus =
    effectiveComparisonStatus === 'hash_mismatch'
      ? 'hash_mismatch'
      : inspection.integrityStatus;

  // Czy nastąpiła rzeczywista zmiana względem aktywnego wcześniej lokalnego pliku lub wzorca?
  const hashChanged = Boolean(
    normalizedIncoming &&
      normalizedPrevious &&
      normalizedIncoming !== normalizedPrevious
  );

  // Degraduj istniejące wpisy robocze tylko wtedy, gdy istnieje wcześniejszy lokalnie zweryfikowany wpis
  // lub zmienił się hash aktywnego artefaktu (np. v2 -> v3).
  const reverificationTriggered =
    hashChanged &&
    entries.some(
      (e) =>
        e.documentId === source.documentId &&
        e.origin === 'auditor_working_entry'
    );

  let updatedArtifact: DocumentArtifactRecord;
  let updatedHistory: DocumentArtifactRecord[];
  let versionCreated = false;

  if (sameHashAsActive && existingArtifact) {
    updatedArtifact = {
      ...existingArtifact,
      localArtifactId:
        existingArtifact.localArtifactId ??
        `local-${source.documentId}-v${existingArtifact.versionSequence}`,
      fileName: inspection.fileName,
      fileSizeBytes: inspection.fileSizeBytes,
      physicalPageCount: inspection.pageCount ?? existingArtifact.physicalPageCount,
      mimeType: inspection.mimeType,
      selectedInSessionAt: iso,
      pdfParserVersion: inspection.pdfParserVersion,
      metadataExtractionStatus: inspection.metadataStatus,
      textExtractionStatus: inspection.textLayerStatus,
      localPreviewStatus: 'previewed_in_session',
      operatorDeclaredOrigin: inspection.operatorDeclaredOrigin,
      pdfMetadata: inspection.pdfMetadata,
      hashProvenance: {
        ...existingArtifact.hashProvenance,
        fileName: inspection.fileName,
        fileSizeBytes: inspection.fileSizeBytes,
        mimeType: inspection.mimeType,
        pdfPageCount: inspection.pageCount,
        verificationSessionId: inspection.verificationSessionId,
        comparisonStatus:
          inspection.comparisonStatus === 'hash_mismatch'
            ? existingArtifact.hashProvenance.comparisonStatus
            : inspection.comparisonStatus
      }
    };
    updatedHistory = source.artifactHistory.map((item) =>
      item.artifactId === updatedArtifact.artifactId ? updatedArtifact : item
    );
  } else {
    const nextSeq = (source.artifactHistory[source.artifactHistory.length - 1]?.versionSequence ?? 0) + 1;
    const newArtifactId = `art-${source.documentId}-v${nextSeq}`;
    const archivedHistory = source.artifactHistory.map((item) => ({
      ...item,
      isCurrentActiveVersion: false,
      isHistoricalVersion: true
    }));

    updatedArtifact = {
      artifactId: newArtifactId,
      localArtifactId: `local-${source.documentId}-v${nextSeq}`,
      documentId: source.documentId,
      language: source.language,
      fileName: inspection.fileName,
      documentDate: source.revisionDate,
      retrievedAt: iso,
      sourceUrl: source.officialSourceUrl,
      previousArtifactId: existingArtifact?.artifactId ?? null,
      versionSequence: nextSeq,
      changeCategory: hashChanged
        ? inspection.operatorDeclaredOrigin &&
          source.statusAxes.originStatus !== 'official_origin_confirmed'
          ? 'unverified_origin_copy'
          : existingArtifact?.fileName === inspection.fileName
            ? 'same_filename_modified_bytes'
            : 'new_chpl_revision'
        : 'updated_same_document',
      isCurrentActiveVersion: true,
      isHistoricalVersion: Boolean(source.isHistoricalRejectedForCurrentSeason),
      requiresReverification: hashChanged || !inspection.referenceHash,
      reverificationRequired: reverificationTriggered,
      physicalPageCount: inspection.pageCount,
      fileSizeBytes: inspection.fileSizeBytes,
      mimeType: inspection.mimeType,
      selectedInSessionAt: iso,
      pdfParserVersion: inspection.pdfParserVersion,
      metadataExtractionStatus: inspection.metadataStatus,
      textExtractionStatus: inspection.textLayerStatus,
      localPreviewStatus: 'previewed_in_session',
      operatorDeclaredOrigin: inspection.operatorDeclaredOrigin,
      pdfMetadata: inspection.pdfMetadata,
      hashProvenance: {
        algorithm: 'SHA-256',
        value: inspection.sha256Hex,
        artifactId: newArtifactId,
        calculatedAt: iso,
        calculationMethod:
          'Web Crypto API (crypto.subtle.digest SHA-256) na pełnych bajtach pliku wybranego lokalnie w przeglądarce',
        fileName: inspection.fileName,
        fileSizeBytes: inspection.fileSizeBytes,
        referenceType: normalizedPrevious ? 'prior_session_snapshot' : inspection.referenceType,
        referenceHash: previousHash ?? inspection.referenceHash,
        comparisonStatus: effectiveComparisonStatus,
        mimeType: inspection.mimeType,
        pdfPageCount: inspection.pageCount,
        verificationSessionId: inspection.verificationSessionId,
        referenceOriginNote: inspection.referenceOriginNote ?? null
      }
    };
    updatedHistory = [...archivedHistory, updatedArtifact];
    versionCreated = true;
  }

  const nextOriginStatus: SourceOriginAxisStatus =
    source.statusAxes.originStatus === 'official_origin_confirmed' &&
    effectiveIntegrityStatus === 'hash_matches_known_reference'
      ? 'official_origin_confirmed'
      : source.statusAxes.originStatus === 'official_origin_confirmed' &&
          (effectiveIntegrityStatus === 'hash_mismatch' || !inspection.referenceHash)
        ? 'manual_review_required'
        : source.statusAxes.originStatus;

  const updatedSource: SourceRegistryEntry = {
    ...source,
    retrievedAt: iso,
    physicalPageCount: inspection.pageCount ?? source.physicalPageCount,
    activeSessionPageCount: inspection.pageCount,
    registryReferencePageCount: registryExpectedPages,
    pageCountComparisonStatus,
    sessionFileName: inspection.fileName,
    hasPersistedLocalArtifactMetadata: true,
    fileSizeBytes: inspection.fileSizeBytes,
    sha256: inspection.sha256Hex ?? source.sha256,
    sha256Basis:
      effectiveIntegrityStatus === 'hash_matches_known_reference'
        ? 'local_workspace_pdf_sha256'
        : 'not_verified_binary',
    sha256ScopeLabel:
      effectiveIntegrityStatus === 'hash_matches_known_reference'
        ? 'SHA-256 lokalnego pliku PDF z sesji zgodny z referencyjnym skrótem rejestrowym (brak wysyłki sieciowej)'
        : effectiveIntegrityStatus === 'hash_mismatch'
          ? 'Rozbieżność SHA-256 lokalnego pliku PDF względem wcześniejszego wzorca — poprzednie dowody wymagają re-weryfikacji'
          : 'SHA-256 obliczony lokalnie z pliku PDF w przeglądarce (brak wiarygodnego wzorca urzędowego)',
    statusAxes: {
      originStatus: nextOriginStatus,
      acquisitionStatus: source.isHistoricalRejectedForCurrentSeason
        ? 'historical_copy_only'
        : source.statusAxes.acquisitionStatus === 'acquired'
          ? 'acquired'
          : 'session_local_file_selected',
      integrityStatus: effectiveIntegrityStatus,
      contentReviewStatus: reverificationTriggered
        ? 'awaiting_human_review'
        : source.statusAxes.contentReviewStatus,
      fileAvailability: 'verified_in_session',
      storageMode: 'session_memory_only'
    },
    currentArtifact: updatedArtifact,
    artifactHistory: updatedHistory
  };

  const updatedEntries = hashChanged
    ? entries.map((entry) => {
        if (entry.documentId !== source.documentId || entry.origin !== 'auditor_working_entry') {
          return entry;
        }
        let downgraded: EvidenceQualificationClass = entry.qualificationClass;
        if (entry.qualificationClass === 'source_excerpt_reviewed') {
          downgraded = 'source_excerpt_pending_review';
        } else if (entry.qualificationClass === 'conflicting_source_excerpt') {
          downgraded = 'conflicting_reference';
        }
        return {
          ...entry,
          qualificationClass: downgraded,
          requiresReverification: true,
          autoResolved: false as const
        };
      })
    : [...entries];

  const updatedSources = sources.map((item) =>
    item.documentId === source.documentId ? updatedSource : item
  );

  return {
    updatedSources,
    updatedEntries,
    updatedSource,
    versionCreated,
    reverificationTriggered,
    pageCountComparisonStatus
  };
}

function sanitizeStoredArtifactRecord(raw: unknown): DocumentArtifactRecord | null {
  if (!isPlainRecord(raw) || hasPrototypePollutionKey(raw)) {
    return null;
  }
  if (typeof raw.artifactId !== 'string' || typeof raw.documentId !== 'string') {
    return null;
  }
  // Bezpieczeństwo: nigdy nie przechowuj bajtów PDF / base64 w rekordach artefaktów
  for (const forbidden of ['bytes', 'data', 'base64', 'pdfData', 'arrayBuffer', 'rawPdf', 'rawText']) {
    if (forbidden in raw) {
      return null;
    }
  }
  if (!isPlainRecord(raw.hashProvenance) || hasPrototypePollutionKey(raw.hashProvenance)) {
    return null;
  }
  const cloned = raw as unknown as DocumentArtifactRecord;
  return {
    ...cloned,
    localPreviewStatus:
      cloned.localArtifactId || cloned.localPreviewStatus === 'previewed_in_session'
        ? 'reselection_required_after_reload'
        : cloned.localPreviewStatus
  };
}

export function saveLocalSourceArtifactsToStorage(
  storage: Storage | null,
  sources: readonly SourceRegistryEntry[],
  now: Date = new Date()
): EvidenceLedgerStorageSaveResult {
  if (!storage) {
    return { success: false, error: 'Brak dostępu do lokalnej pamięci przeglądarki (localStorage).' };
  }
  try {
    const items: PersistedLocalSourceArtifactEntry[] = sources
      .filter((s) => Boolean(s.hasPersistedLocalArtifactMetadata))
      .map((s) => ({
        documentId: s.documentId,
        currentArtifact: s.currentArtifact
          ? {
              ...s.currentArtifact,
              localPreviewStatus: 'reselection_required_after_reload'
            }
          : null,
        artifactHistory: s.artifactHistory.map((item) => ({
          ...item,
          localPreviewStatus:
            item.localArtifactId || item.localPreviewStatus === 'previewed_in_session'
              ? 'reselection_required_after_reload'
              : item.localPreviewStatus
        })),
        sha256: s.sha256,
        sha256Basis: s.sha256Basis,
        sha256ScopeLabel: s.sha256ScopeLabel,
        physicalPageCount: s.physicalPageCount,
        registryReferencePageCount: s.registryReferencePageCount ?? null,
        pageCountComparisonStatus: s.pageCountComparisonStatus ?? null,
        fileSizeBytes: s.fileSizeBytes,
        sessionFileName: s.sessionFileName ?? null,
        statusAxes: {
          originStatus: s.statusAxes.originStatus,
          acquisitionStatus: s.statusAxes.acquisitionStatus,
          integrityStatus: s.statusAxes.integrityStatus,
          contentReviewStatus: s.statusAxes.contentReviewStatus
        },
        updatedAt: now.toISOString()
      }));

    const payload: SourceArtifactsStoragePayload = {
      schemaVersion: SOURCE_ARTIFACTS_SCHEMA_VERSION,
      savedAt: now.toISOString(),
      bytesPersistedInLocalStorage: false,
      items
    };
    storage.setItem(SOURCE_ARTIFACTS_STORAGE_KEY, JSON.stringify(payload));
    return { success: true, error: null };
  } catch (err) {
    const msg =
      err instanceof Error && (err.name === 'QuotaExceededError' || /quota/i.test(err.message))
        ? 'Przekroczono limit lokalnej pamięci przeglądarki (QuotaExceededError) podczas zapisu metadanych artefaktów.'
        : 'Nie udało się zapisać metadanych artefaktów PDF w localStorage.';
    return { success: false, error: msg };
  }
}

export function clearLocalSourceArtifactsFromStorage(storage: Storage | null): void {
  if (!storage) {
    return;
  }
  try {
    storage.removeItem(SOURCE_ARTIFACTS_STORAGE_KEY);
  } catch {
    // Bezpieczne ignorowanie błędów dostępu do storage
  }
}

export function loadSourceRegistryWithLocalArtifacts(
  bundle: Stage1ChplAuditBundle,
  storage: Storage | null
): SourceRegistryEntry[] {
  const base = buildBaseSourceRegistry(bundle);
  if (!storage) {
    return base;
  }
  const raw = storage.getItem(SOURCE_ARTIFACTS_STORAGE_KEY);
  if (!raw) {
    return base;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isPlainRecord(parsed) || hasPrototypePollutionKey(parsed) || !Array.isArray(parsed.items)) {
      return base;
    }
    const persistedById = new Map<string, PersistedLocalSourceArtifactEntry>();
    for (const rawItem of parsed.items) {
      if (!isPlainRecord(rawItem) || hasPrototypePollutionKey(rawItem)) {
        continue;
      }
      if (typeof rawItem.documentId !== 'string') {
        continue;
      }
      const cleanCurrent = sanitizeStoredArtifactRecord(rawItem.currentArtifact);
      const cleanHistory = Array.isArray(rawItem.artifactHistory)
        ? rawItem.artifactHistory
            .map((a) => sanitizeStoredArtifactRecord(a))
            .filter((a): a is DocumentArtifactRecord => a !== null)
        : [];
      persistedById.set(rawItem.documentId, {
        ...(rawItem as unknown as PersistedLocalSourceArtifactEntry),
        currentArtifact: cleanCurrent,
        artifactHistory: cleanHistory
      });
    }

    return base.map((baseDoc) => {
      const persisted = persistedById.get(baseDoc.documentId);
      if (!persisted) {
        return baseDoc;
      }
      const restoredHistory =
        persisted.artifactHistory.length > 0 ? persisted.artifactHistory : baseDoc.artifactHistory;
      const restoredCurrent = persisted.currentArtifact ?? baseDoc.currentArtifact;
      return {
        ...baseDoc,
        sha256:
          typeof persisted.sha256 === 'string' && isValidSha256Hex(persisted.sha256)
            ? persisted.sha256
            : baseDoc.sha256,
        sha256Basis: persisted.sha256Basis ?? baseDoc.sha256Basis,
        sha256ScopeLabel:
          typeof persisted.sha256ScopeLabel === 'string'
            ? persisted.sha256ScopeLabel
            : baseDoc.sha256ScopeLabel,
        physicalPageCount:
          typeof persisted.physicalPageCount === 'number'
            ? persisted.physicalPageCount
            : baseDoc.physicalPageCount,
        activeSessionPageCount: null,
        registryReferencePageCount:
          baseDoc.registryReferencePageCount ?? baseDoc.physicalPageCount,
        pageCountComparisonStatus: persisted.pageCountComparisonStatus ?? null,
        fileSizeBytes:
          typeof persisted.fileSizeBytes === 'number'
            ? persisted.fileSizeBytes
            : baseDoc.fileSizeBytes,
        sessionFileName:
          typeof persisted.sessionFileName === 'string' ? persisted.sessionFileName : null,
        hasPersistedLocalArtifactMetadata: true,
        currentArtifact: restoredCurrent,
        artifactHistory: restoredHistory,
        statusAxes: {
          originStatus: persisted.statusAxes?.originStatus ?? baseDoc.statusAxes.originStatus,
          acquisitionStatus:
            baseDoc.isHistoricalRejectedForCurrentSeason
              ? 'historical_copy_only'
              : baseDoc.statusAxes.acquisitionStatus === 'acquired'
                ? 'acquired'
                : 'not_acquired',
          integrityStatus:
            persisted.statusAxes?.integrityStatus ?? baseDoc.statusAxes.integrityStatus,
          contentReviewStatus:
            persisted.statusAxes?.contentReviewStatus ?? baseDoc.statusAxes.contentReviewStatus,
          fileAvailability: 'metadata_only_reload_required',
          storageMode: 'metadata_persisted_reload_required'
        }
      };
    });
  } catch {
    return base;
  }
}
