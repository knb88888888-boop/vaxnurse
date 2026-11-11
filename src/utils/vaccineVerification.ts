import type {
  ChPLSection,
  ChPLStructure,
  DiscrepancyResolution,
  DocumentVerificationCheck,
  SourceDiscrepancy,
  StatusHistoryEntry,
  VaccineProduct,
  VaccineVerificationStatus
} from '../types/vaccines.ts';
import {
  ALLOWED_VERIFICATION_STATUSES,
  CATALOG_DATA_VERSION,
  SUPPORTED_STORAGE_FORMAT_VERSION,
  VAX_CATALOG_META_KEY,
  findDuplicateVaccineIds,
  hasPrototypePollutionKey,
  isPlainRecord,
  isValidStoredVaccineRecord,
  mergeVaccineCatalogWithStorage,
  type MergeCatalogResult
} from './catalogMerge.ts';

export { CATALOG_DATA_VERSION, VAX_CATALOG_META_KEY, mergeVaccineCatalogWithStorage };

export const VAX_STORAGE_KEY = 'vaxnurse_vaccines_catalog_state_v1';
export const VAX_ACTIVE_ID_KEY = 'vaxnurse_active_vaccine_id_v1';
export const LOCAL_UNAUTHENTICATED_AUTHOR =
  'Personel punktu szczepień (zapis lokalny bez uwierzytelniania)';

export interface ClarificationFormFields {
  documentId: string;
  issuer: string;
  documentDate: string;
  receivedDate: string;
  documentUrlOrLocation: string;
  verifierJustification: string;
}

export interface DocumentCheckFormFields {
  docOpenedConfirmed: boolean;
  sourceDocumentLocation: string;
  docCheckDate: string;
  checkerNameAndRole: string;
  checkerJustification: string;
}

