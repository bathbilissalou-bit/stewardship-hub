import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getSupabaseBuildConfig } from '../lib/supabase-config'
import { supabase } from '../lib/supabase'

const EXPECT_ROOT_ANON_NOTE =
  'Note: GET /rest/v1/ root with anon Bearer often returns 401 + "service_role". That confirms reachability — not wrong anon key for normal table routes.'

async function probeRestRoot(baseUrl, anonKey) {
  const urlObj = `${String(baseUrl).replace(/\/$/, '')}/rest/v1/`
  const ctl = typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(20000) : undefined
  const res = await fetch(urlObj, {
    method: 'GET',
    signal: ctl,
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
  })
  const text = await res.text()
  return { url: urlObj, status: res.status, ok: res.ok, body: text.slice(0, 2000) }
}

async function probeBudgetEntriesAuthorized(baseUrl, anonKey, accessToken) {
  const urlObj = `${String(baseUrl).replace(/\/$/, '')}/rest/v1/budget_entries?select=id&limit=1`
  const ctl = typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(20000) : undefined
  const res = await fetch(urlObj, {
    method: 'GET',
    signal: ctl,
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
  })
  const text = await res.text()
  return { url: urlObj, status: res.status, ok: res.ok, body: text.slice(0, 2000) }
}

export default function SupabaseDiagnostic() {
  const [lines, setLines] = useState([])
  const [running, setRunning] = useState(false)

  const cfg = getSupabaseBuildConfig()
  const { url, anonKey, envPresent, usingFallbackUrl, usingFallbackKey, mode } = cfg

  async function unregisterServiceWorkers(log) {
    if (!('serviceWorker' in navigator)) {
      log('SERVICE WORKERS: not supported')
      return
    }
    const regs = await navigator.serviceWorker.getRegistrations()
    log(`SERVICE WORKERS: ${regs.length} registration(s)`)
    for (const r of regs) {
      const ok = await r.unregister().catch(() => false)
      log('  unregister', r.scope, '→', ok ? 'ok' : 'failed')
    }
    log('SERVICE WORKERS: reload page; DevTools → Application should show no worker.')
  }

  async function run() {
    const out = []
    const log = (...a) => {
      const s = a.map(x => (typeof x === 'string' ? x : JSON.stringify(x))).join(' ')
      console.log('[SupabaseDiagnostic]', s)
      out.push(s)
    }

    log('━━━━ CONFIG ━━━━')
    log('MODE:', mode)
    log('SUPABASE URL:', url)
    log('ANON KEY LENGTH:', anonKey?.length ?? 0, anonKey?.length >= 100 && anonKey?.length <= 300 ? '(looks JWT-sized)' : '(unexpected length — check Vercel / truncation)')
    log('KEY PREFIX:', anonKey ? `${anonKey.slice(0, 20)}…` : '(none)')
    log('VITE_SUPABASE_URL set:', envPresent.VITE_SUPABASE_URL, '| VITE_SUPABASE_ANON_KEY set:', envPresent.VITE_SUPABASE_ANON_KEY)
    log('EXPO_PUBLIC_* (optional fallbacks only):', envPresent.EXPO_PUBLIC_SUPABASE_URL, envPresent.EXPO_PUBLIC_SUPABASE_ANON_KEY)
    log('Using URL fallback (no VITE/EXPO URL):', usingFallbackUrl, '| key fallback:', usingFallbackKey)
    log('Client uses anon key only (createClient second arg). Never use service_role in browser.')
    log('')
    log('━━━━ SERVICE WORKER ━━━━')
    await unregisterServiceWorkers(log)
    log('')

    const restUrl = `${String(url).replace(/\/$/, '')}/rest/v1/`
    log('━━━━ CONNECTIVITY (anon, root) ━━━━')
    log(EXPECT_ROOT_ANON_NOTE)
    log('REST FETCH URL:', restUrl)

    setLines([...out])
    setRunning(true)

    try {
      const result = await probeRestRoot(url, anonKey)
      log('REST STATUS:', result.status, 'OK:', result.ok)
      log('REST BODY:', result.body || '(empty)')
      log('')

      log('━━━━ AUTHENTICATED DB (session access token) ━━━━')
      const { data: sessionData, error: sessErr } = await supabase.auth.getSession()
      if (sessErr) {
        log('getSession error:', sessErr.message)
      }
      const access = sessionData?.session?.access_token
      const uid = sessionData?.session?.user?.id
      if (!access) {
        log('No active session — sign in, then re-run. Skipping budget_entries probe.')
      } else {
        log('user id:', uid)
        log('access_token prefix:', access.slice(0, 12) + '…')
        const row = await probeBudgetEntriesAuthorized(url, anonKey, access)
        log('GET', row.url)
        log('STATUS:', row.status, 'OK:', row.ok)
        log('BODY:', row.body || '(empty)')
        if (row.status === 401 && row.body?.includes('JWT expired')) {
          log('→ JWT expired: app will sign you out on next load / refresh; sign in again.')
        }
      }
    } catch (err) {
      log('FETCH ERROR:', err?.name, err?.message)
    } finally {
      setRunning(false)
      setLines([...out])
    }
  }

  return (
    <div style={{ minHeight:'100vh', padding:24, background:'var(--bg, #fafafa)', color:'var(--text, #111)', boxSizing:'border-box', maxWidth:720, margin:'0 auto' }}>
      <h1 style={{ fontSize:20, marginBottom:8 }}>Supabase diagnostic</h1>
      <p style={{ fontSize:14, color:'#666', marginBottom:16, lineHeight:1.5 }}>
        Checks service workers, anon reachability to <code style={{ fontSize:12 }}>/rest/v1/</code>, and an authenticated <code style={{ fontSize:12 }}>budget_entries</code> read. Open DevTools → Network → filter <code style={{ fontSize:12 }}>rest/v1</code>.
      </p>
      <button
        type="button"
        onClick={run}
        disabled={running}
        style={{ padding:'12px 18px', fontWeight:700, fontSize:15, borderRadius:10, border:'none', background:'#185FA5', color:'white', cursor: running ? 'wait' : 'pointer', marginBottom:16 }}
      >
        {running ? 'Running…' : 'Run full diagnostic'}
      </button>
      <div style={{ fontSize:12, fontFamily:'ui-monospace, monospace', background:'#1e1e2e', color:'#cdd6f4', padding:16, borderRadius:10, whiteSpace:'pre-wrap', wordBreak:'break-word', minHeight:120 }}>
        {lines.length ? lines.join('\n') : 'Click the button. Output mirrors the browser console.'}
      </div>
      <p style={{ marginTop:20, fontSize:13 }}>
        <Link to="/login" style={{ color:'#185FA5' }}>← Back to login</Link>
      </p>
    </div>
  )
}
