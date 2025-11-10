import React, { useState, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, type ViewStyle } from 'react-native'
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

const logger = createLogger('PaymentMethodSelector')

const AnimatedView = Animated.View

interface PaymentMethodItemProps {
    method: PaymentMethod
    isSelected: boolean
    onSelect: (methodId: string) => void
    onSetDefault?: (methodId: string) => void
    onRemove?: (methodId: string) => void
    getMethodIcon: (type: PaymentMethod['type']) => string
    getMethodLabel: (method: PaymentMethod) => string
    theme: ReturnType<typeof useTheme>['theme']
}

const PaymentMethodItem: React.FC<PaymentMethodItemProps> = ({
    method,
    isSelected,
    onSelect,
    onSetDefault,
    onRemove,
    getMethodIcon,
    getMethodLabel,
    theme,
}) => {
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

    const cardStyle: ViewStyle = isSelected
        ? {
            ...styles.paymentMethodCard,
            ...styles.paymentMethodCardSelected,
            borderColor: theme.colors.primary,
        }
        : styles.paymentMethodCard

    return (
        <Pressable
            onPress={() => onSelect(method.id)}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            accessible
            accessibilityRole="button"
            accessibilityLabel={`${getMethodLabel(method)}${method.isDefault ? ', default payment method' : ''}`}
            accessibilityState={{ selected: isSelected }}
        >
            <AnimatedView style={animatedStyle}>
                <PremiumCard variant={isSelected ? 'elevated' : 'default'} style={cardStyle}>
                    <View style={styles.paymentMethodContent}>
                        <View style={styles.paymentMethodInfo}>
                            <Text style={styles.paymentMethodIcon}>{getMethodIcon(method.type)}</Text>
                            <View style={styles.paymentMethodDetails}>
                                <Text style={[styles.paymentMethodLabel, { color: theme.colors.textPrimary }]}>
                                    {getMethodLabel(method)}
                                </Text>
                                {method.expiryMonth && method.expiryYear && (
                                    <Text
                                        style={[
                                            styles.paymentMethodExpiry,
                                            { color: theme.colors.textSecondary },
                                        ]}
                                    >
                                        Expires {method.expiryMonth}/{method.expiryYear}
                                    </Text>
                                )}
                            </View>
                        </View>

                        <View style={styles.paymentMethodActions}>
                            {method.isDefault && (
                                <View
                                    style={[
                                        styles.defaultBadge,
                                        { backgroundColor: theme.colors.success },
                                    ]}
                                >
                                    <Text style={styles.defaultBadgeText}>Default</Text>
                                </View>
                            )}
                            {!method.isDefault && onSetDefault && (
                                <Pressable
                                    onPress={() => onSetDefault(method.id)}
                                    style={styles.setDefaultButton}
                                    accessibilityRole="button"
                                    accessibilityLabel="Set as default payment method"
                                >
                                    <Text
                                        style={[
                                            styles.setDefaultButtonText,
                                            { color: theme.colors.primary },
                                        ]}
                                    >
                                        Set Default
                                    </Text>
                                </Pressable>
                            )}
                            {onRemove && (
                                <Pressable
                                    onPress={() => onRemove(method.id)}
                                    style={styles.removeButton}
                                    accessibilityRole="button"
                                    accessibilityLabel="Remove payment method"
                                >
                                    <Text
                                        style={[styles.removeButtonText, { color: theme.colors.danger }]}
                                    >
                                        Remove
                                    </Text>
                                </Pressable>
                            )}
                        </View>
                    </View>

                    {isSelected && (
                        <View
                            style={[
                                styles.selectedIndicator,
                                { backgroundColor: theme.colors.primary },
                            ]}
                        >
                            <Text style={styles.selectedIndicatorText}>✓ Selected</Text>
                        </View>
                    )}
                </PremiumCard>
            </AnimatedView>
        </Pressable>
    )
}

export interface PaymentMethod {
    id: string
    type: 'card' | 'apple_pay' | 'google_pay' | 'paypal'
    last4?: string
    brand?: string
    expiryMonth?: number
    expiryYear?: number
    isDefault: boolean
    label: string
}

