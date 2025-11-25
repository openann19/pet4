/**
 * Label Stories
 * Storybook stories for the mobile Label component
 */

import type { Meta, StoryObj } from '@storybook/react';
import { View, Text } from 'react-native';
import { Label, FieldWrapper } from './Label.native';

const meta: Meta<typeof Label> = {
    title: 'UI Mobile/Label',
    component: Label,
    parameters: {
        docs: {
            description: {
                component: 'A mobile-first label component with accessibility support, design system integration, and form field association.',
            },
        },
    },
    argTypes: {
        variant: {
            control: { type: 'select' },
            options: ['default', 'destructive', 'muted', 'success', 'warning'],
        },
        size: {
            control: { type: 'select' },
            options: ['xs', 'sm', 'md', 'lg', 'xl'],
        },
        required: {
            control: { type: 'boolean' },
        },
        optional: {
            control: { type: 'boolean' },
        },
        disabled: {
            control: { type: 'boolean' },
        },
        interactive: {
            control: { type: 'boolean' },
        },
        enableHaptics: {
            control: { type: 'boolean' },
        },
        children: {
            control: { type: 'text' },
        },
        description: {
            control: { type: 'text' },
        },
    },
    args: {
        children: 'Sample Label',
        variant: 'default',
        size: 'medium',
        required: false,
        optional: false,
        disabled: false,
        interactive: false,
        enableHaptics: true,
    },
};

export default meta;

type Story = StoryObj<typeof Label>;

/**
 * Default label
 */
export const Default: Story = {};

/**
 * All size variations
 */
export const Sizes: Story = {
    render: () => (
        <View style={{ padding: 16, gap: 16 }}>
            <Label size="xs">Extra Small Label</Label>
            <Label size="sm">Small Label</Label>
            <Label size="md">Medium Label</Label>
            <Label size="lg">Large Label</Label>
            <Label size="xl">Extra Large Label</Label>
        </View>
    ),
};

/**
 * Color variants
 */
export const Variants: Story = {
    render: () => (
        <View style={{ padding: 16, gap: 16 }}>
            <Label variant="default">Default Label</Label>
            <Label variant="muted">Muted Label</Label>
            <Label variant="success">Success Label</Label>
            <Label variant="warning">Warning Label</Label>
            <Label variant="destructive">Error Label</Label>
        </View>
    ),
};

/**
 * Required and optional indicators
 */
export const Indicators: Story = {
    render: () => (
        <View style={{ padding: 16, gap: 16 }}>
            <Label>Normal Label</Label>
            <Label required>Required Field *</Label>
            <Label optional>Optional Field (optional)</Label>
            <Label required optional>Required Priority (shows only *)</Label>
        </View>
    ),
};

/**
 * With descriptions
 */
export const WithDescriptions: Story = {
    render: () => (
        <View style={{ padding: 16, gap: 24 }}>
            <Label
                description="This is a helpful description text"
            >
                Label with Description
            </Label>
            <Label
                required
                description="This field is required and has additional information"
            >
                Required Field
            </Label>
            <Label
                variant="success"
                size="lg"
                description="A larger success variant with description"
            >
                Success Label
            </Label>
        </View>
    ),
};

/**
 * Interactive labels
 */
export const Interactive: Story = {
    render: () => (
        <View style={{ padding: 16, gap: 16 }}>
            <Label
                interactive
                onPress={() => { /* Label pressed */ }}
            >
                Clickable Label
            </Label>
            <Label
                interactive
                enableHaptics
                variant="success"
                onPress={() => { /* Haptic label pressed */ }}
            >
                Label with Haptics
            </Label>
            <Label
                interactive
                disabled
                onPress={() => { /* This should not fire */ }}
            >
                Disabled Interactive Label
            </Label>
        </View>
    ),
};

/**
 * Disabled states
 */
export const Disabled: Story = {
    render: () => (
        <View style={{ padding: 16, gap: 16 }}>
            <Label disabled>Disabled Label</Label>
            <Label disabled required>Disabled Required Label</Label>
            <Label disabled description="Disabled with description">
                Disabled with Description
            </Label>
            <Label disabled variant="success" interactive>
                Disabled Interactive Label
            </Label>
        </View>
    ),
};

/**
 * Real form examples using FieldWrapper
 */
