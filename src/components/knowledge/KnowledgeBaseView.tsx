import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Search,
  X,
  ShieldCheck,
  Building2,
  AlertCircle
} from 'lucide-react';
import type { ModuleDefinition } from '../../types/navigation';
import type { KnowledgeCategory } from '../../types/knowledge';
import { KNOWLEDGE_SOURCES, KNOWLEDGE_CATEGORIES } from '../../data/knowledgeSources';
import { KnowledgeCard } from './KnowledgeCard';

interface KnowledgeBaseViewProps {
  module: ModuleDefinition;
  onBackToDashboard: () => void;
}

export const KnowledgeBaseView: React.FC<KnowledgeBaseViewProps> = ({
  module,
  onBackToDashboard
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<KnowledgeCategory | 'all'>('all');
  const [selectedPublisher, setSelectedPublisher] = useState<string | 'all'>('all');

  // Dynamically extract unique publishers for filtering
  const availablePublishers = useMemo(() => {
    const pubSet = new Set<string>();
    KNOWLEDGE_SOURCES.forEach(s => pubSet.add(s.publisher));
    return Array.from(pubSet);
  }, []);

  // Filter sources based on search, category and publisher
  const filteredSources = useMemo(() => {
    return KNOWLEDGE_SOURCES.filter(source => {
      // Category filter
      if (selectedCategory !== 'all' && source.category !== selectedCategory) {
        return false;
      }

      // Publisher filter
      if (selectedPublisher !== 'all' && source.publisher !== selectedPublisher) {
        return false;
      }

      // Search query filter (title, publisher, description, legalActNumber, version)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = source.title.toLowerCase().includes(q);
        const matchesPublisher = source.publisher.toLowerCase().includes(q);
        const matchesDesc = source.description.toLowerCase().includes(q);
        const matchesAct = source.legalActNumber ? source.legalActNumber.toLowerCase().includes(q) : false;
        const matchesVersion = source.version ? source.version.toLowerCase().includes(q) : false;

        if (!matchesTitle && !matchesPublisher && !matchesDesc && !matchesAct && !matchesVersion) {
          return false;
        }
      }

      return true;
    });
  }, [searchQuery, selectedCategory, selectedPublisher]);

  // Counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: KNOWLEDGE_SOURCES.length };
    KNOWLEDGE_CATEGORIES.forEach(cat => {
      counts[cat.id] = KNOWLEDGE_SOURCES.filter(s => s.category === cat.id).length;
    });
    return counts;
  }, []);

  const hasActiveFilters = searchQuery.trim() !== '' || selectedCategory !== 'all' || selectedPublisher !== 'all';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedPublisher('all');
  };

  return (
    <div className="knowledge-base-container">
      {/* Top navigation link */}
      <div className="module-view-nav">
        <button
          type="button"
          className="back-to-dashboard-btn"
          onClick={onBackToDashboard}
        >
          <ArrowLeft size={16} />
          <span>Powrót do Pulpitu</span>
        </button>
        <span className="view-mode-pill">Biblioteka wiedzy i źródeł</span>
      </div>

      {/* Hero Header Card */}
      <div className="module-view-header-card">
        <div className="module-view-header-left">
          <div className="module-view-icon-box">
            <BookOpen size={32} className="module-view-icon" />
          </div>
          <div>
            <div className="module-view-badges">
              <span className="module-category-pill">Moduł referencyjny</span>
              <span className="status-badge-ready">Katalog oficjalny</span>
            </div>
            <h1 className="module-view-title">{module.label} — Biblioteka Źródeł Oficjalnych</h1>
            <p className="module-view-lead">
              Centralny katalog oficjalnych komunikatów państwowych, aktów prawnych, wytycznych GIS/GIF oraz państwowych rejestrów Charakterystyk Produktów Leczniczych (ChPL).
            </p>
          </div>
        </div>
      </div>

      {/* Safety and Principles Reassurance Banner */}
      <section className="knowledge-safety-banner" aria-label="Zasady bezpieczeństwa merytorycznego">
        <div className="safety-banner-icon-col">
          <ShieldCheck size={26} className="safety-shield-icon" />
        </div>
        <div className="safety-banner-text-col">
          <h2 className="safety-banner-heading">Standard bezpieczeństwa i rzetelności źródeł VaxNurse</h2>
          <p className="safety-banner-paragraph">
            Biblioteka gromadzi wyłącznie <strong>oficjalne źródła organów państwowych i publicznych rejestrów</strong> (GIS, MZ, URPL, eZdrowie). 
            System nie generuje samodzielnie dawek, schematów ani zaleceń klinicznych.
            Wszelkie decyzje o kwalifikacji i podaniu szczepionki podejmuje uprawniony personel medyczny w oparciu o aktualne ChPL i oficjalne komunikaty.
          </p>
        </div>
      </section>

      {/* Search and Filters Section */}
      <section className="knowledge-controls-section" aria-label="Wyszukiwanie i filtry źródeł">
        {/* Search Bar */}
        <div className="knowledge-search-bar">
          <Search size={18} className="search-input-icon" />
          <input
            type="text"
            className="search-field"
            placeholder="Szukaj dokumentu, numeru aktu (np. poz. 77), instytucji lub wersji..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            aria-label="Wyszukaj dokument w bazie wiedzy"
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

        {/* Categories Navigation Tabs */}
        <div className="categories-filter-wrapper">
          <div className="categories-filter-header">
            <span className="filter-group-label">Kategoria dokumentu:</span>
          </div>
          <div className="category-chips-list" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={selectedCategory === 'all'}
              className={`category-chip ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              <span>Wszystkie kategorie</span>
              <span className="chip-counter">{categoryCounts.all}</span>
            </button>

            {KNOWLEDGE_CATEGORIES.map(category => {
              const count = categoryCounts[category.id] || 0;
              return (
                <button
                  key={category.id}
                  type="button"
                  role="tab"
                  aria-selected={selectedCategory === category.id}
                  className={`category-chip ${selectedCategory === category.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <span>{category.label}</span>
                  <span className="chip-counter">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Institution / Publisher Filter Bar */}
        <div className="publisher-filter-row">
          <div className="publisher-select-box">
            <Building2 size={16} className="publisher-select-icon" />
            <label htmlFor="publisher-select" className="publisher-select-label">
              Filtruj instytucję:
            </label>
            <select
              id="publisher-select"
              className="publisher-dropdown"
              value={selectedPublisher}
              onChange={e => setSelectedPublisher(e.target.value)}
            >
              <option value="all">Wszystkie instytucje ({KNOWLEDGE_SOURCES.length})</option>
              {availablePublishers.map(pub => (
                <option key={pub} value={pub}>
                  {pub}
                </option>
              ))}
            </select>
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="active-filters-info">
              <span>Aktywne filtry:</span>
              {selectedCategory !== 'all' && (
                <span className="active-tag">
                  Kat: {KNOWLEDGE_CATEGORIES.find(c => c.id === selectedCategory)?.shortLabel}
                </span>
              )}
              {selectedPublisher !== 'all' && (
                <span className="active-tag">
                  Instytucja: {selectedPublisher}
                </span>
              )}
              {searchQuery.trim() && (
                <span className="active-tag">
                  Fraza: „{searchQuery}”
                </span>
              )}
              <button
                type="button"
                className="btn-reset-filters"
                onClick={handleResetFilters}
              >
                Wyczyść wszystkie filtry
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Results Header */}
      <div className="knowledge-results-meta">
        <span className="results-status-text">
          Znalezione dokumenty: <strong>{filteredSources.length}</strong> z {KNOWLEDGE_SOURCES.length}
        </span>
        <span className="results-disclaimer">
          Kliknięcie przycisku otwiera bezpośredni, oficjalny portal państwowy w nowej karcie
        </span>
      </div>

      {/* Documents Grid */}
      {filteredSources.length > 0 ? (
        <div className="knowledge-sources-grid">
          {filteredSources.map(source => (
            <KnowledgeCard key={source.id} source={source} />
          ))}
        </div>
      ) : (
        <div className="knowledge-empty-state">
          <AlertCircle size={36} className="empty-state-icon" />
          <h2 className="empty-state-title">Brak dokumentów spełniających kryteria</h2>
          <p className="empty-state-desc">
            Nie znaleziono źródła dla wpisanej frazy lub wybranych filtrów. Sprawdź pisownię lub zresetuj aktywne filtry.
          </p>
          <button
            type="button"
            className="btn-empty-reset"
            onClick={handleResetFilters}
          >
            Pokaż cały katalog źródeł
          </button>
        </div>
      )}

      {/* Footer Navigation Back */}
      <div className="module-view-footer">
        <p className="footer-status-note">
          Moduł Biblioteki Wiedzy VaxNurse – stan katalogu oficjalnych źródeł: rok 2026/2027.
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
