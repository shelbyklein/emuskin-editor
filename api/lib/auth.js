// JWT authentication for API routes
import jwt from 'jsonwebtoken';

export function authenticateRequest(req) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No valid authorization header');
  }

  const token = authHeader.replace('Bearer ', '');
  
  try {
    // Decode JWT (we trust WordPress-issued JWTs)
    const decoded = jwt.decode(token);
    
    if (!decoded || !decoded.email) {
      throw new Error('Invalid token');
    }
    
    // Check if token is expired
    if (decoded.exp) {
      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp < now) {
        throw new Error('Token expired');
      }
    }
    
    return {
      email: decoded.email,
      id: decoded.id || decoded.email
    };
  } catch (error) {
    throw new Error('Invalid token');
  }
}