const ExpenseModel = require('../models/expenseModel');

class ExpenseService {
    static async getAllExpenses(branchId) {
        return await ExpenseModel.findAll(branchId);
    }

    static async createExpense(expenseData) {
        return await ExpenseModel.create(expenseData);
    }

    static async updateExpense(id, branchId, expenseData) {
        const expense = await ExpenseModel.update(id, branchId, expenseData);
        if (!expense) {
            throw new Error('Expense not found');
        }
        return expense;
    }

    static async deleteExpense(id, branchId) {
        const expense = await ExpenseModel.delete(id, branchId);
        if (!expense) {
            throw new Error('Expense not found');
        }
        return expense;
    }

    static async getCategorySummary(branchId) {
        return await ExpenseModel.getCategorySummary(branchId);
    }

    static async getMonthlyTotal(branchId) {
        return await ExpenseModel.getMonthlyTotal(branchId);
    }

    static async getChartData(branchId, months = 6) {
        return await ExpenseModel.getChartData(branchId, months);
    }
}

module.exports = ExpenseService;