import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Menu,
  Search,
  X,
  Calendar,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import type { ModuleDefinition, ModuleId } from '../../types/navigation';
import {
  searchVaxNurseNavigation,
  type GlobalSearchResult
} from '../../utils/globalSearch';

interface HeaderProps {
  currentModule: ModuleDefinition;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenMobileMenu: () => void;
  isOpenMobileMenu: boolean;
  onNavigateToModule: (id: ModuleId) => void;
  onSelectSearchResult: (result: GlobalSearchResult) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentModule,
  searchQuery,
  onSearchChange,
  onOpenMobileMenu,
  isOpenMobileMenu,
  onNavigateToModule,
  onSelectSearchResult
}) => {
  const [todayFormatted] = useState(() =>
    new Intl.DateTimeFormat('pl-PL', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date())
  );
  const [isDesktopSearchOpen, setIsDesktopSearchOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const searchResults = useMemo(
    () => searchVaxNurseNavigation(searchQuery),
    [searchQuery]
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        desktopSearchRef.current &&
        event.target instanceof Node &&
        !desktopSearchRef.current.contains(event.target)
      ) {
        setIsDesktopSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isMobileSearchOpen) {
      mobileInputRef.current?.focus();
    }
  }, [isMobileSearchOpen]);

  const handlePickResult = (result: GlobalSearchResult) => {
    setIsDesktopSearchOpen(false);
    setIsMobileSearchOpen(false);
    onSelectSearchResult(result);
  };

  const renderSearchResultsPanel = (panelId: string, isMobile: boolean) => {
    const hasQuery = searchQuery.trim().length > 0;
    if (!hasQuery && !isMobile) {
      return null;
    }

    return (
      <div
        id={panelId}
        className={`global-search-dropdown ${isMobile ? 'mobile' : 'desktop'}`}
        role="region"
        aria-label="Wyniki wyszukiwania modułów i sekcji VaxNurse"
      >
        <div className="global-search-scope-note">
          Zakres wyszukiwania: moduły aplikacji, skróty i Biblioteka Wiedzy (nie zawiera danych pacjentów)
        </div>

        {!hasQuery ? (
          <p className="global-search-hint">
            Wpisz nazwę modułu, skrótu lub dokumentu z Bazy wiedzy, np. „szczepienia dzieci”, „ChPL”, „PSO” lub „kopia”.
          </p>
        ) : searchResults.length === 0 ? (
          <div className="global-search-empty">
            <p className="global-search-empty-title">
              Brak pasujących modułów lub sekcji dla „{searchQuery.trim()}”
            </p>
            <button
              type="button"
              className="global-search-clear-cta"
              onClick={() => onSearchChange('')}
            >
              Wyczyść zapytanie
            </button>
          </div>
        ) : (
          <ul className="global-search-results-list" aria-label="Lista wyników">
            {searchResults.map(result => (
              <li key={result.id}>
                <button
                  type="button"
                  className="global-search-result-btn"
                  onClick={() => handlePickResult(result)}
                >
                  <span className="global-result-main">
                    <span className="global-result-title-row">
                      <span className="global-result-title">{result.title}</span>
                      <span
                        className={`global-result-badge ${result.isPlaceholder ? 'is-placeholder' : ''}`}
                      >
                        {result.categoryLabel}
                      </span>
                    </span>
                    <span className="global-result-subtitle">{result.subtitle}</span>
                  </span>
                  <ArrowRight size={15} className="global-result-arrow" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <header className="app-header">
      <div className="header-top-row">
        <div className="header-left">
          <button
            type="button"
            className="mobile-menu-trigger"
            onClick={onOpenMobileMenu}
            aria-label="Otwórz menu nawigacji"
            aria-expanded={isOpenMobileMenu}
            aria-controls="app-sidebar-nav"
          >
            <Menu size={22} />
          </button>

          <div className="header-breadcrumb">
            <button
              type="button"
              className="breadcrumb-root"
              onClick={() => onNavigateToModule('dashboard')}
            >
              VaxNurse
            </button>
            <span className="breadcrumb-separator" aria-hidden="true">/</span>
            <span className="breadcrumb-current">{currentModule.label}</span>
          </div>
        </div>

        <div className="header-center" ref={desktopSearchRef}>
          <div className="header-search-bar">
            <Search className="search-icon" size={17} aria-hidden="true" />
            <input
              type="text"
              className="search-input"
              placeholder="Szukaj modułów i sekcji VaxNurse"
              value={searchQuery}
              onFocus={() => setIsDesktopSearchOpen(true)}
              onChange={e => {
                onSearchChange(e.target.value);
                setIsDesktopSearchOpen(true);
              }}
              onKeyDown={e => {
                if (e.key === 'Escape') {
                  if (isDesktopSearchOpen) {
                    setIsDesktopSearchOpen(false);
                  } else if (searchQuery) {
                    onSearchChange('');
                  }
                }
              }}
              aria-label="Szukaj modułów i sekcji VaxNurse"
              aria-controls={
                isDesktopSearchOpen && searchQuery.trim().length > 0
                  ? 'desktop-global-search-results'
                  : undefined
              }
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

          {isDesktopSearchOpen &&
            searchQuery.trim().length > 0 &&
            renderSearchResultsPanel('desktop-global-search-results', false)}
        </div>

        <div className="header-right">
          <button
            type="button"
            className="mobile-search-trigger"
            onClick={() => setIsMobileSearchOpen(prev => !prev)}
            aria-expanded={isMobileSearchOpen}
            aria-controls={isMobileSearchOpen ? 'mobile-global-search-panel' : undefined}
            aria-label={
              isMobileSearchOpen
                ? 'Zamknij wyszukiwarkę modułów'
                : 'Otwórz wyszukiwarkę modułów'
            }
            title="Szukaj modułów i sekcji VaxNurse"
          >
            {isMobileSearchOpen ? <X size={19} /> : <Search size={19} />}
          </button>

          <div
            className="header-status-badge"
            title="Narzędzie referencyjne działające lokalnie w przeglądarce"
          >
            <span className="status-indicator-dot" aria-hidden="true"></span>
            <span className="status-text">Tryb lokalny</span>
          </div>

          <div className="header-date">
            <Calendar size={15} className="header-date-icon" aria-hidden="true" />
            <span className="date-text">{todayFormatted}</span>
          </div>

          <button
            type="button"
            className="header-quick-btn"
            title="Otwórz moduł: Sytuacje szczególne i zestaw przeciwwstrząsowy"
            onClick={() => onNavigateToModule('special-situations')}
          >
            <ShieldAlert size={16} className="quick-btn-icon" aria-hidden="true" />
            <span className="quick-btn-text">Sytuacje szczególne</span>
          </button>
        </div>
      </div>

      {isMobileSearchOpen && (
        <div
          id="mobile-global-search-panel"
          className="mobile-search-overlay"
          role="region"
          aria-label="Mobilna wyszukiwarka modułów i sekcji VaxNurse"
        >
          <div className="header-search-bar mobile-search-bar">
            <Search className="search-icon" size={17} aria-hidden="true" />
            <input
              ref={mobileInputRef}
              type="text"
              className="search-input"
              placeholder="Szukaj modułów i sekcji VaxNurse"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Escape') {
                  setIsMobileSearchOpen(false);
                }
              }}
              aria-label="Szukaj modułów i sekcji VaxNurse"
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => onSearchChange('')}
                aria-label="Wyczyść frazę wyszukiwania"
              >
                <X size={15} />
              </button>
            )}
            <button
              type="button"
              className="mobile-search-close-btn"
              onClick={() => setIsMobileSearchOpen(false)}
              aria-label="Zamknij panel wyszukiwania"
            >
              Zamknij
            </button>
          </div>
          {renderSearchResultsPanel('mobile-global-search-results', true)}
        </div>
      )}
    </header>
  );
};
