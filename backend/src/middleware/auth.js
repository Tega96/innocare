// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user information to request object
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied. No token provided.' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const result = await query(
      'SELECT id, email, phone, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Invalid token. User not found.' 
      });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ 
        error: 'Account is disabled. Please contact support.' 
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired.' });
    }
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * Role-based authorization middleware
 * Checks if user has required role
 */
const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Access denied. Insufficient permissions.' 
      });
    }

    next();
  };
};

/**
 * Optional: Check if user is accessing their own data or is admin
 */
const authorizeOwnData = (getUserIdFromParams) => {
  return async (req, res, next) => {
    try {
      const targetUserId = getUserIdFromParams(req);
      
      // Admin can access any data
      if (req.user.role === 'admin') {
        return next();
      }
      
      // Users can only access their own data
      if (req.user.id !== targetUserId) {
        return res.status(403).json({ 
          error: 'Access denied. You can only access your own data.' 
        });
      }
      
      next();
    } catch (error) {
      console.error('Authorization error:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  };
};

module.exports = {
  authenticateToken,
  authorizeRole,
  authorizeOwnData,
};