/**
 * Predictive Prefetching System
 *
 * Predicts likely matches based on user behavior patterns and prefetches
 * pet profiles, images, and metadata for instant swipe experience.
 *
 * Location: apps/web/src/lib/predictive-prefetch.ts
 */

import { createLogger } from './logger';
import type { PetProfile } from '@/core/domain/pet-model';
import { analytics } from './analytics';

const logger = createLogger('predictive-prefetch');

/**
 * User behavior pattern for learning
 */
export interface UserBehaviorPattern {
  userId: string;
  swipePatterns: {
    likedPets: string[]; // Pet IDs that were liked
    passedPets: string[]; // Pet IDs that were passed
    timeSpent: Record<string, number>; // Pet ID -> milliseconds viewed
    messagesSent: Record<string, number>; // Pet ID -> message count
  };
  preferences: {
    preferredBreeds: string[];
    preferredSizes: string[];
    preferredAges: string[];
    preferredTraits: string[];
    distanceRange: number;
  };
  contextualFactors: {
    timeOfDay: number; // 0-23 hour
    dayOfWeek: number; // 0-6
    location?: { lat: number; lng: number };
  };
}

/**
 * Prediction result
 */
export interface PredictionResult {
  petId: string;
  probability: number; // 0-1
  reasons: string[];
}

/**
 * Predictive Prefetch Manager
 */
export class PredictivePrefetchManager {
  private behaviorPatterns: Map<string, UserBehaviorPattern> = new Map();
  private prefetchCache: Map<string, PetProfile> = new Map();
  private prefetchQueue: string[] = [];
  private readonly maxCacheSize = 50;
  private readonly prefetchCount = 5;

  /**
   * Learn from user behavior
   */
  learnFromBehavior(pattern: UserBehaviorPattern): void {
    const existing = this.behaviorPatterns.get(pattern.userId);
    if (existing) {
      // Merge with existing pattern
      existing.swipePatterns.likedPets.push(...pattern.swipePatterns.likedPets);
      existing.swipePatterns.passedPets.push(...pattern.swipePatterns.passedPets);
      Object.assign(existing.swipePatterns.timeSpent, pattern.swipePatterns.timeSpent);
      Object.assign(existing.swipePatterns.messagesSent, pattern.swipePatterns.messagesSent);
      existing.preferences.preferredBreeds.push(...pattern.preferences.preferredBreeds);
      existing.preferences.preferredSizes.push(...pattern.preferences.preferredSizes);
      existing.preferences.preferredAges.push(...pattern.preferences.preferredAges);
      existing.preferences.preferredTraits.push(...pattern.preferences.preferredTraits);
    } else {
      this.behaviorPatterns.set(pattern.userId, pattern);
    }

    logger.debug('Learned from user behavior', {
      userId: pattern.userId,
      likedCount: pattern.swipePatterns.likedPets.length,
      passedCount: pattern.swipePatterns.passedPets.length,
    });

    // Trigger prediction update
    this.updatePredictions(pattern.userId);
  }

  /**
   * Predict likely matches based on user behavior
   */
  predictLikelyMatches(
    userId: string,
    availablePets: PetProfile[],
    currentContext?: {
      timeOfDay?: number;
      dayOfWeek?: number;
      location?: { lat: number; lng: number };
    }
  ): PredictionResult[] {
    const pattern = this.behaviorPatterns.get(userId);
    if (!pattern) {
      return [];
    }

    const predictions: PredictionResult[] = [];
    const context = {
      timeOfDay: currentContext?.timeOfDay ?? new Date().getHours(),
      dayOfWeek: currentContext?.dayOfWeek ?? new Date().getDay(),
      location: currentContext?.location ?? pattern.contextualFactors.location,
    };

    for (const pet of availablePets) {
      // Skip pets already swiped
      if (
        pattern.swipePatterns.likedPets.includes(pet.id) ||
        pattern.swipePatterns.passedPets.includes(pet.id)
      ) {
        continue;
      }

      const probability = this.calculateMatchProbability(pet, pattern, context);
      const reasons = this.generatePredictionReasons(pet, pattern);

      predictions.push({
        petId: pet.id,
        probability,
        reasons,
      });
    }

    // Sort by probability (highest first)
    return predictions.sort((a, b) => b.probability - a.probability);
  }

