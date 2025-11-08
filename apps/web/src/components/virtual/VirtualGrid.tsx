/**
 * VirtualGrid - Reusable virtual scrolling grid component for card layouts
 * Uses @tanstack/react-virtual for efficient rendering of grid layouts
 */

import * as React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

export interface VirtualGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  columns?: number;
  itemHeight?: number;
  gap?: number;
  overscan?: number;
  className?: string;
  containerClassName?: string;
  onEndReached?: () => void;
  endReachedThreshold?: number;
  keyExtractor?: (item: T, index: number) => string | number;
}

export function VirtualGrid<T>({
  items,
  renderItem,
  columns = 3,
  itemHeight = 300,
  gap = 24,
  overscan = 5,
  className = '',
  containerClassName = '',
  onEndReached,
  endReachedThreshold = 200,
  keyExtractor,
}: VirtualGridProps<T>): JSX.Element {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = React.useState(false);
  const scrollTimeoutRef = React.useRef<number | undefined>(undefined);

  const rows = Math.ceil(items.length / columns);
  const rowHeight = itemHeight + gap;

  const rowVirtualizer = useVirtualizer({
    count: rows,
    getScrollElement: () => containerRef.current,
    estimateSize: () => rowHeight,
    overscan,
  });

  const handleScroll = React.useCallback(() => {
    setIsScrolling(true);

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = window.setTimeout(() => {
      setIsScrolling(false);
    }, 150);

    if (onEndReached && containerRef.current) {
      const container = containerRef.current;
      const bottomDistance = container.scrollHeight - container.scrollTop - container.clientHeight;
      if (bottomDistance < endReachedThreshold) {
        onEndReached();
      }
    }
  }, [onEndReached, endReachedThreshold]);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [handleScroll]);

  return (
    <div
      ref={containerRef}
      className={`overflow-y-auto ${containerClassName}`}
      style={{ contain: 'strict' }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
        className={className}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const startIndex = virtualRow.index * columns;
          const endIndex = Math.min(startIndex + columns, items.length);
          const rowItems = items.slice(startIndex, endIndex);

          return (
            <div
              key={virtualRow.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gap: `${gap}px`,
              }}
              data-index={virtualRow.index}
            >
              {rowItems.map((item, colIndex) => {
                const index = startIndex + colIndex;
                const key = keyExtractor ? keyExtractor(item, index) : index;

                return (
                  <div key={key} style={{ height: `${itemHeight}px` }}>
                    {renderItem(item, index)}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
