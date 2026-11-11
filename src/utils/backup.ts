import type {
  ChPLStructure,
  DiscrepancyStatus,
  ImportedVerificationClaim,
  SourceDiscrepancy,
  StatusHistoryEntry,
  VaccineProduct,
  VaccineVerificationStatus
} from '../types/vaccines.ts';
import type {
  BackupMetadata,
  BackupSummary,
  BackupValidationResult,
  VaxNurseBackupPayload
} from '../types/backup.ts';
import { VACCINES_CATALOG } from '../data/vaccinesCatalog.ts';
import {
  ALLOWED_VERIFICATION_STATUSES,
  CATALOG_DATA_VERSION,
  STATUS_PRIORITY_ORDER,
  findDuplicateVaccineIds,
  hasPrototypePollutionKey,
  inspectChplCompleteness,
  isPlainRecord,
  isValidDateString,
  isValidHttpUrl,
  isValidHttpUrlOrNull,
  mergeVaccineCatalogWithStorage
} from './catalogMerge.ts';
import {
  LOCAL_UNAUTHENTICATED_AUTHOR,
  createHistoryEntryId,
  loadVaccinesFromStorage,
  saveVaccinesToStorage,
  validateClarificationForm
} from './vaccineVerification.ts';

export const BACKUP_SCHEMA_VERSION = '1.0.0';
export const APP_VERSION = '1.0.0';
export const VAX_STORAGE_KEY = 'vaxnurse_vaccines_catalog_state_v1';
export const VAX_LAST_BACKUP_KEY = 'vaxnurse_last_backup_date_v1';

export const VALID_VERIFICATION_STATUSES: VaccineVerificationStatus[] = [
  ...ALLOWED_VERIFICATION_STATUSES
];

export const VALID_DISCREPANCY_STATUSES: DiscrepancyStatus[] = [
  'requires_clarification',
  'clarification_submitted',
  'resolved_with_official_document'
];

const KNOWN_BACKUP_ROOT_KEYS = new Set([
  'vaxnurseBackup',
  'metadata',
  'vaccines'
]);

const KNOWN_METADATA_KEYS = new Set([
  'exportedAt',
  'exportedAtFormatted',
  'schemaVersion',
  'appVersion',
  'catalogDataVersion',
  'generator',
  'containsPatientData',
  'totalVaccines',
  'totalDiscrepancies',
  'totalClarifications',
  'totalHistoryEntries'
]);

const KNOWN_VACCINE_KEYS = new Set([
  'id',
  'tradeName',
  'activeSubstance',
  'manufacturer',
  'pharmaceuticalForm',
  'vaccineType',
  'targetGroup',
  'marketingAuthorizationNumber',
  'rplRecordUrl',
  'currentChplUrl',
  'chplRevisionDate',
  'chplVersionDate',
  'documentDownloadDate',
  'userVerificationDate',
  'userVerificationNotes',
  'verificationStatus',
  'atcCode',
  'sourceDiscrepancies',
  'clarificationDocument',
  'clarificationDate',
  'clarificationSource',
  'statusHistory',
  'catalogDataVersion',
  'importedVerificationClaim',
  'mergeConflict',
  'chpl'
]);

/**
 * Formatowanie bieżącej daty i czasu w języku polskim.
 */
export const formatPolishDateTime = (date: Date = new Date()): string => {
  const dateStr = date.toLocaleDateString('pl-PL');
  const timeStr = date.toLocaleTimeString('pl-PL', {
    hour: '2-digit',
    minute: '2-digit'
  });
  return `${dateStr} r., ${timeStr}`;
};

/**
 * Tworzy pełny i bezpieczny obiekt kopii zapasowej (eksport JSON).
 */
export const createBackupPayload = (
  vaccines: VaccineProduct[],
  now: Date = new Date()
): VaxNurseBackupPayload => {
  const clonedVaccines: VaccineProduct[] = JSON.parse(JSON.stringify(vaccines));

  let totalDiscrepancies = 0;
  let totalClarifications = 0;
  let totalHistoryEntries = 0;

  for (const v of clonedVaccines) {
    if (v.sourceDiscrepancies && v.sourceDiscrepancies.length > 0) {
      totalDiscrepancies += v.sourceDiscrepancies.length;
      totalClarifications += v.sourceDiscrepancies.filter(
        d =>
          d.status === 'clarification_submitted' ||
          d.status === 'resolved_with_official_document' ||
          Boolean(d.resolution?.documentId)
      ).length;
    }
    if (v.statusHistory && v.statusHistory.length > 0) {
      totalHistoryEntries += v.statusHistory.length;
    }
  }

  const metadata: BackupMetadata = {
    exportedAt: now.toISOString(),
    exportedAtFormatted: formatPolishDateTime(now),
    schemaVersion: BACKUP_SCHEMA_VERSION,
    appVersion: APP_VERSION,
    catalogDataVersion: CATALOG_DATA_VERSION,
    generator: 'VaxNurse Local Backup System',
    containsPatientData: false,
    totalVaccines: clonedVaccines.length,
    totalDiscrepancies,
    totalClarifications,
    totalHistoryEntries
  };

  return {
    vaxnurseBackup: true,
    metadata,
    vaccines: clonedVaccines
  };
};

