// backend/src/lib/userCache.js
//
// Cache for the caller's profile (branches + roles).
//
// Why this exists: the auth middleware used to run a three-table join with two
// json_agg aggregations on EVERY authenticated request. A single dashboard load
// fired five requests in parallel and ran that query five times over.
//
// Why it lives here rather than inside the middleware: invalidation has to be
// callable from the model layer. Putting the cache in the middleware meant only
// the two controller methods that happened to remember could clear it, so any
// future code path that reassigns branches or roles would silently serve stale
// permissions for up to the TTL. The model is the chokepoint every write must
// pass through, so that is where invalidation belongs.

const { pool } = require('../config/database');

const TTL_MS = 30 * 1000;

const cache = new Map();

// Five parallel requests arriving on a cold cache should trigger one query, not
// five. Without this, the stampede on first load is the very thing we are
// trying to eliminate.
const inFlight = new Map();

const USER_QUERY = `
    SELECT u.id, u.username, u.email, u.full_name, u.phone, u.status,
           COALESCE(json_agg(DISTINCT jsonb_build_object('branch_id', bua.branch_id, 'is_primary', bua.is_primary)) FILTER (WHERE bua.branch_id IS NOT NULL), '[]') AS branches,
           COALESCE(json_agg(DISTINCT jsonb_build_object('branch_id', ur.branch_id, 'role', ur.role_name, 'permissions', ur.permissions)) FILTER (WHERE ur.branch_id IS NOT NULL), '[]') AS roles
    FROM users u
    LEFT JOIN branch_user_assignments bua ON u.id = bua.user_id
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    WHERE u.id = $1
    GROUP BY u.id
`;

// Ids arrive as numbers from JWTs and as strings from route params. Normalise so
// invalidate(req.params.id) always clears what load(decoded.id) stored.
const key = (id) => String(id);

async function loadUser(userId) {
    const k = key(userId);

    const hit = cache.get(k);
    if (hit && hit.expires > Date.now()) {
        return hit.user;
    }

    if (inFlight.has(k)) {
        return inFlight.get(k);
    }

    const promise = (async () => {
        const result = await pool.query(USER_QUERY, [userId]);
        const user = result.rows[0] || null;
        if (user) {
            cache.set(k, { user, expires: Date.now() + TTL_MS });
        }
        return user;
    })().finally(() => {
        inFlight.delete(k);
    });

    inFlight.set(k, promise);
    return promise;
}

/**
 * Drop a user's cached profile so a permission change takes effect on their very
 * next request rather than up to TTL_MS later.
 */
function invalidateUser(userId) {
    if (userId === undefined || userId === null) return;
    cache.delete(key(userId));
}

function clearUserCache() {
    cache.clear();
}

// Keep the map bounded on a long-lived worker.
const sweep = setInterval(() => {
    const now = Date.now();
    for (const [k, v] of cache.entries()) {
        if (v.expires <= now) cache.delete(k);
    }
}, 60 * 1000);
sweep.unref();

module.exports = { loadUser, invalidateUser, clearUserCache };
