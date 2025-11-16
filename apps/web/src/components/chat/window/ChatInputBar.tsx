/**
 * Chat Input Bar Component
 * Input area with templates, stickers, emojis, voice recording, and send button
 */

import { MotionView } from '@petspark/motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { VoiceRecorder } from '@/components/chat/VoiceRecorder'
import {
  ChatCentered,
  Microphone,
  PaperPlaneRight,
  Smiley,
  Sparkle,
  X,
} from '@phosphor-icons/react'
import { MESSAGE_TEMPLATES, REACTION_EMOJIS } from '@/lib/chat-types'
import { CHAT_STICKERS } from '@/lib/chat-utils'
import type { AnimatedStyle } from '@/effects/reanimated/animated-view'
import { useAnimatedStyle } from '@petspark/motion'

interface ChatInputBarProps {
  inputValue: string
  inputRef: React.RefObject<HTMLInputElement>
  showTemplates: boolean
  showStickers: boolean
  isRecording: boolean
  templatesStyle: AnimatedStyle
  templateButtonHover: {
    animatedStyle: AnimatedStyle
    handleEnter: () => void
    handleLeave: () => void
  }
  templateButtonTap: {
    animatedStyle: AnimatedStyle
    handlePress: () => void
  }
  stickerButtonTap: {
    animatedStyle: AnimatedStyle
  }
  stickerButtonHover: {
    animatedStyle: AnimatedStyle
    handleEnter: () => void
    handleLeave: () => void
  }
  emojiButtonTap: {
    animatedStyle: AnimatedStyle
  }
  emojiButtonHover: {
    animatedStyle: AnimatedStyle
    handleEnter: () => void
    handleLeave: () => void
  }
  sendButtonHover: {
    animatedStyle: AnimatedStyle
    handleEnter: () => void
    handleLeave: () => void
  }
  sendButtonTap: {
    animatedStyle: AnimatedStyle
  }
  onInputChange: (value: string) => void
  onSendMessage: (content: string, type?: 'text' | 'sticker' | 'voice') => void
  onUseTemplate: (template: string) => void
  onVoiceRecorded: (audioBlob: Blob, duration: number, waveform: number[]) => void
  onVoiceCancel: () => void
  onStartRecording: () => void
  setShowTemplates: (show: boolean) => void
  setShowStickers: (show: boolean) => void
}

