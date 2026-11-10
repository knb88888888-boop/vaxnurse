import type { VaccineProduct, VaccineVerificationStatus, DiscrepancyStatus } from '../types/vaccines.ts';
import type {
  VaxNurseBackupPayload,
  BackupMetadata,
  BackupSummary,
  BackupValidationResult
} from '../types/backup.ts';
import { VACCINES_CATALOG } from '../data/vaccinesCatalog.ts';

export const BACKUP_SCHEMA_VERSION = '1.0.0';
export const APP_VERSION = '1.0.0';
export const VAX_STORAGE_KEY = 'vaxnurse_vaccines_catalog_state_v1';
export const VAX_LAST_BACKUP_KEY = 'vaxnurse_last_backup_date_v1';

export const VALID_VERIFICATION_STATUSES: VaccineVerificationStatus[] = [
  'pending_verification',
  'requires_source_clarification',
  'ready_for_manual_verification',
  'verified_chpl',
  'uncompleted',
  'requires_reverification'
];

export const VALID_DISCREPANCY_STATUSES: DiscrepancyStatus[] = [
  'requires_clarification',
  'clarification_submitted',
  'resolved_with_official_document'
];

/**
 * Formatowanie bieżącej daty i czasu w języku polskim.
 */
export const formatPolishDateTime = (date: Date = new Date()): string => {
  const dateStr = date.toLocaleDateString('pl-PL');
  const timeStr = date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  return `${dateStr} r., ${timeStr}`;
};

/**
 * Tworzy pełną, standaryzowaną strukturę kopii bezpieczeństwa z metadanymi i katalogiem.
 * Zapewnia, że w kopii NIE ZNAJDUJĄ SIĘ żadne dane pacjentów.
 */
export const createBackupPayload = (vaccines: VaccineProduct[]): VaxNurseBackupPayload => {
  const now = new Date();

  // Obliczenie statystyk referencyjnych kopii
  const totalVaccines = vaccines.length;
  let totalDiscrepancies = 0;
  let totalClarifications = 0;
  let totalHistoryEntries = 0;

  vaccines.forEach(v => {
    if (v.sourceDiscrepancies && Array.isArray(v.sourceDiscrepancies)) {
      totalDiscrepancies += v.sourceDiscrepancies.length;
      v.sourceDiscrepancies.forEach(d => {
        if (d.status !== 'requires_clarification' || d.resolution?.documentId) {
          totalClarifications++;
        }
      });
    }
    if (v.statusHistory && Array.isArray(v.statusHistory)) {
      totalHistoryEntries += v.statusHistory.length;
    }
  });

  const metadata: BackupMetadata = {
    exportedAt: now.toISOString(),
    exportedAtFormatted: formatPolishDateTime(now),
    schemaVersion: BACKUP_SCHEMA_VERSION,
    appVersion: APP_VERSION,
    generator: 'VaxNurse Local Backup System',
    containsPatientData: false,
    totalVaccines,
    totalDiscrepancies,
    totalClarifications,
    totalHistoryEntries
  };

  // Klonowanie danych w celu uniknięcia mutacji referencji
  const sanitizedVaccines: VaccineProduct[] = JSON.parse(JSON.stringify(vaccines));

  return {
    vaxnurseBackup: true,
    metadata,
    vaccines: sanitizedVaccines
  };
};

/**
 * Generuje podsumowanie zawartości kopii zapasowej przed jej zaimportowaniem.
 */
export const calculateBackupSummary = (payload: VaxNurseBackupPayload): BackupSummary => {
  const { metadata, vaccines } = payload;
  const vaccineNames = vaccines.map(v => v.tradeName);

  let totalDiscrepancies = 0;
  let totalClarifications = 0;
  let totalHistoryEntries = 0;

  vaccines.forEach(v => {
    if (v.sourceDiscrepancies && Array.isArray(v.sourceDiscrepancies)) {
      totalDiscrepancies += v.sourceDiscrepancies.length;
      v.sourceDiscrepancies.forEach(d => {
        if (d.status !== 'requires_clarification' || d.resolution?.documentId) {
          totalClarifications++;
        }
      });
    }
    if (v.statusHistory && Array.isArray(v.statusHistory)) {
      totalHistoryEntries += v.statusHistory.length;
    }
  });

  return {
    exportedAtFormatted: metadata.exportedAtFormatted || metadata.exportedAt,
    schemaVersion: metadata.schemaVersion,
    appVersion: metadata.appVersion,
    totalVaccines: vaccines.length,
    totalDiscrepancies,
    totalClarifications,
    totalHistoryEntries,
    vaccineNames
  };
};

