import CallInterface from '@/components/call/CallInterface'
import IncomingCallNotification from '@/components/call/IncomingCallNotification'
import VoiceRecorder from '@/components/chat/VoiceRecorder'
import { WebBubbleWrapper } from '@/components/chat/WebBubbleWrapper'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { useTypingManager } from '@/hooks/use-typing-manager'
import { useCall } from '@/hooks/useCall'
import { useStorage } from '@/hooks/useStorage'
import type { ChatMessage, ChatRoom, MessageReaction } from '@/lib/chat-types'
import { MESSAGE_TEMPLATES, REACTION_EMOJIS } from '@/lib/chat-types'
import {
  CHAT_STICKERS,
  formatChatTime,
  generateMessageId,
  getReactionsArray,
  groupMessagesByDate
} from '@/lib/chat-utils'
import { haptics } from '@/lib/haptics'
import { realtime } from '@/lib/realtime'
import {
  ArrowLeft,
  ChatCentered,
  Check,
  Checks,
  DotsThree,
  Heart,
  Microphone,
  PaperPlaneRight,
  Pause,
  Phone,
  Play,
  Smiley,
  Sparkle,
  VideoCamera,
  X
} from '@phosphor-icons/react'
import { Presence, motion } from '@petspark/motion'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

interface ChatWindowProps {
  room: ChatRoom
  currentUserId: string
  currentUserName: string
  currentUserAvatar?: string
  onBack?: () => void
}

