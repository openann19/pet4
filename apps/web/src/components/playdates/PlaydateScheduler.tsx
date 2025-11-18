/**
 * Playdate Scheduler
 *
 * Calendar-based scheduling for playdates
 */

'use client';

import { useState, useCallback } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/switch';
import { PremiumCard } from '@/components/enhanced/PremiumCard';
import { LocationPicker } from './LocationPicker';
import { cn } from '@/lib/utils';
import { getTypographyClasses } from '@/lib/typography';
import type { PlaydateLocation } from '@petspark/core';
import { format } from 'date-fns';

export interface PlaydateSchedulerProps {
  onSchedule: (playdate: {
    title: string;
    description?: string;
    scheduledAt: string;
    duration: number;
    location: PlaydateLocation;
    isPublic: boolean;
    maxParticipants?: number;
    trustedContactId?: string;
  }) => void;
  onCancel?: () => void;
  className?: string;
}

export function PlaydateScheduler({
  onSchedule,
  onCancel,
  className,
}: PlaydateSchedulerProps): React.JSX.Element {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<PlaydateLocation | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [maxParticipants, setMaxParticipants] = useState<number | undefined>(undefined);
  const [trustedContactId, setTrustedContactId] = useState<string | undefined>(undefined);

  const handleSchedule = useCallback(() => {
    if (!selectedDate || !selectedTime || !location || !title.trim()) {
      return;
    }

    const [hours, minutes] = selectedTime.split(':').map(Number);
    const scheduledAt = new Date(selectedDate);
    scheduledAt.setHours(hours ?? 0, minutes ?? 0, 0, 0);

    onSchedule({
      title: title.trim(),
      description: description.trim() || undefined,
      scheduledAt: scheduledAt.toISOString(),
      duration,
      location,
      isPublic,
      maxParticipants,
      trustedContactId,
    });
  }, [
    selectedDate,
    selectedTime,
    location,
    title,
    description,
    duration,
    isPublic,
    maxParticipants,
    trustedContactId,
    onSchedule,
  ]);

  const isFormValid = Boolean(
    selectedDate && selectedTime && location && title.trim()
  );

  return (
    <PremiumCard variant="glass" className={cn('p-6 space-y-6', className)}>
      <div>
        <h2 className={cn(getTypographyClasses('h2'), 'mb-2')}>Schedule Playdate</h2>
        <p className={cn(getTypographyClasses('bodyMuted'), 'text-sm')}>
          Plan a playdate with other pet owners
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="title" className={getTypographyClasses('body')}>
            Title
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Dog Park Meetup"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="description" className={getTypographyClasses('body')}>
            Description (optional)
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell others about this playdate..."
            className="mt-1"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className={getTypographyClasses('body')}>Date</Label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date: Date) => date < new Date()}
              className="mt-1"
            />
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="time" className={getTypographyClasses('body')}>
                Time
              </Label>
              <Input
                id="time"
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="duration" className={getTypographyClasses('body')}>
                Duration (minutes)
              </Label>
              <Input
                id="duration"
                type="number"
                min={15}
                max={480}
                step={15}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <div>
          <Label className={getTypographyClasses('body')}>Location</Label>
          <LocationPicker
            onLocationSelect={setLocation}
            selectedLocation={location}
            className="mt-1"
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="public" className={getTypographyClasses('body')}>
              Public meetup
            </Label>
            <Switch
              id="public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>

          {!isPublic && (
            <div>
              <Label htmlFor="maxParticipants" className={getTypographyClasses('body')}>
                Max participants (optional)
              </Label>
              <Input
                id="maxParticipants"
                type="number"
                min={2}
                value={maxParticipants ?? ''}
                onChange={(e) =>
                  setMaxParticipants(e.target.value ? Number(e.target.value) : undefined)
                }
                className="mt-1"
              />
            </div>
          )}

          <div>
            <Label htmlFor="trustedContact" className={getTypographyClasses('body')}>
              Trusted contact (optional)
            </Label>
            <Input
              id="trustedContact"
              value={trustedContactId ?? ''}
              onChange={(e) => setTrustedContactId(e.target.value || undefined)}
              placeholder="User ID to share details with"
              className="mt-1"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        )}
        <Button
          type="button"
          onClick={handleSchedule}
          disabled={!isFormValid}
          className="flex-1"
        >
          Schedule Playdate
        </Button>
      </div>
    </PremiumCard>
  );
}

