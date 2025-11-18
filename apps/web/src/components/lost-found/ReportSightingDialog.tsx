import { lostFoundAPI } from '@/api/lost-found-api';
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
import { Textarea } from '@/components/ui/textarea';
import { createLogger } from '@/lib/logger';
import type { LostAlert } from '@/lib/lost-found-types';
import { userService } from '@/lib/user-service';
import { Calendar, Clock, MapPin, Upload } from '@phosphor-icons/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { MapLocationPicker } from './MapLocationPicker';

interface ReportSightingDialogProps {
  open: boolean;
  alert: LostAlert | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReportSightingDialog({
  open,
  alert,
  onClose,
  onSuccess,
}: ReportSightingDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);

  const [sightingDate, setSightingDate] = useState('');
  const [sightingTime, setSightingTime] = useState('');
  const [description, setDescription] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lon: number } | null>(
    null
  );
  const [radiusM, setRadiusM] = useState(500);
  const [contactInfo, setContactInfo] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  const handleLocationSelect = (lat: number, lon: number) => {
    setSelectedLocation({ lat, lon });
    setShowMapPicker(false);
  };

  const maskContactInfo = (contact: string): string => {
    if (contact.includes('@')) {
      const [local, domain] = contact.split('@');
      if (local && domain) {
        return `${local.substring(0, 2)}***@${domain}`;
      }
    }
    if (contact.length > 4) {
      return `${contact.substring(0, 3)}***${contact.substring(contact.length - 2)}`;
    }
    return contact;
  };

  const handleSubmit = async () => {
    if (!alert) return;

    if (!sightingDate || !sightingTime || !description) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!selectedLocation) {
      toast.error('Please select a location on the map');
      return;
    }

    if (!contactInfo) {
      toast.error('Please provide contact information');
      return;
    }

    try {
      setIsSubmitting(true);

      const user = await userService.user();
      if (!user) {
        toast.error('User not authenticated');
        return;
      }
      const whenISO = new Date(`${sightingDate}T${sightingTime}`).toISOString();

      await lostFoundAPI.createSighting({
        alertId: alert.id,
        whenISO,
        lat: selectedLocation.lat,
        lon: selectedLocation.lon,
        radiusM,
        description: description.trim(),
        photos,
        contactMask: maskContactInfo(contactInfo),
        reporterId: user.id,
        reporterName: user.login || 'Anonymous',
        reporterAvatar: user.avatarUrl ?? undefined,
      });

      toast.success('Sighting reported! The owner will be notified.');
      onSuccess();
      onClose();

      // Reset form
      setSightingDate('');
      setSightingTime('');
      setDescription('');
      setSelectedLocation(null);
      setContactInfo('');
      setPhotos([]);
    } catch (error: unknown) {
      const logger = createLogger('ReportSightingDialog');
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to report sighting. Please try again.';
      logger.error(
        'Failed to report sighting',
        error instanceof Error ? error : new Error(String(error))
      );
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!alert) return null;

  return (
    <>
      <Dialog open={open && !showMapPicker} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Report Sighting</DialogTitle>
            <DialogDescription>
              Report a sighting of {alert.petSummary.name}. Your information will be shared with the
              owner.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Lost Pet: {alert.petSummary.name}</h3>
              <p className="text-sm text-muted-foreground">
                {alert.petSummary.species} • {alert.petSummary.breed || 'Unknown breed'}
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sightingDate">
                    <Calendar size={16} className="inline mr-2" />
                    Date of Sighting *
                  </Label>
                  <Input
                    id="sightingDate"
                    type="date"
                    value={sightingDate}
                    onChange={(e) => { setSightingDate(e.target.value); }}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sightingTime">
                    <Clock size={16} className="inline mr-2" />
                    Time of Sighting *
                  </Label>
                  <Input
                    id="sightingTime"
                    type="time"
                    value={sightingTime}
                    onChange={(e) => { setSightingTime(e.target.value); }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Location on Map *</Label>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => { setShowMapPicker(true); }}
                >
                  <MapPin size={16} className="mr-2" />
                  {selectedLocation ? 'Update Location' : 'Pick Location on Map'}
                </Button>
                {selectedLocation && (
                  <p className="text-xs text-muted-foreground">
                    Location: {selectedLocation.lat.toFixed(4)}, {selectedLocation.lon.toFixed(4)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="radiusM">Search Radius</Label>
                <select
                  id="radiusM"
                  value={radiusM}
                  onChange={(e) => { setRadiusM(parseInt(e.target.value)); }}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value={100}>100 m</option>
                  <option value={250}>250 m</option>
                  <option value={500}>500 m</option>
                  <option value={1000}>1 km</option>
                  <option value={2000}>2 km</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); }}
                  placeholder="Describe what you saw, the pet's condition, any distinctive features..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactInfo">Your Contact Information *</Label>
                <Input
                  id="contactInfo"
                  value={contactInfo}
                  onChange={(e) => { setContactInfo(e.target.value); }}
                  placeholder="Email or phone number"
                />
                <p className="text-xs text-muted-foreground">
                  Will be partially masked for privacy (e.g., ab***@email.com)
                </p>
              </div>

              <div className="space-y-2">
                <Label>Photos (Optional)</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <Upload size={24} className="mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Upload photos of the sighting</p>
                  <p className="text-xs text-muted-foreground mt-1">Up to 3 photos, max 5MB each</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 sticky bottom-0 bg-card pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Sighting Report'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {showMapPicker && (
        <MapLocationPicker
          onSelect={handleLocationSelect}
          onClose={() => { setShowMapPicker(false); }}
          {...(selectedLocation ? { initialLocation: selectedLocation } : {})}
        />
      )}
    </>
  );
}
