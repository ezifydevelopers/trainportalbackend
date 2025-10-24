const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const pathConfig = require('./config/paths');
const mainRouter = require('./routes/index');
const videoStreaming = require('./middlewares/videoStreaming');
const app = express();

// Security and performance middleware - optimized for video streaming
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for video streaming
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  // Disable helmet for video routes to prevent header conflicts
  hsts: false, // Disable HSTS for video streaming
  noSniff: false, // Allow video content type detection
  frameguard: false, // Allow video embedding
  xssFilter: false, // Disable XSS filter for video content
}));

// Compression middleware for all responses
app.use(compression({
  level: 6,
  threshold: 1024, // Only compress files larger than 1KB
  filter: (req, res) => {
    // Don't compress video files
    if (req.path.match(/\.(mp4|webm|ogg|avi|mov)$/i)) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Range']
}));

// Increase body size limits for video uploads
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

// Ensure all upload directories exist
pathConfig.ensureDirectoriesExist();

// Apply video streaming middleware for video files
app.use('/uploads', videoStreaming);

// Serve static files with optimized headers
app.use('/uploads', (req, res, next) => {
  // Set cache headers for static assets
  res.header('Cache-Control', 'public, max-age=31536000, immutable');
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  // Remove security headers that interfere with video streaming
  res.removeHeader('X-Content-Type-Options');
  res.removeHeader('X-Frame-Options');
  res.removeHeader('X-XSS-Protection');
  
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
}, express.static(pathConfig.uploadsRoot, {
  // Enable range requests for video files
  setHeaders: (res, path) => {
    if (path.match(/\.(mp4|webm|ogg|avi|mov)$/i)) {
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Type', 'video/mp4');
      // Remove conflicting headers for video files
      res.removeHeader('X-Content-Type-Options');
      res.removeHeader('X-Frame-Options');
      res.removeHeader('X-XSS-Protection');
    }
  }
}));

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