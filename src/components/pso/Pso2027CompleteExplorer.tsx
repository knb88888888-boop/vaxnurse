import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  FileText,
  Scale,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import type {
  PsoPartNumber,
  PsoPartIIRecommendedRow,
  PsoPartVIIScheduleTable,
  PsoPartVITableFootnote,
  PsoPopulationScope,
  PsoRecordVerificationStatus,
  PsoSubsectionBullet,
  PsoVaccinationType,
  SeparateLegalOrPracticeRule,
} from '../../types/pso2027';
import '../../styles/pso2027.css';
import {
  PSO_2027_COMPLETENESS_REGISTRY,
  PSO_2027_SOURCE_META,
  PSO_PART_IA_SCOPE_NOTES,
  PSO_PART_IB_RISK_BLOCKS,
  PSO_PART_IC_ENTRIES,
  PSO_PART_ID_RABIES_MATRIX,
  PSO_PART_ID_RABIES_RULES,
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
  PSO_PART_III_INTRO,
  PSO_PART_III_SECTIONS,
  PSO_PART_III_TRAVEL_ENDEMIC,
  PSO_PART_III_TRAVEL_NOTE,
  PSO_PART_VII_TABLES,
  getPso2027CompletenessSummary,
  searchPso2027Records,
} from '../../data/pso2027CompleteData';
import { CHILD_VACCINES_CATALOG } from '../../data/childVaccinesData';
import { VACCINES_CATALOG } from '../../data/vaccinesCatalog';
import { auditChildVaccinesCatalogSummary } from '../../utils/childVaccineAudit';
import type { ChildVaccineItem } from '../../types/childVaccines';

const CHILD_PROCEDURE_MAP = new Map<string, ChildVaccineItem>(
  CHILD_VACCINES_CATALOG.map((item) => [item.id, item]),
);

const CATALOG_CHPL_SUMMARY = auditChildVaccinesCatalogSummary(CHILD_VACCINES_CATALOG, VACCINES_CATALOG);

const CHPL_SHORT_STATUS_LABELS: Record<ChildVaccineItem['chplVerificationStatus'], string> = {
  verified_chpl: 'ChPL: zweryfikowane',
  requires_source_clarification: 'ChPL: wymaga wyjaśnienia',
  pending_chpl_verification: 'ChPL: oczekuje na audyt',
  no_trade_product_linked: 'ChPL: brak powiązanego preparatu',
};

const STATUS_LABELS: Record<PsoRecordVerificationStatus, string> = {
  verified: 'Zweryfikowano w akt.pdf',
  partially_verified: 'Częściowo zweryfikowano',
  not_verified: 'Niezweryfikowano',
  conflicting: 'Rozbieżność redakcyjna PDF',
};

const POPULATION_SCOPE_LABELS: Record<PsoPopulationScope, string> = {
  children_and_adolescents: 'Dzieci i młodzież (0–19 lat)',
  adults: 'Dorośli',
  pregnant_women: 'Kobiety w ciąży',
  healthcare_workers: 'Personel medyczny',
  occupational_groups: 'Grupy zawodowe / pracownicze',
  travelers: 'Podróżujący (medycyna podróży)',
  post_exposure: 'Profilaktyka poekspozycyjna',
  risk_groups: 'Grupy ryzyka medycznego',
  staff_qualifications: 'Uprawnienia personelu medycznego',
  cross_age: 'Zasady ogólne (wszystkie grupy)',
};

const VACCINATION_TYPE_LABELS: Record<PsoVaccinationType, string> = {
  obowiazkowe: 'Szczepienia obowiązkowe',
  zalecane: 'Szczepienia zalecane',
  bierne: 'Uodpornienie bierne',
  organizacyjne: 'Zasady organizacyjne i prawne',
};

function formatPagesLabel(pages: number | readonly number[]): { label: string; firstPage: number } {
  const list: readonly number[] = Array.isArray(pages) ? pages : [pages as number];
  if (list.length === 0) return { label: 'str. 1', firstPage: 1 };
  if (list.length === 1) return { label: `str. ${list[0]}`, firstPage: list[0] };
  const isContiguous = list.every((val, idx) => idx === 0 || val === list[idx - 1] + 1);
  if (isContiguous) {
    return { label: `str. ${list[0]}–${list[list.length - 1]}`, firstPage: list[0] };
  }
  return { label: `str. ${list.join(', ')}`, firstPage: list[0] };
}

export const PsoVerificationBadge: React.FC<{ status: PsoRecordVerificationStatus }> = ({
  status,
}) => (
  <span className={`pso-status-badge pso-status-badge--${status}`}>
    {status === 'verified' && <CheckCircle2 size={13} aria-hidden="true" />}
    {status === 'conflicting' && <AlertTriangle size={13} aria-hidden="true" />}
    <span>{STATUS_LABELS[status]}</span>
  </span>
);

export const PsoSourceLinkBadge: React.FC<{
  subsection: string;
  pages: number | readonly number[];
  verificationStatus?: PsoRecordVerificationStatus;
}> = ({ subsection, pages, verificationStatus }) => {
  const { label, firstPage } = formatPagesLabel(pages);
  const href = `${PSO_2027_SOURCE_META.officialPdfUrl}#page=${firstPage}`;

  return (
    <div className="pso-source-meta-bar">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="pso-pdf-anchor-link"
        title={`Otwórz oficjalny PDF PSO 2027 (Dz. Urz. MZ 2026 poz. 77), ${subsection}, ${label}`}
      >
        <FileText size={13} aria-hidden="true" />
        <span>
          {subsection} • {label} (akt.pdf)
        </span>
        <ExternalLink size={12} aria-hidden="true" />
      </a>
      {verificationStatus && <PsoVerificationBadge status={verificationStatus} />}
    </div>
  );
};

const PsoBulletList: React.FC<{ items: PsoSubsectionBullet[] }> = ({ items }) => (
  <ul className="pso-structured-bullet-list">
    {items.map((item, idx) => (
      <li key={`${item.label}-${idx}`} className="pso-structured-bullet-item">
        <span className="pso-bullet-marker">{item.label}</span>
        <div className="pso-bullet-content">
          <span>{item.text}</span>
          {item.subItems && item.subItems.length > 0 && (
            <ul className="pso-structured-sublist">
              {item.subItems.map((sub, sIdx) => (
                <li key={`${sub.label}-${sIdx}`}>
                  <strong>{sub.label}</strong> {sub.text}
                </li>
              ))}
            </ul>
          )}
        </div>
      </li>
    ))}
  </ul>
);

