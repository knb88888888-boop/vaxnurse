import type {
  VaccineProduct,
  VaccineVerificationStatus,
  VaccineType,
  VaccineTargetGroup,
  ChPLSectionReference
} from '../types/vaccines';

export const VERIFICATION_STATUS_META: Record<
  VaccineVerificationStatus,
  { label: string; description: string; badgeClass: string; isVerified: boolean }
> = {
  uncompleted: {
    label: 'Nieuzupełniony',
    description: 'Karta preparatu w fazie tworzenia szkieletu struktury. Brak danych ChPL.',
    badgeClass: 'status-uncompleted',
    isVerified: false
  },
  pending_verification: {
    label: 'Oczekuje na weryfikację',
    description: 'Struktura gotowa do wprowadzenia i porównania z aktualnym drukiem ChPL w RPL.',
    badgeClass: 'status-pending',
    isVerified: false
  },
  verified_chpl: {
    label: 'Zweryfikowany na podstawie ChPL',
    description: 'Wszystkie punkty zostały zweryfikowane z oficjalnym drukiem ChPL z Rejestru Produktów Leczniczych.',
    badgeClass: 'status-verified',
    isVerified: true
  },
  requires_reverification: {
    label: 'Wymaga ponownej weryfikacji',
    description: 'Pojawiła się nowa wersja komunikatu ChPL lub zmiana w rejestrze RPL wymagająca sprawdzenia.',
    badgeClass: 'status-reverify',
    isVerified: false
  }
};

export const VACCINE_TYPE_LABELS: Record<VaccineType, string> = {
  zywa_atenuowana: 'Żywa atenuowana',
  inaktywowana: 'Inaktywowana (zabita)',
  podjednostkowa: 'Podjednostkowa / bezkomórkowa',
  sprzezona: 'Sprzężona',
  toksoidowa: 'Toksoidowa (anatoksyna)',
  rekombinowana: 'Rekombinowana',
  mrna: 'mRNA',
  inna: 'Inny rodzaj'
};

export const TARGET_GROUP_LABELS: Record<VaccineTargetGroup, string> = {
  pediatryczna: 'Dzieci i młodzież',
  dorosli: 'Dorośli',
  uniwersalna: 'Dzieci i dorośli'
};

// Pomocnik do tworzenia pustych, ustrukturyzowanych sekcji klinicznych ChPL
const createEmptyChPLSection = (
  sectionNumber: string,
  sectionTitle: string
): ChPLSectionReference => ({
  sectionNumber,
  sectionTitle,
  content: null, // Zgodnie z wytycznymi: nie uzupełniamy jeszcze treści klinicznych domysłami
  officialSource: 'Oficjalna Charakterystyka Produktu Leczniczego (RPL)',
  isVerified: false,
  verificationNote: 'Treść oczekuje na weryfikację z aktualnym drukiem ChPL'
});

