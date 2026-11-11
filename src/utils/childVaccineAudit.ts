import type {
  CatalogCardCompletenessStatus,
  ChildVaccineItem,
  ChplAuditSectionNumber,
  ChplContentAuditRecord,
  ChplContentVerificationStatus,
  ChplManualQueueGroup,
  ChplManualQueueItem,
  ChplManualQueuePriority,
  ChplReferenceStatus,
  ChplSectionAuditEntry,
  ChplVerificationStatus,
  FundingScopeAuditEntry,
  FundingScopeBreakdown,
  PendingFundingAuditReport,
  PendingFundingProcedureDetail,
  ProcedureProductAdequacyStatus,
  Stage1ChplAuditBundle,
  Stage1ChplProductKey,
} from '../types/childVaccines.ts';
import type { VaccineProduct } from '../types/vaccines.ts';

export const REQUIRED_CHPL_SECTION_NUMBERS: ChplAuditSectionNumber[] = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
];

export const REQUIRED_SECTION_4_SUBPOINTS: string[] = [
  '4.1',
  '4.2',
  '4.3',
  '4.4',
  '4.5',
  '4.6',
  '4.7',
  '4.8',
  '4.9',
];

/**
 * Procedury PSO 2027, w których finansowanie zależy od odrębnych przepisów refundacyjnych
 * lub wyboru produktu handlowego i nie pozwala na nadanie jednego statusu procedury.
 * (COVID-19 sezon 2026/2027 ma potwierdzony Komunikat nr 39 MZ z 04/07.09.2026 r., więc nie znajduje się na tej liście).
 */
export const EXTERNAL_FUNDING_PENDING_IDS = new Set<string>([
  'pso-rec-influenza-1',
  'pso-rec-hpv-catchup',
]);

const PLACEHOLDER_VALUE_REGEX = /^(brak(\s+danych)?|n\/?d|tbd|none|null|undefined|-+|nieznan[ae]?|brak informacji.*)$/i;
const GENERIC_RUBBER_STAMP_REGEX = /^(ok|tak|zweryfikowano|sprawdzono|zgodne?|brak uwag|bez uwag|zaliczono|passed)\.?$/i;
const CALENDAR_DATE_REGEX = /^(\d{2}\.\d{2}\.\d{4}|\d{4}-\d{2}-\d{2})$/;

function isPlaceholderValue(value: string | null | undefined): boolean {
  if (!value || !value.trim()) return true;
  return PLACEHOLDER_VALUE_REGEX.test(value.trim());
}

function isSubstantiveVerificationNote(value: string | null | undefined, minLength = 15): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (trimmed.length < minLength) return false;
  if (isPlaceholderValue(trimmed)) return false;
  if (GENERIC_RUBBER_STAMP_REGEX.test(trimmed)) return false;
  return true;
}

function isValidPageRef(value: string | null | undefined): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (trimmed.length < 3 || isPlaceholderValue(trimmed)) return false;
  return true;
}

function validateSectionSubpoints(
  entry: ChplSectionAuditEntry,
  issues: string[]
): void {
  const subpoints = entry.subpoints ?? [];

  if (entry.sectionNumber === '4') {
    if (subpoints.length === 0) {
      issues.push(
        'Punkt 4 ChPL (Dane kliniczne) wymaga jawnej analizy wszystkich podpunktów 4.1–4.9 w polu subpoints (samo odhaczenie sekcji 4 nie wystarcza).'
      );
      return;
    }

    for (const requiredId of REQUIRED_SECTION_4_SUBPOINTS) {
      const matches = subpoints.filter(sp => sp.subpointId === requiredId);
      if (matches.length === 0) {
        issues.push(`Brak wymaganego podpunktu ${requiredId} w analizie sekcji 4 ChPL (subpoints).`);
      } else if (matches.length > 1) {
        issues.push(`Zduplikowany wpis podpunktu ${requiredId} w analizie sekcji 4 ChPL.`);
      }
    }
  }

  const seenIds = new Set<string>();
  for (const sp of subpoints) {
    if (seenIds.has(sp.subpointId)) {
      if (entry.sectionNumber !== '4') {
        issues.push(`Zduplikowany wpis podpunktu ${sp.subpointId} w sekcji ${entry.sectionNumber} ChPL.`);
      }
      continue;
    }
    seenIds.add(sp.subpointId);

    if (sp.discrepancyNote && sp.discrepancyNote.trim().length > 0) {
      issues.push(
        `Podpunkt ${sp.subpointId} ChPL zawiera otwartą niezgodność/uwagę wymagającą wyjaśnienia: ${sp.discrepancyNote.trim()}`
      );
    }

    if (sp.status === 'not_present_in_document' || sp.status === 'not_applicable') {
      const justif = sp.justification?.trim() ?? '';
      if (isPlaceholderValue(justif) || GENERIC_RUBBER_STAMP_REGEX.test(justif) || justif.length < 10) {
        issues.push(
          `Podpunkt ${sp.subpointId} ChPL oznaczony jako '${sp.status}' wymaga konkretnego, jawnego uzasadnienia (min. 10 znaków).`
        );
      }
    } else if (sp.status === 'verified') {
      const effectivePageRef = sp.pageRef ?? entry.pageRef;
      if (!isValidPageRef(effectivePageRef)) {
        issues.push(
          `Podpunkt ${sp.subpointId} ChPL oznaczony jako 'verified' wymaga wskazania odniesienia do strony dokumentu (pageRef).`
        );
      }
      if (!isSubstantiveVerificationNote(sp.verificationNote, 12)) {
        issues.push(
          `Podpunkt ${sp.subpointId} ChPL oznaczony jako 'verified' wymaga merytorycznej notatki weryfikacyjnej (min. 12 znaków, bez ogólników).`
        );
      }
    } else {
      issues.push(`Nieprawidłowy status podpunktu ${sp.subpointId} w sekcji ${entry.sectionNumber} ChPL.`);
    }
  }
}

/**
 * Deterministyczne mapowanie stanu dokumentu ChPL i statusu weryfikacji jego treści
 * na ujednolicony status końcowy chplVerificationStatus.
 */
export function deriveChplVerificationStatus(
  referenceStatus: ChplReferenceStatus,
  contentStatus: ChplContentVerificationStatus
): ChplVerificationStatus {
  if (referenceStatus !== 'official_document_identified') {
    return 'pending_chpl_verification';
  }
  if (contentStatus === 'verified_full') {
    return 'verified_chpl';
  }
  if (contentStatus === 'analyzed_with_discrepancy') {
    return 'requires_source_clarification';
  }
  return 'pending_chpl_verification';
}

