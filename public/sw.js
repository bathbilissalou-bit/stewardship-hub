// Bump version on every deploy to force cache clear
const CACHE_NAME = 'stewardship-hub-v4'

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
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)

  // Never cache JS/CSS bundles or API calls — always fetch fresh from network
  if (
    url.pathname.includes('/assets/') ||
    url.hostname.includes('supabase') ||
    url.hostname.includes('anthropic')
  ) {
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
