'use client';;
import { useCallback, useMemo } from 'react';
import { Phone, PhoneDisconnect, VideoCamera } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import type { Call } from '@/lib/call-types';
import { haptics } from '@/lib/haptics';
import { createLogger } from '@/lib/logger';
import { useModalAnimation, useGlowPulse, useBounceOnTap } from '@/effects/reanimated';
import {
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  MotionView,
  type AnimatedStyle,
} from '@petspark/motion';
import { useEffect } from 'react';


const logger = createLogger('IncomingCallNotification');

interface IncomingCallNotificationProps {
  call: Call;
  callerName: string;
  callerAvatar?: string;
  onAccept: () => void;
  onDecline: () => void;
}

export default function IncomingCallNotification({
  call,
  callerName,
  callerAvatar,
  onAccept,
  onDecline,
}: IncomingCallNotificationProps): JSX.Element {
  const modalAnimation = useModalAnimation({ isVisible: true, duration: 300 });
  const glowPulse = useGlowPulse({ duration: 1500, intensity: 0.4, enabled: true });

  const avatarScale = useSharedValue(1);

  const handleAccept = useCallback((): void => {
    try {
      haptics.success();
      logger.info('Call accepted', { callId: call.id, callerName, callType: call.type });
      onAccept();
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to accept call', err, { callId: call.id, callerName });
      haptics.error();
    }
  }, [call.id, call.type, callerName, onAccept]);

  const handleDecline = useCallback((): void => {
    try {
      haptics.heavy();
      logger.info('Call declined', { callId: call.id, callerName, callType: call.type });
      onDecline();
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to decline call', err, { callId: call.id, callerName });
      haptics.error();
    }
  }, [call.id, call.type, callerName, onDecline]);

  const acceptBounce = useBounceOnTap({
    scale: 0.98,
    onPress: handleAccept,
    hapticFeedback: false,
  });

  const declineBounce = useBounceOnTap({
    scale: 0.98,
    onPress: handleDecline,
    hapticFeedback: false,
  });

  useEffect(() => {
    avatarScale.value = withRepeat(
      withSequence(withTiming(1.05, { duration: 1000 }), withTiming(1, { duration: 1000 })),
      -1,
      true
    );
  }, [avatarScale]);

  const avatarAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: avatarScale.value }],
    };
  }) as AnimatedStyle;

  const callTypeLabel = useMemo<string>(() => {
    return call.type === 'video' ? 'Incoming video call' : 'Incoming call';
  }, [call.type]);

  const callTypeIcon = useMemo(() => {
    return call.type === 'video' ? (
      <VideoCamera size={16} weight="fill" aria-hidden="true" />
    ) : (
      <Phone size={16} weight="fill" aria-hidden="true" />
    );
  }, [call.type]);

  return (
    <MotionView
      style={modalAnimation.style}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
      role="alertdialog"
      aria-labelledby="incoming-call-title"
      aria-describedby="incoming-call-description"
      aria-modal="true"
    >
      <MotionView
        style={glowPulse.animatedStyle}
        className="glass-strong backdrop-blur-2xl rounded-3xl p-6 border border-white/30 shadow-2xl"
      >
        <div className="flex items-center gap-4 mb-6">
            <MotionView style={avatarAnimatedStyle}>
            <Avatar className="w-16 h-16 ring-4 ring-primary/30">
              <AvatarImage src={callerAvatar} alt={callerName} />
              <AvatarFallback className="bg-linear-to-br from-primary to-accent text-white text-2xl font-bold">
                {callerName[0] ?? '?'}
              </AvatarFallback>
            </Avatar>
          </MotionView>

          <div className="flex-1">
            <h3 id="incoming-call-title" className="font-bold text-lg text-foreground">
              {callerName}
            </h3>
            <div
              id="incoming-call-description"
              className="flex items-center gap-2 text-sm text-muted-foreground"
              role="status"
              aria-live="polite"
            >
              {callTypeIcon}
              <span>{callTypeLabel}...</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3" role="group" aria-label="Call actions">
          <MotionView variants={declineBounce.variants} initial="rest" animate="rest" whileTap="tap" className="flex-1">
            <Button
              onClick={declineBounce.handlePress}
              variant="outline"
              className="w-full h-12 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all"
              aria-label="Decline call"
            >
              <PhoneDisconnect size={20} weight="fill" className="mr-2" aria-hidden="true" />
              Decline
            </Button>
          </MotionView>

          <MotionView variants={acceptBounce.variants} initial="rest" animate="rest" whileTap="tap" className="flex-1">
            <Button
              onClick={acceptBounce.handlePress}
              className="w-full h-12 bg-linear-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg"
              aria-label="Accept call"
            >
              <Phone size={20} weight="fill" className="mr-2" aria-hidden="true" />
              Accept
            </Button>
          </MotionView>
        </div>
      </MotionView>
    </MotionView>
  );
}
