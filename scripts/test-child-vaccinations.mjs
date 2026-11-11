import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  CHILD_AGE_BRACKETS,
  CHILD_VACCINES_CATALOG,
  STAGE_GROUPS_CONFIG,
  STAFF_QUALIFICATIONS_PSO_PART_VI,
  PSO_GENERAL_PRINCIPLES_PART_IV,
  CATCH_UP_IMMUNIZATION_PART_V,
  PSO_CATCH_UP_12_POINTS_PART_V,
  COMBINED_VACCINES_VARIANTS_PART_III_M,
  findChildVaccine
} from '../src/data/childVaccinesData.ts';
import { VACCINES_CATALOG } from '../src/data/vaccinesCatalog.ts';
import { STAGE1_CHPL_AUDIT_BUNDLE } from '../src/data/chplStage1AuditSheets.ts';
import {
  REQUIRED_CHPL_SECTION_NUMBERS,
  REQUIRED_SECTION_4_SUBPOINTS,
  deriveChplVerificationStatus,
  deriveCatalogCardCompletenessStatus,
  deriveProcedureProductAdequacyStatus,
  getPediatricSelectableFundingScopes,
  getAdultAndSpecialReferenceScopes,
  getUnconfirmedSeasonalScopes,
  canPromoteToVerifiedFull,
  validateChildVaccineStatusInvariants,
  validateStage1ChplAuditBundle,
  auditVariantA2IpvCoverage,
  auditChildVaccinesCatalogSummary,
  auditPendingFundingProcedures,
  getChplManualVerificationQueue,
  getChplManualQueueGroupCounts,
} from '../src/utils/childVaccineAudit.ts';

const SECTION_4_VERIFIED_SUBPOINTS = REQUIRED_SECTION_4_SUBPOINTS.map(subpointId => ({
  subpointId,
  status: 'verified',
  pageRef: 'PDF str. 1–5',
  verificationNote: `Zweryfikowano treść kliniczną podpunktu ${subpointId} ChPL w oficjalnym dokumencie PDF z RPL (zgodność z procedurą PSO).`,
}));

const FULL_10_SECTION_REVIEWS = REQUIRED_CHPL_SECTION_NUMBERS.map(sectionNumber =>
  sectionNumber === '10'
    ? {
        sectionNumber,
        status: 'not_present_in_document',
        pageRef: 'PDF str. 7',
        justification: 'Punkt 10 nie zawiera daty w źródłowym dokumencie ChPL z RPL — jawnie odnotowano brak w trakcie kontroli.',
      }
    : sectionNumber === '4'
      ? {
          sectionNumber,
          status: 'verified',
          pageRef: 'PDF str. 1–5',
          verificationNote: 'Zweryfikowano wszystkie podpunkty kliniczne 4.1–4.9 w części IV oficjalnego dokumentu ChPL z RPL.',
          outcome: 'compliant',
          subpoints: SECTION_4_VERIFIED_SUBPOINTS,
        }
      : {
          sectionNumber,
          status: 'verified',
          pageRef: Number(sectionNumber) <= 3 ? 'PDF str. 1' : 'PDF str. 5–7',
          verificationNote: `Zweryfikowano pełną treść sekcji ${sectionNumber} ChPL w oficjalnym dokumencie z RPL względem karty produktu i PSO.`,
          outcome: 'compliant',
        }
);

console.log('================================================================');
console.log('   KOMPLEKSOWY AUDYT MERYTORYCZNY SZCZEPIEŃ DZIECI (PSO 2027)  ');
console.log('================================================================\n');

// -------------------------------------------------------------
// Test 1: Struktura i chronologia etapów wiekowych PSO 2027
// -------------------------------------------------------------
console.log('Test 1: Struktura i chronologia etapów wiekowych PSO 2027');

assert.ok(CHILD_AGE_BRACKETS.length === 12, 'Baza musi zawierać dokładnie 12 zdefiniowanych etapów wiekowych');
const bracketIds = new Set(CHILD_AGE_BRACKETS.map(b => b.id));
assert.ok(bracketIds.has('doba-0'), 'Musi zawierać etap: 1. doba (okres noworodkowy)');
assert.ok(bracketIds.has('2-miesiac'), 'Musi zawierać etap: 2. miesiąc życia');
assert.ok(bracketIds.has('4-miesiac'), 'Musi zawierać etap: 4. miesiąc życia');
assert.ok(bracketIds.has('5-6-miesiac'), 'Musi zawierać etap: 5.–6. miesiąc życia');
assert.ok(bracketIds.has('7-miesiac'), 'Musi zawierać etap: 7. miesiąc życia');
assert.ok(bracketIds.has('13-15-miesiac'), 'Musi zawierać etap: 13.–15. miesiąc życia');
assert.ok(bracketIds.has('16-18-miesiac'), 'Musi zawierać etap: 16.–18. miesiąc życia');
assert.ok(bracketIds.has('6-rok'), 'Musi zawierać etap: 6. rok życia');
assert.ok(bracketIds.has('9-rok'), 'Musi zawierać etap: 9. rok życia');
assert.ok(bracketIds.has('14-rok'), 'Musi zawierać etap: 14. rok życia');
assert.ok(bracketIds.has('19-rok'), 'Musi zawierać etap: 19. rok życia');
assert.ok(bracketIds.has('grupy-ryzyka'), 'Musi zawierać etap: Grupy ryzyka i wskazania kliniczne');

// Sprawdzenie kolejności chronologicznej
for (let i = 0; i < CHILD_AGE_BRACKETS.length; i++) {
  assert.equal(CHILD_AGE_BRACKETS[i].order, i + 1, `Kolejność etapu ${CHILD_AGE_BRACKETS[i].id} musi wynosić ${i + 1}`);
  assert.ok(CHILD_AGE_BRACKETS[i].label.length > 0, `Etap ${CHILD_AGE_BRACKETS[i].id} musi posiadać etykietę`);
  assert.ok(CHILD_AGE_BRACKETS[i].psoHeader.length > 0, `Etap ${CHILD_AGE_BRACKETS[i].id} musi wskazywać sekcję nagłówkową PSO`);
}

assert.ok(STAGE_GROUPS_CONFIG.length === 6, 'Musi być zdefiniowane 6 grup etapów');
console.log('   ✓ SCENARIUSZ 1 ZALICZONY: Wszystkie 12 etapów wiekowych zdefiniowane z pełną chronologią i powiązaniem z nagłówkami PSO.\n');

// -------------------------------------------------------------
// Test 2: Audyt kompletności bazy i metadanych publikacji aktu prawnego
// -------------------------------------------------------------
console.log('Test 2: Audyt kompletności bazy i metadanych publikacji aktu prawnego');

assert.equal(CHILD_VACCINES_CATALOG.length, 43, 'Katalog musi zawierać dokładnie 43 audytowane procedury (34 obowiązkowe + 9 zalecanych)');

const OFFICIAL_PDF_URL = 'https://dziennikmz.mz.gov.pl/DUM_MZ/2026/77/akt.pdf';
const LEGAL_ACT_KEYWORD = 'Dz. Urz. Min. Zdrow. 2026 poz. 77';
const GIS_ANNOUNCEMENT_DATE = '28.10.2026';
const JOURNAL_PUBLICATION_DATE = '30.10.2026';

for (const item of CHILD_VACCINES_CATALOG) {
  assert.ok(item.id.startsWith('pso-'), `Identyfikator ${item.id} musi zaczynać się od 'pso-'`);
  assert.ok(item.aliasId?.startsWith('child-'), `Identyfikator aliasu ${item.aliasId} musi zaczynać się od 'child-'`);
  assert.ok(item.disease.length > 5, `Wpis ${item.id} musi mieć sprecyzowaną chorobę`);
  assert.ok(item.shortCode.length > 0, `Wpis ${item.id} musi mieć skrót kliniczny`);
  assert.ok(['obowiazkowe', 'zalecane'].includes(item.obligationType), `Wpis ${item.id} musi mieć poprawny rodzaj obowiązku`);
  assert.ok(typeof item.psoPdfPage === 'number' && item.psoPdfPage >= 4 && item.psoPdfPage <= 40, `Wpis ${item.id} musi mieć stronę PDF w granicach aktu (4-40)`);
  assert.equal(item.sourcePrintedPage, item.sourcePdfPage, `Wpis ${item.id}: numer strony drukowanej musi być tożsamy z PDF`);
  assert.equal(item.psoOfficialUrl, OFFICIAL_PDF_URL, `Wpis ${item.id} musi wskazywać oficjalny PDF Dziennika Urzędowego MZ`);
  assert.ok(item.psoLegalAct.includes(LEGAL_ACT_KEYWORD), `Wpis ${item.id} musi powoływać akt prawny ${LEGAL_ACT_KEYWORD}`);
  assert.equal(item.psoGisAnnouncementDate, GIS_ANNOUNCEMENT_DATE, `Wpis ${item.id} data komunikatu GIS: ${GIS_ANNOUNCEMENT_DATE}`);
  assert.equal(item.psoJournalPublicationDate, JOURNAL_PUBLICATION_DATE, `Wpis ${item.id} data publikacji Dz. Urz.: ${JOURNAL_PUBLICATION_DATE}`);
  assert.notEqual(item.psoGisAnnouncementDate, item.psoJournalPublicationDate, 'Data komunikatu GIS i data publikacji Dz. Urz. NIE MOGĄ być tożsame');
  assert.equal(item.verificationStatus, 'verified_pso', `Wpis ${item.id} musi mieć status verified_pso`);
  assert.ok(item.targetGroupDescription.length > 10, `Wpis ${item.id} musi mieć precyzyjny opis grupy docelowej`);
  assert.ok(item.administrationRoute.length > 0, `Wpis ${item.id} musi precyzować drogę podania`);
  assert.ok(item.injectionSite.length > 0, `Wpis ${item.id} musi precyzować miejsce iniekcji`);
  assert.ok(item.clinicalNotes.length > 20, `Wpis ${item.id} musi zawierać szczegółowe wytyczne dla personelu`);
  assert.ok(item.fundingStatus.length > 0, `Wpis ${item.id} musi określać status finansowania`);
  assert.ok(item.officialFundingSourceRef !== null, `Wpis ${item.id} musi mieć oficjalną podstawę prawną finansowania`);
}
console.log('   ✓ SCENARIUSZ 2 ZALICZONY: Wszystkie 43 rekordy zawierają zweryfikowane metadane publikacji, daty GIS (28.10.2026) i Dz. Urz. (30.10.2026 poz. 77).\n');

// -------------------------------------------------------------
// Test 3: Kwalifikacje personelu medycznego (Część VI PSO)
// -------------------------------------------------------------
console.log('Test 3: Kwalifikacje i uprawnienia personelu medycznego (Część VI PSO 2027)');

assert.equal(STAFF_QUALIFICATIONS_PSO_PART_VI.length, 10, 'Tabela uprawnień musi zawierać dokładnie 10 grup zawodowych');

// 1. Lekarz – pełne uprawnienia do kwalifikacji i szczepień
const lekarz = STAFF_QUALIFICATIONS_PSO_PART_VI.find(p => p.professionId === 'lekarz');
assert.ok(lekarz, 'Lekarz musi być obecny');
assert.equal(lekarz.qualificationMandatory, true, 'Lekarz kwalifikuje do szczepień obowiązkowych');
assert.equal(lekarz.administrationMandatory, true, 'Lekarz wykonuje szczepienia obowiązkowe');
assert.equal(lekarz.qualificationRecommendedUnder9, true, 'Lekarz kwalifikuje do zalecanych <9 lat');
assert.equal(lekarz.qualificationRecommended9To18, true, 'Lekarz kwalifikuje do zalecanych 9-18 lat');
assert.equal(lekarz.qualificationRecommendedOver18, true, 'Lekarz kwalifikuje do zalecanych >18 lat');
assert.equal(lekarz.administrationRecommended, true, 'Lekarz wykonuje szczepienia zalecane');

// 2. Pielęgniarka – brak kwalifikacji dzieci (<18 r.ż.), uprawnienie do podawania oraz kwalifikacji dorosłych (>18 r.ż.)
const pielegniarka = STAFF_QUALIFICATIONS_PSO_PART_VI.find(p => p.professionId === 'pielegniarka');
assert.ok(pielegniarka, 'Pielęgniarka musi być obecna');
assert.equal(pielegniarka.qualificationMandatory, false, 'Pielęgniarka NIE kwalifikuje do szczepień obowiązkowych');
assert.equal(pielegniarka.administrationMandatory, true, 'Pielęgniarka podaje szczepienia obowiązkowe');
assert.equal(pielegniarka.qualificationRecommendedUnder9, false, 'Pielęgniarka NIE kwalifikuje dzieci <9 lat');
assert.equal(pielegniarka.qualificationRecommended9To18, false, 'Pielęgniarka NIE kwalifikuje młodzieży 9-18 lat');
assert.equal(pielegniarka.qualificationRecommendedOver18, true, 'Pielęgniarka kwalifikuje do zalecanych dorosłych >18 lat po kursie');
assert.equal(pielegniarka.administrationRecommended, true, 'Pielęgniarka podaje szczepienia zalecane');

// 3. Farmaceuta – brak kwalifikacji i szczepień obowiązkowych oraz dzieci, uprawnienia u dorosłych >18 lat
const farmaceuta = STAFF_QUALIFICATIONS_PSO_PART_VI.find(p => p.professionId === 'farmaceuta');
assert.ok(farmaceuta, 'Farmaceuta musi być obecny');
assert.equal(farmaceuta.qualificationMandatory, false, 'Farmaceuta nie kwalifikuje do obowiązkowych');
assert.equal(farmaceuta.administrationMandatory, false, 'Farmaceuta nie wykonuje obowiązkowych');
assert.equal(farmaceuta.qualificationRecommendedUnder9, false, 'Farmaceuta nie kwalifikuje dzieci <9 lat');
assert.equal(farmaceuta.qualificationRecommended9To18, false, 'Farmaceuta nie kwalifikuje 9-18 lat');
assert.equal(farmaceuta.qualificationRecommendedOver18, true, 'Farmaceuta kwalifikuje dorosłych >18 lat');
assert.equal(farmaceuta.administrationRecommended, true, 'Farmaceuta wykonuje zalecane u dorosłych w aptece');

// 4. Higienistka szkolna – brak kwalifikacji, wyłącznie wykonanie szczepień
const higienistka = STAFF_QUALIFICATIONS_PSO_PART_VI.find(p => p.professionId === 'higienistka');
assert.ok(higienistka, 'Higienistka szkolna musi być obecna');
assert.equal(higienistka.qualificationMandatory, false, 'Higienistka NIE kwalifikuje do obowiązkowych');
assert.equal(higienistka.qualificationRecommendedUnder9, false, 'Higienistka NIE kwalifikuje do zalecanych');
assert.equal(higienistka.administrationMandatory, true, 'Higienistka wykonuje szczepienia obowiązkowe');

console.log('   ✓ SCENARIUSZ 3 ZALICZONY: Tabela uprawnień personelu z Części VI PSO precyzyjnie odwzorowana bez samowolnego rozszerzania uprawnień.\n');

// -------------------------------------------------------------
// Test 4: Weryfikacja 7 ogólnych zasad PSO i wyjątku dla rotawirusów (Część IV)
// -------------------------------------------------------------
console.log('Test 4: 7 ogólnych zasad przeprowadzania szczepień i wyjątek dla rotawirusów (Część IV PSO 2027)');

assert.equal(PSO_GENERAL_PRINCIPLES_PART_IV.length, 7, 'Musi być dokładnie 7 punktów zasad ogólnych Części IV');

const point2 = PSO_GENERAL_PRINCIPLES_PART_IV.find(p => p.pointNumber === 2);
assert.ok(point2, 'Punkt 2 musi istnieć');
assert.ok(point2.officialRuleText.includes('4 tygodni'), 'Punkt 2 musi zawierać regułę 4 tygodni dla szczepionek żywych');
assert.ok(point2.specificExceptions.some(ex => ex.includes('ROTAWIRUSÓW')), 'Punkt 2 musi zawierać WYJĄTEK DLA ROTAWIRUSÓW');
assert.ok(point2.specificExceptions.some(ex => ex.includes('DOWOLNYM odstępie')), 'Wyjątek rotawirusów musi wyraźnie dopuszczać dowolny odstęp');

const point7 = PSO_GENERAL_PRINCIPLES_PART_IV.find(p => p.pointNumber === 7);
assert.ok(point7, 'Punkt 7 musi istnieć');
assert.ok(point7.officialRuleText.includes('Karcie Szczepień'), 'Punkt 7 musi precyzować wpis do e-Karty Szczepień w systemie P1');

console.log('   ✓ SCENARIUSZ 4 ZALICZONY: Wszystkie 7 punktów Części IV zweryfikowane, w tym pełne brzmienie wyjątku dla rotawirusów.\n');

