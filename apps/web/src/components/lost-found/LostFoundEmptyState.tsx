import { MapPin } from '@phosphor-icons/react';
import { MotionView } from '@petspark/motion';

interface LostFoundEmptyStateProps {
  activeTab: 'all' | 'active' | 'found' | 'favorites';
  searchQuery: string;
}

export function LostFoundEmptyState({
  activeTab,
  searchQuery,
}: LostFoundEmptyStateProps) {
  return (
    <MotionView
      key="empty"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-center py-16"
    >
      <MapPin size={64} className="text-muted-foreground mb-4" weight="thin" />
      <h3 className="text-xl font-semibold mb-2">
        {activeTab === 'favorites'
          ? 'No Favorites Yet'
          : searchQuery
            ? 'No Results Found'
            : 'No Active Alerts'}
      </h3>
      <p className="text-muted-foreground text-center max-w-md">
        {activeTab === 'favorites'
          ? 'Start adding alerts to your favorites to see them here.'
          : searchQuery
            ? 'Try adjusting your search terms.'
            : 'Check back soon for lost pet alerts in your area.'}
      </p>
    </MotionView>
  );
}

