/**
 * TRWAŁY, AUDYTOWALNY REJESTR DOWODÓW ŹRÓDŁOWYCH PSO 2027
 * (Program Szczepień Ochronnych na rok 2027, Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77)
 *
 * Plik stanowi permanentny rejestr dowodowy (Evidence Manifest) dla wszystkich 119 rekordów
 * ustrukturyzowanych (PSO_2027_STRUCTURED_RECORDS) i 35 podsekcji (PSO_2027_COMPLETENESS_REGISTRY).
 *
 * Kluczowe zasady:
 * 1. Każdy rekord posiada recordId, tytuł, część/podsekcję, numery stron (1–48), dokładny
 *    lokalizator w oficjalnym PDF, mapowanie pól na źródło oraz kotwicę / dosłowny fragment.
 * 2. Wierność odwzorowania tekstu urzędowego PSO NIE oznacza automatycznej weryfikacji ChPL
 *    konkretnych preparatów w katalogu dziecięcym (CHILD_VACCINES_CATALOG zachowuje statusy ChPL:
 *    12 requires_source_clarification, 31 pending_chpl_verification, verifiedFull = 0).
 * 3. Tabela VII.C (Meningokoki u dorosłych) zachowuje jawny status 'conflicting' z notą audytową,
 *    ponieważ puste komórki dla wieku 19–64 lat nie wykluczają wskazań określonych w Części II.B.
 */

import type { PsoPartNumber, PsoRecordVerificationStatus } from '../types/pso2027';

export interface PsoRecordFieldMapping {
  field: string;
  sourceFragment: string;
}

export interface PsoRecordEvidenceItem {
  id: string;
  recordId: string;
  recordTitle: string;
  sourcePart: PsoPartNumber;
  sourceSubsection: string;
  sourcePage: number | number[];
  exactPdfLocator: string;
  targetRecordFields: string[];
  fieldSourceMappings: PsoRecordFieldMapping[];
  literalExcerptOrAnchor: string;
  verificationStatus: PsoRecordVerificationStatus;
  auditNotes?: string;
  caveat?: string;
}

export interface PsoEvidenceLedgerSummary {
  totalRecords: number;
  totalSubsections: number;
  verifiedCount: number;
  conflictingCount: number;
  partiallyVerifiedCount: number;
  notVerifiedCount: number;
  officialSourceCitation: string;
  officialPdfUrl: string;
  gisPortalUrl: string;
  journalPublicationDate: string;
  gisAnnouncementDate: string;
  pdfSha256: string;
  totalPages: number;
}

