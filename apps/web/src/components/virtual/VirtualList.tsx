/**
 * VirtualList - Reusable virtual scrolling component for long lists
 * Uses @tanstack/react-virtual for efficient rendering
 */

import * as React from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { isTruthy, isDefined } from '@/core/guards';

export interface VirtualListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  estimateSize?: (index: number) => number
  overscan?: number
  className?: string
  containerClassName?: string
  onEndReached?: () => void
  endReachedThreshold?: number
  keyExtractor?: (item: T, index: number) => string | number
}

export function VirtualList<T>({
  items,
  renderItem,
  estimateSize = () => 100,
  overscan = 5,
  className = '',
  containerClassName = '',
  onEndReached,
  endReachedThreshold = 200,
  keyExtractor,
}: VirtualListProps<T>): JSX.Element {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [isScrolling, setIsScrolling] = React.useState(false)
  const scrollTimeoutRef = React.useRef<number | undefined>(undefined)

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => containerRef.current,
    estimateSize,
    overscan,
  })

  const handleScroll = React.useCallback(() => {
    setIsScrolling(true)

    if (isTruthy(scrollTimeoutRef.current)) {
      clearTimeout(scrollTimeoutRef.current)
    }

    scrollTimeoutRef.current = window.setTimeout(() => {
      setIsScrolling(false)
    }, 150)

    if (onEndReached && containerRef.current) {
      const container = containerRef.current
      const bottomDistance =
        container.scrollHeight - container.scrollTop - container.clientHeight
      if (bottomDistance < endReachedThreshold) {
        onEndReached()
      }
    }
  }, [onEndReached, endReachedThreshold])

  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      container.removeEventListener('scroll', handleScroll)
      if (isTruthy(scrollTimeoutRef.current)) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [handleScroll])

  return (
    <div
      ref={containerRef}
      className={`overflow-y-auto ${String(containerClassName ?? '')}`}
      style={{ contain: 'strict' }}
    >
      <div
        style={{
          height: `${String(rowVirtualizer.getTotalSize() ?? '')}px`,
          width: '100%',
          position: 'relative',
        }}
        className={className}
      >
        {rowVirtualizer.getVirtualItems().map((virtualItem) => {
          const item = items[virtualItem.index]
          const key = keyExtractor
            ? keyExtractor(item, virtualItem.index)
            : virtualItem.index

          return (
            <div
              key={key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${String(virtualItem.start ?? '')}px)`,
              }}
              data-index={virtualItem.index}
            >
              {renderItem(item, virtualItem.index)}
            </div>
          )
        })}
      </div>
    </div>
  )
}

