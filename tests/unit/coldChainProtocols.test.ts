import { describe, it, expect } from 'vitest';
import {
  WHO_SHAKE_TEST_PROTOCOL,
  VACCINE_TEMPERATURE_SENSITIVITY_MATRIX,
  ICE_PACK_CONDITIONING_STEPS
} from '../../src/utils/operationalTools';

describe('Protokoły łańcucha chłodniczego (WHO Shake Test & Matryca Wrażliwości)', () => {
  it('posiada kompletny 5-krokowy protokół testu wstrząsania WHO', () => {
    expect(WHO_SHAKE_TEST_PROTOCOL).toHaveLength(5);
    const steps = WHO_SHAKE_TEST_PROTOCOL.map((s) => s.stepNumber);
    expect(steps).toEqual([1, 2, 3, 4, 5]);

    // Krok 1 wymaga zamrożonej próbki kontrolnej
    expect(WHO_SHAKE_TEST_PROTOCOL[0].instruction).toContain('-20°C');
    expect(WHO_SHAKE_TEST_PROTOCOL[0].criticalAlert).toBeDefined();

    // Krok 5 zawiera jasną interpretację wyniku negatywnego i pozytywnego
    expect(WHO_SHAKE_TEST_PROTOCOL[4].observation).toContain('WYNIK NEGATYWNY');
    expect(WHO_SHAKE_TEST_PROTOCOL[4].observation).toContain('WYNIK POZYTYWNY');
  });

  it('definiuje matrycę wrażliwości preparatów z podziałem na mróz i ciepło', () => {
    expect(VACCINE_TEMPERATURE_SENSITIVITY_MATRIX.length).toBeGreaterThanOrEqual(8);

    // Szczepionki z adiuwantem glinowym muszą mieć krytyczną wrażliwość na mróz
    const hepb = VACCINE_TEMPERATURE_SENSITIVITY_MATRIX.find((v) => v.id === 'sens-hepb');
    expect(hepb).toBeDefined();
    expect(hepb?.freezingSensitivity).toBe('critical');
    expect(hepb?.shakeTestApplicable).toBe(true);
    expect(hepb?.adjuvantType).toContain('glinu');

    const dtp = VACCINE_TEMPERATURE_SENSITIVITY_MATRIX.find((v) => v.id === 'sens-dtp-comb');
    expect(dtp).toBeDefined();
    expect(dtp?.freezingSensitivity).toBe('critical');
    expect(dtp?.shakeTestApplicable).toBe(true);

    // Szczepionki liofilizowane żywe (MMR, Ospa wietrzna) mają niską wrażliwość na mróz liofilizatu, lecz krytyczną na ciepło
    const mmr = VACCINE_TEMPERATURE_SENSITIVITY_MATRIX.find((v) => v.id === 'sens-mmr');
    expect(mmr).toBeDefined();
    expect(mmr?.freezingSensitivity).toBe('low');
    expect(mmr?.heatSensitivity).toBe('critical');
    expect(mmr?.shakeTestApplicable).toBe(false);
  });

  it('zawiera 4 kluczowe zasady kondycjonowania wkładów chłodzących (sweating)', () => {
    expect(ICE_PACK_CONDITIONING_STEPS).toHaveLength(4);
    expect(ICE_PACK_CONDITIONING_STEPS[1].title).toContain('sweating');
    expect(ICE_PACK_CONDITIONING_STEPS[2].description).toContain('0°C');
  });
});
