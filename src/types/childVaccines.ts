export type VaccineObligationType = 'obowiazkowe' | 'zalecane';

/**
 * Zakres populacyjny procedury:
 * - 'pediatric': procedura ściśle pediatryczna (noworodki, dzieci, młodzież)
 * - 'adult': procedura dedykowana wyłącznie osobom dorosłym
 * - 'cross_age': procedura wielowiekowa obejmująca wskazania urzędowe u dzieci i dorosłych
 */
export type PopulationScope = 'pediatric' | 'adult' | 'cross_age';

/**
 * Granularne statusy weryfikacji danych (Punkt 5 audytu oraz rozdzielenie statusów ChPL w PROMPT 18)
 */
export type PsoVerificationStatus = 'verified_pso' | 'pending_verification';
export type ChplReferenceStatus = 'official_document_identified' | 'reference_name_only' | 'missing';
export type ChplContentVerificationStatus = 'verified_full' | 'analyzed_with_discrepancy' | 'pending_content_audit' | 'not_verified';
export type ChplVerificationStatus = 'verified_chpl' | 'requires_source_clarification' | 'pending_chpl_verification' | 'no_trade_product_linked';
export type FundingVerificationStatus = 'verified_public_free' | 'verified_reimbursement' | 'verified_self_funded' | 'pending_clarification';
export type ProductLinkageStatus = 'linked_catalog' | 'conditional_alternative' | 'pending_catalog_entry' | 'not_applicable';
export type ProductRelationType = 'direct_primary' | 'variant_a2_6in1' | 'conditional_alternative';

/**
 * Niezależny status kompletności karty produktu w Bazie preparatów VaxNurse (VACCINES_CATALOG)
 * oraz niezależny status adekwatności produktu do konkretnej procedury PSO (Zadanie 2 PROMPT 21).
 */
export type CatalogCardCompletenessStatus =
  | 'complete_verified_card'
  | 'incomplete_or_unverified_card'
  | 'missing_catalog_card';

export type ProcedureProductAdequacyStatus =
  | 'confirmed_adequate'
  | 'conditional_with_restrictions'
  | 'requires_clarification'
  | 'pending_adequacy_review';

export type ChplAuditSectionNumber = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10';
export type ChplSectionReviewStatus = 'verified' | 'not_present_in_document' | 'not_applicable';

/**
 * Granularny wpis kontroli podpunktu ChPL (np. 4.1–4.9 w sekcji 4, 5.1–5.3 w sekcji 5).
 */
export interface ChplSubpointAuditEntry {
  subpointId: string;
  label?: string;
  status: ChplSectionReviewStatus;
  /** Odwołanie do numeru strony w oficjalnym pliku PDF ChPL */
  pageRef?: string;
  /** Merytoryczny opis zweryfikowanej treści podpunktu (wymagany przy statusie 'verified') */
  verificationNote?: string;
  /** Obowiązkowe uzasadnienie przy statusie 'not_present_in_document' lub 'not_applicable' */
  justification?: string;
  /** Zidentyfikowana rozbieżność lub uwaga wymagająca wyjaśnienia */
  discrepancyNote?: string;
}

export interface ChplSectionAuditEntry {
  sectionNumber: ChplAuditSectionNumber;
  sectionTitle?: string;
  status: ChplSectionReviewStatus;
  /** Odwołanie do numeru strony w oficjalnym dokumencie PDF ChPL */
  pageRef?: string;
  /** Merytoryczna notatka potwierdzająca zakres wykonanej analizy sekcji */
  verificationNote?: string;
  /** Wynik oceny tej konkretnej sekcji ChPL */
  outcome?: 'compliant' | 'discrepancy_detected' | 'pending_review';
  /** Opis niezgodności wykrytej w obrębie tej sekcji */
  discrepancyNote?: string;
  /** Szczegółowa kontrola podpunktów sekcji (obowiązkowa dla sekcji 4: 4.1–4.9) */
  subpoints?: ChplSubpointAuditEntry[];
  /** Obowiązkowe uzasadnienie przy statusie 'not_present_in_document' lub 'not_applicable' */
  justification?: string;
}

/**
 * Pełny zapis audytu treści ChPL — wymagany przed awansem do statusu 'verified_full'.
 */
