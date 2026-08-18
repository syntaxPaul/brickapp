const express = require('express');
const router = express.Router();
const ExpenseController = require('../controllers/expenseController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, ExpenseController.getAll);
router.get('/categories', authenticateToken, ExpenseController.getCategorySummary);
router.post('/', authenticateToken, ExpenseController.create);
router.put('/:id', authenticateToken, ExpenseController.update);
router.delete('/:id', authenticateToken, ExpenseController.delete);

module.exports = router;