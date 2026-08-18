const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const dotenv = require('dotenv');

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const verified = jwt.verify(token, JWT_SECRET);
        
        const userResult = await pool.query(`
            SELECT u.id, u.username, u.email, u.full_name, u.phone, u.status,
                   COALESCE(json_agg(DISTINCT jsonb_build_object('branch_id', bua.branch_id, 'is_primary', bua.is_primary)) FILTER (WHERE bua.branch_id IS NOT NULL), '[]') AS branches,
                   COALESCE(json_agg(DISTINCT jsonb_build_object('branch_id', ur.branch_id, 'role', ur.role_name, 'permissions', ur.permissions)) FILTER (WHERE ur.branch_id IS NOT NULL), '[]') AS roles
            FROM users u
            LEFT JOIN branch_user_assignments bua ON u.id = bua.user_id
            LEFT JOIN user_roles ur ON u.id = ur.user_id
            WHERE u.id = $1
            GROUP BY u.id
        `, [verified.id]);
        
        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: 'User not found.' });
        }
        
        req.user = userResult.rows[0];
        req.user.tokenData = verified;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(403).json({ error: 'Token expired. Please login again.' });
        }
        res.status(403).json({ error: 'Invalid or expired token.' });
    }
};

const getCurrentBranch = (req) => {
    const branchHeader = req.headers['x-branch-id'];
    if (branchHeader) {
        return parseInt(branchHeader);
    }
    const primary = req.user?.branches?.find(b => b.is_primary);
    return primary?.branch_id || null;
};

module.exports = { authenticateToken, getCurrentBranch };