export interface ChplContentAuditRecord {
  productName: string;
  officialSourceUrl: string;
  /** Dodatkowy oficjalny dokument ChPL (np. wersja EN EPAR EMA lub drugi preparat równorzędny) */
  secondaryOfficialSourceUrl?: string;
  /** Pochodzenie dokumentu rejestracyjnego (RPL krajowy vs procedura centralna EMA EPAR) */
  documentOrigin?: 'RPL_PL' | 'EMA_EPAR_CEN_PL_EN' | 'MAH_OFFICIAL';
  /** Docelowy sezon szczepienia, dla którego oceniano ChPL (np. '2026/2027') */
  targetSeason?: string;
  /** Sezon epidemiczny wynikający wprost ze składu antygenowego pkt 2 pobranej ChPL */
  sourceSeason?: string;
  /** Czas pobrania i kontroli binarnej dokumentu z publicznego endpointu */
  downloadedAt?: string;
  /** Rozmiar pobranego pliku PDF w bajtach */
  fileSizeBytes?: number;
  /** Skrót SHA-256 pobranego pliku PDF (dowód tożsamości dokumentu) */
  fileSha256?: string;
  /** Rozmiar dodatkowego oficjalnego pliku PDF w bajtach */
  secondaryFileSizeBytes?: number;
  /** Skrót SHA-256 dodatkowego oficjalnego pliku PDF */
  secondaryFileSha256?: string;
  /** Wyjaśnienie ew. rozbieżności metadanych wyszukiwarki publicznej vs treści PDF */
  metadataDiscrepancyNote?: string;
  documentIdOrAuthorizationNumber: string;
  /** Data dokumentu (np. z pkt 10 ChPL) lub jawnie 'Brak informacji w dokumencie' */
  documentVersionOrDate: string;
  /** Czy w źródle ChPL widnieje data dokumentu czy brak informacji w dokumencie */
  documentDateStatus?: 'dated' | 'missing_in_document';
  /** Data wykonania audytu merytorycznego (odrębna od daty pkt 10 ChPL!) */
  auditDate: string;
  auditor: string;
  verifiedSectionsScope: string[];
  /** Jawna kontrola wszystkich 10 właściwych punktów ChPL (1–10) wraz z ew. uzasadnieniem braku punktu */
  sectionReviews?: ChplSectionAuditEntry[];
  auditOutcome: 'compliant' | 'discrepancy_detected' | 'pending_review';
  unresolvedDiscrepanciesCount: number;
  notes?: string;
}

/**
 * Strukturalny opis relacji procedury PSO z kartą handlową w katalogu preparatów VaxNurse.
 */
export interface ProductLinkageEntry {
  vaccineId: string;
  productLabel: string;
  relationType: ProductRelationType;
  psoBasis: string;
  standardCalendarDose: string;
  variantA2Dose?: string | null;
  isOptionalCombinedVariant: boolean;
  isVariantPatientFunded: boolean;
  marketAvailabilityNote: string;
  clinicalConditionNote: string;
}

/**
 * Szczegółowe dane rejestracyjne alternatywnego preparatu (np. BCG Szczepionka AJVaccines),
 * oddzielające obecność ChPL/pozwolenia w RPL od potwierdzenia dostępności rynkowej w Polsce.
 */
export interface AlternativeProductDetails {
  nameInPso: string;
  rplProductName: string;
  rplId: number;
  marketingAuthorizationHolder: string;
  authorizationNumber: string;
  authorizationValidity: string;
  procedureType: string;
  officialChplUrl: string;
  chplRevisionDate: string;
  searchApiDownloadableFlagNote: string;
  marketAvailabilityStatus: 'unconfirmed_in_poland' | 'confirmed_for_season_2026_2027';
  marketAvailabilityNote: string;
}

/**
 * Rozdzielenie sześciu odrębnych mechanizmów finansowania i dostępności (Zadanie 7 audytu):
 * bezpłatny zakup szczepionki przez państwo vs wykonanie usługi vs refundacja apteczna
 * vs refundacja częściowa vs program czasowy vs dostępność w regionie/punkcie.
 */
export interface FundingMechanismBreakdown {
  stateVaccinePurchase: string;
  serviceExecutionFunding: string;
  pharmacyReimbursement: string;
  partialReimbursementDetail: string;
  temporaryProgram: string;
  regionalAvailabilityAndDistribution: string;
  localPointAvailabilityConfirmed: boolean;
}

export type SeasonalAvailabilityStatus =
  | 'confirmed_for_season'
  | 'unconfirmed_for_season'
  | 'excluded_from_pediatric';

