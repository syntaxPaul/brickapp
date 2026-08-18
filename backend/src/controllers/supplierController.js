const SupplierService = require('../services/supplierService');
const { getCurrentBranch } = require('../middleware/auth');

class SupplierController {
    static async getAll(req, res) {
        try {
            const branchId = getCurrentBranch(req);
            const suppliers = await SupplierService.getAllSuppliers(branchId);
            res.json(suppliers);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getById(req, res) {
        try {
            const branchId = getCurrentBranch(req);
            const supplier = await SupplierService.getSupplierById(req.params.id, branchId);
            res.json(supplier);
        } catch (error) {
            res.status(404).json({ error: error.message });
        }
    }

    static async create(req, res) {
        try {
            const branchId = getCurrentBranch(req);
            const supplier = await SupplierService.createSupplier({
                ...req.body,
                branchId
            });
            res.status(201).json(supplier);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async update(req, res) {
        try {
            const branchId = getCurrentBranch(req);
            const supplier = await SupplierService.updateSupplier(req.params.id, branchId, req.body);
            res.json(supplier);
        } catch (error) {
            res.status(404).json({ error: error.message });
        }
    }

    static async delete(req, res) {
        try {
            const branchId = getCurrentBranch(req);
            await SupplierService.deleteSupplier(req.params.id, branchId);
            res.json({ message: 'Supplier deleted successfully' });
        } catch (error) {
            res.status(404).json({ error: error.message });
        }
    }
}

module.exports = SupplierController;