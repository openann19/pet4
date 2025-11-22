/**
 * Express Request Type Extensions
 *
 * Extends Express Request type with user information from JWT authentication.
 */

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: {
        id: string;
        email: string;
        name?: string;
      };
    }
  }
}

export {};