interface DiscrepancyAuditCheck {
  allResolved: boolean;
  sanitizedDiscrepancies: SourceDiscrepancy[] | undefined;
}

const sanitizeAndVerifyDiscrepancies = (
  imported: VaccineProduct,
  baseline: VaccineProduct | undefined
): DiscrepancyAuditCheck => {
  const mergedMap = new Map<string, SourceDiscrepancy>();

  // 1. Zachowaj wszystkie rozbieżności z rekordu bazowego (np. disc-phenylalanine-content-01 w Infanrix hexa)
  if (baseline?.sourceDiscrepancies) {
    for (const baseDisc of baseline.sourceDiscrepancies) {
      mergedMap.set(baseDisc.id, structuredClone(baseDisc));
    }
  }

  // 2. Nanieś i zwaliduj rozbieżności z pliku importowanego
  if (Array.isArray(imported.sourceDiscrepancies)) {
    for (const rawDisc of imported.sourceDiscrepancies) {
      if (!rawDisc || typeof rawDisc.id !== 'string' || !rawDisc.id.trim()) {
        continue;
      }

      const existingBase = mergedMap.get(rawDisc.id);
      const candidate: SourceDiscrepancy = existingBase
        ? {
            ...existingBase,
            status: rawDisc.status || existingBase.status,
            resolution: rawDisc.resolution
              ? structuredClone(rawDisc.resolution)
              : existingBase.resolution
          }
        : structuredClone(rawDisc);

      // Twarda walidacja Etapu 1 i Etapu 2 niezależnie od nazwy produktu (ochrona każdego produktu!)
      const etap1Res = validateClarificationForm(candidate.resolution || {});
      const docCheck = candidate.resolution?.documentCheck;

      const hasValidEtap2 =
        Boolean(docCheck) &&
        docCheck?.sourceDocumentOpenedOrIndicated === true &&
        docCheck?.isConfirmed === true &&
        typeof docCheck?.sourceDocumentLocation === 'string' &&
        docCheck.sourceDocumentLocation.trim().length > 0 &&
        typeof docCheck?.checkDate === 'string' &&
        isValidDateString(docCheck.checkDate) &&
        typeof docCheck?.checkerNameAndRole === 'string' &&
        docCheck.checkerNameAndRole.trim().length >= 3 &&
        typeof docCheck?.checkerJustification === 'string' &&
        docCheck.checkerJustification.trim().length >= 5;

      if (!etap1Res.isValid) {
        candidate.status = 'requires_clarification';
        if (candidate.resolution) {
          candidate.resolution.isResolved = false;
        }
      } else if (
        candidate.status === 'resolved_with_official_document' &&
        hasValidEtap2
      ) {
        candidate.status = 'resolved_with_official_document';
        if (candidate.resolution) {
          candidate.resolution.isResolved = true;
        }
      } else {
        candidate.status = 'clarification_submitted';
        if (candidate.resolution) {
          candidate.resolution.isResolved = false;
        }
      }

      mergedMap.set(candidate.id, candidate);
    }
  }

  // Szczególna ochrona krytyczna vac-infanrix-hexa
  if (imported.id === 'vac-infanrix-hexa' && !mergedMap.has('disc-phenylalanine-content-01')) {
    const infanrixBase = VACCINES_CATALOG.find(v => v.id === 'vac-infanrix-hexa');
    const baseDisc = infanrixBase?.sourceDiscrepancies?.[0];
    if (baseDisc) {
      mergedMap.set(baseDisc.id, structuredClone(baseDisc));
    }
  }

  const finalList = Array.from(mergedMap.values());
  if (finalList.length === 0) {
    return { allResolved: true, sanitizedDiscrepancies: undefined };
  }

  const allResolved = finalList.every(
    d =>
      d.status === 'resolved_with_official_document' &&
      d.resolution?.isResolved === true &&
      d.resolution?.documentCheck?.isConfirmed === true
  );

  return {
    allResolved,
    sanitizedDiscrepancies: finalList
  };
};

interface HistoryInspectionResult {
  isStructurallyValid: boolean;
  errors: string[];
  suspiciousDetected: boolean;
  suspiciousReasons: string[];
  latestApprovalAuthor: string | null;
}

