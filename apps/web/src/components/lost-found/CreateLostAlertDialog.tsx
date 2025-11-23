'use client';;
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSharedValue, withTiming, MotionView } from '@petspark/motion';
import { useStaggeredItem } from '@/effects/reanimated/use-staggered-item';
import { useBounceOnTap } from '@/effects/reanimated/use-bounce-on-tap';
import { timingConfigs } from '@/effects/reanimated/transitions';
import { lostFoundAPI } from '@/api/lost-found-api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { createLogger } from '@/lib/logger';
import type { LastSeenLocation, PetSummary } from '@/lib/lost-found-types';
import { CurrencyDollar, MapPin, Plus, Upload, X } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { MapLocationPicker } from './MapLocationPicker';

const logger = createLogger('CreateLostAlertDialog');

export interface CreateLostAlertDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FeatureBadgeProps {
  feature: string;
  index: number;
  onRemove: (index: number) => void;
}

function FeatureBadge({ feature, index, onRemove }: FeatureBadgeProps): JSX.Element {
  const staggeredAnimation = useStaggeredItem({
    index,
    staggerDelay: 30,
  });

  const removeButtonAnimation = useBounceOnTap({
    onPress: (): void => onRemove(index),
    hapticFeedback: true,
  });

  return (
    <MotionView style={staggeredAnimation.itemStyle}>
      <Badge variant="secondary" className="gap-1">
        {feature}
        <MotionView style={removeButtonAnimation.animatedStyle}>
          <button onClick={removeButtonAnimation.handlePress} type="button" className="focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-(--color-focus-ring)" aria-label="Button">
            <X size={12} />
          </button>
        </MotionView>
      </Badge>
    </MotionView>
  );
}

