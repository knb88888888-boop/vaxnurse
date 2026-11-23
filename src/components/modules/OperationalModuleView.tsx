import React, { useCallback, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Download,
  Trash2,
  Plus,
  RotateCcw,
  ShieldCheck,
  BookOpen,
  Printer
} from 'lucide-react';
import type { ModuleDefinition, ModuleId } from '../../types/navigation';
import type { ChildVaccineItem, AgeStageGroup } from '../../types/childVaccines';
import {
  CHILD_AGE_BRACKETS,
  CHILD_VACCINES_CATALOG,
  STAGE_GROUPS_CONFIG,
  PSO_GENERAL_PRINCIPLES_PART_IV,
  PSO_PART_IV_PREAMBLE,
  PSO_PART_VI_OFFICIAL_FOOTNOTES,
  SEPARATE_LEGAL_ACT_RULES_NON_PSO,
  STAFF_QUALIFICATIONS_PSO_PART_VI,
  PSO_CATCH_UP_12_POINTS_PART_V,
  COMBINED_VACCINES_VARIANTS_PART_III_M
} from '../../data/childVaccinesData';
import {
  PSO_PART_IIB_ADULTS_RECOMMENDED,
  PSO_PART_IIC_PREGNANCY,
  PSO_PART_IID_HEALTHCARE_WORKERS,
  PSO_PART_IIE_OCCUPATIONAL_INTRO,
  PSO_PART_IIE_OTHER_WORKERS,
  PSO_PART_IIF_POST_EXPOSURE,
  PSO_PART_IIG_HBV_PEP_MATRIX,
  PSO_PART_III_TRAVEL_ENDEMIC,
  PSO_PART_III_TRAVEL_NOTE,
} from '../../data/pso2027CompleteData';
import {
  Pso2027SearchAndCompletenessPanel,
  PsoPartISectionsView,
  PsoPartIISectionsView,
  PsoPartIIISectionsView,
  PsoPartIVSeparateLawsSection,
  PsoPartVIFootnotesBlock,
  PsoPartVIIMatrices,
  PsoSourceLinkBadge,
} from '../pso/Pso2027CompleteExplorer';
import {
  VACCINES_CATALOG,
  TARGET_GROUP_LABELS,
  VACCINE_TYPE_LABELS,
  VERIFICATION_STATUS_META
} from '../../data/vaccinesCatalog';
import { loadVaccinesFromStorage } from '../../utils/vaccineVerification';
import { isValidHttpUrl } from '../../utils/catalogMerge';
import { KNOWLEDGE_SOURCES } from '../../data/knowledgeSources';
import {
  COLD_CHAIN_PROFILES,
  COLD_CHAIN_REFERENCE_MAX_C,
  COLD_CHAIN_REFERENCE_MIN_C,
  COLD_CHAIN_STORAGE_KEY,
  EMERGENCY_KIT_REGULATION_ANNEX_26,
  EMERGENCY_KIT_STORAGE_KEY,
  FACILITY_CARE_CATEGORIES,
  KIT_EXPIRY_WARNING_DAYS,
  LOCAL_CHECKLIST_STORAGE_KEY,
  PRODUCT_STORAGE_REFERENCE_MATRIX,
  PSO_INTERVAL_RULES_DATABASE,
  type PsoIntervalRule,
  buildColdChainCsv,
  calculateAgeAt,
  calculateNextDoseDate,
  evaluateColdChainStatus,
  evaluateKitItemStatus,
  formatPolishDate,
  generateLocalId,
  getBrowserStorage,
  inspectOperationalStorageHealth,
  loadColdChainReadings,
  loadEmergencyKit,
  loadLocalChecklist,
  parseIsoDate,
  saveColdChainReadings,
  saveEmergencyKit,
  saveLocalChecklist,
  sortColdChainReadings,
  summarizeColdChain,
  todayIsoDate,
  validateChecklistText,
  validateColdChainDraft,
  validateKitDraft,
  type ColdChainProfileId,
  type ColdChainReading,
  type ColdChainReadingDraft,
  type ColdChainStatus,
  type EmergencyKitItem,
  type FacilityCareCategory,
  type IntervalUnit,
  type KitItemStatus,
  type LocalChecklistItem
} from '../../utils/operationalTools';
import '../../styles/operational.css';

export interface OperationalModuleViewProps {
  module: ModuleDefinition;
  onBackToDashboard: () => void;
  onNavigateToModule: (id: ModuleId) => void;
  onSelectVaccineProduct?: (vaccineId: string) => void;
}

const fmtDate = (iso: string): string => {
  const d = parseIsoDate(iso);
  return d ? formatPolishDate(d) : iso;
};

const Feedback: React.FC<{ errors: string[]; success?: string | null }> = ({ errors, success }) => (
  <div aria-live="polite">
    {errors.length > 0 && (
      <ul className="ops-error-list" role="alert">
        {errors.map((e) => (
          <li key={e}>{e}</li>
        ))}
      </ul>
    )}
    {success && errors.length === 0 && (
      <p className="ops-success" role="status">
        <CheckCircle2 size={16} aria-hidden="true" /> {success}
      </p>
    )}
  </div>
);

const SafetyNote: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="ops-note" role="note">
    <AlertTriangle size={18} aria-hidden="true" />
    <p>{children}</p>
  </div>
);

