import type {
  PsoHbvPepMatrixRow,
  PsoPartICPostExposureEntry,
  PsoPartIIRecommendedRow,
  PsoPartVIIScheduleTable,
  PsoRabiesContactMatrixRow,
  PsoRiskGroupMandatoryBlock,
  PsoSourceDocumentMeta,
  PsoStructuredRecord,
  PsoSubsectionCompletenessEntry,
  PsoSupplementaryDiseaseSection,
  PsoTetanusPepRow,
} from '../types/pso2027';
import {
  PSO_CATCH_UP_12_POINTS_PART_V,
  PSO_GENERAL_PRINCIPLES_PART_IV,
  STAFF_QUALIFICATIONS_PSO_PART_VI,
} from './childVaccinesData';

/**
 * Pojedyncze, jednoznaczne metadane źródła głównego dla całego modułu PSO 2027.
 */
export const PSO_2027_SOURCE_META: PsoSourceDocumentMeta = {
  sourceTitle:
    'Komunikat Głównego Inspektora Sanitarnego z dnia 28 października 2026 r. w sprawie Programu Szczepień Ochronnych na rok 2027',
  gisAnnouncementDate: '28.10.2026',
  journalPublicationDate: '30.10.2026',
  journalCitation: 'Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77',
  officialPdfUrl: 'https://dziennikmz.mz.gov.pl/DUM_MZ/2026/77/akt.pdf',
  gisPortalUrl: 'https://www.gov.pl/web/gis/program-szczepien-ochronnych-na-2027-rok',
  totalPages: 48,
  pdfSha256: '4C6FA9212F292B130FD8958BAAEEAC2444F86FBAA260B873D586B905108FC6DA',
};

// =============================================================================
// CZĘŚĆ I — SZCZEPIENIA OBOWIĄZKOWE (str. 2, 4–18)
// =============================================================================

export const PSO_PART_IA_SCOPE_NOTES = {
  subsectionIA: {
    code: 'I.A',
    title: 'Szczepienia obowiązkowe dzieci i młodzieży',
    sourcePages: [2, 4, 5, 6, 7, 8],
    officialScopeRule:
      'Dotyczy zarówno dzieci urodzonych w Polsce, jak i dzieci, które nie były szczepione według polskiego PSO, a przebywają w Polsce dłużej niż 3 miesiące.',
    relatedRecords: [
      'pso-bcg-0',
      'pso-hbv-1',
      'pso-rv-1',
      'pso-pcv-1',
      'pso-dtp-1',
      'pso-hbv-2',
      'pso-hib-1',
      'pso-rv-2',
      'pso-dtp-2',
      'pso-ipv-1',
      'pso-hib-2',
      'pso-pcv-2',
      'pso-rv-3',
      'pso-dtp-3',
      'pso-ipv-2',
      'pso-hib-3',
      'pso-hbv-3',
      'pso-mmr-1',
      'pso-pcv-3',
      'pso-dtp-4',
      'pso-ipv-3',
      'pso-hib-4',
      'pso-dtap-boost-6',
      'pso-ipv-boost-6',
      'pso-mmr-boost-9',
      'pso-dtap-boost-14',
      'pso-dt-boost-19',
    ],
  },
  subsectionIA1: {
    code: 'I.A.1',
    title:
      'Wariant szczepień w populacji ogólnej dzieci do 2 lat z użyciem szczepionki wysokoskojarzonej 5w1 (DTaP-IPV-Hib)*',
    sourcePages: [9, 10],
    footnoteText: '* Informacje o schematach dla dzieci z grup ryzyka – patrz cz. III.',
    keyScheduleHighlights: [
      'Od 1. doby życia do wypisu ze szpitala: GRUŹLICY (BCG) oraz WZW typu B (1. dawka w schemacie 3-dawkowym).',
      'W 2. m.ż. (od ukończenia 6. tyg.): Rotawirusy (1. dawka), WZW B (2. dawka po 4 tyg.), 5w1 DTaP-IPV-Hib (1. dawka), Pneumokoki PCV (1. dawka).',
      'W 4. m.ż.: Rotawirusy (2. dawka po 4 tyg.), 5w1 DTaP-IPV-Hib (2. dawka po 8 tyg.), Pneumokoki PCV (2. dawka po 8 tyg.).',
      'W 5.–6. m.ż.: Rotawirusy (3. dawka w schemacie 3-dawkowym po 4 tyg. od drugiej).',
      'W 6.–7. m.ż. (od ukończenia 5. m.ż.): WZW typu B (3. dawka) oraz 5w1 DTaP-IPV-Hib (3. dawka).',
      'W 13.–15. m.ż.: MMR (szczepienie podstawowe) oraz Pneumokoki PCV (3. dawka co najmniej 6 mies. od drugiej).',
      'W 16.–18. m.ż.: 5w1 DTaP-IPV-Hib (4. dawka).',
    ],
  },
  subsectionIA2: {
    code: 'I.A.2',
    title:
      'Wariant szczepień w populacji ogólnej dzieci do 2 lat z użyciem szczepionki wysokoskojarzonej 6w1 (DTaP-IPV-Hib-HBV)*',
    sourcePages: [11, 12],
    footnoteText: '* Informacje o schematach dla dzieci z grup ryzyka – patrz cz. III.',
    keyScheduleHighlights: [
      'Od 1. doby życia do wypisu ze szpitala: GRUŹLICY (BCG) oraz WZW typu B.',
      'W 2. m.ż. (od ukończenia 6. tyg.): Rotawirusy (1. dawka), 6w1 DTaP-IPV-Hib-HBV (1. dawka), Pneumokoki PCV (1. dawka).',
      'W 3. m.ż.: Rotawirusy (2. dawka po 4 tyg. od pierwszej).',
      'W 4. m.ż. (od ukończenia 12. tyg.): Rotawirusy (3. dawka w schemacie 3-dawkowym po 4 tyg. od drugiej), 6w1 (2. dawka), Pneumokoki PCV (2. dawka po 8 tyg. od pierwszej).',
      'W 5.–6. m.ż. (od ukończenia 4. m.ż.): 6w1 DTaP-IPV-Hib-HBV (3. dawka).',
      'W 13.–15. m.ż.: MMR (szczepienie podstawowe) oraz Pneumokoki PCV (3. dawka co najmniej 6 mies. od drugiej).',
      'W 16.–18. m.ż. (co najmniej 6 mies. od ostatniej dawki): 6w1 DTaP-IPV-Hib-HBV (4. dawka).',
    ],
  },
} as const;

export const PSO_PART_IB_RISK_BLOCKS: PsoRiskGroupMandatoryBlock[] = [
  {
    id: 'pso-ib-transplant-asplenia',
    sourceSubsection: 'I.B',
    sourcePages: [13],
    diseaseOrGroupTitle:
      'Szczepienia obowiązkowe osób przed lub po przeszczepieniu komórek krwiotwórczych, narządów wewnętrznych, splenektomii / z asplenią',
    obligatedPersonsIntro:
      'Osoby, przed lub po przeszczepieniu komórek krwiotwórczych, narządów wewnętrznych, przed lub po splenektomii, z asplenią, z zaburzeniami czynności śledziony:',
    obligatedGroups: [
      { label: '1)', text: 'błonicy;' },
      { label: '2)', text: 'inwazyjnym zakażeniom Haemophilus influenzae typu b;' },
      { label: '3)', text: 'inwazyjnym zakażeniom Streptococcus pneumoniae;' },
      { label: '4)', text: 'krztuścowi;' },
      { label: '5)', text: 'nagminnemu zapaleniu przyusznic (śwince);' },
      { label: '6)', text: 'odrze;' },
      { label: '7)', text: 'ostremu nagminnemu porażeniu dziecięcemu (poliomyelitis);' },
      { label: '8)', text: 'różyczce;' },
      { label: '9)', text: 'tężcowi;' },
      { label: '10)', text: 'wirusowemu zapaleniu wątroby typu B.' },
    ],
    officialNotes:
      'Szczepienia są wykonywane zgodnie z aktualną wiedzą medyczną i rekomendacjami towarzystw naukowych, według schematu ustalonego indywidualnie przez lekarza.',
    relatedRecords: ['pso-risk-preterm-pcv', 'pso-hepb-unvaccinated-primary'],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-ib-pneumococcal',
    sourceSubsection: 'I.B',
    sourcePages: [13],
    diseaseOrGroupTitle: 'Inwazyjnym zakażeniom STREPTOCOCCUS PNEUMONIAE (grupy ryzyka do 19. r.ż.)',
    obligatedPersonsIntro:
      'Osoby do ukończenia 19. roku życia, które nie były szczepione przeciw inwazyjnym zakażeniom Streptococcus pneumoniae:',
    obligatedGroups: [
      { label: '1)', text: 'po urazie lub z wadą ośrodkowego układu nerwowego, przebiegającą z wyciekiem płynu mózgowo-rdzeniowego,' },
      { label: '2)', text: 'przed wszczepieniem lub po wszczepieniu implantu ślimakowego,' },
      { label: '3)', text: 'przed lub po leczeniu immunosupresyjnym lub biologicznym,' },
      { label: '4)', text: 'z wrodzonymi lub nabytymi niedoborami odporności, z nowotworami, małopłytkowością idiopatyczną, sferocytozą wrodzoną,' },
      { label: '5)', text: 'z wrodzonymi wadami serca i przewlekłymi chorobami serca,' },
      { label: '6)', text: 'z przewlekłą niewydolnością nerek lub zespołem nerczycowym,' },
      { label: '7)', text: 'z chorobami metabolicznymi, w tym cukrzycą,' },
      { label: '8)', text: 'z przewlekłymi chorobami płuc, w tym astmą,' },
      { label: '9)', text: 'osoby po przeszczepieniu komórek krwiotwórczych.' },
    ],
    officialNotes:
      'Szczepienia są wykonywane zgodnie z Charakterystyką Produktu Leczniczego oraz z aktualną wiedzą medyczną.',
    relatedRecords: ['pso-pcv-1', 'pso-pcv-2', 'pso-pcv-3', 'pso-risk-preterm-pcv'],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-ib-hbv',
    sourceSubsection: 'I.B',
    sourcePages: [13, 14],
    diseaseOrGroupTitle: 'WIRUSOWEMU ZAPALENIU WĄTROBY typu B (grupy ryzyka klinicznego i epidemiologicznego)',
    obligatedPersonsIntro: 'Osoby obowiązane do poddania się szczepieniu przeciw WZW typu B:',
    obligatedGroups: [
      {
        label: '1)',
        text: 'uczniowie szkół medycznych lub innych szkół prowadzących kształcenie związane z wykonywaniem zawodów w zakresie nauk medycznych lub nauk o zdrowiu, którzy nie byli szczepieni przeciw WZW typu B;',
      },
      {
        label: '2)',
        text: 'studenci uczelni prowadzących kształcenie na studiach na kierunkach związanych z kształceniem w zakresie nauk medycznych lub nauk o zdrowiu, którzy nie byli szczepieni przeciw WZW typu B;',
      },
      {
        label: '3)',
        text: 'osoby szczególnie narażone na zakażenie w wyniku styczności z osobą zakażoną WZW typu B, które nie były szczepione przeciw WZW typu B;',
      },
      {
        label: '4)',
        text: 'osoby zakażone wirusem zapalenia wątroby typu C, które nie były szczepione przeciw WZW typu B;',
      },
      {
        label: '5)',
        text: 'osoby wykonujące zawód medyczny narażone na zakażenie, które nie były szczepione przeciw WZW typu B;',
      },
      {
        label: '6)',
        text: 'osoby w fazie zaawansowanej choroby nerek z filtracją kłębuszkową poniżej 30 ml/min oraz osoby dializowane, które nie były szczepione przeciw WZW typu B;',
      },
      {
        label: '7)',
        text: 'osoby przed lub po przeszczepieniu komórek krwiotwórczych, narządów wewnętrznych, splenektomii, albo z asplenią, z zaburzeniami czynności śledziony;',
      },
      { label: '8)', text: 'kobiety planujące ciążę, które nie były szczepione przeciw WZW typu B.' },
    ],
    officialNotes:
      'Schemat szczepienia zgodnie z Charakterystyką Produktu Leczniczego. Nie należy szczepić osób uprzednio zaszczepionych podstawowo przeciw WZW typu B, o ile posiadają wykrywalny poziom przeciwciał anty-HBs. U osób zdrowych nie przewiduje się rutynowych szczepień przypominających. W celu oceny odporności poszczepiennej u osób z grup ryzyka zakażenia WZW typu B zaleca się określenie poziomu przeciwciał anty-HBs nie wcześniej niż po 4 tygodniach od podania ostatniej dawki szczepienia (najlepiej między 4. i 6. tygodniem).',
    relatedRecords: [
      'pso-hepb-unvaccinated-primary',
      'pso-hepb-dialysis-primary',
      'pso-hepb-dialysis-booster',
    ],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-ib-varicella',
    sourceSubsection: 'I.B',
    sourcePages: [14],
    diseaseOrGroupTitle: 'OSPIE WIETRZNEJ (obowiązkowe grupy ryzyka i instytucjonalne do 19. r.ż.)',
    obligatedPersonsIntro:
      'Dzieci i młodzież do ukończenia 19. roku życia, które nie chorowały na ospę wietrzną:',
    obligatedGroups: [
      {
        label: '1)',
        text: 'dzieci i młodzież do ukończenia 19. roku życia, które nie chorowały na ospę wietrzną:',
        subItems: [
          {
            label: 'a)',
            text: 'z upośledzeniem odporności wrodzonym lub nabytym o wysokim ryzyku ciężkiego przebiegu choroby po konsultacji specjalistycznej,',
          },
          { label: 'b)', text: 'przed planowanym leczeniem immunosupresyjnym lub chemioterapią;' },
        ],
      },
      {
        label: '2)',
        text: 'dzieci i młodzież do ukończenia 19. roku życia, które nie chorowały na ospę wietrzną, z otoczenia osób określonych w pkt 1;',
      },
      {
        label: '3)',
        text: 'dzieci i młodzież do ukończenia 19. roku życia, które nie chorowały na ospę wietrzną, przebywające albo zakwalifikowane do pobytu w:',
        subItems: [
          { label: 'a)', text: 'zakładach pielęgnacyjno-opiekuńczych,' },
          { label: 'b)', text: 'zakładach opiekuńczo-leczniczych,' },
          { label: 'c)', text: 'rodzinnych domach dziecka,' },
          { label: 'd)', text: 'domach dla matek z małoletnimi dziećmi i kobiet w ciąży,' },
          { label: 'e)', text: 'domach pomocy społecznej,' },
          { label: 'f)', text: 'placówkach opiekuńczo-wychowawczych,' },
          { label: 'g)', text: 'regionalnych placówkach opiekuńczo-terapeutycznych,' },
          { label: 'h)', text: 'interwencyjnych ośrodkach preadopcyjnych,' },
          { label: 'i)', text: 'żłobkach lub klubach dziecięcych.' },
        ],
      },
    ],
    officialNotes: 'Schemat 2-dawkowy szczepienia – zgodnie z Charakterystyką Produktu Leczniczego.',
    relatedRecords: ['pso-risk-vzv-special', 'pso-rec-vzv-1'],
    verificationStatus: 'verified',
  },
];

export const PSO_PART_IC_ENTRIES: PsoPartICPostExposureEntry[] = [
  {
    id: 'pso-ic-diphtheria',
    sourceSubsection: 'I.C',
    sourcePage: 15,
    disease: 'BŁONICY',
    obligatedPersons: 'Obowiązek dotyczy osób narażonych na zakażenie, które miały styczność z chorym na BŁONICĘ.',
    officialNotes:
      'Szczepionką skojarzoną przeciw BŁONICY i TĘŻCOWI (Td). W przypadku indywidualnych wskazań klinicznych możliwe jest zastosowanie szczepionki monowalentnej przeciw BŁONICY (d). Liczba dawek i schemat szczepienia – zgodnie z Charakterystyką Produktu Leczniczego i zaleceniami lekarza. Patrz cz. III PSO „Informacje uzupełniające – zasady szczepień przeciw wybranym chorobom zakaźnym”.',
    crossRefSubsection: 'III.E',
    relatedRecords: ['pso-dtp-1', 'pso-dtap-boost-6', 'pso-dtap-boost-14', 'pso-dt-boost-19'],
  },
  {
    id: 'pso-ic-tetanus',
    sourceSubsection: 'I.C',
    sourcePage: 15,
    disease: 'TĘŻCOWI',
    obligatedPersons: 'Obowiązek dotyczy osób zranionych, narażonych na zakażenie TĘŻCEM.',
    officialNotes:
      'Szczepionką monowalentną przeciw tężcowi (T) albo szczepionką skojarzoną przeciw BŁONICY, TĘŻCOWI (Td) albo szczepionką przeciw BŁONICY, TĘŻCOWI, KRZTUŚCOWI ze zmniejszoną zawartością komponentu krztuścowego zawierającą bezkomórkowy komponent krztuśca Tdap – w przypadku osób objętych zgodnie z częścią I. PSO obowiązkiem szczepień przeciw krztuścowi. Liczba dawek i schemat szczepienia – zgodnie z Charakterystyką Produktu Leczniczego. Patrz cz. I.E oraz cz. III PSO.',
    crossRefSubsection: 'I.E',
    relatedRecords: ['pso-dtp-1', 'pso-dtap-boost-14', 'pso-dt-boost-19'],
  },
  {
    id: 'pso-ic-rabies',
    sourceSubsection: 'I.C',
    sourcePage: 15,
    disease: 'WŚCIEKLIŹNIE',
    obligatedPersons:
      'Obowiązek dotyczy osób mających styczność ze zwierzęciem chorym na WŚCIEKLIZNĘ lub podejrzanym o zakażenie wirusem WŚCIEKLIZNY.',
    officialNotes:
      'Liczba dawek i schemat szczepienia – zgodnie z Charakterystyką Produktu Leczniczego. Patrz cz. I.D PSO „PROFILAKTYKA POEKSPOZYCYJNA PRZECIW WŚCIEKLIŹNIE”.',
    crossRefSubsection: 'I.D',
    relatedRecords: ['pso-rabies-postexposure'],
  },
];

export const PSO_PART_ID_RABIES_RULES = {
  sourceSubsection: 'I.D',
  sourcePages: [16, 17],
  introText:
    'Wytyczne dotyczą swoistego zapobiegania WŚCIEKLIŹNIE u osób mających styczność ze zwierzęciem chorym na WŚCIEKLIZNĘ lub podejrzanym o zakażenie wirusem WŚCIEKLIZNY. Przedstawiono również zasady immunoprofilaktyki czynno-biernej.',
  qualificationRule:
    'Kwalifikację do szczepienia szczepionką przeciw WŚCIEKLIŹNIE przeprowadza lekarz specjalistycznej poradni chorób zakaźnych, a w przypadku szczepień profilaktycznych – realizacja na zasadach ogólnych dotyczących szczepień zalecanych.',
  activePreventionRule:
    'Swoiste zapobieganie czynne: szczepienia według skróconego (tj. poekspozycyjnego) schematu szczepień – liczba dawek i schemat szczepienia – zgodnie z Charakterystyką Produktu Leczniczego.',
  activePassiveRule:
    'Swoiste zapobieganie czynno-bierne: jak wyżej oraz jednocześnie z pierwszą dawką szczepionki podaje się swoistą immunoglobulinę ludzką przeciw WŚCIEKLIŹNIE – 20 j.m./kg mc. Immunoglobulinę można podać do 7 dni od podania pierwszej dawki szczepionki.',
  observationRules: [
    'Można się wstrzymać z rozpoczęciem szczepień ochronnych przeciw WŚCIEKLIŹNIE do chwili potwierdzenia WŚCIEKLIZNY u zwierzęcia, o ile jest możliwe: przeprowadzenie badania zwierzęcia wykazującego objawy WŚCIEKLIZNY lub poddanie badaniu pośmiertnemu zwierzęcia podejrzanego o WŚCIEKLIZNĘ lub poddanie obserwacji weterynaryjnej trwającej do 15 dni zwierzęcia podejrzanego o zakażenie, z którym osoba narażona miała styczność.',
    'Jeżeli ponownemu narażeniu uległa osoba uprzednio już szczepiona przeciw WŚCIEKLIŹNIE (w ramach szczepień przed lub poekspozycyjnych) podaje się tylko dawki przypominające szczepionki przeciw WŚCIEKLIŹNIE według schematu szczepienia przypominającego – zgodnie z Charakterystyką Produktu Leczniczego. Nie należy wówczas podawać swoistej immunoglobuliny lub surowicy.',
  ],
} as const;

