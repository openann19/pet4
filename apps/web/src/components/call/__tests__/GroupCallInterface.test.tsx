import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GroupCallInterface from '../GroupCallInterface';
import type { GroupCallSession, CallParticipant } from '@/lib/call-types';

vi.mock('@/lib/haptics', () => ({
  haptics: {
    trigger: vi.fn(),
  },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}));

const mockParticipants: CallParticipant[] = [
  {
    id: 'participant1',
    name: 'Alice',
    avatar: 'https://example.com/alice.jpg',
    petName: 'Fluffy',
    isMuted: false,
    isVideoEnabled: true,
    isSpeaking: false,
  },
  {
    id: 'participant2',
    name: 'Bob',
    avatar: 'https://example.com/bob.jpg',
    petName: 'Max',
    isMuted: true,
    isVideoEnabled: false,
    isSpeaking: false,
  },
];

const createMockSession = (overrides?: Partial<GroupCallSession>): GroupCallSession => {
  return {
    call: {
      id: 'call1',
      roomId: 'room1',
      type: 'video',
      initiatorId: 'user1',
      status: 'active',
      startTime: new Date().toISOString(),
      duration: 0,
      quality: 'excellent',
      videoQuality: '1080p',
      title: 'Test Call',
    },
    participants: new Map(mockParticipants.map((p) => [p.id, p])),
    localParticipant: {
      id: 'local1',
      name: 'You',
      avatar: 'https://example.com/you.jpg',
      petName: 'Buddy',
      isMuted: false,
      isVideoEnabled: true,
      isSpeaking: false,
    },
    streams: new Map(),
    localStream: undefined,
    isMinimized: false,
    videoQuality: '1080p',
    layout: 'grid',
    ...overrides,
  };
};

