/**
 * Call Controller
 *
 * Handles call signaling and session management
 */

import type { Request, Response } from 'express';
import { createLogger } from '../utils/logger';

const logger = createLogger('CallController');

interface CallSession {
  id: string;
  callId: string;
  kind: 'direct' | 'group';
  participantIds: string[];
  createdAt: string;
}

const sessions = new Map<string, CallSession>();

export const callController = {
  createSession: async (req: Request, res: Response): Promise<void> => {
    try {
      const { callId, kind, participantIds } = req.body;
      const userId = (req as { user?: { id: string } }).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!callId || !kind || !Array.isArray(participantIds)) {
        res.status(400).json({ error: 'Invalid request body' });
        return;
      }

      const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      const session: CallSession = {
        id: sessionId,
        callId,
        kind,
        participantIds: [...new Set([userId, ...participantIds])],
        createdAt: new Date().toISOString(),
      };

      sessions.set(sessionId, session);

      logger.info('Call session created', { sessionId, callId, kind, participantIds });

      res.status(201).json({
        sessionId,
        callId,
        kind,
        participants: session.participantIds.map((id) => ({
          id,
          displayName: `User ${id}`,
          isLocal: id === userId,
        })),
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to create call session', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  joinSession: async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.params;
      const userId = (req as { user?: { id: string } }).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const session = sessions.get(sessionId);
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      if (!session.participantIds.includes(userId)) {
        session.participantIds.push(userId);
      }

      logger.info('User joined call session', { sessionId, userId });

      res.status(200).json({
        sessionId,
        callId: session.callId,
        participants: session.participantIds.map((id) => ({
          id,
          displayName: `User ${id}`,
          isLocal: id === userId,
        })),
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to join call session', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  leaveSession: async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.params;
      const userId = (req as { user?: { id: string } }).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const session = sessions.get(sessionId);
      if (session) {
        session.participantIds = session.participantIds.filter((id) => id !== userId);
        if (session.participantIds.length === 0) {
          sessions.delete(sessionId);
        }
      }

      logger.info('User left call session', { sessionId, userId });

      res.status(200).json({ success: true });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to leave call session', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  getSession: async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.params;
      const userId = (req as { user?: { id: string } }).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const session = sessions.get(sessionId);
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      res.status(200).json({
        sessionId,
        callId: session.callId,
        kind: session.kind,
        participants: session.participantIds.map((id) => ({
          id,
          displayName: `User ${id}`,
          isLocal: id === userId,
        })),
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get call session', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  handleOffer: async (req: Request, res: Response): Promise<void> => {
    try {
      const { callId, fromUserId, toUserId, sdp } = req.body;
      logger.debug('Call offer received', { callId, fromUserId, toUserId });
      // In a real implementation, this would forward the offer via WebSocket
      res.status(200).json({ success: true });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to handle offer', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  handleAnswer: async (req: Request, res: Response): Promise<void> => {
    try {
      const { callId, fromUserId, toUserId, sdp } = req.body;
      logger.debug('Call answer received', { callId, fromUserId, toUserId });
      // In a real implementation, this would forward the answer via WebSocket
      res.status(200).json({ success: true });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to handle answer', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  handleCandidate: async (req: Request, res: Response): Promise<void> => {
    try {
      const { callId, fromUserId, toUserId, candidate } = req.body;
      logger.debug('ICE candidate received', { callId, fromUserId, toUserId });
      // In a real implementation, this would forward the candidate via WebSocket
      res.status(200).json({ success: true });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to handle candidate', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  handleEnd: async (req: Request, res: Response): Promise<void> => {
    try {
      const { callId, fromUserId, toUserId, reason } = req.body;
      logger.info('Call ended', { callId, fromUserId, toUserId, reason });
      // In a real implementation, this would notify participants via WebSocket
      res.status(200).json({ success: true });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to handle end', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  handleReject: async (req: Request, res: Response): Promise<void> => {
    try {
      const { callId, fromUserId, toUserId, reason } = req.body;
      logger.info('Call rejected', { callId, fromUserId, toUserId, reason });
      // In a real implementation, this would notify the caller via WebSocket
      res.status(200).json({ success: true });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to handle reject', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};

