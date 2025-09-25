const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mainRouter = require('./routes/index');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

app.use('/uploads/resources', express.static(path.join(__dirname, '../../uploads/resources')));

// Test endpoint to verify static file serving we can remove this later
app.get('/test-uploads', (req, res) => {
  const fs = require('fs');
  const uploadsPath = path.join(__dirname, '../../uploads');
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

// Direct routes for reverse proxy compatibility
app.use('/chat', require('./routes/chat'));

app.get('/', (req, res) => {
  res.send('Training Portal Backend API');
});

module.exports = app; 