// -------------------------------------------------------------
// Test 5: Szczepienia wyrównawcze – 12 pełnych punktów Części V PSO
// -------------------------------------------------------------
console.log('Test 5: Szczepienia wyrównawcze – 12 pełnych punktów prawnych Części V PSO (s. 44–45)');

assert.equal(PSO_CATCH_UP_12_POINTS_PART_V.length, 12, 'Część V PSO musi zawierać dokładnie 12 numerowanych punktów');

for (let i = 1; i <= 12; i++) {
  const p = PSO_CATCH_UP_12_POINTS_PART_V.find(item => item.pointNumber === i);
  assert.ok(p, `Punkt ${i} Części V PSO musi istnieć`);
  assert.ok(p.title.length > 5, `Punkt ${i} musi posiadać tytuł`);
  assert.ok(p.officialRuleText.length > 20, `Punkt ${i} musi zawierać oficjalny tekst prawny`);
  assert.ok(p.clinicalApplication.length > 10, `Punkt ${i} musi zawierać podsumowanie kliniczne`);
  assert.equal(p.psoSection.includes('Część V'), true, `Punkt ${i} musi wskazywać Część V`);
  assert.ok(p.psoPrintedPage === 44 || p.psoPrintedPage === 45, `Punkt ${i} musi znajdować się na s. 44 lub 45`);
}

// Sprawdzenie kluczowych zasad prawnych w 12 punktach:
const p1 = PSO_CATCH_UP_12_POINTS_PART_V.find(p => p.pointNumber === 1);
assert.ok(p1.officialRuleText.includes('szczepienia wyrównawcze'), 'Pkt 1: Obowiązek wdrożenia szczepień wyrównawczych');

const p2 = PSO_CATCH_UP_12_POINTS_PART_V.find(p => p.pointNumber === 2);
assert.ok(p2.officialRuleText.includes('obowiązkowe do ukończenia wieku') && p2.officialRuleText.includes('kontynuowane bezpłatnie'), 'Pkt 2: Granica wieku i bezpłatne dokończenie schematu');

const p3 = PSO_CATCH_UP_12_POINTS_PART_V.find(p => p.pointNumber === 3);
assert.ok(p3.officialRuleText.includes('Indywidualny Kalendarz Szczepień') || p3.officialRuleText.includes('IKSz'), 'Pkt 3: Wymóg sporządzenia IKSz');

const p9 = PSO_CATCH_UP_12_POINTS_PART_V.find(p => p.pointNumber === 9);
assert.ok(p9.officialRuleText.includes('nie zostało udokumentowane') && p9.officialRuleText.includes('szczepienie podstawowe'), 'Pkt 9: Brak udokumentowania = szczepienie podstawowe');

const p10 = PSO_CATCH_UP_12_POINTS_PART_V.find(p => p.pointNumber === 10);
assert.ok(p10.officialRuleText.includes('nie należy ponawiać pełnego szczepienia') && p10.officialRuleText.includes('uzupełnić brakujące dawki'), 'Pkt 10: Niepełny schemat – zakaz ponawiania pełnego szczepienia');

assert.equal(CATCH_UP_IMMUNIZATION_PART_V.length, 5, 'Podsumowanie w 5 obszarach klinicznych musi być zachowane');

console.log('   ✓ SCENARIUSZ 5 ZALICZONY: Pełne 12 punktów Części V PSO zaimplementowane ze stronami 44–45 i zachowaniem podsumowania tematycznego.\n');

// -------------------------------------------------------------
// Test 6: Rozdzielenie wariantów 5w1 i 6w1 (Część I.A.1, I.A.2, III.M)
// -------------------------------------------------------------
console.log('Test 6: Rozdzielenie wariantów 5w1 i 6w1 oraz schematów 3+1 vs 2+1');

assert.equal(COMBINED_VACCINES_VARIANTS_PART_III_M.length, 3, 'Muszą być 3 warianty szczepionek wysoce skojarzonych');

const v5w1 = COMBINED_VACCINES_VARIANTS_PART_III_M.find(v => v.variantType === '5w1');
assert.ok(v5w1, 'Wariant 5w1 musi istnieć');
assert.ok(v5w1.hbvAdministrationRule.includes('ODDZIELNEGO podania monowalentnej szczepionki przeciw WZW B'), 'Wariant 5w1 wymaga oddzielnego WZW B');

const v6w1_3plus1 = COMBINED_VACCINES_VARIANTS_PART_III_M.find(v => v.variantType === '6w1_3plus1');
assert.ok(v6w1_3plus1, 'Wariant 6w1 3+1 musi istnieć');
assert.ok(v6w1_3plus1.scheduleDetails.includes('3 dawki 6w1'), 'Schemat 3+1 zawiera 3 dawki pierwotne');

const v6w1_2plus1 = COMBINED_VACCINES_VARIANTS_PART_III_M.find(v => v.variantType === '6w1_2plus1');
assert.ok(v6w1_2plus1, 'Wariant 6w1 2+1 musi istnieć');
assert.ok(v6w1_2plus1.hbvAdministrationRule.includes('WYŁĄCZNIE wtedy, gdy noworodek otrzymał pierwszą dawkę szczepionki przeciw WZW B w 1. dobie'), 'Schemat 2+1 wymaga WZW B w 1. dobie');
assert.ok(v6w1_2plus1.interchangeabilityWarning.includes('NIE SĄ automatycznie zamienne'), 'Ostrzeżenie o braku automatycznej zamienności');

console.log('   ✓ SCENARIUSZ 6 ZALICZONY: Warianty 5w1 i 6w1 rozdzielone z zachowaniem warunków dawki WZW B w 1. dobie.\n');

// -------------------------------------------------------------
// Test 7: Poprawność przypisania źródeł (Zadanie 2: DTaP, PCV, wścieklizna, WZW B, VZV)
// -------------------------------------------------------------
console.log('Test 7: Poprawność przypisania źródeł urzędowych (Zadanie 2 audytu)');

// A. child-dtpa-preterm-primary: Część III.E.2 PSO, s. 39. Nie Część I.B.
const dtpaPreterm = findChildVaccine('child-dtpa-preterm-primary');
assert.ok(dtpaPreterm, 'Procedura child-dtpa-preterm-primary musi istnieć');
assert.equal(dtpaPreterm.sourcePart, 'Część III.E', 'DTaP wcześniaki: Część III.E');
assert.equal(dtpaPreterm.sourceOfficialPoint, '2', 'DTaP wcześniaki: pkt 2');
assert.equal(dtpaPreterm.sourcePrintedPage, 39, 'DTaP wcześniaki: s. 39');
assert.equal(dtpaPreterm.sourcePdfPage, 39, 'DTaP wcześniaki: PDF s. 39');
assert.notEqual(dtpaPreterm.sourcePart, 'Część I.B', 'DTaP wcześniaki NIE MOGĄ być w Części I.B');

// B. child-pcv-preterm-3plus1: Część III.H.3 PSO, s. 40. Nie Część I.B.
const pcvPreterm = findChildVaccine('child-pcv-preterm-3plus1');
assert.ok(pcvPreterm, 'Procedura child-pcv-preterm-3plus1 musi istnieć');
assert.equal(pcvPreterm.sourcePart, 'Część III.H', 'PCV wcześniaki: Część III.H');
assert.equal(pcvPreterm.sourceOfficialPoint, '3', 'PCV wcześniaki: pkt 3');
assert.equal(pcvPreterm.sourcePrintedPage, 40, 'PCV wcześniaki: s. 40');
assert.equal(pcvPreterm.sourcePdfPage, 40, 'PCV wcześniaki: PDF s. 40');
assert.notEqual(pcvPreterm.sourcePart, 'Część I.B', 'PCV wcześniaki NIE MOGĄ być w Części I.B');

// C. child-rabies-postexposure: Część I.D PSO, s. 16. Nie Część I.B.
const rabies = findChildVaccine('child-rabies-postexposure');
assert.ok(rabies, 'Procedura child-rabies-postexposure musi istnieć');
assert.equal(rabies.sourcePart, 'Część I.D', 'Wścieklizna poekspozycyjna: Część I.D');
assert.equal(rabies.sourceOfficialPoint, null, 'Wścieklizna poekspozycyjna w tabeli Części I.D: brak sztucznej numeracji punktów (null)');
assert.equal(rabies.sourcePrintedPage, 16, 'Wścieklizna: s. 16');
assert.equal(rabies.sourcePdfPage, 16, 'Wścieklizna: PDF s. 16');
assert.notEqual(rabies.sourcePart, 'Część I.B', 'Wścieklizna NIE MOŻE być w Części I.B');

// D. child-hepb-unvaccinated-primary: Część III.C.4 PSO, s. 37. Nie Część I.B.
const hepbUnvac = findChildVaccine('child-hepb-unvaccinated-primary');
assert.ok(hepbUnvac, 'Procedura child-hepb-unvaccinated-primary musi istnieć');
assert.equal(hepbUnvac.sourcePart, 'Część III.C', 'WZW B nieszczepieni: Część III.C');
assert.equal(hepbUnvac.sourceOfficialPoint, '4', 'WZW B nieszczepieni: pkt 4');
assert.equal(hepbUnvac.sourcePrintedPage, 37, 'WZW B nieszczepieni: s. 37');
assert.equal(hepbUnvac.sourcePdfPage, 37, 'WZW B nieszczepieni: PDF s. 37');
assert.notEqual(hepbUnvac.sourcePart, 'Część I.B', 'WZW B nieszczepieni NIE MOGĄ być w Części I.B');

// E. Rozdzielenie WZW B u osób dializowanych na dwie odrębne procedury:
// 1) Szczepienie podstawowe osób dializowanych: Część I.B pkt 6, s. 14
const hepbDialysisPrim = findChildVaccine('child-hepb-dialysis-primary');
assert.ok(hepbDialysisPrim, 'Szczepienie podstawowe dializowanych musi istnieć');
assert.equal(hepbDialysisPrim.sourcePart, 'Część I.B', 'Podstawowe dializowanych: Część I.B');
assert.equal(hepbDialysisPrim.sourceOfficialPoint, '6', 'Podstawowe dializowanych: pkt 6');
assert.equal(hepbDialysisPrim.sourcePrintedPage, 14, 'Podstawowe dializowanych: s. 14');

// 2) Rewakcynacja osób dializowanych: Część III.C.6.3, s. 37
const hepbDialysisBoost = findChildVaccine('child-hepb-dialysis-booster');
assert.ok(hepbDialysisBoost, 'Rewakcynacja dializowanych musi istnieć');
assert.equal(hepbDialysisBoost.sourcePart, 'Część III.C', 'Rewakcynacja dializowanych: Część III.C');
assert.equal(hepbDialysisBoost.sourceOfficialPoint, '6.3', 'Rewakcynacja dializowanych: pkt 6.3');
assert.equal(hepbDialysisBoost.sourcePrintedPage, 37, 'Rewakcynacja dializowanych: s. 37');
assert.notEqual(hepbDialysisPrim.id, hepbDialysisBoost.id, 'Podstawowe i rewakcynacja WZW B dializowanych to dwa odrębne rekordy');

// Ospa wietrzna w grupach ryzyka: Część I.B, s. 14, do 19. r.ż.
const vzvRisk = findChildVaccine('child-varicella-risk');
assert.ok(vzvRisk, 'Ospa w grupach ryzyka musi istnieć');
assert.equal(vzvRisk.sourcePart, 'Część I.B', 'Ospa w grupach ryzyka: Część I.B');
assert.equal(vzvRisk.sourcePrintedPage, 14, 'Ospa w grupach ryzyka: s. 14');
assert.ok(vzvRisk.targetGroupDescription.includes('19. roku życia'), 'Ospa ryzyka: zakres obowiązku do 19. roku życia');
assert.ok(vzvRisk.targetGroupDescription.includes('odporności'), 'Ospa ryzyka: kryterium upośledzenia odporności');
assert.ok(vzvRisk.targetGroupDescription.includes('placówkach'), 'Ospa ryzyka: kryterium placówek');

console.log('   ✓ SCENARIUSZ 7 ZALICZONY: Wszystkie źródła DTaP (III.E.2), PCV (III.H.3), wścieklizny (I.D), WZW B (III.C.4) oraz rozdzielenia dializ (I.B.6 vs III.C.6.3) zweryfikowane.\n');

// -------------------------------------------------------------
// Test 8: Test braku fikcyjnej numeracji punktów (sourceOfficialPoint)
// -------------------------------------------------------------
console.log('Test 8: Weryfikacja braku sztucznej numeracji punktów w nienumerowanych tabelach urzędowych');

for (const item of CHILD_VACCINES_CATALOG) {
  if (item.sourcePart === 'Część I.A' || item.sourcePart === 'Część II.A' || item.sourcePart === 'Część I.D') {
    assert.equal(
      item.sourceOfficialPoint,
      null,
      `Wpis ${item.id} w ${item.sourcePart} nie może mieć sztucznego numeru punktu urzędowego (musi być null)`
    );
    assert.ok(item.sourceTableRow !== null && item.sourceTableRow.length > 0, `Wpis ${item.id} musi mieć opis wiersza tabeli (sourceTableRow)`);
  } else if (item.id === 'pso-risk-vzv-special') {
    assert.equal(item.sourceOfficialPoint, null, 'Ospa ryzyka (tabela Części I.B) nie może mieć sztucznego punktu urzędowego (eliminacja pkt pkt)');
    assert.equal(item.sourceTableRow, 'OSPIE WIETRZNEJ', 'Ospa ryzyka zachowuje nazwę wiersza tabeli');
    assert.equal(item.sourceCriteriaNumbers, 'kryteria 1–4', 'Ospa ryzyka oddziela kryteria 1–4 od nazwy wiersza');
  } else if (item.sourcePart.startsWith('Część I.B') || item.sourcePart.startsWith('Część III')) {
    assert.ok(
      item.sourceOfficialPoint !== null && item.sourceOfficialPoint.length > 0,
      `Wpis ${item.id} w ${item.sourcePart} musi posiadać oficjalny numer punktu urzędowego (np. '2', '3', '6.3')`
    );
  }
}

console.log('   ✓ SCENARIUSZ 8 ZALICZONY: Uniknięto sztucznej numeracji tabel PSO i podwójnego „pkt pkt” dla ospy wietrznej.\n');

// -------------------------------------------------------------
// Test 9: Warunki finansowania i kryteria wiekowe (HPV, RV 3. dawka, MenB/MenACWY, 4. m.ż.)
// -------------------------------------------------------------
console.log('Test 9: Warunki finansowania i kryteria wiekowe (HPV, Rotawirusy 3. dawka, MenB/ACWY, 4. m.ż.)');

// 1. HPV 15-18 lat: brak deklaracji "bezpłatne", status refundacji wg odrębnych przepisów
const hpvCatchup = findChildVaccine('child-hpv-catchup');
assert.ok(hpvCatchup, 'HPV catchup musi istnieć');
assert.ok(!hpvCatchup.fundingStatus.toLowerCase().includes('bezpłatne w ramach powszechnego'), 'HPV 15-18 nie może być oznaczone jako bezpłatne w programie powszechnym');
assert.ok(hpvCatchup.fundingStatus.includes('odrębnych przepisami') || hpvCatchup.fundingStatus.includes('odrębnych przepisów') || hpvCatchup.fundingStatus.includes('wymaga osobnego sprawdzenia'), 'HPV 15-18 musi wskazywać na refundację wg odrębnych przepisów');

// 2. Rotawirusy 3. dawka: integralny element schematu 3-dawkowego wg ChPL (np. RotaTeq)
const rv3 = findChildVaccine('pso-rv-3');
assert.ok(rv3, 'Rotawirusy 3. dawka muszą istnieć');
assert.ok(rv3.clinicalNotes.includes('3-dawkowego') || rv3.clinicalNotes.includes('RotaTeq'), 'Rotawirusy 3. dawka: precyzyjny opis schematu 3-dawkowego wg ChPL');

// 3. MenB i MenACWY: sformułowanie PSO "6. lub 8. tydzień życia" zależnie od rodzaju preparatu i ChPL
const menb = findChildVaccine('child-menb-infant');
assert.ok(menb, 'MenB niemowląt musi istnieć');
assert.ok(menb.targetAgeDisplay.includes('6. lub 8.') || menb.sourceAgeBand.includes('6. tygodnia życia lub 8. tygodnia życia'), 'MenB: 6. lub 8. tydzień życia wg ChPL');

const menacwy = findChildVaccine('child-menacwy-infant');
assert.ok(menacwy, 'MenACWY niemowląt musi istnieć');
assert.ok(menacwy.targetAgeDisplay.includes('6. lub 8.') || menacwy.sourceAgeBand.includes('6. tygodnia życia lub 8. tygodnia życia'), 'MenACWY: 6. lub 8. tydzień życia wg ChPL');

// 4. Weryfikacja wieku 4. m.ż.: DTaP d.2, IPV d.1, PCV d.2 – terminy i minimalne odstępy
const dtap2 = findChildVaccine('child-dtpa-2');
assert.ok(dtap2, 'DTaP dawka 2 musi istnieć');
assert.ok(dtap2.minIntervalFromPrevious.includes('8 tygodni'), 'DTaP d.2: odstęp po 8 tygodniach od dawki 1');

