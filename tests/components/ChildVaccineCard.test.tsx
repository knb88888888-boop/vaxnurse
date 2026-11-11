import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChildVaccineCard } from '../../src/components/childVaccinations/ChildVaccineCard';
import { CHILD_VACCINES_CATALOG } from '../../src/data/childVaccinesData';
import { VACCINES_CATALOG } from '../../src/data/vaccinesCatalog';
import type { ChildVaccineItem } from '../../src/types/childVaccines';

const findProcedure = (predicate: (item: ChildVaccineItem) => boolean): ChildVaccineItem => {
  const found = CHILD_VACCINES_CATALOG.find(predicate);
  if (!found) {
    throw new Error('Nie znaleziono procedury PSO w CHILD_VACCINES_CATALOG');
  }
  return found;
};

describe('ChildVaccineCard — prezentacja 43 procedur PSO 2027 i statusów ChPL', () => {
  it('renderuje procedurę BCG 10 (identified RPL) oraz bezpieczne linki bez fałszywego statusu verified_full', async () => {
    const user = userEvent.setup();
    const bcgProc = findProcedure((p) => p.id === 'pso-bcg-0');
    const onSelectVaccineProduct = vi.fn();

    render(
      <ChildVaccineCard
        item={bcgProc}
        catalogVaccines={VACCINES_CATALOG}
        onSelectVaccineProduct={onSelectVaccineProduct}
      />
    );

    expect(screen.getByText(/Gruźlica/i)).toBeInTheDocument();
    expect(screen.getByText(/Zweryfikowano PSO/i)).toBeInTheDocument();
    expect(screen.getByText(/ChPL: dokument w RPL \(audyt treści w toku\)/i)).toBeInTheDocument();
    expect(screen.queryByText(/ChPL: w pełni zweryfikowana/i)).not.toBeInTheDocument();

    // Rozwiń szczegóły procedury, aby zweryfikować powiązanie z kartą produktu i akt.pdf
    const expandBtn = screen.getByRole('button', {
      name: /Pokaż wytyczne wykonawcze, ChPL i źródła PSO/i,
    });
    await user.click(expandBtn);

    const openCatalogBtn = screen.queryByRole('button', { name: /Otwórz kartę ChPL/i });
    if (openCatalogBtn) {
      await user.click(openCatalogBtn);
      expect(onSelectVaccineProduct).toHaveBeenCalled();
    }
  });

  it('wyświetla oznaczenie niezgodności źródłowej ChPL dla procedury powiązanej z Infanrix hexa oraz status referencyjny dla procedury bez źródła PDF', () => {
    const infanrixProc = findProcedure(
      (p) => p.chplContentVerificationStatus === 'analyzed_with_discrepancy'
    );
    const refOnlyProc = findProcedure(
      (p) => p.chplReferenceStatus === 'reference_name_only'
    );

    const { rerender } = render(
      <ChildVaccineCard
        item={infanrixProc}
        catalogVaccines={VACCINES_CATALOG}
        defaultExpanded
      />
    );

    expect(screen.getByText(/ChPL: niezgodność źródłowa/i)).toBeInTheDocument();
    expect(screen.queryByText(/ChPL: w pełni zweryfikowana/i)).not.toBeInTheDocument();

    rerender(
      <ChildVaccineCard
        item={refOnlyProc}
        catalogVaccines={VACCINES_CATALOG}
      />
    );

    expect(screen.getByText(/ChPL: wyłącznie nazwa referencyjna/i)).toBeInTheDocument();
    expect(screen.queryByText(/ChPL: w pełni zweryfikowana/i)).not.toBeInTheDocument();
  });

  it('żadna z 43 procedur w katalogu nie nosi fałszywego statusu verified_full przed audytem klinicznym', () => {
    expect(CHILD_VACCINES_CATALOG).toHaveLength(43);
    for (const item of CHILD_VACCINES_CATALOG) {
      expect(item.chplContentVerificationStatus).not.toBe('verified_full');
    }
  });
});
