import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    interpolate,
    Extrapolation,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { PremiumButton } from '@/components/enhanced/PremiumButton'
import { useTheme } from '@/hooks/use-theme'
import { createLogger } from '@/utils/logger'

const logger = createLogger('BillingIssueBanner')

const AnimatedView = Animated.View

export interface BillingIssue {
    type: 'payment_failed' | 'card_expired' | 'insufficient_funds'
    gracePeriodEnd: string
    message?: string
}

export interface BillingIssueBannerProps {
    issue: BillingIssue
    onUpdatePayment: () => void
    onDismiss: () => void
}

const ISSUE_MESSAGES: Record<string, string> = {
    payment_failed: 'Your payment failed. Please update your payment method.',
    card_expired: 'Your card has expired. Please add a new payment method.',
    insufficient_funds: 'Insufficient funds. Please update your payment method.',
}

export const BillingIssueBanner: React.FC<BillingIssueBannerProps> = ({
    issue,
    onUpdatePayment,
    onDismiss,
}) => {
    const { theme } = useTheme()
    const [timeRemaining, setTimeRemaining] = useState<string>('')
    const pulseAnimation = useSharedValue(1)

    useEffect(() => {
        // Pulse animation for urgency
        pulseAnimation.value = withRepeat(
            withTiming(1.05, { duration: 1000 }),
            -1,
            true
        )
    }, [pulseAnimation])

    useEffect(() => {
        const calculateTimeRemaining = (): void => {
            try {
                const now = new Date().getTime()
                const end = new Date(issue.gracePeriodEnd).getTime()
                const diff = end - now

                if (diff <= 0) {
                    setTimeRemaining('Expired')
                    return
                }

                const days = Math.floor(diff / (1000 * 60 * 60 * 24))
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

                if (days > 0) {
                    setTimeRemaining(`${days} day${days > 1 ? 's' : ''} left`)
                } else if (hours > 0) {
                    setTimeRemaining(`${hours} hour${hours > 1 ? 's' : ''} left`)
                } else {
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
                    setTimeRemaining(`${minutes} minute${minutes > 1 ? 's' : ''} left`)
                }
            } catch (error) {
                const err = error instanceof Error ? error : new Error(String(error))
                logger.error('Failed to calculate time remaining', err)
                setTimeRemaining('Unknown')
            }
        }

        calculateTimeRemaining()
        const interval = setInterval(calculateTimeRemaining, 60000) // Update every minute

        return () => {
            clearInterval(interval)
        }
    }, [issue.gracePeriodEnd])

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            {
                scale: interpolate(
                    pulseAnimation.value,
                    [1, 1.05],
                    [1, 1.02],
                    Extrapolation.CLAMP
                ),
            },
        ],
    }))

    const getMessage = useCallback((): string => {
        return issue.message ?? ISSUE_MESSAGES[issue.type] ?? 'Payment issue detected.'
    }, [issue])

    const handleUpdatePayment = useCallback(() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        onUpdatePayment()
    }, [onUpdatePayment])

    const handleDismiss = useCallback(() => {
        void Haptics.selectionAsync()
        onDismiss()
    }, [onDismiss])

    return (
        <AnimatedView
            style={[
                styles.container,
                animatedStyle,
                {
                    backgroundColor: theme.colors.danger + '20',
                    borderColor: theme.colors.danger + '40',
                },
            ]}
            accessible
            accessibilityRole="alert"
            accessibilityLabel={`Payment issue: ${getMessage()}. ${timeRemaining} remaining.`}
        >
            <View style={styles.content}>
                {/* Warning Icon */}
                <View
                    style={[
                        styles.iconContainer,
                        { backgroundColor: theme.colors.danger + '30' },
                    ]}
                >
                    <Text style={styles.icon}>⚠️</Text>
                </View>

                {/* Message Content */}
                <View style={styles.messageContainer}>
                    <Text style={[styles.title, { color: theme.colors.danger }]}>
                        Payment Issue
                    </Text>
                    <Text style={[styles.message, { color: theme.colors.textPrimary }]}>
                        {getMessage()}
                    </Text>

                    {/* Countdown Timer */}
                    <View
                        style={[
                            styles.timerContainer,
                            { backgroundColor: theme.colors.danger + '20' },
                        ]}
                    >
                        <Text style={styles.timerIcon}>⏱️</Text>
                        <Text style={[styles.timerText, { color: theme.colors.textPrimary }]}>
                            Grace period:{' '}
                            <Text style={[styles.timerValue, { color: theme.colors.danger }]}>
                                {timeRemaining}
                            </Text>
                        </Text>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionsContainer}>
                        <PremiumButton
                            variant="primary"
                            size="sm"
                            onPress={handleUpdatePayment}
                            style={styles.updateButton}
                        >
                            Update Payment
                        </PremiumButton>
                        <Pressable
                            style={[
                                styles.dismissButton,
                                { borderColor: theme.colors.danger + '60' },
                            ]}
                            onPress={handleDismiss}
                            accessibilityRole="button"
                            accessibilityLabel="Dismiss payment issue banner"
                        >
                            <Text style={[styles.dismissButtonText, { color: theme.colors.danger }]}>
                                Dismiss
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </AnimatedView>
    )
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
        borderWidth: 2,
        overflow: 'hidden',
        marginHorizontal: 16,
        marginVertical: 8,
    },
    content: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    icon: {
        fontSize: 24,
    },
    messageContainer: {
        flex: 1,
        gap: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    message: {
        fontSize: 14,
        lineHeight: 20,
    },
    timerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    timerIcon: {
        fontSize: 14,
    },
    timerText: {
        fontSize: 13,
    },
    timerValue: {
        fontWeight: 'bold',
    },
    actionsContainer: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
    },
    updateButton: {
        flex: 1,
    },
    dismissButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
    },
    dismissButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
})