function isValidChplAuditRecord(
  audit: ChplContentAuditRecord | null | undefined,
  item?: ChildVaccineItem
): string[] {
  const issues: string[] = [];
  if (!audit) {
    return ['Brak obiektu audytu treści ChPL (chplAudit).'];
  }
  if (isPlaceholderValue(audit.productName)) {
    issues.push('Brak dokładnej nazwy produktu w chplAudit.');
  } else if (item?.chplProductName && audit.productName.trim() !== item.chplProductName.trim()) {
    issues.push(`Niespójność nazwy produktu: '${audit.productName}' vs '${item.chplProductName}'.`);
  }
  if (!audit.officialSourceUrl || !audit.officialSourceUrl.startsWith('https://')) {
    issues.push('Brak bezpośredniego oficjalnego URL źródłowego ChPL w chplAudit.');
  } else if (item?.chplOfficialSourceUrl && audit.officialSourceUrl.trim() !== item.chplOfficialSourceUrl.trim()) {
    issues.push('Niespójność oficjalnego URL ChPL między procedurą a chplAudit.');
  }
  if (isPlaceholderValue(audit.documentIdOrAuthorizationNumber)) {
    issues.push('Brak identyfikatora produktu, numeru pozwolenia lub jednoznacznego oznaczenia w chplAudit.');
  }
  const docVersion = audit.documentVersionOrDate?.trim() ?? '';
  if (!docVersion) {
    issues.push('Brak informacji o wersji/dacie dokumentu w chplAudit (wymagana data dokumentu lub jawny zapis "Brak informacji w dokumencie").');
  } else if (
    /^brak informacji w dokumencie/i.test(docVersion) &&
    audit.documentDateStatus === 'dated'
  ) {
    issues.push('Sprzeczność statusu daty dokumentu z wartością documentVersionOrDate.');
  }
  const auditDate = audit.auditDate?.trim() ?? '';
  if (!auditDate) {
    issues.push('Brak daty wykonania audytu w chplAudit.');
  } else if (/brak informacji/i.test(auditDate) || isPlaceholderValue(auditDate)) {
    issues.push('Data audytu nie może być wartością zastępczą („Brak informacji w dokumencie” dotyczy wyłącznie daty dokumentu pkt 10 ChPL, nigdy daty audytu).');
  } else if (!CALENDAR_DATE_REGEX.test(auditDate)) {
    issues.push(`Nieprawidłowy format daty wykonania audytu ('${auditDate}' – wymagany format DD.MM.YYYY lub YYYY-MM-DD).`);
  }
  const auditor = audit.auditor?.trim() ?? '';
  if (isPlaceholderValue(auditor) || auditor.length < 3) {
    issues.push('Brak wskazania osoby lub podmiotu dokonującego audytu w chplAudit.');
  }
  const validSections = (audit.verifiedSectionsScope ?? []).filter(s => s.trim().length > 0);
  if (validSections.length === 0) {
    issues.push('Brak listy konkretnych punktów ChPL poddanych analizie w chplAudit.');
  }

  // Zadanie 1 (PROMPT 21 + 22): Wymagana pełna, dowodowa kontrola wszystkich właściwych punktów ChPL 1–10.
  const sectionReviews = audit.sectionReviews ?? [];
  if (sectionReviews.length === 0) {
    issues.push(
      'Brak jawnej kontroli wszystkich właściwych punktów ChPL 1–10 w chplAudit.sectionReviews (pojedynczy punkt, np. 4.3, nie wystarcza do statusu verified_full).'
    );
  } else {
    for (const sec of REQUIRED_CHPL_SECTION_NUMBERS) {
      const matches = sectionReviews.filter(entry => entry.sectionNumber === sec);
      if (matches.length === 0) {
        issues.push(`Brak jawnego wyniku kontroli dla punktu ${sec} ChPL w sectionReviews.`);
        continue;
      }
      if (matches.length > 1) {
        issues.push(`Zduplikowany wpis kontroli dla punktu ${sec} ChPL w sectionReviews.`);
        continue;
      }
      const entry = matches[0];
      if (entry.discrepancyNote && entry.discrepancyNote.trim().length > 0) {
        issues.push(`Punkt ${sec} ChPL zawiera otwartą niezgodność w sekcji: ${entry.discrepancyNote.trim()}`);
      }
      if (entry.outcome && entry.outcome !== 'compliant') {
        issues.push(`Punkt ${sec} ChPL ma wynik kontroli '${entry.outcome}' zamiast 'compliant'.`);
      }

      if (entry.status === 'not_present_in_document' || entry.status === 'not_applicable') {
        const justif = entry.justification?.trim() ?? '';
        if (isPlaceholderValue(justif) || GENERIC_RUBBER_STAMP_REGEX.test(justif) || justif.length < 10) {
          issues.push(
            `Punkt ${sec} ChPL oznaczony jako '${entry.status}' wymaga konkretnego, jawnego uzasadnienia (min. 10 znaków).`
          );
        }
      } else if (entry.status === 'verified') {
        if (!isValidPageRef(entry.pageRef)) {
          issues.push(
            `Punkt ${sec} ChPL oznaczony jako 'verified' wymaga odniesienia do strony oficjalnego dokumentu (pageRef).`
          );
        }
        if (!isSubstantiveVerificationNote(entry.verificationNote, 15)) {
          issues.push(
            `Punkt ${sec} ChPL oznaczony jako 'verified' wymaga merytorycznej notatki weryfikacyjnej (min. 15 znaków), samo oznaczenie statusu nie stanowi dowodu audytu.`
          );
        }
        validateSectionSubpoints(entry, issues);
      } else {
        issues.push(`Nieprawidłowy status kontroli dla punktu ${sec} ChPL.`);
      }
    }
  }

  if (audit.targetSeason && audit.sourceSeason && audit.sourceSeason.trim() !== audit.targetSeason.trim()) {
    issues.push(
      `Dokument ChPL z sezonu '${audit.sourceSeason}' nie może stanowić dowodu dla docelowego sezonu '${audit.targetSeason}'.`
    );
  }
  if (
    item?.id === 'pso-rec-influenza-1' &&
    (!audit.sourceSeason || audit.sourceSeason === '2024/2025' || audit.sourceSeason === '2025/2026')
  ) {
    issues.push(
      'Dokumentacja ChPL grypy na sezon 2026/2027 nie może opierać się na składzie ani plikach z sezonów 2024/2025 lub 2025/2026.'
    );
  }

  if (audit.auditOutcome !== 'compliant') {
    issues.push(`Wynik audytu ChPL wynosi '${audit.auditOutcome}', wymagany jest 'compliant'.`);
  }
  if (
    typeof audit.unresolvedDiscrepanciesCount !== 'number' ||
    !Number.isInteger(audit.unresolvedDiscrepanciesCount) ||
    audit.unresolvedDiscrepanciesCount < 0
  ) {
    issues.push('Brak jawnej liczby nierozstrzygniętych niezgodności (unresolvedDiscrepanciesCount).');
  } else if (audit.unresolvedDiscrepanciesCount > 0) {
    issues.push(`Istnieją nierozstrzygnięte rozbieżności (${audit.unresolvedDiscrepanciesCount}).`);
  }
  return issues;
}

/**
 * Niezależny status kompletności karty katalogowej powiązanej z procedurą PSO (Zadanie 2 PROMPT 21).
 */
export function deriveCatalogCardCompletenessStatus(
  item: ChildVaccineItem,
  catalogVaccines: VaccineProduct[] = []
): CatalogCardCompletenessStatus {
  const referencedIds = new Set<string>([
    ...item.linkedVaccineIds,
    ...(item.productLinkages?.map(l => l.vaccineId) ?? []),
  ]);

  if (referencedIds.size === 0 || catalogVaccines.length === 0) {
    return 'missing_catalog_card';
  }

  let foundAnyCard = false;
  let allFoundComplete = true;

  for (const vaccineId of referencedIds) {
    const product = catalogVaccines.find(v => v.id === vaccineId);
    if (!product) {
      allFoundComplete = false;
      continue;
    }
    foundAnyCard = true;
    const hasOpenDiscrepancies = (product.sourceDiscrepancies ?? []).some(
      d => d.status !== 'resolved_with_official_document'
    );
    if (product.verificationStatus !== 'verified_chpl' || hasOpenDiscrepancies) {
      allFoundComplete = false;
    }
  }

  if (!foundAnyCard) {
    return 'missing_catalog_card';
  }
  return allFoundComplete ? 'complete_verified_card' : 'incomplete_or_unverified_card';
}

/**
 * Niezależny status kontroli adekwatności produktu handlowego do procedury PSO (Zadanie 2 PROMPT 21).
 */
