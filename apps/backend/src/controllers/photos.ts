import { Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/error-handler.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

/**
 * GET /photos
 * Get photos with filters
 */
export const getPhotos = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { status, ownerId, petId, limit = '50', offset = '0' } = req.query;

  const where: {
    status?: string;
    userId?: string;
    petId?: string;
  } = {};

  if (status) {
    where.status = status as string;
  }
  if (ownerId) {
    where.userId = ownerId as string;
  }
  if (petId) {
    where.petId = petId as string;
  }

  const [photos, total] = await Promise.all([
    prisma.photo.findMany({
      where,
      include: {
        pet: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string, 10),
      skip: parseInt(offset as string, 10),
    }),
    prisma.photo.count({ where }),
  ]);

  res.json({
    data: photos.map((photo) => ({
      id: photo.id,
      petId: photo.petId,
      userId: photo.userId,
      url: photo.url,
      thumbnailUrl: photo.thumbnailUrl,
      status: photo.status,
      pet: photo.pet ? {
        id: photo.pet.id,
        name: photo.pet.name,
      } : null,
      createdAt: photo.createdAt.toISOString(),
      updatedAt: photo.updatedAt.toISOString(),
    })),
    pagination: {
      total,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    },
  });
});

/**
 * GET /photos/:id
 * Get specific photo
 */
export const getPhoto = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { id } = req.params;

  const photo = await prisma.photo.findUnique({
    where: { id },
    include: {
      pet: {
        select: {
          id: true,
          name: true,
          ownerId: true,
        },
      },
      moderationTask: true,
    },
  });

  if (!photo) {
    res.status(404).json({
      error: 'Not Found',
      message: 'Photo not found',
      code: 'PHOTO_001',
    });
    return;
  }

  res.json({
    data: {
      id: photo.id,
      petId: photo.petId,
      userId: photo.userId,
      url: photo.url,
      thumbnailUrl: photo.thumbnailUrl,
      status: photo.status,
      pet: photo.pet ? {
        id: photo.pet.id,
        name: photo.pet.name,
        ownerId: photo.pet.ownerId,
      } : null,
      moderationTask: photo.moderationTask ? {
        id: photo.moderationTask.id,
        status: photo.moderationTask.status,
        result: photo.moderationTask.result,
      } : null,
      createdAt: photo.createdAt.toISOString(),
      updatedAt: photo.updatedAt.toISOString(),
    },
  });
});

/**
 * POST /photos
 * Create photo record
 */
export const createPhoto = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const body = z.object({
    petId: z.string().uuid().optional(),
    url: z.string().url(),
    thumbnailUrl: z.string().url().optional(),
  }).parse(req.body);

  // If petId provided, verify it belongs to user
  if (body.petId) {
    const pet = await prisma.pet.findUnique({
      where: { id: body.petId },
    });

    if (!pet) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Pet not found',
        code: 'PET_001',
      });
      return;
    }

    if (pet.ownerId !== req.userId) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You can only add photos to your own pets',
        code: 'PHOTO_002',
      });
      return;
    }
  }

  const photo = await prisma.photo.create({
    data: {
      petId: body.petId || null,
      userId: req.userId,
      url: body.url,
      thumbnailUrl: body.thumbnailUrl || body.url,
      status: 'pending',
    },
  });

  // Create moderation task
  await prisma.moderationTask.create({
    data: {
      photoId: photo.id,
      status: 'pending',
    },
  });

  res.status(201).json({
    data: {
      id: photo.id,
      petId: photo.petId,
      userId: photo.userId,
      url: photo.url,
      thumbnailUrl: photo.thumbnailUrl,
      status: photo.status,
      createdAt: photo.createdAt.toISOString(),
      updatedAt: photo.updatedAt.toISOString(),
    },
  });
});

/**
 * POST /photos/check-duplicate
 * Check if photo is duplicate
 */
export const checkDuplicate = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { url } = z.object({
    url: z.string().url(),
  }).parse(req.body);

  // Generate hash from URL (in production, would hash actual image content)
  const hash = createHash('sha256').update(url).digest('hex');

  // Check for similar URLs (simple check - in production, use image hashing)
  const existing = await prisma.photo.findFirst({
    where: {
      url: { contains: url.split('/').pop() || '' },
    },
  });

  res.json({
    data: {
      isDuplicate: !!existing,
      duplicatePhotoId: existing?.id || null,
    },
  });
});

/**
 * POST /photos/release-held
 * Release held photos (admin only)
 */
export const releaseHeld = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { photoIds } = z.object({
    photoIds: z.array(z.string().uuid()),
  }).parse(req.body);

  // TODO: Check if user is admin

  await prisma.photo.updateMany({
    where: {
      id: { in: photoIds },
      status: 'pending',
    },
    data: {
      status: 'approved',
    },
  });

  res.json({
    data: {
      success: true,
      released: photoIds.length,
    },
  });
});

