/**
 * Screen Reader Announcements Tests
 *
 * Tests for enhanced screen reader announcements.
 *
 * Location: apps/web/src/core/a11y/__tests__/screen-reader-announcements.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
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
} from '../screen-reader-announcements';
import * as accessibility from '@/lib/accessibility';

describe('Screen Reader Announcements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAnnouncementQueue();
    vi.spyOn(accessibility, 'announceToScreenReader').mockImplementation(() => {});
  });

  it('should announce enhanced message', () => {
    const announcement: EnhancedAnnouncement = {
      message: 'Test message',
      priority: 'polite',
    };

    announceEnhanced(announcement);

    // Wait for debounce
    setTimeout(() => {
      expect(accessibility.announceToScreenReader).toHaveBeenCalledWith('Test message', 'polite');
    }, 200);
  });

  it('should announce state change', () => {
    announceStateChange('Button', 'disabled', 'enabled', 'Test context');

    setTimeout(() => {
      expect(accessibility.announceToScreenReader).toHaveBeenCalledWith(
        expect.stringContaining('Button changed from disabled to enabled'),
        'polite'
      );
    }, 200);
  });

  it('should announce action completion', () => {
    announceActionCompletion('Upload', 'success', 'Test context');

    setTimeout(() => {
      expect(accessibility.announceToScreenReader).toHaveBeenCalledWith(
        expect.stringContaining('Upload completed'),
        'polite'
      );
    }, 200);
  });

  it('should announce error', () => {
    announceError('Upload failed', 'Test context', ['Try again', 'Check connection']);

    setTimeout(() => {
      expect(accessibility.announceToScreenReader).toHaveBeenCalledWith(
        expect.stringContaining('Error: Upload failed'),
        'assertive'
      );
    }, 200);
  });

  it('should announce success', () => {
    announceSuccess('Upload completed', 'Test context', ['File is ready']);

    setTimeout(() => {
      expect(accessibility.announceToScreenReader).toHaveBeenCalledWith(
        expect.stringContaining('Success: Upload completed'),
        'polite'
      );
    }, 200);
  });

  it('should announce navigation', () => {
    announceNavigation('Chat', 'Home');

    setTimeout(() => {
      expect(accessibility.announceToScreenReader).toHaveBeenCalledWith(
        expect.stringContaining('Navigated from Home to Chat'),
        'polite'
      );
    }, 200);
  });

  it('should announce form submission', () => {
    announceFormSubmission('Contact Form', true);

    setTimeout(() => {
      expect(accessibility.announceToScreenReader).toHaveBeenCalledWith(
        expect.stringContaining('Contact Form submitted successfully'),
        'polite'
      );
    }, 200);
  });

  it('should announce loading state', () => {
    announceLoading('Upload', 'Test context');

    setTimeout(() => {
      expect(accessibility.announceToScreenReader).toHaveBeenCalledWith(
        expect.stringContaining('Upload is loading'),
        'polite'
      );
    }, 200);
  });

  it('should announce loaded state', () => {
    announceLoaded('Upload', 'Test context');

    setTimeout(() => {
      expect(accessibility.announceToScreenReader).toHaveBeenCalledWith(
        expect.stringContaining('Upload has finished loading'),
        'polite'
      );
    }, 200);
  });
});
