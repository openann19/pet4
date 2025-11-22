import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { colors } from '@mobile/theme/colors'

interface ErrorScreenProps {
    error?: Error | string
    onRetry?: () => void
    title?: string
    message?: string
}

export function ErrorScreen({
    error,
    onRetry,
    title = 'Oops! Something went wrong',
    message = 'We encountered an unexpected error. Please try again.',
}: ErrorScreenProps): React.JSX.Element {
    const errorMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : message

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.message}>{errorMessage}</Text>
                {onRetry && (
                    <TouchableOpacity style={styles.retryButton} onPress={onRetry} accessible accessibilityLabel="Retry">
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    content: {
        maxWidth: 400,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 24,
    },
    retryButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        minWidth: 120,
        alignItems: 'center',
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
})
