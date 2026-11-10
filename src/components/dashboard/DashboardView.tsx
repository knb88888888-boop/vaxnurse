import React from 'react';
import {
  Shield,
  Search,
  Activity,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import type { ModuleDefinition, ModuleId, QuickAccessItem } from '../../types/navigation';
import { QuickAccess } from './QuickAccess';
import { ModuleCard } from './ModuleCard';
import { RecentModules } from './RecentModules';
import type { RecentVisit } from './RecentModules';

interface DashboardViewProps {
  modules: ModuleDefinition[];
  quickAccessItems: QuickAccessItem[];
  recentVisits: RecentVisit[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectModule: (id: ModuleId) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  modules,
  quickAccessItems,
  recentVisits,
  searchQuery,
  onSearchChange,
  onSelectModule
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
            <span>Narzędzie wsparcia pielęgniarki • Bezpieczna praca gabinetowa</span>
          </div>

          <h1 className="hero-title">
            Witaj w systemie <span className="highlight-text">VaxNurse</span>
          </h1>

          <p className="hero-description">
            Nowoczesne środowisko wspomagające codzienną pracę w punkcie szczepień dzieci i dorosłych.
            Szybki dostęp do referencyjnych procedur, oficjalnego Programu Szczepień Ochronnych i nadzoru łańcucha chłodniczego.
          </p>

          {/* Quick status bar */}
          <div className="hero-indicators">
            <div className="indicator-chip chip-success">
              <CheckCircle size={15} />
              <span>Zgodność z procedurami sanitarnymi</span>
            </div>
            <div className="indicator-chip chip-info">
              <Activity size={15} />
              <span>Nadzór chłodniczy: +2°C .. +8°C</span>
            </div>
            <div className="indicator-chip chip-privacy">
              <Shield size={15} />
              <span>100% prywatności: brak danych pacjentów</span>
            </div>
          </div>
        </div>
      </section>

      {/* Embedded Search on Dashboard if user focuses here */}
      <div className="dashboard-search-wrapper">
        <div className="dashboard-search-box">
          <Search size={19} className="dashboard-search-icon" />
          <input
            type="text"
            className="dashboard-search-input"
            placeholder="Szukaj procedury, preparatu, wytycznych PSO lub kalkulatora..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
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
            Wyniki wyszukiwania dla „<strong>{searchQuery}</strong>”: ({filteredModules.length})
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
              Zintegrowany zestaw narzędzi do obsługi procesu szczepień ochronnych
            </p>
          </div>
          <span className="modules-count-badge">
            {filteredModules.length} {filteredModules.length === 1 ? 'moduł' : 'modułów'}
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