const inspectStatusHistoryIntegrity = (
  vaccine: VaccineProduct,
  discrepanciesAllResolved: boolean
): HistoryInspectionResult => {
  const history = vaccine.statusHistory;
  if (history === undefined) {
    return {
      isStructurallyValid: true,
      errors: [],
      suspiciousDetected:
        vaccine.verificationStatus === 'verified_chpl' ||
        (vaccine.verificationStatus as string) === 'verified_full',
      suspiciousReasons:
        vaccine.verificationStatus === 'verified_chpl'
          ? ['Brak historii zmian uzasadniającej status zatwierdzenia.']
          : [],
      latestApprovalAuthor: null
    };
  }

  if (!Array.isArray(history)) {
    return {
      isStructurallyValid: false,
      errors: [`Nieprawidłowy format statusHistory dla preparatu "${vaccine.tradeName}" (oczekiwano tablicy).`],
      suspiciousDetected: true,
      suspiciousReasons: ['Pole statusHistory nie jest tablicą.'],
      latestApprovalAuthor: null
    };
  }

  const errors: string[] = [];
  const suspiciousReasons: string[] = [];
  let latestApprovalAuthor: string | null = null;

  for (let i = 0; i < history.length; i++) {
    const entry = history[i];
    if (!isPlainRecord(entry)) {
      errors.push(`Wpis historii #${i + 1} w preparacie "${vaccine.tradeName}" nie jest obiektem.`);
      continue;
    }
    if (typeof entry.id !== 'string' || entry.id.trim().length === 0) {
      errors.push(`Brak poprawnego ID we wpisie historii #${i + 1} preparatu "${vaccine.tradeName}".`);
    }
    if (!isValidDateString(entry.timestamp)) {
      errors.push(
        `Nieprawidłowy lub pusty znacznik czasu we wpisie historii #${i + 1} preparatu "${vaccine.tradeName}".`
      );
    }
    if (
      !VALID_VERIFICATION_STATUSES.includes(entry.previousStatus as VaccineVerificationStatus) ||
      !VALID_VERIFICATION_STATUSES.includes(entry.newStatus as VaccineVerificationStatus)
    ) {
      errors.push(
        `Niedozwolony status w historii zmian #${i + 1} preparatu "${vaccine.tradeName}".`
      );
    }
    if (typeof entry.reason !== 'string' || entry.reason.trim().length === 0) {
      errors.push(`Brak uzasadnienia we wpisie historii #${i + 1} preparatu "${vaccine.tradeName}".`);
    }
    if (typeof entry.author !== 'string' || entry.author.trim().length === 0) {
      errors.push(`Brak autora we wpisie historii #${i + 1} preparatu "${vaccine.tradeName}".`);
    }

    if (entry.newStatus === 'verified_chpl') {
      if (!latestApprovalAuthor && typeof entry.author === 'string') {
        latestApprovalAuthor = entry.author;
      }
      if (!discrepanciesAllResolved) {
        suspiciousReasons.push(
          'Wpis historii deklaruje verified_chpl pomimo nierozwiązanej rozbieżności ChPL.'
        );
      }
      if (
        entry.previousStatus === 'requires_source_clarification' ||
        entry.previousStatus === 'uncompleted'
      ) {
        suspiciousReasons.push(
          `Wykryto niedozwolony bezpośredni skok statusu w historii (${String(entry.previousStatus)} → verified_chpl).`
        );
      }
      if (typeof entry.reason === 'string' && entry.reason.trim().length < 10) {
        suspiciousReasons.push('Zbyt skrótowe lub niekompletne uzasadnienie zatwierdzenia w historii.');
      }
    }
  }

  // Sprawdź ciągłość łańcucha historii (akceptuj kolejność od najnowszego jak w app oraz chronologiczną jak w testach)
  if (history.length >= 2 && errors.length === 0) {
    let matchesNewestFirst = true;
    let matchesChronological = true;

    for (let i = 0; i < history.length - 1; i++) {
      const a = history[i];
      const b = history[i + 1];
      if (a.previousStatus !== b.newStatus) {
        matchesNewestFirst = false;
      }
      if (a.newStatus !== b.previousStatus) {
        matchesChronological = false;
      }
    }

    if (!matchesNewestFirst && !matchesChronological) {
      suspiciousReasons.push(
        'Brak spójnej ciągłości przejść statusów pomiędzy kolejnymi wpisami w historii zmian.'
      );
    }
  }

  return {
    isStructurallyValid: errors.length === 0,
    errors,
    suspiciousDetected: suspiciousReasons.length > 0,
    suspiciousReasons,
    latestApprovalAuthor
  };
};

