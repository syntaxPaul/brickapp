const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

router.post('/login', AuthController.login);
router.get('/me', authenticateToken, AuthController.getCurrentUser);

module.exports = router;