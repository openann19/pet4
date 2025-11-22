'use client';

import { useUIContext } from '@/contexts/UIContext';
import type { AbsoluteMaxUIModeConfig } from '@/config/absolute-max-ui-mode';

export interface UseUIConfigReturn {
  config: AbsoluteMaxUIModeConfig;
  visual: AbsoluteMaxUIModeConfig['visual'];
  animation: AbsoluteMaxUIModeConfig['animation'];
  performance: AbsoluteMaxUIModeConfig['performance'];
  feedback: AbsoluteMaxUIModeConfig['feedback'];
  theme: AbsoluteMaxUIModeConfig['theme'];
  debug: AbsoluteMaxUIModeConfig['debug'];
}

/**
 * Hook to access global UI configuration
 *
 * @example
 * ```tsx
 * const { enableBlur, enable3DTilt } = useUIConfig()
 * ```
 */
export function useUIConfig(): UseUIConfigReturn {
  const { config } = useUIContext();

  return {
    config,
    visual: config.visual,
    animation: config.animation,
    performance: config.performance,
    feedback: config.feedback,
    theme: config.theme,
    debug: config.debug,
  };
}
