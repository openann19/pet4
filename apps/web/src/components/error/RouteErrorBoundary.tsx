import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { createLogger } from '@/lib/logger';
import { Warning, ArrowClockwise, House } from '@phosphor-icons/react';
import type { ErrorInfo, ReactNode } from 'react';
import { Component } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { NavigationError } from '@/lib/navigation-error-types';

const logger = createLogger('RouteErrorBoundary');

interface RouteErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo, errorType: NavigationError['type']) => void;
    onReset?: () => void;
}

interface RouteErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorType: NavigationError['type'] | null;
    fromPath: string | null;
    toPath: string | null;
}

class RouteErrorBoundaryClass extends Component<
    RouteErrorBoundaryProps & { location: string; navigate: (path: string) => void },
    RouteErrorBoundaryState
> {
    constructor(
        props: RouteErrorBoundaryProps & { location: string; navigate: (path: string) => void }
    ) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorType: null,
            fromPath: null,
            toPath: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<RouteErrorBoundaryState> {
        const errorType = detectErrorType(error);
        return {
            hasError: true,
            error,
            errorType,
        };
    }

    override componentDidUpdate(
        prevProps: RouteErrorBoundaryProps & { location: string; navigate: (path: string) => void }
    ): void {
        if (prevProps.location !== this.props.location && this.state.hasError) {
            this.resetError();
        }
    }

    override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        const errorType = detectErrorType(error);
        const fromPath: string = this.state.fromPath ?? this.props.location;
        const toPath: string = this.state.toPath ?? this.props.location;

        const navigationError: NavigationError = {
            type: errorType,
            error,
            fromPath,
            toPath,
            timestamp: new Date().toISOString(),
            componentStack: errorInfo.componentStack ?? undefined,
        };

        logger.error('Route navigation error', error, {
            errorType,
            fromPath,
            toPath,
            componentStack: errorInfo.componentStack ?? undefined,
            navigationError,
        });

        this.setState({
            errorType,
            fromPath,
            toPath,
        });

        this.props.onError?.(error, errorInfo, errorType);
    }

    resetError = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorType: null,
            fromPath: null,
            toPath: null,
        });

        this.props.onReset?.();
    };

    handleRetry = (): void => {
        this.resetError();
    };

    handleGoHome = (): void => {
        this.props.navigate('/');
        this.resetError();
    };

    handleHardReload = (): void => {
        window.location.reload();
    };

    override render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            const { error, errorType } = this.state;

            return (
                <div className="flex min-h-screen items-center justify-center bg-background p-6">
                    <div className="max-w-md w-full space-y-6">
                        <Alert variant="destructive">
                            <Warning size={20} />
                            <AlertTitle>Navigation Error</AlertTitle>
                            <AlertDescription>
                                {getErrorMessage(errorType)}
                            </AlertDescription>
                        </Alert>

                        {error && import.meta.env.DEV && (
                            <div className="bg-card border rounded-lg p-4">
                                <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                                    Error Details:
                                </h3>
                                <pre className="text-xs text-destructive bg-muted/50 p-3 rounded border overflow-auto max-h-32">
                                    {error.message}
                                    {error.stack && `\n\n${error.stack}`}
                                </pre>
                                {this.state.fromPath && this.state.toPath && (
                                    <div className="mt-2 text-xs text-muted-foreground">
                                        <p>From: {this.state.fromPath}</p>
                                        <p>To: {this.state.toPath}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex flex-col gap-3">
                            {errorType === 'chunk-load-error' ? (
                                <Button onClick={this.handleHardReload} variant="default" className="w-full">
                                    <ArrowClockwise size={16} className="mr-2" />
                                    Hard Reload Page
                                </Button>
                            ) : (
                                <Button onClick={this.handleRetry} variant="default" className="w-full">
                                    <ArrowClockwise size={16} className="mr-2" />
                                    Try Again
                                </Button>
                            )}
                            <Button onClick={this.handleGoHome} variant="outline" className="w-full">
                                <House size={16} className="mr-2" />
                                Go Home
                            </Button>
                            {errorType !== 'chunk-load-error' && (
                                <Button onClick={this.handleHardReload} variant="ghost" className="w-full">
                                    <ArrowClockwise size={16} className="mr-2" />
                                    Refresh Page
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

function detectErrorType(error: Error): NavigationError['type'] {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    if (message.includes('chunk') || message.includes('loading chunk') || name === 'chunkloaderror') {
        return 'chunk-load-error';
    }

    if (message.includes('hydration') || message.includes('hydration failed')) {
        return 'hydration-mismatch';
    }

    if (message.includes('404') || message.includes('not found') || name === 'notfounderror') {
        return '404';
    }

    if (message.includes('500') || message.includes('server error') || name === 'servererror') {
        return '500';
    }

    if (message.includes('network') || message.includes('fetch')) {
        return 'data-fetch-error';
    }

    return 'unknown';
}

function getErrorMessage(errorType: NavigationError['type'] | null): string {
    switch (errorType) {
        case 'chunk-load-error':
            return 'Failed to load application code. This usually happens after a deployment. Please refresh the page.';
        case 'hydration-mismatch':
            return 'Content mismatch detected. This page works on hard refresh but breaks on navigation.';
        case '404':
            return 'The page you are looking for does not exist.';
        case '500':
            return 'A server error occurred while loading this page.';
        case 'data-fetch-error':
            return 'Failed to load data for this page. Please check your connection and try again.';
        default:
            return 'An unexpected error occurred during navigation. Please try again.';
    }
}

export function RouteErrorBoundary(props: RouteErrorBoundaryProps): JSX.Element {
    const location = useLocation();
    const navigate = useNavigate();

    return (
        <RouteErrorBoundaryClass {...props} location={location.pathname} navigate={navigate} />
    );
}
