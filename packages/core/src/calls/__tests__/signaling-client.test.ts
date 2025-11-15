// packages/core/src/calls/__tests__/signaling-client.test.ts

import { describe, expect, it } from 'vitest'
import type { CallSignal } from '../call-types'
import { CallSignalingClient } from '../signaling-client'

function drainHandlers(client: CallSignalingClient) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlers = (client as any).handlers as Set<(signal: CallSignal) => void>
  return handlers
}

describe('CallSignalingClient', () => {
  it('builds URL with query params', () => {
    const client = new CallSignalingClient({
      url: 'wss://example.com/calls',
      userId: 'user-1',
      token: 'token-123',
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const built = (client as any).buildUrl() as string
    expect(built).toContain('wss://example.com/calls')
    expect(built).toContain('userId=user-1')
    expect(built).toContain('token=token-123')
  })

  it('registers and removes handlers', () => {
    const client = new CallSignalingClient({
      url: 'wss://example.com/calls',
      userId: 'user-1',
    })

    const received: CallSignal[] = []
    const off = client.onSignal(signal => {
      received.push(signal)
    })

    for (const handler of drainHandlers(client)) {
      handler({
        type: 'call-end',
        callId: 'c1',
        fromUserId: 'a',
        toUserId: 'b',
        reason: 'test',
      })
    }

    expect(received).toHaveLength(1)
    off()

    for (const handler of drainHandlers(client)) {
      handler({
        type: 'call-end',
        callId: 'c1',
        fromUserId: 'a',
        toUserId: 'b',
        reason: 'test',
      })
    }

    expect(received).toHaveLength(1)
  })
})
