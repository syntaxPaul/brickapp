const ProductModel = require('../models/productModel');

class ProductService {
    static async getAllProducts(branchId) {
        return await ProductModel.findAll(branchId);
    }

    static async getProductById(id, branchId) {
        const product = await ProductModel.findById(id, branchId);
        if (!product) {
            throw new Error('Product not found');
        }
        return product;
    }

    static async createProduct(productData) {
        return await ProductModel.create(productData);
    }

    static async updateProduct(id, branchId, productData) {
        const product = await ProductModel.update(id, branchId, productData);
        if (!product) {
            throw new Error('Product not found');
        }
        return product;
    }

    static async deleteProduct(id, branchId) {
        const product = await ProductModel.delete(id, branchId);
        if (!product) {
            throw new Error('Product not found');
        }
        return product;
    }

    static async updateStock(id, branchId, quantity) {
        const product = await ProductModel.updateStock(id, branchId, quantity);
        if (!product) {
            throw new Error('Product not found');
        }
        return product;
    }

    static async getStockAlerts(branchId) {
        return await ProductModel.getStockAlerts(branchId);
    }
}

module.exports = ProductService;