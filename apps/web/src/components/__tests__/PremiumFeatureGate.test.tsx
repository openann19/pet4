// apps/web/src/components/billing/__tests__/PremiumFeatureGate.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { PremiumFeatureGate } from '../PremiumFeatureGate';
import { SubscriptionProvider } from '../SubscriptionProvider';
import type { SubscriptionInfo } from '@petspark/core/billing/billing-types';

function renderWithSubscription(
    subscription: SubscriptionInfo | null,
    ui: React.ReactElement,
) {
    const value = {
        subscription,
        isLoading: false,
        error: null,
        refresh: () => { },
        hasActiveSubscription:
            subscription?.status === 'active' ||
            subscription?.status === 'trialing',
        tier: subscription?.tier ?? 'free',
        status: subscription?.status ?? 'none',
    };

    const MockCtx = React.createContext(value);
    const MockProvider = ({ children }: { children: React.ReactNode }) => (
        <MockCtx.Provider value={value}>{children}</MockCtx.Provider>
    );

    jest
        .spyOn(require('../SubscriptionProvider'), 'useSubscription')
        .mockImplementation(() => value);

    return render(<MockProvider>{ui}</MockProvider>);
}

describe('PremiumFeatureGate', () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    it('renders children when subscription is sufficient', () => {
        const subscription: SubscriptionInfo = {
            id: 'sub_1',
            tier: 'pro',
            status: 'active',
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
            trialEndsAt: null,
            planId: 'plan_1',
            currency: 'usd',
            priceCents: 999,
        };

        renderWithSubscription(
            subscription,
            <PremiumFeatureGate requiredTier="plus">
                <div>secret content</div>
            </PremiumFeatureGate>,
        );

        expect(screen.getByText('secret content')).toBeInTheDocument();
    });

    it('shows upgrade UI when subscription is insufficient', () => {
        const subscription: SubscriptionInfo = {
            id: 'sub_2',
            tier: 'free',
            status: 'none',
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
            trialEndsAt: null,
            planId: null,
            currency: null,
            priceCents: null,
        };

        renderWithSubscription(
            subscription,
            <PremiumFeatureGate requiredTier="plus">
                <div>secret content</div>
            </PremiumFeatureGate>,
        );

        expect(
            screen.queryByText('secret content'),
        ).not.toBeInTheDocument();
        expect(
            screen.getByText(/Upgrade to unlock this feature/i),
        ).toBeInTheDocument();
    });
});
