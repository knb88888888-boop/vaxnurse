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
});
