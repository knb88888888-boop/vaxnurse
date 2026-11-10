export type VaccineVerificationStatus =
  | 'uncompleted'              // Nieuzupełniony
  | 'pending_verification'     // Oczekuje na weryfikację
  | 'verified_chpl'            // Zweryfikowany na podstawie ChPL
  | 'requires_reverification'; // Wymaga ponownej weryfikacji

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

export interface ChPLSectionReference {
  sectionNumber: string;       // np. "2", "3", "4.1", "4.2", "4.3", "4.4", "4.5", "4.6", "4.8", "6.4", "7"
  sectionTitle: string;        // Oficjalny tytuł punktu ChPL
  content: string | null;      // Treść kliniczna (null dopóki nie zostanie zweryfikowana z ChPL)
  officialSource: string | null; // Nazwa oficjalnego dokumentu źródłowego
  isVerified: boolean;         // Czy treść jest potwierdzona
  verificationNote: string | null;
}

export interface VaccineProduct {
  id: string;                                   // Unikalne ID
  tradeName: string;                            // Nazwa handlowa
  activeSubstance: string;                      // Substancja czynna / antygeny
  manufacturer: string;                         // Producent lub podmiot odpowiedzialny
  pharmaceuticalForm: string;                   // Postać farmaceutyczna
  vaccineType: VaccineType;                     // Rodzaj szczepionki
  targetGroup: VaccineTargetGroup;              // Grupa docelowa
  marketingAuthorizationNumber: string | null;  // Numer pozwolenia na dopuszczenie do obrotu
  rplRecordUrl: string | null;                  // Adres rekordu w RPL
  currentChplUrl: string | null;                // Adres aktualnej ChPL
  chplVersionDate: string | null;               // Data wersji ChPL
  lastVerifiedDate: string | null;              // Data ostatniej weryfikacji
  verificationStatus: VaccineVerificationStatus;// Status weryfikacji
  atcCode: string | null;                       // Kod ATC (np. J07)

  // 13 Ustrukturyzowanych Sekcji Karty Preparatu
  sections: {
    basicInfo: {
      packagingInfo: string | null;
      solventInfo: string | null;
      needleInfo: string | null;
    };
    qualitativeComposition: ChPLSectionReference;   // 2. Skład jakościowy i ilościowy
    pharmaceuticalFormDetails: ChPLSectionReference;// 3. Postać farmaceutyczna
    indications: ChPLSectionReference;              // 4. Wskazania do stosowania (4.1)
    dosageAndAdministration: ChPLSectionReference;  // 5. Dawkowanie i sposób podawania (4.2)
    contraindications: ChPLSectionReference;        // 6. Przeciwwskazania (4.3)
    warningsAndPrecautions: ChPLSectionReference;   // 7. Ostrzeżenia i środki ostrożności (4.4)
    interactions: ChPLSectionReference;             // 8. Interakcje (4.5)
    pregnancyAndLactation: ChPLSectionReference;    // 9. Stosowanie w ciąży i podczas karmienia (4.6)
    adverseEffects: ChPLSectionReference;           // 10. Działania niepożądane (4.8)
    storageConditions: ChPLSectionReference;        // 11. Warunki przechowywania (6.4)
    marketingAuthorizationHolder: ChPLSectionReference; // 12. Podmiot odpowiedzialny (7)
    documentationHistory: {                         // 13. Dokumentacja i historia wersji ChPL
      authorizationDate: string | null;
      lastRevisionDate: string | null;
      registrySource: string;
      notes: string | null;
    };
  };
}
