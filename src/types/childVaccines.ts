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
  sourceTableRow: string | null;                // Nazwa szczepienia lub wiersza tabeli (np. "GRUŹLICY", "BŁONICY, TĘŻCOWI, KRZTUŚCOWI")
  sourceAgeBand: string | null;                 // Wiek z tabeli (np. "Od 1. doby życia do wypisu ze szpitala")
  sourcePrintedPage: number;                    // Drukowana numeracja strony Dziennika Urzędowego MZ (strony 4–44)
  sourcePdfPage: number;                        // Fizyczny numer strony w pliku akt.pdf

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
