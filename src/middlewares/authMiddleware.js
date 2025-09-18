const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient');

module.exports = async function (req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  // Add debugging for chat routes
  if (req.path.includes('/chat/')) {
    console.log('=== AUTH MIDDLEWARE DEBUG ===');
    console.log('Request path:', req.path);
    console.log('Auth header:', authHeader);
    console.log('Token:', token ? 'Present' : 'Missing');
  }
  
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Attach user info to request
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return res.status(401).json({ message: 'Invalid token user' });
    req.user = { id: user.id, role: user.role, companyId: user.companyId };
    
    // Add debugging for chat routes
    if (req.path.includes('/chat/')) {
      console.log('User authenticated:', { id: user.id, role: user.role, companyId: user.companyId });
    }
    
    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    return res.status(401).json({ message: 'Invalid token' });
  }
}; 