'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  PhoneDisconnect,
  Microphone,
  MicrophoneSlash,
  VideoCamera,
  VideoCameraSlash,
  SpeakerHigh,
  SpeakerSlash,
  ArrowsOut,
  ArrowsIn,
  MonitorPlay,
} from '@phosphor-icons/react';
import { isTruthy } from '@petspark/shared';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import type { CallSession } from '@/lib/call-types';
import { formatCallDuration } from '@/lib/call-utils';
import { haptics } from '@/lib/haptics';
import { usePressBounce } from '@/effects/reanimated/use-bounce-on-tap';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  MotionView,
} from '@petspark/motion';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';

interface CallInterfaceProps {
  session: CallSession;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleSpeaker?: () => void;
  onMinimize?: () => void;
}

export default function CallInterface({
  session,
  onEndCall,
  onToggleMute,
  onToggleVideo,
  onToggleSpeaker,
  onMinimize: _onMinimize,
}: CallInterfaceProps) {
  const [duration, setDuration] = useState(0);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [audioWaveform, setAudioWaveform] = useState<number[]>(
    Array.from({ length: 30 }, () => 0.5)
  );
  const videoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (session.call.status === 'active') {
      const interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    }
    return undefined;
  }, [session.call.status]);

  useEffect(() => {
    if (videoRef.current && session.localStream) {
      videoRef.current.srcObject = session.localStream;
    }
  }, [session.localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && session.remoteStream) {
      remoteVideoRef.current.srcObject = session.remoteStream;
    }
  }, [session.remoteStream]);

  useEffect(() => {
    if (!session.localParticipant.isMuted && session.call.status === 'active') {
      const updateWaveform = () => {
        setAudioWaveform((prev) => prev.map(() => Math.random() * 0.6 + 0.2));
        animationFrameRef.current = requestAnimationFrame(updateWaveform);
      };
      updateWaveform();
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setAudioWaveform(Array.from({ length: 30 }, () => 0.2));
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [session.localParticipant.isMuted, session.call.status]);

  const handleToggleSpeaker = useCallback(() => {
    haptics.trigger('selection');
    setIsSpeakerOn((prev) => !prev);
    onToggleSpeaker?.();
  }, [onToggleSpeaker]);

  const handleToggleMute = useCallback(() => {
    haptics.trigger('selection');
    onToggleMute();
  }, [onToggleMute]);

  const handleToggleVideo = useCallback(() => {
    haptics.trigger('selection');
    onToggleVideo();
  }, [onToggleVideo]);

  const handleEndCall = useCallback(() => {
    haptics.trigger('heavy');
    onEndCall();
  }, [onEndCall]);

  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  const isVideoCall = session.call.type === 'video';
  const isActive = session.call.status === 'active';

  const containerOpacity = useSharedValue<number>(0);
  const containerScale = useSharedValue<number>(0.95);

  useEffect(() => {
    containerOpacity.value = withTiming(1, { duration: 300 });
    containerScale.value = withTiming(1, { duration: 300 });
  }, [containerOpacity, containerScale]);

  const containerStyle = useAnimatedStyle(() => {
    return {
      opacity: containerOpacity.value,
      transform: [{ scale: containerScale.value }],
    };
  }) as AnimatedStyle;

  return (
    <MotionView
      animatedStyle={containerStyle}
      className={`fixed inset-0 z-50 flex items-center justify-center ${
        isFullscreen ? 'bg-black' : 'bg-black/90 backdrop-blur-xl p-4'
      }`}
    >
      <div
        className={`relative w-full ${
          isFullscreen ? 'h-full' : 'max-w-2xl h-[80vh]'
        } bg-linear-to-br from-primary/20 via-background/95 to-accent/20 rounded-3xl overflow-hidden shadow-2xl`}
      >
        {isVideoCall && session.remoteParticipant.isVideoEnabled ? (
          <div className="absolute inset-0">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-b from-black/40 via-transparent to-black/60" />
          </div>
        ) : (
          <AvatarPulseView
            avatar={session.remoteParticipant.avatar}
            name={session.remoteParticipant.name}
            isMuted={session.remoteParticipant.isMuted}
            isActive={isActive}
            audioWaveform={audioWaveform}
          />
        )}

        {isVideoCall && session.localParticipant.isVideoEnabled && (
          <LocalVideoView videoRef={videoRef} />
        )}

        <div className="absolute top-6 left-6 z-10">
          <CallInfoView
            name={session.remoteParticipant.name}
            isActive={isActive}
            duration={duration}
            callStatus={session.call.status}
            quality={session.call.quality}
            actualResolution={session.call.actualResolution}
          />
        </div>

        <div className="absolute top-6 right-6 z-10">
          {isVideoCall && (
            <Button
              onClick={handleToggleFullscreen}
              size="sm"
              isIconOnly
              variant="ghost"
              className="glass-strong backdrop-blur-2xl text-white hover:bg-white/20 w-10 h-10 p-0"
            >
              {isFullscreen ? <ArrowsIn size={20} /> : <ArrowsOut size={20} />}
            </Button>
          )}
        </div>

        <CallControlsView
          isVideoCall={isVideoCall}
          isMuted={session.localParticipant.isMuted}
          isVideoEnabled={session.localParticipant.isVideoEnabled}
          isSpeakerOn={isSpeakerOn}
          onToggleMute={handleToggleMute}
          onToggleVideo={handleToggleVideo}
          onEndCall={handleEndCall}
          onToggleSpeaker={handleToggleSpeaker}
        />
      </div>
    </MotionView>
  );
}

interface AvatarPulseViewProps {
  avatar?: string;
  name: string;
  isMuted: boolean;
  isActive: boolean;
  audioWaveform: number[];
}

function AvatarPulseView({ avatar, name, isMuted, isActive, audioWaveform }: AvatarPulseViewProps) {
  const scale = useSharedValue<number>(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(withTiming(1.05, { duration: 1000 }), withTiming(1, { duration: 1000 })),
      -1,
      false
    );
  }, [scale]);

  const avatarStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  }) as AnimatedStyle;

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <MotionView animatedStyle={avatarStyle} className="flex flex-col items-center">
        <Avatar className="w-40 h-40 ring-4 ring-white/30 mb-6">
          <AvatarImage src={avatar} alt={name} />
          <AvatarFallback className="bg-linear-to-br from-primary to-accent text-white text-5xl font-bold">
            {name[0]}
          </AvatarFallback>
        </Avatar>

        {!isMuted && isActive && <AudioWaveformView waveform={audioWaveform} />}
      </MotionView>
    </div>
  );
}

