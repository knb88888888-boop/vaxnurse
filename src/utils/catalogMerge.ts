import type {
  CatalogMergeConflict,
  ChPLSection,
  ChPLStructure,
  SourceDiscrepancy,
  StatusHistoryEntry,
  VaccineProduct,
  VaccineVerificationStatus
} from '../types/vaccines.ts';

/**
 * Jawny identyfikator wersji danych katalogu bazowego (odrębny od:
 * - wersji schematu backupu BACKUP_SCHEMA_VERSION,
 * - wersji aplikacji APP_VERSION,
 * - daty rewizji ChPL oraz daty PSO 2027).
 */
export const CATALOG_DATA_VERSION = '2026.11.11-chpl-catalog-1.0';
export const VAX_CATALOG_META_KEY = 'vaxnurse_vaccines_catalog_meta_v1';
export const SUPPORTED_STORAGE_FORMAT_VERSION = 1;

export const ALLOWED_VERIFICATION_STATUSES: readonly VaccineVerificationStatus[] = [
  'pending_verification',
  'uncompleted',
  'requires_source_clarification',
  'ready_for_manual_verification',
  'requires_reverification',
  'verified_chpl'
] as const;

export const STATUS_PRIORITY_ORDER: Record<VaccineVerificationStatus, number> = {
  uncompleted: 0,
  pending_verification: 1,
  requires_source_clarification: 2,
  requires_reverification: 2,
  ready_for_manual_verification: 3,
  verified_chpl: 4
};

const FORBIDDEN_OBJECT_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export interface ChplCompletenessReport {
  isStructurallyValid: boolean;
  hasAllSections1To10And41To49: boolean;
  missingSections: string[];
  invalidSections: string[];
  hasAnyVerifiedSection: boolean;
  verifiedSectionLabels: string[];
}

export interface MergeCatalogOptions {
  baselineSnapshotById?: Readonly<Record<string, VaccineProduct>>;
  baseCatalogVersion?: string;
  storedCatalogVersion?: string | null;
}

export interface MergeCatalogResult {
  vaccines: VaccineProduct[];
  addedIds: string[];
  preservedLocalIds: string[];
  customLocalIds: string[];
  conflictIds: string[];
  duplicateIds: string[];
  errors: string[];
  warnings: string[];
  catalogDataVersion: string;
}

export interface CatalogMetaRecord {
  storageFormatVersion: number;
  catalogDataVersion: string;
  updatedAt: string;
  baselineSnapshotById?: Record<string, VaccineProduct>;
}

export const isPlainRecord = (val: unknown): val is Record<string, unknown> =>
  Boolean(val && typeof val === 'object' && !Array.isArray(val));

export const isValidVerificationStatus = (
  val: unknown
): val is VaccineVerificationStatus =>
  typeof val === 'string' &&
  (ALLOWED_VERIFICATION_STATUSES as readonly string[]).includes(val);

export const hasPrototypePollutionKey = (
  value: unknown,
  seen: Set<unknown> = new Set()
): boolean => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  if (seen.has(value)) {
    return false;
  }
  seen.add(value);

  if (Array.isArray(value)) {
    return value.some(item => hasPrototypePollutionKey(item, seen));
  }

  for (const key of Object.keys(value as Record<string, unknown>)) {
    if (FORBIDDEN_OBJECT_KEYS.has(key)) {
      return true;
    }
    if (hasPrototypePollutionKey((value as Record<string, unknown>)[key], seen)) {
      return true;
    }
  }
  return false;
};

