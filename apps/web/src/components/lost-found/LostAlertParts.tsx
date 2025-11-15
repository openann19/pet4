import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Eye, Heart, Calendar, Clock, CurrencyDollar } from '@phosphor-icons/react';
import type { LostAlert } from '@/lib/lost-found-types';
import { formatDistanceToNow } from 'date-fns';
import { haptics } from '@/lib/haptics';
import { Card } from '@/components/ui/card';
import { MotionView } from '@petspark/motion';
import { getTypographyClasses } from '@/lib/typography';

export function formatTimeAgo(iso: string): string {
    try { return formatDistanceToNow(new Date(iso), { addSuffix: true }); } catch { return ''; }
}

export interface MediaProps {
    readonly alert: LostAlert;
    readonly imageError: boolean;
    readonly setImageError: (v: boolean) => void;
    readonly isFavorited?: boolean;
    readonly onToggleFavorite?: (id: string) => void;
}

export const LostAlertFavoriteButton = memo(function LostAlertFavoriteButton({ alert, isFavorited, onToggleFavorite }: Pick<MediaProps, 'alert' | 'isFavorited' | 'onToggleFavorite'>) {
    if (!onToggleFavorite) return null;
    return (
        <Button size="icon" variant="ghost" aria-label={isFavorited ? 'Unfavorite alert' : 'Favorite alert'} className="h-8 w-8 bg-background/80 backdrop-blur-sm transition-transform hover:scale-105" onClick={(e) => { e.stopPropagation(); haptics.impact('light'); onToggleFavorite(alert.id); }}>
            <Heart size={16} weight={isFavorited ? 'fill' : 'regular'} className={isFavorited ? 'text-red-500' : ''} />
        </Button>
    );
});

export const LostAlertStatusBadges = memo(function LostAlertStatusBadges({ alert }: Pick<MediaProps, 'alert'>) {
    return (
        <>
            {alert.status === 'active' && (
                <Badge variant="destructive" className="gap-1" aria-label="Lost status"><Clock size={12} weight="fill" />Lost</Badge>
            )}
            {alert.status === 'found' && (
                <Badge variant="default" className="gap-1 bg-green-600" aria-label="Found status">Found</Badge>
            )}
        </>
    );
});

export const LostAlertRewardBadge = memo(function LostAlertRewardBadge({ alert }: Pick<MediaProps, 'alert'>) {
    if (!alert.reward) return null;
    return (
        <div className="absolute bottom-2 left-2">
            <Badge variant="secondary" className="gap-1 bg-yellow-500/90 text-yellow-950" aria-label={`Reward ${alert.reward}`}>
                <CurrencyDollar size={12} weight="fill" />Reward: ${alert.reward}
            </Badge>
        </div>
    );
});

export const LostAlertImage = memo(function LostAlertImage({ alert, imageError, setImageError }: Pick<MediaProps, 'alert' | 'imageError' | 'setImageError'>) {
    if (alert.photos && alert.photos.length > 0 && !imageError) {
        return <img src={alert.photos[0]} alt={alert.petSummary.name || 'Lost pet'} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" onError={() => setImageError(true)} />;
    }
    return (
        <div className="flex h-full w-full items-center justify-center" aria-label="No photo available"><span className="text-6xl" role="img" aria-label="paw icon">🐾</span></div>
    );
});

export const LostAlertMedia = memo(function LostAlertMedia(props: MediaProps) {
    const { alert, imageError, setImageError, isFavorited, onToggleFavorite } = props;
    return (
        <div className="relative aspect-3/4 bg-muted overflow-hidden">
            <LostAlertImage alert={alert} imageError={imageError} setImageError={setImageError} />
            <div className="absolute top-2 right-2 flex gap-2">
                <LostAlertStatusBadges alert={alert} />
                <LostAlertFavoriteButton alert={alert} isFavorited={isFavorited} onToggleFavorite={onToggleFavorite} />
            </div>
            <LostAlertRewardBadge alert={alert} />
        </div>
    );
});

