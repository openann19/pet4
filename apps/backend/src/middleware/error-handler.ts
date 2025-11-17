/**
 * Error Handler Middleware
 *
 * Centralized error handling for Express routes.
 */

import type { Request, Response, NextFunction } from 'express';
import { APIError } from '../utils/errors';
import { createLogger } from '../utils/logger';

const logger = createLogger('ErrorHandler');

export function errorHandler(
  err: Error | APIError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.requestId;

  if (err instanceof APIError) {
    logger.error('API Error', err, {
      path: req.path,
      method: req.method,
      statusCode: err.statusCode,
      code: err.code,
      context: err.context,
      requestId,
    });

    res.status(err.statusCode).json({
      error: {
        message: err.message,
        code: err.code,
        ...(err.context && { context: err.context }),
        ...(requestId && { requestId }),
      },
    });
    return;
  }

  logger.error('Unhandled Error', err, {
    path: req.path,
    method: req.method,
    requestId,
  });

  res.status(500).json({
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      ...(requestId && { requestId }),
    },
  });
}
