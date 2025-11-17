/**
 * Focus Not Obscured Utilities (WCAG 2.2 AAA)
 *
 * Ensures focused elements are fully visible and not obscured by:
 * - Sticky headers/footers
 * - Fixed position elements
 * - Overlays
 * - Other UI elements
 *
 * Location: apps/web/src/core/a11y/focus-not-obscured.ts
 */

import { createLogger } from '@/lib/logger';

const logger = createLogger('focus-not-obscured');

/**
 * Focus visibility check result
 */
export interface FocusVisibilityResult {
  readonly obscured: boolean;
  readonly reason?: string;
  readonly obscuredBy?: HTMLElement;
  readonly scrollRequired: boolean;
  readonly scrollOffset?: { x: number; y: number };
}

/**
 * Check if an element is obscured by another element
 */
function isElementObscuredBy(element: HTMLElement, obscurer: HTMLElement): boolean {
  const elementRect = element.getBoundingClientRect();
  const obscurerRect = obscurer.getBoundingClientRect();

  // Check if obscurer overlaps with element
  const overlapX = elementRect.left < obscurerRect.right && elementRect.right > obscurerRect.left;
  const overlapY = elementRect.top < obscurerRect.bottom && elementRect.bottom > obscurerRect.top;

  return overlapX && overlapY;
}

/**
 * Find all sticky/fixed position elements that might obscure the focused element
 */
function findStickyElements(container: HTMLElement = document.body): HTMLElement[] {
  const stickyElements: HTMLElement[] = [];
  const allElements = container.querySelectorAll('*');

  for (const element of allElements) {
    if (!(element instanceof HTMLElement)) {
      continue;
    }

    const style = window.getComputedStyle(element);
    const position = style.position;

    if (position === 'sticky' || position === 'fixed') {
      stickyElements.push(element);
    }
  }

  return stickyElements;
}

/**
 * Check if element is fully visible in viewport
 */
function isElementFullyVisible(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

  // Check if element is within viewport bounds
  const isInViewport =
    rect.top >= 0 && rect.left >= 0 && rect.bottom <= viewportHeight && rect.right <= viewportWidth;

  return isInViewport;
}

/**
 * Calculate required scroll offset to make element fully visible
 */
function calculateScrollOffset(element: HTMLElement): { x: number; y: number } {
  const rect = element.getBoundingClientRect();
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

  let offsetX = 0;
  let offsetY = 0;

  // Check if element is outside viewport horizontally
  if (rect.left < 0) {
    offsetX = rect.left - 10; // Add 10px padding
  } else if (rect.right > viewportWidth) {
    offsetX = rect.right - viewportWidth + 10; // Add 10px padding
  }

  // Check if element is outside viewport vertically
  if (rect.top < 0) {
    offsetY = rect.top - 10; // Add 10px padding
  } else if (rect.bottom > viewportHeight) {
    offsetY = rect.bottom - viewportHeight + 10; // Add 10px padding
  }

  return { x: offsetX, y: offsetY };
}

/**
 * Check if focused element is not obscured (WCAG 2.4.11, 2.4.12)
 */
export function checkFocusNotObscured(element: HTMLElement): FocusVisibilityResult {
  // Check if element is fully visible in viewport
  const isVisible = isElementFullyVisible(element);

  if (!isVisible) {
    const scrollOffset = calculateScrollOffset(element);
    return {
      obscured: true,
      reason: 'Element is not fully visible in viewport',
      scrollRequired: true,
      scrollOffset,
    };
  }

  // Check for sticky/fixed elements that might obscure the element
  const stickyElements = findStickyElements();
  let obscuredBy: HTMLElement | undefined;

  for (const stickyElement of stickyElements) {
    if (isElementObscuredBy(element, stickyElement)) {
      obscuredBy = stickyElement;
      break;
    }
  }

  if (obscuredBy) {
    return {
      obscured: true,
      reason: 'Element is obscured by sticky/fixed position element',
      obscuredBy,
      scrollRequired: true,
      scrollOffset: calculateScrollOffset(element),
    };
  }

  // Check if element has sufficient padding around it
  const rect = element.getBoundingClientRect();
  const minPadding = 8; // Minimum 8px padding for WCAG 2.2

  const hasSufficientPadding =
    rect.top >= minPadding &&
    rect.left >= minPadding &&
    window.innerHeight - rect.bottom >= minPadding &&
    window.innerWidth - rect.right >= minPadding;

  if (!hasSufficientPadding) {
    return {
      obscured: true,
      reason: 'Element does not have sufficient padding around it',
      scrollRequired: false,
    };
  }

  return {
    obscured: false,
    scrollRequired: false,
  };
}

/**
 * Ensure focused element is not obscured
 */
export function ensureFocusNotObscured(element: HTMLElement): void {
  const result = checkFocusNotObscured(element);

  if (result.obscured) {
    if (result.scrollRequired && result.scrollOffset) {
      // Scroll element into view with smooth behavior
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      });

      // If scroll offset is needed, adjust manually
      if (result.scrollOffset.x !== 0 || result.scrollOffset.y !== 0) {
        window.scrollBy({
          left: result.scrollOffset.x,
          top: result.scrollOffset.y,
          behavior: 'smooth',
        });
      }

      logger?.debug?.('Scrolled element into view', {
        element: element.tagName,
        offset: result.scrollOffset,
      });
    }

    // If obscured by sticky element, add padding to account for it
    if (result.obscuredBy) {
      const obscuredRect = result.obscuredBy.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();

      // Calculate required padding
      const paddingTop = obscuredRect.bottom - elementRect.top + 8; // 8px minimum padding

      if (paddingTop > 0) {
        const currentPadding = parseFloat(window.getComputedStyle(element).paddingTop) || 0;
        const newPadding = Math.max(currentPadding, paddingTop);

        element.style.paddingTop = `${newPadding}px`;

        logger?.debug?.('Added padding to account for sticky element', {
          element: element.tagName,
          padding: newPadding,
        });
      }
    }
  }
}

/**
 * Monitor focus events and ensure focused elements are not obscured
 */
export function setupFocusNotObscuredMonitor(options: { enabled?: boolean } = {}): () => void {
  const { enabled = true } = options;

  if (!enabled) {
    return () => {
      // No-op cleanup
    };
  }

  const handleFocus = (e: FocusEvent): void => {
    const target = e.target;
    if (target instanceof HTMLElement) {
      ensureFocusNotObscured(target);
    }
  };

  document.addEventListener('focusin', handleFocus);

  logger?.debug?.('Focus not obscured monitor enabled');

  return () => {
    document.removeEventListener('focusin', handleFocus);
    logger?.debug?.('Focus not obscured monitor disabled');
  };
}

/**
 * Batch check focus visibility for multiple elements
 */
export function checkFocusNotObscuredBatch(elements: readonly HTMLElement[]): readonly FocusVisibilityResult[] {
  return elements.map((element) => checkFocusNotObscured(element));
}

