import { useEffect, useState } from 'react';
import { useStorage } from '@/hooks/use-storage';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PageTransitionWrapper } from '@/components/ui/page-transition-wrapper';
import { Plus, MapPin } from '@phosphor-icons/react';
// import { MotionView } from '@petspark/motion'; // Unused
import { AnimatePresence } from '@/effects/reanimated/animate-presence';
import type { LostAlert } from '@/lib/lost-found-types';
import { CreateLostAlertDialog } from '@/components/lost-found/CreateLostAlertDialog';
import { ReportSightingDialog } from '@/components/lost-found/ReportSightingDialog';
import { LostFoundFilters } from '@/components/lost-found/LostFoundFilters';
import { LostFoundEmptyState } from '@/components/lost-found/LostFoundEmptyState';
import { LostFoundAlertsGrid } from '@/components/lost-found/LostFoundAlertsGrid';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';
import { useLostFoundAlerts } from '@/hooks/lost-found/use-lost-found-alerts';
import { useUserLocation } from '@/hooks/lost-found/use-user-location';
import { filterAlerts } from '@/components/lost-found/utils/filter-alerts';

type ViewMode = 'browse' | 'mine';
type FilterTab = 'all' | 'active' | 'found' | 'favorites';

export default function LostFoundView() {
  const { t } = useApp();
  const [viewMode, setViewMode] = useState<ViewMode>('browse');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useStorage<string[]>('lost-found-favorites', []);
  const [selectedAlert, setSelectedAlert] = useState<LostAlert | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSightingDialog, setShowSightingDialog] = useState(false);

  const { userLocation, getUserLocation } = useUserLocation();
  const { alerts, loading, loadAlerts } = useLostFoundAlerts({
    viewMode,
    activeTab,
    userLocation,
  });

  useEffect(() => {
    void loadAlerts();
    void getUserLocation();
  }, [loadAlerts, getUserLocation]);

  const handleToggleFavorite = (alertId: string) => {
    void setFavorites((currentFavorites) => {
      const current = Array.isArray(currentFavorites) ? currentFavorites : [];
      if (current.includes(alertId)) {
        return current.filter((id) => id !== alertId);
      } else {
        return [...current, alertId];
      }
    });
  };

  const handleSelectAlert = (alert: LostAlert) => {
    setSelectedAlert(alert);
    // Could open a detail dialog here
  };

  const handleReportSighting = (alert: LostAlert) => {
    setSelectedAlert(alert);
    setShowSightingDialog(true);
  };

  const filteredAlertsList = filterAlerts({
    alerts,
    activeTab,
    searchQuery,
    favorites: Array.isArray(favorites) ? favorites : [],
  });

  if (loading && alerts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  const isEmpty = filteredAlertsList.length === 0;

  return (
    <PageTransitionWrapper key="lost-found-view" direction="up">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-3">
              <MapPin size={32} weight="fill" className="text-primary" />
              {t.lostFound?.title ?? 'Lost & Found'}
            </h2>
            <p className="text-muted-foreground">
              {t.lostFound?.subtitle ?? 'Report lost pets and help reunite families'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setViewMode(viewMode === 'browse' ? 'mine' : 'browse')}
              variant="outline"
            >
              {viewMode === 'browse' ? 'My Alerts' : 'Browse All'}
            </Button>
            <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
              <Plus size={20} weight="fill" />
              {t.lostFound?.reportLost ?? 'Report Lost Pet'}
            </Button>
          </div>
        </div>

        {viewMode === 'browse' && (
          <>
            <LostFoundFilters
              activeTab={activeTab}
              onTabChange={setActiveTab}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              alerts={alerts}
              favorites={Array.isArray(favorites) ? favorites : []}
              t={t}
            />

            <ScrollArea className="h-[calc(100vh-320px)]">
              <AnimatePresence mode="wait">
                {isEmpty ? (
                  <LostFoundEmptyState
                    activeTab={activeTab}
                    searchQuery={searchQuery}
                  />
                ) : (
                  <LostFoundAlertsGrid
                    alerts={filteredAlertsList}
                    favorites={Array.isArray(favorites) ? favorites : []}
                    onSelectAlert={handleSelectAlert}
                    onReportSighting={handleReportSighting}
                    onToggleFavorite={handleToggleFavorite}
                  />
                )}
              </AnimatePresence>
            </ScrollArea>
          </>
        )}

        {viewMode === 'mine' && (
          <ScrollArea className="h-[calc(100vh-320px)]">
            <LostFoundAlertsGrid
              alerts={alerts}
              favorites={Array.isArray(favorites) ? favorites : []}
              onSelectAlert={handleSelectAlert}
              onReportSighting={handleReportSighting}
              onToggleFavorite={handleToggleFavorite}
            />
          </ScrollArea>
        )}

        <CreateLostAlertDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onSuccess={() => {
            void loadAlerts();
            void toast.success('Lost pet alert created successfully!');
          }}
        />

        <ReportSightingDialog
          open={showSightingDialog}
          alert={selectedAlert}
          onClose={() => {
            setShowSightingDialog(false);
            setSelectedAlert(null);
          }}
          onSuccess={() => {
            void loadAlerts();
          }}
        />
      </div>
    </PageTransitionWrapper>
  );
}
