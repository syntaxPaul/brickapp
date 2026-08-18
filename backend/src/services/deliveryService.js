const DeliveryModel = require('../models/deliveryModel');
const OrderModel = require('../models/orderModel');

class DeliveryService {
    // Driver methods
    static async getDrivers(branchId) {
        return await DeliveryModel.getDrivers(branchId);
    }

    static async createDriver(driverData) {
        return await DeliveryModel.createDriver(driverData);
    }

    // Trip methods
    static async getTrips(branchId) {
        return await DeliveryModel.getTrips(branchId);
    }

    static async getTripById(id, branchId) {
        const trip = await DeliveryModel.getTripById(id, branchId);
        if (!trip) {
            throw new Error('Trip not found');
        }
        return trip;
    }

    static async createTrip(tripData) {
        const { order_id, branchId } = tripData;
        
        // Create trip
        const trip = await DeliveryModel.createTrip(tripData);
        
        // Update order status to Dispatched
        await OrderModel.updateStatus(order_id, branchId, 'Dispatched');
        
        return trip;
    }

    static async updateTripStatus(id, branchId, status) {
        const trip = await DeliveryModel.updateTripStatus(id, branchId, status);
        if (!trip) {
            throw new Error('Trip not found');
        }
        return trip;
    }

    static async completeTrip(id, branchId, tripData) {
        const trip = await DeliveryModel.completeTrip(id, branchId, tripData);
        if (!trip) {
            throw new Error('Trip not found');
        }
        
        // Update order status to Delivered
        await OrderModel.updateStatus(trip.order_id, branchId, 'Delivered');
        
        return trip;
    }
}

module.exports = DeliveryService;