export interface PaymentMethodSelectorProps {
    paymentMethods: PaymentMethod[]
    selectedMethodId?: string
    onSelectMethod: (methodId: string) => void
    onAddMethod: () => void
    onRemoveMethod?: (methodId: string) => void
    onSetDefault?: (methodId: string) => void
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
    paymentMethods,
    selectedMethodId,
    onSelectMethod,
    onAddMethod,
    onRemoveMethod,
    onSetDefault,
}) => {
    const { theme } = useTheme()

    const handleSelectMethod = useCallback(
        (methodId: string) => {
            void Haptics.selectionAsync()
            onSelectMethod(methodId)
        },
        [onSelectMethod]
    )

    const handleAddMethod = useCallback(() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        onAddMethod()
    }, [onAddMethod])

    const handleRemoveMethod = useCallback(
        (methodId: string) => {
            if (onRemoveMethod) {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                onRemoveMethod(methodId)
            }
        },
        [onRemoveMethod]
    )

    const handleSetDefault = useCallback(
        (methodId: string) => {
            if (onSetDefault) {
                void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
                onSetDefault(methodId)
            }
        },
        [onSetDefault]
    )

    const getMethodIcon = useCallback((type: PaymentMethod['type']): string => {
        switch (type) {
            case 'card':
                return '💳'
            case 'apple_pay':
                return '🍎'
            case 'google_pay':
                return '📱'
            case 'paypal':
                return '🔵'
            default:
                return '💳'
        }
    }, [])

    const getMethodLabel = useCallback((method: PaymentMethod): string => {
        if (method.type === 'card' && method.last4) {
            return `${method.brand ?? 'Card'} •••• ${method.last4}`
        }
        return method.label
    }, [])

    const renderPaymentMethod = (method: PaymentMethod) => {
        const itemProps: PaymentMethodItemProps = {
            method,
            isSelected: selectedMethodId === method.id,
            onSelect: handleSelectMethod,
            getMethodIcon,
            getMethodLabel,
            theme,
        }

        if (onSetDefault) {
            itemProps.onSetDefault = handleSetDefault
        }

        if (onRemoveMethod) {
            itemProps.onRemove = handleRemoveMethod
        }

        return <PaymentMethodItem key={method.id} {...itemProps} />
    }

    return (
        <View style={styles.container} accessible accessibilityLabel="Payment methods">
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollViewContent}
                showsVerticalScrollIndicator={false}
            >
                {paymentMethods.length > 0 ? (
                    paymentMethods.map((method) => renderPaymentMethod(method))
                ) : (
                    <View style={styles.emptyState}>
                        <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
                            No payment methods added yet.
                        </Text>
                    </View>
                )}

                <PremiumButton
                    variant="secondary"
                    size="md"
                    onPress={handleAddMethod}
                    style={styles.addButton}
                >
                    + Add Payment Method
                </PremiumButton>
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollViewContent: {
        padding: 16,
        gap: 12,
    },
    paymentMethodCard: {
        position: 'relative',
    },
    paymentMethodCardSelected: {
        borderWidth: 2,
    },
    paymentMethodContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
    },
    paymentMethodInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    paymentMethodIcon: {
        fontSize: 32,
    },
    paymentMethodDetails: {
        flex: 1,
        gap: 4,
    },
    paymentMethodLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
    paymentMethodExpiry: {
        fontSize: 12,
    },
    paymentMethodActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    defaultBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    defaultBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#ffffff',
    },
    setDefaultButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    setDefaultButtonText: {
        fontSize: 12,
        fontWeight: '600',
    },
    removeButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    removeButtonText: {
        fontSize: 12,
        fontWeight: '600',
    },
    selectedIndicator: {
        marginTop: 12,
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
    },
    selectedIndicatorText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ffffff',
    },
    emptyState: {
        padding: 32,
        alignItems: 'center',
    },
    emptyStateText: {
        fontSize: 14,
        textAlign: 'center',
    },
    addButton: {
        marginTop: 8,
    },
})
