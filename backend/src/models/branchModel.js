const { pool } = require('../config/database');

class BranchModel {
    static async findAll() {
        const result = await pool.query(`
            SELECT * FROM branches 
            WHERE status = 'Active' 
            ORDER BY name
        `);
        return result.rows;
    }

    static async findById(id) {
        const result = await pool.query('SELECT * FROM branches WHERE id = $1', [id]);
        return result.rows[0];
    }

    static async findUserBranches(userId) {
        const result = await pool.query(`
            SELECT b.*, bua.is_primary
            FROM branches b
            JOIN branch_user_assignments bua ON b.id = bua.branch_id
            WHERE bua.user_id = $1 AND b.status = 'Active'
            ORDER BY b.name
        `, [userId]);
        return result.rows;
    }

    static async create(branchData) {
        const { name, code, address, phone, email, manager_name } = branchData;
        
        const result = await pool.query(`
            INSERT INTO branches (name, code, address, phone, email, manager_name)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [name, code, address, phone, email, manager_name]);
        return result.rows[0];
    }

    static async update(id, branchData) {
        const { name, code, address, phone, email, manager_name, status } = branchData;
        
        const result = await pool.query(`
            UPDATE branches 
            SET name = $1, code = $2, address = $3, phone = $4, email = $5, manager_name = $6, status = $7
            WHERE id = $8
            RETURNING *
        `, [name, code, address, phone, email, manager_name, status, id]);
        return result.rows[0];
    }

    static async delete(id) {
        const result = await pool.query('DELETE FROM branches WHERE id = $1 RETURNING id', [id]);
        return result.rows[0];
    }
}

module.exports = BranchModel;