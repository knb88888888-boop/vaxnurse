import React from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  BookOpen
} from 'lucide-react';
import type { ModuleDefinition, ModuleId } from '../../types/navigation';

interface ModulePlaceholderProps {
  module: ModuleDefinition;
  onBackToDashboard: () => void;
  onNavigateToModule: (id: ModuleId) => void;
}

export const ModulePlaceholder: React.FC<ModulePlaceholderProps> = ({
  module,
  onBackToDashboard,
  onNavigateToModule
}) => {
  const Icon = module.icon;

  return (
    <div className="module-view-container">
      {/* Top navigation link */}
      <div className="module-view-nav">
        <button
          type="button"
          className="back-to-dashboard-btn"
          onClick={onBackToDashboard}
        >
          <ArrowLeft size={16} />
          <span>Powrót do Pulpitu</span>
        </button>
        <span className="view-mode-pill">Ekran demonstracyjny fundamentu</span>
      </div>

      {/* Module Header Card */}
      <div className="module-view-header-card">
        <div className="module-view-header-left">
          <div className="module-view-icon-box">
            <Icon size={32} className="module-view-icon" />
          </div>
          <div>
            <div className="module-view-badges">
              <span className="module-category-pill">
                {module.category === 'clinical' && 'Moduł kliniczny'}
                {module.category === 'logistics' && 'Organizacja i procedury'}
                {module.category === 'system' && 'Moduł systemowy'}
                {module.category === 'main' && 'Widok główny'}
              </span>
              {module.badge && <span className="module-custom-badge">{module.badge}</span>}
              <span className="status-badge-ready">Architektura zintegrowana</span>
            </div>
            <h1 className="module-view-title">{module.label}</h1>
            <p className="module-view-lead">{module.description}</p>
          </div>
        </div>
      </div>

      {/* Information Grid */}
      <div className="module-view-content-grid">
        {/* Purpose and Scope */}
        <div className="content-panel">
          <h2 className="panel-heading">Przeznaczenie i zakres roboczy</h2>
          <p className="panel-text">{module.purposeNote}</p>

          <h3 className="panel-subheading">Kluczowe funkcjonalności przewidziane w standardzie:</h3>
          <ul className="features-list">
            {module.keyFeatures.map((feature, idx) => (
              <li key={idx} className="feature-item">
                <CheckCircle2 size={18} className="feature-check-icon" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Safety and Standards Card */}
        <div className="content-panel safety-panel">
          <div className="safety-header">
            <ShieldCheck size={24} className="safety-icon" />
            <div>
              <h3 className="safety-title">Zasady bezpieczeństwa VaxNurse</h3>
              <span className="safety-subtitle">Prywatność i rzetelność medyczna</span>
            </div>
          </div>

          <div className="safety-body">
            <div className="safety-rule">
              <span className="rule-bullet">•</span>
              <p><strong>Brak danych osobowych:</strong> Aplikacja nie zbiera, nie przetwarza i nie przekazuje danych pacjentów.</p>
            </div>
            <div className="safety-rule">
              <span className="rule-bullet">•</span>
              <p><strong>Decyzja personelu:</strong> Narzędzie ma charakter wyłącznie pomocniczy i referencyjny — kwalifikacja do szczepienia należy do uprawnionego lekarza/pielęgniarki.</p>
            </div>
            <div className="safety-rule">
              <span className="rule-bullet">•</span>
              <p><strong>Źródła oficjalne:</strong> Opracowywane treści bazują na oficjalnych komunikatach GIS, Ministerstwa Zdrowia oraz ChPL.</p>
            </div>
          </div>

          <div className="safety-footer">
            <button
              type="button"
              className="action-link-btn"
              onClick={() => onNavigateToModule('knowledge-base')}
            >
              <BookOpen size={15} />
              <span>Przejdź do Bazy wiedzy</span>
            </button>
          </div>
        </div>
      </div>

      {/* Action footer */}
      <div className="module-view-footer">
        <p className="footer-status-note">
          Fundament interfejsu modułu został wdrożony zgodnie z architekturą VaxNurse.
        </p>
        <button
          type="button"
          className="btn-primary-dashboard"
          onClick={onBackToDashboard}
        >
          Powrót do Pulpitu
        </button>
      </div>
    </div>
  );
};
