const WastageService = require('../services/wastageService');
const { getCurrentBranch } = require('../middleware/auth');

class WastageController {
    static async getAll(req, res) {
        try {
            const branchId = getCurrentBranch(req);
            const wastage = await WastageService.getAllWastage(branchId);
            res.json(wastage);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async create(req, res) {
        try {
            const branchId = getCurrentBranch(req);
            const userId = req.user.id;
            const wastage = await WastageService.createWastage({
                ...req.body,
                branchId,
                created_by: userId
            });
            res.status(201).json(wastage);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async delete(req, res) {
        try {
            const branchId = getCurrentBranch(req);
            await WastageService.deleteWastage(req.params.id, branchId);
            res.json({ message: 'Wastage record deleted successfully' });
        } catch (error) {
            res.status(404).json({ error: error.message });
        }
    }

    static async getSummary(req, res) {
        try {
            const branchId = getCurrentBranch(req);
            const summary = await WastageService.getSummary(branchId);
            res.json(summary);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = WastageController;