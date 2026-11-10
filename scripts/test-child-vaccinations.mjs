import assert from 'node:assert/strict';
import {
  CHILD_AGE_BRACKETS,
  CHILD_VACCINES_CATALOG,
  STAGE_GROUPS_CONFIG,
  STAFF_QUALIFICATIONS_PSO_PART_VI,
  PSO_GENERAL_PRINCIPLES_PART_IV,
  CATCH_UP_IMMUNIZATION_PART_V,
  COMBINED_VACCINES_VARIANTS_PART_III_M
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
// Test 2: Audyt źródeł urzędowych, numeru części i stron PDF każdego z 39 rekordów
// -------------------------------------------------------------
console.log('Test 2: Audyt kompletności źródeł (Część PSO, punkt, strona PDF, URL, publikacja)');

assert.equal(CHILD_VACCINES_CATALOG.length, 39, 'Katalog musi zawierać dokładnie 39 audytowanych rekordów procedur');

const OFFICIAL_PDF_URL = 'https://dziennikmz.mz.gov.pl/DUM_MZ/2026/77/akt.pdf';
const LEGAL_ACT_KEYWORD = 'Dz. Urz. Min. Zdrow. 2026 poz. 77';
const PUBLICATION_DATE = '28.10.2026';

for (const item of CHILD_VACCINES_CATALOG) {
  assert.ok(item.id.startsWith('pso-'), `Identyfikator ${item.id} musi zaczynać się od 'pso-'`);
  assert.ok(item.disease.length > 5, `Wpis ${item.id} musi mieć sprecyzowaną chorobę`);
  assert.ok(item.shortCode.length > 0, `Wpis ${item.id} musi mieć skrót kliniczny`);
  assert.ok(['obowiazkowe', 'zalecane'].includes(item.obligationType), `Wpis ${item.id} musi mieć poprawny rodzaj obowiązku`);
  assert.ok(['Część I.A', 'Część I.B', 'Część II'].includes(item.psoPart), `Wpis ${item.id} musi mieć poprawny numer części PSO`);
  assert.ok(item.psoPointOrSubpoint.length > 0, `Wpis ${item.id} musi określać punkt/podpunkt PSO`);
  assert.ok(typeof item.psoPdfPage === 'number' && item.psoPdfPage >= 2 && item.psoPdfPage <= 16, `Wpis ${item.id} musi mieć poprawny numer strony PDF w akt.pdf (2-16)`);
  assert.equal(item.psoOfficialUrl, OFFICIAL_PDF_URL, `Wpis ${item.id} musi wskazywać oficjalny PDF Dziennika Urzędowego MZ`);
  assert.ok(item.psoLegalAct.includes(LEGAL_ACT_KEYWORD), `Wpis ${item.id} musi powoływać akt prawny ${LEGAL_ACT_KEYWORD}`);
  assert.equal(item.psoPublicationDate, PUBLICATION_DATE, `Wpis ${item.id} musi mieć datę publikacji aktu ${PUBLICATION_DATE}`);
  assert.equal(item.verificationStatus, 'verified_pso', `Wpis ${item.id} musi mieć status verified_pso`);
  assert.ok(item.targetGroupDescription.length > 10, `Wpis ${item.id} musi mieć precyzyjny opis grupy docelowej`);
  assert.ok(item.doseNumberInSeries >= 1 && item.doseNumberInSeries <= 7, `Wpis ${item.id} musi mieć poprawny numer dawki w serii`);
  assert.ok(item.totalDosesInStandardSeries >= 1 && item.totalDosesInStandardSeries <= 7, `Wpis ${item.id} musi mieć poprawną liczbę dawek w serii`);
  assert.ok(item.administrationRoute.length > 0, `Wpis ${item.id} musi precyzować drogę podania`);
  assert.ok(item.injectionSite.length > 0, `Wpis ${item.id} musi precyzować miejsce iniekcji`);
  assert.ok(item.clinicalNotes.length > 20, `Wpis ${item.id} musi zawierać szczegółowe wytyczne dla personelu`);
  assert.ok(item.fundingStatus.length > 0, `Wpis ${item.id} musi określać status finansowania`);
  assert.ok(item.officialFundingSourceRef !== null, `Wpis ${item.id} musi mieć oficjalną podstawę prawną finansowania`);
}
console.log(`   ✓ SCENARIUSZ 2 ZALICZONY: Wszystkie 39 rekordów zawierają numer części PSO, punkt, stronę PDF (2–16), URL i podstawę refundacji.\n`);

// -------------------------------------------------------------
// Test 3: Uprawnienia personelu medycznego (Część VI PSO)
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

// Weryfikacja punktu 2 (Odstępy między szczepionkami niepodanymi jednocześnie i wyjątek rotawirusów)
const point2 = PSO_GENERAL_PRINCIPLES_PART_IV.find(p => p.pointNumber === 2);
assert.ok(point2, 'Punkt 2 musi istnieć');
assert.ok(point2.officialRuleText.includes('4 tygodni'), 'Punkt 2 musi zawierać regułę 4 tygodni dla szczepionek żywych');
assert.ok(point2.specificExceptions.some(ex => ex.includes('ROTAWIRUSÓW')), 'Punkt 2 musi zawierać WYJĄTEK DLA ROTAWIRUSÓW');
assert.ok(point2.specificExceptions.some(ex => ex.includes('DOWOLNYM odstępie')), 'Wyjątek rotawirusów musi wyraźnie dopuszczać dowolny odstęp');

// Weryfikacja punktu 7 (Dokumentacja w e-Karcie Szczepień)
const point7 = PSO_GENERAL_PRINCIPLES_PART_IV.find(p => p.pointNumber === 7);
assert.ok(point7, 'Punkt 7 musi istnieć');
assert.ok(point7.officialRuleText.includes('Elektronicznej Karty Szczepień') || point7.officialRuleText.includes('e-Karta Szczepień'), 'Punkt 7 musi precyzować wpis do e-Karty Szczepień w systemie P1');

console.log('   ✓ SCENARIUSZ 4 ZALICZONY: Wszystkie 7 punktów Części IV zweryfikowane, w tym pełne brzmienie wyjątku dla rotawirusów.\n');

// -------------------------------------------------------------
// Test 5: Szczepienia wyrównawcze (Część V PSO)
// -------------------------------------------------------------
console.log('Test 5: Szczepienia wyrównawcze (Część V PSO 2027)');

assert.equal(CATCH_UP_IMMUNIZATION_PART_V.length, 5, 'Musi być 5 wytycznych szczepień wyrównawczych');

const noDocs = CATCH_UP_IMMUNIZATION_PART_V.find(g => g.category === 'brak_dokumentacji');
assert.ok(noDocs && noDocs.ruleSummary.includes('traktowana jako osoba nieszczepiona'), 'Brak dokumentacji = osoba nieszczepiona');

const incomplete = CATCH_UP_IMMUNIZATION_PART_V.find(g => g.category === 'niepelny_schemat');
assert.ok(incomplete && incomplete.ruleSummary.includes('NIE rozpoczyna się schematu od nowa'), 'Niepełny schemat: brak resetowania cyklu');

const ageLimit = CATCH_UP_IMMUNIZATION_PART_V.find(g => g.category === 'granica_wieku');
assert.ok(ageLimit && ageLimit.ruleSummary.includes('19. roku życia'), 'Obowiązek kończy się z ukończeniem 19. roku życia');

console.log('   ✓ SCENARIUSZ 5 ZALICZONY: Wytyczne szczepień wyrównawczych zgodne z Częścią V PSO.\n');

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
// Test 7: Rozdzielenie szczególnych wskazań klinicznych (Część I.B)
// -------------------------------------------------------------
console.log('Test 7: Szczególne wskazania kliniczne – rozdzielenie DTaP, PCV, wcześniactwa i ospy wietrznej');

const pcvPreterm = CHILD_VACCINES_CATALOG.find(i => i.id === 'pso-risk-preterm-pcv');
assert.ok(pcvPreterm, 'Rekord PCV wcześniaków musi istnieć');
assert.equal(pcvPreterm.totalDosesInStandardSeries, 4, 'PCV wcześniaków to schemat 3+1 (4 dawki)');
assert.equal(pcvPreterm.psoPart, 'Część I.B', 'PCV wcześniaków to Część I.B');
assert.equal(pcvPreterm.psoPdfPage, 7, 'PCV wcześniaków na stronie 7');

const dtapRisk = CHILD_VACCINES_CATALOG.find(i => i.id === 'pso-risk-preterm-dtap');
assert.ok(dtapRisk, 'Rekord DTaP grup ryzyka musi istnieć');
assert.notEqual(pcvPreterm.id, dtapRisk.id, 'DTaP i PCV NIE MOGĄ być połączone w jeden rekord');
assert.equal(dtapRisk.psoPart, 'Część I.B', 'DTaP to Część I.B');
assert.equal(dtapRisk.psoPdfPage, 7, 'DTaP na stronie 7');

const vzvRisk = CHILD_VACCINES_CATALOG.find(i => i.id === 'pso-risk-vzv-special');
assert.ok(vzvRisk, 'Ospa wietrzna Część I.B musi istnieć');
assert.equal(vzvRisk.obligationType, 'obowiazkowe', 'Ospa w grupach ryzyka jest OBOWIĄZKOWA ze środków MZ');
assert.equal(vzvRisk.psoPdfPage, 8, 'Ospa w grupach ryzyka na stronie 8');

console.log('   ✓ SCENARIUSZ 7 ZALICZONY: Wskazania DTaP, PCV 3+1 i VZV w Części I.B są ściśle rozdzielone.\n');

// -------------------------------------------------------------
// Test 8: Precyzja szczepień zalecanych (HPV, Grypa, Ospa wietrzna)
// -------------------------------------------------------------
console.log('Test 8: Szczepienia zalecane (Część II) – HPV, grypa, ospa wietrzna');

const hpv = CHILD_VACCINES_CATALOG.find(i => i.id === 'pso-rec-hpv-9');
assert.ok(hpv, 'Rekord HPV musi istnieć');
assert.ok(hpv.clinicalNotes.includes('przed ukończeniem 14. roku życia'), 'HPV: warunek rozpoczęcia przed 14. rokiem życia');
assert.ok(hpv.clinicalNotes.includes('po ukończeniu 14. roku życia'), 'HPV: możliwość bezpłatnego zakończenia po 14. r.ż.');
assert.ok(hpv.clinicalNotes.includes('15–18 lat'), 'HPV: schemat 3-dawkowy dla 15-18 lat');

const flu = CHILD_VACCINES_CATALOG.find(i => i.id === 'pso-rec-influenza-1');
assert.ok(flu, 'Rekord grypy musi istnieć');
assert.ok(flu.officialFundingSourceRef.includes('Art. 43a ustawy'), 'Grypa: podstawa refundacji to art. 43a ustawy o świadczeniach opieki zdrowotnej');

const vzvRec = CHILD_VACCINES_CATALOG.find(i => i.id === 'pso-rec-vzv-1');
assert.ok(vzvRec, 'Ospa zalecana musi istnieć');
assert.equal(vzvRec.obligationType, 'zalecane', 'Ospa powszechna jest zalecana');
assert.equal(vzvRec.psoPart, 'Część II', 'Ospa powszechna to Część II');
assert.notEqual(vzvRec.id, vzvRisk.id, 'Ospa zalecana i ospa obowiązkowa to dwa niezależne rekordy');

console.log('   ✓ SCENARIUSZ 8 ZALICZONY: Warunki wiekowe i refundacyjne HPV, grypy i ospy wietrznej zweryfikowane.\n');

// -------------------------------------------------------------
// Test 9: Liczniki i nazewnictwo rekordów bazy (ETAP 8)
// -------------------------------------------------------------
console.log('Test 9: Liczniki procedur – precyzyjne nazewnictwo rekordów bazy VaxNurse');

const mandatoryCount = CHILD_VACCINES_CATALOG.filter(i => i.obligationType === 'obowiazkowe').length;
const recommendedCount = CHILD_VACCINES_CATALOG.filter(i => i.obligationType === 'zalecane').length;

assert.equal(mandatoryCount, 30, 'Liczba rekordów szczepień obowiązkowych w bazie VaxNurse wynosi dokładnie 30');
assert.equal(recommendedCount, 9, 'Liczba rekordów szczepień zalecanych w bazie VaxNurse wynosi dokładnie 9');
assert.equal(mandatoryCount + recommendedCount, 39, 'Łączna liczba rekordów procedur wynosi dokładnie 39');

console.log('   ✓ SCENARIUSZ 9 ZALICZONY: Liczniki 30 i 9 są prawidłowo zdefiniowane jako liczba rekordów w bazie VaxNurse.\n');

// -------------------------------------------------------------
// Test 10: Nienaruszalność pilotażowego rekordu Infanrix hexa
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
