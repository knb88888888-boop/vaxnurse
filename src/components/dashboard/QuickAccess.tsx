import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { QuickAccessItem, ModuleId } from '../../types/navigation';

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
          return (
            <button
              key={item.id}
              type="button"
              className={`quick-access-card badge-${item.badgeColor || 'blue'}`}
              onClick={() => onSelectModule(item.targetModule)}
            >
              <div className="qa-icon-wrapper">
                <Icon size={20} className="qa-icon" />
              </div>
              <div className="qa-content">
                <span className="qa-title">{item.title}</span>
                <span className="qa-subtitle">{item.subtitle}</span>
              </div>
              <ChevronRight size={16} className="qa-arrow" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