export function deriveProcedureProductAdequacyStatus(
  item: ChildVaccineItem,
  catalogVaccines: VaccineProduct[] = []
): ProcedureProductAdequacyStatus {
  const referencedIds = new Set<string>([
    ...item.linkedVaccineIds,
    ...(item.productLinkages?.map(l => l.vaccineId) ?? []),
  ]);

  if (item.chplContentVerificationStatus === 'analyzed_with_discrepancy') {
    return 'requires_clarification';
  }

  for (const vaccineId of referencedIds) {
    const product = catalogVaccines.find(v => v.id === vaccineId);
    const hasOpenDiscrepancies = (product?.sourceDiscrepancies ?? []).some(
      d => d.status !== 'resolved_with_official_document'
    );
    if (hasOpenDiscrepancies) {
      return 'requires_clarification';
    }
  }

  if (item.productLinkageStatus === 'conditional_alternative') {
    return 'conditional_with_restrictions';
  }

  if (item.productLinkageStatus === 'linked_catalog' && referencedIds.size > 0) {
    const completeness = deriveCatalogCardCompletenessStatus(item, catalogVaccines);
    if (completeness === 'complete_verified_card') {
      return item.linkageAuditNote ? 'conditional_with_restrictions' : 'confirmed_adequate';
    }
    return 'pending_adequacy_review';
  }

  return 'pending_adequacy_review';
}

/**
 * Zwraca wyłącznie zakresy dopuszczalne i dostępne w kontekście decyzji pediatrycznej
 * (wyklucza preparaty dla dorosłych, np. Efluelda >=60, oraz preparaty bez potwierdzonej dostępności sezonowej, np. Fluenz).
 */
export function getPediatricSelectableFundingScopes(item: ChildVaccineItem): FundingScopeBreakdown[] {
  return (item.fundingAuditDetails?.fundingScopes ?? []).filter(
    scope =>
      scope.isPediatricSelectable !== false &&
      scope.seasonalAvailabilityStatus !== 'unconfirmed_for_season' &&
      scope.seasonalAvailabilityStatus !== 'excluded_from_pediatric'
  );
}

/**
 * Zwraca zakresy pediatryczne o niepotwierdzonej/wycofanej dostępności sezonowej w Polsce (np. Fluenz w 2026/2027),
 * utrzymane wyłącznie jako bezpieczna informacja ostrzegawcza poza listą wyboru.
 */
export function getUnconfirmedSeasonalScopes(item: ChildVaccineItem): FundingScopeBreakdown[] {
  return [
    ...(item.fundingAuditDetails?.fundingScopes ?? []),
    ...(item.fundingAuditDetails?.adultAndSpecialReferenceScopes ?? []),
  ].filter(scope => scope.seasonalAvailabilityStatus === 'unconfirmed_for_season');
}

/**
 * Zwraca zakresy referencyjne dorosłych/szczególne, nieprzeznaczone do wyboru jako szczepionka dziecięca.
 */
export function getAdultAndSpecialReferenceScopes(item: ChildVaccineItem): FundingScopeBreakdown[] {
  return [
    ...(item.fundingAuditDetails?.fundingScopes ?? []).filter(
      scope =>
        scope.isPediatricSelectable === false &&
        scope.audienceContext !== 'pediatric' &&
        scope.seasonalAvailabilityStatus !== 'unconfirmed_for_season'
    ),
    ...(item.fundingAuditDetails?.adultAndSpecialReferenceScopes ?? []),
  ];
}

/**
 * Kontrola bramki awansu treści dokumentu ChPL do statusu 'verified_full' / 'verified_chpl'.
 * Zgodnie z Zadaniem 2 (PROMPT 21): brak lub niekompletność karty katalogowej w VACCINES_CATALOG
 * NIE blokuje potwierdzenia treści oficjalnego dokumentu ChPL (posiada osobny status kompletności
 * karty i adekwatności produktu do procedury); nadal blokuje otwarta niezgodność źródłowa ChPL.
 */
export function canPromoteToVerifiedFull(
  item: ChildVaccineItem,
  catalogVaccines: VaccineProduct[] = []
): { allowed: boolean; reasons: string[] } {
  const reasons: string[] = [];

  if (item.chplReferenceStatus !== 'official_document_identified') {
    reasons.push('Brak zidentyfikowanego oficjalnego dokumentu ChPL (chplReferenceStatus !== official_document_identified).');
  }
  if (!item.chplOfficialSourceUrl || !item.chplOfficialSourceUrl.startsWith('https://')) {
    reasons.push('Brak bezpośredniego oficjalnego adresu URL dokumentu ChPL.');
  }

  reasons.push(...isValidChplAuditRecord(item.chplAudit, item));

  const referencedIds = new Set<string>([
    ...item.linkedVaccineIds,
    ...(item.productLinkages?.map(l => l.vaccineId) ?? []),
  ]);

  for (const vaccineId of referencedIds) {
    const product = catalogVaccines.find(v => v.id === vaccineId);
    if (!product) {
      continue;
    }

    const openDiscrepancies = (product.sourceDiscrepancies ?? []).filter(
      d => d.status !== 'resolved_with_official_document'
    );
    if (openDiscrepancies.length > 0) {
      reasons.push(
        `Powiązana karta źródłowa ${product.tradeName} ma nierozstrzygnięte niezgodności ChPL: ${openDiscrepancies.map(d => d.id).join(', ')}.`
      );
    }
  }

  return {
    allowed: reasons.length === 0,
    reasons,
  };
}

/**
 * Pełna walidacja niezmienników statusowych rekordu ChildVaccineItem:
 * 1. Brak sprzeczności między 3 statusami ChPL.
 * 2. Zgodność powiązań produktowych (główne/A.2 vs warunkowe alternatywy vs brak karty).
 * 3. Spójność dokumentacji finansowania.
 */
