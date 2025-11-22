import { Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/error-handler.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();

// Validation schema
const createEventSchema = z.object({
  type: z.string().min(1).max(100),
  data: z.record(z.unknown()).optional(),
  userId: z.string().uuid().optional(),
  petId: z.string().uuid().optional(),
});

/**
 * POST /events
 * Create system event
 */
export const createEvent = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const body = createEventSchema.parse(req.body);

  // Create event record
  const event = await prisma.event.create({
    data: {
      type: body.type,
      data: body.data || {},
      userId: body.userId || req.userId,
      petId: body.petId || null,
    },
  });

  res.status(201).json({
    data: {
      id: event.id,
      type: event.type,
      data: event.data || {},
      userId: event.userId,
      petId: event.petId,
      createdAt: event.createdAt.toISOString(),
    },
  });
});


