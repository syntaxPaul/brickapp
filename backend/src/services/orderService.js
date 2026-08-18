const OrderModel = require('../models/orderModel');
const ProductModel = require('../models/productModel');

class OrderService {
    static async getAllOrders(branchId) {
        return await OrderModel.findAll(branchId);
    }

    static async getOrderById(id, branchId) {
        const order = await OrderModel.findById(id, branchId);
        if (!order) {
            throw new Error('Order not found');
        }
        return order;
    }

    static async createOrder(orderData) {
        const { branchId, items, ...orderInfo } = orderData;
        
        // Generate order number
        const orderNumber = await OrderModel.generateOrderNumber();
        
        // Calculate total
        let totalAmount = 0;
        for (const item of items) {
            totalAmount += item.quantity * item.unit_price;
        }
        
        // Create order
        const order = await OrderModel.create({
            ...orderInfo,
            branchId,
            order_number: orderNumber,
            total_amount: totalAmount
        });
        
        // Create order items and update stock
        for (const item of items) {
            await OrderModel.createOrderItems(order.id, branchId, [item]);
            await ProductModel.updateStock(item.product_id, branchId, -item.quantity);
        }
        
        return order;
    }

    static async updateOrderStatus(id, branchId, status) {
        const order = await OrderModel.updateStatus(id, branchId, status);
        if (!order) {
            throw new Error('Order not found');
        }
        return order;
    }

    static async updatePayment(id, branchId, paidAmount) {
        const order = await OrderModel.updatePayment(id, branchId, paidAmount);
        if (!order) {
            throw new Error('Order not found');
        }
        return order;
    }

    static async getRecentOrders(branchId, limit = 10) {
        return await OrderModel.getRecentOrders(branchId, limit);
    }

    static async getMonthlyStats(branchId) {
        return await OrderModel.getMonthlyStats(branchId);
    }
}

module.exports = OrderService;