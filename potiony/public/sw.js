/*
 * Potiony offline cache.
 *
 * The whole game is static files with content-hashed names, so the rules are simple:
 *  - navigations: network first, fall back to the cached shell when offline
 *  - everything else same-origin: cache first, because a hashed URL never changes
 * Bump CACHE_VERSION to evict everything after a release.
 */
const CACHE_VERSION = 'potiony-v1'
const SHELL = ['./', './index.html', './manifest.webmanifest', './favicon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          void caches.open(CACHE_VERSION).then((cache) => cache.put('./index.html', copy))
          return response
        })
        .catch(() => caches.match('./index.html').then((hit) => hit ?? Response.error())),
    )
    return
  }

  event.respondWith(
    caches.match(request).then((hit) => {
      if (hit) return hit
      return fetch(request).then((response) => {
        if (response.ok && response.type === 'basic') {
          const copy = response.clone()
          void caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy))
        }
        return response
      })
    }),
  )
})
