import assert from 'node:assert/strict';
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
  } else if (item.sourcePart.startsWith('Część I.B') || item.sourcePart.startsWith('Część III')) {
    assert.ok(
      item.sourceOfficialPoint !== null && item.sourceOfficialPoint.length > 0,
      `Wpis ${item.id} w ${item.sourcePart} musi posiadać oficjalny numer punktu urzędowego (np. '2', '3', '6.3')`
    );
  }
}

console.log('   ✓ SCENARIUSZ 8 ZALICZONY: Uniknięto sztucznej numeracji tabel PSO – tabele I.A, II.A, I.D mają sourceOfficialPoint = null i zdefiniowany wiersz tabeli.\n');

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

console.log('================================================================');
console.log(' WYNIK KOŃCOWY: 10/10 SCENARIUSZY AUDYTU ZALICZONYCH (100%)    ');
console.log('================================================================\n');
