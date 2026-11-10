import React from 'react';
import {
  ExternalLink,
  Building2,
  FileText,
  FileCheck,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import type { VaccineProduct } from '../../types/vaccines';
import {
  VERIFICATION_STATUS_META,
  VACCINE_TYPE_LABELS,
  TARGET_GROUP_LABELS
} from '../../data/vaccinesCatalog';

interface VaccineCardProps {
  vaccine: VaccineProduct;
  onOpenDetails: (vaccine: VaccineProduct) => void;
}

export const VaccineCard: React.FC<VaccineCardProps> = ({ vaccine, onOpenDetails }) => {
  const statusMeta = VERIFICATION_STATUS_META[vaccine.verificationStatus];

  return (
    <article className="vaccine-card" aria-labelledby={`vaccine-${vaccine.id}`}>
      {/* Top Header */}
      <div className="v-card-top">
        <div className="v-card-badges">
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
        </div>

        {vaccine.atcCode && (
          <span className="v-atc-pill" title="Kod klasyfikacji anatomiczno-terapeutyczno-chemicznej">
            ATC: {vaccine.atcCode}
          </span>
        )}
      </div>

      {/* Main Details */}
      <div className="v-card-main">
        <h3 id={`vaccine-${vaccine.id}`} className="v-card-title">
          {vaccine.tradeName}
        </h3>

        <div className="v-card-active-substance">
          <span className="v-substance-label">Substancja czynna / antygeny:</span>
          <p className="v-substance-text">{vaccine.activeSubstance}</p>
        </div>

        <div className="v-card-meta-row">
          <div className="v-meta-item">
            <Building2 size={14} className="v-meta-icon" />
            <span className="v-meta-label">Podmiot:</span>
            <span className="v-meta-value">{vaccine.manufacturer}</span>
          </div>

          <div className="v-meta-item">
            <FileText size={14} className="v-meta-icon" />
            <span className="v-meta-label">Postać:</span>
            <span className="v-meta-value">{vaccine.pharmaceuticalForm}</span>
          </div>

          {vaccine.marketingAuthorizationNumber && (
            <div className="v-meta-item">
              <FileCheck size={14} className="v-meta-icon" />
              <span className="v-meta-label">Nr pozwolenia:</span>
              <span className="v-meta-value">{vaccine.marketingAuthorizationNumber}</span>
            </div>
          )}
        </div>
      </div>

      {/* Verification & Safety Notice */}
      {!statusMeta.isVerified && (
        <div className="v-card-unverified-warning">
          <AlertTriangle size={15} className="warning-icon" />
          <span>
            <strong>Brak zweryfikowanej dokumentacji ChPL:</strong> Treści medyczne nie zostały jeszcze potwierdzone z drukiem ChPL. Weryfikuj w RPL.
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="v-card-footer">
        <button
          type="button"
          className="btn-open-vaccine-details"
          onClick={() => onOpenDetails(vaccine)}
          aria-label={`Otwórz Kartę ChPL dla ${vaccine.tradeName}`}
        >
          <span>Karta ChPL (punkty 1–10)</span>
          <ChevronRight size={16} />
        </button>

        <div className="v-external-links">
          {vaccine.rplRecordUrl && (
            <a
              href={vaccine.rplRecordUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="v-link-rpl"
              title="Wyszukaj rekord w oficjalnym Rejestrze Produktów Leczniczych eZdrowie"
            >
              <span>Rekord w RPL</span>
              <ExternalLink size={13} />
            </a>
          )}

          {vaccine.currentChplUrl && (
            <a
              href={vaccine.currentChplUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="v-link-chpl"
              title="Otwórz oficjalną Charakterystykę Produktu Leczniczego"
            >
              <span>Aktualna ChPL</span>
              <ExternalLink size={13} />
            </a>
          )}
        </div>
      </div>
    </article>
  );
};