export const PSO_2027_RECORD_EVIDENCE_MANIFEST: readonly PsoRecordEvidenceItem[] = [
  {
    "id": "rec-ia-scope",
    "recordId": "rec-ia-scope",
    "recordTitle": "Szczepienia obowiązkowe dzieci i młodzieży",
    "sourcePart": "I",
    "sourceSubsection": "I.A",
    "sourcePage": [
      4,
      5,
      6,
      7,
      8
    ],
    "exactPdfLocator": "Część I.A, str. 4–8 (oraz przypisy str. 2), tabela główna szczepień obowiązkowych dzieci i młodzieży według wieku",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w I.A (str. 4–8)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w I.A (str. 4–8)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część I.A, str. 2 i 4–8"
      },
      {
        "field": "relatedRecords",
        "sourceFragment": "43 procedury w CHILD_VACCINES_CATALOG (w tym warianty wiekowe I.A)"
      }
    ],
    "literalExcerptOrAnchor": "I. SZCZEPIENIA OBOWIĄZKOWE — I.A. SZCZEPIENIA OBOWIĄZKOWE DZIECI I MŁODZIEŻY WEDŁUG WIEKU (od 24 godzin życia do 19. r.ż.)",
    "verificationStatus": "verified",
    "auditNotes": "Wierność tekstu PSO 2027 potwierdzona (verified); odrębny audyt ChPL preparatów zachowuje verified_full = 0."
  },
  {
    "id": "rec-ia1-5w1",
    "recordId": "rec-ia1-5w1",
    "recordTitle": "Wariant szczepień w populacji ogólnej dzieci do 2 lat z użyciem szczepionki wysokoskojarzonej 5w1 (DTaP-IPV-Hib)*",
    "sourcePart": "I",
    "sourceSubsection": "I.A.1",
    "sourcePage": [
      9,
      10
    ],
    "exactPdfLocator": "Część I.A.1, str. 9–10, tabela wariantu 5w1 (DTaP-IPV-Hib)* oraz zasady WZW B w 1. dobie",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "schedule",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w I.A.1 (str. 9–10)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w I.A.1 (str. 9–10)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część I.A.1, str. 9–10"
      },
      {
        "field": "schedule",
        "sourceFragment": "Harmonogram 1. doba (WZW B + BCG) i 2., 3–4., 5–6., 16–18. m.ż. (str. 9–10)"
      },
      {
        "field": "relatedRecords",
        "sourceFragment": "Powiązane procedury 5w1 i monowalentne z CHILD_VACCINES_CATALOG"
      }
    ],
    "literalExcerptOrAnchor": "I.A.1. Wariant szczepień w populacji ogólnej dzieci do 2 lat z użyciem szczepionki wysokoskojarzonej 5w1 (DTaP-IPV-Hib)*",
    "verificationStatus": "verified"
  },
  {
    "id": "rec-ia2-6w1",
    "recordId": "rec-ia2-6w1",
    "recordTitle": "Wariant szczepień w populacji ogólnej dzieci do 2 lat z użyciem szczepionki wysokoskojarzonej 6w1 (DTaP-IPV-Hib-HBV)*",
    "sourcePart": "I",
    "sourceSubsection": "I.A.2",
    "sourcePage": [
      11,
      12
    ],
    "exactPdfLocator": "Część I.A.2, str. 11–12, tabela wariantu 6w1 (DTaP-IPV-Hib-HBV)* oraz schemat 2+1 / 3+1",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "schedule",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w I.A.2 (str. 11–12)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w I.A.2 (str. 11–12)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część I.A.2, str. 11–12"
      },
      {
        "field": "schedule",
        "sourceFragment": "Harmonogram 1. doba + 2., 4., 5–6. (dla 3+1), 16–18. m.ż. (str. 11–12)"
      },
      {
        "field": "relatedRecords",
        "sourceFragment": "Powiązane procedury 6w1 z CHILD_VACCINES_CATALOG"
      }
    ],
    "literalExcerptOrAnchor": "I.A.2. Wariant szczepień w populacji ogólnej dzieci do 2 lat z użyciem szczepionki wysokoskojarzonej 6w1 (DTaP-IPV-Hib-HBV)*",
    "verificationStatus": "verified"
  },
  {
    "id": "pso-ib-transplant-asplenia",
    "recordId": "pso-ib-transplant-asplenia",
    "recordTitle": "Szczepienia obowiązkowe osób przed lub po przeszczepieniu komórek krwiotwórczych, narządów wewnętrznych, splenektomii / z asplenią",
    "sourcePart": "I",
    "sourceSubsection": "I.B",
    "sourcePage": [
      13
    ],
    "exactPdfLocator": "Część I.B, str. 13, blok tematyczny nr 1 (Szczepienia obowiązkowe osób przed lub po przeszczepieniu komórek krwiotwórczych, narządów wewnętrznych, splenektomii / z asplenią)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "schedule",
      "riskGroup",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w I.B (str. 13)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w I.B (str. 13)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część I.B, str. 13"
      },
      {
        "field": "riskGroup",
        "sourceFragment": "Wyliczenie grup ryzyka z bloku I.B nr 1 (str. 13)"
      },
      {
        "field": "schedule",
        "sourceFragment": "Uwagi / odsyłacze bloku I.B nr 1 (str. 13)"
      }
    ],
    "literalExcerptOrAnchor": "I.B. Szczepienia obowiązkowe osób przed lub po przeszczepieniu komórek krwiotwórczych, narządów wewnętrznych, splenektomii / z asplenią — Osoby, przed lub po przeszczepieniu komórek krwiotwórczych, narządów wewnętrznych, przed lub po splenektomii, z asplenią, z zaburzeniami czy",
    "verificationStatus": "verified"
  },
  {
    "id": "pso-ib-pneumococcal",
    "recordId": "pso-ib-pneumococcal",
    "recordTitle": "Inwazyjnym zakażeniom STREPTOCOCCUS PNEUMONIAE (grupy ryzyka do 19. r.ż.)",
    "sourcePart": "I",
    "sourceSubsection": "I.B",
    "sourcePage": [
      13
    ],
    "exactPdfLocator": "Część I.B, str. 13, blok tematyczny nr 2 (Inwazyjnym zakażeniom STREPTOCOCCUS PNEUMONIAE (grupy ryzyka do 19. r.ż.))",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "schedule",
      "riskGroup",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w I.B (str. 13)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w I.B (str. 13)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część I.B, str. 13"
      },
      {
        "field": "riskGroup",
        "sourceFragment": "Wyliczenie grup ryzyka z bloku I.B nr 2 (str. 13)"
      },
      {
        "field": "schedule",
        "sourceFragment": "Uwagi / odsyłacze bloku I.B nr 2 (str. 13)"
      }
    ],
    "literalExcerptOrAnchor": "I.B. Inwazyjnym zakażeniom STREPTOCOCCUS PNEUMONIAE (grupy ryzyka do 19. r.ż.) — Osoby do ukończenia 19. roku życia, które nie były szczepione przeciw inwazyjnym zakażeniom Streptococcus pneumoniae:",
    "verificationStatus": "verified"
  },
  {
    "id": "pso-ib-hbv",
    "recordId": "pso-ib-hbv",
    "recordTitle": "WIRUSOWEMU ZAPALENIU WĄTROBY typu B (grupy ryzyka klinicznego i epidemiologicznego)",
    "sourcePart": "I",
    "sourceSubsection": "I.B",
    "sourcePage": [
      13,
      14
    ],
    "exactPdfLocator": "Część I.B, str. 13–14, blok tematyczny nr 3 (WIRUSOWEMU ZAPALENIU WĄTROBY typu B (grupy ryzyka klinicznego i epidemiologicznego))",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "schedule",
      "riskGroup",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w I.B (str. 13–14)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w I.B (str. 13–14)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część I.B, str. 13–14"
      },
      {
        "field": "riskGroup",
        "sourceFragment": "Wyliczenie grup ryzyka z bloku I.B nr 3 (str. 13–14)"
      },
      {
        "field": "schedule",
        "sourceFragment": "Uwagi / odsyłacze bloku I.B nr 3 (str. 13–14)"
      }
    ],
    "literalExcerptOrAnchor": "I.B. WIRUSOWEMU ZAPALENIU WĄTROBY typu B (grupy ryzyka klinicznego i epidemiologicznego) — Osoby obowiązane do poddania się szczepieniu przeciw WZW typu B:",
    "verificationStatus": "verified"
  },
  {
    "id": "pso-ib-varicella",
    "recordId": "pso-ib-varicella",
    "recordTitle": "OSPIE WIETRZNEJ (obowiązkowe grupy ryzyka i instytucjonalne do 19. r.ż.)",
    "sourcePart": "I",
    "sourceSubsection": "I.B",
    "sourcePage": [
      14
    ],
    "exactPdfLocator": "Część I.B, str. 14, blok tematyczny nr 4 (OSPIE WIETRZNEJ (obowiązkowe grupy ryzyka i instytucjonalne do 19. r.ż.))",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "schedule",
      "riskGroup",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w I.B (str. 14)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w I.B (str. 14)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część I.B, str. 14"
      },
      {
        "field": "riskGroup",
        "sourceFragment": "Wyliczenie grup ryzyka z bloku I.B nr 4 (str. 14)"
      },
      {
        "field": "schedule",
        "sourceFragment": "Uwagi / odsyłacze bloku I.B nr 4 (str. 14)"
      }
    ],
    "literalExcerptOrAnchor": "I.B. OSPIE WIETRZNEJ (obowiązkowe grupy ryzyka i instytucjonalne do 19. r.ż.) — Dzieci i młodzież do ukończenia 19. roku życia, które nie chorowały na ospę wietrzną:",
    "verificationStatus": "verified"
  },
  {
    "id": "pso-ic-diphtheria",
    "recordId": "pso-ic-diphtheria",
    "recordTitle": "Szczepienie poekspozycyjne przeciw BŁONICY",
    "sourcePart": "I",
    "sourceSubsection": "I.C",
    "sourcePage": 15,
    "exactPdfLocator": "Część I.C, str. 15, wiersz tabeli nr 1 (BŁONICY)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "schedule",
      "riskGroup",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w I.C (str. 15)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w I.C (str. 15)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część I.C, str. 15"
      },
      {
        "field": "riskGroup",
        "sourceFragment": "Kolumna „Osoby obowiązane” w I.C wiersz 1 (str. 15)"
      },
      {
        "field": "schedule",
        "sourceFragment": "Kolumna „Uwagi” / odsyłacz III.E w I.C (str. 15)"
      }
    ],
    "literalExcerptOrAnchor": "I.C. BŁONICY — Obowiązek dotyczy osób narażonych na zakażenie, które miały styczność z chorym na BŁONICĘ.",
    "verificationStatus": "verified"
  },
  {
    "id": "pso-ic-tetanus",
    "recordId": "pso-ic-tetanus",
    "recordTitle": "Szczepienie poekspozycyjne przeciw TĘŻCOWI",
    "sourcePart": "I",
    "sourceSubsection": "I.C",
    "sourcePage": 15,
    "exactPdfLocator": "Część I.C, str. 15, wiersz tabeli nr 2 (TĘŻCOWI)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "schedule",
      "riskGroup",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w I.C (str. 15)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w I.C (str. 15)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część I.C, str. 15"
      },
      {
        "field": "riskGroup",
        "sourceFragment": "Kolumna „Osoby obowiązane” w I.C wiersz 2 (str. 15)"
      },
      {
        "field": "schedule",
        "sourceFragment": "Kolumna „Uwagi” / odsyłacz I.E w I.C (str. 15)"
      }
    ],
    "literalExcerptOrAnchor": "I.C. TĘŻCOWI — Obowiązek dotyczy osób zranionych, narażonych na zakażenie TĘŻCEM.",
    "verificationStatus": "verified"
  },
  {
    "id": "pso-ic-rabies",
    "recordId": "pso-ic-rabies",
    "recordTitle": "Szczepienie poekspozycyjne przeciw WŚCIEKLIŹNIE",
    "sourcePart": "I",
    "sourceSubsection": "I.C",
    "sourcePage": 15,
    "exactPdfLocator": "Część I.C, str. 15, wiersz tabeli nr 3 (WŚCIEKLIŹNIE)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "schedule",
      "riskGroup",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w I.C (str. 15)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w I.C (str. 15)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część I.C, str. 15"
      },
      {
        "field": "riskGroup",
        "sourceFragment": "Kolumna „Osoby obowiązane” w I.C wiersz 3 (str. 15)"
      },
      {
        "field": "schedule",
        "sourceFragment": "Kolumna „Uwagi” / odsyłacz I.D w I.C (str. 15)"
      }
    ],
    "literalExcerptOrAnchor": "I.C. WŚCIEKLIŹNIE — Obowiązek dotyczy osób mających styczność ze zwierzęciem chorym na WŚCIEKLIZNĘ lub podejrzanym o zakażenie wirusem WŚCIEKLIZNY.",
    "verificationStatus": "verified"
  },
  {
    "id": "rec-id-rabies-pep",
    "recordId": "rec-id-rabies-pep",
    "recordTitle": "Profilaktyka poekspozycyjna przeciw wściekliźnie (macierz kontaktu str. 17)",
    "sourcePart": "I",
    "sourceSubsection": "I.D",
    "sourcePage": [
      16,
      17
    ],
    "exactPdfLocator": "Część I.D, str. 16–17, tabela 8-wierszowa wytycznych swoistego zapobiegania wściekliźnie",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "schedule",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w I.D (str. 16–17)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w I.D (str. 16–17)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część I.D, str. 16–17"
      },
      {
        "field": "schedule",
        "sourceFragment": "Komórki tabeli „Postępowanie” dla kategorii I–III (str. 16–17)"
      }
    ],
    "literalExcerptOrAnchor": "I.D. WYTYCZNE DOTYCZĄCE SWOISTEGO ZAPOBIEGANIA WŚCIEKLIŹNIE (kategorie kontaktu I–III, obserwacja zwierzęcia 15 dni, EKC / PEP)",
    "verificationStatus": "verified"
  },
  {
    "id": "rec-ie-tetanus-pep",
    "recordId": "rec-ie-tetanus-pep",
    "recordTitle": "Profilaktyka poekspozycyjna przeciw tężcowi (macierz ryzyka str. 18)",
    "sourcePart": "I",
    "sourceSubsection": "I.E",
    "sourcePage": [
      18
    ],
    "exactPdfLocator": "Część I.E, str. 18, tabela 4-wierszowa profilaktyki przeciwtężcowej u osób zranionych oraz przypis o krztuścu",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "schedule",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w I.E (str. 18)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w I.E (str. 18)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część I.E, str. 18"
      },
      {
        "field": "schedule",
        "sourceFragment": "Kolumny ryzyka zakażenia tężcem i przypis dotyczący KRZTUŚCOWI (str. 18)"
      }
    ],
    "literalExcerptOrAnchor": "I.E. WYTYCZNE DOTYCZĄCE SWOISTEGO ZAPOBIEGANIA TĘŻCOWI U OSÓB ZRANIENYCH (niskie vs wysokie ryzyko, TT/Td/Tdap + LIT)",
    "verificationStatus": "verified"
  },
  {
    "id": "pso-iia-covid",
    "recordId": "pso-iia-covid",
    "recordTitle": "II.A: COVID-19",
    "sourcePart": "II",
    "sourceSubsection": "II.A",
    "sourcePage": [
      19
    ],
    "exactPdfLocator": "Część II.A, str. 19, tabela szczepień zalecanych dzieciom i młodzieży, wiersz nr 1 (COVID-19)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "schedule",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.A (str. 19)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.A (str. 19)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.A, str. 19"
      },
      {
        "field": "schedule",
        "sourceFragment": "Kolumna „Uwagi” / zalecenia w tabeli II.A wiersz 1 (str. 19)"
      }
    ],
    "literalExcerptOrAnchor": "II.A. COVID-19: Od ukończenia 6. miesiąca życia do 18. roku życia.",
    "verificationStatus": "verified",
    "auditNotes": "Treść kolumny „Uwagi” pochodzi dosłownie z akt.pdf (str. 19)."
  },
  {
    "id": "pso-iia-influenza",
    "recordId": "pso-iia-influenza",
    "recordTitle": "II.A: GRYPIE",
    "sourcePart": "II",
    "sourceSubsection": "II.A",
    "sourcePage": [
      19,
      20
    ],
    "exactPdfLocator": "Część II.A, str. 19–20, tabela szczepień zalecanych dzieciom i młodzieży, wiersz nr 2 (GRYPIE)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "schedule",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.A (str. 19–20)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.A (str. 19–20)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.A, str. 19–20"
      },
      {
        "field": "schedule",
        "sourceFragment": "Kolumna „Uwagi” / zalecenia w tabeli II.A wiersz 2 (str. 19–20)"
      }
    ],
    "literalExcerptOrAnchor": "II.A. GRYPIE: 1. W związku z przesłankami epidemiologicznymi – szczepienie zalecane osobom od ukończenia 6. miesiąca życia, w szczególności: 1) zdrowym dz",
    "verificationStatus": "verified",
    "auditNotes": "Treść kolumny „Uwagi” pochodzi dosłownie z akt.pdf (str. 19–20)."
  },
  {
    "id": "pso-iia-meningococci",
    "recordId": "pso-iia-meningococci",
    "recordTitle": "II.A: Inwazyjnym zakażeniom NEISSERIA MENINGITIDIS",
    "sourcePart": "II",
    "sourceSubsection": "II.A",
    "sourcePage": [
      20
    ],
    "exactPdfLocator": "Część II.A, str. 20, tabela szczepień zalecanych dzieciom i młodzieży, wiersz nr 3 (Inwazyjnym zakażeniom NEISSERIA MENINGITIDIS)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "schedule",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.A (str. 20)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.A (str. 20)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.A, str. 20"
      },
      {
        "field": "schedule",
        "sourceFragment": "Kolumna „Uwagi” / zalecenia w tabeli II.A wiersz 3 (str. 20)"
      }
    ],
    "literalExcerptOrAnchor": "II.A. Inwazyjnym zakażeniom NEISSERIA MENINGITIDIS: Szczepienie zalecane: 1) niemowlętom od ukończenia 6. tygodnia życia lub 8. tygodnia życia w zależności od rodzaju szczepionki; 2) dzieciom ",
    "verificationStatus": "verified",
    "auditNotes": "Treść kolumny „Uwagi” pochodzi dosłownie z akt.pdf (str. 20)."
  },
  {
    "id": "pso-iia-tbe",
    "recordId": "pso-iia-tbe",
    "recordTitle": "II.A: KLESZCZOWEMU ZAPALENIU MÓZGU (KZM)",
    "sourcePart": "II",
    "sourceSubsection": "II.A",
    "sourcePage": [
      20
    ],
    "exactPdfLocator": "Część II.A, str. 20, tabela szczepień zalecanych dzieciom i młodzieży, wiersz nr 4 (KLESZCZOWEMU ZAPALENIU MÓZGU (KZM))",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.A (str. 20)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.A (str. 20)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.A, str. 20"
      }
    ],
    "literalExcerptOrAnchor": "II.A. KLESZCZOWEMU ZAPALENIU MÓZGU (KZM): Szczepienie zalecane osobom szczególnie często podejmującym aktywność fizyczną poza pomieszczeniami (np. rodzinom z małymi dziećmi) i innym ",
    "verificationStatus": "verified",
    "auditNotes": "Oficjalna kolumna „Uwagi” w PDF dla tej pozycji jest pusta (#d9d9d9) — zachowano dosłowne brzmienie bez syntetycznych dopisków."
  },
  {
    "id": "pso-iia-hav",
    "recordId": "pso-iia-hav",
    "recordTitle": "II.A: WIRUSOWEMU ZAPALENIU WĄTROBY typu A",
    "sourcePart": "II",
    "sourceSubsection": "II.A",
    "sourcePage": [
      20
    ],
    "exactPdfLocator": "Część II.A, str. 20, tabela szczepień zalecanych dzieciom i młodzieży, wiersz nr 5 (WIRUSOWEMU ZAPALENIU WĄTROBY typu A)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.A (str. 20)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.A (str. 20)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.A, str. 20"
      }
    ],
    "literalExcerptOrAnchor": "II.A. WIRUSOWEMU ZAPALENIU WĄTROBY typu A: Szczepienie zalecane osobom: 1) dzieciom w wieku przedszkolnym, szkolnym oraz młodzieży, które nie chorowały na wirusowe zapalenie wątroby t",
    "verificationStatus": "verified",
    "auditNotes": "Oficjalna kolumna „Uwagi” w PDF dla tej pozycji jest pusta (#d9d9d9) — zachowano dosłowne brzmienie bez syntetycznych dopisków."
  },
  {
    "id": "pso-iia-hpv",
    "recordId": "pso-iia-hpv",
    "recordTitle": "II.A: Zakażeniom LUDZKIMI WIRUSAMI BRODAWCZAKA (HPV)",
    "sourcePart": "II",
    "sourceSubsection": "II.A",
    "sourcePage": [
      20,
      21
    ],
    "exactPdfLocator": "Część II.A, str. 20–21, tabela szczepień zalecanych dzieciom i młodzieży, wiersz nr 6 (Zakażeniom LUDZKIMI WIRUSAMI BRODAWCZAKA (HPV))",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.A (str. 20–21)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.A (str. 20–21)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.A, str. 20–21"
      }
    ],
    "literalExcerptOrAnchor": "II.A. Zakażeniom LUDZKIMI WIRUSAMI BRODAWCZAKA (HPV): Szczepienie po ukończeniu 9. roku życia do ukończenia 14. roku życia, w schemacie dwudawkowym; szczepienie musi być rozpoczęte do ukończenia",
    "verificationStatus": "verified",
    "auditNotes": "Oficjalna kolumna „Uwagi” w PDF dla tej pozycji jest pusta (#d9d9d9) — zachowano dosłowne brzmienie bez syntetycznych dopisków."
  },
  {
    "id": "pso-iia-vzv",
    "recordId": "pso-iia-vzv",
    "recordTitle": "II.A: OSPIE WIETRZNEJ",
    "sourcePart": "II",
    "sourceSubsection": "II.A",
    "sourcePage": [
      21
    ],
    "exactPdfLocator": "Część II.A, str. 21, tabela szczepień zalecanych dzieciom i młodzieży, wiersz nr 7 (OSPIE WIETRZNEJ)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.A (str. 21)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.A (str. 21)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.A, str. 21"
      }
    ],
    "literalExcerptOrAnchor": "II.A. OSPIE WIETRZNEJ: Szczepienie zalecane osobom, które nie chorowały na OSPĘ WIETRZNĄ i nie zostały wcześniej zaszczepione w ramach szczepień obowiązkowych albo",
    "verificationStatus": "verified",
    "auditNotes": "Oficjalna kolumna „Uwagi” w PDF dla tej pozycji jest pusta (#d9d9d9) — zachowano dosłowne brzmienie bez syntetycznych dopisków."
  },
  {
    "id": "pso-iib-covid",
    "recordId": "pso-iib-covid",
    "recordTitle": "II.B: COVID-19",
    "sourcePart": "II",
    "sourceSubsection": "II.B",
    "sourcePage": [
      22
    ],
    "exactPdfLocator": "Część II.B, str. 22, tabela szczepień zalecanych dorosłym, wiersz nr 1 (COVID-19)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "schedule",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.B (str. 22)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.B (str. 22)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.B, str. 22"
      },
      {
        "field": "schedule",
        "sourceFragment": "Kolumna „Uwagi” w tabeli II.B wiersz 1 (str. 22)"
      }
    ],
    "literalExcerptOrAnchor": "II.B. COVID-19: Szczepienie zalecane wszystkim dorosłym, w szczególności osobom z grup ryzyka.",
    "verificationStatus": "verified"
  },
  {
    "id": "pso-iib-influenza",
    "recordId": "pso-iib-influenza",
    "recordTitle": "II.B: GRYPIE",
    "sourcePart": "II",
    "sourceSubsection": "II.B",
    "sourcePage": [
      22,
      23
    ],
    "exactPdfLocator": "Część II.B, str. 22–23, tabela szczepień zalecanych dorosłym, wiersz nr 2 (GRYPIE)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "schedule",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.B (str. 22–23)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.B (str. 22–23)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.B, str. 22–23"
      },
      {
        "field": "schedule",
        "sourceFragment": "Kolumna „Uwagi” w tabeli II.B wiersz 2 (str. 22–23)"
      }
    ],
    "literalExcerptOrAnchor": "II.B. GRYPIE: 1. W związku z przesłankami epidemiologicznymi – szczepienie zalecane osobom dorosłym, w szczególności: 1) osobom w wieku powyżej 50. roku ż",
    "verificationStatus": "verified"
  },
  {
    "id": "pso-iib-rsv",
    "recordId": "pso-iib-rsv",
    "recordTitle": "II.B: Zakażeniom SYNCYTIALNYM WIRUSEM ODDECHOWYM (RSV)",
    "sourcePart": "II",
    "sourceSubsection": "II.B",
    "sourcePage": [
      23
    ],
    "exactPdfLocator": "Część II.B, str. 23, tabela szczepień zalecanych dorosłym, wiersz nr 3 (Zakażeniom SYNCYTIALNYM WIRUSEM ODDECHOWYM (RSV))",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "schedule"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.B (str. 23)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.B (str. 23)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.B, str. 23"
      },
      {
        "field": "schedule",
        "sourceFragment": "Kolumna „Uwagi” w tabeli II.B wiersz 3 (str. 23)"
      }
    ],
    "literalExcerptOrAnchor": "II.B. Zakażeniom SYNCYTIALNYM WIRUSEM ODDECHOWYM (RSV): Szczepienie zalecane: 1) osobom od 18. roku życia ze zwiększonym ryzykiem zachorowania na chorobę wywoływaną przez RSV; 2) wszystkim osobom,",
    "verificationStatus": "verified"
  },
  {
    "id": "pso-iib-meningococci",
    "recordId": "pso-iib-meningococci",
    "recordTitle": "II.B: Inwazyjnym zakażeniom NEISSERIA MENINGITIDIS",
    "sourcePart": "II",
    "sourceSubsection": "II.B",
    "sourcePage": [
      23,
      24
    ],
    "exactPdfLocator": "Część II.B, str. 23–24, tabela szczepień zalecanych dorosłym, wiersz nr 4 (Inwazyjnym zakażeniom NEISSERIA MENINGITIDIS)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "schedule",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.B (str. 23–24)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.B (str. 23–24)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.B, str. 23–24"
      },
      {
        "field": "schedule",
        "sourceFragment": "Kolumna „Uwagi” w tabeli II.B wiersz 4 (str. 23–24)"
      }
    ],
    "literalExcerptOrAnchor": "II.B. Inwazyjnym zakażeniom NEISSERIA MENINGITIDIS: Szczepienie zalecane: 1) osobom dorosłym z wrodzonymi niedoborami odporności: z anatomiczną lub czynnościową asplenią, zakażonym wirusem HIV",
    "verificationStatus": "verified",
    "auditNotes": "Część II.B (str. 23–24) zaleca szczepienie przeciw meningokokom dorosłym z grup ryzyka oraz w szczególności >65. r.ż.; w skróconym kalendarzu VII.C (str. 48) komórki 19–64 lat są puste."
  },
  {
    "id": "pso-iib-pneumococci",
    "recordId": "pso-iib-pneumococci",
    "recordTitle": "II.B: Inwazyjnym zakażeniom STREPTOCOCCUS PNEUMONIAE",
    "sourcePart": "II",
    "sourceSubsection": "II.B",
    "sourcePage": [
      24
    ],
    "exactPdfLocator": "Część II.B, str. 24, tabela szczepień zalecanych dorosłym, wiersz nr 5 (Inwazyjnym zakażeniom STREPTOCOCCUS PNEUMONIAE)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "schedule",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.B (str. 24)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.B (str. 24)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.B, str. 24"
      },
      {
        "field": "schedule",
        "sourceFragment": "Kolumna „Uwagi” w tabeli II.B wiersz 5 (str. 24)"
      }
    ],
    "literalExcerptOrAnchor": "II.B. Inwazyjnym zakażeniom STREPTOCOCCUS PNEUMONIAE: Szczepienie zalecane: 1) osobom dorosłym powyżej 50. roku życia (ze szczególnym uwzględnieniem osób od ukończenia 65. roku życia); 2) osobom",
    "verificationStatus": "verified"
  },
  {
    "id": "pso-iib-hib",
    "recordId": "pso-iib-hib",
    "recordTitle": "II.B: Inwazyjnym zakażeniom HAEMOPHILUS INFLUENZAE typu b",
    "sourcePart": "II",
    "sourceSubsection": "II.B",
    "sourcePage": [
      24
    ],
    "exactPdfLocator": "Część II.B, str. 24, tabela szczepień zalecanych dorosłym, wiersz nr 6 (Inwazyjnym zakażeniom HAEMOPHILUS INFLUENZAE typu b)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "schedule",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.B (str. 24)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.B (str. 24)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.B, str. 24"
      },
      {
        "field": "schedule",
        "sourceFragment": "Kolumna „Uwagi” w tabeli II.B wiersz 6 (str. 24)"
      }
    ],
    "literalExcerptOrAnchor": "II.B. Inwazyjnym zakażeniom HAEMOPHILUS INFLUENZAE typu b: Szczepienie zalecane osobom z zaburzeniami odporności według indywidualnych wskazań.",
    "verificationStatus": "verified"
  },
  {
    "id": "pso-iib-tbe",
    "recordId": "pso-iib-tbe",
    "recordTitle": "II.B: KLESZCZOWEMU ZAPALENIU MÓZGU (KZM)",
    "sourcePart": "II",
    "sourceSubsection": "II.B",
    "sourcePage": [
      24,
      25
    ],
    "exactPdfLocator": "Część II.B, str. 24–25, tabela szczepień zalecanych dorosłym, wiersz nr 7 (KLESZCZOWEMU ZAPALENIU MÓZGU (KZM))",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.B (str. 24–25)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.B (str. 24–25)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.B, str. 24–25"
      }
    ],
    "literalExcerptOrAnchor": "II.B. KLESZCZOWEMU ZAPALENIU MÓZGU (KZM): Szczepienie zalecane osobom przebywającym na terenach o nasilonym występowaniu tej choroby, w szczególności: 1) osobom zatrudnionym przy eks",
    "verificationStatus": "verified",
    "auditNotes": "Oficjalna kolumna „Uwagi” w tabeli II.B PDF jest pusta — zachowano dosłownie."
  },
  {
    "id": "pso-iib-hbv",
    "recordId": "pso-iib-hbv",
    "recordTitle": "II.B: WIRUSOWEMU ZAPALENIU WĄTROBY typu B",
    "sourcePart": "II",
    "sourceSubsection": "II.B",
    "sourcePage": [
      25
    ],
    "exactPdfLocator": "Część II.B, str. 25, tabela szczepień zalecanych dorosłym, wiersz nr 8 (WIRUSOWEMU ZAPALENIU WĄTROBY typu B)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "schedule",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.B (str. 25)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.B (str. 25)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.B, str. 25"
      },
      {
        "field": "schedule",
        "sourceFragment": "Kolumna „Uwagi” w tabeli II.B wiersz 8 (str. 25)"
      }
    ],
    "literalExcerptOrAnchor": "II.B. WIRUSOWEMU ZAPALENIU WĄTROBY typu B: Szczepienie zalecane: 1) osobom dotychczas niezaszczepionym, które ze względu na tryb życia lub wykonywane zajęcia są narażone na zakażenia ",
    "verificationStatus": "verified"
  },
  {
    "id": "pso-iib-hav",
    "recordId": "pso-iib-hav",
    "recordTitle": "II.B: WIRUSOWEMU ZAPALENIU WĄTROBY typu A",
    "sourcePart": "II",
    "sourceSubsection": "II.B",
    "sourcePage": [
      25
    ],
    "exactPdfLocator": "Część II.B, str. 25, tabela szczepień zalecanych dorosłym, wiersz nr 9 (WIRUSOWEMU ZAPALENIU WĄTROBY typu A)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.B (str. 25)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.B (str. 25)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.B, str. 25"
      }
    ],
    "literalExcerptOrAnchor": "II.B. WIRUSOWEMU ZAPALENIU WĄTROBY typu A: Szczepienie zalecane: 1) osobom zatrudnionym przy produkcji i dystrybucji żywności, usuwaniu odpadów komunalnych i płynnych nieczystości ora",
    "verificationStatus": "verified",
    "auditNotes": "Oficjalna kolumna „Uwagi” w tabeli II.B PDF jest pusta — zachowano dosłownie."
  },
  {
    "id": "pso-iib-mmr",
    "recordId": "pso-iib-mmr",
    "recordTitle": "II.B: ODRZE, ŚWINCE, RÓŻYCZCE",
    "sourcePart": "II",
    "sourceSubsection": "II.B",
    "sourcePage": [
      26
    ],
    "exactPdfLocator": "Część II.B, str. 26, tabela szczepień zalecanych dorosłym, wiersz nr 10 (ODRZE, ŚWINCE, RÓŻYCZCE)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "schedule",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.B (str. 26)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.B (str. 26)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.B, str. 26"
      },
      {
        "field": "schedule",
        "sourceFragment": "Kolumna „Uwagi” w tabeli II.B wiersz 10 (str. 26)"
      }
    ],
    "literalExcerptOrAnchor": "II.B. ODRZE, ŚWINCE, RÓŻYCZCE: Szczepienie zalecane osobom nieuodpornionym, nieszczepionym wcześniej, które nie chorowały, w szczególności: 1) dorosłym, zwłaszcza w wieku ",
    "verificationStatus": "verified"
  },
  {
    "id": "pso-iib-tdap",
    "recordId": "pso-iib-tdap",
    "recordTitle": "II.B: BŁONICY, TĘŻCOWI, KRZTUŚCOWI",
    "sourcePart": "II",
    "sourceSubsection": "II.B",
    "sourcePage": [
      26
    ],
    "exactPdfLocator": "Część II.B, str. 26, tabela szczepień zalecanych dorosłym, wiersz nr 11 (BŁONICY, TĘŻCOWI, KRZTUŚCOWI)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "schedule",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.B (str. 26)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.B (str. 26)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.B, str. 26"
      },
      {
        "field": "schedule",
        "sourceFragment": "Kolumna „Uwagi” w tabeli II.B wiersz 11 (str. 26)"
      }
    ],
    "literalExcerptOrAnchor": "II.B. BŁONICY, TĘŻCOWI, KRZTUŚCOWI: Szczepienie zalecane osobom dorosłym, pojedyncza dawka przypominająca co 10 lat szczepionką Tdap albo Tdap-IPV, w szczególności w związku z ",
    "verificationStatus": "verified"
  },
  {
    "id": "pso-iib-td",
    "recordId": "pso-iib-td",
    "recordTitle": "II.B: BŁONICY, TĘŻCOWI",
    "sourcePart": "II",
    "sourceSubsection": "II.B",
    "sourcePage": [
      26
    ],
    "exactPdfLocator": "Część II.B, str. 26, tabela szczepień zalecanych dorosłym, wiersz nr 12 (BŁONICY, TĘŻCOWI)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "schedule",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.B (str. 26)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.B (str. 26)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.B, str. 26"
      },
      {
        "field": "schedule",
        "sourceFragment": "Kolumna „Uwagi” w tabeli II.B wiersz 12 (str. 26)"
      }
    ],
    "literalExcerptOrAnchor": "II.B. BŁONICY, TĘŻCOWI: Szczepienie zalecane osobom dorosłym, pojedyncza dawka przypominająca co 10 lat szczepionką Td.",
    "verificationStatus": "verified"
  },
  {
    "id": "pso-iib-hpv",
    "recordId": "pso-iib-hpv",
    "recordTitle": "II.B: Zakażeniom LUDZKIMI WIRUSAMI BRODAWCZAKA (HPV)",
    "sourcePart": "II",
    "sourceSubsection": "II.B",
    "sourcePage": [
      26
    ],
    "exactPdfLocator": "Część II.B, str. 26, tabela szczepień zalecanych dorosłym, wiersz nr 13 (Zakażeniom LUDZKIMI WIRUSAMI BRODAWCZAKA (HPV))",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.B (str. 26)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.B (str. 26)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.B, str. 26"
      }
    ],
    "literalExcerptOrAnchor": "II.B. Zakażeniom LUDZKIMI WIRUSAMI BRODAWCZAKA (HPV): Szczepienie zalecane osobom dorosłym w celu uodpornienia przeciw chorobom wywołanym przez HPV.",
    "verificationStatus": "verified",
    "auditNotes": "Oficjalna kolumna „Uwagi” w tabeli II.B PDF jest pusta — zachowano dosłownie."
  },
  {
    "id": "pso-iib-polio",
    "recordId": "pso-iib-polio",
    "recordTitle": "II.B: OSTREMU NAGMINNEMU PORAŻENIU DZIECIĘCEMU (POLIOMYELITIS)",
    "sourcePart": "II",
    "sourceSubsection": "II.B",
    "sourcePage": [
      26
    ],
    "exactPdfLocator": "Część II.B, str. 26, tabela szczepień zalecanych dorosłym, wiersz nr 14 (OSTREMU NAGMINNEMU PORAŻENIU DZIECIĘCEMU (POLIOMYELITIS))",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "schedule",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.B (str. 26)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.B (str. 26)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.B, str. 26"
      },
      {
        "field": "schedule",
        "sourceFragment": "Kolumna „Uwagi” w tabeli II.B wiersz 14 (str. 26)"
      }
    ],
    "literalExcerptOrAnchor": "II.B. OSTREMU NAGMINNEMU PORAŻENIU DZIECIĘCEMU (POLIOMYELITIS): Szczepienie zalecane osobom powyżej 19. roku życia nieszczepionym przeciw OSTREMU NAGMINNEMU PORAŻENIU DZIECIĘCEMU (POLIOMYELITIS) w ramach ",
    "verificationStatus": "verified"
  },
  {
    "id": "pso-iib-varicella",
    "recordId": "pso-iib-varicella",
    "recordTitle": "II.B: OSPIE WIETRZNEJ",
    "sourcePart": "II",
    "sourceSubsection": "II.B",
    "sourcePage": [
      26,
      27
    ],
    "exactPdfLocator": "Część II.B, str. 26–27, tabela szczepień zalecanych dorosłym, wiersz nr 15 (OSPIE WIETRZNEJ)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "schedule",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.B (str. 26–27)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.B (str. 26–27)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.B, str. 26–27"
      },
      {
        "field": "schedule",
        "sourceFragment": "Kolumna „Uwagi” w tabeli II.B wiersz 15 (str. 26–27)"
      }
    ],
    "literalExcerptOrAnchor": "II.B. OSPIE WIETRZNEJ: Szczepienie zalecane osobom, które nie chorowały na OSPĘ WIETRZNĄ i nie zostały wcześniej zaszczepione w ramach szczepień obowiązkowych albo",
    "verificationStatus": "verified"
  },
  {
    "id": "pso-iib-zoster",
    "recordId": "pso-iib-zoster",
    "recordTitle": "II.B: PÓŁPAŚCOWI",
    "sourcePart": "II",
    "sourceSubsection": "II.B",
    "sourcePage": [
      27
    ],
    "exactPdfLocator": "Część II.B, str. 27, tabela szczepień zalecanych dorosłym, wiersz nr 16 (PÓŁPAŚCOWI)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.B (str. 27)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.B (str. 27)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.B, str. 27"
      }
    ],
    "literalExcerptOrAnchor": "II.B. PÓŁPAŚCOWI: Szczepienie zalecane osobom dorosłym, które przebyły pierwotne zakażenie wirusem OSPY WIETRZNEJ (VZV) oraz w szczególności: 1) z wrodzonym l",
    "verificationStatus": "verified",
    "auditNotes": "Oficjalna kolumna „Uwagi” w tabeli II.B PDF jest pusta — zachowano dosłownie."
  },
  {
    "id": "pso-iib-mpox",
    "recordId": "pso-iib-mpox",
    "recordTitle": "II.B: MPOX",
    "sourcePart": "II",
    "sourceSubsection": "II.B",
    "sourcePage": [
      27
    ],
    "exactPdfLocator": "Część II.B, str. 27, tabela szczepień zalecanych dorosłym, wiersz nr 17 (MPOX)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "schedule"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.B (str. 27)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.B (str. 27)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.B, str. 27"
      },
      {
        "field": "schedule",
        "sourceFragment": "Kolumna „Uwagi” w tabeli II.B wiersz 17 (str. 27)"
      }
    ],
    "literalExcerptOrAnchor": "II.B. MPOX: Szczepienie zalecane osobom z grup ryzyka.",
    "verificationStatus": "verified"
  },
  {
    "id": "pso-iic-covid",
    "recordId": "pso-iic-covid",
    "recordTitle": "II.C: COVID-19",
    "sourcePart": "II",
    "sourceSubsection": "II.C",
    "sourcePage": [
      28
    ],
    "exactPdfLocator": "Część II.C, str. 28, tabela szczepień kobiet w ciąży lub planujących ciążę, wiersz nr 1 (COVID-19)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "schedule"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.C (str. 28)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.C (str. 28)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.C, str. 28"
      },
      {
        "field": "schedule",
        "sourceFragment": "Kolumna „Uwagi” / schemat ciążowy w II.C wiersz 1 (str. 28)"
      }
    ],
    "literalExcerptOrAnchor": "II.C. COVID-19: Można podawać przez cały okres ciąży.",
    "verificationStatus": "verified"
  },
  {
    "id": "pso-iic-influenza",
    "recordId": "pso-iic-influenza",
    "recordTitle": "II.C: GRYPIE",
    "sourcePart": "II",
    "sourceSubsection": "II.C",
    "sourcePage": [
      28
    ],
    "exactPdfLocator": "Część II.C, str. 28, tabela szczepień kobiet w ciąży lub planujących ciążę, wiersz nr 2 (GRYPIE)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "schedule",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.C (str. 28)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.C (str. 28)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.C, str. 28"
      },
      {
        "field": "schedule",
        "sourceFragment": "Kolumna „Uwagi” / schemat ciążowy w II.C wiersz 2 (str. 28)"
      }
    ],
    "literalExcerptOrAnchor": "II.C. GRYPIE: Można podawać przez cały okres ciąży.",
    "verificationStatus": "verified"
  },
  {
    "id": "pso-iic-rsv",
    "recordId": "pso-iic-rsv",
    "recordTitle": "II.C: Zakażeniom SYNCYTIALNYM WIRUSEM ODDECHOWYM (RSV)",
    "sourcePart": "II",
    "sourceSubsection": "II.C",
    "sourcePage": [
      28
    ],
    "exactPdfLocator": "Część II.C, str. 28, tabela szczepień kobiet w ciąży lub planujących ciążę, wiersz nr 3 (Zakażeniom SYNCYTIALNYM WIRUSEM ODDECHOWYM (RSV))",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "schedule"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.C (str. 28)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.C (str. 28)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.C, str. 28"
      },
      {
        "field": "schedule",
        "sourceFragment": "Kolumna „Uwagi” / schemat ciążowy w II.C wiersz 3 (str. 28)"
      }
    ],
    "literalExcerptOrAnchor": "II.C. Zakażeniom SYNCYTIALNYM WIRUSEM ODDECHOWYM (RSV): Można podawać od 24. do 36. tygodnia ciąży.",
    "verificationStatus": "verified"
  },
  {
    "id": "pso-iic-tdap",
    "recordId": "pso-iic-tdap",
    "recordTitle": "II.C: BŁONICY, TĘŻCOWI, KRZTUŚCOWI",
    "sourcePart": "II",
    "sourceSubsection": "II.C",
    "sourcePage": [
      28,
      29
    ],
    "exactPdfLocator": "Część II.C, str. 28–29, tabela szczepień kobiet w ciąży lub planujących ciążę, wiersz nr 4 (BŁONICY, TĘŻCOWI, KRZTUŚCOWI)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "schedule",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.C (str. 28–29)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.C (str. 28–29)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.C, str. 28–29"
      },
      {
        "field": "schedule",
        "sourceFragment": "Kolumna „Uwagi” / schemat ciążowy w II.C wiersz 4 (str. 28–29)"
      }
    ],
    "literalExcerptOrAnchor": "II.C. BŁONICY, TĘŻCOWI, KRZTUŚCOWI: Można podawać od ukończenia 27. do 36. tygodnia ciąży, w uzasadnionych przypadkach zagrożenia przedwczesnym porodem – po ukończeniu 20. tygo",
    "verificationStatus": "verified"
  },
  {
    "id": "pso-iid-covid",
    "recordId": "pso-iid-covid",
    "recordTitle": "II.D: COVID-19",
    "sourcePart": "II",
    "sourceSubsection": "II.D",
    "sourcePage": [
      29
    ],
    "exactPdfLocator": "Część II.D, str. 29, tabela szczepień osób wykonujących zawód medyczny, wiersz nr 1 (COVID-19)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.D (str. 29)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.D (str. 29)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.D, str. 29"
      }
    ],
    "literalExcerptOrAnchor": "II.D. COVID-19: Szczepienie zalecane zgodnie z komunikatami Ministra Zdrowia.",
    "verificationStatus": "verified",
    "auditNotes": "Oficjalna kolumna „Uwagi” w tabeli II.D PDF jest pusta — zachowano dosłowne brzmienie."
  },
  {
    "id": "pso-iid-influenza",
    "recordId": "pso-iid-influenza",
    "recordTitle": "II.D: GRYPIE",
    "sourcePart": "II",
    "sourceSubsection": "II.D",
    "sourcePage": [
      29
    ],
    "exactPdfLocator": "Część II.D, str. 29, tabela szczepień osób wykonujących zawód medyczny, wiersz nr 2 (GRYPIE)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.D (str. 29)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.D (str. 29)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.D, str. 29"
      }
    ],
    "literalExcerptOrAnchor": "II.D. GRYPIE: Szczepionki są ważne jeden sezon ze względu na zmiany ich składu według zaleceń Światowej Organizacji Zdrowia.",
    "verificationStatus": "verified",
    "auditNotes": "Oficjalna kolumna „Uwagi” w tabeli II.D PDF jest pusta — zachowano dosłowne brzmienie."
  },
  {
    "id": "pso-iid-tdap",
    "recordId": "pso-iid-tdap",
    "recordTitle": "II.D: BŁONICY, TĘŻCOWI, KRZTUŚCOWI",
    "sourcePart": "II",
    "sourceSubsection": "II.D",
    "sourcePage": [
      29
    ],
    "exactPdfLocator": "Część II.D, str. 29, tabela szczepień osób wykonujących zawód medyczny, wiersz nr 3 (BŁONICY, TĘŻCOWI, KRZTUŚCOWI)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.D (str. 29)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.D (str. 29)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.D, str. 29"
      }
    ],
    "literalExcerptOrAnchor": "II.D. BŁONICY, TĘŻCOWI, KRZTUŚCOWI: Szczepienie przypominające – 1 dawka co 10 lat.",
    "verificationStatus": "verified",
    "auditNotes": "Oficjalna kolumna „Uwagi” w tabeli II.D PDF jest pusta — zachowano dosłowne brzmienie."
  },
  {
    "id": "pso-iid-pneumo",
    "recordId": "pso-iid-pneumo",
    "recordTitle": "II.D: Inwazyjnym zakażeniom STREPTOCOCCUS PNEUMONIAE",
    "sourcePart": "II",
    "sourceSubsection": "II.D",
    "sourcePage": [
      29
    ],
    "exactPdfLocator": "Część II.D, str. 29, tabela szczepień osób wykonujących zawód medyczny, wiersz nr 4 (Inwazyjnym zakażeniom STREPTOCOCCUS PNEUMONIAE)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.D (str. 29)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.D (str. 29)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.D, str. 29"
      }
    ],
    "literalExcerptOrAnchor": "II.D. Inwazyjnym zakażeniom STREPTOCOCCUS PNEUMONIAE: Szczepienie zalecane dla osób wykonujących zawód medyczny w szpitalnych oddziałach pediatrycznych, chorób wewnętrznych oraz geriatrycznych.",
    "verificationStatus": "verified",
    "auditNotes": "Oficjalna kolumna „Uwagi” w tabeli II.D PDF jest pusta — zachowano dosłowne brzmienie."
  },
  {
    "id": "pso-iid-meningo",
    "recordId": "pso-iid-meningo",
    "recordTitle": "II.D: Inwazyjnym zakażeniom NEISSERIA MENINGITIDIS",
    "sourcePart": "II",
    "sourceSubsection": "II.D",
    "sourcePage": [
      29
    ],
    "exactPdfLocator": "Część II.D, str. 29, tabela szczepień osób wykonujących zawód medyczny, wiersz nr 5 (Inwazyjnym zakażeniom NEISSERIA MENINGITIDIS)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.D (str. 29)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.D (str. 29)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.D, str. 29"
      }
    ],
    "literalExcerptOrAnchor": "II.D. Inwazyjnym zakażeniom NEISSERIA MENINGITIDIS: Szczepienie przeciw serogrupie B oraz 4-walentną szczepionką przeciw serogrupom A, C, W, Y zalecane w ramach profilaktyki przedekspozycyjnej",
    "verificationStatus": "verified",
    "auditNotes": "Oficjalna kolumna „Uwagi” w tabeli II.D PDF jest pusta — zachowano dosłowne brzmienie."
  },
  {
    "id": "pso-iid-hav",
    "recordId": "pso-iid-hav",
    "recordTitle": "II.D: WIRUSOWEMU ZAPALENIU WĄTROBY typu A",
    "sourcePart": "II",
    "sourceSubsection": "II.D",
    "sourcePage": [
      29
    ],
    "exactPdfLocator": "Część II.D, str. 29, tabela szczepień osób wykonujących zawód medyczny, wiersz nr 6 (WIRUSOWEMU ZAPALENIU WĄTROBY typu A)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.D (str. 29)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.D (str. 29)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.D, str. 29"
      }
    ],
    "literalExcerptOrAnchor": "II.D. WIRUSOWEMU ZAPALENIU WĄTROBY typu A: Szczepienie zalecane w ramach profilaktyki przedekspozycyjnej osobom wykonującym zawód medyczny, które mają intencjonalny kontakt z chorymi ",
    "verificationStatus": "verified",
    "auditNotes": "Oficjalna kolumna „Uwagi” w tabeli II.D PDF jest pusta — zachowano dosłowne brzmienie."
  },
  {
    "id": "pso-iid-mmr",
    "recordId": "pso-iid-mmr",
    "recordTitle": "II.D: ODRZE, ŚWINCE, RÓŻYCZCE",
    "sourcePart": "II",
    "sourceSubsection": "II.D",
    "sourcePage": [
      29
    ],
    "exactPdfLocator": "Część II.D, str. 29, tabela szczepień osób wykonujących zawód medyczny, wiersz nr 7 (ODRZE, ŚWINCE, RÓŻYCZCE)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.D (str. 29)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.D (str. 29)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.D, str. 29"
      }
    ],
    "literalExcerptOrAnchor": "II.D. ODRZE, ŚWINCE, RÓŻYCZCE: Szczepienie zalecane osobom wykonującym zawód medyczny, które nie mają udokumentowanego uodpornienia przeciw odrze (tj. udokumentowane szcze",
    "verificationStatus": "verified",
    "auditNotes": "Oficjalna kolumna „Uwagi” w tabeli II.D PDF jest pusta — zachowano dosłowne brzmienie."
  },
  {
    "id": "pso-iid-vzv",
    "recordId": "pso-iid-vzv",
    "recordTitle": "II.D: OSPIE WIETRZNEJ",
    "sourcePart": "II",
    "sourceSubsection": "II.D",
    "sourcePage": [
      29,
      30
    ],
    "exactPdfLocator": "Część II.D, str. 29–30, tabela szczepień osób wykonujących zawód medyczny, wiersz nr 8 (OSPIE WIETRZNEJ)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.D (str. 29–30)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.D (str. 29–30)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.D, str. 29–30"
      }
    ],
    "literalExcerptOrAnchor": "II.D. OSPIE WIETRZNEJ: Szczepienie zalecane osobom wykonującym zawód medyczny, które nie chorowały na ospę wietrzną lub nie otrzymały pełnego schematu szczepień (2",
    "verificationStatus": "verified",
    "auditNotes": "Oficjalna kolumna „Uwagi” w tabeli II.D PDF jest pusta — zachowano dosłowne brzmienie."
  },
  {
    "id": "pso-iid-typhoid",
    "recordId": "pso-iid-typhoid",
    "recordTitle": "II.D: DUROWI BRZUSZNEMU",
    "sourcePart": "II",
    "sourceSubsection": "II.D",
    "sourcePage": [
      30
    ],
    "exactPdfLocator": "Część II.D, str. 30, tabela szczepień osób wykonujących zawód medyczny, wiersz nr 9 (DUROWI BRZUSZNEMU)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.D (str. 30)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.D (str. 30)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.D, str. 30"
      }
    ],
    "literalExcerptOrAnchor": "II.D. DUROWI BRZUSZNEMU: Szczepienie zalecane w ramach profilaktyki przedekspozycyjnej osobom wykonującym zawód medyczny, które mają intencjonalny kontakt z chorymi ",
    "verificationStatus": "verified",
    "auditNotes": "Oficjalna kolumna „Uwagi” w tabeli II.D PDF jest pusta — zachowano dosłowne brzmienie."
  },
  {
    "id": "pso-iid-mpox",
    "recordId": "pso-iid-mpox",
    "recordTitle": "II.D: MPOX",
    "sourcePart": "II",
    "sourceSubsection": "II.D",
    "sourcePage": [
      30
    ],
    "exactPdfLocator": "Część II.D, str. 30, tabela szczepień osób wykonujących zawód medyczny, wiersz nr 10 (MPOX)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.D (str. 30)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.D (str. 30)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.D, str. 30"
      }
    ],
    "literalExcerptOrAnchor": "II.D. MPOX: Szczepienie zalecane w ramach profilaktyki przedekspozycyjnej osobom wykonującym zawód medyczny, które mają intencjonalny kontakt z chorymi ",
    "verificationStatus": "verified",
    "auditNotes": "Oficjalna kolumna „Uwagi” w tabeli II.D PDF jest pusta — zachowano dosłowne brzmienie."
  },
  {
    "id": "pso-iie-edu-care",
    "recordId": "pso-iie-edu-care",
    "recordTitle": "II.E: Pracownicy sektora edukacji i opieki społecznej",
    "sourcePart": "II",
    "sourceSubsection": "II.E",
    "sourcePage": [
      30
    ],
    "exactPdfLocator": "Część II.E, str. 30, tabela innych grup pracowników narażonych na zakażenie, wiersz nr 1 (Pracownicy sektora edukacji i opieki społecznej)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.E (str. 30)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.E (str. 30)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.E, str. 30"
      }
    ],
    "literalExcerptOrAnchor": "II.E. Pracownicy sektora edukacji i opieki społecznej: – szczepienie przeciw COVID-19, – szczepienie przeciw GRYPIE, – szczepienie przeciw KRZTUŚCOWI, TĘŻCOWI, BŁONICY, – szczepienie przeciw ODRZ",
    "verificationStatus": "verified",
    "auditNotes": "Wstęp II.E wskazuje na finansowanie w całości przez pracodawców (art. 20 ustawy z 5.12.2008 r.). Kolumna „Uwagi” w PDF jest pusta."
  },
  {
    "id": "pso-iie-tourism",
    "recordId": "pso-iie-tourism",
    "recordTitle": "II.E: Pracownicy sektora turystycznego",
    "sourcePart": "II",
    "sourceSubsection": "II.E",
    "sourcePage": [
      30
    ],
    "exactPdfLocator": "Część II.E, str. 30, tabela innych grup pracowników narażonych na zakażenie, wiersz nr 2 (Pracownicy sektora turystycznego)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.E (str. 30)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.E (str. 30)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.E, str. 30"
      }
    ],
    "literalExcerptOrAnchor": "II.E. Pracownicy sektora turystycznego: – szczepienie przeciw COVID-19, – szczepienie przeciw GRYPIE, – szczepienie przeciw KRZTUŚCOWI, TĘŻCOWI i BŁONICY, – szczepienie przeciw ODR",
    "verificationStatus": "verified",
    "auditNotes": "Wstęp II.E wskazuje na finansowanie w całości przez pracodawców (art. 20 ustawy z 5.12.2008 r.). Kolumna „Uwagi” w PDF jest pusta."
  },
  {
    "id": "pso-iie-gastronomy",
    "recordId": "pso-iie-gastronomy",
    "recordTitle": "II.E: Pracownicy sektora gastronomicznego",
    "sourcePart": "II",
    "sourceSubsection": "II.E",
    "sourcePage": [
      30,
      31
    ],
    "exactPdfLocator": "Część II.E, str. 30–31, tabela innych grup pracowników narażonych na zakażenie, wiersz nr 3 (Pracownicy sektora gastronomicznego)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.E (str. 30–31)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.E (str. 30–31)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.E, str. 30–31"
      }
    ],
    "literalExcerptOrAnchor": "II.E. Pracownicy sektora gastronomicznego: – szczepienie przeciw COVID-19, – szczepienie przeciw WZW typu A, – szczepienie przeciw GRYPIE.",
    "verificationStatus": "verified",
    "auditNotes": "Wstęp II.E wskazuje na finansowanie w całości przez pracodawców (art. 20 ustawy z 5.12.2008 r.). Kolumna „Uwagi” w PDF jest pusta."
  },
  {
    "id": "pso-iie-municipal",
    "recordId": "pso-iie-municipal",
    "recordTitle": "II.E: Pracownicy sektora komunalnego",
    "sourcePart": "II",
    "sourceSubsection": "II.E",
    "sourcePage": [
      31
    ],
    "exactPdfLocator": "Część II.E, str. 31, tabela innych grup pracowników narażonych na zakażenie, wiersz nr 4 (Pracownicy sektora komunalnego)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.E (str. 31)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.E (str. 31)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.E, str. 31"
      }
    ],
    "literalExcerptOrAnchor": "II.E. Pracownicy sektora komunalnego: – szczepienie przeciw COVID-19, – szczepienie przeciw TĘŻCOWI, BŁONICY i KRZTUŚCOWI, POLIOMYELITIS, – szczepienie przeciw WZW typu A, – szcz",
    "verificationStatus": "verified",
    "auditNotes": "Wstęp II.E wskazuje na finansowanie w całości przez pracodawców (art. 20 ustawy z 5.12.2008 r.). Kolumna „Uwagi” w PDF jest pusta."
  },
  {
    "id": "pso-iie-agri-forest",
    "recordId": "pso-iie-agri-forest",
    "recordTitle": "II.E: Pracownicy sektora rolnego i leśnego",
    "sourcePart": "II",
    "sourceSubsection": "II.E",
    "sourcePage": [
      31
    ],
    "exactPdfLocator": "Część II.E, str. 31, tabela innych grup pracowników narażonych na zakażenie, wiersz nr 5 (Pracownicy sektora rolnego i leśnego)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.E (str. 31)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.E (str. 31)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.E, str. 31"
      }
    ],
    "literalExcerptOrAnchor": "II.E. Pracownicy sektora rolnego i leśnego: – szczepienie przeciw TĘŻCOWI, BŁONICY, KRZTUŚCOWI, – szczepienie przeciw KLESZCZOWEMU ZAPALENIU MÓZGU, – szczepienie przeciw WŚCIEKLIŹNIE, ",
    "verificationStatus": "verified",
    "auditNotes": "Wstęp II.E wskazuje na finansowanie w całości przez pracodawców (art. 20 ustawy z 5.12.2008 r.). Kolumna „Uwagi” w PDF jest pusta."
  },
  {
    "id": "pso-iie-transport-build",
    "recordId": "pso-iie-transport-build",
    "recordTitle": "II.E: Pracownicy sektora transportu i budownictwa",
    "sourcePart": "II",
    "sourceSubsection": "II.E",
    "sourcePage": [
      31
    ],
    "exactPdfLocator": "Część II.E, str. 31, tabela innych grup pracowników narażonych na zakażenie, wiersz nr 6 (Pracownicy sektora transportu i budownictwa)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.E (str. 31)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.E (str. 31)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.E, str. 31"
      }
    ],
    "literalExcerptOrAnchor": "II.E. Pracownicy sektora transportu i budownictwa: – szczepienie przeciw TĘŻCOWI (skojarzone ze szczepieniem przeciw BŁONICY i KRZTUŚCOWI), – szczepienie przeciw KLESZCZOWEMU ZAPALENIU MÓZGU,",
    "verificationStatus": "verified",
    "auditNotes": "Wstęp II.E wskazuje na finansowanie w całości przez pracodawców (art. 20 ustawy z 5.12.2008 r.). Kolumna „Uwagi” w PDF jest pusta."
  },
  {
    "id": "pso-iie-uniformed",
    "recordId": "pso-iie-uniformed",
    "recordTitle": "II.E: Służby mundurowe",
    "sourcePart": "II",
    "sourceSubsection": "II.E",
    "sourcePage": [
      31
    ],
    "exactPdfLocator": "Część II.E, str. 31, tabela innych grup pracowników narażonych na zakażenie, wiersz nr 7 (Służby mundurowe)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.E (str. 31)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.E (str. 31)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.E, str. 31"
      }
    ],
    "literalExcerptOrAnchor": "II.E. Służby mundurowe: – szczepienie przeciw COVID-19, – szczepienie przeciw GRYPIE, – szczepienie przeciw TĘŻCOWI, BŁONICY, KRZTUŚCOWI, POLIO, – szczepienie przec",
    "verificationStatus": "verified",
    "auditNotes": "Wstęp II.E wskazuje na finansowanie w całości przez pracodawców (art. 20 ustawy z 5.12.2008 r.). Kolumna „Uwagi” w PDF jest pusta."
  },
  {
    "id": "pso-iie-soldiers",
    "recordId": "pso-iie-soldiers",
    "recordTitle": "II.E: Żołnierze czynnej służby wojskowej",
    "sourcePart": "II",
    "sourceSubsection": "II.E",
    "sourcePage": [
      31
    ],
    "exactPdfLocator": "Część II.E, str. 31, tabela innych grup pracowników narażonych na zakażenie, wiersz nr 8 (Żołnierze czynnej służby wojskowej)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.E (str. 31)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.E (str. 31)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.E, str. 31"
      }
    ],
    "literalExcerptOrAnchor": "II.E. Żołnierze czynnej służby wojskowej: Zgodnie z Kalendarzem szczepień ochronnych dla żołnierzy czynnej służby wojskowej.",
    "verificationStatus": "verified",
    "auditNotes": "Wstęp II.E wskazuje na finansowanie w całości przez pracodawców (art. 20 ustawy z 5.12.2008 r.). Kolumna „Uwagi” w PDF jest pusta."
  },
  {
    "id": "pso-iif-measles",
    "recordId": "pso-iif-measles",
    "recordTitle": "II.F: ODRZE",
    "sourcePart": "II",
    "sourceSubsection": "II.F",
    "sourcePage": [
      32
    ],
    "exactPdfLocator": "Część II.F, str. 32, tabela szczepień zalecanych poekspozycyjnych, wiersz nr 1 (ODRZE)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "schedule",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.F (str. 32)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.F (str. 32)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.F, str. 32"
      },
      {
        "field": "schedule",
        "sourceFragment": "Okna czasowe / schemat PEP w tabeli II.F wiersz 1 (str. 32)"
      }
    ],
    "literalExcerptOrAnchor": "II.F. ODRZE: Szczepienie zalecane dla osób nieszczepionych lub niemających udokumentowanego szczepienia lub przechorowania odry, które przebywają w środo",
    "verificationStatus": "verified"
  },
  {
    "id": "pso-iif-varicella",
    "recordId": "pso-iif-varicella",
    "recordTitle": "II.F: OSPIE WIETRZNEJ",
    "sourcePart": "II",
    "sourceSubsection": "II.F",
    "sourcePage": [
      32
    ],
    "exactPdfLocator": "Część II.F, str. 32, tabela szczepień zalecanych poekspozycyjnych, wiersz nr 2 (OSPIE WIETRZNEJ)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "schedule",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.F (str. 32)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.F (str. 32)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.F, str. 32"
      },
      {
        "field": "schedule",
        "sourceFragment": "Okna czasowe / schemat PEP w tabeli II.F wiersz 2 (str. 32)"
      }
    ],
    "literalExcerptOrAnchor": "II.F. OSPIE WIETRZNEJ: Szczepienie zalecane dla osób, które miały bliską styczność z osobą chorą na OSPĘ WIETRZNĄ, a które dotychczas nie chorowały na OSPĘ WIETRZN",
    "verificationStatus": "verified"
  },
  {
    "id": "pso-iif-hav",
    "recordId": "pso-iif-hav",
    "recordTitle": "II.F: WIRUSOWEMU ZAPALENIU WĄTROBY typu A",
    "sourcePart": "II",
    "sourceSubsection": "II.F",
    "sourcePage": [
      32,
      33
    ],
    "exactPdfLocator": "Część II.F, str. 32–33, tabela szczepień zalecanych poekspozycyjnych, wiersz nr 3 (WIRUSOWEMU ZAPALENIU WĄTROBY typu A)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "schedule",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.F (str. 32–33)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.F (str. 32–33)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.F, str. 32–33"
      },
      {
        "field": "schedule",
        "sourceFragment": "Okna czasowe / schemat PEP w tabeli II.F wiersz 3 (str. 32–33)"
      }
    ],
    "literalExcerptOrAnchor": "II.F. WIRUSOWEMU ZAPALENIU WĄTROBY typu A: Szczepienie zalecane osobom, które miały bliską styczność z osobą chorą na WIRUSOWE ZAPALENIE WĄTROBY typu A.",
    "verificationStatus": "verified"
  },
  {
    "id": "pso-iif-hbv",
    "recordId": "pso-iif-hbv",
    "recordTitle": "II.F: WIRUSOWEMU ZAPALENIU WĄTROBY typu B",
    "sourcePart": "II",
    "sourceSubsection": "II.F",
    "sourcePage": [
      33
    ],
    "exactPdfLocator": "Część II.F, str. 33, tabela szczepień zalecanych poekspozycyjnych, wiersz nr 4 (WIRUSOWEMU ZAPALENIU WĄTROBY typu B)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "schedule",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.F (str. 33)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.F (str. 33)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.F, str. 33"
      },
      {
        "field": "schedule",
        "sourceFragment": "Okna czasowe / schemat PEP w tabeli II.F wiersz 4 (str. 33)"
      }
    ],
    "literalExcerptOrAnchor": "II.F. WIRUSOWEMU ZAPALENIU WĄTROBY typu B: Szczepienie zalecane osobom, które miały kontakt z materiałem potencjalnie zakaźnym (np. krwią, płynami ustrojowymi) i u których istnieje ry",
    "verificationStatus": "verified",
    "auditNotes": "Szczegółowa macierz postępowania poekspozycyjnego HBV znajduje się w Części II.G (str. 34)."
  },
  {
    "id": "pso-iih-rsv-passive",
    "recordId": "pso-iih-rsv-passive",
    "recordTitle": "II.H: Uodpornienie bierne przeciw RSV",
    "sourcePart": "II",
    "sourceSubsection": "II.H",
    "sourcePage": [
      34
    ],
    "exactPdfLocator": "Część II.H, str. 34, blok uodpornienia biernego przeciw RSV (Nirsewimab)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "schedule"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.H (str. 34)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.H (str. 34)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.H, str. 34"
      },
      {
        "field": "schedule",
        "sourceFragment": "Wskazania i uwagi w II.H (str. 34)"
      }
    ],
    "literalExcerptOrAnchor": "II.H. Uodpornienie bierne przeciw RSV: Zalecane noworodkom, niemowlętom w ich pierwszym sezonie RSV oraz dzieciom do 2 lat narażonych w szczególny sposób na ciężki przebieg zakaże",
    "verificationStatus": "verified"
  },
  {
    "id": "pso-iii-travel-cholera",
    "recordId": "pso-iii-travel-cholera",
    "recordTitle": "II.I: CHOLERZE",
    "sourcePart": "II",
    "sourceSubsection": "II.I",
    "sourcePage": [
      35
    ],
    "exactPdfLocator": "Część II.I, str. 35, tabela szczepień przed podróżą zagraniczną, wiersz nr 1 (CHOLERZE)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "schedule"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.I (str. 35)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.I (str. 35)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.I, str. 35"
      },
      {
        "field": "schedule",
        "sourceFragment": "Kolumna „Uwagi” / obszary endemiczne w II.I wiersz 1 (str. 35)"
      }
    ],
    "literalExcerptOrAnchor": "II.I. CHOLERZE: Szczepienie zalecane osobom planującym pobyt w regionie występowania zagrożenia zakażeniem przecinkowca CHOLERY, w zależności od lokalnej sy",
    "verificationStatus": "verified"
  },
  {
    "id": "pso-iii-travel-typhoid",
    "recordId": "pso-iii-travel-typhoid",
    "recordTitle": "II.I: DUROWI BRZUSZNEMU",
    "sourcePart": "II",
    "sourceSubsection": "II.I",
    "sourcePage": [
      35
    ],
    "exactPdfLocator": "Część II.I, str. 35, tabela szczepień przed podróżą zagraniczną, wiersz nr 2 (DUROWI BRZUSZNEMU)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "schedule"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.I (str. 35)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.I (str. 35)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.I, str. 35"
      },
      {
        "field": "schedule",
        "sourceFragment": "Kolumna „Uwagi” / obszary endemiczne w II.I wiersz 2 (str. 35)"
      }
    ],
    "literalExcerptOrAnchor": "II.I. DUROWI BRZUSZNEMU: Szczepienie zalecane osobom planującym pobyt w regionie występowania zagrożenia zakażeniem pałeczką DURU BRZUSZNEGO, w zależności od lokalne",
    "verificationStatus": "verified"
  },
  {
    "id": "pso-iii-travel-hav",
    "recordId": "pso-iii-travel-hav",
    "recordTitle": "II.I: WIRUSOWEMU ZAPALENIU WĄTROBY typu A",
    "sourcePart": "II",
    "sourceSubsection": "II.I",
    "sourcePage": [
      35
    ],
    "exactPdfLocator": "Część II.I, str. 35, tabela szczepień przed podróżą zagraniczną, wiersz nr 3 (WIRUSOWEMU ZAPALENIU WĄTROBY typu A)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "schedule",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.I (str. 35)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.I (str. 35)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.I, str. 35"
      },
      {
        "field": "schedule",
        "sourceFragment": "Kolumna „Uwagi” / obszary endemiczne w II.I wiersz 3 (str. 35)"
      }
    ],
    "literalExcerptOrAnchor": "II.I. WIRUSOWEMU ZAPALENIU WĄTROBY typu A: Szczepienie zalecane osobom wyjeżdżającym do krajów o wysokiej i pośredniej endemiczności zachorowań na wirusowe zapalenie wątroby typu A, o",
    "verificationStatus": "verified"
  },
  {
    "id": "pso-iii-travel-rabies",
    "recordId": "pso-iii-travel-rabies",
    "recordTitle": "II.I: WŚCIEKLIŹNIE",
    "sourcePart": "II",
    "sourceSubsection": "II.I",
    "sourcePage": [
      35
    ],
    "exactPdfLocator": "Część II.I, str. 35, tabela szczepień przed podróżą zagraniczną, wiersz nr 4 (WŚCIEKLIŹNIE)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "schedule",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.I (str. 35)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.I (str. 35)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.I, str. 35"
      },
      {
        "field": "schedule",
        "sourceFragment": "Kolumna „Uwagi” / obszary endemiczne w II.I wiersz 4 (str. 35)"
      }
    ],
    "literalExcerptOrAnchor": "II.I. WŚCIEKLIŹNIE: Szczepienie zalecane osobom planującym pobyt w regionie występowania zagrożenia zakażeniem wirusem WŚCIEKLIZNY.",
    "verificationStatus": "verified"
  },
  {
    "id": "pso-iii-travel-polio",
    "recordId": "pso-iii-travel-polio",
    "recordTitle": "II.I: OSTREMU NAGMINNEMU PORAŻENIU DZIECIĘCEMU (POLIOMYELITIS)",
    "sourcePart": "II",
    "sourceSubsection": "II.I",
    "sourcePage": [
      35
    ],
    "exactPdfLocator": "Część II.I, str. 35, tabela szczepień przed podróżą zagraniczną, wiersz nr 5 (OSTREMU NAGMINNEMU PORAŻENIU DZIECIĘCEMU (POLIOMYELITIS))",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "schedule",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.I (str. 35)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.I (str. 35)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.I, str. 35"
      },
      {
        "field": "schedule",
        "sourceFragment": "Kolumna „Uwagi” / obszary endemiczne w II.I wiersz 5 (str. 35)"
      }
    ],
    "literalExcerptOrAnchor": "II.I. OSTREMU NAGMINNEMU PORAŻENIU DZIECIĘCEMU (POLIOMYELITIS): Szczepienie zalecane osobom planującym pobyt w regionie występowania zagrożenia zakażeniem wirusem OSTREGO NAGMINNEGO PORAŻENIA DZIECIĘCEGO ",
    "verificationStatus": "verified"
  },
  {
    "id": "pso-iii-travel-je",
    "recordId": "pso-iii-travel-je",
    "recordTitle": "II.I: JAPOŃSKIEMU ZAPALENIU MÓZGU",
    "sourcePart": "II",
    "sourceSubsection": "II.I",
    "sourcePage": [
      35
    ],
    "exactPdfLocator": "Część II.I, str. 35, tabela szczepień przed podróżą zagraniczną, wiersz nr 6 (JAPOŃSKIEMU ZAPALENIU MÓZGU)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "schedule"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.I (str. 35)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.I (str. 35)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.I, str. 35"
      },
      {
        "field": "schedule",
        "sourceFragment": "Kolumna „Uwagi” / obszary endemiczne w II.I wiersz 6 (str. 35)"
      }
    ],
    "literalExcerptOrAnchor": "II.I. JAPOŃSKIEMU ZAPALENIU MÓZGU: Szczepienie zalecane osobom planującym pobyt w regionie występowania zagrożenia zakażeniem wirusem JAPOŃSKIEGO ZAPALENIA MÓZGU.",
    "verificationStatus": "verified"
  },
  {
    "id": "pso-iii-travel-yf",
    "recordId": "pso-iii-travel-yf",
    "recordTitle": "II.I: ŻÓŁTEJ GORĄCZCE",
    "sourcePart": "II",
    "sourceSubsection": "II.I",
    "sourcePage": [
      35
    ],
    "exactPdfLocator": "Część II.I, str. 35, tabela szczepień przed podróżą zagraniczną, wiersz nr 7 (ŻÓŁTEJ GORĄCZCE)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "schedule"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.I (str. 35)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.I (str. 35)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.I, str. 35"
      },
      {
        "field": "schedule",
        "sourceFragment": "Kolumna „Uwagi” / obszary endemiczne w II.I wiersz 7 (str. 35)"
      }
    ],
    "literalExcerptOrAnchor": "II.I. ŻÓŁTEJ GORĄCZCE: Szczepienie zalecane osobom planującym pobyt w regionie występowania zagrożenia zakażeniem wirusem ŻÓŁTEJ GORĄCZKI.",
    "verificationStatus": "verified"
  },
  {
    "id": "pso-iii-travel-dengue",
    "recordId": "pso-iii-travel-dengue",
    "recordTitle": "II.I: CHOROBIE DENGA",
    "sourcePart": "II",
    "sourceSubsection": "II.I",
    "sourcePage": [
      35
    ],
    "exactPdfLocator": "Część II.I, str. 35, tabela szczepień przed podróżą zagraniczną, wiersz nr 8 (CHOROBIE DENGA)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "schedule"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.I (str. 35)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.I (str. 35)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.I, str. 35"
      },
      {
        "field": "schedule",
        "sourceFragment": "Kolumna „Uwagi” / obszary endemiczne w II.I wiersz 8 (str. 35)"
      }
    ],
    "literalExcerptOrAnchor": "II.I. CHOROBIE DENGA: Szczepienie zalecane osobom planującym pobyt w regionie występowania zagrożenia zakażeniem wirusem DENGA.",
    "verificationStatus": "verified"
  },
  {
    "id": "pso-iii-travel-chikungunya",
    "recordId": "pso-iii-travel-chikungunya",
    "recordTitle": "II.I: WIRUSOWI CHIKUNGUNYA",
    "sourcePart": "II",
    "sourceSubsection": "II.I",
    "sourcePage": [
      35
    ],
    "exactPdfLocator": "Część II.I, str. 35, tabela szczepień przed podróżą zagraniczną, wiersz nr 9 (WIRUSOWI CHIKUNGUNYA)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "schedule"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.I (str. 35)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.I (str. 35)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.I, str. 35"
      },
      {
        "field": "schedule",
        "sourceFragment": "Kolumna „Uwagi” / obszary endemiczne w II.I wiersz 9 (str. 35)"
      }
    ],
    "literalExcerptOrAnchor": "II.I. WIRUSOWI CHIKUNGUNYA: Szczepienie zalecane osobom planującym pobyt w regionie występowania zagrożenia zakażeniem wirusem CHIKUNGUNYA.",
    "verificationStatus": "verified"
  },
  {
    "id": "pso-iii-travel-meningo",
    "recordId": "pso-iii-travel-meningo",
    "recordTitle": "II.I: Inwazyjnym zakażeniom NEISSERIA MENINGITIDIS",
    "sourcePart": "II",
    "sourceSubsection": "II.I",
    "sourcePage": [
      35
    ],
    "exactPdfLocator": "Część II.I, str. 35, tabela szczepień przed podróżą zagraniczną, wiersz nr 10 (Inwazyjnym zakażeniom NEISSERIA MENINGITIDIS)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "schedule",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.I (str. 35)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.I (str. 35)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.I, str. 35"
      },
      {
        "field": "schedule",
        "sourceFragment": "Kolumna „Uwagi” / obszary endemiczne w II.I wiersz 10 (str. 35)"
      }
    ],
    "literalExcerptOrAnchor": "II.I. Inwazyjnym zakażeniom NEISSERIA MENINGITIDIS: Szczepienie zalecane osobom planującym pobyt w regionie występowania zagrożenia zakażeniem NEISSERIA MENINGITIDIS. W zależności od lokalnej ",
    "verificationStatus": "verified"
  },
  {
    "id": "rec-iig-hbv-pep",
    "recordId": "rec-iig-hbv-pep",
    "recordTitle": "Zalecana profilaktyka poekspozycyjna przeciw WZW typu B (macierz HBsAg)",
    "sourcePart": "II",
    "sourceSubsection": "II.G",
    "sourcePage": [
      34
    ],
    "exactPdfLocator": "Część II.G, str. 34, macierz 5×3 postępowania poekspozycyjnego po narażeniu na HBV",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "schedule",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w II.G (str. 34)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w II.G (str. 34)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część II.G, str. 34"
      },
      {
        "field": "schedule",
        "sourceFragment": "Komórki macierzy HBsAg(+)/(−)/nieznany (str. 34)"
      }
    ],
    "literalExcerptOrAnchor": "II.G. SWOISTE ZAPOBIEGANIE WIRUSOWEMU ZAPALENIU WĄTROBY TYPU B (HBV) — 5 kategorii statusu osoby eksponowanej × 3 statusy źródła",
    "verificationStatus": "verified"
  },
  {
    "id": "pso-iii-a",
    "recordId": "pso-iii-a",
    "recordTitle": "III.A: Szczepienia dzieci urodzonych przedwcześnie",
    "sourcePart": "III",
    "sourceSubsection": "III.A",
    "sourcePage": [
      36
    ],
    "exactPdfLocator": "Część III (III.A), str. 36, wytyczne uzupełniające (3 punktów)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w III.A (str. 36)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w III.A (str. 36)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część III.A, str. 36"
      }
    ],
    "literalExcerptOrAnchor": "Szczepienia dzieci urodzonych przedwcześnie — 1. Zalecane jest szczepienie dzieci urodzonych przedwcześnie zgodnie z ich wiekiem chronologicznym, tj. liczonym ",
    "verificationStatus": "verified"
  },
  {
    "id": "pso-iii-b",
    "recordId": "pso-iii-b",
    "recordTitle": "III.B: Szczepienia przeciw gruźlicy",
    "sourcePart": "III",
    "sourceSubsection": "III.B",
    "sourcePage": [
      36,
      37
    ],
    "exactPdfLocator": "Część III (III.B), str. 36–37, wytyczne uzupełniające (11 punktów)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w III.B (str. 36–37)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w III.B (str. 36–37)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część III.B, str. 36–37"
      }
    ],
    "literalExcerptOrAnchor": "Szczepienia przeciw gruźlicy — 1. Zaleca się przeprowadzenie szczepienia przeciw GRUŹLICY po dokładnej ocenie stanu zdrowia dziecka celem wykluc",
    "verificationStatus": "verified"
  },
  {
    "id": "pso-iii-c",
    "recordId": "pso-iii-c",
    "recordTitle": "III.C: Szczepienia przeciw WZW typu B",
    "sourcePart": "III",
    "sourceSubsection": "III.C",
    "sourcePage": [
      37,
      38
    ],
    "exactPdfLocator": "Część III (III.C), str. 37–38, wytyczne uzupełniające (10 punktów)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w III.C (str. 37–38)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w III.C (str. 37–38)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część III.C, str. 37–38"
      }
    ],
    "literalExcerptOrAnchor": "Szczepienia przeciw WZW typu B — 1. Szczepienia podstawowe noworodków i niemowląt są wykonywane według schematu obejmującego 3-dawkowy schemat szc",
    "verificationStatus": "verified"
  },
  {
    "id": "pso-iii-d",
    "recordId": "pso-iii-d",
    "recordTitle": "III.D: Szczepienia przeciw zakażeniom wywołanym przez rotawirusy",
    "sourcePart": "III",
    "sourceSubsection": "III.D",
    "sourcePage": [
      38
    ],
    "exactPdfLocator": "Część III (III.D), str. 38, wytyczne uzupełniające (9 punktów)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w III.D (str. 38)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w III.D (str. 38)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część III.D, str. 38"
      }
    ],
    "literalExcerptOrAnchor": "Szczepienia przeciw zakażeniom wywołanym przez rotawirusy — 1. Szczepienie przeciw zakażeniom wywołanym przez ROTAWIRUSY przeprowadza się w schemacie 2-dawkowym lub 3-dawkow",
    "verificationStatus": "verified"
  },
  {
    "id": "pso-iii-e",
    "recordId": "pso-iii-e",
    "recordTitle": "III.E: Szczepienia przeciw błonicy, tężcowi i krztuścowi",
    "sourcePart": "III",
    "sourceSubsection": "III.E",
    "sourcePage": [
      39
    ],
    "exactPdfLocator": "Część III (III.E), str. 39, wytyczne uzupełniające (4 punktów)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w III.E (str. 39)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w III.E (str. 39)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część III.E, str. 39"
      }
    ],
    "literalExcerptOrAnchor": "Szczepienia przeciw błonicy, tężcowi i krztuścowi — 1. Szczepienia podstawowe przeciw BŁONICY, TĘŻCOWI i KRZTUŚCOWI są przeprowadzane szczepionką błoniczo-tężcowo-kr",
    "verificationStatus": "verified"
  },
  {
    "id": "pso-iii-f",
    "recordId": "pso-iii-f",
    "recordTitle": "III.F: Szczepienia przeciw ostremu nagminnemu porażeniu dziecięcemu (POLIOMYELITIS)",
    "sourcePart": "III",
    "sourceSubsection": "III.F",
    "sourcePage": [
      39
    ],
    "exactPdfLocator": "Część III (III.F), str. 39, wytyczne uzupełniające (3 punktów)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w III.F (str. 39)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w III.F (str. 39)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część III.F, str. 39"
      }
    ],
    "literalExcerptOrAnchor": "Szczepienia przeciw ostremu nagminnemu porażeniu dziecięcemu (POLIOMYELITIS) — 1. Pierwszą dawkę szczepienia przeciw OSTREMU NAGMINNEMU PORAŻENIU DZIECIĘCEMU (POLIOMYELITIS) podaje się w 4. mi",
    "verificationStatus": "verified"
  },
  {
    "id": "pso-iii-g",
    "recordId": "pso-iii-g",
    "recordTitle": "III.G: Szczepienia przeciw inwazyjnemu zakażeniu HAEMOPHILUS INFLUENZAE typu b",
    "sourcePart": "III",
    "sourceSubsection": "III.G",
    "sourcePage": [
      40
    ],
    "exactPdfLocator": "Część III (III.G), str. 40, wytyczne uzupełniające (4 punktów)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w III.G (str. 40)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w III.G (str. 40)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część III.G, str. 40"
      }
    ],
    "literalExcerptOrAnchor": "Szczepienia przeciw inwazyjnemu zakażeniu HAEMOPHILUS INFLUENZAE typu b — 1. Pełen schemat szczepienia przeciw inwazyjnemu zakażeniu HAEMOPHILUS INFLUENZAE typu b powinien składać się z t",
    "verificationStatus": "verified"
  },
  {
    "id": "pso-iii-h",
    "recordId": "pso-iii-h",
    "recordTitle": "III.H: Szczepienia przeciw inwazyjnym zakażeniom STREPTOCOCCUS PNEUMONIAE",
    "sourcePart": "III",
    "sourceSubsection": "III.H",
    "sourcePage": [
      40
    ],
    "exactPdfLocator": "Część III (III.H), str. 40, wytyczne uzupełniające (3 punktów)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w III.H (str. 40)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w III.H (str. 40)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część III.H, str. 40"
      }
    ],
    "literalExcerptOrAnchor": "Szczepienia przeciw inwazyjnym zakażeniom STREPTOCOCCUS PNEUMONIAE — 1. Szczepienie przeciw inwazyjnym zakażeniom STREPTOCOCCUS PNEUMONIAE jest wykonywane w populacji ogólnej jako ob",
    "verificationStatus": "verified"
  },
  {
    "id": "pso-iii-i",
    "recordId": "pso-iii-i",
    "recordTitle": "III.I: Szczepienia przeciw inwazyjnym zakażeniom NEISSERIA MENINGITIDIS",
    "sourcePart": "III",
    "sourceSubsection": "III.I",
    "sourcePage": [
      40
    ],
    "exactPdfLocator": "Część III (III.I), str. 40, wytyczne uzupełniające (2 punktów)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w III.I (str. 40)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w III.I (str. 40)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część III.I, str. 40"
      }
    ],
    "literalExcerptOrAnchor": "Szczepienia przeciw inwazyjnym zakażeniom NEISSERIA MENINGITIDIS — 1. Dostępne szczepionki chronią przed różnymi serogrupami meningokoków, najczęściej spotykanymi w populacji. Wyró",
    "verificationStatus": "verified"
  },
  {
    "id": "pso-iii-j",
    "recordId": "pso-iii-j",
    "recordTitle": "III.J: Szczepienia przeciw ospie wietrznej",
    "sourcePart": "III",
    "sourceSubsection": "III.J",
    "sourcePage": [
      41
    ],
    "exactPdfLocator": "Część III (III.J), str. 41, wytyczne uzupełniające (2 punktów)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w III.J (str. 41)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w III.J (str. 41)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część III.J, str. 41"
      }
    ],
    "literalExcerptOrAnchor": "Szczepienia przeciw ospie wietrznej — 1. Pełny schemat szczepienia przeciw OSPIE WIETRZNEJ obejmuje podanie 2 dawek szczepionki, niezależnie od wieku o",
    "verificationStatus": "verified"
  },
  {
    "id": "pso-iii-k",
    "recordId": "pso-iii-k",
    "recordTitle": "III.K: Szczepienia przeciw półpaścowi",
    "sourcePart": "III",
    "sourceSubsection": "III.K",
    "sourcePage": [
      41
    ],
    "exactPdfLocator": "Część III (III.K), str. 41, wytyczne uzupełniające (2 punktów)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w III.K (str. 41)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w III.K (str. 41)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część III.K, str. 41"
      }
    ],
    "literalExcerptOrAnchor": "Szczepienia przeciw półpaścowi — 1. Pełny schemat szczepienia przeciw PÓŁPAŚCOWI obejmuje podanie 2 dawek szczepionki, podanych w odstępie 2–6 mie",
    "verificationStatus": "verified"
  },
  {
    "id": "pso-iii-l",
    "recordId": "pso-iii-l",
    "recordTitle": "III.L: Szczepienia przeciw odrze, śwince i różyczce",
    "sourcePart": "III",
    "sourceSubsection": "III.L",
    "sourcePage": [
      41
    ],
    "exactPdfLocator": "Część III (III.L), str. 41, wytyczne uzupełniające (6 punktów)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w III.L (str. 41)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w III.L (str. 41)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część III.L, str. 41"
      }
    ],
    "literalExcerptOrAnchor": "Szczepienia przeciw odrze, śwince i różyczce — 1. Szczepienie podstawowe skojarzoną szczepionką przeciw ODRZE, ŚWINCE i RÓŻYCZCE należy podać w 13.–15. miesiącu",
    "verificationStatus": "verified"
  },
  {
    "id": "pso-iii-m",
    "recordId": "pso-iii-m",
    "recordTitle": "III.M: Szczepienia przeciw błonicy, tężcowi, krztuścowi, poliomyelitis, Haemophilus influenzae typu b oraz WZW typu B z użyciem szczepionki wysokoskojarzonej 6w1 (DTaP-IPV-Hib-HBV)",
    "sourcePart": "III",
    "sourceSubsection": "III.M",
    "sourcePage": [
      42
    ],
    "exactPdfLocator": "Część III (III.M), str. 42, wytyczne uzupełniające (2 punktów)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w III.M (str. 42)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w III.M (str. 42)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część III.M, str. 42"
      }
    ],
    "literalExcerptOrAnchor": "Szczepienia przeciw błonicy, tężcowi, krztuścowi, poliomyelitis, Haemophilus influenzae typu b oraz WZW typu B z użyciem szczepionki wysokoskojarzonej 6w1 (DTaP-IPV-Hib-HBV) — 1. Schemat podstawowy 3+1 Trzy dawki szczepienia: podawane są w odstępach co najmniej 1 miesiąc. Szczepienie rozpoczyna się zazwyczaj po",
    "verificationStatus": "verified"
  },
  {
    "id": "rec-iv-1",
    "recordId": "rec-iv-1",
    "recordTitle": "Część IV pkt 1: Jednoczesne wykonywanie szczepień w trakcie jednej wizyty",
    "sourcePart": "IV",
    "sourceSubsection": "IV",
    "sourcePage": 43,
    "exactPdfLocator": "Część IV, str. 43, punkt 1 ogólnych zasad przeprowadzania i organizacji szczepień",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w IV (str. 43)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w IV (str. 43)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część IV pkt 1, str. 43"
      }
    ],
    "literalExcerptOrAnchor": "IV pkt 1: O ile Charakterystyka Produktu Leczniczego nie wskazuje inaczej, szczepienia przewidziane zgodnie z kalendarzem szczepień do realizacji w ok",
    "verificationStatus": "verified",
    "auditNotes": "Dosłowne brzmienie punktu z akt.pdf str. 43; normy z odrębnych aktów prawnych (np. 24h ważności kwalifikacji, zgłoszenie NOP) są oddzielone w SEPARATE_LEGAL_ACT_RULES_NON_PSO."
  },
  {
    "id": "rec-iv-2",
    "recordId": "rec-iv-2",
    "recordTitle": "Część IV pkt 2: Odstęp między dwiema różnymi szczepionkami zawierającymi żywe drobnoustroje",
    "sourcePart": "IV",
    "sourceSubsection": "IV",
    "sourcePage": 43,
    "exactPdfLocator": "Część IV, str. 43, punkt 2 ogólnych zasad przeprowadzania i organizacji szczepień",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w IV (str. 43)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w IV (str. 43)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część IV pkt 2, str. 43"
      }
    ],
    "literalExcerptOrAnchor": "IV pkt 2: Odstęp czasu między dwiema różnymi szczepionkami zawierającymi żywe drobnoustroje powinien być nie krótszy niż 4 tygodnie o ile nie są podaw",
    "verificationStatus": "verified",
    "auditNotes": "Dosłowne brzmienie punktu z akt.pdf str. 43; normy z odrębnych aktów prawnych (np. 24h ważności kwalifikacji, zgłoszenie NOP) są oddzielone w SEPARATE_LEGAL_ACT_RULES_NON_PSO."
  },
  {
    "id": "rec-iv-3",
    "recordId": "rec-iv-3",
    "recordTitle": "Część IV pkt 3: Odstęp między różnymi szczepionkami niezawierającymi żywych drobnoustrojów",
    "sourcePart": "IV",
    "sourceSubsection": "IV",
    "sourcePage": 43,
    "exactPdfLocator": "Część IV, str. 43, punkt 3 ogólnych zasad przeprowadzania i organizacji szczepień",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w IV (str. 43)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w IV (str. 43)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część IV pkt 3, str. 43"
      }
    ],
    "literalExcerptOrAnchor": "IV pkt 3: Odstęp czasu między różnymi szczepionkami nie zawierającymi żywych drobnoustrojów jest dowolny, z zachowaniem niezbędnego odstępu dla unikni",
    "verificationStatus": "verified",
    "auditNotes": "Dosłowne brzmienie punktu z akt.pdf str. 43; normy z odrębnych aktów prawnych (np. 24h ważności kwalifikacji, zgłoszenie NOP) są oddzielone w SEPARATE_LEGAL_ACT_RULES_NON_PSO."
  },
  {
    "id": "rec-iv-4",
    "recordId": "rec-iv-4",
    "recordTitle": "Część IV pkt 4: Odstęp między szczepionką żywą a szczepionką niezawierającą żywych drobnoustrojów",
    "sourcePart": "IV",
    "sourceSubsection": "IV",
    "sourcePage": 43,
    "exactPdfLocator": "Część IV, str. 43, punkt 4 ogólnych zasad przeprowadzania i organizacji szczepień",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w IV (str. 43)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w IV (str. 43)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część IV pkt 4, str. 43"
      }
    ],
    "literalExcerptOrAnchor": "IV pkt 4: Odstęp czasu między szczepionką zawierającą żywe drobnoustroje, a szczepionką niezawierającą żywych drobnoustrojów jest dowolny, z zachowani",
    "verificationStatus": "verified",
    "auditNotes": "Dosłowne brzmienie punktu z akt.pdf str. 43; normy z odrębnych aktów prawnych (np. 24h ważności kwalifikacji, zgłoszenie NOP) są oddzielone w SEPARATE_LEGAL_ACT_RULES_NON_PSO."
  },
  {
    "id": "rec-iv-5",
    "recordId": "rec-iv-5",
    "recordTitle": "Część IV pkt 5: Odstęp między kolejnymi dawkami tej samej szczepionki",
    "sourcePart": "IV",
    "sourceSubsection": "IV",
    "sourcePage": 43,
    "exactPdfLocator": "Część IV, str. 43, punkt 5 ogólnych zasad przeprowadzania i organizacji szczepień",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w IV (str. 43)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w IV (str. 43)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część IV pkt 5, str. 43"
      }
    ],
    "literalExcerptOrAnchor": "IV pkt 5: Odstęp czasu między kolejnymi dawkami tej samej szczepionki powinien być zgodny z Charakterystyką Produktu Leczniczego dotyczącą schematu sz",
    "verificationStatus": "verified",
    "auditNotes": "Dosłowne brzmienie punktu z akt.pdf str. 43; normy z odrębnych aktów prawnych (np. 24h ważności kwalifikacji, zgłoszenie NOP) są oddzielone w SEPARATE_LEGAL_ACT_RULES_NON_PSO."
  },
  {
    "id": "rec-iv-6",
    "recordId": "rec-iv-6",
    "recordTitle": "Część IV pkt 6: Interpretacja określenia wieku dziecka w Części I.A PSO",
    "sourcePart": "IV",
    "sourceSubsection": "IV",
    "sourcePage": 43,
    "exactPdfLocator": "Część IV, str. 43, punkt 6 ogólnych zasad przeprowadzania i organizacji szczepień",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w IV (str. 43)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w IV (str. 43)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część IV pkt 6, str. 43"
      }
    ],
    "literalExcerptOrAnchor": "IV pkt 6: Określony w części I. A PSO wiek dziecka należy rozumieć jak w przykładzie: dziecko, które ukończyło 5 lat jest w 6. roku życia.",
    "verificationStatus": "verified",
    "auditNotes": "Dosłowne brzmienie punktu z akt.pdf str. 43; normy z odrębnych aktów prawnych (np. 24h ważności kwalifikacji, zgłoszenie NOP) są oddzielone w SEPARATE_LEGAL_ACT_RULES_NON_PSO."
  },
  {
    "id": "rec-iv-7",
    "recordId": "rec-iv-7",
    "recordTitle": "Część IV pkt 7: Dokumentowanie szczepień zalecanych i badania kwalifikacyjnego w e-Karcie Szczepień",
    "sourcePart": "IV",
    "sourceSubsection": "IV",
    "sourcePage": 43,
    "exactPdfLocator": "Część IV, str. 43, punkt 7 ogólnych zasad przeprowadzania i organizacji szczepień",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w IV (str. 43)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w IV (str. 43)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część IV pkt 7, str. 43"
      }
    ],
    "literalExcerptOrAnchor": "IV pkt 7: Od dnia 1 października 2023 r. wszystkie szczepienia zalecane niezwłocznie po ich wykonaniu są dokumentowane w elektronicznej Karcie Szczepi",
    "verificationStatus": "verified",
    "auditNotes": "Dosłowne brzmienie punktu z akt.pdf str. 43; normy z odrębnych aktów prawnych (np. 24h ważności kwalifikacji, zgłoszenie NOP) są oddzielone w SEPARATE_LEGAL_ACT_RULES_NON_PSO."
  },
  {
    "id": "rec-v-1",
    "recordId": "rec-v-1",
    "recordTitle": "Część V pkt 1: Natychmiastowe wyrównywanie zaległości",
    "sourcePart": "V",
    "sourceSubsection": "V",
    "sourcePage": 44,
    "exactPdfLocator": "Część V, str. 44, punkt 1 zasad szczepień wyrównawczych",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w V (str. 44)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w V (str. 44)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część V pkt 1, str. 44"
      }
    ],
    "literalExcerptOrAnchor": "V pkt 1: W przypadku dzieci i młodzieży, u których z różnych przyczyn (np. długotrwałe odroczenie terminu przeprowadzenia szczepienia, niedopełnienie",
    "verificationStatus": "verified"
  },
  {
    "id": "rec-v-2",
    "recordId": "rec-v-2",
    "recordTitle": "Część V pkt 2: Granica wieku obowiązku i ciągłość finansowania rozpoczętych schematów",
    "sourcePart": "V",
    "sourceSubsection": "V",
    "sourcePage": 44,
    "exactPdfLocator": "Część V, str. 44, punkt 2 zasad szczepień wyrównawczych",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w V (str. 44)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w V (str. 44)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część V pkt 2, str. 44"
      }
    ],
    "literalExcerptOrAnchor": "V pkt 2: Szczepienie wyrównawcze przeciw zakażeniom i chorobom zakaźnym objętym obowiązkiem szczepień ochronnych są obowiązkowe do ukończenia wieku w",
    "verificationStatus": "verified"
  },
  {
    "id": "rec-v-3",
    "recordId": "rec-v-3",
    "recordTitle": "Część V pkt 3: Wymóg Indywidualnego Kalendarza Szczepień (IKSz)",
    "sourcePart": "V",
    "sourceSubsection": "V",
    "sourcePage": 44,
    "exactPdfLocator": "Część V, str. 44, punkt 3 zasad szczepień wyrównawczych",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w V (str. 44)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w V (str. 44)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część V pkt 3, str. 44"
      }
    ],
    "literalExcerptOrAnchor": "V pkt 3: Szczepienia wyrównawcze należy prowadzić według indywidualnego planu szczepień – indywidualnego kalendarza szczepień, zwanego dalej „IKSz”.",
    "verificationStatus": "verified"
  },
  {
    "id": "rec-v-4",
    "recordId": "rec-v-4",
    "recordTitle": "Część V pkt 4: Minimalny i rozszerzony zakres IKSz",
    "sourcePart": "V",
    "sourceSubsection": "V",
    "sourcePage": 44,
    "exactPdfLocator": "Część V, str. 44, punkt 4 zasad szczepień wyrównawczych",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w V (str. 44)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w V (str. 44)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część V pkt 4, str. 44"
      }
    ],
    "literalExcerptOrAnchor": "V pkt 4: Przeprowadzone w ramach IKSz szczepienia mają prowadzić co najmniej do uodpornienia przeciw chorobom zakaźnym, które są objęte obowiązkowymi",
    "verificationStatus": "verified"
  },
  {
    "id": "rec-v-5",
    "recordId": "rec-v-5",
    "recordTitle": "Część V pkt 5: Zastosowanie najkrótszych dopuszczalnych odstępów z ChPL",
    "sourcePart": "V",
    "sourceSubsection": "V",
    "sourcePage": 44,
    "exactPdfLocator": "Część V, str. 44, punkt 5 zasad szczepień wyrównawczych",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w V (str. 44)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w V (str. 44)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część V pkt 5, str. 44"
      }
    ],
    "literalExcerptOrAnchor": "V pkt 5: W IKSz lekarz planuje, przy zastosowaniu dostępnych szczepionek dla danej osoby (biorąc pod uwagę jej wiek i stan zdrowia), schemat szczepie",
    "verificationStatus": "verified"
  },
  {
    "id": "rec-v-6",
    "recordId": "rec-v-6",
    "recordTitle": "Część V pkt 6: Możliwość stosowania preparatów zakupionych przez pacjenta/rodziców",
    "sourcePart": "V",
    "sourceSubsection": "V",
    "sourcePage": 44,
    "exactPdfLocator": "Część V, str. 44, punkt 6 zasad szczepień wyrównawczych",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w V (str. 44)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w V (str. 44)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część V pkt 6, str. 44"
      }
    ],
    "literalExcerptOrAnchor": "V pkt 6: W ramach IKSz można stosować szczepionki zakupione przez rodziców, opiekunów prawnych lub osobę szczepioną.",
    "verificationStatus": "verified"
  },
  {
    "id": "rec-v-7",
    "recordId": "rec-v-7",
    "recordTitle": "Część V pkt 7: Obowiązek wpisu IKSz do dokumentacji medycznej",
    "sourcePart": "V",
    "sourceSubsection": "V",
    "sourcePage": 44,
    "exactPdfLocator": "Część V, str. 44, punkt 7 zasad szczepień wyrównawczych",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w V (str. 44)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w V (str. 44)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część V pkt 7, str. 44"
      }
    ],
    "literalExcerptOrAnchor": "V pkt 7: IKSz wpisuje się do dokumentacji medycznej.",
    "verificationStatus": "verified"
  },
  {
    "id": "rec-v-8",
    "recordId": "rec-v-8",
    "recordTitle": "Część V pkt 8: Obowiązek poinformowania opiekunów i odnotowania w dokumentacji",
    "sourcePart": "V",
    "sourceSubsection": "V",
    "sourcePage": 44,
    "exactPdfLocator": "Część V, str. 44, punkt 8 zasad szczepień wyrównawczych",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w V (str. 44)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w V (str. 44)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część V pkt 8, str. 44"
      }
    ],
    "literalExcerptOrAnchor": "V pkt 8: Lekarz informuje rodziców, opiekunów prawnych lub osoby szczepione o rodzaju i terminach przeprowadzenia szczepień przewidzianych w IKSz i p",
    "verificationStatus": "verified"
  },
  {
    "id": "rec-v-9",
    "recordId": "rec-v-9",
    "recordTitle": "Część V pkt 9: Brak udokumentowania szczepień i badanie miana przeciwciał",
    "sourcePart": "V",
    "sourceSubsection": "V",
    "sourcePage": 44,
    "exactPdfLocator": "Część V, str. 44, punkt 9 zasad szczepień wyrównawczych",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w V (str. 44)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w V (str. 44)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część V pkt 9, str. 44"
      }
    ],
    "literalExcerptOrAnchor": "V pkt 9: U osób, u których nie zostało udokumentowane przeprowadzenie szczepienia, powinno się przeprowadzić szczepienie podstawowe. W przypadku wątp",
    "verificationStatus": "verified"
  },
  {
    "id": "rec-v-10",
    "recordId": "rec-v-10",
    "recordTitle": "Część V pkt 10: Niepełny schemat – zakaz rozpoczynania od początku",
    "sourcePart": "V",
    "sourceSubsection": "V",
    "sourcePage": 44,
    "exactPdfLocator": "Część V, str. 44, punkt 10 zasad szczepień wyrównawczych",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w V (str. 44)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w V (str. 44)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część V pkt 10, str. 44"
      }
    ],
    "literalExcerptOrAnchor": "V pkt 10: U osób, u których zostało udokumentowane przeprowadzenie szczepienia w niepełnym zakresie, niezależnie od odstępu czasu od podania ostatniej",
    "verificationStatus": "verified"
  },
  {
    "id": "rec-v-11",
    "recordId": "rec-v-11",
    "recordTitle": "Część V pkt 11: Brak dokumentacji szczepienia przeciw gruźlicy (BCG)",
    "sourcePart": "V",
    "sourceSubsection": "V",
    "sourcePage": 44,
    "exactPdfLocator": "Część V, str. 44, punkt 11 zasad szczepień wyrównawczych",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w V (str. 44)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w V (str. 44)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część V pkt 11, str. 44"
      }
    ],
    "literalExcerptOrAnchor": "V pkt 11: W przypadku braku dokumentacji potwierdzającej szczepienie przeciw gruźlicy postępować – patrz cz. III PSO Informacje uzupełniające – zasady",
    "verificationStatus": "verified"
  },
  {
    "id": "rec-v-12",
    "recordId": "rec-v-12",
    "recordTitle": "Część V pkt 12: Postępowanie u nieszczepionych przeciw gruźlicy po kontakcie z chorym",
    "sourcePart": "V",
    "sourceSubsection": "V",
    "sourcePage": 44,
    "exactPdfLocator": "Część V, str. 44, punkt 12 zasad szczepień wyrównawczych",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w V (str. 44)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w V (str. 44)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część V pkt 12, str. 44"
      }
    ],
    "literalExcerptOrAnchor": "V pkt 12: U osoby nieszczepionej przeciw gruźlicy, która miała styczność z chorym na gruźlicę, należy przeprowadzić diagnostykę, a po wykluczeniu gruź",
    "verificationStatus": "verified"
  },
  {
    "id": "rec-vi-lekarz",
    "recordId": "rec-vi-lekarz",
    "recordTitle": "Część VI: Uprawnienia — Lekarz",
    "sourcePart": "VI",
    "sourceSubsection": "VI",
    "sourcePage": 45,
    "exactPdfLocator": "Część VI, str. 45, tabela uprawnień zawodów medycznych, wiersz nr 1 (undefined)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w VI (str. 45)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w VI (str. 45)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część VI, str. 45"
      }
    ],
    "literalExcerptOrAnchor": "VI wiersz 1 (undefined): kwalifikacja=Tak/Nie, wykonanie=Tak",
    "verificationStatus": "verified",
    "auditNotes": "Odwzorowanie wiersza tabeli z akt.pdf str. 45 wraz z dosłownymi przypisami * oraz ** (szkolenie / 9–18 lat)."
  },
  {
    "id": "rec-vi-felczer",
    "recordId": "rec-vi-felczer",
    "recordTitle": "Część VI: Uprawnienia — Felczer",
    "sourcePart": "VI",
    "sourceSubsection": "VI",
    "sourcePage": 45,
    "exactPdfLocator": "Część VI, str. 45, tabela uprawnień zawodów medycznych, wiersz nr 2 (undefined)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w VI (str. 45)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w VI (str. 45)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część VI, str. 45"
      }
    ],
    "literalExcerptOrAnchor": "VI wiersz 2 (undefined): kwalifikacja=Nie/Nie, wykonanie=Tak",
    "verificationStatus": "verified",
    "auditNotes": "Odwzorowanie wiersza tabeli z akt.pdf str. 45 wraz z dosłownymi przypisami * oraz ** (szkolenie / 9–18 lat)."
  },
  {
    "id": "rec-vi-pielegniarka",
    "recordId": "rec-vi-pielegniarka",
    "recordTitle": "Część VI: Uprawnienia — Pielęgniarka",
    "sourcePart": "VI",
    "sourceSubsection": "VI",
    "sourcePage": 45,
    "exactPdfLocator": "Część VI, str. 45, tabela uprawnień zawodów medycznych, wiersz nr 3 (undefined)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w VI (str. 45)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w VI (str. 45)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część VI, str. 45"
      }
    ],
    "literalExcerptOrAnchor": "VI wiersz 3 (undefined): kwalifikacja=Nie/Nie, wykonanie=Tak",
    "verificationStatus": "verified",
    "auditNotes": "Odwzorowanie wiersza tabeli z akt.pdf str. 45 wraz z dosłownymi przypisami * oraz ** (szkolenie / 9–18 lat)."
  },
  {
    "id": "rec-vi-polozna",
    "recordId": "rec-vi-polozna",
    "recordTitle": "Część VI: Uprawnienia — Położna",
    "sourcePart": "VI",
    "sourceSubsection": "VI",
    "sourcePage": 45,
    "exactPdfLocator": "Część VI, str. 45, tabela uprawnień zawodów medycznych, wiersz nr 4 (undefined)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w VI (str. 45)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w VI (str. 45)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część VI, str. 45"
      }
    ],
    "literalExcerptOrAnchor": "VI wiersz 4 (undefined): kwalifikacja=Nie/Nie, wykonanie=Tak",
    "verificationStatus": "verified",
    "auditNotes": "Odwzorowanie wiersza tabeli z akt.pdf str. 45 wraz z dosłownymi przypisami * oraz ** (szkolenie / 9–18 lat)."
  },
  {
    "id": "rec-vi-farmaceuta",
    "recordId": "rec-vi-farmaceuta",
    "recordTitle": "Część VI: Uprawnienia — Farmaceuta",
    "sourcePart": "VI",
    "sourceSubsection": "VI",
    "sourcePage": 45,
    "exactPdfLocator": "Część VI, str. 45, tabela uprawnień zawodów medycznych, wiersz nr 5 (undefined)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w VI (str. 45)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w VI (str. 45)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część VI, str. 45"
      }
    ],
    "literalExcerptOrAnchor": "VI wiersz 5 (undefined): kwalifikacja=Nie/Nie, wykonanie=Nie",
    "verificationStatus": "verified",
    "auditNotes": "Odwzorowanie wiersza tabeli z akt.pdf str. 45 wraz z dosłownymi przypisami * oraz ** (szkolenie / 9–18 lat)."
  },
  {
    "id": "rec-vi-ratownik",
    "recordId": "rec-vi-ratownik",
    "recordTitle": "Część VI: Uprawnienia — Ratownik medyczny",
    "sourcePart": "VI",
    "sourceSubsection": "VI",
    "sourcePage": 45,
    "exactPdfLocator": "Część VI, str. 45, tabela uprawnień zawodów medycznych, wiersz nr 6 (undefined)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w VI (str. 45)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w VI (str. 45)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część VI, str. 45"
      }
    ],
    "literalExcerptOrAnchor": "VI wiersz 6 (undefined): kwalifikacja=Nie/Nie, wykonanie=Tak",
    "verificationStatus": "verified",
    "auditNotes": "Odwzorowanie wiersza tabeli z akt.pdf str. 45 wraz z dosłownymi przypisami * oraz ** (szkolenie / 9–18 lat)."
  },
  {
    "id": "rec-vi-fizjoterapeuta",
    "recordId": "rec-vi-fizjoterapeuta",
    "recordTitle": "Część VI: Uprawnienia — Fizjoterapeuta",
    "sourcePart": "VI",
    "sourceSubsection": "VI",
    "sourcePage": 45,
    "exactPdfLocator": "Część VI, str. 45, tabela uprawnień zawodów medycznych, wiersz nr 7 (undefined)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w VI (str. 45)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w VI (str. 45)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część VI, str. 45"
      }
    ],
    "literalExcerptOrAnchor": "VI wiersz 7 (undefined): kwalifikacja=Nie/Nie, wykonanie=Nie",
    "verificationStatus": "verified",
    "auditNotes": "Odwzorowanie wiersza tabeli z akt.pdf str. 45 wraz z dosłownymi przypisami * oraz ** (szkolenie / 9–18 lat)."
  },
  {
    "id": "rec-vi-diagnosta",
    "recordId": "rec-vi-diagnosta",
    "recordTitle": "Część VI: Uprawnienia — Diagnosta laboratoryjny",
    "sourcePart": "VI",
    "sourceSubsection": "VI",
    "sourcePage": 45,
    "exactPdfLocator": "Część VI, str. 45, tabela uprawnień zawodów medycznych, wiersz nr 8 (undefined)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w VI (str. 45)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w VI (str. 45)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część VI, str. 45"
      }
    ],
    "literalExcerptOrAnchor": "VI wiersz 8 (undefined): kwalifikacja=Nie/Nie, wykonanie=Nie",
    "verificationStatus": "verified",
    "auditNotes": "Odwzorowanie wiersza tabeli z akt.pdf str. 45 wraz z dosłownymi przypisami * oraz ** (szkolenie / 9–18 lat)."
  },
  {
    "id": "rec-vi-higienistka",
    "recordId": "rec-vi-higienistka",
    "recordTitle": "Część VI: Uprawnienia — Higienistka szkolna",
    "sourcePart": "VI",
    "sourceSubsection": "VI",
    "sourcePage": 45,
    "exactPdfLocator": "Część VI, str. 45, tabela uprawnień zawodów medycznych, wiersz nr 9 (undefined)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w VI (str. 45)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w VI (str. 45)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część VI, str. 45"
      }
    ],
    "literalExcerptOrAnchor": "VI wiersz 9 (undefined): kwalifikacja=Nie/Nie, wykonanie=Tak",
    "verificationStatus": "verified",
    "auditNotes": "Odwzorowanie wiersza tabeli z akt.pdf str. 45 wraz z dosłownymi przypisami * oraz ** (szkolenie / 9–18 lat)."
  },
  {
    "id": "rec-vi-dentysta",
    "recordId": "rec-vi-dentysta",
    "recordTitle": "Część VI: Uprawnienia — Lekarz dentysta",
    "sourcePart": "VI",
    "sourceSubsection": "VI",
    "sourcePage": 45,
    "exactPdfLocator": "Część VI, str. 45, tabela uprawnień zawodów medycznych, wiersz nr 10 (undefined)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w VI (str. 45)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w VI (str. 45)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część VI, str. 45"
      }
    ],
    "literalExcerptOrAnchor": "VI wiersz 10 (undefined): kwalifikacja=Nie/Nie, wykonanie=Nie",
    "verificationStatus": "verified",
    "auditNotes": "Odwzorowanie wiersza tabeli z akt.pdf str. 45 wraz z dosłownymi przypisami * oraz ** (szkolenie / 9–18 lat)."
  },
  {
    "id": "pso-vii-a",
    "recordId": "pso-vii-a",
    "recordTitle": "VII.A: SKRÓCONY KALENDARZ SZCZEPIEŃ OBOWIĄZKOWYCH DLA DZIECI I MŁODZIEŻY NA ROK 2027",
    "sourcePart": "VII",
    "sourceSubsection": "VII.A",
    "sourcePage": 46,
    "exactPdfLocator": "Część VII.A, str. 46, tabela skróconego kalendarza (9 wierszy × 13 kolumn wiekowych)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w VII.A (str. 46)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w VII.A (str. 46)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część VII.A, str. 46"
      }
    ],
    "literalExcerptOrAnchor": "VII.A: SKRÓCONY KALENDARZ SZCZEPIEŃ OBOWIĄZKOWYCH DLA DZIECI I MŁODZIEŻY NA ROK 2027 (24h* | 2 m-c życia** | 3 m-c życia | 4 m-c życia | 5 m-c życia | 6 m-c życia | 7 m-c życia | 10–12 m-c życia | 13–15 m-c życia | 16–18 m-c życia | 6 rok życia | 14 rok życia | 19 rok życia)",
    "verificationStatus": "verified"
  },
  {
    "id": "pso-vii-b",
    "recordId": "pso-vii-b",
    "recordTitle": "VII.B: SKRÓCONY KALENDARZ SZCZEPIEŃ ZALECANYCH DLA DZIECI I MŁODZIEŻY NA ROK 2027",
    "sourcePart": "VII",
    "sourceSubsection": "VII.B",
    "sourcePage": 47,
    "exactPdfLocator": "Część VII.B, str. 47, tabela skróconego kalendarza (7 wierszy × 13 kolumn wiekowych)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w VII.B (str. 47)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w VII.B (str. 47)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część VII.B, str. 47"
      }
    ],
    "literalExcerptOrAnchor": "VII.B: SKRÓCONY KALENDARZ SZCZEPIEŃ ZALECANYCH DLA DZIECI I MŁODZIEŻY NA ROK 2027 (2 m-c życia | 3 m-c życia | 4 m-c życia | 5 m-c życia | 6 m-c życia | 7 m-c życia | 9–11 m-c życia | 13–15 m-c życia | 16–18 m-c życia | 6 rok życia | 9 rok życia | 14 rok życia | 19 rok życia)",
    "verificationStatus": "verified"
  },
  {
    "id": "pso-vii-c",
    "recordId": "pso-vii-c",
    "recordTitle": "VII.C: SKRÓCONY KALENDARZ SZCZEPIEŃ ZALECANYCH DLA DOROSŁYCH NA ROK 2027 (KRYTERIUM WIEKOWE)",
    "sourcePart": "VII",
    "sourceSubsection": "VII.C",
    "sourcePage": 48,
    "exactPdfLocator": "Część VII.C, str. 48, tabela skróconego kalendarza (13 wierszy × 3 kolumn wiekowych)",
    "targetRecordFields": [
      "title",
      "description",
      "sourceReference",
      "relatedRecords"
    ],
    "fieldSourceMappings": [
      {
        "field": "title",
        "sourceFragment": "Nagłówek / kolumna tytułowa w VII.C (str. 48)"
      },
      {
        "field": "description",
        "sourceFragment": "Treść merytoryczna / zalecenia w VII.C (str. 48)"
      },
      {
        "field": "sourceReference",
        "sourceFragment": "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77, Część VII.C, str. 48"
      }
    ],
    "literalExcerptOrAnchor": "VII.C: SKRÓCONY KALENDARZ SZCZEPIEŃ ZALECANYCH DLA DOROSŁYCH NA ROK 2027 (KRYTERIUM WIEKOWE) (19–49 lat | 50–64 lat | 65 lat i powyżej)",
    "verificationStatus": "conflicting",
    "auditNotes": "Wiersz „Meningokokom” zawiera w oficjalnym PDF (str. 48) scalone puste komórki (#d9d9d9, colSpan 2) dla 19–49 i 50–64 lat oraz wpis „MenB – 2 dawki / MenACWY – 1 dawka” wyłącznie w kolumnie „65 lat i powyżej”. Część II.B (str. 23–24) wymienia tymczasem dorosłych z grup ryzyka bez ograniczenia do 65+ r.ż. Różnicę zachowano jawnie jako status conflicting z widoczną notą w UI.",
    "caveat": "Status conflicting: puste komórki w skróconym kalendarzu VII.C dla 19–49 i 50–64 lat nie wykluczają wskazań dla grup ryzyka z Części II.B; aplikacja nie dopisuje dawek z domysłu."
  }
] as const;