export function validateChildVaccineStatusInvariants(
  item: ChildVaccineItem,
  catalogVaccines: VaccineProduct[] = []
): string[] {
  const errors: string[] = [];

  if (item.chplReferenceStatus !== 'official_document_identified') {
    if (item.chplContentVerificationStatus !== 'not_verified') {
      errors.push(
        `[${item.id}] chplReferenceStatus='${item.chplReferenceStatus}' nie może mieć chplContentVerificationStatus='${item.chplContentVerificationStatus}' (wymagane 'not_verified').`
      );
    }
    if (item.chplOfficialSourceUrl) {
      errors.push(`[${item.id}] chplReferenceStatus='${item.chplReferenceStatus}' nie powinien wskazywać bezpośredniego URL ChPL.`);
    }
    if (item.chplVerificationStatus !== 'pending_chpl_verification' && item.chplVerificationStatus !== 'no_trade_product_linked') {
      errors.push(`[${item.id}] chplVerificationStatus='${item.chplVerificationStatus}' jest sprzeczny z brakiem oficjalnego dokumentu ChPL.`);
    }
  } else {
    if (!item.chplOfficialSourceUrl || !item.chplOfficialSourceUrl.startsWith('https://')) {
      errors.push(`[${item.id}] official_document_identified wymaga oficjalnego adresu URL ChPL.`);
    }
    if (item.chplContentVerificationStatus === 'not_verified') {
      errors.push(`[${item.id}] official_document_identified nie może mieć chplContentVerificationStatus='not_verified'.`);
    }
    const expectedStatus = deriveChplVerificationStatus(
      item.chplReferenceStatus,
      item.chplContentVerificationStatus
    );
    if (item.chplVerificationStatus !== expectedStatus) {
      errors.push(
        `[${item.id}] Niespójność chplVerificationStatus='${item.chplVerificationStatus}' (oczekiwano '${expectedStatus}').`
      );
    }
  }

  if (item.chplContentVerificationStatus === 'verified_full' || item.chplVerificationStatus === 'verified_chpl') {
    const promotionCheck = canPromoteToVerifiedFull(item, catalogVaccines);
    if (!promotionCheck.allowed) {
      errors.push(`[${item.id}] Nieuprawniony status 'verified_full'/'verified_chpl': ${promotionCheck.reasons.join('; ')}`);
    }
  }

  const conditionalLinkages = (item.productLinkages ?? []).filter(l => l.relationType === 'conditional_alternative');
  if (item.productLinkageStatus === 'linked_catalog') {
    if (item.linkedVaccineIds.length === 0) {
      errors.push(`[${item.id}] productLinkageStatus='linked_catalog' wymaga niepustego linkedVaccineIds.`);
    }
  } else if (item.productLinkageStatus === 'conditional_alternative') {
    if (item.linkedVaccineIds.length > 0) {
      errors.push(`[${item.id}] productLinkageStatus='conditional_alternative' nie może umieszczać preparatu alternatywnego jako podstawowego linkedVaccineIds.`);
    }
    if (conditionalLinkages.length === 0) {
      errors.push(`[${item.id}] productLinkageStatus='conditional_alternative' wymaga wpisu w productLinkages.`);
    }
  } else if (item.productLinkageStatus === 'pending_catalog_entry') {
    if (item.linkedVaccineIds.length > 0 || conditionalLinkages.length > 0) {
      errors.push(`[${item.id}] pending_catalog_entry nie powinien mieć powiązanych preparatów.`);
    }
  }

  if (!item.fundingAuditDetails) {
    errors.push(`[${item.id}] Brak ustrukturyzowanych metadanych fundingAuditDetails.`);
  } else {
    const {
      legalBasis,
      targetGroup,
      productType,
      conditions,
      validityPeriod,
      verifiedDate,
      validityOrVerifiedDate,
      mechanismBreakdown,
    } = item.fundingAuditDetails;
    if (
      !legalBasis.trim() ||
      !targetGroup.trim() ||
      !productType?.trim() ||
      !conditions.trim() ||
      !validityPeriod?.trim() ||
      !verifiedDate?.trim() ||
      !validityOrVerifiedDate.trim()
    ) {
      errors.push(`[${item.id}] Niekompletne wymagane pola fundingAuditDetails (źródło, grupa, rodzaj produktu, okres obowiązywania, data weryfikacji, warunki).`);
    }
    if (!mechanismBreakdown) {
      errors.push(`[${item.id}] Brak rozdzielonego obiektu mechanismBreakdown w fundingAuditDetails.`);
    } else {
      const m = mechanismBreakdown;
      if (
        !m.stateVaccinePurchase.trim() ||
        !m.serviceExecutionFunding.trim() ||
        !m.pharmacyReimbursement.trim() ||
        !m.partialReimbursementDetail.trim() ||
        !m.temporaryProgram.trim() ||
        !m.regionalAvailabilityAndDistribution.trim() ||
        typeof m.localPointAvailabilityConfirmed !== 'boolean'
      ) {
        errors.push(`[${item.id}] Niekompletne pola mechanismBreakdown (rozdzielenie zakupu MZ, wykonania, refundacji, programu i dostępności).`);
      }
    }
  }

  if (EXTERNAL_FUNDING_PENDING_IDS.has(item.id) && item.fundingVerificationStatus !== 'pending_clarification') {
    errors.push(
      `[${item.id}] Finansowanie zależne od odrębnych obwieszczeń/komunikatów musi mieć status 'pending_clarification'.`
    );
  }

  // Zadanie 4 (PROMPT 21) + Zadania 3, 4, 6 (PROMPT 22): Bezpieczeństwo wyboru pediatrycznego, granice wieku oraz dostępność sezonowa
  const allScopes = [
    ...(item.fundingAuditDetails?.fundingScopes ?? []),
    ...(item.fundingAuditDetails?.adultAndSpecialReferenceScopes ?? []),
  ];
  for (const scope of allScopes) {
    const isSelectable = scope.isPediatricSelectable !== false;
    const textCheck = `${scope.label} ${scope.productScope} ${scope.ageGroup}`.toLowerCase();
    if (isSelectable && (textCheck.includes('efluelda') || textCheck.includes('>=60') || textCheck.includes('≥60'))) {
      errors.push(
        `[${item.id}] Zakres '${scope.scopeId}' zawiera preparat/wskazanie dla dorosłych (Efluelda / >=60), ale nie jest wyłączony z wyboru pediatrycznego (isPediatricSelectable=false).`
      );
    }
    if (
      (scope.seasonalAvailabilityStatus === 'unconfirmed_for_season' ||
        scope.seasonalAvailabilityStatus === 'excluded_from_pediatric') &&
      isSelectable
    ) {
      errors.push(
        `[${item.id}] Zakres '${scope.scopeId}' ma status dostępności '${scope.seasonalAvailabilityStatus}', więc musi mieć isPediatricSelectable=false.`
      );
    }
    if (textCheck.includes('fluenz') || textCheck.includes('laiv')) {
      if (isSelectable || scope.seasonalAvailabilityStatus !== 'unconfirmed_for_season') {
        errors.push(
          `[${item.id}] Zakres '${scope.scopeId}' dotyczy niedostępnego w sezonie 2026/2027 preparatu Fluenz/LAIV i musi mieć isPediatricSelectable=false oraz seasonalAvailabilityStatus='unconfirmed_for_season'.`
        );
      }
      if (scope.fundingStatus === 'verified_self_funded') {
        errors.push(
          `[${item.id}] Zakres '${scope.scopeId}' nie może prezentować niedostępnego w Polsce preparatu Fluenz jako aktywnej opcji 'verified_self_funded' (100% odpłatny).`
        );
      }
      if (scope.scopeId === 'flu-pediatric-under18-fluenz') {
        const fluenzTetraCheck = `${scope.label} ${scope.productScope} ${scope.unconfirmedAvailabilityNote ?? ''}`;
        if (!fluenzTetraCheck.includes('Fluenz Tetra') || !fluenzTetraCheck.includes('14.07.2025')) {
          errors.push(
            `[${item.id}] Historyczny wpis 'flu-pediatric-under18-fluenz' musi jednoznacznie identyfikować wycofaną szczepionkę Fluenz Tetra oraz datę 14.07.2025 r.`
          );
        }
      }
    }
    if (scope.scopeId === 'flu-pregnancy-puerperium-reference' && scope.fundingStatus === 'verified_reimbursement') {
      const condLower = scope.conditionsAndExceptions.toLowerCase();
      const pharmLower = scope.mechanismBreakdown.pharmacyReimbursement.toLowerCase();
      const servLower = scope.mechanismBreakdown.serviceExecutionFunding.toLowerCase();
      if (
        !condLower.includes('43b') ||
        !condLower.includes('6 tygodni') ||
        !condLower.includes('15 dni') ||
        !condLower.includes('połogu') ||
        !condLower.includes('zaświadczenia') ||
        !condLower.includes('innego lekarza') ||
        !condLower.includes('termin realizacji recepty') ||
        !pharmLower.includes('recepta farmaceutyczna') ||
        !servLower.includes('poz') ||
        !servLower.includes('18')
      ) {
        errors.push(
          `[${item.id}] Warunkowe finansowanie ciąży/połogu ('verified_reimbursement') musi jawnie zachowywać limit art. 43b (recepta lekarza/położnej lub innego lekarza na podstawie zaświadczenia, termin realizacji recepty i ważność max. 6 tyg. po +15 dniach), rozdział POZ vs apteka >=18 oraz zakaz kodu C na recepcie farmaceutycznej.`
        );
      }
    }
    if (scope.scopeId === 'hpv-under18-cervarix-d1') {
      const lowerCheck = `${scope.ageGroup} ${scope.minAgeDescription ?? ''}`.toLowerCase();
      if (!/(\bod\s+(?:ukończenia\s+)?9\.?\b)/.test(lowerCheck)) {
        errors.push(
          `[${item.id}] Zakres '${scope.scopeId}' musi jawnie określać dolną granicę wieku Cervarix (od ukończenia 9. r.ż.), zamiast luźnego zakresu bez minimum.`
        );
      }
    }
  }
  for (const excluded of item.fundingAuditDetails?.excludedPediatricProducts ?? []) {
    if (excluded.excludedFromPediatricSelection !== true) {
      errors.push(`[${item.id}] Produkt wykluczony '${excluded.productName}' musi mieć excludedFromPediatricSelection=true.`);
    }
  }

  // Zadanie 1 (PROMPT 24): Kontrola zgodności sezonu dokumentu ChPL z sezonem procedury
  if (item.chplAudit?.targetSeason && item.chplAudit?.sourceSeason) {
    if (item.chplAudit.sourceSeason.trim() !== item.chplAudit.targetSeason.trim()) {
      errors.push(
        `[${item.id}] ChPL z sezonu '${item.chplAudit.sourceSeason}' nie może być przypisany jako aktualna ChPL dla sezonu '${item.chplAudit.targetSeason}'.`
      );
    }
  }

  // Zadanie 5 (PROMPT 21) + Zadanie 2 (PROMPT 22) + Zadanie 3 (PROMPT 24): Walidacja identyfikowalnych źródeł GTIN i ścisłe rozdzielenie statusu dokumentu ChPL vs potwierdzenia GTIN w RPL/EMA
  for (const g of item.fundingAuditDetails?.gtinReferences ?? []) {
    if (!g.gtin.trim() || !g.sourceDocumentTitle.trim() || !g.sourceDocumentUrl.startsWith('https://')) {
      errors.push(`[${item.id}] Wpis GTIN '${g.gtin}' musi posiadać identyfikowalne źródło dokumentowe i adres URL.`);
    }
    if (g.confirmedByRars && (!g.rarsSourceTitle?.trim() || !g.rarsSourceUrl?.startsWith('https://www.gov.pl/web/rars'))) {
      errors.push(
        `[${item.id}] Wpis GTIN '${g.gtin}' z confirmedByRars=true musi wskazywać oficjalne źródło i URL RARS (https://www.gov.pl/web/rars/...).`
      );
    }
    if ((g.confirmedByRpl || g.confirmedByEma) && !g.crossCheckedWithEparOrRpl) {
      errors.push(
        `[${item.id}] Wpis GTIN '${g.gtin}' oznaczony jako confirmedByRpl/confirmedByEma wymaga crossCheckedWithEparOrRpl=true (samo zidentyfikowanie ChPL EPAR bez GTIN nie potwierdza GTIN).`
      );
    }
    if (
      g.verificationStatus === 'confirmed_in_official_guideline_and_product_doc' &&
      (!g.crossCheckedWithEparOrRpl || (!g.confirmedByRpl && !g.confirmedByEma))
    ) {
      errors.push(
        `[${item.id}] Wpis GTIN '${g.gtin}' bez potwierdzenia w EPAR/RPL nie może mieć statusu 'confirmed_in_official_guideline_and_product_doc' (samo potwierdzenie RARS lub sam PDF ChPL bez GTIN nie wystarcza).`
      );
    }
    if (
      g.verificationStatus === 'confirmed_mz_guideline_and_rars_pending_rpl_ema' &&
      (!g.confirmedByMzGuidelines || !g.confirmedByRars || g.crossCheckedWithEparOrRpl || g.confirmedByRpl || g.confirmedByEma)
    ) {
      errors.push(
        `[${item.id}] Wpis GTIN '${g.gtin}' ze statusem 'confirmed_mz_guideline_and_rars_pending_rpl_ema' wymaga confirmedByMzGuidelines=true, confirmedByRars=true oraz false dla RPL/EMA.`
      );
    }
  }

  return errors;
}

