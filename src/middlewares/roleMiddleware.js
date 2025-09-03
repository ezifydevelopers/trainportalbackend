module.exports = function (roles) {
  return (req, res, next) => {
    if (!req.user || (Array.isArray(roles) ? !roles.includes(req.user.role) : req.user.role !== roles)) {
      return res.status(403).json({ message: 'Forbidden: insufficient role' });
    }
    next();
  };
}; 