export const isValidHttpUrl = (val: unknown): boolean => {
  if (typeof val !== 'string' || !val.trim()) {
    return false;
  }
  try {
    const parsed = new URL(val.trim());
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
};

export const isValidHttpUrlOrNull = (val: unknown): boolean =>
  val === null || val === undefined || isValidHttpUrl(val);

const isValidUtcCalendarDate = (year: number, month: number, day: number): boolean => {
  if (year < 1990 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }
  const probe = new Date(Date.UTC(year, month - 1, day));
  return (
    probe.getUTCFullYear() === year &&
    probe.getUTCMonth() === month - 1 &&
    probe.getUTCDate() === day
  );
};

export const isValidDateString = (val: unknown): boolean => {
  if (typeof val !== 'string') {
    return false;
  }
  const trimmed = val.trim();
  if (!trimmed) {
    return false;
  }
  // Obsługa ścisłych dat ISO (YYYY-MM-DD oraz YYYY-MM-DDTHH:mm(:ss(.sss)?)?(Z|±HH:MM)?)
  const isoMatch = trimmed.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,6})?)?(?:Z|[+-]\d{2}:\d{2}))?$/
  );
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    if (!isValidUtcCalendarDate(year, month, day)) {
      return false;
    }
    if (isoMatch[4] !== undefined) {
      const hour = Number(isoMatch[4]);
      const minute = Number(isoMatch[5]);
      const second = Number(isoMatch[6] ?? '0');
      if (hour > 23 || minute > 59 || second > 59) {
        return false;
      }
      return !Number.isNaN(Date.parse(trimmed));
    }
    return true;
  }
  // Obsługa dat polskich z toLocaleDateString('pl-PL') / formatPolishDateTime: DD.MM.YYYY, D.MM.YYYY r., HH:mm(:ss)
  const plMatch = trimmed.match(
    /^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s*(?:r\.)?(?:,\s*|\s+)(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if (plMatch) {
    const day = Number(plMatch[1]);
    const month = Number(plMatch[2]);
    const year = Number(plMatch[3]);
    if (!isValidUtcCalendarDate(year, month, day)) {
      return false;
    }
    if (plMatch[4] !== undefined) {
      const hour = Number(plMatch[4]);
      const minute = Number(plMatch[5]);
      const second = Number(plMatch[6] ?? '0');
      if (hour > 23 || minute > 59 || second > 59) {
        return false;
      }
    }
    return true;
  }
  return false;
};

export const findDuplicateVaccineIds = (
  vaccines: readonly { id?: unknown }[]
): string[] => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const item of vaccines) {
    if (typeof item?.id === 'string' && item.id.trim()) {
      if (seen.has(item.id)) {
        duplicates.add(item.id);
      } else {
        seen.add(item.id);
      }
    }
  }
  return Array.from(duplicates);
};

interface ChplSectionEntry {
  label: string;
  value: unknown;
}

const collectChplSectionEntries = (chpl: Record<string, unknown>): ChplSectionEntry[] => {
  const cp = isPlainRecord(chpl.clinicalParticulars) ? chpl.clinicalParticulars : {};
  const pp = isPlainRecord(chpl.pharmacologicalProperties)
    ? chpl.pharmacologicalProperties
    : {};
  const ph = isPlainRecord(chpl.pharmaceuticalParticulars)
    ? chpl.pharmaceuticalParticulars
    : {};

  return [
    { label: '1', value: chpl.name },
    { label: '2', value: chpl.composition },
    { label: '3', value: chpl.pharmaceuticalForm },
    { label: '4.1', value: cp.indications },
    { label: '4.2', value: cp.dosageAndAdministration },
    { label: '4.3', value: cp.contraindications },
    { label: '4.4', value: cp.warningsAndPrecautions },
    { label: '4.5', value: cp.interactions },
    { label: '4.6', value: cp.fertilityPregnancyLactation },
    { label: '4.7', value: cp.driveAndMachines },
    { label: '4.8', value: cp.undesirableEffects },
    { label: '4.9', value: cp.overdose },
    { label: '5.1', value: pp.pharmacodynamics },
    { label: '5.2', value: pp.pharmacokinetics },
    { label: '5.3', value: pp.preclinicalSafety },
    { label: '6.1', value: ph.excipients },
    { label: '6.2', value: ph.incompatibilities },
    { label: '6.3', value: ph.shelfLife },
    { label: '6.4', value: ph.storageSpecialPrecautions },
    { label: '6.5', value: ph.containerNatureAndContents },
    { label: '6.6', value: ph.disposalAndHandling },
    { label: '7', value: chpl.marketingAuthorisationHolder },
    { label: '8', value: chpl.marketingAuthorisationNumber },
    { label: '9', value: chpl.firstAuthorisationAndRenewal },
    { label: '10', value: chpl.revisionDate }
  ];
};

const isSectionShapeValid = (section: unknown): section is ChPLSection => {
  if (!isPlainRecord(section)) {
    return false;
  }
  if (
    section.content !== null &&
    section.content !== undefined &&
    typeof section.content !== 'string'
  ) {
    return false;
  }
  if (
    section.verificationStatus !== undefined &&
    typeof section.verificationStatus !== 'string'
  ) {
    return false;
  }
  if (
    section.sourceDocumentUrl !== undefined &&
    !isValidHttpUrlOrNull(section.sourceDocumentUrl)
  ) {
    return false;
  }
  return true;
};

