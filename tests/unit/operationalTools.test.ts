import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildColdChainCsv,
  calculateAgeAt,
  calculateNextDoseDate,
  EMERGENCY_KIT_REGULATION_ANNEX_26,
  escapeCsvField,
  evaluateColdChainStatus,
  evaluateKitItemStatus,
  FACILITY_CARE_CATEGORIES,
  loadColdChainReadings,
  loadEmergencyKit,
  loadLocalChecklist,
  PRODUCT_STORAGE_REFERENCE_MATRIX,
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
    expect(evaluateColdChainStatus(valid.reading)).toBe('above_configured_range');

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
    expect(evaluateKitItemStatus(kit.item, '2026-11-12')).toBe('requires_review');
    expect(evaluateKitItemStatus(kit.item, '2026-11-25')).toBe('expired');
    saveEmergencyKit(localStorage, [kit.item]);
    expect(loadEmergencyKit(localStorage)).toHaveLength(1);
  });

  it('Etap C1: testy graniczne kalkulatora (31.01, 31.03, 29.02, brak zapisu localStorage), profili chłodniczych, 5 kategorii i CSV', () => {
    localStorage.clear();
    expect(
      calculateNextDoseDate({
        lastDoseDate: '2026-01-31',
        minIntervalDays: '1',
        intervalUnit: 'months',
        referenceToday: '2026-02-01'
      }).earliestDate
    ).toBe('2026-02-28');
    expect(
      calculateNextDoseDate({
        lastDoseDate: '2024-01-31',
        minIntervalDays: '1',
        intervalUnit: 'months',
        referenceToday: '2024-02-01'
      }).earliestDate
    ).toBe('2024-02-29');
    expect(
      calculateNextDoseDate({
        lastDoseDate: '2026-03-31',
        minIntervalDays: '1',
        intervalUnit: 'months',
        referenceToday: '2026-04-01'
      }).earliestDate
    ).toBe('2026-04-30');
    expect(
      calculateNextDoseDate({
        lastDoseDate: '2024-02-29',
        minIntervalDays: '1',
        intervalUnit: 'years',
        referenceToday: '2024-03-01'
      }).earliestDate
    ).toBe('2025-02-28');
    expect(
      calculateNextDoseDate({
        lastDoseDate: '2026-02-30',
        minIntervalDays: '1',
        referenceToday: '2026-03-01'
      }).ok
    ).toBe(false);
    expect(
      calculateNextDoseDate({
        lastDoseDate: '2026-01-10',
        minIntervalDays: '-5',
        referenceToday: '2026-02-01'
      }).ok
    ).toBe(false);
    expect(localStorage.length).toBe(0);

    expect(
      evaluateColdChainStatus({ currentC: null, minC: null, maxC: null, actionNote: '' })
    ).toBe('measurement_missing');
    expect(
      evaluateColdChainStatus({ currentC: 5, minC: null, maxC: null, sensorUncertain: true, actionNote: '' })
    ).toBe('sensor_or_device_uncertain');
    expect(
      evaluateColdChainStatus({ currentC: 5, minC: null, maxC: null, profileId: 'unspecified', actionNote: '' })
    ).toBe('awaiting_review');

    expect(FACILITY_CARE_CATEGORIES).toHaveLength(5);

    expect(escapeCsvField('＝SUM(1,1)')).toBe("'＝SUM(1,1)");
    expect(escapeCsvField(' =1+1')).toBe("' =1+1");
    expect(escapeCsvField('\n+1')).toBe(`"'\n+1"`);
    expect(escapeCsvField('Zażółć gęślą; "test"')).toBe(`"Zażółć gęślą; ""test"""`);
  });

  it('Etap C1.2: Matryca warunków przechowywania ChPL pkt 6.4 (10 produktów) i profile temperaturowe', () => {
    expect(PRODUCT_STORAGE_REFERENCE_MATRIX).toHaveLength(10);
    const infanrix = PRODUCT_STORAGE_REFERENCE_MATRIX.find((p) => p.vaccineId === 'vac-infanrix-hexa');
    expect(infanrix).toBeDefined();
    expect(infanrix?.profileId).toBe('standard_2_8');
    expect(infanrix?.qrdSection).toBe('6.4');
    expect(infanrix?.storageConditionText).toContain('2°C–8°C');

    const spikevax = PRODUCT_STORAGE_REFERENCE_MATRIX.find((p) => p.vaccineId === 'spikevax_xfg');
    expect(spikevax).toBeDefined();
    expect(spikevax?.profileId).toBe('frozen_minus25_minus15');

    // Walidacja profilu własnego z granicami custom
    const customValid = validateColdChainDraft({
      deviceLabel: 'Chłodziarka Specjalna',
      measuredAt: '2026-11-12T10:00',
      currentC: '-20.5',
      minC: '',
      maxC: '',
      profileId: 'custom_chpl',
      customMinC: '-25',
      customMaxC: '-15',
      actionNote: '',
      recordedBy: ''
    });
    expect(customValid.ok).toBe(true);
    if (customValid.ok) {
      expect(evaluateColdChainStatus(customValid.reading)).toBe('within_configured_range');
    }

    const customExcursion = validateColdChainDraft({
      deviceLabel: 'Chłodziarka Specjalna',
      measuredAt: '2026-11-12T10:00',
      currentC: '-10.0',
      minC: '',
      maxC: '',
      profileId: 'custom_chpl',
      customMinC: '-25',
      customMaxC: '-15',
      actionNote: '',
      recordedBy: ''
    });
    // Odrzuca brak notatki o działaniach przy odchyleniu
    expect(customExcursion.ok).toBe(false);

    // Walidacja niepewnego czujnika
    const uncertainReading = validateColdChainDraft({
      deviceLabel: 'Chłodziarka 1',
      measuredAt: '2026-11-12T10:00',
      currentC: '5.0',
      minC: '',
      maxC: '',
      sensorUncertain: true,
      actionNote: 'Zgłoszono serwisowi',
      recordedBy: ''
    });
    expect(uncertainReading.ok).toBe(true);
    if (uncertainReading.ok) {
      expect(evaluateColdChainStatus(uncertainReading.reading)).toBe('sensor_or_device_uncertain');
    }
  });

  it('Etap C1.2: Pełna macierz 26 pozycji zestawu przeciwwstrząsowego wg Dz.U. 2026 poz. 429', () => {
    expect(EMERGENCY_KIT_REGULATION_ANNEX_26).toHaveLength(26);

    // Pozycja 1: Adrenalinum jest wymagana we wszystkich 5 kategoriach placówek
    const adrenaline = EMERGENCY_KIT_REGULATION_ANNEX_26.find((i) => i.itemNumber === 1);
    expect(adrenaline).toBeDefined();
    expect(adrenaline?.substanceName).toBe('Adrenalinum');
    FACILITY_CARE_CATEGORIES.forEach((cat) => {
      expect(adrenaline?.requirements[cat.id]).toBe(true);
    });

    // Dopamina (poz. 10) jest wymagana wyłącznie w szpitalach
    const dopamine = EMERGENCY_KIT_REGULATION_ANNEX_26.find((i) => i.itemNumber === 10);
    expect(dopamine).toBeDefined();
    expect(dopamine?.requirements.hospital).toBe(true);
    expect(dopamine?.requirements.ambulatory_home).toBe(false);
    expect(dopamine?.requirements.ambulatory_dental).toBe(false);
    expect(dopamine?.requirements.ambulatory_facility).toBe(false);

    // Morfina (poz. 22) - wyłącznie stacjonarne całodobowe i szpital
    const morphine = EMERGENCY_KIT_REGULATION_ANNEX_26.find((i) => i.itemNumber === 22);
    expect(morphine).toBeDefined();
    expect(morphine?.requirements.hospital).toBe(true);
    expect(morphine?.requirements.ambulatory_home).toBe(false);
    expect(morphine?.requirements.ambulatory_dental).toBe(false);
    expect(morphine?.requirements.ambulatory_facility).toBe(false);

    // Każda z 26 pozycji posiada zdefiniowane wymagania dla wszystkich 5 kategorii
    EMERGENCY_KIT_REGULATION_ANNEX_26.forEach((item) => {
      expect(item.itemNumber).toBeGreaterThanOrEqual(1);
      expect(item.itemNumber).toBeLessThanOrEqual(26);
      expect(item.substanceName.length).toBeGreaterThan(0);
      expect(item.dosageForm.length).toBeGreaterThan(0);
      FACILITY_CARE_CATEGORIES.forEach((cat) => {
        expect(typeof item.requirements[cat.id]).toBe('boolean');
      });
    });
  });
});
