import { useState, useEffect, useRef } from 'react'
import { useStorage } from '@/hooks/useStorage'
import { motion } from 'framer-motion'
import { 
  PaperPlaneRight, 
  Smiley, 
  ArrowLeft,
  DotsThree,
  Microphone,
  MapPin,
  X,
  Translate as TranslateIcon,
  Sparkle
} from '@phosphor-icons/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover'
import { parseLLMError } from '@/lib/llm-utils'
import { createLogger } from '@/lib/logger'

const logger = createLogger('AdvancedChatWindow')
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import type { ChatRoom, ChatMessage, MessageTemplate, SmartSuggestion, ReactionType } from '@/lib/chat-types'
import { REACTION_EMOJIS, MESSAGE_TEMPLATES } from '@/lib/chat-types'
import { 
  formatChatTime, 
  groupMessagesByDate, 
  generateMessageId,
  CHAT_STICKERS 
} from '@/lib/chat-utils'
import { toast } from 'sonner'
import { haptics } from '@/lib/haptics'
import MessageReactions from './MessageReactions'
import VoiceRecorder from './VoiceRecorder'
import MessageAttachments from './MessageAttachments'
import SmartSuggestionsPanel from './SmartSuggestionsPanel'
import TypingIndicatorComponent from './TypingIndicator'
import { useTypingManager } from '@/hooks/use-typing-manager'
import { realtime } from '@/lib/realtime'
import { BubbleWrapper } from './BubbleWrapper'

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
  
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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
    if (typingUsers.length > 0) {
      scrollToBottom()
    }
  }, [typingUsers])

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
      senderAvatar: currentUserAvatar,
      content: type === 'text' ? content.trim() : content,
      type,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      status: 'sent',
      reactions: [],
      attachments,
      metadata
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
            return {
              ...msg,
              reactions: [...reactions, {
                emoji: emoji as ReactionType,
                userId: currentUserId,
                userName: currentUserName,
                userAvatar: currentUserAvatar,
                timestamp: new Date().toISOString()
              }]
            }
          }
        }
        return msg
      })
    )
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
      const prompt = window.spark.llmPrompt`Translate the following message to English. Return only the translated text without any explanation: "${message.content}"`
      const translated = await window.spark.llm(prompt, 'gpt-4o-mini')

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

  return (
    <div className="flex flex-col h-full">
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
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
                >
                  🚫 Block User
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </motion.div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-6"
      >
        {messageGroups.map((group, groupIdx) => (
          <div key={group.date} className="space-y-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: groupIdx * 0.1 }}
              className="flex justify-center"
            >
              <div className="glass-effect px-4 py-1.5 rounded-full text-xs font-medium text-muted-foreground shadow-sm">
                {group.date}
              </div>
            </motion.div>

            {group.messages.map((message, msgIdx) => {
              const isCurrentUser = message.senderId === currentUserId
              
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    delay: msgIdx * 0.05,
                    type: 'spring',
                    stiffness: 300,
                    damping: 30
                  }}
                  className={`flex items-end gap-2 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {!isCurrentUser && (
                    <Avatar className="w-8 h-8 ring-2 ring-white/20 shrink-0">
                      <AvatarImage src={message.senderAvatar} alt={message.senderName} />
                      <AvatarFallback className="bg-linear-to-br from-secondary to-primary text-white text-xs font-bold">
                        {message.senderName?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div className={`flex flex-col max-w-[75%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
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
                        <MessageAttachments attachments={message.attachments} />
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
                        onReact={(emoji) => handleReaction(message.id, emoji)}
                        currentUserId={currentUserId}
                      />

                      {!isCurrentUser && message.type === 'text' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute -bottom-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                          onClick={() => handleTranslateMessage(message.id)}
                        >
                          <TranslateIcon size={14} />
                        </Button>
                      )}
                    </motion.div>

                    <span className="text-xs text-muted-foreground mt-1 px-1 flex items-center gap-2">
                      {formatChatTime(message.timestamp)}
                      {isCurrentUser && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0">
                          {message.status}
                        </Badge>
                      )}
                    </span>
                  </div>
                </motion.div>
              )
            })}
            </div>
          ))}

          {typingUsers.length > 0 && (
            <motion.div
              key="typing-indicators"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-end gap-2 flex-row"
            >
              <Avatar className="w-8 h-8 ring-2 ring-white/20 shrink-0">
                <AvatarFallback className="bg-linear-to-br from-secondary to-primary text-white text-xs font-bold">
                  {typingUsers[0]?.userName?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
              <BubbleWrapper
                isTyping
                isOwn={false}
                direction="incoming"
              >
                <div />
              </BubbleWrapper>
            </motion.div>
          )}
        </div>

      {showSmartSuggestions && (messages || []).length >= 0 && (
        <SmartSuggestionsPanel
          onSelect={handleSuggestionSelect}
          onDismiss={() => setShowSmartSuggestions(false)}
        />
      )}

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
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
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-effect p-3 rounded-xl space-y-2"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Message Templates</h4>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setShowTemplates(false)}
              >
                <X size={14} />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {MESSAGE_TEMPLATES.slice(0, 4).map((template) => (
                <motion.button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className="text-left p-2 rounded-lg glass-effect hover:bg-white/20 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span>{template.icon}</span>
                    <span className="text-xs font-semibold">{template.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {template.content}
                  </p>
                </motion.button>
              ))}
            </div>
          </motion.div>
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
                      <motion.button
                        key={sticker.id}
                        onClick={() => handleSendMessage(sticker.emoji, 'sticker')}
                        className="text-3xl p-2 rounded-xl hover:bg-white/20 transition-colors"
                        whileHover={{ scale: 1.2, rotate: 10 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {sticker.emoji}
                      </motion.button>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="reactions" className="space-y-3">
                  <div className="grid grid-cols-6 gap-2">
                    {REACTION_EMOJIS.map((emoji) => (
                      <motion.button
                        key={emoji}
                        className="text-2xl p-2 rounded-xl hover:bg-white/20 transition-colors"
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {emoji}
                      </motion.button>
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
                <motion.div
                  whileHover={{ x: 5 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <PaperPlaneRight size={20} weight="fill" />
                </motion.div>
              </Button>
            </>
          ) : (
            <VoiceRecorder
              onRecorded={handleVoiceRecorded}
              onCancel={() => setIsRecordingVoice(false)}
            />
          )}
        </div>
      </motion.div>
    </div>
  )
}
