const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/orderController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, OrderController.getAll);
router.get('/:id', authenticateToken, OrderController.getById);
router.post('/', authenticateToken, OrderController.create);
router.patch('/:id/status', authenticateToken, OrderController.updateStatus);
router.patch('/:id/payment', authenticateToken, OrderController.updatePayment);

module.exports = router;