/**
 * usePresence Hook
 *
 * Shared hook for managing user presence in conversations
 */

import { useState, useCallback, useEffect } from 'react';

export interface PresenceState {
  userId: string;
  isOnline: boolean;
  lastSeenAt: string | null;
  isTyping?: boolean;
}

export interface UsePresenceOptions {
  conversationId: string;
  userIds: string[];
  currentUserId: string;
  onPresenceUpdate?: (userId: string, state: PresenceState) => void;
}

export interface UsePresenceResult {
  presence: Record<string, PresenceState>;
  updatePresence: (userId: string, state: Partial<PresenceState>) => void;
  refresh: () => Promise<void>;
}

export function usePresence({
  conversationId,
  userIds,
  currentUserId,
  onPresenceUpdate,
}: UsePresenceOptions): UsePresenceResult {
  const [presence, setPresence] = useState<Record<string, PresenceState>>({});

  const updatePresence = useCallback(
    (userId: string, state: Partial<PresenceState>) => {
      setPresence((prev) => {
        const current = prev[userId] ?? {
          userId,
          isOnline: false,
          lastSeenAt: null,
        };
        const updated = { ...current, ...state };
        onPresenceUpdate?.(userId, updated);
        return { ...prev, [userId]: updated };
      });
    },
    [onPresenceUpdate]
  );

  const refresh = useCallback(async () => {
    // In a real implementation, this would fetch presence from API
    const initialPresence: Record<string, PresenceState> = {};
    for (const userId of userIds) {
      initialPresence[userId] = {
        userId,
        isOnline: userId === currentUserId,
        lastSeenAt: userId === currentUserId ? null : new Date().toISOString(),
      };
    }
    setPresence(initialPresence);
  }, [userIds, currentUserId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    presence,
    updatePresence,
    refresh,
  };
}

