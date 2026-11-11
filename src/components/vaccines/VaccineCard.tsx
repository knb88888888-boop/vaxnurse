import React from 'react';
import {
  ExternalLink,
  Building2,
  FileText,
  FileCheck,
  ChevronRight,
  AlertTriangle,
  Clock,
  Search
} from 'lucide-react';
import type { VaccineProduct } from '../../types/vaccines';
import {
  VERIFICATION_STATUS_META,
  DISCREPANCY_STATUS_META,
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
          {vaccine.sourceDiscrepancies && vaccine.sourceDiscrepancies.length > 0 && (
            <span className="v-card-disc-pill" title="Wykryto niezgodność wewnętrzną w druku ChPL (status: Wymaga wyjaśnienia)">
              <AlertTriangle size={12} />
              <span>Niezgodność w ChPL: {DISCREPANCY_STATUS_META[vaccine.sourceDiscrepancies[0].status]?.label || 'Wymaga wyjaśnienia'}</span>
            </span>
          )}
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

          {vaccine.chplRevisionDate && (
            <div className="v-meta-item">
              <Clock size={14} className="v-meta-icon" />
              <span className="v-meta-label">Rewizja ChPL (Pkt 10):</span>
              <span className="v-meta-value">{vaccine.chplRevisionDate}</span>
            </div>
          )}
        </div>
      </div>

      {/* Verification & Safety Notice */}
      {vaccine.sourceDiscrepancies && vaccine.sourceDiscrepancies.length > 0 ? (
        vaccine.sourceDiscrepancies[0].status === 'resolved_with_official_document' ? (
          !statusMeta.isVerified && (
            <div className="v-card-unverified-warning discrepancy">
              <AlertTriangle size={15} className="warning-icon disc-icon" />
              <span>
                <strong>Niezgodność w ChPL (status: {DISCREPANCY_STATUS_META[vaccine.sourceDiscrepancies[0].status]?.label || 'Wyjaśniona'}):</strong> Rozbieżność fenyloalaniny została wyjaśniona i skontrolowana. Karta ma status «Gotowy do ręcznej weryfikacji» i oczekuje na końcowe zatwierdzenie całej ChPL.
              </span>
            </div>
          )
        ) : (
          <div className="v-card-unverified-warning discrepancy">
            <AlertTriangle size={15} className="warning-icon disc-icon" />
            <span>
              <strong>Niezgodność w ChPL (status: {DISCREPANCY_STATUS_META[vaccine.sourceDiscrepancies[0].status]?.label || 'Wymaga wyjaśnienia'}):</strong> Rozbieżność w ilości fenyloalaniny (0,0289 µg w pkt 2 vs 0,0298 µg w pkt 4.4). Zatwierdzenie zablokowane do czasu rejestracji i ręcznej kontroli dokumentu urzędowego.
            </span>
          </div>
        )
      ) : !statusMeta.isVerified && !vaccine.importedVerificationClaim && (
        <div className="v-card-unverified-warning">
          <AlertTriangle size={15} className="warning-icon" />
          <span>
            <strong>Oczekuje na weryfikację personelu:</strong> Treści punktów 1–10 odwzorowano z oficjalnego druku ChPL (wersja {vaccine.chplRevisionDate || 'do weryfikacji'}).
          </span>
        </div>
      )}

      {vaccine.importedVerificationClaim && (
        <div className="v-card-import-claim-notice" role="status">
          <AlertTriangle size={15} className="claim-notice-icon" />
          <span>
            <strong>Deklaracja z importu JSON vs status lokalny:</strong>{' '}
            Plik kopii deklarował status «
            {new Map<string, { label: string }>(
              Object.entries(VERIFICATION_STATUS_META)
            ).get(vaccine.importedVerificationClaim.claimedStatus)?.label ||
              vaccine.importedVerificationClaim.claimedStatus}
            »
            {vaccine.importedVerificationClaim.declaredAt
              ? ` (${vaccine.importedVerificationClaim.declaredAt})`
              : ''}
            , lecz obecny status lokalny to «{statusMeta.label}». Wymaga ręcznej weryfikacji na tym stanowisku.
          </span>
        </div>
      )}

      {vaccine.mergeConflict && (
        <div className="v-card-conflict-notice" role="status">
          <AlertTriangle size={15} className="conflict-notice-icon" />
          <span>
            <strong>Wykryto konflikt wersji katalogu:</strong> {vaccine.mergeConflict.summary}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="v-card-footer">
        <button
          type="button"
          className="btn-open-vaccine-details"
          onClick={() => onOpenDetails(vaccine)}
        >
          <span>
            Otwórz Kartę ChPL{' '}
            <span className="sr-only">{`dla ${vaccine.tradeName} (punkty 1–10)`}</span>
          </span>
          <ChevronRight size={16} aria-hidden="true" />
        </button>

        <div className="v-external-links">
          {vaccine.rplRecordUrl ? (
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
          ) : (
            <a
              href="https://rejestrymedyczne.ezdrowie.gov.pl/rpl/search/public"
              target="_blank"
              rel="noopener noreferrer"
              className="v-link-rpl v-link-rpl-search"
              title="Brak trwałego permalinka w RPL dla procedury centralnej – kliknij, aby otworzyć wyszukiwarkę RPL"
            >
              <Search size={12} />
              <span>Szukaj w RPL</span>
              <ExternalLink size={12} />
            </a>
          )}

          {vaccine.currentChplUrl && (
            <a
              href={vaccine.currentChplUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="v-link-chpl"
              title="Otwórz oficjalną Charakterystykę Produktu Leczniczego (PDF)"
            >
              <span>Oficjalna ChPL (PDF)</span>
              <ExternalLink size={13} />
            </a>
          )}
        </div>
      </div>
    </article>
  );
};
