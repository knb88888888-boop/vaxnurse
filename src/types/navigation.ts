import type { LucideIcon } from 'lucide-react';

export type ModuleId =
  | 'dashboard'
  | 'child-vaccinations'
  | 'adult-vaccinations'
  | 'vaccines-database'
  | 'vaccination-calendar'
  | 'vaccination-calculator'
  | 'procedures-checklists'
  | 'cold-chain'
  | 'special-situations'
  | 'knowledge-base'
  | 'about-project'
  | 'settings';

export interface ModuleDefinition {
  id: ModuleId;
  label: string;
  description: string;
  category: 'main' | 'clinical' | 'logistics' | 'system';
  icon: LucideIcon;
  badge?: string;
  isCore?: boolean;
  purposeNote: string;
  keyFeatures: string[];
}

export interface QuickAccessItem {
  id: string;
  title: string;
  subtitle: string;
  targetModule: ModuleId;
  icon: LucideIcon;
  badgeColor?: 'blue' | 'indigo' | 'emerald' | 'amber';
}