export const inspectChplCompleteness = (chpl: unknown): ChplCompletenessReport => {
  if (!isPlainRecord(chpl)) {
    return {
      isStructurallyValid: false,
      hasAllSections1To10And41To49: false,
      missingSections: ['1–10'],
      invalidSections: ['chpl'],
      hasAnyVerifiedSection: false,
      verifiedSectionLabels: []
    };
  }

  const hasSubtrees =
    isPlainRecord(chpl.clinicalParticulars) &&
    isPlainRecord(chpl.pharmacologicalProperties) &&
    isPlainRecord(chpl.pharmaceuticalParticulars);

  const entries = collectChplSectionEntries(chpl);
  const missingSections: string[] = [];
  const invalidSections: string[] = [];
  const verifiedSectionLabels: string[] = [];

  for (const entry of entries) {
    if (!entry.value || !isPlainRecord(entry.value)) {
      missingSections.push(entry.label);
      invalidSections.push(entry.label);
      continue;
    }

    if (!isSectionShapeValid(entry.value)) {
      invalidSections.push(entry.label);
    }

    const content = entry.value.content;
    if (typeof content !== 'string' || content.trim().length === 0) {
      missingSections.push(entry.label);
    }

    if (entry.value.verificationStatus === 'verified_chpl') {
      verifiedSectionLabels.push(entry.label);
    }
  }

  return {
    isStructurallyValid: hasSubtrees && invalidSections.length === 0,
    hasAllSections1To10And41To49:
      hasSubtrees && invalidSections.length === 0 && missingSections.length === 0,
    missingSections,
    invalidSections,
    hasAnyVerifiedSection: verifiedSectionLabels.length > 0,
    verifiedSectionLabels
  };
};

export const isValidStoredVaccineRecord = (item: unknown): item is VaccineProduct => {
  if (!isPlainRecord(item)) {
    return false;
  }
  if (
    typeof item.id !== 'string' ||
    item.id.trim().length === 0 ||
    typeof item.tradeName !== 'string' ||
    item.tradeName.trim().length === 0 ||
    !isValidVerificationStatus(item.verificationStatus) ||
    !isPlainRecord(item.chpl)
  ) {
    return false;
  }
  if (hasPrototypePollutionKey(item)) {
    return false;
  }
  if (!isValidHttpUrlOrNull(item.rplRecordUrl) || !isValidHttpUrlOrNull(item.currentChplUrl)) {
    return false;
  }
  return true;
};

const mergeChplSectionPreservingLocal = (
  baseSection: ChPLSection,
  storedSection: ChPLSection | undefined,
  label: string,
  baseSnapshotSection: ChPLSection | undefined,
  conflictFields: string[]
): ChPLSection => {
  if (!storedSection || !isPlainRecord(storedSection)) {
    return structuredClone(baseSection);
  }

  const storedContent =
    typeof storedSection.content === 'string' && storedSection.content.trim().length > 0
      ? storedSection.content
      : null;
  const baseContent =
    typeof baseSection.content === 'string' && baseSection.content.trim().length > 0
      ? baseSection.content
      : null;

  // Jeżeli treść w nowej bazie różni się od treści lokalnej użytkownika (i nie jest pustym wypełnieniem),
  // zachowaj lokalną treść użytkownika oraz oznacz konflikt do przeglądu.
  if (storedContent !== null && baseContent !== null && storedContent !== baseContent) {
    const snapContent = baseSnapshotSection?.content ?? null;
    if (snapContent === null || baseContent !== snapContent) {
      conflictFields.push(`chpl.${label}`);
    }
  }

  return {
    ...structuredClone(baseSection),
    ...structuredClone(storedSection),
    // Brak cichego nadpisania niepustej lokalnej treści
    content: storedSection.content ?? baseSection.content,
    officialSource: storedSection.officialSource || baseSection.officialSource,
    verificationStatus: storedSection.verificationStatus || baseSection.verificationStatus,
    verificationNote: storedSection.verificationNote ?? baseSection.verificationNote,
    sourceDocumentUrl: storedSection.sourceDocumentUrl ?? baseSection.sourceDocumentUrl,
    chplVersionDate: storedSection.chplVersionDate ?? baseSection.chplVersionDate,
    pdfPageNumber: storedSection.pdfPageNumber ?? baseSection.pdfPageNumber
  };
};

