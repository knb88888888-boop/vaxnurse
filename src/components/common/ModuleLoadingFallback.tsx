import React from 'react';
import { Loader2 } from 'lucide-react';

interface ModuleLoadingFallbackProps {
  label?: string;
}

export const ModuleLoadingFallback: React.FC<ModuleLoadingFallbackProps> = ({
  label = 'Ładowanie modułu VaxNurse…'
}) => {
  return (
    <div
      className="module-lazy-fallback"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 size={28} className="module-lazy-spinner" aria-hidden="true" />
      <p className="module-lazy-text">{label}</p>
      <span className="module-lazy-subtext">
        Trwa wczytywanie widoku i lokalnych danych referencyjnych.
      </span>
    </div>
  );
};