export interface FinalChplApprovalFields {
  fullChplVerifiedConfirmed: boolean;
  verifierName: string;
  verificationNotes: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface StorageReader {
  getItem: (key: string) => string | null;
}

export interface StorageWriter {
  setItem: (key: string, value: string) => void;
}

export interface LoadVaccinesResult {
  vaccines: VaccineProduct[];
  error: string | null;
  loadedFromStorage: boolean;
  mergeResult?: MergeCatalogResult;
  catalogDataVersion: string;
}

export interface SaveVaccinesResult {
  success: boolean;
  error: string | null;
}

export const formatVerificationTimestamp = (date: Date = new Date()): string => {
  const dateStr = date.toLocaleDateString('pl-PL');
  const timeStr = date.toLocaleTimeString('pl-PL', {
    hour: '2-digit',
    minute: '2-digit'
  });
  return `${dateStr} r., ${timeStr}`;
};

export const createHistoryEntryId = (): string =>
  `hist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const getUnresolvedDiscrepancies = (
  vaccine: VaccineProduct
): SourceDiscrepancy[] =>
  (vaccine.sourceDiscrepancies || []).filter(
    d => d.status !== 'resolved_with_official_document'
  );

export const isProductApprovalBlocked = (vaccine: VaccineProduct): boolean => {
  if (getUnresolvedDiscrepancies(vaccine).length > 0) {
    return true;
  }
  return (
    vaccine.verificationStatus !== 'ready_for_manual_verification' &&
    vaccine.verificationStatus !== 'verified_chpl'
  );
};

export const validateClarificationForm = (
  fields: Partial<ClarificationFormFields>
): ValidationResult => {
  const errors: Record<string, string> = {};

  if (!fields.documentId?.trim()) {
    errors.documentId =
      'Wymagane: Podaj identyfikator dokumentu (np. sygnatura URPL/DPR/2026/012 lub GSK-PL-VR-323859-CORR-01).';
  }
  if (!fields.issuer?.trim()) {
    errors.issuer =
      'Wymagane: Podaj instytucję lub podmiot wystawiający (np. URPLWMiPB lub GSK Services Sp. z o.o.).';
  }
  if (!fields.documentDate?.trim()) {
    errors.documentDate = 'Wymagane: Podaj datę wydania dokumentu urzędowego.';
  }
  if (!fields.receivedDate?.trim()) {
    errors.receivedDate =
      'Wymagane: Podaj datę otrzymania dokumentu przez punkt szczepień.';
  }
  if (!fields.documentUrlOrLocation?.trim()) {
    errors.documentUrlOrLocation =
      'Wymagane: Podaj odnośnik URL do rejestru lub lokalizację w archiwum punktu szczepień.';
  }
  if (!fields.verifierJustification?.trim()) {
    errors.verifierJustification =
      'Wymagane: Podaj uzasadnienie osoby weryfikującej, ocenę wpływu klinicznego i podpis.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateDocumentCheckForm = (
  fields: Partial<DocumentCheckFormFields>
): ValidationResult => {
  const errors: Record<string, string> = {};

  if (!fields.docOpenedConfirmed) {
    errors.docOpenedConfirmed =
      'Wymagane: Potwierdź otwarcie lub wskazanie dokumentu źródłowego (zaznacz pole wyboru).';
  }
  if (!fields.sourceDocumentLocation?.trim()) {
    errors.sourceDocumentLocation =
      'Wymagane: Wskaż adres URL lub lokalizację sprawdzanego dokumentu źródłowego.';
  }
  if (!fields.docCheckDate?.trim()) {
    errors.docCheckDate =
      'Wymagane: Podaj datę dokonania sprawdzenia dokumentu.';
  }
  if (!fields.checkerNameAndRole?.trim()) {
    errors.checkerNameAndRole =
      'Wymagane: Wskaż osobę dokonującą sprawdzenia (imię, nazwisko, tytuł zawodowy).';
  }
  if (!fields.checkerJustification?.trim()) {
    errors.checkerJustification =
      'Wymagane: Podaj uzasadnienie, dlaczego dokument rozwiązuje konkretną niezgodność.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateFinalChplApproval = (
  fields: Partial<FinalChplApprovalFields>
): ValidationResult => {
  const errors: Record<string, string> = {};

  if (!fields.fullChplVerifiedConfirmed) {
    errors.fullChplVerifiedConfirmed =
      'Wymagane: Potwierdź wykonanie osobnej, ręcznej weryfikacji całej dokumentacji ChPL (punkty 1–10).';
  }
  if (!fields.verifierName?.trim()) {
    errors.verifierName =
      'Wymagane: Wskaż osobę dokonującą końcowej weryfikacji całej dokumentacji ChPL.';
  }
  if (!fields.verificationNotes?.trim()) {
    errors.verificationNotes =
      'Wymagane: Wpisz zakres lub wynik ręcznej weryfikacji całej ChPL (punkty 1–10).';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const mapAllChplSections = (
  chpl: ChPLStructure,
  mapper: (sec: ChPLSection, baselineSec?: ChPLSection) => ChPLSection,
  baselineChpl?: ChPLStructure
): ChPLStructure => ({
  name: mapper(chpl.name, baselineChpl?.name),
  composition: mapper(chpl.composition, baselineChpl?.composition),
  pharmaceuticalForm: mapper(
    chpl.pharmaceuticalForm,
    baselineChpl?.pharmaceuticalForm
  ),
  clinicalParticulars: {
    indications: mapper(
      chpl.clinicalParticulars.indications,
      baselineChpl?.clinicalParticulars.indications
    ),
    dosageAndAdministration: mapper(
      chpl.clinicalParticulars.dosageAndAdministration,
      baselineChpl?.clinicalParticulars.dosageAndAdministration
    ),
    contraindications: mapper(
      chpl.clinicalParticulars.contraindications,
      baselineChpl?.clinicalParticulars.contraindications
    ),
    warningsAndPrecautions: mapper(
      chpl.clinicalParticulars.warningsAndPrecautions,
      baselineChpl?.clinicalParticulars.warningsAndPrecautions
    ),
    interactions: mapper(
      chpl.clinicalParticulars.interactions,
      baselineChpl?.clinicalParticulars.interactions
    ),
    fertilityPregnancyLactation: mapper(
      chpl.clinicalParticulars.fertilityPregnancyLactation,
      baselineChpl?.clinicalParticulars.fertilityPregnancyLactation
    ),
    driveAndMachines: mapper(
      chpl.clinicalParticulars.driveAndMachines,
      baselineChpl?.clinicalParticulars.driveAndMachines
    ),
    undesirableEffects: mapper(
      chpl.clinicalParticulars.undesirableEffects,
      baselineChpl?.clinicalParticulars.undesirableEffects
    ),
    overdose: mapper(
      chpl.clinicalParticulars.overdose,
      baselineChpl?.clinicalParticulars.overdose
    )
  },
  pharmacologicalProperties: {
    pharmacodynamics: mapper(
      chpl.pharmacologicalProperties.pharmacodynamics,
      baselineChpl?.pharmacologicalProperties.pharmacodynamics
    ),
    pharmacokinetics: mapper(
      chpl.pharmacologicalProperties.pharmacokinetics,
      baselineChpl?.pharmacologicalProperties.pharmacokinetics
    ),
    preclinicalSafety: mapper(
      chpl.pharmacologicalProperties.preclinicalSafety,
      baselineChpl?.pharmacologicalProperties.preclinicalSafety
    )
  },
  pharmaceuticalParticulars: {
    excipients: mapper(
      chpl.pharmaceuticalParticulars.excipients,
      baselineChpl?.pharmaceuticalParticulars.excipients
    ),
    incompatibilities: mapper(
      chpl.pharmaceuticalParticulars.incompatibilities,
      baselineChpl?.pharmaceuticalParticulars.incompatibilities
    ),
    shelfLife: mapper(
      chpl.pharmaceuticalParticulars.shelfLife,
      baselineChpl?.pharmaceuticalParticulars.shelfLife
    ),
    storageSpecialPrecautions: mapper(
      chpl.pharmaceuticalParticulars.storageSpecialPrecautions,
      baselineChpl?.pharmaceuticalParticulars.storageSpecialPrecautions
    ),
    containerNatureAndContents: mapper(
      chpl.pharmaceuticalParticulars.containerNatureAndContents,
      baselineChpl?.pharmaceuticalParticulars.containerNatureAndContents
    ),
    disposalAndHandling: mapper(
      chpl.pharmaceuticalParticulars.disposalAndHandling,
      baselineChpl?.pharmaceuticalParticulars.disposalAndHandling
    )
  },
  marketingAuthorisationHolder: mapper(
    chpl.marketingAuthorisationHolder,
    baselineChpl?.marketingAuthorisationHolder
  ),
  marketingAuthorisationNumber: mapper(
    chpl.marketingAuthorisationNumber,
    baselineChpl?.marketingAuthorisationNumber
  ),
  firstAuthorisationAndRenewal: mapper(
    chpl.firstAuthorisationAndRenewal,
    baselineChpl?.firstAuthorisationAndRenewal
  ),
  revisionDate: mapper(chpl.revisionDate, baselineChpl?.revisionDate)
});

const restoreChplSectionStatuses = (
  chpl: ChPLStructure,
  baselineChpl?: ChPLStructure,
  fallbackStatus: VaccineVerificationStatus = 'pending_verification'
): ChPLStructure =>
  mapAllChplSections(
    chpl,
    (sec, baseSec) => ({
      ...sec,
      verificationStatus: baseSec?.verificationStatus ?? fallbackStatus,
      verificationNote:
        baseSec?.verificationNote ??
        (sec.verificationStatus === 'verified_chpl'
          ? 'Punkt oczekuje na weryfikację z aktualnym drukiem ChPL w rejestrze RPL.'
          : sec.verificationNote)
    }),
    baselineChpl
  );

export const applyClarificationRegistration = (
  vaccine: VaccineProduct,
  fields: Partial<ClarificationFormFields>,
  now: Date = new Date()
):
  | { success: true; vaccine: VaccineProduct }
  | { success: false; errors: Record<string, string> } => {
  const validation = validateClarificationForm(fields);
  if (!validation.isValid) {
    return { success: false, errors: validation.errors };
  }

  const trimmedDocId = (fields.documentId ?? '').trim();
  const trimmedIssuer = (fields.issuer ?? '').trim();
  const trimmedDocDate = (fields.documentDate ?? '').trim();
  const trimmedReceivedDate = (fields.receivedDate ?? '').trim();
  const trimmedLocation = (fields.documentUrlOrLocation ?? '').trim();
  const trimmedJustification = (fields.verifierJustification ?? '').trim();

  const formattedTimestamp = formatVerificationTimestamp(now);
  const primaryDiscrepancy = vaccine.sourceDiscrepancies?.[0];

  const resolutionData: DiscrepancyResolution = {
    documentId: trimmedDocId,
    issuer: trimmedIssuer,
    documentDate: trimmedDocDate,
    receivedDate: trimmedReceivedDate,
    documentUrlOrLocation: trimmedLocation,
    verifierJustification: trimmedJustification,
    registeredAt: formattedTimestamp,
    registeredBy: LOCAL_UNAUTHENTICATED_AUTHOR,
    isResolved: false,
    clarificationDocument: `${trimmedDocId} (${trimmedIssuer})`,
    source: trimmedIssuer,
    verifierNotes: trimmedJustification,
    documentCheck: undefined
  };

  const updatedDiscrepancies: SourceDiscrepancy[] = (
    vaccine.sourceDiscrepancies || []
  ).map(d => ({
    ...d,
    status: 'clarification_submitted',
    resolution: resolutionData
  }));

  const historyEntry: StatusHistoryEntry = {
    id: createHistoryEntryId(),
    timestamp: formattedTimestamp,
    previousStatus: vaccine.verificationStatus,
    newStatus: 'requires_source_clarification',
    reason: `Zarejestrowano dane wyjaśnienia dla rozbieżności ${primaryDiscrepancy?.id || 'ChPL'} (dok. ${trimmedDocId}, wystawca: ${trimmedIssuer}). Status niezgodności: clarification_submitted. Status preparatu pozostał requires_source_clarification; zatwierdzenie nadal zablokowane do czasu ręcznej kontroli dokumentu (Etap 2).`,
    author: LOCAL_UNAUTHENTICATED_AUTHOR
  };

  const updated: VaccineProduct = {
    ...vaccine,
    verificationStatus: 'requires_source_clarification',
    clarificationDocument: trimmedDocId,
    clarificationDate: trimmedReceivedDate,
    clarificationSource: trimmedIssuer,
    userVerificationDate: null,
    userVerificationNotes: null,
    sourceDiscrepancies: updatedDiscrepancies,
    statusHistory: [historyEntry, ...(vaccine.statusHistory || [])]
  };

  return { success: true, vaccine: updated };
};

export const applyDocumentCheckConfirmation = (
  vaccine: VaccineProduct,
  fields: Partial<DocumentCheckFormFields>,
  now: Date = new Date()
):
  | { success: true; vaccine: VaccineProduct }
  | { success: false; errors: Record<string, string> } => {
  const primaryDiscrepancy = vaccine.sourceDiscrepancies?.[0];
  const existingResolution = primaryDiscrepancy?.resolution;

  const etap1Check = validateClarificationForm(existingResolution || {});
  if (
    !primaryDiscrepancy ||
    primaryDiscrepancy.status !== 'clarification_submitted' ||
    !etap1Check.isValid
  ) {
    return {
      success: false,
      errors: {
        _form:
          'Ręczna kontrola dokumentu wymaga wcześniejszego zarejestrowania kompletnych 6 pól wyjaśnienia w Etapie 1.'
      }
    };
  }

  const resolvedLocation =
    fields.sourceDocumentLocation?.trim() ||
    existingResolution?.documentUrlOrLocation?.trim() ||
    '';

  const validation = validateDocumentCheckForm({
    ...fields,
    sourceDocumentLocation: resolvedLocation
  });

  if (!validation.isValid) {
    return { success: false, errors: validation.errors };
  }

  const formattedTimestamp = formatVerificationTimestamp(now);
  const trimmedDate = (fields.docCheckDate ?? '').trim();
  const trimmedChecker = (fields.checkerNameAndRole ?? '').trim();
  const trimmedJustification = (fields.checkerJustification ?? '').trim();

  const documentCheck: DocumentVerificationCheck = {
    sourceDocumentOpenedOrIndicated: true,
    sourceDocumentLocation: resolvedLocation,
    checkDate: trimmedDate,
    checkerNameAndRole: trimmedChecker,
    checkerJustification: trimmedJustification,
    isConfirmed: true,
    confirmedAt: formattedTimestamp
  };

  const resolutionData: DiscrepancyResolution = {
    ...existingResolution!,
    documentUrlOrLocation: resolvedLocation,
    documentCheck,
    isResolved: true
  };

  const updatedDiscrepancies: SourceDiscrepancy[] = (
    vaccine.sourceDiscrepancies || []
  ).map(d => ({
    ...d,
    status: 'resolved_with_official_document',
    resolution: resolutionData
  }));

  const historyEntry: StatusHistoryEntry = {
    id: createHistoryEntryId(),
    timestamp: formattedTimestamp,
    previousStatus: vaccine.verificationStatus,
    newStatus: 'ready_for_manual_verification',
    reason: `Ręcznie potwierdzono sprawdzenie dokumentu źródłowego (oświadczenie lokalne bez uwierzytelniania tożsamości; wskazane przez użytkownika: ${trimmedChecker}, data sprawdzenia: ${trimmedDate}). Niezgodność ${primaryDiscrepancy.id} zmieniła status na resolved_with_official_document. Status preparatu ustawiono na ready_for_manual_verification (karta oczekuje na osobną ręczną weryfikację całej ChPL).`,
    author: `${trimmedChecker} (zapis lokalny)`
  };

  const updated: VaccineProduct = {
    ...vaccine,
    verificationStatus: 'ready_for_manual_verification',
    userVerificationDate: null,
    userVerificationNotes: null,
    sourceDiscrepancies: updatedDiscrepancies,
    statusHistory: [historyEntry, ...(vaccine.statusHistory || [])]
  };

  return { success: true, vaccine: updated };
};

export const applyFinalChplApproval = (
  vaccine: VaccineProduct,
  fields: Partial<FinalChplApprovalFields>,
  now: Date = new Date()
):
  | { success: true; vaccine: VaccineProduct }
  | { success: false; errors: Record<string, string>; blockedReason?: string } => {
  if (
    isProductApprovalBlocked(vaccine) ||
    vaccine.verificationStatus !== 'ready_for_manual_verification'
  ) {
    return {
      success: false,
      errors: {},
      blockedReason:
        'Blokada bezpieczeństwa: Ostateczne zatwierdzenie karty (verified_chpl) jest możliwe wyłącznie w stanie ready_for_manual_verification po formalnej rejestracji i ręcznym sprawdzeniu dokumentu rozwiązującego wszystkie niezgodności.'
    };
  }

  const validation = validateFinalChplApproval(fields);
  if (!validation.isValid) {
    return { success: false, errors: validation.errors };
  }

  const formattedTimestamp = formatVerificationTimestamp(now);
  const trimmedVerifier = (fields.verifierName ?? '').trim();
  const trimmedNotes = (fields.verificationNotes ?? '').trim();

  const updatedChpl = mapAllChplSections(vaccine.chpl, sec => ({
    ...sec,
    verificationStatus: 'verified_chpl',
    verificationNote:
      'Zweryfikowano z oficjalną dokumentacją ChPL przez personel punktu szczepień (zapis lokalny).'
  }));

  const historyEntry: StatusHistoryEntry = {
    id: createHistoryEntryId(),
    timestamp: formattedTimestamp,
    previousStatus: vaccine.verificationStatus,
    newStatus: 'verified_chpl',
    reason: `Ostateczne zatwierdzenie całej dokumentacji ChPL (punkty 1–10) po osobnej ręcznej weryfikacji. Zakres/uwagi: ${trimmedNotes}`,
    author: `${trimmedVerifier} (zapis lokalny)`
  };

  const updated: VaccineProduct = {
    ...vaccine,
    verificationStatus: 'verified_chpl',
    userVerificationDate: formattedTimestamp,
    userVerificationNotes: trimmedNotes,
    importedVerificationClaim: undefined,
    mergeConflict: undefined,
    statusHistory: [historyEntry, ...(vaccine.statusHistory || [])],
    chpl: updatedChpl
  };

  return { success: true, vaccine: updated };
};

export const revokeFinalChplApproval = (
  vaccine: VaccineProduct,
  baselineVaccine?: VaccineProduct,
  author: string = LOCAL_UNAUTHENTICATED_AUTHOR,
  now: Date = new Date()
): VaccineProduct => {
  const formattedTimestamp = formatVerificationTimestamp(now);
  const updatedChpl = restoreChplSectionStatuses(
    vaccine.chpl,
    baselineVaccine?.chpl,
    'pending_verification'
  );

  const historyEntry: StatusHistoryEntry = {
    id: createHistoryEntryId(),
    timestamp: formattedTimestamp,
    previousStatus: vaccine.verificationStatus,
    newStatus: 'ready_for_manual_verification',
    reason:
      'Ręczne cofnięcie zatwierdzenia karty ChPL przez personel (powrót do etapu: ready_for_manual_verification).',
    author
  };

  return {
    ...vaccine,
    verificationStatus: 'ready_for_manual_verification',
    userVerificationDate: null,
    userVerificationNotes: null,
    statusHistory: [historyEntry, ...(vaccine.statusHistory || [])],
    chpl: updatedChpl
  };
};

export const revokeDocumentCheckToSubmitted = (
  vaccine: VaccineProduct,
  baselineVaccine?: VaccineProduct,
  author?: string,
  now: Date = new Date()
): VaccineProduct => {
  const formattedTimestamp = formatVerificationTimestamp(now);
  const existingResolution = vaccine.sourceDiscrepancies?.[0]?.resolution;

  const updatedDiscrepancies: SourceDiscrepancy[] = (
    vaccine.sourceDiscrepancies || []
  ).map(d => ({
    ...d,
    status: 'clarification_submitted',
    resolution: {
      documentId: existingResolution?.documentId || vaccine.clarificationDocument || '',
      issuer: existingResolution?.issuer || vaccine.clarificationSource || '',
      documentDate: existingResolution?.documentDate || '',
      receivedDate: existingResolution?.receivedDate || vaccine.clarificationDate || '',
      documentUrlOrLocation: existingResolution?.documentUrlOrLocation || '',
      verifierJustification: existingResolution?.verifierJustification || '',
      registeredAt: existingResolution?.registeredAt,
      registeredBy: existingResolution?.registeredBy,
      clarificationDocument: existingResolution?.clarificationDocument,
      source: existingResolution?.source,
      verifierNotes: existingResolution?.verifierNotes,
      documentCheck: undefined,
      isResolved: false
    }
  }));

  const updatedChpl = restoreChplSectionStatuses(
    vaccine.chpl,
    baselineVaccine?.chpl,
    'pending_verification'
  );

  const historyEntry: StatusHistoryEntry = {
    id: createHistoryEntryId(),
    timestamp: formattedTimestamp,
    previousStatus: vaccine.verificationStatus,
    newStatus: 'requires_source_clarification',
    reason:
      'Cofnięto ręczne sprawdzenie dokumentu. Status niezgodności powrócił do clarification_submitted, a preparatu do requires_source_clarification (zatwierdzenie ponownie zablokowane).',
    author: author?.trim() || LOCAL_UNAUTHENTICATED_AUTHOR
  };

  return {
    ...vaccine,
    verificationStatus: 'requires_source_clarification',
    userVerificationDate: null,
    userVerificationNotes: null,
    sourceDiscrepancies: updatedDiscrepancies,
    statusHistory: [historyEntry, ...(vaccine.statusHistory || [])],
    chpl: updatedChpl
  };
};

export const resetVaccineClarificationToInitial = (
  vaccine: VaccineProduct,
  baselineVaccine?: VaccineProduct,
  now: Date = new Date()
): VaccineProduct => {
  const formattedTimestamp = formatVerificationTimestamp(now);
  const hasDiscrepancies = (vaccine.sourceDiscrepancies?.length ?? 0) > 0;
  const targetStatus: VaccineVerificationStatus =
    baselineVaccine?.verificationStatus ??
    (hasDiscrepancies ? 'requires_source_clarification' : 'pending_verification');

  const updatedDiscrepancies: SourceDiscrepancy[] | undefined =
    vaccine.sourceDiscrepancies?.map(d => ({
      ...d,
      status: 'requires_clarification',
      resolution: {
        documentId: '',
        issuer: '',
        documentDate: '',
        receivedDate: '',
        documentUrlOrLocation: '',
        verifierJustification: '',
        isResolved: false,
        documentCheck: undefined
      }
    }));

  const updatedChpl = restoreChplSectionStatuses(
    vaccine.chpl,
    baselineVaccine?.chpl,
    'pending_verification'
  );

  const historyEntry: StatusHistoryEntry = {
    id: createHistoryEntryId(),
    timestamp: formattedTimestamp,
    previousStatus: vaccine.verificationStatus,
    newStatus: targetStatus,
    reason:
      'Po potwierdzeniu użytkownika przywrócono stan początkowy wyjaśnienia i weryfikacji preparatu (niezgodność: requires_clarification, zatwierdzenie zablokowane). Lokalna historia zmian została zachowana.',
    author: LOCAL_UNAUTHENTICATED_AUTHOR
  };

  return {
    ...vaccine,
    verificationStatus: targetStatus,
    clarificationDocument: null,
    clarificationDate: null,
    clarificationSource: null,
    userVerificationDate: null,
    userVerificationNotes: null,
    sourceDiscrepancies: updatedDiscrepancies,
    statusHistory: [historyEntry, ...(vaccine.statusHistory || [])],
    chpl: updatedChpl
  };
};

export const resetCatalogPreservingHistory = (
  currentVaccines: VaccineProduct[],
  baselineCatalog: VaccineProduct[],
  now: Date = new Date()
): VaccineProduct[] => {
  const formattedTimestamp = formatVerificationTimestamp(now);

  return baselineCatalog.map(baseline => {
    const existing = currentVaccines.find(v => v.id === baseline.id);
    const clonedBaseline: VaccineProduct = JSON.parse(JSON.stringify(baseline));

    if (!existing) {
      return clonedBaseline;
    }

    const existingHistory = Array.isArray(existing.statusHistory)
      ? existing.statusHistory
      : [];
    const baselineHistory = Array.isArray(clonedBaseline.statusHistory)
      ? clonedBaseline.statusHistory
      : [];

    const preservedHistory =
      existingHistory.length > 0 ? existingHistory : baselineHistory;

    const wasModified =
      existing.verificationStatus !== baseline.verificationStatus ||
      Boolean(existing.clarificationDocument) ||
      Boolean(existing.userVerificationDate) ||
      (existing.sourceDiscrepancies || []).some(
        d => d.status !== 'requires_clarification'
      );

    if (!wasModified && preservedHistory.length === baselineHistory.length) {
      return {
        ...clonedBaseline,
        statusHistory: preservedHistory
      };
    }

    const resetEntry: StatusHistoryEntry = {
      id: createHistoryEntryId(),
      timestamp: formattedTimestamp,
      previousStatus: existing.verificationStatus,
      newStatus: baseline.verificationStatus,
      reason:
        'Po świadomym potwierdzeniu użytkownika przywrócono stan początkowy danych katalogu (zachowano wcześniejszą lokalną historię zmian).',
      author: LOCAL_UNAUTHENTICATED_AUTHOR
    };

    return {
      ...clonedBaseline,
      statusHistory: [resetEntry, ...preservedHistory]
    };
  });
};

const readStoredCatalogMeta = (
  storage: StorageReader | null | undefined
): {
  storageFormatVersion?: number;
  catalogDataVersion?: string;
  baselineSnapshotById?: Record<string, VaccineProduct>;
} => {
  if (!storage) {
    return {};
  }
  try {
    const rawMeta = storage.getItem(VAX_CATALOG_META_KEY);
    if (!rawMeta) {
      return {};
    }
    const parsed: unknown = JSON.parse(rawMeta);
    if (!isPlainRecord(parsed)) {
      return {};
    }
    return {
      storageFormatVersion:
        typeof parsed.storageFormatVersion === 'number'
          ? parsed.storageFormatVersion
          : undefined,
      catalogDataVersion:
        typeof parsed.catalogDataVersion === 'string'
          ? parsed.catalogDataVersion
          : undefined,
      baselineSnapshotById: isPlainRecord(parsed.baselineSnapshotById)
        ? (parsed.baselineSnapshotById as Record<string, VaccineProduct>)
        : undefined
    };
  } catch {
    return {};
  }
};

export const loadVaccinesFromStorage = (
  storage: StorageReader | null | undefined,
  fallbackCatalog: readonly VaccineProduct[]
): LoadVaccinesResult => {
  if (!storage) {
    const defaultMerge = mergeVaccineCatalogWithStorage(fallbackCatalog, []);
    return {
      vaccines: defaultMerge.vaccines,
      error:
        'Pamięć podręczna przeglądarki (localStorage) jest niedostępna. Załadowano domyślny katalog referencyjny (zmiany nie zostaną zapisane lokalnie).',
      loadedFromStorage: false,
      mergeResult: defaultMerge,
      catalogDataVersion: CATALOG_DATA_VERSION
    };
  }

  let raw: string | null = null;
  try {
    raw = storage.getItem(VAX_STORAGE_KEY);
  } catch (e) {
    console.warn('Błąd odczytu bazy szczepionek z localStorage:', e);
    const defaultMerge = mergeVaccineCatalogWithStorage(fallbackCatalog, []);
    return {
      vaccines: defaultMerge.vaccines,
      error:
        'Błąd odczytu pamięci podręcznej przeglądarki (localStorage): Brak dostępu do zapisanego stanu. Załadowano domyślny katalog referencyjny.',
      loadedFromStorage: false,
      mergeResult: defaultMerge,
      catalogDataVersion: CATALOG_DATA_VERSION
    };
  }

  if (!raw) {
    const defaultMerge = mergeVaccineCatalogWithStorage(fallbackCatalog, []);
    return {
      vaccines: defaultMerge.vaccines,
      error: null,
      loadedFromStorage: false,
      mergeResult: defaultMerge,
      catalogDataVersion: CATALOG_DATA_VERSION
    };
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (hasPrototypePollutionKey(parsed)) {
      const defaultMerge = mergeVaccineCatalogWithStorage(fallbackCatalog, []);
      return {
        vaccines: defaultMerge.vaccines,
        error:
          'Błąd odczytu pamięci podręcznej przeglądarki (localStorage): Wykryto niedozwolone klucze obiektu w zapisanych danych. Załadowano domyślny katalog referencyjny bez nadpisywania pamięci.',
        loadedFromStorage: false,
        mergeResult: defaultMerge,
        catalogDataVersion: CATALOG_DATA_VERSION
      };
    }

    const meta = readStoredCatalogMeta(storage);
    if (
      typeof meta.storageFormatVersion === 'number' &&
      meta.storageFormatVersion > SUPPORTED_STORAGE_FORMAT_VERSION
    ) {
      const defaultMerge = mergeVaccineCatalogWithStorage(fallbackCatalog, []);
      return {
        vaccines: defaultMerge.vaccines,
        error: `Błąd odczytu pamięci podręcznej przeglądarki (localStorage): Zapisany stan używa nowszej wersji formatu (v${meta.storageFormatVersion}) nieobsługiwanej przez tę wersję aplikacji. Istniejące dane w pamięci pozostawiono nienaruszone.`,
        loadedFromStorage: false,
        mergeResult: defaultMerge,
        catalogDataVersion: CATALOG_DATA_VERSION
      };
    }

    let storedVaccinesInput: unknown = null;
    let storedCatalogVersion: string | null = null;

    if (Array.isArray(parsed)) {
      storedVaccinesInput = parsed;
    } else if (isPlainRecord(parsed)) {
      const versionCandidate = parsed.storageFormatVersion;
      if (
        typeof versionCandidate === 'number' &&
        versionCandidate > SUPPORTED_STORAGE_FORMAT_VERSION
      ) {
        const defaultMerge = mergeVaccineCatalogWithStorage(fallbackCatalog, []);
        return {
          vaccines: defaultMerge.vaccines,
          error: `Błąd odczytu pamięci podręcznej przeglądarki (localStorage): Zapisany stan używa nowszego formatu (v${versionCandidate}) nieobsługiwanego przez tę wersję aplikacji. Istniejące dane w pamięci pozostawiono nienaruszone.`,
          loadedFromStorage: false,
          mergeResult: defaultMerge,
          catalogDataVersion: CATALOG_DATA_VERSION
        };
      }
      if (
        typeof versionCandidate === 'number' &&
        versionCandidate <= SUPPORTED_STORAGE_FORMAT_VERSION &&
        Array.isArray(parsed.vaccines)
      ) {
        storedVaccinesInput = parsed.vaccines;
        storedCatalogVersion =
          typeof parsed.catalogDataVersion === 'string'
            ? parsed.catalogDataVersion
            : null;
      }
    }

    if (!Array.isArray(storedVaccinesInput)) {
      const defaultMerge = mergeVaccineCatalogWithStorage(fallbackCatalog, []);
      return {
        vaccines: defaultMerge.vaccines,
        error:
          'Błąd odczytu pamięci podręcznej przeglądarki (localStorage): Zapisane dane mają nieprawidłową strukturę. Załadowano domyślny katalog referencyjny bez usuwania zawartości pamięci.',
        loadedFromStorage: false,
        mergeResult: defaultMerge,
        catalogDataVersion: CATALOG_DATA_VERSION
      };
    }

    const duplicateIdsInRaw = findDuplicateVaccineIds(
      storedVaccinesInput as { id?: unknown }[]
    );

    // Migracja stanu z niekompletnymi polami dla znanych kanonicznych ID bazy
    const baseById = new Map(fallbackCatalog.map(b => [b.id, b]));
    const normalizedItems: VaccineProduct[] = [];
    for (const rawItem of storedVaccinesInput) {
      if (isValidStoredVaccineRecord(rawItem)) {
        normalizedItems.push(rawItem);
        continue;
      }
      if (isPlainRecord(rawItem) && typeof rawItem.id === 'string') {
        const baseFallback = baseById.get(rawItem.id);
        if (baseFallback) {
          const statusCandidate = rawItem.verificationStatus;
          if (
            statusCandidate === undefined ||
            (typeof statusCandidate === 'string' &&
              (ALLOWED_VERIFICATION_STATUSES as readonly string[]).includes(
                statusCandidate
              ))
          ) {
            normalizedItems.push({
              ...structuredClone(baseFallback),
              ...(rawItem as Partial<VaccineProduct>),
              id: baseFallback.id,
              tradeName:
                typeof rawItem.tradeName === 'string' && rawItem.tradeName.trim()
                  ? rawItem.tradeName
                  : baseFallback.tradeName,
              verificationStatus:
                (statusCandidate as VaccineVerificationStatus | undefined) ??
                baseFallback.verificationStatus,
              chpl: isPlainRecord(rawItem.chpl)
                ? (rawItem.chpl as unknown as ChPLStructure)
                : structuredClone(baseFallback.chpl)
            });
          }
        }
      }
    }

    if (normalizedItems.length === 0) {
      const defaultMerge = mergeVaccineCatalogWithStorage(fallbackCatalog, []);
      return {
        vaccines: defaultMerge.vaccines,
        error:
          'Błąd odczytu pamięci podręcznej przeglądarki (localStorage): Brak poprawnych rekordów preparatów w pamięci. Załadowano domyślny katalog referencyjny bez nadpisywania pamięci.',
        loadedFromStorage: false,
        mergeResult: defaultMerge,
        catalogDataVersion: CATALOG_DATA_VERSION
      };
    }

    const mergeResult = mergeVaccineCatalogWithStorage(
      fallbackCatalog,
      normalizedItems,
      {
        baselineSnapshotById: meta.baselineSnapshotById,
        baseCatalogVersion: CATALOG_DATA_VERSION,
        storedCatalogVersion: storedCatalogVersion ?? meta.catalogDataVersion ?? null
      }
    );

    const errorParts: string[] = [];
    if (duplicateIdsInRaw.length > 0) {
      errorParts.push(
        `Wykryto zduplikowane identyfikatory preparatów (ID) w localStorage: ${duplicateIdsInRaw.join(', ')}. Zachowano pierwsze poprawne wystąpienie każdego rekordu bez nadpisywania pamięci.`
      );
    }
    if (normalizedItems.length < storedVaccinesInput.length) {
      errorParts.push(
        `Pominięto ${storedVaccinesInput.length - normalizedItems.length} uszkodzonych lub niekompletnych wpisów z pamięci lokalnej.`
      );
    }

    return {
      vaccines: mergeResult.vaccines,
      error: errorParts.length > 0 ? errorParts.join(' ') : null,
      loadedFromStorage: true,
      mergeResult,
      catalogDataVersion: CATALOG_DATA_VERSION
    };
  } catch (e) {
    console.warn('Błąd parsowania danych bazy szczepionek z localStorage:', e);
    const defaultMerge = mergeVaccineCatalogWithStorage(fallbackCatalog, []);
    return {
      vaccines: defaultMerge.vaccines,
      error:
        'Błąd odczytu pamięci podręcznej przeglądarki (localStorage): Zapisany stan JSON jest uszkodzony. Załadowano domyślny katalog referencyjny bez automatycznego czyszczenia pamięci.',
      loadedFromStorage: false,
      mergeResult: defaultMerge,
      catalogDataVersion: CATALOG_DATA_VERSION
    };
  }
};

export const validateCatalogBeforeSave = (
  vaccines: readonly VaccineProduct[]
): { isValid: boolean; error: string | null } => {
  if (!Array.isArray(vaccines) || vaccines.length === 0) {
    return {
      isValid: false,
      error: 'Błąd walidacji przed zapisem: katalog preparatów nie może być pusty.'
    };
  }

  const duplicateIds = findDuplicateVaccineIds(vaccines);
  if (duplicateIds.length > 0) {
    return {
      isValid: false,
      error: `Błąd walidacji przed zapisem: wykryto zduplikowane identyfikatory preparatów (ID): ${duplicateIds.join(', ')}. Poprzedni stan w pamięci pozostał nietknięty.`
    };
  }

  for (let i = 0; i < vaccines.length; i++) {
    if (!isValidStoredVaccineRecord(vaccines[i])) {
      return {
        isValid: false,
        error: `Błąd walidacji przed zapisem: rekord nr ${i + 1} ma nieprawidłową strukturę lub brakujące wymagane pola. Poprzedni stan w pamięci pozostał nietknięty.`
      };
    }
  }

  return { isValid: true, error: null };
};

export const saveVaccinesToStorage = (
  storage: StorageWriter | null | undefined,
  vaccines: VaccineProduct[]
): SaveVaccinesResult => {
  if (!storage) {
    return {
      success: false,
      error:
        'Błąd zapisu w pamięci podręcznej przeglądarki (localStorage): Pamięć lokalna jest niedostępna w tej przeglądarce.'
    };
  }

  const validation = validateCatalogBeforeSave(vaccines);
  if (!validation.isValid) {
    return {
      success: false,
      error: validation.error
    };
  }

  try {
    const serialized = JSON.stringify(vaccines);
    storage.setItem(VAX_STORAGE_KEY, serialized);

    try {
      const meta = {
        storageFormatVersion: SUPPORTED_STORAGE_FORMAT_VERSION,
        catalogDataVersion: CATALOG_DATA_VERSION,
        updatedAt: new Date().toISOString()
      };
      storage.setItem(VAX_CATALOG_META_KEY, JSON.stringify(meta));
    } catch {
      // Nie unieważniaj głównego zapisu katalogu, jeśli meta nie zmieściło się w limicie
    }

    return { success: true, error: null };
  } catch (e) {
    console.warn('Błąd zapisu bazy szczepionek do localStorage:', e);
    return {
      success: false,
      error:
        'Błąd zapisu w pamięci podręcznej przeglądarki (localStorage): Nie udało się utrwalić wprowadzonych zmian. Sprawdź ilość wolnego miejsca lub uprawnienia pamięci w przeglądarce.'
    };
  }
};