export const VACCINES_CATALOG: VaccineProduct[] = [
  {
    id: 'vac-infanrix-hexa',
    tradeName: 'Infanrix Hexa',
    activeSubstance: 'DTPa-HBV-IPV+Hib (toksoid błoniczy, toksoid tężcowy, antygeny krztuśca, HBsAg, poliowirusy inaktywowane, polisacharyd Hib)',
    manufacturer: 'GlaxoSmithKline Biologicals S.A.',
    pharmaceuticalForm: 'Proszek i zawiesina do sporządzania zawiesiny do wstrzykiwań',
    vaccineType: 'podjednostkowa',
    targetGroup: 'pediatryczna',
    marketingAuthorizationNumber: 'EU/1/00/152/001',
    rplRecordUrl: 'https://rejestrymedyczne.ezdrowie.gov.pl/rpl/search/public',
    currentChplUrl: 'https://rejestrymedyczne.ezdrowie.gov.pl/rpl/search/public',
    chplVersionDate: null,
    lastVerifiedDate: '10.11.2026',
    verificationStatus: 'pending_verification',
    atcCode: 'J07CA09',
    sections: {
      basicInfo: {
        packagingInfo: null,
        solventInfo: null,
        needleInfo: null
      },
      qualitativeComposition: createEmptyChPLSection('2', 'Skład jakościowy i ilościowy'),
      pharmaceuticalFormDetails: createEmptyChPLSection('3', 'Postać farmaceutyczna'),
      indications: createEmptyChPLSection('4.1', 'Wskazania do stosowania'),
      dosageAndAdministration: createEmptyChPLSection('4.2', 'Dawkowanie i sposób podawania'),
      contraindications: createEmptyChPLSection('4.3', 'Przeciwwskazania'),
      warningsAndPrecautions: createEmptyChPLSection('4.4', 'Specjalne ostrzeżenia i środki ostrożności dotyczące stosowania'),
      interactions: createEmptyChPLSection('4.5', 'Interakcje z innymi produktami leczniczymymi i inne rodzaje interakcji'),
      pregnancyAndLactation: createEmptyChPLSection('4.6', 'Wpływ na płodność, ciążę i laktację'),
      adverseEffects: createEmptyChPLSection('4.8', 'Działania niepożądane'),
      storageConditions: createEmptyChPLSection('6.4', 'Specjalne środki ostrożności podczas przechowywania'),
      marketingAuthorizationHolder: createEmptyChPLSection('7', 'Podmiot odpowiedzialny posiadający pozwolenie na dopuszczenie do obrotu'),
      documentationHistory: {
        authorizationDate: null,
        lastRevisionDate: null,
        registrySource: 'Rejestr Produktów Leczniczych eZdrowie / EMA',
        notes: 'Rekord przygotowany w strukturze VaxNurse. Treści kliniczne oczekują na wprowadzenie i sprawdzenie z oficjalną ChPL.'
      }
    }
  },
  {
    id: 'vac-priorix',
    tradeName: 'Priorix',
    activeSubstance: 'Szczepionka przeciw odrze, śwince i różyczce (żywa, atenuowana)',
    manufacturer: 'GlaxoSmithKline Biologicals S.A.',
    pharmaceuticalForm: 'Proszek i rozpuszczalnik do sporządzania roztworu do wstrzykiwań w ampułko-strzykawce',
    vaccineType: 'zywa_atenuowana',
    targetGroup: 'uniwersalna',
    marketingAuthorizationNumber: '6758',
    rplRecordUrl: 'https://rejestrymedyczne.ezdrowie.gov.pl/rpl/search/public',
    currentChplUrl: 'https://rejestrymedyczne.ezdrowie.gov.pl/rpl/search/public',
    chplVersionDate: null,
    lastVerifiedDate: '10.11.2026',
    verificationStatus: 'pending_verification',
    atcCode: 'J07BD52',
    sections: {
      basicInfo: {
        packagingInfo: null,
        solventInfo: null,
        needleInfo: null
      },
      qualitativeComposition: createEmptyChPLSection('2', 'Skład jakościowy i ilościowy'),
      pharmaceuticalFormDetails: createEmptyChPLSection('3', 'Postać farmaceutyczna'),
      indications: createEmptyChPLSection('4.1', 'Wskazania do stosowania'),
      dosageAndAdministration: createEmptyChPLSection('4.2', 'Dawkowanie i sposób podawania'),
      contraindications: createEmptyChPLSection('4.3', 'Przeciwwskazania'),
      warningsAndPrecautions: createEmptyChPLSection('4.4', 'Specjalne ostrzeżenia i środki ostrożności dotyczące stosowania'),
      interactions: createEmptyChPLSection('4.5', 'Interakcje z innymi produktami leczniczymymi i inne rodzaje interakcji'),
      pregnancyAndLactation: createEmptyChPLSection('4.6', 'Wpływ na płodność, ciążę i laktację'),
      adverseEffects: createEmptyChPLSection('4.8', 'Działania niepożądane'),
      storageConditions: createEmptyChPLSection('6.4', 'Specjalne środki ostrożności podczas przechowywania'),
      marketingAuthorizationHolder: createEmptyChPLSection('7', 'Podmiot odpowiedzialny posiadający pozwolenie na dopuszczenie do obrotu'),
      documentationHistory: {
        authorizationDate: null,
        lastRevisionDate: null,
        registrySource: 'Rejestr Produktów Leczniczych eZdrowie',
        notes: 'Szczepionka żywa atenuowana. Treści kliniczne oczekują na weryfikację z aktualnym drukiem ChPL.'
      }
    }
  },
  {
    id: 'vac-prevenar-13',
    tradeName: 'Prevenar 13',
    activeSubstance: 'Pneumokokowa polisacharydowa skoniugowana szczepionka (13-walentna, adsorbowana)',
    manufacturer: 'Pfizer Europe MA EEIG',
    pharmaceuticalForm: 'Zawiesina do wstrzykiwań w ampułko-strzykawce',
    vaccineType: 'sprzezona',
    targetGroup: 'uniwersalna',
    marketingAuthorizationNumber: 'EU/1/09/590/002',
    rplRecordUrl: 'https://rejestrymedyczne.ezdrowie.gov.pl/rpl/search/public',
    currentChplUrl: 'https://rejestrymedyczne.ezdrowie.gov.pl/rpl/search/public',
    chplVersionDate: null,
    lastVerifiedDate: '10.11.2026',
    verificationStatus: 'pending_verification',
    atcCode: 'J07AL02',
    sections: {
      basicInfo: {
        packagingInfo: null,
        solventInfo: null,
        needleInfo: null
      },
      qualitativeComposition: createEmptyChPLSection('2', 'Skład jakościowy i ilościowy'),
      pharmaceuticalFormDetails: createEmptyChPLSection('3', 'Postać farmaceutyczna'),
      indications: createEmptyChPLSection('4.1', 'Wskazania do stosowania'),
      dosageAndAdministration: createEmptyChPLSection('4.2', 'Dawkowanie i sposób podawania'),
      contraindications: createEmptyChPLSection('4.3', 'Przeciwwskazania'),
      warningsAndPrecautions: createEmptyChPLSection('4.4', 'Specjalne ostrzeżenia i środki ostrożności dotyczące stosowania'),
      interactions: createEmptyChPLSection('4.5', 'Interakcje z innymi produktami leczniczymymi i inne rodzaje interakcji'),
      pregnancyAndLactation: createEmptyChPLSection('4.6', 'Wpływ na płodność, ciążę i laktację'),
      adverseEffects: createEmptyChPLSection('4.8', 'Działania niepożądane'),
      storageConditions: createEmptyChPLSection('6.4', 'Specjalne środki ostrożności podczas przechowywania'),
      marketingAuthorizationHolder: createEmptyChPLSection('7', 'Podmiot odpowiedzialny posiadający pozwolenie na dopuszczenie do obrotu'),
      documentationHistory: {
        authorizationDate: null,
        lastRevisionDate: null,
        registrySource: 'Rejestr Produktów Leczniczych eZdrowie / EMA',
        notes: 'Szczepionka skoniugowana. Pola kliniczne oczekują na formalne przypisanie z ChPL.'
      }
    }
  },
  {
    id: 'vac-engerix-b',
    tradeName: 'Engerix B',
    activeSubstance: 'Wirusowe zapalenie wątroby typu B (antygen rekombinowany HBsAg)',
    manufacturer: 'GlaxoSmithKline Biologicals S.A.',
    pharmaceuticalForm: 'Zawiesina do wstrzykiwań w ampułko-strzykawce',
    vaccineType: 'rekombinowana',
    targetGroup: 'uniwersalna',
    marketingAuthorizationNumber: 'R/0695',
    rplRecordUrl: 'https://rejestrymedyczne.ezdrowie.gov.pl/rpl/search/public',
    currentChplUrl: 'https://rejestrymedyczne.ezdrowie.gov.pl/rpl/search/public',
    chplVersionDate: null,
    lastVerifiedDate: '10.11.2026',
    verificationStatus: 'pending_verification',
    atcCode: 'J07BC01',
    sections: {
      basicInfo: {
        packagingInfo: null,
        solventInfo: null,
        needleInfo: null
      },
      qualitativeComposition: createEmptyChPLSection('2', 'Skład jakościowy i ilościowy'),
      pharmaceuticalFormDetails: createEmptyChPLSection('3', 'Postać farmaceutyczna'),
      indications: createEmptyChPLSection('4.1', 'Wskazania do stosowania'),
      dosageAndAdministration: createEmptyChPLSection('4.2', 'Dawkowanie i sposób podawania'),
      contraindications: createEmptyChPLSection('4.3', 'Przeciwwskazania'),
      warningsAndPrecautions: createEmptyChPLSection('4.4', 'Specjalne ostrzeżenia i środki ostrożności dotyczące stosowania'),
      interactions: createEmptyChPLSection('4.5', 'Interakcje z innymi produktami leczniczymymi i inne rodzaje interakcji'),
      pregnancyAndLactation: createEmptyChPLSection('4.6', 'Wpływ na płodność, ciążę i laktację'),
      adverseEffects: createEmptyChPLSection('4.8', 'Działania niepożądane'),
      storageConditions: createEmptyChPLSection('6.4', 'Specjalne środki ostrożności podczas przechowywania'),
      marketingAuthorizationHolder: createEmptyChPLSection('7', 'Podmiot odpowiedzialny posiadający pozwolenie na dopuszczenie do obrotu'),
      documentationHistory: {
        authorizationDate: null,
        lastRevisionDate: null,
        registrySource: 'Rejestr Produktów Leczniczych eZdrowie',
        notes: 'Szczepionka przeciw WZW B. Treści kliniczne oczekują na weryfikację z ChPL.'
      }
    }
  },
  {
    id: 'vac-boostrix',
    tradeName: 'Boostrix',
    activeSubstance: 'Szczepionka przeciw błonicy, tężcowi i krztuścowi (bezkomórkowa, adsorbowana, o zmniejszonej zawartości antygenów)',
    manufacturer: 'GlaxoSmithKline Biologicals S.A.',
    pharmaceuticalForm: 'Zawiesina do wstrzykiwań w ampułko-strzykawce',
    vaccineType: 'toksoidowa',
    targetGroup: 'uniwersalna',
    marketingAuthorizationNumber: '9211',
    rplRecordUrl: 'https://rejestrymedyczne.ezdrowie.gov.pl/rpl/search/public',
    currentChplUrl: 'https://rejestrymedyczne.ezdrowie.gov.pl/rpl/search/public',
    chplVersionDate: null,
    lastVerifiedDate: '10.11.2026',
    verificationStatus: 'pending_verification',
    atcCode: 'J07AM51',
    sections: {
      basicInfo: {
        packagingInfo: null,
        solventInfo: null,
        needleInfo: null
      },
      qualitativeComposition: createEmptyChPLSection('2', 'Skład jakościowy i ilościowy'),
      pharmaceuticalFormDetails: createEmptyChPLSection('3', 'Postać farmaceutyczna'),
      indications: createEmptyChPLSection('4.1', 'Wskazania do stosowania'),
      dosageAndAdministration: createEmptyChPLSection('4.2', 'Dawkowanie i sposób podawania'),
      contraindications: createEmptyChPLSection('4.3', 'Przeciwwskazania'),
      warningsAndPrecautions: createEmptyChPLSection('4.4', 'Specjalne ostrzeżenia i środki ostrożności dotyczące stosowania'),
      interactions: createEmptyChPLSection('4.5', 'Interakcje z innymi produktami leczniczymymi i inne rodzaje interakcji'),
      pregnancyAndLactation: createEmptyChPLSection('4.6', 'Wpływ na płodność, ciążę i laktację'),
      adverseEffects: createEmptyChPLSection('4.8', 'Działania niepożądane'),
      storageConditions: createEmptyChPLSection('6.4', 'Specjalne środki ostrożności podczas przechowywania'),
      marketingAuthorizationHolder: createEmptyChPLSection('7', 'Podmiot odpowiedzialny posiadający pozwolenie na dopuszczenie do obrotu'),
      documentationHistory: {
        authorizationDate: null,
        lastRevisionDate: null,
        registrySource: 'Rejestr Produktów Leczniczych eZdrowie',
        notes: 'Szczepionka przypominająca dTap dla młodzieży i dorosłych. Oczekuje na weryfikację z ChPL.'
      }
    }
  },
  {
    id: 'vac-vaxigrip-tetra',
    tradeName: 'VaxigripTetra',
    activeSubstance: 'Czterowalentna szczepionka przeciw grypie (rozszczepiony wirion, inaktywowana)',
    manufacturer: 'Sanofi Pasteur',
    pharmaceuticalForm: 'Zawiesina do wstrzykiwań w ampułko-strzykawce',
    vaccineType: 'inaktywowana',
    targetGroup: 'uniwersalna',
    marketingAuthorizationNumber: 'EU/1/16/1097/001',
    rplRecordUrl: 'https://rejestrymedyczne.ezdrowie.gov.pl/rpl/search/public',
    currentChplUrl: 'https://rejestrymedyczne.ezdrowie.gov.pl/rpl/search/public',
    chplVersionDate: null,
    lastVerifiedDate: '10.11.2026',
    verificationStatus: 'uncompleted',
    atcCode: 'J07CA01',
    sections: {
      basicInfo: {
        packagingInfo: null,
        solventInfo: null,
        needleInfo: null
      },
      qualitativeComposition: createEmptyChPLSection('2', 'Skład jakościowy i ilościowy'),
      pharmaceuticalFormDetails: createEmptyChPLSection('3', 'Postać farmaceutyczna'),
      indications: createEmptyChPLSection('4.1', 'Wskazania do stosowania'),
      dosageAndAdministration: createEmptyChPLSection('4.2', 'Dawkowanie i sposób podawania'),
      contraindications: createEmptyChPLSection('4.3', 'Przeciwwskazania'),
      warningsAndPrecautions: createEmptyChPLSection('4.4', 'Specjalne ostrzeżenia i środki ostrożności dotyczące stosowania'),
      interactions: createEmptyChPLSection('4.5', 'Interakcje z innymi produktami leczniczymymi i inne rodzaje interakcji'),
      pregnancyAndLactation: createEmptyChPLSection('4.6', 'Wpływ na płodność, ciążę i laktację'),
      adverseEffects: createEmptyChPLSection('4.8', 'Działania niepożądane'),
      storageConditions: createEmptyChPLSection('6.4', 'Specjalne środki ostrożności podczas przechowywania'),
      marketingAuthorizationHolder: createEmptyChPLSection('7', 'Podmiot odpowiedzialny posiadający pozwolenie na dopuszczenie do obrotu'),
      documentationHistory: {
        authorizationDate: null,
        lastRevisionDate: null,
        registrySource: 'Rejestr Produktów Leczniczych eZdrowie / EMA',
        notes: 'Szczepionka przeciw grypie. Skład szczepów aktualizowany corocznie przez WHO. Karta nieuzupełniona.'
      }
    }
  }
];
