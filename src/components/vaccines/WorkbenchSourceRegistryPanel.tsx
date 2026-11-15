import React, { useMemo, useState } from 'react';
import {
  AlertOctagon,
  Archive,
  CheckCircle2,
  ExternalLink,
  FileCheck2,
  FileWarning,
  Filter,
  Globe2,
  Hash,
  History,
  Search,
  ServerCrash,
  ShieldAlert,
  XCircle
} from 'lucide-react';
import type {
  SourceObjectType,
  SourceRegistryEntry,
  SourceVerificationStatus
} from '../../types/evidenceLedger';
import {
  ALLOWED_SOURCE_OBJECT_TYPES,
  ALLOWED_SOURCE_VERIFICATION_STATUSES,
  getAcquisitionAxisStatusLabel,
  getContentReviewAxisStatusLabel,
  getFileAvailabilityLabel,
  getHashComparisonStatusLabel,
  getIntegrityAxisStatusLabel,
  getOriginAxisStatusLabel,
  getPdfStorageLocationLabel,
  getProductScopeLabel,
  getSourceObjectTypePresentation
} from '../../utils/chplEvidenceLedger';

interface WorkbenchSourceRegistryPanelProps {
  sources: SourceRegistryEntry[];
  activeDocumentFilterId: string;
  onSelectDocumentForEvidence: (documentId: string) => void;
  onOpenDocumentInPdfBridge?: (documentId: string) => void;
}

function getSourceBadgeTone(src: SourceRegistryEntry): 'info' | 'warning' | 'danger' | 'neutral' | 'historical' {
  if (src.isHistoricalRejectedForCurrentSeason || src.objectType === 'historical_document') {
    return 'historical';
  }
  if (src.statusAxes.acquisitionStatus === 'access_failed' || src.objectType === 'official_endpoint') {
    return 'danger';
  }
  if (
    src.statusAxes.acquisitionStatus === 'acquired' ||
    src.statusAxes.acquisitionStatus === 'session_local_file_selected'
  ) {
    return 'info';
  }
  if (src.sourceVerificationStatus === 'requires_manual_review' || src.statusAxes.originStatus !== 'official_origin_confirmed') {
    return 'warning';
  }
  return 'neutral';
}

