// Service Worker para Cache de Rechequeos
// Chequeo Digital - Optimización de Performance

const CACHE_NAME = 'chequeo-digital-v1'
const RECHEQUEOS_CACHE = 'rechequeos-api-v1'

// URLs a cachear automáticamente al instalar
const STATIC_CACHE_URLS = [
  '/',
  '/rechequeos'
]

// Tiempo de vida del cache (30 minutos)
const CACHE_TTL = 30 * 60 * 1000

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets')
      return cache.addAll(STATIC_CACHE_URLS)
    })
  )
  self.skipWaiting()
})

// Activar Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Eliminar caches antiguos
          if (cacheName !== CACHE_NAME && cacheName !== RECHEQUEOS_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Interceptar requests
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Solo cachear APIs de rechequeos
  if (url.pathname.startsWith('/api/rechequeos')) {
    event.respondWith(cacheFirstStrategy(request))
  }
  // Para otras URLs, network first
  else if (request.method === 'GET') {
    event.respondWith(networkFirstStrategy(request))
  }
})

// Estrategia: Cache First (para APIs de rechequeos)
async function cacheFirstStrategy(request) {
  const cache = await caches.open(RECHEQUEOS_CACHE)
  const cachedResponse = await cache.match(request)

  // Verificar si el cache es válido (no expiró)
  if (cachedResponse) {
    const cacheTime = cachedResponse.headers.get('sw-cache-time')
    if (cacheTime) {
      const age = Date.now() - parseInt(cacheTime)
      if (age < CACHE_TTL) {
        console.log('[SW] ✅ Cache HIT:', request.url)
        return cachedResponse
      } else {
        console.log('[SW] ⏰ Cache expired:', request.url)
      }
    }
  }

  // Si no hay cache o expiró, hacer fetch
  console.log('[SW] 🌐 Fetching from network:', request.url)
  try {
    const networkResponse = await fetch(request)
    
    // Solo cachear respuestas OK
    if (networkResponse && networkResponse.status === 200) {
      // Clonar response y agregar timestamp
      const responseToCache = networkResponse.clone()
      const headers = new Headers(responseToCache.headers)
      headers.append('sw-cache-time', Date.now().toString())
      
      const modifiedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      })
      
      cache.put(request, modifiedResponse)
      console.log('[SW] 💾 Cached response:', request.url)
    }
    
    return networkResponse
  } catch (error) {
    console.error('[SW] ❌ Network error:', error)
    
    // Si falla la red, intentar devolver cache aunque esté expirado
    if (cachedResponse) {
      console.log('[SW] 🔄 Returning expired cache as fallback')
      return cachedResponse
    }
    
    // Si no hay cache, devolver error
    return new Response('Network error', {
      status: 408,
      headers: { 'Content-Type': 'text/plain' }
    })
  }
}

// Estrategia: Network First (para otras URLs)
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request)
    
    // Cachear si es exitoso
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    // Si falla, intentar desde cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      console.log('[SW] 🔄 Network failed, using cache:', request.url)
      return cachedResponse
    }
    
    return new Response('Network error', {
      status: 408,
      headers: { 'Content-Type': 'text/plain' }
    })
  }
}

// Limpiar cache periódicamente (cada hora)
setInterval(() => {
  console.log('[SW] 🧹 Cleaning expired cache entries...')
  caches.open(RECHEQUEOS_CACHE).then((cache) => {
    cache.keys().then((requests) => {
      requests.forEach((request) => {
        cache.match(request).then((response) => {
          if (response) {
            const cacheTime = response.headers.get('sw-cache-time')
            if (cacheTime) {
              const age = Date.now() - parseInt(cacheTime)
              if (age > CACHE_TTL) {
                console.log('[SW] 🗑️ Removing expired cache:', request.url)
                cache.delete(request)
              }
            }
          }
        })
      })
    })
  })
}, 60 * 60 * 1000) // 1 hora

