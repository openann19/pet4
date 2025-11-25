import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Warning, ArrowClockwise } from '@phosphor-icons/react';

interface MapErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}

interface MapErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

class MapErrorBoundary extends React.Component<MapErrorBoundaryProps, MapErrorBoundaryState> {
    constructor(props: MapErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): MapErrorBoundaryState {
        return { hasError: true, error };
    }

    override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        console.error('Map component error:', error, errorInfo);
    }

    retry = (): void => {
        this.setState({ hasError: false, error: null });
    };

    override render(): React.ReactNode {
        if (this.state.hasError && this.state.error) {
            const FallbackComponent = this.props.fallback ?? DefaultMapErrorFallback;
            return <FallbackComponent error={this.state.error} retry={this.retry} />;
        }

        return this.props.children;
    }
}

function DefaultMapErrorFallback({ error, retry }: { error: Error; retry: () => void }): React.JSX.Element {
    return (
        <Card className="w-full h-full min-h-[400px]">
            <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-2">
                    <Warning className="w-6 h-6 text-orange-600" />
                </div>
                <CardTitle className="text-orange-900">Map Unavailable</CardTitle>
                <CardDescription className="text-orange-700">
                    We couldn't load the interactive map. This might be due to a network issue or browser limitation.
                </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
                <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    <p className="font-medium mb-1">Error details:</p>
                    <p className="font-mono text-xs">{error.message}</p>
                </div>
                <Button onClick={retry} variant="outline" className="gap-2">
                    <ArrowClockwise size={16} />
                    Try Again
                </Button>
                <p className="text-xs text-muted-foreground">
                    If this problem persists, please refresh the page or check your internet connection.
                </p>
            </CardContent>
        </Card>
    );
}

export default MapErrorBoundary;
