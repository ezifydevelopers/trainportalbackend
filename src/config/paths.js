const path = require('path');
const fs = require('fs');

/**
 * Centralized path configuration for the entire application
 * This eliminates path inconsistencies and makes the codebase more maintainable
 */

// Get the project root directory - go up from trainportalbackend/src/config to project root
// From: E:\Ezify\trainingportal\trainportalbackend\src\config\paths.js
// To:   E:\Ezify\trainingportal\
const PROJECT_ROOT = path.resolve(__dirname, '../../../');

// Since the backend runs from trainportalbackend directory, go up one level to project root
const ALTERNATIVE_ROOT = path.resolve(process.cwd(), '..');

// Verify the uploads directory exists
const uploadsPath = path.join(ALTERNATIVE_ROOT, 'uploads');
if (fs.existsSync(uploadsPath)) {
  console.log('✅ Uploads directory found:', uploadsPath);
} else {
  console.log('❌ Uploads directory NOT found:', uploadsPath);
}

// Environment-based configuration
const config = {
  development: {
    uploadsRoot: path.join(ALTERNATIVE_ROOT, 'uploads'),
    resourcesPath: path.join(ALTERNATIVE_ROOT, 'uploads', 'resources'),
    videosPath: path.join(ALTERNATIVE_ROOT, 'uploads'), // Videos go directly in uploads
    certificatesPath: path.join(ALTERNATIVE_ROOT, 'uploads', 'certificates'),
    logosPath: path.join(ALTERNATIVE_ROOT, 'uploads'), // Logos go directly in uploads
    staticUrl: '/uploads'
  },
  production: {
    uploadsRoot: '/home/dev/apps/uploads',
    resourcesPath: '/home/dev/apps/uploads/resources',
    videosPath: '/home/dev/apps/uploads', // Videos go directly in uploads
    certificatesPath: '/home/dev/apps/uploads/certificates',
    logosPath: '/home/dev/apps/uploads', // Logos go directly in uploads
    staticUrl: '/uploads'
  }
};

// Get current environment
const environment = process.env.NODE_ENV || 'development';
const currentConfig = config[environment];

/**
 * Ensure all upload directories exist
 */
function ensureDirectoriesExist() {
  const directories = [
    currentConfig.uploadsRoot,
    currentConfig.resourcesPath,
    currentConfig.videosPath,
    currentConfig.certificatesPath,
    currentConfig.logosPath
  ];

  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });
}

/**
 * Get the full file path for a given file type and filename
 */
function getFilePath(fileType, filename) {
  const typeMap = {
    'resource': currentConfig.resourcesPath,
    'video': currentConfig.videosPath,
    'certificate': currentConfig.certificatesPath,
    'logo': currentConfig.logosPath
  };

  const basePath = typeMap[fileType];
  if (!basePath) {
    throw new Error(`Unknown file type: ${fileType}`);
  }

  return path.join(basePath, filename);
}

/**
 * Get the URL path for a given file type and filename
 */
function getFileUrl(fileType, filename) {
  if (fileType === 'logo' || fileType === 'video') {
    return `${currentConfig.staticUrl}/${filename}`;
  }
  return `${currentConfig.staticUrl}/${fileType}s/${filename}`;
}

/**
 * Get the URL path for a given file type and filename (for database storage)
 * This ensures we don't double-add the /uploads/ prefix
 */
function getFileUrlForStorage(fileType, filename) {
  if (fileType === 'logo') {
    return `${currentConfig.staticUrl}/${filename}`;
  }
  return `${currentConfig.staticUrl}/${fileType}s/${filename}`;
}

/**
 * Get the static serving path for a given file type
 */
function getStaticPath(fileType) {
  const typeMap = {
    'resource': currentConfig.resourcesPath,
    'video': currentConfig.videosPath,
    'certificate': currentConfig.certificatesPath,
    'logo': currentConfig.logosPath
  };

  return typeMap[fileType] || currentConfig.uploadsRoot;
}

/**
 * Validate that a file exists
 */
function fileExists(fileType, filename) {
  const filePath = getFilePath(fileType, filename);
  return fs.existsSync(filePath);
}

/**
 * Delete a file safely
 */
function deleteFile(fileType, filename) {
  const filePath = getFilePath(fileType, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
}

// Initialize directories on module load
ensureDirectoriesExist();

module.exports = {
  // Paths
  uploadsRoot: currentConfig.uploadsRoot,
  resourcesPath: currentConfig.resourcesPath,
  videosPath: currentConfig.videosPath,
  certificatesPath: currentConfig.certificatesPath,
  logosPath: currentConfig.logosPath,
  staticUrl: currentConfig.staticUrl,
  
  // Utility functions
  getFilePath,
  getFileUrl,
  getStaticPath,
  fileExists,
  deleteFile,
  ensureDirectoriesExist,
  
  // Environment info
  environment,
  isProduction: environment === 'production',
  isDevelopment: environment === 'development'
};
