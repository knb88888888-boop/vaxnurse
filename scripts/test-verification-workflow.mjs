// Rzeczywiste testy integracyjne workflow weryfikacji preparatu Infanrix hexa (VaxNurse)
// Uruchomienie: node --experimental-strip-types scripts/test-verification-workflow.mjs

import assert from 'node:assert/strict';
import { VACCINES_CATALOG } from '../src/data/vaccinesCatalog.ts';
import {
  VAX_STORAGE_KEY,
  LOCAL_UNAUTHENTICATED_AUTHOR,
  validateClarificationForm,
  validateDocumentCheckForm,
  validateFinalChplApproval,
  applyClarificationRegistration,
  applyDocumentCheckConfirmation,
  applyFinalChplApproval,
  revokeFinalChplApproval,
  revokeDocumentCheckToSubmitted,
  resetVaccineClarificationToInitial,
  resetCatalogPreservingHistory,
  loadVaccinesFromStorage,
  saveVaccinesToStorage,
  getUnresolvedDiscrepancies,
  isProductApprovalBlocked
} from '../src/utils/vaccineVerification.ts';
import { enforceClinicalIntegrityOnImport } from '../src/utils/backup.ts';

let passed = 0;

function runTest(name, fn) {
  fn();
  passed += 1;
  console.log(`PASS: ${name}`);
}

const getInitialInfanrix = () => {
  const infanrix = VACCINES_CATALOG.find(v => v.id === 'vac-infanrix-hexa');
  assert.ok(infanrix, 'Infanrix hexa musi istnieć w VACCINES_CATALOG');
  return structuredClone(infanrix);
};

const VALID_STAGE1_FIELDS = {
  documentId: 'URPL/DPR/2026/012',
  issuer: 'URPL (Urząd Rejestracji Produktów Leczniczych) / GSK',
  documentDate: '2026-10-15',
  receivedDate: '2026-11-10',
  documentUrlOrLocation: 'https://rejestry.ezdrowie.gov.pl/rpl/infanrix-hexa-sprostowanie-2026.pdf',
  verifierJustification: 'Oficjalne sprostowanie URPL wyjaśnia zawartość fenyloalaniny pomiędzy pkt 2 i pkt 4.4 ChPL.'
};

const VALID_STAGE2_FIELDS = {
  docOpenedConfirmed: true,
  sourceDocumentLocation: VALID_STAGE1_FIELDS.documentUrlOrLocation,
  docCheckDate: '2026-11-10',
  checkerNameAndRole: 'mgr piel. Anna Nowak, koordynator punktu szczepień',
  checkerJustification: 'Otwarto dokument URPL/DPR/2026/012; załączone sprostowanie jednoznacznie usuwa rozbieżność 0,0289 vs 0,0298 µg fenyloalaniny.'
};

const VALID_STAGE3_FIELDS = {
  fullChplVerifiedConfirmed: true,
  verifierName: 'lek. Jan Kowalski',
  verificationNotes: 'Ręcznie zweryfikowano całą dokumentację ChPL (punkty 1–10) względem druku GSK z 12.02.2026 oraz dokumentu URPL/DPR/2026/012.'
};

// 0. Integralność katalogu bazowego (niezmieniony stan kliniczny Infanrix hexa i brak fałszywych niezgodności dla innych preparatów)
runTest('0. Katalog bazowy zachowuje nierozwiązaną rozbieżność fenyloalaniny dla Infanrix hexa', () => {
  const infanrix = getInitialInfanrix();
  assert.equal(infanrix.verificationStatus, 'requires_source_clarification');
  assert.equal(infanrix.sourceDiscrepancies?.length, 1);
  assert.equal(infanrix.sourceDiscrepancies[0].id, 'disc-phenylalanine-content-01');
  assert.equal(infanrix.sourceDiscrepancies[0].status, 'requires_clarification');
  assert.match(infanrix.sourceDiscrepancies[0].firstValue, /0,0289/);
  assert.match(infanrix.sourceDiscrepancies[0].secondValue, /0,0298/);
  assert.equal(isProductApprovalBlocked(infanrix), true);

  const priorix = VACCINES_CATALOG.find(v => v.id === 'vac-priorix');
  assert.ok(priorix, 'Priorix musi istnieć w katalogu');
  assert.equal(getUnresolvedDiscrepancies(priorix).length, 0);
});