describe('GroupCallInterface', () => {
  const mockOnEndCall = vi.fn();
  const mockOnToggleMute = vi.fn();
  const mockOnToggleVideo = vi.fn();
  const mockOnToggleLayout = vi.fn();
  const mockOnInviteParticipants = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render group call interface', () => {
    const session = createMockSession();
    render(
      <GroupCallInterface
        session={session}
        onEndCall={mockOnEndCall}
        onToggleMute={mockOnToggleMute}
        onToggleVideo={mockOnToggleVideo}
        onToggleLayout={mockOnToggleLayout}
        onInviteParticipants={mockOnInviteParticipants}
      />
    );

    expect(screen.getByRole('dialog', { name: 'Group call interface' })).toBeInTheDocument();
    expect(screen.getByText('Test Call')).toBeInTheDocument();
  });

  it('should display call title', () => {
    const session = createMockSession();
    render(
      <GroupCallInterface
        session={session}
        onEndCall={mockOnEndCall}
        onToggleMute={mockOnToggleMute}
        onToggleVideo={mockOnToggleVideo}
      />
    );

    expect(screen.getByText('Test Call')).toBeInTheDocument();
  });

  it('should display default title when no title provided', () => {
    const session = createMockSession({
      call: {
        ...createMockSession().call,
        title: undefined,
      },
    });
    render(
      <GroupCallInterface
        session={session}
        onEndCall={mockOnEndCall}
        onToggleMute={mockOnToggleMute}
        onToggleVideo={mockOnToggleVideo}
      />
    );

    expect(screen.getByText('Playdate Video Call')).toBeInTheDocument();
  });

  it('should display participant count', () => {
    const session = createMockSession();
    render(
      <GroupCallInterface
        session={session}
        onEndCall={mockOnEndCall}
        onToggleMute={mockOnToggleMute}
        onToggleVideo={mockOnToggleVideo}
      />
    );

    expect(screen.getByText(/3 participants/)).toBeInTheDocument();
  });

  it('should display call quality badge', () => {
    const session = createMockSession();
    render(
      <GroupCallInterface
        session={session}
        onEndCall={mockOnEndCall}
        onToggleMute={mockOnToggleMute}
        onToggleVideo={mockOnToggleVideo}
      />
    );

    expect(screen.getByLabelText('Call quality: excellent')).toBeInTheDocument();
    expect(screen.getByText('excellent')).toBeInTheDocument();
  });

  it('should handle mute toggle', async () => {
    const user = userEvent.setup();
    const session = createMockSession();
    render(
      <GroupCallInterface
        session={session}
        onEndCall={mockOnEndCall}
        onToggleMute={mockOnToggleMute}
        onToggleVideo={mockOnToggleVideo}
      />
    );

    const muteButton = screen.getByLabelText('Mute microphone');
    await user.click(muteButton);

    await waitFor(() => {
      expect(mockOnToggleMute).toHaveBeenCalledTimes(1);
    });
  });

  it('should handle video toggle', async () => {
    const user = userEvent.setup();
    const session = createMockSession();
    render(
      <GroupCallInterface
        session={session}
        onEndCall={mockOnEndCall}
        onToggleMute={mockOnToggleMute}
        onToggleVideo={mockOnToggleVideo}
      />
    );

    const videoButton = screen.getByLabelText('Disable video');
    await user.click(videoButton);

    await waitFor(() => {
      expect(mockOnToggleVideo).toHaveBeenCalledTimes(1);
    });
  });

  it('should handle end call', async () => {
    const user = userEvent.setup();
    const session = createMockSession();
    render(
      <GroupCallInterface
        session={session}
        onEndCall={mockOnEndCall}
        onToggleMute={mockOnToggleMute}
        onToggleVideo={mockOnToggleVideo}
      />
    );

    const endCallButton = screen.getByLabelText('End call');
    await user.click(endCallButton);

    await waitFor(() => {
      expect(mockOnEndCall).toHaveBeenCalledTimes(1);
    });
  });

  it('should handle layout toggle', async () => {
    const user = userEvent.setup();
    const session = createMockSession();
    render(
      <GroupCallInterface
        session={session}
        onEndCall={mockOnEndCall}
        onToggleMute={mockOnToggleMute}
        onToggleVideo={mockOnToggleVideo}
        onToggleLayout={mockOnToggleLayout}
      />
    );

    const layoutButton = screen.getByLabelText(/Toggle layout/);
    await user.click(layoutButton);

    await waitFor(() => {
      expect(mockOnToggleLayout).toHaveBeenCalledTimes(1);
    });
  });

  it('should toggle participants panel', async () => {
    const user = userEvent.setup();
    const session = createMockSession();
    render(
      <GroupCallInterface
        session={session}
        onEndCall={mockOnEndCall}
        onToggleMute={mockOnToggleMute}
        onToggleVideo={mockOnToggleVideo}
        onInviteParticipants={mockOnInviteParticipants}
      />
    );

    const participantsButton = screen.getByLabelText('Show participants');
    await user.click(participantsButton);

    await waitFor(() => {
      expect(screen.getByRole('complementary', { name: 'Participants panel' })).toBeInTheDocument();
    });
  });

  it('should handle raise hand', async () => {
    const user = userEvent.setup();
    const session = createMockSession();
    render(
      <GroupCallInterface
        session={session}
        onEndCall={mockOnEndCall}
        onToggleMute={mockOnToggleMute}
        onToggleVideo={mockOnToggleVideo}
      />
    );

    const raiseHandButton = screen.getByLabelText('Raise hand');
    await user.click(raiseHandButton);

    await waitFor(() => {
      expect(screen.getByLabelText('Lower hand')).toBeInTheDocument();
    });
  });

  it('should display muted state', () => {
    const session = createMockSession({
      localParticipant: {
        ...createMockSession().localParticipant,
        isMuted: true,
      },
    });
    render(
      <GroupCallInterface
        session={session}
        onEndCall={mockOnEndCall}
        onToggleMute={mockOnToggleMute}
        onToggleVideo={mockOnToggleVideo}
      />
    );

    expect(screen.getByLabelText('Unmute microphone')).toBeInTheDocument();
  });

  it('should display video disabled state', () => {
    const session = createMockSession({
      localParticipant: {
        ...createMockSession().localParticipant,
        isVideoEnabled: false,
      },
    });
    render(
      <GroupCallInterface
        session={session}
        onEndCall={mockOnEndCall}
        onToggleMute={mockOnToggleMute}
        onToggleVideo={mockOnToggleVideo}
      />
    );

    expect(screen.getByLabelText('Enable video')).toBeInTheDocument();
  });

  it('should display connecting state', () => {
    const session = createMockSession({
      call: {
        ...createMockSession().call,
        status: 'connecting',
      },
    });
    render(
      <GroupCallInterface
        session={session}
        onEndCall={mockOnEndCall}
        onToggleMute={mockOnToggleMute}
        onToggleVideo={mockOnToggleVideo}
      />
    );

    expect(screen.getByText('Connecting...')).toBeInTheDocument();
  });

  it('should display ringing state', () => {
    const session = createMockSession({
      call: {
        ...createMockSession().call,
        status: 'ringing',
      },
    });
    render(
      <GroupCallInterface
        session={session}
        onEndCall={mockOnEndCall}
        onToggleMute={mockOnToggleMute}
        onToggleVideo={mockOnToggleVideo}
      />
    );

    expect(screen.getByText('Ringing...')).toBeInTheDocument();
  });

  it('should handle invite participants', async () => {
    const user = userEvent.setup();
    const session = createMockSession();
    render(
      <GroupCallInterface
        session={session}
        onEndCall={mockOnEndCall}
        onToggleMute={mockOnToggleMute}
        onToggleVideo={mockOnToggleVideo}
        onInviteParticipants={mockOnInviteParticipants}
      />
    );

    const participantsButton = screen.getByLabelText('Show participants');
    await user.click(participantsButton);

    await waitFor(() => {
      expect(screen.getByRole('complementary')).toBeInTheDocument();
    });

    const inviteButton = screen.getByLabelText('Invite participants');
    await user.click(inviteButton);

    await waitFor(() => {
      expect(mockOnInviteParticipants).toHaveBeenCalledTimes(1);
    });
  });

  it('should display participants in panel', async () => {
    const user = userEvent.setup();
    const session = createMockSession();
    render(
      <GroupCallInterface
        session={session}
        onEndCall={mockOnEndCall}
        onToggleMute={mockOnToggleMute}
        onToggleVideo={mockOnToggleVideo}
      />
    );

    const participantsButton = screen.getByLabelText('Show participants');
    await user.click(participantsButton);

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('You')).toBeInTheDocument();
    });
  });

  it('should handle voice call type', () => {
    const session = createMockSession({
      call: {
        ...createMockSession().call,
        type: 'voice',
      },
    });
    render(
      <GroupCallInterface
        session={session}
        onEndCall={mockOnEndCall}
        onToggleMute={mockOnToggleMute}
        onToggleVideo={mockOnToggleVideo}
      />
    );

    expect(screen.queryByLabelText(/video/)).not.toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    const session = createMockSession();
    render(
      <GroupCallInterface
        session={session}
        onEndCall={mockOnEndCall}
        onToggleMute={mockOnToggleMute}
        onToggleVideo={mockOnToggleVideo}
      />
    );

    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Group call interface');
    expect(screen.getByRole('toolbar', { name: 'Call controls' })).toBeInTheDocument();
  });

  it('should update duration when call is active', async () => {
    vi.useFakeTimers();
    const session = createMockSession({
      call: {
        ...createMockSession().call,
        status: 'active',
      },
    });
    render(
      <GroupCallInterface
        session={session}
        onEndCall={mockOnEndCall}
        onToggleMute={mockOnToggleMute}
        onToggleVideo={mockOnToggleVideo}
      />
    );

    vi.advanceTimersByTime(5000);

    await waitFor(() => {
      expect(screen.getByText(/0:05/)).toBeInTheDocument();
    });

    vi.useRealTimers();
  });

  it('should handle different quality levels', () => {
    const qualities: ('excellent' | 'good' | 'fair' | 'poor')[] = [
      'excellent',
      'good',
      'fair',
      'poor',
    ];

    qualities.forEach((quality) => {
      const session = createMockSession({
        call: {
          ...createMockSession().call,
          quality,
        },
      });
      const { unmount } = render(
        <GroupCallInterface
          session={session}
          onEndCall={mockOnEndCall}
          onToggleMute={mockOnToggleMute}
          onToggleVideo={mockOnToggleVideo}
        />
      );

      expect(screen.getByLabelText(`Call quality: ${quality}`)).toBeInTheDocument();
      unmount();
    });
  });

  it('should handle different layouts', () => {
    const layouts: ('grid' | 'spotlight' | 'sidebar')[] = ['grid', 'spotlight', 'sidebar'];

    layouts.forEach((layout) => {
      const session = createMockSession({ layout });
      const { unmount } = render(
        <GroupCallInterface
          session={session}
          onEndCall={mockOnEndCall}
          onToggleMute={mockOnToggleMute}
          onToggleVideo={mockOnToggleVideo}
          onToggleLayout={mockOnToggleLayout}
        />
      );

      const layoutButton = screen.getByLabelText(new RegExp(`Toggle layout: ${layout}`));
      expect(layoutButton).toBeInTheDocument();
      unmount();
    });
  });
});
