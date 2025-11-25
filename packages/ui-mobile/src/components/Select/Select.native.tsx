import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
    View,
    Text,
    Pressable,
    Modal,
    TextInput,
    ScrollView,
    type ViewStyle,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    interpolate,
} from '@petspark/motion';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import * as Haptics from 'expo-haptics';
import { ChevronDown, X, Check } from 'lucide-react-native';

import type {
    SelectProps,
    SelectTriggerProps,
    SelectModalProps,
    SelectOptionItemProps,
    SelectValue,
} from './Select.types';
import { createSelectStyles } from './Select.config';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { tokens } from '../../tokens';

const AnimatedView = Animated.View;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Select Trigger Component
 */
const SelectTrigger = React.memo<SelectTriggerProps>(({
    placeholder,
    selectedValues,
    options,
    multiSelect,
    maxDisplayItems,
    disabled,
    error,
    variant,
    size,
    style,
    textStyle,
    onPress,
    testID,
    accessibilityLabel,
    accessibilityHint,
}) => {
    const styles = useMemo(() => createSelectStyles(variant, size, disabled, error), [variant, size, disabled, error]);
    const isPressed = useSharedValue(false);
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = useCallback(() => {
        if (disabled) return;

        isPressed.value = true;
        scale.value = withSpring(0.98, {
            damping: 20,
            stiffness: 400,
        });

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, [disabled, isPressed, scale]);

    const handlePressOut = useCallback(() => {
        if (disabled) return;

        isPressed.value = false;
        scale.value = withSpring(1, {
            damping: 20,
            stiffness: 400,
        });
    }, [disabled, isPressed, scale]);

    const displayValue = useMemo(() => {
        if (selectedValues.length === 0) {
            return placeholder;
        }

        if (!multiSelect) {
            const option = options.find(opt => opt.value === selectedValues[0]);
            return option?.label ?? placeholder;
        }

        // Multi-select display logic
        if (selectedValues.length <= maxDisplayItems) {
            return selectedValues
                .map(value => options.find(opt => opt.value === value)?.label)
                .filter(Boolean)
                .join(', ');
        }

        return `${selectedValues.length} selected`;
    }, [selectedValues, options, multiSelect, maxDisplayItems, placeholder]);

    const isPlaceholder = selectedValues.length === 0;

    return (
        <AnimatedPressable
            style={[styles.trigger, style, animatedStyle]}
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled}
            testID={testID}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            accessibilityHint={accessibilityHint}
            accessibilityState={{
                disabled,
                expanded: false,
            }}
        >
            <Text
                style={[
                    styles.triggerText,
                    isPlaceholder && styles.placeholderText,
                    textStyle,
                ]}
                numberOfLines={1}
            >
                {displayValue}
            </Text>

            <ChevronDown
                size={20}
                style={styles.chevronIcon}
            />
        </AnimatedPressable>
    );
});

SelectTrigger.displayName = 'SelectTrigger';

/**
 * Select Option Item Component
 */
const SelectOptionItem = React.memo<SelectOptionItemProps>(({
    option,
    isSelected,
    multiSelect,
    showCheckmarks,
    onPress,
    testID,
}) => {
    const styles = useMemo(() => createSelectStyles(), []);
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePress = useCallback(() => {
        scale.value = withSpring(0.95, {
            damping: 20,
            stiffness: 400,
        }, () => {
            scale.value = withSpring(1, {
                damping: 20,
                stiffness: 400,
            });
        });

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
    }, [onPress, scale]);

    return (
        <AnimatedPressable
            style={[
                styles.optionItem,
                isSelected && styles.optionSelected,
                option.disabled && styles.optionDisabled,
                animatedStyle,
            ]}
            onPress={handlePress}
            disabled={option.disabled}
            testID={testID}
            accessibilityRole="button"
            accessibilityLabel={option.label}
            accessibilityState={{
                disabled: option.disabled,
                selected: isSelected,
            }}
        >
            {option.icon && (
                <View style={styles.optionIcon}>
                    {option.icon}
                </View>
            )}

            <View style={styles.optionContent}>
                <Text
                    style={[
                        styles.optionLabel,
                        isSelected && styles.optionLabelSelected,
                    ]}
                >
                    {option.label}
                </Text>

                {option.description && (
                    <Text style={styles.optionDescription}>
                        {option.description}
                    </Text>
                )}
            </View>

            {showCheckmarks && isSelected && (
                <Check
                    size={20}
                    style={styles.checkmarkIcon}
                />
            )}
        </AnimatedPressable>
    );
});

