import React, { useReducer, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    View,
    Text,
    Modal,
    Animated,
    Dimensions,
    Keyboard,
    Pressable,
    PanResponder,
    KeyboardAvoidingView,
    Platform,
    LayoutChangeEvent,
    ViewStyle,
} from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '../../tokens';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import type { SheetProps, SheetState, SheetAction, SheetConfig, SheetSnapPoint } from './Sheet.types';

const defaultConfig: SheetConfig = {
    size: 'medium',
    draggable: true,
    dismissible: true,
    backdropDismiss: true,
    hapticFeedback: true,
    keyboardAvoidance: true,
    gestureEnabled: true,
    animated: true,
    springConfig: {
        tension: 100,
        friction: 8,
    },
};

const { height: screenHeight } = Dimensions.get('window');

function sheetReducer(state: SheetState, action: SheetAction): SheetState {
    switch (action.type) {
        case 'SHOW':
            return { ...state, visible: true };
        case 'HIDE':
            return { ...state, visible: false, isDragging: false };
        case 'SET_SNAP_INDEX':
            return { ...state, currentSnapIndex: action.payload };
        case 'SET_DRAGGING':
            return { ...state, isDragging: action.payload };
        case 'SET_KEYBOARD_HEIGHT':
            return { ...state, keyboardHeight: action.payload };
        case 'SET_CONTENT_HEIGHT':
            return { ...state, contentHeight: action.payload };
        default:
            return state;
    }
}

