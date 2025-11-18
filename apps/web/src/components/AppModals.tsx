import { MotionView } from '@petspark/motion';
import { lazy, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import LoadingState from '@/components/LoadingState';
import type { Playdate } from '@/lib/playdate-types';
import type { UseAppAnimationsReturn } from '@/hooks/use-app-animations';

const GenerateProfilesButton = lazy(() => import('@/components/GenerateProfilesButton'));
const StatsCard = lazy(() => import('@/components/StatsCard'));
const PlaydateMap = lazy(() => import('@/components/playdate/PlaydateMap'));
const AdminConsole = lazy(() => import('@/components/AdminConsole'));
const UltraThemeSettings = lazy(() => import('@/components/settings/UltraThemeSettings'));

export interface AppModalsProps {
  showGenerateProfiles: boolean;
  showStats: boolean;
  showMap: boolean;
  showAdminConsole: boolean;
  showThemeSettings: boolean;
  playdates: Playdate[];
  totalMatches: number;
  totalSwipes: number;
  successRate: number;
  animations: UseAppAnimationsReturn;
  onCloseGenerateProfiles: () => void;
  onCloseStats: () => void;
  onCloseMap: () => void;
  onCloseAdminConsole: () => void;
  onCloseThemeSettings: () => void;
}

export function AppModals({
  showGenerateProfiles,
  showStats,
  showMap,
  showAdminConsole,
  showThemeSettings,
  playdates,
  totalMatches,
  totalSwipes,
  successRate,
  animations,
  onCloseGenerateProfiles,
  onCloseStats,
  onCloseMap,
  onCloseAdminConsole,
  onCloseThemeSettings,
}: AppModalsProps) {
  return (
    <>
      {showGenerateProfiles && (
        <MotionView
          style={{ opacity: animations.generateProfilesModal.opacity, scale: animations.generateProfilesModal.scale, y: animations.generateProfilesModal.y }}
          className="fixed inset-0 bg-background/95 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => void onCloseGenerateProfiles()}
        >
          <MotionView
            style={{ opacity: animations.generateProfilesContent.opacity, scale: animations.generateProfilesContent.scale, y: animations.generateProfilesContent.y }}
            onClick={(e?: React.MouseEvent) => e?.stopPropagation()}
            className="bg-card p-6 rounded-2xl shadow-2xl max-w-md w-full border border-border/50"
          >
            <Suspense fallback={<LoadingState />}>
              <GenerateProfilesButton />
            </Suspense>
            <MotionView style={{ scale: animations.closeButtonBounce.scale }}>
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => void onCloseGenerateProfiles()}
              >
                Close
              </Button>
            </MotionView>
          </MotionView>
        </MotionView>
      )}
      {showStats && totalSwipes > 0 && (
        <MotionView
          style={{ opacity: animations.statsModal.opacity, scale: animations.statsModal.scale, y: animations.statsModal.y }}
          className="fixed inset-0 bg-background/95 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => void onCloseStats()}
        >
          <MotionView
            style={{ opacity: animations.statsContent.opacity, scale: animations.statsContent.scale, y: animations.statsContent.y }}
            onClick={(e?: React.MouseEvent) => e?.stopPropagation()}
            className="max-w-2xl w-full"
          >
            <Suspense fallback={<LoadingState />}>
              <StatsCard
                totalMatches={totalMatches}
                totalSwipes={totalSwipes}
                successRate={successRate}
              />
            </Suspense>
            <MotionView style={{ scale: animations.closeButtonBounce.scale }}>
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => void onCloseStats()}
              >
                Close
              </Button>
            </MotionView>
          </MotionView>
        </MotionView>
      )}

      {showMap && (
        <MotionView
          style={{ opacity: animations.mapModal.opacity, scale: animations.mapModal.scale, y: animations.mapModal.y }}
          className="fixed inset-0 z-50"
        >
          <Suspense fallback={<LoadingState />}>
            <MotionView
              style={{ opacity: animations.mapContent.opacity, scale: animations.mapContent.scale, y: animations.mapContent.y }}
              className="h-full w-full"
            >
              <PlaydateMap
                playdates={playdates ?? []}
                onClose={onCloseMap}
              />
            </MotionView>
          </Suspense>
        </MotionView>
      )}

      {showAdminConsole && (
        <MotionView
          style={{ opacity: animations.adminModal.opacity, scale: animations.adminModal.scale, y: animations.adminModal.y }}
          className="fixed inset-0 z-50 bg-background"
        >
          <MotionView
            style={animations.adminContent.style}
            className="h-full w-full"
          >
            <Suspense fallback={<LoadingState />}>
              <AdminConsole onClose={onCloseAdminConsole} />
            </Suspense>
          </MotionView>
        </MotionView>
      )}

      {showThemeSettings && (
        <Dialog open={showThemeSettings} onOpenChange={onCloseThemeSettings}>
          <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto p-0">
            <DialogTitle className="sr-only">Ultra Theme Settings</DialogTitle>
            <MotionView style={animations.themeContent.style}>
              <Suspense fallback={<LoadingState />}>
                <UltraThemeSettings />
              </Suspense>
            </MotionView>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