export const PSO_PART_ID_RABIES_MATRIX: PsoRabiesContactMatrixRow[] = [
  {
    id: 'rabies-row-1',
    contactCategory: 'Brak ran lub kontakt pośredni',
    contactCategoryRowSpan: 1,
    atExposureAnimalState: '–',
    observation15Days: '–',
    preventionAction: 'Nie wymaga.',
  },
  {
    id: 'rabies-row-2',
    contactCategory: 'Oślinienie zdrowej skóry',
    contactCategoryRowSpan: 1,
    atExposureAnimalState: '–',
    observation15Days: '–',
    preventionAction: 'Nie wymaga.',
  },
  {
    id: 'rabies-row-3',
    contactCategory: 'Oślinienie uszkodzonej skóry, lekkie pogryzienia i zadrapania',
    contactCategoryRowSpan: 3,
    atExposureAnimalState: 'Zwierzę zdrowe',
    observation15Days: 'Objawy wścieklizny',
    preventionAction: 'Rozpoczęcie podawania szczepionki z chwilą zaobserwowania objawów wścieklizny u zwierzęcia.',
  },
  {
    id: 'rabies-row-4',
    contactCategory: 'Oślinienie uszkodzonej skóry, lekkie pogryzienia i zadrapania',
    contactCategoryRowSpan: 0,
    atExposureAnimalState: 'Zwierzę podejrzane o wściekliznę',
    observation15Days: 'Zwierzę zdrowe (niepotwierdzone objawy)',
    preventionAction: 'Natychmiastowe rozpoczęcie podawania szczepionki – przerwać, gdy zwierzę zdrowe.',
  },
  {
    id: 'rabies-row-5',
    contactCategory: 'Oślinienie uszkodzonej skóry, lekkie pogryzienia i zadrapania',
    contactCategoryRowSpan: 0,
    atExposureAnimalState: 'Zwierzę wściekłe, dzikie, nieznane, niebadane',
    observation15Days: '–',
    preventionAction: 'Natychmiastowe rozpoczęcie podawania szczepionki.',
  },
  {
    id: 'rabies-row-6',
    contactCategory: 'Głębokie pogryzienia, zadrapania, oślinienie błon śluzowych',
    contactCategoryRowSpan: 3,
    atExposureAnimalState: 'Zwierzę zdrowe',
    observation15Days: 'Objawy wścieklizny',
    preventionAction: 'Natychmiastowe rozpoczęcie podawania szczepionki i swoistej immunoglobuliny.',
  },
  {
    id: 'rabies-row-7',
    contactCategory: 'Głębokie pogryzienia, zadrapania, oślinienie błon śluzowych',
    contactCategoryRowSpan: 0,
    atExposureAnimalState: 'Zwierzę podejrzane o wściekliznę',
    observation15Days: 'Zwierzę zdrowe (niepotwierdzone objawy)',
    preventionAction: 'Natychmiastowe rozpoczęcie podawania szczepionki i swoistej immunoglobuliny – przerwać, gdy zwierzę zdrowe.',
  },
  {
    id: 'rabies-row-8',
    contactCategory: 'Głębokie pogryzienia, zadrapania, oślinienie błon śluzowych',
    contactCategoryRowSpan: 0,
    atExposureAnimalState: 'Zwierzę wściekłe, dzikie, nieznane, niebadane',
    observation15Days: '–',
    preventionAction: 'Natychmiastowe rozpoczęcie podawania szczepionki i swoistej immunoglobuliny.',
  },
];

export const PSO_PART_IE_TETANUS_MATRIX: PsoTetanusPepRow[] = [
  {
    id: 'tetanus-row-1',
    vaccinationHistory: 'Nieszczepieni lub niekompletnie szczepieni lub z niepewną historią szczepień',
    lowRiskAction:
      'Szczepionka tężcowo-błonicza albo tężcowa – następnie należy kontynuować kolejne dawki szczepienia według schematu: 0; 1; 6 miesiąc.',
    highRiskAction:
      'Szczepionka tężcowo-błonicza albo tężcowa oraz antytoksyna (LIT – swoista immunoglobulina 250/500 j.m.) – następnie należy kontynuować kolejne dawki szczepienia szczepionką tężcowo-błoniczą albo tężcową według schematu: 0; 1; 6 miesiąc.',
  },
  {
    id: 'tetanus-row-2',
    vaccinationHistory: 'Szczepienie podstawowe lub przypominające – ostatnia dawka więcej niż 10 lat temu',
    lowRiskAction:
      'Szczepionka tężcowo-błonicza albo tężcowa, albo przeciw BŁONICY, TĘŻCOWI, KRZTUŚCOWI ze zmniejszoną zawartością komponentu krztuścowego zawierająca bezkomórkowy komponent krztuśca Tdap – jedna przypominająca dawka (koszt zakupu szczepionki ponosi osoba szczepiona*).',
    highRiskAction:
      'Szczepionka tężcowo-błonicza albo tężcowa (szczepionki finansowane ze środków publicznych) albo szczepionka przeciw BŁONICY, TĘŻCOWI, KRZTUŚCOWI ze zmniejszoną zawartością komponentu krztuścowego zawierająca bezkomórkowy komponent krztuśca Tdap (koszt zakupu szczepionki ponosi osoba szczepiona*) – jedna dawka przypominająca oraz antytoksyna (LIT – swoista immunoglobulina 250/500 j.m.).',
  },
  {
    id: 'tetanus-row-3',
    vaccinationHistory: 'Szczepienie podstawowe lub przypominające – ostatnia dawka 5–10 lat temu',
    lowRiskAction:
      'Szczepionka tężcowo-błonicza albo tężcowa, albo przeciw BŁONICY, TĘŻCOWI, KRZTUŚCOWI – jedna przypominająca dawka (koszt zakupu szczepionki ponosi osoba szczepiona*).',
    highRiskAction:
      'Szczepionka tężcowo-błonicza albo tężcowa (szczepionki finansowane ze środków publicznych), albo przeciw BŁONICY, TĘŻCOWI, KRZTUŚCOWI (koszt zakupu szczepionki ponosi osoba szczepiona*) – jedna dawka przypominająca.',
  },
  {
    id: 'tetanus-row-4',
    vaccinationHistory: 'Szczepienie podstawowe lub przypominające – ostatnia dawka mniej niż 5 lat temu',
    lowRiskAction: 'Nie wymaga.',
    highRiskAction:
      'Nie wymaga. Ewentualnie, gdy szczególnie wysokie ryzyko, należy rozważyć szczepienie szczepionką tężcowo-błoniczą albo tężcową (szczepionki finansowane ze środków publicznych), albo przeciw BŁONICY, TĘŻCOWI, KRZTUŚCOWI (koszt zakupu szczepionki ponosi osoba szczepiona*) – jedna dawka przypominająca.',
  },
];

export const PSO_PART_IE_FOOTNOTE =
  '* W przypadku osób objętych zgodnie z częścią I. PSO obowiązkiem szczepień przeciw KRZTUŚCOWI szczepionka jest finansowana ze środków publicznych.';

// =============================================================================
// CZĘŚĆ II — SZCZEPIENIA ZALECANE ORAZ INNE FORMY IMMUNOPROFILAKTYKI (str. 19–35)
// =============================================================================

export const PSO_PART_IIA_PEDIATRIC_RECOMMENDED: PsoPartIIRecommendedRow[] = [
  {
    id: 'pso-iia-covid',
    sourceSubsection: 'II.A',
    sourcePages: [19],
    vaccinationType: 'zalecane',
    populationScope: 'children_and_adolescents',
    subjectLabel: 'COVID-19',
    recommendations: 'Od ukończenia 6. miesiąca życia do 18. roku życia.',
    notes: 'Zgodnie z komunikatami Ministra Zdrowia.',
    relatedRecords: ['pso-rec-covid-pediatric'],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iia-influenza',
    sourceSubsection: 'II.A',
    sourcePages: [19, 20],
    vaccinationType: 'zalecane',
    populationScope: 'children_and_adolescents',
    subjectLabel: 'GRYPIE',
    recommendations:
      '1. W związku z przesłankami epidemiologicznymi – szczepienie zalecane osobom od ukończenia 6. miesiąca życia (zdrowym dzieciom 6. m.ż.–18. r.ż., ze szczególnym uwzględnieniem 6.–60. m.ż.; strategia kokonowa wokół niemowląt <6. m.ż., starszych lub przewlekle chorych; pacjenci ZOL, ZPO, DPS i placówek opieki całodobowej). 2. W związku z przesłankami klinicznymi i indywidualnymi: po transplantacji narządów; przewlekle chorym dzieciom od ukończenia 6. m.ż.; w stanach obniżonej odporności; dzieciom z grup ryzyka od ukończenia 6. m.ż. do 18. r.ż. (w tym HIV, schorzenia immunologiczno-hematologiczne, leczeni przewlekle salicylanami); z wadami wrodzonymi serca, niewydolnością serca, nadciśnieniem płucnym.',
    notes: 'Szczepionki są ważne tylko jeden sezon epidemiczny ze względu na zmiany ich składu według zaleceń Światowej Organizacji Zdrowia.',
    relatedRecords: ['pso-rec-influenza-1'],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iia-meningococci',
    sourceSubsection: 'II.A',
    sourcePages: [20],
    vaccinationType: 'zalecane',
    populationScope: 'children_and_adolescents',
    subjectLabel: 'Inwazyjnym zakażeniom NEISSERIA MENINGITIDIS',
    recommendations:
      '1) niemowlętom od ukończenia 6. tygodnia życia lub 8. tygodnia życia w zależności od rodzaju szczepionki; 2) dzieciom narażonym na ryzyko inwazyjnej choroby meningokokowej w wyniku bliskich kontaktów z chorymi lub materiałem zakaźnym oraz w zbiorowiskach (m.in. żłobki, przedszkola, domy studenckie, internaty); 3) dzieciom z wrodzonymi niedoborami odporności (asplenia, HIV, nowotwór złośliwy, choroba reumatyczna, przewlekła choroba nerek/wątroby, niedobór dopełniacza w tym leczonym ekulizumabem z powodu PNH lub aHUS, przed/po HSCT, immunosupresja); 4) dzieciom od ukończenia 2. miesiąca życia z grup ryzyka zaburzeń odporności oraz szczególnie narażonym nastolatkom.',
    notes:
      'Szczepienie może być wykonane: 1) szczepionką białkową przeciw serogrupie B; 2) szczepionką skoniugowaną, 4-walentną przeciw serogrupom A, C, W, Y. Szczepienie nie jest elementem postępowania poekspozycyjnego.',
    relatedRecords: ['pso-rec-menb-1', 'pso-rec-menacwy-1'],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iia-tbe',
    sourceSubsection: 'II.A',
    sourcePages: [20],
    vaccinationType: 'zalecane',
    populationScope: 'children_and_adolescents',
    subjectLabel: 'KLESZCZOWEMU ZAPALENIU MÓZGU (KZM)',
    recommendations:
      'Szczepienie zalecane osobom szczególnie często podejmującym aktywność fizyczną poza pomieszczeniami (np. rodzinom z małymi dziećmi) i innym osobom podejmującym aktywność na świeżym powietrzu, w szczególności turystom i uczestnikom obozów i kolonii.',
    notes: 'Stosuje się zgodnie z ChPL preparatu pediatrycznego.',
    relatedRecords: ['pso-rec-kzm-1'],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iia-hav',
    sourceSubsection: 'II.A',
    sourcePages: [20],
    vaccinationType: 'zalecane',
    populationScope: 'children_and_adolescents',
    subjectLabel: 'WIRUSOWEMU ZAPALENIU WĄTROBY typu A',
    recommendations:
      'Szczepienie zalecane osobom: 1) dzieciom w wieku przedszkolnym, szkolnym oraz młodzieży, które nie chorowały na wirusowe zapalenie wątroby typu A; 2) w zależności od sytuacji epidemiologicznej, osobom z grup ryzyka, w których obserwuje się zwiększoną liczbę zachorowań.',
    notes: 'Stosuje się w schemacie 2-dawkowym zgodnie z ChPL.',
    relatedRecords: ['pso-rec-hava-1'],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iia-hpv',
    sourceSubsection: 'II.A',
    sourcePages: [20, 21],
    vaccinationType: 'zalecane',
    populationScope: 'children_and_adolescents',
    subjectLabel: 'Zakażeniom LUDZKIMI WIRUSAMI BRODAWCZAKA (HPV)',
    recommendations:
      'Szczepienie po ukończeniu 9. roku życia do ukończenia 14. roku życia w schemacie dwudawkowym; szczepienie musi być rozpoczęte do ukończenia 14. roku życia i może być nieodpłatnie zakończone po ukończeniu 14. roku życia (z zachowaniem dwudawkowego schematu w odstępie 6–12 mies.). Szczepienie osób w 15.–18. r.ż. oraz u dorosłych wykonuje się w schemacie trzydawkowym (warunki całkowitej lub częściowej refundacji określają przepisy odrębne).',
    notes: 'Program powszechny obejmuje dzieci i młodzież po ukończeniu 9. do ukończenia 14. r.ż.; starsze roczniki podlegają zasadom refundacji z odrębnych przepisów.',
    relatedRecords: ['pso-rec-hpv-9', 'pso-rec-hpv-catchup'],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iia-vzv',
    sourceSubsection: 'II.A',
    sourcePages: [21],
    vaccinationType: 'zalecane',
    populationScope: 'children_and_adolescents',
    subjectLabel: 'OSPIE WIETRZNEJ',
    recommendations:
      'Szczepienie zalecane osobom, które nie chorowały na OSPĘ WIETRZNĄ i nie zostały wcześniej zaszczepione w ramach szczepień obowiązkowych albo zalecanych.',
    notes: 'Szczegóły dawkowania: patrz Część III.J PSO (str. 41).',
    relatedRecords: ['pso-rec-vzv-1', 'pso-risk-vzv-special'],
    verificationStatus: 'verified',
  },
];

