import assert from 'node:assert/strict';
import {
  CHILD_AGE_BRACKETS,
  CHILD_VACCINES_CATALOG,
  STAGE_GROUPS_CONFIG,
  PSO_GENERAL_PRINCIPLES
} from '../src/data/childVaccinesData.ts';
import { VACCINES_CATALOG } from '../src/data/vaccinesCatalog.ts';

console.log('================================================================');
console.log('   AUDYT I TESTY MODUŁU SZCZEPIENIA DZIECI (PSO 2027) VAXNURSE  ');
console.log('================================================================\n');

// -------------------------------------------------------------
// Test A: Integralność struktury grup wiekowych PSO 2027
// -------------------------------------------------------------
console.log('Test A: Struktura i chronologia etapów wiekowych PSO 2027');

assert.ok(CHILD_AGE_BRACKETS.length >= 11, 'Baza musi zawierać co najmniej 11 etapów wiekowych');
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

// Sprawdzenie konfiguracji grup etapów
assert.ok(STAGE_GROUPS_CONFIG.length === 6, 'Musi być zdefiniowane 6 grup etapów');
assert.ok(STAGE_GROUPS_CONFIG.some(g => g.id === 'infancy'), 'Grupa infancy musi istnieć');
assert.ok(STAGE_GROUPS_CONFIG.some(g => g.id === 'toddler'), 'Grupa toddler musi istnieć');
console.log('   ✓ SCENARIUSZ A ZALICZONY: Wszystkie 12 etapów wiekowych zdefiniowane z pełną chronologią i powiązaniem z nagłówkami PSO.\n');

// -------------------------------------------------------------
// Test B: Integralność i rzetelność danych procedur szczepiennych
// -------------------------------------------------------------
console.log('Test B: Źródła urzędowe, podstawa prawna i metadane procedur');

assert.ok(CHILD_VACCINES_CATALOG.length >= 20, 'Katalog musi zawierać co najmniej 20 szczegółowych procedur');

const OFFICIAL_PSO_URL = 'https://www.gov.pl/web/gis/program-szczepien-ochronnych-na-2027-rok';
const LEGAL_ACT_KEYWORD = 'Dz. Urz. Min. Zdrow. 2026 poz. 77';
const PUBLICATION_DATE = '28.10.2026';

for (const item of CHILD_VACCINES_CATALOG) {
  assert.ok(item.id.startsWith('pso-'), `Identyfikator ${item.id} musi zaczynać się od 'pso-'`);
  assert.ok(item.disease.length > 5, `Wpis ${item.id} musi mieć sprecyzowaną chorobę`);
  assert.ok(item.shortCode.length > 0, `Wpis ${item.id} musi mieć skrót kliniczny`);
  assert.ok(['obowiazkowe', 'zalecane'].includes(item.obligationType), `Wpis ${item.id} musi mieć poprawny rodzaj obowiązku`);
  assert.equal(item.psoOfficialUrl, OFFICIAL_PSO_URL, `Wpis ${item.id} musi wskazywać oficjalny portal GIS`);
  assert.ok(item.psoLegalAct.includes(LEGAL_ACT_KEYWORD), `Wpis ${item.id} musi powoływać akt prawny ${LEGAL_ACT_KEYWORD}`);
  assert.equal(item.psoPublicationDate, PUBLICATION_DATE, `Wpis ${item.id} musi mieć datę publikacji aktu ${PUBLICATION_DATE}`);
  assert.equal(item.verificationStatus, 'verified_pso', `Wpis ${item.id} musi mieć status verified_pso`);
  assert.ok(item.administrationRoute.length > 0, `Wpis ${item.id} musi precyzować drogę podania`);
  assert.ok(item.injectionSite.length > 0, `Wpis ${item.id} musi precyzować miejsce iniekcji`);
  assert.ok(item.clinicalNotes.length > 20, `Wpis ${item.id} musi zawierać szczegółowe wytyczne dla personelu`);
  assert.ok(item.fundingStatus.length > 0, `Wpis ${item.id} musi określać status finansowania`);
}
console.log(`   ✓ SCENARIUSZ B ZALICZONY: Wszystkie ${CHILD_VACCINES_CATALOG.length} wpisów posiadają kompletne metadane urzędowe, źródło GIS i podstawę prawną MZ.\n`);

// -------------------------------------------------------------
// Test C: Podział na szczepienia obowiązkowe i zalecane
// -------------------------------------------------------------
console.log('Test C: Podział na szczepienia obowiązkowe i zalecane');

