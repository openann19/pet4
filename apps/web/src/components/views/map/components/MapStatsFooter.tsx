import { MotionView } from '@petspark/motion';
import { useApp } from '@/contexts/AppContext';

export interface MapStatsFooterProps {
  placesCount: number;
  savedCount: number;
  radiusKm: number;
}

export function MapStatsFooter({
  placesCount,
  savedCount,
  radiusKm,
}: MapStatsFooterProps): React.JSX.Element {
  const { t } = useApp();

  return (
    <MotionView
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="absolute bottom-4 left-4 right-4 z-10"
    >
      <div className="backdrop-blur-xl bg-background/80 rounded-2xl shadow-xl border border-border p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-primary">{placesCount}</p>
            <p className="text-xs text-muted-foreground">{t.map?.placesNearby ?? 'Places'}</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">{savedCount}</p>
            <p className="text-xs text-muted-foreground">{t.map?.saved ?? 'Saved'}</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">{radiusKm}</p>
            <p className="text-xs text-muted-foreground">{t.map?.radiusKm ?? 'km radius'}</p>
          </div>
        </div>
      </div>
    </MotionView>
  );
}

