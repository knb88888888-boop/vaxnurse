import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  ClipboardCheck,
  Copy,
  Download,
  ExternalLink,
  FileSearch,
  FileText,
  Filter,
  HelpCircle,
  Layers,
  Lock,
  Printer,
  RotateCcw,
  Search,
  ShieldAlert,
  X,
} from 'lucide-react';
import type {
  ChplManualQueueGroup,
  ChplManualQueuePriority,
  Stage1ChplProductKey,
} from '../../types/childVaccines.ts';
import type { VaccineProduct } from '../../types/vaccines.ts';
import { CHILD_VACCINES_CATALOG } from '../../data/childVaccinesData.ts';
import { STAGE1_CHPL_AUDIT_BUNDLE } from '../../data/chplStage1AuditSheets.ts';
import { VERIFICATION_STATUS_META, DISCREPANCY_STATUS_META } from '../../data/vaccinesCatalog.ts';
import {
  buildChplWorkbenchSnapshot,
  buildReadOnlyWorkingReportPayload,
  CHPL_CONTENT_STATUS_LABELS,
  CHPL_REFERENCE_LABELS,
  CHPL_WORKBENCH_SAFETY_NOTICE,
  DEFAULT_WORKBENCH_FILTERS,
  enrichQueueItems,
  filterWorkbenchQueue,
  getSubpointBadgePresentation,
  QRD_SECTION_TITLES,
  QUEUE_PRIORITY_LABELS,
  STAGE1_PRODUCT_SHORT_LABELS,
  WORKBENCH_INFORMATION_LAYERS,
  type ChplWorkbenchFilters,
  type WorkbenchStage1ProductRecord,
} from '../../utils/chplWorkbench.ts';
import { triggerJsonDownload } from '../../utils/backup.ts';
import '../../styles/workbench.css';

export interface ChplAuditWorkbenchViewProps {
  vaccines: VaccineProduct[];
  onOpenVaccineById?: (vaccineId: string) => void;
}

type SelectionMode =
  | { kind: 'stage1'; productKey: Stage1ChplProductKey }
  | { kind: 'procedure'; procedureId: string };

const QUEUE_GROUP_ORDER: ChplManualQueueGroup[] = ['A', 'B', 'C', 'D', 'E'];

const QUEUE_GROUP_SHORT_DESCRIPTIONS: Record<ChplManualQueueGroup, string> = {
  A: 'Oficjalny dokument odnaleziony, audyt nieukończony',
  B: 'Otwarte niezgodności',
  C: 'Brak oficjalnego dokumentu',
  D: 'Relacja produkt–procedura wymaga sprawdzenia',
  E: 'Dokumenty sezonowe i szczególne',
};

const MISSING_CATEGORY_LABELS: Record<string, string> = {
  document_metadata: 'Metadane dokumentu (Pkt 10 / data)',
  rpl_index_vs_pdf: 'Indeks RPL vs binarny PDF /characteristic',
  gtin_linkage: 'Kody GTIN / dystrybucja vs EPAR',
  clinical_subsection: 'Podpunkt kliniczny ChPL',
  market_availability: 'Dostępność rynkowa w Polsce',
  source_url_limitation: 'Ograniczenie źródła URL',
};

const LINKAGE_STATUS_LABELS: Record<string, string> = {
  linked_catalog: 'Powiązana z kartą katalogu',
  conditional_alternative: 'Warunkowa alternatywa (np. 6w1)',
  pending_catalog_entry: 'Oczekuje na kartę produktu',
  not_applicable: 'Nie dotyczy',
};

const formatValueOrMissing = (val: string | number | null | undefined): string => {
  if (val === null || val === undefined) return 'Brak danych';
  const s = String(val).trim();
  return s.length > 0 ? s : 'Brak danych';
};

