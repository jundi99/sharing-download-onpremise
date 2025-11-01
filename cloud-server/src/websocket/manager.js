const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const EventEmitter = require('events');

class WebSocketManager extends EventEmitter {
  constructor() {
    super();
    this.wss = null;
    this.clients = new Map(); // Map<clientId, { ws, clientName, connected }>
    this.pendingRequests = new Map(); // Map<requestId, { resolve, reject, timeout }>
  }

  initialize(port) {
    this.wss = new WebSocket.Server({ port });

    this.wss.on('connection', (ws) => {
      console.log('New client attempting to connect');

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleMessage(ws, data);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      });

      ws.on('close', () => {
        const clientId = this.findClientIdByWs(ws);
        if (clientId) {
          console.log(`Client disconnected: ${clientId}`);
          const client = this.clients.get(clientId);
          if (client) {
            client.connected = false;
          }
        }
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });

    console.log(`WebSocket server started on port ${port}`);
  }

  handleMessage(ws, data) {
    const { type } = data;

    switch (type) {
      case 'register':
        this.handleRegistration(ws, data);
        break;
      case 'file_chunk':
        this.handleFileChunk(data);
        break;
      case 'file_complete':
        this.handleFileComplete(data);
        break;
      case 'error':
        this.handleError(data);
        break;
      case 'heartbeat':
        this.handleHeartbeat(ws, data);
        break;
      default:
        console.log('Unknown message type:', type);
    }
  }

  handleRegistration(ws, data) {
    const { clientId, clientName } = data;

    if (this.clients.has(clientId)) {
      // Reconnection
      const client = this.clients.get(clientId);
      client.ws = ws;
      client.connected = true;
      console.log(`Client reconnected: ${clientId} (${clientName})`);
    } else {
      // New connection
      this.clients.set(clientId, {
        ws,
        clientName: clientName || `Client-${clientId.slice(0, 8)}`,
        connected: true,
        lastHeartbeat: Date.now(),
      });
      console.log(`New client registered: ${clientId} (${clientName})`);
    }

    ws.send(JSON.stringify({
      type: 'registered',
      clientId,
      message: 'Successfully registered with server',
    }));

    this.emit('clientConnected', clientId);
  }

  handleFileChunk(data) {
    const { requestId, chunk, chunkIndex } = data;
    this.emit('fileChunk', { requestId, chunk, chunkIndex });
  }

  handleFileComplete(data) {
    const { requestId, success, message } = data;
    const pending = this.pendingRequests.get(requestId);

    if (pending) {
      clearTimeout(pending.timeout);
      if (success) {
        pending.resolve({ success: true, message });
      } else {
        pending.reject(new Error(message || 'File transfer failed'));
      }
      this.pendingRequests.delete(requestId);
    }
  }

  handleError(data) {
    const { requestId, message } = data;
    const pending = this.pendingRequests.get(requestId);

    if (pending) {
      clearTimeout(pending.timeout);
      pending.reject(new Error(message));
      this.pendingRequests.delete(requestId);
    }
  }

  handleHeartbeat(ws, data) {
    const { clientId } = data;
    const client = this.clients.get(clientId);

    if (client) {
      client.lastHeartbeat = Date.now();
      ws.send(JSON.stringify({ type: 'heartbeat_ack' }));
    }
  }

  findClientIdByWs(ws) {
    const entries = Array.from(this.clients.entries());
    const found = entries.find(([, client]) => client.ws === ws);
    return found ? found[0] : null;
  }

  requestFileDownload(clientId, filePath, chunkSize = 1024 * 1024) {
    const client = this.clients.get(clientId);

    if (!client) {
      return Promise.reject(new Error(`Client ${clientId} not found`));
    }

    if (!client.connected) {
      return Promise.reject(new Error(`Client ${clientId} is not connected`));
    }

    return new Promise((resolve, reject) => {
      const requestId = uuidv4();
      const chunks = [];

      // Listen for file chunks
      const chunkHandler = ({ requestId: rid, chunk, chunkIndex }) => {
        if (rid === requestId) {
          chunks[chunkIndex] = chunk;
        }
      };

      this.on('fileChunk', chunkHandler);

      // Set timeout
      const timeout = setTimeout(() => {
        this.removeListener('fileChunk', chunkHandler);
        this.pendingRequests.delete(requestId);
        reject(new Error('File download timeout'));
      }, 300000); // 5 minutes timeout

      this.pendingRequests.set(requestId, {
        resolve: (result) => {
          this.removeListener('fileChunk', chunkHandler);
          resolve({ ...result, chunks });
        },
        reject: (error) => {
          this.removeListener('fileChunk', chunkHandler);
          reject(error);
        },
        timeout,
      });

      // Send download request to client
      client.ws.send(JSON.stringify({
        type: 'download_request',
        requestId,
        filePath,
        chunkSize,
      }));
    });
  }

  getConnectedClients() {
    return Array.from(this.clients.entries()).map(([clientId, client]) => ({
      clientId,
      clientName: client.clientName,
      connected: client.connected,
      lastHeartbeat: client.lastHeartbeat,
    }));
  }

  isClientConnected(clientId) {
    const client = this.clients.get(clientId);
    return client && client.connected;
  }

  close() {
    if (this.wss) {
      this.wss.close();
    }
  }
}

// Singleton instance
const wsManager = new WebSocketManager();

module.exports = wsManager;
