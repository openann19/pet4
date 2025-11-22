import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useNavigationErrorTracking } from '../use-navigation-error-tracking';
import { createLogger } from '@/lib/logger';

vi.mock('@/lib/logger', () => ({
    createLogger: vi.fn(() => ({
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
    })),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>{children}</BrowserRouter>
);

describe('useNavigationErrorTracking', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('sets up error listeners when enabled', () => {
        const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
        const onError = vi.fn();

        renderHook(() => useNavigationErrorTracking({ onError, enabled: true }), { wrapper });

        expect(addEventListenerSpy).toHaveBeenCalledWith('error', expect.any(Function));
        expect(addEventListenerSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
    });

    it('does not set up listeners when disabled', () => {
        const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
        const onError = vi.fn();

        renderHook(() => useNavigationErrorTracking({ onError, enabled: false }), { wrapper });

        // BrowserRouter may add its own listeners, so we check that our specific listeners weren't added
        const errorListenerCalls = addEventListenerSpy.mock.calls.filter(
            (call) => call[0] === 'error' || call[0] === 'unhandledrejection'
        );
        expect(errorListenerCalls.length).toBe(0);
    });

    it('calls onError when window error occurs', () => {
        const onError = vi.fn();
        renderHook(() => useNavigationErrorTracking({ onError }), { wrapper });

        const errorEvent = new ErrorEvent('error', {
            error: new Error('Test error'),
            message: 'Test error',
            filename: '',
            lineno: 0,
            colno: 0,
        });

        window.dispatchEvent(errorEvent);

        expect(onError).toHaveBeenCalled();
    });

    it('calls onError when unhandled rejection occurs', () => {
        const onError = vi.fn();
        renderHook(() => useNavigationErrorTracking({ onError }), { wrapper });

        // Create a mock PromiseRejectionEvent since it's not available in jsdom
        const rejectedPromise = Promise.reject(new Error('Test rejection'));
        // Catch the rejection to prevent unhandled rejection warning
        rejectedPromise.catch(() => {
            // Intentionally empty - we're testing the event handler
        });

        const mockRejectionEvent = {
            type: 'unhandledrejection',
            reason: new Error('Test rejection'),
            promise: rejectedPromise,
        } as unknown as PromiseRejectionEvent;

        window.dispatchEvent(mockRejectionEvent as Event);

        expect(onError).toHaveBeenCalled();
    });

    it('detects chunk load errors', () => {
        const onError = vi.fn();
        renderHook(() => useNavigationErrorTracking({ onError }), { wrapper });

        const script = document.createElement('script');
        script.src = '/assets/chunk-123.js';
        document.body.appendChild(script);

        const errorEvent = new ErrorEvent('error', {
            error: new Error('Loading chunk failed'),
            message: 'Loading chunk failed',
            filename: '',
            lineno: 0,
            colno: 0,
        });
        Object.defineProperty(errorEvent, 'target', {
            value: script,
            writable: false,
        });

        window.dispatchEvent(errorEvent);

        expect(onError).toHaveBeenCalled();
        const call = onError.mock.calls[0]?.[0];
        expect(call?.type).toBe('chunk-load-error');
    });

    it('cleans up listeners on unmount', () => {
        const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
        const onError = vi.fn();

        const { unmount } = renderHook(() => useNavigationErrorTracking({ onError }), { wrapper });

        unmount();

        expect(removeEventListenerSpy).toHaveBeenCalledWith('error', expect.any(Function));
        expect(removeEventListenerSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
    });
});
