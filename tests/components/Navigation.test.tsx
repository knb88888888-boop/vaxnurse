import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from '../../src/components/layout/Header';
import { Sidebar } from '../../src/components/layout/Sidebar';
import { DashboardView } from '../../src/components/dashboard/DashboardView';
import { ModulePlaceholder } from '../../src/components/modules/ModulePlaceholder';
import { APP_MODULES, QUICK_ACCESS_ITEMS } from '../../src/data/navigationData';
import type { ModuleDefinition, ModuleId } from '../../src/types/navigation';

const getModule = (id: ModuleId): ModuleDefinition => {
  const found = APP_MODULES.find((m) => m.id === id);
  if (!found) {
    throw new Error(`Brak modułu ${id} w APP_MODULES`);
  }
  return found;
};

describe('Globalna nawigacja: Header, Sidebar, DashboardView i ModulePlaceholder', () => {
  it('obsługuje globalne wyszukiwanie na pulpicie, zamykanie klawiszem Escape oraz nawigację z overlayu mobilnego', async () => {
    const user = userEvent.setup();
    let searchQuery = '';
    const onSearchChange = vi.fn((next: string) => {
      searchQuery = next;
    });
    const onSelectResult = vi.fn();
    const onNavigate = vi.fn();

    const { rerender } = render(
      <Header
        currentModule={getModule('dashboard')}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        onOpenMobileMenu={vi.fn()}
        isOpenMobileMenu={false}
        onNavigateToModule={onNavigate}
        onSelectSearchResult={onSelectResult}
      />
    );

    const desktopInput = screen.getByRole('textbox', {
      name: /Szukaj modułów i sekcji VaxNurse/i,
    });
    await user.click(desktopInput);
    await user.type(desktopInput, 'ChPL');

    // Przerenderuj z aktualnym stanem searchQuery tak jak robi to App.tsx
    rerender(
      <Header
        currentModule={getModule('dashboard')}
        searchQuery="ChPL"
        onSearchChange={onSearchChange}
        onOpenMobileMenu={vi.fn()}
        isOpenMobileMenu={false}
        onNavigateToModule={onNavigate}
        onSelectSearchResult={onSelectResult}
      />
    );

    const dropdown = screen.getByRole('region', {
      name: /Wyniki wyszukiwania modułów i sekcji VaxNurse/i,
    });
    expect(within(dropdown).getByText(/nie zawiera danych pacjentów/i)).toBeInTheDocument();

    const resultButtons = within(dropdown).getAllByRole('button');
    expect(resultButtons.length).toBeGreaterThan(0);

    // Klawisz Escape zamyka dropdown na desktopie
    desktopInput.focus();
    await user.keyboard('{Escape}');
    expect(
      screen.queryByRole('region', {
        name: /Wyniki wyszukiwania modułów i sekcji VaxNurse/i,
      })
    ).not.toBeInTheDocument();

    // Mobilna wyszukiwarka
    await user.click(screen.getByRole('button', { name: /Otwórz wyszukiwarkę modułów/i }));
    const mobileOverlay = screen.getByRole('region', {
      name: /Mobilna wyszukiwarka modułów i sekcji VaxNurse/i,
    });
    expect(mobileOverlay).toBeInTheDocument();

    await user.click(within(mobileOverlay).getByRole('button', { name: /Zamknij panel wyszukiwania/i }));
    expect(
      screen.queryByRole('region', {
        name: /Mobilna wyszukiwarka modułów i sekcji VaxNurse/i,
      })
    ).not.toBeInTheDocument();

    // Skrót w nagłówku do modułu Sytuacje szczególne
    await user.click(screen.getByRole('button', { name: /Sytuacje szczególne/i }));
    expect(onNavigate).toHaveBeenCalledWith('special-situations');
  });

  it('Sidebar renderuje grupy, zwijanie paska oraz oznaczenia modułów', async () => {
    const user = userEvent.setup();
    const onSelectModule = vi.fn();
    const onToggleCollapse = vi.fn();

    const { rerender } = render(
      <Sidebar
        modules={APP_MODULES}
        activeModule="dashboard"
        onSelectModule={onSelectModule}
        isOpenMobile={false}
        onCloseMobile={vi.fn()}
        isCollapsed={false}
        onToggleCollapse={onToggleCollapse}
      />
    );

    expect(screen.getByRole('button', { name: 'Pulpit' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: /Baza preparatów/i })).toBeInTheDocument();
    expect(screen.queryAllByText(/W przygotowaniu/i).length).toBe(0);

    await user.click(screen.getByRole('button', { name: /Baza preparatów/i }));
    expect(onSelectModule).toHaveBeenCalledWith('vaccines-database');

    await user.click(screen.getByRole('button', { name: /Zwiń pasek boczny/i }));
    expect(onToggleCollapse).toHaveBeenCalledTimes(1);

    rerender(
      <Sidebar
        modules={APP_MODULES}
        activeModule="vaccines-database"
        onSelectModule={onSelectModule}
        isOpenMobile={false}
        onCloseMobile={vi.fn()}
        isCollapsed={true}
        onToggleCollapse={onToggleCollapse}
      />
    );
    expect(screen.getByRole('button', { name: /Rozwiń pasek boczny/i })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('DashboardView i ModulePlaceholder zachowują bezpieczne statusy modułów przyszłych', async () => {
    const user = userEvent.setup();
    const onSelectModule = vi.fn();

    const { unmount } = render(
      <DashboardView
        modules={APP_MODULES}
        quickAccessItems={QUICK_ACCESS_ITEMS}
        recentVisits={[]}
        searchQuery=""
        onSearchChange={vi.fn()}
        onSelectModule={onSelectModule}
      />
    );

    expect(screen.getByText(/Narzędzie referencyjne pielęgniarki • Tryb lokalny/i)).toBeInTheDocument();
    unmount();

    const calendarModule = getModule('vaccination-calendar');
    const onBack = vi.fn();
    render(
      <ModulePlaceholder
        module={calendarModule}
        onBackToDashboard={onBack}
        onNavigateToModule={onSelectModule}
      />
    );

    expect(screen.getByText(/Moduł nieaktywny • W przygotowaniu/i)).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: /Powrót do Pulpitu/i })[0]);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('zachowuje poprawną hierarchię nagłówków h1 -> h2 bez przeskoku h1 -> h3 w ModulePlaceholder', () => {
    const onBack = vi.fn();
    const onNavigate = vi.fn();
    const fallbackModule = APP_MODULES.find(
      (m) =>
        !m.isCore &&
        m.id !== 'vaccination-calendar' &&
        m.id !== 'special-situations' &&
        m.id !== 'cold-chain'
    );
    const idsToCheck: ModuleId[] = [
      'vaccination-calendar',
      'special-situations',
      'cold-chain',
      ...(fallbackModule ? [fallbackModule.id] : [])
    ];

    for (const modId of idsToCheck) {
      const { container, unmount } = render(
        <ModulePlaceholder
          module={getModule(modId)}
          onBackToDashboard={onBack}
          onNavigateToModule={onNavigate}
        />
      );
      const headings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6')).map((el) =>
        Number(el.tagName.slice(1))
      );
      expect(headings[0]).toBe(1);
      for (let i = 1; i < headings.length; i++) {
        expect(headings[i] - headings[i - 1]).toBeLessThanOrEqual(1);
      }
      unmount();
    }
  });
});
