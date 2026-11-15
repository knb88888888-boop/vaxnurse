import { describe, it, expect } from 'vitest';
import { VACCINES_CATALOG } from '../../src/data/vaccinesCatalog';
import { STAGE1_CHPL_AUDIT_BUNDLE } from '../../src/data/chplStage1AuditSheets';
import {
  CATALOG_DATA_VERSION,
  mergeVaccineCatalogWithStorage
} from '../../src/utils/catalogMerge';
import {
  VAX_STORAGE_KEY,
  loadVaccinesFromStorage
} from '../../src/utils/vaccineVerification';
import {
  enforceClinicalIntegrityOnImport,
  mergeImportedBackupWithLocalCatalog
} from '../../src/utils/backup';
import type { VaccineProduct } from '../../src/types/vaccines';

const buildLegacyVaxigripTetraSnapshot = (): VaccineProduct => {
  const current = VACCINES_CATALOG.find((v) => v.id === 'vac-vaxigrip-tetra');
  if (!current) {
    throw new Error('Brak rekordu vac-vaxigrip-tetra w VACCINES_CATALOG');
  }

  const legacy = structuredClone(current);
  legacy.atcCode = 'J07CA01';
  legacy.catalogDataVersion = '2026.11.11';
  legacy.chpl.pharmacologicalProperties.pharmacodynamics = {
    ...legacy.chpl.pharmacologicalProperties.pharmacodynamics,
    content: 'Kod ATC: J07CA01 (Grupa farmakoterapeutyczna: szczepionki)',
    officialSource: 'RPL',
    pdfPageNumber: null,
    sourceDocumentUrl: null,
    verificationNote: 'Sekcja oczekuje na weryfikację zgodnie z aktualnym ChPL z rejestru RPL.',
    verificationStatus: 'uncompleted'
  };
  return legacy;
};