export const PSO_PART_IIB_ADULTS_RECOMMENDED: PsoPartIIRecommendedRow[] = [
  {
    id: 'pso-iib-covid',
    sourceSubsection: 'II.B',
    sourcePages: [22],
    vaccinationType: 'zalecane',
    populationScope: 'adults',
    subjectLabel: 'COVID-19',
    recommendations: 'Szczepienie zalecane wszystkim dorosłym, w szczególności osobom z grup ryzyka.',
    notes: 'Zgodnie z komunikatami Ministra Zdrowia.',
    relatedRecords: ['pso-rec-covid-pediatric'],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iib-influenza',
    sourceSubsection: 'II.B',
    sourcePages: [22, 23],
    vaccinationType: 'zalecane',
    populationScope: 'adults',
    subjectLabel: 'GRYPIE',
    recommendations:
      '1. W związku z przesłankami epidemiologicznymi – dorosłym, w szczególności: 1) osobom >50. r.ż. (zwłaszcza od ukończenia 65. r.ż.); 2) kontaktowi zawodowemu/rodzinnemu z dziećmi do 6. m.ż., osobami w wieku podeszłym lub przewlekle chorymi (strategia kokonowa); 3) studentom/uczniom kierunków medycznych, pracownikom ochrony zdrowia, szkół, handlu, transportu, służb mundurowych; 4) pensjonariuszom ZOL/ZPO/DPS, opieki paliatywnej, długoterminowej, rehabilitacji, lecznictwa psychiatrycznego, uzależnień i uzdrowisk; 5) pracownikom ferm drobiu oraz zwierząt futerkowych. 2. W związku z przesłankami klinicznymi i indywidualnymi: po transplantacji narządów; przewlekle chorym dorosłym (układ oddechowy, POChP, krążenie, choroba wieńcowa/zawał, nerki, zespół nerczycowy, wątroba, cukrzyca/metaboliczne, neurologiczne/neurorozwojowe); w stanach obniżonej odporności (w tym przeszczep tkanek, nowotwory układu krwiotwórczego); kobietom w ciąży lub planującym ciążę.',
    notes:
      'Szczepionki są ważne tylko jeden sezon epidemiczny ze względu na zmiany ich składu według zaleceń WHO. W przypadku osób dorosłych w wieku 60 lat i starszych szczepienie może być realizowane szczepionką wysokodawkową albo standardową. Kobiety w ciąży: patrz cz. II.C.',
    relatedRecords: ['pso-rec-influenza-1'],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iib-rsv',
    sourceSubsection: 'II.B',
    sourcePages: [23],
    vaccinationType: 'zalecane',
    populationScope: 'adults',
    subjectLabel: 'Zakażeniom SYNCYTIALNYM WIRUSEM ODDECHOWYM (RSV)',
    recommendations:
      'Szczepienie zalecane: 1) osobom od 18. roku życia ze zwiększonym ryzykiem zachorowania na chorobę wywoływaną przez RSV; 2) wszystkim osobom, które ukończyły 50. rok życia niezależnie od występowania dodatkowych czynników ryzyka; 3) kobietom w ciąży w celu biernej ochrony noworodków i niemowląt do 6. miesiąca życia przed chorobami dolnych dróg oddechowych wywołanymi przez RSV.',
    notes:
      'Szczepienie jednodawkowe. Ze względu na brak danych, nie opracowano wytycznych dotyczących podawania kolejnych dawek szczepionki. Kobiety w ciąży: patrz cz. II.C PSO.',
    relatedRecords: [],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iib-meningococci',
    sourceSubsection: 'II.B',
    sourcePages: [23, 24],
    vaccinationType: 'zalecane',
    populationScope: 'adults',
    subjectLabel: 'Inwazyjnym zakażeniom NEISSERIA MENINGITIDIS',
    recommendations:
      '1) osobom dorosłym z wrodzonymi niedoborami odporności: z anatomiczną lub czynnościową asplenią, zakażonym wirusem HIV, nowotworem złośliwym, chorobą reumatyczną, przewlekłą chorobą nerek i wątroby, leczonym ekulizumabem z powodu napadowej nocnej hemoglobinurii lub atypowego zespołu hemolityczno-mocznicowego, po przeszczepieniu szpiku oraz osobom leczonym immunosupresyjnie; 2) osobom dorosłym, w szczególności powyżej 65. roku życia.',
    notes:
      'Szczepienie może być wykonane: 1) szczepionką białkową przeciw serogrupie B; 2) szczepionką skoniugowaną, 4-walentną przeciw serogrupom A, C, W, Y.',
    relatedRecords: ['pso-rec-menb-1', 'pso-rec-menacwy-1'],
    verificationStatus: 'verified',
    auditNote:
      'W Części II.B (str. 23–24) zalecenie obejmuje dorosłych z grup ryzyka oraz w szczególności osoby >65. r.ż.; w skróconym kalendarzu VII.C (str. 48) wpis MenB/MenACWY umieszczono wyłącznie w kolumnie 65 lat i powyżej.',
  },
  {
    id: 'pso-iib-pneumococci',
    sourceSubsection: 'II.B',
    sourcePages: [24],
    vaccinationType: 'zalecane',
    populationScope: 'adults',
    subjectLabel: 'Inwazyjnym zakażeniom STREPTOCOCCUS PNEUMONIAE',
    recommendations:
      '1) osobom dorosłym powyżej 50. roku życia (ze szczególnym uwzględnieniem osób od ukończenia 65. roku życia); 2) dorosłym z przewlekłą chorobą serca, płuc, wątroby (w tym z marskością), nerek, zespołem nerczycowym, cukrzycą; 3) z wyciekiem płynu mózgowo-rdzeniowego, implantem ślimakowym; 4) z anatomiczną lub czynnościową asplenią (sferocytoza, hemoglobinopatie, asplenia wrodzona lub nabyta); 5) z zaburzeniami odporności (wrodzony/nabyty niedobór, HIV, białaczka, choroba Hodgkina, uogólniona choroba nowotworowa związana z leczeniem immunosupresyjnym, w tym przewlekłą steroidoterapią i radioterapią, szpiczak mnogi); 6) osobom uzależnionym od alkoholu, palącym papierosy.',
    notes:
      '1) Osoby dorosłe z grup ryzyka: 1 dawka PCV13 + 1 dawka PPSV23 w odstępie przynajmniej 8 tygodni; alternatywnie 1 dawka PCV20/PCV21. 2) Osoby w wieku 50 lat i starsze: 1 dawka PCV13 + 1 dawka PPSV23 w odstępie przynajmniej 1. roku; alternatywnie 1 dawka PCV20/PCV21. Patrz cz. III PSO.',
    relatedRecords: ['pso-pcv-1', 'pso-risk-preterm-pcv'],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iib-hib',
    sourceSubsection: 'II.B',
    sourcePages: [24],
    vaccinationType: 'zalecane',
    populationScope: 'adults',
    subjectLabel: 'Inwazyjnym zakażeniom HAEMOPHILUS INFLUENZAE typu b',
    recommendations: 'Szczepienie zalecane osobom z zaburzeniami odporności według indywidualnych wskazań.',
    notes: 'Patrz cz. III PSO „Informacje uzupełniające – zasady szczepień przeciw wybranym chorobom zakaźnym”.',
    relatedRecords: ['pso-hib-1'],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iib-tbe',
    sourceSubsection: 'II.B',
    sourcePages: [24, 25],
    vaccinationType: 'zalecane',
    populationScope: 'adults',
    subjectLabel: 'KLESZCZOWEMU ZAPALENIU MÓZGU (KZM)',
    recommendations:
      'Szczepienie zalecane osobom przebywającym na terenach o nasilonym występowaniu tej choroby: 1) zatrudnionym przy eksploatacji lasu, stacjonującemu wojsku, funkcjonariuszom straży pożarnej i granicznej, rolnikom, młodzieży odbywającej staże i praktyki zawodowe; 2) biegaczom, spacerowiczom, grzybiarzom, właścicielom psów, myśliwym, rodzinom z małymi dziećmi, turystom oraz uczestnikom obozów i kolonii.',
    notes: 'Schemat podstawowy 3 dawki, dawka przypominająca co 3–5 lat zgodnie z ChPL.',
    relatedRecords: ['pso-rec-kzm-1'],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iib-hbv',
    sourceSubsection: 'II.B',
    sourcePages: [25],
    vaccinationType: 'zalecane',
    populationScope: 'adults',
    subjectLabel: 'WIRUSOWEMU ZAPALENIU WĄTROBY typu B',
    recommendations:
      '1) osobom dotychczas niezaszczepionym narażonym w trybie życia lub zajęciach na zakażenia przez uszkodzenie ciągłości tkanek lub kontakt seksualny; 2) przewlekle chorym o wysokim ryzyku zakażenia nieszczepionym w ramach obowiązkowych; 3) przewlekle chorym z chorobami z niedoborem odporności dotychczas niezaszczepionym (w tym leczonym immunosupresyjnie, chorym z cukrzycą i niewydolnością nerek); 4) chorym przygotowywanym do zabiegów operacyjnych dotychczas niezaszczepionym; 5) osobom dorosłym, zwłaszcza w wieku starszym dotychczas niezaszczepionym; 6) osobom dotychczas nieszczepionym chorującym na nowotwory i inne choroby przewlekłe, u których planowane jest leczenie immunosupresyjne.',
    notes:
      'Dawki przypominające u osób chorych z obniżoną odpornością należy podawać – zgodnie z zaleceniami lekarza. Patrz cz. III.C PSO.',
    relatedRecords: ['pso-hepb-unvaccinated-primary', 'pso-hepb-dialysis-primary', 'pso-hepb-dialysis-booster'],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iib-hav',
    sourceSubsection: 'II.B',
    sourcePages: [25],
    vaccinationType: 'zalecane',
    populationScope: 'adults',
    subjectLabel: 'WIRUSOWEMU ZAPALENIU WĄTROBY typu A',
    recommendations:
      '1) osobom zatrudnionym przy produkcji i dystrybucji żywności, usuwaniu odpadów komunalnych i płynnych nieczystości oraz konserwacji urządzeń służących temu celowi; 2) w zależności od sytuacji epidemiologicznej osobom z grup ryzyka; 3) pracownikom medycznym, w szczególności oddziałów zakaźnych, gastroenterologicznych, pediatrycznych.',
    notes: '2 dawki dla osób wcześniej nieszczepionych zgodnie z ChPL.',
    relatedRecords: ['pso-rec-hava-1'],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iib-mmr',
    sourceSubsection: 'II.B',
    sourcePages: [26],
    vaccinationType: 'zalecane',
    populationScope: 'adults',
    subjectLabel: 'ODRZE, ŚWINCE, RÓŻYCZCE',
    recommendations:
      'Osobom nieuodpornionym, nieszczepionym wcześniej, które nie chorowały, w szczególności: 1) dorosłym, zwłaszcza w wieku rozrodczym, pracującym w środowiskach dziecięcych (przedszkola, szkoły, szpitale, przychodnie); 2) uczniom i studentom szkół i uczelni medycznych/kierunków medycznych; 3) pracownikom ochrony zdrowia.',
    notes:
      'Podawane w wywiadzie przebycie zachorowania nie jest przeciwwskazaniem do szczepienia. Szczepienie można przeprowadzić po ustąpieniu ostrych objawów i poprawie stanu ogólnego. Nie należy szczepić 4 tygodnie przed planowaną ciążą i w okresie ciąży. Patrz cz. III.L PSO.',
    relatedRecords: ['pso-mmr-1', 'pso-mmr-boost-9'],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iib-tdap',
    sourceSubsection: 'II.B',
    sourcePages: [26],
    vaccinationType: 'zalecane',
    populationScope: 'adults',
    subjectLabel: 'BŁONICY, TĘŻCOWI, KRZTUŚCOWI',
    recommendations:
      'Pojedyncza dawka przypominająca co 10 lat szczepionką Tdap albo Tdap-IPV, w szczególności w związku z przesłankami epidemiologicznymi: 1) personelowi medycznemu, w szczególności mającemu kontakt z noworodkami i niemowlętami; 2) osobom w podeszłym wieku narażonym na zakażenie ze względu na wykonywane zajęcia; 3) osobom z otoczenia noworodków i niemowląt do ukończenia 12. miesiąca życia; 4) kobietom w ciąży.',
    notes:
      'Wykonywane szczepionką błoniczo-tężcowo-krztuścową ze zmniejszoną zawartością komponentu błoniczego i krztuścowego (Tdap lub Tdap-IPV). Patrz cz. I.C, II.C i III PSO.',
    relatedRecords: ['pso-dtap-boost-14'],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iib-td',
    sourceSubsection: 'II.B',
    sourcePages: [26],
    vaccinationType: 'zalecane',
    populationScope: 'adults',
    subjectLabel: 'BŁONICY, TĘŻCOWI',
    recommendations: 'Szczepienie zalecane osobom dorosłym, pojedyncza dawka przypominająca co 10 lat szczepionką Td.',
    notes: 'Wykonywane szczepionką błoniczo-tężcową ze zmniejszoną zawartością komponentu błoniczego.',
    relatedRecords: ['pso-dt-boost-19'],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iib-hpv',
    sourceSubsection: 'II.B',
    sourcePages: [26],
    vaccinationType: 'zalecane',
    populationScope: 'adults',
    subjectLabel: 'Zakażeniom LUDZKIMI WIRUSAMI BRODAWCZAKA (HPV)',
    recommendations: 'Szczepienie zalecane osobom dorosłym w celu uodpornienia przeciw chorobom wywołanym przez HPV.',
    notes: 'U dorosłych schemat 3-dawkowy (wg II.A str. 21 oraz VII.C str. 48: 19–49 lat 3 dawki, 50+ po konsultacji z lekarzem).',
    relatedRecords: ['pso-rec-hpv-catchup'],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iib-polio',
    sourceSubsection: 'II.B',
    sourcePages: [26],
    vaccinationType: 'zalecane',
    populationScope: 'adults',
    subjectLabel: 'OSTREMU NAGMINNEMU PORAŻENIU DZIECIĘCEMU (POLIOMYELITIS)',
    recommendations:
      'Szczepienie zalecane osobom powyżej 19. roku życia nieszczepionym przeciw OSTREMU NAGMINNEMU PORAŻENIU DZIECIĘCEMU (POLIOMYELITIS) w ramach szczepień obowiązkowych.',
    notes:
      'W zależności od sytuacji epidemiologicznej wykonywane jest szczepionką inaktywowaną IPV poliwalentną (zawierającą 1, 2, 3 typ wirusa). Patrz cz. III.F PSO.',
    relatedRecords: ['pso-ipv-1', 'pso-ipv-boost-6'],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iib-varicella',
    sourceSubsection: 'II.B',
    sourcePages: [26, 27],
    vaccinationType: 'zalecane',
    populationScope: 'adults',
    subjectLabel: 'OSPIE WIETRZNEJ',
    recommendations:
      'Osobom, które nie chorowały na OSPĘ WIETRZNĄ i nie zostały wcześniej zaszczepione w ramach szczepień obowiązkowych albo zalecanych, w szczególności: 1) kobietom planującym zajście w ciążę; 2) uczniom i studentom szkół i uczelni medycznych lub kierunków medycznych; 3) pracownikom ochrony zdrowia.',
    notes: 'Patrz cz. III.J PSO (2 dawki).',
    relatedRecords: ['pso-rec-vzv-1', 'pso-risk-vzv-special'],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iib-zoster',
    sourceSubsection: 'II.B',
    sourcePages: [27],
    vaccinationType: 'zalecane',
    populationScope: 'adults',
    subjectLabel: 'PÓŁPAŚCOWI',
    recommendations:
      'Osobom dorosłym, które przebyły pierwotne zakażenie wirusem OSPY WIETRZNEJ (VZV) oraz w szczególności: 1) z wrodzonym lub nabytym niedoborem odporności (immunosupresja jatrogenna, HIV, białaczka, chłoniak Hodgkina, szpiczak mnogi, przeszczepienie narządu miąższowego lub HSCT); 2) z przewlekłymi chorobami serca; 3) z przewlekłymi chorobami wątroby; 4) z przewlekłymi chorobami płuc; 5) z przewlekłymi chorobami nerek; 6) z chorobami autoimmunizacyjnymi (łuszczyca, łuszczycowe zapalenie stawów, NChZJ/nieswoiste zapalenie jelit, RZS, SM, toczeń układowy, ZZSK); 7) z cukrzycą; 8) z depresją; 9) wszystkim osobom, które ukończyły 50. rok życia niezależnie od występowania dodatkowych czynników ryzyka.',
    notes: 'Patrz cz. III.K PSO (2 dawki w odstępie 2–6 mies., skrócenie do 1 mies. w niedoborach odporności).',
    relatedRecords: [],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iib-mpox',
    sourceSubsection: 'II.B',
    sourcePages: [27],
    vaccinationType: 'zalecane',
    populationScope: 'adults',
    subjectLabel: 'MPOX',
    recommendations: 'Szczepienie zalecane osobom z grup ryzyka.',
    notes: 'Szczepienia są wykonywane zgodnie z aktualną wiedzą medyczną i rekomendacjami towarzystw naukowych.',
    relatedRecords: [],
    verificationStatus: 'verified',
  },
];

export const PSO_PART_IIC_PREGNANCY: PsoPartIIRecommendedRow[] = [
  {
    id: 'pso-iic-covid',
    sourceSubsection: 'II.C',
    sourcePages: [28],
    vaccinationType: 'zalecane',
    populationScope: 'pregnant_women',
    subjectLabel: 'COVID-19',
    recommendations: 'Można podawać przez cały okres ciąży.',
    notes:
      'Szczepienie obejmuje podanie 1 dawki szczepionki mRNA i powinno być powtarzane w każdej kolejnej ciąży w okresie zwiększonej zapadalności na COVID-19. Można podawać jednocześnie z innymi aktualnie stosowanymi szczepionkami (w dwa różne miejsca).',
    relatedRecords: [],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iic-influenza',
    sourceSubsection: 'II.C',
    sourcePages: [28],
    vaccinationType: 'zalecane',
    populationScope: 'pregnant_women',
    subjectLabel: 'GRYPIE',
    recommendations: 'Można podawać przez cały okres ciąży.',
    notes:
      '1 dawka szczepionki; powinno być powtarzane w każdej kolejnej ciąży w okresie zwiększonej zapadalności na grypę. Można podawać jednocześnie z innymi aktualnie stosowanymi szczepionkami (w dwa różne miejsca).',
    relatedRecords: ['pso-rec-influenza-1'],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iic-rsv',
    sourceSubsection: 'II.C',
    sourcePages: [28],
    vaccinationType: 'zalecane',
    populationScope: 'pregnant_women',
    subjectLabel: 'Zakażeniom SYNCYTIALNYM WIRUSEM ODDECHOWYM (RSV)',
    recommendations: 'Można podawać od 24. do 36. tygodnia ciąży.',
    notes:
      'Szczepienie jednodawkowe, podawane między 24. a 36. tygodniem ciąży, optymalnie od 32. do 36. tygodnia ciąży (najwyższa efektywność przy terminie porodu IX–IV). Brak wytycznych co do kolejnych dawek w kolejnych ciążach. Można podawać jednocześnie ze szczepionką przeciw GRYPIE lub COVID-19. Zaleca się zachowanie 2-tygodniowego odstępu między Tdap a RSV (dopuszcza się jednoczasowo w indywidualnych przypadkach decyzją lekarza, w dwa różne miejsca).',
    relatedRecords: [],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iic-tdap',
    sourceSubsection: 'II.C',
    sourcePages: [28, 29],
    vaccinationType: 'zalecane',
    populationScope: 'pregnant_women',
    subjectLabel: 'BŁONICY, TĘŻCOWI, KRZTUŚCOWI',
    recommendations:
      'Można podawać od ukończenia 27. do 36. tygodnia ciąży, w uzasadnionych przypadkach zagrożenia przedwczesnym porodem – po ukończeniu 20. tygodnia ciąży.',
    notes:
      'Szczepienie obejmuje podanie 1 dawki szczepionki Tdap i powinno być powtarzane w każdej kolejnej ciąży. Zgodnie z ChPL szczepionki RSV zalecane jest zachowanie co najmniej 2-tygodniowego odstępu między Tdap a RSV (w indywidualnych przypadkach jednoczasowo decyzją lekarza, w dwa różne miejsca).',
    relatedRecords: ['pso-dtap-boost-14'],
    verificationStatus: 'verified',
  },
];

export const PSO_PART_IID_HEALTHCARE_WORKERS: PsoPartIIRecommendedRow[] = [
  {
    id: 'pso-iid-covid',
    sourceSubsection: 'II.D',
    sourcePages: [29],
    vaccinationType: 'zalecane',
    populationScope: 'healthcare_workers',
    subjectLabel: 'COVID-19',
    recommendations: 'Szczepienie zalecane zgodnie z komunikatami Ministra Zdrowia.',
    notes: 'Dla osób wykonujących zawód medyczny.',
    relatedRecords: [],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iid-influenza',
    sourceSubsection: 'II.D',
    sourcePages: [29],
    vaccinationType: 'zalecane',
    populationScope: 'healthcare_workers',
    subjectLabel: 'GRYPIE',
    recommendations:
      'Szczepionki są ważne jeden sezon ze względu na zmiany ich składu według zaleceń Światowej Organizacji Zdrowia.',
    notes: 'Coroczne szczepienie personelu medycznego.',
    relatedRecords: ['pso-rec-influenza-1'],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iid-tdap',
    sourceSubsection: 'II.D',
    sourcePages: [29],
    vaccinationType: 'zalecane',
    populationScope: 'healthcare_workers',
    subjectLabel: 'BŁONICY, TĘŻCOWI, KRZTUŚCOWI',
    recommendations: 'Szczepienie przypominające – 1 dawka co 10 lat.',
    notes: 'Szczególnie personel mający kontakt z noworodkami i niemowlętami (cz. II.B).',
    relatedRecords: ['pso-dtap-boost-14'],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iid-pneumo',
    sourceSubsection: 'II.D',
    sourcePages: [29],
    vaccinationType: 'zalecane',
    populationScope: 'healthcare_workers',
    subjectLabel: 'Inwazyjnym zakażeniom STREPTOCOCCUS PNEUMONIAE',
    recommendations:
      'Szczepienie zalecane dla osób wykonujących zawód medyczny w szpitalnych oddziałach pediatrycznych, chorób wewnętrznych oraz geriatrycznych.',
    notes: 'Zgodnie z PSO cz. II.D str. 29.',
    relatedRecords: ['pso-pcv-1'],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iid-meningo',
    sourceSubsection: 'II.D',
    sourcePages: [29],
    vaccinationType: 'zalecane',
    populationScope: 'healthcare_workers',
    subjectLabel: 'Inwazyjnym zakażeniom NEISSERIA MENINGITIDIS',
    recommendations:
      'Szczepienie przeciw serogrupie B oraz 4-walentną szczepionką przeciw serogrupom A, C, W, Y zalecane w ramach profilaktyki przedekspozycyjnej osobom wykonującym zawód medyczny mającym intencjonalny kontakt z chorymi z IChM lub meningokokami (SOR, OIT, laboratorium) oraz w ramach profilaktyki poekspozycyjnej po bliskim kontakcie z chorym na IChM.',
    notes: 'Szczepienie nie zastępuje chemioprofilaktyki poekspozycyjnej.',
    relatedRecords: ['pso-rec-menb-1', 'pso-rec-menacwy-1'],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iid-hav',
    sourceSubsection: 'II.D',
    sourcePages: [29],
    vaccinationType: 'zalecane',
    populationScope: 'healthcare_workers',
    subjectLabel: 'WIRUSOWEMU ZAPALENIU WĄTROBY typu A',
    recommendations:
      'Zalecane w profilaktyce przedekspozycyjnej przy intencjonalnym kontakcie z chorymi z WZW A lub wirusem HAV (poradnie i oddziały zakaźne, laboratorium) oraz poekspozycyjnie po bliskim kontakcie z chorym na WZW typu A.',
    notes: 'Część II.D str. 29.',
    relatedRecords: ['pso-rec-hava-1'],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iid-mmr',
    sourceSubsection: 'II.D',
    sourcePages: [29],
    vaccinationType: 'zalecane',
    populationScope: 'healthcare_workers',
    subjectLabel: 'ODRZE, ŚWINCE, RÓŻYCZCE',
    recommendations:
      'Osobom wykonującym zawód medyczny, które nie mają udokumentowanego uodpornienia przeciw odrze (udokumentowane 2 dawki szczepienia LUB swoiste IgG w surowicy LUB potwierdzone laboratoryjnie zachorowanie na odrę). Zaleca się ocenę stanu uodpornienia pracowników ochrony zdrowia, w szczególności urodzonych przed 1984 r. ze względu na termin wprowadzenia schematu dwudawkowego do PSO.',
    notes: 'Część II.D str. 29.',
    relatedRecords: ['pso-mmr-1'],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iid-vzv',
    sourceSubsection: 'II.D',
    sourcePages: [29, 30],
    vaccinationType: 'zalecane',
    populationScope: 'healthcare_workers',
    subjectLabel: 'OSPIE WIETRZNEJ',
    recommendations:
      'Osobom wykonującym zawód medyczny, które nie chorowały na ospę wietrzną lub nie otrzymały pełnego schematu (2 dawki), szczególnie pracownikom oddziałów, gdzie zachorowanie personelu stanowi szczególne zagrożenie dla pacjentów. Dowody odporności: 1) udokumentowany pełny cykl szczepienia; 2) wykrycie swoistych przeciwciał IgG przeciw VZV; 3) zachorowanie potwierdzone laboratoryjnie; 4) zachorowanie na ospę wietrzną lub półpasiec rozpoznane przez lekarza.',
    notes: 'Część II.D str. 29–30.',
    relatedRecords: ['pso-rec-vzv-1'],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iid-typhoid',
    sourceSubsection: 'II.D',
    sourcePages: [30],
    vaccinationType: 'zalecane',
    populationScope: 'healthcare_workers',
    subjectLabel: 'DUROWI BRZUSZNEMU',
    recommendations:
      'Zalecane w ramach profilaktyki przedekspozycyjnej osobom wykonującym zawód medyczny mającym intencjonalny kontakt z chorymi na dur brzuszny lub pałeczką Salmonella Typhi (poradnie i oddziały zakaźne, pracownicy laboratorium).',
    notes: 'Część II.D str. 30.',
    relatedRecords: [],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iid-mpox',
    sourceSubsection: 'II.D',
    sourcePages: [30],
    vaccinationType: 'zalecane',
    populationScope: 'healthcare_workers',
    subjectLabel: 'MPOX',
    recommendations:
      'Zalecane w ramach profilaktyki przedekspozycyjnej osobom wykonującym zawód medyczny mającym intencjonalny kontakt z chorymi na Mpox lub wirusem Mpox (poradnie i oddziały zakaźne, pracownicy laboratorium).',
    notes: 'Część II.D str. 30.',
    relatedRecords: [],
    verificationStatus: 'verified',
  },
];

