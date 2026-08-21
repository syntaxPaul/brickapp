// backend/server.js
const dotenv = require('dotenv');
dotenv.config();

const { app, server, io } = require('./src/app');
const { pool } = require('./src/config/database');

const port = process.env.PORT || 5010;

/**
 * Azure App Service puts an ARR / Application Gateway front end in front of the
 * Node process and holds idle upstream connections open for ~240s. Node's
 * default keepAliveTimeout is 5s. When the front end reuses a socket that Node
 * has just closed, the client gets a 502 that never reached the app at all.
 *
 * Setting our keep-alive well above the platform's idle window removes that
 * whole class of intermittent 502s. headersTimeout must exceed keepAliveTimeout.
 */
server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 125 * 1000;
server.requestTimeout = 60 * 1000;

server.listen(port, () => {
    console.log(`BrickApp API listening on port ${port}`);
    console.log(`Health check: /api/health`);
});

/**
 * Graceful shutdown.
 *
 * Azure sends SIGTERM before recycling a worker (deploys, scale operations,
 * platform maintenance). Without this handler the process dies instantly and
 * every in-flight request becomes a 502 in someone's browser. With it, we stop
 * accepting new connections, let in-flight work finish, then exit cleanly.
 */
let shuttingDown = false;

async function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`${signal} received - shutting down gracefully`);

    // Flip readiness first so the health probe pulls us out of rotation
    // a moment before we actually stop listening.
    app.set('shuttingDown', true);

    const forceExit = setTimeout(() => {
        console.error('Graceful shutdown timed out - forcing exit');
        process.exit(1);
    }, 25 * 1000);
    forceExit.unref();

    try {
        if (io) {
            io.close();
        }
        await new Promise((resolve) => server.close(resolve));
        await pool.end();
        console.log('Shutdown complete');
        clearTimeout(forceExit);
        process.exit(0);
    } catch (err) {
        console.error('Error during shutdown:', err);
        process.exit(1);
    }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Never let a stray rejection take the whole worker down - that turns one bad
// request into a site-wide outage plus a cold start for the next visitor.
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    // An uncaught exception leaves the process in an undefined state, so we do
    // shut down - but gracefully, draining in-flight requests first.
    shutdown('uncaughtException');
});
