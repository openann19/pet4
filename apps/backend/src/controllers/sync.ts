import { Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/error-handler.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();

// Validation schema
const syncActionsSchema = z.object({
  actions: z.array(z.object({
    type: z.string(),
    resource: z.string(),
    resourceId: z.string(),
    action: z.string(),
    data: z.record(z.unknown()).optional(),
    timestamp: z.string().datetime(),
  })),
});

/**
 * GET /sync/queue
 * Get sync queue for offline actions
 */
export const getSyncQueue = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  // In production, this would fetch from a sync queue table
  // For now, return empty queue
  res.json({
    data: {
      queue: [],
      count: 0,
    },
  });
});

/**
 * GET /sync/last-sync-time
 * Get last sync timestamp
 */
export const getLastSyncTime = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  // Get last activity timestamp from user
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: {
      updatedAt: true,
    },
  });

  res.json({
    data: {
      lastSyncTime: user?.updatedAt.toISOString() || new Date().toISOString(),
    },
  });
});

/**
 * POST /sync/actions
 * Submit sync actions from offline queue
 */
export const syncActions = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const body = syncActionsSchema.parse(req.body);

  // Process each action
  const results = await Promise.allSettled(
    body.actions.map(async (action) => {
      // In production, process each action based on type
      // For now, just acknowledge
      return {
        type: action.type,
        resource: action.resource,
        resourceId: action.resourceId,
        success: true,
      };
    }),
  );

  const successful = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  res.json({
    data: {
      processed: body.actions.length,
      successful,
      failed,
      results: results.map((r) =>
        r.status === 'fulfilled' ? r.value : { success: false, error: 'Failed to process' },
      ),
    },
  });
});


