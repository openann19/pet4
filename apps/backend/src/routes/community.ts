import { Router } from 'express';
import {
  getPosts,
  createPost,
  getPost,
  likePost,
  createComment,
} from '../controllers/community.js';
import { authenticate } from '../middleware/auth.js';

export const communityRouter = Router();

// All community routes require authentication
communityRouter.use(authenticate);

// Community routes
communityRouter.get('/posts', getPosts);
communityRouter.post('/posts', createPost);
communityRouter.get('/posts/:id', getPost);
communityRouter.post('/posts/:id/like', likePost);
communityRouter.post('/posts/:postId/comments', createComment);

