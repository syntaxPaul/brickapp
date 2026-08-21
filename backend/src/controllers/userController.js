const UserService = require('../services/userService');
const { invalidateUserCache } = require('../middleware/auth');

class UserController {
    static async getAll(req, res) {
        try {
            const users = await UserService.getAllUsers();
            res.json(users);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getById(req, res) {
        try {
            const user = await UserService.getUserWithBranchesAndRoles(req.params.id);
            res.json(user);
        } catch (error) {
            res.status(404).json({ error: error.message });
        }
    }

    static async create(req, res) {
        try {
            const user = await UserService.createUser(req.body);
            res.status(201).json(user);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async update(req, res) {
        try {
            const user = await UserService.updateUser(req.params.id, req.body);
            // Roles/branches are cached per user for a few seconds; drop the
            // entry so permission changes take effect on the very next request.
            invalidateUserCache(req.params.id);
            res.json(user);
        } catch (error) {
            res.status(404).json({ error: error.message });
        }
    }

    static async delete(req, res) {
        try {
            await UserService.deleteUser(req.params.id);
            invalidateUserCache(req.params.id);
            res.json({ message: 'User deleted successfully' });
        } catch (error) {
            res.status(404).json({ error: error.message });
        }
    }
}

module.exports = UserController;