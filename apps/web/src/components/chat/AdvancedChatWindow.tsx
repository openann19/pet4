import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTypingManager } from '@/hooks/use-typing-manager'
import { useStorage } from '@/hooks/useStorage'
import { blockService } from '@/lib/block-service'
import type { ChatMessage, ChatRoom, MessageReaction, MessageTemplate, ReactionType, SmartSuggestion } from '@/lib/chat-types'
import { MESSAGE_TEMPLATES, REACTION_EMOJIS } from '@/lib/chat-types'
import {
  CHAT_STICKERS,
  formatChatTime,
  generateMessageId,
  groupMessagesByDate
} from '@/lib/chat-utils'
import { haptics } from '@/lib/haptics'
import { buildLLMPrompt } from '@/lib/llm-prompt'
import { llmService } from '@/lib/llm-service'
import { parseLLMError } from '@/lib/llm-utils'
import { createLogger } from '@/lib/logger'
import { realtime } from '@/lib/realtime'
import {
  ArrowLeft,
  DotsThree,
  MapPin,
  Microphone,
  PaperPlaneRight,
  Smiley,
  Sparkle,
  Translate as TranslateIcon,
  X
} from '@phosphor-icons/react'
import { AnimatedView } from '@/effects/reanimated/animated-view'
import { useEntryAnimation } from '@/effects/reanimated/use-entry-animation'
import { useHoverAnimation } from '@/effects/reanimated/use-hover-animation'
import { AnimatePresence } from '@/effects/reanimated/animate-presence'
import { useEffect, useRef, useState } from 'react'
import { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { springConfigs } from '@/effects/reanimated/transitions'
import type { AnimatedStyle } from '@/effects/reanimated/animated-view'
import { toast } from 'sonner'
import { useSendWarp } from '@/effects/chat/bubbles/use-send-warp'
import { useReceiveAirCushion } from '@/effects/chat/bubbles/use-receive-air-cushion'
import { useReactionBurst } from '@/effects/chat/reactions/use-reaction-burst'
import { useScrollFabMagnetic } from '@/effects/chat/ui/use-scroll-fab-magnetic'
import MessageAttachments from './MessageAttachments'
import MessageReactions from './MessageReactions'
import SmartSuggestionsPanel from './SmartSuggestionsPanel'
import TypingIndicatorComponent from './TypingIndicator'
import VoiceRecorder from './VoiceRecorder'
import { WebBubbleWrapper } from './WebBubbleWrapper'
import { LiquidDots } from './LiquidDots'
import { PresenceAvatar } from './PresenceAvatar'
import { ConfettiBurst } from './ConfettiBurst'
import { ReactionBurstParticles } from './ReactionBurstParticles'
import { VoiceWaveform } from './VoiceWaveform'

const logger = createLogger('AdvancedChatWindow')

function StickerButton({ sticker, onSelect }: { sticker: { id: string; emoji: string }; onSelect: (emoji: string) => void }) {
  const hover = useHoverAnimation({ scale: 1.2 })
  
  return (
    <AnimatedView
      style={hover.animatedStyle}
      onMouseEnter={hover.handleMouseEnter}
      onMouseLeave={hover.handleMouseLeave}
      onMouseDown={hover.handleMouseDown}
      onMouseUp={hover.handleMouseUp}
      onClick={() => onSelect(sticker.emoji)}
      className="text-3xl p-2 rounded-xl hover:bg-white/20 transition-colors cursor-pointer"
    >
      {sticker.emoji}
    </AnimatedView>
  )
}

function ReactionButton({ emoji }: { emoji: string }) {
  const hover = useHoverAnimation({ scale: 1.2 })
  
  return (
    <AnimatedView
      style={hover.animatedStyle}
      onMouseEnter={hover.handleMouseEnter}
      onMouseLeave={hover.handleMouseLeave}
      onMouseDown={hover.handleMouseDown}
      onMouseUp={hover.handleMouseUp}
      className="text-2xl p-2 rounded-xl hover:bg-white/20 transition-colors cursor-pointer"
    >
      {emoji}
    </AnimatedView>
  )
}

function SendButtonIcon() {
  const translateX = useSharedValue(0)
  const scale = useSharedValue(1)
  
  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: scale.value }
    ]
  })) as AnimatedStyle
  
  const handleMouseEnter = () => {
    translateX.value = withSpring(5, springConfigs.smooth)
  }
  
  const handleMouseLeave = () => {
    translateX.value = withSpring(0, springConfigs.smooth)
  }
  
  const handleMouseDown = () => {
    scale.value = withSpring(0.9, springConfigs.smooth)
  }
  
  const handleMouseUp = () => {
    scale.value = withSpring(1, springConfigs.smooth)
  }
  
  return (
    <AnimatedView 
      style={iconStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <PaperPlaneRight size={20} weight="fill" />
    </AnimatedView>
  )
}