const ipv1 = findChildVaccine('child-ipv-1');
assert.ok(ipv1, 'IPV dawka 1 musi istnieć');
assert.ok(ipv1.targetAgeDisplay.includes('4. miesiącu życia') && ipv1.targetAgeDisplay.includes('12. tygodnia życia'), 'IPV d.1: podanie w 4. m.ż. (od 12. tyg. życia)');

const pcv2 = findChildVaccine('child-pcv-2');
assert.ok(pcv2, 'PCV dawka 2 musi istnieć');
assert.ok(pcv2.minIntervalFromPrevious.includes('8 tygodni'), 'PCV d.2: odstęp po 8 tygodniach od dawki 1');

console.log('   ✓ SCENARIUSZ 9 ZALICZONY: Warunki finansowania HPV 15-18 lat, rotacja dawek RV, sformułowania MenB/ACWY i parametry 4. m.ż. w 100% zgodne z PSO.\n');

// -------------------------------------------------------------
// Test 10: Nienaruszalność i blokada weryfikacji rekordu Infanrix hexa
// -------------------------------------------------------------
console.log('Test 10: Nienaruszalność i blokada weryfikacji rekordu Infanrix hexa');

const infanrix = VACCINES_CATALOG.find(v => v.id === 'vac-infanrix-hexa');
assert.ok(infanrix, 'Infanrix hexa musi znajdować się w katalogu');
assert.equal(infanrix.verificationStatus, 'requires_source_clarification', 'Status Infanrix hexa nie może ulec samowolnej zmianie');
assert.ok(infanrix.sourceDiscrepancies?.length === 1, 'Infanrix hexa musi zachować nierozwiązaną niezgodność fenyloalaniny');
assert.equal(infanrix.sourceDiscrepancies[0].id, 'disc-phenylalanine-content-01');
assert.equal(infanrix.sourceDiscrepancies[0].status, 'requires_clarification');

console.log('   ✓ SCENARIUSZ 10 ZALICZONY: Blokada weryfikacji i niezgodność fenyloalaniny Infanrix hexa pozostają w 100% nienaruszone.\n');

// -------------------------------------------------------------
// Test 11: Weryfikacja rekordu BCG (RPL + BCG SSI) oraz procedur wielowiekowych (cross_age)
// -------------------------------------------------------------
console.log('Test 11: Weryfikacja rekordu BCG (RPL ID 19535, BCG SSI) oraz procedur wielowiekowych (cross_age)');

// 1. BCG: oficjalne źródło ChPL w RPL (BCG 10, Synthaverse S.A., R/0210) bez automatycznego awansu treści i bez karty handlowej
const bcg = findChildVaccine('pso-bcg-0');
assert.ok(bcg, 'Rekord BCG musi istnieć');
assert.equal(
  bcg.chplOfficialSourceUrl,
  'https://rejestrymedyczne.ezdrowie.gov.pl/api/rpl/medicinal-products/19535/characteristic',
  'BCG 10 musi wskazywać bezpośredni URL oficjalnej ChPL w RPL (ID 19535)'
);
assert.equal(bcg.chplProductName, 'Szczepionka przeciwgruźlicza BCG 10', 'Nazwa produktu leczniczego BCG 10');
assert.equal(bcg.chplMarketingAuthorizationHolder, 'Synthaverse S.A.', 'Podmiot odpowiedzialny BCG 10');
assert.equal(bcg.chplAuthorizationNumber, 'R/0210', 'Numer pozwolenia BCG 10');
assert.equal(
  bcg.chplPharmaceuticalForm,
  'proszek i rozpuszczalnik do sporządzania zawiesiny do wstrzykiwań śródskórnych',
  'Postać farmaceutyczna BCG 10'
);
assert.notEqual(bcg.psoOfficialUrl, bcg.chplOfficialSourceUrl, 'Źródło PSO i źródło ChPL muszą pozostać rozdzielone');
assert.equal(bcg.psoOfficialUrl, OFFICIAL_PDF_URL, 'BCG zachowuje oficjalny URL aktu PSO');

// BCG Szczepionka SSI – niepotwierdzona w aktywnym obrocie pod tą nazwą -> pending_verification, brak powiązania handlowego
assert.equal(bcg.alternativeProductStatus, 'pending_verification', 'BCG SSI musi mieć status alternativeProductStatus: pending_verification');
assert.ok(bcg.alternativeProductLabel?.includes('BCG Szczepionka SSI'), 'BCG musi dokumentować wynik sprawdzenia BCG Szczepionka SSI');
assert.ok(bcg.alternativeProductLabel?.includes('oczekuje na potwierdzenie'), 'BCG SSI musi być opisana jako oczekująca na potwierdzenie');
assert.equal(bcg.linkedVaccineIds.length, 0, 'Nie wolno tworzyć powiązania handlowego bez karty produktu i potwierdzenia');

// Statusy BCG: źródło zidentyfikowane, ale treść oczekuje na pełny audyt, a karta handlowa w katalogu jeszcze nie istnieje
assert.equal(bcg.psoVerificationStatus, 'verified_pso', 'BCG ma zweryfikowane źródło PSO');
assert.equal(bcg.chplReferenceStatus, 'official_document_identified', 'BCG ma zidentyfikowany oficjalny dokument ChPL w RPL');
assert.equal(bcg.chplContentVerificationStatus, 'pending_content_audit', 'Treść ChPL BCG 10 oczekuje na pełny audyt');
assert.equal(bcg.chplVerificationStatus, 'pending_chpl_verification', 'BCG nie może zostać automatycznie oznaczone jako verified_chpl');
assert.equal(bcg.productLinkageStatus, 'pending_catalog_entry', 'BCG zachowuje productLinkageStatus: pending_catalog_entry');

// 2. Procedury wielowiekowe (dokładnie 4 rekordy cross_age)
const crossAgeExpected = [
  'pso-rabies-postexposure',
  'pso-hepb-dialysis-primary',
  'pso-hepb-dialysis-booster',
  'pso-rec-hpv-catchup'
];

for (const id of crossAgeExpected) {
  const item = findChildVaccine(id);
  assert.ok(item, `Procedura ${id} musi istnieć`);
  assert.equal(item.populationScope, 'cross_age', `Procedura ${id} musi mieć populationScope: 'cross_age'`);
}

const allCrossAge = CHILD_VACCINES_CATALOG.filter(it => it.populationScope === 'cross_age');
assert.equal(allCrossAge.length, 4, 'W bazie muszą być dokładnie 4 procedury z oznaczeniem cross_age');

const allPediatric = CHILD_VACCINES_CATALOG.filter(it => it.populationScope === 'pediatric');
assert.equal(allPediatric.length, 39, 'W bazie musi być dokładnie 39 procedur z oznaczeniem pediatric');

console.log('   ✓ SCENARIUSZ 11 ZALICZONY: BCG 10 wskazuje oficjalny dokument RPL (ID 19535), BCG SSI pozostaje jako pending_verification, a 4 procedury mają cross_age.\n');

// -------------------------------------------------------------
// Test 12: Rozdzielenie identyfikacji źródła ChPL, weryfikacji treści i powiązań handlowych (PROMPT 18)
// -------------------------------------------------------------
console.log('Test 12: Rozdzielenie statusów źródła ChPL, weryfikacji treści ChPL oraz kontrola powiązań z vac-infanrix-hexa');

for (const it of CHILD_VACCINES_CATALOG) {
  assert.ok(['verified_pso', 'pending_verification'].includes(it.psoVerificationStatus), `Wpis ${it.id} musi mieć poprawny psoVerificationStatus`);
  assert.ok(['official_document_identified', 'reference_name_only', 'missing'].includes(it.chplReferenceStatus), `Wpis ${it.id} musi mieć poprawny chplReferenceStatus`);
  assert.ok(['verified_full', 'analyzed_with_discrepancy', 'pending_content_audit', 'not_verified'].includes(it.chplContentVerificationStatus), `Wpis ${it.id} musi mieć poprawny chplContentVerificationStatus`);
  assert.ok(['verified_chpl', 'requires_source_clarification', 'pending_chpl_verification', 'no_trade_product_linked'].includes(it.chplVerificationStatus), `Wpis ${it.id} musi mieć poprawny chplVerificationStatus`);
  assert.ok(['verified_public_free', 'verified_reimbursement', 'verified_self_funded', 'pending_clarification'].includes(it.fundingVerificationStatus), `Wpis ${it.id} musi mieć poprawny fundingVerificationStatus`);
  assert.ok(['linked_catalog', 'conditional_alternative', 'pending_catalog_entry', 'not_applicable'].includes(it.productLinkageStatus), `Wpis ${it.id} musi mieć poprawny productLinkageStatus`);

  // Brak podstawowego linkedVaccineIds nie jest błędem PSO
  if (it.productLinkageStatus === 'conditional_alternative') {
    assert.equal(it.linkedVaccineIds.length, 0, `Warunkowa alternatywa (${it.id}) nie może mieć preparatu w podstawowym linkedVaccineIds`);
    assert.equal(it.psoVerificationStatus, 'verified_pso');
  } else if (it.linkedVaccineIds.length === 0) {
    assert.equal(it.productLinkageStatus, 'pending_catalog_entry', `Wpis ${it.id} bez preparatu handlowego ma productLinkageStatus pending_catalog_entry`);
    assert.equal(it.psoVerificationStatus, 'verified_pso', `Brak preparatu handlowego NIE WPŁYWA na status verified_pso`);
  } else {
    assert.equal(it.productLinkageStatus, 'linked_catalog', `Wpis ${it.id} z powiązanym preparatem ma productLinkageStatus linked_catalog`);
  }
}

const identifiedDocCount = CHILD_VACCINES_CATALOG.filter(it => it.chplReferenceStatus === 'official_document_identified').length;
const refNameOnlyCount = CHILD_VACCINES_CATALOG.filter(it => it.chplReferenceStatus === 'reference_name_only').length;
const trulyVerifiedChplCount = CHILD_VACCINES_CATALOG.filter(it => it.chplContentVerificationStatus === 'verified_full' || it.chplVerificationStatus === 'verified_chpl').length;
const analyzedDiscrepancyCount = CHILD_VACCINES_CATALOG.filter(it => it.chplContentVerificationStatus === 'analyzed_with_discrepancy').length;
const pendingAuditCount = CHILD_VACCINES_CATALOG.filter(it => it.chplContentVerificationStatus === 'pending_content_audit').length;
const notVerifiedContentCount = CHILD_VACCINES_CATALOG.filter(it => it.chplContentVerificationStatus === 'not_verified').length;
const linkedCount = CHILD_VACCINES_CATALOG.filter(it => it.productLinkageStatus === 'linked_catalog').length;
const conditionalAltCount = CHILD_VACCINES_CATALOG.filter(it => it.productLinkageStatus === 'conditional_alternative').length;
const pendingCatalogCount = CHILD_VACCINES_CATALOG.filter(it => it.productLinkageStatus === 'pending_catalog_entry').length;

assert.equal(identifiedDocCount, 15, 'Dokładnie 15 procedur posiada zidentyfikowany oficjalny dokument ChPL (BCG 10 + 12 Infanrix hexa + grypa 2026/2027 Influvac 49462 / Vaxigrip 50032 + COVID-19 EMA EPAR Spikevax XFG PL/EN)');
assert.equal(refNameOnlyCount, 28, 'Dokładnie 28 procedur zawiera jedynie orientacyjną nazwę handlową produktu');
assert.equal(trulyVerifiedChplCount, 0, 'Żadna procedura nie może być oznaczona jako w pełni zweryfikowana ChPL bez zamknięcia niezgodności i pełnego audytu');
assert.equal(analyzedDiscrepancyCount, 12, '12 procedur kalendarzowych powiązanych z Infanrix hexa ma status analyzed_with_discrepancy');
assert.equal(pendingAuditCount, 3, 'Wyłącznie 3 procedury ze zidentyfikowanym oficjalnym ChPL bez ukończonego audytu (pso-bcg-0, pso-rec-influenza-1, pso-rec-covid-pediatric) mają status pending_content_audit');
assert.equal(notVerifiedContentCount, 28, 'Wszystkie 28 procedur z samym odwołaniem referencyjnym mają status not_verified (spójność z brakiem dokumentu)');
assert.equal(linkedCount, 12, 'Dokładnie 12 procedur kalendarzowych (Wariant A.2) ma bezpośrednie powiązanie w katalogu (vac-infanrix-hexa)');
assert.equal(conditionalAltCount, 1, 'Dokładnie 1 procedura (pso-risk-preterm-dtap) ma status conditional_alternative (III.E.2 vs III.E.3)');
assert.equal(pendingCatalogCount, 30, 'Dokładnie 30 procedur oczekuje na wprowadzenie do katalogu handlowego');

// Audyt powiązań handlowych vac-infanrix-hexa (wcześniaki DTaP 3w1 vs 6w1, przesunięcie dawki IPV w A.2, HBV w A.2)
const pretermDtap = findChildVaccine('pso-risk-preterm-dtap');
assert.ok(pretermDtap, 'pso-risk-preterm-dtap musi istnieć');
assert.equal(pretermDtap.chplReferenceStatus, 'reference_name_only', 'pso-risk-preterm-dtap wskazuje ChPL Infanrix DTPa (brak dokumentu/karty 3w1 w bazie)');
assert.equal(pretermDtap.chplContentVerificationStatus, 'not_verified', 'Brak pobranej ChPL 3w1 wyklucza status pending_content_audit — wymagane not_verified');
assert.equal(pretermDtap.chplVerificationStatus, 'pending_chpl_verification', 'pso-risk-preterm-dtap nie może być oznaczony jako zweryfikowany');
assert.equal(pretermDtap.linkedVaccineIds.length, 0, '6w1 nie może znajdować się w podstawowym linkedVaccineIds dla DTaP 3w1');
assert.equal(pretermDtap.productLinkages?.[0]?.relationType, 'conditional_alternative', 'Relacja pso-risk-preterm-dtap -> vac-infanrix-hexa musi mieć typ conditional_alternative');
assert.ok(pretermDtap.linkageAuditNote?.includes('ROZBIEŻNOŚĆ DO WERYFIKACJI') && pretermDtap.linkageAuditNote?.includes('III.E.3'), 'pso-risk-preterm-dtap musi posiadać precyzyjną uwagę o rozbieżności 3w1 vs 6w1');

for (const ipvId of ['pso-ipv-1', 'pso-ipv-2', 'pso-ipv-3']) {
  const ipvItem = findChildVaccine(ipvId);
  assert.ok(ipvItem, `${ipvId} musi istnieć`);
  assert.ok(ipvItem.linkageAuditNote?.includes('Wariant A.2 (6w1)'), `${ipvId} musi zawierać uwagę o przesunięciu numeru dawki IPV w wariancie 6w1`);
}

const hbv2 = findChildVaccine('pso-hbv-2');
assert.ok(hbv2?.linkageAuditNote?.includes('Wariant A.2 (6w1)'), 'pso-hbv-2 musi zawierać uwagę o pokryciu dawki przez Infanrix hexa');

console.log('   ✓ SCENARIUSZ 12 ZALICZONY: Rozdzielono identyfikację dokumentu ChPL (15), weryfikację treści (0 verified_full, 12 discrepancy, 3 pending_audit, 28 not_verified) i warunkową alternatywę DTaP 3w1/6w1.\n');

console.log('13. Weryfikacja wymogów PROMPT 19: niezmienniki statusowe, bramka verified_full, IPV w A.2, BCG/AJVaccines oraz finansowanie...');

// 13.1 Zero sprzeczności statusowych w całym katalogu
const catalogSummary = auditChildVaccinesCatalogSummary(CHILD_VACCINES_CATALOG, VACCINES_CATALOG);
assert.deepEqual(catalogSummary.invariantViolations, [], 'Wszystkie 43 rekordy muszą spełniać pełne niezmienniki ChPL, powiązań i finansowania');
assert.equal(catalogSummary.infanrixHexaVariantA2Links, 12);
assert.equal(catalogSummary.infanrixHexaConditionalLinks, 1);
assert.equal(catalogSummary.infanrixHexaTotalLinks, 13, 'Wszystkie 13 relacji do vac-infanrix-hexa (12 A.2 + 1 warunkowa) muszą być audytowane');
assert.equal(deriveChplVerificationStatus('reference_name_only', 'not_verified'), 'pending_chpl_verification');
assert.equal(deriveChplVerificationStatus('official_document_identified', 'analyzed_with_discrepancy'), 'requires_source_clarification');
assert.equal(deriveChplVerificationStatus('official_document_identified', 'verified_full'), 'verified_chpl');

