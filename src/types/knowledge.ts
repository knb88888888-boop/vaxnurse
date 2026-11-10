export type KnowledgeCategory =
  | 'pso'
  | 'chpl'
  | 'gis-gif'
  | 'law'
  | 'procedures';

export interface CategoryDefinition {
  id: KnowledgeCategory;
  label: string;
  shortLabel: string;
  description: string;
}

export interface KnowledgeSource {
  id: string;
  title: string;
  publisher: string;
  category: KnowledgeCategory;
  publicationDate: string | null;
  officialJournalDate: string | null;
  legalActNumber: string | null;
  version: string | null;
  versionDate: string | null;
  officialUrl: string;
  infoUrl: string | null;
  lastVerifiedDate: string | null;
  description: string;
  verificationStatus: string;
  clinicalNote: string | null;
  targetYear: number | null;
}
