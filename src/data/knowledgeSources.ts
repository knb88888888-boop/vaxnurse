import type { KnowledgeSource, CategoryDefinition } from '../types/knowledge';

export const KNOWLEDGE_CATEGORIES: CategoryDefinition[] = [
  {
    id: 'pso',
    label: 'Program Szczepień Ochronnych',
    shortLabel: 'PSO',
    description: 'Oficjalne komunikaty Głównego Inspektora Sanitarnego w sprawie Programu Szczepień Ochronnych.'
  },
  {
    id: 'chpl',
    label: 'Charakterystyki Produktów Leczniczych',
    shortLabel: 'ChPL',
    description: 'Rejestry państwowe i źródła urzędowe Charakterystyk Produktów Leczniczych (ChPL).'
  },
  {
    id: 'gis-gif',
    label: 'Wytyczne GIS i GIF',
    shortLabel: 'GIS / GIF',
    description: 'Wspólne zalecenia i wytyczne organów nadzoru sanitarnego i farmaceutycznego dla punktów szczepień.'
  },
  {
    id: 'law',
    label: 'Przepisy prawne',
    shortLabel: 'Prawo',
    description: 'Ustawy, rozporządzenia Ministra Zdrowia i akty normatywne regulujące szczepienia ochronne.'
  },
  {
    id: 'procedures',
    label: 'Procedury punktu szczepień',
    shortLabel: 'Procedury',
    description: 'Wystandaryzowane protokoły postępowania, procedury aseptyki i techniki zabiegowe.'
  }
];

export const KNOWLEDGE_SOURCES: KnowledgeSource[] = [
  {
    id: 'src-pso-2027',
    title: 'Program Szczepień Ochronnych na 2027 rok',
    publisher: 'Główny Inspektorat Sanitarny',
    category: 'pso',
    publicationDate: '28.10.2026',
    officialJournalDate: '30.10.2026',
    legalActNumber: 'Dz. Urz. Min. Zdrow. 2026 poz. 77',
    version: null,
    versionDate: null,
    officialUrl: 'https://dziennikmz.mz.gov.pl/DUM_MZ/2026/77/akt.pdf',
    infoUrl: 'https://www.gov.pl/web/gis/program-szczepien-ochronnych-na-2027-rok',
    lastVerifiedDate: '10.11.2026',
    description: 'Oficjalny komunikat Głównego Inspektora Sanitarnego z dnia 28 października 2026 r. w sprawie Programu Szczepień Ochronnych na rok 2027. Dokument opublikowany w Dzienniku Urzędowym Ministra Zdrowia, dotyczący roku 2027.',
    verificationStatus: 'Opublikowany akt prawny (GIS / MZ)',
    clinicalNote: null,
    targetYear: 2027
  },
  {
    id: 'src-wytyczne-gis-gif',
    title: 'Wytyczne i zalecenia GIS i GIF dla punktów szczepień',
    publisher: 'GIS i GIF',
    category: 'gis-gif',
    publicationDate: '17.09.2026',
    officialJournalDate: null,
    legalActNumber: null,
    version: '2.0',
    versionDate: '18.09.2026',
    officialUrl: 'https://www.gov.pl/web/gis/wytyczne-i-zalecenia-gis-i-gif-dla-punktow-szczepien',
    infoUrl: null,
    lastVerifiedDate: '10.11.2026',
    description: 'Zalecenia i wytyczne Głównego Inspektora Sanitarnego oraz Głównego Inspektora Farmaceutycznego określające zasady i warunki przechowywania, dystrybucji oraz organizacji bezpiecznej pracy punktów szczepień.',
    verificationStatus: 'Oficjalne wytyczne organów nadzoru',
    clinicalNote: null,
    targetYear: null
  },
  {
    id: 'src-rejestr-rpl-ezdrowie',
    title: 'Rejestr Produktów Leczniczych – publiczna wyszukiwarka',
    publisher: 'system rejestrów medycznych eZdrowie',
    category: 'chpl',
    publicationDate: null,
    officialJournalDate: null,
    legalActNumber: null,
    version: null,
    versionDate: null,
    officialUrl: 'https://rejestrymedyczne.ezdrowie.gov.pl/rpl/search/public',
    infoUrl: null,
    lastVerifiedDate: '10.11.2026',
    description: 'Publiczna wyszukiwarka państwowego Rejestru Produktów Leczniczych (RPL) prowadzonego w ramach systemów eZdrowie. Dostęp do aktualnych Charakterystyk Produktów Leczniczych (ChPL) i Ulotek dla Pacjenta dopuszczonych do obrotu.',
    verificationStatus: 'Państwowy rejestr publiczny (eZdrowie)',
    clinicalNote: 'Rejestr RPL jest głównym miejscem weryfikacji aktualnej charakterystyki produktu. Nie traktuj wykazu ChPL refundowanych URPL jako kompletnej bazy wszystkich szczepionek.',
    targetYear: null
  },
  {
    id: 'src-urpl-chpl-info',
    title: 'Informacje URPL dotyczące charakterystyk produktów leczniczych',
    publisher: 'URPL',
    category: 'chpl',
    publicationDate: null,
    officialJournalDate: null,
    legalActNumber: null,
    version: null,
    versionDate: null,
    officialUrl: 'https://leki.urpl.gov.pl/index.php',
    infoUrl: null,
    lastVerifiedDate: '10.11.2026',
    description: 'Urzędowy serwis informacyjny Urzędu Rejestracji Produktów Leczniczych, Wyrobów Medycznych i Produktów Biobójczych (URPL). Zasoby informacyjne o produktach leczniczych i ich charakterystykach.',
    verificationStatus: 'Urzędowy portal informacyjny (URPL)',
    clinicalNote: 'Rejestr RPL jest głównym miejscem weryfikacji aktualnej charakterystyki produktu. Nie traktuj wykazu ChPL refundowanych URPL jako kompletnej bazy wszystkich szczepionek.',
    targetYear: null
  },
  {
    id: 'src-zestaw-przeciwwstrzasowy-429',
    title: 'Rozporządzenie Ministra Zdrowia z dnia 24 marca 2026 r. zmieniające rozporządzenie w sprawie wykazu produktów leczniczych wchodzących w skład zestawów przeciwwstrząsowych',
    publisher: 'Minister Zdrowia',
    category: 'law',
    publicationDate: '24.03.2026',
    officialJournalDate: '30.03.2026',
    legalActNumber: 'Dz.U. 2026 poz. 429',
    version: null,
    versionDate: '14.04.2026',
    officialUrl: 'https://dziennikustaw.gov.pl/D2026000042901.pdf',
    infoUrl: 'https://eli.gov.pl/eli/DU/2026/429/ogl',
    lastVerifiedDate: '14.11.2026',
    description: 'Nowelizacja wykazu 26 pozycji produktów leczniczych i płynów infuzyjnych wchodzących w skład zestawu przeciwwstrząsowego ratującego życie dla 5 kategorii świadczeń.',
    verificationStatus: 'Dziennik Ustaw RP (akt ogłoszony)',
    clinicalNote: 'Dane katalogowe obejmują listę wymaganych substancji czynnych i postaci farmaceutycznych bez algorytmów leczenia ani dawek leków.',
    targetYear: null
  }
];
