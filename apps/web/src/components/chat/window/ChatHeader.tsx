/**
 * Chat Header Component
 * Header bar with user info, typing indicator, and call buttons
 */

import { MotionView } from '@petspark/motion'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowLeft, VideoCamera, Phone, DotsThree } from '@phosphor-icons/react'
import type { AnimatedStyle } from '@/effects/reanimated/animated-view'

interface ChatHeaderProps {
  room: {
    matchedPetName?: string | null
    matchedPetPhoto?: string | null
  }
  typingUsers: Array<{ userName?: string | null }>
  headerStyle: AnimatedStyle
  typingContainerStyle: AnimatedStyle
  typingTextStyle: AnimatedStyle
  typingDotsStyle: AnimatedStyle
  videoButtonHover: {
    scale: unknown
    translateY: unknown
    handleEnter: () => void
    handleLeave: () => void
  }
  voiceButtonHover: {
    scale: unknown
    translateY: unknown
    handleEnter: () => void
    handleLeave: () => void
  }
  onBack?: () => void
  onVideoCall: () => void
  onVoiceCall: () => void
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
  return (
    <MotionView
      style={headerStyle}
      className="glass-strong border-b border-white/20 p-4 shadow-xl backdrop-blur-2xl"
    >
      <div className="flex items-center gap-3">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="md:hidden"
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
          {typingUsers.length > 0 && (
            <MotionView style={typingContainerStyle} className="text-xs text-primary flex items-center gap-1">
              <MotionView style={typingTextStyle}>
                {typingUsers.length === 1
                  ? `${typingUsers[0]?.userName ?? 'Someone'} is typing`
                  : `${String(typingUsers.length ?? '')} people are typing`}
              </MotionView>
              <MotionView style={typingDotsStyle}>...</MotionView>
            </MotionView>
          )}
        </div>

        <MotionView
          style={{
            scale: videoButtonHover.scale,
            y: videoButtonHover.translateY,
          }}
        >
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={onVideoCall}
            onMouseEnter={videoButtonHover.handleEnter}
            onMouseLeave={videoButtonHover.handleLeave}
            title="Start video call"
            aria-label="Start video call"
          >
            <VideoCamera size={24} weight="regular" />
          </Button>
        </MotionView>

        <MotionView
          style={{
            scale: voiceButtonHover.scale,
            y: voiceButtonHover.translateY,
          }}
        >
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={onVoiceCall}
            onMouseEnter={voiceButtonHover.handleEnter}
            onMouseLeave={voiceButtonHover.handleLeave}
            title="Start voice call"
            aria-label="Start voice call"
          >
            <Phone size={24} weight="regular" />
          </Button>
        </MotionView>

        <Button variant="ghost" size="icon" className="shrink-0" aria-label="Chat options menu">
          <DotsThree size={24} weight="bold" />
        </Button>
      </div>
    </MotionView>
  )
}
