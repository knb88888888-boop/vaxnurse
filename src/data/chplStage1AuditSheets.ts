import type { Stage1ChplAuditBundle } from '../types/childVaccines.ts';

/**
 * Roboczy pakiet I etapu przygotowawczego audytu ChPL (PROMPT 25) dla czterech preparatów:
 * - Influvac (RPL ID 49462, sezon 2026/2027)
 * - Vaxigrip (RPL ID 50032, sezon 2026/2027)
 * - Spikevax XFG (EMA EPAR PL, Aneks I str. 64–92)
 * - Szczepionka przeciwgruźlicza BCG 10 (RPL ID 19535, R/0210)
 *
 * UWAGA AUDYTOWA:
 * Dokument stanowi wyłącznie ustrukturyzowaną ekstrakcję przygotowawczą i wykaz rozbieżności/pytań.
 * Nie zastępuje oceny kompetentnego audytora klinicznego ani nie awansuje żadnej procedury ani karty
 * preparatu do statusu `verified_full`.
 */
export const STAGE1_CHPL_AUDIT_BUNDLE: Stage1ChplAuditBundle = {
  generatedAt: '2026-11-11T03:30:00+01:00',
  preparatoryExtractorNote:
    'I etap przygotowawczy audytu ChPL: rozdział audytu technicznego (źródło, SHA-256, wersja) od analizy treści (sekcje 1–10 i podpunkty 4.1–4.9), wykazu brakujących danych oraz listy decyzji dla kompetentnego audytora klinicznego. Brak automatycznego awansu do verified_full.',
  targetProcedureStatusBefore: 'pending_content_audit',
  targetProcedureStatusAfter: 'pending_content_audit',

  sourceAndVersionReport: [
    {
      productKey: 'influvac_2026_2027',
      productName: 'Influvac, zawiesina do wstrzykiwań w ampułko-strzykawce',
      relatedProcedureIds: ['pso-rec-influenza-1'],
      rplOrEmaId: 'RPL ID 49462',
      officialSourceUrl:
        'https://rejestrymedyczne.ezdrowie.gov.pl/api/rpl/medicinal-products/49462/characteristic',
      httpStatus: 200,
      contentDispositionOrLastModified:
        'attachment; filename="Charakterystyka-49462-2026-08-13-27090/OLI-2026-08-18.pdf"',
      fileSizeBytes: 221500,
      fileSha256: '933f604e3aef5417ed948d2537900ed40e295b3edd21587778ea902d68cf016d',
      pageCount: 10,
      marketingAuthorizationHolder: 'Viatris Healthcare Limited (Dublin, Irlandia)',
      authorizationNumber: '28478',
      seasonOrVariant: '2026/2027 (WHO/UE trójwalentna)',
      documentDateInSection10: '06/2026',
      sourceCheckStatus: 'verified_with_metadata_gap',
      technicalNotes:
        'Bezpośredni endpoint /characteristic zwraca aktualny PDF 2026/2027 (10 str., OLI-2026-08-18.pdf), natomiast indeks /search/public RPL utrzymuje nieaktualny opis 2024/2025 oraz flagę hasDownloadableMaterials=false.',
    },
    {
      productKey: 'vaxigrip_2026_2027',
      productName: 'Vaxigrip, zawiesina do wstrzykiwań w ampułko-strzykawce',
      relatedProcedureIds: ['pso-rec-influenza-1'],
      rplOrEmaId: 'RPL ID 50032',
      officialSourceUrl:
        'https://rejestrymedyczne.ezdrowie.gov.pl/api/rpl/medicinal-products/50032/characteristic',
      httpStatus: 200,
      contentDispositionOrLastModified:
        'attachment; filename="Charakterystyka-50032-2026-08-10-27025/OLI-2026-08-12.pdf"',
      fileSizeBytes: 600348,
      fileSha256: 'ff3f12a3aef271436f12cc19fa9bf8e9d3ac9f03e151bbaafb2f7bf61c6038dc',
      pageCount: 22,
      marketingAuthorizationHolder: 'Sanofi Winthrop Industrie (Gentilly, Francja)',
      authorizationNumber: '28778',
      seasonOrVariant: '2026/2027 (WHO/UE trójwalentna)',
      documentDateInSection10: '08/2026',
      sourceCheckStatus: 'verified_with_metadata_gap',
      technicalNotes:
        'Bezpośredni endpoint /characteristic zwraca aktualny PDF 2026/2027 (22 str., OLI-2026-08-12.pdf); indeks /search/public wykazuje hasDownloadableMaterials=false mimo dostępności pliku.',
    },
    {
      productKey: 'spikevax_xfg',
      productName:
        'Spikevax XFG (0,1 mg/ml fiolka; 50 µg / 0,5 ml PFS; 25 µg / 0,25 ml PFS)',
      relatedProcedureIds: ['pso-rec-covid-pediatric'],
      rplOrEmaId: 'EMA EPAR (CEN; RPL CEN 54306/54308/54456 HTTP 400)',
      officialSourceUrl:
        'https://www.ema.europa.eu/pl/documents/product-information/spikevax-epar-product-information_pl.pdf',
      httpStatus: 200,
      contentDispositionOrLastModified: 'Last-Modified: Thu, 29 Oct 2026 11:47:30 GMT',
      fileSizeBytes: 1878146,
      fileSha256: 'bd1ba23ca4e25a3f7353f01e3be889dd8962c471ad257e7beefd50351fdb6fec',
      pageCount: 177,
      marketingAuthorizationHolder: 'MODERNA BIOTECH SPAIN, S.L. (Madryt, Hiszpania)',
      authorizationNumber: 'EU/1/20/1507/041–050',
      seasonOrVariant: 'XFG (sezon 2026/2027; Aneks I str. 64–92)',
      documentDateInSection10: null,
      sourceCheckStatus: 'verified_with_metadata_gap',
      technicalNotes:
        'Oficjalny polski EPAR EMA pobrany bezbłędnie (Aneks I dla Spikevax XFG obejmuje strony 64–92 ze 177). Brak wpisanej daty w pkt 10 Aneksu I (str. 92), brak GTIN w PDF EPAR, a centralne rekordy RPL zwracają HTTP 400 na /characteristic.',
    },
    {
      productKey: 'bcg_10',
      productName:
        'Szczepionka przeciwgruźlicza BCG 10 (proszek i rozpuszczalnik do sporządzania zawiesiny do wstrzykiwań śródskórnych)',
      relatedProcedureIds: ['pso-bcg-0'],
      rplOrEmaId: 'RPL ID 19535',
      officialSourceUrl:
        'https://rejestrymedyczne.ezdrowie.gov.pl/api/rpl/medicinal-products/19535/characteristic',
      httpStatus: 200,
      contentDispositionOrLastModified:
        'attachment; filename="Charakterystyka-19535-2023-11-28-15535/OLI-2023-12-08.pdf"',
      fileSizeBytes: 163805,
      fileSha256: '51cdd82650908b41bc56b015671724b1c8dfce7bc3628c61b8d364f893768344',
      pageCount: 7,
      marketingAuthorizationHolder: 'Synthaverse S.A. (Lublin, Polska)',
      authorizationNumber: 'R/0210',
      seasonOrVariant: 'Podszczep brazylijski Moreau (10-dawkowa)',
      documentDateInSection10: null,
      sourceCheckStatus: 'verified_with_metadata_gap',
      technicalNotes:
        'PDF ChPL z RPL pobrany prawidłowo (7 str., OLI-2023-12-08.pdf). Punkt 10 dokumentu na str. 7 jest pusty (status not_present_in_document).',
    },
  ],

  contentAnalysisSheets: [
    {
      productKey: 'influvac_2026_2027',
      productName: 'Influvac (RPL ID 49462)',
      relatedProcedureIds: ['pso-rec-influenza-1'],
      preparatoryAuditorLabel:
        'Ekstrakcja przygotowawcza VaxNurse Stage-1 (PROMPT 25) — oczekuje na zatwierdzenie kompetentnego audytora klinicznego',
      targetStatusAfterStage1: 'pending_content_audit',
      entries: [
        {
          sectionNumber: '1',
          subpointNumber: '1',
          pageRef: 'PDF str. 1',
          conciseSummary:
            'Influvac, zawiesina do wstrzykiwań w ampułko-strzykawce — inaktywowana szczepionka przeciw grypie z antygenem powierzchniowym.',
          checkOutcome: 'ok',
          discrepancyOrAmbiguity: null,
          sourceExcerptRef: 'RPL 49462 ChPL, pkt 1, str. 1',
        },
        {
          sectionNumber: '2',
          subpointNumber: '2',
          pageRef: 'PDF str. 1',
          conciseSummary:
            'Skład trójwalentny WHO/UE 2026/2027: A/Missouri/11/2025 (H1N1, IVR-279), A/Darwin/1454/2025 (H3N2, A/Michigan/105/2025 SAN-049A), B/Tokyo/EIS13-175/2025 (po 15 µg HA / 0,5 ml); pozostałości: jaja/albumina, formaldehyd, bromek cetylotrimetyloamoniowy, polisorbat 80, gentamycyna.',
          checkOutcome: 'ambiguity_flagged',
          discrepancyOrAmbiguity:
            'Rozbieżność między indeksem /search/public RPL (opis 2024/2025) a pobranym plikiem PDF ChPL (skład 2026/2027); dodatkowo drobna odmienność pisowni CTAB między pkt 2 a pkt 4.3.',
          sourceExcerptRef: 'RPL 49462 ChPL, pkt 2, str. 1',
        },
        {
          sectionNumber: '3',
          subpointNumber: '3',
          pageRef: 'PDF str. 1',
          conciseSummary:
            'Zawiesina do wstrzykiwań w ampułko-strzykawce; bezbarwna, klarowna ciecz.',
          checkOutcome: 'ok',
          discrepancyOrAmbiguity: null,
          sourceExcerptRef: 'RPL 49462 ChPL, pkt 3, str. 1',
        },
        {
          sectionNumber: '4',
          subpointNumber: '4.1',
          pageRef: 'PDF str. 1',
          conciseSummary:
            'Czynne uodpornienie dorosłych i dzieci od ukończenia 6. m.ż. zgodnie z oficjalnymi zaleceniami.',
          checkOutcome: 'ok',
          discrepancyOrAmbiguity: null,
          sourceExcerptRef: 'RPL 49462 ChPL, pkt 4.1, str. 1',
        },
        {
          sectionNumber: '4',
          subpointNumber: '4.2',
          pageRef: 'PDF str. 1–2',
          conciseSummary:
            'Dawka 0,5 ml (dorośli i dzieci od ukończenia 6. m.ż.); dzieci <9 lat nieszczepione wcześniej — 2. dawka po >=4 tyg.; brak danych <6 m.ż. Podanie i.m. lub głęboko s.c. (6–35 m.ż. udo lub m. naramienny, >=36 m.ż. m. naramienny).',
          checkOutcome: 'ambiguity_flagged',
          discrepancyOrAmbiguity:
            'Sformułowanie wieku dzieci „od ukończenia 6. m.ż. do ukończenia 17. r.ż.” w pkt 4.2 wobec zakresu „6 mies.–17 lat” i dorosłych >=18 lat w pkt 4.8 (wymaga potwierdzenia redakcji granicy wieku 17–18 lat względem definicji pediatrycznej <18 r.ż.).',
          sourceExcerptRef: 'RPL 49462 ChPL, pkt 4.2, str. 1–2',
        },
        {
          sectionNumber: '4',
          subpointNumber: '4.3',
          pageRef: 'PDF str. 2',
          conciseSummary:
            'Nadwrażliwość na substancje czynne, pomocnicze (pkt 6.1) lub pozostałości z produkcji: jaja kurze, formaldehyd, bromek trimetylocetyloaminowy, polisorbat 80, gentamycyna.',
          checkOutcome: 'ambiguity_flagged',
          discrepancyOrAmbiguity:
            'Wariant nazewnictwa „bromek trimetylocetyloaminowy” w pkt 4.3 względem „bromek cetylotrimetyloamoniowy” w pkt 2.',
          sourceExcerptRef: 'RPL 49462 ChPL, pkt 4.3, str. 2',
        },
        {
          sectionNumber: '4',
          subpointNumber: '4.4',
          pageRef: 'PDF str. 2–3',
          conciseSummary:
            'Identyfikowalność serii, gotowość na anafilaksję, odroczenie przy chorobie z gorączką / ostrym zakażeniu, zakaz i.v., ostrożność w trombocytopenii/zaburzeniach krzepnięcia, omdlenia wazowagalne, słabsza odpowiedź w immunosupresji, produkt wolny od sodu i potasu.',
          checkOutcome: 'ok',
          discrepancyOrAmbiguity: null,
          sourceExcerptRef: 'RPL 49462 ChPL, pkt 4.4, str. 2–3',
        },
        {
          sectionNumber: '4',
          subpointNumber: '4.5',
          pageRef: 'PDF str. 3',
          conciseSummary:
            'Brak badań interakcji; możliwe podanie jednoczesne w różne kończyny (ryzyko nasilenia NOP); osłabiona odpowiedź przy leczeniu immunosupresyjnym; przejściowe fałszywie dodatnie ELISA (HIV1, WZW C, HTLV1 — weryfikacja Western Blot).',
          checkOutcome: 'ok',
          discrepancyOrAmbiguity: null,
          sourceExcerptRef: 'RPL 49462 ChPL, pkt 4.5, str. 3',
        },
        {
          sectionNumber: '4',
          subpointNumber: '4.6',
          pageRef: 'PDF str. 3',
          conciseSummary:
            'Ciąża: inaktywowane szczepionki można stosować we wszystkich okresach (więcej danych dla II i III trymestru); karmienie piersią: dozwolone; płodność: brak danych u ludzi.',
          checkOutcome: 'ok',
          discrepancyOrAmbiguity: null,
          sourceExcerptRef: 'RPL 49462 ChPL, pkt 4.6, str. 3',
        },
        {
          sectionNumber: '4',
          subpointNumber: '4.7',
          pageRef: 'PDF str. 3',
          conciseSummary:
            'Brak wpływu lub nieistotny wpływ na zdolność prowadzenia pojazdów i obsługiwania maszyn.',
          checkOutcome: 'ok',
          discrepancyOrAmbiguity: null,
          sourceExcerptRef: 'RPL 49462 ChPL, pkt 4.7, str. 3',
        },
        {
          sectionNumber: '4',
          subpointNumber: '4.8',
          pageRef: 'PDF str. 3–6',
          conciseSummary:
            'Profil z 3 badań (dorośli >=18 lat, dzieci 3–17 lat, 6–35 m.ż.) obejmujących Influvac i Influvac Tetra; najczęstszy ból w miejscu podania; zgłaszanie NOP do URPL (smz.ezdrowie.gov.pl).',
          checkOutcome: 'extrapolation_note',
          discrepancyOrAmbiguity:
            'Bezpieczeństwo w grupach pediatrycznych częściowo przeniesione na bazie ekstrapolacji z 4-walentnej Influvac Tetra (INFQ3003); występują drobne literówki redakcyjne ChPL.',
          sourceExcerptRef: 'RPL 49462 ChPL, pkt 4.8, str. 3–6',
        },
        {
          sectionNumber: '4',
          subpointNumber: '4.9',
          pageRef: 'PDF str. 6',
          conciseSummary:
            'Mało prawdopodobne, aby przedawkowanie wywołało niekorzystne działania.',
          checkOutcome: 'ok',
          discrepancyOrAmbiguity: null,
          sourceExcerptRef: 'RPL 49462 ChPL, pkt 4.9, str. 6',
        },
        {
          sectionNumber: '5',
          subpointNumber: '5',
          pageRef: 'PDF str. 6–9',
          conciseSummary:
            '5.1 ATC J07BB02; przeciwciała HI w 2–3 tyg., odporność zwykle 6–12 mies.; skuteczność 6–35 m.ż. z badania INFQ3003 Influvac Tetra (54% każda grypa / 68% dopasowane szczepy) oraz immunogenność INFQ3001/INFQ3002; 5.2 nie dotyczy; 5.3 brak szczególnego zagrożenia.',
          checkOutcome: 'extrapolation_note',
          discrepancyOrAmbiguity:
            'Dane skuteczności klinicznej u dzieci 6–35 m.ż. opierają się na ekstrapolacji z preparatu 4-walentnego Influvac Tetra — do potwierdzenia przez audytora klinicznego.',
          sourceExcerptRef: 'RPL 49462 ChPL, pkt 5.1–5.3, str. 6–9',
        },
        {
          sectionNumber: '6',
          subpointNumber: '6',
          pageRef: 'PDF str. 9–10',
          conciseSummary:
            '6.1 sole buforowe i woda do wstrz.; 6.2 nie mieszać; 6.3 ważność 1 rok; 6.4 2°C–8°C, nie zamrażać, chronić przed światłem; 6.5 amp.-strz. 0,5 ml op. po 1 lub 10; 6.6 przed podaniem temp. pokojowa i wstrząsnąć.',
          checkOutcome: 'ok',
          discrepancyOrAmbiguity: null,
          sourceExcerptRef: 'RPL 49462 ChPL, pkt 6.1–6.6, str. 9–10',
        },
        {
          sectionNumber: '7',
          subpointNumber: '7',
          pageRef: 'PDF str. 10',
          conciseSummary: 'Podmiot odpowiedzialny: Viatris Healthcare Limited (Dublin, Irlandia).',
          checkOutcome: 'ok',
          discrepancyOrAmbiguity: null,
          sourceExcerptRef: 'RPL 49462 ChPL, pkt 7, str. 10',
        },
        {
          sectionNumber: '8',
          subpointNumber: '8',
          pageRef: 'PDF str. 10',
          conciseSummary: 'Numer pozwolenia na dopuszczenie do obrotu: 28478.',
          checkOutcome: 'ok',
          discrepancyOrAmbiguity: null,
          sourceExcerptRef: 'RPL 49462 ChPL, pkt 8, str. 10',
        },
        {
          sectionNumber: '9',
          subpointNumber: '9',
          pageRef: 'PDF str. 10',
          conciseSummary: 'Data wydania pierwszego pozwolenia: 26 lipiec 2024 r.',
          checkOutcome: 'ok',
          discrepancyOrAmbiguity: null,
          sourceExcerptRef: 'RPL 49462 ChPL, pkt 9, str. 10',
        },
        {
          sectionNumber: '10',
          subpointNumber: '10',
          pageRef: 'PDF str. 10',
          conciseSummary: 'Data zatwierdzenia lub częściowej zmiany tekstu ChPL: 06/2026.',
          checkOutcome: 'ok',
          discrepancyOrAmbiguity: null,
          sourceExcerptRef: 'RPL 49462 ChPL, pkt 10, str. 10',
        },
      ],
    },

    {
      productKey: 'vaxigrip_2026_2027',
      productName: 'Vaxigrip (RPL ID 50032)',
      relatedProcedureIds: ['pso-rec-influenza-1'],
      preparatoryAuditorLabel:
        'Ekstrakcja przygotowawcza VaxNurse Stage-1 (PROMPT 25) — oczekuje na zatwierdzenie kompetentnego audytora klinicznego',
      targetStatusAfterStage1: 'pending_content_audit',
      entries: [
        {
          sectionNumber: '1',
          subpointNumber: '1',
          pageRef: 'PDF str. 2 (str. 1 tytułowa)',
          conciseSummary:
            'Vaxigrip, zawiesina do wstrzykiwań w ampułko-strzykawce — trójwalentna, inaktywowana szczepionka z rozszczepionym wirionem.',
          checkOutcome: 'ok',
          discrepancyOrAmbiguity: null,
          sourceExcerptRef: 'RPL 50032 ChPL, pkt 1, str. 2',
        },
        {
          sectionNumber: '2',
          subpointNumber: '2',
          pageRef: 'PDF str. 2',
          conciseSummary:
            'Skład WHO/UE 2026/2027: A/Missouri/11/2025 (H1N1, A/Switzerland/6849/2025, IVR-278), A/Darwin/1454/2025 (H3N2, A/Michigan/105/2025, SAN-049A), B/Tokyo/EIS13-175/2025 (po 15 µg HA / 0,5 ml); pozostałości: jaja/albumina, neomycyna, formaldehyd, octoxynol-9.',
          checkOutcome: 'ok',
          discrepancyOrAmbiguity: null,
          sourceExcerptRef: 'RPL 50032 ChPL, pkt 2, str. 2',
        },
        {
          sectionNumber: '3',
          subpointNumber: '3',
          pageRef: 'PDF str. 2',
          conciseSummary: 'Zawiesina do wstrzykiwań — bezbarwna, opalizująca ciecz.',
          checkOutcome: 'ok',
          discrepancyOrAmbiguity: null,
          sourceExcerptRef: 'RPL 50032 ChPL, pkt 3, str. 2',
        },
        {
          sectionNumber: '4',
          subpointNumber: '4.1',
          pageRef: 'PDF str. 2',
          conciseSummary:
            'Dwa wskazania: czynne uodpornienie dorosłych (w tym kobiet w ciąży) i dzieci od ukończenia 6. m.ż. oraz bierne uodpornienie niemowląt <6 m.ż. po szczepieniu kobiety w ciąży.',
          checkOutcome: 'ok',
          discrepancyOrAmbiguity: null,
          sourceExcerptRef: 'RPL 50032 ChPL, pkt 4.1, str. 2',
        },
        {
          sectionNumber: '4',
          subpointNumber: '4.2',
          pageRef: 'PDF str. 2–3',
          conciseSummary:
            'Dorośli i dzieci 0,5 ml; <9 lat nieszczepione wcześniej — 2. dawka po >=4 tyg.; <6 m.ż. czynne nieokreślone (bierna ochrona przez szczepienie ciężarnej 0,5 ml). Podanie preferowanie i.m. lub s.c.',
          checkOutcome: 'ambiguity_flagged',
          discrepancyOrAmbiguity:
            'Analogiczny zapis redakcyjny jak w Influvac („od ukończenia 6. m.ż. do ukończenia 17. r.ż.” w pkt 4.2 vs pkt 4.8 „6 m.ż.–17 lat” i dorośli >=18 lat) — do oceny audytora klinicznego względem przedziału 17–18 r.ż.',
          sourceExcerptRef: 'RPL 50032 ChPL, pkt 4.2, str. 2–3',
        },
        {
          sectionNumber: '4',
          subpointNumber: '4.3',
          pageRef: 'PDF str. 3',
          conciseSummary:
            'Nadwrażliwość na substancje czynne/pomocnicze lub śladowe: jaja (albumina/białka), neomycyna, formaldehyd, octoxynol-9 (odmienny profil antybiotykowy/detergentowy niż Influvac z gentamycyną/CTAB/polisorbatem 80).',
          checkOutcome: 'ambiguity_flagged',
          discrepancyOrAmbiguity:
            'Istotna różnica alergenów śladowych względem Influvac (neomycyna + octoxynol-9 vs gentamycyna + CTAB + polisorbat 80) wymagająca uwydatnienia przy zamienności preparatów u pacjentów z alergią.',
          sourceExcerptRef: 'RPL 50032 ChPL, pkt 4.3, str. 3',
        },
        {
          sectionNumber: '4',
          subpointNumber: '4.4',
          pageRef: 'PDF str. 3–4',
          conciseSummary:
            'Identyfikowalność, gotowość na anafilaksję, odroczenie przy ostrej gorączce, zakaz i.v., ostrożność w trombocytopenii/zaburzeniach krzepnięcia, omdlenia, słabsza odpowiedź w niedoborach odporności, nie wszystkie niemowlęta <6 m.ż. chronione biernie, wolny od K i Na.',
          checkOutcome: 'ok',
          discrepancyOrAmbiguity: null,
          sourceExcerptRef: 'RPL 50032 ChPL, pkt 4.4, str. 3–4',
        },
        {
          sectionNumber: '4',
          subpointNumber: '4.5',
          pageRef: 'PDF str. 4',
          conciseSummary:
            'Możliwe jednoczesne podanie w różne miejsca osobnymi strzykawkami (dane m.in. dla pneumokokowej polisacharydowej, Tdap-IPV Adacel Polio, półpaścowej); osłabiona odpowiedź w leczeniu immunosupresyjnym.',
          checkOutcome: 'ok',
          discrepancyOrAmbiguity: null,
          sourceExcerptRef: 'RPL 50032 ChPL, pkt 4.5, str. 4',
        },
        {
          sectionNumber: '4',
          subpointNumber: '4.6',
          pageRef: 'PDF str. 4–5',
          conciseSummary:
            'Ciąża: zalecana do podania we wszystkich okresach (dane kliniczne z RPA, Nepalu, Mali oraz badania na zwierzętach ekstrapolowane z VaxigripTetra 60 -> 45 µg); karmienie piersią: można stosować; płodność: brak danych u ludzi.',
          checkOutcome: 'extrapolation_note',
          discrepancyOrAmbiguity:
            'Niektóre badania przedkliniczne ciąży/płodności oparto na ekstrapolacji z 4-walentnej VaxigripTetra.',
          sourceExcerptRef: 'RPL 50032 ChPL, pkt 4.6, str. 4–5',
        },
        {
          sectionNumber: '4',
          subpointNumber: '4.7',
          pageRef: 'PDF str. 5',
          conciseSummary: 'Brak wpływu lub nieistotny wpływ na prowadzenie pojazdów/maszyn.',
          checkOutcome: 'ok',
          discrepancyOrAmbiguity: null,
          sourceExcerptRef: 'RPL 50032 ChPL, pkt 4.7, str. 5',
        },
        {
          sectionNumber: '4',
          subpointNumber: '4.8',
          pageRef: 'PDF str. 5–10',
          conciseSummary:
            '46 badań (~17 900 osób) Vaxigrip/VaxigripTetra; Tabela 1 dorośli i starsi, Tabela 2 dzieci 6 m.ż.–17 lat; ciąża (RPA, Mali, Finlandia); zgłaszanie NOP do URPL.',
          checkOutcome: 'ambiguity_flagged',
          discrepancyOrAmbiguity:
            'Drobna rozbieżność redakcyjna podgrup wieku w Tabeli 2 („24–35 miesięcy” na str. 7 wobec „23–35 miesięcy” na str. 8) oraz zbiorcze zestawienie bezpieczeństwa Vaxigrip + VaxigripTetra.',
          sourceExcerptRef: 'RPL 50032 ChPL, pkt 4.8, str. 5–10',
        },
        {
          sectionNumber: '4',
          subpointNumber: '4.9',
          pageRef: 'PDF str. 10',
          conciseSummary:
            'Zgłaszano przedawkowanie po podaniu większej dawki niż zalecana; profil NOP spójny z pkt 4.8.',
          checkOutcome: 'ok',
          discrepancyOrAmbiguity: null,
          sourceExcerptRef: 'RPL 50032 ChPL, pkt 4.9, str. 10',
        },
        {
          sectionNumber: '5',
          subpointNumber: '5',
          pageRef: 'PDF str. 10–19',
          conciseSummary:
            '5.1 ATC J07BB02; skuteczność 6–35 m.ż. i 3–8 lat ekstrapolowana z VaxigripTetra (Tabela 5: 52,03%/69,33%), brak badań skuteczności 9–17 lat/dorośli, badania IV fazy w ciąży (Tabele 3–4, ochrona bierna <6 m.ż.), immunogenność Tabele 6–9; 5.2 nie dotyczy; 5.3 z VaxigripTetra.',
          checkOutcome: 'extrapolation_note',
          discrepancyOrAmbiguity:
            'Skuteczność kliniczna w pediatrii i część danych przedklinicznych opierają się na ekstrapolacji z VaxigripTetra; brak badań skuteczności dla 9–17 lat.',
          sourceExcerptRef: 'RPL 50032 ChPL, pkt 5.1–5.3, str. 10–19',
        },
        {
          sectionNumber: '6',
          subpointNumber: '6',
          pageRef: 'PDF str. 19–22',
          conciseSummary:
            '6.1 sole buforowe i woda do wstrz.; 6.2 nie mieszać; 6.3 ważność 1 rok; 6.4 2°C–8°C, dopuszczona stabilność 72 godz. w temp. do 25°C±2°C przy czasowych wahaniach; 6.5 opakowania 1 lub 10 w kilku konfiguracjach igły/Luer Lock; 6.6 instrukcja przygotowania.',
          checkOutcome: 'ambiguity_flagged',
          discrepancyOrAmbiguity:
            'Pozostałość nietłumaczonego fragmentu „Step 5” na str. 21 w polskiej ChPL; istotna praktycznie stabilność 72 h do 25°C wymaga potwierdzenia audytora przed włączeniem do reguł łańcucha chłodniczego.',
          sourceExcerptRef: 'RPL 50032 ChPL, pkt 6.1–6.6, str. 19–22',
        },
        {
          sectionNumber: '7',
          subpointNumber: '7',
          pageRef: 'PDF str. 22',
          conciseSummary: 'Podmiot odpowiedzialny: Sanofi Winthrop Industrie (Gentilly, Francja).',
          checkOutcome: 'ok',
          discrepancyOrAmbiguity: null,
          sourceExcerptRef: 'RPL 50032 ChPL, pkt 7, str. 22',
        },
        {
          sectionNumber: '8',
          subpointNumber: '8',
          pageRef: 'PDF str. 22',
          conciseSummary: 'Numer pozwolenia na dopuszczenie do obrotu: 28778.',
          checkOutcome: 'ok',
          discrepancyOrAmbiguity: null,
          sourceExcerptRef: 'RPL 50032 ChPL, pkt 8, str. 22',
        },
        {
          sectionNumber: '9',
          subpointNumber: '9',
          pageRef: 'PDF str. 22',
          conciseSummary: 'Data wydania pierwszego pozwolenia: 20.12.2024.',
          checkOutcome: 'ok',
          discrepancyOrAmbiguity: null,
          sourceExcerptRef: 'RPL 50032 ChPL, pkt 9, str. 22',
        },
        {
          sectionNumber: '10',
          subpointNumber: '10',
          pageRef: 'PDF str. 22',
          conciseSummary: 'Data zatwierdzenia lub częściowej zmiany tekstu ChPL: 08/2026.',
          checkOutcome: 'ok',
          discrepancyOrAmbiguity: null,
          sourceExcerptRef: 'RPL 50032 ChPL, pkt 10, str. 22',
        },
      ],
    },

    {
      productKey: 'spikevax_xfg',
      productName: 'Spikevax XFG (EMA EPAR PL, Aneks I str. 64–92)',
      relatedProcedureIds: ['pso-rec-covid-pediatric'],
      preparatoryAuditorLabel:
        'Ekstrakcja przygotowawcza VaxNurse Stage-1 (PROMPT 25) — oczekuje na zatwierdzenie kompetentnego audytora klinicznego',
      targetStatusAfterStage1: 'pending_content_audit',
      entries: [
        {
          sectionNumber: '1',
          subpointNumber: '1',
          pageRef: 'EPAR PL str. 64',
          conciseSummary:
            'Trzy postacie pod wspólnym Aneksem I: Spikevax XFG 0,1 mg/ml dyspersja do wstrzykiwań (fiolka), 50 µg dyspersja w PFS, 25 µg dyspersja w PFS; produkt dodatkowo monitorowany (czarny trójkąt).',
          checkOutcome: 'ok',
          discrepancyOrAmbiguity: null,
          sourceExcerptRef: 'EMA EPAR PL Spikevax XFG, pkt 1, str. 64',
        },
        {
          sectionNumber: '2',
          subpointNumber: '2',
          pageRef: 'EPAR PL str. 64–65',
          conciseSummary:
            'Tabela 1: fiolka wielodawkowa 2,5 ml (5 x 0,5 ml lub 10 x 0,25 ml mRNA XFG); PFS 0,5 ml (50 µg mRNA XFG); PFS 0,25 ml (25 µg mRNA XFG).',
          checkOutcome: 'ambiguity_flagged',
          discrepancyOrAmbiguity:
            'W EPAR występują jednocześnie fiolki 2,5 ml oraz PFS 0,5 ml i 0,25 ml, natomiast w Polsce Komunikat nr 39 MZ i dane RARS dokumentują konkretne GTIN dla dawek 50 µg (fiolka 10 dawek wg RARS) oraz 25 µg PFS (1 dawka) — brak kodów GTIN w samym PDF EMA.',
          sourceExcerptRef: 'EMA EPAR PL Spikevax XFG, pkt 2, str. 64–65',
        },
        {
          sectionNumber: '3',
          subpointNumber: '3',
          pageRef: 'EPAR PL str. 65',
          conciseSummary:
            'Dyspersja do wstrzykiwań w kolorze białym do białawego (pH 7,1–7,8).',
          checkOutcome: 'ok',
          discrepancyOrAmbiguity: null,
          sourceExcerptRef: 'EMA EPAR PL Spikevax XFG, pkt 3, str. 65',
        },
        {
          sectionNumber: '4',
          subpointNumber: '4.1',
          pageRef: 'EPAR PL str. 65',
          conciseSummary:
            'Czynne uodpornienie osób w wieku >=6 miesięcy w celu zapobiegania COVID-19 zgodnie z oficjalnymi zaleceniami.',
          checkOutcome: 'ok',
          discrepancyOrAmbiguity: null,
          sourceExcerptRef: 'EMA EPAR PL Spikevax XFG, pkt 4.1, str. 65',
        },
        {
          sectionNumber: '4',
          subpointNumber: '4.2',
          pageRef: 'EPAR PL str. 65–66',
          conciseSummary:
            'Tabela 2 (ogólna) i Tabela 3 (poważnie obniżona odporność): 6 mies.–4 lata bez szczepienia/zakażenia 2 x 0,25 ml (odstęp 28 dni; 3. dawka przy ciężkim niedoborze >=28 dni), z wywiadem 1 x 0,25 ml (>=3 mies., dodatkowa >=2 mies.); 5–11 lat 1 x 0,25 ml; >=12 lat 1 x 0,5 ml; zakaz użycia PFS 0,5 ml do podania 0,25 ml; wyłącznie i.m.',
          checkOutcome: 'ambiguity_flagged',
          discrepancyOrAmbiguity:
            'Tekst pkt 4.2 na str. 66 wskazuje ogólnie jako miejsce podania „mięsień naramienny” bez wyodrębnienia uda u niemowląt 6–23 m.ż.; dodatkowo wymagane jest porównanie przez audytora schematu ChPL z aktualnym polskim Komunikatem MZ nr 39 dla niedoborów odporności.',
          sourceExcerptRef: 'EMA EPAR PL Spikevax XFG, pkt 4.2, str. 65–66',
        },
        {
          sectionNumber: '4',
          subpointNumber: '4.3',
          pageRef: 'EPAR PL str. 67',
          conciseSummary:
            'Nadwrażliwość na substancję czynną lub którąkolwiek substancję pomocniczą (np. PEG2000-DMG, SM-102).',
          checkOutcome: 'ok',
          discrepancyOrAmbiguity: null,
          sourceExcerptRef: 'EMA EPAR PL Spikevax XFG, pkt 4.3, str. 67',
        },
        {
          sectionNumber: '4',
          subpointNumber: '4.4',
          pageRef: 'EPAR PL str. 67–68',
          conciseSummary:
            'Identyfikowalność, obserwacja >=15 min i zakaz kolejnych dawek po anafilaksji po Spikevax, ryzyko zapalenia mięśnia sercowego/osierdzia (gł. młodzi mężczyźni, w 14 dni, częściej po 2. dawce), omdlenia, odroczenie w ciężkiej gorączce (bez odraczania w łagodnym zakażeniu), zaburzenia krzepnięcia, zaostrzenia CLS, wolny od sodu.',
          checkOutcome: 'ok',
          discrepancyOrAmbiguity: null,
          sourceExcerptRef: 'EMA EPAR PL Spikevax XFG, pkt 4.4, str. 67–68',
        },
        {
          sectionNumber: '4',
          subpointNumber: '4.5',
          pageRef: 'EPAR PL str. 68',
          conciseSummary:
            'Możliwe jednoczesne podanie ze szczepionkami przeciw grypie (standardowymi i wysokodawkowymi) oraz podjednostkową przeciw półpaścowi w różne miejsca.',
          checkOutcome: 'ambiguity_flagged',
          discrepancyOrAmbiguity:
            'Brak w ChPL danych dotyczących koadministracji Spikevax XFG z rutynowymi szczepionkami pediatrycznymi PSO (do oceny audytora klinicznego w zestawieniu z Komunikatem MZ).',
          sourceExcerptRef: 'EMA EPAR PL Spikevax XFG, pkt 4.5, str. 68',
        },
        {
          sectionNumber: '4',
          subpointNumber: '4.6',
          pageRef: 'EPAR PL str. 68–69',
          conciseSummary:
            'Ciąża: można stosować (dane obserwacyjne bez sygnału teratogenności); karmienie piersią: można stosować (brak danych swoistych dla XFG, minimalna ekspozycja); płodność: brak toksyczności reprodukcyjnej w badaniach na zwierzętach.',
          checkOutcome: 'extrapolation_note',
          discrepancyOrAmbiguity:
            'Dane ciążowe i laktacyjne oparte na wcześniejszych wariantach szczepionki (brak badań swoistych dla XFG).',
          sourceExcerptRef: 'EMA EPAR PL Spikevax XFG, pkt 4.6, str. 68–69',
        },
        {
          sectionNumber: '4',
          subpointNumber: '4.7',
          pageRef: 'EPAR PL str. 69',
          conciseSummary:
            'Brak lub nieistotny wpływ, z zastrzeżeniem że przejściowe NOP z pkt 4.8 mogą tymczasowo zaburzać zdolność prowadzenia/obsługi maszyn.',
          checkOutcome: 'ok',
          discrepancyOrAmbiguity: null,
          sourceExcerptRef: 'EMA EPAR PL Spikevax XFG, pkt 4.7, str. 69',
        },
        {
          sectionNumber: '4',
          subpointNumber: '4.8',
          pageRef: 'EPAR PL str. 69–74',
          conciseSummary:
            'Dane bezpieczeństwa dla >=18 lat, 12–17 lat, 6–11 lat, 6 mies.–5 lat na podstawie Spikevax wyjściowej oraz BA.1, BA.4-5 i XBB.1.5; Tabela 4 MedDRA >=6 mies.; zapadalność na zapalenie mięśnia sercowego 1,316–1,88 / 10 000 u młodych mężczyzn.',
          checkOutcome: 'extrapolation_note',
          discrepancyOrAmbiguity:
            'Brak dedykowanych badań klinicznych reaktogenności dla samego wariantu XFG — profil bezpieczeństwa ekstrapolowany ze szczepionki wyjściowej i adaptowanych (BA.1, BA.4-5, XBB.1.5).',
          sourceExcerptRef: 'EMA EPAR PL Spikevax XFG, pkt 4.8, str. 69–74',
        },
        {
          sectionNumber: '4',
          subpointNumber: '4.9',
          pageRef: 'EPAR PL str. 74',
          conciseSummary:
            'W razie przedawkowania zaleca się monitorowanie czynności życiowych i ewentualne leczenie objawowe.',
          checkOutcome: 'ok',
          discrepancyOrAmbiguity: null,
          sourceExcerptRef: 'EMA EPAR PL Spikevax XFG, pkt 4.9, str. 74',
        },
        {
          sectionNumber: '5',
          subpointNumber: '5',
          pageRef: 'EPAR PL str. 74–86',
          conciseSummary:
            '5.1 ATC J07BN01; badania kliniczne szczepionki wyjściowej oraz BA.1, BA.4-5 i XBB.1.5 oraz odroczenie obowiązku EMA w wybranych podgrupach dzieci; 5.2 nie dotyczy; 5.3 badania przedkliniczne SM-102, brak badań rakotwórczości.',
          checkOutcome: 'extrapolation_note',
          discrepancyOrAmbiguity:
            'Skuteczność wariantu XFG nie była przedmiotem odrębnego badania skuteczności klinicznej z punktami końcowymi — wywodzona z immunogenności/skuteczności poprzednich wersji Spikevax.',
          sourceExcerptRef: 'EMA EPAR PL Spikevax XFG, pkt 5.1–5.3, str. 74–86',
        },
        {
          sectionNumber: '6',
          subpointNumber: '6',
          pageRef: 'EPAR PL str. 86–91',
          conciseSummary:
            '6.1 SM-102, cholesterol, DSPC, PEG2000-DMG, trometamol, sacharoza, woda; 6.2 nie mieszać/rozcieńczać; 6.3–6.4 zamrożony (-50°C..-15°C: 9 mies. + max 30 dni w 2°C–8°C lub 12 mies. + max 14 dni w 2°C–8°C), 8°C–25°C max 24 h, fiolka po przekłuciu 19 h; 6.5 fiolki i PFS; 6.6 nie wstrząsać.',
          checkOutcome: 'ambiguity_flagged',
          discrepancyOrAmbiguity:
            'Występują dwa warianty okresu ważności po rozmrożeniu w 2°C–8°C zależnie od czasu przechowywania w zamrożeniu (9 mies.+30 dni vs 12 mies.+14 dni) oraz brak igieł w opakowaniach PFS — do precyzyjnego rozdzielenia według konkretnej postaci handlowej i GTIN.',
          sourceExcerptRef: 'EMA EPAR PL Spikevax XFG, pkt 6.1–6.6, str. 86–91',
        },
        {
          sectionNumber: '7',
          subpointNumber: '7',
          pageRef: 'EPAR PL str. 92',
          conciseSummary: 'Podmiot odpowiedzialny: MODERNA BIOTECH SPAIN, S.L. (Madryt, Hiszpania).',
          checkOutcome: 'ok',
          discrepancyOrAmbiguity: null,
          sourceExcerptRef: 'EMA EPAR PL Spikevax XFG, pkt 7, str. 92',
        },
        {
          sectionNumber: '8',
          subpointNumber: '8',
          pageRef: 'EPAR PL str. 92',
          conciseSummary: 'Numery pozwolenia: EU/1/20/1507/041–050.',
          checkOutcome: 'ok',
          discrepancyOrAmbiguity: null,
          sourceExcerptRef: 'EMA EPAR PL Spikevax XFG, pkt 8, str. 92',
        },
        {
          sectionNumber: '9',
          subpointNumber: '9',
          pageRef: 'EPAR PL str. 92',
          conciseSummary:
            'Pierwsze pozwolenie: 6 stycznia 2021 r.; przedłużenie pozwolenia: 3 października 2022 r.',
          checkOutcome: 'ok',
          discrepancyOrAmbiguity: null,
          sourceExcerptRef: 'EMA EPAR PL Spikevax XFG, pkt 9, str. 92',
        },
        {
          sectionNumber: '10',
          subpointNumber: '10',
          pageRef: 'EPAR PL str. 92',
          conciseSummary:
            'Brak wpisanej daty rewizji tekstu w punkcie 10 Aneksu I (nagłówek obecny, treść daty pusta; portal EMA wskazuje Last updated 30/10/2026).',
          checkOutcome: 'missing_in_document',
          discrepancyOrAmbiguity:
            'Brak daty zatwierdzenia/zmiany tekstu bezpośrednio wewnątrz pkt 10 Aneksu I wymaga formalnego odnotowania statusu not_present_in_document.',
          sourceExcerptRef: 'EMA EPAR PL Spikevax XFG, pkt 10, str. 92',
        },
      ],
    },

    {
      productKey: 'bcg_10',
      productName: 'Szczepionka przeciwgruźlicza BCG 10 (RPL ID 19535)',
      relatedProcedureIds: ['pso-bcg-0'],
      preparatoryAuditorLabel:
        'Ekstrakcja przygotowawcza VaxNurse Stage-1 (PROMPT 25) — oczekuje na zatwierdzenie kompetentnego audytora klinicznego',
      targetStatusAfterStage1: 'pending_content_audit',
      entries: [
        {
          sectionNumber: '1',
          subpointNumber: '1',
          pageRef: 'PDF str. 1',
          conciseSummary:
            'Szczepionka przeciwgruźlicza BCG 10, proszek i rozpuszczalnik do sporządzania zawiesiny do wstrzykiwań śródskórnych.',
          checkOutcome: 'ok',
          discrepancyOrAmbiguity: null,
          sourceExcerptRef: 'RPL 19535 ChPL, pkt 1, str. 1',
        },
        {
          sectionNumber: '2',
          subpointNumber: '2',
          pageRef: 'PDF str. 1',
          conciseSummary:
            '1 dawka (0,1 ml) zawiera 50 µg żywych prątków BCG podszczepu brazylijskiego Moreau (150 000–600 000 żywych prątków); 1 ampułka/fiolka 0,5 mg stanowi preparat 10-dawkowy.',
          checkOutcome: 'ok',
          discrepancyOrAmbiguity: null,
          sourceExcerptRef: 'RPL 19535 ChPL, pkt 2, str. 1',
        },
        {
          sectionNumber: '3',
          subpointNumber: '3',
          pageRef: 'PDF str. 1',
          conciseSummary:
            'Proszek i rozpuszczalnik do sporządzania zawiesiny do wstrzykiwań śródskórnych (przed rozpuszczeniem proszek biały lub jasnokremowy).',
          checkOutcome: 'ok',
          discrepancyOrAmbiguity: null,
          sourceExcerptRef: 'RPL 19535 ChPL, pkt 3, str. 1',
        },
        {
          sectionNumber: '4',
          subpointNumber: '4.1',
          pageRef: 'PDF str. 1',
          conciseSummary:
            'Szczepienia obowiązkowe przeciw gruźlicy wg PSO MZ; szczepienie uzupełniające u dzieci niezaszczepionych po urodzeniu nie później niż do ukończenia 15. r.ż.; rewakcynacja nierekomendowana.',
          checkOutcome: 'ambiguity_flagged',
          discrepancyOrAmbiguity:
            'Zapis ChPL o szczepieniu uzupełniającym do ukończenia 15. r.ż. wymaga formalnego potwierdzenia spójności z aktualną strukturą części I.A, I.B i V PSO 2027 przez audytora klinicznego.',
          sourceExcerptRef: 'RPL 19535 ChPL, pkt 4.1, str. 1',
        },
        {
          sectionNumber: '4',
          subpointNumber: '4.2',
          pageRef: 'PDF str. 1–2',
          conciseSummary:
            'Rekonstytucja w 1 ml izotonicznego roztworu NaCl, dawka 0,1 ml wyłącznie śródskórnie strzykawką tuberkulinową przez przeszkolony personel, bąbel ok. 7 mm.',
          checkOutcome: 'ambiguity_flagged',
          discrepancyOrAmbiguity:
            'Wewnętrzna sprzeczność miejsca wstrzyknięcia w ChPL: str. 1 wskazuje „zewnętrzną 1/3 górną część lewego ramienia”, natomiast str. 2 cytuje WHO wskazując „środkową część okolicy mięśnia naramiennego lewej kończyny górnej” z ostrzeżeniem (powtórzonym w pkt 4.8 str. 4), że wstrzyknięcie w wyższą część ramienia zwiększa ryzyko keloidu.',
          sourceExcerptRef: 'RPL 19535 ChPL, pkt 4.2, str. 1–2',
        },
        {
          sectionNumber: '4',
          subpointNumber: '4.3',
          pageRef: 'PDF str. 2–3',
          conciseSummary:
            '14 przeciwwskazań (m.in. masa <2000 g, konieczność wykluczenia HIV u dziecka matki HIV+, wrodzone niedobory odporności, ciąża, przebyta gruźlica / próba RT23 >5 mm, noworodki matek leczonych anty-TNF-alfa w 3. trymestrze) oraz 4 stany odroczenia.',
          checkOutcome: 'ambiguity_flagged',
          discrepancyOrAmbiguity:
            'Rozbieżność redakcyjna między pkt 4.3 (anty-TNF-alfa w 3. trymestrze jako przeciwwskazanie) a pkt 4.4 (anty-TNF / przeciwciała IgG1 w ciąży jako sytuacja wymagająca odroczenia i decyzji lekarza).',
          sourceExcerptRef: 'RPL 19535 ChPL, pkt 4.3, str. 2–3',
        },
        {
          sectionNumber: '4',
          subpointNumber: '4.4',
          pageRef: 'PDF str. 3',
          conciseSummary:
            'Wyłącznie śródskórnie; monitorowanie oddechowe 48–72 h u bardzo niedojrzałych wcześniaków (<=28 t.c.) z powodu ryzyka bezdechu bez odraczania szczepienia; ocena odroczenia przy terapii anty-TNF/IgG1 u matki.',
          checkOutcome: 'ambiguity_flagged',
          discrepancyOrAmbiguity:
            'Wspólna relacja pkt 4.3 (bezwzględne przeciwwskazanie przy anty-TNF w 3. trymestrze) i pkt 4.4 (odroczenie przy lekach anty-TNF/IgG1 matki) wymaga interpretacji klinicznej audytora.',
          sourceExcerptRef: 'RPL 19535 ChPL, pkt 4.4, str. 3',
        },
        {
          sectionNumber: '4',
          subpointNumber: '4.5',
          pageRef: 'PDF str. 3',
          conciseSummary:
            'Możliwe podanie jednoczesne z innymi szczepionkami (poza lewym ramieniem); z innymi żywymi w różnym terminie >=4 tyg. odstępu; dowolny odstęp z inaktywowanymi; zakaz innych szczepień w lewe ramię przez min. 3 mies. po BCG.',
          checkOutcome: 'ok',
          discrepancyOrAmbiguity: null,
          sourceExcerptRef: 'RPL 19535 ChPL, pkt 4.5, str. 3',
        },
        {
          sectionNumber: '4',
          subpointNumber: '4.6',
          pageRef: 'PDF str. 3',
          conciseSummary:
            'Ciąża: nie stosować; karmienie piersią: nie stanowi przeciwwskazania.',
          checkOutcome: 'missing_in_document',
          discrepancyOrAmbiguity:
            'Sekcja 4.6 nie zawiera wydzielonego podrozdziału dotyczącego wpływu na płodność.',
          sourceExcerptRef: 'RPL 19535 ChPL, pkt 4.6, str. 3',
        },
        {
          sectionNumber: '4',
          subpointNumber: '4.7',
          pageRef: 'PDF str. 3',
          conciseSummary:
            'Brak wpływu lub nieistotny wpływ na zdolność prowadzenia pojazdów i obsługiwania maszyn.',
          checkOutcome: 'ok',
          discrepancyOrAmbiguity: null,
          sourceExcerptRef: 'RPL 19535 ChPL, pkt 4.7, str. 3',
        },
        {
          sectionNumber: '4',
          subpointNumber: '4.8',
          pageRef: 'PDF str. 3–5',
          conciseSummary:
            'Oczekiwana reakcja miejscowa (naciek/owrzodzenie gojące się do 3 mies., węzeł <=15 mm), powikłania złej techniki (>1 cm owrzodzenie, keloid), odczyn przyśpieszony 24–48 h, uogólnione zakażenie BCG (~2/1 000 000), bezdech <=28 t.c., tabela MedDRA (wszystkie pozycje częstość „Nieznana”), zgłaszanie do URPL.',
          checkOutcome: 'ambiguity_flagged',
          discrepancyOrAmbiguity:
            'Wszystkie częstości w tabeli MedDRA opisano jako „Nieznana” (poza opisowym szacunkiem w tekście); powtórzone ostrzeżenie o keloidzie przy zbyt wysokim podaniu wzmacnia niezgodność lokalizacyjną z pkt 4.2 str. 1.',
          sourceExcerptRef: 'RPL 19535 ChPL, pkt 4.8, str. 3–5',
        },
        {
          sectionNumber: '4',
          subpointNumber: '4.9',
          pageRef: 'PDF str. 5',
          conciseSummary:
            'Przedawkowanie zwiększa ryzyko ciężkich powikłań w obrębie węzłów chłonnych.',
          checkOutcome: 'ok',
          discrepancyOrAmbiguity: null,
          sourceExcerptRef: 'RPL 19535 ChPL, pkt 4.9, str. 5',
        },
        {
          sectionNumber: '5',
          subpointNumber: '5',
          pageRef: 'PDF str. 5',
          conciseSummary:
            '5.1 ATC J07AN01, odporność komórkowa / alergia tuberkulinowa; 5.2 nie dotyczy; 5.3 badania na świnkach morskich i myszkach (100 dawek, test Jensena).',
          checkOutcome: 'ok',
          discrepancyOrAmbiguity: null,
          sourceExcerptRef: 'RPL 19535 ChPL, pkt 5.1–5.3, str. 5',
        },
        {
          sectionNumber: '6',
          subpointNumber: '6',
          pageRef: 'PDF str. 6–7',
          conciseSummary:
            '6.1 sodu glutaminian + izotoniczny NaCl; 6.2 nie dotyczy; 6.3 okres ważności 30 mies., zużyć bezpośrednio po rekonstytucji; 6.4 2°C–8°C, chronić przed światłem; 6.5 amp./fiolka 0,5 mg + 1 ml rozp., op. po 1 lub 5; 6.6 instrukcja rekonstytucji.',
          checkOutcome: 'missing_in_document',
          discrepancyOrAmbiguity:
            'Brak precyzyjnej liczby godzin stabilności zawiesiny po rekonstytucji w pkt 6.3 (wyłącznie sformułowanie „bezpośrednio po rekonstytucji”) — istotne operacyjnie dla fiolki 10-dawkowej.',
          sourceExcerptRef: 'RPL 19535 ChPL, pkt 6.1–6.6, str. 6–7',
        },
        {
          sectionNumber: '7',
          subpointNumber: '7',
          pageRef: 'PDF str. 7',
          conciseSummary: 'Podmiot odpowiedzialny: Synthaverse S.A. (Lublin, Polska).',
          checkOutcome: 'ok',
          discrepancyOrAmbiguity: null,
          sourceExcerptRef: 'RPL 19535 ChPL, pkt 7, str. 7',
        },
        {
          sectionNumber: '8',
          subpointNumber: '8',
          pageRef: 'PDF str. 7',
          conciseSummary: 'Numer pozwolenia na dopuszczenie do obrotu: R/0210.',
          checkOutcome: 'ok',
          discrepancyOrAmbiguity: null,
          sourceExcerptRef: 'RPL 19535 ChPL, pkt 8, str. 7',
        },
        {
          sectionNumber: '9',
          subpointNumber: '9',
          pageRef: 'PDF str. 7',
          conciseSummary:
            'Pierwsze pozwolenie: 01 marca 1994 r.; ostatnie przedłużenie pozwolenia: 29 maja 2013 r.',
          checkOutcome: 'ok',
          discrepancyOrAmbiguity: null,
          sourceExcerptRef: 'RPL 19535 ChPL, pkt 9, str. 7',
        },
        {
          sectionNumber: '10',
          subpointNumber: '10',
          pageRef: 'PDF str. 7',
          conciseSummary:
            'Punkt 10 ChPL na stronie 7 jest pusty — brak wpisanej daty zatwierdzenia lub zmiany tekstu.',
          checkOutcome: 'missing_in_document',
          discrepancyOrAmbiguity:
            'Brak daty zatwierdzenia/zmiany tekstu wewnątrz PDF (nazwa pliku w RPL nosi datę 2023-11-28 / OLI-2023-12-08.pdf, ale w samym dokumencie pkt 10 pozostaje pusty).',
          sourceExcerptRef: 'RPL 19535 ChPL, pkt 10, str. 7',
        },
      ],
    },
  ],

  missingDataReport: [
    {
      id: 'miss-bcg-sec10-date',
      productKey: 'bcg_10',
      relatedProcedureIds: ['pso-bcg-0'],
      category: 'document_metadata',
      missingElement: 'Brak daty w pkt 10 ChPL BCG 10',
      observedFact:
        'Pkt 10 na str. 7 pobranego PDF RPL 19535 jest pusty (nagłówek bez daty), mimo nazwy pliku RPL Charakterystyka-19535-2023-11-28-15535/OLI-2023-12-08.pdf.',
      impactOnVerification:
        'Utrzymuje documentDateStatus="missing_in_document" oraz blokuje automatyczne zamknięcie wymagań metrykalnych.',
    },
    {
      id: 'miss-bcg-sec46-fertility',
      productKey: 'bcg_10',
      relatedProcedureIds: ['pso-bcg-0'],
      category: 'clinical_subsection',
      missingElement: 'Brak podrozdziału „Płodność” w pkt 4.6 ChPL BCG 10',
      observedFact:
        'Sekcja 4.6 na str. 3 omawia wyłącznie ciążę i karmienie piersią bez podpunktu dotyczącego płodności.',
      impactOnVerification:
        'Wymaga odnotowania przez audytora jako luka formalna starszej struktury ChPL.',
    },
    {
      id: 'miss-bcg-reconstitution-hours',
      productKey: 'bcg_10',
      relatedProcedureIds: ['pso-bcg-0'],
      category: 'clinical_subsection',
      missingElement: 'Brak limitu godzinowego po rekonstytucji w pkt 6.3 ChPL BCG 10',
      observedFact:
        'Pkt 6.3 (str. 6) podaje wyłącznie „zużyć bezpośrednio po rekonstytucji” dla ampułki/fiolki 10-dawkowej bez podania maksymalnej liczby godzin po otwarciu.',
      impactOnVerification:
        'Wymaga decyzji operacyjno-klinicznej dotyczącej prezentacji zasad utylizacji reszty preparatu 10-dawkowego.',
    },
    {
      id: 'miss-bcg-ajvaccines-market',
      productKey: 'bcg_10',
      relatedProcedureIds: ['pso-bcg-0'],
      category: 'market_availability',
      missingElement: 'Brak potwierdzenia rynkowej dostępności alternatywy BCG AJVaccines (RPL 20376) na sezon bieżący',
      observedFact:
        'RPL zawiera wpis alternatywny ID 20376, lecz w ramach bieżącego etapu nie potwierdzono jego realnego obrotu w Polsce w porównaniu z BCG 10.',
      impactOnVerification:
        'Nie pozwala rozszerzać karty handlowej o kolejny preparat BCG bez weryfikacji dostępności rynkowej.',
    },
    {
      id: 'miss-flu-rpl-index-lag',
      productKey: 'influvac_2026_2027',
      relatedProcedureIds: ['pso-rec-influenza-1'],
      category: 'rpl_index_vs_pdf',
      missingElement: 'Opóźniona aktualizacja metadanych wyszukiwarki RPL (/search/public) dla Influvac 49462 i Vaxigrip 50032',
      observedFact:
        'Indeks /search/public wykazuje hasDownloadableMaterials=false dla 49462/50032 oraz stary opis 2024/2025 przy 49462, choć bezpośredni endpoint /characteristic zwraca aktualne PDF 2026/2027.',
      impactOnVerification:
        'Wymusza weryfikację binarną wyłącznie przez /characteristic (SHA-256) oraz wyklucza opieranie się na samym JSON indeksu wyszukiwarki.',
    },
    {
      id: 'miss-flu-vaxigrip-index-flag',
      productKey: 'vaxigrip_2026_2027',
      relatedProcedureIds: ['pso-rec-influenza-1'],
      category: 'rpl_index_vs_pdf',
      missingElement: 'Brak spójnej flagi materiałów do pobrania w /search/public dla Vaxigrip 50032 oraz brak badań skuteczności 9–17 lat w pkt 5.1',
      observedFact:
        'Endpoint /characteristic zwraca 22-stronicową ChPL 08/2026 (2026/2027), natomiast /search/public wskazuje hasDownloadableMaterials=false; pkt 5.1 nie zawiera bezpośrednich badań skuteczności dla 9–17 lat (ekstrapolacja/immunogenność).',
      impactOnVerification:
        'Wymaga odnotowania zakresu ekstrapolacji przez audytora klinicznego przed awansem procedury pso-rec-influenza-1.',
    },
    {
      id: 'miss-covid-sec10-date',
      productKey: 'spikevax_xfg',
      relatedProcedureIds: ['pso-rec-covid-pediatric'],
      category: 'document_metadata',
      missingElement: 'Brak wpisanej daty w pkt 10 Aneksu I EPAR Spikevax XFG',
      observedFact:
        'Strona 92 EPAR PL zawiera nagłówek pkt 10 bez daty (strona WWW EPAR publikuje jedynie Last updated: 30/10/2026).',
      impactOnVerification:
        'Utrzymuje documentDateStatus="missing_in_document" zgodnie z zasadą nieprzypisywania dat spoza samego pkt 10.',
    },
    {
      id: 'miss-covid-gtin-and-rpl',
      productKey: 'spikevax_xfg',
      relatedProcedureIds: ['pso-rec-covid-pediatric'],
      category: 'gtin_linkage',
      missingElement: 'Brak kodów GTIN w EPAR EMA, HTTP 400 w centralnych rekordach RPL 54306/54308/54456 oraz brak swoistych badań skuteczności/reaktogenności XFG',
      observedFact:
        'PDF EPAR ma 0 wystąpień GTIN (GTIN 00380777714110 i 00380777712024 pochodzą z RARS i Komunikatu nr 39 MZ), rekordy RPL CEN zwracają HTTP 400 na /characteristic, a pkt 4.8 i 5.1 bazują na ekstrapolacji ze szczepionki wyjściowej, BA.1, BA.4-5 i XBB.1.5.',
      impactOnVerification:
        'Karta preparatu pozostaje pending_catalog_entry, a GTIN zachowują confirmedByEma=false oraz confirmedByRpl=false.',
    },
  ],

  humanDecisionChecklist: [
    {
      id: 'dec-bcg-42-injection-site',
      productKey: 'bcg_10',
      relatedProcedureIds: ['pso-bcg-0'],
      chplSectionOrSubpoint: '4.2 i 4.8',
      pageRef: 'PDF str. 1, 2 i 4',
      clinicalQuestion:
        'Które sformułowanie miejsca wstrzyknięcia BCG 10 przyjąć jako wiążące w karcie procedury PSO 2027 wobec wewnętrznej sprzeczności ChPL (1/3 górna ramienia na str. 1 vs środkowa okolica m. naramiennego wg WHO i ostrzeżenie o keloidzie na str. 2 i 4)?',
      ambiguitySummary:
        'ChPL na jednej stronie podaje zewnętrzną 1/3 górną część lewego ramienia, a na kolejnej stronie przytacza zalecenie WHO dotyczące środkowej części oraz ostrzega przed powstaniem keloidu przy zbyt wysokim podaniu.',
      requiresCompetentClinicalAuditorDecision: true,
      autoResolved: false,
    },
    {
      id: 'dec-bcg-43-44-antitnf',
      productKey: 'bcg_10',
      relatedProcedureIds: ['pso-bcg-0'],
      chplSectionOrSubpoint: '4.3 i 4.4',
      pageRef: 'PDF str. 2–3',
      clinicalQuestion:
        'Jak ująć w podsumowaniu bezpieczeństwa ekspozycję płodu na leki anty-TNF-alfa / przeciwciała IgG1 w ciąży (przeciwwskazanie w pkt 4.3 dla 3. trymestru vs odroczenie/decyzja lekarza w pkt 4.4)?',
      ambiguitySummary:
        'Punkt 4.3 kwalifikuje noworodki matek leczonych w III trymestrze anty-TNF-alfa w grupie przeciwwskazań, podczas gdy punkt 4.4 opisuje konieczność odroczenia i oceny lekarskiej.',
      requiresCompetentClinicalAuditorDecision: true,
      autoResolved: false,
    },
    {
      id: 'dec-bcg-41-age15-vs-pso',
      productKey: 'bcg_10',
      relatedProcedureIds: ['pso-bcg-0'],
      chplSectionOrSubpoint: '4.1',
      pageRef: 'PDF str. 1',
      clinicalQuestion:
        'Czy zapis ChPL BCG 10 o szczepieniu uzupełniającym niezaszczepionych dzieci do ukończenia 15. r.ż. powinien pozostać wyłącznie jako informacja rejestracyjna w karcie preparatu, z zachowaniem rozdziału względem reguł wieku PSO 2027?',
      ambiguitySummary:
        'Weryfikacja zgodności granicy wieku 15. r.ż. między ChPL a częścią I.A/I.B/V PSO 2027 wymaga podpisu audytora klinicznego.',
      requiresCompetentClinicalAuditorDecision: true,
      autoResolved: false,
    },
    {
      id: 'dec-flu-42-age17-vs-18',
      productKey: 'influvac_2026_2027',
      relatedProcedureIds: ['pso-rec-influenza-1'],
      chplSectionOrSubpoint: '4.2 i 4.8',
      pageRef: 'Influvac str. 1–2, 4; Vaxigrip str. 2–3, 7',
      clinicalQuestion:
        'Czy sformułowanie dawkowania w polskich ChPL Influvac i Vaxigrip „od ukończenia 6. m.ż. do ukończenia 17. r.ż.” jest wyłącznie kwestią redakcji wieku między 17. a 18. rokiem życia (Tabela bezpieczeństwa obejmuje 6 mies.–17 lat i dorosłych >=18 lat) oraz jak opisać to przy granicy D1 (<18 r.ż.)?',
      ambiguitySummary:
        'Obie ChPL w pkt 4.2 mają identyczne tłumaczenie zamykające grupę dzieci na „do ukończenia 17. r.ż.”, przy definicji dorosłych od >=18 lat w pkt 4.8.',
      requiresCompetentClinicalAuditorDecision: true,
      autoResolved: false,
    },
    {
      id: 'dec-flu-extrapolation-4valent',
      productKey: 'vaxigrip_2026_2027',
      relatedProcedureIds: ['pso-rec-influenza-1'],
      chplSectionOrSubpoint: '4.8 i 5.1',
      pageRef: 'Influvac str. 3–9; Vaxigrip str. 5–18',
      clinicalQuestion:
        'Czy audytor kliniczny akceptuje ekstrapolację danych bezpieczeństwa i skuteczności pediatrycznej z preparatów 4-walentnych (Influvac Tetra INFQ3003; VaxigripTetra) do obecnych rejestracyjnych ChPL trójwalentnych 2026/2027 bez dodatkowych badań klinicznych?',
      ambiguitySummary:
        'Zarówno Influvac, jak i Vaxigrip w sezonie 2026/2027 wykorzystują dane kliniczne z wcześniejszych preparatów 4-walentnych w populacji dziecięcej.',
      requiresCompetentClinicalAuditorDecision: true,
      autoResolved: false,
    },
    {
      id: 'dec-flu-allergens-and-passive-pregnancy',
      productKey: 'vaxigrip_2026_2027',
      relatedProcedureIds: ['pso-rec-influenza-1'],
      chplSectionOrSubpoint: '4.1, 4.3 i 6.4',
      pageRef: 'Vaxigrip str. 2, 3 i 20',
      clinicalQuestion:
        'Czy wyodrębniać w interfejsie klinicznym specyficzne różnice między trójwalentnymi preparatami grypowymi (bierne uodpornienie <6 m.ż. po szczepieniu ciężarnej wyłącznie w ChPL Vaxigrip; neomycyna/octoxynol-9 vs gentamycyna/CTAB/polisorbat 80; odchylenie 72 h do 25°C)?',
      ambiguitySummary:
        'Mimo tego samego składu szczepów WHO 2026/2027 ChPL Vaxigrip i Influvac różnią się wskazaniami w pkt 4.1, alergenami śladowymi i zapisem stabilności termicznej.',
      requiresCompetentClinicalAuditorDecision: true,
      autoResolved: false,
    },
    {
      id: 'dec-covid-42-site-and-extrapolation',
      productKey: 'spikevax_xfg',
      relatedProcedureIds: ['pso-rec-covid-pediatric'],
      chplSectionOrSubpoint: '4.2, 4.5, 4.8 i 5.1',
      pageRef: 'EPAR PL str. 65–85',
      clinicalQuestion:
        'Jak audytor kliniczny rozstrzyga: (1) brak wyodrębnienia mięśnia uda u niemowląt 6–23 m.ż. w ogólnym zapisie „mięsień naramienny” pkt 4.2 str. 66, (2) ograniczenie danych koadministracji w pkt 4.5 do grypy i półpaśca, oraz (3) ekstrapolację skuteczności/bezpieczeństwa XFG z wariantów wcześniejszych?',
      ambiguitySummary:
        'ChPL EMA dla Spikevax XFG opiera immunogenność/bezpieczeństwo na wcześniejszych wersjach Spikevax i wymaga potwierdzenia zgodności operacyjnej ze schematem i zaleceniami Komunikatu nr 39 MZ.',
      requiresCompetentClinicalAuditorDecision: true,
      autoResolved: false,
    },
    {
      id: 'dec-covid-gtin-vs-ema-sec10',
      productKey: 'spikevax_xfg',
      relatedProcedureIds: ['pso-rec-covid-pediatric'],
      chplSectionOrSubpoint: '2, 6.3–6.4, 8 i 10',
      pageRef: 'EPAR PL str. 64–65, 86–92',
      clinicalQuestion:
        'Czy przy tworzeniu przyszłej karty produktu Spikevax XFG w VACCINES_CATALOG połączyć jeden dokument EPAR (EU/1/20/1507/041–050, pusty pkt 10) z dwiema prezentacjami GTIN używanymi w Polsce wg Komunikatu MZ i RARS oraz jak przypisać odmienne okresy ważności w 2°C–8°C (30 dni vs 14 dni)?',
      ambiguitySummary:
        'Wymaga wiążącej decyzji co do struktury prezentacji wielopostaciowej (PFS 0,25 ml vs fiolka wielodawkowa) oraz formalnej klasyfikacji braku daty w pkt 10 Aneksu I.',
      requiresCompetentClinicalAuditorDecision: true,
      autoResolved: false,
    },
  ],
};
