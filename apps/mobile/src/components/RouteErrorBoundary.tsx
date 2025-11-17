/**
 * Route Error Boundary for Mobile
 *
 * Catches errors in screen components and displays a fallback UI.
 * Prevents the entire app from crashing when a screen encounters an error.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '@mobile/theme/colors';

interface RouteErrorBoundaryProps {
  children: React.ReactNode;
  onError?: (error: unknown) => void;
}

interface RouteErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class RouteErrorBoundary extends React.Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  constructor(props: RouteErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<RouteErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, _errorInfo: React.ErrorInfo): void {
    this.props.onError?.(error);
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  override render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <View style={styles.container} accessible accessibilityRole="alert">
          <View style={styles.content}>
            <Text style={styles.title} accessible accessibilityRole="header">
              Something went wrong
            </Text>
            <Text style={styles.message} accessible>
              An error occurred while loading this screen. Please try again.
            </Text>
            <TouchableOpacity
              onPress={this.handleRetry}
              accessible
              accessibilityLabel="Retry loading screen"
              accessibilityHint="Attempts to reload the screen"
              accessibilityRole="button"
              style={styles.button}
            >
              <Text style={styles.buttonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
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
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    backgroundColor: colors.primary || '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
