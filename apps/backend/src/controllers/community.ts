import { Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/error-handler.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();

// Validation schemas
const createPostSchema = z.object({
  content: z.string().min(1).max(5000),
  photos: z.array(z.string().url()).optional(),
});

const createCommentSchema = z.object({
  content: z.string().min(1).max(1000),
});

/**
 * GET /community/posts
 * Get community posts
 */
export const getPosts = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { limit = '20', offset = '0' } = req.query;

  const [posts, total] = await Promise.all([
    prisma.communityPost.findMany({
      include: {
        comments: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string, 10),
      skip: parseInt(offset as string, 10),
    }),
    prisma.communityPost.count(),
  ]);

  res.json({
    data: posts.map((post) => ({
      id: post.id,
      authorId: post.authorId,
      content: post.content,
      photos: (post.photos as string[]) || [],
      likes: post.likes,
      comments: post.comments.map((comment) => ({
        id: comment.id,
        authorId: comment.authorId,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
      })),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    })),
    pagination: {
      total,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    },
  });
});

/**
 * POST /community/posts
 * Create a community post
 */
export const createPost = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const body = createPostSchema.parse(req.body);

  const post = await prisma.communityPost.create({
    data: {
      authorId: req.userId,
      content: body.content,
      photos: body.photos || [],
      likes: 0,
    },
  });

  res.status(201).json({
    data: {
      id: post.id,
      authorId: post.authorId,
      content: post.content,
      photos: (post.photos as string[]) || [],
      likes: post.likes,
      comments: [],
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    },
  });
});

/**
 * GET /community/posts/:id
 * Get a specific post
 */
export const getPost = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { id } = req.params;

  const post = await prisma.communityPost.findUnique({
    where: { id },
    include: {
      comments: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!post) {
    res.status(404).json({
      error: 'Not Found',
      message: 'Post not found',
      code: 'COMM_001',
    });
    return;
  }

  res.json({
    data: {
      id: post.id,
      authorId: post.authorId,
      content: post.content,
      photos: (post.photos as string[]) || [],
      likes: post.likes,
      comments: post.comments.map((comment) => ({
        id: comment.id,
        authorId: comment.authorId,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
      })),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    },
  });
});

/**
 * POST /community/posts/:id/like
 * Like a post
 */
export const likePost = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { id } = req.params;

  const post = await prisma.communityPost.findUnique({
    where: { id },
  });

  if (!post) {
    res.status(404).json({
      error: 'Not Found',
      message: 'Post not found',
      code: 'COMM_001',
    });
    return;
  }

  // Increment likes
  const updated = await prisma.communityPost.update({
    where: { id },
    data: {
      likes: { increment: 1 },
    },
  });

  res.json({
    data: {
      id: updated.id,
      likes: updated.likes,
    },
  });
});

/**
 * POST /community/posts/:postId/comments
 * Add a comment to a post
 */
export const createComment = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { postId } = req.params;
  const body = createCommentSchema.parse(req.body);

  // Verify post exists
  const post = await prisma.communityPost.findUnique({
    where: { id: postId },
  });

  if (!post) {
    res.status(404).json({
      error: 'Not Found',
      message: 'Post not found',
      code: 'COMM_001',
    });
    return;
  }

  const comment = await prisma.communityComment.create({
    data: {
      postId,
      authorId: req.userId,
      content: body.content,
    },
  });

  res.status(201).json({
    data: {
      id: comment.id,
      postId: comment.postId,
      authorId: comment.authorId,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
    },
  });
});

