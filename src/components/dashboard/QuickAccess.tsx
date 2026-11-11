import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { QuickAccessItem, ModuleId } from '../../types/navigation';
import { isModulePlaceholder } from '../../utils/globalSearch';

interface QuickAccessProps {
  items: QuickAccessItem[];
  onSelectModule: (id: ModuleId) => void;
}

export const QuickAccess: React.FC<QuickAccessProps> = ({ items, onSelectModule }) => {
  return (
    <div className="quick-access-section">
      <div className="section-header">
        <div>
          <h2 className="section-title">Szybki dostęp</h2>
          <p className="section-subtitle">Bezpośrednie skróty do najczęściej używanych procedur i kontroli</p>
        </div>
      </div>

      <div className="quick-access-grid">
        {items.map(item => {
          const Icon = item.icon;
          const placeholder = isModulePlaceholder(item.targetModule);

          return (
            <button
              key={item.id}
              type="button"
              className={`quick-access-card badge-${item.badgeColor || 'blue'} ${placeholder ? 'is-placeholder' : ''}`}
              onClick={() => onSelectModule(item.targetModule)}
            >
              <span className="qa-icon-wrapper" aria-hidden="true">
                <Icon size={20} className="qa-icon" />
              </span>
              <span className="qa-content">
                <span className="qa-title">
                  {item.title}
                  {placeholder && (
                    <span className="qa-placeholder-pill">W przygotowaniu</span>
                  )}
                </span>
                <span className="qa-subtitle">{item.subtitle}</span>
              </span>
              <ChevronRight size={16} className="qa-arrow" aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
