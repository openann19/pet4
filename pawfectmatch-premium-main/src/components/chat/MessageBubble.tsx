/**
 * Message Bubble Component
 * 
 * Production-ready chat bubble with proper styling, accessibility, and media support.
 * Handles long BG strings, emojis, reactions, read receipts, and all content types.
 */

import { useState, memo, useEffect, useRef } from 'react'
import { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated'
import { 
  Check, 
  Checks, // Double check icon
  Clock, 
  X, 
  Heart, 
  Smiley, 
  ThumbsUp, 
  ThumbsDown, 
  Fire, 
  HandsPraying, 
  Star,
  Copy,
  ArrowUUpLeft, // Reply icon alternative
  Flag,
  Trash,
  Image as ImageIcon,
  MapPin,
  Waveform
} from '@phosphor-icons/react'
import type { Message, ReactionType } from '@/lib/chat-types'
import { cn } from '@/lib/utils'
import { useApp } from '@/contexts/AppContext'
import { useMessageBubbleAnimation } from '@/hooks/use-message-bubble-animation'
import { useVoiceWaveform } from '@/hooks/use-voice-waveform'
import { useBubbleHoverTilt } from '@/hooks/use-bubble-hover-tilt'
import { useMessageDeliveryTransition } from '@/hooks/use-message-delivery-transition'
import { useAITypingReveal } from '@/hooks/use-ai-typing-reveal'
import { useSmartHighlight } from '@/hooks/use-smart-highlight'
import { useUndoSendAnimation } from '@/hooks/use-undo-send-animation'
import { useNewMessageDrop } from '@/hooks/use-new-message-drop'
import { useBubbleVariant } from '@/hooks/use-bubble-variant'
import { AnimatedView, type AnimatedStyle } from '@/effects/reanimated/animated-view'
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions'
import { DeleteConfirmationModal } from './DeleteConfirmationModal'
import { DeletedGhostBubble } from './DeletedGhostBubble'
import { UndoDeleteChip } from './UndoDeleteChip'
import { useParticleExplosionDelete } from '@/hooks/use-particle-explosion-delete'
import { useDeleteBubbleAnimation, type DeleteAnimationContext } from '@/hooks/use-delete-bubble-animation'
import { BubbleWrapperGodTier, AnimatedAIWrapper } from './bubble-wrapper-god-tier'
import { useParticleBurstOnEvent } from './bubble-wrapper-god-tier/effects/useParticleBurstOnEvent'
import { useHapticFeedback } from './bubble-wrapper-god-tier/effects/useHapticFeedback'

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  isClusterStart: boolean
  isClusterEnd: boolean
  index?: number
  isNew?: boolean
  isHighlighted?: boolean
  isAIMessage?: boolean
  variant?: 'ai-answer' | 'user-reply' | 'thread-message' | 'default'
  previousStatus?: Message['status']
  roomType?: 'direct' | 'group'
  isAdmin?: boolean
  onReact?: (messageId: string, reaction: ReactionType) => void
  onReply?: (messageId: string) => void
  onCopy?: (messageId: string) => void
  onReport?: (messageId: string) => void
  onDelete?: (messageId: string) => void
  onRetry?: (messageId: string) => void
  onUndo?: (messageId: string) => void
  showTimestamp?: boolean
}

