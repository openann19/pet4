import { useState, useEffect } from 'react'
import { useStorage } from '@/hooks/useStorage'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { MagnifyingGlass, Plus, MapPin } from '@phosphor-icons/react'
import { motion, Presence } from '@petspark/motion'
import type { LostAlert } from '@/lib/lost-found-types'
import { LostAlertCard } from '@/components/lost-found/LostAlertCard'
import { CreateLostAlertDialog } from '@/components/lost-found/CreateLostAlertDialog'
import { ReportSightingDialog } from '@/components/lost-found/ReportSightingDialog'
import { lostFoundAPI } from '@/api/lost-found-api'
import { useApp } from '@/contexts/AppContext'
import { toast } from 'sonner'
import { createLogger } from '@/lib/logger'
import type { LostAlertFilters } from '@/lib/lost-found-types'
import { isTruthy, isDefined } from '@/core/guards';

const logger = createLogger('LostFoundView')

type ViewMode = 'browse' | 'mine'
type FilterTab = 'all' | 'active' | 'found' | 'favorites'

export default function LostFoundView() {
  const { t } = useApp()
  const [viewMode, setViewMode] = useState<ViewMode>('browse')
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [alerts, setAlerts] = useState<LostAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [favorites, setFavorites] = useStorage<string[]>('lost-found-favorites', [])
  const [selectedAlert, setSelectedAlert] = useState<LostAlert | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showSightingDialog, setShowSightingDialog] = useState(false)
  const [cursor, setCursor] = useState<string | undefined>()
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null)

  useEffect(() => {
    loadAlerts()
    getUserLocation()
  }, [viewMode])

  const getUserLocation = async () => {
    try {
      if (isTruthy(navigator.geolocation)) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              lat: position.coords.latitude,
              lon: position.coords.longitude
            })
          },
          () => {
            // User denied or error getting location
          }
        )
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to get user location', err, { action: 'getUserLocation' })
    }
  }

  const loadAlerts = async () => {
    try {
      setLoading(true)
      const filters: LostAlertFilters & { cursor?: string; limit?: number } = {
        limit: 50,
        ...(cursor && { cursor })
      }

      if (viewMode === 'mine') {
        const user = await spark.user()
        const userAlerts = await lostFoundAPI.getUserAlerts(user.id)
        setAlerts(userAlerts)
        setLoading(false)
        return
      }

      // For browse mode, optionally filter by location
      if (userLocation && activeTab === 'all') {
        filters.location = {
          lat: userLocation.lat,
          lon: userLocation.lon,
          radiusKm: 50 // 50km radius
        }
      }

      if (activeTab === 'active') {
        filters.status = ['active']
      } else if (activeTab === 'found') {
        filters.status = ['found']
      }

      const result = await lostFoundAPI.queryAlerts(filters)
      setAlerts(result.alerts)
      setCursor(result.nextCursor)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to load alerts', err, { action: 'loadAlerts' })
      toast.error('Failed to load lost & found alerts')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleFavorite = (alertId: string) => {
    setFavorites((currentFavorites) => {
      const current = Array.isArray(currentFavorites) ? currentFavorites : []
      if (current.includes(alertId)) {
        return current.filter(id => id !== alertId)
      } else {
        return [...current, alertId]
      }
    })
  }

  const handleSelectAlert = (alert: LostAlert) => {
    setSelectedAlert(alert)
    // Could open a detail dialog here
  }

  const handleReportSighting = (alert: LostAlert) => {
    setSelectedAlert(alert)
    setShowSightingDialog(true)
  }

  const filteredAlerts = () => {
    let list = alerts

    if (activeTab === 'favorites') {
      list = list.filter(a => Array.isArray(favorites) && favorites.includes(a.id))
    }

    if (isTruthy(searchQuery)) {
      list = list.filter(a =>
        a.petSummary.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.petSummary.breed?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.petSummary.species.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.lastSeen.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  if (loading && alerts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t.common.loading}</p>
        </div>
      </div>
    )
  }

  const activeCount = alerts.filter(a => a.status === 'active').length
  const foundCount = alerts.filter(a => a.status === 'found').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <MapPin size={32} weight="fill" className="text-primary" />
            {t.lostFound?.title || 'Lost & Found'}
          </h2>
          <p className="text-muted-foreground">
            {t.lostFound?.subtitle || 'Report lost pets and help reunite families'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => { setViewMode(viewMode === 'browse' ? 'mine' : 'browse'); }}
            variant="outline"
          >
            {viewMode === 'browse' ? 'My Alerts' : 'Browse All'}
          </Button>
          <Button
            onClick={() => { setShowCreateDialog(true); }}
            className="gap-2"
          >
            <Plus size={20} weight="fill" />
            {t.lostFound?.reportLost || 'Report Lost Pet'}
          </Button>
        </div>
      </div>

      {viewMode === 'browse' && (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1 relative w-full">
              <MagnifyingGlass
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={20}
              />
              <Input
                placeholder={t.lostFound?.searchPlaceholder || "Search by pet name, breed, location..."}
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); }}
                className="pl-10"
              />
            </div>

            <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as FilterTab); }}>
              <TabsList>
                <TabsTrigger value="all">
                  All {alerts.length > 0 && `(${String(alerts.length ?? '')})`}
                </TabsTrigger>
                <TabsTrigger value="active">
                  Active {activeCount > 0 && `(${String(activeCount ?? '')})`}
                </TabsTrigger>
                <TabsTrigger value="found">
                  Found {foundCount > 0 && `(${String(foundCount ?? '')})`}
                </TabsTrigger>
                <TabsTrigger value="favorites">
                  Favorites {Array.isArray(favorites) && favorites.length > 0 && `(${String(favorites.length ?? '')})`}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <ScrollArea className="h-[calc(100vh-320px)]">
            <Presence mode="wait">
              {filteredAlerts().length === 0 ? (
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
              ) : (
                <MotionView
                  key="grid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6"
                >
                  {filteredAlerts().map((alert, index) => (
                    <MotionView
                      key={alert.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <LostAlertCard
                        alert={alert}
                        onSelect={handleSelectAlert}
                        onReportSighting={handleReportSighting}
                        isFavorited={Array.isArray(favorites) && favorites.includes(alert.id)}
                        onToggleFavorite={handleToggleFavorite}
                      />
                    </MotionView>
                  ))}
                </MotionView>
              )}
            </Presence>
          </ScrollArea>
        </>
      )}

      {viewMode === 'mine' && (
        <ScrollArea className="h-[calc(100vh-320px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
            {alerts.map((alert, index) => (
              <MotionView
                key={alert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <LostAlertCard
                  alert={alert}
                  onSelect={handleSelectAlert}
                  onReportSighting={handleReportSighting}
                  isFavorited={Array.isArray(favorites) && favorites.includes(alert.id)}
                  onToggleFavorite={handleToggleFavorite}
                />
              </MotionView>
            ))}
          </div>
        </ScrollArea>
      )}

      <CreateLostAlertDialog
        open={showCreateDialog}
        onClose={() => { setShowCreateDialog(false); }}
        onSuccess={() => {
          loadAlerts()
          toast.success('Lost pet alert created successfully!')
        }}
      />

      <ReportSightingDialog
        open={showSightingDialog}
        alert={selectedAlert}
        onClose={() => {
          setShowSightingDialog(false)
          setSelectedAlert(null)
        }}
        onSuccess={() => {
          loadAlerts()
        }}
      />
    </div>
  )
}

