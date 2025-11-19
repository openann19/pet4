import { Alert, AlertTitle, AlertDescription } from './components/ui/alert';
import { Button } from './components/ui/button';
import { isTruthy } from './lib/utils';

import { Warning, ArrowClockwise, House } from '@phosphor-icons/react';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

function isChunkLoadError(error: Error): boolean {
  return error.message.toLowerCase().includes('chunk') ||
    error.message.toLowerCase().includes('loading chunk') ||
    error.name.toLowerCase() === 'chunkloaderror';
}

function ErrorDetails({ error, currentPath }: { error: Error; currentPath: string }) {
  return (
    <div className="bg-card border rounded-lg p-4 mb-6">
      <h3 className="font-semibold text-sm text-muted-foreground mb-2">Error Details:</h3>
      <pre className="text-xs text-destructive bg-muted/50 p-3 rounded border overflow-auto max-h-32">
        {error.message}
        {error.stack && `\n\n${error.stack}`}
      </pre>
      {currentPath && (
        <div className="mt-2 text-xs text-muted-foreground">
          <p>Location: {currentPath}</p>
        </div>
      )}
    </div>
  );
}

function ErrorActions({ 
  isChunkError, 
  onHardReload, 
  onTryAgain, 
  onGoHome 
}: { 
  isChunkError: boolean;
  onHardReload: () => void;
  onTryAgain: () => void;
  onGoHome: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {isChunkError ? (
        <Button onClick={() => void onHardReload()} className="w-full" variant="default">
          <ArrowClockwise size={16} className="mr-2" />
          Hard Reload Page
        </Button>
      ) : (
        <Button onClick={() => void onTryAgain()} className="w-full" variant="default">
          <ArrowClockwise size={16} className="mr-2" />
          Try Again
        </Button>
      )}
      <Button onClick={() => void onGoHome()} className="w-full" variant="outline">
        <House size={16} className="mr-2" />
        Go Home
      </Button>
    </div>
  );
}

export const ErrorFallback = ({ error, resetErrorBoundary }: ErrorFallbackProps) => {
  if (isTruthy(import.meta.env.DEV)) throw error;

  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
  const chunkError = isChunkLoadError(error);

  const handleHardReload = (): void => {
    window.location.reload();
  };

  const handleGoHome = (): void => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Alert variant="destructive" className="mb-6">
          <Warning size={20} />
          <AlertTitle>Application Error</AlertTitle>
          <AlertDescription>
            Something unexpected happened while running the application. The error details are shown
            below. Contact the spark author and let them know about this issue.
          </AlertDescription>
        </Alert>

        <ErrorDetails error={error} currentPath={currentPath} />
        <ErrorActions
          isChunkError={chunkError}
          onHardReload={handleHardReload}
          onTryAgain={resetErrorBoundary}
          onGoHome={handleGoHome}
        />
      </div>
    </div>
  );
};
