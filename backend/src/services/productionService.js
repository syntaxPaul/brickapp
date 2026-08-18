const ProductionModel = require('../models/productionModel');
const ProductModel = require('../models/productModel');

class ProductionService {
    // Machine methods
    static async getMachines(branchId) {
        return await ProductionModel.getMachines(branchId);
    }

    static async getMachineById(id, branchId) {
        const machine = await ProductionModel.getMachineById(id, branchId);
        if (!machine) {
            throw new Error('Machine not found');
        }
        return machine;
    }

    static async createMachine(machineData) {
        return await ProductionModel.createMachine(machineData);
    }

    static async updateMachine(id, branchId, machineData) {
        const machine = await ProductionModel.updateMachine(id, branchId, machineData);
        if (!machine) {
            throw new Error('Machine not found');
        }
        return machine;
    }

    // Batch methods
    static async getBatches(branchId) {
        return await ProductionModel.getBatches(branchId);
    }

    static async createBatch(batchData) {
        const { branchId, product_id } = batchData;
        
        // Generate batch number
        const batchNumber = await ProductionModel.generateBatchNumber();
        
        return await ProductionModel.createBatch({
            ...batchData,
            batch_number: batchNumber
        });
    }

    static async completeBatch(id, branchId, actualQuantity, rejectedQuantity) {
        const batch = await ProductionModel.getBatchById(id, branchId);
        if (!batch) {
            throw new Error('Batch not found');
        }
        
        // Update batch
        const updatedBatch = await ProductionModel.completeBatch(
            id,
            branchId,
            actualQuantity,
            rejectedQuantity
        );
        
        // Update product stock with good quantity
        const goodQuantity = actualQuantity - (rejectedQuantity || 0);
        await ProductModel.updateStock(batch.product_id, branchId, goodQuantity);
        
        return updatedBatch;
    }
}

module.exports = ProductionService;