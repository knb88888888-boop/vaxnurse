import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { AboutProjectView } from '../../src/components/about/AboutProjectView';
import { Layout } from '../../src/components/layout/Layout';
import { APP_MODULES } from '../../src/data/navigationData';
import { searchVaxNurseNavigation } from '../../src/utils/globalSearch';
import type { ModuleDefinition } from '../../src/types/navigation';

const getAboutModule = (): ModuleDefinition => {
  const found = APP_MODULES.find(m => m.id === 'about-project');
  if (!found) {
    throw new Error('Brak definicji modułu about-project w APP_MODULES');
  }
  return found;
};

describe('AboutProjectView — O projekcie i autorach', () => {
  it('renderuje kompletną prezentację projektu, role P.M. i M.M. oraz wszystkie sekcje bez zmyślonych tytułów', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    const onNavigate = vi.fn();

    const { container } = render(
      <AboutProjectView
        module={getAboutModule()}
        onBackToDashboard={onBack}
        onNavigateToModule={onNavigate}
      />
    );

    // Pojedyncze H1 i motyw przewodni
    const h1 = screen.getByRole('heading', { level: 1, name: /O projekcie i autorach/i });
    expect(h1).toBeInTheDocument();
    expect(
      screen.getByText(/Wiedza, odpowiedzialność i troska — z szacunku do codziennej pracy pielęgniarek i pielęgniarzy/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Za każdą procedurą stoi człowiek, wiedza i odpowiedzialność/i)
    ).toBeInTheDocument();

    // Autor i inspiracja (inicjały, bez fikcyjnych stopni/tytułów)
    expect(screen.getByRole('heading', { level: 3, name: /^P\.M\.$/ })).toBeInTheDocument();
    expect(screen.getByText(/Inicjator i twórca projektu VaxNurse/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: /^M\.M\.$/ })).toBeInTheDocument();
    expect(screen.getByText(/Pielęgniarka, ważna inspiracja projektu/i)).toBeInTheDocument();
    expect(
      screen.getByText(/nie pełni w projekcie roli formalnej współautorki merytorycznej/i)
    ).toBeInTheDocument();

    // Sekcje merytoryczne
    expect(screen.getByRole('heading', { level: 2, name: /O projekcie \(Misja projektu\)/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Dlaczego powstał\?/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Dla kogo powstał VaxNurse\?/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Jak działa\?/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Zawsze bezpłatnie\. Bez reklam\./i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Wartości projektu/i })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: /Technologia, działanie lokalne i prywatność/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Ważne zastrzeżenie/i })).toBeInTheDocument();

    // Rzeczywiste ujawnienie prywatności bez nadmiarowych deklaracji
    expect(container.textContent).toMatch(/localStorage/i);
    expect(container.textContent).toMatch(/Brak formularzy pacjentów/i);
    expect(container.textContent).not.toMatch(/\bszyfrowan/i);

    // Nawigacja wstecz i skróty do modułów w diagramie przepływu
    await user.click(screen.getByRole('button', { name: /Powrót do pulpitu/i }));
    expect(onBack).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /Łańcuch chłodniczy/i }));
    expect(onNavigate).toHaveBeenCalledWith('cold-chain');

    await user.click(screen.getByRole('button', { name: /Baza preparatów/i }));
    expect(onNavigate).toHaveBeenCalledWith('vaccines-database');

    // Audyt WCAG 2.2 AA w jsdom
    const axeResult = await axe.run(container, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] }
    });
    expect(axeResult.violations).toEqual([]);
  });

  it('udostępnia moduł w menu systemowym, stopce aplikacji oraz globalnej wyszukiwarce', async () => {
    const user = userEvent.setup();
    const onSelectModule = vi.fn();

    render(
      <Layout
        modules={APP_MODULES}
        activeModuleId="dashboard"
        onSelectModule={onSelectModule}
        searchQuery=""
        onSearchChange={vi.fn()}
        onSelectSearchResult={vi.fn()}
      >
        <div>Zawartość pulpitu</div>
      </Layout>
    );

    // Sidebar zawiera zakładkę "O projekcie" w grupie System
    const sidebarNav = screen.getByRole('navigation', { name: /Główne menu aplikacji/i });
    const sidebarBtn = Array.from(sidebarNav.querySelectorAll('button')).find(btn =>
      btn.textContent?.includes('O projekcie')
    );
    expect(sidebarBtn).toBeTruthy();
    if (sidebarBtn) {
      await user.click(sidebarBtn);
      expect(onSelectModule).toHaveBeenCalledWith('about-project');
    }

    // Stopka aplikacji (contentinfo) zawiera przycisk "O projekcie i autorach"
    const footer = screen.getByRole('contentinfo');
    const footerAboutBtn = Array.from(footer.querySelectorAll('button')).find(btn =>
      btn.textContent?.includes('O projekcie i autorach')
    );
    expect(footerAboutBtn).toBeTruthy();
    if (footerAboutBtn) {
      await user.click(footerAboutBtn);
      expect(onSelectModule).toHaveBeenCalledWith('about-project');
    }

    // Globalna wyszukiwarka znajduje moduł about-project
    const searchByTitle = searchVaxNurseNavigation('O projekcie');
    expect(searchByTitle.some(r => r.targetModule === 'about-project')).toBe(true);

    const searchByAuthor = searchVaxNurseNavigation('P.M.');
    expect(searchByAuthor.some(r => r.targetModule === 'about-project')).toBe(true);
  });
});
