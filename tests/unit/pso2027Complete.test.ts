import { describe, expect, it } from 'vitest';
import {
  CHILD_VACCINES_CATALOG,
  PSO_GENERAL_PRINCIPLES_PART_IV,
  PSO_PART_IV_PREAMBLE,
  PSO_PART_VI_OFFICIAL_FOOTNOTES,
  SEPARATE_LEGAL_ACT_RULES_NON_PSO,
  STAFF_QUALIFICATIONS_PSO_PART_VI,
} from '../../src/data/childVaccinesData';
import {
  PSO_2027_COMPLETENESS_REGISTRY,
  PSO_2027_SOURCE_META,
  PSO_2027_STRUCTURED_RECORDS,
  PSO_PART_IA_SCOPE_NOTES,
  PSO_PART_IB_RISK_BLOCKS,
  PSO_PART_IC_ENTRIES,
  PSO_PART_ID_RABIES_MATRIX,
  PSO_PART_IE_FOOTNOTE,
  PSO_PART_IE_TETANUS_MATRIX,
  PSO_PART_IIA_PEDIATRIC_RECOMMENDED,
  PSO_PART_IIB_ADULTS_RECOMMENDED,
  PSO_PART_IIC_PREGNANCY,
  PSO_PART_IID_HEALTHCARE_WORKERS,
  PSO_PART_IIE_OCCUPATIONAL_INTRO,
  PSO_PART_IIE_OTHER_WORKERS,
  PSO_PART_IIF_POST_EXPOSURE,
  PSO_PART_IIG_HBV_PEP_MATRIX,
  PSO_PART_IIH_RSV_PASSIVE,
  PSO_PART_III_SECTIONS,
  PSO_PART_III_TRAVEL_ENDEMIC,
  PSO_PART_VII_TABLES,
  getPso2027CompletenessSummary,
  searchPso2027Records,
} from '../../src/data/pso2027CompleteData';
import { VACCINES_CATALOG } from '../../src/data/vaccinesCatalog';
import { STAGE1_CHPL_AUDIT_BUNDLE } from '../../src/data/chplStage1AuditSheets';
import { auditChildVaccinesCatalogSummary } from '../../src/utils/childVaccineAudit';

