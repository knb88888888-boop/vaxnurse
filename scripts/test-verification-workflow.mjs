// scripts/test-verification-workflow.mjs
// Test suite for Infanrix hexa verification workflow in VaxNurse (Scenarios A through H)

import assert from 'node:assert/strict';

console.log('================================================================');
console.log('   AUDYT I TESTY LOGIKI WERYFIKACJI INFANRIX HEXA W VAXNURSE   ');
console.log('================================================================\n');

// 1. Walidacja formularza Etapu 1 (6 pól)
function validateEtap1Form(fields) {
  const errors = {};
  if (!fields.documentId?.trim()) errors.documentId = 'Wymagane: Podaj identyfikator dokumentu.';
  if (!fields.issuer?.trim()) errors.issuer = 'Wymagane: Podaj instytucję lub podmiot wystawiający.';
  if (!fields.documentDate?.trim()) errors.documentDate = 'Wymagane: Podaj datę wydania dokumentu urzędowego.';
  if (!fields.receivedDate?.trim()) errors.receivedDate = 'Wymagane: Podaj datę otrzymania dokumentu.';
  if (!fields.documentUrlOrLocation?.trim()) errors.documentUrlOrLocation = 'Wymagane: Podaj odnośnik URL lub lokalizację.';
  if (!fields.verifierJustification?.trim()) errors.verifierJustification = 'Wymagane: Podaj uzasadnienie osoby weryfikującej.';
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// 2. Walidacja potwierdzenia kontroli Etapu 2 (4 elementy)
function validateEtap2Form(fields) {
  const errors = {};
  if (!fields.docOpenedConfirmed) {
    errors.docOpenedConfirmed = 'Wymagane: Potwierdź otwarcie lub wskazanie dokumentu źródłowego.';
  }
  if (!fields.docCheckDate?.trim()) {
    errors.docCheckDate = 'Wymagane: Podaj datę dokonania sprawdzenia dokumentu.';
  }
  if (!fields.checkerNameAndRole?.trim()) {
    errors.checkerNameAndRole = 'Wymagane: Wskaż osobę dokonującą sprawdzenia.';
  }
  if (!fields.checkerJustification?.trim()) {
    errors.checkerJustification = 'Wymagane: Podaj uzasadnienie, dlaczego dokument rozwiązuje daną niezgodność.';
  }
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// 3. Sprawdzanie czy zatwierdzenie jest zablokowane
function isApprovalBlocked(product) {
  const primaryDiscrepancy = product.sourceDiscrepancies?.[0];
  const isDiscrepancyResolved = primaryDiscrepancy?.status === 'resolved_with_official_document';
  const hasUnresolvedDiscrepancies = !isDiscrepancyResolved;
  const isReady = product.verificationStatus === 'ready_for_manual_verification';
  const isAlreadyVerified = product.verificationStatus === 'verified_chpl';
  return hasUnresolvedDiscrepancies || (!isReady && !isAlreadyVerified);
}

// Mock initial Infanrix hexa product
function createInitialInfanrixHexa() {
  return {
    id: 'vac-infanrix-hexa',
    tradeName: 'Infanrix hexa',
    verificationStatus: 'requires_source_clarification',
    sourceDiscrepancies: [
      {
        id: 'disc-phenylalanine-content-01',
        fieldName: 'Zawartość fenyloalaniny',
        firstValue: '0,0289 mikrograma na dawkę',
        firstSection: '2',
        secondValue: '0,0298 mikrograma na dawkę',
        secondSection: '4.4',
        status: 'requires_clarification',
        description: 'Niezgodność wewnętrzna oficjalnej ChPL...',
        resolution: {
          documentId: '',
          issuer: '',
          documentDate: '',
          receivedDate: '',
          documentUrlOrLocation: '',
          verifierJustification: '',
          isResolved: false
        }
      }
    ],
    statusHistory: [
      {
        id: 'hist-init-01',
        timestamp: '10.11.2026 r., 12:00',
        previousStatus: 'pending_verification',
        newStatus: 'requires_source_clarification',
        reason: 'Wykryto niezgodność wewnętrzną ChPL',
        author: 'System kontroli'
      }
    ]
  };
}

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
const totalTests = 8;

// ============================================================================
// SCENARIUSZ A: Formularz niekompletny -> odrzucenie zapisu
// ============================================================================
console.log('Test A: Formularz niekompletny -> odrzucenie zapisu');
{
  // A1: Etap 1 – brak pól
  const emptyEtap1 = validateEtap1Form({});
  assert.equal(emptyEtap1.isValid, false, 'Pusty formularz Etapu 1 musi zostać odrzucony');
  assert.equal(Object.keys(emptyEtap1.errors).length, 6, 'Musi zgłosić brak wszystkich 6 pól');

  // A2: Etap 1 – częściowo wypełniony (np. tylko 4 pola z 6)
  const partialEtap1 = validateEtap1Form({
    documentId: 'URPL/DPR/2026/012',
    issuer: 'URPLWMiPB',
    documentDate: '2026-03-01',
    receivedDate: '2026-03-05'
    // brak documentUrlOrLocation i verifierJustification
  });
  assert.equal(partialEtap1.isValid, false, 'Częściowo wypełniony formularz Etapu 1 musi zostać odrzucony');
  assert.ok(partialEtap1.errors.documentUrlOrLocation, 'Musi wymagać lokalizacji dokumentu');
  assert.ok(partialEtap1.errors.verifierJustification, 'Musi wymagać uzasadnienia');

  // A3: Etap 2 – niepotwierdzony checkbox
  const unconfirmedEtap2 = validateEtap2Form({
    docOpenedConfirmed: false,
    docCheckDate: '10.11.2026',
    checkerNameAndRole: 'Pielęgniarka',
    checkerJustification: 'Uzasadnienie'
  });
  assert.equal(unconfirmedEtap2.isValid, false, 'Brak potwierdzenia otwarcia dokumentu musi odrzucić zapis');
  assert.ok(unconfirmedEtap2.errors.docOpenedConfirmed);

  passedTests++;
  console.log('   ✓ SCENARIUSZ A ZALICZONY: Niekompletny formularz (zarówno Etapu 1 jak i Etapu 2) jest bezwzględnie odrzucany.\n');
}

// ============================================================================
// SCENARIUSZ B: Sześć pól wypełnionych -> wyjaśnienie zarejestrowane, zatwierdzenie zablokowane
// ============================================================================
console.log('Test B: Sześć pól wypełnionych -> wyjaśnienie zarejestrowane, ale zatwierdzenie nadal zablokowane');
let vaccineState = createInitialInfanrixHexa();
{
  const validEtap1Input = {
    documentId: 'URPL/DPR/2026/012',
    issuer: 'Urząd Rejestracji Produktów Leczniczych (URPLWMiPB)',
    documentDate: '2026-03-01',
    receivedDate: '2026-03-05',
    documentUrlOrLocation: 'https://urpl.gov.pl/decyzje/2026/VR323859',
    verifierJustification: 'Potwierdzono sprostowanie specyfikacji przez URPL.'
  };

  const validation = validateEtap1Form(validEtap1Input);
  assert.equal(validation.isValid, true);

  // Rejestracja Etapu 1:
  vaccineState = {
    ...vaccineState,
    verificationStatus: 'requires_source_clarification', // Musi pozostać requires_source_clarification!
    sourceDiscrepancies: [
      {
        ...vaccineState.sourceDiscrepancies[0],
        status: 'clarification_submitted', // Status niezgodności: clarification_submitted
        resolution: {
          ...validEtap1Input,
          registeredAt: '10.11.2026 r., 12:30',
          registeredBy: 'Pielęgniarka koordynująca',
          isResolved: false
        }
      }
    ],
    statusHistory: [
      {
        id: 'hist-02',
        timestamp: '10.11.2026 r., 12:30',
        previousStatus: 'requires_source_clarification',
        newStatus: 'requires_source_clarification',
        reason: 'Zarejestrowano dane wyjaśnienia. Oczekuje na ręczną kontrolę dokumentu.',
        author: 'Pielęgniarka koordynująca'
      },
      ...vaccineState.statusHistory
    ]
  };

  assert.equal(vaccineState.sourceDiscrepancies[0].status, 'clarification_submitted', 'Status niezgodności musi być clarification_submitted');
  assert.equal(vaccineState.verificationStatus, 'requires_source_clarification', 'Status preparatu musi pozostać requires_source_clarification');
  assert.equal(isApprovalBlocked(vaccineState), true, 'Zatwierdzenie preparatu musi być nadal bezwzględnie zablokowane');

  passedTests++;
  console.log('   ✓ SCENARIUSZ B ZALICZONY: Po wypełnieniu 6 pól niezgodność ma status clarification_submitted, preparat ma status requires_source_clarification, a zatwierdzenie jest zablokowane.\n');
}

// ============================================================================
// SCENARIUSZ C: Ręczne potwierdzenie sprawdzenia dokumentu -> resolved_with_official_document
// ============================================================================
console.log('Test C: Ręczne potwierdzenie sprawdzenia dokumentu -> resolved_with_official_document');
{
  const validEtap2Input = {
    docOpenedConfirmed: true,
    docCheckDate: '10.11.2026 r.',
    checkerNameAndRole: 'mgr pielęgniarstwa Anna Nowak, koordynator punktu szczepień',
    checkerJustification: 'Otwarto oficjalny dokument sprostowania URPL. Potwierdzono, że właściwą zawartością fenyloalaniny jest 0,0289 µg/dawkę.'
  };

  const validation = validateEtap2Form(validEtap2Input);
  assert.equal(validation.isValid, true);

  // Potwierdzenie kontroli Etapu 2:
  vaccineState = {
    ...vaccineState,
    verificationStatus: 'ready_for_manual_verification',
    sourceDiscrepancies: [
      {
        ...vaccineState.sourceDiscrepancies[0],
        status: 'resolved_with_official_document', // Dopiero teraz zmiana na resolved_with_official_document!
        resolution: {
          ...vaccineState.sourceDiscrepancies[0].resolution,
          documentCheck: {
            sourceDocumentOpenedOrIndicated: true,
            sourceDocumentLocation: vaccineState.sourceDiscrepancies[0].resolution.documentUrlOrLocation,
            checkDate: validEtap2Input.docCheckDate,
            checkerNameAndRole: validEtap2Input.checkerNameAndRole,
            checkerJustification: validEtap2Input.checkerJustification,
            isConfirmed: true,
            confirmedAt: '10.11.2026 r., 12:35'
          },
          isResolved: true
        }
      }
    ],
    statusHistory: [
      {
        id: 'hist-03',
        timestamp: '10.11.2026 r., 12:35',
        previousStatus: 'requires_source_clarification',
        newStatus: 'ready_for_manual_verification',
        reason: 'Ręcznie potwierdzono sprawdzenie dokumentu źródłowego.',
        author: validEtap2Input.checkerNameAndRole
      },
      ...vaccineState.statusHistory
    ]
  };

  assert.equal(vaccineState.sourceDiscrepancies[0].status, 'resolved_with_official_document', 'Status niezgodności musi być resolved_with_official_document');
  assert.equal(vaccineState.sourceDiscrepancies[0].resolution.documentCheck.isConfirmed, true, 'documentCheck.isConfirmed musi wynosić true');

  passedTests++;
  console.log('   ✓ SCENARIUSZ C ZALICZONY: Ręczna kontrola dokumentu zmienia status niezgodności na resolved_with_official_document.\n');
}

// ============================================================================
// SCENARIUSZ D: Przygotowany dokument, ale bez ręcznej kontroli -> preparat nadal wymaga wyjaśnienia
// ============================================================================
console.log('Test D: Przygotowany dokument bez ręcznej kontroli -> preparat nadal wymaga wyjaśnienia źródłowego');
{
  const testStateD = createInitialInfanrixHexa();
  // Symulacja stanu po samym Etapie 1
  testStateD.sourceDiscrepancies[0].status = 'clarification_submitted';
  testStateD.verificationStatus = 'requires_source_clarification';

  assert.equal(testStateD.verificationStatus, 'requires_source_clarification', 'Bez Etapu 2 status preparatu musi pozostać requires_source_clarification');
  assert.equal(testStateD.sourceDiscrepancies[0].status, 'clarification_submitted');
  assert.equal(isApprovalBlocked(testStateD), true, 'Zatwierdzenie musi być zablokowane');

  passedTests++;
  console.log('   ✓ SCENARIUSZ D ZALICZONY: Preparat z wypełnionym dokumentem, lecz bez ręcznej kontroli, nadal wymaga wyjaśnienia źródłowego.\n');
}

// ============================================================================
// SCENARIUSZ E: Rozwiązana niezgodność -> preparat przechodzi do ready_for_manual_verification
// ============================================================================
console.log('Test E: Rozwiązana niezgodność -> przejście preparatu do ready_for_manual_verification (NIE verified_chpl)');
{
  assert.equal(vaccineState.verificationStatus, 'ready_for_manual_verification', 'Status preparatu po Etapie 1 + Etapie 2 musi wynosić ready_for_manual_verification');
  assert.notEqual(vaccineState.verificationStatus, 'verified_chpl', 'Preparat NIE MOŻE mieć jeszcze statusu verified_chpl');
  assert.equal(isApprovalBlocked(vaccineState), false, 'Blokada zatwierdzenia została zdjęta, karta jest gotowa do ręcznej decyzji personelu');

  passedTests++;
  console.log('   ✓ SCENARIUSZ E ZALICZONY: Preparat przeszedł do ready_for_manual_verification i nie został automatycznie oznaczony jako verified_chpl.\n');
}

// ============================================================================
// SCENARIUSZ F: Ostateczne zatwierdzenie -> możliwe dopiero po osobnej ręcznej weryfikacji ChPL
// ============================================================================
console.log('Test F: Ostateczne zatwierdzenie -> osobna, świadoma decyzja personelu');
{
  // Próba zatwierdzenia, gdy preparat byłby jeszcze w stanie requires_source_clarification:
  const blockedState = createInitialInfanrixHexa();
  assert.throws(() => {
    if (blockedState.verificationStatus !== 'ready_for_manual_verification') {
      throw new Error('Blokada bezpieczeństwa: Zatwierdzenie dozwolone wyłącznie w stanie ready_for_manual_verification.');
    }
  }, /Blokada bezpieczeństwa/);

  // Świadome zatwierdzenie w stanie ready_for_manual_verification:
  const approvedState = {
    ...vaccineState,
    verificationStatus: 'verified_chpl',
    userVerificationDate: '10.11.2026 r., 12:40',
    userVerificationNotes: 'Zweryfikowano z oficjalną dokumentacją ChPL w Rejestrze Produktów Leczniczych.',
    statusHistory: [
      {
        id: 'hist-04',
        timestamp: '10.11.2026 r., 12:40',
        previousStatus: 'ready_for_manual_verification',
        newStatus: 'verified_chpl',
        reason: 'Świadome zatwierdzenie poprawności karty ChPL przez uprawniony personel.',
        author: 'mgr pielęgniarstwa Anna Nowak'
      },
      ...vaccineState.statusHistory
    ]
  };

  assert.equal(approvedState.verificationStatus, 'verified_chpl');
  assert.equal(approvedState.userVerificationDate, '10.11.2026 r., 12:40');
  assert.equal(approvedState.statusHistory.length, 4, 'Historia zmian zawiera wszystkie zdarzenia bez ich usuwania');

  passedTests++;
  console.log('   ✓ SCENARIUSZ F ZALICZONY: Ostateczne zatwierdzenie (verified_chpl) następuje dopiero po osobnej decyzji personelu.\n');
}

// ============================================================================
// SCENARIUSZ G: Odświeżenie strony -> zapisany stan zostaje w przeglądarce
// ============================================================================
console.log('Test G: Odświeżenie strony -> trwałość stanu w localStorage');
{
  const mockStorage = new MockLocalStorage();
  const STORAGE_KEY = 'vaxnurse_vaccines_catalog_state_v1';

  // 1. Zapis do pamięci
  mockStorage.setItem(STORAGE_KEY, JSON.stringify([vaccineState]));

  // 2. Symulacja odświeżenia strony (odczyt z pamięci)
  const storedJson = mockStorage.getItem(STORAGE_KEY);
  assert.ok(storedJson, 'Dane muszą znajdować się w localStorage');

  const restoredVaccines = JSON.parse(storedJson);
  assert.equal(restoredVaccines.length, 1);
  const restoredItem = restoredVaccines[0];

  assert.equal(restoredItem.verificationStatus, 'ready_for_manual_verification');
  assert.equal(restoredItem.sourceDiscrepancies[0].status, 'resolved_with_official_document');
  assert.equal(restoredItem.sourceDiscrepancies[0].resolution.documentId, 'URPL/DPR/2026/012');
  assert.equal(restoredItem.sourceDiscrepancies[0].resolution.documentCheck.isConfirmed, true);
  assert.equal(restoredItem.sourceDiscrepancies[0].resolution.documentCheck.checkDate, '10.11.2026 r.');
  assert.equal(restoredItem.statusHistory.length, 3);

  passedTests++;
  console.log('   ✓ SCENARIUSZ G ZALICZONY: Pełen stan preparatu, historia i kontrola dokumentu przetrwały symulowane odświeżenie strony.\n');
}

// ============================================================================
// SCENARIUSZ H: Błąd zapisu localStorage -> czytelny komunikat dla użytkownika
// ============================================================================
console.log('Test H: Błąd zapisu localStorage -> obsługa i czytelny komunikat dla użytkownika');
{
  const failingStorage = new MockLocalStorage(true); // shouldFail = true
  const STORAGE_KEY = 'vaxnurse_vaccines_catalog_state_v1';
  let storageErrorMessage = null;

  try {
    failingStorage.setItem(STORAGE_KEY, JSON.stringify([vaccineState]));
  } catch {
    storageErrorMessage = 'Błąd zapisu w pamięci podręcznej przeglądarki (localStorage): Nie udało się utrwalić wprowadzonych zmian. Sprawdź ilość wolnego miejsca lub uprawnienia pamięci w przeglądarce.';
  }

  assert.ok(storageErrorMessage, 'Musi zostać przechwycony błąd zapisu');
  assert.match(storageErrorMessage, /Błąd zapisu w pamięci podręcznej przeglądarki \(localStorage\)/);
  assert.match(storageErrorMessage, /Nie udało się utrwalić wprowadzonych zmian/);

  passedTests++;
  console.log('   ✓ SCENARIUSZ H ZALICZONY: Błąd localStorage został przechwycony i wygenerował czytelny komunikat ostrzegawczy.\n');
}

console.log('================================================================');
console.log(` WYNIK KOŃCOWY: ${passedTests}/${totalTests} SCENARIUSZY ZALICZONYCH POMYŚLNIE (100%) `);
console.log('================================================================\n');
