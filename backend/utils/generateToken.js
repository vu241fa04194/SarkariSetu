import jwt from 'jsonwebtoken';

/**
 * Generate a signed JSON Web Token
 * @param {string} id - User ID
 */
export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'sarkarisetu_fallback_secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || process.env.JWT_EXPIRE || '7d',
  });
};

export default generateToken;
