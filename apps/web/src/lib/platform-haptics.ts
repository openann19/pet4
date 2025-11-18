'use client';

import { createLogger } from '@/lib/logger';

const logger = createLogger('PlatformHaptics');

export interface PlatformHaptics {
  selection(): void;
  impact(type: 'light' | 'medium' | 'heavy'): void;
  success(): void;
  warning(): void;
  error(): void;
}

class NativePlatformHaptics implements PlatformHaptics {
  private isSupported = false;

  constructor() {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        this.isSupported = true;
      }
    } catch (_error) {
      logger.warn(
        'Haptics initialization failed',
        _error instanceof Error ? _error : new Error(String(_error))
      );
    }
  }

  private vibrate(pattern: number | number[]): void {
    if (!this.isSupported) return;
    try {
      navigator.vibrate(pattern);
    } catch (_error) {
      logger.warn(
        'Haptic feedback failed',
        _error instanceof Error ? _error : new Error(String(_error))
      );
    }
  }

  selection(): void {
    this.vibrate(5);
  }

  impact(type: 'light' | 'medium' | 'heavy'): void {
    switch (type) {
      case 'light':
        this.vibrate(10);
        break;
      case 'medium':
        this.vibrate(20);
        break;
      case 'heavy':
        this.vibrate(40);
        break;
    }
  }

  success(): void {
    this.vibrate([10, 50, 10]);
  }

  warning(): void {
    this.vibrate([20, 100, 20]);
  }

  error(): void {
    this.vibrate([30, 100, 30, 100, 30]);
  }
}

export function createPlatformHaptics(): PlatformHaptics {
  return new NativePlatformHaptics();
}

export const platformHaptics = createPlatformHaptics();
