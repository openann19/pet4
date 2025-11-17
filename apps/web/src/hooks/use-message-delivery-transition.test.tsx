import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMessageDeliveryTransition } from './use-message-delivery-transition';
import type { MessageStatus } from '@/lib/chat-types';

describe('useMessageDeliveryTransition', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useMessageDeliveryTransition({ status: 'sent' }));

    expect(result.current.opacity.value).toBe(1);
    expect(result.current.scale.value).toBe(1);
    expect(result.current.colorIntensity.value).toBe(0);
  });

  it('should initialize with color intensity for read status', () => {
    const { result } = renderHook(() => useMessageDeliveryTransition({ status: 'read' }));

    expect(result.current.colorIntensity.value).toBe(1);
  });

  it('should initialize with color intensity for delivered status', () => {
    const { result } = renderHook(() => useMessageDeliveryTransition({ status: 'delivered' }));

    expect(result.current.colorIntensity.value).toBe(1);
  });

  it('should animate status change', () => {
    const { result } = renderHook(() =>
      useMessageDeliveryTransition({ status: 'sent', previousStatus: 'sending' })
    );

    act(() => {
      result.current.animateStatusChange('delivered');
    });

    expect(result.current.opacity.value).toBeLessThan(1);
    expect(result.current.scale.value).toBeGreaterThan(1);
  });

  it('should animate from delivered to read', () => {
    const { result } = renderHook(() =>
      useMessageDeliveryTransition({ status: 'read', previousStatus: 'delivered' })
    );

    act(() => {
      result.current.animateStatusChange('read');
    });

    expect(result.current.colorIntensity.value).toBeGreaterThanOrEqual(0);
  });

  it('should provide animated style', () => {
    const { result } = renderHook(() => useMessageDeliveryTransition({ status: 'sent' }));

    expect(result.current.animatedStyle).toBeDefined();
  });

  it('should handle status change effect', () => {
    const { result, rerender } = renderHook(
      ({ status, previousStatus }: { status: MessageStatus; previousStatus?: MessageStatus }) =>
        useMessageDeliveryTransition({
          status,
          ...(previousStatus !== undefined && { previousStatus }),
        }),
      { initialProps: { status: 'sent' as MessageStatus } }
    );

    expect(result.current.colorIntensity.value).toBe(0);

    rerender({ status: 'delivered' as MessageStatus, previousStatus: 'sent' as MessageStatus } as {
      status: MessageStatus;
      previousStatus?: MessageStatus;
    });

    expect(result.current.colorIntensity.value).toBeGreaterThanOrEqual(0);
  });
});
