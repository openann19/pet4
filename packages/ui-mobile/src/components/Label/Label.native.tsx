/**
 * Label Component
 * Mobile-first label component with accessibility and design system integration
 *
 * Features:
 * - Design system integration with shared tokens
 * - Comprehensive accessibility support
 * - Required/optional field indicators
 * - Multiple size and variant options
 * - Animation support with Reanimated
 * - Haptic feedback integration
 * - Form field association
 * - Screen reader optimization
 */

import React, { memo, useCallback, useMemo } from 'react';
import { Text, View, Pressable } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import * as Haptics from 'expo-haptics';

import type {
    LabelProps,
    FieldWrapperProps,
    RequiredIndicatorProps,
    OptionalIndicatorProps,
    MessageProps,
} from './Label.types';
import {
    labelConfig,
    labelVariants,
    labelSizes,
    requiredIndicatorStyles,
    optionalIndicatorStyles,
    descriptionStyles,
    messageVariants,
    messageSizes,
    fieldSpacing,
    disabledStyles,
    animationPresets,
    accessibilityConstants,
    testIds,
} from './Label.config';

// Animated components
const AnimatedText = Animated.createAnimatedComponent(Text);
const AnimatedView = Animated.createAnimatedComponent(View);

/**
 * Required indicator component
 */
const RequiredIndicator = memo<RequiredIndicatorProps>(({
    variant = 'destructive',
    size = 'md',
    style
}) => {
    const baseStyle = requiredIndicatorStyles[size];
    const colorStyle = labelVariants[variant];

    return (
        <Text
            style={[baseStyle, colorStyle, style]}
            accessibilityLabel={accessibilityConstants.announcements.required}
            accessibilityRole="text"
            testID={testIds.requiredIndicator}
        >
            *
        </Text>
    );
});

RequiredIndicator.displayName = 'RequiredIndicator';

/**
 * Optional indicator component
 */
const OptionalIndicator = memo<OptionalIndicatorProps>(({
    variant = 'muted',
    size = 'md',
    style
}) => {
    const baseStyle = optionalIndicatorStyles[size];
    const colorStyle = labelVariants[variant];

    return (
        <Text
            style={[baseStyle, colorStyle, style]}
            accessibilityLabel={accessibilityConstants.announcements.optional}
            accessibilityRole="text"
            testID={testIds.optionalIndicator}
        >
            (optional)
        </Text>
    );
});

OptionalIndicator.displayName = 'OptionalIndicator';

/**
 * Message component for errors, success, warnings
 */
const Message = memo<MessageProps>(({
    type,
    children,
    size = 'sm',
    style,
    testID
}) => {
    const baseStyle = messageSizes[size];
    const colorStyle = messageVariants[type];

    const accessibilityLabel = useMemo(() => {
        const prefix = accessibilityConstants.announcements[type] || '';
        const content = typeof children === 'string' ? children : 'Message';
        return `${prefix}${content}`;
    }, [type, children]);

    return (
        <Text
            style={[baseStyle, colorStyle, style]}
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="text"
            accessibilityLiveRegion="polite"
            testID={testID || testIds.message}
        >
            {children}
        </Text>
    );
});

Message.displayName = 'Message';

/**
 * Main Label component
 */