export const PSO_PART_IIE_OCCUPATIONAL_INTRO = {
  sourceSubsection: 'II.E',
  sourcePages: [30],
  legalBasisText:
    'Szczepienia pracownicze określone w: 1) rozporządzeniu Rady Ministrów z dnia 3 stycznia 2012 r. w sprawie wykazu rodzajów czynności zawodowych oraz zalecanych szczepień ochronnych wymaganych u pracowników, funkcjonariuszy, żołnierzy lub podwładnych podejmujących pracę, zatrudnionych lub wyznaczonych do wykonywania tych czynności (Dz. U. poz. 40), 2) rozporządzeniu Ministra Zdrowia z dnia 22 kwietnia 2005 r. w sprawie szkodliwych czynników biologicznych dla zdrowia w środowisku pracy oraz ochrony zdrowia pracowników zawodowo narażonych na te czynniki (Dz. U. poz. 716, z 2008 r. poz. 288 oraz z 2020 r. poz. 2234) – są finansowane w całości przez pracodawców.',
} as const;

export const PSO_PART_IIE_OTHER_WORKERS: PsoPartIIRecommendedRow[] = [
  {
    id: 'pso-iie-edu-care',
    sourceSubsection: 'II.E',
    sourcePages: [30],
    vaccinationType: 'zalecane',
    populationScope: 'occupational_groups',
    subjectLabel: 'Pracownicy sektora edukacji i opieki społecznej',
    recommendations:
      'Szczepienia przeciw: COVID-19; GRYPIE; KRZTUŚCOWI, TĘŻCOWI, BŁONICY; ODRZE, ŚWINCE, RÓŻYCZCE; OSPIE WIETRZNEJ; PNEUMOKOKOM; MENINGOKOKOM.',
    notes: 'Finansowanie w całości przez pracodawcę w zakresie przepisów rozporządzeń wskazanych we wprowadzeniu II.E.',
    relatedRecords: [],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iie-tourism',
    sourceSubsection: 'II.E',
    sourcePages: [30],
    vaccinationType: 'zalecane',
    populationScope: 'occupational_groups',
    subjectLabel: 'Pracownicy sektora turystycznego',
    recommendations:
      'Szczepienia przeciw: COVID-19; GRYPIE; KRZTUŚCOWI, TĘŻCOWI i BŁONICY; ODRZE, ŚWINCE, RÓŻYCZCE; WZW typu A; szczepienia wskazane w międzynarodowych przepisach zdrowotnych lub zalecane w regionach endemicznych.',
    notes: 'Część II.E str. 30.',
    relatedRecords: [],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iie-gastronomy',
    sourceSubsection: 'II.E',
    sourcePages: [30, 31],
    vaccinationType: 'zalecane',
    populationScope: 'occupational_groups',
    subjectLabel: 'Pracownicy sektora gastronomicznego',
    recommendations: 'Szczepienia przeciw: COVID-19; WZW typu A; GRYPIE.',
    notes: 'Część II.E str. 30–31.',
    relatedRecords: [],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iie-municipal',
    sourceSubsection: 'II.E',
    sourcePages: [31],
    vaccinationType: 'zalecane',
    populationScope: 'occupational_groups',
    subjectLabel: 'Pracownicy sektora komunalnego',
    recommendations:
      'Szczepienia przeciw: COVID-19; TĘŻCOWI, BŁONICY i KRZTUŚCOWI, POLIOMYELITIS; WZW typu A; DUROWI BRZUSZNEMU; GRYPIE.',
    notes: 'Część II.E str. 31.',
    relatedRecords: [],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iie-agri-forest',
    sourceSubsection: 'II.E',
    sourcePages: [31],
    vaccinationType: 'zalecane',
    populationScope: 'occupational_groups',
    subjectLabel: 'Pracownicy sektora rolnego i leśnego',
    recommendations:
      'Szczepienia przeciw: TĘŻCOWI, BŁONICY, KRZTUŚCOWI; KLESZCZOWEMU ZAPALENIU MÓZGU; WŚCIEKLIŹNIE; WZW typu A (dotyczy sektora rolnego); GRYPIE; COVID-19.',
    notes: 'Część II.E str. 31.',
    relatedRecords: [],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iie-transport-build',
    sourceSubsection: 'II.E',
    sourcePages: [31],
    vaccinationType: 'zalecane',
    populationScope: 'occupational_groups',
    subjectLabel: 'Pracownicy sektora transportu i budownictwa',
    recommendations:
      'Szczepienia przeciw: TĘŻCOWI (skojarzone ze szczepieniem przeciw BŁONICY i KRZTUŚCOWI); KLESZCZOWEMU ZAPALENIU MÓZGU; GRYPIE.',
    notes: 'Część II.E str. 31.',
    relatedRecords: [],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iie-uniformed',
    sourceSubsection: 'II.E',
    sourcePages: [31],
    vaccinationType: 'zalecane',
    populationScope: 'occupational_groups',
    subjectLabel: 'Służby mundurowe',
    recommendations:
      'Szczepienia przeciw: COVID-19; GRYPIE; TĘŻCOWI, BŁONICY, KRZTUŚCOWI, POLIO; ODRZE, ŚWINCE, RÓŻYCZCE; WZW typu A; WZW typu B; KLESZCZOWEMU ZAPALENIU MÓZGU; inwazyjnym zakażeniom NEISSERIA MENINGITIDIS.',
    notes: 'Część II.E str. 31.',
    relatedRecords: [],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iie-soldiers',
    sourceSubsection: 'II.E',
    sourcePages: [31],
    vaccinationType: 'zalecane',
    populationScope: 'occupational_groups',
    subjectLabel: 'Żołnierze czynnej służby wojskowej',
    recommendations: 'Zgodnie z Kalendarzem szczepień ochronnych dla żołnierzy czynnej służby wojskowej.',
    notes: 'Część II.E str. 31.',
    relatedRecords: [],
    verificationStatus: 'verified',
  },
];

export const PSO_PART_IIF_POST_EXPOSURE: PsoPartIIRecommendedRow[] = [
  {
    id: 'pso-iif-measles',
    sourceSubsection: 'II.F',
    sourcePages: [32],
    vaccinationType: 'zalecane',
    populationScope: 'post_exposure',
    subjectLabel: 'ODRZE',
    recommendations:
      'Dla osób nieszczepionych lub niemających udokumentowanego szczepienia lub przechorowania odry w środowisku o niskim odsetku zaszczepionych oraz dla osób z udokumentowanym szczepieniem 1 dawką po lub przy narażeniu na styczność z osobą chorą lub podejrzaną o odrę.',
    notes:
      'Szczepionka MMR w ciągu 72 godzin od kontaktu (1 dawka; u nieszczepionych 2. dawka po >=4 tygodniach). Przy przeciwwskazaniach (dzieci <9. m.ż., kobiety ciężarne, niedobór odporności): gammaglobulina / immunoglobulina jak najszybciej, nie później niż 6 dni od ekspozycji.',
    relatedRecords: ['pso-mmr-1'],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iif-varicella',
    sourceSubsection: 'II.F',
    sourcePages: [32, 33],
    vaccinationType: 'zalecane',
    populationScope: 'post_exposure',
    subjectLabel: 'OSPIE WIETRZNEJ',
    recommendations:
      'Dla osób po bliskiej styczności z osobą chorą na ospę wietrzną, które dotychczas nie chorowały na ospę wietrzną i/lub półpasiec, bez udokumentowanego szczepienia ani potwierdzenia laboratoryjnego swoistych przeciwciał.',
    notes:
      'Szczepionka VZV w schemacie 1-dawkowym do 72 h od kontaktu, nie później niż do 5 dni po ostatnim kontakcie (u dotychczas nieszczepionych 2. dawka po co najmniej 6 tygodniach). Przy przeciwwskazaniach (noworodki, ciężarne, niedobór odporności): swoista immunoglobulina do 96 godzin od kontaktu.',
    relatedRecords: ['pso-rec-vzv-1', 'pso-risk-vzv-special'],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iif-hav',
    sourceSubsection: 'II.F',
    sourcePages: [32, 33],
    vaccinationType: 'zalecane',
    populationScope: 'post_exposure',
    subjectLabel: 'WIRUSOWEMU ZAPALENIU WĄTROBY typu A',
    recommendations: 'Osobom, które miały bliską styczność z osobą chorą na WIRUSOWE ZAPALENIE WĄTROBY typu A.',
    notes:
      'Szczepionka przeciw WZW A w schemacie 1-dawkowym w ciągu 14 dni od kontaktu (dawka uzupełniająca po >=6 miesiącach; inaktywowane szczepionki różnych producentów można stosować zamiennie). Przy przeciwwskazaniach (niemowlęta, przewlekłe choroby wątroby, immunosupresja): immunoglobulina jak najszybciej, maksymalnie do 14 dni od ekspozycji.',
    relatedRecords: ['pso-rec-hava-1'],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iif-hbv',
    sourceSubsection: 'II.F',
    sourcePages: [33],
    vaccinationType: 'zalecane',
    populationScope: 'post_exposure',
    subjectLabel: 'WIRUSOWEMU ZAPALENIU WĄTROBY typu B',
    recommendations:
      'Osobom, które miały kontakt z materiałem potencjalnie zakaźnym (np. krwią, płynami ustrojowymi) i u których istnieje ryzyko zakażenia HBV.',
    notes:
      'W zależności od uodpornienia i statusu HBsAg źródła: tylko szczepienie, tylko immunoglobulina HBIG, lub szczepienie + immunoglobulina. Seria szczepień powinna zostać rozpoczęta jak najszybciej, optymalnie w ciągu 12–24 godzin, do maksymalnie 7 dni po ekspozycji. Szczegółowa macierz postępowania: Część II.G (str. 34).',
    relatedRecords: ['pso-hepb-unvaccinated-primary'],
    verificationStatus: 'verified',
  },
];

export const PSO_PART_IIG_HBV_PEP_MATRIX: PsoHbvPepMatrixRow[] = [
  {
    id: 'hbv-pep-unvaccinated',
    exposedPersonStatus: 'Nieszczepiona',
    sourceHbsAgPositive: '1 dawka HBIG + szczepienie przeciw WZW typu B w pełnym schemacie.',
    sourceHbsAgNegative: 'Szczepienie przeciw WZW typu B w pełnym schemacie.',
    sourceUnknown:
      'Szczepienie przeciw WZW typu B w pełnym schemacie. Rozważyć należy podanie HBIG, jeżeli dane kliniczne i epidemiologiczne wskazują na wysokie ryzyko zakażenia HBV.',
  },
  {
    id: 'hbv-pep-responder',
    exposedPersonStatus: 'Szczepiona, z udokumentowaną zadowalającą odpowiedzią poszczepienną (anty-HBs ≥10 mIU/ml)',
    sourceHbsAgPositive: 'Brak wskazań do szczepienia przypominającego.',
    sourceHbsAgNegative: 'Brak wskazań do szczepienia przypominającego.',
    sourceUnknown: 'Brak wskazań do szczepienia przypominającego.',
  },
  {
    id: 'hbv-pep-unverified-or-low',
    exposedPersonStatus: 'Szczepiona, bez udokumentowanej odpowiedzi poszczepiennej (anty-HBs nieoznaczone lub <10 mIU/ml)',
    sourceHbsAgPositive:
      'Jeżeli anty-HBs <10 mIU/ml: podać 1 dawkę HBIG + dawkę przypominającą szczepionki przeciw HBV. Jeżeli nie oceniono odpowiedzi poszczepiennej: oznaczyć stężenie anty-HBs w surowicy osoby narażonej.',
    sourceHbsAgNegative: 'Podanie dawki przypominającej szczepionki.',
    sourceUnknown:
      'Jeżeli anty-HBs <10 mIU/ml: podać dawkę przypominającą szczepionki. Jeżeli nie oceniono odpowiedzi poszczepiennej: oznaczyć stężenie anty-HBs w surowicy osoby narażonej. Jeżeli dane kliniczne i epidemiologiczne wskazują na duże ryzyko zakażenia HBV – należy postępować jak w przypadku ekspozycji na krew źródła HBsAg(+).',
  },
  {
    id: 'hbv-pep-nonresponder',
    exposedPersonStatus: 'Szczepiona wielokrotnie z potwierdzonym brakiem odpowiedzi poszczepiennej',
    sourceHbsAgPositive: '2 dawki HBIG w odstępie 1 miesiąca.',
    sourceHbsAgNegative: 'Dodatkowa profilaktyka swoista niepotrzebna.',
    sourceUnknown:
      'Brak wskazań do szczepienia przypominającego. Jeżeli dane kliniczne i epidemiologiczne wskazują na duże ryzyko zakażenia HBV – należy postępować jak w przypadku ekspozycji na krew źródła HBsAg(+).',
  },
  {
    id: 'hbv-pep-convalescent',
    exposedPersonStatus: 'Ozdrowieniec po przebytym zakażeniu HBV',
    sourceHbsAgPositive: 'Nie wymaga profilaktyki swoistej przeciw WZW typu B.',
    sourceHbsAgNegative: 'Nie wymaga profilaktyki swoistej przeciw WZW typu B.',
    sourceUnknown: 'Nie wymaga profilaktyki swoistej przeciw WZW typu B.',
  },
];

export const PSO_PART_IIH_RSV_PASSIVE: PsoPartIIRecommendedRow = {
  id: 'pso-iih-rsv-passive',
  sourceSubsection: 'II.H',
  sourcePages: [34],
  vaccinationType: 'bierne',
  populationScope: 'children_and_adolescents',
  subjectLabel: 'Uodpornienie bierne przeciw RSV',
  recommendations:
    'Zalecane noworodkom, niemowlętom w ich pierwszym sezonie RSV oraz dzieciom do 2 lat narażonych w szczególny sposób na ciężki przebieg zakażenia RSV.',
  notes: 'Podanie przeciwciał monoklonalnych.',
  relatedRecords: [],
  verificationStatus: 'verified',
};

export const PSO_PART_III_TRAVEL_NOTE =
  'Szczepienia należy wykonać po konsultacji specjalistycznej uwzględniającej uprzednio wykonane szczepienia obowiązkowe i zalecane, wiek pacjenta, schorzenia współistniejące i lokalną sytuację epidemiologiczną w miejscu pobytu za granicą. Ponadto patrz cz. III PSO „Informacje uzupełniające – zasady szczepień przeciw wybranym chorobom zakaźnym”.';

export const PSO_PART_III_TRAVEL_ENDEMIC: PsoPartIIRecommendedRow[] = [
  {
    id: 'pso-iii-travel-cholera',
    sourceSubsection: 'II.I',
    sourcePages: [35],
    vaccinationType: 'zalecane',
    populationScope: 'travelers',
    subjectLabel: 'CHOLERZE',
    recommendations:
      'Szczepienie zalecane osobom planującym pobyt w regionie występowania zagrożenia zakażeniem przecinkowca CHOLERY, w zależności od lokalnej sytuacji epidemiologicznej w miejscu pobytu.',
    notes: PSO_PART_III_TRAVEL_NOTE,
    relatedRecords: [],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iii-travel-typhoid',
    sourceSubsection: 'II.I',
    sourcePages: [35],
    vaccinationType: 'zalecane',
    populationScope: 'travelers',
    subjectLabel: 'DUROWI BRZUSZNEMU',
    recommendations:
      'Szczepienie zalecane osobom planującym pobyt w regionie występowania zagrożenia zakażeniem pałeczką DURU BRZUSZNEGO, w zależności od lokalnej sytuacji epidemiologicznej w miejscu pobytu.',
    notes: PSO_PART_III_TRAVEL_NOTE,
    relatedRecords: [],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iii-travel-hav',
    sourceSubsection: 'II.I',
    sourcePages: [35],
    vaccinationType: 'zalecane',
    populationScope: 'travelers',
    subjectLabel: 'WIRUSOWEMU ZAPALENIU WĄTROBY typu A',
    recommendations:
      'Szczepienie zalecane osobom wyjeżdżającym do krajów o wysokiej i pośredniej endemiczności zachorowań na wirusowe zapalenie wątroby typu A, osobom, które nie chorowały na wirusowe zapalenie wątroby typu A, w zależności od lokalnej sytuacji epidemiologicznej w miejscu pobytu.',
    notes: PSO_PART_III_TRAVEL_NOTE,
    relatedRecords: ['pso-rec-hava-1'],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iii-travel-rabies',
    sourceSubsection: 'II.I',
    sourcePages: [35],
    vaccinationType: 'zalecane',
    populationScope: 'travelers',
    subjectLabel: 'WŚCIEKLIŹNIE',
    recommendations:
      'Szczepienie zalecane osobom planującym pobyt w regionie występowania zagrożenia zakażeniem wirusem WŚCIEKLIZNY.',
    notes: PSO_PART_III_TRAVEL_NOTE,
    relatedRecords: ['pso-rabies-postexposure'],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iii-travel-polio',
    sourceSubsection: 'II.I',
    sourcePages: [35],
    vaccinationType: 'zalecane',
    populationScope: 'travelers',
    subjectLabel: 'OSTREMU NAGMINNEMU PORAŻENIU DZIECIĘCEMU (POLIOMYELITIS)',
    recommendations:
      'Szczepienie zalecane osobom planującym pobyt w regionie występowania zagrożenia zakażeniem wirusem OSTREGO NAGMINNEGO PORAŻENIA DZIECIĘCEGO (POLIOMYELITIS). W zależności od sytuacji epidemiologicznej szczepienie wykonywane jest szczepionką inaktywowaną IPV poliwalentną (zawierającą 1, 2, 3 typ wirusa).',
    notes: PSO_PART_III_TRAVEL_NOTE,
    relatedRecords: ['pso-ipv-1'],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iii-travel-je',
    sourceSubsection: 'II.I',
    sourcePages: [35],
    vaccinationType: 'zalecane',
    populationScope: 'travelers',
    subjectLabel: 'JAPOŃSKIEMU ZAPALENIU MÓZGU',
    recommendations:
      'Szczepienie zalecane osobom planującym pobyt w regionie występowania zagrożenia zakażeniem wirusem JAPOŃSKIEGO ZAPALENIA MÓZGU.',
    notes: PSO_PART_III_TRAVEL_NOTE,
    relatedRecords: [],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iii-travel-yf',
    sourceSubsection: 'II.I',
    sourcePages: [35],
    vaccinationType: 'zalecane',
    populationScope: 'travelers',
    subjectLabel: 'ŻÓŁTEJ GORĄCZCE',
    recommendations:
      'Szczepienie zalecane osobom planującym pobyt w regionie występowania zagrożenia zakażeniem wirusem ŻÓŁTEJ GORĄCZKI.',
    notes: PSO_PART_III_TRAVEL_NOTE,
    relatedRecords: [],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iii-travel-dengue',
    sourceSubsection: 'II.I',
    sourcePages: [35],
    vaccinationType: 'zalecane',
    populationScope: 'travelers',
    subjectLabel: 'CHOROBIE DENGA',
    recommendations:
      'Szczepienie zalecane osobom planującym pobyt w regionie występowania zagrożenia zakażeniem wirusem DENGA.',
    notes: PSO_PART_III_TRAVEL_NOTE,
    relatedRecords: [],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iii-travel-chikungunya',
    sourceSubsection: 'II.I',
    sourcePages: [35],
    vaccinationType: 'zalecane',
    populationScope: 'travelers',
    subjectLabel: 'WIRUSOWI CHIKUNGUNYA',
    recommendations:
      'Szczepienie zalecane osobom planującym pobyt w regionie występowania zagrożenia zakażeniem wirusem CHIKUNGUNYA.',
    notes: PSO_PART_III_TRAVEL_NOTE,
    relatedRecords: [],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iii-travel-meningo',
    sourceSubsection: 'II.I',
    sourcePages: [35],
    vaccinationType: 'zalecane',
    populationScope: 'travelers',
    subjectLabel: 'Inwazyjnym zakażeniom NEISSERIA MENINGITIDIS',
    recommendations:
      'Szczepienie zalecane osobom planującym pobyt w regionie występowania zagrożenia zakażeniem NEISSERIA MENINGITIDIS. W zależności od lokalnej sytuacji epidemiologicznej może być wykonane: 1) szczepionką białkową przeciw serogrupie B; 2) szczepionką skoniugowaną, 4-walentną przeciw serogrupom A, C, W, Y.',
    notes: PSO_PART_III_TRAVEL_NOTE,
    relatedRecords: ['pso-rec-menb-1', 'pso-rec-menacwy-1'],
    verificationStatus: 'verified',
  },
];

