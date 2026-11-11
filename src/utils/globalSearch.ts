import type { ModuleId } from '../types/navigation.ts';
import { APP_MODULES, QUICK_ACCESS_ITEMS } from '../data/navigationData.ts';
import { KNOWLEDGE_SOURCES } from '../data/knowledgeSources.ts';

export const PLACEHOLDER_MODULE_IDS = new Set<ModuleId>([
  'adult-vaccinations',
  'vaccination-calendar',
  'vaccination-calculator',
  'procedures-checklists',
  'cold-chain',
  'special-situations'
]);

export const isModulePlaceholder = (id: ModuleId): boolean =>
  PLACEHOLDER_MODULE_IDS.has(id);

export interface GlobalSearchResult {
  id: string;
  title: string;
  subtitle: string;
  kind: 'module' | 'quick-access' | 'knowledge';
  targetModule: ModuleId;
  isPlaceholder: boolean;
  categoryLabel: string;
  knowledgePrefillQuery?: string;
}

const getCategoryPolishLabel = (category: string): string => {
  switch (category) {
    case 'main':
      return 'Nawigacja główna';
    case 'clinical':
      return 'Moduł kliniczny';
    case 'logistics':
      return 'Organizacja i bezpieczeństwo';
    case 'system':
      return 'Moduł systemowy';
    default:
      return 'Sekcja VaxNurse';
  }
};

/**
 * Globalna wyszukiwarka nagłówka: „Szukaj modułów i sekcji VaxNurse”.
 * Zakres: moduły aplikacji, opisy modułów, szybkie skróty nawigacyjne oraz pozycje Biblioteki Wiedzy.
 * Nie przeszukuje indywidualnych danych pacjentów ani nie generuje wyników klinicznych.
 */
export const searchVaxNurseNavigation = (query: string): GlobalSearchResult[] => {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const q = trimmed.toLowerCase();
  const results: GlobalSearchResult[] = [];
  const seenKeys = new Set<string>();

  // 1. Moduły aplikacji
  for (const mod of APP_MODULES) {
    const haystack = [
      mod.label,
      mod.description,
      mod.purposeNote,
      mod.badge || '',
      getCategoryPolishLabel(mod.category),
      ...mod.keyFeatures
    ]
      .join(' ')
      .toLowerCase();

    if (haystack.includes(q)) {
      const placeholder = isModulePlaceholder(mod.id);
      const key = `module:${mod.id}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        results.push({
          id: key,
          title: mod.label,
          subtitle: mod.description,
          kind: 'module',
          targetModule: mod.id,
          isPlaceholder: placeholder,
          categoryLabel: placeholder
            ? `${getCategoryPolishLabel(mod.category)} • W przygotowaniu`
            : getCategoryPolishLabel(mod.category)
        });
      }
    }
  }

  // 2. Szybkie skróty nawigacyjne z Pulpitu
  for (const qa of QUICK_ACCESS_ITEMS) {
    const haystack = `${qa.title} ${qa.subtitle}`.toLowerCase();
    if (haystack.includes(q)) {
      const placeholder = isModulePlaceholder(qa.targetModule);
      const key = `qa:${qa.id}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        results.push({
          id: key,
          title: qa.title,
          subtitle: qa.subtitle,
          kind: 'quick-access',
          targetModule: qa.targetModule,
          isPlaceholder: placeholder,
          categoryLabel: placeholder
            ? 'Skrót nawigacyjny • Moduł w przygotowaniu'
            : 'Skrót nawigacyjny'
        });
      }
    }
  }

  // 3. Oficjalne pozycje Biblioteki Wiedzy
  for (const src of KNOWLEDGE_SOURCES) {
    const haystack = [
      src.title,
      src.publisher,
      src.category === 'pso' ? 'PSO Program Szczepień Ochronnych' : src.category,
      src.legalActNumber || '',
      src.version || '',
      src.description
    ]
      .join(' ')
      .toLowerCase();

    if (haystack.includes(q)) {
      const key = `kb:${src.id}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        results.push({
          id: key,
          title: src.title,
          subtitle: `${src.publisher}${src.legalActNumber ? ` • ${src.legalActNumber}` : ''}`,
          kind: 'knowledge',
          targetModule: 'knowledge-base',
          isPlaceholder: false,
          categoryLabel: 'Biblioteka wiedzy',
          knowledgePrefillQuery: src.title
        });
      }
    }
  }

  return results.slice(0, 12);
};
