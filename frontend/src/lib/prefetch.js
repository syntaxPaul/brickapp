// frontend/src/lib/prefetch.js
//
// Navigation should feel like the page was already there, because it was.
//
// Two levels of warming:
//   - On hover / touch-start of a nav link, load that route's chunk and its
//     first data call. A user takes 100-300ms between hovering and clicking,
//     which is usually enough to have both in hand.
//   - During idle time after first paint, quietly pull in the remaining routes,
//     so even a cold click on an unhovered link has nothing to download.
//
// Everything here is best-effort. A failed prefetch is silent; the real
// navigation still goes through lazyWithRetry.

import { routeImporters, routeData } from '../routes';
import { preloadImporter, } from './lazyWithRetry';
import { getJSON } from './http';
import { readCache, writeCache } from './cache';

const warmedChunks = new Set();
const warmedData = new Set();

export function prefetchRoute(path) {
    const importer = routeImporters[path];
    if (importer && !warmedChunks.has(path)) {
        warmedChunks.add(path);
        preloadImporter(importer);
    }
}

export function prefetchRouteData(path) {
    const urls = routeData[path];
    if (!urls) return;

    urls.forEach((url) => {
        if (warmedData.has(url)) return;

        // Skip anything we already have fresh in cache - no point spending a
        // request on data the page will render from memory anyway.
        const cached = readCache(url);
        if (cached && Date.now() - cached.savedAt < 15000) return;

        warmedData.add(url);
        getJSON(url)
            .then((data) => writeCache(url, data))
            .catch(() => {
                // Let it be retried on real navigation.
                warmedData.delete(url);
            });
    });
}

/** Warm both code and data for a route. Safe to call repeatedly. */
export function prefetch(path) {
    prefetchRoute(path);
    prefetchRouteData(path);
}

/**
 * Props to spread onto a nav link. Covers mouse, keyboard and touch so the
 * warming happens on every input method, not just hover.
 */
export function prefetchHandlers(path) {
    const trigger = () => prefetch(path);
    return {
        onMouseEnter: trigger,
        onFocus: trigger,
        onTouchStart: trigger,
    };
}

/**
 * After the app has settled, pull in the rest of the routes during idle time.
 * Staggered so the browser never has more than one speculative download in
 * flight competing with real work.
 */
export function prefetchAllWhenIdle(currentPath = '/') {
    const schedule =
        typeof window.requestIdleCallback === 'function'
            ? window.requestIdleCallback
            : (fn) => setTimeout(fn, 1200);

    // Never speculate on a metered or very slow connection - the user is paying
    // for those bytes and would rather have them spent on demand.
    const connection = navigator.connection;
    if (connection?.saveData) return;
    if (connection?.effectiveType && /(^|\W)(slow-)?2g$/.test(connection.effectiveType)) return;

    const paths = Object.keys(routeImporters).filter((p) => p !== currentPath);

    let index = 0;
    const pump = () => {
        if (index >= paths.length) return;
        const path = paths[index];
        index += 1;
        prefetchRoute(path);
        schedule(pump, { timeout: 2000 });
    };

    schedule(pump, { timeout: 2000 });
}
