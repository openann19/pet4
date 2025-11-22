import { describe, it, expect } from 'vitest';
import { ABSOLUTE_MAX_UI_MODE } from '@/agi_ui_engine/config/ABSOLUTE_MAX_UI_MODE';
import type { AbsoluteMaxUIModeConfig } from '@/agi_ui_engine/config/ABSOLUTE_MAX_UI_MODE';

describe('ABSOLUTE_MAX_UI_MODE', () => {
  it('should export a valid config object', () => {
    expect(ABSOLUTE_MAX_UI_MODE).toBeDefined();
    expect(typeof ABSOLUTE_MAX_UI_MODE).toBe('object');
  });

  it('should have all required top-level sections', () => {
    const config: AbsoluteMaxUIModeConfig = ABSOLUTE_MAX_UI_MODE;
    expect(config.visual).toBeDefined();
    expect(config.animation).toBeDefined();
    expect(config.performance).toBeDefined();
    expect(config.feedback).toBeDefined();
    expect(config.theme).toBeDefined();
    expect(config.debug).toBeDefined();
  });

  it('should have correct visual config defaults', () => {
    expect(ABSOLUTE_MAX_UI_MODE.visual.enableBlur).toBe(true);
    expect(ABSOLUTE_MAX_UI_MODE.visual.enableGlow).toBe(true);
    expect(ABSOLUTE_MAX_UI_MODE.visual.enableShadows).toBe(true);
    expect(ABSOLUTE_MAX_UI_MODE.visual.enableShimmer).toBe(true);
    expect(ABSOLUTE_MAX_UI_MODE.visual.enable3DTilt).toBe(true);
    expect(ABSOLUTE_MAX_UI_MODE.visual.backdropSaturation).toBe(1.5);
    expect(ABSOLUTE_MAX_UI_MODE.visual.maxElevation).toBe(24);
    expect(ABSOLUTE_MAX_UI_MODE.visual.borderRadius).toBe('2xl');
    expect(ABSOLUTE_MAX_UI_MODE.visual.highContrastText).toBe(true);
  });

  it('should have correct animation config defaults', () => {
    expect(ABSOLUTE_MAX_UI_MODE.animation.enableReanimated).toBe(true);
    expect(ABSOLUTE_MAX_UI_MODE.animation.smoothEntry).toBe(true);
    expect(ABSOLUTE_MAX_UI_MODE.animation.tapFeedback).toBe('spring');
    expect(ABSOLUTE_MAX_UI_MODE.animation.motionBlur).toBe(true);
    expect(ABSOLUTE_MAX_UI_MODE.animation.showParticles).toBe(true);
    expect(ABSOLUTE_MAX_UI_MODE.animation.showTrails).toBe(true);
    expect(ABSOLUTE_MAX_UI_MODE.animation.motionFPS).toBe(60);
    expect(ABSOLUTE_MAX_UI_MODE.animation.springPhysics.damping).toBe(15);
    expect(ABSOLUTE_MAX_UI_MODE.animation.springPhysics.stiffness).toBe(250);
    expect(ABSOLUTE_MAX_UI_MODE.animation.springPhysics.mass).toBe(0.9);
  });

  it('should have correct performance config defaults', () => {
    expect(ABSOLUTE_MAX_UI_MODE.performance.runOnUIThread).toBe(true);
    expect(ABSOLUTE_MAX_UI_MODE.performance.skipReactRender).toBe(true);
    expect(ABSOLUTE_MAX_UI_MODE.performance.useSkiaWhereAvailable).toBe(true);
    expect(ABSOLUTE_MAX_UI_MODE.performance.flatListOptimized).toBe(true);
    expect(ABSOLUTE_MAX_UI_MODE.performance.layoutAwareAnimations).toBe(true);
  });

  it('should have correct feedback config defaults', () => {
    expect(ABSOLUTE_MAX_UI_MODE.feedback.haptics).toBe(true);
    expect(ABSOLUTE_MAX_UI_MODE.feedback.hapticStrength).toBe('strong');
    expect(ABSOLUTE_MAX_UI_MODE.feedback.sound).toBe(true);
    expect(ABSOLUTE_MAX_UI_MODE.feedback.showTooltips).toBe(true);
  });

  it('should have correct theme config defaults', () => {
    expect(ABSOLUTE_MAX_UI_MODE.theme.adaptiveMood).toBe(true);
    expect(ABSOLUTE_MAX_UI_MODE.theme.gradientIntensity).toBe(1.4);
    expect(ABSOLUTE_MAX_UI_MODE.theme.themeVariants).toEqual(['glass', 'neon', 'dark', 'vibrant']);
    expect(ABSOLUTE_MAX_UI_MODE.theme.avatarGlow).toBe(true);
    expect(ABSOLUTE_MAX_UI_MODE.theme.dynamicBackground).toBe(true);
  });

  it('should have correct debug config defaults', () => {
    expect(ABSOLUTE_MAX_UI_MODE.debug.logFrameDrops).toBe(false);
    expect(ABSOLUTE_MAX_UI_MODE.debug.traceSharedValues).toBe(false);
  });
});
