import React, { useReducer, useCallback, useRef, useEffect, useContext } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Animated,
    ViewStyle,
    TextStyle,
} from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { tokens } from '../../tokens';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import type { CheckboxProps, CheckboxState, CheckboxAction, CheckboxConfig } from './Checkbox.types';

const defaultConfig: CheckboxConfig = {
    variant: 'default',
    size: 'medium',
    shape: 'square',
    hapticFeedback: true,
    animated: true,
    showLabel: true,
};

const defaultIcons = {
    checked: '✓',
    indeterminate: '−',
};

function checkboxReducer(state: CheckboxState, action: CheckboxAction): CheckboxState {
    switch (action.type) {
        case 'SET_CHECKED':
            return { ...state, checked: action.payload, indeterminate: false };
        case 'SET_INDETERMINATE':
            return { ...state, indeterminate: action.payload, checked: false };
        case 'SET_PRESSED':
            return { ...state, pressed: action.payload };
        case 'SET_FOCUSED':
            return { ...state, focused: action.payload };
        case 'TOGGLE':
            if (state.indeterminate) {
                return { ...state, checked: true, indeterminate: false };
            }
            return { ...state, checked: !state.checked, indeterminate: false };
        default:
            return state;
    }
}

export const Checkbox: React.FC<CheckboxProps> = ({
    checked: controlledChecked,
    indeterminate: controlledIndeterminate = false,
    onCheckedChange,
    label,
    description,
    error,
    variant = defaultConfig.variant,
    size = defaultConfig.size,
    shape = defaultConfig.shape,
    disabled = false,
    required = false,
    hapticFeedback = defaultConfig.hapticFeedback,
    animated = defaultConfig.animated,
    showLabel = defaultConfig.showLabel,
    labelPosition = 'right',
    icon,
    checkedIcon,
    indeterminateIcon,
    value,
    name,
    containerStyle,
    checkboxStyle,
    labelStyle,
    descriptionStyle,
    errorStyle,
    testID,
    accessibilityLabel,
}) => {
    const reducedMotion = useReducedMotion();
    const shouldAnimate = animated && !reducedMotion;

    const [state, dispatch] = useReducer(checkboxReducer, {
        checked: controlledChecked || false,
        indeterminate: controlledIndeterminate,
        pressed: false,
        focused: false,
    });

    const scaleAnimation = useRef(new Animated.Value(1)).current;
    const checkAnimation = useRef(new Animated.Value(0)).current;
    const colorAnimation = useRef(new Animated.Value(0)).current;

    // Update internal state when controlled props change
    useEffect(() => {
        if (controlledChecked !== undefined && controlledChecked !== state.checked) {
            dispatch({ type: 'SET_CHECKED', payload: controlledChecked });
        }
    }, [controlledChecked, state.checked]);

    useEffect(() => {
        if (controlledIndeterminate !== state.indeterminate) {
            dispatch({ type: 'SET_INDETERMINATE', payload: controlledIndeterminate });
        }
    }, [controlledIndeterminate, state.indeterminate]);

    // Animate check state
    useEffect(() => {
        if (shouldAnimate) {
            Animated.parallel([
                Animated.spring(checkAnimation, {
                    toValue: state.checked || state.indeterminate ? 1 : 0,
                    useNativeDriver: false,
                    tension: 100,
                    friction: 8,
                }),
                Animated.timing(colorAnimation, {
                    toValue: state.checked || state.indeterminate ? 1 : 0,
                    duration: 200,
                    useNativeDriver: false,
                }),
            ]).start();
        }
    }, [state.checked, state.indeterminate, shouldAnimate]);

    const handlePress = useCallback(async () => {
        if (disabled) return;

        // Haptic feedback
        if (hapticFeedback) {
            await ReactNativeHapticFeedback.trigger('selection');
        }

        // Press animation
        if (shouldAnimate) {
            Animated.sequence([
                Animated.timing(scaleAnimation, {
                    toValue: 0.95,
                    duration: 100,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnimation, {
                    toValue: 1,
                    duration: 100,
                    useNativeDriver: true,
                }),
            ]).start();
        }

        // Toggle state
        dispatch({ type: 'TOGGLE' });

        // Call onChange callback
        const newChecked = state.indeterminate ? true : !state.checked;
        onCheckedChange?.(newChecked);
    }, [disabled, hapticFeedback, shouldAnimate, state.checked, state.indeterminate, onCheckedChange]);

    const handlePressIn = useCallback(() => {
        dispatch({ type: 'SET_PRESSED', payload: true });
    }, []);

    const handlePressOut = useCallback(() => {
        dispatch({ type: 'SET_PRESSED', payload: false });
    }, []);

    const getCheckboxStyles = useCallback((): {
        container: ViewStyle;
        checkbox: ViewStyle;
        icon: TextStyle;
        label: TextStyle;
        description: TextStyle;
        error: TextStyle;
    } => {
        const sizeMap = {
            sm: {
                size: 16,
                iconSize: 12,
                fontSize: tokens.typography.size.sm,
                borderRadius: shape === 'rounded' ? 4 : 2,
            },
            md: {
                size: 20,
                iconSize: 14,
                fontSize: tokens.typography.size.md,
                borderRadius: shape === 'rounded' ? 6 : 3,
            },
            lg: {
                size: 24,
                iconSize: 16,
                fontSize: tokens.typography.size.lg,
                borderRadius: shape === 'rounded' ? 8 : 4,
            },
        };

        const { size: checkboxSize, iconSize, fontSize, borderRadius } = sizeMap[size];

        const baseContainer: ViewStyle = {
            flexDirection: labelPosition === 'left' ? 'row-reverse' : 'row',
            alignItems: 'flex-start',
            gap: tokens.spacing.sm,
        };

        const baseCheckbox: ViewStyle = {
            width: checkboxSize,
            height: checkboxSize,
            borderRadius,
            borderWidth: 2,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 2, // Align with first line of text
        };

        const baseIcon: TextStyle = {
            fontSize: iconSize,
            fontWeight: tokens.typography.weight.bold,
            includeFontPadding: false,
            textAlignVertical: 'center',
        };

        const baseLabel: TextStyle = {
            flex: 1,
            fontSize,
            fontWeight: tokens.typography.weight.medium,
            lineHeight: tokens.typography.lineHeight.normal,
            color: tokens.colors.text.primary,
        };

        const baseDescription: TextStyle = {
            fontSize: tokens.typography.size.sm,
            fontWeight: tokens.typography.weight.normal,
            color: tokens.colors.text.secondary,
            marginTop: tokens.spacing.xs,
        };

        const baseError: TextStyle = {
            fontSize: tokens.typography.size.sm,
            fontWeight: tokens.typography.weight.medium,
            color: tokens.colors.error[600],
            marginTop: tokens.spacing.xs,
        };

        // State-specific styles
        const isCheckedOrIndeterminate = state.checked || state.indeterminate;

        if (error) {
            return {
                container: baseContainer,
                checkbox: {
                    ...baseCheckbox,
                    borderColor: tokens.colors.error[400],
                    backgroundColor: isCheckedOrIndeterminate ? tokens.colors.error[500] : 'transparent',
                },
                icon: {
                    ...baseIcon,
                    color: tokens.colors.white,
                },
                label: { ...baseLabel, color: tokens.colors.error[700] },
                description: baseDescription,
                error: baseError,
            };
        }

        if (disabled) {
            return {
                container: { ...baseContainer, opacity: tokens.opacity.disabled },
                checkbox: {
                    ...baseCheckbox,
                    borderColor: tokens.colors.border.disabled,
                    backgroundColor: isCheckedOrIndeterminate ? tokens.colors.neutral[300] : 'transparent',
                },
                icon: {
                    ...baseIcon,
                    color: tokens.colors.text.disabled,
                },
                label: { ...baseLabel, color: tokens.colors.text.disabled },
                description: { ...baseDescription, color: tokens.colors.text.disabled },
                error: baseError,
            };
        }

        // Variant-specific colors
        let borderColor = tokens.colors.border.input;
        let backgroundColor = 'transparent';
        let iconColor = tokens.colors.white;

        if (isCheckedOrIndeterminate) {
            switch (variant) {
                case 'outlined':
                    borderColor = tokens.colors.neutral[400];
                    backgroundColor = tokens.colors.neutral[600];
                    break;
                case 'ghost':
                    borderColor = tokens.colors.neutral[300];
                    backgroundColor = tokens.colors.neutral[100];
                    iconColor = tokens.colors.neutral[800];
                    break;
                default: // primary
                    borderColor = tokens.colors.primary[400];
                    backgroundColor = tokens.colors.primary[600];
            }
        }

        // Pressed state
        if (state.pressed && !disabled) {
            backgroundColor = isCheckedOrIndeterminate
                ? tokens.colors.primary[700]
                : tokens.colors.primary[50];
            borderColor = tokens.colors.primary[500];
        }

        return {
            container: baseContainer,
            checkbox: {
                ...baseCheckbox,
                borderColor,
                backgroundColor,
            },
            icon: {
                ...baseIcon,
                color: iconColor,
            },
            label: baseLabel,
            description: baseDescription,
            error: baseError,
        };
    }, [size, shape, labelPosition, variant, state.checked, state.indeterminate, state.pressed, disabled, error]);

    const styles = getCheckboxStyles();
    const currentChecked = controlledChecked !== undefined ? controlledChecked : state.checked;
    const currentIndeterminate = controlledIndeterminate !== undefined ? controlledIndeterminate : state.indeterminate;

    // Determine which icon to show
    let displayIcon = '';
    if (currentIndeterminate) {
        displayIcon = indeterminateIcon || icon || defaultIcons.indeterminate;
    } else if (currentChecked) {
        displayIcon = checkedIcon || icon || defaultIcons.checked;
    }

    const AnimatedTouchable = shouldAnimate ? Animated.createAnimatedComponent(TouchableOpacity) : TouchableOpacity;
    const AnimatedView = shouldAnimate ? Animated.View : View;

    return (
        <View style={[styles.container, containerStyle]} testID={testID}>
            <AnimatedTouchable
                onPress={handlePress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled}
                style={shouldAnimate ? { transform: [{ scale: scaleAnimation }] } : undefined}
                accessibilityRole="checkbox"
                accessibilityLabel={accessibilityLabel || label}
                accessibilityState={{
                    checked: currentIndeterminate ? 'mixed' : currentChecked,
                    disabled,
                }}
                testID={`${testID}-checkbox`}
            >
                <AnimatedView
                    style={[
                        styles.checkbox,
                        checkboxStyle,
                        shouldAnimate && {
                            backgroundColor: colorAnimation.interpolate({
                                inputRange: [0, 1],
                                outputRange: [
                                    'transparent',
                                    error
                                        ? tokens.colors.error[500]
                                        : variant === 'outlined'
                                            ? tokens.colors.neutral[600]
                                            : variant === 'ghost'
                                                ? tokens.colors.neutral[100]
                                                : tokens.colors.primary[600],
                                ],
                            }),
                            borderColor: colorAnimation.interpolate({
                                inputRange: [0, 1],
                                outputRange: [
                                    error ? tokens.colors.error[400] : tokens.colors.border.input,
                                    error
                                        ? tokens.colors.error[400]
                                        : variant === 'outlined'
                                            ? tokens.colors.neutral[400]
                                            : variant === 'ghost'
                                                ? tokens.colors.neutral[300]
                                                : tokens.colors.primary[400],
                                ],
                            }),
                        },
                    ]}
                >
                    {displayIcon && (
                        <Animated.Text
                            style={[
                                styles.icon,
                                shouldAnimate && {
                                    opacity: checkAnimation,
                                    transform: [{
                                        scale: checkAnimation.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0.3, 1],
                                        }),
                                    }],
                                },
                            ]}
                        >
                            {displayIcon}
                        </Animated.Text>
                    )}
                </AnimatedView>
            </AnimatedTouchable>

            {/* Label and Description */}
            {(label || description) && showLabel && (
                <View style={{ flex: 1 }}>
                    {label && (
                        <Text style={[styles.label, labelStyle]}>
                            {label}
                            {required && (
                                <Text style={{ color: tokens.colors.error[500] }}> *</Text>
                            )}
                        </Text>
                    )}
                    {description && (
                        <Text style={[styles.description, descriptionStyle]}>
                            {description}
                        </Text>
                    )}
                    {error && (
                        <Text style={[styles.error, errorStyle]} testID={`${testID}-error`}>
                            {error}
                        </Text>
                    )}
                </View>
            )}
        </View>
    );
};

Checkbox.displayName = 'Checkbox';

export default Checkbox;
