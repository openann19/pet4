import React from 'react'
import { View, Text, StyleSheet, Pressable, type ViewStyle } from 'react-native'
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { PremiumCard } from '@/components/enhanced/PremiumCard'
import { PremiumButton } from '@/components/enhanced/PremiumButton'
import { useTheme } from '@/hooks/use-theme'
import { springConfigs } from '@/effects/reanimated/transitions'
import { createLogger } from '@/utils/logger'

const logger = createLogger('SubscriptionStatusCard')

const AnimatedView = Animated.View

export interface Subscription {
    plan: 'free' | 'premium' | 'elite'
    status: 'active' | 'cancelled' | 'past_due' | 'expired'
    nextBillingDate?: string
    entitlements: string[]
    purchaseDate?: string
    billingPeriod?: 'monthly' | 'yearly'
}

export interface SubscriptionStatusCardProps {
    subscription: Subscription
    onManage: () => void
    onUpgrade?: () => void
}

const PLAN_COLORS: Record<string, string> = {
    free: '#6b7280',
    premium: '#3b82f6',
    elite: '#a855f7',
}

const PLAN_NAMES: Record<string, string> = {
    free: 'Free',
    premium: 'Premium',
    elite: 'Elite',
}

const STATUS_COLORS: Record<string, string> = {
    active: '#10b981',
    cancelled: '#f59e0b',
    past_due: '#ef4444',
    expired: '#6b7280',
}

const STATUS_LABELS: Record<string, string> = {
    active: 'Active',
    cancelled: 'Cancelled',
    past_due: 'Payment Issue',
    expired: 'Expired',
}

export const SubscriptionStatusCard: React.FC<SubscriptionStatusCardProps> = ({
    subscription,
    onManage,
    onUpgrade,
}) => {
    const { theme } = useTheme()
    const planColor = PLAN_COLORS[subscription.plan] ?? '#6b7280'
    const statusColor = STATUS_COLORS[subscription.status] ?? '#6b7280'
    const canUpgrade = subscription.plan !== 'elite'
    const scale = useSharedValue(1)

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }))

    const handlePressIn = () => {
        scale.value = withSpring(0.98, springConfigs.smooth)
    }

    const handlePressOut = () => {
        scale.value = withSpring(1, springConfigs.smooth)
    }

    const handleManage = () => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        onManage()
    }

    const handleUpgrade = () => {
        if (onUpgrade) {
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
            onUpgrade()
        }
    }

    const formatDate = (dateString?: string): string => {
        if (!dateString) return 'N/A'
        try {
            const date = new Date(dateString)
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            })
        } catch {
            return 'N/A'
        }
    }

    return (
        <AnimatedView style={animatedStyle}>
            <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                accessible
                accessibilityRole="button"
                accessibilityLabel={`${PLAN_NAMES[subscription.plan] ?? 'Unknown'} plan, ${STATUS_LABELS[subscription.status] ?? 'Unknown'} status`}
            >
                <PremiumCard variant="elevated" style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.planBadgeContainer}>
                            <View style={[styles.planBadge, { backgroundColor: planColor }]}>
                                <Text style={styles.planBadgeText}>
                                    {PLAN_NAMES[subscription.plan] ?? 'Unknown'}
                                </Text>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                                <Text style={styles.statusText}>
                                    {STATUS_LABELS[subscription.status] ?? 'Unknown'}
                                </Text>
                            </View>
                        </View>

                        {subscription.plan !== 'free' && subscription.nextBillingDate && (
                            <View style={styles.billingInfo}>
                                <Text style={[styles.billingLabel, { color: theme.colors.textSecondary }]}>
                                    Next billing
                                </Text>
                                <Text style={[styles.billingDate, { color: theme.colors.textPrimary }]}>
                                    {formatDate(subscription.nextBillingDate)}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Entitlements */}
                    <View style={styles.entitlementsContainer}>
                        <Text style={[styles.entitlementsTitle, { color: theme.colors.textSecondary }]}>
                            Your Benefits
                        </Text>
                        <View style={styles.entitlementsList}>
                            {subscription.entitlements.map((entitlement, index) => (
                                <View key={index} style={styles.entitlementRow}>
                                    <Text style={[styles.entitlementCheckmark, { color: theme.colors.success }]}>
                                        ✓
                                    </Text>
                                    <Text style={[styles.entitlementText, { color: theme.colors.textPrimary }]}>
                                        {entitlement}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Actions */}
                    <View style={styles.actionsContainer}>
                        {canUpgrade && onUpgrade && (
                            <PremiumButton variant="primary" size="md" onPress={handleUpgrade}>
                                ⬆️ Upgrade Plan
                            </PremiumButton>
                        )}
                        {subscription.plan !== 'free' && (
                            <PremiumButton
                                variant={canUpgrade ? 'secondary' : 'primary'}
                                size="md"
                                onPress={handleManage}
                                style={styles.manageButton}
                            >
                                Manage Subscription
                            </PremiumButton>
                        )}
                    </View>

                    {/* Warning for issues */}
                    {subscription.status === 'past_due' && (
                        <View
                            style={[
                                styles.warningContainer,
                                {
                                    backgroundColor: theme.colors.danger + '20',
                                    borderLeftColor: theme.colors.danger,
                                },
                            ]}
                        >
                            <Text style={styles.warningIcon}>⚠️</Text>
                            <View style={styles.warningTextContainer}>
                                <Text style={[styles.warningTitle, { color: theme.colors.textPrimary }]}>
                                    Payment Issue
                                </Text>
                                <Text style={[styles.warningText, { color: theme.colors.textSecondary }]}>
                                    Your payment method needs to be updated to continue your subscription.
                                </Text>
                            </View>
                        </View>
                    )}

                    {subscription.status === 'cancelled' && (
                        <View
                            style={[
                                styles.warningContainer,
                                styles.infoContainer,
                                {
                                    backgroundColor: theme.colors.info + '20',
                                    borderLeftColor: theme.colors.info,
                                },
                            ]}
                        >
                            <Text style={styles.warningIcon}>ℹ️</Text>
                            <View style={styles.warningTextContainer}>
                                <Text style={[styles.warningTitle, { color: theme.colors.textPrimary }]}>
                                    Subscription Cancelled
                                </Text>
                                <Text style={[styles.warningText, { color: theme.colors.textSecondary }]}>
                                    You'll continue to have access until {formatDate(subscription.nextBillingDate)}.
                                </Text>
                            </View>
                        </View>
                    )}
                </PremiumCard>
            </Pressable>
        </AnimatedView>
    )
}

const styles = StyleSheet.create({
    container: {
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
    },
    billingDate: {
        fontSize: 16,
        fontWeight: '600',
    },
    entitlementsContainer: {
        gap: 12,
    },
    entitlementsTitle: {
        fontSize: 14,
        fontWeight: '600',
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
    },
    entitlementText: {
        fontSize: 14,
        flex: 1,
    },
    actionsContainer: {
        gap: 10,
    },
    manageButton: {
        width: '100%',
    },
    warningContainer: {
        flexDirection: 'row',
        gap: 12,
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
    },
    infoContainer: {
        // Styles applied via inline styles
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
    },
    warningText: {
        fontSize: 13,
        lineHeight: 18,
    },
})