export interface VariantA2IpvDoseAuditEntry {
  variantDoseNumber: number;
  ageBracketId: string;
  ageLabel: string;
  coveredByProcedureIds: string[];
  ipvMappingSummary: string;
  isComplete: boolean;
}

/**
 * Audyt mapowania dawek IPV w wariancie 6w1 (Część I.A.2 PSO 2027, str. 11–12):
 * Sprawdza obecność wszystkich 4 podań 6w1 (2., 4., 5.–6., 16.–18. m.ż.), w tym 1. dawki IPV w 2. m.ż.,
 * bez duplikacji i bez pominięcia dawki w 2. m.ż.
 */
export function auditVariantA2IpvCoverage(catalog: ChildVaccineItem[]): {
  doses: VariantA2IpvDoseAuditEntry[];
  hasDuplicates: boolean;
  allFourDosesAccountedFor: boolean;
} {
  const byId = new Map(catalog.map(it => [it.id, it]));
  const ids2m = ['pso-dtp-1', 'pso-hbv-2', 'pso-hib-1'];
  const dose1Valid = ids2m.every(id => {
    const rec = byId.get(id);
    const l = rec?.productLinkages?.find(entry => entry.vaccineId === 'vac-infanrix-hexa');
    return l?.relationType === 'variant_a2_6in1' && Boolean(l.variantA2Dose?.includes('1. dawka 6w1')) && Boolean(l.variantA2Dose?.includes('IPV'));
  });

  const checkIpvRecord = (id: string, expectedDoseMarker: string): boolean => {
    const rec = byId.get(id);
    const l = rec?.productLinkages?.find(entry => entry.vaccineId === 'vac-infanrix-hexa');
    return l?.relationType === 'variant_a2_6in1' && Boolean(l.variantA2Dose?.includes(expectedDoseMarker));
  };

  const doses: VariantA2IpvDoseAuditEntry[] = [
    {
      variantDoseNumber: 1,
      ageBracketId: '2-miesiac',
      ageLabel: '2. miesiąc życia (od ukończenia 6. tyg.)',
      coveredByProcedureIds: ids2m,
      ipvMappingSummary: '1. dawka IPV realizowana łącznie w 1. dawce 6w1 (wspólnie z DTaP-1, HBV-2 i Hib-1; w kalendarzu I.A.1 brak osobnej procedury IPV w 2. m.ż.).',
      isComplete: dose1Valid,
    },
    {
      variantDoseNumber: 2,
      ageBracketId: '4-miesiac',
      ageLabel: '4. miesiąc życia (od ukończenia 12. tyg.)',
      coveredByProcedureIds: ['pso-dtp-2', 'pso-ipv-1', 'pso-hib-2'],
      ipvMappingSummary: '2. dawka IPV w składzie 2. dawki 6w1 (odpowiada pozycji pso-ipv-1 z kalendarza I.A.1).',
      isComplete: checkIpvRecord('pso-ipv-1', '2. dawka 6w1'),
    },
    {
      variantDoseNumber: 3,
      ageBracketId: '5-6-miesiac',
      ageLabel: '5.–6. miesiąc życia (od ukończenia 4. mies.)',
      coveredByProcedureIds: ['pso-dtp-3', 'pso-ipv-2', 'pso-hib-3'],
      ipvMappingSummary: '3. dawka IPV w składzie 3. dawki 6w1 w schemacie podstawowym 3+1 (w I.A.1 to pso-ipv-2; wyłącznie w indywidualnej kontynuacji wcześniej rozpoczętego szczepienia 2+1 z decyzji lekarza ta wizyta nie występuje – cz. III.M pkt 2).',
      isComplete: checkIpvRecord('pso-ipv-2', '3. dawka 6w1'),
    },
    {
      variantDoseNumber: 4,
      ageBracketId: '16-18-miesiac',
      ageLabel: '16.–18. miesiąc życia (od ukończenia 15. mies.)',
      coveredByProcedureIds: ['pso-dtp-4', 'pso-ipv-3', 'pso-hib-4'],
      ipvMappingSummary: '4. dawka IPV w składzie dawki uzupełniającej 6w1 w schemacie podstawowym 3+1 (w I.A.1 to pso-ipv-3; w indywidualnym schemacie kontynuacji 2+1 jest to 3. dawka uzupełniająca wg cz. III.M pkt 2).',
      isComplete: checkIpvRecord('pso-ipv-3', '4. dawka 6w1'),
    },
  ];

  const standalone2mIpvCount = catalog.filter(
    it => it.ageBracketId === '2-miesiac' && it.disease.toLowerCase().includes('poliomyelitis')
  ).length;

  return {
    doses,
    hasDuplicates: standalone2mIpvCount > 0,
    allFourDosesAccountedFor: doses.every(d => d.isComplete) && standalone2mIpvCount === 0,
  };
}

