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
import {
  deriveChplVerificationStatus,
  canPromoteToVerifiedFull,
  validateChildVaccineStatusInvariants,
  auditVariantA2IpvCoverage,
  auditChildVaccinesCatalogSummary,
} from '../src/utils/childVaccineAudit.ts';

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

assert.equal(identifiedDocCount, 13, 'Dokładnie 13 procedur posiada zidentyfikowany oficjalny dokument ChPL (BCG 10 + 12 Infanrix hexa)');
assert.equal(refNameOnlyCount, 30, 'Dokładnie 30 procedur zawiera jedynie orientacyjną nazwę handlową produktu');
assert.equal(trulyVerifiedChplCount, 0, 'Żadna procedura nie może być oznaczona jako w pełni zweryfikowana ChPL bez zamknięcia niezgodności i pełnego audytu');
assert.equal(analyzedDiscrepancyCount, 12, '12 procedur kalendarzowych powiązanych z Infanrix hexa ma status analyzed_with_discrepancy');
assert.equal(pendingAuditCount, 1, 'Wyłącznie 1 procedura z dokumentem RPL (pso-bcg-0) ma status pending_content_audit');
assert.equal(notVerifiedContentCount, 30, 'Wszystkie 30 procedur z samym odwołaniem referencyjnym mają status not_verified (spójność z brakiem dokumentu)');
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

console.log('   ✓ SCENARIUSZ 12 ZALICZONY: Rozdzielono identyfikację dokumentu ChPL (13), weryfikację treści (0 verified_full, 12 discrepancy, 1 pending_audit, 30 not_verified) i warunkową alternatywę DTaP 3w1/6w1.\n');

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
    auditOutcome: 'compliant',
    unresolvedDiscrepanciesCount: 0,
  },
};
assert.equal(canPromoteToVerifiedFull(validSyntheticReady, VACCINES_CATALOG).allowed, true, 'Kompletny audyt bez rozbieżności z oficjalnym URL powinien przejść bramkę verified_full');

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
    verifiedSectionsScope: ['4.1', '4.2'],
    auditOutcome: 'compliant',
    unresolvedDiscrepanciesCount: 0,
  },
};
assert.equal(
  canPromoteToVerifiedFull(bcgValidAuditCheck, VACCINES_CATALOG).allowed,
  true,
  '14.2: documentVersionOrDate="Brak informacji w dokumencie" przy pełnym konkretnym audycie może spełniać warunek dokumentowy'
);

// 14.3 Próba ustawienia verified_full bez verifiedSectionsScope -> blokada; oraz zero rekordów produkcyjnych na verified_full
const bcgEmptySections = {
  ...bcgValidAuditCheck,
  chplAudit: {
    ...bcgValidAuditCheck.chplAudit,
    verifiedSectionsScope: [],
  },
};
assert.equal(canPromoteToVerifiedFull(bcgEmptySections, VACCINES_CATALOG).allowed, false, '14.3: Puste verifiedSectionsScope musi blokować verified_full');
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

