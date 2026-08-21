const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const dotenv = require('dotenv');

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

// The profile cache and its invalidation live in lib/userCache so that the
// model layer can clear entries directly - see the note in that file.
const { loadUser, invalidateUser, clearUserCache } = require('../lib/userCache');

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
    // Re-exported for existing callers; lib/userCache is the source of truth.
    invalidateUserCache: invalidateUser,
    clearUserCache
};
