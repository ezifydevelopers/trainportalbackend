const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const pathConfig = require('./config/paths');
const mainRouter = require('./routes/index');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure all upload directories exist
pathConfig.ensureDirectoriesExist();

// Serve static files with CORS headers
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  // Set proper content type for images (logos)
  if (req.path.endsWith('.png')) {
    res.type('image/png');
  } else if (req.path.endsWith('.jpg') || req.path.endsWith('.jpeg')) {
    res.type('image/jpeg');
  } else if (req.path.endsWith('.gif')) {
    res.type('image/gif');
  } else if (req.path.endsWith('.webp')) {
    res.type('image/webp');
  }
  
  next();
}, express.static(pathConfig.uploadsRoot));

// Serve resources
app.use('/uploads/resources', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  next();
}, express.static(pathConfig.resourcesPath));

// Videos are served from the main uploads directory (no separate route needed)

// Serve certificates
app.use('/uploads/certificates', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  next();
}, express.static(pathConfig.certificatesPath));

// Logos are served from the main uploads directory (no separate route needed)

// Test endpoint to verify static file serving
app.get('/test-uploads', (req, res) => {
  const fs = require('fs');
  try {
    const files = fs.readdirSync(pathConfig.uploadsRoot);
    res.json({ 
      message: 'Uploads directory accessible',
      path: pathConfig.uploadsRoot,
      files: files.slice(0, 10)
    });
  } catch (error) {
    res.status(500).json({ error: 'Cannot access uploads directory', details: error.message });
  }
});

// Test endpoint to verify resources directory
app.get('/test-resources', (req, res) => {
  const fs = require('fs');
  try {
    const files = fs.readdirSync(pathConfig.resourcesPath);
    res.json({ 
      message: 'Resources directory accessible',
      path: pathConfig.resourcesPath,
      files: files.slice(0, 10)
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Cannot access resources directory',
      path: pathConfig.resourcesPath,
      message: error.message 
    });
  }
});

app.use('/api', mainRouter);

// Direct routes for reverse proxy compatibility
app.use('/chat', require('./routes/chat'));

app.get('/', (req, res) => {
  res.send('Training Portal Backend API');
});

module.exports = app; 