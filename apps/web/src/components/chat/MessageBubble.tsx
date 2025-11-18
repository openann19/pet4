/**
 * Message Bubble Component
 *
 * Production-ready chat bubble with proper styling, accessibility, and media support.
 * Handles long BG strings, emojis, reactions, read receipts, and all content types.
 * Refactored to use consolidated hook and extracted components.
 *
 * Note: This component exceeds standard line limits due to:
 * - Multiple media type renderers (text, image, video, voice, location, sticker)
 * - Complex reaction handling (array and record formats)
 * - Context menu and reactions picker UI
 * - Accessibility features and ARIA attributes
 * - Multiple animation layers and effects
 */
 

import { useApp } from '@/contexts/AppContext';
import { isTruthy } from '@petspark/shared';
import type { Message, ReactionType } from '@/lib/chat-types';
import { cn } from '@/lib/utils';
import {
  ArrowUUpLeft,
  Check,
  Checks,
  Clock,
  Copy,
  Fire,
  Flag,
  HandsPraying,
  Heart,
  MapPin,
  Smiley,
  Star,
  ThumbsDown,
  ThumbsUp,
  Trash,
  Waveform,
  X,
} from '@phosphor-icons/react';
import { memo, useEffect } from 'react';
import { useMotionView } from '@petspark/motion';
import { AnimatedAIWrapper, BubbleWrapperGodTier } from './bubble-wrapper-god-tier';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { DeletedGhostBubble } from './DeletedGhostBubble';
import { UndoDeleteChip } from './UndoDeleteChip';
import { MessagePeek } from './MessagePeek';
import { SmartImage } from '@/components/media/SmartImage';
import { useUIConfig } from '@/hooks/use-ui-config';
import { ensureFocusAppearance } from '@/core/a11y/focus-appearance';
import { ParticleView } from './ParticleView';
import { useMessageBubble } from './hooks/useMessageBubble';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  isClusterStart: boolean;
  isClusterEnd: boolean;
  index?: number;
  isNew?: boolean;
  isHighlighted?: boolean;
  isAIMessage?: boolean;
  variant?: 'ai-answer' | 'user-reply' | 'thread-message' | 'default';
  previousStatus?: Message['status'];
  roomType?: 'direct' | 'group';
  isAdmin?: boolean;
  onReact?: (messageId: string, reaction: ReactionType) => void;
  onReply?: (messageId: string) => void;
  onCopy?: (messageId: string) => void;
  onReport?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onRetry?: (messageId: string) => void;
  onUndo?: (messageId: string) => void;
  showTimestamp?: boolean;
}

const REACTIONS: { type: ReactionType; icon: typeof Heart; label: string }[] = [
  { type: '❤️', icon: Heart, label: 'Love' },
  { type: '😂', icon: Smiley, label: 'Laugh' },
  { type: '👍', icon: ThumbsUp, label: 'Like' },
  { type: '👎', icon: ThumbsDown, label: 'Dislike' },
  { type: '🔥', icon: Fire, label: 'Fire' },
  { type: '🙏', icon: HandsPraying, label: 'Pray' },
  { type: '⭐', icon: Star, label: 'Star' },
];

