import { Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/error-handler.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();

// Validation schemas
const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  avatar: z.string().url().optional(),
});

const updatePreferencesSchema = z.object({
  theme: z.enum(['light', 'dark']).optional(),
  language: z.enum(['en', 'bg']).optional(),
  notifications: z.object({
    push: z.boolean().optional(),
    email: z.boolean().optional(),
    matches: z.boolean().optional(),
    messages: z.boolean().optional(),
    likes: z.boolean().optional(),
  }).optional(),
  quietHours: z.object({
    start: z.string(),
    end: z.string(),
  }).nullable().optional(),
}).passthrough(); // Allow additional fields

const updateLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
});

/**
 * GET /users/profile
 * Get current user's profile
 */
export const getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    include: { profile: true },
  });

  if (!user) {
    res.status(404).json({
      error: 'Not Found',
      message: 'User not found',
      code: 'USER_001',
    });
    return;
  }

  res.json({
    data: {
      id: user.id,
      email: user.email,
      displayName: user.profile?.firstName || user.email.split('@')[0],
      avatarUrl: user.profile?.avatar || null,
      bio: user.profile?.bio || null,
      emailVerified: user.emailVerified,
      location: user.profile?.location || null,
      preferences: user.profile?.preferences || {
        theme: 'light',
        language: 'en',
        notifications: {
          push: true,
          email: true,
          matches: true,
          messages: true,
          likes: true,
        },
        quietHours: null,
      },
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    },
  });
});

/**
 * PUT /users/profile
 * Update user profile
 */
export const updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const body = updateProfileSchema.parse(req.body);

  // Update or create profile
  const profile = await prisma.userProfile.upsert({
    where: { userId: req.userId },
    update: {
      firstName: body.firstName,
      lastName: body.lastName,
      bio: body.bio,
      avatar: body.avatar,
      updatedAt: new Date(),
    },
    create: {
      userId: req.userId,
      firstName: body.firstName || null,
      lastName: body.lastName || null,
      bio: body.bio || null,
      avatar: body.avatar || null,
    },
  });

  const user = await prisma.user.findUnique({
    where: { id: req.userId },
  });

  res.json({
    data: {
      id: user!.id,
      email: user!.email,
      displayName: profile.firstName || user!.email.split('@')[0],
      avatarUrl: profile.avatar || null,
      bio: profile.bio || null,
      emailVerified: user!.emailVerified,
      location: profile.location || null,
      preferences: profile.preferences || {
        theme: 'light',
        language: 'en',
        notifications: {
          push: true,
          email: true,
          matches: true,
          messages: true,
          likes: true,
        },
        quietHours: null,
      },
      createdAt: user!.createdAt.toISOString(),
      updatedAt: user!.updatedAt.toISOString(),
    },
  });
});

/**
 * POST /users/avatar
 * Upload user avatar (returns URL - actual upload handled by frontend)
 */
export const uploadAvatar = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { url } = z.object({
    url: z.string().url('Invalid avatar URL'),
  }).parse(req.body);

  // Update profile with avatar URL
  await prisma.userProfile.upsert({
    where: { userId: req.userId },
    update: { avatar: url },
    create: {
      userId: req.userId,
      avatar: url,
    },
  });

  res.json({
    data: {
      avatarUrl: url,
    },
  });
});

/**
 * GET /users/preferences
 * Get user preferences
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

  const profile = await prisma.userProfile.findUnique({
    where: { userId: req.userId },
  });

  const preferences = profile?.preferences || {
    theme: 'light',
    language: 'en',
    notifications: {
      push: true,
      email: true,
      matches: true,
      messages: true,
      likes: true,
    },
    quietHours: null,
  };

  res.json({
    data: preferences,
  });
});

/**
 * PUT /users/preferences
 * Update user preferences
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

  const body = updatePreferencesSchema.parse(req.body);

  // Get existing preferences
  const profile = await prisma.userProfile.findUnique({
    where: { userId: req.userId },
  });

  const existingPreferences = (profile?.preferences as Record<string, unknown>) || {
    theme: 'light',
    language: 'en',
    notifications: {
      push: true,
      email: true,
      matches: true,
      messages: true,
      likes: true,
    },
    quietHours: null,
  };

  // Merge preferences
  const updatedPreferences = {
    ...existingPreferences,
    ...body,
    notifications: {
      ...(existingPreferences.notifications as Record<string, unknown>),
      ...(body.notifications || {}),
    },
  };

  // Update profile
  await prisma.userProfile.upsert({
    where: { userId: req.userId },
    update: {
      preferences: updatedPreferences,
      updatedAt: new Date(),
    },
    create: {
      userId: req.userId,
      preferences: updatedPreferences,
    },
  });

  res.json({
    data: updatedPreferences,
  });
});

/**
 * GET /users/notifications
 * Get user notifications
 */
