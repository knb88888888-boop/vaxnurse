import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { PSO_2027_STRUCTURED_RECORDS, PSO_2027_COMPLETENESS_REGISTRY } from '../../src/data/pso2027CompleteData';
import { PSO_2027_RECORD_EVIDENCE_MANIFEST } from '../../src/data/pso2027EvidenceManifest';
import { CHILD_VACCINES_CATALOG } from '../../src/data/childVaccinesData';
import { VACCINES_CATALOG } from '../../src/data/vaccinesCatalog';
import { STAGE1_CHPL_AUDIT_BUNDLE } from '../../src/data/chplStage1AuditSheets';

describe('MASTER 22 — Niezależny audyt kliniczny i źródłowy PSO 2027', () => {
  it('utrzymuje dokładnie 119 ustrukturyzowanych rekordów wiedzy PSO 2027', () => {
    expect(PSO_2027_STRUCTURED_RECORDS.length).toBe(119);
  });

  it('utrzymuje dokładnie 35 podsekcji w rejestrze kompletności', () => {
    expect(PSO_2027_COMPLETENESS_REGISTRY.length).toBe(35);
  });

  it('utrzymuje dokładnie 119 wpisów w manifeście dowodowym (1:1 z rekordami)', () => {
    expect(PSO_2027_RECORD_EVIDENCE_MANIFEST.length).toBe(119);
    
    const recordIds = new Set(PSO_2027_STRUCTURED_RECORDS.map(r => r.id));
    const manifestIds = new Set(PSO_2027_RECORD_EVIDENCE_MANIFEST.map(m => m.recordId));
    
    expect(recordIds.size).toBe(119);
    expect(manifestIds.size).toBe(119);
    
    for (const id of recordIds) {
      expect(manifestIds.has(id)).toBe(true);
    }
  });

  it('utrzymuje spójny rozkład statusów: 118 verified i 1 conflicting (pso-vii-c)', () => {
    const verifiedRecs = PSO_2027_STRUCTURED_RECORDS.filter(r => r.verificationStatus === 'verified');
    const conflictingRecs = PSO_2027_STRUCTURED_RECORDS.filter(r => r.verificationStatus === 'conflicting');
    const partiallyVerifiedRecs = PSO_2027_STRUCTURED_RECORDS.filter(r => r.verificationStatus === 'partially_verified');
    const notVerifiedRecs = PSO_2027_STRUCTURED_RECORDS.filter(r => r.verificationStatus === 'not_verified');

    expect(verifiedRecs.length).toBe(118);
    expect(conflictingRecs.length).toBe(1);
    expect(partiallyVerifiedRecs.length).toBe(0);
    expect(notVerifiedRecs.length).toBe(0);
    expect(conflictingRecs[0].id).toBe('pso-vii-c');

    const verifiedManifest = PSO_2027_RECORD_EVIDENCE_MANIFEST.filter(m => m.verificationStatus === 'verified');
    const conflictingManifest = PSO_2027_RECORD_EVIDENCE_MANIFEST.filter(m => m.verificationStatus === 'conflicting');
    expect(verifiedManifest.length).toBe(118);
    expect(conflictingManifest.length).toBe(1);
    expect(conflictingManifest[0].recordId).toBe('pso-vii-c');

    const verifiedSub = PSO_2027_COMPLETENESS_REGISTRY.filter(s => s.verificationStatus === 'verified');
    const conflictingSub = PSO_2027_COMPLETENESS_REGISTRY.filter(s => s.verificationStatus === 'conflicting');
    expect(verifiedSub.length).toBe(34);
    expect(conflictingSub.length).toBe(1);
    expect(conflictingSub[0].subsectionCode).toBe('VII.C');
  });

  it('egzekwuje nienaruszalność pustych komórek i statusu conflicting dla meningokoków dorosłych w VII.C', () => {
    const recViic = PSO_2027_STRUCTURED_RECORDS.find(r => r.id === 'pso-vii-c');
    expect(recViic).toBeDefined();
    expect(recViic?.verificationStatus).toBe('conflicting');
    expect(recViic?.sourcePage).toBe(48);
    expect(recViic?.auditNote).toContain('19–49 i 50–64 lat są w PDF puste');
    expect(recViic?.auditNote).toContain('Część II.B (str. 23–24)');

    const manViic = PSO_2027_RECORD_EVIDENCE_MANIFEST.find(m => m.recordId === 'pso-vii-c');
    expect(manViic).toBeDefined();
    expect(manViic?.verificationStatus).toBe('conflicting');
    expect(manViic?.auditNotes).toContain('scalone puste komórki (#d9d9d9, colSpan 2)');
    expect(manViic?.caveat).toContain('Status conflicting: puste komórki w skróconym kalendarzu VII.C');
  });

  it('chroni niezmienniki bezpieczeństwa klinicznego ChPL oraz blokady zatwierdzeń', () => {
    // 1. Infanrix Hexa
    const infanrixInCat = VACCINES_CATALOG.find(v => v.id === 'vac-infanrix-hexa');
    expect(infanrixInCat).toBeDefined();
    const textDesc = JSON.stringify(infanrixInCat);
    expect(textDesc.includes('0,0289 µg') || textDesc.includes('0.0289 µg')).toBe(true);

    // 2. VaxigripTetra
    const vaxigripInCat = VACCINES_CATALOG.find(v => v.id === 'vac-vaxigrip-tetra');
    expect(vaxigripInCat).toBeDefined();
    expect(vaxigripInCat?.atcCode).toBe('J07BB02');

    // 3. verified_full = 0 w katalogu procedur dziecięcych
    for (const item of CHILD_VACCINES_CATALOG) {
      expect(item.chplContentVerificationStatus).not.toBe('verified_full');
    }

    // 4. Otwarte pytania kontrolne ChPL
    const checklist = STAGE1_CHPL_AUDIT_BUNDLE.humanDecisionChecklist;
    expect(checklist.length).toBe(8);
    for (const item of checklist) {
      expect(item.autoResolved).toBe(false);
    }
  });

  it('weryfikuje istnienie i rozmiar raportu audytowego MASTER 22', () => {
    const reportPath = path.resolve('docs/audits/PSO_2027_MASTER22_INDEPENDENT_AUDIT.md');
    expect(fs.existsSync(reportPath)).toBe(true);
    const stat = fs.statSync(reportPath);
    expect(stat.size).toBeGreaterThan(50000); // Ponad 50 KB szczegółowego raportu
  });

  it('potwierdza integralność pliku źródłowego akt.pdf (jeśli obecny lokalnie) oraz referencyjną sumę SHA-256', () => {
    const expectedHash = '4C6FA9212F292B130FD8958BAAEEAC2444F86FBAA260B873D586B905108FC6DA';
    const pdfPath = path.resolve('akt.pdf');
    if (fs.existsSync(pdfPath)) {
      const hash = crypto.createHash('sha256').update(fs.readFileSync(pdfPath)).digest('hex').toUpperCase();
      expect(hash).toBe(expectedHash);
    } else {
      // W środowisku CI (gdzie *.pdf podlega regule .gitignore) weryfikujemy referencyjną sumę w dokumencie audytowym
      const auditDoc = fs.readFileSync(path.resolve('docs/audits/PSO_2027_MASTER22_INDEPENDENT_AUDIT.md'), 'utf8');
      expect(auditDoc).toContain(expectedHash);
    }
  });
});