// 14.5 Rozdzielenie HPV: 9-14 (Cervarix+Gardasil 9), 15-18 (Cervarix 84W vs Gardasil 9 pełnopłatny), 19-26 (Cervarix <25 do 31.05.2027)
assert.equal(hpv9?.fundingVerificationStatus, 'verified_public_free');
assert.equal(hpv9?.fundingAuditDetails?.fundingScopes?.length, 2, '14.5: HPV 9-14 musi rozdzielać zakresy Cervarix i Gardasil 9 w programie MZ');
assert.equal(hpvCatchup?.fundingVerificationStatus, 'pending_clarification');
const hpvScopes = hpvCatchup?.fundingAuditDetails?.fundingScopes ?? [];
assert.equal(hpvScopes.length, 4, '14.5: pso-rec-hpv-catchup musi zawierać 4 zakresy (15-18 Cervarix 84W, 15-18 Gardasil 9 poza 84W, 19-26 Cervarix program, WSSE Wrocław)');
const hpvCervarix1518 = hpvScopes.find(s => s.productScope.includes('Cervarix') && s.ageGroup.includes('15'));
const hpvGardasil1518 = hpvScopes.find(s => s.productScope.includes('Gardasil 9'));
const hpvProgram1926 = hpvScopes.find(s => s.scopeId !== 'hpv-19-26-wsse-wroclaw-closure' && s.ageGroup.includes('19'));
assert.ok(
  hpvCervarix1518?.sourceRef.includes('84W') &&
    hpvCervarix1518.mechanismBreakdown.pharmacyReimbursement.includes('D1') &&
    hpvCervarix1518.mechanismBreakdown.partialReimbursementDetail.includes('50%'),
  '14.5: Cervarix 15-18 musi wskazywać wykaz 84W A1 50% / D1 18- DZ'
);
assert.ok(hpvGardasil1518 && hpvGardasil1518.fundingStatus === 'verified_self_funded', '14.5: Gardasil 9 poza programem 9-14 i poza 84W musi być oznaczony jako pełnopłatny');
assert.ok(hpvProgram1926 && hpvProgram1926.fundingStatus === 'verified_public_free' && hpvProgram1926.validityPeriod.includes('31.05.2027'), '14.5: HPV 19-26 musi wskazywać Cervarix i termin do 31.05.2027');

// 14.6 Komunikat WSSE Wrocław 05.11.2026 oznaczony wyłącznie regionalnie (bez zamknięcia ogólnopolskiego)
const wsseWroclawScope = hpvScopes.find(s => s.scopeId === 'hpv-19-26-wsse-wroclaw-closure');
assert.ok(wsseWroclawScope, '14.6: Musi istnieć osobny zakres dla komunikatu WSSE Wrocław');
assert.equal(wsseWroclawScope.fundingStatus, 'regional_pool_closed', '14.6: Komunikat WSSE Wrocław musi mieć status regional_pool_closed');
assert.ok(wsseWroclawScope.sourceRef.includes('05.11.2026') || wsseWroclawScope.conditionsAndExceptions.includes('05.11.2026'), '14.6: Musi wskazywać datę 05.11.2026');
assert.equal(hpv9?.fundingVerificationStatus, 'verified_public_free', '14.6: Zamknięcie puli regionalnej WSSE Wrocław NIE może zamykać programu 9-14 lat');
assert.notEqual(hpvCervarix1518?.fundingStatus, 'regional_pool_closed', '14.6: Zamknięcie puli regionalnej 19-26 NIE może zamykać refundacji Cervarix 84W');

// 14.7 Rozdzielenie refundacji aptecznej preparatu od wykonania usługi przy grypie
assert.equal(flu?.fundingVerificationStatus, 'pending_clarification');
const fluMech = flu?.fundingAuditDetails?.mechanismBreakdown;
assert.ok(fluMech, '14.7: Grypa musi posiadać rozdzielenie mechanizmów finansowania');
assert.ok(fluMech.pharmacyReimbursement.includes('Influvac') && fluMech.pharmacyReimbursement.includes('Vaxigrip'), '14.7: Grypa musi wymieniać Influvac i Vaxigrip w 84W');
assert.ok(fluMech.pharmacyReimbursement.includes('Fluenz') && fluMech.partialReimbursementDetail.includes('Efluelda'), '14.7: Grypa musi rozróżniać Fluenz (poza 84W) i Efluelda (>=60 lat, brak D1)');
assert.ok(fluMech.serviceExecutionFunding.includes('POZ') && fluMech.serviceExecutionFunding.includes('aptek'), '14.7: Grypa musi rozdzielać wykonanie usługi w POZ (<18 r.ż.) i aptekach (>=18 r.ż.)');

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

console.log('================================================================');
console.log(' WYNIK KOŃCOWY: 14/14 SCENARIUSZY AUDYTU ZALICZONYCH (100%)    ');
console.log('================================================================\n');