export function CreateLostAlertDialog({
  open,
  onClose,
  onSuccess,
}: CreateLostAlertDialogProps): JSX.Element {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showMapPicker, setShowMapPicker] = useState<boolean>(false);

  const [petName, setPetName] = useState<string>('');
  const [species, setSpecies] = useState<'dog' | 'cat' | 'other'>('dog');
  const [breed, setBreed] = useState<string>('');
  const [color, setColor] = useState<string>('');
  const [size, setSize] = useState<'tiny' | 'small' | 'medium' | 'large' | 'extra-large'>('medium');
  const [distinctiveFeatures, setDistinctiveFeatures] = useState<string[]>([]);
  const [featureInput, setFeatureInput] = useState<string>('');
  const [microchipId, setMicrochipId] = useState<string>('');

  const [lastSeenDate, setLastSeenDate] = useState<string>('');
  const [lastSeenTime, setLastSeenTime] = useState<string>('');
  const [locationDescription, setLocationDescription] = useState<string>('');
  const [landmarks, setLandmarks] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lon: number } | null>(
    null
  );
  const [radiusM, setRadiusM] = useState<number>(5000);

  const [reward, setReward] = useState<number | undefined>();
  const [contactInfo, setContactInfo] = useState<string>('');
  const [photos] = useState<string[]>([]);

  const handleAddFeature = useCallback((): void => {
    if (featureInput.trim()) {
      setDistinctiveFeatures((prev): string[] => [...prev, featureInput.trim()]);
      setFeatureInput('');
    }
  }, [featureInput]);

  const removeFeature = useCallback((index: number): void => {
    setDistinctiveFeatures((prev): string[] => prev.filter((_, i): boolean => i !== index));
  }, []);

  const handleLocationSelect = useCallback((lat: number, lon: number): void => {
    setSelectedLocation({ lat, lon });
    setShowMapPicker(false);
  }, []);

  const maskContactInfo = useCallback((contact: string): string => {
    if (contact.includes('@')) {
      const parts = contact.split('@');
      const local = parts[0];
      const domain = parts[1];
      if (local && domain) {
        return `${local.substring(0, 2)}***@${domain}`;
      }
    }
    if (contact.length > 4) {
      return `${contact.substring(0, 3)}***${contact.substring(contact.length - 2)}`;
    }
    return contact;
  }, []);

  const isFormValid = useMemo((): boolean => {
    return Boolean(petName && species && lastSeenDate && lastSeenTime && contactInfo);
  }, [petName, species, lastSeenDate, lastSeenTime, contactInfo]);

  const addFeatureButtonAnimation = useBounceOnTap({
    onPress: handleAddFeature,
    hapticFeedback: true,
  });

  const mapPickerButtonAnimation = useBounceOnTap({
    onPress: (): void => setShowMapPicker(true),
    hapticFeedback: true,
  });

  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (open) {
      backdropOpacity.value = withTiming(1, timingConfigs.smooth);
    } else {
      backdropOpacity.value = withTiming(0, timingConfigs.smooth);
    }
  }, [open, backdropOpacity]);

  const handleSubmit = useCallback(async (): Promise<void> => {
    if (!isFormValid) {
      void toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);

      const { userService } = await import('@/lib/user-service');
      const user = await userService.user();
      if (!user) {
        void toast.error('Please log in to create a lost alert');
        return;
      }

      const whenISO = new Date(`${lastSeenDate}T${lastSeenTime}`).toISOString();

      const petSummary: PetSummary = {
        name: petName,
        species,
        size,
      };
      if (breed) petSummary.breed = breed;
      if (color) petSummary.color = color;
      if (distinctiveFeatures.length > 0) petSummary.distinctiveFeatures = distinctiveFeatures;
      if (microchipId) petSummary.microchipId = microchipId;

      const lastSeen: LastSeenLocation = {
        whenISO,
        radiusM,
      };
      if (selectedLocation?.lat !== undefined) lastSeen.lat = selectedLocation.lat;
      if (selectedLocation?.lon !== undefined) lastSeen.lon = selectedLocation.lon;
      if (locationDescription) lastSeen.description = locationDescription;
      if (landmarks) lastSeen.landmarks = [landmarks];

      await lostFoundAPI.createAlert({
        ownerId: user.id,
        ownerName: (typeof user.name === 'string' ? user.name : undefined) ?? 'Unknown',
        ...(user.avatarUrl ? { ownerAvatar: user.avatarUrl } : {}),
        petSummary,
        lastSeen,
        ...(reward !== undefined && reward !== null ? { reward } : {}),
        contactMask: maskContactInfo(contactInfo),
        photos,
        ...(locationDescription ? { description: locationDescription } : {}),
      });

      void toast.success('Lost pet alert created successfully!');
      logger.info('Lost alert created', { petName, species, userId: user.id });
      onSuccess();
      onClose();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to create lost alert', err, { petName, species });
      void toast.error('Failed to create alert. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isFormValid,
    lastSeenDate,
    lastSeenTime,
    petName,
    species,
    breed,
    color,
    size,
    distinctiveFeatures,
    microchipId,
    selectedLocation,
    radiusM,
    locationDescription,
    landmarks,
    reward,
    contactInfo,
    photos,
    maskContactInfo,
    onSuccess,
    onClose,
  ]);

  const submitButtonAnimation = useBounceOnTap({
    onPress: () => void handleSubmit(),
    hapticFeedback: true,
  });

  return (
    <>
      <Dialog open={open && !showMapPicker} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Report Lost Pet</DialogTitle>
            <DialogDescription>
              Help us help you find your pet. The more details, the better.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Pet Information</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="petName">Pet Name *</Label>
                  <Input
                    id="petName"
                    value={petName}
                    onChange={(e): void => setPetName(e.target.value)}
                    placeholder="e.g., Max"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="species">Species *</Label>
                  <Select
                    value={species}
                    onValueChange={(v): void => setSpecies(v as typeof species)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dog">Dog</SelectItem>
                      <SelectItem value="cat">Cat</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="breed">Breed</Label>
                  <Input
                    id="breed"
                    value={breed}
                    onChange={(e): void => setBreed(e.target.value)}
                    placeholder="e.g., Golden Retriever"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    value={color}
                    onChange={(e): void => setColor(e.target.value)}
                    placeholder="e.g., Golden"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="size">Size</Label>
                <Select value={size} onValueChange={(v): void => setSize(v as typeof size)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tiny">Tiny (0-5 lbs)</SelectItem>
                    <SelectItem value="small">Small (6-20 lbs)</SelectItem>
                    <SelectItem value="medium">Medium (21-50 lbs)</SelectItem>
                    <SelectItem value="large">Large (51-100 lbs)</SelectItem>
                    <SelectItem value="extra-large">Extra Large (100+ lbs)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Distinctive Features</Label>
                <div className="flex gap-2">
                  <Input
                    value={featureInput}
                    onChange={(e): void => setFeatureInput(e.target.value)}
                    onKeyPress={(e): void => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                    placeholder="e.g., White spot on chest"
                  />
                  <MotionView style={addFeatureButtonAnimation.animatedStyle}>
                    <Button
                      type="button"
                      onClick={addFeatureButtonAnimation.handlePress}
                      size="icon"
                    >
                      <Plus size={16} />
                    </Button>
                  </MotionView>
                </div>
                {distinctiveFeatures.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {distinctiveFeatures.map((feature, index) => (
                      <FeatureBadge
                        key={index}
                        feature={feature}
                        index={index}
                        onRemove={removeFeature}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="microchipId">Microchip ID (if applicable)</Label>
                <Input
                  id="microchipId"
                  value={microchipId}
                  onChange={(e): void => setMicrochipId(e.target.value)}
                  placeholder="15-digit microchip number"
                />
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold text-sm">Last Seen Information</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lastSeenDate">Date *</Label>
                  <Input
                    id="lastSeenDate"
                    type="date"
                    value={lastSeenDate}
                    onChange={(e): void => setLastSeenDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastSeenTime">Time *</Label>
                  <Input
                    id="lastSeenTime"
                    type="time"
                    value={lastSeenTime}
                    onChange={(e): void => setLastSeenTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Location on Map</Label>
                <MotionView style={mapPickerButtonAnimation.animatedStyle}>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={mapPickerButtonAnimation.handlePress}
                  >
                    <MapPin size={16} className="mr-2" />
                    {selectedLocation ? 'Update Location' : 'Pick Location on Map'}
                  </Button>
                </MotionView>
                {selectedLocation && (
                  <p className="text-xs text-muted-foreground">
                    Location set: {selectedLocation.lat.toFixed(4)},{' '}
                    {selectedLocation.lon.toFixed(4)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="radiusM">Search Radius</Label>
                <Select
                  value={radiusM.toString()}
                  onValueChange={(v): void => setRadiusM(parseInt(v, 10))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1000">1 km</SelectItem>
                    <SelectItem value="2000">2 km</SelectItem>
                    <SelectItem value="5000">5 km</SelectItem>
                    <SelectItem value="10000">10 km</SelectItem>
                    <SelectItem value="20000">20 km</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="locationDescription">Location Description</Label>
                <Textarea
                  id="locationDescription"
                  value={locationDescription}
                  onChange={(e): void => setLocationDescription(e.target.value)}
                  placeholder="e.g., Near Central Park, by the main entrance"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="landmarks">Nearby Landmarks</Label>
                <Input
                  id="landmarks"
                  value={landmarks}
                  onChange={(e): void => setLandmarks(e.target.value)}
                  placeholder="e.g., Coffee shop on the corner"
                />
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold text-sm">Contact & Reward</h3>

              <div className="space-y-2">
                <Label htmlFor="contactInfo">Contact Information *</Label>
                <Input
                  id="contactInfo"
                  value={contactInfo}
                  onChange={(e): void => setContactInfo(e.target.value)}
                  placeholder="Email or phone number"
                />
                <p className="text-xs text-muted-foreground">
                  Will be partially masked for privacy (e.g., ab***@email.com)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reward">Reward Amount (Optional)</Label>
                <div className="flex gap-2">
                  <div className="shrink-0 bg-muted rounded-md px-3 flex items-center">
                    <CurrencyDollar size={18} className="text-muted-foreground" />
                  </div>
                  <Input
                    id="reward"
                    type="number"
                    min="0"
                    value={reward ?? ''}
                    onChange={(e): void => setReward(parseFloat(e.target.value) || undefined)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Photos</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <Upload size={24} className="mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Upload photos of your pet</p>
                  <p className="text-xs text-muted-foreground mt-1">Up to 5 photos, max 5MB each</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 sticky bottom-0 bg-card pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <MotionView style={submitButtonAnimation.animatedStyle}>
              <Button
                onClick={submitButtonAnimation.handlePress}
                disabled={isSubmitting || !isFormValid}
              >
                {isSubmitting ? 'Creating Alert...' : 'Create Alert'}
              </Button>
            </MotionView>
          </div>
        </DialogContent>
      </Dialog>
      {showMapPicker && (
        <MapLocationPicker
          onSelect={handleLocationSelect}
          onClose={(): void => { setShowMapPicker(false); }}
          {...(selectedLocation ? { initialLocation: selectedLocation } : {})}
        />
      )}
    </>
  );
}
