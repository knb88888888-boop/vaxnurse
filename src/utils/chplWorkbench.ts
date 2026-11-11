import type {
  ChildVaccineItem,
  ChplManualQueueGroup,
  ChplManualQueueItem,
  ChplManualQueuePriority,
  Stage1ChplAuditBundle,
  Stage1ChplCheckOutcome,
  Stage1ChplContentSheet,
  Stage1ChplProductKey,
  Stage1ChplSourceCheck,
  Stage1HumanDecisionItem,
  Stage1MissingDataItem,
} from '../types/childVaccines.ts';
import type { VaccineProduct } from '../types/vaccines.ts';
import {
  auditChildVaccinesCatalogSummary,
  getChplManualQueueGroupCounts,
  getChplManualVerificationQueue,
  validateStage1ChplAuditBundle,
  type ChildVaccinesCatalogAuditSummary,
} from './childVaccineAudit.ts';

export const CHPL_WORKBENCH_SAFETY_NOTICE =
  'Materiały przedstawione w tym panelu mają charakter roboczy i służą analizie dokumentacji. Streszczenia automatyczne nie zastępują pełnej ChPL. Pytania kliniczne wymagają decyzji kompetentnego audytora. Panel nie służy do kwalifikacji pacjenta ani podejmowania decyzji terapeutycznych.';

export interface FourInformationLayer {
  level: 1 | 2 | 3 | 4;
  title: string;
  description: string;
  tone: 'source' | 'summary' | 'problem' | 'human';
}

export const WORKBENCH_INFORMATION_LAYERS: readonly FourInformationLayer[] = [
  {
    level: 1,
    title: '1. Oficjalny dokument źródłowy',
    description:
      'Oryginalne pliki PDF z Rejestru Produktów Leczniczych (RPL) lub EMA EPAR wraz z sumą SHA-256 i numerem pozwolenia.',
    tone: 'source',
  },
  {
    level: 2,
    title: '2. Wstępne streszczenie dokumentu',
    description:
      'Robocza ekstrakcja Etapu I (sekcje 1–10 oraz 4.1–4.9) wygenerowana do przeglądu — nie zastępuje pełnej ChPL.',
    tone: 'summary',
  },
  {
    level: 3,
    title: '3. Problem wymagający oceny',
    description:
      'Wykryte luki metrykalne (missingDataReport), niezgodności źródłowe (np. fenyloalanina w Infanrix hexa) oraz 8 pytań klinicznych.',
    tone: 'problem',
  },
  {
    level: 4,
    title: '4. Decyzja kompetentnego audytora',
    description:
      'Wiążąca ocena i podpis audytora klinicznego — w trybie READ-ONLY Etapu B1 żadne pytanie nie jest automatycznie rozstrzygane.',
    tone: 'human',
  },
];

export const QRD_SECTION_TITLES: Record<string, string> = {
  '1': '1. Nazwa produktu leczniczego',
  '2': '2. Skład jakościowy i ilościowy',
  '3': '3. Postać farmaceutyczna',
  '4.1': '4.1 Wskazania do stosowania',
  '4.2': '4.2 Dawkowanie i sposób podawania',
  '4.3': '4.3 Przeciwwskazania',
  '4.4': '4.4 Specjalne ostrzeżenia i środki ostrożności',
  '4.5': '4.5 Interakcje z innymi produktami leczniczymi',
  '4.6': '4.6 Wpływ na płodność, ciążę i laktację',
  '4.7': '4.7 Wpływ na zdolność prowadzenia pojazdów i maszyn',
  '4.8': '4.8 Działania niepożądane',
  '4.9': '4.9 Przedawkowanie',
  '5': '5. Właściwości farmakologiczne',
  '6': '6. Dane farmaceutyczne',
  '7': '7. Podmiot odpowiedzialny',
  '8': '8. Numer pozwolenia na dopuszczenie do obrotu',
  '9': '9. Data wydania / przedłużenia pozwolenia',
  '10': '10. Data zatwierdzenia lub częściowej zmiany tekstu ChPL',
};

export type WorkbenchSectionBadgeLabel =
  | 'DOKUMENT ZIDENTYFIKOWANY'
  | 'ANALIZA WSTĘPNA'
  | 'WYMAGA KONTROLI'
  | 'NIEZGODNOŚĆ'
  | 'PYTANIE DO AUDYTORA'
  | 'NIE ZATWIERDZONO KLINICZNIE';

