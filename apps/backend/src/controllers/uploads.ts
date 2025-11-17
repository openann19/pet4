import { Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/error-handler.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import {
  generatePresignedUrl,
  getPublicUrl,
  deleteFile,
  validateUploadMetadata,
  type UploadMetadata,
} from '../services/s3-service.js';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

// Validation schemas
const signUrlSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().positive().max(50 * 1024 * 1024), // 50MB max
  fileType: z.string(),
  uploadType: z.enum(['pet-photo', 'profile-avatar', 'document', 'video', 'community-post']),
  petId: z.string().uuid().optional(),
});

const completeUploadSchema = z.object({
  key: z.string().min(1),
  size: z.number().int().positive(),
  type: z.string(),
  uploadType: z.enum(['pet-photo', 'profile-avatar', 'document', 'video', 'community-post']),
  petId: z.string().uuid().optional(),
});

/**
 * POST /uploads/sign-url
 * Generate presigned URL for file upload
 */
export const signUrl = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const body = signUrlSchema.parse(req.body);

  // Validate metadata
  const metadata: UploadMetadata = {
    fileName: body.fileName,
    fileSize: body.fileSize,
    fileType: body.fileType,
    uploadType: body.uploadType,
  };

  const validation = validateUploadMetadata(metadata);
  if (!validation.valid) {
    res.status(400).json({
      error: 'Bad Request',
      message: validation.error || 'Invalid upload metadata',
      code: 'UPLOAD_001',
    });
    return;
  }

  // If pet-photo, verify pet belongs to user
  if (body.petId && body.uploadType === 'pet-photo') {
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
        message: 'You can only upload photos for your own pets',
        code: 'UPLOAD_002',
      });
      return;
    }
  }

  // Generate presigned URL
  const presignedUrl = await generatePresignedUrl(metadata);

  res.json({
    data: presignedUrl,
  });
});

/**
 * POST /uploads/complete
 * Complete upload and create database record
 */
export const completeUpload = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const body = completeUploadSchema.parse(req.body);

  // Get public URL
  const publicUrl = getPublicUrl(body.key);

  // Create photo record if it's a pet photo
  if (body.uploadType === 'pet-photo' && body.petId) {
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
        message: 'You can only upload photos for your own pets',
        code: 'UPLOAD_002',
      });
      return;
    }

    // Create photo record
    const photo = await prisma.photo.create({
      data: {
        petId: body.petId,
        userId: req.userId,
        url: publicUrl,
        thumbnailUrl: publicUrl, // TODO: Generate thumbnail
        status: 'pending', // Will be moderated
      },
    });

    res.json({
      data: {
        id: photo.id,
        url: photo.url,
        thumbnailUrl: photo.thumbnailUrl,
        key: body.key,
        size: body.size,
        status: photo.status,
      },
    });
    return;
  }

  // For profile avatars, update user profile
  if (body.uploadType === 'profile-avatar') {
    await prisma.userProfile.upsert({
      where: { userId: req.userId },
      update: { avatar: publicUrl },
      create: {
        userId: req.userId,
        avatar: publicUrl,
      },
    });

    res.json({
      data: {
        url: publicUrl,
        key: body.key,
        size: body.size,
      },
    });
    return;
  }

  // Generic upload completion
  res.json({
    data: {
      url: publicUrl,
      key: body.key,
      size: body.size,
    },
  });
});

/**
 * DELETE /uploads/:key
 * Delete uploaded file
 */
export const deleteUpload = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { key } = req.params;

  if (!key) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'File key is required',
      code: 'UPLOAD_003',
    });
    return;
  }

  // Check if photo exists and belongs to user
  const photo = await prisma.photo.findFirst({
    where: {
      url: { contains: key },
      userId: req.userId,
    },
  });

  if (photo) {
    // Delete from database
    await prisma.photo.delete({
      where: { id: photo.id },
    });
  }

  // Delete from S3
  try {
    await deleteFile(key);
  } catch (error) {
    // Log but don't fail if S3 delete fails
    logger.error('Failed to delete from S3', { key, error });
  }

  res.json({
    data: {
      success: true,
    },
  });
});

