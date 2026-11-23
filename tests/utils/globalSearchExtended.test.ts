import { describe, it, expect } from 'vitest';
import { searchVaxNurseNavigation } from '../../src/utils/globalSearch';

describe('Global search indexing for ChPL and PSO', () => {
  it('indexes vaccine trade names and substance names from ChPL', () => {
    const infanrixResults = searchVaxNurseNavigation('Infanrix');
    expect(infanrixResults.length).toBeGreaterThan(0);
    const infanrix = infanrixResults.find(r => r.kind === 'vaccine');
    expect(infanrix).toBeDefined();
    expect(infanrix?.targetVaccineId).toBe('vac-infanrix-hexa');
    expect(infanrix?.targetModule).toBe('vaccines-database');
    expect(infanrix?.categoryLabel).toBe('Karta ChPL');

    const priorixResults = searchVaxNurseNavigation('Priorix');
    expect(priorixResults.some(r => r.kind === 'vaccine')).toBe(true);
  });

  it('indexes PSO structured sections and returns relevant clinical records', () => {
    const psoResults = searchVaxNurseNavigation('WZW B');
    expect(psoResults.length).toBeGreaterThan(0);
    expect(psoResults.some(r => r.kind === 'pso-section')).toBe(true);
  });
});
