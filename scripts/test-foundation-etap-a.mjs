/**
 * Kompleksowy skrypt weryfikacyjny MASTER 02 (Etap A)
 * Uruchomienie:
 *   node --experimental-strip-types scripts/test-foundation-etap-a.mjs
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

import { VACCINES_CATALOG } from '../src/data/vaccinesCatalog.ts';
import {
  CATALOG_DATA_VERSION,
  VAX_CATALOG_META_KEY,
  mergeVaccineCatalogWithStorage,
  inspectChplCompleteness,
  findDuplicateVaccineIds
} from '../src/utils/catalogMerge.ts';
import {
  VAX_STORAGE_KEY,
  loadVaccinesFromStorage,
  saveVaccinesToStorage,
  applyFinalChplApproval
} from '../src/utils/vaccineVerification.ts';
import {
  createBackupPayload,
  validateBackupPayload,
  enforceClinicalIntegrityOnImport,
  mergeImportedBackupWithLocalCatalog,
  calculateBackupSummary
} from '../src/utils/backup.ts';
import {
  PREFERENCES_STORAGE_KEY,
  DEFAULT_APP_PREFERENCES,
  loadPreferences,
  savePreferences,
  resetPreferences,
  applyPreferencesToDocument
} from '../src/utils/preferences.ts';
import {
  RECENT_MODULES_STORAGE_KEY,
  MAX_RECENT_MODULES,
  loadRecentModuleVisits,
  recordModuleVisit,
  clearRecentModuleVisits,
  formatRecentVisitTimestamp
} from '../src/utils/recentModules.ts';
import {
  PLACEHOLDER_MODULE_IDS,
  isModulePlaceholder,
  searchVaxNurseNavigation
} from '../src/utils/globalSearch.ts';

const PROJECT_ROOT = path.resolve(import.meta.dirname, '..');

class MemoryStorage {
  constructor(initial = {}) {
    this.map = new Map(Object.entries(initial));
  }
  getItem(key) {
    return this.map.has(key) ? this.map.get(key) : null;
  }
  setItem(key, value) {
    this.map.set(key, String(value));
  }
  removeItem(key) {
    this.map.delete(key);
  }
}

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log(`PASS: ${name}`);
}

const cloneCatalog = () => JSON.parse(JSON.stringify(VACCINES_CATALOG));

const makeCompleteChpl = (baseChpl, targetStatus = 'verified_chpl') => {
  const c = structuredClone(baseChpl);
  const stamp = section => {
    section.content = section.content || 'Zweryfikowana treść referencyjna ChPL.';
    section.verificationStatus = targetStatus;
    section.verificationNote = 'Zweryfikowano na potrzeby testu';
  };
  stamp(c.name);
  stamp(c.composition);
  stamp(c.pharmaceuticalForm);
  stamp(c.clinicalParticulars.indications);
  stamp(c.clinicalParticulars.dosageAndAdministration);
  stamp(c.clinicalParticulars.contraindications);
  stamp(c.clinicalParticulars.warningsAndPrecautions);
  stamp(c.clinicalParticulars.interactions);
  stamp(c.clinicalParticulars.fertilityPregnancyLactation);
  stamp(c.clinicalParticulars.driveAndMachines);
  stamp(c.clinicalParticulars.undesirableEffects);
  stamp(c.clinicalParticulars.overdose);
  stamp(c.pharmacologicalProperties.pharmacodynamics);
  stamp(c.pharmacologicalProperties.pharmacokinetics);
  stamp(c.pharmacologicalProperties.preclinicalSafety);
  stamp(c.pharmaceuticalParticulars.excipients);
  stamp(c.pharmaceuticalParticulars.incompatibilities);
  stamp(c.pharmaceuticalParticulars.shelfLife);
  stamp(c.pharmaceuticalParticulars.storageSpecialPrecautions);
  stamp(c.pharmaceuticalParticulars.containerNatureAndContents);
  stamp(c.pharmaceuticalParticulars.disposalAndHandling);
  stamp(c.marketingAuthorisationHolder);
  stamp(c.marketingAuthorisationNumber);
  stamp(c.firstAuthorisationAndRenewal);
  stamp(c.revisionDate);
  return c;
};

console.log('================================================================');
console.log('   ETAP A – FOUNDATION, MERGE, BACKUP, PREFERENCES & UX TESTS   ');
console.log('================================================================\n');

// =========================================================================
// CZĘŚĆ A: 14 SCENARIUSZY LOCALSTORAGE I DETERMINISTYCZNEGO SCALANIA (4.8)
// =========================================================================

test('L1: Pusty localStorage -> załadowanie pełnego domyślnego katalogu i Infanrix hexa', () => {
  const storage = new MemoryStorage();
  const res = loadVaccinesFromStorage(storage, VACCINES_CATALOG);
  assert.equal(res.error, null);
  assert.equal(res.loadedFromStorage, false);
  assert.equal(res.vaccines.length, VACCINES_CATALOG.length);
  const infanrix = res.vaccines.find(v => v.id === 'vac-infanrix-hexa');
  assert.ok(infanrix);
  assert.equal(infanrix.verificationStatus, 'requires_source_clarification');
});

test('L2: Stary podzbiór katalogu w pamięci -> bezpieczne dodanie nowych produktów bazowych', () => {
  const storage = new MemoryStorage();
  const oldSubset = cloneCatalog().slice(0, 3);
  storage.setItem(VAX_STORAGE_KEY, JSON.stringify(oldSubset));

  const res = loadVaccinesFromStorage(storage, VACCINES_CATALOG);
  assert.equal(res.error, null);
  assert.equal(res.loadedFromStorage, true);
  assert.equal(res.vaccines.length, VACCINES_CATALOG.length);
  assert.equal(res.mergeResult.addedIds.length, VACCINES_CATALOG.length - 3);
});

test('L3: Istniejący lokalny status pośredni zostaje zachowany przy odczycie/scaleniu', () => {
  const storage = new MemoryStorage();
  const local = cloneCatalog();
  const priorix = local.find(v => v.id === 'vac-priorix');
  priorix.verificationStatus = 'ready_for_manual_verification';
  priorix.userVerificationNotes = 'Lokalna robocza ocena pielęgniarska';
  storage.setItem(VAX_STORAGE_KEY, JSON.stringify(local));

  const res = loadVaccinesFromStorage(storage, VACCINES_CATALOG);
  const mergedPriorix = res.vaccines.find(v => v.id === 'vac-priorix');
  assert.equal(mergedPriorix.verificationStatus, 'ready_for_manual_verification');
  assert.equal(mergedPriorix.userVerificationNotes, 'Lokalna robocza ocena pielęgniarska');
});

test('L4: Istniejąca historia zmian zostaje w pełni zachowana bez duplikacji', () => {
  const storage = new MemoryStorage();
  const local = cloneCatalog();
  const inf = local.find(v => v.id === 'vac-infanrix-hexa');
  inf.statusHistory = [
    {
      id: 'h-local-1',
      timestamp: '2026-11-11 10:00',
      previousStatus: 'requires_source_clarification',
      newStatus: 'requires_source_clarification',
      reason: 'Wpis lokalnej kontroli okresowej',
      author: 'Pielęgniarka Dyżurna'
    },
    ...(inf.statusHistory || [])
  ];
  storage.setItem(VAX_STORAGE_KEY, JSON.stringify(local));

  const res = loadVaccinesFromStorage(storage, VACCINES_CATALOG);
  const mergedInf = res.vaccines.find(v => v.id === 'vac-infanrix-hexa');
  assert.ok(mergedInf.statusHistory.some(e => e.id === 'h-local-1'));
  assert.equal(
    mergedInf.statusHistory.filter(e => e.id === 'h-local-1').length,
    1
  );
});

test('L5: Istniejące formularze wyjaśnień i resolution zostają zachowane po scaleniu', () => {
  const storage = new MemoryStorage();
  const local = cloneCatalog();
  const inf = local.find(v => v.id === 'vac-infanrix-hexa');
  inf.clarificationDocument = 'URPL/TEST/2026/01';
  inf.clarificationDate = '2026-11-10';
  inf.clarificationSource = 'URPL';
  inf.sourceDiscrepancies[0].status = 'clarification_submitted';
  inf.sourceDiscrepancies[0].resolution = {
    documentId: 'URPL/TEST/2026/01',
    issuer: 'URPL',
    documentDate: '2026-11-09',
    receivedDate: '2026-11-10',
    conclusion: 'Fenyloalanina po korekcie wynosi 0,0298 µg',
    documentUrlOrLocation: 'https://rejestrymedyczne.ezdrowie.gov.pl/test',
    submittedAt: '2026-11-10 12:00'
  };
  storage.setItem(VAX_STORAGE_KEY, JSON.stringify(local));

  const res = loadVaccinesFromStorage(storage, VACCINES_CATALOG);
  const mergedInf = res.vaccines.find(v => v.id === 'vac-infanrix-hexa');
  assert.equal(mergedInf.clarificationDocument, 'URPL/TEST/2026/01');
  assert.equal(mergedInf.sourceDiscrepancies[0].status, 'clarification_submitted');
  assert.equal(mergedInf.sourceDiscrepancies[0].resolution.documentId, 'URPL/TEST/2026/01');
});

test('L6: Duplikat ID w pamięci lub przy zapisie -> bezpieczne wykrycie i blokada nadpisania', () => {
  const dupList = [cloneCatalog()[0], cloneCatalog()[0]];
  assert.deepEqual(findDuplicateVaccineIds(dupList), [dupList[0].id]);

  const storage = new MemoryStorage({ [VAX_STORAGE_KEY]: JSON.stringify(dupList) });
  const loadRes = loadVaccinesFromStorage(storage, VACCINES_CATALOG);
  assert.ok(loadRes.error);
  assert.ok(loadRes.mergeResult.duplicateIds.includes(dupList[0].id));

  const previousRaw = JSON.stringify(cloneCatalog());
  const protectedStorage = new MemoryStorage({ [VAX_STORAGE_KEY]: previousRaw });
  const saveRes = saveVaccinesToStorage(protectedStorage, dupList);
  assert.equal(saveRes.success, false);
  assert.equal(protectedStorage.getItem(VAX_STORAGE_KEY), previousRaw);
});

test('L7: Nieznany prawidłowy lokalny rekord użytkownika zostaje zachowany po scaleniu', () => {
  const customRecord = {
    ...cloneCatalog()[1],
    id: 'vac-custom-local-test',
    tradeName: 'Custom Vaccine Local'
  };
  const merged = mergeVaccineCatalogWithStorage(VACCINES_CATALOG, [
    ...cloneCatalog(),
    customRecord
  ]);
  assert.ok(merged.customLocalIds.includes('vac-custom-local-test'));
  assert.ok(merged.vaccines.some(v => v.id === 'vac-custom-local-test'));
});

test('L8: Aktualizacja danych bazowych nie nadpisuje bezwarunkowo edytowanej treści lokalnej', () => {
  const baselineSnapshotById = Object.fromEntries(
    cloneCatalog().map(v => [v.id, v])
  );
  const modifiedBase = cloneCatalog();
  const basePriorix = modifiedBase.find(v => v.id === 'vac-priorix');
  basePriorix.manufacturer = 'GSK Updated From App Update';

  const local = cloneCatalog();
  const localPriorix = local.find(v => v.id === 'vac-priorix');
  localPriorix.userVerificationNotes = 'Własne notatki punktu szczepień';
  localPriorix.manufacturer = 'GSK Lokalna korekta notatki';

  const merged = mergeVaccineCatalogWithStorage(modifiedBase, local, {
    baselineSnapshotById,
    baseCatalogVersion: '2026.12.01-test'
  });
  const mergedPriorix = merged.vaccines.find(v => v.id === 'vac-priorix');
  assert.equal(mergedPriorix.manufacturer, 'GSK Lokalna korekta notatki');
  assert.equal(mergedPriorix.userVerificationNotes, 'Własne notatki punktu szczepień');
  assert.ok(mergedPriorix.mergeConflict);
});

test('L9: Konflikt statusu -> brak automatycznego awansu do verified_chpl ani downgrade’u', () => {
  const baselineSnapshotById = Object.fromEntries(
    cloneCatalog().map(v => [v.id, v])
  );
  const updatedBase = cloneCatalog();
  const baseEngerix = updatedBase.find(v => v.id === 'vac-engerix-b');
  baseEngerix.verificationStatus = 'ready_for_manual_verification';

  const local = cloneCatalog();
  const localEngerix = local.find(v => v.id === 'vac-engerix-b');
  localEngerix.verificationStatus = 'pending_verification';
  localEngerix.userVerificationNotes = 'Lokalnie wstrzymane';

  const merged = mergeVaccineCatalogWithStorage(updatedBase, local, {
    baselineSnapshotById,
    storedCatalogVersion: CATALOG_DATA_VERSION,
    baseCatalogVersion: '2026.12.01-status-test'
  });
  const resEngerix = merged.vaccines.find(v => v.id === 'vac-engerix-b');
  assert.equal(resEngerix.verificationStatus, 'pending_verification');
  assert.ok(resEngerix.mergeConflict);
  assert.equal(resEngerix.mergeConflict.localVerificationStatus, 'pending_verification');
  assert.equal(resEngerix.mergeConflict.baseVerificationStatus, 'ready_for_manual_verification');
});

test('L10: Wielokrotne scalanie jest deterministyczne i idempotentne (identyczny wynik)', () => {
  const local = cloneCatalog();
  local[1].userVerificationNotes = 'Stała uwaga';
  const pass1 = mergeVaccineCatalogWithStorage(VACCINES_CATALOG, local);
  const pass2 = mergeVaccineCatalogWithStorage(VACCINES_CATALOG, pass1.vaccines);
  const pass3 = mergeVaccineCatalogWithStorage(VACCINES_CATALOG, pass2.vaccines);

  assert.equal(JSON.stringify(pass2.vaccines), JSON.stringify(pass1.vaccines));
  assert.equal(JSON.stringify(pass3.vaccines), JSON.stringify(pass2.vaccines));
});

test('L11: QuotaExceededError przy zapisie -> zachowanie poprzedniego stanu', () => {
  const initialRaw = JSON.stringify(cloneCatalog());
  const storage = new MemoryStorage({ [VAX_STORAGE_KEY]: initialRaw });
  const quotaStorage = {
    getItem: k => storage.getItem(k),
    setItem: () => {
      const err = new Error('QuotaExceededError');
      err.name = 'QuotaExceededError';
      throw err;
    }
  };

  const res = saveVaccinesToStorage(quotaStorage, cloneCatalog());
  assert.equal(res.success, false);
  assert.ok(res.error);
  assert.equal(storage.getItem(VAX_STORAGE_KEY), initialRaw);
});

test('L12: Uszkodzony JSON oraz przyszły storageFormatVersion -> czytelny błąd bez cichego nadpisania', () => {
  const brokenRaw = '{corrupted json...';
  const brokenStorage = new MemoryStorage({ [VAX_STORAGE_KEY]: brokenRaw });
  const resBroken = loadVaccinesFromStorage(brokenStorage, VACCINES_CATALOG);
  assert.ok(resBroken.error);
  assert.equal(resBroken.loadedFromStorage, false);
  assert.equal(brokenStorage.getItem(VAX_STORAGE_KEY), brokenRaw);

  const futureStorage = new MemoryStorage({
    [VAX_STORAGE_KEY]: JSON.stringify(cloneCatalog()),
    [VAX_CATALOG_META_KEY]: JSON.stringify({
      storageFormatVersion: 99,
      catalogDataVersion: '2099.01.01'
    })
  });
  const resFuture = loadVaccinesFromStorage(futureStorage, VACCINES_CATALOG);
  assert.ok(resFuture.error);
  assert.match(resFuture.error, /nowszej wersji formatu/);
});

test('L13: Import starszego backupu scalany bezpiecznie dodaje brakujące produkty z katalogu bazowego', () => {
  const olderSubset = cloneCatalog().slice(0, 2);
  const merged = mergeImportedBackupWithLocalCatalog(olderSubset, cloneCatalog());
  assert.equal(merged.vaccines.length, VACCINES_CATALOG.length);
  assert.ok(merged.addedIds.length >= 4);
});

test('L14: Zachowanie vac-infanrix-hexa i jego niezgodności disc-phenylalanine-content-01', () => {
  const merged = mergeVaccineCatalogWithStorage(VACCINES_CATALOG, cloneCatalog());
  const inf = merged.vaccines.find(v => v.id === 'vac-infanrix-hexa');
  assert.ok(inf);
  assert.equal(inf.verificationStatus, 'requires_source_clarification');
  assert.ok(
    inf.sourceDiscrepancies.some(d => d.id === 'disc-phenylalanine-content-01')
  );
  assert.equal(merged.catalogDataVersion, CATALOG_DATA_VERSION);
});

// =========================================================================
// CZĘŚĆ B: 15 SCENARIUSZY BACKUPU I USZCZELNIENIA IMPORTU (5.8)
// =========================================================================

test('B1: Poprawny backup bez statusów zweryfikowanych przechodzi walidację i scalanie', () => {
  const payload = createBackupPayload(cloneCatalog());
  assert.equal(payload.metadata.containsPatientData, false);
  assert.equal(payload.metadata.catalogDataVersion, CATALOG_DATA_VERSION);
  const val = validateBackupPayload(JSON.stringify(payload), cloneCatalog());
  assert.equal(val.isValid, true);
  assert.equal(val.summary.claimsRequiringRecheckCount, 0);
  const merged = mergeImportedBackupWithLocalCatalog(val.payload.vaccines, cloneCatalog());
  assert.equal(merged.vaccines.length, VACCINES_CATALOG.length);
});

test('B2: Backup z prawidłowym statusem pośrednim zachowuje ten status po imporcie', () => {
  const list = cloneCatalog();
  const priorix = list.find(v => v.id === 'vac-priorix');
  priorix.verificationStatus = 'ready_for_manual_verification';
  priorix.userVerificationNotes = 'Przygotowano do ręcznej weryfikacji na stanowisku';

  const sanitized = enforceClinicalIntegrityOnImport(list, cloneCatalog());
  const resPriorix = sanitized.find(v => v.id === 'vac-priorix');
  assert.equal(resPriorix.verificationStatus, 'ready_for_manual_verification');
  assert.equal(resPriorix.importedVerificationClaim, undefined);
});

test('B3: Backup z verified_chpl dla dowolnego preparatu tylko z datą i notatką -> degradacja do requires_reverification', () => {
  const list = cloneCatalog();
  const priorix = list.find(v => v.id === 'vac-priorix');
  priorix.verificationStatus = 'verified_chpl';
  priorix.userVerificationDate = '2026-11-11 08:00';
  priorix.userVerificationNotes = 'Deklaracja bez pełnych sekcji ChPL';

  const sanitized = enforceClinicalIntegrityOnImport(list, cloneCatalog());
  const resPriorix = sanitized.find(v => v.id === 'vac-priorix');
  assert.equal(resPriorix.verificationStatus, 'requires_reverification');
  assert.ok(resPriorix.importedVerificationClaim);
  assert.equal(resPriorix.importedVerificationClaim.claimedStatus, 'verified_chpl');
  assert.equal(resPriorix.importedVerificationClaim.hasCompleteChplAudit, false);
});

test('B4: Backup z verified_chpl / verified_full bez kompletu sekcji 1–10 i 4.1–4.9 zostaje oznaczony i zdegradowany', () => {
  const list = cloneCatalog();
  const prevenar = list.find(v => v.id === 'vac-prevenar-13');
  prevenar.verificationStatus = 'verified_full';
  prevenar.userVerificationDate = '2026-11-11';
  prevenar.userVerificationNotes = 'Rzekomo zweryfikowano całość bez podpunktów 4.1–4.9';

  const chplAudit = inspectChplCompleteness(prevenar.chpl);
  assert.equal(chplAudit.hasAllSections1To10And41To49, false);
  assert.ok(chplAudit.missingSections.length > 0);

  const sanitized = enforceClinicalIntegrityOnImport(list, cloneCatalog());
  const res = sanitized.find(v => v.id === 'vac-prevenar-13');
  assert.equal(res.verificationStatus, 'requires_reverification');
  assert.equal(res.importedVerificationClaim.claimedStatus, 'verified_full');
  assert.equal(res.importedVerificationClaim.hasCompleteChplAudit, false);
});

test('B5: Backup z kompletem sekcji 1–10 i 4.1–4.9, lecz bez danych o pochodzeniu -> requires_reverification', () => {
  const list = cloneCatalog();
  const engerix = list.find(v => v.id === 'vac-engerix-b');
  engerix.chpl = makeCompleteChpl(engerix.chpl, 'verified_chpl');
  engerix.verificationStatus = 'verified_chpl';
  engerix.userVerificationDate = null;
  engerix.userVerificationNotes = null;
  engerix.documentDownloadDate = null;

  const sanitized = enforceClinicalIntegrityOnImport(list, cloneCatalog());
  const res = sanitized.find(v => v.id === 'vac-engerix-b');
  assert.equal(res.verificationStatus, 'requires_reverification');
  assert.ok(res.importedVerificationClaim);
  assert.equal(res.importedVerificationClaim.hasOriginProvenance, false);
});

test('B6: Backup z fałszywą / nieciągłą historią statusów (uncompleted -> verified_chpl) zostaje odrzucony jako zatwierdzenie', () => {
  const list = cloneCatalog();
  const boostrix = list.find(v => v.id === 'vac-boostrix');
  boostrix.chpl = makeCompleteChpl(boostrix.chpl, 'verified_chpl');
  boostrix.verificationStatus = 'verified_chpl';
  boostrix.userVerificationDate = '2026-11-11';
  boostrix.userVerificationNotes = 'Dłuższa notatka o sprawdzeniu ChPL z RPL.';
  boostrix.documentDownloadDate = '2026-11-11';
  boostrix.statusHistory = [
    {
      id: 'forged-jump-1',
      timestamp: '2026-11-11',
      previousStatus: 'uncompleted',
      newStatus: 'verified_chpl',
      reason: 'ok',
      author: 'Niezweryfikowany'
    }
  ];

  const sanitized = enforceClinicalIntegrityOnImport(list, cloneCatalog());
  const res = sanitized.find(v => v.id === 'vac-boostrix');
  assert.equal(res.verificationStatus, 'requires_reverification');
  assert.ok(res.importedVerificationClaim);
  assert.equal(res.importedVerificationClaim.suspiciousHistoryDetected, true);
});

test('B7: Backup ze zmienionym statusem Infanrix hexa przy nierozwiązanej niezgodności -> przywrócenie requires_source_clarification', () => {
  const list = cloneCatalog();
  const inf = list.find(v => v.id === 'vac-infanrix-hexa');
  inf.verificationStatus = 'verified_chpl';
  inf.chpl = makeCompleteChpl(inf.chpl, 'verified_chpl');
  inf.userVerificationDate = '2026-11-11';
  inf.userVerificationNotes = 'Próba ręcznej manipulacji JSON';

  const sanitized = enforceClinicalIntegrityOnImport(list, cloneCatalog());
  const res = sanitized.find(v => v.id === 'vac-infanrix-hexa');
  assert.equal(res.verificationStatus, 'requires_source_clarification');
  assert.ok(res.importedVerificationClaim);
});

test('B8: Backup z usuniętą ręcznie niezgodnością w Infanrix hexa -> odtworzenie disc-phenylalanine-content-01', () => {
  const list = cloneCatalog();
  const inf = list.find(v => v.id === 'vac-infanrix-hexa');
  inf.sourceDiscrepancies = [];
  inf.verificationStatus = 'ready_for_manual_verification';

  const sanitized = enforceClinicalIntegrityOnImport(list, cloneCatalog());
  const res = sanitized.find(v => v.id === 'vac-infanrix-hexa');
  assert.equal(res.verificationStatus, 'requires_source_clarification');
  assert.ok(
    res.sourceDiscrepancies.some(d => d.id === 'disc-phenylalanine-content-01')
  );
});

test('B9: Backup z nieznanym polem ostrzega, a z __proto__/constructor odrzuca', () => {
  const payload = createBackupPayload(cloneCatalog());
  payload.extraUnexpectedRootField = 'custom_info';
  const valExtra = validateBackupPayload(JSON.stringify(payload), cloneCatalog());
  assert.equal(valExtra.isValid, true);
  assert.ok((valExtra.warnings || []).some(w => w.includes('extraUnexpectedRootField')));

  const rawProto = '{"vaxnurseBackup":true,"__proto__":{"polluted":true},"metadata":{},"vaccines":[]}';
  const valProto = validateBackupPayload(rawProto, cloneCatalog());
  assert.equal(valProto.isValid, false);
});

test('B10: Backup z nieznaną wersją schematu zostaje odrzucony', () => {
  const payload = createBackupPayload(cloneCatalog());
  payload.metadata.schemaVersion = '9.9.9';
  const val = validateBackupPayload(JSON.stringify(payload), cloneCatalog());
  assert.equal(val.isValid, false);
  assert.ok(val.errors.some(e => e.includes('9.9.9')));
});

test('B11: Uszkodzony plik JSON zostaje odrzucony', () => {
  const val = validateBackupPayload('{"vaxnurseBackup": true, "vaccines": [', cloneCatalog());
  assert.equal(val.isValid, false);
  assert.ok(val.errors.length > 0);
});

test('B12: Import z konfliktem lokalnych danych wykazuje conflictCount w BackupSummary', () => {
  const local = cloneCatalog();
  local[1].verificationStatus = 'ready_for_manual_verification';
  local[1].userVerificationNotes = 'Lokalnie rozbudowane uwagi';

  const imported = cloneCatalog().slice(0, 4);
  const summary = calculateBackupSummary(createBackupPayload(imported), local);
  assert.ok(summary.conflictCount >= 1);
  assert.equal(summary.productsToUpdate, 4);
});

test('B13: Błąd zapisu podczas importu nie niszczy poprzednich danych lokalnych', () => {
  const initialRaw = JSON.stringify(cloneCatalog());
  const backing = new MemoryStorage({ [VAX_STORAGE_KEY]: initialRaw });
  const failingWriter = {
    getItem: k => backing.getItem(k),
    setItem: () => {
      throw new Error('Write failure');
    }
  };
  const saveRes = saveVaccinesToStorage(failingWriter, cloneCatalog());
  assert.equal(saveRes.success, false);
  assert.equal(backing.getItem(VAX_STORAGE_KEY), initialRaw);
});

test('B14: Generowanie kopii ratunkowej przed przywróceniem zachowuje kompletny odtwarzalny stan', () => {
  const local = cloneCatalog();
  local[1].userVerificationNotes = 'Stan sprzed nadpisania';
  const safetyBackup = createBackupPayload(local);
  const revalidated = validateBackupPayload(JSON.stringify(safetyBackup), local);
  assert.equal(revalidated.isValid, true);
  assert.equal(revalidated.payload.metadata.containsPatientData, false);
  assert.equal(revalidated.payload.vaccines[1].userVerificationNotes, 'Stan sprzed nadpisania');
});

test('B15: Przy nieudanym imporcie lub odrzuceniu walidacji oryginalny localStorage nietknięty', () => {
  const original = JSON.stringify(cloneCatalog());
  const storage = new MemoryStorage({ [VAX_STORAGE_KEY]: original });
  const val = validateBackupPayload('{"bad":true}', cloneCatalog());
  assert.equal(val.isValid, false);
  assert.equal(storage.getItem(VAX_STORAGE_KEY), original);
});

test('B-UI: applyFinalChplApproval czyści importedVerificationClaim oraz mergeConflict po ponownym zatwierdzeniu', () => {
  const list = cloneCatalog();
  const priorix = list.find(v => v.id === 'vac-priorix');
  priorix.verificationStatus = 'ready_for_manual_verification';
  priorix.importedVerificationClaim = {
    claimedStatus: 'verified_chpl',
    importedAt: '2026-11-11T10:00:00.000Z',
    requiresReverification: true,
    hasCompleteChplAudit: false,
    hasOriginProvenance: false,
    reason: 'Testowa deklaracja'
  };
  const approved = applyFinalChplApproval(priorix, {
    fullChplVerifiedConfirmed: true,
    verifierName: 'mgr piel. Anna Kowalska',
    verificationNotes: 'Ręcznie zweryfikowano całą ChPL 1–10 z oficjalnym RPL.'
  });
  assert.equal(approved.success, true);
  assert.equal(approved.vaccine.importedVerificationClaim, undefined);
  assert.equal(approved.vaccine.mergeConflict, undefined);
});

// =========================================================================
// CZĘŚĆ C: PREFERENCJE WIDOKU (CZĘŚĆ VI)
// =========================================================================

test('P1: Preferencje — zapis, odczyt, reset i ochrona przed nieprawidłowymi wartościami', () => {
  const storage = new MemoryStorage();
  const emptyLoad = loadPreferences(storage);
  assert.deepEqual(emptyLoad.preferences, DEFAULT_APP_PREFERENCES);
  assert.equal(emptyLoad.hadInvalidData, false);

  const saved = savePreferences(storage, { density: 'compact', fontSize: 'large' });
  assert.equal(saved.success, true);
  assert.deepEqual(loadPreferences(storage).preferences, {
    density: 'compact',
    fontSize: 'large'
  });

  // Próba wstrzyknięcia niedozwolonych wartości
  storage.setItem(
    PREFERENCES_STORAGE_KEY,
    JSON.stringify({ density: '<script>alert(1)</script>', fontSize: 'huge' })
  );
  const tampered = loadPreferences(storage);
  assert.deepEqual(tampered.preferences, DEFAULT_APP_PREFERENCES);
  assert.equal(tampered.hadInvalidData, true);
  assert.ok(tampered.error);

  // Nakładanie atrybutów na document.documentElement
  const attrs = new Map();
  const fakeDoc = {
    documentElement: {
      setAttribute: (k, v) => attrs.set(k, v)
    }
  };
  applyPreferencesToDocument({ density: 'compact', fontSize: 'large' }, fakeDoc);
  assert.equal(attrs.get('data-density'), 'compact');
  assert.equal(attrs.get('data-font-size'), 'large');

  // Reset
  const resetRes = resetPreferences(storage);
  assert.equal(resetRes.success, true);
  assert.deepEqual(resetRes.preferences, DEFAULT_APP_PREFERENCES);
});

// =========================================================================
// CZĘŚĆ D: GLOBALNA WYSZUKIWARKA I MODUŁY „W PRZYGOTOWANIU” (CZĘŚĆ VII & VIII)
// =========================================================================

test('S1: Globalna wyszukiwarka nagłówka obejmuje moduły, skróty oraz Bazę wiedzy i oznacza placeholdery', () => {
  assert.equal(searchVaxNurseNavigation('').length, 0);
  assert.equal(searchVaxNurseNavigation('xyz-nieistniejaca-fraza-999').length, 0);

  const psoResults = searchVaxNurseNavigation('PSO');
  assert.ok(psoResults.some(r => r.targetModule === 'child-vaccinations'));
  assert.ok(psoResults.some(r => r.kind === 'knowledge' && r.targetModule === 'knowledge-base'));

  const coldResults = searchVaxNurseNavigation('chłodniczy');
  assert.ok(coldResults.some(r => r.targetModule === 'cold-chain' && r.isPlaceholder));

  assert.equal(PLACEHOLDER_MODULE_IDS.size, 6);
  assert.equal(isModulePlaceholder('child-vaccinations'), false);
  assert.equal(isModulePlaceholder('vaccines-database'), false);
  assert.equal(isModulePlaceholder('cold-chain'), true);
  assert.equal(isModulePlaceholder('special-situations'), true);
});

// =========================================================================
// CZĘŚĆ E: HISTORIA OSTATNIO UŻYWANYCH MODUŁÓW (CZĘŚĆ VIII)
// =========================================================================

test('R1: Historia modułów — pusta przy pierwszym uruchomieniu, sortowana, z limitem 12 i bez danych demo', () => {
  const storage = new MemoryStorage();
  const initial = loadRecentModuleVisits(storage);
  assert.deepEqual(initial.visits, []);

  // Pomijanie dashboard
  let current = initial.visits;
  current = recordModuleVisit(storage, current, 'dashboard').visits;
  assert.equal(current.length, 0);

  const moduleIds = [
    'child-vaccinations',
    'vaccines-database',
    'knowledge-base',
    'settings',
    'cold-chain',
    'vaccination-calendar',
    'adult-vaccinations',
    'procedures-checklists',
    'vaccination-calculator',
    'special-situations'
  ];

  moduleIds.forEach((id, idx) => {
    current = recordModuleVisit(
      storage,
      current,
      id,
      new Date(Date.UTC(2026, 10, 11, 8, idx))
    ).visits;
  });

  // Maksymalnie <= 12 unikalnych rekordów, najnowszy na górze
  assert.ok(current.length <= MAX_RECENT_MODULES);
  assert.equal(current[0].moduleId, 'special-situations');

  // Ponowna wizyta zwiększa visitCount i przenosi na górę bez duplikatu
  current = recordModuleVisit(
    storage,
    current,
    'child-vaccinations',
    new Date(Date.UTC(2026, 10, 11, 12, 0))
  ).visits;
  assert.equal(current[0].moduleId, 'child-vaccinations');
  assert.equal(current[0].visitCount, 2);
  assert.equal(current.filter(v => v.moduleId === 'child-vaccinations').length, 1);

  // Uszkodzone wpisy w pamięci
  storage.setItem(
    RECENT_MODULES_STORAGE_KEY,
    JSON.stringify([
      { moduleId: 'nonexistent', visitedAt: '2026-11-11T10:00:00.000Z' },
      { moduleId: 'vaccines-database', visitedAt: 'Dzisiaj, 07:45' },
      { moduleId: 'settings', visitedAt: '2026-11-11T09:00:00.000Z', visitCount: 3 }
    ])
  );
  const sanitized = loadRecentModuleVisits(storage);
  assert.equal(sanitized.visits.length, 1);
  assert.equal(sanitized.visits[0].moduleId, 'settings');

  // Formatowanie etykiety daty ISO + czyszczenie
  assert.match(
    formatRecentVisitTimestamp(
      '2026-11-11T09:15:00.000Z',
      new Date('2026-11-11T15:00:00.000Z')
    ),
    /^Dzisiaj,/
  );
  const cleared = clearRecentModuleVisits(storage);
  assert.deepEqual(cleared, []);
  assert.equal(storage.getItem(RECENT_MODULES_STORAGE_KEY), null);
});

// =========================================================================
// CZĘŚĆ F: WERYFIKACJA FONTÓW, ZASOBÓW, CHUNKÓW ORAZ BLOKAD KLINICZNYCH
// =========================================================================

test('A1: index.html nie ładuje Google Fonts, a nieużywane zasoby szablonu Vite zostały usunięte', () => {
  const html = fs.readFileSync(path.join(PROJECT_ROOT, 'index.html'), 'utf8');
  assert.equal(html.includes('fonts.googleapis.com'), false);
  assert.equal(html.includes('fonts.gstatic.com'), false);

  const unusedPaths = [
    'public/favicon.svg',
    'public/icons.svg',
    'src/assets/hero.png',
    'src/assets/react.svg',
    'src/assets/vite.svg'
  ];
  for (const rel of unusedPaths) {
    assert.equal(fs.existsSync(path.join(PROJECT_ROOT, rel)), false, `Plik ${rel} powinien zostać usunięty`);
  }
});

test('A2: Zbudowane chunki Vite dzielą ciężki moduł PSO poza główny bundle (<500 kB)', () => {
  const assetsDir = path.join(PROJECT_ROOT, 'dist', 'assets');
  assert.equal(fs.existsSync(assetsDir), true, 'Katalog dist/assets musi istnieć po npm run build');
  const files = fs.readdirSync(assetsDir);
  const entryJs = files.find(f => /^index-.*\.js$/.test(f));
  const childChunk = files.find(f => /^ChildVaccinationsView-.*\.js$/.test(f));
  const detailChunk = files.find(f => /^VaccineDetailView-.*\.js$/.test(f));

  assert.ok(entryJs, 'Brak głównego chunka index-*.js');
  assert.ok(childChunk, 'Brak wydzielonego chunka ChildVaccinationsView-*.js');
  assert.ok(detailChunk, 'Brak wydzielonego chunka VaccineDetailView-*.js');

  const entrySize = fs.statSync(path.join(assetsDir, entryJs)).size;
  assert.ok(
    entrySize < 500_000,
    `Główny chunk (${entrySize} B) musi być mniejszy niż 500 kB`
  );
});

test('A3: Pliki kliniczne mają nienaruszoną sumę SHA-256 i spójne dane', () => {
  const expectedHashes = {
    'src/data/childVaccinesData.ts':
      '4B78F08942E0698CB5217DB857871C3451AF0ACDE35B341F0A6DB9525900CDCC',
    'src/data/vaccinesCatalog.ts':
      'CD2581862CADC65B7CC655D201356D1D17506CC3E5D0C25FDB0F622FF89E7999',
    'src/data/chplStage1AuditSheets.ts':
      'E6C22A830A780CA040C625772DB518A89A25CB28DEB388D5A373E86003294791'
  };

  for (const [rel, expected] of Object.entries(expectedHashes)) {
    const buf = fs.readFileSync(path.join(PROJECT_ROOT, rel));
    const actual = crypto.createHash('sha256').update(buf).digest('hex').toUpperCase();
    assert.equal(actual, expected, `Hash pliku ${rel} uległ zmianie!`);
  }
});

console.log(`\n================================================================`);
console.log(` WYNIK TESTÓW ETAPU A: ${passed}/${passed} TESTÓW ZALICZONYCH (100%)`);
console.log(`================================================================`);