SelectOptionItem.displayName = 'SelectOptionItem';

/**
 * Select Modal Component
 */
const SelectModal = React.memo<SelectModalProps>(({
    visible,
    options,
    selectedValues,
    searchable,
    searchPlaceholder,
    emptyMessage,
    multiSelect,
    showCheckmarks,
    closeOnSelect,
    onSelect,
    onClose,
    testID,
}) => {
    const styles = useMemo(() => createSelectStyles(), []);
    const [searchQuery, setSearchQuery] = useState('');
    const reducedMotion = useReducedMotion();

    const backdropOpacity = useSharedValue(0);
    const contentTranslateY = useSharedValue(400);
    const contentScale = useSharedValue(0.95);
    const searchInputRef = useRef<TextInput>(null);

    // Animation values
    React.useEffect(() => {
        if (visible) {
            if (reducedMotion) {
                backdropOpacity.value = withTiming(1, { duration: 200 });
                contentTranslateY.value = withTiming(0, { duration: 200 });
                contentScale.value = withTiming(1, { duration: 200 });
            } else {
                backdropOpacity.value = withSpring(1, { damping: 20, stiffness: 300 });
                contentTranslateY.value = withSpring(0, { damping: 25, stiffness: 400 });
                contentScale.value = withSpring(1, { damping: 20, stiffness: 300 });
            }

            // Auto-focus search input
            if (searchable) {
                setTimeout(() => searchInputRef.current?.focus(), 300);
            }
        } else {
            backdropOpacity.value = withTiming(0, { duration: 150 });
            contentTranslateY.value = withTiming(400, { duration: 150 });
            contentScale.value = withTiming(0.95, { duration: 150 });
            setSearchQuery('');
        }
    }, [visible, reducedMotion, backdropOpacity, contentTranslateY, contentScale, searchable]);

    const backdropStyle = useAnimatedStyle(() => ({
        opacity: backdropOpacity.value,
    }));

    const contentStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: contentTranslateY.value },
            { scale: contentScale.value },
        ],
    }));

    // Filter options based on search
    const filteredOptions = useMemo(() => {
        if (!searchQuery.trim()) {
            return options;
        }

        const query = searchQuery.toLowerCase();
        return options.filter(option =>
            option.label.toLowerCase().includes(query) ||
            option.description?.toLowerCase().includes(query)
        );
    }, [options, searchQuery]);

    const handleSelect = useCallback((value: string) => {
        onSelect(value);

        if (!multiSelect && closeOnSelect) {
            onClose();
        }
    }, [onSelect, onClose, multiSelect, closeOnSelect]);

    const handleClose = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onClose();
    }, [onClose]);

    if (!visible) {
        return null;
    }

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={handleClose}
            statusBarTranslucent
        >
            <AnimatedView style={[styles.modalBackdrop, backdropStyle]}>
                <Pressable
                    style={{ flex: 1 }}
                    onPress={handleClose}
                    accessibilityLabel="Close select modal"
                />

                <AnimatedView style={[styles.modalContent, contentStyle]}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            Select {multiSelect ? 'Options' : 'Option'}
                        </Text>

                        <Pressable
                            style={styles.closeButton}
                            onPress={handleClose}
                            accessibilityRole="button"
                            accessibilityLabel="Close"
                        >
                            <X size={20} color={tokens.colors.text.secondary} />
                        </Pressable>
                    </View>

                    {searchable && (
                        <View style={styles.searchContainer}>
                            <TextInput
                                ref={searchInputRef}
                                style={styles.searchInput}
                                placeholder={searchPlaceholder}
                                placeholderTextColor={tokens.colors.text.placeholder}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                returnKeyType="search"
                                autoCapitalize="none"
                                autoCorrect={false}
                                clearButtonMode="while-editing"
                                testID={testID ? `${testID}-search` : undefined}
                            />
                        </View>
                    )}

                    <ScrollView
                        style={styles.optionsList}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        testID={testID ? `${testID}-list` : undefined}
                    >
                        {filteredOptions.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>
                                    {emptyMessage}
                                </Text>
                            </View>
                        ) : (
                            filteredOptions.map((option) => (
                                <SelectOptionItem
                                    key={option.value}
                                    option={option}
                                    isSelected={selectedValues.includes(option.value)}
                                    multiSelect={multiSelect}
                                    showCheckmarks={showCheckmarks}
                                    onPress={() => handleSelect(option.value)}
                                    {...(testID && { testID: `${testID}-option-${option.value}` })}
                                />
                            ))
                        )}
                    </ScrollView>
                </AnimatedView>
            </AnimatedView>
        </Modal>
    );
});

