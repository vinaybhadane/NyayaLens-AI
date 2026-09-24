import { Component, ReactNode, ErrorInfo } from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Uncaught error in component tree:', error, errorInfo);
    }
  }

  public override render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="p-6 max-w-xl mx-auto my-12 bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-900 rounded-xl shadow-lg text-slate-800 dark:text-slate-200"
        >
          <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
            <AlertOctagon className="w-8 h-8" aria-hidden="true" />
            <h2 className="text-xl font-bold">Something went wrong</h2>
          </div>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            NyayaLens encountered an unexpected interface issue. Your uploaded document data remains
            safely in your current browser session.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
