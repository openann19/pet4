/**
 * UI Context Provider (Mobile)
 *
 * Provides global UI configuration (ABSOLUTE_MAX_UI_MODE) to all components
 * via React Context.
 *
 * Location: apps/mobile/src/contexts/UIContext.tsx
 */

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

/**
 * Deep merge utility for merging UI config
 */
function deepMerge(
  target: AbsoluteMaxUIModeConfig,
  source: Partial<AbsoluteMaxUIModeConfig>
): AbsoluteMaxUIModeConfig {
  const result = { ...target };

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const typedKey = key as keyof AbsoluteMaxUIModeConfig;
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
        (result as Record<string, unknown>)[key] = deepMerge(
          targetValue as unknown as AbsoluteMaxUIModeConfig,
          sourceValue as unknown as Partial<AbsoluteMaxUIModeConfig>
        );
      } else if (sourceValue !== undefined) {
        (result as Record<string, unknown>)[key] = sourceValue;
      }
    }
  }

  return result;
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

