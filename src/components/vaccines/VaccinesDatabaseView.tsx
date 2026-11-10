import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Syringe,
  Search,
  X,
  ExternalLink,
  AlertCircle,
  FileCheck
} from 'lucide-react';
import type { ModuleDefinition } from '../../types/navigation';
import type {
  VaccineProduct,
  VaccineType,
  VaccineTargetGroup,
  VaccineVerificationStatus
} from '../../types/vaccines';
import {
  VACCINES_CATALOG,
  VERIFICATION_STATUS_META,
  VACCINE_TYPE_LABELS,
  TARGET_GROUP_LABELS
} from '../../data/vaccinesCatalog';
import { VaccineCard } from './VaccineCard';
import { VaccineDetailView } from './VaccineDetailView';

interface VaccinesDatabaseViewProps {
  module: ModuleDefinition;
  onBackToDashboard: () => void;
}

export const VaccinesDatabaseView: React.FC<VaccinesDatabaseViewProps> = ({
  module,
  onBackToDashboard
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<VaccineType | 'all'>('all');
  const [selectedTargetGroup, setSelectedTargetGroup] = useState<VaccineTargetGroup | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<VaccineVerificationStatus | 'all'>('all');
  const [activeVaccineDetail, setActiveVaccineDetail] = useState<VaccineProduct | null>(null);

  // Filter vaccines
  const filteredVaccines = useMemo(() => {
    return VACCINES_CATALOG.filter(v => {
      // Type filter
      if (selectedType !== 'all' && v.vaccineType !== selectedType) {
        return false;
      }

      // Target group filter
      if (selectedTargetGroup !== 'all' && v.targetGroup !== selectedTargetGroup) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'all' && v.verificationStatus !== selectedStatus) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTrade = v.tradeName.toLowerCase().includes(q);
        const matchesSubstance = v.activeSubstance.toLowerCase().includes(q);
        const matchesManufacturer = v.manufacturer.toLowerCase().includes(q);
        const matchesAuth = v.marketingAuthorizationNumber
          ? v.marketingAuthorizationNumber.toLowerCase().includes(q)
          : false;
        const matchesAtc = v.atcCode ? v.atcCode.toLowerCase().includes(q) : false;

        if (!matchesTrade && !matchesSubstance && !matchesManufacturer && !matchesAuth && !matchesAtc) {
          return false;
        }
      }

      return true;
    });
  }, [searchQuery, selectedType, selectedTargetGroup, selectedStatus]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedType !== 'all' ||
    selectedTargetGroup !== 'all' ||
    selectedStatus !== 'all';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setSelectedTargetGroup('all');
    setSelectedStatus('all');
  };

  // If a vaccine detail is selected, show detail view
  if (activeVaccineDetail) {
    return (
      <VaccineDetailView
        vaccine={activeVaccineDetail}
        onBackToList={() => setActiveVaccineDetail(null)}
      />
    );
  }

  return (
    <div className="vaccines-database-container">
      {/* Top navigation */}
      <div className="module-view-nav">
        <button
          type="button"
          className="back-to-dashboard-btn"
          onClick={onBackToDashboard}
        >
          <ArrowLeft size={16} />
          <span>Powrót do Pulpitu</span>
        </button>
        <span className="view-mode-pill">Katalog Produktów Leczniczych</span>
      </div>

      {/* Hero Header Card */}
      <div className="module-view-header-card">
        <div className="module-view-header-left">
          <div className="module-view-icon-box">
            <Syringe size={32} className="module-view-icon" />
          </div>
          <div>
            <div className="module-view-badges">
              <span className="module-category-pill">Moduł kliniczny</span>
              <span className="status-badge-ready">Struktura 13 sekcji ChPL</span>
            </div>
            <h1 className="module-view-title">{module.label} — Katalog Produktów Leczniczych</h1>
            <p className="module-view-lead">
              Katalog referencyjny preparatów szczepionkowych stosowanych u dzieci i dorosłych.
              Każda karta posiada ustrukturyzowany podział na 13 punktów Charakterystyki Produktu Leczniczego (ChPL).
            </p>
          </div>
        </div>
      </div>

      {/* Official Registry Reference Alert Banner */}
      <section className="vaccines-official-banner" aria-label="Ważne informacje o źródłach rejestrowych">
        <div className="v-banner-icon-box">
          <FileCheck size={26} className="v-banner-icon" />
        </div>
        <div className="v-banner-content">
          <div className="v-banner-badge">Zasada weryfikacji dokumentacji</div>
          <h2 className="v-banner-title">
            Weryfikacja w Rejestrze Produktów Leczniczych (RPL)
          </h2>
          <p className="v-banner-desc">
            Rejestr RPL jest głównym miejscem weryfikacji aktualnej charakterystyki produktu (ChPL) dopuszczonego do obrotu w Polsce. 
            <strong> Nie traktuj wykazu refundowanych leków URPL jako kompletnej bazy wszystkich szczepionek.</strong>
            Wszystkie treści medyczne wymagają potwierdzenia z oficjalną dokumentacją rejestrową.
          </p>
          <div className="v-banner-links-row">
            <a
              href="https://rejestrymedyczne.ezdrowie.gov.pl/rpl/search/public"
              target="_blank"
              rel="noopener noreferrer"
              className="v-btn-rpl"
            >
              <span>Publiczna wyszukiwarka RPL (eZdrowie)</span>
              <ExternalLink size={14} />
            </a>
            <a
              href="https://leki.urpl.gov.pl/index.php"
              target="_blank"
              rel="noopener noreferrer"
              className="v-btn-urpl"
            >
              <span>Serwis URPL</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </section>

      {/* Controls & Filters Section */}
      <section className="vaccines-controls-section" aria-label="Wyszukiwanie i filtry preparatów">
        {/* Search Input */}
        <div className="vaccines-search-bar">
          <Search size={18} className="search-input-icon" />
          <input
            type="text"
            className="search-field"
            placeholder="Szukaj po nazwie handlowej (np. Infanrix), substancji czynnej, kodzie ATC lub producencie..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            aria-label="Wyszukaj preparat w bazie"
          />
          {searchQuery && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearchQuery('')}
              aria-label="Wyczyść frazę wyszukiwania"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Multi-Filter Row */}
        <div className="vaccines-filter-row">
          {/* Target Group Filter */}
          <div className="filter-dropdown-group">
            <label htmlFor="target-group-select" className="filter-dropdown-label">
              Grupa docelowa:
            </label>
            <select
              id="target-group-select"
              className="filter-dropdown-select"
              value={selectedTargetGroup}
              onChange={e => setSelectedTargetGroup(e.target.value as VaccineTargetGroup | 'all')}
            >
              <option value="all">Wszystkie grupy wiekowe</option>
              {(Object.keys(TARGET_GROUP_LABELS) as VaccineTargetGroup[]).map(group => (
                <option key={group} value={group}>
                  {TARGET_GROUP_LABELS[group]}
                </option>
              ))}
            </select>
          </div>

          {/* Vaccine Type Filter */}
          <div className="filter-dropdown-group">
            <label htmlFor="vaccine-type-select" className="filter-dropdown-label">
              Rodzaj szczepionki:
            </label>
            <select
              id="vaccine-type-select"
              className="filter-dropdown-select"
              value={selectedType}
              onChange={e => setSelectedType(e.target.value as VaccineType | 'all')}
            >
              <option value="all">Wszystkie rodzaje</option>
              {(Object.keys(VACCINE_TYPE_LABELS) as VaccineType[]).map(type => (
                <option key={type} value={type}>
                  {VACCINE_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>

          {/* Verification Status Filter */}
          <div className="filter-dropdown-group">
            <label htmlFor="status-select" className="filter-dropdown-label">
              Status weryfikacji:
            </label>
            <select
              id="status-select"
              className="filter-dropdown-select"
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value as VaccineVerificationStatus | 'all')}
            >
              <option value="all">Wszystkie statusy weryfikacji</option>
              {(Object.keys(VERIFICATION_STATUS_META) as VaccineVerificationStatus[]).map(st => (
                <option key={st} value={st}>
                  {VERIFICATION_STATUS_META[st].label}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              className="btn-reset-v-filters"
              onClick={handleResetFilters}
            >
              Wyczyść filtry
            </button>
          )}
        </div>
      </section>

      {/* Meta Results Counter */}
      <div className="vaccines-results-meta">
        <span className="results-count-text">
          Liczba preparatów w katalogu: <strong>{filteredVaccines.length}</strong> z {VACCINES_CATALOG.length}
        </span>
        <span className="results-subtext">
          Kliknij kartę preparatu, aby otworzyć szczegółowy widok 13 sekcji ChPL
        </span>
      </div>

      {/* Vaccines Grid */}
      {filteredVaccines.length > 0 ? (
        <div className="vaccines-cards-grid">
          {filteredVaccines.map(vaccine => (
            <VaccineCard
              key={vaccine.id}
              vaccine={vaccine}
              onOpenDetails={vac => setActiveVaccineDetail(vac)}
            />
          ))}
        </div>
      ) : (
        <div className="vaccines-empty-state">
          <AlertCircle size={36} className="empty-state-icon" />
          <h2 className="empty-state-title">Nie znaleziono pasujących preparatów</h2>
          <p className="empty-state-desc">
            Brak preparatów spełniających podane kryteria wyszukiwania i filtrów. Sprawdź pisownię lub zresetuj filtry.
          </p>
          <button
            type="button"
            className="btn-empty-reset"
            onClick={handleResetFilters}
          >
            Pokaż wszystkie preparaty
          </button>
        </div>
      )}

      {/* Footer Navigation Back */}
      <div className="module-view-footer">
        <p className="footer-status-note">
          Moduł Baza Preparatów VaxNurse – struktura referencyjna 13 sekcji ChPL. Wszelkie treści wymagają potwierdzenia z RPL.
        </p>
        <button
          type="button"
          className="btn-primary-dashboard"
          onClick={onBackToDashboard}
        >
          Powrót do Pulpitu
        </button>
      </div>
    </div>
  );
};
