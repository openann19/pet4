import React from 'react';
import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useUIConfig } from '../use-ui-config';
import { UIProvider } from '@/contexts/UIContext';
import { ABSOLUTE_MAX_UI_MODE } from '@/config/absolute-max-ui-mode';
import type { AbsoluteMaxUIModeConfig } from '@/config/absolute-max-ui-mode';

// Mock the config module
vi.mock('@/config/absolute-max-ui-mode', () => ({
  ABSOLUTE_MAX_UI_MODE: {
    visual: {
      enableBlur: true,
      enableGlow: true,
      enableShadows: true,
      enableShimmer: true,
      enable3DTilt: true,
      backdropSaturation: 1.5,
      maxElevation: 24,
      borderRadius: '2xl',
      highContrastText: true,
    },
    animation: {
      enableReanimated: true,
      smoothEntry: true,
      tapFeedback: 'spring',
      motionBlur: true,
      springPhysics: {
        damping: 15,
        stiffness: 250,
        mass: 0.9,
      },
      showParticles: true,
      showTrails: true,
      motionFPS: 60,
      motionLevel: 'full',
    },
    performance: {
      runOnUIThread: true,
      skipReactRender: true,
      useSkiaWhereAvailable: true,
      flatListOptimized: true,
      layoutAwareAnimations: true,
    },
    feedback: {
      haptics: true,
      hapticStrength: 'strong',
      sound: true,
      showTooltips: true,
    },
    theme: {
      adaptiveMood: true,
      gradientIntensity: 1.4,
      themeVariants: ['glass', 'neon', 'dark', 'vibrant'],
      avatarGlow: true,
      dynamicBackground: true,
    },
    debug: {
      logFrameDrops: false,
      traceSharedValues: false,
    },
  },
}));

