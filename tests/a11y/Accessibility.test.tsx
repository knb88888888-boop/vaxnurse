import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import type { Result as AxeResult } from 'axe-core';
import App from '../../src/App';
import { SettingsView } from '../../src/components/settings/SettingsView';
import { APP_MODULES } from '../../src/data/navigationData';
import { VACCINES_CATALOG } from '../../src/data/vaccinesCatalog';
import { createBackupPayload } from '../../src/utils/backup';
import type { ModuleDefinition } from '../../src/types/navigation';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const formatAxeViolations = (violations: AxeResult[]): string =>
  violations
    .map((v) => {
      const nodes = v.nodes
        .slice(0, 5)
        .map((n) => `  - ${n.target.join(' > ')} :: ${n.failureSummary ?? ''}`)
        .join('\n');
      return `[${v.impact ?? 'unknown'}] ${v.id}: ${v.help}\n${nodes}`;
    })
    .join('\n\n');

const runWcagAxe = async (container: HTMLElement, contextLabel: string) => {
  const wcagResults = await axe.run(container, {
    runOnly: { type: 'tag', values: WCAG_TAGS },
  });

  const bestPracticeResults = await axe.run(container, {
    runOnly: { type: 'tag', values: ['best-practice'] },
  });

  if (wcagResults.violations.length > 0) {
    throw new Error(
      `Wykryto naruszenia WCAG 2.1/2.2 A/AA w widoku [${contextLabel}]:\n${formatAxeViolations(wcagResults.violations)}`
    );
  }

  return {
    wcagViolations: wcagResults.violations.length,
    wcagPasses: wcagResults.passes.length,
    bestPracticeViolations: bestPracticeResults.violations,
  };
};

const getSettingsModule = (): ModuleDefinition => {
  const found = APP_MODULES.find((m) => m.id === 'settings');
  if (!found) {
    throw new Error('Brak definicji modułu settings');
  }
  return found;
};

