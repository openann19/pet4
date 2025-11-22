/**
 * Call Routes
 *
 * Backend routes for call signaling and session management
 */

import { Router } from 'express';
import { callController } from '../controllers/calls.js';
import { authenticate } from '../middleware/auth.js';

const router: Router = Router();

// All call routes require authentication
router.use(authenticate);

// Create call session
router.post('/session', callController.createSession);

// Join call session
router.post('/session/:sessionId/join', callController.joinSession);

// Leave call session
router.post('/session/:sessionId/leave', callController.leaveSession);

// Get call session
router.get('/session/:sessionId', callController.getSession);

// WebRTC signaling endpoints
router.post('/offer', callController.handleOffer);
router.post('/answer', callController.handleAnswer);
router.post('/candidate', callController.handleCandidate);
router.post('/end', callController.handleEnd);
router.post('/reject', callController.handleReject);

export { router as callsRouter };

