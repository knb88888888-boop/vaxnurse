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
  doseLabel: string;                            // Oznaczenie dawki (np. "1. dawka pierwotna")
  administrationRoute: string;                  // Droga podania (i.m., s.c., i.d., p.o.)
  injectionSite: string;                        // Rekomendowane miejsce iniekcji (np. "Przednioboczna część uda")
  minIntervalFromPrevious: string | null;       // Minimalny odstęp od poprzedniej dawki
  psoSection: string;                           // Dokładny punkt PSO 2027 (np. "Część I.A, pkt 1 PSO 2027")
  psoOfficialUrl: string;                       // Oficjalny link GIS (https://www.gov.pl/web/gis/program-szczepien-ochronnych-na-2027-rok)
  psoLegalAct: string;                          // Podstawa prawna (np. "Dz. Urz. Min. Zdrow. 2026 poz. 77")
  psoPublicationDate: string;                   // Data publikacji aktu
  clinicalNotes: string;                        // Wskazówki wykonawcze dla pielęgniarki
  contraindicationsOrWarnings: string | null;   // Ważne ostrzeżenia i uwagi specyficzne
  fundingStatus: string;                        // Informacja o refundacji / odpłatności
  fundingSource: 'mz_budget' | 'free_public_program' | 'self_funded' | 'mixed';
  linkedVaccineIds: string[];                   // Identyfikatory w katalogu preparatów (np. ['vac-infanrix-hexa'])
  alternativeCombinedOptions: string | null;    // Opcja zastąpienia szczepionkami skojarzonymi (5w1 / 6w1)
  verificationStatus: ChildVaccineVerificationStatus; // Status weryfikacji z oficjalnym komunikatem
  lastVerifiedDate: string;                     // Data weryfikacji rekordu
}