const checkOriginProvenance = (
  vaccine: VaccineProduct,
  historyCheck: HistoryInspectionResult
): { hasOriginProvenance: boolean; missingReasons: string[] } => {
  const missingReasons: string[] = [];

  if (!vaccine.userVerificationDate || !isValidDateString(vaccine.userVerificationDate)) {
    missingReasons.push('brak poprawnej daty weryfikacji personelu (userVerificationDate)');
  }
  if (
    !vaccine.userVerificationNotes ||
    vaccine.userVerificationNotes.trim().length < 8
  ) {
    missingReasons.push('brak merytorycznych notatek weryfikacyjnych (userVerificationNotes)');
  }
  if (!isValidHttpUrl(vaccine.currentChplUrl) && !isValidHttpUrl(vaccine.rplRecordUrl)) {
    missingReasons.push('brak zweryfikowanego odnośnika URL do źródła urzędowego RPL/ChPL');
  }
  if (
    (!vaccine.chplRevisionDate || !isValidDateString(vaccine.chplRevisionDate)) &&
    (!vaccine.documentDownloadDate || !isValidDateString(vaccine.documentDownloadDate))
  ) {
    missingReasons.push('brak daty dokumentu źródłowego ChPL (chplRevisionDate / documentDownloadDate)');
  }
  if (!historyCheck.latestApprovalAuthor) {
    missingReasons.push('brak wpisu zatwierdzenia z identyfikatorem audytora w historii zmian');
  }

  return {
    hasOriginProvenance: missingReasons.length === 0 && !historyCheck.suspiciousDetected,
    missingReasons
  };
};

const downgradeChplSectionsVerification = (chpl: ChPLStructure): ChPLStructure => {
  const clone: ChPLStructure = structuredClone(chpl);
  const downgrade = (sec: { verificationStatus?: VaccineVerificationStatus } | undefined) => {
    if (sec && sec.verificationStatus === 'verified_chpl') {
      sec.verificationStatus = 'requires_reverification';
    }
  };

  downgrade(clone.name);
  downgrade(clone.composition);
  downgrade(clone.pharmaceuticalForm);
  if (clone.clinicalParticulars) {
    downgrade(clone.clinicalParticulars.indications);
    downgrade(clone.clinicalParticulars.dosageAndAdministration);
    downgrade(clone.clinicalParticulars.contraindications);
    downgrade(clone.clinicalParticulars.warningsAndPrecautions);
    downgrade(clone.clinicalParticulars.interactions);
    downgrade(clone.clinicalParticulars.fertilityPregnancyLactation);
    downgrade(clone.clinicalParticulars.driveAndMachines);
    downgrade(clone.clinicalParticulars.undesirableEffects);
    downgrade(clone.clinicalParticulars.overdose);
  }
  if (clone.pharmacologicalProperties) {
    downgrade(clone.pharmacologicalProperties.pharmacodynamics);
    downgrade(clone.pharmacologicalProperties.pharmacokinetics);
    downgrade(clone.pharmacologicalProperties.preclinicalSafety);
  }
  if (clone.pharmaceuticalParticulars) {
    downgrade(clone.pharmaceuticalParticulars.excipients);
    downgrade(clone.pharmaceuticalParticulars.incompatibilities);
    downgrade(clone.pharmaceuticalParticulars.shelfLife);
    downgrade(clone.pharmaceuticalParticulars.storageSpecialPrecautions);
    downgrade(clone.pharmaceuticalParticulars.containerNatureAndContents);
    downgrade(clone.pharmaceuticalParticulars.disposalAndHandling);
  }
  downgrade(clone.marketingAuthorisationHolder);
  downgrade(clone.marketingAuthorisationNumber);
  downgrade(clone.firstAuthorisationAndRenewal);
  downgrade(clone.revisionDate);

  return clone;
};

/**
 * Wylicza podsumowanie i diagnostykę importowanego pliku kopii przed zatwierdzeniem.
 */
