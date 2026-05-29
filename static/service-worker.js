const CACHE_NAME = 'salisikhay-v1';
const RUNTIME_CACHE = 'salisikhay-runtime';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/dashboard.html',
    '/quiz.html',
    '/results.html',
    '/static/style.css',
    '/static/app.js',
    '/static/dashboard.js',
    '/static/quiz.js',
    '/static/results.js',
    '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Caching static assets');
            return cache.addAll(STATIC_ASSETS).catch(err => {
                console.log('Some assets failed to cache:', err);
            });
        })
    );
    
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    
    self.clients.claim();
});

// Fetch event - cache strategy
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // API requests - network first, fallback to cache
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    if (response.ok) {
                        // Cache successful API responses
                        const cache = caches.open(RUNTIME_CACHE);
                        cache.then(c => c.put(request, response.clone()));
                    }
                    return response;
                })
                .catch(() => {
                    // Fallback to cached API response if available
                    return caches.match(request);
                })
        );
        return;
    }

    // Static assets - cache first
    if (STATIC_ASSETS.some(asset => request.url.includes(asset))) {
        event.respondWith(
            caches.match(request)
                .then(response => response || fetch(request))
                .catch(() => {
                    // Fallback for failed requests
                    if (request.destination === 'document') {
                        return caches.match('/index.html');
                    }
                })
        );
        return;
    }

    // Other resources - stale while revalidate
    event.respondWith(
        caches.match(request)
            .then(response => {
                const fetchPromise = fetch(request)
                    .then(networkResponse => {
                        if (networkResponse && networkResponse.status === 200) {
                            const cache = caches.open(RUNTIME_CACHE);
                            cache.then(c => c.put(request, networkResponse.clone()));
                        }
                        return networkResponse;
                    })
                    .catch(() => response);

                return response || fetchPromise;
            })
            .catch(() => {
                return new Response('Offline - Resource not available', {
                    status: 503,
                    statusText: 'Service Unavailable',
                    headers: new Headers({
                        'Content-Type': 'text/plain'
                    })
                });
            })
    );
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-quiz-attempts') {
        event.waitUntil(syncQuizAttempts());
    }
});

async function syncQuizAttempts() {
    try {
        const cache = await caches.open(RUNTIME_CACHE);
        const requests = await cache.keys();
        
        for (const request of requests) {
            if (request.url.includes('/quiz/attempt')) {
                try {
                    const response = await fetch(request);
                    if (response.ok) {
                        await cache.put(request, response);
                    }
                } catch (err) {
                    console.log('Sync failed for:', request.url);
                }
            }
        }
    } catch (err) {
        console.log('Background sync error:', err);
    }
}

// Handle messages from clients
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.delete(RUNTIME_CACHE);
    }
});
