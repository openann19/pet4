/**
 * Request ID Middleware
 *
 * Generates or forwards x-request-id header for request correlation in logs.
 */

import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

/**
 * Request ID Middleware
 * Generates a UUID for each request if x-request-id header is not present.
 * Attaches requestId to req.requestId for use in logs and error responses.
 */
export function requestIdMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const existingRequestId = req.headers['x-request-id'];
  req.requestId = typeof existingRequestId === 'string' ? existingRequestId : randomUUID();
  next();
}
