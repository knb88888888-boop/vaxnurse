import type {
  VaccineProduct,
  VaccineVerificationStatus,
  VaccineType,
  VaccineTargetGroup,
  ChPLSection,
  ChPLStructure,
  DiscrepancyStatus
} from '../types/vaccines';

export const VERIFICATION_STATUS_META: Record<
  VaccineVerificationStatus,
  { label: string; description: string; badgeClass: string; isVerified: boolean }
> = {
  pending_verification: {
    label: 'Oczekuje na weryfikację',
    description: 'Karta preparatu oczekuje na weryfikację z oficjalną dokumentacją ChPL.',
    badgeClass: 'status-pending',
    isVerified: false
  },
  requires_source_clarification: {
    label: 'Wymaga wyjaśnienia źródłowego',
    description: 'Wykryto niezgodność w oficjalnej dokumentacji ChPL (np. różnica wartości pomiędzy sekcjami) wymagającą wyjaśnienia przez wytwórcę lub URPL/EMA.',
    badgeClass: 'status-reverify',
    isVerified: false
  },
  ready_for_manual_verification: {
    label: 'Gotowy do ręcznej weryfikacji',
    description: 'Wszystkie niezgodności dokumentacji zostały formalnie rozwiązane. Karta oczekuje na autoryzację personelu medycznego.',
    badgeClass: 'status-ready',
    isVerified: false
  },
  verified_chpl: {
    label: 'Zweryfikowany na podstawie dokumentacji',
    description: 'Karta została zweryfikowana i zatwierdzona na podstawie oficjalnej dokumentacji ChPL przez uprawniony personel.',
    badgeClass: 'status-verified',
    isVerified: true
  },
  uncompleted: {
    label: 'Nieuzupełniony',
    description: 'Karta preparatu w fazie tworzenia szkieletu struktury. Brak danych ChPL.',
    badgeClass: 'status-uncompleted',
    isVerified: false
  },
  requires_reverification: {
    label: 'Wymaga ponownej weryfikacji',
    description: 'Pojawiła się nowa wersja komunikatu ChPL lub zmiana w rejestrze RPL wymagająca ponownego sprawdzenia.',
    badgeClass: 'status-reverify',
    isVerified: false
  }
};

export const DISCREPANCY_STATUS_META: Record<
  DiscrepancyStatus,
  { label: string; badgeClass: string; isResolved: boolean; description: string }
