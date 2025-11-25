/**
 * Mobile Button Component
 * React Native equivalent of web Button with feature parity
 * Includes haptics, proper touch targets, and accessibility
 */

import React, { useCallback, useMemo } from 'react'
import {
    TouchableOpacity,
    Text,
    View,
    StyleSheet,
    type ViewStyle,
    type TextStyle,
    type TouchableOpacityProps,
} from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics'
// Simple logger for mobile components
const createLogger = (context: string): { info: (message: string, data?: unknown) => void; error: (message: string, error?: unknown) => void; warn: (message: string, data?: unknown) => void; debug: (message: string, data?: unknown) => void } => ({
    info: (message: string, data?: unknown) => {
        console.warn(`[${context}] INFO: ${message}`, data)
    },
    error: (message: string, error?: unknown) => {
        console.error(`[${context}] ERROR: ${message}`, error)
    },
    warn: (message: string, data?: unknown) => {
        console.warn(`[${context}] WARN: ${message}`, data)
    },
    debug: (message: string, data?: unknown) => {
        console.warn(`[${context}] DEBUG: ${message}`, data)
    },
})

const logger = createLogger('MobileButton')

// Button variants matching web component
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link'
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'icon'

export interface MobileButtonProps extends Omit<TouchableOpacityProps, 'style' | 'disabled'> {
    // Variants
    readonly variant?: ButtonVariant
    readonly size?: ButtonSize

    // States
    readonly loading?: boolean
    readonly disabled?: boolean

    // Content
    readonly children?: React.ReactNode
    readonly leftIcon?: React.ReactNode
    readonly rightIcon?: React.ReactNode
    readonly loadingIcon?: React.ReactNode

    // Animation
    readonly disableAnimation?: boolean
    readonly hapticFeedback?: boolean

    // Layout
    readonly fullWidth?: boolean
    readonly isIconOnly?: boolean

    // Accessibility
    readonly accessibilityLabel?: string
    readonly accessibilityHint?: string

    // Advanced features
    readonly trackingId?: string
    readonly confirmAction?: boolean
    readonly confirmMessage?: string

    // Custom styles
    readonly style?: ViewStyle
}

// Touch target sizes following iOS/Android guidelines
const touchTargets = {
    xs: { height: 28, paddingHorizontal: 8, fontSize: 12, iconSize: 12 },
    sm: { height: 32, paddingHorizontal: 12, fontSize: 14, iconSize: 14 },
    md: { height: 40, paddingHorizontal: 16, fontSize: 16, iconSize: 16 },
    lg: { height: 48, paddingHorizontal: 24, fontSize: 18, iconSize: 18 },
    xl: { height: 56, paddingHorizontal: 32, fontSize: 20, iconSize: 20 },
    icon: { height: 40, paddingHorizontal: 8, fontSize: 16, iconSize: 20 },
} as const

// Color schemes for variants
const getVariantColors = (variant: ButtonVariant, disabled: boolean, loading: boolean): { backgroundColor: string; textColor: string; borderColor: string } => {
    const isDisabled = disabled || loading

    switch (variant) {
        case 'primary':
            return {
                backgroundColor: isDisabled ? '#94a3b8' : '#3b82f6',
                textColor: isDisabled ? '#cbd5e1' : '#ffffff',
                borderColor: '#3b82f6',
            }
        case 'secondary':
            return {
                backgroundColor: isDisabled ? '#f1f5f9' : '#f8fafc',
                textColor: isDisabled ? '#94a3b8' : '#475569',
                borderColor: '#e2e8f0',
            }
        case 'outline':
            return {
                backgroundColor: isDisabled ? '#f8fafc' : 'transparent',
                textColor: isDisabled ? '#94a3b8' : '#475569',
                borderColor: isDisabled ? '#e2e8f0' : '#cbd5e1',
            }
        case 'ghost':
            return {
                backgroundColor: 'transparent',
                textColor: isDisabled ? '#94a3b8' : '#475569',
                borderColor: 'transparent',
            }
        case 'destructive':
            return {
                backgroundColor: isDisabled ? '#fca5a5' : '#ef4444',
                textColor: isDisabled ? '#fecaca' : '#ffffff',
                borderColor: '#ef4444',
            }
        case 'link':
            return {
                backgroundColor: 'transparent',
                textColor: isDisabled ? '#94a3b8' : '#3b82f6',
                borderColor: 'transparent',
            }
        default:
            return {
                backgroundColor: isDisabled ? '#94a3b8' : '#3b82f6',
                textColor: isDisabled ? '#cbd5e1' : '#ffffff',
                borderColor: '#3b82f6',
            }
    }
}

