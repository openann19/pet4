'use client';;
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useSharedValue, withSpring, useMotionView   type AnimatedStyle,
} from '@petspark/motion';
import { springConfigs } from '@/effects/reanimated/transitions';
import { imagePrefetcher } from '@/lib/image-prefetcher';
import { useNativeSwipe } from '@/hooks/use-native-swipe';

import { createLogger } from '@/lib/logger';

const logger = createLogger('CardStack');

export interface CardData {
  id: string;
  photo?: string;
  name: string;
  [key: string]: unknown;
}

export interface CardStackProps<T extends CardData> {
  cards: T[];
  cardWidth: number;
  cardHeight: number;
  renderCard: (card: T, index: number) => React.ReactNode;
  onSwipe?: (card: T, direction: 'left' | 'right') => void;
  onSwipeComplete?: (card: T, direction: 'left' | 'right') => void;
  onEmpty?: () => void;
  hapticFeedback?: boolean;
  reduceMotion?: boolean;
  prefetchCount?: number;
  poolSize?: number;
}

interface PooledCard<T extends CardData> {
  card: T;
  index: number;
  zIndex: number;
  scale: number;
  translateY: number;
  opacity: number;
}

const DEFAULT_POOL_SIZE = 3;
const DEFAULT_PREFETCH_COUNT = 2;

