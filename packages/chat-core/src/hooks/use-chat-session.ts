/**
 * useChatSession Hook
 *
 * Shared hook for managing chat session state
 */

import { useState, useCallback, useEffect } from 'react';

export interface ChatSession {
  conversationId: string;
  participants: ChatParticipant[];
  isActive: boolean;
  lastActivityAt: string;
}

export interface ChatParticipant {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  isOnline?: boolean;
  lastSeenAt?: string;
}

export interface UseChatSessionOptions {
  conversationId: string;
  currentUserId: string;
  onSessionUpdate?: (session: ChatSession) => void;
}

export interface UseChatSessionResult {
  session: ChatSession | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useChatSession({
  conversationId,
  currentUserId,
  onSessionUpdate,
}: UseChatSessionOptions): UseChatSessionResult {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      // In a real implementation, this would fetch from API
      // For now, return a mock session
      const mockSession: ChatSession = {
        conversationId,
        participants: [
          {
            id: currentUserId,
            displayName: 'You',
            isOnline: true,
          },
        ],
        isActive: true,
        lastActivityAt: new Date().toISOString(),
      };
      setSession(mockSession);
      onSessionUpdate?.(mockSession);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, currentUserId, onSessionUpdate]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    session,
    isLoading,
    error,
    refresh,
  };
}