export const calculateBackupSummary = (
  payload: VaxNurseBackupPayload,
  currentLocalVaccines: readonly VaccineProduct[] = getStoredVaccines()
): BackupSummary => {
  const vaccineNames: string[] = [];
  let totalDiscrepancies = 0;
  let totalClarifications = 0;
  let totalHistoryEntries = 0;
  let productsToAdd = 0;
  let productsToUpdate = 0;
  let conflictCount = 0;
  let verifiedChplClaimsCount = 0;
  let claimsRequiringRecheckCount = 0;
  let invalidRecordsCount = 0;
  const invalidRecordDetails: string[] = [];

  const localById = new Map(currentLocalVaccines.map(v => [v.id, v]));

  for (const v of payload.vaccines) {
    vaccineNames.push(v.tradeName);

    const localCounterpart = localById.get(v.id);
    if (!localCounterpart) {
      productsToAdd += 1;
    } else {
      productsToUpdate += 1;
      const localPriority = STATUS_PRIORITY_ORDER[localCounterpart.verificationStatus] ?? 0;
      const importedPriority = STATUS_PRIORITY_ORDER[v.verificationStatus] ?? 0;
      const localNotesDiffer =
        (localCounterpart.userVerificationNotes || '') !== (v.userVerificationNotes || '');
      const localHistoryMoreDetailed =
        (localCounterpart.statusHistory?.length ?? 0) > (v.statusHistory?.length ?? 0);
      if (
        localPriority > importedPriority ||
        localCounterpart.verificationStatus !== v.verificationStatus ||
        localNotesDiffer ||
        localHistoryMoreDetailed
      ) {
        conflictCount += 1;
      }
    }

    const chplReport = inspectChplCompleteness(v.chpl);
    const claimsVerifiedTop =
      v.verificationStatus === 'verified_chpl' ||
      (v.verificationStatus as string) === 'verified_full';
    const claimsVerified = claimsVerifiedTop || chplReport.hasAnyVerifiedSection;

    if (claimsVerified) {
      verifiedChplClaimsCount += 1;
      // Żaden niepodpisany plik JSON nie może bezwarunkowo przyznać statusu zweryfikowanego
      claimsRequiringRecheckCount += 1;
    }

    const discCheck = sanitizeAndVerifyDiscrepancies(
      v,
      localCounterpart ?? VACCINES_CATALOG.find(b => b.id === v.id)
    );
    const historyCheck = inspectStatusHistoryIntegrity(v, discCheck.allResolved);

    if (!chplReport.isStructurallyValid || !historyCheck.isStructurallyValid) {
      invalidRecordsCount += 1;
      invalidRecordDetails.push(
        `${v.tradeName}: niekompletna struktura ChPL/historii (${chplReport.invalidSections.concat(historyCheck.errors).slice(0, 3).join(', ')})`
      );
    } else if (claimsVerifiedTop && !chplReport.hasAllSections1To10And41To49) {
      invalidRecordsCount += 1;
      invalidRecordDetails.push(
        `${v.tradeName}: deklaracja ${v.verificationStatus} bez pełnego audytu sekcji 1–10 i 4.1–4.9 (brakujące: ${chplReport.missingSections.slice(0, 5).join(', ')}).`
      );
    }

    if (v.sourceDiscrepancies && v.sourceDiscrepancies.length > 0) {
      totalDiscrepancies += v.sourceDiscrepancies.length;
      totalClarifications += v.sourceDiscrepancies.filter(
        d =>
          d.status === 'clarification_submitted' ||
          d.status === 'resolved_with_official_document' ||
          Boolean(d.resolution?.documentId)
      ).length;
    }
    if (v.statusHistory && v.statusHistory.length > 0) {
      totalHistoryEntries += v.statusHistory.length;
    }
  }

  return {
    exportedAtFormatted: payload.metadata.exportedAtFormatted || payload.metadata.exportedAt,
    schemaVersion: payload.metadata.schemaVersion,
    appVersion: payload.metadata.appVersion || 'Nieznana',
    catalogDataVersion: payload.metadata.catalogDataVersion,
    totalVaccines: payload.vaccines.length,
    totalDiscrepancies,
    totalClarifications,
    totalHistoryEntries,
    vaccineNames,
    productsToAdd,
    productsToUpdate,
    conflictCount,
    verifiedChplClaimsCount,
    claimsRequiringRecheckCount,
    invalidRecordsCount,
    invalidRecordDetails
  };
};

/**
 * Rygorystyczna walidacja importowanego ciągu tekstowego JSON kopii zapasowej.
 */