/**
 * Odrębny zakres finansowania dla konkretnej grupy wiekowej, produktu lub regionu
 * (bez duplikowania samej procedury klinicznej w katalogu).
 */
export interface FundingScopeBreakdown {
  scopeId: string;
  label: string;
  ageGroup: string;
  /** Ustrukturyzowana dolna granica wieku (np. 'Od ukończenia 9. r.ż. wg ChPL pkt 4.1') */
  minAgeDescription?: string;
  /** Ustrukturyzowana górna granica wieku (np. 'Do dnia poprzedzającego 18. urodziny') */
  maxAgeDescription?: string;
  /** Jawne reguły granicy włączenia/wyłączenia i kontynuacji po zmianie progu wieku */
  boundaryInclusivity?: string;
  /** Stan potwierdzenia dostępności preparatu w sezonie 2026/2027 w Polsce */
  seasonalAvailabilityStatus?: SeasonalAvailabilityStatus;
  /** Wyjaśnienie powodu braku potwierdzenia lub wycofania dostępności w sezonie */
  unconfirmedAvailabilityNote?: string;
  productScope: string;
  fundingStatus: FundingVerificationStatus | 'regional_pool_closed';
  /** Określa, czy preparat/zakres dotyczy wyboru pediatrycznego w module dziecięcym (false = wyłącznie referencja dorosłych/wykluczenie) */
  isPediatricSelectable?: boolean;
  audienceContext?: 'pediatric' | 'adult_only' | 'pregnancy_puerperium' | 'regional_update';
  validityPeriod: string;
  sourceRef: string;
  sourceUrl?: string;
  conditionsAndExceptions: string;
  mechanismBreakdown: FundingMechanismBreakdown;
}

/**
 * Preparat wyłączony z modułu wyboru szczepień dziecięcych (np. Efluelda >=60 lat),
 * zachowany wyłącznie jako bezpieczna referencja dla przyszłego modułu dorosłych.
 */
export interface ExcludedPediatricProductRecord {
  productName: string;
  gtin?: string;
  registeredAgeIndication: string;
  reimbursementSummary: string;
  exclusionReason: string;
  excludedFromPediatricSelection: true;
}

export type GtinVerificationStatus =
  | 'confirmed_in_official_guideline_and_product_doc'
  | 'confirmed_mz_guideline_and_rars_pending_rpl_ema'
  | 'confirmed_operational_guideline_pending_rpl_rars_cross_check'
  | 'pending_gtin_verification';

/**
 * Zindywidualizowana dokumentacja źródła kodu GTIN (odrębna od samego komunikatu o nazwie/dawce).
 */
export interface GtinSourceRecord {
  gtin: string;
  productPresentation: string;
  targetAgeGroup: string;
  dose: string;
  sourceDocumentTitle: string;
  sourceDocumentUrl: string;
  sourceSectionOrPage: string;
  /** Oficjalne źródło RARS potwierdzające GTIN w dystrybucji sezonowej */
  rarsSourceTitle?: string;
  rarsSourceUrl?: string;
  rarsPresentationText?: string;
  /** Jawne rozdzielenie potwierdzenia wg typu źródła (bez automatycznego zrównywania RARS z RPL/EMA) */
  confirmedByMzGuidelines?: boolean;
  confirmedByRars?: boolean;
  confirmedByRpl?: boolean;
  confirmedByEma?: boolean;
  crossCheckedWithEparOrRpl: boolean;
  verificationStatus: GtinVerificationStatus;
  notes: string;
}

/**
 * Osobna dokumentacja źródeł i warunków finansowania (odrębna od samego wpisu do PSO).
 */
export interface FundingAuditDetails {
  legalBasis: string;
  targetGroup: string;
  productType: string;
  conditions: string;
  validityPeriod: string;
  verifiedDate: string;
  validityOrVerifiedDate: string;
  mechanismBreakdown: FundingMechanismBreakdown;
  fundingScopes?: FundingScopeBreakdown[];
  /** Zakresy dorosłych/szczególne przechowywane osobno, NIEprezentowane jako wybór dla dziecka */
  adultAndSpecialReferenceScopes?: FundingScopeBreakdown[];
  /** Preparaty wyłączone z wyboru pediatrycznego (np. Efluelda >=60 lat) */
  excludedPediatricProducts?: ExcludedPediatricProductRecord[];
  /** Identyfikowalne źródła kodów GTIN dla prezentacji i opakowań */
  gtinReferences?: GtinSourceRecord[];
}

