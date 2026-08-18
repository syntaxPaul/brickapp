const DashboardService = require('../services/dashboardService');
const { getCurrentBranch } = require('../middleware/auth');

class DashboardController {
    static async getStats(req, res) {
        try {
            const branchId = getCurrentBranch(req);
            const stats = await DashboardService.getStats(branchId);
            res.json(stats);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getRecentOrders(req, res) {
        try {
            const branchId = getCurrentBranch(req);
            const orders = await DashboardService.getRecentOrders(branchId);
            res.json(orders);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getRevenueExpensesChart(req, res) {
        try {
            const branchId = getCurrentBranch(req);
            const data = await DashboardService.getRevenueExpensesChart(branchId);
            res.json(data);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getProductSalesChart(req, res) {
        try {
            const branchId = getCurrentBranch(req);
            const data = await DashboardService.getProductSalesChart(branchId);
            res.json(data);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getExpenseCategoriesChart(req, res) {
        try {
            const branchId = getCurrentBranch(req);
            const data = await DashboardService.getExpenseCategoriesChart(branchId);
            res.json(data);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = DashboardController;