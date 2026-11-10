import React, { useState } from 'react';
import {
  ArrowLeft,
  ExternalLink,
  ShieldAlert,
  AlertTriangle,
  Building2,
  FileText,
  FileCheck,
  Clock,
  Layers,
  ThermometerSnowflake,
  Activity,
  Heart,
  Info,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Package,
  Calendar,
  CheckCircle2,
  RotateCcw,
  DownloadCloud,
  UserCheck,
  Search
} from 'lucide-react';
import type { VaccineProduct, ChPLSection, VaccineVerificationStatus } from '../../types/vaccines';
import {
  VERIFICATION_STATUS_META,
  VACCINE_TYPE_LABELS,
  TARGET_GROUP_LABELS
} from '../../data/vaccinesCatalog';

interface VaccineDetailViewProps {
  vaccine: VaccineProduct;
  onBackToList: () => void;
  onUpdateVaccine?: (updatedVaccine: VaccineProduct) => void;
}

export const VaccineDetailView: React.FC<VaccineDetailViewProps> = ({
  vaccine: initialVaccine,
  onBackToList,
  onUpdateVaccine
}) => {
  const [currentVaccine, setCurrentVaccine] = useState<VaccineProduct>(initialVaccine);
  const statusMeta = VERIFICATION_STATUS_META[currentVaccine.verificationStatus];

  // Nierozwiązane niezgodności w oficjalnej dokumentacji ChPL (Zadanie 1 i Zadanie 4)
  const hasUnresolvedDiscrepancies = Boolean(
    currentVaccine.sourceDiscrepancies?.some(d => d.status === 'requires_clarification')
  );

  // State to manage collapsible section groups
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    sec1: true,
    sec2: true,
    sec3: true,
    sec4: true, // 4. Szczegółowe dane kliniczne
    sec5: true, // 5. Właściwości farmakologiczne
    sec6: true, // 6. Dane farmaceutyczne
    sec7: true,
    sec8: true,
    sec9: true,
    sec10: true,
    secOptional: false
  });

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const expandAll = () => {
    setExpandedSections({
      sec1: true,
      sec2: true,
      sec3: true,
      sec4: true,
      sec5: true,
      sec6: true,
      sec7: true,
      sec8: true,
      sec9: true,
      sec10: true,
      secOptional: true
    });
  };

  const collapseAll = () => {
    setExpandedSections({
      sec1: false,
      sec2: false,
      sec3: false,
      sec4: false,
      sec5: false,
      sec6: false,
      sec7: false,
      sec8: false,
      sec9: false,
      sec10: false,
      secOptional: false
    });
  };

  // Helper to update verification status across the product and its sections
  const handleUpdateStatus = (newStatus: VaccineVerificationStatus) => {
    // Zadanie 4: Nie pozwalaj na status verified_chpl, jeżeli istnieje nierozwiązana niezgodność dotycząca dokumentacji
    if (newStatus === 'verified_chpl' && hasUnresolvedDiscrepancies) {
      alert(
        'Blokada weryfikacji: Preparat posiada nierozwiązane rozbieżności wewnętrzne w oficjalnej dokumentacji ChPL (status: requires_clarification). Do czasu oficjalnego wyjaśnienia lub sprostowania druków przez podmiot odpowiedzialny / URPL / EMA nadanie statusu zweryfikowanego z ChPL jest zablokowane.'
      );
      return;
    }

    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('pl-PL')} r., godz. ${now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}`;
    
    const updateSectionStatus = (sec: ChPLSection): ChPLSection => ({
      ...sec,
      verificationStatus: newStatus,
      verificationNote: newStatus === 'verified_chpl'
        ? 'Zweryfikowano z oficjalną ChPL przez personel medyczny punktu szczepień.'
        : sec.verificationNote
    });

    const updated: VaccineProduct = {
      ...currentVaccine,
      verificationStatus: newStatus,
      userVerificationDate: newStatus === 'verified_chpl' ? formattedDate : null,
      userVerificationNotes: newStatus === 'verified_chpl'
        ? `Zatwierdzono w punkcie szczepień na podstawie oficjalnej ChPL (wersja: ${currentVaccine.chplRevisionDate || 'b.d.'}).`
        : null,
      chpl: {
        ...currentVaccine.chpl,
        name: updateSectionStatus(currentVaccine.chpl.name),
        composition: updateSectionStatus(currentVaccine.chpl.composition),
        pharmaceuticalForm: updateSectionStatus(currentVaccine.chpl.pharmaceuticalForm),
        clinicalParticulars: {
          indications: updateSectionStatus(currentVaccine.chpl.clinicalParticulars.indications),
          dosageAndAdministration: updateSectionStatus(currentVaccine.chpl.clinicalParticulars.dosageAndAdministration),
          contraindications: updateSectionStatus(currentVaccine.chpl.clinicalParticulars.contraindications),
          warningsAndPrecautions: updateSectionStatus(currentVaccine.chpl.clinicalParticulars.warningsAndPrecautions),
          interactions: updateSectionStatus(currentVaccine.chpl.clinicalParticulars.interactions),
          fertilityPregnancyLactation: updateSectionStatus(currentVaccine.chpl.clinicalParticulars.fertilityPregnancyLactation),
          driveAndMachines: updateSectionStatus(currentVaccine.chpl.clinicalParticulars.driveAndMachines),
          undesirableEffects: updateSectionStatus(currentVaccine.chpl.clinicalParticulars.undesirableEffects),
          overdose: updateSectionStatus(currentVaccine.chpl.clinicalParticulars.overdose)
        },
        pharmacologicalProperties: {
          pharmacodynamics: updateSectionStatus(currentVaccine.chpl.pharmacologicalProperties.pharmacodynamics),
          pharmacokinetics: updateSectionStatus(currentVaccine.chpl.pharmacologicalProperties.pharmacokinetics),
          preclinicalSafety: updateSectionStatus(currentVaccine.chpl.pharmacologicalProperties.preclinicalSafety)
        },
        pharmaceuticalParticulars: {
          excipients: updateSectionStatus(currentVaccine.chpl.pharmaceuticalParticulars.excipients),
          incompatibilities: updateSectionStatus(currentVaccine.chpl.pharmaceuticalParticulars.incompatibilities),
          shelfLife: updateSectionStatus(currentVaccine.chpl.pharmaceuticalParticulars.shelfLife),
          storageSpecialPrecautions: updateSectionStatus(currentVaccine.chpl.pharmaceuticalParticulars.storageSpecialPrecautions),
          containerNatureAndContents: updateSectionStatus(currentVaccine.chpl.pharmaceuticalParticulars.containerNatureAndContents),
          disposalAndHandling: updateSectionStatus(currentVaccine.chpl.pharmaceuticalParticulars.disposalAndHandling)
        },
        marketingAuthorisationHolder: updateSectionStatus(currentVaccine.chpl.marketingAuthorisationHolder),
        marketingAuthorisationNumber: updateSectionStatus(currentVaccine.chpl.marketingAuthorisationNumber),
        firstAuthorisationAndRenewal: updateSectionStatus(currentVaccine.chpl.firstAuthorisationAndRenewal),
        revisionDate: updateSectionStatus(currentVaccine.chpl.revisionDate)
      }
    };

    setCurrentVaccine(updated);
    if (onUpdateVaccine) {
      onUpdateVaccine(updated);
    }
  };

  // Helper render for single section or subsection
  const renderSectionBox = (sec: ChPLSection, icon: React.ReactNode, isSub: boolean = false) => {
    const secStatus = VERIFICATION_STATUS_META[sec.verificationStatus];
    const sectionDiscrepancies = currentVaccine.sourceDiscrepancies?.filter(
      d => d.firstSection === sec.sectionNumber || d.secondSection === sec.sectionNumber
    ) || [];

    return (
      <div key={sec.sectionNumber} className={`chpl-point-box ${isSub ? 'subsection' : ''} ${sectionDiscrepancies.length > 0 ? 'has-discrepancy' : ''}`}>
        <div className="point-box-header">
          <div className="point-box-title-group">
            <span className="point-icon-wrapper">{icon}</span>
            <div>
              <span className="point-number-tag">Punkt {sec.sectionNumber} ChPL</span>
              <h4 className="point-title-text">{sec.sectionTitle}</h4>
            </div>
          </div>

          <div className="point-box-meta-badges">
            {sectionDiscrepancies.length > 0 && (
              <span className="point-discrepancy-tag" title="W tym punkcie występuje niezgodność wewnętrzna w oficjalnej ChPL">
                <AlertTriangle size={12} /> Rozbieżność w ChPL
              </span>
            )}
            {sec.pdfPageNumber && (
              <span className="point-page-tag" title="Numer strony w oficjalnym druku PDF ChPL">
                Strona PDF: str. {sec.pdfPageNumber}
              </span>
            )}
            <span className="point-source-tag" title={sec.officialSource || undefined}>
              Źródło: {sec.officialSource || 'RPL (eZdrowie)'}
            </span>
            <span className={`point-status-tag ${secStatus.badgeClass}`}>
              <span className="status-mini-dot"></span>
              {secStatus.label}
            </span>
          </div>
        </div>

        <div className="point-box-body">
          {sectionDiscrepancies.length > 0 && (
            <div className="point-section-discrepancy-alert">
              <div className="p-disc-alert-header">
                <AlertTriangle size={16} className="p-disc-icon" />
                <span className="p-disc-title">
                  Niezgodność wewnętrzna oficjalnej ChPL: {sectionDiscrepancies[0].fieldName}
                </span>
                <span className="p-disc-status-tag">Status: requires_clarification</span>
              </div>
              <div className="p-disc-alert-content">
                <p>
                  W punkcie <strong>{sec.sectionNumber}</strong> oficjalny dokument podaje:{' '}
                  <strong className="p-disc-highlight">
                    {sec.sectionNumber === sectionDiscrepancies[0].firstSection
                      ? sectionDiscrepancies[0].firstValue
                      : sectionDiscrepancies[0].secondValue}
                  </strong>
                  , natomiast w punkcie{' '}
                  <strong>
                    {sec.sectionNumber === sectionDiscrepancies[0].firstSection
                      ? sectionDiscrepancies[0].secondSection
                      : sectionDiscrepancies[0].firstSection}
                  </strong>{' '}
                  widnieje:{' '}
                  <strong className="p-disc-highlight">
                    {sec.sectionNumber === sectionDiscrepancies[0].firstSection
                      ? sectionDiscrepancies[0].secondValue
                      : sectionDiscrepancies[0].firstValue}
                  </strong>
                  .
                </p>
                <div className="p-disc-notes-row">
                  <span className="p-disc-rule-note">
                    <ShieldAlert size={13} /> Zachowano obie wartości zgodnie z tekstem ChPL bez automatycznego ujednolicania.
                  </span>
                  <a
                    href={sectionDiscrepancies[0].documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-disc-source-link"
                  >
                    <span>Sprawdź w oficjalnej ChPL GSK (12.02.2026)</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
              </div>
            </div>
          )}

          {sec.content ? (
            <div className="point-content-present">
              <div className="point-text-block">
                {sec.content.split('\n').map((line, idx) => (
                  <p key={idx} className="point-text-line">
                    {line}
                  </p>
                ))}
              </div>

              {sec.sourceDocumentUrl && (
                <div className="point-source-link-row">
                  <a
                    href={sec.sourceDocumentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-point-source-link"
                    title="Otwórz oficjalny druk ChPL w formacie PDF"
                  >
                    <span>Otwórz oficjalny PDF ChPL {sec.pdfPageNumber ? `(str. ${sec.pdfPageNumber})` : ''}</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}

              {sec.verificationNote && (
                <span className="point-note-text">
                  <Info size={13} /> {sec.verificationNote}
                </span>
              )}
            </div>
          ) : (
            <div className="point-content-unverified">
              <div className="unverified-icon-col">
                <AlertTriangle size={16} className="unverified-alert-icon" />
              </div>
              <div className="unverified-text-col">
                <strong>Punkt {sec.sectionNumber} – treść oczekuje na weryfikację z drukiem ChPL</strong>
                <p>
                  Aplikacja VaxNurse nie uzupełnia danych klinicznych domysłami. Treść tego punktu nie została jeszcze zweryfikowana z oficjalnym drukiem w Rejestrze Produktów Leczniczych.
                </p>
                {sec.verificationNote && (
                  <span className="unverified-note">
                    <strong>Wskazówka:</strong> {sec.verificationNote}
                  </span>
                )}
                <div className="unverified-link-row">
                  <a
                    href={currentVaccine.currentChplUrl || 'https://rejestrymedyczne.ezdrowie.gov.pl/rpl/search/public'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-verify-in-rpl"
                  >
                    <span>Weryfikuj w oficjalnym źródle ChPL / RPL</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const { chpl } = currentVaccine;

  return (
    <div className="vaccine-detail-container">
      {/* Top Navigation */}
      <div className="module-view-nav">
        <button
          type="button"
          className="back-to-dashboard-btn"
          onClick={onBackToList}
        >
          <ArrowLeft size={16} />
          <span>Powrót do Bazy preparatów</span>
        </button>
        <span className="view-mode-pill">Karta ChPL (EMA QRD v10.4)</span>
      </div>

      {/* Main Product Header Card */}
      <div className="v-detail-header-card">
        <div className="v-detail-header-top">
          <div className="v-detail-badges">
            <span className={`v-status-badge ${statusMeta.badgeClass}`}>
              <span className="v-status-dot"></span>
              {statusMeta.label}
            </span>
            <span className="v-type-badge">
              {VACCINE_TYPE_LABELS[currentVaccine.vaccineType]}
            </span>
            <span className="v-target-badge">
              {TARGET_GROUP_LABELS[currentVaccine.targetGroup]}
            </span>
            {currentVaccine.atcCode && (
              <span className="v-atc-pill">Kod ATC: {currentVaccine.atcCode} (Pkt 5.1)</span>
            )}
          </div>

          <div className="v-detail-quick-actions">
            {currentVaccine.rplRecordUrl ? (
              <a
                href={currentVaccine.rplRecordUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-rpl-official"
              >
                <span>Rekord w RPL</span>
                <ExternalLink size={15} />
              </a>
            ) : (
              <a
                href="https://rejestrymedyczne.ezdrowie.gov.pl/rpl/search/public"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-rpl-search"
                title="Brak jednoznacznego trwałego permalinka w RPL eZdrowie dla procedury centralnej EMA – kliknij, aby przejść do wyszukiwarki ogólnej"
              >
                <Search size={14} />
                <span>Szukaj w RPL (brak permalinka)</span>
                <ExternalLink size={13} />
              </a>
            )}

            {currentVaccine.currentChplUrl && (
              <a
                href={currentVaccine.currentChplUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-chpl-official"
                title="Pobierz lub wyświetl oficjalny plik PDF ChPL"
              >
                <FileText size={15} />
                <span>Oficjalny druk ChPL (PDF)</span>
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>

        <div className="v-detail-header-body">
          <h1 className="v-detail-title">{currentVaccine.tradeName}</h1>
          <p className="v-detail-substance">
            <strong>Substancja czynna (Pkt 2 ChPL):</strong> {currentVaccine.activeSubstance}
          </p>

          <div className="v-detail-specs-grid">
            <div className="v-spec-item">
              <span className="v-spec-label">Podmiot odpowiedzialny (Pkt 7):</span>
              <span className="v-spec-value">{currentVaccine.manufacturer}</span>
            </div>
            <div className="v-spec-item">
              <span className="v-spec-label">Postać farmaceutyczna (Pkt 3):</span>
              <span className="v-spec-value">{currentVaccine.pharmaceuticalForm}</span>
            </div>
            <div className="v-spec-item">
              <span className="v-spec-label">Numer pozwolenia (Pkt 8):</span>
              <span className="v-spec-value">{currentVaccine.marketingAuthorizationNumber || 'Brak danych w bazie'}</span>
            </div>
            <div className="v-spec-item">
              <span className="v-spec-label">Powiązanie z rejestrem RPL:</span>
              <span className={`v-spec-value ${currentVaccine.rplRecordUrl ? '' : 'rpl-null-notice'}`}>
                {currentVaccine.rplRecordUrl ? 'Dostępny bezpośredni permalink' : 'Brak permalinka (wyszukiwanie wg nazwy)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* OSTRZEŻENIE O ROZBIEŻNOŚCIACH W DOKUMENTACJI CHPL (ZADANIE 1)  */}
      {/* ============================================================== */}
      {hasUnresolvedDiscrepancies && currentVaccine.sourceDiscrepancies && currentVaccine.sourceDiscrepancies.length > 0 && (
        <section className="v-discrepancy-banner-card" aria-label="Wykryte rozbieżności w oficjalnej dokumentacji ChPL">
          <div className="v-disc-card-header">
            <div className="v-disc-header-left">
              <span className="v-disc-icon-box">
                <AlertTriangle size={24} className="v-disc-icon" />
              </span>
              <div>
                <div className="v-disc-badges-row">
                  <span className="v-disc-alert-pill">Wykryto niezgodność w druku ChPL</span>
                  <span className="v-disc-status-pill">Status: requires_clarification</span>
                </div>
                <h2 className="v-disc-headline">
                  Niezgodność wewnętrzna oficjalnej Charakterystyki Produktu Leczniczego
                </h2>
              </div>
            </div>
          </div>

          <div className="v-disc-card-body">
            <p className="v-disc-intro">
              W trakcie badania dokumentacji źródłowej (polska ChPL GSK z 12.02.2026 oraz unijna EPAR SmPC) wykryto rozbieżność liczbową w oficjalnym tekście urzędowym.
              Zgodnie z zasadami rzetelności medycznej <strong>aplikacja VaxNurse zachowuje obie wartości zgodnie z sekcjami dokumentu</strong> i nie modyfikuje ich domysłem ani automatycznym ujednoliceniem.
            </p>

            <div className="v-disc-items-grid">
              {currentVaccine.sourceDiscrepancies.map(disc => (
                <div key={disc.id} className="v-disc-item-card">
                  <div className="v-disc-item-header">
                    <span className="v-disc-field-label">Badany parametr:</span>
                    <strong className="v-disc-field-name">{disc.fieldName}</strong>
                    <span className="v-disc-clarif-badge">Wymaga wyjaśnienia urzędowego</span>
                  </div>

                  <div className="v-disc-compare-boxes">
                    <div className="v-disc-compare-tile sec-first">
                      <span className="v-disc-tile-sec">Punkt {disc.firstSection} ChPL (Skład jakościowy i ilościowy)</span>
                      <span className="v-disc-tile-val">{disc.firstValue}</span>
                    </div>
                    <div className="v-disc-compare-vs">vs</div>
                    <div className="v-disc-compare-tile sec-second">
                      <span className="v-disc-tile-sec">Punkt {disc.secondSection} ChPL (Specjalne ostrzeżenia i środki ostrożności)</span>
                      <span className="v-disc-tile-val">{disc.secondValue}</span>
                    </div>
                  </div>

                  <p className="v-disc-desc-paragraph">
                    <strong>Opis rozbieżności:</strong> {disc.description}
                  </p>

                  <div className="v-disc-actions-bar">
                    <a
                      href={disc.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-disc-source-link primary"
                      title="Otwórz oficjalny PDF ChPL GSK z 12.02.2026"
                    >
                      <FileText size={14} />
                      <span>Oficjalna ChPL GSK Polska (12.02.2026)</span>
                      <ExternalLink size={13} />
                    </a>
                    <a
                      href="https://www.ema.europa.eu/pl/documents/product-information/infanrix-hexa-epar-product-information_pl.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-disc-source-link secondary"
                      title="Otwórz oficjalny polski druk EPAR SmPC Europejskiej Agencji Leków (EMA)"
                    >
                      <FileCheck size={14} />
                      <span>Porównaj z wersją EMA PL</span>
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="v-disc-footer-warning">
              <ShieldAlert size={18} className="v-disc-shield-icon" />
              <span>
                <strong>Blokada statusu weryfikacji:</strong> Dopóki rozbieżność w oficjalnym druku nie zostanie sprostowana przez wytwórcę lub URPL/EMA (status: <code>requires_clarification</code>), nadanie statusu <em>Zweryfikowany na podstawie ChPL</em> jest zablokowane ze względów bezpieczeństwa.
              </span>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* KROK 3: PANEL ROZDZIELENIA DAT                                 */}
      {/* ============================================================== */}
      <section className="v-dates-panel" aria-label="Daty rejestracji, pobrania i weryfikacji dokumentacji">
        <div className="v-dates-header">
          <div className="v-dates-title-group">
            <Calendar size={20} className="v-dates-header-icon" />
            <div>
              <h2 className="v-dates-title">Metryka czasowa dokumentacji i weryfikacji</h2>
              <p className="v-dates-subtitle">
                Wyraźne rozdzielenie daty sporządzenia ChPL, daty pobrania pliku źródłowego oraz ręcznej weryfikacji klinicznej.
              </p>
            </div>
          </div>
        </div>

        <div className="v-dates-cards-grid">
          {/* Data 1: Data rewizji tekstu ChPL (Pkt 10) */}
          <div className="v-date-card">
            <div className="v-date-card-top">
              <span className="v-date-icon-box blue">
                <Clock size={16} />
              </span>
              <span className="v-date-pill">Punkt 10 ChPL</span>
            </div>
            <span className="v-date-label">Data zatwierdzenia / rewizji tekstu ChPL</span>
            <span className="v-date-value">
              {currentVaccine.chplRevisionDate || 'Brak w dokumencie'}
            </span>
            <span className="v-date-desc">
              Data zmiany druków wg procedury wytwórcy / EMA (odrębna od daty publikacji portalu EMA oraz odnowienia pozwolenia).
            </span>
          </div>

          {/* Data 2: Data pobrania dokumentu źródłowego */}
          <div className="v-date-card">
            <div className="v-date-card-top">
              <span className="v-date-icon-box teal">
                <DownloadCloud size={16} />
              </span>
              <span className="v-date-pill">Źródło oficjalne</span>
            </div>
            <span className="v-date-label">Data pobrania dokumentu źródłowego</span>
            <span className="v-date-value">
              {currentVaccine.documentDownloadDate || 'Brak daty'}
            </span>
            <span className="v-date-desc">
              Pobrano z oficjalnego repozytorium wytwórcy (GSK Polska / EMA) do bazy referencyjnej VaxNurse.
            </span>
          </div>

          {/* Data 3: Data ręcznej weryfikacji przez personel */}
          <div className={`v-date-card ${currentVaccine.userVerificationDate ? 'verified' : 'pending'}`}>
            <div className="v-date-card-top">
              <span className={`v-date-icon-box ${currentVaccine.userVerificationDate ? 'green' : 'amber'}`}>
                <UserCheck size={16} />
              </span>
              <span className={`v-date-pill ${currentVaccine.userVerificationDate ? 'green' : 'amber'}`}>
                {currentVaccine.userVerificationDate ? 'Zweryfikowano' : 'Oczekuje na akcję'}
              </span>
            </div>
            <span className="v-date-label">Data ręcznej weryfikacji przez personel</span>
            <span className="v-date-value">
              {currentVaccine.userVerificationDate || 'Brak weryfikacji użytkownika'}
            </span>
            <span className="v-date-desc">
              {currentVaccine.userVerificationDate
                ? `Potwierdzono przez personel: ${currentVaccine.userVerificationNotes || 'Zgodność z drukiem ChPL'}`
                : 'Wymaga świadomego zatwierdzenia zgodności przez personel medyczny poniżej.'}
            </span>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* KROK 4: INTERAKTYWNY PANEL WERYFIKACJI                         */}
      {/* ============================================================== */}
      <section className={`v-verification-action-panel ${statusMeta.badgeClass}`} aria-label="Weryfikacja kliniczna karty preparatu">
        <div className="v-verif-panel-left">
          <div className="v-verif-icon-box">
            {currentVaccine.verificationStatus === 'verified_chpl' ? (
              <CheckCircle2 size={26} className="v-verif-icon verified" />
            ) : (
              <AlertTriangle size={26} className="v-verif-icon pending" />
            )}
          </div>
          <div className="v-verif-info">
            <div className="v-verif-status-row">
              <span className="v-verif-badge-label">Aktualny status weryfikacji:</span>
              <span className={`v-status-badge ${statusMeta.badgeClass}`}>
                <span className="v-status-dot"></span>
                {statusMeta.label}
              </span>
            </div>
            <h3 className="v-verif-headline">
              {currentVaccine.verificationStatus === 'verified_chpl'
                ? 'Karta preparatu została zweryfikowana z oficjalnym drukiem ChPL'
                : 'Karta preparatu oczekuje na weryfikację przez personel punktu szczepień'}
            </h3>
            <p className="v-verif-text">
              {currentVaccine.verificationStatus === 'verified_chpl'
                ? `Weryfikacja została zatwierdzona w systemie dnia ${currentVaccine.userVerificationDate}. Wszystkie punkty 1–10 odpowiadają aktualnej Charakterystyce Produktu Leczniczego (wersja: ${currentVaccine.chplRevisionDate}).`
                : hasUnresolvedDiscrepancies
                  ? 'UWAGA: Preparat posiada aktywną niezgodność wewnętrzną w druku ChPL (zawartość fenyloalaniny: 0,0289 µg w pkt 2 vs 0,0298 µg w pkt 4.4, status: requires_clarification). Zgodnie z zasadami rzetelności medycznej nadanie statusu „Zweryfikowany na podstawie ChPL” jest zablokowane do momentu urzędowego wyjaśnienia.'
                  : 'Aplikacja VaxNurse nie oznacza danych klinicznych jako automatycznie zweryfikowane. Aby zapewnić pełne bezpieczeństwo pacjentów, personel medyczny powinien porównać treść z oficjalnym drukiem ChPL i zatwierdzić zgodność.'}
            </p>
          </div>
        </div>

        <div className="v-verif-panel-actions">
          {currentVaccine.verificationStatus !== 'verified_chpl' ? (
            <>
              <button
                type="button"
                className={`btn-verif-approve ${hasUnresolvedDiscrepancies ? 'blocked' : ''}`}
                onClick={() => handleUpdateStatus('verified_chpl')}
                disabled={hasUnresolvedDiscrepancies}
                title={hasUnresolvedDiscrepancies
                  ? 'Zatwierdzenie zablokowane: preparat posiada nierozwiązane rozbieżności w oficjalnej ChPL (status: requires_clarification)'
                  : 'Zatwierdź weryfikację z drukiem ChPL'}
              >
                <CheckCircle2 size={16} />
                <span>Zatwierdź weryfikację z drukiem ChPL</span>
              </button>
              <button
                type="button"
                className="btn-verif-reject"
                onClick={() => handleUpdateStatus('requires_reverification')}
              >
                <AlertTriangle size={15} />
                <span>Wymaga ponownej weryfikacji</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn-verif-revoke"
              onClick={() => handleUpdateStatus('pending_verification')}
            >
              <RotateCcw size={15} />
              <span>Cofnij do stanu: Oczekuje na weryfikację</span>
            </button>
          )}
        </div>
      </section>

      {/* Mandatory Clinical Safety Banner */}
      <section className="v-detail-safety-alert" aria-label="Komunikat bezpieczeństwa">
        <div className="v-safety-icon-wrapper">
          <ShieldAlert size={24} className="v-safety-alert-icon" />
        </div>
        <div className="v-safety-content">
          <h2 className="v-safety-title">
            Struktura oficjalnej Charakterystyki Produktu Leczniczego (Punkty 1–10)
          </h2>
          <p className="v-safety-desc">
            Układ poniższej karty odwzorowuje europejski wzorzec <strong>EMA QRD Product Information Template (v10.4, 02/2024)</strong>.
            Zgodnie z zasadami rzetelności medycznej <strong>aplikacja VaxNurse nie generuje automatycznych dawek ani przeciwwskazań</strong>.
            Wszelkie decyzje kwalifikacyjne wymagają weryfikacji aktualnego druku ChPL w państwowym Rejestrze Produktów Leczniczych.
          </p>
          <div className="v-safety-links">
            <a
              href="https://rejestrymedyczne.ezdrowie.gov.pl/rpl/search/public"
              target="_blank"
              rel="noopener noreferrer"
              className="v-safety-link"
            >
              <span>Rejestr RPL eZdrowie (wyszukiwarka)</span>
              <ExternalLink size={13} />
            </a>
            <a
              href="https://leki.urpl.gov.pl/index.php"
              target="_blank"
              rel="noopener noreferrer"
              className="v-safety-link"
            >
              <span>URPL (źródło pomocnicze)</span>
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </section>

      {/* Accordion Controls Bar */}
      <div className="chpl-view-toolbar">
        <span className="toolbar-info-text">
          Układ oficjalny: <strong>10 głównych punktów ChPL</strong>
        </span>
        <div className="toolbar-buttons">
          <button type="button" className="btn-toolbar-toggle" onClick={expandAll}>
            Rozwiń wszystkie punkty
          </button>
          <button type="button" className="btn-toolbar-toggle" onClick={collapseAll}>
            Zwiń wszystkie punkty
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 10 GŁÓWNYCH PUNKTÓW CHPL (EMA QRD v10.4)                      */}
      {/* ============================================================== */}
      <div className="chpl-points-container">
        {/* PUNKT 1: Nazwa produktu leczniczego */}
        <section className="chpl-main-card" id="chpl-point-1">
          <header className="chpl-card-header" onClick={() => toggleSection('sec1')}>
            <div className="card-header-left">
              <span className="card-num-circle">1</span>
              <div>
                <h3 className="card-header-title">1. Nazwa produktu leczniczego</h3>
                <span className="card-header-subtitle">Name of the medicinal product</span>
              </div>
            </div>
            <button type="button" className="card-collapse-icon" aria-label="Zwiń / rozwiń punkt 1">
              {expandedSections.sec1 ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </header>
          {expandedSections.sec1 && (
            <div className="chpl-card-body">
              {renderSectionBox(chpl.name, <Info size={17} />)}
            </div>
          )}
        </section>

        {/* PUNKT 2: Skład jakościowy i ilościowy */}
        <section className="chpl-main-card" id="chpl-point-2">
          <header className="chpl-card-header" onClick={() => toggleSection('sec2')}>
            <div className="card-header-left">
              <span className="card-num-circle">2</span>
              <div>
                <h3 className="card-header-title">2. Skład jakościowy i ilościowy</h3>
                <span className="card-header-subtitle">Qualitative and quantitative composition</span>
              </div>
            </div>
            <button type="button" className="card-collapse-icon" aria-label="Zwiń / rozwiń punkt 2">
              {expandedSections.sec2 ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </header>
          {expandedSections.sec2 && (
            <div className="chpl-card-body">
              {renderSectionBox(chpl.composition, <Layers size={17} />)}
            </div>
          )}
        </section>

        {/* PUNKT 3: Postać farmaceutyczna */}
        <section className="chpl-main-card" id="chpl-point-3">
          <header className="chpl-card-header" onClick={() => toggleSection('sec3')}>
            <div className="card-header-left">
              <span className="card-num-circle">3</span>
              <div>
                <h3 className="card-header-title">3. Postać farmaceutyczna</h3>
                <span className="card-header-subtitle">Pharmaceutical form</span>
              </div>
            </div>
            <button type="button" className="card-collapse-icon" aria-label="Zwiń / rozwiń punkt 3">
              {expandedSections.sec3 ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </header>
          {expandedSections.sec3 && (
            <div className="chpl-card-body">
              {renderSectionBox(chpl.pharmaceuticalForm, <FileText size={17} />)}
            </div>
          )}
        </section>

        {/* PUNKT 4: Szczegółowe dane kliniczne (4.1 – 4.9) */}
        <section className="chpl-main-card clinical-highlight" id="chpl-point-4">
          <header className="chpl-card-header" onClick={() => toggleSection('sec4')}>
            <div className="card-header-left">
              <span className="card-num-circle highlight">4</span>
              <div>
                <h3 className="card-header-title">4. Szczegółowe dane kliniczne</h3>
                <span className="card-header-subtitle">Clinical particulars (podpunkty 4.1 – 4.9)</span>
              </div>
            </div>
            <button type="button" className="card-collapse-icon" aria-label="Zwiń / rozwiń punkt 4">
              {expandedSections.sec4 ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </header>
          {expandedSections.sec4 && (
            <div className="chpl-card-body">
              <div className="subsections-stack">
                {renderSectionBox(chpl.clinicalParticulars.indications, <Activity size={16} />, true)}
                {renderSectionBox(chpl.clinicalParticulars.dosageAndAdministration, <Clock size={16} />, true)}
                {renderSectionBox(chpl.clinicalParticulars.contraindications, <AlertTriangle size={16} />, true)}
                {renderSectionBox(chpl.clinicalParticulars.warningsAndPrecautions, <ShieldAlert size={16} />, true)}
                {renderSectionBox(chpl.clinicalParticulars.interactions, <FileCheck size={16} />, true)}
                {renderSectionBox(chpl.clinicalParticulars.fertilityPregnancyLactation, <Heart size={16} />, true)}
                {renderSectionBox(chpl.clinicalParticulars.driveAndMachines, <Activity size={16} />, true)}
                {renderSectionBox(chpl.clinicalParticulars.undesirableEffects, <AlertTriangle size={16} />, true)}
                {renderSectionBox(chpl.clinicalParticulars.overdose, <Info size={16} />, true)}
              </div>
            </div>
          )}
        </section>

        {/* PUNKT 5: Właściwości farmakologiczne (5.1 – 5.3) */}
        <section className="chpl-main-card" id="chpl-point-5">
          <header className="chpl-card-header" onClick={() => toggleSection('sec5')}>
            <div className="card-header-left">
              <span className="card-num-circle">5</span>
              <div>
                <h3 className="card-header-title">5. Właściwości farmakologiczne</h3>
                <span className="card-header-subtitle">Pharmacological properties (podpunkty 5.1 – 5.3)</span>
              </div>
            </div>
            <button type="button" className="card-collapse-icon" aria-label="Zwiń / rozwiń punkt 5">
              {expandedSections.sec5 ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </header>
          {expandedSections.sec5 && (
            <div className="chpl-card-body">
              <div className="subsections-stack">
                {renderSectionBox(chpl.pharmacologicalProperties.pharmacodynamics, <FlaskConical size={16} />, true)}
                {renderSectionBox(chpl.pharmacologicalProperties.pharmacokinetics, <Activity size={16} />, true)}
                {renderSectionBox(chpl.pharmacologicalProperties.preclinicalSafety, <ShieldAlert size={16} />, true)}
              </div>
            </div>
          )}
        </section>

        {/* PUNKT 6: Dane farmaceutyczne (6.1 – 6.6) */}
        <section className="chpl-main-card" id="chpl-point-6">
          <header className="chpl-card-header" onClick={() => toggleSection('sec6')}>
            <div className="card-header-left">
              <span className="card-num-circle">6</span>
              <div>
                <h3 className="card-header-title">6. Dane farmaceutyczne</h3>
                <span className="card-header-subtitle">Pharmaceutical particulars (podpunkty 6.1 – 6.6)</span>
              </div>
            </div>
            <button type="button" className="card-collapse-icon" aria-label="Zwiń / rozwiń punkt 6">
              {expandedSections.sec6 ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </header>
          {expandedSections.sec6 && (
            <div className="chpl-card-body">
              <div className="subsections-stack">
                {renderSectionBox(chpl.pharmaceuticalParticulars.excipients, <Layers size={16} />, true)}
                {renderSectionBox(chpl.pharmaceuticalParticulars.incompatibilities, <AlertTriangle size={16} />, true)}
                {renderSectionBox(chpl.pharmaceuticalParticulars.shelfLife, <Calendar size={16} />, true)}
                {renderSectionBox(chpl.pharmaceuticalParticulars.storageSpecialPrecautions, <ThermometerSnowflake size={16} />, true)}
                {renderSectionBox(chpl.pharmaceuticalParticulars.containerNatureAndContents, <Package size={16} />, true)}
                {renderSectionBox(chpl.pharmaceuticalParticulars.disposalAndHandling, <FileText size={16} />, true)}
              </div>
            </div>
          )}
        </section>

        {/* PUNKT 7: Podmiot odpowiedzialny */}
        <section className="chpl-main-card" id="chpl-point-7">
          <header className="chpl-card-header" onClick={() => toggleSection('sec7')}>
            <div className="card-header-left">
              <span className="card-num-circle">7</span>
              <div>
                <h3 className="card-header-title">7. Podmiot odpowiedzialny posiadający pozwolenie na dopuszczenie do obrotu</h3>
                <span className="card-header-subtitle">Marketing authorisation holder</span>
              </div>
            </div>
            <button type="button" className="card-collapse-icon" aria-label="Zwiń / rozwiń punkt 7">
              {expandedSections.sec7 ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </header>
          {expandedSections.sec7 && (
            <div className="chpl-card-body">
              {renderSectionBox(chpl.marketingAuthorisationHolder, <Building2 size={17} />)}
            </div>
          )}
        </section>

        {/* PUNKT 8: Numer(-y) pozwolenia */}
        <section className="chpl-main-card" id="chpl-point-8">
          <header className="chpl-card-header" onClick={() => toggleSection('sec8')}>
            <div className="card-header-left">
              <span className="card-num-circle">8</span>
              <div>
                <h3 className="card-header-title">8. Numer(-y) pozwolenia na dopuszczenie do obrotu</h3>
                <span className="card-header-subtitle">Marketing authorisation number(s)</span>
              </div>
            </div>
            <button type="button" className="card-collapse-icon" aria-label="Zwiń / rozwiń punkt 8">
              {expandedSections.sec8 ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </header>
          {expandedSections.sec8 && (
            <div className="chpl-card-body">
              {renderSectionBox(chpl.marketingAuthorisationNumber, <FileCheck size={17} />)}
            </div>
          )}
        </section>

        {/* PUNKT 9: Data pierwszego pozwolenia / przedłużenia */}
        <section className="chpl-main-card" id="chpl-point-9">
          <header className="chpl-card-header" onClick={() => toggleSection('sec9')}>
            <div className="card-header-left">
              <span className="card-num-circle">9</span>
              <div>
                <h3 className="card-header-title">9. Data wydania pierwszego pozwolenia i data przedłużenia pozwolenia</h3>
                <span className="card-header-subtitle">Date of first authorisation / renewal of the authorisation</span>
              </div>
            </div>
            <button type="button" className="card-collapse-icon" aria-label="Zwiń / rozwiń punkt 9">
              {expandedSections.sec9 ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </header>
          {expandedSections.sec9 && (
            <div className="chpl-card-body">
              {renderSectionBox(chpl.firstAuthorisationAndRenewal, <Calendar size={17} />)}
            </div>
          )}
        </section>

        {/* PUNKT 10: Data zatwierdzenia tekstu lub jego zmiany */}
        <section className="chpl-main-card" id="chpl-point-10">
          <header className="chpl-card-header" onClick={() => toggleSection('sec10')}>
            <div className="card-header-left">
              <span className="card-num-circle">10</span>
              <div>
                <h3 className="card-header-title">10. Data zatwierdzenia lub częściowej zmiany tekstu ChPL</h3>
                <span className="card-header-subtitle">Date of revision of the text</span>
              </div>
            </div>
            <button type="button" className="card-collapse-icon" aria-label="Zwiń / rozwiń punkt 10">
              {expandedSections.sec10 ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </header>
          {expandedSections.sec10 && (
            <div className="chpl-card-body">
              {renderSectionBox(chpl.revisionDate, <Clock size={17} />)}
            </div>
          )}
        </section>

        {/* OPCJONALNA SEKCJA: Punkty 11 i 12 EMA QRD (Radiofarmaceutyki) */}
        <section className="chpl-main-card optional-card" id="chpl-point-optional">
          <header className="chpl-card-header" onClick={() => toggleSection('secOptional')}>
            <div className="card-header-left">
              <span className="card-num-circle muted">11-12</span>
              <div>
                <h3 className="card-header-title">Punkty 11 i 12 szablonu EMA QRD (Opcjonalne)</h3>
                <span className="card-header-subtitle">Dawkometria i instrukcje dla radiofarmaceutyków</span>
              </div>
            </div>
            <button type="button" className="card-collapse-icon" aria-label="Zwiń / rozwiń informację o punktach 11 i 12">
              {expandedSections.secOptional ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </header>
          {expandedSections.secOptional && (
            <div className="chpl-card-body">
              <div className="chpl-optional-notice">
                <Info size={18} className="optional-info-icon" />
                <p>
                  Zgodnie z oficjalnym szablonem <strong>EMA QRD Product Information Template v10.4</strong>, punkty 11 (Dosimetry) oraz 12 (Instructions for preparation of radiopharmaceuticals) dotyczą wyłącznie preparatów radiofarmaceutycznych. 
                  Dla szczepionek i standardowych produktów leczniczych stosowanych w punkcie szczepień punkty te <strong>nie mają zastosowania i nie wchodzą w zakres druku ChPL</strong>.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Footer Navigation Back */}
      <div className="module-view-footer">
        <p className="footer-status-note">
          Karta ChPL (punkty 1–10, szablon EMA QRD v10.4) – status weryfikacji dokumentacji: {statusMeta.label}.
        </p>
        <button
          type="button"
          className="btn-primary-dashboard"
          onClick={onBackToList}
        >
          Powrót do Bazy preparatów
        </button>
      </div>
    </div>
  );
};
