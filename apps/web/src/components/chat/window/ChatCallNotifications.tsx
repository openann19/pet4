import { MotionView } from '@petspark/motion';
import { useAnimatePresence } from '@/effects/reanimated/use-animate-presence';
import CallInterface from '@/components/call/CallInterface';
import IncomingCallNotification from '@/components/call/IncomingCallNotification';
import type { ChatRoom } from '@/lib/chat-types';
import type { Call, CallSession } from '@/lib/call-types';

interface ChatCallNotificationsProps {
  room: ChatRoom;
  incomingCall: Call | null | undefined;
  activeCall: CallSession | null | undefined;
  answerCall: () => void;
  declineCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
}

/**
 * Handles rendering of incoming and active call notifications/interface
 */
export function ChatCallNotifications({
  room,
  incomingCall,
  activeCall,
  answerCall,
  declineCall,
  endCall,
  toggleMute,
  toggleVideo,
}: ChatCallNotificationsProps) {
  const incomingCallPresence = useAnimatePresence({
    isVisible: !!(incomingCall && room.matchedPetName),
  });
  const activeCallPresence = useAnimatePresence({ isVisible: !!activeCall });

  return (
    <>
      {incomingCallPresence.shouldRender && incomingCall && room.matchedPetName && (
        <MotionView style={incomingCallPresence.animatedStyle}>
          <IncomingCallNotification
            call={incomingCall}
            callerName={room.matchedPetName ?? ''}
            {...(room.matchedPetPhoto ? { callerAvatar: room.matchedPetPhoto } : {})}
            onAccept={answerCall}
            onDecline={declineCall}
          />
        </MotionView>
      )}
      {activeCallPresence.shouldRender && activeCall && (
        <MotionView style={activeCallPresence.animatedStyle}>
          <CallInterface
            session={activeCall}
            onEndCall={endCall}
            onToggleMute={toggleMute}
            onToggleVideo={toggleVideo}
          />
        </MotionView>
      )}
    </>
  );
}

