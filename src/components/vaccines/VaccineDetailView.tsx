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
  Calendar
} from 'lucide-react';
import type { VaccineProduct, ChPLSection } from '../../types/vaccines';
import {
  VERIFICATION_STATUS_META,
  VACCINE_TYPE_LABELS,
  TARGET_GROUP_LABELS
} from '../../data/vaccinesCatalog';

interface VaccineDetailViewProps {
  vaccine: VaccineProduct;
  onBackToList: () => void;
}

export const VaccineDetailView: React.FC<VaccineDetailViewProps> = ({
  vaccine,
  onBackToList
}) => {
  const statusMeta = VERIFICATION_STATUS_META[vaccine.verificationStatus];

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

  // Helper render for single section or subsection
  const renderSectionBox = (sec: ChPLSection, icon: React.ReactNode, isSub: boolean = false) => {
    const secStatus = VERIFICATION_STATUS_META[sec.verificationStatus];

    return (
      <div key={sec.sectionNumber} className={`chpl-point-box ${isSub ? 'subsection' : ''}`}>
        <div className="point-box-header">
          <div className="point-box-title-group">
            <span className="point-icon-wrapper">{icon}</span>
            <div>
              <span className="point-number-tag">Punkt {sec.sectionNumber} ChPL</span>
              <h4 className="point-title-text">{sec.sectionTitle}</h4>
            </div>
          </div>

          <div className="point-box-meta-badges">
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
          {sec.content ? (
            <div className="point-content-present">
              <p className="point-text">{sec.content}</p>
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
                    href={vaccine.currentChplUrl || 'https://rejestrymedyczne.ezdrowie.gov.pl/rpl/search/public'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-verify-in-rpl"
                  >
                    <span>Weryfikuj w oficjalnym rekordzie RPL</span>
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

  const { chpl } = vaccine;

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
              {VACCINE_TYPE_LABELS[vaccine.vaccineType]}
            </span>
            <span className="v-target-badge">
              {TARGET_GROUP_LABELS[vaccine.targetGroup]}
            </span>
            {vaccine.atcCode && (
              <span className="v-atc-pill">Kod ATC: {vaccine.atcCode} (Pkt 5.1)</span>
            )}
          </div>

          <div className="v-detail-quick-actions">
            {vaccine.rplRecordUrl && (
              <a
                href={vaccine.rplRecordUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-rpl-official"
              >
                <span>Rekord w RPL</span>
                <ExternalLink size={15} />
              </a>
            )}
            {vaccine.currentChplUrl && (
              <a
                href={vaccine.currentChplUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-chpl-official"
              >
                <span>Aktualna ChPL</span>
                <ExternalLink size={15} />
              </a>
            )}
          </div>
        </div>

        <div className="v-detail-header-body">
          <h1 className="v-detail-title">{vaccine.tradeName}</h1>
          <p className="v-detail-substance">
            <strong>Substancja czynna (Pkt 2 ChPL):</strong> {vaccine.activeSubstance}
          </p>

          <div className="v-detail-specs-grid">
            <div className="v-spec-item">
              <span className="v-spec-label">Podmiot odpowiedzialny (Pkt 7):</span>
              <span className="v-spec-value">{vaccine.manufacturer}</span>
            </div>
            <div className="v-spec-item">
              <span className="v-spec-label">Postać farmaceutyczna (Pkt 3):</span>
              <span className="v-spec-value">{vaccine.pharmaceuticalForm}</span>
            </div>
            <div className="v-spec-item">
              <span className="v-spec-label">Numer pozwolenia (Pkt 8):</span>
              <span className="v-spec-value">{vaccine.marketingAuthorizationNumber || 'Brak danych w bazie'}</span>
            </div>
            <div className="v-spec-item">
              <span className="v-spec-label">Standard struktury:</span>
              <span className="v-spec-value highlight-ema">EMA QRD v10.4 (Punkty 1–10)</span>
            </div>
          </div>
        </div>
      </div>

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
              <span>Rejestr RPL eZdrowie (główne źródło)</span>
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
