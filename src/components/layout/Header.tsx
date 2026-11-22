import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Menu,
  Search,
  X,
  Calendar,
  ShieldAlert,
  ArrowRight,
  Stethoscope,
  ExternalLink
} from 'lucide-react';
import type { ModuleDefinition, ModuleId } from '../../types/navigation';
import {
  searchVaxNurseNavigation,
  type GlobalSearchResult
} from '../../utils/globalSearch';
import { ThemeSwitcherPopover } from './ThemeSwitcherPopover';
import { PCW_PROJECT } from '../../data/sisterProjects';

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
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchTriggerRef = useRef<HTMLButtonElement>(null);
  const desktopListRef = useRef<HTMLUListElement>(null);
  const mobileListRef = useRef<HTMLUListElement>(null);
  const wasMobileSearchOpenRef = useRef(false);
  const skipMobileFocusRestoreRef = useRef(false);

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
    const handleGlobalSearchShortcut = (event: KeyboardEvent) => {
      const isCtrlOrMetaK =
        (event.ctrlKey || event.metaKey) &&
        !event.altKey &&
        event.key.toLowerCase() === 'k';

      const target = event.target as HTMLElement | null;
      const isEditableTarget = Boolean(
        target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'SELECT' ||
            target.isContentEditable)
      );
      const isSlashShortcut =
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        event.key === '/' &&
        !isEditableTarget;

      if (!isCtrlOrMetaK && !isSlashShortcut) return;

      event.preventDefault();
      const desktopEl = desktopInputRef.current;
      const desktopContainer = desktopSearchRef.current;
      const isDesktopVisible = Boolean(
        desktopEl &&
          desktopContainer &&
          window.getComputedStyle(desktopContainer).display !== 'none'
      );
      if (isDesktopVisible && desktopEl) {
        desktopEl.focus();
        desktopEl.select();
        setIsDesktopSearchOpen(true);
      } else {
        setIsMobileSearchOpen(true);
      }
    };

    document.addEventListener('keydown', handleGlobalSearchShortcut);
    return () => document.removeEventListener('keydown', handleGlobalSearchShortcut);
  }, []);

  useEffect(() => {
    if (isMobileSearchOpen) {
      mobileInputRef.current?.focus();
    } else if (wasMobileSearchOpenRef.current) {
      if (!skipMobileFocusRestoreRef.current) {
        mobileSearchTriggerRef.current?.focus();
      }
      skipMobileFocusRestoreRef.current = false;
    }
    wasMobileSearchOpenRef.current = isMobileSearchOpen;
  }, [isMobileSearchOpen]);

  const handlePickResult = (result: GlobalSearchResult) => {
    skipMobileFocusRestoreRef.current = true;
    setIsDesktopSearchOpen(false);
    setIsMobileSearchOpen(false);
    onSelectSearchResult(result);
  };

  const focusResultButtonAt = (isMobile: boolean, index: number) => {
    const listEl = isMobile ? mobileListRef.current : desktopListRef.current;
    const buttons = listEl?.querySelectorAll<HTMLButtonElement>('.global-search-result-btn');
    if (!buttons || buttons.length === 0) return false;
    const safeIndex = Math.max(0, Math.min(index, buttons.length - 1));
    buttons[safeIndex]?.focus();
    return true;
  };

  const handleResultButtonKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
    total: number,
    isMobile: boolean
  ) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusResultButtonAt(isMobile, index + 1 < total ? index + 1 : 0);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (index === 0) {
        (isMobile ? mobileInputRef.current : desktopInputRef.current)?.focus();
      } else {
        focusResultButtonAt(isMobile, index - 1);
      }
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusResultButtonAt(isMobile, 0);
    } else if (event.key === 'End') {
      event.preventDefault();
      focusResultButtonAt(isMobile, total - 1);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      if (isMobile) {
        setIsMobileSearchOpen(false);
      } else {
        setIsDesktopSearchOpen(false);
        desktopInputRef.current?.focus();
      }
    }
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
        <div className="global-search-scope-note" aria-hidden="true">
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
          <ul
            ref={isMobile ? mobileListRef : desktopListRef}
            className="global-search-results-list"
            aria-label="Lista wyników"
          >
            {searchResults.map((result, idx) => (
              <li key={result.id}>
                <button
                  type="button"
                  className="global-search-result-btn"
                  onClick={() => handlePickResult(result)}
                  onKeyDown={e =>
                    handleResultButtonKeyDown(e, idx, searchResults.length, isMobile)
                  }
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
              ref={desktopInputRef}
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
                if (e.key === 'ArrowDown' && searchQuery.trim().length > 0) {
                  e.preventDefault();
                  setIsDesktopSearchOpen(true);
                  requestAnimationFrame(() => focusResultButtonAt(false, 0));
                } else if (e.key === 'Escape') {
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
            {searchQuery ? (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => onSearchChange('')}
                aria-label="Wyczyść wyszukiwanie"
              >
                <X size={15} />
              </button>
            ) : (
              <kbd className="search-kbd-hint" aria-hidden="true">
                Ctrl+K
              </kbd>
            )}
          </div>

          {isDesktopSearchOpen &&
            searchQuery.trim().length > 0 &&
            renderSearchResultsPanel('desktop-global-search-results', false)}
        </div>

        <div className="header-right">
          <button
            ref={mobileSearchTriggerRef}
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

          <ThemeSwitcherPopover
            onOpenSettings={() => onNavigateToModule('settings')}
          />

          <button
            type="button"
            className="header-quick-btn"
            title="Otwórz moduł: Sytuacje szczególne i zestaw przeciwwstrząsowy"
            onClick={() => onNavigateToModule('special-situations')}
          >
            <ShieldAlert size={16} className="quick-btn-icon" aria-hidden="true" />
            <span className="quick-btn-text">Sytuacje szczególne</span>
          </button>

          <a
            href={PCW_PROJECT.url}
            target="_blank"
            rel="noopener noreferrer"
            className="header-sister-link"
            title={`${PCW_PROJECT.name} — ${PCW_PROJECT.subtitle}`}
            aria-label="Pielęgniarki · PCW — Pielęgniarskie Centrum Wiedzy (nowa karta)"
          >
            <Stethoscope size={15} aria-hidden="true" />
            <span className="header-sister-link-text">Pielęgniarki · PCW</span>
            <ExternalLink size={13} aria-hidden="true" />
          </a>
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
                if (e.key === 'ArrowDown' && searchQuery.trim().length > 0) {
                  e.preventDefault();
                  focusResultButtonAt(true, 0);
                } else if (e.key === 'Escape') {
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
