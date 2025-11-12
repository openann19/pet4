import { useEffect, useRef } from 'react'
import { AccessibilityInfo } from 'react-native'
import { isTruthy } from '@petspark/shared';

export interface AnnounceNewMessageProps {
  lastText: string | null
  senderName?: string | null
}

/**
 * Announces new messages using AccessibilityInfo for React Native
 * Uses announceForAccessibility for screen reader announcements
 */
export function AnnounceNewMessage({ lastText, senderName }: AnnounceNewMessageProps): null {
  const lastAnnouncedRef = useRef<string | null>(null)

  useEffect(() => {
    if (lastText && lastText !== lastAnnouncedRef.current) {
      const announcement = senderName ? `${senderName}: ${lastText}` : `New message: ${lastText}`

      AccessibilityInfo.announceForAccessibility(announcement)
      lastAnnouncedRef.current = lastText
    }
  }, [lastText, senderName])

  return null
}

export interface AnnounceTypingProps {
  userName: string | null
  multipleUsers?: boolean
}

/**
 * Announces typing indicators using AccessibilityInfo
 * Uses announceForAccessibility for screen reader announcements
 */
export function AnnounceTyping({ userName, multipleUsers = false }: AnnounceTypingProps): null {
  const lastAnnouncedRef = useRef<string | null>(null)

  useEffect(() => {
    if (isTruthy(userName)) {
      const announcement = multipleUsers
        ? 'Multiple people are typing...'
        : `${userName} is typing...`

      // Only announce if different from last announcement
      if (announcement !== lastAnnouncedRef.current) {
        AccessibilityInfo.announceForAccessibility(announcement)
        lastAnnouncedRef.current = announcement
      }
    } else {
      lastAnnouncedRef.current = null
    }
  }, [userName, multipleUsers])

  return null
}
