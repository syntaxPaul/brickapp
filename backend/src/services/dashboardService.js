const OrderModel = require('../models/orderModel');
const ProductModel = require('../models/productModel');
const ExpenseModel = require('../models/expenseModel');
const WastageModel = require('../models/wastageModel');
const DeliveryModel = require('../models/deliveryModel');
const { pool } = require('../config/database');

class DashboardService {
    static async getStats(branchId) {
        const [orders, expenses, wastage, stockAlerts, deliveryStats] = await Promise.all([
            OrderModel.getMonthlyStats(branchId),
            ExpenseModel.getMonthlyTotal(branchId),
            WastageModel.getMonthlyTotal(branchId),
            ProductModel.getStockAlerts(branchId),
            DeliveryModel.getMonthlyStats(branchId)
        ]);

        return {
            total_orders: parseInt(orders?.total_orders || 0),
            total_revenue: parseFloat(orders?.total_revenue || 0),
            total_expenses: parseFloat(expenses?.total_expenses || 0),
            total_wastage_cost: parseFloat(wastage?.total_wastage_cost || 0),
            stock_alerts: stockAlerts || [],
            delivery_stats: deliveryStats || { total_trips: 0, completed_trips: 0, in_progress_trips: 0, scheduled_trips: 0 }
        };
    }

    static async getRevenueExpensesChart(branchId, months = 6) {
        const expenseData = await ExpenseModel.getChartData(branchId, months);
        
        // Get revenue data
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
                COALESCE(SUM(DISTINCT o.total_amount), 0) AS revenue
            FROM months m
            LEFT JOIN orders o ON date_trunc('month', o.order_date) = m.month ${branchFilter}
            GROUP BY m.month
            ORDER BY m.month
        `);
        const revenueData = result.rows;
        
        // Merge data
        return revenueData.map((item, index) => ({
            ...item,
            expenses: expenseData[index]?.expenses || 0
        }));
    }

    static async getProductSalesChart(branchId) {
        const branchFilter = branchId ? 'AND p.branch_id = ' + branchId : '';
        
        const result = await pool.query(`
            SELECT 
                p.name,
                COALESCE(SUM(oi.quantity), 0) AS total_sold,
                COALESCE(SUM(oi.total), 0) AS total_revenue
            FROM products p
            LEFT JOIN order_items oi ON p.id = oi.product_id
            LEFT JOIN orders o ON oi.order_id = o.id
            WHERE (o.order_date >= NOW() - INTERVAL '6 months' OR o.order_date IS NULL)
              ${branchFilter}
            GROUP BY p.id
            ORDER BY total_revenue DESC
            LIMIT 6
        `);
        return result.rows;
    }

    static async getExpenseCategoriesChart(branchId) {
        return await ExpenseModel.getCategorySummary(branchId);
    }

    static async getRecentOrders(branchId, limit = 10) {
        return await OrderModel.getRecentOrders(branchId, limit);
    }
}

module.exports = DashboardService;