export const PREFERENCES_STORAGE_KEY = 'vaxnurse_preferences_v1';

export type UiDensity = 'comfortable' | 'compact';
export type UiFontSize = 'normal' | 'large';

export interface AppPreferences {
  density: UiDensity;
  fontSize: UiFontSize;
}

export const DEFAULT_APP_PREFERENCES: AppPreferences = {
  density: 'comfortable',
  fontSize: 'normal'
};

export interface PreferencesStorageReader {
  getItem: (key: string) => string | null;
}

export interface PreferencesStorageWriter {
  setItem: (key: string, value: string) => void;
}

export interface PreferencesStorageLike
  extends PreferencesStorageReader,
    PreferencesStorageWriter {}

const ALLOWED_DENSITIES = new Set<string>(['comfortable', 'compact']);
const ALLOWED_FONT_SIZES = new Set<string>(['normal', 'large']);

export const isValidDensity = (val: unknown): val is UiDensity =>
  typeof val === 'string' && ALLOWED_DENSITIES.has(val);

export const isValidFontSize = (val: unknown): val is UiFontSize =>
  typeof val === 'string' && ALLOWED_FONT_SIZES.has(val);

export const sanitizePreferences = (
  raw: unknown
): { preferences: AppPreferences; hadInvalidFields: boolean } => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      preferences: { ...DEFAULT_APP_PREFERENCES },
      hadInvalidFields: true
    };
  }

  const obj = raw as Record<string, unknown>;
  const density: UiDensity = isValidDensity(obj.density)
    ? obj.density
    : DEFAULT_APP_PREFERENCES.density;
  const fontSize: UiFontSize = isValidFontSize(obj.fontSize)
    ? obj.fontSize
    : DEFAULT_APP_PREFERENCES.fontSize;

  return {
    preferences: {
      density,
      fontSize
    },
    hadInvalidFields:
      !isValidDensity(obj.density) || !isValidFontSize(obj.fontSize)
  };
};

export interface LoadPreferencesResult {
  preferences: AppPreferences;
  error: string | null;
  hadInvalidData: boolean;
}

export const loadPreferences = (
  storage?: PreferencesStorageReader | null
): LoadPreferencesResult => {
  const targetStorage =
    storage !== undefined
      ? storage
      : typeof localStorage !== 'undefined'
        ? localStorage
        : null;

  if (!targetStorage) {
    return {
      preferences: { ...DEFAULT_APP_PREFERENCES },
      error: null,
      hadInvalidData: false
    };
  }

  try {
    const raw = targetStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (!raw) {
      return {
        preferences: { ...DEFAULT_APP_PREFERENCES },
        error: null,
        hadInvalidData: false
      };
    }

    const parsed: unknown = JSON.parse(raw);
    const { preferences, hadInvalidFields } = sanitizePreferences(parsed);
    return {
      preferences,
      error: hadInvalidFields
        ? 'Nieprawidłowe wartości preferencji w pamięci przeglądarki — zastosowano bezpieczne wartości domyślne.'
        : null,
      hadInvalidData: hadInvalidFields
    };
  } catch {
    return {
      preferences: { ...DEFAULT_APP_PREFERENCES },
      error:
        'Błąd odczytu preferencji z pamięci przeglądarki — zastosowano bezpieczne wartości domyślne.',
      hadInvalidData: true
    };
  }
};

export const savePreferences = (
  storage: PreferencesStorageWriter | null | undefined,
  preferences: AppPreferences
): { success: boolean; preferences: AppPreferences; error: string | null } => {
  const { preferences: cleanPrefs } = sanitizePreferences(preferences);

  if (!storage) {
    return {
      success: false,
      preferences: cleanPrefs,
      error: 'Pamięć lokalna przeglądarki jest niedostępna; preferencje nie zostaną zapisane.'
    };
  }

  try {
    storage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(cleanPrefs));
    return { success: true, preferences: cleanPrefs, error: null };
  } catch {
    return {
      success: false,
      preferences: cleanPrefs,
      error: 'Nie udało się zapisać preferencji w pamięci localStorage.'
    };
  }
};

export const resetPreferences = (
  storage?: PreferencesStorageWriter | null
): { preferences: AppPreferences; success: boolean; error: string | null } => {
  const defaults = { ...DEFAULT_APP_PREFERENCES };
  const targetStorage =
    storage !== undefined
      ? storage
      : typeof localStorage !== 'undefined'
        ? localStorage
        : null;

  const saveRes = savePreferences(targetStorage, defaults);
  return {
    preferences: defaults,
    success: saveRes.success,
    error: saveRes.error
  };
};

export interface DocumentRootTarget {
  documentElement: {
    setAttribute: (name: string, value: string) => void;
    getAttribute?: (name: string) => string | null;
  };
}

export const applyPreferencesToDocument = (
  preferences: AppPreferences,
  targetDocument?: DocumentRootTarget | null
): AppPreferences => {
  const { preferences: cleanPrefs } = sanitizePreferences(preferences);
  const doc =
    targetDocument !== undefined
      ? targetDocument
      : typeof document !== 'undefined'
        ? document
        : null;

  if (doc?.documentElement) {
    doc.documentElement.setAttribute('data-density', cleanPrefs.density);
    doc.documentElement.setAttribute('data-font-size', cleanPrefs.fontSize);
  }

  return cleanPrefs;
};

export const initAppPreferences = (): AppPreferences => {
  const { preferences } = loadPreferences();
  return applyPreferencesToDocument(preferences);
};