SelectModal.displayName = 'SelectModal';

/**
 * Native Select Component
 *
 * A comprehensive select/dropdown component optimized for mobile with:
 * - Modal-based selection for native feel
 * - Search functionality
 * - Multi-select support
 * - Accessibility features
 * - Smooth animations
 * - Haptic feedback
 * - Design system integration
 */
export const Select = React.memo<SelectProps>(({
    options,
    value,
    onSelectionChange,
    multiSelect = false,
    placeholder = 'Select an option...',
    label,
    required = false,
    disabled = false,
    error,
    helperText,
    variant = 'default',
    size = 'medium',
    searchable = false,
    searchPlaceholder = 'Search options...',
    maxDisplayItems = 2,
    showCheckmarks = true,
    emptyMessage = 'No options found',
    closeOnSelect = true,
    style,
    triggerStyle,
    triggerTextStyle,
    testID = 'select',
    accessibilityLabel,
    accessibilityHint,
}) => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const styles = useMemo(() => createSelectStyles(variant, size, disabled, Boolean(error)), [variant, size, disabled, error]);

    // Normalize selected values
    const selectedValues = useMemo(() => {
        if (!value) return [];
        return Array.isArray(value) ? value : [value];
    }, [value]);

    const handleOpenModal = useCallback(() => {
        if (disabled) return;

        setIsModalVisible(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, [disabled]);

    const handleCloseModal = useCallback(() => {
        setIsModalVisible(false);
    }, []);

    const handleSelectionChange = useCallback((optionValue: string) => {
        if (!onSelectionChange) return;

        if (multiSelect) {
            const newValues = selectedValues.includes(optionValue)
                ? selectedValues.filter(v => v !== optionValue)
                : [...selectedValues, optionValue];

            onSelectionChange(newValues);
        } else {
            onSelectionChange(optionValue);
        }

        Haptics.selectionAsync();
    }, [multiSelect, selectedValues, onSelectionChange]);

    // Accessibility
    const selectAccessibilityLabel = accessibilityLabel ||
        (label ? `${label} select` : 'Select option');

    const selectAccessibilityHint = accessibilityHint ||
        (multiSelect ? 'Double tap to open selection list. Multiple options can be selected.' :
            'Double tap to open selection list.');

    return (
        <View style={[styles.container, style]} testID={testID}>
            {label && (
                <Text style={styles.label}>
                    {label}
                    {required && (
                        <Text style={styles.requiredIndicator}> *</Text>
                    )}
                </Text>
            )}

            <SelectTrigger
                placeholder={placeholder}
                selectedValues={selectedValues}
                options={options}
                multiSelect={multiSelect}
                maxDisplayItems={maxDisplayItems}
                disabled={disabled}
                error={Boolean(error)}
                variant={variant}
                size={size}
                {...(triggerStyle !== undefined && { style: triggerStyle })}
                {...(triggerTextStyle !== undefined && { textStyle: triggerTextStyle })}
                onPress={handleOpenModal}
                testID={`${testID}-trigger`}
                accessibilityLabel={selectAccessibilityLabel}
                accessibilityHint={selectAccessibilityHint}
            />

            {(error || helperText) && (
                <Text style={styles.helperText}>
                    {error || helperText}
                </Text>
            )}

            <SelectModal
                visible={isModalVisible}
                options={options}
                selectedValues={selectedValues}
                searchable={searchable}
                searchPlaceholder={searchPlaceholder}
                emptyMessage={emptyMessage}
                multiSelect={multiSelect}
                showCheckmarks={showCheckmarks}
                closeOnSelect={closeOnSelect}
                onSelect={handleSelectionChange}
                onClose={handleCloseModal}
                testID={`${testID}-modal`}
            />
        </View>
    );
});

Select.displayName = 'Select';

export default Select;
