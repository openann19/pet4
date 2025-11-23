import { useCallback, useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Eye, XCircle, Warning } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { lostFoundService } from '@/lib/lost-found-service';
import { lostFoundAPI } from '@/api/lost-found-api';
import type { LostAlert } from '@/lib/lost-found-types';
import { logger } from '@/lib/logger';
import { ProgressiveImage } from '@/components/enhanced/ProgressiveImage';

export function LostFoundManagement() {
  const [alerts, setAlerts] = useState<LostAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<LostAlert | null>(null);

  const loadAlerts = useCallback(async () => {
    try {
      // Get all alerts (admin endpoint)
      const result = await lostFoundAPI.queryAlerts({ limit: 1000 });
      setAlerts(
        result.alerts.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to load alerts', err, { action: 'loadAlerts' });
      void toast.error('Failed to load alerts');
    }
  }, []);

  useEffect(() => {
    void loadAlerts();
  }, [loadAlerts]);

  const handleArchiveAlert = useCallback(
    async (alertId: string) => {
      try {
        await lostFoundService.updateAlertStatus(alertId, 'archived');
        void toast.success('Alert archived');
        await loadAlerts();
        setSelectedAlert(null);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to archive alert', err, { action: 'archiveAlert', alertId });
        void toast.error('Failed to archive alert');
      }
    },
    [loadAlerts]
  );

  const getStatusColor = (status: LostAlert['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'found':
        return 'bg-blue-500';
      case 'archived':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Lost & Found Management</h2>
        <p className="text-muted-foreground mt-1">Monitor and manage lost pet alerts</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold">
                {alerts.filter((a) => a.status === 'active').length}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Active Alerts</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {alerts.filter((a) => a.status === 'found').length}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Found</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold">
                {alerts.reduce((sum, a) => sum + a.viewsCount, 0)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Total Views</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>All Alerts ({alerts.length})</CardTitle>
            <CardDescription>Click to view details</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-150">
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <button
                    key={alert.id}
                    onClick={() => { setSelectedAlert(alert); }}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      String(selectedAlert?.id === alert.id
                                                ? 'border-primary bg-primary/5'
                                                : 'border-border hover:border-primary/50')
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {alert.photos[0] && (
                        <ProgressiveImage
                          src={alert.photos[0]}
                          alt={alert.petSummary.name}
                          className="w-16 h-16 rounded-lg object-cover"
                          aria-label={`Photo of ${alert.petSummary.name}`}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{alert.petSummary.name}</h4>
                          <div className={`w-2 h-2 rounded-full ${String(getStatusColor(alert.status) ?? '')}`} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {alert.petSummary.species} • {alert.petSummary.breed}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(alert.lastSeen.whenISO).toLocaleDateString()}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Eye size={12} className="text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{alert.viewsCount}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Alert Details</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedAlert ? (
              <div className="text-center py-24">
                <Warning size={48} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Select an alert to view details</p>
              </div>
            ) : (
              <ScrollArea className="h-150 pr-4">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold">{selectedAlert.petSummary.name}</h3>
                    <Badge
                      variant={
                        selectedAlert.status === 'active'
                          ? 'default'
                          : selectedAlert.status === 'found'
                            ? 'secondary'
                            : 'outline'
                      }
                    >
                      {selectedAlert.status}
                    </Badge>
                  </div>

                  {selectedAlert.photos.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {selectedAlert.photos.map((photo, index) => (
                        <ProgressiveImage
                          key={index}
                          src={photo}
                            alt={`${String(selectedAlert.petSummary.name)} ${String(index + 1)}`}
                          className="w-full aspect-square object-cover rounded-lg"
                          aria-label={`${selectedAlert.petSummary.name} photo ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Species</p>
                      <p className="font-medium capitalize">{selectedAlert.petSummary.species}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Breed</p>
                      <p className="font-medium">{selectedAlert.petSummary.breed ?? 'Mixed'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Color</p>
                      <p className="font-medium">{selectedAlert.petSummary.color ?? 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Size</p>
                      <p className="font-medium capitalize">
                        {selectedAlert.petSummary.size ?? 'Unknown'}
                      </p>
                    </div>
                  </div>

                  {selectedAlert.petSummary.distinctiveFeatures && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Distinctive Features</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedAlert.petSummary.distinctiveFeatures.map((feature, index) => (
                          <Badge key={index} variant="outline">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedAlert.petSummary.microchipId && (
                    <div>
                      <p className="text-sm text-muted-foreground">Microchip ID</p>
                      <p className="font-mono">{selectedAlert.petSummary.microchipId}</p>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <MapPin size={18} className="text-primary" />
                      Last Seen
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-muted-foreground">When</p>
                        <p className="font-medium">
                          {new Date(selectedAlert.lastSeen.whenISO).toLocaleString()}
                        </p>
                      </div>
                      {selectedAlert.lastSeen.description && (
                        <div>
                          <p className="text-sm text-muted-foreground">Location Description</p>
                          <p className="text-sm">{selectedAlert.lastSeen.description}</p>
                        </div>
                      )}
                      {selectedAlert.lastSeen.landmarks && (
                        <div>
                          <p className="text-sm text-muted-foreground">Nearby Landmarks</p>
                          <p className="text-sm">{selectedAlert.lastSeen.landmarks}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-muted-foreground">Search Radius</p>
                        <p className="font-medium">
                          {(selectedAlert.lastSeen.radiusM / 1000).toFixed(1)} km
                        </p>
                      </div>
                      {selectedAlert.lastSeen.lat && selectedAlert.lastSeen.lon && (
                        <div>
                          <p className="text-sm text-muted-foreground">Coordinates</p>
                          <p className="font-mono text-xs">
                            {selectedAlert.lastSeen.lat.toFixed(6)},{' '}
                            {selectedAlert.lastSeen.lon.toFixed(6)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Contact (Masked)</p>
                    <p className="font-medium">{selectedAlert.contactMask}</p>
                  </div>

                  {selectedAlert.reward && selectedAlert.reward > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground">Reward</p>
                      <p className="text-lg font-semibold text-green-600">
                        {selectedAlert.rewardCurrency} {selectedAlert.reward}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Views</p>
                      <p className="font-medium">{selectedAlert.viewsCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Notifications Sent</p>
                      <p className="font-medium">{selectedAlert.notificationsSent}</p>
                    </div>
                </div>

                <div className="border-t pt-4">
                  <Button
                    onClick={() => {
                      void handleArchiveAlert(selectedAlert.id);
                    }}
                    variant="outline"
                    disabled={selectedAlert.status === 'archived'}
                    className="w-full"
                  >
                      <XCircle size={18} className="mr-2" />
                      Archive Alert
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
