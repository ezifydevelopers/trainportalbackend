const multer = require('multer');
const pathConfig = require('../config/paths');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    pathConfig.ensureDirectoriesExist();
    cb(null, pathConfig.logosPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + require('path').extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload; 