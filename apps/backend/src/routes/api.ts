import { Router, type Request, type Response } from 'express';
import { authRouter } from './auth.js';
import { usersRouter } from './users.js';
import { petsRouter } from './pets.js';
import { uploadsRouter } from './uploads.js';
import { matchingRouter } from './matching.js';
import { chatRouter } from './chat.js';
import { notificationsRouter } from './notifications.js';
import { communityRouter } from './community.js';
import { adoptionRouter } from './adoption.js';
import { paymentsRouter } from './payments.js';
import { kycRouter } from './kyc.js';
import { blockingRouter } from './blocking.js';
import { lostFoundRouter } from './lost-found.js';
import { liveStreamingRouter } from './live-streaming.js';
import { adminRouter } from './admin.js';
import { moderationTasksRouter } from './moderation-tasks.js';
import { photosRouter } from './photos.js';
import { eventsRouter } from './events.js';
import { syncRouter } from './sync.js';
import { callsRouter } from './calls.js';

export const apiRouter: Router = Router();

// API routes
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/pets', petsRouter);
apiRouter.use('/uploads', uploadsRouter);
apiRouter.use('/matching', matchingRouter);
apiRouter.use('/chat', chatRouter);
apiRouter.use('/notifications', notificationsRouter);
apiRouter.use('/community', communityRouter);
apiRouter.use('/adoption', adoptionRouter);
apiRouter.use('/payments', paymentsRouter);
apiRouter.use('/kyc', kycRouter);
apiRouter.use('/blocking', blockingRouter);
apiRouter.use('/alerts', lostFoundRouter);
apiRouter.use('/live', liveStreamingRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/admin/moderation', moderationTasksRouter);
apiRouter.use('/photos', photosRouter);
apiRouter.use('/events', eventsRouter);
apiRouter.use('/sync', syncRouter);
apiRouter.use('/calls', callsRouter);

// Placeholder endpoint
apiRouter.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'PetSpark API',
    version: process.env['API_VERSION'] || 'v1',
    status: 'operational',
    endpoints: {
      auth: '/auth',
      users: '/users',
      pets: '/pets',
      uploads: '/uploads',
      matching: '/matching',
      chat: '/chat',
      notifications: '/notifications',
      community: '/community',
      adoption: '/adoption',
      payments: '/payments',
      kyc: '/kyc',
      blocking: '/blocking',
      alerts: '/alerts',
      live: '/live',
      admin: '/admin',
      photos: '/photos',
      events: '/events',
      sync: '/sync',
      // Add more as implemented
    },
  });
});

