import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

interface VirtualScrollOptions {
  itemHeight: number;
  overscan?: number;
  scrollThreshold?: number;
  onEndReached?: () => void;
}

interface VirtualScrollResult<T> {
  virtualItems: {
    index: number;
    item: T;
    offsetTop: number;
  }[];
  totalHeight: number;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  isScrolling: boolean;
}

export function useVirtualScroll<T>(
  items: T[],
  options: VirtualScrollOptions
): VirtualScrollResult<T> {
  const { itemHeight, overscan = 3, scrollThreshold = 200, onEndReached } = options;

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<number | undefined>(undefined);

  const totalHeight = items.length * itemHeight;

  const { startIndex, endIndex } = useMemo(() => {
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.ceil((scrollTop + containerHeight) / itemHeight);

    return {
      startIndex: Math.max(0, visibleStart - overscan),
      endIndex: Math.min(items.length, visibleEnd + overscan),
    };
  }, [scrollTop, containerHeight, itemHeight, items.length, overscan]);

  const virtualItems = useMemo(() => {
    return items.slice(startIndex, endIndex).map((item, idx) => ({
      index: startIndex + idx,
      item,
      offsetTop: (startIndex + idx) * itemHeight,
    }));
  }, [items, startIndex, endIndex, itemHeight]);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setScrollTop(container.scrollTop);
    setIsScrolling(true);

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = window.setTimeout(() => {
      setIsScrolling(false);
    }, 150);

    if (onEndReached) {
      const bottomDistance = container.scrollHeight - container.scrollTop - container.clientHeight;
      if (bottomDistance < scrollThreshold) {
        onEndReached();
      }
    }
  }, [onEndReached, scrollThreshold]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(container);
    setContainerHeight(container.clientHeight);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  return {
    virtualItems,
    totalHeight,
    scrollContainerRef,
    isScrolling,
  };
}

export function useInfiniteScroll(
  callback: () => void | Promise<void>,
  options: {
    threshold?: number;
    disabled?: boolean;
  } = {}
) {
  const { threshold = 200, disabled = false } = options;
  const containerRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);

  const handleScroll = useCallback(async () => {
    if (disabled || isLoadingRef.current) return;

    const container = containerRef.current;
    if (!container) return;

    const bottomDistance = container.scrollHeight - container.scrollTop - container.clientHeight;

    if (bottomDistance < threshold) {
      isLoadingRef.current = true;

      try {
        await callback();
      } finally {
        isLoadingRef.current = false;
      }
    }
  }, [callback, threshold, disabled]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  return containerRef;
}

export function useScrollPosition() {
  const [scrollPosition, setScrollPosition] = useState({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition({
        x: window.scrollX,
        y: window.scrollY,
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return scrollPosition;
}

export function useScrollToTop() {
  return useCallback((behavior: ScrollBehavior = 'smooth') => {
    window.scrollTo({ top: 0, behavior });
  }, []);
}

export function useScrollIntoView<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  const scrollIntoView = useCallback((options?: ScrollIntoViewOptions) => {
    ref.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      ...options,
    });
  }, []);

  return [ref, scrollIntoView] as const;
}
