/**
 * Hook for tracking story analytics and socket events
 */

import { useEffect, useRef, useCallback } from 'react'
import { realtime } from '@/lib/realtime'
import { getAnalytics, type EventName } from '@/lib/advanced-analytics'
import type { Story } from '@/lib/stories-types'

interface UseStoryAnalyticsOptions {
  story: Story | null
  currentUserId: string
  isActive: boolean
}

export function useStoryAnalytics({ story, currentUserId, isActive }: UseStoryAnalyticsOptions) {
  const viewStartTimeRef = useRef<number | null>(null)
  const trackedReactionsRef = useRef<Set<string>>(new Set())
  const analytics = getAnalytics()

  const trackView = useCallback(() => {
    if (!story || !isActive) return

    viewStartTimeRef.current = Date.now()
    analytics.trackEvent('story_viewed', {
      storyId: story.id,
      userId: story.userId,
      petId: story.petId,
      storyType: story.type
    })

    realtime.emit('story_viewed', {
      storyId: story.id,
      userId: currentUserId,
      timestamp: new Date().toISOString()
    })
  }, [story, currentUserId, isActive, analytics])

  const trackViewComplete = useCallback((completed: boolean) => {
    if (!story || !viewStartTimeRef.current) return

    const viewDuration = (Date.now() - viewStartTimeRef.current) / 1000

    analytics.trackEvent('story_view_completed' as EventName, {
      storyId: story.id,
      viewDuration,
      completed,
      completionRate: completed ? (viewDuration / story.duration) * 100 : 0
    })

    realtime.emit('story_view_completed', {
      storyId: story.id,
      userId: currentUserId,
      viewDuration,
      completed,
      timestamp: new Date().toISOString()
    })

    viewStartTimeRef.current = null
  }, [story, currentUserId, analytics])

  const trackReaction = useCallback((emoji: string) => {
    if (!story) return

    const reactionKey = `${String(story.id ?? '')}-${String(emoji ?? '')}`
    if (trackedReactionsRef.current.has(reactionKey)) return

    trackedReactionsRef.current.add(reactionKey)

    analytics.trackEvent('story_reaction' as EventName, {
      storyId: story.id,
      emoji,
      userId: currentUserId
    })

    realtime.emit('story_reaction', {
      storyId: story.id,
      userId: currentUserId,
      emoji,
      timestamp: new Date().toISOString()
    })
  }, [story, currentUserId, analytics])

  const trackInteraction = useCallback((type: 'pause' | 'skip' | 'reply' | 'share') => {
    if (!story) return

    analytics.trackEvent('story_interaction' as EventName, {
      storyId: story.id,
      interactionType: type,
      userId: currentUserId
    })

    realtime.emit('story_interaction', {
      storyId: story.id,
      userId: currentUserId,
      interactionType: type,
      timestamp: new Date().toISOString()
    })
  }, [story, currentUserId, analytics])

  useEffect(() => {
    if (isActive && story) {
      trackView()
    }

    return () => {
      if (viewStartTimeRef.current && story) {
        const viewDuration = (Date.now() - viewStartTimeRef.current) / 1000
        const completed = viewDuration >= story.duration * 0.8
        trackViewComplete(completed)
      }
    }
  }, [isActive, story, trackView, trackViewComplete])

  useEffect(() => {
    if (!story) return

    const handleReactionUpdate = (data: unknown) => {
      const event = data as { storyId: string; emoji: string; userId: string }
      if (event.storyId === story.id && event.userId !== currentUserId) {
        analytics.trackEvent('story_reaction_received' as EventName, {
          storyId: story.id,
          emoji: event.emoji,
          fromUserId: event.userId
        })
      }
    }

    const handleViewUpdate = (data: unknown) => {
      const event = data as { storyId: string; userId: string }
      if (event.storyId === story.id && event.userId !== currentUserId) {
        analytics.trackEvent('story_view_received' as EventName, {
          storyId: story.id,
          fromUserId: event.userId
        })
      }
    }

    realtime.on('story_reaction', handleReactionUpdate)
    realtime.on('story_viewed', handleViewUpdate)

    return () => {
      realtime.off('story_reaction', handleReactionUpdate)
      realtime.off('story_viewed', handleViewUpdate)
    }
  }, [story, currentUserId, analytics])

  return {
    trackView,
    trackViewComplete,
    trackReaction,
    trackInteraction
  }
}

