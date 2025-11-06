import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  X, Eye, ChatCircle, PaperPlaneTilt, VideoCamera,
  MicrophoneSlash, Microphone, Phone, CameraRotate
} from '@phosphor-icons/react'
import { motion, Presence } from '@petspark/motion'
import { toast } from 'sonner'
import { liveStreamingAPI } from '@/api/live-streaming-api'
import type { LiveStream, LiveStreamChatMessage } from '@/lib/live-streaming-types'
import { haptics } from '@/lib/haptics'
import { logger } from '@/lib/logger'

interface LiveStreamRoomProps {
  streamId: string
  isHost: boolean
  onClose: () => void
}

const REACTION_EMOJIS = ['❤️', '👏', '🔥', '😍', '🐾', '⭐']

export function LiveStreamRoom({ streamId, isHost, onClose }: LiveStreamRoomProps) {
  const [stream, setStream] = useState<LiveStream | null>(null)
  const [chatMessages, setChatMessages] = useState<LiveStreamChatMessage[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)
  const [showChat, setShowChat] = useState(true)
  const [floatingReactions, setFloatingReactions] = useState<Array<{ id: string; emoji: string; x: number }>>([])
  const videoRef = useRef<HTMLVideoElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadStream()
    joinStream()

    const interval = setInterval(loadChatMessages, 2000)

    return () => {
      clearInterval(interval)
      leaveStream()
    }
  }, [streamId])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const loadStream = async () => {
    const streamData = await liveStreamingAPI.getStreamById(streamId)
    if (streamData) {
      setStream(streamData)
    }
  }

  const joinStream = async () => {
    try {
      const user = await spark.user()
      await liveStreamingAPI.joinStream(streamId, user.id, user.login || 'User', user.avatarUrl)
      await loadStream()
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to join stream', err, { action: 'joinStream', streamId })
    }
  }

  const leaveStream = async () => {
    try {
      const user = await spark.user()
      await liveStreamingAPI.leaveStream(streamId, user.id)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to leave stream', err, { action: 'leaveStream', streamId })
    }
  }

  const loadChatMessages = async () => {
    const messages = await liveStreamingAPI.queryChatMessages(streamId)
    setChatMessages(messages)
  }

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !stream?.allowChat) return

    try {
      const user = await spark.user()
      await liveStreamingAPI.sendChatMessage(
        streamId,
        user.id,
        user.login || 'User',
        user.avatarUrl,
        messageInput.trim()
      )
      setMessageInput('')
      await loadChatMessages()
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to send message', err, { action: 'sendMessage', streamId })
      toast.error('Failed to send message')
    }
  }

  const handleReaction = async (emoji: string) => {
    haptics.impact('light')
    
    const id = Date.now().toString()
    const x = Math.random() * 80 + 10
    setFloatingReactions(prev => [...prev, { id, emoji, x }])

    setTimeout(() => {
      setFloatingReactions(prev => prev.filter(r => r.id !== id))
    }, 3000)

    try {
      const user = await spark.user()
      await liveStreamingAPI.sendReaction(
        streamId,
        user.id,
        user.login || 'User',
        user.avatarUrl,
        emoji as '❤️' | '👏' | '🔥' | '😊' | '🎉'
      )
      await loadStream()
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to send reaction', err, { action: 'sendReaction', streamId, reaction: emoji })
    }
  }

  const handleEndStream = async () => {
    if (!isHost) return

    try {
      const user = await spark.user()
      await liveStreamingAPI.endRoom(streamId, user.id)
      toast.success('Stream ended')
      onClose()
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to end stream', err, { action: 'endStream', streamId })
      toast.error('Failed to end stream')
    }
  }

  const formatViewerCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }

  if (!stream) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading stream...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between z-10">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md rounded-full px-4 py-2">
            <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
            <div className="flex items-center gap-1 text-white">
              <Eye size={16} weight="fill" />
              <span className="text-sm font-semibold">{formatViewerCount(stream.viewerCount)}</span>
            </div>
          </div>

          <div className="bg-black/60 backdrop-blur-md rounded-2xl px-4 py-3 max-w-sm">
            <div className="flex items-center gap-2 mb-1">
              <Avatar className="w-8 h-8 border-2 border-primary">
                <AvatarImage src={stream.hostAvatar} />
                <AvatarFallback>{stream.hostName[0]}</AvatarFallback>
              </Avatar>
              <span className="text-white font-semibold">{stream.hostName}</span>
            </div>
            <h3 className="text-white text-sm font-medium line-clamp-2">{stream.title}</h3>
            {stream.description && (
              <p className="text-white/70 text-xs mt-1 line-clamp-1">{stream.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isHost && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleEndStream}
              className="rounded-full"
            >
              End Stream
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80">
            <X size={24} />
          </Button>
        </div>
      </div>

      <div className="flex-1 relative">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted={isMuted}
        />

        {isCameraOff && (
          <div className="absolute inset-0 bg-black flex items-center justify-center">
            <div className="text-center text-white">
              <VideoCamera size={64} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">Camera is off</p>
            </div>
          </div>
        )}

        <div className="absolute inset-0 pointer-events-none">
          <Presence>
            {floatingReactions.map(reaction => (
              <MotionView
                key={reaction.id}
                initial={{ y: 0, opacity: 1, scale: 0 }}
                animate={{ y: -300, opacity: 0, scale: 1.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 3, ease: 'easeOut' }}
                className="absolute bottom-20 text-4xl"
                style={{ left: `${reaction.x}%` }}
              >
                {reaction.emoji}
              </MotionView>
            ))}
          </Presence>
        </div>
      </div>

      {isHost && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMuted(!isMuted)}
            className="rounded-full w-14 h-14 bg-black/60 backdrop-blur-md text-white hover:bg-black/80"
          >
            {isMuted ? <MicrophoneSlash size={24} /> : <Microphone size={24} />}
          </Button>

          <Button
            variant="destructive"
            size="icon"
            onClick={handleEndStream}
            className="rounded-full w-16 h-16"
          >
            <Phone size={28} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCameraOff(!isCameraOff)}
            className="rounded-full w-14 h-14 bg-black/60 backdrop-blur-md text-white hover:bg-black/80"
          >
            <CameraRotate size={24} />
          </Button>
        </div>
      )}

      <Presence>
        {showChat && stream.allowChat && (
          <MotionView
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute right-0 top-0 bottom-0 w-full sm:w-96 bg-black/90 backdrop-blur-xl flex flex-col border-l border-white/10"
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <ChatCircle size={20} weight="fill" />
                Chat
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowChat(false)}
                className="text-white hover:bg-white/10 rounded-full"
              >
                <X size={20} />
              </Button>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {chatMessages.map(msg => (
                  <div key={msg.id} className="flex items-start gap-2">
                    <Avatar className="w-6 h-6 shrink-0">
                      <AvatarImage src={msg.userAvatar} />
                      <AvatarFallback className="text-xs">{msg.userName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-white text-sm font-medium">{msg.userName}</span>
                        <span className="text-white/40 text-xs">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-white/90 text-sm wrap-break-word">{msg.text}</p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-white/10">
              <div className="flex gap-2">
                <Input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Send a message..."
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  size="icon"
                  className="rounded-full"
                >
                  <PaperPlaneTilt size={18} weight="fill" />
                </Button>
              </div>
            </div>
          </MotionView>
        )}
      </Presence>

      {!showChat && stream.allowChat && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowChat(true)}
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full w-14 h-14 bg-black/60 backdrop-blur-md text-white hover:bg-black/80 z-10"
        >
          <ChatCircle size={24} weight="fill" />
        </Button>
      )}

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
        {REACTION_EMOJIS.map(emoji => (
          <MotionView as="button"
            key={emoji}
            onClick={() => handleReaction(emoji)}
            whileTap={{ scale: 1.3 }}
            className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md text-2xl hover:bg-black/80 transition-all hover:scale-110"
          >
            {emoji}
          </MotionView>
        ))}
      </div>
    </div>
  )
}
