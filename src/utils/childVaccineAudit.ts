import type {
  ChildVaccineItem,
  ChplContentAuditRecord,
  ChplContentVerificationStatus,
  ChplReferenceStatus,
  ChplVerificationStatus,
} from '../types/childVaccines.ts';
import type { VaccineProduct } from '../types/vaccines.ts';

/**
 * Procedury PSO 2027, w których finansowanie zależy od odrębnych przepisów refundacyjnych
 * lub odrębnych komunikatów Ministra Zdrowia niewystępujących w tekście PSO 2027.
 */
export const EXTERNAL_FUNDING_PENDING_IDS = new Set<string>([
  'pso-rec-influenza-1',
  'pso-rec-hpv-catchup',
  'pso-rec-covid-pediatric',
]);

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

function isValidChplAuditRecord(audit: ChplContentAuditRecord | null | undefined): string[] {
  const issues: string[] = [];
  if (!audit) {
    return ['Brak obiektu audytu treści ChPL (chplAudit).'];
  }
  if (!audit.productName.trim()) {
    issues.push('Brak nazwy produktu w chplAudit.');
  }
  if (!audit.officialSourceUrl.startsWith('https://')) {
    issues.push('Brak oficjalnego URL źródłowego ChPL w chplAudit.');
  }
  if (!audit.documentIdOrAuthorizationNumber.trim()) {
    issues.push('Brak identyfikatora dokumentu lub numeru pozwolenia w chplAudit.');
  }
  if (!audit.documentVersionOrDate.trim()) {
    issues.push('Brak informacji o wersji/dacie dokumentu w chplAudit (wymagana data lub jawny zapis "Brak informacji w dokumencie").');
  }
  if (!audit.auditDate.trim()) {
    issues.push('Brak daty przeprowadzenia audytu w chplAudit.');
  }
  if (!audit.auditor.trim()) {
    issues.push('Brak wskazania osoby/podmiotu audytującego w chplAudit.');
  }
  if (audit.verifiedSectionsScope.length === 0) {
    issues.push('Brak zakresu zweryfikowanych sekcji ChPL w chplAudit.');
  }
  if (audit.auditOutcome !== 'compliant') {
    issues.push(`Wynik audytu ChPL wynosi '${audit.auditOutcome}', wymagany jest 'compliant'.`);
  }
  if (audit.unresolvedDiscrepanciesCount > 0) {
    issues.push(`Istnieją nierozstrzygnięte rozbieżności (${audit.unresolvedDiscrepanciesCount}).`);
  }
  return issues;
}

/**
 * Kontrola bramki awansu do statusu 'verified_full' / 'verified_chpl'.
 * Zablokuje automatyczne lub przedwczesne oznaczenie pełnej zgodności ChPL.
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

  reasons.push(...isValidChplAuditRecord(item.chplAudit));

  const referencedIds = new Set<string>([
    ...item.linkedVaccineIds,
    ...(item.productLinkages?.map(l => l.vaccineId) ?? []),
  ]);

  for (const vaccineId of referencedIds) {
    const product = catalogVaccines.find(v => v.id === vaccineId);
    if (!product) continue;

    if (product.verificationStatus !== 'verified_chpl') {
      reasons.push(`Powiązany preparat ${product.tradeName} (${product.id}) ma status '${product.verificationStatus}', a nie 'verified_chpl'.`);
    }
    const openDiscrepancies = (product.sourceDiscrepancies ?? []).filter(
      d => d.status !== 'resolved_with_official_document'
    );
    if (openDiscrepancies.length > 0) {
      reasons.push(
        `Powiązany preparat ${product.tradeName} ma nierozstrzygnięte niezgodności ChPL: ${openDiscrepancies.map(d => d.id).join(', ')}.`
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
    const { legalBasis, targetGroup, conditions, validityOrVerifiedDate } = item.fundingAuditDetails;
    if (!legalBasis.trim() || !targetGroup.trim() || !conditions.trim() || !validityOrVerifiedDate.trim()) {
      errors.push(`[${item.id}] Niekompletne pola fundingAuditDetails.`);
    }
  }

  if (EXTERNAL_FUNDING_PENDING_IDS.has(item.id) && item.fundingVerificationStatus !== 'pending_clarification') {
    errors.push(
      `[${item.id}] Finansowanie zależne od odrębnych obwieszczeń/komunikatów musi mieć status 'pending_clarification'.`
    );
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
      ipvMappingSummary: '3. dawka IPV w składzie 3. dawki 6w1 w schemacie 3+1 (w I.A.1 to pso-ipv-2; w schemacie 2+1 z decyzji lekarza ta wizyta może być pominięta).',
      isComplete: checkIpvRecord('pso-ipv-2', '3. dawka 6w1'),
    },
    {
      variantDoseNumber: 4,
      ageBracketId: '16-18-miesiac',
      ageLabel: '16.–18. miesiąc życia (od ukończenia 15. mies.)',
      coveredByProcedureIds: ['pso-dtp-4', 'pso-ipv-3', 'pso-hib-4'],
      ipvMappingSummary: '4. dawka IPV w składzie dawki uzupełniającej 6w1 (w I.A.1 to pso-ipv-3; w schemacie 2+1 jest to 3. dawka uzupełniająca).',
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
