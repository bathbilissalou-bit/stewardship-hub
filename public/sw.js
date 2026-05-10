// Bump version on every deploy to force cache clear
const CACHE_NAME = 'stewardship-hub-v7'

self.addEventListener('install', event => {
  // Activate immediately — don't wait for old tabs to close
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  // Delete ALL old caches so stale JS is never served
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => caches.delete(key)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)

  // Skip SW handling: browser uses normal network for Supabase (/rest/v1, /auth/v1, etc.).
  // Do not call respondWith() — that yields the default fetch (same idea as “direct to network”).
  // Use ".supabase.co" so we don’t match hostnames like "notsupabase.co".
  if (url.hostname === 'supabase.co' || url.hostname.endsWith('.supabase.co')) return

  if (event.request.method !== 'GET') return

  // Never cache JS/CSS bundles or third-party APIs — always fetch fresh from network
  if (url.pathname.includes('/assets/') || url.hostname.includes('anthropic')) {
    event.respondWith(fetch(event.request))
    return
  }

  // For everything else: network first, cache as offline fallback only
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const clone = response.clone()
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
        return response
      })
      .catch(() => caches.match(event.request))
  )
})