const formatFileSize = (bytes: number | null): string => {
  if (bytes === null || !Number.isFinite(bytes) || bytes <= 0) return 'Brak danych';
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB (${bytes.toLocaleString('pl-PL')} B)`;
  }
  return `${Math.round(bytes / 1024)} kB (${bytes.toLocaleString('pl-PL')} B)`;
};

export const ChplAuditWorkbenchView: React.FC<ChplAuditWorkbenchViewProps> = ({
  vaccines,
  onOpenVaccineById,
}) => {
  const detailsRef = useRef<HTMLElement>(null);

  const snapshot = useMemo(
    () =>
      buildChplWorkbenchSnapshot(
        CHILD_VACCINES_CATALOG,
        vaccines,
        STAGE1_CHPL_AUDIT_BUNDLE
      ),
    [vaccines]
  );

  const enrichedQueue = useMemo(
    () => enrichQueueItems(snapshot, CHILD_VACCINES_CATALOG, vaccines),
    [snapshot, vaccines]
  );

  const [filters, setFilters] = useState<ChplWorkbenchFilters>(DEFAULT_WORKBENCH_FILTERS);
  const [selection, setSelection] = useState<SelectionMode>({
    kind: 'stage1',
    productKey: 'influvac_2026_2027',
  });
  const [showAllMissing, setShowAllMissing] = useState<boolean>(false);
  const [showAllQuestions, setShowAllQuestions] = useState<boolean>(true);
  const [onlyFlaggedSubpoints, setOnlyFlaggedSubpoints] = useState<boolean>(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const filteredQueue = useMemo(
    () => filterWorkbenchQueue(enrichedQueue, filters, snapshot.stage1Products),
    [enrichedQueue, filters, snapshot.stage1Products]
  );

  const hasActiveFilters =
    filters.searchQuery.trim() !== '' ||
    filters.queueGroup !== 'all' ||
    filters.priority !== 'all' ||
    filters.chplContentStatus !== 'all' ||
    filters.stage1ProductFilter !== 'all' ||
    filters.procedureIdFilter !== 'all' ||
    filters.onlyOpenQuestions ||
    filters.onlySeasonalOrSpecial;

  const activeStage1Product: WorkbenchStage1ProductRecord | null = useMemo(() => {
    if (selection.kind === 'stage1') {
      return (
        snapshot.stage1Products.find(sp => sp.productKey === selection.productKey) ||
        snapshot.stage1Products[0] ||
        null
      );
    }
    return (
      snapshot.stage1Products.find(sp =>
        sp.sourceCheck.relatedProcedureIds.includes(selection.procedureId)
      ) || null
    );
  }, [selection, snapshot.stage1Products]);

  const activeProcedureEntry = useMemo(() => {
    if (selection.kind === 'procedure') {
      return (
        enrichedQueue.find(e => e.queueItem.procedureId === selection.procedureId) ||
        null
      );
    }
    if (activeStage1Product) {
      const firstProcId = activeStage1Product.sourceCheck.relatedProcedureIds[0];
      return (
        enrichedQueue.find(e => e.queueItem.procedureId === firstProcId) || null
      );
    }
    return null;
  }, [selection, enrichedQueue, activeStage1Product]);

  const relatedStage1ProductsForSelection = useMemo(() => {
    if (selection.kind === 'stage1' && activeStage1Product) {
      return snapshot.stage1Products.filter(sp =>
        sp.sourceCheck.relatedProcedureIds.some(id =>
          activeStage1Product.sourceCheck.relatedProcedureIds.includes(id)
        )
      );
    }
    if (selection.kind === 'procedure') {
      return snapshot.stage1Products.filter(sp =>
        sp.sourceCheck.relatedProcedureIds.includes(selection.procedureId)
      );
    }
    return [];
  }, [selection, activeStage1Product, snapshot.stage1Products]);

  const displayedMissingItems = useMemo(() => {
    if (showAllMissing || !activeStage1Product) {
      return snapshot.allMissingItems;
    }
    return activeStage1Product.missingItems;
  }, [showAllMissing, activeStage1Product, snapshot.allMissingItems]);

  const displayedQuestions = useMemo(() => {
    if (showAllQuestions || !activeStage1Product) {
      return snapshot.allHumanQuestions;
    }
    return activeStage1Product.humanQuestions;
  }, [showAllQuestions, activeStage1Product, snapshot.allHumanQuestions]);

  const activeProcedureQuestions = useMemo(() => {
    if (activeStage1Product) {
      return activeStage1Product.humanQuestions;
    }
    if (activeProcedureEntry) {
      return snapshot.allHumanQuestions.filter(q =>
        q.relatedProcedureIds.includes(activeProcedureEntry.queueItem.procedureId)
      );
    }
    return [];
  }, [activeStage1Product, activeProcedureEntry, snapshot.allHumanQuestions]);

  const handleCopyText = async (value: string, label: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      }
      setCopiedToken(value);
      setActionFeedback(`Skopiowano do schowka: ${label}`);
      window.setTimeout(() => {
        setCopiedToken(prev => (prev === value ? null : prev));
      }, 2500);
    } catch {
      setActionFeedback(`Referencja (zaznacz i skopiuj ręcznie): ${value}`);
    }
  };

  const handlePrintWorkingReport = () => {
    if (typeof window !== 'undefined' && typeof window.print === 'function') {
      window.print();
    }
  };

  const handleExportWorkingReport = () => {
    const payload = buildReadOnlyWorkingReportPayload(snapshot);
    const dateStamp = new Date().toISOString().slice(0, 10);
    triggerJsonDownload(
      payload,
      `vaxnurse-raport-roboczy-audytu-chpl-${dateStamp}.json`
    );
    setActionFeedback(
      'Wyeksportowano roboczy raport JSON (dokument roboczy bez danych pacjentów i bez zatwierdzenia klinicznego).'
    );
  };

  const handleSelectStage1Product = (productKey: Stage1ChplProductKey) => {
    setSelection({ kind: 'stage1', productKey });
    detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const handleSelectQueueProcedure = (procedureId: string) => {
    setSelection({ kind: 'procedure', procedureId });
    detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const infanrixProduct = useMemo(
    () => vaccines.find(v => v.id === 'vac-infanrix-hexa') || null,
    [vaccines]
  );

  const visibleLinkedVaccines = useMemo(() => {
    const map = new Map<string, VaccineProduct>();
    if (activeStage1Product) {
      for (const v of activeStage1Product.linkedCatalogVaccines) {
        map.set(v.id, v);
      }
    }
    if (activeProcedureEntry) {
      for (const v of activeProcedureEntry.linkedVaccines) {
        map.set(v.id, v);
      }
    }
    return Array.from(map.values());
  }, [activeStage1Product, activeProcedureEntry]);

  const { metrics } = snapshot;

  return (
    <div className="chpl-workbench-container" data-testid="chpl-audit-workbench">
      {/* 1. Nagłówek i opis stanowiska */}
      <section className="wb-header-card" aria-labelledby="wb-main-heading">
        <div className="wb-header-top">
          <div className="wb-header-title-wrap">
            <div className="wb-header-badges">
              <span className="wb-badge wb-badge-readonly">
                <Lock size={13} />
                <span>TRYB WYŁĄCZNIE DO ODCZYTU (ETAP B1)</span>
              </span>
              <span className="wb-badge wb-badge-stage1">
                <span>Pakiet Etapu I: {snapshot.stage1Products.length} dokumenty ChPL/EPAR</span>
              </span>
            </div>
            <h2 id="wb-main-heading" className="wb-main-title">
              Stanowisko audytu dokumentacji ChPL (CHPL Audit Workbench)
            </h2>
            <p className="wb-main-subtitle">
              Centralne narzędzie przeglądowe do porządkowania źródeł RPL/EMA, wstępnych ekstrakcji sekcji 1–10 i 4.1–4.9, wykazu braków metrykalnych oraz 8 pytań wymagających wiążącej decyzji kompetentnego audytora klinicznego.
            </p>
          </div>
          <div className="wb-header-actions">
            <button
              type="button"
              className="wb-action-btn"
              onClick={handlePrintWorkingReport}
            >
              <Printer size={15} />
              <span>Drukuj roboczy raport</span>
            </button>
            <button
              type="button"
              className="wb-action-btn wb-action-btn-secondary"
              onClick={handleExportWorkingReport}
            >
              <Download size={15} />
              <span>Eksportuj roboczy JSON</span>
            </button>
          </div>
        </div>

        {actionFeedback && (
          <div className="wb-action-feedback" role="status" aria-live="polite">
            <Check size={15} />
            <span>{actionFeedback}</span>
          </div>
        )}
      </section>

      {/* 2. Stały komunikat bezpieczeństwa */}
      <section
        className="wb-safety-notice"
        role="note"
        aria-label="Zastrzeżenie bezpieczeństwa i roboczego charakteru materiałów"
      >
        <ShieldAlert size={20} className="wb-safety-icon" />
        <div className="wb-safety-body">
          <strong className="wb-safety-title">
            Ostrzeżenie o roboczym charakterze stanowiska audytowego
          </strong>
          <p className="wb-safety-text">{CHPL_WORKBENCH_SAFETY_NOTICE}</p>
        </div>
      </section>

      {/* Rozdział 4 poziomów informacji (Część VII.1) */}
      <section
        className="wb-layers-grid"
        aria-label="Cztery odrębne poziomy informacji audytowej"
      >
        {WORKBENCH_INFORMATION_LAYERS.map(layer => (
          <div key={layer.level} className={`wb-layer-card tone-${layer.tone}`}>
            <div className="wb-layer-title">{layer.title}</div>
            <p className="wb-layer-desc">{layer.description}</p>
          </div>
        ))}
      </section>

      {/* 3. Sekcja A — Podsumowanie audytów (dane wyliczane z katalogu i bundle) */}
      <section className="wb-summary-section" aria-labelledby="wb-summary-heading">
        <div className="wb-section-heading-row">
          <h3 id="wb-summary-heading" className="wb-section-heading">
            <ClipboardCheck size={18} />
            <span>Sekcja A — Podsumowanie stanu audytu dokumentacji</span>
          </h3>
          <span className="wb-meta-note">
            Integralność pakietu Etapu I:{' '}
            {snapshot.bundleValidationErrors.length === 0
              ? 'Spójny technicznie (0 błędów walidacji)'
              : `${snapshot.bundleValidationErrors.length} uwag walidatora`}
          </span>
        </div>

        <div className="wb-metrics-grid">
          <div className="wb-metric-card">
            <span className="wb-metric-label">Procedury PSO 2027 (katalog dziecięcy)</span>
            <strong className="wb-metric-value" data-testid="metric-pso-procedures">
              {formatValueOrMissing(metrics.psoProceduresTotal)}
            </strong>
            <span className="wb-metric-sub">Baza procedur prawnych PSO</span>
          </div>

          <div className="wb-metric-card">
            <span className="wb-metric-label">Pozycje w kolejce audytowej A–E</span>
            <strong className="wb-metric-value" data-testid="metric-queue-total">
              {formatValueOrMissing(metrics.queueTotalCount)}
            </strong>
            <span className="wb-metric-sub">Wyliczane przez getChplManualVerificationQueue</span>
          </div>

          <div className="wb-metric-card">
            <span className="wb-metric-label">Dokumenty zidentyfikowane</span>
            <strong className="wb-metric-value" data-testid="metric-identified-docs">
              {metrics.identifiedProcedureDocumentsCount} procedur · {metrics.stage1ExtractedDocumentsCount} PDF Etapu I
            </strong>
            <span className="wb-metric-sub">
              Rozdział procedur PSO ({metrics.identifiedProcedureDocumentsCount}) od arkuszy PDF ({metrics.stage1ExtractedDocumentsCount})
            </span>
          </div>

          <div className="wb-metric-card">
            <span className="wb-metric-label">Oczekujące na analizę treści</span>
            <strong className="wb-metric-value" data-testid="metric-pending-analysis">
              {metrics.pendingContentAnalysisProceduresCount} procedury (Etap I) · {metrics.notVerifiedProceduresCount} niezweryfikowane
            </strong>
            <span className="wb-metric-sub">Statusy pending_content_audit vs not_verified</span>
          </div>

          <div className="wb-metric-card tone-warning">
            <span className="wb-metric-label">Rekordy z otwartymi niezgodnościami</span>
            <strong className="wb-metric-value" data-testid="metric-open-discrepancies">
              {metrics.proceduresWithDiscrepancyCount} procedur · {metrics.catalogProductsWithOpenDiscrepancyCount} karta produktu
            </strong>
            <span className="wb-metric-sub">
              W tym blokada Infanrix hexa (disc-phenylalanine-content-01)
            </span>
          </div>

          <div className="wb-metric-card tone-question">
            <span className="wb-metric-label">Pytania oczekujące na decyzję audytora</span>
            <strong className="wb-metric-value" data-testid="metric-open-questions">
              {metrics.openHumanQuestionsCount} z {metrics.totalHumanQuestionsCount}
            </strong>
            <span className="wb-metric-sub">autoResolved = false (wymaga decyzji człowieka)</span>
          </div>

          <div className="wb-metric-card">
            <span className="wb-metric-label">Procedury bez pobranego źródła PDF</span>
            <strong className="wb-metric-value" data-testid="metric-without-source">
              {formatValueOrMissing(metrics.proceduresWithoutSourceCount)}
            </strong>
            <span className="wb-metric-sub">Status: reference_name_only</span>
          </div>

          <div className="wb-metric-card tone-lock">
            <span className="wb-metric-label">Pełne weryfikacje ChPL (verified_full)</span>
            <strong className="wb-metric-value" data-testid="metric-verified-full">
              {metrics.verifiedFullProceduresCount} procedur · {metrics.verifiedCatalogProductsCount} kart ChPL
            </strong>
            <span className="wb-metric-sub">Awans do verified_full zablokowany w trybie roboczym</span>
          </div>
        </div>
      </section>

      {/* Szybki selektor 4 dokumentów Etapu I */}
      <section className="wb-stage1-strip" aria-labelledby="wb-stage1-heading">
        <div className="wb-section-heading-row">
          <h3 id="wb-stage1-heading" className="wb-section-heading">
            <FileText size={18} />
            <span>Cztery pobrane dokumenty I etapu przygotowawczego (STAGE1_CHPL_AUDIT_BUNDLE)</span>
          </h3>
          <span className="wb-meta-note">Wygenerowano: {snapshot.bundleGeneratedAt}</span>
        </div>

        <div className="wb-stage1-cards-grid">
          {snapshot.stage1Products.map(sp => {
            const isSelected =
              selection.kind === 'stage1'
                ? selection.productKey === sp.productKey
                : relatedStage1ProductsForSelection.some(r => r.productKey === sp.productKey);
            const enSource = sp.sources.find(s => s.language === 'EN');
            return (
              <button
                key={sp.productKey}
                type="button"
                className={`wb-stage1-doc-btn ${isSelected ? 'is-selected' : ''}`}
                onClick={() => handleSelectStage1Product(sp.productKey)}
                aria-pressed={isSelected}
              >
                <div className="wb-stage1-doc-top">
                  <span className="wb-doc-key-pill">{sp.sourceCheck.rplOrEmaId}</span>
                  <span className="wb-badge-status-neutral">DOKUMENT ZIDENTYFIKOWANY</span>
                </div>
                <strong className="wb-stage1-doc-name">{sp.sourceCheck.productName}</strong>
                <div className="wb-stage1-doc-meta">
                  <span>Pozwolenie: {sp.sourceCheck.authorizationNumber}</span>
                  <span>
                    Strony PL: {sp.sourceCheck.pageCount}
                    {enSource?.pageCount ? ` · EN: ${enSource.pageCount}` : ''}
                  </span>
                  <span>
                    Wersja pkt 10: {formatValueOrMissing(sp.sourceCheck.documentDateInSection10)}
                  </span>
                </div>
                <div className="wb-stage1-doc-footer">
                  <span className="wb-pill-warn">ANALIZA WSTĘPNA</span>
                  <span className="wb-pill-question">
                    {sp.humanQuestions.length} pyt. · {sp.missingItems.length} braki
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. Sekcja C & B — Filtry oraz Kolejka A–E */}
      <section className="wb-queue-section" aria-labelledby="wb-queue-heading">
        <div className="wb-section-heading-row">
          <h3 id="wb-queue-heading" className="wb-section-heading">
            <Layers size={18} />
            <span>Sekcja B i C — Kolejka ręcznego audytu ChPL (Grupy A–E) i filtry</span>
          </h3>
          <span className="wb-meta-note">
            Widoczne pozycje: <strong>{filteredQueue.length}</strong> z {metrics.queueTotalCount}
          </span>
        </div>

        {/* Karty grup A-E */}
        <div className="wb-queue-groups-grid" role="group" aria-label="Grupy kolejki A do E">
          <button
            type="button"
            className={`wb-group-chip ${filters.queueGroup === 'all' ? 'active' : ''}`}
            onClick={() => setFilters(prev => ({ ...prev, queueGroup: 'all' }))}
            aria-pressed={filters.queueGroup === 'all'}
          >
            <span className="wb-group-code">Wszystkie</span>
            <strong className="wb-group-count">{metrics.queueTotalCount}</strong>
            <span className="wb-group-desc">Pełna kolejka procedur PSO</span>
          </button>

          {QUEUE_GROUP_ORDER.map(group => (
            <button
              key={group}
              type="button"
              className={`wb-group-chip ${filters.queueGroup === group ? 'active' : ''}`}
              onClick={() =>
                setFilters(prev => ({
                  ...prev,
                  queueGroup: prev.queueGroup === group ? 'all' : group,
                }))
              }
              aria-pressed={filters.queueGroup === group}
            >
              <span className="wb-group-code">Grupa {group}</span>
              <strong className="wb-group-count">{metrics.queueCountsByGroup[group]}</strong>
              <span className="wb-group-desc">{QUEUE_GROUP_SHORT_DESCRIPTIONS[group]}</span>
            </button>
          ))}
        </div>

        {/* Filtry i wyszukiwarka (Sekcja C) */}
        <div className="wb-filters-panel">
          <div className="wb-search-row">
            <Search size={17} className="wb-search-icon" />
            <input
              type="text"
              className="wb-search-input"
              placeholder="Szukaj w kolejce po ID procedury, produkcie, substancji czynnej, pozwoleniu lub nazwie procedury..."
              value={filters.searchQuery}
              onChange={e =>
                setFilters(prev => ({ ...prev, searchQuery: e.target.value }))
              }
              aria-label="Szukaj w kolejce audytu ChPL"
            />
            {filters.searchQuery && (
              <button
                type="button"
                className="wb-clear-search-btn"
                onClick={() => setFilters(prev => ({ ...prev, searchQuery: '' }))}
                aria-label="Wyczyść frazę wyszukiwania kolejki"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="wb-filters-row">
            <div className="wb-filter-control">
              <label htmlFor="wb-filter-priority">Priorytet:</label>
              <select
                id="wb-filter-priority"
                value={filters.priority}
                onChange={e =>
                  setFilters(prev => ({
                    ...prev,
                    priority: e.target.value as ChplManualQueuePriority | 'all',
                  }))
                }
              >
                <option value="all">Wszystkie priorytety</option>
                {(Object.keys(QUEUE_PRIORITY_LABELS) as ChplManualQueuePriority[]).map(pr => (
                  <option key={pr} value={pr}>
                    {QUEUE_PRIORITY_LABELS[pr]}
                  </option>
                ))}
              </select>
            </div>

            <div className="wb-filter-control">
              <label htmlFor="wb-filter-chpl-status">Status ChPL:</label>
              <select
                id="wb-filter-chpl-status"
                value={filters.chplContentStatus}
                onChange={e =>
                  setFilters(prev => ({ ...prev, chplContentStatus: e.target.value }))
                }
              >
                <option value="all">Wszystkie statusy treści</option>
                {Object.entries(CHPL_CONTENT_STATUS_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="wb-filter-control">
              <label htmlFor="wb-filter-product">Produkt:</label>
              <select
                id="wb-filter-product"
                value={filters.stage1ProductFilter}
                onChange={e =>
                  setFilters(prev => ({
                    ...prev,
                    stage1ProductFilter: e.target.value as ChplWorkbenchFilters['stage1ProductFilter'],
                  }))
                }
              >
                <option value="all">Wszystkie produkty</option>
                {(Object.keys(STAGE1_PRODUCT_SHORT_LABELS) as Stage1ChplProductKey[]).map(key => (
                  <option key={key} value={key}>
                    {STAGE1_PRODUCT_SHORT_LABELS[key]}
                  </option>
                ))}
                <option value="infanrix_hexa">Infanrix hexa (vac-infanrix-hexa · Grupa B)</option>
              </select>
            </div>

            <div className="wb-filter-control">
              <label htmlFor="wb-filter-procedure">Procedura:</label>
              <select
                id="wb-filter-procedure"
                value={filters.procedureIdFilter}
                onChange={e =>
                  setFilters(prev => ({ ...prev, procedureIdFilter: e.target.value }))
                }
              >
                <option value="all">Wszystkie procedury (43)</option>
                {snapshot.queue.map(q => (
                  <option key={q.procedureId} value={q.procedureId}>
                    {q.procedureId} — {q.shortCode} ({q.disease})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="wb-filter-toggles-row">
            <label className="wb-checkbox-label">
              <input
                type="checkbox"
                checked={filters.onlyOpenQuestions}
                onChange={e =>
                  setFilters(prev => ({ ...prev, onlyOpenQuestions: e.target.checked }))
                }
              />
              <span>Tylko nierozstrzygnięte pytania audytora</span>
            </label>

            <label className="wb-checkbox-label">
              <input
                type="checkbox"
                checked={filters.onlySeasonalOrSpecial}
                onChange={e =>
                  setFilters(prev => ({
                    ...prev,
                    onlySeasonalOrSpecial: e.target.checked,
                  }))
                }
              />
              <span>Dokumenty sezonowe i szczególne (Grupy D/E)</span>
            </label>

            {hasActiveFilters && (
              <button
                type="button"
                className="wb-reset-filters-btn"
                onClick={() => setFilters(DEFAULT_WORKBENCH_FILTERS)}
              >
                <RotateCcw size={14} />
                <span>Wyczyść filtry</span>
              </button>
            )}
          </div>
        </div>

        {/* Lista pozycji kolejki */}
        {filteredQueue.length > 0 ? (
          <div className="wb-queue-list">
            {filteredQueue.map(entry => {
              const {
                queueItem,
                procedure,
                linkedVaccines,
                matchingStage1Keys,
                humanQuestionCount,
                missingDataCount,
              } = entry;

              const isSelected =
                selection.kind === 'procedure'
                  ? selection.procedureId === queueItem.procedureId
                  : activeStage1Product?.sourceCheck.relatedProcedureIds.includes(
                      queueItem.procedureId
                    ) ?? false;

              const productDisplay =
                linkedVaccines.length > 0
                  ? linkedVaccines.map(v => v.tradeName).join(', ')
                  : matchingStage1Keys.length > 0
                    ? matchingStage1Keys.map(k => STAGE1_PRODUCT_SHORT_LABELS[k]).join(', ')
                    : procedure?.chplReference || 'Brak przypisanej karty katalogowej';

              return (
                <article
                  key={queueItem.procedureId}
                  className={`wb-queue-item-card ${isSelected ? 'is-selected' : ''}`}
                >
                  <div className="wb-queue-item-header">
                    <div className="wb-queue-item-ids">
                      <span className={`wb-group-pill group-${queueItem.queueGroup}`}>
                        Grupa {queueItem.queueGroup}
                      </span>
                      <span className={`wb-priority-pill priority-${queueItem.priority}`}>
                        Priorytet: {QUEUE_PRIORITY_LABELS[queueItem.priority]}
                      </span>
                      <code className="wb-code-id">{queueItem.procedureId}</code>
                      <span className="wb-short-code">{queueItem.shortCode}</span>
                    </div>
                    <div className="wb-queue-item-counts">
                      <span className="wb-count-pill">
                        Braki: {queueItem.missingDocumentsOrActions.length}
                        {missingDataCount > 0 ? ` (+${missingDataCount} w Etapie I)` : ''}
                      </span>
                      <span className={`wb-count-pill ${humanQuestionCount > 0 ? 'has-questions' : ''}`}>
                        Pytania audytora: {humanQuestionCount}
                      </span>
                    </div>
                  </div>

                  <div className="wb-queue-item-main">
                    <h4 className="wb-queue-item-title">{queueItem.disease}</h4>
                    <div className="wb-queue-item-product">
                      <strong>Produkt / odwołanie:</strong> {productDisplay}
                    </div>
                    <div className="wb-queue-statuses-grid">
                      <div>
                        <span className="wb-st-label">Status źródła:</span>{' '}
                        <span className="wb-st-val">
                          {CHPL_REFERENCE_LABELS[queueItem.currentChplReferenceStatus] ||
                            queueItem.currentChplReferenceStatus}
                        </span>
                      </div>
                      <div>
                        <span className="wb-st-label">Audyt treści:</span>{' '}
                        <span className="wb-st-val">
                          {CHPL_CONTENT_STATUS_LABELS[queueItem.currentChplContentStatus] ||
                            queueItem.currentChplContentStatus}
                        </span>
                      </div>
                      <div>
                        <span className="wb-st-label">Status katalogowy:</span>{' '}
                        <span className="wb-st-val">
                          {LINKAGE_STATUS_LABELS[queueItem.currentProductLinkageStatus] ||
                            queueItem.currentProductLinkageStatus}
                        </span>
                      </div>
                    </div>
                    <p className="wb-queue-reason">{queueItem.auditReason}</p>
                  </div>

                  <div className="wb-queue-item-actions">
                    <button
                      type="button"
                      className="wb-inspect-btn"
                      onClick={() => handleSelectQueueProcedure(queueItem.procedureId)}
                    >
                      <FileSearch size={15} />
                      <span>Pokaż szczegóły audytu</span>
                    </button>
                    {linkedVaccines.map(vac =>
                      onOpenVaccineById ? (
                        <button
                          key={vac.id}
                          type="button"
                          className="wb-open-card-btn"
                          onClick={() => onOpenVaccineById(vac.id)}
                        >
                          <span>Karta ChPL: {vac.tradeName}</span>
                          <ExternalLink size={14} />
                        </button>
                      ) : null
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="wb-empty-state">
            <Filter size={28} />
            <p>Brak pozycji kolejki spełniających wybrane filtry.</p>
            <button
              type="button"
              className="wb-reset-filters-btn"
              onClick={() => setFilters(DEFAULT_WORKBENCH_FILTERS)}
            >
              Pokaż wszystkie procedury kolejki
            </button>
          </div>
        )}
      </section>

      {/* 5. Sekcja D — Szczegóły wybranego produktu / procedury (9 podsekcji wg 3.3D) */}
      <section
        ref={detailsRef}
        className="wb-details-section"
        aria-labelledby="wb-details-heading"
        tabIndex={-1}
      >
        <div className="wb-section-heading-row">
          <h3 id="wb-details-heading" className="wb-section-heading">
            <FileSearch size={18} />
            <span>
              Sekcja D — Szczegóły dokumentacji audytowej:{' '}
              {activeStage1Product
                ? activeStage1Product.sourceCheck.productName
                : activeProcedureEntry
                  ? `${activeProcedureEntry.queueItem.disease} (${activeProcedureEntry.queueItem.procedureId})`
                  : 'Wybierz dokument lub procedurę'}
            </span>
          </h3>
          {relatedStage1ProductsForSelection.length > 1 && (
            <div className="wb-doc-switcher" role="group" aria-label="Dokumenty powiązane z procedurą">
              {relatedStage1ProductsForSelection.map(sp => (
                <button
                  key={sp.productKey}
                  type="button"
                  className={`wb-doc-switch-btn ${
                    activeStage1Product?.productKey === sp.productKey ? 'active' : ''
                  }`}
                  onClick={() => handleSelectStage1Product(sp.productKey)}
                >
                  {STAGE1_PRODUCT_SHORT_LABELS[sp.productKey]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Podsekcja 1: Dane identyfikacyjne */}
        <div className="wb-subpanel">
          <h4 className="wb-subpanel-title">1. Dane identyfikacyjne produktu i procedury</h4>
          {activeStage1Product ? (
            <div className="wb-kv-grid">
              <div className="wb-kv-item">
                <span className="wb-kv-label">Nazwa z oficjalnego ChPL/EPAR:</span>
                <span className="wb-kv-val">{activeStage1Product.sourceCheck.productName}</span>
              </div>
              <div className="wb-kv-item">
                <span className="wb-kv-label">Identyfikator rejestrowy (RPL / EMA):</span>
                <span className="wb-kv-val">{activeStage1Product.sourceCheck.rplOrEmaId}</span>
              </div>
              <div className="wb-kv-item">
                <span className="wb-kv-label">Numer pozwolenia:</span>
                <span className="wb-kv-val">{activeStage1Product.sourceCheck.authorizationNumber}</span>
              </div>
              <div className="wb-kv-item">
                <span className="wb-kv-label">Podmiot odpowiedzialny:</span>
                <span className="wb-kv-val">{activeStage1Product.sourceCheck.marketingAuthorizationHolder}</span>
              </div>
              <div className="wb-kv-item">
                <span className="wb-kv-label">Sezon / wariant / opis:</span>
                <span className="wb-kv-val">{activeStage1Product.sourceCheck.seasonOrVariant}</span>
              </div>
              <div className="wb-kv-item">
                <span className="wb-kv-label">Klucz techniczny / procedury:</span>
                <span className="wb-kv-val wb-inline-copy">
                  <code>{activeStage1Product.productKey}</code> (
                  {activeStage1Product.sourceCheck.relatedProcedureIds.join(', ')})
                  <button
                    type="button"
                    className="wb-copy-btn"
                    onClick={() =>
                      handleCopyText(
                        `${activeStage1Product.productKey} (${activeStage1Product.sourceCheck.rplOrEmaId}, poz. ${activeStage1Product.sourceCheck.authorizationNumber})`,
                        'identyfikator produktu'
                      )
                    }
                  >
                    <Copy size={13} />
                    <span>Kopiuj ID</span>
                  </button>
                </span>
              </div>
            </div>
          ) : activeProcedureEntry ? (
            <div className="wb-kv-grid">
              <div className="wb-kv-item">
                <span className="wb-kv-label">ID procedury PSO:</span>
                <span className="wb-kv-val wb-inline-copy">
                  <code>{activeProcedureEntry.queueItem.procedureId}</code>
                  <button
                    type="button"
                    className="wb-copy-btn"
                    onClick={() =>
                      handleCopyText(
                        activeProcedureEntry.queueItem.procedureId,
                        'ID procedury'
                      )
                    }
                  >
                    <Copy size={13} />
                    <span>Kopiuj ID</span>
                  </button>
                </span>
              </div>
              <div className="wb-kv-item">
                <span className="wb-kv-label">Choroba / kod:</span>
                <span className="wb-kv-val">
                  {activeProcedureEntry.queueItem.disease} ({activeProcedureEntry.queueItem.shortCode})
                </span>
              </div>
              <div className="wb-kv-item">
                <span className="wb-kv-label">Odwołanie referencyjne PSO:</span>
                <span className="wb-kv-val">
                  {formatValueOrMissing(activeProcedureEntry.procedure?.chplReference)}
                </span>
              </div>
              <div className="wb-kv-item">
                <span className="wb-kv-label">Sekcja PSO 2027:</span>
                <span className="wb-kv-val">{activeProcedureEntry.queueItem.psoPartAndPage}</span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Podsekcja 2: Źródła oficjalne */}
        <div className="wb-subpanel">
          <h4 className="wb-subpanel-title">
            2. Źródła oficjalne (rozdział ChPL RPL vs EPAR EMA CEN vs GTIN/RARS/PSO)
          </h4>
          {activeStage1Product ? (
            <div className="wb-sources-list">
              {activeStage1Product.sources.map(src => (
                <div key={src.id} className="wb-source-card">
                  <div className="wb-source-card-top">
                    <span className="wb-source-cat-pill">{src.sourceCategory}</span>
                    <span className="wb-source-lang-pill">Język: {src.language}</span>
                    {src.scopeRange && (
                      <span className="wb-source-scope-pill">{src.scopeRange}</span>
                    )}
                  </div>
                  <div className="wb-source-type">{src.documentTypeLabel}</div>
                  <div className="wb-kv-grid wb-kv-compact">
                    <div className="wb-kv-item">
                      <span className="wb-kv-label">Liczba stron / rozmiar:</span>
                      <span className="wb-kv-val">
                        {formatValueOrMissing(src.pageCount)} · {formatFileSize(src.fileSizeBytes)}
                      </span>
                    </div>
                    <div className="wb-kv-item">
                      <span className="wb-kv-label">Wersja / rewizja w Pkt 10:</span>
                      <span className="wb-kv-val">{formatValueOrMissing(src.versionOrRevision)}</span>
                    </div>
                    <div className="wb-kv-item">
                      <span className="wb-kv-label">Pobrano / nagłówek źródła:</span>
                      <span className="wb-kv-val wb-break-text">
                        {formatValueOrMissing(src.downloadedOrTimestamp)}
                      </span>
                    </div>
                    <div className="wb-kv-item wb-kv-full">
                      <span className="wb-kv-label">SHA-256 pliku PDF:</span>
                      <span className="wb-kv-val wb-inline-copy">
                        <code className="wb-sha-code">{formatValueOrMissing(src.sha256)}</code>
                        {src.sha256 && (
                          <button
                            type="button"
                            className="wb-copy-btn"
                            onClick={() => handleCopyText(src.sha256 || '', 'SHA-256 PDF')}
                          >
                            <Copy size={13} />
                            <span>{copiedToken === src.sha256 ? 'Skopiowano' : 'Kopiuj SHA-256'}</span>
                          </button>
                        )}
                      </span>
                    </div>
                    <div className="wb-kv-item wb-kv-full">
                      <span className="wb-kv-label">Adres URL dokumentu:</span>
                      <span className="wb-kv-val wb-break-text">
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="wb-pdf-link"
                        >
                          <span>Otwórz oryginalny PDF ({src.language})</span>
                          <ExternalLink size={14} />
                        </a>
                        <span className="wb-url-raw">{src.url}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="wb-info-box">
              Dla tej procedury nie wyekstrahowano jeszcze binarnego pliku ChPL/EPAR w pakiecie Etapu I.
              {activeProcedureEntry && activeProcedureEntry.queueItem.officialChplSources.length > 0 && (
                <ul className="wb-source-url-list">
                  {activeProcedureEntry.queueItem.officialChplSources.map(url => (
                    <li key={url}>
                      <a href={url} target="_blank" rel="noopener noreferrer" className="wb-pdf-link">
                        <span>{url}</span>
                        <ExternalLink size={13} />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Podsekcja 3: Metadane dokumentu */}
        <div className="wb-subpanel">
          <h4 className="wb-subpanel-title">3. Metadane dokumentu i uwagi techniczne</h4>
          {activeStage1Product ? (
            <div className="wb-meta-notes-box">
              <div className="wb-kv-grid">
                <div className="wb-kv-item">
                  <span className="wb-kv-label">Nagłówek odpowiedzi (HTTP {activeStage1Product.sourceCheck.httpStatus}):</span>
                  <span className="wb-kv-val wb-break-text">
                    {activeStage1Product.sourceCheck.contentDispositionOrLastModified}
                  </span>
                </div>
                <div className="wb-kv-item">
                  <span className="wb-kv-label">Status kontroli technicznej źródła:</span>
                  <span className="wb-kv-val">
                    {activeStage1Product.sourceCheck.sourceCheckStatus === 'verified_with_metadata_gap'
                      ? 'DOKUMENT ZIDENTYFIKOWANY (z luką metrykalną w indeksie/pkt 10)'
                      : 'DOKUMENT ZIDENTYFIKOWANY'}
                  </span>
                </div>
              </div>
              <p className="wb-tech-notes-text">
                <strong>Uwagi techniczne ekstraktora:</strong> {activeStage1Product.sourceCheck.technicalNotes}
              </p>
              <button
                type="button"
                className="wb-copy-btn"
                onClick={() =>
                  handleCopyText(
                    `${activeStage1Product.sourceCheck.productName} | ${activeStage1Product.sourceCheck.rplOrEmaId} | poz. ${activeStage1Product.sourceCheck.authorizationNumber} | ${activeStage1Product.sourceCheck.officialSourceUrl} | SHA-256: ${activeStage1Product.sourceCheck.fileSha256}`,
                    'pełna referencja dokumentu'
                  )
                }
              >
                <Copy size={13} />
                <span>Kopiuj referencję źródłową</span>
              </button>
            </div>
          ) : (
            <p className="wb-muted-text">
              Brak pobranych metadanych PDF dla procedury {activeProcedureEntry?.queueItem.procedureId}. Wykorzystywane jest odwołanie PSO: {formatValueOrMissing(activeProcedureEntry?.procedure?.chplReference)}.
            </p>
          )}
        </div>

        {/* Podsekcja 4: Kontrola integralności dokumentu oraz ochrona Infanrix hexa */}
        <div className="wb-subpanel">
          <h4 className="wb-subpanel-title">4. Kontrola integralności dokumentu i blokady kliniczne</h4>
          <div className="wb-integrity-box">
            <div className="wb-integrity-row">
              <span className="wb-badge-status-neutral">
                Walidacja pakietu Stage-1: {snapshot.bundleValidationErrors.length === 0 ? 'OK (0 błędów)' : `${snapshot.bundleValidationErrors.length} błędów`}
              </span>
              <span className="wb-badge-status-neutral">
                Niezmienniki 43 procedur PSO: {snapshot.catalogSummary.invariantViolations.length === 0 ? 'OK (0 naruszeń)' : `${snapshot.catalogSummary.invariantViolations.length} naruszeń`}
              </span>
            </div>

            {/* Zawsze czytelna ochrona Infanrix hexa (gdy wybrany Infanrix lub jako stały status krytyczny) */}
            {(visibleLinkedVaccines.some(v => v.id === 'vac-infanrix-hexa') ||
              (infanrixProduct &&
                (infanrixProduct.sourceDiscrepancies ?? []).some(
                  d => d.status !== 'resolved_with_official_document'
                ))) &&
              infanrixProduct && (
                <div className="wb-infanrix-lock-alert" role="region" aria-label="Nierozstrzygnięta niezgodność Infanrix hexa">
                  <AlertTriangle size={18} className="wb-lock-icon" />
                  <div>
                    <strong>
                      Karta krytyczna <code>vac-infanrix-hexa</code> — blokada zatwierdzenia aktywna
                    </strong>
                    <p>
                      Niezgodność <code>disc-phenylalanine-content-01</code> (Punkt 2: 0,0289 µg vs Punkt 4.4: 0,0298 µg fenyloalaniny) pozostaje ze statusem{' '}
                      <strong>
                        {VERIFICATION_STATUS_META[infanrixProduct.verificationStatus]?.label ||
                          infanrixProduct.verificationStatus}
                      </strong>{' '}
                      ({DISCREPANCY_STATUS_META[infanrixProduct.sourceDiscrepancies?.[0]?.status ?? 'requires_clarification']?.label}). W tym stanowisku brak możliwości obejścia lub zamknięcia blokady.
                    </p>
                    {onOpenVaccineById && (
                      <button
                        type="button"
                        className="wb-open-card-btn"
                        onClick={() => onOpenVaccineById('vac-infanrix-hexa')}
                      >
                        <span>Przejdź do karty Infanrix hexa w katalogu</span>
                        <ExternalLink size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* Podsekcja 5: Arkusz treści ChPL (sekcje 1–10 i podpunkty 4.1–4.9) */}
        <div className="wb-subpanel">
          <div className="wb-subpanel-header-inline">
            <h4 className="wb-subpanel-title">
              5. Roboczy arkusz treści ChPL (sekcje 1–10 oraz podpunkty 4.1–4.9)
            </h4>
            {activeStage1Product?.contentSheet && (
              <label className="wb-checkbox-label">
                <input
                  type="checkbox"
                  checked={onlyFlaggedSubpoints}
                  onChange={e => setOnlyFlaggedSubpoints(e.target.checked)}
                />
                <span>Pokaż tylko punkty z flagami kontroli / niezgodnością</span>
              </label>
            )}
          </div>

          {activeStage1Product?.contentSheet ? (
            <>
              <p className="wb-sheet-origin-note">
                <strong>Pochodzenie arkusza:</strong>{' '}
                {activeStage1Product.contentSheet.preparatoryAuditorLabel} (status docelowy po Etapie I:{' '}
                <code>{activeStage1Product.contentSheet.targetStatusAfterStage1}</code>).
              </p>
              <div className="wb-sheet-entries-list">
                {activeStage1Product.contentSheet.entries
                  .filter(e => !onlyFlaggedSubpoints || e.checkOutcome !== 'ok')
                  .map(entry => {
                    const hasMatchingQuestion = activeStage1Product.humanQuestions.some(q =>
                      q.chplSectionOrSubpoint.includes(entry.subpointNumber)
                    );
                    const badge = getSubpointBadgePresentation(
                      entry.checkOutcome,
                      hasMatchingQuestion
                    );
                    return (
                      <div key={entry.subpointNumber} className={`wb-sheet-row tone-${badge.tone}`}>
                        <div className="wb-sheet-row-top">
                          <div className="wb-sheet-row-title">
                            <span className="wb-subpoint-badge">Pkt {entry.subpointNumber}</span>
                            <strong>
                              {QRD_SECTION_TITLES[entry.subpointNumber] ||
                                `Sekcja ${entry.sectionNumber} / ${entry.subpointNumber}`}
                            </strong>
                            <span className="wb-page-ref-badge">{entry.pageRef}</span>
                          </div>
                          <div className="wb-sheet-row-badges">
                            <span className={`wb-outcome-badge tone-${badge.tone}`}>
                              {badge.outcomeLabel}
                            </span>
                            <span className="wb-lock-clinical-badge">
                              {badge.clinicalLockLabel}
                            </span>
                          </div>
                        </div>

                        <div className="wb-sheet-summary">
                          <span className="wb-summary-prefix">Wstępne streszczenie z bundle:</span>{' '}
                          {entry.conciseSummary}
                        </div>

                        {entry.discrepancyOrAmbiguity && (
                          <div className="wb-sheet-discrepancy">
                            <strong>Uwaga / rozbieżność:</strong> {entry.discrepancyOrAmbiguity}
                          </div>
                        )}

                        <div className="wb-sheet-source-foot">
                          <span>
                            <strong>Źródło w dokumencie:</strong> {entry.sourceExcerptRef}
                          </span>
                          <span>
                            <strong>Flaga analizy:</strong> <code>{entry.checkOutcome}</code>
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </>
          ) : (
            <div className="wb-info-box">
              Dla procedury <code>{activeProcedureEntry?.queueItem.procedureId}</code> nie utworzono jeszcze arkusza analizy sekcji 1–10 w <code>STAGE1_CHPL_AUDIT_BUNDLE</code>.
            </div>
          )}
        </div>

        {/* Podsekcja 6: Brakujące dane (missingDataReport) */}
        <div className="wb-subpanel">
          <div className="wb-subpanel-header-inline">
            <h4 className="wb-subpanel-title">
              6. Wykaz brakujących danych (missingDataReport — {displayedMissingItems.length} pozycji)
            </h4>
            <button
              type="button"
              className="wb-toggle-scope-btn"
              onClick={() => setShowAllMissing(prev => !prev)}
            >
              {showAllMissing
                ? 'Pokaż tylko dla wybranego dokumentu'
                : `Pokaż wszystkie w Etapie I (${snapshot.allMissingItems.length})`}
            </button>
          </div>

          {displayedMissingItems.length > 0 ? (
            <div className="wb-missing-list">
              {displayedMissingItems.map(item => (
                <div key={item.id} className="wb-missing-card">
                  <div className="wb-missing-card-top">
                    <span className="wb-doc-key-pill">
                      {STAGE1_PRODUCT_SHORT_LABELS[item.productKey]}
                    </span>
                    <span className="wb-cat-pill">
                      {MISSING_CATEGORY_LABELS[item.category] || item.category}
                    </span>
                    <span className="wb-pill-discrepancy">Stan: Nierozwiązane (brak w źródle)</span>
                  </div>
                  <h5 className="wb-missing-title">{item.missingElement}</h5>
                  <p className="wb-missing-fact">
                    <strong>Zaobserwowany fakt / miejsce:</strong> {item.observedFact}
                  </p>
                  <p className="wb-missing-impact">
                    <strong>Znaczenie dla kompletności audytu:</strong> {item.impactOnVerification}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="wb-muted-text">Brak pozycji w raporcie braków dla wybranego dokumentu.</p>
          )}
        </div>

        {/* Podsekcja 7: Pytania wymagające decyzji audytora (wszystkie 8 pytań) */}
        <div className="wb-subpanel">
          <div className="wb-subpanel-header-inline">
            <h4 className="wb-subpanel-title">
              7. Pytania wymagające wiążącej decyzji audytora klinicznego ({displayedQuestions.length} z {snapshot.allHumanQuestions.length} otwartych)
            </h4>
            {activeStage1Product && (
              <button
                type="button"
                className="wb-toggle-scope-btn"
                onClick={() => setShowAllQuestions(prev => !prev)}
              >
                {showAllQuestions
                  ? `Filtruj do bieżącego dokumentu (${activeProcedureQuestions.length})`
                  : `Pokaż wszystkie 8 pytań Etapu I (${snapshot.allHumanQuestions.length})`}
              </button>
            )}
          </div>

          <div className="wb-questions-list" data-testid="auditor-questions-list">
            {displayedQuestions.map(q => (
              <article key={q.id} className="wb-question-card" data-question-id={q.id}>
                <div className="wb-question-top">
                  <div className="wb-question-ids">
                    <HelpCircle size={16} className="wb-q-icon" />
                    <code className="wb-code-id">{q.id}</code>
                    <span className="wb-doc-key-pill">
                      {STAGE1_PRODUCT_SHORT_LABELS[q.productKey]}
                    </span>
                    <span className="wb-subpoint-badge">Sekcja ChPL: {q.chplSectionOrSubpoint}</span>
                    <span className="wb-page-ref-badge">{q.pageRef}</span>
                  </div>
                  <div className="wb-question-status-badges">
                    <span className="wb-pill-question">PYTANIE DO AUDYTORA</span>
                    <span className="wb-pill-readonly-flag">
                      autoResolved: {String(q.autoResolved)} (Oczekuje na decyzję człowieka)
                    </span>
                  </div>
                </div>
                <p className="wb-question-text">{q.clinicalQuestion}</p>
                <p className="wb-question-ambiguity">
                  <strong>Dlaczego wymaga decyzji:</strong> {q.ambiguitySummary}
                </p>
              </article>
            ))}
          </div>
        </div>

        {/* Podsekcja 8: Status weryfikacji (READ-ONLY) */}
        <div className="wb-subpanel">
          <h4 className="wb-subpanel-title">8. Status weryfikacji i granice kompetencyjne panelu</h4>
          <div className="wb-readonly-status-card">
            <div className="wb-kv-grid">
              <div className="wb-kv-item">
                <span className="wb-kv-label">Status procedur przed / po Etapie I:</span>
                <span className="wb-kv-val">
                  <code>{STAGE1_CHPL_AUDIT_BUNDLE.targetProcedureStatusBefore}</code> →{' '}
                  <code>{STAGE1_CHPL_AUDIT_BUNDLE.targetProcedureStatusAfter}</code>
                </span>
              </div>
              <div className="wb-kv-item">
                <span className="wb-kv-label">Status zatwierdzenia klinicznego:</span>
                <span className="wb-kv-val">
                  <strong>NIE ZATWIERDZONO KLINICZNIE</strong> (brak możliwości nadania <code>verified_full</code> ani zamykania pytań)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Podsekcja 9: Powiązania z procedurami PSO */}
        <div className="wb-subpanel">
          <h4 className="wb-subpanel-title">9. Powiązania z procedurami PSO 2027</h4>
          {(activeStage1Product?.relatedProcedures.length ||
            activeProcedureEntry?.procedure) ? (
            <div className="wb-procedures-links-grid">
              {(activeStage1Product?.relatedProcedures.length
                ? activeStage1Product.relatedProcedures
                : activeProcedureEntry?.procedure
                  ? [activeProcedureEntry.procedure]
                  : []
              ).map(proc => (
                <div key={proc.id} className="wb-proc-link-card">
                  <div className="wb-proc-link-top">
                    <code className="wb-code-id">{proc.id}</code>
                    <span className="wb-short-code">{proc.shortCode}</span>
                  </div>
                  <strong>{proc.disease}</strong>
                  <div className="wb-proc-link-meta">
                    <span>
                      <strong>Sekcja PSO:</strong> {proc.psoSection}
                    </span>
                    <span>
                      <strong>Status PSO:</strong> {proc.psoVerificationStatus}
                    </span>
                    <span>
                      <strong>Audyt ChPL:</strong>{' '}
                      {CHPL_CONTENT_STATUS_LABELS[proc.chplContentVerificationStatus] ||
                        proc.chplContentVerificationStatus}
                    </span>
                    <span>
                      <strong>Powiązanie katalogowe:</strong>{' '}
                      {LINKAGE_STATUS_LABELS[proc.productLinkageStatus] ||
                        proc.productLinkageStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="wb-muted-text">Brak przypisanych procedur PSO.</p>
          )}
        </div>
      </section>
    </div>
  );
};