// =============================================================================
// CZĘŚĆ III — INFORMACJE UZUPEŁNIAJĄCE A–M (str. 36–42)
// =============================================================================

export const PSO_PART_III_INTRO =
  'Szczepionki należy stosować zgodnie z aktualną wiedzą medyczną, uwzględniając Charakterystykę Produktu Leczniczego.';

export const PSO_PART_III_SECTIONS: PsoSupplementaryDiseaseSection[] = [
  {
    id: 'pso-iii-a',
    subsectionCode: 'III.A',
    title: 'Szczepienia dzieci urodzonych przedwcześnie',
    sourcePages: [36],
    points: [
      { label: '1.', text: 'Zalecane jest szczepienie dzieci urodzonych przedwcześnie zgodnie z ich wiekiem chronologicznym, tj. liczonym od dnia urodzenia.' },
      { label: '2.', text: 'U dzieci urodzonych poniżej 32. tygodnia ciąży jest możliwe wykonanie pierwszych szczepień (BCG, WZW typu B, DTaP, IPV, Hib, PCV, ROTA) w trakcie hospitalizacji, o ile pozwala na to ich stan kliniczny.' },
      { label: '3.', text: 'Informacje o schematach szczepienia, które są zalecane u dzieci urodzonych przedwcześnie, znajdują się poniżej w sekcjach dotyczących poszczególnych szczepień, zaleceniach towarzystw naukowych oraz Charakterystyce Produktu Leczniczego szczepionki, którą planuje się wykonać szczepienie.' },
    ],
    relatedRecords: ['pso-risk-preterm-dtap', 'pso-risk-preterm-pcv'],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iii-b',
    subsectionCode: 'III.B',
    title: 'Szczepienia przeciw gruźlicy',
    sourcePages: [36, 37],
    points: [
      { label: '1.', text: 'Zaleca się przeprowadzenie szczepienia przeciw GRUŹLICY po dokładnej ocenie stanu zdrowia dziecka celem wykluczenia chorób, w których szczepienie przeciw GRUŹLICY jest przeciwwskazane.' },
      { label: '2.', text: 'U dzieci matek otrzymujących leczenie immunosupresyjne, w tym leczenie biologiczne, w ciąży, postępowanie dotyczące szczepienia przeciw GRUŹLICY zależne jest od rodzaju leczenia immunosupresyjnego i stosowanych leków biologicznych po konsultacji specjalistycznej.' },
      { label: '3.', text: 'U dzieci, u których w rodzinie rozpoznano ciężki złożony niedobór odporności, szczepienie przeciw GRUŹLICY należy odroczyć do czasu wykluczenia zespołu.' },
      { label: '4.', text: 'U noworodka z ujemnym wywiadem rodzinnym pobranie krwi do badania przesiewowego w kierunku SCID nie jest przeciwwskazaniem do szczepienia przeciw gruźlicy.' },
      { label: '5.', text: 'Należy zachować minimum 2-tygodniowy odstęp między podaniem szczepionki BCG a terapią genową łączoną z terapią kortykosteroidami.' },
      { label: '6.', text: 'Po szczepieniach wykonanych w oddziale noworodkowym, należy zapewnić odpowiedni czas na obserwację przed wypisem dziecka ze szpitala.' },
      { label: '7.', text: 'Szczepienie przeciw GRUŹLICY nie musi być wykonywane jednocześnie ze szczepieniem przeciw WZW typu B.' },
      { label: '8.', text: 'Szczepienie przeciw GRUŹLICY w przypadku dzieci urodzonych przedwcześnie wykonuje się po osiągnięciu stabilnej masy ciała powyżej 2000 g.' },
      { label: '9.', text: 'Szczepienie przeciw GRUŹLICY w przypadku noworodków urodzonych przez matki zakażone wirusem HIV powinno być poprzedzone konsultacją specjalistyczną. Decyzję o szczepieniu podejmuje specjalista chorób zakaźnych lub lekarz poradni specjalistycznej przeprowadzającej szczepienia ochronne.' },
      { label: '10.', text: 'U każdego dziecka należy na podstawie dokumentacji medycznej sprawdzić przeprowadzenie szczepienia BCG, a jeżeli szczepienie to nie było przeprowadzone, zaległe szczepienie przeciw GRUŹLICY należy przeprowadzić jedną dawką szczepionki BCG w możliwie najkrótszym terminie.' },
      { label: '11.', text: 'W przypadku wątpliwości co do statusu zaszczepienia przeciw GRUŹLICY, brak dokumentacji potwierdzającej szczepienie nie stanowi jedynego wskazania do szczepienia uzupełniającego. Decyzję o szczepieniu uzupełniającym należy podjąć po przeprowadzeniu kwalifikacji medycznej, z uwzględnieniem możliwości zakażenia Mycobacterium tuberculosis, w tym wykluczenia aktywnej gruźlicy oraz innych przeciwwskazań. Szczepienie uzupełniające jest podawane do 15. roku życia.' },
    ],
    relatedRecords: ['pso-bcg-0'],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iii-c',
    subsectionCode: 'III.C',
    title: 'Szczepienia przeciw WZW typu B',
    sourcePages: [37, 38],
    points: [
      { label: '1.', text: 'Szczepienia podstawowe noworodków i niemowląt są wykonywane według schematu obejmującego 3-dawkowy schemat szczepienia: 0; 1; 6 miesięcy. Pierwsza dawka szczepienia jest podawana w ciągu 24 godzin po urodzeniu (najlepiej w ciągu 12 godzin). Druga dawka szczepienia po 4–6 tygodniach po pierwszej dawce. Trzecia dawka szczepienia po 6 miesiącach od pierwszej dawki.' },
      { label: '2.', text: 'U dzieci z masą urodzeniową poniżej 2000 g szczepienie przeciw WZW typu B wykonuje się według schematu obejmującego 4-dawkowy schemat szczepienia: 0; 1; 2; 12 miesięcy. Dzieci te powinny otrzymać w sumie 4 dawki szczepionki.' },
      { label: '3.', text: 'U dzieci, u których planuje się szczepienie szczepionką wysokoskojarzoną 6w1, zaleca się podanie 1 dawki szczepionki przeciw WZW typu B w 1. dobie życia. Uwzględniając narażenie na zakażenie, noworodkom o podwyższonym ryzyku zakażenia HBV, szczególnie urodzonym przez kobiety z aktywnym zakażeniem HBV, zaleca się podanie 1 dawki immunoglobuliny HBIG oraz 1 dawki szczepionki w ciągu pierwszych 12 godzin życia. Szczepienie wykonuje się w schemacie 4-dawkowym zgodnie z Charakterystyką Produktu Leczniczego zastosowanej szczepionki.' },
      { label: '4.', text: 'Szczepienia wyrównawcze u osób niezaszczepionych w pierwszym roku życia należy przeprowadzić w możliwie najwcześniejszym terminie, nie później niż do ukończenia 19. roku życia. Szczepienie należy przeprowadzić dawką dla dzieci lub dla osób dorosłych w zależności od wieku dziecka i zgodnie z Charakterystyką Produktu Leczniczego według 3-dawkowego schematu szczepienia: 0; 1; 6 miesięcy.' },
      { label: '5.', text: 'Szczepienia osób z bliskiego otoczenia chorych na WZW typu B i nosicieli HBV narażonych w sposób szczególny na zakażenie (domownicy oraz osoby przebywające w zakładach opiekuńczych, wychowawczych i zakładach zamkniętych) są wykonywane według 3-dawkowego schematu szczepienia: 0; 1; 6 miesięcy. Nie przewiduje się podawania dawek szczepień przypominających.' },
      {
        label: '6.',
        text: 'Rewakcynacja po szczepieniach podstawowych jest wskazana u:',
        subItems: [
          { label: '1)', text: 'chorych z niedoborem odporności oraz pacjentów z cukrzycą – gdy po szczepieniach podstawowych stężenie przeciwciał anty-HBs jest <10 j.m./l, zaleca się podanie kolejnych 1–3 dawek szczepionki; gdy stężenie przeciwciał jest nadal <10 j.m./l, nie wykonuje się dalszych szczepień;' },
          { label: '2)', text: 'pacjentów z nowotworami w trakcie leczenia immunosupresyjnego oraz pacjentów po przeszczepieniu narządów – zaleca się utrzymanie poziomu przeciwciał ≥100 j.m./l; kontrola przeciwciał odbywa się co 6 miesięcy; gdy stężenie spada poniżej <100 j.m./l należy podać podwójną dawkę szczepionki;' },
          { label: '3)', text: 'osób w fazie zaawansowanej choroby nerek z filtracją kłębuszkową poniżej 30 ml/min oraz u osób dializowanych – dawki przypominające należy podawać zgodnie z Charakterystyką Produktu Leczniczego oraz zaleceniami lekarza, jeżeli stężenie przeciwciał anty-HBs jest poniżej poziomu ochronnego (10 j.m./l); zaleca się badanie poziomu przeciwciał co 6–12 miesięcy.' },
        ],
      },
      { label: '7.', text: 'Oznaczanie poziomu przeciwciał anty-HBs u osób przewlekle chorych w ramach lekarskiego badania kwalifikacyjnego do szczepienia jest nieodpłatne dla tych osób.' },
      { label: '8.', text: 'Nie dopuszcza się uzależniania wykonania zabiegu medycznego związanego z naruszeniem ciągłości tkanek od wcześniejszego przeprowadzenia szczepienia przeciw WZW typu B.' },
      { label: '9.', text: 'Oznaczanie poziomu przeciwciał anty-HBs u uprzednio zaszczepionych podstawowo uczniów szkół medycznych, studentów uczelni medycznych oraz osób wykonujących zawód medyczny narażonych na zakażenie HBV wykonuje się jednorazowo przed przystąpieniem do praktyk/pracy o podwyższonym ryzyku zakażenia.' },
      { label: '10.', text: 'W indywidualnych przypadkach, dopuszcza się przesunięcie terminu rozpoczęcia szczepień przeciw WZW typu B na drugi miesiąc życia, u dzieci urodzonych o czasie, z masą ciała powyżej 2000 g, których matki zostały w pełni zaszczepione przeciw WZW B, mają negatywny wynik HBsAg w aktualnej ciąży i w badaniu wykonanym w aktualnej ciąży wykazano obecność przeciwciał anty-HBs > 100 U/l. Decyzję podejmuje lekarz.' },
    ],
    relatedRecords: ['pso-hbv-1', 'pso-hbv-2', 'pso-hbv-3', 'pso-hepb-dialysis-primary', 'pso-hepb-dialysis-booster'],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iii-d',
    subsectionCode: 'III.D',
    title: 'Szczepienia przeciw zakażeniom wywołanym przez rotawirusy',
    sourcePages: [38],
    points: [
      { label: '1.', text: 'Szczepienie przeciw zakażeniom wywołanym przez ROTAWIRUSY przeprowadza się w schemacie 2-dawkowym lub 3-dawkowym, w zależności od rodzaju stosowanej szczepionki.' },
      { label: '2.', text: 'Zaleca się jak najwcześniejsze rozpoczęcie i zakończenie schematu szczepienia, zgodnie z Charakterystyką Produktu Leczniczego i zaleceniami towarzystw naukowych: podanie pierwszej dawki szczepionki doustnie od ukończenia 6. tygodnia życia, jednak nie później niż przed ukończeniem 12. tygodnia życia. Dopuszcza się w wyjątkowych przypadkach podanie pierwszej dawki szczepionki do zakończenia 14. tygodnia życia dziecka (14 tygodni + 6 dni).' },
      { label: '3.', text: 'W przypadku realizowania szczepienia w schemacie 3-dawkowym zaleca się zakończenie cyklu szczepień przed ukończeniem 20–22 tygodnia życia dziecka. W razie konieczności 3. dawkę można podać przed 32. tygodniem życia.' },
      { label: '4.', text: 'W przypadku realizowania szczepienia w schemacie 2-dawkowym najlepiej, aby cykl szczepienia został ukończony przed 16. tygodniem życia, a najpóźniej przed 24. tygodniem życia.' },
      { label: '5.', text: 'Minimalny odstęp między dawkami szczepionki przeciw ROTAWIRUSOM wynosi 4 tygodnie.' },
      { label: '6.', text: 'Pomiędzy szczepieniem przeciw gruźlicy oraz przeciw zakażeniom wywołanym przez ROTAWIRUSY nie jest wymagany odstęp 4 tygodni.' },
      { label: '7.', text: 'Szczepienie przeciw zakażeniom wywołanym przez ROTAWIRUSY można przeprowadzać jednocześnie z innymi szczepieniami.' },
      { label: '8.', text: 'Szczepienie przeciw zakażeniom wywołanym przez ROTAWIRUSY dzieci z ciężkim niedoborem odporności jest przeciwwskazane. Można rozważyć szczepienie dzieci urodzonych przez matki, które były w ciąży leczone lekami biologicznymi.' },
      { label: '9.', text: 'W przypadku braku możliwości kontynuacji szczepień przeciw ROTAWIRUSOM preparatem podawanym w schemacie 3-dawkowym, dopuszcza się możliwość zakończenia cyklu szczepienia preparatem podawanym w schemacie 2-dawkowym. Jeśli jakakolwiek dawka w cyklu była zrealizowana preparatem wymagającym cyklu 3-dawkowego, należy podać łącznie 3 dawki szczepionki przeciw ROTAWIRUSOM. Termin zakończenia cyklu (tj. podania 2 albo 3 dawek szczepionki przeciw ROTAWIRUSOM) musi być zgodny z Charakterystyką Produktu Leczniczego zastosowanego do dokończenia cyklu preparatu. Jeśli cykl rozpoczęto szczepionką wymagającą cyklu 3-dawkowego, należy podać łącznie 3 dawki szczepionki przeciw ROTAWIRUSOM, uzupełniając brakujące dawki szczepionką podawaną w cyklu 2-dawkowym.' },
    ],
    relatedRecords: ['pso-rv-1', 'pso-rv-2', 'pso-rv-3'],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iii-e',
    subsectionCode: 'III.E',
    title: 'Szczepienia przeciw błonicy, tężcowi i krztuścowi',
    sourcePages: [39],
    points: [
      { label: '1.', text: 'Szczepienia podstawowe przeciw BŁONICY, TĘŻCOWI i KRZTUŚCOWI są przeprowadzane szczepionką błoniczo-tężcowo-krztuścową (DTP lub DTaP) trzykrotnie w odstępach 6.–8. tygodni – pierwsza, druga i trzecia dawka szczepienia, oraz jeden raz w 2. roku życia – czwarta dawka szczepienia (uzupełniająca). Pierwsza dawka szczepionki jest podawana w 2. miesiącu życia, po szczepieniu przeciw GRUŹLICY i WZW typu B. Druga dawka – w 4. miesiącu życia (po 6.–8. tygodniach od szczepienia poprzedniego). Trzecia dawka – w 5.–6. miesiącu życia (po 6–8 tygodniach od szczepienia poprzedniego). Czwarta dawka – w 16.–18. miesiącu życia.' },
      { label: '2.', text: 'U dzieci z trwałymi przeciwwskazaniami do szczepienia przeciw KRZTUŚCOWI szczepionką błoniczo-tężcowo-krztuścową z pełnokomórkowym komponentem krztuśca oraz u dzieci urodzonych przed ukończeniem 37. tygodnia ciąży lub urodzonych z masą urodzeniową poniżej 2500 g w szczepieniach podstawowych należy zastosować szczepionkę błoniczo-tężcowo-krztuścową z bezkomórkowym komponentem krztuśca – trzykrotnie w 1. roku życia i jeden raz w 2. roku życia, według schematu, jak w pkt 1. W przypadku przeciwwskazania do szczepienia przeciw KRZTUŚCOWI należy zastosować szczepionkę błoniczo-tężcową (DT) po ukończeniu 12. miesiąca życia w schemacie 3-dawkowym.' },
      { label: '3.', text: 'Alternatywnie w przypadku dostępności szczepionki skojarzonej do szczepienia można stosować szczepionki wysoko skojarzone (DTaP-IPV-Hib, DTaP-IPV-Hib-HBV).' },
      { label: '4.', text: 'U osób, które ukończyły 14. rok życia, a nie otrzymały dawki przypominającej szczepionki przeciw BŁONICY, TĘŻCOWI i KRZTUŚCOWI (Tdap), należy podać brakującą dawkę szczepienia przypominającego, nie później niż do ukończenia 19. roku życia.' },
    ],
    relatedRecords: ['pso-dtp-1', 'pso-dtp-2', 'pso-dtp-3', 'pso-dtp-4', 'pso-dtap-boost-6', 'pso-dtap-boost-14', 'pso-dt-boost-19', 'pso-risk-preterm-dtap'],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iii-f',
    subsectionCode: 'III.F',
    title: 'Szczepienia przeciw ostremu nagminnemu porażeniu dziecięcemu (POLIOMYELITIS)',
    sourcePages: [39],
    points: [
      { label: '1.', text: 'Pierwszą dawkę szczepienia przeciw OSTREMU NAGMINNEMU PORAŻENIU DZIECIĘCEMU (POLIOMYELITIS) podaje się w 4. miesiącu życia, a drugą dawkę po upływie 6.–8. tygodni – zgodnie z Charakterystyką Produktu Leczniczego. Trzecią dawkę szczepienia (uzupełniającą) należy podać w 16.–18. miesiącu życia.' },
      { label: '2.', text: 'W 6. roku życia należy wykonać szczepienie przypominające.' },
      { label: '3.', text: 'W przypadku zastosowania szczepionki wysokoskojarzonej (DTaP-IPV-Hib) szczepienie jest wykonywane w schemacie 4-dawkowym zgodnie z Charakterystyką Produktu Leczniczego.' },
    ],
    relatedRecords: ['pso-ipv-1', 'pso-ipv-2', 'pso-ipv-3', 'pso-ipv-boost-6'],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iii-g',
    subsectionCode: 'III.G',
    title: 'Szczepienia przeciw inwazyjnemu zakażeniu HAEMOPHILUS INFLUENZAE typu b',
    sourcePages: [40],
    points: [
      { label: '1.', text: 'Pełen schemat szczepienia przeciw inwazyjnemu zakażeniu HAEMOPHILUS INFLUENZAE typu b powinien składać się z trzech dawek szczepienia podawanych w odstępach 6.–8. tygodniowych w 1. roku życia oraz czwartej dawki szczepienia (uzupełniającej) podanej w 2. roku życia, o ile w Charakterystyce Produktu Leczniczego nie wskazano innego schematu uodpornienia.' },
      { label: '2.', text: 'Dzieciom szczepionym od 6. do 12. miesiąca życia pierwsze dwie dawki szczepienia powinny być podane w odstępie 4 tygodni, następnie trzecia dawka szczepienia (uzupełniająca) po upływie roku od podania drugiej dawki.' },
      { label: '3.', text: 'Dzieciom powyżej 1. roku życia powinna być podana jedna dawka szczepionki.' },
      { label: '4.', text: 'Alternatywnie w przypadku dostępności szczepionki skojarzonej do szczepienia można stosować szczepionki wysokoskojarzone (DTaP-IPV-Hib, DTaP-IPV-Hib-HBV).' },
    ],
    relatedRecords: ['pso-hib-1', 'pso-hib-2', 'pso-hib-3', 'pso-hib-4'],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iii-h',
    subsectionCode: 'III.H',
    title: 'Szczepienia przeciw inwazyjnym zakażeniom STREPTOCOCCUS PNEUMONIAE',
    sourcePages: [40],
    points: [
      { label: '1.', text: 'Szczepienie przeciw inwazyjnym zakażeniom STREPTOCOCCUS PNEUMONIAE jest wykonywane w populacji ogólnej jako obowiązkowe szczepienie kalendarzowe w 1.–2. roku życia. W przypadku dzieci, które nie zostały poddane szczepieniu obowiązkowemu w terminach zgodnych z kalendarzem szczepień, należy jak najszybciej przeprowadzić szczepienie wyrównawcze, które jest obowiązkowe do ukończenia 5. roku życia.' },
      {
        label: '2.',
        text: 'Do ukończenia 19. roku życia obowiązek szczepienia obejmuje nieszczepione wcześniej dzieci i młodzież należące do następujących grup ryzyka:',
        subItems: [
          { label: '1)', text: 'po urazie lub z wadą ośrodkowego układu nerwowego, przebiegającą z wyciekiem płynu mózgowo-rdzeniowego;' },
          { label: '2)', text: 'przed wszczepieniem lub po wszczepieniu implantu ślimakowego;' },
          { label: '3)', text: 'przed lub po leczeniu immunosupresyjnym lub biologicznym;' },
          { label: '4)', text: 'z wrodzonymi lub nabytymi niedoborami odporności, z nowotworami, małopłytkowością idiopatyczną, sferocytozą wrodzoną;' },
          { label: '5)', text: 'z wrodzonymi wadami serca i przewlekłymi chorobami serca;' },
          { label: '6)', text: 'z przewlekłą niewydolnością nerek lub zespołem nerczycowym;' },
          { label: '7)', text: 'z chorobami metabolicznymi, w tym cukrzycą;' },
          { label: '8)', text: 'z przewlekłymi chorobami płuc, w tym astmą.' },
        ],
      },
      { label: '3.', text: 'U wcześniaków urodzonych przed ukończeniem 37. tygodnia ciąży oraz dzieci z grup ryzyka rozpoczynających szczepienie w pierwszym półroczu życia stosuje się schemat 4-dawkowy szczepienia, który obejmuje trzy dawki podane w 1. roku życia oraz czwartą dawkę podaną w 2. roku życia (co najmniej po upływie 6 miesięcy od 3 dawki).' },
    ],
    relatedRecords: ['pso-pcv-1', 'pso-pcv-2', 'pso-pcv-3', 'pso-risk-preterm-pcv'],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iii-i',
    subsectionCode: 'III.I',
    title: 'Szczepienia przeciw inwazyjnym zakażeniom NEISSERIA MENINGITIDIS',
    sourcePages: [40],
    points: [
      { label: '1.', text: 'Dostępne szczepionki chronią przed różnymi serogrupami meningokoków, najczęściej spotykanymi w populacji. Wyróżniamy szczepionki przeciw meningokokom grupy B (MenB) i szczepionki przeciw meningokokom grup A, C, W, Y (MenACWY).' },
      { label: '2.', text: 'Schemat szczepień przeciw meningokokom może się różnić w zależności od stosowanej szczepionki oraz grupy wiekowej pacjenta.' },
    ],
    relatedRecords: ['pso-rec-menb-1', 'pso-rec-menacwy-1'],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iii-j',
    subsectionCode: 'III.J',
    title: 'Szczepienia przeciw ospie wietrznej',
    sourcePages: [41],
    points: [
      { label: '1.', text: 'Pełny schemat szczepienia przeciw OSPIE WIETRZNEJ obejmuje podanie 2 dawek szczepionki, niezależnie od wieku osoby szczepionej. W przypadku podania pierwszej dawki od ukończenia 9 miesiąca życia do ukończenia 11 miesiąca życia, druga dawka może być podana najwcześniej po 3 miesiącach. W przypadku podania pierwszej dawki po ukończeniu 12 miesiąca życia, druga dawka może być podana najwcześniej po 6 tygodniach, w żadnym wypadku nie może być podana wcześniej niż po 4 tygodniach.' },
      { label: '2.', text: 'U osób, które już wcześniej otrzymały jedną dawkę szczepionki zawierającej wirusa ospy wietrznej, może zostać podana jedna dawka innej szczepionki zawierającej wirusa ospy wietrznej.' },
    ],
    relatedRecords: ['pso-risk-vzv-special', 'pso-rec-vzv-1'],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iii-k',
    subsectionCode: 'III.K',
    title: 'Szczepienia przeciw półpaścowi',
    sourcePages: [41],
    points: [
      { label: '1.', text: 'Pełny schemat szczepienia przeciw PÓŁPAŚCOWI obejmuje podanie 2 dawek szczepionki, podanych w odstępie 2–6 miesięcy. U osób, u których z uwagi na występujące niedobory odporności korzystne byłoby wcześniejsze podanie drugiej dawki, możliwe jest skrócenie odstępu pomiędzy kolejnymi dawkami do 1 miesiąca.' },
      { label: '2.', text: 'U osób, u których na podstawie badań laboratoryjnych wykonanych z innego powodu, np. po bliskim kontakcie z osobą chorą na ospę wietrzną, ustalono sero-ujemność wobec wirusa OSPY WIETRZNEJ – należy zastosować szczepionkę przeciw OSPIE WIETRZNEJ. Nie zaleca się rutynowego oznaczania przeciwciał VZV tylko w celu kwalifikacji do szczepienia przeciw półpaścowi.' },
    ],
    relatedRecords: [],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iii-l',
    subsectionCode: 'III.L',
    title: 'Szczepienia przeciw odrze, śwince i różyczce',
    sourcePages: [41],
    points: [
      { label: '1.', text: 'Szczepienie podstawowe skojarzoną szczepionką przeciw ODRZE, ŚWINCE i RÓŻYCZCE należy podać w 13.–15. miesiącu życia i w 6. roku życia.' },
      { label: '2.', text: 'Drugą dawkę skojarzonej szczepionki przeciw ODRZE, ŚWINCE i RÓŻYCZCE podaje się w 6. roku życia. U dzieci, którym nie podano 2. dawki szczepionki w 6. roku życia, należy uzupełnić brakujące szczepienie w możliwie najwcześniejszym terminie.' },
      { label: '3.', text: 'Dzieci, które nie otrzymały żadnej dawki szczepienia skojarzoną szczepionką przeciw ODRZE, ŚWINCE i RÓŻYCZCE zgodnie z PSO (szczepienia obowiązkowe), należy zaszczepić dwoma dawkami szczepionki w odstępie co najmniej 4 tygodni. Szczepienie jest obowiązkowe do ukończenia 19. roku życia.' },
      { label: '4.', text: 'Wcześniejsze szczepienie szczepionką przeciw ODRZE nie jest przeciwwskazaniem do zaszczepienia skojarzoną szczepionką przeciw ODRZE, ŚWINCE i RÓŻYCZCE.' },
      { label: '5.', text: 'Dzieci, które otrzymały dwie dawki skojarzonej szczepionki przeciw ODRZE, ŚWINCE i RÓŻYCZCE w poprzednich latach życia, nie wymagają podawania trzeciej dawki tej szczepionki. Podawane w wywiadzie przebycie zachorowania na ODRĘ, ŚWINKĘ i RÓŻYCZKĘ nie stanowi przeciwwskazania do szczepienia. Szczepienie przeciw ODRZE, ŚWINCE i RÓŻYCZCE można przeprowadzić po ustąpieniu ostrych objawów i poprawie stanu ogólnego pacjenta.' },
      { label: '6.', text: 'Nie należy szczepić szczepionką skojarzoną przeciw ODRZE, ŚWINCE i RÓŻYCZCE 4 tygodnie przed planowaną ciążą oraz w okresie ciąży, ze względu na teoretyczną możliwość wystąpienia zespołu wad wrodzonych płodu wywołanych szczepionkowym atenuowanym żywym szczepem wirusa różyczki.' },
    ],
    relatedRecords: ['pso-mmr-1', 'pso-mmr-boost-9'],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-iii-m',
    subsectionCode: 'III.M',
    title:
      'Szczepienia przeciw błonicy, tężcowi, krztuścowi, poliomyelitis, Haemophilus influenzae typu b oraz WZW typu B z użyciem szczepionki wysokoskojarzonej 6w1 (DTaP-IPV-Hib-HBV)',
    sourcePages: [42],
    introNote: 'Szczepionka 6w1 może być podawana według dwóch schematów, które są opisane w Charakterystyce Produktu Leczniczego i zaleceniach medycznych:',
    points: [
      { label: '1. Schemat podstawowy 3+1', text: 'Trzy dawki szczepienia: podawane są w odstępach co najmniej 1 miesiąc. Szczepienie rozpoczyna się zazwyczaj po ukończeniu przez dziecko 6 tygodni życia. Kolejne szczepienia wykonuje się najczęściej w 4. i 5.–6. miesiącu życia. Jedna dawka uzupełniająca powinna być podana co najmniej 6 miesięcy po trzeciej dawce szczepienia. Najczęściej jest to okres między 16. a 18. miesiącem życia.' },
      { label: '2. Schemat skrócony 2+1', text: 'W indywidualnych przypadkach dzieci, które rozpoczęły szczepienia w innym schemacie (np. w innym kraju), jako kontynuację, zgodnie z Charakterystyką Produktu Leczniczego, na podstawie decyzji lekarza, dopuszcza się zastosowanie 3-dawkowego schematu szczepienia. Pierwszą dawkę podaje się po ukończeniu 6. tygodni życia. Drugą dawkę najwcześniej po 8 tygodniach od pierwszej (zazwyczaj w 3. lub 4. miesiącu życia). Jedna dawka uzupełniająca powinna być podana co najmniej 6 miesięcy po ostatniej dawce szczepienia, najlepiej między 11. a 18. miesiącem życia.' },
    ],
    relatedRecords: ['pso-hbv-1', 'pso-dtp-1', 'pso-ipv-1', 'pso-hib-1'],
    verificationStatus: 'verified',
  },
];

