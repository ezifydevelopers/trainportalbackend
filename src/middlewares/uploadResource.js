const multer = require('multer');
const pathConfig = require('../config/paths');

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = pathConfig.resourcesPath;
    console.log('📁 Upload destination path:', uploadPath);
    // Ensure directory exists
    pathConfig.ensureDirectoriesExist();
    console.log('📁 Directory exists:', pathConfig.fileExists('resource', 'test'));
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = require('path').extname(file.originalname);
    const filename = file.fieldname + '-' + uniqueSuffix + ext;
    console.log('📤 Generated filename:', filename);
    cb(null, filename);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Allowed MIME types
  const allowedMimeTypes = [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/avi',
    'video/mov',
    'video/quicktime',
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/m4a',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
    'application/x-zip-compressed'
  ];

  // Check MIME type
  const isAllowed = allowedMimeTypes.includes(file.mimetype);
  if (isAllowed) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Middleware with error handling
const uploadWithErrorHandling = (req, res, next) => {
  console.log('📤 Upload middleware called');
  upload.single('resourceFile')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.log('❌ Multer error:', err.message);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 100MB.'
        });
      }
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`
      });
    } else if (err) {
      console.log('❌ Upload error:', err.message);
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    console.log('✅ Upload middleware successful, file:', req.file ? req.file.filename : 'no file');
    next();
  });
};

module.exports = {
  upload,
  uploadWithErrorHandling
};
