const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/auth');
const { microCache } = require('../middleware/microCache');

// The dashboard runs five multi-table aggregates. They are read-only and
// identical for the same user+branch within a short window, so a brief cache
// makes revisiting the dashboard instant. Applied AFTER authenticateToken so
// the cache key always includes a real user id - never a shared "anon" bucket.
const cache = microCache(20000);

router.get('/stats', authenticateToken, cache, DashboardController.getStats);
router.get('/recent-orders', authenticateToken, cache, DashboardController.getRecentOrders);
router.get('/chart-revenue-expenses', authenticateToken, cache, DashboardController.getRevenueExpensesChart);
router.get('/chart-product-sales', authenticateToken, cache, DashboardController.getProductSalesChart);
router.get('/chart-expense-categories', authenticateToken, cache, DashboardController.getExpenseCategoriesChart);

module.exports = router;
