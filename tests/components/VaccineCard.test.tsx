import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VaccineCard } from '../../src/components/vaccines/VaccineCard';
import { VACCINES_CATALOG } from '../../src/data/vaccinesCatalog';
import type { VaccineProduct } from '../../src/types/vaccines';

const findCatalogVaccine = (id: string): VaccineProduct => {
  const found = VACCINES_CATALOG.find((v) => v.id === id);
  if (!found) {
    throw new Error(`Brak preparatu ${id} w VACCINES_CATALOG`);
  }
  return found;
};

describe('VaccineCard — prezentacja metadanych ChPL i alertów bezpieczeństwa', () => {
  it('renderuje kartę preparatu z ostrzeżeniem o niezgodności ChPL dla Infanrix hexa i obsługuje kliknięcie szczegółów', async () => {
    const user = userEvent.setup();
    const infanrix = findCatalogVaccine('vac-infanrix-hexa');
    const onOpenDetails = vi.fn();

    render(<VaccineCard vaccine={infanrix} onOpenDetails={onOpenDetails} />);

    expect(screen.getByRole('heading', { name: /Infanrix hexa/i })).toBeInTheDocument();
    expect(screen.getByText(/Wymaga wyjaśnienia źródłowego/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Niezgodność w ChPL/i).length).toBeGreaterThan(0);

    const rplLink = screen.getByRole('link', { name: /Szukaj w RPL/i });
    expect(rplLink).toHaveAttribute('target', '_blank');
    expect(rplLink).toHaveAttribute('rel', 'noopener noreferrer');

    const chplLink = screen.getByRole('link', { name: /Oficjalna ChPL \(PDF\)/i });
    expect(chplLink).toHaveAttribute('target', '_blank');
    expect(chplLink).toHaveAttribute('rel', 'noopener noreferrer');

    await user.click(screen.getByRole('button', { name: /Otwórz Kartę ChPL dla Infanrix hexa/i }));
    expect(onOpenDetails).toHaveBeenCalledTimes(1);
    expect(onOpenDetails).toHaveBeenCalledWith(infanrix);
  });

  it('wyświetla badge importedVerificationClaim i mergeConflict, gdy występują na rekordzie po scaleniu', () => {
    const base = findCatalogVaccine('vac-priorix');
    const decorated: VaccineProduct = {
      ...base,
      verificationStatus: 'requires_reverification',
      importedVerificationClaim: {
        claimedStatus: 'verified_chpl',
        declaredBy: 'Import JSON',
        declaredAt: '2026-11-10',
        importedAt: '2026-11-11T10:00:00.000Z',
        requiresReverification: true,
        hasCompleteChplAudit: false,
        hasOriginProvenance: false,
        reason: 'Deklaracja z niepodpisanego pliku wymaga ponownej kontroli lokalnej.',
      },
      mergeConflict: {
        hasBaseUpdateConflict: true,
        baseCatalogVersion: '2026.11',
        conflictFields: ['verificationStatus'],
        localVerificationStatus: 'requires_reverification',
        baseVerificationStatus: 'pending_verification',
        summary: 'Lokalny stan różnił się od katalogu bazowego',
      },
    };

    render(<VaccineCard vaccine={decorated} onOpenDetails={vi.fn()} />);

    expect(
      screen.getByText(/Deklaracja z importu JSON vs status lokalny:/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Wykryto konflikt wersji katalogu:/i)
    ).toBeInTheDocument();
  });
});
