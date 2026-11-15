import React, { useState, Suspense } from 'react';
import { Layout } from './components/layout/Layout';
import { DashboardView } from './components/dashboard/DashboardView';
import { ModuleLoadingFallback } from './components/common/ModuleLoadingFallback';
import { ModuleErrorBoundary } from './components/common/ModuleErrorBoundary';
import { APP_MODULES, QUICK_ACCESS_ITEMS } from './data/navigationData';
import type { ModuleId } from './types/navigation';
import type { GlobalSearchResult } from './utils/globalSearch';
import {
  loadRecentModuleVisits,
  recordModuleVisit,
  clearRecentModuleVisits,
  type RecentVisitRecord
} from './utils/recentModules';

const LazyOperationalModuleView = React.lazy(() =>
  import('./components/modules/OperationalModuleView').then(mod => ({
    default: mod.OperationalModuleView
  }))
);

const LazySettingsView = React.lazy(() =>
  import('./components/settings/SettingsView').then(mod => ({
    default: mod.SettingsView
  }))
);

const LazyKnowledgeBaseView = React.lazy(() =>
  import('./components/knowledge/KnowledgeBaseView').then(mod => ({
    default: mod.KnowledgeBaseView
  }))
);

const LazyVaccinesDatabaseView = React.lazy(() =>
  import('./components/vaccines/VaccinesDatabaseView').then(mod => ({
    default: mod.VaccinesDatabaseView
  }))
);

const LazyChildVaccinationsView = React.lazy(() =>
  import('./components/childVaccinations/ChildVaccinationsView').then(mod => ({
    default: mod.ChildVaccinationsView
  }))
);

const getBrowserStorage = (): Storage | null => {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
};

export const App: React.FC = () => {
  const [activeModuleId, setActiveModuleId] = useState<ModuleId>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedVaccineIdForDatabase, setSelectedVaccineIdForDatabase] = useState<string | null>(null);
  const [knowledgePrefillQuery, setKnowledgePrefillQuery] = useState<string | null>(null);
  const [knowledgePrefillSeq, setKnowledgePrefillSeq] = useState<number>(0);
  const [moduleRetryKey, setModuleRetryKey] = useState<number>(0);

  // Rzeczywista lokalna historia odwiedzonych modułów (pusta przy pierwszym uruchomieniu)
  const [recentVisits, setRecentVisits] = useState<RecentVisitRecord[]>(() => {
    const loaded = loadRecentModuleVisits(getBrowserStorage());
    return loaded.visits;
  });

  const handleSelectModule = (id: ModuleId, preservePrefill: boolean = false) => {
    setActiveModuleId(id);

    // Przy zwykłym opuszczeniu Bazy preparatów wyczyść wybrane ID preparatu (w stanie i localStorage)
    if (id !== 'vaccines-database') {
      setSelectedVaccineIdForDatabase(null);
      try {
        getBrowserStorage()?.removeItem('vaxnurse_active_vaccine_id_v1');
      } catch {}
    }

    if (!preservePrefill && id !== 'knowledge-base') {
      setKnowledgePrefillQuery(null);
    }

    // Zapisz rzeczywiste otwarcie modułu w localStorage
    if (id !== 'dashboard') {
      setRecentVisits(prev => {
        const res = recordModuleVisit(getBrowserStorage(), prev, id);
        return res.visits;
      });
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectSearchResult = (result: GlobalSearchResult) => {
    setSearchQuery('');
    if (result.targetModule === 'knowledge-base') {
      setKnowledgePrefillQuery(result.knowledgePrefillQuery || null);
      setKnowledgePrefillSeq(prev => prev + 1);
      handleSelectModule('knowledge-base', true);
      return;
    }
    setKnowledgePrefillQuery(null);
    handleSelectModule(result.targetModule);
  };

  const handleClearRecentVisits = () => {
    const empty = clearRecentModuleVisits(getBrowserStorage());
    setRecentVisits(empty);
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
      onSelectModule={id => handleSelectModule(id)}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onSelectSearchResult={handleSelectSearchResult}
    >
      {activeModuleId === 'dashboard' ? (
        <DashboardView
          modules={APP_MODULES}
          quickAccessItems={QUICK_ACCESS_ITEMS}
          recentVisits={recentVisits}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectModule={id => handleSelectModule(id)}
          onClearRecentVisits={handleClearRecentVisits}
        />
      ) : (
        <ModuleErrorBoundary
          resetKey={`${activeModuleId}-${moduleRetryKey}`}
          onRetry={() => setModuleRetryKey(prev => prev + 1)}
          onBackToDashboard={() => handleSelectModule('dashboard')}
        >
          <Suspense fallback={<ModuleLoadingFallback label={`Wczytywanie modułu: ${currentModule.label}…`} />}>
            {activeModuleId === 'child-vaccinations' ? (
              <LazyChildVaccinationsView
                module={currentModule}
                onBackToDashboard={() => handleSelectModule('dashboard')}
                onNavigateToModule={id => handleSelectModule(id)}
                onSelectVaccineProduct={handleSelectVaccineProduct}
              />
            ) : activeModuleId === 'settings' ? (
              <LazySettingsView
                module={currentModule}
                onBackToDashboard={() => handleSelectModule('dashboard')}
              />
            ) : activeModuleId === 'knowledge-base' ? (
              <LazyKnowledgeBaseView
                key={`kb-${knowledgePrefillSeq}`}
                module={currentModule}
                onBackToDashboard={() => handleSelectModule('dashboard')}
                initialSearchQuery={knowledgePrefillQuery}
              />
            ) : activeModuleId === 'vaccines-database' ? (
              <LazyVaccinesDatabaseView
                module={currentModule}
                onBackToDashboard={() => handleSelectModule('dashboard')}
                initialSelectedVaccineId={selectedVaccineIdForDatabase}
              />
            ) : (
              <LazyOperationalModuleView
                module={currentModule}
                onBackToDashboard={() => handleSelectModule('dashboard')}
                onNavigateToModule={id => handleSelectModule(id)}
                onSelectVaccineProduct={handleSelectVaccineProduct}
              />
            )}
          </Suspense>
        </ModuleErrorBoundary>
      )}
    </Layout>
  );
};

export default App;
