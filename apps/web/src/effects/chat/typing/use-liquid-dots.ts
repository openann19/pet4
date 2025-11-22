import type {
  UseTypingIndicatorMotionOptions,
  UseTypingIndicatorMotionReturn,
} from './use-typing-indicator-motion';
import { useTypingIndicatorMotion } from './use-typing-indicator-motion';

export interface UseLiquidDotsOptions extends Omit<UseTypingIndicatorMotionOptions, 'isTyping'> {
  readonly enabled?: boolean;
  readonly dotSize?: number;
  readonly dotColor?: string;
  readonly dotSpacing?: number;
}

export type UseLiquidDotsReturn = UseTypingIndicatorMotionReturn;

export function useLiquidDots(options: UseLiquidDotsOptions = {}): UseLiquidDotsReturn {
  const {
    enabled = true,
    dotCount,
    reducedMode = 'static-dots',
    label,
    dotSize: _dotSize,
    dotColor: _dotColor,
    dotSpacing: _dotSpacing,
    ...motionOptions
  } = options;

  return useTypingIndicatorMotion({
    isTyping: enabled,
    dotCount,
    reducedMode,
    label,
    ...motionOptions,
  });
}
