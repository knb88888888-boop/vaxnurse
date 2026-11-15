import type { ModuleId } from '../types/navigation.ts';
import { APP_MODULES, QUICK_ACCESS_ITEMS } from '../data/navigationData.ts';
import { KNOWLEDGE_SOURCES } from '../data/knowledgeSources.ts';

export const PLACEHOLDER_MODULE_IDS = new Set<ModuleId>();

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
  const candidates: Array<{
    result: GlobalSearchResult;
    score: number;
    kindPriority: number;
    order: number;
  }> = [];
  const seenKeys = new Set<string>();
  let orderCounter = 0;

  const computeMatchScore = (
    title: string,
    subtitle: string,
    extraHaystack: string
  ): number | null => {
    const titleLower = title.toLowerCase();
    const subtitleLower = subtitle.toLowerCase();
    const fullHaystack = `${titleLower} ${subtitleLower} ${extraHaystack.toLowerCase()}`;

    if (!fullHaystack.includes(q)) {
      return null;
    }

    let score = 0;
    if (titleLower === q) {
      score += 120;
    } else if (titleLower.startsWith(q)) {
      score += 80;
    } else if (titleLower.includes(q)) {
      score += 50;
    }

    if (subtitleLower.includes(q)) {
      score += 25;
    } else if (extraHaystack.toLowerCase().includes(q)) {
      score += 10;
    }

    return score;
  };

  // 1. Moduły aplikacji
  for (const mod of APP_MODULES) {
    const subtitle = mod.description;
    const extra = [
      mod.purposeNote,
      mod.badge || '',
      getCategoryPolishLabel(mod.category),
      ...mod.keyFeatures
    ].join(' ');

    const score = computeMatchScore(mod.label, subtitle, extra);
    if (score !== null) {
      const placeholder = isModulePlaceholder(mod.id);
      const key = `module:${mod.id}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        candidates.push({
          result: {
            id: key,
            title: mod.label,
            subtitle: mod.description,
            kind: 'module',
            targetModule: mod.id,
            isPlaceholder: placeholder,
            categoryLabel: placeholder
              ? `${getCategoryPolishLabel(mod.category)} • W przygotowaniu`
              : getCategoryPolishLabel(mod.category)
          },
          score,
          kindPriority: 3,
          order: orderCounter++
        });
      }
    }
  }

  // 2. Szybkie skróty nawigacyjne z Pulpitu
  for (const qa of QUICK_ACCESS_ITEMS) {
    const score = computeMatchScore(qa.title, qa.subtitle, '');
    if (score !== null) {
      const placeholder = isModulePlaceholder(qa.targetModule);
      const key = `qa:${qa.id}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        candidates.push({
          result: {
            id: key,
            title: qa.title,
            subtitle: qa.subtitle,
            kind: 'quick-access',
            targetModule: qa.targetModule,
            isPlaceholder: placeholder,
            categoryLabel: placeholder
              ? 'Skrót nawigacyjny • Moduł w przygotowaniu'
              : 'Skrót nawigacyjny'
          },
          score,
          kindPriority: 2,
          order: orderCounter++
        });
      }
    }
  }

  // 3. Oficjalne pozycje Biblioteki Wiedzy
  for (const src of KNOWLEDGE_SOURCES) {
    const subtitle = `${src.publisher}${src.legalActNumber ? ` • ${src.legalActNumber}` : ''}`;
    const extra = [
      src.category === 'pso' ? 'PSO Program Szczepień Ochronnych' : src.category,
      src.legalActNumber || '',
      src.version || '',
      src.description
    ].join(' ');

    const score = computeMatchScore(src.title, subtitle, extra);
    if (score !== null) {
      const key = `kb:${src.id}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        candidates.push({
          result: {
            id: key,
            title: src.title,
            subtitle,
            kind: 'knowledge',
            targetModule: 'knowledge-base',
            isPlaceholder: false,
            categoryLabel: 'Biblioteka wiedzy',
            knowledgePrefillQuery: src.title
          },
          score,
          kindPriority: 2,
          order: orderCounter++
        });
      }
    }
  }

  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.kindPriority !== a.kindPriority) return b.kindPriority - a.kindPriority;
    return a.order - b.order;
  });

  const sliced = candidates.slice(0, 12).map(item => item.result);
  const topKnowledge = candidates.find(item => item.result.kind === 'knowledge');
  if (topKnowledge && !sliced.some(item => item.kind === 'knowledge') && sliced.length === 12) {
    return [...sliced.slice(0, 11), topKnowledge.result];
  }

  return sliced;
};
