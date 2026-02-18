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
        <div className="p-8 rounded-2xl bg-red-50 border border-red-100 flex flex-col items-center text-center gap-4">
          <div className="p-3 bg-white rounded-xl shadow-sm">
            <FiAlertTriangle className="text-red-600 text-2xl" />
          </div>
          <div>
            <h3 className="font-black text-gray-900 uppercase tracking-widest text-sm">Module Fault</h3>
            <p className="text-xs text-red-700 font-bold uppercase tracking-tight mt-1">
              {this.props.name || 'The component'} failed to initialize.
            </p>
          </div>
          <button 
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 rounded-lg text-xs font-black text-red-600 uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm"
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
