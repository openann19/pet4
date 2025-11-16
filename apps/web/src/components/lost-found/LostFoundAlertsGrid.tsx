import { MotionView } from '@petspark/motion';
import type { LostAlert } from '@/lib/lost-found-types';
import { LostAlertCard } from './LostAlertCard';

interface LostFoundAlertsGridProps {
  alerts: LostAlert[];
  favorites: string[];
  onSelectAlert: (alert: LostAlert) => void;
  onReportSighting: (alert: LostAlert) => void;
  onToggleFavorite: (alertId: string) => void;
}

export function LostFoundAlertsGrid({
  alerts,
  favorites,
  onSelectAlert,
  onReportSighting,
  onToggleFavorite,
}: LostFoundAlertsGridProps) {
  return (
    <MotionView
      key="grid"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6"
    >
      {alerts.map((alert, index) => (
        <MotionView
          key={alert.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <LostAlertCard
            alert={alert}
            onSelect={onSelectAlert}
            onReportSighting={onReportSighting}
            isFavorited={Array.isArray(favorites) && favorites.includes(alert.id)}
            onToggleFavorite={onToggleFavorite}
          />
        </MotionView>
      ))}
    </MotionView>
  );
}

