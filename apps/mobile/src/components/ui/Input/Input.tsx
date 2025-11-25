/**
 * Mobile Input Component
 * React Native equivalent of web Input with feature parity
 * Includes validation, accessibility, and platform-specific features
 */

import React, { useCallback, useMemo, useState, useRef, useImperativeHandle } from 'react'
import {
    TextInput,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    type TextInputProps,
    type ViewStyle,
    type TextStyle,
} from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'

// Simple logging without function wrapper to avoid return type errors
const logger = {
    warn: (message: string, data?: unknown) => console.warn(`[MobileInput] ${message}`, data),
    error: (message: string, error?: unknown) => console.error(`[MobileInput] ${message}`, error),
}

export type InputVariant = 'default' | 'filled' | 'underlined' | 'unstyled'
export type InputSize = 'sm' | 'md' | 'lg'

export interface MobileInputProps extends Omit<TextInputProps, 'style' | 'editable'> {
    // Visual variants
    readonly variant?: InputVariant
    readonly size?: InputSize

    // States
    readonly loading?: boolean
    readonly error?: boolean
    readonly success?: boolean
    readonly disabled?: boolean

    // Validation
    readonly errorMessage?: string
    readonly successMessage?: string
    readonly helperText?: string

    // Icons and addons
    readonly leftIcon?: React.ReactNode
    readonly rightIcon?: React.ReactNode
    readonly leftAddon?: React.ReactNode
    readonly rightAddon?: React.ReactNode

    // Labels and descriptions
    readonly label?: string
    readonly description?: string
    readonly isRequired?: boolean

    // Advanced features
    readonly clearable?: boolean
    readonly showCounter?: boolean
    readonly maxLength?: number
    readonly debounceMs?: number
    readonly trackingId?: string

    // Callbacks
    readonly onClear?: () => void
    readonly onDebounceChange?: (value: string) => void
    readonly onFocus?: () => void
    readonly onBlur?: () => void

    // Animation
    readonly disableAnimation?: boolean

    // Custom styles
    readonly style?: ViewStyle
}

export interface MobileInputRef {
    readonly focus: () => void
    readonly blur: () => void
    readonly clear: () => void
    readonly getValue: () => string
}

// Input size configurations
const inputSizes = {
    sm: { height: 32, paddingHorizontal: 12, fontSize: 14, iconSize: 16 },
    md: { height: 40, paddingHorizontal: 16, fontSize: 16, iconSize: 18 },
    lg: { height: 48, paddingHorizontal: 20, fontSize: 18, iconSize: 20 },
} as const

// Get variant styles
const getVariantStyles = (variant: InputVariant, error: boolean, success: boolean, disabled: boolean) => {
    const hasError = error && !disabled
    const hasSuccess = success && !disabled && !error

    switch (variant) {
        case 'default':
            return {
                backgroundColor: disabled ? '#f1f5f9' : '#ffffff',
                borderColor: hasError ? '#ef4444' : hasSuccess ? '#10b981' : '#e2e8f0',
                borderWidth: 1,
                borderRadius: 8,
            }
        case 'filled':
            return {
                backgroundColor: disabled ? '#f1f5f9' : '#f8fafc',
                borderColor: hasError ? '#ef4444' : hasSuccess ? '#10b981' : 'transparent',
                borderWidth: 1,
                borderRadius: 8,
            }
        case 'underlined':
            return {
                backgroundColor: 'transparent',
                borderColor: hasError ? '#ef4444' : hasSuccess ? '#10b981' : '#e2e8f0',
                borderWidth: 0,
                borderBottomWidth: 1,
                borderRadius: 0,
            }
        case 'unstyled':
            return {
                backgroundColor: 'transparent',
                borderColor: 'transparent',
                borderWidth: 0,
                borderRadius: 0,
            }
        default:
            return {
                backgroundColor: disabled ? '#f1f5f9' : '#ffffff',
                borderColor: hasError ? '#ef4444' : '#e2e8f0',
                borderWidth: 1,
                borderRadius: 8,
            }
    }
}

// Clear icon component
const ClearIcon: React.FC<{ size: number; color: string; onPress: () => void }> = ({ size, color, onPress }) => (
    <TouchableOpacity
        onPress={onPress}
        style={[styles.clearIcon, { width: size, height: size }]}
        accessibilityLabel="Clear input"
        accessibilityRole="button"
    >
        <Text style={[styles.clearIconText, { color, fontSize: size * 0.6 }]}>✕</Text>
    </TouchableOpacity>
)