const RelatedProcedureChips: React.FC<{
  recordIds: string[];
  onOpenCatalogRecord?: (recordId: string) => void;
}> = ({ recordIds, onOpenCatalogRecord }) => {
  if (!recordIds.length) return null;
  return (
    <div className="pso-related-records-row">
      <span className="pso-related-label">Powiązane rekordy katalogu:</span>
      {recordIds.map((id) => {
        const proc = CHILD_PROCEDURE_MAP.get(id);
        const chplTag = proc ? CHPL_SHORT_STATUS_LABELS[proc.chplVerificationStatus] : 'ChPL: oczekuje na audyt';
        const isWarn = proc?.chplVerificationStatus === 'requires_source_clarification';
        const chipTitle = proc
          ? `Rekord katalogu procedur ${id} (${proc.disease}) — PSO: zweryfikowany; Audyt ChPL: ${chplTag}`
          : `Rekord katalogu procedur ${id}`;
        const chipClass = `pso-related-chip${onOpenCatalogRecord ? ' pso-related-chip--interactive' : ''}${
          isWarn ? ' pso-related-chip--chpl-warn' : ''
        }`;

        return onOpenCatalogRecord ? (
          <button
            key={id}
            type="button"
            className={chipClass}
            title={chipTitle}
            onClick={() => onOpenCatalogRecord(id)}
          >
            <span>{id}</span>
            <span className={`pso-related-chpl-tag${isWarn ? ' pso-related-chpl-tag--warn' : ''}`}>
              {chplTag}
            </span>
          </button>
        ) : (
          <span key={id} className={chipClass} title={chipTitle}>
            <span>{id}</span>
            <span className={`pso-related-chpl-tag${isWarn ? ' pso-related-chpl-tag--warn' : ''}`}>
              {chplTag}
            </span>
          </span>
        );
      })}
      <span className="pso-related-chpl-note">(status PSO ≠ weryfikacja ChPL preparatu)</span>
    </div>
  );
};

// =============================================================================
// CZĘŚĆ I — SZCZEPIENIA OBOWIĄZKOWE (I.A, I.A.1, I.A.2, I.B, I.C, I.D, I.E)
// =============================================================================

