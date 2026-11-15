import {
  LayoutDashboard,
  Baby,
  Users,
  Syringe,
  CalendarDays,
  Calculator,
  ClipboardCheck,
  ThermometerSnowflake,
  AlertTriangle,
  BookOpen,
  HeartHandshake,
  Settings,
  ShieldCheck
} from 'lucide-react';
import type { ModuleDefinition, QuickAccessItem } from '../types/navigation';

export const APP_MODULES: ModuleDefinition[] = [
  {
    id: 'dashboard',
    label: 'Pulpit',
    description: 'Centrum operacyjne punktu szczepień z szybkim dostępem do kluczowych narzędzi.',
    category: 'main',
    icon: LayoutDashboard,
    isCore: true,
    purposeNote: 'Główny widok podsumowujący status stanowiska i ułatwiający szybką nawigację.',
    keyFeatures: [
      'Szybkie skróty do bieżących procedur',
      'Wyszukiwanie narzędzi i wytycznych',
      'Historia ostatnio używanych modułów'
    ]
  },
  {
    id: 'child-vaccinations',
    label: 'Szczepienia dzieci',
    description: 'Narzędzia wspomagające organizację szczepień obowiązkowych i zalecanych dla dzieci.',
    category: 'clinical',
    icon: Baby,
    isCore: true,
    purposeNote: 'Wsparcie organizacyjne wizyt szczepiennych pacjentów pediatrycznych.',
    keyFeatures: [
      'Weryfikacja etapów wiekowych wg oficjalnego PSO',
      'Karty informacyjne dla rodziców i opiekunów',
      'Listy kontrolne przed podaniem preparatu'
    ]
  },
  {
    id: 'adult-vaccinations',
    label: 'Szczepienia dorosłych',
    description: 'Profilaktyka dorosłych, szczepienia zawodowe, senioralne oraz podróżnych.',
    category: 'clinical',
    icon: Users,
    isCore: true,
    purposeNote: 'Organizacja i wsparcie techniczne szczepień osób dorosłych i grup ryzyka.',
    keyFeatures: [
      'Szczepienia pracownicze i medyczne',
      'Grupy podwyższonego ryzyka i seniorzy',
      'Procedury profilaktyki sezonowej'
    ]
  },
  {
    id: 'vaccines-database',
    label: 'Baza preparatów',
    description: 'Katalog produktów leczniczych dla dzieci i dorosłych: Karta ChPL (punkty 1–10 EMA QRD v10.4) oraz integracja z RPL.',
    category: 'clinical',
    icon: Syringe,
    isCore: true,
    badge: 'Karta ChPL',
    purposeNote: 'Referencyjny katalog preparatów ze strukturą punktów 1–10 ChPL wg szablonu EMA QRD v10.4 i powiązaniem z rejestrem RPL.',
    keyFeatures: [
      'Oficjalna Karta ChPL (punkty 1–10 szablonu EMA QRD v10.4)',
      'Filtrowanie według rodzaju, grupy wiekowej i statusu weryfikacji',
      'Bezpośrednie odsyłacze do oficjalnych rekordów RPL i URPL'
    ]
  },
  {
    id: 'vaccination-calendar',
    label: 'Kalendarz szczepień',
    description: 'Aktualny Program Szczepień Ochronnych (PSO 2027) z podziałem na grupy wiekowe.',
    category: 'clinical',
    icon: CalendarDays,
    isCore: true,
    badge: 'PSO 2027',
    purposeNote: 'Oficjalna struktura Programu Szczepień Ochronnych i terminy referencyjne.',
    keyFeatures: [
      'Oficjalny Program Szczepień Ochronnych (PSO 2027) – komunikat GIS',
      'Odstępy minimalne i maksymalne między dawkami',
      'Zestawienie zmian w komunikacie GIS na 2027 rok'
    ]
  },
  {
    id: 'vaccination-calculator',
    label: 'Kalkulator szczepień',
    description: 'Pomocnik arytmetyki dat kalendarzowych w jednostkach dni, miesięcy i lat (bez reguł klinicznych).',
    category: 'clinical',
    icon: Calculator,
    purposeNote: 'Arytmetyka kalendarzowa terminów i wieku wymagająca weryfikacji z aktualną ChPL oraz PSO.',
    keyFeatures: [
      'Obliczanie daty od podanej ostatniej dawki (dni, miesiące, lata)',
      'Weryfikacja dat kalendarzowych w jednostkach dni, miesięcy i lat',
      'Obliczanie wieku pacjenta oraz odstępu względem wybranej daty'
    ]
  },
  {
    id: 'procedures-checklists',
    label: 'Procedury i checklisty',
    description: 'Standardy bezpiecznego podania szczepionki, procedury aseptyki i techniki iniekcji.',
    category: 'logistics',
    icon: ClipboardCheck,
    purposeNote: 'Wystandaryzowane protokoły postępowania w gabinecie zabiegowym.',
    keyFeatures: [
      'Checklista kwalifikacji pielęgniarskiej do iniekcji',
      'Zasady doboru miejsc iniekcji (ramię, udo) i kąta igły',
      'Postępowanie z odpadami medycznymi i ostrymi'
    ]
  },
  {
    id: 'cold-chain',
    label: 'Łańcuch chłodniczy',
    description: 'Protokoły kontroli chłodziarek (zakres referencyjny: +2°C do +8°C, odczyt manualny) i postępowania awaryjnego.',
    category: 'logistics',
    icon: ThermometerSnowflake,
    isCore: true,
    badge: '2–8°C (ref.)',
    purposeNote: 'Rejestr procedur nadzoru nad stabilnością termiczną i sprzętem chłodniczym (odczyt manualny).',
    keyFeatures: [
      'Karty pomiaru temperatury w zakresie referencyjnym (+2°C do +8°C)',
      'Brak automatycznego połączenia z rejestratorem – odczyt manualny',
      'Procedura awarii zasilania lub przekroczenia zakresu'
    ]
  },
  {
    id: 'special-situations',
    label: 'Sytuacje szczególne',
    description: 'Kontrola gotowości zestawu przeciwwstrząsowego (Dz.U. 2026 poz. 429) i odnośniki do źródeł oficjalnych.',
    category: 'logistics',
    icon: AlertTriangle,
    badge: 'Bezpieczeństwo',
    purposeNote: 'Kontrola wyposażenia i ważności pozycji zestawu oraz dostęp do oficjalnych źródeł (bez algorytmów leczenia).',
    keyFeatures: [
      'Wykaz 26 pozycji zestawu wg Rozporządzenia MZ (Dz.U. 2026 poz. 429)',
      'Lokalna kontrola ilości i terminów ważności pozycji zestawu',
      'Bezpośrednie odnośniki do źródeł GIS/GIF, PSO oraz aktów prawnych'
    ]
  },
  {
    id: 'knowledge-base',
    label: 'Baza wiedzy',
    description: 'Centralna biblioteka oficjalnych źródeł: Program Szczepień Ochronnych, wytyczne GIS i GIF oraz rejestry ChPL.',
    category: 'system',
    icon: BookOpen,
    badge: 'Biblioteka',
    purposeNote: 'Referencyjny zbiór oficjalnych publikatorów państwowych (GIS, GIF, URPL, eZdrowie).',
    keyFeatures: [
      'Wyszukiwarka oficjalnych dokumentów i komunikatów',
      'Filtrowanie według kategorii i instytucji publikującej',
      'Bezpośrednie odnośniki do portali państwowych i rejestru RPL'
    ]
  },
  {
    id: 'about-project',
    label: 'O projekcie',
    description:
      'Misja VaxNurse, historia powstania, inicjator P.M. oraz inspiracja M.M., wartości, architektura i zasady bezpłatnej dostępności bez reklam.',
    category: 'system',
    icon: HeartHandshake,
    purposeNote:
      'Autorska prezentacja projektu stworzonego z szacunku do codziennej pracy pielęgniarek i pielęgniarzy oraz przejrzysty opis działania lokalnego.',
    keyFeatures: [
      'O projekcie i autorach: P.M. (inicjator) oraz M.M. (inspiracja pielęgniarska)',
      'Zawsze bezpłatnie. Bez reklam. — przejrzyste zasady dostępności',
      'Architektura modułów VaxNurse, wartości oraz zasady prywatności i trybu lokalnego'
    ]
  },
  {
    id: 'settings',
    label: 'Ustawienia',
    description: 'Konfiguracja stanowiska pracy, preferencje widoku i informacje o aplikacji.',
    category: 'system',
    icon: Settings,
    purposeNote: 'Lokalne parametry ergonomii, tryb wyświetlania oraz status bezpieczeństwa danych.',
    keyFeatures: [
      'Dostosowanie kontrastu i wielkości elementów',
      'Zasady prywatności (lokalna praca bez zapisu danych osobowych)',
      'Wersja systemu i status gotowości operacyjnej'
    ]
  }
];

export const QUICK_ACCESS_ITEMS: QuickAccessItem[] = [
  {
    id: 'qa-cold-chain',
    title: 'Kontrola chłodnicza',
    subtitle: 'Zakres ref. +2°C do +8°C',
    targetModule: 'cold-chain',
    icon: ThermometerSnowflake,
    badgeColor: 'blue'
  },
  {
    id: 'qa-calendar',
    title: 'Kalendarz PSO',
    subtitle: 'Program na 2027 rok',
    targetModule: 'vaccination-calendar',
    icon: CalendarDays,
    badgeColor: 'indigo'
  },
  {
    id: 'qa-calculator',
    title: 'Kalkulator terminów',
    subtitle: 'Odstępy między dawkami',
    targetModule: 'vaccination-calculator',
    icon: Calculator,
    badgeColor: 'emerald'
  },
  {
    id: 'qa-emergency',
    title: 'Zestaw przeciwwstrząsowy',
    subtitle: 'Wykaz 26 poz. (Dz.U. 2026 poz. 429)',
    targetModule: 'special-situations',
    icon: ShieldCheck,
    badgeColor: 'amber'
  }
];