export interface ChildVaccinesCatalogAuditSummary {
  totalProcedures: number;
  officialDocumentIdentified: number;
  referenceNameOnly: number;
  verifiedFull: number;
  analyzedWithDiscrepancy: number;
  pendingContentAudit: number;
  notVerifiedContent: number;
  linkedCatalogPrimaryOrVariant: number;
  conditionalAlternativeLinkages: number;
  pendingCatalogEntry: number;
  missingCatalogCardCount: number;
  incompleteCatalogCardCount: number;
  completeCatalogCardCount: number;
  infanrixHexaVariantA2Links: number;
  infanrixHexaConditionalLinks: number;
  infanrixHexaTotalLinks: number;
  fundingCounts: {
    verified_public_free: number;
    verified_reimbursement: number;
    verified_self_funded: number;
    pending_clarification: number;
  };
  invariantViolations: string[];
}

export function auditChildVaccinesCatalogSummary(
  catalog: ChildVaccineItem[],
  catalogVaccines: VaccineProduct[] = []
): ChildVaccinesCatalogAuditSummary {
  const invariantViolations = catalog.flatMap(item =>
    validateChildVaccineStatusInvariants(item, catalogVaccines)
  );

  let infanrixHexaVariantA2Links = 0;
  let infanrixHexaConditionalLinks = 0;

  for (const item of catalog) {
    for (const linkage of item.productLinkages ?? []) {
      if (linkage.vaccineId !== 'vac-infanrix-hexa') continue;
      if (linkage.relationType === 'variant_a2_6in1') {
        infanrixHexaVariantA2Links += 1;
      } else if (linkage.relationType === 'conditional_alternative') {
        infanrixHexaConditionalLinks += 1;
      }
    }
  }

  const cardCompletenessList = catalog.map(i => deriveCatalogCardCompletenessStatus(i, catalogVaccines));

  return {
    totalProcedures: catalog.length,
    officialDocumentIdentified: catalog.filter(i => i.chplReferenceStatus === 'official_document_identified').length,
    referenceNameOnly: catalog.filter(i => i.chplReferenceStatus === 'reference_name_only').length,
    verifiedFull: catalog.filter(i => i.chplContentVerificationStatus === 'verified_full' || i.chplVerificationStatus === 'verified_chpl').length,
    analyzedWithDiscrepancy: catalog.filter(i => i.chplContentVerificationStatus === 'analyzed_with_discrepancy').length,
    pendingContentAudit: catalog.filter(i => i.chplContentVerificationStatus === 'pending_content_audit').length,
    notVerifiedContent: catalog.filter(i => i.chplContentVerificationStatus === 'not_verified').length,
    linkedCatalogPrimaryOrVariant: catalog.filter(i => i.productLinkageStatus === 'linked_catalog').length,
    conditionalAlternativeLinkages: catalog.filter(i => i.productLinkageStatus === 'conditional_alternative').length,
    pendingCatalogEntry: catalog.filter(i => i.productLinkageStatus === 'pending_catalog_entry').length,
    missingCatalogCardCount: cardCompletenessList.filter(s => s === 'missing_catalog_card').length,
    incompleteCatalogCardCount: cardCompletenessList.filter(s => s === 'incomplete_or_unverified_card').length,
    completeCatalogCardCount: cardCompletenessList.filter(s => s === 'complete_verified_card').length,
    infanrixHexaVariantA2Links,
    infanrixHexaConditionalLinks,
    infanrixHexaTotalLinks: infanrixHexaVariantA2Links + infanrixHexaConditionalLinks,
    fundingCounts: {
      verified_public_free: catalog.filter(i => i.fundingVerificationStatus === 'verified_public_free').length,
      verified_reimbursement: catalog.filter(i => i.fundingVerificationStatus === 'verified_reimbursement').length,
      verified_self_funded: catalog.filter(i => i.fundingVerificationStatus === 'verified_self_funded').length,
      pending_clarification: catalog.filter(i => i.fundingVerificationStatus === 'pending_clarification').length,
    },
    invariantViolations,
  };
}

const GROUP_D_PROCEDURAL_EXCEPTION_IDS = new Set<string>([
  'pso-risk-preterm-dtap',
  'pso-risk-preterm-pcv',
  'pso-rv-3',
  'pso-ipv-boost-6',
  'pso-hepb-dialysis-primary',
  'pso-hepb-dialysis-booster',
  'pso-rec-hpv-9',
  'pso-rec-hpv-catchup',
]);

const GROUP_E_SEASONAL_LEGACY_IDS = new Set<string>([
  'pso-rec-influenza-1',
  'pso-rec-covid-pediatric',
]);

const CHPL_QUEUE_GROUP_LABELS: Record<ChplManualQueueGroup, string> = {
  A: 'Grupa A – Częściowo zweryfikowana ChPL (dokument źródłowy pobrany, otwarte punkty kontrolne)',
  B: 'Grupa B – Otwarta rozbieżność ChPL (Infanrix hexa: disc-phenylalanine-content-01)',
  C: 'Grupa C – Procedury z samym odwołaniem referencyjnym (brak pobranego pliku ChPL do audytu 1–10)',
  D: 'Grupa D – Procedury o szczególnych regułach dawkowania, grup ryzyka lub finansowaniu warunkowym',
  E: 'Grupa E – Procedury sezonowe / historyczne i niezweryfikowane źródła handlowe lub GTIN',
};

function collectOfficialChplSources(item: ChildVaccineItem, linkedProducts: VaccineProduct[]): string[] {
  const sources: string[] = [];
  if (item.chplOfficialSourceUrl && !sources.includes(item.chplOfficialSourceUrl)) {
    sources.push(item.chplOfficialSourceUrl);
  }
  if (item.chplAudit?.secondaryOfficialSourceUrl && !sources.includes(item.chplAudit.secondaryOfficialSourceUrl)) {
    sources.push(item.chplAudit.secondaryOfficialSourceUrl);
  }
  if (item.alternativeProductDetails?.officialChplUrl && !sources.includes(item.alternativeProductDetails.officialChplUrl)) {
    sources.push(item.alternativeProductDetails.officialChplUrl);
  }
  for (const product of linkedProducts) {
    if (product.currentChplUrl && !sources.includes(product.currentChplUrl)) {
      sources.push(product.currentChplUrl);
    }
    if (product.rplRecordUrl && !sources.includes(product.rplRecordUrl)) {
      sources.push(product.rplRecordUrl);
    }
  }
  return sources;
}

/**
 * Tylko do odczytu (Zadanie 4 PROMPT 24): precyzyjnie wyjaśnia, które procedury
 * pozostają na poziomie procedury ze statusem `pending_clarification`, dlaczego tak jest
 * oraz które zakresy wewnętrzne są już potwierdzone, a które oczekują lub są zamknięte.
 */
