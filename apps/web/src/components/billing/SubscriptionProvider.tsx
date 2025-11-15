// apps/web/src/components/billing/SubscriptionProvider.tsx
'use client';

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';
import {
    billingClient,
} from '@petspark/core/billing/billing-client';
import type {
    SubscriptionInfo,
    SubscriptionStatus,
    SubscriptionTier,
} from '@petspark/core/billing/billing-types';
import { createLogger } from '@/lib/logger';

const logger = createLogger('SubscriptionProvider');

interface SubscriptionContextValue {
    subscription: SubscriptionInfo | null | undefined;
    isLoading: boolean;
    error: string | null;
    refresh: () => void;
    hasActiveSubscription: boolean;
    tier: SubscriptionTier;
    status: SubscriptionStatus;
}

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(
    undefined,
);

export function SubscriptionProvider({
    children,
}: {
    children: ReactNode;
}): React.JSX.Element {
    const [subscription, setSubscription] = useState<SubscriptionInfo | null>();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshToken, setRefreshToken] = useState(0);

    const refresh = useCallback(() => {
        setRefreshToken((prev) => prev + 1);
    }, []);

    useEffect(() => {
        const abortController = new AbortController();

        async function load() {
            try {
                setIsLoading(true);
                setError(null);
                const data = await billingClient.getSubscription(
                    abortController.signal,
                );
                setSubscription(data);
            } catch (err) {
                const e = err as Error;
                logger.error('Failed to load subscription', e);
                setError(e.message);
            } finally {
                setIsLoading(false);
            }
        }

        void load();

        return () => {
            abortController.abort();
        };
    }, [refreshToken]);

    const value = useMemo<SubscriptionContextValue>(() => {
        const effectiveTier: SubscriptionTier =
            subscription?.tier ?? 'free';
        const effectiveStatus: SubscriptionStatus =
            subscription?.status ?? 'none';
        const hasActiveSubscription =
            effectiveStatus === 'active' || effectiveStatus === 'trialing';

        return {
            subscription,
            isLoading,
            error,
            refresh,
            hasActiveSubscription,
            tier: effectiveTier,
            status: effectiveStatus,
        };
    }, [subscription, isLoading, error, refresh]);

    return (
        <SubscriptionContext.Provider value={value}>
            {children}
        </SubscriptionContext.Provider>
    );
}

export function useSubscription(): SubscriptionContextValue {
    const ctx = useContext(SubscriptionContext);
    if (!ctx) {
        throw new Error(
            'useSubscription must be used within a SubscriptionProvider',
        );
    }
    return ctx;
}
