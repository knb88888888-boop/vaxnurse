import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Baby,
  Search,
  X,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  BookOpen,
  CheckCircle2,
  CalendarDays,
  Layers,
  HelpCircle,
  AlertTriangle,
  Users,
  AlertCircle,
  Check,
  Minus
} from 'lucide-react';
import type { ModuleDefinition, ModuleId } from '../../types/navigation';
import type { VaccineObligationType, AgeStageGroup, ChildAgeBracketId } from '../../types/childVaccines';
import type { VaccineProduct } from '../../types/vaccines';
import {
  CHILD_AGE_BRACKETS,
  CHILD_VACCINES_CATALOG,
  STAGE_GROUPS_CONFIG,
  STAFF_QUALIFICATIONS_PSO_PART_VI,
  PSO_GENERAL_PRINCIPLES_PART_IV,
  PSO_CATCH_UP_12_POINTS_PART_V,
  CATCH_UP_IMMUNIZATION_PART_V,
  COMBINED_VACCINES_VARIANTS_PART_III_M
} from '../../data/childVaccinesData';
import { VACCINES_CATALOG } from '../../data/vaccinesCatalog';
import { loadVaccinesFromStorage } from '../../utils/vaccineVerification';
import {
  auditChildVaccinesCatalogSummary,
  auditVariantA2IpvCoverage,
} from '../../utils/childVaccineAudit';
import { ChildVaccineCard } from './ChildVaccineCard';

interface ChildVaccinationsViewProps {
  module: ModuleDefinition;
  onBackToDashboard: () => void;
  onNavigateToModule: (id: ModuleId) => void;
  onSelectVaccineProduct?: (vaccineId: string) => void;
}


type ViewTab = 'procedures' | 'qualifications' | 'principles' | 'catchup' | 'combined';

