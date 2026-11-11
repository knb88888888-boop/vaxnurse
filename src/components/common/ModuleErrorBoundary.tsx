import React from 'react';
import { AlertTriangle, RotateCcw, ArrowLeft } from 'lucide-react';

interface ModuleErrorBoundaryProps {
  children: React.ReactNode;
  resetKey: string;
  onRetry: () => void;
  onBackToDashboard?: () => void;
}

interface ModuleErrorBoundaryState {
  hasError: boolean;
  errorMessage: string | null;
  prevResetKey: string;
}

export class ModuleErrorBoundary extends React.Component<
  ModuleErrorBoundaryProps,
  ModuleErrorBoundaryState
> {
  constructor(props: ModuleErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: null,
      prevResetKey: props.resetKey
    };
  }

  static getDerivedStateFromProps(
    nextProps: ModuleErrorBoundaryProps,
    prevState: ModuleErrorBoundaryState
  ): Partial<ModuleErrorBoundaryState> | null {
    if (nextProps.resetKey !== prevState.prevResetKey) {
      return {
        hasError: false,
        errorMessage: null,
        prevResetKey: nextProps.resetKey
      };
    }
    return null;
  }

  static getDerivedStateFromError(error: Error): Partial<ModuleErrorBoundaryState> {
    return {
      hasError: true,
      errorMessage: error.message || 'Nie udało się załadować zasobu modułu.'
    };
  }

  componentDidCatch(error: Error) {
    console.error('Błąd ładowania dynamicznego modułu VaxNurse:', error);
  }

  private handleRetryClick = () => {
    this.setState({ hasError: false, errorMessage: null });
    this.props.onRetry();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="module-lazy-error-card" role="alert">
          <AlertTriangle size={28} className="module-lazy-error-icon" aria-hidden="true" />
          <div className="module-lazy-error-content">
            <h2 className="module-lazy-error-title">
              Nie udało się wczytać modułu
            </h2>
            <p className="module-lazy-error-desc">
              Wystąpił problem podczas pobierania lub inicjalizacji komponentu ({this.state.errorMessage}).
              Twoje dane zapisane lokalnie w przeglądarce nie zostały naruszone.
            </p>
            <div className="module-lazy-error-actions">
              <button
                type="button"
                className="btn-lazy-retry"
                onClick={this.handleRetryClick}
              >
                <RotateCcw size={15} />
                <span>Spróbuj ponownie</span>
              </button>
              {this.props.onBackToDashboard && (
                <button
                  type="button"
                  className="btn-lazy-back"
                  onClick={this.props.onBackToDashboard}
                >
                  <ArrowLeft size={15} />
                  <span>Powrót do Pulpitu</span>
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
