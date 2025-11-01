const express = require('express');
const fs = require('fs');
const path = require('path');
const wsManager = require('../websocket/manager');

const router = express.Router();

// Create downloads directory if it doesn't exist
const downloadsDir = path.join(__dirname, '../../downloads');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

/**
 * POST /api/download/request
 * Request a file download from a specific client
 * Body: { clientId, filePath }
 */
router.post('/request', async (req, res) => {
  try {
    const { clientId, filePath } = req.body;

    if (!clientId || !filePath) {
      return res.status(400).json({
        success: false,
        message: 'clientId and filePath are required',
      });
    }

    // Check if client is connected
    if (!wsManager.isClientConnected(clientId)) {
      return res.status(404).json({
        success: false,
        message: `Client ${clientId} is not connected`,
      });
    }

    console.log(`Requesting file ${filePath} from client ${clientId}`);

    // Request file download
    const result = await wsManager.requestFileDownload(clientId, filePath);

    // Combine chunks and save file
    const fileBuffer = Buffer.concat(
      result.chunks.map((chunk) => Buffer.from(chunk, 'base64')),
    );

    const fileName = path.basename(filePath);
    const localFilePath = path.join(downloadsDir, `${clientId}_${Date.now()}_${fileName}`);

    fs.writeFileSync(localFilePath, fileBuffer);

    console.log(`File saved to: ${localFilePath}`);

    return res.json({
      success: true,
      message: 'File downloaded successfully',
      filePath: localFilePath,
      fileSize: fileBuffer.length,
      fileName,
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error downloading file',
    });
  }
});

/**
 * GET /api/download/list
 * List all downloaded files
 */
router.get('/list', (req, res) => {
  try {
    const files = fs.readdirSync(downloadsDir).map((fileName) => {
      const filePath = path.join(downloadsDir, fileName);
      const stats = fs.statSync(filePath);
      return {
        fileName,
        filePath,
        size: stats.size,
        created: stats.birthtime,
      };
    });

    res.json({
      success: true,
      files,
    });
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error listing files',
    });
  }
});

module.exports = router;
