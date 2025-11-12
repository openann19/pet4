import { memoize } from './performance-utils';
import type { Pet } from './types';

const _calculateCompatibilityScoreImpl = (pet1: Pet, pet2: Pet): number => {
  let score = 0;
  let factors = 0;

  // Safe array access for personality
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
      score += (personalityMatch / Math.max(pet1.personality.length, pet2.personality.length)) * 30;
      factors++;
    }
  }

  // Safe array access for interests
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
      score += (interestsMatch / Math.max(pet1.interests.length, pet2.interests.length)) * 25;
      factors++;
    }
  }

  const sizeDiff = Math.abs(
    ['small', 'medium', 'large', 'extra-large'].indexOf(pet1.size) -
      ['small', 'medium', 'large', 'extra-large'].indexOf(pet2.size)
  );
  score += (1 - sizeDiff / 3) * 20;
  factors++;

  const ageDiff = Math.abs(pet1.age - pet2.age);
  score += Math.max(0, (1 - ageDiff / 10) * 15);
  factors++;

  // Safe array access for lookingFor
  if (
    pet1.lookingFor &&
    Array.isArray(pet1.lookingFor) &&
    pet2.lookingFor &&
    Array.isArray(pet2.lookingFor)
  ) {
    const lookingForMatch = pet1.lookingFor.filter((goal) => pet2.lookingFor.includes(goal)).length;
    if (lookingForMatch > 0) {
      score += (lookingForMatch / Math.max(pet1.lookingFor.length, pet2.lookingFor.length)) * 10;
      factors++;
    }
  }

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
