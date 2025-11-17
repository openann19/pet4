'use client';

import React from 'react';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ChatErrorBoundary');

interface State {
  hasError: boolean;
  error: Error | null;
}

export interface ChatErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ChatErrorBoundary extends React.Component<ChatErrorBoundaryProps, State> {
  constructor(props: ChatErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    logger.error('Chat error boundary caught error', error, {
      componentStack: errorInfo.componentStack,
    });
    this.props.onError?.(error, errorInfo);
  }

  override render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="p-4 text-sm text-muted-foreground">Something went wrong. UI recovered.</div>
      );
    }
    return this.props.children;
  }
}
