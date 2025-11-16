/**
 * Mobile Accessibility System
 *
 * Provides comprehensive accessibility features for mobile apps:
 * - Screen reader support (VoiceOver/TalkBack)
 * - Focus management and logical focus order
 * - Minimum hit areas (44x44pt)
 * - Reduce Motion support
 * - Color contrast validation
 */

import { createLogger } from './logger';
import { isTruthy } from '@petspark/shared';

const logger = createLogger('mobile-accessibility');

export interface AccessibilityConfig {
  minHitAreaSize: number;
  focusTimeout: number;
  announceDelay: number;
}

const DEFAULT_CONFIG: AccessibilityConfig = {
  minHitAreaSize: 44,
  focusTimeout: 100,
  announceDelay: 100,
};

export interface Announcement {
  message: string;
  priority: 'polite' | 'assertive' | 'off';
}

class AccessibilityManager {
  private config: AccessibilityConfig = DEFAULT_CONFIG;
  private liveRegion: HTMLElement | null = null;
  private assertiveRegion: HTMLElement | null = null;
  private focusHistory: HTMLElement[] = [];
  private reduceMotion = false;

  constructor(config?: Partial<AccessibilityConfig>) {
    if (config) {
      this.config = { ...DEFAULT_CONFIG, ...config };
    }
    this.initialize();
  }

  private initialize(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    // Check for reduce motion preference
    this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Listen for preference changes
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    mediaQuery.addEventListener('change', (e) => {
      this.reduceMotion = e.matches;
    });

    // Create live regions for announcements
    this.createLiveRegions();
  }

  private createLiveRegions(): void {
    if (typeof document === 'undefined') {
      return;
    }

    // Polite announcements
    this.liveRegion = document.createElement('div');
    this.liveRegion.setAttribute('role', 'status');
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    this.liveRegion.className = 'sr-only';
    this.liveRegion.style.cssText =
      'position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden;';

    // Assertive announcements
    this.assertiveRegion = document.createElement('div');
    this.assertiveRegion.setAttribute('role', 'alert');
    this.assertiveRegion.setAttribute('aria-live', 'assertive');
    this.assertiveRegion.setAttribute('aria-atomic', 'true');
    this.assertiveRegion.className = 'sr-only';
    this.assertiveRegion.style.cssText =
      'position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden;';

    document.body.appendChild(this.liveRegion);
    document.body.appendChild(this.assertiveRegion);
  }

  /**
   * Announce a message to screen readers
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.liveRegion || !this.assertiveRegion) {
      logger.warn('Live regions not initialized');
      return;
    }

    const region = priority === 'assertive' ? this.assertiveRegion : this.liveRegion;

    // Clear previous announcement
    region.textContent = '';

    // Set new announcement with slight delay for screen reader
    setTimeout(() => {
      if (region) {
        region.textContent = message;
        logger.info('Accessibility announcement', { message, priority });
      }
    }, this.config.announceDelay);

    // Clear after announcement
    setTimeout(() => {
      if (region) {
        region.textContent = '';
      }
    }, this.config.announceDelay + 1000);
  }

  /**
   * Ensure element meets minimum hit area requirements
   */
  ensureMinHitArea(element: HTMLElement): void {
    const rect = element.getBoundingClientRect();
    const currentWidth = rect.width;
    const currentHeight = rect.height;

    const needsPadding =
      currentWidth < this.config.minHitAreaSize || currentHeight < this.config.minHitAreaSize;

    if (needsPadding) {
      const paddingX = Math.max(0, (this.config.minHitAreaSize - currentWidth) / 2);
      const paddingY = Math.max(0, (this.config.minHitAreaSize - currentHeight) / 2);

      const currentPaddingTop = window.getComputedStyle(element).paddingTop;
      const currentPaddingRight = window.getComputedStyle(element).paddingRight;
      const currentPaddingBottom = window.getComputedStyle(element).paddingBottom;
      const currentPaddingLeft = window.getComputedStyle(element).paddingLeft;

      element.style.paddingTop = `${parseFloat(currentPaddingTop) + paddingY}px`;
      element.style.paddingRight = `${parseFloat(currentPaddingRight) + paddingX}px`;
      element.style.paddingBottom = `${parseFloat(currentPaddingBottom) + paddingY}px`;
      element.style.paddingLeft = `${parseFloat(currentPaddingLeft) + paddingX}px`;

      logger.debug('Applied minimum hit area', {
        element: element.tagName,
        width: currentWidth,
        height: currentHeight,
      });
    }
  }

