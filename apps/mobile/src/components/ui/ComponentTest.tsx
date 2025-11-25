/**
 * Component Test Screen
 * Simple test to validate the new Button and Input components work properly
 */

import React, { useState } from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { MobileButton } from './Button/Button'
import { MobileInput } from './Input/Input'

export const ComponentTest: React.FC = () => {
    const [inputValue, setInputValue] = useState('')
    const [loading, setLoading] = useState(false)

    const handleButtonPress = () => {
        setLoading(true)
        setTimeout(() => setLoading(false), 2000)
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.section}>
                <MobileButton
                    variant="primary"
                    size="md"
                    onPress={handleButtonPress}
                    loading={loading}
                    fullWidth
                >
                    Primary Button
                </MobileButton>
            </View>

            <View style={styles.section}>
                <MobileButton
                    variant="secondary"
                    size="sm"
                    onPress={() => console.warn('Secondary pressed')}
                >
                    Secondary Small
                </MobileButton>
            </View>

            <View style={styles.section}>
                <MobileButton
                    variant="outline"
                    size="lg"
                    onPress={() => console.warn('Outline pressed')}
                >
                    Outline Large
                </MobileButton>
            </View>

            <View style={styles.section}>
                <MobileInput
                    label="Test Input"
                    placeholder="Enter text here"
                    value={inputValue}
                    onChangeText={setInputValue}
                    clearable
                    showCounter
                    maxLength={50}
                />
            </View>

            <View style={styles.section}>
                <MobileInput
                    label="Error Input"
                    placeholder="Error state"
                    error={true}
                    errorMessage="This field has an error"
                    variant="underlined"
                />
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    content: {
        padding: 20,
        gap: 20,
    },
    section: {
        paddingVertical: 10,
    },
})
