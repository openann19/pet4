'use client';;
import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useSharedValue, useAnimatedStyle, withSpring, withTiming, MotionView } from '@petspark/motion';
import { springConfigs } from '@/effects/reanimated/transitions';
import { usePrefersReducedMotion } from '@/utils/reduced-motion';
import { useDiscoverKeyboard } from '@/hooks/use-discover-keyboard';
import { getTypographyClasses } from '@/lib/typography';
import type { Pet } from '@/lib/types';
import type { Story } from '@petspark/shared';
import { AccessibleStoriesBar } from './AccessibleStoriesBar';

interface DiscoverCardStackPageProps {
  pets: Pet[];
  currentIndex: number;
  onSwipe: (action: 'like' | 'pass' | 'superlike') => void;
  onOpenDetails?: (pet: Pet) => void;
  stories?: Story[];
  currentUserId?: string;
  currentUserName?: string;
  currentUserPetId?: string;
  currentUserPetName?: string;
  currentUserPetPhoto?: string;
  currentUserAvatar?: string;
  onStoryCreated?: (story: Story) => void;
  onStoryUpdate?: (story: Story) => void;
  onStoryClick?: (story: Story) => void;
  onAddStory?: () => void;
}

const colors = {
  danger: 'bg-red-500 hover:bg-red-600 active:bg-red-700',
  success: 'bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700',
  accent: 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700',
};

