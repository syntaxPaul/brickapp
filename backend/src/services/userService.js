const UserModel = require('../models/userModel');

class UserService {
    static async getAllUsers() {
        return await UserModel.findAll();
    }

    static async getUserById(id) {
        const user = await UserModel.findById(id);
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    }

    static async createUser(userData) {
        const { branches, roles, ...userInfo } = userData;
        
        // Check if username exists
        const existingUser = await UserModel.findByUsername(userInfo.username);
        if (existingUser) {
            throw new Error('Username already exists');
        }
        
        // Create user
        const user = await UserModel.create(userInfo);
        
        // Assign branches and roles
        if (branches && branches.length > 0) {
            await UserModel.assignBranches(user.id, branches);
        }
        if (roles && roles.length > 0) {
            await UserModel.assignRoles(user.id, roles);
        }
        
        return user;
    }

    static async updateUser(id, userData) {
        const { branches, roles, ...userInfo } = userData;
        
        // Update user
        const user = await UserModel.update(id, userInfo);
        if (!user) {
            throw new Error('User not found');
        }
        
        // Update branches and roles
        if (branches !== undefined) {
            await UserModel.assignBranches(id, branches);
        }
        if (roles !== undefined) {
            await UserModel.assignRoles(id, roles);
        }
        
        return user;
    }

    static async deleteUser(id) {
        const user = await UserModel.delete(id);
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    }

    static async getUserWithBranchesAndRoles(id) {
        const user = await UserModel.getUserWithBranchesAndRoles(id);
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    }
}

module.exports = UserService;