/**
 * ML-Based Matching Weight Adjustment
 *
 * Learns from user behavior (swipe patterns, time spent, messages sent)
 * and dynamically adjusts matching weights to improve match quality.
 *
 * Location: apps/web/src/core/domain/ml-matching.ts
 */

import type { PetProfile } from './pet-model';
import type { MatchingWeights } from './matching-config';
import { calculateMatchScore } from './matching-engine';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ml-matching');

/**
 * User behavior data for learning
 */
export interface UserBehaviorData {
  userId: string;
  swipeActions: SwipeAction[];
  matches: MatchData[];
  messageActivity: MessageActivity[];
  viewTime: ViewTimeData[];
}

/**
 * Swipe action data
 */
export interface SwipeAction {
  petId: string;
  targetPetId: string;
  action: 'like' | 'pass' | 'superlike';
  timestamp: number;
  matchScore?: number;
  factorScores?: Record<string, number>;
}

/**
 * Match data
 */
export interface MatchData {
  petId: string;
  matchedPetId: string;
  matchedAt: number;
  messagesSent: number;
  messagesReceived: number;
  conversationDuration: number; // seconds
  stillActive: boolean;
}

/**
 * Message activity data
 */
export interface MessageActivity {
  petId: string;
  targetPetId: string;
  messageCount: number;
  responseRate: number; // 0-1
  averageResponseTime: number; // seconds
}

/**
 * View time data
 */
export interface ViewTimeData {
  petId: string;
  targetPetId: string;
  viewTime: number; // milliseconds
  swipeAction?: 'like' | 'pass';
}

/**
 * Learned weights for a user
 */
export interface LearnedWeights extends MatchingWeights {
  userId: string;
  learnedAt: number;
  confidence: number; // 0-1, how confident we are in these weights
  sampleSize: number; // Number of interactions used to learn
}

/**
 * ML Matching Weight Adjuster
 */
export class MLMatchingWeightAdjuster {
  private learnedWeights = new Map<string, LearnedWeights>();
  private readonly minSampleSize = 10; // Minimum interactions needed to learn
  private readonly maxWeightChange = 0.2; // Maximum weight adjustment per update (20%)

  /**
   * Learn weights from user behavior
   */
  learnWeights(userId: string, behaviorData: UserBehaviorData): LearnedWeights | null {
    if (behaviorData.swipeActions.length < this.minSampleSize) {
      logger.debug('Insufficient data for learning', {
        userId,
        sampleSize: behaviorData.swipeActions.length,
        minRequired: this.minSampleSize,
      });
      return null;
    }

    // Analyze which factors correlate with successful matches
    const factorImportance = this.calculateFactorImportance(behaviorData);

    // Get base weights (from config or previous learning)
    const baseWeights = this.getBaseWeights(userId);

    // Adjust weights based on learned importance
    const adjustedWeights = this.adjustWeights(baseWeights, factorImportance);

    // Calculate confidence based on sample size and consistency
    const confidence = this.calculateConfidence(behaviorData, factorImportance);

    const learnedWeights: LearnedWeights = {
      ...adjustedWeights,
      userId,
      learnedAt: Date.now(),
      confidence,
      sampleSize: behaviorData.swipeActions.length,
    };

    this.learnedWeights.set(userId, learnedWeights);

    logger.info('Learned weights from user behavior', {
      userId,
      sampleSize: behaviorData.swipeActions.length,
      confidence: confidence.toFixed(2),
      weights: adjustedWeights,
    });

    return learnedWeights;
  }

