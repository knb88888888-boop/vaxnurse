import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsView } from '../../src/components/settings/SettingsView';
import { APP_MODULES } from '../../src/data/navigationData';
import { PREFERENCES_STORAGE_KEY } from '../../src/utils/preferences';
import type { ModuleDefinition } from '../../src/types/navigation';

const getSettingsModule = (): ModuleDefinition => {
  const found = APP_MODULES.find((m) => m.id === 'settings');
  if (!found) {
    throw new Error('Brak definicji modułu settings w APP_MODULES');
  }
  return found;
};

describe('SettingsView — preferencje ergonomii i localStorage', () => {
  it('renderuje domyślne preferencje (comfortable / normal) i przełącza tryby wraz z atrybutami HTML', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();

    render(<SettingsView module={getSettingsModule()} onBackToDashboard={onBack} />);

    const comfortableBtn = screen.getByRole('button', { name: /Komfortowa \(standardowa\)/i });
    const compactBtn = screen.getByRole('button', { name: /Zwięzła \(dla mniejszych ekranów\)/i });
    const normalFontBtn = screen.getByRole('button', { name: /^Standardowy$/i });
    const largeFontBtn = screen.getByRole('button', { name: /Wyraźny \/ powiększony/i });

    expect(comfortableBtn).toHaveAttribute('aria-pressed', 'true');
    expect(compactBtn).toHaveAttribute('aria-pressed', 'false');
    expect(normalFontBtn).toHaveAttribute('aria-pressed', 'true');
    expect(largeFontBtn).toHaveAttribute('aria-pressed', 'false');

    await user.click(compactBtn);

    expect(compactBtn).toHaveAttribute('aria-pressed', 'true');
    expect(document.documentElement.dataset.density).toBe('compact');
    expect(screen.getByRole('status')).toHaveTextContent(/gęstość zwięzła/i);

    await user.click(largeFontBtn);

    expect(largeFontBtn).toHaveAttribute('aria-pressed', 'true');
    expect(document.documentElement.dataset.fontSize).toBe('large');

    const storedRaw = localStorage.getItem(PREFERENCES_STORAGE_KEY);
    expect(storedRaw).not.toBeNull();
    expect(JSON.parse(storedRaw ?? '{}')).toEqual({
      density: 'compact',
      fontSize: 'large',
    });
  });

  it('utrzymuje zapisane preferencje po ponownym montowaniu i przywraca domyślne po kliknięciu resetu', async () => {
    const user = userEvent.setup();
    localStorage.setItem(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify({ density: 'compact', fontSize: 'large' })
    );

    const { unmount } = render(
      <SettingsView module={getSettingsModule()} onBackToDashboard={vi.fn()} />
    );

    expect(
      screen.getByRole('button', { name: /Zwięzła \(dla mniejszych ekranów\)/i })
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('button', { name: /Wyraźny \/ powiększony/i })
    ).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: /Przywróć domyślne preferencje/i }));

    expect(document.documentElement.dataset.density).toBe('comfortable');
    expect(document.documentElement.dataset.fontSize).toBe('normal');
    expect(JSON.parse(localStorage.getItem(PREFERENCES_STORAGE_KEY) ?? '{}')).toEqual({
      density: 'comfortable',
      fontSize: 'normal',
    });
    expect(screen.getByRole('status')).toHaveTextContent(/Przywrócono domyślne preferencje/i);

    unmount();

    render(<SettingsView module={getSettingsModule()} onBackToDashboard={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: /Komfortowa \(standardowa\)/i })
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('obsługuje bezpiecznie błąd zapisu localStorage (QuotaExceededError) bez wywalenia komponentu', async () => {
    const user = userEvent.setup();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });

    render(<SettingsView module={getSettingsModule()} onBackToDashboard={vi.fn()} />);

    await user.click(
      screen.getByRole('button', { name: /Zwięzła \(dla mniejszych ekranów\)/i })
    );

    expect(screen.getByRole('status')).toHaveTextContent(
      /Nie udało się zapisać preferencji w pamięci localStorage/i
    );
  });
});
