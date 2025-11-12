'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useUIConfig } from "@/hooks/use-ui-config";

export interface AnnounceNewMessageProps {
  lastText: string | null;
  senderName?: string | null | undefined;
}

/**
 * Announces new messages with assertive priority for screen readers
 * Uses aria-live="assertive" to interrupt current announcements
 */
export function AnnounceNewMessage({ lastText, senderName }: AnnounceNewMessageProps): JSX.Element {
  const _uiConfig = useUIConfig();
  const announcementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (lastText && announcementRef.current) {
      const announcement = senderName ? `${senderName}: ${lastText}` : `New message: ${lastText}`;
      announcementRef.current.textContent = announcement;
    } else if (announcementRef.current) {
      announcementRef.current.textContent = '';
    }
  }, [lastText, senderName]);

  return (
    <div
      ref={announcementRef}
      aria-live="assertive"
      aria-atomic="true"
      className="sr-only"
      role="status"
      aria-label="New message announcement"
    />
  );
}

export interface AnnounceTypingProps {
  userName: string | null;
  multipleUsers?: boolean;
}

/**
 * Announces typing indicators with polite priority
 * Uses aria-live="polite" to not interrupt current announcements
 */
export function AnnounceTyping({
  userName,
  multipleUsers = false,
}: AnnounceTypingProps): JSX.Element {
  const announcementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userName && announcementRef.current) {
      const announcement = multipleUsers
        ? 'Multiple people are typing...'
        : `${userName} is typing...`;
      announcementRef.current.textContent = announcement;
    } else if (announcementRef.current) {
      announcementRef.current.textContent = '';
    }
  }, [userName, multipleUsers]);

  return (
    <div
      ref={announcementRef}
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
      role="status"
      aria-label="Typing indicator announcement"
    />
  );
}

export interface SkipToComposerProps {
  inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement>;
  label?: string;
}

/**
 * Skip link for keyboard navigation
 * Allows users to jump directly to the message input
 */
export function SkipToComposer({
  inputRef,
  label = 'Skip to message input',
}: SkipToComposerProps): JSX.Element {
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>): void => {
      e.preventDefault();
      inputRef.current?.focus();
    },
    [inputRef]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLAnchorElement>): void => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    },
    [inputRef]
  );

  return (
    <a
      href="#chat-input"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      aria-label={label}
    >
      {label}
    </a>
  );
}

export interface LiveRegionsProps {
  children?: ReactNode;
  className?: string;
}

/**
 * Container component for live regions with keyboard navigation support
 * Handles escape key to close popovers and manages tab order
 */
export function LiveRegions({ children, className }: LiveRegionsProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        const activeElement = document.activeElement as HTMLElement;
        if (!activeElement) {
          return;
        }

        const popover = activeElement.closest('[role="dialog"], [data-state="open"]');
        if (popover) {
          const closeButton = popover.querySelector(
            '[aria-label*="close" i], [aria-label*="Close" i], button[aria-label*="close" i]'
          ) as HTMLElement | null;
          if (closeButton) {
            closeButton.click();
            e.preventDefault();
            e.stopPropagation();
          }
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const focusableElements = container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent): void => {
      if (e.key !== 'Tab') {
        return;
      }

      if (isTruthy(e.shiftKey)) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, []);

  return (
    <div ref={containerRef} className={className} role="region" aria-label="Chat live regions">
      {children}
    </div>
  );
}