export interface SubpointBadgePresentation {
  outcomeLabel: WorkbenchSectionBadgeLabel;
  clinicalLockLabel: 'NIE ZATWIERDZONO KLINICZNIE';
  tone: 'info' | 'warning' | 'discrepancy' | 'question';
}

/**
 * Zwraca wyłącznie bezpieczne etykiety dla wierszy arkusza Etapu I.
 * Nigdy nie zwraca etykiety potwierdzającej pełną weryfikację kliniczną.
 */
export function getSubpointBadgePresentation(
  outcome: Stage1ChplCheckOutcome,
  hasMatchingHumanQuestion: boolean
): SubpointBadgePresentation {
  if (hasMatchingHumanQuestion) {
    return {
      outcomeLabel: 'PYTANIE DO AUDYTORA',
      clinicalLockLabel: 'NIE ZATWIERDZONO KLINICZNIE',
      tone: 'question',
    };
  }
  switch (outcome) {
    case 'missing_in_document':
      return {
        outcomeLabel: 'NIEZGODNOŚĆ',
        clinicalLockLabel: 'NIE ZATWIERDZONO KLINICZNIE',
        tone: 'discrepancy',
      };
    case 'ambiguity_flagged':
    case 'extrapolation_note':
      return {
        outcomeLabel: 'WYMAGA KONTROLI',
        clinicalLockLabel: 'NIE ZATWIERDZONO KLINICZNIE',
        tone: 'warning',
      };
    case 'ok':
    default:
      return {
        outcomeLabel: 'ANALIZA WSTĘPNA',
        clinicalLockLabel: 'NIE ZATWIERDZONO KLINICZNIE',
        tone: 'info',
      };
  }
}

export const QUEUE_PRIORITY_LABELS: Record<ChplManualQueuePriority, string> = {
  critical: 'Krytyczny',
  high: 'Wysoki',
  medium: 'Średni',
  standard: 'Standardowy',
};

export const CHPL_REFERENCE_LABELS: Record<string, string> = {
  official_document_identified: 'DOKUMENT ZIDENTYFIKOWANY',
  reference_name_only: 'Wyłącznie nazwa orientacyjna (brak pliku PDF)',
  not_checked: 'Niesprawdzono',
};

export const CHPL_CONTENT_STATUS_LABELS: Record<string, string> = {
  verified_full: 'Pełna weryfikacja ChPL (1–10)',
  analyzed_with_discrepancy: 'Otwarta niezgodność źródłowa',
  pending_content_audit: 'Oczekuje na pełny audyt treści',
  not_verified: 'Niezweryfikowano merytorycznie',
};

export const STAGE1_PRODUCT_SHORT_LABELS: Record<Stage1ChplProductKey, string> = {
  influvac_2026_2027: 'Influvac (RPL 49462)',
  vaxigrip_2026_2027: 'Vaxigrip (RPL 50032)',
  spikevax_xfg: 'Spikevax XFG (EMA EPAR)',
  bcg_10: 'BCG 10 (RPL 19535)',
};

export interface WorkbenchDocumentSourceEntry {
  id: string;
  sourceCategory: 'Rejestracyjny ChPL (RPL)' | 'Rejestracyjny EPAR (EMA CEN)' | 'Powiązane źródło PSO / RARS';
  documentTypeLabel: string;
  language: 'PL' | 'EN' | 'PL / EN';
  url: string;
  sha256: string | null;
  pageCount: string | null;
  fileSizeBytes: number | null;
  versionOrRevision: string | null;
  downloadedOrTimestamp: string | null;
  scopeRange: string | null;
}

export interface WorkbenchStage1ProductRecord {
  productKey: Stage1ChplProductKey;
  sourceCheck: Stage1ChplSourceCheck;
  contentSheet: Stage1ChplContentSheet | null;
  missingItems: Stage1MissingDataItem[];
  humanQuestions: Stage1HumanDecisionItem[];
  relatedProcedures: ChildVaccineItem[];
  sources: WorkbenchDocumentSourceEntry[];
  linkedCatalogVaccines: VaccineProduct[];
}

