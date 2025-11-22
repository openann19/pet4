import { Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/error-handler.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();

// Validation schemas
const createAlertSchema = z.object({
  petId: z.string().uuid().optional(),
  type: z.enum(['lost', 'found']),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    address: z.string().optional(),
  }),
  description: z.string().min(1).max(2000),
  photos: z.array(z.string().url()).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['active', 'resolved', 'closed']),
});

/**
 * POST /alerts/lost
 * Create lost pet alert
 */
export const createLostAlert = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const body = createAlertSchema.parse({ ...req.body, type: 'lost' });

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
        message: 'You can only create alerts for your own pets',
        code: 'ALERT_001',
      });
      return;
    }
  }

  const alert = await prisma.lostFoundAlert.create({
    data: {
      petId: body.petId || null,
      ownerId: req.userId,
      type: 'lost',
      location: body.location as unknown as Record<string, unknown>,
      description: body.description,
      photos: body.photos || [],
      status: 'active',
      views: 0,
    },
  });

  res.status(201).json({
    data: {
      id: alert.id,
      petId: alert.petId,
      ownerId: alert.ownerId,
      type: alert.type,
      location: alert.location,
      description: alert.description,
      photos: (alert.photos as string[]) || [],
      status: alert.status,
      views: alert.views,
      createdAt: alert.createdAt.toISOString(),
      updatedAt: alert.updatedAt.toISOString(),
    },
  });
});

/**
 * GET /alerts/lost
 * Get lost pet alerts
 */
export const getLostAlerts = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { status = 'active', limit = '20', offset = '0' } = req.query;

  const where: { type: string; status?: string } = {
    type: 'lost',
  };

  if (status) {
    where.status = status as string;
  }

  const [alerts, total] = await Promise.all([
    prisma.lostFoundAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string, 10),
      skip: parseInt(offset as string, 10),
    }),
    prisma.lostFoundAlert.count({ where }),
  ]);

  res.json({
    data: alerts.map((alert) => ({
      id: alert.id,
      petId: alert.petId,
      ownerId: alert.ownerId,
      type: alert.type,
      location: alert.location,
      description: alert.description,
      photos: (alert.photos as string[]) || [],
      status: alert.status,
      views: alert.views,
      createdAt: alert.createdAt.toISOString(),
      updatedAt: alert.updatedAt.toISOString(),
    })),
    pagination: {
      total,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    },
  });
});

/**
 * GET /alerts/lost/:id
 * Get specific lost alert
 */
export const getLostAlert = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { id } = req.params;

  const alert = await prisma.lostFoundAlert.findUnique({
    where: { id },
  });

  if (!alert) {
    res.status(404).json({
      error: 'Not Found',
      message: 'Alert not found',
      code: 'ALERT_002',
    });
    return;
  }

  // Increment view count
  await prisma.lostFoundAlert.update({
    where: { id },
    data: {
      views: { increment: 1 },
    },
  });

  res.json({
    data: {
      id: alert.id,
      petId: alert.petId,
      ownerId: alert.ownerId,
      type: alert.type,
      location: alert.location,
      description: alert.description,
      photos: (alert.photos as string[]) || [],
      status: alert.status,
      views: alert.views + 1,
      createdAt: alert.createdAt.toISOString(),
      updatedAt: alert.updatedAt.toISOString(),
    },
  });
});

/**
 * PUT /alerts/lost/:id/status
 * Update alert status
 */
export const updateAlertStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { id } = req.params;
  const body = updateStatusSchema.parse(req.body);

  const alert = await prisma.lostFoundAlert.findUnique({
    where: { id },
  });

  if (!alert) {
    res.status(404).json({
      error: 'Not Found',
      message: 'Alert not found',
      code: 'ALERT_002',
    });
    return;
  }

  if (alert.ownerId !== req.userId) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'You can only update your own alerts',
      code: 'ALERT_003',
    });
    return;
  }

  const updated = await prisma.lostFoundAlert.update({
    where: { id },
    data: {
      status: body.status,
    },
  });

  res.json({
    data: {
      id: updated.id,
      status: updated.status,
      updatedAt: updated.updatedAt.toISOString(),
    },
  });
});

/**
 * PUT /alerts/lost/:id/increment-view
 * Increment view count
 */
export const incrementView = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { id } = req.params;

  const alert = await prisma.lostFoundAlert.findUnique({
    where: { id },
  });

  if (!alert) {
    res.status(404).json({
      error: 'Not Found',
      message: 'Alert not found',
      code: 'ALERT_002',
    });
    return;
  }

  const updated = await prisma.lostFoundAlert.update({
    where: { id },
    data: {
      views: { increment: 1 },
    },
  });

  res.json({
    data: {
      id: updated.id,
      views: updated.views,
    },
  });
});

/**
 * POST /alerts/sightings
 * Report a sighting
 */
export const createSighting = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const body = createAlertSchema.parse({ ...req.body, type: 'found' });

  const alert = await prisma.lostFoundAlert.create({
    data: {
      petId: body.petId || null,
      ownerId: req.userId,
      type: 'found',
      location: body.location as unknown as Record<string, unknown>,
      description: body.description,
      photos: body.photos || [],
      status: 'active',
      views: 0,
    },
  });

  res.status(201).json({
    data: {
      id: alert.id,
      petId: alert.petId,
      ownerId: alert.ownerId,
      type: alert.type,
      location: alert.location,
      description: alert.description,
      photos: (alert.photos as string[]) || [],
      status: alert.status,
      views: alert.views,
      createdAt: alert.createdAt.toISOString(),
      updatedAt: alert.updatedAt.toISOString(),
    },
  });
});

/**
 * GET /alerts/sightings
 * Get found pet alerts (sightings)
 */
export const getSightings = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { status = 'active', limit = '20', offset = '0' } = req.query;

  const where: { type: string; status?: string } = {
    type: 'found',
  };

  if (status) {
    where.status = status as string;
  }

  const [alerts, total] = await Promise.all([
    prisma.lostFoundAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string, 10),
      skip: parseInt(offset as string, 10),
    }),
    prisma.lostFoundAlert.count({ where }),
  ]);

  res.json({
    data: alerts.map((alert) => ({
      id: alert.id,
      petId: alert.petId,
      ownerId: alert.ownerId,
      type: alert.type,
      location: alert.location,
      description: alert.description,
      photos: (alert.photos as string[]) || [],
      status: alert.status,
      views: alert.views,
      createdAt: alert.createdAt.toISOString(),
      updatedAt: alert.updatedAt.toISOString(),
    })),
    pagination: {
      total,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    },
  });
});

