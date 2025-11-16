/**
 * Streak System
 *
 * Manages login streaks and activity streaks
 */

export type StreakType = 'login' | 'messaging' | 'playdates' | 'profile_updates';

export interface Streak {
  type: StreakType;
  current: number;
  longest: number;
  lastActivityDate: string;
  nextMilestone?: number;
}

export interface StreakMilestone {
  days: number;
  reward: {
    type: 'points' | 'badge' | 'premium_days';
    value: number | string;
  };
}

export const STREAK_MILESTONES: StreakMilestone[] = [
  { days: 3, reward: { type: 'points', value: 10 } },
  { days: 7, reward: { type: 'points', value: 50 } },
  { days: 14, reward: { type: 'points', value: 100 } },
  { days: 30, reward: { type: 'badge', value: 'streak-30' } },
  { days: 60, reward: { type: 'points', value: 500 } },
  { days: 100, reward: { type: 'badge', value: 'streak-100' } },
];

export function updateStreak(
  streak: Streak | null,
  activityDate: string = new Date().toISOString()
): Streak {
  if (!streak) {
    return {
      type: 'login',
      current: 1,
      longest: 1,
      lastActivityDate: activityDate,
      nextMilestone: getNextMilestone(1),
    };
  }

  const lastDate = new Date(streak.lastActivityDate);
  const currentDate = new Date(activityDate);
  const daysDiff = Math.floor(
    (currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysDiff === 0) {
    // Same day, no change
    return streak;
  }

  if (daysDiff === 1) {
    // Consecutive day, increment streak
    const newCurrent = streak.current + 1;
    return {
      ...streak,
      current: newCurrent,
      longest: Math.max(streak.longest, newCurrent),
      lastActivityDate: activityDate,
      nextMilestone: getNextMilestone(newCurrent),
    };
  }

  // Streak broken, reset
  return {
    ...streak,
    current: 1,
    lastActivityDate: activityDate,
    nextMilestone: getNextMilestone(1),
  };
}

export function getNextMilestone(currentStreak: number): number | undefined {
  const milestone = STREAK_MILESTONES.find((m) => m.days > currentStreak);
  return milestone?.days;
}

export function getStreakReward(streak: Streak): StreakMilestone['reward'] | null {
  const milestone = STREAK_MILESTONES.find((m) => m.days === streak.current);
  return milestone?.reward ?? null;
}

export function getStreakEmoji(streak: Streak): string {
  if (streak.current >= 100) return '💎';
  if (streak.current >= 60) return '🔥🔥';
  if (streak.current >= 30) return '🔥';
  if (streak.current >= 14) return '⭐';
  if (streak.current >= 7) return '✨';
  return '🌱';
}

