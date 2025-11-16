import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { createLogger } from '@/lib/logger';
import { ArrowClockwise, Warning } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { Component } from 'react';


interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo });

    const logger = createLogger('ErrorBoundary');
    logger.error('Error Boundary caught an error', error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });

    if (typeof window !== 'undefined' && window.performance) {
      const perfData = window.performance.getEntriesByType('navigation')[0];
      logger.debug('Performance data at error', { perfData });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-background via-primary/5 to-accent/10">
          <Card className="max-w-md w-full p-8 text-center space-y-6 shadow-2xl">
            <div className="w-20 h-20 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
              <Warning size={40} className="text-destructive" weight="fill" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">Oops! Something went wrong</h1>
              <p className="text-muted-foreground">
                We encountered an unexpected error. Don't worry, your data is safe.
              </p>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <div className="text-left p-4 bg-muted rounded-lg">
                <p className="text-xs font-mono text-destructive break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <Button onClick={this.handleReset} className="gap-2" size="lg">
                <ArrowClockwise size={20} weight="bold" />
                Reload App
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              If this problem persists, please clear your browser cache and try again.
            </p>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
