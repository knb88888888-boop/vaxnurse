export const THEME_STORAGE_KEY = 'vaxnurse_theme_v1';
export const THEME_CHANGE_EVENT = 'vaxnurse-theme-change';

export type UiThemeId =
  | 'surgical-daylight'
  | 'nordic-alabaster'
  | 'aether-obsidian'
  | 'quantum-indigo';

export type UiThemePreference = UiThemeId | 'auto';
export type UiColorScheme = 'light' | 'dark';

export const DEFAULT_THEME_PREFERENCE: UiThemePreference = 'surgical-daylight';

export interface ThemeDefinition {
  id: UiThemeId;
  name: string;
  shortName: string;
  badge: string;
  description: string;
  clinicalContext: string;
  colorScheme: UiColorScheme;
  metaThemeColor: string;
  swatches: {
    bg: string;
    surface: string;
    sidebar: string;
    accent: string;
    norm: string;
    text: string;
  };
}

export const THEME_DEFINITIONS: readonly ThemeDefinition[] = [
  {
    id: 'surgical-daylight',
    name: 'Surgical Daylight',
    shortName: 'Daylight',
    badge: 'Jasny • Domyślny',
    description:
      'Sterylna powierzchnia kliniczna o wysokim kontraście ze spójnym, jasnym panelem nawigacji i szafirowym akcentem.',
    clinicalContext: 'Praktyka dzienna i stanowisko gabinetowe',
    colorScheme: 'light',
    metaThemeColor: '#f6f9fd',
    swatches: {
      bg: '#eff4f9',
      surface: '#ffffff',
      sidebar: '#eaf2fa',
      accent: '#0369a1',
      norm: '#059669',
      text: '#0f172a'
    }
  },
  {
    id: 'nordic-alabaster',
    name: 'Nordic Alabaster',
    shortName: 'Alabaster',
    badge: 'Jasny • Miękki',
    description:
      'Ciepła, nierażąca oczy paleta alabastrowo-eukaliptusowa zaprojektowana pod długie czytanie ChPL i PSO.',
    clinicalContext: 'Przegląd dokumentacji i długie czytanie',
    colorScheme: 'light',
    metaThemeColor: '#0f766e',
    swatches: {
      bg: '#eff4f1',
      surface: '#ffffff',
      sidebar: '#e5efe9',
      accent: '#0f766e',
      norm: '#047857',
      text: '#0a1f19'
    }
  },
  {
    id: 'aether-obsidian',
    name: 'Aether Obsidian',
    shortName: 'Obsidian',
    badge: 'Ciemny • Flagship',
    description:
      'Głęboki tryb ciemny inspirowany konsolami OIT — matowy obsydian, kliniczny szmaragd i chłodny cyjan.',
    clinicalContext: 'Oświetlenie wieczorne i redukcja olśnienia',
    colorScheme: 'dark',
    metaThemeColor: '#070d19',
    swatches: {
      bg: '#070d19',
      surface: '#0f1829',
      sidebar: '#0b1322',
      accent: '#38bdf8',
      norm: '#10b981',
      text: '#f8fafc'
    }
  },
  {
    id: 'quantum-indigo',
    name: 'Quantum Indigo',
    shortName: 'Indigo',
    badge: 'Ciemny • MedTech',
    description:
      'Kosmiczny granat dyżurowy z elektrycznym indygo, miękkim kontrastem i wyraźną hierarchią danych.',
    clinicalContext: 'Praca wieczorna i nowoczesne stanowisko MedTech',
    colorScheme: 'dark',
    metaThemeColor: '#080b1f',
    swatches: {
      bg: '#080b1f',
      surface: '#111738',
      sidebar: '#0d122e',
      accent: '#818cf8',
      norm: '#34d399',
      text: '#f8fafc'
    }
  }
];

export const THEME_BY_ID: Record<UiThemeId, ThemeDefinition> = {
  'surgical-daylight': THEME_DEFINITIONS[0],
  'nordic-alabaster': THEME_DEFINITIONS[1],
  'aether-obsidian': THEME_DEFINITIONS[2],
  'quantum-indigo': THEME_DEFINITIONS[3]
};

export interface ThemeStorageReader {
  getItem: (key: string) => string | null;
}

export interface ThemeStorageWriter {
  setItem: (key: string, value: string) => void;
}

const ALLOWED_THEME_IDS = new Set<string>([
  'surgical-daylight',
  'nordic-alabaster',
  'aether-obsidian',
  'quantum-indigo'
]);

export const isValidThemeId = (val: unknown): val is UiThemeId =>
  typeof val === 'string' && ALLOWED_THEME_IDS.has(val);

export const isValidThemePreference = (val: unknown): val is UiThemePreference =>
  val === 'auto' || isValidThemeId(val);

export const sanitizeThemePreference = (
  raw: unknown
): { preference: UiThemePreference; wasInvalid: boolean } => {
  if (isValidThemePreference(raw)) {
    return { preference: raw, wasInvalid: false };
  }
  return { preference: DEFAULT_THEME_PREFERENCE, wasInvalid: true };
};

export const getSystemPrefersDark = (): boolean => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

export const resolveTheme = (
  preference: UiThemePreference,
  prefersDark: boolean = getSystemPrefersDark()
): UiThemeId => {
  if (preference === 'auto') {
    return prefersDark ? 'aether-obsidian' : 'surgical-daylight';
  }
  return preference;
};

