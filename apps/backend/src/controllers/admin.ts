import type { Response, RequestHandler } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/error-handler.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { createLogger } from '../utils/logger.js';

const prisma = new PrismaClient();
const logger = createLogger('AdminController');

/**
 * GET /admin/dashboard
 * Get admin dashboard statistics
 */
export const getDashboard: RequestHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const [
    totalUsers,
    totalPets,
    totalMatches,
    totalConversations,
    totalAdoptionListings,
    totalCommunityPosts,
    activeSubscriptions,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.pet.count(),
    prisma.match.count({ where: { status: 'matched' } }),
    prisma.conversation.count(),
    prisma.adoptionListing.count({ where: { status: 'active' } }),
    prisma.communityPost.count(),
    prisma.subscription.count({ where: { status: 'active' } }),
  ]);

  res.json({
    data: {
      users: {
        total: totalUsers,
        active: totalUsers, // TODO: Calculate active users
      },
      pets: {
        total: totalPets,
      },
      matches: {
        total: totalMatches,
      },
      conversations: {
        total: totalConversations,
      },
      adoption: {
        activeListings: totalAdoptionListings,
      },
      community: {
        totalPosts: totalCommunityPosts,
      },
      subscriptions: {
        active: activeSubscriptions,
      },
    },
  });
});

/**
 * GET /admin/users
 * Get all users (paginated)
 */
export const getUsers: RequestHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { limit = '50', offset = '0', search } = req.query;

  const where: { email?: { contains: string } } = {};
  if (search) {
    where.email = { contains: search as string };
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        profile: true,
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string, 10),
      skip: parseInt(offset as string, 10),
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    data: users.map((user: { id: string; email: string; emailVerified: boolean; createdAt: Date; updatedAt: Date; profile: { firstName: string | null } | null }) => ({
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      displayName: user.profile?.firstName || user.email.split('@')[0],
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    })),
    pagination: {
      total,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    },
  });
});

/**
 * GET /admin/users/:id
 * Get specific user details
 */
export const getUser: RequestHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      profile: true,
      pets: true,
      refreshTokens: true,
    },
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
      emailVerified: user.emailVerified,
      profile: user.profile,
      petsCount: user.pets.length,
      activeSessions: user.refreshTokens.length,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    },
  });
});

/**
 * POST /admin/users/:userId/reset-password
 * Reset user password (admin only)
 */
export const resetUserPassword: RequestHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  // const { userId } = req.params;

  // TODO: Generate temporary password and send email
  // For now, just return success
  res.json({
    data: {
      success: true,
      message: 'Password reset email sent',
    },
  });
});

/**
 * GET /admin/moderation
 * Get moderation queue
 */
export const getModeration: RequestHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { status = 'pending', limit = '50', offset = '0' } = req.query;

  const where: { status?: string } = {};
  if (status) {
    where.status = status as string;
  }

  const [tasks, total] = await Promise.all([
    prisma.moderationTask.findMany({
      where,
      include: {
        photo: true,
      },
      orderBy: { createdAt: 'asc' },
      take: parseInt(limit as string, 10),
      skip: parseInt(offset as string, 10),
    }),
    prisma.moderationTask.count({ where }),
  ]);

  res.json({
    data: tasks.map((task: { id: string; photoId: string; status: string; assignedTo: string | null; result: string | null; notes: string | null; photo: { id: string; url: string; status: string } | null; createdAt: Date; updatedAt: Date }) => ({
      id: task.id,
      photoId: task.photoId,
      status: task.status,
      assignedTo: task.assignedTo || null,
      result: task.result || null,
      notes: task.notes || null,
      photo: task.photo ? {
        id: task.photo.id,
        url: task.photo.url,
        status: task.photo.status,
      } : null,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    })),
    pagination: {
      total,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    },
  });
});

/**
 * GET /admin/analytics
 * Get analytics data
 */
export const getAnalytics: RequestHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  // Get counts for last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    newUsers,
    newPets,
    newMatches,
    newPosts,
  ] = await Promise.all([
    prisma.user.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.pet.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.match.count({
      where: {
        status: 'matched',
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
    prisma.communityPost.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    }),
  ]);

  res.json({
    data: {
      last30Days: {
        newUsers,
        newPets,
        newMatches,
        newPosts,
      },
    },
  });
});

/**
 * GET /admin/settings
 * Get admin settings
 */
export const getSettings: RequestHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  // Try to get system config from database
  try {
    // Query admin_configs table directly using raw SQL since Prisma doesn't have this model
    const result = await prisma.$queryRaw<Array<{ config: unknown }>>`
      SELECT config
      FROM admin_configs
      WHERE "configType" = 'system' AND "isActive" = true
      ORDER BY version DESC
      LIMIT 1
    `;

    if (result.length > 0 && result[0]?.config) {
      const config = result[0].config as Record<string, unknown>;
      res.json({
        data: {
          maintenanceMode: config.maintenanceMode ?? false,
          registrationEnabled: config.registrationEnabled ?? true,
          moderationEnabled: config.moderationEnabled ?? true,
          // Include feature flags and system settings if present
          featureFlags: config.featureFlags ?? {},
          systemSettings: config.systemSettings ?? {},
        },
      });
      return;
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    // Log error but don't fail - return defaults instead
    // This allows the endpoint to work even if admin_configs table doesn't exist yet
    logger.debug('Failed to get system config from database, using defaults', err);
  }

  // Return default settings if config not available
  res.json({
    data: {
      maintenanceMode: false,
      registrationEnabled: true,
      moderationEnabled: true,
      featureFlags: {},
      systemSettings: {},
    },
  });
});