// Negatywna kontrola niezmiennika: sprzeczność reference_name_only + pending_content_audit musi być odrzucona
const brokenSynthetic = {
  ...pretermDtap,
  chplReferenceStatus: 'reference_name_only',
  chplContentVerificationStatus: 'pending_content_audit',
};
const brokenErrors = validateChildVaccineStatusInvariants(brokenSynthetic, VACCINES_CATALOG);
assert.ok(brokenErrors.length > 0, 'Walidator musi wykryć sprzeczność reference_name_only + pending_content_audit');

// 13.2 Bramka awansu do verified_full musi blokować braki źródłowe i nierozstrzygniętą niezgodność Infanrix hexa
const dtp1 = findChildVaccine('pso-dtp-1');
const dtp1Gate = canPromoteToVerifiedFull(dtp1, VACCINES_CATALOG);
assert.equal(dtp1Gate.allowed, false, 'Awans pso-dtp-1 do verified_full musi być zablokowany przez otwartą niezgodność Infanrix hexa');
assert.ok(dtp1Gate.reasons.some(r => r.includes('disc-phenylalanine-content-01')), 'Powód blokady musi wskazywać otwartą niezgodność disc-phenylalanine-content-01');

const bcgGate = canPromoteToVerifiedFull(bcg, VACCINES_CATALOG);
assert.equal(bcgGate.allowed, false, 'Awans pso-bcg-0 do verified_full musi być zablokowany przed ukończeniem pełnego audytu');

const missingUrlGate = canPromoteToVerifiedFull({ ...pretermDtap, chplOfficialSourceUrl: null }, VACCINES_CATALOG);
assert.equal(missingUrlGate.allowed, false, 'Brak oficjalnego URL ChPL musi blokować awans do verified_full');

const validSyntheticReady = {
  ...bcg,
  chplAudit: {
    ...bcg.chplAudit,
    verifiedSectionsScope: [...REQUIRED_CHPL_SECTION_NUMBERS],
    sectionReviews: FULL_10_SECTION_REVIEWS,
    auditOutcome: 'compliant',
    unresolvedDiscrepanciesCount: 0,
  },
};
assert.equal(canPromoteToVerifiedFull(validSyntheticReady, VACCINES_CATALOG).allowed, true, 'Kompletny audyt 10 sekcji ChPL bez rozbieżności z oficjalnym URL powinien przejść bramkę verified_full');

// 13.3 Prawidłowe mapowanie wszystkich 4 dawek wariantu A.2 (6w1), w tym 1. dawki IPV w 2. m.ż. bez duplikacji i pominięć
const ipvA2Audit = auditVariantA2IpvCoverage(CHILD_VACCINES_CATALOG);
assert.equal(ipvA2Audit.hasDuplicates, false, 'Nie wolno tworzyć zduplikowanej osobnej karty IPV w 2. m.ż.');
assert.equal(ipvA2Audit.allFourDosesAccountedFor, true, 'Wszystkie 4 dawki 6w1 / IPV (2., 4., 5.-6., 16.-18. m.ż.) muszą być spójnie zmapowane');

// 13.4 Zachowanie BCG 10 (19535) oraz audyt AJVaccines (20376) z rozróżnieniem ChPL vs dostępność w Polsce
assert.equal(bcg.alternativeProductStatus, 'pending_verification', 'Status produktu alternatywnego BCG musi pozostać nierozstrzygnięty');
assert.equal(bcg.alternativeProductDetails?.rplId, 20376);
assert.equal(bcg.alternativeProductDetails?.authorizationNumber, '12176');
assert.equal(bcg.alternativeProductDetails?.chplRevisionDate, '24-04-2024');
assert.equal(bcg.alternativeProductDetails?.officialChplUrl, 'https://rejestrymedyczne.ezdrowie.gov.pl/api/rpl/medicinal-products/20376/characteristic');
assert.equal(bcg.alternativeProductDetails?.marketAvailabilityStatus, 'unconfirmed_in_poland');

// 13.5 Finansowanie odrębne od samego wpisu PSO i pending_clarification dla spraw otwartych
const flu = findChildVaccine('pso-rec-influenza-1');
const covid = findChildVaccine('pso-rec-covid-pediatric');
const hpv9 = findChildVaccine('pso-rec-hpv-9');
assert.equal(flu?.fundingVerificationStatus, 'pending_clarification', 'Grypa po rozdzieleniu produktów 84W vs Fluenz vs realizacja POZ pozostaje na poziomie procedury pending_clarification');
assert.equal(hpvCatchup?.fundingVerificationStatus, 'pending_clarification', 'HPV 15-18 i 19-26 (podział Cervarix 84W vs Gardasil 9 pełnopłatny vs program 19-26) pozostaje pending_clarification na poziomie całej procedury');
assert.equal(covid?.fundingVerificationStatus, 'verified_public_free', 'COVID-19 sezon 2026/2027 (Komunikat nr 39 MZ i Ogólne wytyczne 04.09.2026) musi mieć verified_public_free');
assert.equal(hpv9?.fundingVerificationStatus, 'verified_public_free', 'HPV 9-14 musi mieć potwierdzone finansowanie (Obwieszczenie MZ poz. 71 + PSO II.A)');
assert.ok(hpv9?.officialFundingSourceRef?.includes('Dz. Urz. Min. Zdrow. poz. 71'), 'HPV 9-14 musi wskazywać Obwieszczenie MZ poz. 71');
assert.deepEqual(catalogSummary.fundingCounts, {
  verified_public_free: 36,
  verified_reimbursement: 0,
  verified_self_funded: 5,
  pending_clarification: 2,
});

// 13.6 Nienaruszalność karty Infanrix hexa w bazie preparatów
const infanrixProduct = VACCINES_CATALOG.find(v => v.id === 'vac-infanrix-hexa');
assert.equal(infanrixProduct?.verificationStatus, 'requires_source_clarification');
assert.equal(infanrixProduct?.sourceDiscrepancies?.[0]?.id, 'disc-phenylalanine-content-01');
assert.equal(infanrixProduct?.sourceDiscrepancies?.[0]?.status, 'requires_clarification');

console.log('   ✓ SCENARIUSZ 13 ZALICZONY: Niezmienniki (0 błędów), bramka verified_full, IPV w A.2, BCG/AJVaccines oraz audyt finansowania zweryfikowane.\n');

// -------------------------------------------------------------
// Test 14: Testy końcowe PROMPT 20 (10 testów z Zadania 8)
// -------------------------------------------------------------
console.log('Test 14: Testy końcowe PROMPT 20 – bramka ChPL, COVID-19 2026/2027, HPV, grypa 84W, 6w1 2+1 i statusy self-funded');

const bcgBase = findChildVaccine('pso-bcg-0');
assert.ok(bcgBase && bcgBase.chplAudit, 'Rekord pso-bcg-0 musi posiadać obiekt chplAudit');
assert.equal(bcgBase.chplAudit.documentDateStatus, 'missing_in_document', 'BCG 10 musi jawnie oznaczać brak daty w dokumencie ChPL');

// 14.1 Próba ustawienia verified_full bez auditor (puste lub placeholder) -> blokada
const bcgNoAuditor = {
  ...bcgBase,
  chplAudit: {
    ...bcgBase.chplAudit,
    auditor: '',
    auditDate: '10.11.2026',
    verifiedSectionsScope: ['4.1', '4.2'],
    auditOutcome: 'compliant',
    unresolvedDiscrepanciesCount: 0,
  },
};
const bcgPlaceholderAuditor = {
  ...bcgNoAuditor,
  chplAudit: {
    ...bcgNoAuditor.chplAudit,
    auditor: 'brak',
  },
};
assert.equal(canPromoteToVerifiedFull(bcgNoAuditor, VACCINES_CATALOG).allowed, false, '14.1: Brak audytora musi blokować verified_full');
assert.equal(canPromoteToVerifiedFull(bcgPlaceholderAuditor, VACCINES_CATALOG).allowed, false, '14.1: Placeholder w polu auditor musi blokować verified_full');

// 14.2 Próba ustawienia verified_full bez konkretnej auditDate lub z 'Brak informacji w dokumencie' -> blokada
//     oraz akceptacja 'Brak informacji w dokumencie' dla documentVersionOrDate przy pełnych pozostałych danych
const bcgMissingAuditDate = {
  ...bcgBase,
  chplAudit: {
    ...bcgBase.chplAudit,
    auditor: 'Zespół Kliniczny VaxNurse',
    auditDate: 'Brak informacji w dokumencie',
    verifiedSectionsScope: ['4.1', '4.2'],
    auditOutcome: 'compliant',
    unresolvedDiscrepanciesCount: 0,
  },
};
const bcgEmptyAuditDate = {
  ...bcgMissingAuditDate,
  chplAudit: {
    ...bcgMissingAuditDate.chplAudit,
    auditDate: '',
  },
};
assert.equal(canPromoteToVerifiedFull(bcgMissingAuditDate, VACCINES_CATALOG).allowed, false, '14.2: auditDate="Brak informacji w dokumencie" musi blokować verified_full');
assert.equal(canPromoteToVerifiedFull(bcgEmptyAuditDate, VACCINES_CATALOG).allowed, false, '14.2: Pusta auditDate musi blokować verified_full');

const bcgValidAuditCheck = {
  ...bcgBase,
  chplAudit: {
    ...bcgBase.chplAudit,
    documentVersionOrDate: 'Brak informacji w dokumencie',
    documentDateStatus: 'missing_in_document',
    auditor: 'Zespół Kliniczny VaxNurse',
    auditDate: '10.11.2026',
    verifiedSectionsScope: [...REQUIRED_CHPL_SECTION_NUMBERS],
    sectionReviews: FULL_10_SECTION_REVIEWS,
    auditOutcome: 'compliant',
    unresolvedDiscrepanciesCount: 0,
  },
};
assert.equal(
  canPromoteToVerifiedFull(bcgValidAuditCheck, VACCINES_CATALOG).allowed,
  true,
  '14.2: documentVersionOrDate="Brak informacji w dokumencie" przy pełnym konkretnym audycie wszystkich 10 sekcji może spełniać warunek dokumentowy'
);

// 14.3 Próba ustawienia verified_full bez verifiedSectionsScope / sectionReviews -> blokada; oraz zero rekordów produkcyjnych na verified_full
const bcgEmptySections = {
  ...bcgValidAuditCheck,
  chplAudit: {
    ...bcgValidAuditCheck.chplAudit,
    verifiedSectionsScope: [],
    sectionReviews: [],
  },
};
assert.equal(canPromoteToVerifiedFull(bcgEmptySections, VACCINES_CATALOG).allowed, false, '14.3: Puste verifiedSectionsScope / sectionReviews musi blokować verified_full');
assert.equal(catalogSummary.verifiedFull, 0, '14.3: Katalog produkcyjny nie może mieć rekordów w statusie verified_full bez ukończonego audytu');

// 14.4 COVID-19 2026/2027 jako verified_public_free z podziałem wieku i niepotwierdzoną dostępnością punktową
assert.equal(covid?.fundingVerificationStatus, 'verified_public_free');
assert.ok(covid?.fundingAuditDetails?.validityPeriod.includes('2026/2027'));
assert.ok(covid?.fundingAuditDetails?.productType.includes('Spikevax'));
assert.equal(covid?.fundingAuditDetails?.fundingScopes?.length, 4, '14.4: COVID-19 musi rozdzielać 4 zakresy (6m-4l naive, 6m-4l primed, 5-11l, 12+l)');
assert.equal(covid?.fundingAuditDetails?.mechanismBreakdown.localPointAvailabilityConfirmed, false, '14.4: Punktowa dostępność fiolki COVID-19 nie może być domyślnie potwierdzona');
assert.ok(
  covid?.fundingAuditDetails?.fundingScopes?.every(s => s.mechanismBreakdown.localPointAvailabilityConfirmed === false),
  '14.4: Każdy zakres COVID-19 musi jawnie zachowywać localPointAvailabilityConfirmed=false'
);

// 14.5 Rozdzielenie HPV: 9-14 (Cervarix+Gardasil 9), granica 18. urodzin (<18 D1 DZ vs >=18 A1 50% vs Gardasil 9), 19-26 (Cervarix <25 do 31.05.2027)
assert.equal(hpv9?.fundingVerificationStatus, 'verified_public_free');
assert.equal(hpv9?.fundingAuditDetails?.fundingScopes?.length, 2, '14.5: HPV 9-14 musi rozdzielać zakresy Cervarix i Gardasil 9 w programie MZ');
assert.equal(hpvCatchup?.fundingVerificationStatus, 'pending_clarification');
const hpvScopes = hpvCatchup?.fundingAuditDetails?.fundingScopes ?? [];
assert.equal(hpvScopes.length, 6, '14.5: pso-rec-hpv-catchup musi rozdzielać 6 zakresów (<18 Cervarix DZ, <18 Gardasil 9, >=18 Cervarix A1, >=18 Gardasil 9, 19-26 Cervarix program, WSSE Wrocław)');
const hpvCervarixUnder18 = hpvScopes.find(s => s.scopeId === 'hpv-under18-cervarix-d1');
const hpvCervarixAdult18 = hpvScopes.find(s => s.scopeId === 'hpv-adult18plus-cervarix-a1');
const hpvGardasilUnder18 = hpvScopes.find(s => s.scopeId === 'hpv-under18-gardasil9-self');
const hpvProgram1926 = hpvScopes.find(s => s.scopeId === 'hpv-19-26-cervarix-program');
assert.ok(
  hpvCervarixUnder18?.sourceRef.includes('84W') &&
    hpvCervarixUnder18.mechanismBreakdown.pharmacyReimbursement.includes('D1') &&
    hpvCervarixUnder18.isPediatricSelectable === true,
  '14.5: Cervarix <18 musi wskazywać wykaz 84W D1 (18- DZ) oraz pozostawać wybieralny pediatrycznie'
);
assert.ok(
  hpvCervarixAdult18?.sourceRef.includes('84W') &&
    hpvCervarixAdult18.mechanismBreakdown.partialReimbursementDetail.includes('50%') &&
    hpvCervarixAdult18.isPediatricSelectable === false,
  '14.5: Cervarix >=18 musi wskazywać wygaśnięcie DZ oraz 84W A1 50% z isPediatricSelectable=false'
);
assert.ok(hpvGardasilUnder18 && hpvGardasilUnder18.fundingStatus === 'verified_self_funded', '14.5: Gardasil 9 poza programem 9-14 i poza 84W musi być oznaczony jako pełnopłatny');
assert.ok(hpvProgram1926 && hpvProgram1926.fundingStatus === 'verified_public_free' && hpvProgram1926.validityPeriod.includes('31.05.2027'), '14.5: HPV 19-26 musi wskazywać Cervarix i termin do 31.05.2027');

// 14.6 Komunikat WSSE Wrocław 05.11.2026 oznaczony wyłącznie regionalnie (bez zamknięcia ogólnopolskiego)
const wsseWroclawScope = hpvScopes.find(s => s.scopeId === 'hpv-19-26-wsse-wroclaw-closure');
assert.ok(wsseWroclawScope, '14.6: Musi istnieć osobny zakres dla komunikatu WSSE Wrocław');
assert.equal(wsseWroclawScope.fundingStatus, 'regional_pool_closed', '14.6: Komunikat WSSE Wrocław musi mieć status regional_pool_closed');
assert.ok(wsseWroclawScope.sourceRef.includes('05.11.2026') || wsseWroclawScope.conditionsAndExceptions.includes('05.11.2026'), '14.6: Musi wskazywać datę 05.11.2026');
assert.equal(hpv9?.fundingVerificationStatus, 'verified_public_free', '14.6: Zamknięcie puli regionalnej WSSE Wrocław NIE może zamykać programu 9-14 lat');
assert.notEqual(hpvCervarixUnder18?.fundingStatus, 'regional_pool_closed', '14.6: Zamknięcie puli regionalnej 19-26 NIE może zamykać refundacji Cervarix 84W');

// 14.7 Rozdzielenie refundacji aptecznej preparatu od wykonania usługi przy grypie oraz wykluczenie Eflueldy
assert.equal(flu?.fundingVerificationStatus, 'pending_clarification');
const fluMech = flu?.fundingAuditDetails?.mechanismBreakdown;
assert.ok(fluMech, '14.7: Grypa musi posiadać rozdzielenie mechanizmów finansowania');
assert.ok(fluMech.pharmacyReimbursement.includes('Influvac') && fluMech.pharmacyReimbursement.includes('Vaxigrip'), '14.7: Grypa musi wymieniać Influvac i Vaxigrip w 84W');
assert.ok(fluMech.pharmacyReimbursement.includes('Fluenz'), '14.7: Grypa musi odróżniać Fluenz poza 84W od Influvac/Vaxigrip w 84W');
assert.ok(!fluMech.partialReimbursementDetail.includes('Efluelda'), '14.7: Zakres pediatryczny grypy nie może prezentować preparatu Efluelda w mechanismBreakdown');
assert.ok(fluMech.serviceExecutionFunding.includes('POZ') && fluMech.serviceExecutionFunding.includes('aptek'), '14.7: Grypa musi rozdzielać wykonanie usługi w POZ (<18 r.ż.) i aptekach (>=18 r.ż.)');
assert.ok(
  flu?.fundingAuditDetails?.excludedPediatricProducts?.some(p => p.productName === 'Efluelda' && p.excludedFromPediatricSelection === true),
  '14.7: Efluelda musi być jawnie wyizolowana w excludedPediatricProducts z excludedFromPediatricSelection=true'
);