  /**
   * Calculate factor importance from user behavior
   */
  private calculateFactorImportance(behaviorData: UserBehaviorData): Record<string, number> {
    const importance: Record<string, number> = {
      temperamentFit: 0,
      energyLevelFit: 0,
      lifeStageProximity: 0,
      sizeCompatibility: 0,
      speciesBreedCompatibility: 0,
      socializationCompatibility: 0,
      intentMatch: 0,
      distance: 0,
      healthVaccinationBonus: 0,
    };

    // Analyze liked vs passed pets
    const likedActions = behaviorData.swipeActions.filter((a) => a.action === 'like');
    const passedActions = behaviorData.swipeActions.filter((a) => a.action === 'pass');

    // Calculate average factor scores for liked pets
    const likedFactorScores = this.aggregateFactorScores(likedActions);
    const passedFactorScores = this.aggregateFactorScores(passedActions);

    // Importance = difference between liked and passed average scores
    for (const factor of Object.keys(importance)) {
      importance[factor] = Math.max(
        0,
        (likedFactorScores[factor] ?? 0) - (passedFactorScores[factor] ?? 0)
      );
    }

    // Boost importance based on match success
    const matchFactorScores = this.aggregateFactorScoresFromMatches(behaviorData.matches);
    for (const factor of Object.keys(importance)) {
      const matchAvg = matchFactorScores[factor];
      const currentImportance = importance[factor];
      if (matchAvg !== undefined && matchAvg > 0 && currentImportance !== undefined) {
        importance[factor] = (currentImportance + matchAvg * 1.5) / 2; // Weight matches more
      }
    }

    // Boost importance based on message activity
    const messageFactorScores = this.aggregateFactorScoresFromMessages(
      behaviorData.messageActivity
    );
    for (const factor of Object.keys(importance)) {
      const messageAvg = messageFactorScores[factor];
      const currentImportance = importance[factor];
      if (messageAvg !== undefined && messageAvg > 0 && currentImportance !== undefined) {
        importance[factor] = (currentImportance + messageAvg * 1.2) / 2; // Weight messages moderately
      }
    }

    // Boost importance based on view time (longer view = more interest)
    const viewTimeFactorScores = this.aggregateFactorScoresFromViewTime(behaviorData.viewTime);
    for (const factor of Object.keys(importance)) {
      const viewTimeAvg = viewTimeFactorScores[factor];
      const currentImportance = importance[factor];
      if (viewTimeAvg !== undefined && viewTimeAvg > 0 && currentImportance !== undefined) {
        importance[factor] = (currentImportance + viewTimeAvg * 0.8) / 2; // Weight view time less
      }
    }

    // Normalize importance to 0-1 range
    const importanceValues = Object.values(importance).filter((v): v is number => v !== undefined);
    const maxImportance = importanceValues.length > 0 ? Math.max(...importanceValues) : 1;
    if (maxImportance > 0) {
      for (const factor of Object.keys(importance)) {
        const currentValue = importance[factor];
        if (currentValue !== undefined) {
          importance[factor] = currentValue / maxImportance;
        }
      }
    }

    return importance;
  }

  /**
   * Aggregate factor scores from swipe actions
   */
  private aggregateFactorScores(actions: SwipeAction[]): Record<string, number> {
    const totals: Record<string, number> = {};
    const counts: Record<string, number> = {};

    for (const action of actions) {
      if (action.factorScores) {
        for (const [factor, score] of Object.entries(action.factorScores)) {
          const currentTotal = totals[factor];
          const currentCount = counts[factor];
          totals[factor] = (currentTotal ?? 0) + (score ?? 0);
          counts[factor] = (currentCount ?? 0) + 1;
        }
      }
    }

    const averages: Record<string, number> = {};
    for (const factor of Object.keys(totals)) {
      const total = totals[factor];
      const count = counts[factor];
      if (total !== undefined && count !== undefined) {
        averages[factor] = count > 0 ? total / count : 0;
      }
    }

    return averages;
  }

  /**
   * Aggregate factor scores from successful matches
   */
  private aggregateFactorScoresFromMatches(_matches: MatchData[]): Record<string, number> {
    // In a real implementation, this would fetch factor scores for matched pets
    // For now, return empty (would need access to pet profiles and match scores)
    return {};
  }

  /**
   * Aggregate factor scores from message activity
   */
  private aggregateFactorScoresFromMessages(_messages: MessageActivity[]): Record<string, number> {
    // Messages indicate engagement - higher message count = higher importance
    // In a real implementation, this would correlate message activity with factor scores
    return {};
  }

  /**
   * Aggregate factor scores from view time
   */
  private aggregateFactorScoresFromViewTime(_viewTimes: ViewTimeData[]): Record<string, number> {
    // Longer view time = more interest
    // In a real implementation, this would correlate view time with factor scores
    return {};
  }

  /**
   * Get base weights for a user
   */
  private getBaseWeights(userId: string): MatchingWeights {
    const existing = this.learnedWeights.get(userId);
    if (existing) {
      return existing;
    }

    // Default weights (from matching-config)
    return {
      temperamentFit: 25,
      energyLevelFit: 15,
      lifeStageProximity: 10,
      sizeCompatibility: 15,
      speciesBreedCompatibility: 10,
      socializationCompatibility: 10,
      intentMatch: 5,
      distance: 5,
      healthVaccinationBonus: 5,
    };
  }