export function CardStack<T extends CardData>({
  cards,
  cardWidth,
  cardHeight,
  renderCard,
  onSwipe,
  onSwipeComplete,
  onEmpty,
  hapticFeedback = true,
  reduceMotion = false,
  prefetchCount = DEFAULT_PREFETCH_COUNT,
  poolSize = DEFAULT_POOL_SIZE,
}: CardStackProps<T>): React.ReactElement {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pooledCards, setPooledCards] = useState<PooledCard<T>[]>([]);
  const isAnimatingRef = useRef(false);

  const availableCards = useMemo(() => {
    return cards.slice(currentIndex);
  }, [cards, currentIndex]);

  const currentCard = availableCards[0];

  const swipeHook = useNativeSwipe({
    cardWidth,
    hapticFeedback,
    reduceMotion,
    onCommit: useCallback(
      (direction: 'left' | 'right') => {
        if (!currentCard || isAnimatingRef.current) return;

        isAnimatingRef.current = true;
        onSwipe?.(currentCard, direction);

        setTimeout(() => {
          setCurrentIndex((prev) => {
            const next = prev + 1;
            if (next >= cards.length) {
              onEmpty?.();
            }
            return next;
          });
          onSwipeComplete?.(currentCard, direction);
          isAnimatingRef.current = false;
        }, 280);
      },
      [currentCard, cards.length, onSwipe, onSwipeComplete, onEmpty]
    ),
  });

  const nextCardScale = useSharedValue(0.96);
  const nextCardTranslateY = useSharedValue(6);
  const nextCardOpacity = useSharedValue(1);

  useEffect(() => {
    if (currentCard && !isAnimatingRef.current) {
      nextCardScale.value = withSpring(1, springConfigs.smooth);
      nextCardTranslateY.value = withSpring(0, springConfigs.smooth);
    }
  }, [currentIndex, nextCardScale, nextCardTranslateY]);

  useEffect(() => {
    const pool: PooledCard<T>[] = [];
    const visibleCount = Math.min(poolSize, availableCards.length);

    for (let i = 0; i < visibleCount; i++) {
      pool.push({
        card: availableCards[i]!,
        index: i,
        zIndex: poolSize - i,
        scale: i === 0 ? 1 : 0.96 - i * 0.02,
        translateY: i === 0 ? 0 : 6 + i * 4,
        opacity: i === 0 ? 1 : 1 - i * 0.1,
      });
    }

    setPooledCards(pool);
  }, [availableCards, poolSize]);

  useEffect(() => {
    const prefetchUrls: string[] = [];
    for (let i = 0; i < Math.min(prefetchCount, availableCards.length - 1); i++) {
      const card = availableCards[i + 1];
      if (card?.photo) {
        prefetchUrls.push(card.photo);
      }
    }

    if (prefetchUrls.length > 0) {
      imagePrefetcher.prefetchBatch(prefetchUrls, { priority: 'high' }).catch((error: unknown) => {
        logger.warn(
          'Image prefetch failed',
          _error instanceof Error ? _error : new Error(String(_error))
        );
      });
    }
  }, [availableCards, prefetchCount]);

  const nextCardStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: nextCardScale.value }, { translateY: nextCardTranslateY.value }],
      opacity: nextCardOpacity.value,
    };
  }) as AnimatedStyle;

  const handleButtonSwipe = useCallback(
    (direction: 'left' | 'right') => {
      if (!currentCard || isAnimatingRef.current) return;
      swipeHook.commit(direction);
    },
    [currentCard, swipeHook]
  );

  if (availableCards.length === 0) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ width: cardWidth, height: cardHeight }}
      />
    );
  }

  return (
    <div className="relative" style={{ width: cardWidth, height: cardHeight }}>
      {pooledCards.map((pooled, idx) => {
        const isTop = idx === 0;
        const isNext = idx === 1;

        return (
          <div
            key={`${String(pooled.card.id ?? '')}-${String(pooled.index ?? '')}`}
            className="absolute inset-0"
            style={{
              zIndex: pooled.zIndex,
              pointerEvents: isTop ? 'auto' : 'none',
            }}
          >
            {isTop ? (
              <SwipeableCard
                card={pooled.card}
                index={pooled.index}
                width={cardWidth}
                height={cardHeight}
                swipeHook={swipeHook}
                renderCard={renderCard}
                onButtonSwipe={handleButtonSwipe}
              />
            ) : isNext ? (
              <MotionView style={nextCardStyle}>
                {renderCard(pooled.card, pooled.index)}
              </MotionView>
            ) : (
              <div
                style={{
                  transform: `scale(${pooled.scale}) translateY(${pooled.translateY}px)`,
                  opacity: pooled.opacity,
                }}
              >
                {renderCard(pooled.card, pooled.index)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface SwipeableCardProps<T extends CardData> {
  card: T;
  index: number;
  width: number;
  height: number;
  swipeHook: ReturnType<typeof useNativeSwipe>;
  renderCard: (card: T, index: number) => React.ReactNode;
  onButtonSwipe: (direction: 'left' | 'right') => void;
}

function SwipeableCard<T extends CardData>({
  card,
  index,
  width,
  height,
  swipeHook,
  renderCard,
  onButtonSwipe,
}: SwipeableCardProps<T>): React.ReactElement {
  const handlers = swipeHook.gestureHandlers;

  return (
    <div className="relative" style={{ width, height }}>
      <MotionView
        style={swipeHook.animatedStyle}
        onMouseDown={(e: React.MouseEvent) => {
          const startX = e.clientX;
          const startY = e.clientY;
          let currentX = startX;
          let currentY = startY;
          let velocityX = 0;
          let lastX = startX;
          let lastTime = Date.now();

          handlers.onDragStart?.({ x: startX, y: startY });

          const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
            const clientX =
              'touches' in moveEvent ? (moveEvent.touches[0]?.clientX ?? 0) : moveEvent.clientX;
            const clientY =
              'touches' in moveEvent ? (moveEvent.touches[0]?.clientY ?? 0) : moveEvent.clientY;

            currentX = clientX - startX;
            currentY = clientY - startY;

            const now = Date.now();
            const dt = now - lastTime;
            if (dt > 0) {
              velocityX = ((currentX - lastX) / dt) * 1000;
            }
            lastX = currentX;
            lastTime = now;

            handlers.onDrag?.({
              translationX: currentX,
              translationY: currentY,
              velocityX,
            });
          };

          const handleEnd = () => {
            handlers.onDragEnd?.({
              translationX: currentX,
              translationY: currentY,
              velocityX,
            });

            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleEnd);
            document.removeEventListener('touchmove', handleMove);
            document.removeEventListener('touchend', handleEnd);
          };

          document.addEventListener('mousemove', handleMove);
          document.addEventListener('mouseup', handleEnd);
          document.addEventListener('touchmove', handleMove, { passive: false });
          document.addEventListener('touchend', handleEnd);
        }}
        onTouchStart={(e: React.TouchEvent) => {
          e.preventDefault();
          const touch = e.touches[0];
          if (!touch) return;

          const startX = touch.clientX;
          const startY = touch.clientY;
          let currentX = startX;
          let currentY = startY;
          let velocityX = 0;
          let lastX = startX;
          let lastTime = Date.now();

          handlers.onDragStart?.({ x: startX, y: startY });

          const handleMove = (moveEvent: TouchEvent) => {
            const touch = moveEvent.touches[0];
            if (!touch) return;

            currentX = touch.clientX - startX;
            currentY = touch.clientY - startY;

            const now = Date.now();
            const dt = now - lastTime;
            if (dt > 0) {
              velocityX = ((currentX - lastX) / dt) * 1000;
            }
            lastX = currentX;
            lastTime = now;

            handlers.onDrag?.({
              translationX: currentX,
              translationY: currentY,
              velocityX,
            });
          };

          const handleEnd = () => {
            handlers.onDragEnd?.({
              translationX: currentX,
              translationY: currentY,
              velocityX,
            });

            document.removeEventListener('touchmove', handleMove);
            document.removeEventListener('touchend', handleEnd);
          };

          document.addEventListener('touchmove', handleMove, { passive: false });
          document.addEventListener('touchend', handleEnd);
        }}
        className="absolute inset-0 cursor-grab active:cursor-grabbing touch-none select-none"
      >
        <div className="absolute inset-0 pointer-events-none">
          <MotionView
            style={swipeHook.badgeStyle}
            className="absolute -top-12 left-1/2 -translate-x-1/2 z-50"
          >
            <div
              className="px-6 py-3 bg-linear-to-r from-primary to-accent rounded-full text-white font-bold text-lg shadow-2xl border-4 border-white"
              style={{ opacity: swipeHook.likeOpacity.value }}
            >
              LIKE
            </div>
            <div
              className="px-6 py-3 bg-linear-to-r from-gray-500 to-gray-700 rounded-full text-white font-bold text-lg shadow-2xl border-4 border-white"
              style={{ opacity: swipeHook.passOpacity.value }}
            >
              PASS
            </div>
          </MotionView>
        </div>

        {renderCard(card, index)}

        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 px-4 pointer-events-auto">
          <button
            onClick={() => { onButtonSwipe('left'); }}
            className="w-14 h-14 rounded-full bg-gray-600 flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform"
            aria-label="Pass"
          >
            ✕
          </button>
          <button
            onClick={() => { onButtonSwipe('right'); }}
            className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform"
            aria-label="Like"
          >
            ♥
          </button>
        </div>
      </MotionView>
    </div>
  );
}
