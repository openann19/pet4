/**
 * Authentication Middleware
 *
 * Validates user authentication and extracts user information from request.
 * Supports development mode (x-user-id header) and production mode (JWT Bearer tokens).
 * In production, replace validateJWTToken with a proper JWT library (e.g., jsonwebtoken).
 */

import type { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../utils/errors';
import { createLogger } from '../utils/logger';

const logger = createLogger('AuthMiddleware');

interface JWTPayload {
  userId: string;
  email?: string;
  exp?: number;
  iat?: number;
}

/**
 * Validate JWT token and extract payload
 * In production, use a proper JWT library (e.g., jsonwebtoken) with secret verification
 */
function validateJWTToken(token: string): JWTPayload | null {
  try {
    // Development: simple token format "user:{userId}"
    if (token.startsWith('user:')) {
      const userId = token.substring(5);
      if (userId.length > 0) {
        return {
          userId,
          email: `${userId}@example.com`,
        };
      }
    }

    // Production: implement proper JWT validation
    // Example with jsonwebtoken:
    // import jwt from 'jsonwebtoken';
    // const secret = process.env.JWT_SECRET;
    // if (!secret) throw new Error('JWT_SECRET not configured');
    // const decoded = jwt.verify(token, secret) as JWTPayload;
    // return decoded;

    return null;
  } catch {
    return null;
  }
}

/**
 * Authentication middleware
 * Requires valid authentication via x-user-id header (dev) or Bearer token (prod)
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    const userId = req.headers['x-user-id'] as string | undefined;
    const authHeader = req.headers.authorization;

    if (!userId && !authHeader) {
      throw new UnauthorizedError('Authentication required');
    }

    // Development mode: use x-user-id header
    if (userId && process.env.NODE_ENV !== 'production') {
      req.userId = userId;
      req.user = {
        id: userId,
        email: `${userId}@example.com`,
      };
      next();
      return;
    }

    // Production mode: validate JWT token
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = validateJWTToken(token);

      if (payload !== null) {
        req.userId = payload.userId;
        req.user = {
          id: payload.userId,
          email: payload.email ?? `${payload.userId}@example.com`,
        };
        next();
        return;
      }
    }

    throw new UnauthorizedError('Invalid authentication token');
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Authentication failed', err, {
      path: req.path,
      method: req.method,
    });
    next(error);
  }
}

/**
 * Optional authentication middleware
 * Allows requests with or without authentication
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    const userId = req.headers['x-user-id'] as string | undefined;
    const authHeader = req.headers.authorization;

    if (userId) {
      req.userId = userId;
      req.user = {
        id: userId,
        email: `${userId}@example.com`,
      };
    } else if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      if (token.startsWith('user:')) {
        const extractedUserId = token.substring(5);
        req.userId = extractedUserId;
        req.user = {
          id: extractedUserId,
          email: `${extractedUserId}@example.com`,
        };
      }
    }

    next();
  } catch (error) {
    // Log error but continue without authentication (optional auth)
    const err = error instanceof Error ? error : new Error(String(error));
    logger.debug('Optional auth error (continuing)', err, {
      path: req.path,
      method: req.method,
    });
    next();
  }
}
