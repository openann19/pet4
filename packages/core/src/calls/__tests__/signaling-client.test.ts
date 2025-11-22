// packages/core/src/calls/__tests__/signaling-client.test.ts

import { describe, expect, it } from 'vitest'
import type { CallSignal } from '../call-types'
import { CallSignalingClient } from '../signaling-client'

function drainHandlers(client: CallSignalingClient) {
  const internals = client.getDebugInternalsForTests()
  return internals.handlers
}

describe('CallSignalingClient', () => {
  it('builds URL with query params', () => {
    const client = new CallSignalingClient({
      url: 'wss://example.com/calls',
      userId: 'user-1',
      token: 'token-123',
    })

    const built = client.getDebugInternalsForTests().buildUrl()
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
