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
import type { ChildVaccineItem, FundingScopeBreakdown } from '../../types/childVaccines';
import type { VaccineProduct } from '../../types/vaccines';
import { VERIFICATION_STATUS_META } from '../../data/vaccinesCatalog';
import {
  deriveCatalogCardCompletenessStatus,
  deriveProcedureProductAdequacyStatus,
  getAdultAndSpecialReferenceScopes,
  getPediatricSelectableFundingScopes,
  getUnconfirmedSeasonalScopes,
} from '../../utils/childVaccineAudit';

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
  const linkages = item.productLinkages ?? [];
  const conditionalLinkages = linkages.filter(l => l.relationType === 'conditional_alternative');
  const variantOrDirectLinkages = linkages.filter(l => l.relationType !== 'conditional_alternative');
  const pediatricScopes = getPediatricSelectableFundingScopes(item);
  const adultReferenceScopes = getAdultAndSpecialReferenceScopes(item);
  const unconfirmedSeasonalScopes = getUnconfirmedSeasonalScopes(item);
  const catalogCardCompleteness = deriveCatalogCardCompletenessStatus(item, catalogVaccines);
  const procedureProductAdequacy = deriveProcedureProductAdequacyStatus(item, catalogVaccines);
  const reviewedSectionsCount = item.chplAudit?.sectionReviews?.length ?? 0;

  const renderFundingScopeCard = (scope: FundingScopeBreakdown) => (
    <div key={scope.scopeId} className="funding-scope-item">
      <div className="funding-scope-header">
        <strong>{scope.label}</strong>
        <span
          className={`funding-scope-badge ${
            scope.fundingStatus === 'verified_public_free'
              ? 'scope-badge-free'
              : scope.fundingStatus === 'verified_reimbursement'
                ? 'scope-badge-reimbursed'
                : scope.fundingStatus === 'verified_self_funded'
                  ? 'scope-badge-self'
                  : scope.fundingStatus === 'regional_pool_closed'
                    ? 'scope-badge-closed'
                    : 'scope-badge-pending'
          }`}
        >
          {scope.fundingStatus === 'verified_public_free' && 'Bezpłatne publiczne'}
          {scope.fundingStatus === 'verified_reimbursement' && 'Refundacja apteczna'}
          {scope.fundingStatus === 'verified_self_funded' && 'Co do zasady odpłatne'}
          {scope.fundingStatus === 'regional_pool_closed' && 'Zamknięta pula regionalna'}
          {scope.fundingStatus === 'pending_clarification' && 'Wymaga doprecyzowania'}
        </span>
      </div>
      <div><strong>Grupa wiekowa:</strong> {scope.ageGroup}</div>
      {(scope.minAgeDescription || scope.maxAgeDescription || scope.boundaryInclusivity) && (
        <div className="scope-age-bounds">
          {scope.minAgeDescription && (
            <div><strong>Dolna granica wieku:</strong> {scope.minAgeDescription}</div>
          )}
          {scope.maxAgeDescription && (
            <div><strong>Górna granica wieku:</strong> {scope.maxAgeDescription}</div>
          )}
          {scope.boundaryInclusivity && (
            <div><strong>Granice i wyjątki wieku:</strong> {scope.boundaryInclusivity}</div>
          )}
        </div>
      )}
      <div><strong>Zakres preparatów:</strong> {scope.productScope}</div>
      <div><strong>Okres obowiązywania:</strong> {scope.validityPeriod}</div>
      <div>
        <strong>Źródło:</strong>{' '}
        {scope.sourceUrl ? (
          <a href={scope.sourceUrl} target="_blank" rel="noopener noreferrer">{scope.sourceRef}</a>
        ) : (
          scope.sourceRef
        )}
      </div>
      <div><strong>Warunki i wyjątki:</strong> {scope.conditionsAndExceptions}</div>
      <div className="funding-scope-mechanisms">
        <span><strong>Zakup publiczny:</strong> {scope.mechanismBreakdown.stateVaccinePurchase}</span>{' | '}
        <span><strong>Usługa:</strong> {scope.mechanismBreakdown.serviceExecutionFunding}</span>{' | '}
        <span><strong>Refundacja:</strong> {scope.mechanismBreakdown.pharmacyReimbursement}</span>{' | '}
        <span><strong>Odpłatność częściowa:</strong> {scope.mechanismBreakdown.partialReimbursementDetail}</span>{' | '}
        <span><strong>Program czasowy:</strong> {scope.mechanismBreakdown.temporaryProgram}</span>{' | '}
        <span><strong>Dystrybucja / region:</strong> {scope.mechanismBreakdown.regionalAvailabilityAndDistribution}</span>
      </div>
      <div className={scope.mechanismBreakdown.localPointAvailabilityConfirmed ? 'point-availability-confirmed' : 'point-availability-unconfirmed'}>
        <strong>Punktowa dostępność fiolki:</strong>{' '}
        {scope.mechanismBreakdown.localPointAvailabilityConfirmed ? 'Potwierdzona w punkcie' : 'Niepotwierdzona lokalnie w punkcie'}
      </div>
    </div>
  );

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

          {/* Oznaczenie procedury wielowiekowej (Punkt 3 audytu) */}
          {item.populationScope === 'cross_age' && (
            <span
              className="cross-age-badge"
              title="Procedura wielowiekowa – wytyczne urzędowe w PSO obejmują dzieci, młodzież lub dorosłych"
            >
              Procedura wielowiekowa
            </span>
          )}

          <span className="short-code-chip">{item.shortCode}</span>

          <span
            className="pso-part-chip"
            title={`Część dokumentu PSO 2027: ${item.sourcePart || item.psoPart}, ${
              item.sourceOfficialPoint
                ? `pkt ${item.sourceOfficialPoint}`
                : item.sourceCriteriaNumbers
                  ? `${item.sourceTableRow || item.psoPointOrSubpoint} (${item.sourceCriteriaNumbers})`
                  : item.sourceTableRow || item.psoPointOrSubpoint
            }`}
          >
            {item.sourcePart || item.psoPart} • {
              item.sourceOfficialPoint
                ? `pkt ${item.sourceOfficialPoint}`
                : item.sourceCriteriaNumbers
                  ? `${item.sourceTableRow || item.psoPointOrSubpoint} (${item.sourceCriteriaNumbers})`
                  : item.sourceTableRow || item.psoPointOrSubpoint
            }
          </span>

          <span className="pso-page-chip" title="Numer strony w oficjalnym PDF Dziennika Urzędowego MZ">
            str. {item.sourcePrintedPage || item.psoPdfPage}
          </span>
        </div>

        <div className="top-badges-right">
          {item.chplContentVerificationStatus === 'verified_full' ? (
            <span className="verification-chpl-chip" title={`ChPL w pełni zweryfikowana i zatwierdzona: ${item.chplReference || 'Zgodne'}`}>
              <span className="dot-pulse-green"></span>
              <span>ChPL: w pełni zweryfikowana</span>
            </span>
          ) : item.chplContentVerificationStatus === 'analyzed_with_discrepancy' ? (
            <span className="verification-chpl-discrepancy-chip" title="Dokument ChPL pobrany i przeanalizowany, ale istnieje otwarta rozbieżność źródłowa (fenyloalanina)">
              <span className="dot-pulse-red"></span>
              <span>ChPL: niezgodność źródłowa</span>
            </span>
          ) : item.chplReferenceStatus === 'official_document_identified' ? (
            <span className="verification-chpl-identified-chip" title={`Zidentyfikowano oficjalny dokument RPL/ChPL (${item.chplAuthorizationNumber || 'RPL'}). Sam dokument nie oznacza jeszcze ukończonego audytu treści.`}>
              <span className="dot-pulse-blue"></span>
              <span>ChPL: dokument w RPL (audyt treści w toku)</span>
            </span>
          ) : (
            <span className="verification-chpl-pending-chip" title="Wyłącznie orientacyjna nazwa handlowa produktu; oficjalny dokument ChPL nie został jeszcze zidentyfikowany ani zweryfikowany">
              <span className="dot-pulse-amber"></span>
              <span>ChPL: wyłącznie nazwa referencyjna</span>
            </span>
          )}
          <span className="verification-pso-chip" title={`Weryfikacja z PSO 2027: Komunikat GIS z ${item.psoGisAnnouncementDate || '28.10.2026'}, Dz. Urz. MZ z ${item.psoJournalPublicationDate || '30.10.2026'}`}>
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

      {/* Linked Preparations Snippet (Variant A.2 vs Conditional Alternative) */}
      {(variantOrDirectLinkages.length > 0 || (linkages.length === 0 && linkedProducts.length > 0)) && (
        <div className="linked-products-summary">
          <div className="linked-header">
            <Syringe size={14} className="linked-icon" />
            <span>
              {variantOrDirectLinkages.some(l => l.relationType === 'variant_a2_6in1')
                ? 'Powiązanie z Wariantem A.2 (6w1, opcjonalny – co do zasady odpłatny wg cz. IV):'
                : 'Preparaty w Bazie VaxNurse (Karta ChPL):'}
            </span>
          </div>
          <div className="linked-pills-list">
            {(variantOrDirectLinkages.length > 0 ? variantOrDirectLinkages : linkedProducts.map(p => ({ vaccineId: p.id, relationType: 'direct_primary' as const, variantA2Dose: null, standardCalendarDose: null, isVariantPatientFunded: false }))).map(link => {
              const prod = catalogVaccines.find(v => v.id === link.vaccineId);
              if (!prod) return null;
              const meta = VERIFICATION_STATUS_META[prod.verificationStatus];
              const isBlocked = prod.sourceDiscrepancies?.some(
                d => d.status === 'requires_clarification'
              );

              return (
                <div key={prod.id} className="linked-linkage-row">
                  <button
                    type="button"
                    className="linked-product-chip"
                    onClick={() => onSelectVaccineProduct?.(prod.id)}
                    title={`Kliknij, aby otworzyć oficjalną Kartę ChPL preparatu ${prod.tradeName}`}
                  >
                    <span className="prod-name">{prod.tradeName}</span>
                    <span className="prod-substance">({prod.activeSubstance})</span>
                    {link.relationType === 'variant_a2_6in1' && (
                      <span className="prod-variant-tag">Wariant A.2 (6w1)</span>
                    )}
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
                  {link.variantA2Dose && (
                    <div className="linkage-dose-comparison">
                      <span className="dose-map-pill">
                        <strong>Mapowanie 6w1:</strong> {link.variantA2Dose}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {conditionalLinkages.length > 0 && (
        <div className="conditional-alternative-summary">
          <div className="conditional-header">
            <AlertCircle size={14} className="warn-icon" />
            <span>Powiązanie warunkowe / alternatywne (Część III.E.3 PSO) — nie zastępuje domyślnie bezpłatnej DTaP 3w1 (Część III.E.2):</span>
          </div>
          <p className="conditional-subnote">
            Podstawowa 3-walentna szczepionka DTaP (cz. III.E.2) nie ma jeszcze karty w Bazie preparatów VaxNurse. Wskazany preparat 6w1 stanowi wyłącznie alternatywę warunkową:
          </p>
          <div className="linked-pills-list">
            {conditionalLinkages.map(link => {
              const prod = catalogVaccines.find(v => v.id === link.vaccineId);
              if (!prod) return null;
              return (
                <button
                  key={prod.id}
                  type="button"
                  className="linked-product-chip linked-product-chip-conditional"
                  onClick={() => onSelectVaccineProduct?.(prod.id)}
                  title={`Powiązanie warunkowe (cz. III.E.3 PSO) — otwórz Kartę ChPL ${prod.tradeName}`}
                >
                  <span className="prod-name">{prod.tradeName}</span>
                  <span className="prod-conditional-tag">Alternatywa warunkowa 6w1 (III.E.3)</span>
                  <span className="prod-status-blocked">Wyjaśnienie ChPL</span>
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

          {/* ChPL Reference Point & Official Source Details */}
          {(item.chplReference || item.chplOfficialSourceUrl || item.alternativeProductLabel || item.linkageAuditNote) && (
            <div className="expanded-section chpl-reference-section">
              <div className="section-title-with-icon">
                <BookOpen size={16} className="section-icon emerald" />
                <h4>Źródło i odnośnik do Charakterystyki Produktu Leczniczego (ChPL)</h4>
              </div>
              {item.chplReference && <p className="chpl-ref-text">{item.chplReference}</p>}

              {item.chplProductName && (
                <div className="chpl-registry-meta">
                  <span><strong>Produkt leczniczy:</strong> {item.chplProductName}</span>
                  {item.chplMarketingAuthorizationHolder && (
                    <span> • <strong>Podmiot odp.:</strong> {item.chplMarketingAuthorizationHolder}</span>
                  )}
                  {item.chplAuthorizationNumber && (
                    <span> • <strong>Nr pozwolenia:</strong> {item.chplAuthorizationNumber}</span>
                  )}
                  {item.chplPharmaceuticalForm && (
                    <div className="chpl-form-row"><strong>Postać:</strong> {item.chplPharmaceuticalForm}</div>
                  )}
                </div>
              )}

              {item.chplOfficialSourceUrl && (
                <div className="chpl-source-link-row">
                  <a
                    href={item.chplOfficialSourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="chpl-direct-doc-btn"
                  >
                    <span>Otwórz oficjalną ChPL produktu ({item.chplAuthorizationNumber || 'RPL / ChPL'})</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              )}

              {item.chplAudit && (
                <div className="chpl-audit-meta-box">
                  <div><strong>Audyt treści ChPL:</strong> {item.chplAudit.productName} ({item.chplAudit.documentIdOrAuthorizationNumber})</div>
                  <div><strong>Data / wersja dokumentu:</strong> {item.chplAudit.documentVersionOrDate}</div>
                  <div>
                    <strong>Zakres sekcji:</strong> {item.chplAudit.verifiedSectionsScope.join(', ') || 'brak'}{' '}
                    | <strong>Kontrola sekcji 1–10 ChPL:</strong> {reviewedSectionsCount}/10 sprawdzonych sekcji{' '}
                    | <strong>Data audytu:</strong> {item.chplAudit.auditDate} ({item.chplAudit.auditor})
                  </div>
                  {item.chplAudit.sectionReviews && item.chplAudit.sectionReviews.length > 0 && (
                    <div className="chpl-section-reviews-list">
                      {item.chplAudit.sectionReviews.map(sec => (
                        <div key={sec.sectionNumber}>
                          <strong>Pkt {sec.sectionNumber}{sec.sectionTitle ? ` (${sec.sectionTitle})` : ''}:</strong>{' '}
                          {sec.status === 'verified' ? 'sprawdzono' : sec.status === 'not_present_in_document' ? 'brak w dokumencie' : 'nie dotyczy'}
                          {sec.pageRef ? ` [${sec.pageRef}]` : ''}
                          {sec.subpoints && sec.subpoints.length > 0 ? ` — podpunkty: ${sec.subpoints.map(sp => sp.subpointId).join(', ')}` : ''}
                          {sec.discrepancyNote ? ` — ROZBIEŻNOŚĆ: ${sec.discrepancyNote}` : ''}
                          {sec.justification ? ` — ${sec.justification}` : ''}
                        </div>
                      ))}
                    </div>
                  )}
                  <div>
                    <strong>Wynik kontroli:</strong>{' '}
                    {item.chplAudit.auditOutcome === 'compliant' && 'Zgodna'}
                    {item.chplAudit.auditOutcome === 'discrepancy_detected' && `Wykryto rozbieżności (${item.chplAudit.unresolvedDiscrepanciesCount} otwarte) — awans do w pełni zweryfikowanej ChPL zablokowany`}
                    {item.chplAudit.auditOutcome === 'pending_review' && 'Oczekuje na pełną kontrolę wszystkich 10 właściwych sekcji ChPL (1–10)'}
                  </div>
                </div>
              )}

              {item.alternativeProductLabel && (
                <div className="alternative-product-notice">
                  <strong>Informacja o produkcie alternatywnym ({item.alternativeProductStatus}):</strong> {item.alternativeProductLabel}
                  {item.alternativeProductDetails && (
                    <div className="alt-rpl-details">
                      <div>
                        <strong>RPL:</strong> {item.alternativeProductDetails.rplProductName} (ID {item.alternativeProductDetails.rplId}, poz. {item.alternativeProductDetails.authorizationNumber}, {item.alternativeProductDetails.marketingAuthorizationHolder}, ważność: {item.alternativeProductDetails.authorizationValidity}, rewizja ChPL pkt 10: {item.alternativeProductDetails.chplRevisionDate})
                      </div>
                      <div className="alt-market-warning">
                        <strong>Rozróżnienie ChPL vs dostępność:</strong> {item.alternativeProductDetails.marketAvailabilityNote}
                      </div>
                      <a
                        href={item.alternativeProductDetails.officialChplUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="chpl-direct-doc-btn"
                      >
                        <span>Otwórz ChPL produktu alternatywnego w RPL (ID {item.alternativeProductDetails.rplId})</span>
                        <ExternalLink size={13} />
                      </a>
                    </div>
                  )}
                </div>
              )}

              {item.linkageAuditNote && (
                <div className="linkage-audit-notice">
                  <strong>Uwaga z kontroli powiązania handlowego:</strong> {item.linkageAuditNote}
                </div>
              )}

              {item.fundingAuditDetails && (
                <div className="funding-audit-notice">
                  <div><strong>Audyt finansowania (odrębny od samego wpisu do PSO):</strong></div>
                  <div><strong>Podstawa prawna:</strong> {item.fundingAuditDetails.legalBasis}</div>
                  <div><strong>Grupa docelowa:</strong> {item.fundingAuditDetails.targetGroup}</div>
                  <div><strong>Typ i zakres preparatów:</strong> {item.fundingAuditDetails.productType}</div>
                  <div><strong>Warunki i zastrzeżenia:</strong> {item.fundingAuditDetails.conditions}</div>
                  <div><strong>Okres obowiązywania:</strong> {item.fundingAuditDetails.validityPeriod}</div>
                  <div><strong>Data weryfikacji źródeł:</strong> {item.fundingAuditDetails.verifiedDate}</div>
                  <div><strong>Stan weryfikacji / ważność:</strong> {item.fundingAuditDetails.validityOrVerifiedDate}</div>

                  {item.fundingAuditDetails.mechanismBreakdown && (
                    <div className="funding-mechanism-list">
                      <div><strong>Rozdzielenie mechanizmów finansowania i realizacji:</strong></div>
                      <ul>
                        <li><strong>Zakup preparatu ze środków publicznych:</strong> {item.fundingAuditDetails.mechanismBreakdown.stateVaccinePurchase}</li>
                        <li><strong>Wykonanie usługi szczepienia:</strong> {item.fundingAuditDetails.mechanismBreakdown.serviceExecutionFunding}</li>
                        <li><strong>Refundacja apteczna (wykaz MZ 84W):</strong> {item.fundingAuditDetails.mechanismBreakdown.pharmacyReimbursement}</li>
                        <li><strong>Odpłatność częściowa / pełnopłatna:</strong> {item.fundingAuditDetails.mechanismBreakdown.partialReimbursementDetail}</li>
                        <li><strong>Program czasowy / interwencyjny:</strong> {item.fundingAuditDetails.mechanismBreakdown.temporaryProgram}</li>
                        <li><strong>Dystrybucja i dostępność regionalna:</strong> {item.fundingAuditDetails.mechanismBreakdown.regionalAvailabilityAndDistribution}</li>
                      </ul>
                      <div className={item.fundingAuditDetails.mechanismBreakdown.localPointAvailabilityConfirmed ? 'point-availability-confirmed' : 'point-availability-unconfirmed'}>
                        <strong>Stan magazynowy w punkcie szczepień:</strong>{' '}
                        {item.fundingAuditDetails.mechanismBreakdown.localPointAvailabilityConfirmed
                          ? 'Potwierdzona dostępność lokalna w punkcie'
                          : 'Niepotwierdzona lokalnie w tym punkcie (brak automatycznego domniemania dostępności fiolki na półce)'}
                      </div>
                    </div>
                  )}

                  {pediatricScopes.length > 0 && (
                    <div className="funding-scopes-container">
                      <div><strong>Szczegółowy podział zakresów pediatrycznych (&lt;18 lat) wg wieku, preparatu i podstawy ({pediatricScopes.length}):</strong></div>
                      {pediatricScopes.map(renderFundingScopeCard)}
                    </div>
                  )}

                  {unconfirmedSeasonalScopes.length > 0 && (
                    <div className="unconfirmed-seasonal-notice">
                      <div><strong>Preparaty wyłączone z wyboru pediatrycznego (brak potwierdzonej dostępności w sezonie 2026/2027 — {unconfirmedSeasonalScopes.length}):</strong></div>
                      {unconfirmedSeasonalScopes.map(scope => (
                        <div key={scope.scopeId} className="unconfirmed-seasonal-item">
                          <div><strong>{scope.productScope}</strong></div>
                          <div>{scope.unconfirmedAvailabilityNote || scope.conditionsAndExceptions}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {item.populationScope === 'cross_age' && adultReferenceScopes.length > 0 && (
                    <div className="funding-scopes-container funding-scopes-adult-boundary">
                      <div><strong>Zakresy dla osób ≥18. roku życia (brak prawa do DZ) i komunikaty regionalne ({adultReferenceScopes.length}):</strong></div>
                      <div className="adult-boundary-note">
                        Granica 18. urodzin: po ukończeniu 18. r.ż. wygasa bezpłatny wykaz D1 („18-”, kod DZ); obowiązują odrębne zasady odpłatności lub programy czasowe wskazane poniżej.
                      </div>
                      {adultReferenceScopes.map(renderFundingScopeCard)}
                    </div>
                  )}

                  {item.fundingAuditDetails.gtinReferences && item.fundingAuditDetails.gtinReferences.length > 0 && (
                    <div className="gtin-references-box">
                      <div><strong>Dokumentacja źródeł kodów GTIN ({item.fundingAuditDetails.gtinReferences.length}):</strong></div>
                      {item.fundingAuditDetails.gtinReferences.map(g => (
                        <div key={g.gtin} className="gtin-reference-item">
                          <div><strong>GTIN {g.gtin}</strong> – {g.productPresentation} ({g.targetAgeGroup}, dawka {g.dose})</div>
                          <div>
                            <strong>Wytyczne MZ:</strong>{' '}
                            <a href={g.sourceDocumentUrl} target="_blank" rel="noopener noreferrer">{g.sourceDocumentTitle}</a>{' '}
                            ({g.sourceSectionOrPage})
                          </div>
                          {g.rarsSourceUrl && (
                            <div>
                              <strong>RARS:</strong>{' '}
                              <a href={g.rarsSourceUrl} target="_blank" rel="noopener noreferrer">{g.rarsSourceTitle || 'Strona RARS'}</a>{' '}
                              {g.rarsPresentationText ? `— „${g.rarsPresentationText}”` : ''}
                            </div>
                          )}
                          <div className="gtin-sources-matrix">
                            <span className={g.confirmedByMzGuidelines ? 'gtin-source-pill-ok' : 'gtin-source-pill-muted'}>
                              Wytyczne MZ: {g.confirmedByMzGuidelines ? 'TAK' : 'NIE'}
                            </span>
                            <span className={g.confirmedByRars ? 'gtin-source-pill-ok' : 'gtin-source-pill-muted'}>
                              RARS: {g.confirmedByRars ? 'TAK' : 'NIE'}
                            </span>
                            <span className={g.confirmedByRpl ? 'gtin-source-pill-ok' : 'gtin-source-pill-muted'}>
                              RPL: {g.confirmedByRpl ? 'TAK' : 'NIE (brak GTIN w RPL)'}
                            </span>
                            <span className={g.confirmedByEma ? 'gtin-source-pill-ok' : 'gtin-source-pill-muted'}>
                              EPAR EMA: {g.confirmedByEma ? 'TAK' : 'NIE (EMA nie publikuje GTIN)'}
                            </span>
                          </div>
                          <div><strong>Kontrola krzyżowa źródeł:</strong> {g.notes}</div>
                          <span className="gtin-status-tag">
                            {g.verificationStatus === 'confirmed_in_official_guideline_and_product_doc' && 'Potwierdzono w wytycznych i dokumentacji rejestracyjnej produktu (RPL/EMA)'}
                            {g.verificationStatus === 'confirmed_mz_guideline_and_rars_pending_rpl_ema' && 'Potwierdzono w Wytycznych MZ i na stronie RARS (brak potwierdzenia GTIN w RPL / EPAR EMA)'}
                            {g.verificationStatus === 'confirmed_operational_guideline_pending_rpl_rars_cross_check' && 'Potwierdzono w wytycznych MZ – kontrola krzyżowa z RPL/RARS w toku'}
                            {g.verificationStatus === 'pending_gtin_verification' && 'Oczekuje na potwierdzenie źródła GTIN'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Official PSO Reference Footer */}
          <div className="expanded-source-footer">
            <div className="source-meta-grid">
              <div className="source-meta-item">
                <FileText size={15} className="source-icon" />
                <div className="source-meta-text">
                  <strong>Pozycja w dokumencie:</strong> {item.sourcePart || item.psoPart} {
                    item.sourceOfficialPoint
                      ? `(pkt ${item.sourceOfficialPoint})`
                      : item.sourceCriteriaNumbers
                        ? `(wiersz: ${item.sourceTableRow}, ${item.sourceCriteriaNumbers})`
                        : item.sourceTableRow
                          ? `(wiersz: ${item.sourceTableRow})`
                          : ''
                  } – strona {item.sourcePrintedPage || item.psoPdfPage} Dziennika
                </div>
              </div>

              <div className="source-meta-item">
                <Layers size={15} className="source-icon" />
                <div className="source-meta-text">
                  <strong>Część i punkt źródłowy:</strong> {item.sourcePart || item.psoPart}{
                    item.sourceOfficialPoint
                      ? `, punkt ${item.sourceOfficialPoint}`
                      : item.sourceCriteriaNumbers
                        ? `, ${item.sourceCriteriaNumbers}`
                        : ' (tabela bez oficjalnych podpunktów)'
                  }
                </div>
              </div>
            </div>

            {/* Odrębne statusy weryfikacji (Punkt 5 audytu + PROMPT 18) */}
            <div className="verification-status-breakdown">
              <div className="verification-item">
                <span className="v-label">Weryfikacja źródła PSO:</span>
                <span className="v-val status-ok">Zweryfikowano z PSO 2027 (Dz. Urz. MZ 2026 poz. 77)</span>
              </div>
              <div className="verification-item">
                <span className="v-label">Dokument źródłowy ChPL:</span>
                <span className={`v-val ${item.chplReferenceStatus === 'official_document_identified' ? 'status-ok' : 'status-pending'}`}>
                  {item.chplReferenceStatus === 'official_document_identified' && 'Zidentyfikowano oficjalny dokument (RPL / GSK / EMA)'}
                  {item.chplReferenceStatus === 'reference_name_only' && 'Wyłącznie nazwa handlowa (brak podpiętego dokumentu)'}
                  {item.chplReferenceStatus === 'missing' && 'Brak odniesienia'}
                </span>
              </div>
              <div className="verification-item">
                <span className="v-label">Weryfikacja treści ChPL:</span>
                <span
                  className={`v-val ${
                    item.chplContentVerificationStatus === 'verified_full'
                      ? 'status-ok'
                      : item.chplContentVerificationStatus === 'analyzed_with_discrepancy'
                        ? 'status-discrepancy'
                        : 'status-pending'
                  }`}
                >
                  {item.chplContentVerificationStatus === 'verified_full' && 'W pełni zweryfikowana i zatwierdzona'}
                  {item.chplContentVerificationStatus === 'analyzed_with_discrepancy' && 'Przeanalizowana – otwarta niezgodność źródłowa'}
                  {item.chplContentVerificationStatus === 'pending_content_audit' && 'Oczekuje na pełną analizę i audyt treści'}
                  {item.chplContentVerificationStatus === 'not_verified' && 'Niezweryfikowana (brak pobranego dokumentu)'}
                </span>
              </div>
              <div className="verification-item">
                <span className="v-label">Weryfikacja finansowania:</span>
                <span
                  className={`v-val ${
                    item.fundingVerificationStatus === 'verified_public_free'
                      ? 'status-ok'
                      : item.fundingVerificationStatus === 'verified_self_funded'
                        ? 'status-muted'
                        : 'status-pending'
                  }`}
                >
                  {item.fundingVerificationStatus === 'verified_public_free' && 'Potwierdzone: bezpłatne (zakup MZ / NFZ)'}
                  {item.fundingVerificationStatus === 'verified_reimbursement' && 'Potwierdzone: refundacja wg odrębnych przepisów'}
                  {item.fundingVerificationStatus === 'verified_self_funded' && 'Co do zasady odpłatne w populacji ogólnej (z wyjątkami ustawowymi / grup ryzyka)'}
                  {item.fundingVerificationStatus === 'pending_clarification' && 'Wymaga doprecyzowania (odrębne obwieszczenia/komunikaty)'}
                </span>
              </div>
              <div className="verification-item">
                <span className="v-label">Powiązanie z katalogiem handlowym:</span>
                <span
                  className={`v-val ${
                    item.productLinkageStatus === 'linked_catalog'
                      ? 'status-ok'
                      : item.productLinkageStatus === 'conditional_alternative'
                        ? 'status-pending'
                        : 'status-muted'
                  }`}
                >
                  {item.productLinkageStatus === 'linked_catalog' && `Powiązanie z Wariantem A.2 / 6w1 (${item.linkedVaccineIds.join(', ')})`}
                  {item.productLinkageStatus === 'conditional_alternative' && 'Brak karty podstawowej 3w1 (oczekuje); warunkowa alternatywa 6w1 (cz. III.E.3)'}
                  {item.productLinkageStatus === 'pending_catalog_entry' && 'Oczekuje na utworzenie karty handlowej'}
                  {item.productLinkageStatus === 'not_applicable' && 'Nie dotyczy'}
                </span>
              </div>
              <div className="verification-item">
                <span className="v-label">Kompletność karty w bazie VaxNurse:</span>
                <span
                  className={`v-val ${
                    catalogCardCompleteness === 'complete_verified_card'
                      ? 'status-ok'
                      : catalogCardCompleteness === 'incomplete_or_unverified_card'
                        ? 'status-pending'
                        : 'status-muted'
                  }`}
                >
                  {catalogCardCompleteness === 'complete_verified_card' && 'Kompletna, zweryfikowana karta produktu'}
                  {catalogCardCompleteness === 'incomplete_or_unverified_card' && 'Karta niepełna / z otwartą niezgodnością źródłową ChPL'}
                  {catalogCardCompleteness === 'missing_catalog_card' && 'Brak karty handlowej w bazie preparatów (odrębne od audytu treści ChPL)'}
                </span>
              </div>
              <div className="verification-item">
                <span className="v-label">Adekwatność produktu dla procedury PSO:</span>
                <span
                  className={`v-val ${
                    procedureProductAdequacy === 'confirmed_adequate'
                      ? 'status-ok'
                      : procedureProductAdequacy === 'requires_clarification'
                        ? 'status-discrepancy'
                        : 'status-pending'
                  }`}
                >
                  {procedureProductAdequacy === 'confirmed_adequate' && 'Potwierdzona adekwatność dla procedury'}
                  {procedureProductAdequacy === 'conditional_with_restrictions' && 'Warunkowa / z zastrzeżeniami (np. Wariant A.2 6w1 lub alternatywa)'}
                  {procedureProductAdequacy === 'requires_clarification' && 'Wymaga wyjaśnienia (otwarta niezgodność źródłowa produktu)'}
                  {procedureProductAdequacy === 'pending_adequacy_review' && 'Oczekuje na przegląd i powiązanie produktu'}
                </span>
              </div>
            </div>

            <div className="source-legal-act">
              <strong>Akt prawny:</strong> {item.psoJournalEntry || 'Dz. Urz. MZ 2026 poz. 77'} (Komunikat GIS z dn. {item.psoGisAnnouncementDate || '28.10.2026'}, opublikowany w Dz. Urz. MZ w dn. {item.psoJournalPublicationDate || '30.10.2026'})
            </div>

            <div className="source-links-row">
              <a
                href={`${item.psoOfficialUrl}#page=${item.sourcePdfPage || item.psoPdfPage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="pso-official-anchor-btn"
              >
                <span>Otwórz oficjalny PDF Dziennika Urzędowego MZ (akt.pdf, str. {item.sourcePdfPage || item.psoPdfPage})</span>
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
