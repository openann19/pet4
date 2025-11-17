import { Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/error-handler.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { discoverMatches, calculateCompatibilityScore } from '../services/matching-service.js';

const prisma = new PrismaClient();

// Validation schemas
const discoverSchema = z.object({
  petId: z.string().uuid(),
  filters: z.object({
    species: z.array(z.string()).optional(),
    minAge: z.number().int().min(0).max(30).optional(),
    maxAge: z.number().int().min(0).max(30).optional(),
    maxDistance: z.number().positive().optional(),
  }).optional(),
  pageSize: z.number().int().min(1).max(50).optional().default(20),
});

const swipeSchema = z.object({
  petId: z.string().uuid(),
  targetPetId: z.string().uuid(),
  action: z.enum(['like', 'pass', 'superlike']),
});

const scoreSchema = z.object({
  petId1: z.string().uuid(),
  petId2: z.string().uuid(),
});

/**
 * GET /matching/preferences
 * Get matching preferences for a pet
 */
export const getPreferences = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { petId } = req.query;

  if (!petId || typeof petId !== 'string') {
    res.status(400).json({
      error: 'Bad Request',
      message: 'petId is required',
      code: 'MATCH_001',
    });
    return;
  }

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
      message: 'You can only view preferences for your own pets',
      code: 'MATCH_002',
    });
    return;
  }

  // Return default preferences (would be stored in database in production)
  res.json({
    data: {
      petId,
      preferences: {
        species: [],
        minAge: null,
        maxAge: null,
        maxDistance: 50, // km
      },
    },
  });
});

/**
 * PUT /matching/preferences
 * Update matching preferences
 */
export const updatePreferences = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { petId, preferences } = z.object({
    petId: z.string().uuid(),
    preferences: z.object({
      species: z.array(z.string()).optional(),
      minAge: z.number().int().min(0).max(30).optional(),
      maxAge: z.number().int().min(0).max(30).optional(),
      maxDistance: z.number().positive().optional(),
    }),
  }).parse(req.body);

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
      message: 'You can only update preferences for your own pets',
      code: 'MATCH_002',
    });
    return;
  }

  // TODO: Store preferences in database
  res.json({
    data: {
      petId,
      preferences,
    },
  });
});

/**
 * POST /matching/discover
 * Discover potential matches
 */
export const discover = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const body = discoverSchema.parse(req.body);

  // Verify pet belongs to user
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
      message: 'You can only discover matches for your own pets',
      code: 'MATCH_002',
    });
    return;
  }

  // Get candidates
  const candidates = await discoverMatches(
    body.petId,
    body.filters,
    body.pageSize,
  );

  // Get full pet details for candidates
  const candidatePets = await Promise.all(
    candidates.map(async (candidate) => {
      const pet = await prisma.pet.findUnique({
        where: { id: candidate.petId },
        include: {
          photos: { where: { status: 'approved' }, orderBy: { createdAt: 'asc' } },
          owner: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  firstName: true,
                  avatar: true,
                  location: true,
                },
              },
            },
          },
        },
      });

      if (!pet) return null;

      return {
        pet: {
          id: pet.id,
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
          owner: {
            id: pet.owner.id,
            displayName: pet.owner.profile?.firstName || pet.owner.email.split('@')[0],
            avatarUrl: pet.owner.profile?.avatar || null,
          },
        },
        score: candidate.score,
        compatibility: candidate.compatibility,
      };
    }),
  );

  res.json({
    data: {
      candidates: candidatePets.filter((c): c is NonNullable<typeof c> => c !== null),
      hasMore: candidates.length === body.pageSize,
    },
  });
});

/**
 * POST /matching/swipe
 * Record swipe action (like/pass/superlike)
 */
