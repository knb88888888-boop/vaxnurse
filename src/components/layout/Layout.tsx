import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import type { ModuleDefinition, ModuleId } from '../../types/navigation';
import type { GlobalSearchResult } from '../../utils/globalSearch';

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

        <main className="app-content-area" id="main-content">
          {children}
        </main>
      </div>
    </div>
  );
};
