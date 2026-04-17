const jwt = require('jsonwebtoken');
const User = require('../models/User');

const adminAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here');
    req.userId = decoded.userId;
    req.user = decoded;

    // Verify user role
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = adminAuthMiddleware;
