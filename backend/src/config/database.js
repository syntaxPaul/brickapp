const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// Use the DATABASE_URL format if you prefer, or individual parameters
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Alternative: Use connection string
// const pool = new Pool({
//     connectionString: `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`
// });

// Test connection on startup
pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL database: brickkapp_db');
});

pool.on('error', (err) => {
    console.error('❌ Unexpected database error:', err);
});

module.exports = { pool };