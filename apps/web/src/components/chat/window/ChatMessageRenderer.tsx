import { MotionView } from '@petspark/motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { WebBubbleWrapper } from '@/components/chat/WebBubbleWrapper';
import { Pause, Play, Checks, Check } from '@phosphor-icons/react';
import type { ChatMessage } from '@/lib/chat-types';
import { formatChatTime } from '@/lib/chat-utils';
import type  from '@petspark/motion';

interface ChatMessageRendererProps {
  messageGroups: { date: string; messages: ChatMessage[] }[];
  currentUserId: string;
  voiceMessages: Record<string, { blob: string; duration: number; waveform: number[] }> | undefined;
  playingVoice: string | null;
  messageBubbleHover: {
    handleEnter: () => void;
    handleLeave: () => void;
  };
  messageBubbleHoverStyle: AnimatedStyle;
  voiceButtonHover: {
    handleEnter: () => void;
    handleLeave: () => void;
  };
  voiceButtonHoverStyle: AnimatedStyle;
  voiceButtonTapStyle: AnimatedStyle;
  dateGroupStyle: AnimatedStyle;
  messageItemStyle: AnimatedStyle;
  typingIndicatorStyle: AnimatedStyle;
  typingUsers: { userId: string; userName?: string }[];
  onToggleVoicePlayback: (messageId: string) => void;
}

/**
 * Component for rendering chat messages in a scrollable list
 */
export function ChatMessageRenderer({
  messageGroups,
  currentUserId,
  voiceMessages,
  playingVoice,
  messageBubbleHover,
  messageBubbleHoverStyle,
  voiceButtonHover,
  voiceButtonHoverStyle,
  voiceButtonTapStyle,
  dateGroupStyle,
  messageItemStyle,
  typingIndicatorStyle,
  typingUsers,
  onToggleVoicePlayback,
}: ChatMessageRendererProps) {
  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messageGroups.map((group: { date: string; messages: ChatMessage[] }) => (
          <div key={group.date} className="space-y-4">
            <MotionView className="flex justify-center" style={dateGroupStyle}>
              <div className="glass-effect px-4 py-1.5 rounded-full text-xs font-medium text-muted-foreground shadow-sm">
                {group.date}
              </div>
            </MotionView>
            {group.messages.map((message: ChatMessage) => {
              const isCurrentUser = message.senderId === currentUserId;
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
                      style={messageBubbleHoverStyle}
                      onMouseEnter={messageBubbleHover.handleEnter}
                      onMouseLeave={messageBubbleHover.handleLeave}
                      className={`relative group ${message.type === 'sticker' ? 'p-0' : 'p-3'} rounded-2xl shadow-lg ${
                        isCurrentUser
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
                          style={voiceButtonTapStyle}
                          onClick={() => onToggleVoicePlayback(message.id)}
                          className="flex items-center gap-2 min-w-50 cursor-pointer"
                          onMouseEnter={voiceButtonHover.handleEnter}
                          onMouseLeave={voiceButtonHover.handleLeave}
                        >
                          <MotionView
                            style={voiceButtonHoverStyle}
                            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
                          >
                            {playingVoice === message.id ? (
                              <Pause size={16} weight="fill" />
                            ) : (
                              <Play size={16} weight="fill" />
                            )}
                          </MotionView>
                          <div className="flex-1 h-8 flex items-center gap-0.5">
                            {voiceMessages[message.id]?.waveform.slice(0, 30).map((value, i) => (
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
                    </MotionView>
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
            })}
          </div>
        ))}
      </div>
      {typingUsers.length > 0 && (
        <MotionView
          key="typing-indicators"
          className="flex items-end gap-2 flex-row p-4"
          style={typingIndicatorStyle}
        >
          <Avatar className="w-8 h-8 ring-2 ring-white/20 shrink-0">
            <AvatarFallback className="bg-linear-to-br from-secondary to-primary text-white text-xs font-bold">
              {typingUsers[0]?.userName?.[0] ?? '?'}
            </AvatarFallback>
          </Avatar>
          <WebBubbleWrapper showTyping isIncoming>
            <div />
          </WebBubbleWrapper>
        </MotionView>
      )}
    </>
  );
}

