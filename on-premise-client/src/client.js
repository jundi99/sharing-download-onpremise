const WebSocket = require('ws');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

class OnPremiseClient {
  constructor(serverUrl, clientName, dataFilePath) {
    this.serverUrl = serverUrl;
    this.clientId = uuidv4();
    this.clientName = clientName || `Client-${this.clientId.slice(0, 8)}`;
    this.dataFilePath = dataFilePath;
    this.ws = null;
    this.reconnectInterval = 5000;
    this.heartbeatInterval = 30000;
    this.heartbeatTimer = null;
  }

  connect() {
    console.log(`Connecting to server: ${this.serverUrl}`);
    this.ws = new WebSocket(this.serverUrl);

    this.ws.on('open', () => {
      console.log('Connected to server');
      this.register();
      this.startHeartbeat();
    });

    this.ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        this.handleMessage(data);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });

    this.ws.on('close', () => {
      console.log('Disconnected from server');
      this.stopHeartbeat();
      this.scheduleReconnect();
    });

    this.ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  register() {
    this.send({
      type: 'register',
      clientId: this.clientId,
      clientName: this.clientName,
    });
  }

  handleMessage(data) {
    const { type } = data;

    switch (type) {
      case 'registered':
        console.log('Successfully registered with server');
        console.log(`Client ID: ${this.clientId}`);
        console.log(`Client Name: ${this.clientName}`);
        break;
      case 'download_request':
        this.handleDownloadRequest(data);
        break;
      case 'heartbeat_ack':
        // Heartbeat acknowledged
        break;
      default:
        console.log('Unknown message type:', type);
    }
  }

  async handleDownloadRequest(data) {
    const { requestId, filePath, chunkSize } = data;

    console.log(`Download request received for: ${filePath}`);
    console.log(`Request ID: ${requestId}`);

    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Get file stats
      const stats = fs.statSync(filePath);
      const fileSize = stats.size;

      console.log(`File size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
      console.log('Starting file transfer...');

      // Read and send file in chunks
      const stream = fs.createReadStream(filePath, {
        highWaterMark: chunkSize,
      });

      let chunkIndex = 0;
      let totalBytesSent = 0;

      stream.on('data', (chunk) => {
        const base64Chunk = chunk.toString('base64');

        this.send({
          type: 'file_chunk',
          requestId,
          chunk: base64Chunk,
          chunkIndex,
        });

        totalBytesSent += chunk.length;
        const progress = ((totalBytesSent / fileSize) * 100).toFixed(2);
        console.log(`Progress: ${progress}% (${chunkIndex + 1} chunks sent)`);

        chunkIndex += 1;
      });

      stream.on('end', () => {
        console.log('File transfer complete');
        this.send({
          type: 'file_complete',
          requestId,
          success: true,
          message: 'File transferred successfully',
        });
      });

      stream.on('error', (error) => {
        console.error('Error reading file:', error);
        this.send({
          type: 'error',
          requestId,
          message: error.message,
        });
      });
    } catch (error) {
      console.error('Error handling download request:', error);
      this.send({
        type: 'error',
        requestId,
        message: error.message,
      });
    }
  }

  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      this.send({
        type: 'heartbeat',
        clientId: this.clientId,
      });
    }, this.heartbeatInterval);
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  scheduleReconnect() {
    console.log(`Reconnecting in ${this.reconnectInterval / 1000} seconds...`);
    setTimeout(() => {
      this.connect();
    }, this.reconnectInterval);
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  close() {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
    }
  }
}

module.exports = OnPremiseClient;
