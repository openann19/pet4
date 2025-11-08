'use client';

import { useState, useCallback } from 'react';
import { Play, Pause, DownloadSimple } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import { useHoverLift } from '@/effects/reanimated/use-hover-lift';
import { SmartImage } from '@/components/media/SmartImage';
import type { MessageAttachment } from '@/lib/chat-types';

interface MessageAttachmentsProps {
  attachments: MessageAttachment[];
}

export default function MessageAttachments({
  attachments,
}: MessageAttachmentsProps): React.JSX.Element {
  return (
    <div className="space-y-2">
      {attachments.map((attachment) => {
        if (attachment.type === 'voice') {
          return <VoiceAttachment key={attachment.id} attachment={attachment} />;
        }
        if (attachment.type === 'photo') {
          return <PhotoAttachment key={attachment.id} attachment={attachment} />;
        }
        if (attachment.type === 'video') {
          return <VideoAttachment key={attachment.id} attachment={attachment} />;
        }
        if (attachment.type === 'document') {
          return <DocumentAttachment key={attachment.id} attachment={attachment} />;
        }
        return null;
      })}
    </div>
  );
}

interface VoiceAttachmentProps {
  attachment: MessageAttachment & {
    waveform?: number[];
  };
}

function VoiceAttachment({ attachment }: VoiceAttachmentProps): React.JSX.Element {
  const [isPlaying, setIsPlaying] = useState(false);

  const formatDuration = useCallback((seconds = 0): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const togglePlayback = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  // Use waveform from attachment if available, otherwise generate default
  const waveform = attachment.waveform ?? Array.from({ length: 30 }, () => 0.5);

  return (
    <div className="flex items-center gap-3 min-w-[200px]">
      <Button
        size="icon"
        variant="ghost"
        onClick={togglePlayback}
        className="shrink-0 w-8 h-8"
        aria-label={isPlaying ? 'Pause voice message' : 'Play voice message'}
      >
        {isPlaying ? <Pause size={16} weight="fill" /> : <Play size={16} weight="fill" />}
      </Button>

      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-0.5 h-4" role="img" aria-label="Audio waveform">
          {waveform.map((value: number, idx: number) => (
            <div
              key={idx}
              className="flex-1 bg-current opacity-40 rounded-full"
              style={{ height: `${Math.max(20, value * 100)}%` }}
            />
          ))}
        </div>
        <span className="text-[10px] opacity-70">{formatDuration(attachment.duration)}</span>
      </div>
    </div>
  );
}

interface PhotoAttachmentProps {
  attachment: MessageAttachment;
}

function PhotoAttachment({ attachment }: PhotoAttachmentProps): React.JSX.Element {
  const hoverAnimation = useHoverLift({
    scale: 1.02,
  });

  const handleDownload = useCallback(() => {
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.name ?? 'photo';
    link.click();
  }, [attachment.url, attachment.name]);

  return (
    <AnimatedView
      style={hoverAnimation.animatedStyle}
      className="relative rounded-lg overflow-hidden max-w-sm"
      onMouseEnter={hoverAnimation.handleEnter}
      onMouseLeave={hoverAnimation.handleLeave}
    >
      <SmartImage
        src={attachment.url}
        {...(attachment.thumbnail ? { lqip: attachment.thumbnail } : {})}
        alt={attachment.name ?? 'Photo attachment'}
        className="w-full h-auto"
        onLoad={() => {
          // Image loaded successfully
        }}
      />
      <Button
        size="icon"
        variant="ghost"
        className="absolute top-2 right-2 bg-black/50 hover:bg-black/70"
        onClick={handleDownload}
        aria-label="Download photo"
      >
        <DownloadSimple size={16} weight="bold" />
      </Button>
    </AnimatedView>
  );
}

interface VideoAttachmentProps {
  attachment: MessageAttachment;
}

function VideoAttachment({ attachment }: VideoAttachmentProps): React.JSX.Element {
  const hoverAnimation = useHoverLift({
    scale: 1.02,
  });

  return (
    <AnimatedView
      style={hoverAnimation.animatedStyle}
      className="relative rounded-lg overflow-hidden max-w-sm"
      onMouseEnter={hoverAnimation.handleEnter}
      onMouseLeave={hoverAnimation.handleLeave}
    >
      <video
        src={attachment.url}
        controls
        className="w-full h-auto"
        poster={attachment.thumbnail}
        aria-label={attachment.name ?? 'Video attachment'}
      />
    </AnimatedView>
  );
}

interface DocumentAttachmentProps {
  attachment: MessageAttachment;
}

function DocumentAttachment({ attachment }: DocumentAttachmentProps): React.JSX.Element {
  const hoverAnimation = useHoverLift({
    scale: 1.02,
  });

  const formatFileSize = useCallback((bytes = 0): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }, []);

  const handleDownload = useCallback(() => {
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.name ?? 'document';
    link.click();
  }, [attachment.url, attachment.name]);

  return (
    <AnimatedView
      style={hoverAnimation.animatedStyle}
      className="flex items-center gap-3 p-3 glass-effect rounded-lg"
      onMouseEnter={hoverAnimation.handleEnter}
      onMouseLeave={hoverAnimation.handleLeave}
    >
      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
        <span className="text-xs font-bold">DOC</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{attachment.name ?? 'Document'}</p>
        <p className="text-xs text-muted-foreground">{formatFileSize(attachment.size ?? 0)}</p>
      </div>
      <Button
        size="icon"
        variant="ghost"
        onClick={handleDownload}
        aria-label={`Download ${attachment.name ?? 'document'}`}
      >
        <DownloadSimple size={16} weight="bold" />
      </Button>
    </AnimatedView>
  );
}
