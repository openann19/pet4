// apps/web/src/hooks/calls/internal/useLocalMedia.ts
'use client';

import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';

export interface UseLocalMediaArgs {
  readonly ensurePeerConnection: () => RTCPeerConnection;
  readonly setLocalStream: Dispatch<SetStateAction<MediaStream | null>>;
}

export function useLocalMedia({ ensurePeerConnection, setLocalStream }: UseLocalMediaArgs) {
  const attachLocalStream = useCallback(
    (stream: MediaStream) => {
      setLocalStream(stream);
      const pc = ensurePeerConnection();
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
    },
    [ensurePeerConnection, setLocalStream]
  );

  const createLocalMedia = useCallback(
    async (constraints?: MediaStreamConstraints) => {
      const stream = await navigator.mediaDevices.getUserMedia(
        constraints ?? {
          audio: true,
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          },
        }
      );
      attachLocalStream(stream);
      return stream;
    },
    [attachLocalStream]
  );

  const stopLocalStream = useCallback(() => {
    setLocalStream((prev) => {
      if (prev) prev.getTracks().forEach((t) => t.stop());
      return null;
    });
  }, [setLocalStream]);

  return { attachLocalStream, createLocalMedia, stopLocalStream } as const;
}
