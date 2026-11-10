import React, { useState, useRef } from 'react';
import {
  Settings,
  ArrowLeft,
  Shield,
  Eye,
  Monitor,
  CheckCircle2,
  Database,
  Download,
  Upload,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  FileText,
  X
} from 'lucide-react';
import type { ModuleDefinition } from '../../types/navigation';
import type { VaxNurseBackupPayload, BackupSummary } from '../../types/backup';
import {
  VAX_LAST_BACKUP_KEY,
  createBackupPayload,
  validateBackupPayload,
  enforceClinicalIntegrityOnImport,
  triggerJsonDownload,
  getStoredVaccines,
  storeVaccinesSafely,
  formatPolishDateTime
} from '../../utils/backup';

interface SettingsViewProps {
  module: ModuleDefinition;
  onBackToDashboard: () => void;
}

interface FeedbackState {
  type: 'success' | 'error' | 'info';
  title: string;
  description: string;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  module,
  onBackToDashboard
}) => {
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal');

  // Stan modułu kopii bezpieczeństwa
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(() => {
    try {
      return localStorage.getItem(VAX_LAST_BACKUP_KEY);
    } catch {
      return null;
    }
  });
  const [feedbackMessage, setFeedbackMessage] = useState<FeedbackState | null>(null);
  const [stagedBackup, setStagedBackup] = useState<VaxNurseBackupPayload | null>(null);
  const [stagedSummary, setStagedSummary] = useState<BackupSummary | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. EKSPORT DANYCH (Pobierz kopię bezpieczeństwa)
  const handleExportBackup = () => {
    try {
      const currentVaccines = getStoredVaccines();
      const payload = createBackupPayload(currentVaccines);

      const now = new Date();
      const formattedTimestamp = now.toISOString().slice(0, 10);
      const filename = `vaxnurse-kopia-bezpieczenstwa-${formattedTimestamp}.json`;

      triggerJsonDownload(payload, filename);

      const polishNow = formatPolishDateTime(now);
      try {
        localStorage.setItem(VAX_LAST_BACKUP_KEY, polishNow);
      } catch {}
      setLastBackupDate(polishNow);

      setFeedbackMessage({
        type: 'success',
        title: 'Kopia bezpieczeństwa pobrana pomyślnie',
        description: `Plik "${filename}" został wygenerowany i pobrany na Twój dysk. Kopia zawiera ${payload.metadata.totalVaccines} preparatów i nie zawiera danych pacjentów.`
      });
    } catch (e) {
      console.error('Błąd podczas generowania kopii bezpieczeństwa:', e);
      setFeedbackMessage({
        type: 'error',
        title: 'Błąd generowania kopii bezpieczeństwa',
        description: `Nie udało się utworzyć pliku kopii: ${e instanceof Error ? e.message : 'Nieznany błąd zapisu'}`
      });
    }
  };

  // 2. PRZYGOTOWANIE DO IMPORTU – Otwórz wybór pliku
  const handleTriggerFileSelect = () => {
    setFeedbackMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // 2b. ODCZYT I WALIDACJA PLIKU PRZED IMPORTEM
  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content !== 'string') {
        setFeedbackMessage({
          type: 'error',
          title: 'Błąd odczytu pliku',
          description: 'Nie udało się odczytać zawartości wskazanego pliku jako tekstu.'
        });
        return;
      }

      // Rygorystyczna walidacja pliku kopii (format, schemat, pola, statusy)
      const validation = validateBackupPayload(content);

      if (!validation.isValid) {
        setStagedBackup(null);
        setStagedSummary(null);
        setFeedbackMessage({
          type: 'error',
          title: 'Odrzucono nieprawidłowy plik kopii',
          description: `Plik nie spełnia kryteriów integralności VaxNurse:\n• ${validation.errors.join('\n• ')}`
        });
        return;
      }

      // Plik poprawny – ustaw stan oczekujący na potwierdzenie (podsumowanie)
      if (validation.payload && validation.summary) {
        setStagedBackup(validation.payload);
        setStagedSummary(validation.summary);
        setFeedbackMessage(null);
      }
    };

    reader.onerror = () => {
      setFeedbackMessage({
        type: 'error',
        title: 'Błąd odczytu pliku',
        description: 'Wystąpił błąd podczas próby otwarcia wskazanego pliku z dysku.'
      });
    };

    reader.readAsText(file);
  };

  // 3. ANULOWANIE PRZYWRACANIA
  const handleCancelRestore = () => {
    setStagedBackup(null);
    setStagedSummary(null);
    setFeedbackMessage({
      type: 'info',
      title: 'Anulowano przywracanie',
      description: 'Przywracanie kopii zostało anulowane przez użytkownika. Żadne dane nie zostały zmienione.'
    });
  };

  // 4. POTWIERDZENIE I PRZYWRÓCENIE KOPII (Z procedurą bezpieczeństwa przed utratą)
  const handleConfirmRestore = () => {
    if (!stagedBackup) return;

    try {
      const currentVaccines = getStoredVaccines();

      // KROK 1: Wykonaj automatyczną kopię zabezpieczającą bieżącego stanu przed nadpisaniem
      const safetyPayload = createBackupPayload(currentVaccines);
      const safetyTimestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const safetyFilename = `vaxnurse-kopia-zabezpieczajaca-przed-przywroceniem-${safetyTimestamp}.json`;
      triggerJsonDownload(safetyPayload, safetyFilename);

      // KROK 2: Wymagaj świadomego potwierdzenia użytkownika
      const confirmMessage =
        'Czy na pewno chcesz przywrócić dane z wybranej kopii bezpieczeństwa?\n\n' +
        '• Aktualny stan bazy został automatycznie pobrany do pliku zabezpieczającego na Twój dysk.\n' +
        '• Poprzednia historia lokalna w przeglądarce zostanie zastąpiona danymi z kopii.\n' +
        '• Wymuszone zostaną reguły integralności klinicznej (ochrona nierozwiązanych niezgodności).\n\n' +
        'Kliknij OK, aby potwierdzić przywrócenie danych.';

      if (!window.confirm(confirmMessage)) {
        setStagedBackup(null);
        setStagedSummary(null);
        setFeedbackMessage({
          type: 'info',
          title: 'Anulowano przywracanie',
          description: 'Pobrano plik zabezpieczający bieżący stan, lecz operacja przywracania została przerwana na żądanie użytkownika.'
        });
        return;
      }

      // KROK 3: Zastosuj reguły integralności klinicznej (Wymóg 4)
      const sanitizedVaccines = enforceClinicalIntegrityOnImport(
        stagedBackup.vaccines,
        currentVaccines
      );

      // KROK 4: Bezpieczny zapis do localStorage (Wymóg 5)
      const saveResult = storeVaccinesSafely(sanitizedVaccines);

      if (!saveResult.success) {
        setFeedbackMessage({
          type: 'error',
          title: 'Błąd zapisu przywróconych danych',
          description: saveResult.error || 'Nie udało się zapisać danych w pamięci podręcznej przeglądarki. Dane nie zostały zmodyfikowane.'
        });
        return;
      }

      // KROK 5: Sukces – aktualizacja metadanych i czyszczenie stanu
      const polishNow = formatPolishDateTime(new Date());
      try {
        localStorage.setItem(VAX_LAST_BACKUP_KEY, polishNow);
      } catch {}
      setLastBackupDate(polishNow);

      setStagedBackup(null);
      setStagedSummary(null);

      setFeedbackMessage({
        type: 'success',
        title: 'Kopia bezpieczeństwa przywrócona pomyślnie',
        description: `Baza preparatów została zaktualizowana na podstawie kopii (${sanitizedVaccines.length} preparatów). Wszystkie statusy ChPL, zarejestrowane wyjaśnienia oraz historia zmian zostały zaimportowane z zachowaniem integralności klinicznej.`
      });
    } catch (e) {
      console.error('Błąd podczas przywracania kopii bezpieczeństwa:', e);
      setFeedbackMessage({
        type: 'error',
        title: 'Błąd podczas przywracania kopii',
        description: `Wystąpił nieoczekiwany błąd: ${e instanceof Error ? e.message : 'Nieznany błąd'}. Dane nie zostały zmodyfikowane.`
      });
    }
  };

  return (
    <div className="module-view-container settings-container">
      {/* Top Navigation */}
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

      {/* Header Card */}
      <div className="module-view-header-card">
        <div className="module-view-header-left">
          <div className="module-view-icon-box">
            <Settings size={32} className="module-view-icon" />
          </div>
          <div>
            <div className="module-view-badges">
              <span className="module-category-pill">Narzędzie systemowe</span>
              <span className="status-badge-ready">Lokalna ochrona danych</span>
            </div>
            <h1 className="module-view-title">{module.label}</h1>
            <p className="module-view-lead">{module.description}</p>
          </div>
        </div>
      </div>

      <div className="settings-grid">
        {/* ============================================================== */}
        {/* SEKCJA: KOPIE BEZPIECZEŃSTWA (Lokalny system backupu)         */}
        {/* ============================================================== */}
        <div className="content-panel full-width backup-panel">
          <div className="panel-title-with-icon">
            <Database size={22} className="panel-title-icon backup-icon" />
            <div>
              <h2 className="panel-heading">Kopie bezpieczeństwa</h2>
              <span className="panel-subheading">
                Lokalny eksport i przywracanie bazy preparatów, statusów ChPL i historii zmian
              </span>
            </div>
          </div>

          <p className="panel-text">
            VaxNurse działa w modelu lokalnym (Local-First). Wszystkie modyfikacje statusów weryfikacji, rejestrowane wyjaśnienia urzędowe oraz historia decyzji personelu są przechowywane w pamięci Twojej przeglądarki. Aby zabezpieczyć dane przed przypadkowym wyczyszczeniem pamięci podręcznej lub przenieść je na inne stanowisko w punkcie szczepień, regularnie pobieraj kopię bezpieczeństwa.
          </p>

          {/* Zalecenie bezpieczeństwa danych (Wymóg 6) */}
          <div className="backup-safety-notice">
            <ShieldCheck size={20} className="safety-notice-icon" />
            <div className="safety-notice-content">
              <strong>Zalecenie bezpieczeństwa danych:</strong>
              <p>
                Kopie bezpieczeństwa są generowane w standaryzowanym formacie JSON i pobierane bezpośrednio na dysk Twojego urządzenia. 
                Kopie należy przechowywać w bezpiecznym miejscu (np. na zaszyfrowanym dysku stacji roboczej lub zabezpieczonym nośniku pamięci punktu szczepień). 
                <strong> Ważne:</strong> Pliki kopii zawierają wyłącznie dane katalogowe leków i decyzje weryfikacyjne – nie eksportują żadnych danych pacjentów.
              </p>
            </div>
          </div>

          {/* Status i data ostatniej wykonanej kopii */}
          <div className="backup-meta-bar">
            <div className="backup-last-date-item">
              <Calendar size={16} className="backup-meta-icon" />
              <span>Data ostatniej wykonanej kopii w tej przeglądarce:</span>
              <strong className="backup-last-date-val">
                {lastBackupDate || 'Brak wykonanych kopii w tej przeglądarce'}
              </strong>
            </div>
          </div>

          {/* Komunikaty sukcesu / błędu */}
          {feedbackMessage && (
            <div className={`backup-feedback-banner ${feedbackMessage.type}`} role="alert">
              {feedbackMessage.type === 'success' ? (
                <CheckCircle2 size={18} className="feedback-icon" />
              ) : (
                <AlertTriangle size={18} className="feedback-icon" />
              )}
              <div className="feedback-text">
                <strong>{feedbackMessage.title}</strong>
                <p>{feedbackMessage.description}</p>
              </div>
              <button
                type="button"
                className="btn-close-feedback"
                onClick={() => setFeedbackMessage(null)}
                title="Zamknij powiadomienie"
              >
                <X size={15} />
              </button>
            </div>
          )}

          {/* Przyciski akcji: Eksport i Import (Wymóg 1 i 2) */}
          <div className="backup-actions-row">
            <button
              type="button"
              className="btn-backup-export"
              onClick={handleExportBackup}
            >
              <Download size={17} />
              <span>Pobierz kopię bezpieczeństwa</span>
            </button>

            <button
              type="button"
              className="btn-backup-import"
              onClick={handleTriggerFileSelect}
            >
              <Upload size={17} />
              <span>Przywróć kopię bezpieczeństwa</span>
            </button>

            {/* Ukryty selektor pliku JSON */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              style={{ display: 'none' }}
              onChange={handleFileSelected}
            />
          </div>

          {/* Podgląd przed przywróceniem (Wymóg 2 i 3: Nie nadpisuj automatycznie) */}
          {stagedBackup && stagedSummary && (
            <div className="backup-staged-card" role="region" aria-label="Podsumowanie kopii zapasowej przed importem">
              <div className="staged-card-header">
                <div className="staged-header-title">
                  <FileText size={20} className="staged-icon" />
                  <div>
                    <h3 className="staged-heading">Podsumowanie pliku kopii przed przywróceniem</h3>
                    <span className="staged-subheading">
                      Sprawdź zweryfikowane dane przed podjęciem decyzji o nadpisaniu bazy lokalnej.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-cancel-staged"
                  onClick={handleCancelRestore}
                  title="Anuluj przywracanie"
                >
                  <X size={16} />
                  <span>Anuluj</span>
                </button>
              </div>

              {/* Siatka wskaźników podsumowania (Wymóg 2) */}
              <div className="staged-summary-grid">
                <div className="staged-tile">
                  <span className="staged-tile-label">Data utworzenia kopii:</span>
                  <strong className="staged-tile-val">{stagedSummary.exportedAtFormatted}</strong>
                </div>
                <div className="staged-tile">
                  <span className="staged-tile-label">Liczba preparatów:</span>
                  <strong className="staged-tile-val">{stagedSummary.totalVaccines}</strong>
                </div>
                <div className="staged-tile">
                  <span className="staged-tile-label">Liczba niezgodności:</span>
                  <strong className="staged-tile-val text-amber">{stagedSummary.totalDiscrepancies}</strong>
                </div>
                <div className="staged-tile">
                  <span className="staged-tile-label">Zapisane wyjaśnienia:</span>
                  <strong className="staged-tile-val text-blue">{stagedSummary.totalClarifications}</strong>
                </div>
              </div>

              <div className="staged-vaccines-chips">
                <span className="chips-label">Preparaty w pliku kopii:</span>
                <div className="chips-row">
                  {stagedSummary.vaccineNames.map((name, i) => (
                    <span key={i} className="vaccine-chip-badge">
                      {name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Ostrzeżenie i procedura bezpieczeństwa (Wymóg 3) */}
              <div className="staged-warning-box">
                <AlertTriangle size={18} className="staged-warn-icon" />
                <div className="staged-warn-content">
                  <strong>Procedura ochrony przed utratą danych:</strong>
                  <p>
                    Przed przywróceniem danych z kopii aplikacja automatycznie pobierze kopię bezpieczeństwa aktualnego stanu bazy na Twój dysk.
                    Następnie zostaniesz poproszony o ostateczne potwierdzenie operacji. Poprzednia historia zmian w przeglądarce zostanie zastąpiona danymi z wybranego pliku.
                  </p>
                </div>
              </div>

              <div className="staged-actions-bar">
                <button
                  type="button"
                  className="btn-confirm-restore"
                  onClick={handleConfirmRestore}
                >
                  <CheckCircle2 size={16} />
                  <span>Potwierdź i przywróć dane z kopii</span>
                </button>
                <button
                  type="button"
                  className="btn-abort-restore"
                  onClick={handleCancelRestore}
                >
                  Anuluj przywracanie
                </button>
              </div>
            </div>
          )}
        </div>

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
              <span className="spec-label">Schemat kopii</span>
              <span className="spec-value">JSON Schema v1.0.0</span>
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
