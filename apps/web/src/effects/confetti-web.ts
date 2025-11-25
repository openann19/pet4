// Confetti effect for web toast enhancements
// Usage: import { toastSuccess, toastError } from './confetti-web'

import confetti from 'canvas-confetti';

// Type definitions for toast APIs
declare global {
  interface Window {
    toast?: {
      success?: (message: string) => void;
      error?: (message: string) => void;
      info?: (message: string) => void;
    };
    sonner?: {
      success?: (message: string) => void;
      error?: (message: string) => void;
      info?: (message: string) => void;
    };
  }
}

export function toastSuccess(message: string): void {
  void confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.7 },
    colors: ['#00e676', '#00bcd4', '#ffeb3b', '#ff4081'],
    scalar: 1.2,
  });
  // Use sonner toast for message
  window.toast?.success?.(message) ?? window.sonner?.success?.(message);
}

export function toastError(message: string): void {
  void confetti({
    particleCount: 60,
    spread: 60,
    origin: { y: 0.7 },
    colors: ['#ff1744', '#ff9100', '#fff'],
    scalar: 1.1,
  });
  // Use sonner toast for message
  window.toast?.error?.(message) ?? window.sonner?.error?.(message);
}

export function toastInfo(message: string): void {
  void confetti({
    particleCount: 40,
    spread: 50,
    origin: { y: 0.7 },
    colors: ['#2196f3', '#fff'],
    scalar: 1.0,
  });
  // Use sonner toast for message
  window.toast?.info?.(message) ?? window.sonner?.info?.(message);
}
