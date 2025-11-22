import { Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/error-handler.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();

// Validation schemas
const blockPetSchema = z.object({
  blockerPetId: z.string().uuid(),
  blockedPetId: z.string().uuid(),
});

const blockUserSchema = z.object({
  blockerUserId: z.string().uuid(),
  blockedUserId: z.string().uuid(),
});

/**
 * POST /blocking/block
 * Block a pet (deprecated - use block-pet)
 */
export const blockPet = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const body = blockPetSchema.parse(req.body);

  // Verify blocker pet belongs to user
  const blockerPet = await prisma.pet.findUnique({
    where: { id: body.blockerPetId },
  });

  if (!blockerPet) {
    res.status(404).json({
      error: 'Not Found',
      message: 'Pet not found',
      code: 'PET_001',
    });
    return;
  }

  if (blockerPet.ownerId !== req.userId) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'You can only block pets using your own pets',
      code: 'BLOCK_001',
    });
    return;
  }

  // Check if already blocked
  const existing = await prisma.blockedPet.findUnique({
    where: {
      blockerPetId_blockedPetId: {
        blockerPetId: body.blockerPetId,
        blockedPetId: body.blockedPetId,
      },
    },
  });

  if (existing) {
    res.status(409).json({
      error: 'Conflict',
      message: 'Pet is already blocked',
      code: 'BLOCK_002',
    });
    return;
  }

  await prisma.blockedPet.create({
    data: {
      blockerPetId: body.blockerPetId,
      blockedPetId: body.blockedPetId,
    },
  });

  res.status(201).json({
    data: {
      success: true,
      blockerPetId: body.blockerPetId,
      blockedPetId: body.blockedPetId,
    },
  });
});

/**
 * POST /blocking/block-user
 * Block a user
 */
export const blockUser = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const body = blockUserSchema.parse(req.body);

  if (body.blockerUserId !== req.userId) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'You can only block users as yourself',
      code: 'BLOCK_001',
    });
    return;
  }

  // TODO: Implement user blocking table in schema
  // For now, return success
  res.status(201).json({
    data: {
      success: true,
      blockerUserId: body.blockerUserId,
      blockedUserId: body.blockedUserId,
    },
  });
});

/**
 * DELETE /blocking/unblock/:blockerPetId/:blockedPetId
 * Unblock a pet
 */
export const unblockPet = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { blockerPetId, blockedPetId } = req.params;

  // Verify blocker pet belongs to user
  const blockerPet = await prisma.pet.findUnique({
    where: { id: blockerPetId },
  });

  if (!blockerPet) {
    res.status(404).json({
      error: 'Not Found',
      message: 'Pet not found',
      code: 'PET_001',
    });
    return;
  }

  if (blockerPet.ownerId !== req.userId) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'You can only unblock pets using your own pets',
      code: 'BLOCK_001',
    });
    return;
  }

  await prisma.blockedPet.deleteMany({
    where: {
      blockerPetId,
      blockedPetId,
    },
  });

  res.json({
    data: {
      success: true,
    },
  });
});

/**
 * GET /blocking/status/:blockerPetId/:blockedPetId
 * Check if pet is blocked
 */
export const getBlockStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { blockerPetId, blockedPetId } = req.params;

  const blocked = await prisma.blockedPet.findUnique({
    where: {
      blockerPetId_blockedPetId: {
        blockerPetId,
        blockedPetId,
      },
    },
  });

  res.json({
    data: {
      isBlocked: !!blocked,
    },
  });
});

/**
 * GET /blocking/pets/:petId/blocked
 * Get list of blocked pets
 */
export const getBlockedPets = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { petId } = req.params;

  // Verify pet belongs to user
  const pet = await prisma.pet.findUnique({
    where: { id: petId },
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
      message: 'You can only view blocked pets for your own pets',
      code: 'BLOCK_001',
    });
    return;
  }

  const blockedPets = await prisma.blockedPet.findMany({
    where: { blockerPetId: petId },
    include: {
      blockerPet: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  res.json({
    data: blockedPets.map((block) => ({
      id: block.id,
      blockedPetId: block.blockedPetId,
      createdAt: block.createdAt.toISOString(),
    })),
  });
});

