/**
 * Challenge System
 *
 * Defines time-limited challenges and quests
 */

export type ChallengeType = 'daily' | 'weekly' | 'event' | 'seasonal';

export type ChallengeStatus = 'locked' | 'active' | 'completed' | 'expired';

export interface Challenge {
  id: string;
  name: string;
  description: string;
  type: ChallengeType;
  status: ChallengeStatus;
  startDate: string;
  endDate: string;
  requirements: ChallengeRequirement[];
  rewards: ChallengeReward[];
  progress?: ChallengeProgress;
}

export interface ChallengeRequirement {
  id: string;
  description: string;
  target: number;
  metric: string;
  current?: number;
}

export interface ChallengeReward {
  type: 'points' | 'badge' | 'premium_days' | 'discount';
  value: number | string;
  icon?: string;
}

export interface ChallengeProgress {
  challengeId: string;
  requirements: Array<{
    requirementId: string;
    current: number;
    target: number;
    completed: boolean;
  }>;
  overallProgress: number;
  isCompleted: boolean;
}

export function createDailyChallenge(
  id: string,
  name: string,
  description: string,
  requirements: ChallengeRequirement[],
  rewards: ChallengeReward[]
): Challenge {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  return {
    id,
    name,
    description,
    type: 'daily',
    status: 'active',
    startDate: today.toISOString(),
    endDate: tomorrow.toISOString(),
    requirements,
    rewards,
  };
}

export function createWeeklyChallenge(
  id: string,
  name: string,
  description: string,
  requirements: ChallengeRequirement[],
  rewards: ChallengeReward[]
): Challenge {
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(0, 0, 0, 0);

  return {
    id,
    name,
    description,
    type: 'weekly',
    status: 'active',
    startDate: today.toISOString(),
    endDate: nextWeek.toISOString(),
    requirements,
    rewards,
  };
}

export function isChallengeActive(challenge: Challenge): boolean {
  const now = new Date();
  const start = new Date(challenge.startDate);
  const end = new Date(challenge.endDate);
  return now >= start && now <= end && challenge.status === 'active';
}

export function getChallengeProgress(challenge: Challenge): ChallengeProgress {
  const requirements = challenge.requirements.map((req) => ({
    requirementId: req.id,
    current: req.current ?? 0,
    target: req.target,
    completed: (req.current ?? 0) >= req.target,
  }));

  const completedCount = requirements.filter((r) => r.completed).length;
  const overallProgress = challenge.requirements.length > 0
    ? (completedCount / challenge.requirements.length) * 100
    : 0;

  return {
    challengeId: challenge.id,
    requirements,
    overallProgress,
    isCompleted: requirements.every((r) => r.completed),
  };
}

