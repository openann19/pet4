import { Router } from 'express';
import {
  getConversations,
  getConversation,
  getMessages,
  sendMessage,
  markAsRead,
} from '../controllers/chat.js';
import { authenticate } from '../middleware/auth.js';

export const chatRouter = Router();

// All chat routes require authentication
chatRouter.use(authenticate);

// Chat routes
chatRouter.get('/conversations', getConversations);
chatRouter.get('/conversations/:id', getConversation);
chatRouter.get('/conversations/:id/messages', getMessages);
chatRouter.post('/conversations/:id/messages', sendMessage);
chatRouter.put('/conversations/:id/read', markAsRead);

