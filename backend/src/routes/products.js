const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, ProductController.getAll);
router.get('/stock/alerts', authenticateToken, ProductController.getStockAlerts);
router.get('/:id', authenticateToken, ProductController.getById);
router.post('/', authenticateToken, ProductController.create);
router.put('/:id', authenticateToken, ProductController.update);
router.delete('/:id', authenticateToken, ProductController.delete);
router.patch('/:id/stock', authenticateToken, ProductController.updateStock);

module.exports = router;