import jwt from 'jsonwebtoken';
import { JWTPayload } from './types';

/**
 * Create a JWT token for API authentication
 */
export function createJWT(
  githubToken: string,
  gistId: string | undefined,
  secret: string,
  expiresIn: string = '24h'
): string {
  const payload: JWTPayload = {
    githubToken,
    gistId,
    iat: Math.floor(Date.now() / 1000)
  };

  return jwt.sign(payload, secret, { expiresIn });
}

/**
 * Verify and decode a JWT token
 */
export function verifyJWT(token: string, secret: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, secret) as JWTPayload;
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Extract token from Authorization header
 * Supports both "Bearer token" and "Bearer apiToken:jwtToken" formats
 */
export function extractToken(authHeader: string | null): string | null {
  if (!authHeader) return null;

  const match = authHeader.match(/^Bearer\s+(.+)$/);
  if (!match) return null;

  const token = match[1];
  
  // Check if it's in the format "apiToken:jwtToken"
  const parts = token.split(':');
  if (parts.length === 2) {
    return parts[1]; // Return the JWT part
  }
  
  return token;
}
