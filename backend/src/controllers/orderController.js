const OrderService = require('../services/orderService');
const { getCurrentBranch } = require('../middleware/auth');

class OrderController {
    static async getAll(req, res) {
        try {
            const branchId = getCurrentBranch(req);
            const orders = await OrderService.getAllOrders(branchId);
            res.json(orders);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getById(req, res) {
        try {
            const branchId = getCurrentBranch(req);
            const order = await OrderService.getOrderById(req.params.id, branchId);
            res.json(order);
        } catch (error) {
            res.status(404).json({ error: error.message });
        }
    }

    static async create(req, res) {
        try {
            const branchId = getCurrentBranch(req);
            const userId = req.user.id;
            const order = await OrderService.createOrder({
                ...req.body,
                branchId,
                created_by: userId
            });
            res.status(201).json(order);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async updateStatus(req, res) {
        try {
            const branchId = getCurrentBranch(req);
            const { status } = req.body;
            const order = await OrderService.updateOrderStatus(req.params.id, branchId, status);
            res.json(order);
        } catch (error) {
            res.status(404).json({ error: error.message });
        }
    }

    static async updatePayment(req, res) {
        try {
            const branchId = getCurrentBranch(req);
            const { paid_amount } = req.body;
            const order = await OrderService.updatePayment(req.params.id, branchId, paid_amount);
            res.json(order);
        } catch (error) {
            res.status(404).json({ error: error.message });
        }
    }
}

module.exports = OrderController;