const express = require('express');
const router = express.Router();
const BranchController = require('../controllers/branchController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, BranchController.getAll);
router.get('/user', authenticateToken, BranchController.getUserBranches);
router.get('/:id', authenticateToken, BranchController.getById);
router.post('/', authenticateToken, BranchController.create);
router.put('/:id', authenticateToken, BranchController.update);
router.delete('/:id', authenticateToken, BranchController.delete);

module.exports = router;