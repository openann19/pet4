/**
 * Target Size Utilities (WCAG 2.2 AAA)
 *
 * Ensures touch targets meet WCAG 2.2 AAA requirements:
 * - Minimum 44x44 CSS pixels for touch targets
 * - Minimum 8px spacing between targets
 * - Visual size matches touch target size
 *
 * Location: apps/web/src/core/a11y/target-size.ts
 */

import { createLogger } from '@/lib/logger';

const logger = createLogger('target-size');

/**
 * Target size configuration
 */
export interface TargetSizeConfig {
  readonly minSize: number; // 44px for WCAG 2.2 AAA
  readonly minSpacing: number; // 8px minimum spacing
}

/**
 * Default target size configuration (WCAG 2.2 AAA)
 */
export const DEFAULT_TARGET_SIZE_CONFIG: TargetSizeConfig = {
  minSize: 44,
  minSpacing: 8,
};

/**
 * Target size validation result
 */
export interface TargetSizeValidationResult {
  readonly valid: boolean;
  readonly sizeValid: boolean;
  readonly spacingValid: boolean;
  readonly visualSizeValid: boolean;
  readonly issues: readonly string[];
  readonly actualWidth?: number;
  readonly actualHeight?: number;
  readonly width?: number; // Alias for actualWidth for backward compatibility
  readonly height?: number; // Alias for actualHeight for backward compatibility
  readonly minSpacing?: number;
}

/**
 * Get element dimensions including padding
 */
function getElementDimensions(element: HTMLElement): { width: number; height: number } {
  const rect = element.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(element);

  const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
  const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
  const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
  const paddingRight = parseFloat(computedStyle.paddingRight) || 0;

  return {
    width: rect.width + paddingLeft + paddingRight,
    height: rect.height + paddingTop + paddingBottom,
  };
}

/**
 * Get minimum spacing between element and adjacent elements
 */
function getMinimumSpacing(element: HTMLElement): number {
  const rect = element.getBoundingClientRect();
  const allElements = document.querySelectorAll('*');
  let minSpacing = Infinity;

  for (const otherElement of allElements) {
    if (otherElement === element || !(otherElement instanceof HTMLElement)) {
      continue;
    }

    const otherRect = otherElement.getBoundingClientRect();

    // Check horizontal spacing
    if (otherRect.top < rect.bottom && otherRect.bottom > rect.top) {
      const horizontalSpacing = Math.min(
        Math.abs(rect.left - otherRect.right),
        Math.abs(rect.right - otherRect.left)
      );
      if (horizontalSpacing > 0 && horizontalSpacing < minSpacing) {
        minSpacing = horizontalSpacing;
      }
    }

    // Check vertical spacing
    if (otherRect.left < rect.right && otherRect.right > rect.left) {
      const verticalSpacing = Math.min(
        Math.abs(rect.top - otherRect.bottom),
        Math.abs(rect.bottom - otherRect.top)
      );
      if (verticalSpacing > 0 && verticalSpacing < minSpacing) {
        minSpacing = verticalSpacing;
      }
    }
  }

  return minSpacing === Infinity ? 0 : minSpacing;
}

/**
 * Check if element is an interactive element
 */
function isInteractiveElement(element: HTMLElement): boolean {
  const tagName = element.tagName.toLowerCase();
  const role = element.getAttribute('role');
  const tabIndex = element.getAttribute('tabindex');

  // Check if element is naturally interactive
  if (['button', 'a', 'input', 'select', 'textarea'].includes(tagName)) {
    return true;
  }

  // Check if element has interactive role
  if (role && ['button', 'link', 'tab', 'menuitem', 'option'].includes(role)) {
    return true;
  }

  // Check if element is focusable
  if (tabIndex !== null && tabIndex !== '-1') {
    return true;
  }

  // Check if element has click handler
  if (element.onclick !== null) {
    return true;
  }

  return false;
}

/**
 * Validate target size for an element (WCAG 2.5.5)
 */
