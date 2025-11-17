import { useState, useRef, useMemo } from 'react';

interface VirtualListOptions {
  itemHeight: number;
  overscan?: number;
  containerHeight?: number;
}

interface VirtualItem<T> {
  index: number;
  item: T;
  offsetTop: number;
}

export function useVirtualList<T>(items: T[], options: VirtualListOptions) {
  const { itemHeight, overscan = 3, containerHeight = 600 } = options;
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const virtualItems = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    const visibleItems: VirtualItem<T>[] = [];
    for (let i = startIndex; i <= endIndex; i++) {
      const item = items[i];
      if (item !== undefined) {
        visibleItems.push({
          index: i,
          item,
          offsetTop: i * itemHeight,
        });
      }
    }

    return {
      virtualItems: visibleItems,
      totalHeight: items.length * itemHeight,
      startIndex,
      endIndex,
    };
  }, [items, scrollTop, itemHeight, containerHeight, overscan]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return {
    ...virtualItems,
    containerRef,
    handleScroll,
    containerStyle: {
      height: containerHeight,
      overflow: 'auto',
      position: 'relative' as const,
    },
  };
}