export const FormExamples: Story = {
    render: () => (
        <View style={{ padding: 16, gap: 24 }}>
            <FieldWrapper
                label="Email Address"
                required
                description="Enter your email address for notifications"
            >
                <View style={{
                    height: 44,
                    borderWidth: 1,
                    borderColor: '#ccc',
                    borderRadius: 8,
                    justifyContent: 'center',
                    paddingHorizontal: 12,
                }}>
                    <Text style={{ color: '#666' }}>email@example.com</Text>
                </View>
            </FieldWrapper>

            <FieldWrapper
                label="Password"
                required
                error="Password must be at least 8 characters"
            >
                <View style={{
                    height: 44,
                    borderWidth: 1,
                    borderColor: '#ef4444',
                    borderRadius: 8,
                    justifyContent: 'center',
                    paddingHorizontal: 12,
                }}>
                    <Text style={{ color: '#666' }}>••••••••</Text>
                </View>
            </FieldWrapper>

            <FieldWrapper
                label="Phone Number"
                optional
                success="Valid phone number format"
            >
                <View style={{
                    height: 44,
                    borderWidth: 1,
                    borderColor: '#22c55e',
                    borderRadius: 8,
                    justifyContent: 'center',
                    paddingHorizontal: 12,
                }}>
                    <Text style={{ color: '#666' }}>(555) 123-4567</Text>
                </View>
            </FieldWrapper>

            <FieldWrapper
                label="Bio"
                optional
                warning="Consider keeping this under 200 characters"
                spacing="lg"
            >
                <View style={{
                    height: 88,
                    borderWidth: 1,
                    borderColor: '#eab308',
                    borderRadius: 8,
                    padding: 12,
                }}>
                    <Text style={{ color: '#666' }}>Tell us about yourself...</Text>
                </View>
            </FieldWrapper>
        </View>
    ),
};

/**
 * Complex layout examples
 */
export const ComplexLayouts: Story = {
    render: () => (
        <View style={{ padding: 16, gap: 24 }}>
            {/* Inline form */}
            <View>
                <Label size="lg" variant="default" style={{ marginBottom: 16 }}>
                    Personal Information
                </Label>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                        <FieldWrapper label="First Name" required>
                            <View style={{
                                height: 40,
                                borderWidth: 1,
                                borderColor: '#ccc',
                                borderRadius: 6,
                                justifyContent: 'center',
                                paddingHorizontal: 8,
                            }}>
                                <Text style={{ color: '#666', fontSize: 14 }}>John</Text>
                            </View>
                        </FieldWrapper>
                    </View>
                    <View style={{ flex: 1 }}>
                        <FieldWrapper label="Last Name" required>
                            <View style={{
                                height: 40,
                                borderWidth: 1,
                                borderColor: '#ccc',
                                borderRadius: 6,
                                justifyContent: 'center',
                                paddingHorizontal: 8,
                            }}>
                                <Text style={{ color: '#666', fontSize: 14 }}>Doe</Text>
                            </View>
                        </FieldWrapper>
                    </View>
                </View>
            </View>

            {/* Nested sections */}
            <View>
                <Label size="lg" variant="success" style={{ marginBottom: 12 }}>
                    Preferences
                </Label>
                <View style={{ paddingLeft: 16, gap: 16 }}>
                    <FieldWrapper
                        label="Notifications"
                        description="Choose how you want to be notified"
                    >
                        <View style={{ gap: 8 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <View style={{ width: 20, height: 20, borderWidth: 1, borderColor: '#22c55e', backgroundColor: '#22c55e', borderRadius: 4 }} />
                                <Label size="sm">Email notifications</Label>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <View style={{ width: 20, height: 20, borderWidth: 1, borderColor: '#ccc', borderRadius: 4 }} />
                                <Label size="sm">SMS notifications</Label>
                            </View>
                        </View>
                    </FieldWrapper>
                </View>
            </View>
        </View>
    ),
};

/**
 * Accessibility showcase
 */
export const Accessibility: Story = {
    render: () => (
        <View style={{ padding: 16, gap: 24 }}>
            <Label
                accessibilityLabel="Custom screen reader text for this label"
                description="This label has a custom accessibility label"
            >
                Visual Label Text
            </Label>

            <Label
                nativeID="associated-field"
                required
                description="This label can be associated with form controls via nativeID"
            >
                Form Association Label
            </Label>

            <Label
                interactive
                accessibilityHint="Tap to show more information about this field"
                onPress={() => { /* Info pressed */ }}
            >
                Interactive Label with Hint
            </Label>

            <FieldWrapper
                label="Screen Reader Optimized Field"
                description="All messages and states are properly announced"
                error="Error messages are announced with proper live region"
            >
                <View style={{
                    height: 44,
                    borderWidth: 2,
                    borderColor: '#ef4444',
                    borderRadius: 8,
                    justifyContent: 'center',
                    paddingHorizontal: 12,
                }}>
                    <Text style={{ color: '#666' }}>Invalid input</Text>
                </View>
            </FieldWrapper>
        </View>
    ),
};
