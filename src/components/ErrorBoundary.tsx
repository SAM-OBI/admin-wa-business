import { Component, ErrorInfo, ReactNode } from 'react';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ErrorBoundary] ${this.props.name || 'Component'} Error:`, error, errorInfo);
    // Here we would integrate Sentry/LogRocket
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="p-6 sm:p-8 rounded-2xl bg-sv-danger-soft border border-sv-danger/20 flex flex-col items-center text-center gap-4">
          <div className="p-3 bg-sv-surface rounded-xl shadow-sm border border-sv-border">
            <FiAlertTriangle className="text-sv-danger text-2xl" />
          </div>
          <div>
            <h3 className="font-black text-sv-text-primary uppercase tracking-widest text-sm">Module Fault</h3>
            <p className="text-xs text-sv-danger font-bold uppercase tracking-tight mt-1">
              {this.props.name || 'The component'} failed to initialize.
            </p>
          </div>
          <button 
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-4 py-2 bg-sv-surface border border-sv-danger/30 rounded-lg text-xs font-black text-sv-danger uppercase tracking-widest hover:bg-sv-danger hover:text-sv-text-inverse transition-all shadow-sm"
          >
            <FiRefreshCw />
            Attempt Recovery
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
