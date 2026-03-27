// frontend/src/components/common/ErrorBoundary.jsx
import React, { Component } from 'react';
import { FaExclamationTriangle, FaRedo, FaHome, FaBug, FaArrowLeft } from 'react-icons/fa';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      errorInfo,
      errorCount: this.state.errorCount + 1
    });

    // Log error to monitoring service (e.g., Sentry)
    if (process.env.NODE_ENV === 'production') {
      // Send to error tracking service
      // logErrorToService(error, errorInfo);
    }
  }

  componentDidUpdate(prevProps) {
    // Reset error boundary when location changes
    if (this.props.location !== prevProps.location && this.state.hasError) {
      this.resetError();
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleGoBack = () => {
    window.history.back();
  };

  copyErrorDetails = () => {
    const errorDetails = `
Error: ${this.state.error?.toString() || 'Unknown error'}
Stack: ${this.state.errorInfo?.componentStack || 'No stack trace'}
User Agent: ${navigator.userAgent}
URL: ${window.location.href}
Timestamp: ${new Date().toISOString()}
    `;
    
    navigator.clipboard.writeText(errorDetails);
    // Show toast notification
    if (this.props.onCopySuccess) {
      this.props.onCopySuccess();
    }
  };

  render() {
    const { hasError, error, errorInfo, errorCount } = this.state;
    const { fallback, children, showDetails = false } = this.props;

    if (!hasError) {
      return children;
    }

    // Custom fallback UI
    if (fallback) {
      return fallback;
    }

    // Default error UI
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Error Header */}
          <div className="bg-gradient-to-r from-red-600 to-orange-600 px-6 py-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4">
              <FaExclamationTriangle className="h-10 w-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Something Went Wrong
            </h1>
            <p className="text-red-100">
              We're sorry, but an unexpected error has occurred.
            </p>
          </div>

          {/* Error Content */}
          <div className="p-6">
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-gray-700 text-sm mb-2">
                <strong>Error Type:</strong> {error?.name || 'Runtime Error'}
              </p>
              <p className="text-gray-700 text-sm">
                <strong>Message:</strong> {error?.message || 'An unexpected error occurred'}
              </p>
            </div>

            {/* Error Details (Development Only) */}
            {showDetails && process.env.NODE_ENV !== 'production' && (
              <div className="mb-6">
                <details className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-96">
                  <summary className="text-white font-mono text-sm cursor-pointer mb-2">
                    <FaBug className="inline mr-2" />
                    Error Details (Development)
                  </summary>
                  <pre className="text-gray-300 text-xs whitespace-pre-wrap mt-2">
                    {errorInfo?.componentStack || error?.stack || 'No stack trace available'}
                  </pre>
                </details>
              </div>
            )}

            {/* Suggestions */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-800 mb-2">What you can try:</h3>
              <ul className="space-y-2 text-sm text-blue-700">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  Refresh the page to try again
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  Clear your browser cache and cookies
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  Try accessing the page in incognito mode
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  Contact support if the issue persists
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 bg-primary-600 text-white px-4 py-3 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
              >
                <FaRedo className="h-4 w-4" />
                <span>Refresh Page</span>
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex-1 bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
              >
                <FaHome className="h-4 w-4" />
                <span>Go Home</span>
              </button>
              <button
                onClick={this.handleGoBack}
                className="flex-1 bg-gray-500 text-white px-4 py-3 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center space-x-2"
              >
                <FaArrowLeft className="h-4 w-4" />
                <span>Go Back</span>
              </button>
            </div>

            {/* Error Count Warning */}
            {errorCount > 3 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-center">
                <p className="text-sm text-red-700">
                  Multiple errors detected. Please contact support for assistance.
                </p>
              </div>
            )}

            {/* Support Contact */}
            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-500">
                Need help? Contact our support team at{' '}
                <a
                  href="mailto:support@maternitycare.com"
                  className="text-primary-600 hover:text-primary-700"
                >
                  support@maternitycare.com
                </a>
              </p>
              <button
                onClick={this.copyErrorDetails}
                className="mt-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Copy error details for support
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

// Higher-order component for wrapping components with error boundary
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  return function WithErrorBoundary(props) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
};

// Async Error Boundary for handling async errors
export class AsyncErrorBoundary extends ErrorBoundary {
  constructor(props) {
    super(props);
    this.state = {
      ...this.state,
      loading: true
    };
  }

  componentDidMount() {
    this.setState({ loading: false });
  }

  render() {
    const { loading } = this.state;
    
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
        </div>
      );
    }
    
    return super.render();
  }
}

// Fallback UI component for smaller components
export const ComponentFallback = ({ error, resetError }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
    <FaExclamationTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
    <p className="text-sm text-red-700 mb-2">
      Failed to load component
    </p>
    <button
      onClick={resetError}
      className="text-xs text-red-600 hover:text-red-800 underline"
    >
      Try again
    </button>
  </div>
);

export default ErrorBoundary;