const ModuleShell: React.FC<{
  module: ModuleDefinition;
  onBackToDashboard: () => void;
  children: React.ReactNode;
}> = ({ module, onBackToDashboard, children }) => {
  const Icon = module.icon;
  return (
    <div className="module-view-container ops-module" data-testid={`ops-module-${module.id}`}>
      <div className="module-view-nav">
        <button type="button" className="back-to-dashboard-btn" onClick={onBackToDashboard}>
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Powrót do Pulpitu</span>
        </button>
        <span className="view-mode-pill ops-active-pill">Moduł aktywny • Dane lokalne</span>
      </div>
      <div className="module-view-header-card">
        <div className="module-view-header-left">
          <div className="module-view-icon-box">
            <Icon size={32} className="module-view-icon" aria-hidden="true" />
          </div>
          <div>
            <h1 className="module-view-title">{module.label}</h1>
            <p className="module-view-lead">{module.description}</p>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
};

const PartViQualificationsTable: React.FC<{ caption: string }> = ({ caption }) => (
  <>
    <p className="ops-muted">
      Pierwsze 7 kolumn odwzorowuje literalnie tabelę Części VI PSO 2027 (Dz. Urz. MZ 2026 poz. 77, str. 45: „Tak” lub „–”);
      ostatnia kolumna zawiera komentarz wynikający z odrębnych aktów prawnych wskazanych w przypisach * i **.
    </p>
    <div className="ops-table-scroll" tabIndex={0} role="region" aria-label={caption}>
      <table className="ops-table">
        <caption className="ops-sr-only">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Zawód medyczny (PSO cz. VI, str. 45)</th>
            <th scope="col">Kwalifikacja – obowiązkowe* (PSO str. 45)</th>
            <th scope="col">Podanie – obowiązkowe* (PSO str. 45)</th>
            <th scope="col">Kwalifikacja – zalecane (&lt;9 lat)** (PSO str. 45)</th>
            <th scope="col">Kwalifikacja – zalecane (9–18 lat)** (PSO str. 45)</th>
            <th scope="col">Kwalifikacja – zalecane (&gt;18 lat)** (PSO str. 45)</th>
            <th scope="col">Podanie – zalecane** (PSO str. 45)</th>
            <th scope="col">Warunki formalne / prawne (ustawy odrębne — poza tabelą PSO)</th>
          </tr>
        </thead>
        <tbody>
          {STAFF_QUALIFICATIONS_PSO_PART_VI.map((s) => (
            <tr key={s.professionId}>
              <th scope="row">{s.professionName}</th>
              <td>{s.qualificationMandatory ? 'Tak' : '– (Nie)'}</td>
              <td>{s.administrationMandatory ? 'Tak' : '– (Nie)'}</td>
              <td>{s.qualificationRecommendedUnder9 ? 'Tak' : '– (Nie)'}</td>
              <td>{s.qualificationRecommended9To18 ? 'Tak' : '– (Nie)'}</td>
              <td>{s.qualificationRecommendedOver18 ? 'Tak' : '– (Nie)'}</td>
              <td>{s.administrationRecommended ? 'Tak' : '– (Nie)'}</td>
              <td>{s.legalConditionsDescription}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <PsoPartVIFootnotesBlock footnotes={PSO_PART_VI_OFFICIAL_FOOTNOTES} headingLevel="h3" />
  </>
);

// ---------------------------------------------------------------------------
// Kalendarz szczepień (PSO 2027) — dane wyłącznie z rekordów PSO aplikacji
// ---------------------------------------------------------------------------

type PsoCalendarTab =
  | 'age_schedule'
  | 'part_1_full'
  | 'part_2_full'
  | 'part_3_full'
  | 'catch_up'
  | 'combined'
  | 'principles'
  | 'part_7_matrices'
  | 'completeness'
  | 'qualifications';

const OPS_CALENDAR_TAB_ORDER: PsoCalendarTab[] = [
  'age_schedule',
  'part_1_full',
  'part_2_full',
  'part_3_full',
  'catch_up',
  'combined',
  'principles',
  'part_7_matrices',
  'completeness',
  'qualifications',
];

const CalendarView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PsoCalendarTab>('age_schedule');
  const [stage, setStage] = useState<AgeStageGroup>('all');
  const [obligation, setObligation] = useState<'all' | 'obowiazkowe' | 'zalecane'>('all');

  const handleTabKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    tab: PsoCalendarTab
  ) => {
    const idx = OPS_CALENDAR_TAB_ORDER.indexOf(tab);
    if (idx === -1) return;
    let nextTab: PsoCalendarTab | null = null;
    if (event.key === 'ArrowRight') {
      nextTab = OPS_CALENDAR_TAB_ORDER[(idx + 1) % OPS_CALENDAR_TAB_ORDER.length];
    } else if (event.key === 'ArrowLeft') {
      nextTab = OPS_CALENDAR_TAB_ORDER[(idx - 1 + OPS_CALENDAR_TAB_ORDER.length) % OPS_CALENDAR_TAB_ORDER.length];
    } else if (event.key === 'Home') {
      nextTab = OPS_CALENDAR_TAB_ORDER[0];
    } else if (event.key === 'End') {
      nextTab = OPS_CALENDAR_TAB_ORDER[OPS_CALENDAR_TAB_ORDER.length - 1];
    }
    if (!nextTab) return;
    event.preventDefault();
    setActiveTab(nextTab);
    requestAnimationFrame(() => {
      document.getElementById(`ops-cal-tab-${nextTab}`)?.focus();
    });
  };

  const grouped = useMemo(() => {
    const brackets = [...CHILD_AGE_BRACKETS].sort((a, b) => a.order - b.order);
    return brackets
      .filter((b) => stage === 'all' || b.stageGroup === stage)
      .map((b) => ({
        bracket: b,
        items: CHILD_VACCINES_CATALOG.filter(
          (v) => v.ageBracketId === b.id && (obligation === 'all' || v.obligationType === obligation)
        )
      }))
      .filter((g) => g.items.length > 0);
  }, [stage, obligation]);

  const total = grouped.reduce((n, g) => n + g.items.length, 0);

  return (
    <>
      <SafetyNote>
        Kalendarz prezentuje informacje z Programu Szczepień Ochronnych na 2027 r. (Dz. Urz. Min. Zdrow. 2026 poz. 77 /
        komunikat GIS z 28.10.2026 r.). Nie stanowi indywidualnego planu szczepienia ani kwalifikacji pacjenta.
      </SafetyNote>

      <div className="ops-tabs" role="tablist" aria-label="Części Programu Szczepień Ochronnych 2027">
        <button
          id="ops-cal-tab-age_schedule"
          type="button"
          role="tab"
          aria-selected={activeTab === 'age_schedule'}
          aria-controls={activeTab === 'age_schedule' ? 'ops-cal-panel-age_schedule' : undefined}
          tabIndex={activeTab === 'age_schedule' ? 0 : -1}
          className={`ops-tab ${activeTab === 'age_schedule' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('age_schedule')}
          onKeyDown={(e) => handleTabKeyDown(e, 'age_schedule')}
        >
          Część I i II: Kalendarz wieku (12 grup)
        </button>
        <button
          id="ops-cal-tab-part_1_full"
          type="button"
          role="tab"
          aria-selected={activeTab === 'part_1_full'}
          aria-controls={activeTab === 'part_1_full' ? 'ops-cal-panel-part_1_full' : undefined}
          tabIndex={activeTab === 'part_1_full' ? 0 : -1}
          className={`ops-tab ${activeTab === 'part_1_full' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('part_1_full')}
          onKeyDown={(e) => handleTabKeyDown(e, 'part_1_full')}
        >
          Część I pełna (I.A–I.E)
        </button>
        <button
          id="ops-cal-tab-part_2_full"
          type="button"
          role="tab"
          aria-selected={activeTab === 'part_2_full'}
          aria-controls={activeTab === 'part_2_full' ? 'ops-cal-panel-part_2_full' : undefined}
          tabIndex={activeTab === 'part_2_full' ? 0 : -1}
          className={`ops-tab ${activeTab === 'part_2_full' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('part_2_full')}
          onKeyDown={(e) => handleTabKeyDown(e, 'part_2_full')}
        >
          Część II pełna (II.A–II.I)
        </button>
        <button
          id="ops-cal-tab-part_3_full"
          type="button"
          role="tab"
          aria-selected={activeTab === 'part_3_full'}
          aria-controls={activeTab === 'part_3_full' ? 'ops-cal-panel-part_3_full' : undefined}
          tabIndex={activeTab === 'part_3_full' ? 0 : -1}
          className={`ops-tab ${activeTab === 'part_3_full' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('part_3_full')}
          onKeyDown={(e) => handleTabKeyDown(e, 'part_3_full')}
        >
          Część III: Uzupełniające (A–M)
        </button>
        <button
          id="ops-cal-tab-catch_up"
          type="button"
          role="tab"
          aria-selected={activeTab === 'catch_up'}
          aria-controls={activeTab === 'catch_up' ? 'ops-cal-panel-catch_up' : undefined}
          tabIndex={activeTab === 'catch_up' ? 0 : -1}
          className={`ops-tab ${activeTab === 'catch_up' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('catch_up')}
          onKeyDown={(e) => handleTabKeyDown(e, 'catch_up')}
        >
          Część V: Szczepienia wyrównawcze (12 zasad)
        </button>
        <button
          id="ops-cal-tab-combined"
          type="button"
          role="tab"
          aria-selected={activeTab === 'combined'}
          aria-controls={activeTab === 'combined' ? 'ops-cal-panel-combined' : undefined}
          tabIndex={activeTab === 'combined' ? 0 : -1}
          className={`ops-tab ${activeTab === 'combined' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('combined')}
          onKeyDown={(e) => handleTabKeyDown(e, 'combined')}
        >
          Część III.M: Warianty 5w1 i 6w1
        </button>
        <button
          id="ops-cal-tab-principles"
          type="button"
          role="tab"
          aria-selected={activeTab === 'principles'}
          aria-controls={activeTab === 'principles' ? 'ops-cal-panel-principles' : undefined}
          tabIndex={activeTab === 'principles' ? 0 : -1}
          className={`ops-tab ${activeTab === 'principles' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('principles')}
          onKeyDown={(e) => handleTabKeyDown(e, 'principles')}
        >
          Część IV: 7 zasad ogólnych
        </button>
        <button
          id="ops-cal-tab-part_7_matrices"
          type="button"
          role="tab"
          aria-selected={activeTab === 'part_7_matrices'}
          aria-controls={activeTab === 'part_7_matrices' ? 'ops-cal-panel-part_7_matrices' : undefined}
          tabIndex={activeTab === 'part_7_matrices' ? 0 : -1}
          className={`ops-tab ${activeTab === 'part_7_matrices' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('part_7_matrices')}
          onKeyDown={(e) => handleTabKeyDown(e, 'part_7_matrices')}
        >
          Część VII: Skrócone kalendarze
        </button>
        <button
          id="ops-cal-tab-completeness"
          type="button"
          role="tab"
          aria-selected={activeTab === 'completeness'}
          aria-controls={activeTab === 'completeness' ? 'ops-cal-panel-completeness' : undefined}
          tabIndex={activeTab === 'completeness' ? 0 : -1}
          className={`ops-tab ${activeTab === 'completeness' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('completeness')}
          onKeyDown={(e) => handleTabKeyDown(e, 'completeness')}
        >
          Kompletność i wyszukiwarka PSO
        </button>
        <button
          id="ops-cal-tab-qualifications"
          type="button"
          role="tab"
          aria-selected={activeTab === 'qualifications'}
          aria-controls={activeTab === 'qualifications' ? 'ops-cal-panel-qualifications' : undefined}
          tabIndex={activeTab === 'qualifications' ? 0 : -1}
          className={`ops-tab ${activeTab === 'qualifications' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('qualifications')}
          onKeyDown={(e) => handleTabKeyDown(e, 'qualifications')}
        >
          Część VI: Uprawnienia personelu
        </button>
      </div>

      {activeTab === 'age_schedule' && (
        <div
          id="ops-cal-panel-age_schedule"
          role="tabpanel"
          aria-labelledby="ops-cal-tab-age_schedule"
        >
          <section className="ops-panel" aria-labelledby="ops-cal-filters">
            <h2 id="ops-cal-filters" className="ops-panel-title">
              Filtry kalendarza PSO 2027
            </h2>
            <div className="ops-form-grid">
              <label className="ops-field">
                <span>Etap wiekowy</span>
                <select value={stage} onChange={(e) => setStage(e.target.value as AgeStageGroup)}>
                  {STAGE_GROUPS_CONFIG.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="ops-field">
                <span>Rodzaj szczepienia</span>
                <select
                  value={obligation}
                  onChange={(e) => setObligation(e.target.value as typeof obligation)}
                >
                  <option value="all">Wszystkie</option>
                  <option value="obowiazkowe">Obowiązkowe</option>
                  <option value="zalecane">Zalecane</option>
                </select>
              </label>
            </div>
            <p className="ops-muted" role="status">
              Wyświetlono {total} pozycji PSO w {grouped.length} etapach wiekowych. Źródło: Dz. Urz. Min. Zdrow.
              2026 poz. 77 (komunikat GIS z 28.10.2026).
            </p>
          </section>

          {grouped.length === 0 ? (
            <section className="ops-panel" role="status">
              <p className="ops-muted">
                Brak pozycji PSO 2027 spełniających wybrane kryteria filtra.
              </p>
              <div className="ops-actions">
                <button
                  type="button"
                  className="ops-btn-secondary"
                  onClick={() => {
                    setStage('all');
                    setObligation('all');
                  }}
                >
                  Zresetuj filtry kalendarza
                </button>
              </div>
            </section>
          ) : (
            grouped.map(({ bracket, items }) => (
            <section key={bracket.id} className="ops-panel" aria-labelledby={`ops-cal-${bracket.id}`}>
              <h2 id={`ops-cal-${bracket.id}`} className="ops-panel-title">
                {bracket.label} <span className="ops-tag">{bracket.shortLabel}</span>
              </h2>
              <p className="ops-muted">{bracket.timingDescription}</p>
              <div className="ops-table-scroll" tabIndex={0} role="region" aria-label={`Szczepienia PSO 2027 — ${bracket.label}`}>
                <table className="ops-table">
                  <caption className="ops-sr-only">Szczepienia PSO 2027 — {bracket.label}</caption>
                  <thead>
                    <tr>
                      <th scope="col">Szczepienie</th>
                      <th scope="col">Dawka</th>
                      <th scope="col">Rodzaj</th>
                      <th scope="col">Wiek podania</th>
                      <th scope="col">Min. odstęp (PSO)</th>
                      <th scope="col">Źródło PSO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((v: ChildVaccineItem) => (
                      <tr key={v.id}>
                        <td>
                          <strong>{v.shortCode}</strong> — {v.disease}
                        </td>
                        <td>{v.doseLabel}</td>
                        <td>
                          <span className={`ops-badge ops-badge--${v.obligationType === 'obowiazkowe' ? 'info' : 'neutral'}`}>
                            {v.obligationType === 'obowiazkowe' ? 'Obowiązkowe' : 'Zalecane'}
                          </span>
                        </td>
                        <td>{v.targetAgeDisplay}</td>
                        <td>{v.minIntervalFromPrevious ?? '—'}</td>
                        <td>
                          {v.sourcePart}, s. {v.sourcePrintedPage}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            ))
          )}
        </div>
      )}

      {activeTab === 'part_1_full' && (
        <section
          id="ops-cal-panel-part_1_full"
          role="tabpanel"
          aria-labelledby="ops-cal-tab-part_1_full"
          className="ops-panel"
        >
          <h2 className="ops-sr-only">Część I PSO 2027 — Szczepienia obowiązkowe (pełny zakres)</h2>
          <PsoPartISectionsView />
        </section>
      )}

      {activeTab === 'part_2_full' && (
        <section
          id="ops-cal-panel-part_2_full"
          role="tabpanel"
          aria-labelledby="ops-cal-tab-part_2_full"
          className="ops-panel"
        >
          <h2 className="ops-sr-only">Część II PSO 2027 — Szczepienia zalecane i uodpornienie bierne</h2>
          <PsoPartIISectionsView />
        </section>
      )}

      {activeTab === 'part_3_full' && (
        <section
          id="ops-cal-panel-part_3_full"
          role="tabpanel"
          aria-labelledby="ops-cal-tab-part_3_full"
          className="ops-panel"
        >
          <h2 className="ops-sr-only">Część III PSO 2027 — Informacje uzupełniające A–M</h2>
          <PsoPartIIISectionsView />
        </section>
      )}

      {activeTab === 'catch_up' && (
        <section
          id="ops-cal-panel-catch_up"
          role="tabpanel"
          aria-labelledby="ops-cal-tab-catch_up"
          className="ops-panel"
        >
          <h2 id="ops-cal-catchup" className="ops-panel-title">
            Część V PSO 2027 — Szczepienia wyrównawcze (s. 44 Dz. Urz. 2026 poz. 77)
          </h2>
          <p className="ops-muted">
            12 oficjalnych zasad prawnych regulujących postępowanie w przypadku opóźnień i szczepień wyrównawczych.
          </p>
          <ol className="ops-ordered">
            {PSO_CATCH_UP_12_POINTS_PART_V.map((item) => (
              <li key={item.pointNumber}>
                <h3 className="ops-card-title">
                  Punkt {item.pointNumber}: {item.title}
                </h3>
                <p>{item.officialRuleText}</p>
                <p className="ops-small">
                  Źródło: Część V PSO 2027, s. {item.psoPdfPage} • Zastosowanie: {item.clinicalApplication}
                </p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {activeTab === 'combined' && (
        <section
          id="ops-cal-panel-combined"
          role="tabpanel"
          aria-labelledby="ops-cal-tab-combined"
          className="ops-panel"
        >
          <h2 id="ops-cal-combined" className="ops-panel-title">
            Część III.M PSO 2027 — Warianty szczepionek wysoce skojarzonych (5w1 i 6w1)
          </h2>
          <p className="ops-muted">
            Zasady wymiany preparatów monowalentnych na wieloskładnikowe i koordynacja dawek WZW B w 1. dobie życia.
          </p>
          <div className="ops-table-scroll" tabIndex={0} role="region" aria-label="Warianty szczepionek skojarzonych Części III.M PSO 2027">
            <table className="ops-table">
              <caption className="ops-sr-only">Warianty szczepionek skojarzonych Części III.M PSO 2027</caption>
              <thead>
                <tr>
                  <th scope="col">Wariant</th>
                  <th scope="col">Schemat</th>
                  <th scope="col">Składniki</th>
                  <th scope="col">Warunek dawki WZW B</th>
                  <th scope="col">Źródło PSO</th>
                </tr>
              </thead>
              <tbody>
                {COMBINED_VACCINES_VARIANTS_PART_III_M.map((cv) => (
                  <tr key={cv.id}>
                    <td>
                      <strong>{cv.name}</strong>
                    </td>
                    <td>{cv.scheduleDetails}</td>
                    <td>{cv.antigenComposition}</td>
                    <td>{cv.hbvAdministrationRule}</td>
                    <td>{cv.psoPartAndSection}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'principles' && (
        <section
          id="ops-cal-panel-principles"
          role="tabpanel"
          aria-labelledby="ops-cal-tab-principles"
          className="ops-panel"
        >
          <h2 id="ops-cal-principles" className="ops-panel-title">
            Część IV PSO 2027 — Ogólne zasady przeprowadzania i organizacji szczepień (s. 43)
          </h2>
          <p className="ops-muted">
            <strong>Preambuła Części IV PSO:</strong> {PSO_PART_IV_PREAMBLE.officialText}
          </p>
          <ol className="ops-ordered">
            {PSO_GENERAL_PRINCIPLES_PART_IV.map((p) => (
              <li key={p.pointNumber}>
                <h3 className="ops-card-title">{p.title}</h3>
                <p>{p.officialRuleText}</p>
                <p className="ops-small">
                  {p.psoSection} • s. {p.psoPdfPage}
                </p>
              </li>
            ))}
          </ol>
          <PsoPartIVSeparateLawsSection rules={SEPARATE_LEGAL_ACT_RULES_NON_PSO} />
        </section>
      )}

      {activeTab === 'part_7_matrices' && (
        <section
          id="ops-cal-panel-part_7_matrices"
          role="tabpanel"
          aria-labelledby="ops-cal-tab-part_7_matrices"
          className="ops-panel"
        >
          <h2 className="ops-sr-only">Część VII PSO 2027 — Skrócone kalendarze szczepień</h2>
          <PsoPartVIIMatrices />
        </section>
      )}

      {activeTab === 'completeness' && (
        <section
          id="ops-cal-panel-completeness"
          role="tabpanel"
          aria-labelledby="ops-cal-tab-completeness"
          className="ops-panel"
        >
          <h2 className="ops-sr-only">Kompletność 7 części PSO 2027 i wyszukiwarka</h2>
          <Pso2027SearchAndCompletenessPanel />
        </section>
      )}

      {activeTab === 'qualifications' && (
        <section
          id="ops-cal-panel-qualifications"
          role="tabpanel"
          aria-labelledby="ops-cal-tab-qualifications"
          className="ops-panel"
        >
          <h2 id="ops-cal-qualifications" className="ops-panel-title">
            Część VI PSO 2027 — Uprawnienia osób wykonujących zawód medyczny
          </h2>
          <PartViQualificationsTable caption="Tabela uprawnień personelu z Części VI PSO 2027" />
        </section>
      )}

      <a
        className="ops-link"
        href="https://www.gov.pl/web/gis/program-szczepien-ochronnych-na-2027-rok"
        target="_blank"
        rel="noopener noreferrer"
      >
        Oficjalny komunikat GIS — PSO 2027 (gov.pl) <ExternalLink size={14} aria-hidden="true" />
      </a>
    </>
  );
};

// ---------------------------------------------------------------------------
// Szczepienia dorosłych — rekordy PSO o zakresie adult/cross_age/adultScopes + katalog
// ---------------------------------------------------------------------------

const AdultView: React.FC<{ onSelectVaccineProduct?: (id: string) => void }> = ({
  onSelectVaccineProduct
}) => {
  const [query, setQuery] = useState('');
  const liveCatalogVaccines = useMemo(() => {
    const storage = getBrowserStorage();
    return loadVaccinesFromStorage(storage, VACCINES_CATALOG).vaccines;
  }, []);
  const q = query.trim().toLowerCase();
  const psoItems = CHILD_VACCINES_CATALOG.filter(
    (v) =>
      (v.populationScope === 'adult' ||
        v.populationScope === 'cross_age' ||
        Boolean(v.fundingAuditDetails?.adultAndSpecialReferenceScopes?.length)) &&
      (!q || `${v.disease} ${v.shortCode} ${v.targetGroupDescription}`.toLowerCase().includes(q))
  );
  const products = liveCatalogVaccines.filter(
    (p) =>
      (p.targetGroup === 'dorosli' || p.targetGroup === 'uniwersalna') &&
      (!q || `${p.tradeName} ${p.activeSubstance}`.toLowerCase().includes(q))
  );

  const matchAdultPsoRow = (row: (typeof PSO_PART_IIB_ADULTS_RECOMMENDED)[number]) =>
    !q || `${row.subjectLabel} ${row.recommendations} ${row.notes} ${row.sourceSubsection}`.toLowerCase().includes(q);

  const adultRecommendedIIB = PSO_PART_IIB_ADULTS_RECOMMENDED.filter(matchAdultPsoRow);
  const pregnancyIIC = PSO_PART_IIC_PREGNANCY.filter(matchAdultPsoRow);
  const healthcareWorkersIID = PSO_PART_IID_HEALTHCARE_WORKERS.filter(matchAdultPsoRow);
  const otherWorkersIIE = PSO_PART_IIE_OTHER_WORKERS.filter(matchAdultPsoRow);
  const postExposureIIF = PSO_PART_IIF_POST_EXPOSURE.filter(matchAdultPsoRow);
  const travelII = PSO_PART_III_TRAVEL_ENDEMIC.filter(matchAdultPsoRow);
  const showHbvMatrixIIG =
    !q ||
    PSO_PART_IIG_HBV_PEP_MATRIX.some((r) =>
      `${r.exposedPersonStatus} ${r.sourceHbsAgPositive} ${r.sourceHbsAgNegative} ${r.sourceUnknown}`
        .toLowerCase()
        .includes(q)
    );

  return (
    <>
      <SafetyNote>
        Zestawienie ma charakter referencyjny. Kwalifikacja do szczepienia osoby dorosłej należy do uprawnionego
        personelu na podstawie aktualnej ChPL i PSO.
      </SafetyNote>
      <section className="ops-panel" aria-labelledby="ops-adult-search">
        <h2 id="ops-adult-search" className="ops-panel-title">
          Wyszukiwanie
        </h2>
        <label className="ops-field">
          <span>Choroba, antygen lub nazwa preparatu</span>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
      </section>

      <section className="ops-panel" aria-labelledby="ops-adult-iib">
        <div className="pso-block-header">
          <h2 id="ops-adult-iib" className="ops-panel-title">
            Część II.B PSO 2027 — Szczepienia zalecane dorosłym ({adultRecommendedIIB.length} pozycji, str. 22–27)
          </h2>
          <PsoSourceLinkBadge subsection="Część II.B" pages={[22, 27]} verificationStatus="verified" />
        </div>
        {adultRecommendedIIB.length === 0 ? (
          <p className="ops-muted">Brak pozycji z Części II.B pasujących do kryteriów.</p>
        ) : (
          <ul className="ops-card-list">
            {adultRecommendedIIB.map((row) => (
              <li key={row.id} className="ops-card">
                <h3 className="ops-card-title">{row.subjectLabel}</h3>
                <p className="ops-muted">{row.recommendations}</p>
                {row.notes && <p className="ops-small">Uwagi: {row.notes}</p>}
                <PsoSourceLinkBadge
                  subsection={row.sourceSubsection}
                  pages={row.sourcePages}
                  verificationStatus={row.verificationStatus}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="ops-panel" aria-labelledby="ops-adult-special-groups">
        <div className="pso-block-header">
          <h2 id="ops-adult-special-groups" className="ops-panel-title">
            Część II.C–II.E PSO 2027 — Kobiety w ciąży, personel medyczny i grupy zawodowe
          </h2>
          <PsoSourceLinkBadge subsection="Część II.C–II.E" pages={[28, 31]} verificationStatus="verified" />
        </div>
        {pregnancyIIC.length > 0 && (
          <>
            <h3 className="ops-sub-title">II.C — Kobiety w ciąży (str. 28–29)</h3>
            <ul className="ops-card-list">
              {pregnancyIIC.map((row) => (
                <li key={row.id} className="ops-card">
                  <h4 className="ops-card-title">{row.subjectLabel}</h4>
                  <p className="ops-muted">{row.recommendations}</p>
                  {row.notes && <p className="ops-small">{row.notes}</p>}
                </li>
              ))}
            </ul>
          </>
        )}
        {healthcareWorkersIID.length > 0 && (
          <>
            <h3 className="ops-sub-title">II.D — Osoby wykonujące zawód medyczny (str. 29–30)</h3>
            <ul className="ops-card-list">
              {healthcareWorkersIID.map((row) => (
                <li key={row.id} className="ops-card">
                  <h4 className="ops-card-title">{row.subjectLabel}</h4>
                  <p className="ops-muted">{row.recommendations}</p>
                  {row.notes && <p className="ops-small">{row.notes}</p>}
                </li>
              ))}
            </ul>
          </>
        )}
        {otherWorkersIIE.length > 0 && (
          <>
            <h3 className="ops-sub-title">II.E — Szczepienia pracownicze finansowane przez pracodawcę (str. 30–31)</h3>
            <p className="ops-small">{PSO_PART_IIE_OCCUPATIONAL_INTRO.legalBasisText}</p>
            <ul className="ops-card-list">
              {otherWorkersIIE.map((row) => (
                <li key={row.id} className="ops-card">
                  <h4 className="ops-card-title">{row.subjectLabel}</h4>
                  <p className="ops-muted">{row.recommendations}</p>
                  {row.notes && <p className="ops-small">{row.notes}</p>}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {(postExposureIIF.length > 0 || showHbvMatrixIIG || travelII.length > 0) && (
        <section className="ops-panel" aria-labelledby="ops-adult-pep-travel">
          <div className="pso-block-header">
            <h2 id="ops-adult-pep-travel" className="ops-panel-title">
              Część II.F–G i II.I PSO 2027 — Profilaktyka poekspozycyjna, HBV oraz medycyna podróży
            </h2>
            <PsoSourceLinkBadge subsection="Część II.F–G, II.I" pages={[32, 35]} verificationStatus="verified" />
          </div>
          {postExposureIIF.length > 0 && (
            <>
              <h3 className="ops-sub-title">II.F — Szczepienia poekspozycyjne (str. 32)</h3>
              <ul className="ops-card-list">
                {postExposureIIF.map((row) => (
                  <li key={row.id} className="ops-card">
                    <h4 className="ops-card-title">{row.subjectLabel}</h4>
                    <p className="ops-muted">{row.recommendations}</p>
                  </li>
                ))}
              </ul>
            </>
          )}
          {showHbvMatrixIIG && (
            <>
              <h3 className="ops-sub-title">II.G — Swoiste zapobieganie WZW typu B po ekspozycji na HBV (str. 33–34)</h3>
              <div
                className="pso-matrix-scroll"
                tabIndex={0}
                role="region"
                aria-label="Matryca II.G profilaktyki poekspozycyjnej WZW typu B dla dorosłych"
              >
                <table className="pso-data-table">
                  <thead>
                    <tr>
                      <th scope="col">Status uodpornienia osoby eksponowanej</th>
                      <th scope="col">Źródło HBsAg (+)</th>
                      <th scope="col">Źródło HBsAg (–)</th>
                      <th scope="col">Źródło nieznane</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PSO_PART_IIG_HBV_PEP_MATRIX.map((r) => (
                      <tr key={r.id}>
                        <th scope="row">{r.exposedPersonStatus}</th>
                        <td>{r.sourceHbsAgPositive}</td>
                        <td>{r.sourceHbsAgNegative}</td>
                        <td>{r.sourceUnknown}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {travelII.length > 0 && (
            <>
              <h3 className="ops-sub-title">II.I — Szczepienia zalecane podróżującym za granicę (str. 35)</h3>
              <p className="ops-small">{PSO_PART_III_TRAVEL_NOTE}</p>
              <ul className="ops-card-list">
                {travelII.map((row) => (
                  <li key={row.id} className="ops-card">
                    <h4 className="ops-card-title">{row.subjectLabel}</h4>
                    <p className="ops-muted">{row.recommendations}</p>
                    {row.notes && <p className="ops-small">{row.notes}</p>}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      <section className="ops-panel" aria-labelledby="ops-adult-viic">
        <h2 id="ops-adult-viic" className="ops-panel-title">
          Część VII.C PSO 2027 — Skrócony kalendarz szczepień dorosłych (str. 48)
        </h2>
        <h3 className="ops-sub-title">Rozkład szczepień zalecanych dorosłym według przedziałów wieku</h3>
        <PsoPartVIIMatrices subsectionFilter={['VII.C']} />
      </section>

      <section className="ops-panel" aria-labelledby="ops-adult-pso">
        <h2 id="ops-adult-pso" className="ops-panel-title">
          Procedury PSO 2027 obejmujące dorosłych ({psoItems.length})
        </h2>
        {psoItems.length === 0 ? (
          <p className="ops-muted">Brak pozycji PSO pasujących do kryteriów.</p>
        ) : (
          <ul className="ops-card-list">
            {psoItems.map((v) => (
              <li key={v.id} className="ops-card">
                <h3 className="ops-card-title">
                  {v.shortCode} — {v.disease}
                </h3>
                <p className="ops-muted">{v.targetGroupDescription}</p>
                <p className="ops-muted">
                  {v.obligationType === 'obowiazkowe' ? 'Obowiązkowe' : 'Zalecane'} • {v.fundingStatus}
                </p>
                <p className="ops-small">
                  Źródło: {v.sourcePart}, s. {v.sourcePrintedPage} •{' '}
                  {v.populationScope === 'adult'
                    ? 'dorośli'
                    : v.populationScope === 'cross_age'
                      ? 'procedura wielowiekowa'
                      : 'zawiera wyodrębniony zakres dla dorosłych / grup ryzyka'}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="ops-panel" aria-labelledby="ops-adult-products">
        <h2 id="ops-adult-products" className="ops-panel-title">
          Preparaty w katalogu dla dorosłych ({products.length})
        </h2>
        {products.length === 0 ? (
          <p className="ops-muted">Brak preparatów pasujących do kryteriów.</p>
        ) : (
          <ul className="ops-card-list">
            {products.map((p) => (
              <li key={p.id} className="ops-card">
                <h3 className="ops-card-title">{p.tradeName}</h3>
                <p className="ops-muted">{p.activeSubstance}</p>
                <p className="ops-small">
                  {VACCINE_TYPE_LABELS[p.vaccineType]} • {TARGET_GROUP_LABELS[p.targetGroup]} •{' '}
                  {VERIFICATION_STATUS_META[p.verificationStatus].label}
                </p>
                {onSelectVaccineProduct && (
                  <button
                    type="button"
                    className="ops-btn-secondary"
                    onClick={() => onSelectVaccineProduct(p.id)}
                    aria-label={`Otwórz Kartę ChPL: ${p.tradeName}`}
                  >
                    Otwórz Kartę ChPL
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
};

// ---------------------------------------------------------------------------
// Kalkulator terminów
// ---------------------------------------------------------------------------

const CalculatorView: React.FC = () => {
  const [lastDose, setLastDose] = useState('');
  const [interval, setInterval] = useState('');
  const [unit, setUnit] = useState<IntervalUnit>('days');
  const [planned, setPlanned] = useState('');
  const [refProcId, setRefProcId] = useState('');
  const [selectedRuleId, setSelectedRuleId] = useState<string>('');
  const [ruleCategoryFilter, setRuleCategoryFilter] = useState<string>('all');
  const [birth, setBirth] = useState('');
  const [ageRef, setAgeRef] = useState(todayIsoDate());
  const [submitted, setSubmitted] = useState(false);

  const procsWithInterval = useMemo(
    () => CHILD_VACCINES_CATALOG.filter((v) => v.minIntervalFromPrevious),
    []
  );
  const refProc = procsWithInterval.find((v) => v.id === refProcId) ?? null;
  const selectedRule = useMemo(
    () => PSO_INTERVAL_RULES_DATABASE.find((r) => r.id === selectedRuleId) ?? null,
    [selectedRuleId]
  );

  const filteredRules = useMemo(() => {
    if (ruleCategoryFilter === 'all') return PSO_INTERVAL_RULES_DATABASE;
    return PSO_INTERVAL_RULES_DATABASE.filter((r) => r.category === ruleCategoryFilter);
  }, [ruleCategoryFilter]);

  const handleApplyRule = (rule: PsoIntervalRule) => {
    setSelectedRuleId(rule.id);
    setUnit(rule.defaultUnit);
    setInterval(String(rule.defaultInterval));
    setRefProcId('');
    setSubmitted(false);
  };

  const result = submitted
    ? calculateNextDoseDate({
        lastDoseDate: lastDose,
        minIntervalDays: interval,
        intervalUnit: unit,
        plannedDate: planned
      })
    : null;
  const age = birth ? calculateAgeAt(birth, ageRef) : null;

  return (
    <>
      <SafetyNote>
        Kalkulator wykonuje arytmetykę dat wspieraną urzędową bazą reguł minimalnych odstępów PSO 2027 (Część IV) oraz ChPL.
        Wszelkie decyzje o podaniu preparatu podejmuje kwalifikujący personel medyczny. Żadne dane wejściowe nie są
        utrwalane w pamięci trwałej przeglądarki.
      </SafetyNote>

      <section className="ops-panel" aria-labelledby="ops-calc-next">
        <h2 id="ops-calc-next" className="ops-panel-title">
          Najwcześniejszy termin kolejnej dawki
        </h2>
        <form
          className="ops-form-grid"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
          }}
        >
          <label className="ops-field">
            <span>Data ostatniej dawki</span>
            <input type="date" value={lastDose} onChange={(e) => setLastDose(e.target.value)} required />
          </label>
          <label className="ops-field">
            <span>Jednostka odstępu</span>
            <select value={unit} onChange={(e) => setUnit(e.target.value as IntervalUnit)}>
              <option value="days">Dni</option>
              <option value="months">Miesiące (kalendarzowe UTC)</option>
              <option value="years">Lata (kalendarzowe UTC)</option>
            </select>
          </label>
          <label className="ops-field">
            <span>
              Minimalny odstęp [{unit === 'days' ? 'dni' : unit === 'months' ? 'mies.' : 'lat'}] (z ChPL / PSO)
            </span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={unit === 'days' ? 3650 : unit === 'months' ? 120 : 10}
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
              required
            />
          </label>
          <label className="ops-field">
            <span>Planowana data wizyty (opcjonalnie)</span>
            <input type="date" value={planned} onChange={(e) => setPlanned(e.target.value)} />
          </label>
          <label className="ops-field">
            <span>Reguła odstępu PSO 2027 (opcjonalnie)</span>
            <select
              value={selectedRuleId}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedRuleId(id);
                const found = PSO_INTERVAL_RULES_DATABASE.find((r) => r.id === id);
                if (found) {
                  setUnit(found.defaultUnit);
                  setInterval(String(found.defaultInterval));
                }
              }}
            >
              <option value="">— wybierz regułę z bazy PSO —</option>
              {PSO_INTERVAL_RULES_DATABASE.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.categoryLabel}: {r.title}
                </option>
              ))}
            </select>
          </label>
          <label className="ops-field">
            <span>Podgląd odstępu z rekordu PSO (opcjonalnie)</span>
            <select value={refProcId} onChange={(e) => setRefProcId(e.target.value)}>
              <option value="">— nie wybrano —</option>
              {procsWithInterval.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.shortCode}: {v.doseLabel}
                </option>
              ))}
            </select>
          </label>
          <div className="ops-actions">
            <button type="submit" className="ops-btn-primary">
              Oblicz termin
            </button>
            <button
              type="button"
              className="ops-btn-secondary"
              onClick={() => {
                setLastDose('');
                setInterval('');
                setUnit('days');
                setPlanned('');
                setRefProcId('');
                setSelectedRuleId('');
                setSubmitted(false);
              }}
            >
              Wyczyść formularz
            </button>
          </div>
        </form>

        {selectedRule && (
          <div className="ops-note" style={{ marginTop: '12px' }}>
            <p>
              <strong>Zastosowana reguła kliniczna:</strong> {selectedRule.title} (
              <em>{selectedRule.minIntervalText}</em>).
              <br />
              <span className="ops-small">{selectedRule.clinicalRationale}</span>
              <br />
              <strong>Źródło:</strong> {selectedRule.sourceReference}.
            </p>
          </div>
        )}

        {refProc && !selectedRule && (
          <p className="ops-muted" data-testid="ops-calc-pso-reference">
            Odstęp w PSO ({refProc.sourcePart}, s. {refProc.sourcePrintedPage}):{' '}
            <strong>{refProc.minIntervalFromPrevious}</strong>. Wprowadź wartość z odpowiednią jednostką (dni, miesiące lub lata) i potwierdź w aktualnej ChPL.
          </p>
        )}
        {result && <Feedback errors={result.errors} />}
        {result?.ok && result.earliestDate && (
          <div className="ops-result" role="status" data-testid="ops-calc-result">
            <p>
              Najwcześniejszy termin: <strong>{fmtDate(result.earliestDate)}</strong>
            </p>
            <p>
              Od ostatniej dawki minęło: <strong>{result.daysSinceLastDose}</strong> dni • do terminu pozostało:{' '}
              <strong>{result.daysUntilEarliest}</strong> dni
            </p>
            {result.plannedStatus === 'too_early' && (
              <p className="ops-text-danger">
                Planowana data jest o {result.plannedShortfallDays} dni za wczesna względem minimalnego odstępu.
              </p>
            )}
            {result.plannedStatus === 'allowed' && (
              <p className="ops-text-ok">Planowana data spełnia wprowadzony minimalny odstęp.</p>
            )}
          </div>
        )}
      </section>

      <section className="ops-panel" aria-labelledby="ops-calc-rules">
        <div className="ops-panel-head">
          <div>
            <h2 id="ops-calc-rules" className="ops-panel-title">
              Asystent reguł minimalnych odstępów PSO 2027 (Część IV, ChPL)
            </h2>
            <p className="ops-small">
              Wystandaryzowane zasady łączenia szczepionek, odstępów żywe–żywe oraz odraczania po preparatach krwi
            </p>
          </div>
        </div>

        <div className="ops-filter-bar" role="group" aria-label="Filtruj reguły odstępów według kategorii">
          <button
            type="button"
            className={`ops-filter-chip ${ruleCategoryFilter === 'all' ? 'is-active' : ''}`}
            onClick={() => setRuleCategoryFilter('all')}
          >
            Wszystkie ({PSO_INTERVAL_RULES_DATABASE.length})
          </button>
          <button
            type="button"
            className={`ops-filter-chip ${ruleCategoryFilter === 'live_vaccines' ? 'is-active' : ''}`}
            onClick={() => setRuleCategoryFilter('live_vaccines')}
          >
            Szczepionki żywe
          </button>
          <button
            type="button"
            className={`ops-filter-chip ${ruleCategoryFilter === 'inactivated_vaccines' ? 'is-active' : ''}`}
            onClick={() => setRuleCategoryFilter('inactivated_vaccines')}
          >
            Szczepionki inaktywowane
          </button>
          <button
            type="button"
            className={`ops-filter-chip ${ruleCategoryFilter === 'blood_products' ? 'is-active' : ''}`}
            onClick={() => setRuleCategoryFilter('blood_products')}
          >
            Immunoglobuliny / Krew
          </button>
          <button
            type="button"
            className={`ops-filter-chip ${ruleCategoryFilter === 'same_antigen_primary' ? 'is-active' : ''}`}
            onClick={() => setRuleCategoryFilter('same_antigen_primary')}
          >
            Schemat pierwotny i booster
          </button>
        </div>

        <div className="ops-rules-grid">
          {filteredRules.map((rule) => {
            const isApplied = selectedRuleId === rule.id;
            return (
              <div key={rule.id} className={`ops-rule-card ${isApplied ? 'is-applied' : ''}`}>
                <div className="ops-rule-head">
                  <span className="ops-badge ops-badge--info">{rule.categoryLabel}</span>
                  <span className="ops-rule-min-badge">{rule.minIntervalText}</span>
                </div>
                <h3 className="ops-rule-title">{rule.title}</h3>
                <p className="ops-rule-summary">
                  <strong>Zasada:</strong> {rule.ruleSummary}
                </p>
                <p className="ops-rule-rationale">
                  <strong>Uzasadnienie immunologiczne:</strong> {rule.clinicalRationale}
                </p>
                <p className="ops-small" style={{ marginTop: '4px' }}>
                  <strong>Wyjątki i uwagi:</strong> {rule.exceptionsAndNotes}
                </p>
                <div className="ops-rule-footer">
                  <span className="ops-small ops-muted">{rule.sourceReference}</span>
                  <button
                    type="button"
                    className="ops-btn-secondary"
                    style={{ fontSize: '0.8125rem', padding: '4px 10px' }}
                    onClick={() => handleApplyRule(rule)}
                  >
                    {isApplied ? 'Wybrana reguła' : 'Zastosuj regułę'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="ops-panel" aria-labelledby="ops-calc-age">
        <h2 id="ops-calc-age" className="ops-panel-title">
          Kalkulator wieku w dniu wizyty
        </h2>
        <p className="ops-muted">Data urodzenia nie jest zapisywana — obliczenie odbywa się tylko w pamięci karty.</p>
        <div className="ops-form-grid">
          <label className="ops-field">
            <span>Data urodzenia</span>
            <input type="date" value={birth} onChange={(e) => setBirth(e.target.value)} />
          </label>
          <label className="ops-field">
            <span>Data wizyty</span>
            <input type="date" value={ageRef} onChange={(e) => setAgeRef(e.target.value)} />
          </label>
        </div>
        {age && !age.ok && <Feedback errors={[age.error ?? '']} />}
        {age?.ok && (
          <div className="ops-result" role="status" data-testid="ops-age-result">
            <p>
              Wiek: <strong>{age.fullYears}</strong> lat i <strong>{age.remainderMonths}</strong> mies. (
              {age.fullMonths} pełnych miesięcy, {age.totalWeeks} tyg., {age.totalDays} dni)
            </p>
          </div>
        )}
      </section>
    </>
  );
};

// ---------------------------------------------------------------------------
// Procedury i checklisty
// ---------------------------------------------------------------------------

const ProceduresView: React.FC = () => {
  const storage = getBrowserStorage();
  const [storageWarning] = useState(() =>
    inspectOperationalStorageHealth(storage, LOCAL_CHECKLIST_STORAGE_KEY)
  );
  const [items, setItems] = useState<LocalChecklistItem[]>(() => loadLocalChecklist(storage));
  const [text, setText] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState<string | null>(null);

  const persist = (next: LocalChecklistItem[], msg: string): boolean => {
    const res = saveLocalChecklist(storage, next);
    if (!res.success) {
      setErrors([res.error ?? 'Błąd zapisu.']);
      setSuccess(null);
      return false;
    }
    setItems(next);
    setErrors([]);
    setSuccess(msg);
    return true;
  };

  const done = items.filter((i) => i.done).length;

  return (
    <>
      <section className="ops-panel" aria-labelledby="ops-proc-pso">
        <h2 id="ops-proc-pso" className="ops-panel-title">
          Ogólne zasady przeprowadzania szczepień (Część IV PSO 2027, s. 43)
        </h2>
        <p className="ops-muted">
          <strong>Preambuła Części IV PSO:</strong> {PSO_PART_IV_PREAMBLE.officialText}
        </p>
        <ol className="ops-ordered">
          {PSO_GENERAL_PRINCIPLES_PART_IV.map((p) => (
            <li key={p.pointNumber}>
              <h3 className="ops-card-title">{p.title}</h3>
              <p>{p.officialRuleText}</p>
              <p className="ops-small">
                {p.psoSection} • s. {p.psoPdfPage}
              </p>
            </li>
          ))}
        </ol>
        <PsoPartIVSeparateLawsSection rules={SEPARATE_LEGAL_ACT_RULES_NON_PSO} />
      </section>

      <section className="ops-panel" aria-labelledby="ops-proc-staff">
        <h2 id="ops-proc-staff" className="ops-panel-title">
          Uprawnienia personelu (Część VI PSO 2027)
        </h2>
        <PartViQualificationsTable caption="Uprawnienia zawodów medycznych do kwalifikacji i podania szczepień" />
      </section>

      <section className="ops-panel" aria-labelledby="ops-proc-local">
        <h2 id="ops-proc-local" className="ops-panel-title">
          Lokalna checklista punktu szczepień ({done}/{items.length})
        </h2>
        {storageWarning && (
          <div className="ops-note ops-note--danger" role="alert">
            <AlertTriangle size={18} aria-hidden="true" />
            <p>
              Wykryto uszkodzony lub nieczytelny zapis lokalnej checklisty w pamięci przeglądarki — wczytano stan
              bezpieczny.
            </p>
          </div>
        )}
        <p className="ops-muted">
          Treść punktów określa placówka zgodnie z własnymi procedurami. Nie wpisuj danych pacjentów.
        </p>
        <form
          className="ops-inline-form"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            const err = validateChecklistText(text);
            if (err) {
              setErrors([err]);
              setSuccess(null);
              return;
            }
            if (persist([...items, { id: generateLocalId('chk'), text: text.trim(), done: false }], 'Dodano punkt checklisty.')) {
              setText('');
            }
          }}
        >
          <label className="ops-field ops-grow">
            <span>Nowy punkt checklisty</span>
            <input value={text} maxLength={200} onChange={(e) => setText(e.target.value)} />
          </label>
          <button type="submit" className="ops-btn-primary">
            <Plus size={16} aria-hidden="true" /> Dodaj
          </button>
        </form>
        <Feedback errors={errors} success={success} />
        {items.length === 0 ? (
          <p className="ops-muted">Checklista jest pusta — dodaj pierwszy punkt.</p>
        ) : (
          <ul className="ops-check-list" data-testid="ops-local-checklist">
            {items.map((i) => (
              <li key={i.id} className="ops-check-item">
                <label className="ops-check-label">
                  <input
                    type="checkbox"
                    checked={i.done}
                    onChange={() =>
                      persist(
                        items.map((x) => (x.id === i.id ? { ...x, done: !x.done } : x)),
                        'Zaktualizowano checklistę.'
                      )
                    }
                  />
                  <span className={i.done ? 'is-done' : ''}>{i.text}</span>
                </label>
                <button
                  type="button"
                  className="ops-icon-btn"
                  aria-label={`Usuń punkt: ${i.text}`}
                  onClick={() => {
                    if (window.confirm(`Usunąć punkt checklisty: „${i.text}”?`)) {
                      persist(items.filter((x) => x.id !== i.id), 'Usunięto punkt checklisty.');
                    }
                  }}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
        {items.length > 0 && (
          <button
            type="button"
            className="ops-btn-secondary"
            onClick={() => {
              if (window.confirm('Czy na pewno wyzerować wszystkie zaznaczenia lokalnej checklisty?')) {
                persist(items.map((x) => ({ ...x, done: false })), 'Wyzerowano zaznaczenia checklisty.');
              }
            }}
          >
            <RotateCcw size={16} aria-hidden="true" /> Wyzeruj zaznaczenia (nowa zmiana)
          </button>
        )}
      </section>
    </>
  );
};

// ---------------------------------------------------------------------------
// Łańcuch chłodniczy
// ---------------------------------------------------------------------------

const COLD_STATUS_META: Record<ColdChainStatus, { label: string; tone: string }> = {
  within_configured_range: { label: 'W skonfigurowanym zakresie', tone: 'ok' },
  below_configured_range: { label: 'Poniżej zakresu', tone: 'danger' },
  above_configured_range: { label: 'Powyżej zakresu', tone: 'danger' },
  measurement_missing: { label: 'Brak pomiaru', tone: 'danger' },
  sensor_or_device_uncertain: { label: 'Czujnik/urządzenie niepewne', tone: 'danger' },
  awaiting_review: { label: 'Oczekuje na ocenę', tone: 'danger' },
  excursion_documented: { label: 'Odchylenie udokumentowane', tone: 'danger' }
};

const nowLocalDateTime = (): string => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${todayIsoDate(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const emptyDraft = (): ColdChainReadingDraft => ({
  deviceLabel: '',
  measuredAt: nowLocalDateTime(),
  currentC: '',
  minC: '',
  maxC: '',
  actionNote: '',
  recordedBy: '',
  profileId: 'standard_2_8',
  customMinC: '',
  customMaxC: '',
  sensorUncertain: false
});

const TemperatureTrendChart: React.FC<{ readings: ColdChainReading[] }> = ({ readings }) => {
  const [daysRange, setDaysRange] = useState<7 | 30>(7);
  const [now] = useState(() => Date.now());
  const rangeStart = useMemo(() => now - daysRange * 86400 * 1000, [now, daysRange]);

  const windowReadings = useMemo(() => {
    return readings
      .filter((r) => {
        const t = new Date(r.measuredAt).getTime();
        return !isNaN(t) && t >= rangeStart && r.currentC !== null;
      })
      .sort((a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime());
  }, [readings, rangeStart]);

  const width = 680;
  const height = 210;
  const padLeft = 50;
  const padRight = 30;
  const padTop = 25;
  const padBottom = 35;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const minTemp = -2;
  const maxTemp = 14;
  const spanTemp = maxTemp - minTemp;
  const getY = useCallback(
    (c: number) => padTop + plotH * ((maxTemp - Math.max(minTemp, Math.min(maxTemp, c))) / spanTemp),
    [padTop, plotH, maxTemp, minTemp, spanTemp]
  );
  const y8 = getY(8);
  const y2 = getY(2);
  const safeH = y2 - y8;

  const points = useMemo(() => {
    if (windowReadings.length === 0) return '';
    if (windowReadings.length === 1) {
      return `${padLeft + plotW / 2},${getY(windowReadings[0].currentC!)}`;
    }
    return windowReadings
      .map((r, i) => {
        const x = padLeft + (plotW * i) / (windowReadings.length - 1);
        const y = getY(r.currentC!);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [windowReadings, plotW, padLeft, getY]);

  return (
    <div className="ops-chart-card">
      <div className="ops-chart-head">
        <div>
          <h2 className="ops-chart-title">Wizualny trend temperatur w chłodziarce (+2°C do +8°C)</h2>
          <p className="ops-small">Zaznaczona bezpieczna strefa referencyjna z punktami odczytów termometru</p>
        </div>
        <div className="ops-range-btns" role="group" aria-label="Wybór zakresu dni wykresu">
          <button
            type="button"
            className={`ops-range-btn ${daysRange === 7 ? 'is-active' : ''}`}
            onClick={() => setDaysRange(7)}
          >
            Ostatnie 7 dni
          </button>
          <button
            type="button"
            className={`ops-range-btn ${daysRange === 30 ? 'is-active' : ''}`}
            onClick={() => setDaysRange(30)}
          >
            Ostatnie 30 dni
          </button>
        </div>
      </div>

      <div className="ops-chart-wrapper" tabIndex={0} role="region" aria-label={`Wykres trendu temperatur za ostatnie ${daysRange} dni`}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="ops-chart-svg"
          role="img"
          aria-label={`Wykres trendu temperatur: ${windowReadings.length} odczytów w okresie ${daysRange} dni. Bezpieczny przedział wynosi od +2 do +8 stopni Celsjusza.`}
        >
          <rect
            x={padLeft}
            y={y8}
            width={plotW}
            height={safeH}
            fill="rgba(16, 185, 129, 0.12)"
            rx="4"
          />

          <line x1={padLeft} y1={y8} x2={padLeft + plotW} y2={y8} stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 4" />
          <line x1={padLeft} y1={y2} x2={padLeft + plotW} y2={y2} stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 4" />

          <line x1={padLeft} y1={getY(10)} x2={padLeft + plotW} y2={getY(10)} stroke="var(--border-light, #e2e8f0)" strokeWidth="1" />
          <line x1={padLeft} y1={getY(0)} x2={padLeft + plotW} y2={getY(0)} stroke="var(--border-light, #e2e8f0)" strokeWidth="1" />

          <text x={padLeft - 8} y={y8 + 4} textAnchor="end" className="ops-chart-axis-text" fill="#059669" fontWeight="700">+8°C</text>
          <text x={padLeft - 8} y={y2 + 4} textAnchor="end" className="ops-chart-axis-text" fill="#059669" fontWeight="700">+2°C</text>
          <text x={padLeft - 8} y={getY(0) + 4} textAnchor="end" className="ops-chart-axis-text" fill="var(--text-muted, #64748b)">0°C</text>
          <text x={padLeft - 8} y={getY(10) + 4} textAnchor="end" className="ops-chart-axis-text" fill="var(--text-muted, #64748b)">+10°C</text>

          <text
            x={padLeft + plotW / 2}
            y={y8 + safeH / 2 + 4}
            textAnchor="middle"
            fill="rgba(16, 185, 129, 0.55)"
            fontSize="10"
            fontWeight="700"
            letterSpacing="0.8"
          >
            BEZPIECZNA STREFA +2°C DO +8°C
          </text>

          {windowReadings.length > 1 && (
            <polyline
              points={points}
              fill="none"
              stroke="var(--st-cobalt-solid, #2563eb)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {windowReadings.map((r, i) => {
            const cx = windowReadings.length === 1 ? padLeft + plotW / 2 : padLeft + (plotW * i) / (windowReadings.length - 1);
            const cy = getY(r.currentC!);
            const inRange = r.currentC! >= 2 && r.currentC! <= 8;
            return (
              <g key={r.id}>
                <circle
                  cx={cx}
                  cy={cy}
                  r="5"
                  fill={inRange ? '#10b981' : '#e11d48'}
                  stroke="#ffffff"
                  strokeWidth="2"
                >
                  <title>{`${r.measuredAt.replace('T', ' ')}: ${r.currentC!.toFixed(1)}°C (${r.deviceLabel})`}</title>
                </circle>
                <text
                  x={cx}
                  y={cy - 9}
                  textAnchor="middle"
                  fontSize="9.5"
                  fontWeight="700"
                  fill={inRange ? 'var(--text-main, #1e293b)' : '#e11d48'}
                >
                  {r.currentC!.toFixed(1)}°
                </text>
                <text
                  x={cx}
                  y={height - padBottom + 16}
                  textAnchor="middle"
                  fontSize="8.5"
                  fill="var(--text-muted, #64748b)"
                >
                  {r.measuredAt.slice(5, 10)}
                </text>
              </g>
            );
          })}

          {windowReadings.length === 0 && (
            <text
              x={padLeft + plotW / 2}
              y={padTop + plotH / 2 + 18}
              textAnchor="middle"
              fill="var(--text-muted, #64748b)"
              fontSize="12"
            >
              Brak zarejestrowanych odczytów w okresie ostatnich {daysRange} dni
            </text>
          )}
        </svg>
      </div>
    </div>
  );
};

const EmergencyColdChainProcedure: React.FC<{ excursionsCount: number }> = ({ excursionsCount }) => {
  const [isOpen, setIsOpen] = useState(excursionsCount > 0);

  return (
    <div className={`ops-procedure-box ${excursionsCount > 0 ? 'is-alert' : ''}`}>
      <div className="ops-procedure-header">
        <div className="ops-procedure-title-group">
          <AlertTriangle size={18} className="ops-procedure-icon" aria-hidden="true" />
          <h2 className="ops-procedure-title">
            Procedura awaryjna: Przerwanie łańcucha chłodniczego (odchylenie poza +2°C do +8°C)
          </h2>
        </div>
        <button
          type="button"
          className="ops-btn-secondary ops-procedure-toggle"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
        >
          {isOpen ? 'Zwiń procedurę' : 'Rozwiń wytyczne GIS/GIF'}
        </button>
      </div>

      {isOpen && (
        <div className="ops-procedure-body">
          <p className="ops-muted">
            W przypadku stwierdzenia temperatury poniżej +2°C lub powyżej +8°C w chłodziarce ze szczepionkami, postępuj zgodnie z poniższym protokołem bezpieczeństwa GIS/GIF:
          </p>
          <ol className="ops-procedure-list">
            <li>
              <strong>1. Natychmiastowe wstrzymanie użycia:</strong> Nie podawaj pacjentom preparatów narażonych na odchylenie. Nie wyrzucaj szczepionek. Drzwi chłodziarki zamknij i oznacz: <em>„SZCZEPIONKI WSTRZYMANE — NIE WYDAWAĆ”</em>.
            </li>
            <li>
              <strong>2. Kwarantanna w sprawnym urządzeniu:</strong> Przełóż produkty do sprawnej chłodziarki rezerwowej lub torby/kontenera izotermicznego z certyfikowanymi wkładami chłodzącymi (utrzymując zakres +2°C do +8°C).
            </li>
            <li>
              <strong>3. Sporządzenie protokołu odchylenia:</strong> Zarejestruj dokładny czas zdarzenia, odczyt bieżący, odczyt minimalny i maksymalny z rejestratora oraz szacowany czas trwania ekspozycji.
            </li>
            <li>
              <strong>4. Weryfikacja ChPL i zgłoszenie:</strong> Sprawdź punkt 6.4 ChPL poszczególnych preparatów (dopuszczalne krótkotrwałe wahania) oraz niezwłocznie zgłoś odchylenie do Powiatowej Stacji Sanitarno-Epidemiologicznej (PSSE) i podmiotu odpowiedzialnego (wytwórcy).
            </li>
            <li>
              <strong>5. Decyzja o losie partii:</strong> O ewentualnym dopuszczeniu preparatów do dalszego stosowania lub ich formalnej utylizacji decyduje wyłącznie upoważniony personel na piśmie po uzyskaniu opinii PSSE lub wytwórcy.
            </li>
          </ol>
        </div>
      )}
    </div>
  );
};

const ColdChainSanepidPrintSheet: React.FC<{ readings: ColdChainReading[] }> = ({ readings }) => {
  const [currentDate] = useState(() => new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysData = useMemo(() => {
    const list = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayReadings = readings.filter((r) => r.measuredAt.startsWith(dayStr));
      const morning = dayReadings.find((r) => {
        const h = parseInt(r.measuredAt.slice(11, 13), 10);
        return h < 13;
      });
      const afternoon = dayReadings.find((r) => {
        const h = parseInt(r.measuredAt.slice(11, 13), 10);
        return h >= 13;
      });
      list.push({
        day: d,
        morning: morning ? `${morning.currentC?.toFixed(1)}°C (${morning.measuredAt.slice(11, 16)})` : '..........',
        morningSign: morning?.recordedBy || '..........',
        afternoon: afternoon ? `${afternoon.currentC?.toFixed(1)}°C (${afternoon.measuredAt.slice(11, 16)})` : '..........',
        afternoonSign: afternoon?.recordedBy || '..........',
        notes: dayReadings.map((r) => r.actionNote).filter(Boolean).join('; ') || '—'
      });
    }
    return list;
  }, [daysInMonth, month, year, readings]);

  return (
    <div className="ops-cold-print-sheet" aria-hidden="true">
      <div className="ops-print-title">Miesięczna Karta Kontroli Temperatury w Chłodziarce do Szczepionek</div>
      <div className="ops-print-subtitle">Zgodnie z wytycznymi Głównego Inspektora Sanitarnego i Głównego Inspektora Farmaceutycznego dla punktów szczepień</div>
      <div className="ops-print-meta-grid">
        <div><strong>Miesiąc / Rok:</strong> {monthName}</div>
        <div><strong>Wymagany zakres temperatur:</strong> +2,0°C do +8,0°C</div>
        <div><strong>Placówka lecznicza / Gabinet:</strong> ...........................................................................</div>
        <div><strong>Identyfikator chłodziarki / termometru:</strong> ...........................................................................</div>
      </div>

      <table className="ops-print-sanepid-table">
        <thead>
          <tr>
            <th rowSpan={2}>Dzień</th>
            <th colSpan={2}>Pomiar poranny (godz. 7:00–9:00)</th>
            <th colSpan={2}>Pomiar popołudniowy (godz. 14:00–16:00)</th>
            <th rowSpan={2}>Uwagi / Podjęte działania</th>
          </tr>
          <tr>
            <th>Temp. [°C] / Godz.</th>
            <th>Podpis</th>
            <th>Temp. [°C] / Godz.</th>
            <th>Podpis</th>
          </tr>
        </thead>
        <tbody>
          {daysData.map((d) => (
            <tr key={d.day}>
              <td style={{ textAlign: 'center', fontWeight: '700' }}>{d.day}</td>
              <td style={{ textAlign: 'center' }}>{d.morning}</td>
              <td style={{ textAlign: 'center' }}>{d.morningSign}</td>
              <td style={{ textAlign: 'center' }}>{d.afternoon}</td>
              <td style={{ textAlign: 'center' }}>{d.afternoonSign}</td>
              <td>{d.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="ops-print-footer">
        <div className="ops-print-statement">
          Karta stanowi oficjalną dokumentację sanitarną punktu szczepień podlegającą kontroli Państwowej Inspekcji Sanitarnej (Sanepid).
        </div>
        <div className="ops-print-signature-row">
          <div className="ops-print-sig-box">
            <div className="ops-print-sig-line">Podpis i pieczęć pielęgniarki koordynującej</div>
          </div>
          <div className="ops-print-sig-box">
            <div className="ops-print-sig-line">Podpis kierownika podmiotu leczniczego</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ColdChainView: React.FC = () => {
  const storage = getBrowserStorage();
  const [storageWarning] = useState(() =>
    inspectOperationalStorageHealth(storage, COLD_CHAIN_STORAGE_KEY)
  );
  const [readings, setReadings] = useState<ColdChainReading[]>(() => loadColdChainReadings(storage));
  const [draft, setDraft] = useState<ColdChainReadingDraft>(emptyDraft);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState<string | null>(null);
  const summary = summarizeColdChain(readings);

  const update = (key: keyof ColdChainReadingDraft) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDraft((d) => ({ ...d, [key]: e.target.value }));

  const persist = (next: ColdChainReading[], msg: string): boolean => {
    const res = saveColdChainReadings(storage, next);
    if (!res.success) {
      setErrors([res.error ?? 'Błąd zapisu.']);
      setSuccess(null);
      return false;
    }
    setReadings(next);
    setErrors([]);
    setSuccess(msg);
    return true;
  };

  const exportCsv = () => {
    if (readings.length === 0) return;
    const blob = new Blob([buildColdChainCsv(readings)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vaxnurse-rejestr-temperatur-${todayIsoDate()}.csv`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <>
      <SafetyNote>
        Zakres <strong>+{COLD_CHAIN_REFERENCE_MIN_C}°C do +{COLD_CHAIN_REFERENCE_MAX_C}°C</strong> jest zakresem
        referencyjnym dla standardowego profilu. Aplikacja nie łączy się z rejestratorami — odczyty wprowadza się ręcznie z certyfikowanego
        termometru. Przy przekroczeniu postępuj zgodnie z procedurą placówki i wytycznymi GIS/GIF oraz ChPL preparatu.
      </SafetyNote>

      {storageWarning && (
        <div className="ops-note ops-note--danger" role="alert">
          <AlertTriangle size={18} aria-hidden="true" />
          <p>
            Wykryto uszkodzony lub nieczytelny zapis rejestru temperatur w pamięci przeglądarki — wczytano stan
            bezpieczny.
          </p>
        </div>
      )}

      <div className="ops-metrics" data-testid="ops-cold-metrics">
        <div className="ops-metric">
          <span className="ops-metric-val">{summary.total}</span>
          <span className="ops-metric-lbl">Odczyty w rejestrze</span>
        </div>
        <div className="ops-metric">
          <span className="ops-metric-val">{summary.devices}</span>
          <span className="ops-metric-lbl">Urządzenia</span>
        </div>
        <div className={`ops-metric${summary.excursions > 0 ? ' is-danger' : ''}`}>
          <span className="ops-metric-val">{summary.excursions}</span>
          <span className="ops-metric-lbl">Odczyty poza zakresem</span>
        </div>
        <div className="ops-metric">
          <span className="ops-metric-val ops-metric-val--sm">
            {summary.lastReadingAt ? summary.lastReadingAt.replace('T', ' ') : '—'}
          </span>
          <span className="ops-metric-lbl">Ostatni odczyt</span>
        </div>
      </div>

      <EmergencyColdChainProcedure excursionsCount={summary.excursions} />

      <TemperatureTrendChart readings={readings} />

      <section className="ops-panel" aria-labelledby="ops-cold-form">
        <h2 id="ops-cold-form" className="ops-panel-title">
          Nowy odczyt temperatury
        </h2>
        <form
          className="ops-form-grid"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            const res = validateColdChainDraft(draft);
            if (!res.ok) {
              setErrors(res.errors);
              setSuccess(null);
              return;
            }
            const status = evaluateColdChainStatus(res.reading);
            if (
              persist(
                sortColdChainReadings([res.reading, ...readings]),
                status === 'within_configured_range'
                  ? 'Zapisano odczyt w skonfigurowanym zakresie. Nie zastępuje formalnej dokumentacji punktu szczepień.'
                  : 'UWAGA: Odchylenie! Nie używać preparatu do czasu wyjaśnienia odchylenia i potwierdzenia dalszej możliwości jego wykorzystania przez osobę odpowiedzialną zgodnie z właściwą procedurą.'
              )
            ) {
              setDraft((d) => ({
                ...emptyDraft(),
                deviceLabel: d.deviceLabel,
                recordedBy: d.recordedBy,
                profileId: d.profileId
              }));
            }
          }}
        >
          <label className="ops-field">
            <span>Urządzenie (np. Chłodziarka nr 1)</span>
            <input value={draft.deviceLabel} maxLength={80} onChange={update('deviceLabel')} required />
          </label>
          <label className="ops-field">
            <span>Profil temperaturowy</span>
            <select
              value={draft.profileId}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  profileId: e.target.value as ColdChainProfileId
                }))
              }
            >
              {Object.entries(COLD_CHAIN_PROFILES).map(([key, prof]) => {
                const formatC = (n: number) => `${n > 0 ? `+${n}` : `${n}`}°C`;
                const suffix =
                  prof.minC !== null && prof.maxC !== null
                    ? `(${formatC(prof.minC)} do ${formatC(prof.maxC)})`
                    : key === 'unspecified'
                      ? '(brak granic)'
                      : '(własny zakres)';
                return (
                  <option key={key} value={key}>
                    {prof.label} {suffix}
                  </option>
                );
              })}
            </select>
          </label>
          {draft.profileId === 'custom_chpl' && (
            <>
              <label className="ops-field">
                <span>Własny min [°C]</span>
                <input
                  inputMode="decimal"
                  value={draft.customMinC}
                  onChange={(e) => setDraft((d) => ({ ...d, customMinC: e.target.value }))}
                  required
                />
              </label>
              <label className="ops-field">
                <span>Własny max [°C]</span>
                <input
                  inputMode="decimal"
                  value={draft.customMaxC}
                  onChange={(e) => setDraft((d) => ({ ...d, customMaxC: e.target.value }))}
                  required
                />
              </label>
            </>
          )}
          <label className="ops-field">
            <span>Data i godzina odczytu</span>
            <input type="datetime-local" value={draft.measuredAt} onChange={update('measuredAt')} required />
          </label>
          <label className="ops-field">
            <span>Temperatura bieżąca [°C]</span>
            <input inputMode="decimal" value={draft.currentC} onChange={update('currentC')} required />
          </label>
          <label className="ops-field">
            <span>Temperatura min [°C] (opcjonalnie)</span>
            <input inputMode="decimal" value={draft.minC} onChange={update('minC')} />
          </label>
          <label className="ops-field">
            <span>Temperatura max [°C] (opcjonalnie)</span>
            <input inputMode="decimal" value={draft.maxC} onChange={update('maxC')} />
          </label>
          <label className="ops-field">
            <span>Osoba odczytująca (inicjały, opcjonalnie)</span>
            <input value={draft.recordedBy} maxLength={40} onChange={update('recordedBy')} />
          </label>
          <label className="ops-field ops-span-2 ops-checkbox-field">
            <input
              type="checkbox"
              checked={draft.sensorUncertain}
              onChange={(e) => setDraft((d) => ({ ...d, sensorUncertain: e.target.checked }))}
            />
            <span>
              Czujnik pomiarowy wykazuje błąd / brak ważnej kalibracji (oznacz odczyt jako niepewny)
            </span>
          </label>
          <label className="ops-field ops-span-2">
            <span>Podjęte działania (wymagane przy odchyleniu lub niepewnym czujniku)</span>
            <input value={draft.actionNote} maxLength={500} onChange={update('actionNote')} />
          </label>
          <div className="ops-actions">
            <button type="submit" className="ops-btn-primary">
              <Plus size={16} aria-hidden="true" /> Zapisz odczyt
            </button>
          </div>
        </form>
        <Feedback errors={errors} success={success} />
      </section>

      <section className="ops-panel" aria-labelledby="ops-cold-log">
        <div className="ops-panel-head">
          <h2 id="ops-cold-log" className="ops-panel-title">
            Rejestr odczytów
          </h2>
          <div className="ops-actions">
            <button
              type="button"
              className="ops-btn-secondary"
              onClick={() => window.print()}
              title="Drukuj oficjalną miesięczną kartę kontroli temperatury dla Sanepidu (A4)"
            >
              <Printer size={16} aria-hidden="true" /> Karta Sanepid (Drukuj A4)
            </button>
            <button type="button" className="ops-btn-secondary" onClick={exportCsv} disabled={readings.length === 0}>
              <Download size={16} aria-hidden="true" /> Eksport CSV
            </button>
          </div>
        </div>
        {readings.length === 0 ? (
          <p className="ops-muted">Brak zapisanych odczytów.</p>
        ) : (
          <div className="ops-table-scroll" tabIndex={0} role="region" aria-label="Rejestr manualnych odczytów temperatury">
            <table className="ops-table" data-testid="ops-cold-table">
              <caption className="ops-sr-only">Rejestr manualnych odczytów temperatury</caption>
              <thead>
                <tr>
                  <th scope="col">Data i godzina</th>
                  <th scope="col">Urządzenie</th>
                  <th scope="col">Profil</th>
                  <th scope="col">Bieżąca</th>
                  <th scope="col">Min / Max</th>
                  <th scope="col">Status</th>
                  <th scope="col">Działania</th>
                  <th scope="col">
                    <span className="ops-sr-only">Akcje</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {readings.map((r) => {
                  const meta = COLD_STATUS_META[evaluateColdChainStatus(r)];
                  return (
                    <tr key={r.id}>
                      <td>{r.measuredAt.replace('T', ' ')}</td>
                      <td>{r.deviceLabel}</td>
                      <td>{r.profileId ? (COLD_CHAIN_PROFILES[r.profileId]?.label ?? r.profileId) : '—'}</td>
                      <td>{r.currentC !== null ? `${r.currentC.toFixed(1)}°C` : 'Brak pomiaru'}</td>
                      <td>
                        {r.minC !== null ? `${r.minC.toFixed(1)}°C` : '—'} /{' '}
                        {r.maxC !== null ? `${r.maxC.toFixed(1)}°C` : '—'}
                      </td>
                      <td>
                        <span className={`ops-badge ops-badge--${meta.tone}`}>{meta.label}</span>
                      </td>
                      <td>{r.actionNote || '—'}</td>
                      <td>
                        <button
                          type="button"
                          className="ops-icon-btn"
                          aria-label={`Usuń odczyt z ${r.measuredAt.replace('T', ' ')} (${r.deviceLabel})`}
                          onClick={() => {
                            if (window.confirm('Usunąć ten odczyt z lokalnego rejestru?')) {
                              persist(readings.filter((x) => x.id !== r.id), 'Usunięto odczyt.');
                            }
                          }}
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="ops-panel" aria-labelledby="ops-storage-matrix">
        <h2 id="ops-storage-matrix" className="ops-panel-title">
          Wymagania przechowywania wybranych preparatów wg ChPL (pkt 6.4)
        </h2>
        <p className="ops-muted">
          Zestawienie warunków przechowywania z oficjalnych Charakterystyk Produktu Leczniczego (ChPL) zarejestrowanych preparatów.
        </p>
        <div className="ops-table-scroll" tabIndex={0} role="region" aria-label="Wymagania przechowywania preparatów według ChPL">
          <table className="ops-table" data-testid="ops-storage-matrix-table">
            <caption className="ops-sr-only">Wymagania przechowywania preparatów według ChPL</caption>
            <thead>
              <tr>
                <th scope="col">Preparat</th>
                <th scope="col">Profil</th>
                <th scope="col">Warunki przechowywania (ChPL pkt 6.4)</th>
                <th scope="col">Źródło urzędowe</th>
                <th scope="col">Wersja / Data</th>
              </tr>
            </thead>
            <tbody>
              {PRODUCT_STORAGE_REFERENCE_MATRIX.map((item) => (
                <tr key={item.vaccineId}>
                  <th scope="row">{item.productName}</th>
                  <td>
                    <span className="ops-badge ops-badge--info">
                      {COLD_CHAIN_PROFILES[item.profileId]?.label ?? item.profileId}
                    </span>
                  </td>
                  <td>{item.storageConditionText}</td>
                  <td>
                    <span className="ops-small">
                      {item.sourceDocument} (pkt {item.qrdSection})
                    </span>
                  </td>
                  <td>{item.documentVersionOrDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <ColdChainSanepidPrintSheet readings={readings} />
    </>
  );
};

// ---------------------------------------------------------------------------
// Sytuacje szczególne — źródła oficjalne + inwentarz zestawu przeciwwstrząsowego
// ---------------------------------------------------------------------------

const KIT_STATUS_META: Record<KitItemStatus, { label: string; tone: string }> = {
  available: { label: 'Dostępna', tone: 'ok' },
  requires_review: { label: `Wymaga przeglądu (≤ ${KIT_EXPIRY_WARNING_DAYS} dni)`, tone: 'warn' },
  expired: { label: 'Przeterminowana', tone: 'danger' },
  missing: { label: 'Brak na stanie', tone: 'danger' },
  damaged: { label: 'Uszkodzona', tone: 'danger' },
  not_assessed: { label: 'Nieoceniona', tone: 'warn' }
};

const SpecialSituationsView: React.FC<{ onNavigateToModule: (id: ModuleId) => void }> = ({
  onNavigateToModule
}) => {
  const storage = getBrowserStorage();
  const [storageWarning] = useState(() =>
    inspectOperationalStorageHealth(storage, EMERGENCY_KIT_STORAGE_KEY)
  );
  const [items, setItems] = useState<EmergencyKitItem[]>(() => loadEmergencyKit(storage));
  const [draft, setDraft] = useState({ name: '', quantity: '1', expiryDate: '' });
  const [selectedCategory, setSelectedCategory] = useState<FacilityCareCategory>('ambulatory_facility');
  const [kitFilter, setKitFilter] = useState<'all' | 'attention' | 'expiring_soon' | 'valid'>('all');
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState<string | null>(null);
  const today = todayIsoDate();
  const [printGeneratedAt] = useState(() =>
    new Date().toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  );

  const itemStatuses = useMemo(() => {
    const map = new Map<string, KitItemStatus>();
    for (const item of items) {
      map.set(item.id, evaluateKitItemStatus(item, today));
    }
    return map;
  }, [items, today]);

  const countAll = items.length;
  const countAttention = useMemo(() => {
    return items.filter((i) => {
      const s = itemStatuses.get(i.id);
      return s === 'expired' || s === 'missing' || s === 'damaged' || s === 'not_assessed';
    }).length;
  }, [items, itemStatuses]);

  const countExpiringSoon = useMemo(() => {
    return items.filter((i) => itemStatuses.get(i.id) === 'requires_review').length;
  }, [items, itemStatuses]);

  const countValid = useMemo(() => {
    return items.filter((i) => itemStatuses.get(i.id) === 'available').length;
  }, [items, itemStatuses]);

  const problems = countAttention + countExpiringSoon;

  const filteredItems = useMemo(() => {
    return items.filter((i) => {
      const s = itemStatuses.get(i.id);
      if (kitFilter === 'attention') {
        return s === 'expired' || s === 'missing' || s === 'damaged' || s === 'not_assessed';
      }
      if (kitFilter === 'expiring_soon') {
        return s === 'requires_review';
      }
      if (kitFilter === 'valid') {
        return s === 'available';
      }
      return true;
    });
  }, [items, itemStatuses, kitFilter]);

  // Kluczowy akt prawny regulujący apteczkę przeciwwstrząsową ratującą życie
  const sources = KNOWLEDGE_SOURCES.filter(
    (s) => s.id === 'src-zestaw-przeciwwstrzasowy-429'
  );

  const persist = (next: EmergencyKitItem[], msg: string): boolean => {
    const res = saveEmergencyKit(storage, next);
    if (!res.success) {
      setErrors([res.error ?? 'Błąd zapisu.']);
      setSuccess(null);
      return false;
    }
    setItems(next);
    setErrors([]);
    setSuccess(msg);
    return true;
  };

  const categoryLabel =
    FACILITY_CARE_CATEGORIES.find((c) => c.id === selectedCategory)?.label ?? selectedCategory;

  const handleLoadRequiredPositions = () => {
    const requiredItems = EMERGENCY_KIT_REGULATION_ANNEX_26.filter(
      (reg) => reg.requirements[selectedCategory]
    );
    const existingNames = new Set(items.map((i) => i.name.trim().toLowerCase()));

    const toAdd: EmergencyKitItem[] = [];
    for (const req of requiredItems) {
      const fullLabel = `${req.substanceName} (${req.dosageForm})`;
      const normalizedKey = fullLabel.trim().toLowerCase();
      if (!existingNames.has(normalizedKey)) {
        existingNames.add(normalizedKey);
        toAdd.push({
          id: generateLocalId('kit'),
          name: fullLabel,
          quantity: 1,
          expiryDate: '',
          lastCheckedAt: null
        });
      }
    }

    if (toAdd.length === 0) {
      setSuccess('Wszystkie wymagane pozycje dla wybranej kategorii znajdują się już w inwentarzu.');
      setErrors([]);
      return;
    }

    persist(
      [...items, ...toAdd],
      `Wczytano ${toAdd.length} wymaganych pozycji (status „Nieoceniona” do czasu uzupełnienia rzeczywistych dat ważności i ilości) dla kategorii: ${categoryLabel}.`
    );
  };

  const handleBulkCheckValid = () => {
    const validOrExpiring = items.filter((i) => {
      const s = itemStatuses.get(i.id);
      return s === 'available' || s === 'requires_review';
    });

    if (validOrExpiring.length === 0) {
      setErrors(['Brak pozycji w normie do zbiorczego zatwierdzenia kontroli.']);
      setSuccess(null);
      return;
    }

    const nowIso = new Date().toISOString();
    const nextItems = items.map((i) => {
      const s = itemStatuses.get(i.id);
      if (s === 'available' || s === 'requires_review') {
        return { ...i, lastCheckedAt: nowIso };
      }
      return i;
    });

    persist(
      nextItems,
      `Zatwierdzono datę kontroli dzisiejszej dla ${validOrExpiring.length} pozycji w normie.`
    );
  };

  const handlePrintProtocol = () => {
    window.print();
  };

  return (
    <>
      <div className="ops-note ops-note--danger" role="note">
        <ShieldCheck size={18} aria-hidden="true" />
        <p>
          <strong>Aplikacja nie zawiera algorytmów leczenia ani dawek leków.</strong> W stanie nagłym postępuj zgodnie z
          obowiązującymi procedurami placówki, aktualnymi wytycznymi resuscytacji i ChPL. Moduł wspiera wyłącznie
          kontrolę gotowości zestawu przeciwwstrząsowego i dostęp do źródeł oficjalnych.
        </p>
      </div>

      <section className="ops-panel" aria-labelledby="ops-sit-sources">
        <h2 id="ops-sit-sources" className="ops-panel-title">
          Podstawa prawna i źródła urzędowe
        </h2>
        <ul className="ops-card-list">
          {sources.map((s) => (
            <li key={s.id} className="ops-card">
              <h3 className="ops-card-title">{s.title}</h3>
              <p className="ops-small">{s.publisher}</p>
              {isValidHttpUrl(s.officialUrl) ? (
                <a className="ops-link" href={s.officialUrl} target="_blank" rel="noopener noreferrer">
                  Otwórz źródło <ExternalLink size={14} aria-hidden="true" />
                </a>
              ) : (
                <span className="ops-small">Brak poprawnego odnośnika HTTP(S)</span>
              )}
            </li>
          ))}
        </ul>
        <button type="button" className="ops-btn-secondary" onClick={() => onNavigateToModule('knowledge-base')}>
          <BookOpen size={16} aria-hidden="true" /> Pełna Baza wiedzy (PSO, GIS, URPL)
        </button>
      </section>

      <section className="ops-panel" aria-labelledby="ops-sit-kit">
        <div className="ops-print-header" aria-hidden="true">
          <div className="ops-print-title">Protokół Okresowej Kontroli Apteczki Przeciwwstrząsowej</div>
          <div className="ops-print-subtitle">
            Wymogi Rozporządzenia Ministra Zdrowia z dnia 24 marca 2026 r. (Dz.U. 2026 poz. 429)
          </div>
          <div className="ops-print-meta-grid">
            <div><strong>Kategoria podmiotu:</strong> {categoryLabel}</div>
            <div><strong>Data wygenerowania:</strong> {printGeneratedAt}</div>
            <div><strong>Nazwa placówki / gabinetu:</strong> ...........................................................................</div>
            <div><strong>Osoba kontrolująca (Imię i nazwisko / PWZ):</strong> ...........................................................................</div>
          </div>
        </div>

        <h2 id="ops-sit-kit" className="ops-panel-title">
          Inwentarz zestawu przeciwwstrząsowego ({items.length} poz., {problems} wymaga uwagi)
        </h2>
        {storageWarning && (
          <div className="ops-note ops-note--danger" role="alert">
            <AlertTriangle size={18} aria-hidden="true" />
            <p>
              Wykryto uszkodzony lub nieczytelny zapis inwentarza zestawu w pamięci przeglądarki — wczytano stan
              bezpieczny.
            </p>
          </div>
        )}
        <p className="ops-muted">
          Skład zestawu określa placówka w oparciu o obowiązujące przepisy. Narzędzie kontroluje stan ilościowy i daty ważności.
        </p>

        <div className="ops-field" style={{ marginBottom: '16px' }}>
          <label htmlFor="ops-facility-category-select">
            <strong>Kategoria podmiotu leczniczego (wg Rozporządzenia MZ, Dz.U. 2026 poz. 429):</strong>
          </label>
          <select
            id="ops-facility-category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as FacilityCareCategory)}
          >
            {FACILITY_CARE_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div className="ops-actions" style={{ marginBottom: '16px' }}>
          <button type="button" className="ops-btn-secondary" onClick={handleLoadRequiredPositions}>
            <Plus size={16} aria-hidden="true" /> Wczytaj pozycje wymagane dla wybranej kategorii ({EMERGENCY_KIT_REGULATION_ANNEX_26.filter((r) => r.requirements[selectedCategory]).length} z 26)
          </button>
        </div>

        <form
          className="ops-form-grid"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            const res = validateKitDraft(draft);
            if (!res.ok) {
              setErrors(res.errors);
              setSuccess(null);
              return;
            }
            if (persist([...items, res.item], 'Dodano pozycję zestawu.')) {
              setDraft({ name: '', quantity: '1', expiryDate: '' });
            }
          }}
        >
          <label className="ops-field">
            <span>Nazwa pozycji</span>
            <input
              value={draft.name}
              maxLength={200}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              required
            />
          </label>
          <label className="ops-field">
            <span>Ilość</span>
            <input
              type="number"
              min={0}
              max={999}
              value={draft.quantity}
              onChange={(e) => setDraft((d) => ({ ...d, quantity: e.target.value }))}
              required
            />
          </label>
          <label className="ops-field">
            <span>Data ważności</span>
            <input
              type="date"
              value={draft.expiryDate}
              onChange={(e) => setDraft((d) => ({ ...d, expiryDate: e.target.value }))}
              required
            />
          </label>
          <div className="ops-actions">
            <button type="submit" className="ops-btn-primary">
              <Plus size={16} aria-hidden="true" /> Dodaj pozycję
            </button>
          </div>
        </form>
        <Feedback errors={errors} success={success} />

        {items.length === 0 ? (
          <div className="ops-empty-state-card">
            <p className="ops-muted">Inwentarz apteczki przeciwwstrząsowej jest pusty.</p>
            <p className="ops-small">
              Możesz dodać pierwszą pozycję ręcznie w formularzu powyżej lub zainicjalizować zestaw pozycji z Rozporządzenia MZ (Dz.U. 2026 poz. 429).
            </p>
            <div className="ops-actions" style={{ marginTop: '8px' }}>
              <button
                type="button"
                className="ops-btn-primary"
                onClick={handleLoadRequiredPositions}
              >
                <Plus size={16} aria-hidden="true" /> Zainicjalizuj pozycje wymagane dla kategorii ({EMERGENCY_KIT_REGULATION_ANNEX_26.filter((r) => r.requirements[selectedCategory]).length} z 26)
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="ops-filter-bar" role="group" aria-label="Filtry statusu inwentarza apteczki">
              <button
                type="button"
                className={`ops-filter-chip ${kitFilter === 'all' ? 'is-active' : ''}`}
                onClick={() => setKitFilter('all')}
              >
                Wszystkie ({countAll})
              </button>
              <button
                type="button"
                className={`ops-filter-chip ${kitFilter === 'attention' ? 'is-active' : ''}`}
                onClick={() => setKitFilter('attention')}
              >
                Wymagają uwagi ({countAttention})
              </button>
              <button
                type="button"
                className={`ops-filter-chip ${kitFilter === 'expiring_soon' ? 'is-active' : ''}`}
                onClick={() => setKitFilter('expiring_soon')}
              >
                Kończące się ≤ 30 dni ({countExpiringSoon})
              </button>
              <button
                type="button"
                className={`ops-filter-chip ${kitFilter === 'valid' ? 'is-active' : ''}`}
                onClick={() => setKitFilter('valid')}
              >
                W normie ({countValid})
              </button>
            </div>

            <div className="ops-toolbar-actions">
              <button
                type="button"
                className="ops-btn-secondary"
                onClick={handleBulkCheckValid}
                disabled={countValid + countExpiringSoon === 0}
                title="Zatwierdź bieżącą kontrolę dla wszystkich pozycji bez zastrzeżeń"
              >
                <CheckCircle2 size={16} aria-hidden="true" />
                Potwierdź kontrolę pozycji w normie dzisiaj ({countValid + countExpiringSoon})
              </button>
              <button
                type="button"
                className="ops-btn-secondary"
                onClick={handlePrintProtocol}
                title="Wydrukuj gotowy protokół kontroli apteczki w formacie A4"
              >
                <Printer size={16} aria-hidden="true" />
                Drukuj protokół kontroli zestawu
              </button>
            </div>

            {filteredItems.length === 0 ? (
              <p className="ops-muted">Brak pozycji spełniających kryteria wybranego filtra.</p>
            ) : (
              <div className="ops-table-scroll" tabIndex={0} role="region" aria-label="Inwentarz zestawu przeciwwstrząsowego">
                <table className="ops-table" data-testid="ops-kit-table">
                  <caption className="ops-sr-only">Inwentarz zestawu przeciwwstrząsowego</caption>
                  <thead>
                    <tr>
                      <th scope="col">Pozycja</th>
                      <th scope="col">Ilość</th>
                      <th scope="col">Ważność</th>
                      <th scope="col">Status</th>
                      <th scope="col">Ostatnia kontrola</th>
                      <th scope="col" className="ops-actions-col">
                        <span className="ops-sr-only">Akcje</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((i) => {
                      const meta = KIT_STATUS_META[itemStatuses.get(i.id) ?? evaluateKitItemStatus(i, today)];
                      return (
                        <tr key={i.id}>
                          <th scope="row">{i.name}</th>
                          <td>{i.quantity}</td>
                          <td>
                            {i.expiryDate ? fmtDate(i.expiryDate) : 'Brak daty — uzupełnij'}
                            <input
                              type="date"
                              className="ops-inline-date"
                              aria-label={`Weryfikowany termin przydatności: ${i.name}`}
                              value={i.expiryDate}
                              onChange={(e) => {
                                const nextVal = e.target.value;
                                if (nextVal !== '' && !parseIsoDate(nextVal)) {
                                  setErrors(['Podaj poprawny termin przydatności w formacie RRRR-MM-DD (lata 1900–2100).']);
                                  setSuccess(null);
                                  return;
                                }
                                persist(
                                  items.map((x) => (x.id === i.id ? { ...x, expiryDate: nextVal } : x)),
                                  `Zaktualizowano termin przydatności pozycji: ${i.name}.`
                                );
                              }}
                            />
                          </td>
                          <td>
                            <span className={`ops-badge ops-badge--${meta.tone}`}>{meta.label}</span>
                          </td>
                          <td>{i.lastCheckedAt ? new Date(i.lastCheckedAt).toLocaleString('pl-PL') : '—'}</td>
                          <td className="ops-row-actions">
                            <button
                              type="button"
                              className="ops-btn-secondary"
                              aria-label={`Potwierdź kontrolę: ${i.name}`}
                              onClick={() =>
                                persist(
                                  items.map((x) => (x.id === i.id ? { ...x, lastCheckedAt: new Date().toISOString() } : x)),
                                  `Potwierdzono kontrolę pozycji: ${i.name}.`
                                )
                              }
                            >
                              <CheckCircle2 size={16} aria-hidden="true" /> Skontrolowano
                            </button>
                            <button
                              type="button"
                              className="ops-icon-btn"
                              aria-label={`Usuń pozycję: ${i.name}`}
                              onClick={() => {
                                if (window.confirm(`Usunąć pozycję z inwentarza zestawu: „${i.name}”?`)) {
                                  persist(items.filter((x) => x.id !== i.id), 'Usunięto pozycję zestawu.');
                                }
                              }}
                            >
                              <Trash2 size={16} aria-hidden="true" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="ops-print-footer" aria-hidden="true">
              <div className="ops-print-statement">
                Niniejszym potwierdzam przeprowadzenie kontroli stanu wyposażenia, terminów ważności oraz nienaruszalności opakowań produktów leczniczych wchodzących w skład apteczki przeciwwstrząsowej ratującej życie zgodnie z wymogami Rozporządzenia Ministra Zdrowia (Dz.U. 2026 poz. 429).
              </div>
              <div className="ops-print-signature-row">
                <div className="ops-print-sig-box">
                  <div className="ops-print-sig-line">Data i podpis osoby kontrolującej</div>
                </div>
                <div className="ops-print-sig-box">
                  <div className="ops-print-sig-line">Pieczątka placówki / gabinetu</div>
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      <section className="ops-panel" aria-labelledby="ops-sit-annex26">
        <h2 id="ops-sit-annex26" className="ops-panel-title">
          Wykaz produktów leczniczych zestawu przeciwwstrząsowego (Rozporządzenie MZ, Dz.U. 2026 poz. 429)
        </h2>
        <p className="ops-muted">
          Załącznik do Rozporządzenia Ministra Zdrowia określa 26 pozycji produktów leczniczych wchodzących w skład
          zestawów przeciwwstrząsowych. Poniższa tabela wskazuje wymagania dla kategorii:{' '}
          <strong>{categoryLabel}</strong>.
        </p>
        <div className="ops-table-scroll" tabIndex={0} role="region" aria-label="Wykaz 26 pozycji zestawu przeciwwstrząsowego wg Dz.U. 2026 poz. 429">
          <table className="ops-table" data-testid="ops-emergency-annex-table">
            <caption className="ops-sr-only">Wykaz 26 pozycji zestawu przeciwwstrząsowego wg Dz.U. 2026 poz. 429</caption>
            <thead>
              <tr>
                <th scope="col">Lp.</th>
                <th scope="col">Nazwa produktu / substancji</th>
                <th scope="col">Postać i dawka</th>
                <th scope="col">Wymóg dla wybranej kategorii</th>
                <th scope="col">Uwagi regulacyjne</th>
              </tr>
            </thead>
            <tbody>
              {EMERGENCY_KIT_REGULATION_ANNEX_26.map((item) => {
                const isRequired = item.requirements[selectedCategory];
                return (
                  <tr key={item.itemNumber}>
                    <td>{item.itemNumber}</td>
                    <th scope="row">{item.substanceName}</th>
                    <td>{item.dosageForm}</td>
                    <td>
                      <span className={`ops-badge ops-badge--${isRequired ? 'ok' : 'neutral'}`}>
                        {isRequired ? 'Obowiązkowy' : 'Niewymagany'}
                      </span>
                    </td>
                    <td>{item.notes ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};

// ---------------------------------------------------------------------------

export const OperationalModuleView: React.FC<OperationalModuleViewProps> = ({
  module,
  onBackToDashboard,
  onNavigateToModule,
  onSelectVaccineProduct
}) => {
  let body: React.ReactNode;
  switch (module.id) {
    case 'vaccination-calendar':
      body = <CalendarView />;
      break;
    case 'adult-vaccinations':
      body = <AdultView onSelectVaccineProduct={onSelectVaccineProduct} />;
      break;
    case 'vaccination-calculator':
      body = <CalculatorView />;
      break;
    case 'procedures-checklists':
      body = <ProceduresView />;
      break;
    case 'cold-chain':
      body = <ColdChainView />;
      break;
    case 'special-situations':
      body = <SpecialSituationsView onNavigateToModule={onNavigateToModule} />;
      break;
    default:
      body = <p className="ops-muted">Moduł niedostępny.</p>;
  }
  return (
    <ModuleShell module={module} onBackToDashboard={onBackToDashboard}>
      {body}
    </ModuleShell>
  );
};

export default OperationalModuleView;
