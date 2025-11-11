/**
 * Enhanced Screen Reader Announcements (WCAG 2.2 AAA)
 *
 * Provides comprehensive screen reader announcements for complex interactions:
 * - State changes
 * - Context and next steps
 * - Prevents redundant announcements
 *
 * Location: apps/web/src/core/a11y/screen-reader-announcements.ts
 */

import { createLogger } from '@/lib/logger';
import { announceToScreenReader } from '@/lib/accessibility';

const logger = createLogger('screen-reader-announcements');

/**
 * Enhanced announcement configuration
 */
export interface EnhancedAnnouncement {
  readonly message: string;
  readonly priority: 'polite' | 'assertive';
  readonly context?: string;
  readonly nextSteps?: readonly string[];
  readonly timestamp?: number;
}

/**
 * Announcement queue to prevent redundant announcements
 */
class AnnouncementQueue {
  private queue: EnhancedAnnouncement[] = [];
  private lastAnnouncement: EnhancedAnnouncement | null = null;
  private readonly debounceMs = 100;
  private timeoutId: number | null = null;

  /**
   * Add announcement to queue
   */
  add(announcement: EnhancedAnnouncement): void {
    // Check if announcement is redundant
    if (this.isRedundant(announcement)) {
      logger?.debug?.('Skipping redundant announcement', { message: announcement.message });
      return;
    }

    this.queue.push(announcement);
    this.processQueue();
  }

  /**
   * Check if announcement is redundant
   */
  private isRedundant(announcement: EnhancedAnnouncement): boolean {
    if (!this.lastAnnouncement) {
      return false;
    }

    // Check if same message was announced recently
    if (announcement.message === this.lastAnnouncement.message) {
      const timeSinceLastAnnouncement =
        (announcement.timestamp || Date.now()) - (this.lastAnnouncement.timestamp || 0);
      return timeSinceLastAnnouncement < this.debounceMs * 10; // 1 second
    }

    return false;
  }

  /**
   * Process announcement queue
   */
  private processQueue(): void {
    if (this.timeoutId !== null) {
      return;
    }

    this.timeoutId = window.setTimeout(() => {
      if (this.queue.length > 0) {
        const announcement = this.queue.shift()!;
        this.announce(announcement);
        this.lastAnnouncement = announcement;
      }

      this.timeoutId = null;

      // Process next announcement if queue is not empty
      if (this.queue.length > 0) {
        this.processQueue();
      }
    }, this.debounceMs);
  }

  /**
   * Announce message to screen reader
   */
  private announce(announcement: EnhancedAnnouncement): void {
    let fullMessage = announcement.message;

    // Add context if provided
    if (announcement.context) {
      fullMessage = `${fullMessage}. ${announcement.context}`;
    }

    // Add next steps if provided
    if (announcement.nextSteps && announcement.nextSteps.length > 0) {
      const steps = announcement.nextSteps.join('. ');
      fullMessage = `${fullMessage}. Next steps: ${steps}`;
    }

    announceToScreenReader(fullMessage, announcement.priority);

    logger?.debug?.('Announced to screen reader', {
      message: fullMessage,
      priority: announcement.priority,
    });
  }

  /**
   * Clear queue
   */
  clear(): void {
    this.queue = [];
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}

/**
 * Global announcement queue
 */
const announcementQueue = new AnnouncementQueue();

/**
 * Announce enhanced message to screen reader
 */
export function announceEnhanced(announcement: EnhancedAnnouncement): void {
  const announcementWithTimestamp: EnhancedAnnouncement = {
    ...announcement,
    timestamp: announcement.timestamp || Date.now(),
  };

  announcementQueue.add(announcementWithTimestamp);
}

/**
 * Announce state change
 */
export function announceStateChange(
  element: string,
  oldState: string,
  newState: string,
  context?: string
): void {
  announceEnhanced({
    message: `${element} changed from ${oldState} to ${newState}`,
    priority: 'polite',
    context,
  });
}

/**
 * Announce action completion
 */
export function announceActionCompletion(action: string, result?: string, context?: string): void {
  const message = result ? `${action} completed: ${result}` : `${action} completed`;
  announceEnhanced({
    message,
    priority: 'polite',
    context,
  });
}

/**
 * Announce error
 */
export function announceError(error: string, context?: string, nextSteps?: readonly string[]): void {
  announceEnhanced({
    message: `Error: ${error}`,
    priority: 'assertive',
    context,
    nextSteps,
  });
}

/**
 * Announce success
 */
export function announceSuccess(message: string, context?: string, nextSteps?: readonly string[]): void {
  announceEnhanced({
    message: `Success: ${message}`,
    priority: 'polite',
    context,
    nextSteps,
  });
}

/**
 * Announce navigation
 */
export function announceNavigation(to: string, from?: string): void {
  const message = from ? `Navigated from ${from} to ${to}` : `Navigated to ${to}`;
  announceEnhanced({
    message,
    priority: 'polite',
  });
}

/**
 * Announce form submission
 */
export function announceFormSubmission(formName: string, success: boolean): void {
  if (success) {
    announceEnhanced({
      message: `${formName} submitted successfully`,
      priority: 'polite',
      nextSteps: ['Form has been submitted and is being processed'],
    });
  } else {
    announceEnhanced({
      message: `${formName} submission failed`,
      priority: 'assertive',
      nextSteps: ['Please check the form for errors and try again'],
    });
  }
}

/**
 * Announce loading state
 */
export function announceLoading(action: string, context?: string): void {
  announceEnhanced({
    message: `${action} is loading`,
    priority: 'polite',
    context,
  });
}

/**
 * Announce loaded state
 */
export function announceLoaded(action: string, context?: string): void {
  announceEnhanced({
    message: `${action} has finished loading`,
    priority: 'polite',
    context,
  });
}

/**
 * Clear announcement queue
 */
export function clearAnnouncementQueue(): void {
  announcementQueue.clear();
}
