/**
 * Subscription Status Card (Mobile)
 *
 * Mobile subscription status display
 */

import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import type { SubscriptionInfo } from '@petspark/core';
import { format } from 'date-fns';
import { colors } from '@/theme/colors';
import { getTypographyStyle } from '@/theme/typography';

export interface SubscriptionStatusCardProps {
  subscription: SubscriptionInfo | null;
  onManageBilling?: () => void;
  onUpgrade?: () => void;
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return format(date, 'PPP');
}

export function SubscriptionStatusCard({
  subscription,
  onManageBilling,
  onUpgrade,
}: SubscriptionStatusCardProps): React.JSX.Element {
  const tierLabel = subscription?.tier
    ? subscription.tier.toUpperCase()
    : 'FREE';

  const statusLabel = subscription?.status
    ? subscription.status.replace('_', ' ')
    : 'none';

  const renewLabel =
    subscription?.cancelAtPeriodEnd === true
      ? 'Cancels at end of period'
      : 'Renews automatically';

  const nextBillingDate = formatDate(subscription?.currentPeriodEnd ?? null);

  const amount =
    subscription?.priceCents != null && subscription.currency
      ? `${(subscription.priceCents / 100).toFixed(2)} ${subscription.currency.toUpperCase()}`
      : null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={[getTypographyStyle('h3'), styles.title]}>
            Subscription
          </Text>
          <View style={styles.badge}>
            <Text style={[getTypographyStyle('caption'), styles.badgeText]}>
              {tierLabel}
            </Text>
          </View>
        </View>
        {amount && (
          <View style={styles.amountContainer}>
            <Text style={[getTypographyStyle('caption'), styles.amountLabel]}>
              Current plan
            </Text>
            <Text style={[getTypographyStyle('body'), styles.amount]}>
              {amount}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.statusContainer}>
        <Text style={[getTypographyStyle('bodyMuted'), styles.status]}>
          Status: <Text style={styles.statusValue}>{statusLabel}</Text>
        </Text>
      </View>

      <View style={styles.detailsContainer}>
        {nextBillingDate ? (
          <Text style={[getTypographyStyle('bodyMuted'), styles.detail]}>
            Next billing: <Text style={styles.detailValue}>{nextBillingDate}</Text>
          </Text>
        ) : (
          <Text style={[getTypographyStyle('bodyMuted'), styles.detail]}>
            No upcoming billing date.
          </Text>
        )}
        <Text style={[getTypographyStyle('bodyMuted'), styles.detail]}>
          {renewLabel}
        </Text>
      </View>

      <View style={styles.actions}>
        {onManageBilling && (
          <TouchableOpacity
            style={styles.button}
            onPress={onManageBilling}
            accessibilityLabel="Manage billing"
            accessibilityRole="button"
          >
            <Text style={[getTypographyStyle('body'), styles.buttonText]}>
              Manage billing
            </Text>
          </TouchableOpacity>
        )}
        {onUpgrade && (
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={onUpgrade}
            accessibilityLabel="View plans"
            accessibilityRole="button"
          >
            <Text style={[getTypographyStyle('body'), styles.buttonTextSecondary]}>
              View plans
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
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
  amountContainer: {
    alignItems: 'flex-end',
  },
  amountLabel: {
    color: colors.mutedForeground,
    marginBottom: 4,
  },
  amount: {
    color: colors.foreground,
    fontWeight: '600',
  },
  statusContainer: {
    marginBottom: 12,
  },
  status: {
    color: colors.mutedForeground,
  },
  statusValue: {
    color: colors.foreground,
    textTransform: 'capitalize',
  },
  detailsContainer: {
    gap: 4,
    marginBottom: 16,
  },
  detail: {
    color: colors.mutedForeground,
  },
  detailValue: {
    color: colors.foreground,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonText: {
    color: colors.primaryForeground,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: colors.foreground,
    fontWeight: '600',
  },
});

