const { pool } = require('../config/database');
const bcrypt = require('bcrypt');

class UserModel {
    static async findAll() {
        console.log('📊 Finding all users');
        const result = await pool.query(`
            SELECT u.id, u.username, u.email, u.full_name, u.phone, u.status, u.created_at,
                   COALESCE(json_agg(json_build_object('branch_id', bua.branch_id, 'is_primary', bua.is_primary)) FILTER (WHERE bua.branch_id IS NOT NULL), '[]') AS branches
            FROM users u
            LEFT JOIN branch_user_assignments bua ON u.id = bua.user_id
            GROUP BY u.id
            ORDER BY u.full_name
        `);
        console.log(`📊 Found ${result.rows.length} users`);
        return result.rows;
    }

    static async findById(id) {
        console.log('📊 Finding user by ID:', id);
        const result = await pool.query(`
            SELECT u.id, u.username, u.email, u.full_name, u.phone, u.status,
                   COALESCE(json_agg(json_build_object('branch_id', bua.branch_id, 'is_primary', bua.is_primary)) FILTER (WHERE bua.branch_id IS NOT NULL), '[]') AS branches,
                   COALESCE(json_agg(json_build_object('branch_id', ur.branch_id, 'role', ur.role_name, 'permissions', ur.permissions)) FILTER (WHERE ur.branch_id IS NOT NULL), '[]') AS roles
            FROM users u
            LEFT JOIN branch_user_assignments bua ON u.id = bua.user_id
            LEFT JOIN user_roles ur ON u.id = ur.user_id
            WHERE u.id = $1
            GROUP BY u.id
        `, [id]);
        return result.rows[0];
    }

    static async findByUsername(username) {
        console.log('📊 Finding user by username:', username);
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        console.log(`📊 Result: ${result.rows.length} user(s) found`);
        return result.rows[0];
    }

    static async findByEmail(email) {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        return result.rows[0];
    }

    static async create(userData) {
        const { username, password, email, full_name, phone } = userData;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const result = await pool.query(`
            INSERT INTO users (username, password, email, full_name, phone)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, username, email, full_name, phone, status, created_at
        `, [username, hashedPassword, email, full_name, phone]);
        return result.rows[0];
    }

    static async update(id, userData) {
        const { username, email, full_name, phone, status } = userData;
        let query = `
            UPDATE users 
            SET username = $1, email = $2, full_name = $3, phone = $4, status = $5, updated_at = CURRENT_TIMESTAMP
        `;
        const params = [username, email, full_name, phone, status];
        let paramIndex = 6;

        if (userData.password) {
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            query += `, password = $${paramIndex}`;
            params.push(hashedPassword);
            paramIndex++;
        }

        query += ` WHERE id = $${paramIndex} RETURNING id, username, email, full_name, phone, status, updated_at`;
        params.push(id);

        const result = await pool.query(query, params);
        return result.rows[0];
    }

    static async delete(id) {
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
        return result.rows[0];
    }

    static async assignBranches(userId, branches) {
        await pool.query('DELETE FROM branch_user_assignments WHERE user_id = $1', [userId]);
        
        for (const branch of branches) {
            await pool.query(`
                INSERT INTO branch_user_assignments (user_id, branch_id, is_primary)
                VALUES ($1, $2, $3)
            `, [userId, branch.branch_id, branch.is_primary || false]);
        }
    }

    static async assignRoles(userId, roles) {
        await pool.query('DELETE FROM user_roles WHERE user_id = $1', [userId]);
        
        for (const role of roles) {
            await pool.query(`
                INSERT INTO user_roles (user_id, branch_id, role_name, permissions)
                VALUES ($1, $2, $3, $4)
            `, [userId, role.branch_id, role.role_name, role.permissions || '[]']);
        }
    }

    static async getUserWithBranchesAndRoles(id) {
        console.log('📊 Getting user with branches and roles:', id);
        const result = await pool.query(`
            SELECT u.id, u.username, u.email, u.full_name, u.phone, u.status,
                   COALESCE(json_agg(DISTINCT jsonb_build_object('branch_id', bua.branch_id, 'is_primary', bua.is_primary)) FILTER (WHERE bua.branch_id IS NOT NULL), '[]') AS branches,
                   COALESCE(json_agg(DISTINCT jsonb_build_object('branch_id', ur.branch_id, 'role', ur.role_name, 'permissions', ur.permissions)) FILTER (WHERE ur.branch_id IS NOT NULL), '[]') AS roles
            FROM users u
            LEFT JOIN branch_user_assignments bua ON u.id = bua.user_id
            LEFT JOIN user_roles ur ON u.id = ur.user_id
            WHERE u.id = $1
            GROUP BY u.id
        `, [id]);
        console.log(`📊 User with branches: ${result.rows.length} row(s) found`);
        return result.rows[0];
    }
}

module.exports = UserModel;