export function DiscoverCardStackPage({
  pets,
  currentIndex,
  onSwipe,
  onOpenDetails,
  stories = [],
  currentUserId,
  onStoryClick,
  onAddStory,
}: DiscoverCardStackPageProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const mainRef = useRef<HTMLElement>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const currentPet = pets[currentIndex];
  const nextPet = pets[currentIndex + 1];

  const handlePass = useCallback(() => {
    if (isTransitioning || !currentPet) return;
    setIsTransitioning(true);
    onSwipe('pass');
    setTimeout(() => setIsTransitioning(false), prefersReducedMotion ? 100 : 300);
  }, [currentPet, onSwipe, isTransitioning, prefersReducedMotion]);

  const handleSuperlike = useCallback(() => {
    if (isTransitioning || !currentPet) return;
    setIsTransitioning(true);
    onSwipe('superlike');
    setTimeout(() => setIsTransitioning(false), prefersReducedMotion ? 100 : 300);
  }, [currentPet, onSwipe, isTransitioning, prefersReducedMotion]);

  const handleLike = useCallback(() => {
    if (isTransitioning || !currentPet) return;
    setIsTransitioning(true);
    onSwipe('like');
    setTimeout(() => setIsTransitioning(false), prefersReducedMotion ? 100 : 300);
  }, [currentPet, onSwipe, isTransitioning, prefersReducedMotion]);

  const handleOpenDetails = useCallback(() => {
    if (currentPet && onOpenDetails) {
      onOpenDetails(currentPet);
    }
  }, [currentPet, onOpenDetails]);

  useDiscoverKeyboard({
    onPass: handlePass,
    onSuperlike: handleSuperlike,
    onLike: handleLike,
    onOpenDetails: handleOpenDetails,
    enabled: !isTransitioning && !!currentPet,
    containerRef: mainRef,
  });

  // Card animation values
  const cardOpacity = useSharedValue(1);
  const cardScale = useSharedValue(1);
  const cardY = useSharedValue(0);
  const nextCardOpacity = useSharedValue(0.5);
  const nextCardScale = useSharedValue(0.95);

  useEffect(() => {
    if (prefersReducedMotion) {
      cardOpacity.value = withTiming(1, { duration: 100 });
      cardScale.value = 1;
      cardY.value = 0;
      nextCardOpacity.value = withTiming(0.5, { duration: 100 });
      nextCardScale.value = 0.95;
    } else {
      cardOpacity.value = withSpring(1, springConfigs.smooth);
      cardScale.value = withSpring(1, springConfigs.smooth);
      cardY.value = withSpring(0, springConfigs.smooth);
      nextCardOpacity.value = withSpring(0.5, springConfigs.smooth);
      nextCardScale.value = withSpring(0.95, springConfigs.smooth);
    }
  }, [currentIndex, prefersReducedMotion, cardOpacity, cardScale, cardY, nextCardOpacity, nextCardScale]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }, { translateY: cardY.value }],
  }));

  const nextCardStyle = useAnimatedStyle(() => ({
    opacity: nextCardOpacity.value,
    transform: [{ scale: nextCardScale.value }],
  }));

  if (!currentPet) {
    return (
      <main
        ref={mainRef}
        aria-label="Discover pets"
        className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center justify-center px-4"
      >
        <section
          aria-label="No more pets"
          className="flex flex-col items-center justify-center py-16 text-center max-w-md"
        >
          <p className="text-6xl mb-4" aria-hidden="true">
            🐾
          </p>
          <h1 className={`${getTypographyClasses('title')} text-slate-100 mb-2`}>
            No more pets nearby
          </h1>
          <p className={`${getTypographyClasses('body')} text-slate-400`}>
            Check back later for new matches.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main
      ref={mainRef}
      aria-label="Discover pets"
      className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center"
    >
      {/* Stories Bar */}
      {currentUserId && (
        <section
          aria-label="Pet stories"
          className="w-full max-w-4xl px-4 pt-4"
        >
          <AccessibleStoriesBar
            stories={stories}
            currentUserId={currentUserId}
            onStoryClick={onStoryClick}
            onAddStory={onAddStory}
          />
        </section>
      )}
      {/* Card Stack Region */}
      <section
        aria-label="Discover pets card stack"
        className="flex-1 flex flex-col items-center justify-center w-full px-4 max-w-4xl"
      >
        <div className="relative w-full max-w-md aspect-[3/4]">
          {/* Next card (underneath) */}
          {nextPet && (
            <MotionView
              style={nextCardStyle}
              className="absolute inset-0 rounded-3xl overflow-hidden shadow-xl bg-slate-900"
            >
              <img
                src={nextPet.photo}
                alt=""
                className="w-full h-full object-cover"
                aria-hidden="true"
              />
              <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
            </MotionView>
          )}

          {/* Current card (on top) */}
          <MotionView
            style={cardStyle}
            className="relative w-full h-full rounded-3xl overflow-hidden shadow-xl bg-slate-900"
          >
            <article
              className="relative w-full h-full"
              aria-label={`${currentPet.name}, ${currentPet.age} years old ${currentPet.breed} from ${currentPet.location}`}
            >
              <button
                type="button"
                onClick={handleOpenDetails}
                className="w-full h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                aria-label={`View details for ${currentPet.name}`}
              >
                <img
                  src={currentPet.photo}
                  alt={`${currentPet.name}, ${currentPet.breed}`}
                  className="w-full h-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className={`${getTypographyClasses('card-title')} text-slate-50`}>
                      {currentPet.name}
                    </h2>
                    {currentPet.verified && (
                      <span className="text-emerald-400" aria-label="Verified" aria-hidden="true">
                        ✓
                      </span>
                    )}
                  </div>
                  <p className={`${getTypographyClasses('card-subtitle')} text-slate-200 mb-2`}>
                    {currentPet.breed}
                  </p>
                  <p className={`${getTypographyClasses('meta')} text-slate-300 mb-3`}>
                    📍 {currentPet.location}
                  </p>
                  {currentPet.bio && (
                    <p
                      className={`${getTypographyClasses('body')} text-slate-100 mb-2 max-w-[60ch] line-clamp-3`}
                    >
                      {currentPet.bio}
                    </p>
                  )}
                  <p className={`${getTypographyClasses('hint')} text-slate-400 italic`}>
                    Click for details
                  </p>
                </div>
              </button>
            </article>
          </MotionView>
        </div>
      </section>
      {/* Action Buttons */}
      <nav
        aria-label="Match actions"
        className="mt-6 flex items-center justify-center gap-6 pb-8"
      >
        <button
          type="button"
          onClick={handlePass}
          disabled={isTransitioning}
          className={`h-14 w-14 rounded-full ${colors.danger} shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 transition-transform hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-label="Pass on this pet"
        >
          <span aria-hidden="true" className="text-white text-2xl font-bold">
            ✕
          </span>
        </button>

        <button
          type="button"
          onClick={handleSuperlike}
          disabled={isTransitioning}
          className={`h-16 w-16 rounded-full ${colors.accent} shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 transition-transform hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-label="Superlike this pet"
        >
          <span aria-hidden="true" className="text-white text-2xl font-bold">
            ★
          </span>
        </button>

        <button
          type="button"
          onClick={handleLike}
          disabled={isTransitioning}
          className={`h-14 w-14 rounded-full ${colors.success} shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 transition-transform hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-label="Like this pet"
        >
          <span aria-hidden="true" className="text-white text-2xl font-bold">
            ♥
          </span>
        </button>
      </nav>
    </main>
  );
}

