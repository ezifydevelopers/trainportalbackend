const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const mainRouter = require('./routes/index');
const app = express();

dotenv.config();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Test endpoint to verify static file serving
app.get('/test-uploads', (req, res) => {
  const fs = require('fs');
  const uploadsPath = path.join(__dirname, '../uploads');
  try {
    const files = fs.readdirSync(uploadsPath);
    res.json({ 
      message: 'Uploads directory accessible',
      files: files.filter(file => file.endsWith('.mp4')).slice(0, 5) // Show first 5 video files
    });
  } catch (error) {
    res.status(500).json({ error: 'Cannot access uploads directory', details: error.message });
  }
});

app.use('/api', mainRouter);

app.get('/', (req, res) => {
  res.send('Training Portal Backend API');
});

module.exports = app; 