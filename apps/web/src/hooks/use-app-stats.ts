/**
 * useAppStats Hook
 *
 * Computes statistics from user data (matches, swipes, etc.).
 * Extracted from App.tsx to follow mobile screen patterns.
 */

import { useMemo } from 'react';
import { useStorage } from '@/hooks/use-storage';
import type { Match, SwipeAction } from '@/lib/types';

interface UseAppStatsReturn {
  totalMatches: number;
  totalSwipes: number;
  likeCount: number;
  successRate: number;
}

export function useAppStats(): UseAppStatsReturn {
  const [matches] = useStorage<Match[]>('matches', []);
  const [swipeHistory] = useStorage<SwipeAction[]>('swipe-history', []);

  const totalMatches = useMemo(() => {
    if (!Array.isArray(matches)) return 0;
    return matches.filter((m) => m.status === 'active').length;
  }, [matches]);

  const totalSwipes = useMemo(() => {
    if (!Array.isArray(swipeHistory)) return 0;
    return swipeHistory.length;
  }, [swipeHistory]);

  const likeCount = useMemo(() => {
    if (!Array.isArray(swipeHistory)) return 0;
    return swipeHistory.filter((s) => s.action === 'like').length;
  }, [swipeHistory]);

  const successRate = useMemo(() => {
    if (likeCount <= 0 || totalMatches <= 0) return 0;
    return Math.round((totalMatches / likeCount) * 100);
  }, [likeCount, totalMatches]);

  return {
    totalMatches,
    totalSwipes,
    likeCount,
    successRate,
  };
}