describe('Regresja korekty kodu ATC VaxigripTetra (MASTER 14)', () => {
  it('vac-vaxigrip-tetra posiada zweryfikowany kod ATC J07BB02 i udokumentowane źródło ChPL/AOTMiT bez zmiany statusu klinicznego', () => {
    const vaxigrip = VACCINES_CATALOG.find((v) => v.id === 'vac-vaxigrip-tetra');
    expect(vaxigrip).toBeDefined();
    expect(vaxigrip?.tradeName).toBe('VaxigripTetra');
    expect(vaxigrip?.atcCode).toBe('J07BB02');
    expect(vaxigrip?.verificationStatus).toBe('uncompleted');

    const sec51 = vaxigrip?.chpl.pharmacologicalProperties.pharmacodynamics;
    expect(sec51?.content).toContain('J07BB02');
    expect(sec51?.content).not.toContain('J07CA01');
    expect(sec51?.verificationStatus).toBe('uncompleted');
    expect(sec51?.sourceDocumentUrl).toBe('https://leki.urpl.gov.pl/files/81_VaxigripTetra.pdf');
    expect(sec51?.officialSource).toContain('007_OTOW.4130.3.2026_Vaxigrip_APD.pdf');
    expect(sec51?.officialSource).toContain('Tabela 27');
    expect(sec51?.pdfPageNumber).toContain('5.1');
    expect(sec51?.pdfPageNumber).toContain('93');

    // Pozostałe pola kliniczne ChPL nie zostały omyłkowo zatwierdzone
    expect(vaxigrip?.chpl.clinicalParticulars.indications.verificationStatus).toBe('uncompleted');
    expect(vaxigrip?.chpl.clinicalParticulars.dosageAndAdministration.verificationStatus).toBe(
      'uncompleted'
    );
  });

  it('scalanie katalogu (mergeVaccineCatalogWithStorage) i odczyt localStorage migrują J07CA01 do J07BB02 bez fałszywego konfliktu', () => {
    const legacy = buildLegacyVaxigripTetraSnapshot();

    const mergeRes = mergeVaccineCatalogWithStorage(VACCINES_CATALOG, [legacy], {
      baseCatalogVersion: CATALOG_DATA_VERSION
    });
    const mergedVaxigrip = mergeRes.vaccines.find((v) => v.id === 'vac-vaxigrip-tetra');

    expect(mergedVaxigrip?.atcCode).toBe('J07BB02');
    expect(mergedVaxigrip?.chpl.pharmacologicalProperties.pharmacodynamics.content).toContain(
      'J07BB02'
    );
    expect(mergedVaxigrip?.chpl.pharmacologicalProperties.pharmacodynamics.content).not.toContain(
      'J07CA01'
    );
    expect(
      mergedVaxigrip?.chpl.pharmacologicalProperties.pharmacodynamics.sourceDocumentUrl
    ).toBe('https://leki.urpl.gov.pl/files/81_VaxigripTetra.pdf');
    expect(mergedVaxigrip?.mergeConflict).toBeUndefined();
    expect(mergeRes.conflictIds).not.toContain('vac-vaxigrip-tetra');

    const fakeStorage = {
      getItem: (key: string) =>
        key === VAX_STORAGE_KEY
          ? JSON.stringify({
              formatVersion: 2,
              catalogDataVersion: '2026.11.11',
              vaccines: [legacy]
            })
          : null
    };
    const loaded = loadVaccinesFromStorage(fakeStorage, VACCINES_CATALOG);
    const loadedVaxigrip = loaded.vaccines.find((v) => v.id === 'vac-vaxigrip-tetra');

    expect(loadedVaxigrip?.atcCode).toBe('J07BB02');
    expect(loadedVaxigrip?.chpl.pharmacologicalProperties.pharmacodynamics.content).toContain(
      'J07BB02'
    );
  });

  it('import kopii zapasowej (enforceClinicalIntegrityOnImport oraz mergeImportedBackupWithLocalCatalog) nie przywraca J07CA01', () => {
    const legacy = buildLegacyVaxigripTetraSnapshot();

    const enforced = enforceClinicalIntegrityOnImport([legacy], VACCINES_CATALOG);
    const enforcedVaxigrip = enforced.find((v) => v.id === 'vac-vaxigrip-tetra');
    expect(enforcedVaxigrip?.atcCode).toBe('J07BB02');
    expect(enforcedVaxigrip?.chpl.pharmacologicalProperties.pharmacodynamics.content).toContain(
      'J07BB02'
    );
    expect(
      enforcedVaxigrip?.chpl.pharmacologicalProperties.pharmacodynamics.sourceDocumentUrl
    ).toBe('https://leki.urpl.gov.pl/files/81_VaxigripTetra.pdf');

    const restored = mergeImportedBackupWithLocalCatalog([legacy], [legacy]);
    const restoredVaxigrip = restored.vaccines.find((v) => v.id === 'vac-vaxigrip-tetra');
    expect(restoredVaxigrip?.atcCode).toBe('J07BB02');
    expect(restoredVaxigrip?.chpl.pharmacologicalProperties.pharmacodynamics.content).toContain(
      'J07BB02'
    );
    expect(restoredVaxigrip?.mergeConflict).toBeUndefined();
  });

  it('zachowuje otwarte rozbieżności ChPL Infanrix hexa, 8 otwartych decyzji audytora oraz verified_full = 0', () => {
    const infanrix = VACCINES_CATALOG.find((v) => v.id === 'vac-infanrix-hexa');
    expect(infanrix?.verificationStatus).toBe('requires_source_clarification');

    const disc = infanrix?.sourceDiscrepancies?.find(
      (d) => d.id === 'disc-phenylalanine-content-01'
    );
    expect(disc).toBeDefined();
    expect(disc?.status).toBe('requires_clarification');
    expect(disc?.firstValue).toContain('0,0289');
    expect(disc?.secondValue).toContain('0,0298');

    expect(STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist).toHaveLength(8);
    for (const item of STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist) {
      expect(item.autoResolved).toBe(false);
      expect(item.requiresCompetentClinicalAuditorDecision).toBe(true);
    }

    const verifiedFullCount = VACCINES_CATALOG.filter(
      (v) =>
        v.verificationStatus === 'verified_chpl' ||
        String(v.verificationStatus) === 'verified_full'
    ).length;
    expect(verifiedFullCount).toBe(0);
  });
});
