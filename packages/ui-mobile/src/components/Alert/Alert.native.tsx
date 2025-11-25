import React, { useReducer, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Animated,
    Dimensions,
    Modal,
    SafeAreaView,
    ViewStyle,
    TextStyle,
    PanResponder,
    Pressable,
} from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { tokens } from '../../tokens';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import type { AlertProps, AlertState, AlertAction as AlertActionType, AlertConfig } from './Alert.types';

const defaultConfig: AlertConfig = {
    variant: 'info',
    size: 'medium',
    dismissible: true,
    autoDismiss: false,
    autoDismissDelay: 5000,
    hapticFeedback: true,
    showIcon: true,
    animated: true,
    position: 'top',
};

const defaultIcons = {
    success: '✓',
    warning: '⚠️',
    error: '✕',
    info: 'ℹ️',
};

function alertReducer(state: AlertState, action: AlertActionType): AlertState {
    switch (action.type) {
        case 'SHOW':
            return { ...state, visible: true, dismissing: false, progress: 0 };
        case 'DISMISS':
            return { ...state, visible: false, dismissing: false, progress: 0 };
        case 'SET_DISMISSING':
            return { ...state, dismissing: action.payload };
        case 'SET_PROGRESS':
            return { ...state, progress: action.payload };
        default:
            return state;
    }
}

