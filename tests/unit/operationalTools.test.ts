import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildColdChainCsv,
  calculateAgeAt,
  calculateNextDoseDate,
  COLD_CHAIN_STORAGE_KEY,
  EMERGENCY_KIT_REGULATION_ANNEX_26,
  EMERGENCY_KIT_STORAGE_KEY,
  escapeCsvField,
  evaluateColdChainStatus,
  evaluateKitItemStatus,
  FACILITY_CARE_CATEGORIES,
  inspectOperationalStorageHealth,
  isSafeText,
  loadColdChainReadings,
  loadEmergencyKit,
  loadLocalChecklist,
  LOCAL_CHECKLIST_STORAGE_KEY,
  MAX_CHECKLIST_ITEMS,
  MAX_COLD_CHAIN_RECORDS,
  MAX_KIT_ITEMS,
  PRODUCT_STORAGE_REFERENCE_MATRIX,
  saveColdChainReadings,
  saveEmergencyKit,
  saveLocalChecklist,
  validateChecklistText,
  validateColdChainDraft,
  validateKitDraft,
  type ColdChainReading,
  type EmergencyKitItem,
  type LocalChecklistItem
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

  it('Etap C1.2: Matryca warunków przechowywania ChPL pkt 6.3–6.4 (10 produktów) i profile temperaturowe', () => {
    expect(PRODUCT_STORAGE_REFERENCE_MATRIX).toHaveLength(10);
    const infanrix = PRODUCT_STORAGE_REFERENCE_MATRIX.find((p) => p.vaccineId === 'vac-infanrix-hexa');
    expect(infanrix).toBeDefined();
    expect(infanrix?.profileId).toBe('standard_2_8');
    expect(infanrix?.qrdSection).toBe('6.3–6.4');
    expect(infanrix?.storageConditionText).toContain('2°C–8°C');

    const vaxigripTetra = PRODUCT_STORAGE_REFERENCE_MATRIX.find((p) => p.vaccineId === 'vac-vaxigrip-tetra');
    expect(vaxigripTetra?.sourceDocument).toContain('35346');
    expect(vaxigripTetra?.documentVersionOrDate).toBe('05/2025');
    expect(vaxigripTetra?.storageConditionText).toContain('brak adnotacji o stabilności poza 2°C–8°C');

    expect(PRODUCT_STORAGE_REFERENCE_MATRIX.find((p) => p.vaccineId === 'vac-priorix')?.sourceDocument).toContain('22425');
    expect(PRODUCT_STORAGE_REFERENCE_MATRIX.find((p) => p.vaccineId === 'vac-engerix-b')?.sourceDocument).toContain('19604');
    expect(PRODUCT_STORAGE_REFERENCE_MATRIX.find((p) => p.vaccineId === 'vac-boostrix')?.sourceDocument).toContain('21134');

    const spikevax = PRODUCT_STORAGE_REFERENCE_MATRIX.find((p) => p.vaccineId === 'spikevax_xfg');
    expect(spikevax).toBeDefined();
    expect(spikevax?.profileId).toBe('frozen_minus50_minus15');

    // Akceptacja temperatury ultraniskiej (-50°C) w profilu zamrożonym Spikevax
    const ultraColdValid = validateColdChainDraft({
      deviceLabel: 'Zamrażarka Ultra',
      measuredAt: '2026-11-12T10:00',
      currentC: '-50.0',
      minC: '-50',
      maxC: '-20',
      profileId: 'frozen_minus50_minus15',
      actionNote: '',
      recordedBy: ''
    });
    expect(ultraColdValid.ok).toBe(true);
    if (ultraColdValid.ok) {
      expect(evaluateColdChainStatus(ultraColdValid.reading)).toBe('within_configured_range');
    }

    // Odrzucenie profilu custom_chpl bez zdefiniowanych granic
    const customMissingBounds = validateColdChainDraft({
      deviceLabel: 'Chłodziarka Specjalna',
      measuredAt: '2026-11-12T10:00',
      currentC: '5.0',
      minC: '',
      maxC: '',
      profileId: 'custom_chpl',
      customMinC: '',
      customMaxC: '',
      actionNote: 'Weryfikacja',
      recordedBy: ''
    });
    expect(customMissingBounds.ok).toBe(false);

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

    // Pozycja 1: Adrenalinum i poz. 3 Aqua pro injectione wymagane we wszystkich 5 kategoriach
    const adrenaline = EMERGENCY_KIT_REGULATION_ANNEX_26.find((i) => i.itemNumber === 1);
    expect(adrenaline?.substanceName).toBe('Adrenalinum');
    const aqua = EMERGENCY_KIT_REGULATION_ANNEX_26.find((i) => i.itemNumber === 3);
    expect(aqua?.substanceName).toBe('Aqua pro injectione');
    FACILITY_CARE_CATEGORIES.forEach((cat) => {
      expect(adrenaline?.requirements[cat.id]).toBe(true);
      expect(aqua?.requirements[cat.id]).toBe(true);
    });

    // Poz. 7 Furosemidum i poz. 20 Oxygenium: wymagane od stomatologii wzwyż, nie w świadczeniach w domu chorego
    const furosemid = EMERGENCY_KIT_REGULATION_ANNEX_26.find((i) => i.itemNumber === 7);
    expect(furosemid?.substanceName).toBe('Furosemidum');
    expect(furosemid?.requirements.ambulatory_home).toBe(false);
    expect(furosemid?.requirements.ambulatory_dental).toBe(true);
    const oxygen = EMERGENCY_KIT_REGULATION_ANNEX_26.find((i) => i.itemNumber === 20);
    expect(oxygen?.substanceName).toBe('Oxygenium');
    expect(oxygen?.requirements.ambulatory_home).toBe(false);
    expect(oxygen?.requirements.ambulatory_dental).toBe(true);

    // Poz. 12 Lidocaini hydrochloridum 2 %: wyłącznie stacjonarne i szpital
    const lidocaine = EMERGENCY_KIT_REGULATION_ANNEX_26.find((i) => i.itemNumber === 12);
    expect(lidocaine?.substanceName).toBe('Lidocaini hydrochloridum 2 %');
    expect(lidocaine?.requirements.ambulatory_dental).toBe(false);
    expect(lidocaine?.requirements.inpatient_non_hospital).toBe(true);
    expect(lidocaine?.requirements.hospital).toBe(true);

    // Poz. 15 Morphini sulfas, poz. 16 Naloxoni hydrochloridum, poz. 19 Noradrenalinum: wyłącznie szpital
    for (const num of [15, 16, 19]) {
      const hospitalOnly = EMERGENCY_KIT_REGULATION_ANNEX_26.find((i) => i.itemNumber === num);
      expect(hospitalOnly?.requirements.hospital).toBe(true);
      expect(hospitalOnly?.requirements.inpatient_non_hospital).toBe(false);
      expect(hospitalOnly?.requirements.ambulatory_facility).toBe(false);
    }

    // Rozróżnienie dwóch pozycji Natrii chloridum 0,9 % (poz. 17 rozpuszczalnik, poz. 25 płyn infuzyjny)
    const nacl17 = EMERGENCY_KIT_REGULATION_ANNEX_26.find((i) => i.itemNumber === 17);
    const nacl25 = EMERGENCY_KIT_REGULATION_ANNEX_26.find((i) => i.itemNumber === 25);
    expect(nacl17?.substanceName).toBe('Natrii chloridum 0,9 %');
    expect(nacl25?.substanceName).toBe('Natrii chloridum 0,9 %');
    expect(nacl17?.dosageForm).not.toBe(nacl25?.dosageForm);

    // Każda z 26 pozycji posiada zdefiniowane wymagania dla wszystkich 5 kategorii i numer 1..26 bez luk
    expect(EMERGENCY_KIT_REGULATION_ANNEX_26.map((i) => i.itemNumber)).toEqual(
      Array.from({ length: 26 }, (_, idx) => idx + 1)
    );
    EMERGENCY_KIT_REGULATION_ANNEX_26.forEach((item) => {
      expect(item.substanceName.length).toBeGreaterThan(0);
      expect(item.dosageForm.length).toBeGreaterThan(0);
      FACILITY_CARE_CATEGORIES.forEach((cat) => {
        expect(typeof item.requirements[cat.id]).toBe('boolean');
      });
    });
  });

  it('regresje audytu: walidacja kalkulatora (referenceToday, zera wiodące, plannedDate < lastDoseDate, limit 10 lat), bezpieczeństwo tekstu, prototyp profilu, CSV i przepełnienie zapisu', () => {
    // 1. Błędne referenceToday, zera wiodące, zbyt duży interwał > 10 lat oraz plannedDate < lastDoseDate
    expect(
      calculateNextDoseDate({
        lastDoseDate: '2026-10-01',
        minIntervalDays: '28',
        referenceToday: '2026-02-31'
      }).ok
    ).toBe(false);
    expect(
      calculateNextDoseDate({
        lastDoseDate: '2026-10-01',
        minIntervalDays: '0028',
        referenceToday: '2026-10-15'
      }).ok
    ).toBe(false);
    expect(
      calculateNextDoseDate({
        lastDoseDate: '2026-10-01',
        minIntervalDays: '11',
        intervalUnit: 'years',
        referenceToday: '2026-10-15'
      }).ok
    ).toBe(false);
    expect(
      calculateNextDoseDate({
        lastDoseDate: '2026-10-01',
        minIntervalDays: '10',
        intervalUnit: 'years',
        referenceToday: '2026-10-15'
      }).ok
    ).toBe(true);
    const beforeLast = calculateNextDoseDate({
      lastDoseDate: '2026-10-10',
      minIntervalDays: '28',
      plannedDate: '2026-10-05',
      referenceToday: '2026-10-15'
    });
    expect(beforeLast.ok).toBe(false);
    expect(beforeLast.errors.join(' ')).toMatch(/wcześniejsza niż data ostatniej dawki/i);

    // 2. Bezpieczeństwo tekstu: dozwolone "online=true" / "onboard_2027", blokowane svg/vbscript/data:text/html i spacje w schemacie
    expect(isSafeText('Status: online=true; onboard_checklist_2027')).toBe(true);
    expect(validateChecklistText('Monitoruj status online=true przed szczepieniem')).toBeNull();
    expect(isSafeText('<svg onload=alert(1)>')).toBe(false);
    expect(isSafeText('vbscript:msgbox(1)')).toBe(false);
    expect(isSafeText('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isSafeText('j a v a s c r i p t : alert(1)')).toBe(false);

    // 3. Ochrona przed kolizją z Object.prototype ("toString") oraz zachowanie alertu wychylenia mimo sensorUncertain
    const protoReading: ColdChainReading = {
      id: 'cc-proto',
      measuredAt: '2026-11-10T08:00',
      deviceLabel: 'Chłodziarka 1',
      profileId: 'toString' as never,
      currentC: 4,
      minC: 4,
      maxC: 4,
      sensorUncertain: false,
      actionNote: '',
      recordedBy: 'Pielęgniarka',
      createdAt: '2026-11-10T08:00:00Z'
    };
    expect(evaluateColdChainStatus(protoReading)).toBe('awaiting_review');

    const excursionEvenUncertain: ColdChainReading = {
      id: 'cc-exc-uncertain',
      measuredAt: '2026-11-10T08:30',
      deviceLabel: 'Chłodziarka 1',
      profileId: 'standard_2_8',
      currentC: 11.4,
      minC: 2,
      maxC: 11.4,
      sensorUncertain: true,
      actionNote: '',
      recordedBy: 'Pielęgniarka',
      createdAt: '2026-11-10T08:30:00Z'
    };
    expect(evaluateColdChainStatus(excursionEvenUncertain)).toBe('above_configured_range');

    const invalidBoundsRes = validateColdChainDraft({
      measuredAt: '2026-11-10T09:00',
      deviceLabel: 'Chłodziarka 1',
      profileId: 'standard_2_8',
      currentC: '12',
      minC: '2',
      maxC: '8',
      sensorUncertain: false,
      actionNote: 'Sprawdzono',
      recordedBy: 'Pielęgniarka'
    });
    expect(invalidBoundsRes.ok).toBe(false);
    if (!invalidBoundsRes.ok) {
      expect(invalidBoundsRes.errors.some((e) => /wyższa niż maksymalna/i.test(e))).toBe(true);
    }

    // 4. Ochrona CSV dla spacji Unicode, BOM, osadzonych wyzwalaczy i znaków specjalnych
    expect(escapeCsvField('\u3000=1+1')).toBe("'\u3000=1+1");
    expect(escapeCsvField('\uFEFF+1')).toBe(`"'\uFEFF+1"`);
    expect(escapeCsvField('ok\n=CMD()')).toBe(`"ok\n'=CMD()"`);
    expect(escapeCsvField('a\tb')).toBe('"a\tb"');

    // 5. Status not_assessed przy pustej dacie ważności oraz odrzucenie zapisu ponad limit MAX_* i diagnostyka uszkodzonego JSON
    const unassessedKitItem: EmergencyKitItem = {
      id: 'kit-unassessed',
      name: 'Adrenalinum',
      quantity: 2,
      expiryDate: '',
      lastCheckedAt: null
    };
    expect(evaluateKitItemStatus(unassessedKitItem, '2026-11-10')).toBe('not_assessed');
    expect(
      validateKitDraft({
        name: 'Adrenalinum',
        quantity: '2',
        expiryDate: '2027-06-30'
      }).ok
    ).toBe(true);

    localStorage.clear();
    localStorage.setItem(LOCAL_CHECKLIST_STORAGE_KEY, '{broken');
    localStorage.setItem(COLD_CHAIN_STORAGE_KEY, '{broken');
    expect(inspectOperationalStorageHealth(localStorage, LOCAL_CHECKLIST_STORAGE_KEY)).toBe(true);
    expect(inspectOperationalStorageHealth(localStorage, COLD_CHAIN_STORAGE_KEY)).toBe(true);
    expect(loadLocalChecklist(localStorage)).toEqual([]);
    expect(loadColdChainReadings(localStorage)).toEqual([]);

    // Deduplikacja po normalizacji ID (wiodące/końcowe spacje)
    localStorage.setItem(
      LOCAL_CHECKLIST_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: '1.0.0',
        items: [
          { id: ' chk-1 ', text: 'Pierwszy punkt checklisty', done: true },
          { id: 'chk-1', text: 'Duplikat checklisty', done: false }
        ]
      })
    );
    const loadedChecklist = loadLocalChecklist(localStorage);
    expect(loadedChecklist).toHaveLength(1);
    expect(loadedChecklist[0].id).toBe('chk-1');

    localStorage.setItem(
      EMERGENCY_KIT_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: '1.0.0',
        items: [
          { id: ' k-1 ', name: 'Aqua pro inj.', quantity: 1, expiryDate: '', lastCheckedAt: null },
          { id: 'k-1', name: 'Duplikat', quantity: 2, expiryDate: '', lastCheckedAt: null }
        ]
      })
    );
    const loadedKit = loadEmergencyKit(localStorage);
    expect(loadedKit).toHaveLength(1);
    expect(loadedKit[0].id).toBe('k-1');

    // Przepełnienie ponad limit -> brak cichego ucinania
    const tooManyReadings: ColdChainReading[] = Array.from(
      { length: MAX_COLD_CHAIN_RECORDS + 1 },
      (_, idx) => ({
        ...protoReading,
        id: `cc-${idx}`,
        profileId: 'standard_2_8'
      })
    );
    expect(saveColdChainReadings(localStorage, tooManyReadings).success).toBe(false);
    expect(loadColdChainReadings(localStorage)).toEqual([]);

    const tooManyChecklist: LocalChecklistItem[] = Array.from(
      { length: MAX_CHECKLIST_ITEMS + 1 },
      (_, idx) => ({
        id: `c-${idx}`,
        text: `Punkt kontrolny nr ${idx}`,
        done: false
      })
    );
    expect(saveLocalChecklist(localStorage, tooManyChecklist).success).toBe(false);

    const tooManyKit: EmergencyKitItem[] = Array.from({ length: MAX_KIT_ITEMS + 1 }, (_, idx) => ({
      ...unassessedKitItem,
      id: `kit-${idx}`
    }));
    expect(saveEmergencyKit(localStorage, tooManyKit).success).toBe(false);
  });

  it('akceptuje jawny znak + w temperaturach łańcucha chłodniczego (+2, +4,5, +8) i odrzuca niepoprawne wartości (+51, ++4)', () => {
    for (const validTemp of ['+2', '+4,5', '+8']) {
      const res = validateColdChainDraft({
        deviceLabel: 'Chłodziarka A1',
        measuredAt: '2026-11-22T05:00',
        currentC: validTemp,
        minC: '+2',
        maxC: '+8',
        profileId: 'standard_2_8',
        actionNote: '',
        recordedBy: 'P.M.'
      });
      expect(res.ok, `Powinno zaakceptować ${validTemp}`).toBe(true);
    }

    for (const invalidTemp of ['+51', '++4']) {
      const res = validateColdChainDraft({
        deviceLabel: 'Chłodziarka A1',
        measuredAt: '2026-11-22T05:00',
        currentC: invalidTemp,
        minC: '+2',
        maxC: '+8',
        profileId: 'standard_2_8',
        actionNote: 'Sprawdzenie graniczne',
        recordedBy: 'P.M.'
      });
      expect(res.ok, `Powinno odrzucić ${invalidTemp}`).toBe(false);
    }
  });
});