export function ChatInputBar({
  inputValue,
  inputRef,
  showTemplates,
  showStickers,
  isRecording,
  templatesStyle,
  templateButtonHover,
  templateButtonTap,
  stickerButtonTap,
  stickerButtonHover,
  emojiButtonTap,
  emojiButtonHover,
  sendButtonHover,
  sendButtonTap,
  onInputChange,
  onSendMessage,
  onUseTemplate,
  onVoiceRecorded,
  onVoiceCancel,
  onStartRecording,
  setShowTemplates,
  setShowStickers,
}: ChatInputBarProps) {
  const inputBarStyle = useAnimatedStyle(() => ({
    opacity: 1,
    transform: [{ translateY: 0 }],
  })) as AnimatedStyle

  return (
    <MotionView
      className="glass-strong border-t border-white/20 p-4 shadow-2xl backdrop-blur-2xl"
      style={inputBarStyle}
    >
      {showTemplates && (
        <MotionView style={templatesStyle} className="mb-3 overflow-hidden">
          <div className="glass-effect rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Sparkle size={16} weight="fill" className="text-primary" />
                Quick Templates
              </h4>
              <Button variant="ghost" size="sm" onClick={() => { setShowTemplates(false) }}>
                <X size={16} />
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {MESSAGE_TEMPLATES.slice(0, 4).map((template) => (
                <MotionView
                  key={template.id}
                  style={[templateButtonHover.animatedStyle, templateButtonTap.animatedStyle]}
                  onClick={() => onUseTemplate(template.text)}
                  onMouseEnter={templateButtonHover.handleEnter}
                  onMouseLeave={templateButtonHover.handleLeave}
                  onMouseDown={templateButtonTap.handlePress}
                  className="text-left p-2 rounded-lg glass-effect hover:glass-strong transition-all text-sm cursor-pointer"
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
          onRecorded={onVoiceRecorded}
          onCancel={onVoiceCancel}
          maxDuration={120}
        />
      ) : (
        <div className="flex items-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setShowTemplates(!showTemplates)
            }}
            className="shrink-0"
            aria-label={showTemplates ? 'Close message templates' : 'Open message templates'}
            aria-expanded={showTemplates}
          >
            <ChatCentered size={24} weight={showTemplates ? 'fill' : 'regular'} />
          </Button>

          <Popover open={showStickers} onOpenChange={setShowStickers}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                aria-label={showStickers ? 'Close stickers and emojis' : 'Open stickers and emojis'}
                aria-expanded={showStickers}
              >
                <Smiley size={24} weight={showStickers ? 'fill' : 'regular'} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 glass-strong backdrop-blur-2xl border-white/30" side="top">
              <Tabs defaultValue="stickers" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="stickers">Stickers</TabsTrigger>
                  <TabsTrigger value="emojis">Reactions</TabsTrigger>
                </TabsList>
                <TabsContent value="stickers" className="mt-3">
                  <div className="grid grid-cols-6 gap-2">
                    {CHAT_STICKERS.map((sticker) => (
                      <MotionView
                        key={sticker.id}
                        style={[stickerButtonTap.animatedStyle, stickerButtonHover.animatedStyle]}
                        onClick={() => onSendMessage(sticker.emoji, 'sticker')}
                        onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            onSendMessage(sticker.emoji, 'sticker')
                          }
                        }}
                        className="text-3xl p-2 rounded-xl hover:bg-white/20 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        onMouseEnter={stickerButtonHover.handleEnter}
                        onMouseLeave={stickerButtonHover.handleLeave}
                        title={sticker.label}
                        role="button"
                        aria-label={`Send ${String(sticker.label ?? '')} sticker`}
                        tabIndex={0}
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
                        style={[emojiButtonTap.animatedStyle, emojiButtonHover.animatedStyle]}
                        onClick={() => {
                          onSendMessage(emoji, 'text')
                        }}
                        onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            onSendMessage(emoji, 'text')
                          }
                        }}
                        className="text-2xl p-2 rounded-xl hover:bg-white/20 transition-colors text-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        onMouseEnter={emojiButtonHover.handleEnter}
                        onMouseLeave={emojiButtonHover.handleLeave}
                        role="button"
                        aria-label={`Send ${String(emoji ?? '')} emoji`}
                        tabIndex={0}
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
              id="chat-input"
              ref={inputRef}
              value={inputValue}
              onChange={(e) => {
                onInputChange(e.target.value)
              }}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  onSendMessage(inputValue, 'text')
                }
              }}
              placeholder="Type a message..."
              className="pr-12 glass-effect border-white/30 focus:border-primary/50 backdrop-blur-xl"
              aria-label="Message input"
            />
          </div>

          <Button
            onClick={() => {
              onStartRecording()
            }}
            size="icon"
            variant="ghost"
            className="shrink-0"
            aria-label="Record voice message"
          >
            <Microphone size={20} weight="regular" />
          </Button>

          <MotionView style={[sendButtonHover.animatedStyle, sendButtonTap.animatedStyle]}>
            <Button
              onClick={() => {
                onSendMessage(inputValue, 'text')
              }}
              disabled={!inputValue.trim()}
              size="icon"
              className="shrink-0 bg-linear-to-br from-primary to-accent hover:shadow-lg transition-all disabled:opacity-50"
              onMouseEnter={sendButtonHover.handleEnter}
              onMouseLeave={sendButtonHover.handleLeave}
              aria-label="Send message"
            >
              <PaperPlaneRight size={20} weight="fill" />
            </Button>
          </MotionView>
        </div>
      )}
    </MotionView>
  )
}