export const PsoPartISectionsView: React.FC<{
  onOpenCatalogRecord?: (recordId: string) => void;
}> = ({ onOpenCatalogRecord }) => {
  const [subFilter, setSubFilter] = useState<'all' | 'IA' | 'IB' | 'IC' | 'ID' | 'IE'>('all');

  return (
    <div className="pso-complete-section-stack">
      <div className="section-intro-card">
        <div className="intro-title-row">
          <ShieldCheck size={22} className="intro-icon" aria-hidden="true" />
          <h3>Część I PSO 2027 — Szczepienia obowiązkowe (sekcje I.A – I.E)</h3>
        </div>
        <p className="intro-text">
          Pełne odwzorowanie Części I Komunikatu GIS z 28.10.2026 r. ({PSO_2027_SOURCE_META.journalCitation}, str. 2 i 4–18):
          populacja ogólna (I.A), warianty 5w1 i 6w1 (I.A.1–I.A.2), grupy szczególnego ryzyka (I.B),
          szczepienia obowiązkowe poekspozycyjne (I.C), wytyczne i matryca przeciw wściekliźnie (I.D)
          oraz tężcowi (I.E).
        </p>
        <div className="pso-subfilter-pills" role="group" aria-label="Filtruj podsekcje Części I PSO">
          {(
            [
              ['all', 'Wszystkie sekcje I.A–I.E'],
              ['IA', 'I.A / I.A.1 / I.A.2 (Populacja ogólna i 5w1/6w1)'],
              ['IB', 'I.B (Grupy podwyższonego ryzyka, str. 13–14)'],
              ['IC', 'I.C (Poekspozycyjne, str. 15)'],
              ['ID', 'I.D (Wścieklizna — zasady i matryca, str. 16–17)'],
              ['IE', 'I.E (Tężec — matryca poekspozycyjna, str. 18)'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`subtab-btn ${subFilter === key ? 'active' : ''}`}
              aria-pressed={subFilter === key}
              onClick={() => setSubFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {(subFilter === 'all' || subFilter === 'IA') && (
        <section className="pso-block-card" aria-labelledby="pso-ia-heading">
          <div className="pso-block-header">
            <h4 id="pso-ia-heading" className="pso-block-title">
              I.A, I.A.1, I.A.2 — Zakres populacji ogólnej i warianty 5w1 / 6w1
            </h4>
            <PsoSourceLinkBadge subsection="Część I.A – I.A.2" pages={[2, 4, 12]} verificationStatus="verified" />
          </div>
          <div className="legal-notice-banner">
            <strong>Zakres podmiotowy I.A:</strong>{' '}
            {PSO_PART_IA_SCOPE_NOTES.subsectionIA.officialScopeRule}
          </div>
          <div className="pso-two-col-grid">
            {[PSO_PART_IA_SCOPE_NOTES.subsectionIA1, PSO_PART_IA_SCOPE_NOTES.subsectionIA2].map((variant) => (
              <article key={variant.code} className="pso-subvariant-card">
                <div className="pso-subvariant-head">
                  <strong>
                    {variant.code} — {variant.title}
                  </strong>
                  <PsoSourceLinkBadge subsection={variant.code} pages={variant.sourcePages} verificationStatus="verified" />
                </div>
                <ul className="pso-highlights-list">
                  {variant.keyScheduleHighlights.map((line, idx) => (
                    <li key={idx}>{line}</li>
                  ))}
                </ul>
                <p className="pso-footnote-muted">{variant.footnoteText}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {(subFilter === 'all' || subFilter === 'IB') && (
        <section className="pso-block-card" aria-labelledby="pso-ib-heading">
          <div className="pso-block-header">
            <h4 id="pso-ib-heading" className="pso-block-title">
              I.B — Szczepienia obowiązkowe osób narażonych w sposób szczególny na zakażenie
            </h4>
            <PsoSourceLinkBadge subsection="Część I.B" pages={[13, 14]} verificationStatus="verified" />
          </div>
          <div className="pso-cards-vertical-list">
            {PSO_PART_IB_RISK_BLOCKS.map((block) => (
              <article key={block.id} className="pso-item-panel">
                <div className="pso-item-panel-header">
                  <h5>{block.diseaseOrGroupTitle}</h5>
                  <PsoSourceLinkBadge
                    subsection={block.sourceSubsection}
                    pages={block.sourcePages}
                    verificationStatus={block.verificationStatus}
                  />
                </div>
                <p className="pso-item-intro">{block.obligatedPersonsIntro}</p>
                <PsoBulletList items={block.obligatedGroups} />
                {block.officialNotes && (
                  <p className="pso-official-note">
                    <strong>Uwagi urzędowe PSO:</strong> {block.officialNotes}
                  </p>
                )}
                <RelatedProcedureChips
                  recordIds={block.relatedRecords}
                  onOpenCatalogRecord={onOpenCatalogRecord}
                />
              </article>
            ))}
          </div>
        </section>
      )}

      {(subFilter === 'all' || subFilter === 'IC') && (
        <section className="pso-block-card" aria-labelledby="pso-ic-heading">
          <div className="pso-block-header">
            <h4 id="pso-ic-heading" className="pso-block-title">
              I.C — Szczepienia obowiązkowe poekspozycyjne (styczność z chorym lub zakażonym materiałem)
            </h4>
            <PsoSourceLinkBadge subsection="Część I.C" pages={15} verificationStatus="verified" />
          </div>
          <div className="pso-matrix-scroll"
          tabIndex={0} role="region" aria-label="Tabela Części I.C szczepień poekspozycyjnych">
            <table className="pso-data-table">
              <caption className="sr-only">
                Część I.C PSO 2027 — obowiązkowe szczepienia poekspozycyjne (str. 15 akt.pdf)
              </caption>
              <thead>
                <tr>
                  <th scope="col">Szczepienie przeciw</th>
                  <th scope="col">Osoby podlegające obowiązkowi</th>
                  <th scope="col">Uwagi i odesłania PSO</th>
                </tr>
              </thead>
              <tbody>
                {PSO_PART_IC_ENTRIES.map((entry) => (
                  <tr key={entry.id}>
                    <th scope="row">{entry.disease}</th>
                    <td>{entry.obligatedPersons}</td>
                    <td>
                      <p>{entry.officialNotes}</p>
                      <RelatedProcedureChips
                        recordIds={entry.relatedRecords}
                        onOpenCatalogRecord={onOpenCatalogRecord}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {(subFilter === 'all' || subFilter === 'ID') && (
        <section className="pso-block-card" aria-labelledby="pso-id-heading">
          <div className="pso-block-header">
            <h4 id="pso-id-heading" className="pso-block-title">
              I.D — Wytyczne dotyczące swoistego zapobiegania wściekliźnie (str. 16–17)
            </h4>
            <PsoSourceLinkBadge subsection="Część I.D" pages={[16, 17]} verificationStatus="verified" />
          </div>
          <div className="pso-rules-summary-box">
            <p>{PSO_PART_ID_RABIES_RULES.introText}</p>
            <p>
              <strong>Kwalifikacja:</strong> {PSO_PART_ID_RABIES_RULES.qualificationRule}
            </p>
            <p>
              <strong>Zapobieganie czynne:</strong> {PSO_PART_ID_RABIES_RULES.activePreventionRule}
            </p>
            <p>
              <strong>Zapobieganie czynno-bierne:</strong> {PSO_PART_ID_RABIES_RULES.activePassiveRule}
            </p>
            <ul className="pso-highlights-list">
              {PSO_PART_ID_RABIES_RULES.observationRules.map((rule, idx) => (
                <li key={idx}>{rule}</li>
              ))}
            </ul>
          </div>
          <div
            className="pso-matrix-scroll"
          tabIndex={0}
            role="region"
            aria-label="Tabela Części I.D postępowania poekspozycyjnego przeciw wściekliźnie"
          >
            <table className="pso-data-table">
              <caption className="sr-only">
                Część I.D PSO 2027 — szczegółowe zasady poekspozycyjnego zapobiegania wściekliźnie (str. 17 akt.pdf)
              </caption>
              <thead>
                <tr>
                  <th scope="col">Rodzaj kontaktu ze zwierzęciem</th>
                  <th scope="col">Stan zwierzęcia w chwili narażenia</th>
                  <th scope="col">Zmiana podczas 15-dniowej obserwacji</th>
                  <th scope="col">Zapobieganie wściekliźnie</th>
                </tr>
              </thead>
              <tbody>
                {PSO_PART_ID_RABIES_MATRIX.map((row) => (
                  <tr key={row.id}>
                    {(!row.contactCategoryRowSpan || row.contactCategoryRowSpan > 0) && (
                      <th
                        scope="row"
                        rowSpan={row.contactCategoryRowSpan && row.contactCategoryRowSpan > 1 ? row.contactCategoryRowSpan : undefined}
                      >
                        {row.contactCategory}
                      </th>
                    )}
                    <td>{row.atExposureAnimalState}</td>
                    <td>{row.observation15Days}</td>
                    <td>{row.preventionAction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {(subFilter === 'all' || subFilter === 'IE') && (
        <section className="pso-block-card" aria-labelledby="pso-ie-heading">
          <div className="pso-block-header">
            <h4 id="pso-ie-heading" className="pso-block-title">
              I.E — Wytyczne dotyczące swoistego zapobiegania tężcowi u osób zranionych (str. 18)
            </h4>
            <PsoSourceLinkBadge subsection="Część I.E" pages={18} verificationStatus="verified" />
          </div>
          <div
            className="pso-matrix-scroll"
          tabIndex={0}
            role="region"
            aria-label="Tabela Części I.E postępowania przeciwtężcowego po zranieniu"
          >
            <table className="pso-data-table">
              <caption className="sr-only">
                Część I.E PSO 2027 — zapobieganie tężcowi u osób zranionych (str. 18 akt.pdf)
              </caption>
              <thead>
                <tr>
                  <th scope="col">Historia szczepień pacjenta</th>
                  <th scope="col">Niskie ryzyko zakażenia tężcem</th>
                  <th scope="col">Wysokie ryzyko zakażenia tężcem</th>
                </tr>
              </thead>
              <tbody>
                {PSO_PART_IE_TETANUS_MATRIX.map((row) => (
                  <tr key={row.id}>
                    <th scope="row">{row.vaccinationHistory}</th>
                    <td>{row.lowRiskAction}</td>
                    <td>{row.highRiskAction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="pso-footnote-literal">{PSO_PART_IE_FOOTNOTE}</p>
        </section>
      )}
    </div>
  );
};

// =============================================================================
// CZĘŚĆ II — SZCZEPIENIA ZALECANE ORAZ INNE FORMY IMMUNOPROFILAKTYKI (str. 19–35)
// =============================================================================

type PartIISubsectionFilter = 'all' | 'IIA' | 'IIB' | 'IIC' | 'IID' | 'IIE' | 'IIFG' | 'IIH' | 'III_TRAVEL';

const deriveRowsVerificationStatus = (
  rows: PsoPartIIRecommendedRow[],
  fallback: PsoRecordVerificationStatus = 'verified',
): PsoRecordVerificationStatus => {
  if (rows.length === 0) return fallback;
  if (rows.some((r) => r.verificationStatus === 'conflicting')) return 'conflicting';
  if (rows.some((r) => r.verificationStatus === 'partially_verified')) return 'partially_verified';
  if (rows.some((r) => r.verificationStatus === 'not_verified')) return 'not_verified';
  return 'verified';
};

const PartIIRowsCardList: React.FC<{
  heading: string;
  headingId: string;
  pages: number[];
  subsectionLabel: string;
  rows: PsoPartIIRecommendedRow[];
  verificationStatus?: PsoRecordVerificationStatus;
  introNote?: string;
  onOpenCatalogRecord?: (recordId: string) => void;
}> = ({ heading, headingId, pages, subsectionLabel, rows, verificationStatus, introNote, onOpenCatalogRecord }) => (
  <section className="pso-block-card" aria-labelledby={headingId}>
    <div className="pso-block-header">
      <h4 id={headingId} className="pso-block-title">
        {heading}
      </h4>
      <PsoSourceLinkBadge
        subsection={subsectionLabel}
        pages={pages}
        verificationStatus={verificationStatus ?? deriveRowsVerificationStatus(rows)}
      />
    </div>
    {introNote && <div className="legal-notice-banner">{introNote}</div>}
    {rows.length === 0 ? (
      <p className="pso-empty-hint">Brak pozycji pasujących do aktualnego zapytania.</p>
    ) : (
      <div className="pso-cards-vertical-list">
        {rows.map((row) => (
          <article key={row.id} className="pso-item-panel">
            <div className="pso-item-panel-header">
              <h5>{row.subjectLabel}</h5>
              <PsoSourceLinkBadge
                subsection={row.sourceSubsection}
                pages={row.sourcePages}
                verificationStatus={row.verificationStatus}
              />
            </div>
            <p className="pso-item-recommendations">{row.recommendations}</p>
            {row.recommendationBullets && row.recommendationBullets.length > 0 && (
              <PsoBulletList items={row.recommendationBullets} />
            )}
            {row.notes && (
              <p className="pso-official-note">
                <strong>Uwagi PSO:</strong> {row.notes}
              </p>
            )}
            {row.auditNote && (
              <p className="pso-audit-note">
                <strong>Nota audytowa:</strong> {row.auditNote}
              </p>
            )}
            <RelatedProcedureChips
              recordIds={row.relatedRecords}
              onOpenCatalogRecord={onOpenCatalogRecord}
            />
          </article>
        ))}
      </div>
    )}
  </section>
);

const matchesPartIIRowQuery = (row: PsoPartIIRecommendedRow, q: string): boolean => {
  if (!q) return true;
  const bulletText =
    row.recommendationBullets?.map((b) => `${b.label} ${b.text}`).join(' ') ?? '';
  return `${row.subjectLabel} ${row.recommendations} ${bulletText} ${row.notes} ${row.sourceSubsection}`
    .toLowerCase()
    .includes(q);
};

export const PsoPartIISectionsView: React.FC<{
  onOpenCatalogRecord?: (recordId: string) => void;
}> = ({ onOpenCatalogRecord }) => {
  const [subSection, setSubSection] = useState<PartIISubsectionFilter>('all');
  const [filterText, setFilterText] = useState('');

  const normalizedQuery = filterText.trim().toLowerCase();

  const filteredIIA = useMemo(
    () => PSO_PART_IIA_PEDIATRIC_RECOMMENDED.filter((r) => matchesPartIIRowQuery(r, normalizedQuery)),
    [normalizedQuery],
  );
  const filteredIIB = useMemo(
    () => PSO_PART_IIB_ADULTS_RECOMMENDED.filter((r) => matchesPartIIRowQuery(r, normalizedQuery)),
    [normalizedQuery],
  );
  const filteredIIC = useMemo(
    () => PSO_PART_IIC_PREGNANCY.filter((r) => matchesPartIIRowQuery(r, normalizedQuery)),
    [normalizedQuery],
  );
  const filteredIID = useMemo(
    () => PSO_PART_IID_HEALTHCARE_WORKERS.filter((r) => matchesPartIIRowQuery(r, normalizedQuery)),
    [normalizedQuery],
  );
  const filteredIIE = useMemo(
    () => PSO_PART_IIE_OTHER_WORKERS.filter((r) => matchesPartIIRowQuery(r, normalizedQuery)),
    [normalizedQuery],
  );
  const filteredIIF = useMemo(
    () => PSO_PART_IIF_POST_EXPOSURE.filter((r) => matchesPartIIRowQuery(r, normalizedQuery)),
    [normalizedQuery],
  );
  const filteredTravel = useMemo(
    () => PSO_PART_III_TRAVEL_ENDEMIC.filter((r) => matchesPartIIRowQuery(r, normalizedQuery)),
    [normalizedQuery],
  );

  return (
    <div className="pso-complete-section-stack">
      <div className="section-intro-card">
        <div className="intro-title-row">
          <BookOpen size={22} className="intro-icon" aria-hidden="true" />
          <h3>Część II PSO 2027 — Szczepienia zalecane oraz inne formy immunoprofilaktyki (str. 19–35)</h3>
        </div>
        <p className="intro-text">
          Kompletny podział Części II Komunikatu GIS ({PSO_2027_SOURCE_META.journalCitation}):
          II.A dzieci i młodzież (str. 19–21), II.B dorośli — 17 jednostek (str. 22–27), II.C kobiety w ciąży (str. 28–29),
          II.D zawody medyczne (str. 29–30), II.E pracownicy finansowani przez pracodawcę (str. 30–31),
          II.F i II.G profilaktyka poekspozycyjna oraz WZW typu B (str. 32–34), II.H uodpornienie bierne RSV (str. 34)
          oraz II.I podróżujący za granicę — 10 chorób endemicznych (str. 35).
        </p>
        <div className="pso-inline-search-row">
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" aria-hidden="true" />
            <input
              type="text"
              className="child-search-input"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Filtruj w Części II PSO (np. krztusiec, RSV, ciąża, pracodawca, HBsAg, żółta gorączka)..."
              aria-label="Filtruj pozycje Części II PSO 2027"
            />
            {filterText && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setFilterText('')}
                aria-label="Wyczyść filtr Części II"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>
        <div className="pso-subfilter-pills" role="group" aria-label="Filtruj sekcje Części II PSO">
          {(
            [
              ['all', 'Wszystkie (II.A – II.I)'],
              ['IIA', `II.A Dzieci (${filteredIIA.length})`],
              ['IIB', `II.B Dorośli (${filteredIIB.length})`],
              ['IIC', `II.C Ciąża (${filteredIIC.length})`],
              ['IID', `II.D Zawód medyczny (${filteredIID.length})`],
              ['IIE', `II.E Pracownicy (${filteredIIE.length})`],
              ['IIFG', 'II.F–G Poekspozycyjne i HBV'],
              ['IIH', 'II.H Uodpornienie bierne RSV'],
              ['III_TRAVEL', `II.I Podróże (${filteredTravel.length})`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`subtab-btn ${subSection === key ? 'active' : ''}`}
              aria-pressed={subSection === key}
              onClick={() => setSubSection(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {(subSection === 'all' || subSection === 'IIA') && (
        <PartIIRowsCardList
          heading="II.A — Szczepienia zalecane dzieciom i młodzieży (str. 19–21)"
          headingId="pso-iia-heading"
          subsectionLabel="Część II.A"
          pages={[19, 20, 21]}
          rows={filteredIIA}
          onOpenCatalogRecord={onOpenCatalogRecord}
        />
      )}

      {(subSection === 'all' || subSection === 'IIB') && (
        <PartIIRowsCardList
          heading="II.B — Szczepienia zalecane dorosłym (17 pozycji, str. 22–27)"
          headingId="pso-iib-heading"
          subsectionLabel="Część II.B"
          pages={[22, 23, 24, 25, 26, 27]}
          rows={filteredIIB}
          onOpenCatalogRecord={onOpenCatalogRecord}
        />
      )}

      {(subSection === 'all' || subSection === 'IIC') && (
        <PartIIRowsCardList
          heading="II.C — Szczepienia zalecane kobietom w ciąży (str. 28–29)"
          headingId="pso-iic-heading"
          subsectionLabel="Część II.C"
          pages={[28, 29]}
          rows={filteredIIC}
          onOpenCatalogRecord={onOpenCatalogRecord}
        />
      )}

      {(subSection === 'all' || subSection === 'IID') && (
        <PartIIRowsCardList
          heading="II.D — Szczepienia zalecane osobom wykonującym zawód medyczny (str. 29–30)"
          headingId="pso-iid-heading"
          subsectionLabel="Część II.D"
          pages={[29, 30]}
          rows={filteredIID}
          onOpenCatalogRecord={onOpenCatalogRecord}
        />
      )}

      {(subSection === 'all' || subSection === 'IIE') && (
        <PartIIRowsCardList
          heading="II.E — Szczepienia zalecane innym pracownikom niż wykonującym zawód medyczny (str. 30–31)"
          headingId="pso-iie-heading"
          subsectionLabel="Część II.E"
          pages={[30, 31]}
          rows={filteredIIE}
          introNote={PSO_PART_IIE_OCCUPATIONAL_INTRO.legalBasisText}
          onOpenCatalogRecord={onOpenCatalogRecord}
        />
      )}

      {(subSection === 'all' || subSection === 'IIFG') && (
        <>
          <PartIIRowsCardList
            heading="II.F — Szczepienia zalecane poekspozycyjne (str. 32–33)"
            headingId="pso-iif-heading"
            subsectionLabel="Część II.F"
            pages={[32, 33]}
            rows={filteredIIF}
            onOpenCatalogRecord={onOpenCatalogRecord}
          />
          <section className="pso-block-card" aria-labelledby="pso-iig-heading">
            <div className="pso-block-header">
              <h4 id="pso-iig-heading" className="pso-block-title">
                II.G — Swoiste zapobieganie WZW typu B u osób po ekspozycji na zakażenie HBV (str. 34)
              </h4>
              <PsoSourceLinkBadge subsection="Część II.G" pages={34} verificationStatus="verified" />
            </div>
            <div
              className="pso-matrix-scroll"
          tabIndex={0}
              role="region"
              aria-label="Tabela Części II.G profilaktyki poekspozycyjnej WZW typu B"
            >
              <table className="pso-data-table">
                <caption className="sr-only">
                  Część II.G PSO 2027 — swoista profilaktyka HBV zależnie od statusu osoby eksponowanej i źródła (str. 34)
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Status uodpornienia osoby eksponowanej</th>
                    <th scope="col">Źródło zakażenia HBsAg (+)</th>
                    <th scope="col">Źródło zakażenia HBsAg (–)</th>
                    <th scope="col">Źródło nieznane</th>
                  </tr>
                </thead>
                <tbody>
                  {PSO_PART_IIG_HBV_PEP_MATRIX.map((row) => (
                    <tr key={row.id}>
                      <th scope="row">{row.exposedPersonStatus}</th>
                      <td>{row.sourceHbsAgPositive}</td>
                      <td>{row.sourceHbsAgNegative}</td>
                      <td>{row.sourceUnknown}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {(subSection === 'all' || subSection === 'IIH') && (
        <PartIIRowsCardList
          heading="II.H — Inne formy immunoprofilaktyki: uodpornienie bierne przeciw RSV (str. 34)"
          headingId="pso-iih-heading"
          subsectionLabel="Część II.H"
          pages={[34]}
          rows={[PSO_PART_IIH_RSV_PASSIVE]}
          onOpenCatalogRecord={onOpenCatalogRecord}
        />
      )}

      {(subSection === 'all' || subSection === 'III_TRAVEL') && (
        <PartIIRowsCardList
          heading="II.I — Szczepienia zalecane osobom podróżującym za granicę (str. 35)"
          headingId="pso-iii-travel-heading"
          subsectionLabel="Część II.I"
          pages={[35]}
          rows={filteredTravel}
          introNote={PSO_PART_III_TRAVEL_NOTE}
          onOpenCatalogRecord={onOpenCatalogRecord}
        />
      )}
    </div>
  );
};

// =============================================================================
// CZĘŚĆ III — INFORMACJE UZUPEŁNIAJĄCE A–M (str. 36–42)
// =============================================================================

export const PsoPartIIISectionsView: React.FC<{
  onOpenCatalogRecord?: (recordId: string) => void;
}> = ({ onOpenCatalogRecord }) => {
  const [filterText, setFilterText] = useState('');

  const filteredSections = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    if (!q) return PSO_PART_III_SECTIONS;
    return PSO_PART_III_SECTIONS.filter((sec) => {
      const pts = sec.points
        .map((p) => `${p.label} ${p.text} ${p.subItems?.map((s) => `${s.label} ${s.text}`).join(' ') ?? ''}`)
        .join(' ');
      return `${sec.subsectionCode} ${sec.title} ${pts}`.toLowerCase().includes(q);
    });
  }, [filterText]);

  return (
    <div className="pso-complete-section-stack">
      <div className="section-intro-card">
        <div className="intro-title-row">
          <BookOpen size={22} className="intro-icon" aria-hidden="true" />
          <h3>Część III PSO 2027 — Informacje uzupełniające A–M (str. 36–42)</h3>
        </div>
        <p className="intro-text">{PSO_PART_III_INTRO}</p>
        <div className="pso-inline-search-row">
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" aria-hidden="true" />
            <input
              type="text"
              className="child-search-input"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Szukaj w sekcjach III.A – III.M (np. wcześniaki, BCG, WZW B, krztusiec, Hib, 6w1)..."
              aria-label="Szukaj w sekcjach uzupełniających Części III PSO"
            />
            {filterText && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setFilterText('')}
                aria-label="Wyczyść filtr Części III"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="pso-cards-vertical-list">
        {filteredSections.map((sec) => (
          <article key={sec.id} className="pso-item-panel">
            <div className="pso-item-panel-header">
              <h4>
                {sec.subsectionCode}. {sec.title}
              </h4>
              <PsoSourceLinkBadge
                subsection={`Część ${sec.subsectionCode}`}
                pages={sec.sourcePages}
                verificationStatus={sec.verificationStatus}
              />
            </div>
            {sec.introNote && <p className="pso-item-intro">{sec.introNote}</p>}
            <PsoBulletList items={sec.points} />
            <RelatedProcedureChips
              recordIds={sec.relatedRecords}
              onOpenCatalogRecord={onOpenCatalogRecord}
            />
          </article>
        ))}
      </div>
    </div>
  );
};

// =============================================================================
// CZĘŚĆ IV I VI — SEPARACJA NORM ODRĘBNYCH ORAZ PRZYPISY TABELI VI
// =============================================================================

export const PsoPartIVSeparateLawsSection: React.FC<{
  rules: SeparateLegalOrPracticeRule[];
}> = ({ rules }) => (
  <section className="pso-separate-law-panel" aria-labelledby="pso-separate-laws-heading">
    <div className="pso-separate-law-header">
      <Scale size={20} className="intro-icon" aria-hidden="true" />
      <h4 id="pso-separate-laws-heading">
        Przepisy z ustaw i rozporządzeń odrębnych oraz dobra praktyka gabinetowa (poza literalnym tekstem Części IV PSO)
      </h4>
    </div>
    <p className="pso-separate-law-intro">
      Poniższe reguły są wiążące w praktyce punktu szczepień na podstawie odrębnych aktów prawnych lub zaleceń
      techniki zabiegowej — zostały celowo oddzielone od 7 literalnych punktów Części IV PSO 2027 (str. 43 akt.pdf),
      aby uniknąć przypisywania im numeracji punktów Części IV.
    </p>
    <div className="pso-cards-vertical-list">
      {rules.map((rule) => (
        <article key={rule.id} className="pso-separate-rule-card">
          <div className="pso-separate-rule-top">
            <span className="pso-rule-category-tag">
              {rule.category === 'separate_legal_act'
                ? 'Odrębny akt prawny'
                : 'Dobra praktyka techniki szczepień'}
            </span>
            <h5>{rule.title}</h5>
          </div>
          <p>{rule.summary}</p>
          <p className="pso-official-note">
            <strong>Podstawa / źródło:</strong> {rule.exactLegalBasis}
          </p>
          <p className="pso-footnote-muted">
            <strong>Powód rozdziału od Części IV PSO:</strong> {rule.whySeparatedFromPsoPartIV}
          </p>
        </article>
      ))}
    </div>
  </section>
);

export const PsoPartVIFootnotesBlock: React.FC<{
  footnotes: PsoPartVITableFootnote[];
}> = ({ footnotes }) => (
  <section className="pso-footnotes-panel" aria-labelledby="pso-vi-footnotes-heading">
    <div className="pso-block-header">
      <h4 id="pso-vi-footnotes-heading">Dosłowne przypisy pod tabelą Części VI PSO 2027</h4>
      <PsoSourceLinkBadge subsection="Część VI" pages={45} verificationStatus="verified" />
    </div>
    <dl className="pso-footnotes-list">
      {footnotes.map((fn) => (
        <div key={fn.marker} className="pso-footnote-item">
          <dt>{fn.marker}</dt>
          <dd>{fn.text}</dd>
        </div>
      ))}
    </dl>
  </section>
);

// =============================================================================
// CZĘŚĆ VII — SKRÓCONE KALENDARZE SZCZEPIEŃ (VII.A str. 46, VII.B str. 47, VII.C str. 48)
// =============================================================================

const renderSinglePartVIITable = (
  table: PsoPartVIIScheduleTable,
  onOpenCatalogRecord?: (recordId: string) => void,
) => (
  <section key={table.id} className="pso-block-card" aria-labelledby={`${table.id}-heading`}>
    <div className="pso-block-header">
      <h4 id={`${table.id}-heading`} className="pso-block-title">
        {table.subsectionCode} — {table.title}
      </h4>
      <PsoSourceLinkBadge
        subsection={`Część ${table.subsectionCode}`}
        pages={table.sourcePage}
        verificationStatus={table.verificationStatus}
      />
    </div>

    {table.structuralAuditNote && (
      <div className="pso-audit-warning-banner" role="note">
        <AlertTriangle size={18} aria-hidden="true" />
        <div>
          <strong>Nota audytowa dotycząca tabeli {table.subsectionCode} (akt.pdf str. {table.sourcePage}):</strong>{' '}
          {table.structuralAuditNote}
        </div>
      </div>
    )}

    <div
      className="pso-matrix-scroll"
          tabIndex={0}
      role="region"
      aria-label={`Tabela ${table.subsectionCode} ${table.title}`}
    >
      <table className="pso-part-vii-table">
        <caption className="sr-only">
          {table.subsectionCode} — {table.title} (Dz. Urz. MZ 2026 poz. 77, str. {table.sourcePage})
        </caption>
        <thead>
          <tr>
            <th scope="col" className="pso-vii-vaccine-col">
              Szczepienie przeciw
            </th>
            {table.columns.map((col) => (
              <th key={col.id} scope="col" className="pso-vii-age-col">
                <span>{col.primaryLabel}</span>
                {col.secondaryLabel && <span className="pso-vii-col-sub">{col.secondaryLabel}</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row) => (
            <tr key={row.id}>
              <th scope="row" className="pso-vii-row-header">
                <div>{row.vaccineAgainst}</div>
                {row.rowNote && <div className="pso-footnote-muted">{row.rowNote}</div>}
                {row.relatedRecords.length > 0 && (
                  <RelatedProcedureChips
                    recordIds={row.relatedRecords}
                    onOpenCatalogRecord={onOpenCatalogRecord}
                  />
                )}
              </th>
              {row.cells.map((cell) => (
                <td
                  key={cell.id}
                  colSpan={cell.colSpan}
                  className={`pso-vii-cell pso-vii-cell--${cell.tone}`}
                >
                  {cell.text ? (
                    <span>{cell.text}</span>
                  ) : (
                    <>
                      <span aria-hidden="true" className="pso-vii-empty-dash">
                        –
                      </span>
                      <span className="sr-only">Brak dawki w przedziale: {cell.ariaAgeRange}</span>
                    </>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {table.footnotes.length > 0 && (
      <dl className="pso-footnotes-list">
        {table.footnotes.map((fn) => (
          <div key={fn.marker} className="pso-footnote-item">
            <dt>{fn.marker}</dt>
            <dd>{fn.text}</dd>
          </div>
        ))}
      </dl>
    )}
  </section>
);

export const PsoPartVIIMatrices: React.FC<{
  subsectionFilter?: ('VII.A' | 'VII.B' | 'VII.C')[];
  onOpenCatalogRecord?: (recordId: string) => void;
}> = ({ subsectionFilter, onOpenCatalogRecord }) => {
  const tables = useMemo(() => {
    if (!subsectionFilter || subsectionFilter.length === 0) return PSO_PART_VII_TABLES;
    return PSO_PART_VII_TABLES.filter((t) => subsectionFilter.includes(t.subsectionCode));
  }, [subsectionFilter]);

  return (
    <div className="pso-complete-section-stack">
      {!subsectionFilter && (
        <div className="section-intro-card">
          <div className="intro-title-row">
            <BookOpen size={22} className="intro-icon" aria-hidden="true" />
            <h3>Część VII PSO 2027 — Skrócone kalendarze szczepień (str. 46–48)</h3>
          </div>
          <p className="intro-text">
            Wszystkie trzy urzędowe matryce podsumowujące z końca Komunikatu GIS: VII.A obowiązkowe dzieci i młodzieży (str. 46),
            VII.B zalecane dzieci i młodzieży (str. 47) oraz VII.C zalecane dorosłych (str. 48). Komórki z układem
            wielokolumnowym zachowują dokładne rozpiętości wiekowe z pliku <code>akt.pdf</code>.
          </p>
        </div>
      )}
      {tables.map((tbl) => renderSinglePartVIITable(tbl, onOpenCatalogRecord))}
    </div>
  );
};

// =============================================================================
// REJESTR KOMPLETNOŚCI 7 CZĘŚCI + WYSZUKIWARKA CROSS-SECTION
// =============================================================================

export const Pso2027SearchAndCompletenessPanel: React.FC<{
  onOpenCatalogRecord?: (recordId: string) => void;
}> = ({ onOpenCatalogRecord }) => {
  const [query, setQuery] = useState('');
  const [partFilter, setPartFilter] = useState<'all' | PsoPartNumber>('all');
  const [scopeFilter, setScopeFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const summary = useMemo(() => getPso2027CompletenessSummary(), []);

  const filteredRecords = useMemo(
    () =>
      searchPso2027Records({
        query,
        part: partFilter,
        populationScope: scopeFilter,
        vaccinationType: typeFilter,
        verificationStatus: statusFilter,
      }),
    [query, partFilter, scopeFilter, typeFilter, statusFilter],
  );

  return (
    <div className="pso-complete-section-stack">
      <div className="section-intro-card">
        <div className="intro-title-row">
          <ShieldCheck size={22} className="intro-icon" aria-hidden="true" />
          <h3>Kompletność 7 części PSO 2027 oraz wyszukiwarka dokumentu źródłowego</h3>
        </div>
        <p className="intro-text">
          Źródło nadrzędne: {PSO_2027_SOURCE_META.sourceTitle} ({PSO_2027_SOURCE_META.journalCitation}, 48 stron,
          SHA-256 PDF: <code>{PSO_2027_SOURCE_META.pdfSha256.slice(0, 16)}…</code>).
        </p>

        <div className="pso-summary-metrics-grid">
          <div className="pso-metric-tile">
            <span className="pso-metric-value">{summary.partsCovered.length}/7</span>
            <span className="pso-metric-label">Części PSO (I–VII)</span>
          </div>
          <div className="pso-metric-tile">
            <span className="pso-metric-value">{summary.totalSubsections}</span>
            <span className="pso-metric-label">Podsekcji w rejestrze</span>
          </div>
          <div className="pso-metric-tile pso-metric-tile--ok">
            <span className="pso-metric-value">{summary.verified}</span>
            <span className="pso-metric-label">Zweryfikowanych w akt.pdf</span>
          </div>
          <div className="pso-metric-tile">
            <span className="pso-metric-value">{summary.partially_verified}</span>
            <span className="pso-metric-label">Częściowo zweryfikowanych</span>
          </div>
          <div className="pso-metric-tile pso-metric-tile--warn">
            <span className="pso-metric-value">{summary.conflicting}</span>
            <span className="pso-metric-label">Rozbieżności redakcyjnych PDF</span>
          </div>
        </div>

        <div className="legal-notice-banner" role="note" style={{ marginTop: '0.85rem' }}>
          <strong>Rozdzielenie weryfikacji PSO 2027 i ChPL preparatów:</strong>{' '}
          Kompletność treści komunikatu GIS ({summary.verified} podsekcji zweryfikowanych literalnie z{' '}
          <code>akt.pdf</code> + {summary.conflicting} jawnie oznaczona rozbieżność redakcyjna VII.C) nie oznacza
          weryfikacji Charakterystyk Produktów Leczniczych. W katalogu procedur dziecięcych (
          {CATALOG_CHPL_SUMMARY.totalProcedures} procedur):{' '}
          <strong>verified_full = {CATALOG_CHPL_SUMMARY.verifiedFull}</strong>,{' '}
          <strong>wymaga wyjaśnienia ChPL = {CATALOG_CHPL_SUMMARY.analyzedWithDiscrepancy}</strong>,{' '}
          <strong>oczekuje na audyt ChPL = {CATALOG_CHPL_SUMMARY.pendingContentAudit}</strong>.
        </div>
      </div>

      <section className="pso-block-card" aria-labelledby="pso-cross-search-heading">
        <div className="pso-block-header">
          <h4 id="pso-cross-search-heading" className="pso-block-title">
            Przeszukuj wszystkie 7 części PSO 2027 ({filteredRecords.length} wyników)
          </h4>
        </div>

        <div className="pso-search-filters-grid">
          <div className="search-input-wrapper pso-search-span-2">
            <Search size={16} className="search-icon" aria-hidden="true" />
            <input
              type="text"
              className="child-search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Szukaj we wszystkich 7 częściach (np. wścieklizna, tężec, krztusiec, RSV, ciąża, felczer, VII.C)..."
              aria-label="Szukaj we wszystkich częściach PSO 2027"
            />
            {query && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setQuery('')}
                aria-label="Wyczyść wyszukiwanie PSO 2027"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <label className="pso-select-label">
            <span>Część PSO</span>
            <select value={partFilter} onChange={(e) => setPartFilter(e.target.value as 'all' | PsoPartNumber)}>
              <option value="all">Wszystkie (I–VII)</option>
              <option value="I">Część I (Obowiązkowe)</option>
              <option value="II">Część II (Zalecane i bierne)</option>
              <option value="III">Część III (Uzupełniające A–M)</option>
              <option value="IV">Część IV (Zasady ogólne)</option>
              <option value="V">Część V (Wyrównawcze)</option>
              <option value="VI">Część VI (Kwalifikacje personelu)</option>
              <option value="VII">Część VII (Skrócone kalendarze)</option>
            </select>
          </label>

          <label className="pso-select-label">
            <span>Populacja / zakres</span>
            <select value={scopeFilter} onChange={(e) => setScopeFilter(e.target.value)}>
              <option value="all">Wszystkie grupy</option>
              {Object.entries(POPULATION_SCOPE_LABELS).map(([k, lbl]) => (
                <option key={k} value={k}>
                  {lbl}
                </option>
              ))}
            </select>
          </label>

          <label className="pso-select-label">
            <span>Typ wpisu</span>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">Wszystkie typy</option>
              {Object.entries(VACCINATION_TYPE_LABELS).map(([k, lbl]) => (
                <option key={k} value={k}>
                  {lbl}
                </option>
              ))}
            </select>
          </label>

          <label className="pso-select-label">
            <span>Status audytu PSO</span>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">Wszystkie statusy</option>
              {Object.entries(STATUS_LABELS).map(([k, lbl]) => (
                <option key={k} value={k}>
                  {lbl}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="pso-cards-vertical-list">
          {filteredRecords.slice(0, 60).map((rec) => (
            <article key={rec.id} className="pso-item-panel">
              <div className="pso-item-panel-header">
                <h5>
                  [{rec.sourceSubsection}] {rec.title}
                </h5>
                <PsoSourceLinkBadge
                  subsection={`Część ${rec.sourceSubsection}`}
                  pages={rec.sourcePage}
                  verificationStatus={rec.verificationStatus}
                />
              </div>
              <p className="pso-item-recommendations">{rec.description}</p>
              <p className="pso-footnote-muted">
                {VACCINATION_TYPE_LABELS[rec.vaccinationType]} •{' '}
                {POPULATION_SCOPE_LABELS[rec.populationScope]} • {rec.sourceReference}
              </p>
              {rec.auditNote && (
                <p className="pso-official-note">
                  <strong>Nota audytowa:</strong> {rec.auditNote}
                </p>
              )}
              <RelatedProcedureChips
                recordIds={rec.relatedRecords}
                onOpenCatalogRecord={onOpenCatalogRecord}
              />
            </article>
          ))}
          {filteredRecords.length > 60 && (
            <p className="pso-footnote-muted">
              Wyświetlono pierwsze 60 z {filteredRecords.length} dopasowań. Zawęź wyszukiwanie filtrami powyżej.
            </p>
          )}
        </div>
      </section>

      <section className="pso-block-card" aria-labelledby="pso-registry-table-heading">
        <div className="pso-block-header">
          <h4 id="pso-registry-table-heading" className="pso-block-title">
            Rejestr kompletności podsekcji PSO 2027 ({PSO_2027_COMPLETENESS_REGISTRY.length} pozycji)
          </h4>
        </div>
        <div
          className="pso-matrix-scroll"
          tabIndex={0}
          role="region"
          aria-label="Tabela rejestru kompletności 7 części PSO 2027"
        >
          <table className="pso-data-table pso-completeness-table">
            <caption className="sr-only">
              Rejestr kompletności podsekcji wszystkich 7 części Programu Szczepień Ochronnych na 2027 rok
            </caption>
            <thead>
              <tr>
                <th scope="col">Podsekcja</th>
                <th scope="col">Zakres i tytuł</th>
                <th scope="col">Strony akt.pdf</th>
                <th scope="col">Liczba rekordów</th>
                <th scope="col">Status audytu PSO</th>
                <th scope="col">Uwagi i zastrzeżenia</th>
              </tr>
            </thead>
            <tbody>
              {PSO_2027_COMPLETENESS_REGISTRY.map((entry) => (
                <tr key={entry.subsectionCode}>
                  <th scope="row">{entry.subsectionCode}</th>
                  <td>
                    <div>{entry.title}</div>
                    <div className="pso-footnote-muted">{POPULATION_SCOPE_LABELS[entry.populationScope]}</div>
                  </td>
                  <td>
                    <PsoSourceLinkBadge subsection={entry.subsectionCode} pages={entry.sourcePages} />
                  </td>
                  <td>{entry.recordCount}</td>
                  <td>
                    <PsoVerificationBadge status={entry.verificationStatus} />
                  </td>
                  <td>
                    <div>{entry.summaryNote}</div>
                    {entry.discrepancyOrCaveat && (
                      <div className="pso-official-note">{entry.discrepancyOrCaveat}</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