const mergeChplStructures = (
  baseChpl: ChPLStructure,
  storedChpl: ChPLStructure | undefined,
  snapshotChpl: ChPLStructure | undefined,
  conflictFields: string[]
): ChPLStructure => {
  if (!storedChpl || !isPlainRecord(storedChpl)) {
    return structuredClone(baseChpl);
  }

  const cpStored = isPlainRecord(storedChpl.clinicalParticulars)
    ? storedChpl.clinicalParticulars
    : undefined;
  const ppStored = isPlainRecord(storedChpl.pharmacologicalProperties)
    ? storedChpl.pharmacologicalProperties
    : undefined;
  const phStored = isPlainRecord(storedChpl.pharmaceuticalParticulars)
    ? storedChpl.pharmaceuticalParticulars
    : undefined;

  return {
    name: mergeChplSectionPreservingLocal(
      baseChpl.name,
      storedChpl.name,
      '1',
      snapshotChpl?.name,
      conflictFields
    ),
    composition: mergeChplSectionPreservingLocal(
      baseChpl.composition,
      storedChpl.composition,
      '2',
      snapshotChpl?.composition,
      conflictFields
    ),
    pharmaceuticalForm: mergeChplSectionPreservingLocal(
      baseChpl.pharmaceuticalForm,
      storedChpl.pharmaceuticalForm,
      '3',
      snapshotChpl?.pharmaceuticalForm,
      conflictFields
    ),
    clinicalParticulars: {
      indications: mergeChplSectionPreservingLocal(
        baseChpl.clinicalParticulars.indications,
        cpStored?.indications,
        '4.1',
        snapshotChpl?.clinicalParticulars?.indications,
        conflictFields
      ),
      dosageAndAdministration: mergeChplSectionPreservingLocal(
        baseChpl.clinicalParticulars.dosageAndAdministration,
        cpStored?.dosageAndAdministration,
        '4.2',
        snapshotChpl?.clinicalParticulars?.dosageAndAdministration,
        conflictFields
      ),
      contraindications: mergeChplSectionPreservingLocal(
        baseChpl.clinicalParticulars.contraindications,
        cpStored?.contraindications,
        '4.3',
        snapshotChpl?.clinicalParticulars?.contraindications,
        conflictFields
      ),
      warningsAndPrecautions: mergeChplSectionPreservingLocal(
        baseChpl.clinicalParticulars.warningsAndPrecautions,
        cpStored?.warningsAndPrecautions,
        '4.4',
        snapshotChpl?.clinicalParticulars?.warningsAndPrecautions,
        conflictFields
      ),
      interactions: mergeChplSectionPreservingLocal(
        baseChpl.clinicalParticulars.interactions,
        cpStored?.interactions,
        '4.5',
        snapshotChpl?.clinicalParticulars?.interactions,
        conflictFields
      ),
      fertilityPregnancyLactation: mergeChplSectionPreservingLocal(
        baseChpl.clinicalParticulars.fertilityPregnancyLactation,
        cpStored?.fertilityPregnancyLactation,
        '4.6',
        snapshotChpl?.clinicalParticulars?.fertilityPregnancyLactation,
        conflictFields
      ),
      driveAndMachines: mergeChplSectionPreservingLocal(
        baseChpl.clinicalParticulars.driveAndMachines,
        cpStored?.driveAndMachines,
        '4.7',
        snapshotChpl?.clinicalParticulars?.driveAndMachines,
        conflictFields
      ),
      undesirableEffects: mergeChplSectionPreservingLocal(
        baseChpl.clinicalParticulars.undesirableEffects,
        cpStored?.undesirableEffects,
        '4.8',
        snapshotChpl?.clinicalParticulars?.undesirableEffects,
        conflictFields
      ),
      overdose: mergeChplSectionPreservingLocal(
        baseChpl.clinicalParticulars.overdose,
        cpStored?.overdose,
        '4.9',
        snapshotChpl?.clinicalParticulars?.overdose,
        conflictFields
      )
    },
    pharmacologicalProperties: {
      pharmacodynamics: mergeChplSectionPreservingLocal(
        baseChpl.pharmacologicalProperties.pharmacodynamics,
        ppStored?.pharmacodynamics,
        '5.1',
        snapshotChpl?.pharmacologicalProperties?.pharmacodynamics,
        conflictFields
      ),
      pharmacokinetics: mergeChplSectionPreservingLocal(
        baseChpl.pharmacologicalProperties.pharmacokinetics,
        ppStored?.pharmacokinetics,
        '5.2',
        snapshotChpl?.pharmacologicalProperties?.pharmacokinetics,
        conflictFields
      ),
      preclinicalSafety: mergeChplSectionPreservingLocal(
        baseChpl.pharmacologicalProperties.preclinicalSafety,
        ppStored?.preclinicalSafety,
        '5.3',
        snapshotChpl?.pharmacologicalProperties?.preclinicalSafety,
        conflictFields
      )
    },
    pharmaceuticalParticulars: {
      excipients: mergeChplSectionPreservingLocal(
        baseChpl.pharmaceuticalParticulars.excipients,
        phStored?.excipients,
        '6.1',
        snapshotChpl?.pharmaceuticalParticulars?.excipients,
        conflictFields
      ),
      incompatibilities: mergeChplSectionPreservingLocal(
        baseChpl.pharmaceuticalParticulars.incompatibilities,
        phStored?.incompatibilities,
        '6.2',
        snapshotChpl?.pharmaceuticalParticulars?.incompatibilities,
        conflictFields
      ),
      shelfLife: mergeChplSectionPreservingLocal(
        baseChpl.pharmaceuticalParticulars.shelfLife,
        phStored?.shelfLife,
        '6.3',
        snapshotChpl?.pharmaceuticalParticulars?.shelfLife,
        conflictFields
      ),
      storageSpecialPrecautions: mergeChplSectionPreservingLocal(
        baseChpl.pharmaceuticalParticulars.storageSpecialPrecautions,
        phStored?.storageSpecialPrecautions,
        '6.4',
        snapshotChpl?.pharmaceuticalParticulars?.storageSpecialPrecautions,
        conflictFields
      ),
      containerNatureAndContents: mergeChplSectionPreservingLocal(
        baseChpl.pharmaceuticalParticulars.containerNatureAndContents,
        phStored?.containerNatureAndContents,
        '6.5',
        snapshotChpl?.pharmaceuticalParticulars?.containerNatureAndContents,
        conflictFields
      ),
      disposalAndHandling: mergeChplSectionPreservingLocal(
        baseChpl.pharmaceuticalParticulars.disposalAndHandling,
        phStored?.disposalAndHandling,
        '6.6',
        snapshotChpl?.pharmaceuticalParticulars?.disposalAndHandling,
        conflictFields
      )
    },
    marketingAuthorisationHolder: mergeChplSectionPreservingLocal(
      baseChpl.marketingAuthorisationHolder,
      storedChpl.marketingAuthorisationHolder,
      '7',
      snapshotChpl?.marketingAuthorisationHolder,
      conflictFields
    ),
    marketingAuthorisationNumber: mergeChplSectionPreservingLocal(
      baseChpl.marketingAuthorisationNumber,
      storedChpl.marketingAuthorisationNumber,
      '8',
      snapshotChpl?.marketingAuthorisationNumber,
      conflictFields
    ),
    firstAuthorisationAndRenewal: mergeChplSectionPreservingLocal(
      baseChpl.firstAuthorisationAndRenewal,
      storedChpl.firstAuthorisationAndRenewal,
      '9',
      snapshotChpl?.firstAuthorisationAndRenewal,
      conflictFields
    ),
    revisionDate: mergeChplSectionPreservingLocal(
      baseChpl.revisionDate,
      storedChpl.revisionDate,
      '10',
      snapshotChpl?.revisionDate,
      conflictFields
    )
  };
};

