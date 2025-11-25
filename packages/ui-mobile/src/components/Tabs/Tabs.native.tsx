import React, { useReducer, useCallback, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Animated,
    Dimensions,
    LayoutChangeEvent,
    ViewStyle,
    TextStyle,
} from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { tokens } from '../../tokens';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import type { TabsProps, TabsState, TabsAction, TabsConfig, TabItem } from './Tabs.types';
import type { ComponentSize } from '../../types/component.types';

const defaultConfig: TabsConfig = {
    variant: 'default',
    size: 'medium',
    position: 'bottom',
    scrollable: false,
    showIndicator: true,
    showLabels: true,
    showIcons: true,
    hapticFeedback: true,
    animateIndicator: true,
    swipeEnabled: false, // Disabled by default to avoid conflicts with page swipes
};

// Map ComponentSize to typography token keys
const getSizeToken = (size: ComponentSize): keyof typeof tokens.typography.size => {
    switch (size) {
        case 'small': return 'sm'
        case 'medium': return 'md'
        case 'large': return 'lg'
        default: return 'md'
    }
};

function tabsReducer(state: TabsState, action: TabsAction): TabsState {
    switch (action.type) {
        case 'SELECT_TAB':
            return { ...state, selectedTab: action.payload };
        case 'SET_INDICATOR_POSITION':
            return { ...state, indicatorPosition: action.payload };
        case 'SET_TAB_WIDTH':
            return {
                ...state,
                tabWidths: { ...state.tabWidths, [action.payload.id]: action.payload.width },
            };
        default:
            return state;
    }
}

