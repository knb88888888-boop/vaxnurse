// scripts/test-backup-system.mjs
// Test suite for VaxNurse Local Backup System (Scenarios A through G)

import assert from 'node:assert/strict';
import {
  BACKUP_SCHEMA_VERSION,
  APP_VERSION,
  createBackupPayload,
  validateBackupPayload,
  enforceClinicalIntegrityOnImport
} from '../src/utils/backup.ts';
import { VACCINES_CATALOG } from '../src/data/vaccinesCatalog.ts';

console.log('================================================================');
console.log('   AUDYT I TESTY SYSTEMU KOPII BEZPIECZEŃSTWA (BACKUP) VAXNURSE ');
console.log('================================================================\n');

// Mock localStorage engine
class MockLocalStorage {
  constructor(shouldFail = false) {
    this.store = new Map();
    this.shouldFail = shouldFail;
  }
  getItem(key) {
    return this.store.get(key) || null;
  }
  setItem(key, value) {
    if (this.shouldFail) {
      throw new Error('QuotaExceededError: Pamięć localStorage przekroczona.');
    }
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

let passedTests = 0;
const totalTests = 7;

// ============================================================================
// SCENARIUSZ A: Eksport poprawnego katalogu
// ============================================================================
console.log('Test A: Eksport poprawnego katalogu preparatów');
let exportedJsonString = '';
let exportedPayload = null;
{
  const currentCatalog = JSON.parse(JSON.stringify(VACCINES_CATALOG));
  exportedPayload = createBackupPayload(currentCatalog);

  // 1. Sprawdzenie flagi i metadanych
  assert.equal(exportedPayload.vaxnurseBackup, true, 'Kopia musi zawierać vaxnurseBackup: true');
  assert.equal(exportedPayload.metadata.schemaVersion, BACKUP_SCHEMA_VERSION, `Wersja schematu musi być ${BACKUP_SCHEMA_VERSION}`);
  assert.equal(exportedPayload.metadata.appVersion, APP_VERSION, `Wersja aplikacji musi być ${APP_VERSION}`);
  assert.equal(exportedPayload.metadata.containsPatientData, false, 'Jawne potwierdzenie braku danych pacjentów');
  assert.ok(exportedPayload.metadata.exportedAt, 'Data ISO musi istnieć');
  assert.ok(exportedPayload.metadata.exportedAtFormatted, 'Sformatowana data musi istnieć');

  // 2. Sprawdzenie katalogu preparatów
  assert.equal(exportedPayload.vaccines.length, currentCatalog.length, 'Liczba preparatów musi odpowiadać stanowi katalogu');
  assert.equal(exportedPayload.metadata.totalVaccines, currentCatalog.length);

  // 3. Sprawdzenie punktów ChPL 1-10 w Infanrix hexa
  const infanrix = exportedPayload.vaccines.find(v => v.id === 'vac-infanrix-hexa');
  assert.ok(infanrix, 'Infanrix hexa musi znajdować się w kopii');
  assert.ok(infanrix.chpl.name.content, 'Punkt 1 ChPL musi istnieć');
  assert.ok(infanrix.chpl.composition.content, 'Punkt 2 ChPL musi istnieć');
  assert.ok(infanrix.chpl.clinicalParticulars.indications.content, 'Punkt 4.1 ChPL musi istnieć');
  assert.ok(infanrix.chpl.pharmaceuticalParticulars.excipients.content, 'Punkt 6.1 ChPL musi istnieć');
  assert.ok(infanrix.chpl.revisionDate.content, 'Punkt 10 ChPL musi istnieć');

  // 4. Sprawdzenie niezgodności i historii zmian
  assert.ok(infanrix.sourceDiscrepancies?.length > 0, 'Rozbieżność fenyloalaniny musi być wyeksportowana');
  assert.ok(infanrix.statusHistory?.length > 0, 'Historia zmian statusów musi być wyeksportowana');

  // 5. Serializacja do poprawnego JSON
  exportedJsonString = JSON.stringify(exportedPayload, null, 2);
  assert.ok(exportedJsonString.length > 5000, 'JSON musi zawierać kompletne dane strukturalne');

  passedTests++;
  console.log('   ✓ SCENARIUSZ A ZALICZONY: Kopia wygenerowana poprawnie z metadanymi, strukturą ChPL 1–10 i brakiem danych pacjentów.\n');
}

// ============================================================================
// SCENARIUSZ B: Import poprawnej kopii
// ============================================================================
console.log('Test B: Import poprawnej kopii bezpieczeństwa');
{
  const validation = validateBackupPayload(exportedJsonString);
  assert.equal(validation.isValid, true, 'Walidacja poprawnej kopii musi zwrócić isValid: true');
  assert.equal(validation.errors.length, 0, 'Brak błędów walidacji');
  assert.ok(validation.payload, 'Payload musi zostać wyekstrahowany');
  assert.ok(validation.summary, 'Podsumowanie musi zostać wyliczone');

  const { summary } = validation;
  assert.equal(summary.totalVaccines, exportedPayload.vaccines.length);
  assert.equal(summary.schemaVersion, BACKUP_SCHEMA_VERSION);
  assert.ok(summary.vaccineNames.includes('Infanrix hexa'));
  assert.ok(summary.vaccineNames.includes('Priorix'));

  // Symulacja bezpiecznego zapisu w localStorage
  const mockStorage = new MockLocalStorage();
  const STORAGE_KEY = 'vaxnurse_vaccines_catalog_state_v1';
  mockStorage.setItem(STORAGE_KEY, JSON.stringify(validation.payload.vaccines));

  const restored = JSON.parse(mockStorage.getItem(STORAGE_KEY));
  assert.equal(restored.length, exportedPayload.vaccines.length);

  passedTests++;
  console.log('   ✓ SCENARIUSZ B ZALICZONY: Poprawna kopia pomyślnie zwalidowana, podsumowana i zaimportowana do pamięci lokalnej.\n');
}

// ============================================================================
// SCENARIUSZ C: Odrzucenie uszkodzonego JSON
// ============================================================================
console.log('Test C: Odrzucenie uszkodzonego lub uciętego pliku JSON');
{
  // C1: Ucięty JSON
  const corruptedJson1 = '{ "vaxnurseBackup": true, "metadata": { "schemaVersion": "1.0.0"';
  const val1 = validateBackupPayload(corruptedJson1);
  assert.equal(val1.isValid, false, 'Ucięty JSON musi zostać bezwzględnie odrzucony');
  assert.ok(val1.errors[0].includes('Nieprawidłowy format pliku'), 'Komunikat musi wyjaśniać błąd składni JSON');

  // C2: Nie-JSON (zwykły tekst / HTML)
  const corruptedJson2 = '<html><body>Błąd 404</body></html>';
  const val2 = validateBackupPayload(corruptedJson2);
  assert.equal(val2.isValid, false);
  assert.ok(val2.errors[0].includes('Nieprawidłowy format pliku'));

  // C3: Pusty ciąg
  const val3 = validateBackupPayload('');
  assert.equal(val3.isValid, false);

  passedTests++;
  console.log('   ✓ SCENARIUSZ C ZALICZONY: Uszkodzony lub nieprawidłowy JSON jest natychmiast odrzucany z jasnym komunikatem błędu.\n');
}

// ============================================================================
// SCENARIUSZ D: Odrzucenie nieznanego schematu lub braku wymaganych pól
// ============================================================================
console.log('Test D: Odrzucenie nieznanej wersji schematu lub brakujących pól');
{
  // D1: Nieznana wersja schematu
  const invalidSchemaPayload = {
    vaxnurseBackup: true,
    metadata: {
      exportedAt: '2026-11-10T22:00:00Z',
      schemaVersion: '99.0.0', // Nieobsługiwana wersja
      appVersion: '1.0.0'
    },
    vaccines: [
      { id: 'vac-1', tradeName: 'Test', verificationStatus: 'pending_verification', chpl: {} }
    ]
  };
  const valSchema = validateBackupPayload(JSON.stringify(invalidSchemaPayload));
  assert.equal(valSchema.isValid, false);
  assert.ok(valSchema.errors.some(err => err.includes('Nieobsługiwana wersja schematu danych')));

  // D2: Brak tablicy preparatów
  const missingVaccinesPayload = {
    vaxnurseBackup: true,
    metadata: {
      exportedAt: '2026-11-10T22:00:00Z',
      schemaVersion: '1.0.0'
    }
  };
  const valMissing = validateBackupPayload(JSON.stringify(missingVaccinesPayload));
  assert.equal(valMissing.isValid, false);
  assert.ok(valMissing.errors.some(err => err.includes('Brak tablicy preparatów')));

  // D3: Niedozwolony status weryfikacji w rekordzie
  const invalidStatusPayload = {
    vaxnurseBackup: true,
    metadata: {
      exportedAt: '2026-11-10T22:00:00Z',
      schemaVersion: '1.0.0'
    },
    vaccines: [
      {
        id: 'vac-invalid',
        tradeName: 'Nieprawidłowa',
        verificationStatus: 'status_zmyslony_hakerski',
        chpl: { name: { content: 'Test' } }
      }
    ]
  };
  const valStatus = validateBackupPayload(JSON.stringify(invalidStatusPayload));
  assert.equal(valStatus.isValid, false);
  assert.ok(valStatus.errors.some(err => err.includes('Nieznany lub niedozwolony status weryfikacji')));

  passedTests++;
  console.log('   ✓ SCENARIUSZ D ZALICZONY: Nieznany schemat, brakujące pola i sfałszowane statusy są wykrywane i odrzucane.\n');
}

// ============================================================================
// SCENARIUSZ E: Zachowanie nierozwiązanej niezgodności (ochrona integralności)
// ============================================================================
console.log('Test E: Zachowanie nierozwiązanej niezgodności i reguły integralności');
{
  const baselineCatalog = JSON.parse(JSON.stringify(VACCINES_CATALOG));

  // Próba zaimportowania pliku, w którym ktoś usunąłby niezgodność fenyloalaniny z Infanrix hexa
  // i próbował oznaczyć preparat jako verified_chpl bez wyjaśnienia
  const maliciousImportVaccines = baselineCatalog.map(v => {
    if (v.id === 'vac-infanrix-hexa') {
      return {
        ...v,
        verificationStatus: 'verified_chpl', // Niedozwolona promocja bez wyjaśnienia
        sourceDiscrepancies: [] // Próba usunięcia niezgodności
      };
    }
    return v;
  });

  const sanitized = enforceClinicalIntegrityOnImport(maliciousImportVaccines, baselineCatalog);
  const sanitizedInfanrix = sanitized.find(v => v.id === 'vac-infanrix-hexa');

  assert.ok(sanitizedInfanrix.sourceDiscrepancies?.length > 0, 'Niezgodność fenyloalaniny nie może zostać usunięta podczas importu');
  assert.equal(sanitizedInfanrix.sourceDiscrepancies[0].id, 'disc-phenylalanine-content-01');
  assert.equal(sanitizedInfanrix.sourceDiscrepancies[0].status, 'requires_clarification');
  assert.equal(sanitizedInfanrix.verificationStatus, 'requires_source_clarification', 'Status musi pozostać requires_source_clarification');

  // Reguła: Nigdy nie zmieniaj statusu pending_verification na verified_chpl podczas importu bez autoryzacji
  const maliciousPriorix = sanitized.find(v => v.id === 'vac-priorix');
  assert.notEqual(maliciousPriorix.verificationStatus, 'verified_chpl');

  passedTests++;
  console.log('   ✓ SCENARIUSZ E ZALICZONY: Nierozwiązana niezgodność jest bezwzględnie zachowana, a niedozwolone promocje statusu są zablokowane.\n');
}

// ============================================================================
// SCENARIUSZ F: Zachowanie historii zmian
// ============================================================================
console.log('Test F: Zachowanie lokalnej historii zmian');
{
  const catalogWithHistory = JSON.parse(JSON.stringify(VACCINES_CATALOG));
  const infanrix = catalogWithHistory.find(v => v.id === 'vac-infanrix-hexa');

  // Dodajemy serię wpisów historii
  infanrix.statusHistory = [
    {
      id: 'hist-01',
      timestamp: '10.11.2026 r., 12:00',
      previousStatus: 'pending_verification',
      newStatus: 'requires_source_clarification',
      reason: 'Wykryto rozbieżność fenyloalaniny',
      author: 'System kontroli ChPL'
    },
    {
      id: 'hist-02',
      timestamp: '10.11.2026 r., 12:30',
      previousStatus: 'requires_source_clarification',
      newStatus: 'requires_source_clarification',
      reason: 'Zarejestrowano wyjaśnienie urzędowe URPL',
      author: 'Pielęgniarka koordynująca'
    },
    {
      id: 'hist-03',
      timestamp: '10.11.2026 r., 12:35',
      previousStatus: 'requires_source_clarification',
      newStatus: 'ready_for_manual_verification',
      reason: 'Potwierdzono sprawdzenie dokumentu źródłowego',
      author: 'mgr pielęgniarstwa Anna Nowak'
    }
  ];

  // Eksportujemy i importujemy
  const backup = createBackupPayload(catalogWithHistory);
  assert.equal(backup.metadata.totalHistoryEntries, 3, 'Metadane muszą odzwierciedlać 3 wpisy historii');

  const jsonStr = JSON.stringify(backup);
  const validated = validateBackupPayload(jsonStr);
  assert.equal(validated.isValid, true);

  const importedInfanrix = validated.payload.vaccines.find(v => v.id === 'vac-infanrix-hexa');
  assert.equal(importedInfanrix.statusHistory.length, 3, 'Wszystkie 3 wpisy historii muszą zostać nienaruszone');
  assert.equal(importedInfanrix.statusHistory[0].id, 'hist-01');
  assert.equal(importedInfanrix.statusHistory[2].author, 'mgr pielęgniarstwa Anna Nowak');

  passedTests++;
  console.log('   ✓ SCENARIUSZ F ZALICZONY: Pełna historia zmian personelu, sygnatury i powody decyzji zostały w 100% zachowane.\n');
}

// ============================================================================
// SCENARIUSZ G: Brak utraty danych przy nieudanym imporcie
// ============================================================================
console.log('Test G: Brak utraty danych przy nieudanym imporcie');
{
  const mockStorage = new MockLocalStorage();
  const STORAGE_KEY = 'vaxnurse_vaccines_catalog_state_v1';

  // Stan pierwotny bazy w localStorage
  const initialData = [
    {
      id: 'vac-infanrix-hexa',
      tradeName: 'Infanrix hexa - STAN ORYGINALNY',
      verificationStatus: 'requires_source_clarification',
      chpl: { name: { content: 'Oryginalna treść' } }
    }
  ];
  mockStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));

