export const STATION_CONFIG_STORAGE_KEY = 'vaxnurse_station_config_v1';

export type ExpiryWarningDays = 14 | 30 | 60 | 90;

export interface StationConfig {
  facilityName: string;
  facilityRoom: string;
  nurseInitials: string;
  expiryWarningDays: ExpiryWarningDays;
  soundAlerts: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  autoSaveMinutes: number;
}

export const DEFAULT_STATION_CONFIG: StationConfig = {
  facilityName: '',
  facilityRoom: '',
  nurseInitials: '',
  expiryWarningDays: 30,
  soundAlerts: false,
  reducedMotion: false,
  highContrast: false,
  autoSaveMinutes: 5
};

export const sanitizeStationConfig = (raw: unknown): StationConfig => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ...DEFAULT_STATION_CONFIG };
  }

  const obj = raw as Record<string, unknown>;

  const facilityName = typeof obj.facilityName === 'string' ? obj.facilityName.slice(0, 120) : '';
  const facilityRoom = typeof obj.facilityRoom === 'string' ? obj.facilityRoom.slice(0, 60) : '';
  const nurseInitials = typeof obj.nurseInitials === 'string' ? obj.nurseInitials.slice(0, 30) : '';

  const allowedDays = [14, 30, 60, 90];
  const expiryWarningDays: ExpiryWarningDays =
    typeof obj.expiryWarningDays === 'number' && allowedDays.includes(obj.expiryWarningDays)
      ? (obj.expiryWarningDays as ExpiryWarningDays)
      : 30;

  const soundAlerts = Boolean(obj.soundAlerts);
  const reducedMotion = Boolean(obj.reducedMotion);
  const highContrast = Boolean(obj.highContrast);

  const autoSaveMinutes =
    typeof obj.autoSaveMinutes === 'number' && obj.autoSaveMinutes >= 1 && obj.autoSaveMinutes <= 60
      ? obj.autoSaveMinutes
      : 5;

  return {
    facilityName,
    facilityRoom,
    nurseInitials,
    expiryWarningDays,
    soundAlerts,
    reducedMotion,
    highContrast,
    autoSaveMinutes
  };
};

export const loadStationConfig = (): StationConfig => {
  if (typeof localStorage === 'undefined') {
    return { ...DEFAULT_STATION_CONFIG };
  }
  try {
    const raw = localStorage.getItem(STATION_CONFIG_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATION_CONFIG };
    return sanitizeStationConfig(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_STATION_CONFIG };
  }
};

export const saveStationConfig = (
  config: Partial<StationConfig>
): { success: boolean; config: StationConfig; error: string | null } => {
  const current = loadStationConfig();
  const merged = sanitizeStationConfig({ ...current, ...config });

  if (typeof localStorage === 'undefined') {
    return { success: false, config: merged, error: 'Pamięć przeglądarki niedostępna.' };
  }

  try {
    localStorage.setItem(STATION_CONFIG_STORAGE_KEY, JSON.stringify(merged));
    applyStationConfigToDocument(merged);
    return { success: true, config: merged, error: null };
  } catch {
    return { success: false, config: merged, error: 'Błąd zapisu ustawień stanowiska w pamięci localStorage.' };
  }
};

export const resetStationConfig = (): { success: boolean; config: StationConfig; error: string | null } => {
  return saveStationConfig(DEFAULT_STATION_CONFIG);
};

export const applyStationConfigToDocument = (config: StationConfig): void => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (config.reducedMotion) {
    root.setAttribute('data-reduced-motion', 'true');
  } else {
    root.removeAttribute('data-reduced-motion');
  }

  if (config.highContrast) {
    root.setAttribute('data-high-contrast', 'true');
  } else {
    root.removeAttribute('data-high-contrast');
  }
};
