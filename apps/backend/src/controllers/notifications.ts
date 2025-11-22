import { Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/error-handler.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();

/**
 * GET /notifications
 * Get user notifications
 */
export const getNotifications = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { read, limit = '50', offset = '0' } = req.query;

  const where: { userId: string; read?: boolean } = {
    userId: req.userId,
  };

  if (read !== undefined) {
    where.read = read === 'true';
  }

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string, 10),
      skip: parseInt(offset as string, 10),
    }),
    prisma.notification.count({ where }),
  ]);

  res.json({
    data: notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      data: n.data || {},
      read: n.read,
      readAt: n.readAt?.toISOString() || null,
      createdAt: n.createdAt.toISOString(),
    })),
    pagination: {
      total,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    },
  });
});

/**
 * PUT /notifications/:id/read
 * Mark notification as read
 */
export const markNotificationRead = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { id } = req.params;

  const notification = await prisma.notification.findUnique({
    where: { id },
  });

  if (!notification) {
    res.status(404).json({
      error: 'Not Found',
      message: 'Notification not found',
      code: 'NOTIF_001',
    });
    return;
  }

  if (notification.userId !== req.userId) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'You can only mark your own notifications as read',
      code: 'NOTIF_002',
    });
    return;
  }

  await prisma.notification.update({
    where: { id },
    data: {
      read: true,
      readAt: new Date(),
    },
  });

  res.json({
    data: {
      success: true,
    },
  });
});

/**
 * PUT /notifications/read-all
 * Mark all notifications as read
 */
export const markAllRead = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  await prisma.notification.updateMany({
    where: {
      userId: req.userId,
      read: false,
    },
    data: {
      read: true,
      readAt: new Date(),
    },
  });

  res.json({
    data: {
      success: true,
    },
  });
});

/**
 * GET /notifications/settings
 * Get notification settings
 */
export const getSettings = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const profile = await prisma.userProfile.findUnique({
    where: { userId: req.userId },
  });

  const preferences = profile?.preferences as {
    notifications?: {
      push?: boolean;
      email?: boolean;
      matches?: boolean;
      messages?: boolean;
      likes?: boolean;
    };
  } || {};

  res.json({
    data: {
      notifications: preferences.notifications || {
        push: true,
        email: true,
        matches: true,
        messages: true,
        likes: true,
      },
    },
  });
});

/**
 * PUT /notifications/settings
 * Update notification settings
 */
export const updateSettings = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { notifications } = z.object({
    notifications: z.object({
      push: z.boolean().optional(),
      email: z.boolean().optional(),
      matches: z.boolean().optional(),
      messages: z.boolean().optional(),
      likes: z.boolean().optional(),
    }),
  }).parse(req.body);

  const profile = await prisma.userProfile.findUnique({
    where: { userId: req.userId },
  });

  const existingPreferences = (profile?.preferences as Record<string, unknown>) || {};
  const updatedPreferences = {
    ...existingPreferences,
    notifications: {
      ...(existingPreferences.notifications as Record<string, unknown> || {}),
      ...notifications,
    },
  };

  await prisma.userProfile.upsert({
    where: { userId: req.userId },
    update: {
      preferences: updatedPreferences,
      updatedAt: new Date(),
    },
    create: {
      userId: req.userId,
      preferences: updatedPreferences,
    },
  });

  res.json({
    data: {
      notifications,
    },
  });
});

