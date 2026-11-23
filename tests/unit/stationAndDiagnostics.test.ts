import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadStationConfig,
  saveStationConfig,
  resetStationConfig,
  DEFAULT_STATION_CONFIG
} from '../../src/utils/stationPreferences';
import {
  inspectStorageDiagnostics,
  clearSpecificStorageCategory
} from '../../src/utils/storageDiagnostics';

describe('Station Preferences and Storage Diagnostics', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('obsługuje konfigurację stanowiska: domyślne, zapis, sanitizację i reset', () => {
    const initial = loadStationConfig();
    expect(initial).toEqual(DEFAULT_STATION_CONFIG);

    const saved = saveStationConfig({
      facilityName: 'NZOZ Punkt Szczepień Warszawa',
      facilityRoom: 'Gabinet nr 4',
      nurseInitials: 'P.M.',
      expiryWarningDays: 60,
      soundAlerts: true
    });

    expect(saved.success).toBe(true);
    expect(saved.config.facilityName).toBe('NZOZ Punkt Szczepień Warszawa');
    expect(saved.config.facilityRoom).toBe('Gabinet nr 4');
    expect(saved.config.expiryWarningDays).toBe(60);
    expect(saved.config.soundAlerts).toBe(true);

    // Wczytanie z pamięci
    const loaded = loadStationConfig();
    expect(loaded.facilityName).toBe('NZOZ Punkt Szczepień Warszawa');

    // Reset do domyślnych
    const reset = resetStationConfig();
    expect(reset.success).toBe(true);
    expect(reset.config.facilityName).toBe('');
    expect(reset.config.expiryWarningDays).toBe(30);
  });

  it('generuje raport diagnostyczny pamięci lokalnej (StorageDiagnosticsReport)', () => {
    localStorage.setItem('vaxnurse_vaccines_catalog', JSON.stringify([{ id: 'test-1' }]));

    const report = inspectStorageDiagnostics();
    expect(report.isHealthy).toBe(true);
    expect(report.modules.length).toBeGreaterThanOrEqual(8);

    const vaccinesMod = report.modules.find(m => m.key === 'vaxnurse_vaccines_catalog');
    expect(vaccinesMod).toBeDefined();
    expect(vaccinesMod?.itemCount).toBe(1);
    expect(vaccinesMod?.status).toBe('ok');
    expect(vaccinesMod?.sizeBytes).toBeGreaterThan(0);

    // Czyszczenie kategorii
    const cleared = clearSpecificStorageCategory('vaxnurse_vaccines_catalog');
    expect(cleared).toBe(true);
    expect(localStorage.getItem('vaxnurse_vaccines_catalog')).toBeNull();
  });
});
