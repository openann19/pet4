import { CheckCircle } from '@phosphor-icons/react';
import { MotionView } from '@petspark/motion';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';

export interface PreciseSharingBannerProps {
  expiresInMinutes: number;
  onDisable: () => void;
}

export function PreciseSharingBanner({
  expiresInMinutes,
  onDisable,
}: PreciseSharingBannerProps): React.JSX.Element {
  const { t } = useApp();

  return (
    <MotionView
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="backdrop-blur-xl bg-green-500/10 rounded-xl border border-green-500/20 p-3"
    >
      <div className="flex items-center gap-3">
        <CheckCircle size={20} className="text-green-500 shrink-0" weight="fill" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            {t.map?.preciseEnabled ?? 'Precise location active'}
          </p>
          <p className="text-xs text-muted-foreground">
            {t.map?.preciseExpires ??
              `Expires in ${Math.ceil(expiresInMinutes)} minutes`}
          </p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => void onDisable()}
          className="shrink-0 h-8 text-xs"
        >
          {t.map?.disable ?? 'Disable'}
        </Button>
      </div>
    </MotionView>
  );
}