function TemplatePanel({ onClose, onSelect }: { onClose: () => void; onSelect: (template: MessageTemplate) => void }) {
  const animation = useEntryAnimation({ initialY: -10, delay: 0 })
  
  return (
    <AnimatedView
      style={animation.animatedStyle}
      className="glass-effect p-3 rounded-xl space-y-2"
    >
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Message Templates</h4>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onClose}
        >
          <X size={14} />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {MESSAGE_TEMPLATES.slice(0, 4).map((template) => (
          <TemplateButton
            key={template.id}
            template={template}
            onSelect={onSelect}
          />
        ))}
      </div>
    </AnimatedView>
  )
}

function TemplateButton({ template, onSelect }: { template: MessageTemplate; onSelect: (template: MessageTemplate) => void }) {
  const templateHover = useHoverAnimation({ scale: 1.02 })
  
  return (
    <AnimatedView
      style={templateHover.animatedStyle}
      onMouseEnter={templateHover.handleMouseEnter}
      onMouseLeave={templateHover.handleMouseLeave}
      onMouseDown={templateHover.handleMouseDown}
      onMouseUp={templateHover.handleMouseUp}
      onClick={() => onSelect(template)}
      className="text-left p-2 rounded-lg glass-effect hover:bg-white/20 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-2 mb-1">
        <span>{template.icon}</span>
        <span className="text-xs font-semibold">{template.title}</span>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2">
        {template.content}
      </p>
    </AnimatedView>
  )
}

function TypingIndicator({ users }: { users: Array<{ userName?: string }> }) {
  const animation = useEntryAnimation({ initialY: 20, delay: 0 })
  
  return (
    <AnimatedView
      style={animation.animatedStyle}
      className="flex items-end gap-2 flex-row"
    >
      <Avatar className="w-8 h-8 ring-2 ring-white/20 shrink-0">
        <AvatarFallback className="bg-linear-to-br from-secondary to-primary text-white text-xs font-bold">
          {users[0]?.userName?.[0] || '?'}
        </AvatarFallback>
      </Avatar>
      <WebBubbleWrapper
        showTyping
        isIncoming
      >
        <LiquidDots enabled dotColor="#9ca3af" />
      </WebBubbleWrapper>
    </AnimatedView>
  )
}

function DateGroup({ date, delay }: { date: string; delay: number }) {
  const animation = useEntryAnimation({ initialScale: 0.8, delay })
  
  return (
    <AnimatedView style={animation.animatedStyle} className="flex justify-center">
      <div className="glass-effect px-4 py-1.5 rounded-full text-xs font-medium text-muted-foreground shadow-sm">
        {date}
      </div>
    </AnimatedView>
  )
}