export type ChildAgeBracketId =
  | 'doba-0'
  | '2-miesiac'
  | '4-miesiac'
  | '5-6-miesiac'
  | '7-miesiac'
  | '13-15-miesiac'
  | '16-18-miesiac'
  | '6-rok'
  | '9-rok'
  | '14-rok'
  | '19-rok'
  | 'grupy-ryzyka';

export type AgeStageGroup =
  | 'all'
  | 'infancy'     // 1. rok życia (0–12 m.ż.)
  | 'toddler'     // 2. rok życia (13–24 m.ż.)
  | 'preschool'   // Wiek przedszkolny (6 lat)
  | 'school'      // Wiek szkolny i młodzież (9–19 lat)
  | 'clinical';   // Grupy szczególne i wskazania kliniczne

export interface ChildAgeBracketDefinition {
  id: ChildAgeBracketId;
  label: string;
  shortLabel: string;
  stageGroup: Exclude<AgeStageGroup, 'all'>;
  stageGroupLabel: string;
  timingDescription: string;
  psoHeader: string;
  order: number;
}

export type ChildVaccineVerificationStatus =
  | 'verified_pso'
  | 'pending_verification';

export interface ChildVaccineItem {
  id: string;                                   // Unikalny identyfikator wpisu PSO (np. "pso-bcg-0")
  aliasId?: string;                             // Alternatywny / kanoniczny identyfikator procedury (np. "child-dtpa-preterm-primary")
  disease: string;                              // Nazwa jednostki chorobowej / docelowego zakażenia
  shortCode: string;                            // Skrót kliniczny (np. "BCG", "HBV", "DTP", "PCV", "RV", "MMR")
  pathogenCategory: 'bakterie' | 'wirusy' | 'mieszane';
  obligationType: VaccineObligationType;         // Obowiązkowe / Zalecane
  ageBracketId: ChildAgeBracketId;               // Etap wiekowy PSO
  targetAgeDisplay: string;                     // Czytelny wiek podania (np. "W ciągu pierwszych 24 h po urodzeniu")
  targetGroupDescription: string;               // Precyzyjna grupa docelowa (np. "Wszystkie noworodki urodzone o czasie")
  doseNumberInSeries: number;                   // Numer dawki w schemacie (np. 1, 2, 3, 4)
  totalDosesInStandardSeries: number;           // Całkowita liczba dawek w podstawowym cyklu (np. 1, 3, 4)
  doseLabel: string;                            // Oznaczenie dawki (np. "1. dawka pierwotna")
  administrationRoute: string;                  // Droga podania (i.m., s.c., i.d., p.o.)
  injectionSite: string;                        // Rekomendowane miejsce iniekcji (np. "Przednioboczna część uda")
  minIntervalFromPrevious: string | null;       // Minimalny odstęp od poprzedniej dawki

  // ZADANIE 5: Nowa numeracja i atrybucja źródeł PSO 2027
  sourcePart: string;                           // Część PSO (np. "Część I.A", "Część I.B", "Część I.D", "Część II.A", "Część III.C", "Część III.E", "Część III.H")
  sourceOfficialPoint: string | null;           // Oficjalny numer punktu, jeżeli istnieje (np. "2", "3", "4", "6.3", "pkt 6"); w tabelach bez numeracji: null
  sourceCriteriaNumbers?: string | null;        // Numery kryteriów klinicznych (np. "kryteria 1–4") dla wierszy tabeli bez oficjalnej numeracji punktów
  sourceTableRow: string | null;                // Nazwa szczepienia lub wiersza tabeli (np. "GRUŹLICY", "BŁONICY, TĘŻCOWI, KRZTUŚCOWI")
  sourceAgeBand: string | null;                 // Wiek z tabeli (np. "Od 1. doby życia do wypisu ze szpitala")
  sourcePrintedPage: number;                    // Drukowana numeracja strony Dziennika Urzędowego MZ (strony 4–44)
  sourcePdfPage: number;                        // Fizyczny numer strony w pliku akt.pdf
  populationScope: PopulationScope;             // Zakres populacyjny: 'pediatric' | 'adult' | 'cross_age'

