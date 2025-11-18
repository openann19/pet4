/**
 * Hook for subscription admin operations
 * Extracted business logic from SubscriptionAdminPanel component
 */

import type { AuditLogEntry, RevenueMetrics, Subscription } from '@/lib/payments-service';
import { PaymentsService } from '@/lib/payments-service';
import { userService } from '@/lib/user-service';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export interface UseSubscriptionAdminReturn {
  subscriptions: Subscription[];
  auditLogs: AuditLogEntry[];
  metrics: RevenueMetrics | null;
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  loadData: () => Promise<void>;
  compSubscription: (subscription: Subscription, months: number, reason: string) => Promise<void>;
  cancelSubscription: (subscription: Subscription) => Promise<void>;
  refundSubscription: (subscription: Subscription, amount: number, reason: string) => Promise<void>;
}

export function useSubscriptionAdmin(): UseSubscriptionAdminReturn {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [metrics, setMetrics] = useState<RevenueMetrics | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [subs, logs, rev] = await Promise.all([
        PaymentsService.getAllSubscriptions(),
        PaymentsService.getAuditLogs(100),
        PaymentsService.getRevenueMetrics(),
      ]);
      setSubscriptions(subs);
      setAuditLogs(logs);
      setMetrics(rev);
    } catch (_error) {
      toast.error('Failed to load data');
      throw _error;
    } finally {
      setLoading(false);
    }
  }, []);

  const compSubscription = useCallback(
    async (subscription: Subscription, months: number, reason: string) => {
      if (!reason.trim()) {
        toast.error('Please provide a reason');
        return;
      }

      try {
        const user = await userService.user();
        if (!user) {
          toast.error('User not authenticated');
          return;
        }
        await PaymentsService.compSubscription(
          subscription.userId,
          subscription.planId,
          months,
          user.id,
          reason
        );

        toast.success('Subscription comped successfully');
        await loadData();
      } catch (_error) {
        toast.error('Failed to comp subscription');
        throw _error;
      }
    },
    [loadData]
  );

  const cancelSubscription = useCallback(
    async (subscription: Subscription) => {
      try {
        const user = await userService.user();
        if (!user) {
          toast.error('User not authenticated');
          return;
        }
        await PaymentsService.cancelSubscription(
          subscription.id,
          true,
          user.id,
          'Admin cancellation'
        );

        toast.success('Subscription cancelled successfully');
        await loadData();
      } catch (_error) {
        toast.error('Failed to cancel subscription');
        throw _error;
      }
    },
    [loadData]
  );

  const refundSubscription = useCallback(
    async (subscription: Subscription, amount: number, reason: string) => {
      if (!reason.trim()) {
        toast.error('Please provide a reason');
        return;
      }

      try {
        const user = await userService.user();
        if (!user) {
          toast.error('User not authenticated');
          return;
        }
        await PaymentsService.refundSubscription(subscription.id, amount, user.id, reason);

        toast.success('Refund processed successfully');
        await loadData();
      } catch (_error) {
        toast.error('Failed to process refund');
        throw _error;
      }
    },
    [loadData]
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  return {
    subscriptions,
    auditLogs,
    metrics,
    loading,
    searchQuery,
    setSearchQuery,
    loadData,
    compSubscription,
    cancelSubscription,
    refundSubscription,
  };
}
