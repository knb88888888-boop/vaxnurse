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
  Info,
  Layers,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';
import type { ModuleDefinition, ModuleId } from '../../types/navigation';
import type { VaccineObligationType, AgeStageGroup, ChildAgeBracketId } from '../../types/childVaccines';
import type { VaccineProduct } from '../../types/vaccines';
import {
  CHILD_AGE_BRACKETS,
  CHILD_VACCINES_CATALOG,
  STAGE_GROUPS_CONFIG,
  PSO_GENERAL_PRINCIPLES
} from '../../data/childVaccinesData';
import { VACCINES_CATALOG } from '../../data/vaccinesCatalog';
import { ChildVaccineCard } from './ChildVaccineCard';

interface ChildVaccinationsViewProps {
  module: ModuleDefinition;
  onBackToDashboard: () => void;
  onNavigateToModule: (id: ModuleId) => void;
  onSelectVaccineProduct?: (vaccineId: string) => void;
}

const VAX_STORAGE_KEY = 'vaxnurse_vaccines_catalog_state_v1';

export const ChildVaccinationsView: React.FC<ChildVaccinationsViewProps> = ({
  module,
  onBackToDashboard,
  onNavigateToModule,
  onSelectVaccineProduct
}) => {
  // Load products from localStorage or default catalog to reflect any pending/clarification statuses
  const catalogVaccines: VaccineProduct[] = useMemo(() => {
    try {
      const stored = localStorage.getItem(VAX_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Błąd odczytu bazy preparatów z localStorage:', e);
    }
    return VACCINES_CATALOG;
  }, []);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedObligation, setSelectedObligation] = useState<VaccineObligationType | 'all'>('all');
  const [selectedStageGroup, setSelectedStageGroup] = useState<AgeStageGroup>('all');
  const [selectedPathogen, setSelectedPathogen] = useState<'all' | 'bakterie' | 'wirusy'>('all');
  const [showPrinciplesModal, setShowPrinciplesModal] = useState(false);

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

        // Also search in linked vaccine names
        const matchesLinkedVaccines = item.linkedVaccineIds.some(id => {
          const v = catalogVaccines.find(vac => vac.id === id);
          return v && (
            v.tradeName.toLowerCase().includes(q) ||
            v.activeSubstance.toLowerCase().includes(q)
          );
        });

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

  // Statistics
  const totalCount = CHILD_VACCINES_CATALOG.length;
  const mandatoryCount = CHILD_VACCINES_CATALOG.filter(i => i.obligationType === 'obowiazkowe').length;
  const recommendedCount = CHILD_VACCINES_CATALOG.filter(i => i.obligationType === 'zalecane').length;

  const currentMandatoryCount = filteredItems.filter(i => i.obligationType === 'obowiazkowe').length;
  const currentRecommendedCount = filteredItems.filter(i => i.obligationType === 'zalecane').length;

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
              <span className="status-badge-verified">Zweryfikowano z komunikatem GIS</span>
            </div>
            <h1 className="module-view-title">{module.label}</h1>
            <p className="module-view-lead">
              Praktyczna baza informacji o szczepieniach obowiązkowych i zalecanych dla dzieci i młodzieży na podstawie oficjalnego Programu Szczepień Ochronnych (PSO 2027) z bezpośrednim powiązaniem z Kartami ChPL.
            </p>
          </div>
        </div>

        <div className="module-header-actions">
          <button
            type="button"
            className="btn-principles-modal"
            onClick={() => setShowPrinciplesModal(!showPrinciplesModal)}
          >
            <BookOpen size={16} />
            <span>{showPrinciplesModal ? 'Ukryj zasady ogólne' : 'Zasady ogólne PSO 2027'}</span>
          </button>
        </div>
      </div>

      {/* Official GIS Source Banner */}
      <div className="pso-official-banner">
        <div className="pso-banner-left">
          <CalendarDays size={24} className="pso-banner-icon" />
          <div>
            <div className="pso-banner-meta">
              <span className="pso-badge-tag">Oficjalny publikator państwowy</span>
              <span className="pso-date-tag">Komunikat GIS z dnia 28 października 2026 r.</span>
            </div>
            <h3 className="pso-banner-title">
              Program Szczepień Ochronnych na 2027 rok (Komunikat Głównego Inspektora Sanitarnego)
            </h3>
            <p className="pso-banner-desc">
              Wszystkie zawarte procedury, dawki, odstępy minimalne i grupy docelowe pochodzą bezpośrednio z oficjalnego załącznika do komunikatu opublikowanego w Dzienniku Urzędowym Ministra Zdrowia (poz. 77).
            </p>
          </div>
        </div>
        <div className="pso-banner-right">
          <a
            href="https://www.gov.pl/web/gis/program-szczepien-ochronnych-na-2027-rok"
            target="_blank"
            rel="noopener noreferrer"
            className="pso-portal-btn"
          >
            <span>Przejdź do strony GIS (gov.pl)</span>
            <ExternalLink size={16} />
          </a>
        </div>
      </div>

      {/* Collapsible General Principles Drawer */}
      {showPrinciplesModal && (
        <div className="pso-principles-drawer">
          <div className="drawer-header">
            <div className="drawer-title-box">
              <Info size={20} className="info-icon" />
              <h3>{PSO_GENERAL_PRINCIPLES.title}</h3>
            </div>
            <span className="drawer-sub">{PSO_GENERAL_PRINCIPLES.documentReference}</span>
          </div>

          <div className="principles-grid">
            {PSO_GENERAL_PRINCIPLES.principles.map((pr, idx) => (
              <div key={idx} className="principle-card">
                <div className="principle-number">{idx + 1}</div>
                <div className="principle-content">
                  <h4 className="principle-title">{pr.title}</h4>
                  <p className="principle-text">{pr.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
              <span>Wszystkie szczepienia</span>
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
            Wyświetlono: <strong>{filteredItems.length}</strong> procedur ({currentMandatoryCount} obowiązkowych, {currentRecommendedCount} zalecanych)
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
                    {items.length} {items.length === 1 ? 'procedura' : items.length < 5 ? 'procedury' : 'procedur'}
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
