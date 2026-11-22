import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import type { ModuleDefinition, ModuleId } from '../../types/navigation';
import type { GlobalSearchResult } from '../../utils/globalSearch';
import { PCW_PROJECT } from '../../data/sisterProjects';

interface LayoutProps {
  modules: ModuleDefinition[];
  activeModuleId: ModuleId;
  onSelectModule: (id: ModuleId) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectSearchResult: (result: GlobalSearchResult) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  modules,
  activeModuleId,
  onSelectModule,
  searchQuery,
  onSearchChange,
  onSelectSearchResult,
  children
}) => {
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const currentModule =
    modules.find(m => m.id === activeModuleId) || modules[0];

  return (
    <div className={`app-container ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      <a href="#main-content" className="skip-to-main-link">
        Przejdź do treści głównej
      </a>
      <Sidebar
        modules={modules}
        activeModule={activeModuleId}
        onSelectModule={onSelectModule}
        isOpenMobile={isOpenMobile}
        onCloseMobile={() => setIsOpenMobile(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(prev => !prev)}
      />

      <div className="app-main-wrapper">
        <Header
          currentModule={currentModule}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onOpenMobileMenu={() => setIsOpenMobile(true)}
          isOpenMobileMenu={isOpenMobile}
          onNavigateToModule={onSelectModule}
          onSelectSearchResult={onSelectSearchResult}
        />

        <main className="app-content-area" id="main-content" tabIndex={-1}>
          {children}
        </main>

        <footer className="app-footer">
          <div className="app-footer-inner">
            <p className="app-footer-note">
              VaxNurse — bezpłatne, wolne od reklam narzędzie pomocnicze dla pracy punktu szczepień.
            </p>
            <div className="app-footer-actions">
              <button
                type="button"
                className={`app-footer-link-btn ${activeModuleId === 'about-project' ? 'active' : ''}`}
                onClick={() => onSelectModule('about-project')}
                aria-current={activeModuleId === 'about-project' ? 'page' : undefined}
              >
                O projekcie i autorach
              </button>
              <button
                type="button"
                className={`app-footer-link-btn ${activeModuleId === 'settings' ? 'active' : ''}`}
                onClick={() => onSelectModule('settings')}
                aria-current={activeModuleId === 'settings' ? 'page' : undefined}
              >
                Ustawienia i prywatność
              </button>
              <a
                href={PCW_PROJECT.url}
                target="_blank"
                rel="noopener noreferrer"
                className="app-footer-link-btn"
              >
                Pielęgniarskie Centrum Wiedzy (PCW)
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
