import { expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

export const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

export interface RuntimeMonitor {
  consoleErrors: string[];
  pageErrors: string[];
  failedResponses: string[];
  requestFailures: string[];
  assertClean: () => void;
}

export function attachRuntimeMonitor(page: Page): RuntimeMonitor {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedResponses: string[] = [];
  const requestFailures: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', (err) => {
    pageErrors.push(err.message);
  });

  page.on('response', (res) => {
    const status = res.status();
    const url = res.url();
    if (url.startsWith('http://127.0.0.1:4174') && status >= 400) {
      failedResponses.push(`${status} ${url}`);
    }
  });

  page.on('requestfailed', (req) => {
    const url = req.url();
    if (url.startsWith('http://127.0.0.1:4174')) {
      requestFailures.push(`${url}: ${req.failure()?.errorText ?? 'unknown'}`);
    }
  });

  return {
    consoleErrors,
    pageErrors,
    failedResponses,
    requestFailures,
    assertClean: () => {
      expect(pageErrors, 'Brak nieobsłużonych wyjątków pageerror').toEqual([]);
      expect(consoleErrors, 'Brak błędów console.error').toEqual([]);
      expect(failedResponses, 'Brak odpowiedzi HTTP >= 400').toEqual([]);
      expect(requestFailures, 'Brak nieudanych żądań zasobów lokalnych').toEqual([]);
    },
  };
}

export async function runAxeAudit(
  page: Page,
  contextLabel: string,
  collectInto?: string[]
) {
  await page.evaluate(async () => {
    const finiteAnimations = document
      .getAnimations()
      .filter((anim) => Number.isFinite(anim.effect?.getComputedTiming().iterations ?? 1));
    if (finiteAnimations.length === 0) return;
    await Promise.race([
      Promise.all(finiteAnimations.map((anim) => anim.finished.catch(() => undefined))),
      new Promise((resolve) => setTimeout(resolve, 400)),
    ]);
  });

  const wcag = await new AxeBuilder({ page })
    .withTags(WCAG_TAGS)
    .analyze();

  const bestPractice = await new AxeBuilder({ page })
    .withTags(['best-practice'])
    .analyze();

  if (bestPractice.violations.length > 0) {
    console.info(
      `[axe best-practice] [${contextLabel}]: ${bestPractice.violations
        .map((v) => `${v.id}(${v.nodes.length})`)
        .join(', ')}`
    );
  }

  console.info(
    `[axe wcag] [${contextLabel}]: violations=${wcag.violations.length}, incomplete=${wcag.incomplete.length}, passes=${wcag.passes.length}`
  );

  if (wcag.violations.length > 0) {
    const formatted = wcag.violations
      .map((v) => {
        const targets = v.nodes
          .slice(0, 6)
          .map((n) => `  - ${n.target.join(' > ')} :: ${n.failureSummary ?? ''}`)
          .join('\n');
        return `[${v.impact ?? 'unknown'}] ${v.id} (${v.help})\n${targets}`;
      })
      .join('\n\n');
    const msg = `Naruszenia WCAG w [${contextLabel}]:\n${formatted}`;
    if (collectInto) {
      collectInto.push(msg);
    } else {
      throw new Error(msg);
    }
  }

  return {
    wcagViolationsCount: wcag.violations.length,
    wcagPassesCount: wcag.passes.length,
    wcagIncompleteCount: wcag.incomplete.length,
    bestPracticeCount: bestPractice.violations.length,
    bestPracticeIds: bestPractice.violations.map((v) => v.id),
  };
}

export async function navigateViaSidebarOrHeader(page: Page, buttonName: RegExp) {
  const menuTrigger = page.getByRole('button', { name: /Otwórz menu nawigacji/i });
  if (await menuTrigger.isVisible()) {
    await menuTrigger.click();
    const drawerBtn = page
      .locator('.app-sidebar.open-mobile .nav-item', { hasText: buttonName })
      .first();
    await drawerBtn.click();
    return;
  }

  const desktopBtn = page.locator('.app-sidebar .nav-item', { hasText: buttonName }).first();
  await desktopBtn.click();
}
