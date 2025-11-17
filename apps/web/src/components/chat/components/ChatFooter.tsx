import { MotionView, useAnimatedStyle } from "@petspark/motion";
/**
 * Chat Footer Component
 *
 * Footer section with input and action buttons
 */

import { MapPin, Microphone, Smiley, Sparkle } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input, type InputRef } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEntryAnimation } from '@/effects/reanimated/use-entry-animation';
import { AnimatePresence } from '@/effects/reanimated/animate-presence';
import { StickerButton } from './StickerButton';
import { ReactionButton } from './ReactionButton';
import { SendButtonIcon } from './SendButtonIcon';
import { TemplatePanel } from './TemplatePanel';
import VoiceRecorder from '../VoiceRecorder';
import { REACTION_EMOJIS } from '@/lib/chat-types';
import { CHAT_STICKERS } from '@/lib/chat-utils';
import { useUIConfig } from "@/hooks/use-ui-config";

export interface ChatFooterProps {
  inputValue: string;
  inputRef: React.RefObject<InputRef>;
  showTemplates: boolean;
  showStickers: boolean;
  isRecordingVoice: boolean;
  onInputChange: (value: string) => void;
  onInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSend: () => void;
  onStickerSelect: (emoji: string) => void;
  onTemplateSelect: (template: {
    text: string;
    id?: string;
    title?: string;
    icon?: string;
    category?: string;
  }) => void;
  onShareLocation: () => void;
  onStartRecording: () => void;
  onVoiceRecorded: (audioBlob: Blob, duration: number, waveform: number[]) => void;
  onCancelRecording: () => void;
  setShowTemplates: (show: boolean) => void;
  setShowStickers: (show: boolean) => void;
}

export function ChatFooter({
  inputValue,
  inputRef,
  showTemplates,
  showStickers,
  isRecordingVoice,
  onInputChange,
  onInputKeyDown,
  onSend,
  onStickerSelect,
  onTemplateSelect,
  onShareLocation,
  onStartRecording,
  onVoiceRecorded,
  onCancelRecording,
  setShowTemplates,
  setShowStickers,
}: ChatFooterProps): JSX.Element {
    const _uiConfig = useUIConfig();
    const animation = useEntryAnimation({ initialY: 20, delay: 0 });

  const animatedStyle = useAnimatedStyle(() => {
    const scale = animation.scale.get();
    const translateY = animation.translateY.get();
    return {
      opacity: animation.opacity.get(),
      transform: [{ scale, translateY }],
    };
  });

  return (
    <MotionView
      style={animatedStyle}
      className="glass-strong border-t border-white/20 p-4 shadow-2xl backdrop-blur-2xl space-y-3"
    >
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setShowTemplates(!showTemplates); }}
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
            onClose={() => { setShowTemplates(false); }}
            onSelect={(template) => {
              onTemplateSelect({
                text: template.text,
                id: template.id,
                ...(template.title && { title: template.title }),
                ...(template.icon && { icon: template.icon }),
                category: template.category,
              });
            }}
          />
        </AnimatePresence>
      )}
      <div className="flex items-end gap-2">
        <Popover open={showStickers} onOpenChange={setShowStickers}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 w-10 h-10 p-0"
              aria-label={showStickers ? 'Close stickers and emojis' : 'Open stickers and emojis'}
              aria-expanded={showStickers}
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
                  {CHAT_STICKERS.map((sticker: { id: string; emoji: string }) => (
                    <StickerButton key={sticker.id} sticker={sticker} onSelect={onStickerSelect} />
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => { onInputChange(e.target.value); }}
                onKeyDown={onInputKeyDown}
                placeholder="Type a message..."
                className="pr-12 glass-effect border-white/30 focus:border-primary/50 backdrop-blur-xl"
              />
            </div>

            <Button
              onMouseDown={onStartRecording}
              size="sm"
              variant="ghost"
              className="shrink-0 w-10 h-10 p-0"
              aria-label="Record voice message"
            >
              <Microphone size={24} />
            </Button>

            <Button
              onClick={onSend}
              disabled={!inputValue.trim()}
              size="sm"
              className="shrink-0 w-10 h-10 p-0 bg-linear-to-br from-primary to-accent hover:shadow-lg transition-all"
              aria-label="Send message"
            >
              <SendButtonIcon isActive={!!inputValue.trim()} />
            </Button>
          </>
        ) : (
          <VoiceRecorder
            onRecorded={(audioBlob, duration, waveform) => {
              onVoiceRecorded(audioBlob, duration, waveform);
            }}
            onCancel={onCancelRecording}
          />
        )}
      </div>
    </MotionView>
  );
}
