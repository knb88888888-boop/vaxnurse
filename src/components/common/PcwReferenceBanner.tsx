import React from 'react';
import {
  Stethoscope,
  ExternalLink,
  Sparkles,
  Compass,
  Users,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';
import { PCW_PROJECT } from '../../data/sisterProjects';

interface PcwReferenceBannerProps {
  variant?: 'dashboard' | 'about';
}

export const PcwReferenceBanner: React.FC<PcwReferenceBannerProps> = ({
  variant = 'dashboard'
}) => {
  const headingId =
    variant === 'dashboard' ? 'pcw-dashboard-ref-heading' : 'pcw-about-ref-heading';

  return (
    <section
      id={PCW_PROJECT.id}
      className="pcw-ref-card"
      aria-labelledby={headingId}
    >
      <div className="pcw-ref-header">
        <div className="pcw-ref-title-group">
          <div className="pcw-ref-icon-box" aria-hidden="true">
            <Stethoscope size={22} />
          </div>
          <div className="pcw-ref-heading-block">
            <span className="pcw-ref-badge">{PCW_PROJECT.badge}</span>
            <h2 id={headingId} className="pcw-ref-title">
              {PCW_PROJECT.name} — {PCW_PROJECT.subtitle}
            </h2>
            <p className="pcw-ref-summary">{PCW_PROJECT.summary}</p>
          </div>
        </div>

        <a
          href={PCW_PROJECT.url}
          target="_blank"
          rel="noopener noreferrer"
          className="pcw-ref-cta"
        >
          <span>Otwórz Pielęgniarki (PCW)</span>
          <ExternalLink size={16} aria-hidden="true" />
        </a>
      </div>

      <div className="pcw-ref-columns">
        <div className="pcw-ref-box">
          <h3 className="pcw-ref-box-title">
            <Sparkles size={16} aria-hidden="true" />
            <span>Co to jest?</span>
          </h3>
          <p className="pcw-ref-box-text">{PCW_PROJECT.whatItIs}</p>
        </div>

        <div className="pcw-ref-box">
          <h3 className="pcw-ref-box-title">
            <Compass size={16} aria-hidden="true" />
            <span>Po co powstał?</span>
          </h3>
          <p className="pcw-ref-box-text">{PCW_PROJECT.whyCreated}</p>
        </div>

        <div className="pcw-ref-box">
          <h3 className="pcw-ref-box-title">
            <Users size={16} aria-hidden="true" />
            <span>Dla kogo?</span>
          </h3>
          <ul className="pcw-ref-audience-list">
            {PCW_PROJECT.whoIsItFor.map(item => (
              <li key={item}>
                <CheckCircle2 size={14} aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="pcw-ref-modules">
        <span className="pcw-ref-modules-label">Główne moduły:</span>
        {PCW_PROJECT.keyModules.map(mod => (
          <span key={mod} className="pcw-ref-module-pill">
            {mod}
          </span>
        ))}
      </div>

      <div className="pcw-ref-footer">
        <div className="pcw-ref-disclaimer">
          <ShieldAlert size={15} aria-hidden="true" />
          <span>{PCW_PROJECT.disclaimer}</span>
        </div>
        <a
          href={PCW_PROJECT.url}
          target="_blank"
          rel="noopener noreferrer"
          className="pcw-ref-domain-link"
        >
          pielegniarki.vercel.app
        </a>
      </div>
    </section>
  );
};
