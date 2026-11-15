import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VaccineDetailView } from '../../src/components/vaccines/VaccineDetailView';
import { VACCINES_CATALOG } from '../../src/data/vaccinesCatalog';
import type { VaccineProduct } from '../../src/types/vaccines';

const findCatalogVaccine = (id: string): VaccineProduct => {
  const found = VACCINES_CATALOG.find((v) => v.id === id);
  if (!found) {
    throw new Error(`Brak preparatu ${id} w VACCINES_CATALOG`);
  }
  return found;
};

describe('VaccineDetailView — akordeony 1–10 ChPL, klawiatura i blokada Infanrix hexa', () => {
  it('renderuje 10 punktów EMA QRD i obsługuje otwieranie/zamykanie pojedynczo oraz masowo myszą i klawiaturą', async () => {
    const user = userEvent.setup();
    const priorix = findCatalogVaccine('vac-priorix');

    render(<VaccineDetailView vaccine={priorix} onBackToList={vi.fn()} />);

    const point1Btn = screen.getByRole('button', {
      name: /1\. Nazwa produktu leczniczego/i,
    });
    const controlsId = point1Btn.getAttribute('aria-controls');
    expect(controlsId).toBeTruthy();

    const wasExpanded = point1Btn.getAttribute('aria-expanded') === 'true';
    point1Btn.focus();
    await user.keyboard('{Enter}');
    expect(point1Btn).toHaveAttribute('aria-expanded', String(!wasExpanded));

    await user.keyboard(' ');
    expect(point1Btn).toHaveAttribute('aria-expanded', String(wasExpanded));

    await user.click(screen.getByRole('button', { name: /Rozwiń wszystkie punkty/i }));
    const point10Btn = screen.getByRole('button', {
      name: /10\. Data zatwierdzenia lub częściowej zmiany tekstu/i,
    });
    expect(point10Btn).toHaveAttribute('aria-expanded', 'true');

    await user.click(screen.getByRole('button', { name: /^Zwiń wszystkie punkty$/i }));
    expect(point1Btn).toHaveAttribute('aria-expanded', 'false');
    expect(point10Btn).toHaveAttribute('aria-expanded', 'false');
  });

  it('egzekwuje blokadę ostatecznego zatwierdzenia ChPL dla vac-infanrix-hexa z nierozwiązaną niezgodnością fenyloalaniny', () => {
    const infanrix = findCatalogVaccine('vac-infanrix-hexa');

    render(<VaccineDetailView vaccine={infanrix} onBackToList={vi.fn()} />);

    expect(
      screen.getByText(/Blokada statusu weryfikacji:/i)
    ).toBeInTheDocument();
    expect(screen.getAllByText(/requires_clarification/i).length).toBeGreaterThan(0);

    // Przycisk ostatecznego zatwierdzenia nie może zostać odblokowany przy statusie requires_clarification
    const approveButtons = screen.queryAllByRole('button', {
      name: /Ostatecznie zatwierdź ChPL|Zatwierdź status Zweryfikowany/i,
    });
    for (const btn of approveButtons) {
      expect(btn).toBeDisabled();
    }

    // Sprawdzenie bezpiecznych linków RPL/EMA bez tabnabbingu
    const externalLinks = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('target') === '_blank');
    expect(externalLinks.length).toBeGreaterThan(0);
    for (const link of externalLinks) {
      expect(link.getAttribute('rel')).toContain('noopener');
      expect(link.getAttribute('rel')).toContain('noreferrer');
    }
  });

  it('wycofuje lokalną zmianę stanu (brak fałszywego awansu UI), gdy zapis do localStorage zwróci false', async () => {
    const user = userEvent.setup();
    const priorix = findCatalogVaccine('vac-priorix');
    const readyPriorix: VaccineProduct = {
      ...priorix,
      verificationStatus: 'ready_for_manual_verification',
      sourceDiscrepancies: [],
    };
    const onUpdateVaccine = vi.fn(() => false);

    render(
      <VaccineDetailView
        vaccine={readyPriorix}
        onBackToList={vi.fn()}
        onUpdateVaccine={onUpdateVaccine}
        storageError="Błąd zapisu localStorage"
      />
    );

    await user.click(
      screen.getByLabelText(/Potwierdzam przeprowadzenie osobnej, ręcznej weryfikacji całej dokumentacji ChPL/i)
    );
    await user.type(
      screen.getByLabelText(/Osoba zatwierdzająca całą ChPL/i),
      'mgr piel. Anna Nowak'
    );
    await user.type(
      screen.getByLabelText(/Zakres i wynik ręcznej weryfikacji całej ChPL/i),
      'Zweryfikowano pkt 1–10 z oficjalnym drukiem ChPL'
    );

    await user.click(screen.getByRole('button', { name: /Zatwierdź dokumentację/i }));

    expect(onUpdateVaccine).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/Dokumentacja preparatu została zatwierdzona/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/Gotowy do ręcznej weryfikacji/i).length).toBeGreaterThan(0);
  });
});
