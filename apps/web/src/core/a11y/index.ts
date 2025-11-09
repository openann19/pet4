/**
 * Accessibility Utilities Index (WCAG 2.2 AAA)
 *
 * Exports all accessibility utilities for WCAG 2.2 AAA compliance.
 *
 * Location: apps/web/src/core/a11y/index.ts
 */

// Focus appearance
export {
  validateFocusAppearance,
  ensureFocusAppearance,
  getFocusAppearanceCSS,
  validateFocusAppearanceBatch,
  DEFAULT_FOCUS_CONFIG,
  HIGH_CONTRAST_FOCUS_CONFIG,
  type FocusAppearanceConfig,
  type FocusAppearanceValidationResult,
} from './focus-appearance';

// Focus not obscured
export {
  checkFocusNotObscured,
  ensureFocusNotObscured,
  setupFocusNotObscuredMonitor,
  checkFocusNotObscuredBatch,
  type FocusVisibilityResult,
} from './focus-not-obscured';

// Target size
export {
  validateTargetSize,
  ensureTargetSize,
  validateTargetSizeBatch,
  findInteractiveElements,
  validateAllInteractiveElements,
  DEFAULT_TARGET_SIZE_CONFIG,
  type TargetSizeConfig,
  type TargetSizeValidationResult,
} from './target-size';

// Fixed references
export {
  generateStableId,
  formatStableTimestamp,
  formatStableRelativeTimestamp,
  createStableMessageReference,
  createStableMessageReferenceRelative,
  getStableMessageReference,
  clearReferenceCache,
  type StableMessageReference,
} from './fixed-references';

// Screen reader announcements
export {
  announceEnhanced,
  announceStateChange,
  announceActionCompletion,
  announceError,
  announceSuccess,
  announceNavigation,
  announceFormSubmission,
  announceLoading,
  announceLoaded,
  clearAnnouncementQueue,
  type EnhancedAnnouncement,
} from './screen-reader-announcements';

// Keyboard shortcuts
export {
  KeyboardShortcutsRegistry,
  getKeyboardShortcutsRegistry,
  registerKeyboardShortcut,
  unregisterKeyboardShortcut,
  getKeyboardShortcuts,
  getKeyboardShortcutsByContext,
  type KeyboardShortcut,
} from './keyboard-shortcuts';
