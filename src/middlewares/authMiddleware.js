const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient');

module.exports = async function (req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  // Add debugging for chat routes
  if (req.path.includes('/chat/')) {
    console.log('🔍 Chat route authentication:', {
      path: req.path,
      hasToken: !!token,
      authHeader: authHeader ? 'Present' : 'Missing'
    });
  }
  
  if (!token) {
    console.log('❌ No token provided for:', req.path);
    return res.status(401).json({ message: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token decoded successfully for user:', decoded.id);
    
    // Attach user info to request
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      console.log('❌ User not found in database:', decoded.id);
      return res.status(401).json({ message: 'Invalid token user' });
    }
    
    req.user = { id: user.id, role: user.role, companyId: user.companyId };
    console.log('✅ User authenticated:', { id: user.id, role: user.role, companyId: user.companyId });
    
    next();
  } catch (err) {
    console.log('❌ Token verification failed:', err.message);
    return res.status(401).json({ message: 'Invalid token' });
  }
}; 