export const Alert: React.FC<AlertProps> = ({
    title,
    message,
    variant = defaultConfig.variant,
    size = defaultConfig.size,
    icon,
    dismissible = defaultConfig.dismissible,
    autoDismiss = defaultConfig.autoDismiss,
    autoDismissDelay = defaultConfig.autoDismissDelay,
    visible = false,
    onDismiss,
    actions = [],
    hapticFeedback = defaultConfig.hapticFeedback,
    showIcon = defaultConfig.showIcon,
    animated = defaultConfig.animated,
    position = defaultConfig.position,
    style,
    titleStyle,
    messageStyle,
    iconStyle,
    testID,
    accessibilityLabel,
}) => {
    const reducedMotion = useReducedMotion();
    const shouldAnimate = animated && !reducedMotion;

    const [state, dispatch] = useReducer(alertReducer, {
        visible: false,
        dismissing: false,
        progress: 0,
    });

    const slideAnimation = useRef(new Animated.Value(0)).current;
    const progressAnimation = useRef(new Animated.Value(0)).current;
    const scaleAnimation = useRef(new Animated.Value(0.8)).current;
    const autoDismissTimer = useRef<NodeJS.Timeout>();

    // Update visibility when visible prop changes
    useEffect(() => {
        if (visible && !state.visible) {
            handleShow();
        } else if (!visible && state.visible) {
            handleDismiss();
        }
    }, [visible, state.visible]);

    // Auto dismiss functionality
    useEffect(() => {
        if (state.visible && autoDismiss && autoDismissDelay > 0) {
            autoDismissTimer.current = setTimeout(() => {
                handleDismiss();
            }, autoDismissDelay);

            // Progress animation for auto dismiss
            if (shouldAnimate) {
                Animated.timing(progressAnimation, {
                    toValue: 1,
                    duration: autoDismissDelay,
                    useNativeDriver: false,
                }).start();
            }

            return () => {
                if (autoDismissTimer.current) {
                    clearTimeout(autoDismissTimer.current);
                }
                progressAnimation.setValue(0);
            };
        }
    }, [state.visible, autoDismiss, autoDismissDelay, shouldAnimate]);

    const handleShow = useCallback(async () => {
        dispatch({ type: 'SHOW' });

        // Haptic feedback based on variant
        if (hapticFeedback) {
            switch (variant) {
                case 'success':
                    await notificationAsync(NotificationFeedbackType.Success);
                    break;
                case 'error':
                    await notificationAsync(NotificationFeedbackType.Error);
                    break;
                case 'warning':
                    await notificationAsync(NotificationFeedbackType.Warning);
                    break;
                default:
                    await ReactNativeHapticFeedback.trigger('selection');
            }
        }

        if (shouldAnimate) {
            // Reset animations
            slideAnimation.setValue(position === 'top' ? -100 : position === 'bottom' ? 100 : 0);
            scaleAnimation.setValue(0.8);

            // Animate in
            Animated.parallel([
                Animated.spring(slideAnimation, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 100,
                    friction: 8,
                }),
                Animated.spring(scaleAnimation, {
                    toValue: 1,
                    useNativeDriver: true,
                    tension: 100,
                    friction: 8,
                }),
            ]).start();
        }
    }, [hapticFeedback, variant, shouldAnimate, position]);

    const handleDismiss = useCallback(async () => {
        if (state.dismissing) return;

        dispatch({ type: 'SET_DISMISSING', payload: true });

        if (shouldAnimate) {
            Animated.parallel([
                Animated.timing(slideAnimation, {
                    toValue: position === 'top' ? -100 : position === 'bottom' ? 100 : 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnimation, {
                    toValue: 0.8,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                dispatch({ type: 'DISMISS' });
                onDismiss?.();
            });
        } else {
            dispatch({ type: 'DISMISS' });
            onDismiss?.();
        }

        if (autoDismissTimer.current) {
            clearTimeout(autoDismissTimer.current);
        }
    }, [state.dismissing, shouldAnimate, position, onDismiss]);

    const getAlertStyles = useCallback((): {
        container: ViewStyle;
        title: TextStyle;
        message: TextStyle;
        icon: ViewStyle;
    } => {
        const baseContainer: ViewStyle = {
            borderRadius: tokens.borderRadius.lg,
            padding: tokens.spacing.md,
            marginHorizontal: tokens.spacing.md,
            flexDirection: 'row',
            alignItems: 'flex-start',
            minHeight: size === 'small' ? 60 : size === 'large' ? 100 : 80,
            shadowColor: tokens.colors.black,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
        };

        const baseTitle: TextStyle = {
            fontSize: tokens.typography.size[size],
            fontWeight: tokens.typography.weight.semibold,
            marginBottom: title ? tokens.spacing.xs : 0,
            flex: 1,
        };

        const baseMessage: TextStyle = {
            fontSize: size === 'small' ? tokens.typography.size.sm : tokens.typography.size.md,
            fontWeight: tokens.typography.weight.medium,
            lineHeight: tokens.typography.lineHeight.relaxed,
            flex: 1,
        };

        const baseIcon: ViewStyle = {
            width: 24,
            height: 24,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: tokens.spacing.sm,
            marginTop: 2,
        };

        // Variant-specific styles
        switch (variant) {
            case 'success':
                return {
                    container: {
                        ...baseContainer,
                        backgroundColor: tokens.colors.success[50],
                        borderWidth: 1,
                        borderColor: tokens.colors.success[200],
                    },
                    title: { ...baseTitle, color: tokens.colors.success[800] },
                    message: { ...baseMessage, color: tokens.colors.success[700] },
                    icon: baseIcon,
                };
            case 'warning':
                return {
                    container: {
                        ...baseContainer,
                        backgroundColor: tokens.colors.warning[50],
                        borderWidth: 1,
                        borderColor: tokens.colors.warning[200],
                    },
                    title: { ...baseTitle, color: tokens.colors.warning[800] },
                    message: { ...baseMessage, color: tokens.colors.warning[700] },
                    icon: baseIcon,
                };
            case 'error':
                return {
                    container: {
                        ...baseContainer,
                        backgroundColor: tokens.colors.error[50],
                        borderWidth: 1,
                        borderColor: tokens.colors.error[200],
                    },
                    title: { ...baseTitle, color: tokens.colors.error[800] },
                    message: { ...baseMessage, color: tokens.colors.error[700] },
                    icon: baseIcon,
                };
            default: // info
                return {
                    container: {
                        ...baseContainer,
                        backgroundColor: tokens.colors.info[50],
                        borderWidth: 1,
                        borderColor: tokens.colors.info[200],
                    },
                    title: { ...baseTitle, color: tokens.colors.info[800] },
                    message: { ...baseMessage, color: tokens.colors.info[700] },
                    icon: baseIcon,
                };
        }
    }, [variant, size, title]);

    // Pan responder for swipe to dismiss
    const panResponder = PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
            return Math.abs(gestureState.dy) > 10 && dismissible;
        },
        onPanResponderMove: (_, gestureState) => {
            if (shouldAnimate) {
                slideAnimation.setValue(gestureState.dy);
            }
        },
        onPanResponderRelease: (_, gestureState) => {
            const { dy, vy } = gestureState;
            const threshold = 50;

            if (Math.abs(dy) > threshold || Math.abs(vy) > 0.5) {
                handleDismiss();
            } else if (shouldAnimate) {
                Animated.spring(slideAnimation, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 100,
                    friction: 8,
                }).start();
            }
        },
    });

    if (!state.visible) {
        return null;
    }

    const styles = getAlertStyles();
    const displayIcon = showIcon ? (icon || defaultIcons[variant]) : null;

    const alertContent = (
        <Animated.View
            style={[
                styles.container,
                shouldAnimate && {
                    transform: [
                        { translateY: slideAnimation },
                        { scale: scaleAnimation },
                    ],
                },
                style,
            ]}
            {...(dismissible ? panResponder.panHandlers : {})}
            testID={testID}
            accessibilityLabel={accessibilityLabel || `${variant} alert: ${message}`}
            accessibilityRole="alert"
            accessibilityLiveRegion="assertive"
        >
            {displayIcon && (
                <View style={[styles.icon, iconStyle]}>
                    <Text style={{ fontSize: 16 }}>{displayIcon}</Text>
                </View>
            )}

            <View style={{ flex: 1 }}>
                {title && (
                    <Text style={[styles.title, titleStyle]}>
                        {title}
                    </Text>
                )}
                <Text style={[styles.message, messageStyle]}>
                    {message}
                </Text>

                {actions.length > 0 && (
                    <View style={{
                        flexDirection: 'row',
                        marginTop: tokens.spacing.sm,
                        gap: tokens.spacing.sm,
                    }}>
                        {actions.map((action, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={action.onPress}
                                disabled={action.disabled}
                                style={{
                                    paddingHorizontal: tokens.spacing.sm,
                                    paddingVertical: tokens.spacing.xs,
                                    borderRadius: tokens.borderRadius.md,
                                    backgroundColor: action.variant === 'default'
                                        ? tokens.colors.primary[600]
                                        : 'transparent',
                                    borderWidth: action.variant === 'outlined' ? 1 : 0,
                                    borderColor: tokens.colors.neutral[300],
                                    opacity: action.disabled ? tokens.opacity.disabled : 1,
                                }}
                                accessibilityRole="button"
                                accessibilityLabel={action.label}
                            >
                                <Text style={{
                                    color: action.variant === 'default'
                                        ? tokens.colors.white
                                        : tokens.colors.neutral[700],
                                    fontSize: tokens.typography.size.sm,
                                    fontWeight: tokens.typography.weight.medium,
                                }}>
                                    {action.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>

            {dismissible && (
                <TouchableOpacity
                    onPress={handleDismiss}
                    style={{
                        width: 32,
                        height: 32,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginLeft: tokens.spacing.xs,
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Dismiss alert"
                    testID={`${testID}-dismiss`}
                >
                    <Text style={{ fontSize: 18, color: tokens.colors.neutral[500] }}>×</Text>
                </TouchableOpacity>
            )}

            {/* Progress bar for auto dismiss */}
            {autoDismiss && shouldAnimate && (
                <Animated.View
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        height: 2,
                        backgroundColor: tokens.colors.primary[400],
                        width: progressAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%'],
                        }),
                    }}
                />
            )}
        </Animated.View>
    );

    // Render as overlay for top/center positions, inline for bottom
    if (position === 'center') {
        return (
            <Modal
                visible={state.visible}
                transparent
                animationType="none"
                onRequestClose={dismissible ? handleDismiss : undefined}
            >
                <Pressable
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        justifyContent: 'center',
                        alignItems: 'center',
                        paddingHorizontal: tokens.spacing.md,
                    }}
                    onPress={dismissible ? handleDismiss : undefined}
                >
                    <Pressable onPress={() => { }} style={{ width: '100%', maxWidth: 400 }}>
                        {alertContent}
                    </Pressable>
                </Pressable>
            </Modal>
        );
    }

    if (position === 'top') {
        return (
            <View
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 9999,
                }}
            >
                <SafeAreaView>
                    <View style={{ paddingTop: tokens.spacing.sm }}>
                        {alertContent}
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    // Bottom position (default)
    return (
        <View
            style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 9999,
            }}
        >
            <SafeAreaView>
                <View style={{ paddingBottom: tokens.spacing.sm }}>
                    {alertContent}
                </View>
            </SafeAreaView>
        </View>
    );
};

Alert.displayName = 'Alert';

export default Alert;
