import React, { useMemo, useState } from 'react';
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
  BookOpen
} from 'lucide-react';
import type { ModuleDefinition, ModuleId } from '../../types/navigation';
import type { ChildVaccineItem, AgeStageGroup } from '../../types/childVaccines';
import {
  CHILD_AGE_BRACKETS,
  CHILD_VACCINES_CATALOG,
  STAGE_GROUPS_CONFIG,
  PSO_GENERAL_PRINCIPLES_PART_IV,
  STAFF_QUALIFICATIONS_PSO_PART_VI
} from '../../data/childVaccinesData';
import {
  VACCINES_CATALOG,
  TARGET_GROUP_LABELS,
  VACCINE_TYPE_LABELS,
  VERIFICATION_STATUS_META
} from '../../data/vaccinesCatalog';
import { KNOWLEDGE_SOURCES } from '../../data/knowledgeSources';
import {
  COLD_CHAIN_REFERENCE_MAX_C,
  COLD_CHAIN_REFERENCE_MIN_C,
  KIT_EXPIRY_WARNING_DAYS,
  buildColdChainCsv,
  calculateAgeAt,
  calculateNextDoseDate,
  evaluateColdChainStatus,
  evaluateKitItemStatus,
  formatPolishDate,
  generateLocalId,
  getBrowserStorage,
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
  type ColdChainReading,
  type ColdChainReadingDraft,
  type ColdChainStatus,
  type EmergencyKitItem,
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

// ---------------------------------------------------------------------------
// Kalendarz szczepień (PSO 2027) — dane wyłącznie z rekordów PSO aplikacji
// ---------------------------------------------------------------------------

const CalendarView: React.FC = () => {
  const [stage, setStage] = useState<AgeStageGroup>('all');
  const [obligation, setObligation] = useState<'all' | 'obowiazkowe' | 'zalecane'>('all');

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

      {grouped.map(({ bracket, items }) => (
        <section key={bracket.id} className="ops-panel" aria-labelledby={`ops-cal-${bracket.id}`}>
          <h2 id={`ops-cal-${bracket.id}`} className="ops-panel-title">
            {bracket.label} <span className="ops-tag">{bracket.shortLabel}</span>
          </h2>
          <p className="ops-muted">{bracket.timingDescription}</p>
          <div className="ops-table-scroll">
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
      ))}
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
// Szczepienia dorosłych — rekordy PSO o zakresie adult/cross_age + katalog
// ---------------------------------------------------------------------------

const AdultView: React.FC<{ onSelectVaccineProduct?: (id: string) => void }> = ({
  onSelectVaccineProduct
}) => {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const psoItems = CHILD_VACCINES_CATALOG.filter(
    (v) =>
      (v.populationScope === 'adult' || v.populationScope === 'cross_age') &&
      (!q || `${v.disease} ${v.shortCode} ${v.targetGroupDescription}`.toLowerCase().includes(q))
  );
  const products = VACCINES_CATALOG.filter(
    (p) =>
      (p.targetGroup === 'dorosli' || p.targetGroup === 'uniwersalna') &&
      (!q || `${p.tradeName} ${p.activeSubstance}`.toLowerCase().includes(q))
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
                  {v.populationScope === 'cross_age' ? 'procedura wielowiekowa' : 'dorośli'}
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
  const [planned, setPlanned] = useState('');
  const [refProcId, setRefProcId] = useState('');
  const [birth, setBirth] = useState('');
  const [ageRef, setAgeRef] = useState(todayIsoDate());
  const [submitted, setSubmitted] = useState(false);

  const procsWithInterval = useMemo(
    () => CHILD_VACCINES_CATALOG.filter((v) => v.minIntervalFromPrevious),
    []
  );
  const refProc = procsWithInterval.find((v) => v.id === refProcId) ?? null;
  const result = submitted
    ? calculateNextDoseDate({ lastDoseDate: lastDose, minIntervalDays: interval, plannedDate: planned })
    : null;
  const age = birth ? calculateAgeAt(birth, ageRef) : null;

  return (
    <>
      <SafetyNote>
        Kalkulator wykonuje wyłącznie arytmetykę dat. Minimalny odstęp wprowadza operator na podstawie aktualnej ChPL
        preparatu lub PSO — narzędzie nie zawiera wbudowanych reguł klinicznych i nie zastępuje kwalifikacji.
      </SafetyNote>

      <section className="ops-panel" aria-labelledby="ops-calc-next">
        <h2 id="ops-calc-next" className="ops-panel-title">
          Najwcześniejszy termin kolejnej dawki
        </h2>
        <form
          className="ops-form-grid"
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
            <span>Minimalny odstęp [dni] (z ChPL / PSO)</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={3650}
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
          </div>
        </form>
        {refProc && (
          <p className="ops-muted" data-testid="ops-calc-pso-reference">
            Odstęp w PSO ({refProc.sourcePart}, s. {refProc.sourcePrintedPage}):{' '}
            <strong>{refProc.minIntervalFromPrevious}</strong>. Przelicz wartość na dni samodzielnie i potwierdź w ChPL.
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
                Planowana data jest o {result.plannedShortfallDays} dni za wczesna względem wprowadzonego odstępu.
              </p>
            )}
            {result.plannedStatus === 'allowed' && (
              <p className="ops-text-ok">Planowana data spełnia wprowadzony minimalny odstęp.</p>
            )}
          </div>
        )}
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
  const [items, setItems] = useState<LocalChecklistItem[]>(() => loadLocalChecklist(storage));
  const [text, setText] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState<string | null>(null);

  const persist = (next: LocalChecklistItem[], msg: string) => {
    const res = saveLocalChecklist(storage, next);
    if (!res.success) {
      setErrors([res.error ?? 'Błąd zapisu.']);
      return;
    }
    setItems(next);
    setErrors([]);
    setSuccess(msg);
  };

  const done = items.filter((i) => i.done).length;

  return (
    <>
      <section className="ops-panel" aria-labelledby="ops-proc-pso">
        <h2 id="ops-proc-pso" className="ops-panel-title">
          Ogólne zasady przeprowadzania szczepień (Część IV PSO 2027)
        </h2>
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
      </section>

      <section className="ops-panel" aria-labelledby="ops-proc-staff">
        <h2 id="ops-proc-staff" className="ops-panel-title">
          Uprawnienia personelu (Część VI PSO 2027)
        </h2>
        <div className="ops-table-scroll">
          <table className="ops-table">
            <caption className="ops-sr-only">Uprawnienia zawodów medycznych do kwalifikacji i podania szczepień</caption>
            <thead>
              <tr>
                <th scope="col">Zawód</th>
                <th scope="col">Kwalifikacja – obowiązkowe</th>
                <th scope="col">Podanie – obowiązkowe</th>
                <th scope="col">Podanie – zalecane</th>
                <th scope="col">Warunki formalne</th>
              </tr>
            </thead>
            <tbody>
              {STAFF_QUALIFICATIONS_PSO_PART_VI.map((s) => (
                <tr key={s.professionId}>
                  <th scope="row">{s.professionName}</th>
                  <td>{s.qualificationMandatory ? 'Tak' : 'Nie'}</td>
                  <td>{s.administrationMandatory ? 'Tak' : 'Nie'}</td>
                  <td>{s.administrationRecommended ? 'Tak' : 'Nie'}</td>
                  <td>{s.legalConditionsDescription}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="ops-panel" aria-labelledby="ops-proc-local">
        <h2 id="ops-proc-local" className="ops-panel-title">
          Lokalna checklista punktu szczepień ({done}/{items.length})
        </h2>
        <p className="ops-muted">
          Treść punktów określa placówka zgodnie z własnymi procedurami. Nie wpisuj danych pacjentów.
        </p>
        <form
          className="ops-inline-form"
          onSubmit={(e) => {
            e.preventDefault();
            const err = validateChecklistText(text);
            if (err) {
              setErrors([err]);
              setSuccess(null);
              return;
            }
            persist([...items, { id: generateLocalId('chk'), text: text.trim(), done: false }], 'Dodano punkt checklisty.');
            setText('');
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
                  onClick={() => persist(items.filter((x) => x.id !== i.id), 'Usunięto punkt checklisty.')}
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
            onClick={() => persist(items.map((x) => ({ ...x, done: false })), 'Wyzerowano zaznaczenia checklisty.')}
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
  in_range: { label: 'W zakresie', tone: 'ok' },
  excursion_low: { label: 'Poniżej zakresu', tone: 'danger' },
  excursion_high: { label: 'Powyżej zakresu', tone: 'danger' }
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
  recordedBy: ''
});

const ColdChainView: React.FC = () => {
  const storage = getBrowserStorage();
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
    const blob = new Blob([buildColdChainCsv(readings)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vaxnurse-rejestr-temperatur-${todayIsoDate()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <SafetyNote>
        Zakres <strong>+{COLD_CHAIN_REFERENCE_MIN_C}°C do +{COLD_CHAIN_REFERENCE_MAX_C}°C</strong> jest zakresem
        referencyjnym. Aplikacja nie łączy się z rejestratorami — odczyty wprowadza się ręcznie z certyfikowanego
        termometru. Przy przekroczeniu postępuj zgodnie z procedurą placówki i wytycznymi GIS/GIF oraz ChPL preparatu.
      </SafetyNote>

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

      <section className="ops-panel" aria-labelledby="ops-cold-form">
        <h2 id="ops-cold-form" className="ops-panel-title">
          Nowy odczyt temperatury
        </h2>
        <form
          className="ops-form-grid"
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
                status === 'in_range'
                  ? 'Zapisano odczyt w zakresie referencyjnym.'
                  : 'Zapisano odczyt POZA zakresem referencyjnym wraz z opisem działań.'
              )
            ) {
              setDraft((d) => ({ ...emptyDraft(), deviceLabel: d.deviceLabel, recordedBy: d.recordedBy }));
            }
          }}
        >
          <label className="ops-field">
            <span>Urządzenie (np. Chłodziarka nr 1)</span>
            <input value={draft.deviceLabel} maxLength={80} onChange={update('deviceLabel')} required />
          </label>
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
          <label className="ops-field ops-span-2">
            <span>Podjęte działania (wymagane przy przekroczeniu zakresu)</span>
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
          <button type="button" className="ops-btn-secondary" onClick={exportCsv} disabled={readings.length === 0}>
            <Download size={16} aria-hidden="true" /> Eksport CSV
          </button>
        </div>
        {readings.length === 0 ? (
          <p className="ops-muted">Brak zapisanych odczytów.</p>
        ) : (
          <div className="ops-table-scroll">
            <table className="ops-table" data-testid="ops-cold-table">
              <caption className="ops-sr-only">Rejestr manualnych odczytów temperatury</caption>
              <thead>
                <tr>
                  <th scope="col">Data i godzina</th>
                  <th scope="col">Urządzenie</th>
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
                      <td>{r.currentC.toFixed(1)}°C</td>
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
    </>
  );
};

// ---------------------------------------------------------------------------
// Sytuacje szczególne — źródła oficjalne + inwentarz zestawu przeciwwstrząsowego
// ---------------------------------------------------------------------------

const KIT_STATUS_META: Record<KitItemStatus, { label: string; tone: string }> = {
  ok: { label: 'Aktualna', tone: 'ok' },
  expiring: { label: `Kończy się ważność (≤ ${KIT_EXPIRY_WARNING_DAYS} dni)`, tone: 'warn' },
  expired: { label: 'Przeterminowana', tone: 'danger' },
  missing: { label: 'Brak na stanie', tone: 'danger' }
};

const SpecialSituationsView: React.FC<{ onNavigateToModule: (id: ModuleId) => void }> = ({
  onNavigateToModule
}) => {
  const storage = getBrowserStorage();
  const [items, setItems] = useState<EmergencyKitItem[]>(() => loadEmergencyKit(storage));
  const [draft, setDraft] = useState({ name: '', quantity: '1', expiryDate: '' });
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState<string | null>(null);
  const today = todayIsoDate();
  const problems = items.filter((i) => evaluateKitItemStatus(i, today) !== 'ok').length;
  const sources = KNOWLEDGE_SOURCES.filter((s) => s.category === 'gis-gif' || s.category === 'pso');

  const persist = (next: EmergencyKitItem[], msg: string) => {
    const res = saveEmergencyKit(storage, next);
    if (!res.success) {
      setErrors([res.error ?? 'Błąd zapisu.']);
      setSuccess(null);
      return;
    }
    setItems(next);
    setErrors([]);
    setSuccess(msg);
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
          Źródła oficjalne
        </h2>
        <ul className="ops-card-list">
          {sources.map((s) => (
            <li key={s.id} className="ops-card">
              <h3 className="ops-card-title">{s.title}</h3>
              <p className="ops-small">{s.publisher}</p>
              <a className="ops-link" href={s.officialUrl} target="_blank" rel="noopener noreferrer">
                Otwórz źródło <ExternalLink size={14} aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
        <button type="button" className="ops-btn-secondary" onClick={() => onNavigateToModule('knowledge-base')}>
          <BookOpen size={16} aria-hidden="true" /> Pełna Baza wiedzy
        </button>
      </section>

      <section className="ops-panel" aria-labelledby="ops-sit-kit">
        <h2 id="ops-sit-kit" className="ops-panel-title">
          Inwentarz zestawu przeciwwstrząsowego ({items.length} poz., {problems} wymaga uwagi)
        </h2>
        <p className="ops-muted">
          Skład zestawu określa placówka. Narzędzie kontroluje wyłącznie stan ilościowy i daty ważności.
        </p>
        <form
          className="ops-form-grid"
          onSubmit={(e) => {
            e.preventDefault();
            const res = validateKitDraft(draft);
            if (!res.ok) {
              setErrors(res.errors);
              setSuccess(null);
              return;
            }
            persist([...items, res.item], 'Dodano pozycję zestawu.');
            setDraft({ name: '', quantity: '1', expiryDate: '' });
          }}
        >
          <label className="ops-field">
            <span>Nazwa pozycji</span>
            <input
              value={draft.name}
              maxLength={120}
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
          <p className="ops-muted">Inwentarz jest pusty.</p>
        ) : (
          <div className="ops-table-scroll">
            <table className="ops-table" data-testid="ops-kit-table">
              <caption className="ops-sr-only">Inwentarz zestawu przeciwwstrząsowego</caption>
              <thead>
                <tr>
                  <th scope="col">Pozycja</th>
                  <th scope="col">Ilość</th>
                  <th scope="col">Ważność</th>
                  <th scope="col">Status</th>
                  <th scope="col">Ostatnia kontrola</th>
                  <th scope="col">
                    <span className="ops-sr-only">Akcje</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => {
                  const meta = KIT_STATUS_META[evaluateKitItemStatus(i, today)];
                  return (
                    <tr key={i.id}>
                      <th scope="row">{i.name}</th>
                      <td>{i.quantity}</td>
                      <td>{fmtDate(i.expiryDate)}</td>
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
                          onClick={() => persist(items.filter((x) => x.id !== i.id), 'Usunięto pozycję zestawu.')}
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