function MessageItem({ 
  message, 
  isCurrentUser, 
  currentUserId, 
  delay,
  onReaction,
  onTranslate
}: { 
  message: ChatMessage
  isCurrentUser: boolean
  currentUserId: string
  delay: number
  onReaction: (messageId: string, emoji: string) => void
  onTranslate: (messageId: string) => void
}) {
  const bubbleHover = useHoverAnimation({ scale: 1.02 })
  
  // Premium send/receive effects
  const sendWarp = useSendWarp({
    enabled: isCurrentUser && message.status === 'sent',
    onStatusChange: (status) => {
      if (status === 'sent') {
        // Status change handled by effect
      }
    },
  })
  
  const receiveAir = useReceiveAirCushion({
    enabled: !isCurrentUser,
    isNew: delay < 100, // Consider messages with low delay as new
    isMention: false, // TODO: detect mentions
  })
  
  // Combine entry animation with send/receive effects
  const messageAnimation = useEntryAnimation({ 
    initialY: 20, 
    initialScale: 0.95, 
    delay 
  })
  
  // Trigger send warp when message is sent
  useEffect(() => {
    if (isCurrentUser && message.status === 'sent') {
      sendWarp.trigger()
    }
  }, [isCurrentUser, message.status, sendWarp])
  
  // Combine all animations
  const combinedStyle = useAnimatedStyle(() => {
    const entryStyle = messageAnimation.animatedStyle
    const effectStyle = isCurrentUser ? sendWarp.animatedStyle : receiveAir.animatedStyle
    
    return {
      ...entryStyle,
      ...effectStyle,
    }
  })
  
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
            
            {message.type === 'sticker' && (
              <div className="text-5xl p-2">
                {message.content}
              </div>
            )}

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
                onReaction(message.id, emoji)
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
  )
}

interface AdvancedChatWindowProps {
  room: ChatRoom
  currentUserId: string
  currentUserName: string
  currentUserAvatar?: string
  onBack?: () => void
}

