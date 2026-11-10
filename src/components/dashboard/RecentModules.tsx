import React from 'react';
import { History, ArrowRight, Clock } from 'lucide-react';
import type { ModuleDefinition, ModuleId } from '../../types/navigation';

export interface RecentVisit {
  moduleId: ModuleId;
  timestamp: string;
}

interface RecentModulesProps {
  recentVisits: RecentVisit[];
  allModules: ModuleDefinition[];
  onSelectModule: (id: ModuleId) => void;
}

export const RecentModules: React.FC<RecentModulesProps> = ({
  recentVisits,
  allModules,
  onSelectModule
}) => {
  // Map visits to module definitions
  const moduleMap = new Map(allModules.map(m => [m.id, m]));

  const visitsWithDetails = recentVisits
    .map(visit => ({
      module: moduleMap.get(visit.moduleId),
      timestamp: visit.timestamp
    }))
    .filter(item => item.module !== undefined && item.module.id !== 'dashboard');

  if (visitsWithDetails.length === 0) {
    return null;
  }

  return (
    <div className="recent-modules-section">
      <div className="section-header">
        <div className="section-title-with-icon">
          <History size={18} className="section-icon" />
          <h2 className="section-title">Ostatnio używane moduły</h2>
        </div>
        <span className="section-meta-tag">Historia bieżącej sesji</span>
      </div>

      <div className="recent-modules-list">
        {visitsWithDetails.slice(0, 4).map(({ module, timestamp }) => {
          if (!module) return null;
          const Icon = module.icon;

          return (
            <div
              key={module.id}
              className="recent-module-item"
              onClick={() => onSelectModule(module.id)}
              role="button"
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectModule(module.id);
                }
              }}
            >
              <div className="recent-item-icon-box">
                <Icon size={18} className="recent-icon" />
              </div>

              <div className="recent-item-text">
                <span className="recent-name">{module.label}</span>
                <span className="recent-time">
                  <Clock size={12} /> {timestamp}
                </span>
              </div>

              <div className="recent-item-action">
                <span className="recent-action-label">Przejdź</span>
                <ArrowRight size={14} className="recent-arrow" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
