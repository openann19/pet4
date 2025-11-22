/**
 * Billing Admin View
 *
 * Admin view for subscription management
 */

'use client';

import { SubscriptionAdminPanel } from '@/components/payments/SubscriptionAdminPanel';
import { PageTransitionWrapper } from '@/components/ui/page-transition-wrapper';
import { getTypographyClasses } from '@/lib/typography';
import { PremiumCard } from '@/components/enhanced/PremiumCard';

export function BillingAdminView(): React.JSX.Element {
  return (
    <PageTransitionWrapper>
      <div className="container mx-auto p-6 space-y-6">
        <PremiumCard variant="glass" className="p-6">
          <h1 className={getTypographyClasses('h1')}>Subscription Management</h1>
          <p className={getTypographyClasses('bodyMuted')}>
            Manage user subscriptions, view billing status, and handle payment issues.
          </p>
        </PremiumCard>

        <SubscriptionAdminPanel />
      </div>
    </PageTransitionWrapper>
  );
}

