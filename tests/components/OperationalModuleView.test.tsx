import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OperationalModuleView } from '../../src/components/modules/OperationalModuleView';
import { APP_MODULES } from '../../src/data/navigationData';
import type { ModuleId } from '../../src/types/navigation';

const getMod = (id: ModuleId) => {
  const found = APP_MODULES.find((m) => m.id === id);
  if (!found) throw new Error(`Missing module ${id}`);
  return found;
};

describe('OperationalModuleView — aktywne moduły operacyjne VaxNurse', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('Kalendarz szczepień PSO 2027 wyświetla wszystkie 12 etapów wiekowych i filtruje pozycje', async () => {
    const user = userEvent.setup();
    render(
      <OperationalModuleView
        module={getMod('vaccination-calendar')}
        onBackToDashboard={vi.fn()}
        onNavigateToModule={vi.fn()}
      />
    );
    expect(screen.getByRole('heading', { level: 1, name: /Kalendarz szczepień/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Okres noworodkowy/i })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText(/Rodzaj szczepienia/i), 'zalecane');
    expect(screen.getByText(/Wyświetlono \d+ pozycji PSO/i)).toBeInTheDocument();
  });

  it('Kalkulator szczepień wylicza najwcześniejszy termin kolejnej dawki i wiek', async () => {
    const user = userEvent.setup();
    render(
      <OperationalModuleView
        module={getMod('vaccination-calculator')}
        onBackToDashboard={vi.fn()}
        onNavigateToModule={vi.fn()}
      />
    );
    fireEvent.change(screen.getByLabelText(/Data ostatniej dawki/i), { target: { value: '2026-10-01' } });
    fireEvent.change(screen.getByLabelText(/Minimalny odstęp/i), { target: { value: '28' } });
    await user.click(screen.getByRole('button', { name: /Oblicz termin/i }));
    expect(screen.getByTestId('ops-calc-result')).toHaveTextContent('29.10.2026');
  });

  it('Łańcuch chłodniczy rejestruje odczyt manualny i blokuje przekroczenie bez opisu działań', async () => {
    const user = userEvent.setup();
    render(
      <OperationalModuleView
        module={getMod('cold-chain')}
        onBackToDashboard={vi.fn()}
        onNavigateToModule={vi.fn()}
      />
    );
    fireEvent.change(screen.getByLabelText(/Urządzenie/i), { target: { value: 'Chłodziarka 1' } });
    fireEvent.change(screen.getByLabelText(/Temperatura bieżąca/i), { target: { value: '5.2' } });
    await user.click(screen.getByRole('button', { name: /Zapisz odczyt/i }));
    expect(screen.getByTestId('ops-cold-table')).toHaveTextContent('5.2°C');
  });

  it('Procedury i Sytuacje szczególne pozwalają prowadzić lokalną checklistę i inwentarz zestawu', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <OperationalModuleView
        module={getMod('procedures-checklists')}
        onBackToDashboard={vi.fn()}
        onNavigateToModule={vi.fn()}
      />
    );
    await user.type(screen.getByLabelText(/Nowy punkt checklisty/i), 'Sprawdzić temperaturę');
    await user.click(screen.getByRole('button', { name: /Dodaj/i }));
    expect(screen.getByTestId('ops-local-checklist')).toHaveTextContent('Sprawdzić temperaturę');

    rerender(
      <OperationalModuleView
        module={getMod('special-situations')}
        onBackToDashboard={vi.fn()}
        onNavigateToModule={vi.fn()}
      />
    );
    expect(screen.getByText(/nie zawiera algorytmów leczenia/i)).toBeInTheDocument();
    await user.type(screen.getByLabelText(/Nazwa pozycji/i), 'Pozycja testowa');
    fireEvent.change(screen.getByLabelText(/Data ważności/i), { target: { value: '2027-06-01' } });
    await user.click(screen.getByRole('button', { name: /Dodaj pozycję/i }));
    expect(screen.getByTestId('ops-kit-table')).toHaveTextContent('Pozycja testowa');
  });

  it('Kalendarz szczepień PSO 2027: nawigacja po zakładkach (Część I-II, V, III.M, IV, VI)', async () => {
    const user = userEvent.setup();
    render(
      <OperationalModuleView
        module={getMod('vaccination-calendar')}
        onBackToDashboard={vi.fn()}
        onNavigateToModule={vi.fn()}
      />
    );

    // Przełączenie na Część V (Wyrównawcze)
    await user.click(screen.getByRole('tab', { name: /Szczepienia wyrównawcze/i }));
    expect(screen.getByRole('heading', { name: /Część V PSO 2027 — Szczepienia wyrównawcze/i })).toBeInTheDocument();
    expect(screen.getByText(/Punkt 1:/i)).toBeInTheDocument();
    expect(screen.getByText(/Punkt 12:/i)).toBeInTheDocument();

    // Przełączenie na Część III.M (Warianty skojarzone)
    await user.click(screen.getByRole('tab', { name: /Warianty 5w1 i 6w1/i }));
    expect(screen.getByRole('heading', { name: /Część III.M PSO 2027/i })).toBeInTheDocument();

    // Przełączenie na Część IV (Zasady ogólne)
    await user.click(screen.getByRole('tab', { name: /7 zasad ogólnych/i }));
    expect(screen.getByRole('heading', { name: /Część IV PSO 2027/i })).toBeInTheDocument();

    // Przełączenie na Część VI (Kwalifikacje)
    await user.click(screen.getByRole('tab', { name: /Uprawnienia personelu/i }));
    expect(screen.getByRole('heading', { name: /Część VI PSO 2027/i })).toBeInTheDocument();
  });

  it('Łańcuch chłodniczy: matryca 10 preparatów ChPL 6.4 oraz profil indywidualny', async () => {
    const user = userEvent.setup();
    render(
      <OperationalModuleView
        module={getMod('cold-chain')}
        onBackToDashboard={vi.fn()}
        onNavigateToModule={vi.fn()}
      />
    );

    // Matryca warunków przechowywania
    expect(screen.getByTestId('ops-storage-matrix-table')).toBeInTheDocument();
    expect(screen.getByText(/Infanrix hexa/i)).toBeInTheDocument();
    expect(screen.getByText(/Spikevax XFG/i)).toBeInTheDocument();

    // Wybór profilu z zakresem indywidualnym oraz weryfikacja poprawnego formatowania temperatur ujemnych (bez "+-")
    const profileSelect = screen.getByLabelText(/Profil temperaturowy/i);
    expect(profileSelect.textContent).not.toContain('+-');
    expect(profileSelect.textContent).toContain('(-50°C do -15°C)');
    await user.selectOptions(profileSelect, 'custom_chpl');
    expect(screen.getByLabelText(/Własny min/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Własny max/i)).toBeInTheDocument();
  });

  it('Sytuacje szczególne: tabela 26 pozycji Dz.U. 2026 poz. 429 i zasilenie inwentarza dla wybranej kategorii', async () => {
    const user = userEvent.setup();
    render(
      <OperationalModuleView
        module={getMod('special-situations')}
        onBackToDashboard={vi.fn()}
        onNavigateToModule={vi.fn()}
      />
    );

    // Tabela 26 pozycji regulacyjnych
    const annexTable = screen.getByTestId('ops-emergency-annex-table');
    expect(annexTable).toBeInTheDocument();
    expect(within(annexTable).getByText('Adrenalinum')).toBeInTheDocument();
    expect(within(annexTable).getByText('Noradrenalinum')).toBeInTheDocument();
    expect(within(annexTable).getByText('Oxygenium')).toBeInTheDocument();

    // Wczytanie wymaganych pozycji do inwentarza dla domyślnej kategorii ambulatoryjnej (15 pozycji w tym poz. 17 i 25 NaCl 0,9%)
    const loadBtn = screen.getByRole('button', { name: /Wczytaj pozycje wymagane/i });
    await user.click(loadBtn);

    // Sprawdzenie, że inwentarz został zasilony lekami i odróżnia poz. 17 oraz poz. 25 NaCl 0,9 %
    const kitTable = screen.getByTestId('ops-kit-table');
    expect(kitTable).toHaveTextContent(/Adrenalinum \(1 mg\/ml/i);
    expect(kitTable).toHaveTextContent(/Natrii chloridum 0,9 % \(rozpuszczalnik/i);
    expect(kitTable).toHaveTextContent(/Natrii chloridum 0,9 % \(roztwór do infuzji/i);
  });
});