describe('useUIConfig', () => {
  const createWrapper = (config?: Partial<AbsoluteMaxUIModeConfig>) => {
    return ({ children }: { children: React.ReactNode }) => (
      <UIProvider config={config}>{children}</UIProvider>
    );
  };

  it('should return default configuration when no custom config provided', () => {
    const { result } = renderHook(() => useUIConfig(), {
      wrapper: createWrapper(),
    });

    expect(result.current.config).toEqual(ABSOLUTE_MAX_UI_MODE);
    expect(result.current.visual).toEqual(ABSOLUTE_MAX_UI_MODE.visual);
    expect(result.current.animation).toEqual(ABSOLUTE_MAX_UI_MODE.animation);
    expect(result.current.performance).toEqual(ABSOLUTE_MAX_UI_MODE.performance);
    expect(result.current.feedback).toEqual(ABSOLUTE_MAX_UI_MODE.feedback);
    expect(result.current.theme).toEqual(ABSOLUTE_MAX_UI_MODE.theme);
    expect(result.current.debug).toEqual(ABSOLUTE_MAX_UI_MODE.debug);
  });

  it('should return merged configuration when custom config provided', () => {
    const customConfig: Partial<AbsoluteMaxUIModeConfig> = {
      visual: {
        enableBlur: false,
        enableGlow: false,
        enableShadows: false,
        enableShimmer: false,
        enable3DTilt: false,
        backdropSaturation: 1.0,
        maxElevation: 12,
        borderRadius: 'lg',
        highContrastText: false,
      },
    };

    const { result } = renderHook(() => useUIConfig(), {
      wrapper: createWrapper(customConfig),
    });

    expect(result.current.visual).toEqual(customConfig.visual);
    expect(result.current.animation).toEqual(ABSOLUTE_MAX_UI_MODE.animation);
    expect(result.current.performance).toEqual(ABSOLUTE_MAX_UI_MODE.performance);
    expect(result.current.feedback).toEqual(ABSOLUTE_MAX_UI_MODE.feedback);
    expect(result.current.theme).toEqual(ABSOLUTE_MAX_UI_MODE.theme);
    expect(result.current.debug).toEqual(ABSOLUTE_MAX_UI_MODE.debug);
  });

  it('should return all configuration sections as separate properties', () => {
    const { result } = renderHook(() => useUIConfig(), {
      wrapper: createWrapper(),
    });

    // Check that all sections are accessible
    expect(result.current.visual).toBeDefined();
    expect(result.current.animation).toBeDefined();
    expect(result.current.performance).toBeDefined();
    expect(result.current.feedback).toBeDefined();
    expect(result.current.theme).toBeDefined();
    expect(result.current.debug).toBeDefined();

    // Check that they are objects
    expect(typeof result.current.visual).toBe('object');
    expect(typeof result.current.animation).toBe('object');
    expect(typeof result.current.performance).toBe('object');
    expect(typeof result.current.feedback).toBe('object');
    expect(typeof result.current.theme).toBe('object');
    expect(typeof result.current.debug).toBe('object');
  });

  it('should provide access to visual configuration properties', () => {
    const { result } = renderHook(() => useUIConfig(), {
      wrapper: createWrapper(),
    });

    const visual = result.current.visual;
    expect(visual.enableBlur).toBe(true);
    expect(visual.enableGlow).toBe(true);
    expect(visual.enableShadows).toBe(true);
    expect(visual.enableShimmer).toBe(true);
    expect(visual.enable3DTilt).toBe(true);
    expect(visual.backdropSaturation).toBe(1.5);
    expect(visual.maxElevation).toBe(24);
    expect(visual.borderRadius).toBe('2xl');
    expect(visual.highContrastText).toBe(true);
  });

  it('should provide access to animation configuration properties', () => {
    const { result } = renderHook(() => useUIConfig(), {
      wrapper: createWrapper(),
    });

    const animation = result.current.animation;
    expect(animation.enableReanimated).toBe(true);
    expect(animation.smoothEntry).toBe(true);
    expect(animation.tapFeedback).toBe('spring');
    expect(animation.motionBlur).toBe(true);
    expect(animation.springPhysics).toEqual({
      damping: 15,
      stiffness: 250,
      mass: 0.9,
    });
    expect(animation.showParticles).toBe(true);
    expect(animation.showTrails).toBe(true);
    expect(animation.motionFPS).toBe(60);
    expect(animation.motionLevel).toBe('full');
  });

  it('should provide access to performance configuration properties', () => {
    const { result } = renderHook(() => useUIConfig(), {
      wrapper: createWrapper(),
    });

    const performance = result.current.performance;
    expect(performance.runOnUIThread).toBe(true);
    expect(performance.skipReactRender).toBe(true);
    expect(performance.useSkiaWhereAvailable).toBe(true);
    expect(performance.flatListOptimized).toBe(true);
    expect(performance.layoutAwareAnimations).toBe(true);
  });

  it('should provide access to feedback configuration properties', () => {
    const { result } = renderHook(() => useUIConfig(), {
      wrapper: createWrapper(),
    });

    const feedback = result.current.feedback;
    expect(feedback.haptics).toBe(true);
    expect(feedback.hapticStrength).toBe('strong');
    expect(feedback.sound).toBe(true);
    expect(feedback.showTooltips).toBe(true);
  });

  it('should provide access to theme configuration properties', () => {
    const { result } = renderHook(() => useUIConfig(), {
      wrapper: createWrapper(),
    });

    const theme = result.current.theme;
    expect(theme.adaptiveMood).toBe(true);
    expect(theme.gradientIntensity).toBe(1.4);
    expect(theme.themeVariants).toEqual(['glass', 'neon', 'dark', 'vibrant']);
    expect(theme.avatarGlow).toBe(true);
    expect(theme.dynamicBackground).toBe(true);
  });

  it('should provide access to debug configuration properties', () => {
    const { result } = renderHook(() => useUIConfig(), {
      wrapper: createWrapper(),
    });

    const debug = result.current.debug;
    expect(debug.logFrameDrops).toBe(false);
    expect(debug.traceSharedValues).toBe(false);
  });

  it('should merge partial custom configuration with defaults', () => {
    const customConfig: Partial<AbsoluteMaxUIModeConfig> = {
      animation: {
        enableReanimated: false,
        smoothEntry: false,
        tapFeedback: 'scale',
        motionBlur: false,
        springPhysics: {
          damping: 20,
          stiffness: 300,
          mass: 1.0,
        },
        showParticles: false,
        showTrails: false,
        motionFPS: 30,
        motionLevel: 'reduced',
      },
    };

    const { result } = renderHook(() => useUIConfig(), {
      wrapper: createWrapper(customConfig),
    });

    expect(result.current.animation).toEqual(customConfig.animation);
    expect(result.current.visual).toEqual(ABSOLUTE_MAX_UI_MODE.visual);
    expect(result.current.performance).toEqual(ABSOLUTE_MAX_UI_MODE.performance);
    expect(result.current.feedback).toEqual(ABSOLUTE_MAX_UI_MODE.feedback);
    expect(result.current.theme).toEqual(ABSOLUTE_MAX_UI_MODE.theme);
    expect(result.current.debug).toEqual(ABSOLUTE_MAX_UI_MODE.debug);
  });

  it('should return consistent config object reference', () => {
    const { result, rerender } = renderHook(() => useUIConfig(), {
      wrapper: createWrapper(),
    });

    const initialConfig = result.current.config;
    const initialVisual = result.current.visual;

    rerender();

    expect(result.current.config).toBe(initialConfig);
    expect(result.current.visual).toBe(initialVisual);
  });

  it('should throw error when used outside UIProvider', () => {
    expect(() => {
      renderHook(() => useUIConfig());
    }).toThrow('useUIContext must be used within a UIProvider');
  });

  it('should return all expected properties', () => {
    const { result } = renderHook(() => useUIConfig(), {
      wrapper: createWrapper(),
    });

    const hookReturn = result.current;
    const expectedKeys = [
      'config',
      'visual',
      'animation',
      'performance',
      'feedback',
      'theme',
      'debug',
    ];

    expectedKeys.forEach((key) => {
      expect(hookReturn).toHaveProperty(key);
    });

    expect(Object.keys(hookReturn)).toHaveLength(expectedKeys.length);
  });

  describe('Complex configuration merging', () => {
    it('should handle multiple section overrides', () => {
      const customConfig: Partial<AbsoluteMaxUIModeConfig> = {
        visual: {
          enableBlur: false,
          enableGlow: false,
          enableShadows: false,
          enableShimmer: false,
          enable3DTilt: false,
          backdropSaturation: 1.0,
          maxElevation: 12,
          borderRadius: 'lg',
          highContrastText: false,
        },
        feedback: {
          haptics: false,
          hapticStrength: 'light',
          sound: false,
          showTooltips: false,
        },
      };

      const { result } = renderHook(() => useUIConfig(), {
        wrapper: createWrapper(customConfig),
      });

      expect(result.current.visual).toEqual(customConfig.visual);
      expect(result.current.feedback).toEqual(customConfig.feedback);
      expect(result.current.animation).toEqual(ABSOLUTE_MAX_UI_MODE.animation);
      expect(result.current.performance).toEqual(ABSOLUTE_MAX_UI_MODE.performance);
      expect(result.current.theme).toEqual(ABSOLUTE_MAX_UI_MODE.theme);
      expect(result.current.debug).toEqual(ABSOLUTE_MAX_UI_MODE.debug);
    });
  });
});
