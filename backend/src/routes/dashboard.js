const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/auth');

router.get('/stats', authenticateToken, DashboardController.getStats);
router.get('/recent-orders', authenticateToken, DashboardController.getRecentOrders);
router.get('/chart-revenue-expenses', authenticateToken, DashboardController.getRevenueExpensesChart);
router.get('/chart-product-sales', authenticateToken, DashboardController.getProductSalesChart);
router.get('/chart-expense-categories', authenticateToken, DashboardController.getExpenseCategoriesChart);

module.exports = router;