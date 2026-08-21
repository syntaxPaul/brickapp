// backend/src/middleware/microCache.js
//
// A very small in-process response cache for read-only endpoints.
//
// Purpose: dashboard and list endpoints are expensive (multi-table aggregates)
// but their answers are identical for every request from the same user/branch
// within a few seconds. Caching them briefly turns a repeat visit to a screen
// into an instant response instead of another round of aggregate queries.
//
// Deliberately scoped per user AND per branch so one tenant can never be served
// another's data. Only GET requests are cached, and any non-GET on the same
// resource family clears it.

const store = new Map();

const now = () => Date.now();

function makeKey(req) {
    const userId = req.user?.id ?? 'anon';
    const branch = req.headers['x-branch-id'] ?? 'default';
    return `${userId}:${branch}:${req.originalUrl}`;
}

/**
 * @param {number} ttlMs how long a cached body stays fresh
 */
function microCache(ttlMs = 15000) {
    return function microCacheMiddleware(req, res, next) {
        if (req.method !== 'GET') return next();

        const key = makeKey(req);
        const hit = store.get(key);

        if (hit && hit.expires > now()) {
            res.set('X-Cache', 'HIT');
            return res.status(hit.status).json(hit.body);
        }

        res.set('X-Cache', 'MISS');

        const originalJson = res.json.bind(res);
        res.json = (body) => {
            // Only cache successful responses. Caching an error would pin a
            // transient failure in place for the whole TTL.
            if (res.statusCode >= 200 && res.statusCode < 300) {
                store.set(key, { body, status: res.statusCode, expires: now() + ttlMs });
            }
            return originalJson(body);
        };

        next();
    };
}

/** Drop every cached entry for a user (call after any write they make). */
function invalidateUser(userId) {
    const prefix = `${userId}:`;
    for (const key of store.keys()) {
        if (key.startsWith(prefix)) store.delete(key);
    }
}

/** Drop everything. Used on writes that can affect aggregate figures. */
function invalidateAll() {
    store.clear();
}

/**
 * Mounted after the write routes: any successful mutation invalidates the
 * cache so the next read reflects it immediately. Without this, a user could
 * add an order and not see it for up to the TTL.
 */
function invalidateOnWrite(req, res, next) {
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next();

    res.on('finish', () => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
            invalidateAll();
        }
    });
    next();
}

// Opportunistic sweep so the map cannot grow without bound on a long-lived worker.
const sweep = setInterval(() => {
    const t = now();
    for (const [key, value] of store.entries()) {
        if (value.expires <= t) store.delete(key);
    }
}, 60000);
sweep.unref();

module.exports = { microCache, invalidateUser, invalidateAll, invalidateOnWrite };
