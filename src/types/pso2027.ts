/**
 * Typy domenowe pełnego odwzorowania Programu Szczepień Ochronnych na rok 2027
 * (Komunikat GIS z dnia 28 października 2026 r., Dz. Urz. Min. Zdrow. z 30 października 2026 r., poz. 77).
 *
 * Zachowują ścisły rozdział danych urzędowych PSO od odrębnych aktów prawnych,
 * dobrych praktyk gabinetowych oraz niezależnego audytu ChPL / finansowania preparatów.
 */

export type PsoPartNumber = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI' | 'VII';

export type PsoPopulationScope =
  | 'children_and_adolescents'
  | 'adults'
  | 'pregnant_women'
  | 'healthcare_workers'
  | 'occupational_groups'
  | 'travelers'
  | 'post_exposure'
  | 'risk_groups'
  | 'staff_qualifications'
  | 'cross_age';

export type PsoVaccinationType =
  | 'obowiazkowe'
  | 'zalecane'
  | 'bierne'
  | 'organizacyjne';

export type PsoRecordVerificationStatus =
  | 'verified'
  | 'partially_verified'
  | 'not_verified'
  | 'conflicting';

export interface PsoSourceDocumentMeta {
  sourceTitle: string;
  gisAnnouncementDate: string;
  journalPublicationDate: string;
  journalCitation: string;
  officialPdfUrl: string;
  gisPortalUrl: string;
  totalPages: number;
  pdfSha256: string;
}

/**
 * Ustrukturyzowany rekord wiedzy PSO 2027 używany do nawigacji, filtrowania
 * i wyszukiwania we wszystkich siedmiu częściach dokumentu.
 */
export interface PsoStructuredRecord {
  id: string;
  sourcePart: PsoPartNumber;
  sourceSubsection: string;
  sourcePage: number | number[];
  sourceTitle: string;
  populationScope: PsoPopulationScope;
  vaccinationType: PsoVaccinationType;
  title: string;
  description: string;
  schedule?: string;
  riskGroup?: string;
  relatedRecords: string[];
  sourceReference: string;
  verificationStatus: PsoRecordVerificationStatus;
  auditNote?: string;
}

/**
 * Pojedynczy punkt lub podpunkt w sekcjach Części I.B lub III (np. III.A–III.M).
 */
export interface PsoSubsectionBullet {
  label: string;
  text: string;
  subItems?: { label: string; text: string }[];
}

export interface PsoRiskGroupMandatoryBlock {
  id: string;
  sourceSubsection: 'I.B';
  sourcePages: number[];
  diseaseOrGroupTitle: string;
  obligatedPersonsIntro: string;
  obligatedGroups: PsoSubsectionBullet[];
  officialNotes: string;
  relatedRecords: string[];
  verificationStatus: PsoRecordVerificationStatus;
}

export interface PsoPartICPostExposureEntry {
  id: string;
  sourceSubsection: 'I.C';
  sourcePage: 15;
  disease: string;
  obligatedPersons: string;
  officialNotes: string;
  crossRefSubsection?: string;
  relatedRecords: string[];
}

export interface PsoRabiesContactMatrixRow {
  id: string;
  contactCategory: string;
  contactCategoryRowSpan?: number;
  atExposureAnimalState: string;
  observation15Days: string;
  preventionAction: string;
}

export interface PsoTetanusPepRow {
  id: string;
  vaccinationHistory: string;
  lowRiskAction: string;
  highRiskAction: string;
}

export interface PsoPartIIRecommendedRow {
  id: string;
  sourceSubsection: 'II.A' | 'II.B' | 'II.C' | 'II.D' | 'II.E' | 'II.F' | 'II.H' | 'II.I';
  sourcePages: number[];
  vaccinationType: 'zalecane' | 'bierne';
  populationScope: PsoPopulationScope;
  subjectLabel: string;
  recommendations: string;
  recommendationBullets?: PsoSubsectionBullet[];
  notes: string;
  relatedRecords: string[];
  verificationStatus: PsoRecordVerificationStatus;
  auditNote?: string;
}

export interface PsoHbvPepMatrixRow {
  id: string;
  exposedPersonStatus: string;
  sourceHbsAgPositive: string;
  sourceHbsAgNegative: string;
  sourceUnknown: string;
}

export interface PsoSupplementaryDiseaseSection {
  id: string;
  subsectionCode: string; // np. 'III.A' .. 'III.M'
  title: string;
  sourcePages: number[];
  introNote?: string;
  points: PsoSubsectionBullet[];
  relatedRecords: string[];
  verificationStatus: PsoRecordVerificationStatus;
}

/**
 * Norma wynikająca z odrębnego aktu prawnego (np. Rozp. MZ z 27.09.2023 r. lub ustawa z 5.12.2008 r.)
 * albo dobra praktyka organizacyjna — wyraźnie oddzielona od literalnej treści Części IV PSO 2027.
 */
export interface SeparateLegalOrPracticeRule {
  id: string;
  category: 'separate_legal_act' | 'clinical_good_practice';
  title: string;
  summary: string;
  exactLegalBasis: string;
  whySeparatedFromPsoPartIV: string;
}

export interface PsoPartVITableFootnote {
  marker: '*' | '**';
  text: string;
  sourcePage: number;
}

export type PsoPartVIICellTone = 'active' | 'conditional' | 'empty';

export interface PsoPartVIIScheduleCell {
  id: string;
  colSpan: number;
  text: string;
  tone: PsoPartVIICellTone;
  ariaAgeRange: string;
}

export interface PsoPartVIIScheduleRow {
  id: string;
  vaccineAgainst: string;
  cells: PsoPartVIIScheduleCell[];
  relatedRecords: string[];
  rowNote?: string;
}

export interface PsoPartVIIFootnote {
  marker: string;
  text: string;
}

export interface PsoPartVIIScheduleTable {
  id: string;
  subsectionCode: 'VII.A' | 'VII.B' | 'VII.C';
  title: string;
  sourcePage: number;
  populationScope: PsoPopulationScope;
  vaccinationType: 'obowiazkowe' | 'zalecane';
  columns: { id: string; primaryLabel: string; secondaryLabel?: string }[];
  rows: PsoPartVIIScheduleRow[];
  footnotes: PsoPartVIIFootnote[];
  verificationStatus: PsoRecordVerificationStatus;
  structuralAuditNote?: string;
}

export interface PsoSubsectionCompletenessEntry {
  subsectionCode: string;
  partNumber: PsoPartNumber;
  title: string;
  sourcePages: number[];
  populationScope: PsoPopulationScope;
  recordCount: number;
  verificationStatus: PsoRecordVerificationStatus;
  summaryNote: string;
  discrepancyOrCaveat?: string;
}
