import React, { useCallback, useMemo, useRef } from 'react';
import {
    View,
    Text,
    Pressable,
    type ViewStyle,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    interpolateColor,
    runOnJS,
} from '@petspark/motion';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import * as Haptics from 'expo-haptics';

import type { SwitchProps } from './Switch.types';
import { createSwitchStyles, switchSizeConfig } from './Switch.config';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { tokens } from '../../tokens';

const AnimatedView = Animated.View;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Native Switch Component
 *
 * A high-quality toggle switch optimized for mobile with:
 * - Smooth spring animations with reduced motion support
 * - Haptic feedback integration
 * - Multiple size and variant options
 * - Accessibility compliance (VoiceOver/TalkBack)
 * - Design system integration
 * - API compatibility with web Switch component
 */
export const Switch = React.memo<SwitchProps>(({
    checked = false,
    onCheckedChange,
    disabled = false,
    variant = 'default',
    size = 'medium',
    label,
    description,
    style,
    trackStyle,
    thumbStyle,
    labelStyle,
    descriptionStyle,
    testID = 'switch',
    accessibilityLabel,
    accessibilityHint,
}) => {
    const styles = useMemo(() => createSwitchStyles(variant, size, disabled, checked), [variant, size, disabled, checked]);
    const config = switchSizeConfig[size];
    const reducedMotion = useReducedMotion();
    const pressedRef = useRef(false);

    // Animation values
    const thumbPosition = useSharedValue(checked ? 1 : 0);
    const thumbScale = useSharedValue(1);
    const trackScale = useSharedValue(1);
    const trackOpacity = useSharedValue(1);

    // Initialize animation values based on checked state
    React.useEffect(() => {
        if (reducedMotion) {
            thumbPosition.value = checked ? 1 : 0;
        } else {
            thumbPosition.value = withSpring(checked ? 1 : 0, config.animation.springConfig);
        }
    }, [checked, reducedMotion, thumbPosition, config.animation.springConfig]);

    // Track animated style
    const trackAnimatedStyle = useAnimatedStyle(() => {
        const backgroundColor = interpolateColor(
            thumbPosition.value,
            [0, 1],
            [
                variant === 'default' ? tokens.colors.border.primary : tokens.colors.background.secondary,
                tokens.colors.accent.primary,
            ]
        );

        return {
            backgroundColor,
            transform: [{ scale: trackScale.value }],
            opacity: trackOpacity.value,
        };
    });

    // Thumb animated style
    const thumbAnimatedStyle = useAnimatedStyle(() => {
        const translateX = thumbPosition.value * config.thumb.translateDistance;

        return {
            transform: [
                { translateX },
                { scale: thumbScale.value },
            ],
        };
    });

    // Handle press animations and state change
    const handlePressIn = useCallback(() => {
        if (disabled) return;

        pressedRef.current = true;

        if (!reducedMotion) {
            thumbScale.value = withSpring(1.1, { damping: 20, stiffness: 400 });
            trackScale.value = withSpring(1.02, { damping: 20, stiffness: 400 });
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, [disabled, reducedMotion, thumbScale, trackScale]);

    const handlePressOut = useCallback(() => {
        if (disabled) return;

        pressedRef.current = false;

        if (!reducedMotion) {
            thumbScale.value = withSpring(1, { damping: 20, stiffness: 400 });
            trackScale.value = withSpring(1, { damping: 20, stiffness: 400 });
        }
    }, [disabled, reducedMotion, thumbScale, trackScale]);

    const handlePress = useCallback(() => {
        if (disabled || !onCheckedChange) return;

        const newChecked = !checked;

        // Trigger haptic feedback
        Haptics.selectionAsync();

        // Animate the change
        if (reducedMotion) {
            thumbPosition.value = withTiming(newChecked ? 1 : 0, { duration: 150 });
        } else {
            thumbPosition.value = withSpring(newChecked ? 1 : 0, config.animation.springConfig);
        }

        // Call the change handler
        runOnJS(onCheckedChange)(newChecked);
    }, [disabled, checked, onCheckedChange, reducedMotion, thumbPosition, config.animation.springConfig]);

    // Accessibility
    const switchAccessibilityLabel = accessibilityLabel ||
        (label ? `${label} switch` : 'Toggle switch');

    const switchAccessibilityHint = accessibilityHint ||
        `Double tap to ${checked ? 'turn off' : 'turn on'}`;

    return (
        <View style={[styles.container, style]} testID={testID}>
            <View style={styles.switchContainer}>
                <AnimatedPressable
                    style={[styles.track, trackStyle, trackAnimatedStyle]}
                    onPress={handlePress}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    disabled={disabled}
                    accessibilityRole="switch"
                    accessibilityState={{
                        checked,
                        disabled,
                    }}
                    accessibilityLabel={switchAccessibilityLabel}
                    accessibilityHint={switchAccessibilityHint}
                    testID={`${testID}-track`}
                >
                    <AnimatedView
                        style={[styles.thumb, thumbStyle, thumbAnimatedStyle]}
                        testID={`${testID}-thumb`}
                    />
                </AnimatedPressable>
            </View>

            {(label || description) && (
                <View style={styles.labelContainer}>
                    {label && (
                        <Text
                            style={[
                                styles.label,
                                disabled && styles.labelDisabled,
                                labelStyle,
                            ]}
                            testID={`${testID}-label`}
                        >
                            {label}
                        </Text>
                    )}

                    {description && (
                        <Text
                            style={[
                                styles.description,
                                disabled && styles.descriptionDisabled,
                                descriptionStyle,
                            ]}
                            testID={`${testID}-description`}
                        >
                            {description}
                        </Text>
                    )}
                </View>
            )}
        </View>
    );
});

Switch.displayName = 'Switch';

export default Switch;
