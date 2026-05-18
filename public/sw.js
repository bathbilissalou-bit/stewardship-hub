// Bump version on every deploy — clients drop old caches and install fresh.
const CACHE_NAME = 'stewardship-hub-v16'

// App shell: pre-cached on install so the app starts offline immediately.
const SHELL = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
]

self.addEventListener('install', event => {
  // Activate immediately — don't wait for old tabs to close
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SHELL))
      .catch(() => {}) // non-fatal: shell cache fails gracefully
  )
})

self.addEventListener('activate', event => {
  // Delete ONLY old caches — keep current CACHE_NAME intact
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)

  // Never intercept Supabase traffic (REST, auth, storage, realtime, functions).
  // Use early return — do NOT call event.respondWith() for these.
  if (url.hostname === 'supabase.co' || url.hostname.endsWith('.supabase.co')) return

  if (event.request.method !== 'GET') return

  // JS/CSS bundles: always fetch fresh — never serve stale code
  if (url.pathname.startsWith('/assets/') || url.hostname.includes('anthropic')) {
    event.respondWith(fetch(event.request))
    return
  }

  // Navigation requests (page loads): network-first, fall back to cached '/'
  // so the app shell opens offline even on a deep URL like /budget.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          const clone = res.clone()
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone))
          return res
        })
        .catch(async () => {
          const cached = await caches.match(event.request)
          return cached || caches.match('/') // offline: serve app shell
        })
    )
    return
  }

  // Everything else (icons, manifest, fonts): network-first, cache as fallback
  event.respondWith(
    fetch(event.request)
      .then(res => {
        const clone = res.clone()
        caches.open(CACHE_NAME).then(c => c.put(event.request, clone))
        return res
      })
      .catch(() => caches.match(event.request))
  )
})
