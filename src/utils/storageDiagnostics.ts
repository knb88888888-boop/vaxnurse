import { COLD_CHAIN_STORAGE_KEY, EMERGENCY_KIT_STORAGE_KEY, LOCAL_CHECKLIST_STORAGE_KEY } from './operationalTools';
import { PREFERENCES_STORAGE_KEY } from './preferences';
import { THEME_STORAGE_KEY } from './theme';
import { RECENT_MODULES_STORAGE_KEY } from './recentModules';
import { VAX_LAST_BACKUP_KEY } from './backup';
import { STATION_CONFIG_STORAGE_KEY } from './stationPreferences';

export interface StorageModuleMetric {
  key: string;
  name: string;
  itemCount: number;
  sizeBytes: number;
  status: 'ok' | 'empty' | 'corrupted';
}

export interface StorageDiagnosticsReport {
  totalBytes: number;
  totalKb: number;
  estimatedQuotaBytes: number;
  quotaPercentage: number;
  modules: StorageModuleMetric[];
  isHealthy: boolean;
  issuesCount: number;
  timestamp: string;
}

const STORAGE_KEYS_REGISTRY: { key: string; name: string }[] = [
  { key: 'vaxnurse_vaccines_catalog', name: 'Baza preparatów i statusy ChPL' },
  { key: COLD_CHAIN_STORAGE_KEY, name: 'Rejestr temperatur łańcucha chłodniczego' },
  { key: EMERGENCY_KIT_STORAGE_KEY, name: 'Inwentarz zestawu przeciwwstrząsowego (Dz.U. 2026)' },
  { key: LOCAL_CHECKLIST_STORAGE_KEY, name: 'Checklisty procedur punktu szczepień' },
  { key: RECENT_MODULES_STORAGE_KEY, name: 'Historia ostatnio otwieranych modułów' },
  { key: PREFERENCES_STORAGE_KEY, name: 'Preferencje widoku i ergonomii' },
  { key: THEME_STORAGE_KEY, name: 'Szata graficzna (motyw kolorystyczny)' },
  { key: STATION_CONFIG_STORAGE_KEY, name: 'Konfiguracja stanowiska i placówki' },
  { key: VAX_LAST_BACKUP_KEY, name: 'Data ostatniej kopii bezpieczeństwa' }
];

export const inspectStorageDiagnostics = (): StorageDiagnosticsReport => {
  if (typeof localStorage === 'undefined') {
    return {
      totalBytes: 0,
      totalKb: 0,
      estimatedQuotaBytes: 5 * 1024 * 1024,
      quotaPercentage: 0,
      modules: [],
      isHealthy: true,
      issuesCount: 0,
      timestamp: new Date().toISOString()
    };
  }

  let totalBytes = 0;
  const modules: StorageModuleMetric[] = [];
  let issuesCount = 0;

  for (const item of STORAGE_KEYS_REGISTRY) {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(item.key);
    } catch {
      issuesCount++;
    }

    if (raw === null) {
      modules.push({
        key: item.key,
        name: item.name,
        itemCount: 0,
        sizeBytes: 0,
        status: 'empty'
      });
      continue;
    }

    const sizeBytes = new Blob([raw]).size;
    totalBytes += sizeBytes;

    let itemCount = 1;
    let status: 'ok' | 'corrupted' = 'ok';

    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        itemCount = parsed.length;
      } else if (typeof parsed === 'object' && parsed !== null) {
        itemCount = Object.keys(parsed).length;
      }
    } catch {
      // Jeśli to zwykły string (jak data ostatniej kopii lub klucz motywu), to nie jest błąd JSON
      if (item.key !== VAX_LAST_BACKUP_KEY && item.key !== THEME_STORAGE_KEY) {
        status = 'corrupted';
        issuesCount++;
      }
    }

    modules.push({
      key: item.key,
      name: item.name,
      itemCount,
      sizeBytes,
      status
    });
  }

  const estimatedQuotaBytes = 5 * 1024 * 1024; // 5 MB standard localStorage
  const totalKb = Math.round((totalBytes / 1024) * 10) / 10;
  const quotaPercentage = Math.round((totalBytes / estimatedQuotaBytes) * 1000) / 10;

  return {
    totalBytes,
    totalKb,
    estimatedQuotaBytes,
    quotaPercentage,
    modules,
    isHealthy: issuesCount === 0,
    issuesCount,
    timestamp: new Date().toISOString()
  };
};

export const clearSpecificStorageCategory = (key: string): boolean => {
  if (typeof localStorage === 'undefined') return false;
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
};
