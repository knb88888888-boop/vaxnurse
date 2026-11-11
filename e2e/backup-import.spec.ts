import fs from 'node:fs/promises';
import { test, expect } from '@playwright/test';
import { VACCINES_CATALOG } from '../src/data/vaccinesCatalog';
import { createBackupPayload, VAX_STORAGE_KEY } from '../src/utils/backup';
import { attachRuntimeMonitor, navigateViaSidebarOrHeader } from './helpers';
import type { VaccineProduct } from '../src/types/vaccines';

const uploadJsonPayload = async (
  page: import('@playwright/test').Page,
  name: string,
  content: unknown
) => {
  const serialized =
    typeof content === 'string' ? content : JSON.stringify(content, null, 2);
  const input = page.locator('input[type="file"][accept=".json,application/json"]');
  await input.setInputFiles({
    name,
    mimeType: 'application/json',
    buffer: Buffer.from(serialized, 'utf-8'),
  });
};

test.describe('E2E — Pełna ścieżka eksportu i importu kopii bezpieczeństwa JSON (scenariusze A–G)', () => {
  test('A: Poprawna kopia JSON — eksport, podgląd 7 metryk, pobranie kopii zabezpieczającej, confirm dialog i trwałość po reload', async ({
    page,
  }) => {
    const monitor = attachRuntimeMonitor(page);
    await page.goto('/');
    await navigateViaSidebarOrHeader(page, /Ustawienia/i);

    // 1. Eksport bieżącej bazy
    const exportPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /^Pobierz kopię bezpieczeństwa$/i }).click();
    const exportDownload = await exportPromise;
    expect(exportDownload.suggestedFilename()).toMatch(
      /^vaxnurse-kopia-bezpieczenstwa-\d{4}-\d{2}-\d{2}\.json$/
    );
    const exportedPath = await exportDownload.path();
    expect(exportedPath).toBeTruthy();
    const exportedJson = JSON.parse(await fs.readFile(exportedPath as string, 'utf-8'));
    expect(exportedJson.metadata.containsPatientData).toBe(false);
    expect(exportedJson.vaccines).toHaveLength(VACCINES_CATALOG.length);

    // 2. Upload zmodyfikowanej poprawnej kopii (np. dopisana notatka przy vac-priorix z poprawnym statusem)
    const modifiedVaccines: VaccineProduct[] = VACCINES_CATALOG.map((v) =>
      v.id === 'vac-priorix'
        ? {
            ...v,
            verificationStatus: 'ready_for_manual_verification',
            userVerificationNotes: 'E2E notatka przed zatwierdzeniem',
          }
        : v
    );
    const validPayload = createBackupPayload(modifiedVaccines);
    await uploadJsonPayload(page, 'valid-backup.json', validPayload);

    await expect(
      page.getByRole('heading', { name: /Podsumowanie pliku kopii przed przywróceniem/i })
    ).toBeVisible();
    await expect(page.locator('.staged-tile')).toHaveCount(7);

    // 3. Zatwierdzenie + automatyczny download kopii zabezpieczającej + akceptacja window.confirm
    const safetyPromise = page.waitForEvent('download');
    page.once('dialog', async (dialog) => {
      expect(dialog.type()).toBe('confirm');
      await dialog.accept();
    });
    await page.getByRole('button', { name: /Potwierdź i przywróć dane z kopii/i }).click();
    const safetyDownload = await safetyPromise;
    expect(safetyDownload.suggestedFilename()).toMatch(
      /vaxnurse-kopia-zabezpieczajaca-przed-przywroceniem-/
    );

    await expect(
      page.getByText(/Kopia bezpieczeństwa przywrócona i scalona pomyślnie/i)
    ).toBeVisible();

    const storedAfter = await page.evaluate((key) => localStorage.getItem(key), VAX_STORAGE_KEY);
    expect(storedAfter).toContain('E2E notatka przed zatwierdzeniem');

    // 4. Reload i sprawdzenie trwałości w UI Bazy preparatów
    await page.reload();
    await navigateViaSidebarOrHeader(page, /Baza preparatów/i);
    await page.getByRole('button', { name: /Otwórz Kartę ChPL dla Priorix/i }).click();
    await expect(page.getByText(/Gotowy do ręcznej weryfikacji/i).first()).toBeVisible();

    monitor.assertClean();
  });

  test('B i F: Uszkodzony JSON oraz nieznany schemaVersion są odrzucane bez zmiany localStorage', async ({
    page,
  }) => {
    const monitor = attachRuntimeMonitor(page);
    await page.goto('/');
    await navigateViaSidebarOrHeader(page, /Ustawienia/i);

    const sentinel = JSON.stringify(
      VACCINES_CATALOG.map((v) =>
        v.id === 'vac-priorix' ? { ...v, userVerificationNotes: 'SENTINEL_E2E' } : v
      )
    );
    await page.evaluate(
      ([k, val]) => localStorage.setItem(k, val),
      [VAX_STORAGE_KEY, sentinel]
    );

    // B. Uszkodzony JSON
    await uploadJsonPayload(page, 'corrupt.json', '{ invalid json ::');
    await expect(page.getByText(/Odrzucono nieprawidłowy plik kopii/i)).toBeVisible();
    expect(
      await page.evaluate((k) => localStorage.getItem(k), VAX_STORAGE_KEY)
    ).toBe(sentinel);

    // F. Nieznany schemaVersion
    const badSchema = {
      ...createBackupPayload(VACCINES_CATALOG),
      metadata: {
        ...createBackupPayload(VACCINES_CATALOG).metadata,
        schemaVersion: '9.9.9',
      },
    };
    await uploadJsonPayload(page, 'unknown-schema.json', badSchema);
    await expect(page.getByText(/Odrzucono nieprawidłowy plik kopii/i)).toBeVisible();
    expect(
      await page.evaluate((k) => localStorage.getItem(k), VAX_STORAGE_KEY)
    ).toBe(sentinel);

    monitor.assertClean();
  });

  test('C, D i E: Sfałszowane verified_chpl, statusHistory oraz usunięta niezgodność Infanrix hexa nie obchodzą blokad klinicznych', async ({
    page,
  }) => {
    const monitor = attachRuntimeMonitor(page);
    await page.goto('/');
    await navigateViaSidebarOrHeader(page, /Ustawienia/i);

    // D. Sfałszowana statusHistory z nielegalnym przejściem/polami zostaje odrzucona walidacją
    const badHistory = createBackupPayload(
      VACCINES_CATALOG.map((v, idx) =>
        idx === 0
          ? ({
              ...v,
              statusHistory: [
                {
                  id: 'hack-1',
                  timestamp: 'invalid',
                  previousStatus: 'fake_status',
                  newStatus: 'verified_chpl',
                  reason: '',
                  author: '',
                },
              ],
            } as unknown as VaccineProduct)
          : v
      )
    );
    await uploadJsonPayload(page, 'forged-history.json', badHistory);
    await expect(page.getByText(/Odrzucono nieprawidłowy plik kopii/i)).toBeVisible();

    // C + E. Niepodpisane roszczenie verified_chpl + próba zdjęcia disc-phenylalanine-content-01 z vac-infanrix-hexa
    const forgedPayload = createBackupPayload(
      VACCINES_CATALOG.map((v) =>
        v.id === 'vac-infanrix-hexa'
          ? {
              ...v,
              verificationStatus: 'verified_chpl',
              userVerificationDate: '2026-11-11',
              sourceDiscrepancies: [],
            }
          : {
              ...v,
              verificationStatus: 'verified_chpl',
              userVerificationDate: '2026-11-11',
            }
      )
    );

    await uploadJsonPayload(page, 'forged-claims-and-infanrix.json', forgedPayload);
    await expect(
      page.getByText(/Informacje z audytu integralności pliku przed scaleniem/i)
    ).toBeVisible();

    const safetyPromise = page.waitForEvent('download');
    page.once('dialog', async (dialog) => await dialog.accept());
    await page.getByRole('button', { name: /Potwierdź i przywróć dane z kopii/i }).click();
    await safetyPromise;

    await expect(
      page.getByText(/Kopia bezpieczeństwa przywrócona i scalona pomyślnie/i)
    ).toBeVisible();

    const stored = await page.evaluate((k) => {
      const raw = localStorage.getItem(k);
      return raw ? (JSON.parse(raw) as VaccineProduct[]) : [];
    }, VAX_STORAGE_KEY);

    expect(stored.length).toBeGreaterThanOrEqual(VACCINES_CATALOG.length);
    for (const vac of stored) {
      expect(vac.verificationStatus).not.toBe('verified_chpl');
    }

    const infanrix = stored.find((v) => v.id === 'vac-infanrix-hexa');
    expect(infanrix?.verificationStatus).toBe('requires_source_clarification');
    expect(infanrix?.sourceDiscrepancies?.[0]?.status).toBe('requires_clarification');
    expect(infanrix?.importedVerificationClaim?.claimedStatus).toBe('verified_chpl');

    // Przejście do Bazy preparatów -> Infanrix hexa nadal zablokowana
    await page.reload();
    await navigateViaSidebarOrHeader(page, /Baza preparatów/i);
    await page.getByRole('button', { name: /Otwórz Kartę ChPL dla Infanrix hexa/i }).click();
    await expect(page.getByText(/Blokada statusu weryfikacji:/i)).toBeVisible();

    monitor.assertClean();
  });

  test('G: Konflikt z lokalną edycją + rezygnacja w dialogu confirm po pobraniu kopii zabezpieczającej', async ({
    page,
  }) => {
    const monitor = attachRuntimeMonitor(page);
    await page.goto('/');

    const localState = VACCINES_CATALOG.map((v) =>
      v.id === 'vac-priorix'
        ? {
            ...v,
            verificationStatus: 'ready_for_manual_verification' as const,
            userVerificationNotes: 'Lokalna modyfikacja pielęgniarki',
          }
        : v
    );
    await page.evaluate(
      ([k, val]) => localStorage.setItem(k, val),
      [VAX_STORAGE_KEY, JSON.stringify(localState)]
    );

    await navigateViaSidebarOrHeader(page, /Ustawienia/i);

    const incomingState = VACCINES_CATALOG.map((v) =>
      v.id === 'vac-priorix'
        ? {
            ...v,
            verificationStatus: 'pending_verification' as const,
            userVerificationNotes: 'Wartość ze starszego pliku kopii',
          }
        : v
    );
    await uploadJsonPayload(page, 'conflict.json', createBackupPayload(incomingState));

    await expect(
      page.getByRole('heading', { name: /Podsumowanie pliku kopii przed przywróceniem/i })
    ).toBeVisible();
    await expect(page.locator('.staged-tile', { hasText: /Wykryte konflikty/i })).toContainText(/[1-9]/);

    // Anuluj w dialogu window.confirm — aplikacja pobiera kopię zabezpieczającą i NIE nadpisuje localStorage
    const safetyPromise = page.waitForEvent('download');
    page.once('dialog', async (dialog) => await dialog.dismiss());
    await page.getByRole('button', { name: /Potwierdź i przywróć dane z kopii/i }).click();
    await safetyPromise;

    await expect(
      page.getByText(/operacja przywracania została przerwana na żądanie użytkownika/i)
    ).toBeVisible();

    const storedAfter = await page.evaluate((k) => localStorage.getItem(k), VAX_STORAGE_KEY);
    expect(storedAfter).toContain('Lokalna modyfikacja pielęgniarki');

    monitor.assertClean();
  });
});
