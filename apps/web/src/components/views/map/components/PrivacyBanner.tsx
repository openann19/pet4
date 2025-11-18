import { Warning } from '@phosphor-icons/react';
import { MotionView } from '@petspark/motion';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';

export interface PrivacyBannerProps {
  onEnablePrecise: () => void;
}

export function PrivacyBanner({ onEnablePrecise }: PrivacyBannerProps): React.JSX.Element {
  const { t } = useApp();

  return (
    <MotionView
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="backdrop-blur-xl bg-primary/10 rounded-xl border border-primary/20 p-3"
    >
      <div className="flex items-start gap-3">
        <Warning size={20} className="text-primary shrink-0 mt-0.5" weight="fill" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            {t.map?.approximateLocation ?? 'Using approximate location'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {t.map?.enablePrecisePrompt ??
              'Enable precise location for live meet-ups and exact navigation'}
          </p>
        </div>
        <Button size="sm" onClick={() => void onEnablePrecise()} className="shrink-0 h-8 text-xs">
          {t.map?.enable ?? 'Enable'}
        </Button>
      </div>
    </MotionView>
  );
}

