const multer = require('multer');
const pathConfig = require('../config/paths');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = pathConfig.videosPath;
    // Ensure directory exists
    pathConfig.ensureDirectoriesExist();
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + require('path').extname(file.originalname));
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