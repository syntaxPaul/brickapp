const { pool } = require('../config/database');

class ExpenseModel {
    static async findAll(branchId) {
        const branchFilter = branchId ? 'WHERE e.branch_id = $1' : '';
        const params = branchId ? [branchId] : [];
        
        const result = await pool.query(`
            SELECT e.*, s.name AS supplier_name
            FROM expenses e
            LEFT JOIN suppliers s ON e.supplier_id = s.id
            ${branchFilter}
            ORDER BY e.expense_date DESC
        `, params);
        return result.rows;
    }

    static async create(expenseData) {
        const { branchId, category, description, amount, expense_date, supplier_id, receipt_url, created_by } = expenseData;
        
        const result = await pool.query(`
            INSERT INTO expenses (branch_id, category, description, amount, expense_date, supplier_id, receipt_url, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `, [branchId, category, description, amount, expense_date || new Date(), supplier_id, receipt_url, created_by]);
        return result.rows[0];
    }

    static async update(id, branchId, expenseData) {
        const { category, description, amount, expense_date, supplier_id, receipt_url } = expenseData;
        
        const result = await pool.query(`
            UPDATE expenses 
            SET category = $1, description = $2, amount = $3, expense_date = $4, supplier_id = $5, receipt_url = $6
            WHERE id = $7 AND branch_id = $8
            RETURNING *
        `, [category, description, amount, expense_date, supplier_id, receipt_url, id, branchId]);
        return result.rows[0];
    }

    static async delete(id, branchId) {
        const result = await pool.query(`
            DELETE FROM expenses 
            WHERE id = $1 AND branch_id = $2
            RETURNING id
        `, [id, branchId]);
        return result.rows[0];
    }

    static async getCategorySummary(branchId) {
        const branchFilter = branchId ? 'WHERE branch_id = $1' : '';
        const params = branchId ? [branchId] : [];
        
        const result = await pool.query(`
            SELECT category, COUNT(*) as count, SUM(amount) as total
            FROM expenses
            ${branchFilter}
            GROUP BY category
            ORDER BY total DESC
        `, params);
        return result.rows;
    }

    static async getMonthlyTotal(branchId) {
        const branchFilter = branchId ? 'AND branch_id = ' + branchId : '';
        
        const result = await pool.query(`
            SELECT COALESCE(SUM(amount), 0) AS total_expenses
            FROM expenses
            WHERE EXTRACT(MONTH FROM expense_date) = EXTRACT(MONTH FROM CURRENT_DATE)
              AND EXTRACT(YEAR FROM expense_date) = EXTRACT(YEAR FROM CURRENT_DATE)
              ${branchFilter}
        `);
        return result.rows[0];
    }

    static async getChartData(branchId, months = 6) {
        const branchFilter = branchId ? 'AND branch_id = ' + branchId : '';
        
        const result = await pool.query(`
            WITH months AS (
                SELECT generate_series(
                    date_trunc('month', NOW() - INTERVAL '${months - 1} months'),
                    date_trunc('month', NOW()),
                    '1 month'::interval
                ) AS month
            )
            SELECT 
                TO_CHAR(m.month, 'Mon YYYY') AS month_label,
                COALESCE(SUM(e.amount), 0) AS expenses
            FROM months m
            LEFT JOIN expenses e ON date_trunc('month', e.expense_date) = m.month ${branchFilter}
            GROUP BY m.month
            ORDER BY m.month
        `);
        return result.rows;
    }
}

module.exports = ExpenseModel;