import React from 'react';
import {
  ExternalLink,
  Building2,
  Calendar,
  Layers,
  FileCheck,
  AlertCircle,
  FileText,
  Clock,
  ShieldCheck
} from 'lucide-react';
import type { KnowledgeSource, KnowledgeCategory } from '../../types/knowledge';

interface KnowledgeCardProps {
  source: KnowledgeSource;
}

export const KnowledgeCard: React.FC<KnowledgeCardProps> = ({ source }) => {
  const getCategoryBadge = (cat: KnowledgeCategory) => {
    switch (cat) {
      case 'pso':
        return { label: 'Program Szczepień Ochronnych', colorClass: 'badge-pso' };
      case 'chpl':
        return { label: 'Charakterystyki Produktów (ChPL)', colorClass: 'badge-chpl' };
      case 'gis-gif':
        return { label: 'Wytyczne GIS i GIF', colorClass: 'badge-gis' };
      case 'law':
        return { label: 'Przepisy prawne', colorClass: 'badge-law' };
      case 'procedures':
        return { label: 'Procedury punktu szczepień', colorClass: 'badge-proc' };
    }
  };

  const categoryInfo = getCategoryBadge(source.category);

  return (
    <article className="knowledge-card" aria-labelledby={`title-${source.id}`}>
      {/* Card Header */}
      <div className="k-card-header">
        <div className="k-card-badges">
          <span className={`k-badge ${categoryInfo.colorClass}`}>
            {categoryInfo.label}
          </span>
          <span className="k-badge-official" title="Zweryfikowane źródło państwowe">
            <ShieldCheck size={13} />
            <span>{source.verificationStatus}</span>
          </span>
          {source.targetYear && (
            <span className="k-badge-year" title={`Dokument dotyczy roku ${source.targetYear}`}>
              Dotyczy roku: {source.targetYear}
            </span>
          )}
        </div>
      </div>

      {/* Card Title & Publisher */}
      <div className="k-card-main">
        <h2 id={`title-${source.id}`} className="k-card-title">
          {source.title}
        </h2>

        <div className="k-card-publisher">
          <Building2 size={16} className="publisher-icon" />
          <span className="publisher-label">Instytucja publikująca:</span>
          <strong className="publisher-name">{source.publisher}</strong>
        </div>

        <p className="k-card-description">{source.description}</p>
      </div>

      {/* Structured Metadata Box */}
      <div className="k-card-metadata-grid">
        {source.publicationDate && (
          <div className="meta-item">
            <Calendar size={14} className="meta-icon" />
            <span className="meta-label">Data publikacji:</span>
            <span className="meta-value">{source.publicationDate}</span>
          </div>
        )}

        {source.officialJournalDate && (
          <div className="meta-item">
            <FileText size={14} className="meta-icon" />
            <span className="meta-label">Publikacja Dz. Urz.:</span>
            <span className="meta-value">{source.officialJournalDate}</span>
          </div>
        )}

        {source.legalActNumber && (
          <div className="meta-item full-row">
            <FileCheck size={14} className="meta-icon" />
            <span className="meta-label">Oznaczenie aktu:</span>
            <span className="meta-value highlight-act">{source.legalActNumber}</span>
          </div>
        )}

        {source.version && (
          <div className="meta-item">
            <Layers size={14} className="meta-icon" />
            <span className="meta-label">Wersja dokumentu:</span>
            <span className="meta-value">
              {source.version} {source.versionDate ? `(z dn. ${source.versionDate})` : ''}
            </span>
          </div>
        )}

        {source.lastVerifiedDate && (
          <div className="meta-item">
            <Clock size={14} className="meta-icon" />
            <span className="meta-label">Ostatnia weryfikacja:</span>
            <span className="meta-value">{source.lastVerifiedDate}</span>
          </div>
        )}
      </div>

      {/* Critical Institutional/Clinical Notice */}
      {source.clinicalNote && (
        <div className="k-card-clinical-note">
          <AlertCircle size={18} className="note-icon" />
          <div className="note-text">
            <strong>Wskazówka weryfikacyjna dla punktu szczepień:</strong>
            <p>{source.clinicalNote}</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="k-card-actions">
        <a
          href={source.officialUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-open-official-source"
          aria-label={`Otwórz oficjalne źródło dla ${source.title} (otwiera się w nowym oknie)`}
        >
          <span>Otwórz oficjalne źródło</span>
          <ExternalLink size={15} />
        </a>

        {source.infoUrl && (
          <a
            href={source.infoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-open-info-page"
            aria-label={`Otwórz stronę informacyjną gov.pl dla ${source.title}`}
          >
            <span>Strona informacyjna gov.pl</span>
            <ExternalLink size={14} />
          </a>
        )}
      </div>
    </article>
  );
};
