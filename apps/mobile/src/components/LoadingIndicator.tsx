import React from 'react'
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native'
import { colors } from '@mobile/theme/colors'

interface LoadingIndicatorProps {
    message?: string
    size?: 'small' | 'large'
}

export function LoadingIndicator({
    message,
    size = 'large',
}: LoadingIndicatorProps): React.JSX.Element {
    return (
        <View style={styles.container}>
            <ActivityIndicator size={size} color={colors.primary} />
            {message && <Text style={styles.message}>{message}</Text>}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: colors.background,
    },
    message: {
        marginTop: 16,
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
    },
})
