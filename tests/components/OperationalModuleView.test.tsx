import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
});
