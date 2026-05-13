/* ═══════════════════════════════════════════════
   NutriVerse AI — Service Worker
   Offline-first caching + installable PWA
   ═══════════════════════════════════════════════ */

const CACHE_NAME = 'nutriverse-v2'
const OFFLINE_URL = 'offline.html'

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/nutriverse.css',
  '/nutriverse.js',
  '/offline.html',
  'https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap'
]

// Install — precache shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_URLS).catch(err => {
        console.warn('Precache partial failure:', err)
      })
    })
  )
  self.skipWaiting()
})

// Activate — clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch — network-first for API calls, cache-first for assets
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)

  // Never cache API calls (Groq, etc.)
  if (url.hostname.includes('groq.com') || url.hostname.includes('googleapis.com/identitytoolkit')) {
    return
  }

  // For navigation requests, try network then fallback to cache/offline
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
          return response
        })
        .catch(() =>
          caches.match(event.request).then(cached => cached || caches.match(OFFLINE_URL))
        )
    )
    return
  }

  // For other requests: stale-while-revalidate
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
          }
          return response
        })
        .catch(() => cached)

      return cached || fetchPromise
    })
  )
})
