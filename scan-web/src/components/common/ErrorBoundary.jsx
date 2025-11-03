// src/components/common/ErrorBoundary.jsx
import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // You can also log to an error reporting service here
    // e.g., Sentry.captureException(error);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Call onReset callback if provided
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI provided by parent
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          reset: this.handleReset,
        });
      }

      // Default fallback UI
      return (
        <div style={{
          padding: '40px',
          maxWidth: '800px',
          margin: '0 auto',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
        }}>
          <div style={{
            background: '#fee',
            border: '2px solid #fcc',
            borderRadius: '12px',
            padding: '32px',
          }}>
            <h2 style={{
              fontSize: '2rem',
              color: '#b91c1c',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}>
              <span style={{ fontSize: '2.5rem' }}>⚠️</span>
              Something went wrong
            </h2>

            <p style={{
              fontSize: '1.1rem',
              color: '#666',
              marginBottom: '24px',
              lineHeight: '1.6',
            }}>
              The application encountered an unexpected error.
              {this.props.errorType && ` (${this.props.errorType})`}
            </p>

            {this.state.error && (
              <details style={{
                background: '#fff',
                border: '1px solid #ddd',
                borderRadius: '6px',
                padding: '16px',
                marginBottom: '24px',
                textAlign: 'left',
                cursor: 'pointer',
              }}>
                <summary style={{
                  fontWeight: 600,
                  color: '#333',
                  marginBottom: '8px',
                }}>
                  Error Details
                </summary>
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                  color: '#b91c1c',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  marginTop: '8px',
                }}>
                  {this.state.error.toString()}
                </div>
                {this.state.errorInfo && (
                  <div style={{
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    color: '#666',
                    whiteSpace: 'pre-wrap',
                    marginTop: '12px',
                    maxHeight: '200px',
                    overflow: 'auto',
                  }}>
                    {this.state.errorInfo.componentStack}
                  </div>
                )}
              </details>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={this.handleReset}
                style={{
                  padding: '12px 24px',
                  background: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Try Again
              </button>

              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '12px 24px',
                  background: '#fff',
                  color: '#3b82f6',
                  border: '2px solid #3b82f6',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Reload Page
              </button>
            </div>

            <p style={{
              fontSize: '0.9rem',
              color: '#999',
              marginTop: '24px',
            }}>
              If this problem persists, please refresh the page or report the issue.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
