import React, { useState } from 'react';
import { Layout } from './components/layout/Layout';
import { DashboardView } from './components/dashboard/DashboardView';
import { ModulePlaceholder } from './components/modules/ModulePlaceholder';
import { SettingsView } from './components/settings/SettingsView';
import { KnowledgeBaseView } from './components/knowledge/KnowledgeBaseView';
import { VaccinesDatabaseView } from './components/vaccines/VaccinesDatabaseView';
import { ChildVaccinationsView } from './components/childVaccinations/ChildVaccinationsView';
import { APP_MODULES, QUICK_ACCESS_ITEMS } from './data/navigationData';
import type { ModuleId } from './types/navigation';
import type { RecentVisit } from './components/dashboard/RecentModules';

export const App: React.FC = () => {
  const [activeModuleId, setActiveModuleId] = useState<ModuleId>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedVaccineIdForDatabase, setSelectedVaccineIdForDatabase] = useState<string | null>(null);

  // Initial recent visits for demonstration of the recent modules section
  const [recentVisits, setRecentVisits] = useState<RecentVisit[]>([
    { moduleId: 'cold-chain', timestamp: 'Dzisiaj, 07:45' },
    { moduleId: 'vaccination-calendar', timestamp: 'Dzisiaj, 08:15' },
    { moduleId: 'procedures-checklists', timestamp: 'Wczoraj' },
    { moduleId: 'vaccines-database', timestamp: 'Wczoraj' }
  ]);

  const handleSelectModule = (id: ModuleId) => {
    setActiveModuleId(id);

    // If navigating away from vaccines-database without direct selection, clear selected ID
    if (id !== 'vaccines-database') {
      setSelectedVaccineIdForDatabase(null);
    }

    // If navigating to an operational module, update the recent visits list
    if (id !== 'dashboard') {
      const nowFormatted = new Intl.DateTimeFormat('pl-PL', {
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date());

      setRecentVisits(prev => {
        const filtered = prev.filter(item => item.moduleId !== id);
        return [{ moduleId: id, timestamp: `Dzisiaj, ${nowFormatted}` }, ...filtered].slice(0, 6);
      });
    }

    // Scroll to top of content smoothly on module change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectVaccineProduct = (vaccineId: string) => {
    try {
      localStorage.setItem('vaxnurse_active_vaccine_id_v1', vaccineId);
    } catch {}
    setSelectedVaccineIdForDatabase(vaccineId);
    handleSelectModule('vaccines-database');
  };

  const currentModule =
    APP_MODULES.find(m => m.id === activeModuleId) || APP_MODULES[0];

  return (
    <Layout
      modules={APP_MODULES}
      activeModuleId={activeModuleId}
      onSelectModule={handleSelectModule}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
    >
      {activeModuleId === 'dashboard' ? (
        <DashboardView
          modules={APP_MODULES}
          quickAccessItems={QUICK_ACCESS_ITEMS}
          recentVisits={recentVisits}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectModule={handleSelectModule}
        />
      ) : activeModuleId === 'child-vaccinations' ? (
        <ChildVaccinationsView
          module={currentModule}
          onBackToDashboard={() => handleSelectModule('dashboard')}
          onNavigateToModule={handleSelectModule}
          onSelectVaccineProduct={handleSelectVaccineProduct}
        />
      ) : activeModuleId === 'settings' ? (
        <SettingsView
          module={currentModule}
          onBackToDashboard={() => handleSelectModule('dashboard')}
        />
      ) : activeModuleId === 'knowledge-base' ? (
        <KnowledgeBaseView
          module={currentModule}
          onBackToDashboard={() => handleSelectModule('dashboard')}
        />
      ) : activeModuleId === 'vaccines-database' ? (
        <VaccinesDatabaseView
          module={currentModule}
          onBackToDashboard={() => handleSelectModule('dashboard')}
          initialSelectedVaccineId={selectedVaccineIdForDatabase}
        />
      ) : (
        <ModulePlaceholder
          module={currentModule}
          onBackToDashboard={() => handleSelectModule('dashboard')}
          onNavigateToModule={handleSelectModule}
        />
      )}
    </Layout>
  );
};

export default App;
