const { pool } = require('../config/database');

class ProductModel {
    static async findAll(branchId) {
        const branchFilter = branchId ? 'WHERE branch_id = $1' : '';
        const params = branchId ? [branchId] : [];
        
        const result = await pool.query(`
            SELECT id, name, category, unit_price, stock_quantity, min_stock_threshold, unit_cost, branch_id, sku, created_at, updated_at
            FROM products
            ${branchFilter}
            ORDER BY name
        `, params);
        return result.rows;
    }

    static async findById(id, branchId) {
        const result = await pool.query(`
            SELECT * FROM products 
            WHERE id = $1 AND branch_id = $2
        `, [id, branchId]);
        return result.rows[0];
    }

    static async create(productData) {
        const { branchId, name, category, unit_price, stock_quantity, min_stock_threshold, unit_cost, sku } = productData;
        
        const result = await pool.query(`
            INSERT INTO products (branch_id, name, category, unit_price, stock_quantity, min_stock_threshold, unit_cost, sku)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `, [branchId, name, category, unit_price, stock_quantity || 0, min_stock_threshold || 500, unit_cost, sku]);
        return result.rows[0];
    }

    static async update(id, branchId, productData) {
        const { name, category, unit_price, stock_quantity, min_stock_threshold, unit_cost, sku } = productData;
        
        const result = await pool.query(`
            UPDATE products 
            SET name = $1, category = $2, unit_price = $3, stock_quantity = $4, min_stock_threshold = $5, unit_cost = $6, sku = $7, updated_at = CURRENT_TIMESTAMP
            WHERE id = $8 AND branch_id = $9
            RETURNING *
        `, [name, category, unit_price, stock_quantity, min_stock_threshold, unit_cost, sku, id, branchId]);
        return result.rows[0];
    }

    static async delete(id, branchId) {
        const result = await pool.query(`
            DELETE FROM products 
            WHERE id = $1 AND branch_id = $2
            RETURNING id
        `, [id, branchId]);
        return result.rows[0];
    }

    static async updateStock(id, branchId, quantity) {
        const result = await pool.query(`
            UPDATE products 
            SET stock_quantity = stock_quantity + $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2 AND branch_id = $3
            RETURNING *
        `, [quantity, id, branchId]);
        return result.rows[0];
    }

    static async getStockAlerts(branchId) {
        const branchFilter = branchId ? 'WHERE branch_id = $1' : '';
        const params = branchId ? [branchId] : [];
        
        const result = await pool.query(`
            SELECT name, stock_quantity, min_stock_threshold
            FROM products
            ${branchFilter}
            AND stock_quantity < min_stock_threshold
        `, params);
        return result.rows;
    }
}

module.exports = ProductModel;