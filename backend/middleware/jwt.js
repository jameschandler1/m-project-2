/**
 * JWT Authentication Middleware
 * 
 * Verifies JWT tokens from Authorization header or cookie
 * Sets req.userId if token is valid
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET;

if (!JWT_SECRET) {
  console.error('ERROR: JWT_SECRET or SESSION_SECRET environment variable is required');
  process.exit(1);
}

function authenticateToken(req, res, next) {
  // Try to get token from Authorization header first
  let token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN

  // If not in header, try to get from cookie
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }

    req.userId = decoded.userId;
    next();
  });
}

function generateToken(userId) {
  return jwt.sign(
    { userId },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

module.exports = { authenticateToken, generateToken };
