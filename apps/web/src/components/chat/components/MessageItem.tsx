/**
 * Message Item Component
 *
 * Individual message bubble with animations and interactions
 */

import { useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Translate as TranslateIcon } from '@phosphor-icons/react';
import { useAnimatedStyle } from 'react-native-reanimated';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import { useEntryAnimation } from '@/effects/reanimated/use-entry-animation';
import { useHoverAnimation } from '@/effects/reanimated/use-hover-animation';
import { useSendWarp } from '@/effects/chat/bubbles/use-send-warp';
import { useReceiveAirCushion } from '@/effects/chat/bubbles/use-receive-air-cushion';
import { WebBubbleWrapper } from '../WebBubbleWrapper';
import { PresenceAvatar } from '../PresenceAvatar';
import { MessageAttachments } from '../MessageAttachments';
import { MessageReactions } from '../MessageReactions';
import { VoiceWaveform } from '../VoiceWaveform';
import { formatChatTime } from '@/lib/chat-utils';
import { REACTION_EMOJIS } from '@/lib/chat-types';
import type { ChatMessage } from '@/lib/chat-types';

export interface MessageItemProps {
  message: ChatMessage;
  isCurrentUser: boolean;
  currentUserId: string;
  currentUserName: string;
  delay: number;
  onReaction: (messageId: string, emoji: string) => void;
  onTranslate: (messageId: string) => void;
}

export function MessageItem({
  message,
  isCurrentUser,
  currentUserId,
  currentUserName,
  delay,
  onReaction,
  onTranslate,
}: MessageItemProps): JSX.Element {
  const bubbleHover = useHoverAnimation({ scale: 1.02 });

  // Premium send/receive effects
  const sendWarp = useSendWarp({
    enabled: isCurrentUser && message.status === 'sent',
    onStatusChange: () => {
      // Status change handled by effect
    },
  });

  const receiveAir = useReceiveAirCushion({
    enabled: !isCurrentUser,
    isNew: delay < 100,
    isMention:
      (message.content?.includes(`@${currentUserName}`) ?? false) ||
      (message.content?.includes(`@${currentUserId}`) ?? false),
  });

  // Combine entry animation with send/receive effects
  const messageAnimation = useEntryAnimation({
    initialY: 20,
    initialScale: 0.95,
    delay,
  });

  // Trigger send warp when message is sent
  useEffect(() => {
    if (isCurrentUser && message.status === 'sent') {
      sendWarp.trigger();
    }
  }, [isCurrentUser, message.status, sendWarp]);

  // Combine all animations
  const combinedStyle = useAnimatedStyle(() => {
    const entryStyle = messageAnimation.animatedStyle;
    const effectStyle = isCurrentUser ? sendWarp.animatedStyle : receiveAir.animatedStyle;

    return {
      ...entryStyle,
      ...effectStyle,
    };
  });

  return (
    <AnimatedView
      style={combinedStyle}
      className={`flex items-end gap-2 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {!isCurrentUser && message.senderAvatar && (
        <PresenceAvatar
          src={message.senderAvatar}
          {...(message.senderName ? { alt: message.senderName } : {})}
          fallback={message.senderName ?? '?'}
          status="online"
          size={32}
          className="shrink-0"
        />
      )}

      <div className={`flex flex-col max-w-[75%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
        <WebBubbleWrapper
          isIncoming={!isCurrentUser}
          index={delay / 50}
          glowOpacity={isCurrentUser ? sendWarp.glowOpacity.value : 0}
          glowIntensity={isCurrentUser ? sendWarp.bloomIntensity.value : 0}
          className="relative"
        >
          <AnimatedView
            style={bubbleHover.animatedStyle}
            onMouseEnter={bubbleHover.handleMouseEnter}
            onMouseLeave={bubbleHover.handleMouseLeave}
            className={`relative group ${
              message.type === 'sticker' ? 'p-0' : 'p-3'
            } rounded-2xl shadow-lg ${
              isCurrentUser
                ? 'bg-linear-to-br from-primary to-accent text-white'
                : 'glass-strong backdrop-blur-xl border border-white/20'
            }`}
          >
            {message.type === 'text' && (
              <>
                <p className="text-sm wrap-break-word">{message.content}</p>
                {message.metadata?.translation?.translatedText && (
                  <div className="mt-2 pt-2 border-t border-white/20 text-xs opacity-80">
                    <div className="flex items-center gap-1 mb-1">
                      <TranslateIcon size={12} />
                      <span>Translation:</span>
                    </div>
                    <p>{message.metadata.translation.translatedText}</p>
                  </div>
                )}
              </>
            )}

            {message.type === 'sticker' && <div className="text-5xl p-2">{message.content}</div>}

            {message.type === 'voice' && message.attachments && (
              <div className="space-y-2">
                {message.metadata?.voiceNote?.waveform && (
                  <VoiceWaveform
                    waveform={message.metadata.voiceNote.waveform}
                    duration={message.attachments[0]?.duration ?? 0}
                    currentTime={0}
                    isPlaying={false}
                    width={200}
                    height={40}
                    color={isCurrentUser ? '#ffffff' : '#3B82F6'}
                  />
                )}
                <MessageAttachments attachments={message.attachments} />
              </div>
            )}

            {message.type === 'location' && message.metadata?.location && (
              <div className="flex items-center gap-2">
                <MapPin size={20} weight="fill" />
                <div>
                  <p className="text-sm font-medium">Shared Location</p>
                  <p className="text-xs opacity-80">{message.metadata.location.address}</p>
                </div>
              </div>
            )}

            {message.type === 'pet-card' && message.metadata?.petCard && (
              <div className="flex items-center gap-3 p-2 bg-white/10 rounded-lg">
                <img
                  src={message.metadata.petCard.petPhoto}
                  alt={message.metadata.petCard.petName}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-sm">{message.metadata.petCard.petName}</p>
                </div>
              </div>
            )}

            <MessageReactions
              reactions={Array.isArray(message.reactions) ? message.reactions : []}
              availableReactions={REACTION_EMOJIS}
              onReact={(emoji) => {
                onReaction(message.id, emoji);
              }}
              currentUserId={currentUserId}
            />

            {!isCurrentUser && message.type === 'text' && (
              <Button
                size="sm"
                variant="ghost"
                className="absolute -bottom-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                onClick={() => onTranslate(message.id)}
              >
                <TranslateIcon size={14} />
              </Button>
            )}
          </AnimatedView>
        </WebBubbleWrapper>

        <span className="text-xs text-muted-foreground mt-1 px-1 flex items-center gap-2">
          {formatChatTime(message.timestamp)}
          {isCurrentUser && (
            <Badge variant="secondary" className="text-[10px] px-1 py-0">
              {message.status}
            </Badge>
          )}
        </span>
      </div>
    </AnimatedView>
  );
}
