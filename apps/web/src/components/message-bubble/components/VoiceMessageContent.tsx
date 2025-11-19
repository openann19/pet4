import { motion, type AnimatedStyle } from '@petspark/motion';
import { Waveform } from '@phosphor-icons/react';

import type { Message } from '@/lib/chat-types';
import type { useVoiceWaveform } from '@/hooks/use-voice-waveform';

interface VoiceMessageContentProps {
  message: Message;
  voiceWaveform: ReturnType<typeof useVoiceWaveform>;
}

export function VoiceMessageContent({ message, voiceWaveform }: VoiceMessageContentProps) {
  if (!message.metadata?.voiceNote) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 min-w-50">
      <Waveform size={20} />
      <div className="flex-1 h-8 bg-muted/50 rounded-full flex items-center gap-1 px-2">
        {voiceWaveform.animatedStyles.map((style, index) => (
          <MotionView
            key={index}
            style={style as AnimatedStyle}
            className="bg-primary w-1 rounded-full"
          >
            <div />
          </MotionView>
        ))}
      </div>
      <span className="text-xs">
        {Math.floor(message.metadata.voiceNote.duration / 60)}:
        {String(Math.floor(message.metadata.voiceNote.duration % 60)).padStart(2, '0')}
      </span>
    </div>
  );
}

