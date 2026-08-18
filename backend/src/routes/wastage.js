const express = require('express');
const router = express.Router();
const WastageController = require('../controllers/wastageController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, WastageController.getAll);
router.get('/summary', authenticateToken, WastageController.getSummary);
router.post('/', authenticateToken, WastageController.create);
router.delete('/:id', authenticateToken, WastageController.delete);

module.exports = router;