export interface ChplWorkbenchSummaryMetrics {
  psoProceduresTotal: number;
  queueTotalCount: number;
  identifiedProcedureDocumentsCount: number;
  stage1ExtractedDocumentsCount: number;
  pendingContentAnalysisProceduresCount: number;
  notVerifiedProceduresCount: number;
  proceduresWithDiscrepancyCount: number;
  catalogProductsWithOpenDiscrepancyCount: number;
  openHumanQuestionsCount: number;
  totalHumanQuestionsCount: number;
  proceduresWithoutSourceCount: number;
  verifiedFullProceduresCount: number;
  verifiedCatalogProductsCount: number;
  missingDataItemsCount: number;
  queueCountsByGroup: Record<ChplManualQueueGroup, number>;
}

export interface ChplWorkbenchSnapshot {
  bundleGeneratedAt: string;
  bundleValidationErrors: string[];
  catalogSummary: ChildVaccinesCatalogAuditSummary;
  metrics: ChplWorkbenchSummaryMetrics;
  queue: ChplManualQueueItem[];
  stage1Products: WorkbenchStage1ProductRecord[];
  allMissingItems: Stage1MissingDataItem[];
  allHumanQuestions: Stage1HumanDecisionItem[];
}

function extractRegexGroup(text: string | null | undefined, pattern: RegExp): string | null {
  if (!text) return null;
  const match = text.match(pattern);
  return match?.[1]?.trim() || null;
}

/**
 * Buduje ustrukturyzowaną listę źródeł z pełnym rozdzieleniem RPL ChPL vs EMA EPAR PL/EN.
 * Dane pochodzą wyłącznie z `STAGE1_CHPL_AUDIT_BUNDLE` oraz powiązanych rekordów `CHILD_VACCINES_CATALOG`.
 */