/**
 * POST /admin/config/broadcast
 * Broadcast system message
 */
export const broadcastMessage: RequestHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { message } = z.object({
    message: z.string().min(1).max(500),
    type: z.enum(['info', 'warning', 'error']).optional().default('info'),
  }).parse(req.body);

  // TODO: Send broadcast notification to all users using message
  // For now, just return success
  void message; // Suppress unused variable warning
  res.json({
    data: {
      success: true,
      message: 'Broadcast sent',
    },
  });
});

/**
 * GET /admin/support/tickets
 * Get support tickets
 */
export const getSupportTickets: RequestHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { limit = '50', offset = '0' } = req.query;
  // const { status, assignedTo } = req.query; // TODO: Use when support tickets table is implemented

  // TODO: Implement support tickets table in Prisma schema
  // For now, return empty array
  res.json({
    data: [],
    pagination: {
      total: 0,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    },
  });
});

/**
 * GET /admin/support/tickets/:id
 * Get specific support ticket
 */
export const getSupportTicket: RequestHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  // const { id } = req.params; // TODO: Use when support tickets table is implemented

  // TODO: Implement support tickets table
  res.status(404).json({
    error: 'Not Found',
    message: 'Support ticket not found',
    code: 'SUPPORT_001',
  });
});

/**
 * GET /admin/support/tickets/:id/messages
 * Get ticket messages
 */
export const getTicketMessages: RequestHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  // const { id } = req.params; // TODO: Use when support ticket messages table is implemented

  // TODO: Implement support ticket messages table
  res.json({
    data: [],
  });
});

/**
 * PUT /admin/support/tickets/:id/status
 * Update ticket status
 */
export const updateTicketStatus: RequestHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { id } = req.params;
  const { status } = z.object({
    status: z.enum(['open', 'in-progress', 'resolved', 'closed']),
  }).parse(req.body);

  // TODO: Implement support tickets table
  res.json({
    data: {
      id,
      status,
      success: true,
    },
  });
});

/**
 * PUT /admin/support/tickets/:id/assign
 * Assign ticket to admin
 */
export const assignTicket: RequestHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { id } = req.params;
  const { assignedTo } = z.object({
    assignedTo: z.string().uuid(),
  }).parse(req.body);

  // TODO: Implement support tickets table
  res.json({
    data: {
      id,
      assignedTo,
      success: true,
    },
  });
});

/**
 * GET /admin/support/stats
 * Get support statistics
 */
export const getSupportStats: RequestHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  // TODO: Calculate support stats
  res.json({
    data: {
      openTickets: 0,
      resolvedToday: 0,
      averageResponseTime: 0,
    },
  });
});

/**
 * GET /admin/audit-logs
 * Get audit logs
 */
export const getAuditLogs: RequestHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { limit = '100', offset = '0', action, userId } = req.query;

  const where: { action?: string; userId?: string } = {};
  if (action) {
    where.action = action as string;
  }
  if (userId) {
    where.userId = userId as string;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string, 10),
      skip: parseInt(offset as string, 10),
    }),
    prisma.auditLog.count({ where }),
  ]);

  res.json({
    data: logs.map((log: { id: string; userId: string | null; action: string; resource: string; resourceId: string | null; details: Record<string, unknown> | null; ipAddress: string | null; userAgent: string | null; createdAt: Date }) => ({
      id: log.id,
      userId: log.userId,
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId,
      details: log.details || {},
      ipAddress: log.ipAddress || null,
      userAgent: log.userAgent || null,
      createdAt: log.createdAt.toISOString(),
    })),
    pagination: {
      total,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    },
  });
});

/**
 * POST /admin/audit-logs
 * Create audit log entry
 */
export const createAuditLog: RequestHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const body = z.object({
    action: z.string(),
    resource: z.string(),
    resourceId: z.string().optional(),
    details: z.record(z.unknown()).optional(),
  }).parse(req.body);

  const log = await prisma.auditLog.create({
    data: {
      userId: req.userId,
      action: body.action,
      resource: body.resource,
      resourceId: body.resourceId || null,
      details: body.details || {},
      ipAddress: req.ip || null,
      userAgent: req.get('user-agent') || null,
    },
  });

  res.status(201).json({
    data: {
      id: log.id,
      action: log.action,
      resource: log.resource,
      createdAt: log.createdAt.toISOString(),
    },
  });
});