export function auditPendingFundingProcedures(catalog: ChildVaccineItem[]): PendingFundingAuditReport {
  const pendingItems = catalog.filter(i => i.fundingVerificationStatus === 'pending_clarification');

  const details: PendingFundingProcedureDetail[] = pendingItems.map(item => {
    const allScopes = [
      ...(item.fundingAuditDetails?.fundingScopes ?? []),
      ...(item.fundingAuditDetails?.adultAndSpecialReferenceScopes ?? []),
    ];

    const toAuditEntry = (s: FundingScopeBreakdown): FundingScopeAuditEntry => ({
      scopeId: s.scopeId,
      label: s.label,
      fundingStatus: s.fundingStatus,
      isPediatricSelectable: s.isPediatricSelectable !== false,
      seasonalAvailabilityStatus: s.seasonalAvailabilityStatus,
      audienceContext: s.audienceContext,
    });

    const confirmedScopes = allScopes
      .filter(
        s =>
          s.fundingStatus === 'verified_public_free' ||
          s.fundingStatus === 'verified_reimbursement' ||
          s.fundingStatus === 'verified_self_funded'
      )
      .map(toAuditEntry);

    const pendingOrClosedScopes = allScopes
      .filter(s => s.fundingStatus === 'pending_clarification' || s.fundingStatus === 'regional_pool_closed')
      .map(toAuditEntry);

    let stayPendingReason: string;
    if (item.id === 'pso-rec-influenza-1') {
      stayPendingReason =
        'Procedura zachowuje status pending_clarification z uwagi na wykluczone/niedostępne w Polsce w sezonie 2026/2027 zakresy donosowe LAIV (wycofana Fluenz Tetra oraz niedostępna 3-walentna Fluenz), przy jednoczesnym pełnym potwierdzeniu refundacji wstrzykiwanych preparatów trójwalentnych (Influvac, Vaxigrip w D1/A1/D2/E).';
    } else if (item.id === 'pso-rec-hpv-catchup') {
      stayPendingReason =
        'Procedura zachowuje status pending_clarification z powodu zmienności i zamykania regionalnych/terenowych pul programu „Szczepienie przeciw HPV 19–26 lat” (np. komunikat WSSE we Wrocławiu z 20.10.2026 r.), mimo potwierdzonej refundacji aptecznej Cervarix (D1/A1) oraz pełnopłatnej ścieżki Gardasil 9.';
    } else {
      stayPendingReason =
        'Procedura zawiera co najmniej jeden nierozstrzygnięty lub zamknięty zakres wewnętrzny wymagający wyjaśnienia bez obniżania statusu zakresów potwierdzonych.';
    }

    return {
      procedureId: item.id,
      shortCode: item.shortCode,
      disease: item.disease,
      procedureFundingStatus: item.fundingVerificationStatus,
      stayPendingReason,
      confirmedScopes,
      pendingOrClosedScopes,
    };
  });

  return {
    pendingProceduresCount: details.length,
    pendingProcedureIds: details.map(d => d.procedureId),
    details,
  };
}

/**
 * Buduje deterministyczną, wyłącznie odczytową kolejkę ręcznego audytu ChPL
 * dla wszystkich procedur w katalogu PSO 2027 (Zadanie 4 PROMPT 23: Grupy A–E).
 */
export function getChplManualVerificationQueue(
  catalog: ChildVaccineItem[],
  catalogVaccines: VaccineProduct[] = []
): ChplManualQueueItem[] {
  const productById = new Map(catalogVaccines.map(v => [v.id, v]));

  return catalog.map(item => {
    const linkedProducts = item.linkedVaccineIds
      .map(id => productById.get(id))
      .filter((v): v is VaccineProduct => Boolean(v));
    const officialChplSources = collectOfficialChplSources(item, linkedProducts);

    let queueGroup: ChplManualQueueGroup;
    let priority: ChplManualQueuePriority;
    let missingDocumentsOrActions: string[];
    let auditReason: string;

    if (GROUP_E_SEASONAL_LEGACY_IDS.has(item.id)) {
      queueGroup = 'E';
      priority = 'critical';
      if (item.id === 'pso-rec-influenza-1') {
        missingDocumentsOrActions = [
          'Audyt pełnych sekcji 1–10 (w tym 4.1–4.9) pobranych ChPL RPL 2026/2027: Influvac (ID 49462, poz. 28478, rew. 06/2026) i Vaxigrip (ID 50032, poz. 28778, rew. 08/2026)',
          'Utworzenie kart trójwalentnych preparatów 2026/2027 w VACCINES_CATALOG z zachowaniem historycznej karty vac-vaxigrip-tetra wyłącznie jako archiwalnej/ostrzeżenia',
          'Potwierdzenie w kolejnym sezonie statusu wycofanej Fluenz Tetra (EMEA/H/C/002617, wycof. 14.07.2025) vs niedostępnej w Polsce 3-walentnej Fluenz (EMEA/H/C/006514)',
        ];
        auditReason =
          'Zidentyfikowano i pobrano oficjalne ChPL RPL 2026/2027 (Influvac 49462, Vaxigrip 50032), lecz wymagają one audytu sekcji 1–10 oraz rozgraniczenia od historycznej VaxigripTetra i niedostępnej Fluenz/wycofanej Fluenz Tetra.';
      } else {
        missingDocumentsOrActions = [
          'Pełny audyt kliniczny sekcji 4 (4.1–4.9, w tym Tabele 2–3), 5 i 6 zidentyfikowanego Aneksu I ChPL Spikevax XFG w EPAR EMA PL (str. 64–92) i EN (str. 53–77; EU/1/20/1507/041–050) wraz z wyjaśnieniem braku wpisanej daty w pkt 10',
          'Utworzenie karty preparatu Spikevax XFG w VACCINES_CATALOG (obecnie pending_catalog_entry)',
          'Potwierdzenie w przyszłości w źródłach RPL/EMA kodów GTIN 00380777714110 i 00380777712024, które pozostają potwierdzone wyłącznie operacyjnie w Wytycznych MZ i na stronie RARS (confirmedByEma=false, confirmedByRpl=false)',
        ];
        auditReason =
          'Zidentyfikowano i pobrano oficjalne ChPL EPAR EMA (PL/EN) dla Spikevax XFG (rejestracja centralna CEN — wpisy RPL 54306/54308/54456 zwracają HTTP 400 na /characteristic), lecz brak jeszcze audytu sekcji klinicznych 4–6, brak wpisanej daty w pkt 10 Aneksu I, brak karty w katalogu, a kody GTIN nie występują w EPAR EMA.';
      }
    } else if (item.linkedVaccineIds.includes('vac-infanrix-hexa')) {
      queueGroup = 'B';
      priority = 'critical';
      missingDocumentsOrActions = [
        'Rozstrzygnięcie otwartej niezgodności disc-phenylalanine-content-01 w sekcjach 2 i 4.4 ChPL Infanrix hexa (GSK, 12.02.2026)',
        'Osobna weryfikacja ChPL alternatywnych preparatów jednoskładnikowych / nieskojarzonych używanych w wariancie standardowym I.A.1 (DTaP/DTPw, HBV, IPV, Hib)',
      ];
      auditReason =
        'Powiązana karta vac-infanrix-hexa posiada otwartą rozbieżność disc-phenylalanine-content-01; po jej rozstrzygnięciu wymagana kontrola pełna 1–10 oraz odrębne ChPL wariantu nieskojarzonego I.A.1.';
    } else if (item.id === 'pso-bcg-0') {
      queueGroup = 'A';
      priority = 'high';
      missingDocumentsOrActions = [
        'Pełna kontrola kliniczna sekcji 2, 4 (4.1–4.9), 5 (5.1–5.3) i 6 pobranej ChPL Szczepionka przeciwgruźlicza BCG 10 (RPL ID 19535, R/0210)',
        'Potwierdzenie braku daty w pkt 10 dokumentu BCG 10 w RPL oraz potwierdzenie dostępności rynkowej BCG Szczepionka AJVaccines (RPL ID 20376) w Polsce',
      ];
      auditReason =
        'Zidentyfikowano dokumenty RPL (19535 oraz alternatywny 20376) i wykonano częściowy przegląd (sekcje 1, 3, 7–10); blokada verification_full przez niezaudytowaną sekcję 4 i brak daty w pkt 10.';
    } else if (GROUP_D_PROCEDURAL_EXCEPTION_IDS.has(item.id)) {
      queueGroup = 'D';
      priority = 'high';
      missingDocumentsOrActions = [
        `Pobranie oficjalnych plików PDF ChPL z RPL/EMA dla wszystkich dopuszczonych produktów handlowych procedury ${item.shortCode}`,
        'Weryfikacja sekcji 4.1–4.9 ChPL względem szczególnych reguł PSO (wcześniactwo, dializoterapia, granice wieku / 2–3 dawki RV / HPV 2- vs 3-dawkowe) z zachowaniem rozdziału procedury od pojedynczej karty handlowej',
      ];
      auditReason =
        'Procedura o szczególnych warunkach klinicznych, wiekowych, schematowych (np. 3w1 vs 6w1, RV3, IPV-6, HPV 9–14/9–18, dializy) wymagająca kontroli wielu ChPL lub wariantów bez utożsamiania reguły z jednym preparatem.';
    } else {
      queueGroup = 'C';
      priority = item.obligationType === 'obowiazkowe' ? 'medium' : 'standard';
      missingDocumentsOrActions = [
        `Pobranie oficjalnego pliku PDF ChPL z RPL/EMA dla preparatu referencyjnego (${item.chplReference ?? item.shortCode})`,
        'Utworzenie/uzupełnienie karty produktu w VACCINES_CATALOG i wykonanie dowodowego audytu sekcji 1–10 (w tym 4.1–4.9)',
      ];
      auditReason =
        'Procedura posiada wyłącznie nazwę orientacyjną (reference_name_only) bez pobranego pliku ChPL i audytu sekcji 1–10.';
    }

    return {
      procedureId: item.id,
      aliasId: item.aliasId,
      shortCode: item.shortCode,
      disease: item.disease,
      obligationType: item.obligationType,
      psoPartAndPage: `${item.sourcePart} (str. ${item.sourcePrintedPage}, PDF str. ${item.sourcePdfPage})`,
      queueGroup,
      queueGroupLabel: CHPL_QUEUE_GROUP_LABELS[queueGroup],
      priority,
      currentChplReferenceStatus: item.chplReferenceStatus,
      currentChplContentStatus: item.chplContentVerificationStatus,
      currentChplVerificationStatus: item.chplVerificationStatus,
      currentProductLinkageStatus: item.productLinkageStatus,
      linkedVaccineIds: [...item.linkedVaccineIds],
      officialChplSources,
      missingDocumentsOrActions,
      auditReason,
    };
  });
}