export const getNotifications = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { read, limit = '50', offset = '0' } = req.query;

  const where: { userId: string; read?: boolean } = {
    userId: req.userId,
  };

  if (read !== undefined) {
    where.read = read === 'true';
  }

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string, 10),
      skip: parseInt(offset as string, 10),
    }),
    prisma.notification.count({ where }),
  ]);

  res.json({
    data: notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      data: n.data || {},
      read: n.read,
      readAt: n.readAt?.toISOString() || null,
      createdAt: n.createdAt.toISOString(),
    })),
    pagination: {
      total,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    },
  });
});

/**
 * GET /users/settings
 * Get user settings (combines profile and preferences)
 */
export const getSettings = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    include: { profile: true },
  });

  if (!user) {
    res.status(404).json({
      error: 'Not Found',
      message: 'User not found',
      code: 'USER_001',
    });
    return;
  }

  res.json({
    data: {
      profile: {
        firstName: user.profile?.firstName || null,
        lastName: user.profile?.lastName || null,
        bio: user.profile?.bio || null,
        avatar: user.profile?.avatar || null,
        location: user.profile?.location || null,
      },
      preferences: user.profile?.preferences || {
        theme: 'light',
        language: 'en',
        notifications: {
          push: true,
          email: true,
          matches: true,
          messages: true,
          likes: true,
        },
        quietHours: null,
      },
      email: user.email,
      emailVerified: user.emailVerified,
    },
  });
});

/**
 * PUT /users/location
 * Update user location
 */
export const updateLocation = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const body = updateLocationSchema.parse(req.body);

  const location = {
    lat: body.lat,
    lng: body.lng,
    city: body.city || null,
    state: body.state || null,
    country: body.country || null,
  };

  await prisma.userProfile.upsert({
    where: { userId: req.userId },
    update: {
      location: location as unknown as Record<string, unknown>,
      updatedAt: new Date(),
    },
    create: {
      userId: req.userId,
      location: location as unknown as Record<string, unknown>,
    },
  });

  res.json({
    data: location,
  });
});

/**
 * GET /users/location/nearby
 * Find users nearby (within radius in km)
 */
export const getNearbyUsers = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { lat, lng, radius = '10' } = req.query;

  if (!lat || !lng) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Latitude and longitude are required',
      code: 'USER_002',
    });
    return;
  }

  const userLat = parseFloat(lat as string);
  const userLng = parseFloat(lng as string);
  const radiusKm = parseFloat(radius as string);

  // Get current user's location
  const currentUser = await prisma.userProfile.findUnique({
    where: { userId: req.userId },
  });

  if (!currentUser?.location) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'User location not set',
      code: 'USER_003',
    });
    return;
  }

  // Find nearby users using Prisma
  // Note: For production, consider using PostGIS for better geospatial queries
  const allProfiles = await prisma.userProfile.findMany({
    where: {
      location: { not: null },
      userId: { not: req.userId }, // Exclude current user
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          emailVerified: true,
          createdAt: true,
        },
      },
    },
  });

  // Calculate distance using Haversine formula
  const nearbyUsers = allProfiles
    .map((profile) => {
      const loc = profile.location as { lat?: number; lng?: number } | null;
      if (!loc || typeof loc.lat !== 'number' || typeof loc.lng !== 'number') {
        return null;
      }

      // Haversine formula
      const R = 6371; // Earth's radius in km
      const dLat = ((loc.lat - userLat) * Math.PI) / 180;
      const dLng = ((loc.lng - userLng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((userLat * Math.PI) / 180) *
          Math.cos((loc.lat * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      if (distance > radiusKm) {
        return null;
      }

      return {
        user: {
          id: profile.user.id,
          email: profile.user.email,
          displayName: profile.firstName || profile.user.email.split('@')[0],
          avatarUrl: profile.avatar || null,
          emailVerified: profile.user.emailVerified,
        },
        location: loc,
        distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
      };
    })
    .filter((user): user is NonNullable<typeof user> => user !== null)
    .sort((a, b) => a.distance - b.distance);

  res.json({
    data: nearbyUsers,
    meta: {
      center: { lat: userLat, lng: userLng },
      radius: radiusKm,
      count: nearbyUsers.length,
    },
  });
});

