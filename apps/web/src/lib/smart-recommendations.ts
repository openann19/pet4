import type { Pet, SwipeAction } from './types';

export interface RecommendationScore {
  petId: string;
  score: number;
  reasons: string[];
  category: 'perfect-match' | 'great-fit' | 'good-potential' | 'worth-exploring';
}

export interface UserPreferences {
  favoriteBreeds: string[];
  favoritePersonalities: string[];
  preferredSizes: string[];
  preferredAgeRange: [number, number];
  activityLevel: 'low' | 'medium' | 'high';
  socialPreference: 'one-on-one' | 'group-friendly' | 'both';
}

export class SmartRecommendationEngine {
  private swipeHistory: SwipeAction[];
  private userPreferences: UserPreferences | null = null;

  constructor(swipeHistory: SwipeAction[] = []) {
    this.swipeHistory = swipeHistory;
    this.learnFromHistory();
  }

  private learnFromHistory(): void {
    if (this.swipeHistory.length < 5) {
      return;
    }

    this.userPreferences = {
      favoriteBreeds: [],
      favoritePersonalities: [],
      preferredSizes: [],
      preferredAgeRange: [0, 15],
      activityLevel: 'medium',
      socialPreference: 'both',
    };
  }

  public scoreRecommendations(
    availablePets: Pet[],
    userPet: Pet,
    previouslyViewed: string[] = []
  ): RecommendationScore[] {
    const scores: RecommendationScore[] = [];

    for (const pet of availablePets) {
      if (previouslyViewed.includes(pet.id)) {
        continue;
      }

      const score = this.calculateScore(pet, userPet);
      const reasons = this.generateReasons(pet, userPet, score);
      const category = this.categorizeScore(score);

      scores.push({
        petId: pet.id,
        score,
        reasons,
        category,
      });
    }

    return scores.sort((a, b) => b.score - a.score);
  }

  private calculateScore(targetPet: Pet, userPet: Pet): number {
    let score = 0;

    score += this.scorePersonalityMatch(targetPet, userPet) * 0.35;
    score += this.scoreSizeCompatibility(targetPet, userPet) * 0.15;
    score += this.scoreAgeCompatibility(targetPet, userPet) * 0.15;
    score += this.scoreInterestOverlap(targetPet, userPet) * 0.2;
    score += this.scoreActivityLevel(targetPet, userPet) * 0.1;
    score += this.scoreUserPreferences(targetPet) * 0.05;

    return Math.min(100, Math.round(score));
  }

  private scorePersonalityMatch(targetPet: Pet, userPet: Pet): number {
    const targetTraits = targetPet.personality || [];
    const userTraits = userPet.personality || [];

    if (targetTraits.length === 0 || userTraits.length === 0) {
      return 50;
    }

    const complementaryPairs: Record<string, string[]> = {
      playful: ['energetic', 'playful', 'adventurous'],
      calm: ['gentle', 'calm', 'quiet'],
      social: ['friendly', 'social', 'outgoing'],
      independent: ['independent', 'calm', 'quiet'],
      energetic: ['playful', 'energetic', 'active'],
      gentle: ['calm', 'gentle', 'affectionate'],
      curious: ['playful', 'curious', 'smart'],
      loyal: ['loyal', 'protective', 'affectionate'],
    };

    let matchScore = 0;
    let totalComparisons = 0;

    for (const userTrait of userTraits) {
      const complementary = complementaryPairs[userTrait.toLowerCase()] ?? [];

      for (const targetTrait of targetTraits) {
        totalComparisons++;

        if (targetTrait.toLowerCase() === userTrait.toLowerCase()) {
          matchScore += 100;
        } else if (complementary.includes(targetTrait.toLowerCase())) {
          matchScore += 70;
        } else {
          matchScore += 30;
        }
      }
    }

    return totalComparisons > 0 ? matchScore / totalComparisons : 50;
  }

  private scoreSizeCompatibility(targetPet: Pet, userPet: Pet): number {
    const sizeOrder: Record<string, number> = {
      small: 1,
      medium: 2,
      large: 3,
    };

    const targetSize = sizeOrder[targetPet.size?.toLowerCase() ?? 'medium'] ?? 2;
    const userSize = sizeOrder[userPet.size?.toLowerCase() ?? 'medium'] ?? 2;

    const sizeDiff = Math.abs(targetSize - userSize);

    if (sizeDiff === 0) return 100;
    if (sizeDiff === 1) return 75;
    return 50;
  }

  private scoreAgeCompatibility(targetPet: Pet, userPet: Pet): number {
    const targetAge = targetPet.age || 3;
    const userAge = userPet.age || 3;

    const ageDiff = Math.abs(targetAge - userAge);

    if (ageDiff === 0) return 100;
    if (ageDiff <= 1) return 90;
    if (ageDiff <= 2) return 75;
    if (ageDiff <= 3) return 60;
    if (ageDiff <= 5) return 45;
    return 30;
  }

