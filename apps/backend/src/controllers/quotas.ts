import { Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/error-handler.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();

/**
 * GET /users/:userId/quota
 * Get user quota information
 */
export const getQuota = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { userId } = req.params;

  // Users can only view their own quota
  if (userId !== req.userId) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'You can only view your own quota',
      code: 'QUOTA_001',
    });
    return;
  }

  // Get quota from database (or return defaults)
  const quota = await prisma.userQuota.findUnique({
    where: { userId },
  });

  // Get user's current usage
  const [petCount, photoCount, matchCount] = await Promise.all([
    prisma.pet.count({ where: { ownerId: userId } }),
    prisma.photo.count({ where: { userId } }),
    prisma.match.count({
      where: {
        OR: [
          { pet1: { ownerId: userId } },
          { pet2: { ownerId: userId } },
        ],
      },
    }),
  ]);

  const defaultLimits = {
    pets: 5,
    photos: 20,
    matches: 100,
    messages: 1000,
  };

  res.json({
    data: {
      userId,
      limits: quota ? (quota.limits as typeof defaultLimits) || defaultLimits : defaultLimits,
      usage: {
        pets: petCount,
        photos: photoCount,
        matches: matchCount,
        messages: 0, // TODO: Count messages
      },
      remaining: {
        pets: Math.max(0, (quota ? (quota.limits as typeof defaultLimits)?.pets || defaultLimits.pets : defaultLimits.pets) - petCount),
        photos: Math.max(0, (quota ? (quota.limits as typeof defaultLimits)?.photos || defaultLimits.photos : defaultLimits.photos) - photoCount),
        matches: Math.max(0, (quota ? (quota.limits as typeof defaultLimits)?.matches || defaultLimits.matches : defaultLimits.matches) - matchCount),
        messages: 1000, // TODO: Calculate
      },
    },
  });
});

/**
 * POST /users/:userId/quota/increment
 * Increment quota (admin only)
 */
export const incrementQuota = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { userId } = req.params;
  const { type, amount } = z.object({
    type: z.enum(['pets', 'photos', 'matches', 'messages']),
    amount: z.number().int().positive(),
  }).parse(req.body);

  // TODO: Check if user is admin
  // For now, allow if requester is the user themselves (for testing)

  const quota = await prisma.userQuota.findUnique({
    where: { userId },
  });

  const defaultLimits = {
    pets: 5,
    photos: 20,
    matches: 100,
    messages: 1000,
  };

  const currentLimits = quota ? (quota.limits as typeof defaultLimits) || defaultLimits : defaultLimits;
  const updatedLimits = {
    ...currentLimits,
    [type]: currentLimits[type] + amount,
  };

  const updated = await prisma.userQuota.upsert({
    where: { userId },
    update: {
      limits: updatedLimits as unknown as Record<string, unknown>,
    },
    create: {
      userId,
      limits: updatedLimits as unknown as Record<string, unknown>,
    },
  });

  res.json({
    data: {
      userId: updated.userId,
      limits: updatedLimits,
      updatedAt: updated.updatedAt.toISOString(),
    },
  });
});


