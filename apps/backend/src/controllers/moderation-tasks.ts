import { Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/error-handler.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();

/**
 * GET /admin/moderation/policy
 * Get moderation policy
 */
export const getPolicy = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  // TODO: Check if user is admin
  // Return default policy
  res.json({
    data: {
      autoApproveThreshold: 0.9,
      autoRejectThreshold: 0.3,
      requireManualReview: true,
      nsfwDetection: true,
      duplicateDetection: true,
      maxPhotosPerPet: 10,
      maxPhotosPerUser: 50,
    },
  });
});

/**
 * GET /admin/moderation/tasks
 * Get moderation tasks
 */
export const getTasks = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { status = 'pending', limit = '50', offset = '0' } = req.query;

  const where: { status?: string } = {};
  if (status) {
    where.status = status as string;
  }

  const [tasks, total] = await Promise.all([
    prisma.moderationTask.findMany({
      where,
      include: {
        photo: true,
      },
      orderBy: { createdAt: 'asc' },
      take: parseInt(limit as string, 10),
      skip: parseInt(offset as string, 10),
    }),
    prisma.moderationTask.count({ where }),
  ]);

  res.json({
    data: tasks.map((task) => ({
      id: task.id,
      photoId: task.photoId,
      status: task.status,
      assignedTo: task.assignedTo || null,
      result: task.result || null,
      notes: task.notes || null,
      photo: task.photo ? {
        id: task.photo.id,
        url: task.photo.url,
        status: task.photo.status,
      } : null,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    })),
    pagination: {
      total,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    },
  });
});

/**
 * GET /admin/moderation/tasks/:id
 * Get specific moderation task
 */
export const getTask = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { id } = req.params;

  const task = await prisma.moderationTask.findUnique({
    where: { id },
    include: {
      photo: {
        include: {
          pet: {
            select: {
              id: true,
              name: true,
              ownerId: true,
            },
          },
        },
      },
    },
  });

  if (!task) {
    res.status(404).json({
      error: 'Not Found',
      message: 'Task not found',
      code: 'MOD_001',
    });
    return;
  }

  res.json({
    data: {
      id: task.id,
      photoId: task.photoId,
      status: task.status,
      assignedTo: task.assignedTo || null,
      result: task.result || null,
      notes: task.notes || null,
      photo: task.photo ? {
        id: task.photo.id,
        url: task.photo.url,
        thumbnailUrl: task.photo.thumbnailUrl,
        status: task.photo.status,
        pet: task.photo.pet ? {
          id: task.photo.pet.id,
          name: task.photo.pet.name,
          ownerId: task.photo.pet.ownerId,
        } : null,
      } : null,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    },
  });
});

/**
 * POST /admin/moderation/tasks/:id/take
 * Assign moderation task to current user
 */
export const takeTask = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { id } = req.params;

  const task = await prisma.moderationTask.findUnique({
    where: { id },
  });

  if (!task) {
    res.status(404).json({
      error: 'Not Found',
      message: 'Task not found',
      code: 'MOD_001',
    });
    return;
  }

  if (task.status !== 'pending') {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Task is not available for assignment',
      code: 'MOD_002',
    });
    return;
  }

  const updated = await prisma.moderationTask.update({
    where: { id },
    data: {
      status: 'in_progress',
      assignedTo: req.userId,
    },
  });

  res.json({
    data: {
      id: updated.id,
      status: updated.status,
      assignedTo: updated.assignedTo,
      updatedAt: updated.updatedAt.toISOString(),
    },
  });
});