const mandatoryItems = CHILD_VACCINES_CATALOG.filter(i => i.obligationType === 'obowiazkowe');
const recommendedItems = CHILD_VACCINES_CATALOG.filter(i => i.obligationType === 'zalecane');

assert.ok(mandatoryItems.length >= 15, 'Musi być co najmniej 15 procedur obowiązkowych');
assert.ok(recommendedItems.length >= 7, 'Musi być co najmniej 7 procedur zalecanych');

// Sprawdzenie kluczowych jednostek obowiązkowych
const mandatoryDiseases = mandatoryItems.map(i => i.disease.toLowerCase());
assert.ok(mandatoryDiseases.some(d => d.includes('gruźlica')), 'Gruźlica musi być w szczepieniach obowiązkowych');
assert.ok(mandatoryDiseases.some(d => d.includes('zapalenie wątroby typu b')), 'WZW B musi być w szczepieniach obowiązkowych');
assert.ok(mandatoryDiseases.some(d => d.includes('błonica')), 'Błonica/tężec/krztusiec musi być w szczepieniach obowiązkowych');
assert.ok(mandatoryDiseases.some(d => d.includes('haemophilus influenzae')), 'Hib musi być w szczepieniach obowiązkowych');
assert.ok(mandatoryDiseases.some(d => d.includes('streptococcus pneumoniae')), 'Pneumokoki muszą być w szczepieniach obowiązkowych');
assert.ok(mandatoryDiseases.some(d => d.includes('poliomyelitis')), 'Poliomyelitis musi być w szczepieniach obowiązkowych');
assert.ok(mandatoryDiseases.some(d => d.includes('rotawirus')), 'Rotawirusy muszą być w szczepieniach obowiązkowych');
assert.ok(mandatoryDiseases.some(d => d.includes('odra')), 'Odra/świnka/różyczka (MMR) musi być w szczepieniach obowiązkowych');

// Sprawdzenie kluczowych jednostek zalecanych
const recommendedDiseases = recommendedItems.map(i => i.disease.toLowerCase());
assert.ok(recommendedDiseases.some(d => d.includes('meningokok')), 'Meningokoki muszą być w szczepieniach zalecanych');
assert.ok(recommendedDiseases.some(d => d.includes('brodawczak') || d.includes('hpv')), 'HPV musi być w szczepieniach zalecanych');
assert.ok(recommendedDiseases.some(d => d.includes('ospa wietrzna')), 'Ospa wietrzna musi być w szczepieniach zalecanych');
assert.ok(recommendedDiseases.some(d => d.includes('grypa')), 'Grypa musi być w szczepieniach zalecanych');
assert.ok(recommendedDiseases.some(d => d.includes('kleszczowe')), 'KZM musi być w szczepieniach zalecanych');
assert.ok(recommendedDiseases.some(d => d.includes('wzw a') || d.includes('wirusowe zapalenie wątroby typu a')), 'WZW A musi być w szczepieniach zalecanych');

console.log(`   ✓ SCENARIUSZ C ZALICZONY: Prawidłowy podział kliniczny (${mandatoryItems.length} obowiązkowych, ${recommendedItems.length} zalecanych).\n`);

// -------------------------------------------------------------
// Test D: Powiązanie z preparatami w Bazie VaxNurse (ChPL)
// -------------------------------------------------------------
console.log('Test D: Powiązanie z preparatami katalogu i nienaruszalność Infanrix hexa');

const catalogIds = new Set(VACCINES_CATALOG.map(v => v.id));
let totalLinkedReferences = 0;

for (const item of CHILD_VACCINES_CATALOG) {
  for (const linkedId of item.linkedVaccineIds) {
    assert.ok(catalogIds.has(linkedId), `Identyfikator preparatu ${linkedId} musi istnieć w VACCINES_CATALOG`);
    totalLinkedReferences++;
  }
}

assert.ok(totalLinkedReferences >= 8, 'Musi być co najmniej 8 odwołań do preparatów referencyjnych');

// Weryfikacja nienaruszalności pilotażowego rekordu Infanrix hexa
const infanrix = VACCINES_CATALOG.find(v => v.id === 'vac-infanrix-hexa');
assert.ok(infanrix, 'Infanrix hexa musi istnieć w katalogu');
assert.equal(infanrix.verificationStatus, 'requires_source_clarification', 'Status Infanrix hexa nie może ulec samowolnej zmianie');
assert.ok(infanrix.sourceDiscrepancies?.length === 1, 'Infanrix hexa musi zachować niezgodność sourceDiscrepancies');
assert.equal(infanrix.sourceDiscrepancies[0].id, 'disc-phenylalanine-content-01', 'Identyfikator niezgodności to disc-phenylalanine-content-01');
assert.equal(infanrix.sourceDiscrepancies[0].status, 'requires_clarification', 'Status niezgodności to requires_clarification');

