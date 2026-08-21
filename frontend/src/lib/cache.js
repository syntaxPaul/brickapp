// frontend/src/lib/cache.js
//
// A small persisted cache that lets every screen paint instantly.
//
// The pattern is stale-while-revalidate: render whatever we showed last time
// straight away, then quietly fetch fresh data and swap it in. The user never
// waits on a spinner for a screen they have already visited, and if the backend
// is momentarily down they still see their data instead of an error.
//
// Cache entries are namespaced by user and branch so switching either can never
// show one context's data in another's.

const VERSION = 'v1';
const PREFIX = `bapp:cache:${VERSION}:`;

// Anything larger than this is kept in memory only. Writing megabyte payloads
// to localStorage blocks the main thread and risks a quota exception.
const MAX_PERSIST_BYTES = 256 * 1024;

const memory = new Map();

function scope() {
    const branch = localStorage.getItem('currentBranch') || 'default';
    const user = localStorage.getItem('userId') || 'anon';
    return `${user}:${branch}`;
}

function storageKey(key) {
    return `${PREFIX}${scope()}:${key}`;
}

/** Read a cached entry. Returns { data, savedAt } or null. */
export function readCache(key) {
    const full = storageKey(key);

    const hit = memory.get(full);
    if (hit) return hit;

    try {
        const raw = localStorage.getItem(full);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        memory.set(full, parsed);
        return parsed;
    } catch {
        // Corrupt or unreadable entry - treat as a miss rather than throwing.
        return null;
    }
}

/** Write an entry to the cache. */
export function writeCache(key, data) {
    const full = storageKey(key);
    const entry = { data, savedAt: Date.now() };

    memory.set(full, entry);

    try {
        const serialized = JSON.stringify(entry);
        if (serialized.length <= MAX_PERSIST_BYTES) {
            localStorage.setItem(full, serialized);
        }
    } catch (err) {
        // Quota exceeded, or private-mode storage. Drop the oldest persisted
        // entries and give up quietly - the in-memory copy still works.
        pruneOldest();
    }
}

function pruneOldest() {
    try {
        const entries = [];
        for (let i = 0; i < localStorage.length; i += 1) {
            const k = localStorage.key(i);
            if (k && k.startsWith(PREFIX)) {
                try {
                    const { savedAt } = JSON.parse(localStorage.getItem(k)) || {};
                    entries.push([k, savedAt || 0]);
                } catch {
                    entries.push([k, 0]);
                }
            }
        }
        entries.sort((a, b) => a[1] - b[1]);
        entries.slice(0, Math.ceil(entries.length / 2)).forEach(([k]) => localStorage.removeItem(k));
    } catch {
        /* nothing more we can do */
    }
}

/**
 * Remove every cached entry. Called on logout so the next person to use the
 * browser cannot see the previous user's figures.
 */
export function clearCache() {
    memory.clear();
    try {
        const doomed = [];
        for (let i = 0; i < localStorage.length; i += 1) {
            const k = localStorage.key(i);
            if (k && k.startsWith(PREFIX)) doomed.push(k);
        }
        doomed.forEach((k) => localStorage.removeItem(k));
    } catch {
        /* ignore */
    }
}