export const swipe = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const body = swipeSchema.parse(req.body);

  // Verify pet belongs to user
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
      message: 'You can only swipe with your own pets',
      code: 'MATCH_002',
    });
    return;
  }

  // Check if target pet exists
  const targetPet = await prisma.pet.findUnique({
    where: { id: body.targetPetId },
  });

  if (!targetPet) {
    res.status(404).json({
      error: 'Not Found',
      message: 'Target pet not found',
      code: 'PET_001',
    });
    return;
  }

  // Check if already matched
  const existingMatch = await prisma.match.findFirst({
    where: {
      OR: [
        { pet1Id: body.petId, pet2Id: body.targetPetId },
        { pet1Id: body.targetPetId, pet2Id: body.petId },
      ],
    },
  });

  if (existingMatch && existingMatch.status === 'matched') {
    res.json({
      data: {
        isMatch: true,
        matchId: existingMatch.id,
        chatRoomId: null, // Will be created if needed
      },
    });
    return;
  }

  // If like or superlike, check for mutual match
  if (body.action === 'like' || body.action === 'superlike') {
    // Check if target pet has liked this pet
    const reverseMatch = await prisma.match.findFirst({
      where: {
        pet1Id: body.targetPetId,
        pet2Id: body.petId,
        status: 'matched',
      },
    });

    if (reverseMatch) {
      // Create mutual match
      const match = await prisma.match.create({
        data: {
          pet1Id: body.petId,
          pet2Id: body.targetPetId,
          score: 0.8, // Would calculate actual score
          status: 'matched',
        },
      });

      // Create conversation
      const conversation = await prisma.conversation.create({
        data: {
          matchId: match.id,
          userId1: pet.ownerId,
          userId2: targetPet.ownerId,
        },
      });

      res.json({
        data: {
          isMatch: true,
          matchId: match.id,
          chatRoomId: conversation.id,
        },
      });
      return;
    }

    // Just record the like (no match yet)
    await prisma.match.upsert({
      where: {
        pet1Id_pet2Id: {
          pet1Id: body.petId,
          pet2Id: body.targetPetId,
        },
      },
      update: {
        score: body.action === 'superlike' ? 0.9 : 0.7,
        status: 'pending',
      },
      create: {
        pet1Id: body.petId,
        pet2Id: body.targetPetId,
        score: body.action === 'superlike' ? 0.9 : 0.7,
        status: 'pending',
      },
    });
  }

  res.json({
    data: {
      isMatch: false,
      matchId: null,
      chatRoomId: null,
    },
  });
});

/**
 * GET /matching/matches
 * Get all matches for a pet
 */
export const getMatches = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { petId } = req.query;

  if (!petId || typeof petId !== 'string') {
    res.status(400).json({
      error: 'Bad Request',
      message: 'petId is required',
      code: 'MATCH_001',
    });
    return;
  }

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
      message: 'You can only view matches for your own pets',
      code: 'MATCH_002',
    });
    return;
  }

  // Get matches
  const matches = await prisma.match.findMany({
    where: {
      OR: [
        { pet1Id: petId, status: 'matched' },
        { pet2Id: petId, status: 'matched' },
      ],
    },
    include: {
      pet1: {
        include: {
          photos: { where: { status: 'approved' }, take: 1 },
        },
      },
      pet2: {
        include: {
          photos: { where: { status: 'approved' }, take: 1 },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    data: matches.map((match) => {
      const matchedPet = match.pet1Id === petId ? match.pet2 : match.pet1;
      return {
        id: match.id,
        petId: matchedPet.id,
        matchedPetId: matchedPet.id,
        compatibilityScore: match.score,
        status: match.status,
        createdAt: match.createdAt.toISOString(),
        updatedAt: match.updatedAt.toISOString(),
        matchedPet: {
          id: matchedPet.id,
          name: matchedPet.name,
          species: matchedPet.species,
          breed: matchedPet.breed || null,
          age: matchedPet.age || null,
          photos: matchedPet.photos.map((photo) => ({
            id: photo.id,
            url: photo.url,
            thumbnailUrl: photo.thumbnailUrl || photo.url,
          })),
        },
      };
    }),
  });
});

/**
 * POST /matching/score
 * Calculate compatibility score between two pets
 */
export const score = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const body = scoreSchema.parse(req.body);

  // Verify at least one pet belongs to user
  const [pet1, pet2] = await Promise.all([
    prisma.pet.findUnique({ where: { id: body.petId1 } }),
    prisma.pet.findUnique({ where: { id: body.petId2 } }),
  ]);

  if (!pet1 || !pet2) {
    res.status(404).json({
      error: 'Not Found',
      message: 'One or both pets not found',
      code: 'PET_001',
    });
    return;
  }

  if (pet1.ownerId !== req.userId && pet2.ownerId !== req.userId) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'You can only calculate scores for your own pets',
      code: 'MATCH_002',
    });
    return;
  }

  const compatibility = await calculateCompatibilityScore(body.petId1, body.petId2);

  res.json({
    data: {
      petId1: body.petId1,
      petId2: body.petId2,
      compatibility,
    },
  });
});