// =============================================================================
// CZĘŚĆ VII — SKRÓCONE KALENDARZE SZCZEPIEŃ (str. 46–48)
// =============================================================================

export const PSO_PART_VII_TABLES: PsoPartVIIScheduleTable[] = [
  {
    id: 'pso-vii-a',
    subsectionCode: 'VII.A',
    title: 'SKRÓCONY KALENDARZ SZCZEPIEŃ OBOWIĄZKOWYCH DLA DZIECI I MŁODZIEŻY NA ROK 2027',
    sourcePage: 46,
    populationScope: 'children_and_adolescents',
    vaccinationType: 'obowiazkowe',
    columns: [
      { id: 'c24h', primaryLabel: '24h*' },
      { id: 'c2m', primaryLabel: '2 m-c życia**' },
      { id: 'c3m', primaryLabel: '3 m-c życia' },
      { id: 'c4m', primaryLabel: '4 m-c życia' },
      { id: 'c5m', primaryLabel: '5 m-c życia' },
      { id: 'c6m', primaryLabel: '6 m-c życia' },
      { id: 'c7m', primaryLabel: '7 m-c życia' },
      { id: 'c10-12m', primaryLabel: '10–12 m-c życia' },
      { id: 'c13-15m', primaryLabel: '13–15 m-c życia' },
      { id: 'c16-18m', primaryLabel: '16–18 m-c życia' },
      { id: 'c6r', primaryLabel: '6 rok życia' },
      { id: 'c14r', primaryLabel: '14 rok życia' },
      { id: 'c19r', primaryLabel: '19 rok życia' },
    ],
    rows: [
      {
        id: 'viia-bcg',
        vaccineAgainst: 'Gruźlicy*',
        relatedRecords: ['pso-bcg-0'],
        cells: [
          { id: 'bcg-24h', colSpan: 1, text: 'BCG', tone: 'active', ariaAgeRange: '24h*' },
          { id: 'bcg-rest', colSpan: 12, text: '', tone: 'empty', ariaAgeRange: '2 m-c – 19 rok życia' },
        ],
      },
      {
        id: 'viia-hbv',
        vaccineAgainst: 'Wirusowemu zapaleniu wątroby typu B',
        relatedRecords: ['pso-hbv-1', 'pso-hbv-2', 'pso-hbv-3'],
        cells: [
          { id: 'hbv-24h', colSpan: 1, text: 'HBV', tone: 'active', ariaAgeRange: '24h*' },
          { id: 'hbv-2m', colSpan: 1, text: 'HBV', tone: 'active', ariaAgeRange: '2 m-c życia**' },
          { id: 'hbv-3-6', colSpan: 4, text: '', tone: 'empty', ariaAgeRange: '3–6 m-c życia' },
          { id: 'hbv-7m', colSpan: 1, text: 'HBV', tone: 'active', ariaAgeRange: '7 m-c życia' },
          { id: 'hbv-10-19', colSpan: 6, text: '', tone: 'empty', ariaAgeRange: '10–12 m-c – 19 rok życia' },
        ],
      },
      {
        id: 'viia-rv',
        vaccineAgainst: 'Rotawirusom***',
        relatedRecords: ['pso-rv-1', 'pso-rv-2', 'pso-rv-3'],
        cells: [
          { id: 'rv-24h', colSpan: 1, text: '', tone: 'empty', ariaAgeRange: '24h*' },
          { id: 'rv-2-6m', colSpan: 5, text: 'RV', tone: 'active', ariaAgeRange: '2–6 m-c życia' },
          { id: 'rv-7-19', colSpan: 7, text: '', tone: 'empty', ariaAgeRange: '7 m-c – 19 rok życia' },
        ],
      },
      {
        id: 'viia-dtp',
        vaccineAgainst: 'Błonicy, tężcowi, krztuścowi',
        relatedRecords: ['pso-dtp-1', 'pso-dtp-2', 'pso-dtp-3', 'pso-dtp-4', 'pso-dtap-boost-6', 'pso-dtap-boost-14', 'pso-dt-boost-19'],
        cells: [
          { id: 'dtp-24h', colSpan: 1, text: '', tone: 'empty', ariaAgeRange: '24h*' },
          { id: 'dtp-2m', colSpan: 1, text: 'DTP', tone: 'active', ariaAgeRange: '2 m-c życia**' },
          { id: 'dtp-3-4m', colSpan: 2, text: 'DTP', tone: 'active', ariaAgeRange: '3–4 m-c życia' },
          { id: 'dtp-5-6m', colSpan: 2, text: 'DTP', tone: 'active', ariaAgeRange: '5–6 m-c życia' },
          { id: 'dtp-7-15m', colSpan: 3, text: '', tone: 'empty', ariaAgeRange: '7–15 m-c życia' },
          { id: 'dtp-16-18m', colSpan: 1, text: 'DTP', tone: 'active', ariaAgeRange: '16–18 m-c życia' },
          { id: 'dtp-6r', colSpan: 1, text: 'DTaP', tone: 'active', ariaAgeRange: '6 rok życia' },
          { id: 'dtp-14r', colSpan: 1, text: 'Tdap', tone: 'active', ariaAgeRange: '14 rok życia' },
          { id: 'dtp-19r', colSpan: 1, text: 'Td', tone: 'active', ariaAgeRange: '19 rok życia' },
        ],
      },
      {
        id: 'viia-ipv',
        vaccineAgainst: 'Poliomyelitis',
        relatedRecords: ['pso-ipv-1', 'pso-ipv-2', 'pso-ipv-3', 'pso-ipv-boost-6'],
        cells: [
          { id: 'ipv-24-2', colSpan: 2, text: '', tone: 'empty', ariaAgeRange: '24h – 2 m-c życia' },
          { id: 'ipv-3-4', colSpan: 2, text: 'IPV', tone: 'active', ariaAgeRange: '3–4 m-c życia' },
          { id: 'ipv-5-6', colSpan: 2, text: 'IPV', tone: 'active', ariaAgeRange: '5–6 m-c życia' },
          { id: 'ipv-7-15', colSpan: 3, text: '', tone: 'empty', ariaAgeRange: '7–15 m-c życia' },
          { id: 'ipv-16-18', colSpan: 1, text: 'IPV', tone: 'active', ariaAgeRange: '16–18 m-c życia' },
          { id: 'ipv-6r', colSpan: 1, text: 'IPV', tone: 'active', ariaAgeRange: '6 rok życia' },
          { id: 'ipv-14-19', colSpan: 2, text: '', tone: 'empty', ariaAgeRange: '14–19 rok życia' },
        ],
      },
      {
        id: 'viia-hib',
        vaccineAgainst: 'Haemophilus influenzae typu b',
        relatedRecords: ['pso-hib-1', 'pso-hib-2', 'pso-hib-3', 'pso-hib-4'],
        cells: [
          { id: 'hib-24h', colSpan: 1, text: '', tone: 'empty', ariaAgeRange: '24h*' },
          { id: 'hib-2m', colSpan: 1, text: 'Hib', tone: 'active', ariaAgeRange: '2 m-c życia**' },
          { id: 'hib-3-4', colSpan: 2, text: 'Hib', tone: 'active', ariaAgeRange: '3–4 m-c życia' },
          { id: 'hib-5-6', colSpan: 2, text: 'Hib', tone: 'active', ariaAgeRange: '5–6 m-c życia' },
          { id: 'hib-7-15', colSpan: 3, text: '', tone: 'empty', ariaAgeRange: '7–15 m-c życia' },
          { id: 'hib-16-18', colSpan: 1, text: 'Hib', tone: 'active', ariaAgeRange: '16–18 m-c życia' },
          { id: 'hib-6-19', colSpan: 3, text: '', tone: 'empty', ariaAgeRange: '6–19 rok życia' },
        ],
      },
      {
        id: 'viia-pcv',
        vaccineAgainst: 'Pneumokokom',
        relatedRecords: ['pso-pcv-1', 'pso-pcv-2', 'pso-pcv-3'],
        cells: [
          { id: 'pcv-24h', colSpan: 1, text: '', tone: 'empty', ariaAgeRange: '24h*' },
          { id: 'pcv-2m', colSpan: 1, text: 'PCV', tone: 'active', ariaAgeRange: '2 m-c życia**' },
          { id: 'pcv-3m', colSpan: 1, text: '', tone: 'empty', ariaAgeRange: '3 m-c życia' },
          { id: 'pcv-4m', colSpan: 1, text: 'PCV', tone: 'active', ariaAgeRange: '4 m-c życia' },
          { id: 'pcv-5-12', colSpan: 4, text: '', tone: 'empty', ariaAgeRange: '5–12 m-c życia' },
          { id: 'pcv-13-15', colSpan: 1, text: 'PCV', tone: 'active', ariaAgeRange: '13–15 m-c życia' },
          { id: 'pcv-16-19', colSpan: 4, text: '', tone: 'empty', ariaAgeRange: '16 m-c – 19 rok życia' },
        ],
      },
      {
        id: 'viia-mmr',
        vaccineAgainst: 'Odrze, śwince, różyczce',
        relatedRecords: ['pso-mmr-1', 'pso-mmr-boost-9'],
        cells: [
          { id: 'mmr-24-12', colSpan: 8, text: '', tone: 'empty', ariaAgeRange: '24h – 12 m-c życia' },
          { id: 'mmr-13-15', colSpan: 1, text: 'MMR', tone: 'active', ariaAgeRange: '13–15 m-c życia' },
          { id: 'mmr-16-18', colSpan: 1, text: '', tone: 'empty', ariaAgeRange: '16–18 m-c życia' },
          { id: 'mmr-6r', colSpan: 1, text: 'MMR', tone: 'active', ariaAgeRange: '6 rok życia' },
          { id: 'mmr-14-19', colSpan: 2, text: '', tone: 'empty', ariaAgeRange: '14–19 rok życia' },
        ],
      },
      {
        id: 'viia-vzv',
        vaccineAgainst: 'Ospie wietrznej****',
        relatedRecords: ['pso-risk-vzv-special'],
        cells: [
          { id: 'vzv-24-7', colSpan: 7, text: '', tone: 'empty', ariaAgeRange: '24h – 7 m-c życia' },
          { id: 'vzv-10-12', colSpan: 1, text: 'VZV', tone: 'active', ariaAgeRange: '10–12 m-c życia' },
          { id: 'vzv-13-19', colSpan: 5, text: 'VZV', tone: 'active', ariaAgeRange: '13–15 m-c – 19 rok życia' },
        ],
      },
    ],
    footnotes: [
      { marker: '*', text: 'Szczepienie noworodków przeciw GRUŹLICY powinno być przeprowadzone w 1. dobie życia, nie później niż do dnia wypisu ze szpitala.' },
      { marker: '**', text: 'Szczepienia można rozpocząć po ukończeniu 6. tygodnia życia.' },
      { marker: '***', text: 'Szczepionka przeciw rotawirusom obejmuje 2 lub 3 dawki zgodnie z Charakterystyką Produktu Leczniczego.' },
      { marker: '****', text: 'Szczepienie obowiązkowe dla dzieci i młodzieży wskazanych w części I. B PSO.' },
    ],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-vii-b',
    subsectionCode: 'VII.B',
    title: 'SKRÓCONY KALENDARZ SZCZEPIEŃ ZALECANYCH DLA DZIECI I MŁODZIEŻY NA ROK 2027',
    sourcePage: 47,
    populationScope: 'children_and_adolescents',
    vaccinationType: 'zalecane',
    columns: [
      { id: 'b2m', primaryLabel: '2 m-c życia' },
      { id: 'b3m', primaryLabel: '3 m-c życia' },
      { id: 'b4m', primaryLabel: '4 m-c życia' },
      { id: 'b5m', primaryLabel: '5 m-c życia' },
      { id: 'b6m', primaryLabel: '6 m-c życia' },
      { id: 'b7m', primaryLabel: '7 m-c życia' },
      { id: 'b9-11m', primaryLabel: '9–11 m-c życia' },
      { id: 'b13-15m', primaryLabel: '13–15 m-c życia' },
      { id: 'b16-18m', primaryLabel: '16–18 m-c życia' },
      { id: 'b6r', primaryLabel: '6 rok życia' },
      { id: 'b9r', primaryLabel: '9 rok życia' },
      { id: 'b14r', primaryLabel: '14 rok życia' },
      { id: 'b19r', primaryLabel: '19 rok życia' },
    ],
    rows: [
      {
        id: 'viib-meningo',
        vaccineAgainst: 'Meningokokom',
        relatedRecords: ['pso-rec-menb-1', 'pso-rec-menacwy-1'],
        cells: [
          {
            id: 'men-all',
            colSpan: 13,
            text: 'MenB / MenACWY – schemat szczepień zależnie od wieku',
            tone: 'active',
            ariaAgeRange: '2 m-c – 19 rok życia',
          },
        ],
      },
      {
        id: 'viib-flu',
        vaccineAgainst: 'Grypie',
        relatedRecords: ['pso-rec-influenza-1'],
        cells: [
          { id: 'flu-2-6', colSpan: 5, text: '', tone: 'empty', ariaAgeRange: '2–6 m-c życia' },
          {
            id: 'flu-7-19',
            colSpan: 8,
            text: '1 dawka (pierwsze szczepienie w życiu do 8 lat - 2 dawki w odstępie 4 tygodni)',
            tone: 'active',
            ariaAgeRange: '7 m-c – 19 rok życia',
          },
        ],
      },
      {
        id: 'viib-covid',
        vaccineAgainst: 'COVID-19',
        relatedRecords: ['pso-rec-covid-pediatric'],
        cells: [
          { id: 'cov-2-6', colSpan: 5, text: '', tone: 'empty', ariaAgeRange: '2–6 m-c życia' },
          {
            id: 'cov-7-19',
            colSpan: 8,
            text: '1 dawka przypominająca albo pierwsze szczepienie w życiu (zgodnie z obowiązującymi komunikatami Ministra Zdrowia i Charakterystyką Produktu Leczniczego)',
            tone: 'active',
            ariaAgeRange: '7 m-c – 19 rok życia',
          },
        ],
      },
      {
        id: 'viib-vzv',
        vaccineAgainst: 'Ospie wietrznej',
        relatedRecords: ['pso-rec-vzv-1'],
        cells: [
          { id: 'vzv-2-7', colSpan: 6, text: '', tone: 'empty', ariaAgeRange: '2–7 m-c życia' },
          {
            id: 'vzv-9-19',
            colSpan: 7,
            text: '2 dawki w odstępie co najmniej 3 miesięcy',
            tone: 'active',
            ariaAgeRange: '9–11 m-c – 19 rok życia',
          },
        ],
      },
      {
        id: 'viib-kzm',
        vaccineAgainst: 'Kleszczowemu zapaleniu mózgu',
        relatedRecords: ['pso-rec-kzm-1'],
        cells: [
          { id: 'kzm-2-11', colSpan: 7, text: '', tone: 'empty', ariaAgeRange: '2–11 m-c życia' },
          {
            id: 'kzm-13-19',
            colSpan: 6,
            text: '3 dawki w schemacie podstawowym, dawka przypominająca co 3–5 lat',
            tone: 'active',
            ariaAgeRange: '13–15 m-c – 19 rok życia',
          },
        ],
      },
      {
        id: 'viib-hava',
        vaccineAgainst: 'Wirusowemu zapaleniu wątroby typu A',
        relatedRecords: ['pso-rec-hava-1'],
        cells: [
          { id: 'hava-2-11', colSpan: 7, text: '', tone: 'empty', ariaAgeRange: '2–11 m-c życia' },
          {
            id: 'hava-13-19',
            colSpan: 6,
            text: '2 dawki w odstępie 6–12 miesięcy',
            tone: 'active',
            ariaAgeRange: '13–15 m-c – 19 rok życia',
          },
        ],
      },
      {
        id: 'viib-hpv',
        vaccineAgainst: 'Ludzkiemu wirusowi brodawczaka',
        relatedRecords: ['pso-rec-hpv-9', 'pso-rec-hpv-catchup'],
        cells: [
          { id: 'hpv-2-6r', colSpan: 10, text: '', tone: 'empty', ariaAgeRange: '2 m-c – 6 rok życia' },
          {
            id: 'hpv-9-19',
            colSpan: 3,
            text: '2 dawki 9–14 lat / 3 dawki 15–18 lat',
            tone: 'active',
            ariaAgeRange: '9–19 rok życia',
          },
        ],
      },
    ],
    footnotes: [],
    verificationStatus: 'verified',
  },
  {
    id: 'pso-vii-c',
    subsectionCode: 'VII.C',
    title: 'SKRÓCONY KALENDARZ SZCZEPIEŃ ZALECANYCH DLA DOROSŁYCH NA ROK 2027 (KRYTERIUM WIEKOWE)',
    sourcePage: 48,
    populationScope: 'adults',
    vaccinationType: 'zalecane',
    columns: [
      { id: 'a19-49', primaryLabel: '19–49 lat' },
      { id: 'a50-64', primaryLabel: '50–64 lat' },
      { id: 'a65plus', primaryLabel: '65 lat i powyżej' },
    ],
    rows: [
      {
        id: 'viic-covid',
        vaccineAgainst: 'COVID-19',
        relatedRecords: [],
        cells: [{ id: 'c-cov', colSpan: 3, text: '1 dawka zgodnie z komunikatami Ministerstwa Zdrowia', tone: 'active', ariaAgeRange: '19–49, 50–64 oraz 65 lat i powyżej' }],
      },
      {
        id: 'viic-flu',
        vaccineAgainst: 'Grypie',
        relatedRecords: ['pso-rec-influenza-1'],
        cells: [{ id: 'c-flu', colSpan: 3, text: '1 dawka w sezonie infekcyjnym (najlepiej na początku sezonu)', tone: 'active', ariaAgeRange: '19–49, 50–64 oraz 65 lat i powyżej' }],
      },
      {
        id: 'viic-rsv',
        vaccineAgainst: 'Syncytialnemu wirusowi oddechowemu',
        relatedRecords: [],
        cells: [{ id: 'c-rsv', colSpan: 3, text: '1 dawka, w szczególności osobom po 50 roku życia', tone: 'active', ariaAgeRange: '19–49, 50–64 oraz 65 lat i powyżej' }],
      },
      {
        id: 'viic-meningo',
        vaccineAgainst: 'Meningokokom',
        relatedRecords: ['pso-rec-menb-1', 'pso-rec-menacwy-1'],
        cells: [
          {
            id: 'c-men-empty',
            colSpan: 2,
            text: '',
            tone: 'conditional',
            ariaAgeRange: '19–49 lat i 50–64 lat (pusta komórka w oficjalnej tabeli str. 48)',
          },
          {
            id: 'c-men-65',
            colSpan: 1,
            text: 'MenB – 2 dawki / MenACWY – 1 dawka',
            tone: 'active',
            ariaAgeRange: '65 lat i powyżej',
          },
        ],
        rowNote:
          'Uwaga audytowa: w tabeli PDF (str. 48) opis „MenB – 2 dawki / MenACWY – 1 dawka” umieszczono w kolumnie „65 lat i powyżej”, podczas gdy przedziały 19–64 lat pozostawiono puste (tło #d9d9d9). W Części II.B (str. 23–24) zalecenie dotyczy dorosłych z grup ryzyka oraz „w szczególności powyżej 65. r.ż.”.',
      },
      {
        id: 'viic-pneumo',
        vaccineAgainst: 'Pneumokokom',
        relatedRecords: ['pso-pcv-1'],
        cells: [
          { id: 'c-pcv-19', colSpan: 1, text: 'zalecane w grupach ryzyka', tone: 'conditional', ariaAgeRange: '19–49 lat' },
          { id: 'c-pcv-50plus', colSpan: 2, text: '1 dawka PCV13 + 1 dawka PPSV-23 albo PCV20/PCV21', tone: 'active', ariaAgeRange: '50–64 lat oraz 65 lat i powyżej' },
        ],
      },
      {
        id: 'viic-kzm',
        vaccineAgainst: 'Kleszczowemu zapaleniu mózgu',
        relatedRecords: ['pso-rec-kzm-1'],
        cells: [{ id: 'c-kzm', colSpan: 3, text: '3 dawki w schemacie podstawowym, dawka przypominająca co 3–5 lat', tone: 'active', ariaAgeRange: '19–49, 50–64 oraz 65 lat i powyżej' }],
      },
      {
        id: 'viic-hbv',
        vaccineAgainst: 'Wirusowemu zapaleniu wątroby typu B',
        relatedRecords: ['pso-hepb-unvaccinated-primary'],
        cells: [{ id: 'c-hbv', colSpan: 3, text: '3 dawki dla osób wcześniej nieszczepionych', tone: 'active', ariaAgeRange: '19–49, 50–64 oraz 65 lat i powyżej' }],
      },
      {
        id: 'viic-hava',
        vaccineAgainst: 'Wirusowemu zapaleniu wątroby typu A',
        relatedRecords: ['pso-rec-hava-1'],
        cells: [{ id: 'c-hava', colSpan: 3, text: '2 dawki dla osób wcześniej nieszczepionych', tone: 'active', ariaAgeRange: '19–49, 50–64 oraz 65 lat i powyżej' }],
      },
      {
        id: 'viic-mmr',
        vaccineAgainst: 'Odrze, śwince, różyczce',
        relatedRecords: ['pso-mmr-1'],
        cells: [{ id: 'c-mmr', colSpan: 3, text: '2 dawki dla osób wcześniej nieszczepionych, które nie przechorowały odry', tone: 'active', ariaAgeRange: '19–49, 50–64 oraz 65 lat i powyżej' }],
      },
      {
        id: 'viic-tdap',
        vaccineAgainst: 'Błonicy, tężcowi, krztuścowi',
        relatedRecords: ['pso-dtap-boost-14', 'pso-dt-boost-19'],
        cells: [{ id: 'c-tdap', colSpan: 3, text: '1 dawka co 10 lat', tone: 'active', ariaAgeRange: '19–49, 50–64 oraz 65 lat i powyżej' }],
      },
      {
        id: 'viic-hpv',
        vaccineAgainst: 'Ludzkiemu wirusowi brodawczaka',
        relatedRecords: ['pso-rec-hpv-catchup'],
        cells: [
          { id: 'c-hpv-19', colSpan: 1, text: '3 dawki', tone: 'active', ariaAgeRange: '19–49 lat' },
          { id: 'c-hpv-50plus', colSpan: 2, text: 'po konsultacji z lekarzem', tone: 'conditional', ariaAgeRange: '50–64 lat oraz 65 lat i powyżej' },
        ],
      },
      {
        id: 'viic-vzv',
        vaccineAgainst: 'Ospie wietrznej',
        relatedRecords: ['pso-rec-vzv-1'],
        cells: [{ id: 'c-vzv', colSpan: 3, text: '2 dawki dla osób wcześniej nieszczepionych, które nie przechorowały ospy wietrznej', tone: 'active', ariaAgeRange: '19–49, 50–64 oraz 65 lat i powyżej' }],
      },
      {
        id: 'viic-zoster',
        vaccineAgainst: 'Półpaścowi',
        relatedRecords: [],
        cells: [
          {
            id: 'c-zoster',
            colSpan: 3,
            text: '2 dawki u osób w wieku 18 lat i starszych z grup ryzyka oraz u wszystkich osób, które ukończyły 50. rok życia',
            tone: 'active',
            ariaAgeRange: '19–49, 50–64 oraz 65 lat i powyżej',
          },
        ],
      },
    ],
    footnotes: [],
    verificationStatus: 'conflicting',
    structuralAuditNote:
      'Dosłowne odwzorowanie tabeli VII.C (str. 48 akt.pdf): w wierszu „Meningokokom” komórki 19–49 i 50–64 lat są w PDF puste (#d9d9d9), mimo że Część II.B (str. 23–24) wymienia dorosłych z grup ryzyka niezależnie od ukończenia 65. r.ż. Różnicę zachowano jawnie jako status conflicting zamiast ręcznie zgadywać układu kolumn.',
  },
];

