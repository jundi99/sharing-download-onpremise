require('dotenv').config();
const OnPremiseClient = require('./client');

const SERVER_URL = process.env.SERVER_URL || 'ws://localhost:8080';
const CLIENT_NAME = process.env.CLIENT_NAME || 'Default-Client';
const DATA_FILE_PATH = process.env.DATA_FILE_PATH || './data/sample.bin';

console.log('=== On-Premise Client ===');
console.log(`Server URL: ${SERVER_URL}`);
console.log(`Client Name: ${CLIENT_NAME}`);
console.log(`Data File Path: ${DATA_FILE_PATH}`);
console.log('========================\n');

const client = new OnPremiseClient(SERVER_URL, CLIENT_NAME, DATA_FILE_PATH);
client.connect();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  client.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  client.close();
  process.exit(0);
});
