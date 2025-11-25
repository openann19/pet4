import React, { useReducer, useCallback, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    Animated,
    TouchableOpacity,
    ViewStyle,
    TextStyle,
    NativeSyntheticEvent,
    TextInputFocusEventData,
    TextInputContentSizeChangeEventData,
} from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { tokens } from '../../tokens';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import type { TextareaProps, TextareaState, TextareaAction, TextareaConfig } from './Textarea.types';
import type { ComponentSize } from '../../types/component.types';

// Helper function to map component size to token size
const getSizeToken = (size: ComponentSize): keyof typeof tokens.typography.size => {
    switch (size) {
        case 'small':
            return 'sm';
        case 'medium':
            return 'md';
        case 'large':
            return 'lg';
        default:
            return 'md';
    }
};

const defaultConfig: TextareaConfig = {
    variant: 'default',
    size: 'medium',
    autoResize: true,
    showCharCount: true,
    hapticFeedback: true,
    animated: true,
    maxHeight: 200,
    minHeight: 80,
};

function textareaReducer(state: TextareaState, action: TextareaAction): TextareaState {
    switch (action.type) {
        case 'SET_VALUE':
            return { ...state, value: action.payload, charCount: action.payload.length };
        case 'SET_HEIGHT':
            return { ...state, height: action.payload };
        case 'SET_FOCUSED':
            return { ...state, isFocused: action.payload };
        case 'SET_CHAR_COUNT':
            return { ...state, charCount: action.payload };
        default:
            return state;
    }
}

