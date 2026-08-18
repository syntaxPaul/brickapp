const ProductionService = require('../services/productionService');
const { getCurrentBranch } = require('../middleware/auth');

class ProductionController {
    // Machine methods
    static async getMachines(req, res) {
        try {
            const branchId = getCurrentBranch(req);
            const machines = await ProductionService.getMachines(branchId);
            res.json(machines);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getMachineById(req, res) {
        try {
            const branchId = getCurrentBranch(req);
            const machine = await ProductionService.getMachineById(req.params.id, branchId);
            res.json(machine);
        } catch (error) {
            res.status(404).json({ error: error.message });
        }
    }

    static async createMachine(req, res) {
        try {
            const branchId = getCurrentBranch(req);
            const machine = await ProductionService.createMachine({
                ...req.body,
                branchId
            });
            res.status(201).json(machine);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async updateMachine(req, res) {
        try {
            const branchId = getCurrentBranch(req);
            const machine = await ProductionService.updateMachine(req.params.id, branchId, req.body);
            res.json(machine);
        } catch (error) {
            res.status(404).json({ error: error.message });
        }
    }

    // Batch methods
    static async getBatches(req, res) {
        try {
            const branchId = getCurrentBranch(req);
            const batches = await ProductionService.getBatches(branchId);
            res.json(batches);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async createBatch(req, res) {
        try {
            const branchId = getCurrentBranch(req);
            const batch = await ProductionService.createBatch({
                ...req.body,
                branchId
            });
            res.status(201).json(batch);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async completeBatch(req, res) {
        try {
            const branchId = getCurrentBranch(req);
            const { actual_quantity, rejected_quantity } = req.body;
            const batch = await ProductionService.completeBatch(
                req.params.id,
                branchId,
                actual_quantity,
                rejected_quantity
            );
            res.json(batch);
        } catch (error) {
            res.status(404).json({ error: error.message });
        }
    }
}

module.exports = ProductionController;