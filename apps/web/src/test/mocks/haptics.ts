import { vi } from 'vitest';

interface HapticsShim {
  trigger: (type: string) => void;
  light: () => void;
  medium: () => void;
  heavy: () => void;
  selection: () => void;
  success: () => void;
  warning: () => void;
  error: () => void;
}

interface HapticsCall {
  method: string;
  args: unknown[];
  timestamp: number;
}

let hapticsCallCounter = 0;
export const hapticsCalls: HapticsCall[] = [];

/**
 * Haptics mocks for testing
 */
export function createDeterministicHapticsMock() {
  const createMockMethod = (methodName: string) => {
    return vi.fn((...args: unknown[]) => {
      hapticsCallCounter += 1;
      hapticsCalls.push({
        method: methodName,
        args,
        timestamp: hapticsCallCounter,
      });
      return undefined;
    });
  };

  return {
    trigger: createMockMethod('trigger'),
    light: createMockMethod('light'),
    medium: createMockMethod('medium'),
    heavy: createMockMethod('heavy'),
    selection: createMockMethod('selection'),
    success: createMockMethod('success'),
    warning: createMockMethod('warning'),
    error: createMockMethod('error'),
    impact: createMockMethod('impact'),
    notification: createMockMethod('notification'),
    isHapticSupported: vi.fn(() => false),
  };
}

export function setupHapticsMocks(): void {
  const globalWithHaptics = globalThis as typeof globalThis & { haptics?: HapticsShim };
  const hapticsMockInstance = createDeterministicHapticsMock();
  const shim: HapticsShim = {
    trigger: hapticsMockInstance.trigger,
    light: hapticsMockInstance.light,
    medium: hapticsMockInstance.medium,
    heavy: hapticsMockInstance.heavy,
    selection: hapticsMockInstance.selection,
    success: hapticsMockInstance.success,
    warning: hapticsMockInstance.warning,
    error: hapticsMockInstance.error,
  };

  globalWithHaptics.haptics = shim;
}

export function resetHapticsMockState(): void {
  hapticsCallCounter = 0;
  hapticsCalls.length = 0;
}

