import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsView } from '../../src/components/settings/SettingsView';
import { APP_MODULES } from '../../src/data/navigationData';
import { VACCINES_CATALOG } from '../../src/data/vaccinesCatalog';
import {
  VAX_STORAGE_KEY,
  VAX_LAST_BACKUP_KEY,
  createBackupPayload,
  getStoredVaccines,
} from '../../src/utils/backup';
import type { ModuleDefinition } from '../../src/types/navigation';
import type { VaccineProduct } from '../../src/types/vaccines';

const getSettingsModule = (): ModuleDefinition => {
  const found = APP_MODULES.find((m) => m.id === 'settings');
  if (!found) {
    throw new Error('Brak definicji modułu settings w APP_MODULES');
  }
  return found;
};

const makeJsonFile = (name: string, content: unknown): File => {
  const serialized = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
  return new File([serialized], name, { type: 'application/json' });
};

describe('SettingsView — pełny UI przepływ importu i eksportu kopii JSON', () => {
  let downloadedBlobs: Blob[] = [];
  let downloadFilenames: string[] = [];

  beforeEach(() => {
    downloadedBlobs = [];
    downloadFilenames = [];

    Object.defineProperty(URL, 'createObjectURL', {
      value: vi.fn((blob: Blob) => {
        downloadedBlobs.push(blob);
        return `blob:vaxnurse-mock-${downloadedBlobs.length}`;
      }),
      writable: true,
      configurable: true,
    });

    Object.defineProperty(URL, 'revokeObjectURL', {
      value: vi.fn(),
      writable: true,
      configurable: true,
    });

    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement
    ) {
      downloadFilenames.push(this.download);
    });
  });

  it('eksportuje poprawną kopię JSON bez danych pacjentów i aktualizuje datę ostatniej kopii', async () => {
    const user = userEvent.setup();
    render(<SettingsView module={getSettingsModule()} onBackToDashboard={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /^Pobierz kopię bezpieczeństwa$/i }));

    expect(downloadFilenames).toHaveLength(1);
    expect(downloadFilenames[0]).toMatch(/^vaxnurse-kopia-bezpieczenstwa-\d{4}-\d{2}-\d{2}\.json$/);
    expect(downloadedBlobs).toHaveLength(1);

    const exportedText = await downloadedBlobs[0].text();
    const parsed = JSON.parse(exportedText) as {
      vaxnurseBackup: boolean;
      metadata: { containsPatientData: boolean; totalVaccines: number };
      vaccines: VaccineProduct[];
    };

    expect(parsed.vaxnurseBackup).toBe(true);
    expect(parsed.metadata.containsPatientData).toBe(false);
    expect(parsed.metadata.totalVaccines).toBe(VACCINES_CATALOG.length);
    expect(localStorage.getItem(VAX_LAST_BACKUP_KEY)).not.toBeNull();
    expect(screen.getByText(/Kopia bezpieczeństwa pobrana pomyślnie/i)).toBeInTheDocument();
  });

  it('wyświetla podgląd poprawnej kopii, pobiera automatyczną kopię zabezpieczającą i zapisuje dane po potwierdzeniu', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const { container } = render(
      <SettingsView module={getSettingsModule()} onBackToDashboard={vi.fn()} />
    );

    const payload = createBackupPayload(VACCINES_CATALOG);
    const fileInput = container.querySelector('input[type="file"][accept=".json,application/json"]');
    if (!(fileInput instanceof HTMLInputElement)) {
      throw new Error('Nie znaleziono input[type="file"]');
    }

    await user.upload(fileInput, makeJsonFile('backup-valid.json', payload));

    await screen.findByText(/Podsumowanie pliku kopii przed przywróceniem/i);
    expect(screen.getByText(/Preparaty w pliku kopii:/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Potwierdź i przywróć dane z kopii/i }));

    expect(window.confirm).toHaveBeenCalledTimes(1);
    expect(downloadFilenames[0]).toMatch(/vaxnurse-kopia-zabezpieczajaca-przed-przywroceniem-/);
    await screen.findByText(/Kopia bezpieczeństwa przywrócona i scalona pomyślnie/i);

    const persisted = getStoredVaccines();
    expect(persisted).toHaveLength(VACCINES_CATALOG.length);
    expect(localStorage.getItem(VAX_STORAGE_KEY)).not.toBeNull();
  });

  it('pozwala anulować przed zatwierdzeniem oraz po odrzuceniu window.confirm bez nadpisania localStorage', async () => {
    const user = userEvent.setup();
    const initialSentinel = JSON.stringify(
      VACCINES_CATALOG.map((v) =>
        v.id === 'vac-priorix' ? { ...v, userVerificationNotes: 'SENTINEL_UNTOUCHED' } : v
      )
    );
    localStorage.setItem(VAX_STORAGE_KEY, initialSentinel);

    const { container } = render(
      <SettingsView module={getSettingsModule()} onBackToDashboard={vi.fn()} />
    );
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const payload = createBackupPayload(VACCINES_CATALOG);

    await user.upload(fileInput, makeJsonFile('backup-cancel.json', payload));
    await screen.findByText(/Podsumowanie pliku kopii przed przywróceniem/i);

    await user.click(screen.getByRole('button', { name: /Anuluj przywracanie/i }));
    expect(screen.getByText(/Przywracanie kopii zostało anulowane przez użytkownika/i)).toBeInTheDocument();
    expect(localStorage.getItem(VAX_STORAGE_KEY)).toBe(initialSentinel);

    // Ponowne wczytanie + odmowa w window.confirm
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    await user.upload(fileInput, makeJsonFile('backup-cancel-confirm.json', payload));
    await screen.findByText(/Podsumowanie pliku kopii przed przywróceniem/i);

    await user.click(screen.getByRole('button', { name: /Potwierdź i przywróć dane z kopii/i }));
    expect(downloadFilenames).toHaveLength(1);
    expect(screen.getByText(/operacja przywracania została przerwana na żądanie użytkownika/i)).toBeInTheDocument();
    expect(localStorage.getItem(VAX_STORAGE_KEY)).toBe(initialSentinel);
  });

  it('odrzuca uszkodzony JSON i nieznany schemaVersion bez zmiany localStorage', async () => {
    const user = userEvent.setup();
    const initialSentinel = JSON.stringify(VACCINES_CATALOG);
    localStorage.setItem(VAX_STORAGE_KEY, initialSentinel);

    const { container } = render(
      <SettingsView module={getSettingsModule()} onBackToDashboard={vi.fn()} />
    );
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(fileInput, makeJsonFile('corrupted.json', '{ bad json :::'));
    await screen.findByText(/Odrzucono nieprawidłowy plik kopii/i);
    expect(localStorage.getItem(VAX_STORAGE_KEY)).toBe(initialSentinel);

    const badSchemaPayload = {
      ...createBackupPayload(VACCINES_CATALOG),
      metadata: {
        ...createBackupPayload(VACCINES_CATALOG).metadata,
        schemaVersion: '9.9.9',
      },
    };
    await user.upload(fileInput, makeJsonFile('bad-schema.json', badSchemaPayload));
    await screen.findByText(/Odrzucono nieprawidłowy plik kopii/i);
    expect(localStorage.getItem(VAX_STORAGE_KEY)).toBe(initialSentinel);
  });

  it('neutralizuje sfałszowany status verified_chpl i chroni niezgodność vac-infanrix-hexa przy imporcie', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const { container } = render(
      <SettingsView module={getSettingsModule()} onBackToDashboard={vi.fn()} />
    );
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

    const forgedPayload = createBackupPayload(
      VACCINES_CATALOG.map((v) => {
        if (v.id === 'vac-infanrix-hexa') {
          return {
            ...v,
            verificationStatus: 'verified_chpl',
            verifiedBy: 'Sfałszowany Audit',
            verifiedDate: '2026-11-11',
            sourceDiscrepancies: [],
          };
        }
        return {
          ...v,
          verificationStatus: 'verified_chpl',
          verifiedBy: 'Fake Signer',
          verifiedDate: '2026-11-11',
        };
      })
    );

    await user.upload(fileInput, makeJsonFile('forged.json', forgedPayload));
    await screen.findByText(/Podsumowanie pliku kopii przed przywróceniem/i);
    expect(screen.getByText(/Informacje z audytu integralności pliku przed scaleniem/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Potwierdź i przywróć dane z kopii/i }));
    await screen.findByText(/Kopia bezpieczeństwa przywrócona i scalona pomyślnie/i);

    const persisted = getStoredVaccines();
    const infanrix = persisted.find((v) => v.id === 'vac-infanrix-hexa');
    if (!infanrix) {
      throw new Error('Brak vac-infanrix-hexa po scaleniu');
    }

    expect(infanrix.verificationStatus).toBe('requires_source_clarification');
    expect(infanrix.sourceDiscrepancies?.length).toBeGreaterThan(0);
    expect(infanrix.sourceDiscrepancies?.[0]?.status).toBe('requires_clarification');
    expect(infanrix.importedVerificationClaim?.claimedStatus).toBe('verified_chpl');

    for (const vac of persisted) {
      expect(vac.verificationStatus).not.toBe('verified_chpl');
    }
  });

  it('odrzuca sfałszowane statusHistory i próbę Prototype Pollution (__proto__)', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <SettingsView module={getSettingsModule()} onBackToDashboard={vi.fn()} />
    );
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

    // 1. Sfałszowany statusHistory bez wymaganej struktury / z błędnym statusem
    const badHistoryPayload = createBackupPayload(
      VACCINES_CATALOG.map((v, idx) =>
        idx === 0
          ? ({
              ...v,
              statusHistory: [
                {
                  id: 'forged-hist-1',
                  timestamp: 'bad-date',
                  previousStatus: 'verified_full_hack',
                  newStatus: 'verified_chpl',
                  reason: '',
                  author: '',
                },
              ],
            } as unknown as VaccineProduct)
          : v
      )
    );

    await user.upload(fileInput, makeJsonFile('bad-history.json', badHistoryPayload));
    await screen.findByText(/Odrzucono nieprawidłowy plik kopii/i);

    // 2. Surowy JSON zawierający klucz __proto__
    const protoString = '{"vaxnurseBackup":true,"__proto__":{"polluted":true},"metadata":{"exportedAt":"2026-11-11T10:00:00.000Z","appVersion":"1.0.0","schemaVersion":"1.0.0","totalVaccines":0,"containsPatientData":false,"note":"test"},"vaccines":[]}';
    await user.upload(fileInput, makeJsonFile('proto.json', protoString));
    await screen.findByText(/Odrzucono nieprawidłowy plik kopii/i);
  });

  it('obsługuje błąd zapisu QuotaExceededError przy zatwierdzaniu kopii bez uszkodzenia istniejących danych', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const { container } = render(
      <SettingsView module={getSettingsModule()} onBackToDashboard={vi.fn()} />
    );
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const payload = createBackupPayload(VACCINES_CATALOG);

    await user.upload(fileInput, makeJsonFile('valid-before-quota.json', payload));
    await screen.findByText(/Podsumowanie pliku kopii przed przywróceniem/i);

    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });

    await user.click(screen.getByRole('button', { name: /Potwierdź i przywróć dane z kopii/i }));

    await waitFor(() => {
      expect(screen.getByText(/Błąd zapisu przywróconych danych/i)).toBeInTheDocument();
    });
    expect(setItemSpy).toHaveBeenCalled();
  });
});
