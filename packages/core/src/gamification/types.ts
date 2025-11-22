/**
 * Gamification Types
 *
 * Shared types for gamification system
 */

export * from './achievements';
export * from './challenges';
export * from './streaks';
export * from './quizzes';

// Re-export utility functions
export { getStreakEmoji, updateStreak, getNextMilestone, getStreakReward } from './streaks';
export { calculateQuizScore, getQuizById, getQuizzesByTopic } from './quizzes';
export { getAchievementById, getAchievementsByCategory, getAchievementsByRarity } from './achievements';
export { createDailyChallenge, createWeeklyChallenge, isChallengeActive, getChallengeProgress } from './challenges';

