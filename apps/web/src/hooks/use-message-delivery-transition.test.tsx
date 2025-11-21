import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMessageDeliveryTransition } from './use-message-delivery-transition';
import { useMessageStatusMotion } from '@/effects/chat/status/use-message-status-motion';
import type { MessageStatus } from '@/lib/chat-types';

describe('useMessageDeliveryTransition', () => {
  beforeEach(() => {
    // Ensure clean state for each hook render
    vi.clearAllMocks();
  });

  it('acts as an alias for useMessageStatusMotion', () => {
    const status: MessageStatus = 'sent';

    const { result: aliasResult } = renderHook(() =>
      useMessageDeliveryTransition({
        status,
      })
    );

    const { result: directResult } = renderHook(() =>
      useMessageStatusMotion({
        status,
      })
    );

    expect(aliasResult.current.kind).toBe('status');
    expect(aliasResult.current.status).toBe(status);
    expect(aliasResult.current.status).toBe(directResult.current.status);
    expect(aliasResult.current.color).toBe(directResult.current.color);
    expect(aliasResult.current.animatedStyle).toEqual(directResult.current.animatedStyle);
  });
});
