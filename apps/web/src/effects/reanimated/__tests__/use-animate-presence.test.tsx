import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAnimatePresence } from '../use-animate-presence';

const fullPreferences = { level: 'full', isReduced: false, isOff: false } as const;

vi.mock('../useMotionPreferences', () => ({
    useMotionPreferences: () => fullPreferences,
}));

describe('useAnimatePresence', () => {
    it('returns presence motion shape with animatedStyle and variants', () => {
        const { result } = renderHook(() =>
            useAnimatePresence({
                isVisible: false,
            }),
        );

        expect(result.current.kind).toBe('presence');
        expect(result.current.animatedStyle).toBeDefined();
        expect(result.current.variants.hidden).toBeDefined();
        expect(result.current.variants.visible).toBeDefined();
    });

    it('updates shouldRender when visibility changes', () => {
        const { result, rerender } = renderHook(
            ({ visible }: { visible: boolean }) =>
                useAnimatePresence({
                    isVisible: visible,
                    initial: false,
                }),
            {
                initialProps: { visible: false },
            },
        );

        expect(result.current.shouldRender).toBe(false);

        rerender({ visible: true });
        act(() => {
            /* flush effects */
        });
        expect(result.current.shouldRender).toBe(true);
    });

    it('disables animation when preferences level is off', () => {
        const { result } = renderHook(() =>
            useAnimatePresence({
                isVisible: false,
                preferences: { level: 'off', isReduced: true, isOff: true },
            }),
        );

        expect(result.current.opacity.value).toBe(0);
        expect(result.current.scale.value).toBe(1);
        expect(result.current.translateX.value).toBe(0);
        expect(result.current.translateY.value).toBe(0);
        expect(result.current.shouldRender).toBe(false);
    });
});
