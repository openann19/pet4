// apps/web/src/contexts/__tests__/CallContext.test.tsx
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CallProvider, useCall } from '../CallContext';

const mockCallImpl = {
  session: null,
  status: 'idle' as const,
  localStream: null as MediaStream | null,
  remoteStream: null as MediaStream | null,
  isMuted: false,
  isCameraOff: false,
  isScreenSharing: false,
  signalingClient: { onSignal: vi.fn().mockReturnValue(() => undefined) },
  startOutgoingCall: vi.fn().mockResolvedValue(undefined),
  handleIncomingOffer: vi.fn(),
  acceptIncomingCall: vi.fn().mockResolvedValue(undefined),
  rejectIncomingCall: vi.fn(),
  endCall: vi.fn(),
  toggleMute: vi.fn(),
  toggleCamera: vi.fn(),
  toggleScreenShare: vi.fn().mockResolvedValue(undefined),
};

vi.mock('@/hooks/calls/useWebRtcCall', () => ({ useWebRtcCall: () => mockCallImpl }));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', displayName: 'Test User', email: 'test@example.com', avatarUrl: null },
  }),
}));

function TestConsumer() {
  const { startCall } = useCall();
  return (
    <button
      type="button"
      onClick={() => {
        void startCall({ remoteUserId: 'user-2', remoteDisplayName: 'Remote User' });
      }}
    >
      start
    </button>
  );
}

describe('CallContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides a call context and allows starting a call', () => {
    render(
      <CallProvider signalingUrl="ws://example.test">
        <TestConsumer />
      </CallProvider>
    );

    const btn = screen.getByRole('button', { name: /start/i });
    fireEvent.click(btn);

    expect(mockCallImpl.startOutgoingCall).toHaveBeenCalledTimes(1);
    expect(mockCallImpl.startOutgoingCall).toHaveBeenCalledWith(
      expect.objectContaining({ remoteUserId: 'user-2', remoteDisplayName: 'Remote User' })
    );
  });
});
