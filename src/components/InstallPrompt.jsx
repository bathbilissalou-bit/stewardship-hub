import { useState, useEffect } from 'react'

const DISMISSED_KEY = 'sh_install_dismissed'
const DISMISS_MS = 14 * 24 * 60 * 60 * 1000 // 14 days

function wasDismissed() {
  try {
    const ts = localStorage.getItem(DISMISSED_KEY)
    return ts ? Date.now() - Number(ts) < DISMISS_MS : false
  } catch { return false }
}

function markDismissed() {
  try { localStorage.setItem(DISMISSED_KEY, String(Date.now())) } catch {}
}

function isStandalone() {
  if (typeof window === 'undefined') return false
  if (window.navigator.standalone) return true
  try { return window.matchMedia('(display-mode: standalone)').matches } catch { return false }
}

function isIOSSafari() {
  const ua = navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) && /WebKit/.test(ua) && !/CriOS|FxiOS|OPiOS|mercury/.test(ua)
}

export default function InstallPrompt() {
  const [show, setShow] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [mode, setMode] = useState(null) // 'ios' | 'android'

  useEffect(() => {
    // Never show if already running as installed PWA
    if (isStandalone() || wasDismissed()) return

    // Android / Chrome: capture native install prompt
    const onBeforeInstall = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setMode('android')
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)

    // iOS Safari: show manual "Add to Home Screen" hint after a short delay
    if (isIOSSafari()) {
      const t = setTimeout(() => {
        if (!isStandalone() && !wasDismissed()) {
          setMode('ios')
          setShow(true)
        }
      }, 4000)
      return () => {
        clearTimeout(t)
        window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      }
    }

    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  }, [])

  function dismiss() {
    markDismissed()
    setShow(false)
  }

  async function handleInstall() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setShow(false)
    if (outcome === 'accepted') markDismissed()
  }

  if (!show) return null

  return (
    <>
      <style>{`
        @keyframes sh-slide-up {
          from { transform: translateY(100%); opacity: 0 }
          to   { transform: translateY(0);    opacity: 1 }
        }
      `}</style>
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
        background: 'linear-gradient(135deg, #1D9E75 0%, #0F6E56 100%)',
        color: 'white',
        padding: '14px 16px',
        paddingBottom: 'calc(14px + env(safe-area-inset-bottom, 0px))',
        display: 'flex', alignItems: 'flex-start', gap: 12,
        boxShadow: '0 -4px 32px rgba(0,0,0,0.25)',
        animation: 'sh-slide-up 0.35s cubic-bezier(0.16,1,0.3,1)',
      }}>
        {/* Icon */}
        <div style={{
          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
          background: 'rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22,
        }}>✦</div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 2, letterSpacing: '-0.2px' }}>
            Install StewardHub
          </div>
          {mode === 'ios' ? (
            <div style={{ fontSize: 12, opacity: 0.88, lineHeight: 1.55 }}>
              Tap <strong>Share</strong> <span style={{ fontSize: 15, verticalAlign: 'middle' }}>⎋</span> at the bottom, then{' '}
              <strong>"Add to Home Screen"</strong> for the full app experience.
            </div>
          ) : (
            <>
              <div style={{ fontSize: 12, opacity: 0.88, marginBottom: 10 }}>
                Get the full app — works offline, no app store needed.
              </div>
              <button
                onClick={handleInstall}
                style={{
                  padding: '7px 18px', background: 'white',
                  color: '#0F6E56', border: 'none', borderRadius: 8,
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  letterSpacing: '0.01em',
                }}
              >
                Install App
              </button>
            </>
          )}
        </div>

        {/* Dismiss */}
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          style={{
            background: 'rgba(255,255,255,0.15)', border: 'none',
            color: 'white', width: 28, height: 28, borderRadius: '50%',
            fontSize: 14, cursor: 'pointer', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >✕</button>
      </div>
    </>
  )
}