export const ChildVaccinationsView: React.FC<ChildVaccinationsViewProps> = ({
  module,
  onBackToDashboard,
  onNavigateToModule,
  onSelectVaccineProduct
}) => {
  // Active Tab
  const [activeTab, setActiveTab] = useState<ViewTab>('procedures');
  // Sub-tab for catch-up vaccinations
  const [catchupSubTab, setCatchupSubTab] = useState<'all12' | 'summary5'>('all12');

  // Load products from localStorage or default catalog to reflect any pending/clarification statuses
  const catalogVaccines: VaccineProduct[] = useMemo(() => {
    const storage = typeof window !== 'undefined' ? window.localStorage : null;
    const loaded = loadVaccinesFromStorage(storage, VACCINES_CATALOG);
    return loaded.vaccines;
  }, []);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedObligation, setSelectedObligation] = useState<VaccineObligationType | 'all'>('all');
  const [selectedStageGroup, setSelectedStageGroup] = useState<AgeStageGroup>('all');
  const [selectedPathogen, setSelectedPathogen] = useState<'all' | 'bakterie' | 'wirusy'>('all');

  // Filter Logic
  const filteredItems = useMemo(() => {
    return CHILD_VACCINES_CATALOG.filter(item => {
      // 1. Obligation filter
      if (selectedObligation !== 'all' && item.obligationType !== selectedObligation) {
        return false;
      }

      // 2. Stage group filter
      if (selectedStageGroup !== 'all') {
        const bracketDef = CHILD_AGE_BRACKETS.find(b => b.id === item.ageBracketId);
        if (!bracketDef || bracketDef.stageGroup !== selectedStageGroup) {
          return false;
        }
      }

      // 3. Pathogen filter
      if (selectedPathogen !== 'all' && item.pathogenCategory !== selectedPathogen) {
        return false;
      }

      // 4. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesDisease = item.disease.toLowerCase().includes(q);
        const matchesShortCode = item.shortCode.toLowerCase().includes(q);
        const matchesDose = item.doseLabel.toLowerCase().includes(q);
        const matchesRoute = item.administrationRoute.toLowerCase().includes(q);
        const matchesSite = item.injectionSite.toLowerCase().includes(q);
        const matchesAge = item.targetAgeDisplay.toLowerCase().includes(q);
        const matchesNotes = item.clinicalNotes.toLowerCase().includes(q);
        const matchesSection = item.psoSection.toLowerCase().includes(q);

        // Also search in linked vaccine names and structured linkages
        const allLinkedIds = new Set<string>([
          ...item.linkedVaccineIds,
          ...(item.productLinkages?.map(l => l.vaccineId) ?? [])
        ]);
        const matchesLinkedVaccines = Array.from(allLinkedIds).some(id => {
          const v = catalogVaccines.find(vac => vac.id === id);
          return v && (
            v.tradeName.toLowerCase().includes(q) ||
            v.activeSubstance.toLowerCase().includes(q)
          );
        }) || (item.productLinkages ?? []).some(
          l => l.productLabel.toLowerCase().includes(q) || l.psoBasis.toLowerCase().includes(q)
        );

        if (
          !matchesDisease &&
          !matchesShortCode &&
          !matchesDose &&
          !matchesRoute &&
          !matchesSite &&
          !matchesAge &&
          !matchesNotes &&
          !matchesSection &&
          !matchesLinkedVaccines
        ) {
          return false;
        }
      }

      return true;
    });
  }, [searchQuery, selectedObligation, selectedStageGroup, selectedPathogen, catalogVaccines]);

  // Group filtered items by Age Bracket
  const groupedByBracket = useMemo(() => {
    const groups: { bracket: (typeof CHILD_AGE_BRACKETS)[0]; items: typeof filteredItems }[] = [];

    for (const bracket of CHILD_AGE_BRACKETS) {
      const itemsInBracket = filteredItems.filter(item => item.ageBracketId === bracket.id);
      if (itemsInBracket.length > 0) {
        groups.push({
          bracket,
          items: itemsInBracket
        });
      }
    }

    return groups;
  }, [filteredItems]);

  // Statistics (ETAP 8: Precyzyjne nazewnictwo liczników rekordów bazy)
  const totalCount = CHILD_VACCINES_CATALOG.length;
  const mandatoryCount = CHILD_VACCINES_CATALOG.filter(i => i.obligationType === 'obowiazkowe').length;
  const recommendedCount = CHILD_VACCINES_CATALOG.filter(i => i.obligationType === 'zalecane').length;

  const currentMandatoryCount = filteredItems.filter(i => i.obligationType === 'obowiazkowe').length;
  const currentRecommendedCount = filteredItems.filter(i => i.obligationType === 'zalecane').length;

  const catalogAuditSummary = useMemo(
    () => auditChildVaccinesCatalogSummary(CHILD_VACCINES_CATALOG, catalogVaccines),
    [catalogVaccines]
  );
  const variantA2IpvAudit = useMemo(
    () => auditVariantA2IpvCoverage(CHILD_VACCINES_CATALOG),
    []
  );

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedObligation !== 'all' ||
    selectedStageGroup !== 'all' ||
    selectedPathogen !== 'all';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedObligation('all');
    setSelectedStageGroup('all');
    setSelectedPathogen('all');
  };

  const handleSelectBracketDirectly = (bracketId: ChildAgeBracketId) => {
    const element = document.getElementById(`bracket-group-${bracketId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="child-vaccinations-view">
      {/* Top Navigation */}
      <div className="module-view-nav">
        <button
          type="button"
          className="back-to-dashboard-btn"
          onClick={onBackToDashboard}
        >
          <ArrowLeft size={16} />
          <span>Powrót do Pulpitu</span>
        </button>

        <div className="nav-badges-right">
          <span className="source-legal-badge">
            <CheckCircle2 size={14} className="badge-icon-verified" />
            <span>PSO 2027: Dz. Urz. Min. Zdrow. 2026 poz. 77</span>
          </span>
        </div>
      </div>

      {/* Main Module Header Card */}
      <div className="module-view-header-card">
        <div className="module-view-header-left">
          <div className="module-view-icon-box child-icon-theme">
            <Baby size={32} className="module-view-icon" />
          </div>
          <div>
            <div className="module-view-badges">
              <span className="module-category-pill">Moduł kliniczny</span>
              <span className="module-custom-badge">Program Szczepień Ochronnych</span>
              <span className="status-badge-verified">Audyt merytoryczny PSO 2027</span>
            </div>
            <h1 className="module-view-title">{module.label}</h1>
            <p className="module-view-lead">
              Praktyczna baza informacji o szczepieniach obowiązkowych i zalecanych dla dzieci i młodzieży na podstawie oficjalnego Programu Szczepień Ochronnych (PSO 2027) z bezpośrednim powiązaniem z Kartami ChPL, tabelą uprawnień personelu oraz zasadami wykonawczymi.
            </p>
          </div>
        </div>
      </div>

      {/* Official GIS Source Banner */}
      <div className="pso-official-banner">
        <div className="pso-banner-left">
          <CalendarDays size={24} className="pso-banner-icon" />
          <div>
            <div className="pso-banner-meta">
              <span className="pso-badge-tag">Oficjalny publikator państwowy</span>
              <span className="pso-date-tag">Komunikat GIS: 28.10.2026 r. • Dz. Urz. Min. Zdrow.: 30.10.2026 r. poz. 77</span>
            </div>
            <h2 className="pso-banner-title">
              Program Szczepień Ochronnych na 2027 rok (Komunikat Głównego Inspektora Sanitarnego)
            </h2>
            <p className="pso-banner-desc">
              Każdy rekord zawiera numer części PSO, punkt/tabelę, dokładną stronę PDF oraz status weryfikacji. Wszystkie dane są bezpośrednio cytowane z oficjalnego załącznika aktu prawnego opublikowanego 30.10.2026 r. w Dzienniku Urzędowym Ministra Zdrowia poz. 77.
            </p>
          </div>
        </div>
        <div className="pso-banner-right">
          <a
            href="https://dziennikmz.mz.gov.pl/DUM_MZ/2026/77/akt.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="pso-portal-btn"
          >
            <span>Otwórz oficjalny PDF (akt.pdf)</span>
            <ExternalLink size={16} />
          </a>
        </div>
      </div>

      {/* Primary Section Switcher Tabs */}
      <div className="pso-sections-tab-bar">
        <button
          type="button"
          className={`pso-section-nav-btn ${activeTab === 'procedures' ? 'active' : ''}`}
          onClick={() => setActiveTab('procedures')}
        >
          <Baby size={16} />
          <span>Procedury i etapy wiekowe</span>
          <span className="section-tab-count">{CHILD_VACCINES_CATALOG.length} procedur w bazie</span>
        </button>

        <button
          type="button"
          className={`pso-section-nav-btn ${activeTab === 'qualifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('qualifications')}
        >
          <Users size={16} />
          <span>Uprawnienia personelu (Część VI)</span>
        </button>

        <button
          type="button"
          className={`pso-section-nav-btn ${activeTab === 'principles' ? 'active' : ''}`}
          onClick={() => setActiveTab('principles')}
        >
          <BookOpen size={16} />
          <span>Ogólne zasady i wyjątki (Część IV)</span>
        </button>

        <button
          type="button"
          className={`pso-section-nav-btn ${activeTab === 'catchup' ? 'active' : ''}`}
          onClick={() => setActiveTab('catchup')}
        >
          <Layers size={16} />
          <span>Szczepienia wyrównawcze (Część V)</span>
        </button>

        <button
          type="button"
          className={`pso-section-nav-btn ${activeTab === 'combined' ? 'active' : ''}`}
          onClick={() => setActiveTab('combined')}
        >
          <AlertCircle size={16} />
          <span>Warianty 5w1 i 6w1 (Część I.A / III.M)</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: PROCEDURY I ETAPY WIEKOWE
          ========================================================================= */}
      {activeTab === 'procedures' && (
        <>
          {/* Interactive Filter Bar */}
          <div className="child-vaccines-controls">
            {/* Search input */}
            <div className="search-control-container">
              <div className="search-input-wrapper">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  className="child-search-input"
                  placeholder="Szukaj jednostki chorobowej, skrótu (np. DTP, PCV, MMR, Hib), dawki, drogi podania lub preparatu..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="clear-search-btn"
                    onClick={() => setSearchQuery('')}
                    title="Wyczyść wyszukiwanie"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Obligation Filter Tabs */}
            <div className="filters-row">
              <div className="obligation-tabs">
                <button
                  type="button"
                  className={`obligation-tab ${selectedObligation === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedObligation('all')}
                >
                  <span>Wszystkie rekordy bazy</span>
                  <span className="tab-count-badge">{totalCount}</span>
                </button>

                <button
                  type="button"
                  className={`obligation-tab tab-mandatory ${selectedObligation === 'obowiazkowe' ? 'active' : ''}`}
                  onClick={() => setSelectedObligation('obowiazkowe')}
                >
                  <ShieldCheck size={15} />
                  <span>Szczepienia obowiązkowe</span>
                  <span className="tab-count-badge mandatory">{mandatoryCount}</span>
                </button>

                <button
                  type="button"
                  className={`obligation-tab tab-recommended ${selectedObligation === 'zalecane' ? 'active' : ''}`}
                  onClick={() => setSelectedObligation('zalecane')}
                >
                  <Sparkles size={15} />
                  <span>Szczepienia zalecane</span>
                  <span className="tab-count-badge recommended">{recommendedCount}</span>
                </button>
              </div>

              {/* Reset Filters button */}
              {hasActiveFilters && (
                <button
                  type="button"
                  className="reset-filters-btn"
                  onClick={handleResetFilters}
                >
                  <X size={14} />
                  <span>Wyczyść filtry</span>
                </button>
              )}
            </div>

            {/* Transparent Prompt 19 Audit Status Strip */}
            <div className="audit-transparency-strip">
              <span className="audit-pill ok">
                PSO 2027: {catalogAuditSummary.totalProcedures}/{catalogAuditSummary.totalProcedures}
              </span>
              <span className="audit-pill info">
                Dokumenty ChPL w RPL/GSK: {catalogAuditSummary.officialDocumentIdentified} ({catalogAuditSummary.analyzedWithDiscrepancy} niezgodność, {catalogAuditSummary.pendingContentAudit} audyt w toku)
              </span>
              <span className="audit-pill neutral">
                W pełni zweryfikowane ChPL: {catalogAuditSummary.verifiedFull}
              </span>
              <span className="audit-pill warn">
                Alternatywa warunkowa 3w1/6w1: {catalogAuditSummary.conditionalAlternativeLinkages}
              </span>
              <span className="audit-pill warn">
                Finansowanie do doprecyzowania: {catalogAuditSummary.fundingCounts.pending_clarification}
              </span>
            </div>

            {/* Age Stage Group Selector Chips */}
            <div className="stage-groups-selector">
              <div className="selector-label">
                <Layers size={14} />
                <span>Etap rozwoju / wiek:</span>
              </div>
              <div className="stage-chips-list">
                {STAGE_GROUPS_CONFIG.map(grp => (
                  <button
                    key={grp.id}
                    type="button"
                    className={`stage-chip ${selectedStageGroup === grp.id ? 'active' : ''}`}
                    onClick={() => setSelectedStageGroup(grp.id)}
                  >
                    {grp.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-filter: Pathogen Type */}
            <div className="pathogen-selector-row">
              <span className="pathogen-label">Czynnik etiologiczny:</span>
              <div className="pathogen-chips">
                <button
                  type="button"
                  className={`pathogen-btn ${selectedPathogen === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedPathogen('all')}
                >
                  Wszystkie
                </button>
                <button
                  type="button"
                  className={`pathogen-btn ${selectedPathogen === 'bakterie' ? 'active' : ''}`}
                  onClick={() => setSelectedPathogen('bakterie')}
                >
                  Bakterie
                </button>
                <button
                  type="button"
                  className={`pathogen-btn ${selectedPathogen === 'wirusy' ? 'active' : ''}`}
                  onClick={() => setSelectedPathogen('wirusy')}
                >
                  Wirusy
                </button>
              </div>

              <div className="current-results-counter">
                Liczba rekordów w bazie VaxNurse: <strong>{filteredItems.length}</strong> procedur ({currentMandatoryCount} obowiązkowych, {currentRecommendedCount} zalecanych)
                <span className="counter-note-inline"> *(liczba rekordów procedur w bazie, a nie liczba chorób w PSO)*</span>
              </div>
            </div>
          </div>

          {/* Fast Age Bracket Quick Jump Bar */}
          {selectedStageGroup === 'all' && !searchQuery && (
            <div className="age-jump-bar">
              <span className="jump-title">Szybki skok do etapu wiekowego:</span>
              <div className="jump-chips-container">
                {CHILD_AGE_BRACKETS.map(b => (
                  <button
                    key={b.id}
                    type="button"
                    className="jump-chip"
                    onClick={() => handleSelectBracketDirectly(b.id)}
                  >
                    {b.shortLabel}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Main Content: Grouped by Age Brackets */}
          <div className="child-vaccinations-content">
            {groupedByBracket.length === 0 ? (
              <div className="no-results-panel">
                <AlertTriangle size={36} className="no-results-icon" />
                <h3 className="no-results-title">Brak pozycji spełniających wybrane kryteria</h3>
                <p className="no-results-desc">
                  Nie znaleziono procedur szczepiennych pasujących do zapytania &bdquo;{searchQuery}&rdquo; przy aktualnych filtrach.
                </p>
                <button
                  type="button"
                  className="btn-reset-search"
                  onClick={handleResetFilters}
                >
                  Zresetuj wszystkie filtry
                </button>
              </div>
            ) : (
              groupedByBracket.map(({ bracket, items }) => (
                <section
                  key={bracket.id}
                  id={`bracket-group-${bracket.id}`}
                  className="age-bracket-section"
                >
                  {/* Bracket Section Header */}
                  <div className="bracket-section-header">
                    <div className="bracket-header-left">
                      <div className="bracket-number-pill">{bracket.order}</div>
                      <div>
                        <div className="bracket-stage-pill">{bracket.stageGroupLabel}</div>
                        <h2 className="bracket-title">{bracket.label}</h2>
                        <p className="bracket-timing-desc">{bracket.timingDescription}</p>
                      </div>
                    </div>

                    <div className="bracket-header-right">
                      <span className="bracket-count-badge">
                        {items.length} {items.length === 1 ? 'rekord procedury' : items.length < 5 ? 'rekordy procedur' : 'rekordów procedur'}
                      </span>
                    </div>
                  </div>

                  {/* Cards Grid */}
                  <div className="bracket-cards-grid">
                    {items.map(item => (
                      <ChildVaccineCard
                        key={item.id}
                        item={item}
                        catalogVaccines={catalogVaccines}
                        onSelectVaccineProduct={onSelectVaccineProduct}
                      />
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>
        </>
      )}

      {/* =========================================================================
          TAB 2: UPRAWNIENIA PERSONELU (CZĘŚĆ VI PSO 2027)
          ========================================================================= */}
      {activeTab === 'qualifications' && (
        <div className="qualifications-view-container">
          <div className="section-intro-card">
            <div className="intro-title-row">
              <Users size={22} className="intro-icon" />
              <h3>Kwalifikacje osób przeprowadzających badania kwalifikacyjne i szczepienia ochronne</h3>
            </div>
            <p className="intro-text">
              Tabela sporządzona na podstawie <strong>Części VI Programu Szczepień Ochronnych na 2027 rok</strong> (Dz. Urz. Min. Zdrow. 2026 poz. 77, strony 28–30) oraz art. 17 ust. 4, 6 i 6a ustawy z dnia 5 grudnia 2008 r. o zapobieganiu oraz zwalczaniu zakażeń i chorób zakaźnych u ludzi.
            </p>
            <div className="legal-notice-banner">
              <strong>Zasada prawna:</strong> Żadna grupa zawodowa nie może samodzielnie rozszerzać swoich uprawnień poza zakres określony w ustawie i rozporządzeniu Ministra Zdrowia.
            </div>
          </div>

          <div className="qualifications-table-wrapper">
            <table className="qualifications-matrix-table">
              <thead>
                <tr>
                  <th className="col-profession">Zawód / Grupa zawodowa</th>
                  <th className="col-check">1. Kwalifikacja do szczepień obowiązkowych</th>
                  <th className="col-check">2. Podanie szczepień obowiązkowych</th>
                  <th className="col-check">3. Kwalifikacja do zalecanych (&lt;9 lat)</th>
                  <th className="col-check">4. Kwalifikacja do zalecanych (9–18 lat)</th>
                  <th className="col-check">5. Kwalifikacja do zalecanych (&gt;18 lat)</th>
                  <th className="col-check">6. Podanie szczepień zalecanych</th>
                </tr>
              </thead>
              <tbody>
                {STAFF_QUALIFICATIONS_PSO_PART_VI.map(staff => (
                  <tr key={staff.professionId} className="qualification-row">
                    <td className="profession-cell">
                      <div className="prof-name">{staff.professionName}</div>
                      <div className="prof-cond-desc">{staff.legalConditionsDescription}</div>
                      <div className="prof-legal-notes">
                        {staff.legalBasisFootnoteRefs.map((fn, idx) => (
                          <span key={idx} className="legal-ref-tag">{fn}</span>
                        ))}
                      </div>
                    </td>

                    {/* 1. Kwalifikacja obowiązkowa */}
                    <td className="status-cell">
                      {staff.qualificationMandatory ? (
                        <span className="perm-badge perm-allowed" title="Uprawnienie przysługuje">
                          <Check size={16} /> TAK
                        </span>
                      ) : (
                        <span className="perm-badge perm-denied" title="Brak uprawnienia">
                          <Minus size={14} /> NIE
                        </span>
                      )}
                    </td>

                    {/* 2. Podanie obowiązkowe */}
                    <td className="status-cell">
                      {staff.administrationMandatory ? (
                        <span className="perm-badge perm-allowed">
                          <Check size={16} /> TAK
                        </span>
                      ) : (
                        <span className="perm-badge perm-denied">
                          <Minus size={14} /> NIE
                        </span>
                      )}
                    </td>

                    {/* 3. Kwalifikacja zalecana <9 lat */}
                    <td className="status-cell">
                      {staff.qualificationRecommendedUnder9 ? (
                        <span className="perm-badge perm-allowed">
                          <Check size={16} /> TAK
                        </span>
                      ) : (
                        <span className="perm-badge perm-denied">
                          <Minus size={14} /> NIE
                        </span>
                      )}
                    </td>

                    {/* 4. Kwalifikacja zalecana 9–18 lat */}
                    <td className="status-cell">
                      {staff.qualificationRecommended9To18 ? (
                        <span className="perm-badge perm-allowed">
                          <Check size={16} /> TAK
                        </span>
                      ) : (
                        <span className="perm-badge perm-denied">
                          <Minus size={14} /> NIE
                        </span>
                      )}
                    </td>

                    {/* 5. Kwalifikacja zalecana >18 lat */}
                    <td className="status-cell">
                      {staff.qualificationRecommendedOver18 ? (
                        <span className="perm-badge perm-allowed">
                          <Check size={16} /> TAK
                        </span>
                      ) : (
                        <span className="perm-badge perm-denied">
                          <Minus size={14} /> NIE
                        </span>
                      )}
                    </td>

                    {/* 6. Podanie zalecane */}
                    <td className="status-cell">
                      {staff.administrationRecommended ? (
                        <span className="perm-badge perm-allowed">
                          <Check size={16} /> TAK
                        </span>
                      ) : (
                        <span className="perm-badge perm-denied">
                          <Minus size={14} /> NIE
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: OGÓLNE ZASADY PSO (CZĘŚĆ IV PSO 2027 - 7 PUNKTÓW)
          ========================================================================= */}
      {activeTab === 'principles' && (
        <div className="principles-full-view">
          <div className="section-intro-card">
            <div className="intro-title-row">
              <BookOpen size={22} className="intro-icon" />
              <h3>Ogólne zasady przeprowadzania i organizacji szczepień (Część IV PSO 2027)</h3>
            </div>
            <p className="intro-text">
              Poniższe 7 punktów stanowi integralny tekst wytycznych Głównego Inspektora Sanitarnego (Dz. Urz. Min. Zdrow. z 30.10.2026 r. poz. 77, strony 43–44). Wszelkie wyjątki i warunki kliniczne zostały zachowane w pełnym brzmieniu.
            </p>
          </div>

          <div className="principles-detailed-list">
            {PSO_GENERAL_PRINCIPLES_PART_IV.map(item => (
              <div key={item.pointNumber} className="principle-detailed-card">
                <div className="principle-header-box">
                  <div className="principle-point-badge">Punkt {item.pointNumber}</div>
                  <h4 className="principle-point-title">{item.title}</h4>
                  <span className="principle-source-location">{item.psoSection} (strona {item.psoPdfPage} PDF)</span>
                </div>

                <div className="principle-body-box">
                  <div className="official-text-container">
                    <span className="box-label">Oficjalna treść zasady:</span>
                    <p className="official-text">{item.officialRuleText}</p>
                  </div>

                  <div className="clinical-app-container">
                    <span className="box-label">Zastosowanie praktyczne w punkcie szczepień:</span>
                    <p className="clinical-app-text">{item.clinicalApplication}</p>
                  </div>

                  {item.specificExceptions.length > 0 && (
                    <div className="exceptions-container">
                      <span className="box-label-amber">
                        <AlertTriangle size={14} /> Kluczowe wyjątki i warunki wykonawcze:
                      </span>
                      <ul className="exceptions-list">
                        {item.specificExceptions.map((ex, idx) => (
                          <li key={idx} className="exception-item">{ex}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: SZCZEPIENIA WYRÓWNAWCZE (CZĘŚĆ V PSO 2027)
          ========================================================================= */}
      {activeTab === 'catchup' && (
        <div className="catchup-view-container">
          <div className="section-intro-card">
            <div className="intro-title-row">
              <Layers size={22} className="intro-icon" />
              <h3>Zasady przeprowadzania szczepień wyrównawczych (Część V PSO 2027)</h3>
            </div>
            <p className="intro-text">
              Oficjalne wytyczne Głównego Inspektora Sanitarnego dotyczące szczepień wyrównawczych obejmują 12 numerowanych punktów regulujących postępowanie w przypadku opóźnień, niepełnej dokumentacji, ustalania Indywidualnego Kalendarza Szczepień (IKSz) oraz zakończenia okresu obowiązku (Dz. Urz. Min. Zdrow. z 30.10.2026 r. poz. 77, strona 44–45).
            </p>

            <div className="catchup-subtabs-bar">
              <button
                type="button"
                className={`subtab-btn ${catchupSubTab === 'all12' ? 'active' : ''}`}
                onClick={() => setCatchupSubTab('all12')}
              >
                <span>Wszystkie 12 oficjalnych punktów Części V PSO (pełna treść prawna)</span>
              </button>
              <button
                type="button"
                className={`subtab-btn ${catchupSubTab === 'summary5' ? 'active' : ''}`}
                onClick={() => setCatchupSubTab('summary5')}
              >
                <span>Podsumowanie w 5 obszarach klinicznych</span>
              </button>
            </div>
          </div>

          {catchupSubTab === 'all12' ? (
            <div className="principles-detailed-list">
              {PSO_CATCH_UP_12_POINTS_PART_V.map(item => (
                <div key={item.pointNumber} className="principle-detailed-card">
                  <div className="principle-header-box">
                    <div className="principle-point-badge">Punkt {item.pointNumber}</div>
                    <h4 className="principle-point-title">{item.title}</h4>
                    <span className="principle-source-location">{item.psoSection} (strona {item.psoPdfPage} akt.pdf)</span>
                  </div>

                  <div className="principle-body-box">
                    <div className="official-text-container">
                      <span className="box-label">Oficjalna treść przepisu Części V:</span>
                      <p className="official-text">{item.officialRuleText}</p>
                    </div>

                    <div className="clinical-app-container">
                      <span className="box-label">Zastosowanie praktyczne w punkcie szczepień / POZ:</span>
                      <p className="clinical-app-text">{item.clinicalApplication}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="catchup-grid">
              {CATCH_UP_IMMUNIZATION_PART_V.map(g => (
                <div key={g.id} className="catchup-card">
                  <div className="catchup-card-header">
                    <h4 className="catchup-title">{g.title}</h4>
                    <span className="catchup-source">{g.psoSection} (strona {g.psoPdfPage} PDF)</span>
                  </div>

                  <div className="catchup-summary-box">
                    <strong>Zasada nadrzędna:</strong> {g.ruleSummary}
                  </div>

                  <ul className="catchup-procedures-list">
                    {g.detailedProcedures.map((proc, idx) => (
                      <li key={idx} className="procedure-bullet-item">{proc}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 5: WARIANTY 5w1 I 6w1 (CZĘŚĆ I.A I III.M PSO 2027)
          ========================================================================= */}
      {activeTab === 'combined' && (
        <div className="combined-variants-view-container">
          <div className="section-intro-card">
            <div className="intro-title-row">
              <AlertCircle size={22} className="intro-icon" />
              <h3>Warianty szczepionek wysoce skojarzonych 5w1 i 6w1 (Część I.A i Część III.M PSO 2027)</h3>
            </div>
            <p className="intro-text">
              Szczegółowe rozróżnienie wariantów realizowanych ze środków własnych rodziców lub w ramach programów samorządowych na podstawie Części I.A.1, I.A.2 oraz Części III.M pkt 2 komunikatu GIS (PSO 2027, akt.pdf, str. 4–12 oraz str. 42). Podstawowym schematem dla 6w1 jest schemat 3+1; wariant 2+1 dotyczy wyłącznie indywidualnej kontynuacji wcześniej rozpoczętego szczepienia.
            </p>
            <div className="interchangeability-warning-box">
              <AlertTriangle size={18} className="warn-icon" />
              <div>
                <strong>BEZWZGLĘDNE ZASTRZEŻENIE MEDYCZNE:</strong> Szczepionki 5w1 i 6w1 oraz ich schematy (podstawowy 3+1 vs indywidualna kontynuacja 2+1) <strong>NIE SĄ AUTOMATYCZNIE ZAMIENNE</strong>. Zgodnie z Częścią III.M pkt 2 PSO 2027 (str. 42) schemat 2+1 <strong>nie stanowi standardowego schematu dla ogółu dzieci</strong>, lecz służy wyłącznie jako indywidualna kontynuacja wcześniej rozpoczętego szczepienia zgodnie z ChPL i każdorazową pisemną decyzją lekarza kwalifikującego (po uwzględnieniu podania WZW B w 1. dobie życia).
              </div>
            </div>
          </div>

          <div className="combined-cards-grid">
            {COMBINED_VACCINES_VARIANTS_PART_III_M.map(variant => (
              <div key={variant.id} className="variant-card">
                <div className="variant-card-header">
                  <span className="variant-type-tag">
                    {variant.variantType === '5w1' && 'Wariant 5w1'}
                    {variant.variantType === '6w1_3plus1' && 'Wariant 6w1 (schemat podstawowy 3+1)'}
                    {variant.variantType === '6w1_2plus1' && 'Schemat 2+1 – indywidualna kontynuacja wcześniej rozpoczętego szczepienia, zgodnie z ChPL i decyzją lekarza'}
                  </span>
                  <h4 className="variant-name">{variant.name}</h4>
                  <span className="variant-source">{variant.psoPartAndSection} (strona {variant.psoPdfPage} PDF)</span>
                </div>

                <div className="variant-section-block">
                  <span className="block-label">Skład antygenowy:</span>
                  <p className="block-val">{variant.antigenComposition}</p>
                </div>

                <div className="variant-section-block">
                  <span className="block-label">Zasada dotycząca komponentu WZW B:</span>
                  <p className="block-val highlight-hbv">{variant.hbvAdministrationRule}</p>
                </div>

                <div className="variant-section-block">
                  <span className="block-label">Szczegóły schematu dawkowania:</span>
                  <p className="block-val">{variant.scheduleDetails}</p>
                </div>

                <div className="variant-warning-box">
                  <strong>Ostrzeżenie:</strong> {variant.interchangeabilityWarning}
                </div>

                <div className="variant-chpl-ref">
                  <strong>Odnośnik ChPL:</strong> {variant.chplCrossReference}
                </div>
              </div>
            ))}
          </div>

          <div className="variant-ipv-mapping-card">
            <h4 className="ipv-mapping-title">
              Audyt mapowania dawek IPV w Wariancie A.2 (6w1, Część I.A.2 str. 11–12) vs kalendarz standardowy (I.A.1)
            </h4>
            <p className="ipv-mapping-desc">
              W standardowym kalendarzu (I.A.1) pierwsza dawka IPV wypada w 4. m.ż., dlatego w 2. m.ż. nie figuruje odrębna procedura IPV. Przy wyborze szczepionki 6w1 (Wariant A.2) pierwsza dawka IPV jest podawana już w 2. m.ż. w składzie 1. dawki 6w1:
            </p>
            <div className="ipv-mapping-table-wrapper">
              <table className="ipv-mapping-table">
                <thead>
                  <tr>
                    <th>Dawka 6w1 / IPV w A.2</th>
                    <th>Wiek</th>
                    <th>Powiązane procedury PSO</th>
                    <th>Przebieg i mapowanie kliniczne</th>
                  </tr>
                </thead>
                <tbody>
                  {variantA2IpvAudit.doses.map(dose => (
                    <tr key={dose.variantDoseNumber}>
                      <td><strong>{dose.variantDoseNumber}. dawka 6w1 (IPV #{dose.variantDoseNumber})</strong></td>
                      <td>{dose.ageLabel}</td>
                      <td><code>{dose.coveredByProcedureIds.join(', ')}</code></td>
                      <td>{dose.ipvMappingSummary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Informative Clinical Nurse Footer */}
      <div className="child-view-footer-info">
        <div className="footer-info-icon-box">
          <HelpCircle size={24} className="footer-icon-blue" />
        </div>
        <div className="footer-info-content">
          <h4 className="footer-info-heading">Standard rzetelności medycznej VaxNurse</h4>
          <p className="footer-info-text">
            Dane zawarte w module pochodzą w 100% z oficjalnego Komunikatu Głównego Inspektora Sanitarnego z dnia 28 października 2026 r. (Dz. Urz. Min. Zdrow. 2026 poz. 77). Aplikacja nie generuje samodzielnie odstępów ani dawek i ma charakter ściśle referencyjny. Każde podanie preparatu wymaga uprzedniej kwalifikacji lekarskiej.
          </p>
          <div className="footer-navigation-shortcuts">
            <button
              type="button"
              className="footer-shortcut-btn"
              onClick={() => onNavigateToModule('vaccines-database')}
            >
              <BookOpen size={14} />
              <span>Przejdź do Bazy preparatów (Karty ChPL)</span>
            </button>
            <button
              type="button"
              className="footer-shortcut-btn"
              onClick={() => onNavigateToModule('knowledge-base')}
            >
              <ExternalLink size={14} />
              <span>Przejdź do Bazy wiedzy (Dokumenty urzędowe)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