export interface MetaProps { readonly alert: LostAlert; readonly timeAgo: string; readonly lastSeenTime: string; }
export const LostAlertMeta = memo(function LostAlertMeta({ alert, timeAgo, lastSeenTime }: MetaProps) {
    return (
        <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin size={16} className="mt-0.5 shrink-0" />
                <div>
                    <p>Last seen {lastSeenTime}</p>
                    {alert.lastSeen.description && (<p className="text-xs mt-0.5">{alert.lastSeen.description}</p>)}
                    {alert.lastSeen.lat && alert.lastSeen.lon && (<p className="text-xs mt-0.5">{alert.lastSeen.lat.toFixed(4)}, {alert.lastSeen.lon.toFixed(4)}</p>)}
                </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1"><Eye size={14} /><span>{alert.viewsCount} views</span></div>
                <div className="flex items-center gap-1"><Calendar size={14} /><span>{timeAgo}</span></div>
                {alert.sightingsCount > 0 && (<Badge variant="outline" className="text-xs" aria-label="Sighting count">{alert.sightingsCount} sighting{alert.sightingsCount !== 1 ? 's' : ''}</Badge>)}
            </div>
        </div>
    );
});

export interface FeaturesProps { readonly alert: LostAlert; }
export const LostAlertFeatures = memo(function LostAlertFeatures({ alert }: FeaturesProps) {
    if (!alert.petSummary.distinctiveFeatures || alert.petSummary.distinctiveFeatures.length === 0) return null;
    const features = alert.petSummary.distinctiveFeatures;
    return (
        <div className="flex flex-wrap gap-1" aria-label="Distinctive features">
            {features.slice(0, 3).map((feature) => (<Badge key={feature} variant="outline" className="text-xs">{feature}</Badge>))}
            {features.length > 3 && (<Badge variant="outline" className="text-xs">+{features.length - 3} more</Badge>)}
        </div>
    );
});

export interface ActionsProps { readonly alert: LostAlert; readonly onSelect: (a: LostAlert) => void; readonly onReportSighting?: (a: LostAlert) => void; }
export const LostAlertActions = memo(function LostAlertActions({ alert, onSelect, onReportSighting }: ActionsProps) {
    return (
        <div className="flex gap-2 pt-2" aria-label="Card actions">
            <Button variant="outline" className="flex-1" onClick={(e) => { e.stopPropagation(); haptics.selection(); onSelect(alert); }}>View Details</Button>
            {onReportSighting && alert.status === 'active' && (
                <Button variant="default" className="flex-1" onClick={(e) => { e.stopPropagation(); haptics.impact('medium'); onReportSighting(alert); }}>Report Sighting</Button>
            )}
        </div>
    );
});

export interface WrapperProps extends LostAlertCardProps { readonly handleCardClick: () => void; readonly imageError: boolean; readonly setImageError: (v: boolean) => void; readonly timeAgo: string; readonly lastSeenTime: string; }
export interface LostAlertCardProps { readonly alert: LostAlert; readonly onSelect: (alert: LostAlert) => void; readonly onReportSighting?: (alert: LostAlert) => void; readonly isFavorited?: boolean; readonly onToggleFavorite?: (alertId: string) => void; }

export const LostAlertInteractiveWrapper = memo(function LostAlertInteractiveWrapper({
    alert,
    handleCardClick,
    imageError,
    setImageError,
    isFavorited,
    onToggleFavorite,
    timeAgo,
    lastSeenTime,
    onSelect,
    onReportSighting,
}: WrapperProps) {
    return (
        <MotionView layout initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.97 }} transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }} className="group will-change-transform" onClick={handleCardClick} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCardClick(); } }} aria-label={`Lost alert for ${alert.petSummary.name}`}>
            <Card className="overflow-hidden rounded-2xl border-border/50 bg-linear-to-b from-card to-card/95 shadow-lg transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 cursor-pointer">
                <LostAlertMedia alert={alert} imageError={imageError} setImageError={setImageError} isFavorited={isFavorited} onToggleFavorite={onToggleFavorite} />
                <div className="p-4 space-y-3">
                    <div>
                        <h3 className={getTypographyClasses('h3') + ' mb-1'}>{alert.petSummary.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground" aria-label="Pet summary">
                            <span className="capitalize">{alert.petSummary.species}</span>
                            {alert.petSummary.breed && <span>• {alert.petSummary.breed}</span>}
                            {alert.petSummary.size && <span>• {String(alert.petSummary.size).toLowerCase()}</span>}
                        </div>
                    </div>
                    <LostAlertMeta alert={alert} timeAgo={timeAgo} lastSeenTime={lastSeenTime} />
                    <LostAlertFeatures alert={alert} />
                    <LostAlertActions alert={alert} onSelect={onSelect} onReportSighting={onReportSighting} />
                </div>
            </Card>
        </MotionView>
    );
});
