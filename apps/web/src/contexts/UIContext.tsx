'use client';

import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';
import type { AbsoluteMaxUIModeConfig } from '@/config/absolute-max-ui-mode';
import { ABSOLUTE_MAX_UI_MODE } from '@/config/absolute-max-ui-mode';

export interface UIContextType {
  config: AbsoluteMaxUIModeConfig;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export interface UIProviderProps {
  children: ReactNode;
  config?: Partial<AbsoluteMaxUIModeConfig>;
}

export function UIProvider({ children, config }: UIProviderProps): React.JSX.Element {
  const mergedConfig: AbsoluteMaxUIModeConfig = config
    ? deepMerge(ABSOLUTE_MAX_UI_MODE, config)
    : ABSOLUTE_MAX_UI_MODE;

  return <UIContext.Provider value={{ config: mergedConfig }}>{children}</UIContext.Provider>;
}

export function useUIContext(): UIContextType {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUIContext must be used within a UIProvider');
  }
  return context;
}

/**
 * Deep merge utility for merging UI config
 */
function deepMerge(
  target: AbsoluteMaxUIModeConfig,
  source: Partial<AbsoluteMaxUIModeConfig>
): AbsoluteMaxUIModeConfig {
  const result = { ...target };

  for (const key in source) {
    const typedKey = key as keyof AbsoluteMaxUIModeConfig;
    if (source[typedKey] !== undefined) {
      const sourceValue = source[typedKey];
      const targetValue = target[typedKey];

      if (
        sourceValue !== null &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        targetValue !== null &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue)
      ) {
        // For nested objects, do a shallow merge since they have different types
        (result as Record<string, unknown>)[key] = { ...targetValue, ...sourceValue };
      } else if (sourceValue !== undefined) {
        (result as Record<string, unknown>)[key] = sourceValue;
      }
    }
  }

  return result;
}
