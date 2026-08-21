// backend/src/app.js
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const dotenv = require('dotenv');
const http = require('http');
const path = require('path');
const fs = require('fs');

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

const { invalidateOnWrite } = require('./middleware/microCache');

const app = express();

// Azure terminates TLS at its front end and forwards over http. Without this,
// req.protocol/req.ip are wrong and secure-cookie logic misbehaves.
app.set('trust proxy', 1);

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

// compression >= 1.8 negotiates brotli when the client offers it, gzip
// otherwise. Threshold keeps tiny payloads from paying compression overhead.
app.use(compression({
    threshold: 1024,
    filter: (req, res) => {
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
    }
}));

app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3010',
    credentials: true
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Any successful write clears the short-lived read cache so users always see
// their own changes immediately.
app.use('/api', invalidateOnWrite);

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
// Azure's Health check probe hits this. It must stay cheap (no database call)
// so the probe never fails just because the database is briefly busy - a failed
// probe would make Azure recycle a perfectly healthy instance.
//
// It does report "draining" during graceful shutdown, which lets Azure pull the
// instance out of rotation before it stops listening.
app.get('/api/health', (req, res) => {
    if (app.get('shuttingDown')) {
        return res.status(503).json({ status: 'draining' });
    }
    res.set('Cache-Control', 'no-store');
    res.json({
        status: 'OK',
        message: 'BrickApp API is running',
        version: '1.0.0',
        uptime_seconds: Math.round(process.uptime()),
        timestamp: new Date().toISOString()
    });
});

// ---------------------------------------------------------------------------
// API routes
// ---------------------------------------------------------------------------
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

// Unknown /api route -> JSON 404 (never fall through to the SPA shell, which
// would hand the frontend an HTML page where it expects JSON).
app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

// ---------------------------------------------------------------------------
// Static frontend
// ---------------------------------------------------------------------------
const frontendDist = path.join(__dirname, '../public');

app.use(express.static(frontendDist, {
    etag: true,
    lastModified: true,
    index: false,
    maxAge: 0,
    setHeaders: (res, filePath) => {
        const base = path.basename(filePath);

        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
            // Vite content-hashes these, so a given URL's bytes never change.
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            return;
        }

        if (base === 'sw.js') {
            // The service worker must never be served stale or a bad version
            // could pin itself in place. Always revalidate.
            res.setHeader('Cache-Control', 'no-cache');
            return;
        }

        if (base === 'index.html') {
            res.setHeader('Cache-Control', 'no-cache');
            return;
        }

        // Everything else (favicon, manifest): short cache, revalidated.
        res.setHeader('Cache-Control', 'public, max-age=3600');
    }
}));

// SPA fallback for client-side routing.
//
// Read index.html once into memory at first use. During a redeploy the file is
// replaced, so we stat it and reload when it changes - this keeps the hot path
// free of disk I/O without ever serving a stale shell after a deploy.
let shellCache = { html: null, mtimeMs: 0 };
const indexPath = path.join(frontendDist, 'index.html');

function readShell() {
    try {
        const stat = fs.statSync(indexPath);
        if (!shellCache.html || stat.mtimeMs !== shellCache.mtimeMs) {
            shellCache = { html: fs.readFileSync(indexPath, 'utf8'), mtimeMs: stat.mtimeMs };
        }
        return shellCache.html;
    } catch (err) {
        return null;
    }
}

app.get(/^(?!\/api).*/, (req, res, next) => {
    const html = readShell();
    if (!html) return next();
    res.set('Cache-Control', 'no-cache');
    res.type('html').send(html);
});

// ---------------------------------------------------------------------------
// 404 + error handling
// ---------------------------------------------------------------------------
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error'
    });
});

// ---------------------------------------------------------------------------
// HTTP + Socket.io
// ---------------------------------------------------------------------------
const server = http.createServer(app);

let io = null;
try {
    const { initializeSocket } = require('./services/socketService');
    io = initializeSocket(server);
    if (io) {
        console.log('Socket.io initialized');
    } else {
        console.log('Socket.io initialization failed - chat features disabled');
    }
} catch (error) {
    console.log('Socket.io not available - chat features disabled');
}

module.exports = { app, server, io };
