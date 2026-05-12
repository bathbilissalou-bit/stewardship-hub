import { withTimeout } from './promise-timeout'

/** Remove Supabase Gotrue keys from localStorage (does not nuke theme/lang). */
function stripSupabaseKeysFromStorage() {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i)
      if (k && (k.startsWith('sb-') || k.includes('supabase')))
        localStorage.removeItem(k)
    }
  } catch (_) { /* quota / private mode */ }
}

/**
 * Reliable sign-out path: bounded wait on SDK, then purge auth storage and hard-navigate.
 * Does not rely on network finishing after timeout.
 */
export async function hardLocalLogout(supabase, redirectTo = '/login') {
  try {
    await withTimeout(Promise.resolve(supabase.auth.signOut({ scope: 'local' })), 3500, 'signOut')
  } catch (e) {
    console.warn('[SH logout] local signOut timeout or error — stripping storage anyway', e?.message)
  }
  stripSupabaseKeysFromStorage()
  const path = redirectTo.startsWith('/') ? redirectTo : `/${redirectTo}`
  window.location.assign(path)
}

/**
 * Diagnostics / emergency — full wipe (+ optional SW unregister), redirect to login.
 */
export async function forceResetClientApp(supabase) {
  try {
    await withTimeout(Promise.resolve(supabase.auth.signOut({ scope: 'local' })), 2000, 'signOut-reset')
  } catch (_) { /* ignore */ }

  if ('serviceWorker' in navigator) {
    try {
      const regs = await navigator.serviceWorker.getRegistrations()
      for (const r of regs) await r.unregister()
    } catch (_) { /* ignore */ }
  }

  try {
    localStorage.clear()
    sessionStorage.clear()
  } catch (_) { /* ignore */ }

  window.location.assign('/login')
}
