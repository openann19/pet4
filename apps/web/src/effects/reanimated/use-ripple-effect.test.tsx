/**
 * useRippleEffect Hook Tests
 * Verifies ripple state management, configuration, and timed cleanup behavior.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { useRippleEffect } from './use-ripple-effect';

// Minimal stubs for motion primitives used by the hook
vi.mock('@petspark/motion', async () => {
    const actual = await vi.importActual<typeof import('@petspark/motion')>('@petspark/motion');
    return {
        ...actual,
        useSharedValue: vi.fn((initial: number) => ({ value: initial })),
        useAnimatedStyle: vi.fn((factory: () => Record<string, unknown>) => factory()),
        withTiming: vi.fn((value: number) => value),
        withSequence: vi.fn((...values: number[]) => values[values.length - 1]),
    };
});

describe('useRippleEffect', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('initializes with default options and empty ripples', () => {
        const { result } = renderHook(() => useRippleEffect());

        expect(result.current.ripples).toEqual([]);
        expect(result.current.color).toBe('rgba(255, 255, 255, 0.5)');
        expect(result.current.animatedStyle).toBeDefined();
    });

    it('adds a ripple on addRipple and removes it after duration', () => {
        const duration = 600;
        const { result } = renderHook(() => useRippleEffect({ duration, opacity: 0.5 }));

        const mockTarget = {
            getBoundingClientRect: () => ({ left: 10, top: 20 }),
            offsetWidth: 100,
            offsetHeight: 40,
        } as unknown as HTMLElement;

        const event = {
            currentTarget: mockTarget,
            clientX: 30,
            clientY: 60,
        } as unknown as ReactMouseEvent<HTMLElement>;

        act(() => {
            result.current.addRipple(event);
        });

        expect(result.current.ripples.length).toBe(1);
        const ripple = result.current.ripples[0];
        expect(ripple.x).toBe(20);
        expect(ripple.y).toBe(40);

        act(() => {
            vi.advanceTimersByTime(duration + 10);
        });

        expect(result.current.ripples.length).toBe(0);
    });
});
