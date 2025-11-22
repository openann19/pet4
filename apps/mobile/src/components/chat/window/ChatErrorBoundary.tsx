import React from 'react'
import { View, Text } from 'react-native'
import { isTruthy } from '../../../utils/shared';

export interface ChatErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

class ChatErrorBoundary extends React.Component<ChatErrorBoundaryProps, State> {
  constructor(props: ChatErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // In mobile, route through any logger if available externally; avoid console
    this.props.onError?.(error, errorInfo)
  }

  override render(): React.ReactNode {
    if (isTruthy(this.state.hasError)) {
      if (isTruthy(this.props.fallback)) return this.props.fallback
      return (
        <View style={{ padding: 16 }}>
          <Text style={{ fontSize: 12, opacity: 0.7 }}>Something went wrong. UI recovered.</Text>
        </View>
      )
    }
    return this.props.children
  }
}

// Ensure named export picked up by parity script
export { ChatErrorBoundary }
