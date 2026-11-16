import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_THEME_PREFERENCE,
  THEME_DEFINITIONS,
  THEME_STORAGE_KEY,
  applyThemeToDocument,
  loadThemePreference,
  resetThemePreference,
  resolveTheme,
  sanitizeThemePreference,
  saveThemePreference
} from '../../src/utils/theme';

describe('Theme Engine — wielotematyczny system szaty graficznej VaxNurse', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-theme-preference');
    document.documentElement.removeAttribute('data-color-scheme');
  });

  it('domyślnie uruchamia bezpieczny motyw Surgical Daylight', () => {
    expect(loadThemePreference()).toBe('surgical-daylight');
    expect(resolveTheme('surgical-daylight', true)).toBe('surgical-daylight');
    expect(resolveTheme('nordic-alabaster', true)).toBe('nordic-alabaster');
    expect(resolveTheme('aether-obsidian', false)).toBe('aether-obsidian');
    expect(resolveTheme('quantum-indigo', false)).toBe('quantum-indigo');
  });

  it('prawidłowo rozwiązuje tryb auto na podstawie preferencji systemu (jasny vs ciemny)', () => {
    expect(resolveTheme('auto', false)).toBe('surgical-daylight');
    expect(resolveTheme('auto', true)).toBe('aether-obsidian');
  });

  it('sanetyzuje niepoprawne lub uszkodzone wartości z localStorage do bezpiecznego fallbacku', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'unknown-hacker-theme');
    expect(loadThemePreference()).toBe(DEFAULT_THEME_PREFERENCE);
    expect(sanitizeThemePreference(null)).toEqual({
      preference: DEFAULT_THEME_PREFERENCE,
      wasInvalid: true
    });
  });

  it('zapisuje i odtwarza wszystkie 5 trybów oraz nakłada atrybuty HTML data-theme i data-color-scheme', () => {
    for (const def of THEME_DEFINITIONS) {
      const saveResult = saveThemePreference(localStorage, def.id);
      expect(saveResult.success).toBe(true);
      expect(loadThemePreference()).toBe(def.id);

      const applied = applyThemeToDocument(def.id);
      expect(applied.resolvedTheme).toBe(def.id);
      expect(applied.colorScheme).toBe(def.colorScheme);
      expect(document.documentElement.getAttribute('data-theme')).toBe(def.id);
      expect(document.documentElement.getAttribute('data-theme-preference')).toBe(def.id);
      expect(document.documentElement.getAttribute('data-color-scheme')).toBe(def.colorScheme);
    }

    const autoDark = applyThemeToDocument('auto', undefined, true);
    expect(autoDark.preference).toBe('auto');
    expect(autoDark.resolvedTheme).toBe('aether-obsidian');
    expect(document.documentElement.getAttribute('data-theme-preference')).toBe('auto');
    expect(document.documentElement.getAttribute('data-color-scheme')).toBe('dark');

    const resetRes = resetThemePreference(localStorage);
    expect(resetRes.preference).toBe('surgical-daylight');
    expect(loadThemePreference()).toBe('surgical-daylight');
  });

  it('bezpiecznie obsługuje brak localStorage przy zapisie bez wyjątku', () => {
    const res = saveThemePreference(null, 'quantum-indigo');
    expect(res.success).toBe(false);
    expect(res.preference).toBe('quantum-indigo');
    expect(res.error).toBeTruthy();
  });
});