export const Tabs: React.FC<TabsProps> = ({
    items,
    value,
    onValueChange,
    variant = defaultConfig.variant,
    size = defaultConfig.size,
    position = defaultConfig.position,
    scrollable = defaultConfig.scrollable,
    showIndicator = defaultConfig.showIndicator,
    showLabels = defaultConfig.showLabels,
    showIcons = defaultConfig.showIcons,
    disabled = false,
    hapticFeedback = defaultConfig.hapticFeedback,
    animateIndicator = defaultConfig.animateIndicator,
    style,
    tabStyle,
    labelStyle,
    indicatorStyle,
    testID,
    accessibilityLabel,
}) => {
    const reducedMotion = useReducedMotion();
    const shouldAnimate = animateIndicator && !reducedMotion;

    const [state, dispatch] = useReducer(tabsReducer, {
        selectedTab: value ?? items[0]?.id ?? null,
        indicatorPosition: 0,
        tabWidths: {},
    });

    const indicatorAnimation = useRef(new Animated.Value(0)).current;
    const scrollViewRef = useRef<ScrollView>(null);
    const containerWidth = Dimensions.get('window').width;

    // Update selected tab when value prop changes
    React.useEffect(() => {
        if (value !== undefined && value !== state.selectedTab) {
            dispatch({ type: 'SELECT_TAB', payload: value });
        }
    }, [value, state.selectedTab]);

    // Animate indicator position
    React.useEffect(() => {
        if (shouldAnimate && showIndicator && state.selectedTab) {
            const selectedIndex = items.findIndex(item => item.id === state.selectedTab);
            if (selectedIndex >= 0) {
                const tabWidth = scrollable
                    ? state.tabWidths[state.selectedTab] ?? 100
                    : containerWidth / items.length;
                const indicatorPosition = selectedIndex * tabWidth + tabWidth / 2;

                Animated.spring(indicatorAnimation, {
                    toValue: indicatorPosition,
                    useNativeDriver: false,
                    tension: 100,
                    friction: 8,
                }).start();
            }
        }
    }, [state.selectedTab, shouldAnimate, showIndicator, items, scrollable, state.tabWidths, containerWidth, indicatorAnimation]);

    const handleTabPress = useCallback(
        (tab: TabItem) => {
            if (disabled || tab.disabled) return;

            // Haptic feedback
            if (hapticFeedback) {
                ReactNativeHapticFeedback.trigger('selection');
            }

            // Update selected tab
            dispatch({ type: 'SELECT_TAB', payload: tab.id });

            // Call onChange callback
            onValueChange?.(tab.id);
        },
        [disabled, hapticFeedback, onValueChange]
    );

    const handleTabLayout = useCallback(
        (tabId: string, event: LayoutChangeEvent) => {
            if (scrollable) {
                const { width } = event.nativeEvent.layout;
                dispatch({ type: 'SET_TAB_WIDTH', payload: { id: tabId, width } });
            }
        },
        [scrollable]
    );

    const getTabStyles = useCallback(
        (tab: TabItem, isSelected: boolean): { container: ViewStyle; text: TextStyle } => {
            const baseContainerStyle: ViewStyle = {
                flex: scrollable ? 0 : 1,
                minWidth: scrollable ? 80 : undefined,
                paddingHorizontal: tokens.spacing.md,
                paddingVertical: size === 'small' ? tokens.spacing.sm : tokens.spacing.md,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: disabled || tab.disabled ? tokens.opacity.disabled : 1,
            };

            const baseTextStyle: TextStyle = {
                fontSize: tokens.typography.size[getSizeToken(size)],
                fontWeight: isSelected ? tokens.typography.weight.semibold : tokens.typography.weight.medium,
                color: isSelected
                    ? tokens.colors.primary[600]
                    : tokens.colors.neutral[600],
                textAlign: 'center',
            };

            // Variant-specific styles
            switch (variant) {
                case 'outlined':
                    return {
                        container: {
                            ...baseContainerStyle,
                            backgroundColor: isSelected ? tokens.colors.neutral[100] : 'transparent',
                            borderRadius: tokens.borderRadius.md,
                        },
                        text: {
                            ...baseTextStyle,
                            color: isSelected ? tokens.colors.neutral[900] : tokens.colors.neutral[600],
                        },
                    };
                case 'ghost':
                    return {
                        container: {
                            ...baseContainerStyle,
                            backgroundColor: 'transparent',
                        },
                        text: {
                            ...baseTextStyle,
                            color: isSelected ? tokens.colors.primary[600] : tokens.colors.neutral[500],
                        },
                    };
                default: // primary
                    return {
                        container: baseContainerStyle,
                        text: baseTextStyle,
                    };
            }
        },
        [variant, size, disabled, scrollable]
    );

    const containerStyle: ViewStyle = {
        backgroundColor: tokens.colors.background.surface,
        borderTopWidth: position === 'bottom' ? 1 : 0,
        borderBottomWidth: position === 'top' ? 1 : 0,
        borderColor: tokens.colors.border.light,
        ...style,
    };

    const indicatorBarStyle: ViewStyle = {
        position: 'absolute',
        bottom: position === 'bottom' ? 0 : undefined,
        top: position === 'top' ? 0 : undefined,
        height: 2,
        backgroundColor: tokens.colors.primary[600],
        width: scrollable ? 40 : containerWidth / items.length,
        transform: [{ translateX: -20 }], // Center the indicator
        ...indicatorStyle,
    };

    const TabContent = (
        <View style={containerStyle}>
            <View
                style={{
                    flexDirection: 'row',
                    position: 'relative',
                }}
            >
                {items.map((tab) => {
                    const isSelected = state.selectedTab === tab.id;
                    const styles = getTabStyles(tab, isSelected);

                    return (
                        <TouchableOpacity
                            key={tab.id}
                            style={[styles.container, tabStyle]}
                            onPress={() => handleTabPress(tab)}
                            onLayout={(event) => handleTabLayout(tab.id, event)}
                            disabled={disabled || tab.disabled}
                            accessibilityRole="tab"
                            accessibilityLabel={tab.accessibilityLabel ?? tab.label}
                            accessibilityState={{ selected: isSelected, disabled: disabled || tab.disabled }}
                            testID={`${testID}-tab-${tab.id}`}
                        >
                            {showIcons && tab.icon && (
                                <Text style={{ fontSize: 20, marginBottom: showLabels ? 2 : 0 }}>
                                    {tab.icon}
                                </Text>
                            )}
                            {showLabels && (
                                <Text style={[styles.text, labelStyle]} numberOfLines={1}>
                                    {tab.label}
                                </Text>
                            )}
                            {tab.badge && (
                                <View
                                    style={{
                                        position: 'absolute',
                                        top: 4,
                                        right: 4,
                                        backgroundColor: tokens.colors.error[500],
                                        borderRadius: 10,
                                        minWidth: 20,
                                        height: 20,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        paddingHorizontal: 6,
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: tokens.colors.white,
                                            fontSize: 12,
                                            fontWeight: tokens.typography.weight.bold,
                                        }}
                                    >
                                        {typeof tab.badge === 'number' && tab.badge > 99 ? '99+' : tab.badge}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}

                {/* Animated Indicator */}
                {showIndicator && shouldAnimate && (
                    <Animated.View
                        style={[
                            indicatorBarStyle,
                            {
                                left: indicatorAnimation,
                            },
                        ]}
                    />
                )}

                {/* Static Indicator (for reduced motion) */}
                {showIndicator && !shouldAnimate && state.selectedTab && (
                    <View
                        style={[
                            indicatorBarStyle,
                            {
                                left: items.findIndex(item => item.id === state.selectedTab) * (containerWidth / items.length) + (containerWidth / items.length) / 2 - 20,
                            },
                        ]}
                    />
                )}
            </View>
        </View>
    );

    if (scrollable) {
        return (
            <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ flexGrow: 1 }}
                testID={testID}
                accessibilityLabel={accessibilityLabel}
                accessibilityRole="tablist"
            >
                {TabContent}
            </ScrollView>
        );
    }

    return (
        <View
            testID={testID}
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="tablist"
        >
            {TabContent}
        </View>
    );
};

Tabs.displayName = 'Tabs';

export default Tabs;
