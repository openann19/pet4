/**
 * App Modals Component
 * Manages all modal dialogs and overlays
 */

import { Suspense, lazy } from 'react'
import { MotionView } from '@petspark/motion'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import LoadingState from '@/components/LoadingState'
import type { Playdate } from '@/lib/playdate-types'

const GenerateProfilesButton = lazy(() => import('@/components/GenerateProfilesButton'))
const StatsCard = lazy(() => import('@/components/StatsCard'))
const PlaydateMap = lazy(() => import('@/components/playdate/PlaydateMap'))
const AdminConsole = lazy(() => import('@/components/AdminConsole'))
const UltraThemeSettings = lazy(() => import('@/components/settings/UltraThemeSettings'))

interface AppModalsProps {
  showGenerateProfiles: boolean
  showStats: boolean
  showMap: boolean
  showAdminConsole: boolean
  showThemeSettings: boolean
  setShowGenerateProfiles: (show: boolean) => void
  setShowStats: (show: boolean) => void
  setShowMap: (show: boolean) => void
  setShowAdminConsole: (show: boolean) => void
  setShowThemeSettings: (show: boolean) => void
  animations: {
    generateProfilesModal: {
      opacity: unknown
      scale: unknown
      y: unknown
    }
    generateProfilesContent: {
      opacity: unknown
      scale: unknown
      y: unknown
    }
    statsModal: {
      opacity: unknown
      scale: unknown
      y: unknown
    }
    statsContent: {
      opacity: unknown
      scale: unknown
      y: unknown
    }
    mapModal: {
      opacity: unknown
      scale: unknown
      y: unknown
    }
    mapContent: {
      opacity: unknown
      scale: unknown
      y: unknown
    }
    adminModal: {
      opacity: unknown
      scale: unknown
      y: unknown
    }
    adminContent: {
      style: unknown
    }
    themeContent: {
      style: unknown
    }
    closeButtonBounce: {
      scale: unknown
    }
  }
  totalMatches: number
  totalSwipes: number
  successRate: number
  playdates: Playdate[]
}

export function AppModals({
  showGenerateProfiles,
  showStats,
  showMap,
  showAdminConsole,
  showThemeSettings,
  setShowGenerateProfiles,
  setShowStats,
  setShowMap,
  setShowAdminConsole,
  setShowThemeSettings,
  animations,
  totalMatches,
  totalSwipes,
  successRate,
  playdates,
}: AppModalsProps) {
  return (
    <>
      {showGenerateProfiles && (
        <MotionView
          style={{
            opacity: animations.generateProfilesModal.opacity,
            scale: animations.generateProfilesModal.scale,
            y: animations.generateProfilesModal.y,
          }}
          className="fixed inset-0 bg-background/95 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => {
            setShowGenerateProfiles(false)
          }}
        >
          <MotionView
            style={{
              opacity: animations.generateProfilesContent.opacity,
              scale: animations.generateProfilesContent.scale,
              y: animations.generateProfilesContent.y,
            }}
            onClick={(e?: React.MouseEvent) => e?.stopPropagation()}
            className="bg-card p-6 rounded-2xl shadow-2xl max-w-md w-full border border-border/50"
          >
            <Suspense fallback={<LoadingState />}>
              <GenerateProfilesButton />
            </Suspense>
            <MotionView style={{ scale: animations.closeButtonBounce.scale }}>
              <Button variant="outline" className="w-full mt-4" onClick={() => { setShowGenerateProfiles(false) }}>
                Close
              </Button>
            </MotionView>
          </MotionView>
        </MotionView>
      )}

      {showStats && totalSwipes > 0 && (
        <MotionView
          style={{
            opacity: animations.statsModal.opacity,
            scale: animations.statsModal.scale,
            y: animations.statsModal.y,
          }}
          className="fixed inset-0 bg-background/95 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => {
            setShowStats(false)
          }}
        >
          <MotionView
            style={{
              opacity: animations.statsContent.opacity,
              scale: animations.statsContent.scale,
              y: animations.statsContent.y,
            }}
            onClick={(e?: React.MouseEvent) => e?.stopPropagation()}
            className="max-w-2xl w-full"
          >
            <Suspense fallback={<LoadingState />}>
              <StatsCard totalMatches={totalMatches} totalSwipes={totalSwipes} successRate={successRate} />
            </Suspense>
            <MotionView style={{ scale: animations.closeButtonBounce.scale }}>
              <Button variant="outline" className="w-full mt-4" onClick={() => { setShowStats(false) }}>
                Close
              </Button>
            </MotionView>
          </MotionView>
        </MotionView>
      )}

      {showMap && (
        <MotionView
          style={{
            opacity: animations.mapModal.opacity,
            scale: animations.mapModal.scale,
            y: animations.mapModal.y,
          }}
          className="fixed inset-0 z-50"
        >
          <Suspense fallback={<LoadingState />}>
            <MotionView
              style={{
                opacity: animations.mapContent.opacity,
                scale: animations.mapContent.scale,
                y: animations.mapContent.y,
              }}
              className="h-full w-full"
            >
              <PlaydateMap playdates={playdates ?? []} onClose={() => { setShowMap(false) }} />
            </MotionView>
          </Suspense>
        </MotionView>
      )}

      {showAdminConsole && (
        <MotionView
          style={{
            opacity: animations.adminModal.opacity,
            scale: animations.adminModal.scale,
            y: animations.adminModal.y,
          }}
          className="fixed inset-0 z-50 bg-background"
        >
          <MotionView style={animations.adminContent.style} className="h-full w-full">
            <Suspense fallback={<LoadingState />}>
              <AdminConsole onClose={() => { setShowAdminConsole(false) }} />
            </Suspense>
          </MotionView>
        </MotionView>
      )}

      {showThemeSettings && (
        <Dialog open={showThemeSettings} onOpenChange={setShowThemeSettings}>
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
  )
}