  /**
   * Adjust weights based on learned importance
   */
  private adjustWeights(
    baseWeights: MatchingWeights,
    factorImportance: Record<string, number>
  ): MatchingWeights {
    const adjusted: MatchingWeights = { ...baseWeights };

    // Calculate total current weight
    const totalWeight = Object.values(baseWeights).reduce((sum, w) => sum + w, 0);

    // Calculate desired weights based on importance
    const desiredWeights: Record<string, number> = {};
    let totalDesired = 0;

    for (const [factor, importance] of Object.entries(factorImportance)) {
      const baseWeight = baseWeights[factor as keyof MatchingWeights];
      if (baseWeight === undefined) {
        continue;
      }
      // Adjust weight proportionally to importance, but limit change
      const desiredWeight = baseWeight * (1 + (importance ?? 0) * this.maxWeightChange);
      desiredWeights[factor] = desiredWeight;
      totalDesired += desiredWeight;
    }

    // Normalize to maintain total weight = 100
    if (totalDesired > 0) {
      for (const factor of Object.keys(desiredWeights)) {
        const desiredWeight = desiredWeights[factor];
        if (desiredWeight !== undefined) {
          adjusted[factor as keyof MatchingWeights] = Math.round(
            (desiredWeight / totalDesired) * totalWeight
          );
        }
      }
    }

    return adjusted;
  }

  /**
   * Calculate confidence in learned weights
   */
  private calculateConfidence(
    behaviorData: UserBehaviorData,
    factorImportance: Record<string, number>
  ): number {
    // Confidence increases with:
    // 1. Sample size (more data = more confidence)
    // 2. Consistency (consistent patterns = more confidence)
    // 3. Match success rate (successful matches = more confidence)

    const sampleSize = behaviorData.swipeActions.length;
    const sampleSizeScore = Math.min(1, sampleSize / (this.minSampleSize * 5)); // Max at 5x min

    const matches = behaviorData.matches.length;
    const likes = behaviorData.swipeActions.filter((a) => a.action === 'like').length;
    const matchRate = likes > 0 ? matches / likes : 0;
    const matchRateScore = Math.min(1, matchRate * 2); // Boost confidence if match rate > 0.5

    // Consistency: check variance in factor importance (lower variance = more consistent)
    const importanceValues = Object.values(factorImportance);
    const avgImportance = importanceValues.reduce((sum, v) => sum + v, 0) / importanceValues.length;
    const variance =
      importanceValues.reduce((sum, v) => sum + Math.pow(v - avgImportance, 2), 0) /
      importanceValues.length;
    const consistencyScore = Math.max(0, 1 - variance * 2); // Lower variance = higher score

    // Weighted average of confidence factors
    const confidence = sampleSizeScore * 0.4 + matchRateScore * 0.3 + consistencyScore * 0.3;

    return Math.min(1, Math.max(0, confidence));
  }

  /**
   * Get learned weights for a user
   */
  getLearnedWeights(userId: string): LearnedWeights | null {
    return this.learnedWeights.get(userId) ?? null;
  }

  /**
   * Calculate match score with learned weights
   */
  calculateMatchScoreWithML(
    pet1: PetProfile,
    pet2: PetProfile,
    userId: string,
    baseWeights: MatchingWeights
  ): ReturnType<typeof calculateMatchScore> {
    // Get learned weights if available
    const learned = this.getLearnedWeights(userId);

    // Use learned weights if confidence is high enough, otherwise use base weights
    let weights: MatchingWeights;
    if (learned && learned.confidence > 0.6) {
      weights = {
        temperamentFit: learned.temperamentFit ?? baseWeights.temperamentFit,
        energyLevelFit: learned.energyLevelFit ?? baseWeights.energyLevelFit,
        lifeStageProximity: learned.lifeStageProximity ?? baseWeights.lifeStageProximity,
        sizeCompatibility: learned.sizeCompatibility ?? baseWeights.sizeCompatibility,
        speciesBreedCompatibility:
          learned.speciesBreedCompatibility ?? baseWeights.speciesBreedCompatibility,
        socializationCompatibility:
          learned.socializationCompatibility ?? baseWeights.socializationCompatibility,
        intentMatch: learned.intentMatch ?? baseWeights.intentMatch,
        distance: learned.distance ?? baseWeights.distance,
        healthVaccinationBonus:
          learned.healthVaccinationBonus ?? baseWeights.healthVaccinationBonus,
      };
    } else {
      weights = baseWeights;
    }

    return calculateMatchScore(pet1, pet2, weights);
  }
}

// Singleton instance
let mlAdjuster: MLMatchingWeightAdjuster | null = null;

/**
 * Get ML matching weight adjuster instance
 */
export function getMLMatchingWeightAdjuster(): MLMatchingWeightAdjuster {
  if (!mlAdjuster) {
    mlAdjuster = new MLMatchingWeightAdjuster();
  }
  return mlAdjuster;
}