// Default loading spinner component
const LoadingSpinner: React.FC<{ size: number; color: string }> = ({ size, color }) => {
    const rotation = useSharedValue(0)

    React.useEffect(() => {
        rotation.value = withTiming(360, { duration: 1000 })
    }, [rotation])

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value}deg` }],
    }))

    return (
        <Animated.View style={[styles.spinner, { width: size, height: size }, animatedStyle]}>
            <View style={[styles.spinnerCircle, { borderColor: color, borderBottomColor: 'transparent' }]} />
        </Animated.View>
    )
}

export const MobileButton: React.FC<MobileButtonProps> = ({
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    children,
    leftIcon,
    rightIcon,
    loadingIcon,
    disableAnimation = false,
    hapticFeedback = true,
    fullWidth = false,
    isIconOnly = false,
    accessibilityLabel,
    accessibilityHint,
    trackingId,
    confirmAction = false,
    confirmMessage = 'Are you sure?',
    onPress,
    style,
    ...restProps
}) => {
    const scale = useSharedValue(1)
    const pressedScale = useSharedValue(1)

    // Animation styles
    const animatedStyle = useAnimatedStyle(() => {
        if (disableAnimation) return {}

        return {
            transform: [{ scale: scale.value }],
        }
    })

    const pressedAnimatedStyle = useAnimatedStyle(() => {
        if (disableAnimation) return {}

        return {
            transform: [{ scale: pressedScale.value }],
        }
    })

    // Handle press with haptics and confirmation
    const handlePress = useCallback(() => {
        if (loading || disabled) return

        // Analytics tracking
        if (trackingId) {
            logger.warn('MobileButton pressed', { trackingId, variant, size })
        }

        // Haptic feedback
        if (hapticFeedback) {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        }

        // Confirmation dialog (simplified - in real app would use Alert)
        if (confirmAction) {
            // Note: React Native Alert is synchronous, this is a simplified implementation
            // In production, use a proper confirmation modal
            console.warn(`Confirmation needed: ${confirmMessage}`)
            return
        }

        onPress?.()
    }, [loading, disabled, trackingId, variant, size, hapticFeedback, confirmAction, confirmMessage, onPress])

    // Press in/out handlers for animation
    const handlePressIn = useCallback(() => {
        if (!disableAnimation && !loading && !disabled) {
            pressedScale.value = withSpring(0.95, { damping: 15, stiffness: 150 })
        }
    }, [disableAnimation, loading, disabled, pressedScale])

    const handlePressOut = useCallback(() => {
        if (!disableAnimation && !loading && !disabled) {
            pressedScale.value = withSpring(1, { damping: 15, stiffness: 150 })
        }
    }, [disableAnimation, loading, disabled, pressedScale])

    // Compute styles
    const targetSize = touchTargets[size]
    const colors = getVariantColors(variant, disabled, loading)

    const containerStyle: ViewStyle = useMemo(() => ({
        ...styles.container,
        height: targetSize.height,
        paddingHorizontal: targetSize.paddingHorizontal,
        backgroundColor: colors.backgroundColor,
        borderColor: colors.borderColor,
        ...(fullWidth && { width: '100%' }),
        ...(isIconOnly && {
            width: targetSize.height,
            paddingHorizontal: targetSize.paddingHorizontal,
            justifyContent: 'center',
            alignItems: 'center',
        }),
        ...(variant === 'link' && styles.linkButton),
        ...(variant !== 'link' && { borderWidth: 1 }),
        ...style,
    }), [variant, fullWidth, isIconOnly, colors, style, targetSize.height, targetSize.paddingHorizontal])

    const textStyle: TextStyle = useMemo(() => ({
        ...styles.text,
        fontSize: targetSize.fontSize,
        color: colors.textColor,
        ...(variant === 'link' && styles.linkText),
        ...(loading && { opacity: 0 }),
    }), [variant, colors, loading, targetSize.fontSize]) // Fix unnecessary dependency

    // Icon rendering
    const renderIcon = useCallback((icon: React.ReactNode) => {
        if (!icon) return null

        return (
            <View style={[styles.icon, { width: targetSize.iconSize, height: targetSize.iconSize }]}>
                {icon}
            </View>
        )
    }, [targetSize.iconSize])

    // Loading state content
    const loadingContent = loadingIcon ?? (
        <LoadingSpinner size={targetSize.iconSize} color={colors.textColor} />
    )

    // Button content
    const buttonContent = (
        <>
            {loading ? (
                <View style={styles.content}>
                    {renderIcon(loadingContent)}
                </View>
            ) : (
                <View style={styles.content}>
                    {leftIcon && renderIcon(leftIcon)}
                    {!isIconOnly && children && (
                        <Text style={textStyle} numberOfLines={1}>
                            {children}
                        </Text>
                    )}
                    {rightIcon && renderIcon(rightIcon)}
                </View>
            )}
        </>
    )

    const accessibilityProps = {
        accessible: true,
        accessibilityLabel: accessibilityLabel ?? (typeof children === 'string' ? children : undefined),
        accessibilityHint: accessibilityHint,
        accessibilityRole: 'button' as const,
        accessibilityState: {
            disabled: disabled || loading,
            busy: loading,
        },
    }

    return (
        <Animated.View style={[animatedStyle, fullWidth && { width: '100%' }]}>
            <AnimatedTouchableOpacity
                style={[containerStyle, pressedAnimatedStyle]}
                onPress={handlePress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled || loading}
                activeOpacity={0.8}
                {...accessibilityProps}
                {...restProps}
            >
                {buttonContent}
            </AnimatedTouchableOpacity>
        </Animated.View>
    )
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity)

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        minHeight: 44, // iOS minimum touch target
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    text: {
        fontWeight: '600',
        textAlign: 'center',
    },
    icon: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    linkButton: {
        backgroundColor: 'transparent',
        borderWidth: 0,
        minHeight: 44, // Still maintain touch target for links
    },
    linkText: {
        textDecorationLine: 'underline',
        fontWeight: '500',
    },
    spinner: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    spinnerCircle: {
        width: '100%',
        height: '100%',
        borderRadius: 999,
        borderWidth: 2,
    },
})

MobileButton.displayName = 'MobileButton'