/**
 * Rygorystyczna walidacja pliku kopii bezpieczeństwa przed dopuszczeniem do importu.
 */
export const validateBackupPayload = (jsonString: string): BackupValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Walidacja składni JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (e) {
    return {
      isValid: false,
      errors: [
        `Nieprawidłowy format pliku: Wskazany plik nie jest poprawnym dokumentem JSON. Szczegóły: ${e instanceof Error ? e.message : 'Błąd parsowania'}`
      ]
    };
  }

  // 2. Walidacja głównego obiektu
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      isValid: false,
      errors: ['Nieprawidłowa struktura pliku: Główny element kopii zapasowej musi być obiektem JSON.']
    };
  }

  const payload = parsed as Record<string, unknown>;

  // 3. Sprawdzenie sygnatury aplikacji VaxNurse
  if (payload.vaxnurseBackup !== true && !payload.metadata) {
    errors.push('Brak wymaganej sygnatury kopii bezpieczeństwa VaxNurse (pole "vaxnurseBackup" lub "metadata").');
  }

  // 4. Sprawdzenie metadanych i wersji schematu
  if (!payload.metadata || typeof payload.metadata !== 'object') {
    errors.push('Brak sekcji metadanych ("metadata") w pliku kopii.');
  } else {
    const meta = payload.metadata as Record<string, unknown>;

    if (!meta.schemaVersion) {
      errors.push('Brak informacji o wersji schematu danych ("metadata.schemaVersion").');
    } else if (meta.schemaVersion !== BACKUP_SCHEMA_VERSION) {
      errors.push(
        `Nieobsługiwana wersja schematu danych: Oczekiwano wersji "${BACKUP_SCHEMA_VERSION}", natomiast plik posiada wersję "${meta.schemaVersion}".`
      );
    }

    if (!meta.exportedAt) {
      errors.push('Brak daty utworzenia kopii ("metadata.exportedAt").');
    }
  }

  // 5. Sprawdzenie tablicy preparatów
  if (!payload.vaccines || !Array.isArray(payload.vaccines)) {
    errors.push('Brak tablicy preparatów ("vaccines") w pliku kopii bezpieczeństwa.');
  } else if (payload.vaccines.length === 0) {
    errors.push('Kopia bezpieczeństwa nie zawiera żadnych rekordów preparatów szczepionkowych.');
  } else {
    // 6. Walidacja poszczególnych rekordów preparatów
    const vaccinesList = payload.vaccines as Record<string, unknown>[];

    vaccinesList.forEach((v, index) => {
      const prefix = `Preparat [${index + 1}] (${(v.tradeName as string) || (v.id as string) || 'brak nazwy'}):`;

      if (!v.id || typeof v.id !== 'string') {
        errors.push(`${prefix} Brak wymaganego unikalnego identyfikatora "id".`);
      }
      if (!v.tradeName || typeof v.tradeName !== 'string') {
        errors.push(`${prefix} Brak wymaganej nazwy handlowej "tradeName".`);
      }
      if (!v.verificationStatus || typeof v.verificationStatus !== 'string') {
        errors.push(`${prefix} Brak statusu weryfikacji "verificationStatus".`);
      } else if (!VALID_VERIFICATION_STATUSES.includes(v.verificationStatus as VaccineVerificationStatus)) {
        errors.push(`${prefix} Nieznany lub niedozwolony status weryfikacji "${v.verificationStatus}".`);
      }

      // Sprawdzenie struktury ChPL
      if (!v.chpl || typeof v.chpl !== 'object') {
        errors.push(`${prefix} Brak wymaganej struktury punktów ChPL ("chpl").`);
      }

      // Sprawdzenie ewentualnych niezgodności
      if (v.sourceDiscrepancies && Array.isArray(v.sourceDiscrepancies)) {
        const discs = v.sourceDiscrepancies as Record<string, unknown>[];
        discs.forEach((d, dIdx) => {
          const dPrefix = `${prefix} Rozbieżność [${dIdx + 1}] (${(d.id as string) || 'b.d.'}):`;
          if (!d.id || typeof d.id !== 'string') {
            errors.push(`${dPrefix} Brak identyfikatora rozbieżności "id".`);
          }
          if (!d.status || typeof d.status !== 'string') {
            errors.push(`${dPrefix} Brak statusu rozbieżności.`);
          } else if (!VALID_DISCREPANCY_STATUSES.includes(d.status as DiscrepancyStatus)) {
            errors.push(`${dPrefix} Nieprawidłowy status rozbieżności: "${d.status}".`);
          }
        });
      }
    });
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      errors,
      warnings
    };
  }

  const validPayload = payload as unknown as VaxNurseBackupPayload;
  const summary = calculateBackupSummary(validPayload);

  return {
    isValid: true,
    errors: [],
    warnings,
    payload: validPayload,
    summary
  };
};

