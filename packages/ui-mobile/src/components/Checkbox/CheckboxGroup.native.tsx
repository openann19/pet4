import React, { createContext, useCallback, useState, useContext } from 'react';
import { View, Text } from 'react-native';
import { tokens } from '../../tokens';
import type { CheckboxGroupProps, CheckboxGroupContextValue } from './Checkbox.types';

const CheckboxGroupContext = createContext<CheckboxGroupContextValue | null>(null);

export const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
    children,
    value: controlledValue,
    defaultValue = [],
    onValueChange,
    disabled = false,
    required = false,
    error,
    name,
    containerStyle,
    testID,
}) => {
    const [internalValue, setInternalValue] = useState<readonly (string | number)[]>(
        controlledValue || defaultValue
    );

    const currentValue = controlledValue !== undefined ? controlledValue : internalValue;

    const handleValueChange = useCallback(
        (itemValue: string | number, checked: boolean) => {
            let newValue: (string | number)[];

            if (checked) {
                // Add value if not present
                newValue = currentValue.includes(itemValue)
                    ? [...currentValue]
                    : [...currentValue, itemValue];
            } else {
                // Remove value if present
                newValue = currentValue.filter(v => v !== itemValue);
            }

            if (controlledValue === undefined) {
                setInternalValue(newValue);
            }

            onValueChange?.(newValue);
        },
        [currentValue, controlledValue, onValueChange]
    );

    const contextValue: CheckboxGroupContextValue = {
        value: currentValue,
        onValueChange: handleValueChange,
        disabled,
        name,
    };

    return (
        <CheckboxGroupContext.Provider value={contextValue}>
            <View
                style={[{ gap: tokens.spacing.sm }, containerStyle]}
                testID={testID}
                accessibilityRole="group"
            >
                {children}

                {error && (
                    <Text
                        style={{
                            fontSize: tokens.typography.size.sm,
                            fontWeight: tokens.typography.weight.medium,
                            color: tokens.colors.error[600],
                            marginTop: tokens.spacing.xs,
                        }}
                        testID={`${testID}-error`}
                    >
                        {error}
                    </Text>
                )}
            </View>
        </CheckboxGroupContext.Provider>
    );
};

export const useCheckboxGroup = (): CheckboxGroupContextValue | null => {
    return useContext(CheckboxGroupContext);
};

CheckboxGroup.displayName = 'CheckboxGroup';
