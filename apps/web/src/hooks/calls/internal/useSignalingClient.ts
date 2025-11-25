// apps/web/src/hooks/calls/internal/useSignalingClient.ts
'use client';

import { useEffect, useRef } from 'react';
import type { CallSignal, SignalingConfig } from '@petspark/core';
import { CallSignalingClient } from '@petspark/core';

export interface UseSignalingClientResult {
  readonly signalingClient: CallSignalingClient;
  readonly onSignal: (handler: (signal: CallSignal) => void | Promise<void>) => () => void;
}

export function useSignalingClient(config: SignalingConfig): UseSignalingClientResult {
  const clientRef = useRef<CallSignalingClient | null>(null);

  if (!clientRef.current) {
    clientRef.current = new CallSignalingClient(config);
    clientRef.current.connect();
  }

  const signalingClient = clientRef.current;

  useEffect(
    () => () => {
      signalingClient.disconnect();
    },
    [signalingClient]
  );

  return {
    signalingClient,
    onSignal: (handler) => {
      const syncHandler = (signal: CallSignal): void => {
        void handler(signal);
      };
      return signalingClient.onSignal(syncHandler);
    },
  };
}