console.log(`   ✓ SCENARIUSZ D ZALICZONY: Wszystkie powiązania z preparatami są prawidłowe (${totalLinkedReferences} odwołań), a status i blokada Infanrix hexa pozostały w 100% nienaruszone.\n`);

// -------------------------------------------------------------
// Test E: Symulacja działania wyszukiwarki i filtrów
// -------------------------------------------------------------
console.log('Test E: Filtrowanie po etapie wiekowym, obowiązku i wyszukiwaniu fraz');

// Filtrowanie po etapie: niemowlęcy (infancy)
const infancyStageItems = CHILD_VACCINES_CATALOG.filter(item => {
  const b = CHILD_AGE_BRACKETS.find(br => br.id === item.ageBracketId);
  return b && b.stageGroup === 'infancy';
});
assert.ok(infancyStageItems.length >= 10, 'W 1. roku życia musi być co najmniej 10 procedur');

// Wyszukiwanie frazy 'Infanrix' (wyszukiwanie po powiązanym preparacie)
const searchInfanrix = CHILD_VACCINES_CATALOG.filter(item => {
  return item.linkedVaccineIds.some(id => {
    const v = VACCINES_CATALOG.find(vac => vac.id === id);
    return v && v.tradeName.toLowerCase().includes('infanrix');
  });
});
assert.ok(searchInfanrix.length >= 4, 'Wyszukiwanie po Infanrix hexa musi znaleźć co najmniej 4 procedury powiązane (DTP, HBV, IPV, Hib)');

// Wyszukiwanie frazy 'BCG'
const searchBcg = CHILD_VACCINES_CATALOG.filter(item => {
  const q = 'bcg';
  return item.disease.toLowerCase().includes(q) || item.shortCode.toLowerCase().includes(q);
});
assert.equal(searchBcg.length, 1, 'Wyszukanie BCG musi zwrócić dokładnie 1 pozycję');
assert.equal(searchBcg[0].id, 'pso-bcg-0');

// Wyszukiwanie po drodze podania 'doustnie'
const searchOral = CHILD_VACCINES_CATALOG.filter(item => {
  return item.administrationRoute.toLowerCase().includes('doustnie');
});
assert.ok(searchOral.length >= 2, 'Wyszukiwanie procedur doustnych (RV) musi zwrócić co najmniej 2 dawki');

console.log('   ✓ SCENARIUSZ E ZALICZONY: Wyszukiwanie i filtry działają deterministycznie i bezbłędnie.\n');

// -------------------------------------------------------------
// Test F: Ogólne zasady realizacji szczepień (Zasady PSO 2027)
// -------------------------------------------------------------
console.log('Test F: Poprawność ogólnych zasad wykonawczych PSO 2027');

assert.ok(PSO_GENERAL_PRINCIPLES.principles.length === 5, 'Musi być dokładnie 5 kluczowych zasad ogólnych PSO 2027');
const principleTitles = PSO_GENERAL_PRINCIPLES.principles.map(p => p.title.toLowerCase());
assert.ok(principleTitles.some(t => t.includes('kwalifikacja lekarska')), 'Zasada kwalifikacji lekarskiej musi być obecna');
assert.ok(principleTitles.some(t => t.includes('jednoczesne podawanie')), 'Zasada jednoczesnego podawania musi być obecna');
assert.ok(principleTitles.some(t => t.includes('odstępy między szczepionkami')), 'Zasada odstępów musi być obecna');
assert.ok(principleTitles.some(t => t.includes('nieresetowania')), 'Zasada nieresetowania schematu musi być obecna');
assert.ok(principleTitles.some(t => t.includes('miejsca iniekcji')), 'Zasada doboru miejsca iniekcji musi być obecna');

console.log('   ✓ SCENARIUSZ F ZALICZONY: Wszystkie 5 ogólnych zasad wykonawczych jest zgodnych z komunikatem GIS.\n');

console.log('================================================================');
console.log(' WYNIK KOŃCOWY: 6/6 TESTÓW SZCZEPIEŃ DZIECI ZALICZONYCH (100%) ');
console.log('================================================================\n');
