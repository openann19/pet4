/**
 * Dynamic Type Wrapper Component (Mobile)
 *
 * Wrapper component that applies dynamic type scaling to its children.
 * Ensures text and layouts scale properly with system font size settings.
 *
 * Location: apps/mobile/src/components/a11y/DynamicTypeWrapper.tsx
 */

import React, { type ReactNode } from 'react'
import { View, type ViewStyle, type TextStyle } from 'react-native'
import { useDynamicType } from '../../hooks/use-dynamic-type'
import { createLogger } from '../../utils/logger'

const logger = createLogger('DynamicTypeWrapper')

/**
 * Dynamic type wrapper props
 */
export interface DynamicTypeWrapperProps {
    readonly children: ReactNode
    readonly style?: ViewStyle
    readonly enableLayoutReflow?: boolean
    readonly testID?: string
}

/**
 * Dynamic Type Wrapper Component
 *
 * @example
 * ```tsx
 * <DynamicTypeWrapper enableLayoutReflow={true}>
 *   <Text style={{ fontSize: 16 }}>This text scales with system settings</Text>
 * </DynamicTypeWrapper>
 * ```
 */
export function DynamicTypeWrapper({
    children,
    style,
    enableLayoutReflow = false,
    testID,
}: DynamicTypeWrapperProps): JSX.Element {
    const dynamicType = useDynamicType({
        enableLayoutReflow,
    })

    // Apply dynamic type styles
    const wrapperStyle: ViewStyle = {
        ...style,
        // Ensure minimum touch targets are maintained
        minHeight: dynamicType.minTouchTarget,
    }

    // Clone children and apply dynamic type scaling
    const scaledChildren = React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
            const childStyle = (child.props.style as TextStyle) ?? {}

            // Apply dynamic type scaling to text elements
            // Check if child type is Text component (string 'Text' or component with displayName)
            const childType = child.type
            const isTextElement =
                childType === 'Text' ||
                (typeof childType === 'object' &&
                    childType !== null &&
                    'displayName' in childType &&
                    typeof (childType as { displayName?: string }).displayName === 'string' &&
                    (childType as { displayName: string }).displayName === 'Text') ||
                (typeof childType === 'function' &&
                    'displayName' in childType &&
                    typeof (childType as { displayName?: string }).displayName === 'string' &&
                    (childType as { displayName: string }).displayName === 'Text')

            if (isTextElement) {
                const fontSize = childStyle.fontSize ?? dynamicType.baseSize
                const scaledFontSize = dynamicType.fontSize('base') * (fontSize / 16) // Scale relative to base

                return React.cloneElement(child, {
                    ...child.props,
                    style: {
                        ...childStyle,
                        fontSize: scaledFontSize,
                        lineHeight: dynamicType.lineHeight(scaledFontSize),
                    },
                })
            }
        }

        return child
    })

    logger.debug('Dynamic type wrapper rendered', {
        category: dynamicType.category,
        scaleFactor: dynamicType.scaleFactor,
        enableLayoutReflow,
    })

    return (
        <View style={wrapperStyle} testID={testID}>
            {scaledChildren ?? children}
        </View>
    )
}