export default function ChatWindow({ 
  room, 
  currentUserId,
  currentUserName,
  currentUserAvatar,
  onBack 
}: ChatWindowProps) {
  const [messages, setMessages] = useStorage<ChatMessage[]>(`chat-messages-${room.id}`, [])
  const [voiceMessages, setVoiceMessages] = useStorage<Record<string, { blob: string, duration: number, waveform: number[] }>>(`voice-messages-${room.id}`, {})
  const [inputValue, setInputValue] = useState('')
  const [showStickers, setShowStickers] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showReactions, setShowReactions] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [playingVoice, setPlayingVoice] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

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

  const {
    activeCall,
    incomingCall,
    initiateCall,
    answerCall,
    declineCall,
    endCall,
    toggleMute,
    toggleVideo
  } = useCall(room.id, currentUserId, currentUserName, currentUserAvatar)

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    markMessagesAsRead()
  }, [room.id])

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

  const handleSendMessage = (content: string, type: 'text' | 'sticker' | 'voice' = 'text') => {                                                                 
    if (!content.trim() && type === 'text') return

    haptics.trigger('light')

    const newMessage: ChatMessage = {
      id: generateMessageId(),
      roomId: room.id,
      senderId: currentUserId,
      senderName: currentUserName,
      content: type === 'text' ? content.trim() : content,
      type,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      status: 'sent',
      reactions: []
    }
    if (currentUserAvatar !== undefined) {
      newMessage.senderAvatar = currentUserAvatar
    }

    setMessages((current) => [...(current || []), newMessage])
    setInputValue('')
    setShowStickers(false)
    handleTypingMessageSend()
    
    if (type === 'text') {
      toast.success('Message sent!', {
        duration: 1500,
        position: 'top-center'
      })
    }
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
          const reactions = getReactionsArray(msg.reactions)
          const existingReaction = reactions.find(r => r.userId === currentUserId && r.emoji === emoji)
          
          if (existingReaction) {
            return {
              ...msg,
              reactions: reactions.filter(r => !(r.userId === currentUserId && r.emoji === emoji))
            }
          } else {
            const userReaction = reactions.find(r => r.userId === currentUserId)
            if (userReaction) {
              return {
                ...msg,
                reactions: reactions.map(r => 
                  r.userId === currentUserId ? { ...r, emoji } : r
                )
              }
            } else {
              return {
                ...msg,
                reactions: [...reactions, {
                  emoji,
                  userId: currentUserId,
                  userName: currentUserName,
                  timestamp: new Date().toISOString()
                }]
              }
            }
          }
        }
        return msg
      })
    )
    setShowReactions(null)
  }

  const handleUseTemplate = (template: string) => {
    setInputValue(template)
    setShowTemplates(false)
    inputRef.current?.focus()
  }

  const handleVoiceRecorded = async (audioBlob: Blob, duration: number, waveform: number[]) => {
    const messageId = generateMessageId()
    
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64Audio = reader.result as string
      
      setVoiceMessages((current) => ({
        ...current,
        [messageId]: { blob: base64Audio, duration, waveform }
      }))

      const newMessage: ChatMessage = {
        id: messageId,
        roomId: room.id,
        senderId: currentUserId,
        senderName: currentUserName,
        content: `Voice message (${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')})`,
        type: 'voice',
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        status: 'sent',
        reactions: []
      }
      if (currentUserAvatar !== undefined) {
        newMessage.senderAvatar = currentUserAvatar
      }

      setMessages((current) => [...(current || []), newMessage])
      setIsRecording(false)
      
      toast.success('Voice message sent!', {
        duration: 1500,
        position: 'top-center'
      })
    }
    
    reader.readAsDataURL(audioBlob)
  }

  const handleVoiceCancel = () => {
    setIsRecording(false)
    toast.info('Recording cancelled', {
      duration: 1000,
      position: 'top-center'
    })
  }

  const toggleVoicePlayback = (messageId: string) => {
    if (!voiceMessages) return
    
    const voiceData = voiceMessages[messageId]
    if (!voiceData) return

    if (playingVoice === messageId) {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      setPlayingVoice(null)
      return
    }

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    const audio = new Audio(voiceData.blob)
    audio.onended = () => {
      setPlayingVoice(null)
      audioRef.current = null
    }
    audio.play()
    audioRef.current = audio
    setPlayingVoice(messageId)
  }

  const markMessagesAsRead = () => {
    setMessages((current) =>
      (current || []).map(msg => 
        msg.senderId !== currentUserId && msg.status !== 'read'
          ? { ...msg, status: 'read' as const }
          : msg
      )
    )
  }

  const messageGroups = groupMessagesByDate(messages || [])

  const handleVoiceCall = () => {
    haptics.trigger('heavy')
    const petId = room.matchedPetId
    const petName = room.matchedPetName
    if (petId && petName) {
      initiateCall(petId, petName, room.matchedPetPhoto || undefined, 'voice')
      toast.info('Starting voice call...')
    }
  }

  const handleVideoCall = () => {
    haptics.trigger('heavy')
    const petId = room.matchedPetId
    const petName = room.matchedPetName
    if (petId && petName) {
      initiateCall(petId, petName, room.matchedPetPhoto || undefined, 'video')
      toast.info('Starting video call...')
    }
  }

  return (
    <>
      <Presence>
        {incomingCall && room.matchedPetName && (
          <IncomingCallNotification
            call={incomingCall}
            callerName={room.matchedPetName ?? ''}
            {...(room.matchedPetPhoto ? { callerAvatar: room.matchedPetPhoto } : {})}
            onAccept={answerCall}
            onDecline={declineCall}
          />
        )}
      </Presence>

      <Presence>
        {activeCall && (
          <CallInterface
            session={activeCall}
            onEndCall={endCall}
            onToggleMute={toggleMute}
            onToggleVideo={toggleVideo}
          />
        )}
      </Presence>

      <div className="flex flex-col h-full">
        <MotionView 
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
              <AvatarImage src={room.matchedPetPhoto || undefined} alt={room.matchedPetName || undefined} />
              <AvatarFallback className="bg-linear-to-br from-primary to-accent text-white font-bold">
                {room.matchedPetName?.[0] || '?'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h2 className="font-bold text-foreground">{room.matchedPetName || 'Unknown'}</h2>
              {typingUsers.length > 0 && (
                <MotionView
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-primary flex items-center gap-1"
                >
                  <MotionText
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    {typingUsers.length === 1
                      ? `${typingUsers[0]?.userName ?? 'Someone'} is typing`
                      : `${typingUsers.length} people are typing`}
                  </MotionText>
                  <MotionText
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                  >
                    ...
                  </MotionText>
                </MotionView>
              )}
            </div>

            <MotionView whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                variant="ghost" 
                size="icon" 
                className="shrink-0"
                onClick={handleVideoCall}
                title="Start video call"
              >
                <VideoCamera size={24} weight="regular" />
              </Button>
            </MotionView>

            <MotionView whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                variant="ghost" 
                size="icon" 
                className="shrink-0"
                onClick={handleVoiceCall}
                title="Start voice call"
              >
                <Phone size={24} weight="regular" />
              </Button>
            </MotionView>

            <Button variant="ghost" size="icon" className="shrink-0">
              <DotsThree size={24} weight="bold" />
            </Button>
          </div>
        </MotionView>

        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-6"
        >
          {messageGroups.map((group, groupIdx) => (
            <div key={group.date} className="space-y-4">
              <MotionView
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: groupIdx * 0.1 }}
                className="flex justify-center"
              >
                <div className="glass-effect px-4 py-1.5 rounded-full text-xs font-medium text-muted-foreground shadow-sm">
                  {group.date}
                </div>
              </MotionView>

              {group.messages.map((message, msgIdx) => {
                const isCurrentUser = message.senderId === currentUserId
                
                return (
                  <MotionView
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
                        <AvatarImage src={message.senderAvatar || undefined} alt={message.senderName || undefined} />
                        <AvatarFallback className="bg-linear-to-br from-secondary to-primary text-white text-xs font-bold">
                          {message.senderName?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div className={`flex flex-col max-w-[75%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                      <MotionView
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
                          <p className="text-sm wrap-break-word">{message.content}</p>
                        )}
                        
                        {message.type === 'sticker' && (
                          <div className="text-5xl p-2">
                            {message.content}
                          </div>
                        )}

                        {message.type === 'voice' && voiceMessages && voiceMessages[message.id] && (
                          <MotionView as="button"
                            onClick={() => toggleVoicePlayback(message.id)}
                            className="flex items-center gap-2 min-w-[200px]"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <MotionView 
                              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
                              whileHover={{ scale: 1.1 }}
                            >
                              {playingVoice === message.id ? (
                                <Pause size={16} weight="fill" />
                              ) : (
                                <Play size={16} weight="fill" />
                              )}
                            </MotionView>
                            <div className="flex-1 h-8 flex items-center gap-0.5">
                              {voiceMessages[message.id]?.waveform.slice(0, 30).map((value, i) => (
                                <MotionView
                                  key={i}
                                  className="w-1 bg-white/60 rounded-full"
                                  style={{ height: `${Math.max(value * 24, 4)}px` }}
                                  animate={
                                    playingVoice === message.id
                                      ? { opacity: [0.4, 1, 0.4] }
                                      : {}
                                  }
                                  transition={{ duration: 0.5, delay: i * 0.02, repeat: playingVoice === message.id ? Infinity : 0 }}
                                />
                              ))}
                            </div>
                            <span className="text-xs opacity-80">
                              {(() => {
                                const voiceMsg = voiceMessages[message.id]
                                if (!voiceMsg) return null
                                return `${Math.floor(voiceMsg.duration / 60)}:${(voiceMsg.duration % 60).toString().padStart(2, '0')}`
                              })()}
                            </span>
                          </MotionView>
                        )}

                        <Popover open={showReactions === message.id} onOpenChange={(open) => setShowReactions(open ? message.id : null)}>
                          <PopoverTrigger asChild>
                            <MotionView as="button"
                              className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-white shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Heart size={14} weight="fill" className="text-red-500" />
                            </MotionView>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-2 glass-strong backdrop-blur-2xl border-white/30" side="top">
                            <div className="flex gap-1">
                              {REACTION_EMOJIS.slice(0, 6).map((emoji) => (
                                <MotionView as="button"
                                  key={emoji}
                                  onClick={() => handleReaction(message.id, emoji)}
                                  className="text-2xl p-2 rounded-lg hover:bg-white/20 transition-colors"
                                  whileHover={{ scale: 1.2 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  {emoji}
                                </MotionView>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </MotionView>

                      {(() => {
                        const reactionsArray = getReactionsArray(message.reactions)
                        return reactionsArray.length > 0 && (
                          <MotionView
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex gap-1 mt-1 px-2"
                          >
                            {reactionsArray.map((reaction: MessageReaction, idx: number) => (
                            <MotionView
                              key={idx}
                              whileHover={{ scale: 1.2 }}
                              className="text-lg bg-white/80 rounded-full px-2 py-0.5 shadow-sm"
                              title={reaction.userName}
                            >
                              {reaction.emoji}
                            </MotionView>
                          ))}
                        </MotionView>
                        )
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
                )
              })}
            </div>
          ))}

          {typingUsers.length > 0 && (
            <MotionView
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
              <WebBubbleWrapper
                showTyping
                isIncoming
              >
                <div />
              </WebBubbleWrapper>
            </MotionView>
          )}
        </div>

        <MotionView 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="glass-strong border-t border-white/20 p-4 shadow-2xl backdrop-blur-2xl"
        >
          {showTemplates && (
            <MotionView
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 overflow-hidden"
            >
              <div className="glass-effect rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Sparkle size={16} weight="fill" className="text-primary" />
                    Quick Templates
                  </h4>
                  <Button variant="ghost" size="sm" onClick={() => setShowTemplates(false)}>
                    <X size={16} />
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {MESSAGE_TEMPLATES.slice(0, 4).map((template) => (
                    <MotionView as="button"
                      key={template.id}
                      onClick={() => handleUseTemplate(template.text)}
                      className="text-left p-2 rounded-lg glass-effect hover:glass-strong transition-all text-sm"
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="mr-2">{template.icon}</span>
                      {template.title}
                    </MotionView>
                  ))}
                </div>
              </div>
            </MotionView>
          )}

          {isRecording ? (
            <VoiceRecorder
              onRecorded={handleVoiceRecorded}
              onCancel={handleVoiceCancel}
              maxDuration={120}
            />
          ) : (
            <div className="flex items-end gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowTemplates(!showTemplates)}
                className="shrink-0"
              >
                <ChatCentered size={24} weight={showTemplates ? 'fill' : 'regular'} />
              </Button>

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
                  <Tabs defaultValue="stickers" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="stickers">Stickers</TabsTrigger>
                      <TabsTrigger value="emojis">Reactions</TabsTrigger>
                    </TabsList>
                    <TabsContent value="stickers" className="mt-3">
                      <div className="grid grid-cols-6 gap-2">
                        {CHAT_STICKERS.map((sticker) => (
                          <MotionView as="button"
                            key={sticker.id}
                            onClick={() => handleSendMessage(sticker.emoji, 'sticker')}
                            className="text-3xl p-2 rounded-xl hover:bg-white/20 transition-colors"
                            whileHover={{ scale: 1.2, rotate: 10 }}
                            whileTap={{ scale: 0.9 }}
                            title={sticker.label}
                          >
                            {sticker.emoji}
                          </MotionView>
                        ))}
                      </div>
                    </TabsContent>
                    <TabsContent value="emojis" className="mt-3">
                      <div className="grid grid-cols-6 gap-2">
                        {REACTION_EMOJIS.map((emoji) => (
                          <MotionView
                            key={emoji}
                            className="text-2xl p-2 rounded-xl hover:bg-white/20 transition-colors text-center cursor-pointer"
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            {emoji}
                          </MotionView>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </PopoverContent>
              </Popover>

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
                onClick={() => {
                  haptics.trigger('medium')
                  setIsRecording(true)
                }}
                size="icon"
                variant="ghost"
                className="shrink-0"
              >
                <Microphone size={20} weight="regular" />
              </Button>

              <Button
                onClick={() => handleSendMessage(inputValue, 'text')}
                disabled={!inputValue.trim()}
                size="icon"
                className="shrink-0 bg-linear-to-br from-primary to-accent hover:shadow-lg transition-all disabled:opacity-50"
              >
                <MotionView
                  whileHover={{ x: 5 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <PaperPlaneRight size={20} weight="fill" />
                </MotionView>
              </Button>
            </div>
          )}
        </MotionView>
      </div>
    </>
  )
}
