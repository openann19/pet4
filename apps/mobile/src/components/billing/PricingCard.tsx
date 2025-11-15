// apps/mobile/src/components/billing/PricingCard.tsx
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { BillingPlan } from '@petspark/core/billing/billing-types';

export interface PricingCardProps {
    plan: BillingPlan;
    isMostPopular?: boolean;
    isLoading?: boolean;
    onPress?: () => void;
}

export function PricingCard({
    plan,
    isMostPopular,
    isLoading,
    onPress,
}: PricingCardProps): React.JSX.Element {
    const price = (plan.priceCents / 100).toFixed(2);

    return (
        <Pressable
            onPress={onPress}
            disabled={isLoading}
            style={({ pressed }) => [
                {
                    borderRadius: 18,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: isMostPopular ? '#3b82f6' : 'rgba(148,163,184,0.6)',
                    backgroundColor: '#020617',
                    opacity: pressed || isLoading ? 0.7 : 1,
                },
            ]}
        >
            {isMostPopular ? (
                <View
                    style={{
                        alignSelf: 'flex-start',
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 999,
                        backgroundColor: 'rgba(59,130,246,0.16)',
                        marginBottom: 6,
                    }}
                >
                    <Text
                        style={{
                            fontSize: 10,
                            letterSpacing: 1,
                            fontWeight: '600',
                            color: '#bfdbfe',
                            textTransform: 'uppercase',
                        }}
                    >
                        Most popular
                    </Text>
                </View>
            ) : null}

            <Text
                style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#f9fafb',
                }}
            >
                {plan.name}
            </Text>
            <Text
                style={{
                    fontSize: 12,
                    color: '#9ca3af',
                    marginTop: 4,
                }}
            >
                {plan.description}
            </Text>

            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'baseline',
                    marginTop: 10,
                }}
            >
                <Text
                    style={{
                        fontSize: 20,
                        fontWeight: '700',
                        color: '#f9fafb',
                    }}
                >
                    {price}
                </Text>
                <Text
                    style={{
                        marginLeft: 4,
                        fontSize: 12,
                        color: '#9ca3af',
                    }}
                >
                    {plan.currency.toUpperCase()}/{plan.interval}
                </Text>
            </View>

            <View style={{ marginTop: 8 }}>
                {plan.features.slice(0, 3).map((feat) => (
                    <View
                        key={feat}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'flex-start',
                            marginTop: 4,
                        }}
                    >
                        <View
                            style={{
                                width: 6,
                                height: 6,
                                borderRadius: 999,
                                marginTop: 4,
                                marginRight: 6,
                                backgroundColor: '#22c55e',
                            }}
                        />
                        <Text
                            style={{
                                fontSize: 12,
                                color: '#d1d5db',
                            }}
                        >
                            {feat}
                        </Text>
                    </View>
                ))}
            </View>

            <Text
                style={{
                    marginTop: 12,
                    fontSize: 12,
                    fontWeight: '600',
                    color: '#bfdbfe',
                }}
            >
                {isLoading ? 'Opening…' : 'Select plan'}
            </Text>
        </Pressable>
    );
}
