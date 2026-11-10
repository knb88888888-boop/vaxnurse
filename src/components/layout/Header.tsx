import React, { useState } from 'react';
import {
  Menu,
  Search,
  X,
  Calendar,
  ShieldAlert
} from 'lucide-react';
import type { ModuleDefinition, ModuleId } from '../../types/navigation';

interface HeaderProps {
  currentModule: ModuleDefinition;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenMobileMenu: () => void;
  onNavigateToModule: (id: ModuleId) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentModule,
  searchQuery,
  onSearchChange,
  onOpenMobileMenu,
  onNavigateToModule
}) => {
  const [todayFormatted] = useState(() =>
    new Intl.DateTimeFormat('pl-PL', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date())
  );

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          type="button"
          className="mobile-menu-trigger"
          onClick={onOpenMobileMenu}
          aria-label="Otwórz menu nawigacji"
        >
          <Menu size={22} />
        </button>

        <div className="header-breadcrumb">
          <span className="breadcrumb-root" onClick={() => onNavigateToModule('dashboard')}>
            VaxNurse
          </span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{currentModule.label}</span>
        </div>
      </div>

      <div className="header-center">
        <div className="header-search-bar">
          <Search className="search-icon" size={17} />
          <input
            type="text"
            className="search-input"
            placeholder="Szukaj w modułach, procedurach lub PSO..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            aria-label="Szukaj w aplikacji VaxNurse"
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => onSearchChange('')}
              aria-label="Wyczyść wyszukiwanie"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      <div className="header-right">
        <div className="header-status-badge" title="Aplikacja działa w trybie bezpiecznym, lokalnym">
          <span className="status-indicator-dot"></span>
          <span className="status-text">Punkt aktywny</span>
        </div>

        <div className="header-date">
          <Calendar size={15} className="header-date-icon" />
          <span className="date-text">{todayFormatted}</span>
        </div>

        <button
          type="button"
          className="header-quick-btn"
          title="Procedury bezpieczeństwa i zgłaszanie sytuacji szczególnych"
          onClick={() => onNavigateToModule('special-situations')}
          aria-label="Sytuacje szczególne"
        >
          <ShieldAlert size={18} className="quick-btn-icon" />
          <span className="quick-btn-text">Awaryjne</span>
        </button>
      </div>
    </header>
  );
};