export const validateBackupPayload = (
  rawJsonString: string,
  currentLocalVaccines: readonly VaccineProduct[] = getStoredVaccines()
): BackupValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!rawJsonString || !rawJsonString.trim()) {
    return {
      isValid: false,
      errors: ['Nieprawidłowy format pliku: wskazany plik JSON jest pusty.']
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJsonString);
  } catch {
    return {
      isValid: false,
      errors: [
        'Nieprawidłowy format pliku: zawartość nie jest poprawnym dokumentem JSON (błąd składni).'
      ]
    };
  }

  if (hasPrototypePollutionKey(parsed)) {
    return {
      isValid: false,
      errors: [
        'Odrzucono plik kopii: wykryto niedozwolone klucze obiektu (__proto__ / constructor / prototype).'
      ]
    };
  }

  if (!isPlainRecord(parsed)) {
    return {
      isValid: false,
      errors: ['Nieprawidłowa struktura główna pliku kopii bezpieczeństwa.']
    };
  }

  for (const rootKey of Object.keys(parsed)) {
    if (!KNOWN_BACKUP_ROOT_KEYS.has(rootKey)) {
      warnings.push(
        `Wykryto nieznane pole główne w kopii JSON: "${rootKey}". Zostanie ono zignorowane podczas przywracania.`
      );
    }
  }

  if (parsed.vaxnurseBackup !== true) {
    errors.push(
      'To nie jest prawidłowy plik kopii bezpieczeństwa systemu VaxNurse (brak sygnatury "vaxnurseBackup": true).'
    );
  }

  const metadata = parsed.metadata;
  if (!isPlainRecord(metadata)) {
    errors.push('Brak sekcji metadanych ("metadata") w pliku kopii bezpieczeństwa.');
  } else {
    for (const metaKey of Object.keys(metadata)) {
      if (!KNOWN_METADATA_KEYS.has(metaKey)) {
        warnings.push(`Wykryto nieznane pole w metadanych kopii: "${metaKey}".`);
      }
    }

    if (metadata.schemaVersion !== BACKUP_SCHEMA_VERSION) {
      errors.push(
        `Nieobsługiwana wersja schematu danych kopii ("${String(metadata.schemaVersion)}"). Wymagana wersja: "${BACKUP_SCHEMA_VERSION}".`
      );
    }
    if (metadata.containsPatientData === true) {
      errors.push(
        'Odrzucono plik: kopia deklaruje obecność danych pacjentów, co jest niedozwolone w systemie VaxNurse.'
      );
    }
    if (!metadata.exportedAt) {
      warnings.push('Brak daty eksportu w metadanych kopii.');
    }
  }

  if (!Array.isArray(parsed.vaccines) || parsed.vaccines.length === 0) {
    errors.push('Brak tablicy preparatów ("vaccines") lub tablica jest pusta.');
  } else {
    const duplicateIds = findDuplicateVaccineIds(
      parsed.vaccines as { id?: unknown }[]
    );
    if (duplicateIds.length > 0) {
      errors.push(
        `Wykryto zduplikowane identyfikatory preparatów (ID) w pliku kopii: ${duplicateIds.join(', ')}.`
      );
    }

    parsed.vaccines.forEach((rawV: unknown, idx: number) => {
      if (!isPlainRecord(rawV)) {
        errors.push(`Rekord preparatu #${idx + 1} nie jest poprawnym obiektem JSON.`);
        return;
      }

      for (const fieldKey of Object.keys(rawV)) {
        if (!KNOWN_VACCINE_KEYS.has(fieldKey)) {
          warnings.push(
            `Wykryto nieznane pole "${fieldKey}" w rekordzie "${String(rawV.tradeName || rawV.id || `#${idx + 1}`)}".`
          );
        }
      }

      if (typeof rawV.id !== 'string' || !rawV.id.trim()) {
        errors.push(`Brak poprawnego identyfikatora "id" w rekordzie preparatu #${idx + 1}.`);
      }
      if (typeof rawV.tradeName !== 'string' || !rawV.tradeName.trim()) {
        errors.push(
          `Brak nazwy handlowej ("tradeName") w rekordzie preparatu #${idx + 1}.`
        );
      }

      if (
        typeof rawV.verificationStatus !== 'string' ||
        !VALID_VERIFICATION_STATUSES.includes(
          rawV.verificationStatus as VaccineVerificationStatus
        )
      ) {
        errors.push(
          `Nieznany lub niedozwolony status weryfikacji ("${String(rawV.verificationStatus)}") w rekordzie "${String(rawV.tradeName || idx + 1)}".`
        );
      }

      if (!isPlainRecord(rawV.chpl) || !isPlainRecord(rawV.chpl.name)) {
        errors.push(
          `Brak wymaganej struktury ChPL ("chpl.name") w rekordzie "${String(rawV.tradeName || idx + 1)}".`
        );
      } else {
        const chplReport = inspectChplCompleteness(rawV.chpl);
        if (chplReport.invalidSections.length > 0 && isPlainRecord(rawV.chpl.clinicalParticulars)) {
          warnings.push(
            `Preparat "${String(rawV.tradeName || rawV.id)}": wykryto niepełną strukturę sekcji ChPL (${chplReport.invalidSections.join(', ')}).`
          );
        }
      }

      if (!isValidHttpUrlOrNull(rawV.rplRecordUrl) || !isValidHttpUrlOrNull(rawV.currentChplUrl)) {
        errors.push(
          `Nieprawidłowy adres URL (rplRecordUrl lub currentChplUrl) w rekordzie "${String(rawV.tradeName || idx + 1)}".`
        );
      }

      for (const dateField of [
        'chplRevisionDate',
        'chplVersionDate',
        'documentDownloadDate',
        'userVerificationDate'
      ] as const) {
        const val = rawV[dateField];
        if (val !== null && val !== undefined && val !== '' && !isValidDateString(val)) {
          errors.push(
            `Nieprawidłowy format daty w polu "${dateField}" rekordu "${String(rawV.tradeName || idx + 1)}".`
          );
        }
      }

      if (rawV.sourceDiscrepancies !== undefined) {
        if (!Array.isArray(rawV.sourceDiscrepancies)) {
          errors.push(
            `Pole sourceDiscrepancies w rekordzie "${String(rawV.tradeName || idx + 1)}" musi być tablicą.`
          );
        } else {
          for (const d of rawV.sourceDiscrepancies) {
            if (!isPlainRecord(d) || typeof d.id !== 'string' || !d.id.trim()) {
              errors.push(
                `Nieprawidłowa struktura wpisu w sourceDiscrepancies rekordu "${String(rawV.tradeName || idx + 1)}".`
              );
              continue;
            }
            if (
              typeof d.status !== 'string' ||
              !VALID_DISCREPANCY_STATUSES.includes(d.status as DiscrepancyStatus)
            ) {
              errors.push(
                `Niedozwolony status niezgodności "${String(d.status)}" w rekordzie "${String(rawV.tradeName || idx + 1)}".`
              );
            }
            if (!isValidHttpUrlOrNull(d.documentUrl)) {
              errors.push(
                `Nieprawidłowy URL dokumentu niezgodności w rekordzie "${String(rawV.tradeName || idx + 1)}".`
              );
            }
          }
        }
      }

      const typedCandidate = rawV as unknown as VaccineProduct;
      const historyCheck = inspectStatusHistoryIntegrity(
        typedCandidate,
        (typedCandidate.sourceDiscrepancies || []).every(
          d => d.status === 'resolved_with_official_document'
        )
      );
      if (!historyCheck.isStructurallyValid) {
        errors.push(...historyCheck.errors);
      } else if (historyCheck.suspiciousDetected) {
        warnings.push(
          `Wykryto niespójną lub podejrzaną historię zmian w rekordzie "${String(rawV.tradeName)}": ${historyCheck.suspiciousReasons.join(' ')}`
        );
      }

      if (
        rawV.verificationStatus === 'verified_chpl' ||
        inspectChplCompleteness(rawV.chpl).hasAnyVerifiedSection
      ) {
        warnings.push(
          `Preparat "${String(rawV.tradeName)}" posiada w kopii deklarację "verified_chpl". Ze względu na brak kryptograficznego podpisu pliku JSON status zostanie oznaczony jako deklaracja wymagająca lokalnej weryfikacji.`
        );
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

  const typedPayload = parsed as unknown as VaxNurseBackupPayload;
  const summary = calculateBackupSummary(typedPayload, currentLocalVaccines);

  return {
    isValid: true,
    errors: [],
    warnings,
    payload: typedPayload,
    summary
  };
};

/**
 * Wymuszenie zasad integralności klinicznej i bezpieczeństwa przy imporcie kopii JSON:
 * - Chroni KAŻDY preparat (nie tylko vac-infanrix-hexa) przed nieautoryzowanym awansem z niepodpisanego JSON.
 * - Przywraca i waliduje niezgodności ChPL (w tym disc-phenylalanine-content-01 w vac-infanrix-hexa).
 * - Zachowuje informację o deklaracji z importu (importedVerificationClaim) bez utraty historii ani notatek.
 * - Zmusza każdą importowaną deklarację verified_chpl / verified_full do ponownej kontroli lokalnej.
 */
export const enforceClinicalIntegrityOnImport = (
  importedVaccines: VaccineProduct[],
  currentVaccines: VaccineProduct[] = VACCINES_CATALOG,
  now: Date = new Date()
): VaccineProduct[] => {
  const baselineById = new Map<string, VaccineProduct>();
  for (const baseItem of VACCINES_CATALOG) {
    baselineById.set(baseItem.id, baseItem);
  }
  for (const curItem of currentVaccines) {
    if (!baselineById.has(curItem.id)) {
      baselineById.set(curItem.id, curItem);
    }
  }

  const importedAtIso = now.toISOString();
  const formattedNow = formatPolishDateTime(now);

  return importedVaccines.map((rawImported) => {
    const imported: VaccineProduct = structuredClone(rawImported);
    const baseline =
      VACCINES_CATALOG.find(v => v.id === imported.id) ??
      currentVaccines.find(v => v.id === imported.id);

    const discAudit = sanitizeAndVerifyDiscrepancies(imported, baseline);
    if (discAudit.sanitizedDiscrepancies) {
      imported.sourceDiscrepancies = discAudit.sanitizedDiscrepancies;
    }

    const chplReport = inspectChplCompleteness(imported.chpl);
    const historyCheck = inspectStatusHistoryIntegrity(imported, discAudit.allResolved);
    const originCheck = checkOriginProvenance(imported, historyCheck);

    const rawStatusStr = String(imported.verificationStatus || '');
    const claimsVerifiedTop =
      rawStatusStr === 'verified_chpl' || rawStatusStr === 'verified_full';
    const claimsAnyVerified = claimsVerifiedTop || chplReport.hasAnyVerifiedSection;

    if (claimsAnyVerified) {
      const failureReasons: string[] = [
        'Zewnętrzny plik kopii JSON nie posiada kryptograficznego podpisu pochodzenia — wymagana ponowna lokalna kontrola.'
      ];
      if (!discAudit.allResolved) {
        failureReasons.push('Wybrane niezgodności ChPL nie zostały kompletnie wyjaśnione (Etap 1+2).');
      }
      if (!chplReport.hasAllSections1To10And41To49) {
        failureReasons.push(
          `Brak pełnego kompletu treści ChPL 1–10 i 4.1–4.9 (brakujące sekcje: ${chplReport.missingSections.join(', ')}).`
        );
      }
      if (!originCheck.hasOriginProvenance) {
        failureReasons.push(
          `Niepełne dane pochodzenia / audytu: ${originCheck.missingReasons.join(', ')}.`
        );
      }
      if (historyCheck.suspiciousDetected) {
        failureReasons.push(
          `Anomalia historii statusów: ${historyCheck.suspiciousReasons.join(' ')}`
        );
      }

      const claim: ImportedVerificationClaim = {
        claimedStatus: rawStatusStr,
        declaredBy: historyCheck.latestApprovalAuthor,
        declaredAt: imported.userVerificationDate ?? null,
        declaredNotes: imported.userVerificationNotes ?? null,
        importedAt: importedAtIso,
        requiresReverification: true,
        hasCompleteChplAudit: chplReport.hasAllSections1To10And41To49,
        hasOriginProvenance: originCheck.hasOriginProvenance,
        suspiciousHistoryDetected: historyCheck.suspiciousDetected,
        reason: failureReasons.join(' ')
      };

      const targetStatus: VaccineVerificationStatus = !discAudit.allResolved
        ? 'requires_source_clarification'
        : 'requires_reverification';

      const importNoteEntry: StatusHistoryEntry = {
        id: createHistoryEntryId(),
        timestamp: formattedNow,
        previousStatus: VALID_VERIFICATION_STATUSES.includes(
          imported.verificationStatus
        )
          ? imported.verificationStatus
          : 'pending_verification',
        newStatus: targetStatus,
        reason: `Import z niepodpisanego pliku JSON zadeklarował status „${rawStatusStr}”. Ze względów bezpieczeństwa klinicznego deklarację zachowano w importedVerificationClaim, a status ustawiono na „${targetStatus}” do ponownej kontroli lokalnej.`,
        author: LOCAL_UNAUTHENTICATED_AUTHOR
      };

      imported.verificationStatus = targetStatus;
      imported.importedVerificationClaim = claim;
      imported.chpl = downgradeChplSectionsVerification(imported.chpl);
      imported.statusHistory = [importNoteEntry, ...(imported.statusHistory || [])];
    } else if (!discAudit.allResolved) {
      // Preparat ma nierozwiązane rozbieżności (np. Infanrix hexa) — status nigdy nie może być gotowy ani zatwierdzony
      if (
        imported.verificationStatus === 'ready_for_manual_verification' ||
        imported.verificationStatus === 'pending_verification'
      ) {
        imported.verificationStatus = 'requires_source_clarification';
      }
    }

    return imported;
  });
};

/**
 * Bezpiecznie scala zaimportowaną i zsanetyzowaną kopię zapasową z aktualnym katalogiem bazowym aplikacji
 * (zapobiega utracie nowych preparatów z nowszej wersji aplikacji po imporcie starszego backupu).
 */
export const mergeImportedBackupWithLocalCatalog = (
  importedVaccines: VaccineProduct[],
  currentLocalVaccines: VaccineProduct[] = getStoredVaccines(),
  now: Date = new Date()
) => {
  const sanitizedImported = enforceClinicalIntegrityOnImport(
    importedVaccines,
    currentLocalVaccines,
    now
  );
  return mergeVaccineCatalogWithStorage(VACCINES_CATALOG, sanitizedImported, {
    baseCatalogVersion: CATALOG_DATA_VERSION
  });
};

/**
 * Bezpieczne wywołanie pobrania pliku JSON przez przeglądarkę.
 */
export const triggerJsonDownload = (data: unknown, filename: string): void => {
  const jsonString = JSON.stringify(data, null, 2);
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
 * Pobiera aktualną scaloną listę preparatów z localStorage (lub domyślnego katalogu).
 */
export const getStoredVaccines = (): VaccineProduct[] => {
  const storage =
    typeof localStorage !== 'undefined' ? localStorage : null;
  const loaded = loadVaccinesFromStorage(storage, VACCINES_CATALOG);
  return loaded.vaccines;
};

/**
 * Zapisuje zwalidowane preparaty do localStorage bez nadpisywania stanu w przypadku błędu.
 */
export const storeVaccinesSafely = (
  vaccines: VaccineProduct[]
): { success: boolean; error?: string } => {
  const storage =
    typeof localStorage !== 'undefined' ? localStorage : null;
  const res = saveVaccinesToStorage(storage, vaccines);
  return {
    success: res.success,
    error: res.error ?? undefined
  };
};
