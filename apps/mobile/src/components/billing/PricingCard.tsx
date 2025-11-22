/**
 * Pricing Card (Mobile)
 *
 * Mobile plan card component
 */

import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';
import type { BillingPlan } from '@petspark/core';
import { colors } from '@/theme/colors';
import { getTypographyStyle } from '@/theme/typography';

export interface PricingCardProps {
  plan: BillingPlan;
  isCurrentPlan?: boolean;
  onSelect: () => void;
}

export function PricingCard({
  plan,
  isCurrentPlan = false,
  onSelect,
}: PricingCardProps): React.JSX.Element {
  const price = plan.priceCents
    ? `$${(plan.priceCents / 100).toFixed(2)}`
    : 'Free';
  const interval = plan.interval === 'month' ? '/month' : '/year';

  return (
    <TouchableOpacity
      onPress={onSelect}
      disabled={isCurrentPlan}
      style={styles.container}
    >
      <View style={[styles.card, isCurrentPlan && styles.cardCurrent]}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={[getTypographyStyle('h3'), styles.title]}>
              {plan.name}
            </Text>
            {isCurrentPlan && (
              <View style={styles.badge}>
                <Text style={[getTypographyStyle('caption'), styles.badgeText]}>
                  Current
                </Text>
              </View>
            )}
          </View>
          <View style={styles.priceContainer}>
            <Text style={[getTypographyStyle('h2'), styles.price]}>
              {price}
            </Text>
            <Text style={[getTypographyStyle('caption'), styles.interval]}>
              {interval}
            </Text>
          </View>
        </View>

        {plan.description && (
          <Text style={[getTypographyStyle('bodyMuted'), styles.description]}>
            {plan.description}
          </Text>
        )}

        {plan.perks && plan.perks.length > 0 && (
          <View style={styles.features}>
            {plan.perks.map((perk: BillingPlan['perks'][number], index: number) => (
              <View key={perk.id || index} style={styles.feature}>
                <Check size={16} color={colors.primary} />
                <Text style={[getTypographyStyle('body'), styles.featureText]}>
                  {perk.label}
                </Text>
              </View>
            ))}
          </View>
        )}

        {!isCurrentPlan && (
          <TouchableOpacity
            style={styles.button}
            onPress={onSelect}
            accessibilityLabel={`Select ${plan.name} plan`}
            accessibilityRole="button"
          >
            <Text style={[getTypographyStyle('body'), styles.buttonText]}>
              Select Plan
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardCurrent: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: colors.foreground,
  },
  badge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: colors.primaryForeground,
    fontSize: 10,
    fontWeight: '600',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    color: colors.foreground,
  },
  interval: {
    color: colors.mutedForeground,
  },
  description: {
    color: colors.mutedForeground,
    marginBottom: 16,
  },
  features: {
    gap: 12,
    marginBottom: 16,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    color: colors.foreground,
    flex: 1,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.primaryForeground,
    fontWeight: '600',
  },
});
