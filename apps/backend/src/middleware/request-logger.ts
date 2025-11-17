import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

/**
 * Request logging middleware
 * Logs all incoming requests with method, path, status, and response time
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  // Log request
  if (process.env.NODE_ENV === 'development') {
    logger.debug(`${req.method} ${req.path}`);
  }

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const message = `${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`;
    
    if (res.statusCode >= 400) {
      logger.error(message);
    } else {
      logger.info(message);
    }
  });

  next();
}

