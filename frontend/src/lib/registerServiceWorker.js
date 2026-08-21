// frontend/src/lib/registerServiceWorker.js

let registration = null;

export function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    // Only in production builds: a service worker in front of the dev server
    // makes hot reload behave unpredictably.
    if (!import.meta.env.PROD) return;

    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/sw.js')
            .then((reg) => {
                registration = reg;

                // When a new build is deployed, activate it as soon as it is
                // ready rather than waiting for every tab to close. Combined
                // with lazyWithRetry this makes deploys invisible to users.
                reg.addEventListener('updatefound', () => {
                    const installing = reg.installing;
                    if (!installing) return;
                    installing.addEventListener('statechange', () => {
                        if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                            installing.postMessage({ type: 'SKIP_WAITING' });
                        }
                    });
                });

                // Check for a new build periodically so long-lived tabs pick up
                // deploys without needing a manual refresh.
                setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
            })
            .catch(() => {
                // A failed registration is never fatal - the app works without it.
            });
    });
}

/** Wipe cached API responses. Called on logout. */
export function clearApiCache() {
    try {
        navigator.serviceWorker?.controller?.postMessage({ type: 'CLEAR_API_CACHE' });
    } catch {
        /* ignore */
    }
}

export function getRegistration() {
    return registration;
}
