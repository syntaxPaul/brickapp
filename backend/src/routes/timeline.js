const express = require('express');
const router = express.Router();
const TimelineController = require('../controllers/timelineController');
const { authenticateToken } = require('../middleware/auth');

// Get timeline for an order
router.get('/orders/:orderId', authenticateToken, TimelineController.getOrderTimeline);

// Get timeline for specific product in order
router.get('/orders/:orderId/products/:productId', authenticateToken, TimelineController.getProductTimeline);

// Create timeline entry
router.post('/orders/:orderId/entries', authenticateToken, TimelineController.createTimelineEntry);

// Update timeline status
router.put('/entries/:timelineId/status', authenticateToken, TimelineController.updateTimelineStatus);

// Update estimated completion
router.put('/entries/:timelineId/completion', authenticateToken, TimelineController.updateEstimatedCompletion);

// Complete timeline entry
router.put('/entries/:timelineId/complete', authenticateToken, TimelineController.completeTimeline);

// Get pending timeline for branch
router.get('/pending', authenticateToken, TimelineController.getPendingTimeline);

// Get average completion times
router.get('/averages', authenticateToken, TimelineController.getAverageCompletionTimes);

// Get timeline statistics
router.get('/stats', authenticateToken, TimelineController.getTimelineStats);

module.exports = router;