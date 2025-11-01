require('dotenv').config();
const app = require('./app');
const wsManager = require('./websocket/manager');

const PORT = process.env.PORT || 3000;
const WS_PORT = process.env.WS_PORT || 8080;

// Start WebSocket server
wsManager.initialize(WS_PORT);

// Start HTTP server
app.listen(PORT, () => {
  console.log(`HTTP Server running on port ${PORT}`);
  console.log(`WebSocket Server running on port ${WS_PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  wsManager.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  wsManager.close();
  process.exit(0);
});
