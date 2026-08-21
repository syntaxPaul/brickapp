// frontend/src/lib/lazyWithRetry.js
//
// React.lazy has no failure story. If the chunk request fails - which is exactly
// what happens while the server is restarting, or right after a deploy replaced
// the hashed filenames - the promise rejects, React unmounts the tree, and the
// user is left staring at a white page with no way forward.
//
// This wrapper makes that failure invisible:
//   1. Retry the import a few times with backoff. Restart windows are short, so
//      most failures resolve on attempt two or three.
//   2. If it still fails, assume the build changed underneath us and reload the
//      page once to pick up the new index.html. A sessionStorage flag makes sure
//      that can only ever happen once, so a genuinely missing chunk cannot put
//      the app into a reload loop.

import { lazy } from 'react';

const RELOAD_FLAG = 'bapp:chunk-reload';
const MAX_ATTEMPTS = 4;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function isChunkLoadError(error) {
    const message = String(error?.message || error || '');
    return (
        message.includes('Failed to fetch dynamically imported module') ||
        message.includes('Importing a module script failed') ||
        message.includes('error loading dynamically imported module') ||
        message.includes('Loading chunk')
    );
}

/**
 * @param {() => Promise<any>} importer the `() => import('./Page')` callback
 */
export function lazyWithRetry(importer) {
    return lazy(async () => {
        let lastError;

        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
            try {
                const module = await importer();

                // We got here, so the app is healthy. Clear the reload guard so
                // a future deploy is allowed its own single reload.
                try {
                    sessionStorage.removeItem(RELOAD_FLAG);
                } catch {
                    /* private mode - not important */
                }

                return module;
            } catch (error) {
                lastError = error;

                if (!isChunkLoadError(error)) throw error;

                if (attempt < MAX_ATTEMPTS - 1) {
                    // 300ms, 600ms, 1200ms - covers a typical restart blip.
                    await sleep(300 * 2 ** attempt);
                }
            }
        }

        // Every retry failed. The most likely cause now is a deploy that
        // replaced the asset hashes while this tab was open, so the chunk this
        // page is asking for genuinely no longer exists. A reload fixes it.
        let alreadyReloaded = false;
        try {
            alreadyReloaded = sessionStorage.getItem(RELOAD_FLAG) === '1';
            if (!alreadyReloaded) sessionStorage.setItem(RELOAD_FLAG, '1');
        } catch {
            /* ignore */
        }

        if (!alreadyReloaded) {
            window.location.reload();
            // Return a never-resolving promise so React does not render a
            // failure state during the moment before the reload takes effect.
            return new Promise(() => {});
        }

        throw lastError;
    });
}

/**
 * Kick off a chunk download without rendering it. Used to warm routes on hover
 * and during idle time so navigation has nothing left to download.
 */
export function preloadImporter(importer) {
    try {
        const result = importer();
        if (result && typeof result.catch === 'function') {
            // A failed prefetch is never worth surfacing - the real navigation
            // will retry through lazyWithRetry.
            result.catch(() => {});
        }
    } catch {
        /* ignore */
    }
}
