const WastageModel = require('../models/wastageModel');

class WastageService {
    static async getAllWastage(branchId) {
        return await WastageModel.findAll(branchId);
    }

    static async createWastage(wastageData) {
        // Calculate cost impact
        const costImpact = await WastageModel.calculateCostImpact(
            wastageData.product_id,
            wastageData.branchId,
            wastageData.quantity
        );
        
        return await WastageModel.create({
            ...wastageData,
            cost_impact: costImpact
        });
    }

    static async deleteWastage(id, branchId) {
        const wastage = await WastageModel.delete(id, branchId);
        if (!wastage) {
            throw new Error('Wastage record not found');
        }
        return wastage;
    }

    static async getSummary(branchId) {
        return await WastageModel.getSummary(branchId);
    }

    static async getMonthlyTotal(branchId) {
        return await WastageModel.getMonthlyTotal(branchId);
    }
}

module.exports = WastageService;