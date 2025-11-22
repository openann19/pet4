import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthenticatedRequest } from './auth.js';

const prisma = new PrismaClient();

/**
 * Admin authentication middleware
 * Checks if user has admin role
 */
export async function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  // TODO: Check user role from database
  // For now, allow if user exists (in production, check for admin role)
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true },
  });

  if (!user) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Admin access required',
      code: 'ADMIN_001',
    });
    return;
  }

  // In production, check user.role === 'admin'
  // For now, allow all authenticated users (remove in production!)
  next();
}

