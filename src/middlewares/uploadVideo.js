const multer = require('multer');
const path = require('path');

// Environment-based upload path
const getUploadPath = () => {
  if (process.env.NODE_ENV === 'production') {
    return '/home/dev/uploads/';
  } else {
    // Local development - relative to project root
    return path.join(__dirname, '../../../uploads/');
  }
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, getUploadPath());
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only video files are allowed!'), false);
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload; 