// 14.8 Schemat 2+1 dla 6w1 wyłącznie jako indywidualna kontynuacja (bez zmiany PCV)
const variant6w1_2plus1 = COMBINED_VACCINES_VARIANTS_PART_III_M.find(v => v.id === 'variant-6w1-2plus1');
const variant6w1_3plus1 = COMBINED_VACCINES_VARIANTS_PART_III_M.find(v => v.id === 'variant-6w1-3plus1');
assert.ok(variant6w1_2plus1 && variant6w1_3plus1, '14.8: Warianty 6w1 3+1 i 2+1 muszą istnieć w COMBINED_VACCINES_VARIANTS_PART_III_M');
assert.ok(
  variant6w1_2plus1.name.includes('Schemat 2+1 – indywidualna kontynuacja wcześniej rozpoczętego szczepienia, zgodnie z ChPL i decyzją lekarza'),
  '14.8: Wariant 6w1 2+1 musi używać ścisłego sformułowania o indywidualnej kontynuacji'
);
const viewTsx = fs.readFileSync(path.resolve(process.cwd(), 'src/components/childVaccinations/ChildVaccinationsView.tsx'), 'utf8');
assert.ok(
  viewTsx.includes('Schemat 2+1 – indywidualna kontynuacja wcześniej rozpoczętego szczepienia, zgodnie z ChPL i decyzją lekarza'),
  '14.8: ChildVaccinationsView.tsx musi wyświetlać dokładny opis kontynuacyjny dla 6w1 2+1'
);
const pcv1 = findChildVaccine('pso-pcv-1');
assert.ok(
  pcv1 &&
    pcv1.totalDosesInStandardSeries === 3 &&
    pcv1.clinicalNotes.includes('w schemacie 2+1') &&
    !pcv1.clinicalNotes.includes('indywidualna kontynuacja'),
  '14.8: Standardowy schemat PCV 2+1 w Cz. I.A.1 nie może zostać zniekształcony'
);

// 14.9 Zachowanie i doprecyzowanie 5 statusów verified_self_funded
const selfFundedIds = [
  'pso-rec-menb-1',
  'pso-rec-menacwy-1',
  'pso-rec-vzv-1',
  'pso-rec-kzm-1',
  'pso-rec-hava-1',
];
for (const sfId of selfFundedIds) {
  const sfItem = findChildVaccine(sfId);
  assert.equal(sfItem?.fundingVerificationStatus, 'verified_self_funded', `14.9: ${sfId} po sprawdzeniu wykazu 84W zachowuje verified_self_funded`);
  assert.ok(sfItem?.fundingAuditDetails?.mechanismBreakdown, `14.9: ${sfId} musi posiadać mechanismBreakdown`);
  assert.ok(sfItem?.fundingAuditDetails?.conditions.length > 20, `14.9: ${sfId} musi jawnie dokumentować wyjątki ustawowe / grup ryzyka`);
}
const vzvRec = findChildVaccine('pso-rec-vzv-1');
assert.equal(vzvRec?.fundingAuditDetails?.fundingScopes?.length, 2, '14.9: Ospa wietrzna (pso-rec-vzv-1) musi rozdzielać ścieżkę zalecaną oraz Cz. I.B bezpłatną dla grup ryzyka');
const cardTsx = fs.readFileSync(path.resolve(process.cwd(), 'src/components/childVaccinations/ChildVaccineCard.tsx'), 'utf8');
assert.ok(
  cardTsx.includes('Co do zasady odpłatne w populacji ogólnej (z wyjątkami ustawowymi / grup ryzyka)') &&
    !cardTsx.includes('Potwierdzone: odpłatne (środki pacjenta/rodziców)'),
  '14.9: ChildVaccineCard.tsx nie może prezentować verified_self_funded jako bezwarunkowo odpłatnego dla każdego'
);

// 14.10 Integralność niezgodności, nienaruszalność vac-infanrix-hexa i systemu backupu
assert.equal(CHILD_VACCINES_CATALOG.length, 43);
assert.equal(catalogSummary.invariantViolations.length, 0);
assert.equal(infanrixProduct?.sourceDiscrepancies?.[0]?.id, 'disc-phenylalanine-content-01');
assert.equal(infanrixProduct?.sourceDiscrepancies?.[0]?.status, 'requires_clarification');
assert.equal(fs.existsSync(path.resolve(process.cwd(), 'src/utils/backup.ts')), true, '14.10: Moduł kopii bezpieczeństwa src/utils/backup.ts musi pozostać nienaruszony');

console.log('   ✓ SCENARIUSZ 14 ZALICZONY: Wszystkie 10 testów końcowych PROMPT 20 zaliczone bez błędów.\n');

// -------------------------------------------------------------
// Test 15: Testy końcowe PROMPT 21 (12 testów z Zadania 6)
// -------------------------------------------------------------
console.log('Test 15: Testy końcowe PROMPT 21 – bramka 1–10 ChPL, rozdzielenie karty od ChPL, granica 18. urodzin, grypa bez Eflueldy, GTIN COVID-19');

// 15.1 Kontrola wszystkich 10 sekcji ChPL (1–10): pojedyncza sekcja, 1–9 bez 10, brak uzasadnienia, brak daty/audytora, otwarte niezgodności
const singleSectionOnly = {
  ...bcgValidAuditCheck,
  chplAudit: {
    ...bcgValidAuditCheck.chplAudit,
    verifiedSectionsScope: ['4.3'],
    sectionReviews: [{ sectionNumber: '4', status: 'verified' }],
  },
};
assert.equal(canPromoteToVerifiedFull(singleSectionOnly, VACCINES_CATALOG).allowed, false, '15.1: Audyt pojedynczej sekcji (np. 4.3) musi być odrzucony');

const nineSectionsWithoutTen = {
  ...bcgValidAuditCheck,
  chplAudit: {
    ...bcgValidAuditCheck.chplAudit,
    verifiedSectionsScope: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
    sectionReviews: FULL_10_SECTION_REVIEWS.filter(s => s.sectionNumber !== '10'),
  },
};
assert.equal(canPromoteToVerifiedFull(nineSectionsWithoutTen, VACCINES_CATALOG).allowed, false, '15.1: Sekcje 1–9 bez pkt 10 muszą zostać odrzucone');

const missingJustificationForTen = {
  ...bcgValidAuditCheck,
  chplAudit: {
    ...bcgValidAuditCheck.chplAudit,
    sectionReviews: FULL_10_SECTION_REVIEWS.map(s =>
      s.sectionNumber === '10' ? { sectionNumber: '10', status: 'not_present_in_document', justification: 'brak' } : s
    ),
  },
};
assert.equal(canPromoteToVerifiedFull(missingJustificationForTen, VACCINES_CATALOG).allowed, false, '15.1: Brak uzasadnienia (>=10 znaków) przy not_present_in_document musi blokować verified_full');

const infanrixOpenDiscrepancyCheck = {
  ...findChildVaccine('pso-dtp-1'),
  chplAudit: {
    ...findChildVaccine('pso-dtp-1').chplAudit,
    verifiedSectionsScope: [...REQUIRED_CHPL_SECTION_NUMBERS],
    sectionReviews: FULL_10_SECTION_REVIEWS.map(s => ({ sectionNumber: s.sectionNumber, status: 'verified' })),
    auditOutcome: 'compliant',
    unresolvedDiscrepanciesCount: 0,
  },
};
assert.equal(canPromoteToVerifiedFull(infanrixOpenDiscrepancyCheck, VACCINES_CATALOG).allowed, false, '15.1: Otwarta niezgodność ChPL na karcie vac-infanrix-hexa zawsze blokuje awans do verified_full');
assert.equal(canPromoteToVerifiedFull(bcgValidAuditCheck, VACCINES_CATALOG).allowed, true, '15.1: Kompletny audyt 1–10 (z uzasadnionym pkt 10), konkretnym audytorem/datą i 0 niezgodności przechodzi bramkę');

// 15.2 Niezależność statusu ChPL od brakującej/niepełnej karty VACCINES_CATALOG + statusy kompletności i adekwatności
const syntheticCompleteChplNoCatalogCard = {
  ...bcgValidAuditCheck,
  id: 'synthetic-chpl-no-card',
  linkedVaccineIds: [],
  productLinkages: [],
  productLinkageStatus: 'pending_catalog_entry',
};
assert.equal(
  canPromoteToVerifiedFull(syntheticCompleteChplNoCatalogCard, VACCINES_CATALOG).allowed,
  true,
  '15.2: Brak karty katalogowej w VACCINES_CATALOG NIE blokuje potwierdzenia treści dokumentu ChPL (canPromoteToVerifiedFull)'
);
assert.equal(
  deriveCatalogCardCompletenessStatus(syntheticCompleteChplNoCatalogCard, VACCINES_CATALOG),
  'missing_catalog_card',
  '15.2: Brakująca karta musi zwracać missing_catalog_card niezależnie od audytu treści ChPL'
);
assert.equal(
  deriveProcedureProductAdequacyStatus(syntheticCompleteChplNoCatalogCard, VACCINES_CATALOG),
  'pending_adequacy_review',
  '15.2: Brak powiązanej karty oznacza pending_adequacy_review dla adekwatności procedury'
);
assert.equal(
  deriveCatalogCardCompletenessStatus(dtp1, VACCINES_CATALOG),
  'incomplete_or_unverified_card',
  '15.2: Karta vac-infanrix-hexa z otwartą niezgodnością musi zwracać incomplete_or_unverified_card'
);
assert.equal(
  deriveProcedureProductAdequacyStatus(dtp1, VACCINES_CATALOG),
  'requires_clarification',
  '15.2: Procedura powiązana z kartą o otwartej niezgodności zwraca requires_clarification'
);
assert.ok(
  catalogSummary.missingCatalogCardCount > 0 && catalogSummary.incompleteCatalogCardCount > 0 && catalogSummary.completeCatalogCardCount === 0,
  '15.2: Podsumowanie katalogu musi raportować odrębne liczniki kompletności kart VACCINES_CATALOG'
);

// 15.3 Granica 18. urodzin w HPV (brak niejednoznacznego zakresu "15–18 lat")
assert.ok(!hpvScopes.some(s => /15[–-]18/.test(s.label) || /15[–-]18/.test(s.ageGroup)), '15.3: Zakresy pso-rec-hpv-catchup nie mogą wrzucać <18 i >=18 do jednego worka "15–18 lat"');
const pediatricHpvCatchupScopes = getPediatricSelectableFundingScopes(hpvCatchup);
const adultHpvCatchupScopes = getAdultAndSpecialReferenceScopes(hpvCatchup);
assert.equal(pediatricHpvCatchupScopes.length, 2, '15.3: Wybieralne pediatrycznie zakresy HPV catch-up obejmują wyłącznie <18 (Cervarix D1 DZ + Gardasil 9 100%)');
assert.equal(adultHpvCatchupScopes.length, 4, '15.3: Oddzielone zakresy >=18 / regionalne HPV catch-up obejmują 4 pozycje');
assert.ok(
  pediatricHpvCatchupScopes.some(s => s.scopeId === 'hpv-under18-cervarix-d1' && s.sourceRef.includes('D1 poz. 2385')),
  '15.3: Przed 18. r.ż. Cervarix posiada bezpłatną ścieżkę 84W D1 poz. 2385 (DZ)'
);
assert.ok(
  adultHpvCatchupScopes.some(
    s =>
      s.scopeId === 'hpv-adult18plus-cervarix-a1' &&
      s.sourceRef.includes('A1 poz. 3669') &&
      s.conditionsAndExceptions.includes('139,44 zł') &&
      s.conditionsAndExceptions.includes('traci uprawnienie')
  ),
  '15.3: Po ukończeniu 18. r.ż. Cervarix traci DZ i przechodzi na A1 poz. 3669 (50% = 139,44 zł)'
);
assert.ok(
  adultHpvCatchupScopes.some(s => s.scopeId === 'hpv-adult18plus-gardasil9-self' && s.fundingStatus === 'verified_self_funded'),
  '15.3: Gardasil 9 poza programem 9–14 pozostaje pełnopłatny również od 18. urodzin'
);

// 15.4 Program HPV 19–26 (>=18 do <26): wyłącznie Cervarix, start <25, 3 dawki 0,1,6 do 31.05.2027
assert.ok(
  hpvProgram1926 &&
    hpvProgram1926.productScope.includes('Wyłącznie Cervarix') &&
    hpvProgram1926.ageGroup.includes('25') &&
    hpvProgram1926.ageGroup.includes('26') &&
    hpvProgram1926.productScope.includes('0, 1, 6') &&
    hpvProgram1926.conditionsAndExceptions.includes('51 000 dawek') &&
    hpvProgram1926.conditionsAndExceptions.includes('31.05.2027'),
  '15.4: Program 19–26 musi precyzować Cervarix-only, start <25 r.ż., pulę 51 000 dawek i 3 dawki (0,1,6) do 31.05.2027'
);

// 15.5 Lokalne zamknięcie HPV wyłącznie dla WSSE Wrocław 05.11.2026
assert.ok(
  wsseWroclawScope &&
    wsseWroclawScope.fundingStatus === 'regional_pool_closed' &&
    wsseWroclawScope.isPediatricSelectable === false &&
    wsseWroclawScope.conditionsAndExceptions.includes('WSSE we Wrocławiu') &&
    wsseWroclawScope.conditionsAndExceptions.includes('05.11.2026') &&
    wsseWroclawScope.conditionsAndExceptions.includes('NIE zamyka ogólnopolskiego'),
  '15.5: Komunikat WSSE Wrocław z 05.11.2026 nie może uogólniać zamknięcia na cały kraj'
);

// 15.6 Grypa – rozdzielenie zakresów pediatrycznych, dorosłych (18-64, 65+), niepotwierdzonej dostępności Fluenz oraz ciąży/połogu
const fluPediatricScopes = getPediatricSelectableFundingScopes(flu);
const fluAdultScopes = getAdultAndSpecialReferenceScopes(flu);
const fluUnconfirmedScopes = getUnconfirmedSeasonalScopes(flu);
assert.equal(fluPediatricScopes.length, 2, '15.6: Wybieralne pediatrycznie zakresy grypy w sezonie 2026/2027 to wyłącznie trójwalentne Influvac (6m-<18) i Vaxigrip (6m-<18)');
assert.ok(
  fluPediatricScopes.some(s => s.scopeId === 'flu-pediatric-under18-influvac' && s.sourceRef.includes('D1 poz. 2384')),
  '15.6: Influvac <18 z D1 poz. 2384'
);
assert.ok(
  fluPediatricScopes.some(s => s.scopeId === 'flu-pediatric-under18-vaxigrip' && s.sourceRef.includes('D1 poz. 2567')),
  '15.6: Vaxigrip <18 z D1 poz. 2567'
);
assert.ok(
  fluUnconfirmedScopes.some(
    s =>
      s.scopeId === 'flu-pediatric-under18-fluenz' &&
      s.productScope.includes('Fluenz Tetra') &&
      s.productScope.includes('14.07.2025') &&
      s.isPediatricSelectable === false &&
      s.seasonalAvailabilityStatus === 'unconfirmed_for_season' &&
      s.fundingStatus === 'pending_clarification'
  ) &&
    fluUnconfirmedScopes.some(
      s =>
        s.scopeId === 'flu-pediatric-under18-fluenz-trivalent' &&
        s.productScope.includes('EMEA/H/C/006514') &&
        s.isPediatricSelectable === false &&
        s.seasonalAvailabilityStatus === 'unconfirmed_for_season' &&
        s.fundingStatus === 'pending_clarification'
    ),
  '15.6: Wycofana Fluenz Tetra (KE 14.07.2025) i niedostępna w Polsce 3-walentna Fluenz (EMEA/H/C/006514) są rozdzielone i wyłączone z wyboru'
);
assert.equal(fluAdultScopes.length, 3, '15.6: Zakresy dorosłych/szczególne dla grypy muszą rozdzielać 18–64, >=65 oraz ciąża/połóg');
assert.ok(
  fluAdultScopes.every(s => s.isPediatricSelectable === false),
  '15.6: Wszystkie zakresy dorosłych/szczególne grypy muszą mieć isPediatricSelectable=false'
);
const fluPregnancy = fluAdultScopes.find(s => s.scopeId === 'flu-pregnancy-puerperium-reference');
assert.ok(
  fluPregnancy?.sourceRef.includes('E (poz. 395, 397)') &&
    fluPregnancy.fundingStatus === 'verified_reimbursement' &&
    fluPregnancy.conditionsAndExceptions.includes('43b') &&
    fluPregnancy.conditionsAndExceptions.includes('połogu') &&
    fluPregnancy.conditionsAndExceptions.includes('6 tygodni') &&
    fluPregnancy.conditionsAndExceptions.includes('recepta farmaceutyczna'),
  '15.6: Zakres ciąża i połóg musi mieć warunkowy verified_reimbursement z art. 43b (6 tyg. + 15 dni), wykazem E, PZH oraz granicami POZ vs apteka'
);