const mergeDiscrepanciesPreservingLocal = (
  baseDiscrepancies: readonly SourceDiscrepancy[] | undefined,
  storedDiscrepancies: readonly SourceDiscrepancy[] | undefined
): SourceDiscrepancy[] | undefined => {
  const baseList = Array.isArray(baseDiscrepancies) ? baseDiscrepancies : [];
  const storedList = Array.isArray(storedDiscrepancies) ? storedDiscrepancies : [];

  if (baseList.length === 0 && storedList.length === 0) {
    return undefined;
  }

  const storedById = new Map<string, SourceDiscrepancy>();
  for (const sd of storedList) {
    if (sd && typeof sd.id === 'string' && !storedById.has(sd.id)) {
      storedById.set(sd.id, sd);
    }
  }

  const result: SourceDiscrepancy[] = [];
  const includedIds = new Set<string>();

  for (const bd of baseList) {
    includedIds.add(bd.id);
    const storedMatch = storedById.get(bd.id);
    if (storedMatch) {
      // Zachowaj bazowe wartości rozbieżności (np. 0,0289 vs 0,0298 µg),
      // jednocześnie bezwarunkowo chroniąc stan wyjaśnień i decyzji użytkownika.
      result.push({
        ...structuredClone(bd),
        status: storedMatch.status || bd.status,
        resolution: storedMatch.resolution
          ? structuredClone(storedMatch.resolution)
          : structuredClone(bd.resolution)
      });
    } else {
      result.push(structuredClone(bd));
    }
  }

  for (const sd of storedList) {
    if (sd && typeof sd.id === 'string' && !includedIds.has(sd.id)) {
      includedIds.add(sd.id);
      result.push(structuredClone(sd));
    }
  }

  return result;
};

