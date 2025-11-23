import React, { Component } from 'react';

/**
 * ERROR BOUNDARY COMPONENT
 * 
 * Catches JavaScript errors anywhere in the child component tree
 * Prevents app crashes and shows fallback UI
 * Logs errors for debugging
 * 
 * Features:
 * 1. Graceful error handling
 * 2. Error reporting to logging service
 * 3. User-friendly error messages
 * 4. Retry functionality
 * 5. Error details for developers (dev mode only)
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Update state
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Report error to logging service (e.g., Sentry)
    if (process.env.REACT_APP_SENTRY_DSN) {
      // Sentry.captureException(error, { extra: errorInfo });
    }

    // Store error in localStorage for debugging
    try {
      const errorLog = JSON.parse(localStorage.getItem('wagob_errors') || '[]');
      errorLog.push({
        timestamp: new Date().toISOString(),
        message: error.toString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
      
      // Keep only last 10 errors
      if (errorLog.length > 10) {
        errorLog.shift();
      }
      
      localStorage.setItem('wagob_errors', JSON.stringify(errorLog));
    } catch (e) {
      console.error('Failed to log error:', e);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReset = () => {
    // Clear error and reload page
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-2xl w-full">
            {/* Error Card */}
            <div className="bg-white rounded-lg shadow-xl overflow-hidden">
              {/* Header */}
              <div className="bg-red-50 border-b border-red-200 p-6">
                <div className="flex items-center gap-4">
                  <div className="text-6xl">😕</div>
                  <div>
                    <h1 className="text-2xl font-bold text-red-900">
                      Oops! Something went wrong
                    </h1>
                    <p className="text-red-700 mt-1">
                      We're sorry for the inconvenience
                    </p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    What happened?
                  </h2>
                  <p className="text-gray-700">
                    The application encountered an unexpected error. Your data is safe, 
                    but we couldn't complete your last action.
                  </p>
                </div>

                {/* Error Details (Development Only) */}
                {isDevelopment && this.state.error && (
                  <div className="mb-6">
                    <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <summary className="cursor-pointer font-semibold text-gray-900 mb-2">
                        🔍 Technical Details (Dev Only)
                      </summary>
                      <div className="mt-3 space-y-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-700">Error:</p>
                          <pre className="text-xs bg-white p-2 rounded border border-gray-200 overflow-x-auto">
                            {this.state.error.toString()}
                          </pre>
                        </div>
                        {this.state.error.stack && (
                          <div>
                            <p className="text-sm font-semibold text-gray-700">Stack Trace:</p>
                            <pre className="text-xs bg-white p-2 rounded border border-gray-200 overflow-x-auto max-h-48">
                              {this.state.error.stack}
                            </pre>
                          </div>
                        )}
                        {this.state.errorInfo?.componentStack && (
                          <div>
                            <p className="text-sm font-semibold text-gray-700">Component Stack:</p>
                            <pre className="text-xs bg-white p-2 rounded border border-gray-200 overflow-x-auto max-h-48">
                              {this.state.errorInfo.componentStack}
                            </pre>
                          </div>
                        )}
                      </div>
                    </details>
                  </div>
                )}

                {/* Suggestions */}
                <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    💡 Try these solutions:
                  </h3>
                  <ul className="space-y-1 text-sm text-blue-800">
                    <li>• Click "Try Again" to retry your last action</li>
                    <li>• Refresh the page to start fresh</li>
                    <li>• Clear your browser cache</li>
                    <li>• Check your internet connection</li>
                    {this.state.errorCount > 2 && (
                      <li className="text-red-600 font-semibold">
                        • If this keeps happening, please contact support
                      </li>
                    )}
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={this.handleRetry}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    🔄 Try Again
                  </button>
                  <button
                    onClick={this.handleReset}
                    className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                  >
                    ↻ Refresh Page
                  </button>
                </div>

                {/* Support Link */}
                <div className="mt-6 text-center">
                  <a
                    href="https://github.com/yuvrajsharmaaa/WajoB/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-600 hover:text-gray-900 underline"
                  >
                    Report this issue on GitHub →
                  </a>
                </div>
              </div>
            </div>

            {/* Error Count Warning */}
            {this.state.errorCount > 2 && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ <strong>Multiple errors detected.</strong> You may want to clear your browser 
                  cache or contact support if the problem persists.
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * LOADING SKELETON COMPONENT
 * Shows loading state for content
 */
export const LoadingSkeleton = ({ count = 3, type = 'job' }) => {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-md p-4">
          {type === 'job' && (
            <>
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="h-6 bg-gray-200 rounded w-2/3 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </>
          )}
          
          {type === 'card' && (
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-4/5"></div>
              <div className="h-4 bg-gray-200 rounded w-3/5"></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

/**
 * LOADING OVERLAY COMPONENT
 * Full-screen loading indicator
 */
export const LoadingOverlay = ({ message = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-8 shadow-2xl">
        <div className="flex flex-col items-center">
          <div className="relative w-16 h-16 mb-4">
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-900 font-semibold">{message}</p>
        </div>
      </div>
    </div>
  );
};

/**
 * EMPTY STATE COMPONENT
 * Shows when no data is available
 */
export const EmptyState = ({ 
  icon = '📭',
  title = 'No data found',
  message = 'Try adjusting your filters or check back later.',
  actionLabel,
  onAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-sm">{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default ErrorBoundary;