  /**
   * Set accessible label (aria-label or aria-labelledby)
   */
  setLabel(element: HTMLElement, label: string): void {
    element.setAttribute('aria-label', label);
    logger.debug('Set accessible label', { label });
  }

  /**
   * Set accessible description (aria-describedby)
   */
  setDescription(element: HTMLElement, description: string, descriptionId?: string): void {
    const id = descriptionId ?? `desc-${Date.now()}`;
    let descElement = document.getElementById(id);

    if (!descElement) {
      descElement = document.createElement('div');
      descElement.id = id;
      descElement.className = 'sr-only';
      descElement.style.cssText =
        'position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden;';
      descElement.textContent = description;
      document.body.appendChild(descElement);
    }

    element.setAttribute('aria-describedby', id);
    logger.debug('Set accessible description', { description, id });
  }

  /**
   * Manage focus with history
   */
  focus(element: HTMLElement, saveToHistory = true): void {
    if (saveToHistory && document.activeElement instanceof HTMLElement) {
      this.focusHistory.push(document.activeElement);
    }

    element.focus();
    logger.debug('Focus set', { element: element.tagName });
  }

  /**
   * Return focus to previous element
   */
  focusPrevious(): void {
    const previous = this.focusHistory.pop();
    if (previous) {
      previous.focus();
      logger.debug('Focus returned to previous element');
    }
  }

  /**
   * Trap focus within a container
   */
  trapFocus(container: HTMLElement): () => void {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    const getFocusableElements = (): HTMLElement[] => {
      return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors)).filter(
        (el) => !el.hasAttribute('aria-hidden')
      );
    };

    const handleTab = (e: KeyboardEvent): void => {
      if (e.key !== 'Tab') {
        return;
      }

      const focusable = getFocusableElements();
      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (!first || !last) return;

      if (isTruthy(e.shiftKey)) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTab);

    // Focus first element
    setTimeout(() => {
      const focusable = getFocusableElements();
      if (focusable.length > 0 && focusable[0]) {
        focusable[0].focus();
      }
    }, this.config.focusTimeout);

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleTab);
    };
  }

  /**
   * Check if reduce motion is preferred
   */
  prefersReducedMotion(): boolean {
    return this.reduceMotion;
  }

  /**
   * Get animation duration respecting reduce motion
   */
  getAnimationDuration(defaultMs: number): number {
    return this.reduceMotion ? 0 : defaultMs;
  }

  /**
   * Calculate color contrast ratio (WCAG)
   */
  getContrastRatio(color1: string, color2: string): number {
    const getLuminance = (color: string): number => {
      const rgb = this.hexToRgb(color);
      if (!rgb) {
        return 0;
      }

      const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((val) => {
        val = val / 255;
        return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
      });

      if (r === undefined || g === undefined || b === undefined) {
        return 0;
      }

      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);

    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Check if contrast meets WCAG AA (4.5:1 for normal text, 3:1 for large text)
   */
  meetsContrastRatio(
    color1: string,
    color2: string,
    largeText = false
  ): { passed: boolean; ratio: number; level: 'AA' | 'AAA' | 'FAIL' } {
    const ratio = this.getContrastRatio(color1, color2);
    const thresholdAA = largeText ? 3 : 4.5;
    const thresholdAAA = largeText ? 4.5 : 7;

    if (ratio >= thresholdAAA) {
      return { passed: true, ratio, level: 'AAA' };
    } else if (ratio >= thresholdAA) {
      return { passed: true, ratio, level: 'AA' };
    } else {
      return { passed: false, ratio, level: 'FAIL' };
    }
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result?.[1] && result[2] && result[3]
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  /**
   * Set logical tab order using tabindex
   */
  setTabOrder(elements: HTMLElement[]): void {
    elements.forEach((el, index) => {
      el.setAttribute('tabindex', index === 0 ? '0' : String(index + 1));
    });
    logger.debug('Set tab order', { count: elements.length });
  }

  destroy(): void {
    if (this.liveRegion && this.liveRegion.parentNode) {
      this.liveRegion.parentNode.removeChild(this.liveRegion);
    }
    if (this.assertiveRegion && this.assertiveRegion.parentNode) {
      this.assertiveRegion.parentNode.removeChild(this.assertiveRegion);
    }
    this.focusHistory = [];
  }
}

// Singleton instance
let managerInstance: AccessibilityManager | null = null;

export function getAccessibilityManager(
  config?: Partial<AccessibilityConfig>
): AccessibilityManager {
  managerInstance ??= new AccessibilityManager(config);
  return managerInstance;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
