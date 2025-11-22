import { Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/error-handler.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();

// Validation schemas
const sendMessageSchema = z.object({
  content: z.string().min(1).max(5000),
  type: z.enum(['text', 'image', 'video', 'sticker']).optional().default('text'),
});

/**
 * GET /chat/conversations
 * Get all conversations for current user
 */
export const getConversations = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [
        { userId1: req.userId },
        { userId2: req.userId },
      ],
    },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { lastMessageAt: 'desc' },
  });

  res.json({
    data: conversations.map((conv) => ({
      id: conv.id,
      matchId: conv.matchId || null,
      userId1: conv.userId1,
      userId2: conv.userId2,
      lastMessage: conv.messages[0] ? {
        id: conv.messages[0].id,
        content: conv.messages[0].content,
        senderId: conv.messages[0].senderId,
        read: conv.messages[0].read,
        createdAt: conv.messages[0].createdAt.toISOString(),
      } : null,
      lastMessageAt: conv.lastMessageAt?.toISOString() || null,
      createdAt: conv.createdAt.toISOString(),
      updatedAt: conv.updatedAt.toISOString(),
    })),
  });
});

/**
 * GET /chat/conversations/:id
 * Get conversation details
 */
export const getConversation = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { id } = req.params;

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        take: 50,
      },
    },
  });

  if (!conversation) {
    res.status(404).json({
      error: 'Not Found',
      message: 'Conversation not found',
      code: 'CHAT_001',
    });
    return;
  }

  // Verify user is part of conversation
  if (conversation.userId1 !== req.userId && conversation.userId2 !== req.userId) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'You are not part of this conversation',
      code: 'CHAT_002',
    });
    return;
  }

  res.json({
    data: {
      id: conversation.id,
      matchId: conversation.matchId || null,
      userId1: conversation.userId1,
      userId2: conversation.userId2,
      messages: conversation.messages.map((msg) => ({
        id: msg.id,
        conversationId: msg.conversationId,
        senderId: msg.senderId,
        content: msg.content,
        read: msg.read,
        readAt: msg.readAt?.toISOString() || null,
        createdAt: msg.createdAt.toISOString(),
      })),
      lastMessageAt: conversation.lastMessageAt?.toISOString() || null,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
    },
  });
});

/**
 * GET /chat/conversations/:id/messages
 * Get messages for a conversation with pagination
 */
export const getMessages = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { id } = req.params;
  const { limit = '50', offset = '0', cursor } = req.query;

  // Verify conversation exists and user is part of it
  const conversation = await prisma.conversation.findUnique({
    where: { id },
  });

  if (!conversation) {
    res.status(404).json({
      error: 'Not Found',
      message: 'Conversation not found',
      code: 'CHAT_001',
    });
    return;
  }

  if (conversation.userId1 !== req.userId && conversation.userId2 !== req.userId) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'You are not part of this conversation',
      code: 'CHAT_002',
    });
    return;
  }

  // Build where clause for cursor-based pagination
  const where: { conversationId: string; createdAt?: { lt: Date } } = {
    conversationId: id,
  };

  if (cursor) {
    where.createdAt = { lt: new Date(cursor as string) };
  }

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string, 10),
      skip: cursor ? 0 : parseInt(offset as string, 10),
    }),
    prisma.message.count({ where: { conversationId: id } }),
  ]);

  res.json({
    data: messages.reverse().map((msg) => ({
      id: msg.id,
      conversationId: msg.conversationId,
      senderId: msg.senderId,
      content: msg.content,
      read: msg.read,
      readAt: msg.readAt?.toISOString() || null,
      createdAt: msg.createdAt.toISOString(),
    })),
    pagination: {
      total,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
      hasMore: messages.length === parseInt(limit as string, 10),
      cursor: messages.length > 0 ? messages[0].createdAt.toISOString() : null,
    },
  });
});

/**
 * POST /chat/conversations/:id/messages
 * Send a message
 */
export const sendMessage = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { id } = req.params;
  const body = sendMessageSchema.parse(req.body);

  // Verify conversation exists and user is part of it
  const conversation = await prisma.conversation.findUnique({
    where: { id },
  });

  if (!conversation) {
    res.status(404).json({
      error: 'Not Found',
      message: 'Conversation not found',
      code: 'CHAT_001',
    });
    return;
  }

  if (conversation.userId1 !== req.userId && conversation.userId2 !== req.userId) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'You are not part of this conversation',
      code: 'CHAT_002',
    });
    return;
  }

  // Create message
  const message = await prisma.message.create({
    data: {
      conversationId: id,
      senderId: req.userId,
      content: body.content,
      read: false,
    },
  });

  // Update conversation last message time
  await prisma.conversation.update({
    where: { id },
    data: {
      lastMessageAt: new Date(),
    },
  });

  // Create notification for recipient
  const recipientId = conversation.userId1 === req.userId ? conversation.userId2 : conversation.userId1;
  await prisma.notification.create({
    data: {
      userId: recipientId,
      type: 'message',
      title: 'New message',
      body: body.content.substring(0, 100),
      data: {
        conversationId: id,
        messageId: message.id,
      },
    },
  });

  res.status(201).json({
    data: {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      content: message.content,
      read: message.read,
      readAt: message.readAt?.toISOString() || null,
      createdAt: message.createdAt.toISOString(),
    },
  });
});

/**
 * PUT /chat/conversations/:id/read
 * Mark all messages in conversation as read
 */
export const markAsRead = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { id } = req.params;

  // Verify conversation exists and user is part of it
  const conversation = await prisma.conversation.findUnique({
    where: { id },
  });

  if (!conversation) {
    res.status(404).json({
      error: 'Not Found',
      message: 'Conversation not found',
      code: 'CHAT_001',
    });
    return;
  }

  if (conversation.userId1 !== req.userId && conversation.userId2 !== req.userId) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'You are not part of this conversation',
      code: 'CHAT_002',
    });
    return;
  }

  // Mark all unread messages from other user as read
  await prisma.message.updateMany({
    where: {
      conversationId: id,
      senderId: { not: req.userId },
      read: false,
    },
    data: {
      read: true,
      readAt: new Date(),
    },
  });

  res.json({
    data: {
      success: true,
    },
  });
});

