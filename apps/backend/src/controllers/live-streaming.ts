import { Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import { asyncHandler } from '../middleware/error-handler.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();

// Validation schemas
const createRoomSchema = z.object({
  title: z.string().max(200).optional(),
});

const joinRoomSchema = z.object({
  roomId: z.string(),
});

const reactSchema = z.object({
  emoji: z.string().max(10),
});

const chatMessageSchema = z.object({
  content: z.string().min(1).max(500),
});

/**
 * Generate unique room ID
 */
function generateRoomId(): string {
  return randomBytes(16).toString('hex');
}

/**
 * POST /live/createRoom
 * Create a live streaming room
 */
export const createRoom = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const body = createRoomSchema.parse(req.body);

  const roomId = generateRoomId();

  const stream = await prisma.liveStream.create({
    data: {
      hostId: req.userId,
      roomId,
      title: body.title || null,
      status: 'active',
      viewerCount: 0,
    },
  });

  res.status(201).json({
    data: {
      id: stream.id,
      roomId: stream.roomId,
      hostId: stream.hostId,
      title: stream.title,
      status: stream.status,
      viewerCount: stream.viewerCount,
      startedAt: stream.startedAt.toISOString(),
    },
  });
});

/**
 * POST /live/endRoom
 * End a live stream
 */
export const endRoom = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { roomId } = req.body;

  if (!roomId || typeof roomId !== 'string') {
    res.status(400).json({
      error: 'Bad Request',
      message: 'roomId is required',
      code: 'LIVE_001',
    });
    return;
  }

  const stream = await prisma.liveStream.findUnique({
    where: { roomId },
  });

  if (!stream) {
    res.status(404).json({
      error: 'Not Found',
      message: 'Stream not found',
      code: 'LIVE_002',
    });
    return;
  }

  if (stream.hostId !== req.userId) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'You can only end your own streams',
      code: 'LIVE_003',
    });
    return;
  }

  const updated = await prisma.liveStream.update({
    where: { roomId },
    data: {
      status: 'ended',
      endedAt: new Date(),
    },
  });

  res.json({
    data: {
      id: updated.id,
      roomId: updated.roomId,
      status: updated.status,
      endedAt: updated.endedAt?.toISOString() || null,
    },
  });
});

/**
 * GET /live/active
 * Get active live streams
 */
export const getActiveStreams = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { limit = '20', offset = '0' } = req.query;

  const [streams, total] = await Promise.all([
    prisma.liveStream.findMany({
      where: { status: 'active' },
      orderBy: { startedAt: 'desc' },
      take: parseInt(limit as string, 10),
      skip: parseInt(offset as string, 10),
    }),
    prisma.liveStream.count({ where: { status: 'active' } }),
  ]);

  res.json({
    data: streams.map((stream) => ({
      id: stream.id,
      roomId: stream.roomId,
      hostId: stream.hostId,
      title: stream.title,
      status: stream.status,
      viewerCount: stream.viewerCount,
      startedAt: stream.startedAt.toISOString(),
    })),
    pagination: {
      total,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    },
  });
});

/**
 * GET /live/:id
 * Get stream details
 */
export const getStream = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { id } = req.params;

  const stream = await prisma.liveStream.findUnique({
    where: { id },
  });

  if (!stream) {
    res.status(404).json({
      error: 'Not Found',
      message: 'Stream not found',
      code: 'LIVE_002',
    });
    return;
  }

  res.json({
    data: {
      id: stream.id,
      roomId: stream.roomId,
      hostId: stream.hostId,
      title: stream.title,
      status: stream.status,
      viewerCount: stream.viewerCount,
      startedAt: stream.startedAt.toISOString(),
      endedAt: stream.endedAt?.toISOString() || null,
    },
  });
});

/**
 * POST /live/:id/join
 * Join a live stream
 */
export const joinStream = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { id } = req.params;

  const stream = await prisma.liveStream.findUnique({
    where: { id },
  });

  if (!stream) {
    res.status(404).json({
      error: 'Not Found',
      message: 'Stream not found',
      code: 'LIVE_002',
    });
    return;
  }

  if (stream.status !== 'active') {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Stream is not active',
      code: 'LIVE_004',
    });
    return;
  }

  // Increment viewer count
  const updated = await prisma.liveStream.update({
    where: { id },
    data: {
      viewerCount: { increment: 1 },
    },
  });

  res.json({
    data: {
      id: updated.id,
      roomId: updated.roomId,
      viewerCount: updated.viewerCount,
      success: true,
    },
  });
});

/**
 * POST /live/:id/leave
 * Leave a live stream
 */
export const leaveStream = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { id } = req.params;

  const stream = await prisma.liveStream.findUnique({
    where: { id },
  });

  if (!stream) {
    res.status(404).json({
      error: 'Not Found',
      message: 'Stream not found',
      code: 'LIVE_002',
    });
    return;
  }

  // Decrement viewer count (don't go below 0)
  const updated = await prisma.liveStream.update({
    where: { id },
    data: {
      viewerCount: Math.max(0, stream.viewerCount - 1),
    },
  });

  res.json({
    data: {
      id: updated.id,
      roomId: updated.roomId,
      viewerCount: updated.viewerCount,
      success: true,
    },
  });
});

/**
 * POST /live/:id/react
 * Send reaction to stream
 */
export const reactToStream = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { id } = req.params;
  const body = reactSchema.parse(req.body);

  const stream = await prisma.liveStream.findUnique({
    where: { id },
  });

  if (!stream) {
    res.status(404).json({
      error: 'Not Found',
      message: 'Stream not found',
      code: 'LIVE_002',
    });
    return;
  }

  if (stream.status !== 'active') {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Stream is not active',
      code: 'LIVE_004',
    });
    return;
  }

  // In production, this would emit a WebSocket event
  // For now, just return success
  res.json({
    data: {
      success: true,
      emoji: body.emoji,
      userId: req.userId,
    },
  });
});

/**
 * POST /live/:id/chat
 * Send chat message to stream
 */
export const sendStreamChat = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { id } = req.params;
  const body = chatMessageSchema.parse(req.body);

  const stream = await prisma.liveStream.findUnique({
    where: { id },
  });

  if (!stream) {
    res.status(404).json({
      error: 'Not Found',
      message: 'Stream not found',
      code: 'LIVE_002',
    });
    return;
  }

  if (stream.status !== 'active') {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Stream is not active',
      code: 'LIVE_004',
    });
    return;
  }

  // In production, this would emit a WebSocket event
  // For now, just return success
  res.json({
    data: {
      success: true,
      content: body.content,
      userId: req.userId,
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * GET /live/:id/chat
 * Get stream chat messages
 */
export const getStreamChat = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { id } = req.params;
  const { limit = '50' } = req.query;

  const stream = await prisma.liveStream.findUnique({
    where: { id },
  });

  if (!stream) {
    res.status(404).json({
      error: 'Not Found',
      message: 'Stream not found',
      code: 'LIVE_002',
    });
    return;
  }

  // In production, this would fetch from a separate chat messages table
  // For now, return empty array
  res.json({
    data: [],
    pagination: {
      total: 0,
      limit: parseInt(limit as string, 10),
    },
  });
});