const REACTIONS: { type: ReactionType; icon: typeof Heart; label: string }[] = [
  { type: '❤️', icon: Heart, label: 'Love' },
  { type: '😂', icon: Smiley, label: 'Laugh' },
  { type: '👍', icon: ThumbsUp, label: 'Like' },
  { type: '👎', icon: ThumbsDown, label: 'Dislike' },
  { type: '🔥', icon: Fire, label: 'Fire' },
  { type: '🙏', icon: HandsPraying, label: 'Pray' },
  { type: '⭐', icon: Star, label: 'Star' },
]

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
  const { t } = useApp()
  const [showReactions, setShowReactions] = useState(false)
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [isPlayingVoice] = useState(false)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showUndo, setShowUndo] = useState(false)
  const [deletedMessage, setDeletedMessage] = useState<Message | null>(null)
  const bubbleRef = useRef<HTMLDivElement>(null)
  const previousStatusRef = useRef<Message['status'] | undefined>(previousStatus)

  const particleBurst = useParticleBurstOnEvent({ enabled: true })
  const hapticFeedback = useHapticFeedback({ enabled: true })

  // Premium effect hooks
  const hoverTilt = useBubbleHoverTilt({
    enabled: typeof window !== 'undefined' && !isOwn
  })

  const deliveryTransition = useMessageDeliveryTransition({
    status: message.status,
    previousStatus: previousStatusRef.current
  })

  const typingReveal = useAITypingReveal({
    text: message.content,
    enabled: isAIMessage && message.type === 'text',
    typingSpeed: 30
  })

  const smartHighlight = useSmartHighlight({
    isHighlighted,
    highlightColor: 'rgba(255, 215, 0, 0.3)',
    glowColor: 'rgba(59, 130, 246, 0.6)'
  })

  const undoAnimation = useUndoSendAnimation({
    onComplete: () => {
      if (onUndo) {
        onUndo(message.id)
      }
    }
  })

  const dropEffect = useNewMessageDrop({
    isNew,
    delay: index * 50,
    dropHeight: -50,
    bounceIntensity: 15
  })

  const bubbleVariant = useBubbleVariant({
    variant: variant || 'default',
    enabled: isNew,
    delay: index * 30
  })

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
    animateReaction,
    animateHighlight
  } = useMessageBubbleAnimation({
    index,
    staggerDelay: 50,
    isHighlighted,
    isNew,
    onPress: () => {
      // Handle tap
    },
    onLongPress: () => {
      handleLongPress()
      hapticFeedback.trigger('longPress')
    },
    hapticFeedback: true
  })

  const voiceWaveform = useVoiceWaveform({
    waveform: message.metadata?.voiceNote?.waveform ?? [],
    isPlaying: isPlayingVoice,
    barCount: 20
  })

  const contextMenuOpacity = useSharedValue(0)
  const contextMenuScale = useSharedValue(0.95)
  const reactionsPickerOpacity = useSharedValue(0)
  const reactionsPickerScale = useSharedValue(0.9)
  const reactionsPickerTranslateY = useSharedValue(10)

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  useEffect(() => {
    if (showContextMenu) {
      contextMenuOpacity.value = withSpring(1, springConfigs.smooth)
      contextMenuScale.value = withSpring(1, springConfigs.smooth)
    } else {
      contextMenuOpacity.value = withTiming(0, timingConfigs.fast)
      contextMenuScale.value = withTiming(0.95, timingConfigs.fast)
    }
  }, [showContextMenu, contextMenuOpacity, contextMenuScale])

  useEffect(() => {
    if (showReactions) {
      reactionsPickerOpacity.value = withSpring(1, springConfigs.smooth)
      reactionsPickerScale.value = withSpring(1, springConfigs.bouncy)
      reactionsPickerTranslateY.value = withSpring(0, springConfigs.smooth)
    } else {
      reactionsPickerOpacity.value = withTiming(0, timingConfigs.fast)
      reactionsPickerScale.value = withTiming(0.9, timingConfigs.fast)
      reactionsPickerTranslateY.value = withTiming(10, timingConfigs.fast)
    }
  }, [showReactions, reactionsPickerOpacity, reactionsPickerScale, reactionsPickerTranslateY])

  useEffect(() => {
    previousStatusRef.current = message.status
  }, [message.status])

  useEffect(() => {
    if (isHighlighted) {
      smartHighlight.trigger()
      animateHighlight()
    }
  }, [isHighlighted, smartHighlight, animateHighlight])

  const handleLongPress = () => {
    if (isOwn && message.status === 'sending') return
    setShowContextMenu(true)
  }

  const handleReact = (reaction: ReactionType) => {
    if (onReact) {
      onReact(message.id, reaction)
      animateReaction(reaction)
      hapticFeedback.trigger('react')
      
      if (bubbleRef.current) {
        const rect = bubbleRef.current.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2
        particleBurst.triggerBurst('reaction', centerX, centerY, reaction)
      }
    }
    setShowReactions(false)
    setShowContextMenu(false)
  }

  const handleCopy = () => {
    if (onCopy) {
      onCopy(message.id)
    }
    setShowContextMenu(false)
  }

  const handleReply = () => {
    if (onReply) {
      onReply(message.id)
    }
    setShowContextMenu(false)
  }

  const handleReport = () => {
    if (onReport) {
      onReport(message.id)
    }
    setShowContextMenu(false)
  }

  const getDeleteContext = (): DeleteAnimationContext => {
    if (isAdmin && !isOwn) {
      return 'admin-delete'
    }
    if (message.type === 'sticker' || (message.type === 'text' && /^[\p{Emoji}]+$/u.test(message.content))) {
      return 'emoji-media'
    }
    if (roomType === 'group') {
      return 'group-chat'
    }
    return 'self-delete'
  }

  const deleteContext = getDeleteContext()
  const particleExplosion = useParticleExplosionDelete({
    enabled: deleteContext === 'emoji-media'
  })

  const handleDeleteClick = () => {
    setShowDeleteConfirmation(true)
    setShowContextMenu(false)
  }

  const handleDeleteConfirm = () => {
    setShowDeleteConfirmation(false)
    setIsDeleting(true)
    setDeletedMessage(message)

    if (bubbleRef.current) {
      const rect = bubbleRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      if (deleteContext === 'emoji-media') {
        const emojiColors = message.content.match(/[\p{Emoji}]/gu)?.map(() => {
          const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#FFD93D', '#FF6B35']
          return colors[Math.floor(Math.random() * colors.length)] ?? '#FF6B6B'
        }).filter((color): color is string => color !== undefined) ?? ['#FF6B6B', '#4ECDC4', '#45B7D1']

        particleExplosion.triggerExplosion(centerX, centerY, emojiColors)
      }

      particleBurst.triggerBurst('delete', centerX, centerY)
      hapticFeedback.trigger('delete')
    }

    deleteAnimation.triggerDelete()

    setTimeout(() => {
      if (onDelete) {
        onDelete(message.id)
      }
    }, 350)
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirmation(false)
  }

  const handleUndoDelete = () => {
    setShowUndo(false)
    setIsDeleting(false)
    setDeletedMessage(null)
    if (onUndo && deletedMessage) {
      onUndo(deletedMessage.id)
    }
  }

  const handleRetry = () => {
    if (onRetry) {
      onRetry(message.id)
    }
  }

  const getStatusIcon = () => {
    const statusStyle = deliveryTransition.animatedStyle as AnimatedStyle

    if (message.status === 'sending') {
      return (
        <AnimatedView style={statusStyle}>
          <Clock size={12} className="text-muted-foreground" />
        </AnimatedView>
      )
    }
    if (message.status === 'failed') {
      return (
        <button
          onClick={handleRetry}
          className="text-destructive hover:text-destructive/80"
          aria-label="Retry sending"
        >
          <X size={12} />
        </button>
      )
    }
    if (message.status === 'read') {
      return (
        <AnimatedView style={statusStyle}>
          <Checks size={12} className="text-primary" />
        </AnimatedView>
      )
    }
    if (message.status === 'delivered') {
      return (
        <AnimatedView style={statusStyle}>
          <Checks size={12} className="text-muted-foreground" />
        </AnimatedView>
      )
    }
    return (
      <AnimatedView style={statusStyle}>
        <Check size={12} className="text-muted-foreground" />
      </AnimatedView>
    )
  }

  const contextMenuStyle = useAnimatedStyle(() => {
    return {
      opacity: contextMenuOpacity.value,
      transform: [{ scale: contextMenuScale.value }]
    }
  })

  const reactionsPickerStyle = useAnimatedStyle(() => {
    return {
      opacity: reactionsPickerOpacity.value,
      transform: [
        { scale: reactionsPickerScale.value },
        { translateY: reactionsPickerTranslateY.value }
      ]
    }
  })

  const deleteAnimation = useDeleteBubbleAnimation({
    context: deleteContext,
    onFinish: () => {
      setIsDeleting(false)
      if (roomType === 'group' && !isOwn) {
        return
      }
      setShowUndo(true)
      setTimeout(() => {
        setShowUndo(false)
      }, 5000)
    },
    hapticFeedback: true
  })

  const combinedAnimatedStyle = useAnimatedStyle(() => {
    if (isDeleting) {
      return {
        opacity: deleteAnimation.opacity.value,
        transform: [
          { scale: deleteAnimation.scale.value },
          { translateY: deleteAnimation.translateY.value },
          { translateX: deleteAnimation.translateX.value },
          { rotate: `${deleteAnimation.rotation.value}deg` }
        ],
        height: deleteAnimation.height.value,
        overflow: 'hidden' as const
      } as ReturnType<typeof useAnimatedStyle>
    }

    return {
      opacity: baseOpacity.value * dropEffect.opacity.value * bubbleVariant.opacity.value * undoAnimation.opacity.value,
      transform: [
        { translateY: baseTranslateY.value + dropEffect.translateY.value + bubbleVariant.translateY.value },
        { scale: baseScale.value * dropEffect.scale.value * bubbleVariant.scale.value * undoAnimation.scale.value },
        { translateX: undoAnimation.translateX.value },
        { rotateX: `${hoverTilt.tiltY.value}deg` },
        { rotateY: `${-hoverTilt.tiltX.value}deg` },
        { translateZ: `${hoverTilt.lift.value}px` }
      ]
    } as ReturnType<typeof useAnimatedStyle>
  })

  const combinedGlowStyle = useAnimatedStyle(() => {
    return {
      opacity: Math.max(baseGlowOpacity.value, dropEffect.glowOpacity.value, bubbleVariant.glowOpacity.value, hoverTilt.glowOpacity.value),
      transform: [
        { scale: baseGlowScale.value },
        { translateZ: `${hoverTilt.lift.value * 1.5}px` }
      ]
    } as ReturnType<typeof useAnimatedStyle>
  })

  const combinedBackgroundStyle = useAnimatedStyle(() => {
    const highlightOpacity = smartHighlight.backgroundOpacity.value
    
    if (highlightOpacity > 0) {
      return {
        backgroundColor: 'rgba(255, 215, 0, 0.3)',
        opacity: Math.max(baseBackgroundOpacity.value, highlightOpacity)
      }
    }
    
    return {
      backgroundColor: 'transparent',
      opacity: baseBackgroundOpacity.value
    }
  })

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
    )
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
        e.preventDefault()
        handleLongPress()
      }}
    >
      <AnimatedView
        style={combinedAnimatedStyle as AnimatedStyle}
        className={cn(
          'relative group px-3 py-2 rounded-2xl shadow-sm max-w-[78%]',
          'text-sm leading-relaxed wrap-break-word',
          isOwn
            ? 'bg-linear-to-br from-primary to-accent text-white rounded-br-sm'
            : 'bg-card border border-border text-foreground rounded-bl-sm',
          isClusterEnd && (isOwn ? 'rounded-br-sm' : 'rounded-bl-sm'),
          message.status === 'failed' && 'opacity-75',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
        )}
        onMouseMove={hoverTilt.handleMouseMove}
        onMouseLeave={hoverTilt.handleMouseLeave}
        onMouseDown={handlePressIn}
        onMouseUp={handlePress}
        onTouchStart={handlePressIn}
        onTouchEnd={handlePress}
        onTouchCancel={handlePressOut}
      >
        <AnimatedView
          style={combinedGlowStyle as AnimatedStyle}
          className="absolute inset-0 rounded-2xl pointer-events-none"
        >
          <div />
        </AnimatedView>
        <AnimatedView
          style={combinedBackgroundStyle as AnimatedStyle}
          className="absolute inset-0 rounded-2xl pointer-events-none"
        >
          <div />
        </AnimatedView>
        {/* Message Content */}
        {message.type === 'text' && (
          <BubbleWrapperGodTier
            isAIMessage={isAIMessage}
            messageText={message.content}
            timestamp={message.createdAt}
            deleteContext={deleteContext}
            onDeleteFinish={() => {
              setIsDeleting(false)
              if (roomType === 'group' && !isOwn) {
                return
              }
              setShowUndo(true)
              setTimeout(() => {
                setShowUndo(false)
              }, 5000)
            }}
            enabled={!isDeleting}
          >
            <div className="wrap-break-word whitespace-pre-wrap">
              {isAIMessage && typingReveal.revealedText.length > 0 ? (
                <AnimatedAIWrapper enabled={true}>
                  <>
                    <AnimatedView style={typingReveal.animatedStyle as AnimatedStyle}>
                      {typingReveal.revealedText}
                    </AnimatedView>
                    {!typingReveal.isComplete && (
                      <AnimatedView style={typingReveal.cursorStyle as AnimatedStyle}>
                        <span className="inline-block w-0.5 h-4 bg-current ml-1 animate-pulse">|</span>
                      </AnimatedView>
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
            {imageError ? (
              <div className="flex items-center justify-center w-48 h-48 bg-muted rounded-lg">
                <ImageIcon size={32} className="text-muted-foreground" />
              </div>
            ) : (
              <img
                src={message.metadata.media.url}
                alt={message.content || 'Image'}
                className="max-w-full h-auto rounded-lg cursor-pointer"
                onError={() => setImageError(true)}
                onClick={() => {
                  // Open full-screen image
                  window.open(message.metadata!.media!.url, '_blank')
                }}
                loading="lazy"
              />
            )}
            {message.content && (
              <p className="mt-2 wrap-break-word whitespace-pre-wrap">{message.content}</p>
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
              <p className="mt-2 wrap-break-word whitespace-pre-wrap">{message.content}</p>
            )}
          </div>
        )}

        {message.type === 'voice' && message.metadata?.voiceNote && (
          <div className="flex items-center gap-2 min-w-[200px]">
            <Waveform size={20} />
            <div className="flex-1 h-8 bg-muted/50 rounded-full flex items-center gap-1 px-2">
              {voiceWaveform.animatedStyles.map((style, index) => (
                <AnimatedView
                  key={index}
                  style={style as AnimatedStyle}
                  className="bg-primary w-1 rounded-full"
                >
                  <div />
                </AnimatedView>
              ))}
            </div>
            <span className="text-xs">
              {Math.floor(message.metadata.voiceNote.duration / 60)}:
              {String(Math.floor(message.metadata.voiceNote.duration % 60)).padStart(2, '0')}
            </span>
          </div>
        )}

        {message.type === 'location' && message.metadata?.location && (
          <button
            className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
            onClick={() => {
              const { lat, lng } = message.metadata!.location!
              window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank')
            }}
          >
            <MapPin size={16} />
            <span className="text-xs">
              {message.metadata.location.address || `${message.metadata.location.lat}, ${message.metadata.location.lng}`}
            </span>
          </button>
        )}

        {message.type === 'sticker' && (
          <div className="text-5xl p-2">{message.content}</div>
        )}

        {/* Reply Preview */}
        {message.metadata?.replyTo && (
          <div className={cn(
            'mt-2 pl-3 border-l-2',
            isOwn ? 'border-white/30' : 'border-primary/30'
          )}>
            <p className="text-xs opacity-70">
              {t.chat?.replyingTo || 'Replying to'}
            </p>
            <p className="text-xs truncate">
              {/* Reference to original message */}
            </p>
          </div>
        )}

        {/* Metadata Row */}
        <div className={cn(
          'flex items-center gap-1 mt-1',
          isOwn ? 'justify-end' : 'justify-start'
        )}>
          {isOwn && (
            <div className="flex items-center gap-1">
              {getStatusIcon()}
            </div>
          )}
          {(showTimestamp || isClusterEnd) && (
            <span className={cn(
              'text-xs',
              isOwn ? 'text-white/70' : 'text-muted-foreground'
            )}>
              {formatTime(message.createdAt)}
            </span>
          )}
        </div>

        {/* Reactions */}
        {message.reactions && (() => {
          // Handle both MessageReaction[] and Record<ReactionType, string[]>
          if (Array.isArray(message.reactions)) {
            if (message.reactions.length === 0) return null
            
            const groupedReactions = message.reactions.reduce((acc, reaction) => {
              const emoji = reaction.emoji
              if (!acc[emoji]) {
                acc[emoji] = []
              }
              const emojiArray = acc[emoji]
              if (emojiArray) {
                emojiArray.push(reaction)
              }
              return acc
            }, {} as Record<string, typeof message.reactions>)
            
            return (
              <div className="flex flex-wrap gap-1 mt-1">
                {Object.entries(groupedReactions).map(([reaction, reactions]) => (
                  <button
                    key={reaction}
                    className={cn(
                      'px-2 py-0.5 rounded-full text-xs flex items-center gap-1',
                      isOwn ? 'bg-white/20' : 'bg-muted'
                    )}
                    onClick={() => handleReact(reaction as ReactionType)}
                  >
                    <span>{reaction}</span>
                    {reactions.length > 1 && <span>{reactions.length}</span>}
                  </button>
                ))}
              </div>
            )
          } else {
            // Record<ReactionType, string[]>
            const entries = Object.entries(message.reactions)
            if (entries.length === 0) return null
            
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
            )
          }
        })()}
      </AnimatedView>

      {/* Context Menu */}
      {showContextMenu && (
        <AnimatedView
          style={contextMenuStyle}
          className={cn(
            'absolute z-50 bg-card border border-border rounded-lg shadow-lg p-1',
            'flex flex-col gap-1 min-w-[160px]',
            isOwn ? 'right-0' : 'left-0'
          )}
          onClick={(e?: React.MouseEvent) => {
            if (e) {
              e.stopPropagation()
            }
          }}
        >
            <button
              onClick={() => setShowReactions(true)}
              className="flex items-center gap-2 px-3 py-2 hover:bg-muted rounded-md text-sm"
            >
              <Smiley size={16} />
              <span>{t.chat?.react || 'React'}</span>
            </button>
            {onReply && (
              <button
                onClick={handleReply}
                className="flex items-center gap-2 px-3 py-2 hover:bg-muted rounded-md text-sm"
              >
                <ArrowUUpLeft size={16} />
                <span>{t.chat?.reply || 'Reply'}</span>
              </button>
            )}
            {onCopy && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-3 py-2 hover:bg-muted rounded-md text-sm"
              >
                <Copy size={16} />
                <span>{t.chat?.copy || 'Copy'}</span>
              </button>
            )}
            {onReport && !isOwn && (
              <button
                onClick={handleReport}
                className="flex items-center gap-2 px-3 py-2 hover:bg-destructive/10 text-destructive rounded-md text-sm"
              >
                <Flag size={16} />
                <span>{t.chat?.report || 'Report'}</span>
              </button>
            )}
            {onDelete && (
              <button
                onClick={handleDeleteClick}
                className="flex items-center gap-2 px-3 py-2 hover:bg-destructive/10 text-destructive rounded-md text-sm"
              >
                <Trash size={16} />
                <span>{t.chat?.delete || 'Delete'}</span>
              </button>
            )}
        </AnimatedView>
      )}

      {/* Reactions Picker */}
      {showReactions && (
        <AnimatedView
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
                onClick={() => handleReact(type)}
                className="p-2 hover:bg-muted rounded-full transition-colors"
                aria-label={label}
              >
                <span className="text-xl">{type}</span>
              </button>
          ))}
        </AnimatedView>
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
    {showUndo && (
      <UndoDeleteChip onUndo={handleUndoDelete} />
    )}

    {/* Particle Explosion */}
    {particleExplosion.particles.length > 0 && (
      <div className="fixed inset-0 pointer-events-none z-[9999]">
        {particleExplosion.particles.map((particle) => (
          <AnimatedView
            key={particle.id}
            style={particleExplosion.getParticleStyle(particle) as AnimatedStyle}
          >
            <div />
          </AnimatedView>
        ))}
      </div>
    )}
  </>
  )
}

// Memoize MessageBubble to prevent unnecessary re-renders
export default memo(MessageBubble, (prev, next) => {
  // Check if reactions have changed (compare length and reference)
  const prevReactions = prev.message.reactions
  const nextReactions = next.message.reactions
  const prevArray = Array.isArray(prevReactions) ? prevReactions : []
  const nextArray = Array.isArray(nextReactions) ? nextReactions : []
  const reactionsChanged = prevReactions !== nextReactions && (
    !prevReactions || !nextReactions ||
    prevArray.length !== nextArray.length ||
    prevArray.some((r, i) => {
      const prevEmoji = 'emoji' in r ? r.emoji : String(r)
      const nextR = nextArray[i]
      const nextEmoji = nextR && ('emoji' in nextR ? nextR.emoji : String(nextR))
      return prevEmoji !== nextEmoji
    })
  )
  
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
  )
})