// 15.7 Wykluczenie preparatu Efluelda z modułu wyboru dziecięcego i widoku ChildVaccineCard
assert.equal(
  CHILD_VACCINES_CATALOG.some(proc =>
    getPediatricSelectableFundingScopes(proc).some(s => `${s.label} ${s.productScope} ${s.ageGroup}`.toLowerCase().includes('efluelda'))
  ),
  false,
  '15.7: Żaden wybieralny pediatrycznie zakres w całym katalogu nie może zawierać preparatu Efluelda'
);
const eflueldaExcluded = flu?.fundingAuditDetails?.excludedPediatricProducts?.find(p => p.productName === 'Efluelda');
assert.ok(
  eflueldaExcluded &&
    eflueldaExcluded.gtin === '05909991560225' &&
    eflueldaExcluded.excludedFromPediatricSelection === true &&
    eflueldaExcluded.registeredAgeIndication.includes('>=60 lat') &&
    eflueldaExcluded.reimbursementSummary.includes('A1 poz. 4135'),
  '15.7: Efluelda musi być opisana w excludedPediatricProducts z A1 poz. 4135 i wskazaniem >=60 lat'
);
assert.ok(
  cardTsx.includes('getPediatricSelectableFundingScopes(item)') &&
    cardTsx.includes("item.populationScope === 'cross_age'") &&
    !cardTsx.includes('excludedPediatricProducts') &&
    !cardTsx.includes('Efluelda'),
  '15.7: ChildVaccineCard.tsx nie może renderować excludedPediatricProducts ani Eflueldy oraz ukrywa adultReferenceScopes dla procedur pediatric'
);

// 15.8 Rozdzielenie refundacji aptecznej preparatu od wykonania usługi (POZ <18 vs apteka >=18)
assert.ok(
  flu?.fundingAuditDetails?.mechanismBreakdown.serviceExecutionFunding.includes('<18 r.ż.') &&
    flu.fundingAuditDetails.mechanismBreakdown.serviceExecutionFunding.includes('>=18 r.ż.') &&
    covid?.fundingAuditDetails?.mechanismBreakdown.serviceExecutionFunding.includes('POZ') &&
    covid.contraindicationsOrWarnings?.includes('Apteki realizują szczepienia wyłącznie u dorosłych >=18. r.ż.'),
  '15.8: Zarówno grypa, jak i COVID-19 muszą rozdzielać POZ (<18) i apteki (>=18) w wykonaniu usługi'
);

// 15.9 Dokumentacja źródeł GTIN dla COVID-19 (Spikevax XFG) – Wytyczne MZ + RARS z rozdzieleniem RPL/EPAR EMA
const covidGtins = covid?.fundingAuditDetails?.gtinReferences ?? [];
assert.equal(covidGtins.length, 2, '15.9: COVID-19 musi dokumentować oba kody GTIN Spikevax XFG (00380777714110 oraz 00380777712024)');
const gtinUnder12 = covidGtins.find(g => g.gtin === '00380777714110');
const gtin12Plus = covidGtins.find(g => g.gtin === '00380777712024');
assert.ok(
  gtinUnder12 &&
    gtinUnder12.targetAgeGroup.includes('<12') &&
    gtinUnder12.dose.includes('0,25 ml') &&
    gtinUnder12.sourceDocumentUrl === 'https://www.gov.pl/attachment/81620ba1-b206-4ad0-8ad7-bf9ff17e193f' &&
    gtinUnder12.rarsSourceUrl === 'https://www.gov.pl/web/rars/covid-19' &&
    gtinUnder12.confirmedByMzGuidelines === true &&
    gtinUnder12.confirmedByRars === true &&
    gtinUnder12.confirmedByRpl === false &&
    gtinUnder12.confirmedByEma === false &&
    gtinUnder12.crossCheckedWithEparOrRpl === false &&
    gtinUnder12.verificationStatus === 'confirmed_mz_guideline_and_rars_pending_rpl_ema',
  '15.9: GTIN 00380777714110 musi być potwierdzony w Wytycznych MZ i na stronie RARS przy zachowaniu false dla RPL i EMA'
);
assert.ok(
  gtin12Plus &&
    gtin12Plus.targetAgeGroup.includes('>=12') &&
    gtin12Plus.dose.includes('0,5 ml') &&
    gtin12Plus.rarsSourceUrl === 'https://www.gov.pl/web/rars/covid-19' &&
    gtin12Plus.confirmedByMzGuidelines === true &&
    gtin12Plus.confirmedByRars === true &&
    gtin12Plus.confirmedByRpl === false &&
    gtin12Plus.confirmedByEma === false &&
    gtin12Plus.notes.includes('Komunikat nr 39 MZ (04/07.09.2026) NIE zawiera kodów GTIN') &&
    gtin12Plus.notes.includes('EPAR EMA') &&
    gtin12Plus.crossCheckedWithEparOrRpl === false,
  '15.9: GTIN 00380777712024 musi potwierdzać Wytyczne MZ + RARS i oddzielać je od braku GTIN w Komunikacie nr 39, RPL i EPAR EMA'
);

// 15.10 Integralność systemu kopii bezpieczeństwa
const backupTs = fs.readFileSync(path.resolve(process.cwd(), 'src/utils/backup.ts'), 'utf8');
assert.ok(
  backupTs.includes('BACKUP_SCHEMA_VERSION') &&
    backupTs.includes('createBackupPayload') &&
    backupTs.includes('validateBackupPayload'),
  '15.10: Moduł src/utils/backup.ts musi pozostać nienaruszony'
);

// 15.11 Nienaruszalność vac-infanrix-hexa i disc-phenylalanine-content-01
assert.equal(infanrixProduct?.tradeName, 'Infanrix hexa');
assert.equal(infanrixProduct?.verificationStatus, 'requires_source_clarification');
assert.equal(infanrixProduct?.sourceDiscrepancies?.length, 1);
assert.equal(infanrixProduct?.sourceDiscrepancies?.[0]?.id, 'disc-phenylalanine-content-01');

// 15.12 Niezmieniona liczba procedur (43), 0 naruszeń niezmienników i 0 verified_full
assert.equal(CHILD_VACCINES_CATALOG.length, 43, '15.12: Katalog PSO 2027 musi liczyć dokładnie 43 procedury');
assert.equal(catalogSummary.invariantViolations.length, 0, '15.12: Wszystkie niezmienniki katalogu muszą przejść (0 naruszeń)');
assert.equal(catalogSummary.verifiedFull, 0, '15.12: Liczba rekordów z verified_full musi pozostać równa 0');

console.log('   ✓ SCENARIUSZ 15 ZALICZONY: Wszystkie 12 testów końcowych PROMPT 21 zaliczone bez błędów.\n');

// -------------------------------------------------------------
// Test 16: Testy końcowe PROMPT 22 (13 testów z Zadania 7)
// -------------------------------------------------------------
console.log('Test 16: Testy końcowe PROMPT 22 – dowody sekcji ChPL 4.1–4.9, GTIN RARS, HPV min 9 lat, grypa 3-walentna bez Fluenz i połóg');

// 16.1 Puste lub ogólnikowe verificationNote dla wszystkich 10 sekcji 'verified' -> BLOKADA
const rubberStampedReviews = REQUIRED_CHPL_SECTION_NUMBERS.map(sectionNumber => ({
  sectionNumber,
  status: 'verified',
  pageRef: 'PDF str. 1',
  verificationNote: sectionNumber === '4' ? 'ok' : 'zweryfikowano',
  subpoints: REQUIRED_SECTION_4_SUBPOINTS.map(subpointId => ({
    subpointId,
    status: 'verified',
    pageRef: 'PDF str. 2',
    verificationNote: 'ok',
  })),
}));
const rubberStampGate = canPromoteToVerifiedFull(
  {
    ...bcgValidAuditCheck,
    chplAudit: { ...bcgValidAuditCheck.chplAudit, sectionReviews: rubberStampedReviews },
  },
  VACCINES_CATALOG
);
assert.equal(rubberStampGate.allowed, false, '16.1: Samo oznaczenie status="verified" z pustą/ogólnikową notatką ("ok"/"zweryfikowano") musi być odrzucone');

// 16.2 Sekcja 4 bez rozbioru 4.1–4.9 lub z pominiętym podpunktem (np. bez 4.9) -> BLOKADA
const missingSection4SubpointsGate = canPromoteToVerifiedFull(
  {
    ...bcgValidAuditCheck,
    chplAudit: {
      ...bcgValidAuditCheck.chplAudit,
      sectionReviews: FULL_10_SECTION_REVIEWS.map(s =>
        s.sectionNumber === '4' ? { ...s, subpoints: [] } : s
      ),
    },
  },
  VACCINES_CATALOG
);
assert.equal(missingSection4SubpointsGate.allowed, false, '16.2: Sekcja 4 ChPL bez rozbioru podpunktów 4.1–4.9 musi blokować verified_full');

const incompleteSection4SubpointsGate = canPromoteToVerifiedFull(
  {
    ...bcgValidAuditCheck,
    chplAudit: {
      ...bcgValidAuditCheck.chplAudit,
      sectionReviews: FULL_10_SECTION_REVIEWS.map(s =>
        s.sectionNumber === '4'
          ? { ...s, subpoints: SECTION_4_VERIFIED_SUBPOINTS.filter(sp => sp.subpointId !== '4.9') }
          : s
      ),
    },
  },
  VACCINES_CATALOG
);
assert.equal(incompleteSection4SubpointsGate.allowed, false, '16.2: Pominięcie podpunktu 4.9 w sekcji 4 ChPL musi blokować verified_full');

// 16.3 Brak pageRef lub nieuzasadnione not_applicable -> BLOKADA
const missingPageRefGate = canPromoteToVerifiedFull(
  {
    ...bcgValidAuditCheck,
    chplAudit: {
      ...bcgValidAuditCheck.chplAudit,
      sectionReviews: FULL_10_SECTION_REVIEWS.map(s =>
        s.sectionNumber === '1' ? { ...s, pageRef: '' } : s
      ),
    },
  },
  VACCINES_CATALOG
);
assert.equal(missingPageRefGate.allowed, false, '16.3: Brak odniesienia do strony PDF (pageRef) przy status="verified" musi blokować verified_full');

const lazyNotApplicableSubpointGate = canPromoteToVerifiedFull(
  {
    ...bcgValidAuditCheck,
    chplAudit: {
      ...bcgValidAuditCheck.chplAudit,
      sectionReviews: FULL_10_SECTION_REVIEWS.map(s =>
        s.sectionNumber === '4'
          ? {
              ...s,
              subpoints: SECTION_4_VERIFIED_SUBPOINTS.map(sp =>
                sp.subpointId === '4.7'
                  ? { subpointId: '4.7', status: 'not_applicable', justification: 'brak' }
                  : sp
              ),
            }
          : s
      ),
    },
  },
  VACCINES_CATALOG
);
assert.equal(lazyNotApplicableSubpointGate.allowed, false, '16.3: Nieuzasadnione not_applicable w podpunkcie 4.7 musi blokować verified_full');

// 16.4 Pełny audyt dowodowy przechodzi bramkę, natomiast katalog produkcyjny zachowuje 0 verified_full i rzeczywiste strony PDF na Infanrix/BCG10
assert.equal(canPromoteToVerifiedFull(bcgValidAuditCheck, VACCINES_CATALOG).allowed, true, '16.4: Kompletny dowodowy audyt sekcji 1–10 i podpunktów 4.1–4.9 powinien przechodzić bramkę');
assert.ok(
  bcgBase.chplAudit.sectionReviews?.every(r => Boolean(r.pageRef) && r.pageRef.includes('PDF str.')) &&
    dtp1.chplAudit?.sectionReviews?.every(r => Boolean(r.pageRef) && r.pageRef.includes('PDF str.')),
  '16.4: Wpisy sectionReviews w BCG10 i Infanrix hexa muszą wskazywać rzeczywiste numery stron PDF dokumentów'
);

// 16.5 GTIN COVID-19 (Spikevax XFG): RARS + Wytyczne MZ (bez fałszywego RPL/EMA) oraz walidacja nadużycia statusu
assert.ok(
  gtinUnder12?.rarsPresentationText?.includes('25 mikrogramów, 1 dawka') &&
    gtin12Plus?.rarsPresentationText?.includes('50 mikrogramów, 10 dawek') &&
    gtinUnder12.confirmedByRars === true &&
    gtinUnder12.confirmedByMzGuidelines === true &&
    gtinUnder12.confirmedByRpl === false &&
    gtinUnder12.confirmedByEma === false,
  '16.5: Oba GTIN Spikevax XFG muszą wiernie odzwierciedlać tekst RARS oraz utrzymywać false dla RPL/EMA'
);
const forgedRplCovid = {
  ...covid,
  fundingAuditDetails: {
    ...covid.fundingAuditDetails,
    gtinReferences: covidGtins.map(g => ({
      ...g,
      verificationStatus: 'confirmed_in_official_guideline_and_product_doc',
    })),
  },
};
assert.ok(
  validateChildVaccineStatusInvariants(forgedRplCovid, VACCINES_CATALOG).length > 0,
  '16.5: Walidator musi odrzucić przypisanie pełnego potwierdzenia dokumentowego produktu (RPL/EMA) bez confirmedByRpl/confirmedByEma'
);

// 16.6 Dolna granica wieku HPV <18 Cervarix D1 (od ukończenia 9. r.ż., nie luźne '<18')
assert.ok(
  hpvCervarixUnder18 &&
    hpvCervarixUnder18.minAgeDescription?.includes('9.') &&
    hpvCervarixUnder18.ageGroup.includes('9. r.ż.') &&
    hpvCervarixUnder18.maxAgeDescription?.includes('18'),
  '16.6: Zakres hpv-under18-cervarix-d1 musi jawnie określać dolną granicę wieku (od ukończenia 9. r.ż.) i górną (<18)'
);
const looseMinAgeHpv = {
  ...hpvCatchup,
  fundingAuditDetails: {
    ...hpvCatchup.fundingAuditDetails,
    fundingScopes: hpvScopes.map(s =>
      s.scopeId === 'hpv-under18-cervarix-d1'
        ? { ...s, ageGroup: 'Dzieci <18 lat (D1 DZ)', minAgeDescription: 'Poniżej 18 lat' }
        : s
    ),
  },
};
assert.ok(
  validateChildVaccineStatusInvariants(looseMinAgeHpv, VACCINES_CATALOG).length > 0,
  '16.6: Walidator musi odrzucić zakres HPV Cervarix <18 pozbawiony dolnej granicy 9. r.ż.'
);

// 16.7 Kontrola spójności zakresów HPV: 9–14 (Cervarix+Gardasil 9), 2. dawka rozpoczęta <14, 14–<18, >=18 A1, 19–26 (start <25) i WSSE Wrocław
assert.ok(
  hpvCervarixUnder18.boundaryInclusivity?.includes('9–<14') &&
    hpvCervarixUnder18.boundaryInclusivity?.includes('2. dawki') &&
    hpvProgram1926?.minAgeDescription?.includes('18.') &&
    hpvProgram1926.boundaryInclusivity?.includes('WSSE Wrocław'),
  '16.7: Zakresy HPV muszą spójnie rozdzielać 9–14, kontynuację 2. dawki <14, nowe serie 14–<18, >=18 A1, program 19–26 oraz zamknięcie WSSE Wrocław'
);

// 16.8 Grypa 2026/2027: wyłączone Fluenz (unconfirmed_for_season) i Efluelda (>=60); walidacja próby przywrócenia Fluenz jako aktywnej opcji
const reactivatedFluenz = {
  ...flu,
  fundingAuditDetails: {
    ...flu.fundingAuditDetails,
    fundingScopes: flu.fundingAuditDetails.fundingScopes.map(s =>
      s.scopeId === 'flu-pediatric-under18-fluenz'
        ? { ...s, isPediatricSelectable: true, fundingStatus: 'verified_self_funded' }
        : s
    ),
  },
};
assert.ok(
  validateChildVaccineStatusInvariants(reactivatedFluenz, VACCINES_CATALOG).length > 0,
  '16.8: Walidator musi zablokować przywrócenie niedostępnego preparatu Fluenz jako wybieralnej lub aktywnie odpłatnej opcji'
);

