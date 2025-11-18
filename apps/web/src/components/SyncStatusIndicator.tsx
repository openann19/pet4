import { useState, useEffect } from 'react';
import { CloudArrowUp, CloudSlash, CloudCheck, Warning } from '@phosphor-icons/react';
import { subscribeToSyncStatus, type SyncStatus } from '@/lib/offline-sync';
import { Button } from '@/components/ui/button';
import {
  use
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  MotionView,
  type MotionValue,
} from '@petspark/motion';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { logger } from '@/lib/logger';

export function SyncStatusIndicator() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    pendingActions: 0,
    failedActions: 0,
  });
  const [isOpen, setIsOpen] = useState(false);

  const iconScale = useSharedValue(1);
  const iconRotate = useSharedValue(0);
  const iconStyle = useAnimatedStyle(() => {
    const scale = iconScale.value;
    const rotate = iconRotate.value;
    const transforms: Record<string, number | string | MotionValue<number>>[] = [];
    transforms.push({ scale });
    transforms.push({ rotate: `${rotate}deg` });
    return { transform: transforms };
  }) as import('@/effects/reanimated/animated-view').AnimatedStyle;

  useEffect(() => {
    if (syncStatus.isSyncing) {
      iconScale.value = withRepeat(
        withSequence(withTiming(1.1, { duration: 1000 }), withTiming(1, { duration: 1000 })),
        -1,
        true
      );
      iconRotate.value = withRepeat(
        withSequence(
          withTiming(10, { duration: 1000 }),
          withTiming(-10, { duration: 1000 }),
          withTiming(0, { duration: 1000 })
        ),
        -1,
        false
      );
    } else {
      iconScale.value = 1;
      iconRotate.value = 0;
    }
  }, [syncStatus.isSyncing, iconScale, iconRotate]);

  useEffect(() => {
    const unsubscribe = subscribeToSyncStatus((status) => {
      setSyncStatus(status);
    });

    return unsubscribe;
  }, []);

  const getIcon = () => {
    if (!syncStatus.isOnline) {
      return <CloudSlash size={18} weight="fill" className="text-destructive" />;
    }
    if (syncStatus.isSyncing) {
      return <CloudArrowUp size={18} weight="fill" className="text-primary animate-pulse" />;
    }
    if (syncStatus.failedActions > 0) {
      return <Warning size={18} weight="fill" className="text-amber-500" />;
    }
    if (syncStatus.pendingActions > 0) {
      return <CloudArrowUp size={18} weight="fill" className="text-primary" />;
    }
    return <CloudCheck size={18} weight="fill" className="text-green-500" />;
  };

  const getLabel = () => {
    if (!syncStatus.isOnline) {
      return 'Offline';
    }
    if (syncStatus.isSyncing) {
      return 'Syncing...';
    }
    if (syncStatus.failedActions > 0) {
      return `${syncStatus.failedActions} failed`;
    }
    if (syncStatus.pendingActions > 0) {
      return `${syncStatus.pendingActions} pending`;
    }
    return 'Synced';
  };

  const shouldShow =
    !syncStatus.isOnline ||
    syncStatus.isSyncing ||
    syncStatus.pendingActions > 0 ||
    syncStatus.failedActions > 0;

  if (!shouldShow) {
    return null;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-3 gap-2 hover:bg-primary/10 active:bg-primary/20 transition-colors"
        >
          <MotionView style={iconStyle as React.CSSProperties}>{getIcon()}</MotionView>
          <span className="text-xs font-medium">{getLabel()}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-sm mb-1">Sync Status</h4>
            <p className="text-xs text-muted-foreground">
              Your data syncs automatically when online
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Connection</span>
              <span
                className={`font-medium ${syncStatus.isOnline ? 'text-green-600' : 'text-destructive'}`}
              >
                {syncStatus.isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            {syncStatus.pendingActions > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pending actions</span>
                <span className="font-medium text-primary">{syncStatus.pendingActions}</span>
              </div>
            )}

            {syncStatus.failedActions > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Failed actions</span>
                <span className="font-medium text-destructive">{syncStatus.failedActions}</span>
              </div>
            )}

            {syncStatus.lastSyncTime && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Last sync</span>
                <span className="font-medium">
                  {new Date(syncStatus.lastSyncTime).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>

          {!syncStatus.isOnline && (
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">
                You're currently offline. Your actions will be saved and synced automatically when
                you're back online.
              </p>
            </div>
          )}

          {syncStatus.failedActions > 0 && (
            <div className="bg-destructive/10 p-3 rounded-lg">
              <p className="text-xs text-destructive mb-2">
                Some actions couldn't be synced. They'll retry automatically.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => {
                  logger.info('Retry failed actions', {
                    action: 'retryFailedActions',
                    failedActions: syncStatus.failedActions,
                  });
                  setIsOpen(false);
                }}
              >
                Retry Now
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