export const getThemeColorScheme = (themeId: UiThemeId): UiColorScheme =>
  THEME_BY_ID[themeId].colorScheme;

export const loadThemePreference = (
  storage?: ThemeStorageReader | null
): UiThemePreference => {
  const targetStorage =
    storage !== undefined
      ? storage
      : typeof localStorage !== 'undefined'
        ? localStorage
        : null;

  if (!targetStorage) {
    return DEFAULT_THEME_PREFERENCE;
  }

  try {
    const raw = targetStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_THEME_PREFERENCE;
    }
    return sanitizeThemePreference(raw.trim()).preference;
  } catch {
    return DEFAULT_THEME_PREFERENCE;
  }
};

export const saveThemePreference = (
  storage: ThemeStorageWriter | null | undefined,
  preference: UiThemePreference
): { success: boolean; preference: UiThemePreference; error: string | null } => {
  const { preference: cleanPref } = sanitizeThemePreference(preference);

  if (!storage) {
    return {
      success: false,
      preference: cleanPref,
      error: 'Pamięć lokalna przeglądarki jest niedostępna; motyw nie zostanie zapisany.'
    };
  }

  try {
    storage.setItem(THEME_STORAGE_KEY, cleanPref);
    return { success: true, preference: cleanPref, error: null };
  } catch {
    return {
      success: false,
      preference: cleanPref,
      error: 'Nie udało się zapisać wybranej szaty graficznej w pamięci przeglądarki.'
    };
  }
};

export interface ThemeDocumentTarget {
  documentElement: {
    setAttribute: (name: string, value: string) => void;
    style?: { colorScheme?: string };
  };
  querySelector?: (selector: string) => { setAttribute: (name: string, value: string) => void } | null;
}

export const applyThemeToDocument = (
  preference: UiThemePreference,
  targetDocument?: ThemeDocumentTarget | null,
  prefersDark?: boolean
): { preference: UiThemePreference; resolvedTheme: UiThemeId; colorScheme: UiColorScheme } => {
  const { preference: cleanPref } = sanitizeThemePreference(preference);
  const resolvedTheme = resolveTheme(cleanPref, prefersDark);
  const themeDef = THEME_BY_ID[resolvedTheme];
  const doc =
    targetDocument !== undefined
      ? targetDocument
      : typeof document !== 'undefined'
        ? document
        : null;

  if (doc?.documentElement) {
    doc.documentElement.setAttribute('data-theme', resolvedTheme);
    doc.documentElement.setAttribute('data-theme-preference', cleanPref);
    doc.documentElement.setAttribute('data-color-scheme', themeDef.colorScheme);
    if (doc.documentElement.style) {
      doc.documentElement.style.colorScheme = themeDef.colorScheme;
    }
    const metaTheme = doc.querySelector?.('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', themeDef.metaThemeColor);
    }
  }

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    try {
      window.dispatchEvent(
        new CustomEvent(THEME_CHANGE_EVENT, {
          detail: { preference: cleanPref, resolvedTheme, colorScheme: themeDef.colorScheme }
        })
      );
    } catch {
      // Ignore in stripped environments
    }
  }

  return {
    preference: cleanPref,
    resolvedTheme,
    colorScheme: themeDef.colorScheme
  };
};

export const setAndPersistThemePreference = (
  preference: UiThemePreference
): { preference: UiThemePreference; resolvedTheme: UiThemeId; colorScheme: UiColorScheme } => {
  const storage = typeof localStorage !== 'undefined' ? localStorage : null;
  saveThemePreference(storage, preference);
  return applyThemeToDocument(preference);
};

export const resetThemePreference = (
  storage?: ThemeStorageWriter | null
): { preference: UiThemePreference; resolvedTheme: UiThemeId; colorScheme: UiColorScheme } => {
  const targetStorage =
    storage !== undefined
      ? storage
      : typeof localStorage !== 'undefined'
        ? localStorage
        : null;
  saveThemePreference(targetStorage, DEFAULT_THEME_PREFERENCE);
  return applyThemeToDocument(DEFAULT_THEME_PREFERENCE);
};

export const initThemePreference = (): {
  preference: UiThemePreference;
  resolvedTheme: UiThemeId;
  colorScheme: UiColorScheme;
} => {
  const pref = loadThemePreference();
  return applyThemeToDocument(pref);
};

export const subscribeToThemeChange = (
  onChange: (detail: {
    preference: UiThemePreference;
    resolvedTheme: UiThemeId;
    colorScheme: UiColorScheme;
  }) => void
): (() => void) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleCustomEvent = (event: Event) => {
    const custom = event as CustomEvent<{
      preference: UiThemePreference;
      resolvedTheme: UiThemeId;
      colorScheme: UiColorScheme;
    }>;
    if (custom.detail?.resolvedTheme) {
      onChange(custom.detail);
    }
  };

  const handleStorageEvent = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY) {
      const next = applyThemeToDocument(loadThemePreference());
      onChange(next);
    }
  };

  let mediaQuery: MediaQueryList | null = null;
  const handleMediaChange = () => {
    const pref = loadThemePreference();
    if (pref === 'auto') {
      const next = applyThemeToDocument('auto');
      onChange(next);
    }
  };

  if (typeof window.matchMedia === 'function') {
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleMediaChange);
    }
  }

  window.addEventListener(THEME_CHANGE_EVENT, handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);

  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
    if (mediaQuery && typeof mediaQuery.removeEventListener === 'function') {
      mediaQuery.removeEventListener('change', handleMediaChange);
    }
  };
};
