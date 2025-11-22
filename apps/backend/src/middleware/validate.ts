/**
 * Validation Middleware
 *
 * Validates request body, params, and query using Zod schemas.
 * Returns 400 with structured error on validation failure.
 */

import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from '../utils/errors';
import { createLogger } from '../utils/logger';

const logger = createLogger('Validation');

export interface ValidationSchemas {
  body?: z.ZodSchema;
  params?: z.ZodSchema;
  query?: z.ZodSchema;
}

declare global {
  namespace Express {
    interface Request {
      validated?: {
        body?: unknown;
        params?: unknown;
        query?: unknown;
      };
    }
  }
}

/**
 * Validation Middleware Factory
 * Creates middleware that validates request data with Zod schemas.
 *
 * @param schemas - Object containing optional body, params, and query schemas
 * @returns Express middleware function
 *
 * @example
 * ```ts
 * const validateCreate = validate({
 *   body: z.object({
 *     name: z.string().min(1),
 *     email: z.string().email(),
 *   }),
 * });
 *
 * router.post('/users', validateCreate, createUser);
 * ```
 */
export function validate(schemas: ValidationSchemas) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated: {
        body?: unknown;
        params?: unknown;
        query?: unknown;
      } = {};

      // Validate body
      if (schemas.body) {
        validated.body = schemas.body.parse(req.body);
      }

      // Validate params
      if (schemas.params) {
        validated.params = schemas.params.parse(req.params);
      }

      // Validate query
      if (schemas.query) {
        validated.query = schemas.query.parse(req.query);
      }

      // Attach validated data to request
      req.validated = validated;

      // Replace original data with validated data
      if (validated.body !== undefined) {
        req.body = validated.body;
      }
      if (validated.params !== undefined) {
        req.params = validated.params as Record<string, string>;
      }
      if (validated.query !== undefined) {
        // Query params need to be compatible with Express.ParsedQs
        const query = validated.query as Record<string, unknown>;
        req.query = query as typeof req.query;
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const requestId = req.requestId;
        const validationErrors = error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        logger.warn('Validation failed', {
          path: req.path,
          method: req.method,
          errors: validationErrors,
          requestId,
        });

        const validationError = new ValidationError('Validation failed', {
          errors: validationErrors,
          requestId,
        });

        return next(validationError);
      }

      // Re-throw non-Zod errors
      next(error);
    }
  };
}
