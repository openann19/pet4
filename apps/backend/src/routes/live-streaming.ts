import { Router } from 'express';
import {
  createRoom,
  endRoom,
  getActiveStreams,
  getStream,
  joinStream,
  leaveStream,
  reactToStream,
  sendStreamChat,
  getStreamChat,
} from '../controllers/live-streaming.js';
import { authenticate } from '../middleware/auth.js';

export const liveStreamingRouter: Router = Router();

// All live streaming routes require authentication
liveStreamingRouter.use(authenticate);

// Live streaming routes
liveStreamingRouter.post('/createRoom', createRoom);
liveStreamingRouter.post('/endRoom', endRoom);
liveStreamingRouter.get('/active', getActiveStreams);
liveStreamingRouter.get('/:id', getStream);
liveStreamingRouter.post('/:id/join', joinStream);
liveStreamingRouter.post('/:id/leave', leaveStream);
liveStreamingRouter.post('/:id/react', reactToStream);
liveStreamingRouter.post('/:id/chat', sendStreamChat);
liveStreamingRouter.get('/:id/chat', getStreamChat);