// 16.9 Rozróżnienie trójwalentnych Vaxigrip/Influvac 2026/2027 od historycznych 4-walentnych VaxigripTetra / Influvac Tetra
assert.ok(
  flu?.chplReference?.includes('vac-vaxigrip-tetra') &&
    flu.linkageAuditNote?.includes('VaxigripTetra') &&
    flu.linkageAuditNote?.includes('trójwalentnych') &&
    fluPediatricScopes.every(s => s.productScope.includes('trójwalentna') && s.seasonalAvailabilityStatus === 'confirmed_for_season'),
  '16.9: Karta grypy musi jawnie ostrzegać przed użyciem historycznej 4-walentnej VaxigripTetra / Influvac Tetra jako dowodu dla trójwalentnych preparatów 2026/2027'
);

// 16.10 Warunkowe finansowanie grypy w ciąży/połogu z pełną zgodnością źródeł (art. 43b ust. 1–4 Dz.U. 2025 poz. 1461 + kod C Dz.U. 2025 poz. 604 + 84W E + NIZP PZH 02.10.2026) i rozdziałem POZ vs apteka
assert.ok(
  fluPregnancy &&
    fluPregnancy.fundingStatus === 'verified_reimbursement' &&
    fluPregnancy.sourceRef.includes('Dz.U. 2025 poz. 1461') &&
    fluPregnancy.sourceRef.includes('Dz.U. 2025 poz. 604') &&
    fluPregnancy.sourceRef.includes('NIZP PZH (02.10.2026)') &&
    fluPregnancy.conditionsAndExceptions.includes('6 tygodni') &&
    fluPregnancy.conditionsAndExceptions.includes('15 dni') &&
    !fluPregnancy.boundaryInclusivity?.includes('OTWARTA ROZBIEŻNOŚĆ') &&
    !fluPregnancy.conditionsAndExceptions.includes('ROZBIEŻNOŚĆ'),
  '16.10: Zakres ciąża/połóg musi warunkowo potwierdzać kod C (6 tyg. po +15 dniach), rozdział POZ/apteka i usuwać nieuzasadnioną otwartą rozbieżność'
);

// 16.11 Kontrola widoku ChildVaccineCard.tsx: ukrycie Fluenz z listy wyboru, prezentacja granic wieku i rozdzielenie źródeł GTIN
assert.ok(
  cardTsx.includes('getUnconfirmedSeasonalScopes(item)') &&
    cardTsx.includes('minAgeDescription') &&
    cardTsx.includes('confirmedByRars') &&
    cardTsx.includes('confirmedByRpl') &&
    cardTsx.includes('confirmedByEma') &&
    !cardTsx.includes('100% odpłatności') &&
    !cardTsx.includes('Efluelda'),
  '16.11: ChildVaccineCard.tsx musi separować unconfirmedSeasonalScopes, wyświetlać granice wieku i rozdzielać RARS od RPL/EMA'
);

// 16.12 Integralność backup.ts oraz absolutna nienaruszalność vac-infanrix-hexa i disc-phenylalanine-content-01
assert.equal(infanrixProduct?.id, 'vac-infanrix-hexa');
assert.equal(infanrixProduct?.sourceDiscrepancies?.[0]?.status, 'requires_clarification');
assert.ok(backupTs.includes('CHILD_VACCINATION_SCHEDULE') || backupTs.includes('BACKUP_SCHEMA_VERSION'));

// 16.13 Końcowy stan katalogu: dokładnie 43 procedury, 0 naruszeń niezmienników, 0 verified_full
assert.equal(CHILD_VACCINES_CATALOG.length, 43);
assert.equal(catalogSummary.invariantViolations.length, 0);
assert.equal(catalogSummary.verifiedFull, 0);

console.log('   ✓ SCENARIUSZ 16 ZALICZONY: Wszystkie 13 testów końcowych PROMPT 22 zaliczone bez błędów.\n');

console.log('17. SCENARIUSZ 17: Kontrola końcowa finansowania połogu, ChPL Influvac/Vaxigrip 2026/2027, rozdzielenia Fluenz Tetra/Fluenz oraz kolejki audytu 43 procedur (PROMPT 23)...');

// 17.1 Warunkowe finansowanie połogu: art. 43b + NFZ 74/2025/DGL i 9/2026/DGL + blokada utraty warunków przez walidator
assert.ok(
  fluPregnancy.mechanismBreakdown.serviceExecutionFunding.includes('74/2025/DGL') &&
    fluPregnancy.mechanismBreakdown.serviceExecutionFunding.includes('9/2026/DGL') &&
    fluPregnancy.mechanismBreakdown.serviceExecutionFunding.includes('położnej') &&
    fluPregnancy.mechanismBreakdown.serviceExecutionFunding.includes('<18') &&
    fluPregnancy.mechanismBreakdown.pharmacyReimbursement.includes('recepta farmaceutyczna nie nadaje kodu „C”'),
  '17.1: Zakres ciąża/połóg musi rozdzielać POZ (w tym położna u dorosłych, lekarz <18) od apteki NFZ (>=18 r.ż., zarządzenia 74/2025/DGL i 9/2026/DGL) oraz zakaz kodu C na recepcie farmaceutycznej'
);

const invalidUnconditionalPostpartum = {
  ...flu,
  fundingAuditDetails: {
    ...flu.fundingAuditDetails,
    adultAndSpecialReferenceScopes: flu.fundingAuditDetails.adultAndSpecialReferenceScopes.map(s =>
      s.scopeId === 'flu-pregnancy-puerperium-reference'
        ? { ...s, conditionsAndExceptions: 'Bezwarunkowo 0 zł dla każdej kobiety w połogu.', fundingStatus: 'verified_reimbursement' }
        : s
    ),
  },
};
assert.ok(
  validateChildVaccineStatusInvariants(invalidUnconditionalPostpartum, VACCINES_CATALOG).length > 0,
  '17.1: Walidator musi zablokować bezwarunkowe zapisanie refundacji w połogu bez limitu art. 43b (6 tyg. po +15 dniach) i ograniczeń recepty farmaceutycznej'
);

// 17.2 Oficjalne ChPL RPL trójwalentnych preparatów 2026/2027 (Influvac 49462 + Vaxigrip 50032) bez awansu do verified_full i z zachowaniem ostrzeżenia VaxigripTetra
assert.equal(flu.chplOfficialSourceUrl, 'https://rejestrymedyczne.ezdrowie.gov.pl/api/rpl/medicinal-products/49462/characteristic');
assert.equal(flu.chplAuthorizationNumber, '28478');
assert.equal(flu.chplMarketingAuthorizationHolder, 'Viatris Healthcare Limited');
assert.equal(flu.alternativeProductDetails?.rplId, 50032);
assert.equal(flu.alternativeProductDetails?.officialChplUrl, 'https://rejestrymedyczne.ezdrowie.gov.pl/api/rpl/medicinal-products/50032/characteristic');
assert.equal(flu.alternativeProductDetails?.authorizationNumber, '28778');
assert.equal(flu.alternativeProductDetails?.chplRevisionDate, '08/2026');
assert.equal(flu.alternativeProductDetails?.marketAvailabilityStatus, 'confirmed_for_season_2026_2027');
assert.equal(flu.chplReferenceStatus, 'official_document_identified');
assert.equal(flu.chplContentVerificationStatus, 'pending_content_audit');
assert.equal(flu.chplVerificationStatus, 'pending_chpl_verification');
assert.equal(flu.linkedVaccineIds.length, 0);
assert.equal(flu.productLinkageStatus, 'pending_catalog_entry');
assert.ok(
  flu.chplAudit?.verifiedSectionsScope.includes('pkt 10') &&
    flu.chplAudit.sectionReviews?.some(s => s.sectionNumber === '2' && s.verificationNote?.includes('2026/2027')) &&
    flu.linkageAuditNote?.includes('VaxigripTetra'),
  '17.2: Audyt grypy musi dokumentować skład 2026/2027 obu trójwalentnych ChPL (49462/50032) przy blokadzie verified_full i zachowaniu ostrzeżenia VaxigripTetra'
);

// 17.3 Jednoznaczne rozróżnienie wycofanej Fluenz Tetra (EMEA/H/C/002617, 14.07.2025) od aktualnej 3-walentnej Fluenz (EMEA/H/C/006514)
const fluenzTetraScope = fluUnconfirmedScopes.find(s => s.scopeId === 'flu-pediatric-under18-fluenz');
const fluenzTrivalentScope = fluUnconfirmedScopes.find(s => s.scopeId === 'flu-pediatric-under18-fluenz-trivalent');
assert.ok(
  fluenzTetraScope?.sourceRef.includes('EMEA/H/C/002617') &&
    fluenzTetraScope.sourceRef.includes('30973') &&
    fluenzTetraScope.isPediatricSelectable === false &&
    fluenzTrivalentScope?.sourceRef.includes('EMEA/H/C/006514') &&
    fluenzTrivalentScope.sourceRef.includes('49836') &&
    fluenzTrivalentScope.isPediatricSelectable === false,
  '17.3: Katalog musi osobno dokumentować wycofaną Fluenz Tetra (002617/30973) i niedostępną w Polsce 3-walentną Fluenz (006514/49836) bez wybieralności'
);

// 17.4 Ustrukturyzowana kolejka ręcznego audytu ChPL dla wszystkich 43 procedur (Grupy A–E)
const chplQueue = getChplManualVerificationQueue(CHILD_VACCINES_CATALOG, VACCINES_CATALOG);
const queueCounts = getChplManualQueueGroupCounts(chplQueue);
assert.equal(chplQueue.length, 43, '17.4: Kolejka audytu ChPL musi obejmować dokładnie wszystkie 43 procedury bez pominięć i duplikatów');
assert.equal(new Set(chplQueue.map(q => q.procedureId)).size, 43, '17.4: Identyfikatory procedur w kolejce audytu ChPL muszą być unikalne');
assert.deepEqual(
  queueCounts,
  { A: 1, B: 12, C: 20, D: 8, E: 2 },
  '17.4: Podział 43 procedur w kolejce audytu ChPL musi tworzyć dokładne grupy A(1), B(12), C(20), D(8), E(2)'
);
assert.ok(
  chplQueue.every(
    q =>
      q.psoPartAndPage.trim().length > 0 &&
      q.missingDocumentsOrActions.length > 0 &&
      q.auditReason.trim().length > 0
  ),
  '17.4: Każda pozycja kolejki ChPL musi wskazywać część PSO, brakujące dokumenty/działania oraz uzasadnienie priorytetu'
);

// 17.5 Potwierdzenie nienaruszalności stanu końcowego PROMPT 23
assert.equal(CHILD_VACCINES_CATALOG.length, 43);
assert.equal(catalogSummary.invariantViolations.length, 0);
assert.equal(catalogSummary.verifiedFull, 0);
assert.equal(infanrixProduct?.id, 'vac-infanrix-hexa');
assert.equal(infanrixProduct?.sourceDiscrepancies?.[0]?.id, 'disc-phenylalanine-content-01');
assert.equal(infanrixProduct?.sourceDiscrepancies?.[0]?.status, 'requires_clarification');

console.log('   ✓ SCENARIUSZ 17 ZALICZONY: Wszystkie testy końcowe PROMPT 23 (połóg kod C, Influvac/Vaxigrip 2026/2027, Fluenz Tetra/Fluenz, kolejka 43 ChPL) zaliczone.\n');

// -------------------------------------------------------------
// Scenariusz 18: Testy końcowe PROMPT 24 (11 testów z Zadania 8)
// -------------------------------------------------------------
console.log('18. Testy końcowe PROMPT 24 – uzgodnienie ChPL grypy 2026/2027, EMA Spikevax XFG, rozdzielenie ChPL vs GTIN, finansowanie i kolejka...');

// 18.1 Influvac 49462 i Vaxigrip 50032 mają potwierdzoną zawartość 2026/2027 i wyjaśnioną rozbieżność wyszukiwarki RPL (plus odrzucenie 2024/2025 i 2025/2026)
assert.ok(flu && flu.chplAudit, '18.1: Procedura pso-rec-influenza-1 musi posiadać obiekt chplAudit');
assert.equal(flu.chplReferenceStatus, 'official_document_identified', '18.1: Grypa 2026/2027 musi mieć chplReferenceStatus=official_document_identified');
assert.equal(flu.chplContentVerificationStatus, 'pending_content_audit', '18.1: Grypa 2026/2027 bez pełnego audytu sekcji 4–6 musi mieć pending_content_audit');
assert.equal(flu.chplAudit.documentOrigin, 'RPL_PL', '18.1: ChPL Influvac/Vaxigrip pochodzą z polskiego RPL');
assert.equal(flu.chplAudit.targetSeason, '2026/2027', '18.1: Docelowy sezon ChPL grypy musi wynosić 2026/2027');
assert.equal(flu.chplAudit.sourceSeason, '2026/2027', '18.1: Sezon składu pkt 2 pobranych ChPL musi wynosić 2026/2027');
assert.equal(flu.chplAudit.fileSizeBytes, 221500, '18.1: Pobrana ChPL Influvac (49462) musi wskazywać dokładny rozmiar 221500 B');
assert.equal(
  flu.chplAudit.fileSha256,
  '933f604e3aef5417ed948d2537900ed40e295b3edd21587778ea902d68cf016d',
  '18.1: Pobrana ChPL Influvac (49462) musi posiadać zweryfikowany skrót SHA-256'
);
assert.equal(flu.chplAudit.secondaryFileSizeBytes, 600348, '18.1: Pobrana ChPL Vaxigrip (50032) musi wskazywać dokładny rozmiar 600348 B');
assert.equal(
  flu.chplAudit.secondaryFileSha256,
  'ff3f12a3aef271436f12cc19fa9bf8e9d3ac9f03e151bbaafb2f7bf61c6038dc',
  '18.1: Pobrana ChPL Vaxigrip (50032) musi posiadać zweryfikowany skrót SHA-256'
);
assert.ok(
  flu.chplAudit.metadataDiscrepancyNote?.includes('hasDownloadableMaterials=false') &&
    flu.chplAudit.metadataDiscrepancyNote?.includes('2024/2025') &&
    flu.chplAudit.metadataDiscrepancyNote?.includes('35346'),
  '18.1: chplAudit.metadataDiscrepancyNote musi wyjaśniać lag metadanych /search/public i historyczny wpis VaxigripTetra RPL 35346 (2025/2026)'
);

const fluWrongSeason2024 = {
  ...flu,
  chplAudit: {
    ...flu.chplAudit,
    sourceSeason: '2024/2025',
  },
};
const fluWrongSeason2025 = {
  ...flu,
  chplAudit: {
    ...flu.chplAudit,
    sourceSeason: '2025/2026',
  },
};
assert.ok(
  validateChildVaccineStatusInvariants(fluWrongSeason2024, VACCINES_CATALOG).length > 0 &&
    validateChildVaccineStatusInvariants(fluWrongSeason2025, VACCINES_CATALOG).length > 0 &&
    !canPromoteToVerifiedFull(fluWrongSeason2025, VACCINES_CATALOG).allowed,
  '18.1: Dokumenty ChPL z sezonów 2024/2025 i 2025/2026 muszą być twardo odrzucane dla sezonu 2026/2027'
);

// 18.2 Zakaz awansu Influvac/Vaxigrip do verified_full bez audytu sekcji 1–10
assert.equal(canPromoteToVerifiedFull(flu, VACCINES_CATALOG).allowed, false, '18.2: Brak audytu sekcji 4–6 musi blokować awans grypy do verified_full');
assert.equal(flu.chplVerificationStatus, 'pending_chpl_verification', '18.2: Grypa zachowuje pending_chpl_verification');

// 18.3 pso-rec-covid-pediatric ma przypisaną oficjalną ChPL EMA Spikevax XFG (PL i EN)
assert.ok(covid && covid.chplAudit, '18.3: COVID-19 (pso-rec-covid-pediatric) musi posiadać obiekt chplAudit EMA Spikevax XFG');
assert.equal(covid.chplReferenceStatus, 'official_document_identified', '18.3: COVID-19 musi mieć chplReferenceStatus=official_document_identified');
assert.equal(
  covid.chplOfficialSourceUrl,
  'https://www.ema.europa.eu/pl/documents/product-information/spikevax-epar-product-information_pl.pdf',
  '18.3: Oficjalna polska ChPL EMA EPAR dla Spikevax XFG musi być przypisana w chplOfficialSourceUrl'
);
assert.equal(
  covid.chplAudit.secondaryOfficialSourceUrl,
  'https://www.ema.europa.eu/en/documents/product-information/spikevax-epar-product-information_en.pdf',
  '18.3: Wersja angielska EPAR EMA dla Spikevax XFG musi być przypisana w chplAudit.secondaryOfficialSourceUrl'
);
assert.equal(covid.chplAudit.documentOrigin, 'EMA_EPAR_CEN_PL_EN', '18.3: Pochodzenie dokumentu COVID-19 musi wskazywać rejestrację centralną EPAR EMA');
assert.equal(covid.chplAudit.fileSizeBytes, 1878146);
assert.equal(covid.chplAudit.fileSha256, 'bd1ba23ca4e25a3f7353f01e3be889dd8962c471ad257e7beefd50351fdb6fec');
assert.equal(covid.chplAudit.secondaryFileSizeBytes, 1387433);
assert.equal(covid.chplAudit.secondaryFileSha256, '8932b31f46e652f9ee4be89ad65cd6003f9fa5a63be0f2af64affd645a0d7024');
assert.equal(covid.chplMarketingAuthorizationHolder, 'MODERNA BIOTECH SPAIN, S.L.');
assert.ok(covid.chplAuthorizationNumber?.includes('EU/1/20/1507/041–050'), '18.3: COVID-19 musi wskazywać numery pozwoleń UE dla Spikevax XFG');
assert.equal(covid.chplAudit.documentDateStatus, 'missing_in_document', '18.3: Pkt 10 Aneksu I Spikevax XFG nie zawiera wpisanej daty rewizji w tekście PDF');

