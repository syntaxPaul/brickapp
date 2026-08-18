const ExpenseService = require('../services/expenseService');
const { getCurrentBranch } = require('../middleware/auth');

class ExpenseController {
    static async getAll(req, res) {
        try {
            const branchId = getCurrentBranch(req);
            const expenses = await ExpenseService.getAllExpenses(branchId);
            res.json(expenses);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async create(req, res) {
        try {
            const branchId = getCurrentBranch(req);
            const userId = req.user.id;
            const expense = await ExpenseService.createExpense({
                ...req.body,
                branchId,
                created_by: userId
            });
            res.status(201).json(expense);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async update(req, res) {
        try {
            const branchId = getCurrentBranch(req);
            const expense = await ExpenseService.updateExpense(req.params.id, branchId, req.body);
            res.json(expense);
        } catch (error) {
            res.status(404).json({ error: error.message });
        }
    }

    static async delete(req, res) {
        try {
            const branchId = getCurrentBranch(req);
            await ExpenseService.deleteExpense(req.params.id, branchId);
            res.json({ message: 'Expense deleted successfully' });
        } catch (error) {
            res.status(404).json({ error: error.message });
        }
    }

    static async getCategorySummary(req, res) {
        try {
            const branchId = getCurrentBranch(req);
            const summary = await ExpenseService.getCategorySummary(branchId);
            res.json(summary);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = ExpenseController;