const BranchService = require('../services/branchService');

class BranchController {
    static async getAll(req, res) {
        try {
            const branches = await BranchService.getAllBranches();
            res.json(branches);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getById(req, res) {
        try {
            const branch = await BranchService.getBranchById(req.params.id);
            res.json(branch);
        } catch (error) {
            res.status(404).json({ error: error.message });
        }
    }

    static async getUserBranches(req, res) {
        try {
            const branches = await BranchService.getUserBranches(req.user.id);
            res.json(branches);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async create(req, res) {
        try {
            const branch = await BranchService.createBranch(req.body);
            res.status(201).json(branch);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async update(req, res) {
        try {
            const branch = await BranchService.updateBranch(req.params.id, req.body);
            res.json(branch);
        } catch (error) {
            res.status(404).json({ error: error.message });
        }
    }

    static async delete(req, res) {
        try {
            await BranchService.deleteBranch(req.params.id);
            res.json({ message: 'Branch deleted successfully' });
        } catch (error) {
            res.status(404).json({ error: error.message });
        }
    }
}

module.exports = BranchController;