  private scoreInterestOverlap(targetPet: Pet, userPet: Pet): number {
    const targetInterests = targetPet.interests || [];
    const userInterests = userPet.interests || [];

    if (targetInterests.length === 0 || userInterests.length === 0) {
      return 50;
    }

    const overlap = targetInterests.filter((interest) => userInterests.includes(interest)).length;

    const totalUnique = new Set([...targetInterests, ...userInterests]).size;

    return (overlap / totalUnique) * 100;
  }

  private scoreActivityLevel(targetPet: Pet, userPet: Pet): number {
    const activityMap: Record<string, number> = {
      low: 1,
      calm: 1,
      quiet: 1,
      medium: 2,
      moderate: 2,
      high: 3,
      energetic: 3,
      active: 3,
      playful: 3,
    };

    const targetActivity = this.extractActivityLevel(targetPet, activityMap);
    const userActivity = this.extractActivityLevel(userPet, activityMap);

    const diff = Math.abs(targetActivity - userActivity);

    if (diff === 0) return 100;
    if (diff === 1) return 70;
    return 40;
  }

  private extractActivityLevel(pet: Pet, activityMap: Record<string, number>): number {
    const personality = pet.personality || [];
    const interests = pet.interests || [];
    const allTraits = [...personality, ...interests].map((t) => t.toLowerCase());

    let totalLevel = 0;
    let count = 0;

    for (const trait of allTraits) {
      if (activityMap[trait]) {
        totalLevel += activityMap[trait];
        count++;
      }
    }

    return count > 0 ? totalLevel / count : 2;
  }

  private scoreUserPreferences(targetPet: Pet): number {
    if (!this.userPreferences) {
      return 50;
    }

    let score = 0;
    let factors = 0;

    if (this.userPreferences.favoriteBreeds.length > 0) {
      factors++;
      if (this.userPreferences.favoriteBreeds.includes(targetPet.breed || '')) {
        score += 100;
      }
    }

    if (this.userPreferences.favoritePersonalities.length > 0) {
      factors++;
      const hasPreferredPersonality = (targetPet.personality || []).some((p) =>
        this.userPreferences!.favoritePersonalities.includes(p)
      );
      if (hasPreferredPersonality) {
        score += 100;
      }
    }

    return factors > 0 ? score / factors : 50;
  }

  private generateReasons(targetPet: Pet, userPet: Pet, _score: number): string[] {
    const reasons: string[] = [];

    const personalityScore = this.scorePersonalityMatch(targetPet, userPet);
    if (personalityScore >= 80) {
      reasons.push('Highly compatible personalities');
    } else if (personalityScore >= 60) {
      reasons.push('Good personality match');
    }

    const sizeScore = this.scoreSizeCompatibility(targetPet, userPet);
    if (sizeScore === 100) {
      reasons.push('Perfect size match');
    } else if (sizeScore >= 75) {
      reasons.push('Similar sizes work well together');
    }

    const ageScore = this.scoreAgeCompatibility(targetPet, userPet);
    if (ageScore >= 90) {
      reasons.push('Very close in age');
    } else if (ageScore >= 75) {
      reasons.push('Compatible age range');
    }

    const interestScore = this.scoreInterestOverlap(targetPet, userPet);
    if (interestScore >= 50) {
      reasons.push('Share common interests');
    }

    const activityScore = this.scoreActivityLevel(targetPet, userPet);
    if (activityScore >= 80) {
      reasons.push('Matching activity levels');
    }

    if (reasons.length === 0) {
      reasons.push('Worth getting to know');
    }

    return reasons.slice(0, 3);
  }

  private categorizeScore(score: number): RecommendationScore['category'] {
    if (score >= 85) return 'perfect-match';
    if (score >= 70) return 'great-fit';
    if (score >= 55) return 'good-potential';
    return 'worth-exploring';
  }

  public getTopRecommendations(
    availablePets: Pet[],
    userPet: Pet,
    previouslyViewed: string[] = [],
    limit = 10
  ): RecommendationScore[] {
    const scores = this.scoreRecommendations(availablePets, userPet, previouslyViewed);
    return scores.slice(0, limit);
  }

  public getBatchRecommendations(
    availablePets: Pet[],
    userPet: Pet,
    previouslyViewed: string[] = [],
    batchSize = 5
  ): Pet[] {
    const recommendations = this.getTopRecommendations(
      availablePets,
      userPet,
      previouslyViewed,
      batchSize
    );

    return recommendations
      .map((rec) => availablePets.find((pet) => pet.id === rec.petId))
      .filter((pet): pet is Pet => pet !== undefined);
  }
}

export function createRecommendationEngine(swipeHistory: SwipeAction[]): SmartRecommendationEngine {
  return new SmartRecommendationEngine(swipeHistory);
}