// SCENARIUSZ A: Formularz niekompletny: zapis odrzucony
runTest('Scenariusz A: Formularz Etapu 1 niekompletny (0 lub 5 z 6 pól) zostaje odrzucony', () => {
  const initial = getInitialInfanrix();
  const initialHistoryLen = initial.statusHistory?.length ?? 0;

  const emptyVal = validateClarificationForm({
    documentId: '',
    issuer: '',
    documentDate: '',
    receivedDate: '',
    documentUrlOrLocation: '',
    verifierJustification: '   '
  });
  assert.equal(emptyVal.isValid, false);
  assert.equal(Object.keys(emptyVal.errors).length, 6);

  const partialResult = applyClarificationRegistration(initial, {
    ...VALID_STAGE1_FIELDS,
    verifierJustification: '   '
  });
  assert.equal(partialResult.success, false);
  assert.ok(partialResult.errors.verifierJustification);

  // Brak mutacji pierwotnego obiektu ani postępu statusu
  assert.equal(initial.sourceDiscrepancies[0].status, 'requires_clarification');
  assert.equal(initial.verificationStatus, 'requires_source_clarification');
  assert.equal(initial.statusHistory?.length ?? 0, initialHistoryLen);
});

// SCENARIUSZ B: Sześć pól wypełnionych: wyjaśnienie zarejestrowane, zatwierdzenie nadal zablokowane
runTest('Scenariusz B: Wypełnienie 6 pól rejestruje wyjaśnienie (clarification_submitted), ale utrzymuje blokadę zatwierdzenia', () => {
  const initial = getInitialInfanrix();
  const initialHistoryLen = initial.statusHistory?.length ?? 0;

  const stage1 = applyClarificationRegistration(initial, VALID_STAGE1_FIELDS);
  assert.equal(stage1.success, true);

  const afterStage1 = stage1.vaccine;
  const disc = afterStage1.sourceDiscrepancies[0];
  assert.equal(disc.status, 'clarification_submitted');
  assert.equal(disc.resolution?.documentId, VALID_STAGE1_FIELDS.documentId);
  assert.equal(disc.resolution?.issuer, VALID_STAGE1_FIELDS.issuer);
  assert.equal(disc.resolution?.documentDate, VALID_STAGE1_FIELDS.documentDate);
  assert.equal(disc.resolution?.receivedDate, VALID_STAGE1_FIELDS.receivedDate);
  assert.equal(disc.resolution?.documentUrlOrLocation, VALID_STAGE1_FIELDS.documentUrlOrLocation);
  assert.equal(disc.resolution?.verifierJustification, VALID_STAGE1_FIELDS.verifierJustification);
  assert.equal(disc.resolution?.isResolved, false);

  assert.equal(afterStage1.verificationStatus, 'requires_source_clarification');
  assert.equal(isProductApprovalBlocked(afterStage1), true);
  assert.equal(afterStage1.statusHistory?.length, initialHistoryLen + 1);
  assert.equal(afterStage1.statusHistory[0].author, LOCAL_UNAUTHENTICATED_AUTHOR);

  const directApprovalAttempt = applyFinalChplApproval(afterStage1, VALID_STAGE3_FIELDS);
  assert.equal(directApprovalAttempt.success, false);
  assert.ok(directApprovalAttempt.blockedReason);
});

