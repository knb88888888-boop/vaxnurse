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
 * Pełny zapis audytu treści ChPL — wymagany przed awansem do statusu 'verified_full'.
 */
export interface ChplContentAuditRecord {
  productName: string;
  officialSourceUrl: string;
  documentIdOrAuthorizationNumber: string;
  /** Data dokumentu (np. z pkt 10 ChPL) lub jawnie 'Brak informacji w dokumencie' */
  documentVersionOrDate: string;
  auditDate: string;
  auditor: string;
  verifiedSectionsScope: string[];
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
  marketAvailabilityStatus: 'unconfirmed_in_poland';
  marketAvailabilityNote: string;
}

/**
 * Osobna dokumentacja źródeł i warunków finansowania (odrębna od samego wpisu do PSO).
 */
export interface FundingAuditDetails {
  legalBasis: string;
  targetGroup: string;
  conditions: string;
  validityOrVerifiedDate: string;
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

  // Granularne statusy weryfikacji (Punkt 5 audytu + PROMPT 18 + PROMPT 19)
  psoVerificationStatus: PsoVerificationStatus;
  chplReferenceStatus: ChplReferenceStatus;
  chplContentVerificationStatus: ChplContentVerificationStatus;
  chplVerificationStatus: ChplVerificationStatus;
  fundingVerificationStatus: FundingVerificationStatus;
  productLinkageStatus: ProductLinkageStatus;
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
