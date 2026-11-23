import { describe, it, expect } from 'vitest';
import {
  PSO_INTERVAL_RULES_DATABASE,
  calculateNextDoseDate
} from '../../src/utils/operationalTools';

describe('Asystent reguł minimalnych odstępów PSO 2027', () => {
  it('zawiera oficjalne reguły PSO dla żywych, inaktywowanych i preparatów krwi', () => {
    expect(PSO_INTERVAL_RULES_DATABASE.length).toBeGreaterThanOrEqual(5);

    const liveRule = PSO_INTERVAL_RULES_DATABASE.find(r => r.id === 'rule-live-live-different');
    expect(liveRule).toBeDefined();
    expect(liveRule?.defaultInterval).toBe(28);
    expect(liveRule?.defaultUnit).toBe('days');

    const bloodRule = PSO_INTERVAL_RULES_DATABASE.find(r => r.id === 'rule-blood-products-live');
    expect(bloodRule).toBeDefined();
    expect(bloodRule?.defaultInterval).toBe(3);
    expect(bloodRule?.defaultUnit).toBe('months');
  });

  it('poprawnie wylicza minimalny odstęp dla reguły szczepionek żywych (28 dni)', () => {
    const calc = calculateNextDoseDate({
      lastDoseDate: '2026-05-01',
      minIntervalDays: '28',
      intervalUnit: 'days',
      plannedDate: '2026-05-29',
      referenceToday: '2026-06-01'
    });

    expect(calc.ok).toBe(true);
    expect(calc.earliestDate).toBe('2026-05-29');
    expect(calc.plannedStatus).toBe('allowed');
  });

  it('wychwytuje za wczesne podanie drugiej szczepionki żywej', () => {
    const calc = calculateNextDoseDate({
      lastDoseDate: '2026-05-01',
      minIntervalDays: '28',
      intervalUnit: 'days',
      plannedDate: '2026-05-20',
      referenceToday: '2026-06-01'
    });

    expect(calc.ok).toBe(true);
    expect(calc.plannedStatus).toBe('too_early');
    expect(calc.plannedShortfallDays).toBe(9);
  });
});
