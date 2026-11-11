import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  FileWarning,
  Filter,
  Globe2,
  Hash,
  Search,
  ShieldAlert,
  XCircle
} from 'lucide-react';
import type { SourceRegistryEntry, SourceVerificationStatus } from '../../types/evidenceLedger';
import {
  ALLOWED_SOURCE_VERIFICATION_STATUSES,
  getProductScopeLabel
} from '../../utils/chplEvidenceLedger';

interface WorkbenchSourceRegistryPanelProps {
  sources: SourceRegistryEntry[];
  activeDocumentFilterId: string;
  onSelectDocumentForEvidence: (documentId: string) => void;
}

function getSourceBadgeTone(status: SourceVerificationStatus): 'info' | 'warning' | 'danger' | 'neutral' {
  switch (status) {
    case 'official_source_confirmed':
      return 'info';
    case 'official_source_unavailable':
    case 'document_version_uncertain':
    case 'metadata_mismatch':
      return 'danger';
    case 'requires_manual_review':
      return 'warning';
    case 'not_checked':
      return 'neutral';
  }
}

export const WorkbenchSourceRegistryPanel: React.FC<WorkbenchSourceRegistryPanelProps> = React.memo(({
  sources,
  activeDocumentFilterId,
  onSelectDocumentForEvidence
}) => {
  const [statusFilter, setStatusFilter] = useState<SourceVerificationStatus | 'all'>('all');
  const [languageFilter, setLanguageFilter] = useState<'all' | 'PL' | 'EN'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredSources = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return sources.filter((src) => {
      if (statusFilter !== 'all' && src.sourceVerificationStatus !== statusFilter) {
        return false;
      }
      if (languageFilter !== 'all' && src.language !== languageFilter) {
        return false;
      }
      if (q) {
        const hay = [
          src.documentId,
          src.documentTitle,
          src.productDisplayName,
          src.authority,
          src.rplIdOrRegistryNumber ?? '',
          src.marketingAuthorizationNumber ?? '',
          src.marketingAuthorizationHolder ?? '',
          src.sha256 ?? ''
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [sources, statusFilter, languageFilter, searchQuery]);

  const confirmedCount = sources.filter(
    (s) => s.sourceVerificationStatus === 'official_source_confirmed'
  ).length;
  const unavailableOrWarningCount = sources.filter(
    (s) => s.sourceVerificationStatus !== 'official_source_confirmed'
  ).length;

  return (
    <section
      className="wb-details-section wb-b2-panel"
      aria-labelledby="wb-source-registry-heading"
      data-testid="b2-source-registry-panel"
    >
      <div className="wb-section-heading-row">
        <div>
          <h2 id="wb-source-registry-heading" className="wb-section-heading">
            Sekcja E — Rejestr Dokumentów Źródłowych (Etap B2)
          </h2>
          <p className="wb-section-subheading">
            Rozróżnienie statusu pochodzenia dokumentu od weryfikacji klinicznej treści: zapisany skrót SHA-256 i
            adres URL potwierdzają źródło pliku, nigdy nie zastępują decyzji audytora ani nie stanowią
            klinicznego zatwierdzenia karty ChPL czy procedury PSO.
          </p>
        </div>
        <div className="wb-b2-counters" role="group" aria-label="Podsumowanie statusów rejestru źródeł">
          <span className="wb-b2-stat-chip wb-b2-chip-info">
            <CheckCircle2 size={14} aria-hidden="true" />
            <span>Potwierdzone pochodzenie: {confirmedCount}</span>
          </span>
          <span className="wb-b2-stat-chip wb-b2-chip-warning">
            <ShieldAlert size={14} aria-hidden="true" />
            <span>Niedostępne / historyczne / do przeglądu: {unavailableOrWarningCount}</span>
          </span>
        </div>
      </div>

      <div className="wb-b2-filter-bar">
        <div className="wb-filter-group">
          <label htmlFor="b2-src-search" className="wb-filter-label">
            Szukaj dokumentu / ID / SHA-256 / podmiotu
          </label>
          <div className="wb-search-input-wrap">
            <Search size={15} className="wb-search-icon" aria-hidden="true" />
            <input
              id="b2-src-search"
              type="text"
              className="wb-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Np. Spikevax, 19535, EU/1/20, bd1ba2..."
            />
          </div>
        </div>

        <div className="wb-filter-group">
          <label htmlFor="b2-src-status" className="wb-filter-label">
            Status pochodzenia źródła
          </label>
          <select
            id="b2-src-status"
            className="wb-select-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as SourceVerificationStatus | 'all')}
          >
            <option value="all">Wszystkie statusy ({sources.length})</option>
            {ALLOWED_SOURCE_VERIFICATION_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        <div className="wb-filter-group">
          <label htmlFor="b2-src-lang" className="wb-filter-label">
            Język dokumentu
          </label>
          <select
            id="b2-src-lang"
            className="wb-select-input"
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value as 'all' | 'PL' | 'EN')}
          >
            <option value="all">PL oraz EN</option>
            <option value="PL">Wyłącznie PL</option>
            <option value="EN">Wyłącznie EN</option>
          </select>
        </div>
      </div>

      <div className="wb-b2-source-grid">
        {filteredSources.map((src) => {
          const tone = getSourceBadgeTone(src.sourceVerificationStatus);
          const isSelectedForEvidence = activeDocumentFilterId === src.documentId;
          return (
            <article
              key={src.documentId}
              className={`wb-b2-source-card ${isSelectedForEvidence ? 'is-selected' : ''} ${
                src.isHistoricalRejectedForCurrentSeason ? 'is-historical-rejected' : ''
              }`}
              data-testid={`source-card-${src.documentId}`}
            >
              <div className="wb-b2-source-header">
                <div className="wb-b2-source-badges">
                  <span className={`wb-b2-status-pill tone-${tone}`}>
                    {src.sourceVerificationStatus === 'official_source_confirmed' ? (
                      <CheckCircle2 size={13} aria-hidden="true" />
                    ) : src.sourceVerificationStatus === 'official_source_unavailable' ? (
                      <XCircle size={13} aria-hidden="true" />
                    ) : (
                      <FileWarning size={13} aria-hidden="true" />
                    )}
                    <span>{src.sourceVerificationStatusLabel}</span>
                  </span>
                  <span className="wb-b2-lang-pill">
                    <Globe2 size={12} aria-hidden="true" />
                    <span>{src.language}</span>
                  </span>
                  {src.isHistoricalRejectedForCurrentSeason && (
                    <span className="wb-b2-danger-pill">
                      Historyczny 2025/2026 · Odrzucony dla 2026/2027
                    </span>
                  )}
                </div>
                <h3 className="wb-b2-source-title">{src.documentTitle}</h3>
                <p className="wb-b2-source-subtitle">
                  <span>{src.documentType}</span> ·{' '}
                  <strong>{getProductScopeLabel(src.productKey)}</strong>
                </p>
              </div>

              <dl className="wb-b2-meta-list">
                <div className="wb-b2-meta-row">
                  <dt>ID dokumentu i rejestr</dt>
                  <dd>
                    <code>{src.documentId}</code>
                    {src.rplIdOrRegistryNumber ? ` · ${src.rplIdOrRegistryNumber}` : ''}
                  </dd>
                </div>
                <div className="wb-b2-meta-row">
                  <dt>Organ / instytucja</dt>
                  <dd>{src.authority}</dd>
                </div>
                <div className="wb-b2-meta-row">
                  <dt>Pozwolenie i podmiot</dt>
                  <dd>
                    {src.marketingAuthorizationNumber ?? 'Nie dotyczy'} ·{' '}
                    {src.marketingAuthorizationHolder ?? 'Brak danych'}
                  </dd>
                </div>
                <div className="wb-b2-meta-row">
                  <dt>Data rewizji ChPL (pkt 10) / pobrania</dt>
                  <dd>
                    <strong>
                      {src.revisionDate ?? 'Brak wpisanej daty w pkt 10 (missing_in_document)'}
                    </strong>
                    {src.publicationDate ? ` · Publikacja/aktualizacja: ${src.publicationDate}` : ''}
                    {src.retrievedAt ? ` · Pozyskanie: ${src.retrievedAt}` : ''}
                  </dd>
                </div>
                <div className="wb-b2-meta-row">
                  <dt>Zakres i objętość PDF</dt>
                  <dd>
                    {src.physicalPageCount !== null ? `${src.physicalPageCount} str.` : 'Liczba stron nieokreślona'} ·{' '}
                    {src.pdfScopeRange}
                    {src.fileSizeBytes !== null ? ` · ${src.fileSizeBytes.toLocaleString('pl-PL')} B` : ''}
                  </dd>
                </div>
                <div className="wb-b2-meta-row">
                  <dt>
                    <Hash size={13} aria-hidden="true" />
                    <span>SHA-256 i podstawa</span>
                  </dt>
                  <dd>
                    {src.sha256 ? (
                      <code className="wb-b2-hash-code">{src.sha256}</code>
                    ) : (
                      <span>Brak zapisanego skrótu SHA-256</span>
                    )}
                    <span className="wb-b2-hash-basis">
                      Podstawa: {src.sha256ScopeLabel} (<code>{src.sha256Basis}</code>)
                    </span>
                  </dd>
                </div>
              </dl>

              <p className="wb-b2-source-notes">{src.sourceVerificationNotes}</p>

              <div className="wb-b2-source-actions">
                <a
                  href={src.officialSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="wb-action-btn wb-action-btn-secondary"
                >
                  <ExternalLink size={14} aria-hidden="true" />
                  <span>Otwórz oficjalne źródło ({src.language})</span>
                </a>
                <button
                  type="button"
                  className="wb-action-btn"
                  onClick={() =>
                    onSelectDocumentForEvidence(isSelectedForEvidence ? 'all' : src.documentId)
                  }
                >
                  <Filter size={14} aria-hidden="true" />
                  <span>
                    {isSelectedForEvidence
                      ? 'Pokaż dowody ze wszystkich źródeł'
                      : 'Filtruj dowody dla tego dokumentu'}
                  </span>
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
});
