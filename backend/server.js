// backend/server.js
const { app, server } = require('./src/app');
const dotenv = require('dotenv');

dotenv.config();

const port = process.env.PORT || 5010;

// Start the server with Socket.io support
server.listen(port, () => {
    console.log(`🚀 BrickApp API running on http://localhost:${port}`);
    console.log(`📚 Health check: http://localhost:${port}/api/health`);
    console.log(`🔌 WebSocket server running on ws://localhost:${port}`);
});