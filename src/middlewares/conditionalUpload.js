const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = 'uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Sanitize filename to prevent directory traversal and special characters
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, uniqueSuffix + '-' + sanitizedName);
  }
});

// File filter for videos - only allow web-compatible formats
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['video/mp4', 'video/webm'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only MP4 and WebM video files are allowed for web compatibility!'), false);
  }
};

// Create multer instance
const upload = multer({ 
  storage, 
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit for videos
  }
});

// Custom middleware that handles both FormData and JSON
const conditionalUpload = (req, res, next) => {
  // Check if request has a file
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    // Use multer for FormData requests
    return upload.single('videoFile')(req, res, next);
  } else {
    // Skip multer for JSON requests
    return next();
  }
};

module.exports = conditionalUpload;