function MessageBubble({
  message,
  isOwn,
  isClusterStart,
  isClusterEnd,
  index = 0,
  isNew = false,
  isHighlighted = false,
  isAIMessage = false,
  variant = 'default',
  previousStatus,
  roomType = 'direct',
  isAdmin = false,
  onReact,
  onReply,
  onCopy,
  onReport,
  onDelete,
  onRetry,
  onUndo,
  showTimestamp = false,
}: MessageBubbleProps) {
  const _uiConfig = useUIConfig();
  const { t } = useApp();

  // Consolidated hook - handles all state, animations, and effects
  const {
    // Animation hooks
    hoverTilt,
    deliveryTransition,
    typingReveal,
    smartHighlight,
    undoAnimation,
    dropEffect,
    bubbleVariant,
    messageBubbleAnimation,
    voiceWaveform,
    deleteAnimation,
    // Effect hooks
    particleExplosion,
    // UI state
    showReactions,
    setShowReactions,
    showContextMenu,
    showDeleteConfirmation,
    isDeleting,
    setIsDeleting,
    showUndo,
    setShowUndo,
    showPeek,
    setShowPeek,
    peekPosition,
    // Refs
    bubbleRef,
    // Animated values
    contextMenuOpacity,
    contextMenuScale,
    reactionsPickerOpacity,
    reactionsPickerScale,
    reactionsPickerTranslateY,
    // Computed values
    deleteContext,
    stableReference,
    // Handlers
    handleLongPress,
    handleReact,
    handleCopy,
    handleReply,
    handleReport,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,
    handleUndoDelete,
    handleRetry,
  } = useMessageBubble({
    message,
    isOwn,
    isAIMessage,
    isNew,
    isHighlighted,
    variant,
    previousStatus,
    index,
    roomType,
    isAdmin,
    onReact,
    onReply,
    onCopy,
    onReport,
    onDelete,
    onRetry,
    onUndo,
  });

  // Ensure focus appearance on bubble container
  useEffect(() => {
    if (bubbleRef.current) {
      const bubbleElement = bubbleRef.current.querySelector('[class*="rounded-2xl"]')!;
      if (bubbleElement) {
        bubbleElement.setAttribute('id', stableReference.stableId);
        bubbleElement.setAttribute('tabIndex', '0');
        bubbleElement.setAttribute('role', 'article');
        bubbleElement.setAttribute('aria-label', stableReference.ariaLabel);
        if (stableReference.ariaDescription) {
          bubbleElement.setAttribute(
            'aria-describedby',
            `${stableReference.stableId}-description`
          );
        }
        ensureFocusAppearance(bubbleElement as HTMLElement);
      }
    }
  }, [stableReference, bubbleRef]);

  // Extract animation values for easier access
  const {
    opacity: baseOpacity,
    translateY: baseTranslateY,
    scale: baseScale,
    glowOpacity: baseGlowOpacity,
    glowScale: baseGlowScale,
    backgroundOpacity: baseBackgroundOpacity,
    handlePress,
    handlePressIn,
    handlePressOut,
  } = messageBubbleAnimation;

  // Combined animated styles
  const combinedAnimatedStyle = useAnimatedStyle(() => {
    if (isTruthy(isDeleting)) {
      return {
        opacity: deleteAnimation.opacity.value,
        transform: [
          { scale: deleteAnimation.scale.value } as { scale: number },
          { translateY: deleteAnimation.translateY.value } as { translateY: number },
          { translateX: deleteAnimation.translateX.value } as { translateX: number },
          { rotate: `${deleteAnimation.rotation.value}deg` } as { rotate: string },
        ],
        height: deleteAnimation.height.value,
        overflow: 'hidden' as const,
      };
    }

    return {
      opacity:
        baseOpacity.value *
        dropEffect.opacity.value *
        bubbleVariant.opacity.value *
        undoAnimation.opacity.value,
      transform: [
        {
          translateY:
            baseTranslateY.value +
            dropEffect.translateY.value +
            bubbleVariant.translateY.value,
        } as { translateY: number },
        {
          scale:
            baseScale.value *
            dropEffect.scale.value *
            bubbleVariant.scale.value *
            undoAnimation.scale.value,
        } as { scale: number },
        { translateX: undoAnimation.translateX.value } as { translateX: number },
        { rotateX: `${hoverTilt.tiltY.value}deg` } as { rotateX: string },
        { rotateY: `${-hoverTilt.tiltX.value}deg` } as { rotateY: string },
        { translateZ: `${hoverTilt.lift.value}px` } as { translateZ: string },
      ],
    };
  });

  const combinedGlowStyle = useAnimatedStyle(() => {
    return {
      opacity: Math.max(
        baseGlowOpacity.value,
        dropEffect.glowOpacity.value,
        bubbleVariant.glowOpacity.value,
        hoverTilt.glowOpacity.value
      ),
      transform: [
        { scale: baseGlowScale.value } as { scale: number },
        { translateZ: `${hoverTilt.lift.value * 1.5}px` } as { translateZ: string },
      ],
    };
  });

  const combinedBackgroundStyle = useAnimatedStyle(() => {
    const highlightOpacity = smartHighlight.backgroundOpacity.value;

    if (highlightOpacity > 0) {
      return {
        backgroundColor: 'rgba(255, 215, 0, 0.3)',
        opacity: Math.max(baseBackgroundOpacity.value, highlightOpacity),
      };
    }

    return {
      backgroundColor: 'transparent',
      opacity: baseBackgroundOpacity.value,
    };
  });

  const contextMenuStyle = useAnimatedStyle(() => {
    const scale = contextMenuScale.value;
    return {
      opacity: Number(contextMenuOpacity.value),
      transform: [{ scale: Number(scale) } as { scale: number }],
    };
  });

  const reactionsPickerStyle = useAnimatedStyle(() => {
    const scale = reactionsPickerScale.value;
    const translateY = reactionsPickerTranslateY.value;
    return {
      opacity: Number(reactionsPickerOpacity.value),
      transform: [
        { scale: Number(scale) } as { scale: number },
        { translateY: Number(translateY) } as { translateY: number },
      ],
    };
  });

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusIcon = () => {
    const statusStyle = deliveryTransition.animatedStyle;

    if (message.status === 'sending') {
      return (
        <MotionView style={statusStyle}>
          <Clock size={12} className="text-muted-foreground" />
        </MotionView>
      );
    }
    if (message.status === 'failed') {
      return (
        <button
          onClick={() => void handleRetry()}
          className="text-destructive hover:text-destructive/80"
          aria-label="Retry sending"
        >
          <X size={12} />
        </button>
      );
    }
    if (message.status === 'read') {
      return (
        <MotionView style={statusStyle}>
          <Checks size={12} className="text-primary" />
        </MotionView>
      );
    }
    if (message.status === 'delivered') {
      return (
        <MotionView style={statusStyle}>
          <Checks size={12} className="text-muted-foreground" />
        </MotionView>
      );
    }
    return (
      <MotionView style={statusStyle}>
        <Check size={12} className="text-muted-foreground" />
      </MotionView>
    );
  };

  // Early return for deleting state in group chats
  if (isDeleting && roomType === 'group' && !isOwn) {
    return (
      <>
        <DeletedGhostBubble isIncoming={!isOwn} />
        <DeleteConfirmationModal
          isOpen={showDeleteConfirmation}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          messagePreview={message.content.slice(0, 50)}
          context={isAdmin && !isOwn ? 'admin-delete' : 'self-delete'}
        />
      </>
    );
  }

  return (
    <>
      <div
        ref={bubbleRef}
        className={cn(
          'flex items-end gap-2',
          isOwn ? 'flex-row-reverse' : 'flex-row',
          isClusterStart && 'mt-2'
        )}
        onContextMenu={(e) => {
          e.preventDefault();
          handleLongPress();
        }}
      >
        <MotionView
          style={combinedAnimatedStyle}
          className={cn(
            'relative group px-3 py-2 rounded-2xl shadow-sm max-w-[78%]',
            'text-sm leading-relaxed wrap-break-word',
            isOwn
              ? 'bg-linear-to-br from-primary to-accent text-white rounded-br-sm'
              : 'bg-card border border-border text-foreground rounded-bl-sm',
            isClusterEnd && (isOwn ? 'rounded-br-sm' : 'rounded-bl-sm'),
            message.status === 'failed' && 'opacity-75',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus-ring'
          )}
          onMouseMove={hoverTilt.handleMouseMove}
          onMouseLeave={hoverTilt.handleMouseLeave}
          onMouseDown={handlePressIn}
          onMouseUp={handlePress}
          onTouchStart={handlePressIn}
          onTouchEnd={handlePress}
          onTouchCancel={handlePressOut}
        >
          <MotionView
            style={combinedGlowStyle}
            className="absolute inset-0 rounded-2xl pointer-events-none"
          >
            <div />
          </MotionView>
          <MotionView
            style={combinedBackgroundStyle}
            className="absolute inset-0 rounded-2xl pointer-events-none"
          >
            <div />
          </MotionView>

          {/* Message Content */}
          {message.type === 'text' && (
            <BubbleWrapperGodTier
              isAIMessage={isAIMessage}
              messageText={message.content}
              timestamp={message.createdAt}
              deleteContext={deleteContext}
              onDeleteFinish={() => {
                setIsDeleting(false);
                if (roomType === 'group' && !isOwn) {
                  return;
                }
                setShowUndo(true);
                setTimeout(() => {
                  setShowUndo(false);
                }, 5000);
              }}
              enabled={!isDeleting}
            >
              {stableReference.ariaDescription && (
                <div
                  id={`${stableReference.stableId}-description`}
                  className="sr-only"
                >
                  {stableReference.ariaDescription}
                </div>
              )}
              <div className="wrap-break-word whitespace-pre-wrap">
                {isAIMessage && typingReveal.revealedText.length > 0 ? (
                  <AnimatedAIWrapper enabled={true}>
                    <>
                      <MotionView
                        style={typingReveal.animatedStyle}
                      >
                        {typingReveal.revealedText}
                      </MotionView>
                      {!typingReveal.isComplete && (
                        <MotionView
                          style={typingReveal.cursorStyle}
                        >
                          <span className="inline-block w-0.5 h-4 bg-current ml-1 animate-pulse">
                            |
                          </span>
                        </MotionView>
                      )}
                    </>
                  </AnimatedAIWrapper>
                ) : (
                  message.content
                )}
              </div>
            </BubbleWrapperGodTier>
          )}

          {message.type === 'image' && message.metadata?.media && (
            <div className="relative">
              <SmartImage
                src={message.metadata.media.url}
                {...(message.metadata.media.thumbnail
                  ? { lqip: message.metadata.media.thumbnail }
                  : {})}
                alt={message.content ?? 'Image'}
                className="max-w-full h-auto rounded-lg cursor-pointer"
                onLoad={() => {
                  // Image loaded successfully
                }}
                onClick={() => {
                  // Open full-screen image
                  const mediaUrl = message.metadata?.media?.url;
                  if (mediaUrl) {
                    window.open(mediaUrl, '_blank');
                  }
                }}
              />
              {message.content && (
                <p className="mt-2 wrap-break-word whitespace-pre-wrap">
                  {message.content}
                </p>
              )}
            </div>
          )}

          {message.type === 'video' && message.metadata?.media && (
            <div className="relative">
              <video
                src={message.metadata.media.url}
                poster={message.metadata.media.thumbnail}
                controls
                className="max-w-full h-auto rounded-lg"
                preload="metadata"
              />
              {message.content && (
                <p className="mt-2 wrap-break-word whitespace-pre-wrap">
                  {message.content}
                </p>
              )}
            </div>
          )}

          {message.type === 'voice' && message.metadata?.voiceNote && (
            <div className="flex items-center gap-2 min-w-50">
              <Waveform size={20} />
              <div className="flex-1 h-8 bg-muted/50 rounded-full flex items-center gap-1 px-2">
                {voiceWaveform.animatedStyles.map((style, styleIndex) => (
                  <MotionView
                    key={styleIndex}
                    style={style}
                    className="bg-primary w-1 rounded-full"
                  >
                    <div />
                  </MotionView>
                ))}
              </div>
              <span className="text-xs">
                {Math.floor(message.metadata.voiceNote.duration / 60)}:
                {String(
                  Math.floor(message.metadata.voiceNote.duration % 60)
                ).padStart(2, '0')}
              </span>
            </div>
          )}

          {message.type === 'location' && message.metadata?.location && (
            <button
              className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              onClick={() => {
                const location = message.metadata?.location;
                if (location) {
                  const { lat, lng } = location;
                  window.open(
                    `https://www.google.com/maps?q=${lat},${lng}`,
                    '_blank'
                  );
                }
              }}
            >
              <MapPin size={16} />
              <span className="text-xs">
                {message.metadata.location.address ??
                  `${message.metadata.location.lat}, ${message.metadata.location.lng}`}
              </span>
            </button>
          )}

          {message.type === 'sticker' && (
            <div className="text-5xl p-2">{message.content}</div>
          )}

          {/* Reply Preview */}
          {message.metadata?.replyTo && (
            <div
              className={cn(
                'mt-2 pl-3 border-l-2',
                isOwn ? 'border-white/30' : 'border-primary/30'
              )}
            >
              <p className="text-xs opacity-70">
                {t.chat?.replyingTo ?? 'Replying to'}
              </p>
              <p className="text-xs truncate">
                {/* Reference to original message */}
              </p>
            </div>
          )}

          {/* Metadata Row */}
          <div
            className={cn(
              'flex items-center gap-1 mt-1',
              isOwn ? 'justify-end' : 'justify-start'
            )}
          >
            {isOwn && (
              <div className="flex items-center gap-1">{getStatusIcon()}</div>
            )}
            {(showTimestamp || isClusterEnd) && (
              <span
                className={cn(
                  'text-xs',
                  isOwn ? 'text-white/70' : 'text-muted-foreground'
                )}
              >
                {formatTime(message.createdAt)}
              </span>
            )}
          </div>

          {/* Reactions */}
          {message.reactions &&
            (() => {
              // Handle both MessageReaction[] and Record<ReactionType, string[]>
              if (Array.isArray(message.reactions)) {
                if (message.reactions.length === 0) return null;

                const groupedReactions = message.reactions.reduce(
                  (acc, reaction) => {
                    const emoji = reaction.emoji;
                    acc[emoji] ??= [];
                    const emojiArray = acc[emoji];
                    if (emojiArray) {
                      emojiArray.push(reaction);
                    }
                    return acc;
                  },
                  {} as Record<string, typeof message.reactions>
                );

                return (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Object.entries(groupedReactions).map(
                      ([reaction, reactions]) => (
                        <button
                          key={reaction}
                          className={cn(
                            'px-2 py-0.5 rounded-full text-xs flex items-center gap-1',
                            isOwn ? 'bg-white/20' : 'bg-muted'
                          )}
                          onClick={() => handleReact(reaction as ReactionType)}
                        >
                          <span>{reaction}</span>
                          {reactions.length > 1 && (
                            <span>{reactions.length}</span>
                          )}
                        </button>
                      )
                    )}
                  </div>
                );
              } else {
                // Record<ReactionType, string[]>
                const entries = Object.entries(message.reactions);
                if (entries.length === 0) return null;

                return (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {entries.map(([emoji, userIds]) => (
                      <button
                        key={emoji}
                        className={cn(
                          'px-2 py-0.5 rounded-full text-xs flex items-center gap-1',
                          isOwn ? 'bg-white/20' : 'bg-muted'
                        )}
                        onClick={() => handleReact(emoji as ReactionType)}
                      >
                        <span>{emoji}</span>
                        {userIds.length > 1 && <span>{userIds.length}</span>}
                      </button>
                    ))}
                  </div>
                );
              }
            })()}
        </MotionView>

        {/* Context Menu */}
        {showContextMenu && (
          <MotionView
            style={contextMenuStyle}
            className={cn(
              'absolute z-50 bg-card border border-border rounded-lg shadow-lg p-1',
              'flex flex-col gap-1 min-w-40',
              isOwn ? 'right-0' : 'left-0'
            )}
            onClick={(e?: React.MouseEvent) => {
              if (e) {
                e.stopPropagation();
              }
            }}
          >
            <button
              onClick={() => {
                setShowReactions(true);
              }}
              className="flex items-center gap-2 px-3 py-2 hover:bg-muted rounded-md text-sm"
            >
              <Smiley size={16} />
              <span>{t.chat?.react ?? 'React'}</span>
            </button>
            {onReply && (
              <button
                onClick={() => void handleReply()}
                className="flex items-center gap-2 px-3 py-2 hover:bg-muted rounded-md text-sm"
              >
                <ArrowUUpLeft size={16} />
                <span>{t.chat?.reply ?? 'Reply'}</span>
              </button>
            )}
            {onCopy && (
              <button
                onClick={() => void handleCopy()}
                className="flex items-center gap-2 px-3 py-2 hover:bg-muted rounded-md text-sm"
              >
                <Copy size={16} />
                <span>{t.chat?.copy ?? 'Copy'}</span>
              </button>
            )}
            {onReport && !isOwn && (
              <button
                onClick={() => void handleReport()}
                className="flex items-center gap-2 px-3 py-2 hover:bg-destructive/10 text-destructive rounded-md text-sm"
              >
                <Flag size={16} />
                <span>{t.chat?.report ?? 'Report'}</span>
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => void handleDeleteClick()}
                className="flex items-center gap-2 px-3 py-2 hover:bg-destructive/10 text-destructive rounded-md text-sm"
              >
                <Trash size={16} />
                <span>{t.chat?.delete ?? 'Delete'}</span>
              </button>
            )}
          </MotionView>
        )}

        {/* Reactions Picker */}
        {showReactions && (
          <MotionView
            style={reactionsPickerStyle}
            className={cn(
              'absolute z-50 bg-card border border-border rounded-full shadow-lg p-2',
              'flex items-center gap-2',
              isOwn ? 'right-0' : 'left-0',
              '-top-12'
            )}
          >
            {REACTIONS.map(({ type, label }) => (
              <button
                key={type}
                onClick={() => {
                  handleReact(type);
                }}
                className="p-2 hover:bg-muted rounded-full transition-colors"
                aria-label={label}
              >
                <span className="text-xl">{type}</span>
              </button>
            ))}
          </MotionView>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteConfirmation}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        messagePreview={message.content.slice(0, 50)}
        context={isAdmin && !isOwn ? 'admin-delete' : 'self-delete'}
      />

      {/* Undo Delete Chip */}
      {showUndo && <UndoDeleteChip onUndo={handleUndoDelete} />}

      {/* Particle Explosion */}
      {particleExplosion.particles.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-9999">
          {particleExplosion.particles.map((particle) => (
            <ParticleView key={particle.id} particle={particle} />
          ))}
        </div>
      )}

      {/* Message Peek */}
      {showPeek && (
        <MessagePeek
          message={{
            content: message.content,
            senderName: isOwn
              ? message.senderName ?? 'You'
              : message.senderName ?? 'User',
            timestamp: message.timestamp ?? message.createdAt,
            type: message.type,
          }}
          visible={showPeek}
          onClose={() => setShowPeek(false)}
          {...(peekPosition ? { position: peekPosition } : {})}
        />
      )}
    </>
  );
}