export const Textarea: React.FC<TextareaProps> = ({
    value: controlledValue,
    onChangeText,
    label,
    error,
    hint,
    size = defaultConfig.size,
    disabled = false,
    required = false,
    autoResize = defaultConfig.autoResize,
    minHeight = defaultConfig.minHeight,
    maxHeight = defaultConfig.maxHeight,
    rows = 4,
    maxLength,
    showCharCount = defaultConfig.showCharCount,
    hapticFeedback = defaultConfig.hapticFeedback,
    animated = defaultConfig.animated,
    leftIcon,
    rightIcon,
    onLeftIconPress,
    onRightIconPress,
    onFocus,
    onBlur,
    containerStyle,
    inputStyle,
    labelStyle,
    errorStyle,
    hintStyle,
    charCountStyle,
    testID,
    ...textInputProps
}) => {
    const reducedMotion = useReducedMotion();
    const shouldAnimate = animated && !reducedMotion;

    const [state, dispatch] = useReducer(textareaReducer, {
        value: controlledValue ?? '',
        height: minHeight,
        isFocused: false,
        charCount: (controlledValue ?? '').length,
    });

    const inputRef = useRef<TextInput>(null);
    const focusAnimation = useRef(new Animated.Value(0)).current;
    const heightAnimation = useRef(new Animated.Value(minHeight)).current;

    // Calculate base height from rows
    const baseHeight = Math.max(
        minHeight,
        rows * (tokens.typography.lineHeight.normal * tokens.typography.size[getSizeToken(size)]) + tokens.spacing.md * 2
    );

    // Update internal state when controlled value changes
    useEffect(() => {
        if (controlledValue !== undefined && controlledValue !== state.value) {
            dispatch({ type: 'SET_VALUE', payload: controlledValue });
        }
    }, [controlledValue, state.value]);

    // Animate focus state
    useEffect(() => {
        if (shouldAnimate) {
            Animated.timing(focusAnimation, {
                toValue: state.isFocused ? 1 : 0,
                duration: 200,
                useNativeDriver: false,
            }).start();
        }
    }, [state.isFocused, shouldAnimate, focusAnimation]);

    // Animate height changes
    useEffect(() => {
        if (shouldAnimate && autoResize) {
            Animated.timing(heightAnimation, {
                toValue: state.height,
                duration: 150,
                useNativeDriver: false,
            }).start();
        }
    }, [state.height, shouldAnimate, autoResize, heightAnimation]);

    const handleFocus = useCallback(
        (event: NativeSyntheticEvent<TextInputFocusEventData>) => {
            dispatch({ type: 'SET_FOCUSED', payload: true });

            if (hapticFeedback) {
                ReactNativeHapticFeedback.trigger('selection');
            }

            onFocus?.(event);
        },
        [hapticFeedback, onFocus]
    );

    const handleBlur = useCallback(
        (event: NativeSyntheticEvent<TextInputFocusEventData>) => {
            dispatch({ type: 'SET_FOCUSED', payload: false });
            onBlur?.(event);
        },
        [onBlur]
    );

    const handleTextChange = useCallback(
        (text: string) => {
            // Apply maxLength constraint
            const trimmedText = maxLength ? text.slice(0, maxLength) : text;

            dispatch({ type: 'SET_VALUE', payload: trimmedText });
            onChangeText?.(trimmedText);
        },
        [maxLength, onChangeText]
    );

    const handleContentSizeChange = useCallback(
        (event: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
            if (!autoResize) return;

            const { height: contentHeight } = event.nativeEvent.contentSize;
            const newHeight = Math.min(
                Math.max(contentHeight + tokens.spacing.sm * 2, minHeight),
                maxHeight
            );

            dispatch({ type: 'SET_HEIGHT', payload: newHeight });
        },
        [autoResize, minHeight, maxHeight]
    );

    const handleIconPress = useCallback(
        (onPress?: () => void) => {
            if (hapticFeedback) {
                ReactNativeHapticFeedback.trigger('selection');
            }
            onPress?.();
        },
        [hapticFeedback]
    );

    const getTextareaStyles = useCallback((): {
        container: ViewStyle;
        inputContainer: ViewStyle;
        input: TextStyle;
        label: TextStyle;
        error: TextStyle;
        hint: TextStyle;
        charCount: TextStyle;
    } => {
        const hasError = Boolean(error);
        const baseInputHeight = autoResize ? state.height : baseHeight;

        const baseContainer: ViewStyle = {
            marginBottom: tokens.spacing.md,
        };

        const baseInputContainer: ViewStyle = {
            borderWidth: 1,
            borderRadius: tokens.borderRadius.md,
            backgroundColor: tokens.colors.background.input,
            minHeight: baseInputHeight,
            flexDirection: 'row',
            alignItems: 'flex-start',
            paddingHorizontal: tokens.spacing.sm,
            paddingVertical: tokens.spacing.xs,
        };

        const baseInput: TextStyle = {
            flex: 1,
            fontSize: tokens.typography.size[getSizeToken(size)],
            fontWeight: tokens.typography.weight.medium,
            lineHeight: tokens.typography.lineHeight.normal,
            color: tokens.colors.text.primary,
            minHeight: baseInputHeight - tokens.spacing.xs * 2,
            textAlignVertical: 'top',
            paddingVertical: 0, // Remove default padding
        };

        const baseLabel: TextStyle = {
            fontSize: tokens.typography.size.sm,
            fontWeight: tokens.typography.weight.medium,
            color: tokens.colors.text.secondary,
            marginBottom: tokens.spacing.xs,
        };

        const baseError: TextStyle = {
            fontSize: tokens.typography.size.sm,
            fontWeight: tokens.typography.weight.medium,
            color: tokens.colors.error[600],
            marginTop: tokens.spacing.xs,
        };

        const baseHint: TextStyle = {
            fontSize: tokens.typography.size.sm,
            fontWeight: tokens.typography.weight.normal,
            color: tokens.colors.text.tertiary,
            marginTop: tokens.spacing.xs,
        };

        const baseCharCount: TextStyle = {
            fontSize: tokens.typography.size.xs,
            fontWeight: tokens.typography.weight.medium,
            color: tokens.colors.text.tertiary,
            textAlign: 'right',
            marginTop: tokens.spacing.xs,
        };

        // State-specific styles
        if (hasError) {
            return {
                container: baseContainer,
                inputContainer: {
                    ...baseInputContainer,
                    borderColor: tokens.colors.error[300],
                    backgroundColor: tokens.colors.error[50],
                },
                input: baseInput,
                label: { ...baseLabel, color: tokens.colors.error[600] },
                error: baseError,
                hint: baseHint,
                charCount: { ...baseCharCount, color: tokens.colors.error[500] },
            };
        }

        if (state.isFocused) {
            return {
                container: baseContainer,
                inputContainer: {
                    ...baseInputContainer,
                    borderColor: tokens.colors.primary[400],
                    backgroundColor: tokens.colors.primary[50],
                    shadowColor: tokens.colors.primary[400],
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                    elevation: 2,
                },
                input: baseInput,
                label: { ...baseLabel, color: tokens.colors.primary[600] },
                error: baseError,
                hint: baseHint,
                charCount: baseCharCount,
            };
        }

        if (disabled) {
            return {
                container: baseContainer,
                inputContainer: {
                    ...baseInputContainer,
                    borderColor: tokens.colors.border.disabled,
                    backgroundColor: tokens.colors.background.disabled,
                    opacity: tokens.opacity.disabled,
                },
                input: { ...baseInput, color: tokens.colors.text.disabled },
                label: { ...baseLabel, color: tokens.colors.text.disabled },
                error: baseError,
                hint: { ...baseHint, color: tokens.colors.text.disabled },
                charCount: { ...baseCharCount, color: tokens.colors.text.disabled },
            };
        }

        // Default styles
        return {
            container: baseContainer,
            inputContainer: {
                ...baseInputContainer,
                borderColor: tokens.colors.border.input,
            },
            input: baseInput,
            label: baseLabel,
            error: baseError,
            hint: baseHint,
            charCount: baseCharCount,
        };
    }, [size, state.isFocused, state.height, error, disabled, autoResize, baseHeight]);

    const styles = getTextareaStyles();
    const currentValue = controlledValue ?? state.value;
    const isOverLimit = maxLength ? state.charCount > maxLength : false;

    const AnimatedView = shouldAnimate ? Animated.View : View;
    const inputContainerHeight = autoResize && shouldAnimate
        ? { height: heightAnimation }
        : { height: autoResize ? state.height : baseHeight };

    return (
        <View style={[styles.container, containerStyle]} testID={testID}>
            {/* Label */}
            {label && (
                <Text style={[styles.label, labelStyle]}>
                    {label}
                    {required && (
                        <Text style={{ color: tokens.colors.error[500] }}> *</Text>
                    )}
                </Text>
            )}

            {/* Input Container */}
            <AnimatedView
                style={[
                    styles.inputContainer,
                    inputContainerHeight,
                    shouldAnimate && {
                        borderColor: focusAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [
                                error ? tokens.colors.error[300] : tokens.colors.border.input,
                                tokens.colors.primary[400],
                            ],
                        }),
                    },
                ]}
            >
                {/* Left Icon */}
                {leftIcon && (
                    <TouchableOpacity
                        onPress={() => handleIconPress(onLeftIconPress)}
                        style={{
                            marginRight: tokens.spacing.xs,
                            marginTop: tokens.spacing.xs,
                        }}
                        accessibilityRole="button"
                        accessibilityLabel="Left icon"
                        testID={`${testID}-left-icon`}
                    >
                        <Text style={{ fontSize: 20 }}>{leftIcon}</Text>
                    </TouchableOpacity>
                )}

                {/* Text Input */}
                <TextInput
                    ref={inputRef}
                    value={currentValue}
                    onChangeText={handleTextChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onContentSizeChange={autoResize ? handleContentSizeChange : undefined}
                    multiline
                    textAlignVertical="top"
                    scrollEnabled={!autoResize || state.height >= maxHeight}
                    editable={!disabled}
                    maxLength={maxLength}
                    style={[styles.input, inputStyle]}
                    placeholderTextColor={tokens.colors.text.placeholder}
                    accessibilityLabel={label}
                    accessibilityHint={hint}
                    accessibilityState={{
                        disabled,
                        expanded: state.isFocused,
                    }}
                    testID={`${testID}-input`}
                    {...textInputProps}
                />

                {/* Right Icon */}
                {rightIcon && (
                    <TouchableOpacity
                        onPress={() => handleIconPress(onRightIconPress)}
                        style={{
                            marginLeft: tokens.spacing.xs,
                            marginTop: tokens.spacing.xs,
                        }}
                        accessibilityRole="button"
                        accessibilityLabel="Right icon"
                        testID={`${testID}-right-icon`}
                    >
                        <Text style={{ fontSize: 20 }}>{rightIcon}</Text>
                    </TouchableOpacity>
                )}
            </AnimatedView>

            {/* Bottom Row: Hint and Character Count */}
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
            }}>
                {/* Error or Hint */}
                <View style={{ flex: 1 }}>
                    {error ? (
                        <Text style={[styles.error, errorStyle]} testID={`${testID}-error`}>
                            {error}
                        </Text>
                    ) : hint ? (
                        <Text style={[styles.hint, hintStyle]} testID={`${testID}-hint`}>
                            {hint}
                        </Text>
                    ) : null}
                </View>

                {/* Character Count */}
                {showCharCount && maxLength && (
                    <Text
                        style={[
                            styles.charCount,
                            isOverLimit && { color: tokens.colors.error[500] },
                            charCountStyle,
                        ]}
                        testID={`${testID}-char-count`}
                    >
                        {state.charCount}/{maxLength}
                    </Text>
                )}
            </View>
        </View>
    );
};

Textarea.displayName = 'Textarea';

export default Textarea;