export function validateTargetSize(
  element: HTMLElement,
  config: TargetSizeConfig = DEFAULT_TARGET_SIZE_CONFIG
): TargetSizeValidationResult {
  const issues: string[] = [];

  // Only validate interactive elements
  if (!isInteractiveElement(element)) {
    return {
      valid: true,
      sizeValid: true,
      spacingValid: true,
      visualSizeValid: true,
      issues: [],
    };
  }

  // Get element dimensions
  const dimensions = getElementDimensions(element);
  const { width, height } = dimensions;

  // Check if size meets minimum requirement
  const sizeValid = width >= config.minSize && height >= config.minSize;
  if (!sizeValid) {
    issues.push(
      `Touch target size (${width}x${height}px) is less than minimum (${config.minSize}x${config.minSize}px)`
    );
  }

  // Check spacing between targets
  const minSpacing = getMinimumSpacing(element);
  const spacingValid = minSpacing >= config.minSpacing || minSpacing === 0;
  if (!spacingValid) {
    issues.push(
      `Spacing between touch targets (${minSpacing}px) is less than minimum (${config.minSpacing}px)`
    );
  }

  // Check if visual size matches touch target size
  const computedStyle = window.getComputedStyle(element);
  const visualWidth = parseFloat(computedStyle.width) || width;
  const visualHeight = parseFloat(computedStyle.height) || height;

  const visualSizeValid = Math.abs(visualWidth - width) < 1 && Math.abs(visualHeight - height) < 1;
  if (!visualSizeValid) {
    issues.push(
      `Visual size (${visualWidth}x${visualHeight}px) does not match touch target size (${width}x${height}px)`
    );
  }

  return {
    valid: sizeValid && spacingValid && visualSizeValid,
    sizeValid,
    spacingValid,
    visualSizeValid,
    issues,
    actualWidth: width,
    actualHeight: height,
    width, // Alias for backward compatibility
    height, // Alias for backward compatibility
    minSpacing: minSpacing === Infinity ? undefined : minSpacing,
  };
}

/**
 * Ensure target size meets WCAG 2.2 AAA requirements
 */
export function ensureTargetSize(
  element: HTMLElement,
  config: TargetSizeConfig = DEFAULT_TARGET_SIZE_CONFIG
): void {
  const result = validateTargetSize(element, config);

  if (!result.valid) {
    const computedStyle = window.getComputedStyle(element);
    const currentWidth = parseFloat(computedStyle.width) || 0;
    const currentHeight = parseFloat(computedStyle.height) || 0;

    // Apply minimum size if needed
    if (!result.sizeValid) {
      const minWidth = Math.max(currentWidth, config.minSize);
      const minHeight = Math.max(currentHeight, config.minSize);

      element.style.minWidth = `${minWidth}px`;
      element.style.minHeight = `${minHeight}px`;

      logger?.debug?.('Applied minimum target size', {
        element: element.tagName,
        width: minWidth,
        height: minHeight,
      });
    }

    // Apply minimum spacing if needed
    if (!result.spacingValid && result.minSpacing !== undefined) {
      const currentMargin = parseFloat(computedStyle.margin) || 0;
      const requiredMargin = Math.max(currentMargin, config.minSpacing / 2);

      element.style.margin = `${requiredMargin}px`;

      logger?.debug?.('Applied minimum spacing', {
        element: element.tagName,
        margin: requiredMargin,
      });
    }
  }
}

/**
 * Batch validate target size for multiple elements
 */
export function validateTargetSizeBatch(
  elements: readonly HTMLElement[],
  config: TargetSizeConfig = DEFAULT_TARGET_SIZE_CONFIG
): readonly TargetSizeValidationResult[] {
  return elements.map((element) => validateTargetSize(element, config));
}

/**
 * Find all interactive elements that need target size validation
 */
export function findInteractiveElements(container: HTMLElement = document.body): HTMLElement[] {
  const interactiveElements: HTMLElement[] = [];
  const allElements = container.querySelectorAll('*');

  for (const element of allElements) {
    if (element instanceof HTMLElement && isInteractiveElement(element)) {
      interactiveElements.push(element);
    }
  }

  return interactiveElements;
}

/**
 * Validate all interactive elements in a container
 */
export function validateAllInteractiveElements(
  container: HTMLElement = document.body,
  config: TargetSizeConfig = DEFAULT_TARGET_SIZE_CONFIG
): {
  readonly valid: boolean;
  readonly results: readonly TargetSizeValidationResult[];
  readonly invalidElements: readonly HTMLElement[];
} {
  const interactiveElements = findInteractiveElements(container);
  const results = validateTargetSizeBatch(interactiveElements, config);

  const invalidElements = interactiveElements.filter((element, index) => !results[index]?.valid);

  return {
    valid: invalidElements.length === 0,
    results,
    invalidElements,
  };
}
