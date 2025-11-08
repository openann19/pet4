import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { AnimatedCard } from '../AnimatedCard';

interface Subscription {
  plan: 'free' | 'premium' | 'elite';
  status: 'active' | 'cancelled' | 'past_due' | 'expired';
  nextBillingDate?: string;
  entitlements: string[];
}

interface SubscriptionStatusCardProps {
  subscription: Subscription;
  onManage: () => void;
  onUpgrade?: () => void;
}

const PLAN_COLORS = {
  free: '#6b7280',
  premium: '#3b82f6',
  elite: '#a855f7',
};

const PLAN_NAMES = {
  free: 'Free',
  premium: 'Premium',
  elite: 'Elite',
};

const STATUS_COLORS = {
  active: '#10b981',
  cancelled: '#f59e0b',
  past_due: '#ef4444',
  expired: '#6b7280',
};

const STATUS_LABELS = {
  active: 'Active',
  cancelled: 'Cancelled',
  past_due: 'Payment Issue',
  expired: 'Expired',
};

export const SubscriptionStatusCard: React.FC<SubscriptionStatusCardProps> = ({
  subscription,
  onManage,
  onUpgrade,
}) => {
  const planColor = PLAN_COLORS[subscription.plan];
  const statusColor = STATUS_COLORS[subscription.status];
  const canUpgrade = subscription.plan !== 'elite';

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <AnimatedCard style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.planBadgeContainer}>
          <View style={[styles.planBadge, { backgroundColor: planColor }]}>
            <Text style={styles.planBadgeText}>{PLAN_NAMES[subscription.plan]}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{STATUS_LABELS[subscription.status]}</Text>
          </View>
        </View>

        {subscription.plan !== 'free' && subscription.nextBillingDate && (
          <View style={styles.billingInfo}>
            <Text style={styles.billingLabel}>Next billing</Text>
            <Text style={styles.billingDate}>{formatDate(subscription.nextBillingDate)}</Text>
          </View>
        )}
      </View>

      {/* Entitlements */}
      <View style={styles.entitlementsContainer}>
        <Text style={styles.entitlementsTitle}>Your Benefits</Text>
        <View style={styles.entitlementsList}>
          {subscription.entitlements.map((entitlement, index) => (
            <View key={index} style={styles.entitlementRow}>
              <Text style={styles.entitlementCheckmark}>✓</Text>
              <Text style={styles.entitlementText}>{entitlement}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        {canUpgrade && onUpgrade && (
          <Pressable style={styles.upgradeButton} onPress={onUpgrade}>
            <Text style={styles.upgradeButtonText}>⬆️ Upgrade Plan</Text>
          </Pressable>
        )}
        {subscription.plan !== 'free' && (
          <Pressable
            style={[styles.manageButton, canUpgrade && styles.manageButtonSecondary]}
            onPress={onManage}
          >
            <Text style={[styles.manageButtonText, canUpgrade && styles.manageButtonTextSecondary]}>
              Manage Subscription
            </Text>
          </Pressable>
        )}
      </View>

      {/* Warning for issues */}
      {subscription.status === 'past_due' && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <View style={styles.warningTextContainer}>
            <Text style={styles.warningTitle}>Payment Issue</Text>
            <Text style={styles.warningText}>
              Your payment method needs to be updated to continue your subscription.
            </Text>
          </View>
        </View>
      )}

      {subscription.status === 'cancelled' && (
        <View style={[styles.warningContainer, styles.infoContainer]}>
          <Text style={styles.warningIcon}>ℹ️</Text>
          <View style={styles.warningTextContainer}>
            <Text style={styles.warningTitle}>Subscription Cancelled</Text>
            <Text style={styles.warningText}>
              You'll continue to have access until {formatDate(subscription.nextBillingDate)}.
            </Text>
          </View>
        </View>
      )}
    </AnimatedCard>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    gap: 16,
  },
  header: {
    gap: 12,
  },
  planBadgeContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  planBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  planBadgeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  billingInfo: {
    gap: 2,
  },
  billingLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  billingDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  entitlementsContainer: {
    gap: 12,
  },
  entitlementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  entitlementsList: {
    gap: 10,
  },
  entitlementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  entitlementCheckmark: {
    fontSize: 16,
    color: '#10b981',
  },
  entitlementText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  actionsContainer: {
    gap: 10,
  },
  upgradeButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  manageButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  manageButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  manageButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  manageButtonTextSecondary: {
    color: '#6b7280',
  },
  warningContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  infoContainer: {
    backgroundColor: '#eff6ff',
    borderLeftColor: '#3b82f6',
  },
  warningIcon: {
    fontSize: 20,
  },
  warningTextContainer: {
    flex: 1,
    gap: 4,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  warningText: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
});
