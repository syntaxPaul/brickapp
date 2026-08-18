const express = require('express');
const router = express.Router();
const SupplierController = require('../controllers/supplierController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, SupplierController.getAll);
router.get('/:id', authenticateToken, SupplierController.getById);
router.post('/', authenticateToken, SupplierController.create);
router.put('/:id', authenticateToken, SupplierController.update);
router.delete('/:id', authenticateToken, SupplierController.delete);

module.exports = router;