export const MobileInput = React.forwardRef<MobileInputRef, MobileInputProps>(({
    variant = 'default',
    size = 'md',
    loading = false,
    error = false,
    success = false,
    disabled = false,
    errorMessage,
    successMessage,
    helperText,
    leftIcon,
    rightIcon,
    leftAddon,
    rightAddon,
    label,
    description,
    isRequired = false,
    clearable = false,
    showCounter = false,
    maxLength,
    debounceMs,
    trackingId,
    onClear,
    onDebounceChange,
    onFocus,
    onBlur,
    disableAnimation = false,
    value,
    onChangeText,
    style,
    ...restProps
}, ref) => {
    const [isFocused, setIsFocused] = useState(false)
    const [internalValue, setInternalValue] = useState(value ?? '')
    const inputRef = useRef<TextInput>(null)
    const debounceTimerRef = useRef<NodeJS.Timeout>()

    // Focus animation
    const focusScale = useSharedValue(1)
    const animatedStyle = useAnimatedStyle(() => {
        if (disableAnimation) return {}

        return {
            transform: [{ scale: focusScale.value }],
        }
    })

    // Handle text change with debouncing
    const handleTextChange = useCallback((text: string) => {
        setInternalValue(text)

        // Clear existing debounce timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current)
        }

        // Immediate callback
        onChangeText?.(text)

        // Debounced callback
        if (onDebounceChange && debounceMs) {
            debounceTimerRef.current = setTimeout(() => {
                onDebounceChange(text)
            }, debounceMs)
        }
    }, [onChangeText, onDebounceChange, debounceMs])

    // Handle clear
    const handleClear = useCallback(() => {
        handleTextChange('')
        onClear?.()

        // Analytics tracking
        if (trackingId) {
            logger.warn('MobileInput cleared', { trackingId, variant, size })
        }
    }, [handleTextChange, onClear, trackingId, variant, size])

    // Handle focus
    const handleFocus = useCallback(() => {
        setIsFocused(true)
        if (!disableAnimation) {
            focusScale.value = withSpring(1.02, { damping: 15, stiffness: 150 })
        }
        onFocus?.()

        if (trackingId) {
            logger.warn('MobileInput focused', { trackingId, variant, size })
        }
    }, [disableAnimation, onFocus, trackingId, variant, size, focusScale])

    // Handle blur
    const handleBlur = useCallback(() => {
        setIsFocused(false)
        if (!disableAnimation) {
            focusScale.value = withSpring(1, { damping: 15, stiffness: 150 })
        }
        onBlur?.()

        if (trackingId) {
            logger.warn('MobileInput blurred', { trackingId, variant, size })
        }
    }, [disableAnimation, onBlur, trackingId, variant, size, focusScale])

    // Imperative methods
    useImperativeHandle(ref, () => ({
        focus: () => inputRef.current?.focus(),
        blur: () => inputRef.current?.blur(),
        clear: handleClear,
        getValue: () => internalValue,
    }), [handleClear, internalValue])

    // Compute styles
    const targetSize = inputSizes[size ?? 'md']
    const variantStyles = getVariantStyles(variant ?? 'default', error, success, disabled)
    const displayValue = value ?? internalValue
    const showClearButton = clearable && displayValue.length > 0 && !disabled && !loading
    const currentLength = displayValue.length
    const showCounterText = showCounter && maxLength && currentLength > 0

    // Container style
    const containerStyle: ViewStyle = useMemo(() => ({
        ...styles.container,
        ...style,
    }), [style])

    // Input container style
    const inputContainerStyle: ViewStyle = useMemo(() => ({
        ...styles.inputContainer,
        height: targetSize.height,
        paddingHorizontal: targetSize.paddingHorizontal,
        ...variantStyles,
        ...(disabled && styles.disabled),
        ...(isFocused && !disabled && styles.focused),
    }), [targetSize, variantStyles, disabled, isFocused])

    // Input style
    const inputStyle: TextStyle = useMemo(() => ({
        ...styles.input,
        fontSize: targetSize.fontSize,
        color: disabled ? '#94a3b8' : '#1e293b',
        flex: 1,
        ...(variant === 'underlined' && { paddingVertical: 8 }),
    }), [targetSize.fontSize, disabled, variant])

    // Label style
    const labelStyle: TextStyle = useMemo(() => ({
        ...styles.label,
        fontSize: targetSize.fontSize,
        color: error ? '#ef4444' : '#475569',
    }), [targetSize.fontSize, error])

    // Message style
    const getMessageStyle = useCallback((type: 'error' | 'success' | 'helper') => {
        const baseStyle = {
            ...styles.message,
            fontSize: targetSize.fontSize - 2,
        }

        switch (type) {
            case 'error':
                return { ...baseStyle, color: '#ef4444' }
            case 'success':
                return { ...baseStyle, color: '#10b981' }
            default:
                return { ...baseStyle, color: '#64748b' }
        }
    }, [targetSize.fontSize])

    // Render left content
    const renderLeftContent = useCallback(() => {
        if (!leftIcon && !leftAddon) return null

        return (
            <View style={styles.leftContent}>
                {leftIcon && (
                    <View style={[styles.icon, { width: targetSize.iconSize, height: targetSize.iconSize }]}>
                        {leftIcon}
                    </View>
                )}
                {leftAddon}
            </View>
        )
    }, [leftIcon, leftAddon, targetSize.iconSize])

    // Render right content
    const renderRightContent = useCallback(() => {
        if (!rightIcon && !rightAddon && !showClearButton && !loading) return null

        return (
            <View style={styles.rightContent}>
                {loading && (
                    <View style={[styles.loadingIndicator, { width: targetSize.iconSize, height: targetSize.iconSize }]} />
                )}
                {rightIcon && !loading && (
                    <View style={[styles.icon, { width: targetSize.iconSize, height: targetSize.iconSize }]}>
                        {rightIcon}
                    </View>
                )}
                {showClearButton && !rightIcon && !loading && (
                    <ClearIcon
                        size={targetSize.iconSize}
                        color="#64748b"
                        onPress={handleClear}
                    />
                )}
                {rightAddon}
            </View>
        )
    }, [rightIcon, rightAddon, showClearButton, loading, targetSize.iconSize, handleClear])

    // Render message
    const renderMessage = useCallback(() => {
        if (errorMessage) {
            return (
                <Animated.Text entering={FadeIn} exiting={FadeOut} style={getMessageStyle('error')}>
                    {errorMessage}
                </Animated.Text>
            )
        }

        if (successMessage) {
            return (
                <Animated.Text entering={FadeIn} exiting={FadeOut} style={getMessageStyle('success')}>
                    {successMessage}
                </Animated.Text>
            )
        }

        if (helperText) {
            return (
                <Animated.Text entering={FadeIn} exiting={FadeOut} style={getMessageStyle('helper')}>
                    {helperText}
                </Animated.Text>
            )
        }

        return null
    }, [errorMessage, successMessage, helperText, getMessageStyle])

    return (
        <Animated.View style={[containerStyle, animatedStyle]}>
            {/* Label */}
            {label && (
                <Text style={labelStyle}>
                    {label}
                    {isRequired && <Text style={styles.required}> *</Text>}
                </Text>
            )}

            {/* Description */}
            {description && (
                <Text style={styles.description}>{description}</Text>
            )}

            {/* Input container */}
            <View style={inputContainerStyle}>
                {/* Left content */}
                {renderLeftContent()}

                {/* Text input */}
                <TextInput
                    ref={inputRef}
                    style={inputStyle}
                    value={displayValue}
                    onChangeText={handleTextChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    editable={!disabled}
                    maxLength={maxLength}
                    placeholderTextColor="#94a3b8"
                    accessibilityLabel={label}
                    accessibilityState={{
                        disabled,
                        busy: loading,
                    }}
                    {...restProps}
                />

                {/* Right content */}
                {renderRightContent()}
            </View>

            {/* Message and counter */}
            <View style={styles.footer}>
                {renderMessage()}
                {showCounterText && (
                    <Text style={styles.counter}>
                        {currentLength}/{maxLength}
                    </Text>
                )}
            </View>
        </Animated.View>
    )
})

MobileInput.displayName = 'MobileInput'

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 44, // iOS minimum touch target
    },
    input: {
        flex: 1,
        paddingVertical: 8,
        fontFamily: 'System',
    },
    label: {
        fontWeight: '600',
        marginBottom: 6,
        fontFamily: 'System',
    },
    description: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 4,
        fontFamily: 'System',
    },
    required: {
        color: '#ef4444',
    },
    leftContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 8,
    },
    rightContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 8,
    },
    icon: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    clearIcon: {
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 4,
    },
    clearIconText: {
        fontWeight: '600',
    },
    loadingIndicator: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabled: {
        opacity: 0.5,
    },
    focused: {
        // Focus styles are handled by variant styles
    },
    message: {
        marginTop: 4,
        fontFamily: 'System',
    },
    counter: {
        fontSize: 12,
        color: '#94a3b8',
        marginTop: 4,
        textAlign: 'right',
        fontFamily: 'System',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        minHeight: 20,
    },
})
