/**
 * Live Stream Room
 *
 * Main streaming interface for live streaming
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Users, Heart, MessageCircle, Share2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PremiumCard } from '@/components/enhanced/PremiumCard';
import { ViewerEngagement } from './ViewerEngagement';
import { StreamAnalyticsPanel } from './StreamAnalyticsPanel';
import { PremiumFeatureGate } from '@/components/billing/PremiumFeatureGate';
import { cn } from '@/lib/utils';
import { getTypographyClasses } from '@/lib/typography';
import { useWebRTC } from '@/hooks/streaming/use-webrtc';
import { createLogger } from '@/lib/logger';

const logger = createLogger('LiveStreamRoom');

export interface LiveStreamRoomProps {
  streamId: string;
  isHost: boolean;
  onEndStream?: () => void;
  className?: string;
}

export function LiveStreamRoom({
  streamId,
  isHost,
  onEndStream,
  className,
}: LiveStreamRoomProps): React.JSX.Element {
  const [viewerCount, setViewerCount] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const { addStream, state } = useWebRTC({
    onRemoteStream: (stream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    },
    onConnectionStateChange: (state) => {
      logger.debug('Stream connection state', { state });
    },
  });

  useEffect(() => {
    if (isHost) {
      void startStreaming();
    }

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isHost]);

  const startStreaming = async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: true,
      });

      localStreamRef.current = stream;
      addStream(stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setIsLive(true);
      logger.info('Stream started', { streamId });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to start stream', err);
    }
  };

  const handleEndStream = (): void => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    setIsLive(false);
    onEndStream?.();
  };

  if (!isHost) {
    return (
      <PremiumFeatureGate requiredTier="plus">
        <div className={cn('relative w-full h-full', className)}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover rounded-lg"
          />
          <ViewerEngagement
            viewerCount={viewerCount}
            onHeart={() => {
              // Handle heart reaction
            }}
            onComment={() => {
              // Handle comment
            }}
            className="absolute bottom-4 left-4 right-4"
          />
        </div>
      </PremiumFeatureGate>
    );
  }

  return (
    <PremiumFeatureGate requiredTier="pro">
      <div className={cn('relative w-full h-full space-y-4', className)}>
        <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {isLive && (
            <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500 text-white">
              <div className="size-2 rounded-full bg-white animate-pulse" />
              <span className={cn(getTypographyClasses('caption'), 'font-semibold')}>LIVE</span>
            </div>
          )}

          <div className="absolute top-4 right-4 flex items-center gap-2">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="bg-black/50 text-white hover:bg-black/70"
            >
              <Settings className="size-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => void handleEndStream()}
              className="bg-red-500/80 text-white hover:bg-red-500"
            >
              End Stream
            </Button>
          </div>

          <div className="absolute bottom-4 left-4 flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 text-white">
              <Users className="size-4" />
              <span className={cn(getTypographyClasses('body'), 'font-medium')}>
                {viewerCount}
              </span>
            </div>
          </div>
        </div>

        {showAnalytics && isHost && (
          <StreamAnalyticsPanel
            viewerCount={viewerCount}
            streamDuration={0}
            onClose={() => setShowAnalytics(false)}
          />
        )}
      </div>
    </PremiumFeatureGate>
  );
}