// =============================================================================
// REJESTR KOMPLETNOŚCI 7 CZĘŚCI PSO 2027 + ZUNIFIKOWANY INDEKS WYSZUKIWANIA
// =============================================================================

export const PSO_2027_COMPLETENESS_REGISTRY: PsoSubsectionCompletenessEntry[] = [
  {
    subsectionCode: 'I.A',
    partNumber: 'I',
    title: 'Szczepienia obowiązkowe dzieci i młodzieży (populacja ogólna)',
    sourcePages: [4, 5, 6, 7, 8],
    populationScope: 'children_and_adolescents',
    recordCount: 27,
    verificationStatus: 'verified',
    summaryNote:
      'Zakres PSO zweryfikowany w 100% z str. 4–8 akt.pdf (w tym reguła >3 mies. pobytu w Polsce); niezależny audyt ChPL/finansowania w zakładce procedur ma osobny status.',
  },
  {
    subsectionCode: 'I.A.1',
    partNumber: 'I',
    title: 'Wariant 5w1 (DTaP-IPV-Hib) dzieci do 2 lat',
    sourcePages: [9, 10],
    populationScope: 'children_and_adolescents',
    recordCount: PSO_PART_IA_SCOPE_NOTES.subsectionIA1.keyScheduleHighlights.length,
    verificationStatus: 'verified',
    summaryNote: 'Odwzorowany pełny harmonogram 5w1 + WZW B z str. 9–10 akt.pdf wraz z odsyłaczem *.',
  },
  {
    subsectionCode: 'I.A.2',
    partNumber: 'I',
    title: 'Wariant 6w1 (DTaP-IPV-Hib-HBV) dzieci do 2 lat',
    sourcePages: [11, 12],
    populationScope: 'children_and_adolescents',
    recordCount: PSO_PART_IA_SCOPE_NOTES.subsectionIA2.keyScheduleHighlights.length,
    verificationStatus: 'verified',
    summaryNote: 'Odwzorowany pełny harmonogram 6w1 z str. 11–12 akt.pdf (3. dawka w 5.–6. m.ż., 16.–18. m.ż.).',
  },
  {
    subsectionCode: 'I.B',
    partNumber: 'I',
    title: 'Szczepienia obowiązkowe grup ryzyka klinicznego i epidemiologicznego',
    sourcePages: [13, 14],
    populationScope: 'risk_groups',
    recordCount: PSO_PART_IB_RISK_BLOCKS.length,
    verificationStatus: 'verified',
    summaryNote:
      'Wszystkie 4 tabele z str. 13–14 (po transplantacji/splenektomii, pneumokoki 9 grup, WZW B 8 grup, ospa wietrzna 3 grupy w tym 9 placówek).',
  },
  {
    subsectionCode: 'I.C',
    partNumber: 'I',
    title: 'Szczepienia poekspozycyjne (obowiązkowe)',
    sourcePages: [15],
    populationScope: 'post_exposure',
    recordCount: PSO_PART_IC_ENTRIES.length,
    verificationStatus: 'verified',
    summaryNote: 'Błonica, tężec, wścieklizna z str. 15 akt.pdf.',
  },
  {
    subsectionCode: 'I.D',
    partNumber: 'I',
    title: 'Profilaktyka poekspozycyjna przeciw wściekliźnie',
    sourcePages: [16, 17],
    populationScope: 'post_exposure',
    recordCount: PSO_PART_ID_RABIES_MATRIX.length,
    verificationStatus: 'verified',
    summaryNote: 'Pełne reguły (20 j.m./kg mc., obserwacja do 15 dni, ponowne narażenie) i 8-wierszowa tabela kontaktu (str. 16–17).',
  },
  {
    subsectionCode: 'I.E',
    partNumber: 'I',
    title: 'Profilaktyka poekspozycyjna przeciw tężcowi',
    sourcePages: [18],
    populationScope: 'post_exposure',
    recordCount: PSO_PART_IE_TETANUS_MATRIX.length,
    verificationStatus: 'verified',
    summaryNote: 'Macierz 4 historii szczepień × niskie/wysokie ryzyko z dawkami LIT 250/500 j.m. oraz przypisem * (str. 18).',
  },
  {
    subsectionCode: 'II.A',
    partNumber: 'II',
    title: 'Szczepienia zalecane dzieci i młodzieży',
    sourcePages: [19, 20, 21],
    populationScope: 'children_and_adolescents',
    recordCount: PSO_PART_IIA_PEDIATRIC_RECOMMENDED.length,
    verificationStatus: 'partially_verified',
    summaryNote:
      'Treść PSO II.A zweryfikowana w 100% ze str. 19–21; powiązane rekordy ChPL/finansowania pozostają w niezależnej weryfikacji katalogowej.',
    discrepancyOrCaveat: 'Rozdzielenie statusu PSO (zweryfikowane) od niezależnego audytu ChPL/RPL preparatów.',
  },
  {
    subsectionCode: 'II.B',
    partNumber: 'II',
    title: 'Szczepienia zalecane dorosłych',
    sourcePages: [22, 23, 24, 25, 26, 27],
    populationScope: 'adults',
    recordCount: PSO_PART_IIB_ADULTS_RECOMMENDED.length,
    verificationStatus: 'verified',
    summaryNote: 'Wszystkie 17 pozycji dorosłych (COVID-19, grypa 60+ wysokodawkowa, RSV >=50, meningokoki, pneumokoki, Hib, KZM, WZW B/A, MMR, Tdap, Td, HPV, polio, VZV, półpasiec, Mpox).',
  },
  {
    subsectionCode: 'II.C',
    partNumber: 'II',
    title: 'Szczepienia zalecane dla kobiet w ciąży',
    sourcePages: [28, 29],
    populationScope: 'pregnant_women',
    recordCount: PSO_PART_IIC_PREGNANCY.length,
    verificationStatus: 'verified',
    summaryNote: 'COVID-19, grypa, RSV (24–36 / opt. 32–36 tyg.), Tdap (27–36 / >20 tyg.) oraz zalecenie 2 tyg. odstępu RSV–Tdap.',
  },
  {
    subsectionCode: 'II.D',
    partNumber: 'II',
    title: 'Szczepienia zalecane dla osób wykonujących zawód medyczny',
    sourcePages: [29, 30],
    populationScope: 'healthcare_workers',
    recordCount: PSO_PART_IID_HEALTHCARE_WORKERS.length,
    verificationStatus: 'verified',
    summaryNote: 'Wszystkie 10 pozycji personelu medycznego (str. 29–30).',
  },
  {
    subsectionCode: 'II.E',
    partNumber: 'II',
    title: 'Szczepienia innych grup pracowników narażonych na zakażenie',
    sourcePages: [30, 31],
    populationScope: 'occupational_groups',
    recordCount: PSO_PART_IIE_OTHER_WORKERS.length,
    verificationStatus: 'verified',
    summaryNote: 'Podstawy finansowania przez pracodawcę (Dz. U. 2012 poz. 40, MZ 2005) i 8 grup zawodowych.',
  },
  {
    subsectionCode: 'II.F',
    partNumber: 'II',
    title: 'Szczepienia poekspozycyjne (zalecane)',
    sourcePages: [32, 33],
    populationScope: 'post_exposure',
    recordCount: PSO_PART_IIF_POST_EXPOSURE.length,
    verificationStatus: 'verified',
    summaryNote: 'Odra (72h/Ig 6d), ospa wietrzna (72h–5d/Ig 96h), WZW A (14d), WZW B (12–24h do 7d).',
  },
  {
    subsectionCode: 'II.G',
    partNumber: 'II',
    title: 'Zalecana profilaktyka poekspozycyjna przeciw WZW typu B',
    sourcePages: [34],
    populationScope: 'post_exposure',
    recordCount: PSO_PART_IIG_HBV_PEP_MATRIX.length,
    verificationStatus: 'verified',
    summaryNote: 'Pełna macierz 5 statusów × HBsAg(+)/(-)/nieznane.',
  },
  {
    subsectionCode: 'II.H',
    partNumber: 'II',
    title: 'Uodpornienie bierne przeciw RSV',
    sourcePages: [34],
    populationScope: 'children_and_adolescents',
    recordCount: 1,
    verificationStatus: 'verified',
    summaryNote: 'Przeciwciała monoklonalne dla noworodków, niemowląt w 1. sezonie i dzieci ryzyka do 2 lat.',
  },
  {
    subsectionCode: 'II.I',
    partNumber: 'II',
    title: 'Szczepienia zalecane dzieciom i dorosłym przed podróżą zagraniczną w obszary endemiczne',
    sourcePages: [35],
    populationScope: 'travelers',
    recordCount: PSO_PART_III_TRAVEL_ENDEMIC.length,
    verificationStatus: 'verified',
    summaryNote: 'Wszystkie 10 pozycji (cholera, dur, WZW A, wścieklizna, polio IPV 1/2/3, JE, żółta gorączka, denga, chikungunya, meningokoki).',
  },
  ...PSO_PART_III_SECTIONS.map((sec) => ({
    subsectionCode: sec.subsectionCode,
    partNumber: 'III' as const,
    title: sec.title,
    sourcePages: sec.sourcePages,
    populationScope: 'cross_age' as const,
    recordCount: sec.points.length,
    verificationStatus: sec.verificationStatus,
    summaryNote: `Część ${sec.subsectionCode} (str. ${sec.sourcePages.join('–')}) — ${sec.points.length} punktów zasad szczegółowych.`,
  })),
  {
    subsectionCode: 'IV',
    partNumber: 'IV',
    title: 'Ogólne zasady przeprowadzania i organizacji szczepień',
    sourcePages: [43],
    populationScope: 'cross_age',
    recordCount: PSO_GENERAL_PRINCIPLES_PART_IV.length,
    verificationStatus: 'verified',
    summaryNote: 'Preambuła i 7 literalnych punktów z str. 43; normy 24h i NOP oddzielone w wykazie ustaw odrębnych.',
  },
  {
    subsectionCode: 'V',
    partNumber: 'V',
    title: 'Szczepienia wyrównawcze',
    sourcePages: [44],
    populationScope: 'children_and_adolescents',
    recordCount: PSO_CATCH_UP_12_POINTS_PART_V.length,
    verificationStatus: 'verified',
    summaryNote: 'Wszystkie 12 numerowanych punktów IKSz i kontynuacji bezpłatnej ze str. 44 akt.pdf.',
  },
  {
    subsectionCode: 'VI',
    partNumber: 'VI',
    title: 'Uprawnienia osób wykonujących zawód medyczny (kwalifikacja i podanie)',
    sourcePages: [45],
    populationScope: 'staff_qualifications',
    recordCount: STAFF_QUALIFICATIONS_PSO_PART_VI.length,
    verificationStatus: 'verified',
    summaryNote: 'Tabela 7 kolumn × 10 zawodów ze str. 45 (po korekcie Felczer, Pielęgniarka, Położna) + przypisy * i **.',
  },
  {
    subsectionCode: 'VII.A',
    partNumber: 'VII',
    title: 'Skrócony kalendarz szczepień obowiązkowych dzieci i młodzieży 2027',
    sourcePages: [46],
    populationScope: 'children_and_adolescents',
    recordCount: PSO_PART_VII_TABLES[0].rows.length,
    verificationStatus: 'verified',
    summaryNote: 'Macierz 9 wierszy × 13 kolumn wieku z exact colSpan i przypisami *–****.',
  },
  {
    subsectionCode: 'VII.B',
    partNumber: 'VII',
    title: 'Skrócony kalendarz szczepień zalecanych dzieci i młodzieży 2027',
    sourcePages: [47],
    populationScope: 'children_and_adolescents',
    recordCount: PSO_PART_VII_TABLES[1].rows.length,
    verificationStatus: 'verified',
    summaryNote: 'Macierz 7 wierszy × 13 kolumn (z kolumną 9–11 m-c i 9 rok) ze scaleniami z str. 47.',
  },
  {
    subsectionCode: 'VII.C',
    partNumber: 'VII',
    title: 'Skrócony kalendarz szczepień zalecanych dla dorosłych 2027 (kryterium wiekowe)',
    sourcePages: [48],
    populationScope: 'adults',
    recordCount: PSO_PART_VII_TABLES[2].rows.length,
    verificationStatus: 'conflicting',
    summaryNote: 'Macierz 13 wierszy × 3 przedziały wieku dorosłych (19–49, 50–64, 65+).',
    discrepancyOrCaveat:
      'Wiersz „Meningokokom” w PDF str. 48 pozostawia puste kolumny 19–64 lat (#d9d9d9), umieszczając dawkowanie w 65+, natomiast Część II.B (str. 23–24) wskazuje grupy ryzyka niezależnie od wieku.',
  },
];

