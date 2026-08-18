const { pool } = require('./src/config/database');
const bcrypt = require('bcrypt');

async function debugLogin() {
    console.log('🔍 DEBUG LOGIN\n');
    
    try {
        // 1. Get user from database
        console.log('📊 Step 1: Fetch user from database');
        const result = await pool.query('SELECT * FROM users WHERE username = $1', ['owner1']);
        
        if (result.rows.length === 0) {
            console.log('❌ User not found!');
            return;
        }
        
        const user = result.rows[0];
        console.log('✅ User found:', user.username);
        console.log('📝 Password hash from DB:', user.password);
        console.log('📝 Hash length:', user.password.length);
        console.log('📝 Hash type:', typeof user.password);
        
        // 2. Test bcrypt.compare
        console.log('\n📊 Step 2: Test bcrypt.compare');
        const password = 'password123';
        console.log('🔑 Testing password:', password);
        
        try {
            const isValid = await bcrypt.compare(password, user.password);
            console.log('🔑 bcrypt.compare result:', isValid);
            
            if (isValid) {
                console.log('✅ PASSWORD IS VALID! Login should work!');
            } else {
                console.log('❌ PASSWORD IS INVALID!');
                
                // Generate new hash
                const newHash = await bcrypt.hash(password, 10);
                console.log('\n💡 Generate new hash with Node:');
                console.log(newHash);
                console.log('\n📝 Run this SQL to fix:');
                console.log(`UPDATE users SET password = '${newHash}' WHERE username = 'owner1';`);
            }
        } catch (error) {
            console.error('❌ bcrypt error:', error.message);
        }
        
        // 3. Check if the hash itself is valid
        console.log('\n📊 Step 3: Check hash format');
        const hashParts = user.password.split('$');
        console.log('Hash parts:', hashParts);
        console.log('Algorithm:', hashParts[1] || 'unknown');
        console.log('Rounds:', hashParts[2] || 'unknown');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

debugLogin();