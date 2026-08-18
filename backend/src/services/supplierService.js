const SupplierModel = require('../models/supplierModel');

class SupplierService {
    static async getAllSuppliers(branchId) {
        return await SupplierModel.findAll(branchId);
    }

    static async getSupplierById(id, branchId) {
        const supplier = await SupplierModel.findById(id, branchId);
        if (!supplier) {
            throw new Error('Supplier not found');
        }
        return supplier;
    }

    static async createSupplier(supplierData) {
        return await SupplierModel.create(supplierData);
    }

    static async updateSupplier(id, branchId, supplierData) {
        const supplier = await SupplierModel.update(id, branchId, supplierData);
        if (!supplier) {
            throw new Error('Supplier not found');
        }
        return supplier;
    }

    static async deleteSupplier(id, branchId) {
        const supplier = await SupplierModel.delete(id, branchId);
        if (!supplier) {
            throw new Error('Supplier not found');
        }
        return supplier;
    }
}

module.exports = SupplierService;