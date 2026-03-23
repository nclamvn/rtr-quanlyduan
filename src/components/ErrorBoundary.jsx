import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

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

// Per-tab error boundary — shows inline error, doesn't kill the whole app
export class TabErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error(`[${this.props.name || 'Tab'}] Render error:`, error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      const isVi = this.props.lang === 'vi'
      return (
        <div style={{ background: 'var(--bg-card)', border: '1px solid #EF444430', borderRadius: 8, padding: 32, textAlign: 'center' }}>
          <AlertTriangle size={28} color="#EF4444" style={{ marginBottom: 10 }} />
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
            {isVi ? 'Module gặp lỗi' : 'Module Error'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 14 }}>
            {isVi
              ? `"${this.props.name || ''}" gặp lỗi. Các module khác vẫn hoạt động.`
              : `"${this.props.name || ''}" encountered an error. Other modules are unaffected.`}
          </div>
          {this.state.error && (
            <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: '#EF4444', background: '#EF444410', padding: '6px 10px', borderRadius: 4, marginBottom: 14, textAlign: 'left', maxHeight: 60, overflow: 'auto' }}>
              {this.state.error.message}
            </div>
          )}
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ background: '#1D4ED8', border: 'none', borderRadius: 4, padding: '7px 14px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <RefreshCw size={12} />
            {isVi ? 'Thử lại' : 'Try Again'}
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