describe('MASTER 15 — Kompletne 7-częściowe odwzorowanie PSO 2027 (Dz. Urz. Min. Zdrow. 2026 poz. 77)', () => {

  it('1. Zachowuje dokładne metadane dokumentu urzędowego GIS (48 stron, SHA-256 PDF) i pokrycie wszystkich 7 części I–VII', () => {
    expect(PSO_2027_SOURCE_META.gisAnnouncementDate).toBe('28.10.2026');
    expect(PSO_2027_SOURCE_META.journalPublicationDate).toBe('30.10.2026');
    expect(PSO_2027_SOURCE_META.totalPages).toBe(48);
    expect(PSO_2027_SOURCE_META.officialPdfUrl).toBe('https://dziennikmz.mz.gov.pl/DUM_MZ/2026/77/akt.pdf');
    expect(PSO_2027_SOURCE_META.pdfSha256).toBe('4C6FA9212F292B130FD8958BAAEEAC2444F86FBAA260B873D586B905108FC6DA');

    const summary = getPso2027CompletenessSummary();
    expect(summary.partsCovered).toEqual(['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']);
    expect(summary.totalSubsections).toBe(PSO_2027_COMPLETENESS_REGISTRY.length);
    expect(summary.totalSubsections).toBeGreaterThanOrEqual(34);
    expect(summary.conflicting).toBe(1);
    expect(summary.not_verified).toBe(0);
  });

  it('2. Pokrywa kompletnie Część I: I.A (>3 mies.), I.A.1 (5w1), I.A.2 (6w1), I.B (4 bloki ryzyka), I.C, I.D (matryca wścieklizny str. 17), I.E (matryca tężca str. 18)', () => {
    expect(PSO_PART_IA_SCOPE_NOTES.subsectionIA.officialScopeRule).toContain('3 miesiące');
    expect(PSO_PART_IA_SCOPE_NOTES.subsectionIA1.sourcePages).toEqual([9, 10]);
    expect(PSO_PART_IA_SCOPE_NOTES.subsectionIA2.sourcePages).toEqual([11, 12]);
    expect(PSO_PART_IB_RISK_BLOCKS.length).toBe(4);
    expect(PSO_PART_IC_ENTRIES.length).toBe(3);
    expect(PSO_PART_ID_RABIES_MATRIX.length).toBe(8);
    expect(PSO_PART_IE_TETANUS_MATRIX.length).toBe(4);
    expect(PSO_PART_IE_FOOTNOTE).toContain('KRZTUŚCOWI');
  });

  it('3. Pokrywa kompletnie Część II (II.A–II.I): dzieci, 17 dorosłych, ciąża, personel medyczny, pracownicy (pracodawca), PEP, HBV 5x3, bierne RSV, podróże (10 chorób)', () => {
    expect(PSO_PART_IIA_PEDIATRIC_RECOMMENDED.length).toBe(7);
    expect(PSO_PART_IIB_ADULTS_RECOMMENDED.length).toBe(17);
    expect(PSO_PART_IIC_PREGNANCY.length).toBe(4);
    expect(PSO_PART_IID_HEALTHCARE_WORKERS.length).toBe(10);
    expect(PSO_PART_IIE_OCCUPATIONAL_INTRO.legalBasisText).toContain('finansowane w całości przez pracodawców');
    expect(PSO_PART_IIE_OTHER_WORKERS.length).toBe(8);
    expect(PSO_PART_IIF_POST_EXPOSURE.length).toBe(4);
    expect(PSO_PART_IIG_HBV_PEP_MATRIX.length).toBe(5);
    expect(PSO_PART_IIH_RSV_PASSIVE.vaccinationType).toBe('bierne');
    expect(PSO_PART_IIH_RSV_PASSIVE.sourcePages).toEqual([34]);
    expect(PSO_PART_III_TRAVEL_ENDEMIC.length).toBe(10);
  });

  it('4. Pokrywa wszystkie 13 sekcji uzupełniających Części III (III.A–III.M, str. 36–42)', () => {
    expect(PSO_PART_III_SECTIONS.map((s) => s.subsectionCode)).toEqual([
      'III.A',
      'III.B',
      'III.C',
      'III.D',
      'III.E',
      'III.F',
      'III.G',
      'III.H',
      'III.I',
      'III.J',
      'III.K',
      'III.L',
      'III.M',
    ]);
  });

  it('5. Remediacja Części IV (str. 43) i Części VI (str. 45): dosłowne brzmienie bez przypisywania norm z ustaw odrębnych jako punktów PSO', () => {
    expect(PSO_PART_IV_PREAMBLE.officialText).toContain('zakupione przez ministra właściwego do spraw zdrowia');
    expect(PSO_PART_IV_PREAMBLE.psoPdfPage).toBe(43);
    expect(PSO_GENERAL_PRINCIPLES_PART_IV.every((p) => p.psoPdfPage === 43)).toBe(true);
    expect(PSO_GENERAL_PRINCIPLES_PART_IV.some((p) => p.officialRuleText.includes('24 godzin'))).toBe(false);

    const p2 = PSO_GENERAL_PRINCIPLES_PART_IV.find((p) => p.pointNumber === 2)!;
    const p5 = PSO_GENERAL_PRINCIPLES_PART_IV.find((p) => p.pointNumber === 5)!;
    const p6 = PSO_GENERAL_PRINCIPLES_PART_IV.find((p) => p.pointNumber === 6)!;
    expect(p2.officialRuleText).toContain('nie krótszy niż 4 tygodnie');
    expect(p2.specificExceptions.join(' ')).toContain('ROTAWIRUSOM');
    expect(p5.officialRuleText).toContain('nie powinien być skracany');
    expect(p6.officialRuleText).toContain('5 lat jest w 6. roku życia');

    expect(SEPARATE_LEGAL_ACT_RULES_NON_PSO.length).toBe(3);

    const felczer = STAFF_QUALIFICATIONS_PSO_PART_VI.find((s) => s.professionId === 'felczer')!;
    const pielegniarka = STAFF_QUALIFICATIONS_PSO_PART_VI.find((s) => s.professionId === 'pielegniarka')!;
    const polozna = STAFF_QUALIFICATIONS_PSO_PART_VI.find((s) => s.professionId === 'polozna')!;
    expect(felczer.qualificationMandatory).toBe(false);
    expect(pielegniarka.qualificationRecommended9To18).toBe(true);
    expect(polozna.qualificationRecommended9To18).toBe(true);
    expect(PSO_PART_VI_OFFICIAL_FOOTNOTES).toHaveLength(2);
    expect(PSO_PART_VI_OFFICIAL_FOOTNOTES[0].sourcePage).toBe(45);
  });

  it('6. Skrócone kalendarze Części VII (VII.A str. 46, VII.B str. 47, VII.C str. 48) zachowują pełne colSpan i jawną notę rozbieżności Meningokokom w VII.C', () => {
    expect(PSO_PART_VII_TABLES.map((t) => t.subsectionCode)).toEqual(['VII.A', 'VII.B', 'VII.C']);
    for (const table of PSO_PART_VII_TABLES) {
      const expectedColCount = table.columns.length;
      for (const row of table.rows) {
        const spanSum = row.cells.reduce((acc, cell) => acc + cell.colSpan, 0);
        expect(spanSum, `Suma colSpan w wierszu ${row.id} (${table.subsectionCode})`).toBe(expectedColCount);
      }
    }

    const viiC = PSO_PART_VII_TABLES.find((t) => t.subsectionCode === 'VII.C')!;
    expect(viiC.sourcePage).toBe(48);
    expect(viiC.columns.map((c) => c.primaryLabel)).toEqual(['19–49 lat', '50–64 lat', '65 lat i powyżej']);
    expect(viiC.verificationStatus).toBe('conflicting');
    expect(viiC.structuralAuditNote).toContain('Meningokokom');
  });

  it('7. Wyszukiwarka przekrojowa PSO 2027 znajduje wpisy we wszystkich 7 częściach oraz zachowuje nietknięty audyt ChPL / ATC', () => {
    expect(PSO_2027_STRUCTURED_RECORDS.length).toBeGreaterThan(80);
    expect(searchPso2027Records({ query: 'wścieklizna', part: 'I' }).length).toBeGreaterThan(0);
    expect(searchPso2027Records({ query: 'RSV', part: 'II' }).length).toBeGreaterThan(0);
    expect(searchPso2027Records({ query: 'przedwcześnie', part: 'III' }).length).toBeGreaterThan(0);
    expect(searchPso2027Records({ query: 'Karcie Szczepień', part: 'IV' }).length).toBeGreaterThan(0);
    expect(searchPso2027Records({ query: 'wyrównawcze', part: 'V' }).length).toBeGreaterThan(0);
    expect(searchPso2027Records({ query: 'Felczer', part: 'VI' }).length).toBeGreaterThan(0);
    expect(searchPso2027Records({ query: 'Półpaścowi', part: 'VII' }).length).toBeGreaterThan(0);

    // Ochrona danych MASTER 13–14
    expect(CHILD_VACCINES_CATALOG).toHaveLength(43);
    const catalogAudit = auditChildVaccinesCatalogSummary(CHILD_VACCINES_CATALOG, VACCINES_CATALOG);
    expect(catalogAudit.verifiedFull).toBe(0);
    expect(STAGE1_CHPL_AUDIT_BUNDLE.targetProcedureStatusAfter).toBe('pending_content_audit');
    expect(STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist).toHaveLength(8);
    expect(STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist.every((h) => h.autoResolved === false)).toBe(true);
    const vaxigrip = VACCINES_CATALOG.find((v) => v.id === 'vac-vaxigrip-tetra');
    expect(vaxigrip?.atcCode).toBe('J07BB02');
  });

  it('8. Audyt MASTER 16 — 119 rekordów i 35 podsekcji bez duplikatów, poprawne strony 1–48 i spójne linki do CHILD_VACCINES_CATALOG', () => {
    expect(PSO_2027_STRUCTURED_RECORDS).toHaveLength(119);
    expect(PSO_2027_COMPLETENESS_REGISTRY).toHaveLength(35);

    const recordIds = PSO_2027_STRUCTURED_RECORDS.map((r) => r.id);
    expect(new Set(recordIds).size).toBe(119);

    const subsectionCodes = PSO_2027_COMPLETENESS_REGISTRY.map((e) => e.subsectionCode);
    expect(new Set(subsectionCodes).size).toBe(35);

    const summary = getPso2027CompletenessSummary();
    expect(summary.verified).toBe(34);
    expect(summary.partially_verified).toBe(0);
    expect(summary.conflicting).toBe(1);
    expect(summary.not_verified).toBe(0);

    const catalogIds = new Set(CHILD_VACCINES_CATALOG.map((c) => c.id));
    for (const rec of PSO_2027_STRUCTURED_RECORDS) {
      expect(rec.title.trim().length, `Pusty tytuł rekordu ${rec.id}`).toBeGreaterThan(0);
      expect(rec.description.trim().length, `Pusty opis rekordu ${rec.id}`).toBeGreaterThan(0);
      expect(rec.sourceReference.trim().length, `Brak sourceReference dla ${rec.id}`).toBeGreaterThan(0);
      const pages = Array.isArray(rec.sourcePage) ? rec.sourcePage : [rec.sourcePage];
      expect(pages.length, `Brak sourcePage dla ${rec.id}`).toBeGreaterThan(0);
      for (const page of pages) {
        expect(Number.isInteger(page) && page >= 1 && page <= 48, `Błędna strona ${page} w ${rec.id}`).toBe(true);
      }
      for (const linkedId of rec.relatedRecords) {
        expect(catalogIds.has(linkedId), `Nieznany relatedRecord ${linkedId} w ${rec.id}`).toBe(true);
      }
    }
  });

  it('9. Audyt Części II (II.A, II.B, II.D, II.E, II.F) — usunięto syntetyczne dopiski z pustych kolumn Uwagi i przywrócono pełne listy z akt.pdf', () => {
    const iiaRegistry = PSO_2027_COMPLETENESS_REGISTRY.find((e) => e.subsectionCode === 'II.A')!;
    expect(iiaRegistry.verificationStatus).toBe('verified');
    expect(iiaRegistry.sourcePages).toEqual([19, 20, 21]);
    expect(iiaRegistry.discrepancyOrCaveat).toContain('verified_full');

    const iiaMap = new Map(PSO_PART_IIA_PEDIATRIC_RECOMMENDED.map((r) => [r.id, r]));
    expect(iiaMap.get('pso-iia-tbe')?.notes).toBe('');
    expect(iiaMap.get('pso-iia-hav')?.notes).toBe('');
    expect(iiaMap.get('pso-iia-hpv')?.notes).toBe('');
    expect(iiaMap.get('pso-iia-vzv')?.notes).toBe('');
    expect(iiaMap.get('pso-iia-influenza')?.recommendations).toContain('domów pomocy społecznej');
    expect(iiaMap.get('pso-iia-influenza')?.recommendations).toContain('asplenią wrodzoną');
    expect(iiaMap.get('pso-iia-meningococci')?.recommendations).toContain('atypowego zespołu hemolityczno-mocznicowego');

    const iibMap = new Map(PSO_PART_IIB_ADULTS_RECOMMENDED.map((r) => [r.id, r]));
    expect(iibMap.get('pso-iib-tbe')?.notes).toBe('');
    expect(iibMap.get('pso-iib-hav')?.notes).toBe('');
    expect(iibMap.get('pso-iib-hpv')?.notes).toBe('');
    expect(iibMap.get('pso-iib-zoster')?.notes).toBe('');
    expect(iibMap.get('pso-iib-influenza')?.recommendations).toContain('domów pomocy społecznej');
    expect(iibMap.get('pso-iib-influenza')?.notes).toContain('wysokodawkową albo standardową');

    expect(PSO_PART_IID_HEALTHCARE_WORKERS.every((r) => r.notes === '')).toBe(true);
    expect(PSO_PART_IIE_OTHER_WORKERS.every((r) => r.notes === '')).toBe(true);

    const iifMap = new Map(PSO_PART_IIF_POST_EXPOSURE.map((r) => [r.id, r]));
    expect(iifMap.get('pso-iif-measles')?.sourcePages).toEqual([32]);
    expect(iifMap.get('pso-iif-varicella')?.sourcePages).toEqual([32]);
    expect(iifMap.get('pso-iif-hav')?.sourcePages).toEqual([32, 33]);
    expect(iifMap.get('pso-iif-hbv')?.sourcePages).toEqual([33]);
  });

  it('10. Rozstrzygnięcie konfliktu VII.C oraz utrzymanie rozdziału statusów ChPL/RPL w katalogu dziecięcym', () => {
    const viiC = PSO_PART_VII_TABLES.find((t) => t.subsectionCode === 'VII.C')!;
    expect(viiC.rows).toHaveLength(13);
    const menRow = viiC.rows.find((r) => r.id === 'viic-meningo')!;
    expect(menRow.cells).toHaveLength(2);
    expect(menRow.cells[0]).toMatchObject({ id: 'c-men-empty', colSpan: 2, text: '', tone: 'conditional' });
    expect(menRow.cells[1]).toMatchObject({
      id: 'c-men-65',
      colSpan: 1,
      text: 'MenB – 2 dawki / MenACWY – 1 dawka',
    });
    expect(menRow.rowNote).toContain('str. 23–24');

    const clarificationCount = CHILD_VACCINES_CATALOG.filter(
      (c) => c.chplVerificationStatus === 'requires_source_clarification',
    ).length;
    const pendingCount = CHILD_VACCINES_CATALOG.filter(
      (c) => c.chplVerificationStatus === 'pending_chpl_verification',
    ).length;
    expect(clarificationCount).toBe(12);
    expect(pendingCount).toBe(31);
    expect(clarificationCount + pendingCount).toBe(43);
  });
});
