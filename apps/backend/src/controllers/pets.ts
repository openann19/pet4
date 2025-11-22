import { Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/error-handler.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();

// Validation schemas
const createPetSchema = z.object({
  name: z.string().min(1).max(50),
  species: z.enum(['dog', 'cat']),
  breed: z.string().max(100).optional(),
  age: z.number().int().min(0).max(30).optional(),
  gender: z.enum(['male', 'female']).optional(),
  size: z.enum(['small', 'medium', 'large']).optional(),
  description: z.string().max(1000).optional(),
});

const updatePetSchema = createPetSchema.partial();

/**
 * GET /pets
 * List pets with optional filters
 */
export const listPets = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { ownerId, limit = '50', offset = '0' } = req.query;

  const where: { ownerId?: string } = {};
  if (ownerId) {
    where.ownerId = ownerId as string;
  }

  const [pets, total] = await Promise.all([
    prisma.pet.findMany({
      where,
      include: {
        photos: {
          where: { status: 'approved' },
          orderBy: { createdAt: 'asc' },
        },
        owner: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string, 10),
      skip: parseInt(offset as string, 10),
    }),
    prisma.pet.count({ where }),
  ]);

  res.json({
    data: pets.map((pet) => ({
      id: pet.id,
      ownerId: pet.ownerId,
      name: pet.name,
      species: pet.species,
      breed: pet.breed || null,
      age: pet.age || null,
      gender: pet.gender || null,
      size: pet.size || null,
      bio: pet.description || null,
      photos: pet.photos.map((photo, index) => ({
        id: photo.id,
        url: photo.url,
        thumbnailUrl: photo.thumbnailUrl || photo.url,
        order: index,
        uploadedAt: photo.createdAt.toISOString(),
      })),
      location: null, // TODO: Add location to Pet model if needed
      verified: false, // TODO: Add verification system
      createdAt: pet.createdAt.toISOString(),
      updatedAt: pet.updatedAt.toISOString(),
      status: 'active',
      owner: {
        id: pet.owner.id,
        email: pet.owner.email,
        displayName: pet.owner.profile?.firstName || pet.owner.email.split('@')[0],
        avatarUrl: pet.owner.profile?.avatar || null,
      },
    })),
    pagination: {
      total,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    },
  });
});

/**
 * POST /pets
 * Create a new pet
 */
export const createPet = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const body = createPetSchema.parse(req.body);

  const pet = await prisma.pet.create({
    data: {
      ownerId: req.userId,
      name: body.name,
      species: body.species,
      breed: body.breed || null,
      age: body.age || null,
      gender: body.gender || null,
      size: body.size || null,
      description: body.description || null,
    },
    include: {
      photos: true,
      owner: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              firstName: true,
              avatar: true,
            },
          },
        },
      },
    },
  });

  res.status(201).json({
    data: {
      id: pet.id,
      ownerId: pet.ownerId,
      name: pet.name,
      species: pet.species,
      breed: pet.breed || null,
      age: pet.age || null,
      gender: pet.gender || null,
      size: pet.size || null,
      bio: pet.description || null,
      photos: [],
      location: null,
      verified: false,
      createdAt: pet.createdAt.toISOString(),
      updatedAt: pet.updatedAt.toISOString(),
      status: 'active',
      owner: {
        id: pet.owner.id,
        email: pet.owner.email,
        displayName: pet.owner.profile?.firstName || pet.owner.email.split('@')[0],
        avatarUrl: pet.owner.profile?.avatar || null,
      },
    },
  });
});

/**
 * GET /pets/:id
 * Get pet by ID
 */
export const getPet = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { id } = req.params;

  const pet = await prisma.pet.findUnique({
    where: { id },
    include: {
      photos: {
        where: { status: 'approved' },
        orderBy: { createdAt: 'asc' },
      },
      owner: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              firstName: true,
              avatar: true,
            },
          },
        },
      },
    },
  });

  if (!pet) {
    res.status(404).json({
      error: 'Not Found',
      message: 'Pet not found',
      code: 'PET_001',
    });
    return;
  }

  res.json({
    data: {
      id: pet.id,
      ownerId: pet.ownerId,
      name: pet.name,
      species: pet.species,
      breed: pet.breed || null,
      age: pet.age || null,
      gender: pet.gender || null,
      size: pet.size || null,
      bio: pet.description || null,
      photos: pet.photos.map((photo, index) => ({
        id: photo.id,
        url: photo.url,
        thumbnailUrl: photo.thumbnailUrl || photo.url,
        order: index,
        uploadedAt: photo.createdAt.toISOString(),
      })),
      location: null,
      verified: false,
      createdAt: pet.createdAt.toISOString(),
      updatedAt: pet.updatedAt.toISOString(),
      status: 'active',
      owner: {
        id: pet.owner.id,
        email: pet.owner.email,
        displayName: pet.owner.profile?.firstName || pet.owner.email.split('@')[0],
        avatarUrl: pet.owner.profile?.avatar || null,
      },
    },
  });
});

/**
 * PUT /pets/:id
 * Update pet
 */
export const updatePet = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { id } = req.params;
  const body = updatePetSchema.parse(req.body);

  // Check if pet exists and belongs to user
  const existingPet = await prisma.pet.findUnique({
    where: { id },
  });

  if (!existingPet) {
    res.status(404).json({
      error: 'Not Found',
      message: 'Pet not found',
      code: 'PET_001',
    });
    return;
  }

  if (existingPet.ownerId !== req.userId) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'You can only update your own pets',
      code: 'PET_002',
    });
    return;
  }

  const pet = await prisma.pet.update({
    where: { id },
    data: {
      name: body.name,
      species: body.species,
      breed: body.breed,
      age: body.age,
      gender: body.gender,
      size: body.size,
      description: body.description,
    },
    include: {
      photos: {
        where: { status: 'approved' },
        orderBy: { createdAt: 'asc' },
      },
      owner: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              firstName: true,
              avatar: true,
            },
          },
        },
      },
    },
  });

  res.json({
    data: {
      id: pet.id,
      ownerId: pet.ownerId,
      name: pet.name,
      species: pet.species,
      breed: pet.breed || null,
      age: pet.age || null,
      gender: pet.gender || null,
      size: pet.size || null,
      bio: pet.description || null,
      photos: pet.photos.map((photo, index) => ({
        id: photo.id,
        url: photo.url,
        thumbnailUrl: photo.thumbnailUrl || photo.url,
        order: index,
        uploadedAt: photo.createdAt.toISOString(),
      })),
      location: null,
      verified: false,
      createdAt: pet.createdAt.toISOString(),
      updatedAt: pet.updatedAt.toISOString(),
      status: 'active',
      owner: {
        id: pet.owner.id,
        email: pet.owner.email,
        displayName: pet.owner.profile?.firstName || pet.owner.email.split('@')[0],
        avatarUrl: pet.owner.profile?.avatar || null,
      },
    },
  });
});

/**
 * DELETE /pets/:id
 * Delete pet
 */
export const deletePet = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { id } = req.params;

  // Check if pet exists and belongs to user
  const pet = await prisma.pet.findUnique({
    where: { id },
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
      message: 'You can only delete your own pets',
      code: 'PET_002',
    });
    return;
  }

  await prisma.pet.delete({
    where: { id },
  });

  res.json({
    data: {
      success: true,
    },
  });
});

