import { Context as HonoContext, Next } from 'hono';
import { Context, JWTPayload } from './types';
import { verifyJWT, extractToken } from './jwt-utils';

/**
 * Extended context with JWT payload
 */
export interface AuthContext extends Context {
  jwtPayload?: JWTPayload;
}

/**
 * Validates the Bearer token from the Authorization header
 * Supports both JWT tokens and legacy Bearer tokens
 */
export async function authMiddleware(
  c: HonoContext<{ Bindings: Context['env'] }> & { jwtPayload?: JWTPayload },
  next: Next
): Promise<Response | void> {
  const authHeader = c.req.header('Authorization');

  if (!authHeader) {
    return c.text('Missing authorization header', 401);
  }

  const token = extractToken(authHeader);
  if (!token) {
    return c.text('Invalid authorization header format', 401);
  }

  // Try JWT authentication first
  if (c.env.JWT_SECRET) {
    try {
      const payload = verifyJWT(token, c.env.JWT_SECRET);
      // Store the JWT payload in the context for use in routes
      c.jwtPayload = payload;
      await next();
      return;
    } catch (error) {
      // If JWT fails, try legacy authentication if available
      if (!c.env.BEARER_TOKEN) {
        return c.text('Invalid or expired token', 401);
      }
    }
  }

  // Fall back to legacy Bearer token authentication
  if (c.env.BEARER_TOKEN) {
    if (token !== c.env.BEARER_TOKEN) {
      return c.text('Invalid bearer token', 401);
    }
    await next();
    return;
  }

  return c.text('Authentication not configured', 500);
}

/**
 * Validates filename to prevent path traversal and other security issues
 */
export function validateFilename(filename: string): boolean {
  // Check length
  if (filename.length === 0 || filename.length > 255) {
    return false;
  }

  // Check for path traversal attempts
  if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
    return false;
  }

  // Don't allow hidden files
  if (filename.startsWith('.')) {
    return false;
  }

  // Only allow alphanumeric, dash, underscore, and dot
  const validFilenameRegex = /^[a-zA-Z0-9\-_.]+$/;
  if (!validFilenameRegex.test(filename)) {
    return false;
  }

  return true;
}
