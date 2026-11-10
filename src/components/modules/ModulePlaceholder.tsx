import React from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  BookOpen,
  CalendarDays,
  ExternalLink,
  AlertTriangle,
  ThermometerSnowflake
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
              <span className="status-badge-ready">Wersja demonstracyjna</span>
            </div>
            <h1 className="module-view-title">{module.label}</h1>
            <p className="module-view-lead">{module.description}</p>
          </div>
        </div>
      </div>

      {/* Special Notice for Vaccination Calendar (PSO 2027 GIS Link) */}
      {module.id === 'vaccination-calendar' && (
        <div className="module-special-banner pso-gis-banner">
          <div className="special-banner-icon-box">
            <CalendarDays size={24} className="banner-icon-blue" />
          </div>
          <div className="special-banner-content">
            <div className="special-banner-badge">Źródło oficjalne</div>
            <h3 className="special-banner-title">Program Szczepień Ochronnych na 2027 rok</h3>
            <p className="special-banner-desc">
              Pełny, oficjalny tekst komunikatu Głównego Inspektora Sanitarnego dotyczący schematów szczepień obowiązkowych i zalecanych na 2027 rok jest dostępny na portalu rządowym.
            </p>
            <a
              href="https://www.gov.pl/web/gis/program-szczepien-ochronnych-na-2027-rok"
              target="_blank"
              rel="noopener noreferrer"
              className="gis-official-link-btn"
            >
              <span>Przejdź do oficjalnego komunikatu GIS (gov.pl)</span>
              <ExternalLink size={16} />
            </a>
          </div>
        </div>
      )}

      {/* Special Notice for Cold Chain */}
      {module.id === 'cold-chain' && (
        <div className="module-special-banner cold-chain-banner">
          <div className="special-banner-icon-box">
            <ThermometerSnowflake size={24} className="banner-icon-amber" />
          </div>
          <div className="special-banner-content">
            <div className="special-banner-badge amber">Ważna uwaga techniczna</div>
            <h3 className="special-banner-title">Kontrola łańcucha chłodniczego – zakres referencyjny</h3>
            <p className="special-banner-desc">
              Zakres <strong>+2°C do +8°C</strong> stanowi <strong>zakres referencyjny</strong> dla standardowego przechowywania produktów leczniczych i szczepionek.
            </p>
            <div className="cold-chain-warning-box">
              <AlertTriangle size={18} className="warning-box-icon" />
              <span>
                <strong>Brak automatycznego połączenia:</strong> Aplikacja w obecnej wersji <strong>nie posiada automatycznego połączenia z rejestratorem temperatury</strong> ani czujnikami telemetrycznymi. Odczyty temperatury wymagają bezpośredniej weryfikacji manualnej na certyfikowanych urządzeniach pomiarowych chłodziarek.
              </span>
            </div>
          </div>
        </div>
      )}

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
              <p><strong>W tej wersji nie przechowujemy danych pacjentów:</strong> Aplikacja nie zbiera, nie przetwarza i nie przekazuje danych osobowych ani numerów PESEL.</p>
            </div>
            <div className="safety-rule">
              <span className="rule-bullet">•</span>
              <p><strong>Decyzja personelu:</strong> Narzędzie ma charakter wyłącznie pomocniczy i referencyjny — kwalifikacja do szczepienia należy do uprawnionego lekarza/pielęgniarki.</p>
            </div>
            <div className="safety-rule">
              <span className="rule-bullet">•</span>
              <p><strong>Wersja demonstracyjna:</strong> Procedury i narzędzia wymagają każdorazowej weryfikacji z aktualnym komunikatem GIS oraz Charakterystyką Produktu Leczniczego (ChPL).</p>
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
          Fundament interfejsu modułu został wdrożony zgodnie z architekturą VaxNurse (wersja demonstracyjna).
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
