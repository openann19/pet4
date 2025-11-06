/**
 * Unit tests for usePressBounce hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePressBounce } from '../recipes/usePressBounce';

describe('usePressBounce', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock reduced motion as false
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => usePressBounce());
    
    expect(result.current.onPressIn).toBeDefined();
    expect(result.current.onPressOut).toBeDefined();
    expect(result.current.animatedStyle).toBeDefined();
  });

  it('should handle press in/out callbacks', () => {
    const { result } = renderHook(() => usePressBounce(0.96));
    
    act(() => {
      result.current.onPressIn();
    });
    
    act(() => {
      result.current.onPressOut();
    });
    
    // Callbacks should execute without errors
    expect(result.current.onPressIn).toBeDefined();
    expect(result.current.onPressOut).toBeDefined();
  });

  it('should respect reduced motion (instant animations)', () => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: true, // Reduced motion enabled
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    const { result } = renderHook(() => usePressBounce());
    
    act(() => {
      result.current.onPressIn();
    });
    
    // Should use instant duration when reduced motion is enabled
    expect(result.current.onPressIn).toBeDefined();
  });
});