export const PSO_2027_STRUCTURED_RECORDS: PsoStructuredRecord[] = [
  // Część I.A / I.A.1 / I.A.2
  {
    id: 'rec-ia-scope',
    sourcePart: 'I',
    sourceSubsection: 'I.A',
    sourcePage: [4, 5, 6, 7, 8],
    sourceTitle: PSO_2027_SOURCE_META.sourceTitle,
    populationScope: 'children_and_adolescents',
    vaccinationType: 'obowiazkowe',
    title: PSO_PART_IA_SCOPE_NOTES.subsectionIA.title,
    description: PSO_PART_IA_SCOPE_NOTES.subsectionIA.officialScopeRule,
    relatedRecords: [...PSO_PART_IA_SCOPE_NOTES.subsectionIA.relatedRecords],
    sourceReference: `${PSO_2027_SOURCE_META.journalCitation}, Część I.A, str. 2 i 4–8`,
    verificationStatus: 'verified',
  },
  {
    id: 'rec-ia1-5w1',
    sourcePart: 'I',
    sourceSubsection: 'I.A.1',
    sourcePage: [9, 10],
    sourceTitle: PSO_2027_SOURCE_META.sourceTitle,
    populationScope: 'children_and_adolescents',
    vaccinationType: 'obowiazkowe',
    title: PSO_PART_IA_SCOPE_NOTES.subsectionIA1.title,
    description: PSO_PART_IA_SCOPE_NOTES.subsectionIA1.keyScheduleHighlights.join(' '),
    schedule: '2., 4., 6.–7. oraz 16.–18. m.ż. (z osobnymi iniekcjami WZW B w 1. dobie, 2. m.ż. i 6.–7. m.ż.)',
    relatedRecords: ['pso-bcg-0', 'pso-hbv-1', 'pso-hbv-2', 'pso-hbv-3', 'pso-rv-1', 'pso-pcv-1'],
    sourceReference: `${PSO_2027_SOURCE_META.journalCitation}, Część I.A.1, str. 9–10`,
    verificationStatus: 'verified',
  },
  {
    id: 'rec-ia2-6w1',
    sourcePart: 'I',
    sourceSubsection: 'I.A.2',
    sourcePage: [11, 12],
    sourceTitle: PSO_2027_SOURCE_META.sourceTitle,
    populationScope: 'children_and_adolescents',
    vaccinationType: 'obowiazkowe',
    title: PSO_PART_IA_SCOPE_NOTES.subsectionIA2.title,
    description: PSO_PART_IA_SCOPE_NOTES.subsectionIA2.keyScheduleHighlights.join(' '),
    schedule: '2., 4., 5.–6. oraz 16.–18. m.ż. (+ WZW B w 1. dobie)',
    relatedRecords: ['pso-bcg-0', 'pso-hbv-1', 'pso-dtp-1', 'pso-ipv-1', 'pso-hib-1'],
    sourceReference: `${PSO_2027_SOURCE_META.journalCitation}, Część I.A.2, str. 11–12`,
    verificationStatus: 'verified',
  },
  // Część I.B
  ...PSO_PART_IB_RISK_BLOCKS.map((b) => ({
    id: b.id,
    sourcePart: 'I' as const,
    sourceSubsection: b.sourceSubsection,
    sourcePage: b.sourcePages,
    sourceTitle: PSO_2027_SOURCE_META.sourceTitle,
    populationScope: 'risk_groups' as const,
    vaccinationType: 'obowiazkowe' as const,
    title: b.diseaseOrGroupTitle,
    description: `${b.obligatedPersonsIntro} ${b.obligatedGroups.map((g) => `${g.label} ${g.text}`).join(' ')}`,
    riskGroup: b.obligatedPersonsIntro,
    schedule: b.officialNotes,
    relatedRecords: b.relatedRecords,
    sourceReference: `${PSO_2027_SOURCE_META.journalCitation}, Część I.B, str. ${b.sourcePages.join('–')}`,
    verificationStatus: b.verificationStatus,
  })),
  // Część I.C
  ...PSO_PART_IC_ENTRIES.map((c) => ({
    id: c.id,
    sourcePart: 'I' as const,
    sourceSubsection: c.sourceSubsection,
    sourcePage: c.sourcePage,
    sourceTitle: PSO_2027_SOURCE_META.sourceTitle,
    populationScope: 'post_exposure' as const,
    vaccinationType: 'obowiazkowe' as const,
    title: `Szczepienie poekspozycyjne przeciw ${c.disease}`,
    description: `${c.obligatedPersons} ${c.officialNotes}`,
    riskGroup: c.obligatedPersons,
    schedule: c.officialNotes,
    relatedRecords: c.relatedRecords,
    sourceReference: `${PSO_2027_SOURCE_META.journalCitation}, Część I.C, str. 15`,
    verificationStatus: 'verified' as const,
  })),
  // Część I.D & I.E
  {
    id: 'rec-id-rabies-pep',
    sourcePart: 'I',
    sourceSubsection: 'I.D',
    sourcePage: [16, 17],
    sourceTitle: PSO_2027_SOURCE_META.sourceTitle,
    populationScope: 'post_exposure',
    vaccinationType: 'obowiazkowe',
    title: 'Profilaktyka poekspozycyjna przeciw wściekliźnie (macierz kontaktu str. 17)',
    description: `${PSO_PART_ID_RABIES_RULES.qualificationRule} ${PSO_PART_ID_RABIES_RULES.activePassiveRule}`,
    schedule: 'Schemat czynny/czynno-bierny wg ChPL + RIG 20 j.m./kg mc. do 7 dni; obserwacja wet. do 15 dni.',
    relatedRecords: ['pso-rabies-postexposure'],
    sourceReference: `${PSO_2027_SOURCE_META.journalCitation}, Część I.D, str. 16–17`,
    verificationStatus: 'verified',
  },
  {
    id: 'rec-ie-tetanus-pep',
    sourcePart: 'I',
    sourceSubsection: 'I.E',
    sourcePage: [18],
    sourceTitle: PSO_2027_SOURCE_META.sourceTitle,
    populationScope: 'post_exposure',
    vaccinationType: 'obowiazkowe',
    title: 'Profilaktyka poekspozycyjna przeciw tężcowi (macierz ryzyka str. 18)',
    description: `Wytyczne swoistego zapobiegania tężcowi u zranionych (niskie vs wysokie ryzyko, LIT 250/500 j.m., schemat 0; 1; 6 mies.). ${PSO_PART_IE_FOOTNOTE}`,
    schedule: '0; 1; 6 mies. u nieszczepionych / dawka przypominająca zależna od upływu <5 / 5–10 / >10 lat',
    relatedRecords: ['pso-dtp-1', 'pso-dtap-boost-14', 'pso-dt-boost-19'],
    sourceReference: `${PSO_2027_SOURCE_META.journalCitation}, Część I.E, str. 18`,
    verificationStatus: 'verified',
  },
  // Część II (A, B, C, D, E, F, H, I)
  ...[
    ...PSO_PART_IIA_PEDIATRIC_RECOMMENDED,
    ...PSO_PART_IIB_ADULTS_RECOMMENDED,
    ...PSO_PART_IIC_PREGNANCY,
    ...PSO_PART_IID_HEALTHCARE_WORKERS,
    ...PSO_PART_IIE_OTHER_WORKERS,
    ...PSO_PART_IIF_POST_EXPOSURE,
    PSO_PART_IIH_RSV_PASSIVE,
    ...PSO_PART_III_TRAVEL_ENDEMIC,
  ].map((row) => ({
    id: row.id,
    sourcePart: 'II' as const,
    sourceSubsection: row.sourceSubsection,
    sourcePage: row.sourcePages,
    sourceTitle: PSO_2027_SOURCE_META.sourceTitle,
    populationScope: row.populationScope,
    vaccinationType: row.vaccinationType,
    title: `${row.sourceSubsection}: ${row.subjectLabel}`,
    description: `${row.recommendations} ${row.notes}`.trim(),
    schedule: row.notes,
    relatedRecords: row.relatedRecords,
    sourceReference: `${PSO_2027_SOURCE_META.journalCitation}, Część ${row.sourceSubsection}, str. ${row.sourcePages.join('–')}`,
    verificationStatus: row.verificationStatus,
    auditNote: row.auditNote,
  })),
  // Część II.G
  {
    id: 'rec-iig-hbv-pep',
    sourcePart: 'II',
    sourceSubsection: 'II.G',
    sourcePage: [34],
    sourceTitle: PSO_2027_SOURCE_META.sourceTitle,
    populationScope: 'post_exposure',
    vaccinationType: 'zalecane',
    title: 'Zalecana profilaktyka poekspozycyjna przeciw WZW typu B (macierz HBsAg)',
    description: PSO_PART_IIG_HBV_PEP_MATRIX.map(
      (r) => `${r.exposedPersonStatus}: HBsAg(+): ${r.sourceHbsAgPositive}`
    ).join(' | '),
    schedule: 'Ocena anty-HBs (10 mIU/ml) + HBIG / szczepienie / brak wskazań',
    relatedRecords: ['pso-hepb-unvaccinated-primary'],
    sourceReference: `${PSO_2027_SOURCE_META.journalCitation}, Część II.G, str. 34`,
    verificationStatus: 'verified',
  },
  // Część III.A–III.M
  ...PSO_PART_III_SECTIONS.map((sec) => ({
    id: sec.id,
    sourcePart: 'III' as const,
    sourceSubsection: sec.subsectionCode,
    sourcePage: sec.sourcePages,
    sourceTitle: PSO_2027_SOURCE_META.sourceTitle,
    populationScope: 'cross_age' as const,
    vaccinationType: 'organizacyjne' as const,
    title: `${sec.subsectionCode}: ${sec.title}`,
    description: sec.points.map((p) => `${p.label} ${p.text}`).join(' '),
    relatedRecords: sec.relatedRecords,
    sourceReference: `${PSO_2027_SOURCE_META.journalCitation}, Część ${sec.subsectionCode}, str. ${sec.sourcePages.join('–')}`,
    verificationStatus: sec.verificationStatus,
  })),
  // Część IV
  ...PSO_GENERAL_PRINCIPLES_PART_IV.map((p) => ({
    id: `rec-iv-${p.pointNumber}`,
    sourcePart: 'IV' as const,
    sourceSubsection: 'IV',
    sourcePage: p.psoPdfPage,
    sourceTitle: PSO_2027_SOURCE_META.sourceTitle,
    populationScope: 'cross_age' as const,
    vaccinationType: 'organizacyjne' as const,
    title: `Część IV pkt ${p.pointNumber}: ${p.title}`,
    description: p.officialRuleText,
    relatedRecords: [],
    sourceReference: `${PSO_2027_SOURCE_META.journalCitation}, Część IV pkt ${p.pointNumber}, str. ${p.psoPdfPage}`,
    verificationStatus: 'verified' as const,
  })),
  // Część V
  ...PSO_CATCH_UP_12_POINTS_PART_V.map((p) => ({
    id: `rec-v-${p.pointNumber}`,
    sourcePart: 'V' as const,
    sourceSubsection: 'V',
    sourcePage: p.psoPdfPage,
    sourceTitle: PSO_2027_SOURCE_META.sourceTitle,
    populationScope: 'children_and_adolescents' as const,
    vaccinationType: 'organizacyjne' as const,
    title: `Część V pkt ${p.pointNumber}: ${p.title}`,
    description: p.officialRuleText,
    relatedRecords: [],
    sourceReference: `${PSO_2027_SOURCE_META.journalCitation}, Część V pkt ${p.pointNumber}, str. ${p.psoPdfPage}`,
    verificationStatus: 'verified' as const,
  })),
  // Część VI
  ...STAFF_QUALIFICATIONS_PSO_PART_VI.map((s) => ({
    id: `rec-vi-${s.professionId}`,
    sourcePart: 'VI' as const,
    sourceSubsection: 'VI',
    sourcePage: 45,
    sourceTitle: PSO_2027_SOURCE_META.sourceTitle,
    populationScope: 'staff_qualifications' as const,
    vaccinationType: 'organizacyjne' as const,
    title: `Część VI: Uprawnienia — ${s.professionName}`,
    description: s.legalConditionsDescription,
    relatedRecords: [],
    sourceReference: `${PSO_2027_SOURCE_META.journalCitation}, Część VI, str. 45`,
    verificationStatus: 'verified' as const,
  })),
  // Część VII
  ...PSO_PART_VII_TABLES.map((tbl) => ({
    id: tbl.id,
    sourcePart: 'VII' as const,
    sourceSubsection: tbl.subsectionCode,
    sourcePage: tbl.sourcePage,
    sourceTitle: PSO_2027_SOURCE_META.sourceTitle,
    populationScope: tbl.populationScope,
    vaccinationType: tbl.vaccinationType,
    title: `${tbl.subsectionCode}: ${tbl.title}`,
    description: tbl.rows.map((r) => `${r.vaccineAgainst}: ${r.cells.filter((c) => c.text).map((c) => c.text).join('; ')}`).join(' | '),
    relatedRecords: Array.from(new Set(tbl.rows.flatMap((r) => r.relatedRecords))),
    sourceReference: `${PSO_2027_SOURCE_META.journalCitation}, Część ${tbl.subsectionCode}, str. ${tbl.sourcePage}`,
    verificationStatus: tbl.verificationStatus,
    auditNote: tbl.structuralAuditNote,
  })),
];

const POLISH_CLINICAL_QUERY_ROOTS: Record<string, string[]> = {
  wścieklizna: ['wściekliź', 'wścieklizn'],
  tężec: ['tężc'],
  błonica: ['błonic'],
  krztusiec: ['krztuśc'],
  gruźlica: ['gruźlic'],
  półpasiec: ['półpaśc'],
  odra: ['odrze', 'odry'],
  różyczka: ['różyczc', 'różyczki'],
  świnka: ['świnc', 'śwince'],
  grypa: ['grypie', 'grypy', 'gryp'],
  cholera: ['choler'],
  dur: ['durz', 'duru'],
};

export function searchPso2027Records(options: {
  query?: string;
  part?: 'all' | 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI' | 'VII';
  populationScope?: string;
  vaccinationType?: string;
  verificationStatus?: string;
}): PsoStructuredRecord[] {
  const q = (options.query ?? '').trim().toLowerCase();
  const variants = q ? [q, ...(POLISH_CLINICAL_QUERY_ROOTS[q] ?? [])] : [];
  return PSO_2027_STRUCTURED_RECORDS.filter((rec) => {
    if (options.part && options.part !== 'all' && rec.sourcePart !== options.part) return false;
    if (options.populationScope && options.populationScope !== 'all' && rec.populationScope !== options.populationScope) {
      return false;
    }
    if (options.vaccinationType && options.vaccinationType !== 'all' && rec.vaccinationType !== options.vaccinationType) {
      return false;
    }
    if (
      options.verificationStatus &&
      options.verificationStatus !== 'all' &&
      rec.verificationStatus !== options.verificationStatus
    ) {
      return false;
    }
    if (!q) return true;
    const hay = [
      rec.sourcePart,
      rec.sourceSubsection,
      rec.title,
      rec.description,
      rec.schedule ?? '',
      rec.riskGroup ?? '',
      rec.sourceReference,
      rec.relatedRecords.join(' '),
      rec.auditNote ?? '',
    ]
      .join(' ')
      .toLowerCase();
    return variants.some((v) => hay.includes(v));
  });
}

export function getPso2027CompletenessSummary() {
  const counts = {
    totalSubsections: PSO_2027_COMPLETENESS_REGISTRY.length,
    verified: 0,
    partially_verified: 0,
    not_verified: 0,
    conflicting: 0,
    partsCovered: new Set<string>(),
  };
  for (const entry of PSO_2027_COMPLETENESS_REGISTRY) {
    counts[entry.verificationStatus] += 1;
    counts.partsCovered.add(entry.partNumber);
  }
  return {
    ...counts,
    partsCovered: Array.from(counts.partsCovered),
  };
}
