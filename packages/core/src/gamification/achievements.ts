/**
 * Achievement System
 *
 * Defines achievement types, requirements, and rewards
 */

export type AchievementCategory = 'social' | 'engagement' | 'safety' | 'premium' | 'streak';

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  icon: string;
  points: number;
  requirement: AchievementRequirement;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
}

export interface AchievementRequirement {
  type: 'count' | 'streak' | 'completion' | 'milestone';
  target: number;
  metric: string;
}

export interface AchievementProgress {
  achievementId: string;
  current: number;
  target: number;
  percentage: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-match',
    name: 'First Match',
    description: 'Made your first match',
    category: 'social',
    rarity: 'common',
    icon: '🎯',
    points: 10,
    requirement: {
      type: 'count',
      target: 1,
      metric: 'matches',
    },
  },
  {
    id: 'chat-master',
    name: 'Chat Master',
    description: 'Sent 100 messages',
    category: 'engagement',
    rarity: 'common',
    icon: '💬',
    points: 25,
    requirement: {
      type: 'count',
      target: 100,
      metric: 'messages_sent',
    },
  },
  {
    id: 'verified-pet',
    name: 'Verified Pet',
    description: 'Completed KYC verification',
    category: 'safety',
    rarity: 'rare',
    icon: '✅',
    points: 50,
    requirement: {
      type: 'completion',
      target: 1,
      metric: 'kyc_verified',
    },
  },
  {
    id: 'playdate-organizer',
    name: 'Playdate Organizer',
    description: 'Organized 10 playdates',
    category: 'social',
    rarity: 'epic',
    icon: '🎪',
    points: 100,
    requirement: {
      type: 'count',
      target: 10,
      metric: 'playdates_organized',
    },
  },
  {
    id: 'streak-7',
    name: 'Week Warrior',
    description: '7-day login streak',
    category: 'streak',
    rarity: 'rare',
    icon: '🔥',
    points: 75,
    requirement: {
      type: 'streak',
      target: 7,
      metric: 'login_streak',
    },
  },
  {
    id: 'streak-30',
    name: 'Monthly Champion',
    description: '30-day login streak',
    category: 'streak',
    rarity: 'epic',
    icon: '⭐',
    points: 200,
    requirement: {
      type: 'streak',
      target: 30,
      metric: 'login_streak',
    },
  },
  {
    id: 'premium-member',
    name: 'Premium Member',
    description: 'Subscribed to premium',
    category: 'premium',
    rarity: 'rare',
    icon: '👑',
    points: 150,
    requirement: {
      type: 'completion',
      target: 1,
      metric: 'premium_subscription',
    },
  },
];

export function getAchievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

export function getAchievementsByCategory(category: AchievementCategory): Achievement[] {
  return ACHIEVEMENTS.filter((a) => a.category === category);
}

export function getAchievementsByRarity(rarity: AchievementRarity): Achievement[] {
  return ACHIEVEMENTS.filter((a) => a.rarity === rarity);
}

