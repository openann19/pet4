/**
 * Chat Call Overlays Component
 * Incoming call notification and active call interface overlays
 */

import { MotionView } from '@petspark/motion';
import CallInterface from '@/components/call/CallInterface';
import IncomingCallNotification from '@/components/call/IncomingCallNotification';
import type { CallSession } from '@/hooks/useCall';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';

export interface ChatCallOverlaysProps {
  incomingCall: CallSession | null;
  activeCall: CallSession | null;
  matchedPetName?: string | null;
  matchedPetPhoto?: string | null;
  incomingCallPresence: {
    shouldRender: boolean;
    animatedStyle: AnimatedStyle;
  };
  activeCallPresence: {
    shouldRender: boolean;
    animatedStyle: AnimatedStyle;
  };
  onAnswerCall: () => void;
  onDeclineCall: () => void;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
}

export function ChatCallOverlays({
  incomingCall,
  activeCall,
  matchedPetName,
  matchedPetPhoto,
  incomingCallPresence,
  activeCallPresence,
  onAnswerCall,
  onDeclineCall,
  onEndCall,
  onToggleMute,
  onToggleVideo,
}: ChatCallOverlaysProps) {
  return (
    <>
      {incomingCallPresence.shouldRender && incomingCall && matchedPetName && (
        <MotionView style={incomingCallPresence.animatedStyle}>
          <IncomingCallNotification
            call={incomingCall}
            callerName={matchedPetName ?? ''}
            {...(matchedPetPhoto ? { callerAvatar: matchedPetPhoto } : {})}
            onAccept={onAnswerCall}
            onDecline={onDeclineCall}
          />
        </MotionView>
      )}
      {activeCallPresence.shouldRender && activeCall && (
        <MotionView style={activeCallPresence.animatedStyle}>
          <CallInterface
            session={activeCall}
            onEndCall={onEndCall}
            onToggleMute={onToggleMute}
            onToggleVideo={onToggleVideo}
          />
        </MotionView>
      )}
    </>
  );
}

