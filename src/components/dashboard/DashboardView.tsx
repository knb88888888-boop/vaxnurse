import React from 'react';
import {
  Shield,
  Search,
  Activity,
  CheckCircle,
  AlertCircle,
  CalendarDays,
  ExternalLink
} from 'lucide-react';
import type { ModuleDefinition, ModuleId, QuickAccessItem } from '../../types/navigation';
import { QuickAccess } from './QuickAccess';
import { ModuleCard } from './ModuleCard';
import { RecentModules } from './RecentModules';
import type { RecentVisitRecord } from '../../utils/recentModules';

interface DashboardViewProps {
  modules: ModuleDefinition[];
  quickAccessItems: QuickAccessItem[];
  recentVisits: RecentVisitRecord[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectModule: (id: ModuleId) => void;
  onClearRecentVisits?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  modules,
  quickAccessItems,
  recentVisits,
  searchQuery,
  onSearchChange,
  onSelectModule,
  onClearRecentVisits
}) => {
  // Modules excluding 'dashboard'
  const operationalModules = modules.filter(m => m.id !== 'dashboard');

  // Filter modules if search query exists
  const filteredModules = operationalModules.filter(m => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.label.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q) ||
      m.keyFeatures.some(f => f.toLowerCase().includes(q)) ||
      (m.badge && m.badge.toLowerCase().includes(q))
    );
  });

  return (
    <div className="dashboard-container">
      {/* Hero Welcome Header */}
      <section className="dashboard-hero">
        <div className="hero-content">
          <div className="hero-pill">
            <Shield size={14} className="hero-pill-icon" />
            <span>Narzędzie referencyjne pielęgniarki • Tryb lokalny</span>
          </div>

          <h1 className="hero-title">
            Witaj w systemie <span className="highlight-text">VaxNurse</span>
          </h1>

          <p className="hero-description">
            Środowisko wspomagające organizację pracy w punkcie szczepień dzieci i dorosłych:
            referencyjne procedury, odnośniki do PSO 2027, baza ChPL i lokalna kontrola zmian.
          </p>

          {/* Honest status bar */}
          <div className="hero-indicators">
            <div className="indicator-chip chip-success">
              <CheckCircle size={15} />
              <span>Narzędzie referencyjne – treści wymagają weryfikacji z ChPL</span>
            </div>
            <div className="indicator-chip chip-info">
              <Activity size={15} />
              <span>Zakres referencyjny: +2°C .. +8°C (brak połączenia z rejestratorem)</span>
            </div>
            <div className="indicator-chip chip-privacy">
              <Shield size={15} />
              <span>W tej wersji nie przechowujemy danych pacjentów</span>
            </div>
          </div>
        </div>
      </section>

      {/* Official GIS PSO 2027 Notice Card */}
      <div className="pso-reference-alert">
        <div className="pso-alert-content">
          <div className="pso-alert-badge">
            <CalendarDays size={14} />
            <span>PSO 2027</span>
          </div>
          <p className="pso-alert-text">
            Aktualny <strong>Program Szczepień Ochronnych na 2027 rok</strong> – sprawdź oficjalne wytyczne Głównego Inspektoratu Sanitarnego:
          </p>
        </div>
        <a
          href="https://www.gov.pl/web/gis/program-szczepien-ochronnych-na-2027-rok"
          target="_blank"
          rel="noopener noreferrer"
          className="pso-gis-link"
        >
          <span>Oficjalny komunikat GIS</span>
          <ExternalLink size={14} />
        </a>
      </div>

      {/* Embedded Search on Dashboard if user focuses here */}
      <div className="dashboard-search-wrapper">
        <div className="dashboard-search-box">
          <Search size={19} className="dashboard-search-icon" aria-hidden="true" />
          <input
            type="text"
            className="dashboard-search-input"
            placeholder="Szukaj modułów i sekcji VaxNurse (np. szczepienia, ChPL, PSO)..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            aria-label="Szukaj modułów i sekcji VaxNurse"
          />
          {searchQuery && (
            <button
              type="button"
              className="search-reset-button"
              onClick={() => onSearchChange('')}
            >
              Wyczyść
            </button>
          )}
        </div>
      </div>

      {/* If searching, show filter feedback */}
      {searchQuery.trim() ? (
        <div className="search-results-banner">
          <span className="results-count">
            Wyniki wyszukiwania na Pulpicie dla „<strong>{searchQuery}</strong>”: ({filteredModules.length})
          </span>
          {filteredModules.length === 0 && (
            <div className="empty-search-state">
              <AlertCircle size={32} className="empty-icon" />
              <p className="empty-title">Nie znaleziono pasującego modułu</p>
              <p className="empty-desc">
                Spróbuj użyć ogólniejszego hasła, np. „chłodniczy”, „kalendarz”, „dzieci” lub „baza”.
              </p>
              <button
                type="button"
                className="reset-search-cta"
                onClick={() => onSearchChange('')}
              >
                Pokaż wszystkie moduły
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Quick Access Section */}
          <QuickAccess
            items={quickAccessItems}
            onSelectModule={onSelectModule}
          />

          {/* Recent Modules Section */}
          <RecentModules
            recentVisits={recentVisits}
            allModules={modules}
            onSelectModule={onSelectModule}
            onClearHistory={onClearRecentVisits}
          />
        </>
      )}

      {/* Main Modules Grid */}
      <section className="main-modules-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">
              {searchQuery.trim() ? 'Pasujące moduły aplikacji' : 'Główne moduły punktu szczepień'}
            </h2>
            <p className="section-subtitle">
              Aktywne moduły kliniczne, logistyczne i referencyjne punktu szczepień
            </p>
          </div>
          <span className="modules-count-badge">
            {filteredModules.length}{' '}
            {filteredModules.length === 1
              ? 'moduł'
              : filteredModules.length >= 2 && filteredModules.length <= 4
                ? 'moduły'
                : 'modułów'}
          </span>
        </div>

        <div className="modules-grid">
          {filteredModules.map(module => (
            <ModuleCard
              key={module.id}
              module={module}
              onSelect={onSelectModule}
            />
          ))}
        </div>
      </section>
    </div>
  );
};
