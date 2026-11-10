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
  note: string | null = 'Punkt oczekuje na weryfikację z aktualnym drukiem ChPL w rejestrze RPL.',
  officialSource: string | null = 'Rejestr Produktów Leczniczych (RPL / eZdrowie / URPL)',
  pdfPageNumber: number | string | null = null,
  sourceDocumentUrl: string | null = null,
  chplVersionDate: string | null = null
): ChPLSection => ({
  sectionNumber,
  sectionTitle,
  content,
  officialSource,
  pdfPageNumber,
  sourceDocumentUrl,
  chplVersionDate,
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

const INFANRIX_HEXA_DOC_SOURCE = 'Charakterystyka Produktu Leczniczego (GSK / EMA, procedura VR 323859)';
const INFANRIX_HEXA_PDF_URL = 'https://pl.gsk.com/media/b2ip1snt/infanrix-hexa-druki-pl-h-0296-ia-vr-323859-12_02_2026.pdf';
const INFANRIX_HEXA_CHPL_DATE = '12.02.2026';

export const INFANRIX_HEXA_CHPL: ChPLStructure = {
  name: createChPLSection(
    '1',
    'Nazwa produktu leczniczego',
    'Infanrix hexa proszek i zawiesina do sporządzania zawiesiny do wstrzykiwań.\nSzczepionka przeciwko błonicy (D), tężcowi (T), krztuścowi (komponenta acelularna) (Pa), wirusowemu zapaleniu wątroby typu B (rDNA) (HBV), poliomyelitis (inaktywowana) (IPV) i przeciwko Haemophilus influenzae typ b (Hib) skoniugowana (adsorbowana).',
    'pending_verification',
    'Odwzorowano z oficjalnego druku ChPL GSK (procedura VR 323859 z 12.02.2026). Oczekuje na ręczną weryfikację personelu medycznego.',
    INFANRIX_HEXA_DOC_SOURCE,
    1,
    INFANRIX_HEXA_PDF_URL,
    INFANRIX_HEXA_CHPL_DATE
  ),
  composition: createChPLSection(
    '2',
    'Skład jakościowy i ilościowy',
    'Po rekonstytucji 1 dawka (0,5 ml) zawiera:\n• Toksoid błoniczy (Diphtheria toxoid): nie mniej niż 30 j.m. (adsorbowany na wodorotlenku glinu Al(OH)3 0,95 mg Al3+)\n• Toksoid tężcowy (Tetanus toxoid): nie mniej niż 40 j.m. (adsorbowany na wodorotlenku glinu Al(OH)3)\n• Antygeny Bordetella pertussis:\n   - Toksoid krztuścowy (PT): 25 mikrogramów\n   - Hemaglutynina włókienkowa (FHA): 25 mikrogramów\n   - Pertaktyna (PRN): 8 mikrogramów\n   (adsorbowane na wodorotlenku glinu Al(OH)3)\n• Antygen powierzchniowy Hepatitis B (r-HBsAg): 10 mikrogramów (otrzymywany z hodowli komórek drożdży Saccharomyces cerevisiae technologią rekombinacji DNA, adsorbowany na fosforanie glinu AlPO4 1,45 mg Al3+)\n• Poliowirus (inaktywowany) (IPV) namnażany w komórkach Vero:\n   - typ 1 (szczep Mahoney): 40 jednostek antygenu D\n   - typ 2 (szczep MEF-1): 8 jednostek antygenu D\n   - typ 3 (szczep Saukett): 32 jednostki antygenu D\n• Polisacharyd Haemophilus influenzae typ b (fosforan polirybozylorybitolu, PRP): 10 mikrogramów (skoniugowany z toksoidem tężcowym jako nośnikiem białkowym ok. 20–40 mikrogramów, adsorbowany na fosforanie glinu AlPO4).\n\nSubstancje pomocnicze o znanym działaniu: laktoza bezwodna, sodu chlorek. Szczepionka zawiera śladowe ilości formaldehydu, neomycyny i polimyksyny.',
    'pending_verification',
    'Zgodne z oficjalnym składem ChPL. Zwrócić uwagę na obecność soli glinu oraz śladowe antybiotyki.',
    INFANRIX_HEXA_DOC_SOURCE,
    1,
    INFANRIX_HEXA_PDF_URL,
    INFANRIX_HEXA_CHPL_DATE
  ),
  pharmaceuticalForm: createChPLSection(
    '3',
    'Postać farmaceutyczna',
    'Proszek i zawiesina do sporządzania zawiesiny do wstrzykiwań.\n• Proszek: biały proszek w fiolce ze szkła typu I (składnik Hib).\n• Zawiesina: mętna, biała zawiesina w ampułko-strzykawce ze szkła typu I (składnik DTPa-HBV-IPV).\n• Po rekonstytucji: jednorodna, mętna biaława zawiesina.',
    'pending_verification',
    'Ocenić wygląd przed podaniem. Prawidłowy preparat po zmieszaniu ma postać mętnej białej zawiesiny.',
    INFANRIX_HEXA_DOC_SOURCE,
    2,
    INFANRIX_HEXA_PDF_URL,
    INFANRIX_HEXA_CHPL_DATE
  ),
  clinicalParticulars: {
    indications: createChPLSection(
      '4.1',
      'Wskazania do stosowania',
      'Szczepionka Infanrix hexa jest wskazana do szczepienia pierwotnego i uzupełniającego niemowląt i dzieci przeciwko błonicy, tężcowi, krztuścowi, wirusowemu zapaleniu wątroby typu B, poliomyelitis i zakażeniom wywoływanym przez Haemophilus influenzae typ b.\n\nOgraniczenie wiekowe: Infanrix hexa nie jest przeznaczony do stosowania u dzieci w wieku powyżej 36. miesiąca życia.\nStosowanie: Szczepionkę należy stosować zgodnie z oficjalnymi wytycznymi krajowego Programu Szczepień Ochronnych (PSO).',
      'pending_verification',
      'Oficjalne wskazanie pediatryczne do 36. miesiąca życia.',
      INFANRIX_HEXA_DOC_SOURCE,
      2,
      INFANRIX_HEXA_PDF_URL,
      INFANRIX_HEXA_CHPL_DATE
    ),
    dosageAndAdministration: createChPLSection(
      '4.2',
      'Dawkowanie i sposób podawania',
      'Dawkowanie:\n• Szczepienie pierwotne:\n  Składa się z dwóch lub trzech dawek (po 0,5 ml), podawanych zgodnie z oficjalnymi wytycznymi:\n  - Schemat 3-dawkowy: np. w 2., 3., 4. miesiącu; 3., 4., 5. miesiącu lub 2., 4., 6. miesiącu życia;\n  - Schemat 2-dawkowy: np. w 3. i 5. miesiącu życia.\n  Należy zachować odstęp co najmniej 1 miesiąca pomiędzy dawkami szczepienia pierwotnego.\n  Jeśli noworodek otrzymał dawkę szczepionki przeciwko WZW B tuż po urodzeniu, Infanrix hexa może być zastosowany od ukończenia 6. tygodnia życia jako kolejna dawka.\n\n• Szczepienie uzupełniające (przypominające):\n  - Po 2 dawkach szczepienia pierwotnego: dawka uzupełniająca musi być podana w odstępie co najmniej 6 miesięcy od ostatniej dawki szczepienia pierwotnego, najlepiej pomiędzy 11. a 13. miesiącem życia.\n  - Po 3 dawkach szczepienia pierwotnego: dawka uzupełniająca musi być podana w odstępie co najmniej 6 miesięcy od ostatniej dawki szczepienia pierwotnego, najlepiej przed ukończeniem 18. miesiąca życia.\n\nSposób podawania:\nInfanrix hexa podaje się w głębokim wstrzyknięciu domięśniowym (i.m.), najlepiej w przednioboczną część uda u niemowląt i małych dzieci. Przy kolejnych dawkach zaleca się zmianę miejsca iniekcji.\nPod żadnym pozorem nie wolno podawać dożylnie ani śródskórnie.',
      'pending_verification',
      'Wstrzyknięcie wyłącznie domięśniowe (przednio-boczna część uda). Przestrzegać min. 1 mies. odstępu w cyklu pierwotnym i min. 6 mies. przed dawką przypominającą.',
      INFANRIX_HEXA_DOC_SOURCE,
      2,
      INFANRIX_HEXA_PDF_URL,
      INFANRIX_HEXA_CHPL_DATE
    ),
    contraindications: createChPLSection(
      '4.3',
      'Przeciwwskazania',
      '• Nadwrażliwość na substancje czynne lub na którąkolwiek substancję pomocniczą (wymienioną w punkcie 6.1) bądź na substancje pozostałościowe (formaldehyd, neomycynę, polimyksynę).\n• Reakcje anafilaktyczne lub objawy nadwrażliwości po wcześniejszym podaniu szczepionek przeciw błonicy, tężcowi, krztuścowi, WZW B, polio lub Hib.\n• Encefalopatia o nieznanej etiologii, która wystąpiła w ciągu 7 dni po wcześniejszym podaniu szczepionki zawierającej komponentę krztuścową. W takim przypadku należy przerwać podawanie komponenty krztuścowej i kontynuować szczepienie preparatami bezkrztuścowymi (DT, HBV, IPV, Hib).\n• Ostre, ciężkie choroby przebiegające z wysoką gorączką (łagodna infekcja kataralna bez gorączki nie stanowi przeciwwskazania do szczepienia).',
      'pending_verification',
      'Kluczowe bezwzględne przeciwwskazania kliniczne do kwalifikacji lekarskiej.',
      INFANRIX_HEXA_DOC_SOURCE,
      3,
      INFANRIX_HEXA_PDF_URL,
      INFANRIX_HEXA_CHPL_DATE
    ),
    warningsAndPrecautions: createChPLSection(
      '4.4',
      'Specjalne ostrzeżenia i środki ostrożności dotyczące stosowania',
      '• Badanie kwalifikacyjne: Każde szczepienie powinno być poprzedzone badaniem lekarskim oraz dokładnym wywiadem medycznym (z uwzględnieniem wcześniejszych szczepień i ewentualnych NOP).\n• Reakcje po składniku krztuścowym: Należy starannie rozważyć podanie kolejnych dawek szczepionki z krztuścem, jeśli w ciągu 48 h wystąpiły:\n  - gorączka ≥ 40,0°C niewywołana innym zidentyfikowanym czynnikiem;\n  - zapaść lub stan podobny do wstrząsu (zespół hipotoniczno-hiporeaktywny, HHE);\n  - nieutulony, ciągły płacz trwający ≥ 3 godziny;\n  - drgawki z gorączką lub bez gorączki występujące w ciągu 3 dni po szczepieniu.\n• Skazy krwotoczne: Zachować ostrożność u dzieci z trombocytopenią lub zaburzeniami krzepnięcia (ryzyko krwawienia po iniekcji i.m.).\n• Zabezpieczenie przeciwwstrząsowe: Zawsze zapewnić natychmiastowy dostęp do zestawu anafilaktycznego (adrenalina 1:1000) oraz nadzór medyczny przez minimum 30 minut po szczepieniu.\n• Skrajne wcześniaki (urodzone ≤ 28. tygodnia ciąży): Rozważyć ryzyko wystąpienia bezdechu i monitorować czynność oddechową przez 48–72 h po szczepieniu pierwotnym.',
      'pending_verification',
      'Ostrzeżenia dotyczące zespołu HHE, wysokiej gorączki, skrajnych wcześniaków oraz konieczności gotowości przeciwwstrząsowej.',
      INFANRIX_HEXA_DOC_SOURCE,
      3,
      INFANRIX_HEXA_PDF_URL,
      INFANRIX_HEXA_CHPL_DATE
    ),
    interactions: createChPLSection(
      '4.5',
      'Interakcje z innymi produktami leczniczymi i inne rodzaje interakcji',
      '• Jednoczesne podawanie: Infanrix hexa może być podawany jednocześnie ze skoniugowaną szczepionką przeciw pneumokokom (np. Prevenar 13), skoniugowanymi szczepionkami przeciw meningokokom grupy C i ACWY oraz doustnymi szczepionkami przeciw rotawirusom.\n• Miejsca iniekcji: Różne szczepionki we wstrzyknięciach należy zawsze podawać w oddzielne miejsca ciała, przy użyciu osobnych strzykawek i igieł.\n• Reakcje gorączkowe: Jednoczesne podawanie ze skoniugowaną szczepionką przeciw pneumokokom wiąże się z częstszym występowaniem reakcji gorączkowych (zazwyczaj łagodnych do umiarkowanych ≤ 39°C) oraz drgawek gorączkowych i epizodów HHE.\n• Immunosupresja: U dzieci z wrodzonymi lub nabytymi niedoborami odporności oraz leczonych immunosupresyjnie odpowiedź immunologiczna na szczepienie może być osłabiona.',
      'pending_verification',
      'Jednoczesne podanie dozwolone w różne kończyny / miejsca anatomiczne.',
      INFANRIX_HEXA_DOC_SOURCE,
      5,
      INFANRIX_HEXA_PDF_URL,
      INFANRIX_HEXA_CHPL_DATE
    ),
    fertilityPregnancyLactation: createChPLSection(
      '4.6',
      'Wpływ na płodność, ciążę i laktację',
      'Szczepionka Infanrix hexa nie jest przeznaczona do stosowania u osób dorosłych. W związku z tym brak jest danych klinicznych dotyczących stosowania w okresie ciąży lub podczas karmienia piersią, jak również badań wpływu na płodność u zwierząt.',
      'pending_verification',
      'Produkt wyłącznie pediatryczny. Nie dotyczy dorosłych.',
      INFANRIX_HEXA_DOC_SOURCE,
      5,
      INFANRIX_HEXA_PDF_URL,
      INFANRIX_HEXA_CHPL_DATE
    ),
    driveAndMachines: createChPLSection(
      '4.7',
      'Wpływ na zdolność prowadzenia pojazdów i obsługiwania maszyn',
      'Nie dotyczy. Produkt przeznaczony wyłącznie dla dzieci w wieku do ukończenia 36. miesiąca życia. W oficjalnym druku ChPL odnotowano: "Nieistotny".',
      'pending_verification',
      'Zapis z ChPL: Nieistotny.',
      INFANRIX_HEXA_DOC_SOURCE,
      5,
      INFANRIX_HEXA_PDF_URL,
      INFANRIX_HEXA_CHPL_DATE
    ),
    undesirableEffects: createChPLSection(
      '4.8',
      'Działania niepożądane',
      'Profil bezpieczeństwa oparty na badaniach klinicznych oraz monitorowaniu po wprowadzeniu produktu do obrotu:\n• Bardzo często (≥ 1/10): utrata apetytu, gorączka ≥ 38°C, ból, zaczerwienienie, miejscowy obrzęk w miejscu wstrzyknięcia (≤ 50 mm), zmęczenie, drażliwość, nietypowy płacz, senność.\n• Często (≥ 1/100 do < 1/10): nerwowość, wymioty, biegunka, świąd, gorączka > 39,5°C, stwardnienie w miejscu podania, obrzęk w miejscu wstrzyknięcia (> 50 mm).\n• Niezbyt często (≥ 1/1 000 do < 1/100): infekcja górnych dróg oddechowych, kaszel, apatia, rozlany obrzęk kończyny, w którą wykonano iniekcję (niekiedy obejmujący sąsiedni staw).\n• Rzadko (≥ 1/10 000 do < 1/1 000): wysypka, pokrzywka.\n• Bardzo rzadko i po wprowadzeniu do obrotu: reakcje anafilaktyczne, reakcje anafilaktoidalne, obrzęk naczynioruchowy, drgawki (z gorączką lub bez gorączki), epizody hipotoniczno-hiporeaktywne (HHE), bezdech u skrajnych wcześniaków (urodzonych ≤ 28. tc).',
      'pending_verification',
      'Profil NOP według klasyfikacji MedDRA z oficjalnej tabeli ChPL.',
      INFANRIX_HEXA_DOC_SOURCE,
      5,
      INFANRIX_HEXA_PDF_URL,
      INFANRIX_HEXA_CHPL_DATE
    ),
    overdose: createChPLSection(
      '4.9',
      'Przedawkowanie',
      'W oficjalnym druku Charakterystyki Produktu Leczniczego zapisano: "Nie odnotowano". W badaniach klinicznych oraz monitorowaniu bezpieczeństwa nie stwierdzono specyficznych objawów związanych z podaniem dawki większej niż zalecana.',
      'pending_verification',
      'Oficjalna treść ChPL: Nie odnotowano.',
      INFANRIX_HEXA_DOC_SOURCE,
      7,
      INFANRIX_HEXA_PDF_URL,
      INFANRIX_HEXA_CHPL_DATE
    )
  },
  pharmacologicalProperties: {
    pharmacodynamics: createChPLSection(
      '5.1',
      'Właściwości farmakodynamiczne',
      'Grupa farmakoterapeutyczna: skojarzona szczepionka bakteryjno-wirusowa. Kod ATC: J07CA09.\nSzczepionka indukuje swoistą odpowiedź humoralną i stymuluje wytwarzanie przeciwciał przeciw 6 patogenom: Corynebacterium diphtheriae, Clostridium tetani, Bordetella pertussis (antygeny PT, FHA, PRN), wirusowi HBV (anty-HBs), trzem typom poliowirusa (1, 2, 3) oraz Haemophilus influenzae typ b (anty-PRP).\nW badaniach klinicznych wykazano uzyskanie ochronnych mian przeciwciał u 95,9%–100% zaszczepionych niemowląt po pełnym schemacie pierwotnym i uzupełniającym.',
      'pending_verification',
      'Kod ATC: J07CA09. Ochrona przed 6 jednostkami chorobowymi.',
      INFANRIX_HEXA_DOC_SOURCE,
      7,
      INFANRIX_HEXA_PDF_URL,
      INFANRIX_HEXA_CHPL_DATE
    ),
    pharmacokinetics: createChPLSection(
      '5.2',
      'Właściwości farmakokinetyczne',
      'Ocena właściwości farmakokinetycznych nie jest wymagana dla szczepionek (zgodnie z oficjalnym zapisem punktu 5.2 ChPL oraz unijnymi wytycznymi EMA).',
      'pending_verification',
      'Zapis urzędowy: Badania farmakokinetyczne nie dotyczą szczepionek.',
      INFANRIX_HEXA_DOC_SOURCE,
      9,
      INFANRIX_HEXA_PDF_URL,
      INFANRIX_HEXA_CHPL_DATE
    ),
    preclinicalSafety: createChPLSection(
      '5.3',
      'Przedkliniczne dane o bezpieczeństwie',
      'Dane niekliniczne uzyskane na podstawie konwencjonalnych badań farmakologicznych dotyczących bezpieczeństwa, swoistej toksyczności, badań toksyczności po podaniu wielokrotnym i zgodności poszczególnych składników nie wykazują żadnego szczególnego zagrożenia dla ludzi.',
      'pending_verification',
      'Brak swoistego ryzyka toksykologicznego w badaniach na zwierzętach.',
      INFANRIX_HEXA_DOC_SOURCE,
      9,
      INFANRIX_HEXA_PDF_URL,
      INFANRIX_HEXA_CHPL_DATE
    )
  },
  pharmaceuticalParticulars: {
    excipients: createChPLSection(
      '6.1',
      'Wykaz substancji pomocniczych',
      '• Proszek Hib: laktoza bezwodna.\n• Zawiesina DTPa-HBV-IPV: sodu chlorek (NaCl), podłoże 199 (zawierające głównie aminokwasy, sole mineralne, witaminy), woda do wstrzykiwań.\n• Adiuwanty: wodorotlenek glinu uwodniony Al(OH)3 (0,95 mg Al3+) oraz fosforan glinu AlPO4 (1,45 mg Al3+).\n• Pozostałości produkcyjne w ilościach śladowych: formaldehyd, neomycyna, polimyksyna.',
      'pending_verification',
      'Adiuwanty mineralne glinowe oraz śladowe ilości antybiotyków i formaldehydu.',
      INFANRIX_HEXA_DOC_SOURCE,
      9,
      INFANRIX_HEXA_PDF_URL,
      INFANRIX_HEXA_CHPL_DATE
    ),
    incompatibilities: createChPLSection(
      '6.2',
      'Niezgodności farmaceutyczne',
      'Ponieważ nie wykonywano badań dotyczących zgodności, produktu leczniczego nie wolno mieszać z innymi produktami leczniczymi ani szczepionkami (z wyjątkiem dołączonej w zestawie ampułko-strzykawki z zawiesiną DTPa-HBV-IPV przeznaczonej do rekonstytucji proszku Hib).',
      'pending_verification',
      'Zakaz mieszania z innymi preparatami w jednej strzykawce.',
      INFANRIX_HEXA_DOC_SOURCE,
      10,
      INFANRIX_HEXA_PDF_URL,
      INFANRIX_HEXA_CHPL_DATE
    ),
    shelfLife: createChPLSection(
      '6.3',
      'Okres ważności',
      'Okres ważności produktu: 3 lata.\nPo rekonstytucji: szczepionkę należy podać niezwłocznie po przygotowaniu. Wykazano jednak stabilność chemiczną i fizyczną przygotowanego produktu do 8 godzin w temperaturze 21°C.',
      'pending_verification',
      '3 lata w lodówce. Zalecane natychmiastowe podanie po zmieszaniu.',
      INFANRIX_HEXA_DOC_SOURCE,
      10,
      INFANRIX_HEXA_PDF_URL,
      INFANRIX_HEXA_CHPL_DATE
    ),
    storageSpecialPrecautions: createChPLSection(
      '6.4',
      'Specjalne środki ostrożności podczas przechowywania',
      'Przechowywać w lodówce w temperaturze od 2°C do 8°C (bezwzględny wymóg utrzymania łańcucha chłodniczego).\nNie zamrażać. Zamrożenie nieodwracalnie niszczy strukturę adiuwantu mineralnego i bezwzględnie dyskwalifikuje szczepionkę z użycia.\nPrzechowywać w oryginalnym opakowaniu w celu ochrony przed światłem.',
      'pending_verification',
      'Temperatura 2°C – 8°C. Bezwzględny zakaz zamrażania (dyskwalifikacja preparatu).',
      INFANRIX_HEXA_DOC_SOURCE,
      10,
      INFANRIX_HEXA_PDF_URL,
      INFANRIX_HEXA_CHPL_DATE
    ),
    containerNatureAndContents: createChPLSection(
      '6.5',
      'Rodzaj i zawartość opakowania',
      '• Proszek w fiolce ze szkła typu I z korkiem z gumy butylowej.\n• 0,5 ml zawiesiny w ampułko-strzykawce ze szkła typu I z zatyczką z gumy butylowej.\nOpakowania handlowe zawierają 1 lub 10 fiolek oraz ampułko-strzykawek, z 2 osobnymi igłami lub bez igieł. Nie wszystkie wielkości opakowań muszą znajdować się w obrocie na rynku polskim.',
      'pending_verification',
      'Fiolka ze szkła typu I + ampułko-strzykawka jednodawkowa.',
      INFANRIX_HEXA_DOC_SOURCE,
      10,
      INFANRIX_HEXA_PDF_URL,
      INFANRIX_HEXA_CHPL_DATE
    ),
    disposalAndHandling: createChPLSection(
      '6.6',
      'Specjalne środki ostrożności dotyczące usuwania i przygotowania produktu leczniczego do stosowania',
      'Instrukcja przygotowania (rekonstytucji) dla personelu punktu szczepień:\n1. Podczas przechowywania ampułko-strzykawki może powstać biały osad i bezbarwny płyn nadeksowy – jest to zjawisko naturalne i nie świadczy o wadzie jakościowej.\n2. Ampułko-strzykawkę z zawiesiną należy dokładnie wstrząsnąć do uzyskania jednorodnej, białej mętnej zawiesiny.\n3. Dokonać oceny wizualnej – w razie obecności ciał obcych lub zmiany zabarwienia preparat należy odrzucić.\n4. Wstrzyknąć całą zawartość ampułko-strzykawki do fiolki zawierającej proszek Hib.\n5. Fiolkę dokładnie wstrząsnąć do całkowitego rozpuszczenia proszku.\n6. Pobrać całą sporządzoną zawartość z powrotem do strzykawki.\n7. Założyć nową jałową igłę do iniekcji domięśniowej i natychmiast podać.\nUsuwanie odpadów: Wszelkie niewykorzystane resztki produktu lub jego odpady należy zutylizować zgodnie z przepisami dotyczącymi odpadów medycznych zakaźnych (kod 18 01 03*).',
      'pending_verification',
      'Procedura rekonstytucji i aseptyki w punkcie szczepień.',
      INFANRIX_HEXA_DOC_SOURCE,
      10,
      INFANRIX_HEXA_PDF_URL,
      INFANRIX_HEXA_CHPL_DATE
    )
  },
  marketingAuthorisationHolder: createChPLSection(
    '7',
    'Podmiot odpowiedzialny posiadający pozwolenie na dopuszczenie do obrotu',
    'GlaxoSmithKline Biologicals S.A., Rue de l’Institut 89, B-1330 Rixensart, Belgia.',
    'pending_verification',
    'Podmiot odpowiedzialny zarejestrowany w UE.',
    INFANRIX_HEXA_DOC_SOURCE,
    11,
    INFANRIX_HEXA_PDF_URL,
    INFANRIX_HEXA_CHPL_DATE
  ),
  marketingAuthorisationNumber: createChPLSection(
    '8',
    'Numer(-y) pozwolenia na dopuszczenie do obrotu',
    'EU/1/00/152/001 do EU/1/00/152/020 (rejestracja w procedurze centralnej Europejskiej Agencji Leków - EMA). Podstawowe opakowanie z dwiema igłami posiada numer: EU/1/00/152/001.',
    'pending_verification',
    'Numery dopuszczenia procedury centralnej UE/EMA.',
    INFANRIX_HEXA_DOC_SOURCE,
    11,
    INFANRIX_HEXA_PDF_URL,
    INFANRIX_HEXA_CHPL_DATE
  ),
  firstAuthorisationAndRenewal: createChPLSection(
    '9',
    'Data wydania pierwszego pozwolenia na dopuszczenie do obrotu i data przedłużenia pozwolenia',
    'Data wydania pierwszego pozwolenia: 23 października 2000 r.\nData ostatniego przedłużenia pozwolenia: 23 października 2005 r. (pozwolenie bezterminowe).',
    'pending_verification',
    'Dopuszczenie na rynku europejskim od 2000 r.',
    INFANRIX_HEXA_DOC_SOURCE,
    11,
    INFANRIX_HEXA_PDF_URL,
    INFANRIX_HEXA_CHPL_DATE
  ),
  revisionDate: createChPLSection(
    '10',
    'Data zatwierdzenia lub częściowej zmiany tekstu charakterystyki produktu leczniczego',
    '12.02.2026 r. (Procedura zmiany druków informacyjnych EMA / GSK: druki pl-h-0296-ia-vr-323859-12_02_2026. Szczegółowe informacje o tym produkcie leczniczym są dostępne na stronie internetowej Europejskiej Agencji Leków http://www.ema.europa.eu).',
    'pending_verification',
    'Oficjalna data zmiany z punktu 10 ChPL: 12.02.2026.',
    INFANRIX_HEXA_DOC_SOURCE,
    11,
    INFANRIX_HEXA_PDF_URL,
    INFANRIX_HEXA_CHPL_DATE
  )
};

export const VACCINES_CATALOG: VaccineProduct[] = [
  {
    id: 'vac-infanrix-hexa',
    tradeName: 'Infanrix hexa',
    activeSubstance: 'DTPa-HBV-IPV+Hib (toksoid błoniczy, toksoid tężcowy, antygeny krztuśca PT/FHA/PRN, r-HBsAg, inaktywowane wirusy polio typ 1, 2, 3, polisacharyd Hib skoniugowany z toksoidem tężcowym)',
    manufacturer: 'GlaxoSmithKline Biologicals S.A., Belgia',
    pharmaceuticalForm: 'Proszek i zawiesina do sporządzania zawiesiny do wstrzykiwań (biały proszek w fiolce + mętna biała zawiesina w ampułko-strzykawce)',
    vaccineType: 'podjednostkowa',
    targetGroup: 'pediatryczna',
    marketingAuthorizationNumber: 'EU/1/00/152/001 (oraz 002–020)',
    rplRecordUrl: null, // Pozostawione jako null – publiczny rejestr RPL eZdrowie nie udostępnia statycznego permalinka do procedur centralnych EMA
    currentChplUrl: 'https://pl.gsk.com/media/b2ip1snt/infanrix-hexa-druki-pl-h-0296-ia-vr-323859-12_02_2026.pdf',
    chplRevisionDate: '12.02.2026',
    chplVersionDate: '12.02.2026',
    documentDownloadDate: '10.11.2026',
    userVerificationDate: null,
    userVerificationNotes: null,
    verificationStatus: 'pending_verification',
    atcCode: 'J07CA09',
    chpl: INFANRIX_HEXA_CHPL
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
    chplRevisionDate: null,
    chplVersionDate: null,
    documentDownloadDate: '10.11.2026',
    userVerificationDate: null,
    userVerificationNotes: null,
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
    chplRevisionDate: null,
    chplVersionDate: null,
    documentDownloadDate: '10.11.2026',
    userVerificationDate: null,
    userVerificationNotes: null,
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
    chplRevisionDate: null,
    chplVersionDate: null,
    documentDownloadDate: '10.11.2026',
    userVerificationDate: null,
    userVerificationNotes: null,
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
    chplRevisionDate: null,
    chplVersionDate: null,
    documentDownloadDate: '10.11.2026',
    userVerificationDate: null,
    userVerificationNotes: null,
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
    chplRevisionDate: null,
    chplVersionDate: null,
    documentDownloadDate: '10.11.2026',
    userVerificationDate: null,
    userVerificationNotes: null,
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
