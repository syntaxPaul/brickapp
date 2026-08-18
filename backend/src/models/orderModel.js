const { pool } = require('../config/database');

class OrderModel {
    static async findAll(branchId) {
        const branchFilter = branchId ? 'AND o.branch_id = $1' : '';
        const params = branchId ? [branchId] : [];
        
        const result = await pool.query(`
            SELECT o.*, 
                   COALESCE(json_agg(json_build_object(
                       'product_id', oi.product_id, 
                       'product_name', p.name,
                       'quantity', oi.quantity, 
                       'unit_price', oi.unit_price_at_time,
                       'total', oi.total
                   )) FILTER (WHERE oi.product_id IS NOT NULL), '[]') AS items
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE 1=1 ${branchFilter}
            GROUP BY o.id
            ORDER BY o.order_date DESC
        `, params);
        return result.rows;
    }

    static async findById(id, branchId) {
        const result = await pool.query(`
            SELECT o.*, 
                   COALESCE(json_agg(json_build_object(
                       'product_id', oi.product_id, 
                       'product_name', p.name,
                       'quantity', oi.quantity, 
                       'unit_price', oi.unit_price_at_time,
                       'total', oi.total
                   )) FILTER (WHERE oi.product_id IS NOT NULL), '[]') AS items
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE o.id = $1 AND o.branch_id = $2
            GROUP BY o.id
        `, [id, branchId]);
        return result.rows[0];
    }

    static async generateOrderNumber() {
        const result = await pool.query(`
            SELECT 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(COALESCE(MAX(CAST(SUBSTRING(order_number FROM '-(\\d+)$') AS INTEGER)), 0) + 1, 4, '0') AS order_number
            FROM orders
            WHERE order_number LIKE 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-%'
        `);
        return result.rows[0].order_number;
    }

    static async create(orderData) {
        const { 
            branchId, order_number, customer_name, customer_phone, customer_email,
            customer_address, delivery_address, delivery_date, delivery_time_slot,
            total_amount, priority, notes, created_by
        } = orderData;
        
        const result = await pool.query(`
            INSERT INTO orders (
                branch_id, order_number, customer_name, customer_phone, customer_email, 
                customer_address, delivery_address, delivery_date, delivery_time_slot,
                status, total_amount, priority, notes, created_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING *
        `, [
            branchId, order_number, customer_name, customer_phone, customer_email,
            customer_address, delivery_address, delivery_date, delivery_time_slot,
            'Pending', total_amount, priority || 'Normal', notes, created_by
        ]);
        return result.rows[0];
    }

    static async createOrderItems(orderId, branchId, items) {
        for (const item of items) {
            await pool.query(`
                INSERT INTO order_items (branch_id, order_id, product_id, quantity, unit_price_at_time, total)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [branchId, orderId, item.product_id, item.quantity, item.unit_price, item.quantity * item.unit_price]);
        }
    }

    static async updateStatus(id, branchId, status) {
        const result = await pool.query(`
            UPDATE orders 
            SET status = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2 AND branch_id = $3
            RETURNING *
        `, [status, id, branchId]);
        return result.rows[0];
    }

    static async updatePayment(id, branchId, paidAmount) {
        const order = await this.findById(id, branchId);
        if (!order) return null;
        
        const newPaidAmount = parseFloat(order.paid_amount) + parseFloat(paidAmount);
        const paymentStatus = newPaidAmount >= parseFloat(order.total_amount) ? 'Paid' : 'Partial';
        
        const result = await pool.query(`
            UPDATE orders 
            SET paid_amount = $1, payment_status = $2, updated_at = CURRENT_TIMESTAMP
            WHERE id = $3 AND branch_id = $4
            RETURNING *
        `, [newPaidAmount, paymentStatus, id, branchId]);
        return result.rows[0];
    }

    static async getRecentOrders(branchId, limit = 10) {
        const branchFilter = branchId ? 'AND branch_id = ' + branchId : '';
        
        const result = await pool.query(`
            SELECT id, order_number, customer_name, order_date, total_amount, status
            FROM orders
            WHERE 1=1 ${branchFilter}
            ORDER BY order_date DESC
            LIMIT $1
        `, [limit]);
        return result.rows;
    }

    static async getMonthlyStats(branchId) {
        const branchFilter = branchId ? 'AND branch_id = ' + branchId : '';
        
        const result = await pool.query(`
            SELECT COUNT(*) AS total_orders, 
                   COALESCE(SUM(total_amount), 0) AS total_revenue
            FROM orders 
            WHERE EXTRACT(MONTH FROM order_date) = EXTRACT(MONTH FROM CURRENT_DATE)
              AND EXTRACT(YEAR FROM order_date) = EXTRACT(YEAR FROM CURRENT_DATE)
              ${branchFilter}
        `);
        return result.rows[0];
    }
}

module.exports = OrderModel;