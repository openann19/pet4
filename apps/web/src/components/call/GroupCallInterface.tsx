'use client';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  PhoneDisconnect,
  Microphone,
  MicrophoneSlash,
  VideoCamera,
  VideoCameraSlash,
  GridFour,
  UserFocus,
  Sidebar,
  ArrowsOut,
  ArrowsIn,
  Users,
  Hand,
  ChatCircle,
  ShareNetwork,
} from '@phosphor-icons/react';
import { isTruthy } from '@petspark/shared';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBounceOnTap, useHoverLift, useModalAnimation } from '@/effects/reanimated';
import {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
  Extrapolation,
  MotionView,
} from '@petspark/motion';
import type { GroupCallSession, CallParticipant } from '@/lib/call-types';
import { formatCallDuration } from '@/lib/call-utils';
import { haptics } from '@/lib/haptics';
import { createLogger } from '@/lib/logger';
import { cn } from '@/lib/utils';

const logger = createLogger('GroupCallInterface');

export interface GroupCallInterfaceProps {
  session: GroupCallSession;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleLayout?: () => void;
  onInviteParticipants?: () => void;
}

interface ParticipantVideoProps {
  participant: CallParticipant;
  streamId: string;
  stream?: MediaStream;
  isVideoCall: boolean;
  isRaised: boolean;
  isSpotlight: boolean;
  onVideoRef: (streamId: string, element: HTMLVideoElement | null) => void;
}

function ParticipantVideo({
  participant,
  streamId,
  stream,
  isVideoCall,
  isRaised,
  isSpotlight,
  onVideoRef,
}: ParticipantVideoProps): JSX.Element {
  const hoverLift = useHoverLift();
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (isTruthy(isRaised)) {
      pulseScale.value = withRepeat(
        withSequence(withTiming(1.1, { duration: 500 }), withTiming(1, { duration: 500 })),
        -1,
        true
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 200 });
    }
  }, [isRaised, pulseScale]);

  const pulseStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseScale.value }],
    };
  });

  return (
    <MotionView
      variants={hoverLift.variants}
      initial="rest"
      whileHover="hover"
      className={cn(
        'relative rounded-2xl overflow-hidden bg-linear-to-br from-primary/20 to-accent/20',
        isSpotlight ? 'col-span-full row-span-2' : ''
      )}
      role="article"
      aria-label={`Participant ${String(participant.name ?? '')}`}
    >
      {isVideoCall && participant.isVideoEnabled && stream ? (
        <video
          ref={(el) => onVideoRef(streamId, el)}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
          aria-label={`Video stream for ${String(participant.name ?? '')}`}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Avatar className="w-24 h-24 ring-4 ring-white/30">
            <AvatarImage src={participant.avatar} alt={participant.name} />
            <AvatarFallback className="bg-linear-to-br from-primary to-accent text-white text-3xl font-bold">
              {participant.name[0]}
            </AvatarFallback>
          </Avatar>
        </div>
      )}
      <div className="absolute inset-0 bg-linear-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />
      <div className="absolute top-3 left-3 flex flex-col gap-2">
        <div className="glass-strong backdrop-blur-xl px-3 py-1.5 rounded-full">
          <p className="text-white font-semibold text-sm">{participant.name}</p>
          {participant.petName && <p className="text-white/70 text-xs">{participant.petName}</p>}
        </div>
        {isRaised && (
          <MotionView
            style={pulseStyle}
            className="glass-strong backdrop-blur-xl px-2 py-1 rounded-full flex items-center gap-1"
            role="status"
            aria-label="Hand raised"
          >
            <Hand size={16} weight="fill" className="text-yellow-400" aria-hidden="true" />
            <span className="text-white text-xs">Raised hand</span>
          </MotionView>
        )}
      </div>
      <div className="absolute bottom-3 right-3 flex items-center gap-2">
        {participant.isMuted && (
          <div
            className="glass-strong backdrop-blur-xl p-2 rounded-full"
            role="status"
            aria-label="Muted"
          >
            <MicrophoneSlash size={16} weight="fill" className="text-red-400" aria-hidden="true" />
          </div>
        )}
        {!participant.isVideoEnabled && isVideoCall && (
          <div
            className="glass-strong backdrop-blur-xl p-2 rounded-full"
            role="status"
            aria-label="Video disabled"
          >
            <VideoCameraSlash size={16} weight="fill" className="text-red-400" aria-hidden="true" />
          </div>
        )}
        {participant.isSpeaking && <SpeakingIndicator />}
      </div>
    </MotionView>
  );
}

