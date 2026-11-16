import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Monitor, Palette, SlidersHorizontal, X } from 'lucide-react';
import {
  THEME_BY_ID,
  THEME_DEFINITIONS,
  loadThemePreference,
  resolveTheme,
  setAndPersistThemePreference,
  subscribeToThemeChange,
  type UiThemeId,
  type UiThemePreference
} from '../../utils/theme';
import {
  applyPreferencesToDocument,
  loadPreferences,
  savePreferences,
  type UiDensity,
  type UiFontSize
} from '../../utils/preferences';

interface ThemeSwitcherPopoverProps {
  onOpenSettings: () => void;
}

export const ThemeSwitcherPopover: React.FC<ThemeSwitcherPopoverProps> = ({
  onOpenSettings
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [preference, setPreference] = useState<UiThemePreference>(() => loadThemePreference());
  const [resolvedTheme, setResolvedTheme] = useState<UiThemeId>(() =>
    resolveTheme(loadThemePreference())
  );
  const [density, setDensity] = useState<UiDensity>(() => loadPreferences().preferences.density);
  const [fontSize, setFontSize] = useState<UiFontSize>(() => loadPreferences().preferences.fontSize);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    return subscribeToThemeChange(detail => {
      setPreference(detail.preference);
      setResolvedTheme(detail.resolvedTheme);
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleMouseDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        event.target instanceof Node &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const activeDef = THEME_BY_ID[resolvedTheme];

  const handleSelectTheme = (nextPref: UiThemePreference) => {
    const applied = setAndPersistThemePreference(nextPref);
    setPreference(applied.preference);
    setResolvedTheme(applied.resolvedTheme);
  };

  const handleToggleDensity = () => {
    const nextDensity: UiDensity = density === 'comfortable' ? 'compact' : 'comfortable';
    const nextPrefs = applyPreferencesToDocument({ density: nextDensity, fontSize });
    savePreferences(typeof localStorage !== 'undefined' ? localStorage : null, nextPrefs);
    setDensity(nextPrefs.density);
  };

  const handleToggleFontSize = () => {
    const nextFontSize: UiFontSize = fontSize === 'normal' ? 'large' : 'normal';
    const nextPrefs = applyPreferencesToDocument({ density, fontSize: nextFontSize });
    savePreferences(typeof localStorage !== 'undefined' ? localStorage : null, nextPrefs);
    setFontSize(nextPrefs.fontSize);
  };

  const handleToggleOpen = () => {
    if (!isOpen) {
      const currentPrefs = loadPreferences().preferences;
      setDensity(currentPrefs.density);
      setFontSize(currentPrefs.fontSize);
    }
    setIsOpen(prev => !prev);
  };

  return (
    <div className="header-theme-wrapper" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        className="header-theme-btn"
        aria-expanded={isOpen}
        aria-controls={isOpen ? 'header-theme-popover' : undefined}
        aria-label={`Wygląd aplikacji — aktywny motyw: ${activeDef.name}`}
        title={`Zmień szatę graficzną (aktywna: ${activeDef.name})`}
        onClick={handleToggleOpen}
      >
        <span className="header-theme-swatch-ring" aria-hidden="true">
          <span
            className="header-theme-swatch-dot"
            style={{ backgroundColor: activeDef.swatches.accent }}
          />
        </span>
        <Palette size={15} aria-hidden="true" />
        <span className="header-theme-btn-label">Wygląd</span>
        <ChevronDown size={14} className="header-theme-chevron" aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          id="header-theme-popover"
          className="header-theme-popover"
          role="dialog"
          aria-label="Wybór szaty graficznej i trybu widoku"
        >
          <div className="theme-popover-header">
            <div className="theme-popover-title-wrap">
              <span className="theme-popover-icon-badge" aria-hidden="true">
                <Palette size={15} />
              </span>
              <div>
                <h2 className="theme-popover-title">Szata graficzna VaxNurse</h2>
                <p className="theme-popover-subtitle">
                  Aktywna: {preference === 'auto' ? `Auto (${activeDef.name})` : activeDef.name}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="theme-popover-close"
              aria-label="Zamknij panel wyglądu"
              onClick={() => {
                setIsOpen(false);
                triggerRef.current?.focus();
              }}
            >
              <X size={15} aria-hidden="true" />
            </button>
          </div>

          <div className="theme-popover-grid" role="group" aria-label="Dostępne motywy kolorystyczne">
            {THEME_DEFINITIONS.map(theme => {
              const isSelected = preference === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  className={`theme-mini-card ${isSelected ? 'active' : ''}`}
                  aria-pressed={isSelected}
                  onClick={() => handleSelectTheme(theme.id)}
                >
                  <div
                    className="theme-mini-preview"
                    style={{ backgroundColor: theme.swatches.bg }}
                    aria-hidden="true"
                  >
                    <div
                      className="theme-mini-preview-sidebar"
                      style={{ backgroundColor: theme.swatches.sidebar }}
                    >
                      <span
                        className="theme-mini-preview-rail-dot"
                        style={{ backgroundColor: theme.swatches.accent }}
                      />
                      <span
                        className="theme-mini-preview-rail-dot"
                        style={{ backgroundColor: theme.swatches.text, opacity: 0.25 }}
                      />
                    </div>
                    <div className="theme-mini-preview-canvas">
                      <div
                        className="theme-mini-preview-card"
                        style={{ backgroundColor: theme.swatches.surface }}
                      >
                        <span
                          className="theme-mini-preview-bar"
                          style={{ backgroundColor: theme.swatches.text, opacity: 0.72 }}
                        />
                        <div className="theme-mini-preview-dots">
                          <span
                            className="theme-mini-preview-dot"
                            style={{ backgroundColor: theme.swatches.accent }}
                          />
                          <span
                            className="theme-mini-preview-dot"
                            style={{ backgroundColor: theme.swatches.norm }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="theme-mini-meta">
                    <div>
                      <span className="theme-mini-name">{theme.name}</span>
                      <span className="theme-mini-badge">{theme.badge}</span>
                    </div>
                    {isSelected && <Check size={15} className="theme-mini-check" aria-hidden="true" />}
                  </div>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className={`theme-auto-row-btn ${preference === 'auto' ? 'active' : ''}`}
            aria-pressed={preference === 'auto'}
            onClick={() => handleSelectTheme('auto')}
          >
            <span className="theme-auto-row-left">
              <Monitor size={16} className="theme-auto-icon" aria-hidden="true" />
              <span>
                <span className="theme-auto-title">Auto (Dzień / Noc)</span>
                <span className="theme-auto-desc">Surgical Daylight lub Aether Obsidian wg systemu</span>
              </span>
            </span>
            <span className="theme-auto-pill">
              {preference === 'auto' ? 'Aktywny' : 'Włącz'}
            </span>
          </button>

          <div className="theme-popover-ergo">
            <button
              type="button"
              className="theme-ergo-toggle"
              aria-pressed={density === 'compact'}
              onClick={handleToggleDensity}
            >
              <span className="theme-ergo-kicker">Gęstość</span>
              <span className="theme-ergo-val">
                {density === 'compact' ? 'Zwięzła' : 'Komfortowa'}
              </span>
            </button>
            <button
              type="button"
              className="theme-ergo-toggle"
              aria-pressed={fontSize === 'large'}
              onClick={handleToggleFontSize}
            >
              <span className="theme-ergo-kicker">Rozmiar tekstu</span>
              <span className="theme-ergo-val">
                {fontSize === 'large' ? 'Powiększony' : 'Standardowy'}
              </span>
            </button>
          </div>

          <button
            type="button"
            className="theme-popover-footer-link"
            onClick={() => {
              setIsOpen(false);
              onOpenSettings();
            }}
          >
            <SlidersHorizontal size={14} aria-hidden="true" />
            <span>Pełne studio motywów i kopie zapasowe</span>
          </button>
        </div>
      )}
    </div>
  );
};