  /**
   * Calculate match probability based on user behavior
   */
  private calculateMatchProbability(
    pet: PetProfile,
    pattern: UserBehaviorPattern,
    context: {
      timeOfDay: number;
      dayOfWeek: number;
      location?: { lat: number; lng: number };
    }
  ): number {
    let score = 0;
    let weightSum = 0;

    // Breed preference (weight: 0.25)
    if (pattern.preferences.preferredBreeds.length > 0) {
      const breedMatch =
        pattern.preferences.preferredBreeds.includes(pet.breedId) ||
        pattern.preferences.preferredBreeds.includes(pet.breedName);
      score += breedMatch ? 0.25 : 0;
      weightSum += 0.25;
    }

    // Size preference (weight: 0.15)
    if (pattern.preferences.preferredSizes.length > 0) {
      const sizeMatch = pattern.preferences.preferredSizes.includes(pet.size);
      score += sizeMatch ? 0.15 : 0;
      weightSum += 0.15;
    }

    // Age preference (weight: 0.15)
    if (pattern.preferences.preferredAges.length > 0) {
      const ageMatch = pattern.preferences.preferredAges.some((age) => {
        const petAge = this.getAgeCategory(pet.ageMonths);
        return age === petAge;
      });
      score += ageMatch ? 0.15 : 0;
      weightSum += 0.15;
    }

    // Trait preference (weight: 0.20)
    if (pattern.preferences.preferredTraits.length > 0) {
      const commonTraits = pet.temperament.traits.filter((trait) =>
        pattern.preferences.preferredTraits.includes(trait)
      );
      const traitScore = commonTraits.length / pattern.preferences.preferredTraits.length;
      score += traitScore * 0.2;
      weightSum += 0.2;
    }

    // Distance preference (weight: 0.15)
    if (context.location && pet.location) {
      const distance = this.calculateDistance(
        context.location,
        { lat: pet.location.roundedLat, lng: pet.location.roundedLng }
      );
      const maxDistance = pattern.preferences.distanceRange || 50; // km
      const distanceScore = Math.max(0, 1 - distance / maxDistance);
      score += distanceScore * 0.15;
      weightSum += 0.15;
    }

    // Contextual factors (weight: 0.10)
    // Time of day and day of week can influence swipe patterns
    const contextualScore = this.calculateContextualScore(pattern, context);
    score += contextualScore * 0.1;
    weightSum += 0.1;

    // Normalize score
    return weightSum > 0 ? score / weightSum : 0;
  }

  /**
   * Generate prediction reasons
   */
  private generatePredictionReasons(pet: PetProfile, pattern: UserBehaviorPattern): string[] {
    const reasons: string[] = [];

    if (
      pattern.preferences.preferredBreeds.includes(pet.breedId) ||
      pattern.preferences.preferredBreeds.includes(pet.breedName)
    ) {
      reasons.push(`Matches preferred breed: ${pet.breedName}`);
    }

    if (pattern.preferences.preferredSizes.includes(pet.size)) {
      reasons.push(`Matches preferred size: ${pet.size}`);
    }

    const commonTraits = pet.temperament.traits.filter((trait) =>
      pattern.preferences.preferredTraits.includes(trait)
    );
    if (commonTraits.length > 0) {
      reasons.push(`Shares ${commonTraits.length} preferred traits`);
    }

    return reasons;
  }

  /**
   * Get age category from age in months
   */
  private getAgeCategory(ageMonths: number): string {
    if (ageMonths < 12) return 'puppy';
    if (ageMonths < 24) return 'young';
    if (ageMonths < 84) return 'adult';
    return 'senior';
  }

