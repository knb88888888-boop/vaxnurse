import React, { useState } from 'react';
import {
  Settings,
  ArrowLeft,
  Shield,
  Eye,
  Monitor,
  CheckCircle2
} from 'lucide-react';
import type { ModuleDefinition } from '../../types/navigation';

interface SettingsViewProps {
  module: ModuleDefinition;
  onBackToDashboard: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  module,
  onBackToDashboard
}) => {
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal');

  return (
    <div className="module-view-container settings-container">
      <div className="module-view-nav">
        <button
          type="button"
          className="back-to-dashboard-btn"
          onClick={onBackToDashboard}
        >
          <ArrowLeft size={16} />
          <span>Powrót do Pulpitu</span>
        </button>
        <span className="view-mode-pill">Ustawienia stanowiska</span>
      </div>

      <div className="module-view-header-card">
        <div className="module-view-header-left">
          <div className="module-view-icon-box">
            <Settings size={32} className="module-view-icon" />
          </div>
          <div>
            <div className="module-view-badges">
              <span className="module-category-pill">Narzędzie systemowe</span>
              <span className="status-badge-ready">Wersja demonstracyjna</span>
            </div>
            <h1 className="module-view-title">{module.label}</h1>
            <p className="module-view-lead">{module.description}</p>
          </div>
        </div>
      </div>

      <div className="settings-grid">
        {/* Appearance & Ergonomics */}
        <div className="content-panel">
          <div className="panel-title-with-icon">
            <Eye size={20} className="panel-title-icon" />
            <h2 className="panel-heading">Ergonomia pracy w punkcie szczepień</h2>
          </div>
          <p className="panel-text">
            Dostosuj parametry widoku do ekranu komputera lub tabletu w gabinecie zabiegowym.
          </p>

          <div className="setting-control-group">
            <label className="setting-label">Gęstość układu elementów:</label>
            <div className="setting-options-row">
              <button
                type="button"
                className={`setting-chip ${density === 'comfortable' ? 'active' : ''}`}
                onClick={() => setDensity('comfortable')}
              >
                Komfortowa (standardowa)
              </button>
              <button
                type="button"
                className={`setting-chip ${density === 'compact' ? 'active' : ''}`}
                onClick={() => setDensity('compact')}
              >
                Zwięzła (dla mniejszych ekranów)
              </button>
            </div>
          </div>

          <div className="setting-control-group">
            <label className="setting-label">Rozmiar tekstu:</label>
            <div className="setting-options-row">
              <button
                type="button"
                className={`setting-chip ${fontSize === 'normal' ? 'active' : ''}`}
                onClick={() => setFontSize('normal')}
              >
                Standardowy
              </button>
              <button
                type="button"
                className={`setting-chip ${fontSize === 'large' ? 'active' : ''}`}
                onClick={() => setFontSize('large')}
              >
                Wyraźny / powiększony
              </button>
            </div>
          </div>
        </div>

        {/* Privacy & Security architecture */}
        <div className="content-panel">
          <div className="panel-title-with-icon">
            <Shield size={20} className="panel-title-icon" />
            <h2 className="panel-heading">Prywatność i bezpieczeństwo danych</h2>
          </div>
          <p className="panel-text">
            Zasady ochrony prywatności wdrożone w architekturze VaxNurse:
          </p>

          <div className="privacy-feature-list">
            <div className="privacy-feature-item">
              <CheckCircle2 size={18} className="feature-check-icon" />
              <div>
                <strong>Brak transmisji zewnętrznej:</strong> Aplikacja działa wyłącznie w Twojej przeglądarce, bez zewnętrznych serwerów śledzących.
              </div>
            </div>

            <div className="privacy-feature-item">
              <CheckCircle2 size={18} className="feature-check-icon" />
              <div>
                <strong>W tej wersji nie przechowujemy danych pacjentów:</strong> Brak formularzy pacjentów, brak numerów PESEL, brak gromadzenia historii medycznej.
              </div>
            </div>

            <div className="privacy-feature-item">
              <CheckCircle2 size={18} className="feature-check-icon" />
              <div>
                <strong>Tryb referencyjny:</strong> Wszystkie narzędzia służą do weryfikacji procedur i ułatwienia obliczeń odstępów.
              </div>
            </div>
          </div>
        </div>

        {/* Technical information */}
        <div className="content-panel full-width">
          <div className="panel-title-with-icon">
            <Monitor size={20} className="panel-title-icon" />
            <h2 className="panel-heading">Informacje o systemie</h2>
          </div>
          <div className="system-specs-grid">
            <div className="spec-card">
              <span className="spec-label">Aplikacja</span>
              <span className="spec-value">VaxNurse 1.0 (Fundament)</span>
            </div>
            <div className="spec-card">
              <span className="spec-label">Silnik</span>
              <span className="spec-value">React + TypeScript + Vite</span>
            </div>
            <div className="spec-card">
              <span className="spec-label">Ikony</span>
              <span className="spec-value">Lucide React</span>
            </div>
            <div className="spec-card">
              <span className="spec-label">Architektura</span>
              <span className="spec-value">Klient lokalny (Prywatny)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
