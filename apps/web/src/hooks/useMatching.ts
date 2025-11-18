import { useState, useEffect, useCallback } from 'react';
import type { Pet } from '@/lib/types';
import {
  calculateCompatibility,
  getCompatibilityFactors,
  generateMatchReasoning,
} from '@/lib/matching';
import { matchingAPI } from '@/api/matching-api';

interface UseMatchingOptions {
  userPet?: Pet;
  otherPet?: Pet;
  autoCalculate?: boolean;
}

export function useMatching({ userPet, otherPet, autoCalculate = true }: UseMatchingOptions = {}) {
  const [compatibilityScore, setCompatibilityScore] = useState<number>(0);
  const [compatibilityFactors, setCompatibilityFactors] = useState<ReturnType<
    typeof getCompatibilityFactors
  > | null>(null);
  const [matchReasoning, setMatchReasoning] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const calculateMatch = useCallback(async () => {
    if (!userPet || !otherPet) {
      setCompatibilityScore(0);
      setCompatibilityFactors(null);
      setMatchReasoning([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const score = calculateCompatibility(userPet, otherPet);
      const factors = getCompatibilityFactors(userPet, otherPet);

      setCompatibilityScore(score);
      setCompatibilityFactors(factors);

      // Generate reasoning asynchronously
      const reasoning = await generateMatchReasoning(userPet, otherPet);
      setMatchReasoning(reasoning);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setCompatibilityScore(0);
      setCompatibilityFactors(null);
      setMatchReasoning([]);
    } finally {
      setIsLoading(false);
    }
  }, [userPet, otherPet]);

  useEffect(() => {
    if (autoCalculate) {
      // Calculate match asynchronously - fire-and-forget with error handling inside
      void calculateMatch();
    }
  }, [autoCalculate, calculateMatch]);

  const recalculate = useCallback(() => {
    // Calculate match asynchronously - fire-and-forget with error handling inside
    void calculateMatch();
  }, [calculateMatch]);

  const performSwipe = useCallback(
    async (params: { targetPetId: string; action: 'like' | 'pass' }) => {
      if (!userPet) {
        throw new Error('No user pet available for swipe');
      }

      try {
        const response = await matchingAPI.swipe({
          petId: userPet.id,
          targetPetId: params.targetPetId,
          action: params.action,
        });

        // Calculate compatibility for return value
        const targetPet = otherPet?.id === params.targetPetId ? otherPet : undefined;
        const compatibility = targetPet ? calculateCompatibility(userPet, targetPet) : 0;

        return {
          recorded: response.recorded,
          isMatch: response.isMatch,
          matchId: response.matchId,
          chatRoomId: response.chatRoomId,
          compatibility,
        };
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        throw error;
      }
    },
    [userPet, otherPet]
  );

  const checkMatch = useCallback(
    async (targetPetId: string) => {
      if (!userPet) {
        return { isMatch: false, compatibility: 0 };
      }

      try {
        const response = await matchingAPI.score({
          petId1: userPet.id,
          petId2: targetPetId,
        });

        return {
          isMatch: response.canMatch && response.score.totalScore >= 70,
          compatibility: response.score.totalScore,
        };
      } catch (_err) {
        // Return default values on error
        return { isMatch: false, compatibility: 0 };
      }
    },
    [userPet]
  );

  return {
    compatibilityScore,
    compatibilityFactors,
    matchReasoning,
    isLoading,
    error,
    calculateMatch: recalculate,
    performSwipe,
    checkMatch,
  };
}
