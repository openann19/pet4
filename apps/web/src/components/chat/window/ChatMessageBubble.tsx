/**
 * Chat Message Bubble Component
 * Individual message bubble with reactions, voice playback, and status indicators
 */

import { MotionView } from '@petspark/motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, Checks, Heart, Pause, Play } from '@phosphor-icons/react';
import type { ChatMessage, MessageReaction } from '@/lib/chat-types';
import { REACTION_EMOJIS } from '@/lib/chat-types';
import { formatChatTime, getReactionsArray } from '@/lib/chat-utils';
import type  from '@petspark/motion';

export interface ChatMessageBubbleProps {
  message: ChatMessage;
  isCurrentUser: boolean;
  currentUserId: string;
  voiceMessages?: Record<string, { blob: string; duration: number; waveform: number[] }>;
  playingVoice: string | null;
  showReactions: string | null;
  messageBubbleHover: {
    animatedStyle: AnimatedStyle;
    handleEnter: () => void;
    handleLeave: () => void;
  };
  voiceButtonHover: {
    animatedStyle: AnimatedStyle;
    handleEnter: () => void;
    handleLeave: () => void;
  };
  voiceButtonTap: {
    animatedStyle: AnimatedStyle;
  };
  reactionButtonHover: {
    animatedStyle: AnimatedStyle;
    handleEnter: () => void;
    handleLeave: () => void;
  };
  reactionButtonTap: {
    animatedStyle: AnimatedStyle;
  };
  reactionContainerStyle: AnimatedStyle;
  messageItemStyle: AnimatedStyle;
  onReaction: (messageId: string, emoji: string) => void;
  onToggleVoicePlayback: (messageId: string) => void;
  onShowReactions: (messageId: string | null) => void;
}

export function ChatMessageBubble({
  message,
  isCurrentUser,
  currentUserId: _currentUserId,
  voiceMessages,
  playingVoice,
  showReactions,
  messageBubbleHover,
  voiceButtonHover,
  voiceButtonTap,
  reactionButtonHover,
  reactionButtonTap,
  reactionContainerStyle,
  messageItemStyle,
  onReaction,
  onToggleVoicePlayback,
  onShowReactions,
}: ChatMessageBubbleProps) {
  return (
    <MotionView
      key={message.id}
      className={`flex items-end gap-2 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}
      style={messageItemStyle}
    >
      {!isCurrentUser && (
        <Avatar className="w-8 h-8 ring-2 ring-white/20 shrink-0">
          <AvatarImage
            src={message.senderAvatar ?? undefined}
            alt={message.senderName ?? undefined}
          />
          <AvatarFallback className="bg-linear-to-br from-secondary to-primary text-white text-xs font-bold">
            {message.senderName?.[0] ?? '?'}
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={`flex flex-col max-w-[75%] ${isCurrentUser ? 'items-end' : 'items-start'}`}
      >
        <MotionView
          style={messageBubbleHover.animatedStyle}
          onMouseEnter={messageBubbleHover.handleEnter}
          onMouseLeave={messageBubbleHover.handleLeave}
          className={`relative group ${message.type === 'sticker' ? 'p-0' : 'p-3'
            } rounded-2xl shadow-lg ${isCurrentUser
              ? 'bg-linear-to-br from-primary to-accent text-white'
              : 'glass-strong backdrop-blur-xl border border-white/20'
            }`}
        >
          {message.type === 'text' && (
            <p className="text-sm wrap-break-word">{message.content}</p>
          )}

          {message.type === 'sticker' && (
            <div className="text-5xl p-2">{message.content}</div>
          )}

          {message.type === 'voice' && voiceMessages?.[message.id] && (
            <MotionView
              style={voiceButtonTap.animatedStyle}
              onClick={() => onToggleVoicePlayback(message.id)}
              className="flex items-center gap-2 min-w-50 cursor-pointer"
              onMouseEnter={voiceButtonHover.handleEnter}
              onMouseLeave={voiceButtonHover.handleLeave}
            >
              <MotionView
                style={voiceButtonHover.animatedStyle}
                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
              >
                {playingVoice === message.id ? (
                  <Pause size={16} weight="fill" />
                ) : (
                  <Play size={16} weight="fill" />
                )}
              </MotionView>
              <div className="flex-1 h-8 flex items-center gap-0.5">
                {voiceMessages[message.id]?.waveform
                  .slice(0, 30)
                  .map((value, i) => (
                    <div
                      key={i}
                      className="w-1 bg-white/60 rounded-full transition-opacity"
                      style={{ height: `${Math.max(value * 24, 4)}px` }}
                    />
                  ))}
              </div>
              <span className="text-xs opacity-80">
                {(() => {
                  const voiceMsg = voiceMessages[message.id];
                  if (!voiceMsg) return null;
                  return `${Math.floor(voiceMsg.duration / 60)}:${(voiceMsg.duration % 60).toString().padStart(2, '0')}`;
                })()}
              </span>
            </MotionView>
          )}

          <Popover
            open={showReactions === message.id}
            onOpenChange={(open) => onShowReactions(open ? message.id : null)}
          >
            <PopoverTrigger asChild>
              <MotionView
                style={reactionButtonTap.animatedStyle}
                onClick={() => { }}
                className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-white shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onMouseEnter={reactionButtonHover.handleEnter}
                onMouseLeave={reactionButtonHover.handleLeave}
              >
                <Heart size={14} weight="fill" className="text-red-500" />
              </MotionView>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-2 glass-strong backdrop-blur-2xl border-white/30"
              side="top"
            >
              <div className="flex gap-1">
                {REACTION_EMOJIS.slice(0, 6).map((emoji) => (
                  <MotionView
                    key={emoji}
                    style={reactionButtonTap.animatedStyle}
                    onClick={() => onReaction(message.id, emoji)}
                    className="text-2xl p-2 rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
                    onMouseEnter={reactionButtonHover.handleEnter}
                    onMouseLeave={reactionButtonHover.handleLeave}
                  >
                    {emoji}
                  </MotionView>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </MotionView>

        {(() => {
          const reactionsArray = getReactionsArray(message.reactions);
          return (reactionsArray.length > 0 && (
            <MotionView
              className="flex gap-1 mt-1 px-2"
              style={reactionContainerStyle}
            >
              {reactionsArray.map((reaction: MessageReaction, idx: number) => (
                <MotionView
                  key={idx}
                  style={reactionButtonHover.animatedStyle}
                  onMouseEnter={reactionButtonHover.handleEnter}
                  onMouseLeave={reactionButtonHover.handleLeave}
                  className="text-lg bg-white/80 rounded-full px-2 py-0.5 shadow-sm cursor-pointer"
                  title={reaction.userName}
                >
                  {reaction.emoji}
                </MotionView>
              ))}
            </MotionView>
          ));
        })()}

        <div className="flex items-center gap-1 mt-1 px-1">
          <span className="text-xs text-muted-foreground">
            {formatChatTime(message.timestamp)}
          </span>
          {isCurrentUser && (
            <span className="text-muted-foreground">
              {message.status === 'read' ? (
                <Checks size={14} weight="bold" className="text-primary" />
              ) : (
                <Check size={14} weight="bold" />
              )}
            </span>
          )}
        </div>
      </div>
    </MotionView>
  );
}