function buildDocumentSourcesForStage1Product(
  sourceCheck: Stage1ChplSourceCheck,
  relatedProcedures: ChildVaccineItem[]
): WorkbenchDocumentSourceEntry[] {
  const sources: WorkbenchDocumentSourceEntry[] = [];
  const isEma = sourceCheck.rplOrEmaId.startsWith('EMA');
  const primaryAudit = relatedProcedures
    .map(p => p.chplAudit)
    .find(a => Boolean(a));

  const isSecondaryInfluenza = sourceCheck.productKey === 'vaxigrip_2026_2027';
  const annexRangePl =
    sourceCheck.productKey === 'spikevax_xfg'
      ? extractRegexGroup(sourceCheck.technicalNotes, /(str\.\s*[\d–-]+)\s*ze\s*\d+/i) ||
        extractRegexGroup(sourceCheck.seasonOrVariant, /Aneks I\s*(str\.\s*[\d–-]+)/i)
      : null;

  sources.push({
    id: `${sourceCheck.productKey}-primary`,
    sourceCategory: isEma ? 'Rejestracyjny EPAR (EMA CEN)' : 'Rejestracyjny ChPL (RPL)',
    documentTypeLabel: isEma
      ? 'Aneks I EPAR EMA (procedura centralna CEN)'
      : 'Oficjalny ChPL z Rejestru Produktów Leczniczych (RPL)',
    language: 'PL',
    url: sourceCheck.officialSourceUrl,
    sha256: sourceCheck.fileSha256,
    pageCount: `${sourceCheck.pageCount} str.`,
    fileSizeBytes: sourceCheck.fileSizeBytes,
    versionOrRevision: sourceCheck.documentDateInSection10,
    downloadedOrTimestamp:
      (!isSecondaryInfluenza ? primaryAudit?.downloadedAt : null) ||
      sourceCheck.contentDispositionOrLastModified ||
      null,
    scopeRange: annexRangePl ? `Aneks I Spikevax XFG: ${annexRangePl}` : null,
  });

  if (
    sourceCheck.productKey === 'spikevax_xfg' &&
    primaryAudit?.secondaryOfficialSourceUrl
  ) {
    const enPages = extractRegexGroup(
      primaryAudit.metadataDiscrepancyNote,
      /wersja EN\s*\((\d+)\s*str\./i
    );
    const enSmPcRange = extractRegexGroup(
      primaryAudit.metadataDiscrepancyNote,
      /SmPC na\s*(str\.\s*[\d–-]+)/i
    );
    sources.push({
      id: `${sourceCheck.productKey}-en-epar`,
      sourceCategory: 'Rejestracyjny EPAR (EMA CEN)',
      documentTypeLabel: 'Official EMA EPAR Product Information (EN SmPC)',
      language: 'EN',
      url: primaryAudit.secondaryOfficialSourceUrl,
      sha256: primaryAudit.secondaryFileSha256 || null,
      pageCount: enPages ? `${enPages} str.` : null,
      fileSizeBytes: primaryAudit.secondaryFileSizeBytes ?? null,
      versionOrRevision: primaryAudit.documentDateStatus === 'missing_in_document' ? null : primaryAudit.documentVersionOrDate,
      downloadedOrTimestamp: primaryAudit.downloadedAt || null,
      scopeRange: enSmPcRange ? `Annex I SmPC: ${enSmPcRange}` : null,
    });
  }

  return sources;
}

/**
 * Buduje deterministyczny, tylko-odczytowy obraz Stanowiska audytu ChPL bezpośrednio z istniejących źródeł.
 */
export function buildChplWorkbenchSnapshot(
  childCatalog: ChildVaccineItem[],
  vaccines: VaccineProduct[],
  bundle: Stage1ChplAuditBundle
): ChplWorkbenchSnapshot {
  const catalogSummary = auditChildVaccinesCatalogSummary(childCatalog, vaccines);
  const queue = getChplManualVerificationQueue(childCatalog, vaccines);
  const queueCountsByGroup = getChplManualQueueGroupCounts(queue);
  const bundleValidationErrors = validateStage1ChplAuditBundle(bundle);

  const procedureById = new Map(childCatalog.map(item => [item.id, item]));
  const vaccineById = new Map(vaccines.map(vac => [vac.id, vac]));
  const sheetByKey = new Map(bundle.contentAnalysisSheets.map(sheet => [sheet.productKey, sheet]));

  const catalogProductsWithOpenDiscrepancyCount = vaccines.filter(
    v =>
      (v.sourceDiscrepancies ?? []).some(d => d.status !== 'resolved_with_official_document') ||
      v.verificationStatus === 'requires_source_clarification'
  ).length;

  const openHumanQuestionsCount = bundle.humanDecisionChecklist.filter(
    item => item.autoResolved === false
  ).length;

  const stage1Products: WorkbenchStage1ProductRecord[] = bundle.sourceAndVersionReport.map(
    sourceCheck => {
      const relatedProcedures = sourceCheck.relatedProcedureIds
        .map(id => procedureById.get(id))
        .filter((item): item is ChildVaccineItem => Boolean(item));

      const linkedCatalogIds = new Set<string>();
      for (const proc of relatedProcedures) {
        for (const vId of proc.linkedVaccineIds) {
          linkedCatalogIds.add(vId);
        }
      }
      const linkedCatalogVaccines = Array.from(linkedCatalogIds)
        .map(id => vaccineById.get(id))
        .filter((vac): vac is VaccineProduct => Boolean(vac));

      return {
        productKey: sourceCheck.productKey,
        sourceCheck,
        contentSheet: sheetByKey.get(sourceCheck.productKey) || null,
        missingItems: bundle.missingDataReport.filter(
          m => m.productKey === sourceCheck.productKey
        ),
        humanQuestions: bundle.humanDecisionChecklist.filter(
          h => h.productKey === sourceCheck.productKey
        ),
        relatedProcedures,
        sources: buildDocumentSourcesForStage1Product(sourceCheck, relatedProcedures),
        linkedCatalogVaccines,
      };
    }
  );

  return {
    bundleGeneratedAt: bundle.generatedAt,
    bundleValidationErrors,
    catalogSummary,
    metrics: {
      psoProceduresTotal: catalogSummary.totalProcedures,
      queueTotalCount: queue.length,
      identifiedProcedureDocumentsCount: catalogSummary.officialDocumentIdentified,
      stage1ExtractedDocumentsCount: bundle.sourceAndVersionReport.length,
      pendingContentAnalysisProceduresCount: catalogSummary.pendingContentAudit,
      notVerifiedProceduresCount: catalogSummary.notVerifiedContent,
      proceduresWithDiscrepancyCount: catalogSummary.analyzedWithDiscrepancy,
      catalogProductsWithOpenDiscrepancyCount,
      openHumanQuestionsCount,
      totalHumanQuestionsCount: bundle.humanDecisionChecklist.length,
      proceduresWithoutSourceCount: catalogSummary.referenceNameOnly,
      verifiedFullProceduresCount: catalogSummary.verifiedFull,
      verifiedCatalogProductsCount: vaccines.filter(v => v.verificationStatus === 'verified_chpl')
        .length,
      missingDataItemsCount: bundle.missingDataReport.length,
      queueCountsByGroup,
    },
    queue,
    stage1Products,
    allMissingItems: bundle.missingDataReport,
    allHumanQuestions: bundle.humanDecisionChecklist,
  };
}

export interface ChplWorkbenchFilters {
  searchQuery: string;
  queueGroup: ChplManualQueueGroup | 'all';
  priority: ChplManualQueuePriority | 'all';
  chplContentStatus: string;
  stage1ProductFilter: Stage1ChplProductKey | 'infanrix_hexa' | 'all';
  procedureIdFilter: string;
  onlyOpenQuestions: boolean;
  onlySeasonalOrSpecial: boolean;
}

export const DEFAULT_WORKBENCH_FILTERS: ChplWorkbenchFilters = {
  searchQuery: '',
  queueGroup: 'all',
  priority: 'all',
  chplContentStatus: 'all',
  stage1ProductFilter: 'all',
  procedureIdFilter: 'all',
  onlyOpenQuestions: false,
  onlySeasonalOrSpecial: false,
};

export interface EnrichedQueueItem {
  queueItem: ChplManualQueueItem;
  procedure: ChildVaccineItem | undefined;
  linkedVaccines: VaccineProduct[];
  matchingStage1Keys: Stage1ChplProductKey[];
  humanQuestionCount: number;
  missingDataCount: number;
}

/**
 * Zbogaca pozycje kolejki A–E o metadane produktu z katalogu, pytania audytora oraz braki z Etapu I.
 */
export function enrichQueueItems(
  snapshot: ChplWorkbenchSnapshot,
  childCatalog: ChildVaccineItem[],
  vaccines: VaccineProduct[]
): EnrichedQueueItem[] {
  const procMap = new Map(childCatalog.map(item => [item.id, item]));
  const vacMap = new Map(vaccines.map(v => [v.id, v]));

  return snapshot.queue.map(queueItem => {
    const procedure = procMap.get(queueItem.procedureId);
    const linkedVaccines = queueItem.linkedVaccineIds
      .map(id => vacMap.get(id))
      .filter((v): v is VaccineProduct => Boolean(v));

    const matchingStage1Products = snapshot.stage1Products.filter(sp =>
      sp.sourceCheck.relatedProcedureIds.includes(queueItem.procedureId)
    );
    const matchingStage1Keys = matchingStage1Products.map(sp => sp.productKey);

    const humanQuestionCount = snapshot.allHumanQuestions.filter(q =>
      q.relatedProcedureIds.includes(queueItem.procedureId)
    ).length;

    const missingDataCount = snapshot.allMissingItems.filter(m =>
      m.relatedProcedureIds.includes(queueItem.procedureId)
    ).length;

    return {
      queueItem,
      procedure,
      linkedVaccines,
      matchingStage1Keys,
      humanQuestionCount,
      missingDataCount,
    };
  });
}

/**
 * Filtruje kolejkę A–E wg grupy, priorytetu, statusu ChPL, produktu, procedury, pytań otwartych,
 * dokumentów sezonowych/szczególnych oraz frazy wyszukiwania (ID, produkt, substancja, procedura).
 */
export function filterWorkbenchQueue(
  items: EnrichedQueueItem[],
  filters: ChplWorkbenchFilters,
  stage1Products: WorkbenchStage1ProductRecord[]
): EnrichedQueueItem[] {
  const q = filters.searchQuery.trim().toLowerCase();
  const stage1Map = new Map(stage1Products.map(sp => [sp.productKey, sp]));

  return items.filter(entry => {
    const { queueItem, procedure, linkedVaccines, matchingStage1Keys, humanQuestionCount } = entry;

    if (filters.queueGroup !== 'all' && queueItem.queueGroup !== filters.queueGroup) {
      return false;
    }

    if (filters.priority !== 'all' && queueItem.priority !== filters.priority) {
      return false;
    }

    if (
      filters.chplContentStatus !== 'all' &&
      queueItem.currentChplContentStatus !== filters.chplContentStatus
    ) {
      return false;
    }

    if (filters.procedureIdFilter !== 'all' && queueItem.procedureId !== filters.procedureIdFilter) {
      return false;
    }

    if (filters.stage1ProductFilter !== 'all') {
      if (filters.stage1ProductFilter === 'infanrix_hexa') {
        if (!queueItem.linkedVaccineIds.includes('vac-infanrix-hexa')) {
          return false;
        }
      } else if (!matchingStage1Keys.includes(filters.stage1ProductFilter)) {
        return false;
      }
    }

    if (filters.onlyOpenQuestions && humanQuestionCount === 0) {
      return false;
    }

    if (filters.onlySeasonalOrSpecial && queueItem.queueGroup !== 'E' && queueItem.queueGroup !== 'D') {
      return false;
    }

    if (q) {
      const stage1NamesAndSubstances = matchingStage1Keys
        .map(key => {
          const sp = stage1Map.get(key);
          if (!sp) return '';
          return [
            sp.sourceCheck.productKey,
            sp.sourceCheck.productName,
            sp.sourceCheck.rplOrEmaId,
            sp.sourceCheck.authorizationNumber,
            sp.sourceCheck.marketingAuthorizationHolder,
          ].join(' ');
        })
        .join(' ');

      const haystack = [
        queueItem.procedureId,
        queueItem.aliasId || '',
        queueItem.shortCode,
        queueItem.disease,
        procedure?.chplReference || '',
        procedure?.chplProductName || '',
        ...linkedVaccines.flatMap(v => [v.id, v.tradeName, v.activeSubstance, v.manufacturer]),
        stage1NamesAndSubstances,
      ]
        .join(' ')
        .toLowerCase();

      if (!haystack.includes(q)) {
        return false;
      }
    }

    return true;
  });
}

export interface ReadOnlyWorkingReportExport {
  reportKind: 'vaxnurse-chpl-workbench-working-report';
  isWorkingDraft: true;
  clinicalApprovalGranted: false;
  containsPatientData: false;
  disclaimer: string;
  exportedAt: string;
  bundleGeneratedAt: string;
  metrics: ChplWorkbenchSummaryMetrics;
  stage1Documents: Array<{
    productKey: Stage1ChplProductKey;
    productName: string;
    rplOrEmaId: string;
    authorizationNumber: string;
    fileSha256: string;
    pageCount: number;
    documentDateInSection10: string | null;
  }>;
  unresolvedHumanQuestionsCount: number;
  humanQuestions: Stage1HumanDecisionItem[];
}

/**
 * Buduje roboczy eksport raportu audytowego (wyłącznie do odczytu).
 * Nigdy nie zawiera danych pacjentów ani nie stanowi zatwierdzonej dokumentacji klinicznej.
 */
export function buildReadOnlyWorkingReportPayload(
  snapshot: ChplWorkbenchSnapshot,
  exportedAt: string = new Date().toISOString()
): ReadOnlyWorkingReportExport {
  return {
    reportKind: 'vaxnurse-chpl-workbench-working-report',
    isWorkingDraft: true,
    clinicalApprovalGranted: false,
    containsPatientData: false,
    disclaimer: CHPL_WORKBENCH_SAFETY_NOTICE,
    exportedAt,
    bundleGeneratedAt: snapshot.bundleGeneratedAt,
    metrics: snapshot.metrics,
    stage1Documents: snapshot.stage1Products.map(sp => ({
      productKey: sp.productKey,
      productName: sp.sourceCheck.productName,
      rplOrEmaId: sp.sourceCheck.rplOrEmaId,
      authorizationNumber: sp.sourceCheck.authorizationNumber,
      fileSha256: sp.sourceCheck.fileSha256,
      pageCount: sp.sourceCheck.pageCount,
      documentDateInSection10: sp.sourceCheck.documentDateInSection10,
    })),
    unresolvedHumanQuestionsCount: snapshot.metrics.openHumanQuestionsCount,
    humanQuestions: snapshot.allHumanQuestions,
  };
}
