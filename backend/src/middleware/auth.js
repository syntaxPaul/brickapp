const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const dotenv = require('dotenv');

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

// ---------------------------------------------------------------------------
// User profile cache
// ---------------------------------------------------------------------------
//
// Every authenticated request used to run this three-table join with two
// json_agg aggregations just to rebuild the caller's branches and roles. The
// dashboard alone fires five requests in parallel, so a single page load ran
// the same query five times over.
//
// The profile changes only when an admin edits a user's roles or branch
// assignments, so we cache it briefly in process and expose an invalidation
// hook for the code paths that do the editing. TTL is short enough that even a
// missed invalidation self-corrects within seconds.

const USER_CACHE_TTL_MS = 30 * 1000;
const userCache = new Map();

// In-flight deduplication: five parallel requests arriving on a cold cache
// should trigger ONE query, not five. Without this the stampede on first load
// is exactly the case we are trying to fix.
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

async function loadUser(userId) {
    const cached = userCache.get(userId);
    if (cached && cached.expires > Date.now()) {
        return cached.user;
    }

    if (inFlight.has(userId)) {
        return inFlight.get(userId);
    }

    const promise = (async () => {
        const result = await pool.query(USER_QUERY, [userId]);
        const user = result.rows[0] || null;
        if (user) {
            userCache.set(userId, { user, expires: Date.now() + USER_CACHE_TTL_MS });
        }
        return user;
    })().finally(() => {
        inFlight.delete(userId);
    });

    inFlight.set(userId, promise);
    return promise;
}

/**
 * Drop a user's cached profile. Call this after changing their roles, branch
 * assignments, or status so the change takes effect on the next request rather
 * than up to TTL later.
 */
function invalidateUserCache(userId) {
    userCache.delete(Number(userId));
    userCache.delete(String(userId));
}

function clearUserCache() {
    userCache.clear();
}

// Keep the map from growing unbounded on a long-lived worker.
const sweep = setInterval(() => {
    const now = Date.now();
    for (const [key, value] of userCache.entries()) {
        if (value.expires <= now) userCache.delete(key);
    }
}, 60 * 1000);
sweep.unref();

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.', code: 'NO_TOKEN' });
    }

    let verified;
    try {
        verified = jwt.verify(token, JWT_SECRET);
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired. Please login again.', code: 'TOKEN_EXPIRED' });
        }
        return res.status(401).json({ error: 'Invalid token.', code: 'TOKEN_INVALID' });
    }

    try {
        const user = await loadUser(verified.id);

        if (!user) {
            return res.status(401).json({ error: 'User not found.', code: 'USER_NOT_FOUND' });
        }

        // Shallow copy so per-request additions (tokenData) never leak into the
        // shared cached object.
        req.user = { ...user, tokenData: verified };
        next();
    } catch (err) {
        // The token is valid; we simply could not reach the database. This is a
        // server-side problem, NOT an authentication failure. Returning 401/403
        // here is what caused the frontend to log people out during a restart -
        // a 503 tells the client to retry instead.
        console.error('Auth lookup failed:', err.message);
        return res.status(503).json({
            error: 'Service temporarily unavailable. Please retry.',
            code: 'AUTH_BACKEND_UNAVAILABLE'
        });
    }
};

const getCurrentBranch = (req) => {
    const branchHeader = req.headers['x-branch-id'];
    if (branchHeader) {
        const parsed = parseInt(branchHeader, 10);
        // Guard against NaN: these values are interpolated into SQL in a few
        // services, and NaN would produce a malformed statement.
        if (Number.isInteger(parsed)) return parsed;
    }
    const primary = req.user?.branches?.find(b => b.is_primary);
    return primary?.branch_id || null;
};

module.exports = {
    authenticateToken,
    getCurrentBranch,
    invalidateUserCache,
    clearUserCache
};
