import { Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/error-handler.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();

// Validation schemas
const startKycSchema = z.object({
  type: z.enum(['user', 'pet']).optional().default('user'),
});

const submitDocumentsSchema = z.object({
  verificationId: z.string().uuid(),
  documents: z.array(z.object({
    type: z.string(),
    url: z.string().url(),
  })),
});

/**
 * GET /kyc/status
 * Get KYC verification status
 */
export const getStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const verification = await prisma.kYCVerification.findFirst({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
  });

  if (!verification) {
    res.json({
      data: {
        status: 'not_started',
        verificationId: null,
        documents: [],
        notes: null,
      },
    });
    return;
  }

  res.json({
    data: {
      status: verification.status,
      verificationId: verification.id,
      documents: (verification.documents as Array<{ type: string; url: string }>) || [],
      notes: verification.notes || null,
      createdAt: verification.createdAt.toISOString(),
      updatedAt: verification.updatedAt.toISOString(),
    },
  });
});

/**
 * POST /kyc/start
 * Start KYC verification process
 */
export const startKyc = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const body = startKycSchema.parse(req.body);

  // Check if verification already exists
  const existing = await prisma.kYCVerification.findFirst({
    where: {
      userId: req.userId,
      status: { in: ['pending', 'in_progress'] },
    },
  });

  if (existing) {
    res.status(409).json({
      error: 'Conflict',
      message: 'KYC verification already in progress',
      code: 'KYC_001',
    });
    return;
  }

  const verification = await prisma.kYCVerification.create({
    data: {
      userId: req.userId,
      status: 'pending',
    },
  });

  res.status(201).json({
    data: {
      id: verification.id,
      status: verification.status,
      createdAt: verification.createdAt.toISOString(),
    },
  });
});

/**
 * POST /kyc/documents
 * Submit KYC documents
 */
export const submitDocuments = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const body = submitDocumentsSchema.parse(req.body);

  // Verify verification belongs to user
  const verification = await prisma.kYCVerification.findUnique({
    where: { id: body.verificationId },
  });

  if (!verification) {
    res.status(404).json({
      error: 'Not Found',
      message: 'Verification not found',
      code: 'KYC_002',
    });
    return;
  }

  if (verification.userId !== req.userId) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'You can only submit documents for your own verification',
      code: 'KYC_003',
    });
    return;
  }

  // Update verification with documents
  const updated = await prisma.kYCVerification.update({
    where: { id: body.verificationId },
    data: {
      documents: body.documents as unknown as Record<string, unknown>,
      status: 'in_progress',
    },
  });

  res.json({
    data: {
      id: updated.id,
      status: updated.status,
      documents: body.documents,
      updatedAt: updated.updatedAt.toISOString(),
    },
  });
});

/**
 * GET /kyc/verifications/:id
 * Get verification details (admin or owner)
 */
export const getVerification = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { id } = req.params;

  const verification = await prisma.kYCVerification.findUnique({
    where: { id },
  });

  if (!verification) {
    res.status(404).json({
      error: 'Not Found',
      message: 'Verification not found',
      code: 'KYC_002',
    });
    return;
  }

  // Only owner or admin can view
  if (verification.userId !== req.userId) {
    // TODO: Check if user is admin
    res.status(403).json({
      error: 'Forbidden',
      message: 'You can only view your own verifications',
      code: 'KYC_003',
    });
    return;
  }

  res.json({
    data: {
      id: verification.id,
      userId: verification.userId,
      status: verification.status,
      documents: (verification.documents as Array<{ type: string; url: string }>) || [],
      notes: verification.notes || null,
      createdAt: verification.createdAt.toISOString(),
      updatedAt: verification.updatedAt.toISOString(),
    },
  });
});

