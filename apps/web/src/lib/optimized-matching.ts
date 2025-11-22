import { memoize } from './performance-utils';
import type { Pet } from './types';

function calculatePersonalityScore(pet1: Pet, pet2: Pet): { score: number; hasMatch: boolean } {
  if (
    pet1.personality &&
    Array.isArray(pet1.personality) &&
    pet2.personality &&
    Array.isArray(pet2.personality)
  ) {
    const personalityMatch = pet1.personality.filter((trait) =>
      pet2.personality.includes(trait)
    ).length;
    if (personalityMatch > 0) {
      const score = (personalityMatch / Math.max(pet1.personality.length, pet2.personality.length)) * 30;
      return { score, hasMatch: true };
    }
  }
  return { score: 0, hasMatch: false };
}

function calculateInterestsScore(pet1: Pet, pet2: Pet): { score: number; hasMatch: boolean } {
  if (
    pet1.interests &&
    Array.isArray(pet1.interests) &&
    pet2.interests &&
    Array.isArray(pet2.interests)
  ) {
    const interestsMatch = pet1.interests.filter((interest) =>
      pet2.interests.includes(interest)
    ).length;
    if (interestsMatch > 0) {
      const score = (interestsMatch / Math.max(pet1.interests.length, pet2.interests.length)) * 25;
      return { score, hasMatch: true };
    }
  }
  return { score: 0, hasMatch: false };
}

function calculateSizeScore(pet1: Pet, pet2: Pet): number {
  const sizeOrder = ['small', 'medium', 'large', 'extra-large'];
  const sizeDiff = Math.abs(
    sizeOrder.indexOf(pet1.size) - sizeOrder.indexOf(pet2.size)
  );
  return (1 - sizeDiff / 3) * 20;
}

function calculateAgeScore(pet1: Pet, pet2: Pet): number {
  const ageDiff = Math.abs(pet1.age - pet2.age);
  return Math.max(0, (1 - ageDiff / 10) * 15);
}

function calculateLookingForScore(pet1: Pet, pet2: Pet): { score: number; hasMatch: boolean } {
  if (
    pet1.lookingFor &&
    Array.isArray(pet1.lookingFor) &&
    pet2.lookingFor &&
    Array.isArray(pet2.lookingFor)
  ) {
    const lookingForMatch = pet1.lookingFor.filter((goal) => pet2.lookingFor.includes(goal)).length;
    if (lookingForMatch > 0) {
      const score = (lookingForMatch / Math.max(pet1.lookingFor.length, pet2.lookingFor.length)) * 10;
      return { score, hasMatch: true };
    }
  }
  return { score: 0, hasMatch: false };
}

const _calculateCompatibilityScoreImpl = (pet1: Pet, pet2: Pet): number => {
  let score = 0;
  let factors = 0;

  const personalityResult = calculatePersonalityScore(pet1, pet2);
  score += personalityResult.score;
  if (personalityResult.hasMatch) factors++;

  const interestsResult = calculateInterestsScore(pet1, pet2);
  score += interestsResult.score;
  if (interestsResult.hasMatch) factors++;

  score += calculateSizeScore(pet1, pet2);
  factors++;

  score += calculateAgeScore(pet1, pet2);
  factors++;

  const lookingForResult = calculateLookingForScore(pet1, pet2);
  score += lookingForResult.score;
  if (lookingForResult.hasMatch) factors++;

  return Math.round(factors > 0 ? score : 50);
};

export const calculateCompatibilityScore = memoize(
  _calculateCompatibilityScoreImpl as (...args: unknown[]) => unknown
) as typeof _calculateCompatibilityScoreImpl;

const _filterCompatiblePetsImpl = (
  allPets: Pet[],
  userPet: Pet | undefined,
  swipedIds: Set<string>,
  minScore = 0
): Pet[] => {
  if (!userPet) return [];

  return allPets.filter((pet) => {
    if (pet.id === userPet.id || swipedIds.has(pet.id)) return false;
    const score = calculateCompatibilityScore(userPet, pet);
    return score >= minScore;
  });
};

export const filterCompatiblePets = memoize(
  _filterCompatiblePetsImpl as (...args: unknown[]) => unknown
) as typeof _filterCompatiblePetsImpl;

export const batchCalculateScores = (pets: Pet[], userPet: Pet): Map<string, number> => {
  const scores = new Map<string, number>();

  for (const pet of pets) {
    if (pet.id !== userPet.id) {
      scores.set(pet.id, calculateCompatibilityScore(userPet, pet));
    }
  }

  return scores;
};
