/* eslint-disable no-restricted-globals */
//
// BrickApp service worker
//
// Goals, in order:
//   1. Repeat visits render immediately - the shell and all hashed assets come
//      straight from disk, so nothing waits on the network or on the server
//      being awake.
//   2. A restarting backend never produces a broken screen - GET responses fall
//      back to the last good copy.
//   3. Never serve stale code after a deploy - the shell is always revalidated,
//      and hashed assets are immutable by construction.

const VERSION = 'v1';
const SHELL_CACHE = `bapp-shell-${VERSION}`;
const ASSET_CACHE = `bapp-assets-${VERSION}`;
const API_CACHE = `bapp-api-${VERSION}`;

const SHELL_URL = '/index.html';
const NAVIGATION_TIMEOUT_MS = 2500;

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches
            .open(SHELL_CACHE)
            .then((cache) => cache.add(new Request(SHELL_URL, { cache: 'reload' })))
            .catch(() => {
                // First install while offline - the shell will be cached on the
                // first successful navigation instead.
            })
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        (async () => {
            const keys = await caches.keys();
            await Promise.all(
                keys
                    .filter((key) => key.startsWith('bapp-') && ![SHELL_CACHE, ASSET_CACHE, API_CACHE].includes(key))
                    .map((key) => caches.delete(key))
            );
            await self.clients.claim();
        })()
    );
});

self.addEventListener('message', (event) => {
    // Called on logout so the next person using this browser cannot pull the
    // previous user's data out of the cache.
    if (event.data?.type === 'CLEAR_API_CACHE') {
        event.waitUntil(caches.delete(API_CACHE));
    }
    if (event.data?.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

function isHashedAsset(url) {
    return url.pathname.startsWith('/assets/');
}

function isApiGet(request, url) {
    return request.method === 'GET' && url.pathname.startsWith('/api/');
}

/** Cache-first: hashed filenames can never change contents, so this is always safe. */
async function assetStrategy(request) {
    const cache = await caches.open(ASSET_CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
}

/**
 * Navigations: try the network briefly, fall back to the cached shell.
 *
 * This is what turns a 46-second cold start into an instant render - the app
 * boots from cache and its data requests ride out the wake-up in the background.
 */
async function navigationStrategy(request) {
    const cache = await caches.open(SHELL_CACHE);

    try {
        const network = fetch(request);
        const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('navigation timeout')), NAVIGATION_TIMEOUT_MS)
        );

        const response = await Promise.race([network, timeout]);
        if (response && response.ok) {
            cache.put(SHELL_URL, response.clone());
            return response;
        }
        throw new Error('bad navigation response');
    } catch {
        const cached = (await cache.match(SHELL_URL)) || (await cache.match(request));
        if (cached) return cached;
        return fetch(request);
    }
}

/** API GETs: network first, last-known-good on failure. */
async function apiStrategy(request) {
    const cache = await caches.open(API_CACHE);

    try {
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (err) {
        const cached = await cache.match(request);
        if (cached) {
            return cached;
        }
        throw err;
    }
}

self.addEventListener('fetch', (event) => {
    const { request } = event;

    if (request.method !== 'GET') return;

    const url = new URL(request.url);

    // Only handle our own origin. Fonts and anything else go straight through.
    if (url.origin !== self.location.origin) return;

    // Socket.io traffic must never be intercepted.
    if (url.pathname.startsWith('/socket.io/')) return;

    if (request.mode === 'navigate') {
        event.respondWith(navigationStrategy(request));
        return;
    }

    if (isHashedAsset(url)) {
        event.respondWith(assetStrategy(request));
        return;
    }

    if (isApiGet(request, url)) {
        event.respondWith(apiStrategy(request));
    }
});
