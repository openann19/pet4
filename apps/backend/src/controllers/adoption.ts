import { Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/error-handler.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();

// Validation schemas
const createListingSchema = z.object({
  petId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
  }),
});

const createApplicationSchema = z.object({
  listingId: z.string().uuid(),
  message: z.string().min(1).max(1000),
});

/**
 * GET /adoption/listings
 * Get adoption listings
 */
export const getListings = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { status = 'active', limit = '20', offset = '0' } = req.query;

  const where: { status?: string } = {};
  if (status) {
    where.status = status as string;
  }

  const [listings, total] = await Promise.all([
    prisma.adoptionListing.findMany({
      where,
      include: {
        applications: {
          where: { applicantId: req.userId },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string, 10),
      skip: parseInt(offset as string, 10),
    }),
    prisma.adoptionListing.count({ where }),
  ]);

  res.json({
    data: listings.map((listing) => ({
      id: listing.id,
      petId: listing.petId,
      ownerId: listing.ownerId,
      title: listing.title,
      description: listing.description,
      location: listing.location,
      status: listing.status,
      hasApplied: listing.applications.length > 0,
      createdAt: listing.createdAt.toISOString(),
      updatedAt: listing.updatedAt.toISOString(),
    })),
    pagination: {
      total,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    },
  });
});

/**
 * POST /adoption/listings
 * Create adoption listing
 */
export const createListing = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const body = createListingSchema.parse(req.body);

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
      message: 'You can only create listings for your own pets',
      code: 'ADOPT_001',
    });
    return;
  }

  const listing = await prisma.adoptionListing.create({
    data: {
      petId: body.petId,
      ownerId: req.userId,
      title: body.title,
      description: body.description,
      location: body.location as unknown as Record<string, unknown>,
      status: 'active',
    },
  });

  res.status(201).json({
    data: {
      id: listing.id,
      petId: listing.petId,
      ownerId: listing.ownerId,
      title: listing.title,
      description: listing.description,
      location: listing.location,
      status: listing.status,
      createdAt: listing.createdAt.toISOString(),
      updatedAt: listing.updatedAt.toISOString(),
    },
  });
});

/**
 * GET /adoption/listings/:id
 * Get specific listing
 */
export const getListing = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { id } = req.params;

  const listing = await prisma.adoptionListing.findUnique({
    where: { id },
    include: {
      applications: {
        where: { applicantId: req.userId },
        take: 1,
      },
    },
  });

  if (!listing) {
    res.status(404).json({
      error: 'Not Found',
      message: 'Listing not found',
      code: 'ADOPT_002',
    });
    return;
  }

  res.json({
    data: {
      id: listing.id,
      petId: listing.petId,
      ownerId: listing.ownerId,
      title: listing.title,
      description: listing.description,
      location: listing.location,
      status: listing.status,
      hasApplied: listing.applications.length > 0,
      createdAt: listing.createdAt.toISOString(),
      updatedAt: listing.updatedAt.toISOString(),
    },
  });
});

/**
 * PUT /adoption/listings/:id
 * Update listing
 */
export const updateListing = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { id } = req.params;
  const body = createListingSchema.partial().parse(req.body);

  const listing = await prisma.adoptionListing.findUnique({
    where: { id },
  });

  if (!listing) {
    res.status(404).json({
      error: 'Not Found',
      message: 'Listing not found',
      code: 'ADOPT_002',
    });
    return;
  }

  if (listing.ownerId !== req.userId) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'You can only update your own listings',
      code: 'ADOPT_003',
    });
    return;
  }

  const updated = await prisma.adoptionListing.update({
    where: { id },
    data: {
      title: body.title,
      description: body.description,
      location: body.location as unknown as Record<string, unknown>,
    },
  });

  res.json({
    data: {
      id: updated.id,
      petId: updated.petId,
      ownerId: updated.ownerId,
      title: updated.title,
      description: updated.description,
      location: updated.location,
      status: updated.status,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    },
  });
});

/**
 * DELETE /adoption/listings/:id
 * Delete listing
 */
export const deleteListing = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { id } = req.params;

  const listing = await prisma.adoptionListing.findUnique({
    where: { id },
  });

  if (!listing) {
    res.status(404).json({
      error: 'Not Found',
      message: 'Listing not found',
      code: 'ADOPT_002',
    });
    return;
  }

  if (listing.ownerId !== req.userId) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'You can only delete your own listings',
      code: 'ADOPT_003',
    });
    return;
  }

  await prisma.adoptionListing.delete({
    where: { id },
  });

  res.json({
    data: {
      success: true,
    },
  });
});

/**
 * POST /adoption/applications
 * Create adoption application
 */
export const createApplication = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const body = createApplicationSchema.parse(req.body);

  // Verify listing exists
  const listing = await prisma.adoptionListing.findUnique({
    where: { id: body.listingId },
  });

  if (!listing) {
    res.status(404).json({
      error: 'Not Found',
      message: 'Listing not found',
      code: 'ADOPT_002',
    });
    return;
  }

  // Check if already applied
  const existing = await prisma.adoptionApplication.findFirst({
    where: {
      listingId: body.listingId,
      applicantId: req.userId,
    },
  });

  if (existing) {
    res.status(409).json({
      error: 'Conflict',
      message: 'You have already applied for this listing',
      code: 'ADOPT_004',
    });
    return;
  }

  const application = await prisma.adoptionApplication.create({
    data: {
      listingId: body.listingId,
      applicantId: req.userId,
      message: body.message,
      status: 'pending',
    },
  });

  res.status(201).json({
    data: {
      id: application.id,
      listingId: application.listingId,
      applicantId: application.applicantId,
      message: application.message,
      status: application.status,
      createdAt: application.createdAt.toISOString(),
      updatedAt: application.updatedAt.toISOString(),
    },
  });
});

/**
 * GET /adoption/applications
 * Get applications (for listing owner or applicant)
 */
export const getApplications = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { listingId, applicantId } = req.query;

  const where: { listingId?: string; applicantId?: string } = {};

  if (listingId) {
    // Get applications for a specific listing (owner view)
    where.listingId = listingId as string;
    // Verify user owns the listing
    const listing = await prisma.adoptionListing.findUnique({
      where: { id: listingId as string },
    });
    if (!listing || listing.ownerId !== req.userId) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You can only view applications for your own listings',
        code: 'ADOPT_005',
      });
      return;
    }
  } else if (applicantId) {
    // Get applications by a specific applicant
    where.applicantId = applicantId as string;
    if (applicantId !== req.userId) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You can only view your own applications',
        code: 'ADOPT_005',
      });
      return;
    }
  } else {
    // Get all applications for current user
    where.applicantId = req.userId;
  }

  const applications = await prisma.adoptionApplication.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    data: applications.map((app) => ({
      id: app.id,
      listingId: app.listingId,
      applicantId: app.applicantId,
      message: app.message,
      status: app.status,
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
    })),
  });
});

