/**
 * Gamification Client
 *
 * Client for interacting with gamification API
 */

import type {
  Achievement,
  AchievementProgress,
  Challenge,
  ChallengeProgress,
  Streak,
  Quiz,
  QuizAttempt,
  QuizResult,
} from './types';

export interface GamificationStats {
  totalPoints: number;
  level: number;
  achievements: Achievement[];
  activeChallenges: Challenge[];
  streaks: Streak[];
  recentActivity: Array<{
    type: string;
    description: string;
    points: number;
    timestamp: string;
  }>;
}

export class GamificationClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/gamification') {
    this.baseUrl = baseUrl;
  }

  async getStats(userId: string): Promise<GamificationStats> {
    const response = await fetch(`${this.baseUrl}/stats/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch gamification stats');
    }
    return response.json();
  }

  async getAchievements(userId: string): Promise<Achievement[]> {
    const response = await fetch(`${this.baseUrl}/achievements/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch achievements');
    }
    return response.json();
  }

  async getAchievementProgress(
    userId: string,
    achievementId: string
  ): Promise<AchievementProgress> {
    const response = await fetch(
      `${this.baseUrl}/achievements/${userId}/${achievementId}/progress`
    );
    if (!response.ok) {
      throw new Error('Failed to fetch achievement progress');
    }
    return response.json();
  }

  async getChallenges(userId: string): Promise<Challenge[]> {
    const response = await fetch(`${this.baseUrl}/challenges/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch challenges');
    }
    return response.json();
  }

  async getChallengeProgress(
    userId: string,
    challengeId: string
  ): Promise<ChallengeProgress> {
    const response = await fetch(
      `${this.baseUrl}/challenges/${userId}/${challengeId}/progress`
    );
    if (!response.ok) {
      throw new Error('Failed to fetch challenge progress');
    }
    return response.json();
  }

  async getStreaks(userId: string): Promise<Streak[]> {
    const response = await fetch(`${this.baseUrl}/streaks/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch streaks');
    }
    return response.json();
  }

  async updateStreak(userId: string, streakType: string): Promise<Streak> {
    const response = await fetch(`${this.baseUrl}/streaks/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: streakType }),
    });
    if (!response.ok) {
      throw new Error('Failed to update streak');
    }
    return response.json();
  }

  async getQuizzes(): Promise<Quiz[]> {
    const response = await fetch(`${this.baseUrl}/quizzes`);
    if (!response.ok) {
      throw new Error('Failed to fetch quizzes');
    }
    return response.json();
  }

  async submitQuizAttempt(userId: string, attempt: QuizAttempt): Promise<QuizResult> {
    const response = await fetch(`${this.baseUrl}/quizzes/${attempt.quizId}/attempt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...attempt }),
    });
    if (!response.ok) {
      throw new Error('Failed to submit quiz attempt');
    }
    return response.json();
  }
}

export const gamificationClient = new GamificationClient();

