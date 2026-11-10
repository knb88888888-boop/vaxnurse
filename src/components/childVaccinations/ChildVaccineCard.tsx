import React, { useState } from 'react';
import {
  ShieldCheck,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Syringe,
  AlertCircle,
  FileText,
  Clock,
  ArrowRight,
  Info,
  Layers,
  BookOpen
} from 'lucide-react';
import type { ChildVaccineItem } from '../../types/childVaccines';
import type { VaccineProduct } from '../../types/vaccines';
import { VERIFICATION_STATUS_META } from '../../data/vaccinesCatalog';

interface ChildVaccineCardProps {
  item: ChildVaccineItem;
  catalogVaccines: VaccineProduct[];
  onSelectVaccineProduct?: (vaccineId: string) => void;
  defaultExpanded?: boolean;
}

export const ChildVaccineCard: React.FC<ChildVaccineCardProps> = ({
  item,
  catalogVaccines,
  onSelectVaccineProduct,
  defaultExpanded = false
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const isObligatory = item.obligationType === 'obowiazkowe';
  const linkedProducts = catalogVaccines.filter(v => item.linkedVaccineIds.includes(v.id));

  return (
    <div
      className={`child-vaccine-card ${isObligatory ? 'obligation-mandatory' : 'obligation-recommended'} ${
        isExpanded ? 'is-card-expanded' : ''
      }`}
      id={`card-${item.id}`}
    >
      {/* Top Meta Bar */}
      <div className="card-top-bar">
        <div className="top-badges-left">
          <span
            className={`obligation-badge ${
              isObligatory ? 'badge-mandatory' : 'badge-recommended'
            }`}
          >
            {isObligatory ? (
              <>
                <ShieldCheck size={14} className="badge-icon" />
                <span>Szczepienie obowiązkowe</span>
              </>
            ) : (
              <>
                <Sparkles size={14} className="badge-icon" />
                <span>Szczepienie zalecane</span>
              </>
            )}
          </span>

          <span className="short-code-chip">{item.shortCode}</span>

          <span className="pso-part-chip" title={`Część dokumentu PSO 2027: ${item.psoPart}, ${item.psoPointOrSubpoint}`}>
            {item.psoPart} • {item.psoPointOrSubpoint}
          </span>

          <span className="pso-page-chip" title="Numer strony w oficjalnym PDF Dziennika Urzędowego MZ">
            str. {item.psoPdfPage}
          </span>
        </div>

        <div className="top-badges-right">
          <span className="verification-pso-chip" title={`Weryfikacja z oficjalnym komunikatem GIS z dnia ${item.psoPublicationDate}`}>
            <span className="dot-pulse"></span>
            <span>Zweryfikowano PSO</span>
          </span>
        </div>
      </div>

      {/* Main Header */}
      <div className="card-header-content">
        <h3 className="disease-title">{item.disease}</h3>
        <div className="dose-identity-row">
          <span className="dose-label-pill">{item.doseLabel}</span>
          <span className="dose-progress-tag">
            (dawka {item.doseNumberInSeries} z {item.totalDosesInStandardSeries})
          </span>
          <span className="target-age-label">
            <Clock size={14} className="timing-icon" />
            <span>{item.targetAgeDisplay}</span>
          </span>
        </div>
      </div>

      {/* Target Group Snippet */}
      <div className="target-group-snippet">
        <span className="target-group-label">Grupa docelowa:</span>
        <span className="target-group-text">{item.targetGroupDescription}</span>
      </div>

      {/* Quick Specs Grid (Always visible for fast clinical orientation) */}
      <div className="specs-quick-grid">
        <div className="spec-item">
          <span className="spec-label">Droga i miejsce podania</span>
          <span className="spec-value">
            <strong>{item.administrationRoute}</strong> – {item.injectionSite}
          </span>
        </div>

        <div className="spec-item">
          <span className="spec-label">Minimalny odstęp</span>
          <span className="spec-value">
            {item.minIntervalFromPrevious || 'Brak wymogu odrębnego odstępu'}
          </span>
        </div>

        <div className="spec-item full-width">
          <span className="spec-label">Finansowanie i źródło</span>
          <span className="spec-value funding-value">
            {item.fundingStatus}
            {item.officialFundingSourceRef && (
              <span className="funding-ref-badge">
                {item.officialFundingSourceRef}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Linked Preparations Snippet (Quick jump to SmPC) */}
      {linkedProducts.length > 0 && (
        <div className="linked-products-summary">
          <div className="linked-header">
            <Syringe size={14} className="linked-icon" />
            <span>Preparaty w Bazie VaxNurse (Karta ChPL):</span>
          </div>
          <div className="linked-pills-list">
            {linkedProducts.map(prod => {
              const meta = VERIFICATION_STATUS_META[prod.verificationStatus];
              const isBlocked = prod.sourceDiscrepancies?.some(
                d => d.status === 'requires_clarification'
              );

              return (
                <button
                  key={prod.id}
                  type="button"
                  className="linked-product-chip"
                  onClick={() => onSelectVaccineProduct?.(prod.id)}
                  title={`Kliknij, aby otworzyć oficjalną Kartę ChPL preparatu ${prod.tradeName}`}
                >
                  <span className="prod-name">{prod.tradeName}</span>
                  <span className="prod-substance">({prod.activeSubstance})</span>
                  {isBlocked ? (
                    <span className="prod-status-blocked" title="Nierozwiązana rozbieżność źródłowa ChPL">
                      Wyjaśnienie ChPL
                    </span>
                  ) : (
                    <span className={`prod-status-tag ${meta.badgeClass}`}>
                      {meta.label}
                    </span>
                  )}
                  <ArrowRight size={13} className="chip-arrow" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Expand/Collapse Toggle Button */}
      <button
        type="button"
        className="card-expand-toggle-btn"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <span>{isExpanded ? 'Zwiń szczegóły i wytyczne PSO' : 'Pokaż wytyczne wykonawcze, ChPL i źródła PSO'}</span>
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {/* Expanded Clinical Details */}
      {isExpanded && (
        <div className="card-expanded-body">
          {/* Clinical notes for nurse */}
          <div className="expanded-section">
            <div className="section-title-with-icon">
              <Info size={16} className="section-icon blue" />
              <h4>Wskazówki wykonawcze dla personelu punktu szczepień</h4>
            </div>
            <p className="clinical-notes-text">{item.clinicalNotes}</p>
          </div>

          {/* Warnings & Contraindications */}
          {item.contraindicationsOrWarnings && (
            <div className="expanded-section warning-section">
              <div className="section-title-with-icon">
                <AlertCircle size={16} className="section-icon amber" />
                <h4>Szczególne ostrzeżenia i uwagi dotyczące kwalifikacji</h4>
              </div>
              <p className="warnings-text">{item.contraindicationsOrWarnings}</p>
            </div>
          )}

          {/* Alternative Combined Options */}
          {item.alternativeCombinedOptions && (
            <div className="expanded-section combined-options-section">
              <div className="section-title-with-icon">
                <Syringe size={16} className="section-icon violet" />
                <h4>Opcje preparatów skojarzonych (5w1 / 6w1)</h4>
              </div>
              <p className="combined-text">{item.alternativeCombinedOptions}</p>
            </div>
          )}

          {/* ChPL Reference Point */}
          {item.chplReference && (
            <div className="expanded-section chpl-reference-section">
              <div className="section-title-with-icon">
                <BookOpen size={16} className="section-icon emerald" />
                <h4>Odnośnik do Charakterystyki Produktu Leczniczego (ChPL)</h4>
              </div>
              <p className="chpl-ref-text">{item.chplReference}</p>
            </div>
          )}

          {/* Official PSO Reference Footer */}
          <div className="expanded-source-footer">
            <div className="source-meta-grid">
              <div className="source-meta-item">
                <FileText size={15} className="source-icon" />
                <div className="source-meta-text">
                  <strong>Pozycja w dokumencie:</strong> {item.psoSection} (strona {item.psoPdfPage} PDF)
                </div>
              </div>

              <div className="source-meta-item">
                <Layers size={15} className="source-icon" />
                <div className="source-meta-text">
                  <strong>Część dokumentu:</strong> {item.psoPart}, {item.psoPointOrSubpoint}
                </div>
              </div>
            </div>

            <div className="source-legal-act">
              <strong>Akt prawny:</strong> {item.psoLegalAct} (data publikacji komunikatu: {item.psoPublicationDate})
            </div>

            <div className="source-links-row">
              <a
                href={item.psoOfficialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="pso-official-anchor-btn"
              >
                <span>Otwórz oficjalny PDF Dziennika Urzędowego MZ (akt.pdf, str. {item.psoPdfPage})</span>
                <ExternalLink size={14} />
              </a>

              <span className="source-audit-date">
                Status: {item.verificationStatus === 'verified_pso' ? 'Zweryfikowano z PSO' : 'Oczekuje na weryfikację'} ({item.lastVerifiedDate})
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
