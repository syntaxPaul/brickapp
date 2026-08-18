const express = require('express');
const router = express.Router();
const ProductionController = require('../controllers/productionController');
const { authenticateToken } = require('../middleware/auth');

// Machine routes
router.get('/machines', authenticateToken, ProductionController.getMachines);
router.get('/machines/:id', authenticateToken, ProductionController.getMachineById);
router.post('/machines', authenticateToken, ProductionController.createMachine);
router.put('/machines/:id', authenticateToken, ProductionController.updateMachine);

// Batch routes
router.get('/batches', authenticateToken, ProductionController.getBatches);
router.post('/batches', authenticateToken, ProductionController.createBatch);
router.put('/batches/:id/complete', authenticateToken, ProductionController.completeBatch);

module.exports = router;