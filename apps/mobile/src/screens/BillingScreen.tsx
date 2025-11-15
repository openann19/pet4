// apps/mobile/src/screens/BillingScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    Text,
    View,
} from 'react-native';
import {
    BillingClient,
    billingClient as sharedBillingClient,
} from '@petspark/core/billing/billing-client';
import type {
    BillingPlan,
    SubscriptionInfo,
} from '@petspark/core/billing/billing-types';
import { PricingCard } from '../components/billing/PricingCard';
import * as Linking from 'expo-linking';

const client: BillingClient = sharedBillingClient;

export function BillingScreen(): React.JSX.Element {
    const [plans, setPlans] = useState<BillingPlan[]>([]);
    const [subscription, setSubscription] = useState<SubscriptionInfo | null>(
        null,
    );
    const [loadingPlans, setLoadingPlans] = useState(true);
    const [checkoutLoadingPlanId, setCheckoutLoadingPlanId] = useState<
        string | null
    >(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const abortController = new AbortController();

        async function load() {
            try {
                setLoadingPlans(true);
                setError(null);
                const [plansData, subData] = await Promise.all([
                    client.getPlans(abortController.signal),
                    client.getSubscription(abortController.signal),
                ]);
                setPlans(plansData);
                setSubscription(subData);
            } catch (err) {
                const e = err as Error;
                setError(e.message);
            } finally {
                setLoadingPlans(false);
            }
        }

        void load();

        return () => {
            abortController.abort();
        };
    }, []);

    const mostPopularId = useMemo(
        () => plans.find((p) => p.isMostPopular)?.id ?? null,
        [plans],
    );

    const handleCheckout = async (planId: string) => {
        try {
            setCheckoutLoadingPlanId(planId);
            setError(null);
            const { checkoutUrl } = await client.createCheckoutSession(
                planId,
                Linking.createURL('/billing-return'),
            );
            const supported = await Linking.canOpenURL(checkoutUrl);
            if (supported) {
                await Linking.openURL(checkoutUrl);
            } else {
                throw new Error('Cannot open checkout URL');
            }
        } catch (err) {
            const e = err as Error;
            setError(e.message);
            Alert.alert('Billing error', e.message);
        } finally {
            setCheckoutLoadingPlanId(null);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#020617' }}>
            <ScrollView
                contentContainerStyle={{
                    paddingHorizontal: 16,
                    paddingVertical: 20,
                }}
            >
                <View style={{ marginBottom: 16 }}>
                    <Text
                        style={{
                            fontSize: 22,
                            fontWeight: '700',
                            color: '#f9fafb',
                        }}
                    >
                        PETSPARK Premium
                    </Text>
                    <Text
                        style={{
                            fontSize: 13,
                            color: '#9ca3af',
                            marginTop: 4,
                        }}
                    >
                        Unlock enhanced matching, video calls, and exclusive features for
                        you and your pets.
                    </Text>
                    {subscription ? (
                        <Text
                            style={{
                                marginTop: 6,
                                fontSize: 12,
                                color: '#e5e7eb',
                            }}
                        >
                            Current plan: {subscription.tier.toUpperCase()} (
                            {subscription.status})
                        </Text>
                    ) : null}
                </View>

                {loadingPlans ? (
                    <View
                        style={{
                            marginTop: 24,
                            alignItems: 'center',
                        }}
                    >
                        <ActivityIndicator color="#3b82f6" />
                        <Text
                            style={{
                                marginTop: 8,
                                fontSize: 12,
                                color: '#9ca3af',
                            }}
                        >
                            Loading plans…
                        </Text>
                    </View>
                ) : (
                    <View style={{ gap: 12 }}>
                        {plans.map((plan) => (
                            <PricingCard
                                key={plan.id}
                                plan={plan}
                                isMostPopular={plan.id === mostPopularId}
                                isLoading={checkoutLoadingPlanId === plan.id}
                                onPress={() => {
                                    void handleCheckout(plan.id);
                                }}
                            />
                        ))}
                    </View>
                )}

                {error ? (
                    <Text
                        style={{
                            marginTop: 12,
                            fontSize: 12,
                            color: '#ef4444',
                        }}
                    >
                        {error}
                    </Text>
                ) : null}
            </ScrollView>
        </SafeAreaView>
    );
}
