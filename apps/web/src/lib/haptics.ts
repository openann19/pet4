import { createLogger } from './logger';

const logger = createLogger('Haptics');

export type HapticFeedbackType =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'selection'
  | 'success'
  | 'warning'
  | 'error';

class HapticFeedback {
  private isSupported: boolean;

  constructor() {
    this.isSupported = 'vibrate' in navigator;
  }

  private vibrate(pattern: number | number[]) {
    if (!this.isSupported) return;
    try {
      navigator.vibrate(pattern);
    } catch (error) {
      logger.warn(
        'Haptic feedback failed',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  light() {
    this.vibrate(10);
  }

  medium() {
    this.vibrate(20);
  }

  heavy() {
    this.vibrate(40);
  }

  selection() {
    this.vibrate(5);
  }

  success() {
    this.vibrate([10, 50, 10]);
  }

  warning() {
    this.vibrate([20, 100, 20]);
  }

  error() {
    this.vibrate([30, 100, 30, 100, 30]);
  }

  notification(type: 'success' | 'warning' | 'error' = 'success') {
    switch (type) {
      case 'success':
        this.success();
        break;
      case 'warning':
        this.warning();
        break;
      case 'error':
        this.error();
        break;
    }
  }

  impact(type: 'light' | 'medium' | 'heavy' = 'light') {
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

  trigger(type: HapticFeedbackType) {
    switch (type) {
      case 'light':
        this.light();
        break;
      case 'medium':
        this.medium();
        break;
      case 'heavy':
        this.heavy();
        break;
      case 'selection':
        this.selection();
        break;
      case 'success':
        this.success();
        break;
      case 'warning':
        this.warning();
        break;
      case 'error':
        this.error();
        break;
    }
  }
}

export const haptics = new HapticFeedback();

export function triggerHaptic(type: HapticFeedbackType) {
  haptics.trigger(type);
}
