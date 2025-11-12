import { useState, useEffect, useCallback } from 'react';
import type { Pet } from '@/lib/types';
import {
  calculateCompatibility,
  getCompatibilityFactors,
  generateMatchReasoning,
} from '@/lib/matching';

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

  return {
    compatibilityScore,
    compatibilityFactors,
    matchReasoning,
    isLoading,
    error,
    calculateMatch: recalculate,
  };
}
