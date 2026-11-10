export type VaccineObligationType = 'obowiazkowe' | 'zalecane';

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
  psoPart: string;                              // Numer części PSO (np. "Część I.A", "Część I.B", "Część II")
  psoPointOrSubpoint: string;                   // Punkt lub podpunkt PSO (np. "Punkt 1", "Punkt 2", "Punkt 1.1")
  psoPdfPage: number;                           // Strona w oficjalnym PDF Dz. Urz. Min. Zdrow. 2026 poz. 77
  psoSection: string;                           // Pełna etykieta sekcji PSO
  psoOfficialUrl: string;                       // Oficjalny link GIS / Dziennik Urzędowy MZ
  psoLegalAct: string;                          // Podstawa prawna aktu
  psoPublicationDate: string;                   // Data publikacji aktu ("28.10.2026")
  clinicalNotes: string;                        // Wskazówki wykonawcze dla personelu
  contraindicationsOrWarnings: string | null;   // Ważne ostrzeżenia i uwagi specyficzne
  fundingStatus: string;                        // Informacja o refundacji / odpłatności
  fundingSource: 'mz_budget' | 'free_public_program' | 'self_funded' | 'mixed';
  officialFundingSourceRef: string | null;      // Osobne urzędowe źródło podstawy finansowania / ustawy
  linkedVaccineIds: string[];                   // Identyfikatory w katalogu preparatów (np. ['vac-infanrix-hexa'])
  chplReference: string | null;                 // Numer punktu z ChPL produktu (np. "ChPL Infanrix hexa pkt 4.2")
  alternativeCombinedOptions: string | null;    // Opcja zastąpienia szczepionkami skojarzonymi (5w1 / 6w1)
  verificationStatus: ChildVaccineVerificationStatus; // Status weryfikacji z oficjalnym komunikatem
  lastVerifiedDate: string;                     // Data weryfikacji rekordu
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
 * Zasady szczepień wyrównawczych (Część V PSO 2027).
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
