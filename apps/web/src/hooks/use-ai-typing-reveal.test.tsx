import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAITypingReveal } from './use-ai-typing-reveal';

describe('useAITypingReveal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useAITypingReveal({ text: 'Hello', enabled: false }));

    expect(result.current.revealedLength.value).toBe(0);
    expect(result.current.cursorOpacity.value).toBe(1);
    expect(result.current.contentOpacity.value).toBe(0);
    expect(result.current.revealedText).toBe('');
    expect(result.current.isComplete).toBe(false);
  });

  it('should start typing when enabled', async () => {
    const { result } = renderHook(() =>
      useAITypingReveal({ text: 'Hi', enabled: true, typingSpeed: 10 })
    );

    await act(async () => {
      // Advance past revealDelay (200ms default) + first character typingSpeed (10ms) + buffer
      await vi.advanceTimersByTimeAsync(250);
    });

    await waitFor(
      () => {
        expect(result.current.revealedText.length).toBeGreaterThan(0);
      },
      { timeout: 500 }
    );
  });

  it('should reveal text character by character', async () => {
    const { result } = renderHook(() =>
      useAITypingReveal({ text: 'Test', enabled: true, typingSpeed: 10 })
    );

    await act(async () => {
      // Advance past revealDelay (200ms default) + first character
      await vi.advanceTimersByTimeAsync(220);
    });

    const initialLength = result.current.revealedText.length;

    await act(async () => {
      // Advance for next character
      await vi.advanceTimersByTimeAsync(20);
    });

    expect(result.current.revealedText.length).toBeGreaterThan(initialLength);
  });

  it('should complete typing', async () => {
    const { result } = renderHook(() =>
      useAITypingReveal({ text: 'Hi', enabled: true, typingSpeed: 10 })
    );

    await act(async () => {
      // Advance past revealDelay (200ms) + 2 characters * typingSpeed (10ms each) + buffer
      await vi.advanceTimersByTimeAsync(300);
      // Allow React to process updates
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await waitFor(
      () => {
        expect(result.current.isComplete).toBe(true);
      },
      { timeout: 1000 }
    );
  });

  it('should reset state', () => {
    const { result } = renderHook(() => useAITypingReveal({ text: 'Test', enabled: false }));

    act(() => {
      result.current.reset();
    });

    expect(result.current.revealedLength.value).toBe(0);
    expect(result.current.cursorOpacity.value).toBe(1);
    expect(result.current.contentOpacity.value).toBe(0);
    expect(result.current.revealedText).toBe('');
    expect(result.current.isComplete).toBe(false);
  });

  it('should provide animated styles', () => {
    const { result } = renderHook(() => useAITypingReveal({ text: 'Test', enabled: false }));

    expect(result.current.animatedStyle).toBeDefined();
    expect(result.current.cursorStyle).toBeDefined();
  });

  it('should not start when disabled', () => {
    const { result } = renderHook(() => useAITypingReveal({ text: 'Test', enabled: false }));

    expect(result.current.revealedText).toBe('');
    expect(result.current.isComplete).toBe(false);
  });

  it('should handle empty text', () => {
    const { result } = renderHook(() => useAITypingReveal({ text: '', enabled: true }));

    expect(result.current.revealedText).toBe('');
  });

  it('should call start manually', async () => {
    const { result } = renderHook(() => useAITypingReveal({ text: 'Manual', enabled: false }));

    await act(async () => {
      result.current.start();
      // Advance past revealDelay (200ms default) + first character typingSpeed (30ms default) + buffer
      await vi.advanceTimersByTimeAsync(300);
    });

    await waitFor(
      () => {
        expect(result.current.revealedText.length).toBeGreaterThan(0);
      },
      { timeout: 500 }
    );
  });
});
