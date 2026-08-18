const express = require('express');
const router = express.Router();
const DeliveryController = require('../controllers/deliveryController');
const { authenticateToken } = require('../middleware/auth');

// Driver routes
router.get('/drivers', authenticateToken, DeliveryController.getDrivers);
router.post('/drivers', authenticateToken, DeliveryController.createDriver);

// Trip routes
router.get('/trips', authenticateToken, DeliveryController.getTrips);
router.get('/trip/:id', authenticateToken, DeliveryController.getTripById);
router.post('/trips', authenticateToken, DeliveryController.createTrip);
router.put('/trips/:id/status', authenticateToken, DeliveryController.updateTripStatus);
router.put('/trips/:id/complete', authenticateToken, DeliveryController.completeTrip);

module.exports = router;