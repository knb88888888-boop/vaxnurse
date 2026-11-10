export type VaccineVerificationStatus =
  | 'uncompleted'              // Nieuzupełniony
  | 'pending_verification'     // Oczekuje na weryfikację
  | 'verified_chpl'            // Zweryfikowany na podstawie ChPL
  | 'requires_reverification'; // Wymaga ponownej weryfikacji

export type DiscrepancyStatus =
  | 'requires_clarification'   // Oczekuje na wyjaśnienie urzędowe
  | 'resolved';                // Wyjaśnione / sprostowane

/**
 * Informacja o rozbieżnościach / niezgodnościach w oficjalnych dokumentach źródłowych (np. wewnętrzne sprzeczności w tekście ChPL).
 */
export interface SourceDiscrepancy {
  id: string;                                   // Identyfikator niezgodności
  fieldName: string;                            // Nazwa pola (np. "Zawartość fenyloalaniny na dawkę")
  firstValue: string;                           // Pierwsza wartość (np. "0,0289 mikrograma na dawkę")
  firstSection: string;                         // Numer sekcji źródłowej (np. "2")
  secondValue: string;                          // Druga wartość (np. "0,0298 mikrograma na dawkę")
  secondSection: string;                        // Numer sekcji źródłowej (np. "4.4")
  documentUrl: string;                          // Link do dokumentu źródłowego
  status: DiscrepancyStatus;                    // Status (np. 'requires_clarification')
  description: string;                          // Opis niezgodności
}

export type VaccineType =
  | 'zywa_atenuowana'
  | 'inaktywowana'
  | 'podjednostkowa'
  | 'sprzezona'
  | 'toksoidowa'
  | 'rekombinowana'
  | 'mrna'
  | 'inna';

export type VaccineTargetGroup =
  | 'pediatryczna'  // Dzieci i młodzież
  | 'dorosli'       // Dorośli
  | 'uniwersalna';  // Dzieci i dorośli

/**
 * Pojedynczy punkt lub podpunkt ChPL zgodny z EMA QRD Product Information Template v10.4 (02/2024).
 * Każdy punkt posiada numerację, oficjalny tytuł, pole na treść, źródło, numer strony PDF, datę wersji oraz status weryfikacji.
 */
export interface ChPLSection {
  sectionNumber: string;                       // np. "1", "2", "3", "4.1", ..., "5.1", ..., "6.4", "7", "8", "9", "10"
  sectionTitle: string;                        // Oficjalny tytuł sekcji wg EMA QRD 10.4
  content: string | null;                      // Miejsce na treść (null jeśli brak danych w dokumencie lub niezweryfikowane)
  officialSource: string | null;               // Nazwa oficjalnego dokumentu źródłowego
  pdfPageNumber: number | string | null;       // Numer strony w oficjalnym PDF (jeśli dostępny)
  sourceDocumentUrl: string | null;            // Bezpośredni adres URL dokumentu źródłowego
  chplVersionDate: string | null;              // Data wersji ChPL
  verificationStatus: VaccineVerificationStatus;// Status weryfikacji danego punktu
  verificationNote: string | null;             // Notatka techniczno-weryfikacyjna
}

/**
 * Pełna struktura 10 głównych punktów Charakterystyki Produktu Leczniczego (EMA QRD v10.4).
 */
export interface ChPLStructure {
  // 1. Nazwa produktu leczniczego
  name: ChPLSection;

  // 2. Skład jakościowy i ilościowy
  composition: ChPLSection;

  // 3. Postać farmaceutyczna
  pharmaceuticalForm: ChPLSection;

  // 4. Szczegółowe dane kliniczne
  clinicalParticulars: {
    indications: ChPLSection;                  // 4.1 Wskazania do stosowania
    dosageAndAdministration: ChPLSection;      // 4.2 Dawkowanie i sposób podawania
    contraindications: ChPLSection;            // 4.3 Przeciwwskazania
    warningsAndPrecautions: ChPLSection;       // 4.4 Specjalne ostrzeżenia i środki ostrożności dotyczące stosowania
    interactions: ChPLSection;                 // 4.5 Interakcje z innymi produktami leczniczymi i inne rodzaje interakcji
    fertilityPregnancyLactation: ChPLSection;  // 4.6 Wpływ na płodność, ciążę i laktację
    driveAndMachines: ChPLSection;             // 4.7 Wpływ na zdolność prowadzenia pojazdów i obsługiwania maszyn
    undesirableEffects: ChPLSection;           // 4.8 Działania niepożądane
    overdose: ChPLSection;                     // 4.9 Przedawkowanie
  };

