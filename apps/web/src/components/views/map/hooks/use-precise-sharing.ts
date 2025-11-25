import { useEffect } from 'react';
import { useStorage } from '@/hooks/use-storage';
import { toast } from 'sonner';
import { useApp } from '@/contexts/AppContext';
import { haptics } from '@/lib/haptics';

export interface UsePreciseSharingReturn {
  preciseSharingEnabled: boolean;
  preciseSharingUntil: number | null;
  handleEnablePreciseSharing: () => void;
  handleDisablePreciseSharing: () => void;
}

export function usePreciseSharing(): UsePreciseSharingReturn {
  const { t } = useApp();
  const [preciseSharingEnabled, setPreciseSharingEnabled] = useStorage<boolean>(
    'map-precise-sharing',
    false
  );
  const [preciseSharingUntil, setPreciseSharingUntil] = useStorage<number | null>(
    'map-precise-until',
    null
  );

  useEffect(() => {
    if (preciseSharingEnabled && preciseSharingUntil) {
      const now = Date.now();
      if (now > preciseSharingUntil) {
        void setPreciseSharingEnabled(false);
        void setPreciseSharingUntil(null);
        void toast.info(t.map?.precisionExpired ?? 'Precise location sharing ended');
      }
    }
  }, [
    preciseSharingEnabled,
    preciseSharingUntil,
    setPreciseSharingEnabled,
    setPreciseSharingUntil,
    t,
  ]);

  const handleEnablePreciseSharing = (): void => {
    haptics.trigger('medium');
    const until = Date.now() + 60 * 60 * 1000;
    void setPreciseSharingEnabled(true);
    void setPreciseSharingUntil(until);
    void toast.success(t.map?.precisionEnabled ?? 'Precise location enabled for 60 minutes');
  };

  const handleDisablePreciseSharing = (): void => {
    haptics.trigger('light');
    void setPreciseSharingEnabled(false);
    void setPreciseSharingUntil(null);
    void toast.info(t.map?.precisionDisabled ?? 'Precise location disabled');
  };

  return {
    preciseSharingEnabled,
    preciseSharingUntil,
    handleEnablePreciseSharing,
    handleDisablePreciseSharing,
  };
}
