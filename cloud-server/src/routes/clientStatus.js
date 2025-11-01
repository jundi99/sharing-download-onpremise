const express = require('express');
const wsManager = require('../websocket/manager');

const router = express.Router();

/**
 * GET /api/clients
 * Get list of all connected clients
 */
router.get('/', (req, res) => {
  try {
    const clients = wsManager.getConnectedClients();

    res.json({
      success: true,
      clients,
      totalClients: clients.length,
      connectedClients: clients.filter((c) => c.connected).length,
    });
  } catch (error) {
    console.error('Error getting clients:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error getting clients',
    });
  }
});

/**
 * GET /api/clients/:clientId
 * Get status of a specific client
 */
router.get('/:clientId', (req, res) => {
  try {
    const { clientId } = req.params;
    const clients = wsManager.getConnectedClients();
    const client = clients.find((c) => c.clientId === clientId);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: `Client ${clientId} not found`,
      });
    }

    return res.json({
      success: true,
      client,
    });
  } catch (error) {
    console.error('Error getting client:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error getting client',
    });
  }
});

module.exports = router;