export const Sheet: React.FC<SheetProps> = ({
    children,
    visible = false,
    onClose,
    snapPoints = [{ height: screenHeight * 0.5 }, { height: screenHeight * 0.9 }],
    initialSnapIndex = 0,
    onSnapChange,
    size = defaultConfig.size,
    draggable = defaultConfig.draggable,
    dismissible = defaultConfig.dismissible,
    backdropDismiss = defaultConfig.backdropDismiss,
    hapticFeedback = defaultConfig.hapticFeedback,
    keyboardAvoidance = defaultConfig.keyboardAvoidance,
    gestureEnabled = defaultConfig.gestureEnabled,
    animated = defaultConfig.animated,
    springConfig = defaultConfig.springConfig,
    style,
    contentStyle,
    handleStyle,
    backdropStyle,
    testID,
    accessibilityLabel,
}) => {
    const reducedMotion = useReducedMotion();
    const shouldAnimate = animated && !reducedMotion;
    const insets = useSafeAreaInsets();

    const [state, dispatch] = useReducer(sheetReducer, {
        visible: false,
        currentSnapIndex: initialSnapIndex,
        isDragging: false,
        keyboardHeight: 0,
        contentHeight: 0,
    });

    const translateY = useRef(new Animated.Value(screenHeight)).current;
    const backdropOpacity = useRef(new Animated.Value(0)).current;
    const dragGestureRef = useRef<any>(null);

    // Memoize snap point heights
    const snapHeights = useMemo(
        () => snapPoints.map(point => point.height),
        [snapPoints]
    );

    // Update visibility when visible prop changes
    useEffect(() => {
        if (visible && !state.visible) {
            handleShow();
        } else if (!visible && state.visible) {
            handleHide();
        }
    }, [visible, state.visible]);

    // Keyboard handling
    useEffect(() => {
        if (!keyboardAvoidance) return;

        const showSubscription = Keyboard.addListener('keyboardDidShow', (event) => {
            dispatch({ type: 'SET_KEYBOARD_HEIGHT', payload: event.endCoordinates.height });
        });

        const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
            dispatch({ type: 'SET_KEYBOARD_HEIGHT', payload: 0 });
        });

        return () => {
            showSubscription?.remove();
            hideSubscription?.remove();
        };
    }, [keyboardAvoidance]);

    const snapToIndex = useCallback(
        (index: number, velocity = 0) => {
            const clampedIndex = Math.max(0, Math.min(index, snapHeights.length - 1));
            const targetHeight = snapHeights[clampedIndex];
            const targetY = screenHeight - targetHeight - state.keyboardHeight;

            dispatch({ type: 'SET_SNAP_INDEX', payload: clampedIndex });

            if (shouldAnimate) {
                Animated.spring(translateY, {
                    toValue: targetY,
                    velocity,
                    useNativeDriver: false,
                    tension: springConfig.tension,
                    friction: springConfig.friction,
                }).start();
            } else {
                translateY.setValue(targetY);
            }

            onSnapChange?.(clampedIndex, targetHeight);

            // Haptic feedback on snap
            if (hapticFeedback && clampedIndex !== state.currentSnapIndex) {
                ReactNativeHapticFeedback.trigger('selection');
            }
        },
        [snapHeights, screenHeight, state.keyboardHeight, shouldAnimate, springConfig, hapticFeedback, onSnapChange, state.currentSnapIndex]
    );

    const handleShow = useCallback(async () => {
        dispatch({ type: 'SHOW' });

        if (shouldAnimate) {
            // Reset animations
            translateY.setValue(screenHeight);
            backdropOpacity.setValue(0);

            // Animate in
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: screenHeight - snapHeights[initialSnapIndex] - state.keyboardHeight,
                    useNativeDriver: false,
                    tension: springConfig.tension,
                    friction: springConfig.friction,
                }),
                Animated.timing(backdropOpacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: false,
                }),
            ]).start();
        } else {
            translateY.setValue(screenHeight - snapHeights[initialSnapIndex] - state.keyboardHeight);
            backdropOpacity.setValue(1);
        }

        dispatch({ type: 'SET_SNAP_INDEX', payload: initialSnapIndex });
    }, [shouldAnimate, snapHeights, initialSnapIndex, state.keyboardHeight, springConfig]);

    const handleHide = useCallback(() => {
        if (shouldAnimate) {
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: screenHeight,
                    duration: 300,
                    useNativeDriver: false,
                }),
                Animated.timing(backdropOpacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: false,
                }),
            ]).start(() => {
                dispatch({ type: 'HIDE' });
                onClose?.();
            });
        } else {
            dispatch({ type: 'HIDE' });
            onClose?.();
        }
    }, [shouldAnimate, onClose]);

    const handleBackdropPress = useCallback(() => {
        if (backdropDismiss && dismissible) {
            handleHide();
        }
    }, [backdropDismiss, dismissible, handleHide]);

    // Pan gesture handling
    const panResponder = PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
            return draggable && gestureEnabled && Math.abs(gestureState.dy) > 10;
        },
        onPanResponderGrant: () => {
            dispatch({ type: 'SET_DRAGGING', payload: true });
        },
        onPanResponderMove: (_, gestureState) => {
            const currentY = screenHeight - snapHeights[state.currentSnapIndex] - state.keyboardHeight;
            const newY = currentY + gestureState.dy;

            // Constrain dragging within bounds
            const minY = screenHeight - snapHeights[snapHeights.length - 1] - state.keyboardHeight;
            const maxY = screenHeight;

            translateY.setValue(Math.max(minY, Math.min(maxY, newY)));
        },
        onPanResponderRelease: (_, gestureState) => {
            dispatch({ type: 'SET_DRAGGING', payload: false });

            const { dy, vy } = gestureState;
            const currentY = screenHeight - snapHeights[state.currentSnapIndex] - state.keyboardHeight;
            const finalY = currentY + dy;

            // Determine which snap point to animate to
            let targetSnapIndex = state.currentSnapIndex;

            if (Math.abs(vy) > 0.5) {
                // Fast gesture - snap based on velocity direction
                if (vy > 0) {
                    // Downward gesture - snap to lower snap point or dismiss
                    if (state.currentSnapIndex === 0 && dismissible) {
                        handleHide();
                        return;
                    }
                    targetSnapIndex = Math.max(0, state.currentSnapIndex - 1);
                } else {
                    // Upward gesture - snap to higher snap point
                    targetSnapIndex = Math.min(snapHeights.length - 1, state.currentSnapIndex + 1);
                }
            } else {
                // Slow gesture - snap to nearest snap point
                const distances = snapHeights.map((height, index) => {
                    const snapY = screenHeight - height - state.keyboardHeight;
                    return Math.abs(finalY - snapY);
                });
                targetSnapIndex = distances.indexOf(Math.min(...distances));

                // Check if dragged past dismiss threshold
                if (finalY > screenHeight - snapHeights[0] / 2 && dismissible) {
                    handleHide();
                    return;
                }
            }

            snapToIndex(targetSnapIndex, vy);
        },
    });

    const handleContentLayout = useCallback((event: LayoutChangeEvent) => {
        const { height } = event.nativeEvent.layout;
        dispatch({ type: 'SET_CONTENT_HEIGHT', payload: height });
    }, []);

    const getSheetStyles = useCallback((): {
        container: ViewStyle;
        content: ViewStyle;
        handle: ViewStyle;
        backdrop: ViewStyle;
    } => {
        return {
            container: {
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: tokens.colors.background.surface,
                borderTopLeftRadius: tokens.borderRadius.xl,
                borderTopRightRadius: tokens.borderRadius.xl,
                paddingBottom: insets.bottom,
                shadowColor: tokens.colors.black,
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.25,
                shadowRadius: 10,
                elevation: 10,
                ...style,
            },
            content: {
                flex: 1,
                padding: tokens.spacing.md,
                ...contentStyle,
            },
            handle: {
                width: 36,
                height: 4,
                backgroundColor: tokens.colors.neutral[300],
                borderRadius: 2,
                alignSelf: 'center',
                marginVertical: tokens.spacing.sm,
                ...handleStyle,
            },
            backdrop: {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                ...backdropStyle,
            },
        };
    }, [style, contentStyle, handleStyle, backdropStyle, insets.bottom]);

    if (!state.visible) {
        return null;
    }

    const styles = getSheetStyles();

    const KeyboardWrapper = keyboardAvoidance && Platform.OS === 'ios'
        ? KeyboardAvoidingView
        : View;

    return (
        <Modal
            visible={state.visible}
            transparent
            animationType="none"
            onRequestClose={dismissible ? handleHide : undefined}
            statusBarTranslucent
        >
            <View style={{ flex: 1 }}>
                {/* Backdrop */}
                <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
                    <Pressable
                        style={{ flex: 1 }}
                        onPress={handleBackdropPress}
                        accessibilityRole="button"
                        accessibilityLabel="Close sheet"
                    />
                </Animated.View>

                {/* Sheet */}
                <KeyboardWrapper
                    behavior="padding"
                    style={{ flex: 1, justifyContent: 'flex-end' }}
                >
                    <Animated.View
                        style={[
                            styles.container,
                            {
                                transform: [{ translateY }],
                                maxHeight: snapHeights[snapHeights.length - 1] + insets.bottom,
                            },
                        ]}
                        onLayout={handleContentLayout}
                        {...(draggable && gestureEnabled ? panResponder.panHandlers : {})}
                        testID={testID}
                        accessibilityLabel={accessibilityLabel}
                        accessibilityRole="dialog"
                        accessibilityModal
                    >
                        {/* Drag Handle */}
                        {draggable && (
                            <View
                                style={styles.handle}
                                accessibilityRole="button"
                                accessibilityLabel="Drag to resize"
                            />
                        )}

                        {/* Content */}
                        <View style={styles.content}>
                            {children}
                        </View>
                    </Animated.View>
                </KeyboardWrapper>
            </View>
        </Modal>
    );
};

Sheet.displayName = 'Sheet';

export default Sheet;
