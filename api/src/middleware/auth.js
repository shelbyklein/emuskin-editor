// JWT authentication middleware
const jwt = require('jsonwebtoken');

// Decode JWT token to extract payload
function decodeJWT(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7).replace(/"/g, '');
    
    // Decode and validate JWT (from WordPress Simple JWT Login)
    const payload = decodeJWT(token);
    
    if (!payload) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    // Extract user information
    req.user = {
      id: payload.id || payload.sub || '1',
      email: payload.email,
      username: payload.username || payload.email.split('@')[0]
    };
    
    console.log('Authenticated user:', req.user.email);
    next();
    
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

module.exports = { authenticate };