export function getChplManualQueueGroupCounts(
  queue: ChplManualQueueItem[]
): Record<ChplManualQueueGroup, number> {
  return queue.reduce<Record<ChplManualQueueGroup, number>>(
    (acc, entry) => {
      acc[entry.queueGroup] += 1;
      return acc;
    },
    { A: 0, B: 0, C: 0, D: 0, E: 0 }
  );
}

const EXPECTED_STAGE1_PRODUCT_KEYS: Stage1ChplProductKey[] = [
  'influvac_2026_2027',
  'vaxigrip_2026_2027',
  'spikevax_xfg',
  'bcg_10',
];

const EXPECTED_STAGE1_SUBPOINTS: string[] = [
  '1',
  '2',
  '3',
  '4.1',
  '4.2',
  '4.3',
  '4.4',
  '4.5',
  '4.6',
  '4.7',
  '4.8',
  '4.9',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
];

/**
 * Waliduje pakiet I etapu przygotowawczego audytu ChPL (PROMPT 25).
 * Zapewnia rozdział audytu technicznego od klinicznego, kompletność sekcji 1–10 i podpunktów 4.1–4.9
 * oraz twardy zakaz automatycznego awansu do statusu `verified_full` lub przypisania fałszywego audytora.
 */
export function validateStage1ChplAuditBundle(bundle: Stage1ChplAuditBundle): string[] {
  const errors: string[] = [];

  if (bundle.targetProcedureStatusBefore !== 'pending_content_audit') {
    errors.push('Stage-1: targetProcedureStatusBefore musi pozostać "pending_content_audit".');
  }
  if (bundle.targetProcedureStatusAfter !== 'pending_content_audit') {
    errors.push('Stage-1: Zakaz automatycznego awansu — targetProcedureStatusAfter musi pozostać "pending_content_audit".');
  }

  const sourceKeys = new Set(bundle.sourceAndVersionReport.map(s => s.productKey));
  const sheetKeys = new Set(bundle.contentAnalysisSheets.map(s => s.productKey));
  for (const key of EXPECTED_STAGE1_PRODUCT_KEYS) {
    if (!sourceKeys.has(key)) {
      errors.push(`Stage-1: Brak wpisu w raporcie źródeł (a) dla produktu '${key}'.`);
    }
    if (!sheetKeys.has(key)) {
      errors.push(`Stage-1: Brak arkusza treści (b) dla produktu '${key}'.`);
    }
  }

  for (const src of bundle.sourceAndVersionReport) {
    if (!src.officialSourceUrl.startsWith('https://')) {
      errors.push(`[${src.productKey}] URL źródła musi zaczynać się od https://.`);
    }
    if (src.httpStatus !== 200) {
      errors.push(`[${src.productKey}] Wymagany status HTTP 200 dla pobranego dokumentu ChPL.`);
    }
    if (!/^[a-f0-9]{64}$/i.test(src.fileSha256)) {
      errors.push(`[${src.productKey}] Nieprawidłowy skrót SHA-256 pobranego pliku PDF.`);
    }
    if (src.fileSizeBytes <= 0 || src.pageCount <= 0) {
      errors.push(`[${src.productKey}] Nieprawidłowy rozmiar pliku lub liczba stron PDF.`);
    }
  }

  for (const sheet of bundle.contentAnalysisSheets) {
    if (sheet.targetStatusAfterStage1 !== 'pending_content_audit') {
      errors.push(`[${sheet.productKey}] Arkusz I etapu nie może zmieniać statusu z 'pending_content_audit'.`);
    }
    if (!sheet.preparatoryAuditorLabel.trim()) {
      errors.push(`[${sheet.productKey}] Wymagane oznaczenie etapu przygotowawczego w preparatoryAuditorLabel.`);
    }
    const subpointsPresent = sheet.entries.map(e => e.subpointNumber);
    const subpointsSet = new Set(subpointsPresent);
    if (subpointsPresent.length !== subpointsSet.size) {
      errors.push(`[${sheet.productKey}] Zduplikowane wpisy podpunktów w arkuszu analizy treści ChPL.`);
    }
    for (const reqSub of EXPECTED_STAGE1_SUBPOINTS) {
      if (!subpointsSet.has(reqSub)) {
        errors.push(`[${sheet.productKey}] Brak obowiązkowego wpisu dla sekcji/podpunktu '${reqSub}'.`);
      }
    }
    for (const entry of sheet.entries) {
      if (!entry.pageRef.trim() || !entry.conciseSummary.trim() || !entry.sourceExcerptRef.trim()) {
        errors.push(`[${sheet.productKey}:${entry.subpointNumber}] Puste pole pageRef, conciseSummary lub sourceExcerptRef.`);
      }
      if (entry.checkOutcome !== 'ok' && !entry.discrepancyOrAmbiguity?.trim()) {
        errors.push(`[${sheet.productKey}:${entry.subpointNumber}] Status '${entry.checkOutcome}' wymaga opisu discrepancyOrAmbiguity.`);
      }
    }
  }

  if (bundle.missingDataReport.length === 0) {
    errors.push('Stage-1: Lista brakujących danych (c) nie może być pusta dla obecnego stanu dokumentacji.');
  }
  if (bundle.humanDecisionChecklist.length === 0) {
    errors.push('Stage-1: Lista decyzji dla audytora klinicznego (d) nie może być pusta.');
  }
  for (const dec of bundle.humanDecisionChecklist) {
    if (dec.requiresCompetentClinicalAuditorDecision !== true || dec.autoResolved !== false) {
      errors.push(`[${dec.id}] Pytanie do audytora musi mieć requiresCompetentClinicalAuditorDecision=true i autoResolved=false.`);
    }
  }

  return errors;
}
