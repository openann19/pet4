import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Eye, Heart, Calendar, Clock, CurrencyDollar } from '@phosphor-icons/react';
import type { LostAlert } from '@/lib/lost-found-types';
import { formatDistanceToNow } from 'date-fns';

interface LostAlertCardProps {
  alert: LostAlert;
  onSelect: (alert: LostAlert) => void;
  onReportSighting?: (alert: LostAlert) => void;
  isFavorited?: boolean;
  onToggleFavorite?: (alertId: string) => void;
}

export function LostAlertCard({
  alert,
  onSelect,
  onReportSighting,
  isFavorited = false,
  onToggleFavorite,
}: LostAlertCardProps) {
  const [imageError, setImageError] = useState(false);

  const timeAgo = formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true });
  const lastSeenTime = formatDistanceToNow(new Date(alert.lastSeen.whenISO), { addSuffix: true });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
        <div className="relative aspect-[4/3] bg-muted">
          {alert.photos && alert.photos.length > 0 && !imageError ? (
            <img
              src={alert.photos[0]}
              alt={alert.petSummary.name}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-6xl">🐾</div>
            </div>
          )}

          <div className="absolute top-2 right-2 flex gap-2">
            {alert.status === 'active' && (
              <Badge variant="destructive" className="gap-1">
                <Clock size={12} weight="fill" />
                Lost
              </Badge>
            )}
            {alert.status === 'found' && (
              <Badge variant="default" className="gap-1 bg-green-600">
                Found
              </Badge>
            )}
            {onToggleFavorite && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 bg-background/80 backdrop-blur-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(alert.id);
                }}
              >
                <Heart
                  size={16}
                  weight={isFavorited ? 'fill' : 'regular'}
                  className={isFavorited ? 'text-red-500' : ''}
                />
              </Button>
            )}
          </div>

          {alert.reward && (
            <div className="absolute bottom-2 left-2">
              <Badge variant="secondary" className="gap-1 bg-yellow-500/90 text-yellow-950">
                <CurrencyDollar size={12} weight="fill" />
                Reward: ${alert.reward}
              </Badge>
            </div>
          )}
        </div>

        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-lg mb-1">{alert.petSummary.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="capitalize">{alert.petSummary.species}</span>
              {alert.petSummary.breed && (
                <>
                  <span>•</span>
                  <span>{alert.petSummary.breed}</span>
                </>
              )}
              {alert.petSummary.size && (
                <>
                  <span>•</span>
                  <span className="capitalize">{alert.petSummary.size}</span>
                </>
              )}
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2 text-muted-foreground">
              <MapPin size={16} className="mt-0.5 shrink-0" />
              <div>
                <p>Last seen {lastSeenTime}</p>
                {alert.lastSeen.description && (
                  <p className="text-xs mt-0.5">{alert.lastSeen.description}</p>
                )}
                {alert.lastSeen.lat && alert.lastSeen.lon && (
                  <p className="text-xs mt-0.5">
                    {alert.lastSeen.lat.toFixed(4)}, {alert.lastSeen.lon.toFixed(4)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Eye size={14} />
                <span>{alert.viewsCount} views</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                <span>{timeAgo}</span>
              </div>
              {alert.sightingsCount > 0 && (
                <Badge variant="outline" className="text-xs">
                  {alert.sightingsCount} sighting{alert.sightingsCount !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>

          {alert.petSummary.distinctiveFeatures &&
            alert.petSummary.distinctiveFeatures.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {alert.petSummary.distinctiveFeatures.slice(0, 3).map((feature, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {feature}
                  </Badge>
                ))}
                {alert.petSummary.distinctiveFeatures.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{alert.petSummary.distinctiveFeatures.length - 3} more
                  </Badge>
                )}
              </div>
            )}

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(alert);
              }}
            >
              View Details
            </Button>
            {onReportSighting && alert.status === 'active' && (
              <Button
                variant="default"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onReportSighting(alert);
                }}
              >
                Report Sighting
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
