import React from 'react';
import { ArrowRight } from 'lucide-react';
import type { ModuleDefinition, ModuleId } from '../../types/navigation';
import { isModulePlaceholder } from '../../utils/globalSearch';

interface ModuleCardProps {
  module: ModuleDefinition;
  onSelect: (id: ModuleId) => void;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({ module, onSelect }) => {
  const Icon = module.icon;
  const placeholder = isModulePlaceholder(module.id);

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
    <button
      type="button"
      className={`module-card category-${module.category} ${placeholder ? 'is-placeholder' : ''}`}
      onClick={() => onSelect(module.id)}
      title={
        placeholder
          ? `Podgląd zakresu planowanego modułu: ${module.label} (W przygotowaniu)`
          : `Otwórz moduł ${module.label}`
      }
    >
      <span className="card-top">
        <span className="card-icon-container" aria-hidden="true">
          <Icon className="card-icon" size={24} />
        </span>
        <span className="card-badges">
          {placeholder ? (
            <span className="module-badge module-badge--placeholder">W przygotowaniu</span>
          ) : (
            module.badge && <span className="module-badge">{module.badge}</span>
          )}
          <span className="category-badge">{getCategoryLabel(module.category)}</span>
        </span>
      </span>

      <span className="card-body">
        <span className="card-title">{module.label}</span>
        <span className="card-desc">{module.description}</span>
      </span>

      <span className="card-footer">
        <span className="card-action-text">
          {placeholder ? 'Podgląd zakresu (nieaktywny)' : 'Otwórz narzędzie'}
        </span>
        <span className="card-arrow-wrapper" aria-hidden="true">
          <ArrowRight className="card-arrow" size={16} />
        </span>
      </span>
    </button>
  );
};
