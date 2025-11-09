'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Microphone, Smiley, Sparkle } from '@phosphor-icons/react';
import { AnimatePresence } from '@/effects/reanimated/animate-presence';
import { TemplatePanel } from './TemplatePanel';
import { StickerButton, ReactionButton, SendButtonIcon } from './Buttons';
import type { ChatMessage, MessageTemplate, SmartSuggestion } from '@/lib/chat-types';
import { CHAT_STICKERS, generateMessageId } from '@/lib/chat-utils';
import { REACTION_EMOJIS } from '@/lib/chat-types';
import { toast } from 'sonner';
import VoiceRecorder from '../VoiceRecorder';
import { useRef } from 'react';
import { useUIConfig } from "@/hooks/use-ui-config";
import { useChatKeyboardShortcuts } from '@/hooks/chat/use-chat-keyboard-shortcuts';

export interface ChatInputBarProps {
  inputValue: string;
  setInputValue: (v: string) => void;
  inputRef?: React.RefObject<HTMLInputElement>;
  showStickers: boolean;
  setShowStickers: (v: boolean) => void;
  showTemplates: boolean;
  setShowTemplates: (v: boolean) => void;
  isRecordingVoice: boolean;
  setIsRecordingVoice: (v: boolean) => void;
  onSend: (
    content: string,
    type?: ChatMessage['type'],
    attachments?: ChatMessage['attachments'],
    metadata?: ChatMessage['metadata']
  ) => void;
  onSuggestion: (s: SmartSuggestion) => void;
  onShareLocation: () => void;
  onTemplate: (t: MessageTemplate) => void;
  onQuickReaction?: (emoji: string) => void;
}

export function ChatInputBar({
  inputValue,
  setInputValue,
  inputRef: externalInputRef,
  showStickers,
  setShowStickers,
  showTemplates,
  setShowTemplates,
  isRecordingVoice,
  setIsRecordingVoice,
  onSend,
  onSuggestion: _onSuggestion,
  onShareLocation,
  onTemplate,
  onQuickReaction,
}: ChatInputBarProps): JSX.Element {
  const uiConfig = useUIConfig();
  const internalInputRef = useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef ?? internalInputRef;

  // Register keyboard shortcuts for input actions
  useChatKeyboardShortcuts({
    enabled: true,
    context: 'chat-input',
    onSend: () => {
      if (inputValue.trim()) {
        onSend(inputValue, 'text');
        setInputValue('');
      }
    },
    onFocusInput: () => {
      inputRef.current?.focus();
    },
    inputRef,
  });

  return (
    <div className="glass-strong border-t border-white/20 p-4 shadow-2xl backdrop-blur-2xl space-y-3">
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setShowTemplates(!showTemplates);
          }}
          className="shrink-0"
        >
          <Sparkle size={16} weight="fill" className="mr-1" />
          Templates
        </Button>
        <Button variant="ghost" size="sm" onClick={onShareLocation} className="shrink-0">
          <MapPin size={16} className="mr-1" />
          Location
        </Button>
      </div>

      {showTemplates && (
        <AnimatePresence>
          <TemplatePanel
            key="templates"
            onClose={() => {
              setShowTemplates(false);
            }}
            onSelect={(t) => {
              onTemplate(t);
              setShowTemplates(false);
            }}
          />
        </AnimatePresence>
      )}

      <div className="flex items-end gap-2">
        <Popover open={showStickers} onOpenChange={setShowStickers}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              aria-label={showStickers ? 'Close stickers panel' : 'Open stickers panel'}
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
                      onSelect={(emoji) => {
                        onSend(emoji, 'sticker');
                      }}
                    />
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="reactions" className="space-y-3">
                <div className="grid grid-cols-6 gap-2">
                  {REACTION_EMOJIS.map((emoji) => (
                    <ReactionButton
                      key={emoji}
                      emoji={emoji}
                      onClick={() => {
                        onQuickReaction?.(emoji);
                        setShowStickers(false);
                      }}
                    />
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
                id="composer"
                ref={inputRef}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    onSend(inputValue, 'text');
                    setInputValue('');
                  }
                }}
                placeholder="Type a message..."
                className="pr-12 glass-effect border-white/30 focus:border-primary/50 backdrop-blur-xl"
                aria-label="Message input"
              />
            </div>

            <Button
              onMouseDown={() => {
                setIsRecordingVoice(true);
              }}
              size="icon"
              variant="ghost"
              className="shrink-0"
              aria-label="Record voice message"
            >
              <Microphone size={24} />
            </Button>

            <Button
              onClick={() => {
                onSend(inputValue, 'text');
                setInputValue('');
              }}
              disabled={!inputValue.trim()}
              size="icon"
              className="shrink-0 bg-linear-to-br from-primary to-accent hover:shadow-lg transition-all"
              aria-label="Send message"
            >
              <SendButtonIcon />
            </Button>
          </>
        ) : (
          <VoiceRecorder
            onRecorded={(audioBlob, duration, waveform) => {
              const voiceUrl = URL.createObjectURL(audioBlob);
              onSend(
                'Voice message',
                'voice',
                [
                  {
                    id: generateMessageId(),
                    type: 'voice',
                    url: voiceUrl,
                    duration,
                    mimeType: audioBlob.type,
                  },
                ],
                { voiceNote: { duration, waveform } }
              );
              toast.success('Voice recorded');
              setIsRecordingVoice(false);
            }}
            onCancel={() => {
              setIsRecordingVoice(false);
            }}
          />
        )}
      </div>
    </div>
  );
}