interface AudioWaveformViewProps {
  waveform: number[];
}

function AudioWaveformView({ waveform }: AudioWaveformViewProps) {
  return (
    <div className="flex items-center gap-1 h-16">
      {waveform.map((value, idx) => (
        <WaveformBar key={idx} value={value} />
      ))}
    </div>
  );
}

interface WaveformBarProps {
  value: number;
}

function WaveformBar({ value }: WaveformBarProps) {
  const height = useSharedValue(value * 64);

  useEffect(() => {
    height.value = withTiming(value * 64, { duration: 150 });
  }, [value, height]);

  const barStyle = useAnimatedStyle(() => {
    return {
      height: `${height.value}px`,
    };
  }) as AnimatedStyle;

  return <MotionView animatedStyle={barStyle} className="w-1.5 bg-primary rounded-full" />;
}

interface LocalVideoViewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
}

function LocalVideoView({ videoRef }: LocalVideoViewProps) {
  const opacity = useSharedValue<number>(0);
  const scale = useSharedValue<number>(0.8);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 300 });
    scale.value = withTiming(1, { duration: 300 });
  }, [opacity, scale]);

  const videoStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  }) as AnimatedStyle;

  return (
    <MotionView
      animatedStyle={videoStyle}
      className="absolute top-6 right-6 w-40 h-28 rounded-2xl overflow-hidden shadow-2xl ring-2 ring-white/30"
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)' }}
      />
    </MotionView>
  );
}

interface CallInfoViewProps {
  name: string;
  isActive: boolean;
  duration: number;
  callStatus: string;
  quality: string;
  actualResolution?: string;
}

