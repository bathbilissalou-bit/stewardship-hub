// Bump version on every deploy so clients drop old caches and install fresh logic.
const CACHE_NAME = 'stewardship-hub-v15'

self.addEventListener('install', event => {
  // Activate immediately — don't wait for old tabs to close
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  // Delete ALL old caches so stale JS is never served; claim clients so new SW applies
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => caches.delete(key)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)

  // Never intercept Supabase traffic (all HTTP methods including OPTIONS preflight).
  // Same host serves: /rest/v1, /auth/v1, /storage/v1, /realtime/v1, /functions/v1
  // — must bypass with early return only; do NOT call event.respondWith().
  if (
    url.hostname === "supabase.co" ||
    url.hostname.endsWith(".supabase.co")
  ) {
    return
  }

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
