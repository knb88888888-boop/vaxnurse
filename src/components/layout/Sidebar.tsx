import React, { useEffect, useRef } from 'react';
import {
  Syringe,
  X,
  ChevronRight,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  Stethoscope,
  ExternalLink
} from 'lucide-react';
import type { ModuleDefinition, ModuleId } from '../../types/navigation';
import { isModulePlaceholder } from '../../utils/globalSearch';
import { PCW_PROJECT } from '../../data/sisterProjects';

interface SidebarProps {
  modules: ModuleDefinition[];
  activeModule: ModuleId;
  onSelectModule: (id: ModuleId) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  modules,
  activeModule,
  onSelectModule,
  isOpenMobile,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse
}) => {
  const asideRef = useRef<HTMLElement>(null);
  const mobileCloseBtnRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const skipFocusRestoreRef = useRef(false);
  const wasOpenMobileRef = useRef(false);

  const mainModules = modules.filter(m => m.category === 'main');
  const clinicalModules = modules.filter(m => m.category === 'clinical');
  const logisticsModules = modules.filter(m => m.category === 'logistics');
  const systemModules = modules.filter(m => m.category === 'system');

  useEffect(() => {
    if (isOpenMobile) {
      if (!wasOpenMobileRef.current) {
        previousFocusRef.current =
          document.activeElement instanceof HTMLElement ? document.activeElement : null;
        mobileCloseBtnRef.current?.focus();
      }
      wasOpenMobileRef.current = true;

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          onCloseMobile();
          return;
        }
        if (event.key === 'Tab' && asideRef.current) {
          const focusables = Array.from(
            asideRef.current.querySelectorAll<HTMLElement>(
              'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )
          ).filter(el => {
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && style.visibility !== 'hidden';
          });
          if (focusables.length === 0) return;
          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }

    if (wasOpenMobileRef.current) {
      wasOpenMobileRef.current = false;
      if (!skipFocusRestoreRef.current && previousFocusRef.current?.isConnected) {
        previousFocusRef.current.focus();
      }
      skipFocusRestoreRef.current = false;
      previousFocusRef.current = null;
    }
    return undefined;
  }, [isOpenMobile, onCloseMobile]);

  const handleItemClick = (id: ModuleId) => {
    if (isOpenMobile) {
      skipFocusRestoreRef.current = true;
      onCloseMobile();
    }
    onSelectModule(id);
  };

  const renderNavGroup = (title: string, items: ModuleDefinition[]) => (
    <div className="nav-group">
      {!isCollapsed && <div className="nav-group-title">{title}</div>}
      <ul className="nav-list">
        {items.map(item => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          const placeholder = isModulePlaceholder(item.id);

          return (
            <li key={item.id}>
              <button
                type="button"
                className={`nav-item ${isActive ? 'active' : ''} ${placeholder ? 'is-placeholder' : ''}`}
                onClick={() => handleItemClick(item.id)}
                title={
                  isCollapsed
                    ? `${item.label}${placeholder ? ' (W przygotowaniu)' : ''}`
                    : undefined
                }
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="nav-item-icon-wrapper">
                  <Icon className="nav-icon" size={19} />
                </span>
                {!isCollapsed && (
                  <>
                    <span className="nav-item-label">{item.label}</span>
                    {placeholder ? (
                      <span className="nav-item-badge nav-item-badge--placeholder">
                        W przygotowaniu
                      </span>
                    ) : (
                      item.badge && <span className="nav-item-badge">{item.badge}</span>
                    )}
                    {isActive && <ChevronRight className="nav-active-arrow" size={15} />}
                  </>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          className="sidebar-backdrop" 
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        ref={asideRef}
        id="app-sidebar-nav"
        className={`app-sidebar ${isOpenMobile ? 'open-mobile' : ''} ${isCollapsed ? 'collapsed' : ''}`}
        role={isOpenMobile ? 'dialog' : undefined}
        aria-modal={isOpenMobile ? true : undefined}
        aria-label={isOpenMobile ? 'Menu nawigacji VaxNurse' : undefined}
      >
        {/* Brand Header */}
        <div className="sidebar-brand">
          <button
            type="button"
            className="brand-logo"
            onClick={() => handleItemClick('dashboard')}
            aria-label={isCollapsed ? 'VaxNurse — Powrót do Pulpitu' : undefined}
            title="Powrót do Pulpitu VaxNurse"
          >
            <span className="brand-icon-box" aria-hidden="true">
              <Syringe className="brand-logo-icon" size={22} />
            </span>
            {!isCollapsed && (
              <span className="brand-text">
                <span className="brand-name">VaxNurse</span>
                <span className="brand-subtitle">Asystent Punktu Szczepień</span>
              </span>
            )}
          </button>

          {/* Desktop Collapse Toggle */}
          <button
            type="button"
            className="collapse-toggle-btn"
            onClick={onToggleCollapse}
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? 'Rozwiń pasek boczny' : 'Zwiń pasek boczny'}
            title={isCollapsed ? 'Rozwiń pasek boczny' : 'Zwiń pasek boczny'}
          >
            {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>

          {/* Mobile Close Button */}
          <button
            ref={mobileCloseBtnRef}
            type="button"
            className="mobile-close-btn"
            onClick={onCloseMobile}
            aria-label="Zamknij menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Groups */}
        <nav className="sidebar-nav" aria-label="Główne menu aplikacji">
          {renderNavGroup('Nawigacja', mainModules)}
          <div className="nav-group">
            {!isCollapsed && <div className="nav-group-title">Projekt siostrzany</div>}
            <ul className="nav-list">
              <li>
                <a
                  href={PCW_PROJECT.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nav-item sidebar-external-link"
                  title={`${PCW_PROJECT.name} — ${PCW_PROJECT.subtitle}`}
                  aria-label="Pielęgniarskie Centrum Wiedzy (PCW) — otwórz w nowej karcie"
                  onClick={() => {
                    if (isOpenMobile) {
                      skipFocusRestoreRef.current = true;
                      onCloseMobile();
                    }
                  }}
                >
                  <span className="nav-item-icon-wrapper">
                    <Stethoscope className="nav-icon" size={19} aria-hidden="true" />
                  </span>
                  {!isCollapsed && (
                    <>
                      <span className="nav-item-label">Pielęgniarki · PCW</span>
                      <ExternalLink className="sidebar-external-icon" size={14} aria-hidden="true" />
                    </>
                  )}
                </a>
              </li>
            </ul>
          </div>
          {renderNavGroup('Moduły kliniczne', clinicalModules)}
          {renderNavGroup('Organizacja i bezpieczeństwo', logisticsModules)}
          {renderNavGroup('System', systemModules)}
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <div className="privacy-badge">
            <ShieldCheck className="privacy-badge-icon" size={17} />
            {!isCollapsed && (
              <div className="privacy-badge-text">
                <strong>Tryb lokalny</strong>
                <span>Narzędzie referencyjne</span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