function CallInfoView({
  name,
  isActive,
  duration,
  callStatus,
  quality,
  actualResolution,
}: CallInfoViewProps) {
  const opacity = useSharedValue<number>(0);
  const translateY = useSharedValue<number>(-20);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 300 });
    translateY.value = withTiming(0, { duration: 300 });
  }, [opacity, translateY]);

  const infoStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  }) as AnimatedStyle;

  const statusScale = useSharedValue<number>(1);
  const statusOpacity = useSharedValue<number>(1);

  useEffect(() => {
    if (isTruthy(isActive)) {
      statusScale.value = withRepeat(
        withSequence(withTiming(1.2, { duration: 1000 }), withTiming(1, { duration: 1000 })),
        -1,
        false
      );
      statusOpacity.value = withRepeat(
        withSequence(withTiming(0.5, { duration: 1000 }), withTiming(1, { duration: 1000 })),
        -1,
        false
      );
    } else {
      statusScale.value = withRepeat(
        withSequence(withTiming(1.2, { duration: 750 }), withTiming(1, { duration: 750 })),
        -1,
        false
      );
    }
  }, [isActive, statusScale, statusOpacity]);

  const statusStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: statusScale.value }],
      opacity: statusOpacity.value,
    };
  }) as AnimatedStyle;

  return (
    <MotionView
      animatedStyle={infoStyle}
      className="glass-strong rounded-2xl px-4 py-3 backdrop-blur-2xl"
    >
      <h3 className="font-bold text-white text-lg mb-1">{name}</h3>
      <div className="flex items-center gap-2">
        {isActive ? (
          <>
            <MotionView animatedStyle={statusStyle} className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm text-white/90 font-medium">
              {formatCallDuration(duration)}
            </span>
          </>
        ) : (
          <>
            <MotionView animatedStyle={statusStyle} className="w-2 h-2 bg-yellow-500 rounded-full" />
            <span className="text-sm text-white/90">
              {callStatus === 'ringing' ? 'Ringing...' : 'Connecting...'}
            </span>
          </>
        )}
      </div>
      <div className="flex items-center gap-2 mt-1 flex-wrap">
        <div className="flex items-center gap-1">
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              quality === 'excellent'
                ? 'bg-green-500'
                : quality === 'good'
                  ? 'bg-blue-500'
                  : quality === 'fair'
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
            }`}
          />
          <span className="text-xs text-white/70 capitalize">{quality}</span>
        </div>
        {actualResolution && (
          <>
            <span className="text-white/40">•</span>
            <div className="flex items-center gap-1">
              <MonitorPlay size={14} className="text-white/70" weight="fill" />
              <span className="text-xs text-white/70 font-semibold">{actualResolution}</span>
            </div>
          </>
        )}
      </div>
    </MotionView>
  );
}

interface CallControlsViewProps {
  isVideoCall: boolean;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isSpeakerOn: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onEndCall: () => void;
  onToggleSpeaker: () => void;
}

function CallControlsView({
  isVideoCall,
  isMuted,
  isVideoEnabled,
  isSpeakerOn,
  onToggleMute,
  onToggleVideo,
  onEndCall,
  onToggleSpeaker,
}: CallControlsViewProps) {
  const translateY = useSharedValue<number>(50);
  const opacity = useSharedValue<number>(0);

  useEffect(() => {
    translateY.value = withTiming(0, { duration: 300 });
    opacity.value = withTiming(1, { duration: 300 });
  }, [translateY, opacity]);

  const controlsStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
    };
  }) as AnimatedStyle;

  const muteAnimation = usePressBounce({ scale: 0.95, hapticFeedback: false });
  const videoAnimation = usePressBounce({ scale: 0.95, hapticFeedback: false });
  const endCallAnimation = usePressBounce({ scale: 0.95, hapticFeedback: false });
  const speakerAnimation = usePressBounce({ scale: 0.95, hapticFeedback: false });

  const muteBounceStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: muteAnimation.scale.get() }],
    };
  }) as AnimatedStyle;

  const videoBounceStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: videoAnimation.scale.get() }],
    };
  }) as AnimatedStyle;

  const endCallBounceStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: endCallAnimation.scale.get() }],
    };
  }) as AnimatedStyle;

  const speakerBounceStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: speakerAnimation.scale.get() }],
    };
  }) as AnimatedStyle;

  return (
    <div className="absolute bottom-0 left-0 right-0 p-8">
      <MotionView animatedStyle={controlsStyle} className="flex items-center justify-center gap-4">
        <MotionView animatedStyle={muteBounceStyle}>
          <Button
            onClick={() => {
              muteAnimation.handlePress();
              onToggleMute();
            }}
            size="sm"
            isIconOnly
            className={`w-14 h-14 rounded-full shadow-xl p-0 ${
              isMuted
                ? 'bg-red-500 hover:bg-red-600'
                : 'glass-strong backdrop-blur-2xl hover:bg-white/20'
            }`}
          >
            {isMuted ? (
              <MicrophoneSlash size={24} weight="fill" className="text-white" />
            ) : (
              <Microphone size={24} weight="fill" className="text-white" />
            )}
          </Button>
        </MotionView>

        {isVideoCall && (
          <MotionView animatedStyle={videoBounceStyle}>
            <Button
              onClick={() => {
                videoAnimation.handlePress();
                onToggleVideo();
              }}
              size="sm"
              isIconOnly
              className={`w-14 h-14 rounded-full shadow-xl p-0 ${
                !isVideoEnabled
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'glass-strong backdrop-blur-2xl hover:bg-white/20'
              }`}
            >
              {isVideoEnabled ? (
                <VideoCamera size={24} weight="fill" className="text-white" />
              ) : (
                <VideoCameraSlash size={24} weight="fill" className="text-white" />
              )}
            </Button>
          </MotionView>
        )}

        <MotionView animatedStyle={endCallBounceStyle}>
          <Button
            onClick={() => {
              endCallAnimation.handlePress();
              onEndCall();
            }}
            size="sm"
            isIconOnly
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 shadow-2xl p-0"
          >
            <PhoneDisconnect size={28} weight="fill" className="text-white" />
          </Button>
        </MotionView>

        <MotionView animatedStyle={speakerBounceStyle}>
          <Button
            onClick={() => {
              speakerAnimation.handlePress();
              onToggleSpeaker();
            }}
            size="sm"
            isIconOnly
            className={`w-14 h-14 rounded-full shadow-xl p-0 ${
              !isSpeakerOn
                ? 'bg-yellow-500 hover:bg-yellow-600'
                : 'glass-strong backdrop-blur-2xl hover:bg-white/20'
            }`}
          >
            {isSpeakerOn ? (
              <SpeakerHigh size={24} weight="fill" className="text-white" />
            ) : (
              <SpeakerSlash size={24} weight="fill" className="text-white" />
            )}
          </Button>
        </MotionView>
      </MotionView>
    </div>
  );
}
