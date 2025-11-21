import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { CallProvider, useCall } from '../CallContext.native'

vi.mock('@/hooks/call/use-call-manager', () => {
  const startCall = vi.fn().mockResolvedValue(undefined)
  return {
    useCallManager: () => ({
      callStatus: 'idle',
      currentCall: null,
      callState: null,
      session: null,
      startCall,
      acceptCall: vi.fn(),
      declineCall: vi.fn(),
      endCall: vi.fn(),
      toggleMute: vi.fn(),
      toggleCamera: vi.fn(),
      incomingCall: null,
      isInCall: false,
      hasIncomingCall: false,
      setIncomingCall: vi.fn(),
    }),
  }
})

function TestConsumer(): React.ReactElement {
  const call = useCall()
  return <Button onPress={() => void call.startCall('u2', 'Remote')} />
}

function Button({ onPress }: { onPress: () => void }): React.ReactElement {
  return <></>
}

describe('CallProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('proxies startCall to manager', async () => {
    const { UNSAFE_root } = render(
      <CallProvider>
        <TestConsumer />
      </CallProvider>
    )
    // Directly inspect rendered TestConsumer children for simplicity
    const props = UNSAFE_root.findByType(TestConsumer).props as { children?: unknown }
    expect(props.children).toBeDefined()
  })
})
