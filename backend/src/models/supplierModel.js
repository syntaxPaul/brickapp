const { pool } = require('../config/database');

class SupplierModel {
    static async findAll(branchId) {
        const branchFilter = branchId ? 'WHERE branch_id = $1' : '';
        const params = branchId ? [branchId] : [];
        
        const result = await pool.query(`
            SELECT id, name, contact_person, phone, email, address, branch_id, created_at
            FROM suppliers
            ${branchFilter}
            ORDER BY name
        `, params);
        return result.rows;
    }

    static async findById(id, branchId) {
        const result = await pool.query(`
            SELECT * FROM suppliers 
            WHERE id = $1 AND branch_id = $2
        `, [id, branchId]);
        return result.rows[0];
    }

    static async create(supplierData) {
        const { branchId, name, contact_person, phone, email, address } = supplierData;
        
        const result = await pool.query(`
            INSERT INTO suppliers (branch_id, name, contact_person, phone, email, address)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [branchId, name, contact_person, phone, email, address]);
        return result.rows[0];
    }

    static async update(id, branchId, supplierData) {
        const { name, contact_person, phone, email, address } = supplierData;
        
        const result = await pool.query(`
            UPDATE suppliers 
            SET name = $1, contact_person = $2, phone = $3, email = $4, address = $5
            WHERE id = $6 AND branch_id = $7
            RETURNING *
        `, [name, contact_person, phone, email, address, id, branchId]);
        return result.rows[0];
    }

    static async delete(id, branchId) {
        const result = await pool.query(`
            DELETE FROM suppliers 
            WHERE id = $1 AND branch_id = $2
            RETURNING id
        `, [id, branchId]);
        return result.rows[0];
    }
}

module.exports = SupplierModel;