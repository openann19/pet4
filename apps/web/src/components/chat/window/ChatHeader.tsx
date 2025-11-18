/**
 * Chat Header Component
 * Header bar with user info, typing indicator, and call buttons
 */

import { MotionView } from '@petspark/motion'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowLeft, VideoCamera, Phone, DotsThree } from '@phosphor-icons/react'
import type { CSSProperties } from 'react'
import { useAnimatedStyleValue } from '@/effects/reanimated/animated-view'
import { useAnimatedStyle } from '@petspark/motion'
import type { SharedValue } from '@petspark/motion'
import type { AnimatedStyle } from '@/effects/reanimated/animated-view'

export interface ChatHeaderProps {
  room: {
    matchedPetName?: string | null
    matchedPetPhoto?: string | null
  }
  typingUsers: { userName?: string | null }[]
  headerStyle: CSSProperties
  typingContainerStyle: CSSProperties
  typingTextStyle: CSSProperties
  typingDotsStyle: CSSProperties
  videoButtonHover: {
    scale: SharedValue<number> | number
    translateY: SharedValue<number> | number
    handleEnter: () => void
    handleLeave: () => void
  }
  voiceButtonHover: {
    scale: SharedValue<number> | number
    translateY: SharedValue<number> | number
    handleEnter: () => void
    handleLeave: () => void
  }
  onBack?: () => void
  onVideoCall: () => void
  onVoiceCall: () => void
}

function useButtonHoverStyle(hover: { scale: SharedValue<number> | number; translateY: SharedValue<number> | number }): CSSProperties {
  const animatedStyle = useAnimatedStyle(() => {
    const scaleVal = typeof hover.scale === 'number' ? hover.scale : hover.scale.get();
    const translateYVal = typeof hover.translateY === 'number' ? hover.translateY : (hover.translateY?.get() ?? 0);
    return {
      transform: [{ scale: scaleVal, translateY: translateYVal }],
    };
  }) as AnimatedStyle;
  return useAnimatedStyleValue(animatedStyle);
}

function TypingIndicator({ users, containerStyle, textStyle, dotsStyle }: {
  users: { userName?: string | null }[];
  containerStyle: CSSProperties;
  textStyle: CSSProperties;
  dotsStyle: CSSProperties;
}): React.JSX.Element | null {
  if (users.length === 0) return null;
  
  return (
    <MotionView style={containerStyle} className="text-xs text-primary flex items-center gap-1">
      <MotionView style={textStyle}>
        {users.length === 1
          ? `${users[0]?.userName ?? 'Someone'} is typing`
          : `${String(users.length ?? '')} people are typing`}
      </MotionView>
      <MotionView style={dotsStyle}>...</MotionView>
    </MotionView>
  );
}

function CallButton({ style, icon, onClick, onMouseEnter, onMouseLeave, title, ariaLabel }: {
  style: CSSProperties;
  icon: React.ReactNode;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  title: string;
  ariaLabel: string;
}): React.JSX.Element {
  return (
    <MotionView style={style}>
      <Button
        variant="ghost"
        size="sm"
        className="shrink-0 w-10 h-10 p-0"
        onClick={() => void onClick()}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        title={title}
        aria-label={ariaLabel}
      >
        {icon}
      </Button>
    </MotionView>
  );
}

function ChatHeaderContent({ room, typingUsers, typingContainerStyle, typingTextStyle, typingDotsStyle, onBack }: {
  room: ChatHeaderProps['room'];
  typingUsers: ChatHeaderProps['typingUsers'];
  typingContainerStyle: CSSProperties;
  typingTextStyle: CSSProperties;
  typingDotsStyle: CSSProperties;
  onBack?: () => void;
}): React.JSX.Element {
  return (
    <div className="flex items-center gap-3">
      {onBack && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void onBack()}
          className="md:hidden w-10 h-10 p-0"
          aria-label="Back to chat list"
        >
          <ArrowLeft size={20} />
        </Button>
      )}
      <Avatar className="w-10 h-10 ring-2 ring-white/30">
        <AvatarImage src={room.matchedPetPhoto ?? undefined} alt={room.matchedPetName ?? undefined} />
        <AvatarFallback className="bg-linear-to-br from-primary to-accent text-white font-bold">
          {room.matchedPetName?.[0] ?? '?'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <h2 className="font-bold text-foreground">{room.matchedPetName ?? 'Unknown'}</h2>
        <TypingIndicator
          users={typingUsers}
          containerStyle={typingContainerStyle}
          textStyle={typingTextStyle}
          dotsStyle={typingDotsStyle}
        />
      </div>
    </div>
  );
}

export function ChatHeader({
  room,
  typingUsers,
  headerStyle,
  typingContainerStyle,
  typingTextStyle,
  typingDotsStyle,
  videoButtonHover,
  voiceButtonHover,
  onBack,
  onVideoCall,
  onVoiceCall,
}: ChatHeaderProps) {
  const videoButtonStyleValue = useButtonHoverStyle(videoButtonHover);
  const voiceButtonStyleValue = useButtonHoverStyle(voiceButtonHover);

  return (
    <MotionView
      style={headerStyle}
      className="glass-strong border-b border-white/20 p-4 shadow-xl backdrop-blur-2xl"
    >
      <ChatHeaderContent
        room={room}
        typingUsers={typingUsers}
        typingContainerStyle={typingContainerStyle}
        typingTextStyle={typingTextStyle}
        typingDotsStyle={typingDotsStyle}
        onBack={onBack}
      />
      <CallButton
        style={videoButtonStyleValue}
        icon={<VideoCamera size={24} weight="regular" />}
        onClick={() => void onVideoCall()}
        onMouseEnter={videoButtonHover.handleEnter}
        onMouseLeave={videoButtonHover.handleLeave}
        title="Start video call"
        ariaLabel="Start video call"
      />
      <CallButton
        style={voiceButtonStyleValue}
        icon={<Phone size={24} weight="regular" />}
        onClick={() => void onVoiceCall()}
        onMouseEnter={voiceButtonHover.handleEnter}
        onMouseLeave={voiceButtonHover.handleLeave}
        title="Start voice call"
        ariaLabel="Start voice call"
      />
      <Button variant="ghost" size="sm" className="shrink-0 w-10 h-10 p-0" aria-label="Chat options menu">
        <DotsThree size={24} weight="bold" />
      </Button>
    </MotionView>
  );
}
