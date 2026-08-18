const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, UserController.getAll);
router.get('/:id', authenticateToken, UserController.getById);
router.post('/', authenticateToken, UserController.create);
router.put('/:id', authenticateToken, UserController.update);
router.delete('/:id', authenticateToken, UserController.delete);

module.exports = router;