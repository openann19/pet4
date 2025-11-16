import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { haptics } from '@/lib/haptics';
import { createLogger } from '@/lib/logger';
import type {
    Playdate,
    PlaydateLocation,
    PlaydateStatus,
    PlaydateType,
} from '@/lib/playdate-types';

const logger = createLogger('PlaydateScheduler');
import type { Match, Pet } from '@/lib/types';
import {
    Calendar,
    Check,
    Clock,
    MapPin,
    MapTrifold,
    NavigationArrow,
    Park,
    PawPrint,
    Phone,
    Plus,
    ShareNetwork,
    Umbrella,
    VideoCamera,
    X,
} from '@phosphor-icons/react';
import { differenceInDays, format, isPast } from 'date-fns';
import { Presence, MotionView } from '@petspark/motion';
import { lazy, Suspense, useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useKV } from '@/hooks/use-storage';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';

const LocationPicker = lazy(() => import('./LocationPicker'));

interface PlaydateSchedulerProps {
    match: Match;
    userPet: Pet;
    onClose: () => void;
    onStartVideoCall?: () => void;
    onStartVoiceCall?: () => void;
}

export default function PlaydateScheduler({
    match,
    userPet,
    onClose,
    onStartVideoCall,
    onStartVoiceCall,
}: PlaydateSchedulerProps) {
    const [playdates, setPlaydates] = useKV<Playdate[]>('playdates', []);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showLocationPicker, setShowLocationPicker] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<PlaydateLocation | null>(null);

    const [formData, setFormData] = useState<{
        title: string;
        type: PlaydateType;
        date: string;
        startTime: string;
        endTime: string;
        description: string;
        notes: string;
    }>({
        title: 'Playdate at the Park',
        type: 'park',
        date: new Date().toISOString().split('T')[0]!,
        startTime: '10:00',
        endTime: '11:30',
        description: "Let's meet up for some fun!",
        notes: '',
    });

    // Memoize filtered playdates to avoid recalculation on every render
    const matchPlaydates = useMemo(
        () => (playdates ?? []).filter((p: Playdate) => p.matchId === match.id),
        [playdates, match.id]
    );

    const getPlaydateIcon = (type: PlaydateType) => {
        switch (type) {
            case 'park':
                return <Park size={20} weight="fill" />;
            case 'walk':
                return <Umbrella size={20} />;
            case 'playdate':
                return <PawPrint size={20} weight="fill" />;
            default:
                return <Calendar size={20} />;
        }
    };

    const getStatusColor = (status: PlaydateStatus) => {
        switch (status) {
            case 'confirmed':
                return 'text-green-600 bg-green-100 dark:bg-green-900/20';
            case 'pending':
                return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
            case 'completed':
                return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
            case 'cancelled':
                return 'text-muted-foreground bg-muted';
        }
    };

    const handleCreatePlaydate = useCallback(() => {
        if (!selectedLocation) {
            toast.error('Please select a location');
            return;
        }

        const playdateDate = formData.date ?? new Date().toISOString().split('T')[0];
        const newPlaydate: Playdate = {
            id: `playdate-${String(Date.now() ?? '')}`,
            matchId: match.id,
            petIds: [userPet.id, match.matchedPetId],
            ownerIds: [userPet.ownerId ?? 'user', match.matchedPetId],
            title: formData.title,
            type: formData.type,
            date: playdateDate,
            startTime: formData.startTime ?? '10:00',
            endTime: formData.endTime ?? '11:30',
            location: selectedLocation,
            description: formData.description,
            status: 'pending',
            createdBy: 'user',
            notes: formData.notes,
            reminderSent: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        setPlaydates((current: Playdate[] | undefined) => [...(current ?? []), newPlaydate]);
        haptics.success();
        toast.success('Playdate scheduled!', {
            description: `Invitation sent for ${format(new Date(playdateDate), 'MMM dd, yyyy')}`,
        });
        setShowCreateForm(false);
        setSelectedLocation(null);
    }, [
        selectedLocation,
        match.id,
        match.matchedPetId,
        userPet.id,
        userPet.ownerId,
        formData,
        setPlaydates,
    ]);

    const handleLocationChange = useCallback((location: PlaydateLocation) => {
        setSelectedLocation(location);
        setShowLocationPicker(false);
    }, []);

    const handleShareLocation = useCallback((playdate: Playdate) => {
        if (!playdate.location.lat || !playdate.location.lng) {
            toast.error('Location coordinates not available');
            return;
        }

        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${playdate.location.lat},${playdate.location.lng}`;

        try {
            if (navigator.share) {
                navigator
                    .share({
                        title: playdate.title,
                        text: `Meet me at ${playdate.location.name}`,
                        url: mapsUrl,
                    })
                    .then(() => {
                        toast.success('Location shared!');
                        haptics.success();
                    })
                    .catch((error) => {
                        // User cancelled or share failed
                        if (error instanceof Error && error.name !== 'AbortError') {
                            const err = error instanceof Error ? error : new Error(String(error));
                            logger.error('PlaydateScheduler shareLocation error', err, {
                                playdateId: playdate.id,
                            });
                            toast.error('Failed to share location. Please try again.');
                        }
                    });
            } else {
                navigator.clipboard
                    .writeText(mapsUrl)
                    .then(() => {
                        toast.success('Location link copied to clipboard!');
                        haptics.success();
                    })
                    .catch((error) => {
                        const err = error instanceof Error ? error : new Error(String(error));
                        logger.error('PlaydateScheduler copyToClipboard error', err, {
                            playdateId: playdate.id,
                        });
                        toast.error('Failed to copy location link. Please try again.');
                    });
            }
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger.error('PlaydateScheduler shareLocation sync error', err, {
                playdateId: playdate.id,
            });
            toast.error('Failed to share location. Please try again.');
        }
    }, []);

    const handleGetDirections = useCallback((playdate: Playdate) => {
        if (!playdate.location.lat || !playdate.location.lng) {
            toast.info('Opening location in maps...');
            const searchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                playdate.location.address
            )}`;
            window.open(searchUrl, '_blank');
            return;
        }

        const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${playdate.location.lat},${playdate.location.lng}`;
        window.open(directionsUrl, '_blank');
        haptics.success();
    }, []);

    const handleConfirmPlaydate = useCallback(
        (playdateId: string) => {
            setPlaydates((current: Playdate[] | undefined) =>
                (current ?? []).map((p: Playdate) =>
                    p.id === playdateId
                        ? { ...p, status: 'confirmed' as PlaydateStatus, updatedAt: new Date().toISOString() }
                        : p
                )
            );
            haptics.success();
            toast.success('Playdate confirmed!', { description: 'Both parties have confirmed' });
        },
        [setPlaydates]
    );

    const handleCancelPlaydate = useCallback(
        (playdateId: string) => {
            setPlaydates((current: Playdate[] | undefined) =>
                (current ?? []).map((p: Playdate) =>
                    p.id === playdateId
                        ? { ...p, status: 'cancelled' as PlaydateStatus, updatedAt: new Date().toISOString() }
                        : p
                )
            );
            haptics.light();
            toast.info('Playdate cancelled', { description: 'The other party has been notified' });
        },
        [setPlaydates]
    );

    return (
        <MotionView
            className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 overflow-auto"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
        >
            <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-linear-to-br from-primary to-accent flex items-center justify-center">
                            <Calendar size={24} className="text-white" weight="fill" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Playdate Scheduler</h1>
                            <p className="text-sm text-muted-foreground">
                                Coordinate meetups with {match.matchedPetName}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {onStartVideoCall && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onStartVideoCall}
                                className="hover:bg-primary/10"
                                aria-label="Start video call"
                                title="Start video call"
                            >
                                <VideoCamera size={22} weight="fill" className="text-primary" />
                            </Button>
                        )}
                        {onStartVoiceCall && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onStartVoiceCall}
                                className="hover:bg-primary/10"
                                aria-label="Start voice call"
                                title="Start voice call"
                            >
                                <Phone size={22} weight="fill" className="text-primary" />
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            aria-label="Close playdate scheduler"
                            title="Close"
                        >
                            <X size={24} />
                        </Button>
                    </div>
                </div>

                <Tabs defaultValue="upcoming" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                        <TabsTrigger value="history">History</TabsTrigger>
                    </TabsList>

                    <TabsContent value="upcoming" className="mt-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Scheduled Playdates</CardTitle>
                                        <CardDescription>Your upcoming meetups</CardDescription>
                                    </div>
                                    <Button onClick={() => { setShowCreateForm(true); }} size="sm">
                                        <Plus size={16} className="mr-2" />
                                        Schedule Playdate
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-125">
                                    <Presence visible={showCreateForm}>
                                        {showCreateForm && (
                                            <MotionView
                                                initial={{ opacity: 0, y: -6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -6 }}
                                                className="mb-6 p-4 rounded-lg border bg-card/50"
                                            >
                                                <h3 className="text-lg font-semibold mb-4">Create Playdate</h3>
                                                <div className="space-y-4">
                                                    <div>
                                                        <Label htmlFor="title">Title</Label>
                                                        <Input
                                                            id="title"
                                                            value={formData.title}
                                                            onChange={(e) =>
                                                                setFormData((prev) => ({ ...prev, title: e.target.value }))
                                                            }
                                                            placeholder="Playdate at the Park"
                                                        />
                                                    </div>

                                                    <div>
                                                        <Label htmlFor="type">Type</Label>
                                                        <Select
                                                            value={formData.type}
                                                            onValueChange={(value) =>
                                                                setFormData((prev) => ({ ...prev, type: value as PlaydateType }))
                                                            }
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="park">Park Visit</SelectItem>
                                                                <SelectItem value="walk">Walk Together</SelectItem>
                                                                <SelectItem value="playdate">General Playdate</SelectItem>
                                                                <SelectItem value="training">Training Session</SelectItem>
                                                                <SelectItem value="event">Pet Event</SelectItem>
                                                                <SelectItem value="other">Other</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                        <div>
                                                            <Label htmlFor="date">Date</Label>
                                                            <Input
                                                                id="date"
                                                                type="date"
                                                                value={formData.date}
                                                                onChange={(e) =>
                                                                    setFormData((prev) => ({ ...prev, date: e.target.value }))
                                                                }
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="startTime">Start Time</Label>
                                                            <Input
                                                                id="startTime"
                                                                type="time"
                                                                value={formData.startTime}
                                                                onChange={(e) =>
                                                                    setFormData((prev) => ({ ...prev, startTime: e.target.value }))
                                                                }
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="endTime">End Time</Label>
                                                            <Input
                                                                id="endTime"
                                                                type="time"
                                                                value={formData.endTime}
                                                                onChange={(e) =>
                                                                    setFormData((prev) => ({ ...prev, endTime: e.target.value }))
                                                                }
                                                            />
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <Label>Location</Label>
                                                        {selectedLocation ? (
                                                            <Card className="p-3 bg-accent/5 border-primary/20">
                                                                <div className="flex items-start justify-between">
                                                                    <div className="flex items-start gap-2">
                                                                        <MapPin
                                                                            size={18}
                                                                            className="text-primary mt-0.5"
                                                                            weight="fill"
                                                                        />
                                                                        <div>
                                                                            <p className="font-medium text-sm">{selectedLocation.name}</p>
                                                                            <p className="text-xs text-muted-foreground">
                                                                                {selectedLocation.address}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => { setShowLocationPicker(true); }}
                                                                    >
                                                                        Change
                                                                    </Button>
                                                                </div>
                                                            </Card>
                                                        ) : (
                                                            <Button
                                                                variant="outline"
                                                                className="w-full justify-start"
                                                                onClick={() => { setShowLocationPicker(true); }}
                                                            >
                                                                <MapTrifold size={18} className="mr-2" />
                                                                Choose Location
                                                            </Button>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <Label htmlFor="description">Description</Label>
                                                        <Textarea
                                                            id="description"
                                                            value={formData.description}
                                                            onChange={(e) =>
                                                                setFormData((prev) => ({ ...prev, description: e.target.value }))
                                                            }
                                                            placeholder="Let's meet up for some fun!"
                                                            rows={3}
                                                        />
                                                    </div>

                                                    <div className="flex gap-2">
                                                        <Button onClick={handleCreatePlaydate} className="flex-1">
                                                            <Check size={16} className="mr-2" />
                                                            Schedule Playdate
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => { setShowCreateForm(false); }}
                                                            className="flex-1"
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                </div>
                                            </MotionView>
                                        )}
                                    </Presence>

                                    {matchPlaydates.filter(
                                        (p) => p.status !== 'completed' && p.status !== 'cancelled'
                                    ).length === 0 ? (
                                        <div className="text-center py-12">
                                            <Calendar size={48} className="mx-auto text-muted-foreground mb-3" />
                                            <p className="text-muted-foreground">No upcoming playdates</p>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Schedule one to meet up!
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {matchPlaydates
                                                .filter((p) => p.status !== 'completed' && p.status !== 'cancelled')
                                                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                                .map((playdate, index) => {
                                                    const daysUntil = differenceInDays(new Date(playdate.date), new Date());
                                                    const isPastDate = isPast(new Date(playdate.date));

                                                    return (
                                                        <MotionView
                                                            key={playdate.id}
                                                            className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                                                            initial={{ opacity: 0, y: 12 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{
                                                                delay: index * 0.05,
                                                                type: 'spring',
                                                                stiffness: 120,
                                                                damping: 18,
                                                            }}
                                                        >
                                                            <div className="flex items-start justify-between mb-3">
                                                                <div className="flex items-start gap-3">
                                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                                        {getPlaydateIcon(playdate.type)}
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="font-semibold">{playdate.title}</h4>
                                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                                                            <Calendar size={14} />
                                                                            {format(new Date(playdate.date), 'EEE, MMM dd, yyyy')}
                                                                            {!isPastDate &&
                                                                                (daysUntil === 0
                                                                                    ? ' • Today!'
                                                                                    : daysUntil === 1
                                                                                        ? ' • Tomorrow'
                                                                                        : ` • ${daysUntil} days away`)}
                                                                        </div>
                                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                            <Clock size={14} />
                                                                            {playdate.startTime} - {playdate.endTime}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <Badge className={getStatusColor(playdate.status)}>
                                                                    {playdate.status}
                                                                </Badge>
                                                            </div>

                                                            <div className="flex items-start gap-2 text-sm mb-3">
                                                                <MapPin
                                                                    size={16}
                                                                    className="text-muted-foreground mt-0.5 shrink-0"
                                                                />
                                                                <div>
                                                                    <p className="font-medium">{playdate.location.name}</p>
                                                                    <p className="text-muted-foreground">
                                                                        {playdate.location.address}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {playdate.description && (
                                                                <p className="text-sm text-muted-foreground mb-3">
                                                                    {playdate.description}
                                                                </p>
                                                            )}

                                                            <div className="flex flex-col gap-2">
                                                                <div className="flex gap-2">
                                                                    {playdate.status === 'pending' && (
                                                                        <Button
                                                                            size="sm"
                                                                            onClick={() => { handleConfirmPlaydate(playdate.id); }}
                                                                            className="flex-1"
                                                                        >
                                                                            <Check size={16} className="mr-2" />
                                                                            Confirm
                                                                        </Button>
                                                                    )}
                                                                    {playdate.status !== 'cancelled' && (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            onClick={() => { handleCancelPlaydate(playdate.id); }}
                                                                            className="flex-1"
                                                                        >
                                                                            <X size={16} className="mr-2" />
                                                                            Cancel
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        size="sm"
                                                                        variant="secondary"
                                                                        onClick={() => { handleGetDirections(playdate); }}
                                                                        className="flex-1"
                                                                    >
                                                                        <NavigationArrow size={16} className="mr-2" weight="bold" />
                                                                        Directions
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="secondary"
                                                                        onClick={() => { handleShareLocation(playdate); }}
                                                                        className="flex-1"
                                                                    >
                                                                        <ShareNetwork size={16} className="mr-2" weight="bold" />
                                                                        Share
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </MotionView>
                                                    );
                                                })}
                                        </div>
                                    )}
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="history" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Past Playdates</CardTitle>
                                <CardDescription>Your meetup history</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-125">
                                    {matchPlaydates.filter(
                                        (p) => p.status === 'completed' || p.status === 'cancelled'
                                    ).length === 0 ? (
                                        <div className="text-center py-12">
                                            <Calendar size={48} className="mx-auto text-muted-foreground mb-3" />
                                            <p className="text-muted-foreground">No past playdates</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {matchPlaydates
                                                .filter((p) => p.status === 'completed' || p.status === 'cancelled')
                                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                                .map((playdate, index) => (
                                                    <MotionView
                                                        key={playdate.id}
                                                        className="p-4 rounded-lg border bg-card opacity-75"
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 0.9, y: 0 }}
                                                        transition={{
                                                            delay: index * 0.04,
                                                            type: 'spring',
                                                            stiffness: 110,
                                                            damping: 16,
                                                        }}
                                                    >
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div className="flex items-start gap-3">
                                                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                                                                    {getPlaydateIcon(playdate.type)}
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-semibold">{playdate.title}</h4>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        {format(new Date(playdate.date), 'MMM dd, yyyy')} •{' '}
                                                                        {playdate.startTime}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <Badge className={getStatusColor(playdate.status)}>
                                                                {playdate.status}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <MapPin size={14} />
                                                            {playdate.location.name}
                                                        </div>
                                                    </MotionView>
                                                ))}
                                        </div>
                                    )}
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {showLocationPicker && (
                <ErrorBoundary
                    fallback={
                        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
                            <Card className="p-6">
                                <div className="text-center">
                                    <p className="text-destructive mb-2">Failed to load location picker</p>
                                    <Button onClick={() => { setShowLocationPicker(false); }}>Close</Button>
                                </div>
                            </Card>
                        </div>
                    }
                >
                    <Suspense
                        fallback={
                            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
                                <div className="text-center">
                                    <MotionView
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                        className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"
                                    />
                                    <p className="text-muted-foreground">Loading map...</p>
                                </div>
                            </div>
                        }
                    >
                        <LocationPicker
                            {...(selectedLocation !== null ? { value: selectedLocation } : {})}
                            onChange={handleLocationChange}
                            onClose={() => { setShowLocationPicker(false); }}
                        />
                    </Suspense>
                </ErrorBoundary>
            )}
        </MotionView>
    );
}