const deduplicateHistory = (
  storedHistory: readonly StatusHistoryEntry[] | undefined,
  baseHistory: readonly StatusHistoryEntry[] | undefined
): StatusHistoryEntry[] | undefined => {
  const stored = Array.isArray(storedHistory) ? storedHistory : [];
  const base = Array.isArray(baseHistory) ? baseHistory : [];

  if (stored.length === 0 && base.length === 0) {
    return undefined;
  }

  const sourceList = stored.length > 0 ? stored : base;
  const seenIds = new Set<string>();
  const clean: StatusHistoryEntry[] = [];

  for (const entry of sourceList) {
    if (
      entry &&
      typeof entry.id === 'string' &&
      entry.id.length > 0 &&
      !seenIds.has(entry.id)
    ) {
      seenIds.add(entry.id);
      clean.push(structuredClone(entry));
    }
  }

  return clean.length > 0 ? clean : undefined;
};

/**
 * Deterministyczne, idempotentne i bezstratne scalanie:
 * DEFAULT VACCINES_CATALOG + PERSISTED USER STATE = MERGED VALIDATED CATALOG
 *
 * - Identyfikuje produkty wyłącznie po kanonicznym `id`.
 * - Dodaje nowe produkty z katalogu bazowego.
 * - Zachowuje lokalną historię, wyjaśnienia, notatki, statusy i rekordy niestandardowe użytkownika.
 * - Nie nadpisuje bezwarunkowo lokalnych treści przy zmianach w bazie — oznacza konflikt (`mergeConflict`).
 * - Wielokrotne uruchomienie na własnym wyniku zwraca identyczną strukturę (idempotentność).
 */