export const WorkbenchSourceRegistryPanel: React.FC<WorkbenchSourceRegistryPanelProps> = React.memo(({
  sources,
  activeDocumentFilterId,
  onSelectDocumentForEvidence,
  onOpenDocumentInPdfBridge
}) => {
  const [objectTypeFilter, setObjectTypeFilter] = useState<SourceObjectType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<SourceVerificationStatus | 'all'>('all');
  const [languageFilter, setLanguageFilter] = useState<'all' | 'PL' | 'EN'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredSources = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return sources.filter((src) => {
      if (objectTypeFilter !== 'all' && src.objectType !== objectTypeFilter) {
        return false;
      }
      if (statusFilter !== 'all' && src.sourceVerificationStatus !== statusFilter) {
        return false;
      }
      if (languageFilter !== 'all' && src.language !== languageFilter) {
        return false;
      }
      if (q) {
        const hay = [
          src.documentId,
          src.objectType,
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
  }, [sources, objectTypeFilter, statusFilter, languageFilter, searchQuery]);

  const locallyAcquiredCount = sources.filter(
    (s) => s.statusAxes.acquisitionStatus === 'acquired'
  ).length;
  const unacquiredOrWarningCount = sources.filter(
    (s) => s.statusAxes.acquisitionStatus !== 'acquired'
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
            Sekcja E — Rejestr Źródeł, Artefaktów i Prób Pobierań (Etap B3)
          </h2>
          <p className="wb-section-subheading">
            Każdy obiekt rozdziela niezależnie cztery osie: <strong>pochodzenie</strong>,{' '}
            <strong>pozyskanie pliku</strong>, <strong>integralność (SHA-256)</strong> oraz{' '}
            <strong>kontrolę treści</strong>. Sam wpis rejestrowy ani suma SHA-256 nie stanowią potwierdzenia
            autentyczności ani zatwierdzenia klinicznego karty ChPL.
          </p>
        </div>
        <div className="wb-b2-counters" role="group" aria-label="Podsumowanie pozyskania i statusów źródeł">
          <span className="wb-b2-stat-chip wb-b2-chip-info">
            <FileCheck2 size={14} aria-hidden="true" />
            <span>Pozyskane lokalnie: {locallyAcquiredCount} / {sources.length}</span>
          </span>
          <span className="wb-b2-stat-chip wb-b2-chip-warning">
            <ShieldAlert size={14} aria-hidden="true" />
            <span>Metadane / niedostępne / historyczne: {unacquiredOrWarningCount}</span>
          </span>
        </div>
      </div>

      <div className="wb-b2-filter-bar wb-b3-filter-bar">
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
          <label htmlFor="b3-src-object-type" className="wb-filter-label">
            Typ obiektu źródłowego (Etap B3)
          </label>
          <select
            id="b3-src-object-type"
            className="wb-select-input"
            value={objectTypeFilter}
            onChange={(e) => setObjectTypeFilter(e.target.value as SourceObjectType | 'all')}
          >
            <option value="all">Wszystkie typy obiektów ({sources.length})</option>
            {ALLOWED_SOURCE_OBJECT_TYPES.map((t) => (
              <option key={t} value={t}>
                {getSourceObjectTypePresentation(t).badgeText}
              </option>
            ))}
          </select>
        </div>

        <div className="wb-filter-group">
          <label htmlFor="b2-src-status" className="wb-filter-label">
            Status historyczny źródła
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
            Język artefaktu
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
          const objectMeta = getSourceObjectTypePresentation(src.objectType);
          const tone = getSourceBadgeTone(src);
          const isSelectedForEvidence = activeDocumentFilterId === src.documentId;
          const hashProv = src.currentArtifact?.hashProvenance;
          return (
            <article
              key={src.documentId}
              id={`source-card-${src.documentId}`}
              className={`wb-b2-source-card ${isSelectedForEvidence ? 'is-selected' : ''} ${
                src.isHistoricalRejectedForCurrentSeason ? 'is-historical-rejected' : ''
              }`}
              data-testid={`source-card-${src.documentId}`}
              data-object-type={src.objectType}
            >
              <div className="wb-b2-source-header">
                <div className="wb-b2-source-badges">
                  <span className={`wb-b2-status-pill tone-${objectMeta.tone}`}>
                    {src.objectType === 'official_endpoint' ? (
                      <ServerCrash size={13} aria-hidden="true" />
                    ) : src.objectType === 'historical_document' ? (
                      <Archive size={13} aria-hidden="true" />
                    ) : src.statusAxes.acquisitionStatus === 'acquired' ? (
                      <FileCheck2 size={13} aria-hidden="true" />
                    ) : (
                      <AlertOctagon size={13} aria-hidden="true" />
                    )}
                    <span>{objectMeta.badgeText}</span>
                  </span>
                  <span className={`wb-b2-status-pill tone-${tone}`}>
                    {src.statusAxes.acquisitionStatus === 'acquired' ||
                    src.statusAxes.acquisitionStatus === 'session_local_file_selected' ? (
                      <CheckCircle2 size={13} aria-hidden="true" />
                    ) : src.sourceVerificationStatus === 'official_source_unavailable' ? (
                      <XCircle size={13} aria-hidden="true" />
                    ) : (
                      <FileWarning size={13} aria-hidden="true" />
                    )}
                    <span>{src.sourceVerificationStatusLabel}</span>
                  </span>
                  {src.hasPersistedLocalArtifactMetadata &&
                    src.statusAxes.fileAvailability === 'metadata_only_reload_required' && (
                      <span className="wb-b4-reload-pill">
                        Po odświeżeniu: wymaga ponownego wskazania PDF
                      </span>
                    )}
                  <span className="wb-b2-lang-pill">
                    <Globe2 size={12} aria-hidden="true" />
                    <span>Język: {src.language}</span>
                  </span>
                  {src.isHistoricalRejectedForCurrentSeason && (
                    <span className="wb-b2-status-pill tone-historical">
                      Historyczny 2025/2026 · Odrzucony dla 2026/2027
                    </span>
                  )}
                </div>
                {(src.historicalNotice || src.isHistoricalRejectedForCurrentSeason) && (
                  <p className="wb-b3-historical-banner" role="note">
                    <Archive size={14} aria-hidden="true" />
                    <span>{src.historicalNotice ?? 'Dokument historyczny — nie stosować jako automatycznej podstawy bieżącego audytu'}</span>
                  </p>
                )}
                <h3 className="wb-b2-source-title">{src.documentTitle}</h3>
                <p className="wb-b2-source-subtitle">
                  <span>{src.documentType}</span> ·{' '}
                  <strong>{getProductScopeLabel(src.productKey)}</strong>
                </p>
              </div>

              {/* Niezależne osie statusu B3 / B4 */}
              <div className="wb-b3-axes-grid" role="group" aria-label="Niezależne osie statusu i dostępności źródła">
                <div className="wb-b3-axis-item">
                  <span className="wb-b3-axis-name">1. Pochodzenie</span>
                  <span className="wb-b3-axis-value">{getOriginAxisStatusLabel(src.statusAxes.originStatus)}</span>
                </div>
                <div className="wb-b3-axis-item">
                  <span className="wb-b3-axis-name">2. Pozyskanie pliku</span>
                  <span className="wb-b3-axis-value">{getAcquisitionAxisStatusLabel(src.statusAxes.acquisitionStatus)}</span>
                </div>
                <div className="wb-b3-axis-item">
                  <span className="wb-b3-axis-name">3. Integralność (SHA-256)</span>
                  <span className="wb-b3-axis-value">{getIntegrityAxisStatusLabel(src.statusAxes.integrityStatus)}</span>
                </div>
                <div className="wb-b3-axis-item">
                  <span className="wb-b3-axis-name">4. Kontrola treści</span>
                  <span className="wb-b3-axis-value">{getContentReviewAxisStatusLabel(src.statusAxes.contentReviewStatus)}</span>
                </div>
                <div className="wb-b3-axis-item">
                  <span className="wb-b3-axis-name">5. Dostępność w sesji</span>
                  <span className="wb-b3-axis-value">
                    {getFileAvailabilityLabel(src.statusAxes.fileAvailability)}
                  </span>
                </div>
                <div className="wb-b3-axis-item">
                  <span className="wb-b3-axis-name">6. Przechowywanie</span>
                  <span className="wb-b3-axis-value">
                    {getPdfStorageLocationLabel(src.statusAxes.storageMode)}
                  </span>
                </div>
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
                    {src.marketingAuthorizationNumber ?? 'Pole puste (brak numeru w źródle)'} ·{' '}
                    {src.marketingAuthorizationHolder ?? 'Pole puste'}
                  </dd>
                </div>
                <div className="wb-b2-meta-row">
                  <dt>Data rewizji / pobrania</dt>
                  <dd>
                    <strong>
                      {src.revisionDate ?? 'Brak wpisanej daty w pkt 10 (pole puste)'}
                    </strong>
                    {src.publicationDate ? ` · Publikacja: ${src.publicationDate}` : ''}
                    {src.retrievedAt ? ` · Pozyskanie/sprawdzenie: ${src.retrievedAt}` : ''}
                  </dd>
                </div>
                <div className="wb-b2-meta-row">
                  <dt>Zakres i objętość artefaktu</dt>
                  <dd>
                    {src.physicalPageCount !== null ? `${src.physicalPageCount} str.` : 'Liczba stron nieustalona'} ·{' '}
                    {src.pdfScopeRange}
                    {src.fileSizeBytes !== null ? ` · ${src.fileSizeBytes.toLocaleString('pl-PL')} B` : ''}
                    {src.pageCountComparisonStatus === 'mismatch' &&
                    src.activeSessionPageCount != null &&
                    src.registryReferencePageCount != null && (
                      <span className="wb-b4-inline-warn">
                        {' '}· Rozbieżność stron PDF ({src.activeSessionPageCount}) vs rejestr ({src.registryReferencePageCount})
                      </span>
                    )}
                  </dd>
                </div>
                <div className="wb-b2-meta-row">
                  <dt>
                    <Hash size={13} aria-hidden="true" />
                    <span>Proweniencja SHA-256</span>
                  </dt>
                  <dd>
                    {hashProv?.value ? (
                      <code className="wb-b2-hash-code">{hashProv.value}</code>
                    ) : (
                      <span>Brak sumy SHA-256 (brak pliku PDF)</span>
                    )}
                    <span className="wb-b2-hash-basis">
                      Stan porównania:{' '}
                      <strong>
                        {hashProv
                          ? getHashComparisonStatusLabel(hashProv.comparisonStatus)
                          : 'Brak artefaktu'}
                      </strong>{' '}
                      · Metoda: {hashProv?.calculationMethod ?? 'Nie dotyczy'}
                      {hashProv?.fileName ? ` · Plik: ${hashProv.fileName}` : ''}
                    </span>
                  </dd>
                </div>
              </dl>

              <p className="wb-b2-source-notes">{src.registryVsFileDistinctionNote}</p>

              <details className="wb-b3-details">
                <summary className="wb-b3-details-summary">
                  <History size={14} aria-hidden="true" />
                  <span>
                    Artefakty ({src.artifactHistory.length}) i próby pobrania ({src.retrievalAttempts.length})
                  </span>
                </summary>
                <div className="wb-b3-details-body">
                  {src.artifactHistory.length > 0 ? (
                    <div className="wb-b3-subblock">
                      <strong>Historia wersji artefaktów:</strong>
                      <ul className="wb-b3-mini-list">
                        {src.artifactHistory.map((art) => (
                          <li key={art.artifactId}>
                            <code>{art.artifactId}</code> (v{art.versionSequence}, {art.language}) ·{' '}
                            {art.fileName ?? 'brak nazwy pliku'} ·{' '}
                            {art.isCurrentActiveVersion ? 'wersja bieżąca' : 'wersja historyczna'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="wb-b3-empty-inline">Brak pozyskanego artefaktu pliku binarnego.</p>
                  )}

                  <div className="wb-b3-subblock">
                    <strong>Zarejestrowane próby dostępu:</strong>
                    <ul className="wb-b3-mini-list">
                      {src.retrievalAttempts.map((att) => (
                        <li key={att.attemptId}>
                          <code>{att.attemptId}</code> ({att.attemptedAt}) ·{' '}
                          {att.httpStatus !== null ? `HTTP ${att.httpStatus}` : att.accessMethod} ·{' '}
                          {att.result}
                          {att.errorDescription ? ` — ${att.errorDescription}` : ` — ${att.checkScope}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </details>

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
                {onOpenDocumentInPdfBridge && (
                  <button
                    type="button"
                    className="wb-action-btn"
                    data-testid={`open-pdf-bridge-${src.documentId}`}
                    onClick={() => onOpenDocumentInPdfBridge(src.documentId)}
                  >
                    <FileCheck2 size={14} aria-hidden="true" />
                    <span>Otwórz w Moście PDF</span>
                  </button>
                )}
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
