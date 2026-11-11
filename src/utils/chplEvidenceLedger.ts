import type {
  Stage1ChplAuditBundle,
  Stage1ChplCheckOutcome,
  Stage1ChplProductKey,
  Stage1ChplSubpointAudit,
  Stage1HumanDecisionItem
} from '../types/childVaccines';
import type {
  EvidenceLedgerEntry,
  EvidenceLedgerExportPayload,
  EvidenceLedgerImportPreview,
  EvidenceLedgerImportRejectedItem,
  EvidenceLedgerStorageSaveResult,
  EvidenceOrigin,
  EvidenceRelationship,
  EvidenceReviewStatus,
  EvidenceTraceabilityFilters,
  InformalWorkingNote,
  PageNumberingType,
  QrdLocationReference,
  QuestionTraceabilitySummary,
  QuestionWorkStatus,
  SourceAuthorityType,
  SourceProductScopeKey,
  SourceRegistryEntry,
  SourceVerificationStatus
} from '../types/evidenceLedger';
import {
  hasPrototypePollutionKey,
  isPlainRecord,
  isValidDateString,
  isValidHttpUrl
} from './catalogMerge';

export const EVIDENCE_LEDGER_SCHEMA_VERSION = '1.0.0';
export const SOURCE_REGISTRY_VERSION = '2026.11.11-etap-b2-sources-1.0';
export const EVIDENCE_LEDGER_STORAGE_KEY = 'vaxnurse_chpl_evidence_ledger_v1';
export const WORKING_NOTES_STORAGE_KEY = 'vaxnurse_chpl_working_notes_v1';

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

