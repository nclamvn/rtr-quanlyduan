import { Component } from 'react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ControlTower] Render error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '100vh', padding: '2rem',
          fontFamily: 'system-ui, sans-serif', background: '#f9fafb',
        }}>
          <div style={{
            background: 'white', borderRadius: '12px', padding: '2rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)', maxWidth: '480px',
            textAlign: 'center',
          }}>
            <h2 style={{ margin: '0 0 0.5rem', color: '#dc2626' }}>
              Đã xảy ra lỗi / An error occurred
            </h2>
            <p style={{ color: '#6b7280', margin: '0 0 1.5rem' }}>
              Ứng dụng gặp sự cố không mong muốn. Vui lòng thử tải lại trang.<br />
              The application encountered an unexpected error. Please try reloading.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '0.5rem 1.25rem', borderRadius: '8px',
                  border: 'none', background: '#2563eb', color: 'white',
                  cursor: 'pointer', fontWeight: 500,
                }}
              >
                Tải lại / Reload
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                style={{
                  padding: '0.5rem 1.25rem', borderRadius: '8px',
                  border: '1px solid #d1d5db', background: 'white',
                  cursor: 'pointer', fontWeight: 500,
                }}
              >
                Thử lại / Retry
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
