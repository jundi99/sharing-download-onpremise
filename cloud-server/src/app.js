const express = require('express');
const cors = require('cors');
const fileDownloadRoutes = require('./routes/fileDownload');
const clientStatusRoutes = require('./routes/clientStatus');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/download', fileDownloadRoutes);
app.use('/api/clients', clientStatusRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

module.exports = app;