describe('Automatyczny audyt dostępności WCAG 2.1/2.2 A/AA (axe-core w Vitest/jsdom)', () => {
  it('Pulpit (Dashboard) + globalna wyszukiwarka + pasek boczny spełniają WCAG 2.1/2.2 A/AA', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    await screen.findByText(/Narzędzie referencyjne pielęgniarki • Tryb lokalny/i);
    const dashboardAudit = await runWcagAxe(container, 'Dashboard');
    expect(dashboardAudit.wcagViolations).toBe(0);

    // Otwórz globalne wyszukiwanie w nagłówku i sprawdź dropdown wyników
    const searchInput = screen.getAllByRole('textbox', {
      name: /Szukaj modułów i sekcji VaxNurse/i,
    })[0];
    await user.click(searchInput);
    await user.type(searchInput, 'ChPL');
    await screen.findByRole('region', {
      name: /Wyniki wyszukiwania modułów i sekcji VaxNurse/i,
    });

    const searchAudit = await runWcagAxe(container, 'Header + Global Search Open');
    expect(searchAudit.wcagViolations).toBe(0);
  });

  it('Moduły kliniczne (Szczepienia dzieci PSO, Baza preparatów, Stanowisko audytu ChPL, Karta ChPL) spełniają WCAG 2.1/2.2 A/AA', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    // 1. Szczepienia dzieci (PSO 2027)
    await user.click(screen.getAllByRole('button', { name: /Szczepienia dzieci/i })[0]);
    await screen.findByText(/Gruźlica/i, {}, { timeout: 10000 });
    expect((await runWcagAxe(container, 'ChildVaccinationsView')).wcagViolations).toBe(0);

    // 2. Baza preparatów (Katalog)
    await user.click(screen.getAllByRole('button', { name: /Baza preparatów/i })[0]);
    await screen.findByTestId('vaccines-mode-workbench', {}, { timeout: 10000 });
    expect((await runWcagAxe(container, 'VaccinesDatabaseView')).wcagViolations).toBe(0);

    // 3. Stanowisko audytu ChPL (Workbench READ-ONLY + Etap B2 Source Registry & Evidence Ledger)
    await user.click(screen.getByTestId('vaccines-mode-workbench'));
    await screen.findByRole(
      'heading',
      {
        name: /Stanowisko audytu dokumentacji ChPL/i,
      },
      { timeout: 10000 }
    );
    await screen.findByTestId('b2-source-registry-panel', {}, { timeout: 10000 });
    await screen.findByTestId('b2-evidence-ledger-panel', {}, { timeout: 10000 });
    expect((await runWcagAxe(container, 'ChplAuditWorkbenchView + B2')).wcagViolations).toBe(0);

    // 4. Karta ChPL Infanrix hexa (zwinięte + rozwinięte akordeony)
    const infanrixBtns = await screen.findAllByRole(
      'button',
      {
        name: /Karta ChPL: Infanrix hexa/i,
      },
      { timeout: 10000 }
    );
    await user.click(infanrixBtns[0]);
    await screen.findByRole('heading', { name: /Infanrix hexa/i }, { timeout: 10000 });
    expect((await runWcagAxe(container, 'VaccineDetailView (Infanrix)')).wcagViolations).toBe(0);

    await user.click(screen.getByRole('button', { name: /Rozwiń wszystkie punkty/i }));
    await waitFor(
      () => {
        expect(
          screen.getByRole('button', { name: /1\. Nazwa produktu leczniczego/i })
        ).toHaveAttribute('aria-expanded', 'true');
      },
      { timeout: 10000 }
    );
    expect((await runWcagAxe(container, 'VaccineDetailView (Expanded)')).wcagViolations).toBe(0);
  }, 40000);

  it('Baza wiedzy, moduł w przygotowaniu oraz Ustawienia + podgląd importu kopii JSON spełniają WCAG 2.1/2.2 A/AA', async () => {
    const user = userEvent.setup();
    const { container, unmount } = render(<App />);

    // 1. Baza wiedzy
    await user.click(screen.getAllByRole('button', { name: /Baza wiedzy/i })[0]);
    await screen.findByText(/Biblioteka Źródeł Oficjalnych/i, {}, { timeout: 10000 });
    expect((await runWcagAxe(container, 'KnowledgeBaseView')).wcagViolations).toBe(0);

    // 2. Moduł placeholder (Sytuacje szczególne w przygotowaniu)
    await user.click(screen.getByRole('button', { name: /Sytuacje szczególne \(w przygotowaniu\)/i }));
    await screen.findByText(/Moduł nieaktywny • W przygotowaniu/i, {}, { timeout: 10000 });
    expect((await runWcagAxe(container, 'ModulePlaceholder')).wcagViolations).toBe(0);

    unmount();

    // 3. Ustawienia ze stanem staged backup preview + ostrzeżenia
    const { container: settingsContainer } = render(
      <main>
        <SettingsView module={getSettingsModule()} onBackToDashboard={vi.fn()} />
      </main>
    );
    expect((await runWcagAxe(settingsContainer, 'SettingsView')).wcagViolations).toBe(0);

    const fileInput = settingsContainer.querySelector('input[type="file"]') as HTMLInputElement;
    const forgedPayload = createBackupPayload(
      VACCINES_CATALOG.map((v) => ({
        ...v,
        verificationStatus: 'verified_chpl',
        verifiedBy: 'External Audit',
        verifiedDate: '2026-11-11',
      }))
    );
    const file = new File([JSON.stringify(forgedPayload)], 'forged-preview.json', {
      type: 'application/json',
    });
    await user.upload(fileInput, file);
    await screen.findByText(/Podsumowanie pliku kopii przed przywróceniem/i, {}, { timeout: 10000 });
    expect(
      (await runWcagAxe(settingsContainer, 'SettingsView + Staged Backup Preview')).wcagViolations
    ).toBe(0);
  }, 25000);
});
