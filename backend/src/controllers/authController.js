const AuthService = require('../services/authService');

class AuthController {
    static async login(req, res) {
        try {
            const { username, password } = req.body;
            
            console.log('🔐 Login attempt:', username);
            
            if (!username || !password) {
                console.log('❌ Missing username or password');
                return res.status(400).json({ error: 'Username and password are required' });
            }
            
            const result = await AuthService.login(username, password);
            console.log('✅ Login successful:', username);
            res.json(result);
        } catch (error) {
            console.error('❌ Login error:', error.message);
            res.status(401).json({ error: error.message });
        }
    }

    static async getCurrentUser(req, res) {
        try {
            console.log('🔍 Getting current user:', req.user.id);
            const user = await AuthService.getCurrentUser(req.user.id);
            console.log('✅ User found:', user.username);
            res.json(user);
        } catch (error) {
            console.error('❌ Get user error:', error.message);
            res.status(401).json({ error: error.message });
        }
    }
}

module.exports = AuthController;