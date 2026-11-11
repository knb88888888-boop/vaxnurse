import type { ModuleDefinition, ModuleId } from '../types/navigation.ts';
import { APP_MODULES } from '../data/navigationData.ts';

export const RECENT_MODULES_STORAGE_KEY = 'vaxnurse_recent_modules_v1';
export const MAX_RECENT_MODULES = 12;

export interface RecentVisitRecord {
  moduleId: ModuleId;
  visitedAt: string; // Pełny timestamp ISO (np. 2026-11-11T21:45:00.000Z)
  visitCount: number;
}

export interface RecentStorageReader {
  getItem: (key: string) => string | null;
}

export interface RecentStorageWriter {
  setItem: (key: string, value: string) => void;
}

export interface RecentStorageLike
  extends RecentStorageReader,
    RecentStorageWriter {}

const VALID_MODULE_ID_SET = new Set<string>(
  APP_MODULES.filter((m: ModuleDefinition) => m.id !== 'dashboard').map(m => m.id)
);

const isValidIsoTimestamp = (val: unknown): val is string => {
  if (typeof val !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(val.trim())) {
    return false;
  }
  const time = Date.parse(val.trim());
  return Number.isFinite(time) && !Number.isNaN(time);
};

export const normalizeRecentVisits = (
  rawList: unknown,
  maxItems: number = MAX_RECENT_MODULES
): { visits: RecentVisitRecord[]; droppedCount: number } => {
  if (!Array.isArray(rawList)) {
    return { visits: [], droppedCount: 0 };
  }

  let droppedCount = 0;
  const byModule = new Map<ModuleId, RecentVisitRecord>();

  for (const item of rawList) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      droppedCount += 1;
      continue;
    }

    const obj = item as Record<string, unknown>;
    const moduleId = obj.moduleId;
    const visitedAt = obj.visitedAt;
    const rawCount = obj.visitCount;

    if (
      typeof moduleId !== 'string' ||
      !VALID_MODULE_ID_SET.has(moduleId) ||
      !isValidIsoTimestamp(visitedAt)
    ) {
      droppedCount += 1;
      continue;
    }

    const count =
      typeof rawCount === 'number' && Number.isInteger(rawCount) && rawCount >= 1
        ? rawCount
        : 1;

    const typedId = moduleId as ModuleId;
    const existing = byModule.get(typedId);
    if (!existing) {
      byModule.set(typedId, {
        moduleId: typedId,
        visitedAt: new Date(Date.parse(visitedAt)).toISOString(),
        visitCount: count
      });
    } else {
      const existingTime = Date.parse(existing.visitedAt);
      const currentTime = Date.parse(visitedAt);
      byModule.set(typedId, {
        moduleId: typedId,
        visitedAt:
          currentTime >= existingTime
            ? new Date(currentTime).toISOString()
            : existing.visitedAt,
        visitCount: existing.visitCount + count
      });
    }
  }

  const sorted = Array.from(byModule.values())
    .sort((a, b) => Date.parse(b.visitedAt) - Date.parse(a.visitedAt))
    .slice(0, maxItems);

  return { visits: sorted, droppedCount };
};

export const loadRecentModuleVisits = (
  storage?: RecentStorageReader | null
): { visits: RecentVisitRecord[]; error: string | null } => {
  const targetStorage =
    storage !== undefined
      ? storage
      : typeof localStorage !== 'undefined'
        ? localStorage
        : null;

  if (!targetStorage) {
    return { visits: [], error: null };
  }

  try {
    const raw = targetStorage.getItem(RECENT_MODULES_STORAGE_KEY);
    if (!raw) {
      return { visits: [], error: null };
    }

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return {
        visits: [],
        error: 'Nieprawidłowy format historii ostatnio używanych modułów w localStorage.'
      };
    }

    const { visits, droppedCount } = normalizeRecentVisits(parsed);
    return {
      visits,
      error:
        droppedCount > 0 && visits.length === 0
          ? 'Zapisana historia modułów zawierała wyłącznie nieprawidłowe wpisy.'
          : null
    };
  } catch {
    return {
      visits: [],
      error: 'Uszkodzony JSON historii ostatnio używanych modułów w localStorage.'
    };
  }
};

export const saveRecentModuleVisits = (
  storage: RecentStorageWriter | null | undefined,
  visits: RecentVisitRecord[]
): { success: boolean; error: string | null } => {
  if (!storage) {
    return { success: false, error: 'Pamięć localStorage jest niedostępna.' };
  }
  try {
    const { visits: clean } = normalizeRecentVisits(visits);
    storage.setItem(RECENT_MODULES_STORAGE_KEY, JSON.stringify(clean));
    return { success: true, error: null };
  } catch {
    return {
      success: false,
      error: 'Nie udało się zapisać historii ostatnio używanych modułów w localStorage.'
    };
  }
};

export const recordModuleVisit = (
  storage: RecentStorageWriter | null | undefined,
  currentVisits: RecentVisitRecord[],
  moduleId: ModuleId,
  now: Date = new Date()
): { visits: RecentVisitRecord[]; error: string | null } => {
  if (moduleId === 'dashboard' || !VALID_MODULE_ID_SET.has(moduleId)) {
    return { visits: currentVisits, error: null };
  }

  const isoNow = now.toISOString();
  const prevEntry = currentVisits.find(v => v.moduleId === moduleId);
  const nextCount = prevEntry ? prevEntry.visitCount + 1 : 1;

  const updatedList = [
    { moduleId, visitedAt: isoNow, visitCount: nextCount },
    ...currentVisits.filter(v => v.moduleId !== moduleId)
  ];

  const { visits: clean } = normalizeRecentVisits(updatedList);
  const saveRes = saveRecentModuleVisits(storage, clean);

  return {
    visits: clean,
    error: saveRes.error
  };
};

export const clearRecentModuleVisits = (
  storage?: { removeItem?: (key: string) => void; setItem?: (key: string, val: string) => void } | null
): RecentVisitRecord[] => {
  const target =
    storage !== undefined
      ? storage
      : typeof localStorage !== 'undefined'
        ? localStorage
        : null;

  if (target) {
    try {
      if (typeof target.removeItem === 'function') {
        target.removeItem(RECENT_MODULES_STORAGE_KEY);
      } else if (typeof target.setItem === 'function') {
        target.setItem(RECENT_MODULES_STORAGE_KEY, '[]');
      }
    } catch {
      // Ignoruj błąd czyszczenia, wyczyść stan UI
    }
  }
  return [];
};

export const formatRecentVisitTimestamp = (
  isoTimestamp: string,
  now: Date = new Date()
): string => {
  const parsedMs = Date.parse(isoTimestamp);
  if (Number.isNaN(parsedMs)) {
    return 'Nieznana data';
  }
  const visitDate = new Date(parsedMs);

  const timeFormatter = new Intl.DateTimeFormat('pl-PL', {
    hour: '2-digit',
    minute: '2-digit'
  });
  const timePart = timeFormatter.format(visitDate);

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfVisitDay = new Date(
    visitDate.getFullYear(),
    visitDate.getMonth(),
    visitDate.getDate()
  ).getTime();

  const dayDiff = Math.round((startOfToday - startOfVisitDay) / (24 * 60 * 60 * 1000));

  if (dayDiff === 0) {
    return `Dzisiaj, ${timePart}`;
  }
  if (dayDiff === 1) {
    return `Wczoraj, ${timePart}`;
  }

  const datePart = new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(visitDate);

  return `${datePart}, ${timePart}`;
};
