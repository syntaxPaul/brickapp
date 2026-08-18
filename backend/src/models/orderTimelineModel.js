const { pool } = require('../config/database');

class OrderTimelineModel {
    // Create timeline entry for an order item
    static async createTimelineEntry(entryData) {
        const { 
            order_id, 
            product_id, 
            order_item_id,
            status, 
            description, 
            location, 
            estimated_completion,
            created_by 
        } = entryData;

        const result = await pool.query(`
            INSERT INTO order_timeline (
                order_id, 
                product_id, 
                order_item_id,
                status, 
                description, 
                location, 
                estimated_completion,
                created_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `, [order_id, product_id, order_item_id, status, description, location, estimated_completion, created_by]);

        return result.rows[0];
    }

    // Get timeline for an order
    static async getOrderTimeline(orderId) {
        const result = await pool.query(`
            SELECT 
                ot.*,
                p.name as product_name,
                p.category as product_category,
                u.full_name as created_by_name,
                oi.quantity as order_quantity,
                oi.unit_price_at_time as order_unit_price
            FROM order_timeline ot
            LEFT JOIN order_items oi ON ot.order_item_id = oi.id
            LEFT JOIN products p ON ot.product_id = p.id
            LEFT JOIN users u ON ot.created_by = u.id
            WHERE ot.order_id = $1
            ORDER BY ot.created_at ASC
        `, [orderId]);

        return result.rows;
    }

    // Get timeline for a specific product in an order
    static async getProductTimeline(orderId, productId) {
        const result = await pool.query(`
            SELECT 
                ot.*,
                p.name as product_name,
                p.category as product_category,
                u.full_name as created_by_name
            FROM order_timeline ot
            LEFT JOIN products p ON ot.product_id = p.id
            LEFT JOIN users u ON ot.created_by = u.id
            WHERE ot.order_id = $1 AND ot.product_id = $2
            ORDER BY ot.created_at ASC
        `, [orderId, productId]);

        return result.rows;
    }

    // Get all pending products timeline for branch
    static async getPendingTimeline(branchId) {
        const result = await pool.query(`
            SELECT 
                ot.*,
                o.customer_name,
                o.order_number,
                p.name as product_name,
                p.category as product_category,
                u.full_name as created_by_name
            FROM order_timeline ot
            JOIN orders o ON ot.order_id = o.id
            LEFT JOIN order_items oi ON ot.order_item_id = oi.id
            LEFT JOIN products p ON ot.product_id = p.id
            LEFT JOIN users u ON ot.created_by = u.id
            WHERE o.branch_id = $1 
            AND ot.status IN ('PENDING', 'PRODUCTION', 'QUALITY_CHECK', 'PACKAGING', 'DISPATCHED')
            ORDER BY ot.estimated_completion ASC, ot.created_at ASC
        `, [branchId]);

        return result.rows;
    }

    // Update timeline status
    static async updateTimelineStatus(timelineId, status, description, location) {
        const result = await pool.query(`
            UPDATE order_timeline 
            SET status = $1, 
                description = $2, 
                location = $3, 
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $4
            RETURNING *
        `, [status, description, location, timelineId]);

        return result.rows[0];
    }

    // Update estimated completion time
    static async updateEstimatedCompletion(timelineId, estimated_completion) {
        const result = await pool.query(`
            UPDATE order_timeline 
            SET estimated_completion = $1, 
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
        `, [estimated_completion, timelineId]);

        return result.rows[0];
    }

    // Mark timeline as completed
    static async completeTimeline(timelineId) {
        const result = await pool.query(`
            UPDATE order_timeline 
            SET status = 'COMPLETED', 
                completed_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `, [timelineId]);

        return result.rows[0];
    }

    // Get timeline summary for an order (counts by status)
    static async getTimelineSummary(orderId) {
        const result = await pool.query(`
            SELECT 
                status,
                COUNT(*) as count,
                MIN(created_at) as first_created,
                MAX(created_at) as last_created
            FROM order_timeline
            WHERE order_id = $1
            GROUP BY status
        `, [orderId]);

        return result.rows;
    }

    // Get average completion time per product
    static async getAverageCompletionTime(branchId, days = 30) {
        const result = await pool.query(`
            SELECT 
                p.id as product_id,
                p.name as product_name,
                AVG(EXTRACT(EPOCH FROM (ot.completed_at - ot.created_at)) / 3600) as avg_hours,
                COUNT(*) as total_completed
            FROM order_timeline ot
            JOIN orders o ON ot.order_id = o.id
            JOIN products p ON ot.product_id = p.id
            WHERE o.branch_id = $1
            AND ot.status = 'COMPLETED'
            AND ot.completed_at >= NOW() - INTERVAL '${days} days'
            GROUP BY p.id, p.name
            ORDER BY avg_hours DESC
        `, [branchId]);

        return result.rows;
    }
}

module.exports = OrderTimelineModel;