const BranchModel = require('../models/branchModel');

class BranchService {
    static async getAllBranches() {
        return await BranchModel.findAll();
    }

    static async getBranchById(id) {
        const branch = await BranchModel.findById(id);
        if (!branch) {
            throw new Error('Branch not found');
        }
        return branch;
    }

    static async getUserBranches(userId) {
        return await BranchModel.findUserBranches(userId);
    }

    static async createBranch(branchData) {
        return await BranchModel.create(branchData);
    }

    static async updateBranch(id, branchData) {
        const branch = await BranchModel.update(id, branchData);
        if (!branch) {
            throw new Error('Branch not found');
        }
        return branch;
    }

    static async deleteBranch(id) {
        const branch = await BranchModel.delete(id);
        if (!branch) {
            throw new Error('Branch not found');
        }
        return branch;
    }
}

module.exports = BranchService;