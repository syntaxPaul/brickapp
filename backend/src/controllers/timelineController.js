const OrderTimelineModel = require('../models/orderTimelineModel');
const { getCurrentBranch } = require('../middleware/auth');

class TimelineController {
    // Get timeline for an order
    static async getOrderTimeline(req, res) {
        try {
            const { orderId } = req.params;
            const timeline = await OrderTimelineModel.getOrderTimeline(orderId);
            const summary = await OrderTimelineModel.getTimelineSummary(orderId);
            
            res.json({
                timeline,
                summary,
                total: timeline.length
            });
        } catch (error) {
            console.error('Get order timeline error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Get timeline for a specific product in an order
    static async getProductTimeline(req, res) {
        try {
            const { orderId, productId } = req.params;
            const timeline = await OrderTimelineModel.getProductTimeline(orderId, productId);
            res.json(timeline);
        } catch (error) {
            console.error('Get product timeline error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Create timeline entry
    static async createTimelineEntry(req, res) {
        try {
            const { orderId } = req.params;
            const userId = req.user.id;
            const entryData = {
                ...req.body,
                order_id: orderId,
                created_by: userId
            };

            const entry = await OrderTimelineModel.createTimelineEntry(entryData);
            res.status(201).json(entry);
        } catch (error) {
            console.error('Create timeline entry error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Update timeline status
    static async updateTimelineStatus(req, res) {
        try {
            const { timelineId } = req.params;
            const { status, description, location } = req.body;

            const updated = await OrderTimelineModel.updateTimelineStatus(
                timelineId,
                status,
                description,
                location
            );

            if (!updated) {
                return res.status(404).json({ error: 'Timeline entry not found' });
            }

            res.json(updated);
        } catch (error) {
            console.error('Update timeline status error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Update estimated completion
    static async updateEstimatedCompletion(req, res) {
        try {
            const { timelineId } = req.params;
            const { estimated_completion } = req.body;

            const updated = await OrderTimelineModel.updateEstimatedCompletion(
                timelineId,
                estimated_completion
            );

            if (!updated) {
                return res.status(404).json({ error: 'Timeline entry not found' });
            }

            res.json(updated);
        } catch (error) {
            console.error('Update estimated completion error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Complete timeline entry
    static async completeTimeline(req, res) {
        try {
            const { timelineId } = req.params;

            const completed = await OrderTimelineModel.completeTimeline(timelineId);

            if (!completed) {
                return res.status(404).json({ error: 'Timeline entry not found' });
            }

            res.json(completed);
        } catch (error) {
            console.error('Complete timeline error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Get pending products for branch
    static async getPendingTimeline(req, res) {
        try {
            const branchId = getCurrentBranch(req);
            const pending = await OrderTimelineModel.getPendingTimeline(branchId);
            res.json(pending);
        } catch (error) {
            console.error('Get pending timeline error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Get average completion times
    static async getAverageCompletionTimes(req, res) {
        try {
            const branchId = getCurrentBranch(req);
            const { days = 30 } = req.query;
            const averages = await OrderTimelineModel.getAverageCompletionTime(branchId, parseInt(days));
            res.json(averages);
        } catch (error) {
            console.error('Get average completion times error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Get timeline statistics
    static async getTimelineStats(req, res) {
        try {
            const branchId = getCurrentBranch(req);
            
            const stats = await pool.query(`
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending,
                    COUNT(CASE WHEN status = 'PRODUCTION' THEN 1 END) as production,
                    COUNT(CASE WHEN status = 'QUALITY_CHECK' THEN 1 END) as quality_check,
                    COUNT(CASE WHEN status = 'PACKAGING' THEN 1 END) as packaging,
                    COUNT(CASE WHEN status = 'DISPATCHED' THEN 1 END) as dispatched,
                    COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed,
                    COUNT(CASE WHEN status NOT IN ('COMPLETED', 'CANCELLED') THEN 1 END) as in_progress
                FROM order_timeline ot
                JOIN orders o ON ot.order_id = o.id
                WHERE o.branch_id = $1
            `, [branchId]);

            res.json(stats.rows[0]);
        } catch (error) {
            console.error('Get timeline stats error:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = TimelineController;