// SCENARIUSZ D: Przygotowany dokument bez ręcznej kontroli -> preparat nadal wymaga wyjaśnienia
runTest('Scenariusz D: Przygotowany dokument bez kompletnej ręcznej kontroli utrzymuje status requires_source_clarification', () => {
  const initial = getInitialInfanrix();
  const stage1 = applyClarificationRegistration(initial, VALID_STAGE1_FIELDS);
  assert.equal(stage1.success, true);
  const afterStage1 = stage1.vaccine;

  // Brak potwierdzenia otwarcia dokumentu lub brak pól Etapu 2 musi zostać odrzucony
  const incompleteDocCheckVal = validateDocumentCheckForm({
    docOpenedConfirmed: false,
    sourceDocumentLocation: '',
    docCheckDate: '2026-11-10',
    checkerNameAndRole: '',
    checkerJustification: ''
  });
  assert.equal(incompleteDocCheckVal.isValid, false);
  assert.ok(incompleteDocCheckVal.errors.docOpenedConfirmed);
  assert.ok(incompleteDocCheckVal.errors.sourceDocumentLocation);
  assert.ok(incompleteDocCheckVal.errors.checkerNameAndRole);
  assert.ok(incompleteDocCheckVal.errors.checkerJustification);

  const failedDocCheck = applyDocumentCheckConfirmation(afterStage1, {
    ...VALID_STAGE2_FIELDS,
    docOpenedConfirmed: false
  });
  assert.equal(failedDocCheck.success, false);
  assert.equal(afterStage1.sourceDiscrepancies[0].status, 'clarification_submitted');
  assert.equal(afterStage1.verificationStatus, 'requires_source_clarification');
  assert.equal(isProductApprovalBlocked(afterStage1), true);
});

// SCENARIUSZ C & E: Ręczne potwierdzenie sprawdzenia dokumentu -> resolved_with_official_document -> ready_for_manual_verification
runTest('Scenariusz C i E: Ręczna kontrola zmienia status niezgodności na resolved_with_official_document, a preparatu na ready_for_manual_verification (nie verified_chpl)', () => {
  const initial = getInitialInfanrix();
  const stage1 = applyClarificationRegistration(initial, VALID_STAGE1_FIELDS);
  assert.equal(stage1.success, true);

  const stage2 = applyDocumentCheckConfirmation(stage1.vaccine, VALID_STAGE2_FIELDS);
  assert.equal(stage2.success, true);

  const afterStage2 = stage2.vaccine;
  const disc = afterStage2.sourceDiscrepancies[0];
  assert.equal(disc.status, 'resolved_with_official_document');
  assert.equal(disc.resolution?.isResolved, true);
  assert.equal(disc.resolution?.documentCheck?.isConfirmed, true);
  assert.equal(disc.resolution?.documentCheck?.sourceDocumentOpenedOrIndicated, true);
  assert.ok(disc.resolution?.documentCheck?.confirmedAt);
  assert.match(afterStage2.statusHistory[0].reason, /oświadczenie lokalne bez uwierzytelniania tożsamości/);
  assert.equal(disc.resolution?.documentCheck?.sourceDocumentLocation, VALID_STAGE2_FIELDS.sourceDocumentLocation);
  assert.equal(disc.resolution?.documentCheck?.checkerNameAndRole, VALID_STAGE2_FIELDS.checkerNameAndRole);
  assert.equal(disc.resolution?.documentCheck?.checkDate, VALID_STAGE2_FIELDS.docCheckDate);
  assert.equal(disc.resolution?.documentCheck?.checkerJustification, VALID_STAGE2_FIELDS.checkerJustification);

  // Etap 3: ready_for_manual_verification, nigdy automatycznie verified_chpl
  assert.equal(afterStage2.verificationStatus, 'ready_for_manual_verification');
  assert.notEqual(afterStage2.verificationStatus, 'verified_chpl');
  assert.equal(afterStage2.userVerificationDate, null);
  assert.equal(isProductApprovalBlocked(afterStage2), false);

  // Sprawdzenie cofnięcia sprawdzenia dokumentu -> powrót do Etapu 1
  const revertedToStage1 = revokeDocumentCheckToSubmitted(afterStage2, initial, VALID_STAGE2_FIELDS.checkerNameAndRole);
  assert.equal(revertedToStage1.sourceDiscrepancies[0].status, 'clarification_submitted');
  assert.equal(revertedToStage1.verificationStatus, 'requires_source_clarification');
  assert.equal(isProductApprovalBlocked(revertedToStage1), true);
  assert.equal(revertedToStage1.statusHistory.length, afterStage2.statusHistory.length + 1);
});

