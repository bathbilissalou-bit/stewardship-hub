import { Component } from 'react'

const isDev = import.meta.env.DEV

const resetAppCache = async () => {
  try {
    localStorage.clear()
    sessionStorage.clear()

    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      for (const registration of registrations) {
        await registration.unregister()
      }
    }

    if ('caches' in window) {
      const names = await caches.keys()
      await Promise.all(names.map((name) => caches.delete(name)))
    }
  } catch (error) {
    console.error('Failed to clear app cache:', error)
  } finally {
    window.location.reload()
  }
}

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, info: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught error:', error)
    console.error('[ErrorBoundary] Component stack:', info?.componentStack)
    this.setState({ info })
  }

  render() {
    if (this.state.hasError) {
      const { error, info } = this.state
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '60vh', padding: '32px 24px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, color: 'var(--text, #2C2C2A)' }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted, #5F5E5A)', marginBottom: 24, maxWidth: 300 }}>
            This section ran into a problem. Your data is safe — try refreshing,
            or clear the app cache if the problem persists.
          </p>

          {isDev && error && (
            <pre style={{
              background: '#fee2e2', color: '#991b1b', borderRadius: 8,
              padding: '12px 16px', fontSize: 11, textAlign: 'left',
              maxWidth: 360, overflowX: 'auto', marginBottom: 20,
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {error.message}
              {info?.componentStack ? `\n\n${info.componentStack}` : ''}
            </pre>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 280 }}>
            <button
              onClick={() => this.setState({ hasError: false, error: null, info: null })}
              style={{
                padding: '12px 24px', background: 'var(--green, #1D9E75)', color: 'white',
                border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Try again
            </button>
            <button
              onClick={resetAppCache}
              style={{
                padding: '12px 24px', background: 'transparent', color: 'var(--text-muted, #5F5E5A)',
                border: '1px solid var(--border, rgba(0,0,0,0.1))', borderRadius: 10,
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Clear app cache &amp; reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
