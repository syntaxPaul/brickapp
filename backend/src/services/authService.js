const UserModel = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

class AuthService {
    static async login(username, password) {
        console.log('🔍 Looking up user:', username);
        const user = await UserModel.findByUsername(username);
        
        if (!user) {
            console.log('❌ User not found:', username);
            throw new Error('Invalid username or password');
        }
        
        console.log('✅ User found:', username);
        console.log('🔑 Comparing password...');
        
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            console.log('❌ Invalid password for:', username);
            throw new Error('Invalid username or password');
        }
        
        console.log('✅ Password valid for:', username);
        
        const userData = await UserModel.getUserWithBranchesAndRoles(user.id);
        
        const token = jwt.sign(
            { id: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '8h' }
        );
        
        console.log('✅ Token generated for:', username);
        
        return {
            token,
            user: userData,
            branches: userData?.branches || []
        };
    }

    static async getCurrentUser(userId) {
        console.log('🔍 Getting user with ID:', userId);
        const user = await UserModel.getUserWithBranchesAndRoles(userId);
        if (!user) {
            console.log('❌ User not found:', userId);
            throw new Error('User not found');
        }
        console.log('✅ User found:', user.username);
        return user;
    }

    static verifyToken(token) {
        try {
            return jwt.verify(token, JWT_SECRET);
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }
}

module.exports = AuthService;