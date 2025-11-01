# Quick Start Guide

# Architecture Design
![alt text](<Architecture Design sharing download on-premise.drawio.png>)


This guide will help you get the system up and running in 5 minutes.

## Prerequisites

- Node.js 14+ installed
- Terminal/Command prompt access

## Step 1: Install Dependencies

```bash
# Install cloud server dependencies
cd cloud-server
npm install

# Install client dependencies
cd ../on-premise-client
npm install
```

## Step 2: Configure Environment

### Cloud Server

```bash
cd cloud-server
cp .env.example .env
```

The defaults work for local testing. For production, update the values.

### On-Premise Client

```bash
cd on-premise-client
cp .env.example .env
```

Edit `.env` and set:
```env
SERVER_URL=ws://localhost:8080
CLIENT_NAME=Test-Restaurant
DATA_FILE_PATH=/absolute/path/to/on-premise-client/data/sample.bin
```

**Important**: Use the full absolute path for `DATA_FILE_PATH`! if outside folder on-premise-client,
if path in ./on-premise-client/data, you can write ./data/sample.bin for parameter in API Cloud Server /download/request

## Step 3: Create Test File

```bash
cd on-premise-client
npm run create-sample
```

This creates a 100MB test file at `data/sample.bin`.

## Step 4: Start the Cloud Server

Open a new terminal:

```bash
cd cloud-server
npm start
```

You should see:
```
HTTP Server running on port 3000
WebSocket Server running on port 8080
```

## Step 5: Start the On-Premise Client

Open another terminal:

```bash
cd on-premise-client
npm start
```

You should see:
```
Connected to server
Successfully registered with server
Client ID: abc-123-def-456
Client Name: Test-Restaurant
```

## Step 6: Test File Download

Using REST API

Open a third terminal:

```bash
# Get list of connected clients
curl http://localhost:3000/api/clients

# Copy the clientId from the response, then:
curl -X POST http://localhost:3000/api/download/request \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "YOUR_CLIENT_ID_HERE",
    "filePath": "/absolute/path/to/on-premise-client/data/sample.bin"
  }'

or can use relative path with note: the folder path still in on-premise-client folder
curl -X POST http://localhost:3000/api/download/request \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "YOUR_CLIENT_ID_HERE",
    "filePath": "./data/sample.bin"
  }'
```

## Step 7: Verify Download

Check the downloaded file:

```bash
cd cloud-server
ls -lh downloads/
```

You should see a file like:
```
abc-123-def-456_1699012345678_sample.bin
```

## 🎉 Finish! 🎉