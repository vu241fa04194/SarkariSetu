import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Protect routes - Verifies JWT bearer token and attaches user object to request
 */
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      if (!token || token === 'undefined' || token === 'null') {
        return res.status(401).json({
          success: false,
          message: 'Not authorized: Token missing or malformed',
        });
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'sarkarisetu_fallback_secret'
      );

      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User belonging to this token no longer exists',
        });
      }

      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Session expired, please log in again',
          isExpired: true,
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Not authorized: Invalid token signature or format',
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: 'Not authorized: No authentication token provided',
    });
  }
};

/**
 * Alias for protect to match Phase 3 naming convention
 */
export const authenticateUser = protect;

/**
 * Restrict access strictly to Administrator users
 */
export const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access forbidden: Administrator privileges required',
    });
  }
};

/**
 * Optional protect - populates req.user if valid token provided, but does not block guests
 */
export const optionalProtect = async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      if (token && token !== 'undefined' && token !== 'null') {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'sarkarisetu_fallback_secret'
        );
        req.user = await User.findById(decoded.id).select('-password');
      }
    } catch {
      // Continue as guest if token is invalid or expired
    }
  }
  next();
};