// SCENARIUSZ F: Ostateczne zatwierdzenie dopiero po osobnej ręcznej weryfikacji całej ChPL
runTest('Scenariusz F: Ostateczne zatwierdzenie (verified_chpl) wymaga osobnego potwierdzenia weryfikacji całej ChPL', () => {
  const initial = getInitialInfanrix();
  const stage1 = applyClarificationRegistration(initial, VALID_STAGE1_FIELDS);
  assert.equal(stage1.success, true);
  const stage2 = applyDocumentCheckConfirmation(stage1.vaccine, VALID_STAGE2_FIELDS);
  assert.equal(stage2.success, true);
  const ready = stage2.vaccine;

  const incompleteFinalVal = validateFinalChplApproval({
    fullChplVerifiedConfirmed: false,
    verifierName: '',
    verificationNotes: ''
  });
  assert.equal(incompleteFinalVal.isValid, false);
  assert.equal(Object.keys(incompleteFinalVal.errors).length, 3);

  const rejectedFinal = applyFinalChplApproval(ready, {
    ...VALID_STAGE3_FIELDS,
    fullChplVerifiedConfirmed: false
  });
  assert.equal(rejectedFinal.success, false);
  assert.equal(ready.verificationStatus, 'ready_for_manual_verification');

  const approved = applyFinalChplApproval(ready, VALID_STAGE3_FIELDS);
  assert.equal(approved.success, true);
  assert.equal(approved.vaccine.verificationStatus, 'verified_chpl');
  assert.ok(approved.vaccine.userVerificationDate);
  assert.equal(approved.vaccine.userVerificationNotes, VALID_STAGE3_FIELDS.verificationNotes);
  assert.equal(approved.vaccine.chpl.composition.verificationStatus, 'verified_chpl');
  assert.equal(approved.vaccine.statusHistory.length, ready.statusHistory.length + 1);

  const revokedFinal = revokeFinalChplApproval(approved.vaccine, initial, VALID_STAGE3_FIELDS.verifierName);
  assert.equal(revokedFinal.verificationStatus, 'ready_for_manual_verification');
  assert.equal(revokedFinal.userVerificationDate, null);
  assert.notEqual(revokedFinal.chpl.composition.verificationStatus, 'verified_chpl');
  assert.equal(revokedFinal.statusHistory.length, approved.vaccine.statusHistory.length + 1);
});

