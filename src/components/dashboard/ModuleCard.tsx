import React from 'react';
import { ArrowRight } from 'lucide-react';
import type { ModuleDefinition, ModuleId } from '../../types/navigation';

interface ModuleCardProps {
  module: ModuleDefinition;
  onSelect: (id: ModuleId) => void;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({ module, onSelect }) => {
  const Icon = module.icon;

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'clinical':
        return 'Standard kliniczny';
      case 'logistics':
        return 'Organizacja i sprzęt';
      case 'system':
        return 'Narzędzia systemowe';
      default:
        return 'Narzędzie punktu';
    }
  };

  return (
    <div
      className={`module-card category-${module.category}`}
      onClick={() => onSelect(module.id)}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(module.id);
        }
      }}
      aria-label={`Otwórz moduł ${module.label}`}
    >
      <div className="card-top">
        <div className="card-icon-container">
          <Icon className="card-icon" size={24} />
        </div>
        <div className="card-badges">
          {module.badge && <span className="module-badge">{module.badge}</span>}
          <span className="category-badge">{getCategoryLabel(module.category)}</span>
        </div>
      </div>

      <div className="card-body">
        <h3 className="card-title">{module.label}</h3>
        <p className="card-desc">{module.description}</p>
      </div>

      <div className="card-footer">
        <span className="card-action-text">Otwórz narzędzie</span>
        <div className="card-arrow-wrapper">
          <ArrowRight className="card-arrow" size={16} />
        </div>
      </div>
    </div>
  );
};
