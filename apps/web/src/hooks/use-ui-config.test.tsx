import { describe, it, expect } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import { useUIConfig } from './useUIConfig';
import { UIProvider } from '../contexts/UIContext';
import { ABSOLUTE_MAX_UI_MODE } from '@/agi_ui_engine/config/ABSOLUTE_MAX_UI_MODE';

describe('useUIConfig', () => {
  it('should return default config when used within UIProvider', () => {
    const { result } = renderHook(() => useUIConfig(), {
      wrapper: ({ children }: { children: ReactNode }) => <UIProvider>{children}</UIProvider>,
    });

    expect(result.current.config).toEqual(ABSOLUTE_MAX_UI_MODE);
    expect(result.current.visual).toEqual(ABSOLUTE_MAX_UI_MODE.visual);
    expect(result.current.animation).toEqual(ABSOLUTE_MAX_UI_MODE.animation);
    expect(result.current.performance).toEqual(ABSOLUTE_MAX_UI_MODE.performance);
    expect(result.current.feedback).toEqual(ABSOLUTE_MAX_UI_MODE.feedback);
    expect(result.current.theme).toEqual(ABSOLUTE_MAX_UI_MODE.theme);
    expect(result.current.debug).toEqual(ABSOLUTE_MAX_UI_MODE.debug);
  });

  it('should return merged config when custom config is provided', () => {
    const customConfig = {
      visual: {
        enableBlur: false,
        enableGlow: false,
      },
    } as Partial<typeof ABSOLUTE_MAX_UI_MODE>;

    const { result } = renderHook(() => useUIConfig(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <UIProvider config={customConfig}>{children}</UIProvider>
      ),
    });

    expect(result.current.visual.enableBlur).toBe(false);
    expect(result.current.visual.enableGlow).toBe(false);
    expect(result.current.visual.enableShadows).toBe(ABSOLUTE_MAX_UI_MODE.visual.enableShadows);
  });

  it('should provide convenient access to config sections', () => {
    const { result } = renderHook(() => useUIConfig(), {
      wrapper: ({ children }: { children: ReactNode }) => <UIProvider>{children}</UIProvider>,
    });

    expect(result.current.visual.enableBlur).toBe(true);
    expect(result.current.animation.enableReanimated).toBe(true);
    expect(result.current.performance.runOnUIThread).toBe(true);
    expect(result.current.feedback.haptics).toBe(true);
    expect(result.current.theme.adaptiveMood).toBe(true);
    expect(result.current.debug.logFrameDrops).toBe(false);
  });
});