> = {
  requires_clarification: {
    label: 'Wymaga wyjaśnienia',
    badgeClass: 'disc-requires-clarif',
    isResolved: false,
    description: 'Niezgodność wewnętrzna w oficjalnym druku ChPL oczekuje na sprostowanie przez wytwórcę lub URPL/EMA.'
  },
  clarification_submitted: {
    label: 'Zgłoszono wyjaśnienie',
    badgeClass: 'disc-clarif-submitted',
    isResolved: false,
    description: 'Wprowadzono dane dokumentu urzędowego. Oczekuje na ręczną kontrolę dokumentu przez personel (potwierdzenie sprawdzenia).'
  },
  resolved_with_official_document: {
    label: 'Wyjaśniona dokumentem urzędowym',
    badgeClass: 'disc-resolved-official',
    isResolved: true,
    description: 'Niezgodność została formalnie wyjaśniona zarejestrowanym i ręcznie sprawdzonym dokumentem urzędowym podmiotu odpowiedzialnego lub organu rejestracyjnego.'
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

const INFANRIX_HEXA_DOC_SOURCE = 'Polska ChPL GSK z 12.02.2026 (VR 323859) oraz polska wersja EMA (EPAR SmPC)';
export const INFANRIX_HEXA_PDF_URL = 'https://pl.gsk.com/media/b2ip1snt/infanrix-hexa-druki-pl-h-0296-ia-vr-323859-12_02_2026.pdf';
export const INFANRIX_HEXA_EMA_PL_URL = 'https://www.ema.europa.eu/pl/documents/product-information/infanrix-hexa-epar-product-information_pl.pdf';
export const INFANRIX_HEXA_CHPL_DATE = '12.02.2026';

export const INFANRIX_HEXA_CHPL: ChPLStructure = {
  name: createChPLSection(
    '1',
    'Nazwa produktu leczniczego',
    'Infanrix hexa proszek i zawiesina do sporządzania zawiesiny do wstrzykiwań.\nSzczepionka przeciwko błonicy (D), tężcowi (T), krztuścowi (komponenta acelularna) (Pa), wirusowemu zapaleniu wątroby typu B (rDNA) (HBV), poliomyelitis (inaktywowana) (IPV) i przeciwko Haemophilus influenzae typ b (Hib) skoniugowana (adsorbowana).',
    'pending_verification',
    'Nazwa produktu zgodna z oficjalną Charakterystyką Produktu Leczniczego zatwierdzoną przez EMA i GSK Polska.',
    INFANRIX_HEXA_DOC_SOURCE,
    1,
    INFANRIX_HEXA_PDF_URL,
    INFANRIX_HEXA_CHPL_DATE
  ),
  composition: createChPLSection(
    '2',
    'Skład jakościowy i ilościowy',
    'Po rekonstytucji 1 dawka (0,5 ml) zawiera:\n• Toksoid błoniczy (Diphtheria toxoid): nie mniej niż 30 j.m. (adsorbowany na wodorotlenku glinu Al(OH)3)\n• Toksoid tężcowy (Tetanus toxoid): nie mniej niż 40 j.m. (adsorbowany na wodorotlenku glinu Al(OH)3)\n• Antygeny Bordetella pertussis:\n   - Toksoid krztuścowy (PT): 25 mikrogramów\n   - Hemaglutynina włókienkowa (FHA): 25 mikrogramów\n   - Pertaktyna (PRN): 8 mikrogramów\n   (adsorbowane na wodorotlenku glinu Al(OH)3)\n• Antygen powierzchniowy Hepatitis B (r-HBsAg): 10 mikrogramów (otrzymywany z hodowli komórek drożdży Saccharomyces cerevisiae technologią rekombinacji DNA, adsorbowany na fosforanie glinu AlPO4)\n• Poliowirus (inaktywowany) (IPV) namnażany w komórkach Vero:\n   - typ 1 (szczep Mahoney): 40 jednostek antygenu D\n   - typ 2 (szczep MEF-1): 8 jednostek antygenu D\n   - typ 3 (szczep Saukett): 32 jednostki antygenu D\n• Polisacharyd Haemophilus influenzae typ b (fosforan polirybozylorybitolu, PRP): 10 mikrogramów, skoniugowany z toksoidem tężcowym jako nośnikiem białkowym około 25 mikrogramów (adsorbowany na fosforanie glinu AlPO4).\n\nAdiuwanty mineralne (zawartość glinu Al3+):\n- wodorotlenek glinu, uwodniony Al(OH)3: 0,5 mg Al3+\n- fosforan glinu AlPO4: 0,32 mg Al3+\nŁączna zawartość glinu w 1 dawce (0,5 ml): 0,82 mg Al3+.\n\nSubstancje pomocnicze o znanym działaniu (zgodnie z punktem 2 ChPL):\n• Laktoza bezwodna;\n• Sodu chlorek (sód: mniej niż 1 mmol / 23 mg na dawkę);\n• Potas: mniej niż 1 mmol / 39 mg na dawkę;\n• Kwas para-aminobenzoesowy;\n• Fenyloalanina: 0,0289 mikrograma na dawkę.\n(UWAGA – NIEZGODNOŚĆ WEWNĘTRZNA DOKUMENTACJI: W punkcie 4.4 ChPL podano wartość 0,0298 mikrograma na dawkę. Zachowano obie wartości zgodnie z punktami źródłowymi dokumentu bez ujednolicania – status: requires_clarification).\n\nPozostałości z procesu wytwarzania w ilościach śladowych: formaldehyd, neomycyna, polimyksyna.',
    'pending_verification',
    'Zweryfikowano z polską ChPL GSK i EMA: glin Al3+ łącznie 0,82 mg (0,5 mg + 0,32 mg); PRP nośnik tężcowy ok. 25 µg; fenyloalanina w pkt 2: 0,0289 µg/dawkę (rozbieżność z pkt 4.4: 0,0298 µg).',
    INFANRIX_HEXA_DOC_SOURCE,
    1,
    INFANRIX_HEXA_PDF_URL,
    INFANRIX_HEXA_CHPL_DATE
  ),
  pharmaceuticalForm: createChPLSection(
    '3',
    'Postać farmaceutyczna',
    'Proszek i zawiesina do sporządzania zawiesiny do wstrzykiwań.\n• Proszek: biały proszek w szklanej fiolce (składnik Hib).\n• Zawiesina: mętna, biała zawiesina w ampułko-strzykawce (składnik DTPa-HBV-IPV).\n• Po rekonstytucji: jednorodna, mętna biaława zawiesina.',
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
      'Szczepionka Infanrix hexa jest wskazana do szczepienia pierwotnego i uzupełniającego niemowląt i małych dzieci przeciwko błonicy, tężcowi, krztuścowi, wirusowemu zapaleniu wątroby typu B, poliomyelitis i zakażeniom wywoływanym przez Haemophilus influenzae typ b.\n\nStosowanie w populacji pediatrycznej (informacja kliniczna):\nBezpieczeństwo i skuteczność stosowania szczepionki Infanrix hexa u dzieci w wieku powyżej 36 miesięcy nie zostały ustalone (brak dostępnych danych klinicznych). Zapis ten wynika z braku badań klinicznych w tej grupie wiekowej i nie stanowi automatycznego, bezwzględnego ograniczenia samego wskazania klinicznego.\n\nStosowanie szczepionki powinno być zgodne z oficjalnymi zaleceniami (Program Szczepień Ochronnych).',
      'pending_verification',
      'Wskazanie do szczepienia pierwotnego i uzupełniającego. Informacja o braku danych >36 m.ż. oddzielona od samego wskazania.',
      INFANRIX_HEXA_DOC_SOURCE,
      2,
      INFANRIX_HEXA_PDF_URL,
      INFANRIX_HEXA_CHPL_DATE
    ),
    dosageAndAdministration: createChPLSection(
      '4.2',
      'Dawkowanie i sposób podawania',
      'Dawkowanie:\n\n1. Szczepienie pierwotne:\n• Schemat 3-dawkowy (np. w 2., 3., 4. miesiącu; 3., 4., 5. miesiącu lub 2., 4., 6. miesiącu życia):\n  - Składa się z 3 dawek po 0,5 ml.\n  - Odstęp pomiędzy kolejnymi dawkami pierwotnymi musi wynosić co najmniej 1 miesiąc.\n\n• Schemat 2-dawkowy (np. w 3. i 5. miesiącu życia):\n  - Składa się z 2 dawek po 0,5 ml.\n  - Odstęp pomiędzy kolejnymi dawkami pierwotnymi musi wynosić co najmniej 2 miesiące.\n\n• Rozszerzony Program Szczepień (EPI – w 6., 10., 14. tygodniu życia):\n  - Może być zastosowany jedynie wtedy, gdy noworodek otrzymał dawkę szczepionki przeciw WZW B tuż po urodzeniu.\n\n2. Szczepienie uzupełniające (przypominające):\n• Dawka uzupełniająca musi być podana w odstępie co najmniej 6 miesięcy od ostatniej dawki szczepienia pierwotnego.\n• Preferowany termin podania dawki uzupełniającej:\n  - po schemacie 2-dawkowym szczepienia pierwotnego: najlepiej pomiędzy 11. a 13. miesiącem życia;\n  - po schemacie 3-dawkowym szczepienia pierwotnego: najlepiej przed ukończeniem 18. miesiąca życia.\nJako minimum należy podać jedną dawkę szczepionki skoniugowanej przeciw Hib. Szczepionka Infanrix hexa może być zastosowana jako dawka uzupełniająca, jeśli jej podanie jest zgodne z oficjalnymi wytycznymi.\n\n3. Populacja dzieci w wieku powyżej 36 miesięcy:\nBezpieczeństwo i skuteczność u dzieci powyżej 36 miesięcy nie zostały ustalone (brak danych klinicznych).\n\nSposób podawania:\nInfanrix hexa przeznaczony jest do głębokiego wstrzyknięcia domięśniowego (i.m.), najlepiej w przednioboczną część uda u niemowląt i małych dzieci. Przy kolejnych dawkach zaleca się zmianę miejsca iniekcji (kolejne udo).\nPod żadnym pozorem nie wolno podawać dożylnie ani śródskórnie.',
      'pending_verification',
      'Rozdzielono schematy pierwotne (3 dawki: min. 1 mies.; 2 dawki: min. 2 mies.) oraz uzupełniające (min. 6 mies.; preferowane 11–13 m.ż. vs <18 m.ż.).',
      INFANRIX_HEXA_DOC_SOURCE,
      2,
      INFANRIX_HEXA_PDF_URL,
      INFANRIX_HEXA_CHPL_DATE
    ),
    contraindications: createChPLSection(
      '4.3',
      'Przeciwwskazania',
      'Szczepionka Infanrix hexa jest przeciwwskazana w następujących przypadkach:\n• Nadwrażliwość na substancje czynne lub na którąkolwiek substancję pomocniczą wymienioną w punkcie 6.1, bądź na substancje pozostałościowe z procesu wytwarzania (formaldehyd, neomycynę, polimyksynę).\n• Reakcje nadwrażliwości po wcześniejszym podaniu szczepionek przeciw błonicy, tężcowi, krztuścowi, wirusowemu zapaleniu wątroby typu B, poliomyelitis lub Hib.\n• Encefalopatia o nieznanej etiologii, która wystąpiła w ciągu 7 dni po wcześniejszym podaniu szczepionki zawierającej antygeny krztuśca. W takim przypadku należy bezwzględnie przerwać podawanie komponenty krztuścowej i kontynuować cykl szczepienia preparatami bezkrztuścowymi (DT, HBV, IPV, Hib).\n• Ostre, ciężkie choroby gorączkowe. Zgodnie z ogólnymi zasadami szczepień podanie szczepionki należy przełożyć do czasu ustąpienia ostrej fazy choroby. Łagodna infekcja (np. katar, przeziębienie bez wysokiej gorączki) nie stanowi przeciwwskazania do szczepienia.',
      'pending_verification',
      'Ściśle rzeczywiste przeciwwskazania z punktu 4.3 ChPL EMA (brak mieszania z ostrzeżeniami).',
      INFANRIX_HEXA_DOC_SOURCE,
      3,
      INFANRIX_HEXA_PDF_URL,
      INFANRIX_HEXA_CHPL_DATE
    ),
    warningsAndPrecautions: createChPLSection(
      '4.4',
      'Specjalne ostrzeżenia i środki ostrożności dotyczące stosowania',
      '• Badanie kwalifikacyjne: Przed każdym szczepieniem należy zebrać dokładny wywiad medyczny (ze szczególnym uwzględnieniem wcześniejszych szczepień i ewentualnych NOP) oraz przeprowadzić badanie lekarskie.\n\n• Zdarzenia w powiązaniu czasowym ze składnikiem krztuścowym (do starannego rozważenia przez lekarza):\nJeśli po podaniu szczepionki zawierającej antygeny krztuśca wystąpiło którekolwiek z poniższych zdarzeń, decyzję o podaniu kolejnych dawek szczepionki zawierającej krztusiec należy starannie rozważyć:\n  - temperatura ciała ≥ 40,0°C w ciągu 48 godzin od szczepienia, niewywołana innym zidentyfikowanym czynnikiem;\n  - zapaść lub stan podobny do wstrząsu (zespół hipotoniczno-hiporeaktywny, HHE) w ciągu 48 godzin od szczepienia;\n  - uporczywy, nieutulony płacz trwający ≥ 3 godziny, występujący w ciągu 48 godzin od szczepienia;\n  - drgawki z gorączką lub bez gorączki, występujące w ciągu 3 dni (72 godzin) od szczepienia.\nWAŻNE: Zdarzenia te NIE STANOWIĄ automatycznych, bezwzględnych przeciwwskazań do szczepienia. W sytuacjach szczególnych (np. wysokie ryzyko zakażenia krztuścem w otoczeniu) potencjalne korzyści ze szczepienia mogą przewyższać ryzyko.\n\n• Drgawki i zaburzenia neurologiczne: Występowanie w wywiadzie drgawek gorączkowych lub drgawek w rodzinie nie stanowi przeciwwskazania, wymaga jednak wzmożonej uwagi personelu.\n\n• Reakcje gorączkowe i ryzyko przy współpodawaniu z innymi szczepionkami (zgodnie z punktami 4.4 i 4.5 ChPL):\n  - PCV i MMRV: zwiększona częstość występowania reakcji gorączkowych w porównaniu z podaniem samego preparatu Infanrix hexa.\n  - Prevenar 13: zwiększona liczba zgłoszeń drgawek (z gorączką lub bez gorączki) oraz epizodów hipotoniczno-hiporeaktywnych (HHE) przy jednoczesnym podaniu z Infanrix hexa.\n  - Szczepionka przeciw MenB podawana jednocześnie z 7-walentną szczepionką pneumokokową (PCV7) i Infanrix hexa: wyższy wskaźnik gorączki (≥ 38,0°C), bólu w miejscu podania, utraty apetytu i drażliwości. W przypadku podawania szczepionki przeciw MenB jednocześnie ze szczepionkami skojarzonymi można rozważyć ich podanie w oddzielnych terminach („When possible, separate vaccinations can be considered”). Działań tych nie należy przypisywać samej szczepionce MenB.\n  - Postępowanie przeciwgorączkowe: profilaktyczne leczenie przeciwgorączkowe należy wdrożyć zgodnie z lokalnymi wytycznymi medycznymi.\n\n• Substancje pomocnicze o znanym działaniu (kwas para-aminobenzoesowy, fenyloalanina, sód, potas – zgodnie z oficjalnym tekstem ChPL):\n  - Kwas para-aminobenzoesowy: może powodować reakcje alergiczne (możliwe reakcje typu późnego) i wyjątkowo skurcz oskrzeli.\n  - Fenyloalanina: Szczepionka zawiera 0,0298 mikrograma fenyloalaniny w każdej dawce. Fenyloalanina może być szkodliwa dla pacjentów z fenyloketonurią (PKU).\n    (UWAGA – NIEZGODNOŚĆ WEWNĘTRZNA DOKUMENTACJI: W punkcie 2 ChPL podano wartość 0,0289 mikrograma na dawkę. Zachowano obie wartości zgodnie z dokumentem źródłowym bez ujednolicania – status: requires_clarification).\n  - Sód: Szczepionka zawiera mniej niż 1 mmol (23 mg) sodu na dawkę, to znaczy uznaje się ją za „wolną od sodu”.\n  - Potas: Szczepionka zawiera mniej niż 1 mmol (39 mg) potasu na dawkę, to znaczy uznaje się ją za „wolną od potasu”.\n\n• Zaburzenia krzepnięcia: U niemowląt z małopłytkowością lub zaburzeniami krzepnięcia krwi szczepionkę należy podawać ostrożnie ze względu na ryzyko krwawienia po iniekcji domięśniowej.\n\n• Gotowość przeciwwstrząsowa: Zawsze należy zapewnić możliwość natychmiastowego podjęcia leczenia anafilaksji (dostęp do roztworu adrenaliny 1:1000 i sprzętu reanimacyjnego) oraz obserwować pacjenta po szczepieniu.\n\n• Bardzo niedojrzałe wcześniaki (urodzone ≤ 28. tygodnia ciąży):\nPodczas podawania dawek szczepienia pierwotnego u bardzo niedojrzałych wcześniaków (urodzonych w 28. tygodniu ciąży lub wcześniej), a szczególnie u dzieci z niewydolnością oddechową w wywiadzie, należy wziąć pod uwagę potencjalne ryzyko bezdechu i konieczność monitorowania czynności oddechowych przez 48–72 godziny po szczepieniu.\nZgodnie z ChPL: Ponieważ korzyści ze szczepienia w tej grupie niemowląt są wysokie, szczepienia NIE NALEŻY WSTRZYMYWAĆ ANI OPÓŹNIAĆ wyłącznie z tego powodu.',
      'pending_verification',
      'Zawiera pełne ostrzeżenia o substancjach pomocniczych (kwas para-aminobenzoesowy, fenyloalanina 0,0298 µg z ostrzeżeniem o PKU, sód <1 mmol, potas <1 mmol), rozdzielone ryzyko współpodawania, ramy NOP (48 h / 3 dni) oraz wcześniaki ≤28 tc.',
      INFANRIX_HEXA_DOC_SOURCE,
      3,
      INFANRIX_HEXA_PDF_URL,
      INFANRIX_HEXA_CHPL_DATE
    ),
    interactions: createChPLSection(
      '4.5',
      'Interakcje z innymi produktami leczniczymi i inne rodzaje interakcji',
      'Współpodawanie z innymi szczepionkami:\nBadania kliniczne potwierdziły możliwość jednoczesnego podawania szczepionki Infanrix hexa z następującymi szczepionkami:\n• Skoniugowane szczepionki przeciw pneumokokom (PCV);\n• Skoniugowane szczepionki przeciw meningokokom serogrupy C (MenC);\n• Skoniugowane szczepionki przeciw meningokokom serogrup A, C, W-135 i Y (MenACWY);\n• Szczepionki przeciw meningokokom serogrupy B (MenB);\n• Doustne szczepionki przeciw rotawirusom;\n• Szczepionki przeciw odrze, śwince, różyczce i ospie wietrznej (MMRV – badania współpodawania w 2. roku życia wykazały brak interferencji immunologicznej).\n\nRozdzielenie profilu ryzyka i bezpieczeństwa przy współpodawaniu (zgodnie z ChPL EMA):\n\nA. Skoniugowane szczepionki przeciw pneumokokom (PCV) oraz szczepionki MMRV:\n- Dane z badań klinicznych wskazują na zwiększoną częstość występowania reakcji gorączkowych przy jednoczesnym podaniu w porównaniu z podaniem samego preparatu Infanrix hexa.\n\nB. Prevenar 13 (PCV13):\n- W ramach spontanicznego nadzoru bezpieczeństwa po wprowadzeniu do obrotu odnotowano zwiększoną liczbę zgłoszeń drgawek (z gorączką lub bez gorączki) oraz epizodów hipotoniczno-hiporeaktywnych (HHE) przy jednoczesnym podaniu Infanrix hexa z preparatem Prevenar 13 w porównaniu z podawaniem każdej z tych szczepionek osobno.\n\nC. Szczepionka przeciw meningokokom grupy B (MenB) podawana jednocześnie z 7-walentną skoniugowaną szczepionką pneumokokową (PCV7) i Infanrix hexa:\n- W badaniach klinicznych po jednoczesnym podaniu Infanrix hexa, szczepionki MenB oraz PCV7 obserwowano wyższy wskaźnik gorączki (≥ 38,0°C), częstsze konsultacje lekarskie z powodu gorączki, ból w miejscu podania, utratę apetytu oraz drażliwość.\n- PODANIE W ODDZIELNYCH TERMINACH: W przypadku podawania szczepionki przeciw MenB jednocześnie ze szczepionkami skojarzonymi (takimi jak Infanrix hexa) można rozważyć ich podanie w oddzielnych terminach („When possible, separate vaccinations can be considered”).\n- ZASADA INTERPRETACJI KLINICZNEJ: Nie należy przypisywać tych wszystkich działań niepożądanych samej szczepionce MenB – obserwowana zwiększona reaktogenność wynika ze złożonego skojarzenia trzech szczepionek podawanych w tym samym czasie (Infanrix hexa + MenB + PCV7).\n\nZasady techniczne podania:\nWstrzykiwane szczepionki należy zawsze podawać w różne miejsca anatomiczne ciała (np. w przeciwległe kończyny) przy użyciu oddzielnych strzykawek i igieł. Nie wolno mieszać w jednej strzykawce.\n\nImmunosupresja:\nU pacjentów poddawanych leczeniu immunosupresyjnemu lub z niedoborami odporności odpowiedź immunologiczna na szczepienie może nie zostać w pełni osiągnięta.',
      'pending_verification',
      'Zweryfikowano z ChPL EMA: precyzyjnie rozdzielono ryzyka (A. PCV/MMRV – gorączka; B. Prevenar 13 – drgawki/HHE; C. MenB+PCV7+Infanrix hexa – gorączka, ból, brak apetytu, drażliwość, opcja oddzielnych terminów).',
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
      'Nie dotyczy (produkt przeznaczony wyłącznie dla niemowląt i małych dzieci). W oficjalnym druku ChPL odnotowano: "Nieistotny".',
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
      'Profil bezpieczeństwa oparty na badaniach klinicznych z udziałem niemowląt i dzieci oraz nadzorze porejestracyjnym:\n• Bardzo często (≥ 1/10): utrata apetytu, gorączka ≥ 38°C, ból, zaczerwienienie, miejscowy obrzęk w miejscu wstrzyknięcia (≤ 50 mm), zmęczenie, drażliwość, nietypowy płacz, senność.\n• Często (≥ 1/100 do < 1/10): nerwowość, wymioty, biegunka, świąd, gorączka > 39,5°C, stwardnienie w miejscu podania, obrzęk w miejscu wstrzyknięcia (> 50 mm).\n• Niezbyt często (≥ 1/1 000 do < 1/100): infekcja górnych dróg oddechowych, kaszel, apatia, rozlany obrzęk kończyny, w którą wykonano iniekcję (niekiedy obejmujący sąsiedni staw).\n• Rzadko (≥ 1/10 000 do < 1/1 000): wysypka, pokrzywka.\n• Bardzo rzadko i zgłoszenia po wprowadzeniu do obrotu: reakcje anafilaktyczne, reakcje anafilaktoidalne (w tym obrzęk naczynioruchowy), drgawki (z gorączką lub bez gorączki), epizody hipotoniczno-hiporeaktywne (HHE), bezdech u bardzo niedojrzałych wcześniaków (urodzonych ≤ 28. tc).',
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
      'W oficjalnym druku ChPL EMA odnotowano: "Nie odnotowano" (No case of overdose has been reported). W badaniach klinicznych oraz monitorowaniu bezpieczeństwa nie stwierdzono specyficznych objawów związanych z podaniem dawki większej niż zalecana.',
      'pending_verification',
      'Oficjalna treść ChPL EMA: Nie odnotowano.',
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
      'Proszek Hib (Hib powder):\n- laktoza bezwodna (lactose anhydrous).\n\nZawiesina DTPa-HBV-IPV (DTPa-HBV-IPV suspension):\n- sodu chlorek (sodium chloride, NaCl);\n- Podłoże 199 (Medium 199 – zawierające głównie aminokwasy, w tym fenyloalaninę; sole mineralne, w tym sód i potas; witaminy, w tym kwas para-aminobenzoesowy; oraz inne substancje);\n- woda do wstrzykiwań (water for injections).\n\nSubstancje pomocnicze o działaniu adsorpcyjnym (adiuwanty):\nFor adjuvants, see section 2 („Substancje pomocnicze o działaniu adsorpcyjnym (adiuwanty): patrz punkt 2”).\n\n(Pozostałości z procesu wytwarzania w ilościach śladowych: formaldehyd, neomycyna, polimyksyna).',
      'pending_verification',
      'Kompletny zapis Medium 199 wg oficjalnej ChPL: aminokwasy (w tym fenyloalanina), sole mineralne (w tym sód i potas), witaminy (w tym kwas para-aminobenzoesowy) oraz inne substancje. Adiuwanty glinowe odsyłają do punktu 2.',
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
      'Okres ważności produktu leczniczego: 4 lata (zgodnie z aktualną dokumentacją EMA EPAR; wcześniejsze serie: 3 lata).\n\nPo rekonstytucji:\nZaleca się natychmiastowe zużycie szczepionki po jej sporządzeniu.\nWykazano jednak stabilność chemiczną i fizyczną sporządzonego preparatu przez 8 godzin w temperaturze 21°C.',
      'pending_verification',
      'Okres ważności zaktualizowany do 4 lat zgodnie z EMA EPAR (wcześniej 3 lata). Stabilność po rekonstytucji: 8 h w 21°C.',
      INFANRIX_HEXA_DOC_SOURCE,
      10,
      INFANRIX_HEXA_PDF_URL,
      INFANRIX_HEXA_CHPL_DATE
    ),
    storageSpecialPrecautions: createChPLSection(
      '6.4',
      'Specjalne środki ostrożności podczas przechowywania',
      '• Przechowywać w lodówce w temperaturze od 2°C do 8°C (bezwzględny wymóg utrzymania łańcucha chłodniczego).\n• Nie zamrażać. Zamrożenie nieodwracalnie niszczy strukturę adiuwantu mineralnego i bezwzględnie dyskwalifikuje szczepionkę z użycia.\n• Przechowywać w oryginalnym opakowaniu w celu ochrony przed światłem.\n\nCzasowe odchylenie temperatury (procedura awaryjna w punkcie szczepień):\nDane dotyczące stabilności wskazują, że składniki szczepionki zachowują stabilność w temperaturze do 25°C przez 72 godziny.\nUWAGA: Informacja ta służy personelowi medycznemu wyłącznie do oceny bezpieczeństwa i przydatności preparatu w przypadku przejściowego odchylenia temperatury (np. awaria lodówki, przerwa w dostawie prądu), a NIE jako zalecenie przechowywania leku poza lodówką.',
      'pending_verification',
      'Temperatura 2°C – 8°C. Informacja o 72 h w 25°C dotyczy wyłącznie czasowych odchyleń temperatury.',
      INFANRIX_HEXA_DOC_SOURCE,
      10,
      INFANRIX_HEXA_PDF_URL,
      INFANRIX_HEXA_CHPL_DATE
    ),
    containerNatureAndContents: createChPLSection(
      '6.5',
      'Rodzaj i zawartość opakowania',
      '• Proszek w fiolce ze szkła typu I z korkiem z gumy butylowej (składnik Hib).\n• 0,5 ml zawiesiny w ampułko-strzykawce ze szkła typu I z zatyczką i tłoczkiem z gumy butylowej (składnik DTPa-HBV-IPV).\n• Wielkości opakowań potwierdzone w EMA:\n  - 1 fiolka + 1 ampułko-strzykawka bez igły (EU/1/00/152/001);\n  - 1 fiolka + 1 ampułko-strzykawka z 2 osobnymi igłami (EU/1/00/152/002);\n  - 10 fiolek + 10 ampułko-strzykawek bez igieł (EU/1/00/152/005);\n  - 10 fiolek + 10 ampułko-strzykawek z 20 osobnymi igłami (EU/1/00/152/006);\n  - 1 fiolka + 1 ampułko-strzykawka z igłą / igłami (EU/1/00/152/021).\nNie wszystkie wielkości opakowań muszą znajdować się w obrocie na rynku polskim.',
      'pending_verification',
      'Opis opakowań zgodny ze zweryfikowanymi numerami pozwoleń EMA.',
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
    'Numery pozwolenia na dopuszczenie do obrotu w Unii Europejskiej potwierdzone w rejestrze EMA:\n• EU/1/00/152/001\n• EU/1/00/152/002\n• EU/1/00/152/005\n• EU/1/00/152/006\n• EU/1/00/152/021\n(Procedura centralna Europejskiej Agencji Leków – EMA).',
    'pending_verification',
    'Zapisano wyłącznie numery zweryfikowane w rejestrze EMA (usunięto niefortunny zapis zakresu 001–020).',
    INFANRIX_HEXA_DOC_SOURCE,
    11,
    INFANRIX_HEXA_PDF_URL,
    INFANRIX_HEXA_CHPL_DATE
  ),
  firstAuthorisationAndRenewal: createChPLSection(
    '9',
    'Data wydania pierwszego pozwolenia na dopuszczenie do obrotu i data przedłużenia pozwolenia',
    '• Data wydania pierwszego pozwolenia na dopuszczenie do obrotu: 23 października 2000 r.\n• Data ostatniego przedłużenia pozwolenia: 31 sierpnia 2010 r. (pozwolenie wydane na czas nieokreślony / bezterminowe).',
    'pending_verification',
    'Zweryfikowano z EMA SmPC: pierwsze pozwolenie 23.10.2000 r., odnowienie 31.08.2010 r.',
    INFANRIX_HEXA_DOC_SOURCE,
    11,
    INFANRIX_HEXA_PDF_URL,
    INFANRIX_HEXA_CHPL_DATE
  ),
  revisionDate: createChPLSection(
    '10',
    'Data zatwierdzenia lub częściowej zmiany tekstu charakterystyki produktu leczniczego',
    '• Data rewizji tekstu ChPL (zapis w oficjalnym druku unijnym EMA):\n  W unijnej Charakterystyce Produktu Leczniczego (Aneks I) punkt 10 zawiera urzędową formułę:\n  „Szczegółowe informacje o tym produkcie leczniczym są dostępne na stronie internetowej Europejskiej Agencji Leków http://www.ema.europa.eu”.\n  W procedurach centralnych dokładna data wejścia w życie decyzji publikowana jest w urzędowym rejestrze decyzji Komisji Europejskiej / EMA.\n\n• Rozróżnienie dat dokumentacji:\n  1. Data pierwszego dopuszczenia do obrotu: 23.10.2000 r.\n  2. Data ostatniego odnowienia pozwolenia: 31.08.2010 r.\n  3. Data publikacji druku informacyjnego GSK w Polsce (procedura VR 323859): 12.02.2026 r. (data proceduralna podmiotu odpowiedzialnego).\n  4. Data aktualizacji profilu EPAR w portalu internetowym EMA: data publikacji wersji elektronicznej na stronie agencji (nie jest tożsama z datą rewizji tekstu prawnego ChPL).',
    'pending_verification',
    'Rozdzielono datę rewizji tekstu ChPL, datę odnowienia pozwolenia (31.08.2010) oraz daty publikacji w portalach EMA i GSK.',
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
    marketingAuthorizationNumber: 'EU/1/00/152/001, EU/1/00/152/002, EU/1/00/152/005, EU/1/00/152/006, EU/1/00/152/021',
    rplRecordUrl: null, // Pozostawione jako null – publiczny rejestr RPL eZdrowie nie udostępnia statycznego permalinka do procedur centralnych EMA
    currentChplUrl: 'https://pl.gsk.com/media/b2ip1snt/infanrix-hexa-druki-pl-h-0296-ia-vr-323859-12_02_2026.pdf',
    chplRevisionDate: '12.02.2026',
    chplVersionDate: '12.02.2026',
    documentDownloadDate: '10.11.2026',
    userVerificationDate: null,
    userVerificationNotes: null,
    verificationStatus: 'requires_source_clarification',
    atcCode: 'J07CA09',
    sourceDiscrepancies: [
      {
        id: 'disc-phenylalanine-content-01',
        fieldName: 'Zawartość fenyloalaniny',
        firstValue: '0,0289 mikrograma na dawkę',
        firstSection: '2',
        secondValue: '0,0298 mikrograma na dawkę',
        secondSection: '4.4',
        documentUrl: 'https://pl.gsk.com/media/b2ip1snt/infanrix-hexa-druki-pl-h-0296-ia-vr-323859-12_02_2026.pdf',
        status: 'requires_clarification',
        description: 'Niezgodność wewnętrzna oficjalnej ChPL: punkt 2 podaje 0,0289 mikrograma fenyloalaniny na dawkę, podczas gdy punkt 4.4 podaje 0,0298 mikrograma na dawkę. Aplikacja VaxNurse nie ujednolica wartości automatycznie i blokuje status zweryfikowania do czasu urzędowego wyjaśnienia przez podmiot odpowiedzialny / URPL / EMA.',
        resolution: {
          documentId: '',
          issuer: '',
          documentDate: '',
          receivedDate: '',
          documentUrlOrLocation: '',
          verifierJustification: '',
          isResolved: false
        }
      }
    ],
    clarificationDocument: null,
    clarificationDate: null,
    clarificationSource: null,
    statusHistory: [
      {
        id: 'hist-init-01',
        timestamp: '10.11.2026 r., 12:00',
        previousStatus: 'pending_verification',
        newStatus: 'requires_source_clarification',
        reason: 'Wykryto niezgodność wewnętrzną ChPL (disc-phenylalanine-content-01: zawartość fenyloalaniny 0,0289 µg vs 0,0298 µg). Blokada zatwierdzenia.',
        author: 'System kontroli zgodności ChPL VaxNurse'
      }
    ],
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
