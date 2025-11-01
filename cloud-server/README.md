# Cloud Server

The cloud-hosted server component that manages connections with on-premise clients and handles file download requests.

## Features

- **REST API**: Express.js-based HTTP API for triggering downloads
- **WebSocket Server**: Maintains persistent connections with clients
- **Client Management**: Track connected clients and their status
- **File Storage**: Automatically saves downloaded files
- **CLI Tool**: Command-line interface for operations

## API Routes

### Client Management
- `GET /api/clients` - List all clients
- `GET /api/clients/:clientId` - Get client details

### File Downloads
- `POST /api/download/request` - Request file from client
- `GET /api/download/list` - List downloaded files

### Health Check
- `GET /health` - Server health status

## Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Running Tests
```bash
npm test
```

### Code Linting
```bash
npm run lint
npm run lint:fix
```

## Environment Configuration

Create a `.env` file based on `.env.example`:

```env
PORT=3000              # HTTP server port
WS_PORT=8080          # WebSocket server port
NODE_ENV=development  # Environment mode
```

## File Storage

Downloaded files are stored in the `downloads/` directory with the naming pattern:
```
{clientId}_{timestamp}_{originalFileName}
```

Example:
```
downloads/abc-123_1699012345678_data.bin
```

## CLI Commands

After running `npm link`, you can use these commands:

```bash
# List all connected clients
cloud-cli list-clients

# Download a file
cloud-cli download --client <clientId> --file <filePath>

# List downloaded files
cloud-cli list-downloads
```

## Testing

The test suite includes:
- Express app tests
- WebSocket manager tests
- Route tests (file download and client status)
- Integration tests

Run tests with:
```bash
npm test
```

## Architecture

```
src/
├── routes/
│   ├── fileDownload.js    # File download endpoints
│   └── clientStatus.js    # Client status endpoints
├── websocket/
│   └── manager.js         # WebSocket connection management
├── app.js                 # Express app setup
├── index.js               # Server entry point
└── cli.js                 # CLI tool
```

## WebSocket Events

### Server Receives
- `register` - Client registration
- `heartbeat` - Client heartbeat
- `file_chunk` - File data chunk
- `file_complete` - Transfer completion
- `error` - Error notification

### Server Sends
- `registered` - Registration confirmation
- `download_request` - File download request
- `heartbeat_ack` - Heartbeat acknowledgment
```
