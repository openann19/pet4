/**
 * JWT Authentication Middleware
 *
 * Validates JWT tokens from Authorization header and extracts user information.
 * Uses jsonwebtoken library for token verification.
 */

import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../utils/errors';
import { createLogger } from '../utils/logger';

const logger = createLogger('JWTAuth');

export interface JWTPayload {
  userId: string;
  email: string;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

export interface JWTConfig {
  secret: string;
  algorithms?: jwt.Algorithm[];
  issuer?: string;
  audience?: string;
}

/**
 * Get JWT secret from environment or throw error
 */
function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      'JWT_SECRET environment variable is required. Set it in your .env file.'
    );
  }
  return secret;
}

/**
 * Get JWT configuration from environment
 */
function getJWTConfig(): JWTConfig {
  return {
    secret: getJWTSecret(),
    algorithms: ['HS256'],
    issuer: process.env.JWT_ISSUER,
    audience: process.env.JWT_AUDIENCE,
  };
}

/**
 * Validate JWT token and extract payload
 */
function validateJWTToken(token: string, config: JWTConfig): JWTPayload {
  try {
    const payload = jwt.verify(token, config.secret, {
      algorithms: config.algorithms,
      issuer: config.issuer,
      audience: config.audience,
    }) as JWTPayload;

    if (!payload.userId) {
      throw new UnauthorizedError('Invalid token: missing userId');
    }

    if (!payload.email) {
      throw new UnauthorizedError('Invalid token: missing email');
    }

    return payload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Invalid token');
    }
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('JWT validation failed', err);
    throw new UnauthorizedError('Token validation failed');
  }
}

/**
 * JWT Authentication Middleware
 * Requires valid JWT Bearer token in Authorization header
 */
export function authenticateJWT(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication required: Bearer token missing');
    }

    const token = authHeader.substring(7);
    if (!token || token.length === 0) {
      throw new UnauthorizedError('Authentication required: token is empty');
    }

    const config = getJWTConfig();
    const payload = validateJWTToken(token, config);

    // Attach user information to request
    req.userId = payload.userId;
    req.user = {
      id: payload.userId,
      email: payload.email,
    };

    next();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('JWT authentication failed', err, {
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
    next(error);
  }
}

/**
 * Optional JWT Authentication Middleware
 * Allows requests with or without authentication
 */
export function optionalJWT(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      if (token && token.length > 0) {
        const config = getJWTConfig();
        const payload = validateJWTToken(token, config);

        req.userId = payload.userId;
        req.user = {
          id: payload.userId,
          email: payload.email,
        };
      }
    }

    next();
  } catch (error) {
    // Log error but continue without authentication (optional auth)
    const err = error instanceof Error ? error : new Error(String(error));
    logger.debug('Optional JWT auth error (continuing)', err, {
      path: req.path,
      method: req.method,
    });
    next();
  }
}

/**
 * Generate JWT token (utility function for login endpoints)
 */
export function generateToken(payload: { userId: string; email: string }): string {
  const config = getJWTConfig();
  const expiresInEnv = process.env.JWT_EXPIRES_IN ?? '7d';

  // Convert string duration to seconds (number) for jwt library
  let expiresIn: number = 7 * 24 * 60 * 60; // Default to 7 days in seconds

  if (typeof expiresInEnv === 'string') {
    // Parse duration strings like '7d', '2h', '30m', '60s'
    const match = expiresInEnv.match(/^(\d+)([smhd])$/);
    if (match) {
      const value = Number.parseInt(match[1] ?? '0', 10);
      const unit = match[2];
      switch (unit) {
        case 's':
          expiresIn = value;
          break;
        case 'm':
          expiresIn = value * 60;
          break;
        case 'h':
          expiresIn = value * 60 * 60;
          break;
        case 'd':
          expiresIn = value * 60 * 60 * 24;
          break;
        default:
          expiresIn = 7 * 24 * 60 * 60; // Default to 7 days in seconds
      }
    } else {
      // If it's a plain number string, parse it
      const num = Number.parseInt(expiresInEnv, 10);
      if (!Number.isNaN(num)) {
        expiresIn = num;
      }
      // Otherwise use default
    }
  }

  const options: jwt.SignOptions = {
    algorithm: 'HS256',
    expiresIn,
  };

  if (config.issuer) {
    options.issuer = config.issuer;
  }

  if (config.audience) {
    options.audience = config.audience;
  }

  return jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
    },
    config.secret,
    options
  );
}
