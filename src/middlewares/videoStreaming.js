const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

/**
 * Video streaming middleware with range request support
 * Enables proper video streaming for large files
 */
const videoStreaming = (req, res, next) => {
  // Only handle video files
  if (!req.path.match(/\.(mp4|webm|ogg|avi|mov)$/i)) {
    return next();
  }

  console.log('Video streaming middleware - path:', req.path);
  
  // Remove /uploads/ prefix from path to get the actual filename
  const filename = req.path.replace('/uploads/', '');
  const filePath = path.join(process.cwd(), 'uploads', filename);
  
  console.log('Looking for video file at:', filePath);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.log('Video file not found:', filePath);
    return res.status(404).json({ error: 'Video file not found' });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  // Set CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');

  if (range) {
    // Parse range header
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': mime.lookup(filePath) || 'video/mp4',
      'Cache-Control': 'public, max-age=31536000, immutable',
    };
    
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    // No range request - serve entire file
    const head = {
      'Content-Length': fileSize,
      'Content-Type': mime.lookup(filePath) || 'video/mp4',
      'Cache-Control': 'public, max-age=31536000, immutable',
    };
    
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
};

module.exports = videoStreaming;