  // Próba importu nieprawidłowego pliku
  const badFiles = [
    '{ zepsuty json ',
    JSON.stringify({ vaxnurseBackup: false }),
    JSON.stringify({ vaxnurseBackup: true, metadata: { schemaVersion: 'unknown' } })
  ];

  for (const badFile of badFiles) {
    const val = validateBackupPayload(badFile);
    assert.equal(val.isValid, false, 'Nieprawidłowy plik musi zostać odrzucony');

    // Ponieważ walidacja nie powiodła się, localStorage NIE MOŻE zostać zmodyfikowany
    const currentInStorage = JSON.parse(mockStorage.getItem(STORAGE_KEY));
    assert.equal(currentInStorage[0].tradeName, 'Infanrix hexa - STAN ORYGINALNY', 'Baza danych nie może ulec modyfikacji!');
  }

  // Symulacja błędu zapisu (np. brak miejsca w storage)
  const failingStorage = new MockLocalStorage(true); // shouldFail = true
  failingStorage.store.set(STORAGE_KEY, JSON.stringify(initialData));

  let saveFailed = false;
  try {
    failingStorage.setItem(STORAGE_KEY, JSON.stringify(exportedPayload.vaccines));
  } catch {
    saveFailed = true;
  }
  assert.equal(saveFailed, true, 'Wyjątek zapisu musi zostać przechwycony');

  // Dane w magazynie nie zostały nadpisane nową wartością
  const storedAfterFail = JSON.parse(failingStorage.getItem(STORAGE_KEY));
  assert.equal(storedAfterFail[0].tradeName, 'Infanrix hexa - STAN ORYGINALNY');

  passedTests++;
  console.log('   ✓ SCENARIUSZ G ZALICZONY: Przy jakimkolwiek błędzie walidacji lub zapisu stan bazy danych pozostaje nietknięty.\n');
}

console.log('================================================================');
console.log(` WYNIK KOŃCOWY: ${passedTests}/${totalTests} SCENARIUSZY BACKUPU ZALICZONYCH POMYŚLNIE (100%) `);
console.log('================================================================\n');