  // Pola wstecznie kompatybilne
  psoPart: string;                              // Numer części PSO (np. "Część I.A", "Część I.B", "Część II")
  psoPointOrSubpoint: string;                   // Punkt lub podpunkt PSO
  psoPdfPage: number;                           // Strona w oficjalnym PDF Dz. Urz. Min. Zdrow. 2026 poz. 77
  psoSection: string;                           // Pełna etykieta sekcji PSO
  psoOfficialUrl: string;                       // Oficjalny link GIS / Dziennik Urzędowy MZ
  psoLegalAct: string;                          // Podstawa prawna aktu

  // ZADANIE 1: Daty publikacji i podstawa
  psoGisAnnouncementDate: string;               // Data komunikatu GIS: "28.10.2026"
  psoJournalPublicationDate: string;           // Data publikacji Dziennika Urzędowego MZ: "30.10.2026"
  psoJournalEntry: string;                      // Publikacja: "Dz. Urz. MZ 2026 poz. 77"
  psoPublicationDate: string;                   // Data publikacji Dziennika Urzędowego ("30.10.2026")

  clinicalNotes: string;                        // Wskazówki wykonawcze dla personelu
  contraindicationsOrWarnings: string | null;   // Ważne ostrzeżenia i uwagi specyficzne
  fundingStatus: string;                        // Informacja o refundacji / odpłatności
  fundingSource: 'mz_budget' | 'free_public_program' | 'self_funded' | 'mixed';
  officialFundingSourceRef: string | null;      // Osobne urzędowe źródło podstawy finansowania / ustawy
  linkedVaccineIds: string[];                   // Identyfikatory w katalogu preparatów (np. ['vac-infanrix-hexa'])
  productLinkages?: ProductLinkageEntry[];      // Ustrukturyzowane powiązania (główne vs Wariant A.2 6w1 vs warunkowe alternatywy)
  chplReference: string | null;                 // Opisowe odwołanie do ChPL produktu (np. "ChPL Infanrix hexa pkt 4.2")
  chplOfficialSourceUrl?: string | null;        // Bezpośredni URL do oficjalnego dokumentu ChPL (np. RPL / GSK / EMA)
  chplProductName?: string | null;              // Nazwa produktu leczniczego z rejestru
  chplMarketingAuthorizationHolder?: string | null; // Podmiot odpowiedzialny
  chplAuthorizationNumber?: string | null;      // Numer pozwolenia
  chplPharmaceuticalForm?: string | null;       // Postać farmaceutyczna
  chplAudit?: ChplContentAuditRecord | null;    // Metadane i warunek dopuszczenia do statusu 'verified_full'
  alternativeProductLabel?: string | null;      // Informacja o produkcie alternatywnym
  alternativeProductStatus?: 'confirmed' | 'pending_verification' | 'none';
  alternativeProductDetails?: AlternativeProductDetails | null; // Szczegóły rejestracyjne RPL produktu alternatywnego
  fundingAuditDetails?: FundingAuditDetails;    // Podstawa prawna, grupa docelowa, warunki i data weryfikacji finansowania
  linkageAuditNote?: string | null;             // Wynik kontroli powiązania handlowego (np. nieścisłości dawki lub alternatywy 6w1)
  alternativeCombinedOptions: string | null;    // Opcja zastąpienia szczepionkami skojarzonymi (5w1 / 6w1)
  verificationStatus: ChildVaccineVerificationStatus; // Status weryfikacji z oficjalnym komunikatem (wstecznie kompatybilny)
  lastVerifiedDate: string;                     // Data weryfikacji rekordu

  // Granularne statusy weryfikacji (Punkt 5 audytu + PROMPT 18 + PROMPT 19 + PROMPT 21)
  psoVerificationStatus: PsoVerificationStatus;
  chplReferenceStatus: ChplReferenceStatus;
  chplContentVerificationStatus: ChplContentVerificationStatus;
  chplVerificationStatus: ChplVerificationStatus;
  fundingVerificationStatus: FundingVerificationStatus;
  productLinkageStatus: ProductLinkageStatus;
  catalogCardCompletenessStatus?: CatalogCardCompletenessStatus;
  procedureProductAdequacyStatus?: ProcedureProductAdequacyStatus;
}

/**
 * Model uprawnień personelu medycznego do kwalifikacji i wykonywania szczepień (Część VI PSO 2027).
 */
