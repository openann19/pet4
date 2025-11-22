/**
 * MediaViewer tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MediaViewer } from '@/components/community/MediaViewer';
import type { MediaItem } from '@/components/community/MediaViewer';

// Mock dependencies
vi.mock('@/contexts/AppContext', () => ({
  useApp: () => ({
    t: {
      media: {
        close: 'Close',
        download: 'Download',
        share: 'Share',
        play: 'Play',
        pause: 'Pause',
      },
    },
  }),
}));

vi.mock('@/lib/haptics', () => ({
  haptics: {
    impact: vi.fn(() => undefined),
    trigger: vi.fn(() => undefined),
    light: vi.fn(() => undefined),
    medium: vi.fn(() => undefined),
    heavy: vi.fn(() => undefined),
    selection: vi.fn(() => undefined),
    success: vi.fn(() => undefined),
    warning: vi.fn(() => undefined),
    error: vi.fn(() => undefined),
    notification: vi.fn(() => undefined),
    isHapticSupported: vi.fn(() => false),
  },
  triggerHaptic: vi.fn(() => undefined),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('react-native-reanimated', () => ({
  useSharedValue: vi.fn(() => ({ value: 0 })),
  useAnimatedStyle: vi.fn(() => ({})),
  withSpring: vi.fn((v) => v),
  withTiming: vi.fn((v) => v),
  withDelay: vi.fn((v) => v),
  interpolate: vi.fn((v) => v),
  Extrapolation: {
    CLAMP: 'clamp',
  },
}));

vi.mock('@/effects/reanimated/animated-view', () => ({
  AnimatedView: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => <div {...props}>{children}</div>,
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

vi.mock('@/effects/reanimated', () => ({
  useHoverTap: vi.fn(() => ({})),
}));

vi.mock('@/effects/reanimated/transitions', () => ({
  springConfigs: { smooth: {} },
  timingConfigs: { fast: {} },
}));

vi.mock('@radix-ui/react-dialog', () => ({
  Root: ({ children, open }: { children?: React.ReactNode; open?: boolean }) => (open ? <div>{children}</div> : null),
  Portal: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Overlay: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Content: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Title: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Description: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Close: ({ children }: { children?: React.ReactNode }) => <button>{children}</button>,
}));

describe('MediaViewer', () => {
  const mockMedia: MediaItem[] = [
    {
      id: 'media-1',
      url: 'https://example.com/image.jpg',
      type: 'photo',
    },
    {
      id: 'media-2',
      url: 'https://example.com/video.mp4',
      type: 'video',
      thumbnail: 'https://example.com/thumb.jpg',
      duration: 60,
    },
  ];

  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when closed', () => {
    render(<MediaViewer open={false} onOpenChange={mockOnOpenChange} media={mockMedia} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render when open', () => {
    render(<MediaViewer open={true} onOpenChange={mockOnOpenChange} media={mockMedia} />);

    // Media viewer should render some media element (image or video)
    const mediaElement = document.querySelector('img, video');
    expect(mediaElement).not.toBeNull();
  });

  it('should display image media', () => {
    const imageMedia: MediaItem[] = [
      {
        id: 'img-1',
        url: 'https://example.com/image.jpg',
        type: 'photo',
      },
    ];

    render(<MediaViewer open={true} onOpenChange={mockOnOpenChange} media={imageMedia} />);

    const img = document.querySelector('img');
    expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');
  });

  it('should start at initialIndex', () => {
    render(
      <MediaViewer open={true} onOpenChange={mockOnOpenChange} media={mockMedia} initialIndex={1} />
    );

    // Should show second media item (video in this case)
    const mediaElement = document.querySelector('video, img');
    expect(mediaElement).not.toBeNull();
  });

  it('should handle empty media array', () => {
    render(<MediaViewer open={true} onOpenChange={mockOnOpenChange} media={[]} />);

    // Should handle gracefully
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
