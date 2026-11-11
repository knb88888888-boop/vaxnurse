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
  RotateCcw,
  X
} from 'lucide-react';
import type { ModuleDefinition } from '../../types/navigation';
import type { VaxNurseBackupPayload, BackupSummary } from '../../types/backup';
import {
  VAX_LAST_BACKUP_KEY,
  createBackupPayload,
  validateBackupPayload,
  mergeImportedBackupWithLocalCatalog,
  triggerJsonDownload,
  getStoredVaccines,
  storeVaccinesSafely,
  formatPolishDateTime
} from '../../utils/backup';
import {
  loadPreferences,
  savePreferences,
  resetPreferences,
  applyPreferencesToDocument,
  type UiDensity,
  type UiFontSize
} from '../../utils/preferences';

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
  const [initialPrefResult] = useState(() => loadPreferences());
  const [density, setDensity] = useState<UiDensity>(
    initialPrefResult.preferences.density
  );
  const [fontSize, setFontSize] = useState<UiFontSize>(
    initialPrefResult.preferences.fontSize
  );
  const [preferencesFeedback, setPreferencesFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(() =>
    initialPrefResult.error
      ? { type: 'info', message: initialPrefResult.error }
      : null
  );

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
  const [stagedWarnings, setStagedWarnings] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const persistAndApplyPreferences = (
    nextDensity: UiDensity,
    nextFontSize: UiFontSize,
    customSuccessText?: string
  ) => {
    const nextPrefs = applyPreferencesToDocument({
      density: nextDensity,
      fontSize: nextFontSize
    });
    setDensity(nextPrefs.density);
    setFontSize(nextPrefs.fontSize);

    const storage =
      typeof localStorage !== 'undefined' ? localStorage : null;
    const saved = savePreferences(storage, nextPrefs);
    if (!saved.success) {
      setPreferencesFeedback({
        type: 'error',
        message:
          saved.error ||
          'Nie udało się zapisać ustawień widoku w pamięci przeglądarki.'
      });
      return;
    }

    setPreferencesFeedback({
      type: 'success',
      message:
        customSuccessText ||
        `Zapisano preferencje widoku (${nextPrefs.density === 'compact' ? 'gęstość zwięzła' : 'gęstość komfortowa'}, tekst ${nextPrefs.fontSize === 'large' ? 'powiększony' : 'standardowy'}).`
    });
  };

  const handleDensityChange = (nextDensity: UiDensity) => {
    persistAndApplyPreferences(nextDensity, fontSize);
  };

  const handleFontSizeChange = (nextFontSize: UiFontSize) => {
    persistAndApplyPreferences(density, nextFontSize);
  };

  const handleResetPreferences = () => {
    const storage =
      typeof localStorage !== 'undefined' ? localStorage : null;
    const resetResult = resetPreferences(storage);
    const applied = applyPreferencesToDocument(resetResult.preferences);
    setDensity(applied.density);
    setFontSize(applied.fontSize);

    if (!resetResult.success) {
      setPreferencesFeedback({
        type: 'error',
        message:
          resetResult.error ||
          'Zastosowano domyślny widok w bieżącej sesji, ale nie udało się zapisać go w localStorage.'
      });
      return;
    }

    setPreferencesFeedback({
      type: 'info',
      message:
        'Przywrócono domyślne preferencje widoku (Komfortowa, Standardowy rozmiar tekstu).'
    });
  };

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

      // Rygorystyczna walidacja pliku kopii (format, schemat, pola, statusy, porównanie z katalogiem lokalnym)
      const currentLocalVaccines = getStoredVaccines();
      const validation = validateBackupPayload(content, currentLocalVaccines);

      if (!validation.isValid) {
        setStagedBackup(null);
        setStagedSummary(null);
        setStagedWarnings([]);
        setFeedbackMessage({
          type: 'error',
          title: 'Odrzucono nieprawidłowy plik kopii',
          description: `Plik nie spełnia kryteriów integralności VaxNurse:\n• ${validation.errors.join('\n• ')}`
        });
        return;
      }

      // Plik poprawny – ustaw stan oczekujący na potwierdzenie (podsumowanie + ostrzeżenia)
      if (validation.payload && validation.summary) {
        setStagedBackup(validation.payload);
        setStagedSummary(validation.summary);
        setStagedWarnings(validation.warnings || []);
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
    setStagedWarnings([]);
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
        '• Dane zostaną bezpiecznie scalone z aktualnym katalogiem bazowym preparatów.\n' +
        '• Deklaracje pełnego zatwierdzenia z niepodpisanego pliku JSON zostaną oznaczone do ponownej kontroli lokalnej, a nierozwiązane niezgodności ChPL pozostaną chronione.\n\n' +
        'Kliknij OK, aby potwierdzić przywrócenie danych.';

      if (!window.confirm(confirmMessage)) {
        setStagedBackup(null);
        setStagedSummary(null);
        setStagedWarnings([]);
        setFeedbackMessage({
          type: 'info',
          title: 'Anulowano przywracanie',
          description: 'Pobrano plik zabezpieczający bieżący stan, lecz operacja przywracania została przerwana na żądanie użytkownika.'
        });
        return;
      }

      // KROK 3: Zastosuj reguły integralności klinicznej oraz bezstratne scalenie z katalogiem bazowym
      const mergeResult = mergeImportedBackupWithLocalCatalog(
        stagedBackup.vaccines,
        currentVaccines
      );

      if (mergeResult.errors.length > 0 || mergeResult.duplicateIds.length > 0) {
        setFeedbackMessage({
          type: 'error',
          title: 'Przerwano przywracanie z powodów spójności danych',
          description: [
            ...mergeResult.errors,
            ...(mergeResult.duplicateIds.length > 0
              ? [`Wykryto zduplikowane identyfikatory: ${mergeResult.duplicateIds.join(', ')}`]
              : [])
          ].join(' ')
        });
        return;
      }

      // KROK 4: Bezpieczny zapis do localStorage
      const saveResult = storeVaccinesSafely(mergeResult.vaccines);

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
      setStagedWarnings([]);

      const claimsRecheckCount = mergeResult.vaccines.filter(
        v => Boolean(v.importedVerificationClaim)
      ).length;

      setFeedbackMessage({
        type: 'success',
        title: 'Kopia bezpieczeństwa przywrócona i scalona pomyślnie',
        description:
          `Baza preparatów została zaktualizowana (${mergeResult.vaccines.length} preparatów łącznie; ` +
          `zachowano lub dodano ${mergeResult.addedIds.length} nowych pozycji z katalogu bazowego). ` +
          (claimsRecheckCount > 0
            ? `${claimsRecheckCount} preparat(y) z zadeklarowanym zatwierdzeniem oznaczono do ponownej kontroli lokalnej z zachowaniem historii zmian.`
            : 'Wszystkie statusy ChPL, zarejestrowane wyjaśnienia oraz historia zmian zostały zaimportowane z zachowaniem integralności klinicznej.')
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

              {/* Rozszerzona siatka wskaźników podsumowania przed importem */}
              <div className="staged-summary-grid">
                <div className="staged-tile">
                  <span className="staged-tile-label">Data utworzenia kopii:</span>
                  <strong className="staged-tile-val">{stagedSummary.exportedAtFormatted}</strong>
                </div>
                <div className="staged-tile">
                  <span className="staged-tile-label">Preparaty (nowe / aktualizacje):</span>
                  <strong className="staged-tile-val">
                    {stagedSummary.totalVaccines} ({stagedSummary.productsToAdd} nowych / {stagedSummary.productsToUpdate} aktual.)
                  </strong>
                </div>
                <div className="staged-tile">
                  <span className="staged-tile-label">Liczba niezgodności ChPL:</span>
                  <strong className="staged-tile-val text-amber">{stagedSummary.totalDiscrepancies}</strong>
                </div>
                <div className="staged-tile">
                  <span className="staged-tile-label">Zapisane wyjaśnienia:</span>
                  <strong className="staged-tile-val text-blue">{stagedSummary.totalClarifications}</strong>
                </div>
                <div className="staged-tile">
                  <span className="staged-tile-label">Wykryte konflikty / różnice:</span>
                  <strong
                    className={`staged-tile-val ${stagedSummary.conflictCount > 0 ? 'text-amber' : ''}`}
                  >
                    {stagedSummary.conflictCount}
                  </strong>
                </div>
                <div className="staged-tile">
                  <span className="staged-tile-label">Deklaracje verified_chpl / do kontroli:</span>
                  <strong
                    className={`staged-tile-val ${stagedSummary.claimsRequiringRecheckCount > 0 ? 'text-amber' : ''}`}
                  >
                    {stagedSummary.verifiedChplClaimsCount} ({stagedSummary.claimsRequiringRecheckCount} do kontroli)
                  </strong>
                </div>
                <div className="staged-tile">
                  <span className="staged-tile-label">Niepoprawne lub niekompletne rekordy:</span>
                  <strong
                    className={`staged-tile-val ${stagedSummary.invalidRecordsCount > 0 ? 'text-amber' : ''}`}
                  >
                    {stagedSummary.invalidRecordsCount}
                  </strong>
                </div>
              </div>

              {(stagedWarnings.length > 0 || stagedSummary.invalidRecordDetails.length > 0) && (
                <div className="staged-integrity-notes" role="status">
                  <strong>Informacje z audytu integralności pliku przed scaleniem:</strong>
                  <ul>
                    {stagedWarnings.map((warning, idx) => (
                      <li key={`warn-${idx}`}>{warning}</li>
                    ))}
                    {stagedSummary.invalidRecordDetails.map((detail, idx) => (
                      <li key={`rec-${idx}`}>{detail}</li>
                    ))}
                  </ul>
                </div>
              )}

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
                  <strong>Procedura ochrony przed utratą danych i weryfikacji ChPL:</strong>
                  <p>
                    Przed zastosowaniem kopii aplikacja automatycznie pobierze kopię zabezpieczającą aktualnego stanu na Twój dysk.
                    Dane zostaną bezpiecznie scalone z katalogiem bazowym aplikacji, a deklaracje zatwierdzenia ChPL z niepodpisanego pliku JSON otrzymają status ponownej kontroli lokalnej.
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
            <div className="setting-options-row" role="group" aria-label="Gęstość układu elementów">
              <button
                type="button"
                className={`setting-chip ${density === 'comfortable' ? 'active' : ''}`}
                aria-pressed={density === 'comfortable'}
                onClick={() => handleDensityChange('comfortable')}
              >
                Komfortowa (standardowa)
              </button>
              <button
                type="button"
                className={`setting-chip ${density === 'compact' ? 'active' : ''}`}
                aria-pressed={density === 'compact'}
                onClick={() => handleDensityChange('compact')}
              >
                Zwięzła (dla mniejszych ekranów)
              </button>
            </div>
          </div>

          <div className="setting-control-group">
            <label className="setting-label">Rozmiar tekstu:</label>
            <div className="setting-options-row" role="group" aria-label="Rozmiar tekstu">
              <button
                type="button"
                className={`setting-chip ${fontSize === 'normal' ? 'active' : ''}`}
                aria-pressed={fontSize === 'normal'}
                onClick={() => handleFontSizeChange('normal')}
              >
                Standardowy
              </button>
              <button
                type="button"
                className={`setting-chip ${fontSize === 'large' ? 'active' : ''}`}
                aria-pressed={fontSize === 'large'}
                onClick={() => handleFontSizeChange('large')}
              >
                Wyraźny / powiększony
              </button>
            </div>
          </div>

          <div className="setting-reset-row">
            <button
              type="button"
              className="btn-reset-preferences"
              onClick={handleResetPreferences}
            >
              <RotateCcw size={15} />
              <span>Przywróć domyślne preferencje</span>
            </button>
          </div>

          {preferencesFeedback && (
            <div
              className={`preferences-feedback preferences-feedback--${preferencesFeedback.type}`}
              role="status"
            >
              {preferencesFeedback.message}
            </div>
          )}
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
              <span className="spec-value">VaxNurse — Etap A</span>
            </div>
            <div className="spec-card">
              <span className="spec-label">Silnik</span>
              <span className="spec-value">React 19 + TypeScript + Vite 8</span>
            </div>
            <div className="spec-card">
              <span className="spec-label">Schemat kopii</span>
              <span className="spec-value">JSON Schema v1.0.0</span>
            </div>
            <div className="spec-card">
              <span className="spec-label">Architektura</span>
              <span className="spec-value">Klient lokalny (Local-First)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
