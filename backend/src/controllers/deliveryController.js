const DeliveryService = require('../services/deliveryService');
const { getCurrentBranch } = require('../middleware/auth');

class DeliveryController {
    // Driver methods
    static async getDrivers(req, res) {
        try {
            const branchId = getCurrentBranch(req);
            const drivers = await DeliveryService.getDrivers(branchId);
            res.json(drivers);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async createDriver(req, res) {
        try {
            const branchId = getCurrentBranch(req);
            const driver = await DeliveryService.createDriver({
                ...req.body,
                branchId
            });
            res.status(201).json(driver);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Trip methods
    static async getTrips(req, res) {
        try {
            const branchId = getCurrentBranch(req);
            const trips = await DeliveryService.getTrips(branchId);
            res.json(trips);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getTripById(req, res) {
        try {
            const branchId = getCurrentBranch(req);
            const trip = await DeliveryService.getTripById(req.params.id, branchId);
            res.json(trip);
        } catch (error) {
            res.status(404).json({ error: error.message });
        }
    }

    static async createTrip(req, res) {
        try {
            const branchId = getCurrentBranch(req);
            const userId = req.user.id;
            const trip = await DeliveryService.createTrip({
                ...req.body,
                branchId,
                created_by: userId
            });
            res.status(201).json(trip);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async updateTripStatus(req, res) {
        try {
            const branchId = getCurrentBranch(req);
            const { status } = req.body;
            const trip = await DeliveryService.updateTripStatus(req.params.id, branchId, status);
            res.json(trip);
        } catch (error) {
            res.status(404).json({ error: error.message });
        }
    }

    static async completeTrip(req, res) {
        try {
            const branchId = getCurrentBranch(req);
            const trip = await DeliveryService.completeTrip(req.params.id, branchId, req.body);
            res.json(trip);
        } catch (error) {
            res.status(404).json({ error: error.message });
        }
    }
}

module.exports = DeliveryController;