const { pool } = require('../config/database');

class WastageModel {
    static async findAll(branchId) {
        const branchFilter = branchId ? 'WHERE w.branch_id = $1' : '';
        const params = branchId ? [branchId] : [];
        
        const result = await pool.query(`
            SELECT w.*, p.name AS product_name, p.category,
                   m.name AS machine_name
            FROM wastage w
            LEFT JOIN products p ON w.product_id = p.id
            LEFT JOIN machines m ON w.machine_id = m.id
            ${branchFilter}
            ORDER BY w.date DESC
        `, params);
        return result.rows;
    }

    static async create(wastageData) {
        const { branchId, product_id, machine_id, production_batch_id, quantity, reason, date, cost_impact, notes, created_by } = wastageData;
        
        const result = await pool.query(`
            INSERT INTO wastage (branch_id, product_id, machine_id, production_batch_id, quantity, reason, date, cost_impact, notes, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `, [branchId, product_id, machine_id, production_batch_id, quantity, reason, date || new Date(), cost_impact, notes, created_by]);
        return result.rows[0];
    }

    static async delete(id, branchId) {
        const result = await pool.query(`
            DELETE FROM wastage 
            WHERE id = $1 AND branch_id = $2
            RETURNING id
        `, [id, branchId]);
        return result.rows[0];
    }

    static async getSummary(branchId) {
        const branchFilter = branchId ? 'WHERE branch_id = $1' : '';
        const params = branchId ? [branchId] : [];
        
        const result = await pool.query(`
            SELECT reason, COUNT(*) as count, SUM(quantity) as total_quantity, SUM(cost_impact) as total_cost
            FROM wastage
            ${branchFilter}
            GROUP BY reason
            ORDER BY total_cost DESC
        `, params);
        return result.rows;
    }

    static async getMonthlyTotal(branchId) {
        const branchFilter = branchId ? 'AND branch_id = ' + branchId : '';
        
        const result = await pool.query(`
            SELECT COALESCE(SUM(cost_impact), 0) AS total_wastage_cost
            FROM wastage
            WHERE EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE)
              AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)
              ${branchFilter}
        `);
        return result.rows[0];
    }

    static async calculateCostImpact(productId, branchId, quantity) {
        const result = await pool.query(`
            SELECT unit_cost FROM products WHERE id = $1 AND branch_id = $2
        `, [productId, branchId]);
        const unitCost = result.rows[0]?.unit_cost || 0;
        return quantity * unitCost;
    }
}

module.exports = WastageModel;