function SpeakingIndicator(): JSX.Element {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(withTiming(1.2, { duration: 500 }), withTiming(1, { duration: 500 })),
      -1,
      true
    );
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => {
    const scaleValue = interpolate(scale.value, [1, 1.2], [1, 1.2], Extrapolation.CLAMP);
    return {
      transform: [{ scale: scaleValue }],
    };
  });

  return (
    <MotionView
      style={animatedStyle}
      className="w-2 h-2 bg-green-400 rounded-full"
      role="status"
      aria-label="Speaking"
    />
  );
}

export default function GroupCallInterface({
  session,
  onEndCall,
  onToggleMute,
  onToggleVideo,
  onToggleLayout,
  onInviteParticipants,
}: GroupCallInterfaceProps): JSX.Element {
  const [duration, setDuration] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showParticipants, setShowParticipants] = useState<boolean>(false);
  const [raisedHands, setRaisedHands] = useState<Set<string>>(new Set());
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const modalAnimation = useModalAnimation({ isVisible: true });

  const isVideoCall = useMemo<boolean>(() => session.call.type === 'video', [session.call.type]);
  const isActive = useMemo<boolean>(() => session.call.status === 'active', [session.call.status]);

  const participantsArray = useMemo<CallParticipant[]>(() => {
    return Array.isArray(session.participants)
      ? session.participants
      : Array.from(session.participants.values());
  }, [session.participants]);

  const totalParticipants = useMemo<number>(
    () => participantsArray.length + 1,
    [participantsArray.length]
  );

  const getGridLayout = useCallback((): string => {
    if (totalParticipants <= 2) return 'grid-cols-1';
    if (totalParticipants <= 4) return 'grid-cols-2';
    if (totalParticipants <= 9) return 'grid-cols-3';
    return 'grid-cols-4';
  }, [totalParticipants]);

  useEffect(() => {
    if (isTruthy(isActive)) {
      durationIntervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    };
  }, [isActive]);

  useEffect(() => {
    if (localVideoRef.current && session.localStream) {
      try {
        localVideoRef.current.srcObject = session.localStream;
        logger.info('Local video stream attached', { participantId: session.localParticipant.id });
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to attach local video stream', err, {
          participantId: session.localParticipant.id,
        });
      }
    }
  }, [session.localStream, session.localParticipant.id]);

  useEffect(() => {
    session.streams.forEach((stream, participantId) => {
      const videoElement = videoRefs.current.get(participantId);
      if (videoElement) {
        try {
          videoElement.srcObject = stream;
          logger.info('Remote video stream attached', { participantId });
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          logger.error('Failed to attach remote video stream', err, { participantId });
        }
      }
    });
  }, [session.streams]);

  const handleVideoRef = useCallback((streamId: string, element: HTMLVideoElement | null): void => {
    if (element) {
      videoRefs.current.set(streamId, element);
    } else {
      videoRefs.current.delete(streamId);
    }
  }, []);

  const handleToggleMute = useCallback((): void => {
    try {
      haptics.trigger('selection');
      onToggleMute();
      logger.info('Mute toggled', {
        participantId: session.localParticipant.id,
        isMuted: !session.localParticipant.isMuted,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to toggle mute', err, { participantId: session.localParticipant.id });
    }
  }, [onToggleMute, session.localParticipant.id, session.localParticipant.isMuted]);

  const handleToggleVideo = useCallback((): void => {
    try {
      haptics.trigger('selection');
      onToggleVideo();
      logger.info('Video toggled', {
        participantId: session.localParticipant.id,
        isVideoEnabled: !session.localParticipant.isVideoEnabled,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to toggle video', err, { participantId: session.localParticipant.id });
    }
  }, [onToggleVideo, session.localParticipant.id, session.localParticipant.isVideoEnabled]);

  const handleEndCall = useCallback((): void => {
    try {
      haptics.trigger('heavy');
      logger.info('Call ended', {
        callId: session.call.id,
        duration,
        participantCount: totalParticipants,
      });
      onEndCall();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to end call', err, { callId: session.call.id });
    }
  }, [onEndCall, session.call.id, duration, totalParticipants]);

  const handleToggleFullscreen = useCallback((): void => {
    try {
      setIsFullscreen((prev) => {
        const newValue = !prev;
        logger.info('Fullscreen toggled', { isFullscreen: newValue });
        return newValue;
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to toggle fullscreen', err);
    }
  }, []);

  const handleToggleLayout = useCallback((): void => {
    try {
      haptics.trigger('selection');
      onToggleLayout?.();
      logger.info('Layout toggled', {
        currentLayout: session.layout,
        callId: session.call.id,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to toggle layout', err, { callId: session.call.id });
    }
  }, [onToggleLayout, session.layout, session.call.id]);

  const handleRaiseHand = useCallback((): void => {
    try {
      haptics.trigger('selection');
      setRaisedHands((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(session.localParticipant.id)) {
          newSet.delete(session.localParticipant.id);
          logger.info('Hand lowered', { participantId: session.localParticipant.id });
        } else {
          newSet.add(session.localParticipant.id);
          logger.info('Hand raised', { participantId: session.localParticipant.id });
        }
        return newSet;
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to toggle hand raise', err, {
        participantId: session.localParticipant.id,
      });
    }
  }, [session.localParticipant.id]);

  const handleToggleParticipants = useCallback((): void => {
    setShowParticipants((prev) => !prev);
  }, []);

  const handleInviteParticipants = useCallback((): void => {
    try {
      onInviteParticipants?.();
      logger.info('Invite participants triggered', { callId: session.call.id });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to invite participants', err, { callId: session.call.id });
    }
  }, [onInviteParticipants, session.call.id]);

  const statusIndicator = useMemo(() => {
    if (isTruthy(isActive)) {
      return (
        <>
          <ActiveIndicator />
          <span className="text-muted-foreground font-medium">{formatCallDuration(duration)}</span>
        </>
      );
    }
    return (
      <>
        <ConnectingIndicator />
        <span className="text-muted-foreground">
          {session.call.status === 'ringing' ? 'Ringing...' : 'Connecting...'}
        </span>
      </>
    );
  }, [isActive, duration, session.call.status]);

  const isLocalHandRaised = useMemo<boolean>(
    () => raisedHands.has(session.localParticipant.id),
    [raisedHands, session.localParticipant.id]
  );

  const muteButton = useBounceOnTap({
    onPress: handleToggleMute,
    hapticFeedback: true,
  });

  const videoButton = useBounceOnTap({
    onPress: handleToggleVideo,
    hapticFeedback: true,
  });

  const endCallButton = useBounceOnTap({
    onPress: handleEndCall,
    hapticFeedback: true,
    scale: 0.9,
  });

  const raiseHandButton = useBounceOnTap({
    scale: 0.95,
    hapticFeedback: false,
  });
  const chatButton = useBounceOnTap({
    onPress: handleRaiseHand,
    hapticFeedback: true,
  });

  return (
    <MotionView
      style={modalAnimation.style}
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        isFullscreen ? 'bg-background' : 'bg-background/95 backdrop-blur-xl p-4'
      )}
      role="dialog"
      aria-label="Group call interface"
      aria-modal="true"
    >
      <MotionView
        className={cn(
          'relative w-full bg-linear-to-br from-card via-card to-card/80 rounded-3xl overflow-hidden shadow-2xl border border-border/50',
          isFullscreen ? 'h-full' : 'max-w-7xl h-[90vh]'
        )}
      >
        <div className="absolute top-0 left-0 right-0 z-20 glass-strong backdrop-blur-2xl border-b border-border/50">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Users size={24} weight="fill" className="text-primary" aria-hidden="true" />
                <div>
                  <h1 className="font-bold text-foreground text-lg">
                    {session.call.title || 'Playdate Video Call'}
                  </h1>
                  <div className="flex items-center gap-2 text-sm" role="status" aria-live="polite">
                    {statusIndicator}
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">{totalParticipants} participants</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="gap-2"
                aria-label={`Call quality: ${session.call.quality}`}
              >
                <div
                  className={cn(
                    'w-2 h-2 rounded-full',
                    session.call.quality === 'excellent'
                      ? 'bg-green-500'
                      : session.call.quality === 'good'
                        ? 'bg-blue-500'
                        : session.call.quality === 'fair'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                  )}
                  aria-hidden="true"
                />
                <span className="capitalize">{session.call.quality}</span>
              </Badge>

              {isVideoCall && (
                <Button
                  onClick={handleToggleLayout}
                  size="icon"
                  variant="ghost"
                  className="rounded-full"
                  aria-label={`Toggle layout: ${String(session.layout ?? '')}`}
                >
                  {session.layout === 'grid' ? (
                    <GridFour size={20} weight="fill" aria-hidden="true" />
                  ) : session.layout === 'spotlight' ? (
                    <UserFocus size={20} weight="fill" aria-hidden="true" />
                  ) : (
                    <Sidebar size={20} weight="fill" aria-hidden="true" />
                  )}
                </Button>
              )}

              <Button
                onClick={handleToggleParticipants}
                size="icon"
                variant="ghost"
                className="rounded-full"
                aria-label={showParticipants ? 'Hide participants' : 'Show participants'}
                aria-expanded={showParticipants}
              >
                <Users size={20} weight="fill" aria-hidden="true" />
              </Button>

              <Button
                onClick={handleToggleFullscreen}
                size="icon"
                variant="ghost"
                className="rounded-full"
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullscreen ? (
                  <ArrowsIn size={20} aria-hidden="true" />
                ) : (
                  <ArrowsOut size={20} aria-hidden="true" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="absolute top-20 bottom-24 left-0 right-0 p-6 overflow-hidden">
          <div
            className={cn(
              'grid gap-4 h-full',
              session.layout === 'grid' ? getGridLayout() : '',
              session.layout === 'spotlight' ? 'grid-cols-1' : '',
              session.layout === 'sidebar' ? 'grid-cols-[1fr_300px]' : ''
            )}
          >
            {session.layout !== 'sidebar' && (
              <LocalParticipantVideo
                session={session}
                isVideoCall={isVideoCall}
                localVideoRef={localVideoRef}
                isSpotlight={session.layout === 'spotlight'}
              />
            )}

            {participantsArray.map((participant) => {
              const stream = session.streams.get(participant.id);
              const isSpotlight =
                session.layout === 'spotlight' && session.spotlightParticipantId === participant.id;

              return (
                <ParticipantVideo
                  key={participant.id}
                  participant={participant}
                  streamId={participant.id}
                  stream={stream}
                  isVideoCall={isVideoCall}
                  isRaised={raisedHands.has(participant.id)}
                  isSpotlight={isSpotlight}
                  onVideoRef={handleVideoRef}
                />
              );
            })}
          </div>

          {session.layout === 'sidebar' && (
            <div className="absolute top-0 right-0 bottom-0 w-80 p-4">
              <ScrollArea className="h-full">
                <div className="space-y-3">
                  <LocalParticipantVideo
                    session={session}
                    isVideoCall={isVideoCall}
                    localVideoRef={localVideoRef}
                    isSpotlight={false}
                    compact
                  />
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {showParticipants && (
          <ParticipantsPanel
            session={session}
            participantsArray={participantsArray}
            totalParticipants={totalParticipants}
            raisedHands={raisedHands}
            onInvite={handleInviteParticipants}
            onClose={handleToggleParticipants}
          />
        )}

        <div className="absolute bottom-0 left-0 right-0 z-20 glass-strong backdrop-blur-2xl border-t border-border/50">
          <div className="px-6 py-4">
            <div
              className="flex items-center justify-center gap-3"
              role="toolbar"
              aria-label="Call controls"
            >
              <MotionView variants={muteButton.variants} initial="rest" animate="rest" whileTap="tap">
                <Button
                  onClick={muteButton.handlePress}
                  size="icon"
                  className={cn(
                    'w-14 h-14 rounded-full shadow-xl',
                    session.localParticipant.isMuted
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-primary hover:bg-primary/90'
                  )}
                  aria-label={
                    session.localParticipant.isMuted ? 'Unmute microphone' : 'Mute microphone'
                  }
                  aria-pressed={session.localParticipant.isMuted}
                >
                  {session.localParticipant.isMuted ? (
                    <MicrophoneSlash
                      size={24}
                      weight="fill"
                      className="text-white"
                      aria-hidden="true"
                    />
                  ) : (
                    <Microphone size={24} weight="fill" className="text-white" aria-hidden="true" />
                  )}
                </Button>
              </MotionView>

              {isVideoCall && (
                <MotionView variants={videoButton.variants} initial="rest" animate="rest" whileTap="tap">
                  <Button
                    onClick={videoButton.handlePress}
                    size="icon"
                    className={cn(
                      'w-14 h-14 rounded-full shadow-xl',
                      !session.localParticipant.isVideoEnabled
                        ? 'bg-red-500 hover:bg-red-600'
                        : 'bg-primary hover:bg-primary/90'
                    )}
                    aria-label={
                      session.localParticipant.isVideoEnabled ? 'Disable video' : 'Enable video'
                    }
                    aria-pressed={!session.localParticipant.isVideoEnabled}
                  >
                    {session.localParticipant.isVideoEnabled ? (
                      <VideoCamera
                        size={24}
                        weight="fill"
                        className="text-white"
                        aria-hidden="true"
                      />
                    ) : (
                      <VideoCameraSlash
                        size={24}
                        weight="fill"
                        className="text-white"
                        aria-hidden="true"
                      />
                    )}
                  </Button>
                </MotionView>
              )}

              <MotionView variants={endCallButton.variants} initial="rest" animate="rest" whileTap="tap">
                <Button
                  onClick={endCallButton.handlePress}
                  size="icon"
                  className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 shadow-2xl"
                  aria-label="End call"
                >
                  <PhoneDisconnect
                    size={28}
                    weight="fill"
                    className="text-white"
                    aria-hidden="true"
                  />
                </Button>
              </MotionView>

              <MotionView variants={raiseHandButton.variants} initial="rest" animate="rest" whileTap="tap">
                <Button
                  onClick={raiseHandButton.handlePress}
                  size="icon"
                  variant={isLocalHandRaised ? 'default' : 'outline'}
                  className="w-14 h-14 rounded-full shadow-xl"
                  aria-label={isLocalHandRaised ? 'Lower hand' : 'Raise hand'}
                  aria-pressed={isLocalHandRaised}
                >
                  <Hand
                    size={24}
                    weight="fill"
                    className={isLocalHandRaised ? 'text-white' : ''}
                    aria-hidden="true"
                  />
                </Button>
              </MotionView>

              <MotionView variants={chatButton.variants} initial="rest" animate="rest" whileTap="tap">
                <Button
                  size="icon"
                  variant="outline"
                  className="w-14 h-14 rounded-full shadow-xl"
                  aria-label="Open chat"
                >
                  <ChatCircle size={24} weight="fill" aria-hidden="true" />
                </Button>
              </MotionView>
            </div>
          </div>
        </div>
      </MotionView>
      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </MotionView>
  );
}

interface LocalParticipantVideoProps {
  session: GroupCallSession;
  isVideoCall: boolean;
  localVideoRef: React.RefObject<HTMLVideoElement>;
  isSpotlight: boolean;
  compact?: boolean;
}

function LocalParticipantVideo({
  session,
  isVideoCall,
  localVideoRef,
  isSpotlight,
  compact = false,
}: LocalParticipantVideoProps): JSX.Element {
  return (
    <div
      className={cn(
        'relative rounded-2xl overflow-hidden bg-linear-to-br from-primary/10 to-accent/10',
        isSpotlight ? 'row-span-1' : '',
        compact ? 'aspect-video' : ''
      )}
      role="article"
      aria-label="Your video"
    >
      {isVideoCall && session.localParticipant.isVideoEnabled ? (
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover mirror"
          aria-label="Your video stream"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Avatar className={cn(compact ? 'w-16 h-16' : 'w-24 h-24 ring-4 ring-primary/50')}>
            <AvatarImage
              src={session.localParticipant.avatar}
              alt={session.localParticipant.name}
            />
            <AvatarFallback className="bg-linear-to-br from-primary to-accent text-white text-3xl font-bold">
              {session.localParticipant.name[0]}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      <div className="absolute inset-0 bg-linear-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

      <div className="absolute top-3 left-3">
        <div className="glass-strong backdrop-blur-xl px-3 py-1.5 rounded-full flex items-center gap-2">
          <p className="text-white font-semibold text-sm">You</p>
          <Badge variant="secondary" className="text-xs">
            Host
          </Badge>
        </div>
        {session.localParticipant.petName && !compact && (
          <div className="glass-strong backdrop-blur-xl px-3 py-1 rounded-full mt-2">
            <p className="text-white/90 text-xs">{session.localParticipant.petName}</p>
          </div>
        )}
      </div>

      <div className="absolute bottom-3 right-3 flex items-center gap-2">
        {session.localParticipant.isMuted && (
          <div
            className="glass-strong backdrop-blur-xl p-2 rounded-full"
            role="status"
            aria-label="Muted"
          >
            <MicrophoneSlash size={16} weight="fill" className="text-red-400" aria-hidden="true" />
          </div>
        )}
        {!session.localParticipant.isVideoEnabled && isVideoCall && (
          <div
            className="glass-strong backdrop-blur-xl p-2 rounded-full"
            role="status"
            aria-label="Video disabled"
          >
            <VideoCameraSlash size={16} weight="fill" className="text-red-400" aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  );
}

interface ParticipantsPanelProps {
  session: GroupCallSession;
  participantsArray: CallParticipant[];
  totalParticipants: number;
  raisedHands: Set<string>;
  onInvite: () => void;
  onClose: () => void;
}

function ParticipantsPanel({
  session,
  participantsArray,
  totalParticipants,
  raisedHands,
  onInvite,
  onClose: _onClose,
}: ParticipantsPanelProps): JSX.Element {
  const slideX = useSharedValue(400);
  const opacity = useSharedValue(0);

  useEffect(() => {
    slideX.value = withTiming(0, { duration: 300 });
    opacity.value = withTiming(1, { duration: 300 });
  }, [slideX, opacity]);

  const panelStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: slideX.value }],
      opacity: opacity.value,
    };
  });

  return (
    <MotionView
      style={panelStyle}
      className="absolute top-20 right-0 bottom-24 w-80 glass-strong backdrop-blur-2xl border-l border-border/50 z-30"
      role="complementary"
      aria-label="Participants panel"
    >
      <div className="p-6 h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">Participants ({totalParticipants})</h2>
          <Button onClick={onInvite} size="sm" variant="outline" aria-label="Invite participants">
            <ShareNetwork size={16} weight="fill" className="mr-2" aria-hidden="true" />
            Invite
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/10">
              <Avatar className="w-10 h-10">
                <AvatarImage
                  src={session.localParticipant.avatar}
                  alt={session.localParticipant.name}
                />
                <AvatarFallback>{session.localParticipant.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold text-sm">You</p>
                <p className="text-xs text-muted-foreground">{session.localParticipant.petName}</p>
              </div>
              <Badge variant="secondary" className="text-xs">
                Host
              </Badge>
            </div>

            {participantsArray.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                role="listitem"
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={participant.avatar} alt={participant.name} />
                  <AvatarFallback>{participant.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{participant.name}</p>
                  {participant.petName && (
                    <p className="text-xs text-muted-foreground">{participant.petName}</p>
                  )}
                </div>
                {raisedHands.has(participant.id) && (
                  <Hand
                    size={16}
                    weight="fill"
                    className="text-yellow-500"
                    aria-label="Hand raised"
                    aria-hidden="true"
                  />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </MotionView>
  );
}

function ActiveIndicator(): JSX.Element {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(withTiming(1.2, { duration: 1000 }), withTiming(1, { duration: 1000 })),
      -1,
      true
    );
    opacity.value = withRepeat(
      withSequence(withTiming(0.5, { duration: 1000 }), withTiming(1, { duration: 1000 })),
      -1,
      true
    );
  }, [scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  return (
    <MotionView
      style={animatedStyle}
      className="w-2 h-2 bg-green-500 rounded-full"
      role="status"
      aria-label="Call active"
    />
  );
}

function ConnectingIndicator(): JSX.Element {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(withTiming(1.2, { duration: 750 }), withTiming(1, { duration: 750 })),
      -1,
      true
    );
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <MotionView
      style={animatedStyle}
      className="w-2 h-2 bg-yellow-500 rounded-full"
      role="status"
      aria-label="Connecting"
    />
  );
}
