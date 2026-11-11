import React from 'react';
import { History, ArrowRight, Clock, Trash2 } from 'lucide-react';
import type { ModuleDefinition, ModuleId } from '../../types/navigation';
import {
  formatRecentVisitTimestamp,
  type RecentVisitRecord
} from '../../utils/recentModules';
import { isModulePlaceholder } from '../../utils/globalSearch';

interface RecentModulesProps {
  recentVisits: RecentVisitRecord[];
  allModules: ModuleDefinition[];
  onSelectModule: (id: ModuleId) => void;
  onClearHistory?: () => void;
}

export const RecentModules: React.FC<RecentModulesProps> = ({
  recentVisits,
  allModules,
  onSelectModule,
  onClearHistory
}) => {
  const moduleMap = new Map(allModules.map(m => [m.id, m]));

  const visitsWithDetails = recentVisits
    .map(visit => ({
      module: moduleMap.get(visit.moduleId),
      visitedAt: visit.visitedAt,
      visitCount: visit.visitCount
    }))
    .filter(item => item.module !== undefined && item.module.id !== 'dashboard');

  return (
    <section className="recent-modules-section" aria-label="Ostatnio używane moduły">
      <div className="section-header">
        <div className="section-title-with-icon">
          <History size={18} className="section-icon" aria-hidden="true" />
          <h2 className="section-title">Ostatnio używane moduły</h2>
        </div>
        <div className="recent-header-actions">
          <span className="section-meta-tag">Zapis lokalny w przeglądarce</span>
          {visitsWithDetails.length > 0 && onClearHistory && (
            <button
              type="button"
              className="btn-clear-recent"
              onClick={onClearHistory}
            >
              <Trash2 size={13} aria-hidden="true" />
              <span>Wyczyść historię</span>
            </button>
          )}
        </div>
      </div>

      {visitsWithDetails.length === 0 ? (
        <div className="recent-empty-state">
          <Clock size={18} className="recent-empty-icon" aria-hidden="true" />
          <div className="recent-empty-text">
            <strong>Brak historii odwiedzonych modułów</strong>
            <span>
              Historia zapisze się lokalnie w tej przeglądarce po otwarciu wybranego modułu VaxNurse.
            </span>
          </div>
        </div>
      ) : (
        <div className="recent-modules-list">
          {visitsWithDetails.slice(0, 6).map(({ module, visitedAt, visitCount }) => {
            if (!module) return null;
            const Icon = module.icon;
            const formattedTime = formatRecentVisitTimestamp(visitedAt);
            const placeholder = isModulePlaceholder(module.id);

            return (
              <button
                key={module.id}
                type="button"
                className="recent-module-item"
                onClick={() => onSelectModule(module.id)}
              >
                <span className="recent-item-icon-box" aria-hidden="true">
                  <Icon size={18} className="recent-icon" />
                </span>

                <span className="recent-item-text">
                  <span className="recent-name">
                    {module.label}
                    {placeholder && (
                      <span className="recent-placeholder-tag">W przygotowaniu</span>
                    )}
                  </span>
                  <span className="recent-time">
                    <Clock size={12} aria-hidden="true" /> {formattedTime}
                    {visitCount > 1 ? ` • ${visitCount} otw.` : ''}
                  </span>
                </span>

                <span className="recent-item-action" aria-hidden="true">
                  <span className="recent-action-label">Przejdź</span>
                  <ArrowRight size={14} className="recent-arrow" />
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};
