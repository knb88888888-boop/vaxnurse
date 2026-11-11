import type { VaccineProduct } from './vaccines';

export interface BackupMetadata {
  exportedAt: string;            // Data w formacie ISO (np. 2026-11-10T22:30:00.000Z)
  exportedAtFormatted: string;   // Sformatowana data po polsku (np. 10.11.2026 r., 22:30)
  schemaVersion: string;         // Wersja schematu danych (np. "1.0.0")
  appVersion: string;            // Wersja aplikacji VaxNurse (np. "1.0.0")
  catalogDataVersion?: string;   // Wersja katalogu bazowego (odrębna od schemaVersion)
  generator: string;             // Identyfikator generatora ("VaxNurse Local Backup System")
  containsPatientData: false;    // Jawne potwierdzenie braku danych pacjentów
  totalVaccines: number;         // Łączna liczba preparatów w katalogu
  totalDiscrepancies: number;    // Łączna liczba niezgodności ChPL
  totalClarifications: number;   // Łączna liczba zapisanych wyjaśnień
  totalHistoryEntries: number;   // Łączna liczba wpisów w lokalnej historii zmian
}

export interface VaxNurseBackupPayload {
  vaxnurseBackup: true;
  metadata: BackupMetadata;
  vaccines: VaccineProduct[];
}

export interface BackupSummary {
  exportedAtFormatted: string;
  schemaVersion: string;
  appVersion: string;
  catalogDataVersion?: string;
  totalVaccines: number;
  totalDiscrepancies: number;
  totalClarifications: number;
  totalHistoryEntries: number;
  vaccineNames: string[];
  productsToAdd: number;
  productsToUpdate: number;
  conflictCount: number;
  verifiedChplClaimsCount: number;
  claimsRequiringRecheckCount: number;
  invalidRecordsCount: number;
  invalidRecordDetails: string[];
}

export interface BackupValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
  payload?: VaxNurseBackupPayload;
  summary?: BackupSummary;
}