  /**
   * Calculate distance between two locations (Haversine formula)
   */
  private calculateDistance(
    loc1: { lat: number; lng: number },
    loc2: { lat: number; lng: number }
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(loc2.lat - loc1.lat);
    const dLng = this.toRadians(loc2.lng - loc1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(loc1.lat)) *
        Math.cos(this.toRadians(loc2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Calculate contextual score based on time and day
   */
  private calculateContextualScore(
    pattern: UserBehaviorPattern,
    context: { timeOfDay: number; dayOfWeek: number }
  ): number {
    // Simple heuristic: higher score if current context matches historical patterns
    // In a real implementation, this would analyze historical swipe patterns by time/day
    const historicalTime = pattern.contextualFactors.timeOfDay;
    const timeDiff = Math.abs(context.timeOfDay - historicalTime);
    const timeScore = 1 - timeDiff / 12; // Normalize to 0-1

    const historicalDay = pattern.contextualFactors.dayOfWeek;
    const dayDiff = Math.abs(context.dayOfWeek - historicalDay);
    const dayScore = dayDiff === 0 ? 1 : 0.5;

    return (timeScore + dayScore) / 2;
  }

  /**
   * Update predictions and trigger prefetch
   */
  private updatePredictions(userId: string): void {
    // This would be called after learning to update prefetch queue
    // In a real implementation, this would fetch available pets and predict
    logger.debug('Updating predictions', { userId });
  }

  /**
   * Prefetch pet profiles for predicted matches
   */
  async prefetchPets(
    userId: string,
    availablePets: PetProfile[],
    prefetchCallback: (petIds: string[]) => Promise<PetProfile[]>
  ): Promise<void> {
    const predictions = this.predictLikelyMatches(userId, availablePets);
    const topPredictions = predictions.slice(0, this.prefetchCount);

    if (topPredictions.length === 0) {
      return;
    }

    const petIdsToPrefetch = topPredictions.map((p) => p.petId);
    const notCached = petIdsToPrefetch.filter((id) => !this.prefetchCache.has(id));

    if (notCached.length === 0) {
      logger.debug('All predicted pets already cached');
      return;
    }

    try {
      logger.debug('Prefetching pets', {
        userId,
        count: notCached.length,
        petIds: notCached,
      });

      const prefetchedPets = await prefetchCallback(notCached);

      // Cache prefetched pets
      for (const pet of prefetchedPets) {
        this.cachePet(pet);
      }

      // Track prefetch success
      analytics.track('predictive_prefetch', {
        userId,
        prefetchedCount: prefetchedPets.length,
        predictedCount: topPredictions.length,
        averageProbability: (
          topPredictions.reduce((sum, p) => sum + p.probability, 0) / topPredictions.length
        ).toFixed(2),
      });

      logger.info('Prefetched pets', {
        userId,
        count: prefetchedPets.length,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to prefetch pets', err, {
        userId,
        petIds: notCached,
      });
    }
  }

  /**
   * Cache pet profile
   */
  private cachePet(pet: PetProfile): void {
    // Evict oldest if cache is full
    if (this.prefetchCache.size >= this.maxCacheSize) {
      const firstKey = this.prefetchCache.keys().next().value;
      if (firstKey) {
        this.prefetchCache.delete(firstKey);
      }
    }

    this.prefetchCache.set(pet.id, pet);
  }

  /**
   * Get cached pet profile
   */
  getCachedPet(petId: string): PetProfile | undefined {
    return this.prefetchCache.get(petId);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.prefetchCache.clear();
    this.prefetchQueue = [];
  }
}

// Singleton instance
let prefetchManager: PredictivePrefetchManager | null = null;

/**
 * Get predictive prefetch manager instance
 */
export function getPredictivePrefetchManager(): PredictivePrefetchManager {
  if (!prefetchManager) {
    prefetchManager = new PredictivePrefetchManager();
  }
  return prefetchManager;
}
