import type {
  VaccineProduct,
  VaccineVerificationStatus,
  VaccineType,
  VaccineTargetGroup,
  ChPLSection,
  ChPLStructure
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
    description: 'Struktura punktów 1–10 gotowa do wprowadzenia i porównania z aktualnym drukiem ChPL w RPL.',
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

// Pomocnik do tworzenia punktu ChPL zgodnego z szablonem EMA QRD v10.4
const createChPLSection = (
  sectionNumber: string,
  sectionTitle: string,
  content: string | null = null,
  status: VaccineVerificationStatus = 'pending_verification',
  note: string | null = 'Punkt oczekuje na weryfikację z aktualnym drukiem ChPL w rejestrze RPL.'
): ChPLSection => ({
  sectionNumber,
  sectionTitle,
  content,
  officialSource: 'Rejestr Produktów Leczniczych (RPL / eZdrowie / URPL)',
  chplVersionDate: null,
  verificationStatus: status,
  verificationNote: note
});

// Pomocnik do budowania pełnej struktury ChPL (punkty 1–10)
const buildChPLStructure = (params: {
  tradeName: string;
  activeSubstance: string;
  pharmaceuticalForm: string;
  atcCode: string | null;
  storageInfo: string | null;
  packagingInfo: string | null;
  handlingInfo: string | null;
  manufacturer: string;
  authorizationNumber: string | null;
  authorizationDates: string | null;
  revisionDate: string | null;
  overallStatus?: VaccineVerificationStatus;
}): ChPLStructure => {
  const status = params.overallStatus || 'pending_verification';

  return {
    name: createChPLSection(
      '1',
      'Nazwa produktu leczniczego',
      params.tradeName,
      status,
      'Nazwa handlowa i postać farmaceutyczna.'
    ),
    composition: createChPLSection(
      '2',
      'Skład jakościowy i ilościowy',
      params.activeSubstance,
      status,
      'Antygeny czynne i substancje pomocnicze o znanym działaniu (szczegóły do weryfikacji w ChPL).'
    ),
    pharmaceuticalForm: createChPLSection(
      '3',
      'Postać farmaceutyczna',
      params.pharmaceuticalForm,
      status,
      'Opis postaci leku i wyglądu preparatu.'
    ),
    clinicalParticulars: {
      indications: createChPLSection(
        '4.1',
        'Wskazania do stosowania',
        null,
        status,
        'Wymaga bezwzględnej weryfikacji w aktualnej ChPL w RPL przed kwalifikacją pacjenta.'
      ),
      dosageAndAdministration: createChPLSection(
        '4.2',
        'Dawkowanie i sposób podawania',
        null,
        status,
        'Wymaga weryfikacji w ChPL. Aplikacja nie generuje dawek ani schematów samodzielnie.'
      ),
      contraindications: createChPLSection(
        '4.3',
        'Przeciwwskazania',
        null,
        status,
        'Wymaga weryfikacji w ChPL. Aplikacja nie generuje przeciwwskazań.'
      ),
      warningsAndPrecautions: createChPLSection(
        '4.4',
        'Specjalne ostrzeżenia i środki ostrożności dotyczące stosowania',
        null,
        status,
        'Zasady dotyczące nadwrażliwości, odczynów i wyposażenia przeciwwstrząsowego.'
      ),
      interactions: createChPLSection(
        '4.5',
        'Interakcje z innymi produktami leczniczymi i inne rodzaje interakcji',
        null,
        status,
        'Zasady jednoczesnego podawania z innymi szczepionkami (do weryfikacji w ChPL).'
      ),
      fertilityPregnancyLactation: createChPLSection(
        '4.6',
        'Wpływ na płodność, ciążę i laktację',
        null,
        status,
        'Do weryfikacji w ChPL.'
      ),
      driveAndMachines: createChPLSection(
        '4.7',
        'Wpływ na zdolność prowadzenia pojazdów i obsługiwania maszyn',
        null,
        status,
        'Do weryfikacji w ChPL.'
      ),
      undesirableEffects: createChPLSection(
        '4.8',
        'Działania niepożądane',
        null,
        status,
        'Wykaz odczynów poszczepiennych i częstości ich występowania wg ChPL.'
      ),
      overdose: createChPLSection(
        '4.9',
        'Przedawkowanie',
        null,
        status,
        'Do weryfikacji w ChPL.'
      )
    },
    pharmacologicalProperties: {
      pharmacodynamics: createChPLSection(
        '5.1',
        'Właściwości farmakodynamiczne',
        params.atcCode ? `Kod ATC: ${params.atcCode} (Grupa farmakoterapeutyczna: szczepionki)` : null,
        status,
        'Grupa farmakoterapeutyczna, kod ATC, mechanizm indukcji odpowiedzi immunologicznej.'
      ),
      pharmacokinetics: createChPLSection(
        '5.2',
        'Właściwości farmakokinetyczne',
        null,
        status,
        'Ocena farmakokinetyki (dla szczepionek zazwyczaj nie dotyczy lub jest ograniczona).'
      ),
      preclinicalSafety: createChPLSection(
        '5.3',
        'Przedkliniczne dane o bezpieczeństwie',
        null,
        status,
        'Badania toksyczności, tolerancji i potencjału mutagennego.'
      )
    },
    pharmaceuticalParticulars: {
      excipients: createChPLSection(
        '6.1',
        'Wykaz substancji pomocniczych',
        null,
        status,
        'Pełny wykaz adiuwantów, substancji konserwujących i buforów (do weryfikacji w ChPL).'
      ),
      incompatibilities: createChPLSection(
        '6.2',
        'Niezgodności farmaceutyczne',
        null,
        status,
        'Zasady dotyczące zakazu mieszania z innymi produktami leczniczymi.'
      ),
      shelfLife: createChPLSection(
        '6.3',
        'Okres ważności',
        null,
        status,
        'Okres ważności produktu fabrycznie zamkniętego oraz po rekonstytucji.'
      ),
      storageSpecialPrecautions: createChPLSection(
        '6.4',
        'Specjalne środki ostrożności podczas przechowywania',
        params.storageInfo || 'Zakres referencyjny: przechowywać w lodówce (+2°C do +8°C). Nie zamrażać. Przechowywać w oryginalnym opakowaniu w celu ochrony przed światłem.',
        status,
        'Łańcuch chłodniczy – odczyt manualny na termometrze chłodziarki punktu szczepień.'
      ),
      containerNatureAndContents: createChPLSection(
        '6.5',
        'Rodzaj i zawartość opakowania',
        params.packagingInfo,
        status,
        'Opis fiolki, ampułko-strzykawki, korka elastomerowego i wielkości opakowań.'
      ),
      disposalAndHandling: createChPLSection(
        '6.6',
        'Specjalne środki ostrożności dotyczące usuwania i przygotowania produktu leczniczego do stosowania',
        params.handlingInfo,
        status,
        'Instrukcja wstrząsania, rozpuszczania, doboru igły oraz utylizacji odpadów medycznych.'
      )
    },
    marketingAuthorisationHolder: createChPLSection(
      '7',
      'Podmiot odpowiedzialny posiadający pozwolenie na dopuszczenie do obrotu',
      params.manufacturer,
      status,
      'Nazwa i adres podmiotu odpowiedzialnego.'
    ),
    marketingAuthorisationNumber: createChPLSection(
      '8',
      'Numer(-y) pozwolenia na dopuszczenie do obrotu',
      params.authorizationNumber,
      status,
      'Numer pozwolenia krajowego (URPL) lub unijnego (EMA).'
    ),
    firstAuthorisationAndRenewal: createChPLSection(
      '9',
      'Data wydania pierwszego pozwolenia na dopuszczenie do obrotu i data przedłużenia pozwolenia',
      params.authorizationDates,
      status,
      'Historia rejestracji leku w RPL / EMA.'
    ),
    revisionDate: createChPLSection(
      '10',
      'Data zatwierdzenia lub częściowej zmiany tekstu charakterystyki produktu leczniczego',
      params.revisionDate,
      status,
      'Data ostatniej urzędowej rewizji ChPL.'
    )
  };
};

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
    chpl: buildChPLStructure({
      tradeName: 'Infanrix Hexa proszek i zawiesina do sporządzania zawiesiny do wstrzykiwań',
      activeSubstance: 'DTPa-HBV-IPV+Hib (toksoid błoniczy, toksoid tężcowy, antygeny krztuśca, HBsAg, poliowirusy inaktywowane, polisacharyd Hib)',
      pharmaceuticalForm: 'Proszek i zawiesina do sporządzania zawiesiny do wstrzykiwań w ampułko-strzykawce',
      atcCode: 'J07CA09',
      storageInfo: 'Przechowywać w lodówce (2°C – 8°C). Nie zamrażać. Przechowywać w oryginalnym opakowaniu w celu ochrony przed światłem (Łańcuch chłodniczy).',
      packagingInfo: 'Fiolka zawierająca proszek (Hib) oraz ampułko-strzykawka zawierająca zawiesinę (DTPa-HBV-IPV) z igłami lub bez igieł.',
      handlingInfo: 'Przed podaniem zawiesinę w ampułko-strzykawce należy wstrząsnąć, a następnie zrekonstytuować z proszkiem w fiolce zgodnie z pkt 6.6 ChPL.',
      manufacturer: 'GlaxoSmithKline Biologicals S.A., Rue de l’Institut 89, B-1330 Rixensart, Belgia',
      authorizationNumber: 'EU/1/00/152/001',
      authorizationDates: null,
      revisionDate: null,
      overallStatus: 'pending_verification'
    })
  },
  {
    id: 'vac-priorix',
    tradeName: 'Priorix',
    activeSubstance: 'Szczepionka przeciw odrze, śwince i różyczce (żywa, atenuowana)',
    manufacturer: 'GlaxoSmithKline Biologicals S.A.',
    pharmaceuticalForm: 'Proszek i rozpuszczalnik do sporządzania roztworu do wstrzykiwań',
    vaccineType: 'zywa_atenuowana',
    targetGroup: 'uniwersalna',
    marketingAuthorizationNumber: '6758',
    rplRecordUrl: 'https://rejestrymedyczne.ezdrowie.gov.pl/rpl/search/public',
    currentChplUrl: 'https://rejestrymedyczne.ezdrowie.gov.pl/rpl/search/public',
    chplVersionDate: null,
    lastVerifiedDate: '10.11.2026',
    verificationStatus: 'pending_verification',
    atcCode: 'J07BD52',
    chpl: buildChPLStructure({
      tradeName: 'Priorix proszek i rozpuszczalnik do sporządzania roztworu do wstrzykiwań',
      activeSubstance: 'Wirusy odry szczepu Schwarz (żywe, atenuowane), wirusy świnki szczepu RIT 4385, wirusy różyczki szczepu Wistar RA 27/3',
      pharmaceuticalForm: 'Proszek i rozpuszczalnik do sporządzania roztworu do wstrzykiwań w ampułko-strzykawce',
      atcCode: 'J07BD52',
      storageInfo: 'Przechowywać w lodówce (2°C – 8°C). Nie zamrażać. Przechowywać w oryginalnym opakowaniu w celu ochrony przed światłem.',
      packagingInfo: 'Fiolka ze szkła z proszkiem oraz ampułko-strzykawka z rozpuszczalnikiem (woda do wstrzykiwań).',
      handlingInfo: 'Rozpuszczalnik z ampułko-strzykawki wstrzyknąć do fiolki z proszkiem, dokładnie wstrząsnąć do całkowitego rozpuszczenia. Podać niezwłocznie po przygotowaniu.',
      manufacturer: 'GlaxoSmithKline Biologicals S.A., Rue de l’Institut 89, B-1330 Rixensart, Belgia',
      authorizationNumber: '6758',
      authorizationDates: null,
      revisionDate: null,
      overallStatus: 'pending_verification'
    })
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
    chpl: buildChPLStructure({
      tradeName: 'Prevenar 13 zawiesina do wstrzykiwań',
      activeSubstance: 'Polisacharydy serotypów Streptococcus pneumoniae skoniugowane z białkiem nośnikowym CRM197 i adsorbowane na fosforanie glinu',
      pharmaceuticalForm: 'Zawiesina do wstrzykiwań (ampułko-strzykawka jednodawkowa 0,5 ml)',
      atcCode: 'J07AL02',
      storageInfo: 'Przechowywać w lodówce (2°C – 8°C). Nie zamrażać. Przechowywać w oryginalnym opakowaniu.',
      packagingInfo: 'Ampułko-strzykawka ze szkła typu I z korkiem tłoka i nasadką ochronną z dwiema osobnymi igłami.',
      handlingInfo: 'Przed użyciem dobrze wstrząsnąć w celu uzyskania jednorodnej białej zawiesiny. Nie stosować, jeśli zawiesina zawiera cząstki stałe.',
      manufacturer: 'Pfizer Europe MA EEIG, Boulevard de la Plaine 17, 1050 Bruxelles, Belgia',
      authorizationNumber: 'EU/1/09/590/002',
      authorizationDates: null,
      revisionDate: null,
      overallStatus: 'pending_verification'
    })
  },
  {
    id: 'vac-engerix-b',
    tradeName: 'Engerix B',
    activeSubstance: 'Wirusowe zapalenie wątroby typu B (rekombinowany antygen powierzchniowy HBsAg)',
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
    chpl: buildChPLStructure({
      tradeName: 'Engerix B zawiesina do wstrzykiwań',
      activeSubstance: 'Rekombinowany antygen powierzchniowy wirusa zapalenia wątroby typu B (HBsAg) uzyskany w hodowli komórek drożdży Saccharomyces cerevisiae',
      pharmaceuticalForm: 'Zawiesina do wstrzykiwań w ampułko-strzykawce (dawka dla dzieci 10 µg/0,5 ml lub dla dorosłych 20 µg/1 ml)',
      atcCode: 'J07BC01',
      storageInfo: 'Przechowywać w lodówce (2°C – 8°C). Nie zamrażać. Chronić przed światłem.',
      packagingInfo: 'Ampułko-strzykawka z igłą lub bez igły w tekturowym pudełku.',
      handlingInfo: 'Przed użyciem energicznie wstrząsnąć do uzyskania jednorodnej zawiesiny. Podać domięśniowo w mięsień naramienny (dorośli) lub przednio-boczną część uda (noworodki/niemowlęta).',
      manufacturer: 'GlaxoSmithKline Biologicals S.A., Rue de l’Institut 89, B-1330 Rixensart, Belgia',
      authorizationNumber: 'R/0695',
      authorizationDates: null,
      revisionDate: null,
      overallStatus: 'pending_verification'
    })
  },
  {
    id: 'vac-boostrix',
    tradeName: 'Boostrix',
    activeSubstance: 'Szczepionka przeciw błonicy, tężcowi i krztuścowi (bezkomórkowa, adsorbowana, o zmniejszonej zawartości antygenów - dTap)',
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
    chpl: buildChPLStructure({
      tradeName: 'Boostrix zawiesina do wstrzykiwań w ampułko-strzykawce',
      activeSubstance: 'Toksoid błoniczy (nie mniej niż 2 j.m.), toksoid tężcowy (nie mniej niż 20 j.m.), antygeny Bordetella pertussis (toksoid krztuścowy, hemaglutynina włókienkowa, pertaktyna)',
      pharmaceuticalForm: 'Biała, mętna zawiesina do wstrzykiwań (ampułko-strzykawka 0,5 ml)',
      atcCode: 'J07AM51',
      storageInfo: 'Przechowywać w lodówce (2°C – 8°C). Nie zamrażać. Przechowywać w oryginalnym opakowaniu.',
      packagingInfo: 'Ampułko-strzykawka ze szkła typu I z tłokiem z gumy butylowej i osłonką igły.',
      handlingInfo: 'Podczas przechowywania może powstać biały osad i przezroczysty płyn. Przed podaniem wstrząsnąć do uzyskania jednorodnej zawiesiny. Podać głęboko domięśniowo.',
      manufacturer: 'GlaxoSmithKline Biologicals S.A., Rue de l’Institut 89, B-1330 Rixensart, Belgia',
      authorizationNumber: '9211',
      authorizationDates: null,
      revisionDate: null,
      overallStatus: 'pending_verification'
    })
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
    chpl: buildChPLStructure({
      tradeName: 'VaxigripTetra zawiesina do wstrzykiwań w ampułko-strzykawce',
      activeSubstance: 'Inaktywowane rozszczepione wirusy grypy odpowiadające 4 szczepom (dwóm szczepom typu A i dwóm szczepom typu B) zalecanym przez WHO na dany sezon epidemiczny',
      pharmaceuticalForm: 'Zawiesina do wstrzykiwań w ampułko-strzykawce 0,5 ml',
      atcCode: 'J07CA01',
      storageInfo: 'Przechowywać w lodówce (2°C – 8°C). Nie zamrażać. Przechowywać w tekturowym pudełku w celu ochrony przed światłem.',
      packagingInfo: 'Ampułko-strzykawka ze szkła ze stałą igłą lub bez igły, z korkiem tłoka z elastomeru.',
      handlingInfo: 'Przed użyciem szczepionka powinna osiągnąć temperaturę pokojową. Przed podaniem wstrząsnąć.',
      manufacturer: 'Sanofi Pasteur, 14 Espace Henry Vallée, 69007 Lyon, Francja',
      authorizationNumber: 'EU/1/16/1097/001',
      authorizationDates: null,
      revisionDate: null,
      overallStatus: 'uncompleted'
    })
  }
];
