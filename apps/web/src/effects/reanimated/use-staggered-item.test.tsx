import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useStaggeredItem } from './use-staggered-item';

vi.mock('./useMotionPreferences', () => ({
    useMotionPreferences: () => ({ level: 'full', isReduced: false, isOff: false }),
}));

describe('useStaggeredItem', () => {
    it('returns layout motion shape with animatedStyle', () => {
        const { result } = renderHook(() => useStaggeredItem({ index: 0 }));

        expect(result.current.kind).toBe('layout');
        expect(result.current.animatedStyle).toBeDefined();
        expect(result.current.itemStyle).toBeDefined();
    });

    it('accepts direction option without breaking shape', () => {
        const { result } = renderHook(() => useStaggeredItem({ index: 0, direction: 'down' }));

        expect(result.current.kind).toBe('layout');
        expect(result.current.animatedStyle).toBeDefined();
    });

    it('disables animation when preferences level is off', () => {
        const { result } = renderHook(() =>
            useStaggeredItem({
                index: 0,
                preferences: { level: 'off', isReduced: true, isOff: true },
            }),
        );

        expect(result.current.opacity.value).toBe(1);
        expect(result.current.y.value).toBe(0);
    });
});