  // 5. Właściwości farmakologiczne
  pharmacologicalProperties: {
    pharmacodynamics: ChPLSection;             // 5.1 Właściwości farmakodynamiczne (w tym kod ATC)
    pharmacokinetics: ChPLSection;             // 5.2 Właściwości farmakokinetyczne
    preclinicalSafety: ChPLSection;            // 5.3 Przedkliniczne dane o bezpieczeństwie
  };

  // 6. Dane farmaceutyczne
  pharmaceuticalParticulars: {
    excipients: ChPLSection;                   // 6.1 Wykaz substancji pomocniczych
    incompatibilities: ChPLSection;            // 6.2 Niezgodności farmaceutyczne
    shelfLife: ChPLSection;                    // 6.3 Okres ważności
    storageSpecialPrecautions: ChPLSection;    // 6.4 Specjalne środki ostrożności podczas przechowywania
    containerNatureAndContents: ChPLSection;   // 6.5 Rodzaj i zawartość opakowania
    disposalAndHandling: ChPLSection;          // 6.6 Specjalne środki ostrożności dotyczące usuwania i przygotowania
  };

  // 7. Podmiot odpowiedzialny posiadający pozwolenie na dopuszczenie do obrotu
  marketingAuthorisationHolder: ChPLSection;

  // 8. Numer(-y) pozwolenia na dopuszczenie do obrotu
  marketingAuthorisationNumber: ChPLSection;

  // 9. Data wydania pierwszego pozwolenia na dopuszczenie do obrotu i data przedłużenia pozwolenia
  firstAuthorisationAndRenewal: ChPLSection;

  // 10. Data zatwierdzenia lub częściowej zmiany tekstu charakterystyki produktu leczniczego
  revisionDate: ChPLSection;
}

/**
 * Model preparatu szczepionkowego w systemie VaxNurse.
 */
export interface VaccineProduct {
  id: string;                                   // Unikalne ID
  tradeName: string;                            // Nazwa handlowa
  activeSubstance: string;                      // Substancja czynna / antygeny
  manufacturer: string;                         // Producent lub podmiot odpowiedzialny
  pharmaceuticalForm: string;                   // Postać farmaceutyczna
  vaccineType: VaccineType;                     // Rodzaj szczepionki
  targetGroup: VaccineTargetGroup;              // Grupa docelowa
  marketingAuthorizationNumber: string | null;  // Numer pozwolenia na dopuszczenie do obrotu (Pkt 8 ChPL)
  rplRecordUrl: string | null;                  // Adres rekordu w RPL (null w przypadku braku jednoznacznego permalinka)
  currentChplUrl: string | null;                // Adres aktualnej ChPL (np. oficjalny PDF podmiotu odpowiedzialnego / EMA)
  chplRevisionDate: string | null;              // Data sporządzenia / rewizji tekstu ChPL (Pkt 10 ChPL)
  chplVersionDate: string | null;               // Kompatybilność wsteczna (alias chplRevisionDate)
  documentDownloadDate: string | null;          // Data pobrania / pozyskania dokumentu źródłowego
  userVerificationDate: string | null;          // Data ręcznej weryfikacji przez użytkownika (personel medyczny)
  userVerificationNotes: string | null;         // Notatki personelu medycznego z weryfikacji
  verificationStatus: VaccineVerificationStatus;// Status weryfikacji całego rekordu (początkowo 'pending_verification')
  atcCode: string | null;                       // Kod ATC (Pkt 5.1 ChPL)
  sourceDiscrepancies?: SourceDiscrepancy[];    // Niezgodności / rozbieżności wykryte w źródłach urzędowych

  // Oficjalna struktura ChPL (punkty 1–10 EMA QRD v10.4)
  chpl: ChPLStructure;
}
