import React from 'react';
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
  Info
} from 'lucide-react';
import type { VaccineProduct, ChPLSectionReference } from '../../types/vaccines';
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

  // Helper render for ChPL sections
  const renderChPLSection = (
    sectionNumber: string,
    sectionName: string,
    sectionData: ChPLSectionReference,
    icon: React.ReactNode
  ) => {
    return (
      <div className="v-detail-section-card" id={`chpl-sec-${sectionNumber}`}>
        <div className="v-detail-sec-header">
          <div className="v-sec-title-box">
            <span className="v-sec-icon-box">{icon}</span>
            <div>
              <span className="v-sec-chpl-ref">Punkt {sectionData.sectionNumber} ChPL</span>
              <h3 className="v-sec-heading">{sectionName}</h3>
            </div>
          </div>
          <div className="v-sec-meta-badges">
            <span className="v-source-pill">
              Źródło: {sectionData.officialSource || 'Rejestr RPL (ChPL)'}
            </span>
            <span className={`v-sec-status-pill ${sectionData.isVerified ? 'verified' : 'unverified'}`}>
              {sectionData.isVerified ? 'Zweryfikowano z ChPL' : 'Treść niezweryfikowana'}
            </span>
          </div>
        </div>

        <div className="v-detail-sec-body">
          {sectionData.content ? (
            <div className="v-sec-content-text">{sectionData.content}</div>
          ) : (
            <div className="v-empty-clinical-section">
              <div className="v-empty-icon-col">
                <AlertTriangle size={18} className="v-empty-alert-icon" />
              </div>
              <div className="v-empty-text-col">
                <strong>Treść kliniczna punktu {sectionData.sectionNumber} oczekuje na weryfikację</strong>
                <p>
                  Zgodnie z procedurą bezpieczeństwa VaxNurse, treść tego punktu nie została jeszcze potwierdzona z aktualnym drukiem ChPL. 
                  Przed podaniem leku lub kwalifikacją pacjenta zweryfikuj treść bezpośrednio w oficjalnym rejestrze RPL.
                </p>
                <div className="v-empty-links-row">
                  <a
                    href={vaccine.currentChplUrl || 'https://rejestrymedyczne.ezdrowie.gov.pl/rpl/search/public'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="v-link-verify-chpl"
                  >
                    <span>Otwórz oficjalny rekord w RPL</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="vaccine-detail-container">
      {/* Back button */}
      <div className="module-view-nav">
        <button
          type="button"
          className="back-to-dashboard-btn"
          onClick={onBackToList}
        >
          <ArrowLeft size={16} />
          <span>Powrót do Bazy preparatów</span>
        </button>
        <span className="view-mode-pill">Karta preparatu (13 sekcji ChPL)</span>
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
              <span className="v-atc-pill">Kod ATC: {vaccine.atcCode}</span>
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
                <span>Otwórz rekord w RPL</span>
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
            <strong>Substancja czynna / antygeny:</strong> {vaccine.activeSubstance}
          </p>

          <div className="v-detail-specs-grid">
            <div className="v-spec-item">
              <span className="v-spec-label">Podmiot odpowiedzialny:</span>
              <span className="v-spec-value">{vaccine.manufacturer}</span>
            </div>
            <div className="v-spec-item">
              <span className="v-spec-label">Postać farmaceutyczna:</span>
              <span className="v-spec-value">{vaccine.pharmaceuticalForm}</span>
            </div>
            <div className="v-spec-item">
              <span className="v-spec-label">Pozwolenie na dopuszczenie:</span>
              <span className="v-spec-value">{vaccine.marketingAuthorizationNumber || 'Brak danych'}</span>
            </div>
            <div className="v-spec-item">
              <span className="v-spec-label">Data weryfikacji rekordu:</span>
              <span className="v-spec-value">{vaccine.lastVerifiedDate || 'Niezweryfikowany'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mandatory Safety Reassurance Banner */}
      <section className="v-detail-safety-alert" aria-label="Komunikat bezpieczeństwa">
        <div className="v-safety-icon-wrapper">
          <ShieldAlert size={24} className="v-safety-alert-icon" />
        </div>
        <div className="v-safety-content">
          <h2 className="v-safety-title">
            Status weryfikacji dokumentacji: {statusMeta.label}
          </h2>
          <p className="v-safety-desc">
            Aplikacja VaxNurse <strong>nie zawiera domyślnych ani wygenerowanych przez AI dawek, schematów ani przeciwwskazań</strong>. 
            Struktura poniższej karty została przygotowana według oficjalnego standardu 13 punktów ChPL.
            Przed użyciem preparatu należy bezwzględnie potwierdzić aktualne brzmienie Charakterystyki w państwowym Rejestrze Produktów Leczniczych (RPL).
          </p>
          <div className="v-safety-links">
            <a
              href="https://rejestrymedyczne.ezdrowie.gov.pl/rpl/search/public"
              target="_blank"
              rel="noopener noreferrer"
              className="v-safety-link"
            >
              <span>Główne źródło: Rejestr RPL (eZdrowie)</span>
              <ExternalLink size={13} />
            </a>
            <a
              href="https://leki.urpl.gov.pl/index.php"
              target="_blank"
              rel="noopener noreferrer"
              className="v-safety-link"
            >
              <span>Źródło pomocnicze: Urząd Rejestracji Leków (URPL)</span>
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </section>

      {/* 13 Structured ChPL Sections Grid */}
      <div className="v-sections-list">
        {/* 1. Informacje podstawowe */}
        <div className="v-detail-section-card" id="chpl-sec-1">
          <div className="v-detail-sec-header">
            <div className="v-sec-title-box">
              <span className="v-sec-icon-box"><Info size={18} /></span>
              <div>
                <span className="v-sec-chpl-ref">Sekcja 1</span>
                <h3 className="v-sec-heading">1. Informacje podstawowe i techniczne</h3>
              </div>
            </div>
            <div className="v-sec-meta-badges">
              <span className="v-source-pill">Rejestr RPL</span>
              <span className="v-sec-status-pill unverified">Struktura robocza</span>
            </div>
          </div>
          <div className="v-detail-sec-body">
            <div className="v-basic-info-grid">
              <div className="v-basic-box">
                <span className="v-basic-lbl">Nazwa handlowa:</span>
                <strong className="v-basic-val">{vaccine.tradeName}</strong>
              </div>
              <div className="v-basic-box">
                <span className="v-basic-lbl">Klasyfikacja ATC:</span>
                <strong className="v-basic-val">{vaccine.atcCode || 'Do weryfikacji'}</strong>
              </div>
              <div className="v-basic-box">
                <span className="v-basic-lbl">Informacje o opakowaniu:</span>
                <span className="v-basic-val text-muted">
                  {vaccine.sections.basicInfo.packagingInfo || 'Wymaga weryfikacji z drukiem ChPL / RPL'}
                </span>
              </div>
              <div className="v-basic-box">
                <span className="v-basic-lbl">Rozpuszczalnik / igły:</span>
                <span className="v-basic-val text-muted">
                  {vaccine.sections.basicInfo.solventInfo || 'Do potwierdzenia w pkt 6.5 i 6.6 ChPL'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Skład jakościowy i ilościowy */}
        {renderChPLSection(
          '2',
          '2. Skład jakościowy i ilościowy',
          vaccine.sections.qualitativeComposition,
          <Layers size={18} />
        )}

        {/* 3. Postać farmaceutyczna */}
        {renderChPLSection(
          '3',
          '3. Postać farmaceutyczna',
          vaccine.sections.pharmaceuticalFormDetails,
          <FileText size={18} />
        )}

        {/* 4. Wskazania do stosowania */}
        {renderChPLSection(
          '4.1',
          '4. Wskazania do stosowania',
          vaccine.sections.indications,
          <Activity size={18} />
        )}

        {/* 5. Dawkowanie i sposób podawania */}
        {renderChPLSection(
          '4.2',
          '5. Dawkowanie i sposób podawania',
          vaccine.sections.dosageAndAdministration,
          <Clock size={18} />
        )}

        {/* 6. Przeciwwskazania */}
        {renderChPLSection(
          '4.3',
          '6. Przeciwwskazania',
          vaccine.sections.contraindications,
          <AlertTriangle size={18} />
        )}

        {/* 7. Ostrzeżenia i środki ostrożności */}
        {renderChPLSection(
          '4.4',
          '7. Ostrzeżenia i środki ostrożności',
          vaccine.sections.warningsAndPrecautions,
          <ShieldAlert size={18} />
        )}

        {/* 8. Interakcje */}
        {renderChPLSection(
          '4.5',
          '8. Interakcje z innymi produktami leczniczymi',
          vaccine.sections.interactions,
          <FileCheck size={18} />
        )}

        {/* 9. Ciąża i karmienie piersią */}
        {renderChPLSection(
          '4.6',
          '9. Stosowanie w ciąży i podczas karmienia piersią',
          vaccine.sections.pregnancyAndLactation,
          <Heart size={18} />
        )}

        {/* 10. Działania niepożądane */}
        {renderChPLSection(
          '4.8',
          '10. Działania niepożądane',
          vaccine.sections.adverseEffects,
          <AlertTriangle size={18} />
        )}

        {/* 11. Warunki przechowywania */}
        {renderChPLSection(
          '6.4',
          '11. Warunki przechowywania (Łańcuch chłodniczy)',
          vaccine.sections.storageConditions,
          <ThermometerSnowflake size={18} />
        )}

        {/* 12. Podmiot odpowiedzialny */}
        {renderChPLSection(
          '7',
          '12. Podmiot odpowiedzialny',
          vaccine.sections.marketingAuthorizationHolder,
          <Building2 size={18} />
        )}

        {/* 13. Dokumentacja i historia wersji ChPL */}
        <div className="v-detail-section-card" id="chpl-sec-13">
          <div className="v-detail-sec-header">
            <div className="v-sec-title-box">
              <span className="v-sec-icon-box"><FileCheck size={18} /></span>
              <div>
                <span className="v-sec-chpl-ref">Sekcja 13</span>
                <h3 className="v-sec-heading">13. Dokumentacja i historia wersji ChPL</h3>
              </div>
            </div>
            <div className="v-sec-meta-badges">
              <span className="v-source-pill">Metadane urzędowe</span>
              <span className="v-sec-status-pill unverified">Do weryfikacji</span>
            </div>
          </div>
          <div className="v-detail-sec-body">
            <div className="v-basic-info-grid">
              <div className="v-basic-box">
                <span className="v-basic-lbl">Rejestr państwowy:</span>
                <strong className="v-basic-val">{vaccine.sections.documentationHistory.registrySource}</strong>
              </div>
              <div className="v-basic-box">
                <span className="v-basic-lbl">Data ostatniej rewizji:</span>
                <span className="v-basic-val text-muted">
                  {vaccine.chplVersionDate || 'Wymaga sprawdzenia w metadanych RPL'}
                </span>
              </div>
              <div className="v-basic-box full-span">
                <span className="v-basic-lbl">Uwagi techniczne rejestru:</span>
                <p className="v-basic-val text-muted">
                  {vaccine.sections.documentationHistory.notes || 'Brak uwag.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Navigation Back */}
      <div className="module-view-footer">
        <p className="footer-status-note">
          Karta preparatu w strukturze 13 sekcji ChPL (VaxNurse) – status: {statusMeta.label}.
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
