# On-Premise Client

The client component that runs on local servers (e.g., in restaurants) and connects to the cloud server to facilitate file downloads.

## Features

- **WebSocket Connection**: Persistent connection to cloud server
- **Auto-Reconnection**: Automatically reconnects on disconnect
- **Heartbeat System**: Regular health checks every 30 seconds
- **File Streaming**: Efficient chunked file transfer
- **Error Handling**: Comprehensive error reporting

## Running the Client

### First Time Setup

1. Create a sample file for testing:
```bash
npm run create-sample
```

This creates a 100MB file at `data/sample.bin`.

2. Configure the client:
```bash
cp .env.example .env
```

Edit `.env`:
```env
SERVER_URL=ws://your-cloud-server:8080
CLIENT_NAME=Restaurant-1
DATA_FILE_PATH=/full/path/to/data/sample.bin
```

### Start the Client

Development mode (with auto-restart):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## Environment Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| SERVER_URL | WebSocket server URL | ws://cloud.example.com:8080 |
| CLIENT_NAME | Display name for this client | Restaurant-Main-Street |
| DATA_FILE_PATH | Path to file to share | /var/data/file.bin |

## How It Works

1. **Connection**
   - Client connects to cloud server WebSocket
   - Registers with unique ID and configured name
   - Starts heartbeat timer

2. **File Download Request**
   - Server sends download request with file path
   - Client validates file exists
   - Reads file in chunks (default 1MB)
   - Sends each chunk encoded in base64

3. **Transfer Completion**
   - Client sends completion message
   - Connection remains open for future requests

4. **Reconnection**
   - On disconnect, waits 5 seconds
   - Automatically attempts to reconnect
   - Maintains same client ID across reconnections

## Testing

Run the test suite:
```bash
npm test
```

Run with linting:
```bash
npm run lint
npm test
```

## File Requirements

The file specified in `DATA_FILE_PATH` should:
- Exist and be readable by the client process
- Have sufficient permissions
- Be accessible at the exact path specified

For testing, use the sample file generator:
```bash
npm run create-sample
```

## Connection Status

Monitor the console output to see:
- Connection status
- Registration confirmation
- Download requests
- File transfer progress
- Heartbeat messages

Example output:
```
Connecting to server: ws://localhost:8080
Connected to server
Successfully registered with server
Client ID: abc-123-def-456
Client Name: Restaurant-1
Download request received for: /path/to/data/sample.bin
Request ID: req-789-ghi-012
File size: 100.00 MB
Starting file transfer...
Progress: 25.00% (26 chunks sent)
Progress: 50.00% (52 chunks sent)
Progress: 75.00% (78 chunks sent)
Progress: 100.00% (104 chunks sent)
File transfer complete
```

## Troubleshooting

### Can't Connect to Server
- Verify `SERVER_URL` is correct
- Check network connectivity to cloud server
- Ensure WebSocket port is not blocked

### File Not Found Error
- Verify `DATA_FILE_PATH` points to existing file
- Check file permissions
- Use absolute path, not relative

### Transfer Fails
- Check file is not being modified during transfer
- Ensure stable network connection
- Review server logs for errors

## Architecture

```
src/
├── client.js    # WebSocket client implementation
└── index.js     # Entry point with configuration

scripts/
└── createSampleFile.js    # Test file generator

data/
└── sample.bin             # Generated test file
```

## Client Events

The client handles these message types from the server:

- `registered` - Confirmation of registration
- `download_request` - Request to send a file
- `heartbeat_ack` - Heartbeat acknowledgment

The client sends these message types:

- `register` - Initial registration
- `heartbeat` - Health check ping
- `file_chunk` - File data chunk
- `file_complete` - Transfer completion
- `error` - Error notification
```