// Memoize MessageBubble to prevent unnecessary re-renders
export default memo(MessageBubble, (prev, next) => {
  // Check if reactions have changed (compare length and reference)
  const prevReactions = prev.message.reactions;
  const nextReactions = next.message.reactions;
  const prevArray = Array.isArray(prevReactions) ? prevReactions : [];
  const nextArray = Array.isArray(nextReactions) ? nextReactions : [];
  const reactionsChanged =
    prevReactions !== nextReactions &&
    (!prevReactions ||
      !nextReactions ||
      prevArray.length !== nextArray.length ||
      prevArray.some((r, i) => {
        const prevEmoji = 'emoji' in r ? r.emoji : String(r);
        const nextR = nextArray[i];
        const nextEmoji =
          nextR && ('emoji' in nextR ? nextR.emoji : String(nextR));
        return prevEmoji !== nextEmoji;
      }));

  return (
    prev.message.id === next.message.id &&
    prev.message.status === next.message.status &&
    prev.message.content === next.message.content &&
    prev.message.timestamp === next.message.timestamp &&
    prev.message.createdAt === next.message.createdAt &&
    !reactionsChanged &&
    prev.isOwn === next.isOwn &&
    prev.isClusterStart === next.isClusterStart &&
    prev.isClusterEnd === next.isClusterEnd &&
    prev.showTimestamp === next.showTimestamp &&
    prev.index === next.index &&
    prev.isNew === next.isNew &&
    prev.isHighlighted === next.isHighlighted
  );
});
