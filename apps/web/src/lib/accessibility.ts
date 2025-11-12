import { isTruthy, isDefined } from '@petspark/shared';

export const FOCUSABLE_ELEMENTS = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function trapFocus(element: HTMLElement) {
  const focusableElements = element.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS);
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  function handleTabKey(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;

    if (isTruthy(e.shiftKey)) {
      if (document.activeElement === firstFocusable) {
        lastFocusable?.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        firstFocusable?.focus();
        e.preventDefault();
      }
    }
  }

  element.addEventListener('keydown', handleTabKey);

  return () => {
    element.removeEventListener('keydown', handleTabKey);
  };
}

export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
) {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

export function getAriaLabel(context: string, value?: string | number): string {
  if (value === undefined || value === null) return context;
  return `${context}: ${value}`;
}

export function createAriaDescribedBy(id: string, description: string): string {
  const existing = document.getElementById(id);
  if (existing) return id;

  const descElement = document.createElement('span');
  descElement.id = id;
  descElement.className = 'sr-only';
  descElement.textContent = description;
  document.body.appendChild(descElement);

  return id;
}

export function getReadableTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;

  return date.toLocaleDateString();
}

export function getAccessiblePercentage(value: number): string {
  return `${Math.round(value)} percent`;
}

export function shouldReduceMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function getHighContrastMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(prefers-contrast: high)').matches ||
    window.matchMedia('(-ms-high-contrast: active)').matches
  );
}

export class KeyboardNavigationManager {
  private elements: HTMLElement[] = [];
  private currentIndex = 0;

  constructor(selector?: string) {
    if (selector) {
      this.updateElements(selector);
    }
  }

  updateElements(selector: string) {
    this.elements = Array.from(document.querySelectorAll<HTMLElement>(selector)).filter(
      (el) => !el.hasAttribute('disabled')
    );
  }

  next() {
    this.currentIndex = (this.currentIndex + 1) % this.elements.length;
    this.focusCurrentElement();
  }

  previous() {
    this.currentIndex = (this.currentIndex - 1 + this.elements.length) % this.elements.length;
    this.focusCurrentElement();
  }

  first() {
    this.currentIndex = 0;
    this.focusCurrentElement();
  }

  last() {
    this.currentIndex = this.elements.length - 1;
    this.focusCurrentElement();
  }

  private focusCurrentElement() {
    this.elements[this.currentIndex]?.focus();
  }

  getCurrentElement(): HTMLElement | undefined {
    return this.elements[this.currentIndex];
  }
}

export function useReducedMotion() {
  if (typeof window === 'undefined') return false;

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  return mediaQuery.matches;
}