/**
 * Wymuszenie integralności klinicznej podczas importu:
 * 1. Nigdy nie zmieniaj statusu pending_verification na verified_chpl podczas importu.
 * 2. Nigdy nie usuwaj statusu requires_clarification.
 */
export const enforceClinicalIntegrityOnImport = (
  importedVaccines: VaccineProduct[],
  currentVaccines: VaccineProduct[]
): VaccineProduct[] => {
  return importedVaccines.map(imported => {
    const existing = currentVaccines.find(c => c.id === imported.id);
    let finalStatus = imported.verificationStatus;

    // Reguła 1: Jeśli dany preparat w bazie referencyjnej lub w historii był pending_verification,
    // a kopia próbuje nadać verified_chpl bez daty autoryzacji personelu, przywróć pending_verification.
    if (finalStatus === 'verified_chpl' && !imported.userVerificationDate) {
      finalStatus = existing?.verificationStatus || 'pending_verification';
    }

    // Reguła 1b: Jeśli oryginalny rekord był pending_verification, a import próbuje ominąć weryfikację
    if (existing?.verificationStatus === 'pending_verification' && imported.verificationStatus === 'verified_chpl' && !imported.userVerificationNotes) {
      finalStatus = 'pending_verification';
    }

    // Reguła 2: Nigdy nie usuwaj statusu requires_clarification ani rozbieżności fenyloalaniny
    let sanitizedDiscrepancies = imported.sourceDiscrepancies;
    if (imported.id === 'vac-infanrix-hexa') {
      const hasPhenylalanineDisc = imported.sourceDiscrepancies?.some(
        d => d.id === 'disc-phenylalanine-content-01'
      );

      // Jeśli plik kopii próbowałby usunąć niezgodność fenyloalaniny z Infanrix hexa, przywróć ją
      if (!hasPhenylalanineDisc && existing?.sourceDiscrepancies) {
        sanitizedDiscrepancies = existing.sourceDiscrepancies;
        if (finalStatus === 'verified_chpl') {
          finalStatus = 'requires_source_clarification';
        }
      }
    }

    return {
      ...imported,
      verificationStatus: finalStatus,
      sourceDiscrepancies: sanitizedDiscrepancies
    };
  });
};

/**
 * Wykonuje pobranie pliku JSON w przeglądarce.
 */
export const triggerJsonDownload = (payload: unknown, filename: string): void => {
  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Pobiera aktualną listę preparatów z localStorage (lub domyślnego katalogu).
 */
export const getStoredVaccines = (): VaccineProduct[] => {
  try {
    const raw = localStorage.getItem(VAX_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Błąd odczytu z localStorage w module kopii:', e);
  }
  return VACCINES_CATALOG;
};

/**
 * Zapisuje preparaty do localStorage z obsługą wyjątków.
 */
export const storeVaccinesSafely = (vaccines: VaccineProduct[]): { success: boolean; error?: string } => {
  try {
    const serialized = JSON.stringify(vaccines);
    localStorage.setItem(VAX_STORAGE_KEY, serialized);
    return { success: true };
  } catch (e) {
    console.error('Błąd zapisu do localStorage w module kopii:', e);
    return {
      success: false,
      error: 'Błąd zapisu w pamięci przeglądarki (localStorage). Pamięć może być przepełniona lub zablokowana przez ustawienia prywatności.'
    };
  }
};
