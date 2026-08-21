// backend/src/app.js
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const dotenv = require('dotenv');
const http = require('http');
const path = require('path');

dotenv.config();

// Import routes (matching file structure)
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const supplierRoutes = require('./routes/suppliers');
const expenseRoutes = require('./routes/expenses');
const wastageRoutes = require('./routes/wastage');
const productionRoutes = require('./routes/production');
const deliveryRoutes = require('./routes/delivery');
const dashboardRoutes = require('./routes/dashboard');
const userRoutes = require('./routes/users');
const branchRoutes = require('./routes/branch');
const chatRoutes = require('./routes/chat');
const timelineRoutes = require('./routes/timeline');

const app = express();

// Middleware
app.use(compression());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3010',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/wastage', wastageRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/timeline', timelineRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'BrickApp API is running',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// Serve built frontend (production) and fall back to index.html for client-side routing
const frontendDist = path.join(__dirname, '../public');
app.use(express.static(frontendDist, {
    setHeaders: (res, filePath) => {
        // Vite's /assets files are content-hashed (new hash per build), so they're
        // safe to cache forever. index.html is not hashed, so it must always be revalidated.
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
    }
}));
app.get(/^(?!\/api).*/, (req, res, next) => {
    res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
        if (err) next();
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error'
    });
});

// Create HTTP server for Socket.io
const server = http.createServer(app);

// Initialize Socket.io - with try-catch to prevent crash if not installed
let io = null;
try {
    const { initializeSocket } = require('./services/socketService');
    io = initializeSocket(server);
    if (io) {
        console.log('✅ Socket.io initialized successfully');
    } else {
        console.log('⚠️ Socket.io initialization failed - chat features disabled');
    }
} catch (error) {
    console.log('⚠️ Socket.io not available - chat features disabled');
    console.log('💡 Run: npm install socket.io socket.io-client');
}

// Export both app and server
module.exports = { app, server, io };