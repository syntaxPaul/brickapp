const ProductService = require('../services/productService');
const { getCurrentBranch } = require('../middleware/auth');

class ProductController {
    static async getAll(req, res) {
        try {
            const branchId = getCurrentBranch(req);
            const products = await ProductService.getAllProducts(branchId);
            res.json(products);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getById(req, res) {
        try {
            const branchId = getCurrentBranch(req);
            const product = await ProductService.getProductById(req.params.id, branchId);
            res.json(product);
        } catch (error) {
            res.status(404).json({ error: error.message });
        }
    }

    static async create(req, res) {
        try {
            const branchId = getCurrentBranch(req);
            const product = await ProductService.createProduct({
                ...req.body,
                branchId
            });
            res.status(201).json(product);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async update(req, res) {
        try {
            const branchId = getCurrentBranch(req);
            const product = await ProductService.updateProduct(req.params.id, branchId, req.body);
            res.json(product);
        } catch (error) {
            res.status(404).json({ error: error.message });
        }
    }

    static async delete(req, res) {
        try {
            const branchId = getCurrentBranch(req);
            await ProductService.deleteProduct(req.params.id, branchId);
            res.json({ message: 'Product deleted successfully' });
        } catch (error) {
            res.status(404).json({ error: error.message });
        }
    }

    static async updateStock(req, res) {
        try {
            const branchId = getCurrentBranch(req);
            const { quantity } = req.body;
            const product = await ProductService.updateStock(req.params.id, branchId, quantity);
            res.json(product);
        } catch (error) {
            res.status(404).json({ error: error.message });
        }
    }

    static async getStockAlerts(req, res) {
        try {
            const branchId = getCurrentBranch(req);
            const alerts = await ProductService.getStockAlerts(branchId);
            res.json(alerts);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = ProductController;