// 18.4 Zakaz awansu COVID-19 do verified_full bez pełnego audytu sekcji 4 (4.1–4.9), 5 i 6
assert.equal(covid.chplContentVerificationStatus, 'pending_content_audit', '18.4: COVID-19 po przypisaniu EMA ChPL musi mieć pending_content_audit');
assert.equal(covid.chplVerificationStatus, 'pending_chpl_verification', '18.4: COVID-19 nie może mieć statusu verified_chpl bez pełnego audytu 1–10');
assert.equal(covid.productLinkageStatus, 'pending_catalog_entry', '18.4: COVID-19 nadal oczekuje na utworzenie karty Spikevax XFG w VACCINES_CATALOG');
assert.equal(covid.linkedVaccineIds.length, 0);
assert.equal(canPromoteToVerifiedFull(covid, VACCINES_CATALOG).allowed, false, '18.4: Bramka verified_full musi blokować awans COVID-19 przy braku sekcji 4, 5 i 6');

// 18.5 Rozdzielenie statusu ChPL EMA vs statusów GTIN MZ + RARS (confirmedByEma=false, confirmedByRpl=false)
const covidGtinsPrompt24 = covid.fundingAuditDetails?.gtinReferences ?? [];
assert.equal(covidGtinsPrompt24.length, 2, '18.5: COVID-19 musi zachowywać dokładnie 2 wpisy GTIN (25 µg i 50 µg)');
for (const gtinCode of ['00380777714110', '00380777712024']) {
  const g = covidGtinsPrompt24.find(entry => entry.gtin === gtinCode);
  assert.ok(g, `18.5: Brak wpisu GTIN ${gtinCode}`);
  assert.equal(g.confirmedByMzGuidelines, true);
  assert.equal(g.confirmedByRars, true);
  assert.equal(g.confirmedByEma, false, `18.5: Mimo przypisania EPAR EMA, GTIN ${gtinCode} nie występuje w PDF EMA -> confirmedByEma musi pozostać false`);
  assert.equal(g.confirmedByRpl, false, `18.5: GTIN ${gtinCode} w RPL CEN (HTTP 400) -> confirmedByRpl musi pozostać false`);
  assert.equal(g.crossCheckedWithEparOrRpl, false);
  assert.equal(g.verificationStatus, 'confirmed_mz_guideline_and_rars_pending_rpl_ema');
}
const covidFakeEmaGtin = {
  ...covid,
  fundingAuditDetails: {
    ...covid.fundingAuditDetails,
    gtinReferences: covidGtinsPrompt24.map(g => ({ ...g, confirmedByEma: true })),
  },
};
assert.ok(
  validateChildVaccineStatusInvariants(covidFakeEmaGtin, VACCINES_CATALOG).length > 0,
  '18.5: Próba automatycznego oznaczenia confirmedByEma=true bez crossCheckedWithEparOrRpl=true musi być blokowana przez walidator'
);

// 18.6 Spójność podsumowania finansowania (36 / 0 / 5 / 2) oraz jawne rozliczenie 2 procedur pending_clarification
assert.deepEqual(catalogSummary.fundingCounts, {
  verified_public_free: 36,
  verified_reimbursement: 0,
  verified_self_funded: 5,
  pending_clarification: 2,
});
const pendingFundingReport = auditPendingFundingProcedures(CHILD_VACCINES_CATALOG);
assert.equal(pendingFundingReport.pendingProceduresCount, 2, '18.6: Raport pending_clarification musi wskazywać dokładnie 2 procedury');
assert.deepEqual(
  pendingFundingReport.pendingProcedureIds,
  ['pso-rec-influenza-1', 'pso-rec-hpv-catchup'],
  '18.6: Procedury pending_clarification to wyłącznie pso-rec-influenza-1 oraz pso-rec-hpv-catchup'
);
const pendingFluReport = pendingFundingReport.details.find(d => d.procedureId === 'pso-rec-influenza-1');
const pendingHpvReport = pendingFundingReport.details.find(d => d.procedureId === 'pso-rec-hpv-catchup');
assert.ok(
  pendingFluReport &&
    pendingFluReport.confirmedScopes.length >= 5 &&
    pendingFluReport.pendingOrClosedScopes.length === 2,
  '18.6: Raport grypy musi oddzielać 5 potwierdzonych zakresów wstrzykiwanych od 2 wykluczonych zakresów donosowych LAIV'
);
assert.ok(
  pendingHpvReport &&
    pendingHpvReport.confirmedScopes.length >= 5 &&
    pendingHpvReport.pendingOrClosedScopes.some(s => s.scopeId === 'hpv-19-26-wsse-wroclaw-closure' && s.fundingStatus === 'regional_pool_closed'),
  '18.6: Raport HPV musi oddzielać potwierdzone zakresy D1/A1/Gardasil/program od zamkniętych pul regionalnych (regional_pool_closed)'
);

// 18.7 Spójność warunkowej refundacji ciąży i połogu (art. 43b, kod C, inny lekarz na podstawie zaświadczenia, termin realizacji recepty, POZ vs apteka >=18)
const fluPregScopePrompt24 = (flu.fundingAuditDetails?.adultAndSpecialReferenceScopes ?? []).find(
  s => s.scopeId === 'flu-pregnancy-puerperium-reference'
);
assert.ok(fluPregScopePrompt24, '18.7: Musi istnieć zakres szczególny flu-pregnancy-puerperium-reference');
assert.equal(fluPregScopePrompt24.fundingStatus, 'verified_reimbursement');
assert.equal(fluPregScopePrompt24.isPediatricSelectable, false);
assert.ok(
  fluPregScopePrompt24.conditionsAndExceptions.toLowerCase().includes('innego lekarza') &&
    fluPregScopePrompt24.conditionsAndExceptions.toLowerCase().includes('zaświadczenia') &&
    fluPregScopePrompt24.conditionsAndExceptions.toLowerCase().includes('termin realizacji recepty') &&
    fluPregScopePrompt24.conditionsAndExceptions.includes('6 tygodni po upływie 15 dni') &&
    fluPregScopePrompt24.mechanismBreakdown.pharmacyReimbursement.toLowerCase().includes('recepta farmaceutyczna nie nadaje kodu'),
  '18.7: Warunkowy kod C w ciąży i połogu musi ujmować receptę lekarza/położnej, receptę innego lekarza na podstawie zaświadczenia, termin realizacji recepty i zakaz kodu C na recepcie farmaceutycznej'
);
const fluMissingCertNote = {
  ...flu,
  fundingAuditDetails: {
    ...flu.fundingAuditDetails,
    adultAndSpecialReferenceScopes: (flu.fundingAuditDetails?.adultAndSpecialReferenceScopes ?? []).map(s =>
      s.scopeId === 'flu-pregnancy-puerperium-reference'
        ? { ...s, conditionsAndExceptions: 'art. 43b połogu 6 tygodni 15 dni kod C' }
        : s
    ),
  },
};
assert.ok(
  validateChildVaccineStatusInvariants(fluMissingCertNote, VACCINES_CATALOG).length > 0,
  '18.7: Walidator musi wykryć usunięcie warunków zaświadczenia / terminu realizacji recepty dla zakresu połogu'
);

// 18.8 Aktualność kolejki ręcznego audytu ChPL (43 procedury, A:1, B:12, C:20, D:8, E:2) z wpisanym EMA EPAR przy COVID-19
assert.equal(chplQueue.length, 43);
assert.deepEqual(queueCounts, { A: 1, B: 12, C: 20, D: 8, E: 2 });
const covidQueueItem = chplQueue.find(q => q.procedureId === 'pso-rec-covid-pediatric');
assert.ok(covidQueueItem, '18.8: Kolejka audytu ChPL musi zawierać pso-rec-covid-pediatric');
assert.equal(covidQueueItem.queueGroup, 'E');
assert.equal(covidQueueItem.currentChplReferenceStatus, 'official_document_identified');
assert.equal(covidQueueItem.currentChplContentStatus, 'pending_content_audit');
assert.ok(
  covidQueueItem.officialChplSources.includes('https://www.ema.europa.eu/pl/documents/product-information/spikevax-epar-product-information_pl.pdf') &&
    covidQueueItem.officialChplSources.includes('https://www.ema.europa.eu/en/documents/product-information/spikevax-epar-product-information_en.pdf'),
  '18.8: Wpis kolejki ChPL dla COVID-19 musi wymieniać oba oficjalne adresy EPAR EMA (PL i EN)'
);
assert.ok(
  covidQueueItem.auditReason.includes('EPAR EMA (PL/EN)'),
  '18.8: Uzasadnienie w kolejce ChPL dla COVID-19 musi odzwierciedlać zidentyfikowanie oficjalnej ChPL EPAR EMA'
);

// 18.9 Integralność liczby 43 procedur oraz 0 awansów verified_full i 0 naruszeń niezmienników
assert.equal(CHILD_VACCINES_CATALOG.length, 43, '18.9: Liczba procedur katalogu musi wynosić dokładnie 43');
assert.equal(catalogSummary.totalProcedures, 43);
assert.equal(catalogSummary.verifiedFull, 0, '18.9: Żadna procedura nie może być verified_full przed pełnym audytem');
assert.deepEqual(catalogSummary.invariantViolations, [], '18.9: Zero naruszeń niezmienników');

// 18.10 Nienaruszalność vac-infanrix-hexa i disc-phenylalanine-content-01
assert.equal(infanrixProduct?.id, 'vac-infanrix-hexa');
assert.equal(infanrixProduct?.verificationStatus, 'requires_source_clarification');
assert.equal(infanrixProduct?.sourceDiscrepancies?.[0]?.id, 'disc-phenylalanine-content-01');
assert.equal(infanrixProduct?.sourceDiscrepancies?.[0]?.status, 'requires_clarification');
assert.equal(catalogSummary.infanrixHexaTotalLinks, 13, '18.10: Wszystkie 13 powiązań do vac-infanrix-hexa (12 A.2 + 1 warunkowe) muszą pozostać nienaruszone');

// 18.11 Brak wycieku wykluczonych preparatów dorosłych/niedostępnych (Efluelda / Fluenz / ciąża i połóg) do wyborów pediatrycznych
const fluSelectableIds = getPediatricSelectableFundingScopes(flu).map(s => s.scopeId);
assert.deepEqual(
  fluSelectableIds,
  ['flu-pediatric-under18-influvac', 'flu-pediatric-under18-vaxigrip'],
  '18.11: Wybieralne pediatrycznie w grypie 2026/2027 pozostają wyłącznie trójwalentne Influvac i Vaxigrip'
);

console.log('   ✓ SCENARIUSZ 18 ZALICZONY: Wszystkie 11 testów końcowych PROMPT 24 przeszły pomyślnie.\n');

console.log('19. SCENARIUSZ 19: PROMPT 25 – integralność I etapu przygotowawczego audytu ChPL (4 preparaty) i blokada awansu verified_full...');

// 19.1 Walidacja pakietu Stage-1 (4 źródła, 4 arkusze po 18 pozycji 1–10 + 4.1–4.9, raport braków i decyzji klinicznych)
assert.deepEqual(
  validateStage1ChplAuditBundle(STAGE1_CHPL_AUDIT_BUNDLE),
  [],
  '19.1: Pakiet STAGE1_CHPL_AUDIT_BUNDLE nie może mieć błędów walidacji strukturalnej'
);
assert.equal(STAGE1_CHPL_AUDIT_BUNDLE.sourceAndVersionReport.length, 4);
assert.equal(STAGE1_CHPL_AUDIT_BUNDLE.contentAnalysisSheets.length, 4);
assert.ok(STAGE1_CHPL_AUDIT_BUNDLE.missingDataReport.length >= 8);
assert.ok(STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist.length >= 8);

for (const sheet of STAGE1_CHPL_AUDIT_BUNDLE.contentAnalysisSheets) {
  assert.equal(sheet.entries.length, 18, `19.1: Arkusz ${sheet.productKey} musi zawierać dokładnie 18 pozycji (1–3, 4.1–4.9, 5–10)`);
  assert.equal(sheet.targetStatusAfterStage1, 'pending_content_audit');
}

// 19.2 Kontrola dokładnych parametrów pobranych dokumentów PDF (bajty, strony, SHA-256)
const srcByKey = Object.fromEntries(
  STAGE1_CHPL_AUDIT_BUNDLE.sourceAndVersionReport.map(s => [s.productKey, s])
);
assert.equal(srcByKey.influvac_2026_2027.fileSizeBytes, 221500);
assert.equal(srcByKey.influvac_2026_2027.pageCount, 10);
assert.equal(srcByKey.influvac_2026_2027.fileSha256, '933f604e3aef5417ed948d2537900ed40e295b3edd21587778ea902d68cf016d');
assert.equal(srcByKey.vaxigrip_2026_2027.fileSizeBytes, 600348);
assert.equal(srcByKey.vaxigrip_2026_2027.pageCount, 22);
assert.equal(srcByKey.vaxigrip_2026_2027.fileSha256, 'ff3f12a3aef271436f12cc19fa9bf8e9d3ac9f03e151bbaafb2f7bf61c6038dc');
assert.equal(srcByKey.spikevax_xfg.fileSizeBytes, 1878146);
assert.equal(srcByKey.spikevax_xfg.pageCount, 177);
assert.equal(srcByKey.spikevax_xfg.fileSha256, 'bd1ba23ca4e25a3f7353f01e3be889dd8962c471ad257e7beefd50351fdb6fec');
assert.equal(srcByKey.bcg_10.fileSizeBytes, 163805);
assert.equal(srcByKey.bcg_10.pageCount, 7);
assert.equal(srcByKey.bcg_10.fileSha256, '51cdd82650908b41bc56b015671724b1c8dfce7bc3628c61b8d364f893768344');

// 19.3 Odrzucanie nieuprawnionego awansu statusu lub pominięcia podpunktu 4.2
assert.ok(
  validateStage1ChplAuditBundle({
    ...STAGE1_CHPL_AUDIT_BUNDLE,
    targetProcedureStatusAfter: 'verified_full',
  }).length > 0,
  '19.3: Próba automatycznego awansu pakietu I etapu do verified_full musi zostać odrzucona'
);
assert.ok(
  validateStage1ChplAuditBundle({
    ...STAGE1_CHPL_AUDIT_BUNDLE,
    contentAnalysisSheets: STAGE1_CHPL_AUDIT_BUNDLE.contentAnalysisSheets.map(sheet =>
      sheet.productKey === 'bcg_10'
        ? { ...sheet, entries: sheet.entries.filter(e => e.subpointNumber !== '4.2') }
        : sheet
    ),
  }).length > 0,
  '19.3: Pominięcie podpunktu 4.2 w arkuszu I etapu musi zostać odrzucone'
);

// 19.4 Zachowanie statusów bazowych w katalogu produkcyjnym (zero awansów verified_full) i nierozstrzygniętych pytań klinicznych
const covidProc25 = findChildVaccine('pso-rec-covid-pediatric');
assert.equal(bcgBase.chplContentVerificationStatus, 'pending_content_audit');
assert.equal(bcgBase.chplVerificationStatus, 'pending_chpl_verification');
assert.equal(flu.chplContentVerificationStatus, 'pending_content_audit');
assert.equal(flu.chplVerificationStatus, 'pending_chpl_verification');
assert.equal(covidProc25?.chplContentVerificationStatus, 'pending_content_audit');
assert.equal(covidProc25?.chplVerificationStatus, 'pending_chpl_verification');
assert.equal(catalogSummary.verifiedFull, 0);
assert.ok(
  STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist.every(
    d => d.requiresCompetentClinicalAuditorDecision === true && d.autoResolved === false
  ),
  '19.4: Wszystkie wykryte niejednoznaczności kliniczne muszą pozostać otwarte do decyzji kompetentnego audytora'
);

console.log('   ✓ SCENARIUSZ 19 ZALICZONY: I etap audytu ChPL (4 dokumenty) spójny technicznie, z pełnym zakazem awansu do verified_full.\n');

console.log('================================================================');
console.log(' WYNIK KOŃCOWY: 19/19 SCENARIUSZY AUDYTU ZALICZONYCH (100%)    ');
console.log('================================================================\n');
