'use client';

import { useCallback, useMemo, useEffect } from 'react';
import { Phone, PhoneDisconnect, VideoCamera } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import type { Call } from '@/lib/call-types';
import { haptics } from '@/lib/haptics';
import { createLogger } from '@/lib/logger';
import { useModalAnimation, useGlowPulse, usePressBounce } from '@/effects/reanimated';
import { useAnimatedStyleValue } from '@/effects/reanimated/animated-view';
import {
  useAnimatedStyle,
  useMotionValue,
  animate,
  MotionView,
} from '@petspark/motion';

const logger = createLogger('IncomingCallNotification');

interface IncomingCallNotificationProps {
  call: Call;
  callerName: string;
  callerAvatar?: string;
  onAccept: () => void;
  onDecline: () => void;
}

interface CallActionButtonProps {
  bounce: ReturnType<typeof usePressBounce>;
  variant?: 'primary' | 'outline';
  className?: string;
  icon: React.ReactNode;
  label: string;
  ariaLabel: string;
}

function CallActionButton({
  bounce,
  variant = 'primary',
  className,
  icon,
  label,
  ariaLabel,
}: CallActionButtonProps): JSX.Element {
  const bounceStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: bounce.scale.get() }],
    };
  });

  return (
    <MotionView style={bounceStyle} className="flex-1">
      <Button
        onClick={bounce.handlePress}
        variant={variant}
        className={className}
        aria-label={ariaLabel}
      >
        {icon}
        {label}
      </Button>
    </MotionView>
  );
}

interface CallHeaderProps {
  callerName: string;
  callerAvatar?: string;
  callType: Call['type'];
  avatarAnimatedStyle: ReturnType<typeof useAnimatedStyle>;
}

function CallHeader({ callerName, callerAvatar, callType, avatarAnimatedStyle }: CallHeaderProps): JSX.Element {
  const callTypeLabel = useMemo<string>(() => {
    return callType === 'video' ? 'Incoming video call' : 'Incoming call';
  }, [callType]);

  const callTypeIcon = useMemo(() => {
    return callType === 'video' ? (
      <VideoCamera size={16} weight="fill" aria-hidden="true" />
    ) : (
      <Phone size={16} weight="fill" aria-hidden="true" />
    );
  }, [callType]);

  return (
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
  );
}

function useCallHandlers(
  call: Call,
  callerName: string,
  onAccept: () => void,
  onDecline: () => void
) {
  const handleAccept = useCallback((): void => {
    try {
      haptics.success();
      logger.info('Call accepted', { callId: call.id, callerName, callType: call.type });
      onAccept();
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to accept call', err, { callId: call.id, callerName });
      haptics.error();
    }
  }, [call.id, call.type, callerName, onAccept]);

  const handleDecline = useCallback((): void => {
    try {
      haptics.heavy();
      logger.info('Call declined', { callId: call.id, callerName, callType: call.type });
      onDecline();
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to decline call', err, { callId: call.id, callerName });
      haptics.error();
    }
  }, [call.id, call.type, callerName, onDecline]);

  const acceptBounce = usePressBounce({
    scale: 0.98,
    onPress: handleAccept,
    hapticFeedback: false,
  });

  const declineBounce = usePressBounce({
    scale: 0.98,
    onPress: handleDecline,
    hapticFeedback: false,
  });

  return { acceptBounce, declineBounce };
}

function useAvatarAnimation() {
  const avatarScale = useMotionValue(1);

  useEffect(() => {
    animate(avatarScale, 1.05, {
      duration: 1,
      repeat: Infinity,
      repeatType: 'reverse',
      ease: 'easeInOut',
    });
  }, [avatarScale]);

  const avatarAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: avatarScale.get() }],
    };
  });

  return avatarAnimatedStyle;
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
  const avatarAnimatedStyle = useAvatarAnimation();
  const { acceptBounce, declineBounce } = useCallHandlers(call, callerName, onAccept, onDecline);

  const modalStyle = useAnimatedStyleValue(modalAnimation.style);
  const glowStyle = glowPulse.animatedStyle;

  return (
    <MotionView
      style={modalStyle}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
      role="alertdialog"
      aria-labelledby="incoming-call-title"
      aria-describedby="incoming-call-description"
      aria-modal="true"
    >
      <MotionView
        style={glowStyle}
        className="glass-strong backdrop-blur-2xl rounded-3xl p-6 border border-white/30 shadow-2xl"
      >
        <CallHeader
          callerName={callerName}
          callerAvatar={callerAvatar}
          callType={call.type}
          avatarAnimatedStyle={avatarAnimatedStyle}
        />

        <div className="flex gap-3" role="group" aria-label="Call actions">
          <CallActionButton
            bounce={declineBounce}
            variant="outline"
            className="w-full h-12 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all"
            icon={<PhoneDisconnect size={20} weight="fill" className="mr-2" aria-hidden="true" />}
            label="Decline"
            ariaLabel="Decline call"
          />

          <CallActionButton
            bounce={acceptBounce}
            className="w-full h-12 bg-linear-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg"
            icon={<Phone size={20} weight="fill" className="mr-2" aria-hidden="true" />}
            label="Accept"
            ariaLabel="Accept call"
          />
        </div>
      </MotionView>
    </MotionView>
  );
}
