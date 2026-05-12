/** Seconds before JWT exp to prefer refresh over using access token as-is */
const EXPIRY_BUFFER_SEC = 90

/**
 * If access token expired or nearly expired, refresh; on failure clears auth storage locally.
 */
export async function refreshOrSignOut(supabase) {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) {
    await supabase.auth.signOut({ scope: 'local' })
    return { session: null, reason: 'getSession_error' }
  }
  if (!session) return { session: null, reason: 'no_session' }

  const now = Math.floor(Date.now() / 1000)
  const exp = session.expires_at ?? 0
  if (exp >= now + EXPIRY_BUFFER_SEC) return { session, reason: 'fresh' }

  const { data: ref, error: refErr } = await supabase.auth.refreshSession()
  if (refErr || !ref.session) {
    await supabase.auth.signOut({ scope: 'local' })
    return { session: null, reason: 'refresh_failed' }
  }
  return { session: ref.session, reason: 'refreshed' }
}

/** Optional: refresh when user returns to the tab after leaving it idle. */
export function subscribeForegroundSessionRefresh(supabase, options = {}) {
  const handler = async () => {
    if (document.visibilityState !== 'visible') return
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.refresh_token) return
    await supabase.auth.refreshSession().catch(async () => {
      await supabase.auth.signOut({ scope: 'local' })
      if (typeof options.onSignedOut === 'function') options.onSignedOut()
    })
  }
  document.addEventListener('visibilitychange', handler)
  return () => document.removeEventListener('visibilitychange', handler)
}