/**
 * Tworzy kanoniczny Rejestr Dokumentów Źródłowych z niemodyfikowalnych źródeł projektu Etapu I i katalogu.
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
    registry.push({
      documentId: 'doc-rpl-influvac-49462',
      productKey: 'influvac_2026_2027',
      productDisplayName: influvac.productName,
      linkedCatalogVaccineIds: [],
      linkedProcedureIds: [...influvac.relatedProcedureIds],
      documentTitle: 'ChPL Influvac (RPL ID 49462, poz. 28478, sezon 2026/2027)',
      documentType: 'ChPL (PDF RPL eZdrowie)',
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
      sha256ScopeLabel: 'Skrót PDF zapisany w rejestrze audytu Etapu I (plik binarny nie jest przechowywany w repozytorium)',
      sha256Basis: 'bundle_recorded_pdf_sha256',
      sourceVerificationStatus: 'official_source_confirmed',
      sourceVerificationStatusLabel: getSourceVerificationStatusLabel('official_source_confirmed'),
      sourceVerificationDate: '2026-11-11',
      sourceVerificationNotes: influvac.technicalNotes
    });
  }

  if (vaxigrip) {
    registry.push({
      documentId: 'doc-rpl-vaxigrip-50032',
      productKey: 'vaxigrip_2026_2027',
      productDisplayName: vaxigrip.productName,
      linkedCatalogVaccineIds: [],
      linkedProcedureIds: [...vaxigrip.relatedProcedureIds],
      documentTitle: 'ChPL Vaxigrip (RPL ID 50032, poz. 28778, sezon 2026/2027)',
      documentType: 'ChPL (PDF RPL eZdrowie)',
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
      sha256ScopeLabel: 'Skrót PDF zapisany w rejestrze audytu Etapu I (plik binarny nie jest przechowywany w repozytorium)',
      sha256Basis: 'bundle_recorded_pdf_sha256',
      sourceVerificationStatus: 'official_source_confirmed',
      sourceVerificationStatusLabel: getSourceVerificationStatusLabel('official_source_confirmed'),
      sourceVerificationDate: '2026-11-11',
      sourceVerificationNotes: vaxigrip.technicalNotes
    });
  }

  if (spikevax) {
    registry.push({
      documentId: 'doc-ema-spikevax-xfg-pl',
      productKey: 'spikevax_xfg',
      productDisplayName: spikevax.productName,
      linkedCatalogVaccineIds: [],
      linkedProcedureIds: [...spikevax.relatedProcedureIds],
      documentTitle: 'EMA EPAR Aneks I — ChPL Spikevax XFG (wersja PL)',
      documentType: 'EMA EPAR Product Information (Aneks I ChPL, PL)',
      authority: 'European Medicines Agency (EMA)',
      authorityType: 'ema_epar',
      officialSourceUrl: spikevax.officialSourceUrl,
      rplIdOrRegistryNumber: 'EMA/EPAR (PL) · RPL CEN ID: 54306 / 54308 / 54456',
      marketingAuthorizationNumber: spikevax.authorizationNumber,
      marketingAuthorizationHolder: spikevax.marketingAuthorizationHolder,
      language: 'PL',
      revisionDate: spikevax.documentDateInSection10,
      publicationDate: '2026-10-30',
      retrievedAt: '2026-11-11T03:07:05+01:00',
      physicalPageCount: spikevax.pageCount,
      pdfScopeRange: `Aneks I na str. 64–92 z ${spikevax.pageCount} str. PDF EPAR PL`,
      fileSizeBytes: spikevax.fileSizeBytes,
      sha256: spikevax.fileSha256,
      sha256ScopeLabel: 'Skrót pełnego pliku EPAR PL (177 str.) zapisany w rejestrze audytu Etapu I',
      sha256Basis: 'bundle_recorded_pdf_sha256',
      sourceVerificationStatus: 'official_source_confirmed',
      sourceVerificationStatusLabel: getSourceVerificationStatusLabel('official_source_confirmed'),
      sourceVerificationDate: '2026-11-11',
      sourceVerificationNotes: spikevax.technicalNotes
    });

    registry.push({
      documentId: 'doc-ema-spikevax-xfg-en',
      productKey: 'spikevax_xfg',
      productDisplayName: `${spikevax.productName} (wersja angielska SmPC)`,
      linkedCatalogVaccineIds: [],
      linkedProcedureIds: [...spikevax.relatedProcedureIds],
      documentTitle: 'EMA EPAR Annex I — SmPC Spikevax XFG (wersja EN)',
      documentType: 'EMA EPAR Product Information (Annex I SmPC, EN)',
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
      pdfScopeRange: 'Annex I SmPC na str. 53–77 z 158 str. PDF EPAR EN',
      fileSizeBytes: 1387433,
      sha256: '8932b31f46e652f9ee4be89ad65cd6003f9fa5a63be0f2af64affd645a0d7024',
      sha256ScopeLabel: 'Skrót pełnego pliku EPAR EN (158 str.) zapisany w rekordzie audytu PSO',
      sha256Basis: 'bundle_recorded_pdf_sha256',
      sourceVerificationStatus: 'official_source_confirmed',
      sourceVerificationStatusLabel: getSourceVerificationStatusLabel('official_source_confirmed'),
      sourceVerificationDate: '2026-11-11',
      sourceVerificationNotes:
        'Odrębny angielskojęzyczny dokument EPAR EMA (158 str.). Pkt 10 na str. 77 również pozostaje bez wpisanej daty w tekście.'
    });

    registry.push({
      documentId: 'doc-rpl-spikevax-cen-endpoints',
      productKey: 'spikevax_xfg',
      productDisplayName: 'Spikevax XFG — wpisy RPL procedury centralnej (CEN)',
      linkedCatalogVaccineIds: [],
      linkedProcedureIds: [...spikevax.relatedProcedureIds],
      documentTitle: 'RPL CEN Spikevax XFG (ID 54306 / 54308 / 54456) — brak pliku PDF w API',
      documentType: 'Rejestr krajowy RPL eZdrowie (endpoint CEN)',
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
      retrievedAt: '2026-11-11T03:07:05+01:00',
      physicalPageCount: null,
      pdfScopeRange: 'Brak pliku PDF w API RPL (HTTP 400 / hasDownloadableMaterials=false)',
      fileSizeBytes: null,
      sha256: null,
      sha256ScopeLabel: 'Niezweryfikowano binarnie (endpoint RPL CEN zwraca HTTP 400 — źródło podstawowe w EMA EPAR)',
      sha256Basis: 'not_verified_binary',
      sourceVerificationStatus: 'official_source_unavailable',
      sourceVerificationStatusLabel: getSourceVerificationStatusLabel('official_source_unavailable'),
      sourceVerificationDate: '2026-11-11',
      sourceVerificationNotes:
        'W polskim RPL wpisy Spikevax XFG mają puste registryNumber oraz hasDownloadableMaterials=false; endpoint /characteristic zwraca HTTP 400.'
    });
  }

  if (bcg) {
    registry.push({
      documentId: 'doc-rpl-bcg10-19535',
      productKey: 'bcg_10',
      productDisplayName: bcg.productName,
      linkedCatalogVaccineIds: [],
      linkedProcedureIds: [...bcg.relatedProcedureIds],
      documentTitle: 'ChPL Szczepionka przeciwgruźlicza BCG 10 (RPL ID 19535, poz. R/0210)',
      documentType: 'ChPL (PDF RPL eZdrowie)',
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
      sha256ScopeLabel: 'Skrót PDF zapisany w rejestrze audytu Etapu I (pkt 10 bez daty rewizji)',
      sha256Basis: 'bundle_recorded_pdf_sha256',
      sourceVerificationStatus: 'official_source_confirmed',
      sourceVerificationStatusLabel: getSourceVerificationStatusLabel('official_source_confirmed'),
      sourceVerificationDate: '2026-11-11',
      sourceVerificationNotes: bcg.technicalNotes
    });
  }

  // Dokument historyczny 2025/2026 — zachowany wyłącznie do ostrzeżenia o nieaktualności (odrzucony dla 2026/2027)
  registry.push({
    documentId: 'doc-rpl-vaxigrip-tetra-35346-hist',
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
    isHistoricalRejectedForCurrentSeason: true
  });

  // Dokument Infanrix hexa (otwarta blokada fenyloalaniny disc-phenylalanine-content-01)
  registry.push({
    documentId: 'doc-gsk-infanrix-hexa-pl',
    productKey: 'infanrix_hexa',
    productDisplayName: 'Infanrix hexa (DTaP-HBV-IPV-Hib)',
    linkedCatalogVaccineIds: ['vac-infanrix-hexa'],
    linkedProcedureIds: ['pso-2m-dtap', 'pso-6m-dtap'],
    documentTitle: 'ChPL Infanrix hexa (GSK — druk h-0296-ia-vr-323859-12_02_2026)',
    documentType: 'ChPL podmiotu odpowiedzialnego (PDF)',
    authority: 'GSK / European Medicines Agency (EMA)',
    authorityType: 'regulator_document',
    officialSourceUrl:
      'https://pl.gsk.com/media/b2ip1snt/infanrix-hexa-druki-pl-h-0296-ia-vr-323859-12_02_2026.pdf',
    rplIdOrRegistryNumber: 'Procedura centralna UE (brak statycznego ID w wyszukiwarce RPL)',
    marketingAuthorizationNumber: 'EU/1/00/152/001, 002, 005, 006, 021',
    marketingAuthorizationHolder: 'GlaxoSmithKline Biologicals S.A.',
    language: 'PL',
    revisionDate: null,
    publicationDate: '2026-02-12',
    retrievedAt: null,
    physicalPageCount: null,
    pdfScopeRange: 'Wybrane strony cytowane w audycie (str. 2–19); brak weryfikacji pełnego pliku PDF w repozytorium',
    fileSizeBytes: null,
    sha256: null,
    sha256ScopeLabel: 'Niezweryfikowano binarnie (brak pliku PDF w repozytorium — skrót nie został zapisany)',
    sha256Basis: 'not_verified_binary',
    sourceVerificationStatus: 'requires_manual_review',
    sourceVerificationStatusLabel: getSourceVerificationStatusLabel('requires_manual_review'),
    sourceVerificationDate: '2026-11-11',
    sourceVerificationNotes:
      'Aktywna blokada disc-phenylalanine-content-01: pkt 2 ChPL podaje 0,0289 µg/dawkę, pkt 4.4 podaje 0,0298 µg/dawkę. Status karty pozostaje requires_source_clarification.'
  });

  // Dokument PSO 2027 obecny lokalnie jako akt.pdf
  registry.push({
    documentId: 'doc-mz-pso-2027-akt',
    productKey: 'pso_2027_general',
    productDisplayName: 'Program Szczepień Ochronnych (PSO) na 2027 rok',
    linkedCatalogVaccineIds: [],
    linkedProcedureIds: ['pso-bcg-0'],
    documentTitle: 'Komunikat GIS z 28.10.2026 r. — PSO 2027 (Dz. Urz. MZ 2026 poz. 77)',
    documentType: 'Oficjalny akt prawny / Komunikat GIS (PDF)',
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
    physicalPageCount: 44,
    pdfScopeRange: 'Załącznik do Komunikatu GIS (Część I–IV PSO 2027)',
    fileSizeBytes: 864528,
    sha256: '4c6fa9212f292b130fd8958baaeeac2444f86fbaa260b873d586b905108fc6da',
    sha256ScopeLabel: 'Skrót SHA-256 zweryfikowany na lokalnym pliku akt.pdf w katalogu projektu',
    sha256Basis: 'local_workspace_pdf_sha256',
    sourceVerificationStatus: 'official_source_confirmed',
    sourceVerificationStatusLabel: getSourceVerificationStatusLabel('official_source_confirmed'),
    sourceVerificationDate: '2026-11-11',
    sourceVerificationNotes:
      'Referencyjny akt prawny PSO 2027 porównywany z ChPL podczas rozstrzygania rozbieżności operacyjnych (np. wiek graniczny BCG 10 vs 15 lat).'
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

/**
 * Buduje deterministyczne wpisy bazowego łańcucha identyfikowalności na podstawie
 * nieedytowalnego pakietu STAGE1_CHPL_AUDIT_BUNDLE.
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

      entries.push({
        evidenceId: `ev-stage1-${question.id}-${token.replace('.', '_')}`,
        questionId: question.id,
        productKey: question.productKey,
        productLabel: getProductScopeLabel(question.productKey),
        documentId: primaryDoc.documentId,
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
        reviewStatus: mapped.reviewStatus,
        questionWorkStatus: mapped.questionWorkStatus,
        autoResolved: false,
        origin: 'bundle_extract',
        isWorkingNote: false,
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
          reviewStatus: 'awaiting_human_review',
          questionWorkStatus: 'awaiting_human_review',
          autoResolved: false,
          origin: 'bundle_extract',
          isWorkingNote: false,
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
          reviewStatus: 'awaiting_human_review',
          questionWorkStatus: 'awaiting_human_review',
          autoResolved: false,
          origin: 'bundle_extract',
          isWorkingNote: false,
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
            'Potwierdza brak daty w sekcji 10 równolegle w wersji PL (str. 92) oraz EN (str. 77); strona główna EPAR podaje Last updated 30/10/2026.',
          relationship: 'missing_information',
          reviewStatus: 'requires_authority_clarification',
          questionWorkStatus: 'requires_authority_clarification',
          autoResolved: false,
          origin: 'bundle_extract',
          isWorkingNote: false,
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
            'Kody GTIN 00380777714110 oraz 00380777712024 pochodzą z komunikatów MZ/RARS i nie znajdują potwierdzenia w EPAR EMA ani w API RPL.',
          relationship: 'does_not_resolve',
          reviewStatus: 'requires_authority_clarification',
          questionWorkStatus: 'requires_authority_clarification',
          autoResolved: false,
          origin: 'bundle_extract',
          isWorkingNote: false,
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
  reviewStatus: EvidenceReviewStatus;
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
    reviewStatus: input.reviewStatus,
    questionWorkStatus: mapReviewStatusToQuestionWorkStatus(input.reviewStatus),
    autoResolved: false,
    origin: 'auditor_working_entry',
    isWorkingNote: true,
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

function validateImportedEvidenceEntryObject(
  raw: unknown,
  index: number,
  sourceMap: ReadonlyMap<string, SourceRegistryEntry>,
  questionIds: ReadonlySet<string>,
  seenIds: Set<string>
): { entry?: EvidenceLedgerEntry; rejection?: EvidenceLedgerImportRejectedItem } {
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
  if (incomingHash !== null && incomingHash !== undefined) {
    if (!isValidSha256Hex(incomingHash)) {
      return { rejection: { kind: 'entry', id, reason: 'Nieprawidłowy format skrótu SHA-256.' } };
    }
    if (canonicalDoc.sha256 && incomingHash.toLowerCase() !== canonicalDoc.sha256.toLowerCase()) {
      return {
        rejection: {
          kind: 'entry',
          id,
          reason: `Niezgodność skrótu SHA-256 dla dokumentu ${canonicalDoc.documentId} (możliwa modyfikacja pliku).`
        }
      };
    }
  } else if (canonicalDoc.sha256) {
    return {
      rejection: {
        kind: 'entry',
        id,
        reason: `Brak wymaganego skrótu SHA-256 dla dokumentu posiadającego zapisany hash (${canonicalDoc.documentId}).`
      }
    };
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

  return {
    entry: {
      evidenceId: id,
      questionId: raw.questionId,
      productKey: canonicalDoc.productKey,
      productLabel: getProductScopeLabel(canonicalDoc.productKey),
      documentId: canonicalDoc.documentId,
      documentTitle: canonicalDoc.documentTitle,
      officialSourceUrl: canonicalDoc.officialSourceUrl,
      sourceDocumentHash: canonicalDoc.sha256,
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
      reviewStatus: raw.reviewStatus as EvidenceReviewStatus,
      questionWorkStatus: workStatus,
      autoResolved: false,
      origin,
      isWorkingNote: origin === 'auditor_working_entry' ? true : Boolean(raw.isWorkingNote),
      recordedAt: String(raw.recordedAt).trim(),
      recordedBy:
        origin === 'bundle_extract'
          ? 'Ekstrakcja Etapu I (read-only)'
          : typeof raw.recordedBy === 'string' && raw.recordedBy.trim()
            ? raw.recordedBy.trim()
            : LOCAL_WORKING_NOTE_AUTHOR
    }
  };
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

export function loadWorkingEvidenceFromStorage(
  storage: Storage | null,
  checklist: readonly Stage1HumanDecisionItem[],
  sources: readonly SourceRegistryEntry[]
): EvidenceLedgerEntry[] {
  if (!storage) {
    return [];
  }
  try {
    const rawText = storage.getItem(EVIDENCE_LEDGER_STORAGE_KEY);
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
    const valid: EvidenceLedgerEntry[] = [];
    for (let i = 0; i < parsed.length; i += 1) {
      const res = validateImportedEvidenceEntryObject(parsed[i], i, sourceMap, questionIds, seenIds);
      if (res.entry && res.entry.origin === 'auditor_working_entry') {
        valid.push(res.entry);
      }
    }
    return valid;
  } catch {
    return [];
  }
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
      'Odrębny eksport rejestru dowodów roboczych Etapu B2 (VaxNurse). Nie zastępuje kopii katalogu preparatów (vaxnurseBackup), nie zawiera danych pacjentów ani nie stanowi zatwierdzenia klinicznego ChPL.',
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
  const emptyPreview = (errors: string[], rejectedItems: EvidenceLedgerImportRejectedItem[] = []): EvidenceLedgerImportPreview => ({
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
      'Wybrany plik to ogólna kopia zapasowa katalogu preparatów (vaxnurseBackup). Użyj modułu Ustawienia do przywrócenia backupu aplikacji — ten importer obsługuje wyłącznie rejestr dowodów Etapu B2.'
    ]);
  }

  const errors: string[] = [];
  const warnings: string[] = [];
  const rejectedItems: EvidenceLedgerImportRejectedItem[] = [];

  if (parsed.vaxnurseEvidenceLedger !== true) {
    errors.push('Brak znacznika schematu vaxnurseEvidenceLedger: true.');
  }

  if (parsed.schemaVersion !== EVIDENCE_LEDGER_SCHEMA_VERSION) {
    errors.push(
      `Nieobsługiwana lub brakująca wersja schematu dowodów (${String(parsed.schemaVersion)}; oczekiwano ${EVIDENCE_LEDGER_SCHEMA_VERSION}).`
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
      seenEntryIds
    );
    if (res.rejection) {
      rejectedItems.push(res.rejection);
    } else if (res.entry) {
      if (res.entry.origin === 'bundle_extract') {
        skippedBaselineCount += 1;
      } else {
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
      prev.reviewStatus === e.reviewStatus
    ) {
      skippedDuplicatesCount += 1;
    } else {
      updatedEntriesCount += 1;
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
  existingWorkingNotes: readonly InformalWorkingNote[]
): {
  mergedEntries: EvidenceLedgerEntry[];
  mergedNotes: InformalWorkingNote[];
} {
  if (!preview.canImport) {
    throw new Error('Nie można zastosować importu zawierającego błędy walidacji.');
  }

  const entryMap = new Map(existingWorkingEntries.map((e) => [e.evidenceId, e]));
  for (const entry of preview.validEntries) {
    entryMap.set(entry.evidenceId, { ...entry, autoResolved: false });
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
    if (relationshipsCount.contradicts > 0) {
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
      workingNotesCount: notesForQ.length,
      relationshipsCount,
      linkedDocumentIds: Array.from(docIds)
    };
  });
}
