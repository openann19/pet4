/**
 * Billing Screen
 *
 * Mobile billing interface for subscription management
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SubscriptionStatusCard } from '@/components/billing/SubscriptionStatusCard.native';
import { PricingCard } from '@/components/billing/PricingCard';
import { billingClient } from '@petspark/core';
import type { BillingPlan, SubscriptionInfo } from '@petspark/core';
import { colors } from '@/theme/colors';
import { getTypographyStyle } from '@/theme/typography';
import { createLogger } from '@/utils/logger';

const logger = createLogger('BillingScreen');

export function BillingScreen(): React.JSX.Element {
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [_isLoading, setIsLoading] = useState(true);
  const [intervalFilter, _setIntervalFilter] = useState<'month' | 'year'>('month');

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const [plansData, subscriptionData] = await Promise.all([
        billingClient.getPlans(),
        billingClient.getSubscription().catch(() => null),
      ]);
      setPlans(plansData);
      setSubscription(subscriptionData);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to load billing data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageBilling = async (): Promise<void> => {
    try {
      const portal = await billingClient.createBillingPortalSession();
      // In a real app, open the portal URL in a web view
      logger.info('Billing portal session created', { url: portal.url });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to open billing portal', err);
    }
  };

  const filteredPlans = plans.filter((plan) => plan.interval === intervalFilter);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={[getTypographyStyle('h1'), styles.title]}>Billing</Text>

        <SubscriptionStatusCard
          subscription={subscription}
          onManageBilling={() => { void handleManageBilling(); }}
        />

        <View style={styles.plansSection}>
          <Text style={[getTypographyStyle('h2'), styles.sectionTitle]}>Plans</Text>
          {filteredPlans.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              isCurrentPlan={subscription?.planId === plan.id}
              onSelect={() => {
                void (async () => {
                  try {
                    const checkout = await billingClient.createCheckoutSession(plan.id);
                    // In a real app, open checkout URL in a web view
                    logger.info('Checkout session created', { url: checkout.url });
                  } catch (error) {
                    const err = error instanceof Error ? error : new Error(String(error));
                    logger.error('Failed to create checkout session', err);
                  }
                })();
              }}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 24,
  },
  title: {
    color: colors.foreground,
    marginBottom: 8,
  },
  plansSection: {
    gap: 16,
  },
  sectionTitle: {
    color: colors.foreground,
    marginBottom: 8,
  },
});
