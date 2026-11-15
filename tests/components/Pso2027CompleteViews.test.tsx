import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChildVaccinationsView } from '../../src/components/childVaccinations/ChildVaccinationsView';
import { OperationalModuleView } from '../../src/components/modules/OperationalModuleView';
import { APP_MODULES } from '../../src/data/navigationData';

const getMod = (id: string) => {
  const found = APP_MODULES.find((m) => m.id === id);
  if (!found) throw new Error(`Brak modułu ${id}`);
  return found;
};

describe('MASTER 15 — Integracja UI 7 części PSO 2027 w widokach VaxNurse', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('ChildVaccinationsView renderuje wszystkie nowe zakładki (Część I–VII + Kompletność) i przypisy str. 43/45', async () => {
    const user = userEvent.setup();
    render(
      <ChildVaccinationsView
        module={getMod('child-vaccinations')}
        onBackToDashboard={vi.fn()}
        onNavigateToModule={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('tab', { name: /Część I pełna/i }));
    expect(
      screen.getByRole('heading', { name: /I\.D — Wytyczne dotyczące swoistego zapobiegania wściekliźnie/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /^Część II \(/i }));
    expect(
      screen.getByRole('heading', { name: /II\.H — Inne formy immunoprofilaktyki: uodpornienie bierne przeciw RSV/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /Część III \(Uzupełniające/i }));
    expect(
      screen.getByRole('heading', { name: /III\.A\. Szczepienia dzieci urodzonych przedwcześnie/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /Ogólne zasady i wyjątki \(Część IV\)/i }));
    expect(screen.getByText(/Przepisy z ustaw i rozporządzeń odrębnych oraz dobra praktyka gabinetowa/i)).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /Uprawnienia personelu \(Część VI\)/i }));
    expect(screen.getByText(/Dosłowne przypisy pod tabelą Części VI PSO 2027/i)).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /Skrócone kalendarze \(Część VII\)/i }));
    expect(screen.getByText(/Nota audytowa dotycząca tabeli VII\.C/i)).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /Kompletność i wyszukiwarka PSO/i }));
    const searchInput = screen.getByLabelText(/Szukaj we wszystkich częściach PSO 2027/i);
    await user.type(searchInput, 'Półpaścowi');
    expect(
      screen.getByRole('heading', { level: 5, name: /\[VII\.C\].*SKRÓCONY KALENDARZ/i }),
    ).toBeInTheDocument();
  });

  it('AdultView zachowuje ścisłą izolację populacyjną (renderuje II.B–II.I + VII.C dorosłych bez sekcji II.A i II.H RSV niemowląt)', () => {
    render(
      <OperationalModuleView
        module={getMod('adult-vaccinations')}
        onBackToDashboard={vi.fn()}
        onNavigateToModule={vi.fn()}
      />,
    );

    const adultIibHeading = screen.getByRole('heading', {
      level: 2,
      name: /Część II\.B PSO 2027 — Szczepienia zalecane dorosłym/i,
    });
    expect(adultIibHeading).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: /Część VII\.C PSO 2027 — Skrócony kalendarz szczepień dorosłych/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/uodpornienie bierne przeciw RSV/i)).not.toBeInTheDocument();
    const iibRegion = adultIibHeading.closest('section')!;
    expect(within(iibRegion).getByText(/Półpaścowi/i)).toBeInTheDocument();
  });

  it('MASTER 16: poprawne zakresy stron I.B/II.F/II.G, brak syntetycznych Uwagi PSO oraz jawne rozdzielenie statusu ChPL', async () => {
    const user = userEvent.setup();
    render(
      <ChildVaccinationsView
        module={getMod('child-vaccinations')}
        onBackToDashboard={vi.fn()}
        onNavigateToModule={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('tab', { name: /Część I pełna/i }));
    expect(screen.getByRole('button', { name: /I\.B \(Grupy podwyższonego ryzyka, str\. 13–14\)/i })).toBeInTheDocument();
    expect(screen.queryByText(/str\. 12–15/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /^Część II \(/i }));
    expect(screen.getByRole('heading', { name: /II\.F — Szczepienia zalecane poekspozycyjne \(str\. 32–33\)/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /II\.G — Swoiste zapobieganie WZW typu B.*\(str\. 34\)/i })).toBeInTheDocument();
    expect(screen.queryByText(/Stosuje się zgodnie z ChPL preparatu pediatrycznego/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Stosuje się w schemacie 2-dawkowym zgodnie z ChPL/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/status PSO ≠ weryfikacja ChPL preparatu/i).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('tab', { name: /Kompletność i wyszukiwarka PSO/i }));
    expect(screen.getByText(/Rozdzielenie weryfikacji PSO 2027 i ChPL preparatów:/i)).toBeInTheDocument();
    expect(screen.getByText(/verified_full = 0/i)).toBeInTheDocument();
    expect(screen.getByText(/wymaga wyjaśnienia ChPL = 12/i)).toBeInTheDocument();
  });

  it('MASTER 17: Tabela VII.C w widoku renderuje notę wyjaśniającą w boksie ostrzegawczym oraz tooltip dla pustej komórki meningokoków', async () => {
    const user = userEvent.setup();
    render(
      <ChildVaccinationsView
        module={getMod('child-vaccinations')}
        onBackToDashboard={vi.fn()}
        onNavigateToModule={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('tab', { name: /Skrócone kalendarze \(Część VII\)/i }));

    // Weryfikacja boksu noty
    const noteBoxes = screen.getAllByRole('note');
    expect(noteBoxes.length).toBeGreaterThan(0);
    const menNote = noteBoxes.find((box) => box.textContent?.includes('część II.B PSO (str. 23–24)'));
    expect(menNote).toBeDefined();
    expect(menNote).toHaveTextContent(
      'Puste komórki w skróconym kalendarzu VII.C dla wieku 19–49 i 50–64 lata nie wykluczają zaleceń określonych w części II.B',
    );

    // Weryfikacja tooltipu / title dla c-men-empty oraz opisu sr-only nieoznaczającego braku wskazań
    const emptyMeningoCell = screen.getByTitle(
      /Pusta komórka w oficjalnym kalendarzu VII\.C \(str\. 48\)\. Wskazania dla grup ryzyka w wieku 19–64 lat określa Część II\.B/i,
    );
    expect(emptyMeningoCell).toBeInTheDocument();
    expect(emptyMeningoCell).toHaveTextContent(/Pusta komórka w oficjalnej tabeli/i);
  });

  it('MASTER 17 (AdultView): Moduł Szczepienia dorosłych również prezentuje pustą komórkę VII.C z notą o Części II.B bez dopisywania dawek', () => {
    render(
      <OperationalModuleView
        module={getMod('adult-vaccinations')}
        onBackToDashboard={vi.fn()}
        onNavigateToModule={vi.fn()}
      />,
    );

    const menNote = screen
      .getAllByRole('note')
      .find((box) => box.textContent?.includes('część II.B PSO (str. 23–24)'));
    expect(menNote).toBeDefined();
    expect(
      screen.getByTitle(
        /Pusta komórka w oficjalnym kalendarzu VII\.C \(str\. 48\)\. Wskazania dla grup ryzyka w wieku 19–64 lat określa Część II\.B/i,
      ),
    ).toBeInTheDocument();
  });
});
