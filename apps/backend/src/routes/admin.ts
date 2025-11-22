import { Router } from 'express';
import {
  getDashboard,
  getUsers,
  getUser,
  resetUserPassword,
  getModeration,
  getAnalytics,
  getSettings,
  broadcastMessage,
  getSupportTickets,
  getSupportTicket,
  getTicketMessages,
  updateTicketStatus,
  assignTicket,
  getSupportStats,
  getAuditLogs,
  createAuditLog,
} from '../controllers/admin.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';

export const adminRouter: Router = Router();

// All admin routes require authentication and admin role
adminRouter.use(authenticate);
adminRouter.use(requireAdmin);

// Admin routes
adminRouter.get('/dashboard', getDashboard);
adminRouter.get('/users', getUsers);
adminRouter.get('/users/:id', getUser);
adminRouter.post('/users/:userId/reset-password', resetUserPassword);
adminRouter.get('/moderation', getModeration);
adminRouter.get('/analytics', getAnalytics);
adminRouter.get('/settings', getSettings);
adminRouter.post('/config/broadcast', broadcastMessage);
adminRouter.get('/support/tickets', getSupportTickets);
adminRouter.get('/support/tickets/:id', getSupportTicket);
adminRouter.get('/support/tickets/:id/messages', getTicketMessages);
adminRouter.put('/support/tickets/:id/status', updateTicketStatus);
adminRouter.put('/support/tickets/:id/assign', assignTicket);
adminRouter.get('/support/stats', getSupportStats);
adminRouter.get('/audit-logs', getAuditLogs);
adminRouter.post('/audit-logs', createAuditLog);

// Note: Moderation tasks routes are in separate router at /admin/moderation

