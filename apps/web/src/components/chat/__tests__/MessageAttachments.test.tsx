/**
 * MessageAttachments Component Tests
 * Location: apps/web/src/components/chat/__tests__/MessageAttachments.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MessageAttachments from '../MessageAttachments';
import type { MessageAttachment } from '@/lib/chat-types';

// Mock useHoverLift
vi.mock('@/effects/reanimated/use-hover-lift', () => ({
  useHoverLift: vi.fn(() => ({
    animatedStyle: {},
    handleEnter: vi.fn(),
    handleLeave: vi.fn(),
  })),
}));

// Mock AnimatedView
vi.mock('@/effects/reanimated/animated-view', () => ({
  AnimatedView: ({
    children,
    className,
    style,
    ...props
  }: {
    children: React.ReactNode;
    className?: string;
    style?: unknown;
    [key: string]: unknown;
  }) => (
    <div className={className} style={style as React.CSSProperties} {...props}>
      {children}
    </div>
  ),
  useAnimatedStyleValue: vi.fn((style: unknown) => {
    if (typeof style === 'function') {
      try {
        return style();
      } catch {
        return {};
      }
    }
    return style || {};
  }),
}));

describe('MessageAttachments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockVoiceAttachment: MessageAttachment & { waveform?: number[] } = {
    id: '1',
    type: 'voice',
    url: 'https://example.com/voice.mp3',
    duration: 120,
    waveform: [0.5, 0.7, 0.3, 0.9, 0.4],
  };

  const mockPhotoAttachment: MessageAttachment = {
    id: '2',
    type: 'photo',
    url: 'https://example.com/photo.jpg',
    name: 'test-photo.jpg',
  };

  const mockVideoAttachment: MessageAttachment = {
    id: '3',
    type: 'video',
    url: 'https://example.com/video.mp4',
    thumbnail: 'https://example.com/thumb.jpg',
    name: 'test-video.mp4',
  };

  const mockDocumentAttachment: MessageAttachment = {
    id: '4',
    type: 'document',
    url: 'https://example.com/doc.pdf',
    name: 'test-document.pdf',
    size: 1024 * 1024, // 1 MB
  };

  it('should render voice attachment', () => {
    render(<MessageAttachments attachments={[mockVoiceAttachment]} />);
    expect(screen.getByLabelText(/play voice message|pause voice message/i)).toBeInTheDocument();
  });

  it('should render photo attachment', () => {
    render(<MessageAttachments attachments={[mockPhotoAttachment]} />);
    expect(screen.getByAltText('test-photo.jpg')).toBeInTheDocument();
    expect(screen.getByLabelText('Download photo')).toBeInTheDocument();
  });

  it('should render video attachment', () => {
    render(<MessageAttachments attachments={[mockVideoAttachment]} />);
    const video = screen.getByLabelText('test-video.mp4');
    expect(video).toBeInTheDocument();
    expect(video.tagName).toBe('VIDEO');
  });

  it('should render document attachment', () => {
    render(<MessageAttachments attachments={[mockDocumentAttachment]} />);
    expect(screen.getByText('test-document.pdf')).toBeInTheDocument();
    expect(screen.getByText('1.0 MB')).toBeInTheDocument();
  });

  it('should render multiple attachments', () => {
    render(
      <MessageAttachments
        attachments={[mockVoiceAttachment, mockPhotoAttachment, mockVideoAttachment]}
      />
    );
    expect(screen.getByLabelText(/play voice message/i)).toBeInTheDocument();
    expect(screen.getByAltText('test-photo.jpg')).toBeInTheDocument();
    expect(screen.getByLabelText('test-video.mp4')).toBeInTheDocument();
  });

  it('should toggle voice playback', () => {
    render(<MessageAttachments attachments={[mockVoiceAttachment]} />);
    const playButton = screen.getByLabelText(/play voice message/i);
    fireEvent.click(playButton);
    expect(screen.getByLabelText(/pause voice message/i)).toBeInTheDocument();
  });

  it('should format duration correctly', () => {
    render(<MessageAttachments attachments={[mockVoiceAttachment]} />);
    expect(screen.getByText('2:00')).toBeInTheDocument();
  });

  it('should format file size correctly', () => {
    render(<MessageAttachments attachments={[mockDocumentAttachment]} />);
    expect(screen.getByText('1.0 MB')).toBeInTheDocument();
  });

  it('should render download button for photo', () => {
    render(<MessageAttachments attachments={[mockPhotoAttachment]} />);
    expect(screen.getByLabelText('Download photo')).toBeInTheDocument();
  });

  it('should render waveform container for voice attachment', () => {
    render(<MessageAttachments attachments={[mockVoiceAttachment]} />);
    const waveform = screen.getByLabelText('Audio waveform');
    expect(waveform).toBeInTheDocument();
  });
});