export const Label = memo<LabelProps>(({
    children,
    variant = labelConfig.defaultVariant,
    size = labelConfig.defaultSize,
    required = false,
    optional = false,
    disabled = false,
    description,
    htmlFor,
    nativeID,
    accessibilityLabel,
    accessibilityRole = accessibilityConstants.roles.label,
    accessibilityState,
    enableHaptics = labelConfig.haptics.enabled,
    style,
    containerStyle,
    className,
    testID,
    onPress,
    interactive = false,
    animation = { enabled: labelConfig.animation.enabled },
}) => {
    // Animation values
    const scaleValue = useSharedValue(1);
    const opacityValue = useSharedValue(1);

    // Compute styles
    const baseStyle = useMemo(() => labelSizes[size ?? 'medium'], [size]);
    const colorStyle = useMemo(() => labelVariants[variant ?? 'default'], [variant]);
    const finalDisabledStyles = disabled ? disabledStyles : {};

    // Handle press with haptics and animation
    const handlePress = useCallback(() => {
        if (disabled || !interactive) return;

        // Haptic feedback
        if (enableHaptics) {
            Haptics.impactAsync(
                labelConfig.haptics.intensity === 'light'
                    ? Haptics.ImpactFeedbackStyle.Light
                    : labelConfig.haptics.intensity === 'medium'
                        ? Haptics.ImpactFeedbackStyle.Medium
                        : Haptics.ImpactFeedbackStyle.Heavy
            );
        }

        // Animation
        if (animation?.enabled) {
            const animationType = animation.type || 'scale';
            const duration = animation.duration || animationPresets[animationType].duration;

            if (animationType === 'scale') {
                scaleValue.value = withSpring(
                    animationPresets.scale.scaleTo,
                    { duration },
                    () => {
                        scaleValue.value = withSpring(1, { duration: duration / 2 });
                    }
                );
            }
        }

        onPress?.();
    }, [disabled, interactive, enableHaptics, animation, onPress, scaleValue]);

    // Animated styles
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scaleValue.value }],
        opacity: opacityValue.value,
    }));

    // Accessibility props
    const accessibilityProps = useMemo(() => ({
        nativeID,
        accessibilityLabel: accessibilityLabel || (typeof children === 'string' ? children : undefined),
        accessibilityRole: interactive ? accessibilityConstants.roles.interactiveLabel : accessibilityRole,
        accessibilityState: {
            disabled,
            ...accessibilityState,
            ...(required ? accessibilityConstants.traits.required : {}),
        },
        accessibilityHint: interactive ? 'Tap to interact with associated form field' : undefined,
    }), [
        nativeID,
        accessibilityLabel,
        children,
        interactive,
        accessibilityRole,
        disabled,
        accessibilityState,
        required,
    ]);

    // Build label content with indicators
    const labelContent = useMemo(() => (
        <>
            {children}
            {required && <RequiredIndicator variant={variant} size={size} />}
            {!required && optional && <OptionalIndicator size={size} />}
        </>
    ), [children, required, optional, variant, size]);

    // Main label element
    const labelElement = interactive ? (
        <Pressable
            onPress={handlePress}
            disabled={disabled}
            testID={testID || testIds.label}
            {...(interactive ? accessibilityProps : {})}
        >
            <AnimatedText
                style={[
                    baseStyle,
                    colorStyle,
                    finalDisabledStyles,
                    style,
                    animatedStyle,
                ]}
                {...(!interactive ? accessibilityProps : {})}
            >
                {labelContent}
            </AnimatedText>
        </Pressable>
    ) : (
        <AnimatedText
            style={[
                baseStyle,
                colorStyle,
                finalDisabledStyles,
                style,
                animatedStyle,
            ]}
            testID={testID || testIds.label}
            {...accessibilityProps}
        >
            {labelContent}
        </AnimatedText>
    );

    // Description element
    const descriptionElement = description && (
        <Text
            style={[
                descriptionStyles[size ?? 'medium'],
                { color: labelVariants.muted.color },
                disabled ? disabledStyles : {},
            ]}
            accessibilityRole="text"
            testID={testIds.description}
        >
            {description}
        </Text>
    );

    // Single element return (no container needed)
    if (!description && !containerStyle) {
        return labelElement;
    }

    // Container with label and optional description
    return (
        <View
            style={[
                { flexDirection: 'column' },
                containerStyle,
            ]}
        >
            {labelElement}
            {descriptionElement}
        </View>
    );
});

Label.displayName = 'Label';

/**
 * Field wrapper component that combines label with form controls
 */
export const FieldWrapper = memo<FieldWrapperProps>(({
    label,
    description,
    required = false,
    optional = false,
    error,
    success,
    warning,
    disabled = false,
    children,
    containerStyle,
    labelProps = {},
    testID,
    spacing = labelConfig.defaultSpacing,
}) => {
    const spacingStyle = fieldSpacing[spacing ?? 'md'];

    // Determine message to show (error takes priority)
    const message = error || warning || success;
    const messageType = error ? 'error' : warning ? 'warning' : success ? 'success' : 'info';

    return (
        <View
            style={[
                {
                    marginBottom: spacingStyle.marginBottom,
                },
                containerStyle,
            ]}
            testID={testID || testIds.fieldWrapper}
        >
            {/* Label */}
            {label && (
                <View style={{ marginBottom: spacingStyle.gap }}>
                    <Label
                        required={required}
                        optional={optional}
                        disabled={disabled}
                        {...(description !== undefined && { description })}
                        variant={error ? 'destructive' : success ? 'success' : warning ? 'warning' : 'default'}
                        {...labelProps}
                    >
                        {label}
                    </Label>
                </View>
            )}

            {/* Form control */}
            <View style={{ marginBottom: message ? spacingStyle.gap : 0 }}>
                {children}
            </View>

            {/* Message */}
            {message && (
                <Message type={messageType}>
                    {message}
                </Message>
            )}
        </View>
    );
});

FieldWrapper.displayName = 'FieldWrapper';

// Export components and utilities
export { RequiredIndicator, OptionalIndicator, Message };
export type {
    LabelProps,
    FieldWrapperProps,
    RequiredIndicatorProps,
    OptionalIndicatorProps,
    MessageProps,
};

// Default export
export default Label;