export default function AdvancedChatWindow({ 
  room, 
  currentUserId,
  currentUserName,
  currentUserAvatar,
  onBack 
}: AdvancedChatWindowProps) {
  const [messages, setMessages] = useStorage<ChatMessage[]>(`chat-messages-${room.id}`, [])
  const [inputValue, setInputValue] = useState('')
  const [showStickers, setShowStickers] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [isRecordingVoice, setIsRecordingVoice] = useState(false)
  const [showSmartSuggestions, setShowSmartSuggestions] = useState(true)
  const [awayMode, setAwayMode] = useStorage<boolean>(`away-mode-${currentUserId}`, false)
  const [scrollFabVisible, setScrollFabVisible] = useState(false)
  const [previousBadgeCount, setPreviousBadgeCount] = useState(0)
  
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  // Visual celebration seeds (force restart on increment)
  const [burstSeed, setBurstSeed] = useState(0)
  const [confettiSeed, setConfettiSeed] = useState(0)
  
  // Scroll FAB magnetic effect
  const scrollFab = useScrollFabMagnetic({
    enabled: true,
    isVisible: scrollFabVisible,
    badgeCount: messages?.length ?? 0,
    previousBadgeCount,
  })

  const {
    typingUsers,
    handleInputChange: handleTypingInputChange,
    handleMessageSend: handleTypingMessageSend
  } = useTypingManager({
    roomId: room.id,
    currentUserId,
    currentUserName,
    realtimeClient: realtime
  })

  useEffect(() => {
    scrollToBottom()
  }, [messages])
  
  useEffect(() => {
    // Update badge count for scroll FAB
    const currentCount = messages?.length ?? 0
    if (currentCount > previousBadgeCount) {
      setPreviousBadgeCount(previousBadgeCount)
    }
  }, [messages, previousBadgeCount])

  useEffect(() => {
    if (typingUsers.length > 0) {
      scrollToBottom()
    }
  }, [typingUsers])
  
  // Show scroll FAB when not at bottom
  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
        setScrollFabVisible(!isNearBottom)
      }
    }
    
    const scrollElement = scrollRef.current
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll)
      handleScroll() // Initial check
      return () => {
        scrollElement.removeEventListener('scroll', handleScroll)
      }
    }
    return undefined
  }, [messages])

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }


  const handleSendMessage = async (
    content: string, 
    type: ChatMessage['type'] = 'text',
    attachments?: ChatMessage['attachments'],
    metadata?: ChatMessage['metadata']
  ) => {
    if (!content.trim() && type === 'text' && !attachments?.length) return

    haptics.trigger('light')

    const newMessage: ChatMessage = {
      id: generateMessageId(),
      roomId: room.id,
      senderId: currentUserId,
      senderName: currentUserName,
      ...(currentUserAvatar ? { senderAvatar: currentUserAvatar } : {}),
      content: type === 'text' ? content.trim() : content,
      type,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      status: 'sent',
      reactions: [],
      ...(attachments ? { attachments } : {}),
      ...(metadata ? { metadata } : {}),
    }

    setMessages((current) => [...(current || []), newMessage])
    setInputValue('')
    setShowStickers(false)
    setShowTemplates(false)
    setShowSmartSuggestions(false)
    handleTypingMessageSend()
    
    toast.success('Message sent!', {
      duration: 1500,
      position: 'top-center'
    })

    // big moment → confetti (stickers / special payloads)
    if (type === 'sticker' || type === 'pet-card') {
      setConfettiSeed((s) => s + 1)
    }

    setTimeout(() => {
      setShowSmartSuggestions(true)
    }, 2000)
  }

  const handleInputChange = (value: string) => {
    setInputValue(value)
    handleTypingInputChange(value)
  }

  const handleReaction = (messageId: string, emoji: string) => {
    haptics.trigger('selection')
    
    setMessages((current) => 
      (current || []).map(msg => {
        if (msg.id === messageId) {
          const reactions = Array.isArray(msg.reactions) ? msg.reactions : []
          const existingReaction = reactions.find(r => r.userId === currentUserId)
          
          if (existingReaction && existingReaction.emoji === emoji) {
            return {
              ...msg,
              reactions: reactions.filter(r => r.userId !== currentUserId)
            }
          } else if (existingReaction) {
            return {
              ...msg,
              reactions: reactions.map(r => 
                r.userId === currentUserId 
                  ? { ...r, emoji, timestamp: new Date().toISOString() }
                  : r
              )
            }
          } else {
            const newReaction: MessageReaction = {
              emoji: emoji as ReactionType,
              userId: currentUserId,
              userName: currentUserName,
              timestamp: new Date().toISOString(),
              ...(currentUserAvatar !== undefined && currentUserAvatar !== null ? { userAvatar: currentUserAvatar } : {})
            }
            return {
              ...msg,
              reactions: [...reactions, newReaction]
            }
          }
        }
        return msg
      })
    )
  }
  
  // Reaction burst effect for visual feedback (triggered on reaction add)
  const reactionBurst = useReactionBurst({
    enabled: true,
    onComplete: () => {
      // Effect completed
    },
  })
  
  // Enhanced reaction handler with burst effect
  const handleReactionWithBurst = (messageId: string, emoji: string) => {
    handleReaction(messageId, emoji)
    // restart the ring burst with a fresh deterministic seed
    setBurstSeed((s) => s + 1)
    // keep your internal hook if used elsewhere
    reactionBurst.trigger?.()
  }

  const handleVoiceRecorded = (audioBlob: Blob, duration: number, waveform: number[]) => {
    const voiceUrl = URL.createObjectURL(audioBlob)
    
    handleSendMessage(
      'Voice message',
      'voice',
      [{
        id: generateMessageId(),
        type: 'voice',
        url: voiceUrl,
        duration,
        mimeType: audioBlob.type
      }],
      {
        voiceNote: {
          duration,
          waveform
        }
      }
    )
  }

  const handleTemplateSelect = (template: MessageTemplate) => {
    setInputValue(template.content || template.text || '')
    setShowTemplates(false)
    inputRef.current?.focus()
  }

  const handleSuggestionSelect = (suggestion: SmartSuggestion) => {
    handleSendMessage(suggestion.text, 'text')
  }

  const handleShareLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          handleSendMessage(
            'Shared my location',
            'location',
            undefined,
            {
              location: {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                address: 'Current Location'
              }
            }
          )
          toast.success('Location shared!')
        },
        () => {
          toast.error('Unable to access location')
        }
      )
    } else {
      toast.error('Geolocation not supported')
    }
  }

  const handleTranslateMessage = async (messageId: string) => {
    const message = (messages || []).find(m => m.id === messageId)
    if (!message) return

    try {
  const prompt = buildLLMPrompt`Translate the following message to English. Return only the translated text without any explanation: "${message.content}"`
  const translated = await llmService.llm(prompt, 'gpt-4o-mini')

      setMessages((current) =>
        (current || []).map(msg =>
          msg.id === messageId
            ? {
                ...msg,
                metadata: {
                  ...msg.metadata,
                  translation: {
                    originalLang: 'auto',
                    targetLang: 'en',
                    translatedText: translated
                  }
                }
              }
            : msg
        )
      )
      toast.success('Message translated!')
    } catch (error) {
      const errorInfo = parseLLMError(error)
      logger.error('Translation failed', error instanceof Error ? error : new Error(String(error)), { technicalMessage: errorInfo.technicalMessage })
      toast.error('Translation failed', {
        description: errorInfo.userMessage,
        duration: 5000,
      })
    }
  }

  const messageGroups = groupMessagesByDate(messages || [])
  const headerAnimation = useEntryAnimation({ initialY: -20, delay: 0 })
  const footerAnimation = useEntryAnimation({ initialY: 20, delay: 0 })

  return (
    <div className="flex flex-col h-full relative">
      <AnimatedView
        style={headerAnimation.animatedStyle}
        className="glass-strong border-b border-white/20 p-4 shadow-xl backdrop-blur-2xl"
      >
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="md:hidden"
            >
              <ArrowLeft size={20} />
            </Button>
          )}
          
          <Avatar className="w-10 h-10 ring-2 ring-white/30">
            <AvatarImage src={room.matchedPetPhoto} alt={room.matchedPetName} />
            <AvatarFallback className="bg-linear-to-br from-primary to-accent text-white font-bold">
              {room.matchedPetName?.[0] || '?'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <h2 className="font-bold text-foreground">{room.matchedPetName}</h2>
            {typingUsers.length > 0 && (
              <TypingIndicatorComponent users={typingUsers} />
            )}
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <DotsThree size={24} weight="bold" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 glass-strong">
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => setAwayMode((prev) => !prev)}
                >
                  {awayMode ? '🟢 Available' : '🌙 Away Mode'}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive"
                  onClick={async () => {
                    if (!room || !currentUserId) return
                    
                    try {
                      const otherUserId = room.participantIds.find(id => id !== currentUserId)
                      if (!otherUserId) return
                      
                      // Show confirmation dialog
                      const confirmed = window.confirm(
                        'Are you sure you want to block this user? You will no longer see their messages or matches.'
                      )
                      
                      if (confirmed) {
                        await blockService.blockUser(currentUserId, otherUserId, 'harassment')
                        toast.success('User blocked successfully')
                        // Close chat or navigate away
                        onBack?.()
                      }
                    } catch (error) {
                      toast.error('Failed to block user')
                      logger.error('Failed to block user', error)
                    }
                  }}
                >
                  🚫 Block User
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </AnimatedView>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-6"
      >
        {messageGroups.map((group, groupIdx) => (
          <div key={group.date} className="space-y-4">
            <DateGroup date={group.date} delay={groupIdx * 100} />

            {group.messages.map((message, msgIdx) => {
              const isCurrentUser = message.senderId === currentUserId
              
              return (
                <MessageItem
                  key={message.id}
                  message={message}
                  isCurrentUser={isCurrentUser}
                  currentUserId={currentUserId}
                  delay={msgIdx * 50}
                  onReaction={handleReactionWithBurst}
                  onTranslate={handleTranslateMessage}
                />
              )
            })}
            </div>
          ))}

          {typingUsers.length > 0 && (
            <AnimatePresence>
              <TypingIndicator key="typing-indicators" users={typingUsers} />
            </AnimatePresence>
          )}

        {/* Overlays — reaction ring + confetti (mounted once, restart via seed) */}
        {/* Only render when seeds > 0 to avoid initial mount animations */}
        {burstSeed > 0 && (
          <ReactionBurstParticles
            key={`burst-${burstSeed}`}
            enabled={true}
            seed={`reaction-${room.id}-${burstSeed}`}
            className="pointer-events-none fixed inset-0 z-50"
            onComplete={() => {
              // Effect completed, can reset seed after delay if needed
            }}
          />
        )}
        {confettiSeed > 0 && (
          <ConfettiBurst
            key={`confetti-${confettiSeed}`}
            enabled={true}
            seed={`confetti-${room.id}-${confettiSeed}`}
            className="pointer-events-none fixed inset-0 z-50"
            onComplete={() => {
              // Effect completed, can reset seed after delay if needed
            }}
          />
        )}
        </div>

      {/* Scroll to Bottom FAB */}
      {scrollFabVisible && (
        <AnimatedView
          style={scrollFab.animatedStyle}
          className="fixed bottom-24 right-6 z-40"
        >
          <Button
            size="icon"
            className="rounded-full shadow-lg bg-primary hover:bg-primary/90"
            onClick={() => {
              scrollToBottom()
              setScrollFabVisible(false)
            }}
          >
            <PaperPlaneRight size={20} weight="fill" />
            {(messages?.length ?? 0) > previousBadgeCount && (
              <AnimatedView
                style={scrollFab.badgeAnimatedStyle}
                className="absolute -top-1 -right-1 bg-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
              >
                <span>{(messages?.length ?? 0) - previousBadgeCount}</span>
              </AnimatedView>
            )}
          </Button>
        </AnimatedView>
      )}

      {showSmartSuggestions && (messages || []).length >= 0 && (
        <SmartSuggestionsPanel
          onSelect={handleSuggestionSelect}
          onDismiss={() => setShowSmartSuggestions(false)}
        />
      )}

      <AnimatedView
        style={footerAnimation.animatedStyle}
        className="glass-strong border-t border-white/20 p-4 shadow-2xl backdrop-blur-2xl space-y-3"
      >
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTemplates(!showTemplates)}
            className="shrink-0"
          >
            <Sparkle size={16} weight="fill" className="mr-1" />
            Templates
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShareLocation}
            className="shrink-0"
          >
            <MapPin size={16} className="mr-1" />
            Location
          </Button>
        </div>

        {showTemplates && (
          <AnimatePresence>
            <TemplatePanel key="templates" onClose={() => setShowTemplates(false)} onSelect={handleTemplateSelect} />
          </AnimatePresence>
        )}

        <div className="flex items-end gap-2">
          <Popover open={showStickers} onOpenChange={setShowStickers}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
              >
                <Smiley size={24} weight={showStickers ? 'fill' : 'regular'} />
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-80 glass-strong backdrop-blur-2xl border-white/30"
              side="top"
            >
              <Tabs defaultValue="stickers">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="stickers">Stickers</TabsTrigger>
                  <TabsTrigger value="reactions">Reactions</TabsTrigger>
                </TabsList>
                <TabsContent value="stickers" className="space-y-3">
                  <div className="grid grid-cols-6 gap-2">
                    {CHAT_STICKERS.map((sticker) => (
                      <StickerButton
                        key={sticker.id}
                        sticker={sticker}
                        onSelect={(emoji) => handleSendMessage(emoji, 'sticker')}
                      />
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="reactions" className="space-y-3">
                  <div className="grid grid-cols-6 gap-2">
                    {REACTION_EMOJIS.map((emoji) => (
                      <ReactionButton key={emoji} emoji={emoji} />
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </PopoverContent>
          </Popover>

          {!isRecordingVoice ? (
            <>
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage(inputValue, 'text')
                    }
                  }}
                  placeholder="Type a message..."
                  className="pr-12 glass-effect border-white/30 focus:border-primary/50 backdrop-blur-xl"
                />
              </div>

              <Button
                onMouseDown={() => setIsRecordingVoice(true)}
                size="icon"
                variant="ghost"
                className="shrink-0"
              >
                <Microphone size={24} />
              </Button>

              <Button
                onClick={() => handleSendMessage(inputValue, 'text')}
                disabled={!inputValue.trim()}
                size="icon"
                className="shrink-0 bg-linear-to-br from-primary to-accent hover:shadow-lg transition-all"
              >
                <SendButtonIcon />
              </Button>
            </>
          ) : (
            <VoiceRecorder
              onRecorded={handleVoiceRecorded}
              onCancel={() => setIsRecordingVoice(false)}
            />
          )}
        </div>
      </AnimatedView>
    </div>
  )
}
