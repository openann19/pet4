/**
 * Ranking Skeleton Component
 * Shows loading skeleton for feed ranking/post ordering
 */

import { MotionView } from '@petspark/motion'
import { useReducedMotion } from '@petspark/motion'
import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'

interface RankingSkeletonProps {
  count?: number
  variant?: 'post' | 'comment' | 'user'
}

export function RankingSkeleton({ count = 3, variant = 'post' }: RankingSkeletonProps) {
  const reducedMotion = useReducedMotion()

  if (variant === 'post') {
    return (
      <div className="space-y-4" role="status" aria-label="Loading posts">
        {Array.from({ length: count }).map((_, i) => (
          <MotionView
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: reducedMotion ? 0 : i * 0.1,
              duration: reducedMotion ? 0 : 0.3,
              easing: 'easeOut'
            }}
          >
            <Card className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-8 w-8 rounded" />
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </div>

              <Skeleton className="h-64 w-full rounded-lg" />

              <div className="flex items-center gap-4">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
                <div className="flex-1" />
                <Skeleton className="h-6 w-20" />
              </div>
            </Card>
          </MotionView>
        ))}
        <span className="sr-only">Loading feed content...</span>
      </div>
    )
  }

  if (variant === 'comment') {
    return (
      <div className="space-y-3" role="status" aria-label="Loading comments">
        {Array.from({ length: count }).map((_, i) => (
          <MotionView
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: reducedMotion ? 0 : i * 0.1,
              duration: reducedMotion ? 0 : 0.3,
              easing: 'easeOut'
            }}
          >
            <div className="flex gap-3 p-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </MotionView>
        ))}
        <span className="sr-only">Loading comments...</span>
      </div>
    )
  }

  return (
    <div className="space-y-3" role="status" aria-label="Loading users">
      {Array.from({ length: count }).map((_, i) => (
        <MotionView
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: reducedMotion ? 0 : i * 0.1,
            duration: reducedMotion ? 0 : 0.3,
            easing: 'easeOut'
          }}
        >
          <div className="flex items-center gap-3 p-3">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-9 w-20 rounded" />
          </div>
        </MotionView>
      ))}
      <span className="sr-only">Loading users...</span>
    </div>
  )
}