export const PSO_2027_EVIDENCE_LEDGER_SUMMARY: PsoEvidenceLedgerSummary = {
  totalRecords: 119,
  totalSubsections: 35,
  verifiedCount: 118,
  conflictingCount: 1,
  partiallyVerifiedCount: 0,
  notVerifiedCount: 0,
  officialSourceCitation: "Dz. Urz. Min. Zdrow. z dnia 30 października 2026 r., poz. 77",
  officialPdfUrl: "https://dziennikmz.mz.gov.pl/DUM_MZ/2026/77/akt.pdf",
  gisPortalUrl: "https://www.gov.pl/web/gis/program-szczepien-ochronnych-na-2027-rok",
  journalPublicationDate: "30.10.2026",
  gisAnnouncementDate: "28.10.2026",
  pdfSha256: "4C6FA9212F292B130FD8958BAAEEAC2444F86FBAA260B873D586B905108FC6DA",
  totalPages: 48,
};

/**
 * Zwraca pojedynczy rekord dowodowy po jego identyfikatorze (np. 'rec-ia-scope', 'pso-vii-c').
 */
export function getPsoRecordEvidence(recordId: string): PsoRecordEvidenceItem | undefined {
  return PSO_2027_RECORD_EVIDENCE_MANIFEST.find((item) => item.id === recordId || item.recordId === recordId);
}

/**
 * Zwraca listę rekordów dowodowych przypisanych do danej części dokumentu (I–VII).
 */
export function getPsoEvidenceByPart(part: PsoPartNumber): PsoRecordEvidenceItem[] {
  return PSO_2027_RECORD_EVIDENCE_MANIFEST.filter((item) => item.sourcePart === part);
}

/**
 * Zwraca listę rekordów dowodowych przypisanych do danej podsekcji (np. 'II.A', 'VII.C').
 */
export function getPsoEvidenceBySubsection(subsectionCode: string): PsoRecordEvidenceItem[] {
  return PSO_2027_RECORD_EVIDENCE_MANIFEST.filter((item) => item.sourceSubsection === subsectionCode);
}
