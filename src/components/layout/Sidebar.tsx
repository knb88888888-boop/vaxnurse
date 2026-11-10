import React from 'react';
import {
  Syringe,
  X,
  ChevronRight,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import type { ModuleDefinition, ModuleId } from '../../types/navigation';

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
  const mainModules = modules.filter(m => m.category === 'main');
  const clinicalModules = modules.filter(m => m.category === 'clinical');
  const logisticsModules = modules.filter(m => m.category === 'logistics');
  const systemModules = modules.filter(m => m.category === 'system');

  const handleItemClick = (id: ModuleId) => {
    onSelectModule(id);
    if (isOpenMobile) {
      onCloseMobile();
    }
  };

  const renderNavGroup = (title: string, items: ModuleDefinition[]) => (
    <div className="nav-group">
      {!isCollapsed && <div className="nav-group-title">{title}</div>}
      <ul className="nav-list">
        {items.map(item => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;

          return (
            <li key={item.id}>
              <button
                type="button"
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleItemClick(item.id)}
                title={isCollapsed ? item.label : undefined}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="nav-item-icon-wrapper">
                  <Icon className="nav-icon" size={19} />
                </span>
                {!isCollapsed && (
                  <>
                    <span className="nav-item-label">{item.label}</span>
                    {item.badge && <span className="nav-item-badge">{item.badge}</span>}
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

      <aside className={`app-sidebar ${isOpenMobile ? 'open-mobile' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-brand">
          <div className="brand-logo" onClick={() => handleItemClick('dashboard')}>
            <div className="brand-icon-box">
              <Syringe className="brand-logo-icon" size={22} />
            </div>
            {!isCollapsed && (
              <div className="brand-text">
                <span className="brand-name">VaxNurse</span>
                <span className="brand-subtitle">Asystent Punktu Szczepień</span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            type="button"
            className="collapse-toggle-btn"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Rozwiń pasek boczny' : 'Zwiń pasek boczny'}
            title={isCollapsed ? 'Rozwiń pasek boczny' : 'Zwiń pasek boczny'}
          >
            {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>

          {/* Mobile Close Button */}
          <button
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
                <span>Wersja demonstracyjna</span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
