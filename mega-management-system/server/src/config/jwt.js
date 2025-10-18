const jwt = require('jsonwebtoken');

/**
 * Generate JWT token for user
 * @param {Object} payload - User data to encode in token
 * @returns {String} JWT token
 */
const generateToken = (payload) => {
  const secret = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here';
  const expiresIn = process.env.JWT_EXPIRE || '7d';

  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Verify JWT token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here';

  try {
    return jwt.verify(token, secret);
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    throw error;
  }
};

/**
 * Extract token from Authorization header
 * @param {String} authHeader - Authorization header value
 * @returns {String|null} JWT token or null
 */
const extractToken = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.substring(7); // Remove 'Bearer ' prefix
};

module.exports = {
  generateToken,
  verifyToken,
  extractToken
};
