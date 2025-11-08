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
    ? (deepMerge(
        ABSOLUTE_MAX_UI_MODE as unknown as Record<string, unknown>,
        config as Record<string, unknown>
      ) as unknown as AbsoluteMaxUIModeConfig)
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
function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key in source) {
    if (source[key] !== undefined) {
      const sourceValue = source[key];
      const targetValue = target[key];

      if (
        sourceValue !== null &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        targetValue !== null &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue)
      ) {
        result[key] = deepMerge(
          targetValue as Record<string, unknown>,
          sourceValue as Record<string, unknown>
        ) as T[Extract<keyof T, string>];
      } else {
        result[key] = sourceValue as T[Extract<keyof T, string>];
      }
    }
  }

  return result;
}
