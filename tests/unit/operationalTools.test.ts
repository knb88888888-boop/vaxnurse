import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildColdChainCsv,
  calculateAgeAt,
  calculateNextDoseDate,
  evaluateColdChainStatus,
  evaluateKitItemStatus,
  loadColdChainReadings,
  loadEmergencyKit,
  loadLocalChecklist,
  saveColdChainReadings,
  saveEmergencyKit,
  saveLocalChecklist,
  validateChecklistText,
  validateColdChainDraft,
  validateKitDraft
} from '../../src/utils/operationalTools';

describe('operationalTools — Kalkulator terminów i wieku', () => {
  it('wylicza najwcześniejszy termin kolejnej dawki i wykrywa zbyt wczesną wizytę', () => {
    const tooEarly = calculateNextDoseDate({
      lastDoseDate: '2026-10-01',
      minIntervalDays: '28',
      plannedDate: '2026-10-20',
      referenceToday: '2026-10-15'
    });
    expect(tooEarly.ok).toBe(true);
    expect(tooEarly.earliestDate).toBe('2026-10-29');
    expect(tooEarly.daysSinceLastDose).toBe(14);
    expect(tooEarly.daysUntilEarliest).toBe(14);
    expect(tooEarly.plannedStatus).toBe('too_early');
    expect(tooEarly.plannedShortfallDays).toBe(9);

    const allowed = calculateNextDoseDate({
      lastDoseDate: '2026-10-01',
      minIntervalDays: '28',
      plannedDate: '2026-10-29',
      referenceToday: '2026-10-15'
    });
    expect(allowed.plannedStatus).toBe('allowed');
    expect(allowed.plannedShortfallDays).toBe(0);
  });

  it('odrzuca błędne daty i datę przyszłą ostatniej dawki', () => {
    const res = calculateNextDoseDate({
      lastDoseDate: '2026-12-01',
      minIntervalDays: '0',
      referenceToday: '2026-11-12'
    });
    expect(res.ok).toBe(false);
    expect(res.errors.length).toBeGreaterThanOrEqual(2);
  });

  it('oblicza dokładny wiek w latach, miesiącach, tygodniach i dniach', () => {
    const age = calculateAgeAt('2025-05-15', '2026-11-12');
    expect(age.ok).toBe(true);
    expect(age.fullYears).toBe(1);
    expect(age.remainderMonths).toBe(5);
    expect(age.fullMonths).toBe(17);
  });
});

describe('operationalTools — Łańcuch chłodniczy, checklista i zestaw przeciwwstrząsowy', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('wymaga opisu działań przy przekroczeniu +2..+8°C, eksportuje CSV z ochroną formuł i utrwala w localStorage', () => {
    const invalid = validateColdChainDraft({
      deviceLabel: 'Chłodziarka 1',
      measuredAt: '2026-11-12T08:00',
      currentC: '9.4',
      minC: '4.0',
      maxC: '9.4',
      actionNote: '',
      recordedBy: 'AN'
    });
    expect(invalid.ok).toBe(false);

    const valid = validateColdChainDraft({
      deviceLabel: 'Chłodziarka 1',
      measuredAt: '2026-11-12T08:00',
      currentC: '9.4',
      minC: '4.0',
      maxC: '9.4',
      actionNote: '=SUM(1,2) Zabezpieczono preparaty w lodówce zapasowej',
      recordedBy: 'AN'
    });
    expect(valid.ok).toBe(true);
    if (!valid.ok) return;
    expect(evaluateColdChainStatus(valid.reading)).toBe('excursion_high');

    saveColdChainReadings(localStorage, [valid.reading]);
    expect(loadColdChainReadings(localStorage)).toHaveLength(1);

    const csv = buildColdChainCsv([valid.reading]);
    expect(csv).toContain("'=SUM(1,2)");
    expect(csv).toContain('Powyżej zakresu');
  });

  it('waliduje i przechowuje lokalną checklistę oraz inwentarz zestawu p/wstrząsowego', () => {
    expect(validateChecklistText('ab')).not.toBeNull();
    expect(validateChecklistText('<script>alert(1)</script>')).not.toBeNull();
    saveLocalChecklist(localStorage, [{ id: 'c1', text: 'Kontrola dat ważności', done: true }]);
    expect(loadLocalChecklist(localStorage)).toEqual([
      { id: 'c1', text: 'Kontrola dat ważności', done: true }
    ]);

    const kit = validateKitDraft({ name: 'Zestaw A', quantity: '2', expiryDate: '2026-11-20' });
    expect(kit.ok).toBe(true);
    if (!kit.ok) return;
    expect(evaluateKitItemStatus(kit.item, '2026-11-12')).toBe('expiring');
    expect(evaluateKitItemStatus(kit.item, '2026-11-25')).toBe('expired');
    saveEmergencyKit(localStorage, [kit.item]);
    expect(loadEmergencyKit(localStorage)).toHaveLength(1);
  });
});
