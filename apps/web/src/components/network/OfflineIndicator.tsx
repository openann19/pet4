import { cn } from '@/lib/utils';
import { WifiHigh, WifiSlash } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { isTruthy, isDefined } from '@petspark/shared';

export function OfflineIndicator(): JSX.Element | null {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = (): void => {
      setIsOnline(true);
      if (isTruthy(wasOffline)) {
        setShowReconnected(true);
        setTimeout(() => {
          setShowReconnected(false);
          setWasOffline(false);
        }, 3000);
      }
    };

    const handleOffline = (): void => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  if (isOnline && !showReconnected) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 py-2 px-4 text-center text-sm font-medium transition-all duration-300',
        !isOnline && 'bg-yellow-500 text-yellow-950',
        showReconnected && 'bg-green-500 text-green-950'
      )}
    >
      <div className="flex items-center justify-center gap-2">
        {!isOnline ? (
          <>
            <WifiSlash size={16} weight="bold" />
            <span>You're offline. Some features may not be available.</span>
          </>
        ) : (
          <>
            <WifiHigh size={16} weight="bold" />
            <span>Back online! Syncing your changes...</span>
          </>
        )}
      </div>
    </div>
  );
}
