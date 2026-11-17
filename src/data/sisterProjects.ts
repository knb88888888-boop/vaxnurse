export interface SisterPortalInfo {
  id: string;
  name: string;
  subtitle: string;
  url: string;
  badge: string;
  summary: string;
  whatItIs: string;
  whyCreated: string;
  whoIsItFor: string[];
  keyModules: string[];
  disclaimer: string;
}

export const PCW_PROJECT: SisterPortalInfo = {
  id: 'pcw-sister-portal',
  name: 'Pielęgniarskie Centrum Wiedzy (PCW)',
  subtitle: 'Portal Kliniczny i Prawny dla Pielęgniarek i Położnych',
  url: 'https://pielegniarki.vercel.app/',
  badge: 'Projekt siostrzany • Bezpłatnie i bez reklam',
  summary:
    'Bezpłatna, działająca w 100% offline (PWA) platforma wiedzy klinicznej, przepisów prawnych, procedur SOP, kalkulatorów OIT/SOR, pediatrii i farmakologii dla polskich pielęgniarek i położnych.',
  whatItIs:
    'Niezależny portal referencyjny dla praktyki oddziałowej i dyżurowej — bez logowania, bez reklam i bez zapisu danych osobowych pacjentów (Zero-PII).',
  whyCreated:
    'Aby w jednym, uporządkowanym miejscu zgromadzić sprawdzone kalkulatory kliniczne (NEWS2, GCS NT, pompy infuzyjne OIT, bilans płynów), analizator niezgodności lekowych Y-site, standardy SOP oraz aktualne prawo medyczne i kreator pism.',
  whoIsItFor: [
    'Pielęgniarki i pielęgniarze oddziałowi, OAiIT, SOR i POZ',
    'Położne oraz personel zabiegowy',
    'Studenci pielęgniarstwa i położnictwa',
    'Osoby potrzebujące wzorów pism i podstaw prawnych (Dz.U. 2026 poz. 15 / NIPiP)'
  ],
  keyModules: [
    '14 kalkulatorów klinicznych (NEWS2, GCS, OIT)',
    'Pediatria (0–18 lat) i normy rozwojowe',
    'Farmakologia i niezgodności Y-site',
    'Procedury SOP i kreator pism prawnych',
    'Prawo medyczne i punkty edukacyjne'
  ],
  disclaimer:
    'Narzędzie pomocniczo-edukacyjne. Nie zastępuje zlecenia lekarskiego, ChPL ani wewnętrznych procedur placówki.'
};