// SCENARIUSZ G: Odświeżenie strony (utrwalenie localStorage) i świadome przywracanie stanu początkowego bez usuwania historii zmian
runTest('Scenariusz G: Zapis i ponowny odczyt localStorage zachowuje stan oraz reset z zachowaniem historii zmian', () => {
  const initial = getInitialInfanrix();
  const s1 = applyClarificationRegistration(initial, VALID_STAGE1_FIELDS);
  assert.equal(s1.success, true);
  const s2 = applyDocumentCheckConfirmation(s1.vaccine, VALID_STAGE2_FIELDS);
  assert.equal(s2.success, true);
  const s3 = applyFinalChplApproval(s2.vaccine, VALID_STAGE3_FIELDS);
  assert.equal(s3.success, true);

  const updatedCatalog = VACCINES_CATALOG.map(v => (v.id === 'vac-infanrix-hexa' ? s3.vaccine : v));

  const backingStore = new Map();
  const mockStorage = {
    getItem: key => backingStore.get(key) ?? null,
    setItem: (key, val) => {
      backingStore.set(key, String(val));
    }
  };

  const saveRes = saveVaccinesToStorage(mockStorage, updatedCatalog);
  assert.equal(saveRes.success, true);
  assert.equal(saveRes.error, null);
  assert.ok(backingStore.has(VAX_STORAGE_KEY));

  // Symulacja odświeżenia strony
  const loadRes = loadVaccinesFromStorage(mockStorage, VACCINES_CATALOG);
  assert.equal(loadRes.error, null);
  assert.equal(loadRes.loadedFromStorage, true);
  const reloadedInfanrix = loadRes.vaccines.find(v => v.id === 'vac-infanrix-hexa');
  assert.ok(reloadedInfanrix);
  assert.equal(reloadedInfanrix.verificationStatus, 'verified_chpl');
  assert.equal(reloadedInfanrix.sourceDiscrepancies[0].status, 'resolved_with_official_document');
  assert.equal(reloadedInfanrix.statusHistory.length, s3.vaccine.statusHistory.length);

  // Przywracanie stanu początkowego preparatu nie usuwa historii zmian
  const historyBeforeReset = reloadedInfanrix.statusHistory.length;
  const resetProd = resetVaccineClarificationToInitial(reloadedInfanrix, initial);
  assert.equal(resetProd.verificationStatus, 'requires_source_clarification');
  assert.equal(resetProd.sourceDiscrepancies[0].status, 'requires_clarification');
  assert.equal(resetProd.chpl.composition.verificationStatus, initial.chpl.composition.verificationStatus);
  assert.equal(resetProd.statusHistory.length, historyBeforeReset + 1);

  // Przywracanie całego katalogu do stanu początkowego zachowuje historię zmian
  const resetCat = resetCatalogPreservingHistory(updatedCatalog, VACCINES_CATALOG);
  const resetCatInfanrix = resetCat.find(v => v.id === 'vac-infanrix-hexa');
  assert.ok(resetCatInfanrix);
  assert.equal(resetCatInfanrix.verificationStatus, 'requires_source_clarification');
  assert.equal(resetCatInfanrix.sourceDiscrepancies[0].status, 'requires_clarification');
  assert.equal(resetCatInfanrix.statusHistory.length, historyBeforeReset + 1);

  // Zabezpieczenie importu kopii przed sfingowanym resolved_with_official_document bez Etapu 2
  const forged = structuredClone(s1.vaccine);
  forged.sourceDiscrepancies[0].status = 'resolved_with_official_document';
  forged.verificationStatus = 'verified_chpl';
  const sanitized = enforceClinicalIntegrityOnImport([forged], VACCINES_CATALOG);
  assert.equal(sanitized[0].sourceDiscrepancies[0].status, 'clarification_submitted');
  assert.equal(sanitized[0].verificationStatus, 'requires_source_clarification');
});

// SCENARIUSZ H: Błędy odczytu i zapisu localStorage
runTest('Scenariusz H: Błędy zapisu i odczytu localStorage zwracają czytelne komunikaty bez awarii aplikacji', () => {
  const infanrix = getInitialInfanrix();
  const catalog = VACCINES_CATALOG.map(v => (v.id === 'vac-infanrix-hexa' ? infanrix : v));

  const failingWriteStorage = {
    setItem: () => {
      throw new Error('QuotaExceededError: storage limit reached');
    }
  };
  const writeErrRes = saveVaccinesToStorage(failingWriteStorage, catalog);
  assert.equal(writeErrRes.success, false);
  assert.ok(writeErrRes.error && writeErrRes.error.includes('localStorage'));

  const corruptedJsonStorage = {
    getItem: () => '{to-nie-jest-poprawny-json'
  };
  const jsonErrRes = loadVaccinesFromStorage(corruptedJsonStorage, VACCINES_CATALOG);
  assert.equal(jsonErrRes.loadedFromStorage, false);
  assert.ok(jsonErrRes.error && jsonErrRes.error.includes('localStorage'));
  assert.equal(jsonErrRes.vaccines.length, VACCINES_CATALOG.length);

  const nonArrayStorage = {
    getItem: () => JSON.stringify({ invalid: true })
  };
  const structureErrRes = loadVaccinesFromStorage(nonArrayStorage, VACCINES_CATALOG);
  assert.equal(structureErrRes.loadedFromStorage, false);
  assert.ok(structureErrRes.error && structureErrRes.error.includes('nieprawidłową strukturę'));

  const throwingReadStorage = {
    getItem: () => {
      throw new Error('SecurityError: access denied');
    }
  };
  const throwReadRes = loadVaccinesFromStorage(throwingReadStorage, VACCINES_CATALOG);
  assert.equal(throwReadRes.loadedFromStorage, false);
  assert.ok(throwReadRes.error && throwReadRes.error.includes('Brak dostępu'));
});

console.log(`\nWszystkie testy integracyjne przeszły pomyślnie (${passed}/8 grup scenariuszy).`);