export interface StaffQualificationEntry {
  professionId: string;
  professionName: string;
  qualificationMandatory: boolean;          // Kwalifikacja do szczepień obowiązkowych
  administrationMandatory: boolean;         // Podanie szczepień obowiązkowych
  qualificationRecommendedUnder9: boolean;  // Kwalifikacja do szczepień zalecanych u dzieci poniżej 9 lat
  qualificationRecommended9To18: boolean;   // Kwalifikacja do szczepień zalecanych 9–18 lat
  qualificationRecommendedOver18: boolean;  // Kwalifikacja do szczepień zalecanych powyżej 18 lat
  administrationRecommended: boolean;        // Podanie szczepień zalecanych
  legalBasisFootnoteRefs: string[];         // Numery przypisów i podstaw prawnych z Części VI PSO
  legalConditionsDescription: string;       // Precyzyjny opis warunków formalnych (szkolenia, staż, certyfikaty)
}

/**
 * Model 7 ogólnych zasad przeprowadzania i organizacji szczepień (Część IV PSO 2027).
 */
export interface PsoGeneralPrincipleItem {
  pointNumber: number;
  title: string;
  officialRuleText: string;
  clinicalApplication: string;
  specificExceptions: string[];
  psoSection: string;
  psoPdfPage: number;
}

/**
 * Model 12 oficjalnych punktów szczepień wyrównawczych (Część V PSO 2027, s. 44 akt.pdf).
 */
export interface CatchUpPrincipleItem {
  pointNumber: number;          // 1 do 12
  title: string;                // Zwięzły tytuł prawny
  officialRuleText: string;     // Dosłowna lub wierna treść urzędowa punktu z Części V PSO
  clinicalApplication: string;  // Zastosowanie kliniczne i wykonawcze dla personelu
  psoSection: string;           // Oznaczenie sekcji dokumentu ("Część V, punkt X PSO 2027")
  psoPrintedPage: number;       // Drukowana strona Dziennika Urzędowego (str. 44)
  psoPdfPage: number;           // Fizyczna strona PDF (str. 44)
}

/**
 * Zasady szczepień wyrównawczych – podsumowanie tematyczne (Część V PSO 2027).
 */
export interface CatchUpImmunizationGuideline {
  id: string;
  category: 'brak_dokumentacji' | 'niepelny_schemat' | 'iksz' | 'granica_wieku' | 'kontynuacja_dorosli';
  title: string;
  ruleSummary: string;
  detailedProcedures: string[];
  psoSection: string;
  psoPdfPage: number;
}

/**
 * Schematy szczepionek wysoce skojarzonych 5w1 i 6w1 (Część I.A.1, I.A.2 oraz Część III.M PSO 2027).
 */
export interface CombinedVaccineVariant {
  id: string;
  variantType: '5w1' | '6w1_3plus1' | '6w1_2plus1';
  name: string;
  psoPartAndSection: string;
  psoPdfPage: number;
  antigenComposition: string;
  hbvAdministrationRule: string;
  scheduleDetails: string;
  interchangeabilityWarning: string;
  chplCrossReference: string;
}

export type ChplManualQueueGroup = 'A' | 'B' | 'C' | 'D' | 'E';
export type ChplManualQueuePriority = 'critical' | 'high' | 'medium' | 'standard';

/**
 * Pozycja w ustrukturyzowanej kolejce ręcznego audytu dokumentacji ChPL (Zadanie 4 PROMPT 23).
 */
export interface ChplManualQueueItem {
  procedureId: string;
  aliasId?: string;
  shortCode: string;
  disease: string;
  obligationType: VaccineObligationType;
  psoPartAndPage: string;
  queueGroup: ChplManualQueueGroup;
  queueGroupLabel: string;
  priority: ChplManualQueuePriority;
  currentChplReferenceStatus: ChplReferenceStatus;
  currentChplContentStatus: ChplContentVerificationStatus;
  currentChplVerificationStatus: ChplVerificationStatus;
  currentProductLinkageStatus: ProductLinkageStatus;
  linkedVaccineIds: string[];
  officialChplSources: string[];
  missingDocumentsOrActions: string[];
  auditReason: string;
}

export interface FundingScopeAuditEntry {
  scopeId: string;
  label: string;
  fundingStatus: FundingVerificationStatus | 'regional_pool_closed';
  isPediatricSelectable: boolean;
  seasonalAvailabilityStatus?: SeasonalAvailabilityStatus;
  audienceContext?: FundingScopeBreakdown['audienceContext'];
}

