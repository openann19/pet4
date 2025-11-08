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
      await vi.advanceTimersByTimeAsync(50);
    });

    expect(result.current.revealedText.length).toBeGreaterThan(0);
  });

  it('should reveal text character by character', async () => {
    const { result } = renderHook(() =>
      useAITypingReveal({ text: 'Test', enabled: true, typingSpeed: 10 })
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30);
    });

    const initialLength = result.current.revealedText.length;

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30);
    });

    expect(result.current.revealedText.length).toBeGreaterThan(initialLength);
  });

  it('should complete typing', async () => {
    const { result } = renderHook(() =>
      useAITypingReveal({ text: 'Hi', enabled: true, typingSpeed: 10 })
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    await waitFor(() => {
      expect(result.current.isComplete).toBe(true);
    });
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

    act(() => {
      result.current.start();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });

    expect(result.current.revealedText.length).toBeGreaterThan(0);
  });
});