export const mergeVaccineCatalogWithStorage = (
  baseCatalog: readonly VaccineProduct[],
  storedVaccines: readonly VaccineProduct[],
  options: MergeCatalogOptions = {}
): MergeCatalogResult => {
  const baseCatalogVersion = options.baseCatalogVersion || CATALOG_DATA_VERSION;
  const baselineSnapshotById = options.baselineSnapshotById;

  const duplicateIds = findDuplicateVaccineIds(storedVaccines);
  const errors: string[] = [];
  const warnings: string[] = [];

  if (duplicateIds.length > 0) {
    errors.push(
      `Wykryto zduplikowane kanoniczne identyfikatory preparatów (ID) w stanie lokalnym: ${duplicateIds.join(', ')}.`
    );
  }

  const baseDuplicateIds = findDuplicateVaccineIds(baseCatalog);
  if (baseDuplicateIds.length > 0) {
    errors.push(
      `Wykryto duplikaty identyfikatorów w katalogu bazowym: ${baseDuplicateIds.join(', ')}.`
    );
  }

  // Mapa pierwszego poprawnego rekordu dla każdego kanonicznego ID ze stanu użytkownika
  const storedById = new Map<string, VaccineProduct>();
  for (const candidate of storedVaccines) {
    if (!isValidStoredVaccineRecord(candidate)) {
      warnings.push(
        `Pominięto niekompletny lokalny rekord bez poprawnego ID/nazwy/statusu (${String((candidate as { id?: unknown })?.id ?? 'brak ID')}).`
      );
      continue;
    }
    if (!storedById.has(candidate.id)) {
      storedById.set(candidate.id, candidate);
    }
  }

  const merged: VaccineProduct[] = [];
  const processedIds = new Set<string>();
  const addedIds: string[] = [];
  const preservedLocalIds: string[] = [];
  const customLocalIds: string[] = [];
  const conflictIds: string[] = [];

  for (const baseProduct of baseCatalog) {
    if (processedIds.has(baseProduct.id)) {
      continue;
    }
    processedIds.add(baseProduct.id);

    const storedProduct = storedById.get(baseProduct.id);
    if (!storedProduct) {
      const addedClone: VaccineProduct = {
        ...structuredClone(baseProduct),
        catalogDataVersion: baseProduct.catalogDataVersion || baseCatalogVersion
      };
      merged.push(addedClone);
      addedIds.push(baseProduct.id);
      continue;
    }

    preservedLocalIds.push(baseProduct.id);

    const conflictFields: string[] = [];
    const snapshot = baselineSnapshotById?.[baseProduct.id];

    // Wykryj zmiany w polach źródłowych/bazowych (bez nadpisywania wartości użytkownika)
    const baseSourceFields: (keyof Pick<
      VaccineProduct,
      | 'tradeName'
      | 'activeSubstance'
      | 'manufacturer'
      | 'pharmaceuticalForm'
      | 'marketingAuthorizationNumber'
      | 'rplRecordUrl'
      | 'currentChplUrl'
      | 'chplRevisionDate'
      | 'chplVersionDate'
      | 'atcCode'
    >)[] = [
      'tradeName',
      'activeSubstance',
      'manufacturer',
      'pharmaceuticalForm',
      'marketingAuthorizationNumber',
      'rplRecordUrl',
      'currentChplUrl',
      'chplRevisionDate',
      'chplVersionDate',
      'atcCode'
    ];

    for (const field of baseSourceFields) {
      const baseVal = baseProduct[field];
      const storedVal = storedProduct[field];
      if (
        baseVal !== undefined &&
        baseVal !== null &&
        storedVal !== undefined &&
        storedVal !== null &&
        baseVal !== storedVal
      ) {
        conflictFields.push(field);
      }
    }

    const mergedChpl = mergeChplStructures(
      baseProduct.chpl,
      storedProduct.chpl,
      snapshot?.chpl,
      conflictFields
    );

    const mergedDiscrepancies = mergeDiscrepanciesPreservingLocal(
      baseProduct.sourceDiscrepancies,
      storedProduct.sourceDiscrepancies
    );

    const mergedHistory = deduplicateHistory(
      storedProduct.statusHistory,
      baseProduct.statusHistory
    );

    // Zachowaj wcześniejszy konflikt lub zarejestruj nowo wykryty konflikt (deterministycznie!)
    const hasStatusHigherThanBase =
      STATUS_PRIORITY_ORDER[storedProduct.verificationStatus] >
      STATUS_PRIORITY_ORDER[baseProduct.verificationStatus];
    const hasVersionChangeWithLocalStatus =
      Boolean(options.storedCatalogVersion) &&
      options.storedCatalogVersion !== baseCatalogVersion &&
      storedProduct.verificationStatus !== baseProduct.verificationStatus;
    const hasBaseStatusChangedVsSnapshot =
      Boolean(snapshot) &&
      snapshot !== undefined &&
      snapshot.verificationStatus !== baseProduct.verificationStatus &&
      storedProduct.verificationStatus !== baseProduct.verificationStatus;
    const hasDirectStatusConflictWithBaseChanges =
      conflictFields.length > 0 &&
      (hasStatusHigherThanBase ||
        storedProduct.verificationStatus !== baseProduct.verificationStatus);

    let mergeConflict: CatalogMergeConflict | null | undefined =
      storedProduct.mergeConflict ? structuredClone(storedProduct.mergeConflict) : undefined;

    if (
      conflictFields.length > 0 ||
      hasDirectStatusConflictWithBaseChanges ||
      hasVersionChangeWithLocalStatus ||
      hasBaseStatusChangedVsSnapshot
    ) {
      const uniqueFields = Array.from(
        new Set([
          ...(mergeConflict?.conflictFields || []),
          ...conflictFields,
          ...(storedProduct.verificationStatus !== baseProduct.verificationStatus
            ? ['verificationStatus']
            : [])
        ])
      );
      mergeConflict = {
        hasBaseUpdateConflict: true,
        baseCatalogVersion,
        conflictFields: uniqueFields,
        localVerificationStatus: storedProduct.verificationStatus,
        baseVerificationStatus: baseProduct.verificationStatus,
        summary:
          'Wykryto różnicę między lokalnie zmodyfikowaną kartą a katalogiem bazowym. Zachowano stan lokalny, historię i decyzje personelu bez automatycznej zmiany statusu.'
      };
    }

    if (mergeConflict?.hasBaseUpdateConflict) {
      conflictIds.push(baseProduct.id);
    }

    const mergedRecord: VaccineProduct = {
      ...structuredClone(baseProduct),
      ...structuredClone(storedProduct),
      // Kanoniczne ID musi pochodzić z obiektu
      id: baseProduct.id,
      // Pola bazowe zachowują wersję użytkownika jeśli były zmodyfikowane (brak cichego nadpisania)
      tradeName: storedProduct.tradeName || baseProduct.tradeName,
      activeSubstance: storedProduct.activeSubstance || baseProduct.activeSubstance,
      manufacturer: storedProduct.manufacturer || baseProduct.manufacturer,
      pharmaceuticalForm: storedProduct.pharmaceuticalForm || baseProduct.pharmaceuticalForm,
      vaccineType: storedProduct.vaccineType || baseProduct.vaccineType,
      targetGroup: storedProduct.targetGroup || baseProduct.targetGroup,
      marketingAuthorizationNumber:
        storedProduct.marketingAuthorizationNumber ?? baseProduct.marketingAuthorizationNumber,
      rplRecordUrl: isValidHttpUrlOrNull(storedProduct.rplRecordUrl)
        ? (storedProduct.rplRecordUrl ?? baseProduct.rplRecordUrl)
        : baseProduct.rplRecordUrl,
      currentChplUrl: isValidHttpUrlOrNull(storedProduct.currentChplUrl)
        ? (storedProduct.currentChplUrl ?? baseProduct.currentChplUrl)
        : baseProduct.currentChplUrl,
      chplRevisionDate: storedProduct.chplRevisionDate ?? baseProduct.chplRevisionDate,
      chplVersionDate: storedProduct.chplVersionDate ?? baseProduct.chplVersionDate,
      documentDownloadDate:
        storedProduct.documentDownloadDate ?? baseProduct.documentDownloadDate,
      atcCode: storedProduct.atcCode ?? baseProduct.atcCode,
      // Bezwzględna ochrona statusu i danych lokalnych użytkownika
      verificationStatus: storedProduct.verificationStatus,
      userVerificationDate: storedProduct.userVerificationDate ?? null,
      userVerificationNotes: storedProduct.userVerificationNotes ?? null,
      clarificationDocument: storedProduct.clarificationDocument ?? null,
      clarificationDate: storedProduct.clarificationDate ?? null,
      clarificationSource: storedProduct.clarificationSource ?? null,
      importedVerificationClaim: storedProduct.importedVerificationClaim
        ? structuredClone(storedProduct.importedVerificationClaim)
        : undefined,
      mergeConflict,
      sourceDiscrepancies: mergedDiscrepancies,
      statusHistory: mergedHistory,
      catalogDataVersion: baseCatalogVersion,
      chpl: mergedChpl
    };

    // Zachowaj deterministyczną strukturę opcjonalnych pól undefined vs brak
    if (!mergedRecord.importedVerificationClaim) {
      delete mergedRecord.importedVerificationClaim;
    }
    if (!mergedRecord.mergeConflict) {
      delete mergedRecord.mergeConflict;
    }
    if (!mergedRecord.sourceDiscrepancies) {
      delete mergedRecord.sourceDiscrepancies;
    }
    if (!mergedRecord.statusHistory) {
      delete mergedRecord.statusHistory;
    }

    merged.push(mergedRecord);
  }

  // Zachowaj wszystkie poprawne rekordy użytkownika nieobecne w nowym katalogu bazowym
  for (const [id, storedProduct] of storedById.entries()) {
    if (processedIds.has(id)) {
      continue;
    }
    processedIds.add(id);
    customLocalIds.push(id);
    merged.push({
      ...structuredClone(storedProduct),
      catalogDataVersion: storedProduct.catalogDataVersion || baseCatalogVersion
    });
  }

  return {
    vaccines: merged,
    addedIds,
    preservedLocalIds,
    customLocalIds,
    conflictIds,
    duplicateIds,
    errors,
    warnings,
    catalogDataVersion: baseCatalogVersion
  };
};