export interface PendingFundingProcedureDetail {
  procedureId: string;
  shortCode: string;
  disease: string;
  procedureFundingStatus: FundingVerificationStatus;
  stayPendingReason: string;
  confirmedScopes: FundingScopeAuditEntry[];
  pendingOrClosedScopes: FundingScopeAuditEntry[];
}

export interface PendingFundingAuditReport {
  pendingProceduresCount: number;
  pendingProcedureIds: string[];
  details: PendingFundingProcedureDetail[];
}

export type Stage1ChplProductKey =
  | 'influvac_2026_2027'
  | 'vaxigrip_2026_2027'
  | 'spikevax_xfg'
  | 'bcg_10';

export type Stage1ChplCheckOutcome =
  | 'ok'
  | 'ambiguity_flagged'
  | 'missing_in_document'
  | 'extrapolation_note';

/**
 * Raport (a): Techniczna weryfikacja źródła, wersji, skrótu SHA-256 i metadanych pliku PDF ChPL.
 */
export interface Stage1ChplSourceCheck {
  productKey: Stage1ChplProductKey;
  productName: string;
  relatedProcedureIds: string[];
  rplOrEmaId: string;
  officialSourceUrl: string;
  httpStatus: number;
  contentDispositionOrLastModified: string;
  fileSizeBytes: number;
  fileSha256: string;
  pageCount: number;
  marketingAuthorizationHolder: string;
  authorizationNumber: string;
  seasonOrVariant: string;
  documentDateInSection10: string | null;
  sourceCheckStatus: 'verified_match' | 'verified_with_metadata_gap';
  technicalNotes: string;
}

/**
 * Pojedynczy wiersz arkusza treści ChPL dla sekcji 1–10 lub podpunktów klinicznych 4.1–4.9.
 */
export interface Stage1ChplSubpointAudit {
  sectionNumber: ChplAuditSectionNumber;
  subpointNumber: string;
  pageRef: string;
  conciseSummary: string;
  checkOutcome: Stage1ChplCheckOutcome;
  discrepancyOrAmbiguity: string | null;
  sourceExcerptRef: string;
}

/**
 * Raport (b): Roboczy arkusz analizy treści ChPL I etapu (sekcje 1–10 oraz 4.1–4.9) bez awansu do verified_full.
 */
export interface Stage1ChplContentSheet {
  productKey: Stage1ChplProductKey;
  productName: string;
  relatedProcedureIds: string[];
  preparatoryAuditorLabel: string;
  targetStatusAfterStage1: 'pending_content_audit';
  entries: Stage1ChplSubpointAudit[];
}

/**
 * Raport (c): Lista brakujących danych w dokumentach źródłowych, rejestrach lub powiązaniach katalogowych.
 */
export interface Stage1MissingDataItem {
  id: string;
  productKey: Stage1ChplProductKey;
  relatedProcedureIds: string[];
  category:
    | 'document_metadata'
    | 'rpl_index_vs_pdf'
    | 'gtin_linkage'
    | 'clinical_subsection'
    | 'market_availability'
    | 'source_url_limitation';
  missingElement: string;
  observedFact: string;
  impactOnVerification: string;
}

/**
 * Raport (d): Lista pytań i niejednoznaczności wymagających wiążącej decyzji kompetentnego audytora klinicznego.
 */
export interface Stage1HumanDecisionItem {
  id: string;
  productKey: Stage1ChplProductKey;
  relatedProcedureIds: string[];
  chplSectionOrSubpoint: string;
  pageRef: string;
  clinicalQuestion: string;
  ambiguitySummary: string;
  requiresCompetentClinicalAuditorDecision: true;
  autoResolved: false;
}

/**
 * Kompletny pakiet I etapu przygotowawczego audytu ChPL dla 4 preparatów (rozdział audytu technicznego od klinicznego).
 */
export interface Stage1ChplAuditBundle {
  generatedAt: string;
  preparatoryExtractorNote: string;
  targetProcedureStatusBefore: 'pending_content_audit';
  targetProcedureStatusAfter: 'pending_content_audit';
  sourceAndVersionReport: Stage1ChplSourceCheck[];
  contentAnalysisSheets: Stage1ChplContentSheet[];
  missingDataReport: Stage1MissingDataItem[];
  humanDecisionChecklist: Stage1HumanDecisionItem[];
}
