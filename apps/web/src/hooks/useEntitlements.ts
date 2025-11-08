import { useState, useEffect, useCallback } from 'react';
import type { UserEntitlements, EntitlementKey } from '@/lib/payments-types';
import { PaymentsService } from '@/lib/payments-service';

export function useEntitlements(): {
  entitlements: UserEntitlements | null;
  loading: boolean;
  error: string | null;
  hasEntitlement: (key: EntitlementKey) => boolean;
  getConsumableCount: (key: 'boosts' | 'super_likes') => number;
  refresh: () => Promise<void>;
} {
  const [entitlements, setEntitlements] = useState<UserEntitlements | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntitlements = useCallback(async () => {
    try {
      setLoading(true);
      const user = await spark.user();
      const result = await PaymentsService.getUserEntitlements(user.id);
      setEntitlements(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load entitlements');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntitlements();
  }, [fetchEntitlements]);

  const hasEntitlement = useCallback(
    (key: EntitlementKey): boolean => {
      if (!entitlements) return false;
      return entitlements.entitlements.includes(key);
    },
    [entitlements]
  );

  const getConsumableCount = useCallback(
    (key: 'boosts' | 'super_likes'): number => {
      if (!entitlements) return 0;
      return entitlements.consumables[key] || 0;
    },
    [entitlements]
  );

  const refresh = useCallback(async () => {
    await fetchEntitlements();
  }, [fetchEntitlements]);

  return {
    entitlements,
    loading,
    error,
    hasEntitlement,
    getConsumableCount,
    refresh,
  };
}
