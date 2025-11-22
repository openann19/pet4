// apps/web/src/hooks/calls/internal/useCallSessionState.ts
'use client';

import { useCallback } from 'react';
import type { CallDirection, CallSession, CallStatus } from '@petspark/core';

export interface UseCallSessionStateArgs {
  readonly localUserId: string;
  readonly localDisplayName: string;
  readonly localAvatarUrl: string | null | undefined;
  readonly setSession: (updater: (prev: CallSession | null) => CallSession | null) => void;
  readonly setStatus: (status: CallStatus) => void;
  readonly stopLocalStream: () => void;
  readonly cleanupPeer: () => void;
}

function buildParticipantsFactory(
  localUserId: string,
  localDisplayName: string,
  localAvatarUrl: string | null | undefined
) {
  return (
    direction: CallDirection,
    remoteUserId: string,
    remoteDisplayName: string,
    remoteAvatarUrl?: string | null
  ): CallSession => ({
    id: crypto.randomUUID(),
    kind: 'direct',
    direction,
    status: 'ringing',
    localParticipant: {
      id: localUserId,
      displayName: localDisplayName,
      avatarUrl: localAvatarUrl ?? null,
      isLocal: true,
      microphone: 'enabled',
      camera: 'enabled',
    },
    remoteParticipant: {
      id: remoteUserId,
      displayName: remoteDisplayName,
      avatarUrl: remoteAvatarUrl ?? null,
      isLocal: false,
      microphone: 'enabled',
      camera: 'enabled',
    },
    startedAt: new Date().toISOString(),
  });
}

function resetSessionFactory(
  setSession: (updater: (prev: CallSession | null) => CallSession | null) => void,
  setStatus: (status: CallStatus) => void,
  stopLocalStream: () => void,
  cleanupPeer: () => void
) {
  return (reason?: string) => {
    stopLocalStream();
    cleanupPeer();
    setSession((prev) =>
      prev
        ? {
            ...prev,
            status: reason ? 'failed' : 'ended',
            endedAt: new Date().toISOString(),
            failureReason: reason ?? prev.failureReason,
          }
        : null
    );
    setStatus(reason ? 'failed' : 'ended');
  };
}

export function useCallSessionState({
  localUserId,
  localDisplayName,
  localAvatarUrl,
  setSession,
  setStatus,
  stopLocalStream,
  cleanupPeer,
}: UseCallSessionStateArgs) {
  const buildSessionParticipants = useCallback(
    buildParticipantsFactory(localUserId, localDisplayName, localAvatarUrl),
    [localUserId, localDisplayName, localAvatarUrl]
  );

  const resetSession = useCallback(
    resetSessionFactory(setSession, setStatus, stopLocalStream, cleanupPeer),
    [setSession, setStatus, stopLocalStream, cleanupPeer]
  );

  return { buildSessionParticipants, resetSession } as const;
}
